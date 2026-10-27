/* ===================================================================
   The NEW GEN — ธีม Royal Blue (ใช้คู่กับ assets/css/theme-newgen.css)
   1) ส่วนบนหน้าแรก: ติวเตอร์ 3 คน (รูปตัดพื้นหลัง) พร้อมชื่อและดีกรี
   2) ปกคอร์ส/แพ็คแบบใหม่ สร้างอัตโนมัติจากข้อมูล (ใช้ทุกหน้า แทนรูปปกเดิม)
   3) การ์ดคอร์ส/แพ็คแบบใหม่ (หน้าแรก, หน้ารวมคอร์ส, คอร์สอื่น ๆ ในหน้ารายละเอียด)
   4) รีวิวหน้าแรกแบบภาพเคลื่อนไหว + เอฟเฟคป้าย "ประหยัด"
   ไม่แก้ไขหรือบันทึกข้อมูลใด ๆ — แค่แสดงผล
   =================================================================== */
(function () {
  'use strict';

  // เอฟเฟคที่ใช้บนเว็บจริง: รีวิว a|b|c, ป้ายประหยัด a|b|c
  const FX_DEFAULTS = { reviews: 'a', save: 'a' };

  // รูปตัดพื้นหลังของติวเตอร์
  const CUTOUTS = {
    'tutor-mac': 'assets/images/tutors-cutout/tutor-mac.webp',
    'tutor-non': 'assets/images/tutors-cutout/tutor-non.webp',
    'tutor-au': 'assets/images/tutors-cutout/tutor-au.webp',
    'tutor-anont': 'assets/images/tutors-cutout/tutor-anont.webp'
  };

  const NGTheme = window.NGTheme = window.NGTheme || {};
  // ลิงก์ไปหน้าอื่นของเว็บ (หน้าตัวอย่างเปลี่ยนให้ชี้ไปที่ /preview/)
  NGTheme.pageUrl = NGTheme.pageUrl || (p => p);

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const cutoutOf = t => (t && (t.cutout || CUTOUTS[t.id])) || '';
  const priceNum = v => (window.priceNumberText ? window.priceNumberText(v) : String(v || '').replace(/\s*บ.*$/, '')).trim();
  const toNum = v => parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0;
  const fx = key => document.body.dataset[key === 'reviews' ? 'fxReviews' : 'fxSave'] || FX_DEFAULTS[key];

  function allCourses() { return db() ? db().getCourses() : (window.courseData || []); }
  function allBundles() {
    return (db() ? db().getBundles() : (window.bundlesData || []))
      .slice().sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  }
  function allTutors() { return db() ? db().getTutors() : []; }
  function tutorsFor(ids) {
    const all = allTutors();
    return (ids || []).map(id => all.find(t => t.id === id)).filter(Boolean);
  }

  /* ---------------- โลโก้: สีไล่เฉดของตัว E ---------------- */
  function injectLogoGradient() {
    if (document.getElementById('ngLogoGradDefs')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'ngLogoGradDefs';
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = '<defs><linearGradient id="ngLogoGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3a78ff"/><stop offset="0.5" stop-color="#2152e6"/><stop offset="1" stop-color="#1235b8"/>' +
      '</linearGradient></defs>';
    document.body.prepend(svg);
  }

  /* ---------------- 1) ส่วนบน: ติวเตอร์ 3 คน ---------------- */
  function heroTutors() {
    const home = db() ? db().getHome() : {};
    const tutors = allTutors();
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
      <a href="${esc(NGTheme.pageUrl('tutors.html'))}" class="rd-team-link"><i class="fa-solid fa-user-tie"></i> ดูประวัติทีมติวเตอร์ทั้งหมด <i class="fa-solid fa-arrow-right"></i></a>`;
  }

  /* ---------------- 2) ปกคอร์ส / แพ็ค (สร้างอัตโนมัติ) ---------------- */
  const SHORT = [
    [/วิทยาศาสตร์|วิทย์/, 'วิทย์'], [/คณิตศาสตร์|คณิต/, 'คณิต'], [/ภาษาอังกฤษ|อังกฤษ/, 'อังกฤษ'],
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
    const m = String(text || '').match(/([ปม])\.\s?(\d)(?:\s*[-–]\s*(?:([ปม])\.\s?)?(\d))?/);
    if (!m) return '';
    return m[4] ? `${m[1]}.${m[2]}–${m[3] || m[1]}.${m[4]}` : `${m[1]}.${m[2]}`;
  }
  function courseKind(title) {
    const t = String(title || '');
    const term = (t.match(/\d\/\d{2}/) || [''])[0];
    const kind = /รายเดือน/.test(t) ? 'คอร์สรายเดือน' : (/รายเทอม/.test(t) ? 'คอร์สรายเทอม' : (/private/i.test(t) ? 'คอร์สเดี่ยว' : 'คอร์สเรียน'));
    return term ? `${kind} ${term}` : kind;
  }
  function extraOf(title) {
    const inner = (String(title || '').match(/\(([^)]*)\)/) || ['', ''])[1];
    let rest = inner.replace(/[ปม]\.\s?\d(\s*[-–]\s*([ปม]\.\s?)?\d)?/, '');
    SHORT.forEach(([re]) => { rest = rest.replace(new RegExp(re.source, 'g'), ''); });
    return rest.replace(/^[\s\-–,]+|[\s\-–,]+$/g, '').trim();
  }

  // สีปกสลับน้ำเงิน/แดงตามลำดับในข้อมูล (ปกเดียวกันจึงสีเดียวกันทุกหน้า)
  function toneOf(kind, id) {
    const list = kind === 'bundle' ? allBundles() : allCourses();
    const i = list.findIndex(x => x.id === id);
    return (i < 0 ? 0 : i) % 2 ? 'red' : 'navy';
  }

  function courseBanner(c) {
    const subs = shortSubjects(c.subjects);
    const grade = gradeOf(c.title);
    const isPrivate = /private/i.test(c.title || '') || /คอร์สเดี่ยว/.test(c.title || '');
    const topics = window.getCourseCoverTopics ? window.getCourseCoverTopics(c) : [];
    let big;
    let accent = grade;
    let sub = '';
    if (isPrivate) {
      big = 'Private';
      accent = 'Class';
      sub = subs.join(' · ');
    } else if (subs.length === 1) {
      big = subs[0];
      sub = extraOf(c.title);
    } else if (subs.length > 1) {
      big = `${subs.length} วิชาหลัก`;
      sub = subs.join(' · ');
    } else {
      big = 'คอร์สเรียน';
    }
    const extra = extraOf(c.title);
    return {
      kind: 'course', id: c.id, tone: toneOf('course', c.id),
      symbol: subs.length === 1 ? (SYMBOL[subs[0]] || 'Σ') : 'Σ',
      kicker: courseKind(c.title) + (subs.length > 1 && extra ? ` · ${extra}` : ''),
      big, accent, sub, topics,
      tutors: tutorsFor(c.tutorIds)
    };
  }

  function bundleBanner(b) {
    const kids = allCourses().filter(c => (b.courseIds || []).includes(c.id));
    const subs = shortSubjects(kids.map(k => k.subjects).join(' • '));
    const tutorIds = [...new Set(kids.flatMap(k => k.tutorIds || []))];
    return {
      kind: 'bundle', id: b.id, tone: toneOf('bundle', b.id),
      symbol: subs.map(s => SYMBOL[s]).filter(Boolean)[0] || 'Σ',
      kicker: 'แพ็คเกจสุดคุ้ม',
      big: `แพ็ค ${kids.length} วิชา`, accent: gradeOf(b.name),
      sub: subs.join(' · '), topics: [],
      tutors: tutorsFor(tutorIds), kids, tutorIds
    };
  }

  function bannerHtml(m) {
    const cuts = m.tutors.filter(t => cutoutOf(t)).slice(0, 2);
    const bigText = m.big + (m.accent ? ' ' + m.accent : '');
    return `
      <div class="ng-bn ng-tone-${m.tone} ${m.topics.length ? 'has-topics' : ''}" role="img" aria-label="${esc(bigText)}">
        <span class="ng-bn-sym" aria-hidden="true">${esc(m.symbol)}</span>
        <div class="ng-bn-text">
          <span class="ng-bn-kicker">${esc(m.kicker)}</span>
          <span class="ng-bn-big ${bigText.length > 11 ? 'is-long' : ''}">${esc(m.big)}${m.accent ? ` <em>${esc(m.accent)}</em>` : ''}</span>
          ${m.topics.length
            ? `<ul class="ng-bn-topics">${m.topics.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
            : (m.sub ? `<span class="ng-bn-sub">${esc(m.sub)}</span>` : '')}
        </div>
        ${cuts.length ? `<div class="ng-bn-tutors n${cuts.length}">${cuts.map(t =>
          `<img src="${esc(cutoutOf(t))}" alt="" loading="lazy">`).join('')}</div>` : ''}
      </div>`;
  }

  /* ---------------- 3) การ์ดคอร์ส / แพ็คแบบใหม่ ---------------- */
  const hoursShort = h => {
    const n = String(h || '').match(/(\d+)\s*(ชั่วโมง|ชม)/);
    return n ? `${n[1]} ชม.` : (h ? String(h).slice(0, 18) : '');
  };
  const unitShort = u => String(u || '').replace(/บาท\s*\/?\s*/, '').replace(/\(.*?\)/g, '').trim();

  function saveFlagHtml(save) {
    return `<span class="nx-flag is-save ng-save" data-save="${save}"><i class="fa-solid fa-gift"></i> ประหยัด <b class="ng-save-num">${save.toLocaleString()}</b><span class="ng-save-tail">.-</span></span>`;
  }

  function bundleCard(b) {
    const m = bundleBanner(b);
    const status = window.isBundleFull ? window.isBundleFull(b, allCourses()) : { isFull: false };
    const save = Math.max(0, toNum(b.priceOriginal) - toNum(b.pricePromo));
    return {
      id: b.id, kind: 'bundle', banner: m, full: status.isFull,
      flagHtml: status.isFull
        ? '<span class="nx-flag is-full">🛑 เต็มแล้ว</span>'
        : (save ? saveFlagHtml(save) : '<span class="nx-flag">แพ็คคุ้ม</span>'),
      chips: [`แพ็คเกจ ${m.kids.length} คอร์ส`, 'Onsite & Online'],
      title: b.name,
      meta: [['fa-solid fa-layer-group', `${m.kids.length} คอร์ส`], ['fa-solid fa-chalkboard-user', m.tutors.map(t => t.name).join(', ') || 'ทีมติวเตอร์']],
      price: priceNum(b.pricePromo || '0'), old: b.priceOriginal ? priceNum(b.priceOriginal) : '', unit: 'แพ็ค'
    };
  }

  function courseCard(c) {
    const m = courseBanner(c);
    const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : { isFull: c.isFull === true };
    const rounds = (c.scheduleList || []).filter(r => r && (r.type || r.time)).length;
    const near = !eff.isFull && !eff.onlineOnly && Number(eff.remainingSeats) > 0 && Number(eff.remainingSeats) <= 5;
    const isNew = /ใหม่/.test(c.statusBadge || '');
    let flagHtml = '';
    if (eff.isFull) flagHtml = '<span class="nx-flag is-full">🛑 เต็มแล้ว</span>';
    else if (eff.onlineOnly) flagHtml = '<span class="nx-flag is-online">💻 เหลือเฉพาะออนไลน์</span>';
    else if (near) flagHtml = `<span class="nx-flag is-hot">🔥 เหลือ ${esc(eff.remainingSeats)} ที่</span>`;
    else if (isNew) flagHtml = '<span class="nx-flag">ใหม่</span>';
    return {
      id: c.id, kind: 'course', banner: m, full: eff.isFull, flagHtml,
      chips: [c.categoryLabel || 'คอร์สเรียน', 'Onsite & Online'],
      title: c.title,
      meta: [['fa-regular fa-clock', hoursShort(c.totalHours)], ['fa-regular fa-calendar-check', rounds ? `${rounds} รอบเรียน` : 'นัดเวลาได้'], ['fa-solid fa-chalkboard-user', m.tutors.map(t => t.name).join(', ') || 'ทีมติวเตอร์']].filter(x => x[1]),
      price: priceNum(c.pricePromo || '0'), old: c.priceOriginal ? priceNum(c.priceOriginal) : '', unit: unitShort(c.priceUnit)
    };
  }

  function cardHtml(o) {
    return `
      <article class="course-card nx-card nx-tone-${o.banner.tone} ${o.full ? 'is-full' : ''}" data-kind="${o.kind}" data-id="${esc(o.id)}" tabindex="0" role="link" aria-label="ดูรายละเอียด ${esc(o.title)}">
        <div class="nx-banner">
          ${o.flagHtml}
          ${bannerHtml(o.banner)}
        </div>
        <div class="nx-body">
          <div class="nx-chips">${o.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>
          <h3 class="nx-title">${esc(o.title)}</h3>
          <div class="nx-meta">${o.meta.map(x => `<span><i class="${x[0]}"></i> ${esc(x[1])}</span>`).join('')}</div>
          <div class="nx-foot">
            <div class="nx-price">
              <b>฿${esc(o.price)}</b>${o.old ? `<s>฿${esc(o.old)}</s>` : ''}
              ${o.unit ? `<small>/ ${esc(o.unit)}</small>` : ''}
            </div>
            ${o.full
              ? '<button type="button" class="nx-apply is-full" disabled aria-label="ที่นั่งเต็มแล้ว">เต็ม</button>'
              : `<button type="button" class="nx-apply" data-apply="${esc(o.id)}" aria-label="สมัคร ${esc(o.title)}"><i class="fa-solid fa-pen-to-square"></i><span>สมัคร</span></button>`}
          </div>
        </div>
      </article>`;
  }

  function itemCard(kind, id) {
    if (kind === 'bundle') {
      const b = allBundles().find(x => x.id === id);
      return b ? cardHtml(bundleCard(b)) : '';
    }
    const c = allCourses().find(x => x.id === id);
    return c ? cardHtml(courseCard(c)) : '';
  }

  // วาดใหม่ทั้งกล่องโดยไม่ให้ตัวเฝ้าดู (MutationObserver) วนซ้ำ
  function fillContainer(el, html) {
    el.dataset.ngRendering = '1';
    el.innerHTML = html;
    delete el.dataset.ngRendering;
    countUpSavings(el);
  }

  // หน้าแรก: แพ็คที่แสดงหน้าแรก + คอร์สแนะนำ
  function renderHomeCards() {
    const track = document.getElementById('coursesTrack');
    if (!track || !db()) return;
    const bundles = allBundles().filter(b => b.active !== false && b.showInHome !== false);
    const courses = allCourses().filter(c => c.isFeatured !== false && !c.isHidden);
    fillContainer(track, bundles.map(b => cardHtml(bundleCard(b))).join('') + courses.map(c => cardHtml(courseCard(c))).join(''));
    document.dispatchEvent(new Event('ng:cards'));
  }

  // หน้ารวมคอร์ส / คอร์สอื่น ๆ: ใช้ลำดับและตัวกรองเดิมของหน้า แค่เปลี่ยนหน้าตาการ์ด
  function legacyCardRef(el) {
    if (el.classList.contains('bundle-card')) {
      const m = (el.getAttribute('onclick') || el.innerHTML).match(/openBundleDetailModal\('([^']+)'\)/);
      return m ? { kind: 'bundle', id: m[1] } : null;
    }
    const a = el.querySelector('a[href*="course-detail.html?id="]');
    const m = a && a.getAttribute('href').match(/[?&]id=([^&#]+)/);
    return m ? { kind: 'course', id: decodeURIComponent(m[1]) } : null;
  }

  function convertLegacyGrid(grid) {
    if (!grid || grid.dataset.ngRendering) return;
    const legacy = [...grid.children].filter(el => !el.classList.contains('nx-card') && (el.classList.contains('course-card') || el.classList.contains('bundle-card')));
    if (!legacy.length) return;
    const html = [...grid.children].map(el => {
      if (el.classList.contains('nx-card')) return el.outerHTML;
      const ref = legacyCardRef(el);
      return (ref && itemCard(ref.kind, ref.id)) || el.outerHTML;
    }).join('');
    fillContainer(grid, html);
  }

  function openDetail(card) {
    const id = card.dataset.id;
    if (card.dataset.kind === 'bundle') {
      if (typeof window.openBundleDetailModal === 'function') window.openBundleDetailModal(id);
    } else {
      location.href = NGTheme.pageUrl(`course-detail.html?id=${encodeURIComponent(id)}`);
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

  /* ---------------- ปกเดิมที่เหลือ (ฟอร์มสมัคร, รายละเอียดแพ็ค, หน้ารายละเอียด) → ปกใหม่ ---------------- */
  const normUrl = u => String(u || '').trim().replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '');

  function coverIndex() {
    const map = new Map();
    const add = (url, item) => {
      const k = normUrl(url);
      if (!k) return;
      if (!map.has(k)) map.set(k, []);
      if (!map.get(k).includes(item)) map.get(k).push(item);
    };
    allCourses().forEach(c => {
      [c.cover, c.poster].forEach(u => {
        add(u, c);
        if (window.resolveMediaUrl) add(window.resolveMediaUrl(u), c);
      });
    });
    return map;
  }

  function swapCoverImages() {
    const map = coverIndex();
    if (!map.size) return;
    document.querySelectorAll('img').forEach(img => {
      if (img.closest('.ng-bn, .nx-card')) return;
      const host = img.parentElement;
      if (!host) return;
      const list = map.get(normUrl(img.getAttribute('src'))) || [];
      // รูปเดียวกันใช้หลายคอร์ส → ดูชื่อคอร์สจาก alt
      const c = list.length === 1 ? list[0] : list.find(x => x.title === img.getAttribute('alt'));
      const old = host.querySelector(':scope > .ng-bn-swap');
      if (!c) {
        if (old && img.classList.contains('ng-swapped')) {
          old.remove();
          img.classList.remove('ng-swapped');
        }
        return;
      }
      const m = courseBanner(c);
      const key = `${c.id}|${m.tone}|${m.topics.join(',')}|${m.tutors.map(t => t.id).join(',')}`;
      if (old && old.dataset.key === key) return;
      if (old) old.remove();
      host.classList.add('ng-swap-host');
      img.classList.add('ng-swapped');
      const wrap = document.createElement('div');
      wrap.className = 'ng-bn-swap';
      wrap.dataset.key = key;
      wrap.innerHTML = bannerHtml(m);
      host.appendChild(wrap);
    });
  }

  // หน้ารายละเอียด: ปกเป็นแบนเนอร์แล้ว จึงไม่ต้องเปิดภาพขยาย
  document.addEventListener('click', e => {
    if (e.target.closest('#cdPosterViewBox')) e.stopPropagation();
  }, true);

  /* ---------------- 4) รีวิวหน้าแรก (3 แบบ) ---------------- */
  function reviewList() {
    const all = (db() ? db().getReviews() : (window.reviewsData || [])).filter(r => r && r.image && r.isHidden !== true);
    return all.filter(r => r.isFeatured !== false).concat(all.filter(r => r.isFeatured === false));
  }

  function tileHtml(r, i, extra = '') {
    const name = (r.studentName || '').trim();
    const score = (r.examScore || '').trim();
    return `<button type="button" class="ng-rv-tile ${extra}" data-rv="${i}" aria-label="ดูรีวิว${name ? ' ' + esc(name) : ''} ขนาดเต็ม">
      <img src="${esc(r.image)}" alt="${esc(name || 'รีวิวนักเรียน The NEW GEN')}" loading="lazy" draggable="false">
      ${score ? `<span class="ng-rv-score"><i class="fa-solid fa-trophy"></i> ${esc(score)}</span>` : ''}
    </button>`;
  }

  let coverflow = null;

  function renderReviews(force) {
    const grid = document.getElementById('homeReviewsGrid');
    if (!grid) return;
    const list = reviewList();
    if (!list.length) return;
    const mode = fx('reviews');
    let box = document.getElementById('ngReviews');
    const sig = mode + '|' + list.map(r => r.image).join('|');
    if (box && box.dataset.sig === sig && !force) return;
    grid.classList.add('ng-hidden');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ngReviews';
      grid.insertAdjacentElement('afterend', box);
    }
    box.dataset.sig = sig;
    box.className = `ng-rv ng-rv-${mode}`;
    if (coverflow) { coverflow.stop(); coverflow = null; }

    if (mode === 'a') {
      const rows = [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)].filter(r => r.length);
      box.innerHTML = rows.map((row, ri) => {
        const tiles = row.map(r => tileHtml(r, list.indexOf(r))).join('');
        return `<div class="ng-rv-row ${ri ? 'rev' : ''}"><div class="ng-rv-track" style="--dur:${Math.max(30, row.length * 7)}s">${tiles}${tiles.replace(/data-rv=/g, 'aria-hidden="true" tabindex="-1" data-rv=')}</div></div>`;
      }).join('');
    } else if (mode === 'c') {
      const cols = window.innerWidth < 700 ? 2 : 3;
      const groups = Array.from({ length: cols }, (_, c) => list.filter((_, i) => i % cols === c));
      box.innerHTML = `<div class="ng-rv-wall"><div class="ng-rv-cols">${groups.map((g, ci) => {
        const tiles = g.map(r => tileHtml(r, list.indexOf(r))).join('');
        return `<div class="ng-rv-col ${ci % 2 ? 'down' : ''}" style="--dur:${Math.max(24, g.length * 8)}s">${tiles}${tiles.replace(/data-rv=/g, 'aria-hidden="true" tabindex="-1" data-rv=')}</div>`;
      }).join('')}</div></div>`;
    } else {
      box.innerHTML = `<div class="ng-rv-stage">${list.map((r, i) => tileHtml(r, i)).join('')}</div>
        <div class="ng-rv-nav">
          <button type="button" data-rv-step="-1" aria-label="รีวิวก่อนหน้า"><i class="fa-solid fa-chevron-left"></i></button>
          <span class="ng-rv-count" aria-live="polite"></span>
          <button type="button" data-rv-step="1" aria-label="รีวิวถัดไป"><i class="fa-solid fa-chevron-right"></i></button>
        </div>`;
      coverflow = startCoverflow(box, list.length);
    }

    box.onclick = e => {
      const step = e.target.closest('[data-rv-step]');
      if (step && coverflow) { coverflow.go(coverflow.index + Number(step.dataset.rvStep)); return; }
      const tile = e.target.closest('.ng-rv-tile');
      if (!tile) return;
      const i = Number(tile.dataset.rv);
      if (coverflow && i !== coverflow.index) { coverflow.go(i); return; }
      const r = list[i];
      if (r && typeof window.openReviewLightbox === 'function') window.openReviewLightbox(r.image, r.studentName || '', r.school || '');
    };
  }

  function startCoverflow(box, n) {
    const tiles = [...box.querySelectorAll('.ng-rv-tile')];
    const count = box.querySelector('.ng-rv-count');
    const stage = box.querySelector('.ng-rv-stage');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const api = { index: 0 };
    let timer = null;
    let hover = false;
    function layout() {
      const narrow = window.innerWidth < 700;
      tiles.forEach((t, i) => {
        let d = i - api.index;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        const ad = Math.abs(d);
        const x = d * (narrow ? 46 : 58);
        t.style.transform = `translateX(${x}%) translateZ(${-ad * 150}px) rotateY(${-Math.sign(d) * Math.min(ad, 3) * 22}deg) scale(${ad ? 0.9 : 1})`;
        t.style.opacity = ad > 3 ? '0' : String(1 - ad * 0.18);
        t.style.filter = ad ? `brightness(${1 - ad * 0.12})` : '';
        t.style.zIndex = String(100 - ad);
        t.style.pointerEvents = ad > 3 ? 'none' : '';
        t.classList.toggle('is-center', ad === 0);
        t.tabIndex = ad === 0 ? 0 : -1;
      });
      if (count) count.textContent = `${api.index + 1} / ${n}`;
    }
    api.go = i => { api.index = ((i % n) + n) % n; layout(); restart(); };
    function restart() {
      clearInterval(timer);
      if (!reduce) timer = setInterval(() => { if (!hover && !document.hidden) { api.index = (api.index + 1) % n; layout(); } }, 3200);
    }
    api.stop = () => clearInterval(timer);
    stage.addEventListener('mouseenter', () => { hover = true; });
    stage.addEventListener('mouseleave', () => { hover = false; });
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    stage.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 40) api.go(api.index + (dx < 0 ? 1 : -1));
    });
    layout();
    restart();
    return api;
  }

  /* ---------------- เอฟเฟคป้าย "ประหยัด" แบบ C: ตัวเลขนับขึ้นเมื่อเลื่อนมาเห็น ---------------- */
  let saveObserver = null;
  function countUpSavings(root) {
    if (fx('save') !== 'c' || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!saveObserver) {
      saveObserver = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const flag = en.target;
          const num = flag.querySelector('.ng-save-num');
          const target = Number(flag.dataset.save) || 0;
          if (!num || !target) return;
          const t0 = performance.now();
          const tick = now => {
            const p = Math.min(1, (now - t0) / 1200);
            num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
    }
    (root || document).querySelectorAll('.ng-save').forEach(el => saveObserver.observe(el));
  }

  /* ---------------- เริ่มทำงาน + วาดใหม่เมื่อข้อมูลเปลี่ยน ---------------- */
  function applyFx() {
    if (!document.body.dataset.fxReviews) document.body.dataset.fxReviews = FX_DEFAULTS.reviews;
    if (!document.body.dataset.fxSave) document.body.dataset.fxSave = FX_DEFAULTS.save;
  }

  let swapQueued = false;
  function queueSwap() {
    if (swapQueued) return;
    swapQueued = true;
    setTimeout(() => { swapQueued = false; swapCoverImages(); }, 40);
  }

  function watch() {
    const track = document.getElementById('coursesTrack');
    if (track) {
      new MutationObserver(() => {
        if (track.dataset.ngRendering) return;
        if (track.querySelector('.course-card:not(.nx-card), .bundle-card')) requestAnimationFrame(renderHomeCards);
      }).observe(track, { childList: true });
    }
    ['allCoursesGrid', 'cdRelatedGrid'].forEach(id => {
      const grid = document.getElementById(id);
      if (grid) new MutationObserver(() => convertLegacyGrid(grid)).observe(grid, { childList: true });
    });
    const col = document.querySelector('.hero-right-col');
    if (col) {
      new MutationObserver(() => {
        if (col.querySelector('#heroTutorsGrid')) { delete col.dataset.rdSig; requestAnimationFrame(renderHeroStage); }
      }).observe(col, { childList: true, subtree: true });
    }
    new MutationObserver(muts => {
      if (muts.some(m => !(m.target.closest && m.target.closest('.ng-bn-swap, .ng-rv, .nx-card')))) queueSwap();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  function run() {
    renderHeroStage();
    renderHomeCards();
    ['allCoursesGrid', 'cdRelatedGrid'].forEach(id => convertLegacyGrid(document.getElementById(id)));
    renderReviews();
    swapCoverImages();
  }

  NGTheme.refresh = () => {
    const col = document.querySelector('.hero-right-col');
    if (col) delete col.dataset.rdSig;
    renderHomeCards();
    ['allCoursesGrid', 'cdRelatedGrid'].forEach(id => convertLegacyGrid(document.getElementById(id)));
    renderReviews(true);
    countUpSavings(document);
  };

  function boot() {
    applyFx();
    injectLogoGradient();
    run();
    watch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  document.addEventListener('newgen:synced', () => setTimeout(() => {
    const col = document.querySelector('.hero-right-col');
    if (col) delete col.dataset.rdSig;
    run();
  }, 0));
  window.addEventListener('resize', (() => {
    let w = window.innerWidth;
    return () => {
      // แบบผนังภาพ (C) แบ่งคอลัมน์ตามความกว้างจอ
      if ((w < 700) !== (window.innerWidth < 700) && fx('reviews') === 'c') renderReviews(true);
      w = window.innerWidth;
    };
  })());
})();
