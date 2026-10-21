-- =====================================================================
-- The NEW GEN — Security setup, part 2 of 2 (LOCKDOWN)
-- Run ONLY AFTER:
--   1) 01-setup.sql has been run
--   2) the admin user exists and has role 'admin' (see SECURITY_SETUP.md)
--   3) the new website code has been pushed to GitHub and you can log in to admin.html
-- Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Copy any applications that old cached pages wrote to the JSON blob since part 1
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

select public.recompute_course_seats(null);

-- ---------------------------------------------------------------------
-- 2) Remove the plaintext admin password; keep the old blob as an admin-only backup
-- ---------------------------------------------------------------------
delete from public.app_data where key = 'admin';

update public.app_data
set key = 'enrollments_legacy_backup'
where key = 'enrollments'
  and not exists (select 1 from public.app_data where key = 'enrollments_legacy_backup');

-- ---------------------------------------------------------------------
-- 3) app_data: public may READ site content only; only admin may write
-- ---------------------------------------------------------------------
alter table public.app_data enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'app_data' loop
    execute format('drop policy %I on public.app_data', p.policyname);
  end loop;
end $$;

create policy "public can read site content" on public.app_data
  for select to anon, authenticated
  using (key in (
    'courses', 'tutors', 'tutorsQuote', 'reviews', 'achievements', 'videos', 'contact',
    'whyus', 'categories', 'privilege', 'home', 'about', 'enrollmentConfig',
    'popupCampaign', 'bundles', 'faq'
  ));

create policy "admin full access app_data" on public.app_data
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke insert, update, delete, truncate on public.app_data from anon;

-- ---------------------------------------------------------------------
-- 4) Storage: remove every old policy except the ones created in part 1
--    (this drops the old "anyone can upload to uploads" policies)
-- ---------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname not like 'student uploads:%'
      and policyname not like 'site uploads:%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Result check — policies now in effect
-- ---------------------------------------------------------------------
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('app_data', 'enrollments'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;
