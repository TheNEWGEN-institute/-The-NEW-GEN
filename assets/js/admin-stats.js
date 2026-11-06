/* ===================================================================
   สถิติเว็บไซต์ในหลังบ้าน — วาดแถบตัวเลขด้านบน + แผงสถิติละเอียด
   ข้อมูลมาจาก admin_site_stats() (supabase/15-site-stats.sql)
   window.NGStats.mountStrip(el, data, variant, opts) / mountPanel(el, data, opts)
   =================================================================== */
(function () {
  'use strict';

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const num = v => Number(v) || 0;
  const fmt = v => num(v).toLocaleString('th-TH');
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const TH_D = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const parts = iso => {
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
  };
  const shortDate = iso => { const p = parts(iso); return `${p.d} ${TH_M[p.m - 1]}`; };
  const longDate = iso => { const p = parts(iso); return `${TH_D[p.wd]} ${p.d} ${TH_M[p.m - 1]} ${String(p.y + 543).slice(2)}`; };
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const SOURCES = {
    line: ['LINE', 'fa-brands fa-line'],
    facebook: ['Facebook', 'fa-brands fa-facebook'],
    google: ['Google', 'fa-brands fa-google'],
    instagram: ['Instagram', 'fa-brands fa-instagram'],
    tiktok: ['TikTok', 'fa-brands fa-tiktok'],
    youtube: ['YouTube', 'fa-brands fa-youtube'],
    direct: ['เข้าเว็บตรง / ลิงก์ที่บันทึกไว้', 'fa-solid fa-keyboard'],
    search: ['ค้นหาจากเว็บอื่น (Bing ฯลฯ)', 'fa-solid fa-magnifying-glass'],
    other: ['ลิงก์จากเว็บอื่น', 'fa-solid fa-link']
  };
  const DEVICES = {
    mobile: ['มือถือ', 'fa-solid fa-mobile-screen'],
    tablet: ['แท็บเล็ต / iPad', 'fa-solid fa-tablet-screen-button'],
    desktop: ['คอมพิวเตอร์', 'fa-solid fa-desktop']
  };
  const PAGES = {
    index: 'หน้าแรก', courses: 'คอร์สเรียนทั้งหมด', 'course-detail': 'รายละเอียดคอร์ส', schedule: 'ตารางเรียน',
    tutors: 'ทีมติวเตอร์', about: 'เกี่ยวกับเรา', reviews: 'รีวิว / ความสำเร็จ', faq: 'คำถามที่พบบ่อย', 'free-trial': 'ทดลองเรียนฟรี'
  };
  const METRICS = {
    visitors: { label: 'ผู้เข้าชม', unit: 'คน' },
    views: { label: 'เปิดดูหน้า', unit: 'ครั้ง' },
    formOpeners: { label: 'เปิดฟอร์มสมัคร', unit: 'คน' },
    enrollments: { label: 'ใบสมัคร', unit: 'ใบ' },
    lineClicks: { label: 'กดทัก LINE', unit: 'ครั้ง' }
  };

  function defaultTitleOf(id) {
    const db = window.NewGenDB;
    if (db) {
      const c = db.getCourses().find(x => x.id === id);
      if (c) return c.title;
      const b = (db.getBundles ? db.getBundles() : []).find(x => x.id === id);
      if (b) return b.name || b.title;
      if (db.getCourses().length) return 'คอร์ส/แพ็คที่ลบไปแล้ว';
    }
    return id;
  }

  function deltaHtml(cur, prev, vs) {
    cur = num(cur); prev = num(prev);
    let cls, txt, icon;
    if (!prev && !cur) return '<span class="ngs-delta flat"><i class="fa-solid fa-minus"></i> -</span>';
    if (!prev) { cls = 'up'; txt = 'ใหม่'; icon = 'fa-arrow-trend-up'; }
    else {
      const p = Math.round(((cur - prev) / prev) * 100);
      if (p === 0) { cls = 'flat'; txt = 'เท่าเดิม'; icon = 'fa-minus'; }
      else { cls = p > 0 ? 'up' : 'down'; txt = (p > 0 ? '+' : '') + p + '%'; icon = p > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'; }
    }
    return `<span class="ngs-delta ${cls}" title="เทียบ${esc(vs)} (${fmt(prev)})"><i class="fa-solid ${icon}"></i> ${txt}</span>`;
  }

  // ---------------- tooltip (one per chart host) ----------------
  function tooltip(host) {
    let tip = host.querySelector(':scope > .ngs-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'ngs-tip'; tip.hidden = true; host.appendChild(tip); }
    return {
      show(html, x, y) {
        tip.innerHTML = html; tip.hidden = false;
        const w = tip.offsetWidth, hw = host.clientWidth;
        tip.style.left = Math.max(4, Math.min(hw - w - 4, x - w / 2)) + 'px';
        tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
      },
      hide() { tip.hidden = true; }
    };
  }

  function niceScale(max, ticks) {
    const raw = Math.max(1, max) / ticks;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => s >= raw) || 10 * p;
    const st = Math.max(1, Math.ceil(step));
    return { step: st, max: st * ticks };
  }

  // ---------------- sparkline (tile) ----------------
  function sparkline(vals, opts = {}) {
    const W = opts.w || 96, H = opts.h || 28;
    if (!vals.length) return '';
    const max = Math.max(1, ...vals);
    const x = i => (vals.length === 1 ? W / 2 : 1 + (i * (W - 2)) / (vals.length - 1));
    const y = v => H - 3 - (v / max) * (H - 6);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const last = vals.length - 1;
    return `<svg class="ngs-spark ${opts.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      <polygon points="${x(0).toFixed(1)},${H} ${pts} ${x(last).toFixed(1)},${H}" class="ngs-spark-area"/>
      <polyline points="${pts}" class="ngs-spark-line"/>
      <circle cx="${x(last).toFixed(1)}" cy="${y(vals[last]).toFixed(1)}" r="2.6" class="ngs-spark-dot"/>
    </svg>`;
  }

  // ---------------- main daily chart (area + line, hover crosshair) ----------------
  function lineChart(host, daily, metric, opts = {}) {
    const H = opts.h || 230;
    const W = Math.max(260, host.clientWidth || 640);
    const m = { l: 40, r: 14, t: 16, b: 28 };
    const vals = daily.map(d => num(d[metric]));
    const sc = niceScale(Math.max(...vals, 1), 4);
    const n = vals.length;
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const x = i => m.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
    const y = v => m.t + ih * (1 - v / sc.max);
    const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const area = `${line}L${x(n - 1).toFixed(1)},${(m.t + ih).toFixed(1)}L${x(0).toFixed(1)},${(m.t + ih).toFixed(1)}Z`;
    let grid = '';
    for (let k = 0; k <= 4; k++) {
      const v = sc.step * k, yy = y(v).toFixed(1);
      grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}" class="ngs-grid${k ? '' : ' base'}"/><text x="${m.l - 8}" y="${yy}" class="ngs-axis" text-anchor="end" dominant-baseline="middle">${fmt(v)}</text>`;
    }
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
    let xl = '';
    daily.forEach((d, i) => {
      if ((n - 1 - i) % every === 0) xl += `<text x="${x(i).toFixed(1)}" y="${H - 8}" class="ngs-axis" text-anchor="middle">${esc(shortDate(d.day))}</text>`;
    });
    const showDots = n <= 31;
    host.innerHTML = `
      <svg class="ngs-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="กราฟ${esc(METRICS[metric].label)}รายวัน">
        ${grid}${xl}
        <path d="${area}" class="ngs-area"/>
        <path d="${line}" class="ngs-line"/>
        ${showDots ? vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === n - 1 ? 4.5 : 0}" class="ngs-pt"/>`).join('') : ''}
        <line class="ngs-cross" y1="${m.t}" y2="${m.t + ih}" x1="0" x2="0" visibility="hidden"/>
        <circle class="ngs-hover-pt" r="5" cx="0" cy="0" visibility="hidden"/>
        <rect x="${m.l - 10}" y="0" width="${iw + 20}" height="${H}" fill="transparent" class="ngs-hit"/>
      </svg>`;
    const svg = host.querySelector('svg');
    const cross = svg.querySelector('.ngs-cross'), hp = svg.querySelector('.ngs-hover-pt');
    const tip = tooltip(host);
    const move = ev => {
      const r = svg.getBoundingClientRect();
      const cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(n - 1, Math.round(n <= 1 ? 0 : ((cx - m.l) / iw) * (n - 1))));
      const d = daily[i];
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
      hp.setAttribute('cx', x(i)); hp.setAttribute('cy', y(vals[i])); hp.setAttribute('visibility', 'visible');
      const rows = Object.keys(METRICS).map(k => `<div class="${k === metric ? 'on' : ''}"><span>${METRICS[k].label}</span><b>${fmt(d[k])}</b></div>`).join('');
      tip.show(`<strong>${esc(longDate(d.day))}</strong>${rows}`, (x(i) * r.width) / W, (y(vals[i]) * r.height) / H);
    };
    const leave = () => { cross.setAttribute('visibility', 'hidden'); hp.setAttribute('visibility', 'hidden'); tip.hide(); };
    const hit = svg.querySelector('.ngs-hit');
    hit.addEventListener('mousemove', move);
    hit.addEventListener('touchstart', move, { passive: true });
    hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', leave);
    hit.addEventListener('touchend', () => setTimeout(leave, 1600));
  }

  // ---------------- hours (24 columns) ----------------
  function hoursChart(host, hours) {
    const H = 170, W = Math.max(260, host.clientWidth || 640);
    const m = { l: 8, r: 8, t: 22, b: 24 };
    const vals = Array.from({ length: 24 }, (_, h) => num((hours.find(x => Number(x.hour) === h) || {}).views));
    const max = Math.max(1, ...vals);
    const peak = vals.indexOf(Math.max(...vals));
    const slot = (W - m.l - m.r) / 24, bw = Math.max(3, slot - 2), ih = H - m.t - m.b;
    let bars = '', labels = '';
    vals.forEach((v, h) => {
      const bh = v ? Math.max(3, (v / max) * ih) : 0;
      const bx = m.l + h * slot + (slot - bw) / 2, by = m.t + ih - bh;
      const r = Math.min(4, bw / 2, bh);
      if (bh) bars += `<path d="M${bx},${m.t + ih}V${by + r}Q${bx},${by} ${bx + r},${by}H${bx + bw - r}Q${bx + bw},${by} ${bx + bw},${by + r}V${m.t + ih}Z" class="ngs-col${h === peak && v ? ' peak' : ''}"/>`;
      bars += `<rect x="${m.l + h * slot}" y="0" width="${slot}" height="${H}" fill="transparent" data-h="${h}" class="ngs-hit-col"/>`;
      if (h % 3 === 0) labels += `<text x="${bx + bw / 2}" y="${H - 7}" class="ngs-axis" text-anchor="middle">${String(h).padStart(2, '0')}</text>`;
    });
    const peakLbl = vals[peak] ? `<text x="${m.l + peak * slot + slot / 2}" y="${m.t + ih - (vals[peak] / max) * ih - 7}" class="ngs-val" text-anchor="middle">${fmt(vals[peak])}</text>` : '';
    host.innerHTML = `<svg class="ngs-chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="จำนวนการเปิดหน้าเว็บแยกตามชั่วโมง">
      <line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}" class="ngs-grid base"/>${bars}${labels}${peakLbl}</svg>`;
    const svg = host.querySelector('svg'), tip = tooltip(host);
    svg.querySelectorAll('.ngs-hit-col').forEach(el => {
      const show = () => {
        const h = Number(el.dataset.h), r = svg.getBoundingClientRect();
        tip.show(`<strong>${String(h).padStart(2, '0')}:00 – ${String(h).padStart(2, '0')}:59 น.</strong><div class="on"><span>เปิดดูหน้า</span><b>${fmt(vals[h])}</b></div>`,
          ((m.l + h * slot + slot / 2) * r.width) / W, ((m.t + ih - (vals[h] / max) * ih) * r.height) / H);
      };
      el.addEventListener('mouseenter', show);
      el.addEventListener('touchstart', show, { passive: true });
      el.addEventListener('mouseleave', () => tip.hide());
    });
    return peak;
  }

  // ---------------- HTML pieces ----------------
  function barList(rows, unit) {
    if (!rows.length) return '<p class="ngs-empty">ยังไม่มีข้อมูล</p>';
    const max = Math.max(1, ...rows.map(r => r.value));
    const total = rows.reduce((s, r) => s + r.value, 0);
    return `<div class="ngs-bars">${rows.map(r => `
      <div class="ngs-bar-row" title="${esc(r.label)}: ${fmt(r.value)} ${unit} (${pct(r.value, total)}%)">
        <span class="ngs-bar-label">${r.icon ? `<i class="${r.icon}"></i>` : ''}<span>${esc(r.label)}</span></span>
        <span class="ngs-bar-val"><b>${fmt(r.value)}</b><small>${pct(r.value, total)}%</small></span>
        <span class="ngs-bar-track"><i style="width:${Math.max(1.5, (r.value / max) * 100)}%"></i></span>
      </div>`).join('')}</div>`;
  }

  function funnelHtml(t) {
    const steps = [
      ['ผู้เข้าชมเว็บ', t.visitors, 'fa-solid fa-users'],
      ['ดูรายละเอียดคอร์ส', t.courseViewers, 'fa-solid fa-book-open'],
      ['กดเปิดฟอร์มสมัคร', t.formOpeners, 'fa-solid fa-file-pen'],
      ['ส่งใบสมัครจริง', t.enrollments, 'fa-solid fa-circle-check']
    ];
    const top = Math.max(1, num(t.visitors));
    return `<ol class="ngs-funnel">${steps.map((s, i) => {
      const v = num(s[1]);
      const prev = i ? num(steps[i - 1][1]) : 0;
      return `<li>
        <div class="ngs-fn-head"><span><i class="${s[2]}"></i> ${s[0]}</span><b>${fmt(v)}</b></div>
        <div class="ngs-fn-track"><i style="width:${Math.max(1.5, Math.min(100, (v / top) * 100))}%"></i></div>
        ${i ? `<small>${prev ? `${Math.min(999, pct(v, prev))}% ของขั้นก่อนหน้า` : '-'}</small>` : '<small>ทุกคนที่เข้าเว็บ</small>'}
      </li>`;
    }).join('')}</ol>
    <p class="ngs-note">อัตราสมัครรวม <b>${pct(num(t.enrollments), top)}%</b> ของผู้เข้าชม · ใบสมัครนับจากระบบจริง (แพ็คเกจนับเป็น 1 ใบ)</p>`;
  }

  function coursesTable(rows, titleOf) {
    if (!rows.length) return '<p class="ngs-empty">ยังไม่มีข้อมูล</p>';
    const max = Math.max(1, ...rows.map(r => num(r.viewers)));
    return `<div class="ngs-table-wrap"><table class="ngs-table ngs-courses">
      <thead><tr><th>คอร์ส / แพ็คเกจ</th><th>คนดู</th><th>เปิดฟอร์ม</th><th>สมัคร</th><th>อัตราสมัคร</th></tr></thead>
      <tbody>${rows.slice(0, 15).map((r, i) => {
        const v = num(r.viewers), e = num(r.enrollments), rate = v ? pct(e, v) : null;
        const flag = v >= 15 && rate !== null && rate < 5 ? '<span class="ngs-flag">สนใจเยอะ สมัครน้อย</span>' : '';
        return `<tr>
          <td><span class="ngs-rank">${i + 1}</span><span class="ngs-ctitle">${esc(titleOf(r.id))}</span>${flag}
            <span class="ngs-mini"><i style="width:${(v / max) * 100}%"></i></span></td>
          <td data-label="คนดู">${fmt(v)}</td><td data-label="เปิดฟอร์ม">${fmt(r.formOpeners)}</td><td data-label="สมัคร"><b>${fmt(e)}</b></td>
          <td data-label="อัตราสมัคร">${rate === null ? '-' : rate + '%'}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function insights(data, titleOf, peak) {
    const t = data.totals || {}, out = [];
    const src = (data.sources || [])[0], srcTotal = (data.sources || []).reduce((s, x) => s + num(x.visitors), 0);
    const dev = (data.devices || []).find(d => d.device === 'mobile');
    const devTotal = (data.devices || []).reduce((s, x) => s + num(x.visitors), 0);
    const hours = data.hours || [];
    if (hours.some(h => num(h.views))) {
      out.push(['fa-clock', `คนเข้าเว็บมากที่สุดช่วง <b>${String(peak).padStart(2, '0')}:00–${String((peak + 1) % 24).padStart(2, '0')}:00 น.</b> — โพสต์ประกาศ/ส่ง LINE ก่อนช่วงนี้เล็กน้อย จะเห็นมากที่สุด`]);
    }
    if (src && srcTotal) out.push(['fa-share-nodes', `ผู้เข้าชมมาจาก <b>${esc((SOURCES[src.source] || [src.source])[0])}</b> มากที่สุด (${pct(num(src.visitors), srcTotal)}%)`]);
    if (dev && devTotal) out.push(['fa-mobile-screen', `ใช้<b>มือถือ ${pct(num(dev.visitors), devTotal)}%</b>${pct(num(dev.visitors), devTotal) >= 60 ? ' — หน้าเว็บบนมือถือสำคัญที่สุด' : ''}`]);
    const best = (data.courses || []).slice().sort((a, b) => num(b.viewers) - num(a.viewers))[0];
    if (best && num(best.viewers)) out.push(['fa-fire', `คอร์สที่คนดูมากที่สุด: <b>${esc(titleOf(best.id))}</b> (${fmt(best.viewers)} คน)`]);
    const cold = (data.courses || []).find(c => num(c.viewers) >= 15 && pct(num(c.enrollments), num(c.viewers)) < 5);
    if (cold) out.push(['fa-lightbulb', `<b>${esc(titleOf(cold.id))}</b> มีคนดูเยอะแต่สมัครน้อย — ลองเช็คราคา/รอบเรียน หรือทักผู้สนใจทาง LINE`]);
    if (num(t.visitors)) out.push(['fa-user-plus', `ผู้เข้าชมใหม่ ${pct(num(t.newVisitors), num(t.visitors))}% · กลับมาดูซ้ำ ${100 - pct(num(t.newVisitors), num(t.visitors))}%`]);
    if (!out.length) return '<p class="ngs-empty">ยังไม่มีข้อมูลพอสำหรับคำแนะนำ</p>';
    return `<ul class="ngs-insights">${out.map(o => `<li><i class="fa-solid ${o[0]}"></i><span>${o[1]}</span></li>`).join('')}</ul>`;
  }

  function dailyTable(daily) {
    return `<div class="ngs-table-wrap"><table class="ngs-table ngs-daily-table"><thead><tr><th>วันที่</th>${Object.keys(METRICS).map(k => `<th>${METRICS[k].label}</th>`).join('')}</tr></thead>
      <tbody>${daily.slice().reverse().map(d => `<tr><td>${esc(longDate(d.day))}</td>${Object.keys(METRICS).map(k => `<td>${fmt(d[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------------- today numbers (top strip) ----------------
  function todayKpis(data) {
    const dl = data.daily || [], t = dl[dl.length - 1] || {};
    // วันนี้ยังไม่จบวัน → เทียบกับเมื่อวาน ณ เวลาเดียวกัน (ถ้ามีข้อมูล)
    const y = data.yesterdaySoFar || dl[dl.length - 2] || {};
    const last = k => dl.slice(-14).map(d => num(d[k]));
    return [
      { key: 'live', label: 'กำลังดูอยู่ตอนนี้', icon: 'fa-solid fa-signal', value: data.live, hint: 'ใน 5 นาทีล่าสุด' },
      { key: 'visitors', label: 'ผู้เข้าชมวันนี้', icon: 'fa-solid fa-users', value: t.visitors, prev: y.visitors, spark: last('visitors') },
      { key: 'views', label: 'เปิดดูหน้าเว็บ', icon: 'fa-solid fa-eye', value: t.views, prev: y.views, spark: last('views') },
      { key: 'formOpeners', label: 'กดเปิดฟอร์มสมัคร', icon: 'fa-solid fa-file-pen', value: t.formOpeners, prev: y.formOpeners, spark: last('formOpeners') },
      { key: 'enrollments', label: 'ใบสมัครวันนี้', icon: 'fa-solid fa-user-plus', value: t.enrollments, prev: y.enrollments, spark: last('enrollments') },
      { key: 'lineClicks', label: 'กดทัก LINE', icon: 'fa-brands fa-line', value: t.lineClicks, prev: y.lineClicks, spark: last('lineClicks') }
    ];
  }

  function mountStrip(el, data, variant, opts = {}) {
    if (!el || !data) return;
    const k = todayKpis(data);
    const openBtn = `<button type="button" class="ngs-open" data-ngs-open><i class="fa-solid fa-chart-line"></i> ${esc(opts.openLabel || 'ดูสถิติทั้งหมด')} <i class="fa-solid fa-chevron-down ngs-chev"></i></button>`;
    if (variant === 2) {
      el.className = 'ngs-strip ngs-v2';
      el.innerHTML = `
        <div class="ngs-v2-head"><h3><i class="fa-solid fa-chart-simple"></i> ภาพรวมเว็บไซต์วันนี้</h3>${openBtn}</div>
        <div class="ngs-v2-cards">${k.map(x => `
          <div class="ngs-card ${x.key === 'live' ? 'is-live' : ''}">
            <span class="ngs-card-label"><i class="${x.icon}"></i> ${x.label}</span>
            <b class="ngs-card-num">${fmt(x.value)}</b>
            ${x.key === 'live' ? `<span class="ngs-card-hint"><span class="ngs-pulse"></span>${x.hint}</span>` : `<span class="ngs-card-foot">${deltaHtml(x.value, x.prev, 'เมื่อวาน ณ เวลาเดียวกัน')}${sparkline(x.spark, { w: 84, h: 26 })}</span>`}
          </div>`).join('')}</div>`;
    } else if (variant === 3) {
      const v = k[1];
      const t = (data.daily || [])[(data.daily || []).length - 1] || {};
      el.className = 'ngs-strip ngs-v3';
      el.innerHTML = `
        <div class="ngs-v3-main">
          <div class="ngs-v3-hero">
            <span class="ngs-v3-live"><span class="ngs-pulse"></span> กำลังดูอยู่ <b>${fmt(data.live)}</b> คน</span>
            <span class="ngs-v3-label">ผู้เข้าชมวันนี้</span>
            <b class="ngs-v3-num">${fmt(v.value)}</b>
            ${deltaHtml(v.value, v.prev, 'เมื่อวาน ณ เวลาเดียวกัน')}
          </div>
          <div class="ngs-v3-chart" data-ngs-v3chart></div>
          <div class="ngs-v3-fn">
            <span class="ngs-v3-label">วันนี้: จากผู้เข้าชม สู่ใบสมัคร</span>
            ${[['ผู้เข้าชม', t.visitors], ['เปิดฟอร์ม', t.formOpeners], ['สมัครจริง', t.enrollments]].map(s => `
              <div class="ngs-v3-step"><span>${s[0]}</span><i style="width:${Math.max(3, Math.min(100, (num(s[1]) / Math.max(1, num(t.visitors))) * 100))}%"></i><b>${fmt(s[1])}</b></div>`).join('')}
          </div>
        </div>
        <div class="ngs-v3-chips">${k.slice(2).map(x => `<span class="ngs-chip"><i class="${x.icon}"></i> ${x.label} <b>${fmt(x.value)}</b> ${deltaHtml(x.value, x.prev, 'เมื่อวาน ณ เวลาเดียวกัน')}</span>`).join('')}${openBtn}</div>`;
      const host = el.querySelector('[data-ngs-v3chart]');
      const draw = () => lineChart(host, (data.daily || []).slice(-14), 'visitors', { h: 132 });
      requestAnimationFrame(draw);
      host._redraw = draw;
    } else {
      el.className = 'ngs-strip ngs-v1';
      el.innerHTML = `
        <div class="ngs-v1-row">
          ${k.map(x => `
            <div class="ngs-v1-item ${x.key === 'live' ? 'is-live' : ''}" title="${esc(x.label)}${x.hint ? ' ' + esc(x.hint) : ''}">
              <span class="ngs-v1-label">${x.key === 'live' ? '<span class="ngs-pulse"></span>' : `<i class="${x.icon}"></i>`} ${x.label}</span>
              <span class="ngs-v1-val"><b>${fmt(x.value)}</b>${x.key === 'live' ? '' : deltaHtml(x.value, x.prev, 'เมื่อวาน ณ เวลาเดียวกัน')}</span>
            </div>`).join('')}
          <div class="ngs-v1-spark" title="ผู้เข้าชม 14 วันล่าสุด">${sparkline(k[1].spark, { w: 120, h: 34 })}<small>14 วันล่าสุด</small></div>
          ${openBtn}
        </div>`;
    }
    const btn = el.querySelector('[data-ngs-open]');
    if (btn && opts.onOpen) btn.addEventListener('click', () => opts.onOpen(btn));
  }

  function mountPanel(el, data, opts = {}) {
    if (!el || !data) return;
    const titleOf = opts.titleOf || defaultTitleOf;
    const t = data.totals || {}, pt = data.prevTotals || {};
    const days = data.days || 30;
    const vs = `${days} วันก่อนหน้า`;
    const metric = el._ngsMetric || 'visitors';
    const updated = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    el.classList.add('ngs-panel');
    el.innerHTML = `
      <div class="ngs-panel-head">
        <div><h3><i class="fa-solid fa-chart-line"></i> สถิติเว็บไซต์</h3>
          <small>${esc(longDate(data.from))} – ${esc(longDate(data.to))} · อัปเดต ${updated} น. · ไม่นับเครื่องแอดมิน/ติวเตอร์</small></div>
        <div class="ngs-range" role="group" aria-label="ช่วงเวลา">
          ${[7, 30, 90].map(d => `<button type="button" data-days="${d}" class="${d === days ? 'on' : ''}">${d} วัน</button>`).join('')}
          <button type="button" data-refresh title="โหลดใหม่"><i class="fa-solid fa-rotate-right"></i></button>
        </div>
      </div>

      <div class="ngs-totals">
        ${[['visitors', 'ผู้เข้าชม', 'fa-solid fa-users'], ['views', 'เปิดดูหน้า', 'fa-solid fa-eye'], ['formOpeners', 'เปิดฟอร์มสมัคร', 'fa-solid fa-file-pen'],
          ['enrollments', 'ใบสมัคร', 'fa-solid fa-user-plus'], ['lineClicks', 'กดทัก LINE', 'fa-brands fa-line']].map(x => `
          <div class="ngs-total"><span><i class="${x[2]}"></i> ${x[1]}</span><b>${fmt(t[x[0]])}</b>${deltaHtml(t[x[0]], pt[x[0]], vs)}</div>`).join('')}
        <div class="ngs-total"><span><i class="fa-solid fa-seedling"></i> ผู้เข้าชมใหม่</span><b>${fmt(t.newVisitors)}</b><small class="ngs-sub">${pct(num(t.newVisitors), num(t.visitors))}% ของผู้เข้าชม</small></div>
      </div>

      <section class="ngs-box ngs-box-chart">
        <div class="ngs-box-head">
          <h4>แนวโน้มรายวัน</h4>
          <div class="ngs-tabs" role="tablist">
            ${['visitors', 'views', 'formOpeners', 'enrollments', 'lineClicks'].map(k => `<button type="button" data-metric="${k}" class="${k === metric ? 'on' : ''}">${METRICS[k].label}</button>`).join('')}
            <button type="button" data-table class="ngs-tab-table"><i class="fa-solid fa-table"></i> ตาราง</button>
          </div>
        </div>
        <div class="ngs-chart-host" data-chart></div>
        <div data-daily-table hidden>${dailyTable(data.daily || [])}</div>
      </section>

      <div class="ngs-grid2">
        <section class="ngs-box"><div class="ngs-box-head"><h4>จากผู้เข้าชม → สู่ใบสมัคร</h4></div>${funnelHtml(t)}</section>
        <section class="ngs-box"><div class="ngs-box-head"><h4><i class="fa-solid fa-wand-magic-sparkles"></i> ข้อสังเกต & คำแนะนำ</h4></div><div data-insights></div></section>
      </div>

      <section class="ngs-box"><div class="ngs-box-head"><h4>คอร์สยอดนิยม & อัตราการสมัคร</h4><small>คนดู = จำนวนคน (ไม่นับซ้ำ) ที่เปิดดูคอร์ส/แพ็ค</small></div>${coursesTable(data.courses || [], titleOf)}</section>

      <div class="ngs-grid3">
        <section class="ngs-box"><div class="ngs-box-head"><h4>มาจากไหน</h4></div>
          ${barList((data.sources || []).map(s => ({ label: (SOURCES[s.source] || [s.source])[0], icon: (SOURCES[s.source] || ['', 'fa-solid fa-link'])[1], value: num(s.visitors) })), 'คน')}</section>
        <section class="ngs-box"><div class="ngs-box-head"><h4>อุปกรณ์</h4></div>
          ${barList((data.devices || []).map(s => ({ label: (DEVICES[s.device] || [s.device])[0], icon: (DEVICES[s.device] || ['', 'fa-solid fa-display'])[1], value: num(s.visitors) })), 'คน')}</section>
        <section class="ngs-box"><div class="ngs-box-head"><h4>หน้าที่คนเปิดดู</h4></div>
          ${barList((data.pages || []).slice(0, 8).map(s => ({ label: PAGES[s.page] || s.page, value: num(s.views) })), 'ครั้ง')}</section>
      </div>

      <section class="ngs-box"><div class="ngs-box-head"><h4>ช่วงเวลาที่คนเข้าเว็บ</h4><small>รวม ${days} วัน · เวลาไทย</small></div><div class="ngs-chart-host" data-hours></div></section>`;

    const chartHost = el.querySelector('[data-chart]');
    const hoursHost = el.querySelector('[data-hours]');
    const draw = () => {
      lineChart(chartHost, data.daily || [], el._ngsMetric || 'visitors');
      const peak = hoursChart(hoursHost, data.hours || []);
      el.querySelector('[data-insights]').innerHTML = insights(data, titleOf, peak);
    };
    requestAnimationFrame(draw);
    el._redraw = draw;

    el.querySelectorAll('[data-metric]').forEach(b => b.addEventListener('click', () => {
      el._ngsMetric = b.dataset.metric;
      el.querySelectorAll('[data-metric]').forEach(x => x.classList.toggle('on', x === b));
      lineChart(chartHost, data.daily || [], el._ngsMetric);
    }));
    el.querySelector('[data-table]').addEventListener('click', e => {
      const tb = el.querySelector('[data-daily-table]');
      tb.hidden = !tb.hidden;
      chartHost.hidden = !tb.hidden;
      e.currentTarget.classList.toggle('on', !tb.hidden);
      if (tb.hidden) lineChart(chartHost, data.daily || [], el._ngsMetric || 'visitors');
    });
    el.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => opts.onRange && opts.onRange(Number(b.dataset.days))));
    const rf = el.querySelector('[data-refresh]');
    if (rf) rf.addEventListener('click', () => opts.onRange && opts.onRange(days));
  }

  // redraw SVG charts when the width changes
  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => document.querySelectorAll('.ngs-panel, [data-ngs-v3chart]').forEach(x => {
      if (x._redraw && x.offsetParent !== null) x._redraw();
    }), 150);
  });

  window.NGStats = { mountStrip, mountPanel, sparkline, METRICS };
})();
