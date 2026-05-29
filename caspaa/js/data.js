/* ============================================================
   CASPAA DATA LAYER
   - LocalStorage-backed mock database
   - Seed data simulates a real Lagos school
   ============================================================ */

const DB_KEY = 'caspaa_db_v1';
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
    { id: 'tch_funke',  schoolId, name: 'Mrs. Funke Adeyemi',  email: 'funke@brightlights.ng',  phone: '08012345601', subject: 'Nursery Teacher',  classes: ['cls_nur1','cls_nur2'], hireDate: '2022-09-01', salary: 180000, role: 'teacher' },
    { id: 'tch_adamu',  schoolId, name: 'Mr. Adamu Ibrahim',   email: 'adamu@brightlights.ng', phone: '08012345602', subject: 'Mathematics', classes: ['cls_pry1','cls_pry2','cls_jss1'], hireDate: '2021-09-01', salary: 220000, role: 'teacher' },
    { id: 'tch_chioma', schoolId, name: 'Miss Chioma Okeke',   email: 'chioma@brightlights.ng',phone: '08012345603', subject: 'English Language', classes: ['cls_pry3','cls_jss1'], hireDate: '2023-01-15', salary: 200000, role: 'teacher' },
    { id: 'tch_emeka',  schoolId, name: 'Mr. Emeka Nwosu',     email: 'emeka@brightlights.ng', phone: '08012345604', subject: 'Basic Science', classes: ['cls_jss1','cls_jss2'], hireDate: '2020-09-01', salary: 240000, role: 'teacher' },
    { id: 'tch_bola',   schoolId, name: 'Mrs. Bola Akinwale',  email: 'bola@brightlights.ng',  phone: '08012345605', subject: 'Civic Education', classes: ['cls_sss1'], hireDate: '2019-09-01', salary: 260000, role: 'teacher' }
  ];

  const parents = [
    { id: 'par_okafor', schoolId, name: 'Mr. Tunde Okafor',    email: 'parent@demo.ng',         phone: '08099999001', occupation: 'Software Engineer', monthlyIncome: 850000, address: '12 Admiralty Way, Lekki' },
    { id: 'par_bello',  schoolId, name: 'Mrs. Aisha Bello',    email: 'aisha.bello@gmail.com',  phone: '08099999002', occupation: 'Doctor', monthlyIncome: 1200000, address: '5 Bourdillon Rd, Ikoyi' },
    { id: 'par_eze',    schoolId, name: 'Mr. Chinedu Eze',     email: 'eze.chinedu@yahoo.com',  phone: '08099999003', occupation: 'Trader', monthlyIncome: 420000, address: '8 Allen Avenue, Ikeja' },
    { id: 'par_musa',   schoolId, name: 'Mrs. Hauwa Musa',     email: 'hauwa.m@outlook.com',    phone: '08099999004', occupation: 'Civil Servant', monthlyIncome: 320000, address: '22 Adeniyi Jones, Ikeja' },
    { id: 'par_lawal',  schoolId, name: 'Mr. Kunle Lawal',     email: 'klawal@gmail.com',       phone: '08099999005', occupation: 'Banker', monthlyIncome: 780000, address: '7 Banana Island' }
  ];

  const students = [
    { id: 'stu_001', schoolId, name: 'Chiamaka Okafor', admissionNo: 'BL/2024/001', classId: 'cls_pry3', dob: '2016-04-12', gender: 'F', parentId: 'par_okafor', photo: null, admissionDate: '2024-09-01', bloodGroup: 'O+', status: 'active' },
    { id: 'stu_002', schoolId, name: 'Tobi Okafor',     admissionNo: 'BL/2024/002', classId: 'cls_jss1', dob: '2013-08-22', gender: 'M', parentId: 'par_okafor', photo: null, admissionDate: '2024-09-01', bloodGroup: 'O+', status: 'active' },
    { id: 'stu_003', schoolId, name: 'Zainab Bello',    admissionNo: 'BL/2024/003', classId: 'cls_jss2', dob: '2012-02-10', gender: 'F', parentId: 'par_bello',  photo: null, admissionDate: '2023-09-01', bloodGroup: 'A+', status: 'active' },
    { id: 'stu_004', schoolId, name: 'Yusuf Bello',     admissionNo: 'BL/2024/004', classId: 'cls_pry2', dob: '2017-06-30', gender: 'M', parentId: 'par_bello',  photo: null, admissionDate: '2024-09-01', bloodGroup: 'A+', status: 'active' },
    { id: 'stu_005', schoolId, name: 'Daniel Eze',      admissionNo: 'BL/2024/005', classId: 'cls_pry1', dob: '2018-11-05', gender: 'M', parentId: 'par_eze',    photo: null, admissionDate: '2024-09-01', bloodGroup: 'B+', status: 'active' },
    { id: 'stu_006', schoolId, name: 'Ngozi Eze',       admissionNo: 'BL/2024/006', classId: 'cls_pry3', dob: '2016-01-18', gender: 'F', parentId: 'par_eze',    photo: null, admissionDate: '2024-09-01', bloodGroup: 'B+', status: 'active' },
    { id: 'stu_007', schoolId, name: 'Ibrahim Musa',    admissionNo: 'BL/2024/007', classId: 'cls_nur2', dob: '2020-03-15', gender: 'M', parentId: 'par_musa',   photo: null, admissionDate: '2024-09-01', bloodGroup: 'AB+', status: 'active' },
    { id: 'stu_008', schoolId, name: 'Fatima Musa',     admissionNo: 'BL/2024/008', classId: 'cls_sss1', dob: '2009-07-09', gender: 'F', parentId: 'par_musa',   photo: null, admissionDate: '2022-09-01', bloodGroup: 'AB+', status: 'active' },
    { id: 'stu_009', schoolId, name: 'Ade Lawal',       admissionNo: 'BL/2024/009', classId: 'cls_jss1', dob: '2013-12-01', gender: 'M', parentId: 'par_lawal',  photo: null, admissionDate: '2023-09-01', bloodGroup: 'O-', status: 'active' },
    { id: 'stu_010', schoolId, name: 'Bisi Lawal',      admissionNo: 'BL/2024/010', classId: 'cls_pry2', dob: '2017-09-25', gender: 'F', parentId: 'par_lawal',  photo: null, admissionDate: '2024-09-01', bloodGroup: 'O-', status: 'active' }
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

  // Invoices — generated from fee structures per student. Some paid, some partial, some outstanding.
  const invoices = [];
  students.forEach((s, idx) => {
    const fs = feeStructures.find(f => f.classId === s.classId);
    const total = fs.tuition + fs.books + fs.uniform + fs.pta;
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
        { name: 'PTA Levy', amount: fs.pta }
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
    { id: uid('asn'), schoolId, classId: 'cls_jss1', subjectId: 'sub_math', teacherId: 'tch_adamu', title: 'Algebra Practice - Set 3', description: 'Solve exercises 1-15 from page 42 of your textbook. Show all working steps.', dueDate: daysAhead(3), createdAt: daysAgo(2), submissions: [] },
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
  const inventory = [
    { id: uid('inv'), schoolId, name: 'Mathematics Textbook (JSS1)', category: 'Books', quantity: 48, minStock: 20, unitCost: 4500, supplier: 'Macmillan' },
    { id: uid('inv'), schoolId, name: 'English Workbook (Primary)', category: 'Books', quantity: 15, minStock: 25, unitCost: 3200, supplier: 'University Press' },
    { id: uid('inv'), schoolId, name: 'School Uniform - Daily Wear', category: 'Uniform', quantity: 80, minStock: 30, unitCost: 8500, supplier: 'Bright Tailors' },
    { id: uid('inv'), schoolId, name: 'A4 Plain Sheets (Reams)', category: 'Stationery', quantity: 12, minStock: 10, unitCost: 4800, supplier: 'Office Mart' },
    { id: uid('inv'), schoolId, name: 'Whiteboard Markers (Box)', category: 'Stationery', quantity: 8, minStock: 5, unitCost: 2400, supplier: 'Office Mart' },
    { id: uid('inv'), schoolId, name: 'Projector - Epson EB-X06', category: 'Equipment', quantity: 3, minStock: 1, unitCost: 285000, supplier: 'TechZone' }
  ];

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
    { id: uid('exp'), schoolId, category: 'Salaries', amount: 1100000, description: 'November teacher salaries', date: daysAgo(15), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Utilities', amount: 85000, description: 'Diesel for generator', date: daysAgo(10), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Maintenance', amount: 120000, description: 'Classroom paint and repairs', date: daysAgo(20), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Supplies', amount: 65000, description: 'Stationery and consumables', date: daysAgo(7), recordedBy: 'sch_brightlights' },
    { id: uid('exp'), schoolId, category: 'Internet', amount: 35000, description: 'Monthly internet subscription', date: daysAgo(5), recordedBy: 'sch_brightlights' }
  ];

  // Audit log
  const auditLog = [
    { id: uid('aud'), schoolId, actor: 'sch_brightlights', action: 'created_school', target: 'Bright Lights Academy', timestamp: daysAgo(30) },
    { id: uid('aud'), schoolId, actor: 'sch_brightlights', action: 'added_student', target: 'Chiamaka Okafor', timestamp: daysAgo(30) },
    { id: uid('aud'), schoolId, actor: 'tch_adamu', action: 'submitted_result', target: 'JSS1 Mathematics', timestamp: daysAgo(2) }
  ];

  // Schools (for super admin view)
  const schools = [
    { id: 'sch_brightlights', name: 'Bright Lights Academy', proprietor: 'Mr. Olusegun Adebayo', email: 'admin@brightlights.ng', phone: '+234 802 555 0001', address: '15 Liberty Estate, Lekki, Lagos', students: 10, teachers: 5, subscriptionPlan: 'Growth', monthlyFee: 75000, status: 'active', joinedAt: daysAgo(180) },
    { id: 'sch_horizon', name: 'Horizon International School', proprietor: 'Mrs. Adaeze Nkem', email: 'admin@horizon.ng', phone: '+234 803 555 0002', address: '8 Adetokunbo Ademola, VI, Lagos', students: 380, teachers: 28, subscriptionPlan: 'Enterprise', monthlyFee: 280000, status: 'active', joinedAt: daysAgo(240) },
    { id: 'sch_excellence', name: 'Excellence Group of Schools', proprietor: 'Pastor John Adekola', email: 'office@excellence.ng', phone: '+234 805 555 0003', address: '22 Awolowo Way, Ikeja, Lagos', students: 215, teachers: 18, subscriptionPlan: 'Growth', monthlyFee: 150000, status: 'active', joinedAt: daysAgo(120) },
    { id: 'sch_montessori', name: 'Little Stars Montessori', proprietor: 'Dr. Ngozi Iheanacho', email: 'info@littlestars.ng', phone: '+234 806 555 0004', address: '5 Banana Island Rd, Ikoyi', students: 95, teachers: 11, subscriptionPlan: 'Starter', monthlyFee: 45000, status: 'trial', joinedAt: daysAgo(15) },
    { id: 'sch_anchor', name: 'Anchor Comprehensive College', proprietor: 'Chief Tunde Bakare', email: 'admin@anchorcollege.ng', phone: '+234 807 555 0005', address: '14 Magodo Phase 2, Lagos', students: 540, teachers: 38, subscriptionPlan: 'Enterprise', monthlyFee: 380000, status: 'active', joinedAt: daysAgo(310) },
    { id: 'sch_paula', name: 'Paula Heights School', proprietor: 'Mrs. Paula Okeke', email: 'paula@pauleheights.ng', phone: '+234 808 555 0006', address: '11 Festac Town, Lagos', students: 140, teachers: 12, subscriptionPlan: 'Growth', monthlyFee: 95000, status: 'suspended', joinedAt: daysAgo(95) }
  ];

  // Notifications (in-app)
  const notifications = [
    { id: uid('not'), userId: 'par_okafor', title: 'Fee Reminder', body: 'School fees for 1st Term are due in 15 days', type: 'warn', read: false, timestamp: daysAgo(1) },
    { id: uid('not'), userId: 'par_okafor', title: 'New Announcement', body: 'PTA Meeting this Saturday', type: 'info', read: false, timestamp: daysAgo(7) },
    { id: uid('not'), userId: 'par_okafor', title: 'Assignment Posted', body: 'New Maths assignment for Tobi', type: 'info', read: true, timestamp: daysAgo(2) },
    { id: uid('not'), userId: 'tch_adamu', title: 'Result Awaiting Approval', body: 'JSS1 Mathematics results submitted', type: 'info', read: false, timestamp: daysAgo(1) }
  ];

  return {
    schools, classes, subjects, teachers, parents, students,
    feeStructures, invoices, transactions, attendance, results,
    assignments, conversations, announcements, inventory,
    discipline, loans, timetable, lessonPlans, expenses,
    auditLog, notifications,
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
    const idx = d[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    d[table][idx] = { ...d[table][idx], ...patch };
    this.save();
    return d[table][idx];
  },
  remove(table, id) {
    const d = this.load();
    d[table] = d[table].filter(r => r.id !== id);
    this.save();
  },
  find(table, id) { return this.load()[table].find(r => r.id === id); },
  query(table, predicate) { return this.load()[table].filter(predicate); },
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
  }
};

// Init on load
DB.load();
