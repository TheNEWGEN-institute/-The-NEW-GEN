/**
 * The NEW GEN Tutoring Institute - Universal Course Enrollment Modal
 * ระบบสมัครเรียนออนไลน์ในเว็บไซต์โดยตรง พร้อมหน้าทบทวนคอร์สและหน้ายืนยันผ่าน LINE Official
 */

(function () {
  'use strict';

  let currentEnrollCourse = null;
  let lastEnrollmentData = null;
  let currentStudentImageBase64 = null;
  let currentStudentImageFileName = '';

  window.handleStudentImageSelect = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('ขออภัยครับ ขนาดไฟล์รูปภาพเกิน 10MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      currentStudentImageBase64 = evt.target.result;
      currentStudentImageFileName = file.name;

      const previewImg = document.getElementById('enrUploadPreviewImg');
      const fileNameEl = document.getElementById('enrUploadFileName');
      const promptEl = document.getElementById('enrUploadPrompt');
      const previewWrap = document.getElementById('enrUploadPreviewWrap');

      if (previewImg) previewImg.src = currentStudentImageBase64;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (promptEl) promptEl.style.display = 'none';
      if (previewWrap) previewWrap.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  };

  window.setStudentUploadedImage = function (base64, fileName = 'attachment.png') {
    currentStudentImageBase64 = base64;
    currentStudentImageFileName = fileName;
    const previewImg = document.getElementById('enrUploadPreviewImg');
    const fileNameEl = document.getElementById('enrUploadFileName');
    const promptEl = document.getElementById('enrUploadPrompt');
    const previewWrap = document.getElementById('enrUploadPreviewWrap');
    if (previewImg) previewImg.src = base64;
    if (fileNameEl) fileNameEl.textContent = fileName;
    if (promptEl) promptEl.style.display = 'none';
    if (previewWrap) previewWrap.style.display = 'flex';
  };

  window.removeStudentUploadedImage = function (e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    currentStudentImageBase64 = null;
    currentStudentImageFileName = '';

    const input = document.getElementById('enrInputStudentImage');
    if (input) input.value = '';

    const promptEl = document.getElementById('enrUploadPrompt');
    const previewWrap = document.getElementById('enrUploadPreviewWrap');
    const previewImg = document.getElementById('enrUploadPreviewImg');

    if (previewImg) previewImg.src = '';
    if (promptEl) promptEl.style.display = 'flex';
    if (previewWrap) previewWrap.style.display = 'none';
  };

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

              <!-- 2. รูปแบบการเรียน (แพ็คเกจ: เลือกแยกรายคอร์สในข้อ 1 แทน) -->
              <div class="enroll-section-block" id="enrollLearningTypeSection">
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
                        <small class="enr-type-full-note" id="enrOnsiteFullNote" style="display: none;"><i class="fa-solid fa-ban"></i> ออนไซต์เต็มแล้ว</small>
                      </div>
                    </div>
                  </label>
                  <label class="enroll-type-radio-card" id="labelTypeOnline">
                    <input type="radio" name="enrollLearningType" value="online" onchange="toggleEnrollType('online')">
                    <div class="type-card-body">
                      <i class="fa-solid fa-laptop"></i>
                      <div>
                        <strong id="enrOnlineTitle">เรียนสด Online (Zoom)</strong>
                        <small id="enrOnlineDesc">เรียนสดพร้อมถามตอบได้ทันที จัดส่งหนังสือฟรีถึงบ้าน</small>                      </div>
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

              <!-- 4.1 แนบรูปภาพประกอบการสมัคร (เช่น ภาพถ่ายผลการเรียน หรือ ภาพแชร์โพสต์กิจกรรม) -->
              <div class="enroll-section-block" id="wrapFieldStudentImage" style="display: none; margin-top: 14px;">
                <label class="enroll-section-label">
                  <i class="fa-solid fa-camera" style="color: var(--color-blue-brand);"></i>
                  <strong id="lblFieldStudentImage">แนบรูปภาพประกอบการสมัคร</strong>
                  <span class="req-star" id="starFieldStudentImage" style="display: none;">*</span>
                </label>
                <div class="enr-upload-zone" id="enrUploadZone" onclick="document.getElementById('enrInputStudentImage').click()">
                  <input type="file" id="enrInputStudentImage" accept="image/*" style="display: none;" onchange="handleStudentImageSelect(event)">
                  <div id="enrUploadPrompt" class="enr-upload-prompt">
                    <i class="fa-solid fa-cloud-arrow-up enr-upload-icon"></i>
                    <div class="enr-upload-text">
                      <span class="enr-upload-title">แตะหรือคลิกเพื่ออัปโหลดรูปภาพ</span>
                      <span class="enr-upload-help" id="helpFieldStudentImage">รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB</span>
                    </div>
                  </div>
                  <div id="enrUploadPreviewWrap" class="enr-upload-preview-wrap" style="display: none;">
                    <img id="enrUploadPreviewImg" src="" alt="ภาพที่แนบ">
                    <div class="enr-upload-preview-info">
                      <span id="enrUploadFileName" class="enr-upload-filename">ภาพที่เลือก</span>
                      <button type="button" class="btn-remove-upload" onclick="removeStudentUploadedImage(event)" title="ลบรูปนี้">
                        <i class="fa-solid fa-trash-can"></i> ลบรูป
                      </button>
                    </div>
                  </div>
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

              <!-- PDPA: ความยินยอมของผู้ปกครองในการเก็บและใช้ข้อมูลส่วนบุคคล -->
              <div class="enroll-section-block enroll-consent-block">
                <label class="enroll-consent-label">
                  <input type="checkbox" id="enrInputConsent" required>
                  <span id="lblEnrollConsent">ข้าพเจ้า (ผู้ปกครอง/นักเรียน) ยินยอมให้สถาบัน The NEW GEN เก็บและใช้ข้อมูลที่กรอกในแบบฟอร์มนี้ เพื่อการติดต่อ ยืนยันการสมัคร และจัดการเรียนการสอนเท่านั้น โดยจะไม่เปิดเผยแก่บุคคลภายนอก และสามารถขอให้ลบข้อมูลได้ทุกเมื่อผ่านช่องทาง LINE ของสถาบัน</span>
                  <span class="req-star">*</span>
                </label>
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
              
              <!-- PRINT-ONLY OFFICIAL HEADER -->
              <div class="enroll-print-header">
                <div class="print-header-left">
                  <div class="print-brand-title">สถาบันกวดวิชา <span>The NEW GEN</span></div>
                  <div class="print-brand-subtitle">The NEW GEN Tutoring Institute • เอกสารยืนยันสิทธิ์การลงทะเบียนเรียน</div>
                </div>
                <div class="print-header-right">
                  <div class="print-pass-badge">ENROLLMENT PASS</div>
                  <div class="print-pass-sub">(ใบยืนยันการสมัครเรียน)</div>
                </div>
              </div>

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
                  <div class="ticket-row" id="confAttachmentRow" style="display: none;">
                    <span class="ticket-k"><i class="fa-solid fa-camera"></i> รูปภาพแนบ:</span>
                    <span class="ticket-v" id="confAttachmentVal">-</span>
                  </div>
                  <div id="confCustomAnswersWrap"></div>

                  <!-- Campaign Chosen Subjects & Schedule Highlight Box -->
                  <div id="confCampaignHighlight" style="display: none; margin-top: 12px; padding: 12px 14px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px;">
                    <div style="font-weight: 800; color: #be123c; font-size: 0.88rem; margin-bottom: 6px;">
                      <i class="fa-solid fa-gift"></i> สรุปวิชาและวันเวลาเรียนโครงการติวฟรีที่เลือก:
                    </div>
                    <div id="confCampaignSubjectsList" style="font-size: 0.82rem; color: #1e293b; display: flex; flex-direction: column; gap: 6px;">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ticket Action Buttons (📸 Save Image & 📄 Save PDF) -->
              <div class="enroll-ticket-actions" id="enrollTicketActions">
                <button type="button" class="btn-save-ticket-img" id="btnSaveTicketImg" onclick="saveEnrollmentConfirmationImage()">
                  <i class="fa-solid fa-camera"></i> 📸 บันทึกภาพลงมือถือ (Save Image)
                </button>
                <button type="button" class="btn-save-ticket-pdf" id="btnSaveTicketPdf" onclick="printEnrollmentConfirmationPdf()">
                  <i class="fa-solid fa-file-pdf"></i> 📄 บันทึกเป็น PDF / สั่งพิมพ์
                </button>
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

    // Campaign mode: this function can be re-run by a cloud sync while the modal is open,
    // so keep notes/address hidden and leave the campaign's own questions untouched
    if (currentEnrollCourse && currentEnrollCourse.isCampaign) {
      hideCampaignExcludedFields();
      return;
    }

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

  // คอร์สนี้ "เหลือเฉพาะออนไลน์" ทั้งคอร์สหรือไม่ (ทุกรอบที่ยังเปิดอยู่ รับเฉพาะออนไลน์)
  function isCourseOnlineOnly(c) {
    if (!c) return false;
    return window.getCourseEffectiveSeats ? Boolean(window.getCourseEffectiveSeats(c).onlineOnly) : false;
  }

  const roundInfo = round => (window.getRoundSeatInfo
    ? window.getRoundSeatInfo(round, { courseRound: true })
    : { isFull: false, closed: false, onsiteFull: false, online: true, onlineOnly: false, capacity: null });

  // รอบเรียนนี้รับใครไม่ได้แล้ว (ติ๊กปิดรับรอบนี้ — ออนไลน์รับได้เสมอ)
  function isRoundBlocked(round) {
    return roundInfo(round).isFull;
  }

  function findCourseRound(course, value) {
    if (!course || !Array.isArray(course.scheduleList) || !value) return null;
    return course.scheduleList.find(r => `${r.type || ''} | ${r.time || ''} | ${r.dates || ''}` === value)
      || course.scheduleList.find(r => (r.type || '') === String(value).split(' | ')[0])
      || null;
  }

  // สมัครออนไซต์ในรอบที่เลือกไม่ได้ (ติ๊กเฉพาะออนไลน์ / ออนไซต์เต็ม) → ต้องเรียน Online
  // (ใช้ข้อมูลที่นั่งล่าสุดเสมอ ไม่ใช่สำเนาตอนเปิดฟอร์ม)
  function isOnsiteBlocked(courseRef, roundValue) {
    const courses = window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []);
    const course = (courseRef && courses.find(x => x.id === courseRef.id)) || courseRef;
    const round = findCourseRound(course, roundValue);
    if (!round) return isCourseOnlineOnly(course);
    const info = roundInfo(round);
    const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(course) : { remainingSeats: 1 };
    return info.onsiteFull || (info.capacity !== null && Number(eff.remainingSeats) <= 0);
  }

  // การ์ดเลือกรอบเรียน: แสดงที่นั่งออนไซต์คงเหลือ/เหลือเฉพาะออนไลน์ รอบที่ปิดรับกดไม่ได้ และเลือกรอบแรกที่ยังรับได้ไว้ให้
  function renderRoundCards(schedules, inputName, extraAttrs, labelStyle) {
    // เลือกรอบที่ยังรับออนไซต์ได้ไว้ก่อน ถ้าไม่มีค่อยเลือกรอบแรกที่ยังสมัคร (ออนไลน์) ได้
    const onsiteOpen = schedules.findIndex(s => !roundInfo(s).onsiteFull);
    const firstOpen = onsiteOpen !== -1 ? onsiteOpen : schedules.findIndex(s => !isRoundBlocked(s));
    return schedules.map((s, idx) => {
      const info = roundInfo(s);
      const blocked = info.isFull;
      const selected = idx === firstOpen;
      const value = `${s.type || ''} | ${s.time || ''} | ${s.dates || ''}`;
      let seatTag = '';
      if (blocked) {
        seatTag = `<span class="badge badge-seat-full" style="font-size: 0.72rem;">🛑 ${info.closed ? 'ปิดรับรอบนี้' : 'เต็มแล้ว'}</span>`;
      } else if (info.onlineOnly) {
        seatTag = '<span class="sched-seat-tag online"><i class="fa-solid fa-laptop"></i> เหลือเฉพาะออนไลน์</span>';
      } else {
        if (info.capacity !== null) seatTag += `<span class="sched-seat-tag ${info.remaining <= 3 ? 'low' : ''}"><i class="fa-solid fa-chair"></i> ออนไซต์เหลือ ${info.remaining}/${info.capacity} ที่</span> `;
        seatTag += '<span class="sched-seat-tag online"><i class="fa-solid fa-laptop"></i> + ออนไลน์</span>';
      }
      return `
        <label class="enroll-schedule-card ${selected ? 'active' : ''} ${blocked ? 'disabled' : ''}" onclick="selectEnrollSchedule(this)" style="${labelStyle}">
          <input type="radio" name="${inputName}" ${extraAttrs} value="${escapeHtml(value)}" ${selected ? 'checked' : ''} ${blocked ? 'disabled' : ''}>
          <div class="sched-card-body">
            <div class="sched-type-row">
              <strong>${escapeHtml(s.type)}</strong>
              ${s.time && !String(s.time).includes('เต็มแล้ว') ? `<span class="sched-time-tag"><i class="fa-regular fa-clock"></i> ${escapeHtml(s.time)}</span>` : ''}
            </div>
            ${s.dates && !String(s.dates).includes('ปิดรับ') ? `<div class="sched-dates-row"><i class="fa-regular fa-calendar"></i> ${escapeHtml(s.dates)}</div>` : ''}
            ${seatTag ? `<div class="sched-seat-row">${seatTag}</div>` : ''}
          </div>
        </label>
      `;
    }).join('');
  }

  // ตรวจรอบ/วิชาที่ถูกเลือกไว้กับข้อมูลที่นั่งล่าสุด: รอบที่เพิ่งปิดรับจะถูกปิดและยกเลิกการเลือก (ข้อมูลที่กรอกไว้ไม่หาย)
  function refreshRoundAvailability() {
    const seat = window.getRoundSeatInfo;
    if (!seat || !currentEnrollCourse) return;
    const courses = window.NewGenDB ? window.NewGenDB.getCourses() : [];
    const disable = input => {
      input.checked = false;
      input.disabled = true;
      const card = input.closest('label');
      if (card) card.classList.add('disabled');
      card?.classList.remove('active');
    };
    const radioFull = (courseId, value) => {
      const c = courses.find(x => x.id === courseId);
      if (!c) return false;
      const round = findCourseRound(c, value);
      const courseFull = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c).isFull : c.isFull === true;
      return Boolean(courseFull || (round && isRoundBlocked(round)));
    };
    if (currentEnrollCourse.isCampaign) {
      const camp = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
      const subs = camp && Array.isArray(camp.subjects) ? camp.subjects : [];
      document.querySelectorAll('input[name="campaignSubjectChoices"][type="checkbox"]').forEach(cb => {
        const s = subs.find(x => x.id === cb.value);
        if (s && seat(s).isFull) disable(cb);
      });
    } else if (currentEnrollCourse.isBundle) {
      document.querySelectorAll('input[type="radio"][data-course-id]').forEach(rb => {
        if (radioFull(rb.dataset.courseId, rb.value)) disable(rb);
      });
    } else {
      document.querySelectorAll('input[name="enrollScheduleChoice"][type="radio"]').forEach(rb => {
        if (radioFull(currentEnrollCourse.id, rb.value)) disable(rb);
      });
    }
    applyLearningTypeLocks();
  }

  // ล็อกตัวเลือก Onsite ตามรอบที่เลือก (เหลือเฉพาะออนไลน์ → เลือก Online ให้ + ข้อความกำกับ) — Online เลือกได้เสมอ
  function lockTypeInputs(inputName, onsiteBlocked, onsiteNote) {
    const onsite = document.querySelector(`input[name="${inputName}"][value="onsite"]`);
    const online = document.querySelector(`input[name="${inputName}"][value="online"]`);
    if (!onsite || !online) return;
    onsite.disabled = onsiteBlocked;
    online.disabled = false;
    if (onsiteBlocked && onsite.checked) online.checked = true;
    [[onsite, onsiteBlocked], [online, false]].forEach(([input, blocked]) => {
      const card = input.closest('label');
      if (!card) return;
      card.classList.toggle('disabled', blocked);
      card.classList.toggle('active', input.checked);
    });
    if (onsiteNote) onsiteNote.style.display = onsiteBlocked ? '' : 'none';
  }

  function applyLearningTypeLocks() {
    if (!currentEnrollCourse) return;
    const esc = v => (window.CSS && CSS.escape ? CSS.escape(v) : v);
    if (currentEnrollCourse.isBundle) {
      (currentEnrollCourse.childCourses || []).forEach(cc => {
        const sel = document.querySelector(`input[name="enrollScheduleChoice_${esc(cc.id)}"]:checked`);
        lockTypeInputs(`enrollLearningType_${cc.id}`, isOnsiteBlocked(cc, sel ? sel.value : ''),
          document.querySelector(`[data-full-note-for="${esc(cc.id)}"]`));
      });
    } else if (currentEnrollCourse.isCampaign) {
      lockTypeInputs('enrollLearningType', false, document.getElementById('enrOnsiteFullNote'));
    } else {
      const sel = document.querySelector('input[name="enrollScheduleChoice"]:checked');
      lockTypeInputs('enrollLearningType', isOnsiteBlocked(currentEnrollCourse, sel ? sel.value : ''),
        document.getElementById('enrOnsiteFullNote'));
    }
  }

  window.syncBundleTypePill = function (input) {
    const group = input.closest('.bundle-type-options');
    if (!group) return;
    group.querySelectorAll('.bundle-type-pill').forEach(p => {
      const r = p.querySelector('input[type="radio"]');
      p.classList.toggle('active', Boolean(r && r.checked));
    });
  };

  // Campaign form has no notes or shipping address fields
  function hideCampaignExcludedFields() {
    [['wrapFieldNotes', 'enrInputNotes'], ['wrapFieldShippingAddress', 'enrInputAddress']].forEach(([wrapId, inputId]) => {
      const wrapEl = document.getElementById(wrapId);
      const inputEl = document.getElementById(inputId);
      if (wrapEl) wrapEl.style.display = 'none';
      if (inputEl) {
        inputEl.required = false;
        inputEl.value = '';
      }
    });
  }

  /**
   * Open Enrollment Modal for specific course or bundle
   */
  window.openEnrollmentModal = function (courseId, bundleDataFallback, campaignFallback) {
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

        const bundleStatus = window.isBundleFull ? window.isBundleFull(bundleObj, courses) : { isFull: false, fullCourses: [] };
        if (bundleStatus.isFull) {
          const fullListStr = bundleStatus.fullCourses.map(fc => `• ${fc.title}`).join('\n');
          const lineUrl = getContactLineUrl();
          const wantLine = confirm(
            `ขออภัยครับ ไม่สามารถเปิดรับสมัครแพ็คเกจ "${bundleObj.name}" ได้ในขณะนี้\n\n` +
            `เนื่องจากมีคอร์สในแพ็คเกจที่นั่งเต็มแล้ว ดังนี้:\n${fullListStr}\n\n` +
            `ต้องการทัก LINE สถาบันเพื่อสอบถามรอบถัดไป หรือลงชื่อสำรองที่นั่ง (Waiting List) หรือไม่ครับ?`
          );
          if (wantLine) window.open(lineUrl, '_blank', 'noopener,noreferrer');
          return;
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
          isFull: bundleStatus.isFull
        };
      }
    }

    // If not found in courses or bundles, check if it's Campaign!
    if (!course) {
      const camp = campaignFallback || (window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null);
      if (courseId === 'campaign' || (!courseId && camp) || (camp && camp.enabled !== false)) {
        course = {
          id: 'campaign-free',
          title: camp ? (camp.title || 'โครงการติวฟรี The NEW GEN') : 'โครงการติวฟรี The NEW GEN',
          name: camp ? (camp.title || 'โครงการติวฟรี') : 'โครงการติวฟรี',
          isCampaign: true,
          categoryLabel: camp ? (camp.badge || 'โครงการพิเศษ • ติวฟรี 100%') : 'โครงการพิเศษ • ติวฟรี 100%',
          subjects: '',
          location: 'สถาบัน The NEW GEN (เรียนสด Onsite & Online)',
          totalHours: 'หลักสูตรติวพิเศษโครงการ',
          pricePromo: '0',
          priceOriginal: '',
          priceUnit: 'บาท (ฟรี! ไม่มีค่าใช้จ่าย)',
          cover: (camp && camp.image) ? camp.image : 'assets/images/course-poster-primary.jpg',
          poster: (camp && camp.image) ? camp.image : 'assets/images/course-poster-primary.jpg',
          scheduleList: [
            { type: 'รอบเรียนโครงการติวฟรี (เรียนสด Onsite & Online)', dates: 'เจ้าหน้าที่จะติดต่อประสานงานยืนยันรอบเรียนกับผู้ปกครอง', time: 'ตามรอบที่สถาบันแจ้งทาง LINE' }
          ],
          remainingSeats: 30,
          maxSeats: 30,
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

    // Populate Review Banner (แพ็คเกจ: ไม่แสดงรูปปก เหลือเฉพาะข้อความรายละเอียดแพ็ค)
    const reviewCardEl = document.getElementById('enrollCourseReviewCard');
    if (reviewCardEl) reviewCardEl.classList.toggle('no-cover', Boolean(course.isBundle));
    const coverEl = document.getElementById('enrReviewCover');
    if (coverEl && !course.isBundle) coverEl.src = window.resolveMediaUrl ? window.resolveMediaUrl(course.cover || course.poster || 'assets/images/course-poster-primary.jpg') : (course.cover || course.poster);
    const courseOnlineOnly = !course.isBundle && !course.isCampaign && isCourseOnlineOnly(course);

    const titleEl = document.getElementById('enrReviewTitle');
    if (titleEl) titleEl.textContent = course.title || 'คอร์สเรียน The NEW GEN';

    const catEl = document.getElementById('enrReviewCategory');
    if (catEl) catEl.textContent = course.categoryLabel || (course.category === 'primary' ? 'ระดับประถมศึกษา' : 'ระดับมัธยมศึกษา');

    // Requirement 1: In campaign mode, completely hide the review phrase
    const subEl = document.getElementById('enrReviewSubjects');
    if (subEl) {
      if (course.isCampaign) {
        subEl.style.display = 'none';
      } else if (course.isBundle && Array.isArray(course.childCourses) && course.childCourses.length > 0) {
        subEl.style.display = '';
        subEl.innerHTML = `
          <span class="enr-bundle-list-head"><i class="fa-solid fa-layer-group"></i> คอร์สในแพ็คเกจนี้</span>
          <ul class="enr-bundle-course-list">
            ${course.childCourses.map(cc => `<li><span>${escapeHtml(cc.title)}</span>${cc.totalHours ? ` <small>(${escapeHtml(cc.totalHours)})</small>` : ''}</li>`).join('')}
          </ul>`;
      } else {
        subEl.style.display = '';
        subEl.innerHTML = `<i class="fa-solid fa-book-open"></i> ${course.subjects || 'วิทยาศาสตร์ • คณิตศาสตร์ • ภาษาอังกฤษ'}`;
      }
    }

    // แพ็คเกจ: เลือกรูปแบบการเรียนแยกรายคอร์ส (ในกล่องของแต่ละคอร์สด้านบน) จึงซ่อนตัวเลือกรวม
    const learningTypeSection = document.getElementById('enrollLearningTypeSection');
    if (learningTypeSection) learningTypeSection.style.display = course.isBundle ? 'none' : '';

    // Campaign mode: show only learning-type titles (hide descriptions)
    ['enrOnsiteDesc', 'enrOnlineDesc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = course.isCampaign ? 'none' : '';
    });

    // Campaign mode: remove the "notes" and "shipping address" fields entirely
    if (course.isCampaign) {
      hideCampaignExcludedFields();
    }

    const locEl = document.getElementById('enrReviewLocation');
    if (locEl) {
      locEl.textContent = courseOnlineOnly
        ? 'ออนไซต์เต็มแล้ว • เปิดรับเฉพาะเรียนออนไลน์ (Zoom)'
        : (course.location || 'เรียนสด Onsite สถาบัน The NEW GEN');
    }

    const hrsEl = document.getElementById('enrReviewHours');
    if (hrsEl) {
      hrsEl.textContent = course.totalHours || '42 ชั่วโมงตลอดเทอม';
      // แพ็คเกจแสดงชั่วโมงเรียนรายคอร์สในรายการด้านบนแล้ว
      const hrsChip = hrsEl.closest('.enr-meta-chip');
      if (hrsChip) hrsChip.style.display = course.isBundle ? 'none' : '';
    }

    const priceEl = document.getElementById('enrReviewPrice');
    if (priceEl) priceEl.textContent = course.isBundle && window.priceNumberText ? window.priceNumberText(course.pricePromo || '0') : (course.pricePromo || '4,500');

    const unitEl = document.getElementById('enrReviewUnit');
    if (unitEl) unitEl.textContent = course.priceUnit || 'บาท / เทอม (แบ่งชำระได้)';

    const seatBadgeEl = document.getElementById('enrReviewSeatBadge');
    if (seatBadgeEl) {
      if (course.isCampaign) {
        seatBadgeEl.innerHTML = `<span class="badge" style="background:#fef2f2; color:#dc2626; font-weight:800; border:1.2px solid #fecaca;"><i class="fa-solid fa-gift"></i> สิทธิ์เรียนฟรี 100%</span>`;
      } else if (course.isBundle) {
        seatBadgeEl.innerHTML = `<span class="badge badge-rose" style="background:#ffe4e6; color:#e11d48; font-weight:700; border:1px solid #fecdd3;"><i class="fa-solid fa-fire"></i> แพ็คเกจโปรโมชั่น</span>`;
      } else if (window.getCourseSeatBadgeHtml) {
        seatBadgeEl.innerHTML = window.getCourseSeatBadgeHtml(course);
      }
    }

    // Configure Student Image Upload Field Visibility & Labels
    const wrapImg = document.getElementById('wrapFieldStudentImage');
    const lblImg = document.getElementById('lblFieldStudentImage');
    const starImg = document.getElementById('starFieldStudentImage');
    const helpImg = document.getElementById('helpFieldStudentImage');

    if (typeof window.removeStudentUploadedImage === 'function') {
      window.removeStudentUploadedImage();
    }

    const campObj = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
    const isCamp = Boolean(course.isCampaign || courseId === 'campaign');
    const cfgObj = (window.NewGenDB && typeof window.NewGenDB.getEnrollmentConfig === 'function')
      ? window.NewGenDB.getEnrollmentConfig()
      : (window.enrollmentConfigData || {});

    const isUploadEnabled = isCamp
      ? (campObj ? campObj.studentUploadEnabled !== false : true)
      : Boolean(cfgObj && cfgObj.studentUploadEnabled);

    const isUploadRequired = isCamp
      ? Boolean(campObj && campObj.studentUploadRequired)
      : Boolean(cfgObj && cfgObj.studentUploadRequired);

    const uploadLabelText = isCamp
      ? ((campObj && campObj.studentUploadLabel) ? campObj.studentUploadLabel : 'แนบรูปภาพหลักฐาน เช่น ภาพถ่ายการแชร์โพสต์กิจกรรม หรือ ใบแสดงผลการเรียนล่าสุด')
      : ((cfgObj && cfgObj.studentUploadLabel) ? cfgObj.studentUploadLabel : 'แนบรูปภาพประกอบการสมัคร (เช่น ภาพถ่ายผลการเรียน)');

    const uploadHelpText = isCamp
      ? ((campObj && campObj.studentUploadHelp) ? campObj.studentUploadHelp : 'รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB')
      : ((cfgObj && cfgObj.studentUploadHelp) ? cfgObj.studentUploadHelp : 'รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB');

    if (wrapImg) {
      wrapImg.style.display = isUploadEnabled ? 'block' : 'none';
      wrapImg.dataset.required = isUploadRequired ? 'true' : 'false';
      if (lblImg) lblImg.textContent = uploadLabelText;
      if (starImg) starImg.style.display = isUploadRequired ? 'inline' : 'none';
      if (helpImg) helpImg.textContent = uploadHelpText;
    }

    // Populate Schedules or Campaign Subjects
    const schedContainer = document.getElementById('enrollScheduleList');
    const schedSection = document.getElementById('enrollScheduleSection');
    if (schedContainer) {
      if (course.isCampaign) {
        // Requirement 2: Free campaign subjects multi-selection with date, time, and details
        schedSection.style.display = 'block';
        const schedLabel = schedSection.querySelector('.enroll-section-label');
        if (schedLabel) {
          schedLabel.innerHTML = `<i class="fa-solid fa-list-check" style="color: #e11d48;"></i> <strong>เลือกวิชาที่ต้องการสมัครเรียนฟรี (เลือกได้มากกว่า 1 วิชา)</strong> <span class="req-star">*</span>`;
        }

        const campData = campaignFallback || (window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null);
        const subjects = (campData && Array.isArray(campData.subjects) && campData.subjects.length > 0)
          ? campData.subjects.filter(s => s.active !== false && s.enabled !== false)
          : ((window.DEFAULT_POPUP_CAMPAIGN && window.DEFAULT_POPUP_CAMPAIGN.subjects) || []);

        if (subjects.length > 0) {
          const seatOf = window.getRoundSeatInfo || (() => ({ isFull: false, capacity: null }));
          const firstOpen = subjects.findIndex(s => !seatOf(s).isFull);
          schedContainer.innerHTML = `
            <div class="campaign-subjects-grid">
              ${subjects.map((s, idx) => {
                const info = seatOf(s);
                const checked = idx === firstOpen ? 'checked' : '';
                const activeClass = idx === firstOpen ? 'active' : '';
                return `
                  <label class="campaign-subject-card ${activeClass} ${info.isFull ? 'disabled' : ''}" onclick="toggleCampaignSubjectCard(this, event)">
                    <input type="checkbox" name="campaignSubjectChoices" value="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" data-grade="${escapeHtml(s.grade || '')}" data-date="${escapeHtml(s.date || '')}" data-time="${escapeHtml(s.time || '')}" data-detail="${escapeHtml(s.detail || '')}" ${checked} ${info.isFull ? 'disabled' : ''} onchange="syncCampaignSubjectCard(this)">
                    <div class="campaign-subject-info">
                      <div class="campaign-subject-header">
                        <span class="campaign-subject-title">${escapeHtml(s.name)}</span>
                        ${s.grade ? `<span class="campaign-subject-grade">${escapeHtml(s.grade)}</span>` : ''}
                        ${info.isFull
                          ? '<span class="badge badge-seat-full" style="font-size: 0.72rem;">🛑 เต็มแล้ว</span>'
                          : (info.capacity !== null ? `<span class="sched-seat-tag ${info.remaining <= 3 ? 'low' : ''}"><i class="fa-solid fa-chair"></i> เหลือ ${info.remaining}/${info.capacity} ที่</span>` : '')}
                      </div>
                      ${(s.date || s.time) ? `
                        <div class="campaign-subject-time">
                          <i class="fa-regular fa-clock"></i>
                          <span>${escapeHtml(s.date || '')} ${escapeHtml(s.time || '')}</span>
                        </div>
                      ` : ''}
                      ${s.detail ? `<div class="campaign-subject-detail">${escapeHtml(s.detail)}</div>` : ''}
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          `;
        } else {
          schedContainer.innerHTML = `<div style="padding: 12px 14px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 8px; color: #be123c; font-size: 0.88rem;">เปิดรับสมัครโครงการติวฟรีทุกรายวิชา (ทีมงานจะประสานงานแจ้งรอบเรียนให้ทราบ)</div><input type="hidden" name="campaignSubjectChoices" value="all" data-name="ทุกวิชาโครงการติวฟรี">`;
        }
      } else {
        const schedLabel = schedSection.querySelector('.enroll-section-label');
        if (schedLabel) {
          schedLabel.innerHTML = `<i class="fa-regular fa-calendar-check" style="color: var(--color-blue-brand);"></i> <strong>เลือกรอบ / วันเวลาเรียนที่ต้องการ</strong> <span class="req-star">*</span>`;
        }

        if (course.isBundle && Array.isArray(course.childCourses) && course.childCourses.length > 0) {
          schedSection.style.display = 'block';
          schedContainer.innerHTML = course.childCourses.map((cc, cIdx) => {
            const schedules = Array.isArray(cc.scheduleList) && cc.scheduleList.length > 0
              ? cc.scheduleList
              : [{ type: 'รอบเรียนปกติ', time: 'ตามรอบสถาบัน', dates: 'เปิดเทอม' }];
            const typeName = `enrollLearningType_${cc.id}`;

            return `
              <div class="bundle-course-sched-group" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;">
                <div class="bundle-sched-head">
                  <span class="bundle-sched-num">${cIdx + 1}</span>
                  <strong class="bundle-sched-title">${escapeHtml(cc.title)}</strong>
                  <span class="bundle-sched-count">วิชาที่ ${cIdx + 1}/${course.childCourses.length}</span>
                </div>

                <div class="bundle-sub-label"><i class="fa-regular fa-calendar-check"></i> รอบเรียน <span class="req-star">*</span></div>
                <div class="enroll-schedule-grid" style="display: grid; gap: 8px; margin-bottom: 10px;">
                  ${renderRoundCards(schedules, `enrollScheduleChoice_${cc.id}`, `data-course-id="${escapeHtml(cc.id)}" data-course-title="${escapeHtml(cc.title)}"`, 'margin: 0;')}
                </div>

                <div class="bundle-sub-label"><i class="fa-solid fa-chalkboard-user"></i> รูปแบบการเรียน (ตามรอบที่เลือก) <span class="req-star">*</span></div>
                <div class="bundle-type-options">
                  <label class="bundle-type-pill">
                    <input type="radio" name="${typeName}" value="onsite" checked onchange="syncBundleTypePill(this)">
                    <span><i class="fa-solid fa-school"></i> Onsite ที่สถาบัน</span>
                    <small class="enr-type-full-note" data-full-note-for="${escapeHtml(cc.id)}" style="display: none;"><i class="fa-solid fa-ban"></i> ออนไซต์เต็มแล้ว</small>
                  </label>
                  <label class="bundle-type-pill">
                    <input type="radio" name="${typeName}" value="online" onchange="syncBundleTypePill(this)">
                    <span><i class="fa-solid fa-laptop"></i> Online (Zoom)</span>                  </label>
                </div>
              </div>
            `;
          }).join('');
        } else if (Array.isArray(course.scheduleList) && course.scheduleList.length > 0) {
          schedSection.style.display = 'block';
          schedContainer.innerHTML = renderRoundCards(course.scheduleList, 'enrollScheduleChoice', '', '');
        } else {
          schedSection.style.display = 'none';
          schedContainer.innerHTML = `<input type="hidden" name="enrollScheduleChoice" value="ตารางเรียนมาตรฐานตามรอบคอร์ส">`;
        }
      }
    }

    // Configure Custom Questions (Campaign Specific or General)
    const customSection = document.getElementById('enrollCustomSection');
    const customContainer = document.getElementById('enrCustomFieldsContainer');
    if (course.isCampaign) {
      const campData = campaignFallback || (window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null);
      if (campData && Array.isArray(campData.customQuestions) && campData.customQuestions.length > 0) {
        if (customSection && customContainer) {
          customSection.style.display = 'block';
          customContainer.innerHTML = campData.customQuestions.map((q, idx) => {
            const req = q.required ? '<span class="req-star">*</span>' : '';
            const reqAttr = q.required ? 'required' : '';
            if (q.type === 'textarea') {
              return `
                <div class="enr-form-field">
                  <label>${escapeHtml(q.label)} ${req}</label>
                  <textarea name="campaignCustomQ_${idx}" data-qid="${escapeHtml(q.id || idx)}" data-label="${escapeHtml(q.label)}" placeholder="${escapeHtml(q.placeholder || '')}" ${reqAttr} rows="2"></textarea>
                </div>
              `;
            } else if (q.type === 'select' && Array.isArray(q.options) && q.options.length > 0) {
              return `
                <div class="enr-form-field">
                  <label>${escapeHtml(q.label)} ${req}</label>
                  <select name="campaignCustomQ_${idx}" data-qid="${escapeHtml(q.id || idx)}" data-label="${escapeHtml(q.label)}" ${reqAttr}>
                    <option value="">${escapeHtml(q.placeholder || '-- กรุณาเลือก --')}</option>
                    ${q.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                  </select>
                </div>
              `;
            } else {
              return `
                <div class="enr-form-field">
                  <label>${escapeHtml(q.label)} ${req}</label>
                  <input type="text" name="campaignCustomQ_${idx}" data-qid="${escapeHtml(q.id || idx)}" data-label="${escapeHtml(q.label)}" placeholder="${escapeHtml(q.placeholder || '')}" ${reqAttr}>
                </div>
              `;
            }
          }).join('');
        }
      } else {
        if (customSection) customSection.style.display = 'none';
        if (customContainer) customContainer.innerHTML = '';
      }
    } else {
      if (typeof window.applyEnrollmentConfig === 'function') {
        window.applyEnrollmentConfig();
      }
    }

    // Reset Form fields
    document.getElementById('studentEnrollForm').reset();
    toggleEnrollType('onsite');
    applyLearningTypeLocks();

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
    if (modalEl) {
      modalEl.classList.add('active');
      modalEl.style.setProperty('display', 'flex', 'important');
      modalEl.style.setProperty('opacity', '1', 'important');
      modalEl.style.setProperty('visibility', 'visible', 'important');
      modalEl.style.setProperty('pointer-events', 'auto', 'important');
    }
    document.body.style.overflow = 'hidden';
  };

  window.closeEnrollmentModal = function () {
    const modalEl = document.getElementById('modalStudentEnrollment');
    if (modalEl) {
      modalEl.classList.remove('active');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('opacity', '0', 'important');
      modalEl.style.setProperty('visibility', 'hidden', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
  };

  window.selectEnrollSchedule = function (cardEl) {
    if (cardEl.classList.contains('disabled')) return;
    const groupGrid = cardEl.closest('.enroll-schedule-grid') || cardEl.closest('#enrollScheduleList') || document;
    groupGrid.querySelectorAll('.enroll-schedule-card').forEach(c => c.classList.remove('active'));
    cardEl.classList.add('active');
    const radio = cardEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    // รูปแบบการเรียนที่เลือกได้ขึ้นกับรอบ (ออนไซต์เต็ม → Online เท่านั้น)
    applyLearningTypeLocks();
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
    const shippingAddress = currentEnrollCourse.isCampaign ? '' : document.getElementById('enrInputAddress').value.trim();
    const notes = currentEnrollCourse.isCampaign ? '' : document.getElementById('enrInputNotes').value.trim();

    if (!studentName || !nickname || !grade || !school || !parentPhone || !lineId) {
      alert('กรุณากรอกข้อมูลที่มีเครื่องหมาย (*) ให้ครบถ้วน');
      return;
    }

    if (!document.getElementById('enrInputConsent')?.checked) {
      alert('กรุณากดยินยอมการเก็บและใช้ข้อมูลส่วนบุคคลก่อนส่งใบสมัคร');
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

    // Schedule choice collection (multi-course support for bundles and free campaign)
    let scheduleChoice = '';
    const childSchedulesMap = {};
    const childLearningTypes = {};
    const isBundle = Boolean(currentEnrollCourse && currentEnrollCourse.isBundle);
    const childCourseIds = isBundle && Array.isArray(currentEnrollCourse.courseIds) ? currentEnrollCourse.courseIds : [];
    let selectedSubjects = [];

    if (currentEnrollCourse && currentEnrollCourse.isCampaign) {
      const checkedBoxes = Array.from(document.querySelectorAll('input[name="campaignSubjectChoices"]:checked'));
      if (checkedBoxes.length === 0) {
        alert('⚠️ กรุณาเลือกวิชาที่ต้องการสมัครเรียนฟรีอย่างน้อย 1 วิชาครับ');
        return;
      }
      selectedSubjects = checkedBoxes.map(cb => ({
        id: cb.value,
        name: cb.dataset.name || cb.value,
        grade: cb.dataset.grade || '',
        date: cb.dataset.date || '',
        time: cb.dataset.time || '',
        detail: cb.dataset.detail || ''
      }));
      scheduleChoice = selectedSubjects.map(s => `${s.name} (${s.date} ${s.time})`).join(' | ');

      // Collect Campaign Custom Questions if any
      const campQInputs = document.querySelectorAll('[name^="campaignCustomQ_"]');
      campQInputs.forEach(inp => {
        const label = inp.dataset.label || 'คำถามพิเศษ';
        const val = (inp.value || '').trim();
        if (val) {
          customAnswers.push({
            id: inp.dataset.qid,
            label: label,
            value: val
          });
        }
      });
    } else if (isBundle && Array.isArray(currentEnrollCourse.childCourses) && currentEnrollCourse.childCourses.length > 0) {
      const scheduleLines = [];
      let missingRound = '';
      let onsiteBlocked = '';
      currentEnrollCourse.childCourses.forEach(cc => {
        const radios = document.querySelectorAll(`input[name="enrollScheduleChoice_${cc.id}"]`);
        const sel = document.querySelector(`input[name="enrollScheduleChoice_${cc.id}"]:checked:not(:disabled)`);
        if (radios.length > 0 && !sel && !missingRound) missingRound = cc.title;
        const val = sel ? sel.value : (cc.scheduleList?.[0]?.type || 'รอบเรียนปกติ');
        childSchedulesMap[cc.id] = val;
        // รูปแบบการเรียนแยกรายคอร์ส ตามรอบที่เลือก (เหลือเฉพาะออนไลน์ = Online เท่านั้น)
        const ccOnsiteBlocked = isOnsiteBlocked(cc, val);
        const typeSel = document.querySelector(`input[name="enrollLearningType_${cc.id}"]:checked:not(:disabled)`);
        const ccType = typeSel ? typeSel.value : (ccOnsiteBlocked ? 'online' : 'onsite');
        if (!onsiteBlocked && ccType !== 'online' && ccOnsiteBlocked) onsiteBlocked = cc.title;
        childLearningTypes[cc.id] = ccType;
        scheduleLines.push(`• [${cc.title}]: ${val} (เรียน ${ccType === 'online' ? 'Online' : 'Onsite'})`);
      });
      if (missingRound) {
        alert(`⚠️ กรุณาเลือกรอบเรียนของ "${missingRound}" (รอบที่เต็มแล้วเลือกไม่ได้)`);
        return;
      }
      if (onsiteBlocked) {
        alert(`⚠️ รอบที่เลือกของ "${onsiteBlocked}" เหลือเฉพาะเรียนออนไลน์ กรุณาเลือก "Online" สำหรับคอร์สนี้`);
        applyLearningTypeLocks();
        return;
      }
      scheduleChoice = scheduleLines.join('\n');
    } else {
      const radios = document.querySelectorAll('input[name="enrollScheduleChoice"][type="radio"]');
      const schedSelected = document.querySelector('input[name="enrollScheduleChoice"]:checked:not(:disabled)');
      if (radios.length > 0 && !schedSelected) {
        alert('⚠️ กรุณาเลือกรอบเรียนที่ต้องการ (รอบที่เต็มแล้วเลือกไม่ได้)');
        return;
      }
      scheduleChoice = schedSelected ? schedSelected.value : (currentEnrollCourse.scheduleList?.[0]?.type || 'รอบเรียนปกติ');
    }

    // Learning type (แพ็คเกจ: ถ้าทุกคอร์สเหมือนกันใช้ค่านั้น ถ้าต่างกัน = "mixed" และดูรายคอร์สใน childLearningTypes)
    let learningType;
    if (isBundle && Object.keys(childLearningTypes).length > 0) {
      const kinds = [...new Set(Object.values(childLearningTypes))];
      learningType = kinds.length === 1 ? kinds[0] : 'mixed';
    } else {
      const typeSelected = document.querySelector('input[name="enrollLearningType"]:checked:not(:disabled)');
      learningType = typeSelected ? typeSelected.value : 'onsite';
      if (!currentEnrollCourse.isCampaign && learningType !== 'online' && isOnsiteBlocked(currentEnrollCourse, scheduleChoice)) {
        alert('⚠️ รอบนี้เหลือเฉพาะเรียนออนไลน์ กรุณาเลือก "เรียนสด Online"');
        applyLearningTypeLocks();
        return;
      }
    }

    const submitBtn = document.getElementById('btnEnrollSubmit');
    const origBtnHtml = submitBtn.innerHTML;

    // Safety check for bundle full before saving
    if (isBundle) {
      const allCourses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
      const bundleStatus = window.isBundleFull ? window.isBundleFull(currentEnrollCourse, allCourses) : { isFull: false, fullCourses: [] };
      if (bundleStatus.isFull) {
        const fullListStr = bundleStatus.fullCourses.map(fc => `• ${fc.title}`).join('\n');
        alert(`ขออภัยครับ ไม่สามารถบันทึกการสมัครได้ เนื่องจากมีคอร์สในแพ็คเกจนี้ที่นั่งเต็มแล้ว:\n${fullListStr}`);
        return;
      }
    }

    // Validation for Student Uploaded Image
    const wrapImg = document.getElementById('wrapFieldStudentImage');
    const isImgRequired = wrapImg && wrapImg.dataset.required === 'true';
    const isImgVisible = wrapImg && wrapImg.style.display !== 'none';

    if (isImgVisible && isImgRequired && !currentStudentImageBase64) {
      const lbl = document.getElementById('lblFieldStudentImage')?.textContent || 'รูปภาพประกอบการสมัคร';
      alert(`กรุณาแนบรูปภาพ: "${lbl}" ให้เรียบร้อยก่อนกดยืนยัน`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...';

    const restoreSubmitBtn = () => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnHtml;
    };

    // รูปที่แนบ → อัปโหลดเข้า bucket ส่วนตัว (เปิดดูได้เฉพาะแอดมิน)
    let studentImageUrl = '';
    if (currentStudentImageBase64) {
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปโหลดรูปภาพ...';
      try {
        const arr = currentStudentImageBase64.split(',');
        const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });
        const fname = currentStudentImageFileName || `student-${Date.now()}.jpg`;
        studentImageUrl = (await window.NewGenDB.uploadStudentImage(blob, fname)) || '';
      } catch (upErr) {
        console.warn('Student image upload error:', upErr);
      }
      if (!studentImageUrl) {
        if (isImgRequired) {
          alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 10MB)');
          restoreSubmitBtn();
          return;
        }
        if (!confirm('อัปโหลดรูปภาพไม่สำเร็จ ต้องการส่งใบสมัครโดยไม่แนบรูปหรือไม่?\n(สามารถส่งรูปให้เจ้าหน้าที่ทาง LINE ภายหลังได้)')) {
          restoreSubmitBtn();
          return;
        }
      }
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...';
    }

    // Generate readable, hard-to-guess application ID (เช่น ENR-20261019-K7Q2XM)
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const idChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randBytes = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(6)) : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
    const randPart = Array.from(randBytes, b => idChars[b % idChars.length]).join('');
    const enrollId = `ENR-${todayStr}-${randPart}`;

    const newEnrollment = {
      id: enrollId,
      courseId: currentEnrollCourse.id,
      courseTitle: currentEnrollCourse.title,
      scheduleChoice: scheduleChoice,
      childSchedulesMap: childSchedulesMap,
      learningType: learningType,
      ...(isBundle ? { childLearningTypes: childLearningTypes } : {}),
      studentName: studentName,
      fullName: studentName,
      nickname: nickname,
      grade: grade,
      school: school,
      parentPhone: parentPhone,
      studentPhone: studentPhone,
      lineId: lineId,
      shippingAddress: shippingAddress,
      notes: (notes || '').trim(),
      customAnswers: customAnswers,
      studentImageUrl: studentImageUrl,
      hasAttachment: Boolean(studentImageUrl),
      isCampaign: Boolean(currentEnrollCourse.isCampaign),
      selectedSubjects: selectedSubjects,
      subjectsChosen: selectedSubjects.length > 0 ? selectedSubjects.map(s => s.name).join(', ') : '',
      isBundle: isBundle,
      bundleId: isBundle ? currentEnrollCourse.id : null,
      bundleName: isBundle ? (currentEnrollCourse.name || currentEnrollCourse.title) : null,
      bundleCourseIds: childCourseIds,
      // ราคา ณ วันที่สมัคร (ใช้คำนวณรายได้ในหน้าสรุปสถิติ แม้จะปรับราคาคอร์สภายหลัง)
      price: currentEnrollCourse.isCampaign ? 0 : (parseInt(String(currentEnrollCourse.pricePromo || '').replace(/[^0-9]/g, ''), 10) || null),
      priceUnit: currentEnrollCourse.priceUnit || '',
      // ผู้ปกครองยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล (PDPA)
      consentAccepted: true,
      consentText: (document.getElementById('lblEnrollConsent')?.textContent || '').trim().slice(0, 500),
      status: 'pending', // รอตรวจสอบ/ชำระเงินทางไลน์
      createdAt: new Date().toISOString()
    };

    // ใบหลัก + ใบย่อยของทุกคอร์สในแพ็คเกจ (ตามรอบเรียนที่เลือกของแต่ละคอร์ส) ส่งพร้อมกันครั้งเดียว
    const submitItems = [newEnrollment];
    if (isBundle && childCourseIds.length > 0) {
      const allCourses = (window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []));
      childCourseIds.forEach(subId => {
        const subCourse = allCourses.find(c => c.id === subId);
        submitItems.push({
          ...newEnrollment,
          id: `${enrollId}-${subId}`,
          courseId: subId,
          courseTitle: subCourse ? subCourse.title : subId,
          scheduleChoice: childSchedulesMap[subId] || scheduleChoice,
          learningType: childLearningTypes[subId] || learningType,
          isBundle: false,
          isFromBundle: true,
          bundleId: currentEnrollCourse.id,
          bundleName: currentEnrollCourse.name || currentEnrollCourse.title,
          parentEnrollId: enrollId,
          notes: (notes || '').trim()
        });
      });
    }

    try {
      const result = await window.NewGenDB.submitEnrollments(submitItems);
      if (!result || !Array.isArray(result.ids) || !result.ids.includes(enrollId)) {
        throw new Error('enrollment not stored');
      }
    } catch (err) {
      console.warn('Save enrollment error:', err);
      restoreSubmitBtn();

      // ที่นั่งเต็มระหว่างกรอกฟอร์ม (Supabase ปฏิเสธ) → แจ้งชัดเจน ดึงที่นั่งล่าสุด แล้วให้เลือกรอบอื่น
      const full = String(err && err.message || '').match(/(ROUND_FULL|COURSE_FULL|SUBJECT_FULL|ROUND_UNKNOWN|ONSITE_FULL)\|([^"\\]*)/);
      if (full) {
        const parts = full[2].split('|');
        const msg = {
          ROUND_FULL: `ขออภัยครับ รอบ "${parts[1] || ''}" ของ ${parts[0] || 'คอร์สนี้'} เพิ่งเต็ม\nกรุณาเลือกรอบเวลาอื่นแล้วกดยืนยันอีกครั้ง`,
          COURSE_FULL: `ขออภัยครับ ${parts[0] || 'คอร์สนี้'} ที่นั่งเต็มแล้ว\nทัก LINE สถาบันเพื่อสอบถามรอบถัดไปได้เลยครับ`,
          SUBJECT_FULL: `ขออภัยครับ วิชา "${parts[0] || ''}" ที่นั่งเต็มแล้ว\nกรุณาเลือกวิชาอื่นแล้วกดยืนยันอีกครั้ง`,
          ROUND_UNKNOWN: `รอบเรียนของ ${parts[0] || 'คอร์สนี้'} มีการเปลี่ยนแปลง\nกรุณาเลือกรอบเวลาใหม่แล้วกดยืนยันอีกครั้ง`,
          ONSITE_FULL: `ขออภัยครับ ${parts[1] ? `รอบ "${parts[1]}" ของ ` : ''}${parts[0] || 'คอร์สนี้'} ตอนนี้เหลือเฉพาะเรียนออนไลน์ (ออนไซต์เต็มแล้ว)\nกรุณาเลือกเรียน Online หรือรอบอื่น แล้วกดยืนยันอีกครั้ง`
        }[full[1]];
        alert(msg);
        if (window.NewGenDB) await window.NewGenDB.syncFromSupabase();
        refreshRoundAvailability();
        return;
      }

      const lineUrl = getContactLineUrl();
      if (confirm('ขออภัย ระบบบันทึกใบสมัครไม่สำเร็จในขณะนี้ กรุณาลองกดยืนยันอีกครั้ง\n\nหรือกด "ตกลง" เพื่อทัก LINE สถาบันให้เจ้าหน้าที่ช่วยลงทะเบียนให้')) {
        window.open(lineUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    lastEnrollmentData = newEnrollment;

    // Populate Step 2 Confirmation Card
    document.getElementById('confAppCode').textContent = `#${enrollId}`;
    document.getElementById('confCourseTitle').textContent = currentEnrollCourse.title;
    document.getElementById('confScheduleChoice').innerHTML = escapeHtml(scheduleChoice).replace(/\|/g, '<br>• ');
    const confTypeEl = document.getElementById('confLearningType');
    if (isBundle && Object.keys(childLearningTypes).length > 0) {
      confTypeEl.innerHTML = currentEnrollCourse.childCourses.map(cc =>
        `${escapeHtml(cc.title)}: <strong>${childLearningTypes[cc.id] === 'online' ? '💻 Online' : '🏫 Onsite'}</strong>`
      ).join('<br>');
    } else {
      confTypeEl.textContent = learningType === 'online' ? '💻 เรียนสด Online (Zoom)' : '🏫 เรียนสด Onsite (ที่สถาบัน The NEW GEN)';
    }
    document.getElementById('confStudentName').textContent = `${studentName} (น้อง${nickname}) ชั้น ${grade} - รร. ${school}`;
    document.getElementById('confContact').textContent = `โทร: ${parentPhone} | LINE ID: ${lineId}`;

    const confAttRow = document.getElementById('confAttachmentRow');
    const confAttVal = document.getElementById('confAttachmentVal');
    if (confAttRow && confAttVal) {
      if (studentImageUrl) {
        confAttRow.style.display = 'flex';
        confAttVal.innerHTML = `<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-paperclip"></i> แนบรูปภาพเรียบร้อยแล้ว</span>`;
      } else {
        confAttRow.style.display = 'none';
      }
    }

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

    // Requirement 7: For campaign enrollments, customize Step 2 Confirmation
    const lineCalloutTitle = document.getElementById('confLineCalloutTitle');
    const lineCalloutBody = document.getElementById('confLineCalloutBody');
    const btnConfLineText = document.getElementById('btnConfLineText');
    const confCampHighlight = document.getElementById('confCampaignHighlight');
    const confCampSubjectsList = document.getElementById('confCampaignSubjectsList');

    if (currentEnrollCourse && currentEnrollCourse.isCampaign) {
      if (lineCalloutTitle) lineCalloutTitle.textContent = '🎉 บันทึกสิทธิ์โครงการติวฟรีสำเร็จ!';
      if (lineCalloutBody) lineCalloutBody.textContent = 'น้องสามารถกดปุ่ม "📸 บันทึกภาพลงมือถือ" ด้านบน เพื่อเก็บหลักฐานนี้ไว้ได้เลยครับ และหากมีข้อสงสัยตรงไหน สามารถสอบถามพี่ ๆ ทาง LINE ได้ตลอดเลยครับ';
      if (btnConfLineText) btnConfLineText.textContent = '💬 สอบถามเพิ่มเติมทาง LINE';

      if (confCampHighlight && confCampSubjectsList) {
        confCampHighlight.style.display = 'block';
        if (selectedSubjects.length > 0) {
          confCampSubjectsList.innerHTML = selectedSubjects.map((s, idx) => `
            <div style="background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecdd3; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <div>
                <strong style="color: #0b1e3f; font-size: 0.9rem;">${idx + 1}. ${escapeHtml(s.name)}</strong>
                ${s.detail ? `<div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">${escapeHtml(s.detail)}</div>` : ''}
              </div>
              <span style="font-size: 0.78rem; font-weight: 700; color: #e11d48; background: #fff1f2; padding: 3px 10px; border-radius: 99px; border: 1px solid #fecdd3;">
                <i class="fa-regular fa-clock"></i> ${escapeHtml(s.date)} ${escapeHtml(s.time)}
              </span>
            </div>
          `).join('');
        }
      }
    } else {
      if (confCampHighlight) confCampHighlight.style.display = 'none';
      if (lineCalloutTitle) lineCalloutTitle.textContent = (cfg && cfg.lineCalloutTitle) ? cfg.lineCalloutTitle : 'ขั้นตอนสุดท้าย: ทักไปยืนยันการสมัครที่ LINE สถาบัน';
      if (lineCalloutBody) lineCalloutBody.textContent = (cfg && cfg.lineCalloutBody) ? cfg.lineCalloutBody : 'กรุณากดปุ่มด้านล่างเพื่อทักไปยืนยันการสมัครและส่งหลักฐานการชำระเงินที่ LINE Official เจ้าหน้าที่จะตรวจสอบและยืนยันที่นั่งให้น้องทันทีครับ';
      if (btnConfLineText) btnConfLineText.textContent = (cfg && cfg.lineBtnText) ? cfg.lineBtnText : 'คลิกเพื่อทัก LINE ยืนยันการสมัครทันที';
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

    const schedFormatted = lastEnrollmentData.scheduleChoice.includes('\n')
      ? '\n' + lastEnrollmentData.scheduleChoice.split('\n').map(l => l.replace(/\|/g, ' • ')).join('\n')
      : lastEnrollmentData.scheduleChoice.replace(/\|/g, ' • ');

    const textToCopy = `สมัครเรียน The NEW GEN
-------------------------
รหัสการสมัคร: ${lastEnrollmentData.id}
คอร์สเรียน: ${lastEnrollmentData.courseTitle}
รอบเรียน: ${schedFormatted}
รูปแบบ: ${{ onsite: 'Onsite เรียนที่สถาบัน', online: 'Online', mixed: 'แยกตามคอร์ส (ดูในรอบเรียนด้านบน)' }[lastEnrollmentData.learningType] || 'Onsite เรียนที่สถาบัน'}
ชื่อนักเรียน: ${lastEnrollmentData.studentName} (${lastEnrollmentData.nickname})
ระดับชั้น: ${lastEnrollmentData.grade} | รร. ${lastEnrollmentData.school}
เบอร์ผู้ปกครอง: ${lastEnrollmentData.parentPhone}
LINE ID: ${lastEnrollmentData.lineId}${customText}${lastEnrollmentData.studentImageUrl ? '\nรูปภาพแนบ: แนบในระบบเรียบร้อยแล้ว' : ''}
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
      <div class="bundle-detail-modal-backdrop" id="modalBundleDetail" role="dialog" aria-modal="true" style="display: none; position: fixed; inset: 0; background: rgba(10, 25, 50, 0.82); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 999998; align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div class="modal-bundle-box" style="background: #ffffff; width: 100%; max-width: 840px; border-radius: 24px; box-shadow: 0 30px 70px -15px rgba(0,0,0,0.45); overflow: hidden; position: relative; border: 1px solid rgba(226, 232, 240, 0.8); margin: auto;">
          
          <!-- Header Banner -->
          <div class="bdm-header">
            <button type="button" class="btn-close-modal" onclick="closeBundleDetailModal()" aria-label="ปิดหน้าต่าง" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); color: #ffffff; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div id="bundleDetailBadgeWrap" class="bdm-badge-wrap">
              <span id="bundleDetailBadge" class="bdm-badge">
                <i class="fa-solid fa-fire"></i> แพ็คเกจโปรโมชั่นสุดคุ้ม
              </span>
            </div>
            <h2 id="bundleDetailTitle" class="bdm-title">ชื่อแพ็คเกจคอร์สเรียน</h2>
            <p id="bundleDetailDesc" class="bdm-desc">รายละเอียดสรุปของแพ็คเกจ</p>
          </div>

          <!-- Price & Savings Ribbon -->
          <div class="bdm-price-ribbon">
            <div class="bdm-price-block">
              <span class="bdm-price-old" id="bundleDetailPriceOld">จากปกติ 0 บาท</span>
              <div class="bdm-price-now">
                <span class="bdm-price-label">ราคาแพ็คเกจพิเศษเพียง</span>
                <span class="bdm-price-line">
                  <span id="bundleDetailPricePromo" class="bdm-price-amount">0</span>
                  <span id="bundleDetailPriceUnit" class="bdm-price-unit">บาท / แพ็คเกจ</span>
                </span>
              </div>
            </div>
            <div id="bundleDetailSavingsTag" class="bdm-savings">
              <i class="fa-solid fa-gift"></i> ประหยัดทันที 0.-
            </div>
          </div>

          <!-- Modal Body Content -->
          <div class="bdm-body">

            <div class="bdm-list-head">
              <h3 class="bdm-list-title">
                <i class="fa-solid fa-layer-group" style="color: #e11d48;"></i>
                <span>คอร์สเรียนที่รวมอยู่ในแพ็คเกจนี้ <span class="nowrap">(<span id="bundleDetailCourseCount">0</span> คอร์ส)</span></span>
              </h3>
              <span class="bdm-all-subjects">
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
          <div class="bdm-footer">
            <button type="button" class="btn-modal-cancel bdm-btn-close" onclick="closeBundleDetailModal()" style="padding: 10px 18px; border-radius: 999px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              ปิดหน้าต่าง
            </button>
            <a href="https://lin.ee/RXrzi1G" target="_blank" rel="noopener noreferrer" class="bdm-btn-line" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 999px; background: #06c755; color: #ffffff; font-weight: 700; text-decoration: none; font-size: 0.9rem; box-shadow: 0 3px 10px rgba(6, 199, 85, 0.25);">
              <i class="fa-brands fa-line" style="font-size: 1.15rem;"></i> สอบถามทาง LINE
            </a>
            <button type="button" id="btnBundleDetailApplyNow" class="bdm-btn-apply" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 24px; border-radius: 999px; border: none; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.35); transition: all 0.2s;">
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

    const actualId = (typeof bundleId === 'object' && bundleId) ? bundleId.id : bundleId;
    const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
    let bundleObj = bundles.find(b => b.id === actualId);

    // Fallbacks
    if (!bundleObj) {
      try {
        const raw = JSON.parse(localStorage.getItem('newgen_bundles') || '[]');
        if (Array.isArray(raw)) bundleObj = raw.find(b => b.id === actualId);
      } catch (e) {}
    }

    if (!bundleObj && typeof bundleId === 'object' && bundleId) {
      bundleObj = bundleId;
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

    // ราคาที่แอดมินพิมพ์อาจมี "บ" ต่อท้ายอยู่แล้ว (เช่น "12,500 บ") → ตัดออกก่อนต่อด้วยหน่วย จะได้ไม่เป็น "บ บาท"
    const priceNum = window.priceNumberText || (v => String(v || ''));
    const priceOldEl = document.getElementById('bundleDetailPriceOld');
    if (priceOldEl) {
      priceOldEl.textContent = bundleObj.priceOriginal ? `จากปกติ ${priceNum(bundleObj.priceOriginal)} บาท` : (origNum > 0 ? `จากปกติ ${origNum.toLocaleString()} บาท` : '');
      priceOldEl.style.display = (bundleObj.priceOriginal || origNum > 0) ? '' : 'none';
    }

    const pricePromoEl = document.getElementById('bundleDetailPricePromo');
    if (pricePromoEl) pricePromoEl.textContent = priceNum(bundleObj.pricePromo || '0') || '0';

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
    const bundleStatus = window.isBundleFull ? window.isBundleFull(bundleObj, allCourses) : { isFull: false, fullCourses: [] };
    const coursesListEl = document.getElementById('bundleDetailCoursesList');
    if (coursesListEl) {
      if (childCourses.length === 0) {
        coursesListEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">ไม่พบรายการคอร์สย่อยในแพ็คเกจนี้</div>`;
      } else {
        let listHtml = '';
        if (bundleStatus.isFull) {
          listHtml += `
            <div style="background: #fef2f2; border: 1.5px solid #f87171; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; color: #991b1b; font-weight: 700; font-size: 0.88rem;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.25rem; color: #dc2626;"></i>
              <div>แพ็คเกจนี้มีบางคอร์สที่นั่งเต็มแล้ว ระบบจึงปิดรับสมัครชั่วคราว</div>
            </div>
          `;
        }
        listHtml += childCourses.map((c, idx) => {
          // Tutor details
          const courseTutors = (c.tutorIds || []).map(tid => allTutors.find(t => t.id === tid)).filter(Boolean);
          // ชื่อติวเตอร์: แสดงวงเล็บวิชา/ตำแหน่งเฉพาะเมื่อมีข้อมูล (ไม่ให้เหลือ "()" ว่าง ๆ)
          const tutorText = courseTutors.length > 0
            ? courseTutors.map(t => {
                const nm = t.nickname ? 'พี่' + t.nickname : (t.name || '');
                const extra = String(t.subject || t.role || '').trim();
                return extra ? `${nm} (${extra})` : nm;
              }).filter(Boolean).join(' • ')
            : 'ทีมติวเตอร์ The NEW GEN';

          // Check if this specific course is full
          const cEff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : { isFull: c.isFull === true };
          const isCourseFull = cEff.isFull || (!cEff.onlineOnly && cEff.remainingSeats !== undefined && cEff.remainingSeats <= 0);
          const isOnlineOnly = Boolean(cEff.onlineOnly);

          // Schedule summaries (วันที่อยู่บรรทัดของตัวเอง อ่านง่ายบนมือถือ)
          const schedItems = Array.isArray(c.scheduleList) && c.scheduleList.length > 0
            ? c.scheduleList.map(s => `
                <div class="bdm-sched-item">
                  <i class="fa-regular fa-clock"></i>
                  <div>
                    <span><strong>${escapeHtml(s.type)}:</strong> ${escapeHtml(s.time || '')}</span>
                    ${s.dates ? `<small>${escapeHtml(s.dates)}</small>` : ''}
                  </div>
                </div>
              `).join('')
            : `<div class="bdm-sched-item"><i class="fa-regular fa-calendar-check"></i><div><span>ตารางเรียนตามรอบสถาบัน</span></div></div>`;

          const coverSrc = window.resolveMediaUrl
            ? window.resolveMediaUrl(c.cover || c.poster || 'assets/images/course-poster-primary.jpg')
            : (c.cover || c.poster || 'assets/images/course-poster-primary.jpg');

          const singlePrice = (window.priceNumberText || (v => v))(c.pricePromo || c.priceOriginal || '');

          return `
            <div class="bundle-child-course-card" style="display: flex; gap: 16px; background: #ffffff; border: 1px solid ${isCourseFull ? '#fca5a5' : '#e2e8f0'}; border-radius: 16px; padding: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; align-items: flex-start;">
              <div class="bdm-child-cover">
                <img src="${coverSrc}" alt="${escapeHtml(c.title)}" loading="lazy">
                <span class="bdm-child-num">คอร์สที่ ${idx + 1}</span>
                ${isCourseFull ? `
                  <div style="position: absolute; inset: 0; background: rgba(185, 28, 28, 0.7); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 0.82rem; z-index: 3;">
                    <i class="fa-solid fa-ban" style="margin-right: 4px;"></i> เต็มแล้ว
                  </div>
                ` : ''}
              </div>
              <div style="flex: 1; min-width: 0; width: 100%;">
                <div class="bdm-child-top">
                  <span class="bdm-child-level">${escapeHtml(c.categoryLabel || (c.category === 'primary' ? 'ประถม' : 'มัธยม'))}</span>
                  ${isCourseFull ? `
                    <span class="badge" style="background: #fee2e2; color: #dc2626; border: 1px solid #f87171; font-weight: 800; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px;">
                      <i class="fa-solid fa-ban"></i> ที่นั่งเต็ม
                    </span>
                  ` : ''}
                  ${isOnlineOnly ? `<span class="bdm-online-only-tag"><i class="fa-solid fa-laptop"></i> ออนไซต์เต็ม • เหลือเฉพาะออนไลน์</span>` : ''}
                  ${singlePrice ? `<span class="bdm-child-price">ราคาปกติเดี่ยว <b>${escapeHtml(singlePrice)} บาท</b></span>` : ''}
                </div>
                <h4 class="bdm-child-title">${escapeHtml(c.title)}</h4>
                <div class="bdm-child-subjects">
                  <i class="fa-solid fa-book-open"></i> <span>${escapeHtml(c.subjects || 'วิชาหลัก')}</span>
                </div>
                <div class="bdm-child-meta">
                  <span><i class="fa-solid fa-user-graduate" style="color: #8b5cf6;"></i> ติวเตอร์: <strong>${escapeHtml(tutorText)}</strong></span>
                  ${c.totalHours ? `<span><i class="fa-regular fa-clock" style="color: #10b981;"></i> ${escapeHtml(c.totalHours)}</span>` : ''}
                </div>
                <div class="bdm-sched-box">
                  ${schedItems}
                </div>
              </div>
            </div>
          `;
        }).join('');
        coursesListEl.innerHTML = listHtml;
      }
    }

    // Apply button click
    const applyBtn = document.getElementById('btnBundleDetailApplyNow');
    if (applyBtn) {
      if (bundleStatus.isFull) {
        applyBtn.style.background = '#94a3b8';
        applyBtn.style.borderColor = '#94a3b8';
        applyBtn.style.cursor = 'not-allowed';
        applyBtn.style.boxShadow = 'none';
        applyBtn.innerHTML = '<i class="fa-solid fa-ban"></i> ที่นั่งเต็มแล้ว (มีคอร์สในแพ็คเต็ม)';
        applyBtn.onclick = function () {
          const fullNames = bundleStatus.fullCourses.map(fc => `• ${fc.title}`).join('\n');
          const lineUrl = getContactLineUrl();
          const wantLine = confirm(
            `ขออภัยครับ ไม่สามารถเปิดรับสมัครแพ็คเกจ "${bundleObj.name}" ได้ในขณะนี้\n\n` +
            `เนื่องจากมีคอร์สในแพ็คเกจที่นั่งเต็มแล้ว ดังนี้:\n${fullNames}\n\n` +
            `ต้องการทัก LINE สถาบันเพื่อสอบถามรอบถัดไป หรือลงชื่อสำรองที่นั่ง (Waiting List) หรือไม่ครับ?`
          );
          if (wantLine) window.open(lineUrl, '_blank', 'noopener,noreferrer');
        };
      } else {
        applyBtn.style.background = 'linear-gradient(135deg, #e11d48, #be123c)';
        applyBtn.style.borderColor = '#be123c';
        applyBtn.style.cursor = 'pointer';
        applyBtn.style.boxShadow = '0 6px 18px rgba(225, 29, 72, 0.4)';
        applyBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> สมัครแพ็คเกจนี้ทันที';
        applyBtn.onclick = function () {
          closeBundleDetailModal();
          if (typeof window.openEnrollmentModal === 'function') {
            window.openEnrollmentModal(bundleObj.id, bundleObj);
          }
        };
      }
    }

    // Open Modal
    const modalEl = document.getElementById('modalBundleDetail');
    if (modalEl) {
      modalEl.classList.add('active');
      modalEl.style.setProperty('display', 'flex', 'important');
      modalEl.style.setProperty('visibility', 'visible', 'important');
      modalEl.style.setProperty('opacity', '1', 'important');
      modalEl.style.setProperty('pointer-events', 'auto', 'important');
      modalEl.style.setProperty('z-index', '999998', 'important');
      document.body.style.overflow = 'hidden';
    }
  };

  /**
   * Close Bundle Detail Modal
   */
  window.closeBundleDetailModal = function () {
    const modalEl = document.getElementById('modalBundleDetail');
    if (modalEl) {
      modalEl.classList.remove('active');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('visibility', 'hidden', 'important');
      modalEl.style.setProperty('opacity', '0', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
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

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const bModal = document.getElementById('modalBundleDetail');
      if (bModal && (bModal.classList.contains('active') || bModal.style.display === 'flex')) {
        closeBundleDetailModal();
      }
    }
  });

  /**
   * Helper functions for Campaign Subject Selection Checkboxes
   */
  window.toggleCampaignSubjectCard = function (labelEl, event) {
    if (event && event.target && (event.target.tagName.toLowerCase() === 'input')) return;
    const cb = labelEl.querySelector('input[type="checkbox"]');
    if (cb && !cb.disabled) {
      cb.checked = !cb.checked;
      syncCampaignSubjectCard(cb);
    }
  };

  window.syncCampaignSubjectCard = function (cb) {
    const card = cb.closest('.campaign-subject-card');
    if (card) {
      if (cb.checked) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    }
  };

  /**
   * Requirement 6: Save Enrollment Confirmation Pass as High-Res Image (Canvas)
   */
  window.saveEnrollmentConfirmationImage = function () {
    if (!lastEnrollmentData) {
      alert('ไม่พบข้อมูลการสมัครเรียน');
      return;
    }

    const isCamp = Boolean(lastEnrollmentData.isCampaign || lastEnrollmentData.courseId === 'campaign-free' || lastEnrollmentData.courseId === 'campaign');
    const subjectsCount = Array.isArray(lastEnrollmentData.selectedSubjects) ? lastEnrollmentData.selectedSubjects.length : 0;
    const width = 1000;
    const baseH = isCamp ? (1150 + Math.min(300, subjectsCount * 45)) : 1100;
    const height = baseH;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      window.print();
      return;
    }

    // 1. Overall Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Header Gradient Banner
    const grad = ctx.createLinearGradient(0, 0, width, 240);
    if (isCamp) {
      grad.addColorStop(0, '#0b1e3f');
      grad.addColorStop(0.55, '#1e1b4b');
      grad.addColorStop(1, '#be123c');
    } else {
      grad.addColorStop(0, '#0b1e3f');
      grad.addColorStop(0.65, '#1e3a8a');
      grad.addColorStop(1, '#0284c7');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 230);

    // Top Brand Gold Accent Strip
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, width, 8);

    // Brand Logo & Title (Left Header)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('The NEW GEN TUTOR', 50, 75);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '20px "Prompt", sans-serif';
    ctx.fillText('สถาบันกวดวิชาคุณภาพ Onsite & Online', 50, 112);

    // Pass Type Badge Pill
    ctx.fillStyle = isCamp ? '#f43f5e' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(50, 138, isCamp ? 385 : 345, 42, 21);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Prompt", sans-serif';
    ctx.fillText(isCamp ? '🎁 บัตรรับสิทธิ์โครงการติวฟรี 100%' : '🎓 บัตรยืนยันการสมัครเรียน (PASS)', 72, 165);

    // Application ID Box (Right Header)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(width - 390, 50, 340, 130, 14);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Prompt", sans-serif';
    ctx.fillText('รหัสอ้างอิงการสมัคร (APPLICATION ID)', width - 370, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`#${lastEnrollmentData.id}`, width - 370, 124);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 17px "Prompt", sans-serif';
    ctx.fillText('● บันทึกเข้าระบบเรียบร้อย', width - 370, 158);

    // 3. Main Ticket Card Container
    const cardY = 265;
    const cardH = height - 340;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, cardY, width - 80, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Field Row Drawer Helper
    let y = cardY + 50;
    const drawRow = (icon, label, value, isBold = false, valColor = '#0f172a') => {
      ctx.fillStyle = '#64748b';
      ctx.font = '19px "Prompt", sans-serif';
      ctx.fillText(`${label}:`, 75, y);

      ctx.fillStyle = valColor;
      ctx.font = (isBold ? 'bold ' : '') + '21px "Prompt", sans-serif';

      const maxW = width - 420;
      const valStr = String(value || '-');
      if (ctx.measureText(valStr).width > maxW) {
        ctx.fillText(valStr.substring(0, 48) + '...', 350, y);
      } else {
        ctx.fillText(valStr, 350, y);
      }
      y += 48;
    };

    drawRow('🎓', 'คอร์สเรียน / โครงการ', lastEnrollmentData.courseTitle, true, isCamp ? '#be123c' : '#1e3a8a');
    drawRow('🏫', 'รูปแบบการเรียน', { onsite: 'เรียนสด Onsite (ที่สถาบัน The NEW GEN)', online: 'เรียนสด Online (Zoom)', mixed: 'Onsite + Online (แยกตามคอร์ส)' }[lastEnrollmentData.learningType] || 'เรียนสด Onsite (ที่สถาบัน The NEW GEN)');
    drawRow('👤', 'ชื่อ - สกุล นักเรียน', `${lastEnrollmentData.studentName} (น้อง${lastEnrollmentData.nickname || '-'})`, true);
    drawRow('📚', 'ระดับชั้น / โรงเรียน', `ชั้น ${lastEnrollmentData.grade || '-'} | รร. ${lastEnrollmentData.school || '-'}`);
    drawRow('📞', 'เบอร์ติดต่อผู้ปกครอง', lastEnrollmentData.parentPhone || '-');
    drawRow('💬', 'LINE ID', lastEnrollmentData.lineId || '-');

    // If Campaign: Render Selected Subjects Highlight Box
    if (isCamp && Array.isArray(lastEnrollmentData.selectedSubjects) && lastEnrollmentData.selectedSubjects.length > 0) {
      y += 8;
      const boxH = Math.min(270, lastEnrollmentData.selectedSubjects.length * 44 + 50);
      ctx.fillStyle = '#fff1f2';
      ctx.strokeStyle = '#fecdd3';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(75, y, width - 150, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 19px "Prompt", sans-serif';
      ctx.fillText('📚 รายวิชาและเวลาเรียนโครงการติวฟรีที่เลือก:', 95, y + 32);

      let subY = y + 68;
      lastEnrollmentData.selectedSubjects.forEach((s, idx) => {
        if (subY < y + boxH - 10) {
          ctx.fillStyle = '#0b1e3f';
          ctx.font = 'bold 18px "Prompt", sans-serif';
          ctx.fillText(`${idx + 1}. ${s.name}`, 105, subY);

          ctx.fillStyle = '#e11d48';
          ctx.font = '16px "Prompt", sans-serif';
          ctx.fillText(`${s.date} ${s.time}`, width - 380, subY);
          subY += 40;
        }
      });
      y += boxH + 20;
    } else {
      drawRow('📅', 'รอบ / วันเวลาเรียน', lastEnrollmentData.scheduleChoice || 'ตามรอบที่สถาบันแจ้ง');
    }

    // 4. Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('สถาบันกวดวิชา The NEW GEN • สอบถามข้อมูลเพิ่มเติม LINE: @thenewgen หรือโทร 089-123-4567', width / 2, height - 35);
    ctx.textAlign = 'left';

    // Trigger PNG Download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `NEWGEN-PASS-${lastEnrollmentData.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      alert('📸 บันทึกภาพบัตรยืนยันการสมัครเรียนเรียบร้อยแล้ว!\nน้องสามารถนำภาพนี้บันทึกไว้ในเครื่อง หรือทักส่งทาง LINE ได้เลยครับ');
    } catch (err) {
      console.warn('Canvas export failed, falling back to print:', err);
      window.print();
    }
  };

  /**
   * Requirement 6: Save Enrollment Confirmation Pass as PDF / Print
   */
  window.printEnrollmentConfirmationPdf = function () {
    window.print();
  };

  // Pre-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureEnrollmentModalDom();
      ensureBundleDetailModalDom();
    });
  } else {
    ensureEnrollmentModalDom();
    ensureBundleDetailModalDom();
  }

})();
