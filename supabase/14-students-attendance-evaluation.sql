-- =====================================================================
-- The NEW GEN — นักเรียน / บัญชีติวเตอร์ / เช็คชื่อ / ประเมินผล / หน้าสรุปผู้ปกครอง
-- Run in Supabase → SQL Editor (after 13-line-qr.sql). Safe to run more than once.
--
-- Security model (nothing here is readable by the public directly):
--   • every new table has RLS on; only ADMIN may touch the tables directly
--   • tutors work only through staff_* functions, which check:
--       - the logged-in account's email is in public.staff (active) AND that
--         email is confirmed in Supabase Auth (blocks look-alike sign-ups)
--       - the course is one they teach (staff.course_ids, or the course lists
--         their tutor profile in "tutorIds")
--     tutors never see phone numbers, LINE QR, money or other applications
--   • parents read ONLY their own child through parent_report(<private token>)
--   • students are created/linked automatically from enrollments
--     (same name + same parent phone = same student; admin can merge/split)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tables
-- ---------------------------------------------------------------------
create table if not exists public.staff (
  email        text primary key check (email = lower(email)),
  display_name text not null default '',
  tutor_id     text,                               -- tutor profile id in app_data "tutors"
  course_ids   text[] not null default '{}',       -- extra courses (besides courses that list tutor_id)
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default '',
  nickname     text not null default '',
  grade        text not null default '',
  school       text not null default '',
  parent_phone text not null default '',
  parent_token text not null unique default encode(extensions.gen_random_bytes(20), 'hex'),
  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- "ชื่อ|เบอร์ผู้ปกครอง" ที่ถือว่าเป็นนักเรียนคนเดียวกัน (รวมคนแล้ว key เดิมยังชี้มาที่คนเดิม)
create table if not exists public.student_keys (
  key        text primary key,
  student_id uuid not null references public.students(id) on delete cascade
);
create index if not exists student_keys_student_idx on public.student_keys (student_id);

create table if not exists public.student_enrollments (
  enrollment_id text primary key references public.enrollments(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  locked        boolean not null default false     -- admin moved it by hand: auto-link won't change it
);
create index if not exists student_enrollments_student_idx on public.student_enrollments (student_id);

create table if not exists public.attendance (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.students(id) on delete cascade,
  course_id   text not null,
  class_date  date not null,
  status      text not null check (status in ('present', 'late', 'leave', 'absent')),
  checked_at  timestamptz,                         -- time of arrival (present / late)
  checked_by  text,
  source      text not null default 'staff' check (source in ('staff', 'self')),
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (student_id, course_id, class_date)
);
create index if not exists attendance_course_date_idx on public.attendance (course_id, class_date);

create table if not exists public.eval_sessions (
  id           uuid primary key default gen_random_uuid(),
  course_id    text not null,
  session_no   int not null check (session_no > 0),
  session_date date,
  title        text not null default '',
  items        jsonb not null default '[]'::jsonb, -- [{ id, label, type: score|check|rating|text, max }]
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (course_id, session_no)
);

create table if not exists public.eval_entries (
  session_id      uuid not null references public.eval_sessions(id) on delete cascade,
  student_id      uuid not null references public.students(id) on delete cascade,
  behavior_level  text not null default '',        -- excellent | good | fair | improve | ''
  behavior        text not null default '',
  scores          jsonb not null default '{}'::jsonb,
  updated_by      text,
  updated_at      timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index if not exists eval_entries_student_idx on public.eval_entries (student_id);

-- RLS: admin only (tutors and parents go through the functions below)
do $$
declare t text;
begin
  foreach t in array array['staff', 'students', 'student_keys', 'student_enrollments', 'attendance', 'eval_sessions', 'eval_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin full access %s" on public.%I', t, t);
    execute format('create policy "admin full access %s" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2) Students from enrollments (automatic)
-- ---------------------------------------------------------------------
create or replace function public.student_merge_key(p_name text, p_phone text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(
           regexp_replace(trim(coalesce(p_name, '')), '^(ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง|นางสาว|น\.ส\.|นาย|นาง|mr\.?|mrs\.?|ms\.?|miss)\s*', '', 'i'),
           '\s+', '', 'g'))
         || '|' || right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
$$;

create or replace function public.link_enrollment_student(p_enrollment_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e    public.enrollments;
  k    text;
  sid  uuid;
begin
  select * into e from public.enrollments where id = p_enrollment_id;
  if not found then return null; end if;

  -- bundle "parent" rows have no course of their own; anonymized rows have no name
  if coalesce(e.data ->> 'isBundle', 'false') = 'true' or coalesce(trim(e.data ->> 'studentName'), '') = '' then
    delete from public.student_enrollments where enrollment_id = p_enrollment_id and not locked;
    return null;
  end if;

  select student_id into sid from public.student_enrollments where enrollment_id = p_enrollment_id and locked;
  if found then return sid; end if;

  k := public.student_merge_key(e.data ->> 'studentName', e.data ->> 'parentPhone');
  select student_id into sid from public.student_keys where key = k;
  if sid is null then
    insert into public.students (name, nickname, grade, school, parent_phone)
    values (trim(e.data ->> 'studentName'), coalesce(trim(e.data ->> 'nickname'), ''), coalesce(trim(e.data ->> 'grade'), ''),
            coalesce(trim(e.data ->> 'school'), ''), coalesce(trim(e.data ->> 'parentPhone'), ''))
    returning id into sid;
    insert into public.student_keys (key, student_id) values (k, sid) on conflict (key) do nothing;
  else
    -- fill only empty fields (an admin may have edited the student)
    update public.students s
    set nickname = case when s.nickname = '' then coalesce(trim(e.data ->> 'nickname'), '') else s.nickname end,
        grade = case when s.grade = '' then coalesce(trim(e.data ->> 'grade'), '') else s.grade end,
        school = case when s.school = '' then coalesce(trim(e.data ->> 'school'), '') else s.school end,
        updated_at = now()
    where s.id = sid;
  end if;

  insert into public.student_enrollments (enrollment_id, student_id) values (p_enrollment_id, sid)
  on conflict (enrollment_id) do update set student_id = excluded.student_id
  where not public.student_enrollments.locked;
  return sid;
end;
$$;
revoke execute on function public.link_enrollment_student(text) from public, anon, authenticated;

create or replace function public.trg_link_enrollment_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.link_enrollment_student(new.id);
  return new;
exception when others then
  -- linking must never make saving an enrollment fail
  raise warning 'link_enrollment_student failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_enrollments_link_student on public.enrollments;
create trigger trg_enrollments_link_student
  after insert or update of data on public.enrollments
  for each row execute function public.trg_link_enrollment_student();

-- a student with no application left (deleted / anonymized) is removed with their history
create or replace function public.trg_remove_orphan_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.student_enrollments where student_id = old.student_id) then
    delete from public.students where id = old.student_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_student_enrollments_orphan on public.student_enrollments;
create trigger trg_student_enrollments_orphan
  after delete or update of student_id on public.student_enrollments
  for each row execute function public.trg_remove_orphan_student();

-- ---------------------------------------------------------------------
-- 3) Who is calling? (staff check)
-- ---------------------------------------------------------------------
-- null = admin (all courses) / array = the courses this tutor may use / error = not staff
create or replace function public.staff_course_ids()
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  em  text := lower(coalesce(auth.jwt() ->> 'email', ''));
  s   public.staff;
  ids text[];
begin
  if public.is_admin() then return null; end if;
  if em = '' or auth.uid() is null then raise exception 'NOT_STAFF'; end if;
  select * into s from public.staff where email = em and active;
  if not found then raise exception 'NOT_STAFF'; end if;
  if not exists (select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = em and u.email_confirmed_at is not null) then
    raise exception 'NOT_STAFF';
  end if;
  select coalesce(array_agg(distinct x), '{}') into ids
  from (
    select unnest(s.course_ids) as x
    union
    select c ->> 'id'
    from public.app_data a
    cross join lateral jsonb_array_elements(case when jsonb_typeof(a.data) = 'array' then a.data else '[]'::jsonb end) c
    where a.key = 'courses' and s.tutor_id is not null
      and jsonb_typeof(c -> 'tutorIds') = 'array' and (c -> 'tutorIds') ? s.tutor_id
  ) q
  where x is not null;
  return ids;
end;
$$;

create or replace function public.staff_assert_course(p_course text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare ids text[] := public.staff_course_ids();
begin
  if p_course is null or (ids is not null and not (p_course = any (ids))) then
    raise exception 'NO_ACCESS';
  end if;
  return lower(coalesce(auth.jwt() ->> 'email', ''));
end;
$$;

create or replace function public.staff_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ids text[] := public.staff_course_ids();
  em  text := lower(coalesce(auth.jwt() ->> 'email', ''));
  s   public.staff;
begin
  select * into s from public.staff where email = em;
  return jsonb_build_object(
    'role', case when ids is null then 'admin' else 'tutor' end,
    'email', em,
    'name', coalesce(nullif(s.display_name, ''), em),
    'courseIds', case when ids is null then null else to_jsonb(ids) end
  );
end;
$$;

-- students currently enrolled in a course (cancelled applications left out)
create or replace function public.course_student_rows(p_course text)
returns table (student_id uuid, name text, nickname text, grade text, school text, round text, learning_type text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (s.id) s.id, s.name, s.nickname, s.grade, s.school,
         coalesce(e.data ->> 'scheduleChoice', ''), coalesce(e.data ->> 'learningType', '')
  from public.enrollments e
  join public.student_enrollments se on se.enrollment_id = e.id
  join public.students s on s.id = se.student_id
  where e.course_id = p_course
    and coalesce(e.data ->> 'status', 'pending') <> 'cancelled'
  order by s.id, e.created_at desc;
$$;
revoke execute on function public.course_student_rows(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Attendance (เช็คชื่อ)
-- ---------------------------------------------------------------------
create or replace function public.staff_roster(p_course text, p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.staff_assert_course(p_course);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'studentId', r.student_id, 'name', r.name, 'nickname', r.nickname, 'grade', r.grade, 'school', r.school,
             'round', r.round, 'learningType', r.learning_type,
             'attendance', case when a.id is null then null else jsonb_build_object(
               'status', a.status, 'checkedAt', a.checked_at, 'checkedBy', a.checked_by, 'source', a.source, 'note', a.note) end)
             order by r.nickname, r.name)
    from public.course_student_rows(p_course) r
    left join public.attendance a on a.student_id = r.student_id and a.course_id = p_course and a.class_date = p_date
  ), '[]'::jsonb);
end;
$$;

-- p_status: present | late | leave | absent | clear
create or replace function public.staff_check_in(p_student uuid, p_course text, p_date date, p_status text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  em  text := public.staff_assert_course(p_course);
  row public.attendance;
begin
  if p_date is null or p_date > (now() at time zone 'Asia/Bangkok')::date + 1 or p_date < (now() at time zone 'Asia/Bangkok')::date - 400 then
    raise exception 'BAD_DATE';
  end if;
  if not exists (select 1 from public.course_student_rows(p_course) r where r.student_id = p_student) then
    raise exception 'NOT_IN_COURSE';
  end if;
  if p_status = 'clear' then
    delete from public.attendance where student_id = p_student and course_id = p_course and class_date = p_date;
    return jsonb_build_object('status', null);
  end if;
  if p_status not in ('present', 'late', 'leave', 'absent') then raise exception 'BAD_STATUS'; end if;

  insert into public.attendance (student_id, course_id, class_date, status, checked_at, checked_by, note)
  values (p_student, p_course, p_date, p_status,
          case when p_status in ('present', 'late') then now() end, em, coalesce(left(p_note, 300), ''))
  on conflict (student_id, course_id, class_date) do update
  set status = excluded.status,
      -- arrival time = first time marked present/late; leave/absent has no arrival time
      checked_at = case when excluded.status in ('present', 'late') then coalesce(public.attendance.checked_at, now()) end,
      checked_by = excluded.checked_by,
      note = case when p_note is null then public.attendance.note else excluded.note end,
      updated_at = now()
  returning * into row;
  return jsonb_build_object('status', row.status, 'checkedAt', row.checked_at, 'checkedBy', row.checked_by, 'note', row.note, 'source', row.source);
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Evaluations (ประเมินผลรายครั้ง)
-- ---------------------------------------------------------------------
create or replace function public.staff_eval_sessions(p_course text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.staff_assert_course(p_course);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', s.id, 'courseId', s.course_id, 'no', s.session_no, 'date', s.session_date, 'title', s.title, 'items', s.items,
             'entries', (select count(*) from public.eval_entries x where x.session_id = s.id))
             order by s.session_no)
    from public.eval_sessions s where s.course_id = p_course
  ), '[]'::jsonb);
end;
$$;

-- p: { id?, courseId, no?, date, title, items }
create or replace function public.staff_eval_save_session(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course text := p ->> 'courseId';
  em   text := public.staff_assert_course(v_course);
  v_no int;
  v_items jsonb := case when jsonb_typeof(p -> 'items') = 'array' then p -> 'items' else '[]'::jsonb end;
  sid uuid;
begin
  if jsonb_array_length(v_items) > 20 or octet_length(v_items::text) > 20000 then raise exception 'TOO_MANY_ITEMS'; end if;
  if nullif(p ->> 'id', '') is not null then
    update public.eval_sessions
    set session_date = nullif(p ->> 'date', '')::date, title = left(coalesce(p ->> 'title', ''), 200), items = v_items, updated_at = now()
    where id = (p ->> 'id')::uuid and course_id = v_course
    returning id into sid;
    if sid is null then raise exception 'NOT_FOUND'; end if;
  else
    v_no := coalesce(nullif(p ->> 'no', '')::int, (select coalesce(max(session_no), 0) + 1 from public.eval_sessions where course_id = v_course));
    insert into public.eval_sessions (course_id, session_no, session_date, title, items, created_by)
    values (v_course, v_no, nullif(p ->> 'date', '')::date, left(coalesce(p ->> 'title', ''), 200), v_items, em)
    returning id into sid;
  end if;
  return jsonb_build_object('id', sid);
end;
$$;

create or replace function public.staff_eval_delete_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.eval_sessions;
begin
  select * into s from public.eval_sessions where id = p_id;
  if not found then return; end if;
  perform public.staff_assert_course(s.course_id);
  -- tutors may delete only a session they created; admin may delete any
  if not public.is_admin() and coalesce(s.created_by, '') <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'NO_ACCESS';
  end if;
  delete from public.eval_sessions where id = p_id;
end;
$$;

create or replace function public.staff_eval_entries(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.eval_sessions;
begin
  select * into s from public.eval_sessions where id = p_session;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.staff_assert_course(s.course_id);
  return jsonb_build_object(
    'session', jsonb_build_object('id', s.id, 'courseId', s.course_id, 'no', s.session_no, 'date', s.session_date, 'title', s.title, 'items', s.items),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
               'studentId', r.student_id, 'name', r.name, 'nickname', r.nickname, 'grade', r.grade,
               'attendance', a.status,
               'entry', case when x.student_id is null then null else jsonb_build_object(
                 'behaviorLevel', x.behavior_level, 'behavior', x.behavior, 'scores', x.scores, 'updatedBy', x.updated_by, 'updatedAt', x.updated_at) end)
               order by r.nickname, r.name)
      from public.course_student_rows(s.course_id) r
      left join public.eval_entries x on x.session_id = s.id and x.student_id = r.student_id
      left join public.attendance a on a.student_id = r.student_id and a.course_id = s.course_id and a.class_date = s.session_date
    ), '[]'::jsonb));
