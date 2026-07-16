// Central content for the CASPAA marketing site.
// Keeping copy here keeps the page components DRY and easy to update.

export const CONTACT = {
  email: 'info@caspaa.org',
  phones: ['0803 201 1561', '0803 200 1561'],
  tagline: 'The all-in-one digital infrastructure for African schools.',
}

export const NAV_LINKS = [
  { label: 'Home', href: '/home' },
  { label: 'Solutions', href: '/solutions/proprietors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
]

export const HERO = {
  eyebrow: 'THE SCHOOL OPERATING SYSTEM',
  title: 'Run your entire school on one platform.',
  subtitle:
    'CASPAA replaces the disconnected tools your school juggles today — admissions, fees, payments, attendance, results, communication and accounting — with a single Edu-Fintech operating system. Online or offline, you get complete visibility and control.',
  microtrust: 'No spreadsheets. No manual reconciliation. No waiting for reports.',
}

export const METRICS = [
  { value: '₦3.6m+', label: 'Fees collected & reconciled' },
  { value: '2,000+', label: 'Students managed' },
  { value: '50+', label: 'Schools running on CASPAA' },
  { value: '99.9%', label: 'Uptime, online & offline' },
]

export const PROBLEMS = [
  {
    icon: 'trending-down',
    title: 'Revenue leakage',
    body: 'Untracked fees, missed reminders and manual reconciliation quietly drain income every term.',
  },
  {
    icon: 'puzzle',
    title: 'Disconnected tools',
    body: 'Records, fees, accounting and communication live in separate systems that never sync.',
  },
  {
    icon: 'wifi-off',
    title: 'Internet dependency',
    body: 'When the network drops, work stops — attendance, payments and updates all stall.',
  },
  {
    icon: 'hourglass',
    title: 'Reports that arrive too late',
    body: 'By the time you get the numbers, the decision window has already closed.',
  },
]

export const PLATFORM_TILES = [
  { icon: 'cloud-off', title: 'Works Offline', body: 'Mark attendance and keep working with no signal; syncs automatically when you reconnect.' },
  { icon: 'card', title: 'Payments', body: 'Parents pay fees in 30 seconds through secure, integrated payment infrastructure.' },
  { icon: 'bank', title: 'Fee Financing', body: 'School-fee lending with loans approved in as little as 24 hours.' },
  { icon: 'sparkles', title: 'AI Assistant', body: 'Write report comments, insights and summaries instantly.' },
  { icon: 'file-edit', title: 'CBT & Learning', body: 'Run digital tests and exams for every class.' },
  { icon: 'check-circle', title: 'Digital Consent', body: 'Approve activities and trips online — no paper forms.' },
]

export const ROLES = [
  {
    slug: 'proprietors',
    tab: 'Proprietors',
    name: 'Proprietors & School Owners',
    headline: 'Total visibility. Total control. From anywhere.',
    body: 'Open your dashboard and instantly see the health of your school — revenue collected today, outstanding fees, enrolment trends, staff attendance and financial performance. Spot revenue leakage before it happens, and make decisions backed by real numbers, not guesswork.',
    bullets: [
      'Executive dashboards & analytics',
      'Revenue management & real-time reconciliation',
      'Financial performance & growth indicators',
      'Multi-branch school support',
      'Staff accountability & attendance oversight',
      'Actionable business intelligence',
    ],
    punch: 'Most systems tell you what happened. CASPAA helps you decide what happens next.',
  },
  {
    slug: 'principals',
    tab: 'Principals',
    name: 'Principals & Administrators',
    headline: 'Run the whole school day from a single screen.',
    body: 'From admissions to academics to operations, CASPAA gives administrators one command centre. Manage enrolment, oversee staff, track attendance, publish results and keep parents informed — all without switching tools.',
    bullets: [
      'Student & admissions management (end-to-end)',
      'Academic administration & timetabling',
      'Staff & human resources management',
      'Finance & school operations',
      'Communication & engagement',
      'Transport & student safety',
      'Reports, analytics & security controls',
    ],
    punch: 'One command centre for the entire school.',
  },
  {
    slug: 'teachers',
    tab: 'Teachers',
    name: 'Teachers',
    headline: 'Less admin. More teaching.',
    body: "Clock in, take attendance, set assignments, grade results and message parents — in minutes. CASPAA's AI-powered tools even help you write report comments and plan lessons, so you get your evenings back.",
    bullets: [
      'Digital clock-in / clock-out & attendance',
      'Results & grading',
      'Assignments, homework & CBT assessments',
      'Lesson planning & resources',
      'Parent communication diary',
      'Class timetable, leave & payslips',
      'AI-powered teaching tools',
    ],
    punch: 'Get your evenings back.',
  },
  {
    slug: 'parents',
    tab: 'Parents',
    name: 'Parents',
    headline: "Your child's school, in your pocket.",
    body: 'Pay fees in seconds, approve trips digitally, follow attendance and results in real time, and stay in the loop on everything — from house points to health and welfare. No more missed notices, no more paper forms.',
    bullets: [
      'Digital consent forms',
      'Child dashboard & monitoring',
      'Fees, payments & school-fee financing',
      'Results & academic records',
      'Attendance & activity tracking',
      'Transport & child safety',
      'Calendar, events, health & welfare',
    ],
    punch: 'Never miss a notice again.',
  },
  {
    slug: 'students',
    tab: 'Students',
    name: 'Students',
    headline: 'Everything you need to learn and stay on track.',
    body: 'Assignments, timetables, results and study resources in one place — plus house points and gamification that make progress feel rewarding.',
    bullets: [
      'Dashboard & overview',
      'Learning & study resources',
      'Assignments & assessments (CBT)',
      'Results & academic performance',
      'Timetable & calendar',
      'Notifications & status updates',
      'Responsibility, accountability & house points',
    ],
    punch: 'Progress that feels rewarding.',
  },
  {
    slug: 'finance',
    tab: 'Finance',
    name: 'Finance & Accounting',
    headline: 'From collection to reconciliation, automatically.',
    body: 'CASPAA turns fee collection into a closed loop: parents pay through secure channels, payments reconcile in real time, and your books stay current. Generate P&L, trial balance and balance sheet reports without a separate accounting system.',
    bullets: [
      'Automated collections & real-time reconciliation',
      'Integrated accounting (P&L, trial balance, balance sheet)',
      'Revenue analytics & reporting',
      'Payroll & staff salary advances',
      'School-fee lending',
      'Inventory management',
    ],
    punch: 'A closed loop, from payment to books.',
  },
]

export const FEATURE_DEEPDIVES = [
  {
    eyebrow: 'WORKS WHERE YOU WORK',
    title: 'The network drops. Your school doesn’t.',
    body: 'CASPAA is built offline-first. Teachers mark attendance, students take tests, and staff keep working with no internet at all. The moment you reconnect, everything syncs automatically — no lost data, no duplicated effort. In a region where connectivity is never guaranteed, this isn’t a nice-to-have. It’s the difference between a system that works and one that stalls.',
    stat: '100% of core operations available offline.',
    points: ['Attendance without signal', 'Automatic background sync', 'Zero lost data'],
  },
  {
    eyebrow: 'THE FINTECH ADVANTAGE',
    title: 'Turn fee collection into a growth engine.',
    body: 'Secure payment infrastructure lets parents pay in 30 seconds — online or at the bank — while automated reminders chase outstanding fees for you. Every naira reconciles in real time, so revenue leakage disappears. And when families need flexibility, school-fee lending approves loans in as little as 24 hours.',
    stat: 'Loans approved in as little as 24 hours.',
    points: ['Secure multi-channel payments', 'Automated fee reminders', 'School-fee lending'],
  },
  {
    eyebrow: 'GROW YOUR SCHOOL',
    title: 'End-to-end admissions, from enquiry to enrolment.',
    body: 'Capture every enquiry, manage applications, and convert new intakes without paper or lost leads. CASPAA gives you a clean pipeline from first contact to first day — so growth is something you manage, not something you chase.',
    stat: 'One pipeline: enquiry → enrolled.',
    points: ['Enquiry capture', 'Application tracking', 'New-intake management'],
  },
  {
    eyebrow: 'DECIDE WHAT HAPPENS NEXT',
    title: 'Business intelligence for the people who run schools.',
    body: 'CASPAA doesn’t just store data — it turns it into decisions. Executive dashboards surface the metrics that matter, while AI writes report comments, summarises performance and highlights what needs your attention. Advanced analytics and multi-branch views give owners the full picture at a glance.',
    stat: 'AI-assisted insights, on demand.',
    points: ['Executive dashboards', 'AI report comments', 'Multi-branch analytics'],
  },
]

export const COMPARISON = [
  ['Manages records', 'Powers school operations'],
  ['Tracks fees', 'Automates collections & reconciliation'],
  ['Generates reports', 'Delivers business intelligence'],
  ['Manual consent forms', 'Digital parent consent management'],
  ['Internet dependent', 'Offline-first capability'],
  ['Basic admissions', 'End-to-end admissions & enrolment'],
  ['Separate accounting systems', 'Integrated accounting & finance'],
  ['Basic communication', 'WhatsApp, email & automated notifications'],
]

export const ADVANTAGES = [
  'Offline technology capabilities',
  'Digital staff attendance management',
  'Digital parent consent',
  'Digital clock-in / clock-out student attendance',
  'Live chat & 24/7 client support',
  'Secure payment infrastructure',
  'Admission & new-intake management',
  'Automated event & fee reminders',
  'Executive dashboards & analytics',
  'WhatsApp & email engagement',
  'Accounting management',
  'Revenue management',
  'Real-time automated reconciliation',
  'Customisation',
]

export const OUTCOMES = [
  { icon: 'trending-up', title: 'Increase fee-collection efficiency', body: 'Automated reminders and instant payments get more fees in, faster.' },
  { icon: 'lock', title: 'Eliminate revenue leakages', body: 'Real-time reconciliation closes the gaps manual tracking misses.' },
  { icon: 'message', title: 'Improve parent engagement', body: 'Reach every family on WhatsApp and email, automatically.' },
  { icon: 'calculator', title: 'Strengthen financial control', body: 'Integrated accounting keeps your books accurate and current.' },
  { icon: 'globe', title: 'Operate online & offline', body: 'Never let connectivity stop your school day.' },
  { icon: 'headset', title: 'Dedicated real-time support', body: 'Live chat and 24/7 help whenever you need it.' },
  { icon: 'folders', title: 'Simplify administration', body: 'One system replaces the many tools you juggle today.' },
  { icon: 'users', title: 'Enhance staff accountability', body: 'Digital attendance and clear ownership across teams.' },
  { icon: 'lightbulb', title: 'Gain business intelligence', body: 'Turn everyday data into decisions that grow your school.' },
]

export const PRICING = [
  {
    name: 'Standard',
    price: '₦3,000',
    unit: 'per student / term',
    tagline: 'Everything a school needs to go digital.',
    popular: false,
    setup: { fee: '₦100,000', training: '2 days training' },
    features: [
      'Curriculum & timetable management',
      'Online payments & fee management',
      'Student information system',
      'Parent portal & teacher portal',
      'Calendar & notice board',
      'School announcements',
      'Academic management',
      'Financial reports',
      'Attendance management',
      'Student portal',
      'Results & report cards',
      'Digital clock-in & clock-out',
      'Digital consent form',
      'Executive dashboards & analytics',
      'Offline-first technology',
      'WhatsApp & email engagement',
      'CBT & online assessments',
      'Lesson plans',
      'Student gamification',
      'Alumni management',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Premium',
    price: '₦5,000',
    unit: 'per student / term',
    tagline: 'Everything in Standard, plus fintech, HR and advanced operations.',
    popular: true,
    setup: { fee: '₦150,000', training: '3 days training' },
    inherits: 'Everything in Standard, plus:',
    features: [
      'Accounting reports',
      'AI academic insights',
      'AI report comments',
      'Authorised pickup',
      'Communication diary',
      'House points',
      'Inventory management',
      'Payroll management',
      'School-fee lending',
      'Staff HR management',
      'Staff salary advance',
      'Survey & feedback',
      'Transport management',
      'End-to-end admissions & enrolment',
      'Inter-house sports management',
      'Accounting package (P&L, trial balance, balance sheet)',
      'Revenue analytics',
      'Behavioural tracking & discipline management',
    ],
    cta: 'Choose Premium',
  },
  {
    name: 'Ultimate',
    price: '₦5,000+',
    unit: 'per student / term',
    tagline: 'For groups and multi-branch schools that need scale.',
    popular: false,
    gold: true,
    inherits: 'Everything in Premium, plus:',
    features: [
      'Advanced analytics dashboard',
      'Multi-branch school support',
      'Dedicated account manager',
    ],
    cta: 'Talk to Sales',
  },
]

export const PRICING_NOTES = [
  'Prices are VAT exclusive.',
  'Terms & conditions apply to rolling over of subscription.',
  'Online & bank-branch payment transaction charges apply per transaction.',
  'Portal adjustments after acceptance may attract extra charges.',
  'Setup fees apply for additional school arms/branches.',
  'Extra storage space attracts additional cost.',
]

export const STEPS = [
  { n: 1, title: 'Book a demo', body: "See CASPAA on your school's real workflows." },
  { n: 2, title: 'Onboard & import', body: 'We migrate your students, staff and data for you.' },
  { n: 3, title: 'Train your team', body: '2–3 days of hands-on training included with setup.' },
  { n: 4, title: 'Go live', body: 'Start collecting fees, marking attendance and running reports — with 24/7 support behind you.' },
]

export const SECURITY = [
  { icon: 'lock', label: 'Encrypted data, in transit & at rest' },
  { icon: 'shield', label: 'Secure payment infrastructure' },
  { icon: 'user', label: 'Role-based access controls' },
  { icon: 'sync', label: 'Automated backups & sync' },
  { icon: 'clock', label: '99.9% uptime' },
]

export const FAQ = [
  { q: 'Does CASPAA really work offline?', a: 'Yes. Core operations — attendance, tests, and day-to-day work — run fully offline and sync automatically when you reconnect.' },
  { q: 'How is CASPAA priced?', a: 'Per student, per term. Standard is ₦3,000, Premium is ₦5,000, and Ultimate is for multi-branch schools. A one-off setup fee (from ₦100,000) includes hands-on training. Prices are VAT exclusive.' },
  { q: 'Can parents pay fees through CASPAA?', a: 'Yes. Parents pay in about 30 seconds through secure channels, and every payment reconciles in real time. School-fee financing is also available.' },
  { q: 'Do I need a separate accounting system?', a: 'No. CASPAA includes integrated accounting — P&L, trial balance and balance sheet — on the Premium plan and above.' },
  { q: 'How long does setup take?', a: 'Most schools go live in days. We handle data migration and provide 2–3 days of training with setup.' },
  { q: 'Can CASPAA handle multiple branches?', a: 'Yes — the Ultimate plan includes multi-branch support, advanced analytics and a dedicated account manager.' },
  { q: 'What support do you offer?', a: 'Live chat and 24/7 client support, plus a dedicated account manager on Ultimate.' },
  { q: 'Can we customise CASPAA for our school?', a: 'Yes. Customisation is available; some post-acceptance adjustments may attract additional charges.' },
]
