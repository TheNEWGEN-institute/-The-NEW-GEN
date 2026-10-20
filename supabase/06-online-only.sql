-- =====================================================================
-- The NEW GEN — Onsite seats per round + "เหลือเฉพาะออนไลน์" automatically
-- Run in Supabase → SQL Editor AFTER 05-round-capacity.sql. Safe to run more than once.
--
-- Rules
--   * "ออนไซต์รับได้" of a round = ONSITE seats. Only Onsite applications use a seat
--     (Online applications and cancelled ones do not).
--   * Every round accepts Online, unlimited.
--   * "onlineOnly" of a round (เปิดรับเฉพาะออนไลน์) = Onsite closed for that round.
--       - the admin can tick it any time
--       - when Onsite reaches the quota the database ticks it automatically and it STAYS
--         ticked (even after a cancellation) until the admin unticks it
--   * "ปิดรับรอบนี้" closes the round for everyone; "บังคับปิดรับสมัคร" closes the course.
-- Error the website understands (new): ONSITE_FULL|<course>|<round>
-- =====================================================================

do $$
begin
  if to_regprocedure('public.match_round_index(jsonb, text)') is null
     or to_regprocedure('public.json_int(jsonb)') is null then
    raise exception 'กรุณารันไฟล์ 05-round-capacity.sql ก่อน แล้วค่อยรันไฟล์นี้';
  end if;
end $$;

-- Online application? (everything else counts as Onsite)
create or replace function public.is_online_app(d jsonb)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(d ->> 'learningType', 'onsite')) = 'online';
$$;

-- ---------------------------------------------------------------------
-- 1) Recalculate seats (courses + free-campaign subjects)
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
  online_cnt   int;
  total_onsite int;
  total_online int;
  sum_cap      int;
  sum_rem      int;
  per_round    boolean;
  course_cap   int;
  course_rem   int;
  closed       boolean;
  online_only  boolean;
  onsite_full  boolean;
  any_open     boolean;
  v_camp       jsonb;
  subs         jsonb;
  s            jsonb;
  new_subs     jsonb;
  sub_cnt      int;
begin
  select data into v_courses from public.app_data where key = 'courses' for update;
  if v_courses is not null and jsonb_typeof(v_courses) = 'array' then
    for c in select t.value from jsonb_array_elements(v_courses) with ordinality as t(value, ord) order by t.ord loop
      if p_course_ids is null or c ->> 'id' = any (p_course_ids) then
        rounds := case when jsonb_typeof(c -> 'scheduleList') = 'array' then c -> 'scheduleList' else '[]'::jsonb end;
        n := jsonb_array_length(rounds);

        select count(*) filter (where not public.is_online_app(e.data)),
               count(*) filter (where public.is_online_app(e.data))
          into total_onsite, total_online
        from public.enrollments e
        where e.course_id = c ->> 'id' and coalesce(e.data ->> 'status', 'pending') <> 'cancelled';

        per_round := exists (select 1 from jsonb_array_elements(rounds) x where coalesce(public.json_int(x -> 'capacity'), 0) > 0);

        new_rounds := '[]'::jsonb;
        sum_cap := 0;
        sum_rem := 0;
        any_open := false;
        for i in 0 .. n - 1 loop
          r := rounds -> i;
          select count(*) filter (where not public.is_online_app(e.data)),
                 count(*) filter (where public.is_online_app(e.data))
            into round_cnt, online_cnt
          from public.enrollments e
          where e.course_id = c ->> 'id'
            and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
            and public.match_round_index(rounds, e.data ->> 'scheduleChoice') = i;

          closed := coalesce((r -> 'closed') = 'true'::jsonb, false)
                    or coalesce(r ->> 'time', '') like '%เต็มแล้ว%'
                    or coalesce(r ->> 'dates', '') like '%ปิดรับ%';
          cap := public.json_int(r -> 'capacity');
          if cap is not null and cap > 0 then
            rem := case when closed then 0 else greatest(0, cap - round_cnt) end;
            sum_cap := sum_cap + cap;
          else
            cap := null;
            rem := null;
          end if;
          onsite_full := cap is not null and round_cnt >= cap;
          -- ticked by the admin, or onsite quota reached → ticked and kept ticked (sticky)
          online_only := coalesce((r -> 'onlineOnly') = 'true'::jsonb, false) or onsite_full;
          if not closed then
            any_open := true;   -- online is always possible in an open round
            if not online_only then
              sum_rem := sum_rem + coalesce(rem, 0);
            end if;
          end if;

          new_rounds := new_rounds || jsonb_build_array((r - 'online') || jsonb_build_object(
            'enrolled', round_cnt,
            'onlineEnrolled', online_cnt,
            'remaining', rem,
            'onsiteFull', closed or online_only,
            'onlineOnly', online_only,
            'isFull', closed
          ));
        end loop;

        if per_round then
          course_cap := sum_cap;
          -- onsite applications without a round still use up the course total
          course_rem := greatest(0, least(sum_rem, sum_cap - total_onsite));
        else
          course_cap := coalesce(public.json_int(c -> 'maxSeats'), 12);
          course_rem := greatest(0, course_cap - total_onsite);
          any_open := course_rem > 0;
        end if;

        c := c - 'onlineOnly' || jsonb_build_object(
          'scheduleList', new_rounds,
          'seatMode', case when per_round then 'round' else 'course' end,
          'maxSeats', course_cap,
          'remainingSeats', course_rem,
          'enrolledCount', total_onsite,
          'onlineEnrolledCount', total_online,
          'isFull', coalesce((c -> 'forceClosed') = 'true'::jsonb, false) or not any_open
        );
      end if;
      v_new := v_new || jsonb_build_array(c);
    end loop;

    update public.app_data set data = v_new, updated_at = now() where key = 'courses';
  end if;

  -- ----- free-campaign subjects (unchanged) -----
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

