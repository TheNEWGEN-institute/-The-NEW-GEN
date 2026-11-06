-- =====================================================================
-- The NEW GEN — สถิติผู้เข้าชมเว็บไซต์ (นับเอง ไม่ใช้บริการภายนอก)
-- Run in Supabase → SQL Editor (after 14). Safe to run more than once.
--
-- What is stored per event (no IP, no name, no phone, nothing personal):
--   random visitor id kept in the visitor's browser, page name, course id,
--   where they came from (LINE / Facebook / Google / ...), mobile/tablet/desktop
-- Security:
--   • the public can only ADD an event through track_event() — values are
--     checked, unknown course ids are dropped, each visitor max 300 events/day,
--     the whole site max 50,000 events/day (spam can't fill the database)
--   • only ADMIN can read the numbers (admin_site_stats)
--   • events older than ~400 days are removed automatically
-- =====================================================================

create table if not exists public.site_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  day        date not null default ((now() at time zone 'Asia/Bangkok')::date),
  hour       smallint not null default (extract(hour from (now() at time zone 'Asia/Bangkok'))::smallint),
  visitor    text not null,
  kind       text not null check (kind in ('view', 'course', 'form_open', 'line_click')),
  page       text not null default '',
  course_id  text,
  source     text not null default 'direct',
  device     text not null default 'desktop',
  is_new     boolean not null default false
);
create index if not exists site_events_day_visitor_idx on public.site_events (day, visitor);
create index if not exists site_events_created_idx on public.site_events (created_at);

create table if not exists public.site_event_counts (
  day date primary key,
  n   int not null default 0
);

