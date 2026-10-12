/**
 * The NEW GEN Tutoring Institute - Unified Data Management System
 * รองรับทั้งการเชื่อมต่อ Server API (/api/...) และ LocalStorage สำรอง
 */

const DEFAULT_COURSES = [
  {
    id: 'course-p4-p5',
    category: 'primary',
    categoryLabel: 'ระดับประถมศึกษา (ป.4 - ป.5)',
    title: 'คอร์สเปิดเทอม 2/69 (ป.4 - ป.5)',
    subjects: 'วิทยาศาสตร์ • คณิตศาสตร์ • ภาษาอังกฤษ',
    cover: 'assets/images/course-poster-primary.jpg',
    poster: 'assets/images/course-poster-primary.jpg',
    statusBadge: 'เปิดรับสมัคร',
    statusClass: 'badge-emerald',
    priceOriginal: '5,900 บ.',
    pricePromo: '4,500',
    priceUnit: 'บาท / เทอม (แบ่งชำระได้)',
    monthlyPrice: '1,500 บาท / เดือน (20 ชม.)',
    totalHours: '42 ชั่วโมง (รายเทอม) / 20 ชม. (รายเดือน)',
    shortDesc: 'ปูพื้นฐาน 3 วิชาหลักให้แน่น เข้าใจหลักการคิด ไม่เน้นท่องจำ พร้อมเทคนิคลัดที่นำไปใช้สอบได้จริง',
    scheduleList: [
      { type: 'แบบรายเดือน (จันทร์ - ศุกร์)', time: '16.30 - 17.30 น.', dates: 'รอบ 1 (2-27 พ.ย.), รอบ 2 (30 พ.ย.-5 ม.ค.), รอบ 3 (4-29 ม.ค.), รอบ 4 (1-26 ก.พ.)' },
      { type: 'แบบรายเทอม (วันเสาร์)', time: '09.00 - 12.15 น.', dates: '7 พ.ย. 2569 - 20 ก.พ. 2570' }
    ],
    highlights: [
      'ปูพื้นฐาน 3 วิชาหลัก วิทย์-คณิต-อังกฤษ ให้แน่นเพื่อต่อยอดสู่วัยมัธยมอย่างมั่นใจ',
      'เรียนสด Onsite กลุ่มเล็ก ทีมติวเตอร์ The NEW GEN ดูแลใกล้ชิด ซักถามได้ทันที',
      'มีทั้งแบบรายเดือนยืดหยุ่น และแบบเหมาเทอมสุดคุ้มแบ่งชำระได้',
      'รับฟรี! เอกสารประกอบการเรียนชุดพิเศษและแบบฝึกหัดเก็งแนวข้อสอบตลอดคอร์ส'
    ]
  },
  {
    id: 'course-p6-m1',
    category: 'primary',
    categoryLabel: 'ระดับประถมศึกษา (ป.6 ติวสอบเข้า ม.1)',
    title: 'คอร์สเปิดเทอม 2/69 (ป.6 ติวสอบเข้า ม.1)',
    subjects: 'วิทย์ • คณิต • อังกฤษ (ติวสอบเข้า ม.1)',
    cover: 'assets/images/course-poster-primary.jpg',
    poster: 'assets/images/course-poster-primary.jpg',
    statusBadge: '🔥 โควตาใกล้เต็ม',
    statusClass: 'badge-red',
    priceOriginal: '5,900 บ.',
    pricePromo: '4,500',
    priceUnit: 'บาท / เทอม (แบ่งชำระได้)',
    monthlyPrice: '1,500 บาท / เดือน (20 ชม.)',
    totalHours: '42 ชั่วโมง (รายเทอม) / 20 ชม. (รายเดือน)',
    shortDesc: 'ติวเข้มโค้งสุดท้ายสอบเข้า ม.1 รร. ชั้นนำ เจาะลึกแนวข้อสอบจริง ตะลุยโจทย์จับเวลาเสมือนจริง',
    scheduleList: [
      { type: 'แบบรายเดือน (จันทร์ - ศุกร์)', time: '16.30 - 17.30 น.', dates: 'เปิดรับ 4 รอบตลอดเทอม (เดือนละ 20 ชม.)' },
      { type: 'กลุ่ม 1: เสาร์', time: '09.00 - 12.15 น.', dates: '7 พ.ย. 2569 - 20 ก.พ. 2570' },
      { type: 'กลุ่ม 2: อาทิตย์', time: '09.00 - 12.15 น.', dates: '8 พ.ย. 2569 - 21 ก.พ. 2570' }
    ],
    highlights: [
      'เจาะลึกข้อสอบจริงเข้า ม.1 โรงเรียนสาธิตฯ และ รร. ประจำจังหวัดชื่อดัง',
      'ตะลุยโจทย์จับเวลาเสมือนจริง พร้อมเฉลยเทคนิคคิดลัดตัดช้อยส์แบบเข้าใจง่าย',
      'เสริมความมั่นใจโค้งสุดท้ายก่อนลงสนามสอบจริง ด้วยการวิเคราะห์จุดอ่อนรายบุคคล',
      'แนะแนวการเลือกสายและวางแผนกลยุทธ์สอบเข้าโดยทีมติวเตอร์ The NEW GEN'
    ]
  },
  {
    id: 'course-m1-m2',
    category: 'secondary',
    categoryLabel: 'ระดับมัธยมศึกษาตอนต้น (ม.1 - ม.2)',
    title: 'คอร์สเปิดเทอม 2/69 (ม.1 & ม.2)',
    subjects: 'วิทยาศาสตร์ • คณิตศาสตร์ • ภาษาอังกฤษ',
    cover: 'assets/images/course-poster-secondary.jpg',
    poster: 'assets/images/course-poster-secondary.jpg',
    statusBadge: 'เปิดรับสมัคร',
    statusClass: 'badge-emerald',
    priceOriginal: '9,000 บ.',
    pricePromo: '6,500',
    priceUnit: 'บาท / เทอม (แบ่งชำระได้)',
    monthlyPrice: 'โปรโมชั่นสุดคุ้มแบ่งชำระได้',
    totalHours: 'รวม 63 ชั่วโมง ตลอดเทอม',
    shortDesc: 'อัปเกรดผลการเรียนเกรด 4 ที่โรงเรียน ปูพื้นฐานเข้มข้นตรงหลักสูตร สสวท. และข้อสอบแข่งขัน',
    scheduleList: [
      { type: 'ม.1 กลุ่ม 1 (เสาร์)', time: '13.00 - 18.10 น.', dates: '7 พ.ย. 2569 - 20 ก.พ. 2570' },
      { type: 'ม.1 กลุ่ม 2 (จันทร์-พุธ-ศุกร์)', time: '17.30 - 19.00 น.', dates: '2 พ.ย. 2569 - 19 ก.พ. 2570' },
      { type: 'ม.1 กลุ่ม 3 (เสาร์)', time: '13.00 - 18.10 น.', dates: '7 พ.ย. 2569 - 20 ก.พ. 2570' },
      { type: 'ม.2 กลุ่ม 1 (เสาร์)', time: '13.00 - 18.10 น.', dates: '7 พ.ย. 2569 - 20 ก.พ. 2570' },
      { type: 'ม.2 กลุ่ม 2 (จันทร์-พุธ-ศุกร์)', time: '17.30 - 19.00 น.', dates: '2 พ.ย. 2569 - 19 ก.พ. 2570' }
    ],
    highlights: [
      'อัปเกรดผลการเรียนเกรด 4 ที่โรงเรียน พร้อมเตรียมความพร้อม ม.ต้น ล่วงหน้าอย่างมั่นใจ',
      'เนื้อหาเข้มข้นตรงหลักสูตร สสวท. และครอบคลุมข้อสอบแข่งขันระดับประเทศ',
      'เรียนสด Onsite ซักถามข้อสงสัยได้แบบทันที ไม่ต้องเก็บความงงกลับบ้าน',
      'ชั่วโมงเรียนสุดคุ้มค่ารวมถึง 63 ชั่วโมงเต็มตลอดภาคเรียน'
    ]
  },
  {
    id: 'course-m3-m4',
    category: 'secondary',
    categoryLabel: 'ระดับมัธยมศึกษาตอนต้น (ม.3 ติวสอบเข้า ม.4)',
    title: 'คอร์สเปิดเทอม 2/69 (ม.3 ติวสอบเข้า ม.4)',
    subjects: 'วิทย์ • คณิต • อังกฤษ (ติวเข้มสอบเข้า ม.4)',
    cover: 'assets/images/course-poster-secondary.jpg',
    poster: 'assets/images/course-poster-secondary.jpg',
    statusBadge: '🔥 ด่วน! กลุ่ม 1 & 2 เต็มแล้ว',
    statusClass: 'badge-red',
    priceOriginal: '9,000 บ.',
    pricePromo: '6,500',
    priceUnit: 'บาท / เทอม (แบ่งชำระได้)',
    monthlyPrice: 'เหลือที่นั่งกลุ่ม 3 (อาทิตย์)',
    totalHours: 'รวม 63 ชั่วโมง ตลอดเทอม',
    shortDesc: 'คอร์สยอดฮิต! ติวสอบเข้า ม.4 เตรียมอุดมฯ สาธิตฯ มหิดลฯ เก็งแนวข้อสอบย้อนหลัง 5 ปีล่าสุด',
    scheduleList: [
      { type: 'ม.3 กลุ่ม 1 (เสาร์ 13.00 - 18.10 น.)', time: 'เต็มแล้ว 🛑', dates: 'ปิดรับสมัคร' },
      { type: 'ม.3 กลุ่ม 2 (เสาร์ 09.00 - 14.30 น.)', time: 'เต็มแล้ว 🛑', dates: 'ปิดรับสมัคร' },
      { type: 'ม.3 กลุ่ม 3 (อาทิตย์)', time: '09.00 - 15.00 น.', dates: '8 พ.ย. 2569 - 21 ก.พ. 2570 (เปิดรับสมัคร)' }
    ],
    highlights: [
      'คอร์สยอดฮิต! ติวสอบเข้า ม.4 โรงเรียนชั้นนำ เตรียมอุดมฯ สาธิตฯ มหิดลฯ จุฬาภรณ์ฯ',
      'เก็งข้อสอบตรงจุด ตะลุยแนวข้อสอบย้อนหลัง 5 ปีล่าสุดพร้อมเฉลยละเอียด',
      'สอนเทคนิคลัดพิชิตคะแนนโดยทีมติวเตอร์ The NEW GEN โดยตรง ดูแลเทคนิคทำโจทย์เร็ว',
      'เหลือที่นั่งว่างเฉพาะกลุ่มวันอาทิตย์ รีบสำรองที่นั่งด่วนก่อนเต็ม!'
    ]
  }
];

