-- =====================================================================
-- The NEW GEN — "ตารางเรียน" (schedule page): allow the public website to READ it
-- Run in Supabase → SQL Editor. Safe to run more than once.
--
-- Same read rule as 10-faq-public-read.sql with one key added: 'schedule'.
-- Writing is still admin-only; students' data (enrollments) is still private.
-- =====================================================================

drop policy if exists "public can read site content" on public.app_data;

create policy "public can read site content" on public.app_data
  for select to anon, authenticated
  using (key in (
    'courses', 'tutors', 'tutorsQuote', 'reviews', 'achievements', 'videos', 'contact',
    'whyus', 'categories', 'privilege', 'home', 'about', 'enrollmentConfig',
    'popupCampaign', 'bundles', 'faq', 'schedule'
  ));

-- Check: the rule now includes 'schedule' (should show true)
select position('''schedule''' in pg_get_expr(polqual, polrelid)) > 0 as schedule_readable
from pg_policy
where polname = 'public can read site content';