end;
$$;

create or replace function public.staff_eval_save_entry(p_session uuid, p_student uuid, p_level text, p_behavior text, p_scores jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s  public.eval_sessions;
  em text;
begin
  select * into s from public.eval_sessions where id = p_session;
  if not found then raise exception 'NOT_FOUND'; end if;
  em := public.staff_assert_course(s.course_id);
  if not exists (select 1 from public.course_student_rows(s.course_id) r where r.student_id = p_student) then
    raise exception 'NOT_IN_COURSE';
  end if;
  if coalesce(p_level, '') not in ('', 'excellent', 'good', 'fair', 'improve') then raise exception 'BAD_LEVEL'; end if;
  if p_scores is not null and (jsonb_typeof(p_scores) <> 'object' or octet_length(p_scores::text) > 8000) then raise exception 'BAD_SCORES'; end if;
  insert into public.eval_entries (session_id, student_id, behavior_level, behavior, scores, updated_by)
  values (p_session, p_student, coalesce(p_level, ''), left(coalesce(p_behavior, ''), 1000), coalesce(p_scores, '{}'::jsonb), em)
  on conflict (session_id, student_id) do update
  set behavior_level = excluded.behavior_level, behavior = excluded.behavior, scores = excluded.scores,
      updated_by = excluded.updated_by, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Parent page: one child's summary via the private token
-- ---------------------------------------------------------------------
create or replace function public.parent_report(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  st public.students;
  v_courses jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{40}$' then raise exception 'NOT_FOUND'; end if;
  select * into st from public.students where parent_token = p_token;
  if not found then raise exception 'NOT_FOUND'; end if;

  select coalesce(jsonb_agg(distinct e.course_id), '[]'::jsonb) into v_courses
  from public.student_enrollments se join public.enrollments e on e.id = se.enrollment_id
  where se.student_id = st.id and coalesce(e.data ->> 'status', 'pending') <> 'cancelled';

  return jsonb_build_object(
    'student', jsonb_build_object('name', st.name, 'nickname', st.nickname, 'grade', st.grade, 'school', st.school),
    'courseIds', v_courses,
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object('courseId', a.course_id, 'date', a.class_date, 'status', a.status, 'checkedAt', a.checked_at, 'note', a.note)
             order by a.class_date desc)
      from public.attendance a where a.student_id = st.id
    ), '[]'::jsonb),
    'evaluations', coalesce((
      select jsonb_agg(jsonb_build_object(
               'courseId', s.course_id, 'no', s.session_no, 'date', s.session_date, 'title', s.title, 'items', s.items,
               'behaviorLevel', x.behavior_level, 'behavior', x.behavior, 'scores', x.scores)
             order by s.course_id, s.session_no)
      from public.eval_entries x join public.eval_sessions s on s.id = x.session_id
      where x.student_id = st.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Admin tools: merge / split students, new parent link
-- ---------------------------------------------------------------------
create or replace function public.admin_merge_students(p_target uuid, p_source uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'NO_ACCESS'; end if;
  if p_target = p_source then return; end if;
  -- history: keep the target's record when both have one for the same day / session
  update public.attendance a set student_id = p_target
  where a.student_id = p_source
    and not exists (select 1 from public.attendance b where b.student_id = p_target and b.course_id = a.course_id and b.class_date = a.class_date);
  update public.eval_entries x set student_id = p_target
  where x.student_id = p_source
    and not exists (select 1 from public.eval_entries y where y.student_id = p_target and y.session_id = x.session_id);
  update public.student_keys set student_id = p_target where student_id = p_source;
  update public.student_enrollments set student_id = p_target, locked = true where student_id = p_source;
  delete from public.students where id = p_source;
end;
$$;

-- move one application to another student (or to a brand-new student when p_target is null)
create or replace function public.admin_move_enrollment(p_enrollment text, p_target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e   public.enrollments;
  sid uuid := p_target;
begin
  if not public.is_admin() then raise exception 'NO_ACCESS'; end if;
  select * into e from public.enrollments where id = p_enrollment;
  if not found then raise exception 'NOT_FOUND'; end if;
  if sid is null then
    insert into public.students (name, nickname, grade, school, parent_phone)
    values (coalesce(trim(e.data ->> 'studentName'), ''), coalesce(trim(e.data ->> 'nickname'), ''), coalesce(trim(e.data ->> 'grade'), ''),
            coalesce(trim(e.data ->> 'school'), ''), coalesce(trim(e.data ->> 'parentPhone'), ''))
    returning id into sid;
  end if;
  insert into public.student_enrollments (enrollment_id, student_id, locked) values (p_enrollment, sid, true)
  on conflict (enrollment_id) do update set student_id = excluded.student_id, locked = true;
  return sid;
end;
$$;

create or replace function public.admin_new_parent_token(p_student uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare t text := encode(extensions.gen_random_bytes(20), 'hex');
begin
  if not public.is_admin() then raise exception 'NO_ACCESS'; end if;
  update public.students set parent_token = t, updated_at = now() where id = p_student;
  return t;
end;
$$;

-- ---------------------------------------------------------------------
-- 8) Permissions on the functions
-- ---------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'staff_course_ids()', 'staff_assert_course(text)', 'staff_me()', 'staff_roster(text, date)',
    'staff_check_in(uuid, text, date, text, text)', 'staff_eval_sessions(text)', 'staff_eval_save_session(jsonb)',
    'staff_eval_delete_session(uuid)', 'staff_eval_entries(uuid)', 'staff_eval_save_entry(uuid, uuid, text, text, jsonb)',
    'admin_merge_students(uuid, uuid)', 'admin_move_enrollment(text, uuid)', 'admin_new_parent_token(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.parent_report(text) from public;
grant execute on function public.parent_report(text) to anon, authenticated;
revoke execute on function public.student_merge_key(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 9) Create students for applications that already exist
-- ---------------------------------------------------------------------
select public.link_enrollment_student(id) from public.enrollments;

-- Check (should show the number of students created and true)
select (select count(*) from public.students) as students,
       exists (select 1 from pg_proc where proname = 'parent_report') as ready;
