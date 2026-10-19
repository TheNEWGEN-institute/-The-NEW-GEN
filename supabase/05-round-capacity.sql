-- =====================================================================
-- The NEW GEN — seat capacity per time slot (รับนักเรียนแยกรอบเวลา)
-- Run in Supabase → SQL Editor. Safe to run more than once.
--
-- What it does
--   * counts seats per round (scheduleList item) and per free-campaign subject
--     — cancelled applications do NOT take a seat
--   * writes the results into the public "courses" / "popupCampaign" JSON so the
--     website can show remaining seats without reading anyone's personal data
--   * REJECTS a new application when its round / subject / course is full
--     (checked inside the database, so two people submitting at once cannot overbook)
--   * recalculates automatically whenever applications are added, edited or deleted
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------
create or replace function public.norm_round_text(t text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(t, '')), '\s+', ' ', 'g'));
$$;

-- Which round (0-based index in scheduleList) an application chose, or null.
-- Exact "type | time | dates" first; then by round name (the admin may later edit the time text).
create or replace function public.match_round_index(rounds jsonb, choice text)
returns int
language plpgsql
immutable
as $$
declare
  n      int;
  i      int;
  c      text := public.norm_round_text(choice);
  c_type text;
  c_time text;
  hits   int[] := '{}';
begin
  if rounds is null or jsonb_typeof(rounds) <> 'array' or c = '' then
    return null;
  end if;
  n := jsonb_array_length(rounds);

  for i in 0 .. n - 1 loop
    if public.norm_round_text(concat(rounds -> i ->> 'type', ' | ', rounds -> i ->> 'time', ' | ', rounds -> i ->> 'dates')) = c then
      return i;
    end if;
  end loop;

  c_type := public.norm_round_text(split_part(choice, '|', 1));
  c_time := public.norm_round_text(split_part(choice, '|', 2));
  for i in 0 .. n - 1 loop
    if public.norm_round_text(rounds -> i ->> 'type') = c_type then
      hits := hits || i;
    end if;
  end loop;

  if coalesce(array_length(hits, 1), 0) = 1 then
    return hits[1];
  end if;
  if coalesce(array_length(hits, 1), 0) > 1 then
    foreach i in array hits loop
      if public.norm_round_text(rounds -> i ->> 'time') = c_time then
        return i;
      end if;
    end loop;
  end if;
  return null;
end;
$$;

create or replace function public.json_int(v jsonb)
returns int
language sql
immutable
as $$
  select case when v #>> '{}' ~ '^\s*\d+\s*$' then trim(v #>> '{}')::int else null end;
$$;

