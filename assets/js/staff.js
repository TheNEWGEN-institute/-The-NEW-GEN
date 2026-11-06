/* ===================================================================
   ระบบติวเตอร์ (staff.html) — เช็คชื่อ + ประเมินผลรายครั้ง
   สิทธิ์ทั้งหมดตรวจที่ Supabase (staff_* functions ใน SQL 14):
   ติวเตอร์เห็นเฉพาะคอร์สที่สอน ไม่เห็นเบอร์โทร/ข้อมูลการเงิน
   =================================================================== */
(function () {
  'use strict';

  const LATE_MIN = 15;               // มาช้ากว่าเวลาเริ่มเรียนเกินกี่นาที = สาย
  const POLL_MS = 15000;             // ดึงสถานะเช็คชื่อล่าสุด (หลายเครื่องเห็นตรงกัน)
  const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
  const STATUS = {
    present: { label: 'มา', icon: 'fa-circle-check' },
    late: { label: 'สาย', icon: 'fa-clock' },
    leave: { label: 'ลา', icon: 'fa-envelope-open-text' },
    absent: { label: 'ขาด', icon: 'fa-circle-xmark' }
  };
  const LEVELS = [['excellent', 'ดีมาก'], ['good', 'ดี'], ['fair', 'พอใช้'], ['improve', 'ควรปรับปรุง']];
  const ITEM_PRESET = {
    score: { label: 'คะแนนแบบทดสอบ', max: 10 },
    check: { label: 'การบ้าน' },
    rating: { label: 'ความเข้าใจ' },
    text: { label: 'หมายเหตุ' }
  };

  const $ = id => document.getElementById(id);
  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const rpc = (name, args) => window.supabaseRpc(name, args);
  const todayBkk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const timeBkk = iso => (iso ? new Date(iso).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) : '');
  const thaiDate = d => (d ? new Date(d + 'T00:00:00+07:00').toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }) : '-');

  const state = {
    me: null,
    view: 'checkin',
    course: '',
    date: todayBkk(),
    round: '',
    search: '',
    roster: [],
    sessions: [],
    session: null,
    entries: null,
    editing: null,
    loadingRoster: false
  };

  /* ---------------- ทั่วไป ---------------- */
  let toastTimer = null;
  function toast(msg, kind = 'ok') {
    const el = $('stfToast');
    el.textContent = msg;
    el.className = 'stf-toast ' + kind;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function errText(e) {
    const code = e && e.code;
    if (code === 'NOT_STAFF') return 'บัญชีนี้ยังไม่ได้รับสิทธิ์ติวเตอร์ (ติดต่อแอดมิน)';
    if (code === 'NO_ACCESS') return 'ไม่มีสิทธิ์ในคอร์สนี้';
    if (code === 'NOT_IN_COURSE') return 'นักเรียนคนนี้ไม่ได้อยู่ในคอร์สนี้แล้ว';
    if (e && e.status === 401) return 'หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่';
    if (e && /Could not find the function|schema cache/i.test(e.message || '')) return 'ระบบยังไม่พร้อม (แอดมินต้องรัน SQL 14 ใน Supabase ก่อน)';
    return 'ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง';
  }

  function allowedCourses() {
    const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : []).filter(c => !c.isHidden);
    const ids = state.me && state.me.courseIds;
    return Array.isArray(ids) ? courses.filter(c => ids.includes(c.id)) : courses;
  }

  const course = () => allowedCourses().find(c => c.id === state.course) || null;

  /* ---------------- เข้าสู่ระบบ ---------------- */
  function showLogin(msg) {
    $('stfLogin').hidden = false;
    $('stfApp').hidden = true;
    $('stfUser').hidden = true;
    $('stfLoginError').textContent = msg || '';
  }

  async function loadMe() {
    try {
      state.me = await rpc('staff_me', {});
    } catch (e) {
      if (e.code === 'NOT_STAFF' || e.status === 401) await window.NewGenAuth.signOut();
      showLogin(errText(e));
      return false;
    }
    $('stfLogin').hidden = true;
    $('stfApp').hidden = false;
    $('stfUser').hidden = false;
    $('stfUserName').innerHTML = `<i class="fa-solid fa-user-tie"></i> ${esc(state.me.name)} <small>${state.me.role === 'admin' ? 'แอดมิน' : 'ติวเตอร์'}</small>`;
    $('stfLateMin').textContent = LATE_MIN;
    renderCourseSelect();
    await refreshView();
    return true;
  }

  $('stfLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('stfLoginBtn');
    btn.disabled = true;
    $('stfLoginError').textContent = '';
    try {
      await window.NewGenAuth.signIn($('stfEmail').value.trim(), $('stfPassword').value);
      $('stfPassword').value = '';
      await loadMe();
    } catch (err) {
      showLogin(/invalid/i.test(err.message || '') ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : (errText(err) || 'เข้าสู่ระบบไม่สำเร็จ'));
    } finally {
      btn.disabled = false;
    }
  });

  $('stfLogout').addEventListener('click', async () => {
    await window.NewGenAuth.signOut();
    state.me = null;
    showLogin('');
  });

  /* ---------------- ตัวกรอง ---------------- */
  function renderCourseSelect() {
    const list = allowedCourses();
    if (!list.some(c => c.id === state.course)) state.course = list[0] ? list[0].id : '';
    $('stfCourse').innerHTML = list.length
      ? list.map(c => `<option value="${esc(c.id)}" ${c.id === state.course ? 'selected' : ''}>${esc(c.title)}</option>`).join('')
      : '<option value="">ยังไม่มีคอร์สที่ได้รับสิทธิ์</option>';
    $('stfDate').value = state.date;
    renderRoundSelect();
  }

  function rounds() {
    const c = course();
    return c && Array.isArray(c.scheduleList) ? c.scheduleList.filter(s => s && (s.type || s.time)) : [];
  }

  const roundLabel = s => [s.type, s.time].filter(Boolean).join(' · ');
  const roundKey = s => roundLabel(s);

  // รอบที่ตรงกับวันที่เลือก (เช่น วันอาทิตย์) ขึ้นเป็นค่าเริ่มต้น
  function renderRoundSelect() {
    const rs = rounds();
    // เที่ยงวันเวลาไทย = 05:00 UTC ของวันเดียวกัน → getUTCDay() ได้วันในสัปดาห์ที่ถูกต้องทุกเขตเวลา
    const day = DAYS[new Date(state.date + 'T12:00:00+07:00').getUTCDay()];
    if (!rs.some(s => roundKey(s) === state.round)) {
      const today = rs.find(s => String(s.type || '').includes(day));
      state.round = today ? roundKey(today) : '';
    }
    $('stfRound').innerHTML = `<option value="">ทุกรอบ</option>` +
      rs.map(s => `<option value="${esc(roundKey(s))}" ${roundKey(s) === state.round ? 'selected' : ''}>${esc(roundLabel(s))}</option>`).join('');
  }

  function studentRound(st) {
    const choice = String(st.round || '');
    return rounds().find(s => choice.includes(String(s.type || '').trim()) && (!s.time || choice.includes(String(s.time).replace(/\s*น\.?$/, '').trim()))) || null;
  }

  function startMinutes(s) {
    const m = String(s && s.time || '').match(/(\d{1,2})[.:](\d{2})/);
    return m ? +m[1] * 60 + +m[2] : null;
  }

  $('stfCourse').addEventListener('change', e => { state.course = e.target.value; state.round = ''; state.session = null; renderRoundSelect(); refreshView(); });
  $('stfDate').addEventListener('change', e => { state.date = e.target.value || todayBkk(); state.round = ''; renderRoundSelect(); refreshView(); });
  $('stfRound').addEventListener('change', e => { state.round = e.target.value; renderRoster(); });
  $('stfSearch').addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); renderRoster(); });

  document.querySelectorAll('.stf-tab').forEach(btn => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    document.querySelectorAll('.stf-tab').forEach(b => b.classList.toggle('on', b === btn));
    $('viewCheckin').hidden = state.view !== 'checkin';
    $('viewEval').hidden = state.view !== 'eval';
    document.querySelectorAll('.stf-only-checkin').forEach(el => { el.hidden = state.view !== 'checkin'; });
    refreshView();
  }));

  async function refreshView() {
    if (!state.me || !state.course) {
      $('stfRoster').innerHTML = '<p class="stf-empty">ยังไม่มีคอร์สที่ได้รับสิทธิ์ ติดต่อแอดมินให้ผูกคอร์สกับบัญชีของคุณ</p>';
      return;
    }
    if (state.view === 'checkin') await loadRoster();
    else await loadSessions();
  }

  /* ---------------- เช็คชื่อ ---------------- */
  async function loadRoster(silent) {
    if (state.loadingRoster) return;
    state.loadingRoster = true;
    if (!silent) $('stfRoster').innerHTML = '<p class="stf-empty"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดรายชื่อ...</p>';
    try {
      state.roster = await rpc('staff_roster', { p_course: state.course, p_date: state.date }) || [];
      renderRoster();
    } catch (e) {
      if (!silent) $('stfRoster').innerHTML = `<p class="stf-empty">${esc(errText(e))}</p>`;
    } finally {
      state.loadingRoster = false;
    }
  }

  function visibleRoster() {
    return state.roster.filter(st => {
      if (state.round) {
        const r = studentRound(st);
        if (!r || roundKey(r) !== state.round) return false;
      }
      if (!state.search) return true;
      return `${st.nickname} ${st.name}`.toLowerCase().includes(state.search);
    });
  }

  function renderRoster() {
    const list = visibleRoster();
    const counts = { present: 0, late: 0, leave: 0, absent: 0, none: 0 };
    list.forEach(st => { counts[st.attendance ? st.attendance.status : 'none']++; });
    $('stfStats').innerHTML = `
      <div class="stf-stat s-all"><b>${list.length}</b><span>ทั้งหมด</span></div>
      <div class="stf-stat s-present"><b>${counts.present}</b><span>มา</span></div>
      <div class="stf-stat s-late"><b>${counts.late}</b><span>สาย</span></div>
      <div class="stf-stat s-leave"><b>${counts.leave}</b><span>ลา</span></div>
      <div class="stf-stat s-absent"><b>${counts.absent}</b><span>ขาด</span></div>
      <div class="stf-stat s-none"><b>${counts.none}</b><span>ยังไม่เช็ค</span></div>`;
    if (!list.length) {
      $('stfRoster').innerHTML = `<p class="stf-empty">${state.roster.length ? 'ไม่พบนักเรียนตามตัวกรอง (ลองเลือก "ทุกรอบ")' : 'ยังไม่มีนักเรียนในคอร์สนี้'}</p>`;
      return;
    }
    $('stfRoster').innerHTML = list.map(st => {
      const a = st.attendance;
      const status = a ? a.status : '';
      const r = studentRound(st);
      return `
        <article class="stf-row ${status ? 'st-' + status : ''}" data-id="${esc(st.studentId)}">
          <button type="button" class="stf-row-main" data-tap="${esc(st.studentId)}" ${status ? 'aria-label="เช็คชื่อแล้ว"' : `aria-label="เช็คชื่อ ${esc(st.nickname || st.name)} มาแล้ว"`}>
            <span class="stf-avatar">${esc((st.nickname || st.name || '?').replace(/^น้อง/, '').slice(0, 1))}</span>
            <span class="stf-who">
              <b>${esc(st.nickname || '-')}</b>
              <small>${esc(st.name)}${st.school ? ' · ' + esc(st.school) : ''}</small>
              <span class="stf-tags">
                ${r && !state.round ? `<em>${esc(roundLabel(r))}</em>` : ''}
                ${st.learningType === 'online' ? '<em class="t-online"><i class="fa-solid fa-laptop"></i> Online</em>' : ''}
              </span>
            </span>
            <span class="stf-state">
              ${status ? `<span class="stf-pill p-${status}"><i class="fa-solid ${STATUS[status].icon}"></i> ${STATUS[status].label}</span>` : '<span class="stf-pill p-none">แตะเมื่อมาถึง</span>'}
              ${a && a.checkedAt ? `<small>${timeBkk(a.checkedAt)} น.</small>` : ''}
            </span>
          </button>
          <div class="stf-row-actions" role="group" aria-label="เปลี่ยนสถานะ">
            ${Object.keys(STATUS).map(k => `<button type="button" class="a-${k} ${status === k ? 'on' : ''}" data-set="${k}" data-sid="${esc(st.studentId)}">${STATUS[k].label}</button>`).join('')}
            ${status ? `<button type="button" class="a-clear" data-set="clear" data-sid="${esc(st.studentId)}" title="ยกเลิกการเช็คชื่อ"><i class="fa-solid fa-rotate-left"></i></button>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  // แตะชื่อ = มาแล้ว (หรือ สาย ถ้าเลยเวลาเริ่มเรียนของรอบนั้น)
  function arrivalStatus(st) {
    if (state.date !== todayBkk()) return 'present';
    const start = startMinutes(studentRound(st));
    if (start === null) return 'present';
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return now.getHours() * 60 + now.getMinutes() > start + LATE_MIN ? 'late' : 'present';
  }

  async function setStatus(sid, status) {
    const st = state.roster.find(x => x.studentId === sid);
    if (!st) return;
    const prev = st.attendance;
    st.attendance = status === 'clear' ? null : { ...(prev || {}), status, checkedAt: (prev && prev.checkedAt) || (['present', 'late'].includes(status) ? new Date().toISOString() : null) };
    renderRoster();
    try {
      const res = await rpc('staff_check_in', { p_student: sid, p_course: state.course, p_date: state.date, p_status: status, p_note: null });
      st.attendance = res && res.status ? res : null;
      renderRoster();
      if (status === 'present' || status === 'late') toast(`✅ ${st.nickname || st.name} ${STATUS[status].label} ${timeBkk(res.checkedAt)} น.`);
    } catch (e) {
      st.attendance = prev;
      renderRoster();
      toast(errText(e), 'err');
    }
  }

  $('stfRoster').addEventListener('click', e => {
    const set = e.target.closest('[data-set]');
    if (set) { setStatus(set.dataset.sid, set.dataset.set); return; }
    const tap = e.target.closest('[data-tap]');
    if (!tap) return;
    const st = state.roster.find(x => x.studentId === tap.dataset.tap);
    if (st && !st.attendance) setStatus(st.studentId, arrivalStatus(st));
  });

  setInterval(() => {
    if (state.me && state.view === 'checkin' && state.course && !document.hidden) loadRoster(true);
  }, POLL_MS);

  /* ---------------- ประเมินผล ---------------- */
  async function loadSessions(keepId) {
    $('stfSessionBody').innerHTML = '';
    try {
      state.sessions = await rpc('staff_eval_sessions', { p_course: state.course }) || [];
    } catch (e) {
      $('stfSessions').innerHTML = `<p class="stf-empty">${esc(errText(e))}</p>`;
      return;
    }
    const want = keepId || (state.session && state.session.id);
    state.session = state.sessions.find(s => s.id === want) || state.sessions[state.sessions.length - 1] || null;
    renderSessions();
    if (state.session) await loadEntries();
    else $('stfSessionBody').innerHTML = '<p class="stf-empty">ยังไม่มีการประเมิน กด "เพิ่มครั้งที่ 1" เพื่อเริ่ม</p>';
  }

  function renderSessions() {
    const next = (state.sessions.reduce((m, s) => Math.max(m, s.no), 0)) + 1;
    $('stfSessions').innerHTML = state.sessions.map(s => `
      <button type="button" class="stf-sess ${state.session && s.id === state.session.id ? 'on' : ''}" data-sess="${esc(s.id)}">
        <b>ครั้งที่ ${s.no}</b><small>${esc(thaiDate(s.date))}</small>
      </button>`).join('') +
      `<button type="button" class="stf-sess stf-sess-add" data-new-sess><i class="fa-solid fa-plus"></i> เพิ่มครั้งที่ ${next}</button>`;
  }

  $('stfSessions').addEventListener('click', e => {
    if (e.target.closest('[data-new-sess]')) { openSessionModal(null); return; }
    const b = e.target.closest('[data-sess]');
    if (!b) return;
    state.session = state.sessions.find(s => s.id === b.dataset.sess) || null;
    renderSessions();
    loadEntries();
  });

  async function loadEntries() {
    const box = $('stfSessionBody');
    box.innerHTML = '<p class="stf-empty"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...</p>';
    try {
      state.entries = await rpc('staff_eval_entries', { p_session: state.session.id });
      renderEntries();
    } catch (e) {
      box.innerHTML = `<p class="stf-empty">${esc(errText(e))}</p>`;
    }
  }

  function itemInput(item, val, sid) {
    const attrs = `data-item="${esc(item.id)}" data-sid="${esc(sid)}"`;
    if (item.type === 'score') {
      return `<label class="stf-score"><span>${esc(item.label)}</span><span class="stf-score-in"><input type="number" inputmode="decimal" min="0" ${item.max ? `max="${esc(item.max)}"` : ''} step="0.5" value="${val === undefined || val === null ? '' : esc(val)}" ${attrs}>${item.max ? `<i>/ ${esc(item.max)}</i>` : ''}</span></label>`;
    }
    if (item.type === 'check') {
      return `<div class="stf-check"><span>${esc(item.label)}</span>
        <button type="button" class="${val === true ? 'on yes' : ''}" data-check="true" ${attrs}>ส่ง</button>
        <button type="button" class="${val === false ? 'on no' : ''}" data-check="false" ${attrs}>ไม่ส่ง</button></div>`;
    }
    if (item.type === 'rating') {
      return `<div class="stf-rating"><span>${esc(item.label)}</span>${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${Number(val) >= n ? 'on' : ''}" data-rate="${n}" ${attrs} aria-label="${n} ดาว"><i class="fa-solid fa-star"></i></button>`).join('')}</div>`;
    }
    return `<label class="stf-textitem"><span>${esc(item.label)}</span><input type="text" maxlength="200" value="${esc(val || '')}" ${attrs}></label>`;
  }

  function renderEntries() {
    const s = state.entries.session;
    const items = Array.isArray(s.items) ? s.items : [];
    const studs = state.entries.students || [];
    const done = studs.filter(x => x.entry).length;
    $('stfSessionBody').innerHTML = `
      <div class="stf-sess-head">
        <div>
          <h2>ครั้งที่ ${s.no} <small>${esc(thaiDate(s.date))}</small></h2>
          ${s.title ? `<p>${esc(s.title)}</p>` : ''}
          <small class="stf-progress">บันทึกแล้ว ${done}/${studs.length} คน · บันทึกอัตโนมัติเมื่อกรอก</small>
        </div>
        <div class="stf-sess-tools">
          <button type="button" class="stf-btn-ghost" data-edit-sess><i class="fa-solid fa-pen"></i> แก้หัวข้อ</button>
          <button type="button" class="stf-btn-ghost danger" data-del-sess><i class="fa-solid fa-trash-can"></i> ลบครั้งนี้</button>
        </div>
      </div>
      <div class="stf-cards">${studs.map(st => {
        const en = st.entry || {};
        const sc = en.scores || {};
        return `
          <article class="stf-card ${st.entry ? 'saved' : ''}" data-card="${esc(st.studentId)}">
            <header>
              <span class="stf-avatar">${esc((st.nickname || st.name || '?').replace(/^น้อง/, '').slice(0, 1))}</span>
              <div><b>${esc(st.nickname || '-')}</b><small>${esc(st.name)}</small></div>
              ${st.attendance ? `<span class="stf-pill p-${esc(st.attendance)}">${STATUS[st.attendance] ? STATUS[st.attendance].label : ''}</span>` : '<span class="stf-pill p-none">ยังไม่เช็คชื่อ</span>'}
              <span class="stf-save-state" data-save-state></span>
            </header>
            <div class="stf-levels" role="group" aria-label="ความประพฤติ">
              ${LEVELS.map(([k, t]) => `<button type="button" class="lv-${k} ${en.behaviorLevel === k ? 'on' : ''}" data-level="${k}" data-sid="${esc(st.studentId)}">${t}</button>`).join('')}
            </div>
            <textarea rows="2" maxlength="1000" placeholder="ความประพฤติ / รายละเอียดครั้งนี้ (ผู้ปกครองเห็นข้อความนี้)" data-behavior data-sid="${esc(st.studentId)}">${esc(en.behavior || '')}</textarea>
            ${items.length ? `<div class="stf-items-in">${items.map(it => itemInput(it, sc[it.id], st.studentId)).join('')}</div>` : ''}
          </article>`;
      }).join('') || '<p class="stf-empty">ยังไม่มีนักเรียนในคอร์สนี้</p>'}</div>`;
  }

  // อ่านค่าทั้งการ์ดแล้วบันทึก (หน่วงเวลาเล็กน้อย กันบันทึกถี่ระหว่างพิมพ์)
  const saveTimers = {};
  function collectCard(sid) {
    const card = document.querySelector(`[data-card="${CSS.escape(sid)}"]`);
    const items = (state.entries.session.items || []);
    const scores = {};
    items.forEach(it => {
      if (it.type === 'score') {
        const v = card.querySelector(`input[data-item="${CSS.escape(it.id)}"]`).value;
        if (v !== '') scores[it.id] = Number(v);
      } else if (it.type === 'check') {
        const on = card.querySelector(`[data-item="${CSS.escape(it.id)}"].on`);
        if (on) scores[it.id] = on.dataset.check === 'true';
      } else if (it.type === 'rating') {
        const n = card.querySelectorAll(`[data-item="${CSS.escape(it.id)}"].on`).length;
        if (n) scores[it.id] = n;
      } else {
        const v = card.querySelector(`input[data-item="${CSS.escape(it.id)}"]`).value.trim();
        if (v) scores[it.id] = v;
      }
    });
    const lv = card.querySelector('[data-level].on');
    return { level: lv ? lv.dataset.level : '', behavior: card.querySelector('[data-behavior]').value.trim(), scores };
  }

  function queueSave(sid, delay = 700) {
    const card = document.querySelector(`[data-card="${CSS.escape(sid)}"]`);
    if (card) card.querySelector('[data-save-state]').innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
    clearTimeout(saveTimers[sid]);
    saveTimers[sid] = setTimeout(() => saveCard(sid), delay);
  }

  async function saveCard(sid) {
    const card = document.querySelector(`[data-card="${CSS.escape(sid)}"]`);
    if (!card) return;
    const v = collectCard(sid);
    const stateEl = card.querySelector('[data-save-state]');
    try {
      await rpc('staff_eval_save_entry', { p_session: state.entries.session.id, p_student: sid, p_level: v.level, p_behavior: v.behavior, p_scores: v.scores });
      const st = state.entries.students.find(x => x.studentId === sid);
      if (st) st.entry = { behaviorLevel: v.level, behavior: v.behavior, scores: v.scores };
      card.classList.add('saved');
      stateEl.innerHTML = '<i class="fa-solid fa-check"></i> บันทึกแล้ว';
      const prog = document.querySelector('.stf-progress');
      if (prog) prog.textContent = `บันทึกแล้ว ${state.entries.students.filter(x => x.entry).length}/${state.entries.students.length} คน · บันทึกอัตโนมัติเมื่อกรอก`;
    } catch (e) {
      stateEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ไม่สำเร็จ';
      toast(errText(e), 'err');
    }
  }

  $('stfSessionBody').addEventListener('click', async e => {
    if (e.target.closest('[data-edit-sess]')) { openSessionModal(state.entries.session); return; }
    if (e.target.closest('[data-del-sess]')) {
      const s = state.entries.session;
      if (!confirm(`ลบการประเมินครั้งที่ ${s.no} และคะแนนของนักเรียนทุกคนในครั้งนี้?`)) return;
      try {
        await rpc('staff_eval_delete_session', { p_id: s.id });
        state.session = null;
        toast('ลบแล้ว');
        loadSessions();
      } catch (err) { toast(errText(err) === 'ไม่มีสิทธิ์ในคอร์สนี้' ? 'ลบได้เฉพาะครั้งที่คุณสร้าง (หรือให้แอดมินลบ)' : errText(err), 'err'); }
      return;
    }
    const lv = e.target.closest('[data-level]');
    if (lv) {
      const wasOn = lv.classList.contains('on');
      lv.parentElement.querySelectorAll('[data-level]').forEach(b => b.classList.remove('on'));
      if (!wasOn) lv.classList.add('on');
      queueSave(lv.dataset.sid, 0);
      return;
    }
    const ck = e.target.closest('[data-check]');
    if (ck) {
      const wasOn = ck.classList.contains('on');
      ck.parentElement.querySelectorAll('[data-check]').forEach(b => b.classList.remove('on', 'yes', 'no'));
      if (!wasOn) ck.classList.add('on', ck.dataset.check === 'true' ? 'yes' : 'no');
      queueSave(ck.dataset.sid, 0);
      return;
    }
    const rt = e.target.closest('[data-rate]');
    if (rt) {
      const n = Number(rt.dataset.rate);
      const btns = [...rt.parentElement.querySelectorAll('[data-rate]')];
      const cur = btns.filter(b => b.classList.contains('on')).length;
      btns.forEach(b => b.classList.toggle('on', cur === n ? false : Number(b.dataset.rate) <= n));
      queueSave(rt.dataset.sid, 0);
    }
  });

  $('stfSessionBody').addEventListener('input', e => {
    const el = e.target.closest('[data-behavior], input[data-item]');
    if (el) queueSave(el.dataset.sid);
  });

  /* ---------------- เพิ่ม/แก้ครั้งประเมิน ---------------- */
  function itemRow(it, idx) {
    return `
      <div class="stf-item-row" data-idx="${idx}">
        <span class="stf-item-type">${{ score: 'คะแนน', check: 'ส่ง/ไม่ส่ง', rating: 'ดาว 1–5', text: 'ข้อความ' }[it.type] || ''}</span>
        <input type="text" value="${esc(it.label)}" maxlength="60" data-f="label" aria-label="ชื่อหัวข้อ">
        ${it.type === 'score' ? `<label class="stf-item-max">เต็ม<input type="number" min="1" step="1" value="${esc(it.max || '')}" data-f="max"></label>` : ''}
        <button type="button" class="stf-btn-x" data-rm="${idx}" aria-label="ลบหัวข้อ"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }

  function renderItems() {
    $('stfSessItems').innerHTML = state.editing.items.map(itemRow).join('') || '<p class="stf-empty small">ยังไม่มีหัวข้อคะแนน (เพิ่มได้จากปุ่มด้านล่าง หรือบันทึกเฉพาะความประพฤติ)</p>';
  }

  function openSessionModal(s) {
    state.editing = s
      ? { id: s.id, date: s.date || todayBkk(), title: s.title || '', items: JSON.parse(JSON.stringify(s.items || [])) }
      : { id: null, date: todayBkk(), title: '', items: [] };
    $('stfSessionModalTitle').textContent = s ? `แก้ไขครั้งที่ ${s.no}` : `เพิ่มครั้งที่ ${(state.sessions.reduce((m, x) => Math.max(m, x.no), 0)) + 1}`;
    $('stfSessDate').value = state.editing.date;
    $('stfSessTitle').value = state.editing.title;
    renderItems();
    $('stfSessionModal').hidden = false;
  }

  $('stfSessItems').addEventListener('input', e => {
    const row = e.target.closest('[data-idx]');
    if (!row) return;
    const it = state.editing.items[Number(row.dataset.idx)];
    if (e.target.dataset.f === 'label') it.label = e.target.value;
    if (e.target.dataset.f === 'max') it.max = Number(e.target.value) || null;
  });
  $('stfSessItems').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (!rm) return;
    state.editing.items.splice(Number(rm.dataset.rm), 1);
    renderItems();
  });
  document.querySelector('.stf-item-add').addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const p = ITEM_PRESET[b.dataset.add];
    state.editing.items.push({ id: `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, type: b.dataset.add, label: p.label, ...(p.max ? { max: p.max } : {}) });
    renderItems();
  });
  $('stfSessCancel').addEventListener('click', () => { $('stfSessionModal').hidden = true; });
  $('stfSessionModal').addEventListener('click', e => { if (e.target === $('stfSessionModal')) $('stfSessionModal').hidden = true; });

  $('stfSessionForm').addEventListener('submit', async e => {
    e.preventDefault();
    const ed = state.editing;
    const items = ed.items.map(it => ({ ...it, label: String(it.label || '').trim() || ITEM_PRESET[it.type].label }));
    try {
      const res = await rpc('staff_eval_save_session', { p: { id: ed.id, courseId: state.course, date: $('stfSessDate').value, title: $('stfSessTitle').value.trim(), items } });
      $('stfSessionModal').hidden = true;
      toast('บันทึกครั้งประเมินแล้ว');
      await loadSessions(res && res.id);
    } catch (err) {
      toast(errText(err), 'err');
    }
  });

  /* ---------------- เริ่มต้น ---------------- */
  document.addEventListener('newgen:synced', () => {
    if (!state.me) return;
    const before = state.course;
    renderCourseSelect();
    if (state.course !== before) refreshView();
  });

  (async () => {
    if (!window.NewGenAuth || !window.NewGenAuth.getSession()) { showLogin(''); return; }
    const token = await window.NewGenAuth.getAccessToken();
    if (!token) { showLogin(''); return; }
    await loadMe();
  })();
})();
