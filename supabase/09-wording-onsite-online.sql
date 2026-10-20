-- =====================================================================
-- The NEW GEN — website wording: "Onsite" only → "Onsite & Online"
-- Run in Supabase → SQL Editor. Safe to run more than once.
--
-- Only these texts change, and only when they still have the old wording
-- (anything you already edited yourself in the admin is left alone):
--   home.coursesBadge   POPULAR ONSITE COURSES          → POPULAR ONSITE & ONLINE COURSES
--   home.coursesTitle   คอร์สเรียน Onsite แนะนำ          → คอร์สเรียน Onsite & Online แนะนำ
--   home.trustBadges    Onsite กลุ่มเล็กดูแลทั่วถึง       → Onsite & Online กลุ่มเล็กดูแลทั่วถึง
--   whyus feature title เรียนสด Onsite กลุ่มเล็ก          → เรียนสด Onsite & Online กลุ่มเล็ก
--   course location     สถาบัน The NEW GEN (เรียนสด Onsite) → สถาบัน The NEW GEN (เรียนสด Onsite และ Online)
-- =====================================================================

-- 1) Home page: section badge + title
update public.app_data
set data = data
           || case when data ->> 'coursesBadge' = 'POPULAR ONSITE COURSES'
                   then '{"coursesBadge": "POPULAR ONSITE & ONLINE COURSES"}'::jsonb else '{}'::jsonb end
           || case when data ->> 'coursesTitle' = 'คอร์สเรียน Onsite แนะนำ'
                   then '{"coursesTitle": "คอร์สเรียน Onsite & Online แนะนำ"}'::jsonb else '{}'::jsonb end,
    updated_at = now()
where key = 'home' and jsonb_typeof(data) = 'object';

-- 2) Home page: small badges under the buttons
update public.app_data
set data = jsonb_set(data, '{trustBadges}', (
      select coalesce(jsonb_agg(
               case when b #>> '{}' = 'Onsite กลุ่มเล็กดูแลทั่วถึง'
                    then to_jsonb('Onsite & Online กลุ่มเล็กดูแลทั่วถึง'::text) else b end
               order by o), '[]'::jsonb)
      from jsonb_array_elements(data -> 'trustBadges') with ordinality as t(b, o))),
    updated_at = now()
where key = 'home' and jsonb_typeof(data -> 'trustBadges') = 'array';

-- 3) "ทำไมต้องเลือก The NEW GEN" boxes
update public.app_data
set data = jsonb_set(data, '{features}', (
      select coalesce(jsonb_agg(
               case when f ->> 'title' = 'เรียนสด Onsite กลุ่มเล็ก'
                    then f || '{"title": "เรียนสด Onsite & Online กลุ่มเล็ก"}'::jsonb else f end
               order by o), '[]'::jsonb)
      from jsonb_array_elements(data -> 'features') with ordinality as t(f, o))),
    updated_at = now()
where key = 'whyus' and jsonb_typeof(data -> 'features') = 'array';

-- 4) Course location text (same wording as the other courses)
update public.app_data
set data = (
      select coalesce(jsonb_agg(
               case when c ->> 'location' = 'สถาบัน The NEW GEN (เรียนสด Onsite)'
                    then c || '{"location": "สถาบัน The NEW GEN (เรียนสด Onsite และ Online)"}'::jsonb else c end
               order by o), '[]'::jsonb)
      from jsonb_array_elements(data) with ordinality as t(c, o)),
    updated_at = now()
where key = 'courses' and jsonb_typeof(data) = 'array';

-- Check: should list the new wording
select 'home' as part, data ->> 'coursesBadge' || ' | ' || (data ->> 'coursesTitle') || ' | ' || (data -> 'trustBadges')::text as value
from public.app_data where key = 'home'
union all
select 'whyus', string_agg(f ->> 'title', ' | ')
from public.app_data a, jsonb_array_elements(a.data -> 'features') f where a.key = 'whyus'
union all
select 'courses still "Onsite" only', count(*)::text
from public.app_data a, jsonb_array_elements(a.data) c
where a.key = 'courses' and c ->> 'location' = 'สถาบัน The NEW GEN (เรียนสด Onsite)';
