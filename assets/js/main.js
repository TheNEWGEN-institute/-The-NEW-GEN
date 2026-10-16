/**
 * The NEW GEN Tutoring Institute - Main Interactive Scripts
 */

function bootstrapApp() {
  initNavbar();
  initHeroTutors();
  initWhyUs();
  initCourseSlider();
  initHomeReviews();
  initHomeFeaturedVideo();
  initBackToTop();
  initSmoothScroll();
  initHomePopupCampaign();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

document.addEventListener('newgen:synced', () => {
  renderHeroContent();
  initWhyUs();
  initCourseSlider();
  initHomeReviews();
  initHomeFeaturedVideo();
  renderHomePopupCampaign();
});

if (typeof window !== 'undefined') {
  window.renderHeroContent = renderHeroContent;
  window.initCourseSlider = initCourseSlider;
  window.initHomeReviews = initHomeReviews;
  window.initHomeFeaturedVideo = initHomeFeaturedVideo;
  window.initWhyUs = initWhyUs;
  window.initNavbar = initNavbar;
  window.initHomePopupCampaign = initHomePopupCampaign;
  window.renderHomePopupCampaign = renderHomePopupCampaign;
  window.openCampaignPopup = openCampaignPopup;
  window.closeCampaignPopup = closeCampaignPopup;
  window.dismissCampaignFloatingPill = dismissCampaignFloatingPill;
  window.handleCampaignRegisterClick = handleCampaignRegisterClick;
}

/* ----------------------------------------------------
   1. Navbar Scroll & Mobile Menu
   ---------------------------------------------------- */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky header background transition
  if (header && !header.dataset.scrollBound) {
    header.dataset.scrollBound = 'true';
    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Guard against duplicate binding on menuToggle
  if (menuToggle && mobileMenu) {
    if (menuToggle.dataset.navBound === 'true') {
      return;
    }
    menuToggle.dataset.navBound = 'true';

    const setMenuState = (open) => {
      if (open) {
        mobileMenu.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.classList.add('active');
        const icon = menuToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-xmark';
      } else {
        mobileMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars-staggered';
      }
    };

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !mobileMenu.classList.contains('open');
      setMenuState(willOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        setMenuState(false);
      });
    });

    // Close when tapping outside header/menu
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open')) {
        if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          setMenuState(false);
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        setMenuState(false);
      }
    });

    // Close when resized back to desktop view
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992 && mobileMenu.classList.contains('open')) {
        setMenuState(false);
      }
    });
  }
}

/* ----------------------------------------------------
   2. Dynamic Hero Tutors Showcase & Home Page Content
   ---------------------------------------------------- */
function initHeroTutors() {
  renderHeroContent();

  document.addEventListener('newgen:synced', () => {
    renderHeroContent();
  });

  // Optional local backend preview (NEVER overwrite Cloud)
  const apiUrl = (window.getApiBaseUrl ? window.getApiBaseUrl() : '') + '/api/home';
  fetch(apiUrl)
    .then(res => res.json())
    .then(serverHome => {
      if (serverHome && (serverHome.subtitle || serverHome.leadText) && !window._supabaseHomeSynced) {
        renderHeroContent(serverHome);
      }
    })
    .catch(() => {});
}