-- ---------------------------------------------------------------------
-- 2) Recalculate seats (courses + free-campaign subjects)
-- ---------------------------------------------------------------------
create or replace function public.recompute_course_seats(p_course_ids text[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courses    jsonb;
  v_new        jsonb := '[]'::jsonb;
  c            jsonb;
  rounds       jsonb;
  r            jsonb;
  new_rounds   jsonb;
  i            int;
  n            int;
  cap          int;
  rem          int;
  round_cnt    int;
  total_active int;
  sum_cap      int;
  sum_rem      int;
  per_round    boolean;
  course_cap   int;
  course_rem   int;
  closed       boolean;
  v_camp       jsonb;
  subs         jsonb;
  s            jsonb;
  new_subs     jsonb;
  sub_cnt      int;
begin
  -- ----- courses -----
  select data into v_courses from public.app_data where key = 'courses' for update;
  if v_courses is not null and jsonb_typeof(v_courses) = 'array' then
    for c in select t.value from jsonb_array_elements(v_courses) with ordinality as t(value, ord) order by t.ord loop
      if p_course_ids is null or c ->> 'id' = any (p_course_ids) then
        rounds := case when jsonb_typeof(c -> 'scheduleList') = 'array' then c -> 'scheduleList' else '[]'::jsonb end;
        n := jsonb_array_length(rounds);

        select count(*) into total_active
        from public.enrollments e
        where e.course_id = c ->> 'id' and coalesce(e.data ->> 'status', 'pending') <> 'cancelled';

        per_round := exists (select 1 from jsonb_array_elements(rounds) x where coalesce(public.json_int(x -> 'capacity'), 0) > 0);

        new_rounds := '[]'::jsonb;
        sum_cap := 0;
        sum_rem := 0;
        for i in 0 .. n - 1 loop
          r := rounds -> i;
          select count(*) into round_cnt
          from public.enrollments e
          where e.course_id = c ->> 'id'
            and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
            and public.match_round_index(rounds, e.data ->> 'scheduleChoice') = i;

          closed := coalesce((r -> 'closed') = 'true'::jsonb, false);
          cap := public.json_int(r -> 'capacity');
          if cap is not null and cap > 0 then
            rem := case when closed then 0 else greatest(0, cap - round_cnt) end;
            sum_cap := sum_cap + cap;
            sum_rem := sum_rem + rem;
          else
            cap := null;
            rem := null;
          end if;

          new_rounds := new_rounds || jsonb_build_array(r || jsonb_build_object(
            'enrolled', round_cnt,
            'remaining', rem,
            'isFull', closed or (cap is not null and rem <= 0)
          ));
        end loop;

        if per_round then
          course_cap := sum_cap;
          -- applications without a round still use up the course total
          course_rem := greatest(0, least(sum_rem, sum_cap - total_active));
        else
          course_cap := coalesce(public.json_int(c -> 'maxSeats'), 12);
          course_rem := greatest(0, course_cap - total_active);
        end if;

        c := c || jsonb_build_object(
          'scheduleList', new_rounds,
          'seatMode', case when per_round then 'round' else 'course' end,
          'maxSeats', course_cap,
          'remainingSeats', course_rem,
          'enrolledCount', total_active,
          'isFull', coalesce((c -> 'forceClosed') = 'true'::jsonb, false) or course_rem <= 0
        );
      end if;
      v_new := v_new || jsonb_build_array(c);
    end loop;

    update public.app_data set data = v_new, updated_at = now() where key = 'courses';
  end if;

  -- ----- free-campaign subjects -----
  select data into v_camp from public.app_data where key = 'popupCampaign' for update;
  if v_camp is not null and jsonb_typeof(v_camp -> 'subjects') = 'array' then
    subs := v_camp -> 'subjects';
    new_subs := '[]'::jsonb;
    for s in select t.value from jsonb_array_elements(subs) with ordinality as t(value, ord) order by t.ord loop
      select count(*) into sub_cnt
      from public.enrollments e
      where (e.course_id in ('campaign-free', 'campaign') or e.data ->> 'isCampaign' = 'true')
        and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
        and jsonb_typeof(e.data -> 'selectedSubjects') = 'array'
        and exists (select 1 from jsonb_array_elements(e.data -> 'selectedSubjects') x where x ->> 'id' = s ->> 'id');

      cap := public.json_int(s -> 'capacity');
      if cap is not null and cap > 0 then
        rem := greatest(0, cap - sub_cnt);
      else
        cap := null;
        rem := null;
      end if;
      new_subs := new_subs || jsonb_build_array(s || jsonb_build_object(
        'enrolled', sub_cnt,
        'remaining', rem,
        'isFull', cap is not null and rem <= 0
      ));
    end loop;
    update public.app_data
    set data = v_camp || jsonb_build_object('subjects', new_subs), updated_at = now()
    where key = 'popupCampaign';
  end if;
end;
$$;

revoke execute on function public.recompute_course_seats(text[]) from public, anon, authenticated;

-- Admin button / after saving courses: recalculate everything
create or replace function public.admin_recompute_seats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  perform public.recompute_course_seats(null);
end;
$$;

revoke all on function public.admin_recompute_seats() from public, anon;
grant execute on function public.admin_recompute_seats() to authenticated;

-- ---------------------------------------------------------------------
-- 3) Recalculate automatically on every change to applications
-- ---------------------------------------------------------------------
create or replace function public.trg_enrollments_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_course_seats(null);
  return null;
end;
$$;

drop trigger if exists trg_enrollments_recompute on public.enrollments;
create trigger trg_enrollments_recompute
  after insert or update or delete on public.enrollments
  for each statement execute function public.trg_enrollments_recompute();

-- ---------------------------------------------------------------------
-- 4) Public submission: same as before + capacity checks (all-or-nothing)
--    Errors the website understands:
--      COURSE_FULL|<course>            ROUND_FULL|<course>|<round>
--      ROUND_UNKNOWN|<course>          SUBJECT_FULL|<subject>
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
  v_c       jsonb;
  rounds    jsonb;
  idx       int;
  r         jsonb;
  cap       int;
  cnt       int;
  per_round boolean;
  sub       jsonb;
  camp_sub  jsonb;
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

  -- one submission at a time, so two people cannot take the last seat together
  perform pg_advisory_xact_lock(727001);

  for it in select value from jsonb_array_elements(items) loop
    v_id := it ->> 'id';
    v_course := it ->> 'courseId';

    if v_id is null or v_id !~ '^[A-Za-z0-9_-]{6,120}$' then
      raise exception 'invalid id';
    end if;
    if coalesce(trim(it ->> 'studentName'), '') = '' then
      raise exception 'missing studentName';
    end if;

    if coalesce(it ->> 'studentImageUrl', '') <> ''
       and (it ->> 'studentImageUrl') !~ '^private:student-uploads/[A-Za-z0-9._-]+$' then
      it := it - 'studentImageUrl' || jsonb_build_object('hasAttachment', false);
    end if;

    it := (it - 'paidAmount' - 'status')
          || jsonb_build_object(
               'status', 'pending',
               'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
             );

    -- ----- capacity: regular course (incl. each course inside a bundle) -----
    select x into v_c
    from (select data from public.app_data where key = 'courses' and jsonb_typeof(data) = 'array') a
    cross join lateral jsonb_array_elements(a.data) x
    where x ->> 'id' = v_course
    limit 1;

    if v_c is not null then
      if coalesce((v_c -> 'forceClosed') = 'true'::jsonb, false) then
        raise exception 'COURSE_FULL|%', v_c ->> 'title';
      end if;

      rounds := case when jsonb_typeof(v_c -> 'scheduleList') = 'array' then v_c -> 'scheduleList' else '[]'::jsonb end;
      per_round := exists (select 1 from jsonb_array_elements(rounds) x where coalesce(public.json_int(x -> 'capacity'), 0) > 0);
      idx := public.match_round_index(rounds, it ->> 'scheduleChoice');

      if idx is not null then
        r := rounds -> idx;
        if coalesce((r -> 'closed') = 'true'::jsonb, false)
           or coalesce(r ->> 'time', '') like '%เต็มแล้ว%'
           or coalesce(r ->> 'dates', '') like '%ปิดรับ%' then
          raise exception 'ROUND_FULL|%|%', v_c ->> 'title', r ->> 'type';
        end if;
      end if;

      if per_round then
        if idx is null then
          raise exception 'ROUND_UNKNOWN|%', v_c ->> 'title';
        end if;
        cap := public.json_int(r -> 'capacity');
        select count(*) into cnt
        from public.enrollments e
        where e.course_id = v_course
          and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
          and public.match_round_index(rounds, e.data ->> 'scheduleChoice') = idx;
        if cap is not null and cnt >= cap then
          raise exception 'ROUND_FULL|%|%', v_c ->> 'title', r ->> 'type';
        end if;
      else
        select count(*) into cnt
        from public.enrollments e
        where e.course_id = v_course and coalesce(e.data ->> 'status', 'pending') <> 'cancelled';
        if cnt >= coalesce(public.json_int(v_c -> 'maxSeats'), 12) then
          raise exception 'COURSE_FULL|%', v_c ->> 'title';
        end if;
      end if;
    end if;

    -- ----- capacity: free-campaign subjects -----
    if v_course in ('campaign-free', 'campaign') and jsonb_typeof(it -> 'selectedSubjects') = 'array' then
      for sub in select value from jsonb_array_elements(it -> 'selectedSubjects') loop
        select x into camp_sub
        from (select data from public.app_data where key = 'popupCampaign') a
        cross join lateral jsonb_array_elements(case when jsonb_typeof(a.data -> 'subjects') = 'array' then a.data -> 'subjects' else '[]'::jsonb end) x
        where x ->> 'id' = sub ->> 'id'
        limit 1;
        continue when camp_sub is null;

        if coalesce((camp_sub -> 'active') = 'false'::jsonb, false) or coalesce((camp_sub -> 'enabled') = 'false'::jsonb, false) then
          raise exception 'SUBJECT_FULL|%', camp_sub ->> 'name';
        end if;
        cap := public.json_int(camp_sub -> 'capacity');
        if cap is not null and cap > 0 then
          select count(*) into cnt
          from public.enrollments e
          where (e.course_id in ('campaign-free', 'campaign') or e.data ->> 'isCampaign' = 'true')
            and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
            and jsonb_typeof(e.data -> 'selectedSubjects') = 'array'
            and exists (select 1 from jsonb_array_elements(e.data -> 'selectedSubjects') y where y ->> 'id' = sub ->> 'id');
          if cnt >= cap then
            raise exception 'SUBJECT_FULL|%', camp_sub ->> 'name';
          end if;
        end if;
      end loop;
    end if;

    insert into public.enrollments (id, course_id, data, created_at)
    values (v_id, v_course, it, now())
    on conflict (id) do nothing;

    if found then
      v_ids := v_ids || v_id;
    end if;
  end loop;

  -- seats are recalculated by trg_enrollments_recompute
  return jsonb_build_object('success', true, 'ids', to_jsonb(v_ids));
