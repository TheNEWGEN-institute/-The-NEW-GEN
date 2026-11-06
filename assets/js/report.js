/* ===================================================================
   หน้ารายงานผลสำหรับผู้ปกครอง (report.html#t=<ลิงก์ส่วนตัว>)
   ข้อมูลมาจาก parent_report() ใน Supabase — เห็นเฉพาะนักเรียนเจ้าของลิงก์
   ลิงก์อยู่หลังเครื่องหมาย # จึงไม่ถูกส่งไปที่เซิร์ฟเวอร์เว็บ
   =================================================================== */
(function () {
  'use strict';

  const STATUS = {
    present: ['มาเรียน', 'fa-circle-check'],
    late: ['มาสาย', 'fa-clock'],
    leave: ['ลา', 'fa-envelope-open-text'],
    absent: ['ขาดเรียน', 'fa-circle-xmark']
  };
  const LEVELS = { excellent: 'ดีมาก', good: 'ดี', fair: 'พอใช้', improve: 'ควรปรับปรุง' };

  const $ = id => document.getElementById(id);
  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const thaiDate = d => (d ? new Date(d + 'T12:00:00+07:00').toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }) : '-');
  const timeBkk = iso => (iso ? new Date(iso).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) : '');

  const token = (location.hash.match(/[#&]t=([0-9a-f]{40})/) || [])[1] || '';
  let data = null;

  function courseTitle(id) {
    const c = (window.NewGenDB ? window.NewGenDB.getCourses() : []).find(x => x.id === id);
    return c ? c.title : 'คอร์สเรียน';
  }

  function fail(msg) {
    $('rpName').textContent = 'เปิดรายงานไม่ได้';
    $('rpMeta').textContent = '';
    $('rpMain').innerHTML = `<p class="rp-empty"><i class="fa-solid fa-link-slash"></i> ${esc(msg)}</p>`;
  }

  function valueHtml(it, v) {
    if (v === undefined || v === null || v === '') return '<span class="rp-na">-</span>';
    if (it.type === 'score') {
      const pct = it.max ? Math.max(0, Math.min(100, (Number(v) / Number(it.max)) * 100)) : null;
      return `<b>${esc(v)}</b>${it.max ? ` <small>/ ${esc(it.max)}</small><span class="rp-bar"><i style="width:${pct}%"></i></span>` : ''}`;
    }
    if (it.type === 'check') return v === true ? '<span class="rp-yes"><i class="fa-solid fa-check"></i> ส่ง</span>' : '<span class="rp-no"><i class="fa-solid fa-xmark"></i> ไม่ส่ง</span>';
    if (it.type === 'rating') return `<span class="rp-stars">${[1, 2, 3, 4, 5].map(n => `<i class="fa-solid fa-star ${Number(v) >= n ? 'on' : ''}"></i>`).join('')}</span>`;
    return esc(v);
  }

  function render() {
    if (!data) return;
    const st = data.student;
    $('rpName').textContent = `${st.nickname ? 'น้อง' + String(st.nickname).replace(/^น้อง/, '') + ' · ' : ''}${st.name}`;
    $('rpMeta').textContent = [st.grade && `ชั้น ${st.grade}`, st.school].filter(Boolean).join(' · ');

    const courseIds = [...new Set([].concat(data.courseIds || [], (data.attendance || []).map(a => a.courseId), (data.evaluations || []).map(e => e.courseId)))];
    if (!courseIds.length) {
      $('rpMain').innerHTML = '<p class="rp-empty">ยังไม่มีข้อมูลการเรียน</p>';
      return;
    }
    $('rpMain').innerHTML = courseIds.map(cid => {
      const att = (data.attendance || []).filter(a => a.courseId === cid);
      const evs = (data.evaluations || []).filter(e => e.courseId === cid).sort((a, b) => b.no - a.no);
      const n = k => att.filter(a => a.status === k).length;
      // อัตราเข้าเรียน: วันที่แจ้งลาไม่นับเป็นการขาด
      const came = n('present') + n('late');
      const counted = att.length - n('leave');
      const rate = counted > 0 ? Math.round((came / counted) * 100) : null;
      return `
        <section class="rp-course">
          <h2><i class="fa-solid fa-book-open"></i> ${esc(courseTitle(cid))}</h2>
          <div class="rp-stats">
            <div class="rp-stat big"><b>${rate === null ? '-' : rate + '%'}</b><span>เข้าเรียน</span></div>
            <div class="rp-stat ok"><b>${n('present')}</b><span>มาเรียน</span></div>
            <div class="rp-stat late"><b>${n('late')}</b><span>มาสาย</span></div>
            <div class="rp-stat leave"><b>${n('leave')}</b><span>ลา</span></div>
            <div class="rp-stat absent"><b>${n('absent')}</b><span>ขาด</span></div>
          </div>

          <h3><i class="fa-solid fa-clipboard-check"></i> ผลประเมินรายครั้ง</h3>
          ${evs.length ? `<div class="rp-evals">${evs.map(ev => {
            const items = Array.isArray(ev.items) ? ev.items : [];
            const sc = ev.scores || {};
            return `
              <article class="rp-eval">
                <header>
                  <span class="rp-no-badge">ครั้งที่ ${esc(ev.no)}</span>
                  <span class="rp-date">${esc(thaiDate(ev.date))}</span>
                  ${ev.behaviorLevel ? `<span class="rp-level lv-${esc(ev.behaviorLevel)}">${esc(LEVELS[ev.behaviorLevel] || '')}</span>` : ''}
                </header>
                ${ev.title ? `<p class="rp-topic">${esc(ev.title)}</p>` : ''}
                ${ev.behavior ? `<p class="rp-behavior"><i class="fa-solid fa-quote-left"></i> ${esc(ev.behavior)}</p>` : ''}
                ${items.length ? `<dl class="rp-items">${items.map(it => `<div><dt>${esc(it.label)}</dt><dd>${valueHtml(it, sc[it.id])}</dd></div>`).join('')}</dl>` : ''}
              </article>`;
          }).join('')}</div>` : '<p class="rp-empty small">ยังไม่มีผลประเมิน</p>'}

          <h3><i class="fa-solid fa-calendar-check"></i> ประวัติการเข้าเรียน</h3>
          ${att.length ? `<ul class="rp-att">${att.map(a => `
            <li class="s-${esc(a.status)}">
              <span>${esc(thaiDate(a.date))}</span>
              <b><i class="fa-solid ${(STATUS[a.status] || ['', 'fa-circle'])[1]}"></i> ${esc((STATUS[a.status] || [a.status])[0])}</b>
              <small>${[a.checkedAt ? `ถึงสถาบัน ${timeBkk(a.checkedAt)} น.` : '', a.note ? esc(a.note) : ''].filter(Boolean).join(' · ')}</small>
            </li>`).join('')}</ul>` : '<p class="rp-empty small">ยังไม่มีข้อมูลการเข้าเรียน</p>'}
        </section>`;
    }).join('');
  }

  async function load() {
    if (!token) { fail('ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากสถาบัน'); return; }
    try {
      data = await window.supabaseRpc('parent_report', { p_token: token });
      render();
    } catch (e) {
      fail(e.code === 'NOT_FOUND' ? 'ลิงก์นี้หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากสถาบัน' : 'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง');
    }
  }

  // ชื่อคอร์สมาจากข้อมูลหน้าเว็บ → วาดใหม่เมื่อโหลดเสร็จ
  document.addEventListener('newgen:synced', render);
  load();
})();
