-- =====================================================================
-- The NEW GEN — "เปิดรับเฉพาะออนไลน์ (ออนไซต์เต็มแล้ว)"
-- Run in Supabase → SQL Editor AFTER 05-round-capacity.sql. Safe to run more than once.
--
-- What it does (only for courses where the admin ticked "เปิดรับเฉพาะออนไลน์"):
--   * REJECTS an Onsite application for that course       → error ONSITE_FULL|<course>
--     (also each course inside a bundle — every bundle course has its own learning type)
--   * ACCEPTS an Online application even when the round's seats are used up
--     (online is not limited by classroom seats), except rounds the admin closed
--     ("ปิดรับรอบนี้") and courses closed with "บังคับปิดรับสมัคร"
--   * Everything else is exactly the same as 05-round-capacity.sql
-- Seat counting is unchanged: every application that is not cancelled counts.
-- =====================================================================

do $$
begin
  if to_regprocedure('public.match_round_index(jsonb, text)') is null
     or to_regprocedure('public.json_int(jsonb)') is null then
    raise exception 'กรุณารันไฟล์ 05-round-capacity.sql ก่อน แล้วค่อยรันไฟล์นี้';
  end if;
end $$;

create or replace function public.submit_enrollment(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it          jsonb;
  v_id        text;
  v_course    text;
  v_ids       text[] := '{}';
  v_c         jsonb;
  rounds      jsonb;
  idx         int;
  r           jsonb;
  cap         int;
  cnt         int;
  per_round   boolean;
  online_only boolean;
  sub         jsonb;
  camp_sub    jsonb;
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

      online_only := coalesce((v_c -> 'onlineOnly') = 'true'::jsonb, false);
      if online_only and lower(coalesce(it ->> 'learningType', 'onsite')) <> 'online' then
        raise exception 'ONSITE_FULL|%', v_c ->> 'title';
      end if;

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
        -- online-only course: online seats are not limited by the classroom
        if not online_only then
          cap := public.json_int(r -> 'capacity');
          select count(*) into cnt
          from public.enrollments e
          where e.course_id = v_course
            and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
            and public.match_round_index(rounds, e.data ->> 'scheduleChoice') = idx;
          if cap is not null and cnt >= cap then
            raise exception 'ROUND_FULL|%|%', v_c ->> 'title', r ->> 'type';
          end if;
        end if;
      elsif not online_only then
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

-- Result check: courses currently in online-only mode
select c ->> 'title' as course,
       c ->> 'onlineOnly' as online_only,
       c ->> 'forceClosed' as force_closed
from public.app_data a, jsonb_array_elements(a.data) c
where a.key = 'courses' and (c -> 'onlineOnly') = 'true'::jsonb;
