/* ===================================================================
   หน้าแรก: ส่วน "บรรยากาศการเรียนที่ The NEW GEN" (ก่อนส่วนทดลองเรียนฟรี)
   ใช้คู่กับ assets/css/atmosphere.css
   ตอนนี้เป็นตัวอย่าง: แสดงเฉพาะเมื่อเปิด ?atm=1..5 (&cp=1..3 = แนวข้อความ)
   =================================================================== */
(function () {
  'use strict';

  const q = new URLSearchParams(location.search);
  const PREVIEW = (q.get('atm') || '').match(/^[1-5]$/);
  if (!PREVIEW) return;

  const IMG = 'assets/images/atmos/';
  const DEFAULT_PHOTOS = Array.from({ length: 20 }, (_, i) => IMG + 'a' + String(i + 1).padStart(2, '0') + '.jpg');
  const COPY = {
    1: { kicker: 'บรรยากาศการเรียน', title: 'บรรยากาศการเรียนที่ <span class="at-hl">The NEW GEN</span>', desc: 'เป็นกันเอง เรียนสบาย ๆ ไม่กดดัน พี่ ๆ เข้าใจและใส่ใจน้องทุกคน ถามได้ทุกเรื่อง' },
    2: { kicker: 'บรรยากาศการเรียนที่ The NEW GEN', title: 'เรียนสนุก <span class="at-hl">แต่เข้าใจจริง</span>', desc: 'ห้องเรียนกลุ่มเล็ก บรรยากาศสบาย ๆ เหมือนเรียนกับพี่ พร้อมเทคนิคที่ใช้ทำข้อสอบได้จริง' },
    3: { kicker: 'บรรยากาศการเรียนที่ The NEW GEN', title: 'ที่นี่… <span class="at-hl">เหมือนบ้านหลังที่สอง</span>', desc: 'เพื่อนใหม่ พี่ติวเตอร์ที่เข้าใจ และห้องเรียนที่น้อง ๆ อยากมาทุกสัปดาห์' }
  };
  const HIGHLIGHTS = [
    ['fa-face-smile', 'เป็นกันเอง', 'ถามได้ทุกเรื่อง ไม่ต้องเกรงใจ'],
    ['fa-users', 'ห้องเรียนกลุ่มเล็ก', 'พี่ ๆ ดูแลได้ทั่วถึงทุกคน'],
    ['fa-heart', 'เข้าใจน้องทุกคน', 'สอนตามจังหวะของน้อง ๆ']
  ];
  const NAMES = { 1: 'Marquee Wall', 2: 'Bento Mosaic', 3: 'Coverflow', 4: 'Polaroid Board', 5: 'Split Story' };

  let design = Number(PREVIEW[0]);
  let copy = Number((q.get('cp') || '').match(/^[1-3]$/) || [((design - 1) % 3) + 1]);
  let timers = [];
  const photos = () => DEFAULT_PHOTOS.slice();
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const img = (src, i, cls = '') => `<img src="${esc(src)}" alt="บรรยากาศการเรียน The NEW GEN ${i + 1}" loading="lazy" decoding="async" class="${cls}" data-at-i="${i}">`;

  function head(extra = '') {
    const c = COPY[copy];
    return `<div class="at-head">
      <span class="at-kicker"><i class="fa-solid fa-camera-retro"></i> ${c.kicker}</span>
      <h2 class="at-title">${c.title}</h2>
      <p class="at-desc">${c.desc}</p>${extra}
    </div>`;
  }
  const chips = () => `<div class="at-chips">${HIGHLIGHTS.map(h => `<span><i class="fa-solid ${h[0]}"></i> ${h[1]}</span>`).join('')}</div>`;
  const allBtn = n => `<button type="button" class="at-all" data-at-open="0"><i class="fa-solid fa-images"></i> ดูรูปทั้งหมด (${n})</button>`;

  /* ---------- 5 ดีไซน์ ---------- */
  const DESIGNS = {
    // 1) สองแถวเลื่อนสวนทางกันตลอด
    1: P => {
      const half = Math.ceil(P.length / 2);
      const row = (list, off, dir) => `<div class="at-mq at-mq-${dir}"><div class="at-mq-in">${list.concat(list).map((s, k) => `<figure class="at-card">${img(s, off + (k % list.length))}</figure>`).join('')}</div></div>`;
      return `<div class="container">${head(chips())}</div>${row(P.slice(0, half), 0, 'l')}${row(P.slice(half), half, 'r')}<div class="container at-center">${allBtn(P.length)}</div>`;
    },
    // 2) ตารางรูปหลายขนาด สลับรูปเองทีละช่อง
    2: P => `<div class="container"><div class="at-bento-wrap">${head(chips() + allBtn(P.length))}
        <div class="at-bento">${P.slice(0, 10).map((s, i) => `<figure class="at-tile at-t${i + 1}">${img(s, i)}</figure>`).join('')}</div></div></div>`,
    // 3) รูปกลางใหญ่ ข้าง ๆ เอียงแบบ 3 มิติ + แถบรูปย่อ
    3: P => `<div class="container">${head()}</div>
      <div class="at-cf"><div class="at-cf-stage">${P.map((s, i) => `<figure class="at-cf-item" data-k="${i}">${img(s, i)}</figure>`).join('')}</div>
        <button type="button" class="at-cf-btn at-cf-prev" aria-label="รูปก่อนหน้า"><i class="fa-solid fa-chevron-left"></i></button>
        <button type="button" class="at-cf-btn at-cf-next" aria-label="รูปถัดไป"><i class="fa-solid fa-chevron-right"></i></button></div>
      <div class="container"><div class="at-thumbs">${P.map((s, i) => `<button type="button" data-k="${i}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div></div>`,
    // 4) กระดานรูปโพลารอยด์
    4: P => {
      const pos = [[2, 6, -8], [19, 2, 5], [36, 8, -3], [70, 4, 7], [86, 10, -6], [4, 56, 6], [22, 62, -5], [68, 58, -7], [84, 60, 4], [52, 66, 3]];
      return `<div class="container"><div class="at-board">
        <div class="at-board-card">${head(chips() + allBtn(P.length))}</div>
        ${P.slice(0, 10).map((s, i) => `<figure class="at-pol" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--r:${pos[i][2]}deg"><span class="at-tape"></span>${img(s, i)}</figure>`).join('')}
      </div></div>`;
    },
    // 5) ข้อความซ้าย + คอลัมน์รูปเลื่อนขึ้น-ลงด้านขวา
    5: P => {
      const cols = [[], [], []];
      P.forEach((s, i) => cols[i % 3].push([s, i]));
      return `<div class="container"><div class="at-split">
        <div class="at-split-text">${head()}<ul class="at-points">${HIGHLIGHTS.map(h => `<li><i class="fa-solid ${h[0]}"></i><div><b>${h[1]}</b><span>${h[2]}</span></div></li>`).join('')}</ul>${allBtn(P.length)}</div>
        <div class="at-cols">${cols.map((c, k) => `<div class="at-col at-col-${k + 1}"><div class="at-col-in">${c.concat(c).map(([s, i]) => `<figure class="at-card">${img(s, i)}</figure>`).join('')}</div></div>`).join('')}</div>
      </div></div>`;
    }
  };

  /* ---------- ส่วนที่ขยับได้ ---------- */
  function startBento(root, P) {
    const tiles = [...root.querySelectorAll('.at-tile img')];
    let next = tiles.length;
    timers.push(setInterval(() => {
      if (document.hidden) return;
      const im = tiles[Math.floor(Math.random() * tiles.length)];
      const k = next % P.length; next++;
      const fresh = new Image();
      fresh.onload = () => { im.classList.add('at-fade'); setTimeout(() => { im.src = P[k]; im.dataset.atI = k; im.classList.remove('at-fade'); }, 450); };
      fresh.src = P[k];
    }, 2600));
  }

  function startCoverflow(root, P) {
    const items = [...root.querySelectorAll('.at-cf-item')];
    const thumbs = [...root.querySelectorAll('.at-thumbs button')];
    let cur = 0;
    const show = n => {
      cur = (n + P.length) % P.length;
      items.forEach((it, i) => {
        let d = i - cur;
        if (d > P.length / 2) d -= P.length;
        if (d < -P.length / 2) d += P.length;
        it.dataset.d = Math.abs(d) > 3 ? 'x' : d;
      });
      thumbs.forEach((t, i) => t.classList.toggle('on', i === cur));
      const th = thumbs[cur];
      if (th) th.parentElement.scrollTo({ left: th.offsetLeft - th.parentElement.clientWidth / 2 + th.clientWidth / 2, behavior: 'smooth' });
    };
    root.querySelector('.at-cf-prev').onclick = () => show(cur - 1);
    root.querySelector('.at-cf-next').onclick = () => show(cur + 1);
    thumbs.forEach((t, i) => { t.onclick = () => show(i); });
    items.forEach((it, i) => it.addEventListener('click', e => { if (i !== cur) { e.stopPropagation(); show(i); } }, true));
    let x0 = null;
    const st = root.querySelector('.at-cf');
    st.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); });
    let paused = false;
    st.addEventListener('mouseenter', () => { paused = true; });
    st.addEventListener('mouseleave', () => { paused = false; });
    timers.push(setInterval(() => { if (!paused && !document.hidden) show(cur + 1); }, 3500));
    show(0);
  }

  /* ---------- ดูรูปเต็มจอ ---------- */
  function lightbox(P, start) {
    let i = start;
    const box = document.createElement('div');
    box.className = 'at-lb';
    box.innerHTML = `<button type="button" class="at-lb-x" aria-label="ปิด"><i class="fa-solid fa-xmark"></i></button>
      <button type="button" class="at-lb-nav at-lb-prev" aria-label="รูปก่อนหน้า"><i class="fa-solid fa-chevron-left"></i></button>
      <figure><img alt="บรรยากาศการเรียน The NEW GEN"></figure>
      <button type="button" class="at-lb-nav at-lb-next" aria-label="รูปถัดไป"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="at-lb-count"></div>`;
    const im = box.querySelector('img');
    const show = n => { i = (n + P.length) % P.length; im.src = P[i]; box.querySelector('.at-lb-count').textContent = `${i + 1} / ${P.length}`; };
    const close = () => { box.remove(); document.removeEventListener('keydown', key); document.body.style.overflow = ''; };
    const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); };
    box.querySelector('.at-lb-x').onclick = close;
    box.querySelector('.at-lb-prev').onclick = () => show(i - 1);
    box.querySelector('.at-lb-next').onclick = () => show(i + 1);
    box.addEventListener('click', e => { if (e.target === box) close(); });
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); });
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    document.body.appendChild(box);
    show(i);
  }

  /* ---------- วาดส่วน + ตัวสลับตัวอย่าง ---------- */
  let section = null;
  function render() {
    timers.forEach(clearInterval); timers = [];
    const P = photos();
    if (!section) {
      section = document.createElement('section');
      section.id = 'atmosphere';
      const anchor = document.getElementById('free-trial');
      if (!anchor) return;
      anchor.parentNode.insertBefore(section, anchor);
    }
    section.className = `at-section at-d${design}`;
    section.innerHTML = DESIGNS[design](P);
    section.querySelectorAll('[data-at-i]').forEach(el => el.addEventListener('click', () => {
      if (el.closest('.at-cf-item') && el.closest('.at-cf-item').dataset.d !== '0') return;
      lightbox(P, Number(el.dataset.atI));
    }));
    section.querySelectorAll('[data-at-open]').forEach(b => b.addEventListener('click', () => lightbox(P, 0)));
    if (design === 2) startBento(section, P);
    if (design === 3) startCoverflow(section, P);
    const bar = document.querySelector('.at-switch');
    if (bar) {
      bar.querySelectorAll('[data-d]').forEach(b => b.classList.toggle('on', Number(b.dataset.d) === design));
      bar.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', Number(b.dataset.c) === copy));
      bar.querySelector('.at-sw-name').textContent = NAMES[design];
    }
    const u = new URL(location.href); u.searchParams.set('atm', design); u.searchParams.set('cp', copy);
    history.replaceState(null, '', u);
  }

  function switcher() {
    const bar = document.createElement('div');
    bar.className = 'at-switch';
    bar.innerHTML = `<b>บรรยากาศ (ตัวอย่าง)</b><span class="at-sw-name"></span>
      <span class="at-sw-grp">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-d="${n}">${n}</button>`).join('')}</span>
      <span class="at-sw-grp at-sw-cp"><i>ข้อความ</i>${[1, 2, 3].map(n => `<button type="button" data-c="${n}">${'ABC'[n - 1]}</button>`).join('')}</span>`;
    bar.addEventListener('click', e => {
      const d = e.target.closest('[data-d]'), c = e.target.closest('[data-c]');
      if (d) design = Number(d.dataset.d);
      if (c) copy = Number(c.dataset.c);
      if (d || c) { render(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    document.body.appendChild(bar);
  }

  function boot() {
    switcher();
    render();
    setTimeout(() => section && section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