do $$
declare t text;
begin
  foreach t in array array['site_events', 'site_event_counts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin full access %s" on public.%I', t, t);
    execute format('create policy "admin full access %s" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Public: record one event. Never raises an error (stats must not break the site)
-- p = { v: visitor id, k: kind, p: page, c: course id, s: source, d: device, n: first visit }
-- ---------------------------------------------------------------------
create or replace function public.track_event(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today  date := (now() at time zone 'Asia/Bangkok')::date;
  v_vis    text := p ->> 'v';
  v_kind   text := p ->> 'k';
  v_page   text := lower(coalesce(p ->> 'p', ''));
  v_course text := nullif(p ->> 'c', '');
  v_source text := lower(coalesce(p ->> 's', 'direct'));
  v_device text := lower(coalesce(p ->> 'd', 'desktop'));
  v_n      int;
begin
  if jsonb_typeof(p) <> 'object' or octet_length(p::text) > 1000 then return; end if;
  if v_vis is null or v_vis !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  if v_kind is null or v_kind not in ('view', 'course', 'form_open', 'line_click') then return; end if;
  if v_page !~ '^[a-z0-9-]{0,40}$' then v_page := 'other'; end if;
  if v_source not in ('direct', 'line', 'facebook', 'instagram', 'google', 'tiktok', 'youtube', 'search', 'other') then v_source := 'other'; end if;
  if v_device not in ('mobile', 'tablet', 'desktop') then v_device := 'desktop'; end if;
  -- only real course / bundle ids
  if v_course is not null and not exists (
    select 1 from public.app_data a
    cross join lateral jsonb_array_elements(case when jsonb_typeof(a.data) = 'array' then a.data else '[]'::jsonb end) c
    where a.key in ('courses', 'bundles') and c ->> 'id' = v_course
  ) then
    v_course := null;
  end if;
  if v_kind in ('course', 'form_open') and v_course is null then return; end if;

  insert into public.site_event_counts (day, n) values (v_today, 1)
  on conflict (day) do update set n = public.site_event_counts.n + 1
  returning n into v_n;
  if v_n > 50000 then return; end if;
  if (select count(*) from public.site_events where day = v_today and visitor = v_vis) >= 300 then return; end if;

  insert into public.site_events (visitor, kind, page, course_id, source, device, is_new)
  values (v_vis, v_kind, v_page, v_course, v_source, v_device, coalesce((p ->> 'n')::boolean, false) and v_kind = 'view');

  -- keep the table small: now and then remove events older than ~400 days
  if random() < 0.002 then
    delete from public.site_events where day < v_today - 400;
    delete from public.site_event_counts where day < v_today - 400;
  end if;
exception when others then
  return;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: all numbers for the last p_days days (Bangkok dates)
-- ---------------------------------------------------------------------
create or replace function public.admin_site_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  n      int := greatest(1, least(coalesce(p_days, 30), 400));
  d_to   date := (now() at time zone 'Asia/Bangkok')::date;
  d_from date := d_to - n + 1;
  p_from date := d_from - n;
  r      jsonb;
begin
  if not public.is_admin() then raise exception 'NO_ACCESS'; end if;

  with ev as (
    select * from public.site_events where day between p_from and d_to
  ),
  cur as (select * from ev where day >= d_from),
  prev as (select * from ev where day < d_from),
  enr as (
    select (e.created_at at time zone 'Asia/Bangkok')::date as day, e.course_id
    from public.enrollments e
    where e.created_at >= (p_from::timestamp at time zone 'Asia/Bangkok')
      and coalesce(e.data ->> 'isFromBundle', 'false') <> 'true'
  )
  select jsonb_build_object(
    'from', d_from, 'to', d_to, 'days', n,
    'live', (select count(distinct visitor) from public.site_events where day >= d_to - 1 and created_at > now() - interval '5 minutes'),
    -- yesterday up to the same time of day (fair comparison for "today so far")
    'yesterdaySoFar', (
      select jsonb_build_object(
               'visitors', count(distinct visitor) filter (where kind = 'view'),
               'views', count(*) filter (where kind = 'view'),
               'formOpeners', count(distinct visitor) filter (where kind = 'form_open'),
               'lineClicks', count(*) filter (where kind = 'line_click'),
               'enrollments', (select count(*) from public.enrollments e
                               where e.created_at >= ((d_to - 1)::timestamp at time zone 'Asia/Bangkok')
                                 and e.created_at <= now() - interval '1 day'
                                 and coalesce(e.data ->> 'isFromBundle', 'false') <> 'true'))
      from public.site_events where day = d_to - 1 and created_at <= now() - interval '1 day'),
    'totals', jsonb_build_object(
      'visitors', (select count(distinct visitor) from cur where kind = 'view'),
      'newVisitors', (select count(distinct visitor) from cur where kind = 'view' and is_new),
      'views', (select count(*) from cur where kind = 'view'),
      'courseViewers', (select count(distinct visitor) from cur where course_id is not null and kind in ('view', 'course')),
      'formOpeners', (select count(distinct visitor) from cur where kind = 'form_open'),
      'lineClicks', (select count(*) from cur where kind = 'line_click'),
      'enrollments', (select count(*) from enr where day >= d_from)),
    'prevTotals', jsonb_build_object(
      'visitors', (select count(distinct visitor) from prev where kind = 'view'),
      'views', (select count(*) from prev where kind = 'view'),
      'formOpeners', (select count(distinct visitor) from prev where kind = 'form_open'),
      'lineClicks', (select count(*) from prev where kind = 'line_click'),
      'enrollments', (select count(*) from enr where day < d_from)),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', g.d, 'visitors', coalesce(v.visitors, 0), 'views', coalesce(v.views, 0),
               'formOpeners', coalesce(v.forms, 0), 'lineClicks', coalesce(v.lines, 0), 'enrollments', coalesce(x.n, 0))
             order by g.d)
      from (select generate_series(d_from, d_to, interval '1 day')::date as d) g
      left join (
        select day, count(distinct visitor) filter (where kind = 'view') as visitors,
               count(*) filter (where kind = 'view') as views,
               count(distinct visitor) filter (where kind = 'form_open') as forms,
               count(*) filter (where kind = 'line_click') as lines
        from cur group by day
      ) v on v.day = g.d
      left join (select day, count(*) as n from enr group by day) x on x.day = g.d),
    'hours', (
      select jsonb_agg(jsonb_build_object('hour', h, 'views', coalesce(c.n, 0)) order by h)
      from generate_series(0, 23) h
      left join (select hour, count(*) as n from cur where kind = 'view' group by hour) c on c.hour = h),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('page', page, 'views', views, 'visitors', visitors) order by views desc)
      from (select page, count(*) as views, count(distinct visitor) as visitors from cur where kind = 'view' group by page) q), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', source, 'visitors', visitors) order by visitors desc)
      from (select source, count(distinct visitor) as visitors from cur where kind = 'view' group by source) q), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'visitors', visitors) order by visitors desc)
      from (select device, count(distinct visitor) as visitors from cur where kind = 'view' group by device) q), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'viewers', viewers, 'formOpeners', openers, 'enrollments', enrolls)
             order by viewers desc, enrolls desc)
      from (
        select coalesce(a.course_id, b.course_id) as id, coalesce(a.viewers, 0) as viewers,
               coalesce(a.openers, 0) as openers, coalesce(b.n, 0) as enrolls
        from (
          select course_id,
                 count(distinct visitor) filter (where kind in ('view', 'course')) as viewers,
                 count(distinct visitor) filter (where kind = 'form_open') as openers
          from cur where course_id is not null group by course_id
        ) a
        full join (select course_id, count(*) as n from enr where day >= d_from and course_id is not null group by course_id) b
          on b.course_id = a.course_id
        order by 2 desc, 4 desc
        limit 40
      ) q), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;

revoke all on function public.track_event(jsonb) from public;
grant execute on function public.track_event(jsonb) to anon, authenticated;
revoke all on function public.admin_site_stats(int) from public, anon;
grant execute on function public.admin_site_stats(int) to authenticated;

-- Check (should show true)
select exists (select 1 from pg_proc where proname = 'admin_site_stats') as ready;
