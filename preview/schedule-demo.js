/* ===================================================================
   ตัวอย่างหน้า "ตารางเรียน" (preview/schedule.html?v=1..3)
   เลือกระดับชั้น → เลือกคอร์ส → แสดงตารางของคอร์สนั้นเต็มจอ
   v = รูปแบบตัวกรอง: 1 ชิป 2 แถว / 2 การ์ดระดับชั้น / 3 ดรอปดาวน์
   วัน-เวลา = รอบเรียนจริงจากคอร์ส / วิชา-ติวเตอร์-ห้อง = ข้อมูลตัวอย่าง
   =================================================================== */
(function () {
  'use strict';

  const VERSIONS = {
    1: { name: 'ชิป 2 แถว', icon: 'fa-grip-lines' },
    2: { name: 'การ์ดระดับชั้น', icon: 'fa-table-cells-large' },
    3: { name: 'ดรอปดาวน์', icon: 'fa-list' }
  };
  const DAY_RE = [/จันทร์/, /อังคาร/, /พุธ/, /พฤหัส/, /ศุกร์/, /เสาร์/, /อาทิตย์/];
  const SHORT = [
    [/วิทยาศาสตร์|วิทย์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
    [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี']
  ];
  const TONE = { 'คณิต': 'math', 'วิทย์': 'sci', 'อังกฤษ': 'eng', 'ฟิสิกส์': 'phys', 'เคมี': 'chem' };
  const ICON = { 'คณิต': 'fa-square-root-variable', 'วิทย์': 'fa-flask', 'อังกฤษ': 'fa-language', 'ฟิสิกส์': 'fa-atom', 'เคมี': 'fa-flask-vial' };
  const STORE = 'ngScheduleCourse';

  // ---- ข้อมูลตัวอย่าง (ของจริงกรอกในหลังบ้าน) ----
  const DEMO_ROOM = { 'คณิต': 'ห้อง 1', 'วิทย์': 'ห้อง 2', 'ฟิสิกส์': 'ห้อง 2', 'เคมี': 'ห้อง 3', 'อังกฤษ': 'ห้อง 4' };
  const DEMO_LOWER_TUTOR = { 'คณิต': 'tutor-au', 'วิทย์': 'tutor-anont', 'อังกฤษ': 'พี่แบม' };
  const UPPER_TUTOR = { 'คณิต': 'tutor-mac', 'ฟิสิกส์': 'tutor-au', 'เคมี': 'tutor-non', 'อังกฤษ': 'tutor-au' };

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const pageUrl = p => (window.NGTheme && window.NGTheme.pageUrl ? window.NGTheme.pageUrl(p) : p);
  const params = new URLSearchParams(location.search);
  let savedCourse = '';
  try { savedCourse = localStorage.getItem(STORE) || ''; } catch (e) { savedCourse = ''; }
  const state = {
    v: Math.min(3, Math.max(1, Number(params.get('v')) || 1)),
    course: params.get('course') || savedCourse,
    level: ''
  };

  const shortSubjects = text => {
    const out = [];
    String(text || '').split(/[•,·|\/]|และ/).forEach(part => {
      const hit = SHORT.find(([re]) => re.test(part));
      if (hit && !out.includes(hit[1])) out.push(hit[1]);
    });
    return out;
  };
  const p2 = n => String(n).padStart(2, '0');
  const fmt = m => `${p2(Math.floor(m / 60))}.${p2(m % 60)}`;

  function parseTime(text) {
    const m = String(text || '').match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
    return m ? { start: +m[1] * 60 + +m[2], end: +m[3] * 60 + +m[4] } : null;
  }

  function splitPeriods(t, n) {
    const span = Math.round((t.end - t.start - 15 * (n - 1)) / n / 5) * 5;
    return Array.from({ length: n }, (_, i) => {
      const s = t.start + i * (span + 15);
      return { start: s, end: i === n - 1 ? t.end : s + span };
    });
  }

  const tutorName = key => {
    const t = (db() ? db().getTutors() : []).find(x => x.id === key);
    return t ? t.name : key;
  };
  const item = (subject, tutorKey) => ({ subject, tutor: tutorName(tutorKey), room: DEMO_ROOM[subject] || 'ห้อง 1' });

  function levelOf(c) {
    const cat = String(c.category || '');
    if (/private/i.test(cat)) return 'private';
    if (/^highschool/.test(cat)) return 'upper';
    if (/^primary/.test(cat)) return 'primary';
    return 'lower';
  }

  function periodsFor(c, subs, round) {
    const t = parseTime(round.time);
    if (!t) return [];
    if (levelOf(c) === 'upper' && subs.length === 1) {
      const pref = UPPER_TUTOR[subs[0]];
      const tid = (c.tutorIds || []).includes(pref) ? pref : (c.tutorIds || [])[0];
      return [{ ...t, items: [item(subs[0], tid)] }];
    }
    const mins = t.end - t.start;
    const n = mins <= 90 ? 1 : (mins <= 200 ? 2 : 3);
    const parts = splitPeriods(t, n);
    const lower = s => item(s, DEMO_LOWER_TUTOR[s]);
    if (n === 1) return [{ ...parts[0], items: ['คณิต', 'วิทย์', 'อังกฤษ'].map(lower), alt: 'หมุนเวียนตามวัน' }];
    if (n === 2) return [{ ...parts[0], items: [lower('คณิต')] }, { ...parts[1], items: [lower('วิทย์'), lower('อังกฤษ')], alt: 'สลับกันคนละสัปดาห์' }];
    return [{ ...parts[0], items: [lower('วิทย์')] }, { ...parts[1], items: [lower('คณิต')] }, { ...parts[2], items: [lower('อังกฤษ')] }];
  }

  function buildData() {
    if (!db()) return { courses: [], levels: [] };
    const cats = db().getCategories();
    const order = id => { const i = cats.findIndex(x => x.id === id); return i < 0 ? 99 : i; };
    const courses = db().getCourses().filter(c => !c.isHidden)
      .sort((a, b) => order(a.category) - order(b.category))
      .map(c => {
        const subs = shortSubjects(c.subjects);
        const cat = cats.find(x => x.id === c.category);
        const inner = (String(c.title || '').match(/\(([^)]*)\)/) || ['', c.title || ''])[1].trim();
        const level = levelOf(c);
        const single = level === 'upper' && subs.length === 1;
        const kind = /รายเดือน/.test(c.title) ? 'คอร์สรายเดือน' : (/รายเทอม/.test(c.title) ? 'คอร์สรายเทอม' : 'คอร์สเดี่ยว');
        const sessions = (c.scheduleList || []).filter(s => s && (s.type || s.time)).map(s => {
          const day = DAY_RE.findIndex(re => re.test(s.type || ''));
          return {
            day: day < 0 ? 0 : day,
            dayLabel: String(s.type || '').replace(/\([^)]*\)/g, '').replace(/\*/g, '').trim(),
            group: (String(s.type || '').match(/\((กลุ่ม[^)]*)\)/) || [])[1] || '',
            term: (String(s.dates || '').match(/\(([^)]*)\)/) || [])[1] || '',
            periods: periodsFor(c, subs, s)
          };
        });
        return {
          c, id: c.id, subs, level, cat: c.category, single, kind,
          name: single ? `${subs[0]} ${(inner.match(/ม\.\s?\d/) || [''])[0]}` : inner,
          // ชื่อบนปุ่มเลือกคอร์ส: ม.ปลาย = ชื่อวิชา / ชั้นอื่น = รายเดือน-รายเทอม
          chip: single ? subs[0] : kind.replace('คอร์ส', ''),
          chipIcon: single ? (ICON[subs[0]] || 'fa-book') : (/รายเดือน/.test(kind) ? 'fa-calendar-day' : 'fa-calendar-week'),
          tone: single ? TONE[subs[0]] : (level === 'primary' ? 'sky' : (level === 'private' ? 'private' : 'royal')),
          levelName: (cat ? cat.name : '').replace(/^ระดับชั้น\s*/, ''),
          tutors: [...new Set(sessions.flatMap(s => s.periods.flatMap(p => p.items.map(i => i.tutor))))],
          sessions
        };
      });
    const levels = cats.filter(x => courses.some(c => c.cat === x.id)).map(x => ({
      id: x.id,
      name: x.name.replace(/^ระดับชั้น\s*/, ''),
      short: (x.name.match(/[ปม]\.\s?\d(\s*-\s*[ปม]\.\s?\d)?/) || [x.name.replace(/^ระดับชั้น\s*/, '').replace(/\s*\(.*$/, '')])[0].replace(/\s+/g, ''),
      note: (x.name.match(/\(([^)]*)\)/) || [])[1] || '',
      count: courses.filter(c => c.cat === x.id).length
    }));
    return { courses, levels };
  }

  /* ---------------- ตัวกรอง 3 แบบ ---------------- */
  function courseChips(list) {
    return list.map(k => `
      <button type="button" class="sf-course sc-tone-${k.tone} ${k.id === state.shown ? 'on' : ''}" data-course="${esc(k.id)}">
        <i class="fa-solid ${k.chipIcon}"></i>${esc(k.chip)}
      </button>`).join('');
  }

  function filterV1(data, inLevel) {
    return `
      <div class="sf sf-v1">
        <div class="sf-row"><span class="sf-label"><b>1</b> ระดับชั้น</span>
          <div class="sf-scroll">${data.levels.map(l => `<button type="button" class="sf-level ${l.id === state.level ? 'on' : ''}" data-level="${esc(l.id)}">${esc(l.short)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</button>`).join('')}</div>
        </div>
        ${inLevel.length > 1 ? `<div class="sf-row"><span class="sf-label"><b>2</b> คอร์ส</span><div class="sf-scroll">${courseChips(inLevel)}</div></div>` : ''}
      </div>`;
  }

  function filterV2(data, inLevel) {
    return `
      <div class="sf sf-v2">
        <p class="sf-title"><i class="fa-solid fa-hand-pointer"></i> เลือกระดับชั้นของน้อง</p>
        <div class="sf-tiles">${data.levels.map(l => `
          <button type="button" class="sf-tile ${l.id === state.level ? 'on' : ''}" data-level="${esc(l.id)}">
            <b>${esc(l.short)}</b><small>${esc(l.note || (l.count > 1 ? l.count + ' คอร์ส' : '1 คอร์ส'))}</small>
          </button>`).join('')}</div>
        ${inLevel.length > 1 ? `<p class="sf-title sf-title-2"><i class="fa-solid fa-layer-group"></i> เลือกคอร์สที่เรียน</p><div class="sf-segs">${courseChips(inLevel)}</div>` : ''}
      </div>`;
  }

  function filterV3(data, inLevel) {
    return `
      <div class="sf sf-v3">
        <label class="sf-select"><span><i class="fa-solid fa-graduation-cap"></i> ระดับชั้น</span>
          <select data-select="level">${data.levels.map(l => `<option value="${esc(l.id)}" ${l.id === state.level ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
        </label>
        <label class="sf-select"><span><i class="fa-solid fa-book-open"></i> คอร์ส</span>
          <select data-select="course" ${inLevel.length < 2 ? 'disabled' : ''}>${inLevel.map(k => `<option value="${esc(k.id)}" ${k.id === state.shown ? 'selected' : ''}>${esc(k.single ? k.subs[0] + ' · ' + k.kind : k.kind + ' · ' + k.name)}</option>`).join('')}</select>
        </label>
        <button type="button" class="sf-share" data-share><i class="fa-solid fa-link"></i> คัดลอกลิงก์ตารางนี้</button>
      </div>`;
  }

  /* ---------------- การ์ดคอร์สเต็มจอ ---------------- */
  function itemHtml(it) {
    return `
      <div class="sc-item sc-s-${TONE[it.subject] || 'royal'}">
        <span class="sc-subj"><i class="fa-solid ${ICON[it.subject] || 'fa-book'}"></i>${esc(it.subject)}</span>
        <span class="sc-tutor"><i class="fa-solid fa-user-tie"></i>${esc(it.tutor)}</span>
        <span class="sc-room"><i class="fa-solid fa-door-open"></i>${esc(it.room)}</span>
      </div>`;
  }

  function periodHtml(p) {
    const items = p.items.map(itemHtml).join(p.alt ? `<div class="sc-alt"><i class="fa-solid fa-right-left"></i> ${esc(p.alt)}</div>` : '');
    return `
      <li class="sc-row">
        <div class="sc-time"><b>${fmt(p.start)}</b><span>–</span><b>${fmt(p.end)}</b></div>
        <div class="sc-items">${items}</div>
      </li>`;
  }

  function cardHtml(k) {
    const cover = k.c.cover || k.c.poster;
    const open = k.sessions.length > 0;
    return `
      <article class="sc-card sc-full sc-tone-${k.tone}">
        <header class="sc-head">
          <div class="sc-head-icons" aria-hidden="true">${(k.subs.length ? k.subs : ['คณิต']).slice(0, 3).map(s => `<i class="fa-solid ${ICON[s] || 'fa-book'}"></i>`).join('')}</div>
          <span class="sc-level">${esc(k.levelName)} · ${esc(k.kind)}</span>
          <h3>${esc(k.name)}</h3>
          <p>${esc(k.subs.join(' · ') || 'ทุกวิชา')} · ${k.sessions.length ? k.sessions.length + ' รอบเรียน' : 'นัดเวลาเรียนได้'}</p>
        </header>
        <div class="sc-body">
          <aside class="sc-side">
            ${cover ? `<div class="sc-cover"><img src="${esc(cover)}" alt="${esc(k.c.title)}"></div>` : ''}
            <ul class="sc-facts">
              <li><i class="fa-solid fa-book-open"></i><span>วิชา</span><b>${esc(k.subs.join(', ') || 'ทุกวิชา')}</b></li>
              <li><i class="fa-solid fa-user-tie"></i><span>ติวเตอร์</span><b>${esc(k.tutors.join(', ') || 'ทีมติวเตอร์')}</b></li>
              ${k.sessions[0] && k.sessions[0].term ? `<li><i class="fa-regular fa-calendar"></i><span>เปิดเทอม</span><b>${esc(k.sessions[0].term)}</b></li>` : ''}
            </ul>
            <div class="sc-actions">
              <a class="sc-btn-detail" href="${esc(pageUrl('course-detail.html?id=' + encodeURIComponent(k.id)))}">รายละเอียดคอร์ส</a>
              ${open ? `<button type="button" class="sc-btn-apply" data-apply="${esc(k.id)}"><i class="fa-solid fa-pen-to-square"></i> สมัครเรียน</button>` : ''}
            </div>
          </aside>
          <div class="sc-sessions">
            ${open ? k.sessions.map(s => `
              <section class="sc-sess">
                <div class="sc-sess-head">
                  <span class="sc-day sc-d${s.day}"><i class="fa-regular fa-calendar"></i>${esc(s.dayLabel)}</span>
                  ${s.group ? `<span class="sc-group">${esc(s.group)}</span>` : ''}
                </div>
                <ol class="sc-rows">${s.periods.map(periodHtml).join('') || '<li class="sc-none">ตามนัดหมาย</li>'}</ol>
              </section>`).join('') : '<p class="sc-none sc-free"><i class="fa-regular fa-calendar-plus"></i> คอร์สนี้นัดวันและเวลาเรียนได้ตามสะดวก ทัก LINE สถาบันได้เลยครับ</p>'}
          </div>
        </div>
      </article>`;
  }

  /* ---------------- วาดหน้า ---------------- */
  function render() {
    const root = document.getElementById('scheduleDemo');
    if (!root || !db()) return;
    const data = buildData();
    if (!data.courses.length) return;
    // คอร์สที่ขอ (จากลิงก์ / ที่เคยเลือก) อาจยังไม่มาตอนข้อมูลจริงยังโหลดไม่เสร็จ → แสดงคอร์สแรกไปก่อน แต่ไม่ลบค่าที่ขอ
    const picked = data.courses.find(x => x.id === state.course);
    const k = picked || data.courses.find(x => x.cat === state.level) || data.courses[0];
    state.shown = k.id;
    state.level = k.cat;
    if (picked) { try { localStorage.setItem(STORE, k.id); } catch (e) { /* ไม่เป็นไร */ } }
    const inLevel = data.courses.filter(x => x.cat === state.level);
    const filters = { 1: filterV1, 2: filterV2, 3: filterV3 };
    root.className = 'sc-root sc-v3 sf-mode-' + state.v;
    root.innerHTML = `
      ${filters[state.v](data, inLevel)}
      <div class="sc-note"><i class="fa-solid fa-circle-info"></i> หน้าตัวอย่าง: วัน-เวลาเป็นรอบเรียนจริง ส่วนวิชา ติวเตอร์ และห้องเรียน เป็นข้อมูลสมมติ</div>
      ${cardHtml(k)}`;
    document.querySelectorAll('.sd-switch a').forEach(a => a.classList.toggle('on', Number(a.dataset.v) === state.v));
    if (picked) history.replaceState(null, '', `?v=${state.v}&course=${encodeURIComponent(k.id)}`);
  }

  document.addEventListener('click', e => {
    const lv = e.target.closest('[data-level]');
    if (lv) {
      state.level = lv.dataset.level;
      const first = buildData().courses.find(x => x.cat === state.level);
      state.course = first ? first.id : '';
      render();
      return;
    }
    const cs = e.target.closest('[data-course]');
    if (cs) { state.course = cs.dataset.course; render(); return; }
    const ap = e.target.closest('.sc-btn-apply[data-apply]');
    if (ap && typeof window.openEnrollmentModal === 'function') { window.openEnrollmentModal(ap.dataset.apply); return; }
    const sh = e.target.closest('[data-share]');
    if (sh) {
      const done = () => { sh.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกลิงก์แล้ว'; setTimeout(render, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
    }
  });

  document.addEventListener('change', e => {
    const sel = e.target.closest('select[data-select]');
    if (!sel) return;
    if (sel.dataset.select === 'level') {
      const first = buildData().courses.find(x => x.cat === sel.value);
      state.course = first ? first.id : '';
    } else {
      state.course = sel.value;
    }
    render();
  });

  function switcher() {
    const bar = document.createElement('nav');
    bar.className = 'sd-switch';
    bar.setAttribute('aria-label', 'เลือกแบบตัวกรอง');
    bar.innerHTML = '<span>แบบตัวกรอง</span>' + Object.keys(VERSIONS).map(n =>
      `<a href="?v=${n}" data-v="${n}"><i class="fa-solid ${VERSIONS[n].icon}"></i> ${n}<small>${VERSIONS[n].name}</small></a>`).join('');
    bar.addEventListener('click', e => {
      const a = e.target.closest('a[data-v]');
      if (!a) return;
      e.preventDefault();
      state.v = Number(a.dataset.v);
      render();
    });
    document.body.appendChild(bar);
  }

  document.addEventListener('DOMContentLoaded', () => { switcher(); render(); });
  document.addEventListener('newgen:synced', () => setTimeout(render, 0));
})();
