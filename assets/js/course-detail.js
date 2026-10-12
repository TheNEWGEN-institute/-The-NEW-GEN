/**
 * The NEW GEN Tutoring Institute - Course Detail Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initCourseDetailPage();
  initLightbox();
  initDetailNavbar();
  initBackToTop();
  initShareButton();
});

document.addEventListener('newgen:synced', () => {
  initCourseDetailPage();
});

function renderCourseTutors(course) {
  const grid = document.getElementById('cdTutorsGrid');
  const card = document.querySelector('.cd-tutors-card');
  if (!grid) return;
  const allTutors = window.NewGenDB ? window.NewGenDB.getTutors() : (window.tutorsData || []);
  if (!allTutors || allTutors.length === 0) return;

  let displayTutors = [];
  if (course && Array.isArray(course.tutorIds) && course.tutorIds.length > 0) {
    displayTutors = allTutors.filter(t => course.tutorIds.includes(t.id));
  } else if (course && Array.isArray(course.subjectBreakdown) && course.subjectBreakdown.length > 0) {
    // If tutorIds not explicitly configured, match tutors from subject breakdown
    const tutorTexts = course.subjectBreakdown.map(s => s.tutor || '');
    displayTutors = allTutors.filter(t => tutorTexts.some(txt => txt.includes(t.name)));
  }

  // If explicitly configured as empty array, hide the card
  if (course && Array.isArray(course.tutorIds) && course.tutorIds.length === 0) {
    if (card) card.style.display = 'none';
    return;
  }

  // Fallback if none matched
  if (displayTutors.length === 0) {
    displayTutors = allTutors;
  }

  if (card) card.style.display = 'block';
  grid.innerHTML = displayTutors.map(t => `
    <div class="cd-tutor-mini-card">
      <div class="cd-tutor-avatar">
        <img src="${t.image}" alt="${t.name}">
      </div>
      <div class="cd-tutor-info">
        <h4>${t.name}</h4>
        ${t.heroBadge || t.subjects ? `<span class="cd-tutor-badge-tag">${escapeHtml(t.heroBadge || t.subjects)}</span>` : ''}
        ${t.honor ? `<p class="cd-tutor-honor-text">${escapeHtml(t.honor)}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function initCourseDetailPage() {
  const courses = (window.NewGenDB ? window.NewGenDB.getCourses() : window.courseData) || [];
  if (!courses.length) return;

  // อ่าน ID จาก URL query string เช่น course-detail.html?id=course-p4-p5
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || courses[0].id;

  // หาข้อมูลคอร์สที่ตรงกับ ID
  const course = courses.find(c => c.id === courseId) || courses[0];

  // อัปเดต Title และ Breadcrumb
  document.title = `${course.title} | สถาบันกวดวิชา The NEW GEN`;
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrentCourse');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = course.title;

  // อัปเดต Header Meta
  const badgeCategory = document.getElementById('cdBadgeCategory');
  if (badgeCategory) {
    badgeCategory.className = `badge ${course.category === 'primary' ? 'badge-primary-level' : 'badge-secondary-level'}`;
    badgeCategory.textContent = course.categoryLabel;
  }

  const badgeStatus = document.getElementById('cdBadgeStatus');
  if (badgeStatus) {
    badgeStatus.className = `badge ${course.statusClass}`;
    badgeStatus.textContent = course.statusBadge;
  }

  const titleEl = document.getElementById('cdCourseTitle');
  if (titleEl) titleEl.textContent = course.title;

  const subjectsEl = document.getElementById('cdCourseSubjects');
  if (subjectsEl) {
    subjectsEl.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> วิชาที่เปิดสอน: <strong>${course.subjects}</strong>`;
  }

  // อัปเดตรูปโปสเตอร์
  const posterImg = document.getElementById('cdPosterImg');
  if (posterImg) {
    posterImg.src = course.poster || course.cover;
    posterImg.alt = course.title;
  }

  // Lightbox Image & Caption
  const lightboxImg = document.getElementById('cdLightboxImg');
  const lightboxCaption = document.getElementById('cdLightboxCaption');
  const lightboxDownload = document.getElementById('cdLightboxDownload');
  if (lightboxImg) lightboxImg.src = course.poster || course.cover;
  if (lightboxCaption) lightboxCaption.textContent = course.title;
  if (lightboxDownload) lightboxDownload.href = course.poster || course.cover;

  // 1. Extra Posters / Gallery Strip (Item 4)
  const extraGalleryCard = document.getElementById('cdExtraGalleryCard');
  const extraGalleryContainer = document.getElementById('cdExtraGalleryContainer');
  if (extraGalleryCard && extraGalleryContainer) {
    if (course.galleryImages && Array.isArray(course.galleryImages) && course.galleryImages.length > 0) {
      extraGalleryCard.style.display = 'block';
      extraGalleryContainer.innerHTML = course.galleryImages.map(img => {
        const url = typeof img === 'string' ? img : (img.url || '');
        return `
          <div class="cd-gallery-item" onclick="openLightboxImage('${escapeHtml(url)}', '${escapeHtml(course.title)}')">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(course.title)}" loading="lazy">
            <div class="cd-gallery-overlay">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </div>
          </div>
        `;
      }).join('');
    } else {
      extraGalleryCard.style.display = 'none';
      extraGalleryContainer.innerHTML = '';
    }
  }

  // 2. Course Highlights
  const highlightsList = document.getElementById('cdHighlightsList');
  if (highlightsList && course.highlights) {
    highlightsList.innerHTML = course.highlights.map(h => `
      <li>
        <i class="fa-solid fa-circle-check"></i>
        <span>${h}</span>
      </li>
    `).join('');
  }

  // 3. Target Audience (Item 4: คอร์สนี้เหมาะกับใคร ?)
  const targetAudienceCard = document.getElementById('cdTargetAudienceCard');
  const targetAudienceContent = document.getElementById('cdTargetAudienceContent');
  if (targetAudienceCard && targetAudienceContent) {
    if (course.targetAudience && course.targetAudience.trim()) {
      targetAudienceCard.style.display = 'block';
      const lines = course.targetAudience.split('\n').map(l => l.trim()).filter(Boolean);
      const isList = lines.length > 1 && lines.every(l => l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l));
      if (isList) {
        targetAudienceContent.innerHTML = `<ul class="cd-highlights-list">${lines.map(l => {
          const clean = l.replace(/^[-•\d.]+\s*/, '');
          return `<li><i class="fa-solid fa-circle-check" style="color: #0284c7;"></i><span>${clean}</span></li>`;
        }).join('')}</ul>`;
      } else {
        targetAudienceContent.innerHTML = lines.map(p => `<p class="cd-custom-paragraph">${p}</p>`).join('');
      }
    } else {
      targetAudienceCard.style.display = 'none';
      targetAudienceContent.innerHTML = '';
    }
  }

  // 4. Benefits (Item 4: สิ่งที่จะได้รับจากคอร์สนี้)
  const benefitsCard = document.getElementById('cdBenefitsCard');
  const benefitsContent = document.getElementById('cdBenefitsContent');
  if (benefitsCard && benefitsContent) {
    if (course.benefits && course.benefits.trim()) {
      benefitsCard.style.display = 'block';
      const lines = course.benefits.split('\n').map(l => l.trim()).filter(Boolean);
      const isList = lines.length > 1 && lines.every(l => l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l));
      if (isList) {
        benefitsContent.innerHTML = `<ul class="cd-highlights-list">${lines.map(l => {
          const clean = l.replace(/^[-•\d.]+\s*/, '');
          return `<li><i class="fa-solid fa-gift" style="color: #c026d3;"></i><span>${clean}</span></li>`;
        }).join('')}</ul>`;
      } else {
        benefitsContent.innerHTML = lines.map(p => `<p class="cd-custom-paragraph">${p}</p>`).join('');
      }
    } else {
      benefitsCard.style.display = 'none';
      benefitsContent.innerHTML = '';
    }
  }

  // 5. Subject Breakdown (Item 5: แยกรายวิชา - Cards Grid + Summary Comparison Table)
  const subjectBreakdownCard = document.getElementById('cdSubjectBreakdownCard');
  const subjectsGrid = document.getElementById('cdSubjectsGrid');
  const summaryBody = document.getElementById('cdSubjectsSummaryTableBody');
  const summaryFoot = document.getElementById('cdSubjectsSummaryTableFoot');

  if (subjectBreakdownCard && subjectsGrid && summaryBody) {
    if (course.subjectBreakdown && Array.isArray(course.subjectBreakdown) && course.subjectBreakdown.length > 0) {
      subjectBreakdownCard.style.display = 'block';

      const contact = window.NewGenDB ? window.NewGenDB.getContact() : null;
      const baseLineUrl = (contact && contact.lineUrl) ? contact.lineUrl : 'https://line.me/R/ti/p/~thenewgen';

      // 5.1 Render Cards Grid
      subjectsGrid.innerHTML = course.subjectBreakdown.map(sb => {
        return `
          <div class="cd-subject-card">
            <div class="cd-sb-card-top">
              <div class="cd-sb-icon-badge">
                <i class="fa-solid ${getSubjectIcon(sb.name)}"></i>
              </div>
              <div style="flex: 1;">
                <h3 class="cd-sb-name">${escapeHtml(sb.name)}</h3>
                ${sb.tutor ? `<span class="cd-sb-tutor"><i class="fa-solid fa-chalkboard-user"></i> สอนโดย ${escapeHtml(sb.tutor)}</span>` : ''}
              </div>
            </div>

            <div class="cd-sb-pricing-pill">
              <span class="price"><i class="fa-solid fa-tag"></i> ${escapeHtml(sb.price || 'สอบถามค่าเรียน')}</span>
              ${sb.hours ? `<span class="hours"><i class="fa-regular fa-clock"></i> ${escapeHtml(sb.hours)}</span>` : ''}
            </div>

            ${sb.details ? `
              <div class="cd-sb-details">
                <p><i class="fa-solid fa-circle-info"></i> ${escapeHtml(sb.details)}</p>
              </div>
            ` : ''}

            <a href="${baseLineUrl}" target="_blank" rel="noopener noreferrer" class="btn-sb-line">
              <i class="fa-brands fa-line"></i> สอบถาม / สมัครวิชานี้
            </a>
          </div>
        `;
      }).join('');

      // 5.2 Render Summary Table
      summaryBody.innerHTML = course.subjectBreakdown.map(sb => {
        return `
          <tr>
            <td>
              <strong style="color: var(--color-navy); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid ${getSubjectIcon(sb.name)}" style="color: var(--color-cyan);"></i>
                ${escapeHtml(sb.name)}
              </strong>
            </td>
            <td><span style="color: #475569;"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(sb.tutor || 'ทีมติวเตอร์')}</span></td>
            <td><span class="badge badge-emerald" style="font-weight: 600;"><i class="fa-regular fa-clock"></i> ${escapeHtml(sb.hours || '—')}</span></td>
            <td><strong style="color: #dc2626; font-size: 1.05rem;">${escapeHtml(sb.price || '—')}</strong></td>
            <td style="text-align: right;">
              <a href="${baseLineUrl}" target="_blank" rel="noopener noreferrer" class="btn-xs-table-line">
                <i class="fa-brands fa-line"></i> ทักแอดมิน
              </a>
            </td>
          </tr>
        `;
      }).join('');

      // 5.3 Summary Table Footer (Bundle Package Promo)
      if (summaryFoot) {
        summaryFoot.innerHTML = `
          <tr class="cd-summary-bundle-row">
            <td colspan="3">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="badge badge-red" style="padding: 5px 12px; font-size: 0.82rem;"><i class="fa-solid fa-fire"></i> PACKAGE สุดคุ้ม</span>
                <strong style="color: var(--color-navy); font-size: 1rem;">สมัครเหมาครบทุกวิชาในคอร์สนี้</strong>
              </div>
              <small style="color: #64748b; display: block; margin-top: 3px;">ประหยัดกว่า และได้รับการดูแลครบถ้วนทุกวิชาพร้อมเอกสารจัดเต็ม</small>
            </td>
            <td>
              <div style="font-size: 0.85rem; color: #94a3b8; text-decoration: line-through;">${escapeHtml(course.priceOriginal || '')}</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #16a34a;">${escapeHtml(course.pricePromo)} <span style="font-size: 0.82rem; font-weight: normal; color: #475569;">${escapeHtml(course.priceUnit || 'บาท')}</span></div>
            </td>
            <td style="text-align: right;">
              <a href="${baseLineUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fa-brands fa-line"></i> จองแพ็กเกจรวม
              </a>
            </td>
          </tr>
        `;
      }
    } else {
      subjectBreakdownCard.style.display = 'none';
      subjectsGrid.innerHTML = '';
      summaryBody.innerHTML = '';
      if (summaryFoot) summaryFoot.innerHTML = '';
    }
  }

  // อัปเดตชั่วโมงเรียน
  const totalHoursBadge = document.getElementById('cdTotalHoursBadge');
  if (totalHoursBadge) {
    totalHoursBadge.innerHTML = `<i class="fa-regular fa-clock"></i> ${course.totalHours}`;
  }

  // อัปเดตตารางเรียน (Schedule Table)
  const scheduleBody = document.getElementById('cdScheduleTableBody');
  if (scheduleBody && course.scheduleList) {
    scheduleBody.innerHTML = course.scheduleList.map(s => `
      <tr>
        <td>
          <div class="schedule-group-name">
            <i class="fa-solid fa-chalkboard"></i> ${s.type}
          </div>
        </td>
        <td>
          <div class="schedule-time">
            <i class="fa-regular fa-clock"></i> ${s.time}
          </div>
        </td>
        <td>
          <div class="schedule-dates">
            <i class="fa-regular fa-calendar-check"></i> ${s.dates}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Render Custom Sections (Admin Extensible Topics)
  const customSectionsContainer = document.getElementById('cdCustomSectionsContainer');
  if (customSectionsContainer) {
    if (course.customSections && Array.isArray(course.customSections) && course.customSections.length > 0) {
      customSectionsContainer.innerHTML = course.customSections.map(sec => {
        const title = sec.title ? sec.title.trim() : 'หัวข้อเพิ่มเติม';
        const content = sec.content ? sec.content.trim() : '';
        if (!content) return '';

        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every(l => l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l));

        let formattedBody = '';
        if (isList) {
          formattedBody = `<ul class="cd-highlights-list" style="margin-top: 10px;">${lines.map(l => {
            const cleanText = l.replace(/^[-•\d.]+\s*/, '');
            return `<li><i class="fa-solid fa-circle-check"></i><span>${cleanText}</span></li>`;
          }).join('')}</ul>`;
        } else {
          formattedBody = lines.map(p => `<p class="cd-custom-paragraph">${p}</p>`).join('');
        }

        return `
          <div class="cd-card cd-custom-section-card">
            <div class="cd-card-header">
              <h2 class="cd-card-title">
                <i class="fa-solid fa-circle-info" style="color: var(--color-cyan);"></i> ${title}
              </h2>
            </div>
            <div class="cd-custom-section-body">
              ${formattedBody}
            </div>
          </div>
        `;
      }).join('');
    } else {
      customSectionsContainer.innerHTML = '';
    }
  }

  // 5. Render Tutors specifically teaching this course (Item 3)
  renderCourseTutors(course);

  // 6. Render Parent Info & FAQ (Item 4: Optional, editable via Admin)
  const faqCard = document.getElementById('cdParentFaqCard');
  const faqList = document.getElementById('cdParentFaqList');
  if (faqCard && faqList) {
    const faqs = Array.isArray(course.parentFaq) ? course.parentFaq : [];
    if (faqs.length > 0) {
      faqCard.style.display = 'block';
      faqList.innerHTML = faqs.map(item => `
        <div class="cd-faq-item">
          <h4><i class="fa-solid fa-circle-question" style="color: #0284c7;"></i> ${escapeHtml(item.q || item.question || '')}</h4>
          <p>${escapeHtml(item.a || item.answer || '').replace(/\n/g, '<br>')}</p>
        </div>
      `).join('');
    } else {
      faqCard.style.display = 'none';
      faqList.innerHTML = '';
    }
  }

  // อัปเดตราคาในแถบ Sidebar
  const priceOld = document.getElementById('cdPriceOld');
  if (priceOld) priceOld.textContent = `จาก ${course.priceOriginal}`;

  const pricePromo = document.getElementById('cdPricePromo');
  if (pricePromo) pricePromo.textContent = course.pricePromo;

  const priceUnit = document.getElementById('cdPriceUnit');
  if (priceUnit) {
    const rawU = course.priceUnit || 'บาท / เทอม';
    const cleanU = rawU.replace(/\(?\s*แบ่งชำระ(ได้)?\s*\)?/gi, '').replace(/[()]/g, '').trim();
    priceUnit.textContent = cleanU || 'บาท / เทอม';
  }

  const monthlyPrice = document.getElementById('cdMonthlyPrice');
  if (monthlyPrice) monthlyPrice.textContent = course.monthlyPrice || 'แบ่งชำระได้ หรือเลือกเรียนแบบรายเดือน';

  const sidebarHours = document.getElementById('cdSidebarHours');
  if (sidebarHours) sidebarHours.textContent = course.totalHours;

  // ปรับลิงก์ LINE และเบอร์โทรสำหรับสมัครเรียน
  const lineEnrollBtn = document.getElementById('btnLineEnroll');
  const contact = window.NewGenDB ? window.NewGenDB.getContact() : (window.DEFAULT_CONTACT || null);
  const fmt = window.formatExternalUrl || ((u) => u);

  if (lineEnrollBtn) {
    const baseLineUrl = (contact && contact.lineUrl) ? contact.lineUrl : 'https://lin.ee/RXrzi1G';
    lineEnrollBtn.href = fmt(baseLineUrl);
    lineEnrollBtn.target = '_blank';
    lineEnrollBtn.rel = 'noopener noreferrer';
  }

  const phoneBtnsWrap = document.querySelector('.cd-phone-buttons');
  if (phoneBtnsWrap && contact && Array.isArray(contact.phones) && contact.phones.length > 0) {
    const esc = window.escapeHtml || ((s) => s);
    phoneBtnsWrap.innerHTML = contact.phones.map(p => `
      <a href="${p.telLink || 'tel:' + p.number.replace(/[^0-9]/g, '')}" class="btn-cd-phone">
        <i class="fa-solid fa-phone"></i> โทร ${esc(p.number)} (${esc(p.name)})
      </a>
    `).join('');
  }

  // แสดงคอร์สที่เกี่ยวข้อง (Related Courses)
  renderRelatedCourses(course.id);
}

