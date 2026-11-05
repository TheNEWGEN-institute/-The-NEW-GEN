/* ===================================================================
   หน้า "ตารางเรียน" (schedule.html)
   เลือกระดับชั้น → เลือก "ตารางสรุปรวม" หรือคอร์ส → แสดงเต็มจอ
   ข้อมูลแก้ได้ในหลังบ้าน เมนู "ตารางเรียน" — คอร์สที่ยังไม่ได้แก้ ใช้วัน-เวลาจากรอบเรียนของคอร์ส
   ตารางสรุปรวม (หลายคอร์สในตารางเดียว) ดู getScheduleSummary ใน courses-data.js
   =================================================================== */
(function () {
  'use strict';

  const STORE = 'ngScheduleCourse';
  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const SHORT = [
    [/วิทยาศาสตร์|วิทย์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
    [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี']
  ];
  const TONE = { 'คณิต': 'math', 'วิทย์': 'sci', 'อังกฤษ': 'eng', 'ฟิสิกส์': 'phys', 'เคมี': 'chem' };
  const ICON = { 'คณิต': 'fa-square-root-variable', 'วิทย์': 'fa-flask', 'อังกฤษ': 'fa-language', 'ฟิสิกส์': 'fa-atom', 'เคมี': 'fa-flask-vial' };
  const MODE_TEXT = { alternate: 'สลับกันคนละสัปดาห์', rotate: 'หมุนเวียนตามวัน' };
  const SUMMARY = 'summary:';

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;

  // ค่าที่ขอ: "summary:<ระดับชั้น>" หรือ id คอร์ส (จากลิงก์ ?summary= / ?course= หรือที่เคยเลือก)
  const params = new URLSearchParams(location.search);
  let saved = '';
  try { saved = localStorage.getItem(STORE) || ''; } catch (e) { saved = ''; }
  const state = {
    pick: params.get('summary') ? SUMMARY + params.get('summary') : (params.get('course') || saved),
    level: '',
    shown: ''
  };

  const shortSubjects = text => {
    const out = [];
    String(text || '').split(/[•,·|\/]|และ/).forEach(part => {
      const hit = SHORT.find(([re]) => re.test(part));
      if (hit && !out.includes(hit[1])) out.push(hit[1]);
    });
    return out;
  };
  // สีของวิชา: วิชาเดียว = สีวิชา / หลายวิชารวมกัน = น้ำเงิน
  const toneOfSubject = text => { const s = shortSubjects(text); return s.length === 1 ? (TONE[s[0]] || 'royal') : 'royal'; };
  const dayIndex = d => (window.scheduleDayIndex ? window.scheduleDayIndex(d) : 8);
  const dayClass = di => (di <= 6 ? 'sc-d' + di : 'sc-dx');
  const toMin = t => { const m = String(t || '').match(/(\d{1,2})[.:](\d{2})/); return m ? +m[1] * 60 + +m[2] : 9999; };

  function levelOf(c) {
    const cat = String(c.category || '');
    if (/private/i.test(cat)) return 'private';
    if (/^highschool/.test(cat)) return 'upper';
    if (/^primary/.test(cat)) return 'primary';
    return 'lower';
  }

  function buildData() {
    if (!db()) return { courses: [], levels: [] };
    const cats = db().getCategories();
    const order = id => { const i = cats.findIndex(x => x.id === id); return i < 0 ? 99 : i; };
    const courses = db().getCourses().filter(c => !c.isHidden)
      .map(c => ({ c, view: window.getCourseScheduleView ? window.getCourseScheduleView(c) : { sessions: [] } }))
      .filter(x => !x.view.hidden)
      .sort((a, b) => order(a.c.category) - order(b.c.category))
      .map(({ c, view }) => {
        const subs = shortSubjects(c.subjects);
        const level = levelOf(c);
        const single = level === 'upper' && subs.length === 1;
        const inner = (String(c.title || '').match(/\(([^)]*)\)/) || ['', c.title || ''])[1].trim();
        const cat = cats.find(x => x.id === c.category);
        return {
          c, id: c.id, cat: c.category, subs, single,
          kind: /รายเดือน/.test(c.title) ? 'คอร์สรายเดือน' : (/รายเทอม/.test(c.title) ? 'คอร์สรายเทอม' : 'คอร์สเดี่ยว'),
          name: single ? `${subs[0]} ${(inner.match(/ม\.\s?\d/) || [''])[0]}`.trim() : inner,
          tone: single ? TONE[subs[0]] : (level === 'primary' ? 'sky' : (level === 'private' ? 'private' : 'royal')),
          levelName: (cat ? cat.name : (c.categoryLabel || '')).replace(/^ระดับชั้น\s*/, ''),
          sessions: view.sessions || []
        };
      });
    const levels = cats.filter(x => courses.some(c => c.cat === x.id)).map(x => {
      const summary = window.getScheduleSummary ? window.getScheduleSummary(x.id) : { enabled: false, tables: [] };
      return { id: x.id, name: x.name, shortName: x.name.replace(/^ระดับชั้น\s*/, ''), summary: summary.enabled && summary.tables.length ? summary : null };
    });
    return { courses, levels };
  }

  /* ---------------- HTML ---------------- */
  const timeText = p => [p.start, p.end].filter(Boolean).join(' – ') || 'ตามนัดหมาย';

  function itemHtml(it, p) {
    return `
      <div class="sc-item sc-s-${toneOfSubject(it.subject)}">
        <span class="sc-time">${esc(timeText(p))}</span>
        ${it.subject ? `<span class="sc-subj">วิชา : ${esc(it.subject)}</span>` : ''}
        ${it.tutor ? `<span class="sc-tutor"><span class="sc-emoji" aria-hidden="true">🤓</span>ติวเตอร์ : ${esc(it.tutor)}</span>` : ''}
        ${it.room ? `<span class="sc-room">${esc(it.room)}</span>` : ''}
      </div>`;
  }

  function periodHtml(p) {
    const items = (p.items && p.items.length ? p.items : [{}]);
    const sep = MODE_TEXT[p.mode] ? `<div class="sc-alt"><i class="fa-solid fa-right-left"></i> ${MODE_TEXT[p.mode]}</div>` : '';
    return `<li class="sc-row ${items.length > 1 ? 'is-multi' : ''}">${items.map(it => itemHtml(it, p)).join(sep)}</li>`;
  }

  function headIcons(subs) {
    return `<div class="sc-head-icons" aria-hidden="true">${(subs.length ? subs : ['คณิต']).slice(0, 4).map(s => `<i class="fa-solid ${ICON[s] || 'fa-book'}"></i>`).join('')}</div>`;
  }

  function cardHtml(k) {
    const cover = k.c.cover || k.c.poster;
    const open = k.sessions.length > 0;
    const full = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(k.c).isFull : false;
    return `
      <article class="sc-card sc-tone-${k.tone}">
        <header class="sc-head">
          ${headIcons(k.subs.slice(0, 3))}
          <span class="sc-level">${esc(k.levelName)} · ${esc(k.kind)}</span>
          <h2>${esc(k.name)}</h2>
          <p>${esc(k.c.subjects || '')}${open ? ` · ${k.sessions.length} วันเรียน` : ''}</p>
        </header>
        <div class="sc-body">
          <aside class="sc-side">
            ${cover ? `<div class="sc-cover"><img src="${esc(cover)}" alt="${esc(k.c.title)}"></div>` : ''}
            <div class="sc-actions">
              <a class="sc-btn-detail" href="course-detail.html?id=${encodeURIComponent(k.id)}">รายละเอียดคอร์ส</a>
              ${full ? '' : `<button type="button" class="sc-btn-apply" data-apply="${esc(k.id)}"><i class="fa-solid fa-pen-to-square"></i> สมัครเรียน</button>`}
            </div>
          </aside>
          <div class="sc-sessions">
            ${open ? k.sessions.map(s => `
              <section class="sc-sess ${dayClass(dayIndex(s.day))}">
                <div class="sc-sess-head">
                  <span class="sc-day"><i class="fa-regular fa-calendar"></i>${esc(s.day || 'วันเรียน')}</span>
                  ${s.group ? `<span class="sc-group">${esc(s.group)}</span>` : ''}
                  ${s.note ? `<span class="sc-note-text">${esc(s.note)}</span>` : ''}
                </div>
                <ol class="sc-rows">${(s.periods || []).map(periodHtml).join('') || '<li class="sc-none">ตามนัดหมาย</li>'}</ol>
              </section>`).join('') : '<p class="sc-none sc-free"><i class="fa-regular fa-calendar-plus"></i> คอร์สนี้นัดวันและเวลาเรียนได้ตามสะดวก ทัก LINE สถาบันได้เลยครับ</p>'}
          </div>
        </div>
      </article>`;
  }

  // 1 ตารางสรุป = รวมรอบเรียนจากหลายคอร์ส เรียงตามวันและเวลา
  function summaryTableHtml(t) {
    const rows = [];
    t.sessions.forEach(x => (x.s.periods || []).forEach(p => rows.push({ di: x.di, day: x.s.day, start: toMin(p.start), p })));
    rows.sort((a, b) => a.di - b.di || a.start - b.start);
    const days = [...new Set(rows.map(r => r.di))];
    const oneDay = days.length === 1 && days[0] <= 6;
    const dayName = oneDay ? `วัน${DAYS[days[0]]}` : '';
    const group = oneDay ? t.title.replace(dayName, '').trim() : '';
    const note = (t.sessions.find(x => x.s.note) || { s: {} }).s.note;
    return `
      <section class="sc-sess sc-summary-table ${oneDay ? dayClass(days[0]) : 'sc-dx'}">
        <div class="sc-sess-head">
          <span class="sc-day"><i class="fa-regular fa-calendar"></i>${esc(oneDay ? dayName : t.title)}</span>
          ${group ? `<span class="sc-group sc-group-dark">${esc(group)}</span>` : ''}
          <span class="sc-count">${rows.length} คาบ</span>
          ${note ? `<span class="sc-note-text">${esc(note)}</span>` : ''}
        </div>
        <ol class="sc-rows">
          ${rows.map((r, i) => `${!oneDay && days.length > 1 && (i === 0 || rows[i - 1].di !== r.di)
            ? `<li class="sc-dayline ${dayClass(r.di)}"><span>${esc(r.di <= 6 ? 'วัน' + DAYS[r.di] : r.day)}</span></li>` : ''}${periodHtml(r.p)}`).join('')}
        </ol>
      </section>`;
  }

  function summaryHtml(level, data) {
    const subs = [...new Set(data.courses.filter(k => k.cat === level.id).flatMap(k => k.subs))];
    return `
      <article class="sc-card sc-tone-royal sc-summary">
        <header class="sc-head">
          ${headIcons(subs)}
          <span class="sc-level">${esc(level.shortName)} · ตารางสรุปรวมทุกวิชา</span>
          <h2>ตารางเรียนรวม ${esc(level.shortName)}</h2>
          <p>${esc(subs.join(' · '))} · ${level.summary.tables.length} ตาราง — เลือกคอร์สด้านบนเพื่อดูรายวิชา</p>
        </header>
        <div class="sc-body is-summary">
          <div class="sc-sessions">${level.summary.tables.map(summaryTableHtml).join('')}</div>
        </div>
      </article>`;
  }

  function filterHtml(data, level, inLevel) {
    const opts = (level.summary ? [`<option value="${SUMMARY}${esc(level.id)}" ${state.shown === SUMMARY + level.id ? 'selected' : ''}>📋 ตารางสรุปรวมทุกวิชา</option>`] : [])
      .concat(inLevel.map(k => `<option value="${esc(k.id)}" ${k.id === state.shown ? 'selected' : ''}>${esc(k.single ? k.subs[0] + ' · ' + k.kind : k.kind + ' · ' + k.name)}</option>`));
    return `
      <div class="sf">
        <label class="sf-select"><span><i class="fa-solid fa-graduation-cap"></i> ระดับชั้น</span>
          <select data-select="level" aria-label="เลือกระดับชั้น">${data.levels.map(l => `<option value="${esc(l.id)}" ${l.id === level.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
        </label>
        <label class="sf-select"><span><i class="fa-solid fa-book-open"></i> คอร์ส</span>
          <select data-select="course" aria-label="เลือกคอร์ส" ${opts.length < 2 ? 'disabled' : ''}>${opts.join('')}</select>
        </label>
        <button type="button" class="sf-share" data-share><i class="fa-solid fa-link"></i> คัดลอกลิงก์ตารางนี้</button>
      </div>`;
  }

  // ระดับชั้นที่เปิดตารางสรุปไว้ → เปิดตารางสรุปก่อน / ไม่เปิด → คอร์สแรก
  const defaultFor = (level, data) => (level.summary ? SUMMARY + level.id : ((data.courses.find(x => x.cat === level.id) || {}).id || ''));

  const shareUrl = () => `${location.origin}${location.pathname}?${state.shown.startsWith(SUMMARY) ? 'summary=' + encodeURIComponent(state.shown.slice(SUMMARY.length)) : 'course=' + encodeURIComponent(state.shown)}`;

  function render() {
    const root = document.getElementById('scheduleRoot');
    if (!root || !db()) return;
    const data = buildData();
    if (!data.courses.length) {
      root.innerHTML = '<p class="sc-none sc-free">ยังไม่มีตารางเรียนในขณะนี้</p>';
      return;
    }
    // ค่าที่ขออาจยังไม่มาตอนข้อมูลจริงยังโหลดไม่เสร็จ → แสดงตัวแรกไปก่อน แต่ไม่ลบค่าที่ขอ
    let level = null;
    let course = null;
    if (state.pick.startsWith(SUMMARY)) {
      level = data.levels.find(l => l.id === state.pick.slice(SUMMARY.length) && l.summary) || null;
    } else {
      course = data.courses.find(x => x.id === state.pick) || null;
      if (course) level = data.levels.find(l => l.id === course.cat);
    }
    const picked = Boolean(level);
    if (!level) level = data.levels[0];
    if (!level) return; // ข้อมูลระดับชั้นยังไม่มา (รอโหลดจากระบบ)
    state.shown = picked ? (course ? course.id : SUMMARY + level.id) : defaultFor(level, data);
    if (!course && !state.shown.startsWith(SUMMARY)) course = data.courses.find(x => x.id === state.shown);
    state.level = level.id;
    if (picked) {
      try { localStorage.setItem(STORE, state.shown); } catch (e) { /* ไม่เป็นไร */ }
      history.replaceState(null, '', shareUrl());
    }
    const inLevel = data.courses.filter(x => x.cat === level.id);
    root.innerHTML = filterHtml(data, level, inLevel) + (course ? cardHtml(course) : summaryHtml(level, data));
  }

  document.addEventListener('change', e => {
    const sel = e.target.closest('#scheduleRoot select[data-select]');
    if (!sel) return;
    if (sel.dataset.select === 'level') {
      const data = buildData();
      const level = data.levels.find(l => l.id === sel.value);
      state.pick = level ? defaultFor(level, data) : '';
    } else {
      state.pick = sel.value;
    }
    render();
  });

  document.addEventListener('click', e => {
    const ap = e.target.closest('#scheduleRoot .sc-btn-apply[data-apply]');
    if (ap && typeof window.openEnrollmentModal === 'function') { window.openEnrollmentModal(ap.dataset.apply); return; }
    const sh = e.target.closest('#scheduleRoot [data-share]');
    if (sh) {
      const url = shareUrl();
      const done = () => { sh.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกลิงก์แล้ว'; setTimeout(() => { sh.innerHTML = '<i class="fa-solid fa-link"></i> คัดลอกลิงก์ตารางนี้'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt('คัดลอกลิงก์นี้', url)); else prompt('คัดลอกลิงก์นี้', url);
    }
  });

  window.renderSchedulePage = render;
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('newgen:synced', () => setTimeout(render, 0));
})();
