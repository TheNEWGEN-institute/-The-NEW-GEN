-- =====================================================================
-- The NEW GEN — LINE notification health check (read-only, safe to run any time)
-- Supabase → SQL Editor → New query → paste this whole file → Run
-- =====================================================================
select step, result, at from (
  select 1 as ord, '1. trigger installed' as step,
         (exists (select 1 from pg_trigger where tgname = 'trg_notify_line_new_enrollment'))::text as result,
         null::timestamptz as at
  union all
  select 2, '2. notify secret in vault',
         (exists (select 1 from vault.secrets where name = 'line_notify_secret'))::text, null
  union all
  select 3, '3. latest enrollment id', e.id, e.created_at
  from (select id, created_at from public.enrollments order by created_at desc limit 3) e
  union all
  select 4, '4. call to line-notify: HTTP ' || coalesce(r.status_code::text, '(no response)'),
         left(coalesce(r.content::text, r.error_msg, ''), 300), r.created
  from (select * from net._http_response order by created desc limit 5) r
) checks
order by ord, at desc nulls last;
