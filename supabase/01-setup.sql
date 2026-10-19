-- =====================================================================
-- The NEW GEN — Security setup, part 1 of 2 (ADDITIVE, safe to run now)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- This does NOT lock anything yet; the current live site keeps working.
-- Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Admin check: true only for logged-in users whose app_metadata.role = 'admin'.
--    app_metadata can only be set server-side (SQL / service role), never by the user.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------------------------------------------------------------------
-- 2) Enrollments table (one row per application, replaces the single JSON blob)
-- ---------------------------------------------------------------------
create table if not exists public.enrollments (
  id          text primary key,
  course_id   text,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists enrollments_course_id_idx on public.enrollments (course_id);

alter table public.enrollments enable row level security;

drop policy if exists "admin full access enrollments" on public.enrollments;
create policy "admin full access enrollments" on public.enrollments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The public can never read/write this table directly (only via submit_enrollment below)
revoke all on public.enrollments from anon;
grant select, insert, update, delete on public.enrollments to authenticated;

-- ---------------------------------------------------------------------
-- 3) Recalculate remainingSeats / isFull inside the "courses" JSON
--    (public pages read seat counts from courses, never from enrollments)
-- ---------------------------------------------------------------------
create or replace function public.recompute_course_seats(p_course_ids text[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courses jsonb;
begin
  select data into v_courses from public.app_data where key = 'courses' for update;
  if v_courses is null or jsonb_typeof(v_courses) <> 'array' then
    return;
  end if;

  update public.app_data
  set data = (
        select coalesce(jsonb_agg(
                 case
                   when p_course_ids is null or c ->> 'id' = any (p_course_ids) then
                     c || jsonb_build_object(
                       'remainingSeats', greatest(0, s.cap - s.cnt),
                       'isFull', coalesce((c -> 'isFull') = 'true'::jsonb, false) or (s.cap - s.cnt) <= 0
                     )
                   else c
                 end
                 order by t.ord), '[]'::jsonb)
        from jsonb_array_elements(v_courses) with ordinality as t(c, ord)
        cross join lateral (
          select
            case when c ->> 'maxSeats' ~ '^\s*\d+\s*$' then trim(c ->> 'maxSeats')::int else 12 end as cap,
            (select count(*) from public.enrollments e where e.course_id = c ->> 'id')::int as cnt
        ) s
      ),
      updated_at = now()
  where key = 'courses';
end;
$$;

revoke execute on function public.recompute_course_seats(text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Public enrollment submission (the ONLY thing the public can write)
--    - insert-only: cannot overwrite or read other applications
--    - status forced to 'pending', paidAmount stripped, createdAt set by server
-- ---------------------------------------------------------------------
create or replace function public.submit_enrollment(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it        jsonb;
  v_id      text;
  v_course  text;
  v_ids     text[] := '{}';
  v_courses text[] := '{}';
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception 'invalid payload';
  end if;
  if jsonb_array_length(items) = 0 or jsonb_array_length(items) > 12 then
    raise exception 'invalid item count';
  end if;
  if octet_length(items::text) > 200000 then
    raise exception 'payload too large';
  end if;

  for it in select value from jsonb_array_elements(items) loop
    v_id := it ->> 'id';
    v_course := it ->> 'courseId';

    if v_id is null or v_id !~ '^[A-Za-z0-9_-]{6,120}$' then
      raise exception 'invalid id';
    end if;
    if coalesce(trim(it ->> 'studentName'), '') = '' then
      raise exception 'missing studentName';
    end if;

    -- Only images uploaded to the private bucket are accepted
    if coalesce(it ->> 'studentImageUrl', '') <> ''
       and (it ->> 'studentImageUrl') !~ '^private:student-uploads/[A-Za-z0-9._-]+$' then
      it := it - 'studentImageUrl' || jsonb_build_object('hasAttachment', false);
    end if;

    it := (it - 'paidAmount' - 'status')
          || jsonb_build_object(
               'status', 'pending',
               'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
             );

    insert into public.enrollments (id, course_id, data, created_at)
    values (v_id, v_course, it, now())
    on conflict (id) do nothing;

    if found then
      v_ids := v_ids || v_id;
      if v_course is not null then
        v_courses := v_courses || v_course;
      end if;
    end if;
  end loop;

  if coalesce(array_length(v_courses, 1), 0) > 0 then
    perform public.recompute_course_seats(v_courses);
  end if;

  return jsonb_build_object('success', true, 'ids', to_jsonb(v_ids));
end;
$$;

revoke all on function public.submit_enrollment(jsonb) from public;
grant execute on function public.submit_enrollment(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Copy existing applications from the old JSON blob into the new table
-- ---------------------------------------------------------------------
insert into public.enrollments (id, course_id, data, created_at)
select
  e ->> 'id',
  e ->> 'courseId',
  e,
  case when e ->> 'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (e ->> 'createdAt')::timestamptz else now() end
from (
  select data from public.app_data
  where key = 'enrollments' and jsonb_typeof(data) = 'array'
) a
cross join lateral jsonb_array_elements(a.data) e
where coalesce(e ->> 'id', '') <> ''
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6) Storage
--    student-uploads: PRIVATE bucket — public can upload, only admin can view
--    uploads (site images): stays publicly readable; admin write policies added here,
--    the old "anyone can upload" policies are removed in part 2
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-uploads', 'student-uploads', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "student uploads: anyone can upload" on storage.objects;
create policy "student uploads: anyone can upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'student-uploads');

drop policy if exists "student uploads: admin can read" on storage.objects;
create policy "student uploads: admin can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-uploads' and public.is_admin());

drop policy if exists "student uploads: admin can delete" on storage.objects;
create policy "student uploads: admin can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-uploads' and public.is_admin());

drop policy if exists "site uploads: admin can upload" on storage.objects;
create policy "site uploads: admin can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and public.is_admin());

drop policy if exists "site uploads: admin can update" on storage.objects;
create policy "site uploads: admin can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads' and public.is_admin())
  with check (bucket_id = 'uploads' and public.is_admin());

drop policy if exists "site uploads: admin can delete" on storage.objects;
create policy "site uploads: admin can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and public.is_admin());

-- Done. Result check:
select
  (select count(*) from public.enrollments) as enrollments_in_new_table,
  (select jsonb_array_length(data) from public.app_data where key = 'enrollments' and jsonb_typeof(data) = 'array') as enrollments_in_old_blob;
