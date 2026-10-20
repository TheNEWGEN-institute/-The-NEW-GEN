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
    ],
    maxSeats: 12
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
    ],
    maxSeats: 12
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
    ],
    maxSeats: 12
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
    ],
    maxSeats: 10
  }
];

const DEFAULT_TUTORS = [
  {
    id: 'tutor-non',
    name: 'พี่นนท์',
    type: 'onsite',
    honor: 'เกียรตินิยมอันดับ 1 เคมี มศว',
    degree: 'วท.บ. เคมี (เกียรตินิยมอันดับ 1) มหาวิทยาลัยศรีนครินทรวิโรฒ',
    subjects: 'เคมี&วิทยาศาสตร์',
    heroBadge: 'เคมี&วิทยาศาสตร์',
    image: 'assets/images/tutor-non-opt.jpg',
    bio: 'ติวเตอร์เคมีและวิทยาศาสตร์ประจำสถาบัน The NEW GEN ประสบการณ์สอนกว่า 7 ปี เชี่ยวชาญการปูพื้นฐานวิทยาศาสตร์จากภาพจำและการทดลอง สอนสนุก ไม่น่าเบื่อ นำพานักเรียนสอบติด รร. ชั้นนำมากมาย',
    tagline: 'เข้าใจเคมีอย่างเป็นระบบ ไม่เน้นท่องจำ แต่นำไปใช้ทำโจทย์ได้จริง'
  },
  {
    id: 'tutor-au',
    name: 'พี่อู๋',
    type: 'onsite',
    honor: 'เกียรตินิยมอันดับ 2 วิศวกรรมนานาชาติ มธ.',
    degree: 'วศ.บ. วิศวกรรมศาสตร์นานาชาติ (เกียรตินิยมอันดับ 2) มหาวิทยาลัยธรรมศาสตร์',
    subjects: 'ฟิสิกส์&ภาษาอังกฤษ',
    heroBadge: 'ฟิสิกส์&ภาษาอังกฤษ',
    image: 'assets/images/tutor-ou-opt.jpg',
    bio: 'ติวเตอร์ฟิสิกส์และคณิตศาสตร์สายลุย เทคนิคลัดขั้นเทพ คิดโจทย์เร็ว แม่นยำตรงจุด เจาะลึกข้อสอบแข่งขันและข้อสอบเข้า ม.1, ม.4 เตรียมอุดมฯ สาธิตฯ',
    tagline: 'ฟิสิกส์-คณิตศาสตร์ไม่ใช่เรื่องยาก แค่รู้มุมมองคิดลัดแบบวิศวกร'
  },
  {
    id: 'tutor-mac',
    name: 'พี่แม็ค',
    type: 'onsite',
    honor: 'เกียรตินิยมอันดับ 2 คณิตมธ &ป.โท คณิต มศว',
    degree: 'วท.บ. คณิตศาสตร์ (เกียรตินิยมอันดับ 2) มธ. & กศ.ม. คณิตศาสตร์ (ป.โท) มศว',
    subjects: 'คณิตศาสตร์',
    heroBadge: 'คณิตศาสตร์',
    image: 'assets/images/tutor-mac-opt.jpg',
    bio: 'ติวเตอร์คณิตศาสตร์ระดับปรมาจารย์ ผู้เชี่ยวชาญการวิเคราะห์จุดอ่อนและข้อสอบคณิตศาสตร์เชิงลึก สอนตั้งแต่วิธีคิดพื้นฐานจนถึงโจทย์ยากระดับโอลิมปิก',
    tagline: 'ตีโจทย์คณิตแตกละเอียด อัปเกรดผลการเรียนเกรด 4 ได้ทุกคน'
  },
  {
    id: 'tutor-anont',
    name: 'พี่อานนท์',
    type: 'onsite',
    honor: 'ทีมติวเตอร์ The NEW GEN',
    degree: 'สถาบันกวดวิชา The NEW GEN',
    subjects: 'วิทยาศาสตร์ & คณิตศาสตร์',
    heroBadge: 'วิทยาศาสตร์ & คณิตศาสตร์',
    image: 'assets/images/tutor-anont-opt.jpg',
    bio: 'ติวเตอร์ประจำสถาบัน The NEW GEN ดูแลใกล้ชิด อธิบายละเอียด เทคนิคคิดลัด เข้าใจง่าย',
    tagline: 'เรียนสนุก เข้าใจง่าย ทำโจทย์ได้จริง'
  }
];

const DEFAULT_CATEGORIES = [
  { id: 'primary45', name: 'ประถม ป.4 - ป.5', badgeClass: 'badge-primary-level' },
  { id: 'primary6', name: 'ประถม ป.6 (สอบเข้า ม.1)', badgeClass: 'badge-primary-level' },
  { id: 'secondary1', name: 'มัธยมศึกษา ม.1', badgeClass: 'badge-secondary-level' },
  { id: 'secondary2', name: 'มัธยมศึกษา ม.2', badgeClass: 'badge-secondary-level' },
  { id: 'secondary3', name: 'มัธยมศึกษา ม.3 (สอบเข้า ม.4)', badgeClass: 'badge-secondary-level' },
  { id: 'highschool4', name: 'มัธยมศึกษา ม.4', badgeClass: 'badge-highschool-level' },
  { id: 'highschool5', name: 'มัธยมศึกษา ม.5', badgeClass: 'badge-highschool-level' }
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
  footerDesc: 'สถาบันกวดวิชา The NEW GEN กวดวิชาของเด็ก GENZ เรียนสนุก ครบทุกเนื้อหา จบที่ The NEW GEN พัฒนาทักษะวิชาการและความมั่นใจสู่อนาคตที่สดใส',
  mapAppUrl: 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic',
  mapEmbedUrl: 'https://maps.app.goo.gl/NSR8rtGecvjyE1KL8?g_st=ic',
  mapGraphicImage: 'assets/images/map-graphic.jpg'
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
  heroTutorRightId: 'tutor-mac',
  coursesBadge: 'POPULAR ONSITE COURSES',
  coursesTitle: 'คอร์สเรียน Onsite แนะนำ',
  coursesHighlight: 'เปิดเทอม 2/69'
};