function renderHeroContent(customHomeData) {
  const homeData = customHomeData || (window.NewGenDB ? window.NewGenDB.getHome() : (window.homeData || {}));

  // 1. Sync Hero texts
  const badgeWrap = document.querySelector('.hero-badge-wrap');
  if (badgeWrap && homeData.heroBadge) {
    badgeWrap.innerHTML = `<span class="badge badge-royal"><i class="fa-solid fa-award" style="color: var(--color-gold);"></i> ${escapeHtml(homeData.heroBadge)}</span>`;
  }

  const subtitleEl = document.querySelector('.hero-subtitle');
  if (subtitleEl && homeData.subtitle) {
    if (homeData.subtitle.includes('The NEW GEN')) {
      subtitleEl.innerHTML = homeData.subtitle.replace('The NEW GEN', '<span class="highlight-red">The NEW GEN</span>');
    } else {
      subtitleEl.textContent = homeData.subtitle;
    }
  }

  const leadEl = document.getElementById('heroLeadText') || document.querySelector('.hero-statement-text') || document.querySelector('.hero-lead-text');
  if (leadEl && homeData.leadText) {
    formatHeroLeadText(leadEl, homeData.leadText);
  }

  const trustRow = document.querySelector('.hero-trust-row');
  if (trustRow && homeData.trustBadges && Array.isArray(homeData.trustBadges)) {
    trustRow.innerHTML = homeData.trustBadges.map(tb => `
      <div class="trust-mini-item">
        <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> ${escapeHtml(tb)}
      </div>
    `).join('');
  }

  const headerPill = document.querySelector('.hero-tutors-header-pill');
  if (headerPill && homeData.heroTutorsHeaderPill) {
    headerPill.innerHTML = `<i class="fa-solid fa-award"></i> ${escapeHtml(homeData.heroTutorsHeaderPill)}`;
  }

  // Recommended Courses Header Sync
  const coursesBadgeEl = document.getElementById('homeCoursesSubtitle');
  if (coursesBadgeEl && homeData.coursesBadge) {
    coursesBadgeEl.textContent = homeData.coursesBadge;
  }
  const coursesTitleEl = document.getElementById('homeCoursesTitleText');
  if (coursesTitleEl && homeData.coursesTitle) {
    coursesTitleEl.textContent = homeData.coursesTitle;
  }
  const coursesHighlightEl = document.getElementById('homeCoursesHighlightText');
  if (coursesHighlightEl && homeData.coursesHighlight) {
    coursesHighlightEl.textContent = homeData.coursesHighlight;
  }

  // 2. Select & Position 3 Tutors for Hero Showcase
  const grid = document.getElementById('heroTutorsGrid');
  if (!grid) return;

  const tutors = window.NewGenDB ? window.NewGenDB.getTutors() : (window.tutorsData || []);
  if (!tutors || tutors.length === 0) return;

  // Resolve tutor IDs → actual tutor objects (fall back to array order)
  const leftTutor = (homeData.heroTutorLeftId ? tutors.find(t => t.id === homeData.heroTutorLeftId) : null) || tutors[0];
  const centerTutor = (homeData.heroTutorCenterId ? tutors.find(t => t.id === homeData.heroTutorCenterId) : null) || (tutors.length > 1 ? tutors[1] : tutors[0]);
  const rightTutor = (homeData.heroTutorRightId ? tutors.find(t => t.id === homeData.heroTutorRightId) : null) || (tutors.length > 2 ? tutors[2] : (tutors.length > 1 ? tutors[1] : tutors[0]));

  // Helper: pick badge color based on tutor's subject keywords
  function pickBadgeClass(t) {
    const sub = ((t && t.subjects) || '').toLowerCase();
    if (sub.includes('เคมี') || sub.includes('วิทยาศาสตร์')) return 'badge-chem';
    if (sub.includes('ฟิสิกส์') || sub.includes('อังกฤษ') || sub.includes('english')) return 'badge-eng';
    if (sub.includes('คณิต') || sub.includes('math')) return 'badge-math';
    return 'badge-chem'; // default
  }

  const showcaseTutors = [
    { tutor: leftTutor, isFeatured: false },
    { tutor: centerTutor, isFeatured: true },
    { tutor: rightTutor, isFeatured: false }
  ];

  grid.innerHTML = showcaseTutors.map(({ tutor: t, isFeatured }) => {
    if (!t) return '';
    const badgeText = t.heroBadge || t.badge || t.subjects || 'ประจำสถาบัน';
    const badgeClass = pickBadgeClass(t);
    const tutorImg = window.resolveMediaUrl ? window.resolveMediaUrl(t.image) : t.image;
    return `
      <div class="hero-tutor-card ${isFeatured ? 'featured' : ''}" data-tutor-id="${t.id}">
        <div class="hero-tutor-img-box">
          <img src="${tutorImg}" alt="${escapeHtml(t.name)} ${escapeHtml(t.honor)}" loading="eager">
          <span class="tutor-mini-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
        </div>
        <div class="hero-tutor-meta">
          <h3 class="hero-tutor-name">${escapeHtml(t.name)}</h3>
          <div class="hero-tutor-degree">
            <i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(t.honor || t.degree || '')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatHeroLeadText(element, rawText) {
  if (!element || !rawText) return;
  const text = String(rawText).trim();

  // 1. If user entered line breaks in admin, respect them explicitly (max 3 lines)
  if (text.includes('\n')) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
    element.innerHTML = lines.map(line => `<span>${escapeHtml(line)}</span>`).join('<br class="hero-statement-br">');
    return;
  }

  // 2. Intelligent clause balancing for single-block paragraph:
  // Detects natural Thai conjunctions closest to the middle (30%-70% of length) to avoid orphan words
  const splitKeywords = [
    'และการเตรียมสอบ',
    'และเตรียมสอบ',
    'พร้อมให้คำแนะนำ',
    'การเรียนล่วงหน้า',
    'เสริมความเข้าใจ',
    'ครอบคลุมทั้ง',
    'เพื่อเพิ่มผลสัมฤทธิ์'
  ];

  const half = Math.floor(text.length / 2);
  let bestIdx = -1;
  let bestDist = Infinity;

  for (const kw of splitKeywords) {
    let pos = text.indexOf(kw);
    while (pos !== -1) {
      // If keyword is 'เสริมความเข้าใจ', split right after it
      const cutPoint = kw === 'เสริมความเข้าใจ' ? pos + kw.length : pos;
      const dist = Math.abs(cutPoint - half);
      if (dist < bestDist && cutPoint > text.length * 0.28 && cutPoint < text.length * 0.72) {
        bestDist = dist;
        bestIdx = cutPoint;
      }
      pos = text.indexOf(kw, pos + 1);
    }
  }

  if (bestIdx !== -1) {
    const part1 = text.slice(0, bestIdx).trim();
    const part2 = text.slice(bestIdx).trim();
    element.innerHTML = `<span>${escapeHtml(part1)}</span><br class="hero-statement-br"><span>${escapeHtml(part2)}</span>`;
  } else {
    element.innerHTML = `<span>${escapeHtml(text)}</span>`;
  }
}

/* ----------------------------------------------------
   3. Course Slider Carousel
   ---------------------------------------------------- */
function initCourseSlider() {
  const track = document.getElementById('coursesTrack');
  if (!track) return;

  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const dotsContainer = document.getElementById('sliderDots');

  let currentIndex = 0;

  renderCourses();

  // Listen to Supabase sync event to auto-refresh home courses & bundles
  document.addEventListener('newgen:synced', () => {
    renderCourses();
  });
  window.renderCourses = renderCourses;

  function renderCourses() {
    track.innerHTML = '';
    const allCourses = window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []);
    const allBundles = window.NewGenDB ? window.NewGenDB.getBundles() : (window.bundlesData || []);
    const homeBundles = allBundles
      .filter(b => b.active !== false && b.showInHome !== false)
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
    const filteredCourses = allCourses.filter(c => c.isFeatured !== false && !c.isHidden);

    if (filteredCourses.length === 0 && homeBundles.length === 0) {
      track.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); width: 100%;"><p>ยังไม่มีคอร์สเรียนแนะนำในขณะนี้</p></div>';
      updatePagination();
      return;
    }

    // 1. Render Home Bundles (if enabled)
    homeBundles.forEach(b => {
      const childCourseIds = Array.isArray(b.courseIds) ? b.courseIds : [];
      const childCourses = allCourses.filter(c => childCourseIds.includes(c.id));
      const bundleStatus = window.isBundleFull ? window.isBundleFull(b, allCourses) : { isFull: false, fullCourses: [] };
      const isCustom = b.imageMode === 'custom' && b.customImage;
      const count = Math.min(childCourses.length, 4);
      const visualHtml = isCustom
        ? `<img src="${b.customImage}" alt="${escapeHtml(b.name)}">`
        : `<div class="bundle-grid-wrap count-${count}">
            ${childCourses.slice(0, 4).map((c, i) => `
              <div class="bundle-grid-item" title="${escapeHtml(c.title)}">
                <img src="${c.cover || c.poster || 'assets/images/course-poster-primary.jpg'}" alt="${escapeHtml(c.title)}" loading="lazy">
              </div>
            `).join('')}
          </div>`;

      const origNum = parseInt(String(b.priceOriginal || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const promoNum = parseInt(String(b.pricePromo || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const savingsVal = Math.max(0, origNum - promoNum);

      const card = document.createElement('div');
      card.className = `bundle-card ${bundleStatus.isFull ? 'is-full' : ''}`;
      card.style.cssText = 'flex-shrink: 0; min-width: 320px; max-width: 380px; width: 100%; box-sizing: border-box; cursor: pointer;';
      card.onclick = (e) => {
        if (!e.target.closest('button')) {
          openBundleDetailModal(b.id);
        }
      };
      card.innerHTML = `
        <div class="bundle-thumb-area ${isCustom ? 'custom-img' : ''}" style="cursor: pointer;" title="คลิกเพื่อดูรายละเอียดแพ็คเกจ">
          ${visualHtml}
          ${bundleStatus.isFull
            ? `<span class="bundle-badge-promo" style="background: #ef4444;"><i class="fa-solid fa-ban"></i> ที่นั่งเต็มแล้ว</span>`
            : `<span class="bundle-badge-promo"><i class="fa-solid fa-fire"></i> ${escapeHtml(b.badge || '🔥 แพ็คเกจโปรโมชั่น')}</span>`
          }
          ${savingsVal > 0 ? `<span class="bundle-savings-pill"><i class="fa-solid fa-gift"></i> ประหยัดทันที ${savingsVal.toLocaleString()}.-</span>` : ''}
        </div>
        <div class="bundle-card-body">
          <div>
            <h3 class="bundle-title" onclick="event.stopPropagation(); openBundleDetailModal('${b.id}')" style="cursor: pointer;" title="คลิกเพื่อดูรายละเอียดแพ็คเกจ">${escapeHtml(b.name)}</h3>
            <div class="bundle-included-list">
              <div class="bundle-included-heading"><i class="fa-solid fa-layer-group"></i> รวม ${childCourses.length} คอร์สเรียนในแพ็คนี้:</div>
              ${childCourses.map(c => {
                const isCFull = bundleStatus.fullCourses.some(fc => fc.id === c.id);
                return `
                  <div class="bundle-included-item">
                    <i class="fa-solid ${isCFull ? 'fa-circle-xmark' : 'fa-circle-check'}" style="${isCFull ? 'color:#ef4444;' : ''}"></i>
                    <span><strong>${escapeHtml(c.title)}</strong> ${isCFull ? '<span style="color:#ef4444; font-weight:800;">(ที่นั่งเต็ม)</span>' : ''}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="course-footer">
            <div class="course-price-wrap">
              ${b.priceOriginal ? `<span class="course-price-old">จาก ${escapeHtml(b.priceOriginal)}</span>` : ''}
              <div class="course-price-now">
                <span class="course-price-amount-group">
                  <span class="course-price-amount" style="color:#e11d48;">${escapeHtml(b.pricePromo || '0')}</span><span class="course-price-dash" style="color:#e11d48;">.-</span>
                </span>
                <span class="course-price-unit-tag">${escapeHtml(b.priceUnit || 'บาท / แพ็คเกจ')}</span>
              </div>
            </div>
            <div class="course-actions-wrap">
              ${bundleStatus.isFull ? `
                <button type="button" class="btn-course-register disabled" onclick="event.stopPropagation(); openBundleDetailModal('${b.id}')" title="มีคอร์สในแพ็คเกจที่นั่งเต็มแล้ว" style="background: #94a3b8; border-color: #94a3b8; cursor: not-allowed; box-shadow: none;">
                  <i class="fa-solid fa-ban"></i> ที่นั่งเต็ม
                </button>
              ` : `
                <button type="button" class="btn-course-register" onclick="event.stopPropagation(); openEnrollmentModal('${b.id}')" title="สมัครแพ็คเกจนี้" style="background: linear-gradient(135deg, #e11d48, #be123c); border-color: #be123c;">
                  <i class="fa-solid fa-bolt"></i> สมัครแพ็คเกจนี้
                </button>
              `}
              <button type="button" class="btn-detail-link" onclick="event.stopPropagation(); openBundleDetailModal('${b.id}')" title="ดูรายละเอียดคอร์สในแพ็คเกจ" style="border: none; cursor: pointer;">
                รายละเอียด <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      track.appendChild(card);
    });

    // 2. Render Standard Courses
    filteredCourses.forEach(c => {
      const card = document.createElement('div');
      card.className = 'course-card';
      const isFull = Boolean(c.isFull === true || (c.remainingSeats !== null && Number(c.remainingSeats) <= 0));
      card.innerHTML = `
        <a href="course-detail.html?id=${c.id}" class="course-thumbnail ${isFull ? 'is-full' : ''}" aria-label="ดูรายละเอียด ${escapeHtml(c.title)}">
          <img src="${c.cover || c.poster}" alt="${escapeHtml(c.title)}" loading="lazy">
          <span class="course-badge-level">${escapeHtml(c.categoryLabel || (c.category === 'primary' ? 'ประถมศึกษา' : 'มัธยมศึกษาตอนต้น'))}</span>
          ${window.getCourseSeatBadgeHtml ? window.getCourseSeatBadgeHtml(c) : `<span class="badge ${c.statusClass} course-badge-status">${escapeHtml(c.statusBadge)}</span>`}
        </a>
        <div class="course-body">
          <h3 class="course-title">
            <a href="course-detail.html?id=${c.id}">${escapeHtml(c.title)}</a>
          </h3>
          <div class="course-subjects"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(c.subjects)}</div>
          <div class="course-meta-list">
            ${c.totalHours ? `
            <div class="course-meta-item">
              <i class="fa-regular fa-clock"></i>
              <span>เวลาเรียน: ${escapeHtml(c.totalHours)}</span>
            </div>` : ''}
            <div class="course-meta-item">
              <i class="fa-solid fa-chalkboard-user"></i>
              <span>${escapeHtml(c.location || 'เรียนสด Onsite กลุ่มเล็กดูแลทั่วถึง')}</span>
            </div>
          </div>
          <div class="course-footer">
            ${(window.formatCoursePriceHtml ? window.formatCoursePriceHtml(c) : `
              <div class="course-price-wrap">
                ${c.priceOriginal ? `<span class="course-price-old">จาก ${escapeHtml(c.priceOriginal)}</span>` : ''}
                <div class="course-price-now">
                  <span class="course-price-amount-group">
                    <span class="course-price-amount">${escapeHtml(c.pricePromo)}</span><span class="course-price-dash">.-</span>
                  </span>
                  <span class="course-price-unit-tag">${escapeHtml(c.priceUnit || 'บาท / เทอม')}</span>
                </div>
              </div>
            `)}
            <div class="course-actions-wrap">
              ${c.isFull ? `
                <button type="button" class="btn-course-register disabled" disabled title="ที่นั่งคอร์สนี้เต็มแล้ว">
                  <i class="fa-solid fa-ban"></i> ที่นั่งเต็มแล้ว
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
      `;
      track.appendChild(card);
    });

    updatePagination();
  }

  function updatePagination() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const visibleCount = getCardsPerView();
    const cards = track.querySelectorAll('.course-card, .bundle-card');
    const totalCount = cards.length;
    const maxIndex = Math.max(0, totalCount - visibleCount);

    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement('div');
      dot.className = `slider-dot ${i === currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateSliderPosition();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function getCardsPerView() {
    if (window.innerWidth <= 868) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function updateSliderPosition() {
    const cards = track.querySelectorAll('.course-card, .bundle-card');
    if (cards.length === 0) return;
    const cardWidth = cards[0].offsetWidth + 24; // including gap
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

    const dots = dotsContainer?.querySelectorAll('.slider-dot');
    dots?.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  prevBtn?.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSliderPosition();
    }
  });

  nextBtn?.addEventListener('click', () => {
    const visibleCount = getCardsPerView();
    const cards = track.querySelectorAll('.course-card, .bundle-card');
    const totalCount = cards.length;
    const maxIndex = Math.max(0, totalCount - visibleCount);
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateSliderPosition();
    }
  });

  window.addEventListener('resize', () => {
    currentIndex = 0;
    updatePagination();
    updateSliderPosition();
  });
}

/* ----------------------------------------------------
   4. Dynamic Homepage Reviews Section (รีวิวจริงจากนักเรียน The NEW GEN)
   ---------------------------------------------------- */
function initHomeReviews() {
  const grid = document.getElementById('homeReviewsGrid');
  if (!grid) return;

  const allReviews = window.NewGenDB ? window.NewGenDB.getReviews() : (window.reviewsData || []);
  let featuredReviews = allReviews.filter(r => r.isFeatured !== false);
  if (featuredReviews.length === 0) featuredReviews = allReviews.slice(0, 4);

  grid.innerHTML = featuredReviews.map((r, idx) => {
    const hasName = r.studentName && r.studentName.trim();
    const hasSchool = r.school && r.school.trim();
    const hasQuote = r.quote && r.quote.trim();
    const hasScore = r.examScore && r.examScore.trim();
    const imgUrl = r.image || 'assets/images/course-poster-primary.jpg';

    return `
      <div class="review-real-card" data-idx="${idx}">
        <div class="review-real-img-box" onclick="openReviewLightbox('${escapeHtml(imgUrl)}', '${escapeHtml(hasName ? r.studentName : '')}', '${escapeHtml(hasSchool ? r.school : '')}')">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(hasName ? r.studentName : 'รีวิวนักเรียน')}" loading="lazy">
          <div class="review-real-zoom-overlay">
            <span class="review-real-zoom-pill">
              <i class="fa-solid fa-magnifying-glass-plus"></i> ซูมดูรูปจริง
            </span>
          </div>
          ${hasScore ? `<span class="review-real-badge"><i class="fa-solid fa-trophy"></i> ${escapeHtml(r.examScore)}</span>` : ''}
        </div>
        ${(hasName || hasSchool || hasQuote) ? `
          <div class="review-real-info">
            ${hasName ? `<h3 class="review-real-name"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(r.studentName)}</h3>` : ''}
            ${hasSchool ? `<p class="review-real-school"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(r.school)}</p>` : ''}
            ${hasQuote ? `<p class="review-real-quote">"${escapeHtml(r.quote)}"</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function openReviewLightbox(imgUrl, studentName = '', school = '') {
  let modal = document.getElementById('reviewLightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reviewLightboxModal';
    modal.className = 'review-lightbox-modal';
    modal.onclick = (e) => { if (e.target === modal) closeReviewLightbox(); };
    modal.innerHTML = `
      <div class="review-lightbox-content">
        <button type="button" class="review-lightbox-close" onclick="closeReviewLightbox()">&times;</button>
        <img id="reviewLightboxImg" src="" alt="ภาพรีวิวจริง">
        <div class="review-lightbox-caption" id="reviewLightboxCaption"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  const imgEl = document.getElementById('reviewLightboxImg');
  const capEl = document.getElementById('reviewLightboxCaption');
  if (imgEl) imgEl.src = imgUrl;
  if (capEl) {
    let captionHtml = '';
    if (studentName) captionHtml += `<strong>${studentName}</strong>`;
    if (school) captionHtml += ` <span style="opacity:0.85;">(${school})</span>`;
    capEl.innerHTML = captionHtml;
    capEl.style.display = captionHtml ? 'block' : 'none';
  }
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReviewLightbox() {
  const modal = document.getElementById('reviewLightboxModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* ----------------------------------------------------
   5. Dynamic "Why Choose Us" Section
   ---------------------------------------------------- */
function initWhyUs() {
  const grid = document.getElementById('whyFeaturesGrid');
  if (!grid) return;

  const whyData = window.NewGenDB ? window.NewGenDB.getWhyUs() : (window.whyUsData || null);
  if (!whyData) return;

  const subtitleEl = document.getElementById('whySectionSubtitle');
  const titleEl = document.getElementById('whySectionTitle');
  const descEl = document.getElementById('whySectionDesc');

  if (subtitleEl && whyData.subtitle) subtitleEl.textContent = whyData.subtitle;
  if (titleEl && whyData.title) {
    titleEl.innerHTML = whyData.title.includes('The NEW GEN')
      ? whyData.title.replace('The NEW GEN', '<span class="text-gradient-cyan">The NEW GEN</span>')
      : whyData.title;
  }
  if (descEl && whyData.desc) descEl.textContent = whyData.desc;

  if (whyData.features && whyData.features.length > 0) {
    grid.innerHTML = whyData.features.map(f => `
      <div class="feature-box" data-id="${f.id || ''}">
        <div class="feature-icon-wrap">
          <i class="${f.icon || 'fa-solid fa-award'}"></i>
        </div>
        <h3 class="feature-box-title">${f.title}</h3>
        <p class="feature-box-desc">${f.desc}</p>
      </div>
    `).join('');
  }
}

/* ----------------------------------------------------
   6. Back to Top Button
   ---------------------------------------------------- */
function initBackToTop() {
  const topBtn = document.getElementById('backToTopBtn');
  if (!topBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  });

  topBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ----------------------------------------------------
   7. Smooth Scroll for Navigation Anchors
   ---------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

/* ----------------------------------------------------
   8. Home Page Campaign Popup (โครงการติวฟรี)
   ---------------------------------------------------- */
let campaignPopupTimer = null;

function initHomePopupCampaign() {
  const modal = document.getElementById('campaignPopupModal');
  const campaign = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;

  if (!modal) {
    if (campaign && campaign.enabled !== false && !document.body.classList.contains('page-admin-body')) {
      ensureCuteFloatingGiftPill(campaign);
    }
    return; // Not on index.html
  }

  // Bind close on backdrop click (click outside card)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCampaignPopup(false);
    }
  });

  // Render content from DB
  renderHomePopupCampaign();

  if (!campaign || campaign.enabled === false) {
    return;
  }

  // Check if user already dismissed in this session
  const isDismissed = sessionStorage.getItem('newgen_campaign_dismissed') === 'true';
  const pill = document.getElementById('campaignFloatingPill');

  if (isDismissed) {
    // Show minimized pill
    if (pill) pill.style.display = 'flex';
  } else {
    // Auto popup after 800ms
    if (campaignPopupTimer) clearTimeout(campaignPopupTimer);
    campaignPopupTimer = setTimeout(() => {
      openCampaignPopup(false);
    }, 800);
  }
}

function ensureCuteFloatingGiftPill(campaign) {
  if (document.getElementById('campaignFloatingPill')) return;
  const pill = document.createElement('div');
  pill.id = 'campaignFloatingPill';
  pill.className = 'cute-floating-gift-pill';
  pill.title = 'คลิกเพื่อดูสิทธิ์โครงการติวฟรี';
  pill.innerHTML = `
    <div class="gift-icon-bubble">
      <i class="fa-solid fa-gift" style="color: #ffffff;"></i>
      <span class="gift-sparkle-dot"></span>
    </div>
    <div class="gift-content">
      <span class="gift-title">${escapeHtml(campaign.title || '🎁 โครงการติวฟรี!')}</span>
      <span class="gift-subtitle">${escapeHtml(campaign.miniBadgeText || campaign.miniBadge || 'คลิกรับสิทธิ์ด่วน ✨')}</span>
    </div>
  `;
  pill.onclick = () => {
    if (typeof window.openEnrollmentModal === 'function') {
      window.handleCampaignRegisterClick();
    } else {
      window.location.href = 'index.html#campaign';
    }
  };
  document.body.appendChild(pill);
}

function renderHomePopupCampaign() {
  const modal = document.getElementById('campaignPopupModal');
  const pill = document.getElementById('campaignFloatingPill');
  if (!modal) return;

  const campaign = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
  if (!campaign || campaign.enabled === false) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    if (pill) pill.style.display = 'none';
    return;
  }

  // Populate Elements
  const layout = document.getElementById('campaignPopupLayout');
  const imgEl = document.getElementById('campaignPopupImg');
  const mediaCol = document.getElementById('campaignMediaCol');
  const badgeEl = document.getElementById('campaignPopupBadge');
  const titleEl = document.getElementById('campaignPopupTitle');
  const subEl = document.getElementById('campaignPopupSubtitle');
  const descEl = document.getElementById('campaignPopupDesc');
  const hlEl = document.getElementById('campaignPopupHighlights');
  const regBtnText = document.getElementById('campaignRegisterBtnText');
  const lineBtn = document.getElementById('btnCampaignLine');
  const lineBtnText = document.getElementById('campaignLineBtnText');
  const pillLabel = document.getElementById('pillBadgeLabel');
  const pillSub = document.getElementById('pillSubtitleLabel');

  // Media
  const hasImg = Boolean(campaign.image && campaign.image.trim() !== '');
  if (hasImg) {
    if (layout) layout.classList.remove('no-image');
    if (mediaCol) mediaCol.style.display = 'flex';
    if (imgEl) {
      imgEl.src = window.resolveMediaUrl ? window.resolveMediaUrl(campaign.image) : campaign.image;
      imgEl.alt = campaign.title || 'โปสเตอร์โครงการติวฟรี';
    }
  } else {
    if (layout) layout.classList.add('no-image');
    if (mediaCol) mediaCol.style.display = 'none';
  }

  // Badge & Titles
  if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-sparkles"></i> <span>${escapeHtml(campaign.badge || 'โครงการพิเศษ • ติวฟรี 100%')}</span>`;
  if (titleEl) titleEl.textContent = campaign.title || 'โครงการติวฟรี The NEW GEN';
  if (subEl) subEl.textContent = campaign.subtitle || 'ยกระดับผลการเรียน เสริมทักษะความรู้อย่างมั่นใจ';

  // Description (multiline support)
  if (descEl) {
    if (campaign.description) {
      descEl.innerHTML = escapeHtml(campaign.description).replace(/\n/g, '<br>');
      descEl.style.display = 'block';
    } else {
      descEl.innerHTML = '';
      descEl.style.display = 'none';
    }
  }

  // Highlights
  if (hlEl) {
    const list = Array.isArray(campaign.highlights) && campaign.highlights.length > 0
      ? campaign.highlights
      : [
          'ติวสดกับทีมติวเตอร์ The NEW GEN แบบกลุ่มเล็ก',
          'แจกฟรี! เอกสารประกอบการเรียนและแบบฝึกหัดเก็งข้อสอบ',
          'ไม่มีค่าใช้จ่าย สิทธิ์มีจำนวนจำกัดตามลำดับลงทะเบียน'
        ];
    hlEl.innerHTML = list.map(item => `
      <li>
        <i class="fa-solid fa-circle-check"></i>
        <span>${escapeHtml(item)}</span>
      </li>
    `).join('');
  }

  // Buttons
  if (regBtnText) regBtnText.textContent = campaign.buttonText || 'สมัครเข้าเรียนฟรี';
  if (lineBtn) {
    lineBtn.href = campaign.lineUrl || 'https://lin.ee/RXrzi1G';
    if (lineBtnText) lineBtnText.textContent = campaign.lineButtonText || 'สอบถามเพิ่มเติมทาง LINE';
  }

  // Pill
  if (pillLabel) pillLabel.textContent = campaign.title || 'โครงการติวฟรี!';
  if (pillSub) pillSub.textContent = campaign.miniBadgeText || campaign.miniBadge || 'คลิกเพื่อรับสิทธิ์ด่วน 🎁';
}

function openCampaignPopup(fromPill = false) {
  const modal = document.getElementById('campaignPopupModal');
  const pill = document.getElementById('campaignFloatingPill');
  if (!modal) return;

  renderHomePopupCampaign();

  const campaign = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
  if (!campaign || campaign.enabled === false) return;

  modal.style.display = 'flex';
  // Trigger animation frame
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });

  if (pill) {
    pill.style.display = 'none';
  }
}