const DEFAULT_TUTORS = [
  {
    id: 'tutor-non',
    name: 'พี่นนท์',
    honor: 'เกียรตินิยมอันดับ 1 เคมี มศว',
    degree: 'วท.บ. เคมี (เกียรตินิยมอันดับ 1) มหาวิทยาลัยศรีนครินทรวิโรฒ',
    subjects: 'เคมี&วิทยาศาสตร์',
    heroBadge: 'เคมี&วิทยาศาสตร์',
    image: 'assets/images/tutor-non.png',
    bio: 'ติวเตอร์เคมีและวิทยาศาสตร์ประจำสถาบัน The NEW GEN ประสบการณ์สอนกว่า 7 ปี เชี่ยวชาญการปูพื้นฐานวิทยาศาสตร์จากภาพจำและการทดลอง สอนสนุก ไม่น่าเบื่อ นำพานักเรียนสอบติด รร. ชั้นนำมากมาย',
    tagline: 'เข้าใจเคมีอย่างเป็นระบบ ไม่เน้นท่องจำ แต่นำไปใช้ทำโจทย์ได้จริง'
  },
  {
    id: 'tutor-au',
    name: 'พี่อู๋',
    honor: 'เกียรตินิยมอันดับ 2 วิศวกรรมนานาชาติ มธ.',
    degree: 'วศ.บ. วิศวกรรมศาสตร์นานาชาติ (เกียรตินิยมอันดับ 2) มหาวิทยาลัยธรรมศาสตร์',
    subjects: 'ฟิสิกส์&ภาษาอังกฤษ',
    heroBadge: 'ฟิสิกส์&ภาษาอังกฤษ',
    image: 'assets/images/tutor-ou.png',
    bio: 'ติวเตอร์ฟิสิกส์และคณิตศาสตร์สายลุย เทคนิคลัดขั้นเทพ คิดโจทย์เร็ว แม่นยำตรงจุด เจาะลึกข้อสอบแข่งขันและข้อสอบเข้า ม.1, ม.4 เตรียมอุดมฯ สาธิตฯ',
    tagline: 'ฟิสิกส์-คณิตศาสตร์ไม่ใช่เรื่องยาก แค่รู้มุมมองคิดลัดแบบวิศวกร'
  },
  {
    id: 'tutor-mac',
    name: 'พี่แม็ค',
    honor: 'เกียรตินิยมอันดับ 2 คณิตมธ &ป.โท คณิต มศว',
    degree: 'วท.บ. คณิตศาสตร์ (เกียรตินิยมอันดับ 2) มธ. & กศ.ม. คณิตศาสตร์ (ป.โท) มศว',
    subjects: 'คณิตศาสตร์',
    heroBadge: 'คณิตศาสตร์',
    image: 'assets/images/tutor-mac.png',
    bio: 'ติวเตอร์คณิตศาสตร์ระดับปรมาจารย์ ผู้เชี่ยวชาญการวิเคราะห์จุดอ่อนและข้อสอบคณิตศาสตร์เชิงลึก สอนตั้งแต่วิธีคิดพื้นฐานจนถึงโจทย์ยากระดับโอลิมปิก',
    tagline: 'ตีโจทย์คณิตแตกละเอียด อัปเกรดผลการเรียนเกรด 4 ได้ทุกคน'
  },
  {
    id: 'tutor-anont',
    name: 'พี่อานนท์',
    honor: 'ทีมติวเตอร์ The NEW GEN',
    degree: 'สถาบันกวดวิชา The NEW GEN',
    subjects: 'วิทยาศาสตร์ & คณิตศาสตร์',
    heroBadge: 'วิทยาศาสตร์ & คณิตศาสตร์',
    image: 'assets/images/tutor-anont.png',
    bio: 'ติวเตอร์ประจำสถาบัน The NEW GEN ดูแลใกล้ชิด อธิบายละเอียด เทคนิคคิดลัด เข้าใจง่าย',
    tagline: 'เรียนสนุก เข้าใจง่าย ทำโจทย์ได้จริง'
  }
];

