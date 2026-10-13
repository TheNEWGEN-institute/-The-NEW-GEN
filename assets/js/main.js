/**
 * The NEW GEN Tutoring Institute - Main Interactive Scripts
 */

function bootstrapApp() {
  initNavbar();
  initHeroTutors();
  initWhyUs();
  initCourseSlider();
  initHomeReviews();
  initBackToTop();
  initSmoothScroll();
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
});

if (typeof window !== 'undefined') {
  window.renderHeroContent = renderHeroContent;
  window.initCourseSlider = initCourseSlider;
  window.initHomeReviews = initHomeReviews;
  window.initWhyUs = initWhyUs;
  window.initNavbar = initNavbar;
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

  const courses = window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []);
  const filteredCourses = courses.filter(c => c.isFeatured !== false);
  let currentIndex = 0;

  renderCourses();

  function renderCourses() {
    track.innerHTML = '';
    const displayList = filteredCourses;

    if (displayList.length === 0) {
      track.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); width: 100%;"><p>ยังไม่มีคอร์สเรียนแนะนำในขณะนี้</p></div>';
      updatePagination();
      return;
    }

    displayList.forEach(c => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.setAttribute('data-course-id', c.id);
      card.innerHTML = `
        <a href="course-detail.html?id=${c.id}" class="course-thumbnail" aria-label="ดูรายละเอียด ${escapeHtml(c.title)}">
          <img src="${c.cover || c.poster}" alt="${escapeHtml(c.title)}" loading="lazy">
          <span class="course-badge-level">${escapeHtml(c.categoryLabel || (c.category === 'primary' ? 'ประถมศึกษา' : 'มัธยมศึกษาตอนต้น'))}</span>
          <span class="badge ${c.statusClass} course-badge-status">${escapeHtml(c.statusBadge)}</span>
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
                  <span class="course-price-amount">${escapeHtml(c.pricePromo)}</span><span class="course-price-dash">.-</span>
                  <span class="course-price-unit-tag">${escapeHtml(c.priceUnit || 'บาท / เทอม')}</span>
                </div>
              </div>
            `)}
            <a href="course-detail.html?id=${c.id}" class="btn-detail-link">
              รายละเอียด <i class="fa-solid fa-arrow-right"></i>
            </a>
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
    const displayList = filteredCourses;
    const maxIndex = Math.max(0, displayList.length - visibleCount);

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
    const cards = track.querySelectorAll('.course-card');
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
    const displayList = filteredCourses;
    const maxIndex = Math.max(0, displayList.length - visibleCount);
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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
