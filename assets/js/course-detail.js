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

  // If no tutors matched or empty, hide the section
  if (displayTutors.length === 0) {
    if (card) card.style.display = 'none';
    return;
  }

  if (card) card.style.display = 'block';
  grid.innerHTML = displayTutors.map(t => `
    <div class="cd-tutor-mini-card">
      <div class="cd-tutor-avatar">
        <img src="${t.image}" alt="${t.name}">
      </div>
      <div class="cd-tutor-info">
        <h4>${t.name}</h4>
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
    if (window.getCourseSeatBadgeHtml) {
      badgeStatus.outerHTML = window.getCourseSeatBadgeHtml(course);
    } else {
      badgeStatus.className = `badge ${course.statusClass}`;
      badgeStatus.textContent = course.statusBadge;
    }
  }

  const titleEl = document.getElementById('cdCourseTitle');
  if (titleEl) titleEl.textContent = course.title;

  const subjectsEl = document.getElementById('cdCourseSubjects');
  if (subjectsEl) {
    subjectsEl.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> วิชาที่เปิดสอน: <strong>${course.subjects}</strong>`;
  }

  // อัปเดตรูปโปสเตอร์หลัก (ซ่อนหากไม่มีรูป)
  const posterCard = document.getElementById('cdPosterCard');
  const posterImg = document.getElementById('cdPosterImg');
  const posterSrc = (course.poster || course.cover || '').trim();
  if (posterSrc) {
    if (posterCard) posterCard.style.display = 'block';
    if (posterImg) {
      posterImg.src = posterSrc;
      posterImg.alt = course.title || '';
    }
    // Show remaining seats badge directly on the main course poster
    const posterViewBox = document.getElementById('cdPosterViewBox');
    if (posterViewBox && window.getCourseSeatBadgeHtml) {
      let coverBadge = document.getElementById('cdPosterSeatBadge');
      if (!coverBadge) {
        coverBadge = document.createElement('div');
        coverBadge.id = 'cdPosterSeatBadge';
        coverBadge.style.cssText = 'position: absolute; top: 16px; right: 16px; z-index: 5; pointer-events: none;';
        posterViewBox.appendChild(coverBadge);
      }
      coverBadge.innerHTML = window.getCourseSeatBadgeHtml(course);
    }
  } else {
    if (posterCard) posterCard.style.display = 'none';
  }

  // Lightbox Image & Caption
  const lightboxImg = document.getElementById('cdLightboxImg');
  const lightboxCaption = document.getElementById('cdLightboxCaption');
  const lightboxDownload = document.getElementById('cdLightboxDownload');
  if (lightboxImg) lightboxImg.src = posterSrc;
  if (lightboxCaption) lightboxCaption.textContent = course.title || '';
  if (lightboxDownload) lightboxDownload.href = posterSrc;

  // 1. Extra Posters / Gallery Strip (ซ่อนหากไม่มีรูปภาพเพิ่มเติม)
  const extraGalleryCard = document.getElementById('cdExtraGalleryCard');
  const extraGalleryContainer = document.getElementById('cdExtraGalleryContainer');
  if (extraGalleryCard && extraGalleryContainer) {
    const validGallery = (Array.isArray(course.galleryImages) ? course.galleryImages : []).filter(img => {
      const u = typeof img === 'string' ? img : (img ? img.url : '');
      return u && u.trim();
    });
    if (validGallery.length > 0) {
      extraGalleryCard.style.display = 'block';
      extraGalleryContainer.innerHTML = validGallery.map(img => {
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

  // 2. ตารางเรียนและรอบเวลา (Schedule Table) - อัปเดตชั่วโมงเรียนและรอบเวลา (ซ่อนหากไม่มีข้อมูล)
  const scheduleCard = document.getElementById('cdScheduleCard');
  const scheduleBody = document.getElementById('cdScheduleTableBody');
  const totalHoursBadge = document.getElementById('cdTotalHoursBadge');
  const validSchedules = (Array.isArray(course.scheduleList) ? course.scheduleList : []).filter(s => s && (s.type || s.time || s.dates));
  if (scheduleCard) {
    if (validSchedules.length > 0) {
      scheduleCard.style.display = 'block';
      if (totalHoursBadge) {
        if (course.totalHours && course.totalHours.trim()) {
          totalHoursBadge.style.display = 'inline-flex';
          totalHoursBadge.innerHTML = `<i class="fa-regular fa-clock"></i> ${escapeHtml(course.totalHours)}`;
        } else {
          totalHoursBadge.style.display = 'none';
        }
      }
      if (scheduleBody) {
        scheduleBody.innerHTML = validSchedules.map(s => `
          <tr>
            <td>
              <div class="schedule-group-name">
                <i class="fa-solid fa-chalkboard"></i> ${escapeHtml(s.type || '')}
              </div>
            </td>
            <td>
              <div class="schedule-time">
                <i class="fa-regular fa-clock"></i> ${escapeHtml(s.time || '')}
              </div>
            </td>
            <td>
              <div class="schedule-dates">
                <i class="fa-regular fa-calendar-check"></i> ${escapeHtml(s.dates || '')}
              </div>
            </td>
          </tr>
        `).join('');
      }

      // หมายเหตุการสำรองที่นั่ง (Editable from Admin Panel)
      const scheduleNoteEl = document.getElementById('cdScheduleNoteContent');
      if (scheduleNoteEl) {
        if (course.scheduleNote && course.scheduleNote.trim()) {
          const noteLines = course.scheduleNote.split('\n').map(l => l.trim()).filter(Boolean);
          scheduleNoteEl.innerHTML = `<strong>หมายเหตุการสำรองที่นั่ง:</strong><br>${noteLines.map(l => escapeHtml(l)).join('<br>')}`;
        } else {
          scheduleNoteEl.innerHTML = `<strong>หมายเหตุการสำรองที่นั่ง:</strong> เนื่องจากแต่ละกลุ่มเป็นห้องเรียนสด Onsite กลุ่มเล็กเพื่อการดูแลทั่วถึง โควตาในแต่ละรอบจึงมีจำนวนจำกัด หากรอบใดเต็มแล้วจะปิดรับสมัครทันที แนะนำให้ติดต่อสำรองที่นั่งล่วงหน้าครับ`;
        }
      }
    } else {
      scheduleCard.style.display = 'none';
      if (scheduleBody) scheduleBody.innerHTML = '';
    }
  }

  // 3. จุดเด่นและสิทธิประโยชน์ (Highlights - ซ่อนหากไม่มีข้อมูล)
  const highlightsCard = document.getElementById('cdHighlightsCard');
  const highlightsList = document.getElementById('cdHighlightsList');
  const validHighlights = (Array.isArray(course.highlights) ? course.highlights : []).filter(h => h && typeof h === 'string' && h.trim());
  if (highlightsCard) {
    if (validHighlights.length > 0) {
      highlightsCard.style.display = 'block';
      if (highlightsList) {
        highlightsList.innerHTML = validHighlights.map(h => `
          <li>
            <i class="fa-solid fa-circle-check"></i>
            <span>${escapeHtml(h)}</span>
          </li>
        `).join('');
      }
    } else {
      highlightsCard.style.display = 'none';
      if (highlightsList) highlightsList.innerHTML = '';
    }
  }

  // 4. Target Audience (Item 4: คอร์สนี้เหมาะกับใคร ? - ซ่อนหากไม่ได้กรอก)
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
          return `<li><i class="fa-solid fa-circle-check" style="color: #0284c7;"></i><span>${escapeHtml(clean)}</span></li>`;
        }).join('')}</ul>`;
      } else {
        targetAudienceContent.innerHTML = lines.map(p => `<p class="cd-custom-paragraph">${escapeHtml(p)}</p>`).join('');
      }
    } else {
      targetAudienceCard.style.display = 'none';
      targetAudienceContent.innerHTML = '';
    }
  }

  // 5. Benefits (Item 4: สิ่งที่จะได้รับจากคอร์สนี้ - ซ่อนหากไม่ได้กรอก)
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
          return `<li><i class="fa-solid fa-gift" style="color: #c026d3;"></i><span>${escapeHtml(clean)}</span></li>`;
        }).join('')}</ul>`;
      } else {
        benefitsContent.innerHTML = lines.map(p => `<p class="cd-custom-paragraph">${escapeHtml(p)}</p>`).join('');
      }
    } else {
      benefitsCard.style.display = 'none';
      benefitsContent.innerHTML = '';
    }
  }

  // 5. Subject Breakdown (Item 5: แยกรายวิชา - Cards Grid) & Bundle Promo Card (Requirement 6)
  const subjectBreakdownCard = document.getElementById('cdSubjectBreakdownCard');
  const subjectsGrid = document.getElementById('cdSubjectsGrid');

  const hasSubjects = course.subjectBreakdown && Array.isArray(course.subjectBreakdown) && course.subjectBreakdown.length > 0;
  
  if (hasSubjects && subjectsGrid) {
    if (subjectBreakdownCard) subjectBreakdownCard.style.display = 'block';

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
        </div>
      `;
    }).join('');
  } else if (subjectsGrid) {
    subjectsGrid.innerHTML = '';
  }

  // Requirement 6: Render Bundle Promo Card for this grade level instead of summary table
  renderCourseDetailBundlePromo(course);

  // Render Custom Sections (Admin Extensible Topics - ซ่อนหากไม่มีข้อมูล)
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
                <i class="fa-solid fa-circle-info" style="color: var(--color-cyan);"></i> ${escapeHtml(title)}
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

  // Render Tutors specifically teaching this course (ซ่อนหากไม่มีติวเตอร์)
  renderCourseTutors(course);

  // Render Parent Info & FAQ (ซ่อนหากไม่มีข้อมูล)
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

  // อัปเดตราคาในแถบ Sidebar (ตามรูปที่ผู้ใช้ส่งมา - ซ่อนแถวที่ไม่ได้กรอก)
  const priceOld = document.getElementById('cdPriceOld');
  if (priceOld) {
    if (course.priceOriginal && course.priceOriginal.trim()) {
      priceOld.style.display = 'inline-block';
      priceOld.textContent = `จาก ${course.priceOriginal}`;
    } else {
      priceOld.style.display = 'none';
    }
  }

  const pricePromo = document.getElementById('cdPricePromo');
  if (pricePromo) pricePromo.textContent = course.pricePromo || '';

  const priceUnit = document.getElementById('cdPriceUnit');
  if (priceUnit) {
    const rawU = course.priceUnit || 'บาท / เทอม';
    const cleanU = rawU.replace(/\(?\s*แบ่งชำระ(ได้)?\s*\)?/gi, '').replace(/[()]/g, '').trim();
    priceUnit.textContent = cleanU || 'บาท / เทอม';
  }

  // ราคาแบบรายเดือน (ป้ายเขียว) - ซ่อนหากไม่ได้กรอก
  const monthlyBadge = document.getElementById('cdMonthlyPriceBadge');
  const monthlyPrice = document.getElementById('cdMonthlyPrice');
  if (monthlyBadge) {
    if (course.monthlyPrice && course.monthlyPrice.trim()) {
      monthlyBadge.style.display = 'inline-flex';
      if (monthlyPrice) monthlyPrice.textContent = course.monthlyPrice;
    } else {
      monthlyBadge.style.display = 'none';
    }
  }

  // สถานที่เรียน - ซ่อนหากไม่ได้กรอก
  const locationRow = document.getElementById('cdLocationRow');
  const locationText = document.getElementById('cdLocationText');
  if (locationRow) {
    if (course.location && course.location.trim()) {
      locationRow.style.display = 'flex';
      if (locationText) locationText.textContent = course.location;
    } else {
      locationRow.style.display = 'none';
    }
  }

  // เวลาเรียนรวม - ซ่อนหากไม่ได้กรอก
  const hoursRow = document.getElementById('cdHoursRow');
  const sidebarHours = document.getElementById('cdSidebarHours');
  if (hoursRow) {
    if (course.totalHours && course.totalHours.trim()) {
      hoursRow.style.display = 'flex';
      if (sidebarHours) sidebarHours.textContent = course.totalHours;
    } else {
      hoursRow.style.display = 'none';
    }
  }

  // ขนาดห้องเรียน - ซ่อนหากไม่ได้กรอก
  const classSizeRow = document.getElementById('cdClassSizeRow');
  const classSizeText = document.getElementById('cdClassSizeText');
  if (classSizeRow) {
    if (course.classSize && course.classSize.trim()) {
      classSizeRow.style.display = 'flex';
      if (classSizeText) classSizeText.textContent = course.classSize;
    } else {
      classSizeRow.style.display = 'none';
    }
  }

  // ชุดเอกสาร - ซ่อนหากไม่ได้กรอก
  const materialsRow = document.getElementById('cdMaterialsRow');
  const materialsText = document.getElementById('cdMaterialsText');
  if (materialsRow) {
    if (course.materials && course.materials.trim()) {
      materialsRow.style.display = 'flex';
      if (materialsText) materialsText.textContent = course.materials;
    } else {
      materialsRow.style.display = 'none';
    }
  }

  // การันตีการสอนท้ายการ์ด - ซ่อนหากไม่ได้กรอก
  const trustItem = document.getElementById('cdTrustGuaranteeItem');
  const trustText = document.getElementById('cdTrustGuaranteeText');
  const trustBadgesWrap = document.getElementById('cdTrustBadges');
  if (trustItem) {
    if (course.trustGuarantee && course.trustGuarantee.trim()) {
      trustItem.style.display = 'flex';
      if (trustText) trustText.textContent = course.trustGuarantee;
      if (trustBadgesWrap) trustBadgesWrap.style.display = 'block';
    } else {
      trustItem.style.display = 'none';
      if (trustBadgesWrap) trustBadgesWrap.style.display = 'none';
    }
  }

  // ปรับลิงก์ LINE และปุ่มสมัครเรียน
  const lineEnrollBtn = document.getElementById('btnLineEnroll');
  const contact = window.NewGenDB ? window.NewGenDB.getContact() : (window.DEFAULT_CONTACT || null);
  const fmt = window.formatExternalUrl || ((u) => u);
  const baseLineUrl = (contact && contact.lineUrl) ? contact.lineUrl : 'https://lin.ee/RXrzi1G';

  if (lineEnrollBtn) {
    lineEnrollBtn.href = fmt(baseLineUrl);
    lineEnrollBtn.target = '_blank';
    lineEnrollBtn.rel = 'noopener noreferrer';
  }

  // ปุ่มสมัครเรียนโดยตรง (Sidebar) & Mobile Bar
  const eff = window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(course) : {
    isFull: course.isFull === true || course.remainingSeats === 0,
    remainingSeats: course.remainingSeats || 0
  };

  const directRegisterBtn = document.getElementById('btnDirectRegister');
  const directTitle = document.getElementById('btnDirectRegisterTitle');
  const directSub = document.getElementById('btnDirectRegisterSub');
  if (directRegisterBtn) {
    if (eff.isFull) {
      directRegisterBtn.href = 'javascript:void(0)';
      directRegisterBtn.onclick = null;
      directRegisterBtn.classList.add('disabled');
      directRegisterBtn.setAttribute('aria-disabled', 'true');
      if (directTitle) directTitle.textContent = 'ที่นั่งเต็มแล้ว (ปิดรับสมัคร)';
      if (directSub) directSub.textContent = 'ทัก LINE เพื่อสอบถามรอบถัดไป';
    } else {
      directRegisterBtn.href = 'javascript:void(0)';
      directRegisterBtn.removeAttribute('target');
      directRegisterBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof window.openEnrollmentModal === 'function') {
          window.openEnrollmentModal(course.id);
        }
      };
      directRegisterBtn.classList.remove('disabled');
      directRegisterBtn.removeAttribute('aria-disabled');
      if (directTitle) directTitle.textContent = 'สมัครเรียนเลย (จองที่นั่ง)';
      if (directSub) {
        directSub.textContent = (eff.remainingSeats > 0 && eff.remainingSeats <= 5)
          ? `🔥 เหลือเพียง ${eff.remainingSeats} ที่นั่งสุดท้าย`
          : 'กรอกข้อมูลและลงทะเบียนทันที';
      }
    }
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

  // ปรับ Mobile Sticky Action Bar
  const msbPricePromo = document.getElementById('cdMsbPricePromo');
  if (msbPricePromo) msbPricePromo.textContent = course.pricePromo;
  const msbPriceUnit = document.getElementById('cdMsbPriceUnit');
  if (msbPriceUnit) {
    const rawU = course.priceUnit || 'บาท / เทอม';
    const cleanU = rawU.replace(/\(?\s*แบ่งชำระ(ได้)?\s*\)?/gi, '').replace(/[()]/g, '').trim();
    msbPriceUnit.textContent = cleanU || 'บาท / เทอม';
  }
  const msbLineBtn = document.getElementById('btnMsbLine');
  if (msbLineBtn) {
    msbLineBtn.href = fmt(baseLineUrl);
  }
  const msbPhoneBtn = document.getElementById('btnMsbPhone');
  if (msbPhoneBtn && contact && Array.isArray(contact.phones) && contact.phones.length > 0) {
    msbPhoneBtn.href = contact.phones[0].telLink || ('tel:' + contact.phones[0].number.replace(/[^0-9]/g, ''));
  }
  const msbRegisterBtn = document.getElementById('btnMsbRegister');
  if (msbRegisterBtn) {
    if (eff.isFull) {
      msbRegisterBtn.href = 'javascript:void(0)';
      msbRegisterBtn.onclick = null;
      msbRegisterBtn.classList.add('disabled');
      msbRegisterBtn.innerHTML = '<i class="fa-solid fa-ban"></i> เต็มแล้ว';
    } else {
      msbRegisterBtn.href = 'javascript:void(0)';
      msbRegisterBtn.removeAttribute('target');
      msbRegisterBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof window.openEnrollmentModal === 'function') {
          window.openEnrollmentModal(course.id);
        }
      };
      msbRegisterBtn.classList.remove('disabled');
      msbRegisterBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> สมัครเลย';
    }
  }

  // แสดงคอร์สที่เกี่ยวข้อง (Related Courses)
  renderRelatedCourses(course.id);

  // Hidden Course Notice Banner
  const hiddenBannerEl = document.getElementById('cdHiddenNotice');
  if (course.isHidden) {
    if (!hiddenBannerEl) {
      const banner = document.createElement('div');
      banner.id = 'cdHiddenNotice';
      banner.className = 'course-hidden-banner';
      banner.style.cssText = 'background:#fef2f2; border:1.5px solid #fecaca; border-radius:12px; padding:14px 18px; margin: 16px 0 20px; display:flex; align-items:center; gap:12px; color:#991b1b;';
      banner.innerHTML = `
        <i class="fa-solid fa-eye-slash" style="font-size:1.4rem; color:#dc2626;"></i>
        <div>
          <strong style="font-size:1rem; display:block;">คอร์สเรียนนี้ถูกตั้งค่าซ่อนไว้ (ไม่แสดงในหน้ารวมคอร์ส)</strong>
          <span style="font-size:0.85rem; color:#b91c1c;">คอร์สนี้เปิดดูได้เฉพาะผู้ที่มีลิงก์ตรงหรือผู้ดูแลระบบเท่านั้น</span>
        </div>
      `;
      const headerMeta = document.querySelector('.cd-header-meta');
      if (headerMeta) headerMeta.prepend(banner);
    }
  } else if (hiddenBannerEl) {
    hiddenBannerEl.remove();
  }
}

function renderRelatedCourses(currentCourseId) {
  const relatedGrid = document.getElementById('cdRelatedGrid');
  if (!relatedGrid) return;

  const courses = window.courseData || [];
  const currentCourse = courses.find(c => c.id === currentCourseId) || {};

  // Requirement 5: Show only courses of the same grade level currently viewed
  let filteredCourses = courses.filter(c => c.id !== currentCourseId && !c.isHidden && c.category === currentCourse.category);
  
  // If no other course in exact category, fallback to others so the section isn't completely empty
  if (filteredCourses.length === 0) {
    filteredCourses = courses.filter(c => c.id !== currentCourseId && !c.isHidden);
  }

  // Update subtitle
  const subtitleEl = document.getElementById('cdRelatedSubtitle');
  if (subtitleEl) {
    const gradeName = currentCourse.categoryLabel || currentCourse.category || '';
    subtitleEl.textContent = `เลือกดูคอร์สเรียนอื่นๆ ในระดับชั้น ${gradeName}`;
  }

  const contact = window.NewGenDB ? window.NewGenDB.getContact() : (window.DEFAULT_CONTACT || null);
  const fmt = window.formatExternalUrl || ((u) => u);
  const baseLineUrl = (contact && contact.lineUrl) ? contact.lineUrl : 'https://lin.ee/RXrzi1G';

  relatedGrid.innerHTML = filteredCourses.map(c => {
    const isFull = Boolean(c.isFull === true || (c.remainingSeats !== null && Number(c.remainingSeats) <= 0));
    return `
    <div class="course-card" style="min-width: 290px; max-width: 310px; flex: 0 0 295px; margin: 0; display: flex; flex-direction: column;">
      <a href="course-detail.html?id=${c.id}" class="course-thumbnail ${isFull ? 'is-full' : ''}" aria-label="ดูรายละเอียด ${c.title}">
        <img src="${c.cover || c.poster}" alt="${c.title}" loading="lazy">
        <span class="course-badge-level">${escapeHtml(c.categoryLabel || (c.category === 'primary' ? 'ประถมศึกษา' : 'มัธยมศึกษาตอนต้น'))}</span>
        ${window.getCourseSeatBadgeHtml ? window.getCourseSeatBadgeHtml(c) : `<span class="badge ${c.statusClass} course-badge-status">${c.statusBadge}</span>`}
      </a>
      <div class="course-body" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
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
        </div>
        <div class="course-footer">
          ${(window.formatCoursePriceHtml ? window.formatCoursePriceHtml(c) : `
            <div class="course-price-wrap">
              <span class="course-price-old">จาก ${c.priceOriginal || ''}</span>
              <div class="course-price-now">
                <span class="course-price-amount-group">
                  <span class="course-price-amount">${c.pricePromo}</span><span class="course-price-dash">.-</span>
                </span>
                <span class="course-price-unit-tag">${c.priceUnit || 'บาท / เทอม'}</span>
              </div>
            </div>
          `)}
          <div class="course-actions-wrap">
            ${isFull ? `
              <button type="button" class="btn-course-register disabled" disabled title="ที่นั่งเต็มแล้ว">
                <i class="fa-solid fa-ban"></i> ที่นั่งเต็ม
              </button>
            ` : `
              <button type="button" class="btn-course-register" onclick="openEnrollmentModal('${c.id}')" title="สมัครเรียนคอร์สนี้">
                <i class="fa-solid fa-bolt"></i> สมัครเลย
              </button>
            `}
            <a href="course-detail.html?id=${c.id}" class="btn-detail-link">
              รายละเอียด <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

/**
 * ฟังก์ชันเลื่อนการ์ดคอร์สเรียนอื่นๆ ซ้าย-ขวา ใน 1 บรรทัด (Requirement 5)
 */
function scrollRelatedCourses(direction) {
  const grid = document.getElementById('cdRelatedGrid');
  if (!grid) return;
  const scrollAmount = 315 * direction;
  grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}
window.scrollRelatedCourses = scrollRelatedCourses;

/**
 * แสดงการ์ดแพ็คเกจโปรโมชั่นประจำระดับชั้นนี้ แทนตารางสรุปเดิม (Requirement 6)
 */
function renderCourseDetailBundlePromo(course) {
  const promoSection = document.getElementById('cdBundlePromoSection');
  if (!promoSection) return;

  const bundles = (window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []));
  const allCourses = window.courseData || (window.NewGenDB ? window.NewGenDB.getCourses() : []);

  // Find matching active bundle for this course's level
  const matchingBundle = bundles.find(b => {
    if (b.active === false) return false;
    // 1. Direct course ID inclusion
    if (Array.isArray(b.courseIds) && b.courseIds.includes(course.id)) return true;
    // 2. Explicit categoryIds matching course.category
    if (Array.isArray(b.categoryIds) && b.categoryIds.includes(course.category)) return true;
    // 3. Child course has same category
    if (Array.isArray(b.courseIds)) {
      const hasSameCatCourse = b.courseIds.some(cid => {
        const found = allCourses.find(x => x.id === cid);
        return found && found.category === course.category;
      });
      if (hasSameCatCourse) return true;
    }
    // 4. Regex grade match on bundle name
    const catName = String(course.categoryLabel || course.category || '');
    const m = catName.match(/([ปม]\.[1-6])/i);
    if (m && new RegExp(m[1].replace('.', '\\.'), 'i').test(b.name || '')) {
      return true;
    }
    return false;
  });

  const breakdownCard = document.getElementById('cdSubjectBreakdownCard');

  if (!matchingBundle) {
    // Requirement 6: "ถ้าชั้นไหนไม่มีแพ็ครวม ก็ไม่ต้องใส่ครับ"
    promoSection.style.display = 'none';
    promoSection.innerHTML = '';
    const hasSubjects = course.subjectBreakdown && Array.isArray(course.subjectBreakdown) && course.subjectBreakdown.length > 0;
    if (!hasSubjects && breakdownCard) {
      breakdownCard.style.display = 'none';
    }
    return;
  }

  if (breakdownCard) breakdownCard.style.display = 'block';
  promoSection.style.display = 'block';

  const childCourseIds = Array.isArray(matchingBundle.courseIds) ? matchingBundle.courseIds : [];
  const childCourses = allCourses.filter(c => childCourseIds.includes(c.id));

  const origNum = parseInt(String(matchingBundle.priceOriginal || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const promoNum = parseInt(String(matchingBundle.pricePromo || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const savingsVal = Math.max(0, origNum - promoNum);
  const savingsPercent = (origNum > 0 && promoNum > 0 && savingsVal > 0) ? Math.round((savingsVal / origNum) * 100) : 0;

  const isCustom = matchingBundle.imageMode === 'custom' && matchingBundle.customImage;
  let visualHtml = '';
  if (isCustom) {
    visualHtml = `
      <div class="bundle-promo-poster-wrap" style="position: relative; width: 155px; height: 195px; border-radius: 12px; overflow: hidden; background: #0b1e3f; flex-shrink: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.2);">
        <img src="${escapeHtml(matchingBundle.customImage)}" alt="${escapeHtml(matchingBundle.name)}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
    `;
  } else {
    const covers = childCourses.slice(0, 3).map(c => window.resolveMediaUrl ? window.resolveMediaUrl(c.cover || c.poster) : (c.cover || c.poster || 'assets/images/course-poster-primary.jpg'));
    visualHtml = `
      <div class="bundle-promo-stack-wrap" style="position: relative; width: 165px; height: 195px; perspective: 700px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${covers.map((imgUrl, i) => {
          let transform = '';
          let zIndex = 3 - i;
          if (i === 0) {
            transform = 'translateX(-20px) translateY(8px) rotate(-8deg) scale(0.92)';
          } else if (i === 1) {
            transform = 'translateX(20px) translateY(-4px) rotate(6deg) scale(0.96)';
            zIndex = 4;
          } else if (i === 2) {
            transform = 'translateX(0) translateY(-12px) scale(0.86)';
            zIndex = 2;
          }
          return `<img src="${imgUrl}" alt="Course" style="position: absolute; width: 110px; height: 145px; object-fit: cover; border-radius: 8px; border: 2px solid #ffffff; box-shadow: 0 10px 24px rgba(0,0,0,0.4); transform: ${transform}; z-index: ${zIndex};">`;
        }).join('')}
      </div>
    `;
  }

  const bundleStatus = window.isBundleFull ? window.isBundleFull(matchingBundle, allCourses) : { isFull: false, fullCourses: [] };

  promoSection.innerHTML = `
    <div class="cd-bundle-promo-card ${bundleStatus.isFull ? 'is-full' : ''}" style="background: linear-gradient(135deg, #091a3e 0%, #172554 100%); border: 2px solid ${bundleStatus.isFull ? '#ef4444' : '#3b82f6'}; border-radius: 16px; padding: 24px; color: #ffffff; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18); display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
      ${visualHtml}
      <div style="flex: 1; min-width: 260px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          ${bundleStatus.isFull ? `
            <span class="badge" style="background: #ef4444; color: #fff; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 99px;">
              <i class="fa-solid fa-ban"></i> มีคอร์สในแพ็คเกจที่นั่งเต็มแล้ว
            </span>
          ` : `
            <span class="badge" style="background: linear-gradient(135deg, #f43f5e, #be123c); color: #fff; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 99px;">
              ${escapeHtml(matchingBundle.badge || '🔥 PACKAGE สุดคุ้มรวมทุกวิชา')}
            </span>
          `}
          ${savingsPercent > 0 ? `
            <span class="badge" style="background: #16a34a; color: #fff; font-weight: 800; font-size: 0.78rem; padding: 3px 9px; border-radius: 6px;">
              ประหยัด ${savingsPercent}%
            </span>
          ` : ''}
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; line-height: 1.35;">
          ${escapeHtml(matchingBundle.name)}
        </h3>
        <p style="color: #cbd5e1; font-size: 0.88rem; margin: 0 0 14px 0; line-height: 1.5;">
          ${escapeHtml(matchingBundle.description || 'สมัครแพ็คเกจรวมวิชาในระดับชั้นนี้ ประหยัดกว่า และได้รับการดูแลครบถ้วนทุกวิชาพร้อมเอกสารจัดเต็ม')}
        </p>
        <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
          ${matchingBundle.priceOriginal ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 1rem;">ปกติ ${escapeHtml(matchingBundle.priceOriginal)}.-</span>` : ''}
          <span style="font-size: 1.85rem; font-weight: 800; color: #38bdf8; line-height: 1;">${escapeHtml(matchingBundle.pricePromo)}.-</span>
          <span style="color: #94a3b8; font-size: 0.82rem;">${escapeHtml(matchingBundle.priceUnit || 'บาท / แพ็คเกจ')}</span>
          ${savingsVal > 0 ? `
            <span style="background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; font-size: 0.82rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
              ประหยัดทันที ${savingsVal.toLocaleString()} บ.
            </span>
          ` : ''}
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn-secondary" onclick="openBundleDetailModal('${matchingBundle.id}')" style="background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #ffffff; padding: 9px 18px; font-size: 0.88rem; border-radius: 8px;">
            <i class="fa-solid fa-circle-info"></i> ดูรายละเอียดแพ็คเกจ
          </button>
          ${bundleStatus.isFull ? `
            <button type="button" class="btn-secondary" onclick="openBundleDetailModal('${matchingBundle.id}')" style="background: #64748b; border: 1.5px solid #475569; color: #ffffff; padding: 9px 20px; font-size: 0.88rem; border-radius: 8px; cursor: not-allowed; box-shadow: none;">
              <i class="fa-solid fa-ban"></i> ที่นั่งเต็มแล้ว
            </button>
          ` : `
            <button type="button" class="btn-primary" onclick="openEnrollmentModal('${matchingBundle.id}', true)" style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 9px 20px; font-size: 0.88rem; border-radius: 8px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);">
              <i class="fa-solid fa-bolt-lightning"></i> จองแพ็กเกจรวม
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
window.renderCourseDetailBundlePromo = renderCourseDetailBundlePromo;

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
  if (typeof window.initNavbar === 'function') {
    window.initNavbar();
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
