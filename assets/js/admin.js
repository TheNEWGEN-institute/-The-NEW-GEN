/**
 * The NEW GEN Tutoring Institute - Admin Dashboard Management Logic
 */

// true หลังตรวจ session แอดมินผ่านแล้ว (การป้องกันข้อมูลจริงอยู่ที่ RLS ของ Supabase หน้านี้แค่กันการแสดงผล)
let _adminAuthed = false;

document.addEventListener('DOMContentLoaded', async () => {
  // ตรวจสอบ session ของ Supabase Auth (ต่ออายุอัตโนมัติ ถ้าหมดอายุให้กลับไปหน้าเข้าสู่ระบบ)
  const token = window.NewGenAuth ? await window.NewGenAuth.getAccessToken() : null;
  if (!token || !window.NewGenAuth.isAdminSession()) {
    window.location.href = 'admin-login.html';
    return;
  }

  _adminAuthed = true;
  await window.NewGenDB.fetchEnrollments();
  initAdminDashboard();
});

document.addEventListener('newgen:synced', () => {
  initAdminDashboard();
});

function initAdminDashboard() {
  if (!_adminAuthed) return;
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
  try { loadAdminBundles(); } catch (e) { console.warn('loadAdminBundles error:', e); }
  try {
    if (document.getElementById('tab-analytics')?.classList.contains('active')) loadAdminAnalytics();
  } catch (e) { console.warn('loadAdminAnalytics error:', e); }
  try { mountEnrollmentConfigToCampaignTab(); } catch (e) {}
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

async function logoutAdmin() {
  if (confirm('คุณต้องการออกจากระบบจัดการหลังบ้านหรือไม่?')) {
    await window.NewGenAuth.signOut();
    window.enrollmentsData = [];
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

    const token = await window.NewGenAuth.getAccessToken();
    const authHeaders = { 'apikey': config.anonKey, 'Authorization': `Bearer ${token || config.anonKey}` };

    // 1. ทดสอบอ่าน (GET)
    const getRes = await fetch(`${config.url}/rest/v1/app_data?select=key&limit=1`, { headers: authHeaders });

    if (!getRes.ok) {
      badge.className = 'supabase-status-pill offline';
      textEl.textContent = `Supabase ออฟไลน์ (${getRes.status})`;
      if (isUserClick) alert(`ไม่สามารถเชื่อมต่อ Supabase ได้ (HTTP ${getRes.status}) กรุณาตรวจสอบ Network หรือ API Key`);
      return;
    }

    // 2. ทดสอบเขียน (POST ping) ด้วยสิทธิ์แอดมินที่ล็อกอินอยู่
    const pingRes = await fetch(`${config.url}/rest/v1/app_data?on_conflict=key`, {
      method: 'POST',
      headers: {
        ...authHeaders,
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
      if (errText.includes('row-level security') || pingRes.status === 401 || pingRes.status === 403) {
        textEl.textContent = 'Supabase: อ่านได้ แต่ไม่มีสิทธิ์บันทึก';
        if (isUserClick) {
          // ห้ามแก้ด้วยการปิด RLS — จะทำให้ทุกคนแก้ไข/อ่านข้อมูลได้
          alert('⚠️ บัญชีนี้ยังไม่มีสิทธิ์บันทึกข้อมูล\n\n1. ลองออกจากระบบแล้วเข้าสู่ระบบใหม่\n2. ถ้ายังไม่ได้ ตรวจว่าบัญชีได้รับสิทธิ์แอดมินแล้ว (ดูไฟล์ SECURITY_SETUP.md ขั้นตอนที่ 3)\n\n❗ ห้ามปิด Row-Level Security (RLS) เด็ดขาด เพราะจะทำให้ใครก็อ่านและแก้ไขข้อมูลนักเรียนได้');
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
    const navBtn = document.querySelector(`.admin-nav-item[onclick*="'${tabKey}'"]`) || document.getElementById(tabKey === 'bundles' ? 'navTabBundles' : (tabKey === 'system' ? 'navTabSystem' : (tabKey === 'enrollments' ? 'navTabEnrollments' : '')));
    if (navBtn) navBtn.classList.add('active');
  }

  // Reload fresh data for whichever tab is opened
  try {
    if (tabKey === 'courses') {
      loadAdminCourses();
      loadPrivilegeBanner();
    } else if (tabKey === 'bundles') {
      loadAdminBundles();
    } else if (tabKey === 'enrollments') {
      loadAdminEnrollments();
      loadAdminEnrollmentConfig();
    } else if (tabKey === 'analytics') {
      loadAdminAnalytics();
    } else if (tabKey === 'home') {
      loadHomeSettings();
      loadAdminWhyUs();
      loadAdminPopupCampaign();
      loadAdminEnrollmentConfig();
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
    loadAdminEnrollmentConfig();
    mountEnrollmentConfigToCampaignTab();
  } else {
    loadHomeSettings();
  }
}

function switchCampaignInnerTab(innerTab) {
  const btnPopup = document.getElementById('btnCampaignInnerPopup');
  const btnForm = document.getElementById('btnCampaignInnerForm');
  const secPopup = document.getElementById('campaignInnerPopupSection');
  const secForm = document.getElementById('campaignInnerFormSection');

  if (btnPopup) btnPopup.classList.toggle('active', innerTab === 'popup');
  if (btnForm) btnForm.classList.toggle('active', innerTab === 'form');

  if (secPopup) secPopup.style.display = innerTab === 'popup' ? 'block' : 'none';
  if (secForm) secForm.style.display = innerTab === 'form' ? 'block' : 'none';

  mountEnrollmentConfigToCampaignTab();
  if (innerTab === 'form') {
    loadAdminEnrollmentConfig();
  } else {
    loadAdminPopupCampaign();
  }
}

function goToHomePopupConfigTab(innerTab = 'form') {
  switchAdminTab('home', document.querySelector('.admin-nav-item[onclick*="\'home\'"]'));
  switchHomeSubtab('popup');
  switchCampaignInnerTab(innerTab);
  mountEnrollmentConfigToCampaignTab();
}

function mountEnrollmentConfigToCampaignTab() {
  const editorCard = document.getElementById('cardEnrollConfigEditor');
  const targetWrap = document.getElementById('campaignInnerFormSection');
  if (editorCard && targetWrap && editorCard.parentElement !== targetWrap) {
    targetWrap.innerHTML = '';
    targetWrap.appendChild(editorCard);
  }
}

window.switchCampaignInnerTab = switchCampaignInnerTab;
window.goToHomePopupConfigTab = goToHomePopupConfigTab;
window.mountEnrollmentConfigToCampaignTab = mountEnrollmentConfigToCampaignTab;

function switchSystemSubtab(subtab) {
  const btnSecurity = document.getElementById('btnSystemSubtabSecurity');
  const btnBackup = document.getElementById('btnSystemSubtabBackup');
  const btnCleanup = document.getElementById('btnSystemSubtabCleanup');
  const subtabSecurity = document.getElementById('subtabSystemSecurity');
  const subtabBackup = document.getElementById('subtabSystemBackup');
  const subtabCleanup = document.getElementById('subtabSystemCleanup');

  if (btnSecurity) btnSecurity.classList.toggle('active', subtab === 'security');
  if (btnBackup) btnBackup.classList.toggle('active', subtab === 'backup');
  if (btnCleanup) btnCleanup.classList.toggle('active', subtab === 'cleanup');

  if (subtabSecurity) subtabSecurity.style.display = subtab === 'security' ? 'block' : 'none';
  if (subtabBackup) subtabBackup.style.display = subtab === 'backup' ? 'block' : 'none';
  if (subtabCleanup) subtabCleanup.style.display = subtab === 'cleanup' ? 'block' : 'none';

  if (subtab === 'security') {
    loadSecuritySettings();
  } else if (subtab === 'cleanup') {
    renderCleanupPanel();
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    if (!document.querySelector('.admin-modal-backdrop.active')) {
      document.body.style.overflow = '';
    }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

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

async function toggleCourseFeatured(id) {
  const courses = window.NewGenDB.getCourses();
  const c = courses.find(item => item.id === id);
  if (!c) return;

  c.isFeatured = !(c.isFeatured !== false);
  const cloudRes = await window.NewGenDB.saveCourses(courses);

  // ซิงค์กับ Server
  const baseUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '');
  fetch(`${baseUrl}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c)
  }).catch(() => {});

  loadAdminCourses();
  if (cloudRes && cloudRes.success) {
    showToast(c.isFeatured ? `⭐ แสดง "${c.title}" ในคอร์สแนะนำหน้าแรกแล้ว (ซิงค์ Cloud เรียบร้อย)` : `⚪ ปิดแสดง "${c.title}" จากคอร์สแนะนำหน้าแรกแล้ว (ซิงค์ Cloud เรียบร้อย)`);
  } else {
    showToast(c.isFeatured ? `⭐ แสดง "${c.title}" ในคอร์สแนะนำหน้าแรกแล้ว` : `⚪ ปิดแสดง "${c.title}" จากคอร์สแนะนำหน้าแรกแล้ว`);
  }
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
  if (document.getElementById('cScheduleNote')) document.getElementById('cScheduleNote').value = '';
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
  if (document.getElementById('cScheduleNote')) document.getElementById('cScheduleNote').value = c.scheduleNote || '';
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
    scheduleNote: document.getElementById('cScheduleNote') ? document.getElementById('cScheduleNote').value.trim() : '',
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
   COURSE BUNDLES MANAGEMENT (1.1 จัดการแพ็คคอร์สเรียนโปรโมชั่น)
   =================================================================== */

function loadAdminBundles() {
  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const countBadge = document.getElementById('navBundlesCountBadge');
  if (countBadge) countBadge.textContent = bundles.length;

  const grid = document.getElementById('adminBundlesGrid');
  const emptyState = document.getElementById('adminBundlesEmptyState');
  if (!grid) return;

  if (bundles.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  renderAdminBundles(bundles);
}

function renderAdminBundles(bundles) {
  const grid = document.getElementById('adminBundlesGrid');
  if (!grid) return;

  const sortedBundles = (bundles || []).slice().sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
  const enrollments = (window.NewGenDB ? window.NewGenDB.getEnrollments() : []);

  grid.innerHTML = sortedBundles.map((b, idx) => {
    const childCourseIds = Array.isArray(b.courseIds) ? b.courseIds : [];
    const childCourses = courses.filter(c => childCourseIds.includes(c.id));
    
    // Total applicants for this bundle
    const bundleApplicants = enrollments.filter(e => e.bundleId === b.id || e.courseId === b.id);
    const applicantCount = bundleApplicants.filter(e => e.isBundle || !e.isFromBundle).length;

    // Visual: 3D Stack vs Custom Image
    const isCustom = b.imageMode === 'custom' && b.customImage;
    const visualHtml = isCustom
      ? `<div style="position: relative; width: 100%; height: 180px; overflow: hidden; border-radius: 8px 8px 0 0; background: #0b1e3f;">
          <img src="${escapeHtml(b.customImage)}" alt="${escapeHtml(b.name)}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="badge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.72rem; backdrop-filter: blur(4px);">🖼️ โปสเตอร์เฉพาะ</span>
        </div>`
      : `<div class="bundle-admin-stack-box" style="position: relative; width: 100%; height: 180px; overflow: hidden; border-radius: 8px 8px 0 0; background: linear-gradient(135deg, #0b1e3f, #1e3a8a); display: flex; align-items: center; justify-content: center; padding: 10px;">
          ${generateBundle3DStackHtml(childCourses, 'admin')}
          <span class="badge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.72rem; backdrop-filter: blur(4px);">✨ 3D Stack อัตโนมัติ</span>
        </div>`;

    const origNum = parseInt(String(b.priceOriginal || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const promoNum = parseInt(String(b.pricePromo || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const savingsVal = Math.max(0, origNum - promoNum);

    return `
      <div class="admin-card-luxury" style="border: 1.5px solid ${b.active !== false ? '#fecdd3' : '#e2e8f0'}; border-radius: var(--radius-lg); overflow: hidden; background: #ffffff; box-shadow: 0 4px 18px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
        ${visualHtml}
        
        <div style="padding: 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="badge" style="background: #ffe4e6; color: #e11d48; font-weight: 800; font-size: 0.76rem; border-radius: 99px; padding: 3px 9px;">
                  ${escapeHtml(b.badge || '🔥 แพ็คเกจโปรโมชั่น')}
                </span>
                <span class="badge" style="background: #0f172a; color: #f8fafc; font-weight: 800; font-size: 0.74rem; border-radius: 6px; padding: 3px 8px;" title="ลำดับการแสดงผลในหน้าเว็บ">
                  <i class="fa-solid fa-arrow-down-1-9" style="color: #f43f5e;"></i> ลำดับที่ ${b.order || (idx + 1)}
                </span>
                <div style="display: inline-flex; gap: 2px;">
                  <button type="button" onclick="moveBundleOrder('${b.id}', -1)" title="เลื่อนขึ้นอันดับก่อนหน้า" style="padding: 2px 7px; font-size: 0.72rem; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; cursor: pointer;">
                    <i class="fa-solid fa-arrow-up"></i>
                  </button>
                  <button type="button" onclick="moveBundleOrder('${b.id}', 1)" title="เลื่อนลงอันดับถัดไป" style="padding: 2px 7px; font-size: 0.72rem; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; cursor: pointer;">
                    <i class="fa-solid fa-arrow-down"></i>
                  </button>
                </div>
              </div>
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 700; margin: 0;">
                <input type="checkbox" ${b.active !== false ? 'checked' : ''} onchange="toggleAdminBundleActive('${b.id}', this.checked)" style="accent-color: #16a34a; width: 15px; height: 15px;">
                <span style="color: ${b.active !== false ? '#16a34a' : '#64748b'};">${b.active !== false ? 'เปิดขาย' : 'ปิดชั่วคราว'}</span>
              </label>
            </div>

            <h3 style="margin: 0 0 10px 0; font-size: 1.05rem; font-weight: 800; color: var(--color-navy); line-height: 1.35;">
              ${escapeHtml(b.name)}
            </h3>

            <!-- Child courses list -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">
                <i class="fa-solid fa-layer-group" style="color: #2563eb;"></i> รวม ${childCourses.length} คอร์สเรียนในแพ็คนี้:
              </div>
              <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: #1e293b; line-height: 1.45;">
                ${childCourses.map(c => `
                  <li><strong>${escapeHtml(c.title)}</strong> <small style="color: #64748b;">(ปกติ ${escapeHtml(c.pricePromo || c.priceOriginal || '')}.-)</small></li>
                `).join('')}
              </ul>
            </div>

            <!-- Price & Savings -->
            <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
              <span style="text-decoration: line-through; color: #94a3b8; font-size: 0.88rem;">ปกติ ${b.priceOriginal || '0'}.-</span>
              <span style="font-size: 1.4rem; font-weight: 800; color: #e11d48; line-height: 1;">${b.pricePromo || '0'}.-</span>
              <small style="color: #64748b; font-size: 0.78rem;">${escapeHtml(b.priceUnit || 'บาท / แพ็คเกจ')}</small>
            </div>

            ${savingsVal > 0 ? `
              <div style="margin-bottom: 12px;">
                <span class="badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 700; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">
                  <i class="fa-solid fa-gift"></i> น้องประหยัดทันที ${savingsVal.toLocaleString()} บาท
                </span>
              </div>
            ` : ''}

            <!-- Display destinations -->
            <div style="display: flex; gap: 8px; font-size: 0.72rem; color: #64748b; margin-bottom: 12px; flex-wrap: wrap;">
              <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px;">
                <i class="fa-solid ${b.showInCourses !== false ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color: ${b.showInCourses !== false ? '#16a34a' : '#94a3b8'};"></i> หน้าคอร์สทั้งหมด
              </span>
              <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px;">
                <i class="fa-solid ${b.showInHome !== false ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color: ${b.showInHome !== false ? '#16a34a' : '#94a3b8'};"></i> หน้าแรก (แนะนำ)
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 6px;">
            <button type="button" class="btn-xs-action" style="background: #eff6ff; color: #1d4ed8; padding: 5px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;" onclick="viewCourseEnrollments('__bundles__')" title="ดูรายชื่อนักเรียนที่สมัครแพ็คนี้">
              <i class="fa-solid fa-users"></i> ผู้สมัคร ${applicantCount} คน
            </button>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-action-edit" onclick="openEditBundleModal('${b.id}')" title="แก้ไขแพ็คเกจ" style="padding: 6px 10px; font-size: 0.82rem;">
                <i class="fa-solid fa-pen-to-square"></i> แก้ไข
              </button>
              <button type="button" class="btn-action-del" onclick="deleteAdminBundle('${b.id}')" title="ลบแพ็คเกจ" style="padding: 6px 10px; font-size: 0.82rem;">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function generateBundle3DStackHtml(coursesList, context = 'admin') {
  if (!coursesList || coursesList.length === 0) {
    return `<div style="color: rgba(255,255,255,0.7); font-size: 0.85rem;"><i class="fa-solid fa-images"></i> เลือก 2-4 คอร์สเพื่อดูพรีวิวรูปแพ็คเกจ</div>`;
  }

  const covers = coursesList.slice(0, 4).map(c => window.resolveMediaUrl ? window.resolveMediaUrl(c.cover || c.poster) : (c.cover || c.poster || 'assets/images/course-poster-primary.jpg'));
  const count = Math.min(covers.length, 4);

  return `
    <div class="bundle-promo-grid-wrap count-${count}">
      ${covers.map((imgUrl, i) => `
        <div class="bundle-grid-item" title="คอร์สที่ ${i+1}">
          <img src="${imgUrl}" alt="Card ${i+1}" loading="lazy">
        </div>
      `).join('')}
    </div>
  `;
}

function openAddBundleModal() {
  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  document.getElementById('modalBundleTitle').innerHTML = '<i class="fa-solid fa-boxes-stacked" style="color: #e11d48;"></i> สร้างแพ็คเกจคอร์สเรียนโปรโมชั่น';
  document.getElementById('editBundleId').value = '';
  document.getElementById('bundleName').value = '';
  document.getElementById('bundleBadge').value = '🔥 แพ็คคู่สุดคุ้ม ประหยัดสุดขีด';
  document.getElementById('bundleOriginalPrice').value = '';
  document.getElementById('bundlePromoPrice').value = '';
  document.getElementById('bundlePriceUnit').value = 'บาท / แพ็คเกจ';
  document.getElementById('bundleCustomImageUrl').value = '';
  document.getElementById('bundleDesc').value = '';
  const orderEl = document.getElementById('bundleOrder');
  if (orderEl) orderEl.value = bundles.length + 1;
  document.getElementById('bundleShowInCourses').checked = true;
  document.getElementById('bundleShowInHome').checked = true;
  document.getElementById('bundleActive').checked = true;

  const stackRadio = document.querySelector('input[name="bundleImageMode"][value="stack"]');
  if (stackRadio) stackRadio.checked = true;
  toggleBundleImageMode('stack');

  populateBundleCoursesChecklist([]);
  populateBundleCategoriesChecklist([]);
  calculateBundleSavings();

  document.getElementById('modalAddBundle').classList.add('active');
}

function openEditBundleModal(bundleId) {
  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const b = bundles.find(item => item.id === bundleId);
  if (!b) return;

  document.getElementById('modalBundleTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #e11d48;"></i> แก้ไขแพ็คเกจคอร์สเรียนโปรโมชั่น';
  document.getElementById('editBundleId').value = b.id;
  document.getElementById('bundleName').value = b.name || '';
  document.getElementById('bundleBadge').value = b.badge || '';
  document.getElementById('bundleOriginalPrice').value = b.priceOriginal || '';
  document.getElementById('bundlePromoPrice').value = b.pricePromo || '';
  document.getElementById('bundlePriceUnit').value = b.priceUnit || 'บาท / แพ็คเกจ';
  document.getElementById('bundleCustomImageUrl').value = b.customImage || '';
  document.getElementById('bundleDesc').value = b.description || '';
  const orderEl = document.getElementById('bundleOrder');
  if (orderEl) orderEl.value = b.order !== undefined ? b.order : 1;
  document.getElementById('bundleShowInCourses').checked = b.showInCourses !== false;
  document.getElementById('bundleShowInHome').checked = b.showInHome !== false;
  document.getElementById('bundleActive').checked = b.active !== false;

  const mode = b.imageMode || 'stack';
  const modeRadio = document.querySelector(`input[name="bundleImageMode"][value="${mode}"]`);
  if (modeRadio) modeRadio.checked = true;
  toggleBundleImageMode(mode);

  populateBundleCoursesChecklist(b.courseIds || []);
  populateBundleCategoriesChecklist(b.categoryIds || []);
  calculateBundleSavings();

  document.getElementById('modalAddBundle').classList.add('active');
}

function populateBundleCategoriesChecklist(selectedCatIds = []) {
  const container = document.getElementById('bundleCategoriesChecklist');
  if (!container) return;

  const defaultCats = [
    { id: 'primary45', name: 'ป.4 - ป.5' },
    { id: 'primary6', name: 'ป.6 (สอบเข้า ม.1)' },
    { id: 'secondary1', name: 'ม.1' },
    { id: 'secondary2', name: 'ม.2' },
    { id: 'secondary3', name: 'ม.3 (สอบเข้า ม.4)' },
    { id: 'highschool4', name: 'ม.4' },
    { id: 'highschool5', name: 'ม.5' }
  ];

  const dbCats = (window.NewGenDB ? window.NewGenDB.getCategories() : []);
  const allCats = (dbCats && dbCats.length >= 4) ? dbCats : defaultCats;

  container.innerHTML = allCats.map(cat => {
    const isChecked = Array.isArray(selectedCatIds) && selectedCatIds.includes(cat.id);
    return `
      <label style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; border: 1.5px solid ${isChecked ? '#2563eb' : '#cbd5e1'}; background: ${isChecked ? '#eff6ff' : '#ffffff'}; font-size: 0.82rem; font-weight: 700; color: ${isChecked ? '#1d4ed8' : '#475569'}; cursor: pointer; transition: all 0.2s;" class="bundle-cat-pill">
        <input type="checkbox" value="${cat.id}" ${isChecked ? 'checked' : ''} onchange="this.closest('.bundle-cat-pill').style.borderColor = this.checked ? '#2563eb' : '#cbd5e1'; this.closest('.bundle-cat-pill').style.background = this.checked ? '#eff6ff' : '#ffffff'; this.closest('.bundle-cat-pill').style.color = this.checked ? '#1d4ed8' : '#475569';" style="accent-color: #2563eb; width: 15px; height: 15px;">
        <span>${escapeHtml(cat.name)}</span>
      </label>
    `;
  }).join('');
}

function autoSelectBundleCategoriesFromCourses() {
  const checkedBoxes = document.querySelectorAll('#bundleCoursesChecklist input[type="checkbox"]:checked');
  const selectedCourseIds = Array.from(checkedBoxes).map(cb => cb.value);
  const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
  const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
  
  const autoCatIds = new Set();
  selectedCourses.forEach(c => {
    if (c.category) autoCatIds.add(c.category);
  });
  
  if (autoCatIds.size > 0) {
    document.querySelectorAll('#bundleCategoriesChecklist input[type="checkbox"]').forEach(catCb => {
      if (autoCatIds.has(catCb.value)) {
        catCb.checked = true;
        const pill = catCb.closest('.bundle-cat-pill');
        if (pill) {
          pill.style.borderColor = '#2563eb';
          pill.style.background = '#eff6ff';
          pill.style.color = '#1d4ed8';
        }
      }
    });
  }
}

function populateBundleCoursesChecklist(selectedIds = []) {
  const container = document.getElementById('bundleCoursesChecklist');
  if (!container) return;

  const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
  container.innerHTML = courses.map(c => {
    const isChecked = selectedIds.includes(c.id);
    const coverUrl = window.resolveMediaUrl ? window.resolveMediaUrl(c.cover || c.poster) : (c.cover || c.poster);
    const priceDisplay = c.pricePromo || c.priceOriginal || '0';
    return `
      <label style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1.5px solid ${isChecked ? '#2563eb' : '#e2e8f0'}; background: ${isChecked ? '#eff6ff' : '#ffffff'}; cursor: pointer; transition: all 0.2s;" class="bundle-check-item">
        <input type="checkbox" value="${c.id}" ${isChecked ? 'checked' : ''} onchange="onBundleCourseCheckboxChange(this)" style="accent-color: #2563eb; width: 17px; height: 17px; flex-shrink: 0;">
        <img src="${coverUrl}" alt="${escapeHtml(c.title)}" style="width: 36px; height: 44px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--color-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(c.title)}
          </div>
          <div style="font-size: 0.72rem; color: #64748b;">
            ราคาปกติ: <strong style="color: #0369a1;">${priceDisplay}.-</strong>
          </div>
        </div>
      </label>
    `;
  }).join('');
}

function onBundleCourseCheckboxChange(chk) {
  const label = chk.closest('label');
  if (label) {
    label.style.borderColor = chk.checked ? '#2563eb' : '#e2e8f0';
    label.style.background = chk.checked ? '#eff6ff' : '#ffffff';
  }
  autoSelectBundleCategoriesFromCourses();
  calculateBundleSavings(true);
}

function calculateBundleSavings(autoSumOriginal = false) {
  const checkedBoxes = document.querySelectorAll('#bundleCoursesChecklist input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
  const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
  const selectedCourses = courses.filter(c => selectedIds.includes(c.id));

  // Count pill
  const pill = document.getElementById('bundleSelectedCountPill');
  if (pill) {
    pill.textContent = `เลือกแล้ว ${selectedIds.length} คอร์ส`;
    pill.style.background = selectedIds.length >= 2 ? '#16a34a' : '#2563eb';
  }

  // Auto sum original price if requested or empty
  const origInput = document.getElementById('bundleOriginalPrice');
  if (autoSumOriginal || !origInput.value.trim()) {
    let sum = 0;
    selectedCourses.forEach(c => {
      const p = parseInt(String(c.pricePromo || c.priceOriginal || '0').replace(/[^0-9]/g, ''), 10) || 0;
      sum += p;
    });
    if (sum > 0) origInput.value = sum.toLocaleString();
  }

  const origNum = parseInt(String(origInput.value || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const promoInput = document.getElementById('bundlePromoPrice');
  const promoNum = parseInt(String(promoInput.value || '0').replace(/[^0-9]/g, ''), 10) || 0;

  const savings = Math.max(0, origNum - promoNum);
  const savingsText = document.getElementById('bundleSavingsText');
  const discountPercent = document.getElementById('bundleDiscountPercent');

  if (origNum > 0 && promoNum > 0 && savings > 0) {
    const pct = Math.round((savings / origNum) * 100);
    if (savingsText) savingsText.textContent = `ประหยัดทันที: ${savings.toLocaleString()} บาท`;
    if (discountPercent) {
      discountPercent.textContent = `ลด ${pct}%`;
      discountPercent.style.display = 'inline-block';
    }
  } else {
    if (savingsText) savingsText.textContent = 'ประหยัดทันที: 0 บาท';
    if (discountPercent) discountPercent.style.display = 'none';
  }

  // Update Preview Area
  const mode = document.querySelector('input[name="bundleImageMode"]:checked')?.value || 'stack';
  const previewArea = document.getElementById('bundlePreviewArea');
  if (previewArea) {
    if (mode === 'custom') {
      const customUrl = document.getElementById('bundleCustomImageUrl')?.value.trim();
      if (customUrl) {
        previewArea.innerHTML = `<img src="${customUrl}" alt="Preview" style="max-height: 120px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">`;
      } else {
        previewArea.innerHTML = `<span style="color: #64748b; font-size: 0.82rem;">กรุณากรอก URL หรืออัปโหลดรูปภาพ</span>`;
      }
    } else {
      previewArea.innerHTML = generateBundle3DStackHtml(selectedCourses, 'modal');
    }
  }
}

function toggleBundleImageMode(mode) {
  const customWrap = document.getElementById('bundleCustomUploadWrap');
  if (customWrap) customWrap.style.display = mode === 'custom' ? 'block' : 'none';
  calculateBundleSavings(false);
}

function handleBundleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawData = e.target.result;
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
      const compressed = canvas.toDataURL('image/jpeg', 0.85);

      const urlInput = document.getElementById('bundleCustomImageUrl');
      if (urlInput) urlInput.value = compressed;
      calculateBundleSavings(false);
      showToast('✅ อัปโหลดและบีบอัดภาพโปสเตอร์สำเร็จ!', 'success');
    };
    img.src = rawData;
  };
  reader.readAsDataURL(file);
}

function updateBundleCustomPreview(url) {
  calculateBundleSavings(false);
}

async function handleSaveBundleForm(e) {
  e.preventDefault();

  const id = document.getElementById('editBundleId').value.trim();
  const name = document.getElementById('bundleName').value.trim();
  const badge = document.getElementById('bundleBadge').value.trim();
  const checkedBoxes = document.querySelectorAll('#bundleCoursesChecklist input[type="checkbox"]:checked');
  const courseIds = Array.from(checkedBoxes).map(cb => cb.value);

  if (courseIds.length < 2) {
    alert('กรุณาเลือกคอร์สเรียนอย่างน้อย 2 คอร์สเพื่อจัดแพ็คเกจโปรโมชั่นครับ');
    return;
  }

  const priceOriginal = document.getElementById('bundleOriginalPrice').value.trim();
  const pricePromo = document.getElementById('bundlePromoPrice').value.trim();
  const priceUnit = document.getElementById('bundlePriceUnit').value.trim();
  const imageMode = document.querySelector('input[name="bundleImageMode"]:checked')?.value || 'stack';
  const customImage = document.getElementById('bundleCustomImageUrl').value.trim();
  const description = document.getElementById('bundleDesc').value.trim();
  const orderEl = document.getElementById('bundleOrder');
  const order = orderEl ? (parseInt(orderEl.value, 10) || 1) : 1;
  const showInCourses = document.getElementById('bundleShowInCourses').checked;
  const showInHome = document.getElementById('bundleShowInHome').checked;
  const active = document.getElementById('bundleActive').checked;

  const catBoxes = document.querySelectorAll('#bundleCategoriesChecklist input[type="checkbox"]:checked');
  const categoryIds = Array.from(catBoxes).map(cb => cb.value);

  const bundleObj = {
    id: id || `bundle-${Date.now()}`,
    name,
    badge,
    courseIds,
    categoryIds,
    priceOriginal,
    pricePromo,
    priceUnit,
    imageMode,
    customImage,
    description,
    order,
    showInCourses,
    showInHome,
    active
  };

  const cloudRes = await window.NewGenDB.saveBundle(bundleObj);

  closeModal('modalAddBundle');
  loadAdminBundles();

  if (cloudRes && cloudRes.success) {
    showToast(`✅ บันทึกแพ็คเกจ "${name}" (ลำดับที่ ${order}) และซิงค์ Cloud เรียบร้อยแล้ว!`, 'success');
  } else {
    showToast(`✅ บันทึกแพ็คเกจ "${name}" (ลำดับที่ ${order}) สำเร็จแล้ว!`, 'success');
  }
}

async function moveBundleOrder(bundleId, delta) {
  const rawList = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const bundles = JSON.parse(JSON.stringify(rawList));
  bundles.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

  // Ensure sequential order 1, 2, 3...
  bundles.forEach((b, i) => { b.order = i + 1; });

  const idx = bundles.findIndex(b => b.id === bundleId);
  if (idx === -1) return;

  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= bundles.length) {
    showToast(delta < 0 ? 'แพ็คเกจนี้อยู่อันดับแรกสุดแล้วครับ' : 'แพ็คเกจนี้อยู่อันดับท้ายสุดแล้วครับ', 'info');
    return;
  }

  // Swap order values
  const temp = bundles[idx].order;
  bundles[idx].order = bundles[targetIdx].order;
  bundles[targetIdx].order = temp;

  // Re-sort
  bundles.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

  await window.NewGenDB.saveBundles(bundles);
  loadAdminBundles();
  showToast(`✅ ปรับลำดับแพ็คเกจ "${bundles.find(b => b.id === bundleId)?.name}" เป็นลำดับที่ ${bundles.findIndex(b => b.id === bundleId) + 1} แล้ว`, 'success');
}

async function deleteAdminBundle(bundleId) {
  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const b = bundles.find(item => item.id === bundleId);
  const bundleName = b ? b.name : 'แพ็คเกจนี้';

  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแพ็คเกจ "${bundleName}"?`)) {
    return;
  }

  await window.NewGenDB.deleteBundle(bundleId);
  loadAdminBundles();
  showToast(`🗑️ ลบแพ็คเกจ "${bundleName}" เรียบร้อยแล้ว`, 'success');
}

async function toggleAdminBundleActive(bundleId, isActive) {
  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const b = bundles.find(item => item.id === bundleId);
  if (!b) return;

  b.active = Boolean(isActive);
  await window.NewGenDB.saveBundles(bundles);
  loadAdminBundles();
  showToast(b.active ? `✅ เปิดขายแพ็คเกจ "${b.name}" แล้ว` : `⚪ ปิดแสดงแพ็คเกจ "${b.name}" ชั่วคราวแล้ว`);
}

window.loadAdminBundles = loadAdminBundles;
window.openAddBundleModal = openAddBundleModal;
window.openEditBundleModal = openEditBundleModal;
window.moveBundleOrder = moveBundleOrder;
window.calculateBundleSavings = calculateBundleSavings;
window.toggleBundleImageMode = toggleBundleImageMode;
window.handleBundleFileUpload = handleBundleFileUpload;
window.updateBundleCustomPreview = updateBundleCustomPreview;
window.handleSaveBundleForm = handleSaveBundleForm;
window.deleteAdminBundle = deleteAdminBundle;
window.toggleAdminBundleActive = toggleAdminBundleActive;
window.onBundleCourseCheckboxChange = onBundleCourseCheckboxChange;

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

let _campaignSubjectsList = [];
let _campaignCustomQuestionsList = [];

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

  const uploadEnabledInput = document.getElementById('popupCampaignUploadEnabled');
  const uploadRequiredInput = document.getElementById('popupCampaignUploadRequired');
  const uploadLabelInput = document.getElementById('popupCampaignUploadLabel');
  const uploadHelpInput = document.getElementById('popupCampaignUploadHelp');

  if (uploadEnabledInput) uploadEnabledInput.checked = popup.studentUploadEnabled !== false;
  if (uploadRequiredInput) uploadRequiredInput.checked = popup.studentUploadRequired === true;
  if (uploadLabelInput) uploadLabelInput.value = popup.studentUploadLabel || 'แนบรูปภาพหลักฐาน เช่น ภาพแชร์โพสต์กิจกรรม / บัตรนักเรียน / ผลการเรียน';
  if (uploadHelpInput) uploadHelpInput.value = popup.studentUploadHelp || 'รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB';

  // Requirement 2: Populate Campaign Subjects
  _campaignSubjectsList = Array.isArray(popup.subjects)
    ? JSON.parse(JSON.stringify(popup.subjects))
    : (window.DEFAULT_POPUP_CAMPAIGN && Array.isArray(window.DEFAULT_POPUP_CAMPAIGN.subjects)
        ? JSON.parse(JSON.stringify(window.DEFAULT_POPUP_CAMPAIGN.subjects))
        : []);
  renderAdminCampaignSubjectsTable();

  // Requirement 2: Populate Campaign Custom Questions
  _campaignCustomQuestionsList = Array.isArray(popup.customQuestions)
    ? JSON.parse(JSON.stringify(popup.customQuestions))
    : [];
  renderAdminCampaignCustomQuestionsList();
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

// ================= CAMPAIGN SUBJECTS CRUD =================
function renderAdminCampaignSubjectsTable() {
  const container = document.getElementById('adminCampaignSubjectsContainer');
  if (!container) return;

  if (_campaignSubjectsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-book-open" style="font-size: 1.5rem; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
        ยังไม่มีรายวิชาในโครงการติวฟรี กดปุ่ม <b>"+ เพิ่มวิชาใหม่"</b> ด้านบนเพื่อเริ่มเพิ่มวิชา
      </div>
    `;
    return;
  }

  container.innerHTML = _campaignSubjectsList.map((sub, idx) => {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #ffffff; border: 1.5px solid ${sub.active !== false ? '#fecdd3' : '#e2e8f0'}; border-radius: 10px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 220px;">
          <span style="width: 28px; height: 28px; border-radius: 50%; background: ${sub.active !== false ? '#be123c' : '#94a3b8'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; flex-shrink: 0;">
            ${idx + 1}
          </span>
          <div>
            <div style="font-weight: 800; color: #0b1e3f; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
              <span>${escapeHtml(sub.name)}</span>
              ${sub.grade ? `<span style="font-size: 0.72rem; background: #e0e7ff; color: #3730a3; padding: 1px 7px; border-radius: 99px; font-weight: 700;">${escapeHtml(sub.grade)}</span>` : ''}
              ${sub.active === false ? `<span style="font-size: 0.7rem; background: #fee2e2; color: #dc2626; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ปิดรับ</span>` : ''}
            </div>
            ${(sub.date || sub.time) ? `
              <div style="font-size: 0.78rem; color: #e11d48; font-weight: 700; margin-top: 2px;">
                <i class="fa-regular fa-clock"></i> ${escapeHtml(sub.date || '')} ${escapeHtml(sub.time || '')}
              </div>
            ` : ''}
            ${sub.detail ? `<div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">${escapeHtml(sub.detail)}</div>` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700; color: #334155; margin: 0; background: #f8fafc; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <input type="checkbox" ${sub.active !== false ? 'checked' : ''} onchange="toggleCampaignSubjectActive(${idx}, this.checked)" style="accent-color: #16a34a; width: 16px; height: 16px;">
            <span>เปิดรับ</span>
          </label>
          <button type="button" class="btn-secondary" onclick="openEditCampaignSubjectModal(${idx})" style="padding: 5px 10px; font-size: 0.8rem;" title="แก้ไขวิชานี้">
            <i class="fa-solid fa-pen-to-square"></i> แก้ไข
          </button>
          <button type="button" class="btn-secondary" onclick="deleteCampaignSubject(${idx})" style="padding: 5px 10px; font-size: 0.8rem; background: #fef2f2; color: #dc2626; border-color: #fecaca;" title="ลบวิชานี้">
            <i class="fa-solid fa-trash-can"></i> ลบ
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddCampaignSubjectModal() {
  document.getElementById('formCampaignSubject').reset();
  document.getElementById('csId').value = '';
  document.getElementById('csActive').checked = true;
  document.getElementById('campaignSubjectModalTitle').innerHTML = '<i class="fa-solid fa-book-open"></i> เพิ่มวิชาใหม่ในโครงการติวฟรี';
  openModal('modalCampaignSubject');
}

function openEditCampaignSubjectModal(idx) {
  const sub = _campaignSubjectsList[idx];
  if (!sub) return;
  document.getElementById('csId').value = idx;
  document.getElementById('csName').value = sub.name || '';
  document.getElementById('csGrade').value = sub.grade || '';
  document.getElementById('csDate').value = sub.date || '';
  document.getElementById('csTime').value = sub.time || '';
  document.getElementById('csDetail').value = sub.detail || '';
  document.getElementById('csActive').checked = sub.active !== false;
  document.getElementById('campaignSubjectModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> แก้ไขวิชาโครงการติวฟรี';
  openModal('modalCampaignSubject');
}

function handleSaveCampaignSubject(e) {
  e.preventDefault();
  const idVal = document.getElementById('csId').value;
  const name = document.getElementById('csName').value.trim();
  const grade = document.getElementById('csGrade').value.trim();
  const date = document.getElementById('csDate').value.trim();
  const time = document.getElementById('csTime').value.trim();
  const detail = document.getElementById('csDetail').value.trim();
  const active = document.getElementById('csActive').checked;

  if (!name) {
    alert('กรุณาระบุชื่อวิชา');
    return;
  }

  const subjectObj = {
    id: idVal !== '' && _campaignSubjectsList[idVal] ? _campaignSubjectsList[idVal].id : `camp-sub-${Date.now()}`,
    name,
    grade,
    date,
    time,
    detail,
    active
  };

  if (idVal !== '' && !isNaN(idVal)) {
    _campaignSubjectsList[parseInt(idVal, 10)] = subjectObj;
  } else {
    _campaignSubjectsList.push(subjectObj);
  }

  renderAdminCampaignSubjectsTable();
  closeModal('modalCampaignSubject');
  showToast('บันทึกวิชาเรียบร้อยแล้ว อย่าลืมกด "บันทึกและซิงค์ Cloud" ด้านล่างครับ');
}

function deleteCampaignSubject(idx) {
  if (confirm(`คุณต้องการลบวิชา "${_campaignSubjectsList[idx]?.name}" ออกจากโครงการติวฟรีหรือไม่?`)) {
    _campaignSubjectsList.splice(idx, 1);
    renderAdminCampaignSubjectsTable();
    showToast('ลบวิชาเรียบร้อยแล้ว อย่าลืมกด "บันทึกและซิงค์ Cloud" ด้านล่างครับ');
  }
}

function toggleCampaignSubjectActive(idx, checked) {
  if (_campaignSubjectsList[idx]) {
    _campaignSubjectsList[idx].active = checked;
    renderAdminCampaignSubjectsTable();
  }
}

// ================= CAMPAIGN CUSTOM QUESTIONS CRUD =================
function renderAdminCampaignCustomQuestionsList() {
  const container = document.getElementById('adminCampaignQuestionsContainer');
  if (!container) return;

  if (_campaignCustomQuestionsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px dashed #bbf7d0;">
        <i class="fa-solid fa-clipboard-question" style="font-size: 1.5rem; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
        ยังไม่มีคำถามพิเศษสำหรับโครงการติวฟรี (กดปุ่ม <b>"+ เพิ่มคำถามติวฟรี"</b> ด้านบนเพื่อเพิ่มคำถาม)
      </div>
    `;
    return;
  }

  container.innerHTML = _campaignCustomQuestionsList.map((q, idx) => {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #ffffff; border: 1.5px solid #bbf7d0; border-radius: 10px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 220px;">
          <span style="width: 28px; height: 28px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; flex-shrink: 0;">
            ${idx + 1}
          </span>
          <div>
            <div style="font-weight: 800; color: #166534; font-size: 0.95rem;">
              ${escapeHtml(q.label)} ${q.required ? '<span style="color: #dc2626;">*</span>' : ''}
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
              ประเภท: <strong>${q.type === 'textarea' ? 'ข้อความยาว' : (q.type === 'select' ? 'ตัวเลือก Dropdown' : 'ข้อความสั้น')}</strong>
              ${q.placeholder ? ` • ตัวอย่าง: "${escapeHtml(q.placeholder)}"` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn-secondary" onclick="openEditCampaignQuestionModal(${idx})" style="padding: 5px 10px; font-size: 0.8rem;">
            <i class="fa-solid fa-pen-to-square"></i> แก้ไข
          </button>
          <button type="button" class="btn-secondary" onclick="deleteCampaignQuestion(${idx})" style="padding: 5px 10px; font-size: 0.8rem; background: #fef2f2; color: #dc2626; border-color: #fecaca;">
            <i class="fa-solid fa-trash-can"></i> ลบ
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddCampaignQuestionModal() {
  document.getElementById('formCampaignQuestion').reset();
  document.getElementById('cqId').value = '';
  document.getElementById('wrapCqOptions').style.display = 'none';
  document.getElementById('campaignQuestionModalTitle').innerHTML = '<i class="fa-solid fa-clipboard-question"></i> เพิ่มคำถามพิเศษโครงการติวฟรี';
  openModal('modalCampaignQuestion');
}

function openEditCampaignQuestionModal(idx) {
  const q = _campaignCustomQuestionsList[idx];
  if (!q) return;
  document.getElementById('cqId').value = idx;
  document.getElementById('cqLabel').value = q.label || '';
  document.getElementById('cqType').value = q.type || 'text';
  document.getElementById('cqPlaceholder').value = q.placeholder || '';
  document.getElementById('cqRequired').checked = q.required === true;

  const wrapOpt = document.getElementById('wrapCqOptions');
  if (q.type === 'select') {
    wrapOpt.style.display = 'block';
    document.getElementById('cqOptions').value = Array.isArray(q.options) ? q.options.join('\n') : '';
  } else {
    wrapOpt.style.display = 'none';
  }

  document.getElementById('campaignQuestionModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> แก้ไขคำถามพิเศษโครงการติวฟรี';
  openModal('modalCampaignQuestion');
}

function toggleCampaignQuestionOptions(type) {
  const wrapOpt = document.getElementById('wrapCqOptions');
  if (wrapOpt) {
    wrapOpt.style.display = type === 'select' ? 'block' : 'none';
  }
}

function handleSaveCampaignQuestion(e) {
  e.preventDefault();
  const idVal = document.getElementById('cqId').value;
  const label = document.getElementById('cqLabel').value.trim();
  const type = document.getElementById('cqType').value;
  const placeholder = document.getElementById('cqPlaceholder').value.trim();
  const required = document.getElementById('cqRequired').checked;

  if (!label) {
    alert('กรุณาระบุข้อความคำถาม');
    return;
  }

  let options = [];
  if (type === 'select') {
    options = document.getElementById('cqOptions').value.split('\n').map(l => l.trim()).filter(Boolean);
  }

  const qObj = {
    id: idVal !== '' && _campaignCustomQuestionsList[idVal] ? _campaignCustomQuestionsList[idVal].id : `camp-q-${Date.now()}`,
    label,
    type,
    placeholder,
    options,
    required
  };

  if (idVal !== '' && !isNaN(idVal)) {
    _campaignCustomQuestionsList[parseInt(idVal, 10)] = qObj;
  } else {
    _campaignCustomQuestionsList.push(qObj);
  }

  renderAdminCampaignCustomQuestionsList();
  closeModal('modalCampaignQuestion');
  showToast('บันทึกคำถามเรียบร้อยแล้ว อย่าลืมกด "บันทึกและซิงค์ Cloud" ด้านล่างครับ');
}

function deleteCampaignQuestion(idx) {
  if (confirm(`คุณต้องการลบคำถาม "${_campaignCustomQuestionsList[idx]?.label}" หรือไม่?`)) {
    _campaignCustomQuestionsList.splice(idx, 1);
    renderAdminCampaignCustomQuestionsList();
    showToast('ลบคำถามเรียบร้อยแล้ว อย่าลืมกด "บันทึกและซิงค์ Cloud" ด้านล่างครับ');
  }
}

window.openAddCampaignSubjectModal = openAddCampaignSubjectModal;
window.openEditCampaignSubjectModal = openEditCampaignSubjectModal;
window.handleSaveCampaignSubject = handleSaveCampaignSubject;
window.deleteCampaignSubject = deleteCampaignSubject;
window.toggleCampaignSubjectActive = toggleCampaignSubjectActive;
window.openAddCampaignQuestionModal = openAddCampaignQuestionModal;
window.openEditCampaignQuestionModal = openEditCampaignQuestionModal;
window.handleSaveCampaignQuestion = handleSaveCampaignQuestion;
window.deleteCampaignQuestion = deleteCampaignQuestion;

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

  const studentUploadEnabled = document.getElementById('popupCampaignUploadEnabled')?.checked !== false;
  const studentUploadRequired = document.getElementById('popupCampaignUploadRequired')?.checked === true;
  const studentUploadLabel = (document.getElementById('popupCampaignUploadLabel')?.value || '').trim() || 'แนบรูปภาพหลักฐาน เช่น ภาพแชร์โพสต์กิจกรรม / บัตรนักเรียน / ผลการเรียน';
  const studentUploadHelp = (document.getElementById('popupCampaignUploadHelp')?.value || '').trim() || 'รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB';

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
    studentUploadEnabled,
    studentUploadRequired,
    studentUploadLabel,
    studentUploadHelp,
    subjects: _campaignSubjectsList,
    customQuestions: _campaignCustomQuestionsList,
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
    const defaultData = (window.DEFAULT_POPUP_CAMPAIGN)
      ? JSON.parse(JSON.stringify(window.DEFAULT_POPUP_CAMPAIGN))
      : {
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
          miniBadgeText: "🎁 โครงการติวฟรี! คลิกดูสิทธิ์",
          studentUploadEnabled: true,
          studentUploadRequired: false,
          studentUploadLabel: "แนบรูปภาพหลักฐาน เช่น ภาพแชร์โพสต์กิจกรรม / บัตรนักเรียน / ผลการเรียน",
          studentUploadHelp: "รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB"
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

  if (reviews.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">
          <i class="fa-solid fa-comments" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          ยังไม่มีรีวิวนักเรียนในระบบ — คลิกปุ่ม "+ เพิ่มรีวิวนักเรียนใหม่" เพื่อเพิ่มข้อมูล
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reviews.map((r, idx) => `
    <tr>
      <td style="text-align: center;">
        <span class="tutor-order-badge" style="background: #e0f2fe; color: #0369a1;">${idx + 1}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: inline-flex; gap: 4px;">
          <button type="button" class="btn-reorder" onclick="moveReviewUp('${r.id}')" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-reorder" onclick="moveReviewDown('${r.id}')" title="เลื่อนลง" ${idx === reviews.length - 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </div>
      </td>
      <td>
        <img src="${r.image || 'assets/images/course-poster-primary.jpg'}" alt="${escapeHtml(r.studentName || 'รีวิว')}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06); cursor: pointer;" onclick="window.open('${r.image || 'assets/images/course-poster-primary.jpg'}', '_blank')">
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

function moveReviewUp(id) {
  const reviews = window.NewGenDB.getReviews();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx <= 0) return;

  const current = reviews[idx];
  const temp = reviews[idx];
  reviews[idx] = reviews[idx - 1];
  reviews[idx - 1] = temp;

  saveAndSyncReviewsOrder(reviews, `เลื่อนรูปรีวิว "${current.studentName || 'ลำดับ ' + (idx + 1)}" ขึ้นสำเร็จแล้ว!`);
}

function moveReviewDown(id) {
  const reviews = window.NewGenDB.getReviews();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx < 0 || idx >= reviews.length - 1) return;

  const current = reviews[idx];
  const temp = reviews[idx];
  reviews[idx] = reviews[idx + 1];
  reviews[idx + 1] = temp;

  saveAndSyncReviewsOrder(reviews, `เลื่อนรูปรีวิว "${current.studentName || 'ลำดับ ' + (idx + 1)}" ลงสำเร็จแล้ว!`);
}

async function saveAndSyncReviewsOrder(reviews, successMsg) {
  const cloudRes = await window.NewGenDB.saveReviews(reviews);

  fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviews)
  }).catch(() => {});

  loadAdminReviews();
  if (cloudRes && cloudRes.success) {
    showToast(successMsg || '✅ บันทึกลำดับรีวิวและซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกลำดับในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
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

  if (achievements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 28px; color: var(--text-muted);">
          <i class="fa-solid fa-award" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          ยังไม่มีโปสเตอร์ความสำเร็จในระบบ — คลิกปุ่ม "+ เพิ่มโปสเตอร์ความสำเร็จ" เพื่อเพิ่มข้อมูล
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = achievements.map((a, idx) => `
    <tr>
      <td style="text-align: center;">
        <span class="tutor-order-badge" style="background: #fef3c7; color: #92400e;">${idx + 1}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: inline-flex; gap: 4px;">
          <button type="button" class="btn-reorder" onclick="moveAchievementUp('${a.id}')" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-reorder" onclick="moveAchievementDown('${a.id}')" title="เลื่อนลง" ${idx === achievements.length - 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </div>
      </td>
      <td>
        <img src="${a.image}" alt="Poster #${idx + 1}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 8px; border: 1.5px solid var(--border-light); cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.06);" onclick="window.open('${a.image}', '_blank')">
      </td>
      <td>
        <div style="font-weight: 700; color: var(--color-navy); word-break: break-all;">${escapeHtml(a.image)}</div>
        <small style="color: var(--text-muted); font-size: 0.8rem;">${a.title ? escapeHtml(a.title) + ' • ' : ''}รูปโปสเตอร์ลำดับที่ ${idx + 1}</small>
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

function moveAchievementUp(id) {
  const achievements = window.NewGenDB.getAchievements();
  const idx = achievements.findIndex(a => a.id === id);
  if (idx <= 0) return;

  const temp = achievements[idx];
  achievements[idx] = achievements[idx - 1];
  achievements[idx - 1] = temp;

  saveAndSyncAchievementsOrder(achievements, `เลื่อนรูปโปสเตอร์ลำดับ ${idx + 1} ขึ้นสำเร็จแล้ว!`);
}

function moveAchievementDown(id) {
  const achievements = window.NewGenDB.getAchievements();
  const idx = achievements.findIndex(a => a.id === id);
  if (idx < 0 || idx >= achievements.length - 1) return;

  const temp = achievements[idx];
  achievements[idx] = achievements[idx + 1];
  achievements[idx + 1] = temp;

  saveAndSyncAchievementsOrder(achievements, `เลื่อนรูปโปสเตอร์ลำดับ ${idx + 1} ลงสำเร็จแล้ว!`);
}

async function saveAndSyncAchievementsOrder(achievements, successMsg) {
  const cloudRes = await window.NewGenDB.saveAchievements(achievements);

  fetch('/api/achievements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(achievements)
  }).catch(() => {});

  loadAdminAchievements();
  if (cloudRes && cloudRes.success) {
    showToast(successMsg || '✅ บันทึกลำดับโปสเตอร์และซิงค์ Cloud สำเร็จแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกลำดับในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
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
  const session = window.NewGenAuth ? window.NewGenAuth.getSession() : null;
  userEl.value = session ? (session.email || '') : '';
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
  const email = (document.getElementById('secUsername').value || '').trim();
  const currentPass = document.getElementById('secCurrentPassword').value || '';
  const newPass = document.getElementById('secNewPassword').value || '';
  const confirmPass = document.getElementById('secConfirmPassword').value || '';
  const submitBtn = document.getElementById('btnSaveAdminPassword');
  const statusEl = document.getElementById('secStatusText');
  const setStatus = (color, text) => {
    if (statusEl) {
      statusEl.style.color = color;
      statusEl.textContent = text;
    }
  };

  if (!currentPass) {
    showToast('⚠️ กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน', 'warning');
    return;
  }
  if (newPass.length < 10) {
    showToast('⚠️ รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร', 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('⚠️ รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
  }

  try {
    // ยืนยันรหัสผ่านปัจจุบันด้วยการเข้าสู่ระบบซ้ำที่ Supabase Auth
    try {
      await window.NewGenAuth.signIn(email, currentPass);
    } catch (err) {
      showToast('❌ รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'error');
      setStatus('#ef4444', '❌ รหัสผ่านปัจจุบันไม่ถูกต้อง');
      return;
    }

    await window.NewGenAuth.updatePassword(newPass);

    document.getElementById('secCurrentPassword').value = '';
    document.getElementById('secNewPassword').value = '';
    document.getElementById('secConfirmPassword').value = '';
    showToast('✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
    setStatus('#16a34a', '✅ บันทึกรหัสผ่านใหม่เรียบร้อย');
  } catch (err) {
    showToast('❌ เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + err.message, 'error');
    setStatus('#ef4444', '❌ เปลี่ยนรหัสผ่านไม่สำเร็จ');
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

/* ==========================================================================
   CAMPAIGN ROSTER FILTER (ดูรายชื่อติวฟรีแยกชั้น & แยกวิชา)
   ========================================================================== */
let _campaignGradeFilter = 'all';
let _campaignSubjectFilter = 'all';

function isCampaignEnrollment(en) {
  return Boolean(en.isCampaign || en.courseId === 'campaign-free' || en.courseId === 'campaign' || (en.courseTitle || '').includes('ติวฟรี'));
}

// แยกชื่อวิชาติวฟรี เช่น "เคมี ม.4" → { subject: "เคมี", grade: "ม.4" }
function parseCampaignSubject(s) {
  const name = (typeof s === 'object' && s ? (s.name || s.title || '') : String(s || '')).trim();
  const gradeRe = /(ม|ป)\.\s*(\d)/;
  const gradeSource = (typeof s === 'object' && s && s.grade ? String(s.grade) : '') || name;
  const m = gradeSource.match(gradeRe);
  const grade = m ? `${m[1]}.${m[2]}` : (typeof s === 'object' && s && s.grade ? String(s.grade).trim() : '');
  const subject = name.replace(/(ม|ป)\.\s*\d/g, '').replace(/[()[\]]/g, ' ').replace(/\s+/g, ' ').trim() || name;
  return { name, subject, grade };
}

function getEnrollmentCampaignSubjects(en) {
  const raw = Array.isArray(en.selectedSubjects) && en.selectedSubjects.length > 0
    ? en.selectedSubjects
    : (typeof en.subjectsChosen === 'string' && en.subjectsChosen.trim() ? en.subjectsChosen.split(',') : []);
  return raw.map(parseCampaignSubject).filter(s => s.name);
}

function campaignSubjectMatches(s, grade, subject) {
  return (grade === 'all' || s.grade === grade) && (subject === 'all' || s.subject === subject);
}

function isCampaignSubjectFilterActive() {
  return _campaignGradeFilter !== 'all' || _campaignSubjectFilter !== 'all';
}

// เรียงชั้น ป.1 → ป.6 → ม.1 → ม.6
function compareGradeLabels(a, b) {
  const rank = g => {
    const m = String(g).match(/(ป|ม)\.?\s*(\d)/);
    return m ? (m[1] === 'ป' ? 0 : 10) + Number(m[2]) : 100;
  };
  return rank(a) - rank(b) || String(a).localeCompare(String(b), 'th');
}

function renderCampaignRosterFilter(allEnrollments, visible) {
  const box = document.getElementById('campaignRosterFilter');
  if (!box) return;
  if (!visible) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  const campEnrollments = allEnrollments.filter(isCampaignEnrollment);
  const subjectsPerEn = campEnrollments.map(getEnrollmentCampaignSubjects);
  const camp = window.NewGenDB && typeof window.NewGenDB.getPopupCampaign === 'function' ? window.NewGenDB.getPopupCampaign() : null;
  const configSubjects = (camp && Array.isArray(camp.subjects) ? camp.subjects : []).map(parseCampaignSubject);
  const allSubjects = configSubjects.concat(...subjectsPerEn);

  const grades = [...new Set(allSubjects.map(s => s.grade).filter(Boolean))].sort(compareGradeLabels);
  const subjects = [...new Set(allSubjects.map(s => s.subject).filter(Boolean))];

  // ตัวเลือกที่เคยเลือกไว้ถูกลบออกจากโครงการแล้ว → กลับเป็นทั้งหมด
  if (_campaignGradeFilter !== 'all' && !grades.includes(_campaignGradeFilter)) _campaignGradeFilter = 'all';
  if (_campaignSubjectFilter !== 'all' && !subjects.includes(_campaignSubjectFilter)) _campaignSubjectFilter = 'all';

  const countWhere = (g, s) => (g === 'all' && s === 'all')
    ? campEnrollments.length
    : subjectsPerEn.filter(list => list.some(x => campaignSubjectMatches(x, g, s))).length;

  const pill = (type, value, label, count) => {
    const active = (type === 'grade' ? _campaignGradeFilter : _campaignSubjectFilter) === value;
    return `
      <button type="button" class="campaign-filter-pill ${active ? 'active' : ''}" data-type="${type}" data-value="${escapeHtml(value)}" onclick="setCampaignRosterFilter(this.dataset.type, this.dataset.value)">
        ${escapeHtml(label)} <span class="count">${count}</span>
      </button>
    `;
  };

  const gradePills = [pill('grade', 'all', 'ทุกชั้น', countWhere('all', _campaignSubjectFilter))]
    .concat(grades.map(g => pill('grade', g, g, countWhere(g, _campaignSubjectFilter)))).join('');
  const subjectPills = [pill('subject', 'all', 'ทุกวิชา', countWhere(_campaignGradeFilter, 'all'))]
    .concat(subjects.map(s => pill('subject', s, s, countWhere(_campaignGradeFilter, s)))).join('');

  const scopeParts = [];
  if (_campaignGradeFilter !== 'all') scopeParts.push(_campaignGradeFilter);
  if (_campaignSubjectFilter !== 'all') scopeParts.push(_campaignSubjectFilter);

  box.style.display = 'block';
  box.innerHTML = `
    <div class="campaign-filter-row">
      <span class="campaign-filter-label"><i class="fa-solid fa-layer-group"></i> แยกชั้น:</span>
      <div class="campaign-filter-pills">${gradePills}</div>
    </div>
    <div class="campaign-filter-row">
      <span class="campaign-filter-label"><i class="fa-solid fa-book-open"></i> แยกวิชา:</span>
      <div class="campaign-filter-pills">${subjectPills}</div>
    </div>
    <div class="campaign-filter-caption">
      ${scopeParts.length
        ? `กำลังแสดงนักเรียนที่สมัครวิชา <b>${escapeHtml(scopeParts.join(' • '))}</b> จำนวน <b>${countWhere(_campaignGradeFilter, _campaignSubjectFilter)}</b> คน
           <button type="button" class="campaign-filter-clear" onclick="clearCampaignRosterFilter()">ล้าง</button>`
        : `นักเรียน 1 คนอาจสมัครหลายวิชา จึงจะแสดงอยู่ในทุกวิชาที่สมัคร`}
    </div>
  `;
}

function setCampaignRosterFilter(type, value) {
  if (type === 'grade') _campaignGradeFilter = value || 'all';
  else _campaignSubjectFilter = value || 'all';
  filterAdminEnrollments();
}

function clearCampaignRosterFilter() {
  _campaignGradeFilter = 'all';
  _campaignSubjectFilter = 'all';
  filterAdminEnrollments();
}

window.setCampaignRosterFilter = setCampaignRosterFilter;
window.clearCampaignRosterFilter = clearCampaignRosterFilter;

/* ==========================================================================
   COURSE ROUND FILTER (ดูรายชื่อคอร์สปกติแยกรอบเวลา + Export Excel แยกชีต)
   ========================================================================== */
let _courseRoundFilter = 'all';
let _courseRoundFilterCourseId = null;

function normalizeRoundText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// หา index ของรอบเรียนที่นักเรียนเลือก (scheduleChoice = "ประเภท | เวลา | วันที่")
// เทียบทั้งข้อความก่อน แล้วค่อยเทียบชื่อรอบ เพราะแอดมินอาจแก้เวลาเป็น "เต็มแล้ว" ภายหลัง
function getEnrollmentRoundKey(en, course) {
  const rounds = course && Array.isArray(course.scheduleList) ? course.scheduleList : [];
  const choice = normalizeRoundText(en.scheduleChoice);
  if (!choice || rounds.length === 0) return 'other';

  let idx = rounds.findIndex(r => normalizeRoundText(`${r.type} | ${r.time} | ${r.dates}`) === choice);
  if (idx === -1) {
    const [pickedType = '', pickedTime = ''] = choice.split('|').map(normalizeRoundText);
    const sameType = rounds.map((r, i) => i).filter(i => normalizeRoundText(rounds[i].type) === pickedType);
    if (sameType.length === 1) idx = sameType[0];
    else if (sameType.length > 1) {
      const byTime = sameType.find(i => normalizeRoundText(rounds[i].time) === pickedTime);
      idx = byTime === undefined ? -1 : byTime;
    }
  }
  return idx === -1 ? 'other' : String(idx);
}

function getRoundLabel(round, idx) {
  const time = round.time && !round.time.includes('เต็มแล้ว') ? ` • ${round.time}` : '';
  return `รอบ ${idx + 1}: ${round.type || 'ไม่ระบุชื่อรอบ'}${time}`;
}

function renderCourseRoundFilter(allEnrollments, course) {
  const box = document.getElementById('courseRoundFilter');
  if (!box) return;
  const rounds = course && Array.isArray(course.scheduleList) ? course.scheduleList : [];
  if (!course || rounds.length === 0) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  const courseEnrollments = allEnrollments.filter(en => en.courseId === course.id);
  const counts = { all: courseEnrollments.length, other: 0 };
  courseEnrollments.forEach(en => {
    const key = getEnrollmentRoundKey(en, course);
    counts[key] = (counts[key] || 0) + 1;
  });
  if (_courseRoundFilter === 'other' && !counts.other) _courseRoundFilter = 'all';
  if (_courseRoundFilter !== 'all' && _courseRoundFilter !== 'other' && !rounds[Number(_courseRoundFilter)]) _courseRoundFilter = 'all';

  const pill = (value, label, count, title = '') => `
    <button type="button" class="campaign-filter-pill ${_courseRoundFilter === value ? 'active' : ''}" data-value="${escapeHtml(value)}" title="${escapeHtml(title)}" onclick="setCourseRoundFilter(this.dataset.value)">
      ${escapeHtml(label)} <span class="count">${count}</span>
    </button>
  `;

  const pills = [pill('all', 'ทุกรอบ', counts.all)]
    .concat(rounds.map((r, i) => pill(String(i), getRoundLabel(r, i), counts[String(i)] || 0, [r.type, r.time, r.dates].filter(Boolean).join(' | '))))
    .concat(counts.other ? [pill('other', 'ไม่ระบุรอบ / รอบที่ถูกลบ', counts.other)] : [])
    .join('');

  const selectedRound = _courseRoundFilter !== 'all' && _courseRoundFilter !== 'other' ? rounds[Number(_courseRoundFilter)] : null;

  box.style.display = 'block';
  box.innerHTML = `
    <div class="campaign-filter-row">
      <span class="campaign-filter-label"><i class="fa-regular fa-clock"></i> แยกรอบเวลา:</span>
      <div class="campaign-filter-pills">${pills}</div>
    </div>
    <div class="campaign-filter-caption">
      <span style="flex: 1; min-width: 200px;">
        ${selectedRound
          ? `<b>${escapeHtml(selectedRound.type || '')}</b> ${escapeHtml(selectedRound.time || '')} ${selectedRound.dates ? `• ${escapeHtml(selectedRound.dates)}` : ''} — ${counts[_courseRoundFilter] || 0} คน`
          : (_courseRoundFilter === 'other'
            ? 'นักเรียนที่ไม่ได้เลือกรอบ (เช่น แอดมินเพิ่มเอง) หรือเลือกรอบที่ถูกลบออกจากคอร์สแล้ว'
            : 'กดเลือกรอบเพื่อดูรายชื่อนักเรียนเฉพาะรอบนั้น')}
      </span>
      <button type="button" class="btn-secondary" onclick="exportCourseRoundsXlsx('${escapeHtml(course.id)}')" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
        <i class="fa-solid fa-file-excel" style="color: #16a34a;"></i> ส่งออก Excel แยกชีตตามรอบ
      </button>
    </div>
  `;
}

function setCourseRoundFilter(value) {
  _courseRoundFilter = value || 'all';
  filterAdminEnrollments();
}

function getEnrollmentStatusLabel(status) {
  if (status === 'confirmed') return 'ยืนยันที่นั่งแล้ว';
  if (status === 'pending') return 'รอตรวจสอบ/รอชำระ';
  if (status === 'materials_sent') return 'จัดส่งเอกสารแล้ว';
  if (status === 'cancelled') return 'ยกเลิก';
  return status || '-';
}

function loadSheetJs() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX not available')));
    s.onerror = () => reject(new Error('load failed'));
    document.head.appendChild(s);
  });
}

// ไฟล์ .xlsx: ชีตแรก "รวมทุกรอบ" ตามด้วย 1 ชีตต่อ 1 รอบเรียน (ผู้ที่ยกเลิกอยู่ท้ายชีต)
async function exportCourseRoundsXlsx(courseId) {
  const course = (window.NewGenDB ? window.NewGenDB.getCourses() : []).find(c => c.id === courseId);
  if (!course) return;
  const rounds = Array.isArray(course.scheduleList) ? course.scheduleList : [];
  const enrollments = (window.NewGenDB ? window.NewGenDB.getEnrollments() : [])
    .filter(en => en.courseId === courseId)
    .sort((a, b) => (a.status === 'cancelled') - (b.status === 'cancelled') || new Date(a.createdAt) - new Date(b.createdAt));

  if (enrollments.length === 0) {
    alert('คอร์สนี้ยังไม่มีรายชื่อนักเรียนสำหรับส่งออก');
    return;
  }

  let XLSX;
  try {
    XLSX = await loadSheetJs();
  } catch (e) {
    alert('โหลดตัวสร้างไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    return;
  }

  const baseHeaders = ['ลำดับ', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'ระดับชั้น', 'โรงเรียน', 'รูปแบบการเรียน', 'เบอร์ผู้ปกครอง', 'เบอร์นักเรียน', 'LINE ID', 'สถานะ', 'วันที่สมัคร', 'สมัครผ่านแพ็คเกจ', 'ที่อยู่จัดส่ง', 'หมายเหตุ'];
  const toRow = (en, i, withRound) => {
    const row = [
      i + 1,
      en.studentName || '',
      en.nickname || '',
      en.grade || '',
      en.school || '',
      (en.learningType || '').toLowerCase() === 'online' ? 'Online' : 'Onsite',
      en.parentPhone || '',
      en.studentPhone || '',
      en.lineId || '',
      getEnrollmentStatusLabel(en.status),
      en.createdAt ? new Date(en.createdAt).toLocaleDateString('th-TH') : '',
      en.isFromBundle ? (en.bundleName || 'แพ็คเกจ') : '-',
      en.shippingAddress || '',
      (en.notes || '').replace(/\[สมัครผ่านแพ็คเกจ:[^\]]*\]\s*/g, '').trim()
    ];
    if (withRound) {
      const key = getEnrollmentRoundKey(en, course);
      row.splice(5, 0, key === 'other' ? 'ไม่ระบุรอบ' : getRoundLabel(rounds[Number(key)], Number(key)));
    }
    return row;
  };

  const usedNames = new Set();
  const sheetName = raw => {
    let name = String(raw).replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sheet';
    let n = 2;
    while (usedNames.has(name)) {
      const suffix = ` (${n++})`;
      name = name.slice(0, 31 - suffix.length) + suffix;
    }
    usedNames.add(name);
    return name;
  };

  const buildSheet = (infoLines, list, withRound) => {
    const headers = withRound ? [...baseHeaders.slice(0, 5), 'รอบเรียน', ...baseHeaders.slice(5)] : baseHeaders;
    const active = list.filter(en => en.status !== 'cancelled').length;
    const aoa = [
      ...infoLines.map(l => [l]),
      [`จำนวนนักเรียน: ${active} คน${list.length > active ? ` (ยกเลิก ${list.length - active} คน แสดงท้ายตาราง)` : ''}`],
      [],
      headers,
      ...list.map((en, i) => toRow(en, i, withRound))
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headers.map(h => ({ wch: h === 'ลำดับ' ? 6 : (['ชื่อ - นามสกุล', 'โรงเรียน', 'รอบเรียน', 'ที่อยู่จัดส่ง', 'หมายเหตุ', 'สมัครผ่านแพ็คเกจ'].includes(h) ? 28 : 14) }));
    return ws;
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet([course.title, 'รายชื่อนักเรียนทุกรอบเรียน'], enrollments, true), sheetName('รวมทุกรอบ'));

  rounds.forEach((r, i) => {
    const list = enrollments.filter(en => getEnrollmentRoundKey(en, course) === String(i));
    const info = [course.title, `รอบเรียน: ${r.type || '-'}`, `เวลา: ${r.time || '-'}   วันที่: ${r.dates || '-'}`];
    XLSX.utils.book_append_sheet(wb, buildSheet(info, list, false), sheetName(`รอบ ${i + 1} ${r.type || ''}`));
  });

  const others = enrollments.filter(en => getEnrollmentRoundKey(en, course) === 'other');
  if (others.length) {
    XLSX.utils.book_append_sheet(wb, buildSheet([course.title, 'นักเรียนที่ไม่ระบุรอบ / เลือกรอบที่ถูกลบ'], others, false), sheetName('ไม่ระบุรอบ'));
  }

  const safeTitle = String(course.title || courseId).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  const fileName = `รายชื่อแยกรอบ_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast(`📥 ส่งออกไฟล์ "${fileName}" สำเร็จแล้ว!`, 'success');
}

window.setCourseRoundFilter = setCourseRoundFilter;
window.exportCourseRoundsXlsx = exportCourseRoundsXlsx;

function renderAdminQuickCoursePills(courses, enrollments, selectedCourseId = 'all') {
  const container = document.getElementById('adminQuickCoursePills');
  if (!container) return;

  const totalCount = enrollments.length;
  const bundleEnrollCount = enrollments.filter(e => e.isBundle || e.isFromBundle || e.bundleId).length;
  const campaignEnrollCount = enrollments.filter(e => e.isCampaign || e.courseId === 'campaign-free' || e.courseId === 'campaign' || (e.courseTitle || '').includes('ติวฟรี')).length;
  const isSpecificCourse = selectedCourseId !== 'all' && selectedCourseId !== '__bundles__' && selectedCourseId !== '__campaign__';

  let html = `
    <button type="button" class="quick-course-pill ${selectedCourseId === 'all' ? 'active' : ''}" onclick="selectQuickCourseFilter('all')">
      📚 ทุกคอร์สเรียนทั้งหมด <span class="count">${totalCount}</span>
    </button>
    <button type="button" class="quick-course-pill ${selectedCourseId === '__campaign__' ? 'active' : ''}" onclick="selectQuickCourseFilter('__campaign__')" style="border-color: #ec4899; color: ${selectedCourseId === '__campaign__' ? '#ffffff' : '#be185d'}; ${selectedCourseId === '__campaign__' ? 'background: linear-gradient(135deg, #ec4899, #f43f5e); box-shadow: 0 2px 6px rgba(244,63,94,0.3);' : ''} font-weight: 700;">
      🎁 โครงการติวฟรี <span class="count" style="background: ${selectedCourseId === '__campaign__' ? 'rgba(255,255,255,0.25)' : '#f43f5e'}; color: #fff;">${campaignEnrollCount}</span>
    </button>
    <button type="button" class="quick-course-pill ${selectedCourseId === '__bundles__' ? 'active' : ''}" onclick="selectQuickCourseFilter('__bundles__')" style="border-color: #f43f5e; color: ${selectedCourseId === '__bundles__' ? '#ffffff' : '#be123c'}; ${selectedCourseId === '__bundles__' ? 'background: #e11d48;' : ''} font-weight: 700;">
      📦 สมัครผ่านแพ็คเกจโปรโมชั่น <span class="count" style="background: ${selectedCourseId === '__bundles__' ? 'rgba(255,255,255,0.25)' : '#e11d48'}; color: #fff;">${bundleEnrollCount}</span>
    </button>
    <div class="quick-course-select-wrap">
      <select id="adminQuickCourseSelect" class="quick-course-select ${isSpecificCourse ? 'active' : ''}" onchange="selectQuickCourseFilter(this.value || 'all')" title="คลิกเพื่อเลือกดูนักเรียนเฉพาะคอร์สเรียน">
        <option value="">🎓 เลือกดูรายคอร์สเรียน (${courses.length} คอร์ส)...</option>
        <option value="__campaign__" ${selectedCourseId === '__campaign__' ? 'selected' : ''}>🎁 โครงการติวฟรี / แคมเปญติวฟรี (${campaignEnrollCount} คน)</option>
        <option value="__bundles__" ${selectedCourseId === '__bundles__' ? 'selected' : ''}>📦 แพ็คเกจโปรโมชั่น (${bundleEnrollCount} คน)</option>
        ${courses.map(c => {
          const count = enrollments.filter(e => e.courseId === c.id).length;
          const isSelected = selectedCourseId === c.id ? 'selected' : '';
          return `<option value="${c.id}" ${isSelected}>${escapeHtml(c.title)} (${count} คน)${c.isHidden ? ' [ซ่อน]' : ''}</option>`;
        }).join('')}
      </select>
      <i class="fa-solid fa-chevron-down quick-course-select-arrow" style="pointer-events: none;"></i>
    </div>
  `;

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
  filterAdminEnrollments(false); // don't re-render pills again
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
  const bundles = window.NewGenDB ? window.NewGenDB.getBundles() : [];
  const campaignEnrollCount = enrollments.filter(e => e.isCampaign || e.courseId === 'campaign-free' || e.courseId === 'campaign' || (e.courseTitle || '').includes('ติวฟรี')).length;
  if (filterSelect) {
    let opts = '<option value="all">📚 ทุกคอร์สเรียน (แสดงทั้งหมด)</option>';
    opts += `<option value="__campaign__">🎁 โครงการติวฟรี / แคมเปญติวฟรี (${campaignEnrollCount} คน)</option>`;
    opts += `<option value="__bundles__">📦 สมัครผ่านแพ็คเกจโปรโมชั่น (${enrollments.filter(e => e.isBundle || e.isFromBundle || e.bundleId).length} คน)</option>`;
    opts += courses.map(c => {
      const count = enrollments.filter(e => e.courseId === c.id).length;
      return `<option value="${c.id}">${escapeHtml(c.title)} (${count} คน)</option>`;
    }).join('');
    filterSelect.innerHTML = opts;
    if (courses.some(c => c.id === currentVal) || currentVal === 'all' || currentVal === '__bundles__' || currentVal === '__campaign__') {
      filterSelect.value = currentVal;
    }
  }

  // 5. Render Quick Course Filter Pills (Sub-Tab 2)
  renderAdminQuickCoursePills(courses, enrollments, currentVal);

  // 6. Populate modal course dropdown
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    let modalOpts = courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
    if (bundles.length > 0) {
      modalOpts += `
        <optgroup label="📦 แพ็คเกจคอร์สเรียนโปรโมชั่น">
          ${bundles.map(b => `<option value="${b.id}">[แพ็คเกจ] ${escapeHtml(b.name)}</option>`).join('')}
        </optgroup>
      `;
    }
    modalCourseSelect.innerHTML = modalOpts;
  }

  // 7. Render table according to current filters
  filterAdminEnrollments();
}

function filterAdminEnrollments(syncPills = true) {
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

  if (syncPills) {
    renderAdminQuickCoursePills(courses, allEnrollments, selectedCourseId);
  }

  const isCampaignView = selectedCourseId === '__campaign__';
  if (!isCampaignView) {
    _campaignGradeFilter = 'all';
    _campaignSubjectFilter = 'all';
  }
  renderCampaignRosterFilter(allEnrollments, isCampaignView);

  // Specific regular course: round (time slot) filter — reset when switching course
  const selectedCourse = courseMap[selectedCourseId] || null;
  if (_courseRoundFilterCourseId !== (selectedCourse ? selectedCourse.id : null)) {
    _courseRoundFilter = 'all';
    _courseRoundFilterCourseId = selectedCourse ? selectedCourse.id : null;
  }
  renderCourseRoundFilter(allEnrollments, selectedCourse);

  // Campaign view: subjects-only column, no shipping address column
  const thCourse = document.getElementById('thEnrollCourse');
  const thAddress = document.getElementById('thEnrollAddress');
  if (thCourse) thCourse.textContent = isCampaignView ? 'วิชาที่สมัคร' : 'คอร์สที่สมัคร & รอบเรียน';
  if (thAddress) thAddress.style.display = isCampaignView ? 'none' : '';

  const filtered = allEnrollments.filter(item => {
    // 1. Filter course
    if (selectedCourseId === '__bundles__') {
      if (!item.isBundle && !item.isFromBundle && !item.bundleId) return false;
    } else if (isCampaignView) {
      if (!isCampaignEnrollment(item)) return false;
      if (isCampaignSubjectFilterActive() &&
          !getEnrollmentCampaignSubjects(item).some(s => campaignSubjectMatches(s, _campaignGradeFilter, _campaignSubjectFilter))) {
        return false;
      }
    } else if (selectedCourseId !== 'all' && item.courseId !== selectedCourseId) {
      return false;
    } else if (selectedCourse && _courseRoundFilter !== 'all' && getEnrollmentRoundKey(item, selectedCourse) !== _courseRoundFilter) {
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
        item.subjectsChosen || '',
        Array.isArray(item.selectedSubjects)
          ? item.selectedSubjects.map(s => typeof s === 'object' && s ? (s.name || s.title || '') : String(s || '')).join(' ')
          : '',
        courseTitle
      ].join(' ').toLowerCase();

      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    return true;
  });

  renderEnrollmentsTable(filtered, courseMap, { campaignView: isCampaignView });
}

// ติวฟรี: แสดงเฉพาะวิชาที่สมัคร (ไม่แสดงชื่อโครงการและวันเวลา) — วิชาที่ตรงกับตัวกรองชั้น/วิชาจะถูกเน้น
function renderCampaignSubjectCell(en, fallbackTitle) {
  const subjects = getEnrollmentCampaignSubjects(en);
  if (subjects.length === 0) {
    return `<span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(fallbackTitle || 'ไม่ระบุวิชา')}</span>`;
  }
  const filterActive = isCampaignSubjectFilterActive();
  return `
    <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 260px;">
      ${subjects.map(s => {
        const dim = filterActive && !campaignSubjectMatches(s, _campaignGradeFilter, _campaignSubjectFilter);
        return `
          <span style="font-size: 0.78rem; background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8; padding: 3px 8px; border-radius: 4px; font-weight: 700; ${dim ? 'opacity: 0.4;' : ''}">
            <i class="fa-solid fa-book-open"></i> ${escapeHtml(s.name)}
          </span>
        `;
      }).join('')}
    </div>
  `;
}

function renderEnrollmentsTable(enrollments, courseMap = null, options = {}) {
  const campaignView = Boolean(options.campaignView);
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
    const isCampaign = isCampaignEnrollment(en);
    const courseTitle = isCampaign
      ? (en.courseTitle || '🎁 โครงการติวฟรี The NEW GEN')
      : (c ? c.title : (en.courseTitle || en.courseId || 'ไม่ระบุคอร์ส'));
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

    // Clean notes: strip out any [สมัครผ่านแพ็คเกจ: ...] tag so the orange note sentence is gone
    const cleanNotes = (en.notes || '').replace(/\[สมัครผ่านแพ็คเกจ:[^\]]*\]\s*/g, '').trim();

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
          ${isCampaign ? `
            <div style="margin-top: 4px;">
              <span class="badge" style="background: linear-gradient(135deg, #ec4899, #f43f5e); color: #ffffff; border: none; font-weight: 800; font-size: 0.74rem; padding: 2px 8px; border-radius: 99px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(244,63,94,0.25);">
                <i class="fa-solid fa-gift"></i> โครงการติวฟรี
              </span>
            </div>
          ` : (en.isFromBundle || en.isBundle || en.bundleName ? `
            <div style="margin-top: 4px;">
              <span class="badge" style="background: #fff1f2; color: #be123c; border: 1.2px solid #fecdd3; font-weight: 800; font-size: 0.74rem; padding: 2px 8px; border-radius: 99px; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-boxes-stacked"></i> ${en.isBundle ? 'สมัครแพ็คเกจ' : 'มาจากแพ็คเกจ'}: ${escapeHtml(en.bundleName || 'โปรโมชั่น')}
              </span>
            </div>
          ` : '')}
          ${cleanNotes ? `<div style="font-size: 0.75rem; color: #d97706; margin-top: 2px;"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(cleanNotes)}</div>` : ''}
          ${Array.isArray(en.customAnswers) && en.customAnswers.length > 0 ? `
            <div style="margin-top: 5px; padding: 4px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 0.75rem; color: #166534; line-height: 1.35;">
              <div style="font-weight: 700; color: #15803d; margin-bottom: 2px;"><i class="fa-solid fa-clipboard-question"></i> ข้อมูลเพิ่มเติม:</div>
              ${en.customAnswers.map(a => `<div>• <b>${escapeHtml(a.label)}:</b> ${escapeHtml(a.value || '-')}</div>`).join('')}
            </div>
          ` : ''}
          ${en.studentImageUrl ? `
            <div style="margin-top: 6px;">
              <button type="button" class="btn-secondary" data-enroll-id="${escapeHtml(en.id)}" onclick="previewEnrollmentAttachment(this.dataset.enrollId)" style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; font-size: 0.78rem; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 6px; cursor: pointer;">
                <i class="fa-solid fa-image"></i> ตรวจสอบรูปที่แนบ
              </button>
            </div>
          ` : ''}
        </td>
        <td>
          <div style="font-weight: 600; color: #334155; font-size: 0.88rem;">${escapeHtml(en.grade || '-')}</div>
          <small style="color: var(--text-muted);">${escapeHtml(en.school || '-')}</small>
        </td>
        <td>
          ${isCampaign ? renderCampaignSubjectCell(en, courseTitle) : `
          <div style="font-weight: 700; color: #1e3a8a; font-size: 0.88rem; max-width: 240px; line-height: 1.3;">
            ${escapeHtml(courseTitle)}
          </div>
          ${(en.subjectsChosen || (Array.isArray(en.selectedSubjects) && en.selectedSubjects.length > 0)) ? `
            <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${(Array.isArray(en.selectedSubjects) && en.selectedSubjects.length > 0
                ? en.selectedSubjects.map(s => typeof s === 'object' && s ? (s.name || s.title || '') : String(s || '').trim())
                : (typeof en.subjectsChosen === 'string' ? en.subjectsChosen.split(',').map(s => s.trim()) : [])
              ).filter(Boolean).map(subjText => `
                <span style="font-size: 0.72rem; background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                  <i class="fa-solid fa-book-open"></i> ${escapeHtml(subjText)}
                </span>
              `).join('')}
            </div>
          ` : ''}
          ${en.scheduleChoice ? `
            <div style="font-size: 0.75rem; color: #0284c7; margin-top: 4px; font-weight: 600;">
              <i class="fa-regular fa-calendar-check"></i> ${escapeHtml(en.scheduleChoice.replace(/\|/g, ' • '))}
            </div>
          ` : ''}
          `}
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
        ${campaignView ? '' : `
        <td style="max-width: 220px;">
          <div style="font-size: 0.82rem; color: #475569; line-height: 1.35; max-height: 60px; overflow-y: auto;" title="${escapeHtml(en.shippingAddress || '')}">
            <i class="fa-solid fa-location-dot" style="color: #ea580c; font-size: 0.75rem;"></i> ${escapeHtml(en.shippingAddress || 'ไม่ระบุ')}
          </div>
        </td>
        `}
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-action-edit" data-enroll-id="${escapeHtml(en.id)}" onclick="openEditEnrollmentModal(this.dataset.enrollId)" title="แก้ไขข้อมูล">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-action-del" data-enroll-id="${escapeHtml(en.id)}" onclick="deleteEnrollment(this.dataset.enrollId)" title="ลบรายชื่อ">
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
  const bundles = window.NewGenDB ? window.NewGenDB.getBundles() : [];
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    let opts = '<option value="campaign-free">🎁 โครงการติวฟรี (แคมเปญพิเศษ)</option>';
    opts += courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
    if (bundles.length > 0) {
      opts += `
        <optgroup label="📦 แพ็คเกจคอร์สเรียนโปรโมชั่น">
          ${bundles.map(b => `<option value="${b.id}">[แพ็คเกจ] ${escapeHtml(b.name)}</option>`).join('')}
        </optgroup>
      `;
    }
    modalCourseSelect.innerHTML = opts;
    if (preselectedCourseId && (courses.some(c => c.id === preselectedCourseId) || bundles.some(b => b.id === preselectedCourseId))) {
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
  document.getElementById('enPaidAmount').value = '';

  const wrapImage = document.getElementById('wrapEnStudentImage');
  if (wrapImage) wrapImage.style.display = 'none';

  updateEnrollmentModalForCourse();
  document.getElementById('modalEnrollment').classList.add('active');
}

// ปรับฟอร์มตามคอร์สที่เลือก: ติวฟรีไม่มีที่อยู่/ยอดชำระ, คอร์สปกติแสดงราคาอัตโนมัติเป็นคำใบ้
function updateEnrollmentModalForCourse() {
  const courseId = document.getElementById('enCourseId')?.value || '';
  const isCampaign = courseId === 'campaign-free' || courseId === 'campaign';
  const wrapAddress = document.getElementById('wrapEnShippingAddress');
  const wrapPaid = document.getElementById('wrapEnPaidAmount');
  const paidInput = document.getElementById('enPaidAmount');
  if (wrapAddress) wrapAddress.style.display = isCampaign ? 'none' : '';
  if (wrapPaid) wrapPaid.style.display = isCampaign ? 'none' : '';
  if (paidInput && !isCampaign) {
    const editId = document.getElementById('enrollmentEditId')?.value || '';
    const existing = editId ? (window.NewGenDB ? window.NewGenDB.getEnrollments() : []).find(x => x.id === editId) : null;
    const autoPrice = existing && existing.courseId === courseId && typeof existing.price === 'number'
      ? existing.price
      : getCurrentListPrice(courseId);
    paidInput.placeholder = autoPrice
      ? `เว้นว่าง = ใช้ราคาคอร์ส ${autoPrice.toLocaleString('th-TH')} บาท`
      : 'เว้นว่าง = ใช้ราคาคอร์สอัตโนมัติ';
  }
}

window.updateEnrollmentModalForCourse = updateEnrollmentModalForCourse;

function openEditEnrollmentModal(id) {
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const en = enrollments.find(item => item.id === id);
  if (!en) return;

  document.getElementById('modalEnrollmentTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> แก้ไขข้อมูลผู้สมัครเรียน';
  document.getElementById('enrollmentEditId').value = en.id;

  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const bundles = window.NewGenDB ? window.NewGenDB.getBundles() : [];
  const modalCourseSelect = document.getElementById('enCourseId');
  if (modalCourseSelect) {
    let opts = courses.map(c => `
      <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.categoryLabel || c.category)})</option>
    `).join('');
    if (bundles.length > 0) {
      opts += `
        <optgroup label="📦 แพ็คเกจคอร์สเรียนโปรโมชั่น">
          ${bundles.map(b => `<option value="${b.id}">[แพ็คเกจ] ${escapeHtml(b.name)}</option>`).join('')}
        </optgroup>
      `;
    }
    modalCourseSelect.innerHTML = '<option value="campaign-free">🎁 โครงการติวฟรี (แคมเปญพิเศษ)</option>' + opts;
    if (en.isCampaign || en.courseId === 'campaign-free' || en.courseId === 'campaign') {
      modalCourseSelect.value = 'campaign-free';
    } else {
      modalCourseSelect.value = en.courseId || (courses[0] ? courses[0].id : '');
    }
  }

  // Populate campaign info container
  const wrapCampaign = document.getElementById('wrapEnCampaignInfo');
  const subjectsListEl = document.getElementById('enCampaignSubjectsList');
  const answersListEl = document.getElementById('enCampaignAnswersList');
  if (wrapCampaign) {
    if (en.isCampaign || en.courseId === 'campaign-free' || (en.selectedSubjects && en.selectedSubjects.length) || (en.customAnswers && en.customAnswers.length)) {
      wrapCampaign.style.display = 'block';
      if (subjectsListEl) {
        const subs = Array.isArray(en.selectedSubjects) && en.selectedSubjects.length > 0
          ? en.selectedSubjects.map(s => typeof s === 'object' && s ? (s.name || s.title || '') : String(s || '')).filter(Boolean).join(', ')
          : (typeof en.subjectsChosen === 'string' ? en.subjectsChosen : '-');
        subjectsListEl.innerHTML = `<strong>วิชาที่สมัคร:</strong> ${escapeHtml(subs)}`;
      }
      if (answersListEl) {
        if (Array.isArray(en.customAnswers) && en.customAnswers.length > 0) {
          answersListEl.innerHTML = en.customAnswers.map(a => `<div>• <b>${escapeHtml(a.label)}:</b> ${escapeHtml(a.value || '-')}</div>`).join('');
        } else {
          answersListEl.innerHTML = '';
        }
      }
    } else {
      wrapCampaign.style.display = 'none';
    }
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
  document.getElementById('enPaidAmount').value = parsePaidAmount(en.paidAmount) ?? '';
  updateEnrollmentModalForCourse();

  const wrapImage = document.getElementById('wrapEnStudentImage');
  const imgPreview = document.getElementById('enStudentImagePreview');
  const imgLink = document.getElementById('enStudentImageLink');
  if (wrapImage) {
    if (en.studentImageUrl) {
      wrapImage.style.display = 'block';
      if (imgPreview) {
        imgPreview.removeAttribute('src');
        imgPreview.setAttribute('data-student-name', en.studentName || '');
      }
      if (imgLink) imgLink.removeAttribute('href');
      // รูปส่วนตัวต้องขอลิงก์ชั่วคราวจาก Supabase ก่อนแสดง
      getStudentAttachmentUrl(en.studentImageUrl).then(url => {
        if (document.getElementById('enrollmentEditId').value !== en.id || !url) return;
        if (imgPreview) {
          imgPreview.src = url;
          imgPreview.setAttribute('data-full-url', url);
        }
        if (imgLink) imgLink.href = url;
      });
    } else {
      wrapImage.style.display = 'none';
    }
  }

  document.getElementById('modalEnrollment').classList.add('active');
}

// อนุญาตเฉพาะลิงก์รูปที่ปลอดภัย (กัน javascript: หรือ URL แปลก ๆ ที่ถูกใส่มาในข้อมูล)
function safeMediaUrl(url) {
  const u = String(url || '').trim();
  return /^(https?:\/\/|data:image\/|\/?uploads\/)/i.test(u) ? u : '';
}

async function getStudentAttachmentUrl(ref) {
  const url = window.NewGenDB && typeof window.NewGenDB.getStudentImageUrl === 'function'
    ? await window.NewGenDB.getStudentImageUrl(ref)
    : (window.resolveMediaUrl ? window.resolveMediaUrl(ref) : ref);
  return safeMediaUrl(url);
}

async function previewEnrollmentAttachment(enrollId) {
  const en = (window.NewGenDB ? window.NewGenDB.getEnrollments() : []).find(x => x.id === enrollId);
  if (!en || !en.studentImageUrl) return;
  const url = await getStudentAttachmentUrl(en.studentImageUrl);
  if (!url) {
    showToast('⚠️ เปิดรูปภาพไม่สำเร็จ (ลิงก์ไม่ถูกต้อง หรือสิทธิ์หมดอายุ กรุณาเข้าสู่ระบบใหม่)', 'warning');
    return;
  }
  previewAttachmentModal(url, en.studentName || '');
}

window.previewEnrollmentAttachment = previewEnrollmentAttachment;

function previewAttachmentModal(url, studentName = '') {
  url = safeMediaUrl(url);
  if (!url) return;
  const modal = document.getElementById('modalStudentAttachmentPreview');
  const imgEl = document.getElementById('attachmentModalImg');
  const titleEl = document.getElementById('attachmentModalTitle');
  const linkEl = document.getElementById('attachmentModalOpenLink');
  const resolvedUrl = window.resolveMediaUrl ? window.resolveMediaUrl(url) : url;

  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-image" style="color: #2563eb;"></i> รูปภาพที่นักเรียนแนบ ${studentName ? `(${escapeHtml(studentName)})` : ''}`;
  }
  if (imgEl) {
    imgEl.style.opacity = '0.3';
    imgEl.src = resolvedUrl;
    imgEl.onload = () => { imgEl.style.opacity = '1'; };
    imgEl.onerror = () => {
      // If relative URL failed, try Supabase storage fallback
      if (!resolvedUrl.startsWith('http') && window.SUPABASE_CONFIG?.url) {
        imgEl.src = `${window.SUPABASE_CONFIG.url}/storage/v1/object/public/uploads/${resolvedUrl.replace(/^uploads\//, '')}`;
        imgEl.onload = () => { imgEl.style.opacity = '1'; };
      } else {
        imgEl.style.opacity = '1';
      }
    };
  }
  if (linkEl) linkEl.href = resolvedUrl;
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function previewStudentAttachmentInModal() {
  const imgPreview = document.getElementById('enStudentImagePreview');
  if (!imgPreview) return;
  const url = imgPreview.getAttribute('data-full-url') || imgPreview.src;
  const studentName = imgPreview.getAttribute('data-student-name') || '';
  previewAttachmentModal(url, studentName);
}

window.previewAttachmentModal = previewAttachmentModal;
window.previewStudentAttachmentInModal = previewStudentAttachmentInModal;

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
  const isCampaignCourse = courseId === 'campaign-free' || courseId === 'campaign';
  const paidAmount = isCampaignCourse ? null : parsePaidAmount(document.getElementById('enPaidAmount').value);

  const bundles = window.NewGenDB ? window.NewGenDB.getBundles() : [];
  const foundBundle = bundles.find(b => b.id === courseId);
  const existingEn = id ? (window.NewGenDB.getEnrollments().find(x => x.id === id)) : null;
  // เก็บราคา ณ วันที่สมัครไว้ ถ้าเปลี่ยนคอร์สค่อยใช้ราคาปัจจุบันของคอร์สใหม่
  const keepPrice = existingEn && existingEn.courseId === courseId && typeof existingEn.price === 'number';
  const price = isCampaignCourse ? 0 : (keepPrice ? existingEn.price : getCurrentListPrice(courseId));

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
    shippingAddress: isCampaignCourse ? '' : shippingAddress,
    notes,
    price,
    paidAmount,
    studentImageUrl: existingEn ? (existingEn.studentImageUrl || null) : null,
    customAnswers: existingEn ? (existingEn.customAnswers || []) : [],
    isBundle: Boolean(foundBundle),
    bundleId: foundBundle ? foundBundle.id : null,
    bundleName: foundBundle ? foundBundle.name : null,
    bundleCourseIds: foundBundle ? (foundBundle.courseIds || []) : [],
    createdAt: id ? (existingEn?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (!id && foundBundle) {
    const allCourses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
    const bundleStatus = window.isBundleFull ? window.isBundleFull(foundBundle, allCourses) : { isFull: false, fullCourses: [] };
    if (bundleStatus.isFull) {
      const fullList = bundleStatus.fullCourses.map(fc => `• ${fc.title}`).join('\n');
      const proceed = confirm(`คำเตือน: แพ็คเกจ "${foundBundle.name}" มีคอร์สที่ที่นั่งเต็มแล้ว ดังนี้:\n${fullList}\n\nคุณต้องการบันทึกการสมัครเป็นกรณีพิเศษ (เพิ่มที่นั่งพิเศษ) หรือไม่?`);
      if (!proceed) return;
    }
  }

  const res = await window.NewGenDB.saveEnrollment(item);

  // Sync with Server API
  fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).catch(() => {});

  // Requirement 1: If manual enrollment is for a bundle, send student to every course in the bundle!
  if (!id && foundBundle && Array.isArray(foundBundle.courseIds) && foundBundle.courseIds.length > 0) {
    const allCourses = window.NewGenDB.getCourses();
    for (const subId of foundBundle.courseIds) {
      const subCourse = allCourses.find(c => c.id === subId);
      const subItem = {
        ...item,
        id: `${item.id}-${subId}`,
        courseId: subId,
        courseTitle: subCourse ? subCourse.title : subId,
        isBundle: false,
        isFromBundle: true,
        bundleId: foundBundle.id,
        bundleName: foundBundle.name,
        parentEnrollId: item.id,
        notes: (notes || '').trim()
      };
      await window.NewGenDB.saveEnrollment(subItem);
      fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subItem)
      }).catch(() => {});
    }
  } else if (id && (foundBundle || item.isBundle)) {
    // If editing existing bundle enrollment, synchronize student info to all linked child course records!
    const allEnrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
    const linked = allEnrollments.filter(e => e.parentEnrollId === id);
    for (const sub of linked) {
      const updatedSub = {
        ...sub,
        studentName: item.studentName,
        nickname: item.nickname,
        grade: item.grade,
        school: item.school,
        parentPhone: item.parentPhone,
        studentPhone: item.studentPhone,
        lineId: item.lineId,
        status: item.status,
        shippingAddress: item.shippingAddress,
        learningType: item.learningType
      };
      await window.NewGenDB.saveEnrollment(updatedSub);
      fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSub)
      }).catch(() => {});
    }
  }

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

  let confirmMsg = `คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อของ "${studentName}"?`;
  const isBundleMaster = Boolean(en && en.isBundle);

  if (isBundleMaster) {
    confirmMsg = `ผู้สมัคร "${studentName}" สมัครผ่านแพ็คเกจคอร์สเรียน\n\nต้องการลบรายชื่อและคืนที่นั่งในทุกคอร์สย่อยที่เชื่อมโยงกับแพ็คเกจนี้ด้วยหรือไม่?`;
  }

  if (!confirm(confirmMsg)) {
    return;
  }

  const res = await window.NewGenDB.deleteEnrollment(id);

  // Sync with Server API
  fetch(`/api/enrollments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(() => {});

  // If this was a master bundle application, also delete the child course registrations!
  if (isBundleMaster) {
    const linked = enrollments.filter(e => e.parentEnrollId === id);
    for (const sub of linked) {
      await window.NewGenDB.deleteEnrollment(sub.id);
      fetch(`/api/enrollments?id=${encodeURIComponent(sub.id)}`, { method: 'DELETE' }).catch(() => {});
    }
  }

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
    let str = String(field);
    // กันสูตร Excel ที่แฝงมาในข้อมูลจากฟอร์มสาธารณะ (CSV/formula injection)
    if (/^[=+@\t\r]/.test(str) || /^-[^\d\s]/.test(str)) str = `'${str}`;
    return `"${str.replace(/"/g, '""')}"`;
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

  headers.push('รูปภาพที่แนบ (URL)');
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

    // รูปส่วนตัวไม่มีลิงก์ถาวร (เปิดดูได้ในระบบหลังบ้านเท่านั้น)
    const imageRef = en.studentImageUrl || '';
    row.push(csvEscape(imageRef.startsWith('private:') ? 'มีรูปแนบ (ดูในระบบหลังบ้าน)' : safeMediaUrl(imageRef)));
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

/* ==========================================================================
   ANALYTICS TAB (สรุปสถิติการสมัคร & รายได้)
   ========================================================================== */
let _analyticsRange = 'all';
const _anaCharts = {};

// Chart palette (validated categorical slots + ordinal step; see dataviz reference palette)
const ANA_COLORS = {
  series1: '#2a78d6',      // คอร์สเรียน / ยืนยันแล้ว / Onsite
  series1Light: '#86b6ef', // รายได้คาดการณ์ (ขั้นสว่างของสีเดียวกัน)
  series2: '#eb6834',      // ติวฟรี / Online
  surface: '#ffffff',
  textSecondary: '#52514e',
  textMuted: '#898781',
  grid: '#e1e0d9',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b'
};

function parsePaidAmount(val) {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  const n = Number(String(val).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parsePriceText(val) {
  return parseInt(String(val || '').replace(/[^0-9]/g, ''), 10) || 0;
}

// ราคาปัจจุบันของคอร์สหรือแพ็คเกจ (ใช้กับใบสมัครเก่าที่ยังไม่ได้บันทึกราคาไว้)
function getCurrentListPrice(id) {
  if (!id || id === 'campaign-free' || id === 'campaign') return 0;
  const course = (window.NewGenDB ? window.NewGenDB.getCourses() : []).find(c => c.id === id);
  if (course) return parsePriceText(course.pricePromo);
  const bundle = (window.NewGenDB ? window.NewGenDB.getBundles() : []).find(b => b.id === id);
  return bundle ? parsePriceText(bundle.pricePromo) : 0;
}

// ยอดเงินของใบสมัคร: ยอดชำระจริง > ราคา ณ วันที่สมัคร > ราคาปัจจุบัน (แพ็คเกจนับที่ใบหลักครั้งเดียว)
function getEnrollmentAmount(en) {
  if (isCampaignEnrollment(en) || en.isFromBundle) return 0;
  const paid = parsePaidAmount(en.paidAmount);
  if (paid !== null) return paid;
  if (typeof en.price === 'number') return en.price;
  return getCurrentListPrice(en.isBundle ? (en.bundleId || en.courseId) : en.courseId);
}

function getEnrollmentStatusGroup(en) {
  if (en.status === 'confirmed' || en.status === 'materials_sent') return 'confirmed';
  if (en.status === 'cancelled') return 'cancelled';
  return 'pending';
}

function normalizeGradeLabel(grade) {
  const m = String(grade || '').match(/(ป|ม)\.?\s*(\d)/);
  return m ? `${m[1]}.${m[2]}` : 'อื่น ๆ';
}

function normalizeSchoolName(school) {
  return String(school || '').trim().replace(/^(โรงเรียน|ร\.ร\.|รร\.?)\s*/, '').replace(/\s+/g, ' ').trim();
}

function formatBaht(n) {
  return `฿${Math.round(n || 0).toLocaleString('th-TH')}`;
}

function setAnalyticsRange(range) {
  _analyticsRange = range;
  document.querySelectorAll('#anaRangeButtons .ana-range-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
  loadAdminAnalytics();
}

function getAnalyticsWindow(range, enrollments) {
  const now = new Date();
  if (range === 'all') {
    const times = enrollments.map(e => new Date(e.createdAt).getTime()).filter(t => Number.isFinite(t));
    const start = times.length ? new Date(Math.min(...times)) : now;
    return { start, end: now, prevStart: null, prevEnd: null };
  }
  const days = Number(range);
  const start = new Date(now.getTime() - days * 86400000);
  return { start, end: now, prevStart: new Date(start.getTime() - days * 86400000), prevEnd: start };
}

function inWindow(en, start, end) {
  const t = new Date(en.createdAt).getTime();
  if (!Number.isFinite(t)) return start === null; // ไม่มีวันที่ → นับเฉพาะมุมมอง "ทั้งหมด"
  return (!start || t >= start.getTime()) && (!end || t <= end.getTime());
}

function loadAdminAnalytics() {
  const pane = document.getElementById('tab-analytics');
  if (!pane) return;

  const allEnrollments = window.NewGenDB ? window.NewGenDB.getEnrollments() : [];
  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
  const bundles = window.NewGenDB ? window.NewGenDB.getBundles() : [];

  const win = getAnalyticsWindow(_analyticsRange, allEnrollments);
  const scoped = allEnrollments.filter(en => inWindow(en, _analyticsRange === 'all' ? null : win.start, win.end));
  const previous = win.prevStart ? allEnrollments.filter(en => inWindow(en, win.prevStart, win.prevEnd)) : null;

  const caption = document.getElementById('anaRangeCaption');
  if (caption) {
    const fmt = d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    caption.textContent = `${fmt(win.start)} – ${fmt(win.end)}`;
  }

  renderAnalyticsKpis(scoped, previous);
  renderAnalyticsTop3(scoped, courses);
  renderAnalyticsTrend(scoped, win);
  renderAnalyticsRevenue(scoped, courses, bundles);
  renderAnalyticsCourseCounts(scoped, courses);
  renderAnalyticsSplits(scoped);
  renderAnalyticsGrades(scoped);
  renderAnalyticsSchools(scoped);
  renderAnalyticsFillRate(allEnrollments, courses);
}

// ใบสมัคร 1 ใบต่อการสมัคร 1 ครั้ง (ไม่นับใบย่อยที่ระบบแตกออกจากแพ็คเกจ)
function getApplications(list) {
  return list.filter(en => !en.isFromBundle);
}

function renderAnalyticsKpis(scoped, previous) {
  const grid = document.getElementById('anaKpiGrid');
  if (!grid) return;

  const summarize = list => {
    const apps = getApplications(list);
    const courseApps = apps.filter(en => !isCampaignEnrollment(en));
    const active = courseApps.filter(en => getEnrollmentStatusGroup(en) !== 'cancelled');
    return {
      courseCount: active.length,
      campaignCount: apps.filter(en => isCampaignEnrollment(en) && getEnrollmentStatusGroup(en) !== 'cancelled').length,
      revenueConfirmed: courseApps.filter(en => getEnrollmentStatusGroup(en) === 'confirmed').reduce((s, en) => s + getEnrollmentAmount(en), 0),
      revenuePending: courseApps.filter(en => getEnrollmentStatusGroup(en) === 'pending').reduce((s, en) => s + getEnrollmentAmount(en), 0),
      confirmedCount: courseApps.filter(en => getEnrollmentStatusGroup(en) === 'confirmed').length,
      totalCourseApps: courseApps.length,
      cancelledCount: apps.filter(en => getEnrollmentStatusGroup(en) === 'cancelled').length
    };
  };

  const cur = summarize(scoped);
  const prev = previous ? summarize(previous) : null;

  const delta = (now, before) => {
    if (!prev) return '';
    if (before === 0) return now > 0 ? '<span class="ana-delta up"><i class="fa-solid fa-arrow-up"></i> ใหม่</span>' : '<span class="ana-delta flat">– ไม่เปลี่ยนแปลง</span>';
    const pct = Math.round(((now - before) / before) * 100);
    if (pct === 0) return '<span class="ana-delta flat">– ไม่เปลี่ยนแปลง</span>';
    return pct > 0
      ? `<span class="ana-delta up"><i class="fa-solid fa-arrow-up"></i> ${pct}% จากช่วงก่อน</span>`
      : `<span class="ana-delta down"><i class="fa-solid fa-arrow-down"></i> ${Math.abs(pct)}% จากช่วงก่อน</span>`;
  };

  const confirmRate = cur.totalCourseApps ? Math.round((cur.confirmedCount / cur.totalCourseApps) * 100) : 0;

  const tiles = [
    { icon: 'fa-user-graduate', label: 'ใบสมัครคอร์สเรียน', value: cur.courseCount.toLocaleString('th-TH'), sub: delta(cur.courseCount, prev?.courseCount) || 'ไม่รวมติวฟรีและที่ยกเลิก' },
    { icon: 'fa-gift', label: 'ผู้สมัครโครงการติวฟรี', value: cur.campaignCount.toLocaleString('th-TH'), sub: delta(cur.campaignCount, prev?.campaignCount) || 'ไม่รวมที่ยกเลิก' },
    { icon: 'fa-sack-dollar', label: 'รายได้ยืนยันแล้ว', value: formatBaht(cur.revenueConfirmed), sub: delta(cur.revenueConfirmed, prev?.revenueConfirmed) || 'ยืนยันที่นั่ง + ส่งเอกสารแล้ว' },
    { icon: 'fa-hourglass-half', label: 'รายได้คาดการณ์', value: formatBaht(cur.revenuePending), sub: 'จากใบสมัครที่รอตรวจสอบ' },
    { icon: 'fa-circle-check', label: 'อัตรายืนยันที่นั่ง', value: `${confirmRate}%`, sub: `ยืนยันแล้ว ${cur.confirmedCount} จาก ${cur.totalCourseApps} ใบ` },
    { icon: 'fa-ban', label: 'ยกเลิกการสมัคร', value: cur.cancelledCount.toLocaleString('th-TH'), sub: 'รวมทุกคอร์สและติวฟรี' }
  ];

  grid.innerHTML = tiles.map(t => `
    <div class="ana-kpi">
      <div class="ana-kpi-label"><i class="fa-solid ${t.icon}"></i> ${t.label}</div>
      <div class="ana-kpi-value">${t.value}</div>
      <div class="ana-kpi-sub">${t.sub}</div>
    </div>
  `).join('');
}

// นับจำนวนผู้สมัครต่อคอร์ส (รวมใบย่อยจากแพ็คเกจ ไม่รวมใบหลักแพ็คเกจ/ติวฟรี/ยกเลิก)
function countByCourse(list, courses) {
  const courseIds = new Set(courses.map(c => c.id));
  const counts = {};
  list.forEach(en => {
    if (en.isBundle || isCampaignEnrollment(en) || getEnrollmentStatusGroup(en) === 'cancelled') return;
    if (!courseIds.has(en.courseId)) return;
    if (!counts[en.courseId]) counts[en.courseId] = { total: 0, fromBundle: 0 };
    counts[en.courseId].total++;
    if (en.isFromBundle) counts[en.courseId].fromBundle++;
  });
  return counts;
}

function renderAnalyticsTop3(scoped, courses) {
  const box = document.getElementById('anaTop3');
  if (!box) return;
  const counts = countByCourse(scoped, courses);
  const ranked = courses
    .filter(c => counts[c.id])
    .map(c => ({ course: c, ...counts[c.id] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  if (ranked.length === 0) {
    box.innerHTML = '<div class="ana-empty">ยังไม่มีผู้สมัครคอร์สเรียนในช่วงเวลานี้</div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  // แสดงแบบแท่นรางวัล: อันดับ 2 – 1 – 3
  const order = ranked.length === 3 ? [1, 0, 2] : ranked.map((_, i) => i);
  box.innerHTML = order.map(i => {
    const r = ranked[i];
    return `
      <div class="ana-podium-item rank-${i + 1}">
        <div class="ana-podium-medal">${medals[i]}</div>
        <div class="ana-podium-title">${escapeHtml(r.course.title)}</div>
        <div class="ana-podium-count">${r.total.toLocaleString('th-TH')} <span>คน</span></div>
        <div class="ana-podium-sub">${r.fromBundle ? `มาจากแพ็คเกจ ${r.fromBundle} คน` : 'สมัครคอร์สเดี่ยวทั้งหมด'}</div>
        <div class="ana-podium-base">อันดับ ${i + 1}</div>
      </div>
    `;
  }).join('');
}

function destroyAnaChart(key) {
  if (_anaCharts[key]) {
    _anaCharts[key].destroy();
    delete _anaCharts[key];
  }
}

function anaChartsAvailable(canvasId) {
  if (typeof Chart !== 'undefined') return true;
  const canvas = document.getElementById(canvasId);
  if (canvas && canvas.parentElement) {
    canvas.parentElement.innerHTML = '<div class="ana-empty">โหลดไลบรารีกราฟไม่สำเร็จ (ตรวจสอบอินเทอร์เน็ต) — ดูตัวเลขได้ในตารางด้านล่าง</div>';
  }
  return false;
}

function anaBaseOptions(extra = {}) {
  Chart.defaults.font.family = "'Prompt', system-ui, sans-serif";
  Chart.defaults.color = ANA_COLORS.textSecondary;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { position: 'top', align: 'start', labels: { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 2 } },
      tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 6, titleFont: { weight: '700' } }
    },
    ...extra
  };
}

function renderAnalyticsTrend(scoped, win) {
  if (!anaChartsAvailable('anaTrendChart')) return;
  destroyAnaChart('trend');

  const spanDays = Math.max(1, Math.ceil((win.end - win.start) / 86400000));
  const unit = spanDays <= 45 ? 'day' : (spanDays <= 120 ? 'week' : 'month');
  const captionEl = document.getElementById('anaTrendCaption');
  if (captionEl) captionEl.textContent = `จำนวนใบสมัครราย${unit === 'day' ? 'วัน' : unit === 'week' ? 'สัปดาห์' : 'เดือน'} (ไม่นับใบย่อยจากแพ็คเกจ)`;

  const bucketStart = d => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (unit === 'week') x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // เริ่มวันจันทร์
    if (unit === 'month') x.setDate(1);
    return x;
  };
  const step = d => {
    const x = new Date(d);
    if (unit === 'day') x.setDate(x.getDate() + 1);
    else if (unit === 'week') x.setDate(x.getDate() + 7);
    else x.setMonth(x.getMonth() + 1);
    return x;
  };

  const buckets = [];
  for (let d = bucketStart(win.start); d <= win.end; d = step(d)) buckets.push(d.getTime());
  const idxOf = t => {
    const b = bucketStart(new Date(t)).getTime();
    return buckets.indexOf(b);
  };

  const courseSeries = new Array(buckets.length).fill(0);
  const campaignSeries = new Array(buckets.length).fill(0);
  getApplications(scoped).forEach(en => {
    const t = new Date(en.createdAt).getTime();
    if (!Number.isFinite(t)) return;
    const i = idxOf(t);
    if (i === -1) return;
    if (isCampaignEnrollment(en)) campaignSeries[i]++;
    else courseSeries[i]++;
  });

  const labels = buckets.map(t => {
    const d = new Date(t);
    return unit === 'month'
      ? d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
      : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  });

  const lineDataset = (label, data, color) => ({
    label, data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    cubicInterpolationMode: 'monotone', // โค้งเรียบแต่ไม่เลยต่ำกว่า 0
    pointRadius: buckets.length <= 1 ? 4 : 0,
    pointHoverRadius: 5,
    pointHoverBorderWidth: 2,
    pointHoverBorderColor: ANA_COLORS.surface
  });

  _anaCharts.trend = new Chart(document.getElementById('anaTrendChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        lineDataset('คอร์สเรียน', courseSeries, ANA_COLORS.series1),
        lineDataset('ติวฟรี', campaignSeries, ANA_COLORS.series2)
      ]
    },
    options: anaBaseOptions({
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { color: ANA_COLORS.textMuted, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
        y: { beginAtZero: true, ticks: { precision: 0, color: ANA_COLORS.textMuted }, grid: { color: ANA_COLORS.grid }, border: { display: false } }
      }
    })
  });
}

function renderAnalyticsRevenue(scoped, courses, bundles) {
  const rows = {};
  const ensureRow = (key, label, unitText) => {
    if (!rows[key]) rows[key] = { key, label, unitText, apps: 0, confirmed: 0, pending: 0, price: getCurrentListPrice(key) };
    return rows[key];
  };

  getApplications(scoped).forEach(en => {
    if (isCampaignEnrollment(en)) return;
    const group = getEnrollmentStatusGroup(en);
    if (group === 'cancelled') return;
    const key = en.isBundle ? (en.bundleId || en.courseId) : en.courseId;
    const course = courses.find(c => c.id === key);
    const bundle = bundles.find(b => b.id === key);
    const label = course ? course.title : (bundle ? `[แพ็คเกจ] ${bundle.name}` : (en.bundleName ? `[แพ็คเกจ] ${en.bundleName}` : (en.courseTitle || key || 'ไม่ระบุคอร์ส')));
    const unitText = (course ? course.priceUnit : (bundle ? bundle.priceUnit : '')) || '';
    const row = ensureRow(key, label, unitText);
    row.apps++;
    row[group] += getEnrollmentAmount(en);
  });

  const list = Object.values(rows).sort((a, b) => (b.confirmed + b.pending) - (a.confirmed + a.pending));

  // Table (also the accessible table view of the chart)
  const tbody = document.getElementById('anaRevenueTableBody');
  if (tbody) {
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="ana-empty">ยังไม่มีใบสมัครคอร์สเรียนในช่วงเวลานี้</td></tr>';
    } else {
      const totals = list.reduce((t, r) => ({ apps: t.apps + r.apps, confirmed: t.confirmed + r.confirmed, pending: t.pending + r.pending }), { apps: 0, confirmed: 0, pending: 0 });
      tbody.innerHTML = list.map(r => {
        const monthly = r.unitText.includes('เดือน');
        return `
          <tr>
            <td style="font-weight: 600; color: var(--color-navy);">
              ${escapeHtml(r.label)}
              ${monthly ? '<span class="ana-tag">รายเดือน • นับ 1 เดือน/ใบ</span>' : ''}
            </td>
            <td class="num">${r.apps.toLocaleString('th-TH')}</td>
            <td class="num">${r.price ? `${r.price.toLocaleString('th-TH')}${monthly ? ' / เดือน' : ''}` : '-'}</td>
            <td class="num">${formatBaht(r.confirmed)}</td>
            <td class="num" style="color: var(--text-muted);">${formatBaht(r.pending)}</td>
            <td class="num" style="font-weight: 700;">${formatBaht(r.confirmed + r.pending)}</td>
          </tr>
        `;
      }).join('') + `
        <tr class="ana-total-row">
          <td>รวมทั้งหมด</td>
          <td class="num">${totals.apps.toLocaleString('th-TH')}</td>
          <td class="num"></td>
          <td class="num">${formatBaht(totals.confirmed)}</td>
          <td class="num">${formatBaht(totals.pending)}</td>
          <td class="num">${formatBaht(totals.confirmed + totals.pending)}</td>
        </tr>
      `;
    }
  }

  if (!anaChartsAvailable('anaRevenueChart')) return;
  destroyAnaChart('revenue');
  const box = document.getElementById('anaRevenueChartBox');
  if (box) box.style.height = `${Math.max(180, list.length * 38 + 70)}px`;

  _anaCharts.revenue = new Chart(document.getElementById('anaRevenueChart'), {
    type: 'bar',
    data: {
      labels: list.map(r => r.label),
      datasets: [
        { label: 'ยืนยันแล้ว', data: list.map(r => r.confirmed), backgroundColor: ANA_COLORS.series1, borderColor: ANA_COLORS.surface, borderWidth: { right: 2 }, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22 },
        { label: 'คาดการณ์ (รอตรวจสอบ)', data: list.map(r => r.pending), backgroundColor: ANA_COLORS.series1Light, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22 }
      ]
    },
    options: anaBaseOptions({
      indexAxis: 'y',
      plugins: {
        ...anaBaseOptions().plugins,
        tooltip: { ...anaBaseOptions().plugins.tooltip, callbacks: { label: ctx => `${ctx.dataset.label}: ${formatBaht(ctx.raw)}` } }
      },
      scales: {
        x: { stacked: true, beginAtZero: true, grid: { color: ANA_COLORS.grid }, border: { display: false }, ticks: { color: ANA_COLORS.textMuted, callback: v => formatBaht(v) } },
        y: { stacked: true, grid: { display: false }, ticks: { color: ANA_COLORS.textSecondary, callback: function (v) { const l = this.getLabelForValue(v); return l.length > 28 ? `${l.slice(0, 27)}…` : l; } } }
      }
    })
  });
}

function renderAnalyticsCourseCounts(scoped, courses) {
  if (!anaChartsAvailable('anaCourseCountChart')) return;
  destroyAnaChart('courseCount');
  const counts = countByCourse(scoped, courses);
  const list = courses
    .filter(c => counts[c.id])
    .map(c => ({ label: c.title, total: counts[c.id].total }))
    .sort((a, b) => b.total - a.total);

  const box = document.getElementById('anaCourseCountChartBox');
  if (box) box.style.height = `${Math.max(180, list.length * 34 + 50)}px`;

  _anaCharts.courseCount = new Chart(document.getElementById('anaCourseCountChart'), {
    type: 'bar',
    data: {
      labels: list.map(r => r.label),
      datasets: [{ label: 'ผู้สมัคร', data: list.map(r => r.total), backgroundColor: ANA_COLORS.series1, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22 }]
    },
    options: anaBaseOptions({
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { ...anaBaseOptions().plugins.tooltip, callbacks: { label: ctx => `ผู้สมัคร ${ctx.raw} คน` } }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, color: ANA_COLORS.textMuted }, grid: { color: ANA_COLORS.grid }, border: { display: false } },
        y: { grid: { display: false }, ticks: { color: ANA_COLORS.textSecondary, callback: function (v) { const l = this.getLabelForValue(v); return l.length > 28 ? `${l.slice(0, 27)}…` : l; } } }
      }
    })
  });
}

// แถบสัดส่วน 2 ส่วนแบบ HTML (ใช้แทนโดนัท 2 ชิ้น)
function renderSplitBar(containerId, parts) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) {
    el.innerHTML = '<div class="ana-empty">ยังไม่มีข้อมูล</div>';
    return;
  }
  el.innerHTML = `
    <div class="ana-split-bar">
      ${parts.filter(p => p.value > 0).map(p => `<div style="flex: ${p.value}; background: ${p.color};" title="${escapeHtml(p.label)}: ${p.value}"></div>`).join('')}
    </div>
    <div class="ana-split-legend">
      ${parts.map(p => `
        <div class="ana-split-item">
          <span class="ana-swatch" style="background: ${p.color};"></span>
          <span class="ana-split-name">${escapeHtml(p.label)}</span>
          <span class="ana-split-val">${p.value.toLocaleString('th-TH')} <small>(${Math.round((p.value / total) * 100)}%)</small></span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAnalyticsSplits(scoped) {
  const apps = getApplications(scoped);
  const active = apps.filter(en => getEnrollmentStatusGroup(en) !== 'cancelled');

  renderSplitBar('anaLearningSplit', [
    { label: 'Onsite (ที่สถาบัน)', value: active.filter(en => (en.learningType || 'onsite').toLowerCase() !== 'online').length, color: ANA_COLORS.series1 },
    { label: 'Online', value: active.filter(en => (en.learningType || '').toLowerCase() === 'online').length, color: ANA_COLORS.series2 }
  ]);

  const courseApps = active.filter(en => !isCampaignEnrollment(en));
  renderSplitBar('anaBundleSplit', [
    { label: 'คอร์สเดี่ยว', value: courseApps.filter(en => !en.isBundle).length, color: ANA_COLORS.series1 },
    { label: 'แพ็คเกจโปรโมชั่น', value: courseApps.filter(en => en.isBundle).length, color: ANA_COLORS.series2 }
  ]);

  // สถานะ: สีสถานะคู่กับไอคอนและข้อความเสมอ
  const statusDefs = [
    { key: 'confirmed', label: 'ยืนยันที่นั่งแล้ว', icon: 'fa-circle-check', color: ANA_COLORS.good },
    { key: 'materials_sent', label: 'ส่งเอกสารแล้ว', icon: 'fa-box', color: ANA_COLORS.series1 },
    { key: 'pending', label: 'รอตรวจสอบ / รอชำระ', icon: 'fa-clock', color: ANA_COLORS.warning },
    { key: 'cancelled', label: 'ยกเลิก', icon: 'fa-circle-xmark', color: ANA_COLORS.critical }
  ];
  const statusOf = en => (['confirmed', 'materials_sent', 'cancelled'].includes(en.status) ? en.status : 'pending');
  const max = Math.max(1, ...statusDefs.map(d => apps.filter(en => statusOf(en) === d.key).length));
  const statusEl = document.getElementById('anaStatusList');
  if (statusEl) {
    statusEl.innerHTML = apps.length === 0 ? '<div class="ana-empty">ยังไม่มีข้อมูล</div>' : statusDefs.map(d => {
      const n = apps.filter(en => statusOf(en) === d.key).length;
      return `
        <div class="ana-status-row">
          <div class="ana-status-head">
            <span><i class="fa-solid ${d.icon}" style="color: ${d.color};"></i> ${d.label}</span>
            <b>${n.toLocaleString('th-TH')}</b>
          </div>
          <div class="ana-bar-track"><div class="ana-bar-fill" style="width: ${(n / max) * 100}%; background: ${d.color};"></div></div>
        </div>
      `;
    }).join('');
  }
}

function renderAnalyticsGrades(scoped) {
  if (!anaChartsAvailable('anaGradeChart')) return;
  destroyAnaChart('grade');
  const counts = {};
  getApplications(scoped).forEach(en => {
    if (getEnrollmentStatusGroup(en) === 'cancelled') return;
    const g = normalizeGradeLabel(en.grade);
    counts[g] = (counts[g] || 0) + 1;
  });
  const labels = Object.keys(counts).sort(compareGradeLabels);

  _anaCharts.grade = new Chart(document.getElementById('anaGradeChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'ผู้สมัคร', data: labels.map(l => counts[l]), backgroundColor: ANA_COLORS.series1, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 36 }]
    },
    options: anaBaseOptions({
      plugins: {
        legend: { display: false },
        tooltip: { ...anaBaseOptions().plugins.tooltip, callbacks: { label: ctx => `ผู้สมัคร ${ctx.raw} คน` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: ANA_COLORS.textSecondary } },
        y: { beginAtZero: true, ticks: { precision: 0, color: ANA_COLORS.textMuted }, grid: { color: ANA_COLORS.grid }, border: { display: false } }
      }
    })
  });
}

function renderRankList(containerId, rows, emptyText, scaleMax = null) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (rows.length === 0) {
    el.innerHTML = `<div class="ana-empty">${emptyText}</div>`;
    return;
  }
  const max = scaleMax || Math.max(1, ...rows.map(r => r.barValue));
  el.innerHTML = rows.map((r, i) => `
    <div class="ana-rank-row">
      <span class="ana-rank-no">${i + 1}</span>
      <div class="ana-rank-body">
        <div class="ana-rank-head">
          <span class="ana-rank-name" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</span>
          <span class="ana-rank-val">${r.valueHtml}</span>
        </div>
        <div class="ana-bar-track"><div class="ana-bar-fill" style="width: ${Math.min(100, (r.barValue / max) * 100)}%; background: ${r.color || ANA_COLORS.series1};"></div></div>
      </div>
    </div>
  `).join('');
}

function renderAnalyticsSchools(scoped) {
  const students = {};
  getApplications(scoped).forEach(en => {
    if (getEnrollmentStatusGroup(en) === 'cancelled') return;
    const school = normalizeSchoolName(en.school);
    if (!school) return;
    if (!students[school]) students[school] = new Set();
    students[school].add(`${(en.studentName || '').trim()}|${(en.parentPhone || '').replace(/\D/g, '')}`);
  });
  const rows = Object.entries(students)
    .map(([school, set]) => ({ label: school, barValue: set.size, valueHtml: `${set.size} คน` }))
    .sort((a, b) => b.barValue - a.barValue)
    .slice(0, 10);
  renderRankList('anaSchoolList', rows, 'ยังไม่มีข้อมูลโรงเรียน');
}

function renderAnalyticsFillRate(allEnrollments, courses) {
  const counts = countByCourse(allEnrollments, courses);
  const rows = courses
    .map(c => {
      const max = Number(c.maxSeats || 12);
      const n = counts[c.id] ? counts[c.id].total : 0;
      const pct = max > 0 ? Math.round((n / max) * 100) : 0;
      const status = pct >= 100
        ? `<span style="color: ${ANA_COLORS.critical};"><i class="fa-solid fa-circle-xmark"></i> เต็ม</span>`
        : (pct >= 80 ? `<span style="color: #b45309;"><i class="fa-solid fa-triangle-exclamation"></i> ใกล้เต็ม</span>` : '');
      return {
        label: `${c.title}${c.isHidden ? ' [ซ่อน]' : ''}`,
        barValue: Math.min(pct, 100),
        pct,
        valueHtml: `${status} ${n}/${max} ที่ • <b>${pct}%</b>`,
        color: pct >= 100 ? ANA_COLORS.critical : (pct >= 80 ? ANA_COLORS.warning : ANA_COLORS.series1)
      };
    })
    .sort((a, b) => b.pct - a.pct);
  // สเกล 0–100% คงที่ ไม่ใช่เทียบกับคอร์สที่เต็มที่สุด
  renderRankList('anaFillList', rows, 'ยังไม่มีคอร์สเรียน', 100);
}

window.loadAdminAnalytics = loadAdminAnalytics;
window.setAnalyticsRange = setAnalyticsRange;

/* ==========================================================================
   DATA CLEANUP (ตั้งค่าระบบ → ล้างข้อมูล)
   ทุกการล้าง: ดูตัวอย่าง → ดาวน์โหลดไฟล์สำรองอัตโนมัติ → พิมพ์ "ลบ" → ใส่รหัสผ่านแอดมิน
   ========================================================================== */
let _cleanupCat = 'enrollments';
let _cleanupPlan = null;      // { title, summary, rows, warnings, backup, buttonText, run }
let _cleanupJunkScan = null;  // ผลสแกนข้อมูลขยะล่าสุด

const CLEANUP_CONTENT_TYPES = {
  reviews: { label: 'รีวิวนักเรียน', get: () => window.NewGenDB.getReviews(), save: l => window.NewGenDB.saveReviews(l), name: r => `${r.studentName || '-'}${r.school ? ` (${r.school})` : ''} — ${String(r.quote || '').slice(0, 50)}` },
  achievements: { label: 'ผลงานรุ่นพี่', get: () => window.NewGenDB.getAchievements(), save: l => window.NewGenDB.saveAchievements(l), name: a => `${a.title || '-'}${a.date ? ` (${a.date})` : ''}` },
  videos: { label: 'วิดีโอทดลองเรียน', get: () => window.NewGenDB.getVideos(), save: l => window.NewGenDB.saveVideos(l), name: v => `${v.title || '-'}${v.tutor ? ` — ${v.tutor}` : ''}` },
  tutors: { label: 'ติวเตอร์', get: () => window.NewGenDB.getTutors(), save: l => window.NewGenDB.saveTutors(l), name: t => `${t.name || '-'}${t.subjects ? ` — ${t.subjects}` : ''}` }
};

const CLEANUP_PERSONAL_FIELDS = ['studentName', 'fullName', 'nickname', 'parentPhone', 'studentPhone', 'lineId', 'shippingAddress', 'notes', 'customAnswers', 'studentImageUrl', 'consentText'];

const cleanupVal = id => (document.getElementById(id)?.value || '').trim();

function selectCleanupCategory(cat) {
  _cleanupCat = cat;
  document.querySelectorAll('#cleanupCats .cleanup-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderCleanupPanel();
}

function renderCleanupPanel() {
  const panel = document.getElementById('cleanupPanel');
  if (!panel) return;
  if (_cleanupCat === 'enrollments') panel.innerHTML = renderCleanupEnrollmentsPanel();
  else if (_cleanupCat === 'courses') panel.innerHTML = renderCleanupCoursesPanel();
  else if (_cleanupCat === 'content') panel.innerHTML = renderCleanupContentPanel();
  else panel.innerHTML = renderCleanupJunkPanel();
  if (_cleanupCat === 'enrollments') updateCleanupEnrollmentRangeInputs();
  updateCleanupCount();
}

/* ---------- 1) รายชื่อนักเรียน ---------- */
function renderCleanupEnrollmentsPanel() {
  const enrollments = window.NewGenDB.getEnrollments();
  const courses = window.NewGenDB.getCourses();
  const years = [...new Set(enrollments.map(e => new Date(e.createdAt).getFullYear()).filter(y => Number.isFinite(y)).concat(new Date().getFullYear()))].sort((a, b) => b - a);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return `
    <h3 class="cleanup-panel-title"><i class="fa-solid fa-users"></i> ล้างรายชื่อนักเรียน (ใบสมัคร)</h3>
    <div class="cleanup-form-grid">
      <div class="form-group-luxury">
        <label>ช่วงเวลา (ตามวันที่สมัคร)</label>
        <select id="cleanupRangeMode" onchange="updateCleanupEnrollmentRangeInputs(); updateCleanupCount();">
          <option value="day">วันเดียว</option>
          <option value="month" selected>ทั้งเดือน</option>
          <option value="year">ทั้งปี</option>
          <option value="custom">ช่วงวันที่กำหนดเอง</option>
          <option value="older">เก่ากว่า … เดือน</option>
          <option value="all">ทั้งหมด (ทุกช่วงเวลา)</option>
        </select>
      </div>
      <div class="form-group-luxury cleanup-range" data-mode="day"><label>วันที่</label><input type="date" id="cleanupDay" value="${today}" onchange="updateCleanupCount()"></div>
      <div class="form-group-luxury cleanup-range" data-mode="month"><label>เดือน</label><input type="month" id="cleanupMonth" value="${today.slice(0, 7)}" onchange="updateCleanupCount()"></div>
      <div class="form-group-luxury cleanup-range" data-mode="year"><label>ปี (ค.ศ.)</label>
        <select id="cleanupYear" onchange="updateCleanupCount()">${years.map(y => `<option value="${y}">${y} (พ.ศ. ${y + 543})</option>`).join('')}</select>
      </div>
      <div class="form-group-luxury cleanup-range" data-mode="custom"><label>ตั้งแต่วันที่</label><input type="date" id="cleanupFrom" value="${today}" onchange="updateCleanupCount()"></div>
      <div class="form-group-luxury cleanup-range" data-mode="custom"><label>ถึงวันที่</label><input type="date" id="cleanupTo" value="${today}" onchange="updateCleanupCount()"></div>
      <div class="form-group-luxury cleanup-range" data-mode="older"><label>เก่ากว่า (เดือน)</label><input type="number" id="cleanupOlderMonths" min="1" value="12" oninput="updateCleanupCount()"></div>

      <div class="form-group-luxury">
        <label>คอร์ส</label>
        <select id="cleanupCourseFilter" onchange="updateCleanupCount()">
          <option value="all">ทุกคอร์ส</option>
          <option value="__campaign__">🎁 โครงการติวฟรี</option>
          <option value="__bundles__">📦 สมัครผ่านแพ็คเกจ</option>
          ${courses.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group-luxury">
        <label>สถานะ</label>
        <select id="cleanupStatusFilter" onchange="updateCleanupCount()">
          <option value="all">ทุกสถานะ</option>
          <option value="cancelled">❌ ยกเลิก</option>
          <option value="pending">⏳ รอตรวจสอบ</option>
          <option value="confirmed">✅ ยืนยันแล้ว</option>
          <option value="materials_sent">📦 ส่งเอกสารแล้ว</option>
        </select>
      </div>
    </div>

    <div class="cleanup-mode-choice">
      <label class="cleanup-radio">
        <input type="radio" name="cleanupEnrollAction" value="delete" checked onchange="updateCleanupCount()">
        <span><b>ลบทิ้งทั้งใบ</b><small>ใบสมัครและรูปที่แนบหายทั้งหมด สถิติ/รายได้ของช่วงนี้จะหายไปด้วย</small></span>
      </label>
      <label class="cleanup-radio">
        <input type="radio" name="cleanupEnrollAction" value="anonymize" onchange="updateCleanupCount()">
        <span><b>ลบเฉพาะข้อมูลส่วนตัว (เก็บสถิติไว้)</b><small>ลบชื่อ ชื่อเล่น เบอร์โทร LINE ที่อยู่ หมายเหตุ คำตอบเพิ่มเติม และรูป — เก็บคอร์ส ชั้น โรงเรียน สถานะ ราคา วันที่สมัครไว้ หน้าสถิติยังครบ</small></span>
      </label>
    </div>

    <div class="cleanup-footer">
      <span id="cleanupCountText" class="cleanup-count"></span>
      <button type="button" class="btn-cleanup-danger" onclick="prepareCleanupEnrollments()"><i class="fa-solid fa-magnifying-glass"></i> ตรวจรายการก่อนล้าง</button>
    </div>
  `;
}

function updateCleanupEnrollmentRangeInputs() {
  const mode = cleanupVal('cleanupRangeMode');
  document.querySelectorAll('#cleanupPanel .cleanup-range').forEach(el => { el.style.display = el.dataset.mode === mode ? '' : 'none'; });
}

function cleanupDateParts(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { day, month: day.slice(0, 7), year: String(d.getFullYear()), time: d.getTime() };
}

function getCleanupEnrollmentMatches() {
  const all = window.NewGenDB.getEnrollments();
  const mode = cleanupVal('cleanupRangeMode') || 'month';
  const courseFilter = cleanupVal('cleanupCourseFilter') || 'all';
  const statusFilter = cleanupVal('cleanupStatusFilter') || 'all';
  const olderMonths = Math.max(1, parseInt(cleanupVal('cleanupOlderMonths'), 10) || 12);
  const olderCutoff = new Date(); olderCutoff.setMonth(olderCutoff.getMonth() - olderMonths);

  const inRange = en => {
    if (mode === 'all') return true;
    const p = cleanupDateParts(en.createdAt);
    if (!p) return false;
    if (mode === 'day') return p.day === cleanupVal('cleanupDay');
    if (mode === 'month') return p.month === cleanupVal('cleanupMonth');
    if (mode === 'year') return p.year === cleanupVal('cleanupYear');
    if (mode === 'custom') {
      let from = cleanupVal('cleanupFrom'), to = cleanupVal('cleanupTo');
      if (from && to && from > to) [from, to] = [to, from];
      return (!from || p.day >= from) && (!to || p.day <= to);
    }
    if (mode === 'older') return p.time < olderCutoff.getTime();
    return false;
  };
  const courseOk = en => courseFilter === 'all'
    || (courseFilter === '__campaign__' && isCampaignEnrollment(en))
    || (courseFilter === '__bundles__' && (en.isBundle || en.isFromBundle || en.bundleId))
    || en.courseId === courseFilter;
  const statusOk = en => statusFilter === 'all' || (en.status || 'pending') === statusFilter;

  const matched = all.filter(en => inRange(en) && courseOk(en) && statusOk(en));
  // ใบหลักของแพ็คเกจ → รวมใบย่อยของคอร์สในแพ็คไปด้วย
  const ids = new Set(matched.map(e => e.id));
  all.forEach(e => { if (e.parentEnrollId && ids.has(e.parentEnrollId) && !ids.has(e.id)) { matched.push(e); ids.add(e.id); } });
  return matched;
}

function updateCleanupCount() {
  const el = document.getElementById('cleanupCountText');
  if (!el) return;
  if (_cleanupCat === 'enrollments') {
    const matched = getCleanupEnrollmentMatches();
    const anonymize = document.querySelector('input[name="cleanupEnrollAction"]:checked')?.value === 'anonymize';
    const pending = anonymize ? matched.filter(e => !e.anonymized) : matched;
    el.innerHTML = `ตรงเงื่อนไข <b>${pending.length}</b> ใบ${anonymize && matched.length !== pending.length ? ` (อีก ${matched.length - pending.length} ใบลบข้อมูลส่วนตัวไปแล้ว)` : ''}`;
  } else if (_cleanupCat === 'courses') {
    const c = document.querySelectorAll('#cleanupPanel input[name="cleanupCourse"]:checked').length;
    const b = document.querySelectorAll('#cleanupPanel input[name="cleanupBundle"]:checked').length;
    el.innerHTML = `เลือกคอร์ส <b>${c}</b> รายการ • แพ็คเกจ <b>${b}</b> รายการ`;
  } else if (_cleanupCat === 'content') {
    el.innerHTML = `เลือก <b>${document.querySelectorAll('#cleanupPanel input[name="cleanupContentItem"]:checked').length}</b> รายการ`;
  } else {
    el.innerHTML = _cleanupJunkScan ? `เลือก <b>${document.querySelectorAll('#cleanupPanel input[name="cleanupJunk"]:checked').length}</b> รายการ` : '';
  }
}

function getEnrollmentImageObject(en) {
  const ref = String(en.studentImageUrl || '');
  let m = ref.match(/^private:([a-z0-9-]+)\/(.+)$/i);
  if (m) return { bucket: m[1], path: m[2] };
  m = ref.match(/\/storage\/v1\/object\/public\/([a-z0-9-]+)\/([^?#]+)/i);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

async function deleteEnrollmentImages(list) {
  const byBucket = {};
  list.forEach(en => { const o = getEnrollmentImageObject(en); if (o) (byBucket[o.bucket] = byBucket[o.bucket] || []).push(o.path); });
  let deleted = 0;
  const errors = [];
  for (const [bucket, paths] of Object.entries(byBucket)) {
    const r = await window.NewGenDB.deleteStorageFiles(bucket, paths);
    deleted += r.deleted;
    errors.push(...r.errors);
  }
  return { deleted, errors };
}

// คำนวณที่นั่งคงเหลือของคอร์สที่ได้รับผลกระทบใหม่ (แบบเดียวกับตอนลบรายชื่อทีละคน)
async function recomputeSeatsForCourses(courseIds) {
  const ids = new Set(courseIds.filter(Boolean));
  if (ids.size === 0) return;
  const courses = window.NewGenDB.getCourses();
  const enrollments = window.NewGenDB.getEnrollments();
  let changed = false;
  courses.forEach(c => {
    if (!ids.has(c.id)) return;
    const cap = Number(c.maxSeats || 12);
    c.remainingSeats = Math.max(0, cap - enrollments.filter(e => e.courseId === c.id).length);
    if (c.remainingSeats > 0 && c.isFull) c.isFull = false;
    changed = true;
  });
  if (changed) await window.NewGenDB.saveCourses(courses);
}

function cleanupEnrollmentRow(en) {
  const p = cleanupDateParts(en.createdAt);
  const course = en.isBundle ? `📦 ${en.bundleName || en.courseTitle || ''}` : (isCampaignEnrollment(en) ? '🎁 ติวฟรี' : (en.courseTitle || en.courseId || '-'));
  return { label: en.anonymized ? '(ลบข้อมูลส่วนตัวแล้ว)' : (en.studentName || '-'), sub: `${p ? p.day : 'ไม่มีวันที่'} • ${course}${en.isFromBundle ? ' (ใบย่อยของแพ็ค)' : ''} • ${getEnrollmentStatusLabel(en.status)}` };
}

function prepareCleanupEnrollments() {
  const anonymize = document.querySelector('input[name="cleanupEnrollAction"]:checked')?.value === 'anonymize';
  const matched = getCleanupEnrollmentMatches();
  const targets = anonymize ? matched.filter(e => !e.anonymized) : matched;
  if (targets.length === 0) {
    showToast('ไม่มีรายการที่ตรงเงื่อนไข', 'warning');
    return;
  }
  const images = targets.filter(e => getEnrollmentImageObject(e)).length;

  openCleanupConfirm({
    title: anonymize ? 'ยืนยันการลบข้อมูลส่วนตัวของนักเรียน' : 'ยืนยันการลบรายชื่อนักเรียน',
    summary: anonymize
      ? `จะลบข้อมูลส่วนตัวของใบสมัคร <b>${targets.length}</b> ใบ${images ? ` และรูปที่แนบ <b>${images}</b> รูป` : ''} (เก็บคอร์ส ชั้น โรงเรียน สถานะ ราคา วันที่ไว้สำหรับสถิติ)`
      : `จะลบใบสมัคร <b>${targets.length}</b> ใบ${images ? ` และรูปที่แนบ <b>${images}</b> รูป` : ''} ออกจาก Supabase อย่างถาวร`,
    warnings: targets.some(e => e.isFromBundle && !targets.some(t => t.id === e.parentEnrollId))
      ? ['บางรายการเป็นใบย่อยของแพ็คเกจ — ใบหลักของแพ็คเกจจะยังอยู่']
      : [],
    rows: targets.map(cleanupEnrollmentRow),
    buttonText: anonymize ? `ลบข้อมูลส่วนตัว ${targets.length} ใบ` : `ลบ ${targets.length} ใบ`,
    backup: { type: anonymize ? 'enrollments-anonymize' : 'enrollments-delete', enrollments: targets },
    run: async () => {
      const img = await deleteEnrollmentImages(targets);
      if (anonymize) {
        const now = new Date().toISOString();
        const cleaned = targets.map(en => {
          const copy = { ...en };
          CLEANUP_PERSONAL_FIELDS.forEach(f => { delete copy[f]; });
          return { ...copy, studentName: '(ลบข้อมูลส่วนตัวแล้ว)', hasAttachment: false, anonymized: true, anonymizedAt: now };
        });
        const res = await window.NewGenDB.saveEnrollments(cleaned);
        if (!res.success) throw new Error(res.error || 'บันทึกไม่สำเร็จ');
        return `ลบข้อมูลส่วนตัว ${cleaned.length} ใบ • ลบรูป ${img.deleted} รูป${img.errors.length ? ` (ลบรูปไม่สำเร็จ ${img.errors.length} ชุด)` : ''}`;
      }
      const res = await window.NewGenDB.deleteEnrollmentsByIds(targets.map(e => e.id));
      await recomputeSeatsForCourses(targets.map(e => e.courseId));
      if (res.errors.length) throw new Error(`ลบได้ ${res.deleted}/${targets.length} ใบ: ${res.errors[0]}`);
      return `ลบใบสมัคร ${res.deleted} ใบ • ลบรูป ${img.deleted} รูป${img.errors.length ? ` (ลบรูปไม่สำเร็จ ${img.errors.length} ชุด)` : ''}`;
    }
  });
}

/* ---------- 2) คอร์สเรียน & แพ็คเกจ ---------- */
function renderCleanupCoursesPanel() {
  const courses = window.NewGenDB.getCourses();
  const bundles = window.NewGenDB.getBundles();
  const enrollments = window.NewGenDB.getEnrollments();
  const countFor = id => enrollments.filter(e => e.courseId === id || (e.isBundle && (e.bundleId || e.courseId) === id)).length;
  const item = (name, id, title, extra) => `
    <label class="cleanup-check-item">
      <input type="checkbox" name="${name}" value="${escapeHtml(id)}" onchange="updateCleanupCount()">
      <span>${escapeHtml(title)}<small>${extra}</small></span>
    </label>`;

  return `
    <h3 class="cleanup-panel-title"><i class="fa-solid fa-graduation-cap"></i> ล้างคอร์สเรียน &amp; แพ็คเกจ</h3>
    <div class="cleanup-two-col">
      <div>
        <div class="cleanup-list-head"><b>คอร์สเรียน (${courses.length})</b>
          <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupCourse', true)">เลือกทั้งหมด</button>
          <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupCourse', false)">ล้างที่เลือก</button>
        </div>
        <div class="cleanup-check-list">
          ${courses.map(c => item('cleanupCourse', c.id, c.title, `${countFor(c.id)} ใบสมัคร${c.isHidden ? ' • ซ่อนอยู่' : ''}`)).join('') || '<div class="ana-empty">ไม่มีคอร์ส</div>'}
        </div>
      </div>
      <div>
        <div class="cleanup-list-head"><b>แพ็คเกจโปรโมชั่น (${bundles.length})</b>
          <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupBundle', true)">เลือกทั้งหมด</button>
          <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupBundle', false)">ล้างที่เลือก</button>
        </div>
        <div class="cleanup-check-list">
          ${bundles.map(b => item('cleanupBundle', b.id, b.name || b.id, `${(b.courseIds || []).length} คอร์ส • ${countFor(b.id)} ใบสมัคร`)).join('') || '<div class="ana-empty">ไม่มีแพ็คเกจ</div>'}
        </div>
      </div>
    </div>

    <label class="cleanup-radio" style="margin-top: 14px;">
      <input type="checkbox" id="cleanupCoursesWithEnrollments" onchange="updateCleanupCount()">
      <span><b>ลบรายชื่อนักเรียนของคอร์ส/แพ็คเกจที่เลือกด้วย</b><small>ถ้าไม่ติ๊ก รายชื่อยังอยู่และยังนับในหน้าสถิติ/รายได้ (ลบภายหลังได้ที่หัวข้อ "รายชื่อนักเรียน")</small></span>
    </label>

    <div class="cleanup-footer">
      <span id="cleanupCountText" class="cleanup-count"></span>
      <button type="button" class="btn-cleanup-danger" onclick="prepareCleanupCourses()"><i class="fa-solid fa-magnifying-glass"></i> ตรวจรายการก่อนล้าง</button>
    </div>
  `;
}

function toggleCleanupChecks(name, checked) {
  document.querySelectorAll(`#cleanupPanel input[name="${name}"]`).forEach(cb => { cb.checked = checked; });
  updateCleanupCount();
}

function prepareCleanupCourses() {
  const courseIds = new Set([...document.querySelectorAll('#cleanupPanel input[name="cleanupCourse"]:checked')].map(cb => cb.value));
  const bundleIds = new Set([...document.querySelectorAll('#cleanupPanel input[name="cleanupBundle"]:checked')].map(cb => cb.value));
  const withEnrollments = document.getElementById('cleanupCoursesWithEnrollments')?.checked;
  if (courseIds.size === 0 && bundleIds.size === 0) {
    showToast('กรุณาเลือกคอร์สหรือแพ็คเกจที่ต้องการล้าง', 'warning');
    return;
  }

  const courses = window.NewGenDB.getCourses();
  const bundles = window.NewGenDB.getBundles();
  const removedCourses = courses.filter(c => courseIds.has(c.id));
  const removedBundles = bundles.filter(b => bundleIds.has(b.id));
  const keptBundles = bundles.filter(b => !bundleIds.has(b.id)).map(b => ({ ...b, courseIds: (b.courseIds || []).filter(id => !courseIds.has(id)) }));
  const touchedBundles = keptBundles.filter((b, i) => b.courseIds.length !== (bundles.filter(x => !bundleIds.has(x.id))[i].courseIds || []).length);
  const warnings = touchedBundles.map(b => `แพ็คเกจ "${b.name}" จะถูกเอาคอร์สที่ลบออก และเหลือ ${b.courseIds.length} คอร์ส${b.courseIds.length < 2 ? ' ⚠️ น้อยกว่า 2 คอร์ส — ควรติ๊กลบแพ็คนี้ด้วย หรือแก้ไขแพ็คภายหลัง' : ''}`);

  const all = window.NewGenDB.getEnrollments();
  let enrollTargets = [];
  if (withEnrollments) {
    const ids = new Set();
    all.forEach(e => {
      if (courseIds.has(e.courseId) || (e.isBundle && bundleIds.has(e.bundleId || e.courseId))) ids.add(e.id);
    });
    all.forEach(e => { if (e.parentEnrollId && ids.has(e.parentEnrollId)) ids.add(e.id); });
    enrollTargets = all.filter(e => ids.has(e.id));
  }

  const rows = [
    ...removedCourses.map(c => ({ label: `📚 ${c.title}`, sub: 'คอร์สเรียน' })),
    ...removedBundles.map(b => ({ label: `📦 ${b.name}`, sub: 'แพ็คเกจ' })),
    ...enrollTargets.map(cleanupEnrollmentRow)
  ];

  openCleanupConfirm({
    title: 'ยืนยันการลบคอร์ส / แพ็คเกจ',
    summary: `จะลบคอร์ส <b>${removedCourses.length}</b> รายการ และแพ็คเกจ <b>${removedBundles.length}</b> รายการ${withEnrollments ? ` พร้อมใบสมัคร <b>${enrollTargets.length}</b> ใบ` : ' (รายชื่อนักเรียนยังเก็บไว้)'}`,
    warnings,
    rows,
    buttonText: 'ลบคอร์ส / แพ็คเกจ',
    backup: { type: 'courses', courses: removedCourses, bundles: removedBundles, bundlesBefore: bundles, enrollments: enrollTargets },
    run: async () => {
      const results = [];
      if (removedCourses.length) {
        const r = await window.NewGenDB.saveCourses(courses.filter(c => !courseIds.has(c.id)));
        if (r && r.success === false) throw new Error(r.error || 'บันทึกคอร์สไม่สำเร็จ');
        results.push(`ลบคอร์ส ${removedCourses.length}`);
      }
      if (removedBundles.length || touchedBundles.length) {
        const r = await window.NewGenDB.saveBundles(keptBundles);
        if (r && r.success === false) throw new Error(r.error || 'บันทึกแพ็คเกจไม่สำเร็จ');
        if (removedBundles.length) results.push(`ลบแพ็คเกจ ${removedBundles.length}`);
        if (touchedBundles.length) results.push(`ปรับแพ็คเกจ ${touchedBundles.length}`);
      }
      if (enrollTargets.length) {
        const img = await deleteEnrollmentImages(enrollTargets);
        const r = await window.NewGenDB.deleteEnrollmentsByIds(enrollTargets.map(e => e.id));
        results.push(`ลบใบสมัคร ${r.deleted} • รูป ${img.deleted}`);
        if (r.errors.length) throw new Error(`${results.join(' • ')} — ลบใบสมัครไม่ครบ: ${r.errors[0]}`);
      }
      return results.join(' • ');
    }
  });
}

/* ---------- 3) เนื้อหาอื่น ๆ ---------- */
function renderCleanupContentPanel() {
  const type = cleanupVal('cleanupContentType') || 'reviews';
  const def = CLEANUP_CONTENT_TYPES[type];
  const list = def.get();
  return `
    <h3 class="cleanup-panel-title"><i class="fa-solid fa-photo-film"></i> ล้างเนื้อหาอื่น ๆ บนเว็บ</h3>
    <div class="form-group-luxury" style="max-width: 320px;">
      <label>หมวด</label>
      <select id="cleanupContentType" onchange="renderCleanupPanel()">
        ${Object.entries(CLEANUP_CONTENT_TYPES).map(([k, d]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${d.label} (${d.get().length})</option>`).join('')}
      </select>
    </div>
    <div class="cleanup-list-head"><b>${def.label} (${list.length})</b>
      <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupContentItem', true)">เลือกทั้งหมด</button>
      <button type="button" class="cleanup-link" onclick="toggleCleanupChecks('cleanupContentItem', false)">ล้างที่เลือก</button>
    </div>
    <div class="cleanup-check-list">
      ${list.map((it, i) => `
        <label class="cleanup-check-item">
          <input type="checkbox" name="cleanupContentItem" value="${i}" onchange="updateCleanupCount()">
          <span>${escapeHtml(def.name(it))}</span>
        </label>`).join('') || '<div class="ana-empty">ไม่มีรายการ</div>'}
    </div>
    <div class="cleanup-footer">
      <span id="cleanupCountText" class="cleanup-count"></span>
      <button type="button" class="btn-cleanup-danger" onclick="prepareCleanupContent()"><i class="fa-solid fa-magnifying-glass"></i> ตรวจรายการก่อนล้าง</button>
    </div>
  `;
}

function prepareCleanupContent() {
  const type = cleanupVal('cleanupContentType') || 'reviews';
  const def = CLEANUP_CONTENT_TYPES[type];
  const list = def.get();
  const picked = new Set([...document.querySelectorAll('#cleanupPanel input[name="cleanupContentItem"]:checked')].map(cb => Number(cb.value)));
  if (picked.size === 0) {
    showToast('กรุณาเลือกรายการที่ต้องการล้าง', 'warning');
    return;
  }
  const removed = list.filter((_, i) => picked.has(i));
  const kept = list.filter((_, i) => !picked.has(i));
  openCleanupConfirm({
    title: `ยืนยันการลบ${def.label}`,
    summary: `จะลบ${def.label} <b>${removed.length}</b> รายการ (เหลือ ${kept.length} รายการ)`,
    warnings: kept.length === 0 ? [`หมวด${def.label}จะว่างเปล่า และส่วนนี้บนหน้าเว็บจะไม่มีข้อมูลแสดง`] : [],
    rows: removed.map(it => ({ label: def.name(it), sub: def.label })),
    buttonText: `ลบ ${removed.length} รายการ`,
    backup: { type: `content-${type}`, removed, before: list },
    run: async () => {
      const r = await def.save(kept);
      if (r && r.success === false) throw new Error(r.error || 'บันทึกไม่สำเร็จ');
      return `ลบ${def.label} ${removed.length} รายการ`;
    }
  });
}

/* ---------- 4) ข้อมูลขยะของระบบ ---------- */
function renderCleanupJunkPanel() {
  const s = _cleanupJunkScan;
  const fmtSize = b => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  let body = '<p class="cleanup-hint">กด "สแกนหาข้อมูลขยะ" เพื่อค้นหาสำเนาข้อมูลเก่า แถวทดสอบ และรูปที่ไม่มีอะไรใช้แล้ว</p>';
  if (s) {
    const group = (title, items, note) => `
      <div class="cleanup-list-head"><b>${title} (${items.length})</b>${items.length ? `
        <button type="button" class="cleanup-link" onclick="toggleCleanupJunkGroup('${items[0]?.group}', true)">เลือกทั้งหมด</button>
        <button type="button" class="cleanup-link" onclick="toggleCleanupJunkGroup('${items[0]?.group}', false)">ล้างที่เลือก</button>` : ''}
      </div>
      ${note ? `<p class="cleanup-hint">${note}</p>` : ''}
      <div class="cleanup-check-list">
        ${items.map((it, i) => `
          <label class="cleanup-check-item">
            <input type="checkbox" name="cleanupJunk" data-group="${it.group}" value="${s.items.indexOf(it)}" ${it.defaultChecked ? 'checked' : ''} onchange="updateCleanupCount()">
            ${it.thumb ? `<img src="${escapeHtml(it.thumb)}" alt="" class="cleanup-thumb" loading="lazy">` : ''}
            <span>${escapeHtml(it.label)}<small>${escapeHtml(it.sub || '')}${it.size ? ` • ${fmtSize(it.size)}` : ''}</small></span>
          </label>`).join('') || '<div class="ana-empty">ไม่พบ</div>'}
      </div>`;
    body = `
      ${s.errors.length ? `<div class="cleanup-warn">${s.errors.map(escapeHtml).join('<br>')}</div>` : ''}
      ${group('แถวข้อมูลที่หน้าเว็บไม่ได้ใช้', s.items.filter(i => i.group === 'rows'), 'เช่น สำเนารายชื่อนักเรียนรุ่นเก่า (enrollments_legacy_backup) และแถวทดสอบ')}
      ${group('รูปที่นักเรียนแนบ แต่ไม่มีใบสมัครผูกอยู่แล้ว', s.items.filter(i => i.group === 'student'), 'เกิดจากใบสมัครที่ถูกลบไปแล้ว หรืออัปโหลดรูปแล้วส่งใบสมัครไม่สำเร็จ')}
      ${group('รูปของเว็บที่ไม่พบว่าใช้ที่ไหน', s.items.filter(i => i.group === 'site'), '⚠️ ไม่ได้เลือกไว้ให้ — ดูรูปตัวอย่างก่อนติ๊ก ถ้ารูปไหนยังใช้อยู่ (เช่น แชร์ลิงก์ไว้ที่อื่น) อย่าลบ รูปไม่ถูกรวมในไฟล์สำรอง')}
    `;
  }
  return `
    <h3 class="cleanup-panel-title"><i class="fa-solid fa-trash-can"></i> ล้างข้อมูลขยะของระบบ</h3>
    <button type="button" class="btn-secondary" onclick="scanCleanupJunk()" id="btnCleanupScan"><i class="fa-solid fa-binoculars"></i> สแกนหาข้อมูลขยะ</button>
    <div style="margin-top: 14px;">${body}</div>
    <div class="cleanup-footer">
      <span id="cleanupCountText" class="cleanup-count"></span>
      <button type="button" class="btn-cleanup-danger" onclick="prepareCleanupJunk()" ${s ? '' : 'disabled'}><i class="fa-solid fa-magnifying-glass"></i> ตรวจรายการก่อนล้าง</button>
    </div>
  `;
}

function toggleCleanupJunkGroup(group, checked) {
  document.querySelectorAll(`#cleanupPanel input[name="cleanupJunk"][data-group="${group}"]`).forEach(cb => { cb.checked = checked; });
  updateCleanupCount();
}

async function scanCleanupJunk() {
  const btn = document.getElementById('btnCleanupScan');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสแกน...'; }
  const items = [];
  const errors = [];
  const knownKeys = new Set(['courses', 'tutors', 'tutorsQuote', 'reviews', 'achievements', 'videos', 'contact', 'whyus', 'categories', 'privilege', 'home', 'about', 'enrollmentConfig', 'popupCampaign', 'bundles', 'admin_ping']);
  let rows = [];
  try {
    rows = await window.NewGenDB.fetchAllAppDataRows();
    rows.filter(r => !knownKeys.has(r.key)).forEach(r => items.push({
      group: 'rows', kind: 'row', key: r.key, data: r.data, defaultChecked: true,
      label: r.key === 'enrollments_legacy_backup' ? 'สำเนารายชื่อนักเรียนรุ่นเก่า (enrollments_legacy_backup)' : r.key,
      sub: `${Array.isArray(r.data) ? `${r.data.length} รายการ • ` : ''}อัปเดต ${r.updated_at ? new Date(r.updated_at).toLocaleDateString('th-TH') : '-'}`
    }));
  } catch (e) { errors.push(`อ่านตาราง app_data ไม่สำเร็จ: ${e.message}`); }

  // รูปนักเรียนในที่เก็บส่วนตัว ที่ไม่มีใบสมัครไหนอ้างถึง
  await window.NewGenDB.fetchEnrollments();
  const enrollments = window.NewGenDB.getEnrollments();
  const usedStudent = new Set(enrollments.map(getEnrollmentImageObject).filter(o => o && o.bucket === 'student-uploads').map(o => o.path));
  try {
    const files = await window.NewGenDB.listStorageFiles('student-uploads');
    files.filter(f => !usedStudent.has(f.name)).forEach(f => items.push({
      group: 'student', kind: 'file', bucket: 'student-uploads', path: f.name, defaultChecked: true,
      label: f.name, sub: `อัปโหลด ${f.created_at ? new Date(f.created_at).toLocaleDateString('th-TH') : '-'}`, size: f.metadata?.size || 0
    }));
  } catch (e) { errors.push(`อ่านรูปนักเรียนไม่สำเร็จ: ${e.message}`); }

  // รูปของเว็บ (bucket uploads) ที่ไม่พบชื่อไฟล์ในข้อมูลเว็บ ใบสมัคร หรือไฟล์โค้ดของเว็บ
  try {
    const files = await window.NewGenDB.listStorageFiles('uploads');
    const codeFiles = ['assets/js/courses-data.js', 'assets/js/main.js', 'assets/js/course-detail.js', 'assets/js/enrollment-modal.js', 'assets/css/style.css',
      'index.html', 'courses.html', 'course-detail.html', 'tutors.html', 'about.html', 'reviews.html', 'free-trial.html', 'contact.html'];
    const codeTexts = await Promise.all(codeFiles.map(f => fetch(f, { cache: 'no-store' }).then(r => (r.ok ? r.text() : '')).catch(() => '')));
    const haystack = JSON.stringify(rows) + JSON.stringify(enrollments) + codeTexts.join('\n');
    if (codeTexts.every(t => !t)) throw new Error('อ่านไฟล์ของเว็บไม่ได้ จึงข้ามการตรวจรูปของเว็บเพื่อความปลอดภัย');
    files.filter(f => !haystack.includes(f.name)).forEach(f => items.push({
      group: 'site', kind: 'file', bucket: 'uploads', path: f.name, defaultChecked: false,
      thumb: `${window.SUPABASE_CONFIG.url}/storage/v1/object/public/uploads/${encodeURIComponent(f.name)}`,
      label: f.name, sub: `อัปโหลด ${f.created_at ? new Date(f.created_at).toLocaleDateString('th-TH') : '-'}`, size: f.metadata?.size || 0
    }));
  } catch (e) { errors.push(`ตรวจรูปของเว็บไม่สำเร็จ: ${e.message}`); }

  _cleanupJunkScan = { items, errors };
  renderCleanupPanel();
}

function prepareCleanupJunk() {
  const s = _cleanupJunkScan;
  if (!s) return;
  const picked = [...document.querySelectorAll('#cleanupPanel input[name="cleanupJunk"]:checked')].map(cb => s.items[Number(cb.value)]).filter(Boolean);
  if (picked.length === 0) {
    showToast('กรุณาเลือกรายการที่ต้องการล้าง', 'warning');
    return;
  }
  const rowsPicked = picked.filter(i => i.kind === 'row');
  const filesPicked = picked.filter(i => i.kind === 'file');
  openCleanupConfirm({
    title: 'ยืนยันการล้างข้อมูลขยะ',
    summary: `จะลบแถวข้อมูล <b>${rowsPicked.length}</b> แถว และไฟล์รูป <b>${filesPicked.length}</b> ไฟล์`,
    warnings: filesPicked.some(f => f.group === 'site') ? ['มีรูปของเว็บอยู่ในรายการ — รูปจะหายถาวรและไม่อยู่ในไฟล์สำรอง ตรวจให้แน่ใจว่าไม่ได้ใช้แล้ว'] : [],
    rows: picked.map(i => ({ label: i.label, sub: i.kind === 'row' ? 'แถวข้อมูล' : `ไฟล์ใน ${i.bucket}` })),
    buttonText: `ลบ ${picked.length} รายการ`,
    backup: { type: 'junk', rows: rowsPicked.map(r => ({ key: r.key, data: r.data })), files: filesPicked.map(f => `${f.bucket}/${f.path}`) },
    run: async () => {
      const results = [];
      const errs = [];
      if (rowsPicked.length) {
        const r = await window.NewGenDB.deleteAppDataKeys(rowsPicked.map(i => i.key));
        results.push(`ลบแถว ${r.deleted}`);
        errs.push(...r.errors);
      }
      const byBucket = {};
      filesPicked.forEach(f => { (byBucket[f.bucket] = byBucket[f.bucket] || []).push(f.path); });
      for (const [bucket, paths] of Object.entries(byBucket)) {
        const r = await window.NewGenDB.deleteStorageFiles(bucket, paths);
        results.push(`ลบรูป (${bucket}) ${r.deleted}`);
        errs.push(...r.errors);
      }
      _cleanupJunkScan = null;
      if (errs.length) throw new Error(`${results.join(' • ')} — ผิดพลาด: ${errs[0]}`);
      return results.join(' • ');
    }
  });
}

/* ---------- ยืนยัน & ดำเนินการ ---------- */
function openCleanupConfirm(plan) {
  _cleanupPlan = plan;
  document.getElementById('cleanupConfirmTitle').textContent = plan.title;
  document.getElementById('cleanupConfirmSummary').innerHTML = plan.summary;
  document.getElementById('cleanupConfirmWarnings').innerHTML = plan.warnings.map(w => `<div class="cleanup-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(w)}</div>`).join('');
  const shown = plan.rows.slice(0, 200);
  document.getElementById('cleanupConfirmList').innerHTML = shown.map(r => `
    <div class="cleanup-preview-row"><b>${escapeHtml(r.label)}</b><small>${escapeHtml(r.sub || '')}</small></div>`).join('')
    + (plan.rows.length > shown.length ? `<div class="cleanup-preview-row"><small>…และอีก ${plan.rows.length - shown.length} รายการ (มีครบในไฟล์สำรอง)</small></div>` : '');
  document.getElementById('cleanupConfirmBtnText').textContent = plan.buttonText;
  document.getElementById('cleanupConfirmWord').value = '';
  document.getElementById('cleanupConfirmPassword').value = '';
  openModal('modalCleanupConfirm');
}

function downloadJsonFile(fileName, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}

async function executeCleanup() {
  const plan = _cleanupPlan;
  if (!plan) return;
  if (cleanupVal('cleanupConfirmWord') !== 'ลบ') {
    showToast('⚠️ กรุณาพิมพ์คำว่า "ลบ" เพื่อยืนยัน', 'warning');
    return;
  }
  const password = document.getElementById('cleanupConfirmPassword').value;
  if (!password) {
    showToast('⚠️ กรุณาใส่รหัสผ่านแอดมิน', 'warning');
    return;
  }

  const btn = document.getElementById('btnCleanupExecute');
  const btnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบรหัสผ่าน...';
  try {
    const session = window.NewGenAuth.getSession();
    try {
      await window.NewGenAuth.signIn(session ? session.email : '', password);
    } catch (e) {
      showToast('❌ รหัสผ่านไม่ถูกต้อง', 'error');
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadJsonFile(`the-new-gen-ก่อนล้าง-${plan.backup.type}-${stamp}.json`, { ...plan.backup, backedUpAt: new Date().toISOString() });

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังล้างข้อมูล...';
    const result = await plan.run();

    closeModal('modalCleanupConfirm');
    _cleanupPlan = null;
    showToast(`✅ ล้างข้อมูลเรียบร้อย: ${result}`, 'success');
  } catch (err) {
    console.error('Cleanup failed:', err);
    showToast(`❌ ล้างข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnHtml;
    // โหลดข้อมูลล่าสุดจาก Supabase เสมอ (แม้ล้างได้ไม่ครบ) ให้หน้าจอตรงกับข้อมูลจริง
    try {
      await window.NewGenDB.fetchEnrollments();
      await window.NewGenDB.syncFromSupabase();
    } catch (e) {}
    initAdminDashboard();
    renderCleanupPanel();
  }
}

window.selectCleanupCategory = selectCleanupCategory;
window.renderCleanupPanel = renderCleanupPanel;
window.updateCleanupCount = updateCleanupCount;
window.updateCleanupEnrollmentRangeInputs = updateCleanupEnrollmentRangeInputs;
window.prepareCleanupEnrollments = prepareCleanupEnrollments;
window.prepareCleanupCourses = prepareCleanupCourses;
window.prepareCleanupContent = prepareCleanupContent;
window.prepareCleanupJunk = prepareCleanupJunk;
window.toggleCleanupChecks = toggleCleanupChecks;
window.toggleCleanupJunkGroup = toggleCleanupJunkGroup;
window.scanCleanupJunk = scanCleanupJunk;
window.executeCleanup = executeCleanup;