const DEFAULT_ABOUT = {
  heroDesc: 'เรื่องราว ความตั้งใจ และจุดเริ่มต้นของการสร้างสถาบันกวดวิชาที่เข้าใจธรรมชาติของเด็ก GEN Z ยุคใหม่อย่างแท้จริง',
  badge: 'OUR INSPIRATION & STORY',
  title: 'แรงบันดาลใจในการเป็น The NEW GEN',
  subtitle: 'กวดวิชาที่ไม่ใช่แค่ติวให้สอบผ่าน แต่คือพื้นที่สร้างอนาคตและจุดประกายความฝันของเด็ก GEN Z',
  mainImage: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791870836312-526i.jpg',
  secondaryImage: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791870847531-ksdu.jpg',
  paragraphs: `​กวดวิชา The New Gen เกิดขึ้นจากความตั้งใจที่อยากให้  "น้อง ๆ ทุกคนเข้าถึงโอกาสทางการศึกษาได้อย่างเท่าเทียม" ​ราคาสมเหตุสมผล คุ้มค่า เมื่อเทียบราคาต่อชั่วโมงแล้ว เรียนที่นี่ประหยัดกว่า เพื่อช่วยลดภาระของผู้ปกครอง​ใส่ใจเต็มที่ ทั้งในและนอกห้องเรียน อีกทั้งมีติวเพิ่มพิเศษนอกตารางเรียน พร้อมดูแลใกล้ชิด สามารถทัก Line สอบถามเนื้อหาที่ไม่เข้าใจได้ตลอดเวลา ​เป็นที่ปรึกษาที่จริงใจ ไม่ใช่แค่เรื่องเรียน แต่เราพร้อมเป็นพี่ปรึกษาให้ทั้งน้องๆ และผู้ปกครอง ช่วยวิเคราะห์ข้อดี-ข้อด้อยของแต่ละโรงเรียนในพื้นที่ เพื่อแนะนำการเลือกโรงเรียนมัธยม รวมถึงการเลือกคณะและมหาวิทยาลัยในระดับอุดมศึกษาอย่างตรงจุด ​บรรยากาศเหมือนครอบครัว น้อง ๆ มีความสนิทสนม ผูกพัน และไว้วางใจเรียนต่อเนื่องกับเรามาอย่างยาวนาน`,
  galleryImages: [
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890797027-mctw.jpg', caption: 'บรรยากาศการเรียนสด Onsite The NEW GEN' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890811986-hd02.jpg', caption: 'ติวเตอร์ดูแลใกล้ชิดรายบุคคล' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890837130-vsjl.jpg', caption: 'กลุ่มเล็ก ซักถามได้ทันที' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890862549-x5al.jpg', caption: 'ตั้งใจฝึกทำโจทย์ข้อสอบจริง' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890874376-n52p.jpg', caption: 'เทคนิคคิดลัด เข้าใจง่าย' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890920155-u6fi.jpg', caption: 'ห้องเรียน Onsite สะอาด สบาย เป็นกันเอง' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890922773-nsnb.jpg', caption: 'พัฒนาการเรียนและความมั่นใจของน้องๆ' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890929124-p6n3.jpg', caption: 'กิจกรรมติวเสริมสร้างทัศนคติที่ดี' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890936556-tak8.jpg', caption: 'ความอบอุ่นเหมือนครอบครัว' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890966233-345c.jpg', caption: 'แนะแนวการศึกษาและวางแผนสอบเข้า' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791890991388-h00x.jpg', caption: 'รอยยิ้มและความผูกพันกับพี่ๆ ติวเตอร์' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791891067537-v5jl.jpg', caption: 'มุ่งมั่นเตรียมสอบเข้า ม.1 และ ม.4' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791891078031-hwg6.jpg', caption: 'ติวเข้มเนื้อหาพร้อมฝึกทำโจทย์' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791891085570-pofh.jpg', caption: 'ความสำเร็จและความภูมิใจของ The NEW GEN' },
    { url: 'https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791891357840-01sl.jpg', caption: 'บรรยากาศการเรียนรู้ที่สนุกสนาน' }
  ]
};

// Default Bundles (แพ็คเกจคอร์สเรียนโปรโมชั่น)
const DEFAULT_BUNDLES = [
  {
    "id": "bundle-m4-combo",
    "name": "แพ็คเกจ ม.4 สายวิทย์-คณิต ติวเข้ม 3 วิชาหลัก (ฟิสิกส์-เคมี-คณิต)",
    "badge": "🔥 แพ็คเกจ ม.4 สุดคุ้ม ประหยัดทันที 3,600.-",
    "courseIds": [
      "course-1792005088984",
      "course-1792064484886",
      "course-1792064939523"
    ],
    "priceOriginal": "13,500",
    "pricePromo": "9,900",
    "priceUnit": "บาท / แพ็คเกจ (3 คอร์ส)",
    "imageMode": "stack",
    "customImage": "",
    "description": "รวม 3 คอร์สหลัก ม.4 เทอม 2 ปูพื้นฐานเข้มข้น ฟิสิกส์ เคมี คณิตศาสตร์ พร้อมเจาะลึกแนวข้อสอบจริง",
    "showInCourses": true,
    "showInHome": true,
    "categoryIds": ["highschool4"],
    "active": true,
    "order": 1,
    "createdAt": "2026-10-15T14:53:09.976Z"
  }
];

// Supabase Cloud Configuration for The NEW GEN (Serverless Architecture)
// anonKey เป็น publishable key ที่ออกแบบให้อยู่ในหน้าเว็บได้ — สิทธิ์จริงถูกจำกัดด้วย RLS ฝั่ง Supabase
// (ห้ามใส่ service_role / secret key ในไฟล์ฝั่งหน้าเว็บเด็ดขาด)
const SUPABASE_CONFIG = {
  url: 'https://wdazilhmlttnurpfewlk.supabase.co',
  anonKey: 'sb_publishable_JEhUerLycZxgOmYstFD4aw_nFT3ifYp',
  bucket: 'uploads',
  studentBucket: 'student-uploads'
};

/* ==========================================================================
   ADMIN AUTH (Supabase Auth) — แอดมินล็อกอินด้วยอีเมล/รหัสผ่านของ Supabase
   ระบบเก็บ session token ไว้ในเบราว์เซอร์ และใช้ token นี้แนบทุกคำขอที่แก้ไขข้อมูล
   ========================================================================== */
const ADMIN_SESSION_KEY = 'newgen_admin_session';

const NewGenAuth = {
  getSession: () => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      const s = raw ? JSON.parse(raw) : null;
      return s && s.access_token && s.refresh_token ? s : null;
    } catch (e) {
      return null;
    }
  },

  _saveSession: (data) => {
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      email: data.user ? data.user.email : ''
    };
    try { localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    return session;
  },

  clearSession: () => {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {}
  },

  // อ่าน claims ใน token (ใช้แสดงผลเท่านั้น — สิทธิ์จริงตรวจที่ Supabase)
  getClaims: (session = NewGenAuth.getSession()) => {
    try {
      const payload = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch (e) {
      return null;
    }
  },

  isAdminSession: (session = NewGenAuth.getSession()) => {
    const claims = session ? NewGenAuth.getClaims(session) : null;
    return Boolean(claims && claims.app_metadata && claims.app_metadata.role === 'admin');
  },

  _authRequest: async (path, body) => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/${path}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.error_description || json.msg || json.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json;
  },

  signIn: async (email, password) => {
    const data = await NewGenAuth._authRequest('token?grant_type=password', { email, password });
    return NewGenAuth._saveSession(data);
  },

  refresh: async () => {
    const s = NewGenAuth.getSession();
    if (!s) return null;
    try {
      const data = await NewGenAuth._authRequest('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
      return NewGenAuth._saveSession(data);
    } catch (e) {
      // refresh token หมดอายุ/ถูกเพิกถอน → ต้องล็อกอินใหม่
      if (e.status === 400 || e.status === 401) NewGenAuth.clearSession();
      return null;
    }
  },

  // คืน access token ที่ยังไม่หมดอายุ (ต่ออายุอัตโนมัติถ้าเหลือน้อยกว่า 60 วินาที)
  getAccessToken: async () => {
    let s = NewGenAuth.getSession();
    if (!s) return null;
    if (!s.expires_at || s.expires_at - 60 < Math.floor(Date.now() / 1000)) {
      s = await NewGenAuth.refresh();
    }
    return s ? s.access_token : null;
  },

  signOut: async () => {
    const s = NewGenAuth.getSession();
    NewGenAuth.clearSession();
    if (!s) return;
    try {
      await fetch(`${SUPABASE_CONFIG.url}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${s.access_token}` }
      });
    } catch (e) {}
  },

  updatePassword: async (newPassword) => {
    const token = await NewGenAuth.getAccessToken();
    if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
    const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/user`, {
      method: 'PUT',
      headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.msg || json.error_description || json.message || `HTTP ${res.status}`);
    return json;
  }
};

// Headers สำหรับเรียก Supabase: ใช้ token ของแอดมินถ้าล็อกอินอยู่ ไม่เช่นนั้นใช้สิทธิ์สาธารณะ
async function getSupabaseHeaders(extra = {}) {
  const token = await NewGenAuth.getAccessToken();
  return {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${token || SUPABASE_CONFIG.anonKey}`,
    ...extra
  };
}

