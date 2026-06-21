/* ============================================================
   CASPAA DATA LAYER
   - LocalStorage-backed mock database
   - Seed data simulates a real Lagos school
   ============================================================ */

const DB_KEY = 'caspaa_db_v5';
const SESSION_KEY = 'caspaa_session_v1';

/* ---------- Utility ---------- */
const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const daysAhead = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const NGN = (n) => '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });

/* ---------- Seed Generator ---------- */
function seedDatabase() {
  const schoolId = 'sch_brightlights';

  const classes = [
    { id: 'cls_nur1', schoolId, name: 'Nursery 1', level: 'Nursery', teacherId: 'tch_funke' },
    { id: 'cls_nur2', schoolId, name: 'Nursery 2', level: 'Nursery', teacherId: 'tch_funke' },
    { id: 'cls_pry1', schoolId, name: 'Primary 1', level: 'Primary', teacherId: 'tch_adamu' },
    { id: 'cls_pry2', schoolId, name: 'Primary 2', level: 'Primary', teacherId: 'tch_adamu' },
    { id: 'cls_pry3', schoolId, name: 'Primary 3', level: 'Primary', teacherId: 'tch_chioma' },
    { id: 'cls_jss1', schoolId, name: 'JSS 1', level: 'Secondary', teacherId: 'tch_emeka' },
    { id: 'cls_jss2', schoolId, name: 'JSS 2', level: 'Secondary', teacherId: 'tch_emeka' },
    { id: 'cls_sss1', schoolId, name: 'SSS 1', level: 'Secondary', teacherId: 'tch_bola' },
  ];

  const subjects = [
    { id: 'sub_math', name: 'Mathematics' },
    { id: 'sub_eng',  name: 'English Language' },
    { id: 'sub_sci',  name: 'Basic Science' },
    { id: 'sub_soc',  name: 'Social Studies' },
    { id: 'sub_yor',  name: 'Yoruba' },
    { id: 'sub_civ',  name: 'Civic Education' },
    { id: 'sub_ict',  name: 'Computer Studies' },
    { id: 'sub_crk',  name: 'Christian Religious Knowledge' }
  ];

  const teachers = [
    { id: 'tch_funke',  schoolId, name: 'Mrs. Funke Adeyemi',  email: 'funke@brightlights.ng',  phone: '08012345601', staffType: 'Academic', subjects: ['sub_yor', 'sub_eng'], classes: ['cls_nur1','cls_nur2'], hireDate: '2022-09-01', salary: 180000, role: 'teacher', bank: { name: 'GTBank', account: '0123456701' }, dob: '1990-04-12' },
    { id: 'tch_adamu',  schoolId, name: 'Mr. Adamu Ibrahim',   email: 'adamu@brightlights.ng', phone: '08012345602', staffType: 'Academic', subjects: ['sub_math', 'sub_sci'], classes: ['cls_pry1','cls_pry2','cls_jss1'], hireDate: '2021-09-01', salary: 220000, role: 'teacher', bank: { name: 'Access Bank', account: '0123456702' }, dob: '1985-08-22' },
    { id: 'tch_chioma', schoolId, name: 'Miss Chioma Okeke',   email: 'chioma@brightlights.ng',phone: '08012345603', staffType: 'Academic', subjects: ['sub_eng', 'sub_soc'], classes: ['cls_pry3','cls_jss1'], hireDate: '2023-01-15', salary: 200000, role: 'teacher', bank: { name: 'UBA', account: '0123456703' }, dob: '1992-11-30' },
    { id: 'tch_emeka',  schoolId, name: 'Mr. Emeka Nwosu',     email: 'emeka@brightlights.ng', phone: '08012345604', staffType: 'Academic', subjects: ['sub_sci', 'sub_ict'], classes: ['cls_jss1','cls_jss2'], hireDate: '2020-09-01', salary: 240000, role: 'teacher', bank: { name: 'Zenith', account: '0123456704' }, dob: '1987-03-05' },
    { id: 'tch_bola',   schoolId, name: 'Mrs. Bola Akinwale',  email: 'bola@brightlights.ng',  phone: '08012345605', staffType: 'Academic', subjects: ['sub_civ', 'sub_crk'], classes: ['cls_sss1'], hireDate: '2019-09-01', salary: 260000, role: 'teacher', bank: { name: 'First Bank', account: '0123456705' }, dob: '1980-07-18' },
    // Non-academic staff
    { id: 'stf_bursar', schoolId, name: 'Mr. Olumide Sanya',    email: 'bursar@brightlights.ng', phone: '08012345610', staffType: 'Finance',        role: 'Bursar',           classes: [], subjects: [], hireDate: '2018-01-10', salary: 280000, bank: { name: 'GTBank', account: '0123456710' }, dob: '1976-02-08' },
    { id: 'stf_sec',    schoolId, name: 'Miss Halima Yusuf',    email: 'secretary@brightlights.ng', phone: '08012345611', staffType: 'Administration', role: 'Secretary',       classes: [], subjects: [], hireDate: '2022-03-01', salary: 130000, bank: { name: 'Access',   account: '0123456711' }, dob: '1995-09-21' },
    { id: 'stf_sec2',   schoolId, name: 'Mr. Sola Adebanjo',    email: 'security@brightlights.ng',  phone: '08012345612', staffType: 'Operations',     role: 'Security Guard',  classes: [], subjects: [], hireDate: '2020-06-15', salary: 75000,  bank: { name: 'UBA',      account: '0123456712' }, dob: '1978-10-04' },
    { id: 'stf_it',     schoolId, name: 'Mr. Chuka Eze',        email: 'ict@brightlights.ng',       phone: '08012345613', staffType: 'ICT',            role: 'IT Support',       classes: [], subjects: [], hireDate: '2024-02-12', salary: 180000, bank: { name: 'Kuda',     account: '0123456713' }, dob: '1996-12-29' },
    { id: 'stf_driver',     schoolId, name: 'Mr. Tope Adigun',      email: 'driver@brightlights.ng',    phone: '08012345614', staffType: 'Transport',      role: 'School Bus Driver',     classes: [], subjects: [], hireDate: '2021-09-01', salary: 95000,  bank: { name: 'Opay',       account: '0123456714' }, dob: '1973-05-14' },
    /* ============ More non-academic staff for realism ============ */
    { id: 'stf_nurse',      schoolId, name: 'Mrs. Comfort Eze',     email: 'nurse@brightlights.ng',     phone: '08012345615', staffType: 'Operations',     role: 'School Nurse',           classes: [], subjects: [], hireDate: '2020-09-01', salary: 165000, bank: { name: 'GTBank',     account: '0123456715' }, dob: '1982-04-22' },
    { id: 'stf_librarian',  schoolId, name: 'Mr. Daniel Okoro',     email: 'library@brightlights.ng',   phone: '08012345616', staffType: 'Administration', role: 'Librarian',              classes: [], subjects: [], hireDate: '2023-09-01', salary: 145000, bank: { name: 'UBA',        account: '0123456716' }, dob: '1990-11-08' },
    { id: 'stf_accts',      schoolId, name: 'Mrs. Yetunde Adams',   email: 'accounts@brightlights.ng',  phone: '08012345617', staffType: 'Finance',        role: 'Accounts Clerk',         classes: [], subjects: [], hireDate: '2019-09-01', salary: 175000, bank: { name: 'Zenith',     account: '0123456717' }, dob: '1985-06-30' },
    { id: 'stf_cleaner',    schoolId, name: 'Mrs. Bisi Olaniyan',   email: '',                          phone: '08012345618', staffType: 'Operations',     role: 'Cleaner',                classes: [], subjects: [], hireDate: '2018-09-01', salary: 55000,  bank: { name: 'First Bank', account: '0123456718' }, dob: '1969-03-12' },
    { id: 'stf_maint',      schoolId, name: 'Mr. Sunday Akinwale',  email: 'maintenance@brightlights.ng', phone: '08012345619', staffType: 'Operations',     role: 'Maintenance Officer',    classes: [], subjects: [], hireDate: '2020-01-15', salary: 90000,  bank: { name: 'Sterling',   account: '0123456719' }, dob: '1976-09-25' },
    { id: 'stf_recep',      schoolId, name: 'Miss Sade Adekoya',    email: 'reception@brightlights.ng', phone: '08012345620', staffType: 'Administration', role: 'Receptionist',           classes: [], subjects: [], hireDate: '2022-04-01', salary: 110000, bank: { name: 'Wema',       account: '0123456720' }, dob: '1996-07-14' },
    { id: 'stf_counsl',     schoolId, name: 'Mrs. Adaobi Nnamdi',   email: 'counsellor@brightlights.ng', phone: '08012345621', staffType: 'Administration', role: 'School Counsellor',      classes: [], subjects: [], hireDate: '2021-09-01', salary: 195000, bank: { name: 'Stanbic',    account: '0123456721' }, dob: '1980-10-03' }
  ];

  const parents = [
    { id: 'par_okafor', schoolId, name: 'Mr. Tunde Okafor',    email: 'parent@demo.ng',         phone: '08099999001', occupation: 'Software Engineer', monthlyIncome: 850000, address: '12 Admiralty Way, Lekki' },
    { id: 'par_bello',  schoolId, name: 'Mrs. Aisha Bello',    email: 'aisha.bello@gmail.com',  phone: '08099999002', occupation: 'Doctor', monthlyIncome: 1200000, address: '5 Bourdillon Rd, Ikoyi' },
    { id: 'par_eze',    schoolId, name: 'Mr. Chinedu Eze',     email: 'eze.chinedu@yahoo.com',  phone: '08099999003', occupation: 'Trader', monthlyIncome: 420000, address: '8 Allen Avenue, Ikeja' },
    { id: 'par_musa',   schoolId, name: 'Mrs. Hauwa Musa',     email: 'hauwa.m@outlook.com',    phone: '08099999004', occupation: 'Civil Servant', monthlyIncome: 320000, address: '22 Adeniyi Jones, Ikeja' },
    { id: 'par_lawal',  schoolId, name: 'Mr. Kunle Lawal',     email: 'klawal@gmail.com',       phone: '08099999005', occupation: 'Banker', monthlyIncome: 780000, address: '7 Banana Island' }
  ];

  const students = [
    { id: 'stu_001', schoolId, name: 'Chiamaka Okafor', admissionNo: 'BL/2024/001', classId: 'cls_pry3', dob: '2016-04-12', gender: 'F', parentId: 'par_okafor', photo: null, admissionDate: '2024-09-01', bloodGroup: 'O+', allergies: 'None', status: 'active', houseId: 'house_red' },
    { id: 'stu_002', schoolId, name: 'Tobi Okafor',     admissionNo: 'BL/2024/002', classId: 'cls_jss1', dob: '2013-08-22', gender: 'M', parentId: 'par_okafor', photo: null, admissionDate: '2024-09-01', bloodGroup: 'O+', allergies: 'Penicillin', status: 'active', houseId: 'house_red' },
    { id: 'stu_003', schoolId, name: 'Zainab Bello',    admissionNo: 'BL/2024/003', classId: 'cls_jss2', dob: '2012-02-10', gender: 'F', parentId: 'par_bello',  photo: null, admissionDate: '2023-09-01', bloodGroup: 'A+', allergies: 'None', status: 'active', houseId: 'house_blue' },
    { id: 'stu_004', schoolId, name: 'Yusuf Bello',     admissionNo: 'BL/2024/004', classId: 'cls_pry2', dob: '2017-06-30', gender: 'M', parentId: 'par_bello',  photo: null, admissionDate: '2024-09-01', bloodGroup: 'A+', allergies: 'None', status: 'active', houseId: 'house_blue' },
    { id: 'stu_005', schoolId, name: 'Daniel Eze',      admissionNo: 'BL/2024/005', classId: 'cls_pry1', dob: '2018-11-05', gender: 'M', parentId: 'par_eze',    photo: null, admissionDate: '2024-09-01', bloodGroup: 'B+', allergies: 'None', status: 'active', houseId: 'house_green' },
    { id: 'stu_006', schoolId, name: 'Ngozi Eze',       admissionNo: 'BL/2024/006', classId: 'cls_pry3', dob: '2016-01-18', gender: 'F', parentId: 'par_eze',    photo: null, admissionDate: '2024-09-01', bloodGroup: 'B+', allergies: 'None', status: 'active', houseId: 'house_green' },
    { id: 'stu_007', schoolId, name: 'Ibrahim Musa',    admissionNo: 'BL/2024/007', classId: 'cls_nur2', dob: '2020-03-15', gender: 'M', parentId: 'par_musa',   photo: null, admissionDate: '2024-09-01', bloodGroup: 'AB+', allergies: 'None', status: 'active', houseId: 'house_gold' },
    { id: 'stu_008', schoolId, name: 'Fatima Musa',     admissionNo: 'BL/2024/008', classId: 'cls_sss1', dob: '2009-07-09', gender: 'F', parentId: 'par_musa',   photo: null, admissionDate: '2022-09-01', bloodGroup: 'AB+', allergies: 'Aspirin', status: 'active', houseId: 'house_gold' },
    { id: 'stu_009', schoolId, name: 'Ade Lawal',       admissionNo: 'BL/2024/009', classId: 'cls_jss1', dob: '2013-12-01', gender: 'M', parentId: 'par_lawal',  photo: null, admissionDate: '2023-09-01', bloodGroup: 'O-', allergies: 'None', status: 'active', houseId: 'house_red' },
    { id: 'stu_010', schoolId, name: 'Bisi Lawal',      admissionNo: 'BL/2024/010', classId: 'cls_pry2', dob: '2017-09-25', gender: 'F', parentId: 'par_lawal',  photo: null, admissionDate: '2024-09-01', bloodGroup: 'O-', allergies: 'None', status: 'active', houseId: 'house_blue' },

    /* ============ ALUMNI — past graduating cohorts ============ */
    { id: 'stu_alum1', schoolId, name: 'Olamide Sanusi',     admissionNo: 'BL/2019/044', classId: 'cls_sss1', dob: '2006-03-15', gender: 'M', parentId: 'par_okafor', photo: null, admissionDate: '2014-09-01', bloodGroup: 'O+',  status: 'alumni', graduationYear: 2024, finalClass: 'SSS 3', awards: 'Best in Mathematics · Senior Prefect',                graduatedAt: daysAgo(365) },
    { id: 'stu_alum2', schoolId, name: 'Aisha Lawal',         admissionNo: 'BL/2019/061', classId: 'cls_sss1', dob: '2006-07-22', gender: 'F', parentId: 'par_lawal',  photo: null, admissionDate: '2014-09-01', bloodGroup: 'A+',  status: 'alumni', graduationYear: 2024, finalClass: 'SSS 3', awards: 'Valedictorian · Head Girl · Best in 5 subjects', graduatedAt: daysAgo(365) },
    { id: 'stu_alum3', schoolId, name: 'Chukwudi Eze',        admissionNo: 'BL/2018/029', classId: 'cls_sss1', dob: '2005-11-04', gender: 'M', parentId: 'par_eze',    photo: null, admissionDate: '2013-09-01', bloodGroup: 'B+',  status: 'alumni', graduationYear: 2023, finalClass: 'SSS 3', awards: 'Best in Sciences · Now at University of Lagos',   graduatedAt: daysAgo(730) },
    { id: 'stu_alum4', schoolId, name: 'Nkechi Bello',        admissionNo: 'BL/2018/052', classId: 'cls_sss1', dob: '2005-08-30', gender: 'F', parentId: 'par_bello',  photo: null, admissionDate: '2013-09-01', bloodGroup: 'AB+', status: 'alumni', graduationYear: 2023, finalClass: 'SSS 3', awards: 'Most Improved Student',                            graduatedAt: daysAgo(730) },
    { id: 'stu_alum5', schoolId, name: 'Ibrahim Musa Jr.',    admissionNo: 'BL/2017/077', classId: 'cls_sss1', dob: '2004-12-12', gender: 'M', parentId: 'par_musa',   photo: null, admissionDate: '2012-09-01', bloodGroup: 'AB+', status: 'alumni', graduationYear: 2022, finalClass: 'SSS 3', awards: 'Sportsman of the Year · Football Captain',          graduatedAt: daysAgo(1095) },
    { id: 'stu_alum6', schoolId, name: 'Funke Okafor',        admissionNo: 'BL/2016/098', classId: 'cls_sss1', dob: '2003-04-18', gender: 'F', parentId: 'par_okafor', photo: null, admissionDate: '2011-09-01', bloodGroup: 'O+',  status: 'alumni', graduationYear: 2021, finalClass: 'SSS 3', awards: 'Head Girl · Studying Medicine, UNILAG',                              graduatedAt: daysAgo(1460) },
    { id: 'stu_alum7', schoolId, name: 'Daniel Adekunle',     admissionNo: 'BL/2016/103', classId: 'cls_sss1', dob: '2003-09-09', gender: 'M', parentId: 'par_lawal',  photo: null, admissionDate: '2011-09-01', bloodGroup: 'O-',  status: 'alumni', graduationYear: 2021, finalClass: 'SSS 3', awards: 'Best in Literature',                                graduatedAt: daysAgo(1460) },

    /* ============ Transferred / Withdrawn — historical context ============ */
    { id: 'stu_tr1', schoolId, name: 'Kemi Adeyinka',         admissionNo: 'BL/2024/011', classId: 'cls_pry2', dob: '2017-02-14', gender: 'F', parentId: 'par_musa',   photo: null, admissionDate: '2024-01-15', bloodGroup: 'A+',  status: 'transferred', transferDest: 'Lekki British International School', transferReason: 'Family relocated to Lagos Island', transferredAt: daysAgo(45) },
    { id: 'stu_wd1', schoolId, name: 'Toluwa Adebayo',        admissionNo: 'BL/2023/088', classId: 'cls_jss1', dob: '2012-06-05', gender: 'M', parentId: 'par_bello',  photo: null, admissionDate: '2023-09-01', bloodGroup: 'B+',  status: 'withdrawn',    withdrawReason: 'Non-payment of fees', withdrawNotes: 'Parent relocated overseas',                  withdrawnAt: daysAgo(120) }
  ];

  // Fee structure per class (yearly, NGN)
  const feeStructures = [
    { id: uid('fee'), schoolId, classId: 'cls_nur1', term: '1st Term 2025/26', tuition: 180000, books: 25000, uniform: 18000, pta: 5000, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_nur2', term: '1st Term 2025/26', tuition: 190000, books: 25000, uniform: 18000, pta: 5000, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_pry1', term: '1st Term 2025/26', tuition: 220000, books: 30000, uniform: 20000, pta: 5000, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_pry2', term: '1st Term 2025/26', tuition: 220000, books: 30000, uniform: 20000, pta: 5000, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_pry3', term: '1st Term 2025/26', tuition: 240000, books: 32000, uniform: 20000, pta: 5000, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_jss1', term: '1st Term 2025/26', tuition: 280000, books: 38000, uniform: 22000, pta: 7500, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_jss2', term: '1st Term 2025/26', tuition: 290000, books: 38000, uniform: 22000, pta: 7500, dueDate: daysAhead(15) },
    { id: uid('fee'), schoolId, classId: 'cls_sss1', term: '1st Term 2025/26', tuition: 320000, books: 42000, uniform: 25000, pta: 7500, dueDate: daysAhead(15) }
  ];

  // ============ Extracurricular activities catalog & per-student enrollment ============
  const activities = [
    { id: 'act_001', schoolId, name: 'Swimming', description: 'Twice-weekly pool sessions with certified instructor', price: 25000, icon: '🏊' },
    { id: 'act_002', schoolId, name: 'Ballet / Dance', description: 'Classical ballet and contemporary dance classes', price: 20000, icon: '🩰' },
    { id: 'act_003', schoolId, name: 'Music (Keyboard)', description: 'Keyboard lessons — beginner to intermediate', price: 18000, icon: '🎹' },
    { id: 'act_004', schoolId, name: 'Football (Academy)', description: 'Structured football coaching for junior and senior players', price: 12000, icon: '⚽' },
    { id: 'act_005', schoolId, name: 'Chess Club', description: 'Competitive chess training', price: 8000, icon: '♟️' },
    { id: 'act_006', schoolId, name: 'Debate Club', description: 'Public speaking and debating skills', price: 5000, icon: '🎤' }
  ];
  const studentActivities = [
    { id: uid('sa'), schoolId, studentId: 'stu_001', activityId: 'act_001', enrolledAt: daysAgo(10), term: '1st Term 2025/26' }, // Chiamaka — Swimming
    { id: uid('sa'), schoolId, studentId: 'stu_001', activityId: 'act_002', enrolledAt: daysAgo(10), term: '1st Term 2025/26' }, // Chiamaka — Ballet
    { id: uid('sa'), schoolId, studentId: 'stu_002', activityId: 'act_004', enrolledAt: daysAgo(8),  term: '1st Term 2025/26' }, // Tobi — Football
    { id: uid('sa'), schoolId, studentId: 'stu_002', activityId: 'act_005', enrolledAt: daysAgo(8),  term: '1st Term 2025/26' }, // Tobi — Chess
    { id: uid('sa'), schoolId, studentId: 'stu_008', activityId: 'act_001', enrolledAt: daysAgo(5),  term: '1st Term 2025/26' }, // Fatima — Swimming
    { id: uid('sa'), schoolId, studentId: 'stu_009', activityId: 'act_003', enrolledAt: daysAgo(6),  term: '1st Term 2025/26' }  // Ade — Music
  ];

  // Invoices — generated from fee structures per student. Some paid, some partial, some outstanding.
  const invoices = [];
  students.forEach((s, idx) => {
    const fs = feeStructures.find(f => f.classId === s.classId);
    // Per-student activity line items
    const stuActivities = studentActivities.filter(sa => sa.studentId === s.id && sa.term === fs.term);
    const activityLineItems = stuActivities.map(sa => {
      const act = activities.find(a => a.id === sa.activityId);
      return act ? { name: act.icon + ' ' + act.name, amount: act.price } : null;
    }).filter(Boolean);
    const activityTotal = activityLineItems.reduce((sum, l) => sum + l.amount, 0);
    const total = fs.tuition + fs.books + fs.uniform + fs.pta + activityTotal;
    // Spread: paid, partial, outstanding rotation
    const status = idx % 3 === 0 ? 'paid' : (idx % 3 === 1 ? 'partial' : 'outstanding');
    const paid = status === 'paid' ? total : (status === 'partial' ? Math.round(total * 0.6) : 0);
    invoices.push({
      id: uid('inv'),
      schoolId,
      studentId: s.id,
      term: fs.term,
      lineItems: [
        { name: 'Tuition Fee', amount: fs.tuition },
        { name: 'Books & Materials', amount: fs.books },
        { name: 'Uniform', amount: fs.uniform },
        { name: 'PTA Levy', amount: fs.pta },
        ...activityLineItems
      ],
      total,
      paid,
      balance: total - paid,
      status,
      dueDate: fs.dueDate,
      createdAt: daysAgo(30)
    });
  });

  // Payment transactions for paid/partial invoices
  const transactions = [];
  invoices.forEach(inv => {
    if (inv.paid > 0) {
      transactions.push({
        id: uid('txn'),
        schoolId,
        invoiceId: inv.id,
        studentId: inv.studentId,
        amount: inv.paid,
        method: ['card', 'transfer', 'ussd'][Math.floor(Math.random() * 3)],
        reference: 'CSP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        status: 'successful',
        gateway: 'Paystack',
        timestamp: daysAgo(Math.floor(Math.random() * 25)),
        reconciled: true
      });
    }
  });

  // Attendance — last 14 days for all students
  const attendance = [];
  for (let d = 13; d >= 0; d--) {
    const date = daysAgo(d);
    const wd = new Date(date).getDay();
    if (wd === 0 || wd === 6) continue; // weekends
    students.forEach(s => {
      const r = Math.random();
      let status = 'present';
      if (r > 0.94) status = 'absent';
      else if (r > 0.88) status = 'late';
      attendance.push({ id: uid('att'), schoolId, studentId: s.id, classId: s.classId, date, status, recordedBy: classes.find(c => c.id === s.classId).teacherId });
    });
  }

  // Results — CA + Exam for each student per subject
  const results = [];
  students.forEach(s => {
    subjects.slice(0, 6).forEach(sub => {
      const ca1 = Math.floor(Math.random() * 15) + 5;       // 5-20
      const ca2 = Math.floor(Math.random() * 15) + 5;       // 5-20
      const exam = Math.floor(Math.random() * 40) + 25;      // 25-65
      const total = ca1 + ca2 + exam;
      let grade = 'F';
      if (total >= 75) grade = 'A';
      else if (total >= 60) grade = 'B';
      else if (total >= 50) grade = 'C';
      else if (total >= 45) grade = 'D';
      else if (total >= 40) grade = 'E';
      results.push({
        id: uid('res'), schoolId, studentId: s.id, classId: s.classId,
        subjectId: sub.id, term: '1st Term 2025/26',
        ca1, ca2, exam, total, grade,
        comment: '', approved: Math.random() > 0.3
      });
    });
  });

  // Assignments
  const assignments = [
    { id: uid('asn'), schoolId, classId: 'cls_jss1', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Algebra Practice - Set 3', description: 'Solve exercises 1-15 from page 42 of your textbook. Show all working steps.', dueDate: daysAhead(3), createdAt: daysAgo(2), submissions: [{ studentId: 'stu_009', submittedAt: daysAgo(1), text: 'Completed all 15 exercises with working.', grade: null }] },
    { id: uid('asn'), schoolId, classId: 'cls_jss1', subjectId: 'sub_eng',  teacherId: 'tch_chioma', title: 'Essay: My Future Career', description: 'Write a 300-word essay on what you want to become and why.', dueDate: daysAhead(5), createdAt: daysAgo(1), submissions: [] },
    { id: uid('asn'), schoolId, classId: 'cls_pry3', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Multiplication Tables', description: 'Memorize and recite multiplication tables 6-9 by Monday.', dueDate: daysAhead(2), createdAt: daysAgo(3), submissions: [{ studentId: 'stu_001', submittedAt: now(), grade: null }] },
    { id: uid('asn'), schoolId, classId: 'cls_sss1', subjectId: 'sub_civ',  teacherId: 'tch_bola',  title: 'Civic Duties Project', description: 'Research and write about three civic duties of a Nigerian citizen.', dueDate: daysAhead(7), createdAt: daysAgo(1), submissions: [] }
  ];

  // Messages — conversations between parent & teacher
  const conversations = [
    {
      id: 'conv_001', schoolId,
      participants: ['par_okafor', 'tch_adamu'],
      messages: [
        { from: 'par_okafor', text: 'Good morning. How is Tobi performing in Maths this term?', timestamp: daysAgo(2) },
        { from: 'tch_adamu', text: 'Good morning sir. Tobi is improving steadily. He scored 78 in his last CA. Just needs more practice on word problems.', timestamp: daysAgo(2) },
        { from: 'par_okafor', text: 'Thank you. I will work with him at home.', timestamp: daysAgo(2) }
      ]
    },
    {
      id: 'conv_002', schoolId,
      participants: ['par_bello', 'tch_emeka'],
      messages: [
        { from: 'tch_emeka', text: 'Mrs. Bello, please ensure Zainab brings her science notebook tomorrow for the practical.', timestamp: daysAgo(1) },
        { from: 'par_bello', text: 'Noted, thank you. I will pack it tonight.', timestamp: daysAgo(1) }
      ]
    }
  ];

  // Announcements (broadcast)
  const announcements = [
    { id: uid('ann'), schoolId, title: 'Mid-term Break', body: 'School will close for mid-term break from Friday 6th December and resume on Monday 16th December. Have a restful break.', audience: 'all', sentBy: 'sch_brightlights', timestamp: daysAgo(3) },
    { id: uid('ann'), schoolId, title: 'PTA Meeting', body: 'A PTA meeting holds this Saturday at 10am in the school hall. All parents are encouraged to attend.', audience: 'parents', sentBy: 'sch_brightlights', timestamp: daysAgo(7) },
    { id: uid('ann'), schoolId, title: 'Sports Day', body: 'Annual inter-house sports day comes up on the 28th of this month. Students should come in their house colours.', audience: 'all', sentBy: 'sch_brightlights', timestamp: daysAgo(5) }
  ];

  // Inventory
  const mkHist = (items) => items.map((it, idx) => ({ ...it, history: [
    { delta: it.quantity, reason: 'Opening stock', by: 'sch_brightlights', timestamp: daysAgo(60 - idx) }
  ]}));
  const inventory = mkHist([
    { id: uid('inv'), schoolId, name: 'Mathematics Textbook (JSS1)', category: 'Books', quantity: 48, minStock: 20, unitCost: 4500, supplier: 'Macmillan' },
    { id: uid('inv'), schoolId, name: 'English Workbook (Primary)', category: 'Books', quantity: 15, minStock: 25, unitCost: 3200, supplier: 'University Press' },
    { id: uid('inv'), schoolId, name: 'School Uniform - Daily Wear', category: 'Uniform', quantity: 80, minStock: 30, unitCost: 8500, supplier: 'Bright Tailors' },
    { id: uid('inv'), schoolId, name: 'A4 Plain Sheets (Reams)', category: 'Stationery', quantity: 12, minStock: 10, unitCost: 4800, supplier: 'Office Mart' },
    { id: uid('inv'), schoolId, name: 'Whiteboard Markers (Box)', category: 'Stationery', quantity: 8, minStock: 5, unitCost: 2400, supplier: 'Office Mart' },
    { id: uid('inv'), schoolId, name: 'Projector - Epson EB-X06', category: 'Equipment', quantity: 3, minStock: 1, unitCost: 285000, supplier: 'TechZone' },
    /* ============ More inventory variety ============ */
    { id: uid('inv'), schoolId, name: 'Science Lab Beakers (Set of 10)',  category: 'Equipment', quantity: 6,  minStock: 4,  unitCost: 35000,  supplier: 'Lagos Science Supplies' },
    { id: uid('inv'), schoolId, name: 'Microscope - Basic Compound',       category: 'Equipment', quantity: 4,  minStock: 2,  unitCost: 95000,  supplier: 'Lagos Science Supplies' },
    { id: uid('inv'), schoolId, name: 'Football (Match Quality)',          category: 'Sports',    quantity: 8,  minStock: 4,  unitCost: 12000,  supplier: 'Tunde Sports' },
    { id: uid('inv'), schoolId, name: 'Basketball',                        category: 'Sports',    quantity: 5,  minStock: 3,  unitCost: 9500,   supplier: 'Tunde Sports' },
    { id: uid('inv'), schoolId, name: 'First Aid Kit (Wall-mounted)',      category: 'Equipment', quantity: 2,  minStock: 2,  unitCost: 45000,  supplier: 'MediCare NG' },
    { id: uid('inv'), schoolId, name: 'Desktop Computer (Dell OptiPlex)',  category: 'Equipment', quantity: 12, minStock: 8,  unitCost: 320000, supplier: 'TechZone' },
    { id: uid('inv'), schoolId, name: 'Student Desk (single seater)',      category: 'Furniture', quantity: 45, minStock: 30, unitCost: 18000,  supplier: 'Bright Tailors' },
    { id: uid('inv'), schoolId, name: 'Chalk (Box of 100)',                category: 'Stationery',quantity: 24, minStock: 10, unitCost: 1500,   supplier: 'Office Mart' },
    { id: uid('inv'), schoolId, name: 'Mathematics Set (Geometry)',        category: 'Books',     quantity: 18, minStock: 20, unitCost: 1800,   supplier: 'University Press' },
    { id: uid('inv'), schoolId, name: 'School Bus Diesel (Litres)',        category: 'Other',     quantity: 220,minStock: 100,unitCost: 950,    supplier: 'Mobil Filling Station' }
  ]);
  // Add a few realistic movements
  inventory[0].history.push({ delta: -12, reason: 'Issued to JSS1', by: 'sch_brightlights', timestamp: daysAgo(20) });
  inventory[1].history.push({ delta: -10, reason: 'Distributed to Primary 3', by: 'sch_brightlights', timestamp: daysAgo(15) });
  inventory[3].history.push({ delta: -3, reason: 'Office consumption', by: 'sch_brightlights', timestamp: daysAgo(7) });
  inventory[4].history.push({ delta: -2, reason: 'Staff room use', by: 'sch_brightlights', timestamp: daysAgo(5) });

  // Discipline records
  const discipline = [
    { id: uid('dis'), schoolId, studentId: 'stu_002', type: 'commendation', points: 5, note: 'Helped a junior student carry books', recordedBy: 'tch_adamu', date: daysAgo(5) },
    { id: uid('dis'), schoolId, studentId: 'stu_009', type: 'misconduct', points: -2, note: 'Late to morning assembly twice this week', recordedBy: 'tch_adamu', date: daysAgo(3) },
    { id: uid('dis'), schoolId, studentId: 'stu_003', type: 'commendation', points: 10, note: 'Top scorer in Science quiz', recordedBy: 'tch_emeka', date: daysAgo(8) }
  ];

  // Loans
  const loans = [
    {
      id: uid('loan'), schoolId, parentId: 'par_eze', studentIds: ['stu_005', 'stu_006'],
      amount: 250000, term: 6, interestRate: 5,
      totalRepayment: 262500, monthlyPayment: 43750,
      status: 'active', creditScore: 685,
      appliedAt: daysAgo(20), approvedAt: daysAgo(19),
      repayments: [
        { dueDate: daysAgo(5), amount: 43750, paid: true, paidAt: daysAgo(5) },
        { dueDate: daysAhead(25), amount: 43750, paid: false },
        { dueDate: daysAhead(55), amount: 43750, paid: false },
        { dueDate: daysAhead(85), amount: 43750, paid: false },
        { dueDate: daysAhead(115), amount: 43750, paid: false },
        { dueDate: daysAhead(145), amount: 43750, paid: false }
      ]
    },
    {
      id: uid('loan'), schoolId, parentId: 'par_musa', studentIds: ['stu_007', 'stu_008'],
      amount: 320000, term: 6, interestRate: 5,
      totalRepayment: 336000, monthlyPayment: 56000,
      status: 'pending', creditScore: 640,
      reason: 'School fees for Ibrahim (Nursery 2) and Fatima (SSS 1) this term',
      appliedAt: daysAgo(1),
      repayments: []
    },
    /* ============ Paid-off loan (historical) ============ */
    {
      id: uid('loan'), schoolId, parentId: 'par_bello', studentIds: ['stu_003'],
      amount: 180000, term: 4, interestRate: 5,
      totalRepayment: 189000, monthlyPayment: 47250,
      status: 'closed', creditScore: 745,
      appliedAt: daysAgo(180), approvedAt: daysAgo(179),
      reason: 'School fees for Zainab (JSS 2) — last term',
      repayments: [
        { dueDate: daysAgo(150), amount: 47250, paid: true, paidAt: daysAgo(150) },
        { dueDate: daysAgo(120), amount: 47250, paid: true, paidAt: daysAgo(119) },
        { dueDate: daysAgo(90),  amount: 47250, paid: true, paidAt: daysAgo(91)  },
        { dueDate: daysAgo(60),  amount: 47250, paid: true, paidAt: daysAgo(58)  }
      ]
    },
    /* ============ Rejected loan ============ */
    {
      id: uid('loan'), schoolId, parentId: 'par_lawal', studentIds: ['stu_009', 'stu_010'],
      amount: 850000, term: 12, interestRate: 5,
      totalRepayment: 892500, monthlyPayment: 74375,
      status: 'rejected', creditScore: 522,
      reason: 'School fees + uniform for Ade and Bisi for full session',
      rejectionReason: 'Loan amount exceeds income capacity',
      rejectionNote: 'Recommend smaller loan or split into two requests',
      appliedAt: daysAgo(30), decidedAt: daysAgo(29),
      repayments: []
    }
  ];

  // Timetable for JSS1 Monday-Friday (sample)
  const timetable = [
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Monday',    period: 1, time: '08:00-08:40', subjectId: 'sub_math', teacherId: 'tch_adamu' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Monday',    period: 2, time: '08:40-09:20', subjectId: 'sub_eng',  teacherId: 'tch_chioma' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Monday',    period: 3, time: '09:20-10:00', subjectId: 'sub_sci',  teacherId: 'tch_emeka' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Tuesday',   period: 1, time: '08:00-08:40', subjectId: 'sub_eng',  teacherId: 'tch_chioma' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Tuesday',   period: 2, time: '08:40-09:20', subjectId: 'sub_math', teacherId: 'tch_adamu' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Wednesday', period: 1, time: '08:00-08:40', subjectId: 'sub_sci',  teacherId: 'tch_emeka' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Wednesday', period: 2, time: '08:40-09:20', subjectId: 'sub_soc',  teacherId: 'tch_chioma' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Thursday',  period: 1, time: '08:00-08:40', subjectId: 'sub_math', teacherId: 'tch_adamu' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Thursday',  period: 2, time: '08:40-09:20', subjectId: 'sub_ict',  teacherId: 'tch_emeka' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Friday',    period: 1, time: '08:00-08:40', subjectId: 'sub_yor',  teacherId: 'tch_funke' },
    { id: uid('tt'), schoolId, classId: 'cls_jss1', day: 'Friday',    period: 2, time: '08:40-09:20', subjectId: 'sub_civ',  teacherId: 'tch_bola' }
  ];

  // Lesson plans
  const lessonPlans = [
    { id: uid('lp'), schoolId, teacherId: 'tch_adamu', classId: 'cls_jss1', subjectId: 'sub_math', week: 'Week 6', topic: 'Quadratic Equations', objectives: 'Students will be able to solve simple quadratic equations using factorization.', activities: 'Examples, group work, board exercises', resources: 'Textbook ch. 5, whiteboard', createdAt: daysAgo(4) },
    { id: uid('lp'), schoolId, teacherId: 'tch_chioma', classId: 'cls_jss1', subjectId: 'sub_eng', week: 'Week 6', topic: 'Adjectives and Adverbs', objectives: 'Identify and use adjectives and adverbs correctly.', activities: 'Reading passage, sentence construction', resources: 'Workbook, flashcards', createdAt: daysAgo(2) }
  ];

  // Expense ledger
  const expenses = [
    { id: uid('exp'), schoolId, category: 'Salaries',     amount: 3900000, description: 'October staff salaries — 14 staff (academic + non-academic)',   date: daysAgo(46), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Salaries',     amount: 3900000, description: 'November staff salaries — 14 staff (academic + non-academic)',  date: daysAgo(15), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Electricity',  amount: 55000,   description: 'EKEDC prepaid token — October',                                 date: daysAgo(44), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Electricity',  amount: 55000,   description: 'EKEDC prepaid token — November',                                date: daysAgo(12), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Diesel',       amount: 85000,   description: 'Generator diesel — 200L (daysAgo Oct)',                         date: daysAgo(42), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Diesel',       amount: 90000,   description: 'Generator diesel — 200L (Nov, price up ₦5/L)',                  date: daysAgo(10), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Maintenance',  amount: 120000,  description: 'Classroom 4 & 5 repaint + broken desks fixed (15 units)',       date: daysAgo(20), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Maintenance',  amount: 45000,   description: 'Roof gutter repairs — Block B',                                 date: daysAgo(35), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Supplies',     amount: 65000,   description: 'Exercise books, biro, chalk, marker — restocking',              date: daysAgo(7),  recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Supplies',     amount: 48000,   description: 'Photocopier paper, ink cartridges (2 boxes)',                   date: daysAgo(28), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Internet',     amount: 35000,   description: 'Spectranet 50Mbps — October',                                   date: daysAgo(45), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Internet',     amount: 35000,   description: 'Spectranet 50Mbps — November',                                  date: daysAgo(13), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Security',     amount: 80000,   description: 'Security company retainer — 2 guards × ₦40,000 (October)',     date: daysAgo(44), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Security',     amount: 80000,   description: 'Security company retainer — 2 guards × ₦40,000 (November)',    date: daysAgo(14), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Cleaning',     amount: 30000,   description: 'Cleaning supplies — disinfectant, brooms, mops (monthly)',      date: daysAgo(16), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Transport',    amount: 42000,   description: 'School bus fuel + servicing — October–November',                date: daysAgo(22), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Bank Charges', amount: 12500,   description: 'Gateway settlement fees + transfer charges (October)',           date: daysAgo(30), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Bank Charges', amount: 9800,    description: 'Gateway settlement fees + transfer charges (November)',          date: daysAgo(6),  recordedBy: 'sch_brightlights' }
  ];

  // Audit log
  const auditLog = [
    { id: uid('aud'), schoolId, actor: 'sch_brightlights', action: 'created_school', target: 'Bright Lights Academy', timestamp: daysAgo(30) },
    { id: uid('aud'), schoolId, actor: 'sch_brightlights', action: 'added_student', target: 'Chiamaka Okafor', timestamp: daysAgo(30) },
    { id: uid('aud'), schoolId, actor: 'tch_adamu', action: 'submitted_result', target: 'JSS1 Mathematics', timestamp: daysAgo(2) }
  ];

  // Schools (for super admin view)
  const schools = [
    { id: 'sch_brightlights', name: 'Bright Lights Academy', proprietor: 'Mr. Olusegun Adebayo', email: 'admin@brightlights.ng', phone: '+234 802 555 0001', address: '15 Liberty Estate, Lekki, Lagos', students: 10, teachers: 5, subscriptionPlan: 'Professional', monthlyFee: 75000, status: 'active', joinedAt: daysAgo(180), kyc: { regNumber: 'RC-228491', ownerNIN: '12345678901', cacUploaded: true, accreditation: 'Lagos State Ministry of Education' }, nextRenewal: daysAhead(28), autoRenew: true },
    { id: 'sch_horizon', name: 'Horizon International School', proprietor: 'Mrs. Adaeze Nkem', email: 'admin@horizon.ng', phone: '+234 803 555 0002', address: '8 Adetokunbo Ademola, VI, Lagos', students: 380, teachers: 28, subscriptionPlan: 'Enterprise', monthlyFee: 280000, status: 'active', joinedAt: daysAgo(240), kyc: { regNumber: 'RC-184502', ownerNIN: '22345678901', cacUploaded: true, accreditation: 'Lagos State Ministry of Education' }, nextRenewal: daysAhead(12), autoRenew: true },
    { id: 'sch_excellence', name: 'Excellence Group of Schools', proprietor: 'Pastor John Adekola', email: 'office@excellence.ng', phone: '+234 805 555 0003', address: '22 Awolowo Way, Ikeja, Lagos', students: 215, teachers: 18, subscriptionPlan: 'Professional', monthlyFee: 150000, status: 'active', joinedAt: daysAgo(120), kyc: { regNumber: 'RC-301204', ownerNIN: '32345678901', cacUploaded: true, accreditation: 'Lagos State Ministry of Education' }, nextRenewal: daysAhead(5), autoRenew: false },
    { id: 'sch_montessori', name: 'Little Stars Montessori', proprietor: 'Dr. Ngozi Iheanacho', email: 'info@littlestars.ng', phone: '+234 806 555 0004', address: '5 Banana Island Rd, Ikoyi', students: 95, teachers: 11, subscriptionPlan: 'Essential', monthlyFee: 45000, status: 'trial', joinedAt: daysAgo(15), kyc: { regNumber: 'RC-410992', ownerNIN: '42345678901', cacUploaded: false, accreditation: 'Pending' }, nextRenewal: daysAhead(45), autoRenew: false },
    { id: 'sch_anchor', name: 'Anchor Comprehensive College', proprietor: 'Chief Tunde Bakare', email: 'admin@anchorcollege.ng', phone: '+234 807 555 0005', address: '14 Magodo Phase 2, Lagos', students: 540, teachers: 38, subscriptionPlan: 'Enterprise', monthlyFee: 380000, status: 'active', joinedAt: daysAgo(310), kyc: { regNumber: 'RC-100348', ownerNIN: '52345678901', cacUploaded: true, accreditation: 'Lagos State Ministry of Education' }, nextRenewal: daysAhead(18), autoRenew: true },
    { id: 'sch_paula', name: 'Paula Heights School', proprietor: 'Mrs. Paula Okeke', email: 'paula@pauleheights.ng', phone: '+234 808 555 0006', address: '11 Festac Town, Lagos', students: 140, teachers: 12, subscriptionPlan: 'Professional', monthlyFee: 95000, status: 'suspended', joinedAt: daysAgo(95), kyc: { regNumber: 'RC-220871', ownerNIN: '62345678901', cacUploaded: true, accreditation: 'Lagos State Ministry of Education' }, nextRenewal: daysAgo(8), autoRenew: false }
  ];

  // Notifications (in-app)
  const notifications = [
    { id: uid('not'), userId: 'par_okafor', title: 'Fee Reminder', body: 'School fees for 1st Term are due in 15 days', type: 'warn', read: false, timestamp: daysAgo(1) },
    { id: uid('not'), userId: 'par_okafor', title: 'New Announcement', body: 'PTA Meeting this Saturday', type: 'info', read: false, timestamp: daysAgo(7) },
    { id: uid('not'), userId: 'par_okafor', title: 'Assignment Posted', body: 'New Maths assignment for Tobi', type: 'info', read: true, timestamp: daysAgo(2) },
    { id: uid('not'), userId: 'tch_adamu', title: 'Result Awaiting Approval', body: 'JSS1 Mathematics results submitted', type: 'info', read: false, timestamp: daysAgo(1) }
  ];

  // Leave requests (HR)
  const leaveRequests = [
    { id: uid('lv'), schoolId, staffId: 'tch_chioma',    type: 'Casual',       from: daysAhead(7),  to: daysAhead(9),  reason: 'Family commitment',                 status: 'pending',  source: 'self',  requestedAt: daysAgo(1) },
    { id: uid('lv'), schoolId, staffId: 'stf_sec',       type: 'Sick',         from: daysAgo(2),    to: daysAgo(1),    reason: 'Medical appointment',                status: 'approved', source: 'admin', requestedAt: daysAgo(3), decidedAt: daysAgo(2) },
    { id: uid('lv'), schoolId, staffId: 'tch_emeka',     type: 'Annual',       from: daysAhead(20), to: daysAhead(27), reason: 'Annual vacation leave',              status: 'pending',  source: 'self',  requestedAt: daysAgo(2) },
    { id: uid('lv'), schoolId, staffId: 'stf_nurse',     type: 'Maternity',    from: daysAhead(45), to: daysAhead(135),reason: 'Maternity leave for first child',     status: 'approved', source: 'self',  requestedAt: daysAgo(15), decidedAt: daysAgo(14) },
    { id: uid('lv'), schoolId, staffId: 'tch_funke',     type: 'Bereavement',  from: daysAgo(20),   to: daysAgo(13),   reason: 'Death of father — funeral arrangements', status: 'approved', source: 'self', requestedAt: daysAgo(22), decidedAt: daysAgo(21) },
    { id: uid('lv'), schoolId, staffId: 'stf_driver',    type: 'Sick',         from: daysAgo(5),    to: daysAgo(3),    reason: 'Malaria',                            status: 'approved', source: 'admin', requestedAt: daysAgo(5), decidedAt: daysAgo(5) },
    { id: uid('lv'), schoolId, staffId: 'tch_adamu',     type: 'Study',        from: daysAhead(60), to: daysAhead(120),reason: 'M.Ed. residency at UNILAG',           status: 'pending',  source: 'self',  requestedAt: daysAgo(0) },
    { id: uid('lv'), schoolId, staffId: 'stf_recep',     type: 'Casual',       from: daysAhead(2),  to: daysAhead(2),  reason: 'Visa appointment at embassy',         status: 'pending',  source: 'self',  requestedAt: daysAgo(0) }
  ];

  // Staff attendance (clock-in records) for the last 5 working days
  const staffAttendance = [];
  for (let d = 5; d >= 0; d--) {
    const date = daysAgo(d);
    const wd = new Date(date).getDay();
    if (wd === 0 || wd === 6) continue;
    teachers.forEach(t => {
      if (Math.random() > 0.92) return; // ~8% absent
      const lateMins = Math.random() > 0.85 ? Math.floor(Math.random() * 45) + 1 : 0;
      staffAttendance.push({
        id: uid('satt'), schoolId, staffId: t.id, date,
        clockIn: lateMins ? `08:${String(lateMins).padStart(2,'0')}` : '07:' + String(45 + Math.floor(Math.random()*10)).padStart(2,'0'),
        clockOut: '15:' + String(20 + Math.floor(Math.random()*30)).padStart(2,'0'),
        status: lateMins ? 'late' : 'present'
      });
    });
  }

  // Support tickets (operator side)
  const supportTickets = [
    { id: 'tkt_001', schoolId: 'sch_horizon',      requester: 'Mrs. Adaeze Nkem',     subject: 'Bulk-upload failing for SSS3 class',          description: 'Trying to bulk upload 42 students for SSS3 but the CSV fails with "class not found" even though SSS3 exists.', priority: 'high',   status: 'in_progress', channel: 'whatsapp', assignedTo: 'team_sup', createdAt: daysAgo(1), slaHours: 4,  notes: [{ by: 'team_sup', text: 'Investigating CSV format', timestamp: daysAgo(1), internal: true }] },
    { id: 'tkt_002', schoolId: 'sch_brightlights', requester: 'Mr. Olusegun Adebayo', subject: 'Need to bulk-resend WhatsApp invites',         description: 'About 25 parents never received their WhatsApp invitation. Can you resend in bulk?', priority: 'low',    status: 'open',        channel: 'platform',  assignedTo: null,         createdAt: daysAgo(2), slaHours: 48, notes: [] },
    { id: 'tkt_003', schoolId: 'sch_montessori',   requester: 'Dr. Ngozi Iheanacho',  subject: 'Paystack account name shows wrong school',     description: 'When parents pay, the Paystack confirmation shows "Little Star" not "Little Stars Montessori".', priority: 'medium', status: 'resolved',    channel: 'whatsapp',  assignedTo: 'team_sup', createdAt: daysAgo(6), slaHours: 24, notes: [{ by: 'team_sup', text: 'Updated business name with Paystack', timestamp: daysAgo(5), internal: false }, { by: 'team_sup', text: 'Confirmed working by Mrs. Iheanacho', timestamp: daysAgo(5), internal: true }] },
    { id: 'tkt_004', schoolId: 'sch_anchor',       requester: 'Chief Tunde Bakare',   subject: 'How do I export the annual broadsheet?',       description: 'Need to send broadsheets to the proprietor association by Friday.', priority: 'medium', status: 'open',        channel: 'platform',  assignedTo: null,         createdAt: daysAgo(0), slaHours: 24, notes: [] },
    { id: 'tkt_005', schoolId: 'sch_excellence',   requester: 'Pastor John Adekola',  subject: 'Two teachers cannot login',                     description: 'Mrs. Okafor and Mr. Adeyemi both report invalid password despite resets.', priority: 'high',   status: 'escalated',   channel: 'whatsapp',  assignedTo: 'team_ops', createdAt: daysAgo(0), slaHours: 4,  notes: [{ by: 'team_sup', text: 'Escalated to ops — looks like an auth caching bug', timestamp: daysAgo(0), internal: true }] },
    /* ============ More tickets across schools ============ */
    { id: 'tkt_006', schoolId: 'sch_brightlights', requester: 'Mrs. Adaeze Okonkwo (Bursar)', subject: 'Paystack settlement delay',              description: 'Today\'s collections (₦450k) have not landed in our settlement account. Usually settles same day.', priority: 'high',   status: 'in_progress', channel: 'whatsapp', assignedTo: 'team_fin', createdAt: daysAgo(0), slaHours: 4,  notes: [{ by: 'team_fin', text: 'Checking with Paystack — looks like a batch processing delay', timestamp: daysAgo(0), internal: true }] },
    { id: 'tkt_007', schoolId: 'sch_horizon',      requester: 'Mr. Tunde Ojo (IT)',           subject: 'Bulk timetable import producing duplicates', description: 'When uploading the CSV for SSS1, we end up with double entries for periods 1 and 2 on Mondays.',     priority: 'medium', status: 'open',        channel: 'platform', assignedTo: null,        createdAt: daysAgo(0), slaHours: 24, notes: [] },
    { id: 'tkt_008', schoolId: 'sch_anchor',       requester: 'Chief Tunde Bakare',           subject: 'Branding logo not appearing on report cards',description: 'Uploaded the school crest 2 days ago but generated PDFs still show the default placeholder.',           priority: 'low',    status: 'resolved',    channel: 'platform', assignedTo: 'team_sup', createdAt: daysAgo(4), slaHours: 48, notes: [{ by: 'team_sup', text: 'CDN cache cleared, regenerate report cards now.', timestamp: daysAgo(3), internal: false }] },
    { id: 'tkt_009', schoolId: 'sch_montessori',   requester: 'Dr. Ngozi Iheanacho',          subject: 'Need training session for new bursar',       description: 'We just hired a new bursar — when can your team do a 30 min walkthrough on the finance module?',         priority: 'low',    status: 'open',        channel: 'whatsapp', assignedTo: 'team_sup', createdAt: daysAgo(1), slaHours: 72, notes: [] },
    { id: 'tkt_010', schoolId: 'sch_excellence',   requester: 'Mrs. Olusegun (PTA Head)',     subject: 'Parents are not getting WhatsApp absence alerts',description: 'Three parents reported they never received the absence alert when their kids missed school yesterday.', priority: 'high',   status: 'in_progress', channel: 'whatsapp', assignedTo: 'team_sup', createdAt: daysAgo(1), slaHours: 4,  notes: [{ by: 'team_sup', text: 'Confirmed templates exist. Checking delivery logs', timestamp: daysAgo(0), internal: true }] }
  ];

  // Operator-side schools' remittance status
  const remittances = [
    { id: uid('rem'), schoolId: 'sch_brightlights', period: 'May 2026', amount: 1695200, status: 'completed', remittedAt: daysAgo(3) },
    { id: uid('rem'), schoolId: 'sch_horizon',      period: 'May 2026', amount: 8420000, status: 'pending' },
    { id: uid('rem'), schoolId: 'sch_excellence',   period: 'May 2026', amount: 3950000, status: 'completed', remittedAt: daysAgo(7) },
    { id: uid('rem'), schoolId: 'sch_montessori',   period: 'May 2026', amount: 1180000, status: 'pending' },
    { id: uid('rem'), schoolId: 'sch_anchor',       period: 'May 2026', amount: 12300000, status: 'completed', remittedAt: daysAgo(2) }
  ];

  // Default feature flags for each school (toggled by platform operator)
  schools.forEach(sch => {
    if (!sch.features) {
      sch.features = {
        whatsapp: true,
        lending: sch.subscriptionPlan !== 'Essential',
        ai: sch.subscriptionPlan === 'Enterprise',
        offline: true,
        transport: false,
        payroll: sch.subscriptionPlan !== 'Essential'
      };
    }
  });

  // Subscription invoices CASPAA sends to schools
  const schoolInvoices = [];
  schools.forEach(sch => {
    if (sch.status === 'suspended') return;
    // Last 3 months
    for (let m = 2; m >= 0; m--) {
      const dueDate = new Date(); dueDate.setMonth(dueDate.getMonth() - m, 5);
      const status = m === 0 ? (sch.status === 'trial' ? 'pending' : 'paid')
                   : m === 1 ? 'paid' : 'paid';
      schoolInvoices.push({
        id: uid('sinv'),
        schoolId: sch.id,
        period: dueDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        plan: sch.subscriptionPlan,
        amount: sch.monthlyFee,
        status,
        dueDate: dueDate.toISOString().slice(0, 10),
        paidAt: status === 'paid' ? new Date(dueDate.getTime() - 86400000 * 2).toISOString() : null,
        remindersSent: status === 'pending' ? 1 : 0
      });
    }
  });

  // Commissions earned by CASPAA
  const commissions = [];
  // Payment fee commissions (1.5% on each successful transaction)
  transactions.filter(t => t.status === 'successful').forEach(t => {
    commissions.push({ id: uid('cm'), schoolId: t.schoolId, type: 'payment', source: 'Paystack transaction', refId: t.id, amount: Math.round(t.amount * 0.015), timestamp: t.timestamp });
  });
  // Lending commissions (interest on active loans, distributed)
  loans.filter(l => l.status === 'active').forEach(l => {
    const interest = l.totalRepayment - l.amount;
    commissions.push({ id: uid('cm'), schoolId: l.schoolId, type: 'lending', source: `Loan ${l.id.slice(-6)}`, refId: l.id, amount: interest, timestamp: l.approvedAt || now() });
  });
  // A couple of referral commissions to demonstrate
  commissions.push({ id: uid('cm'), schoolId: 'sch_brightlights', type: 'referral', source: 'Referred Horizon International', refId: 'sch_horizon', amount: 50000, timestamp: daysAgo(60) });
  commissions.push({ id: uid('cm'), schoolId: 'sch_horizon',      type: 'referral', source: 'Referred Excellence Group',     refId: 'sch_excellence', amount: 75000, timestamp: daysAgo(45) });

  // Usage events (for Platform Usage Analytics)
  const usageEvents = [];
  const featureNames = ['attendance', 'fees', 'results', 'messages', 'assignments', 'loans', 'dashboard', 'announcements'];
  // ~28 days of synthetic usage data
  for (let d = 27; d >= 0; d--) {
    const date = daysAgo(d);
    schools.forEach(sch => {
      if (sch.status === 'suspended') return;
      const base = Math.max(5, Math.floor(sch.students * 0.7));
      const dau = base + Math.floor(Math.random() * 20);
      featureNames.forEach(f => {
        usageEvents.push({ date, schoolId: sch.id, feature: f, count: Math.floor(Math.random() * (f === 'dashboard' ? 200 : 80)) + 5, dau });
      });
    });
  }

  // System / API event logs
  const errorLogs = [
    { id: uid('err'), timestamp: daysAgo(0),  level: 'warning', source: 'paystack-webhook', message: 'Retry: webhook signature mismatch on event evt_xJ8a (auto-retried)', resolved: true },
    { id: uid('err'), timestamp: daysAgo(1),  level: 'error',   source: 'sms-gateway',       message: 'SMS gateway disabled per platform decision (legacy code path)', resolved: true },
    { id: uid('err'), timestamp: daysAgo(2),  level: 'warning', source: 'csv-import',        message: 'Bulk upload at Horizon: 3 rows skipped due to invalid DOB format', resolved: true },
    { id: uid('err'), timestamp: daysAgo(3),  level: 'info',    source: 'auth',              message: 'Unusual login location for sch_montessori admin (Abuja IP) — verified by 2FA', resolved: true },
    { id: uid('err'), timestamp: daysAgo(5),  level: 'error',   source: 'db-replica',        message: 'Replica lag spiked to 3.2s for 90s window — failover not triggered', resolved: true },
    { id: uid('err'), timestamp: daysAgo(7),  level: 'warning', source: 'whatsapp-api',      message: 'Rate-limited at 80 msg/min during PTA broadcast', resolved: true }
  ];

  // Academic sessions + terms + arms
  const academicSessions = [
    { id: 'sess_2024_25', schoolId, name: '2024/2025', startDate: '2024-09-09', endDate: '2025-07-25', current: false },
    { id: 'sess_2025_26', schoolId, name: '2025/2026', startDate: '2025-09-08', endDate: '2026-07-24', current: true }
  ];
  const academicTerms = [
    { id: 'term_1', schoolId, sessionId: 'sess_2025_26', name: '1st Term',   startDate: '2025-09-08', endDate: '2025-12-12', current: true },
    { id: 'term_2', schoolId, sessionId: 'sess_2025_26', name: '2nd Term',   startDate: '2026-01-12', endDate: '2026-04-03', current: false },
    { id: 'term_3', schoolId, sessionId: 'sess_2025_26', name: '3rd Term',   startDate: '2026-04-27', endDate: '2026-07-24', current: false }
  ];
  const arms = [
    { id: 'arm_a', schoolId, name: 'A' },
    { id: 'arm_b', schoolId, name: 'B' },
    { id: 'arm_silver', schoolId, name: 'Silver' },
    { id: 'arm_gold', schoolId, name: 'Gold' }
  ];

  // Academic calendar events
  const academicCalendar = [
    { id: uid('cal'), schoolId, title: 'Mid-term Break',         date: daysAhead(5),   type: 'break',     audience: 'all' },
    { id: uid('cal'), schoolId, title: 'PTA Meeting',             date: daysAhead(8),   type: 'meeting',   audience: 'parents' },
    { id: uid('cal'), schoolId, title: 'Inter-house Sports Day',  date: daysAhead(14),  type: 'event',     audience: 'all' },
    { id: uid('cal'), schoolId, title: 'End of 1st Term Exams',   date: daysAhead(21),  type: 'exam',      audience: 'students' },
    { id: uid('cal'), schoolId, title: '1st Term Ends',           date: '2025-12-12',   type: 'milestone', audience: 'all' },
    { id: uid('cal'), schoolId, title: 'Christmas Break Begins',  date: '2025-12-13',   type: 'break',     audience: 'all' },
    { id: uid('cal'), schoolId, title: '2nd Term Resumption',     date: '2026-01-12',   type: 'milestone', audience: 'all' }
  ];

  // ============ SCHEMES OF WORK (real curriculum) ============
  // For each subject × class × term, a week-by-week topic plan. Schools start from
  // NERDC/UBEC templates and customise. Teachers tick weeks off as they cover them.
  const mkScheme = (subjectId, classId, term, source, weeks) => ({
    id: uid('sch'), schoolId,
    subjectId, classId, term,
    sessionId: 'sess_2025_26',
    source,        // 'NERDC' | 'WAEC' | 'custom'
    status: 'published',
    weeks: weeks.map((w, idx) => ({
      week: idx + 1,
      topic: w.t,
      subtopics: w.s || [],
      objectives: w.o || '',
      methods: w.m || 'Lecture, examples, group work',
      resources: w.r || 'Approved textbook',
      duration: w.d || '3 periods',
      covered: w.covered || false,
      coveredAt: w.covered ? daysAgo(50 - idx * 4) : null,
      coveredBy: null
    })),
    createdAt: daysAgo(80),
    publishedAt: daysAgo(78)
  });

  const schemesOfWork = [
    // ============ JSS 1 — 1st Term ============
    mkScheme('sub_math', 'cls_jss1', '1st Term 2025/26', 'NERDC', [
      { t: 'Whole Numbers', s: ['Counting and writing numbers', 'Place values', 'Reading and writing in words'], o: 'Identify, read and write whole numbers up to 1 billion in words and figures.', covered: true },
      { t: 'LCM and HCF',   s: ['Prime factors', 'LCM by factors and division', 'HCF and applications'], o: 'Find LCM and HCF of any 2-3 numbers using two methods.', covered: true },
      { t: 'Fractions',     s: ['Types of fractions', 'Equivalent fractions', 'Conversion'], o: 'Convert between proper, improper, mixed and decimal fractions.', covered: true },
      { t: 'Decimals and Approximations', s: ['Place values to thousandths', 'Rounding', 'Significant figures'], o: 'Approximate to nearest 10/100/1000 and to significant figures.', covered: true },
      { t: 'Number Bases',  s: ['Base 2, 8, 10', 'Conversion between bases', 'Addition in non-decimal bases'], o: 'Convert numbers between binary, octal, and decimal.', covered: true },
      { t: 'Addition and Subtraction', s: ['Whole numbers', 'Decimals', 'Word problems'], o: 'Solve real-life word problems involving addition/subtraction.', covered: true },
      { t: 'Multiplication and Division', s: ['Whole numbers', 'Decimals', 'Word problems'], o: 'Apply multiplication and division to everyday situations.', covered: true },
      { t: 'Estimation', s: ['Estimation in addition/subtraction', 'Estimation in multiplication/division'], o: 'Estimate sums, differences, products and quotients reliably.', covered: false },
      { t: 'Use of Symbols (Variables)', s: ['Letters as numbers', 'Algebraic expressions'], o: 'Translate verbal statements to algebraic expressions.', covered: false },
      { t: 'Simple Equations', s: ['One-variable equations', 'Solving by inspection', 'Word problems'], o: 'Solve simple linear equations in one variable.', covered: false },
      { t: 'Revision', s: ['Test review', 'Past questions practice'], o: 'Consolidate term concepts in preparation for exam.', covered: false },
      { t: 'Term Examination', s: ['Written test'], o: 'End of term assessment.', covered: false }
    ]),
    mkScheme('sub_eng', 'cls_jss1', '1st Term 2025/26', 'NERDC', [
      { t: 'Reading Comprehension', s: ['Skimming and scanning', 'Main ideas vs details'], o: 'Read short passages and answer literal & inferential questions.', covered: true },
      { t: 'Parts of Speech (Nouns)', s: ['Types of nouns', 'Singular and plural', 'Possessive forms'], o: 'Identify and correctly use the eight parts of speech, starting with nouns.', covered: true },
      { t: 'Parts of Speech (Pronouns)', s: ['Personal pronouns', 'Possessive pronouns', 'Reflexive pronouns'], o: 'Substitute nouns with appropriate pronouns in sentences.', covered: true },
      { t: 'Sentence Structure', s: ['Subject and predicate', 'Simple sentences', 'Sentence types'], o: 'Build simple sentences with clear subject-verb agreement.', covered: true },
      { t: 'Descriptive Writing', s: ['Adjectives', 'Imagery', 'Describing places, people, objects'], o: 'Write a 100-150 word descriptive paragraph.', covered: false },
      { t: 'Letter Writing — Informal', s: ['Format of informal letter', 'Tone', 'Practice'], o: 'Write a coherent informal letter to a friend or relative.', covered: false },
      { t: 'Verbs — Tenses', s: ['Present, past, future', 'Continuous and perfect aspects'], o: 'Use the four major English tenses correctly in writing.', covered: false },
      { t: 'Listening Comprehension', s: ['Identifying tone', 'Note-taking from oral text'], o: 'Take coherent notes from a 3-minute oral passage.', covered: false },
      { t: 'Speech Work — Vowel Sounds', s: ['/ɪ/ vs /iː/', '/e/ vs /æ/'], o: 'Distinguish short and long vowel sounds in pronunciation.', covered: false },
      { t: 'Spelling and Vocabulary', s: ['Word formation', 'Prefixes and suffixes'], o: 'Build vocabulary through prefixes and suffixes.', covered: false },
      { t: 'Revision', s: ['Reading + writing practice'], o: 'Consolidate term skills.', covered: false },
      { t: 'Term Examination', s: ['Written test'], o: 'End of term assessment.', covered: false }
    ]),
    // ============ JSS 1 — Basic Science ============
    mkScheme('sub_sci', 'cls_jss1', '1st Term 2025/26', 'NERDC', [
      { t: 'You and Your Environment', s: ['Living vs non-living things', 'Habitat'], o: 'Classify items in the environment as living/non-living.', covered: true },
      { t: 'Human Body Systems — Overview', s: ['Skeletal', 'Muscular', 'Digestive', 'Respiratory'], o: 'Name the major systems of the human body and their functions.', covered: true },
      { t: 'Reproductive System and Puberty', s: ['Changes in puberty', 'Personal hygiene'], o: 'Discuss puberty changes with maturity and accurate vocabulary.', covered: true },
      { t: 'Drugs and Substance Abuse', s: ['Common drugs', 'Effects of abuse', 'Avoidance'], o: 'Identify drugs commonly abused and their effects on the body.', covered: false },
      { t: 'Matter — States and Properties', s: ['Solid, liquid, gas', 'Phase changes'], o: 'Describe the three states of matter and the changes between them.', covered: false },
      { t: 'Air', s: ['Composition', 'Atmospheric pressure', 'Air pollution'], o: 'List the major gases in air and discuss pollution.', covered: false },
      { t: 'Water', s: ['Sources', 'Properties', 'Treatment of water'], o: 'Explain the water cycle and basic treatment methods.', covered: false },
      { t: 'Energy', s: ['Forms of energy', 'Renewable vs non-renewable'], o: 'Identify common energy sources and classify them.', covered: false },
      { t: 'Simple Machines', s: ['Levers', 'Pulleys', 'Inclined planes'], o: 'Identify simple machines around the home and school.', covered: false },
      { t: 'Computing Devices (Intro)', s: ['Parts of a computer', 'Uses'], o: 'Name and describe the basic parts of a computer.', covered: false },
      { t: 'Revision', s: ['Q&A across topics'], o: 'Consolidate term concepts.', covered: false },
      { t: 'Term Examination', s: ['Written test'], o: 'End of term assessment.', covered: false }
    ]),
    // ============ Primary 3 — Mathematics ============
    mkScheme('sub_math', 'cls_pry3', '1st Term 2025/26', 'UBEC', [
      { t: 'Counting up to 9,999', s: ['Place values', 'Reading and writing'], o: 'Read and write numbers up to 9,999.', covered: true },
      { t: 'Roman Numerals to 50', s: ['Symbols I, V, X, L', 'Conversion'], o: 'Convert between Roman and Arabic up to 50.', covered: true },
      { t: 'Addition without Regrouping', s: ['3-digit + 3-digit', 'Word problems'], o: 'Add 3-digit numbers correctly without regrouping.', covered: true },
      { t: 'Addition with Regrouping', s: ['Carrying over', 'Word problems'], o: 'Add numbers requiring carry-over.', covered: false },
      { t: 'Subtraction', s: ['Without regrouping', 'With regrouping'], o: 'Subtract numbers up to 3 digits accurately.', covered: false },
      { t: 'Multiplication Tables 2-9', s: ['Memorisation', 'Application'], o: 'Recite and apply multiplication tables 2 through 9.', covered: false },
      { t: 'Division', s: ['Sharing concept', 'Simple division'], o: 'Solve simple division problems with no remainder.', covered: false },
      { t: 'Money', s: ['Naira notes and kobo', 'Addition of money'], o: 'Add and subtract amounts of money correctly.', covered: false },
      { t: 'Length', s: ['Metres and centimetres', 'Measuring'], o: 'Measure and convert between metres and centimetres.', covered: false },
      { t: 'Time', s: ['Reading clocks', 'Days, weeks, months'], o: 'Tell time on analog and digital clocks.', covered: false },
      { t: 'Revision', s: ['Worksheets and practice'], o: 'Consolidate.', covered: false },
      { t: 'Term Examination', s: ['Written test'], o: 'End of term.', covered: false }
    ])
  ];

  // Per-school role catalog (RBAC) — predefined roles + room for custom ones
  const schoolRoles = [
    { id: 'role_proprietor', schoolId, name: 'Proprietor',     description: 'Full system control. Cannot be deleted.', system: true,  permissions: ['*'],                                                                            color: '#7c3aed' },
    { id: 'role_principal',  schoolId, name: 'Principal',      description: 'Academic + administrative oversight, no finance.', system: true,  permissions: ['students','staff','academic','attendance','results','discipline','admissions','alumni','sickbay','communications'], color: '#0ea5e9' },
    { id: 'role_vp',         schoolId, name: 'Vice Principal', description: 'Same as Principal, secondary signatory.',          system: false, permissions: ['students','staff','academic','attendance','results','discipline','admissions','sickbay','communications'], color: '#06b6d4' },
    { id: 'role_bursar',     schoolId, name: 'Bursar',         description: 'Fees, invoices, financial reports.',                system: true,  permissions: ['fees','invoices','payments','reports','reconciliation'], color: '#f59e0b' },
    { id: 'role_hod',        schoolId, name: 'Head of Dept.',  description: 'Manage subject curriculum + teachers within a department.', system: false, permissions: ['curriculum','results','attendance','communications'], color: '#10b981' },
    { id: 'role_teacher',    schoolId, name: 'Teacher',        description: 'Mark attendance, enter results, post assignments.', system: true,  permissions: ['attendance','results','assignments','lesson_plans','messaging'],     color: '#059669' },
    { id: 'role_form_t',     schoolId, name: 'Form Teacher',   description: 'Teacher + own-class daily attendance + discipline.', system: false, permissions: ['attendance','results','assignments','lesson_plans','messaging','discipline'], color: '#22c55e' },
    { id: 'role_librarian',  schoolId, name: 'Librarian',      description: 'Manage library catalog and loans.',                 system: false, permissions: ['library'],                                                color: '#a855f7' },
    { id: 'role_nurse',      schoolId, name: 'School Nurse',   description: 'Sick bay records and parent health notifications.', system: false, permissions: ['sickbay','communications'],                                color: '#ef4444' },
    { id: 'role_security',   schoolId, name: 'Security',       description: 'Visitor log and gate control.',                     system: false, permissions: ['visitors'],                                                color: '#6b7280' },
    { id: 'role_parent',     schoolId, name: 'Parent',         description: 'View own child(ren) only.',                         system: true,  permissions: ['own_children','own_fees','messaging'],                     color: '#0891b2' }
  ];

  // CASPAA team members (platform side)
  const platformTeam = [
    { id: 'sa_001',   role: 'Super Admin',     name: 'Tayo Adesola',     email: 'super@caspaa.com',         permissions: ['*'],                                                          createdAt: daysAgo(400), lastActive: now() },
    { id: 'team_ops', role: 'Operations',      name: 'Adaeze Okeke',     email: 'ops@caspaa.com',           permissions: ['schools', 'support', 'audit'],                                createdAt: daysAgo(300), lastActive: daysAgo(0) },
    { id: 'team_fin', role: 'Finance',         name: 'Mohammed Bello',   email: 'finance@caspaa.com',       permissions: ['revenue', 'invoices', 'commissions'],                          createdAt: daysAgo(280), lastActive: daysAgo(0) },
    { id: 'team_cre', role: 'Credit',          name: 'Chinwe Nwosu',     email: 'credit@caspaa.com',        permissions: ['lending', 'disbursement'],                                     createdAt: daysAgo(220), lastActive: daysAgo(1) },
    { id: 'team_rsk', role: 'Risk',            name: 'Funke Ayodeji',    email: 'risk@caspaa.com',          permissions: ['lending', 'audit', 'analytics'],                               createdAt: daysAgo(200), lastActive: daysAgo(0) },
    { id: 'team_sup', role: 'Support',         name: 'Tunde Adekunle',   email: 'support@caspaa.com',       permissions: ['support', 'schools'],                                          createdAt: daysAgo(150), lastActive: daysAgo(0) },
    { id: 'team_com', role: 'Compliance',      name: 'Ngozi Eboh',       email: 'compliance@caspaa.com',    permissions: ['audit', 'security'],                                           createdAt: daysAgo(120), lastActive: daysAgo(2) },
    { id: 'team_bi',  role: 'BI / Analytics',  name: 'Segun Adeyinka',   email: 'bi@caspaa.com',            permissions: ['analytics', 'revenue'],                                        createdAt: daysAgo(90),  lastActive: daysAgo(0) }
  ];

  // School branding defaults
  schools.forEach(s => {
    if (!s.branding) s.branding = {
      primaryColor: s.id === 'sch_brightlights' ? '#047857' : (s.id === 'sch_horizon' ? '#1e40af' : '#0f766e'),
      logoText: s.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
      motto: s.id === 'sch_brightlights' ? 'Light the way to knowledge' : (s.id === 'sch_horizon' ? 'Reaching beyond horizons' : 'Excellence in education'),
      logoImage: null
    };
  });

  // Login sessions / device tracking
  const loginSessions = [
    { id: uid('sess'), userId: 'sch_brightlights', device: 'Chrome on Windows 11',  ip: '102.89.34.12',  location: 'Lagos, Nigeria', loggedInAt: now(),           current: true,  twoFA: true },
    { id: uid('sess'), userId: 'sch_brightlights', device: 'Safari on iPhone 14',   ip: '197.210.55.4',  location: 'Lagos, Nigeria', loggedInAt: daysAgo(0),      current: false, twoFA: true },
    { id: uid('sess'), userId: 'sch_brightlights', device: 'Chrome on Android',     ip: '197.210.78.9',  location: 'Ibadan, Nigeria', loggedInAt: daysAgo(2),    current: false, twoFA: true },
    { id: uid('sess'), userId: 'sa_001',           device: 'Chrome on macOS',       ip: '105.112.30.8',  location: 'Lagos, Nigeria', loggedInAt: now(),           current: true,  twoFA: true },
    { id: uid('sess'), userId: 'tch_adamu',        device: 'Chrome on Android',     ip: '197.210.55.55', location: 'Lagos, Nigeria', loggedInAt: daysAgo(0),      current: true,  twoFA: false }
  ];

  // Sick Bay / health records
  const sickBayRecords = [
    { id: uid('sb'), schoolId, studentId: 'stu_002', complaint: 'Headache and slight fever',     temperature: 37.8, treatment: 'Paracetamol 250mg, rest in clinic', referredToHospital: false, attendedBy: 'School Nurse', date: daysAgo(2), parentNotified: true },
    { id: uid('sb'), schoolId, studentId: 'stu_005', complaint: 'Minor knee scrape during sport', temperature: 36.5, treatment: 'Cleaned and bandaged',                referredToHospital: false, attendedBy: 'School Nurse', date: daysAgo(4), parentNotified: true },
    { id: uid('sb'), schoolId, studentId: 'stu_009', complaint: 'Severe stomach pain',           temperature: 38.2, treatment: 'Referred to hospital — parent collected', referredToHospital: true,  attendedBy: 'School Nurse', date: daysAgo(8), parentNotified: true }
  ];

  // Visitor / Gate log
  const visitorLog = [
    { id: uid('vis'), schoolId, visitor: 'Mrs. Felicia Ojo',     toSee: 'Mrs. Bola Akinwale', relation: 'Parent of Fatima Musa', phone: '08099123450', purpose: 'Discuss daughter\'s progress', checkIn: daysAgo(0) + 'T09:15', checkOut: daysAgo(0) + 'T10:02', vehicle: 'Toyota Camry LSD-241-AB' },
    { id: uid('vis'), schoolId, visitor: 'GTBank Sales Rep',     toSee: 'Mr. Olusegun Adebayo', relation: 'Vendor',                phone: '08099123451', purpose: 'School account package',         checkIn: daysAgo(1) + 'T11:00', checkOut: daysAgo(1) + 'T11:45', vehicle: 'Honda Accord' },
    { id: uid('vis'), schoolId, visitor: 'Mr. Sunday Adeleke',   toSee: 'Mr. Adamu Ibrahim',   relation: 'Maintenance',           phone: '08099123452', purpose: 'AC servicing for JSS classes',   checkIn: daysAgo(2) + 'T08:30', checkOut: daysAgo(2) + 'T14:20', vehicle: 'Foot' }
  ];

  // Library catalog (books with borrow tracking)
  const libraryBooks = [
    { id: uid('book'), schoolId, title: 'The Joys of Motherhood',     author: 'Buchi Emecheta',          isbn: '978-0-435-90972-2', category: 'Fiction',  copiesTotal: 5, copiesAvailable: 3, location: 'Shelf A-12' },
    { id: uid('book'), schoolId, title: 'Things Fall Apart',          author: 'Chinua Achebe',           isbn: '978-0-385-47454-2', category: 'Fiction',  copiesTotal: 8, copiesAvailable: 5, location: 'Shelf A-01' },
    { id: uid('book'), schoolId, title: 'New General Mathematics SS1', author: 'M.F. Macrae',             isbn: '978-129-220-052-4', category: 'Maths',    copiesTotal: 30, copiesAvailable: 22, location: 'Shelf C-04' },
    { id: uid('book'), schoolId, title: 'Lamb to the Slaughter',      author: 'Roald Dahl',              isbn: '978-014-100-148-0', category: 'Fiction',  copiesTotal: 6, copiesAvailable: 6, location: 'Shelf A-15' },
    { id: uid('book'), schoolId, title: 'Atlas of Africa',            author: 'Macmillan Reference',     isbn: '978-023-022-941-1', category: 'Reference', copiesTotal: 4, copiesAvailable: 4, location: 'Shelf B-02' },
    { id: uid('book'), schoolId, title: 'STAN Integrated Science',    author: 'STAN',                    isbn: '978-979-302-181-8', category: 'Science',  copiesTotal: 25, copiesAvailable: 18, location: 'Shelf C-08' },
    /* ============ More library variety ============ */
    { id: uid('book'), schoolId, title: 'Purple Hibiscus',            author: 'Chimamanda Ngozi Adichie',isbn: '978-1-56512-038-0', category: 'Fiction',  copiesTotal: 6,  copiesAvailable: 2,  location: 'Shelf A-08' },
    { id: uid('book'), schoolId, title: 'Half of a Yellow Sun',       author: 'Chimamanda Ngozi Adichie',isbn: '978-1-4000-9542-0', category: 'Fiction',  copiesTotal: 5,  copiesAvailable: 5,  location: 'Shelf A-09' },
    { id: uid('book'), schoolId, title: 'Oxford English Dictionary',  author: 'Oxford University Press', isbn: '978-019-957-315-8', category: 'Reference',copiesTotal: 3,  copiesAvailable: 3,  location: 'Shelf B-01' },
    { id: uid('book'), schoolId, title: 'History of Nigeria',         author: 'Toyin Falola',            isbn: '978-052-168-157-4', category: 'History',  copiesTotal: 4,  copiesAvailable: 3,  location: 'Shelf D-02' },
    { id: uid('book'), schoolId, title: 'Essential Yoruba Grammar',   author: 'Ọlátúndé Ọláyẹmí',        isbn: '978-978-029-114-2', category: 'Languages',copiesTotal: 8,  copiesAvailable: 7,  location: 'Shelf E-01' },
    { id: uid('book'), schoolId, title: 'NECO Past Questions (SSS)',  author: 'NECO',                    isbn: '978-978-302-440-6', category: 'Reference',copiesTotal: 10, copiesAvailable: 6,  location: 'Shelf B-05' },
    { id: uid('book'), schoolId, title: 'Africa Encyclopedia (3 vol)', author: 'Cambridge Press',        isbn: '978-052-186-720-3', category: 'Reference',copiesTotal: 1,  copiesAvailable: 1,  location: 'Reference Desk' }
  ];
  const libraryLoans = [
    { id: uid('lln'), schoolId, bookId: libraryBooks[0].id, studentId: 'stu_003', borrowedAt: daysAgo(5),  dueDate: daysAhead(9),  returnedAt: null },
    { id: uid('lln'), schoolId, bookId: libraryBooks[1].id, studentId: 'stu_008', borrowedAt: daysAgo(3),  dueDate: daysAhead(11), returnedAt: null },
    { id: uid('lln'), schoolId, bookId: libraryBooks[0].id, studentId: 'stu_002', borrowedAt: daysAgo(15), dueDate: daysAgo(1),    returnedAt: null }, // overdue
    { id: uid('lln'), schoolId, bookId: libraryBooks[2].id, studentId: 'stu_009', borrowedAt: daysAgo(20), dueDate: daysAgo(6),    returnedAt: daysAgo(5) }
  ];

  // Admission applications (public-facing → admin review queue)
  const admissionApplications = [
    {
      id: 'app_001', schoolId, applicantName: 'Tomide Ogunlana',  parentName: 'Mr. Yinka Ogunlana', parentPhone: '08099234501', parentEmail: 'yinka@example.com', dob: '2015-04-10', gender: 'M', requestedClass: 'cls_pry3', currentSchool: 'Holy Trinity Nursery',   reason: 'Family relocated to Lekki', status: 'pending',  appliedAt: daysAgo(1),
      documents: {
        birthCert:    { name: 'birth-certificate-tomide.pdf', type: 'application/pdf', size: '142 KB', uploaded: true },
        parentId:     { name: 'NIN-ogunlana.jpg', type: 'image/jpeg', size: '96 KB', uploaded: true },
        immunization: { name: 'immunization-record.pdf', type: 'application/pdf', size: '210 KB', uploaded: true },
        photo:        null
      }
    },
    {
      id: 'app_002', schoolId, applicantName: 'Chinaza Okonkwo',  parentName: 'Mrs. Ada Okonkwo',   parentPhone: '08099234502', parentEmail: 'ada@example.com',   dob: '2012-09-22', gender: 'F', requestedClass: 'cls_jss1', currentSchool: 'Greengates Academy',     reason: 'Better academic reputation', status: 'reviewing', appliedAt: daysAgo(3),
      documents: {
        birthCert: { name: 'chinaza-bcert.pdf', type: 'application/pdf', size: '128 KB', uploaded: true },
        parentId:  { name: 'mom-license.jpg',    type: 'image/jpeg',     size: '88 KB',  uploaded: true },
        immunization: null,
        photo:     { name: 'chinaza-passport.jpg', type: 'image/jpeg', size: '54 KB', uploaded: true }
      }
    },
    {
      id: 'app_003', schoolId, applicantName: 'Ibrahim Garba',    parentName: 'Mr. Musa Garba',     parentPhone: '08099234503', parentEmail: 'musa@example.com',  dob: '2010-11-30', gender: 'M', requestedClass: 'cls_sss1', currentSchool: 'Mufti Memorial College', reason: 'Sports scholarship interest', status: 'accepted', appliedAt: daysAgo(10), decidedAt: daysAgo(5),
      documents: {
        birthCert: { name: 'garba-birth.pdf', type: 'application/pdf', size: '156 KB', uploaded: true },
        parentId:  { name: 'musa-NIN.pdf', type: 'application/pdf', size: '102 KB', uploaded: true },
        immunization: { name: 'immunization-garba.pdf', type: 'application/pdf', size: '198 KB', uploaded: true },
        photo:     { name: 'ibrahim-passport.jpg', type: 'image/jpeg', size: '68 KB', uploaded: true }
      }
    },
    /* ============ More applications with varied states ============ */
    {
      id: 'app_004', schoolId, applicantName: 'Adaeze Iheanacho', parentName: 'Mrs. Patricia Iheanacho', parentPhone: '08099234504', parentEmail: 'patricia@example.com', dob: '2018-12-04', gender: 'F', requestedClass: 'cls_nur2', currentSchool: 'Bright Pearls Daycare', reason: 'Sister already attends Bright Lights', status: 'pending', appliedAt: daysAgo(0),
      documents: {
        birthCert:    { name: 'adaeze-bcert.pdf',  type: 'application/pdf', size: '124 KB', uploaded: true },
        parentId:     { name: 'patricia-id.jpg',   type: 'image/jpeg',      size: '92 KB',  uploaded: true },
        immunization: { name: 'imm-adaeze.pdf',    type: 'application/pdf', size: '186 KB', uploaded: true },
        photo:        { name: 'adaeze-photo.jpg',  type: 'image/jpeg',      size: '48 KB',  uploaded: true }
      }
    },
    {
      id: 'app_005', schoolId, applicantName: 'Tunde Adesanya',  parentName: 'Mr. Bayo Adesanya', parentPhone: '08099234505', parentEmail: 'bayo@example.com', dob: '2014-05-19', gender: 'M', requestedClass: 'cls_jss2', currentSchool: 'Lekki Primary', reason: 'Family relocating from Abuja for father\'s job', status: 'reviewing', appliedAt: daysAgo(2),
      documents: {
        birthCert:    { name: 'tunde-bcert.pdf',   type: 'application/pdf', size: '142 KB', uploaded: true },
        parentId:     null,
        immunization: { name: 'tunde-immun.pdf',   type: 'application/pdf', size: '202 KB', uploaded: true },
        photo:        null
      }
    },
    {
      id: 'app_006', schoolId, applicantName: 'Hauwa Bello',     parentName: 'Mr. Saheed Bello', parentPhone: '08099234506', parentEmail: '', dob: '2009-04-08', gender: 'F', requestedClass: 'cls_sss1', currentSchool: 'King\'s College Girls', reason: 'Wants stronger science focus for medical school prep', status: 'rejected', appliedAt: daysAgo(20), decidedAt: daysAgo(12),
      rejectionReason: 'No spaces available in SSS 1 Sciences this term — recommended to reapply next session',
      documents: {
        birthCert:    { name: 'hauwa-bcert.pdf',   type: 'application/pdf', size: '136 KB', uploaded: true },
        parentId:     { name: 'saheed-NIN.jpg',    type: 'image/jpeg',      size: '78 KB',  uploaded: true },
        immunization: null,
        photo:        { name: 'hauwa-photo.jpg',   type: 'image/jpeg',      size: '52 KB',  uploaded: true }
      }
    }
  ];

  // Substitute teacher coverage
  const substituteCoverage = []; // populated dynamically when leave is approved

  // Payroll runs — 4-stage flow: draft → pending_approval → approved → paid
  const _lastMonth = new Date(); _lastMonth.setMonth(_lastMonth.getMonth() - 1);
  const _thisMonth = new Date();
  const _lastMonthLabel = _lastMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const _thisMonthLabel = _thisMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const _payrollBase = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  // PAYE ~7%, Pension ~8% (employee 8% + employer 10% in NG, simplified)
  const _payeRate = 0.07;
  const _pensionEmployeeRate = 0.08;

  const _twoMonthsAgo = new Date(); _twoMonthsAgo.setMonth(_twoMonthsAgo.getMonth() - 2);
  const _twoMonthsAgoLabel = _twoMonthsAgo.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const payrollRuns = [
    /* ============ 2 months ago (older history) ============ */
    {
      id: uid('pr'), schoolId, period: _twoMonthsAgoLabel,
      stage: 'paid',
      grossTotal: _payrollBase,
      netTotal: Math.round(_payrollBase * (1 - _payeRate - _pensionEmployeeRate)),
      payeTotal: Math.round(_payrollBase * _payeRate),
      pensionTotal: Math.round(_payrollBase * _pensionEmployeeRate),
      staffCount: teachers.length,
      adjustments: [],
      computedAt: daysAgo(65),
      submittedAt: daysAgo(64),
      approvedAt: daysAgo(63),
      paidAt: daysAgo(62),
      computedBy: schoolId, submittedBy: schoolId, approvedBy: schoolId, paidBy: schoolId,
      taxRemitted: true, pensionRemitted: true
    },
    {
      id: uid('pr'), schoolId, period: _lastMonthLabel,
      stage: 'paid',
      grossTotal: _payrollBase,
      netTotal: Math.round(_payrollBase * (1 - _payeRate - _pensionEmployeeRate)),
      payeTotal: Math.round(_payrollBase * _payeRate),
      pensionTotal: Math.round(_payrollBase * _pensionEmployeeRate),
      staffCount: teachers.length,
      adjustments: [],
      computedAt: daysAgo(35),
      submittedAt: daysAgo(34),
      approvedAt: daysAgo(33),
      paidAt: daysAgo(32),
      computedBy: 'sch_brightlights', submittedBy: 'sch_brightlights', approvedBy: 'sch_brightlights', paidBy: 'sch_brightlights',
      taxRemitted: true, pensionRemitted: true
    },
    {
      id: uid('pr'), schoolId, period: _thisMonthLabel,
      stage: 'draft',
      grossTotal: _payrollBase,
      netTotal: Math.round(_payrollBase * (1 - _payeRate - _pensionEmployeeRate)),
      payeTotal: Math.round(_payrollBase * _payeRate),
      pensionTotal: Math.round(_payrollBase * _pensionEmployeeRate),
      staffCount: teachers.length,
      adjustments: [
        { staffId: 'tch_adamu',  type: 'bonus',     amount: 25000,  note: 'Best teacher award' },
        { staffId: 'stf_sec',    type: 'overtime',  amount: 8000,   note: 'Saturday duty x 2' },
        { staffId: 'tch_chioma', type: 'deduction', amount: -5000,  note: 'Late arrivals (3 days)' }
      ],
      computedAt: now(),
      computedBy: 'sch_brightlights'
    }
  ];

  // Disbursements ledger (operator-controlled loan payouts to schools)
  const disbursements = [];
  loans.filter(l => l.status === 'active' && l.approvedAt).forEach(l => {
    const sch = schools.find(s => s.id === l.schoolId);
    disbursements.push({
      id: uid('dsb'),
      loanId: l.id,
      schoolId: l.schoolId,
      recipientName: sch ? sch.name : '—',
      recipientAccount: '01' + Math.random().toString().slice(2, 10),
      amount: l.amount,
      status: 'completed',
      method: 'NIBSS transfer',
      reference: 'DSB-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      initiatedAt: l.approvedAt,
      completedAt: l.approvedAt,
      verifiedBy: 'sa_001'
    });
  });

  // System performance metrics (running averages, last 30 days)
  const systemMetrics = {
    apiUptime: 99.92,
    avgResponseMs: 187,
    failedPaymentRate: 2.7,
    crashFreeSessions: 99.7,
    p95ResponseMs: 412,
    backupsLast24h: 1,
    incidentsOpen: 0
  };

  // ============ LMS — Learning Materials (lives alongside Assignments) ============
  const learningMaterials = [
    { id: 'lm_001', schoolId, classId: 'cls_jss1', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Quadratic Equations — Notes', type: 'note', description: 'Full notes on solving quadratics by factorization, completing the square, and the formula.', url: '', file: null, createdAt: daysAgo(5) },
    { id: 'lm_002', schoolId, classId: 'cls_jss1', subjectId: 'sub_sci', teacherId: 'tch_emeka', title: 'States of Matter (Video)', type: 'video', description: 'A short explainer on solids, liquids and gases with everyday examples.', url: 'https://www.youtube.com/watch?v=example', file: null, createdAt: daysAgo(3) },
    { id: 'lm_003', schoolId, classId: 'cls_jss1', subjectId: 'sub_eng', teacherId: 'tch_chioma', title: 'Adjectives & Adverbs — Worksheet', type: 'note', description: 'Practice worksheet with 20 questions on adjectives and adverbs.', url: '', file: null, createdAt: daysAgo(2) },
    { id: 'lm_004', schoolId, classId: 'cls_pry3', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Multiplication Tables Chart', type: 'note', description: 'Printable 1–12 multiplication chart for practice at home.', url: '', file: null, createdAt: daysAgo(6) }
  ];

  // ============ CBT — Exams & Submissions ============
  const cbtExams = [
    { id: 'cbt_001', schoolId, classId: 'cls_jss1', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Mathematics Mid-Term CBT', durationMins: 20, status: 'published', dueDate: daysAhead(5), createdAt: daysAgo(2), rules: 'No calculator. One attempt only.', questions: [
      { id: 'q1', type: 'objective', text: 'What is 12 × 8?', options: ['96', '104', '88', '108'], answer: 0, marks: 1 },
      { id: 'q2', type: 'objective', text: 'Solve: x + 5 = 12. What is x?', options: ['5', '6', '7', '8'], answer: 2, marks: 1 },
      { id: 'q3', type: 'objective', text: 'The LCM of 4 and 6 is?', options: ['12', '24', '6', '8'], answer: 0, marks: 1 },
      { id: 'q4', type: 'objective', text: 'Which fraction is equivalent to 1/2?', options: ['2/3', '3/6', '2/5', '4/9'], answer: 1, marks: 1 },
      { id: 'q5', type: 'theory', text: 'Explain, in your own words, how to find the HCF of two numbers.', marks: 4 }
    ] },
    { id: 'cbt_002', schoolId, classId: 'cls_jss1', subjectId: 'sub_sci', teacherId: 'tch_emeka', title: 'Basic Science Quiz 1', durationMins: 15, status: 'published', dueDate: daysAhead(7), createdAt: daysAgo(1), rules: 'Answer all questions.', questions: [
      { id: 'q1', type: 'objective', text: 'Which of these is NOT a state of matter?', options: ['Solid', 'Liquid', 'Energy', 'Gas'], answer: 2, marks: 1 },
      { id: 'q2', type: 'objective', text: 'Water boils at what temperature (°C)?', options: ['50', '100', '0', '75'], answer: 1, marks: 1 },
      { id: 'q3', type: 'theory', text: 'Give two examples of a gas you encounter every day.', marks: 2 }
    ] }
  ];
  // A graded prior submission from a classmate so teacher review has data on day one
  const cbtSubmissions = [
    { id: 'cbtsub_001', examId: 'cbt_001', studentId: 'stu_009', schoolId, answers: { q1: 0, q2: 2, q3: 1, q4: 1, q5: 'You break each number into prime factors and multiply the common ones.' }, objectiveScore: 4, objectiveMax: 4, theoryScore: 3, theoryMax: 4, totalScore: 7, maxScore: 8, status: 'graded', submittedAt: daysAgo(1), gradedAt: daysAgo(0) }
  ];

  // ============ Digital Consent ============
  const consentForms = [
    { id: 'cf_001', schoolId, title: 'JSS1 Excursion to Lekki Conservation Centre', description: 'We are organising an educational excursion to the Lekki Conservation Centre. Cost of ₦5,000 covers transport and entry. Please approve your child\'s participation.', type: 'excursion', classId: 'cls_jss1', dueDate: daysAhead(6), createdAt: daysAgo(1), createdBy: 'sch_brightlights' },
    { id: 'cf_002', schoolId, title: 'Media & Photography Consent (2025/26)', description: 'We occasionally photograph school activities for our website and brochures. Please indicate whether your child may appear in school media.', type: 'media', classId: 'all', dueDate: daysAhead(20), createdAt: daysAgo(3), createdBy: 'sch_brightlights' }
  ];
  const consentResponses = [
    { id: 'cr_001', formId: 'cf_002', parentId: 'par_bello', studentId: 'stu_003', agreed: true, signature: 'Aisha Bello', timestamp: daysAgo(2) }
  ];

  // ============ HR — Appraisals & Salary Advances ============
  // ============ Appraisal Cycles & multi-step appraisals ============
  // Cycle statuses: draft | self_assessment | manager_review | principal_review | outcomes | closed
  // Individual appraisal statuses: self_pending | manager_pending | principal_pending | outcome_pending | ack_pending | completed
  const appraisalCycles = [
    {
      id: 'cyc_001', schoolId,
      title: '1st Term 2025/26 — Staff Performance Review',
      term: '1st Term 2025/26',
      deadline: daysAhead(14),
      status: 'manager_review',
      staffIds: ['tch_funke', 'tch_adamu', 'tch_chioma', 'tch_emeka', 'tch_bola'],
      createdBy: 'sch_brightlights',
      createdAt: daysAgo(7)
    }
  ];

  const METRICS_SEED = { attendance: 0, resultSubmission: 0, parentFeedback: 0, classroomPerformance: 0 };
  const appraisals = [
    // Chioma — self done, manager done, awaiting principal
    {
      id: 'apr_001', cycleId: 'cyc_001', schoolId, staffId: 'tch_chioma',
      status: 'principal_pending',
      selfScores: { attendance: 88, resultSubmission: 90, parentFeedback: 85, classroomPerformance: 87 },
      selfComment: 'I delivered all lesson plans on time this term and received positive feedback from parents. I would like to improve my use of teaching aids.',
      selfSubmittedAt: daysAgo(5),
      managerScores: { attendance: 85, resultSubmission: 88, parentFeedback: 82, classroomPerformance: 84 },
      managerComment: 'Miss Chioma is a strong, dependable teacher. Her results submission is excellent. Encourage more parent engagement and creative lesson delivery.',
      managerBy: 'sch_brightlights', managerSubmittedAt: daysAgo(2),
      principalComment: '', principalBy: null, principalAt: null,
      finalScores: null, finalOverall: null,
      outcome: null, ackedAt: null, staffResponse: ''
    },
    // Adamu — self done, awaiting manager
    {
      id: 'apr_002', cycleId: 'cyc_001', schoolId, staffId: 'tch_adamu',
      status: 'manager_pending',
      selfScores: { attendance: 92, resultSubmission: 87, parentFeedback: 80, classroomPerformance: 88 },
      selfComment: 'Good term overall. My students showed improvement in Maths. I want to work on being more available to parents.',
      selfSubmittedAt: daysAgo(4),
      managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null,
      principalComment: '', principalBy: null, principalAt: null,
      finalScores: null, finalOverall: null,
      outcome: null, ackedAt: null, staffResponse: ''
    },
    // Emeka — completed, outcome set, awaiting staff acknowledgement
    {
      id: 'apr_003', cycleId: 'cyc_001', schoolId, staffId: 'tch_emeka',
      status: 'ack_pending',
      selfScores: { attendance: 78, resultSubmission: 82, parentFeedback: 75, classroomPerformance: 80 },
      selfComment: 'Solid term. Science lab sessions were engaging. Could improve on timely result submission.',
      selfSubmittedAt: daysAgo(6),
      managerScores: { attendance: 75, resultSubmission: 78, parentFeedback: 72, classroomPerformance: 80 },
      managerComment: 'Mr. Emeka is capable but needs to improve punctuality and result submission timelines.',
      managerBy: 'sch_brightlights', managerSubmittedAt: daysAgo(4),
      principalComment: 'Agreed with manager assessment. Recommend a performance improvement target for next term.',
      principalBy: 'prn_001', principalAt: daysAgo(3),
      finalScores: { attendance: 77, resultSubmission: 80, parentFeedback: 74, classroomPerformance: 80 },
      finalOverall: 78,
      outcome: { type: 'pip', incrementPct: 0, note: 'Performance Improvement Plan: improve punctuality and submit results within 48 hours of exam completion. Review in 2nd Term.' },
      ackedAt: null, staffResponse: ''
    },
    // Funke — self pending (just notified)
    {
      id: 'apr_004', cycleId: 'cyc_001', schoolId, staffId: 'tch_funke',
      status: 'self_pending',
      selfScores: null, selfComment: '', selfSubmittedAt: null,
      managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null,
      principalComment: '', principalBy: null, principalAt: null,
      finalScores: null, finalOverall: null,
      outcome: null, ackedAt: null, staffResponse: ''
    },
    // Bola — self pending
    {
      id: 'apr_005', cycleId: 'cyc_001', schoolId, staffId: 'tch_bola',
      status: 'self_pending',
      selfScores: null, selfComment: '', selfSubmittedAt: null,
      managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null,
      principalComment: '', principalBy: null, principalAt: null,
      finalScores: null, finalOverall: null,
      outcome: null, ackedAt: null, staffResponse: ''
    }
  ];

  const salaryAdvances = [
    { id: 'adv_001', schoolId, staffId: 'tch_funke', amount: 80000, reason: 'Medical emergency', status: 'pending', requestedAt: daysAgo(1), decidedAt: null }
  ];

  // ============ Accounting — Budgets (actuals come from expenses) ============
  const budgets = [
    { id: 'bud_001', schoolId, category: 'Salaries', period: '1st Term 2025/26', planned: 8500000 },
    { id: 'bud_002', schoolId, category: 'Utilities', period: '1st Term 2025/26', planned: 600000 },
    { id: 'bud_003', schoolId, category: 'Maintenance', period: '1st Term 2025/26', planned: 400000 },
    { id: 'bud_004', schoolId, category: 'Supplies', period: '1st Term 2025/26', planned: 500000 }
  ];

  // ============ Help Center articles ============
  const helpArticles = [
    { id: 'ha_001', category: 'Getting Started', question: 'How do I add a new student?', answer: 'Go to Students → Add Student. Fill the form and Save. You can also Bulk Upload many at once via CSV.' },
    { id: 'ha_002', category: 'Fees', question: 'How do I send an invoice to a parent?', answer: 'Open Finance → Invoices, then click the send icon on a row to deliver it to the parent via WhatsApp + email.' },
    { id: 'ha_003', category: 'Results', question: 'How do I publish a result?', answer: 'Open Academic → Results, then click Generate on a student row to publish and share their result with the parent.' },
    { id: 'ha_004', category: 'CBT', question: 'How do students take a CBT?', answer: 'Once you publish a CBT, students see it on their portal under CBT Exams and can take it within the time limit.' },
    { id: 'ha_005', category: 'Account', question: 'How do I reset the demo data?', answer: 'Click your name (top right) → Reset demo data.' }
  ];

  // ============ HOUSES (inter-house competition) ============
  const houses = [
    { id: 'house_red',   schoolId, name: 'Red House',   color: '#ef4444', icon: '🔴', motto: 'Courage and Strength' },
    { id: 'house_blue',  schoolId, name: 'Blue House',  color: '#3b82f6', icon: '🔵', motto: 'Wisdom and Integrity' },
    { id: 'house_green', schoolId, name: 'Green House', color: '#22c55e', icon: '🟢', motto: 'Growth and Harmony' },
    { id: 'house_gold',  schoolId, name: 'Gold House',  color: '#f59e0b', icon: '🟡', motto: 'Excellence and Pride' }
  ];

  const housePoints = [
    // Red House points
    { id: uid('hp'), schoolId, studentId: 'stu_002', houseId: 'house_red', points: 5, reason: 'Excellent Classwork', category: 'Academic', awardedBy: 'tch_adamu', awardedAt: daysAgo(8) },
    { id: uid('hp'), schoolId, studentId: 'stu_001', houseId: 'house_red', points: 3, reason: 'Helped a classmate during recess', category: 'Community Service', awardedBy: 'tch_adamu', awardedAt: daysAgo(6) },
    { id: uid('hp'), schoolId, studentId: 'stu_009', houseId: 'house_red', points: 4, reason: 'Best science project', category: 'Academic', awardedBy: 'tch_emeka', awardedAt: daysAgo(5) },
    { id: uid('hp'), schoolId, studentId: 'stu_002', houseId: 'house_red', points: 2, reason: 'Punctuality all week', category: 'Conduct', awardedBy: 'tch_adamu', awardedAt: daysAgo(3) },
    // Blue House points
    { id: uid('hp'), schoolId, studentId: 'stu_003', houseId: 'house_blue', points: 5, reason: 'Top scorer in Science quiz', category: 'Academic', awardedBy: 'tch_emeka', awardedAt: daysAgo(9) },
    { id: uid('hp'), schoolId, studentId: 'stu_004', houseId: 'house_blue', points: 3, reason: 'Outstanding sports performance', category: 'Sports', awardedBy: 'tch_adamu', awardedAt: daysAgo(7) },
    { id: uid('hp'), schoolId, studentId: 'stu_010', houseId: 'house_blue', points: 4, reason: 'Perfect attendance this month', category: 'Conduct', awardedBy: 'tch_funke', awardedAt: daysAgo(4) },
    { id: uid('hp'), schoolId, studentId: 'stu_003', houseId: 'house_blue', points: 3, reason: 'Literature essay competition winner', category: 'Academic', awardedBy: 'tch_chioma', awardedAt: daysAgo(2) },
    // Green House points
    { id: uid('hp'), schoolId, studentId: 'stu_005', houseId: 'house_green', points: 4, reason: 'Excellent conduct during assembly', category: 'Conduct', awardedBy: 'tch_adamu', awardedAt: daysAgo(10) },
    { id: uid('hp'), schoolId, studentId: 'stu_006', houseId: 'house_green', points: 3, reason: 'Art project displayed in school reception', category: 'Academic', awardedBy: 'tch_chioma', awardedAt: daysAgo(6) },
    { id: uid('hp'), schoolId, studentId: 'stu_005', houseId: 'house_green', points: 2, reason: 'Volunteered to help at open day', category: 'Community Service', awardedBy: 'tch_emeka', awardedAt: daysAgo(3) },
    // Gold House points
    { id: uid('hp'), schoolId, studentId: 'stu_008', houseId: 'house_gold', points: 5, reason: 'Valedictorian runner-up in mock exams', category: 'Academic', awardedBy: 'tch_bola', awardedAt: daysAgo(11) },
    { id: uid('hp'), schoolId, studentId: 'stu_007', houseId: 'house_gold', points: 2, reason: 'Kindness award from junior class', category: 'Community Service', awardedBy: 'tch_funke', awardedAt: daysAgo(5) },
    { id: uid('hp'), schoolId, studentId: 'stu_008', houseId: 'house_gold', points: 3, reason: 'Football match victory', category: 'Sports', awardedBy: 'tch_emeka', awardedAt: daysAgo(2) }
  ];

  // ============ INTER-HOUSE COMPETITION EVENTS ============
  const houseEvents = [
    {
      id: 'hev_001', schoolId, name: 'Inter-House Athletics (Sports Day)', type: 'Sports Day',
      date: daysAgo(21),
      results: [
        { position: 1, houseId: 'house_blue',  points: 50 },
        { position: 2, houseId: 'house_red',   points: 35 },
        { position: 3, houseId: 'house_gold',  points: 20 },
        { position: 4, houseId: 'house_green', points: 10 }
      ],
      recordedBy: 'adm_brightlights', createdAt: daysAgo(21)
    },
    {
      id: 'hev_002', schoolId, name: 'Inter-House Quiz Competition', type: 'Quiz Competition',
      date: daysAgo(10),
      results: [
        { position: 1, houseId: 'house_green', points: 50 },
        { position: 2, houseId: 'house_gold',  points: 35 },
        { position: 3, houseId: 'house_blue',  points: 20 },
        { position: 4, houseId: 'house_red',   points: 10 }
      ],
      recordedBy: 'adm_brightlights', createdAt: daysAgo(10)
    }
  ];

  // ============ DIARY ENTRIES (teacher → parent, per student) ============
  const diaryEntries = [
    { id: uid('de'), schoolId, studentId: 'stu_002', teacherId: 'tch_adamu', category: 'Homework', note: 'Tobi did not submit the Mathematics assignment due today. Please remind him to complete it and submit by Thursday.', date: daysAgo(3), parentRead: true, parentReadAt: daysAgo(2), parentReply: 'Thank you for letting me know. I will speak with him tonight and ensure he submits by Thursday.', parentRepliedAt: daysAgo(2), teacherReadReply: true },
    { id: uid('de'), schoolId, studentId: 'stu_002', teacherId: 'tch_adamu', category: 'Academic', note: 'Tobi scored 16/20 in today\'s Maths class test — a good improvement. Please keep encouraging him at home.', date: daysAgo(1), parentRead: false, parentReadAt: null, parentReply: null, parentRepliedAt: null, teacherReadReply: false },
    { id: uid('de'), schoolId, studentId: 'stu_001', teacherId: 'tch_adamu', category: 'Behaviour', note: 'Chiamaka was very disruptive in class today during Social Studies. She was cautioned twice. Please speak with her about the importance of listening in class.', date: daysAgo(2), parentRead: true, parentReadAt: daysAgo(1), parentReply: 'We sincerely apologise. We will have a serious talk with her. This is not her usual behaviour.', parentRepliedAt: daysAgo(1), teacherReadReply: false },
    { id: uid('de'), schoolId, studentId: 'stu_009', teacherId: 'tch_emeka', category: 'Health', note: 'Ade was looking unwell during third period today. He was given water and allowed to sit out of the outdoor activities. Please monitor him at home.', date: daysAgo(0), parentRead: false, parentReadAt: null, parentReply: null, parentRepliedAt: null, teacherReadReply: false }
  ];

  // ============ SCHOOL EVENTS (admin creates, all roles see) ============
  const schoolEvents = [
    { id: uid('evt'), schoolId, title: 'Mid-Term Break', startDate: daysAhead(5), endDate: daysAhead(9), type: 'holiday', audience: 'all', description: 'School closes for mid-term. Resumes Monday.', createdBy: schoolId, createdAt: daysAgo(3) },
    { id: uid('evt'), schoolId, title: 'PTA Meeting', startDate: daysAhead(12), endDate: daysAhead(12), type: 'meeting', audience: 'parents', description: 'All parents are invited to the end-of-term PTA meeting in the school hall at 10am.', createdBy: schoolId, createdAt: daysAgo(5) },
    { id: uid('evt'), schoolId, title: 'Inter-House Sports Day', startDate: daysAhead(18), endDate: daysAhead(18), type: 'event', audience: 'all', description: 'Annual inter-house sports day. Students should come in their house colours.', createdBy: schoolId, createdAt: daysAgo(7) },
    { id: uid('evt'), schoolId, title: 'End of Term Exams Begin', startDate: daysAhead(22), endDate: daysAhead(29), type: 'exam', audience: 'students', description: 'End of 1st Term examinations. Full timetable to be distributed by class teachers.', createdBy: schoolId, createdAt: daysAgo(10) },
    { id: uid('evt'), schoolId, title: '1st Term Closes', startDate: '2025-12-12', endDate: '2025-12-12', type: 'milestone', audience: 'all', description: 'Last day of the 1st Term 2025/26 academic session.', createdBy: schoolId, createdAt: daysAgo(20) }
  ];

  // ============ FEEDBACK FORMS (admin creates, parents respond) ============
  const feedbackForms = [
    { id: 'ff_001', schoolId, title: 'End of Term 1 Parent Survey 2025/26', questions: [
        { id: 'q1', type: 'star', text: 'How satisfied are you with your child\'s academic progress this term?' },
        { id: 'q2', type: 'yesno', text: 'Are teachers responsive when you contact them?' },
        { id: 'q3', type: 'text', text: 'What can we do better next term?' }
      ], deadline: daysAhead(20), status: 'active', createdBy: schoolId, createdAt: daysAgo(2) }
  ];
  const feedbackResponses = [
    { id: uid('fr'), formId: 'ff_001', schoolId, parentId: 'par_bello', answers: { q1: 4, q2: 'yes', q3: 'More frequent progress updates would be helpful.' }, submittedAt: daysAgo(1) }
  ];

  // ============ PAYSLIPS (individual per staff member) ============
  const _psl = (staffId, period, gross, bonus, status, paidDaysAgo, createdDaysAgo) => {
    const paye     = Math.round(gross * 0.07);
    const pension  = Math.round(gross * 0.08);
    const nhf      = Math.round(gross * 0.025);
    const net      = gross - paye - pension - nhf + (bonus || 0);
    const staff    = teachers.find(t => t.id === staffId);
    return {
      id: uid('psl'), schoolId, staffId, period,
      grossPay: gross,
      deductions: { paye, pension, nhf, total: paye + pension + nhf },
      allowances: { housing: 0, transport: 0, meal: 0, bonus: bonus || 0 },
      netPay: net,
      bankName:    staff && staff.bank ? staff.bank.name    : 'N/A',
      bankAccount: staff && staff.bank ? staff.bank.account : 'N/A',
      status,
      paidAt:    status === 'paid' ? daysAgo(paidDaysAgo) : null,
      createdAt: daysAgo(createdDaysAgo)
    };
  };
  const payslips = [
    _psl('tch_adamu',  'April 2026',  220000,     0, 'paid',    62, 65),
    _psl('tch_adamu',  'May 2026',    220000, 25000, 'paid',    32, 35),
    _psl('tch_adamu',  'June 2026',   220000,     0, 'pending',  0,  3),
    _psl('tch_emeka',  'April 2026',  240000,     0, 'paid',    62, 65),
    _psl('tch_emeka',  'May 2026',    240000,     0, 'paid',    32, 35),
    _psl('tch_emeka',  'June 2026',   240000,     0, 'pending',  0,  3),
    _psl('tch_funke',  'May 2026',    180000,     0, 'paid',    32, 35),
    _psl('tch_funke',  'June 2026',   180000,     0, 'pending',  0,  3),
    _psl('tch_chioma', 'May 2026',    200000,     0, 'paid',    32, 35),
    _psl('tch_chioma', 'June 2026',   200000, -5000, 'pending',  0,  3),
    _psl('tch_bola',   'May 2026',    260000,     0, 'paid',    32, 35),
    _psl('tch_bola',   'June 2026',   260000,     0, 'pending',  0,  3),
    _psl('stf_bursar', 'May 2026',    280000,     0, 'paid',    32, 35),
    _psl('stf_bursar', 'June 2026',   280000,     0, 'pending',  0,  3),
    _psl('stf_nurse',  'May 2026',    165000,     0, 'paid',    32, 35),
    _psl('stf_nurse',  'June 2026',   165000,     0, 'pending',  0,  3),
    _psl('stf_driver', 'May 2026',     95000,     0, 'paid',    32, 35),
    _psl('stf_driver', 'June 2026',    95000,     0, 'pending',  0,  3),
  ];

  // ============ FORMATIVE TESTS (teacher creates per class/subject) ============
  const formativeTests = [
    { id: 'ftest_001', schoolId, classId: 'cls_jss1', subjectId: 'sub_math', teacherId: 'tch_adamu',
      title: 'Algebra Quick Check — Week 6', duration: 15, status: 'active',
      questions: [
        { id: 'q1', text: 'Solve: x + 5 = 12. What is x?', type: 'mcq', options: { A: '5', B: '7', C: '17', D: '3' }, answer: 'B' },
        { id: 'q2', text: 'Which of these is a quadratic equation?', type: 'mcq', options: { A: '2x + 3 = 0', B: 'x² + 3x − 4 = 0', C: 'x/2 = 7', D: '3x − 9 = 0' }, answer: 'B' },
        { id: 'q3', text: 'Factorize: x² − 9', type: 'mcq', options: { A: '(x+3)(x−3)', B: '(x−3)(x−3)', C: '(x+3)(x+3)', D: '(x−9)(x+1)' }, answer: 'A' },
        { id: 'q4', text: 'What is the value of x² when x = 5?', type: 'mcq', options: { A: '10', B: '25', C: '52', D: '15' }, answer: 'B' },
        { id: 'q5', text: 'In your own words, explain what a quadratic equation is.', type: 'short', options: {}, answer: '' }
      ],
      dueDate: daysAhead(7), createdAt: daysAgo(2) },
    { id: 'ftest_002', schoolId, classId: 'cls_jss1', subjectId: 'sub_sci', teacherId: 'tch_emeka',
      title: 'States of Matter — Quick Quiz', duration: 10, status: 'active',
      questions: [
        { id: 'q1', text: 'Which state of matter has a definite shape and volume?', type: 'mcq', options: { A: 'Liquid', B: 'Gas', C: 'Solid', D: 'Plasma' }, answer: 'C' },
        { id: 'q2', text: 'At what temperature (°C) does water boil at sea level?', type: 'mcq', options: { A: '90', B: '95', C: '100', D: '110' }, answer: 'C' },
        { id: 'q3', text: 'What process changes liquid water into steam?', type: 'mcq', options: { A: 'Condensation', B: 'Evaporation', C: 'Melting', D: 'Freezing' }, answer: 'B' },
        { id: 'q4', text: 'Give one example of a gas and describe one of its properties.', type: 'short', options: {}, answer: '' }
      ],
      dueDate: daysAhead(5), createdAt: daysAgo(1) }
  ];
  const formativeSubmissions = [
    { id: uid('fsub'), testId: 'ftest_001', studentId: 'stu_002', schoolId,
      answers: { q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'An equation with the highest power of 2.' },
      score: 4, total: 5, percentage: 80, submittedAt: daysAgo(1) }
  ];

  // ============ TRANSPORT & PICKUP ============
  const busRoutes = [
    { id: 'route_001', schoolId, name: 'Route A — Ikeja / Allen', stops: 'Allen Junction → Ogba Roundabout → Ikeja GRA → School Gate', driverStaffId: 'stf_driver', vehiclePlate: 'LND-421-EK', capacity: 30, departureTime: '06:45', returnTime: '15:30', createdAt: daysAgo(90) },
    { id: 'route_002', schoolId, name: 'Route B — Surulere / Yaba', stops: 'Surulere Market → National Stadium → Yaba Tech → School Gate', driverStaffId: 'stf_driver', vehiclePlate: 'LND-875-GH', capacity: 25, departureTime: '06:30', returnTime: '15:30', createdAt: daysAgo(90) }
  ];
  const busAssignments = [
    { id: uid('ba'), schoolId, studentId: 'stu_001', routeId: 'route_001', direction: 'both',    createdAt: daysAgo(60) },
    { id: uid('ba'), schoolId, studentId: 'stu_002', routeId: 'route_001', direction: 'both',    createdAt: daysAgo(60) },
    { id: uid('ba'), schoolId, studentId: 'stu_005', routeId: 'route_002', direction: 'pickup',  createdAt: daysAgo(30) }
  ];
  const authorizedPickups = [
    { id: uid('ap'), schoolId, studentId: 'stu_003', name: 'Uncle James Adebayo',  relationship: 'Uncle',       phone: '08033456789', status: 'approved', approvedBy: schoolId, approvedAt: daysAgo(14), createdAt: daysAgo(15) },
    { id: uid('ap'), schoolId, studentId: 'stu_001', name: 'Grandma Ngozi Okafor', relationship: 'Grandparent', phone: '08022345678', status: 'approved', approvedBy: schoolId, approvedAt: daysAgo(20), createdAt: daysAgo(21) },
    { id: uid('ap'), schoolId, studentId: 'stu_004', name: 'Aunty Kemi Abiodun',   relationship: 'Aunt/Uncle',  phone: '08098765432', status: 'pending',  approvedBy: null,    approvedAt: null,        createdAt: daysAgo(1) }
  ];

  // ============ SICKBAY VISITS ============
  const sickbayVisits = [
    { id: uid('sv'), schoolId, studentId: 'stu_003', date: daysAgo(5), complaint: 'Headache and mild fever', treatment: 'Paracetamol 500mg given. Rested in sickbay for 40 minutes.', temperature: 38.2, outcome: 'returned_to_class', parentNotified: true,  recordedBy: 'stf_nurse', createdAt: daysAgo(5) },
    { id: uid('sv'), schoolId, studentId: 'stu_009', date: daysAgo(2), complaint: 'Stomach pain after lunch', treatment: 'Warm water given and rested. No fever observed.', temperature: 36.8, outcome: 'returned_to_class', parentNotified: false, recordedBy: 'stf_nurse', createdAt: daysAgo(2) },
    { id: uid('sv'), schoolId, studentId: 'stu_003', date: daysAgo(0), complaint: 'Allergic reaction — skin rash on right arm', treatment: 'Antihistamine cream applied. Parent contacted by phone.', temperature: 36.9, outcome: 'sent_home', parentNotified: true, recordedBy: 'stf_nurse', createdAt: now() },
    { id: uid('sv'), schoolId, studentId: 'stu_006', date: daysAgo(10), complaint: 'Cut on left hand from sports', treatment: 'Wound cleaned and bandaged. Tetanus record checked — up to date.', temperature: 36.5, outcome: 'returned_to_class', parentNotified: false, recordedBy: 'stf_nurse', createdAt: daysAgo(10) }
  ];

  // ============ INVENTORY REQUESTS (teacher requests items) ============
  const inventoryRequests = [
    { id: uid('ir'), schoolId, requestedBy: 'tch_adamu', itemName: 'Mathematics Textbook (JSS1)', quantity: 5, reason: 'New students enrolled mid-term, stock insufficient', status: 'pending', reviewedBy: null, reviewedAt: null, reviewNote: '', createdAt: daysAgo(2) },
    { id: uid('ir'), schoolId, requestedBy: 'tch_emeka', itemName: 'Science Lab Beakers (Set of 10)', quantity: 2, reason: 'Two sets broken during experiments last week', status: 'approved', reviewedBy: schoolId, reviewedAt: daysAgo(0), reviewNote: 'Approved — request raised with supplier.', createdAt: daysAgo(3) }
  ];

  // ============ SCHOOL STORE — items sold to parents ============
  // sellingPrice = what the parent pays | costPrice = what it costs the school to provide
  const schoolItems = [
    { id: 'item_001', schoolId, name: 'School Uniform — Full Set (shirt, trouser/skirt, tie)', category: 'Uniform',     sellingPrice: 20000, costPrice: 15000, unit: 'set',  stock: 120, active: true, createdAt: daysAgo(60) },
    { id: 'item_002', schoolId, name: 'School Uniform — House Sports Kit',                     category: 'Uniform',     sellingPrice: 8000,  costPrice: 5500,  unit: 'set',  stock: 80,  active: true, createdAt: daysAgo(60) },
    { id: 'item_003', schoolId, name: 'Textbook Pack — JSS1 (all subjects)',                  category: 'Books',       sellingPrice: 35000, costPrice: 28000, unit: 'pack', stock: 30,  active: true, createdAt: daysAgo(60) },
    { id: 'item_004', schoolId, name: 'Textbook Pack — JSS2 (all subjects)',                  category: 'Books',       sellingPrice: 35000, costPrice: 28500, unit: 'pack', stock: 25,  active: true, createdAt: daysAgo(60) },
    { id: 'item_005', schoolId, name: 'Exercise Book Bundle (12 books)',                       category: 'Stationery',  sellingPrice: 3000,  costPrice: 1800,  unit: 'bundle', stock: 200, active: true, createdAt: daysAgo(60) },
    { id: 'item_006', schoolId, name: 'School Bag (branded)',                                  category: 'Accessories', sellingPrice: 12000, costPrice: 8500,  unit: 'piece', stock: 50,  active: true, createdAt: daysAgo(60) },
    { id: 'item_007', schoolId, name: 'School Sandals / Shoes',                               category: 'Uniform',     sellingPrice: 9000,  costPrice: 6000,  unit: 'pair', stock: 40,  active: true, createdAt: daysAgo(60) },
    { id: 'item_008', schoolId, name: 'Lunch Box (branded)',                                   category: 'Accessories', sellingPrice: 4500,  costPrice: 2800,  unit: 'piece', stock: 60,  active: true, createdAt: daysAgo(60) }
  ];

  // studentPurchases: items bought by/for a student this term
  const studentPurchases = [
    { id: uid('sp'), schoolId, studentId: 'stu_001', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(45), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_001', itemId: 'item_003', qty: 1, sellingPrice: 35000, costPrice: 28000, purchasedAt: daysAgo(44), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_001', itemId: 'item_005', qty: 1, sellingPrice: 3000,  costPrice: 1800,  purchasedAt: daysAgo(44), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_002', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(43), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_002', itemId: 'item_004', qty: 1, sellingPrice: 35000, costPrice: 28500, purchasedAt: daysAgo(42), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_002', itemId: 'item_006', qty: 1, sellingPrice: 12000, costPrice: 8500,  purchasedAt: daysAgo(42), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_003', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(40), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_003', itemId: 'item_002', qty: 1, sellingPrice: 8000,  costPrice: 5500,  purchasedAt: daysAgo(40), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_004', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(38), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_004', itemId: 'item_003', qty: 1, sellingPrice: 35000, costPrice: 28000, purchasedAt: daysAgo(38), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_005', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(36), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_005', itemId: 'item_007', qty: 1, sellingPrice: 9000,  costPrice: 6000,  purchasedAt: daysAgo(35), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_006', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(30), paidStatus: 'unpaid', notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_006', itemId: 'item_005', qty: 2, sellingPrice: 3000,  costPrice: 1800,  purchasedAt: daysAgo(30), paidStatus: 'unpaid', notes: 'Double set requested' },
    { id: uid('sp'), schoolId, studentId: 'stu_009', itemId: 'item_001', qty: 1, sellingPrice: 20000, costPrice: 15000, purchasedAt: daysAgo(25), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_009', itemId: 'item_006', qty: 1, sellingPrice: 12000, costPrice: 8500,  purchasedAt: daysAgo(25), paidStatus: 'paid',   notes: '' },
    { id: uid('sp'), schoolId, studentId: 'stu_009', itemId: 'item_008', qty: 1, sellingPrice: 4500,  costPrice: 2800,  purchasedAt: daysAgo(24), paidStatus: 'paid',   notes: '' }
  ];

  return {
    schools, classes, subjects, teachers, parents, students,
    feeStructures, invoices, transactions, attendance, results,
    assignments, conversations, announcements, inventory,
    discipline, loans, timetable, lessonPlans, expenses,
    auditLog, notifications, leaveRequests, staffAttendance,
    supportTickets, remittances,
    schoolInvoices, commissions, usageEvents, errorLogs, systemMetrics,
    disbursements,
    academicSessions, academicTerms, arms, academicCalendar, platformTeam, schoolRoles, payrollRuns,
    schemesOfWork,
    loginSessions, sickBayRecords, visitorLog,
    libraryBooks, libraryLoans, admissionApplications, substituteCoverage,
    activities, studentActivities, reportComments: [],
    learningMaterials, cbtExams, cbtSubmissions, consentForms, consentResponses,
    appraisalCycles, appraisals, salaryAdvances, budgets, helpArticles,
    houses, housePoints, houseEvents, diaryEntries, schoolEvents, feedbackForms, feedbackResponses,
    payslips, formativeTests, formativeSubmissions,
    busRoutes, busAssignments, authorizedPickups, busStatus: [],
    sickbayVisits, inventoryRequests,
    schoolItems, studentPurchases,
    smsCampaigns: [],
    settings: {
      currentSchoolId: 'sch_brightlights',
      currentTerm: '1st Term 2025/26',
      currency: 'NGN',
      gradeScale: [
        { min: 75, grade: 'A', remark: 'Excellent' },
        { min: 60, grade: 'B', remark: 'Very Good' },
        { min: 50, grade: 'C', remark: 'Good' },
        { min: 45, grade: 'D', remark: 'Fair' },
        { min: 40, grade: 'E', remark: 'Pass' },
        { min: 0,  grade: 'F', remark: 'Fail' }
      ],
      offlineMode: false,
      pendingSync: 0
    }
  };
}

/* ---------- DB Interface ---------- */
const DB = {
  _data: null,
  load() {
    if (this._data) return this._data;
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try { this._data = JSON.parse(raw); return this._data; }
      catch (e) { console.warn('DB corrupt, reseeding'); }
    }
    this._data = seedDatabase();
    this.save();
    return this._data;
  },
  save() { localStorage.setItem(DB_KEY, JSON.stringify(this._data)); },
  reset() { localStorage.removeItem(DB_KEY); this._data = null; this.load(); },
  get(table) { return (this.load()[table] || []).slice(); },
  set(table, rows) { this.load()[table] = rows; this.save(); },
  insert(table, row) {
    const d = this.load();
    if (!d[table]) d[table] = [];
    d[table].push(row);
    this.save();
    return row;
  },
  update(table, id, patch) {
    const d = this.load();
    if (!d[table]) return null;
    const idx = d[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    d[table][idx] = { ...d[table][idx], ...patch };
    this.save();
    return d[table][idx];
  },
  remove(table, id) {
    const d = this.load();
    if (!d[table]) return;
    d[table] = d[table].filter(r => r.id !== id);
    this.save();
  },
  find(table, id) {
    const t = this.load()[table];
    if (!t) return undefined;
    return t.find(r => r.id === id);
  },
  query(table, predicate) {
    const t = this.load()[table];
    if (!t) return [];
    return t.filter(predicate);
  },
  settings(patch) {
    const d = this.load();
    if (patch) { d.settings = { ...d.settings, ...patch }; this.save(); }
    return d.settings;
  }
};

/* ---------- Computed helpers ---------- */
const COMPUTE = {
  studentsByClass(classId) { return DB.query('students', s => s.classId === classId && s.status === 'active'); },
  parentChildren(parentId) { return DB.query('students', s => s.parentId === parentId); },
  studentInvoice(studentId) { return DB.query('invoices', i => i.studentId === studentId)[0]; },
  studentResults(studentId) { return DB.query('results', r => r.studentId === studentId); },
  studentAttendance(studentId) { return DB.query('attendance', a => a.studentId === studentId); },
  attendanceRate(studentId) {
    const recs = this.studentAttendance(studentId);
    if (!recs.length) return 0;
    const present = recs.filter(r => r.status !== 'absent').length;
    return Math.round((present / recs.length) * 100);
  },
  classAttendance(classId, date) {
    return DB.query('attendance', a => a.classId === classId && a.date === date);
  },
  parentLoans(parentId) { return DB.query('loans', l => l.parentId === parentId); },
  conversationsFor(userId) {
    return DB.query('conversations', c => c.participants.includes(userId));
  },
  unreadCount(userId) {
    return DB.query('notifications', n => n.userId === userId && !n.read).length;
  },
  // Financial summary
  schoolRevenue(schoolId) {
    const txns = DB.query('transactions', t => t.schoolId === schoolId && t.status === 'successful');
    return txns.reduce((s, t) => s + t.amount, 0);
  },
  schoolExpenses(schoolId) {
    return DB.query('expenses', e => e.schoolId === schoolId).reduce((s, e) => s + e.amount, 0);
  },
  outstandingFees(schoolId) {
    return DB.query('invoices', i => i.schoolId === schoolId).reduce((s, i) => s + i.balance, 0);
  },
  // Credit scoring
  computeCreditScore(parentId) {
    const txns = DB.query('transactions', t => DB.query('invoices', i => i.studentId).map(i => i.id).includes(t.invoiceId));
    const inv = DB.query('invoices', i => {
      const s = DB.find('students', i.studentId);
      return s && s.parentId === parentId;
    });
    if (!inv.length) return 600;
    const onTime = inv.filter(i => i.status === 'paid').length;
    const partial = inv.filter(i => i.status === 'partial').length;
    const outstanding = inv.filter(i => i.status === 'outstanding').length;
    const parent = DB.find('parents', parentId);
    let score = 600;
    score += onTime * 50;
    score += partial * 20;
    score -= outstanding * 30;
    if (parent && parent.monthlyIncome > 500000) score += 40;
    if (parent && parent.monthlyIncome > 1000000) score += 30;
    // Tenure bonus
    score += 20;
    return Math.max(300, Math.min(850, score));
  },
  // Grade from total score
  gradeFromScore(total) {
    const scale = DB.settings().gradeScale;
    for (const s of scale) if (total >= s.min) return { grade: s.grade, remark: s.remark };
    return { grade: 'F', remark: 'Fail' };
  },
  // Student gamification — stars, points and badges from real activity
  studentRewards(studentId) {
    const disc = DB.query('discipline', d => d.studentId === studentId);
    const commendPts = disc.filter(d => d.type === 'commendation').reduce((s, d) => s + Math.abs(d.points || 0), 0);
    const results = this.studentResults(studentId).filter(r => r.approved);
    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.total, 0) / results.length) : 0;
    const attRate = this.attendanceRate(studentId);
    // Points: commendations + academic + attendance bonus
    const points = commendPts * 10 + Math.round(avg * 2) + (attRate >= 90 ? 30 : 0);
    const stars = Math.max(1, Math.min(5, Math.round(avg / 20)));
    const badges = [];
    if (avg >= 75) badges.push({ icon: '🏆', label: 'Top Performer' });
    if (attRate >= 90) badges.push({ icon: '📅', label: 'Great Attendance' });
    if (commendPts >= 5) badges.push({ icon: '⭐', label: 'Well Behaved' });
    if (results.some(r => r.grade === 'A')) badges.push({ icon: '🥇', label: 'Grade A Scorer' });
    const subs = DB.query('cbtSubmissions', s => s.studentId === studentId);
    if (subs.length) badges.push({ icon: '💻', label: 'CBT Champion' });
    if (!badges.length) badges.push({ icon: '🌱', label: 'Rising Star' });
    return { points, stars, badges, commendPts, avg, attRate };
  }
};

// Init on load
DB.load();
