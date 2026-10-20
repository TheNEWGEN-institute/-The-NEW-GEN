-- =====================================================================
-- The NEW GEN — one-time change: every round ticked "ปิดรับรอบนี้"
--               becomes "เปิดรับเฉพาะออนไลน์" (onsite closed, online open)
-- Run in Supabase → SQL Editor AFTER 06-online-only.sql.
--
-- RUN ONCE. Running it again later would also reopen (as online-only) any round
-- you close on purpose after today.
--
-- A copy of the courses before the change is kept in app_data under the key
-- 'backup_courses_before_07' (course data is public, no student data).
-- =====================================================================

do $$
begin
  if to_regprocedure('public.is_online_app(jsonb)') is null then
    raise exception 'กรุณารันไฟล์ 06-online-only.sql ก่อน แล้วค่อยรันไฟล์นี้';
  end if;
end $$;

-- 1) Backup (kept only once — the first run)
insert into public.app_data (key, data)
select 'backup_courses_before_07', data
from public.app_data
where key = 'courses'
  and not exists (select 1 from public.app_data b where b.key = 'backup_courses_before_07');

-- 2) closed → online only (other rounds untouched)
update public.app_data
set data = (
  select coalesce(jsonb_agg(
           case when jsonb_typeof(c -> 'scheduleList') = 'array' then
             c || jsonb_build_object('scheduleList', (
               select coalesce(jsonb_agg(
                        case when (r -> 'closed') = 'true'::jsonb
                          then r || '{"closed": false, "onlineOnly": true}'::jsonb
                          else r
                        end
                        order by ro.ord), '[]'::jsonb)
               from jsonb_array_elements(c -> 'scheduleList') with ordinality as ro(r, ord)
             ))
           else c end
           order by co.ord), '[]'::jsonb)
  from jsonb_array_elements(data) with ordinality as co(c, ord)
),
updated_at = now()
where key = 'courses' and jsonb_typeof(data) = 'array';

-- 3) Recount seats with the new settings
select public.recompute_course_seats(null);

-- Result check: no round should say "ปิดรับรอบนี้" any more
select c ->> 'title' as course,
       (select string_agg(concat(r ->> 'type', ': ออนไซต์ ', coalesce(r ->> 'enrolled', '0'), '/', coalesce(r ->> 'capacity', '-'),
                                 case when (r -> 'isFull') = 'true'::jsonb then ' (ปิดรับรอบนี้)'
                                      when (r -> 'onlineOnly') = 'true'::jsonb then ' → เหลือเฉพาะออนไลน์' else ' (ออนไซต์ + ออนไลน์)' end), ' • ')
        from jsonb_array_elements(c -> 'scheduleList') r) as rounds
from public.app_data a, jsonb_array_elements(a.data) c
where a.key = 'courses';
