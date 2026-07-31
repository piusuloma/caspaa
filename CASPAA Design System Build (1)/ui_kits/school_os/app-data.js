/* Demo data for the CASPAA School OS kit. Shapes and vocabulary follow
   public/js/data.js and the finance module: terms are "Second Term · 2025/2026",
   money is ₦ with comma thousands, fee statuses are paid / partial / outstanding. */
window.APPDATA = {
  user: { name: 'Grace Umeh', role: 'finance', roleLabel: 'Finance Officer / Bursar', school: 'Bright Lights Academy' },
  term: 'Second Term · 2025/2026',

  /* navFor('finance') in public/js/app.js */
  nav: [
    { key: 'fin_dashboard', label: 'Dashboard', icon: 'dashboard', color: '#0a8491' },
    { key: 'fin_fees', label: 'Fee Structure', icon: 'fees', color: '#00b386' },
    { key: 'fin_invoices', label: 'Invoices', icon: 'results', color: '#e69514' },
    { key: 'fin_payments', label: 'Payments', icon: 'fees', color: '#00b386' },
    { key: 'fin_recon', label: 'Reconciliation', icon: 'check', color: '#14a3a0' },
    { key: 'fin_expenses', label: 'Expenses', icon: 'trending_down', color: '#e0655c' },
    { key: 'fin_store', label: 'School Store', icon: 'package', color: '#d69e00' },
    { key: 'fin_lending', label: 'Lending', icon: 'loan', color: '#7a5cd6' },
    { key: 'fin_reports', label: 'Financial Reports', icon: 'reports', color: '#0a8491' },
  ],

  stats: [
    { label: 'Billed This Term', value: '₦13,480,000', icon: 'fees', accent: '#0a8491' },
    { label: 'Collected', value: '₦12,400,000', icon: 'check', accent: '#00b386', trend: { direction: 'up', label: '8.2% vs last term' } },
    { label: 'Outstanding', value: '₦1,080,000', icon: 'trending_down', accent: '#e0655c', trend: { direction: 'down', label: '12% vs last term' } },
    { label: 'Collection Rate', value: '92%', icon: 'reports', accent: '#e69514' },
  ],

  collectionByMonth: [
    { label: 'Sep', value: 2.1 }, { label: 'Oct', value: 3.4 }, { label: 'Nov', value: 2.8 },
    { label: 'Dec', value: 1.2 }, { label: 'Jan', value: 3.9 }, { label: 'Feb', value: 3.1 },
    { label: 'Mar', value: 2.4 }, { label: 'Apr', value: 4.2 }, { label: 'May', value: 3.6 },
  ],

  feeMix: [
    { label: 'Tuition', display: '₦8,400,000', value: 68, color: '#00b386' },
    { label: 'Boarding', display: '₦2,200,000', value: 18, color: '#0a8491' },
    { label: 'Uniform & levies', display: '₦1,100,000', value: 9, color: '#e69514' },
    { label: 'Outstanding', display: '₦1,080,000', value: 5, color: '#cbd5e1' },
  ],

  classRates: [
    { klass: 'JSS 1', owing: 0, outstanding: '₦0', rate: 100, tone: '' },
    { klass: 'JSS 2', owing: 2, outstanding: '₦96,000', rate: 96, tone: '' },
    { klass: 'JSS 3', owing: 3, outstanding: '₦156,000', rate: 91, tone: '' },
    { klass: 'SS 1', owing: 4, outstanding: '₦208,000', rate: 88, tone: 'is-warn' },
    { klass: 'SS 2', owing: 5, outstanding: '₦268,000', rate: 84, tone: 'is-warn' },
    { klass: 'SS 3', owing: 6, outstanding: '₦352,000', rate: 76, tone: 'is-danger' },
  ],

  /* A bursar's dashboard also surfaces the wider school — colour keeps the
     modules apart at a glance. */
  schoolPulse: [
    { label: 'Students enrolled', value: '1,284', sub: '46 new this term', icon: 'students', color: '#e69514', soft: '#fdf1de' },
    { label: 'Attendance today', value: '96%', sub: '1,233 present', icon: 'check', color: '#4bb543', soft: '#ecf8eb' },
    { label: 'Staff clocked in', value: '68 / 72', sub: '4 on leave', icon: 'teacher', color: '#14a3a0', soft: '#e4f6f5' },
    { label: 'Messages sent', value: '312', sub: 'WhatsApp + email', icon: 'bell', color: '#e0655c', soft: '#fdeceb' },
  ],

  invoices: [
    { ref: 'INV-4021', student: 'Adaeze Okoro', klass: 'JSS 2', billed: '₦48,000', paid: '₦48,000', balance: '₦0', status: 'paid' },
    { ref: 'INV-4022', student: 'Ibrahim Bello', klass: 'SS 1', billed: '₦52,000', paid: '₦24,000', balance: '₦28,000', status: 'partial' },
    { ref: 'INV-4023', student: 'Chidi Nwosu', klass: 'JSS 3', billed: '₦52,000', paid: '₦0', balance: '₦52,000', status: 'outstanding' },
    { ref: 'INV-4024', student: 'Fatima Yusuf', klass: 'JSS 1', billed: '₦44,000', paid: '₦44,000', balance: '₦0', status: 'paid' },
    { ref: 'INV-4025', student: 'Tunde Adeyemi', klass: 'SS 2', billed: '₦58,000', paid: '₦58,000', balance: '₦0', status: 'paid' },
    { ref: 'INV-4026', student: 'Zainab Musa', klass: 'JSS 2', billed: '₦48,000', paid: '₦16,000', balance: '₦32,000', status: 'partial' },
  ],

  payments: [
    { ref: 'PAY-20418', student: 'Adaeze Okoro', method: 'Bank transfer', date: '28 Jul', amount: '₦48,000', status: 'successful' },
    { ref: 'PAY-20417', student: 'Tunde Adeyemi', method: 'Card', date: '28 Jul', amount: '₦58,000', status: 'successful' },
    { ref: 'PAY-20416', student: 'Zainab Musa', method: 'Cash', date: '27 Jul', amount: '₦16,000', status: 'pending' },
    { ref: 'PAY-20415', student: 'Fatima Yusuf', method: 'Bank transfer', date: '27 Jul', amount: '₦44,000', status: 'successful' },
    { ref: 'PAY-20414', student: 'Ibrahim Bello', method: 'Bank transfer', date: '26 Jul', amount: '₦24,000', status: 'successful' },
    { ref: 'PAY-20413', student: 'Emeka Obi', method: 'Card', date: '26 Jul', amount: '₦52,000', status: 'failed' },
  ],

  unmatched: [
    { ref: 'TRF-88213', narration: 'OKORO A — SCHOOL FEES', date: '28 Jul', amount: '₦48,000' },
    { ref: 'TRF-88219', narration: 'FEES JSS2 MUSA', date: '27 Jul', amount: '₦16,000' },
    { ref: 'TRF-88224', narration: 'TRANSFER FROM BELLO S', date: '26 Jul', amount: '₦24,000' },
  ],
};
