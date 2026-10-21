-- =====================================================================
-- The NEW GEN — "คำถามที่พบบ่อย" (FAQ page): allow the public website to READ it
-- Run in Supabase → SQL Editor. Safe to run more than once.
--
-- Same read rule as 02-lockdown.sql with one key added: 'faq'.
-- Writing is still admin-only; students' data (enrollments) is still private.
-- =====================================================================

drop policy if exists "public can read site content" on public.app_data;

create policy "public can read site content" on public.app_data
  for select to anon, authenticated
  using (key in (
    'courses', 'tutors', 'tutorsQuote', 'reviews', 'achievements', 'videos', 'contact',
    'whyus', 'categories', 'privilege', 'home', 'about', 'enrollmentConfig',
    'popupCampaign', 'bundles', 'faq'
  ));

-- Check: the rule now includes 'faq' (should show true)
select position('''faq''' in pg_get_expr(polqual, polrelid)) > 0 as faq_readable
from pg_policy
where polname = 'public can read site content';