const DEFAULT_CATEGORIES = [
  { id: 'primary', name: 'ประถม ป.4 - ป.6', badgeClass: 'badge-primary-level' },
  { id: 'secondary', name: 'มัธยม ม.1 - ม.3', badgeClass: 'badge-secondary-level' }
];

const DEFAULT_WHYUS = {
  subtitle: 'WHY CHOOSE US',
  title: 'ทำไมต้องเลือก The NEW GEN',
  desc: 'เราไม่ได้แค่สอนให้จำ แต่เราสอนให้เข้าใจและนำไปใช้ทำข้อสอบได้จริง',
  features: [
    {
      id: 'feat-1',
      icon: 'fa-solid fa-award',
      title: 'ทีมติวเตอร์ The NEW GEN',
      desc: 'ทีมผู้สอนประจำสถาบัน The NEW GEN ถ่ายทอดเทคนิคลัด ทำโจทย์เร็ว ตรงจุด และเข้าใจง่าย'
    },
    {
      id: 'feat-2',
      icon: 'fa-solid fa-users-viewfinder',
      title: 'เรียนสด Onsite กลุ่มเล็ก',
      desc: 'บรรยากาศเป็นกันเอง ถาม-ตอบได้ทันทีในห้องเรียน ดูแลเด็กๆ ได้อย่างทั่วถึงทุกคน'
    },
    {
      id: 'feat-3',
      icon: 'fa-solid fa-bullseye',
      title: 'เก็งข้อสอบตรงจุด',
      desc: 'วิเคราะห์แนวข้อสอบย้อนหลังของโรงเรียนชั้นนำ สอนเทคนิคลัดที่ใช้สอบได้จริง ไม่เสียเวลา'
    },
    {
      id: 'feat-4',
      icon: 'fa-solid fa-wallet',
      title: 'คุ้มค่า & แบ่งชำระได้',
      desc: 'ค่าเรียนสมเหตุสมผล มีทั้งแบบรายเดือนและรายเทอม พร้อมโปรโมชั่นและตัวเลือกแบ่งจ่ายสบายๆ'
    }
  ]
};

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    studentName: 'น้องแพรวา (รร.สาธิตฯ)',
    school: 'สอบติด ม.4 รร.เตรียมอุดมศึกษา (สายวิทย์-คณิต)',
    examScore: 'คะแนนวิทยาศาสตร์ 92/100',
    image: 'assets/images/course-poster-secondary.jpg',
    quote: 'ขอบคุณพี่ๆ ติวเตอร์ The NEW GEN มากๆ ค่ะ พี่นนท์กับพี่อู๋สอนเทคนิคลัดทำโจทย์ได้เร็วขึ้นเยอะมาก จากที่เคยทำข้อสอบไม่ทัน ตอนนี้มั่นใจขึ้นมากและสอบติดโรงเรียนในฝันแล้วค่ะ',
    isFeatured: true
  },
  {
    id: 'rev-2',
    studentName: 'น้องภูผา (รร.อัสสัมชัญ)',
    school: 'สอบติด ม.1 รร.สวนกุหลาบวิทยาลัย (ห้อง Gifted)',
    examScore: 'คณิตศาสตร์เต็ม 100 คะแนน',
    image: 'assets/images/course-poster-primary.jpg',
    quote: 'พี่แม็คสอนสนุกมากครับ เทคนิคตัดช้อยส์ของพี่อู๋ช่วยผมประหยัดเวลาสอบไปได้เยอะ เรียนสด Onsite ถามได้ตลอดเวลา ไม่เข้าใจตรงไหนพี่ๆ อธิบายจนเคลียร์เลยครับ',
    isFeatured: true
  },
  {
    id: 'rev-3',
    studentName: 'ผู้ปกครองน้องกานต์',
    school: 'เกรดเฉลี่ยเพิ่มขึ้นจาก 3.12 เป็น 3.94',
    examScore: 'วิทย์-คณิต เกรด 4 ทุกเทอม',
    image: 'assets/images/tutor-non.jpg',
    quote: 'ประทับใจสถาบัน The NEW GEN มากค่ะ ลูกชายชอบมาเรียนทุกสัปดาห์ ติวเตอร์ดูแลเอาใจใส่ใกล้ชิด บรรยากาศเป็นกันเอง ผลการเรียนที่โรงเรียนดีขึ้นชัดเจน คุ้มค่ามากค่ะ',
    isFeatured: true
  }
];

const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'ach-1',
    title: 'ความสำเร็จรุ่นพี่ The NEW GEN สอบติด ม.1 และ ม.4 รร.ดัง ประจำปีการศึกษา 2568',
    description: 'ขอแสดงความยินดีกับน้องๆ ทุกคนที่ทุ่มเทติวเข้มและคว้าความสำเร็จสอบติดโรงเรียนในฝัน รร.เตรียมอุดมฯ และสาธิตฯ อย่างงดงาม',
    image: 'assets/images/course-poster-secondary.jpg',
    date: 'มีนาคม 2568'
  },
  {
    id: 'ach-2',
    title: 'ทำเนียบเกียรติยศนักเรียนผลคะแนนสอบยอดเยี่ยม Top Class วิทย์-คณิต-อังกฤษ',
    description: 'สรุปผลคะแนนสอบเก็บคะแนนและสอบแข่งขันระดับประเทศของน้องๆ ที่เข้าเรียนคอร์ส Onsite สถาบันกวดวิชา The NEW GEN',
    image: 'assets/images/course-poster-primary.jpg',
    date: 'กุมภาพันธ์ 2568'
  }
];

const DEFAULT_TUTORS_QUOTE = {
  quote: 'เป้าหมายของเราไม่ใช่แค่การติวให้ผ่านข้อสอบ แต่คือการสร้างทัศนคติที่ดีต่อการเรียน และช่วยให้นักเรียนค้นพบศักยภาพสูงสุดของตนเอง',
  author: 'ทีมติวเตอร์ The NEW GEN Tutoring Institute'
};

const DEFAULT_VIDEOS = [
  {
    id: 'vid-math-set-ep1',
    title: 'สรุป A-Level คณิต 1-2 ทั้งบท : เซต (หลักสูตรใหม่)',
    subject: 'คณิตศาสตร์ ม.ปลาย & ม.ต้น',
    tutor: 'พี่แม็ค (MacTheNewGen)',
    youtubeUrl: 'https://www.youtube.com/watch?v=OEBgi1xzb_c&t=4307s',
    youtubeId: 'OEBgi1xzb_c',
    duration: '1 ชม. 15 นาที',
    description: 'เจาะลึกเนื้อหาและเทคนิคลัดพิชิตโจทย์เรื่องเซต สรุปเข้าใจง่าย พร้อมแนวข้อสอบจริง โดยพี่แม็ค The NEW GEN'
  }
];