function closeCampaignPopup(manual = false) {
  const modal = document.getElementById('campaignPopupModal');
  const pill = document.getElementById('campaignFloatingPill');
  if (!modal) return;

  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);

  // Set session storage so it doesn't pop up again automatically
  sessionStorage.setItem('newgen_campaign_dismissed', 'true');

  // Show floating pill if campaign is still enabled
  const campaign = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
  if (pill && campaign && campaign.enabled !== false) {
    pill.style.display = 'flex';
  }
}

function dismissCampaignFloatingPill(e) {
  if (e) e.stopPropagation();
  const pill = document.getElementById('campaignFloatingPill');
  if (pill) {
    pill.style.opacity = '0';
    pill.style.transform = 'translateY(10px) scale(0.9)';
    setTimeout(() => {
      pill.style.display = 'none';
      pill.style.opacity = '';
      pill.style.transform = '';
    }, 250);
  }
}

function handleCampaignRegisterClick() {
  const campaign = window.NewGenDB ? window.NewGenDB.getPopupCampaign() : null;
  closeCampaignPopup(false);

  // Open enrollment modal for free tutoring or target course
  if (typeof window.openEnrollmentModal === 'function') {
    const courseId = campaign && campaign.courseId ? campaign.courseId : null;
    window.openEnrollmentModal(courseId);

    // Pre-populate note if empty
    setTimeout(() => {
      const notesEl = document.getElementById('enrInputNotes');
      if (notesEl && !notesEl.value) {
        notesEl.value = `[สมัครสิทธิ์โครงการ: ${campaign && campaign.title ? campaign.title : 'โครงการติวฟรี'}]`;
      }
    }, 350);
  } else {
    // If enrollment modal script not present, fallback to contact
    window.location.href = '#courses';
  }
}

function initHomeFeaturedVideo() {
  const iframe = document.getElementById('homeFeaturedVideoIframe');
  if (!iframe) return;
  const videos = window.NewGenDB ? window.NewGenDB.getVideos() : (window.videosData || []);
  if (!Array.isArray(videos) || videos.length === 0) return;

  const v = videos[0];
  let cleanId = v.youtubeId;
  if (!cleanId && v.youtubeUrl) {
    const match = v.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
    if (match) cleanId = match[1];
  }
  if (!cleanId) cleanId = 'OEBgi1xzb_c';

  const embedUrl = `https://www.youtube.com/embed/${cleanId}?rel=0&modestbranding=1`;
  if (!iframe.src || !iframe.src.includes(cleanId)) {
    iframe.src = embedUrl;
  }

  const titleEl = document.getElementById('homeFeaturedVideoTitle');
  const descEl = document.getElementById('homeFeaturedVideoDesc');
  if (titleEl && v.title) {
    titleEl.innerHTML = `${escapeHtml(v.title)} กับ <span class="text-gradient-cyan">The NEW GEN</span>`;
  }
  if (descEl && v.description) {
    descEl.textContent = v.description;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