// Default Campaign Popup Configuration (โครงการติวฟรี & ประกาศหน้าแรก)
const DEFAULT_POPUP_CAMPAIGN = {
  enabled: true,
  title: "โครงการติวฟรี ตะลุยโจทย์พิชิตเกรด 4 & สอบเข้า ม.1 / ม.4",
  badge: "🔥 โครงการติวฟรี โควตาจำกัด 30 ที่นั่ง",
  image: "https://wdazilhmlttnurpfewlk.supabase.co/storage/v1/object/public/uploads/img-1791819087634-e5ri.png",
  description: "สัมผัสเทคนิคการสอนจริงโดยทีมติวเตอร์ The NEW GEN ฟรี! ไม่มีค่าใช้จ่าย พร้อมรับเอกสารสรุปสูตรเก็งข้อสอบจริง และแนวคิดลัดที่นำไปใช้สอบได้ทันที",
  highlights: "- เรียนสด Onsite กลุ่มเล็ก ติวเตอร์ประกบดูแลใกล้ชิด ซักถามได้ทันที\n- ฟรี! ชุดเอกสารแบบฝึกหัดและแนวข้อสอบเก็งพิเศษตลอดโครงการ\n- วิเคราะห์จุดอ่อนรายบุคคล พร้อมแนะแนววางแผนสอบเข้า รร. ดัง",
  btnRegisterText: "สมัครเข้าเรียนฟรีทันที",
  btnLineText: "สอบถามเพิ่มเติมทาง LINE",
  lineUrl: "https://lin.ee/RXrzi1G",
  miniBadgeText: "🎁 โครงการติวฟรี! คลิกดูสิทธิ์",
  studentUploadEnabled: true,
  studentUploadRequired: false,
  studentUploadLabel: "แนบรูปภาพหลักฐาน เช่น ภาพแชร์โพสต์กิจกรรม / บัตรนักเรียน / ผลการเรียน",
  studentUploadHelp: "รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 10MB",
  subjects: [
    { id: "camp-subj-m4-math", name: "คณิตศาสตร์ ม.4", time: "10.30 - 12.00 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่แม็ค", enabled: true },
    { id: "camp-subj-m4-chem", name: "เคมี ม.4", time: "13.00 - 14.30 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่นนท์", enabled: true },
    { id: "camp-subj-m4-phys", name: "ฟิสิกส์ ม.4", time: "14.45 - 16.10 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่อู๋", enabled: true },
    { id: "camp-subj-m5-chem", name: "เคมี ม.5", time: "10.30 - 12.00 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่นนท์", enabled: true },
    { id: "camp-subj-m5-phys", name: "ฟิสิกส์ ม.5", time: "13.00 - 14.30 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่อู๋", enabled: true },
    { id: "camp-subj-m5-math", name: "คณิตศาสตร์ ม.5", time: "14.45 - 16.10 น.", date: "วันเสาร์ที่ 31 ต.ค. 2569", detail: "ติวสด Onsite & Online โดย พี่แม็ค", enabled: true }
  ],
  customQuestions: []
};

// Default Enrollment Modal Text Configuration (สามารถปรับแก้ได้จากระบบหลังบ้าน)
const DEFAULT_ENROLLMENT_CONFIG = {
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
  doneBtnText: 'เสร็จสิ้น / ปิดหน้าต่าง',
  formQuestions: {
    fields: {
      studentName: { label: 'ชื่อ - นามสกุลจริง นักเรียน', placeholder: 'เช่น ด.ช. ธนภัทร ใจดี', required: true, enabled: true },
      nickname: { label: 'ชื่อเล่น', placeholder: 'เช่น น้องกาย หรือ น้องพรีม', required: true, enabled: true },
      grade: { label: 'ระดับชั้นปัจจุบัน / ที่กำลังจะขึ้น', placeholder: 'เช่น ป.5 หรือ ป.6 หรือ ม.1', required: true, enabled: true },
      school: { label: 'โรงเรียนปัจจุบัน', placeholder: 'เช่น โรงเรียนอนุบาลเชียงใหม่', required: true, enabled: true },
      parentPhone: { label: 'เบอร์โทรศัพท์ผู้ปกครอง', placeholder: 'เช่น 089-123-4567', required: true, enabled: true },
      lineId: { label: 'LINE ID (ผู้ปกครองหรือน้อง)', placeholder: 'เช่น newgen_student หรือ เบอร์โทรไลน์', required: true, enabled: true },
      studentPhone: { label: 'เบอร์โทรศัพท์นักเรียน (ถ้ามี)', placeholder: 'เช่น 095-xxx-xxxx (ไม่บังคับ)', required: false, enabled: true },
      shippingAddress: { label: 'ที่อยู่จัดส่งเอกสารและหนังสือเรียน', placeholder: 'บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์', required: false, enabled: true },
      notes: { label: 'หมายเหตุ / คำถามเพิ่มเติมถึงติวเตอร์ (ถ้ามี)', placeholder: 'เช่น พื้นฐานวิชาคณิตศาสตร์ยังไม่คล่อง หรือต้องการเน้นเรื่องใดเป็นพิเศษ', required: false, enabled: true }
    },
    customQuestions: []
  }
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
  enrollmentConfig: 'newgen_enrollment_config',
  popupCampaign: 'newgen_popup_campaign',
  bundles: 'newgen_bundles'
};