const DEFAULT_CONTACT = {
  phones: [
    { name: 'พี่อู๋', number: '095-4721072', telLink: 'tel:0954721072' },
    { name: 'พี่นนท์', number: '098-5322791', telLink: 'tel:0985322791' }
  ],
  lineId: '@390gussc',
  lineUrl: 'https://lin.ee/RXrzi1G',
  facebookName: 'สถาบันกวดวิชา The NEW GEN',
  facebookUrl: 'https://www.facebook.com/thenewgen2',
  instagram: 'the.newgen (@the._newgen)',
  instagramUrl: 'https://www.instagram.com/the_.newgen?psln=MXRhdW56ZnRqajFkaw==',
  tiktok: '@thenewgen89',
  tiktokUrl: 'https://www.tiktok.com/@thenewgen89?_r=1&_t=ZS-9AUULZATQT2',
  youtubeUrl: 'https://www.youtube.com/@macthenewgen',
  address: '480/3 หมู่ 13 นวนคร ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
  mapAppUrl: 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic',
  mapEmbedUrl: 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic'
};

const DEFAULT_PRIVILEGE = {
  badge: 'สิทธิพิเศษ:',
  text: 'ทุกคอร์สสามารถแบ่งชำระได้ พร้อมรับฟรี! เอกสารชุดติวและแนวข้อสอบจริงตลอดคอร์ส'
};

const DEFAULT_HOME = {
  heroBadge: 'สถาบันกวดวิชาของเด็ก GEN Z ยุคใหม่ 🚀',
  titlePrefix: 'สถาบันกวดวิชา',
  titleBrandNew: 'The NEW',
  titleBrandGen: 'GEN',
  subtitle: 'เรียนสนุก ครบทุกเนื้อหา จบที่ The NEW GEN',
  leadText: 'เปิดสอนระดับชั้น ป.4 – ม.6 เน้นการเรียนการสอนแบบกลุ่มเล็ก ดูแลนักเรียนอย่างใกล้ชิดและทั่วถึง ครอบคลุมทั้งการเรียนเพื่อเพิ่มผลสัมฤทธิ์ทางการเรียน การเรียนล่วงหน้าเพื่อเสริมความเข้าใจ และการเตรียมสอบเข้าศึกษาต่อระดับชั้น ม.1 และ ม.4 ในโรงเรียนชั้นนำ พร้อมให้คำแนะนำและวางแผนการเตรียมตัวสอบเข้ามหาวิทยาลัยในระบบ TCAS โดยทีมติวเตอร์คุณภาพที่มีประสบการณ์การสอนมากกว่า 10 ปี',
  trustBadges: [
    '100% ทีมติวเตอร์ The NEW GEN',
    'Onsite กลุ่มเล็กดูแลทั่วถึง',
    'แบ่งชำระค่าเรียนได้'
  ],
  heroTutorsHeaderPill: 'ทีมติวเตอร์ The NEW GEN ประจำสถาบัน',
  heroTutorLeftId: 'tutor-non',
  heroTutorCenterId: 'tutor-au',
  heroTutorRightId: 'tutor-mac'
};

const DEFAULT_ABOUT = {
  badge: 'OUR INSPIRATION & STORY',
  title: 'แรงบันดาลใจในการเป็น The NEW GEN',
  subtitle: 'กวดวิชาที่ไม่ใช่แค่ติวให้สอบผ่าน แต่คือพื้นที่สร้างอนาคตและจุดประกายความฝันของเด็ก GEN Z',
  mainImage: 'assets/images/course-poster-primary.jpg',
  paragraphs: `จุดเริ่มต้นของ 'The NEW GEN' เกิดจากความตั้งใจของกลุ่มติวเตอร์รุ่นใหม่ที่ผ่านระบบการศึกษาและการสอบแข่งขันมาโดยตรง เราพบว่าสิ่งที่เด็กๆ ยุคนี้ต้องการ ไม่ใช่ห้องเรียนแบบเดิมที่เน้นการท่องจำสูตร หรือความกดดันที่ทำให้สูญเสียความมั่นใจ

เราจึงรวมตัวกันสร้างสถาบันกวดวิชาที่ 'เข้าใจธรรมชาติของเด็ก GEN Z อย่างแท้จริง' ที่นี่เราเชื่อมั่นในการเรียนรู้แบบ Onsite กลุ่มเล็กที่อบอุ่น เป็นกันเอง ทุกคนสามารถกล้าถาม กล้าสงสัย และได้รับคำตอบจากติวเตอร์ผู้สอนตัวจริงในทันที

เป้าหมายของเราคือการส่งต่อเทคนิคลัด ความเข้าใจอย่างลึกซึ้ง และทัศนคติที่ดีต่อการเรียนรู้ เพื่อให้น้องๆ ทุกคนค้นพบศักยภาพสูงสุดในตัวเอง พร้อมก้าวสู่โรงเรียนในฝันและความสำเร็จอย่างมั่นใจ`,
  galleryImages: [
    {
      url: 'assets/images/course-poster-secondary.jpg',
      caption: 'บรรยากาศห้องเรียน Onsite กลุ่มเล็ก อบอุ่น และใส่ใจรายบุคคล'
    },
    {
      url: 'assets/images/course-poster-primary.jpg',
      caption: 'ความมุ่งมั่นและรอยยิ้มแห่งความสำเร็จของน้องๆ The NEW GEN'
    }
  ]
};

// Default Admin Credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'NewGen@2026'
};

// Supabase Cloud Configuration for The NEW GEN (Serverless Architecture)
const SUPABASE_CONFIG = {
  url: 'https://wdazilhmlttnurpfewlk.supabase.co',
  anonKey: 'sb_publishable_JEhUerLycZxgOmYstFD4aw_nFT3ifYp',
  serviceKey: 'sb_publishable_JEhUerLycZxgOmYstFD4aw_nFT3ifYp', // Fallback to anonKey to prevent unregistered key failures
  bucket: 'uploads'
};

const SUPABASE_KEY_MAPPING = {
  courses: 'newgen_courses',
  tutors: 'newgen_tutors',
  tutorsQuote: 'newgen_tutors_quote',
  reviews: 'newgen_reviews',
  achievements: 'newgen_achievements',
  videos: 'newgen_videos',
  contact: 'newgen_contact',
  whyus: 'newgen_whyus',
  categories: 'newgen_categories',
  privilege: 'newgen_privilege',
  home: 'newgen_home',
  about: 'newgen_about',
  admin: 'newgen_admin_cred'
};

