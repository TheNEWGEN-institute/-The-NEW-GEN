/* ===================================================================
   เครื่องมือเฉพาะหน้าตัวอย่าง (/preview/) — ไม่ใช้บนเว็บจริง
   - ลิงก์ภายในเว็บพาไปหน้าตัวอย่าง (ไม่หลุดไปหน้าเว็บจริง)
   - แถบเลือกเอฟเฟครีวิว / ป้ายประหยัด (จำค่าไว้ในเบราว์เซอร์)
   =================================================================== */
(function () {
  'use strict';

  // มีหน้าตัวอย่างเฉพาะหน้าแรก — ลิงก์ไปหน้าอื่นเปิดหน้าเว็บจริง
  const PAGES = ['index'];
  const pageRe = new RegExp('^/(' + PAGES.join('|') + ')\\.html$');
  const STORE = 'ngPreviewFx';

  window.NGTheme = window.NGTheme || {};
  window.NGTheme.pageUrl = p => {
    const s = String(p).replace(/^\/+/, '');
    return pageRe.test('/' + s.replace(/[?#].*$/, '')) ? 'preview/' + s : s;
  };

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
  const DATA_KEY = { tag: 'fxTag', trust: 'fxTrust' };
  const OPTIONS = {
    tag: { label: 'ป้ายชื่อติวเตอร์', names: { a: 'การ์ดขาว', b: 'ริบบิ้นแดง', c: 'นีออน' } },
    trust: { label: 'คำเน้น 3 ข้อ', names: { a: 'กล่องไอคอนแดง', b: 'ขอบวิ่ง', c: 'การ์ดขาว' } }
  };
  Object.keys(DATA_KEY).forEach(k => {
    document.body.dataset[DATA_KEY[k]] = /^[abc]$/.test(saved[k] || '') ? saved[k] : 'a';
  });

  function setFx(key, val) {
    document.body.dataset[DATA_KEY[key]] = val;
    saved[key] = val;
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (err) { /* ไม่เป็นไร */ }
    if (window.NGTheme.refresh) window.NGTheme.refresh();
    paint();
  }

  let bar;
  function paint() {
    if (!bar) return;
    bar.querySelectorAll('button[data-k]').forEach(b => {
      const cur = document.body.dataset[DATA_KEY[b.dataset.k]];
      b.classList.toggle('active', b.dataset.v === cur);
      b.setAttribute('aria-pressed', b.dataset.v === cur ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = (location.pathname.match(/\/preview\/([\w-]+)\.html$/) || [, 'index'])[1];
    const groups = document.querySelector('.hero-trust-row') ? ['tag', 'trust'] : [];
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
