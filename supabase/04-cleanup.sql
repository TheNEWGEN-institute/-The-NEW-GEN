-- =====================================================================
-- The NEW GEN — permissions for "ตั้งค่าระบบ → ล้างข้อมูล" (data cleanup)
-- Lets a logged-in ADMIN list the website images bucket ("uploads") so the
-- cleanup screen can find images that are no longer used.
-- Public image links keep working exactly as before.
-- Safe to run more than once.
-- =====================================================================

drop policy if exists "site uploads: admin can read" on storage.objects;
create policy "site uploads: admin can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and public.is_admin());

-- Result check
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