// Global Store Helper with Integrated Supabase Cloud Sync
const NewGenDB = {
  // Cloud Sync Helpers
  saveToSupabase: async (key, data) => {
    try {
      if (!NewGenAuth.getSession()) {
        return { success: false, status: 401, error: 'ต้องเข้าสู่ระบบแอดมินก่อนบันทึกข้อมูล' };
      }
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/app_data?on_conflict=key`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getSupabaseHeaders({
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }),
        body: JSON.stringify({ key, data, updated_at: new Date().toISOString() })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Supabase] Cloud save error for [${key}] (HTTP ${res.status}):`, errorText);
        let reason = errorText;
        if (errorText.includes('row-level security') || res.status === 401 || res.status === 403) {
          reason = 'ไม่มีสิทธิ์บันทึก (กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่)';
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
      // ดึงเฉพาะข้อมูลหน้าเว็บ (ไม่ดึงรายชื่อนักเรียน/ข้อมูลระบบ)
      const publicKeys = Object.keys(SUPABASE_KEY_MAPPING).join(',');
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/app_data?select=key,data&key=in.(${publicKeys})`;
      const res = await fetch(endpoint, { headers: await getSupabaseHeaders() });
      if (!res.ok) return false;
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return false;

      // แอดมินที่ล็อกอินอยู่: โหลดรายชื่อผู้สมัครจากตาราง enrollments (สาธารณะอ่านไม่ได้)
      if (NewGenAuth.getSession()) {
        await NewGenDB.fetchEnrollments();
      }

      rows.forEach(item => {
        const key = item.key;
        const val = item.data;
        if (!key || val === undefined || !SUPABASE_KEY_MAPPING[key]) return;
        const localKey = SUPABASE_KEY_MAPPING[key];
        if (localKey) {
          try {
            localStorage.setItem(localKey, JSON.stringify(val));
          } catch (e) {}
        }
        if (key === 'courses' && typeof window !== 'undefined') {
          window.courseData = val;
          window._supabaseCoursesSynced = true;
        }
        if (key === 'tutors' && typeof window !== 'undefined') {
          const normalized = Array.isArray(val) ? val.map(t => ({
            ...t,
            type: (t.type === 'online') ? 'online' : 'onsite'
          })) : val;
          window.tutorsData = normalized;
          window._supabaseTutorsSynced = true;
        }
        if (key === 'tutorsQuote' && typeof window !== 'undefined') window.tutorsQuoteData = val;
        if (key === 'reviews' && typeof window !== 'undefined') {
          window.reviewsData = val;
          window._supabaseReviewsSynced = true;
        }
        if (key === 'achievements' && typeof window !== 'undefined') {
          window.achievementsData = val;
          window._supabaseAchievementsSynced = true;
        }
        if (key === 'videos' && typeof window !== 'undefined') {
          window.videosData = val;
          window._supabaseVideosSynced = true;
        }
        if (key === 'contact' && typeof window !== 'undefined') window.contactData = val;
        if (key === 'whyus' && typeof window !== 'undefined') window.whyUsData = val;
        if (key === 'categories' && typeof window !== 'undefined') window.categoriesData = val;
        if (key === 'privilege' && typeof window !== 'undefined') window.privilegeData = val;
        if (key === 'home' && typeof window !== 'undefined') {
          window.homeData = val;
          window._supabaseHomeSynced = true;
        }
        if (key === 'about' && typeof window !== 'undefined') {
          window.aboutData = val;
          window._supabaseAboutSynced = true;
        }
        if (key === 'enrollmentConfig' && typeof window !== 'undefined') {
          window.enrollmentConfigData = val;
          if (typeof window.applyEnrollmentConfig === 'function') window.applyEnrollmentConfig();
          if (typeof window.loadAdminEnrollmentConfig === 'function') window.loadAdminEnrollmentConfig();
        }
        if (key === 'popupCampaign' && typeof window !== 'undefined') {
          window.popupCampaignData = val;
          if (typeof window.renderHomePopupCampaign === 'function') window.renderHomePopupCampaign();
          if (typeof window.loadAdminPopupCampaign === 'function') window.loadAdminPopupCampaign();
        }
        if (key === 'bundles' && typeof window !== 'undefined') {
          window.bundlesData = val;
          if (typeof window.renderBundlesOnPage === 'function') window.renderBundlesOnPage();
          if (typeof window.loadAdminBundles === 'function') window.loadAdminBundles();
        }
      });

      // Update UI components across all active pages
      if (typeof renderFooterContactInfo === 'function') renderFooterContactInfo();
      if (typeof renderPrivilegeNote === 'function') renderPrivilegeNote();
      if (typeof window !== 'undefined') {
        if (typeof window.renderHeroContent === 'function') window.renderHeroContent();
        if (typeof window.renderHomeFeaturedVideo === 'function') window.renderHomeFeaturedVideo();
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
        if (typeof window.renderHomePopupCampaign === 'function') window.renderHomePopupCampaign();
        if (typeof window.loadAdminPopupCampaign === 'function') window.loadAdminPopupCampaign();
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

  // รูปภาพของเว็บไซต์ (แอดมินเท่านั้น) → bucket สาธารณะ "uploads"
  uploadImageToSupabase: async (blob, filename) => {
    try {
      const ext = String(filename || 'image.jpg').split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
      const safeName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucket}/${safeName}`, {
        method: 'POST',
        headers: await getSupabaseHeaders({ 'Content-Type': blob.type || 'image/jpeg' }),
        body: blob
      });
      if (res.ok) {
        return `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${safeName}`;
      }
    } catch (err) {
      console.warn('[Supabase] Storage upload error:', err);
    }
    return null;
  },

  // รูปที่นักเรียนแนบตอนสมัคร → bucket ส่วนตัว "student-uploads" (อัปโหลดได้ แต่เปิดดูได้เฉพาะแอดมิน)
  // คืนค่าเป็น "private:student-uploads/<ชื่อไฟล์>" ไม่ใช่ลิงก์สาธารณะ
  uploadStudentImage: async (blob, filename) => {
    try {
      const ext = String(filename || 'image.jpg').split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
      const rand = (window.crypto && crypto.getRandomValues)
        ? Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('')
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const safeName = `student-${Date.now()}-${rand}.${ext}`;
      const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.studentBucket}/${safeName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': blob.type || 'image/jpeg'
        },
        body: blob
      });
      if (res.ok) return `private:${SUPABASE_CONFIG.studentBucket}/${safeName}`;
      console.warn('[Supabase] Student image upload failed:', res.status, await res.text().catch(() => ''));
    } catch (err) {
      console.warn('[Supabase] Student image upload error:', err);
    }
    return null;
  },

  // แปลงรูปที่นักเรียนแนบเป็นลิงก์ที่เปิดดูได้ (รูปส่วนตัว = ลิงก์ชั่วคราว 1 ชั่วโมง สำหรับแอดมิน)
  getStudentImageUrl: async (ref) => {
    if (!ref) return '';
    const m = String(ref).match(/^private:([a-z0-9-]+)\/(.+)$/i);
    if (!m) return resolveMediaUrl(ref);
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/sign/${m[1]}/${m[2]}`, {
        method: 'POST',
        headers: await getSupabaseHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresIn: 3600 })
      });
      if (!res.ok) return '';
      const json = await res.json();
      const signed = json.signedURL || json.signedUrl || '';
      return signed ? `${SUPABASE_CONFIG.url}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}` : '';
    } catch (e) {
      return '';
    }
  },

  // Courses
  getCourses: () => {
    const enrichCourse = (c) => ({
      ...c,
      isFeatured: c.isFeatured !== undefined ? c.isFeatured : true,
      galleryImages: Array.isArray(c.galleryImages) ? c.galleryImages : [],
      targetAudience: c.targetAudience !== undefined ? c.targetAudience : '',
      benefits: c.benefits !== undefined ? c.benefits : '',
      subjectBreakdown: Array.isArray(c.subjectBreakdown) ? c.subjectBreakdown : [],
      monthlyPrice: c.monthlyPrice !== undefined ? c.monthlyPrice : '1,500 บาท / เดือน (20 ชม.)',
      location: c.location !== undefined ? c.location : 'สถาบัน The NEW GEN (เรียนสด Onsite)',
      classSize: c.classSize !== undefined ? c.classSize : 'กลุ่มเล็ก ดูแลใกล้ชิด ถามได้ทันที',
      materials: c.materials !== undefined ? c.materials : 'ฟรี! หนังสือและแนวข้อสอบเก็งพิเศษ',
      trustGuarantee: c.trustGuarantee !== undefined ? c.trustGuarantee : 'การันตีการสอนโดยทีมติวเตอร์ The NEW GEN',
      customSections: Array.isArray(c.customSections) ? c.customSections : [],
      parentFaq: Array.isArray(c.parentFaq) ? c.parentFaq : [],
      remainingSeats: (c.remainingSeats !== undefined && c.remainingSeats !== null && c.remainingSeats !== '') ? Number(c.remainingSeats) : null,
      isFull: c.isFull === true,
      registerUrl: c.registerUrl || ''
    });

    if (typeof window !== 'undefined' && Array.isArray(window.courseData) && window.courseData.length > 0) {
      return window.courseData.map(enrichCourse);
    }
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
    // หลังบันทึกคอร์ส ให้ Supabase คำนวณที่นั่งของทุกรอบใหม่ (ตัวเลขที่นั่งเป็นของฝั่งฐานข้อมูล)
    return NewGenDB.saveToSupabase('courses', courses).then(r => { if (r && r.success) NewGenDB.refreshSeatsSoon(true); return r; });
  },

  // คำนวณที่นั่งใหม่ (แอดมิน) แล้วดึงข้อมูลล่าสุดกลับมา — รวมหลายคำขอติดกันเป็นครั้งเดียว
  _seatRefreshTimer: null,
  _seatRefreshRecompute: false,
  refreshSeatsSoon: (recompute) => {
    NewGenDB._seatRefreshRecompute = NewGenDB._seatRefreshRecompute || recompute;
    clearTimeout(NewGenDB._seatRefreshTimer);
    NewGenDB._seatRefreshTimer = setTimeout(async () => {
      const doRecompute = NewGenDB._seatRefreshRecompute;
      NewGenDB._seatRefreshRecompute = false;
      if (!NewGenAuth.getSession()) return;
      try {
        if (doRecompute) {
          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/admin_recompute_seats`, {
            method: 'POST',
            headers: await getSupabaseHeaders({ 'Content-Type': 'application/json' }),
            body: '{}'
          });
        }
        await NewGenDB.syncFromSupabase();
      } catch (e) {
        console.warn('[Supabase] seat refresh failed:', e);
      }
    }, 700);
  },

  // Tutors (แบ่ง 2 ทีม: Onsite ประจำสถาบัน & สอน Online)
  getTutors: () => {
    let list = null;
    if (typeof window !== 'undefined' && Array.isArray(window.tutorsData) && (window.tutorsData.length > 0 || window._supabaseTutorsSynced)) {
      list = window.tutorsData;
    } else {
      try {
        const data = localStorage.getItem('newgen_tutors');
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
      } catch (e) {}
    }
    if (!list) list = DEFAULT_TUTORS;
    return list.map(t => ({
      ...t,
      type: (t.type === 'online') ? 'online' : 'onsite'
    }));
  },
  getOnsiteTutors: () => {
    return NewGenDB.getTutors().filter(t => (t.type || 'onsite') === 'onsite');
  },
  getOnlineTutors: () => {
    return NewGenDB.getTutors().filter(t => t.type === 'online');
  },
  saveTutors: (tutors) => {
    const normalized = Array.isArray(tutors) ? tutors.map(t => ({
      ...t,
      type: (t.type === 'online') ? 'online' : 'onsite'
    })) : tutors;
    try {
      localStorage.setItem('newgen_tutors', JSON.stringify(normalized));
    } catch(e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.tutorsData = normalized;
    return NewGenDB.saveToSupabase('tutors', normalized);
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
    let list = null;
    // หลังซิงค์จาก Cloud แล้ว รายการว่าง = แอดมินลบหมดจริง (ไม่ใช้ข้อมูลตัวอย่างแทน)
    if (typeof window !== 'undefined' && Array.isArray(window.reviewsData) && (window.reviewsData.length > 0 || window._supabaseReviewsSynced)) {
      list = window.reviewsData;
    } else {
      try {
        const data = localStorage.getItem('newgen_reviews');
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
      } catch (e) {}
    }
    if (!list) list = DEFAULT_REVIEWS;
    return list.map(r => ({
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
    if (typeof window !== 'undefined' && Array.isArray(window.achievementsData) && window.achievementsData.length > 0) {
      return window.achievementsData;
    }
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
    if (typeof window !== 'undefined' && Array.isArray(window.videosData) && (window.videosData.length > 0 || window._supabaseVideosSynced)) {
      return window.videosData;
    }
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
    let c = null;
    if (typeof window !== 'undefined' && window.contactData && window.contactData.address) {
      c = { ...window.contactData };
    } else {
      try {
        const data = localStorage.getItem('newgen_contact');
        if (data) c = JSON.parse(data);
      } catch (e) {}
    }
    if (c) {
      if (!c.address || c.address.includes('เรียนสด Onsite ห้องแอร์')) {
        c.address = DEFAULT_CONTACT.address;
        c.mapAppUrl = DEFAULT_CONTACT.mapAppUrl;
      }
      if (!c.mapAppUrl) c.mapAppUrl = DEFAULT_CONTACT.mapAppUrl;
      if (!c.footerDesc) c.footerDesc = DEFAULT_CONTACT.footerDesc;
      return c;
    }
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
    if (typeof window !== 'undefined' && window.whyUsData && window.whyUsData.title) {
      return window.whyUsData;
    }
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
    if (typeof window !== 'undefined' && Array.isArray(window.categoriesData) && window.categoriesData.length > 0) {
      return window.categoriesData;
    }
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
    if (typeof window !== 'undefined' && window.privilegeData && window.privilegeData.text) {
      return window.privilegeData;
    }
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
    if (typeof window !== 'undefined' && window.homeData && (window.homeData.heroTitle || window.homeData.heroTutorCenterId)) {
      return { ...DEFAULT_HOME, ...window.homeData };
    }
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
    if (typeof window !== 'undefined' && window.aboutData && (window.aboutData.title || window.aboutData.mainImage)) {
      return { ...DEFAULT_ABOUT, ...window.aboutData };
    }
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

  // Popup Campaign (แคมเปญโครงการติวฟรีหน้าแรก)
  getPopupCampaign: () => {
    try {
      const data = localStorage.getItem('newgen_popup_campaign');
      if (data) return { ...DEFAULT_POPUP_CAMPAIGN, ...JSON.parse(data) };
    } catch (e) {}
    return (typeof window !== 'undefined' && window.popupCampaignData) ? { ...DEFAULT_POPUP_CAMPAIGN, ...window.popupCampaignData } : DEFAULT_POPUP_CAMPAIGN;
  },
  savePopupCampaign: (popupObj) => {
    try {
      localStorage.setItem('newgen_popup_campaign', JSON.stringify(popupObj));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.popupCampaignData = popupObj;
    try {
      const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      fetch(`${base}/api/popup-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popupObj)
      }).catch(() => {});
    } catch (err) {}
    return NewGenDB.saveToSupabase('popupCampaign', popupObj).then(r => { if (r && r.success) NewGenDB.refreshSeatsSoon(true); return r; });
  },

  // Bundles (แพ็คเกจคอร์สเรียนโปรโมชั่น)
  getBundles: () => {
    try {
      const data = localStorage.getItem('newgen_bundles');
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && Array.isArray(window.bundlesData)) {
      return window.bundlesData;
    }
    const initial = (typeof DEFAULT_BUNDLES !== 'undefined' && Array.isArray(DEFAULT_BUNDLES))
      ? JSON.parse(JSON.stringify(DEFAULT_BUNDLES))
      : [];
    try {
      localStorage.setItem('newgen_bundles', JSON.stringify(initial));
    } catch (e) {}
    return initial;
  },
  saveBundles: (bundles) => {
    try {
      localStorage.setItem('newgen_bundles', JSON.stringify(bundles));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') window.bundlesData = bundles;
    try {
      const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      fetch(`${base || ''}/api/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundles)
      }).catch(() => {});
    } catch (err) {}
    return NewGenDB.saveToSupabase('bundles', bundles);
  },
  saveBundle: async (bundle) => {
    const list = NewGenDB.getBundles();
    const idx = list.findIndex(b => b.id === bundle.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...bundle, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...bundle, createdAt: new Date().toISOString() });
    }
    const res = await NewGenDB.saveBundles(list);
    return res || { success: true, list };
  },
  deleteBundle: async (bundleId) => {
    let list = NewGenDB.getBundles();
    list = list.filter(b => b.id !== bundleId);
    const res = await NewGenDB.saveBundles(list);
    try {
      const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      fetch(`${base || ''}/api/bundles/${encodeURIComponent(bundleId)}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
    return res || { success: true, list };
  },

  // Enrollments (ระบบรายชื่อผู้สมัครเรียน)
  // ข้อมูลอยู่ในตาราง "enrollments" ของ Supabase: แอดมินอ่าน/แก้ได้, สาธารณะส่งใบสมัครได้อย่างเดียว (submitEnrollments)
  // เก็บไว้ในหน่วยความจำเท่านั้น ไม่บันทึกข้อมูลส่วนบุคคลลง localStorage
  getEnrollments: () => {
    return (typeof window !== 'undefined' && Array.isArray(window.enrollmentsData)) ? window.enrollmentsData : [];
  },
  fetchEnrollments: async () => {
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/enrollments?select=id,data&order=created_at.desc`, {
        headers: await getSupabaseHeaders()
      });
      if (!res.ok) return false;
      const rows = await res.json();
      if (!Array.isArray(rows)) return false;
      window.enrollmentsData = rows.map(r => ({ ...(r.data || {}), id: r.id }));
      return true;
    } catch (e) {
      console.warn('[Supabase] Fetch enrollments error:', e);
      return false;
    }
  },
  _upsertEnrollmentRows: async (list) => {
    if (!NewGenAuth.getSession()) return { success: false, error: 'ต้องเข้าสู่ระบบแอดมินก่อนบันทึกข้อมูล' };
    try {
      const now = new Date().toISOString();
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/enrollments?on_conflict=id`, {
        method: 'POST',
        headers: await getSupabaseHeaders({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
        body: JSON.stringify(list.map(e => ({
          id: e.id,
          course_id: e.courseId || null,
          data: e,
          created_at: e.createdAt || now,
          updated_at: now
        })))
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('[Supabase] Save enrollment error:', res.status, text);
        return { success: false, status: res.status, error: res.status === 401 || res.status === 403 ? 'ไม่มีสิทธิ์บันทึก (กรุณาเข้าสู่ระบบใหม่)' : text };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  // ใช้ตอนกู้คืนข้อมูลจากไฟล์สำรอง (แอดมิน): เพิ่ม/อัปเดตรายการในไฟล์ ไม่ลบรายการที่มีอยู่
  saveEnrollments: async (enrollments) => {
    const list = (Array.isArray(enrollments) ? enrollments : []).filter(e => e && e.id);
    if (list.length === 0) return { success: true };
    const res = await NewGenDB._upsertEnrollmentRows(list);
    if (res.success) await NewGenDB.fetchEnrollments();
    return res;
  },
  // ส่งใบสมัครจากหน้าเว็บ (สาธารณะ) — ใบหลัก + ใบย่อยของแพ็คเกจ ส่งในครั้งเดียว
  submitEnrollments: async (items) => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/submit_enrollment`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`submit_enrollment failed (HTTP ${res.status}) ${text}`);
    }
    return res.json();
  },
  saveEnrollment: (enrollment) => {
    const list = NewGenDB.getEnrollments();
    if (!enrollment.id) enrollment.id = `enr-${Date.now()}`;
    if (!enrollment.createdAt) enrollment.createdAt = new Date().toISOString();
    const idx = list.findIndex(e => e.id === enrollment.id);
    const merged = idx !== -1 ? { ...list[idx], ...enrollment } : enrollment;
    if (idx !== -1) list[idx] = merged;
    else list.unshift(merged);
    if (typeof window !== 'undefined') window.enrollmentsData = list;
    // ที่นั่งคงเหลือคำนวณใหม่ใน Supabase อัตโนมัติ (trigger) แล้วดึงตัวเลขล่าสุดกลับมา
    const savePromise = NewGenDB._upsertEnrollmentRows([merged]).then(r => { NewGenDB.refreshSeatsSoon(false); return r; });
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('newgen:synced'));
    }
    return savePromise;
  },
  deleteEnrollment: (id) => {
    let list = NewGenDB.getEnrollments();
    list = list.filter(e => e.id !== id);
    if (typeof window !== 'undefined') window.enrollmentsData = list;
    const savePromise = (async () => {
      if (!NewGenAuth.getSession()) return { success: false, error: 'ต้องเข้าสู่ระบบแอดมินก่อน' };
      try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/enrollments?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: await getSupabaseHeaders()
        });
        return res.ok ? { success: true } : { success: false, status: res.status, error: await res.text() };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })().then(r => { NewGenDB.refreshSeatsSoon(false); return r; });
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('newgen:synced'));
    }
    return savePromise;
  },
  // ---------- ล้างข้อมูล (แอดมินเท่านั้น — สิทธิ์ตรวจด้วย RLS ฝั่ง Supabase) ----------
  _pgInList: (values) => `(${values.map(v => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')})`,

  // ลบใบสมัครหลายรายการ (ทีละ 50) — คืนจำนวนที่ลบสำเร็จจริงจาก Supabase
  deleteEnrollmentsByIds: async (ids) => {
    let deleted = 0;
    const errors = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/enrollments?select=id&id=in.${encodeURIComponent(NewGenDB._pgInList(chunk))}`, {
          method: 'DELETE',
          headers: await getSupabaseHeaders({ 'Prefer': 'return=representation' })
        });
        if (res.ok) deleted += (await res.json()).length;
        else errors.push(`HTTP ${res.status} ${await res.text()}`);
      } catch (err) {
        errors.push(err.message);
      }
    }
    const gone = new Set(ids);
    window.enrollmentsData = NewGenDB.getEnrollments().filter(e => !gone.has(e.id));
    return { deleted, errors };
  },

  // รายชื่อไฟล์ใน storage bucket (ระดับบนสุด)
  listStorageFiles: async (bucket) => {
    const files = [];
    for (let offset = 0; offset < 20000; offset += 1000) {
      const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: await getSupabaseHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefix: '', limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
      });
      if (!res.ok) throw new Error(`list ${bucket} failed (HTTP ${res.status})`);
      const page = await res.json();
      files.push(...page.filter(f => f && f.id && f.name));
      if (page.length < 1000) break;
    }
    return files;
  },

  // ลบไฟล์ใน storage (ทีละ 100)
  deleteStorageFiles: async (bucket, paths) => {
    let deleted = 0;
    const errors = [];
    for (let i = 0; i < paths.length; i += 100) {
      try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: await getSupabaseHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ prefixes: paths.slice(i, i + 100) })
        });
        if (res.ok) deleted += (await res.json()).length;
        else errors.push(`HTTP ${res.status} ${await res.text()}`);
      } catch (err) {
        errors.push(err.message);
      }
    }
    return { deleted, errors };
  },

  // ทุกแถวใน app_data (แอดมินเห็นทุกแถว รวมแถวที่หน้าเว็บไม่ได้ใช้)
  fetchAllAppDataRows: async () => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/app_data?select=key,data,updated_at`, { headers: await getSupabaseHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  deleteAppDataKeys: async (keys) => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/app_data?select=key&key=in.${encodeURIComponent(NewGenDB._pgInList(keys))}`, {
      method: 'DELETE',
      headers: await getSupabaseHeaders({ 'Prefer': 'return=representation' })
    });
    if (!res.ok) return { deleted: 0, errors: [`HTTP ${res.status} ${await res.text()}`] };
    return { deleted: (await res.json()).length, errors: [] };
  },

  getEnrollmentsByCourse: (courseId) => {
    const list = NewGenDB.getEnrollments();
    return list.filter(e => e.courseId === courseId);
  },

  // Enrollment Config (ระบบตั้งค่าข้อความหน้าสมัครเรียน)
  getEnrollmentConfig: () => {
    const mergeWithDefault = (parsed) => {
      if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_ENROLLMENT_CONFIG };
      const formQ = {
        fields: {
          ...DEFAULT_ENROLLMENT_CONFIG.formQuestions.fields,
          ...(parsed.formQuestions?.fields || {})
        },
        customQuestions: Array.isArray(parsed.formQuestions?.customQuestions)
          ? parsed.formQuestions.customQuestions
          : []
      };
      return {
        ...DEFAULT_ENROLLMENT_CONFIG,
        ...parsed,
        formQuestions: formQ
      };
    };

    try {
      const data = localStorage.getItem('newgen_enrollment_config');
      if (data) {
        const parsed = JSON.parse(data);
        return mergeWithDefault(parsed);
      }
    } catch (e) {}
    return (typeof window !== 'undefined' && window.enrollmentConfigData)
      ? mergeWithDefault(window.enrollmentConfigData)
      : { ...DEFAULT_ENROLLMENT_CONFIG };
  },
  saveEnrollmentConfig: (config) => {
    const merged = { ...DEFAULT_ENROLLMENT_CONFIG, ...config };
    try {
      localStorage.setItem('newgen_enrollment_config', JSON.stringify(merged));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    if (typeof window !== 'undefined') {
      window.enrollmentConfigData = merged;
      if (typeof window.applyEnrollmentConfig === 'function') window.applyEnrollmentConfig();
    }
    try {
      const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      if (base) {
        fetch(`${base}/api/enrollment-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged)
        }).catch(() => {});
      }
    } catch (err) {}
    return NewGenDB.saveToSupabase('enrollmentConfig', merged);
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
 * Dynamic course seat calculation helper
 */
