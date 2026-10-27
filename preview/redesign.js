/* ===================================================================
   หน้าตัวอย่างธีมใหม่ (preview/home-v1..v5.html) — ใช้ข้อมูลจริงและข้อความเดิมของเว็บ
   1) ส่วนบน: ติวเตอร์ 3 คน (รูปตัดพื้นหลัง) วางซ้อนกัน พร้อมชื่อและดีกรี ไม่มีกรอบ
   2) การ์ดแพ็คคอร์ส / คอร์สเดี่ยว แบบใหม่ (หัวการ์ดสร้างอัตโนมัติจากข้อมูล)
   ไม่แก้ไขหรือบันทึกข้อมูลใด ๆ — แค่แสดงผลต่างจากเดิม
   =================================================================== */
(function () {
  'use strict';

  // รูปตัดพื้นหลังของติวเตอร์ (ภายหลังจะย้ายไปตั้งค่าได้ในหลังบ้าน)
  const CUTOUTS = {
    'tutor-mac': 'assets/images/tutors-cutout/tutor-mac.webp',
    'tutor-non': 'assets/images/tutors-cutout/tutor-non.webp',
    'tutor-au': 'assets/images/tutors-cutout/tutor-au.webp',
    'tutor-anont': 'assets/images/tutors-cutout/tutor-anont.webp'
  };

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const cutoutOf = t => (t && (t.cutout || CUTOUTS[t.id])) || '';
  const priceNum = v => (window.priceNumberText ? window.priceNumberText(v) : String(v || '').replace(/\s*บ.*$/, '')).trim();

  /* ---------------- 1) Hero: 3 tutors stage ---------------- */
  function heroTutors() {
    const home = db() ? db().getHome() : {};
    const tutors = db() ? db().getTutors() : [];
    if (!tutors.length) return [];
    const byId = id => (id ? tutors.find(t => t.id === id) : null);
    const left = byId(home.heroTutorLeftId) || tutors[0];
    const center = byId(home.heroTutorCenterId) || tutors[1] || tutors[0];
    const right = byId(home.heroTutorRightId) || tutors[2] || tutors[0];
    return [{ t: left, pos: 'left' }, { t: center, pos: 'center' }, { t: right, pos: 'right' }];
  }

  function renderHeroStage() {
    const col = document.querySelector('.hero-right-col');
    if (!col) return;
    const list = heroTutors();
    if (!list.length) return;
    const sig = list.map(x => x.t.id + (x.t.honor || '')).join('|');
    if (col.dataset.rdSig === sig) return;
    col.dataset.rdSig = sig;
    col.classList.add('rd-stage-col');
    col.innerHTML = `
      <div class="rd-stage" aria-label="ทีมติวเตอร์ The NEW GEN">
        <div class="rd-stage-deco" aria-hidden="true">
          <span class="rd-ring rd-ring-1"></span><span class="rd-ring rd-ring-2"></span><span class="rd-ring rd-ring-3"></span>
          <span class="rd-sym rd-sym-1">∫ f(x) dx</span><span class="rd-sym rd-sym-2">Σ</span><span class="rd-sym rd-sym-3">π</span>
          <span class="rd-sym rd-sym-4">H₂O</span><span class="rd-sym rd-sym-5">F = ma</span>
        </div>
        ${list.map(({ t, pos }) => {
          const src = cutoutOf(t) || (window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image);
          return `
            <figure class="rd-tutor rd-pos-${pos} ${cutoutOf(t) ? '' : 'rd-no-cutout'}">
              <img src="${esc(src)}" alt="${esc(t.name)} ${esc(t.honor || '')}" loading="eager">
            </figure>`;
        }).join('')}
        ${list.map(({ t, pos }) => `
          <div class="rd-tag rd-tag-${pos}">
            <strong>${esc(t.name)}</strong>
            <span><i class="fa-solid fa-graduation-cap"></i> ${esc(t.honor || t.degree || '')}</span>
          </div>`).join('')}
      </div>
      <a href="tutors.html" class="rd-team-link"><i class="fa-solid fa-user-tie"></i> ดูประวัติทีมติวเตอร์ทั้งหมด <i class="fa-solid fa-arrow-right"></i></a>`;
  }

  /* ---------------- 2) New course / bundle cards ---------------- */
  const SHORT = [
    [/วิทยาศาสตร์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
    [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี'], [/ชีววิทยา|ชีวะ/, 'ชีวะ'], [/ภาษาไทย/, 'ไทย'], [/สังคม/, 'สังคม']
  ];
  function shortSubjects(text) {
    const out = [];
    String(text || '').split(/[•,·|\/]|และ/).forEach(part => {
      const hit = SHORT.find(([re]) => re.test(part));
      if (hit && !out.includes(hit[1])) out.push(hit[1]);
    });
    return out;
  }
  const SYMBOL = { 'คณิต': '∫ f(x) dx', 'ฟิสิกส์': 'F = ma', 'เคมี': 'H₂O', 'อังกฤษ': 'A B C', 'วิทย์': 'E = mc²', 'ชีวะ': 'DNA' };
  function gradeOf(text) {
    const m = String(text || '').match(/([ปม])\.\s?(\d)(?:\s*[-–]\s*([ปม])\.\s?(\d))?/);
    if (!m) return '';
    return m[3] ? `${m[1]}.${m[2]}–${m[3]}.${m[4]}` : `${m[1]}.${m[2]}`;
  }
  function courseKind(title) {
    const t = String(title || '');
    const term = (t.match(/\d\/\d{2}/) || [''])[0];
    const kind = /รายเดือน/.test(t) ? 'คอร์สรายเดือน' : (/รายเทอม/.test(t) ? 'คอร์สรายเทอม' : (/private/i.test(t) ? 'คอร์สเดี่ยว Private' : 'คอร์สเรียน'));
    return term ? `${kind} ${term}` : kind;
  }
  function extraOf(title, grade) {
    const inner = (String(title || '').match(/\(([^)]*)\)/) || ['', ''])[1];
    const g = gradeOf(inner);
    let rest = inner;
    if (g) rest = rest.replace(/[ปม]\.\s?\d(\s*[-–]\s*[ปม]\.\s?\d)?/, '');
    SHORT.forEach(([re]) => { rest = rest.replace(new RegExp(re.source, 'g'), ''); });
    rest = rest.replace(/^[\s\-–,]+|[\s\-–,]+$/g, '').trim();
    return rest;
  }
  const hoursShort = h => {
    const n = String(h || '').match(/(\d+)\s*ชั่วโมง/);
    return n ? `${n[1]} ชม.` : (h ? String(h).slice(0, 18) : '');
  };
  const unitShort = u => String(u || '').replace(/บาท\s*\/?\s*/, '').replace(/\(.*?\)/g, '').trim();

  function tutorsFor(ids) {
    const all = db() ? db().getTutors() : [];
    return (ids || []).map(id => all.find(t => t.id === id)).filter(Boolean);
  }

  function bannerTutors(list) {
    const withCut = list.filter(t => cutoutOf(t)).slice(0, 2);
    if (!withCut.length) return '';
    return `<div class="nx-tutors nx-tutors-${withCut.length}">${withCut.map(t =>
      `<img src="${esc(cutoutOf(t))}" alt="${esc(t.name)}" loading="lazy">`).join('')}</div>`;
  }

  function cardHtml(o) {
    return `
      <div class="nx-banner nx-tone-${o.tone}">
        <span class="nx-sym" aria-hidden="true">${esc(o.symbol)}</span>
        ${o.flag ? `<span class="nx-flag ${o.flagClass || ''}">${o.flag}</span>` : ''}
        <div class="nx-banner-text">
          <span class="nx-kicker">${esc(o.kicker)}</span>
          <span class="nx-big ${(o.big + (o.accent || '')).length > 11 ? 'nx-big-sm' : ''}">${esc(o.big)}${o.accent ? ` <em>${esc(o.accent)}</em>` : ''}</span>
          ${o.sub ? `<span class="nx-sub">${esc(o.sub)}</span>` : ''}
        </div>
        ${o.tutorsHtml}
      </div>
      <div class="nx-body">
        <div class="nx-chips">${o.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>
        <h3 class="nx-title">${esc(o.title)}</h3>
        <div class="nx-meta">${o.meta.map(m => `<span><i class="${m[0]}"></i> ${esc(m[1])}</span>`).join('')}</div>
        <div class="nx-foot">
          <div class="nx-price">
            <b>฿${esc(o.price)}</b>${o.old ? `<s>฿${esc(o.old)}</s>` : ''}
            ${o.unit ? `<small>/ ${esc(o.unit)}</small>` : ''}
          </div>
          ${o.full
            ? '<button type="button" class="nx-apply is-full" disabled aria-label="ที่นั่งเต็มแล้ว">เต็ม</button>'
            : `<button type="button" class="nx-apply" data-apply="${esc(o.id)}" aria-label="สมัคร ${esc(o.title)}"><i class="fa-solid fa-pen-to-square"></i><span>สมัคร</span></button>`}
        </div>
      </div>`;
  }

  function renderCards() {
    const track = document.getElementById('coursesTrack');
    if (!track || !db()) return;
    const courses = db().getCourses();
    const bundles = db().getBundles()
      .filter(b => b.active !== false && b.showInHome !== false)
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
    const homeCourses = courses.filter(c => c.isFeatured !== false && !c.isHidden);
    const items = [];
    let i = 0;

    bundles.forEach(b => {
      const kids = courses.filter(c => (b.courseIds || []).includes(c.id));
      const status = window.isBundleFull ? window.isBundleFull(b, courses) : { isFull: false };
      const subs = shortSubjects(kids.map(k => k.subjects).join(' • '));
      const orig = parseInt(String(b.priceOriginal || '').replace(/[^0-9]/g, ''), 10) || 0;
      const promo = parseInt(String(b.pricePromo || '').replace(/[^0-9]/g, ''), 10) || 0;
      const save = orig > promo ? orig - promo : 0;
      const tutorIds = [...new Set(kids.flatMap(k => k.tutorIds || []))];
      items.push({
        id: b.id, kind: 'bundle', tone: i++ % 2 ? 'red' : 'navy',
        symbol: subs.map(s => SYMBOL[s]).filter(Boolean)[0] || 'Σ',
        flag: status.isFull ? '🛑 เต็มแล้ว' : (save ? `ประหยัด ${save.toLocaleString()}.-` : 'แพ็คคุ้ม'),
        flagClass: status.isFull ? 'is-full' : 'is-save',
        kicker: 'แพ็คเกจสุดคุ้ม',
        big: `แพ็ค ${kids.length} วิชา`, accent: gradeOf(b.name),
        sub: subs.join(' · '),
        tutorsHtml: bannerTutors(tutorsFor(tutorIds)),
        chips: [`แพ็คเกจ ${kids.length} คอร์ส`, 'Onsite & Online'],
        title: b.name,
        meta: [['fa-solid fa-layer-group', `${kids.length} คอร์ส`], ['fa-solid fa-chalkboard-user', tutorsFor(tutorIds).map(t => t.name).join(', ') || 'ทีมติวเตอร์']],
        price: priceNum(b.pricePromo || '0'), old: b.priceOriginal ? priceNum(b.priceOriginal) : '', unit: 'แพ็ค',
        full: status.isFull
      });
    });

    homeCourses.forEach(c => {
      const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : { isFull: c.isFull === true };
      const subs = shortSubjects(c.subjects);
      const grade = gradeOf(c.title);
      const rounds = (c.scheduleList || []).filter(r => r && (r.type || r.time)).length;
      const tutors = tutorsFor(c.tutorIds);
      const near = !eff.isFull && !eff.onlineOnly && Number(eff.remainingSeats) > 0 && Number(eff.remainingSeats) <= 5;
      const isNew = /ใหม่/.test(c.statusBadge || '');
      items.push({
        id: c.id, kind: 'course', tone: i++ % 2 ? 'red' : 'navy',
        symbol: subs.length === 1 ? (SYMBOL[subs[0]] || 'Σ') : 'Σ',
        flag: eff.isFull ? '🛑 เต็มแล้ว' : (eff.onlineOnly ? '💻 เหลือเฉพาะออนไลน์' : (near ? `🔥 เหลือ ${eff.remainingSeats} ที่` : (isNew ? 'ใหม่' : ''))),
        flagClass: eff.isFull ? 'is-full' : (eff.onlineOnly ? 'is-online' : (near ? 'is-hot' : '')),
        kicker: courseKind(c.title),
        big: subs.length === 0 ? (grade ? 'คอร์สเรียน' : 'Private Class') : (subs.length === 1 ? subs[0] : `${subs.length} วิชาหลัก`),
        accent: grade,
        sub: subs.length > 1 ? subs.join(' · ') : extraOf(c.title, grade),
        tutorsHtml: bannerTutors(tutors),
        chips: [c.categoryLabel || 'คอร์สเรียน', 'Onsite & Online'],
        title: c.title,
        meta: [['fa-regular fa-clock', hoursShort(c.totalHours)], ['fa-regular fa-calendar-check', rounds ? `${rounds} รอบเรียน` : 'นัดเวลาได้'], ['fa-solid fa-chalkboard-user', tutors.map(t => t.name).join(', ') || 'ทีมติวเตอร์']].filter(m => m[1]),
        price: priceNum(c.pricePromo || '0'), old: c.priceOriginal ? priceNum(c.priceOriginal) : '', unit: unitShort(c.priceUnit),
        full: eff.isFull
      });
    });

    track.dataset.rdRendering = '1';
    track.innerHTML = items.map(o => `
      <article class="course-card nx-card ${o.full ? 'is-full' : ''}" data-kind="${o.kind}" data-id="${esc(o.id)}" tabindex="0" role="link" aria-label="ดูรายละเอียด ${esc(o.title)}">
        ${cardHtml(o)}
      </article>`).join('');
    delete track.dataset.rdRendering;
    document.dispatchEvent(new Event('rd:cards'));
  }

  function openDetail(card) {
    const id = card.dataset.id;
    if (card.dataset.kind === 'bundle') {
      if (typeof window.openBundleDetailModal === 'function') window.openBundleDetailModal(id);
    } else {
      location.href = `course-detail.html?id=${encodeURIComponent(id)}`;
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.nx-apply[data-apply]');
    if (btn) {
      e.stopPropagation();
      if (typeof window.openEnrollmentModal === 'function') window.openEnrollmentModal(btn.dataset.apply);
      return;
    }
    const card = e.target.closest('.nx-card');
    if (card) openDetail(card);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('nx-card')) openDetail(e.target);
  });

  // main.js วาดการ์ด/ส่วนบนแบบเดิมใหม่ทุกครั้งที่ข้อมูลอัปเดต → วาดแบบใหม่ทับทันที
  function watch() {
    const track = document.getElementById('coursesTrack');
    if (track) {
      new MutationObserver(() => {
        if (track.dataset.rdRendering) return;
        if (track.querySelector('.course-card:not(.nx-card), .bundle-card')) requestAnimationFrame(renderCards);
      }).observe(track, { childList: true });
    }
    const col = document.querySelector('.hero-right-col');
    if (col) {
      new MutationObserver(() => {
        if (col.querySelector('#heroTutorsGrid')) { delete col.dataset.rdSig; requestAnimationFrame(renderHeroStage); }
      }).observe(col, { childList: true, subtree: true });
    }
  }

  function run() {
    renderHeroStage();
    renderCards();
  }
  document.addEventListener('DOMContentLoaded', () => { run(); watch(); });
  document.addEventListener('newgen:synced', () => setTimeout(() => {
    const col = document.querySelector('.hero-right-col');
    if (col) delete col.dataset.rdSig;
    run();
  }, 0));

  /* ---------------- version switcher (preview only) ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const cur = (location.pathname.match(/home-v(\d)/) || [])[1];
    const names = { 1: 'Royal Blue', 2: 'Midnight Glow', 3: 'Clean Light', 4: 'Red Energy', 5: 'Aurora' };
    const bar = document.createElement('nav');
    bar.className = 'rd-switcher';
    bar.setAttribute('aria-label', 'เลือกเวอร์ชันหน้าตัวอย่าง');
    bar.innerHTML = `<span class="rd-switcher-label">ตัวอย่างธีม</span>` +
      [1, 2, 3, 4, 5].map(n => `<a href="preview/home-v${n}.html" class="${String(n) === cur ? 'active' : ''}" title="${names[n]}">V${n}<small>${names[n]}</small></a>`).join('') +
      `<a href="index.html" class="rd-switcher-old" title="ดูหน้าแรกแบบเดิม">เดิม</a>`;
    document.body.appendChild(bar);
  });
})();