function renderRelatedCourses(currentCourseId) {
  const relatedGrid = document.getElementById('cdRelatedGrid');
  if (!relatedGrid) return;

  const courses = window.courseData || [];
  const otherCourses = courses.filter(c => c.id !== currentCourseId);

  relatedGrid.innerHTML = otherCourses.map(c => `
    <div class="course-card">
      <a href="course-detail.html?id=${c.id}" class="course-thumbnail" aria-label="ดูรายละเอียด ${c.title}">
        <img src="${c.cover || c.poster}" alt="${c.title}" loading="lazy">
        <span class="course-badge-level">${c.category === 'primary' ? 'ประถมศึกษา' : 'มัธยมศึกษาตอนต้น'}</span>
        <span class="badge ${c.statusClass} course-badge-status">${c.statusBadge}</span>
      </a>
      <div class="course-body">
        <h3 class="course-title">
          <a href="course-detail.html?id=${c.id}">${c.title}</a>
        </h3>
        <div class="course-subjects"><i class="fa-solid fa-graduation-cap"></i> ${c.subjects}</div>
        <div class="course-meta-list">
          <div class="course-meta-item">
            <i class="fa-regular fa-clock"></i>
            <span>เวลาเรียน: ${c.totalHours}</span>
          </div>
          <div class="course-meta-item">
            <i class="fa-solid fa-chalkboard-user"></i>
            <span>เรียนสด Onsite ได้ความรู้เต็มเปี่ยม</span>
          </div>
        </div>
        <div class="course-footer">
          ${(window.formatCoursePriceHtml ? window.formatCoursePriceHtml(c) : `
            <div class="course-price-wrap">
              <span class="course-price-old">จาก ${c.priceOriginal || ''}</span>
              <div class="course-price-now">
                <span class="course-price-amount">${c.pricePromo}</span><span class="course-price-dash">.-</span>
                <span class="course-price-unit-tag">${c.priceUnit || 'บาท / เทอม'}</span>
              </div>
            </div>
          `)}
          <a href="course-detail.html?id=${c.id}" class="btn-detail-link">
            รายละเอียด <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

/* Lightbox Modal logic */
function initLightbox() {
  const trigger = document.getElementById('cdPosterViewBox');
  const lightbox = document.getElementById('cdLightbox');
  const closeBtn = document.getElementById('cdLightboxClose');
  const backdrop = document.getElementById('cdLightboxBackdrop');

  if (!trigger || !lightbox) return;

  function openLightbox() {
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openLightbox);
  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* Navbar */
function initDetailNavbar() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars-staggered';
      }
    });
  }
}

/* Back to Top */
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* Share Course Button */
function initShareButton() {
  const shareBtn = document.getElementById('btnShareCourse');
  const toast = document.getElementById('shareToast');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const currentUrl = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    } catch (err) {
      alert(`คัดลอกลิงก์คอร์สนี้: ${currentUrl}`);
    }
  });
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

function getSubjectIcon(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('คณิต') || n.includes('math')) return 'fa-square-root-variable';
  if (n.includes('ฟิสิกส์') || n.includes('physics')) return 'fa-atom';
  if (n.includes('เคมี') || n.includes('chem')) return 'fa-flask-vial';
  if (n.includes('วิทย์') || n.includes('sci')) return 'fa-microscope';
  if (n.includes('อังกฤษ') || n.includes('eng')) return 'fa-language';
  if (n.includes('ชีวะ') || n.includes('bio')) return 'fa-dna';
  return 'fa-book-bookmark';
}

function openLightboxImage(url, caption = '') {
  const lightbox = document.getElementById('cdLightboxModal');
  const imgEl = document.getElementById('cdLightboxImg');
  const capEl = document.getElementById('cdLightboxCaption');
  const dlEl = document.getElementById('cdLightboxDownload');
  if (imgEl) imgEl.src = url;
  if (capEl) capEl.textContent = caption;
  if (dlEl) dlEl.href = url;
  if (lightbox) {
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