function getCourseEffectiveSeats(c) {
  if (!c) return { maxSeats: 12, enrolledCount: 0, remainingSeats: 12, isFull: false };
  const enrollments = window.NewGenDB ? window.NewGenDB.getEnrollmentsByCourse(c.id) : [];
  const enrolledCount = enrollments.length;
  const maxSeats = (c.maxSeats !== undefined && c.maxSeats !== null && c.maxSeats !== '') ? Number(c.maxSeats) : 12;
  const remainingSeats = (c.remainingSeats !== undefined && c.remainingSeats !== null && c.remainingSeats !== '')
    ? Number(c.remainingSeats)
    : Math.max(0, maxSeats - enrolledCount);
  // โหมด "เปิดรับเฉพาะออนไลน์ (ออนไซต์เต็มแล้ว)": ยังสมัครได้ (เฉพาะออนไลน์) แม้ที่นั่งออนไซต์จะหมด — ยกเว้นแอดมินกดปิดรับสมัคร
  const onlineOnly = c.onlineOnly === true && c.forceClosed !== true;
  const isFull = !onlineOnly && ((c.isFull === true) || (remainingSeats <= 0));
  return { maxSeats, enrolledCount, remainingSeats, isFull, onlineOnly };
}
if (typeof window !== 'undefined') {
  window.getCourseEffectiveSeats = getCourseEffectiveSeats;
}

