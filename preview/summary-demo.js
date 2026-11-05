/* ===================================================================
   ตัวอย่าง "ตารางสรุปรวม" ม.ปลาย (preview/summary.html?v=1..3)
   ใช้ตารางเรียนจริงที่กรอกในหลังบ้าน — แค่แสดงผล ไม่แก้ไขข้อมูล
   กฎจัดกลุ่ม (อัตโนมัติ):
   - วันเสาร์/อาทิตย์: แยกตาราง "วัน + กลุ่ม" / รอบที่ไม่มีชื่อกลุ่ม → รวมเข้าทุกกลุ่มของวันนั้น
   - จันทร์–ศุกร์ / วันธรรมดา: รวมเป็นตาราง "วันธรรมดา" ตารางเดียว
   =================================================================== */
(function () {
  'use strict';

  const VERSIONS = { 1: 'รายการเรียงเวลา', 2: 'ตารางคาบเรียน', 3: 'ไทม์ไลน์แนวนอน' };
  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const DAY_RE = [/จันทร์/, /อังคาร/, /พุธ/, /พฤหัส/, /ศุกร์/, /เสาร์/, /อาทิตย์/];
  const SHORT = [[/คณิต/, 'คณิต'], [/ฟิสิกส์/, 'ฟิสิกส์'], [/เคมี/, 'เคมี'], [/อังกฤษ/, 'อังกฤษ'], [/วิทย์/, 'วิทย์']];
  const TONE = { 'คณิต': 'math', 'วิทย์': 'sci', 'อังกฤษ': 'eng', 'ฟิสิกส์': 'phys', 'เคมี': 'chem' };
  const MODE_TEXT = { alternate: 'สลับกันคนละสัปดาห์', rotate: 'หมุนเวียนตามวัน' };

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const db = () => window.NewGenDB;
  const params = new URLSearchParams(location.search);
  const state = { v: Math.min(3, Math.max(1, Number(params.get('v')) || 1)), level: params.get('level') || 'highschool4' };

  const toneOf = text => { const h = SHORT.find(([re]) => re.test(text || '')); return h ? TONE[h[1]] : 'royal'; };
  const shortOf = text => { const h = SHORT.find(([re]) => re.test(text || '')); return h ? h[1] : (text || ''); };
  const toMin = t => { const m = String(t || '').match(/(\d{1,2})[.:](\d{2})/); return m ? +m[1] * 60 + +m[2] : 9999; };
  const dayIdx = d => { if (/ธรรมดา/.test(d || '')) return 7; const i = DAY_RE.findIndex(re => re.test(d || '')); return i < 0 ? 8 : i; };

  /* ---------------- จัดกลุ่มเป็นตารางสรุป ---------------- */
  function buildTables(level) {
    const courses = db().getCourses().filter(c => !c.isHidden && c.category === level);
    const entries = [];
    courses.forEach(c => {
      const view = window.getCourseScheduleView(c);
      if (view.hidden) return;
      view.sessions.forEach(s => {
        (s.periods || []).forEach(p => {
          entries.push({ course: c, day: s.day, di: dayIdx(s.day), group: s.group || '', note: s.note, p, start: toMin(p.start) });
        });
      });
    });
    const weekend = entries.filter(e => e.di === 5 || e.di === 6);
    const weekday = entries.filter(e => e.di <= 4 || e.di === 7);
    const tables = [];
    [5, 6].forEach(di => {
      const day = weekend.filter(e => e.di === di);
      if (!day.length) return;
      const groups = [...new Set(day.map(e => e.group).filter(Boolean))];
      const shared = day.filter(e => !e.group);
      (groups.length ? groups : ['']).forEach(g => {
        const rows = day.filter(e => e.group === g).concat(groups.length ? shared : []);
        tables.push({ kind: 'weekend', title: `วัน${DAYS[di]}`, group: g, di, note: rows[0] && rows[0].note, rows: rows.sort((a, b) => a.start - b.start) });
      });
    });
    if (weekday.length) {
      tables.push({ kind: 'weekday', title: 'วันธรรมดา (จันทร์–ศุกร์)', group: '', di: 0, note: weekday[0].note, rows: weekday.sort((a, b) => a.di - b.di || a.start - b.start) });
    }
    return tables;
  }

  const timeText = p => [p.start, p.end].filter(Boolean).join(' – ');
  const tutorHtml = it => it.tutor ? `<span class="sc-tutor"><span class="sc-emoji" aria-hidden="true">🤓</span>ติวเตอร์ : ${esc(it.tutor)}</span>` : '';
  const roomHtml = it => it.room ? `<span class="sc-room">${esc(it.room)}</span>` : '';
  const dayLabel = e => (e.di === 7 ? 'วันธรรมดา*' : `วัน${DAYS[e.di] || e.day}`);

  /* ---------------- แบบที่ 1: รายการเรียงเวลา (การ์ดต่อกลุ่ม) ---------------- */
  function v1(tables) {
    return `<div class="sm-list">${tables.map(t => `
      <article class="sm-card ${t.kind === 'weekday' ? 'is-weekday' : ''}">
        <header class="sm-card-head">
          <span class="sm-day sc-d${t.kind === 'weekday' ? 'x' : t.di}"><i class="fa-regular fa-calendar"></i>${esc(t.title)}</span>
          ${t.group ? `<span class="sm-group">${esc(t.group)}</span>` : ''}
          <span class="sm-count">${t.rows.length} คาบ</span>
          ${t.note ? `<span class="sm-note">${esc(t.note)}</span>` : ''}
        </header>
        <ol class="sm-rows">
          ${t.rows.map((e, i) => `
            ${t.kind === 'weekday' && (i === 0 || t.rows[i - 1].di !== e.di) ? `<li class="sm-dayline sc-d${e.di === 7 ? 'x' : e.di}"><span>${esc(dayLabel(e))}</span></li>` : ''}
            ${e.p.items.map((it, k) => `
              ${k > 0 ? `<li class="sm-alt"><i class="fa-solid fa-right-left"></i> ${MODE_TEXT[e.p.mode] || 'สลับกัน'}</li>` : ''}
              <li class="sc-item sc-s-${toneOf(it.subject)}">
                <span class="sc-time">${esc(timeText(e.p))}</span>
                <span class="sc-subj">วิชา : ${esc(it.subject)}</span>
                ${tutorHtml(it)}${roomHtml(it)}
              </li>`).join('')}`).join('')}
        </ol>
      </article>`).join('')}</div>`;
  }

  /* ---------------- แบบที่ 2: ตารางคาบเรียน (แถว = กลุ่ม/วัน, คอลัมน์ = คาบ) ---------------- */
  function v2(tables) {
    const blocks = [];
    const weekend = tables.filter(t => t.kind === 'weekend');
    [5, 6].forEach(di => {
      const ts = weekend.filter(t => t.di === di);
      if (ts.length) blocks.push({ title: `วัน${DAYS[di]}`, di, rows: ts.map(t => ({ label: t.group || `วัน${DAYS[di]}`, list: t.rows })) });
    });
    const wd = tables.find(t => t.kind === 'weekday');
    if (wd) {
      const days = [...new Set(wd.rows.map(e => e.di))];
      blocks.push({ title: 'วันธรรมดา', di: 'x', rows: days.map(d => ({ label: d === 7 ? 'วันธรรมดา*' : DAYS[d], dot: d, list: wd.rows.filter(e => e.di === d) })) });
    }
    return blocks.map(b => {
      const cols = Math.max(...b.rows.map(r => r.list.length));
      return `
        <section class="sm-grid-card">
          <header class="sm-grid-title"><span class="sm-day sc-d${b.di}"><i class="fa-regular fa-calendar"></i>${esc(b.title)}</span></header>
          <div class="sm-grid-scroll">
            <table class="sm-grid" style="--cols:${cols}">
              <thead><tr><th>กลุ่ม / วัน</th>${Array.from({ length: cols }, (_, i) => `<th>คาบที่ ${i + 1}</th>`).join('')}</tr></thead>
              <tbody>${b.rows.map(r => `
                <tr>
                  <th scope="row"><span class="sm-rowlabel ${r.dot !== undefined ? 'sc-d' + (r.dot === 7 ? 'x' : r.dot) : ''}">${esc(r.label)}</span></th>
                  ${Array.from({ length: cols }, (_, i) => {
                    const e = r.list[i];
                    if (!e) return '<td class="sm-empty">–</td>';
                    return `<td>${e.p.items.map((it, k) => `
                      ${k > 0 ? `<div class="sm-cell-alt"><i class="fa-solid fa-right-left"></i> ${MODE_TEXT[e.p.mode] || 'สลับ'}</div>` : ''}
                      <div class="sm-cell sc-s-${toneOf(it.subject)}">
                        <b class="sm-cell-time">${esc(timeText(e.p))}</b>
                        <span class="sm-cell-subj">${esc(it.subject)}</span>
                        <span class="sm-cell-meta">${it.tutor ? `🤓 ${esc(it.tutor)}` : ''}${it.room ? `<em>${esc(it.room)}</em>` : ''}</span>
                      </div>`).join('')}</td>`;
                  }).join('')}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>`;
    }).join('');
  }

  /* ---------------- แบบที่ 3: ไทม์ไลน์แนวนอน (แกนเวลา) ---------------- */
  function v3(tables) {
    const all = tables.flatMap(t => t.rows).filter(e => e.start < 9999);
    if (!all.length) return '';
    const from = Math.floor(Math.min(...all.map(e => e.start)) / 60) * 60;
    const to = Math.ceil(Math.max(...all.map(e => toMin(e.p.end) < 9999 ? toMin(e.p.end) : e.start + 90)) / 60) * 60;
    const span = to - from;
    const pct = m => ((m - from) / span * 100).toFixed(2) + '%';
    const hours = [];
    for (let h = from; h <= to; h += 60) hours.push(h);
    const rowsOf = t => t.kind === 'weekday'
      ? [...new Set(t.rows.map(e => e.di))].map(d => ({ label: d === 7 ? 'วันธรรมดา*' : DAYS[d], dot: d, list: t.rows.filter(e => e.di === d) }))
      : [{ label: t.group || t.title, list: t.rows }];
    return `<div class="sm-tl-wrap">
      <div class="sm-tl-axis" aria-hidden="true"><span></span><div class="sm-tl-hours">${hours.map(h => `<i style="left:${pct(h)}">${String(h / 60).padStart(2, '0')}.00</i>`).join('')}</div></div>
      ${tables.map(t => `
        <section class="sm-tl-card">
          <header class="sm-card-head"><span class="sm-day sc-d${t.kind === 'weekday' ? 'x' : t.di}"><i class="fa-regular fa-calendar"></i>${esc(t.title)}</span>${t.group ? `<span class="sm-group">${esc(t.group)}</span>` : ''}${t.note ? `<span class="sm-note">${esc(t.note)}</span>` : ''}</header>
          ${rowsOf(t).map(r => `
            <div class="sm-tl-row">
              <span class="sm-tl-label">${esc(r.label)}</span>
              <div class="sm-tl-track">
                ${hours.map(h => `<i class="sm-tl-gridline" style="left:${pct(h)}"></i>`).join('')}
                ${r.list.map(e => {
                  const end = toMin(e.p.end) < 9999 ? toMin(e.p.end) : e.start + 90;
                  return `<div class="sm-tl-block sc-s-${toneOf(e.p.items[0] && e.p.items[0].subject)} ${e.p.items.length > 1 ? 'is-alt' : ''}" style="left:${pct(e.start)}; width:calc(${pct(end).replace('%', '')}% - ${pct(e.start).replace('%', '')}% - 4px)" title="${esc(timeText(e.p))}">
                    <b>${e.p.items.map(it => esc(shortOf(it.subject))).join(' ⇄ ')}</b>
                    <span>${esc(timeText(e.p))}</span>
                    <small>${e.p.items.map(it => [it.tutor, it.room].filter(Boolean).map(esc).join(' · ')).join(' / ')}</small>
                  </div>`;
                }).join('')}
              </div>
            </div>`).join('')}
          <div class="sm-tl-mobile">${v1([t]).replace('sm-list', 'sm-list sm-list-plain')}</div>
        </section>`).join('')}
    </div>`;
  }

  /* ---------------- วาดหน้า ---------------- */
  function render() {
    const root = document.getElementById('summaryRoot');
    if (!root || !db() || !window.getCourseScheduleView) return;
    const cats = db().getCategories().filter(c => /^highschool/.test(c.id));
    if (!cats.some(c => c.id === state.level) && cats[0]) state.level = cats[0].id;
    const levelCourses = db().getCourses().filter(c => !c.isHidden && c.category === state.level);
    const tables = buildTables(state.level);
    const views = { 1: v1, 2: v2, 3: v3 };
    root.className = 'sc-root sm-root sm-v' + state.v;
    root.innerHTML = `
      <div class="sf">
        <label class="sf-select"><span><i class="fa-solid fa-graduation-cap"></i> ระดับชั้น</span>
          <select data-level>${cats.map(c => `<option value="${esc(c.id)}" ${c.id === state.level ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </label>
        <label class="sf-select"><span><i class="fa-solid fa-book-open"></i> คอร์ส</span>
          <select data-course>
            <option value="" selected>📋 ตารางสรุปรวมทุกวิชา</option>
            ${levelCourses.map(c => `<option value="${esc(c.id)}">${esc(shortOf(c.subjects))} · คอร์สรายเทอม</option>`).join('')}
          </select>
        </label>
        <button type="button" class="sf-share" disabled><i class="fa-solid fa-link"></i> คัดลอกลิงก์ตารางนี้</button>
      </div>
      <div class="sm-intro">
        <h2>ตารางสรุปรวม ${esc((cats.find(c => c.id === state.level) || {}).name || '').replace(/^ระดับชั้น\s*/, '')}</h2>
        <p>รวมทุกวิชาของระดับชั้นนี้ แยกตามกลุ่มเรียน — เลือกคอร์สด้านบนเพื่อดูตารางรายวิชา</p>
      </div>
      ${tables.length ? views[state.v](tables) : '<p class="sc-none sc-free">ยังไม่มีตารางเรียนของระดับชั้นนี้</p>'}`;
    document.querySelectorAll('.sd-switch a').forEach(a => a.classList.toggle('on', Number(a.dataset.v) === state.v));
  }

  document.addEventListener('change', e => {
    if (e.target.matches('[data-level]')) { state.level = e.target.value; render(); }
    if (e.target.matches('[data-course]') && e.target.value) location.href = '../schedule.html?course=' + encodeURIComponent(e.target.value);
  });

  function switcher() {
    const bar = document.createElement('nav');
    bar.className = 'sd-switch';
    bar.innerHTML = '<span>ตารางสรุปรวม</span>' + Object.keys(VERSIONS).map(n => `<a href="?v=${n}" data-v="${n}">${n}<small>${VERSIONS[n]}</small></a>`).join('');
    bar.addEventListener('click', e => {
      const a = e.target.closest('a[data-v]');
      if (!a) return;
      e.preventDefault();
      state.v = Number(a.dataset.v);
      render();
    });
    document.body.appendChild(bar);
  }

  document.addEventListener('DOMContentLoaded', () => { switcher(); render(); });
  document.addEventListener('newgen:synced', () => setTimeout(render, 0));
})();
