/**
 * The NEW GEN Tutoring Institute - Local development server
 * Run command: node server.js
 *
 * ใช้ทดสอบบนเครื่องตัวเองเท่านั้น (เว็บจริงอยู่บน GitHub Pages + Supabase)
 * API ในไฟล์นี้ไม่มีระบบล็อกอิน จึงเปิดให้เข้าได้เฉพาะจากเครื่องนี้ (127.0.0.1)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// สร้างโฟลเดอร์ data และ uploads ถ้ายังไม่มี
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading database:', err);
  }
  return { courses: [], tutors: [], reviews: [], videos: [], contact: {}, whyus: {}, popupCampaign: {}, bundles: [], enrollments: [] };
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

/**
 * Robustly converts a base64 image data string into a saved file in uploads/
 * If the string is already a path/URL, returns it untouched.
 */
function saveBase64ToFile(base64Str) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z0-9\-+\/]+);base64,([\s\S]+)$/);
    if (!matches) return base64Str;

    const mime = matches[1].toLowerCase();
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('svg')) ext = 'svg';

    const base64Pure = matches[2].replace(/[\r\n\s]+/g, '');
    const buffer = Buffer.from(base64Pure, 'base64');
    const safeName = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[Upload] Image saved: uploads/${safeName} (${buffer.length} bytes)`);
    return `uploads/${safeName}`;
  } catch (err) {
    console.error('Error saving base64 to file:', err);
    return base64Str;
  }
}

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // จำกัดขนาดไม่เกิน 25MB สำหรับ base64 image
      if (body.length > 25 * 1024 * 1024) {
        req.connection.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ================= API ENDPOINTS =================
  if (pathname.startsWith('/api/')) {
    const db = readDatabase();

    // 1. Admin login moved to Supabase Auth (no passwords handled here)

    // 2. Upload Base64 Image
    if (pathname === '/api/upload' && method === 'POST') {
      const { base64Data, filename } = await parseRequestBody(req);
      if (!base64Data) return sendJson(res, 400, { error: 'No image data provided' });

      try {
        const savedUrl = saveBase64ToFile(base64Data);
        if (savedUrl && (savedUrl.startsWith('uploads/') || savedUrl.startsWith('/uploads/'))) {
          return sendJson(res, 200, { success: true, url: savedUrl });
        }
        return sendJson(res, 500, { error: 'Failed to process image data' });
      } catch (err) {
        return sendJson(res, 500, { error: 'Failed to save image' });
      }
    }

    // 3. Courses API
    if (pathname === '/api/courses' || pathname === '/api/courses/reorder') {
      if (method === 'GET') {
        return sendJson(res, 200, db.courses || []);
      }
      if (method === 'POST') {
        const body = await parseRequestBody(req);
        if (Array.isArray(body)) {
          db.courses = body;
          writeDatabase(db);
          return sendJson(res, 200, { success: true, courses: db.courses });
        }
        const course = body;
        if (!course.id) course.id = `course-${Date.now()}`;
        const idx = db.courses.findIndex(c => c.id === course.id);
        if (idx !== -1) {
          db.courses[idx] = { ...db.courses[idx], ...course };
        } else {
          db.courses.push(course);
        }
        writeDatabase(db);
        return sendJson(res, 200, { success: true, course });
      }
    }

    if (pathname.startsWith('/api/courses/') && method === 'DELETE') {
      const courseId = pathname.replace('/api/courses/', '');
      db.courses = db.courses.filter(c => c.id !== courseId);
      writeDatabase(db);
      return sendJson(res, 200, { success: true });
    }

    // 4. Tutors API
    if (pathname === '/api/tutors' || pathname === '/api/tutors/reorder') {
      if (method === 'GET') return sendJson(res, 200, db.tutors || []);
      if (method === 'POST') {
        const body = await parseRequestBody(req);
        if (Array.isArray(body)) {
          db.tutors = body;
          writeDatabase(db);
          return sendJson(res, 200, { success: true, tutors: db.tutors });
        }
        const tutor = body;
        if (!tutor.id) tutor.id = `tutor-${Date.now()}`;
        if (tutor.image && tutor.image.startsWith('data:image/')) {
          tutor.image = saveBase64ToFile(tutor.image);
        }
        const idx = db.tutors.findIndex(t => t.id === tutor.id);
        if (idx !== -1) db.tutors[idx] = { ...db.tutors[idx], ...tutor };
        else db.tutors.push(tutor);
        writeDatabase(db);
        return sendJson(res, 200, { success: true, tutor });
      }
    }

    if (pathname.startsWith('/api/tutors/') && method === 'DELETE') {
      const tutorId = pathname.replace('/api/tutors/', '');
      db.tutors = db.tutors.filter(t => t.id !== tutorId);
      writeDatabase(db);
      return sendJson(res, 200, { success: true });
    }

    // 5. Reviews API
    if (pathname === '/api/reviews') {
      if (method === 'GET') return sendJson(res, 200, db.reviews || []);
      if (method === 'POST') {
        const review = await parseRequestBody(req);
        if (!review.id) review.id = `rev-${Date.now()}`;
        const idx = db.reviews.findIndex(r => r.id === review.id);
        if (idx !== -1) db.reviews[idx] = { ...db.reviews[idx], ...review };
        else db.reviews.push(review);
        writeDatabase(db);
        return sendJson(res, 200, { success: true, review });
      }
    }

    if (pathname.startsWith('/api/reviews/') && method === 'DELETE') {
      const revId = pathname.replace('/api/reviews/', '');
      db.reviews = db.reviews.filter(r => r.id !== revId);
      writeDatabase(db);
      return sendJson(res, 200, { success: true });
    }

    // 6. Videos API
    if (pathname === '/api/videos') {
      if (method === 'GET') return sendJson(res, 200, db.videos || []);
      if (method === 'POST') {
        const video = await parseRequestBody(req);
        if (!video.id) video.id = `vid-${Date.now()}`;
        const idx = db.videos.findIndex(v => v.id === video.id);
        if (idx !== -1) db.videos[idx] = { ...db.videos[idx], ...video };
        else db.videos.push(video);
        writeDatabase(db);
        return sendJson(res, 200, { success: true, video });
      }
    }

    if (pathname.startsWith('/api/videos/') && method === 'DELETE') {
      const vidId = pathname.replace('/api/videos/', '');
      db.videos = db.videos.filter(v => v.id !== vidId);
      writeDatabase(db);
      return sendJson(res, 200, { success: true });
    }

    // 7. Tutors Quote API
    if (pathname === '/api/tutors-quote') {
      if (method === 'GET') return sendJson(res, 200, db.tutorsQuote || {});
      if (method === 'POST') {
        const quoteObj = await parseRequestBody(req);
        db.tutorsQuote = { ...db.tutorsQuote, ...quoteObj };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, tutorsQuote: db.tutorsQuote });
      }
    }

    // 8. Achievements (Hall of Fame) API
    if (pathname === '/api/achievements') {
      if (method === 'GET') return sendJson(res, 200, db.achievements || []);
      if (method === 'POST') {
        const ach = await parseRequestBody(req);
        if (!ach.id) ach.id = `ach-${Date.now()}`;
        if (!db.achievements) db.achievements = [];
        const idx = db.achievements.findIndex(a => a.id === ach.id);
        if (idx !== -1) db.achievements[idx] = { ...db.achievements[idx], ...ach };
        else db.achievements.push(ach);
        writeDatabase(db);
        return sendJson(res, 200, { success: true, achievement: ach });
      }
    }

    if (pathname.startsWith('/api/achievements/') && method === 'DELETE') {
      const achId = pathname.replace('/api/achievements/', '');
      if (db.achievements) db.achievements = db.achievements.filter(a => a.id !== achId);
      writeDatabase(db);
      return sendJson(res, 200, { success: true });
    }

    // 8.5 Enrollments API (ระบบสมัครเรียน)
    if (pathname === '/api/enrollments') {
      if (method === 'GET') {
        const query = parsedUrl.query || {};
        let list = db.enrollments || [];
        if (query.courseId) {
          list = list.filter(e => e.courseId === query.courseId);
        }
        return sendJson(res, 200, list);
      }
      if (method === 'POST') {
        const enroll = await parseRequestBody(req);
        if (Array.isArray(enroll)) {
          db.enrollments = enroll;
          // Recalculate seats for all courses
          if (Array.isArray(db.courses)) {
            db.courses.forEach(c => {
              const count = db.enrollments.filter(e => e.courseId === c.id).length;
              const cap = Number(c.maxSeats || 12);
              c.remainingSeats = Math.max(0, cap - count);
              if (c.remainingSeats <= 0) c.isFull = true;
            });
          }
          writeDatabase(db);
          return sendJson(res, 200, { success: true, enrollments: db.enrollments, courses: db.courses });
        }
        if (!enroll.id) enroll.id = `enr-${Date.now()}`;
        if (!enroll.createdAt) enroll.createdAt = new Date().toISOString();
        if (!db.enrollments) db.enrollments = [];
        const idx = db.enrollments.findIndex(e => e.id === enroll.id);
        if (idx !== -1) db.enrollments[idx] = { ...db.enrollments[idx], ...enroll };
        else db.enrollments.unshift(enroll);

        // Auto-recalculate capacity for this course
        if (enroll.courseId && Array.isArray(db.courses)) {
          const targetCourse = db.courses.find(c => c.id === enroll.courseId);
          if (targetCourse) {
            const count = db.enrollments.filter(e => e.courseId === enroll.courseId).length;
            const cap = Number(targetCourse.maxSeats || 12);
            targetCourse.remainingSeats = Math.max(0, cap - count);
            if (targetCourse.remainingSeats <= 0) targetCourse.isFull = true;
          }
        }

        writeDatabase(db);
        return sendJson(res, 200, { success: true, enrollment: enroll, courses: db.courses });
      }
      if (method === 'DELETE') {
        const query = parsedUrl.query || {};
        const idToDelete = query.id;
        if (idToDelete && db.enrollments) {
          const itemToDelete = db.enrollments.find(e => e.id === idToDelete);
          db.enrollments = db.enrollments.filter(e => e.id !== idToDelete);
          if (itemToDelete && itemToDelete.courseId && Array.isArray(db.courses)) {
            const targetCourse = db.courses.find(c => c.id === itemToDelete.courseId);
            if (targetCourse) {
              const count = db.enrollments.filter(e => e.courseId === itemToDelete.courseId).length;
              const cap = Number(targetCourse.maxSeats || 12);
              targetCourse.remainingSeats = Math.max(0, cap - count);
              if (targetCourse.remainingSeats > 0 && targetCourse.isFull) {
                targetCourse.isFull = false;
              }
            }
          }
          writeDatabase(db);
          return sendJson(res, 200, { success: true });
        }
      }
    }

    if (pathname.startsWith('/api/enrollments/') && method === 'DELETE') {
      const enrId = pathname.replace('/api/enrollments/', '');
      if (db.enrollments) {
        const itemToDelete = db.enrollments.find(e => e.id === enrId);
        db.enrollments = db.enrollments.filter(e => e.id !== enrId);
        if (itemToDelete && itemToDelete.courseId && Array.isArray(db.courses)) {
          const targetCourse = db.courses.find(c => c.id === itemToDelete.courseId);
          if (targetCourse) {
            const count = db.enrollments.filter(e => e.courseId === itemToDelete.courseId).length;
            const cap = Number(targetCourse.maxSeats || 12);
            targetCourse.remainingSeats = Math.max(0, cap - count);
            if (targetCourse.remainingSeats > 0 && targetCourse.isFull) {
              targetCourse.isFull = false;
            }
          }
        }
        writeDatabase(db);
      }
      return sendJson(res, 200, { success: true });
    }

    // 8.6 Enrollment Config API (ตั้งค่าข้อความหน้าสมัครเรียน)
    if (pathname === '/api/enrollment-config') {
      if (method === 'GET') return sendJson(res, 200, db.enrollmentConfig || {});
      if (method === 'POST') {
        const config = await parseRequestBody(req);
        db.enrollmentConfig = { ...db.enrollmentConfig, ...config };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, enrollmentConfig: db.enrollmentConfig });
      }
    }

    // 9. Contact API
    if (pathname === '/api/contact') {
      if (method === 'GET') return sendJson(res, 200, db.contact || {});
      if (method === 'POST') {
        const contact = await parseRequestBody(req);
        db.contact = { ...db.contact, ...contact };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, contact: db.contact });
      }
    }

    // 10. Why Us API
    if (pathname === '/api/whyus') {
      if (method === 'GET') return sendJson(res, 200, db.whyus || {});
      if (method === 'POST') {
        const whyus = await parseRequestBody(req);
        db.whyus = { ...db.whyus, ...whyus };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, whyus: db.whyus });
      }
    }

    // 11. Categories API
    if (pathname === '/api/categories') {
      if (method === 'GET') return sendJson(res, 200, db.categories || [
        { id: 'primary', name: 'ประถม ป.4 - ป.6', badgeClass: 'badge-primary-level' },
        { id: 'secondary', name: 'มัธยม ม.1 - ม.3', badgeClass: 'badge-secondary-level' }
      ]);
      if (method === 'POST') {
        const cats = await parseRequestBody(req);
        db.categories = Array.isArray(cats) ? cats : [cats];
        writeDatabase(db);
        return sendJson(res, 200, { success: true, categories: db.categories });
      }
    }

    // 12. Privilege Banner Note API (Item 3)
    if (pathname === '/api/privilege') {
      if (method === 'GET') return sendJson(res, 200, db.privilege || {
        badge: 'สิทธิพิเศษ:',
        text: 'ทุกคอร์สสามารถแบ่งชำระได้ พร้อมรับฟรี! เอกสารชุดติวและแนวข้อสอบจริงตลอดคอร์ส'
      });
      if (method === 'POST') {
        const priv = await parseRequestBody(req);
        db.privilege = priv;
        writeDatabase(db);
        return sendJson(res, 200, { success: true, privilege: db.privilege });
      }
    }

    // 13. Home Settings & Tutor Placement API
    if (pathname === '/api/home') {
      if (method === 'GET') return sendJson(res, 200, db.home || {});
      if (method === 'POST') {
        const homeObj = await parseRequestBody(req);
        db.home = { ...db.home, ...homeObj };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, home: db.home });
      }
    }

    // 14. About Us & Inspiration API
    if (pathname === '/api/about') {
      if (method === 'GET') return sendJson(res, 200, db.about || {});
      if (method === 'POST') {
        const aboutObj = await parseRequestBody(req);
        
        // Auto convert base64 main and secondary images to real files
        if (aboutObj.mainImage) {
          aboutObj.mainImage = saveBase64ToFile(aboutObj.mainImage);
        }
        if (aboutObj.secondaryImage) {
          aboutObj.secondaryImage = saveBase64ToFile(aboutObj.secondaryImage);
        }

        // Auto convert base64 gallery images to real files
        if (Array.isArray(aboutObj.galleryImages)) {
          aboutObj.galleryImages = aboutObj.galleryImages.map(img => {
            if (typeof img === 'string') return saveBase64ToFile(img);
            if (img && typeof img === 'object') {
              return {
                ...img,
                url: saveBase64ToFile(img.url)
              };
            }
            return img;
          });
        }

        db.about = { ...db.about, ...aboutObj };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, about: db.about });
      }
    }

    // 15. Popup Campaign API (โครงการติวฟรี & ประกาศหน้าแรก)
    if (pathname === '/api/popup-campaign') {
      if (method === 'GET') return sendJson(res, 200, db.popupCampaign || {});
      if (method === 'POST') {
        const popupObj = await parseRequestBody(req);
        if (popupObj && popupObj.image && popupObj.image.startsWith('data:image/')) {
          popupObj.image = saveBase64ToFile(popupObj.image);
        }
        db.popupCampaign = { ...db.popupCampaign, ...popupObj };
        writeDatabase(db);
        return sendJson(res, 200, { success: true, popupCampaign: db.popupCampaign });
      }
    }

    // 16. Bundles API (แพ็คเกจคอร์สเรียนโปรโมชั่น)
    if (pathname === '/api/bundles') {
      if (method === 'GET') {
        return sendJson(res, 200, db.bundles || []);
      }
      if (method === 'POST') {
        const body = await parseRequestBody(req);
        if (Array.isArray(body)) {
          db.bundles = body;
        } else if (body && typeof body === 'object') {
          if (!db.bundles) db.bundles = [];
          if (body.customImage && body.customImage.startsWith('data:image/')) {
            body.customImage = saveBase64ToFile(body.customImage);
          }
          const idx = db.bundles.findIndex(b => b.id === body.id);
          if (idx !== -1) {
            db.bundles[idx] = { ...db.bundles[idx], ...body, updatedAt: new Date().toISOString() };
          } else {
            db.bundles.push({ ...body, createdAt: new Date().toISOString() });
          }
        }
        writeDatabase(db);
        return sendJson(res, 200, { success: true, bundles: db.bundles });
      }
    }

    if (pathname.startsWith('/api/bundles/') && method === 'DELETE') {
      const bundleId = pathname.replace('/api/bundles/', '');
      if (db.bundles) {
        db.bundles = db.bundles.filter(b => b.id !== bundleId);
        writeDatabase(db);
      }
      return sendJson(res, 200, { success: true, bundles: db.bundles || [] });
    }

    return sendJson(res, 404, { error: 'API endpoint not found' });
  }

  // ================= STATIC FILE SERVING =================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security: check path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback: check if .html extension is missing
      const htmlPath = `${filePath}.html`;
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`🚀 The NEW GEN Tutoring Server is running!`);
  console.log(`👉 Website: http://localhost:${PORT}`);
  console.log(`👉 Admin Panel: http://localhost:${PORT}/admin-login.html`);
  console.log(`=======================================================`);
});