/**
 * สถานะที่นั่งของรอบเรียน 1 รอบ (หรือวิชาติวฟรี 1 วิชา)
 * capacity / remaining / isFull ถูกคำนวณโดย Supabase; รองรับรอบเก่าที่พิมพ์ "เต็มแล้ว" / "ปิดรับ" ไว้ในข้อความ
 */
function getRoundSeatInfo(s) {
  if (!s) return { capacity: null, remaining: null, isFull: false, closed: false };
  const legacyClosed = String(s.time || '').includes('เต็มแล้ว') || String(s.dates || '').includes('ปิดรับ');
  const closed = s.closed === true || s.active === false || s.enabled === false || legacyClosed;
  const capacity = Number(s.capacity) > 0 ? Number(s.capacity) : null;
  const remaining = capacity === null ? null : (typeof s.remaining === 'number' ? s.remaining : capacity);
  return { capacity, remaining, closed, isFull: closed || s.isFull === true || (capacity !== null && remaining <= 0) };
}
if (typeof window !== 'undefined') {
  window.getRoundSeatInfo = getRoundSeatInfo;
}

/**
 * ตรวจสอบว่าแพ็คเกจมีคอร์สย่อยใดที่นั่งเต็มหรือไม่
 * หากมีคอร์สใดในแพ็คเกจเต็ม จะถือว่าแพ็คเกจนั้นเต็มและไม่สามารถสมัครได้
 */
