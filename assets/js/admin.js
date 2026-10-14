/**
 * The NEW GEN Tutoring Institute - Admin Dashboard Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // ตรวจสอบสถานะการเข้าสู่ระบบ (จำรหัสผ่านไว้แม้ปิดแท็บหรือปิดเบราว์เซอร์)
  if (localStorage.getItem('newgen_admin_auth') !== 'true' && sessionStorage.getItem('newgen_admin_auth') !== 'true') {
    window.location.href = 'admin-login.html';
    return;
  }

  initAdminDashboard();
});

document.addEventListener('newgen:synced', () => {
  initAdminDashboard();
});

function initAdminDashboard() {
  try { loadAdminCourses(); } catch (e) { console.warn('loadAdminCourses error:', e); }
  try { loadPrivilegeBanner(); } catch (e) { console.warn('loadPrivilegeBanner error:', e); }
  try { loadHomeSettings(); } catch (e) { console.warn('loadHomeSettings error:', e); }
  try { loadAdminTutors(); } catch (e) { console.warn('loadAdminTutors error:', e); }
  try { loadTutorsQuote(); } catch (e) { console.warn('loadTutorsQuote error:', e); }
  try { loadAboutSettings(); } catch (e) { console.warn('loadAboutSettings error:', e); }
  try { loadAdminReviews(); } catch (e) { console.warn('loadAdminReviews error:', e); }
  try { loadAdminAchievements(); } catch (e) { console.warn('loadAdminAchievements error:', e); }
  try { loadAdminVideos(); } catch (e) { console.warn('loadAdminVideos error:', e); }
  try { loadAdminContact(); } catch (e) { console.warn('loadAdminContact error:', e); }
  try { loadAdminWhyUs(); } catch (e) { console.warn('loadAdminWhyUs error:', e); }
  try { loadSecuritySettings(); } catch (e) { console.warn('loadSecuritySettings error:', e); }
  try { loadAdminEnrollments(); } catch (e) { console.warn('loadAdminEnrollments error:', e); }
  try { loadAdminEnrollmentConfig(); } catch (e) { console.warn('loadAdminEnrollmentConfig error:', e); }
  try { loadAdminPopupCampaign(); } catch (e) { console.warn('loadAdminPopupCampaign error:', e); }
  try { checkSupabaseConnection(false); } catch (e) { console.warn('checkSupabaseConnection error:', e); }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function logoutAdmin() {
  if (confirm('คุณต้องการออกจากระบบจัดการหลังบ้านหรือไม่?')) {
    localStorage.removeItem('newgen_admin_auth');
    localStorage.removeItem('newgen_admin_user');
    sessionStorage.removeItem('newgen_admin_auth');
    sessionStorage.removeItem('newgen_admin_user');
    window.location.href = 'admin-login.html';
  }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('adminToast');
  const toastMsg = document.getElementById('toastMsg');
  if (toastMsg) toastMsg.textContent = msg;
  if (toast) {
    toast.className = 'admin-toast-alert';
    if (type === 'warning') toast.classList.add('warning');
    if (type === 'error') toast.classList.add('error');

    const icon = toast.querySelector('i');
    if (icon) {
      if (type === 'warning') {
        icon.className = 'fa-solid fa-triangle-exclamation';
      } else if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark';
      } else {
        icon.className = 'fa-solid fa-circle-check';
      }
    }

    toast.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => toast.classList.remove('show'), type === 'warning' ? 5000 : 3500);
  }
}

async function checkSupabaseConnection(isUserClick = false) {
  const badge = document.getElementById('supabaseStatusBadge');
  const textEl = document.getElementById('supabaseStatusText');
  if (!badge || !textEl) return;

  if (isUserClick) {
    textEl.textContent = 'กำลังทดสอบเชื่อมต่อ...';
    badge.className = 'supabase-status-pill';
  }

  try {
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url) {
      badge.className = 'supabase-status-pill offline';
      textEl.textContent = 'ไม่พบคอนฟิก Supabase';
      return;
    }

    // 1. ทดสอบอ่าน (GET)
    const getRes = await fetch(`${config.url}/rest/v1/app_data?select=key&limit=1`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    if (!getRes.ok) {
      badge.className = 'supabase-status-pill offline';
      textEl.textContent = `Supabase ออฟไลน์ (${getRes.status})`;
      if (isUserClick) alert(`ไม่สามารถเชื่อมต่อ Supabase ได้ (HTTP ${getRes.status}) กรุณาตรวจสอบ Network หรือ API Key`);
      return;
    }

    // 2. ทดสอบเขียน (POST ping)
    const pingRes = await fetch(`${config.url}/rest/v1/app_data?on_conflict=key`, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key: 'admin_ping', data: { ping: true, time: new Date().toISOString() } })
    });

    if (pingRes.ok) {
      badge.className = 'supabase-status-pill online';
      textEl.textContent = 'Supabase Cloud: เชื่อมต่อสมบูรณ์';
      if (isUserClick) showToast('✅ Supabase Cloud: อ่าน-เขียนข้อมูลออนไลน์สำเร็จสมบูรณ์!', 'success');
    } else {
      const errText = await pingRes.text();
      badge.className = 'supabase-status-pill warning';
      if (errText.includes('row-level security') || pingRes.status === 401) {
        textEl.textContent = 'Supabase: อ่านได้ (รอปลดล็อก RLS)';
        if (isUserClick) {
          alert('⚠️ Supabase Cloud อ่านข้อมูลได้ แต่ติดระบบ Row-Level Security (RLS)\n\n👉 วิธีแก้ไขง่ายๆ ใน 10 วินาที:\n1. ไปที่ Supabase Dashboard -> เมนู SQL Editor\n2. วางคำสั่งนี้แล้วกด RUN:\n\nALTER TABLE public.app_data DISABLE ROW LEVEL SECURITY;\n\nเมื่อรันเสร็จแล้ว จะสามารถบันทึกออนไลน์ได้ทันทีจากทุกเครื่องครับ!');
        }
      } else {
        textEl.textContent = 'Supabase: เขียนไม่ได้';
        if (isUserClick) alert(`Supabase แจ้งเตือน: ${errText}`);
      }
    }
  } catch (err) {
    badge.className = 'supabase-status-pill offline';
    textEl.textContent = 'Supabase: เครือข่ายขัดข้อง';
    if (isUserClick) showToast('⚠️ เครือข่ายขัดข้อง ไม่สามารถติดต่อ Supabase ได้', 'warning');
  }
}

function switchAdminTab(tabKey, btn) {
  // Support legacy or redirect keys
  if (tabKey === 'security') {
    tabKey = 'system';
    setTimeout(() => switchSystemSubtab('security'), 10);
  } else if (tabKey === 'backup') {
    tabKey = 'system';
    setTimeout(() => switchSystemSubtab('backup'), 10);
  } else if (tabKey === 'whyus') {
    tabKey = 'home';
    setTimeout(() => switchHomeSubtab('whyus'), 10);
  } else if (tabKey === 'popup') {
    tabKey = 'home';
    setTimeout(() => switchHomeSubtab('popup'), 10);
  }

  document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  
  const pane = document.getElementById(`tab-${tabKey}`);
  if (pane) {
    pane.classList.add('active');
    // Mobile screen: smoothly scroll down to the content pane
    if (window.innerWidth <= 900) {
      setTimeout(() => {
        pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      // Desktop: always reset scroll position to top of workspace so content is never hidden
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  if (btn) {
    btn.classList.add('active');
  } else {
    const navBtn = document.querySelector(`.admin-nav-item[onclick*="'${tabKey}'"]`) || document.getElementById(tabKey === 'system' ? 'navTabSystem' : (tabKey === 'enrollments' ? 'navTabEnrollments' : ''));
    if (navBtn) navBtn.classList.add('active');
  }

  // Reload fresh data for whichever tab is opened
  try {
    if (tabKey === 'courses') {
      loadAdminCourses();
      loadPrivilegeBanner();
    } else if (tabKey === 'enrollments') {
      loadAdminEnrollments();
      loadAdminEnrollmentConfig();
    } else if (tabKey === 'home') {
      loadHomeSettings();
      loadAdminWhyUs();
      loadAdminPopupCampaign();
    } else if (tabKey === 'tutors') {
      loadAdminTutors();
      loadTutorsQuote();
    } else if (tabKey === 'about') {
      loadAboutSettings();
    } else if (tabKey === 'reviews') {
      loadAdminReviews();
      loadAdminAchievements();
    } else if (tabKey === 'videos') {
      loadAdminVideos();
    } else if (tabKey === 'contact') {
      loadAdminContact();
    } else if (tabKey === 'system') {
      loadSecuritySettings();
    }
  } catch (err) {
    console.warn(`Error loading tab ${tabKey}:`, err);
  }
}

function switchHomeSubtab(subtab) {
  const btnGeneral = document.getElementById('btnHomeSubtabGeneral');
  const btnWhyUs = document.getElementById('btnHomeSubtabWhyUs');
  const btnPopup = document.getElementById('btnHomeSubtabPopup');
  const subtabGeneral = document.getElementById('subtabHomeGeneral');
  const subtabWhyUs = document.getElementById('subtabHomeWhyUs');
  const subtabPopup = document.getElementById('subtabHomePopup');

  if (btnGeneral) btnGeneral.classList.toggle('active', subtab === 'general');
  if (btnWhyUs) btnWhyUs.classList.toggle('active', subtab === 'whyus');
  if (btnPopup) btnPopup.classList.toggle('active', subtab === 'popup');

  if (subtabGeneral) subtabGeneral.style.display = subtab === 'general' ? 'block' : 'none';
  if (subtabWhyUs) subtabWhyUs.style.display = subtab === 'whyus' ? 'block' : 'none';
  if (subtabPopup) subtabPopup.style.display = subtab === 'popup' ? 'block' : 'none';

  if (subtab === 'whyus') {
    loadAdminWhyUs();
  } else if (subtab === 'popup') {
    loadAdminPopupCampaign();
  } else {
    loadHomeSettings();
  }
}

function switchSystemSubtab(subtab) {
  const btnSecurity = document.getElementById('btnSystemSubtabSecurity');
  const btnBackup = document.getElementById('btnSystemSubtabBackup');
  const subtabSecurity = document.getElementById('subtabSystemSecurity');
  const subtabBackup = document.getElementById('subtabSystemBackup');

  if (btnSecurity) btnSecurity.classList.toggle('active', subtab === 'security');
  if (btnBackup) btnBackup.classList.toggle('active', subtab === 'backup');

  if (subtabSecurity) subtabSecurity.style.display = subtab === 'security' ? 'block' : 'none';
  if (subtabBackup) subtabBackup.style.display = subtab === 'backup' ? 'block' : 'none';

  if (subtab === 'security') {
    loadSecuritySettings();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function previewUploadImage(event, previewId, inputTargetId, statusId) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById(previewId);
  const targetInput = document.getElementById(inputTargetId);
  const statusEl = statusId ? document.getElementById(statusId) : null;

  // 1. Instant preview via Object URL
  try {
    const tempUrl = URL.createObjectURL(file);
    if (preview) preview.src = tempUrl;
  } catch (e) {}

  if (statusEl) {
    statusEl.style.display = 'inline-block';
    statusEl.style.color = '#0284c7';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเตรียมและอัปโหลดรูปภาพ...';
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    
    // บีบอัดภาพด้วย Canvas ให้ขนาดกะทัดรัดป้องกัน Quota Exceeded
    const img = new Image();
    img.onload = function() {
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

      // ตั้งค่ารูปในฟอร์มทันทีเพื่อความรวดเร็ว
      if (preview) preview.src = compressedDataUrl;
      if (targetInput) targetInput.value = compressedDataUrl;
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#0284c7';
        statusEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-spin"></i> กำลังอัปโหลดขึ้น Supabase Cloud Storage...';
      }

      const tryLocalUpload = () => {
        const uploadApi = (window.getApiBaseUrl ? window.getApiBaseUrl() : '') + '/api/upload';
        fetch(uploadApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: compressedDataUrl, filename: file.name })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            if (targetInput) targetInput.value = data.url;
            if (preview) preview.src = window.resolveMediaUrl ? window.resolveMediaUrl(data.url) : data.url;
            if (statusEl) {
              statusEl.style.color = '#16a34a';
              statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> อัปโหลดรูปภาพสำเร็จ';
              setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 4000);
            }
          } else {
            if (statusEl) {
              statusEl.style.color = '#16a34a';
              statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> พร้อมบันทึกภาพในระบบ';
            }
          }
        })
        .catch(() => {
          if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> พร้อมบันทึกภาพในระบบ';
          }
        });
      };

      // 1. ลองอัปโหลดขึ้น Supabase Cloud Storage ก่อนเสมอ
      if (window.NewGenDB && typeof window.NewGenDB.uploadImageToSupabase === 'function') {
        canvas.toBlob(async (blob) => {
          if (!blob) { tryLocalUpload(); return; }
          try {
            const publicUrl = await window.NewGenDB.uploadImageToSupabase(blob, file.name);
            if (publicUrl) {
              if (targetInput) targetInput.value = publicUrl;
              if (preview) preview.src = publicUrl;
              if (statusEl) {
                statusEl.style.color = '#16a34a';
                statusEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> อัปโหลดขึ้น Supabase Storage สำเร็จ';
                setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 4000);
              }
              return;
            }
          } catch (e) {}
          tryLocalUpload();
        }, 'image/jpeg', 0.85);
      } else {
        tryLocalUpload();
      }
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

/* ===================================================================
   1. COURSES MANAGEMENT
   =================================================================== */