// Global Store Helper with Integrated Supabase Cloud Sync
const NewGenDB = {
  // Cloud Sync Helpers
  saveToSupabase: async (key, data) => {
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/app_data?on_conflict=key`;
      const apiKey = SUPABASE_CONFIG.anonKey;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ key, data, updated_at: new Date().toISOString() })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Supabase] Cloud save error for [${key}] (HTTP ${res.status}):`, errorText);
        let reason = errorText;
        if (errorText.includes('row-level security') || res.status === 401) {
          reason = 'ติดสิทธิ์ Row-Level Security (RLS) ใน Supabase';
        }
        return { success: false, status: res.status, error: reason, rawError: errorText };
      }
      console.log(`[Supabase] Cloud save SUCCESS for [${key}]`);
      return { success: true };
    } catch (err) {
      console.warn(`[Supabase] Network save warning for [${key}]:`, err);
      return { success: false, error: err.message };
    }
  },

  syncFromSupabase: async () => {
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/app_data?select=key,data`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (!res.ok) return false;
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return false;

      rows.forEach(item => {
        const key = item.key;
        const val = item.data;
        if (!key || val === undefined) return;
        const localKey = SUPABASE_KEY_MAPPING[key];
        if (localKey) {
          try {
            localStorage.setItem(localKey, JSON.stringify(val));
          } catch (e) {}
        }
        if (key === 'courses' && typeof window !== 'undefined') window.courseData = NewGenDB.getCourses();
        if (key === 'tutors' && typeof window !== 'undefined') window.tutorsData = NewGenDB.getTutors();
        if (key === 'tutorsQuote' && typeof window !== 'undefined') window.tutorsQuoteData = val;
        if (key === 'reviews' && typeof window !== 'undefined') window.reviewsData = NewGenDB.getReviews();
        if (key === 'achievements' && typeof window !== 'undefined') window.achievementsData = val;
        if (key === 'videos' && typeof window !== 'undefined') window.videosData = val;
        if (key === 'contact' && typeof window !== 'undefined') window.contactData = val;
        if (key === 'whyus' && typeof window !== 'undefined') window.whyUsData = val;
        if (key === 'categories' && typeof window !== 'undefined') window.categoriesData = val;
        if (key === 'privilege' && typeof window !== 'undefined') window.privilegeData = val;
        if (key === 'home' && typeof window !== 'undefined') window.homeData = val;
        if (key === 'about' && typeof window !== 'undefined') window.aboutData = val;
      });

      // Update UI components across all active pages
      if (typeof renderFooterContactInfo === 'function') renderFooterContactInfo();
      if (typeof renderPrivilegeNote === 'function') renderPrivilegeNote();
      if (typeof window !== 'undefined') {
        if (typeof window.renderHeroContent === 'function') window.renderHeroContent();
        if (typeof window.renderTutors === 'function') window.renderTutors();
        if (typeof window.renderCourses === 'function') window.renderCourses();
        if (typeof window.renderReviews === 'function') window.renderReviews();
        if (typeof window.renderAchievements === 'function') window.renderAchievements();
        if (typeof window.renderWhyUs === 'function') window.renderWhyUs();
        if (typeof window.renderQuote === 'function') window.renderQuote();
        if (typeof window.renderCategoryFilterTabs === 'function') window.renderCategoryFilterTabs();
        if (typeof window.initAdminDashboard === 'function') window.initAdminDashboard();
        if (typeof window.initCourseDetailPage === 'function') window.initCourseDetailPage();
        if (typeof window.renderTrialVideos === 'function') window.renderTrialVideos();
        if (typeof window.renderAboutInspiration === 'function') window.renderAboutInspiration();
        if (typeof window.renderContactChannels === 'function') window.renderContactChannels();
      }

      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('newgen:synced', { detail: rows }));
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Sync from cloud error:', err);
      return false;
    }
  },

  uploadImageToSupabase: async (blob, filename) => {
    try {
      const ext = (filename || 'image.jpg').split('.').pop() || 'jpg';
      const safeName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const apiKey = SUPABASE_CONFIG.anonKey;
      const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/uploads/${safeName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': blob.type || 'image/jpeg'
        },
        body: blob
      });
      if (res.ok) {
        return `${SUPABASE_CONFIG.url}/storage/v1/object/public/uploads/${safeName}`;
      }
    } catch (err) {
      console.warn('[Supabase] Storage upload error:', err);
    }
    return null;
  },

  // Courses
  getCourses: () => {
    const enrichCourse = (c) => ({
      ...c,
      isFeatured: c.isFeatured !== undefined ? c.isFeatured : true,
      galleryImages: (Array.isArray(c.galleryImages) && c.galleryImages.length > 0) ? c.galleryImages : [c.poster || c.cover || 'assets/images/course-poster-primary.jpg'],
      targetAudience: c.targetAudience || '• นักเรียนที่ต้องการปูพื้นฐานวิชาหลักให้แน่นเพื่อต่อยอดสู่วัยมัธยมอย่างมั่นใจ\n• นักเรียนที่ต้องการเพิ่มเกรดในห้องเรียนและเตรียมพร้อมสอบแข่งขัน\n• น้องๆ ที่ต้องการเรียนสด Onsite กลุ่มเล็ก บรรยากาศอบอุ่น กล้าซักถามติวเตอร์ได้ทันที',
      benefits: c.benefits || '• ปูพื้นฐานครบทุกวิชาหลักอย่างเข้มข้น เข้าใจถึงแก่นแท้ไม่เน้นท่องจำ\n• รับฟรี! หนังสือเรียนและแบบฝึกหัดเก็งแนวข้อสอบจริงตลอดหลักสูตร\n• เทคนิคลัดพิชิตโจทย์ยากและวิธีบริหารเวลาในห้องสอบ\n• การดูแลและประเมินผลจุดแข็ง-จุดอ่อนรายบุคคลอย่างใกล้ชิด',
      subjectBreakdown: Array.isArray(c.subjectBreakdown) && c.subjectBreakdown.length > 0 ? c.subjectBreakdown : [
        { name: 'วิทยาศาสตร์', price: '1,500 บาท / เดือน', hours: '14 ชม.', tutor: 'พี่นนท์', details: 'เจาะลึกการทดลอง เคมี-ชีวะ-ฟิสิกส์พื้นฐาน และโจทย์วิเคราะห์' },
        { name: 'คณิตศาสตร์', price: '1,500 บาท / เดือน', hours: '14 ชม.', tutor: 'พี่แม็ค', details: 'ปูพื้นฐานการคำนวณ สูตรลัดตัดช้อยส์ และเทคนิคทำโจทย์เร็ว' },
        { name: 'ภาษาอังกฤษ', price: '1,500 บาท / เดือน', hours: '14 ชม.', tutor: 'พี่อู๋', details: 'ไวยากรณ์ คำศัพท์สำคัญที่ออกสอบบ่อย และเทคนิคการอ่านจับใจความ' }
      ],
      customSections: Array.isArray(c.customSections) ? c.customSections : []
    });

    try {
      const data = localStorage.getItem('newgen_courses');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.map(enrichCourse);
      }
    } catch (e) {}
    return DEFAULT_COURSES.map(enrichCourse);
  },
  saveCourses: (courses) => {
    try {
      localStorage.setItem('newgen_courses', JSON.stringify(courses));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    window.courseData = courses;
    return NewGenDB.saveToSupabase('courses', courses);
  },

  // Tutors
  getTutors: () => {
    try {
      const data = localStorage.getItem('newgen_tutors');
      if (data) {
        const tutors = JSON.parse(data);
        // Data Migration / Correction for updated requirements
        let changed = false;
        tutors.forEach(t => {
          if (t.id === 'tutor-mac') {
            if (t.honor.includes('ป.โท มศว') && !t.honor.includes('คณิตมธ')) {
              t.honor = 'เกียรตินิยมอันดับ 2 คณิตมธ &ป.โท คณิต มศว';
              t.degree = 'วท.บ. คณิตศาสตร์ (เกียรตินิยมอันดับ 2) มธ. & กศ.ม. คณิตศาสตร์ (ป.โท) มศว';
              changed = true;
            }
            if (!t.heroBadge) { t.heroBadge = 'คณิตศาสตร์'; changed = true; }
          }
          if (t.id === 'tutor-non') {
            if (t.subjects !== 'เคมี&วิทยาศาสตร์') {
              t.subjects = 'เคมี&วิทยาศาสตร์';
              t.heroBadge = 'เคมี&วิทยาศาสตร์';
              changed = true;
            }
          }
          if (t.id === 'tutor-au') {
            if (t.subjects !== 'ฟิสิกส์&ภาษาอังกฤษ') {
              t.subjects = 'ฟิสิกส์&ภาษาอังกฤษ';
              t.heroBadge = 'ฟิสิกส์&ภาษาอังกฤษ';
              changed = true;
            }
          }
        });
        if (changed) {
          try {
            localStorage.setItem('newgen_tutors', JSON.stringify(tutors));
          } catch(e) {}
        }
        return tutors;
      }
    } catch (e) {}
    return DEFAULT_TUTORS;
  },
  saveTutors: (tutors) => {
    try {
      localStorage.setItem('newgen_tutors', JSON.stringify(tutors));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.tutorsData = tutors;
    return NewGenDB.saveToSupabase('tutors', tutors);
  },

  // Tutors Quote Banner
  getTutorsQuote: () => {
    try {
      const data = localStorage.getItem('newgen_tutors_quote');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return DEFAULT_TUTORS_QUOTE;
  },
  saveTutorsQuote: (quoteObj) => {
    try {
      localStorage.setItem('newgen_tutors_quote', JSON.stringify(quoteObj));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.tutorsQuoteData = quoteObj;
    return NewGenDB.saveToSupabase('tutorsQuote', quoteObj);
  },

  // Reviews
  getReviews: () => {
    try {
      const data = localStorage.getItem('newgen_reviews');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.map(r => ({
          ...r,
          isFeatured: r.isFeatured !== undefined ? r.isFeatured : true
        }));
      }
    } catch (e) {}
    return DEFAULT_REVIEWS.map(r => ({
      ...r,
      isFeatured: r.isFeatured !== undefined ? r.isFeatured : true
    }));
  },
  saveReviews: (reviews) => {
    try {
      localStorage.setItem('newgen_reviews', JSON.stringify(reviews));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.reviewsData = reviews;
    return NewGenDB.saveToSupabase('reviews', reviews);
  },

  // Achievements / Hall of Fame Banners
  getAchievements: () => {
    try {
      const data = localStorage.getItem('newgen_achievements');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return DEFAULT_ACHIEVEMENTS;
  },
  saveAchievements: (achievements) => {
    try {
      localStorage.setItem('newgen_achievements', JSON.stringify(achievements));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.achievementsData = achievements;
    return NewGenDB.saveToSupabase('achievements', achievements);
  },

  // Videos
  getVideos: () => {
    try {
      const data = localStorage.getItem('newgen_videos');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_VIDEOS;
  },
  saveVideos: (videos) => {
    try {
      localStorage.setItem('newgen_videos', JSON.stringify(videos));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.videosData = videos;
    return NewGenDB.saveToSupabase('videos', videos);
  },

  // Contact
  getContact: () => {
    try {
      const data = localStorage.getItem('newgen_contact');
      if (data) {
        const c = JSON.parse(data);
        if (!c.address || c.address.includes('เรียนสด Onsite ห้องแอร์')) {
          c.address = DEFAULT_CONTACT.address;
          c.mapAppUrl = DEFAULT_CONTACT.mapAppUrl;
          try { localStorage.setItem('newgen_contact', JSON.stringify(c)); } catch(e) {}
        }
        if (!c.mapAppUrl) {
          c.mapAppUrl = DEFAULT_CONTACT.mapAppUrl;
          try { localStorage.setItem('newgen_contact', JSON.stringify(c)); } catch(e) {}
        }
        return c;
      }
    } catch (e) {}
    return DEFAULT_CONTACT;
  },
  saveContact: (contact) => {
    try {
      localStorage.setItem('newgen_contact', JSON.stringify(contact));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.contactData = contact;
    return NewGenDB.saveToSupabase('contact', contact);
  },

  // Why Us (ทำไมต้องเลือก The NEW GEN)
  getWhyUs: () => {
    try {
      const data = localStorage.getItem('newgen_whyus');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return DEFAULT_WHYUS;
  },
  saveWhyUs: (whyus) => {
    try {
      localStorage.setItem('newgen_whyus', JSON.stringify(whyus));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.whyUsData = whyus;
    return NewGenDB.saveToSupabase('whyus', whyus);
  },

  // Categories (ระดับชั้น)
  getCategories: () => {
    try {
      const data = localStorage.getItem('newgen_categories');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  },
  saveCategories: (categories) => {
    try {
      localStorage.setItem('newgen_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.categoriesData = categories;
    return NewGenDB.saveToSupabase('categories', categories);
  },

  // Privilege Banner (Item 3)
  getPrivilege: () => {
    try {
      const data = localStorage.getItem('newgen_privilege');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return DEFAULT_PRIVILEGE;
  },
  savePrivilege: (privilege) => {
    try {
      localStorage.setItem('newgen_privilege', JSON.stringify(privilege));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.privilegeData = privilege;
    return NewGenDB.saveToSupabase('privilege', privilege);
  },

  // Home Page Settings & Tutor Placement
  getHome: () => {
    try {
      const data = localStorage.getItem('newgen_home');
      if (data) return { ...DEFAULT_HOME, ...JSON.parse(data) };
    } catch (e) {}
    return DEFAULT_HOME;
  },
  saveHome: (homeObj) => {
    try {
      localStorage.setItem('newgen_home', JSON.stringify(homeObj));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.homeData = homeObj;
    return NewGenDB.saveToSupabase('home', homeObj);
  },

  // About Us & Inspiration
  getAbout: () => {
    try {
      const data = localStorage.getItem('newgen_about');
      if (data) return { ...DEFAULT_ABOUT, ...JSON.parse(data) };
    } catch (e) {}
    return DEFAULT_ABOUT;
  },
  saveAbout: (aboutObj) => {
    try {
      localStorage.setItem('newgen_about', JSON.stringify(aboutObj));
    } catch (e) {
      console.warn('LocalStorage save error, saving compact version:', e);
      try {
        // If quota exceeded due to base64, save safe reference and rely on server
        const safeAbout = { ...aboutObj };
        if (safeAbout.mainImage && safeAbout.mainImage.startsWith('data:image/')) {
          safeAbout.mainImage = 'assets/images/course-poster-primary.jpg';
        }
        localStorage.setItem('newgen_about', JSON.stringify(safeAbout));
      } catch (err2) {}
    }
    if (typeof window !== 'undefined') window.aboutData = aboutObj;
    return NewGenDB.saveToSupabase('about', aboutObj);
  },

  // Admin Credentials & Authentication
  getAdminAuth: () => {
    try {
      const data = localStorage.getItem('newgen_admin_cred');
      if (data) return { ...DEFAULT_ADMIN, ...JSON.parse(data) };
    } catch (e) {}
    return DEFAULT_ADMIN;
  },
  saveAdminAuth: (authObj) => {
    try {
      localStorage.setItem('newgen_admin_cred', JSON.stringify(authObj));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    try {
      const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      if (base) {
        fetch(`${base}/api/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authObj)
        }).catch(() => {});
      }
    } catch (err) {}
    return NewGenDB.saveToSupabase('admin', authObj);
  },

  // Reset to default
  resetDefaults: () => {
    localStorage.removeItem('newgen_courses');
    localStorage.removeItem('newgen_categories');
    localStorage.removeItem('newgen_privilege');
    localStorage.removeItem('newgen_tutors');
    localStorage.removeItem('newgen_tutors_quote');
    localStorage.removeItem('newgen_reviews');
    localStorage.removeItem('newgen_achievements');
    localStorage.removeItem('newgen_videos');
    localStorage.removeItem('newgen_contact');
    localStorage.removeItem('newgen_whyus');
    localStorage.removeItem('newgen_home');
    localStorage.removeItem('newgen_about');
  }
};