function isBundleFull(bundle, allCourses = null) {
  if (!bundle) return { isFull: false, fullCourses: [], fullCount: 0 };
  if (!allCourses) {
    allCourses = window.NewGenDB ? window.NewGenDB.getCourses() : (window.courseData || []);
  }
  const childIds = Array.isArray(bundle.courseIds) ? bundle.courseIds : [];
  if (childIds.length === 0) return { isFull: false, fullCourses: [], fullCount: 0 };

  const fullCourses = [];
  childIds.forEach(cid => {
    const c = allCourses.find(item => item.id === cid);
    if (c) {
      const eff = (typeof getCourseEffectiveSeats === 'function')
        ? getCourseEffectiveSeats(c)
        : (window.getCourseEffectiveSeats ? window.getCourseEffectiveSeats(c) : { isFull: c.isFull === true || (c.remainingSeats !== null && Number(c.remainingSeats) <= 0) });
      // คอร์สที่ "เปิดรับเฉพาะออนไลน์" ยังสมัครได้ (บังคับเรียนออนไลน์ในฟอร์ม) จึงไม่ทำให้แพ็คเกจเต็ม
      if (!eff.onlineOnly && (eff.isFull || (eff.remainingSeats !== undefined && eff.remainingSeats !== null && eff.remainingSeats <= 0))) {
        fullCourses.push(c);
      }
    }
  });

  return {
    isFull: fullCourses.length > 0,
    fullCourses: fullCourses,
    fullCount: fullCourses.length
  };
}
if (typeof window !== 'undefined') {
  window.isBundleFull = isBundleFull;
}