end;
$$;

revoke all on function public.submit_enrollment(jsonb) from public;
grant execute on function public.submit_enrollment(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) One-time conversion of existing courses
--    * a course closed by hand (isFull but seats were left) → forceClosed
--    * a round marked "เต็มแล้ว" / "ปิดรับ" in its text → closed
-- ---------------------------------------------------------------------
update public.app_data
set data = (
  select coalesce(jsonb_agg(
           (case
              when c -> 'forceClosed' is null
                   and (c -> 'isFull') = 'true'::jsonb
                   and coalesce(public.json_int(c -> 'remainingSeats'), 0) > 0
                then c || '{"forceClosed": true}'::jsonb
              else c
            end)
           || jsonb_build_object('scheduleList', (
                select coalesce(jsonb_agg(
                         case
                           when r -> 'closed' is null
                                and (coalesce(r ->> 'time', '') like '%เต็มแล้ว%' or coalesce(r ->> 'dates', '') like '%ปิดรับ%')
                             then r || '{"closed": true}'::jsonb
                           else r
                         end
                         order by ro.ord), '[]'::jsonb)
                from jsonb_array_elements(case when jsonb_typeof(c -> 'scheduleList') = 'array' then c -> 'scheduleList' else '[]'::jsonb end)
                     with ordinality as ro(r, ord)
              ))
           order by co.ord), '[]'::jsonb)
  from jsonb_array_elements(data) with ordinality as co(c, ord)
)
where key = 'courses' and jsonb_typeof(data) = 'array';

select public.recompute_course_seats(null);

-- Result check: seats per course and per round
select c ->> 'title' as course,
       c ->> 'seatMode' as mode,
       c ->> 'maxSeats' as capacity,
       c ->> 'remainingSeats' as remaining,
       c ->> 'isFull' as is_full,
       (select string_agg(concat(r ->> 'type', ': ', coalesce(r ->> 'enrolled', '0'), '/', coalesce(r ->> 'capacity', '-'),
                                 case when (r -> 'isFull') = 'true'::jsonb then ' (เต็ม)' else '' end), ' • ')
        from jsonb_array_elements(c -> 'scheduleList') r) as rounds
from public.app_data a, jsonb_array_elements(a.data) c
where a.key = 'courses';
