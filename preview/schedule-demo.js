/* ===================================================================
   ตัวอย่างหน้า "ตารางเรียน" แบบการ์ดรายคอร์ส (preview/schedule.html?v=1..3)
   วัน-เวลา = รอบเรียนจริงจากคอร์ส / วิชา-ติวเตอร์-ห้อง = ข้อมูลตัวอย่าง
   (ของจริงจะกรอกเองได้ในหลังบ้าน) — แค่แสดงผล ไม่แก้ไขข้อมูล
   =================================================================== */
(function () {
  'use strict';

  const VERSIONS = {
    1: { name: 'ขาวมินิมอล', icon: 'fa-sun' },
    2: { name: 'กรมท่าเรืองแสง', icon: 'fa-moon' },
    3: { name: 'สีสันตามวิชา', icon: 'fa-palette' }
  };
  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const DAY_RE = [/จันทร์/, /อังคาร/, /พุธ/, /พฤหัส/, /ศุกร์/, /เสาร์/, /อาทิตย์/];
  const SHORT = [
    [/วิทยาศาสตร์|วิทย์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
    [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี']
  ];
  const TONE = { 'คณิต': 'math', 'วิทย์': 'sci', 'อังกฤษ': 'eng', 'ฟิสิกส์': 'phys', 'เคมี': 'chem' };
  const ICON = { 'คณิต': 'fa-square-root-variable', 'วิทย์': 'fa-flask', 'อังกฤษ': 'fa-language', 'ฟิสิกส์': 'fa-atom', 'เคมี': 'fa-flask-vial' };

  // ---- ข้อมูลตัวอย่าง (ของจริงกรอกในหลังบ้าน) ----
  const DEMO_ROOM = { 'คณิต': 'ห้อง 1', 'วิทย์': 'ห้อง 2', 'ฟิสิกส์': 'ห้อง 2', 'เคมี': 'ห้อง 3', 'อังกฤษ': 'ห้อง 4' };
  const DEMO_LOWER_TUTOR = { 'คณิต': 'tutor-au', 'วิทย์': 'tutor-anont', 'อังกฤษ': 'พี่แบม' };
  const UPPER_TUTOR = { 'คณิต': 'tutor-mac', 'ฟิสิกส์': 'tutor-au', 'เคมี': 'tutor-non', 'อังกฤษ': 'tutor-au' };

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const pageUrl = p => (window.NGTheme && window.NGTheme.pageUrl ? window.NGTheme.pageUrl(p) : p);
  const state = { v: Math.min(3, Math.max(1, Number(new URLSearchParams(location.search).get('v')) || 1)) };

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

  // แบ่งรอบยาวเป็นคาบ (พัก 15 นาที) — ใช้เฉพาะสร้างข้อมูลตัวอย่าง
  function splitPeriods(t, n) {
    const span = Math.round((t.end - t.start - 15 * (n - 1)) / n / 5) * 5;
    return Array.from({ length: n }, (_, i) => {
      const s = t.start + i * (span + 15);
      return { start: s, end: i === n - 1 ? t.end : s + span };
    });
  }

  function tutorOf(key) {
    const t = (db() ? db().getTutors() : []).find(x => x.id === key);
    return t ? { name: t.name, id: t.id } : { name: key, id: '' };
  }

  function item(subject, tutorKey) {
    return { subject, tutor: tutorOf(tutorKey), room: DEMO_ROOM[subject] || 'ห้อง 1' };
  }

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

  function buildCourses() {
    if (!db()) return [];
    const cats = db().getCategories();
    const order = id => { const i = cats.findIndex(x => x.id === id); return i < 0 ? 99 : i; };
    return db().getCourses().filter(c => !c.isHidden)
      .sort((a, b) => order(a.category) - order(b.category))
      .map(c => {
        const subs = shortSubjects(c.subjects);
        const cat = cats.find(x => x.id === c.category);
        const inner = (String(c.title || '').match(/\(([^)]*)\)/) || ['', c.title || ''])[1].trim();
        const level = levelOf(c);
        const name = level === 'upper' && subs.length === 1 ? `${subs[0]} ${(inner.match(/ม\.\s?\d/) || [''])[0]}` : inner;
        return {
          c, subs, level, name,
          tone: level === 'upper' && subs.length === 1 ? TONE[subs[0]] : (level === 'primary' ? 'sky' : (level === 'private' ? 'private' : 'royal')),
          levelName: (cat ? cat.name : '').replace(/^ระดับชั้น\s*/, ''),
          kind: /รายเดือน/.test(c.title) ? 'คอร์สรายเดือน' : (/รายเทอม/.test(c.title) ? 'คอร์สรายเทอม' : 'คอร์สเดี่ยว'),
          sessions: (c.scheduleList || []).filter(s => s && (s.type || s.time)).map(s => {
            const day = DAY_RE.findIndex(re => re.test(s.type || ''));
            return {
              day: day < 0 ? 0 : day,
              dayLabel: String(s.type || '').replace(/\([^)]*\)/g, '').replace(/\*/g, '').trim(),
              group: (String(s.type || '').match(/\((กลุ่ม[^)]*)\)/) || [])[1] || '',
              term: (String(s.dates || '').match(/\(([^)]*)\)/) || [])[1] || '',
              periods: periodsFor(c, subs, s)
            };
          })
        };
      });
  }

  /* ---------------- HTML ---------------- */
  function avatar(t) {
    const img = t.id ? `<img src="assets/images/tutors-cutout/${esc(t.id)}.webp" alt="" loading="lazy">` : `<b>${esc(t.name.replace(/^พี่/, '').slice(0, 1))}</b>`;
    return `<span class="sc-ava">${img}</span>`;
  }

  function itemHtml(it) {
    const tone = TONE[it.subject] || 'royal';
    return `
      <div class="sc-item sc-s-${tone}">
        <span class="sc-subj"><i class="fa-solid ${ICON[it.subject] || 'fa-book'}"></i>${esc(it.subject)}</span>
        <span class="sc-tutor">${avatar(it.tutor)}${esc(it.tutor.name)}</span>
        <span class="sc-room"><i class="fa-solid fa-door-open"></i>${esc(it.room)}</span>
      </div>`;
  }

  function periodHtml(p) {
    const items = p.items.map(itemHtml).join(p.alt ? `<div class="sc-alt"><i class="fa-solid fa-right-left"></i> ${esc(p.alt)}</div>` : '');
    return `
      <li class="sc-row">
        <div class="sc-time"><b>${fmt(p.start)}</b><span>–</span><b>${fmt(p.end)}</b></div>
        <div class="sc-items ${p.alt ? 'is-alt' : ''}">${items}</div>
      </li>`;
  }

  function cardHtml(k) {
    return `
      <article class="sc-card sc-tone-${k.tone}">
        <header class="sc-head">
          <div class="sc-head-icons" aria-hidden="true">${(k.subs.length ? k.subs : ['คณิต']).slice(0, 3).map(s => `<i class="fa-solid ${ICON[s] || 'fa-book'}"></i>`).join('')}</div>
          <span class="sc-level">${esc(k.levelName)} · ${esc(k.kind)}</span>
          <h3>${esc(k.name)}</h3>
          <p>${esc(k.subs.join(' · ') || 'ทุกวิชา')}</p>
        </header>
        ${k.sessions.length ? k.sessions.map(s => `
          <section class="sc-sess">
            <div class="sc-sess-head">
              <span class="sc-day sc-d${s.day}"><i class="fa-regular fa-calendar"></i>${esc(s.dayLabel)}</span>
              ${s.group ? `<span class="sc-group">${esc(s.group)}</span>` : ''}
              ${s.term ? `<span class="sc-term">${esc(s.term)}</span>` : ''}
            </div>
            <ol class="sc-rows">${s.periods.map(periodHtml).join('') || '<li class="sc-none">ตามนัดหมาย</li>'}</ol>
          </section>`).join('') : '<p class="sc-none sc-free"><i class="fa-regular fa-calendar-plus"></i> นัดวันและเวลาเรียนได้ตามสะดวก</p>'}
        <footer class="sc-foot">
          <a href="${esc(pageUrl('course-detail.html?id=' + encodeURIComponent(k.c.id)))}">ดูรายละเอียดคอร์ส <i class="fa-solid fa-arrow-right"></i></a>
        </footer>
      </article>`;
  }

  function render() {
    const root = document.getElementById('scheduleDemo');
    if (!root || !db()) return;
    document.body.classList.remove('sc-v1', 'sc-v2', 'sc-v3');
    document.body.classList.add('sc-v' + state.v);
    root.className = 'sc-root';
    root.innerHTML = `
      <div class="sc-note"><i class="fa-solid fa-circle-info"></i> หน้าตัวอย่าง: วัน-เวลาเป็นรอบเรียนจริง ส่วนวิชา ติวเตอร์ และห้องเรียน เป็นข้อมูลสมมติ (ของจริงกรอกเองได้ในหลังบ้าน)</div>
      <div class="sc-list">${buildCourses().map(cardHtml).join('')}</div>`;
    document.querySelectorAll('.sd-switch a').forEach(a => a.classList.toggle('on', Number(a.dataset.v) === state.v));
  }

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
    });
    document.body.appendChild(bar);
  }

  document.addEventListener('DOMContentLoaded', () => { switcher(); render(); });
  document.addEventListener('newgen:synced', () => setTimeout(render, 0));
})();