/**
 * Universal API Base URL resolver:
 * Ensures requests from file:// or Live Server (port 5500) seamlessly route to http://localhost:3000
 */
function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  if (window.location.port && window.location.port !== '3000') {
    return 'http://localhost:3000';
  }
  return '';
}

/**
 * Universal media URL resolver:
 * Ensures images saved as "uploads/..." load correctly even across ports or file protocols.
 */
function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const base = getApiBaseUrl();
    if (base) return `${base}/${cleanPath}`;
    return cleanPath;
  }
  return url;
}

// Initialize window variables
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.getApiBaseUrl = getApiBaseUrl;
  window.resolveMediaUrl = resolveMediaUrl;
  window.formatExternalUrl = formatExternalUrl;
  window.escapeHtml = escapeHtml;
  window.NewGenDB = NewGenDB;
  window.courseData = NewGenDB.getCourses();
  window.categoriesData = NewGenDB.getCategories();
  window.privilegeData = NewGenDB.getPrivilege();
  window.tutorsData = NewGenDB.getTutors();
  window.tutorsQuoteData = NewGenDB.getTutorsQuote();
  window.reviewsData = NewGenDB.getReviews();
  window.achievementsData = NewGenDB.getAchievements();
  window.videosData = NewGenDB.getVideos();
  window.contactData = NewGenDB.getContact();
  window.whyUsData = NewGenDB.getWhyUs();
  window.homeData = NewGenDB.getHome();
  window.aboutData = NewGenDB.getAbout();

  // Run cloud sync in background immediately
  NewGenDB.syncFromSupabase();
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