function loadAdminCourses() {
  const courses = window.NewGenDB.getCourses();
  const tbody = document.getElementById('adminCoursesTableBody');
  if (!tbody) return;

  tbody.innerHTML = courses.map((c, idx) => {
    const enrollList = window.NewGenDB ? window.NewGenDB.getEnrollmentsByCourse(c.id) : [];
    const enrollCount = enrollList.length;

    const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : { remainingSeats: c.remainingSeats, isFull: c.isFull };
    const isFull = eff.isFull;
    const remaining = eff.remainingSeats;

    let seatBadgeHtml = '';
    if (isFull || remaining <= 0) {
      seatBadgeHtml = '<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:800; border:1px solid #fca5a5; white-space:nowrap; padding:4px 8px; font-size:0.75rem;">🛑 เต็มแล้ว</span>';
    } else if (remaining <= 5) {
      seatBadgeHtml = `<span class="badge" style="background:#fff7ed; color:#c2410c; font-weight:800; border:1px solid #fed7aa; white-space:nowrap; padding:4px 8px; font-size:0.75rem;">🔥 เหลือ ${remaining} ที่</span>`;
    } else {
      seatBadgeHtml = `<span class="badge" style="background:#f0fdf4; color:#15803d; font-weight:800; border:1px solid #bbf7d0; white-space:nowrap; padding:4px 8px; font-size:0.75rem;">⚡ ว่าง ${remaining} ที่</span>`;
    }

    const effStatus = window.getCourseEffectiveStatus ? window.getCourseEffectiveStatus(c) : {
      text: c.statusBadge || 'เปิดรับสมัคร',
      badgeClass: c.statusClass || 'badge-emerald'
    };

    return `
    <tr class="${c.isHidden ? 'course-row-hidden' : ''}">
      <td style="text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
          <span class="tutor-order-badge" style="width:22px; height:22px; font-size:0.75rem;">${idx + 1}</span>
          <div style="display: flex; flex-direction: column; gap: 1px;">
            <button type="button" class="btn-reorder-compact" onclick="moveCourseUp(${idx})" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-reorder-compact" onclick="moveCourseDown(${idx})" title="เลื่อนลง" ${idx === courses.length - 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </div>
      </td>
      <td style="text-align: center;">
        <img src="${c.cover || c.poster}" alt="${escapeHtml(c.title)}" style="width: 48px; height: 34px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-light); vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      </td>
      <td>
        <strong style="color: var(--color-navy); font-size: 0.92rem; display: block; line-height: 1.4;">${escapeHtml(c.title)}</strong>
        ${c.isHidden ? '<span class="badge-hidden-pill" style="margin-top: 4px; display: inline-flex;"><i class="fa-solid fa-eye-slash"></i> ซ่อนอยู่บนเว็บ</span>' : ''}
      </td>
      <td style="text-align: center; white-space: nowrap;">
        ${seatBadgeHtml}
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button type="button" 
          class="btn-visibility-toggle ${c.isHidden ? 'hidden' : 'active'}" 
          onclick="toggleCourseVisibility('${c.id}')"
          title="คลิกเพื่อสลับ: ซ่อน / แสดง คอร์สนี้บนหน้าเว็บไซต์"
          style="padding: 4px 10px; font-size: 0.76rem;">
          ${c.isHidden ? '<i class="fa-solid fa-eye-slash"></i> ซ่อน' : '<i class="fa-solid fa-eye"></i> แสดง'}
        </button>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button type="button" 
          class="btn-featured-toggle ${c.isFeatured !== false ? 'active' : ''}" 
          onclick="toggleCourseFeatured('${c.id}')"
          title="คลิกเพื่อสลับสถานะ: แสดงในคอร์สเรียนแนะนำบนหน้าแรก"
          style="padding: 4px 10px; font-size: 0.76rem;">
          ${c.isFeatured !== false ? '⭐ แนะนำ' : '⚪ ปิด'}
        </button>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <span class="badge ${effStatus.badgeClass}" style="font-size: 0.76rem; padding: 4px 9px; font-weight: 700;">${escapeHtml(effStatus.text)}</span>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px;">
          <button type="button" class="btn-xs-action" style="background:#2563eb; color:#ffffff; padding:4px 8px; border-radius:5px; font-size:0.75rem; font-weight:700;" onclick="viewCourseEnrollments('${c.id}')" title="ดูรายชื่อนักเรียนที่สมัคร (${enrollCount} คน)">
            <i class="fa-solid fa-users"></i> ${enrollCount}
          </button>
          <button type="button" class="btn-action-edit" onclick="openEditCourseModal('${c.id}')" title="แก้ไขคอร์สเรียน" style="padding: 4px 8px; font-size: 0.78rem;">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-action-del" onclick="deleteCourse('${c.id}')" title="ลบคอร์สเรียน" style="padding: 4px 8px; font-size: 0.78rem;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

function moveCourseUp(idx) {
  const courses = window.NewGenDB.getCourses();
  if (idx <= 0 || idx >= courses.length) return;
  const temp = courses[idx];
  courses[idx] = courses[idx - 1];
  courses[idx - 1] = temp;
  saveAndSyncCoursesOrder(courses, `เลื่อนคอร์ส "${temp.title}" ขึ้นเป็นลำดับที่ ${idx} สำเร็จแล้ว!`);
}

function moveCourseDown(idx) {
  const courses = window.NewGenDB.getCourses();
  if (idx < 0 || idx >= courses.length - 1) return;
  const temp = courses[idx];
  courses[idx] = courses[idx + 1];
  courses[idx + 1] = temp;
  saveAndSyncCoursesOrder(courses, `เลื่อนคอร์ส "${temp.title}" ลงเป็นลำดับที่ ${idx + 2} สำเร็จแล้ว!`);
}

async function saveAndSyncCoursesOrder(courses, successMsg) {
  // 1. บันทึกลำดับคอร์สขึ้น Cloud & LocalStorage
  const resCourses = await window.NewGenDB.saveCourses(courses);

  // 2. ซิงค์กับ Backend API (server.js)
  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(baseUrl + '/api/courses/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courses)
  }).catch(() => {});

  // 3. รีเฟรชตารางในหน้า Admin
  loadAdminCourses();

  if (resCourses && resCourses.success) {
    showToast(`✅ ${successMsg || 'บันทึกลำดับคอร์สเรียนและซิงค์ Cloud สำเร็จ!'}`, 'success');
  } else {
    showToast(`⚠️ ${successMsg || 'บันทึกลำดับในเครื่องแล้ว'} (${resCourses && resCourses.error ? resCourses.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

function toggleCourseFeatured(id) {
  const courses = window.NewGenDB.getCourses();
  const c = courses.find(item => item.id === id);
  if (!c) return;

  c.isFeatured = !(c.isFeatured !== false);
  try {
    window.NewGenDB.saveCourses(courses);
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // ซิงค์กับ Server
  fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c)
  }).catch(() => {});

  loadAdminCourses();
  showToast(c.isFeatured ? `แสดง "${c.title}" ในคอร์สแนะนำหน้าแรกแล้ว` : `ซ่อน "${c.title}" จากคอร์สแนะนำหน้าแรกแล้ว`);
}

async function toggleCourseVisibility(id) {
  const courses = window.NewGenDB.getCourses();
  const c = courses.find(item => item.id === id);
  if (!c) return;

  c.isHidden = !c.isHidden;

  const cloudRes = await window.NewGenDB.saveCourses(courses);

  // ซิงค์กับ Server Backend API (server.js)
  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(`${baseUrl}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c)
  }).catch(() => {});

  loadAdminCourses();
  if (typeof renderCourseCapacityCards === 'function') {
    const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
    renderCourseCapacityCards(courses, enrollments);
  }
  if (typeof renderAdminQuickCoursePills === 'function') {
    const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
    renderAdminQuickCoursePills(courses, enrollments);
  }

  if (c.isHidden) {
    showToast(`👁️‍🗨️ ซ่อนคอร์ส "${c.title}" จากหน้าเว็บไซต์แล้ว`, 'warning');
  } else {
    showToast(`👁️ แสดงคอร์ส "${c.title}" บนหน้าเว็บไซต์เรียบร้อยแล้ว`, 'success');
  }
}

function populateCategoryDropdown(selectedCategory) {
  const catSelect = document.getElementById('cCategory');
  if (!catSelect) return;
  const categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];
  catSelect.innerHTML = categories.map(cat => `
    <option value="${cat.id}">${cat.name}</option>
  `).join('');
  if (selectedCategory) {
    catSelect.value = selectedCategory;
  }
}

// -------------------------------------------------------------
// Highlights Builder (จุดเด่นคอร์ส)
// -------------------------------------------------------------
function renderHighlightsBuilder(highlights) {
  const container = document.getElementById('courseHighlightsContainer');
  if (!container) return;
  container.innerHTML = '';
  const list = (highlights && highlights.length) ? highlights : [''];
  list.forEach(item => addHighlightInputRow(item));
}

function addHighlightInputRow(val = '') {
  const container = document.getElementById('courseHighlightsContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'builder-row-item';
  div.innerHTML = `
    <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
    <input type="text" class="c-highlight-input" value="${escapeHtml(val)}" placeholder="เช่น ติวเข้ม Onsite กลุ่มเล็ก ซักถามได้ทันที...">
    <button type="button" class="builder-btn-delete" title="ลบรายการนี้" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  container.appendChild(div);
}

function getHighlightsFromBuilder() {
  const inputs = document.querySelectorAll('.c-highlight-input');
  const arr = [];
  inputs.forEach(input => {
    const val = input.value.trim();
    if (val) arr.push(val);
  });
  return arr;
}

// -------------------------------------------------------------
// Schedules Builder (ตารางเรียนและรอบเวลา)
// -------------------------------------------------------------
function renderSchedulesBuilder(schedules) {
  const container = document.getElementById('courseSchedulesContainer');
  if (!container) return;
  container.innerHTML = '';
  const list = (schedules && schedules.length) ? schedules : [{ type: 'แบบรายเทอม (วันเสาร์)', time: '09.00 - 12.15 น.', dates: 'เปิดเทอม 2/69' }];
  list.forEach(s => addScheduleInputRow(s.type || '', s.time || '', s.dates || ''));
}

function addScheduleInputRow(type = '', time = '', dates = '') {
  const container = document.getElementById('courseSchedulesContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'builder-schedule-item';
  div.innerHTML = `
    <input type="text" class="c-sched-type" value="${escapeHtml(type)}" placeholder="กลุ่ม / รูปแบบ (เช่น เสาร์)">
    <input type="text" class="c-sched-time" value="${escapeHtml(time)}" placeholder="เวลาเรียน (เช่น 09.00 - 12.15 น.)">
    <input type="text" class="c-sched-dates" value="${escapeHtml(dates)}" placeholder="วันที่เริ่ม - สิ้นสุด (เช่น 7 พ.ย. 69 - 20 ก.พ. 70)">
    <button type="button" class="builder-btn-delete" title="ลบรอบนี้" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  container.appendChild(div);
}

function getSchedulesFromBuilder() {
  const items = document.querySelectorAll('.builder-schedule-item');
  const arr = [];
  items.forEach(el => {
    const type = el.querySelector('.c-sched-type')?.value.trim() || '';
    const time = el.querySelector('.c-sched-time')?.value.trim() || '';
    const dates = el.querySelector('.c-sched-dates')?.value.trim() || '';
    if (type || time || dates) {
      arr.push({ type, time, dates });
    }
  });
  return arr;
}

// -------------------------------------------------------------
// Custom Extensible Sections Builder (Item 3)
// -------------------------------------------------------------
function renderCustomSectionsBuilder(sections) {
  const container = document.getElementById('courseCustomSectionsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (sections && Array.isArray(sections)) {
    sections.forEach(sec => addCustomSectionCard(sec.title || '', sec.content || ''));
  }
}

function addCustomSectionCard(title = '', content = '') {
  const container = document.getElementById('courseCustomSectionsContainer');
  if (!container) return;
  const card = document.createElement('div');
  card.className = 'builder-section-card';
  card.innerHTML = `
    <div class="builder-section-card-header">
      <span><i class="fa-solid fa-circle-info" style="color: var(--color-cyan);"></i> หัวข้อคำอธิบายเพิ่มเติม</span>
      <button type="button" class="builder-btn-delete" title="ลบหัวข้อนี้" onclick="this.closest('.builder-section-card').remove()">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <div class="builder-section-fields">
      <div>
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--color-navy); display: block; margin-bottom: 4px;">ชื่อหัวข้อ *</label>
        <input type="text" class="c-sec-title" value="${escapeHtml(title)}" placeholder="เช่น สิ่งที่จะได้รับในคอร์สนี้, แผนการเรียน, อุปกรณ์ที่แจก...">
      </div>
      <div>
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--color-navy); display: block; margin-bottom: 4px;">เนื้อหา / คำอธิบายเพิ่มเติม (ใส่เครื่องหมาย - ด้านหน้าเพื่อเป็นลิสต์หัวข้อย่อยได้) *</label>
        <textarea class="c-sec-content" rows="3" placeholder="ระบุเนื้อหา หรือรายละเอียดที่ต้องการอธิบายให้ลูกค้าทราบ...">${escapeHtml(content)}</textarea>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function getCustomSectionsFromBuilder() {
  const cards = document.querySelectorAll('.builder-section-card');
  const arr = [];
  cards.forEach(card => {
    const title = card.querySelector('.c-sec-title')?.value.trim() || '';
    const content = card.querySelector('.c-sec-content')?.value.trim() || '';
    if (title || content) {
      arr.push({ title, content });
    }
  });
  return arr;
}

// -------------------------------------------------------------
// Course Gallery Builder (Item 4: Extra Large Poster Images)
// -------------------------------------------------------------
function renderCourseGalleryBuilder(images) {
  const container = document.getElementById('courseGalleryContainer');
  if (!container) return;
  container.innerHTML = '';
  if (images && Array.isArray(images) && images.length > 0) {
    images.forEach(img => addCourseGalleryRow(typeof img === 'string' ? img : (img.url || '')));
  }
}

function addCourseGalleryRow(url = '') {
  const container = document.getElementById('courseGalleryContainer');
  if (!container) return;
  const rowId = 'cg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const div = document.createElement('div');
  div.className = 'builder-gallery-row';
  div.style.cssText = 'display: flex; gap: 10px; align-items: center; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;';
  div.innerHTML = `
    <div style="width: 55px; height: 55px; border-radius: 6px; overflow: hidden; background: #f1f5f9; flex-shrink: 0; border: 1px solid #cbd5e1;">
      <img id="${rowId}_prev" src="${url || 'assets/images/course-poster-primary.jpg'}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="file" accept="image/*" style="font-size: 0.8rem; flex: 1;" onchange="previewUploadImage(event, '${rowId}_prev', '${rowId}_url')">
        <input type="text" id="${rowId}_url" class="c-gallery-url" value="${escapeHtml(url)}" placeholder="หรือใส่ URL รูปภาพ..." style="flex: 2; padding: 6px 10px; font-size: 0.85rem; border: 1px solid #cbd5e1; border-radius: 6px;" oninput="document.getElementById('${rowId}_prev').src = this.value">
      </div>
    </div>
    <button type="button" class="builder-btn-delete" title="ลบรูปนี้" onclick="this.parentElement.remove()" style="background: #fee2e2; color: #dc2626; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer;">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  container.appendChild(div);
}

function getCourseGalleryFromBuilder() {
  const inputs = document.querySelectorAll('#courseGalleryContainer .c-gallery-url');
  const arr = [];
  inputs.forEach(inp => {
    const val = inp.value.trim();
    if (val) arr.push(val);
  });
  return arr;
}

// -------------------------------------------------------------
// Subject Breakdown Builder (Item 5: Separate Subjects Pricing & Details)
// -------------------------------------------------------------
function renderSubjectBreakdownBuilder(subjects) {
  const container = document.getElementById('courseSubjectBreakdownContainer');
  if (!container) return;
  container.innerHTML = '';
  if (subjects && Array.isArray(subjects) && subjects.length > 0) {
    subjects.forEach(s => addSubjectBreakdownRow(s));
  }
}

function addSubjectBreakdownRow(sb = {}) {
  const container = document.getElementById('courseSubjectBreakdownContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'builder-subject-item';
  div.style.cssText = 'background: #ffffff; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #b45309; font-size: 0.9rem;"><i class="fa-solid fa-book-open"></i> รายวิชาแยก</strong>
      <button type="button" class="builder-btn-delete" title="ลบวิชานี้" onclick="this.closest('.builder-subject-item').remove()" style="background: #fee2e2; color: #dc2626; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
      <input type="text" class="sb-name" value="${escapeHtml(sb.name || '')}" placeholder="ชื่อวิชา (เช่น คณิตศาสตร์, เคมี)" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
      <input type="text" class="sb-price" value="${escapeHtml(sb.price || '')}" placeholder="ราคาแยก (เช่น 1,800 บ.)" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
      <input type="text" class="sb-hours" value="${escapeHtml(sb.hours || '')}" placeholder="ชั่วโมง (เช่น 14 ชม.)" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px;">
      <input type="text" class="sb-tutor" value="${escapeHtml(sb.tutor || '')}" placeholder="ติวเตอร์ (เช่น พี่แม็ค วิศวะ มธ.)" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
      <input type="text" class="sb-details" value="${escapeHtml(sb.details || '')}" placeholder="หัวข้อ/เนื้อหาเด่น (เช่น ปูพื้นฐานพีชคณิต เรขาคณิต ตะลุยโจทย์)" style="padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
    </div>
  `;
  container.appendChild(div);
}

function getSubjectBreakdownFromBuilder() {
  const items = document.querySelectorAll('#courseSubjectBreakdownContainer .builder-subject-item');
  const arr = [];
  items.forEach(el => {
    const name = el.querySelector('.sb-name')?.value.trim() || '';
    const price = el.querySelector('.sb-price')?.value.trim() || '';
    const hours = el.querySelector('.sb-hours')?.value.trim() || '';
    const tutor = el.querySelector('.sb-tutor')?.value.trim() || '';
    const details = el.querySelector('.sb-details')?.value.trim() || '';
    if (name || price || tutor) {
      arr.push({ name, price, hours, tutor, details });
    }
  });
  return arr;
}

// -------------------------------------------------------------
// Course Tutors Checkbox Builder (Item 3: Select Tutors per Course)
// -------------------------------------------------------------
function renderCourseTutorsBuilder(selectedIds = []) {
  const container = document.getElementById('courseTutorsCheckboxContainer');
  if (!container) return;
  const tutors = window.NewGenDB ? window.NewGenDB.getTutors() : [];
  
  if (!tutors || tutors.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem; grid-column: 1/-1;">ยังไม่มีข้อมูลติวเตอร์ในระบบ กรุณาเพิ่มติวเตอร์ในแท็บ 'จัดการทีมติวเตอร์' ก่อนครับ</p>`;
    return;
  }

  container.innerHTML = tutors.map(t => {
    const isChecked = Array.isArray(selectedIds) && selectedIds.length > 0 ? selectedIds.includes(t.id) : true;
    return `
      <label class="tutor-select-pill" style="display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1.5px solid ${isChecked ? '#16a34a' : '#e2e8f0'}; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
        <input type="checkbox" class="c-tutor-checkbox" value="${t.id}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #16a34a; cursor: pointer;" onchange="this.closest('.tutor-select-pill').style.borderColor = this.checked ? '#16a34a' : '#e2e8f0'">
        <img src="${t.image || 'assets/images/tutor-non.png'}" alt="${t.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;">
        <div style="line-height: 1.2;">
          <strong style="color: var(--color-navy); font-size: 0.92rem; display: block;">${t.name}</strong>
          <small style="color: #0284c7; font-size: 0.75rem;">${t.heroBadge || t.subjects || ''}</small>
        </div>
      </label>
    `;
  }).join('');
}

function getCourseTutorsFromBuilder() {
  const checkboxes = document.querySelectorAll('#courseTutorsCheckboxContainer .c-tutor-checkbox:checked');
  const arr = [];
  checkboxes.forEach(cb => arr.push(cb.value));
  return arr;
}

// -------------------------------------------------------------
// Course Parent Info & FAQ Builder (Item 4: Parent Info per Course)
// -------------------------------------------------------------
function renderCourseParentFaqBuilder(faqList = []) {
  const container = document.getElementById('courseParentFaqContainer');
  if (!container) return;
  container.innerHTML = '';
  if (Array.isArray(faqList) && faqList.length > 0) {
    faqList.forEach(item => addCourseFaqRow(item.q || item.question || '', item.a || item.answer || ''));
  }
}

function addCourseFaqRow(question = '', answer = '') {
  const container = document.getElementById('courseParentFaqContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'builder-faq-item';
  div.style.cssText = 'background: #ffffff; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);';
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #854d0e; font-size: 0.9rem;"><i class="fa-solid fa-circle-question"></i> คำถาม / สิ่งที่ผู้ปกครองควรรู้</strong>
      <button type="button" class="builder-btn-delete" title="ลบข้อนี้" onclick="this.closest('.builder-faq-item').remove()" style="background: #fee2e2; color: #dc2626; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <div style="margin-bottom: 8px;">
      <input type="text" class="c-faq-q" value="${escapeHtml(question)}" placeholder="คำถาม / หัวข้อ (เช่น การแบ่งชำระค่าเรียนทำอย่างไร?)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; font-weight: 600;">
    </div>
    <div>
      <textarea class="c-faq-a" rows="2" placeholder="คำตอบ / รายละเอียด (เช่น ผู้ปกครองสามารถเลือกแบ่งชำระได้ตามสะดวก...)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">${escapeHtml(answer)}</textarea>
    </div>
  `;
  container.appendChild(div);
}

function getCourseParentFaqFromBuilder() {
  const items = document.querySelectorAll('#courseParentFaqContainer .builder-faq-item');
  const arr = [];
  items.forEach(el => {
    const q = el.querySelector('.c-faq-q')?.value.trim() || '';
    const a = el.querySelector('.c-faq-a')?.value.trim() || '';
    if (q || a) {
      arr.push({ q, a });
    }
  });
  return arr;
}

function openAddCourseModal() {
  document.getElementById('modalCourseTitle').textContent = 'เพิ่มคอร์สเรียนใหม่';
  document.getElementById('courseEditId').value = '';
  document.getElementById('cTitle').value = '';
  populateCategoryDropdown('primary');
  document.getElementById('cSubjects').value = '';
  document.getElementById('cStatus').value = 'เปิดรับสมัคร|badge-emerald';
  document.getElementById('cPriceOld').value = '5,900 บ.';
  document.getElementById('cPricePromo').value = '4,500';
  document.getElementById('cPriceUnit').value = 'บาท / เทอม';
  if (document.getElementById('cMonthlyPrice')) document.getElementById('cMonthlyPrice').value = '1,500 บาท / เดือน (20 ชม.)';
  if (document.getElementById('cLocation')) document.getElementById('cLocation').value = 'สถาบัน The NEW GEN (เรียนสด Onsite)';
  document.getElementById('cTotalHours').value = '42 ชั่วโมง (รายเทอม) / 20 ชม. (รายเดือน)';
  if (document.getElementById('cClassSize')) document.getElementById('cClassSize').value = 'กลุ่มเล็ก ดูแลใกล้ชิด ถามได้ทันที';
  if (document.getElementById('cMaterials')) document.getElementById('cMaterials').value = 'ฟรี! หนังสือและแนวข้อสอบเก็งพิเศษ';
  if (document.getElementById('cTrustGuarantee')) document.getElementById('cTrustGuarantee').value = 'การันตีการสอนโดยทีมติวเตอร์ The NEW GEN';
  document.getElementById('cImgUrl').value = 'assets/images/course-poster-primary.jpg';
  document.getElementById('cImgPreview').src = 'assets/images/course-poster-primary.jpg';
  if (document.getElementById('cShortDesc')) document.getElementById('cShortDesc').value = '';
  if (document.getElementById('cTargetAudience')) document.getElementById('cTargetAudience').value = '';
  if (document.getElementById('cBenefits')) document.getElementById('cBenefits').value = '';
  if (document.getElementById('cIsFeatured')) document.getElementById('cIsFeatured').checked = true;
  if (document.getElementById('cIsHidden')) document.getElementById('cIsHidden').checked = false;
  if (document.getElementById('cMaxSeats')) document.getElementById('cMaxSeats').value = '12';
  if (document.getElementById('cIsFull')) document.getElementById('cIsFull').checked = false;
  if (typeof updateCourseSeatCalcPreview === 'function') updateCourseSeatCalcPreview();

  renderCourseTutorsBuilder(['tutor-non', 'tutor-au', 'tutor-mac']);
  renderCourseGalleryBuilder([]);
  renderHighlightsBuilder([
    'เรียนสด Onsite กลุ่มเล็ก ทีมติวเตอร์ The NEW GEN ดูแลใกล้ชิด ซักถามได้ทันที',
    'ปูพื้นฐานเข้มข้น ครบทั้งเทคนิคคิดลัดและตะลุยโจทย์สอบแข่งขัน',
    'ฟรี! เอกสารประกอบการเรียนและแบบฝึกหัดเก็งแนวข้อสอบตลอดคอร์ส'
  ]);
  renderSubjectBreakdownBuilder([]);
  renderSchedulesBuilder([
    { type: 'แบบรายเทอม (วันเสาร์)', time: '09.00 - 12.15 น.', dates: 'เปิดเทอม 2/69' }
  ]);
  renderCustomSectionsBuilder([]);
  renderCourseParentFaqBuilder([
    {
      q: 'การแบ่งชำระค่าเรียนทำอย่างไร?',
      a: 'ผู้ปกครองสามารถเลือกแบ่งชำระค่าเรียนเป็นรายเดือน หรือแบ่งชำระเป็นงวดสำหรับแบบรายเทอมได้ตามความสะดวก โดยสามารถทักสอบถามรายละเอียดกับแอดมินทาง LINE ได้เลยครับ'
    },
    {
      q: 'เอกสารประกอบการเรียนต้องเตรียมมาเองหรือไม่?',
      a: 'ทางสถาบันจัดเตรียมชุดหนังสือ ชีทสรุปเนื้อหา และแบบฝึกหัดเก็งข้อสอบให้ฟรีตลอดคอร์ส นักเรียนเพียงเตรียมเครื่องเขียนมาเรียนได้เลยครับ'
    },
    {
      q: 'หากนักเรียนติดธุระหรือไม่สามารถมาเรียนสดได้?',
      a: 'สามารถแจ้งล่วงหน้ากับทางสถาบันเพื่อขอรับเอกสารสรุปและนัดหมายเวลาเพื่อสอบถามเนื้อหาที่ไม่เข้าใจกับพี่ๆ ติวเตอร์ได้โดยตรงครับ'
    }
  ]);

  document.getElementById('modalCourse').classList.add('active');
}

function updateCourseSeatCalcPreview() {
  const courseId = document.getElementById('courseEditId') ? document.getElementById('courseEditId').value.trim() : '';
  const maxSeatsInput = document.getElementById('cMaxSeats');
  const previewEl = document.getElementById('courseSeatCalcPreview');
  if (!previewEl || !maxSeatsInput) return;
  const maxVal = parseInt(maxSeatsInput.value, 10) || 12;
  const enrollments = (window.NewGenDB ? window.NewGenDB.getEnrollments() : []).filter(e => e.courseId === courseId);
  const count = enrollments.length;
  const remaining = Math.max(0, maxVal - count);
  const color = remaining === 0 ? '#dc2626' : (remaining <= 3 ? '#ea580c' : '#16a34a');
  previewEl.innerHTML = `ผู้สมัครขณะนี้: <strong>${count}</strong> คน | ที่นั่งคงเหลืออัตโนมัติ: <strong style="color: ${color};">${remaining}</strong> ที่นั่ง (จากความจุ ${maxVal} คน)`;
}

function openEditCourseModal(id) {
  const courses = window.NewGenDB.getCourses();
  const c = courses.find(item => item.id === id);
  if (!c) return;

  document.getElementById('modalCourseTitle').textContent = 'แก้ไขคอร์สเรียน';
  document.getElementById('courseEditId').value = c.id;
  document.getElementById('cTitle').value = c.title;
  populateCategoryDropdown(c.category);
  document.getElementById('cSubjects').value = c.subjects;
  
  const cStatusEl = document.getElementById('cStatus');
  if (cStatusEl) {
    cStatusEl.value = `${c.statusBadge}|${c.statusClass}`;
    if (!cStatusEl.value) {
      if ((c.statusBadge || '').includes('ใหม่')) {
        cStatusEl.value = '✨ คอร์สใหม่ล่าสุด|badge-gold';
      } else if ((c.statusBadge || '').includes('เต็ม')) {
        cStatusEl.value = '🛑 เต็มแล้ว|badge-red';
      } else if ((c.statusBadge || '').includes('ใกล้เต็ม')) {
        cStatusEl.value = '🔥 โควตาใกล้เต็ม|badge-red';
      } else {
        cStatusEl.value = 'เปิดรับสมัคร|badge-emerald';
      }
    }
  }
  document.getElementById('cPriceOld').value = c.priceOriginal || '';
  document.getElementById('cPricePromo').value = c.pricePromo || '';
  document.getElementById('cPriceUnit').value = c.priceUnit || '';
  if (document.getElementById('cMonthlyPrice')) document.getElementById('cMonthlyPrice').value = c.monthlyPrice || '';
  if (document.getElementById('cLocation')) document.getElementById('cLocation').value = c.location !== undefined ? c.location : 'สถาบัน The NEW GEN (เรียนสด Onsite)';
  document.getElementById('cTotalHours').value = c.totalHours || '';
  if (document.getElementById('cClassSize')) document.getElementById('cClassSize').value = c.classSize !== undefined ? c.classSize : 'กลุ่มเล็ก ดูแลใกล้ชิด ถามได้ทันที';
  if (document.getElementById('cMaterials')) document.getElementById('cMaterials').value = c.materials !== undefined ? c.materials : 'ฟรี! หนังสือและแนวข้อสอบเก็งพิเศษ';
  if (document.getElementById('cTrustGuarantee')) document.getElementById('cTrustGuarantee').value = c.trustGuarantee !== undefined ? c.trustGuarantee : 'การันตีการสอนโดยทีมติวเตอร์ The NEW GEN';
  document.getElementById('cImgUrl').value = c.cover || c.poster;
  document.getElementById('cImgPreview').src = c.cover || c.poster;
  document.getElementById('cShortDesc').value = c.shortDesc || '';
  if (document.getElementById('cTargetAudience')) document.getElementById('cTargetAudience').value = c.targetAudience || '';
  if (document.getElementById('cBenefits')) document.getElementById('cBenefits').value = c.benefits || '';
  if (document.getElementById('cIsFeatured')) document.getElementById('cIsFeatured').checked = c.isFeatured !== false;
  if (document.getElementById('cIsHidden')) document.getElementById('cIsHidden').checked = (c.isHidden === true);
  if (document.getElementById('cMaxSeats')) {
    document.getElementById('cMaxSeats').value = (c.maxSeats !== undefined && c.maxSeats !== null) ? c.maxSeats : 12;
  }
  if (document.getElementById('cIsFull')) {
    document.getElementById('cIsFull').checked = (c.isFull === true);
  }
  updateCourseSeatCalcPreview();

  renderCourseTutorsBuilder(c.tutorIds || []);
  renderCourseGalleryBuilder(c.galleryImages || []);
  renderHighlightsBuilder(c.highlights || []);
  renderSubjectBreakdownBuilder(c.subjectBreakdown || []);
  renderSchedulesBuilder(c.scheduleList || []);
  renderCustomSectionsBuilder(c.customSections || []);
  renderCourseParentFaqBuilder(c.parentFaq || []);

  document.getElementById('modalCourse').classList.add('active');
}

async function handleSaveCourse(e) {
  e.preventDefault();
  const id = document.getElementById('courseEditId').value.trim();
  const statusSplit = document.getElementById('cStatus').value.split('|');
  const courses = window.NewGenDB.getCourses();
  const categories = window.NewGenDB.getCategories();
  const isFeatured = document.getElementById('cIsFeatured') ? document.getElementById('cIsFeatured').checked : true;
  const isHidden = document.getElementById('cIsHidden') ? document.getElementById('cIsHidden').checked : false;
  const selectedCat = document.getElementById('cCategory').value;
  const matchedCatObj = categories.find(cat => cat.id === selectedCat);

  const maxSeatsVal = document.getElementById('cMaxSeats') ? (parseInt(document.getElementById('cMaxSeats').value, 10) || 12) : 12;
  const enrollmentsForThis = (window.NewGenDB ? window.NewGenDB.getEnrollments() : []).filter(en => en.courseId === id);
  const remainingCalc = Math.max(0, maxSeatsVal - enrollmentsForThis.length);
  const isFullManual = document.getElementById('cIsFull') ? document.getElementById('cIsFull').checked : false;
  const isFull = isFullManual || (remainingCalc <= 0);

  const courseObj = {
    id: id || `course-${Date.now()}`,
    category: selectedCat,
    categoryLabel: matchedCatObj ? matchedCatObj.name : (selectedCat === 'primary' ? 'ระดับประถมศึกษา (ป.4 - ป.6)' : 'ระดับมัธยมศึกษาตอนต้น (ม.1 - ม.3)'),
    title: document.getElementById('cTitle').value.trim(),
    subjects: document.getElementById('cSubjects').value.trim(),
    tutorIds: getCourseTutorsFromBuilder(),
    cover: document.getElementById('cImgUrl').value.trim() || 'assets/images/course-poster-primary.jpg',
    poster: document.getElementById('cImgUrl').value.trim() || 'assets/images/course-poster-primary.jpg',
    statusBadge: statusSplit[0],
    statusClass: statusSplit[1] || 'badge-emerald',
    priceOriginal: document.getElementById('cPriceOld').value.trim(),
    pricePromo: document.getElementById('cPricePromo').value.trim(),
    priceUnit: document.getElementById('cPriceUnit').value.trim(),
    monthlyPrice: document.getElementById('cMonthlyPrice') ? document.getElementById('cMonthlyPrice').value.trim() : '',
    location: document.getElementById('cLocation') ? document.getElementById('cLocation').value.trim() : '',
    totalHours: document.getElementById('cTotalHours').value.trim(),
    classSize: document.getElementById('cClassSize') ? document.getElementById('cClassSize').value.trim() : '',
    materials: document.getElementById('cMaterials') ? document.getElementById('cMaterials').value.trim() : '',
    trustGuarantee: document.getElementById('cTrustGuarantee') ? document.getElementById('cTrustGuarantee').value.trim() : '',
    shortDesc: document.getElementById('cShortDesc').value.trim(),
    isFeatured: isFeatured,
    isHidden: isHidden,
    maxSeats: maxSeatsVal,
    remainingSeats: remainingCalc,
    isFull: isFull,
    galleryImages: getCourseGalleryFromBuilder(),
    targetAudience: document.getElementById('cTargetAudience') ? document.getElementById('cTargetAudience').value.trim() : '',
    benefits: document.getElementById('cBenefits') ? document.getElementById('cBenefits').value.trim() : '',
    subjectBreakdown: getSubjectBreakdownFromBuilder(),
    scheduleList: getSchedulesFromBuilder(),
    highlights: getHighlightsFromBuilder(),
    customSections: getCustomSectionsFromBuilder(),
    parentFaq: getCourseParentFaqFromBuilder()
  };

  if (id) {
    const idx = courses.findIndex(c => c.id === id);
    if (idx !== -1) courses[idx] = { ...courses[idx], ...courseObj };
  } else {
    courses.push(courseObj);
  }

  const cloudRes = await window.NewGenDB.saveCourses(courses);

  // ซิงค์กับ Server API (ถ้ามี)
  fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courseObj)
  }).catch(() => {});

  loadAdminCourses();
  if (typeof loadAdminEnrollments === 'function') loadAdminEnrollments();
  closeModal('modalCourse');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกรายละเอียดคอร์สเรียนและซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกคอร์สในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteCourse(id) {
  if (confirm('ยืนยันที่จะลบคอร์สเรียนนี้หรือไม่?')) {
    let courses = window.NewGenDB.getCourses();
    courses = courses.filter(c => c.id !== id);
    const cloudRes = await window.NewGenDB.saveCourses(courses);

    // ซิงค์ลบกับ Server API (ถ้ามี)
    fetch(`/api/courses/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    loadAdminCourses();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบคอร์สเรียนและอัปเดต Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบคอร์สในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

// -------------------------------------------------------------
// Privilege Banner Management (Item 3)
// -------------------------------------------------------------
function loadPrivilegeBanner() {
  const priv = window.NewGenDB ? window.NewGenDB.getPrivilege() : null;
  const badgeInput = document.getElementById('editPrivilegeBadge');
  const textInput = document.getElementById('editPrivilegeText');
  if (badgeInput) badgeInput.value = (priv && priv.badge) ? priv.badge : 'สิทธิพิเศษ:';
  if (textInput) textInput.value = (priv && priv.text) ? priv.text : 'ทุกคอร์สสามารถแบ่งชำระได้ พร้อมรับฟรี! เอกสารชุดติวและแนวข้อสอบจริงตลอดคอร์ส';
}

async function savePrivilegeForm() {
  const badge = document.getElementById('editPrivilegeBadge')?.value.trim() || 'สิทธิพิเศษ:';
  const text = document.getElementById('editPrivilegeText')?.value.trim() || '';
  const privObj = { badge, text };

  let cloudRes = null;
  if (window.NewGenDB) {
    cloudRes = await window.NewGenDB.savePrivilege(privObj);
  }

  fetch('/api/privilege', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(privObj)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกแถบสิทธิพิเศษและซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกสิทธิพิเศษในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

// -------------------------------------------------------------
// Grade Levels / Categories Management (Item 5)
// -------------------------------------------------------------
function openCategoriesModal() {
  renderAdminCategories();
  document.getElementById('modalCategories').classList.add('active');
}

function renderAdminCategories() {
  const tbody = document.getElementById('adminCategoriesTableBody');
  if (!tbody) return;
  const categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];

  tbody.innerHTML = categories.map(cat => `
    <tr>
      <td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${escapeHtml(cat.id)}</code></td>
      <td><strong>${escapeHtml(cat.name)}</strong></td>
      <td style="text-align: right; white-space: nowrap;">
        <button type="button" class="btn-table-action edit" style="margin-right: 4px;" title="แก้ไขระดับชั้นนี้" onclick="openEditCategory('${escapeHtml(cat.id)}')">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" class="btn-table-action delete" title="ลบระดับชั้นนี้" onclick="deleteCategory('${escapeHtml(cat.id)}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditCategory(id) {
  const categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  const oldIdInput = document.getElementById('editCatOldId');
  const idInput = document.getElementById('editCatId');
  const nameInput = document.getElementById('editCatName');
  const displayLabel = document.getElementById('editCatDisplayLabel');
  const editBox = document.getElementById('editCategoryBox');
  const addBox = document.getElementById('addCategoryBox');

  if (oldIdInput) oldIdInput.value = cat.id;
  if (idInput) idInput.value = cat.id;
  if (nameInput) nameInput.value = cat.name;
  if (displayLabel) displayLabel.textContent = cat.name;

  if (editBox) editBox.style.display = 'block';
  if (addBox) addBox.style.display = 'none';

  editBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelEditCategory() {
  const editBox = document.getElementById('editCategoryBox');
  const addBox = document.getElementById('addCategoryBox');
  if (editBox) editBox.style.display = 'none';
  if (addBox) addBox.style.display = 'block';
}

async function handleSaveEditCategory() {
  const oldIdInput = document.getElementById('editCatOldId');
  const idInput = document.getElementById('editCatId');
  const nameInput = document.getElementById('editCatName');

  const oldId = oldIdInput ? oldIdInput.value.trim() : '';
  const newId = idInput ? idInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
  const newName = nameInput ? nameInput.value.trim() : '';

  if (!oldId || !newId || !newName) {
    alert('กรุณากรอกรหัสระดับชั้น (ภาษาอังกฤษ) และชื่อระดับชั้นให้ครบถ้วน');
    return;
  }

  let categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];
  if (newId !== oldId && categories.some(c => c.id === newId)) {
    alert(`รหัสระดับชั้น "${newId}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
    return;
  }

  // Update categories list
  let found = false;
  categories = categories.map(c => {
    if (c.id === oldId) {
      found = true;
      return { ...c, id: newId, name: newName };
    }
    return c;
  });

  if (!found) {
    alert('ไม่พบระดับชั้นที่ต้องการแก้ไข');
    return;
  }

  const cloudRes = await window.NewGenDB.saveCategories(categories);

  // Sync categories to server API
  fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories)
  }).catch(() => {});

  // Update courses if ID or label changed
  let courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  let coursesUpdated = false;
  courses = courses.map(c => {
    if (c.category === oldId) {
      coursesUpdated = true;
      return { ...c, category: newId, categoryLabel: newName };
    } else if (c.category === newId && c.categoryLabel !== newName) {
      coursesUpdated = true;
      return { ...c, categoryLabel: newName };
    }
    return c;
  });

  if (coursesUpdated) {
    await window.NewGenDB.saveCourses(courses);
    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courses)
    }).catch(() => {});
    if (typeof loadAdminCourses === 'function') loadAdminCourses();
  }

  cancelEditCategory();
  renderAdminCategories();
  populateCategoryDropdown();

  if (cloudRes && cloudRes.success) {
    showToast('✅ แก้ไขระดับชั้นและอัปเดตคอร์สที่เกี่ยวข้องเรียบร้อยแล้ว!', 'success');
  } else {
    showToast('⚠️ บันทึกการแก้ไขระดับชั้นในเครื่องแล้ว (รอปลดล็อก Supabase RLS)', 'warning');
  }
}

async function handleAddNewCategory() {
  const idInput = document.getElementById('newCatId');
  const nameInput = document.getElementById('newCatName');
  const id = idInput ? idInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
  const name = nameInput ? nameInput.value.trim() : '';

  if (!id || !name) {
    alert('กรุณากรอกรหัสระดับชั้น (ภาษาอังกฤษ) และชื่อระดับชั้นให้ครบถ้วน');
    return;
  }

  let categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];
  if (categories.some(c => c.id === id)) {
    alert('รหัสระดับชั้นนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
    return;
  }

  categories.push({ id, name, icon: 'fa-solid fa-graduation-cap' });
  const cloudRes = await window.NewGenDB.saveCategories(categories);

  // Sync to server
  fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories)
  }).catch(() => {});

  if (idInput) idInput.value = '';
  if (nameInput) nameInput.value = '';

  renderAdminCategories();
  populateCategoryDropdown();
  if (cloudRes && cloudRes.success) {
    showToast('✅ เพิ่มระดับชั้นใหม่และซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast('⚠️ เพิ่มระดับชั้นในเครื่องแล้ว (รอปลดล็อก Supabase RLS)', 'warning');
  }
}

