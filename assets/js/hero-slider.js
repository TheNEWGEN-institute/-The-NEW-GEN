/* ===================================================================
   สไลด์หน้าแรก (hero) — ใช้คู่กับ assets/css/hero-slider.css
   window.NGHero.mount(element, { s1: 'glow'|'cine', s2: 1|2|3 })
   รูปที่ 1: ชื่อสถาบัน + สโลแกน + ติวเตอร์ 4 คน | รูปภาพเด็ก 2 รูป (แบบ Glow Panels)
   รูปที่ 2: เปิดรับสมัคร (รูปนักเรียนเฟดทับกัน 3 สไตล์) | รูปที่ 3: ผลงานรุ่นพี่
   =================================================================== */
(function () {
  'use strict';

  const IMG = 'assets/images/';
  const MS = 6500;
  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // ท่า B: พี่นนท์ปกติ + พี่อู๋กลับด้าน (หันเข้าหากัน) พี่อู๋อยู่ด้านหน้า
  const TEAM = [
    ['พี่แม็ค', 'tutors-cutout/tutor-mac.webp', 0],
    ['พี่นนท์', 'tutors-cutout/tutor-non.webp', 2],
    ['พี่อู๋', 'tutors-cutout/tutor-au-flip.webp', 3],
    ['พี่อานนท์', 'tutors-cutout/tutor-anont.webp', 1]
  ];
  const FALLBACK_REVIEWS = [
    'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1792003643929-i955.jpg',
    'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1792003652213-7qqw.jpg',
    'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1792003657406-v97s.jpg'
  ];
  // รูปที่ 2: 4 รูปจางสลับกัน (รูปน้อง 2 คนย้ายมาจากรูปแรก)
const S2_PHOTOS = ['kids-1.jpg', 'class-row.jpg', 'boys-smile.jpg', 'class-wide.jpg'];

  function reviewImages() {
    const db = window.NewGenDB;
    let real = Boolean(window._supabaseReviewsSynced);
    try { real = real || Boolean(localStorage.getItem('newgen_reviews')); } catch (e) { /* ignore */ }
    // ยังไม่มีข้อมูลจริง (เปิดครั้งแรก) → ใช้โปสเตอร์ชุดหลักไปก่อน ไม่ใช้รูปตัวอย่างของระบบ
    const list = real && db && db.getReviews ? db.getReviews().filter(r => r && r.image && r.isHidden !== true) : [];
    const pick = list.slice(0, 3).map(r => (window.resolveMediaUrl ? window.resolveMediaUrl(r.image) : r.image));
    return pick.length === 3 ? pick : FALLBACK_REVIEWS;
  }

  // s1: 'glow' = Glow Panels (2 แผงรูป) | 'cine' = Cinematic Light (รูปเต็มฝั่งขวา เฟดแนวเฉียง แสงวิ่งผ่าน)
  const slide1 = s1 => `
    <div class="hx-grid"></div>
    ${s1 === 'cine' ? '<div class="hx-water">NEW GEN</div>' : `
    <div class="hx-ring" style="width:620px;height:620px;right:-120px;top:60px"></div>
    <div class="hx-ring" style="width:420px;height:420px;right:-20px;top:160px;border-style:dashed"></div>
    <i class="fa-solid fa-star hx-spark" style="right:9%;top:16%;font-size:1rem"></i>
    <i class="fa-solid fa-star hx-spark" style="right:47%;top:46%;font-size:.7rem;animation-delay:.8s"></i>
    <i class="fa-solid fa-star hx-spark" style="right:4%;bottom:14%;font-size:.85rem;animation-delay:1.5s"></i>`}
    <div class="hx-photos${s1 === 'cine' ? ' hx-cine' : ''}">
      <figure class="hx-ph hx-ph-1 hx-kb" data-pop style="--d:0"><img src="${IMG}hero/kids-3.jpg" alt="น้อง ๆ ในห้องเรียน The NEW GEN" fetchpriority="high"></figure>
      <figure class="hx-ph hx-ph-2 hx-kb" data-pop style="--d:1"><img src="${IMG}hero/kids-2.jpg" alt="บรรยากาศห้องเรียน The NEW GEN"></figure>
      ${s1 === 'cine' ? '<div class="hx-seam"></div>' : ''}
    </div>
    <div class="hx-wrap"><div class="hx-left">
      <p class="hx-inst" data-in style="--d:0">สถาบันกวดวิชา</p>
      <h1 class="hx-brand" data-in style="--d:1"><span class="new">The NEW</span> <span class="gen${s1 === 'cine' ? ' hx-shine' : ''}">GEN</span></h1>
      <p class="hx-slogan" data-in style="--d:2">กวดวิชาของเด็ก <span class="hx-grad">GEN ใหม่</span></p>
      <div class="hx-team">${TEAM.map((t, k) => `
        <figure class="hx-tt hx-tt-${k + 1}" style="--i:${t[2]}"><img src="${IMG + t[1]}" alt="${t[0]}"><figcaption>${t[0]}</figcaption></figure>`).join('')}
        <div class="hx-names" aria-hidden="true">${TEAM.map((t, k) => `<span class="hx-nm-${k + 1}">${t[0]}</span>`).join('')}</div>
      </div>
    </div></div>`;

  const LEVELS = `<div class="hx-lv" data-in style="--d:4">
      <div><b>ป.4 – ป.6</b><span>เรียนล่วงหน้า · ติวสอบเข้า ม.1</span></div>
      <div><b>ม.1 – ม.3</b><span>เสริมเกรด · ติวสอบเข้า ม.4</span></div>
      <div><b>ม.4 – ม.6</b><span>คณิต · ฟิสิกส์ · เคมี · อังกฤษ</span></div></div>`;
  const photos = cls => `<div class="${cls}">${S2_PHOTOS.map(p => `<figure class="hx-x"><img src="${IMG}hero/${p}" alt="" loading="lazy"></figure>`).join('')}</div>`;

  const SLIDE2 = {
    1: () => `${photos('hx-cross')}<div class="hx-shade"></div>
      <div class="hx-wrap">
        <span class="hx-kicker" data-in style="--d:0"><i></i> เปิดรับสมัครแล้ว</span>
        <h2 data-in style="--d:1">คอร์สรายเทอม<span class="hx-big">2/69</span></h2>
        <p class="hx-sub" data-in style="--d:2">ห้องเรียนกลุ่มเล็ก ดูแลทั่วถึง เรียนได้ทั้ง Onsite และ Online · ที่นั่งมีจำกัดในแต่ละรอบ</p>
        ${LEVELS}
        <a href="courses.html" class="hx-more" data-in style="--d:5">ดูคอร์สและตารางเรียน <i class="fa-solid fa-arrow-right"></i></a>
      </div>`,
    2: () => `${photos('hx-layer')}<div class="hx-shade"></div>
      <div class="hx-wrap"><div class="hx-card" data-pop style="--d:0">
        <span class="hx-kicker"><i></i> เปิดรับสมัครแล้ว</span>
        <h2>คอร์สรายเทอม <span class="hx-grad">2/69</span><br>ป.4 – ม.6</h2>
        <p class="hx-sub">ห้องเรียนกลุ่มเล็ก ดูแลทั่วถึง · Onsite &amp; Online · ที่นั่งจำกัด</p>
        ${LEVELS.replace(' data-in style="--d:4"', '')}
        <a href="courses.html" class="hx-more">ดูคอร์สและตารางเรียน <i class="fa-solid fa-arrow-right"></i></a>
      </div></div>`,
    3: () => `${photos('hx-cross')}<div class="hx-shade"></div><div class="hx-outline" data-in style="--d:0">2/69</div>
      <div class="hx-wrap">
        <span class="hx-kicker" data-in style="--d:1"><i></i> เปิดรับสมัครแล้ว</span>
        <h2 data-in style="--d:2">คอร์สรายเทอม 2/69<br>ป.4 – ม.6</h2>
        <span class="hx-tagline" data-in style="--d:3"><i class="fa-solid fa-fire"></i> ที่นั่งมีจำกัด สมัครก่อนได้ก่อน</span>
        <p class="hx-sub" data-in style="--d:4">ห้องเรียนกลุ่มเล็ก ดูแลทั่วถึง เรียนได้ทั้ง Onsite และ Online</p>
        <a href="courses.html" class="hx-more" data-in style="--d:5">ดูคอร์สและตารางเรียน <i class="fa-solid fa-arrow-right"></i></a>
      </div>`
  };

  const slide3 = () => `
    <div class="hx-fan">${reviewImages().map((u, i) => `<div class="hx-rv" data-pop style="--d:${i}"><img src="${esc(u)}" alt="ความสำเร็จของรุ่นพี่ The NEW GEN" loading="lazy"></div>`).join('')}</div>
    <div class="hx-wrap"><div class="hx-txt">
      <span class="hx-kicker" data-in style="--d:0"><i></i> ความสำเร็จของรุ่นพี่</span>
      <h2 data-in style="--d:1">รุ่นพี่ <span style="white-space:nowrap">The NEW GEN</span><br><em>สอบติดคณะในฝัน</em></h2>
      <p data-in style="--d:2">วิศวะ คอม จุฬาฯ · นิติศาสตร์ มธ. · บริหารธุรกิจ มศว และอีกมากมาย</p>
      <a href="reviews.html" class="hx-more" data-in style="--d:3">ดูความสำเร็จทั้งหมด <i class="fa-solid fa-arrow-right"></i></a>
    </div></div>`;

  function mount(root, opts) {
    if (!root) return;
    const s2 = SLIDE2[(opts && opts.s2) || 1] ? (opts && opts.s2) || 1 : 1;
    const s1 = opts && opts.s1 === 'cine' ? 'cine' : 'glow';
    let idx = 0, timer = null;
    root.classList.add('hx');
    // การจัดวางรูปแรกบนมือถือ: ใช้จริงแบบ 1 (รูปเด็กจางเป็นฉากหลัง ติวเตอร์ใหญ่ ป้ายชื่อแถวแยก)
    // ดูแบบอื่นได้ด้วย ?hm=2..4
    const hm = (new URLSearchParams(location.search).get('hm') || '').match(/^[1-4]$/);
    root.classList.add('hx-m' + (hm ? hm[0] : '1'));
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'ไฮไลต์ The NEW GEN');
    root.style.setProperty('--hx-ms', MS + 'ms');
    root.innerHTML = `
      <article class="hx-slide hx-s1${s1 === 'cine' ? ' hx-s1-cine' : ''}" aria-roledescription="slide" aria-label="1 / 3">${slide1(s1)}</article>
      <article class="hx-slide hx-s2 hx-s2${'abc'[s2 - 1]}" aria-roledescription="slide" aria-label="2 / 3">${SLIDE2[s2]()}</article>
      <article class="hx-slide hx-s3" aria-roledescription="slide" aria-label="3 / 3">${slide3()}</article>
      <div class="hx-nav">
        <div class="hx-dots">${[0, 1, 2].map(i => `<button type="button" aria-label="ไปสไลด์ ${i + 1}"><i></i></button>`).join('')}</div>
        <button type="button" class="hx-arrow hx-prev" aria-label="สไลด์ก่อนหน้า"><i class="fa-solid fa-chevron-left"></i></button>
        <button type="button" class="hx-arrow hx-next" aria-label="สไลด์ถัดไป"><i class="fa-solid fa-chevron-right"></i></button>
      </div>`;

    function go(n) {
      const slides = root.querySelectorAll('.hx-slide');
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      root.querySelectorAll('.hx-dots button').forEach((b, i) => {
        b.classList.remove('on'); b.classList.toggle('done', i < idx);
        const bar = b.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
        if (i === idx) b.classList.add('on');
      });
      clearTimeout(timer);
      if (!root.classList.contains('is-paused') && !document.hidden) timer = setTimeout(() => go(idx + 1), MS);
    }
    root.querySelector('.hx-prev').onclick = () => go(idx - 1);
    root.querySelector('.hx-next').onclick = () => go(idx + 1);
    root.querySelectorAll('.hx-dots button').forEach((b, i) => { b.onclick = () => go(i); });
    root.addEventListener('mouseenter', () => { root.classList.add('is-paused'); clearTimeout(timer); });
    root.addEventListener('mouseleave', () => { root.classList.remove('is-paused'); go(idx); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else go(idx); });
    let x0 = null;
    root.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });
    // ข้อมูลรีวิวล่าสุดโหลดเสร็จ → อัปเดตโปสเตอร์รุ่นพี่ในรูปที่ 3
    document.addEventListener('newgen:synced', () => {
      const imgs = reviewImages();
      root.querySelectorAll('.hx-rv img').forEach((im, i) => { if (imgs[i] && im.getAttribute('src') !== imgs[i]) im.src = imgs[i]; });
    });
    root.hxGo = go;
    go(0);
  }

  window.NGHero = { mount };
})();