/**
 * Universal external URL formatter:
 * Ensures full https:// protocol so relative path confusion never occurs.
 */
function formatExternalUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|tel:|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Elegant Course Price & Unit Formatter for Course Cards:
 * Separates numerical price, unit (e.g. บาท / เทอม), and installment note (แบ่งชำระได้)
 * into a modern, beautifully proportioned hierarchy.
 */
function formatCoursePriceHtml(c) {
  if (!c) return '';
  const priceOriginal = c.priceOriginal ? `<span class="course-price-old">จาก ${escapeHtml(c.priceOriginal)}</span>` : '';
  const pricePromo = escapeHtml(c.pricePromo || '0');
  const rawUnit = c.priceUnit || 'บาท / เทอม';
  
  let unitText = rawUnit;
  let hasInstallment = false;
  
  if (/แบ่งชำระ/i.test(rawUnit)) {
    hasInstallment = true;
    unitText = rawUnit.replace(/\(?\s*แบ่งชำระ(ได้)?\s*\)?/gi, '').replace(/[()]/g, '').trim();
    if (!unitText) unitText = 'บาท / เทอม';
  }

  const installmentBadge = hasInstallment ? `
    <span class="course-installment-pill">
      <i class="fa-solid fa-circle-check"></i> แบ่งชำระได้
    </span>
  ` : '';

  return `
    <div class="course-price-wrap">
      ${priceOriginal}
      <div class="course-price-now">
        <span class="course-price-amount">${pricePromo}</span><span class="course-price-dash">.-</span>
        <span class="course-price-unit-tag">${escapeHtml(unitText)}</span>
      </div>
      ${installmentBadge}
    </div>
  `;
}

if (typeof window !== 'undefined') {
  window.formatCoursePriceHtml = formatCoursePriceHtml;
}

/**
 * Universal Footer and Contact Synchronization across all pages
 */