async function deleteCategory(id) {
  if (id === 'primary' || id === 'secondary') {
    if (!confirm(`ระดับชั้น "${id}" เป็นระดับชั้นหลักของระบบ ยืนยันที่จะลบหรือไม่?`)) return;
  } else {
    if (!confirm('ยืนยันที่จะลบระดับชั้นนี้หรือไม่?')) return;
  }

  let categories = window.NewGenDB ? window.NewGenDB.getCategories() : [];
  categories = categories.filter(c => c.id !== id);
  const cloudRes = await window.NewGenDB.saveCategories(categories);

  // Sync to server
  fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories)
  }).catch(() => {});

  renderAdminCategories();
  populateCategoryDropdown();
  if (cloudRes && cloudRes.success) {
    showToast('✅ ลบระดับชั้นและซิงค์ Cloud เรียบร้อยแล้ว', 'success');
  } else {
    showToast('⚠️ ลบระดับชั้นในเครื่องแล้ว (รอปลดล็อก Supabase RLS)', 'warning');
  }
}

/* ===================================================================
   HOME SETTINGS & HERO TUTOR PLACEMENT
   =================================================================== */
function loadHomeSettings() {
  const home = window.NewGenDB.getHome();

  const heroBadgeInput = document.getElementById('homeHeroBadge');
  const heroSubtitleInput = document.getElementById('homeHeroSubtitle');
  const heroLeadTextInput = document.getElementById('homeHeroLeadText');
  const trust1 = document.getElementById('homeTrustBadge1');
  const trust2 = document.getElementById('homeTrustBadge2');
  const trust3 = document.getElementById('homeTrustBadge3');
  const headerPillInput = document.getElementById('homeTutorsHeaderPill');

  if (heroBadgeInput) heroBadgeInput.value = home.heroBadge || '';
  if (heroSubtitleInput) heroSubtitleInput.value = home.subtitle || '';
  if (heroLeadTextInput) heroLeadTextInput.value = home.leadText || '';
  if (headerPillInput) headerPillInput.value = home.heroTutorsHeaderPill || '';

  const trusts = home.trustBadges || [];
  if (trust1) trust1.value = trusts[0] || '';
  if (trust2) trust2.value = trusts[1] || '';
  if (trust3) trust3.value = trusts[2] || '';

  const coursesBadgeInput = document.getElementById('homeCoursesBadge');
  const coursesTitleInput = document.getElementById('homeCoursesTitle');
  const coursesHighlightInput = document.getElementById('homeCoursesHighlight');
  if (coursesBadgeInput) coursesBadgeInput.value = home.coursesBadge || 'POPULAR ONSITE COURSES';
  if (coursesTitleInput) coursesTitleInput.value = home.coursesTitle || 'คอร์สเรียน Onsite แนะนำ';
  if (coursesHighlightInput) coursesHighlightInput.value = home.coursesHighlight || 'เปิดเทอม 2/69';

  populateHeroTutorDropdowns();
}

function populateHeroTutorDropdowns() {
  const tutors = window.NewGenDB.getTutors();
  const home = window.NewGenDB.getHome();

  const selLeft = document.getElementById('homeTutorLeft');
  const selCenter = document.getElementById('homeTutorCenter');
  const selRight = document.getElementById('homeTutorRight');
  if (!selLeft || !selCenter || !selRight) return;

  const optionsHtml = tutors.map(t => `<option value="${t.id}">${escapeHtml(t.name)} — ${escapeHtml(t.honor)}</option>`).join('');

  selLeft.innerHTML = optionsHtml;
  selCenter.innerHTML = optionsHtml;
  selRight.innerHTML = optionsHtml;

  selLeft.value = home.heroTutorLeftId || (tutors[0] ? tutors[0].id : '');
  selCenter.value = home.heroTutorCenterId || (tutors.length > 1 ? tutors[1].id : (tutors[0] ? tutors[0].id : ''));
  selRight.value = home.heroTutorRightId || (tutors.length > 2 ? tutors[2].id : (tutors.length > 1 ? tutors[1].id : (tutors[0] ? tutors[0].id : '')));

  updateHeroTutorPreview('left', selLeft.value);
  updateHeroTutorPreview('center', selCenter.value);
  updateHeroTutorPreview('right', selRight.value);
}

function updateHeroTutorPreview(pos, tutorId) {
  const tutors = window.NewGenDB.getTutors();
  const t = tutors.find(item => item.id === tutorId);
  const target = document.getElementById(`previewTutor${pos.charAt(0).toUpperCase() + pos.slice(1)}`);
  if (!target) return;

  if (!t) {
    target.innerHTML = `<span style="color: #94a3b8; font-size: 0.85rem;">ยังไม่ได้เลือกติวเตอร์</span>`;
    return;
  }

  target.innerHTML = `
    <img src="${t.image}" alt="${escapeHtml(t.name)}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid ${pos === 'center' ? '#f97316' : '#cbd5e1'};">
    <div>
      <div style="font-weight: 700; color: var(--color-navy); font-size: 0.92rem;">${escapeHtml(t.name)}</div>
      <span style="font-size: 0.78rem; color: var(--color-blue-accent); font-weight: 600;">${escapeHtml(t.honor)}</span>
    </div>
  `;
}

async function saveHomeSettingsForm() {
  const home = window.NewGenDB.getHome();

  home.heroBadge = document.getElementById('homeHeroBadge')?.value.trim() || '';
  home.subtitle = document.getElementById('homeHeroSubtitle')?.value.trim() || '';
  home.leadText = document.getElementById('homeHeroLeadText')?.value.trim() || '';
  home.heroTutorsHeaderPill = document.getElementById('homeTutorsHeaderPill')?.value.trim() || '';

  const t1 = document.getElementById('homeTrustBadge1')?.value.trim();
  const t2 = document.getElementById('homeTrustBadge2')?.value.trim();
  const t3 = document.getElementById('homeTrustBadge3')?.value.trim();
  home.trustBadges = [t1, t2, t3].filter(Boolean);

  home.coursesBadge = document.getElementById('homeCoursesBadge')?.value.trim() || 'POPULAR ONSITE COURSES';
  home.coursesTitle = document.getElementById('homeCoursesTitle')?.value.trim() || 'คอร์สเรียน Onsite แนะนำ';
  home.coursesHighlight = document.getElementById('homeCoursesHighlight')?.value.trim() || 'เปิดเทอม 2/69';

  home.heroTutorLeftId = document.getElementById('homeTutorLeft')?.value || '';
  home.heroTutorCenterId = document.getElementById('homeTutorCenter')?.value || '';
  home.heroTutorRightId = document.getElementById('homeTutorRight')?.value || '';

  const cloudRes = await window.NewGenDB.saveHome(home);

  fetch('/api/home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(home)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกการตั้งค่าหน้าแรก & คอร์สแนะนำ และซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกหน้าแรกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

/* ===================================================================
   POPUP CAMPAIGN MANAGEMENT (โครงการติวฟรี & ประกาศหน้าแรก)
   =================================================================== */
function loadAdminPopupCampaign() {
  const popup = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
  if (!popup) return;

  const enabledCheckbox = document.getElementById('popupCampaignEnabled');
  const enabledLabel = document.getElementById('popupCampaignEnabledLabel');
  const imgUrlInput = document.getElementById('popupCampaignImgUrl');
  const imgPrev = document.getElementById('popupCampaignImgPreview');
  const badgeInput = document.getElementById('popupCampaignBadge');
  const miniBadgeInput = document.getElementById('popupCampaignMiniBadge');
  const titleInput = document.getElementById('popupCampaignTitle');
  const descInput = document.getElementById('popupCampaignDesc');
  const highlightsInput = document.getElementById('popupCampaignHighlights');
  const btnRegInput = document.getElementById('popupCampaignBtnReg');
  const btnLineInput = document.getElementById('popupCampaignBtnLine');
  const lineUrlInput = document.getElementById('popupCampaignLineUrl');

  const isEnabled = popup.enabled !== false;
  if (enabledCheckbox) enabledCheckbox.checked = isEnabled;
  if (enabledLabel) {
    enabledLabel.textContent = isEnabled ? 'เปิดแสดง Pop-up (Active)' : 'ซ่อน Pop-up ชั่วคราว (Hidden)';
    enabledLabel.style.color = isEnabled ? '#16a34a' : '#94a3b8';
  }

  const defaultImg = 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791819087634-e5ri.png';
  const imgUrl = popup.image || defaultImg;
  if (imgUrlInput) imgUrlInput.value = imgUrl;
  if (imgPrev) {
    const resolved = window.resolveMediaUrl ? window.resolveMediaUrl(imgUrl) : imgUrl;
    imgPrev.src = resolved;
  }

  if (badgeInput) badgeInput.value = popup.badge || '🔥 โครงการติวฟรี โควตาจำกัด 30 ที่นั่ง';
  if (miniBadgeInput) miniBadgeInput.value = popup.miniBadgeText || '🎁 โครงการติวฟรี! คลิกดูสิทธิ์';
  if (titleInput) titleInput.value = popup.title || 'โครงการติวฟรี ตะลุยโจทย์พิชิตเกรด 4 & สอบเข้า ม.1 / ม.4';
  if (descInput) descInput.value = popup.description || 'สัมผัสเทคนิคการสอนจริงโดยทีมติวเตอร์ The NEW GEN ฟรี! ไม่มีค่าใช้จ่าย พร้อมรับเอกสารสรุปสูตรเก็งข้อสอบจริง และแนวคิดลัดที่นำไปใช้สอบได้ทันที';
  
  if (highlightsInput) {
    if (Array.isArray(popup.highlights)) {
      highlightsInput.value = popup.highlights.join('\n');
    } else {
      highlightsInput.value = popup.highlights || '- เรียนสด Onsite กลุ่มเล็ก ติวเตอร์ประกบดูแลใกล้ชิด ซักถามได้ทันที\n- ฟรี! ชุดเอกสารแบบฝึกหัดและแนวข้อสอบเก็งพิเศษตลอดโครงการ\n- วิเคราะห์จุดอ่อนรายบุคคล พร้อมแนะแนววางแผนสอบเข้า รร. ดัง';
    }
  }

  if (btnRegInput) btnRegInput.value = popup.btnRegisterText || 'สมัครเข้าเรียนฟรีทันที';
  if (btnLineInput) btnLineInput.value = popup.btnLineText || 'สอบถามเพิ่มเติมทาง LINE';
  if (lineUrlInput) lineUrlInput.value = popup.lineUrl || 'https://lin.ee/RXrzi1G';
}

function togglePopupCampaignEnabledStatus(checked) {
  const enabledLabel = document.getElementById('popupCampaignEnabledLabel');
  if (enabledLabel) {
    enabledLabel.textContent = checked ? 'เปิดแสดง Pop-up (Active)' : 'ซ่อน Pop-up ชั่วคราว (Hidden)';
    enabledLabel.style.color = checked ? '#16a34a' : '#94a3b8';
  }
}

function updatePopupCampaignImgPreview(url) {
  const imgPrev = document.getElementById('popupCampaignImgPreview');
  if (!imgPrev) return;
  const resolved = window.resolveMediaUrl ? window.resolveMediaUrl(url || 'assets/images/course-poster-primary.jpg') : (url || 'assets/images/course-poster-primary.jpg');
  imgPrev.src = resolved;
}

async function handlePopupCampaignImgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('popupCampaignUploadStatus');
  const imgUrlInput = document.getElementById('popupCampaignImgUrl');
  const imgPrev = document.getElementById('popupCampaignImgPreview');

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#2563eb';
    statusEl.textContent = '⏳ กำลังอัปโหลดรูปภาพ...';
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    if (imgPrev) imgPrev.src = base64Data;

    try {
      if (window.NewGenDB && window.NewGenDB.uploadImageToSupabase) {
        const cloudUrl = await window.NewGenDB.uploadImageToSupabase(file, file.name);
        if (cloudUrl && cloudUrl.startsWith('http')) {
          if (imgUrlInput) imgUrlInput.value = cloudUrl;
          if (imgPrev) imgPrev.src = cloudUrl;
          if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.textContent = '✅ อัปโหลดขึ้น Cloud สำเร็จเรียบร้อย!';
          }
          return;
        }
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, filename: file.name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (imgUrlInput) imgUrlInput.value = data.url;
          if (imgPrev) imgPrev.src = data.url;
          if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.textContent = '✅ อัปโหลดเข้า Server สำเร็จ!';
          }
          return;
        }
      }

      if (imgUrlInput) imgUrlInput.value = base64Data;
      if (statusEl) {
        statusEl.style.color = '#16a34a';
        statusEl.textContent = '✅ ใช้ไฟล์ภาพเรียบร้อยแล้ว';
      }
    } catch (err) {
      console.warn('Upload error:', err);
      if (imgUrlInput) imgUrlInput.value = base64Data;
      if (statusEl) {
        statusEl.style.color = '#16a34a';
        statusEl.textContent = '✅ พร้อมใช้งานรูปภาพ';
      }
    }
  };
  reader.readAsDataURL(file);
}

