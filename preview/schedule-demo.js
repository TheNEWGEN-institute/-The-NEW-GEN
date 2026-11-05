/* ===================================================================
   ตัวอย่างหน้า "ตารางเรียน" 5 แบบ (preview/schedule.html?v=1..5)
   ใช้รอบเรียนจริงจากหลังบ้าน (คอร์ส → รอบเวลา) — แค่แสดงผล ไม่แก้ไขข้อมูล
   =================================================================== */
(function () {
  'use strict';

  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const DAY_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const DAY_RE = [/จันทร์/, /อังคาร/, /พุธ/, /พฤหัส/, /ศุกร์/, /เสาร์/, /อาทิตย์/];
  const DAY_WORD = '(จันทร์|อังคาร|พุธ|พฤหัส(?:บดี)?|ศุกร์|เสาร์|อาทิตย์)';
  const SHORT = [
    [/วิทยาศาสตร์|วิทย์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
    [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี'], [/ชีววิทยา|ชีวะ/, 'ชีวะ']
  ];
  const SUBJECT_TONE = { 'คณิต': 'math', 'ฟิสิกส์': 'phys', 'เคมี': 'chem', 'อังกฤษ': 'eng' };
  const SUBJECT_ICON = { 'คณิต': 'fa-square-root-variable', 'วิทย์': 'fa-flask', 'อังกฤษ': 'fa-language', 'ฟิสิกส์': 'fa-atom', 'เคมี': 'fa-flask-vial', 'ชีวะ': 'fa-dna' };
  const CUTOUT = id => `assets/images/tutors-cutout/${id}.webp`;
  const VERSIONS = {
    1: { name: 'ปฏิทินรายสัปดาห์', icon: 'fa-calendar-week' },
    2: { name: 'การ์ดรายคอร์ส', icon: 'fa-layer-group' },
    3: { name: 'ตารางสรุป', icon: 'fa-table-list' },
    4: { name: 'ไทม์ไลน์รายวัน', icon: 'fa-timeline' },
    5: { name: 'แดชบอร์ดระดับชั้น', icon: 'fa-chart-simple' }
  };

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const pageUrl = p => (window.NGTheme && window.NGTheme.pageUrl ? window.NGTheme.pageUrl(p) : p);

  const params = new URLSearchParams(location.search);
  const state = {
    v: Math.min(5, Math.max(1, Number(params.get('v')) || 1)),
    level: params.get('level') || 'all',
    subject: 'all',
    day: (new Date().getDay() + 6) % 7 // วันนี้ (0 = จันทร์)
  };

  /* ---------------- แปลงข้อมูลรอบเรียน ---------------- */
  const dayIdx = w => DAY_RE.findIndex(re => re.test(w));

  function parseDays(type) {
    const t = String(type || '');
    if (/ธรรมดา/.test(t)) return { days: [0, 1, 2, 3, 4], flexible: true };
    const range = t.match(new RegExp(DAY_WORD + '\\s*(?:-|–|ถึง)\\s*(?:วัน)?' + DAY_WORD));
    if (range) {
      const a = dayIdx(range[1]);
      const b = dayIdx(range[2]);
      const days = [];
      for (let i = a; i !== (b + 1) % 7; i = (i + 1) % 7) { days.push(i); if (days.length > 7) break; }
      return { days, flexible: false };
    }
    const days = [];
    (t.match(new RegExp(DAY_WORD, 'g')) || []).forEach(w => { const i = dayIdx(w); if (i >= 0 && !days.includes(i)) days.push(i); });
    return { days, flexible: false };
  }

  function parseTime(text) {
    const m = String(text || '').match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
    if (!m) return { start: 9999, end: 9999, label: String(text || 'ตามนัดหมาย').replace(/\s*น\.?\s*$/, '') };
    const p = n => String(n).padStart(2, '0');
    return {
      start: +m[1] * 60 + +m[2],
      end: +m[3] * 60 + +m[4],
      label: `${p(m[1])}.${m[2]} – ${p(m[3])}.${m[4]}`,
      hours: ((+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2])) / 60
    };
  }

  function shortSubjects(text) {
    const out = [];
    String(text || '').split(/[•,·|\/]|และ/).forEach(part => {
      const hit = SHORT.find(([re]) => re.test(part));
      if (hit && !out.includes(hit[1])) out.push(hit[1]);
    });
    return out;
  }

  function levelOf(c) {
    const cat = String(c.category || '');
    if (/private/i.test(cat)) return 'private';
    if (/^highschool/.test(cat)) return 'upper';
    if (/^primary/.test(cat)) return 'primary';
    return 'lower';
  }

  function toneOf(c, subs) {
    const lv = levelOf(c);
    if (lv === 'upper' && subs.length === 1) return SUBJECT_TONE[subs[0]] || 'royal';
    if (lv === 'primary') return 'sky';
    if (lv === 'private') return 'private';
    return 'royal';
  }

  // ชื่อสั้นของคอร์ส เช่น "ฟิสิกส์ ม.4" / "ม.3 ติวสอบเข้า ม.4"
  function shortName(c, subs) {
    const inner = (String(c.title || '').match(/\(([^)]*)\)/) || ['', c.title || ''])[1];
    if (levelOf(c) === 'upper' && subs.length === 1) {
      const g = (inner.match(/ม\.\s?\d/) || [''])[0];
      return `${subs[0]} ${g}`.trim();
    }
    return inner.replace(/\s+/g, ' ').trim();
  }

  function kindOf(title) {
    return /รายเดือน/.test(title || '') ? 'รายเดือน' : (/รายเทอม/.test(title || '') ? 'รายเทอม' : 'คอร์ส');
  }

  function seatOf(c, s) {
    const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : null;
    if (c.forceClosed === true || (eff && eff.isFull)) return { cls: 'full', text: 'ปิดรับสมัคร' };
    const info = window.getRoundSeatInfo ? window.getRoundSeatInfo(s, { courseRound: true }) : null;
    if (!info) return { cls: 'ok', text: 'เปิดรับสมัคร' };
    if (info.closed) return { cls: 'full', text: 'ปิดรับรอบนี้' };
    if (info.onlineOnly) return { cls: 'online', text: 'เหลือเฉพาะออนไลน์' };
    if (info.remaining !== null) return { cls: info.remaining <= 3 ? 'hot' : 'ok', text: `ว่าง ${info.remaining} ที่` };
    return { cls: 'ok', text: 'เปิดรับสมัคร' };
  }

  function buildData() {
    if (!db()) return { courses: [], rounds: [], levels: [] };
    const tutors = db().getTutors();
    const cats = db().getCategories();
    const courses = db().getCourses().filter(c => !c.isHidden).map(c => {
      const subs = shortSubjects(c.subjects);
      const cat = cats.find(x => x.id === c.category);
      const item = {
        c, id: c.id, subs, tone: toneOf(c, subs), level: c.category,
        levelName: (cat ? cat.name : (c.categoryLabel || '')).replace(/^ระดับชั้น\s*/, ''),
        name: shortName(c, subs), kind: kindOf(c.title),
        tutors: (c.tutorIds || []).map(id => tutors.find(t => t.id === id)).filter(Boolean),
        rounds: []
      };
      (c.scheduleList || []).filter(s => s && (s.type || s.time)).forEach((s, i) => {
        const d = parseDays(s.type);
        const tm = parseTime(s.time);
        item.rounds.push({
          course: item, idx: i, raw: s,
          days: d.days, flexible: d.flexible,
          dayLabel: String(s.type || '').replace(/\([^)]*\)/g, '').replace(/\*/g, '').trim() || 'ตามนัดหมาย',
          group: (String(s.type || '').match(/\((กลุ่ม[^)]*)\)/) || [])[1] || '',
          start: tm.start, end: tm.end, time: tm.label, hours: tm.hours,
          term: (String(s.dates || '').match(/\(([^)]*)\)/) || [])[1] || String(s.dates || '').replace(/เปิดเทอม\s*\d\/\d{2}/, '').trim(),
          seat: seatOf(c, s)
        });
      });
      return item;
    });
    const order = cats.map(x => x.id);
    const levels = order.filter(id => courses.some(c => c.level === id)).map(id => {
      const cat = cats.find(x => x.id === id);
      return { id, name: (cat ? cat.name : id).replace(/^ระดับชั้น\s*/, ''), count: courses.filter(c => c.level === id).length };
    });
    return { courses, rounds: courses.flatMap(c => c.rounds), levels };
  }

  function filtered(data) {
    const okLevel = c => state.level === 'all' || c.level === state.level;
    const okSubject = c => state.subject === 'all' || (state.subject === 'mix' ? c.subs.length > 1 : c.subs.length === 1 && c.subs[0] === state.subject);
    const courses = data.courses.filter(c => okLevel(c) && okSubject(c));
    return { courses, rounds: courses.flatMap(c => c.rounds) };
  }

  /* ---------------- ชิ้นส่วนที่ใช้ร่วมกัน ---------------- */
  const subjectText = c => c.subs.length ? c.subs.join(' · ') : 'ทุกวิชา (ตามตกลง)';
  const seatHtml = r => `<span class="sd-seat sd-seat-${r.seat.cls}">${esc(r.seat.text)}</span>`;
  const tutorNames = c => c.tutors.map(t => esc(t.name)).join(', ') || 'ทีมติวเตอร์';

  function avatars(c, max = 3) {
    return `<span class="sd-avatars">${c.tutors.slice(0, max).map(t =>
      `<span class="sd-avatar" title="${esc(t.name)}"><img src="${esc(CUTOUT(t.id))}" alt="" loading="lazy" onerror="this.src='${esc(window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image)}'"></span>`).join('')}</span>`;
  }

  function dayPills(r) {
    if (r.flexible) return `<span class="sd-daypill sd-flex">วันธรรมดา (ตามตกลง)</span>`;
    if (!r.days.length) return `<span class="sd-daypill">${esc(r.dayLabel)}</span>`;
    // วันติดกัน 3 วันขึ้นไป รวมเป็นป้ายเดียว เช่น "จ.–ศ."
    const consecutive = r.days.length >= 3 && r.days.every((d, i) => i === 0 || d === r.days[i - 1] + 1);
    if (consecutive) {
      const a = r.days[0];
      const b = r.days[r.days.length - 1];
      return `<span class="sd-daypill sd-range" style="--da: var(--c${a}); --db: var(--c${b});" title="ทุกวัน${DAYS[a]}–${DAYS[b]}">${DAY_SHORT[a]}–${DAY_SHORT[b]}</span>`;
    }
    return r.days.map(d => `<span class="sd-daypill sd-d${d}" title="${DAYS[d]}">${DAY_SHORT[d]}</span>`).join('');
  }

  const subjectIcons = c => (c.subs.length ? c.subs : ['คณิต']).slice(0, 3)
    .map(s => `<i class="fa-solid ${SUBJECT_ICON[s] || 'fa-book'}"></i>`).join('');

  const detailLink = c => `<a class="sd-link" href="${esc(pageUrl('course-detail.html?id=' + encodeURIComponent(c.id)))}">รายละเอียด <i class="fa-solid fa-arrow-right"></i></a>`;
  const applyBtn = c => (c.rounds.some(r => r.seat.cls !== 'full')
    ? `<button type="button" class="sd-apply" data-apply="${esc(c.id)}"><i class="fa-solid fa-pen-to-square"></i> สมัคร</button>` : '');

  function toolbar(data) {
    const subjects = [['all', 'ทุกวิชา'], ['คณิต', 'คณิต'], ['ฟิสิกส์', 'ฟิสิกส์'], ['เคมี', 'เคมี'], ['อังกฤษ', 'อังกฤษ'], ['mix', 'รวม 3 วิชา']];
    return `
      <div class="sd-toolbar">
        <div class="sd-chips" role="tablist" aria-label="เลือกระดับชั้น">
          <button type="button" class="sd-chip ${state.level === 'all' ? 'on' : ''}" data-level="all">ทุกระดับชั้น <b>${data.courses.length}</b></button>
          ${data.levels.map(l => `<button type="button" class="sd-chip ${state.level === l.id ? 'on' : ''}" data-level="${esc(l.id)}">${esc(l.name)} <b>${l.count}</b></button>`).join('')}
        </div>
        <div class="sd-chips sd-chips-sub" aria-label="เลือกวิชา">
          ${subjects.map(([k, label]) => `<button type="button" class="sd-chip sd-chip-sm sd-tone-${SUBJECT_TONE[k] || (k === 'mix' ? 'royal' : 'none')} ${state.subject === k ? 'on' : ''}" data-subject="${esc(k)}">${k !== 'all' && k !== 'mix' ? `<i class="fa-solid ${SUBJECT_ICON[k]}"></i>` : ''}${esc(label)}</button>`).join('')}
        </div>
      </div>`;
  }

  const empty = () => `<div class="sd-empty"><i class="fa-regular fa-calendar-xmark"></i><p>ไม่พบรอบเรียนตามตัวเลือกนี้ ลองเลือกระดับชั้นหรือวิชาอื่นครับ</p></div>`;

  /* ---------------- แบบที่ 1: ปฏิทินรายสัปดาห์ ---------------- */
  function v1(f) {
    const byDay = DAYS.map((_, d) => f.rounds.filter(r => r.days.includes(d)).sort((a, b) => a.start - b.start));
    const card = r => `
      <article class="sd-wk-item sd-tone-${r.course.tone}">
        <div class="sd-wk-time"><i class="fa-regular fa-clock"></i> ${esc(r.time)}</div>
        <div class="sd-wk-name">${esc(r.course.name)}</div>
        <div class="sd-wk-meta">${esc(r.course.kind)}${r.group ? ' · ' + esc(r.group) : ''}${r.flexible ? ' · ตามตกลง' : ''}</div>
        <div class="sd-wk-foot">${avatars(r.course, 3)}${seatHtml(r)}</div>
      </article>`;
    const today = (new Date().getDay() + 6) % 7;
    return `
      <div class="sd-daytabs" role="tablist" aria-label="เลือกวัน">
        ${DAY_SHORT.map((d, i) => `<button type="button" class="sd-daytab sd-d${i} ${i === state.day ? 'on' : ''}" data-day="${i}">${d}<small>${byDay[i].length}</small></button>`).join('')}
      </div>
      <div class="sd-week">
        ${DAYS.map((d, i) => `
          <section class="sd-wk-col ${i === state.day ? 'is-active' : ''}" data-col="${i}">
            <header class="sd-wk-head sd-d${i}"><span>${d}</span>${i === today ? '<em>วันนี้</em>' : ''}<b>${byDay[i].length}</b></header>
            <div class="sd-wk-list">${byDay[i].length ? byDay[i].map(card).join('') : '<p class="sd-wk-none">ไม่มีรอบเรียน</p>'}</div>
          </section>`).join('')}
      </div>`;
  }

  /* ---------------- แบบที่ 2: การ์ดรายคอร์ส ---------------- */
  function v2(f) {
    return `<div class="sd-cards">${f.courses.map(c => `
      <article class="sd-card sd-tone-${c.tone}">
        <header class="sd-card-head">
          <div class="sd-card-icons" aria-hidden="true">${subjectIcons(c)}</div>
          <span class="sd-card-level">${esc(c.levelName)} · ${esc(c.kind)}</span>
          <h3>${esc(c.name)}</h3>
          <p>${esc(subjectText(c))}</p>
        </header>
        <ul class="sd-card-rounds">
          ${c.rounds.length ? c.rounds.map(r => `
            <li>
              <div class="sd-days">${dayPills(r)}</div>
              <div class="sd-card-time"><b>${esc(r.time)}</b><small>${esc(r.group || r.dayLabel)}${r.term ? ' · ' + esc(r.term) : ''}</small></div>
              ${seatHtml(r)}
            </li>`).join('') : '<li class="sd-card-free"><i class="fa-regular fa-calendar-plus"></i> นัดวันและเวลาเรียนได้ตามสะดวก</li>'}
        </ul>
        <footer class="sd-card-foot">
          <div class="sd-card-tutors">${avatars(c, 4)}<span>${tutorNames(c)}</span></div>
          <div class="sd-card-actions">${detailLink(c)}${applyBtn(c)}</div>
        </footer>
      </article>`).join('')}</div>`;
  }

  /* ---------------- แบบที่ 3: ตารางสรุป ---------------- */
  function v3(f, data) {
    const groups = data.levels.filter(l => f.courses.some(c => c.level === l.id));
    return `<div class="sd-table-wrap">${groups.map(l => {
      const cs = f.courses.filter(c => c.level === l.id);
      return `
        <section class="sd-tgroup">
          <h3 class="sd-tgroup-title"><span>${esc(l.name)}</span><small>${cs.length} คอร์ส · ${cs.reduce((n, c) => n + c.rounds.length, 0)} รอบเรียน</small></h3>
          <table class="sd-table">
            <thead><tr><th>คอร์ส / วิชา</th><th>วันเรียน</th><th>เวลา</th><th>ช่วงเปิดเทอม</th><th>ติวเตอร์</th><th>สถานะ</th></tr></thead>
            <tbody>
              ${cs.map(c => (c.rounds.length ? c.rounds : [null]).map((r, i) => `
                <tr class="${i === 0 ? 'sd-first' : 'sd-cont'} sd-tone-${c.tone}">
                  <td data-label="คอร์ส">${i === 0 ? `<a href="${esc(pageUrl('course-detail.html?id=' + encodeURIComponent(c.id)))}" class="sd-tname"><span class="sd-tdot"></span>${esc(c.name)}</a><small>${esc(c.kind)} · ${esc(subjectText(c))}</small>` : `<span class="sd-tname-cont">${esc(c.name)}</span>`}</td>
                  <td data-label="วันเรียน">${r ? `<div class="sd-days">${dayPills(r)}</div>${r.group ? `<small>${esc(r.group)}</small>` : ''}` : 'ตามนัดหมาย'}</td>
                  <td data-label="เวลา"><b>${r ? esc(r.time) : '-'}</b></td>
                  <td data-label="ช่วงเปิดเทอม">${r && r.term ? esc(r.term) : '-'}</td>
                  <td data-label="ติวเตอร์">${tutorNames(c)}</td>
                  <td data-label="สถานะ">${r ? seatHtml(r) : '<span class="sd-seat sd-seat-ok">เปิดรับสมัคร</span>'}</td>
                </tr>`).join('')).join('')}
            </tbody>
          </table>
        </section>`;
    }).join('')}</div>`;
  }

  /* ---------------- แบบที่ 4: ไทม์ไลน์รายวัน ---------------- */
  function v4(f) {
    const days = DAYS.map((d, i) => ({ i, d, list: f.rounds.filter(r => r.days.includes(i) && !(r.flexible && r.days.length > 1)).sort((a, b) => a.start - b.start) }));
    const flex = f.rounds.filter(r => r.flexible);
    const item = r => `
      <li class="sd-tl-item sd-tone-${r.course.tone}">
        <div class="sd-tl-time"><b>${esc(r.time.split(' – ')[0] || r.time)}</b><small>${esc(r.time.split(' – ')[1] || '')}</small></div>
        <div class="sd-tl-dot" aria-hidden="true"></div>
        <div class="sd-tl-card">
          <div class="sd-tl-top"><span class="sd-tl-name">${esc(r.course.name)}</span>${seatHtml(r)}</div>
          <div class="sd-tl-meta"><span><i class="fa-solid fa-layer-group"></i> ${esc(r.course.levelName)}</span><span><i class="fa-solid fa-book-open"></i> ${esc(subjectText(r.course))}</span>${r.group ? `<span><i class="fa-solid fa-users"></i> ${esc(r.group)}</span>` : ''}</div>
          <div class="sd-tl-foot">${avatars(r.course, 3)}<span>${tutorNames(r.course)}</span>${r.term ? `<span class="sd-tl-term"><i class="fa-regular fa-calendar"></i> ${esc(r.term)}</span>` : ''}</div>
        </div>
      </li>`;
    return `<div class="sd-tl">
      ${days.filter(x => x.list.length).map(x => `
        <section class="sd-tl-day">
          <h3 class="sd-tl-head sd-d${x.i}"><span class="sd-tl-badge">${DAY_SHORT[x.i]}</span>วัน${x.d}<small>${x.list.length} รอบ</small></h3>
          <ol class="sd-tl-list">${x.list.map(item).join('')}</ol>
        </section>`).join('')}
      ${flex.length ? `
        <section class="sd-tl-day">
          <h3 class="sd-tl-head sd-flexhead"><span class="sd-tl-badge">*</span>วันธรรมดา (นัดวันตามตกลง)<small>${flex.length} รอบ</small></h3>
          <ol class="sd-tl-list">${flex.map(item).join('')}</ol>
        </section>` : ''}
    </div>`;
  }

  /* ---------------- แบบที่ 5: แดชบอร์ดระดับชั้น ---------------- */
  function v5(f, data) {
    const levelIds = state.level === 'all' ? data.levels.map(l => l.id) : [state.level];
    return levelIds.map(id => {
      const l = data.levels.find(x => x.id === id);
      const cs = f.courses.filter(c => c.level === id);
      if (!l || !cs.length) return '';
      const rs = cs.flatMap(c => c.rounds);
      const usedDays = DAYS.map((_, i) => rs.filter(r => r.days.includes(i)).length);
      const tutors = [...new Map(cs.flatMap(c => c.tutors).map(t => [t.id, t])).values()];
      return `
        <section class="sd-dash">
          <header class="sd-dash-head">
            <div><span class="sd-dash-kicker">ระดับชั้น</span><h3>${esc(l.name)}</h3></div>
            <div class="sd-dash-stats">
              <div><b>${cs.length}</b><span>คอร์ส</span></div>
              <div><b>${rs.length}</b><span>รอบเรียน</span></div>
              <div><b>${usedDays.filter(Boolean).length}</b><span>วัน/สัปดาห์</span></div>
            </div>
          </header>
          <div class="sd-dash-week" aria-label="วันที่มีเรียน">
            ${DAYS.map((d, i) => `<div class="sd-dash-day ${usedDays[i] ? 'on sd-d' + i : ''}"><span>${DAY_SHORT[i]}</span><b>${usedDays[i] || '–'}</b></div>`).join('')}
          </div>
          <div class="sd-dash-cols">
            ${cs.map(c => `
              <div class="sd-dash-col sd-tone-${c.tone}">
                <div class="sd-dash-col-head"><span class="sd-dash-icons">${subjectIcons(c)}</span><div><b>${esc(c.subs.length === 1 ? c.subs[0] : c.name)}</b><small>${esc(c.kind)} · ${tutorNames(c)}</small></div></div>
                ${c.rounds.length ? c.rounds.map(r => `
                  <div class="sd-dash-round">
                    <div class="sd-days">${dayPills(r)}</div>
                    <div class="sd-dash-time">${esc(r.time)}${r.group ? `<small>${esc(r.group)}</small>` : ''}</div>
                    ${seatHtml(r)}
                  </div>`).join('') : '<div class="sd-dash-round sd-card-free">นัดเวลาเรียนได้</div>'}
                <div class="sd-dash-col-foot">${detailLink(c)}${applyBtn(c)}</div>
              </div>`).join('')}
          </div>
          <footer class="sd-dash-tutors"><span>ทีมติวเตอร์ระดับชั้นนี้</span>${tutors.map(t => `<span class="sd-dash-tutor">${avatars({ tutors: [t] }, 1)}${esc(t.name)}</span>`).join('')}</footer>
        </section>`;
    }).join('');
  }

  /* ---------------- วาดหน้า ---------------- */
  function render() {
    const root = document.getElementById('scheduleDemo');
    if (!root || !db()) return;
    const data = buildData();
    if (state.level !== 'all' && !data.levels.some(l => l.id === state.level)) state.level = 'all';
    const f = filtered(data);
    const views = { 1: v1, 2: v2, 3: v3, 4: v4, 5: v5 };
    root.className = `sd-root sd-v${state.v}`;
    root.innerHTML = toolbar(data) + `
      <div class="sd-summary"><i class="fa-regular fa-calendar-check"></i> พบ <b>${f.courses.length}</b> คอร์ส · <b>${f.rounds.length}</b> รอบเรียน <span>อัปเดตอัตโนมัติจากข้อมูลคอร์สในหลังบ้าน</span></div>
      <div class="sd-view">${f.rounds.length || f.courses.length ? views[state.v](f, data) : empty()}</div>`;
    document.querySelectorAll('.sd-switch a').forEach(a => a.classList.toggle('on', Number(a.dataset.v) === state.v));
  }

  document.addEventListener('click', e => {
    const lv = e.target.closest('[data-level]');
    if (lv) { state.level = lv.dataset.level; render(); return; }
    const sb = e.target.closest('[data-subject]');
    if (sb) { state.subject = sb.dataset.subject; render(); return; }
    const dy = e.target.closest('[data-day]');
    if (dy) { state.day = Number(dy.dataset.day); render(); return; }
    const ap = e.target.closest('.sd-apply[data-apply]');
    if (ap && typeof window.openEnrollmentModal === 'function') window.openEnrollmentModal(ap.dataset.apply);
  });

  // แถบเลือกแบบ (เฉพาะหน้าตัวอย่าง)
  function switcher() {
    const bar = document.createElement('nav');
    bar.className = 'sd-switch';
    bar.setAttribute('aria-label', 'เลือกแบบตารางเรียน');
    bar.innerHTML = '<span>ตัวอย่างตารางเรียน</span>' + Object.keys(VERSIONS).map(n =>
      `<a href="?v=${n}" data-v="${n}"><i class="fa-solid ${VERSIONS[n].icon}"></i> ${n}<small>${VERSIONS[n].name}</small></a>`).join('');
    bar.addEventListener('click', e => {
      const a = e.target.closest('a[data-v]');
      if (!a) return;
      e.preventDefault();
      state.v = Number(a.dataset.v);
      history.replaceState(null, '', '?v=' + state.v);
      render();
      document.getElementById('scheduleDemo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.body.appendChild(bar);
  }

  document.addEventListener('DOMContentLoaded', () => { switcher(); render(); });
  document.addEventListener('newgen:synced', () => setTimeout(render, 0));
})();