function renderFooterContactInfo() {
  const contact = window.NewGenDB ? window.NewGenDB.getContact() : DEFAULT_CONTACT;
  if (!contact) return;

  // 1. Resolve sanitized URLs
  const lineUrl = formatExternalUrl(contact.lineUrl || (contact.lineId ? `https://line.me/R/ti/p/~${encodeURIComponent(contact.lineId)}` : 'https://lin.ee/RXrzi1G'));
  const lineId = contact.lineId || '@390gussc';

  const fbUrl = formatExternalUrl(contact.facebookUrl || 'https://www.facebook.com/thenewgen2');
  const fbName = contact.facebookName || 'สถาบันกวดวิชา The NEW GEN';

  let tiktokUrl = formatExternalUrl(contact.tiktokUrl || '');
  if (!tiktokUrl && contact.tiktok) {
    const handle = contact.tiktok.startsWith('@') ? contact.tiktok : `@${contact.tiktok}`;
    tiktokUrl = `https://www.tiktok.com/${handle}`;
  }
  if (!tiktokUrl) tiktokUrl = 'https://www.tiktok.com/@thenewgen89?_r=1&_t=ZS-9AUULZATQT2';
  const tiktokHandle = contact.tiktok || '@thenewgen89';

  let igUrl = formatExternalUrl(contact.instagramUrl || '');
  if (!igUrl && contact.instagram) {
    const handle = contact.instagram.replace(/[@()]/g, '').trim().split(' ')[0];
    igUrl = `https://www.instagram.com/${handle}`;
  }
  if (!igUrl) igUrl = 'https://www.instagram.com/the_.newgen?psln=MXRhdW56ZnRqajFkaw==';
  const igHandle = contact.instagram || 'the.newgen (@the._newgen)';

  const ytUrl = formatExternalUrl(contact.youtubeUrl || 'https://www.youtube.com/@macthenewgen');
  const mapAppUrl = formatExternalUrl(contact.mapAppUrl || 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic');

  // 2. LINE URLs and ID across all buttons, icons, and text
  const lineSelectors = [
    'a.floating-btn.line-btn',
    'a.btn-luxury-line',
    'a.btn-cd-line',
    'a.btn-sb-line',
    'a.btn-xs-table-line',
    'a.social-icon-btn.line',
    'a.social-pill-card.line',
    '#contactLineLink',
    '#footerLineLink',
    '#btnLineEnroll',
    'a.footer-line-link',
    '.footer-social-links a.line',
    '.footer-social-links a[href*="line.me"]',
    '.footer-social-links a[href*="lin.ee"]',
    '.footer-contact-list a[href*="line.me"]',
    '.footer-contact-list a[href*="lin.ee"]'
  ].join(', ');

  document.querySelectorAll(lineSelectors).forEach(el => {
    el.href = lineUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  document.querySelectorAll('#contactLineId, #footerLineText, .footer-line-id').forEach(el => {
    el.textContent = lineId;
  });

  // Specifically check .contact-card-item for LINE in footer
  document.querySelectorAll('.footer-contact-list .contact-card-item, .contact-card-item').forEach(card => {
    if (card.querySelector('.fa-line')) {
      const a = card.querySelector('a');
      if (a) {
        a.href = lineUrl;
        a.textContent = lineId;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  });

  // 3. Facebook Links across icons, footer cards, and pills
  const fbSelectors = [
    'a.social-icon-btn.fb',
    'a.social-icon-btn.facebook',
    'a.footer-fb-link',
    'a.social-pill-card.fb',
    '.footer-social-links a.fb',
    '.footer-social-links a[href*="facebook.com"]'
  ].join(', ');

  document.querySelectorAll(fbSelectors).forEach(el => {
    el.href = fbUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    if (fbName) el.title = `Facebook Page: ${fbName}`;
  });

  // Update text and link in .contact-card-item for Facebook
  document.querySelectorAll('.footer-contact-list .contact-card-item, .contact-card-item').forEach(card => {
    if (card.querySelector('.fa-facebook, .fa-facebook-f')) {
      const a = card.querySelector('a');
      if (a) {
        a.href = fbUrl;
        a.textContent = fbName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  });

  // 4. TikTok Links across icons, footer cards, and pills
  const tiktokSelectors = [
    'a.social-icon-btn.tiktok',
    'a.footer-tiktok-link',
    'a.social-pill-card.tiktok',
    '.footer-social-links a.tiktok',
    '.footer-social-links a[href*="tiktok.com"]'
  ].join(', ');

  document.querySelectorAll(tiktokSelectors).forEach(el => {
    el.href = tiktokUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    if (tiktokHandle) el.title = `TikTok: ${tiktokHandle}`;
  });

  // Update text and link in .contact-card-item for TikTok
  document.querySelectorAll('.footer-contact-list .contact-card-item, .contact-card-item').forEach(card => {
    if (card.querySelector('.fa-tiktok')) {
      const a = card.querySelector('a');
      if (a) {
        a.href = tiktokUrl;
        a.textContent = tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  });

  // 5. Instagram Links across icons, footer cards, and pills
  const igSelectors = [
    'a.social-icon-btn.ig',
    'a.social-icon-btn.instagram',
    'a.footer-ig-link',
    'a.social-pill-card.ig',
    '.footer-social-links a.ig',
    '.footer-social-links a[href*="instagram.com"]'
  ].join(', ');

  document.querySelectorAll(igSelectors).forEach(el => {
    el.href = igUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    if (igHandle) el.title = `Instagram: ${igHandle}`;
  });

  // Update text and link in .contact-card-item for Instagram
  document.querySelectorAll('.footer-contact-list .contact-card-item, .contact-card-item').forEach(card => {
    if (card.querySelector('.fa-instagram')) {
      const a = card.querySelector('a');
      if (a) {
        a.href = igUrl;
        a.textContent = igHandle;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  });

  // 6. YouTube Links across icons, footer cards, and pills
  const ytSelectors = [
    'a.social-icon-btn.yt',
    'a.social-icon-btn.youtube',
    'a.footer-yt-link',
    'a.social-pill-card.yt',
    '.footer-social-links a.yt',
    '.footer-social-links a[href*="youtube.com"]'
  ].join(', ');

  document.querySelectorAll(ytSelectors).forEach(el => {
    el.href = ytUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  // 7. Footer Phones
  if (contact.phones && contact.phones.length > 0) {
    document.querySelectorAll('#footerPhonesList, .footer-phones-wrap').forEach(el => {
      el.innerHTML = contact.phones.map(p => `
        <a href="${p.telLink || 'tel:' + p.number.replace(/[^0-9]/g, '')}" class="footer-phone-link" style="color: #38bdf8; text-decoration: none; margin-right: 12px; display: inline-flex; align-items: center; gap: 5px; font-weight: 700;">
          <i class="fa-solid fa-phone" style="color: #38bdf8;"></i> ${escapeHtml(p.name)}: <strong style="color: #ffffff;">${escapeHtml(p.number)}</strong>
        </a>
      `).join('');
    });

    document.querySelectorAll('.footer-contact-list .contact-card-item, .contact-card-item').forEach(card => {
      if (card.querySelector('.fa-phone') && !card.classList.contains('phone-builder-row')) {
        const textWrap = card.querySelector('div');
        if (textWrap) {
          textWrap.innerHTML = `
            <span class="contact-highlight">เบอร์โทรศัพท์:</span><br>
            ${contact.phones.map(p => `
              <a href="${p.telLink || 'tel:' + p.number.replace(/[^0-9]/g, '')}" class="phone-number-link" style="color: #38bdf8; font-weight: 700; text-decoration: none;">${escapeHtml(p.number)}</a>
              <span class="phone-owner-text" style="color: #f1f5f9; font-weight: 600;">(${escapeHtml(p.name)})</span>
            `).join('<br>')}
          `;
        }
      }
    });

    const firstPhone = contact.phones[0];
    if (firstPhone) {
      document.querySelectorAll('a.floating-btn.phone-btn, .footer-social-links a.phone').forEach(el => {
        el.href = firstPhone.telLink || `tel:${firstPhone.number.replace(/[^0-9]/g, '')}`;
        el.title = `โทรติดต่อ ${firstPhone.name} (${firstPhone.number})`;
      });
    }
  }

  // 8. Footer & Contact Addresses
  document.querySelectorAll('#footerAddress, #contactAddress, .footer-address-text').forEach(el => {
    if (contact.address) el.textContent = contact.address;
  });

  // 9. Maps navigation
  document.querySelectorAll('#btnOpenGoogleMapApp, .btn-open-maps-app, a[href*="maps.google.com"], a[href*="maps.app.goo.gl"]').forEach(el => {
    if (mapAppUrl) el.href = mapAppUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  const mapIframe = document.getElementById('contactGoogleMap');
  if (mapIframe && contact.mapEmbedUrl) {
    mapIframe.src = contact.mapEmbedUrl;
  }
}

function renderPrivilegeNote() {
  const priv = window.NewGenDB ? window.NewGenDB.getPrivilege() : DEFAULT_PRIVILEGE;
  if (!priv) return;
  const badgeEl = document.getElementById('privilegeBadgeText');
  const textEl = document.getElementById('privilegeNoteText');
  if (badgeEl && priv.badge) badgeEl.textContent = priv.badge;
  if (textEl && priv.text) textEl.textContent = priv.text;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderFooterContactInfo();
      renderPrivilegeNote();
    });
  } else {
    renderFooterContactInfo();
    renderPrivilegeNote();
  }
}