function previewCampaignPopupInAdmin() {
  const imgUrl = (document.getElementById('popupCampaignImgUrl')?.value || '').trim() || 'assets/images/course-poster-primary.jpg';
  const badge = (document.getElementById('popupCampaignBadge')?.value || '').trim() || '🔥 โครงการติวฟรี โควตาจำกัด 30 ที่นั่ง';
  const title = (document.getElementById('popupCampaignTitle')?.value || '').trim() || 'โครงการติวฟรี ตะลุยโจทย์พิชิตเกรด 4 & สอบเข้า ม.1 / ม.4';
  const desc = (document.getElementById('popupCampaignDesc')?.value || '').trim() || 'สัมผัสเทคนิคการสอนจริงโดยทีมติวเตอร์ The NEW GEN ฟรี! ไม่มีค่าใช้จ่าย';
  const rawHighlights = (document.getElementById('popupCampaignHighlights')?.value || '').trim();
  const btnReg = (document.getElementById('popupCampaignBtnReg')?.value || '').trim() || 'สมัครเข้าเรียนฟรีทันที';
  const btnLine = (document.getElementById('popupCampaignBtnLine')?.value || '').trim() || 'สอบถามเพิ่มเติมทาง LINE';
  const lineUrl = (document.getElementById('popupCampaignLineUrl')?.value || '').trim() || 'https://lin.ee/RXrzi1G';

  const previewImg = document.getElementById('adminPreviewPopupImg');
  const previewBadge = document.getElementById('adminPreviewPopupBadge');
  const previewTitle = document.getElementById('adminPreviewPopupTitle');
  const previewDesc = document.getElementById('adminPreviewPopupDesc');
  const previewHighlights = document.getElementById('adminPreviewPopupHighlights');
  const previewBtnReg = document.getElementById('adminPreviewPopupBtnReg');
  const previewBtnLine = document.getElementById('adminPreviewPopupBtnLine');
  const previewBtnLineText = document.getElementById('adminPreviewPopupBtnLineText');

  if (previewImg) {
    const resolved = window.resolveMediaUrl ? window.resolveMediaUrl(imgUrl) : imgUrl;
    previewImg.src = resolved;
  }
  if (previewBadge) previewBadge.textContent = badge;
  if (previewTitle) previewTitle.textContent = title;
  if (previewDesc) previewDesc.textContent = desc;
  if (previewBtnReg) previewBtnReg.textContent = btnReg;
  if (previewBtnLineText) previewBtnLineText.textContent = btnLine;
  if (previewBtnLine) previewBtnLine.href = lineUrl;

  if (previewHighlights) {
    const lines = rawHighlights ? rawHighlights.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean) : [];
    if (lines.length > 0) {
      previewHighlights.innerHTML = lines.map(l => `
        <div class="popup-highlight-item">
          <i class="fa-solid fa-circle-check"></i>
          <span>${escapeHtml(l)}</span>
        </div>
      `).join('');
    } else {
      previewHighlights.innerHTML = '';
    }
  }

  const modal = document.getElementById('modalCampaignPreview');
  if (modal) modal.classList.add('active');
}

async function saveAdminPopupCampaignForm() {
  const enabled = document.getElementById('popupCampaignEnabled')?.checked !== false;
  const image = (document.getElementById('popupCampaignImgUrl')?.value || '').trim();
  const badge = (document.getElementById('popupCampaignBadge')?.value || '').trim();
  const miniBadgeText = (document.getElementById('popupCampaignMiniBadge')?.value || '').trim();
  const title = (document.getElementById('popupCampaignTitle')?.value || '').trim();
  const description = (document.getElementById('popupCampaignDesc')?.value || '').trim();
  const rawHighlights = (document.getElementById('popupCampaignHighlights')?.value || '').trim();
  const btnRegisterText = (document.getElementById('popupCampaignBtnReg')?.value || '').trim();
  const btnLineText = (document.getElementById('popupCampaignBtnLine')?.value || '').trim();
  const lineUrl = (document.getElementById('popupCampaignLineUrl')?.value || '').trim();

  if (!title) {
    showToast('⚠️ กรุณาระบุหัวข้อแคมเปญ (Title)', 'warning');
    return;
  }

  const highlights = rawHighlights ? rawHighlights.split('\n').map(l => l.trim()).filter(Boolean) : [];

  const popupData = {
    enabled,
    image: image || 'assets/images/course-poster-primary.jpg',
    badge: badge || '🔥 โครงการติวฟรี โควตาจำกัด 30 ที่นั่ง',
    miniBadgeText: miniBadgeText || '🎁 โครงการติวฟรี! คลิกดูสิทธิ์',
    title,
    description: description || '',
    highlights,
    btnRegisterText: btnRegisterText || 'สมัครเข้าเรียนฟรีทันที',
    btnLineText: btnLineText || 'สอบถามเพิ่มเติมทาง LINE',
    lineUrl: lineUrl || 'https://lin.ee/RXrzi1G',
    updatedAt: new Date().toISOString()
  };

  const cloudRes = await window.NewGenDB.savePopupCampaign(popupData);

  // Sync to local server
  fetch('/api/popup-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(popupData)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึก Pop-up แคมเปญ และซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'เชื่อมต่อออนไลน์แล้ว'})`, 'success');
  }
}

