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
  loadAdminCourses();
  loadPrivilegeBanner();
  loadHomeSettings();
  loadAdminTutors();
  loadTutorsQuote();
  loadAboutSettings();
  loadAdminReviews();
  loadAdminAchievements();
  loadAdminVideos();
  loadAdminContact();
  loadAdminWhyUs();
  loadSecuritySettings();
  checkSupabaseConnection(false);
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
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  
  const pane = document.getElementById(`tab-${tabKey}`);
  if (pane) pane.classList.add('active');
  if (btn) {
    btn.classList.add('active');
  } else {
    const navBtn = document.querySelector(`.admin-nav-item[onclick*="'${tabKey}'"]`);
    if (navBtn) navBtn.classList.add('active');
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

  tbody.innerHTML = courses.map((c, i) => `
    <tr>
      <td>
        <img src="${c.cover || c.poster}" alt="${c.title}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-light);">
      </td>
      <td><strong>${c.title}</strong></td>
      <td><span class="badge ${c.category === 'primary' ? 'badge-primary-level' : 'badge-secondary-level'}">${c.categoryLabel || c.category}</span></td>
      <td><small>${c.subjects}</small></td>
      <td style="color: var(--color-gold); font-weight: 800; font-family: var(--font-en); font-size: 1.1rem;">${c.pricePromo}.-</td>
      <td style="text-align: center;">
        <button type="button" 
          class="btn-featured-toggle ${c.isFeatured !== false ? 'active' : ''}" 
          onclick="toggleCourseFeatured('${c.id}')"
          title="คลิกเพื่อสลับสถานะ: แสดงในคอร์สเรียนแนะนำบนหน้าแรก">
          ${c.isFeatured !== false ? '⭐ แนะนำ' : '⚪ ไม่แสดง'}
        </button>
      </td>
      <td><span class="badge ${c.statusClass}">${c.statusBadge}</span></td>
      <td style="text-align: right;">
        <button type="button" class="btn-action-edit" onclick="openEditCourseModal('${c.id}')" title="แก้ไข">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" class="btn-action-del" onclick="deleteCourse('${c.id}')" title="ลบ">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
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
  document.getElementById('cPriceUnit').value = 'บาท / เทอม (แบ่งชำระได้)';
  document.getElementById('cTotalHours').value = '42 ชั่วโมง (รายเทอม) / 20 ชม. (รายเดือน)';
  document.getElementById('cImgUrl').value = 'assets/images/course-poster-primary.jpg';
  document.getElementById('cImgPreview').src = 'assets/images/course-poster-primary.jpg';
  document.getElementById('cShortDesc').value = '';
  if (document.getElementById('cTargetAudience')) document.getElementById('cTargetAudience').value = '';
  if (document.getElementById('cBenefits')) document.getElementById('cBenefits').value = '';
  if (document.getElementById('cIsFeatured')) document.getElementById('cIsFeatured').checked = true;

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

function openEditCourseModal(id) {
  const courses = window.NewGenDB.getCourses();
  const c = courses.find(item => item.id === id);
  if (!c) return;

  document.getElementById('modalCourseTitle').textContent = 'แก้ไขคอร์สเรียน';
  document.getElementById('courseEditId').value = c.id;
  document.getElementById('cTitle').value = c.title;
  populateCategoryDropdown(c.category);
  document.getElementById('cSubjects').value = c.subjects;
  document.getElementById('cStatus').value = `${c.statusBadge}|${c.statusClass}`;
  document.getElementById('cPriceOld').value = c.priceOriginal || '';
  document.getElementById('cPricePromo').value = c.pricePromo || '';
  document.getElementById('cPriceUnit').value = c.priceUnit || '';
  document.getElementById('cTotalHours').value = c.totalHours || '';
  document.getElementById('cImgUrl').value = c.cover || c.poster;
  document.getElementById('cImgPreview').src = c.cover || c.poster;
  document.getElementById('cShortDesc').value = c.shortDesc || '';
  if (document.getElementById('cTargetAudience')) document.getElementById('cTargetAudience').value = c.targetAudience || '';
  if (document.getElementById('cBenefits')) document.getElementById('cBenefits').value = c.benefits || '';
  if (document.getElementById('cIsFeatured')) document.getElementById('cIsFeatured').checked = c.isFeatured !== false;

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
  const selectedCat = document.getElementById('cCategory').value;
  const matchedCatObj = categories.find(cat => cat.id === selectedCat);

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
    totalHours: document.getElementById('cTotalHours').value.trim(),
    shortDesc: document.getElementById('cShortDesc').value.trim(),
    isFeatured: isFeatured,
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
      <td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${cat.id}</code></td>
      <td><strong>${cat.name}</strong></td>
      <td style="text-align: right;">
        <button type="button" class="btn-table-action delete" title="ลบระดับชั้นนี้" onclick="deleteCategory('${cat.id}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
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
    showToast('✅ บันทึกการตั้งค่าหน้าแรก & ตำแหน่งติวเตอร์ และซิงค์ Cloud เรียบร้อยแล้ว!', 'success');
  } else {
    showToast(`⚠️ บันทึกหน้าแรกในเครื่องแล้ว (${cloudRes && cloudRes.error ? cloudRes.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

/* ===================================================================
   TUTORS MANAGEMENT & REORDERING
   =================================================================== */
function loadAdminTutors() {
  const tutors = window.NewGenDB.getTutors();
  const tbody = document.getElementById('adminTutorsTableBody');
  if (!tbody) return;

  tbody.innerHTML = tutors.map((t, idx) => `
    <tr>
      <td style="text-align: center;">
        <span class="tutor-order-badge">${idx + 1}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: inline-flex; gap: 4px;">
          <button type="button" class="btn-reorder" onclick="moveTutorUp(${idx})" title="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-reorder" onclick="moveTutorDown(${idx})" title="เลื่อนลง" ${idx === tutors.length - 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </div>
      </td>
      <td>
        <img src="${t.image}" alt="${escapeHtml(t.name)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-light);">
      </td>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td><span style="color: var(--color-blue-accent); font-weight: 700;">${escapeHtml(t.honor)}</span><br><small style="color: var(--text-muted);">${escapeHtml(t.degree)}</small></td>
      <td>${escapeHtml(t.subjects)}</td>
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

  // Update dropdown options in Home tab
  populateHeroTutorDropdowns();
}

function moveTutorUp(idx) {
  const tutors = window.NewGenDB.getTutors();
  if (idx <= 0 || idx >= tutors.length) return;
  const temp = tutors[idx];
  tutors[idx] = tutors[idx - 1];
  tutors[idx - 1] = temp;
  saveAndSyncTutorsOrder(tutors, `เลื่อน "${temp.name}" ขึ้นเป็นลำดับที่ ${idx} สำเร็จแล้ว!`);
}

function moveTutorDown(idx) {
  const tutors = window.NewGenDB.getTutors();
  if (idx < 0 || idx >= tutors.length - 1) return;
  const temp = tutors[idx];
  tutors[idx] = tutors[idx + 1];
  tutors[idx + 1] = temp;
  saveAndSyncTutorsOrder(tutors, `เลื่อน "${temp.name}" ลงเป็นลำดับที่ ${idx + 2} สำเร็จแล้ว!`);
}

async function saveAndSyncTutorsOrder(tutors, successMsg) {
  // 1. บันทึกลำดับติวเตอร์ขึ้น Cloud
  const resTutors = await window.NewGenDB.saveTutors(tutors);

  // 2. ซิงค์ตำแหน่งติวเตอร์ 3 คนแรกในหน้าแรกให้ตรงตามลำดับทันที
  const home = window.NewGenDB.getHome();
  if (tutors[0]) home.heroTutorLeftId = tutors[0].id;
  if (tutors[1]) home.heroTutorCenterId = tutors[1].id;
  if (tutors[2]) home.heroTutorRightId = tutors[2].id;
  window.NewGenDB.saveHome(home);
  const resHome = await window.NewGenDB.saveToSupabase('home', home);

  // 3. ซิงค์กับ Backend API (ถ้ามีรัน server.js)
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
    showToast(`✅ ${successMsg || 'บันทึกลำดับติวเตอร์และซิงค์ Cloud สำเร็จ!'} (หน้าแรกและหน้าทีมติวเตอร์อัปเดตตรงกันแล้ว)`, 'success');
  } else {
    showToast(`⚠️ บันทึกในเครื่องแล้ว (${resTutors && resTutors.error ? resTutors.error : 'รอปลดล็อก Supabase RLS'})`, 'warning');
  }
}

function openAddTutorModal() {
  document.getElementById('modalTutorTitle').textContent = 'เพิ่มติวเตอร์ใหม่';
  document.getElementById('tutorEditId').value = '';
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
  document.getElementById('tName').value = t.name;
  document.getElementById('tHonor').value = t.honor;
  document.getElementById('tDegree').value = t.degree || '';
  document.getElementById('tSubjects').value = t.subjects || '';
  document.getElementById('tHeroBadge').value = t.heroBadge || t.badge || '';
  document.getElementById('tImgUrl').value = t.image;
  document.getElementById('tImgPreview').src = t.image;
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
    // Update image if server processed base64 upload
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

  // Sync fresh data from Backend API
  const apiUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '') + '/api/about';
  fetch(apiUrl)
    .then(res => res.json())
    .then(serverAbout => {
      if (serverAbout && (serverAbout.title || serverAbout.mainImage)) {
        window.NewGenDB.saveAbout(serverAbout);
        populateAboutFields(serverAbout);
      }
    })
    .catch(() => {});
}

function populateAboutFields(about) {
  if (!about) return;
  const badgeInput = document.getElementById('aboutBadge');
  const titleInput = document.getElementById('aboutTitle');
  const subtitleInput = document.getElementById('aboutSubtitle');
  const mainImgInput = document.getElementById('aboutMainImgUrl');
  const mainImgPrev = document.getElementById('aboutMainImgPreview');
  const parasInput = document.getElementById('aboutParagraphs');

  if (badgeInput) badgeInput.value = about.badge || 'OUR INSPIRATION & STORY';
  if (titleInput) titleInput.value = about.title || 'แรงบันดาลใจในการเป็น The NEW GEN';
  if (subtitleInput) subtitleInput.value = about.subtitle || '';
  if (mainImgInput) mainImgInput.value = about.mainImage || 'assets/images/course-poster-primary.jpg';
  if (mainImgPrev) {
    const resolved = window.resolveMediaUrl ? window.resolveMediaUrl(about.mainImage) : about.mainImage;
    mainImgPrev.src = resolved || 'assets/images/course-poster-primary.jpg';
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
    badge: document.getElementById('aboutBadge')?.value.trim() || 'OUR INSPIRATION & STORY',
    title: document.getElementById('aboutTitle')?.value.trim() || 'แรงบันดาลใจในการเป็น The NEW GEN',
    subtitle: document.getElementById('aboutSubtitle')?.value.trim() || '',
    mainImage: document.getElementById('aboutMainImgUrl')?.value.trim() || 'assets/images/course-poster-primary.jpg',
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

  tbody.innerHTML = achievements.map(a => `
    <tr>
      <td>
        <img src="${a.image}" alt="${a.title}" style="width: 70px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-light);">
      </td>
      <td><strong>${a.title}</strong></td>
      <td><span class="badge badge-primary-level">${a.date || 'ความสำเร็จ'}</span></td>
      <td><small style="color: var(--text-muted);">${a.description || '-'}</small></td>
      <td style="text-align: right;">
        <button type="button" class="btn-action-edit" onclick="openEditAchievementModal('${a.id}')" title="แก้ไข">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" class="btn-action-del" onclick="deleteAchievement('${a.id}')" title="ลบ">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddAchievementModal() {
  document.getElementById('modalAchievementTitle').textContent = 'เพิ่มโปสเตอร์ความสำเร็จ';
  document.getElementById('achEditId').value = '';
  document.getElementById('achTitle').value = '';
  document.getElementById('achDate').value = '';
  document.getElementById('achImgUrl').value = 'assets/images/course-poster-exam.jpg';
  document.getElementById('achImgPreview').src = 'assets/images/course-poster-exam.jpg';
  document.getElementById('achDesc').value = '';
  document.getElementById('modalAchievement').classList.add('active');
}

function openEditAchievementModal(id) {
  const achievements = window.NewGenDB.getAchievements();
  const a = achievements.find(item => item.id === id);
  if (!a) return;

  document.getElementById('modalAchievementTitle').textContent = 'แก้ไขโปสเตอร์ความสำเร็จ';
  document.getElementById('achEditId').value = a.id;
  document.getElementById('achTitle').value = a.title;
  document.getElementById('achDate').value = a.date || '';
  document.getElementById('achImgUrl').value = a.image;
  document.getElementById('achImgPreview').src = a.image;
  document.getElementById('achDesc').value = a.description || '';
  document.getElementById('modalAchievement').classList.add('active');
}

async function handleSaveAchievement(e) {
  e.preventDefault();
  const id = document.getElementById('achEditId').value.trim();
  const achievements = window.NewGenDB.getAchievements();

  const achObj = {
    id: id || `ach-${Date.now()}`,
    title: document.getElementById('achTitle').value.trim(),
    date: document.getElementById('achDate').value.trim(),
    image: document.getElementById('achImgUrl').value.trim() || 'assets/images/course-poster-exam.jpg',
    description: document.getElementById('achDesc').value.trim()
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
      if (Array.isArray(serverVideos) && serverVideos.length > 0) {
        window.NewGenDB.saveVideos(serverVideos);
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

  document.getElementById('editContactLineId').value = contact.lineId || '';
  document.getElementById('editContactLineUrl').value = contact.lineUrl || 'https://line.me/R/ti/p/~thenewgen';
  document.getElementById('editContactFbName').value = contact.facebookName || '';
  document.getElementById('editContactFbUrl').value = contact.facebookUrl || 'https://www.facebook.com';
  document.getElementById('editContactTiktok').value = contact.tiktok || '';
  if (document.getElementById('editContactTiktokUrl')) {
    document.getElementById('editContactTiktokUrl').value = contact.tiktokUrl || (contact.tiktok ? `https://www.tiktok.com/${contact.tiktok}` : 'https://www.tiktok.com/@thenewgen');
  }
  document.getElementById('editContactIg').value = contact.instagram || '';
  if (document.getElementById('editContactIgUrl')) {
    document.getElementById('editContactIgUrl').value = contact.instagramUrl || 'https://www.instagram.com';
  }
  if (document.getElementById('editContactYtUrl')) {
    document.getElementById('editContactYtUrl').value = contact.youtubeUrl || 'https://www.youtube.com';
  }
  document.getElementById('editContactAddress').value = contact.address || '';
  document.getElementById('editContactMapUrl').value = contact.mapEmbedUrl || '';
  if (document.getElementById('editContactMapAppUrl')) {
    document.getElementById('editContactMapAppUrl').value = contact.mapAppUrl || '';
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

  const tiktokVal = document.getElementById('editContactTiktok').value.trim();
  const tiktokUrlVal = document.getElementById('editContactTiktokUrl') ? document.getElementById('editContactTiktokUrl').value.trim() : '';
  const igVal = document.getElementById('editContactIg').value.trim();
  const igUrlVal = document.getElementById('editContactIgUrl') ? document.getElementById('editContactIgUrl').value.trim() : '';
  const ytUrlVal = document.getElementById('editContactYtUrl') ? document.getElementById('editContactYtUrl').value.trim() : '';
  const mapAppUrlVal = document.getElementById('editContactMapAppUrl') ? document.getElementById('editContactMapAppUrl').value.trim() : '';

  const contact = {
    phones: phones.length > 0 ? phones : [
      { name: 'พี่อู๋', number: '095-4721072', telLink: 'tel:0954721072' },
      { name: 'พี่นนท์', number: '098-5322791', telLink: 'tel:0985322791' }
    ],
    lineId: document.getElementById('editContactLineId').value.trim() || '@thenewgen',
    lineUrl: document.getElementById('editContactLineUrl').value.trim() || 'https://line.me/R/ti/p/~thenewgen',
    facebookName: document.getElementById('editContactFbName').value.trim() || 'สถาบันกวดวิชา The NEW GEN',
    facebookUrl: document.getElementById('editContactFbUrl').value.trim() || 'https://www.facebook.com',
    tiktok: tiktokVal || '@thenewgen (thenewgen)',
    tiktokUrl: tiktokUrlVal || (tiktokVal ? (tiktokVal.startsWith('http') ? tiktokVal : `https://www.tiktok.com/${tiktokVal.startsWith('@') ? tiktokVal : '@' + tiktokVal}`) : 'https://www.tiktok.com/@thenewgen'),
    instagram: igVal || 'the.newgen (@the._newgen)',
    instagramUrl: igUrlVal || (igVal ? (igVal.startsWith('http') ? igVal : `https://www.instagram.com/${igVal.replace(/[@()]/g, '').trim().split(' ')[0]}`) : 'https://www.instagram.com'),
    youtubeUrl: ytUrlVal || 'https://www.youtube.com',
    address: document.getElementById('editContactAddress').value.trim() || '480/3 หมู่ 13 นวนคร ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    mapEmbedUrl: document.getElementById('editContactMapUrl').value.trim(),
    mapAppUrl: mapAppUrlVal || 'https://maps.app.goo.gl/dJzT3uWkE7bZzP6V7'
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
  whyData.subtitle = document.getElementById('whySubtitleInput').value.trim() || 'WHY CHOOSE US';
  whyData.title = document.getElementById('whyTitleInput').value.trim() || 'ทำไมต้องเลือก The NEW GEN';
  whyData.desc = document.getElementById('whyDescInput').value.trim() || '';

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
    home: window.NewGenDB.getHome(),
    about: window.NewGenDB.getAbout(),
    tutors: window.NewGenDB.getTutors(),
    tutorsQuote: window.NewGenDB.getTutorsQuote(),
    reviews: window.NewGenDB.getReviews(),
    achievements: window.NewGenDB.getAchievements(),
    videos: window.NewGenDB.getVideos(),
    contact: window.NewGenDB.getContact(),
    whyus: window.NewGenDB.getWhyUs(),
    exportedAt: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `newgen-backup-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('ส่งออกข้อมูล JSON สำเร็จแล้ว!');
}

function importDataFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.courses) await window.NewGenDB.saveCourses(data.courses);
      if (data.home) await window.NewGenDB.saveHome(data.home);
      if (data.about) await window.NewGenDB.saveAbout(data.about);
      if (data.tutors) await window.NewGenDB.saveTutors(data.tutors);
      if (data.tutorsQuote) await window.NewGenDB.saveTutorsQuote(data.tutorsQuote);
      if (data.reviews) await window.NewGenDB.saveReviews(data.reviews);
      if (data.achievements) await window.NewGenDB.saveAchievements(data.achievements);
      if (data.videos) await window.NewGenDB.saveVideos(data.videos);
      if (data.contact) await window.NewGenDB.saveContact(data.contact);
      if (data.whyus) await window.NewGenDB.saveWhyUs(data.whyus);

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


