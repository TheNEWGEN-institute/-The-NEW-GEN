/* ===================================================================
   นับสถิติผู้เข้าชมเว็บ (ส่งไปที่ track_event ใน Supabase — ดู supabase/15-site-stats.sql)
   เก็บแค่: รหัสสุ่มของเบราว์เซอร์, หน้าที่เปิด, คอร์ส, มาจากไหน, มือถือ/คอม
   ไม่เก็บ IP / ชื่อ / เบอร์โทร
   ไม่นับ: เครื่องที่เคยล็อกอินหลังบ้านหรือหน้าติวเตอร์, บอท, การเปิดไฟล์ในเครื่อง
   =================================================================== */
(function () {
  'use strict';

  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || !window.fetch) return;

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  // เครื่องของแอดมิน/ติวเตอร์ → ไม่นับตลอดไป (แม้ออกจากระบบแล้ว)
  if (ls.get('newgen_admin_session')) ls.set('ng_stats_optout', '1');
  if (ls.get('ng_stats_optout') === '1') return;

  const host = location.hostname;
  const isLocal = location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '';
  if (isLocal && ls.get('ng_stats_debug') !== '1') return;

  const ua = navigator.userAgent || '';
  if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit/i.test(ua)) return;

  function rid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'v' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  let isNew = false;
  let visitor = ls.get('ng_vid');
  if (!visitor || !/^[A-Za-z0-9-]{8,64}$/.test(visitor)) {
    visitor = rid();
    ls.set('ng_vid', visitor);
    isNew = true;
  }

  function detectSource() {
    const q = new URLSearchParams(location.search);
    const utm = (q.get('utm_source') || '').toLowerCase();
    const ref = document.referrer || '';
    let refHost = '';
    try { refHost = ref ? new URL(ref).hostname.toLowerCase() : ''; } catch (e) { refHost = ''; }
    const from = re => re.test(refHost);
    if (/\bLine\//i.test(ua) || /^line/.test(utm) || from(/(^|\.)(line\.me|lin\.ee|line-apps\.com|line\.naver\.jp)$/)) return 'line';
    if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua) || /^(fb|facebook|messenger)/.test(utm) || from(/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/)) return 'facebook';
    if (/Instagram/i.test(ua) || /^(ig|instagram)/.test(utm) || from(/(^|\.)instagram\.com$/)) return 'instagram';
    if (/TikTok|musical_ly|BytedanceWebview/i.test(ua) || /^tiktok/.test(utm) || from(/(^|\.)tiktok\.com$/)) return 'tiktok';
    if (/^(yt|youtube)/.test(utm) || from(/(^|\.)(youtube\.com|youtu\.be)$/)) return 'youtube';
    if (/^google/.test(utm) || from(/(^|\.)google\.[a-z.]+$/)) return 'google';
    if (from(/(^|\.)(bing\.com|yahoo\.com|duckduckgo\.com|yandex\.[a-z]+|naver\.com|baidu\.com)$/)) return 'search';
    if (!ref || refHost === host) return 'direct';
    return 'other';
  }

  // แหล่งที่มาคิดตอนเริ่มเข้าเว็บครั้งนั้น แล้วใช้ต่อทุกหน้าในรอบเดียวกัน
  let source = ss.get('ng_src');
  if (!source) { source = detectSource(); ss.set('ng_src', source); }

  const device = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? 'tablet'
    : (/Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(ua) ? 'mobile' : 'desktop');

  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '').toLowerCase() || 'index';

  function send(kind, courseId) {
    const body = { v: visitor, k: kind, p: page, s: source, d: device };
    if (courseId) body.c = String(courseId).slice(0, 80);
    if (kind === 'view' && isNew) { body.n = true; isNew = false; }
    try {
      fetch(`${cfg.url}/rest/v1/rpc/track_event`, {
        method: 'POST',
        keepalive: true,
        headers: { 'apikey': cfg.anonKey, 'Authorization': `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: body })
      }).catch(() => {});
    } catch (e) { /* stats must never break the page */ }
  }

  // เปิดหน้า (หน้ารายละเอียดคอร์สแนบรหัสคอร์สไปด้วย)
  const courseOnPage = page === 'course-detail' ? new URLSearchParams(location.search).get('id') : null;
  send('view', courseOnPage);

  // เปิดดูรายละเอียดแพ็คเกจ / เปิดฟอร์มสมัคร (ส่งจาก enrollment-modal.js) — นับครั้งเดียวต่อคอร์สต่อหน้า
  const seen = new Set();
  function once(kind, id) {
    if (!id) return;
    const key = kind + '|' + id;
    if (seen.has(key)) return;
    seen.add(key);
    send(kind, id);
  }
  document.addEventListener('newgen:item-view', e => once('course', e.detail && e.detail.id));
  document.addEventListener('newgen:enroll-open', e => once('form_open', e.detail && e.detail.id));

  // กดปุ่ม/ลิงก์ LINE สถาบัน
  document.addEventListener('click', e => {
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && /(^|\/\/)(lin\.ee|line\.me|page\.line\.me)\//i.test(a.getAttribute('href') || '')) send('line_click');
  }, true);
})();