/**
 * คำนวณสถานะคอร์สแบบอัตโนมัติ:
 * - ที่นั่งเต็ม (remainingSeats <= 0 หรือ isFull) -> "🛑 เต็มแล้ว"
 * - โควตาใกล้เต็ม (เหลือ 1 - 5 ที่นั่ง หรือเหลือ <= 30%) -> "🔥 โควตาใกล้เต็ม" อัตโนมัติ
 * - คอร์สใหม่ล่าสุด -> "✨ คอร์สใหม่ล่าสุด" (badge-gold)
 * - ปกติ -> "เปิดรับสมัคร" (badge-emerald)
 */
function getCourseEffectiveStatus(c) {
  if (!c) return { text: 'เปิดรับสมัคร', badgeClass: 'badge-emerald', isNearFull: false, isFull: false };
  const eff = getCourseEffectiveSeats(c);
  if (eff.onlineOnly) {
    return { text: '💻 เหลือเฉพาะออนไลน์', badgeClass: 'badge-seat-online', isNearFull: false, isFull: false, onlineOnly: true };
  }
  if (eff.isFull || eff.remainingSeats <= 0) {
    return { text: '🛑 เต็มแล้ว', badgeClass: 'badge-red', isNearFull: false, isFull: true };
  }
  const rem = eff.remainingSeats;
  const max = eff.maxSeats || 12;
  const isNearFull = rem <= 5 || (max > 0 && (rem / max) <= 0.3);

  if (isNearFull) {
    return { text: '🔥 โควตาใกล้เต็ม', badgeClass: 'badge-red', isNearFull: true, isFull: false };
  }

  const rawBadge = c.statusBadge || 'เปิดรับสมัคร';
  if (rawBadge.includes('ใหม่')) {
    return { text: '✨ คอร์สใหม่ล่าสุด', badgeClass: 'badge-gold', isNearFull: false, isFull: false };
  }

  return { text: rawBadge, badgeClass: c.statusClass || 'badge-emerald', isNearFull: false, isFull: false };
}
if (typeof window !== 'undefined') {
  window.getCourseEffectiveStatus = getCourseEffectiveStatus;
}

/**
 * Helper to generate the dynamic seat availability badge
 * - isFull -> "🛑 ที่นั่งเต็มแล้ว"
 * - remainingSeats <= 5 หรือ <= 30% -> "🔥 ใกล้เต็มแล้ว (เหลือ X ที่นั่ง)"
 * - คอร์สใหม่ล่าสุด -> "✨ คอร์สใหม่ล่าสุด (ว่าง X ที่นั่ง)"
 * - remainingSeats > 5 -> "⚡ ว่าง X ที่นั่ง"
 */
function getCourseSeatBadgeHtml(c) {
  if (!c) return '';
  const eff = getCourseEffectiveSeats(c);
  if (eff.onlineOnly) {
    return `<span class="badge course-badge-status course-seat-cover-badge badge-seat-online"><i class="fa-solid fa-laptop"></i> เหลือเฉพาะออนไลน์</span>`;
  }
  if (eff.isFull || eff.remainingSeats <= 0) {
    return `<span class="badge course-badge-status course-seat-cover-badge badge-seat-full"><i class="fa-solid fa-ban"></i> 🛑 ที่นั่งเต็มแล้ว</span>`;
  }
  const rem = eff.remainingSeats;
  const max = eff.maxSeats || 12;
  const isNearFull = rem <= 5 || (max > 0 && (rem / max) <= 0.3);

  if (isNearFull) {
    return `<span class="badge course-badge-status course-seat-cover-badge badge-seat-urgent"><i class="fa-solid fa-fire fa-beat-fade"></i> 🔥 ใกล้เต็มแล้ว (เหลือ ${rem} ที่นั่ง)</span>`;
  }

  if ((c.statusBadge || '').includes('ใหม่')) {
    return `<span class="badge course-badge-status course-seat-cover-badge badge-gold"><i class="fa-solid fa-sparkles"></i> ✨ คอร์สใหม่ล่าสุด (ว่าง ${rem} ที่นั่ง)</span>`;
  }

  if (rem !== null && rem !== undefined && !isNaN(rem)) {
    return `<span class="badge course-badge-status course-seat-cover-badge badge-seat-available"><i class="fa-solid fa-chair"></i> ⚡ ว่าง ${rem} ที่นั่ง</span>`;
  }

  return `<span class="badge course-badge-status ${c.statusClass || 'badge-emerald'}">${c.statusBadge || 'เปิดรับสมัคร'}</span>`;
}
if (typeof window !== 'undefined') {
  window.getCourseSeatBadgeHtml = getCourseSeatBadgeHtml;
}

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
  // ล้างข้อมูลเก่าที่เวอร์ชันก่อนเคยเก็บไว้ในเบราว์เซอร์ของผู้เยี่ยมชม (รายชื่อนักเรียน / รหัสผ่านแอดมิน)
  try {
    ['newgen_enrollments', 'newgen_admin_cred', 'newgen_admin_auth', 'newgen_admin_user'].forEach(k => localStorage.removeItem(k));
    ['newgen_admin_auth', 'newgen_admin_user'].forEach(k => sessionStorage.removeItem(k));
  } catch (e) {}

  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.NewGenAuth = NewGenAuth;
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
  window.enrollmentsData = NewGenDB.getEnrollments();
  window.enrollmentConfigData = NewGenDB.getEnrollmentConfig();
  window.DEFAULT_ENROLLMENT_CONFIG = DEFAULT_ENROLLMENT_CONFIG;
  window.bundlesData = NewGenDB.getBundles();

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
        <span class="course-price-amount-group">
          <span class="course-price-amount">${pricePromo}</span><span class="course-price-dash">.-</span>
        </span>
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
 * ตัวเลขราคาอย่างเดียว เช่น "12,500 บ" / "12,500 บ." / "12,500 บาท" → "12,500"
 * (ใช้ตอนที่จะต่อท้ายด้วยหน่วย "บาท" เอง จะได้ไม่ซ้ำเป็น "12,500 บ บาท")
 */
function priceNumberText(v) {
  return String(v === undefined || v === null ? '' : v)
    .trim()
    .replace(/\s*(บาท|บ\.?)\s*(\.-|-)?\s*$/u, '')
    .replace(/\s*\.-\s*$/, '')
    .trim();
}

if (typeof window !== 'undefined') {
  window.priceNumberText = priceNumberText;
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

  // 10. Footer Brand Description
  const footerDesc = contact.footerDesc || 'สถาบันกวดวิชา The NEW GEN กวดวิชาของเด็ก GENZ เรียนสนุก ครบทุกเนื้อหา จบที่ The NEW GEN พัฒนาทักษะวิชาการและความมั่นใจสู่อนาคตที่สดใส';
  document.querySelectorAll('p.footer-desc, #footerBrandDesc').forEach(el => {
    el.textContent = footerDesc;
  });
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
  document.addEventListener('newgen:synced', () => {
    renderFooterContactInfo();
    renderPrivilegeNote();
  });
}
