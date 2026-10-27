/* ===================================================================
   เครื่องมือเฉพาะหน้าตัวอย่าง (/preview/) — ไม่ใช้บนเว็บจริง
   - ลิงก์ภายในเว็บพาไปหน้าตัวอย่าง (ไม่หลุดไปหน้าเว็บจริง)
   - แถบเลือกเอฟเฟครีวิว / ป้ายประหยัด (จำค่าไว้ในเบราว์เซอร์)
   =================================================================== */
(function () {
  'use strict';

  const PAGES = ['index', 'courses', 'course-detail', 'tutors', 'reviews', 'free-trial', 'faq', 'about'];
  const pageRe = new RegExp('^/(' + PAGES.join('|') + ')\\.html$');
  const STORE = 'ngPreviewFx';

  window.NGTheme = window.NGTheme || {};
  window.NGTheme.pageUrl = p => 'preview/' + String(p).replace(/^\/+/, '');

  // คลิกลิงก์ไปหน้าอื่นของเว็บ → ไปหน้าตัวอย่างแทน
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.defaultPrevented) return;
    let url;
    try { url = new URL(a.getAttribute('href'), document.baseURI); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!pageRe.test(path)) return;
    e.preventDefault();
    location.href = '/preview' + path + url.search + url.hash;
  }, true);

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (err) { saved = {}; }
  if (/^[abc]$/.test(saved.reviews || '')) document.body.dataset.fxReviews = saved.reviews;
  if (/^[abc]$/.test(saved.save || '')) document.body.dataset.fxSave = saved.save;

  const OPTIONS = {
    reviews: { label: 'รีวิว', names: { a: 'สไลด์ 2 แถว', b: '3D หมุนวน', c: 'ผนังภาพเลื่อน' } },
    save: { label: 'ป้ายประหยัด', names: { a: 'แสงวิ่ง', b: 'สติกเกอร์หมุน', c: 'นีออนนับเลข' } }
  };

  function setFx(key, val) {
    document.body.dataset[key === 'reviews' ? 'fxReviews' : 'fxSave'] = val;
    saved[key] = val;
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (err) { /* ไม่เป็นไร */ }
    if (window.NGTheme.refresh) window.NGTheme.refresh();
    paint();
  }

  let bar;
  function paint() {
    if (!bar) return;
    bar.querySelectorAll('button[data-k]').forEach(b => {
      const cur = document.body.dataset[b.dataset.k === 'reviews' ? 'fxReviews' : 'fxSave'];
      b.classList.toggle('active', b.dataset.v === cur);
      b.setAttribute('aria-pressed', b.dataset.v === cur ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = (location.pathname.match(/\/preview\/([\w-]+)\.html$/) || [, 'index'])[1];
    const groups = [];
    if (document.getElementById('homeReviewsGrid')) groups.push('reviews');
    if (document.getElementById('coursesTrack') || document.getElementById('allCoursesGrid')) groups.push('save');
    bar = document.createElement('nav');
    bar.className = 'pv-bar';
    bar.setAttribute('aria-label', 'เครื่องมือหน้าตัวอย่าง');
    bar.innerHTML = `<span class="pv-tag">ตัวอย่างธีมใหม่</span>` +
      groups.map(k => `<div class="pv-group"><span class="pv-label">${OPTIONS[k].label}</span>` +
        ['a', 'b', 'c'].map(v => `<button type="button" data-k="${k}" data-v="${v}" title="${OPTIONS[k].names[v]}">${v.toUpperCase()}<small>${OPTIONS[k].names[v]}</small></button>`).join('') +
        '</div>').join('') +
      `<a class="pv-old" href="/${page === 'index' ? '' : page + '.html'}${location.search}" title="เปิดหน้าเดียวกันบนเว็บจริง (แบบเดิม)">ดูแบบเดิม</a>`;
    bar.addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (b) setFx(b.dataset.k, b.dataset.v);
    });
    document.body.appendChild(bar);
    paint();
  });
})();
