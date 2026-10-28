-- =====================================================================
-- The NEW GEN — LINE group message: add the student's school
-- Run in Supabase → SQL Editor (after 08-line-notify-nickname.sql). Safe to run more than once.
--
-- Only change: 'school' is added to the fields sent to the line-notify Edge Function.
-- Still NOT sent: phone numbers, LINE ID, address, images, custom answers.
-- The trigger and the Vault secret stay as they are.
-- After running this, deploy the updated supabase/functions/line-notify/index.ts.
-- =====================================================================
create or replace function public.notify_line_new_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret          text;
  v_enrollment      jsonb;
  v_course          jsonb;
  v_bundle          jsonb;
  v_bundle_courses  text;
begin
  -- Bundle child rows: the parent row already notifies once for the whole bundle
  if coalesce(new.data ->> 'isFromBundle', 'false') = 'true' then
    return new;
  end if;

  -- Restoring an old backup must not flood the group
  if new.created_at < now() - interval '1 day' then
    return new;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'line_notify_secret';
  if v_secret is null then
    return new;
  end if;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into v_enrollment
  from jsonb_each(new.data) as e(k, v)
  where k in ('id', 'studentName', 'nickname', 'grade', 'school', 'courseId', 'courseTitle', 'learningType',
              'isCampaign', 'isBundle', 'bundleName', 'selectedSubjects', 'subjectsChosen',
              'scheduleChoice', 'createdAt');

  select jsonb_build_object('title', c ->> 'title', 'subjects', c ->> 'subjects') into v_course
  from (select data from public.app_data where key = 'courses' and jsonb_typeof(data) = 'array') a
  cross join lateral jsonb_array_elements(a.data) c
  where c ->> 'id' = new.course_id
  limit 1;

  if coalesce(new.data ->> 'isBundle', 'false') = 'true' then
    select b into v_bundle
    from (select data from public.app_data where key = 'bundles' and jsonb_typeof(data) = 'array') a
    cross join lateral jsonb_array_elements(a.data) b
    where b ->> 'id' = coalesce(new.data ->> 'bundleId', new.course_id)
    limit 1;

    if v_bundle is not null and jsonb_typeof(v_bundle -> 'courseIds') = 'array' then
      select string_agg(c ->> 'title', ' • ') into v_bundle_courses
      from (select data from public.app_data where key = 'courses' and jsonb_typeof(data) = 'array') a
      cross join lateral jsonb_array_elements(a.data) c
      where c ->> 'id' in (select jsonb_array_elements_text(v_bundle -> 'courseIds'));
    end if;
  end if;

  -- Asynchronous HTTP call: never slows down or blocks the enrollment itself
  perform net.http_post(
    url := 'https://wdazilhmlttnurpfewlk.supabase.co/functions/v1/line-notify',
    body := jsonb_build_object('enrollment', v_enrollment, 'course', v_course, 'bundle_courses', v_bundle_courses),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    timeout_milliseconds := 8000
  );
  return new;
exception when others then
  -- A notification problem must never make the enrollment fail
  raise warning 'notify_line_new_enrollment failed: %', sqlerrm;
  return new;
end;
$$;

-- Check: the function now sends the school (should show true)
select position('''school''' in prosrc) > 0 as sends_school
from pg_proc
where proname = 'notify_line_new_enrollment';