function resetPopupCampaignDefaults() {
  if (confirm('คุณต้องการคืนค่าเริ่มต้นของ Pop-up แคมเปญ (โครงการติวฟรี) หรือไม่?')) {
    const defaultData = {
      enabled: true,
      title: "โครงการติวฟรี ตะลุยโจทย์พิชิตเกรด 4 & สอบเข้า ม.1 / ม.4",
      badge: "🔥 โครงการติวฟรี โควตาจำกัด 30 ที่นั่ง",
      image: "https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791819087634-e5ri.png",
      description: "สัมผัสเทคนิคการสอนจริงโดยทีมติวเตอร์ The NEW GEN ฟรี! ไม่มีค่าใช้จ่าย พร้อมรับเอกสารสรุปสูตรเก็งข้อสอบจริง และแนวคิดลัดที่นำไปใช้สอบได้ทันที",
      highlights: [
        "- เรียนสด Onsite กลุ่มเล็ก ติวเตอร์ประกบดูแลใกล้ชิด ซักถามได้ทันที",
        "- ฟรี! ชุดเอกสารแบบฝึกหัดและแนวข้อสอบเก็งพิเศษตลอดโครงการ",
        "- วิเคราะห์จุดอ่อนรายบุคคล พร้อมแนะแนววางแผนสอบเข้า รร. ดัง"
      ],
      btnRegisterText: "สมัครเข้าเรียนฟรีทันที",
      btnLineText: "สอบถามเพิ่มเติมทาง LINE",
      lineUrl: "https://lin.ee/RXrzi1G",
      miniBadgeText: "🎁 โครงการติวฟรี! คลิกดูสิทธิ์"
    };
    window.NewGenDB.savePopupCampaign(defaultData);
    loadAdminPopupCampaign();
    showToast('รีเซ็ตข้อมูล Pop-up แคมเปญกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  }
}

/* ===================================================================
   TUTORS MANAGEMENT & REORDERING (แยกทีม Onsite & Online ชัดเจน)
   =================================================================== */
function filterTutorsAdminTable(type) {
  const btnAll = document.getElementById('btnTutorFilterAll');
  const btnOnsite = document.getElementById('btnTutorFilterOnsite');
  const btnOnline = document.getElementById('btnTutorFilterOnline');
  const secOnsite = document.getElementById('secTutorsOnsite');
  const secOnline = document.getElementById('secTutorsOnline');

  if (btnAll) btnAll.classList.toggle('active', type === 'all');
  if (btnOnsite) btnOnsite.classList.toggle('active', type === 'onsite');
  if (btnOnline) btnOnline.classList.toggle('active', type === 'online');

  if (secOnsite) secOnsite.style.display = (type === 'all' || type === 'onsite') ? 'block' : 'none';
  if (secOnline) secOnline.style.display = (type === 'all' || type === 'online') ? 'block' : 'none';
}

function loadAdminTutors() {
  const tutors = window.NewGenDB.getTutors();
  const onsiteTutors = tutors.filter(t => (t.type || 'onsite') === 'onsite');
  const onlineTutors = tutors.filter(t => t.type === 'online');

  // Update counts
  const badgeCountOnsite = document.getElementById('badgeCountOnsite');
  const labelCountOnsite = document.getElementById('labelCountOnsite');
  const badgeCountOnline = document.getElementById('badgeCountOnline');
  const labelCountOnline = document.getElementById('labelCountOnline');

  if (badgeCountOnsite) badgeCountOnsite.textContent = onsiteTutors.length;
  if (labelCountOnsite) labelCountOnsite.textContent = `${onsiteTutors.length} ท่าน`;
  if (badgeCountOnline) badgeCountOnline.textContent = onlineTutors.length;
  if (labelCountOnline) labelCountOnline.textContent = `${onlineTutors.length} ท่าน`;

  // Render Table 1: Onsite Tutors
  const tbodyOnsite = document.getElementById('adminTutorsOnsiteTableBody');
  if (tbodyOnsite) {
    if (onsiteTutors.length === 0) {
      tbodyOnsite.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">
            <i class="fa-solid fa-school" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
            ยังไม่มีติวเตอร์หลัก (สอน Onsite) ในระบบ — คลิกปุ่ม "+ เพิ่มติวเตอร์หลัก (Onsite)" เพื่อเพิ่มข้อมูล
          </td>
        </tr>
      `;
    } else {
      tbodyOnsite.innerHTML = onsiteTutors.map((t, idx) => `
        <tr>
          <td style="text-align: center;">
            <span class="tutor-order-badge" style="background: #e0f2fe; color: #0369a1;">${idx + 1}</span>
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; gap: 4px;">
              <button type="button" class="btn-reorder" onclick="moveTutorUp('${t.id}')" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button type="button" class="btn-reorder" onclick="moveTutorDown('${t.id}')" title="เลื่อนลง" ${idx === onsiteTutors.length - 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-down"></i>
              </button>
            </div>
          </td>
          <td>
            <img src="${window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image}" alt="${escapeHtml(t.name)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8;">
          </td>
          <td>
            <strong>${escapeHtml(t.name)}</strong>
            ${idx < 3 ? '<span class="badge" style="background:#fef3c7; color:#92400e; font-size:0.7rem; margin-left:6px;"><i class="fa-solid fa-star"></i> แสดงหน้าแรก</span>' : ''}
          </td>
          <td><span style="color: var(--color-blue-accent); font-weight: 700;">${escapeHtml(t.honor)}</span><br><small style="color: var(--text-muted);">${escapeHtml(t.degree)}</small></td>
          <td>${escapeHtml(t.subjects)}</td>
          <td>
            <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.78rem;">
              <i class="fa-solid fa-school"></i> สอน Onsite
            </span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-action-edit" onclick="openEditTutorModal('${t.id}')" title="แก้ไข">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-action-del" onclick="deleteTutor('${t.id}')" title="ลบ">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Table 2: Online Tutors
  const tbodyOnline = document.getElementById('adminTutorsOnlineTableBody');
  if (tbodyOnline) {
    if (onlineTutors.length === 0) {
      tbodyOnline.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">
            <i class="fa-solid fa-laptop-code" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
            ยังไม่มีติวเตอร์ในทีมสอน Online — คลิกปุ่ม "+ เพิ่มติวเตอร์สอน Online" เพื่อเพิ่มข้อมูล
          </td>
        </tr>
      `;
    } else {
      tbodyOnline.innerHTML = onlineTutors.map((t, idx) => `
        <tr>
          <td style="text-align: center;">
            <span class="tutor-order-badge" style="background: #ede9fe; color: #6d28d9;">${idx + 1}</span>
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; gap: 4px;">
              <button type="button" class="btn-reorder" onclick="moveTutorUp('${t.id}')" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button type="button" class="btn-reorder" onclick="moveTutorDown('${t.id}')" title="เลื่อนลง" ${idx === onlineTutors.length - 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-arrow-down"></i>
              </button>
            </div>
          </td>
          <td>
            <img src="${window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image}" alt="${escapeHtml(t.name)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #a855f7;">
          </td>
          <td><strong>${escapeHtml(t.name)}</strong></td>
          <td><span style="color: #7c3aed; font-weight: 700;">${escapeHtml(t.honor)}</span><br><small style="color: var(--text-muted);">${escapeHtml(t.degree)}</small></td>
          <td>${escapeHtml(t.subjects)}</td>
          <td>
            <span class="badge" style="background: #ede9fe; color: #6d28d9; font-weight: 700; font-size: 0.78rem;">
              <i class="fa-solid fa-laptop"></i> สอน Online
            </span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-action-edit" onclick="openEditTutorModal('${t.id}')" title="แก้ไข">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-action-del" onclick="deleteTutor('${t.id}')" title="ลบ">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Update dropdown options in Home tab
  populateHeroTutorDropdowns();
}

function moveTutorUp(id) {
  const tutors = window.NewGenDB.getTutors();
  const current = tutors.find(t => t.id === id);
  if (!current) return;
  const currentType = (current.type || 'onsite');
  const group = tutors.filter(t => (t.type || 'onsite') === currentType);
  const idx = group.findIndex(t => t.id === id);
  if (idx <= 0) return;
  const prevId = group[idx - 1].id;

  const idx1 = tutors.findIndex(t => t.id === id);
  const idx2 = tutors.findIndex(t => t.id === prevId);
  const temp = tutors[idx1];
  tutors[idx1] = tutors[idx2];
  tutors[idx2] = temp;

  saveAndSyncTutorsOrder(tutors, `เลื่อน "${current.name}" ขึ้นสำเร็จแล้ว!`);
}

function moveTutorDown(id) {
  const tutors = window.NewGenDB.getTutors();
  const current = tutors.find(t => t.id === id);
  if (!current) return;
  const currentType = (current.type || 'onsite');
  const group = tutors.filter(t => (t.type || 'onsite') === currentType);
  const idx = group.findIndex(t => t.id === id);
  if (idx < 0 || idx >= group.length - 1) return;
  const nextId = group[idx + 1].id;

  const idx1 = tutors.findIndex(t => t.id === id);
  const idx2 = tutors.findIndex(t => t.id === nextId);
  const temp = tutors[idx1];
  tutors[idx1] = tutors[idx2];
  tutors[idx2] = temp;

  saveAndSyncTutorsOrder(tutors, `เลื่อน "${current.name}" ลงสำเร็จแล้ว!`);
}

async function saveAndSyncTutorsOrder(tutors, successMsg) {
  // 1. บันทึกลำดับติวเตอร์ขึ้น Cloud
  const resTutors = await window.NewGenDB.saveTutors(tutors);

  // 2. ซิงค์ตำแหน่งติวเตอร์ 3 คนแรกของหมวด Onsite ในหน้าแรกให้ตรงตามลำดับทันที
  const onsiteTutors = tutors.filter(t => (t.type || 'onsite') === 'onsite');
  const home = window.NewGenDB.getHome();
  if (onsiteTutors[0]) home.heroTutorLeftId = onsiteTutors[0].id;
  if (onsiteTutors[1]) home.heroTutorCenterId = onsiteTutors[1].id;
  if (onsiteTutors[2]) home.heroTutorRightId = onsiteTutors[2].id;
  window.NewGenDB.saveHome(home);
  const resHome = await window.NewGenDB.saveToSupabase('home', home);

  // 3. ซิงค์กับ Backend API
  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(baseUrl + '/api/tutors/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutors)
  }).catch(() => {});

  // 4. รีเฟรชตารางและ Dropdown ในหน้า Admin
  loadAdminTutors();
  populateHeroTutorDropdowns();

  if (resTutors && resTutors.success && resHome && resHome.success) {
    showToast(`✅ ${successMsg || 'บันทึกลำดับติวเตอร์และซิงค์ Cloud สำเร็จ!'}`, 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${resTutors && resTutors.error ? resTutors.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

function openAddTutorModal(defaultType = 'onsite') {
  document.getElementById('modalTutorTitle').textContent = defaultType === 'online' ? 'เพิ่มติวเตอร์สอน Online' : 'เพิ่มติวเตอร์หลัก (Onsite)';
  document.getElementById('tutorEditId').value = '';
  const typeSelect = document.getElementById('tType');
  if (typeSelect) typeSelect.value = defaultType;
  document.getElementById('tName').value = '';
  document.getElementById('tHonor').value = '';
  document.getElementById('tDegree').value = '';
  document.getElementById('tSubjects').value = '';
  document.getElementById('tHeroBadge').value = '';
  document.getElementById('tImgUrl').value = 'assets/images/tutor-non.jpg';
  document.getElementById('tImgPreview').src = 'assets/images/tutor-non.jpg';
  document.getElementById('tBio').value = '';
  document.getElementById('tTagline').value = '';
  document.getElementById('modalTutor').classList.add('active');
}

function openEditTutorModal(id) {
  const tutors = window.NewGenDB.getTutors();
  const t = tutors.find(item => item.id === id);
  if (!t) return;

  document.getElementById('modalTutorTitle').textContent = 'แก้ไขข้อมูลติวเตอร์';
  document.getElementById('tutorEditId').value = t.id;
  const typeSelect = document.getElementById('tType');
  if (typeSelect) typeSelect.value = t.type === 'online' ? 'online' : 'onsite';
  document.getElementById('tName').value = t.name;
  document.getElementById('tHonor').value = t.honor;
  document.getElementById('tDegree').value = t.degree || '';
  document.getElementById('tSubjects').value = t.subjects || '';
  document.getElementById('tHeroBadge').value = t.heroBadge || t.badge || '';
  document.getElementById('tImgUrl').value = t.image;
  document.getElementById('tImgPreview').src = window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image;
  document.getElementById('tBio').value = t.bio || '';
  document.getElementById('tTagline').value = t.tagline || '';
  document.getElementById('modalTutor').classList.add('active');
}

async function handleSaveTutor(e) {
  e.preventDefault();
  const id = document.getElementById('tutorEditId').value.trim();
  const tutors = window.NewGenDB.getTutors();

  const tutorObj = {
    id: id || `tutor-${Date.now()}`,
    name: document.getElementById('tName').value.trim(),
    type: document.getElementById('tType')?.value || 'onsite',
    honor: document.getElementById('tHonor').value.trim(),
    degree: document.getElementById('tDegree').value.trim(),
    subjects: document.getElementById('tSubjects').value.trim(),
    heroBadge: document.getElementById('tHeroBadge').value.trim() || document.getElementById('tSubjects').value.trim(),
    image: document.getElementById('tImgUrl').value.trim() || 'assets/images/tutor-non.jpg',
    bio: document.getElementById('tBio').value.trim(),
    tagline: document.getElementById('tTagline').value.trim()
  };

  if (id) {
    const idx = tutors.findIndex(t => t.id === id);
    if (idx !== -1) tutors[idx] = tutorObj;
  } else {
    tutors.push(tutorObj);
  }

  const cloudRes = await window.NewGenDB.saveTutors(tutors);

  // Sync with Server
  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(baseUrl + '/api/tutors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutorObj)
  }).then(res => res.json()).then(result => {
    if (result && result.tutor && result.tutor.image && !result.tutor.image.startsWith('data:')) {
      const updatedTutors = window.NewGenDB.getTutors();
      const idx2 = updatedTutors.findIndex(t => t.id === tutorObj.id);
      if (idx2 !== -1) {
        updatedTutors[idx2].image = result.tutor.image;
        window.NewGenDB.saveTutors(updatedTutors);
        loadAdminTutors();
      }
    }
  }).catch(() => {});

  loadAdminTutors();
  closeModal('modalTutor');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกข้อมูลติวเตอร์และซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteTutor(id) {
  if (confirm('ยืนยันที่จะลบข้อมูลติวเตอร์ท่านนี้หรือไม่?')) {
    let tutors = window.NewGenDB.getTutors();
    tutors = tutors.filter(t => t.id !== id);
    const cloudRes = await window.NewGenDB.saveTutors(tutors);
    const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
    fetch(baseUrl + `/api/tutors/${id}`, { method: 'DELETE' }).catch(() => {});
    loadAdminTutors();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบติวเตอร์และซิงค์ Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบติวเตอร์ในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

function loadTutorsQuote() {
  const quoteData = window.NewGenDB.getTutorsQuote();
  const quoteInput = document.getElementById('editTutorQuoteText');
  const authorInput = document.getElementById('editTutorQuoteAuthor');
  if (quoteInput) quoteInput.value = quoteData.quote || '';
  if (authorInput) authorInput.value = quoteData.author || '— ทีมติวเตอร์ The NEW GEN';
}

async function saveTutorsQuoteForm() {
  const quoteText = document.getElementById('editTutorQuoteText')?.value.trim() || '';
  const authorText = document.getElementById('editTutorQuoteAuthor')?.value.trim() || '— ทีมติวเตอร์ The NEW GEN';

  const quoteData = {
    quote: quoteText,
    author: authorText
  };

  const cloudRes = await window.NewGenDB.saveTutorsQuote(quoteData);

  fetch('/api/tutors-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteData)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกคำคมทีมติวเตอร์และซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

/* ===================================================================
   ABOUT US & INSPIRATION MANAGEMENT
   =================================================================== */
function loadAboutSettings() {
  const about = window.NewGenDB.getAbout();
  populateAboutFields(about);

  // Sync fresh data from Backend API only if Supabase has not synced yet
  const apiUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '') + '/api/about';
  fetch(apiUrl)
    .then(res => res.json())
    .then(serverAbout => {
      if (serverAbout && (serverAbout.title || serverAbout.mainImage) && !window._supabaseAboutSynced) {
        window.aboutData = serverAbout;
        populateAboutFields(serverAbout);
      }
    })
    .catch(() => {});
}

function populateAboutFields(about) {
  if (!about) return;
  const heroDescInput = document.getElementById('aboutHeroDesc');
  const badgeInput = document.getElementById('aboutBadge');
  const titleInput = document.getElementById('aboutTitle');
  const subtitleInput = document.getElementById('aboutSubtitle');
  const mainImgInput = document.getElementById('aboutMainImgUrl');
  const mainImgPrev = document.getElementById('aboutMainImgPreview');
  const secImgInput = document.getElementById('aboutSecondaryImgUrl');
  const secImgPrev = document.getElementById('aboutSecondaryImgPreview');
  const parasInput = document.getElementById('aboutParagraphs');

  if (heroDescInput) heroDescInput.value = about.heroDesc || 'เรื่องราว ความตั้งใจ และจุดเริ่มต้นของการสร้างสถาบันกวดวิชาที่เข้าใจธรรมชาติของเด็ก GEN Z ยุคใหม่อย่างแท้จริง';
  if (badgeInput) badgeInput.value = about.badge || 'OUR INSPIRATION & STORY';
  if (titleInput) titleInput.value = about.title || 'แรงบันดาลใจในการเป็น The NEW GEN';
  if (subtitleInput) subtitleInput.value = about.subtitle || '';
  if (mainImgInput) mainImgInput.value = about.mainImage || 'assets/images/course-poster-primary.jpg';
  if (mainImgPrev) {
    const resolved = window.resolveMediaUrl ? window.resolveMediaUrl(about.mainImage) : about.mainImage;
    mainImgPrev.src = resolved || 'assets/images/course-poster-primary.jpg';
  }

  const secVal = about.secondaryImage || about.mainImage2 || 'assets/images/course-poster-secondary.jpg';
  if (secImgInput) secImgInput.value = secVal;
  if (secImgPrev) {
    const resolvedSec = window.resolveMediaUrl ? window.resolveMediaUrl(secVal) : secVal;
    secImgPrev.src = resolvedSec || 'assets/images/course-poster-secondary.jpg';
  }

  if (parasInput) {
    if (typeof about.paragraphs === 'string') {
      parasInput.value = about.paragraphs;
    } else if (Array.isArray(about.paragraphs)) {
      parasInput.value = about.paragraphs.join('\n\n');
    }
  }

  renderAboutGalleryBuilder(about.galleryImages || []);
}

function renderAboutGalleryBuilder(images) {
  const container = document.getElementById('aboutGalleryContainer');
  if (!container) return;
  container.innerHTML = '';
  if (Array.isArray(images) && images.length > 0) {
    images.forEach(img => {
      const url = typeof img === 'string' ? img : (img.url || '');
      const cap = typeof img === 'object' ? (img.caption || '') : '';
      addAboutGalleryRow(url, cap);
    });
  }
}

function addAboutGalleryRow(url = '', caption = '') {
  const container = document.getElementById('aboutGalleryContainer');
  if (!container) return;
  const id = 'aboutGal_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const div = document.createElement('div');
  div.className = 'builder-about-gallery-item';
  div.style.cssText = 'background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
  const resolvedUrl = window.resolveMediaUrl ? window.resolveMediaUrl(url || 'assets/images/course-poster-primary.jpg') : (url || 'assets/images/course-poster-primary.jpg');
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: var(--color-navy); font-size: 0.9rem;"><i class="fa-solid fa-image" style="color: var(--color-blue-accent);"></i> รูปภาพบรรยากาศ / กิจกรรม</strong>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="${id}_status" style="font-size: 0.78rem; font-weight: 700; color: #16a34a; display: none;"></span>
        <button type="button" class="builder-btn-delete" title="ลบรูปนี้" onclick="this.closest('.builder-about-gallery-item').remove()" style="background: #fee2e2; color: #dc2626; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: start;">
      <div style="width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; background: #f8fafc;">
        <img id="${id}_prev" src="${escapeHtml(resolvedUrl)}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div class="img-upload-field-row" style="margin: 0;">
          <input type="file" accept="image/*" onchange="previewUploadImage(event, '${id}_prev', '${id}_url', '${id}_status')">
          <input type="text" id="${id}_url" class="about-gal-url" value="${escapeHtml(url)}" placeholder="assets/images/... หรือ URL รูปภาพ" style="flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
        </div>
        <input type="text" class="about-gal-cap" value="${escapeHtml(caption)}" placeholder="คำบรรยายใต้ภาพ (เช่น บรรยากาศห้องเรียน Onsite กลุ่มเล็ก)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
      </div>
    </div>
  `;
  container.appendChild(div);
}

function getAboutGalleryFromBuilder() {
  const items = document.querySelectorAll('#aboutGalleryContainer .builder-about-gallery-item');
  const arr = [];
  items.forEach(el => {
    const url = el.querySelector('.about-gal-url')?.value.trim() || '';
    const caption = el.querySelector('.about-gal-cap')?.value.trim() || '';
    if (url) {
      arr.push({ url, caption });
    }
  });
  return arr;
}

async function saveAboutSettingsForm() {
  const saveBtn = document.getElementById('btnSaveAbout');
  const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...';
  }

  const about = {
    heroDesc: document.getElementById('aboutHeroDesc')?.value.trim() || 'เรื่องราว ความตั้งใจ และจุดเริ่มต้นของการสร้างสถาบันกวดวิชาที่เข้าใจธรรมชาติของเด็ก GEN Z ยุคใหม่อย่างแท้จริง',
    badge: document.getElementById('aboutBadge')?.value.trim() || 'OUR INSPIRATION & STORY',
    title: document.getElementById('aboutTitle')?.value.trim() || 'แรงบันดาลใจในการเป็น The NEW GEN',
    subtitle: document.getElementById('aboutSubtitle')?.value.trim() || '',
    mainImage: document.getElementById('aboutMainImgUrl')?.value.trim() || 'assets/images/course-poster-primary.jpg',
    secondaryImage: document.getElementById('aboutSecondaryImgUrl')?.value.trim() || 'assets/images/course-poster-secondary.jpg',
    paragraphs: document.getElementById('aboutParagraphs')?.value.trim() || '',
    galleryImages: getAboutGalleryFromBuilder()
  };

  // 1. บันทึกลง LocalStorage & Supabase Cloud
  const cloudRes = await window.NewGenDB.saveAbout(about);

  // 2. บันทึกขึ้น Backend API (ซึ่งจะแปลง base64 เป็นไฟล์รูปจริงใน uploads/ ให้ทันทีถ้ามีเซิร์ฟเวอร์)
  try {
    const apiUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '') + '/api/about';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(about)
    });
    const data = await res.json();
    if (data && data.success && data.about) {
      window.NewGenDB.saveAbout(data.about);
      if (data.about.mainImage) {
        const mainInput = document.getElementById('aboutMainImgUrl');
        const mainPrev = document.getElementById('aboutMainImgPreview');
        if (mainInput) mainInput.value = data.about.mainImage;
        if (mainPrev) {
          mainPrev.src = window.resolveMediaUrl ? window.resolveMediaUrl(data.about.mainImage) : data.about.mainImage;
        }
      }
    }
  } catch (e) {
    console.warn('Backend API save warning:', e);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnHtml || '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูลเกี่ยวกับเรา';
    }
  }

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกข้อมูลเกี่ยวกับเรา & ซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกข้อมูลในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

/* ===================================================================
   3. REVIEWS MANAGEMENT (Item 1: Real Student Reviews)
   =================================================================== */
function loadAdminReviews() {
  const reviews = window.NewGenDB.getReviews();
  const tbody = document.getElementById('adminReviewsTableBody');
  if (!tbody) return;

  tbody.innerHTML = reviews.map(r => `
    <tr>
      <td>
        <img src="${r.image || 'assets/images/course-poster-primary.jpg'}" alt="${escapeHtml(r.studentName || 'รีวิว')}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
      </td>
      <td><strong>${r.studentName ? escapeHtml(r.studentName) : '<span style="color: #94a3b8; font-style: italic;">(ไม่ระบุชื่อ)</span>'}</strong></td>
      <td><span style="color: var(--color-navy); font-weight: 700;">${r.school ? escapeHtml(r.school) : '<span style="color: #94a3b8; font-style: italic;">(ไม่ระบุโรงเรียน)</span>'}</span></td>
      <td>${r.examScore ? `<span class="badge badge-emerald">${escapeHtml(r.examScore)}</span>` : (r.quote ? `<small style="color: #64748b; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(r.quote)}</small>` : '—')}</td>
      <td style="text-align: center;">
        <button type="button" 
          class="btn-featured-toggle ${r.isFeatured !== false ? 'active' : ''}" 
          onclick="toggleReviewFeatured('${r.id}')"
          title="คลิกเพื่อสลับ: แสดงรีวิวนี้ในหน้าแรก">
          ${r.isFeatured !== false ? '⭐ หน้าแรก' : '⚪ ทั่วไป'}
        </button>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-action-edit" onclick="openEditReviewModal('${r.id}')" title="แก้ไข">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" class="btn-action-del" onclick="deleteReview('${r.id}')" title="ลบ">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleReviewFeatured(id) {
  const reviews = window.NewGenDB.getReviews();
  const r = reviews.find(item => item.id === id);
  if (!r) return;

  r.isFeatured = !(r.isFeatured !== false);
  const cloudRes = await window.NewGenDB.saveReviews(reviews);

  fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r)
  }).catch(() => {});

  loadAdminReviews();
  if (cloudRes && cloudRes.success) {
    showToast(r.isFeatured ? `✅ แสดงรีวิว "${r.studentName || ''}" ในหน้าแรกและซิงค์ Cloud แล้ว` : `✅ ซ่อนรีวิว "${r.studentName || ''}" จากหน้าแรกแล้ว`, 'success');
  } else {
    showToast(`⚠️ อัปเดตในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

function openAddReviewModal() {
  document.getElementById('modalReviewTitle').innerHTML = '<i class="fa-solid fa-comments" style="color: var(--color-cyan);"></i> เพิ่มรีวิวจริงจากนักเรียน The NEW GEN';
  document.getElementById('reviewEditId').value = '';
  document.getElementById('rName').value = '';
  document.getElementById('rSchool').value = '';
  document.getElementById('rScore').value = '';
  document.getElementById('rImgUrl').value = 'assets/images/course-poster-primary.jpg';
  document.getElementById('rImgPreview').src = 'assets/images/course-poster-primary.jpg';
  document.getElementById('rQuote').value = '';
  if (document.getElementById('rIsFeatured')) document.getElementById('rIsFeatured').checked = true;
  document.getElementById('modalReview').classList.add('active');
}

function openEditReviewModal(id) {
  const reviews = window.NewGenDB.getReviews();
  const r = reviews.find(item => item.id === id);
  if (!r) return;

  document.getElementById('modalReviewTitle').innerHTML = '<i class="fa-solid fa-comments" style="color: var(--color-cyan);"></i> แก้ไขรีวิวจริงจากนักเรียน The NEW GEN';
  document.getElementById('reviewEditId').value = r.id;
  document.getElementById('rName').value = r.studentName || '';
  document.getElementById('rSchool').value = r.school || '';
  document.getElementById('rScore').value = r.examScore || '';
  document.getElementById('rImgUrl').value = r.image || 'assets/images/course-poster-primary.jpg';
  document.getElementById('rImgPreview').src = r.image || 'assets/images/course-poster-primary.jpg';
  document.getElementById('rQuote').value = r.quote || '';
  if (document.getElementById('rIsFeatured')) document.getElementById('rIsFeatured').checked = (r.isFeatured !== false);
  document.getElementById('modalReview').classList.add('active');
}

async function handleSaveReview(e) {
  e.preventDefault();
  const id = document.getElementById('reviewEditId').value.trim();
  const reviews = window.NewGenDB.getReviews();

  const revObj = {
    id: id || `rev-${Date.now()}`,
    studentName: document.getElementById('rName').value.trim(),
    school: document.getElementById('rSchool').value.trim(),
    examScore: document.getElementById('rScore').value.trim(),
    image: document.getElementById('rImgUrl').value.trim() || 'assets/images/course-poster-primary.jpg',
    quote: document.getElementById('rQuote').value.trim(),
    isFeatured: document.getElementById('rIsFeatured') ? document.getElementById('rIsFeatured').checked : true
  };

  if (id) {
    const idx = reviews.findIndex(r => r.id === id);
    if (idx !== -1) reviews[idx] = revObj;
  } else {
    reviews.push(revObj);
  }

  const cloudRes = await window.NewGenDB.saveReviews(reviews);

  fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(revObj)
  }).catch(() => {});

  loadAdminReviews();
  closeModal('modalReview');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกรีวิวจริงและซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteReview(id) {
  if (confirm('ยืนยันที่จะลบข้อมูลผลงานนี้หรือไม่?')) {
    let reviews = window.NewGenDB.getReviews();
    reviews = reviews.filter(r => r.id !== id);
    const cloudRes = await window.NewGenDB.saveReviews(reviews);

    fetch(`/api/reviews/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    loadAdminReviews();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบผลงานรุ่นพี่และซิงค์ Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

/* ===================================================================
   3.1 ACHIEVEMENTS & HALL OF FAME MANAGEMENT
   =================================================================== */
function loadAdminAchievements() {
  const achievements = window.NewGenDB.getAchievements();
  const tbody = document.getElementById('adminAchievementsTableBody');
  if (!tbody) return;

  tbody.innerHTML = achievements.map((a, idx) => `
    <tr>
      <td>
        <img src="${a.image}" alt="Poster #${idx + 1}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 8px; border: 1.5px solid var(--border-light); cursor: pointer;" onclick="window.open('${a.image}', '_blank')">
      </td>
      <td>
        <div style="font-weight: 700; color: var(--color-navy); word-break: break-all;">${escapeHtml(a.image)}</div>
        <small style="color: var(--text-muted); font-size: 0.8rem;">รูปโปสเตอร์ลำดับที่ ${idx + 1}</small>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-action-edit" onclick="openEditAchievementModal('${a.id}')" title="เปลี่ยนรูปภาพ">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" class="btn-action-del" onclick="deleteAchievement('${a.id}')" title="ลบรูปภาพ">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddAchievementModal() {
  document.getElementById('modalAchievementTitle').textContent = 'เพิ่มรูปโปสเตอร์ผลงาน';
  document.getElementById('achEditId').value = '';
  if (document.getElementById('achTitle')) document.getElementById('achTitle').value = '';
  if (document.getElementById('achDate')) document.getElementById('achDate').value = '';
  if (document.getElementById('achDesc')) document.getElementById('achDesc').value = '';
  document.getElementById('achImgUrl').value = 'assets/images/course-poster-exam.jpg';
  document.getElementById('achImgPreview').src = 'assets/images/course-poster-exam.jpg';
  document.getElementById('modalAchievement').classList.add('active');
}

function openEditAchievementModal(id) {
  const achievements = window.NewGenDB.getAchievements();
  const a = achievements.find(item => item.id === id);
  if (!a) return;

  document.getElementById('modalAchievementTitle').textContent = 'เปลี่ยนรูปโปสเตอร์ผลงาน';
  document.getElementById('achEditId').value = a.id;
  if (document.getElementById('achTitle')) document.getElementById('achTitle').value = a.title || '';
  if (document.getElementById('achDate')) document.getElementById('achDate').value = a.date || '';
  if (document.getElementById('achDesc')) document.getElementById('achDesc').value = a.description || '';
  document.getElementById('achImgUrl').value = a.image;
  document.getElementById('achImgPreview').src = a.image;
  document.getElementById('modalAchievement').classList.add('active');
}

async function handleSaveAchievement(e) {
  e.preventDefault();
  const id = document.getElementById('achEditId').value.trim();
  const achievements = window.NewGenDB.getAchievements();

  const existing = id ? achievements.find(a => a.id === id) : null;
  const achObj = {
    id: id || `ach-${Date.now()}`,
    title: document.getElementById('achTitle') ? document.getElementById('achTitle').value.trim() : (existing ? existing.title : ''),
    date: document.getElementById('achDate') ? document.getElementById('achDate').value.trim() : (existing ? existing.date : ''),
    image: document.getElementById('achImgUrl').value.trim() || 'assets/images/course-poster-exam.jpg',
    description: document.getElementById('achDesc') ? document.getElementById('achDesc').value.trim() : (existing ? existing.description : '')
  };

  if (id) {
    const idx = achievements.findIndex(a => a.id === id);
    if (idx !== -1) achievements[idx] = achObj;
  } else {
    achievements.push(achObj);
  }

  const cloudRes = await window.NewGenDB.saveAchievements(achievements);

  fetch('/api/achievements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(achObj)
  }).catch(() => {});

  loadAdminAchievements();
  closeModal('modalAchievement');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกโปสเตอร์ความสำเร็จและซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteAchievement(id) {
  if (confirm('ยืนยันที่จะลบโปสเตอร์ความสำเร็จนี้หรือไม่?')) {
    let achievements = window.NewGenDB.getAchievements();
    achievements = achievements.filter(a => a.id !== id);
    const cloudRes = await window.NewGenDB.saveAchievements(achievements);

    fetch(`/api/achievements/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    loadAdminAchievements();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบโปสเตอร์ความสำเร็จและซิงค์ Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

/* ===================================================================
   4. VIDEOS MANAGEMENT
   =================================================================== */
function loadAdminVideos() {
  const tbody = document.getElementById('adminVideosTableBody');
  if (!tbody) return;

  const render = (videos) => {
    if (!videos || videos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">ยังไม่มีคลิปวิดีโอทดลองเรียน กดปุ่ม 'เพิ่มวิดีโอใหม่' ได้เลยครับ</td></tr>`;
      return;
    }
    tbody.innerHTML = videos.map(v => `
      <tr>
        <td>
          <img src="https://img.youtube.com/vi/${v.youtubeId}/default.jpg" alt="${v.title}" style="width: 70px; height: 44px; object-fit: cover; border-radius: 4px;">
        </td>
        <td><strong>${v.title}</strong></td>
        <td><span class="badge badge-primary-level">${v.subject}</span></td>
        <td><small>${v.tutor || '-'}</small></td>
        <td><code>${v.youtubeId}</code></td>
        <td style="text-align: right;">
          <button type="button" class="btn-action-edit" onclick="openEditVideoModal('${v.id}')" title="แก้ไข">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-action-del" onclick="deleteVideo('${v.id}')" title="ลบ">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  };

  const localVideos = window.NewGenDB.getVideos();
  render(localVideos);

  fetch('/api/videos')
    .then(r => r.json())
    .then(serverVideos => {
      if (Array.isArray(serverVideos) && serverVideos.length > 0 && !window._supabaseVideosSynced) {
        window.videosData = serverVideos;
        render(serverVideos);
      }
    })
    .catch(() => {});
}

function extractYoutubeIdFromInput() {
  const url = document.getElementById('vUrl').value.trim();
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    document.getElementById('vId').value = match[1];
  } else if (url.length === 11 && !url.includes('/')) {
    document.getElementById('vId').value = url;
  }
}

function openAddVideoModal() {
  document.getElementById('modalVideoTitle').textContent = 'เพิ่มวิดีโอใหม่';
  document.getElementById('videoEditId').value = '';
  document.getElementById('vTitle').value = '';
  document.getElementById('vSubject').value = '';
  document.getElementById('vTutor').value = '';
  document.getElementById('vUrl').value = '';
  document.getElementById('vId').value = '';
  document.getElementById('vDuration').value = '';
  document.getElementById('vDesc').value = '';
  document.getElementById('modalVideo').classList.add('active');
}

function openEditVideoModal(id) {
  const videos = window.NewGenDB.getVideos();
  const v = videos.find(item => item.id === id);
  if (!v) return;

  document.getElementById('modalVideoTitle').textContent = 'แก้ไขวิดีโอ';
  document.getElementById('videoEditId').value = v.id;
  document.getElementById('vTitle').value = v.title;
  document.getElementById('vSubject').value = v.subject;
  document.getElementById('vTutor').value = v.tutor || '';
  document.getElementById('vUrl').value = v.youtubeUrl || '';
  document.getElementById('vId').value = v.youtubeId;
  document.getElementById('vDuration').value = v.duration || '';
  document.getElementById('vDesc').value = v.description || '';
  document.getElementById('modalVideo').classList.add('active');
}

async function handleSaveVideo(e) {
  e.preventDefault();
  const id = document.getElementById('videoEditId').value.trim();
  const videos = window.NewGenDB.getVideos();

  let ytId = document.getElementById('vId').value.trim();
  if (!ytId) {
    extractYoutubeIdFromInput();
    ytId = document.getElementById('vId').value.trim() || 'OEBgi1xzb_c';
  }

  const vidObj = {
    id: id || `vid-${Date.now()}`,
    title: document.getElementById('vTitle').value.trim(),
    subject: document.getElementById('vSubject').value.trim(),
    tutor: document.getElementById('vTutor').value.trim(),
    youtubeUrl: document.getElementById('vUrl').value.trim(),
    youtubeId: ytId,
    duration: document.getElementById('vDuration').value.trim(),
    description: document.getElementById('vDesc').value.trim()
  };

  if (id) {
    const idx = videos.findIndex(v => v.id === id);
    if (idx !== -1) videos[idx] = vidObj;
  } else {
    videos.push(vidObj);
  }

  const cloudRes = await window.NewGenDB.saveVideos(videos);

  // Sync to Backend Server API
  fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vidObj)
  }).catch(() => {});

  loadAdminVideos();
  closeModal('modalVideo');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกวิดีโอและซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteVideo(id) {
  if (confirm('ยืนยันที่จะลบวิดีโอนี้หรือไม่?')) {
    let videos = window.NewGenDB.getVideos();
    videos = videos.filter(v => v.id !== id);
    const cloudRes = await window.NewGenDB.saveVideos(videos);

    // Sync DELETE to Backend Server API
    fetch(`/api/videos/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    loadAdminVideos();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบวิดีโอและซิงค์ Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

/* ===================================================================
   5. CONTACT INFO MANAGEMENT
   =================================================================== */
function loadAdminContact() {
  const contact = window.NewGenDB.getContact();

  document.getElementById('editContactLineId').value = contact.lineId || '@390gussc';
  document.getElementById('editContactLineUrl').value = contact.lineUrl || 'https://lin.ee/RXrzi1G';
  document.getElementById('editContactFbName').value = contact.facebookName || 'สถาบันกวดวิชา The NEW GEN';
  document.getElementById('editContactFbUrl').value = contact.facebookUrl || 'https://www.facebook.com/thenewgen2';
  document.getElementById('editContactTiktok').value = contact.tiktok || '@thenewgen89';
  if (document.getElementById('editContactTiktokUrl')) {
    document.getElementById('editContactTiktokUrl').value = contact.tiktokUrl || 'https://www.tiktok.com/@thenewgen89?_r=1&_t=ZS-9AUULZATQT2';
  }
  document.getElementById('editContactIg').value = contact.instagram || 'the.newgen (@the._newgen)';
  if (document.getElementById('editContactIgUrl')) {
    document.getElementById('editContactIgUrl').value = contact.instagramUrl || 'https://www.instagram.com/the_.newgen?psln=MXRhdW56ZnRqajFkaw==';
  }
  if (document.getElementById('editContactYtUrl')) {
    document.getElementById('editContactYtUrl').value = contact.youtubeUrl || 'https://www.youtube.com/@macthenewgen';
  }
  document.getElementById('editContactAddress').value = contact.address || '480/3 หมู่ 13 นวนคร ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120';
  if (document.getElementById('editContactFooterDesc')) {
    document.getElementById('editContactFooterDesc').value = contact.footerDesc || 'สถาบันกวดวิชา The NEW GEN กวดวิชาของเด็ก GENZ เรียนสนุก ครบทุกเนื้อหา จบที่ The NEW GEN พัฒนาทักษะวิชาการและความมั่นใจสู่อนาคตที่สดใส';
  }
  document.getElementById('editContactMapUrl').value = contact.mapEmbedUrl || 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic';
  if (document.getElementById('editContactMapAppUrl')) {
    document.getElementById('editContactMapAppUrl').value = contact.mapAppUrl || 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic';
  }
  if (document.getElementById('editContactMapGraphicUrl')) {
    document.getElementById('editContactMapGraphicUrl').value = contact.mapGraphicImage || 'assets/images/map-graphic.jpg';
  }
  if (document.getElementById('editContactMapGraphicPreview')) {
    document.getElementById('editContactMapGraphicPreview').src = contact.mapGraphicImage || 'assets/images/map-graphic.jpg';
  }

  renderPhonesBuilder(contact.phones || []);
}

function renderPhonesBuilder(phones) {
  const container = document.getElementById('adminPhonesContainer');
  if (!container) return;

  container.innerHTML = phones.map((p, idx) => `
    <div class="phone-builder-row" data-idx="${idx}">
      <input type="text" class="phone-name-input" value="${p.name}" placeholder="ชื่อผู้ติดต่อ เช่น พี่อู๋">
      <input type="text" class="phone-number-input" value="${p.number}" placeholder="เบอร์โทร เช่น 095-4721072">
      <button type="button" class="btn-del-phone-row" onclick="removePhoneRow(this)" title="ลบเบอร์นี้">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function addPhoneRow() {
  const container = document.getElementById('adminPhonesContainer');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'phone-builder-row';
  div.innerHTML = `
    <input type="text" class="phone-name-input" value="ติดต่อสถาบัน" placeholder="ชื่อผู้ติดต่อ">
    <input type="text" class="phone-number-input" value="" placeholder="เช่น 0xx-xxxxxxx">
    <button type="button" class="btn-del-phone-row" onclick="removePhoneRow(this)" title="ลบเบอร์นี้">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;
  container.appendChild(div);
}

function removePhoneRow(btn) {
  btn.closest('.phone-builder-row')?.remove();
}

async function saveContactForm() {
  const phoneRows = document.querySelectorAll('.phone-builder-row');
  const phones = [];
  phoneRows.forEach(row => {
    const name = row.querySelector('.phone-name-input')?.value.trim();
    const number = row.querySelector('.phone-number-input')?.value.trim();
    if (name && number) {
      const cleanNum = number.replace(/[^0-9]/g, '');
      phones.push({ name, number, telLink: `tel:${cleanNum}` });
    }
  });

  const fmt = typeof formatExternalUrl === 'function' ? formatExternalUrl : (u => {
    if (!u) return '';
    const trimmed = String(u).trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|tel:|mailto:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  });

  const fbUrlVal = document.getElementById('editContactFbUrl').value.trim();
  const lineUrlVal = document.getElementById('editContactLineUrl').value.trim();
  const tiktokVal = document.getElementById('editContactTiktok').value.trim();
  const tiktokUrlVal = document.getElementById('editContactTiktokUrl') ? document.getElementById('editContactTiktokUrl').value.trim() : '';
  const igVal = document.getElementById('editContactIg').value.trim();
  const igUrlVal = document.getElementById('editContactIgUrl') ? document.getElementById('editContactIgUrl').value.trim() : '';
  const ytUrlVal = document.getElementById('editContactYtUrl') ? document.getElementById('editContactYtUrl').value.trim() : '';
  const mapAppUrlVal = document.getElementById('editContactMapAppUrl') ? document.getElementById('editContactMapAppUrl').value.trim() : '';
  const footerDescVal = document.getElementById('editContactFooterDesc') ? document.getElementById('editContactFooterDesc').value.trim() : '';

  const contact = {
    phones: phones.length > 0 ? phones : [
      { name: 'พี่อู๋', number: '095-4721072', telLink: 'tel:0954721072' },
      { name: 'พี่นนท์', number: '098-5322791', telLink: 'tel:0985322791' }
    ],
    lineId: document.getElementById('editContactLineId').value.trim() || '@390gussc',
    lineUrl: fmt(lineUrlVal || 'https://lin.ee/RXrzi1G'),
    facebookName: document.getElementById('editContactFbName').value.trim() || 'สถาบันกวดวิชา The NEW GEN',
    facebookUrl: fmt(fbUrlVal || 'https://www.facebook.com/thenewgen2'),
    tiktok: tiktokVal || '@thenewgen89',
    tiktokUrl: fmt(tiktokUrlVal || (tiktokVal ? (tiktokVal.startsWith('http') ? tiktokVal : `https://www.tiktok.com/${tiktokVal.startsWith('@') ? tiktokVal : '@' + tiktokVal}`) : 'https://www.tiktok.com/@thenewgen89')),
    instagram: igVal || 'the.newgen (@the._newgen)',
    instagramUrl: fmt(igUrlVal || (igVal ? (igVal.startsWith('http') ? igVal : `https://www.instagram.com/${igVal.replace(/[@()]/g, '').trim().split(' ')[0]}`) : 'https://www.instagram.com/the_.newgen')),
    youtubeUrl: fmt(ytUrlVal || 'https://www.youtube.com/@macthenewgen'),
    address: document.getElementById('editContactAddress').value.trim() || '480/3 หมู่ 13 นวนคร ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    footerDesc: footerDescVal || 'สถาบันกวดวิชา The NEW GEN กวดวิชาของเด็ก GENZ เรียนสนุก ครบทุกเนื้อหา จบที่ The NEW GEN พัฒนาทักษะวิชาการและความมั่นใจสู่อนาคตที่สดใส',
    mapEmbedUrl: document.getElementById('editContactMapUrl').value.trim(),
    mapAppUrl: fmt(mapAppUrlVal || 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic'),
    mapGraphicImage: document.getElementById('editContactMapGraphicUrl') ? document.getElementById('editContactMapGraphicUrl').value.trim() || 'assets/images/map-graphic.jpg' : 'assets/images/map-graphic.jpg'
  };

  const cloudRes = await window.NewGenDB.saveContact(contact);

  // ซิงค์กับ Server API
  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกข้อมูลติดต่อและซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

/* ===================================================================
   6. WHY CHOOSE US MANAGEMENT (ทำไมต้องเลือก The NEW GEN)
   =================================================================== */
function loadAdminWhyUs() {
  const whyData = window.NewGenDB.getWhyUs();

  const subInput = document.getElementById('whySubtitleInput');
  const titleInput = document.getElementById('whyTitleInput');
  const descInput = document.getElementById('whyDescInput');

  if (subInput) subInput.value = whyData.subtitle || '';
  if (titleInput) titleInput.value = whyData.title || '';
  if (descInput) descInput.value = whyData.desc || '';

  const grid = document.getElementById('adminWhyUsGrid');
  if (!grid) return;

  const features = whyData.features || [];
  grid.innerHTML = features.map(f => `
    <div class="admin-feature-card">
      <div>
        <div class="admin-feature-card-top">
          <div class="admin-feature-icon-badge">
            <i class="${f.icon || 'fa-solid fa-award'}"></i>
          </div>
          <div class="admin-feature-card-body">
            <h4>${f.title}</h4>
            <span style="font-size: 0.76rem; color: var(--text-muted); font-family: monospace;">${f.icon}</span>
          </div>
        </div>
        <div class="admin-feature-card-body">
          <p>${f.desc}</p>
        </div>
      </div>
      <div class="admin-feature-card-actions">
        <button type="button" class="btn-action-edit" onclick="openEditWhyUsModal('${f.id}')" title="แก้ไข">
          <i class="fa-solid fa-pen-to-square"></i> แก้ไข
        </button>
        <button type="button" class="btn-action-del" onclick="deleteWhyUsFeature('${f.id}')" title="ลบ">
          <i class="fa-solid fa-trash"></i> ลบ
        </button>
      </div>
    </div>
  `).join('');
}

async function saveWhyUsHeader() {
  const whyData = window.NewGenDB.getWhyUs();
  const subEl = document.getElementById('whySubtitleInput');
  const titleEl = document.getElementById('whyTitleInput');
  const descEl = document.getElementById('whyDescInput');

  whyData.subtitle = subEl ? (subEl.value.trim() || 'WHY CHOOSE US') : (whyData.subtitle || 'WHY CHOOSE US');
  whyData.title = titleEl ? (titleEl.value.trim() || 'ทำไมต้องเลือก The NEW GEN') : (whyData.title || 'ทำไมต้องเลือก The NEW GEN');
  whyData.desc = descEl ? descEl.value.trim() : (whyData.desc || '');

  const cloudRes = await window.NewGenDB.saveWhyUs(whyData);

  // Sync to server
  fetch('/api/whyus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whyData)
  }).catch(() => {});

  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกข้อความส่วนหัวและซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

function openAddWhyUsModal() {
  document.getElementById('modalWhyUsTitle').textContent = 'เพิ่มจุดเด่นใหม่';
  document.getElementById('whyUsEditId').value = '';
  document.getElementById('wTitle').value = '';
  document.getElementById('wIcon').value = 'fa-solid fa-award';
  updateWhyUsIconPreview('fa-solid fa-award');
  document.getElementById('wDesc').value = '';
  document.getElementById('modalWhyUs').classList.add('active');
}

function openEditWhyUsModal(id) {
  const whyData = window.NewGenDB.getWhyUs();
  const feat = (whyData.features || []).find(f => f.id === id);
  if (!feat) return;

  document.getElementById('modalWhyUsTitle').textContent = 'แก้ไขจุดเด่น';
  document.getElementById('whyUsEditId').value = feat.id;
  document.getElementById('wTitle').value = feat.title;
  document.getElementById('wIcon').value = feat.icon || 'fa-solid fa-award';
  updateWhyUsIconPreview(feat.icon || 'fa-solid fa-award');
  document.getElementById('wDesc').value = feat.desc;
  document.getElementById('modalWhyUs').classList.add('active');
}

function updateWhyUsIconPreview(iconCls) {
  const preview = document.getElementById('wIconPreview');
  if (preview) {
    preview.innerHTML = `<i class="${iconCls}"></i>`;
  }
}

function selectPresetIcon(iconCls) {
  const iconInput = document.getElementById('wIcon');
  if (iconInput) iconInput.value = iconCls;
  updateWhyUsIconPreview(iconCls);
}

async function handleSaveWhyUsFeature(e) {
  e.preventDefault();
  const id = document.getElementById('whyUsEditId').value.trim();
  const whyData = window.NewGenDB.getWhyUs();
  if (!whyData.features) whyData.features = [];

  const featureObj = {
    id: id || `feat-${Date.now()}`,
    icon: document.getElementById('wIcon').value.trim() || 'fa-solid fa-award',
    title: document.getElementById('wTitle').value.trim(),
    desc: document.getElementById('wDesc').value.trim()
  };

  if (id) {
    const idx = whyData.features.findIndex(f => f.id === id);
    if (idx !== -1) whyData.features[idx] = featureObj;
  } else {
    whyData.features.push(featureObj);
  }

  const cloudRes = await window.NewGenDB.saveWhyUs(whyData);

  // Sync to server
  fetch('/api/whyus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whyData)
  }).catch(() => {});

  loadAdminWhyUs();
  closeModal('modalWhyUs');
  if (cloudRes && cloudRes.success) {
    showToast('✅ บันทึกจุดเด่นและซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

async function deleteWhyUsFeature(id) {
  if (confirm('คุณต้องการลบจุดเด่นข้อนี้ใช่หรือไม่?')) {
    const whyData = window.NewGenDB.getWhyUs();
    whyData.features = (whyData.features || []).filter(f => f.id !== id);
    const cloudRes = await window.NewGenDB.saveWhyUs(whyData);

    // Sync to server
    fetch('/api/whyus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(whyData)
    }).catch(() => {});

    loadAdminWhyUs();
    if (cloudRes && cloudRes.success) {
      showToast('✅ ลบจุดเด่นและซิงค์ Cloud เรียบร้อยแล้ว', 'success');
    } else {
      showToast('⚠️ ลบในเครื่องแล้ว (รอซิงค์ Cloud)', 'warning');
    }
  }
}

/* ===================================================================
   7. BACKUP & RESTORE
   =================================================================== */
function exportDataToJson() {
  const allData = {
    courses: window.NewGenDB.getCourses(),
    categories: window.NewGenDB.getCategories(),
    privilege: window.NewGenDB.getPrivilege(),
    home: window.NewGenDB.getHome(),
    about: window.NewGenDB.getAbout(),
    tutors: window.NewGenDB.getTutors(),
    tutorsQuote: window.NewGenDB.getTutorsQuote(),
    reviews: window.NewGenDB.getReviews(),
    achievements: window.NewGenDB.getAchievements(),
    videos: window.NewGenDB.getVideos(),
    contact: window.NewGenDB.getContact(),
    whyus: window.NewGenDB.getWhyUs(),
    enrollments: window.NewGenDB.getEnrollments(),
    enrollmentConfig: (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
      ? window.NewGenDB.getEnrollmentConfig()
      : {},
    exportedAt: new Date().toISOString()
  };

  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.style.display = 'none';
  downloadAnchor.href = url;
  const fileName = `the-new-gen-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => {
    if (downloadAnchor.parentNode) downloadAnchor.parentNode.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  }, 1500);

  showToast(`📥 ดาวน์โหลดไฟล์สำรอง "${fileName}" สำเร็จแล้ว!`, 'success');
}

function importDataFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.courses) await window.NewGenDB.saveCourses(data.courses);
      if (data.categories) await window.NewGenDB.saveCategories(data.categories);
      if (data.privilege) await window.NewGenDB.savePrivilege(data.privilege);
      if (data.home) await window.NewGenDB.saveHome(data.home);
      if (data.about) await window.NewGenDB.saveAbout(data.about);
      if (data.tutors) await window.NewGenDB.saveTutors(data.tutors);
      if (data.tutorsQuote) await window.NewGenDB.saveTutorsQuote(data.tutorsQuote);
      if (data.reviews) await window.NewGenDB.saveReviews(data.reviews);
      if (data.achievements) await window.NewGenDB.saveAchievements(data.achievements);
      if (data.videos) await window.NewGenDB.saveVideos(data.videos);
      if (data.contact) await window.NewGenDB.saveContact(data.contact);
      if (data.whyus) await window.NewGenDB.saveWhyUs(data.whyus);
      if (data.enrollments) await window.NewGenDB.saveEnrollments(data.enrollments);
      if (data.enrollmentConfig) await window.NewGenDB.saveEnrollmentConfig(data.enrollmentConfig);

      initAdminDashboard();
      showToast('✅ นำเข้าข้อมูลและซิงค์ขึ้น Supabase Cloud เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      alert('ไฟล์ JSON ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการอ่านไฟล์');
    }
  };
  reader.readAsText(file);
}

function resetToSystemDefaults() {
  if (confirm('คำเตือน: คุณต้องการล้างการตั้งค่าและย้อนกลับสู่ค่าเริ่มต้นทั้งหมดหรือไม่?')) {
    window.NewGenDB.resetDefaults();
    initAdminDashboard();
    showToast('รีเซ็ตข้อมูลสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  }
}

// ===================================================================
// 10. SECURITY / ADMIN CREDENTIALS MANAGEMENT
// ===================================================================
function loadSecuritySettings() {
  const userEl = document.getElementById('secUsername');
  if (!userEl) return;
  const cred = window.NewGenDB ? window.NewGenDB.getAdminAuth() : { username: 'admin', password: 'NewGen@2026' };
  userEl.value = cred.username || 'admin';
}

function toggleSecPass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const username = (document.getElementById('secUsername').value || '').trim();
  const currentPass = (document.getElementById('secCurrentPassword').value || '').trim();
  const newPass = (document.getElementById('secNewPassword').value || '').trim();
  const confirmPass = (document.getElementById('secConfirmPassword').value || '').trim();
  const submitBtn = document.getElementById('btnSaveAdminPassword');
  const statusEl = document.getElementById('secStatusText');

  if (!username) {
    showToast('⚠️ กรุณาระบุชื่อผู้ใช้งาน (Username)', 'warning');
    return;
  }
  if (!currentPass) {
    showToast('⚠️ กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน', 'warning');
    return;
  }
  if (newPass.length < 4) {
    showToast('⚠️ รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('⚠️ รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
    return;
  }

  // Verify current password against local & Supabase
  let currentCred = window.NewGenDB ? window.NewGenDB.getAdminAuth() : { username: 'admin', password: 'NewGen@2026' };
  try {
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
      const res = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/app_data?key=eq.admin&select=data`, {
        headers: {
          'apikey': window.SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${window.SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data) {
          currentCred = rows[0].data;
          localStorage.setItem('newgen_admin_cred', JSON.stringify(currentCred));
        }
      }
    }
  } catch (err) {
    console.warn('Network auth verify fallback to local credentials:', err);
  }

  if (currentPass !== currentCred.password) {
    showToast('❌ รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'error');
    if (statusEl) {
      statusEl.style.color = '#ef4444';
      statusEl.textContent = '❌ รหัสผ่านปัจจุบันไม่ถูกต้อง';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกขึ้น Supabase Cloud...';
  }

  try {
    const newCred = { username, password: newPass };
    const res = await window.NewGenDB.saveAdminAuth(newCred);
    localStorage.setItem('newgen_admin_user', username);
    sessionStorage.setItem('newgen_admin_user', username);

    // Clear password inputs
    document.getElementById('secCurrentPassword').value = '';
    document.getElementById('secNewPassword').value = '';
    document.getElementById('secConfirmPassword').value = '';

    if (res && res.success === false) {
      showToast(`⚠️ บันทึกในเบราว์เซอร์แล้ว แต่ Supabase แจ้งเตือน: ${res.error || 'บันทึกไม่สำเร็จ'}`, 'warning');
      if (statusEl) {
        statusEl.style.color = '#f59e0b';
        statusEl.textContent = '⚠️ บันทึกในเครื่องแล้ว (Supabase แจ้งเตือน)';
      }
    } else {
      showToast('✅ เปลี่ยนชื่อผู้ใช้และรหัสผ่านเรียบร้อย พร้อมซิงค์ขึ้น Supabase Cloud สำเร็จ!', 'success');
      if (statusEl) {
        statusEl.style.color = '#16a34a';
        statusEl.textContent = '✅ บันทึกรหัสผ่านใหม่และซิงค์ขึ้น Cloud เรียบร้อย';
      }
    }
  } catch (err) {
    showToast('❌ เกิดข้อผิดพลาดในการบันทึกรหัสผ่าน: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกรหัสผ่านใหม่';
    }
  }
}

/* ===================================================================
   11. STUDENT ENROLLMENTS MANAGEMENT (Tab 11)
   =================================================================== */

let _currentEnrollmentFilter = {
  courseId: 'all',
  learningType: 'all',
  keyword: ''
};

function switchEnrollSubtab(tabName) {
  const btnStats = document.getElementById('btnEnrollSubtabStats');
  const btnRoster = document.getElementById('btnEnrollSubtabRoster');
  const btnConfig = document.getElementById('btnEnrollSubtabConfig');
  const subtabStats = document.getElementById('subtabEnrollStats');
  const subtabRoster = document.getElementById('subtabEnrollRoster');
  const subtabConfig = document.getElementById('subtabEnrollConfig');

  if (btnStats) btnStats.classList.toggle('active', tabName === 'stats');
  if (btnRoster) btnRoster.classList.toggle('active', tabName === 'roster');
  if (btnConfig) btnConfig.classList.toggle('active', tabName === 'config');

  if (subtabStats) subtabStats.style.display = tabName === 'stats' ? 'block' : 'none';
  if (subtabRoster) subtabRoster.style.display = tabName === 'roster' ? 'block' : 'none';
  if (subtabConfig) subtabConfig.style.display = tabName === 'config' ? 'block' : 'none';

  if (tabName === 'config') {
    loadAdminEnrollmentConfig();
  }
}

let _adminCustomQuestionsList = [];

const STANDARD_QUESTION_KEYS = [
  'studentName',
  'nickname',
  'grade',
  'school',
  'parentPhone',
  'lineId',
  'studentPhone',
  'shippingAddress',
  'notes'
];

/**
 * โหลดการตั้งค่าข้อความหน้าต่างสมัครเรียน (Enrollment Config) ใส่ลงฟอร์มหลังบ้าน
 */
function loadAdminEnrollmentConfig() {
  const cfg = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
    ? window.NewGenDB.getEnrollmentConfig()
    : {};

  const setVal = (id, val, fallback = '') => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : fallback;
  };

  setVal('cfgModalTitle', cfg.modalTitle, 'แบบฟอร์มสมัครเรียนออนไลน์');
  setVal('cfgModalSubtitle', cfg.modalSubtitle, 'สถาบันกวดวิชา The NEW GEN (Onsite & Online)');
  setVal('cfgOnsiteTitle', cfg.onsiteTitle, 'เรียนสด Onsite ที่สถาบัน');
  setVal('cfgOnsiteDesc', cfg.onsiteDesc, 'ห้องเรียนแอร์กลุ่มเล็ก ติวเตอร์ดูแลใกล้ชิดรายบุคคล');
  setVal('cfgOnlineTitle', cfg.onlineTitle, 'เรียนสด Online (Zoom)');
  setVal('cfgOnlineDesc', cfg.onlineDesc, 'เรียนสดพร้อมถามตอบได้ทันที จัดส่งหนังสือฟรีถึงบ้าน');
  setVal('cfgSubmitBtnText', cfg.submitBtnText, 'ยืนยันการสมัครเรียน (จองที่นั่ง)');
  setVal('cfgSuccessTitle', cfg.successTitle, 'ลงทะเบียนสมัครเรียนสำเร็จเรียบร้อยแล้ว! 🎉');
  setVal('cfgTicketStatusBadge', cfg.ticketStatusBadge, 'รอการยืนยันที่นั่ง');
  setVal('cfgSuccessLead', cfg.successLead, 'ระบบได้บันทึกข้อมูลการสมัครเรียนของน้องเข้าสู่ระบบสถาบัน The NEW GEN เรียบร้อยแล้ว');
  setVal('cfgLineCalloutTitle', cfg.lineCalloutTitle, 'ขั้นตอนสุดท้าย: ทักไปยืนยันการสมัครที่ LINE สถาบัน');
  setVal('cfgLineCalloutBody', cfg.lineCalloutBody, 'กรุณากดปุ่มด้านล่างเพื่อทักไปยืนยันการสมัครและส่งหลักฐานการชำระเงินที่ LINE Official เจ้าหน้าที่จะตรวจสอบและยืนยันที่นั่งให้น้องทันทีครับ');
  setVal('cfgLineBtnText', cfg.lineBtnText, 'คลิกเพื่อทัก LINE ยืนยันการสมัครทันที');
  setVal('cfgLineUrl', cfg.lineUrl, 'https://lin.ee/RXrzi1G');
  setVal('cfgCopyBtnText', cfg.copyBtnText, 'คัดลอกข้อมูลสรุปสำหรับส่งใน LINE');
  setVal('cfgDoneBtnText', cfg.doneBtnText, 'เสร็จสิ้น / ปิดหน้าต่าง');

  // โหลดค่าคำถามมาตรฐาน 9 ข้อ
  const formQuestions = cfg.formQuestions || {};
  const fields = formQuestions.fields || {};
  STANDARD_QUESTION_KEYS.forEach(key => {
    const fieldData = fields[key] || {};
    const labelInput = document.getElementById(`qStd_${key}_label`);
    const phInput = document.getElementById(`qStd_${key}_ph`);
    const reqCheck = document.getElementById(`qStd_${key}_req`);
    const enableCheck = document.getElementById(`qStd_${key}_enable`);

    if (labelInput && fieldData.label !== undefined) labelInput.value = fieldData.label;
    if (phInput && fieldData.placeholder !== undefined) phInput.value = fieldData.placeholder;
    if (reqCheck && fieldData.required !== undefined) reqCheck.checked = !!fieldData.required;
    if (enableCheck && fieldData.enabled !== undefined) enableCheck.checked = fieldData.enabled !== false;
  });

  // โหลดรายการคำถามเพิ่มเติม
  _adminCustomQuestionsList = Array.isArray(formQuestions.customQuestions)
    ? JSON.parse(JSON.stringify(formQuestions.customQuestions))
    : [];

  renderAdminCustomQuestions();
}

/**
 * เรนเดอร์การ์ดรายการคำถามเพิ่มเติมในระบบหลังบ้าน
 */
function renderAdminCustomQuestions() {
  const container = document.getElementById('adminCustomQuestionsContainer');
  if (!container) return;

  if (!_adminCustomQuestionsList || _adminCustomQuestionsList.length === 0) {
    container.innerHTML = `
      <div style="background: #fff; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 22px; text-align: center; color: #64748b;">
        <i class="fa-solid fa-clipboard-question" style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px; display: block;"></i>
        <div style="font-weight: 600; font-size: 0.92rem; color: #475569;">ยังไม่มีข้อคำถามเพิ่มเติม</div>
        <div style="font-size: 0.8rem; margin-top: 4px;">คุณสามารถกดปุ่ม <b>"+ เพิ่มข้อคำถามใหม่"</b> ด้านบน เพื่อเพิ่มคำถาม เช่น สายการเรียนที่สนใจ, เป้าหมายการสอบ, ไซส์เสื้อ</div>
      </div>
    `;
    return;
  }

  container.innerHTML = _adminCustomQuestionsList.map((q, idx) => {
    let typeBadge = '';
    if (q.type === 'textarea') {
      typeBadge = '<span style="background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-align-left"></i> ข้อความยาว</span>';
    } else if (q.type === 'select') {
      const optCount = Array.isArray(q.options) ? q.options.length : 0;
      typeBadge = `<span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-list-ul"></i> Dropdown (${optCount} ตัวเลือก)</span>`;
    } else {
      typeBadge = '<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-font"></i> ข้อความสั้น</span>';
    }

    const reqBadge = q.required
      ? '<span style="color: #dc2626; font-size: 0.78rem; font-weight: 700;"><i class="fa-solid fa-asterisk"></i> บังคับกรอก</span>'
      : '<span style="color: #64748b; font-size: 0.78rem;">ไม่บังคับ</span>';

    const enabledBadge = q.enabled !== false
      ? '<span style="color: #16a34a; font-size: 0.78rem; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> เปิดใช้งาน</span>'
      : '<span style="color: #94a3b8; font-size: 0.78rem;"><i class="fa-solid fa-eye-slash"></i> ซ่อน</span>';

    return `
      <div style="background: #fff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">ข้อ ${idx + 1}: ${escapeHtml(q.label)}</span>
            ${typeBadge}
            ${reqBadge}
            ${enabledBadge}
          </div>
          <div style="font-size: 0.82rem; color: #64748b;">
            <b>คำใบ้ (Placeholder):</b> ${escapeHtml(q.placeholder || '-')}
            ${q.type === 'select' && Array.isArray(q.options) && q.options.length > 0 ? `
              <span style="margin-left: 10px; color: #475569;"><b>ตัวเลือก:</b> ${escapeHtml(q.options.slice(0, 3).join(', '))}${q.options.length > 3 ? '...' : ''}</span>
            ` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn-action-edit" onclick="openEditCustomQuestionModal('${q.id}')" title="แก้ไขข้อคำถาม">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-action-del" onclick="deleteCustomQuestion('${q.id}')" title="ลบข้อคำถาม">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddCustomQuestionModal() {
  document.getElementById('modalCustomQTitle').textContent = 'เพิ่มข้อคำถามใหม่';
  document.getElementById('customQId').value = '';
  document.getElementById('customQLabel').value = '';
  document.getElementById('customQType').value = 'text';
  document.getElementById('customQPlaceholder').value = '';
  document.getElementById('customQOptionsText').value = '';
  document.getElementById('customQRequired').checked = false;
  document.getElementById('customQEnabled').checked = true;

  toggleCustomQOptions('text');
  document.getElementById('modalCustomQuestion').classList.add('active');
}

function openEditCustomQuestionModal(id) {
  const q = _adminCustomQuestionsList.find(x => x.id === id);
  if (!q) return;

  document.getElementById('modalCustomQTitle').textContent = 'แก้ไขข้อคำถาม';
  document.getElementById('customQId').value = q.id;
  document.getElementById('customQLabel').value = q.label || '';
  document.getElementById('customQType').value = q.type || 'text';
  document.getElementById('customQPlaceholder').value = q.placeholder || '';
  document.getElementById('customQOptionsText').value = Array.isArray(q.options) ? q.options.join('\n') : '';
  document.getElementById('customQRequired').checked = !!q.required;
  document.getElementById('customQEnabled').checked = q.enabled !== false;

  toggleCustomQOptions(q.type || 'text');
  document.getElementById('modalCustomQuestion').classList.add('active');
}

function toggleCustomQOptions(type) {
  const wrap = document.getElementById('customQOptionsWrap');
  if (wrap) {
    wrap.style.display = type === 'select' ? 'block' : 'none';
  }
}

async function handleSaveCustomQuestion(e) {
  if (e && e.preventDefault) e.preventDefault();
  const id = document.getElementById('customQId').value.trim();
  const label = document.getElementById('customQLabel').value.trim();
  const type = document.getElementById('customQType').value;
  const placeholder = document.getElementById('customQPlaceholder').value.trim();
  const optionsRaw = document.getElementById('customQOptionsText').value;
  const required = document.getElementById('customQRequired').checked;
  const enabled = document.getElementById('customQEnabled').checked;

  if (!label) {
    alert('กรุณาระบุหัวข้อ / ข้อคำถาม');
    return;
  }

  let options = [];
  if (type === 'select') {
    options = optionsRaw.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    if (options.length === 0) {
      alert('กรุณาระบุตัวเลือกอย่างน้อย 1 รายการ');
      return;
    }
  }

  const item = {
    id: id || `q-${Date.now()}`,
    label,
    type,
    placeholder,
    options,
    required,
    enabled
  };

  if (id) {
    const idx = _adminCustomQuestionsList.findIndex(x => x.id === id);
    if (idx !== -1) {
      _adminCustomQuestionsList[idx] = item;
    } else {
      _adminCustomQuestionsList.push(item);
    }
  } else {
    _adminCustomQuestionsList.push(item);
  }

  closeModal('modalCustomQuestion');
  renderAdminCustomQuestions();
  await saveAdminEnrollmentConfig();
  showToast('✅ บันทึกข้อคำถามและอัปเดตลงสู่ระบบเรียบร้อยแล้ว', 'success');
}

async function deleteCustomQuestion(id) {
  const q = _adminCustomQuestionsList.find(x => x.id === id);
  const label = q ? q.label : 'คำถามนี้';
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อคำถาม "${label}"?`)) {
    return;
  }

  _adminCustomQuestionsList = _adminCustomQuestionsList.filter(x => x.id !== id);
  renderAdminCustomQuestions();
  await saveAdminEnrollmentConfig();
  showToast(`🗑️ ลบข้อคำถาม "${label}" เรียบร้อยแล้ว`, 'success');
}

/**
 * บันทึกการตั้งค่าข้อความหน้าสมัครเรียนสู่ Local, Server API, และ Supabase Cloud
 */
async function saveAdminEnrollmentConfig() {
  const getVal = (id, fallback = '') => {
    const el = document.getElementById(id);
    return (el && el.value.trim() !== '') ? el.value.trim() : fallback;
  };

  // รวมค่าข้อคำถามมาตรฐาน 9 ข้อ
  const fields = {};
  STANDARD_QUESTION_KEYS.forEach(key => {
    const labelInput = document.getElementById(`qStd_${key}_label`);
    const phInput = document.getElementById(`qStd_${key}_ph`);
    const reqCheck = document.getElementById(`qStd_${key}_req`);
    const enableCheck = document.getElementById(`qStd_${key}_enable`);
    fields[key] = {
      label: labelInput ? labelInput.value.trim() : '',
      placeholder: phInput ? phInput.value.trim() : '',
      required: reqCheck ? reqCheck.checked : false,
      enabled: enableCheck ? enableCheck.checked : true
    };
  });

  const newConfig = {
    modalTitle: getVal('cfgModalTitle', 'แบบฟอร์มสมัครเรียนออนไลน์'),
    modalSubtitle: getVal('cfgModalSubtitle', 'สถาบันกวดวิชา The NEW GEN (Onsite & Online)'),
    onsiteTitle: getVal('cfgOnsiteTitle', 'เรียนสด Onsite ที่สถาบัน'),
    onsiteDesc: getVal('cfgOnsiteDesc', 'ห้องเรียนแอร์กลุ่มเล็ก ติวเตอร์ดูแลใกล้ชิดรายบุคคล'),
    onlineTitle: getVal('cfgOnlineTitle', 'เรียนสด Online (Zoom)'),
    onlineDesc: getVal('cfgOnlineDesc', 'เรียนสดพร้อมถามตอบได้ทันที จัดส่งหนังสือฟรีถึงบ้าน'),
    submitBtnText: getVal('cfgSubmitBtnText', 'ยืนยันการสมัครเรียน (จองที่นั่ง)'),
    successTitle: getVal('cfgSuccessTitle', 'ลงทะเบียนสมัครเรียนสำเร็จเรียบร้อยแล้ว! 🎉'),
    ticketStatusBadge: getVal('cfgTicketStatusBadge', 'รอการยืนยันที่นั่ง'),
    successLead: getVal('cfgSuccessLead', 'ระบบได้บันทึกข้อมูลการสมัครเรียนของน้องเข้าสู่ระบบสถาบัน The NEW GEN เรียบร้อยแล้ว'),
    lineCalloutTitle: getVal('cfgLineCalloutTitle', 'ขั้นตอนสุดท้าย: ทักไปยืนยันการสมัครที่ LINE สถาบัน'),
    lineCalloutBody: getVal('cfgLineCalloutBody', 'กรุณากดปุ่มด้านล่างเพื่อทักไปยืนยันการสมัครและส่งหลักฐานการชำระเงินที่ LINE Official...'),
    lineBtnText: getVal('cfgLineBtnText', 'คลิกเพื่อทัก LINE ยืนยันการสมัครทันที'),
    lineUrl: getVal('cfgLineUrl', 'https://lin.ee/RXrzi1G'),
    copyBtnText: getVal('cfgCopyBtnText', 'คัดลอกข้อมูลสรุปสำหรับส่งใน LINE'),
    doneBtnText: getVal('cfgDoneBtnText', 'เสร็จสิ้น / ปิดหน้าต่าง'),
    formQuestions: {
      fields: fields,
      customQuestions: _adminCustomQuestionsList
    }
  };

  try {
    const cloudRes = await window.NewGenDB.saveEnrollmentConfig(newConfig);

    // Sync to backend Server API
    const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
    fetch(baseUrl + '/api/enrollment-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    }).catch(() => {});

    // Live update open modal if present
    if (typeof window.applyEnrollmentConfig === 'function') {
      window.applyEnrollmentConfig();
    }

    if (cloudRes && cloudRes.success) {
      showToast('✅ บันทึกการตั้งค่าข้อความและข้อคำถามหน้าสมัครเรียนเรียบร้อยแล้ว!', 'success');
    } else {
      showToast(`⚠️ บันทึกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอซิงค์ Cloud'})`, 'warning');
    }
  } catch (err) {
    console.error('Error saving enrollment config:', err);
    showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  }
}

function handleSaveEnrollmentConfig(e) {
  if (e) e.preventDefault();
  saveAdminEnrollmentConfig();
}

/**
 * คืนค่าข้อความหน้าสมัครเรียนเป็นค่าเริ่มต้นมาตรฐาน
 */
async function resetAdminEnrollmentConfig() {
  if (!confirm('คุณต้องการคืนค่าข้อความหน้าสมัครเรียนและข้อคำถามเป็นค่าเริ่มต้นมาตรฐานทั้งหมดหรือไม่?')) {
    return;
  }
  const defaultCfg = (typeof DEFAULT_ENROLLMENT_CONFIG !== 'undefined')
    ? JSON.parse(JSON.stringify(DEFAULT_ENROLLMENT_CONFIG))
    : {
      modalTitle: 'แบบฟอร์มสมัครเรียนออนไลน์',
      modalSubtitle: 'สถาบันกวดวิชา The NEW GEN (Onsite & Online)',
      onsiteTitle: 'เรียนสด Onsite ที่สถาบัน',
      onsiteDesc: 'ห้องเรียนแอร์กลุ่มเล็ก ติวเตอร์ดูแลใกล้ชิดรายบุคคล',
      onlineTitle: 'เรียนสด Online (Zoom)',
      onlineDesc: 'เรียนสดพร้อมถามตอบได้ทันที จัดส่งหนังสือฟรีถึงบ้าน',
      submitBtnText: 'ยืนยันการสมัครเรียน (จองที่นั่ง)',
      successTitle: 'ลงทะเบียนสมัครเรียนสำเร็จเรียบร้อยแล้ว! 🎉',
      successLead: 'ระบบได้บันทึกข้อมูลการสมัครเรียนของน้องเข้าสู่ระบบสถาบัน The NEW GEN เรียบร้อยแล้ว',
      ticketStatusBadge: 'รอการยืนยันที่นั่ง',
      lineCalloutTitle: 'ขั้นตอนสุดท้าย: ทักไปยืนยันการสมัครที่ LINE สถาบัน',
      lineCalloutBody: 'กรุณากดปุ่มด้านล่างเพื่อทักไปยืนยันการสมัครและส่งหลักฐานการชำระเงินที่ LINE Official เจ้าหน้าที่จะตรวจสอบและยืนยันที่นั่งให้น้องทันทีครับ',
      lineBtnText: 'คลิกเพื่อทัก LINE ยืนยันการสมัครทันที',
      lineUrl: 'https://lin.ee/RXrzi1G',
      copyBtnText: 'คัดลอกข้อมูลสรุปสำหรับส่งใน LINE',
      doneBtnText: 'เสร็จสิ้น / ปิดหน้าต่าง'
    };

  await window.NewGenDB.saveEnrollmentConfig(defaultCfg);
  loadAdminEnrollmentConfig();

  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(baseUrl + '/api/enrollment-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(defaultCfg)
  }).catch(() => {});

  if (typeof window.applyEnrollmentConfig === 'function') {
    window.applyEnrollmentConfig();
  }

  showToast('🔄 คืนค่าข้อความหน้าสมัครเรียนเป็นค่าเริ่มต้นเรียบร้อยแล้ว', 'info');
}

window.switchEnrollSubtab = switchEnrollSubtab;
window.loadAdminEnrollmentConfig = loadAdminEnrollmentConfig;
window.saveAdminEnrollmentConfig = saveAdminEnrollmentConfig;
window.handleSaveEnrollmentConfig = handleSaveEnrollmentConfig;
window.resetAdminEnrollmentConfig = resetAdminEnrollmentConfig;
window.openAddCustomQuestionModal = openAddCustomQuestionModal;
window.openEditCustomQuestionModal = openEditCustomQuestionModal;
window.toggleCustomQOptions = toggleCustomQOptions;
window.handleSaveCustomQuestion = handleSaveCustomQuestion;
window.deleteCustomQuestion = deleteCustomQuestion;
window.renderAdminCustomQuestions = renderAdminCustomQuestions;

function renderCourseCapacityCards(courses, enrollments) {
  const container = document.getElementById('adminCourseCapacityGrid');
  if (!container) return;

  if (!courses || courses.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 16px;">ยังไม่มีคอร์สเรียนในระบบ</div>';
    return;
  }

  container.innerHTML = courses.map(c => {
    const enrForCourse = enrollments.filter(e => e.courseId === c.id);
    const count = enrForCourse.length;
    const maxVal = Number(c.maxSeats || 12);
    const remaining = Math.max(0, maxVal - count);
    const isFull = (c.isFull === true) || (remaining <= 0);
    const pct = Math.min(100, Math.round((count / maxVal) * 100));

    let statusPillClass = 'safe';
    let statusPillText = `${pct}% เต็มแล้ว`;
    let fillClass = 'safe';

    if (isFull || remaining <= 0) {
      statusPillClass = 'full';
      statusPillText = '🛑 ที่นั่งเต็มแล้ว';
      fillClass = 'full';
    } else if (pct >= 75 || remaining <= 3) {
      statusPillClass = 'warning';
      statusPillText = `🔥 ใกล้เต็ม (${pct}%)`;
      fillClass = 'warning';
    }

    return `
      <div class="course-capacity-card">
        <div class="cap-card-header">
          <div>
            <h4 class="cap-card-title">
              ${escapeHtml(c.title)}
              ${c.isHidden ? '<span class="badge-hidden-pill" style="margin-left: 6px;"><i class="fa-solid fa-eye-slash"></i> ซ่อน</span>' : ''}
            </h4>
            <small style="color: var(--color-blue-brand); font-weight: 700;">${escapeHtml(c.categoryLabel || c.category)}</small>
          </div>
          <span class="cap-percent-pill ${statusPillClass}">${statusPillText}</span>
        </div>

        <div class="cap-metrics-row">
          <div class="cap-seats-big">
            ${count} <span style="font-size: 0.88rem; color: #64748b; font-weight: 600;">/ ${maxVal} คน</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 700; color: ${remaining <= 3 ? '#ea580c' : '#059669'};">
            ${remaining === 0 ? '❌ ไม่มีที่นั่งว่าง' : `⚡ ว่างอีก ${remaining} ที่`}
          </div>
        </div>

        <div class="cap-progress-track">
          <div class="cap-progress-fill ${fillClass}" style="width: ${pct}%;"></div>
        </div>

        <div class="cap-card-footer">
          <span style="font-size: 0.78rem; color: #64748b; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(c.subjects || '')}
          </span>
          <button type="button" class="btn-cap-view-students" onclick="viewCourseEnrollments('${c.id}')" title="คลิกเพื่อดูรายชื่อนักเรียนคอร์สนี้">
            <i class="fa-solid fa-users"></i> ดูรายชื่อ (${count} คน)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminQuickCoursePills(courses, enrollments, selectedCourseId = 'all') {
  const container = document.getElementById('adminQuickCoursePills');
  if (!container) return;

  const totalCount = enrollments.length;
  let html = `
    <button type="button" class="quick-course-pill ${selectedCourseId === 'all' ? 'active' : ''}" onclick="selectQuickCourseFilter('all')">
      📚 ทุกคอร์สเรียนทั้งหมด <span class="count">${totalCount}</span>
    </button>
  `;

  courses.forEach(c => {
    const count = enrollments.filter(e => e.courseId === c.id).length;
    const isActive = selectedCourseId === c.id ? 'active' : '';
    html += `
      <button type="button" class="quick-course-pill ${isActive}" onclick="selectQuickCourseFilter('${c.id}')">
        ${escapeHtml(c.title)} ${c.isHidden ? '<small style="color:#b91c1c; font-weight:700;">(ซ่อน)</small>' : ''} <span class="count">${count}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function selectQuickCourseFilter(courseId) {
  const filterSelect = document.getElementById('enrollFilterCourse');
  if (filterSelect) {
    filterSelect.value = courseId;
  }
  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  renderAdminQuickCoursePills(courses, enrollments, courseId);
  filterAdminEnrollments();
}

function loadAdminEnrollments() {
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];

  // 1. Update navigation badge
  const navBadge = document.getElementById('navEnrollCountBadge');
  if (navBadge) navBadge.textContent = enrollments.length;

  // 2. Update stats cards
  const statTotal = document.getElementById('statTotalStudents');
  const statOnsite = document.getElementById('statOnsiteStudents');
  const statOnline = document.getElementById('statOnlineStudents');
  const statPending = document.getElementById('statPendingStudents');

  if (statTotal) statTotal.textContent = enrollments.length;
  if (statOnsite) statOnsite.textContent = enrollments.filter(e => (e.learningType || '').toLowerCase() === 'onsite').length;
  if (statOnline) statOnline.textContent = enrollments.filter(e => (e.learningType || '').toLowerCase() === 'online').length;
  if (statPending) statPending.textContent = enrollments.filter(e => e.status === 'pending').length;

  // 3. Render Course-by-Course Capacity Cards (Sub-Tab 1)
  renderCourseCapacityCards(courses, enrollments);

  // 4. Populate course filter dropdown
  const filterSelect = document.getElementById('enrollFilterCourse');
  const currentVal = filterSelect ? (filterSelect.value || 'all') : 'all';
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">📚 ทุกคอร์สเรียน (แสดงทั้งหมด)</option>' +
      courses.map(c => {
        const count = enrollments.filter(e => e.courseId === c.id).length;
        return `<option value="${c.id}">${escapeHtml(c.title)} (${count} คน)</option>`;
      }).join('');
    if (courses.some(c => c.id === currentVal) || currentVal === 'all') {
      filterSelect.value = currentVal;
    }
  }

  // 5. Render Quick Course Filter Pills (Sub-Tab 2)
  renderAdminQuickCoursePills(courses, enrollments, currentVal);

  // 6. Populate modal course dropdown
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    modalCourseSelect.innerHTML = courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
  }

  // 7. Render table according to current filters
  filterAdminEnrollments();
}

function filterAdminEnrollments() {
  const filterCourse = document.getElementById('enrollFilterCourse');
  const filterType = document.getElementById('enrollFilterLearningType');
  const searchInput = document.getElementById('enrollSearchKeyword');

  const selectedCourseId = filterCourse ? filterCourse.value : 'all';
  const selectedType = filterType ? filterType.value : 'all';
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

  _currentEnrollmentFilter = {
    courseId: selectedCourseId,
    learningType: selectedType,
    keyword: keyword
  };

  const allEnrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c; });

  const filtered = allEnrollments.filter(item => {
    // 1. Filter course
    if (selectedCourseId !== 'all' && item.courseId !== selectedCourseId) {
      return false;
    }

    // 2. Filter learning type
    if (selectedType !== 'all' && (item.learningType || '').toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }

    // 3. Search keyword
    if (keyword) {
      const courseTitle = courseMap[item.courseId] ? courseMap[item.courseId].title : '';
      const searchable = [
        item.studentName || '',
        item.nickname || '',
        item.grade || '',
        item.school || '',
        item.parentPhone || '',
        item.studentPhone || '',
        item.lineId || '',
        item.shippingAddress || '',
        item.notes || '',
        item.scheduleChoice || '',
        courseTitle
      ].join(' ').toLowerCase();

      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    return true;
  });

  renderEnrollmentsTable(filtered, courseMap);
}

function renderEnrollmentsTable(enrollments, courseMap = null) {
  const tbody = document.getElementById('adminEnrollmentsTableBody');
  const emptyState = document.getElementById('enrollmentsEmptyState');
  if (!tbody) return;

  if (!courseMap) {
    const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
    courseMap = {};
    courses.forEach(c => { courseMap[c.id] = c; });
  }

  if (enrollments.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = enrollments.map((en, idx) => {
    const c = courseMap[en.courseId];
    const courseTitle = c ? c.title : (en.courseTitle || en.courseId || 'ไม่ระบุคอร์ส');
    const isOnline = (en.learningType || '').toLowerCase() === 'online';

    // Status Badge
    let statusBadgeHtml = '';
    if (en.status === 'confirmed') {
      statusBadgeHtml = '<span class="badge-enroll-confirmed"><i class="fa-solid fa-check"></i> ยืนยันแล้ว</span>';
    } else if (en.status === 'pending') {
      statusBadgeHtml = '<span class="badge-enroll-pending"><i class="fa-solid fa-clock"></i> รอตรวจสอบ</span>';
    } else if (en.status === 'materials_sent') {
      statusBadgeHtml = '<span class="badge-enroll-sent"><i class="fa-solid fa-box"></i> ส่งเอกสารแล้ว</span>';
    } else if (en.status === 'cancelled') {
      statusBadgeHtml = '<span class="badge-enroll-cancelled"><i class="fa-solid fa-xmark"></i> ยกเลิก</span>';
    } else {
      statusBadgeHtml = `<span class="badge" style="background:#f1f5f9; color:#475569;">${escapeHtml(en.status || 'ทั่วไป')}</span>`;
    }

    const createdDate = en.createdAt ? new Date(en.createdAt).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : '-';

    return `
      <tr>
        <td style="text-align: center; color: var(--text-muted); font-weight: 700;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: var(--color-navy); font-size: 0.95rem;">
            ${escapeHtml(en.studentName)}
          </div>
          <span style="display: inline-block; background: #f1f5f9; color: #0369a1; padding: 1px 7px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; margin-top: 3px;">
            ชื่อเล่น: ${escapeHtml(en.nickname || '-')}
          </span>
          ${en.notes ? `<div style="font-size: 0.75rem; color: #d97706; margin-top: 2px;"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(en.notes)}</div>` : ''}
          ${Array.isArray(en.customAnswers) && en.customAnswers.length > 0 ? `
            <div style="margin-top: 5px; padding: 4px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 0.75rem; color: #166534; line-height: 1.35;">
              <div style="font-weight: 700; color: #15803d; margin-bottom: 2px;"><i class="fa-solid fa-clipboard-question"></i> ข้อมูลเพิ่มเติม:</div>
              ${en.customAnswers.map(a => `<div>• <b>${escapeHtml(a.label)}:</b> ${escapeHtml(a.value || '-')}</div>`).join('')}
            </div>
          ` : ''}
        </td>
        <td>
          <div style="font-weight: 600; color: #334155; font-size: 0.88rem;">${escapeHtml(en.grade || '-')}</div>
          <small style="color: var(--text-muted);">${escapeHtml(en.school || '-')}</small>
        </td>
        <td>
          <div style="font-weight: 700; color: #1e3a8a; font-size: 0.88rem; max-width: 240px; line-height: 1.3;">
            ${escapeHtml(courseTitle)}
          </div>
          ${en.scheduleChoice ? `
            <div style="font-size: 0.75rem; color: #0284c7; margin-top: 3px; font-weight: 600;">
              <i class="fa-regular fa-calendar-check"></i> ${escapeHtml(en.scheduleChoice.replace(/\|/g, ' • '))}
            </div>
          ` : ''}
        </td>
        <td style="text-align: center;">
          ${isOnline
            ? '<span class="badge-learning-online"><i class="fa-solid fa-laptop-code"></i> Online</span>'
            : '<span class="badge-learning-onsite"><i class="fa-solid fa-chalkboard-user"></i> Onsite</span>'
          }
        </td>
        <td>
          <div style="font-size: 0.86rem; color: var(--color-navy); font-weight: 600;">
            <i class="fa-solid fa-phone" style="color: #16a34a; font-size: 0.78rem;"></i> ผปค: <a href="tel:${escapeHtml(en.parentPhone || '')}" style="color: inherit; text-decoration: underline;">${escapeHtml(en.parentPhone || '-')}</a>
          </div>
          ${en.studentPhone ? `
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
              <i class="fa-solid fa-mobile-screen" style="color: #0284c7; font-size: 0.75rem;"></i> นร: <a href="tel:${escapeHtml(en.studentPhone)}" style="color: inherit;">${escapeHtml(en.studentPhone)}</a>
            </div>
          ` : ''}
        </td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; color: #059669; font-weight: 700; font-size: 0.86rem; background: #ecfdf5; padding: 2px 8px; border-radius: 4px;">
            <i class="fa-brands fa-line" style="font-size: 0.95rem;"></i> ${escapeHtml(en.lineId || '-')}
          </span>
        </td>
        <td style="max-width: 220px;">
          <div style="font-size: 0.82rem; color: #475569; line-height: 1.35; max-height: 60px; overflow-y: auto;" title="${escapeHtml(en.shippingAddress || '')}">
            <i class="fa-solid fa-location-dot" style="color: #ea580c; font-size: 0.75rem;"></i> ${escapeHtml(en.shippingAddress || 'ไม่ระบุ')}
          </div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-action-edit" onclick="openEditEnrollmentModal('${en.id}')" title="แก้ไขข้อมูล">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-action-del" onclick="deleteEnrollment('${en.id}')" title="ลบรายชื่อ">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function resetEnrollmentFilters() {
  selectQuickCourseFilter('all');
  const filterType = document.getElementById('enrollFilterLearningType');
  const searchInput = document.getElementById('enrollSearchKeyword');

  if (filterType) filterType.value = 'all';
  if (searchInput) searchInput.value = '';

  filterAdminEnrollments();
}

function viewCourseEnrollments(courseId) {
  // สลับแท็บไปที่แท็บ 11
  const navBtn = document.getElementById('navTabEnrollments');
  switchAdminTab('enrollments', navBtn);

  // สลับไป sub-tab รายชื่อนักเรียน (roster)
  switchEnrollSubtab('roster');

  // ตั้งค่าตัวกรองเป็นคอร์สที่เลือก
  selectQuickCourseFilter(courseId);

  const filterType = document.getElementById('enrollFilterLearningType');
  if (filterType) filterType.value = 'all';
  const searchInput = document.getElementById('enrollSearchKeyword');
  if (searchInput) searchInput.value = '';

  filterAdminEnrollments();

  // Scroll to work area
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAddEnrollmentModal(preselectedCourseId = '') {
  document.getElementById('modalEnrollmentTitle').innerHTML = '<i class="fa-solid fa-user-plus" style="color: #2563eb;"></i> เพิ่มข้อมูลผู้สมัครเรียน';
  document.getElementById('enrollmentEditId').value = '';

  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    modalCourseSelect.innerHTML = courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
    if (preselectedCourseId && courses.some(c => c.id === preselectedCourseId)) {
      modalCourseSelect.value = preselectedCourseId;
    }
  }

  document.getElementById('enLearningType').value = 'onsite';
  document.getElementById('enStudentName').value = '';
  document.getElementById('enNickname').value = '';
  document.getElementById('enGrade').value = '';
  document.getElementById('enSchool').value = '';
  document.getElementById('enParentPhone').value = '';
  document.getElementById('enStudentPhone').value = '';
  document.getElementById('enLineId').value = '';
  document.getElementById('enStatus').value = 'confirmed';
  document.getElementById('enShippingAddress').value = '';
  document.getElementById('enNotes').value = '';

  document.getElementById('modalEnrollment').classList.add('active');
}

function openEditEnrollmentModal(id) {
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const en = enrollments.find(item => item.id === id);
  if (!en) return;

  document.getElementById('modalEnrollmentTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> แก้ไขข้อมูลผู้สมัครเรียน';
  document.getElementById('enrollmentEditId').value = en.id;

  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    modalCourseSelect.innerHTML = courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
    modalCourseSelect.value = en.courseId || (courses[0] ? courses[0].id : '');
  }

  document.getElementById('enLearningType').value = en.learningType || 'onsite';
  document.getElementById('enStudentName').value = en.studentName || '';
  document.getElementById('enNickname').value = en.nickname || '';
  document.getElementById('enGrade').value = en.grade || '';
  document.getElementById('enSchool').value = en.school || '';
  document.getElementById('enParentPhone').value = en.parentPhone || '';
  document.getElementById('enStudentPhone').value = en.studentPhone || '';
  document.getElementById('enLineId').value = en.lineId || '';
  document.getElementById('enStatus').value = en.status || 'confirmed';
  document.getElementById('enShippingAddress').value = en.shippingAddress || '';
  document.getElementById('enNotes').value = en.notes || '';

  document.getElementById('modalEnrollment').classList.add('active');
}

async function handleSaveEnrollment(e) {
  e.preventDefault();
  const id = document.getElementById('enrollmentEditId').value.trim();
  const courseId = document.getElementById('enCourseId').value;
  const learningType = document.getElementById('enLearningType').value;
  const studentName = document.getElementById('enStudentName').value.trim();
  const nickname = document.getElementById('enNickname').value.trim();
  const grade = document.getElementById('enGrade').value.trim();
  const school = document.getElementById('enSchool').value.trim();
  const parentPhone = document.getElementById('enParentPhone').value.trim();
  const studentPhone = document.getElementById('enStudentPhone').value.trim();
  const lineId = document.getElementById('enLineId').value.trim();
  const status = document.getElementById('enStatus').value;
  const shippingAddress = document.getElementById('enShippingAddress').value.trim();
  const notes = document.getElementById('enNotes').value.trim();

  const item = {
    id: id || `enroll-${Date.now()}`,
    courseId,
    learningType,
    studentName,
    nickname,
    grade,
    school,
    parentPhone,
    studentPhone,
    lineId,
    status,
    shippingAddress,
    notes,
    createdAt: id ? (window.NewGenDB.getEnrollments().find(x => x.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  const res = await window.NewGenDB.saveEnrollment(item);

  // Sync with Server API
  fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).catch(() => {});

  loadAdminEnrollments();
  loadAdminCourses();
  closeModal('modalEnrollment');

  if (res && res.success) {
    showToast('✅ บันทึกข้อมูลผู้สมัครเรียนเรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกข้อมูลในเครื่องแล้ว (${res && res.error ? res.error : ''})`, 'warning');
  }
}

async function deleteEnrollment(id) {
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const en = enrollments.find(item => item.id === id);
  const studentName = en ? en.studentName : 'ผู้สมัครนี้';

  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อของ "${studentName}"?`)) {
    return;
  }

  const res = await window.NewGenDB.deleteEnrollment(id);

  // Sync with Server API
  fetch(`/api/enrollments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(() => {});

  loadAdminEnrollments();
  loadAdminCourses();

  if (res && res.success) {
    showToast(`🗑️ ลบข้อมูลของ "${studentName}" เรียบร้อยแล้ว`, 'success');
  } else {
    showToast('⚠️ ลบข้อมูลในเครื่องแล้ว', 'warning');
  }
}

/**
 * เปิดหน้าต่างเลือกรูปแบบการส่งออกไฟล์ Excel/CSV
 */
function openExportEnrollmentsModal() {
  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  let enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  if ((!enrollments || enrollments.length === 0) && window.enrollmentsData && window.enrollmentsData.length > 0) {
    enrollments = window.enrollmentsData;
  }

  const select = document.getElementById('exportCourseSelect');
  if (select) {
    if (courses.length === 0) {
      select.innerHTML = '<option value="">ไม่มีคอร์สเรียนในระบบ</option>';
    } else {
      select.innerHTML = courses.map(c => {
        const count = enrollments.filter(e => e.courseId === c.id).length;
        return `<option value="${c.id}">${escapeHtml(c.title)} (${count} คน)</option>`;
      }).join('');
    }
  }

  // รีเซ็ตตัวเลือกเป็น "ทุกคอร์สรวมกัน"
  const radioAll = document.getElementById('exportRadioAll');
  if (radioAll) radioAll.checked = true;
  toggleExportCourseSelect(false);

  const modal = document.getElementById('modalExportEnrollments');
  if (modal) modal.classList.add('active');
}

/**
 * สลับการแสดงผล Dropdown เลือกคอร์สเรียนเฉพาะ
 */
function toggleExportCourseSelect(showSpecific) {
  const wrap = document.getElementById('exportCourseSelectWrap');
  const labelAll = document.getElementById('labelExportAll');
  const labelSpecific = document.getElementById('labelExportSpecific');

  if (wrap) wrap.style.display = showSpecific ? 'block' : 'none';

  if (labelAll && labelSpecific) {
    if (showSpecific) {
      labelSpecific.style.borderColor = '#2563eb';
      labelSpecific.style.background = '#f0f9ff';
      labelAll.style.borderColor = '#e2e8f0';
      labelAll.style.background = '#fff';
    } else {
      labelAll.style.borderColor = '#2563eb';
      labelAll.style.background = '#f0f9ff';
      labelSpecific.style.borderColor = '#e2e8f0';
      labelSpecific.style.background = '#fff';
    }
  }
}

/**
 * ดำเนินการส่งออกไฟล์ Excel/CSV ตามตัวเลือกที่เลือกไว้
 */
function confirmExportEnrollments() {
  let allEnrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  if ((!allEnrollments || allEnrollments.length === 0) && window.enrollmentsData && window.enrollmentsData.length > 0) {
    allEnrollments = window.enrollmentsData;
  }

  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const cfg = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
    ? window.NewGenDB.getEnrollmentConfig()
    : {};
  const formQuestions = cfg.formQuestions || {};
  const fields = formQuestions.fields || {};
  const customQuestions = Array.isArray(formQuestions.customQuestions) ? formQuestions.customQuestions : [];

  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c; });

  const isSpecific = document.getElementById('exportRadioSingle') && document.getElementById('exportRadioSingle').checked;
  const selectedCourseId = document.getElementById('exportCourseSelect') ? document.getElementById('exportCourseSelect').value : '';

  let exportList = [];
  let fileTitle = 'ทุกคอร์สเรียน';

  if (isSpecific) {
    if (!selectedCourseId) {
      alert('กรุณาเลือกคอร์สเรียนที่ต้องการส่งออก');
      return;
    }
    exportList = allEnrollments.filter(item => item.courseId === selectedCourseId);
    const selectedCourse = courseMap[selectedCourseId];
    fileTitle = selectedCourse ? selectedCourse.title.replace(/[\/\\?%*:|"<>]/g, '_') : selectedCourseId;
  } else {
    exportList = allEnrollments;
    fileTitle = 'ทุกคอร์สรวมกัน';
  }

  if (exportList.length === 0) {
    alert('ไม่มีข้อมูลรายชื่อนักเรียนสำหรับคอร์สที่เลือก');
    return;
  }

  function csvEscape(field) {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  }

  // สร้าง Header ตามชื่อคำถามที่ตั้งค่าไว้
  const headers = [
    'ลำดับ',
    'วันที่สมัคร',
    fields.studentName?.label || 'ชื่อ - นามสกุล นักเรียน',
    fields.nickname?.label || 'ชื่อเล่น',
    fields.grade?.label || 'ระดับชั้น',
    fields.school?.label || 'โรงเรียน',
    'คอร์สเรียนที่สมัคร',
    'รูปแบบการเรียน',
    fields.parentPhone?.label || 'เบอร์โทรผู้ปกครอง',
    fields.studentPhone?.label || 'เบอร์โทรนักเรียน',
    fields.lineId?.label || 'Line ID',
    fields.shippingAddress?.label || 'ที่อยู่จัดส่งเอกสาร',
    fields.notes?.label || 'หมายเหตุ'
  ];

  // เพิ่มคอลัมน์คำถามเพิ่มเติม (Custom Questions)
  customQuestions.forEach(q => {
    headers.push(q.label || `คำถามเพิ่มเติม (${q.id})`);
  });

  headers.push('สถานะการสมัคร');

  // สร้างแถวข้อมูล (Rows)
  const rows = exportList.map((en, idx) => {
    const c = courseMap[en.courseId];
    const courseTitle = c ? c.title : (en.courseTitle || en.courseId || '-');
    const createdDate = en.createdAt ? new Date(en.createdAt).toLocaleDateString('th-TH') : '-';
    const learningTypeLabel = (en.learningType || '').toLowerCase() === 'online' ? 'Online (เรียนสดออนไลน์)' : 'Onsite (เรียนสดที่สถาบัน)';

    let statusLabel = en.status;
    if (en.status === 'confirmed') statusLabel = 'ยืนยันที่นั่งแล้ว';
    else if (en.status === 'pending') statusLabel = 'รอตรวจสอบ/รอชำระ';
    else if (en.status === 'materials_sent') statusLabel = 'จัดส่งเอกสารแล้ว';
    else if (en.status === 'cancelled') statusLabel = 'ยกเลิก';

    const row = [
      idx + 1,
      csvEscape(createdDate),
      csvEscape(en.studentName),
      csvEscape(en.nickname),
      csvEscape(en.grade),
      csvEscape(en.school),
      csvEscape(courseTitle),
      csvEscape(learningTypeLabel),
      csvEscape(en.parentPhone),
      csvEscape(en.studentPhone),
      csvEscape(en.lineId),
      csvEscape(en.shippingAddress),
      csvEscape(en.notes)
    ];

    // คำตอบของคำถามเพิ่มเติม
    customQuestions.forEach(q => {
      const foundAnswer = Array.isArray(en.customAnswers) ? en.customAnswers.find(a => a.id === q.id) : null;
      row.push(csvEscape(foundAnswer ? foundAnswer.value : ''));
    });

    row.push(csvEscape(statusLabel));
    return row.join(',');
  });

  // เติม UTF-8 BOM (\uFEFF) เพื่อให้ Microsoft Excel และ Sheets แสดงภาษาไทยถูกต้อง 100%
  const csvContent = '\uFEFF' + headers.map(h => csvEscape(h)).join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  const fileName = `รายชื่อนักเรียน_${fileTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);

  closeModal('modalExportEnrollments');
  showToast(`📥 ส่งออกไฟล์ "${fileName}" สำเร็จแล้ว!`, 'success');
}

// Alias for backwards compatibility
function exportEnrollmentsCsv() {
  openExportEnrollmentsModal();
}

window.openExportEnrollmentsModal = openExportEnrollmentsModal;
window.toggleExportCourseSelect = toggleExportCourseSelect;
window.confirmExportEnrollments = confirmExportEnrollments;
window.exportEnrollmentsCsv = exportEnrollmentsCsv;


