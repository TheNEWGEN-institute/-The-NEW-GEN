-- =====================================================================
-- The NEW GEN — enrollment form: QR Code LINE image (replaces typing a LINE ID)
-- Run in Supabase → SQL Editor (after 06-online-only.sql). Safe to run more than once.
--
-- Only change to submit_enrollment: 'lineQrUrl' is kept only when it points to the
-- PRIVATE bucket "student-uploads" (same rule as the existing attachment image).
-- Anything else (e.g. an outside link) is dropped. The rest of the function is
-- identical to 06-online-only.sql. The QR is NOT sent to the LINE group message.
-- =====================================================================
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

    -- QR Code LINE: accept only files in the private bucket (same rule as the attachment)
    if coalesce(it ->> 'lineQrUrl', '') <> ''
       and (it ->> 'lineQrUrl') !~ '^private:student-uploads/[A-Za-z0-9._-]+$' then
      it := it - 'lineQrUrl';
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

-- Check: the function now validates the QR (should show true)
select position('lineQrUrl' in prosrc) > 0 as checks_line_qr
from pg_proc
where proname = 'submit_enrollment';