-- ---------------------------------------------------------------------
-- 2) Public submission with the onsite / online rules (all-or-nothing)
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
  is_online boolean;
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

    -- ----- regular course (incl. each course inside a bundle) -----
    v_c := null;
    select x into v_c
    from (select data from public.app_data where key = 'courses' and jsonb_typeof(data) = 'array') a
    cross join lateral jsonb_array_elements(a.data) x
    where x ->> 'id' = v_course
    limit 1;

    if v_c is not null then
      if coalesce((v_c -> 'forceClosed') = 'true'::jsonb, false) then
        raise exception 'COURSE_FULL|%', v_c ->> 'title';
      end if;

      is_online := public.is_online_app(it);
      rounds := case when jsonb_typeof(v_c -> 'scheduleList') = 'array' then v_c -> 'scheduleList' else '[]'::jsonb end;
      per_round := exists (select 1 from jsonb_array_elements(rounds) x where coalesce(public.json_int(x -> 'capacity'), 0) > 0);
      idx := public.match_round_index(rounds, it ->> 'scheduleChoice');
      r := case when idx is null then null else rounds -> idx end;

      if r is not null then
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
        -- online: always accepted (unlimited) in an open round
        if not is_online then
          if coalesce((r -> 'onlineOnly') = 'true'::jsonb, false) then
            raise exception 'ONSITE_FULL|%|%', v_c ->> 'title', r ->> 'type';
          end if;
          cap := public.json_int(r -> 'capacity');
          select count(*) into cnt
          from public.enrollments e
          where e.course_id = v_course
            and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
            and not public.is_online_app(e.data)
            and public.match_round_index(rounds, e.data ->> 'scheduleChoice') = idx;
          if cap is not null and cnt >= cap then
            raise exception 'ONSITE_FULL|%|%', v_c ->> 'title', r ->> 'type';
          end if;
        end if;
      elsif not is_online then
        select count(*) into cnt
        from public.enrollments e
        where e.course_id = v_course
          and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
          and not public.is_online_app(e.data);
        if cnt >= coalesce(public.json_int(v_c -> 'maxSeats'), 12) then
          raise exception 'COURSE_FULL|%', v_c ->> 'title';
        end if;
      end if;
    end if;

    -- ----- free-campaign subjects (unchanged) -----
    if v_course in ('campaign-free', 'campaign') and jsonb_typeof(it -> 'selectedSubjects') = 'array' then
      for sub in select value from jsonb_array_elements(it -> 'selectedSubjects') loop
        camp_sub := null;
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
-- 3) Recount now with the new rules
-- ---------------------------------------------------------------------
select public.recompute_course_seats(null);

-- Result check: onsite seats per round (+ online count)
select c ->> 'title' as course,
       c ->> 'remainingSeats' as onsite_remaining,
       c ->> 'isFull' as is_full,
       (select string_agg(concat(r ->> 'type', ': ออนไซต์ ', coalesce(r ->> 'enrolled', '0'), '/', coalesce(r ->> 'capacity', '-'),
                                 concat(' + ออนไลน์ ', coalesce(r ->> 'onlineEnrolled', '0')),
                                 case when (r -> 'isFull') = 'true'::jsonb then ' (ปิดรับรอบนี้)'
                                      when (r -> 'onlineOnly') = 'true'::jsonb then ' → เหลือเฉพาะออนไลน์' else '' end), ' • ')
        from jsonb_array_elements(c -> 'scheduleList') r) as rounds
from public.app_data a, jsonb_array_elements(a.data) c
where a.key = 'courses';
