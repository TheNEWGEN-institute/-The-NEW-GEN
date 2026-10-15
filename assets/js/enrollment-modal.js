/**
 * The NEW GEN Tutoring Institute - Universal Course Enrollment Modal
 * ระบบสมัครเรียนออนไลน์ในเว็บไซต์โดยตรง พร้อมหน้าทบทวนคอร์สและหน้ายืนยันผ่าน LINE Official
 */

(function () {
  'use strict';

  let currentEnrollCourse = null;
  let lastEnrollmentData = null;

  function ensureEnrollmentModalDom() {
    if (document.getElementById('modalStudentEnrollment')) return;

    const modalHtml = `
      <div class="enroll-modal-backdrop" id="modalStudentEnrollment" role="dialog" aria-modal="true" aria-labelledby="enrollModalTitle">
        <div class="enroll-modal-container">
          
          <!-- Header Bar -->
          <div class="enroll-modal-topbar">
            <div class="enroll-modal-brand">
              <span class="enroll-brand-icon"><i class="fa-solid fa-graduation-cap"></i></span>
              <div>
                <h3 id="enrollModalTitle" class="enroll-modal-heading">แบบฟอร์มสมัครเรียนออนไลน์</h3>
                <span id="enrollModalSubtitle" class="enroll-modal-sub">สถาบันกวดวิชา The NEW GEN (Onsite &amp; Online)</span>
              </div>
            </div>
            <button type="button" class="enroll-modal-close" onclick="closeEnrollmentModal()" aria-label="ปิดหน้าต่าง">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- STEP 1: FORM VIEW -->
          <div id="enrollStepForm" class="enroll-modal-view active">
            
            <!-- Course Review Banner (หัวข้อทบทวนคอร์สที่กำลังสมัคร) -->
            <div class="enroll-course-review-card" id="enrollCourseReviewCard">
              <div class="enroll-review-cover-wrap">
                <img id="enrReviewCover" src="assets/images/course-poster-primary.jpg" alt="รูปปกคอร์ส">
                <div id="enrReviewSeatBadge" class="enr-seat-badge-pill"></div>
              </div>
              <div class="enroll-review-info">
                <div class="enroll-review-tags">
                  <span class="badge badge-primary-level" id="enrReviewCategory">ระดับประถมศึกษา</span>
                  <span class="badge badge-emerald" id="enrReviewStatus">เปิดรับสมัคร</span>
                </div>
                <h4 id="enrReviewTitle" class="enroll-review-title">คอร์สเปิดเทอม 2/69</h4>
                <p id="enrReviewSubjects" class="enroll-review-subjects"><i class="fa-solid fa-book-open"></i> วิทย์ • คณิต • อังกฤษ</p>
                <div class="enroll-review-meta-grid">
                  <div class="enr-meta-chip">
                    <i class="fa-solid fa-location-dot"></i>
                    <span id="enrReviewLocation">เรียนสด Onsite สถาบัน The NEW GEN</span>
                  </div>
                  <div class="enr-meta-chip">
                    <i class="fa-regular fa-clock"></i>
                    <span id="enrReviewHours">42 ชั่วโมงตลอดเทอม</span>
                  </div>
                </div>
                <div class="enroll-review-price-box">
                  <span class="enr-price-label">ค่าเล่าเรียน:</span>
                  <span class="enr-price-val" id="enrReviewPrice">4,500</span>
                  <span class="enr-price-unit" id="enrReviewUnit">บาท / เทอม (แบ่งชำระได้)</span>
                </div>
              </div>
            </div>

            <!-- Registration Form -->
            <form id="studentEnrollForm" onsubmit="handleStudentEnrollSubmit(event)">
              
              <!-- 1. เลือกตาราง / รอบเรียน (Dynamic Schedules) -->
              <div class="enroll-section-block" id="enrollScheduleSection">
                <label class="enroll-section-label">
                  <i class="fa-regular fa-calendar-check" style="color: var(--color-blue-brand);"></i>
                  <strong>เลือกรอบ / วันเวลาเรียนที่ต้องการ</strong> <span class="req-star">*</span>
                </label>
                <div id="enrollScheduleList" class="enroll-schedule-grid">
                  <!-- Dynamically populated -->
                </div>
              </div>

              <!-- 2. รูปแบบการเรียน -->
              <div class="enroll-section-block">
                <label class="enroll-section-label">
                  <i class="fa-solid fa-chalkboard-user" style="color: var(--color-blue-brand);"></i>
                  <strong>รูปแบบการเรียน</strong> <span class="req-star">*</span>
                </label>
                <div class="enroll-type-toggle-group">
                  <label class="enroll-type-radio-card active" id="labelTypeOnsite">
                    <input type="radio" name="enrollLearningType" value="onsite" checked onchange="toggleEnrollType('onsite')">
                    <div class="type-card-body">
                      <i class="fa-solid fa-school"></i>
                      <div>
                        <strong id="enrOnsiteTitle">เรียนสด Onsite ที่สถาบัน</strong>
                        <small id="enrOnsiteDesc">ห้องเรียนแอร์กลุ่มเล็ก ติวเตอร์ดูแลใกล้ชิดรายบุคคล</small>
                      </div>
                    </div>
                  </label>
                  <label class="enroll-type-radio-card" id="labelTypeOnline">
                    <input type="radio" name="enrollLearningType" value="online" onchange="toggleEnrollType('online')">
                    <div class="type-card-body">
                      <i class="fa-solid fa-laptop"></i>
                      <div>
                        <strong id="enrOnlineTitle">เรียนสด Online (Zoom)</strong>
                        <small id="enrOnlineDesc">เรียนสดพร้อมถามตอบได้ทันที จัดส่งหนังสือฟรีถึงบ้าน</small>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- 3. ข้อมูลนักเรียน -->
              <div class="enroll-section-block">
                <label class="enroll-section-label">
                  <i class="fa-solid fa-user-graduate" style="color: var(--color-blue-brand);"></i>
                  <strong>ข้อมูลนักเรียนผู้สมัคร</strong>
                </label>
                
                <div class="enroll-form-grid-2">
                  <div class="enr-form-field" id="wrapFieldStudentName">
                    <label for="enrInputStudentName"><span id="lblFieldStudentName">ชื่อ - นามสกุลจริง นักเรียน</span> <span class="req-star" id="starFieldStudentName">*</span></label>
                    <input type="text" id="enrInputStudentName" placeholder="เช่น ด.ช. ธนภัทร ใจดี" required autocomplete="name">
                  </div>
                  <div class="enr-form-field" id="wrapFieldNickname">
                    <label for="enrInputNickname"><span id="lblFieldNickname">ชื่อเล่น</span> <span class="req-star" id="starFieldNickname">*</span></label>
                    <input type="text" id="enrInputNickname" placeholder="เช่น น้องกาย หรือ น้องพรีม" required>
                  </div>
                </div>

                <div class="enroll-form-grid-2">
                  <div class="enr-form-field" id="wrapFieldGrade">
                    <label for="enrInputGrade"><span id="lblFieldGrade">ระดับชั้นปัจจุบัน / ที่กำลังจะขึ้น</span> <span class="req-star" id="starFieldGrade">*</span></label>
                    <input type="text" id="enrInputGrade" placeholder="เช่น ป.5 หรือ ป.6 หรือ ม.1" required>
                  </div>
                  <div class="enr-form-field" id="wrapFieldSchool">
                    <label for="enrInputSchool"><span id="lblFieldSchool">โรงเรียนปัจจุบัน</span> <span class="req-star" id="starFieldSchool">*</span></label>
                    <input type="text" id="enrInputSchool" placeholder="เช่น โรงเรียนอนุบาลเชียงใหม่" required>
                  </div>
                </div>
              </div>

              <!-- 4. ข้อมูลการติดต่อ -->
              <div class="enroll-section-block">
                <label class="enroll-section-label">
                  <i class="fa-solid fa-phone" style="color: var(--color-blue-brand);"></i>
                  <strong>ข้อมูลติดต่อ (สำหรับยืนยันที่นั่งและส่งข่าวสาร)</strong>
                </label>

                <div class="enroll-form-grid-2">
                  <div class="enr-form-field" id="wrapFieldParentPhone">
                    <label for="enrInputParentPhone"><span id="lblFieldParentPhone">เบอร์โทรศัพท์ผู้ปกครอง</span> <span class="req-star" id="starFieldParentPhone">*</span></label>
                    <input type="tel" id="enrInputParentPhone" placeholder="เช่น 089-123-4567" required autocomplete="tel">
                  </div>
                  <div class="enr-form-field" id="wrapFieldLineId">
                    <label for="enrInputLineId"><span id="lblFieldLineId">LINE ID (ผู้ปกครองหรือน้อง)</span> <span class="req-star" id="starFieldLineId">*</span></label>
                    <input type="text" id="enrInputLineId" placeholder="เช่น newgen_student หรือ เบอร์โทรไลน์" required>
                  </div>
                </div>

                <div class="enroll-form-grid-2">
                  <div class="enr-form-field" id="wrapFieldStudentPhone">
                    <label for="enrInputStudentPhone"><span id="lblFieldStudentPhone">เบอร์โทรศัพท์นักเรียน (ถ้ามี)</span> <span class="req-star" id="starFieldStudentPhone" style="display:none;">*</span></label>
                    <input type="tel" id="enrInputStudentPhone" placeholder="เช่น 095-xxx-xxxx (ไม่บังคับ)">
                  </div>
                  <div class="enr-form-field" id="wrapFieldShippingAddress">
                    <label for="enrInputAddress"><span id="lblFieldShippingAddress">ที่อยู่จัดส่งเอกสารและหนังสือเรียน</span> <span class="req-star" id="starFieldShippingAddress" style="display:none;">*</span></label>
                    <input type="text" id="enrInputAddress" placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์">
                  </div>
                </div>

                <div class="enr-form-field" id="wrapFieldNotes" style="margin-top: 10px;">
                  <label for="enrInputNotes"><span id="lblFieldNotes">หมายเหตุ / คำถามเพิ่มเติมถึงติวเตอร์ (ถ้ามี)</span> <span class="req-star" id="starFieldNotes" style="display:none;">*</span></label>
                  <textarea id="enrInputNotes" rows="2" placeholder="เช่น พื้นฐานวิชาคณิตศาสตร์ยังไม่คล่อง หรือต้องการเน้นเรื่องใดเป็นพิเศษ"></textarea>
                </div>
              </div>

              <!-- 5. คำถามเพิ่มเติมที่กำหนดเอง (Custom Questions) -->
              <div class="enroll-section-block" id="enrollCustomSection" style="display: none;">
                <label class="enroll-section-label">
                  <i class="fa-solid fa-clipboard-question" style="color: var(--color-blue-brand);"></i>
                  <strong>ข้อมูลคำถามเพิ่มเติม</strong>
                </label>
                <div id="enrCustomFieldsContainer" class="enroll-custom-fields-grid" style="display: flex; flex-direction: column; gap: 12px;">
                  <!-- Dynamically populated via applyEnrollmentConfig -->
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="enroll-modal-actions">
                <button type="button" class="btn-enr-cancel" onclick="closeEnrollmentModal()">ยกเลิก</button>
                <button type="submit" class="btn-enr-submit" id="btnEnrollSubmit">
                  <i class="fa-solid fa-paper-plane"></i> <span id="btnEnrollSubmitText">ยืนยันการสมัครเรียน (จองที่นั่ง)</span>
                </button>
              </div>
            </form>
          </div>

          <!-- STEP 2: CONFIRMATION VIEW (หน้ายืนยันการสมัครสำเร็จ & ทัก LINE) -->
          <div id="enrollStepConfirmation" class="enroll-modal-view">
            <div class="enroll-success-wrap">
              
              <div class="enroll-success-icon-badge">
                <i class="fa-solid fa-circle-check"></i>
              </div>

              <h3 class="enroll-success-title" id="enrSuccessTitle">ลงทะเบียนสมัครเรียนสำเร็จเรียบร้อยแล้ว! 🎉</h3>
              <p class="enroll-success-lead" id="enrSuccessLead">
                ระบบได้บันทึกข้อมูลการสมัครเรียนของน้องเข้าสู่ระบบสถาบัน The NEW GEN เรียบร้อยแล้ว
              </p>

              <!-- Application Ticket Summary Box -->
              <div class="enroll-ticket-card" id="enrollTicketCard">
                <div class="enroll-ticket-header">
                  <div>
                    <span class="ticket-label">รหัสอ้างอิงการสมัคร (Application ID)</span>
                    <strong class="ticket-code" id="confAppCode">#ENR-20261014-001</strong>
                  </div>
                  <span class="badge badge-emerald" id="confStatusBadge">รอการยืนยันที่นั่ง</span>
                </div>

                <div class="enroll-ticket-body">
                  <div class="ticket-row">
                    <span class="ticket-k"><i class="fa-solid fa-graduation-cap"></i> คอร์สเรียน:</span>
                    <strong class="ticket-v" id="confCourseTitle">-</strong>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-k"><i class="fa-regular fa-calendar-check"></i> รอบ/วันเวลาเรียน:</span>
                    <span class="ticket-v" id="confScheduleChoice">-</span>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-k"><i class="fa-solid fa-school"></i> รูปแบบการเรียน:</span>
                    <span class="ticket-v" id="confLearningType">เรียนสด Onsite</span>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-k"><i class="fa-solid fa-user"></i> ชื่อผู้สมัคร:</span>
                    <span class="ticket-v" id="confStudentName">-</span>
                  </div>
                  <div class="ticket-row">
                    <span class="ticket-k"><i class="fa-solid fa-phone"></i> เบอร์ติดต่อ / LINE:</span>
                    <span class="ticket-v" id="confContact">-</span>
                  </div>
                  <div id="confCustomAnswersWrap"></div>
                </div>
              </div>

              <!-- LINE Confirmation Callout Box (เด่นชัดมาก) -->
              <div class="enroll-line-callout">
                <div class="callout-header">
                  <i class="fa-brands fa-line" style="font-size: 1.8rem; color: #06c755;"></i>
                  <div>
                    <h4 id="confLineCalloutTitle">ขั้นตอนสุดท้าย: ทักไปยืนยันการสมัครที่ LINE สถาบัน</h4>
                    <p id="confLineCalloutBody">กรุณากดปุ่มด้านล่างเพื่อทักไปยืนยันการสมัครและส่งหลักฐานการชำระเงินที่ LINE Official เจ้าหน้าที่จะตรวจสอบและยืนยันที่นั่งให้น้องทันทีครับ</p>
                  </div>
                </div>

                <!-- Big Green LINE Button -->
                <div class="enroll-line-actions">
                  <a href="https://lin.ee/RXrzi1G" target="_blank" rel="noopener noreferrer" class="btn-line-cta-large" id="btnConfLineLink">
                    <i class="fa-brands fa-line"></i>
                    <span id="btnConfLineText">คลิกเพื่อทัก LINE ยืนยันการสมัครทันที</span>
                  </a>

                  <button type="button" class="btn-copy-summary" onclick="copyEnrollmentSummaryText()" id="btnCopySummary">
                    <i class="fa-regular fa-copy"></i>
                    <span id="btnCopySummaryText">คัดลอกข้อมูลสรุปสำหรับส่งใน LINE</span>
                  </button>
                </div>
              </div>

              <div class="enroll-success-footer">
                <button type="button" class="btn-enr-done" onclick="closeEnrollmentModal()">
                  <i class="fa-solid fa-check"></i> <span id="btnEnrDoneText">เสร็จสิ้น / ปิดหน้าต่าง</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml.trim();
    document.body.appendChild(div.firstElementChild);

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeEnrollmentModal();
    });

    // Click outside container to close
    const backdrop = document.getElementById('modalStudentEnrollment');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeEnrollmentModal();
      });
    }

    if (typeof window.applyEnrollmentConfig === 'function') {
      window.applyEnrollmentConfig();
    }
  }

  /**
   * Apply customizable texts to enrollment modal elements from backend/NewGenDB
   */
  window.applyEnrollmentConfig = function () {
    const cfg = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
      ? window.NewGenDB.getEnrollmentConfig()
      : (window.enrollmentConfigData || {});

    if (!cfg || typeof cfg !== 'object') return;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null && String(val).trim() !== '') {
        el.textContent = val;
      }
    };

    setTxt('enrollModalTitle', cfg.modalTitle);
    setTxt('enrollModalSubtitle', cfg.modalSubtitle);
    setTxt('enrOnsiteTitle', cfg.onsiteTitle);
    setTxt('enrOnsiteDesc', cfg.onsiteDesc);
    setTxt('enrOnlineTitle', cfg.onlineTitle);
    setTxt('enrOnlineDesc', cfg.onlineDesc);
    setTxt('btnEnrollSubmitText', cfg.submitBtnText);
    setTxt('enrSuccessTitle', cfg.successTitle);
    setTxt('enrSuccessLead', cfg.successLead);
    setTxt('confStatusBadge', cfg.ticketStatusBadge);
    setTxt('confLineCalloutTitle', cfg.lineCalloutTitle);
    setTxt('confLineCalloutBody', cfg.lineCalloutBody);
    setTxt('btnConfLineText', cfg.lineBtnText);
    setTxt('btnCopySummaryText', cfg.copyBtnText);
    setTxt('btnEnrDoneText', cfg.doneBtnText);

    const btnLineLink = document.getElementById('btnConfLineLink');
    if (btnLineLink) {
      const lineUrl = cfg.lineUrl || getContactLineUrl();
      if (lineUrl) btnLineLink.href = lineUrl;
    }

    // Configure standard question fields (Labels, Placeholders, Required status, Visibility)
    const formQ = cfg.formQuestions || {};
    const stdFields = formQ.fields || {};

    const updateStdField = (fieldKey, inputId, lblId, starId, wrapId) => {
      const f = stdFields[fieldKey];
      if (!f) return;
      const lblEl = document.getElementById(lblId);
      const starEl = document.getElementById(starId);
      const inputEl = document.getElementById(inputId);
      const wrapEl = document.getElementById(wrapId);

      if (lblEl && f.label) lblEl.textContent = f.label;
      if (starEl) starEl.style.display = f.required ? 'inline' : 'none';
      if (inputEl) {
        if (f.placeholder) inputEl.placeholder = f.placeholder;
        inputEl.required = Boolean(f.required);
      }
      if (wrapEl) {
        wrapEl.style.display = f.enabled !== false ? '' : 'none';
      }
    };

    updateStdField('studentName', 'enrInputStudentName', 'lblFieldStudentName', 'starFieldStudentName', 'wrapFieldStudentName');
    updateStdField('nickname', 'enrInputNickname', 'lblFieldNickname', 'starFieldNickname', 'wrapFieldNickname');
    updateStdField('grade', 'enrInputGrade', 'lblFieldGrade', 'starFieldGrade', 'wrapFieldGrade');
    updateStdField('school', 'enrInputSchool', 'lblFieldSchool', 'starFieldSchool', 'wrapFieldSchool');
    updateStdField('parentPhone', 'enrInputParentPhone', 'lblFieldParentPhone', 'starFieldParentPhone', 'wrapFieldParentPhone');
    updateStdField('lineId', 'enrInputLineId', 'lblFieldLineId', 'starFieldLineId', 'wrapFieldLineId');
    updateStdField('studentPhone', 'enrInputStudentPhone', 'lblFieldStudentPhone', 'starFieldStudentPhone', 'wrapFieldStudentPhone');
    updateStdField('shippingAddress', 'enrInputAddress', 'lblFieldShippingAddress', 'starFieldShippingAddress', 'wrapFieldShippingAddress');
    updateStdField('notes', 'enrInputNotes', 'lblFieldNotes', 'starFieldNotes', 'wrapFieldNotes');

    // Render Custom Questions
    const customSection = document.getElementById('enrollCustomSection');
    const customContainer = document.getElementById('enrCustomFieldsContainer');
    const customList = Array.isArray(formQ.customQuestions) ? formQ.customQuestions.filter(q => q && q.enabled !== false) : [];

    if (customSection && customContainer) {
      if (customList.length > 0) {
        customSection.style.display = 'block';
        customContainer.innerHTML = customList.map((q, idx) => {
          const reqStar = q.required ? '<span class="req-star">*</span>' : '';
          const reqAttr = q.required ? 'required' : '';
          const fieldId = `custom_q_${q.id || idx}`;

          let inputHtml = '';
          if (q.type === 'textarea') {
            inputHtml = `<textarea id="${fieldId}" name="${fieldId}" data-qid="${q.id}" rows="2" placeholder="${escapeHtml(q.placeholder || '')}" ${reqAttr}></textarea>`;
          } else if (q.type === 'select') {
            const opts = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : []);
            inputHtml = `
              <select id="${fieldId}" name="${fieldId}" data-qid="${q.id}" ${reqAttr} style="width: 100%; padding: 10px 12px; border: 1.5px solid var(--border-color); border-radius: 8px;">
                <option value="">-- โปรดเลือกคำตอบ --</option>
                ${opts.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
              </select>
            `;
          } else {
            inputHtml = `<input type="text" id="${fieldId}" name="${fieldId}" data-qid="${q.id}" placeholder="${escapeHtml(q.placeholder || '')}" ${reqAttr}>`;
          }

          return `
            <div class="enr-form-field">
              <label for="${fieldId}">${escapeHtml(q.label || 'คำถามเพิ่มเติม')} ${reqStar}</label>
              ${inputHtml}
            </div>
          `;
        }).join('');
      } else {
        customSection.style.display = 'none';
        customContainer.innerHTML = '';
      }
    }
  };

  /**
   * Open Enrollment Modal for specific course or bundle
   */
  window.openEnrollmentModal = function (courseId, bundleDataFallback) {
    ensureEnrollmentModalDom();
    if (typeof window.applyEnrollmentConfig === 'function') {
      window.applyEnrollmentConfig();
    }

    const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
    let course = courses.find(c => c.id === courseId);

    // If not found in courses, check if courseId is a bundle!
    if (!course) {
      const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
      let bundleObj = bundles.find(b => b.id === courseId);

      // Fallback 1: check bundleDataFallback parameter
      if (!bundleObj && bundleDataFallback && typeof bundleDataFallback === 'object') {
        bundleObj = bundleDataFallback;
      }

      // Fallback 2: check raw localStorage
      if (!bundleObj) {
        try {
          const rawB = JSON.parse(localStorage.getItem('newgen_bundles') || '[]');
          if (Array.isArray(rawB)) bundleObj = rawB.find(b => b.id === courseId);
        } catch (e) {}
      }

      // Fallback 3: check window.bundlesData
      if (!bundleObj && typeof window !== 'undefined' && Array.isArray(window.bundlesData)) {
        bundleObj = window.bundlesData.find(b => b.id === courseId);
      }

      if (bundleObj) {
        const childCourses = courses.filter(c => Array.isArray(bundleObj.courseIds) && bundleObj.courseIds.includes(c.id));
        const childTitles = childCourses.map(c => c.title).join(' • ');

        // Gather schedules from child courses
        let schedules = [];
        childCourses.forEach(c => {
          if (Array.isArray(c.scheduleList)) {
            c.scheduleList.forEach(s => {
              schedules.push({
                type: `[${c.title}] ${s.type || 'รอบเรียน'}`,
                dates: s.dates || '',
                time: s.time || ''
              });
            });
          }
        });
        if (schedules.length === 0) {
          schedules = [
            { type: 'รอบเรียนแพ็คเกจ (เรียนครบทุกวิชา)', dates: 'เจ้าหน้าที่จะติดต่อประสานงานยืนยันวันเวลากับผู้ปกครอง', time: 'ตามตารางเรียนคอร์สในแพ็ค' }
          ];
        }

        course = {
          id: bundleObj.id,
          title: `[แพ็คเกจ] ${bundleObj.name}`,
          name: bundleObj.name,
          isBundle: true,
          bundleId: bundleObj.id,
          bundleName: bundleObj.name,
          courseIds: bundleObj.courseIds || [],
          childCourses: childCourses,
          categoryLabel: `แพ็คเกจโปรโมชั่น (${bundleObj.courseIds ? bundleObj.courseIds.length : childCourses.length} คอร์ส)`,
          subjects: childTitles || bundleObj.description || 'รวมคอร์สโปรโมชั่นพิเศษ',
          location: 'สถาบัน The NEW GEN (เรียนสด Onsite & Online)',
          totalHours: childCourses.map(c => `${c.title} (${c.totalHours || 'ชั่วโมงตามคอร์ส'})`).join(' • ') || 'แพ็คเกจวิชาหลักเข้มข้น',
          pricePromo: bundleObj.pricePromo || '0',
          priceOriginal: bundleObj.priceOriginal || '',
          priceUnit: bundleObj.priceUnit || 'บาท / แพ็คเกจ',
          cover: bundleObj.customImage || (childCourses[0]?.cover || childCourses[0]?.poster || 'assets/images/course-poster-primary.jpg'),
          poster: bundleObj.customImage || (childCourses[0]?.poster || childCourses[0]?.cover || 'assets/images/course-poster-primary.jpg'),
          scheduleList: schedules,
          remainingSeats: 99,
          maxSeats: 99,
          isFull: false
        };
      }
    }

    if (!course) {
      alert('ไม่พบคอร์สเรียนหรือแพ็คเกจที่ต้องการสมัคร กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Check capacity / isFull
    const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(course) : {
      isFull: course.isFull === true || course.remainingSeats === 0,
      remainingSeats: course.remainingSeats || 0
    };

    if (eff.isFull) {
      const lineUrl = getContactLineUrl();
      const wantLine = confirm('ขออภัยครับ คอร์สนี้ที่นั่งเต็มแล้ว\n\nต้องการทัก LINE เพื่อสอบถามรอบถัดไป หรือลงชื่อในรายชื่อสำรอง (Waiting List) หรือไม่ครับ?');
      if (wantLine) window.open(lineUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    currentEnrollCourse = course;

    // Populate Review Banner
    const coverEl = document.getElementById('enrReviewCover');
    if (coverEl) coverEl.src = window.resolveMediaUrl ? window.resolveMediaUrl(course.cover || course.poster || 'assets/images/course-poster-primary.jpg') : (course.cover || course.poster);

    const titleEl = document.getElementById('enrReviewTitle');
    if (titleEl) titleEl.textContent = course.title || 'คอร์สเรียน The NEW GEN';

    const catEl = document.getElementById('enrReviewCategory');
    if (catEl) catEl.textContent = course.categoryLabel || (course.category === 'primary' ? 'ระดับประถมศึกษา' : 'ระดับมัธยมศึกษา');

    const subEl = document.getElementById('enrReviewSubjects');
    if (subEl) subEl.innerHTML = `<i class="fa-solid fa-book-open"></i> ${course.subjects || 'วิทยาศาสตร์ • คณิตศาสตร์ • ภาษาอังกฤษ'}`;

    const locEl = document.getElementById('enrReviewLocation');
    if (locEl) locEl.textContent = course.location || 'เรียนสด Onsite สถาบัน The NEW GEN';

    const hrsEl = document.getElementById('enrReviewHours');
    if (hrsEl) hrsEl.textContent = course.totalHours || '42 ชั่วโมงตลอดเทอม';

    const priceEl = document.getElementById('enrReviewPrice');
    if (priceEl) priceEl.textContent = course.pricePromo || '4,500';

    const unitEl = document.getElementById('enrReviewUnit');
    if (unitEl) unitEl.textContent = course.priceUnit || 'บาท / เทอม (แบ่งชำระได้)';

    const seatBadgeEl = document.getElementById('enrReviewSeatBadge');
    if (seatBadgeEl) {
      if (course.isBundle) {
        seatBadgeEl.innerHTML = `<span class="badge badge-rose" style="background:#ffe4e6; color:#e11d48; font-weight:700; border:1px solid #fecdd3;"><i class="fa-solid fa-fire"></i> แพ็คเกจโปรโมชั่น</span>`;
      } else if (window.getCourseSeatBadgeHtml) {
        seatBadgeEl.innerHTML = window.getCourseSeatBadgeHtml(course);
      }
    }

    // Populate Schedules
    const schedContainer = document.getElementById('enrollScheduleList');
    const schedSection = document.getElementById('enrollScheduleSection');
    if (schedContainer) {
      if (Array.isArray(course.scheduleList) && course.scheduleList.length > 0) {
        schedSection.style.display = 'block';
        schedContainer.innerHTML = course.scheduleList.map((s, idx) => {
          const checked = idx === 0 ? 'checked' : '';
          const activeClass = idx === 0 ? 'active' : '';
          const isItemFull = (s.time && s.time.includes('เต็มแล้ว')) || (s.dates && s.dates.includes('ปิดรับ'));
          return `
            <label class="enroll-schedule-card ${activeClass} ${isItemFull ? 'disabled' : ''}" onclick="selectEnrollSchedule(this)">
              <input type="radio" name="enrollScheduleChoice" value="${escapeHtml(s.type)} | ${escapeHtml(s.time)} | ${escapeHtml(s.dates)}" ${checked} ${isItemFull ? 'disabled' : ''}>
              <div class="sched-card-body">
                <div class="sched-type-row">
                  <strong>${escapeHtml(s.type)}</strong>
                  ${isItemFull ? '<span class="badge badge-seat-full" style="font-size: 0.72rem;">🛑 เต็มแล้ว</span>' : '<span class="sched-time-tag"><i class="fa-regular fa-clock"></i> ' + escapeHtml(s.time) + '</span>'}
                </div>
                ${s.dates ? `<div class="sched-dates-row"><i class="fa-regular fa-calendar"></i> ${escapeHtml(s.dates)}</div>` : ''}
              </div>
            </label>
          `;
        }).join('');
      } else {
        schedSection.style.display = 'none';
        schedContainer.innerHTML = `<input type="hidden" name="enrollScheduleChoice" value="ตารางเรียนมาตรฐานตามรอบคอร์ส">`;
      }
    }

    // Reset Form fields
    document.getElementById('studentEnrollForm').reset();
    toggleEnrollType('onsite');

    // Seat capacity check for submit button
    const seatInfo = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(course) : null;
    const isFull = seatInfo ? seatInfo.isFull : Boolean(course.isFull || (course.remainingSeats <= 0 && course.maxSeats > 0));
    const submitBtn = document.getElementById('btnEnrollSubmit');
    if (submitBtn) {
      if (isFull) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-ban"></i> ขออภัย ที่นั่งคอร์สนี้เต็มแล้ว (ปิดรับสมัคร)';
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
      } else {
        const cfg = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
          ? window.NewGenDB.getEnrollmentConfig()
          : (window.enrollmentConfigData || {});
        const submitLabel = (cfg && cfg.submitBtnText) ? cfg.submitBtnText : 'ยืนยันการสมัครเรียน (จองที่นั่ง)';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span id="btnEnrollSubmitText">${escapeHtml(submitLabel)}</span>`;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }

    // Switch to step 1
    document.getElementById('enrollStepForm').classList.add('active');
    document.getElementById('enrollStepConfirmation').classList.remove('active');

    // Show modal
    const modalEl = document.getElementById('modalStudentEnrollment');
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeEnrollmentModal = function () {
    const modalEl = document.getElementById('modalStudentEnrollment');
    if (modalEl) modalEl.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.selectEnrollSchedule = function (cardEl) {
    if (cardEl.classList.contains('disabled')) return;
    document.querySelectorAll('.enroll-schedule-card').forEach(c => c.classList.remove('active'));
    cardEl.classList.add('active');
    const radio = cardEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  };

  window.toggleEnrollType = function (type) {
    const cardOnsite = document.getElementById('labelTypeOnsite');
    const cardOnline = document.getElementById('labelTypeOnline');
    if (type === 'onsite') {
      if (cardOnsite) cardOnsite.classList.add('active');
      if (cardOnline) cardOnline.classList.remove('active');
    } else {
      if (cardOnsite) cardOnsite.classList.remove('active');
      if (cardOnline) cardOnline.classList.add('active');
    }
  };

  function getContactLineUrl() {
    const contact = window.NewGenDB ? window.NewGenDB.getContact() : (window.contactData || {});
    return (contact && contact.lineUrl && contact.lineUrl.trim()) ? contact.lineUrl.trim() : 'https://lin.ee/RXrzi1G';
  }

  /**
   * Handle Form Submission
   */
  window.handleStudentEnrollSubmit = async function (e) {
    e.preventDefault();

    if (!currentEnrollCourse) {
      alert('เกิดข้อผิดพลาด: ไม่พบคอร์สเรียนที่สมัคร');
      return;
    }

    const studentName = document.getElementById('enrInputStudentName').value.trim();
    const nickname = document.getElementById('enrInputNickname').value.trim();
    const grade = document.getElementById('enrInputGrade').value.trim();
    const school = document.getElementById('enrInputSchool').value.trim();
    const parentPhone = document.getElementById('enrInputParentPhone').value.trim();
    const studentPhone = document.getElementById('enrInputStudentPhone').value.trim();
    const lineId = document.getElementById('enrInputLineId').value.trim();
    const shippingAddress = document.getElementById('enrInputAddress').value.trim();
    const notes = document.getElementById('enrInputNotes').value.trim();

    if (!studentName || !nickname || !grade || !school || !parentPhone || !lineId) {
      alert('กรุณากรอกข้อมูลที่มีเครื่องหมาย (*) ให้ครบถ้วน');
      return;
    }

    // Custom questions collection & validation
    const cfg = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
      ? window.NewGenDB.getEnrollmentConfig()
      : (window.enrollmentConfigData || {});
    const formQ = cfg.formQuestions || {};
    const customList = Array.isArray(formQ.customQuestions) ? formQ.customQuestions.filter(q => q && q.enabled !== false) : [];
    const customAnswers = [];

    let customMissing = false;
    let missingLabel = '';
    customList.forEach(q => {
      const input = document.querySelector(`[data-qid="${q.id}"]`);
      const val = input ? input.value.trim() : '';
      if (q.required && !val) {
        customMissing = true;
        if (!missingLabel) missingLabel = q.label;
      }
      if (val) {
        customAnswers.push({
          id: q.id,
          label: q.label,
          value: val
        });
      }
    });

    if (customMissing) {
      alert(`กรุณากรอกข้อมูลในข้อคำถาม "${missingLabel}" ให้เรียบร้อย`);
      return;
    }

    // Capacity safeguard
    const seatInfo = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(currentEnrollCourse) : null;
    const isCourseFull = seatInfo ? seatInfo.isFull : Boolean(currentEnrollCourse.isFull || (currentEnrollCourse.remainingSeats <= 0 && currentEnrollCourse.maxSeats > 0));
    if (isCourseFull) {
      alert('ขออภัย คอร์สเรียนนี้ที่นั่งเต็มแล้ว ไม่สามารถรับสมัครเพิ่มได้ในขณะนี้');
      return;
    }

    // Schedule choice
    const schedSelected = document.querySelector('input[name="enrollScheduleChoice"]:checked');
    const scheduleChoice = schedSelected ? schedSelected.value : (currentEnrollCourse.scheduleList?.[0]?.type || 'รอบเรียนปกติ');

    // Learning type
    const typeSelected = document.querySelector('input[name="enrollLearningType"]:checked');
    const learningType = typeSelected ? typeSelected.value : 'onsite';

    const submitBtn = document.getElementById('btnEnrollSubmit');
    const origBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...';

    // Generate readable application ID
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const enrollId = `ENR-${todayStr}-${randPart}`;

    const isBundle = Boolean(currentEnrollCourse && currentEnrollCourse.isBundle);
    const childCourseIds = isBundle && Array.isArray(currentEnrollCourse.courseIds) ? currentEnrollCourse.courseIds : [];

    const newEnrollment = {
      id: enrollId,
      courseId: currentEnrollCourse.id,
      courseTitle: currentEnrollCourse.title,
      scheduleChoice: scheduleChoice,
      learningType: learningType,
      studentName: studentName,
      fullName: studentName,
      nickname: nickname,
      grade: grade,
      school: school,
      parentPhone: parentPhone,
      studentPhone: studentPhone,
      lineId: lineId,
      shippingAddress: shippingAddress,
      notes: notes,
      customAnswers: customAnswers,
      isBundle: isBundle,
      bundleId: isBundle ? currentEnrollCourse.id : null,
      bundleName: isBundle ? (currentEnrollCourse.name || currentEnrollCourse.title) : null,
      bundleCourseIds: childCourseIds,
      status: 'pending', // รอตรวจสอบ/ชำระเงินทางไลน์
      createdAt: new Date().toISOString()
    };

    try {
      if (window.NewGenDB && typeof window.NewGenDB.saveEnrollment === 'function') {
        await window.NewGenDB.saveEnrollment(newEnrollment);

        // Requirement 1: If bundle, send student's name to EVERY course in the bundle!
        if (isBundle && childCourseIds.length > 0) {
          const allCourses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
          for (const subId of childCourseIds) {
            const subCourse = allCourses.find(c => c.id === subId);
            const subEnrollment = {
              ...newEnrollment,
              id: `${enrollId}-${subId}`,
              courseId: subId,
              courseTitle: subCourse ? subCourse.title : subId,
              isBundle: false,
              isFromBundle: true,
              bundleId: currentEnrollCourse.id,
              bundleName: currentEnrollCourse.name || currentEnrollCourse.title,
              parentEnrollId: enrollId,
              notes: `[สมัครผ่านแพ็คเกจ: ${currentEnrollCourse.name || currentEnrollCourse.title}] ${notes || ''}`.trim()
            };
            await window.NewGenDB.saveEnrollment(subEnrollment);
          }
        }
      }
    } catch (err) {
      console.warn('Save enrollment error, proceeding with confirmation:', err);
    }

    lastEnrollmentData = newEnrollment;

    // Populate Step 2 Confirmation Card
    document.getElementById('confAppCode').textContent = `#${enrollId}`;
    document.getElementById('confCourseTitle').textContent = currentEnrollCourse.title;
    document.getElementById('confScheduleChoice').textContent = scheduleChoice.replace(/\|/g, ' • ');
    document.getElementById('confLearningType').textContent = learningType === 'onsite' ? '🏫 เรียนสด Onsite (ที่สถาบัน The NEW GEN)' : '💻 เรียนสด Online (Zoom)';
    document.getElementById('confStudentName').textContent = `${studentName} (น้อง${nickname}) ชั้น ${grade} - รร. ${school}`;
    document.getElementById('confContact').textContent = `โทร: ${parentPhone} | LINE ID: ${lineId}`;

    // Populate Custom Answers in Step 2 ticket
    const customRowsWrap = document.getElementById('confCustomAnswersWrap');
    if (customRowsWrap) {
      if (customAnswers.length > 0) {
        customRowsWrap.innerHTML = customAnswers.map(ca => `
          <div class="ticket-row">
            <span class="ticket-k"><i class="fa-solid fa-circle-question" style="color: var(--color-blue-brand);"></i> ${escapeHtml(ca.label)}:</span>
            <span class="ticket-v">${escapeHtml(ca.value)}</span>
          </div>
        `).join('');
      } else {
        customRowsWrap.innerHTML = '';
      }
    }

    const lineUrl = (cfg && cfg.lineUrl) ? cfg.lineUrl : getContactLineUrl();
    const btnLineLink = document.getElementById('btnConfLineLink');
    if (btnLineLink) btnLineLink.href = lineUrl;

    // Switch view to Step 2
    document.getElementById('enrollStepForm').classList.remove('active');
    document.getElementById('enrollStepConfirmation').classList.add('active');

    submitBtn.disabled = false;
    submitBtn.innerHTML = origBtnHtml;

    // Trigger global synced event to update remaining seats and badges across open pages
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('newgen:synced'));
    }
  };

  /**
   * Copy Summary Text for sending to LINE
   */
  window.copyEnrollmentSummaryText = function () {
    if (!lastEnrollmentData || !currentEnrollCourse) return;

    let customText = '';
    if (Array.isArray(lastEnrollmentData.customAnswers) && lastEnrollmentData.customAnswers.length > 0) {
      customText = '\n' + lastEnrollmentData.customAnswers.map(ca => `${ca.label}: ${ca.value}`).join('\n');
    }

    const textToCopy = `สมัครเรียน The NEW GEN
-------------------------
รหัสการสมัคร: ${lastEnrollmentData.id}
คอร์สเรียน: ${lastEnrollmentData.courseTitle}
รอบเรียน: ${lastEnrollmentData.scheduleChoice.replace(/\|/g, ' • ')}
รูปแบบ: ${lastEnrollmentData.learningType === 'onsite' ? 'Onsite เรียนที่สถาบัน' : 'Online'}
ชื่อนักเรียน: ${lastEnrollmentData.studentName} (${lastEnrollmentData.nickname})
ระดับชั้น: ${lastEnrollmentData.grade} | รร. ${lastEnrollmentData.school}
เบอร์ผู้ปกครอง: ${lastEnrollmentData.parentPhone}
LINE ID: ${lastEnrollmentData.lineId}${customText}
-------------------------
หนู/ผมได้สมัครในระบบแล้ว ขอส่งข้อมูลเพื่อยืนยันที่นั่งครับ`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const btn = document.getElementById('btnCopySummaryText');
      if (btn) {
        btn.textContent = '✅ คัดลอกเรียบร้อยแล้ว! นำไปวางใน LINE ได้เลย';
        setTimeout(() => {
          const cfgAfter = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
            ? window.NewGenDB.getEnrollmentConfig()
            : (window.enrollmentConfigData || {});
          btn.textContent = (cfgAfter && cfgAfter.copyBtnText) ? cfgAfter.copyBtnText : 'คัดลอกข้อมูลสรุปสำหรับส่งใน LINE';
        }, 3500);
      }
    }).catch(() => {
      alert('ไม่สามารถคัดลอกอัตโนมัติได้ สามารถแคปเจอร์หน้าจอเพื่อส่งให้แอดมินใน LINE ได้เลยครับ');
    });
  };

  /**
   * Ensure Bundle Details Modal DOM exists
   */
  function ensureBundleDetailModalDom() {
    if (document.getElementById('modalBundleDetail')) return;

    const modalHtml = `
      <div class="modal-backdrop" id="modalBundleDetail" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div class="modal-bundle-box" style="background: #ffffff; width: 100%; max-width: 840px; border-radius: 24px; box-shadow: 0 30px 70px -15px rgba(0,0,0,0.35); overflow: hidden; position: relative; border: 1px solid rgba(226, 232, 240, 0.8); margin: auto;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0b1e3f 0%, #1e3a8a 60%, #be123c 100%); color: #ffffff; padding: 26px 30px 22px; position: relative;">
            <button type="button" class="btn-close-modal" onclick="closeBundleDetailModal()" aria-label="ปิดหน้าต่าง" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); color: #ffffff; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div id="bundleDetailBadgeWrap" style="margin-bottom: 8px;">
              <span id="bundleDetailBadge" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 999px; background: rgba(244, 63, 94, 0.25); border: 1px solid #f43f5e; color: #ffccd5; font-size: 0.84rem; font-weight: 700;">
                <i class="fa-solid fa-fire"></i> แพ็คเกจโปรโมชั่นสุดคุ้ม
              </span>
            </div>
            <h2 id="bundleDetailTitle" style="font-size: 1.55rem; font-weight: 800; line-height: 1.3; margin: 0 0 6px 0; color: #ffffff;">ชื่อแพ็คเกจคอร์สเรียน</h2>
            <p id="bundleDetailDesc" style="font-size: 0.92rem; color: #e2e8f0; margin: 0; line-height: 1.5; max-width: 680px;">รายละเอียดสรุปของแพ็คเกจ</p>
          </div>

          <!-- Price & Savings Ribbon -->
          <div style="background: #fff1f2; border-bottom: 1px solid #fecdd3; padding: 12px 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.9rem; color: #64748b; text-decoration: line-through;" id="bundleDetailPriceOld">จากปกติ 0 บาท</span>
              <div style="display: flex; align-items: baseline; gap: 4px;">
                <span style="font-size: 0.85rem; font-weight: 700; color: #be123c;">ราคาแพ็คเกจพิเศษเพียง</span>
                <span id="bundleDetailPricePromo" style="font-size: 1.7rem; font-weight: 800; color: #e11d48; line-height: 1;">0</span>
                <span id="bundleDetailPriceUnit" style="font-size: 0.85rem; color: #881337; font-weight: 600;">บาท / แพ็คเกจ</span>
              </div>
            </div>
            <div id="bundleDetailSavingsTag" style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 6px 14px; border-radius: 999px; font-size: 0.88rem; font-weight: 700; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);">
              <i class="fa-solid fa-gift"></i> ประหยัดทันที 0.-
            </div>
          </div>

          <!-- Modal Body Content -->
          <div style="padding: 22px 30px; max-height: calc(85vh - 220px); overflow-y: auto;">
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <h3 style="font-size: 1.12rem; font-weight: 800; color: #0b1e3f; margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-layer-group" style="color: #e11d48;"></i> คอร์สเรียนที่รวมอยู่ในแพ็คเกจนี้ (<span id="bundleDetailCourseCount">0</span> คอร์ส)
              </h3>
              <span style="font-size: 0.8rem; color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 6px; font-weight: 600;">
                <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> ได้รับสิทธิ์เรียนครบทุกวิชา
              </span>
            </div>

            <!-- List of Child Course Cards -->
            <div id="bundleDetailCoursesList" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
              <!-- Dynamic Cards Inserted Here -->
            </div>

            <!-- Package Perks & Extra Value -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fa-solid fa-book-open" style="color: #2563eb; font-size: 1.15rem; margin-top: 3px;"></i>
                <div style="font-size: 0.84rem; color: #334155; line-height: 1.4;">
                  <strong style="color: #0f172a; display: block;">ฟรี! เอกสารครบทุกวิชา</strong>
                  ชีทสรุปสูตรเก็งข้อสอบและหนังสือเรียนตลอดคอร์ส
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fa-solid fa-chalkboard-user" style="color: #10b981; font-size: 1.15rem; margin-top: 3px;"></i>
                <div style="font-size: 0.84rem; color: #334155; line-height: 1.4;">
                  <strong style="color: #0f172a; display: block;">ติวเตอร์ดูแลใกล้ชิด</strong>
                  กลุ่มเล็ก ซักถามได้ทันที พร้อมประเมินผลรายบุคคล
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fa-solid fa-shield-check" style="color: #e11d48; font-size: 1.15rem; margin-top: 3px;"></i>
                <div style="font-size: 0.84rem; color: #334155; line-height: 1.4;">
                  <strong style="color: #0f172a; display: block;">การันตีสิทธิ์ราคาโปรโมชั่น</strong>
                  จ่ายราคาสรุปก้อนเดียว ประหยัดคุ้มค่ากว่าสมัครแยก
                </div>
              </div>
            </div>

          </div>

          <!-- Footer Actions -->
          <div style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 14px 30px; display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: wrap;">
            <button type="button" class="btn-modal-cancel" onclick="closeBundleDetailModal()" style="padding: 10px 18px; border-radius: 999px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              ปิดหน้าต่าง
            </button>
            <a href="https://lin.ee/RXrzi1G" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 999px; background: #06c755; color: #ffffff; font-weight: 700; text-decoration: none; font-size: 0.9rem; box-shadow: 0 3px 10px rgba(6, 199, 85, 0.25);">
              <i class="fa-brands fa-line" style="font-size: 1.15rem;"></i> สอบถามทาง LINE
            </a>
            <button type="button" id="btnBundleDetailApplyNow" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; border-radius: 999px; border: none; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.35); transition: all 0.2s;">
              <i class="fa-solid fa-bolt"></i> สมัครแพ็คเกจนี้ทันที
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('modalBundleDetail');
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) closeBundleDetailModal();
      });
    }
  }

  /**
   * Open Bundle Detail Modal
   */
  window.openBundleDetailModal = function (bundleId) {
    ensureBundleDetailModalDom();

    const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
    let bundleObj = bundles.find(b => b.id === bundleId);

    // Fallbacks
    if (!bundleObj) {
      try {
        const raw = JSON.parse(localStorage.getItem('newgen_bundles') || '[]');
        if (Array.isArray(raw)) bundleObj = raw.find(b => b.id === bundleId);
      } catch (e) {}
    }

    if (!bundleObj) {
      alert('ไม่พบข้อมูลแพ็คเกจคอร์สที่ต้องการดูรายละเอียด');
      return;
    }

    const allCourses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
    const allTutors = (window.NewGenDB ? window.NewGenDB.getTutors() : (window.tutorsData || []));
    const childCourseIds = Array.isArray(bundleObj.courseIds) ? bundleObj.courseIds : [];
    const childCourses = allCourses.filter(c => childCourseIds.includes(c.id));

    // Badge & Title
    const badgeEl = document.getElementById('bundleDetailBadge');
    if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-fire"></i> ${escapeHtml(bundleObj.badge || '🔥 แพ็คเกจโปรโมชั่นสุดคุ้ม')}`;

    const titleEl = document.getElementById('bundleDetailTitle');
    if (titleEl) titleEl.textContent = bundleObj.name;

    const descEl = document.getElementById('bundleDetailDesc');
    if (descEl) descEl.textContent = bundleObj.description || 'รวมคอร์สเรียนวิชาหลักเข้มข้น ปูพื้นฐานและติวเจาะลึกแนวข้อสอบจริง';

    // Pricing
    const origNum = parseInt(String(bundleObj.priceOriginal || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const promoNum = parseInt(String(bundleObj.pricePromo || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const savingsVal = Math.max(0, origNum - promoNum);

    const priceOldEl = document.getElementById('bundleDetailPriceOld');
    if (priceOldEl) {
      priceOldEl.textContent = bundleObj.priceOriginal ? `จากปกติ ${bundleObj.priceOriginal} บาท` : (origNum > 0 ? `จากปกติ ${origNum.toLocaleString()} บาท` : '');
      priceOldEl.style.display = (bundleObj.priceOriginal || origNum > 0) ? 'inline' : 'none';
    }

    const pricePromoEl = document.getElementById('bundleDetailPricePromo');
    if (pricePromoEl) pricePromoEl.textContent = bundleObj.pricePromo || '0';

    const priceUnitEl = document.getElementById('bundleDetailPriceUnit');
    if (priceUnitEl) priceUnitEl.textContent = bundleObj.priceUnit || 'บาท / แพ็คเกจ';

    const savingsTagEl = document.getElementById('bundleDetailSavingsTag');
    if (savingsTagEl) {
      if (savingsVal > 0) {
        savingsTagEl.style.display = 'inline-flex';
        savingsTagEl.innerHTML = `<i class="fa-solid fa-gift"></i> ประหยัดทันที ${savingsVal.toLocaleString()}.-`;
      } else {
        savingsTagEl.style.display = 'none';
      }
    }

    const countEl = document.getElementById('bundleDetailCourseCount');
    if (countEl) countEl.textContent = childCourses.length;

    // Courses List
    const coursesListEl = document.getElementById('bundleDetailCoursesList');
    if (coursesListEl) {
      if (childCourses.length === 0) {
        coursesListEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">ไม่พบรายการคอร์สย่อยในแพ็คเกจนี้</div>`;
      } else {
        coursesListEl.innerHTML = childCourses.map((c, idx) => {
          // Tutor details
          const courseTutors = (c.tutorIds || []).map(tid => allTutors.find(t => t.id === tid)).filter(Boolean);
          const tutorText = courseTutors.length > 0
            ? courseTutors.map(t => `${t.nickname ? 'พี่' + t.nickname : t.name} (${t.subject || t.role || ''})`).join(' • ')
            : 'ทีมติวเตอร์ The NEW GEN';

          // Schedule summaries
          const schedItems = Array.isArray(c.scheduleList) && c.scheduleList.length > 0
            ? c.scheduleList.map(s => `
                <div style="font-size: 0.8rem; color: #475569; display: flex; align-items: baseline; gap: 6px; margin-top: 3px;">
                  <i class="fa-regular fa-clock" style="color: #64748b; font-size: 0.75rem;"></i>
                  <span><strong>${escapeHtml(s.type)}:</strong> ${escapeHtml(s.time || '')} <small style="color: #94a3b8;">(${escapeHtml(s.dates || '')})</small></span>
                </div>
              `).join('')
            : `<div style="font-size: 0.8rem; color: #64748b; margin-top: 3px;"><i class="fa-regular fa-calendar-check"></i> ตารางเรียนตามรอบสถาบัน</div>`;

          const coverSrc = window.resolveMediaUrl
            ? window.resolveMediaUrl(c.cover || c.poster || 'assets/images/course-poster-primary.jpg')
            : (c.cover || c.poster || 'assets/images/course-poster-primary.jpg');

          return `
            <div class="bundle-child-course-card" style="display: flex; gap: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s;">
              <div style="width: 105px; height: 120px; border-radius: 10px; overflow: hidden; flex-shrink: 0; position: relative; background: #f1f5f9;">
                <img src="${coverSrc}" alt="${escapeHtml(c.title)}" style="width: 100%; height: 100%; object-fit: cover;">
                <span style="position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(11, 30, 63, 0.85); color: #ffffff; font-size: 0.68rem; padding: 2px 4px; border-radius: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;">
                  คอร์สที่ ${idx + 1}
                </span>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                  <span style="display: inline-block; font-size: 0.72rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 4px;">
                    ${escapeHtml(c.categoryLabel || (c.category === 'primary' ? 'ประถม' : 'มัธยม'))}
                  </span>
                  <span style="font-size: 0.82rem; font-weight: 700; color: #64748b;">
                    ราคาปกติเดี่ยว: <span style="color: #0f172a; font-weight: 800;">${escapeHtml(c.pricePromo || c.priceOriginal || '-')}.-</span>
                  </span>
                </div>
                <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.35;">
                  ${escapeHtml(c.title)}
                </h4>
                <div style="font-size: 0.82rem; color: #0284c7; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-book-open"></i> <span>${escapeHtml(c.subjects || 'วิชาหลัก')}</span>
                </div>
                <div style="font-size: 0.8rem; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span><i class="fa-solid fa-user-graduate" style="color: #8b5cf6;"></i> ติวเตอร์: <strong>${escapeHtml(tutorText)}</strong></span>
                  ${c.totalHours ? `<span style="color: #cbd5e1;">|</span> <span><i class="fa-regular fa-clock" style="color: #10b981;"></i> ${escapeHtml(c.totalHours)}</span>` : ''}
                </div>
                <div style="background: #f8fafc; border-radius: 8px; padding: 6px 10px; border: 1px dashed #cbd5e1;">
                  ${schedItems}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Apply button click
    const applyBtn = document.getElementById('btnBundleDetailApplyNow');
    if (applyBtn) {
      applyBtn.onclick = function () {
        closeBundleDetailModal();
        if (typeof window.openEnrollmentModal === 'function') {
          window.openEnrollmentModal(bundleObj.id, bundleObj);
        }
      };
    }

    // Open Modal
    const modalEl = document.getElementById('modalBundleDetail');
    if (modalEl) {
      modalEl.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  };

  /**
   * Close Bundle Detail Modal
   */
  window.closeBundleDetailModal = function () {
    const modalEl = document.getElementById('modalBundleDetail');
    if (modalEl) {
      modalEl.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Pre-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureEnrollmentModalDom);
  } else {
    ensureEnrollmentModalDom();
  }

})();
