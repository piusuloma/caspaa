/* ============================================================
   CASPAA AUTH
   - Multi-role login (Super Admin, School Admin, Finance,
     Teacher, Parent)
   - Quick demo logins for stakeholder demos
   - OTP simulation for sensitive roles (Super Admin, Finance)
   ============================================================ */

const AUTH = {
  current: null,

  init() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try { this.current = JSON.parse(raw); }
      catch (e) { this.current = null; }
    }
  },

  login(user) {
    this.current = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    // Seed a fresh history entry for this session
    try {
      const v = typeof APP !== 'undefined' ? APP.defaultView(user.role) : 'dashboard';
      history.replaceState({ view: v, params: {}, ts: Date.now() }, '', '#' + v);
      if (typeof APP !== 'undefined') APP.view = v;
    } catch (e) {}
  },

  logout() {
    this.current = null;
    sessionStorage.removeItem(SESSION_KEY);
    APP.render();
  },

  isLoggedIn() { return !!this.current; },

  role() { return this.current ? this.current.role : null; }
};

/* ---------- Demo accounts ---------- */
const DEMO_ACCOUNTS = [
  { id: 'sa_001', role: 'superadmin', name: 'Tayo Adesola',  email: 'super@caspaa.com',          title: 'CASPAA Super Admin',     subtitle: 'Platform Operator' },
  { id: 'sch_brightlights', role: 'schooladmin', name: 'Mr. Olusegun Adebayo', email: 'admin@brightlights.ng', title: 'School Proprietor', subtitle: 'Bright Lights Academy' },
  { id: 'prn_001', role: 'principal', name: 'Mrs. Patricia Akande', email: 'principal@brightlights.ng', title: 'Principal',     subtitle: 'Academic + Admin oversight', schoolId: 'sch_brightlights' },
  { id: 'fin_001', role: 'finance', name: 'Mrs. Adaeze Okonkwo', email: 'finance@brightlights.ng', title: 'Finance Officer',  subtitle: 'Bursar — Bright Lights Academy', schoolId: 'sch_brightlights' },
  { id: 'tch_adamu', role: 'teacher', name: 'Mr. Adamu Ibrahim', email: 'adamu@brightlights.ng', title: 'Teacher',         subtitle: 'Maths + Science — Pry1, Pry2, JSS1', schoolId: 'sch_brightlights' },
  { id: 'par_okafor', role: 'parent', name: 'Mr. Tunde Okafor', email: 'parent@demo.ng',          title: 'Parent',           subtitle: 'Chiamaka & Tobi Okafor', schoolId: 'sch_brightlights' },
  { id: 'stu_002', role: 'student', name: 'Tobi Okafor', email: 'tobi@brightlights.ng',          title: 'Student',          subtitle: 'JSS 1 — Bright Lights Academy', schoolId: 'sch_brightlights' }
];

/* ============================================================
   PUBLIC PROSPECTIVE-PARENT FUNNEL (pre-account, no login required)
   - Book a Tour   → tourBookings
   - Admissions    → admissionApplications
   - Careers       → careerApplications
   All persist to the DB, generate a reference number, and are visible
   to the school later (School Admin views ship in a follow-up).
   ============================================================ */

// Which school a public submission belongs to (portal school when known).
function publicSchoolContext() {
  const sid = (typeof APP !== 'undefined' && APP.portalSchoolId) || (DB.settings().currentSchoolId) || 'platform';
  const school = DB.find('schools', sid);
  return { schoolId: sid, schoolName: (school && school.name) || DB.settings().schoolName || 'CASPAA School' };
}

const TOUR_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'];
const CLASS_LEVELS = ['Creche / Daycare', 'Pre-Nursery', 'Nursery', 'Primary (KG–P6)', 'Junior Secondary (JSS)', 'Senior Secondary (SSS)'];

function publicRef(prefix) {
  // Human-friendly reference, e.g. TOUR-8F3K
  const s = uid(prefix).replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase();
  return `${prefix.toUpperCase()}-${s}`;
}

function publicSuccess(title, ref, message) {
  modal({
    title: '',
    body: `<div class="text-center py-4">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">${icon('check', 'w-8 h-8')}</div>
        <h3 class="text-xl font-bold text-slate-900 mb-1">${title}</h3>
        <p class="text-sm text-slate-500 mb-4">${message}</p>
        <div class="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <span class="text-xs uppercase tracking-wide text-slate-500 font-semibold">Reference</span>
          <span class="font-mono font-bold text-slate-800">${ref}</span>
        </div>
      </div>`,
    footer: `<button class="btn btn-primary w-full" onclick="document.getElementById('modalBackdrop')?.click()">Done</button>`
  });
}

/* ---------- Book a Tour ---------- */
function bookTourModal() {
  const { schoolName } = publicSchoolContext();
  modal({
    title: `Book a Tour${schoolName ? ' · ' + schoolName : ''}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Pick a day and time to visit. The school will confirm your slot and share directions.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="tr_name">Parent / Guardian Name *</label><input id="tr_name" class="input" placeholder="e.g. Mrs. Grace Bello" /></div>
          <div><label class="input-label" for="tr_phone">Phone *</label><input id="tr_phone" class="input" placeholder="+234…" /></div>
        </div>
        <div><label class="input-label" for="tr_email">Email *</label><input id="tr_email" type="email" class="input" placeholder="you@email.com" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="tr_child">Child's Name</label><input id="tr_child" class="input" placeholder="Optional" /></div>
          <div><label class="input-label" for="tr_class">Class of Interest</label>
            <select id="tr_class" class="input">${CLASS_LEVELS.map(c => `<option>${c}</option>`).join('')}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="tr_date">Preferred Date *</label><input id="tr_date" type="date" class="input" min="${today()}" /></div>
          <div><label class="input-label" for="tr_time">Preferred Time *</label>
            <select id="tr_time" class="input">${TOUR_SLOTS.map(s => `<option>${s}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label" for="tr_note">Anything we should know?</label><textarea id="tr_note" class="input" rows="2" placeholder="Optional"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveTourBooking()">${icon('calendar','w-4 h-4')} Request Tour</button>`
  });
}

function saveTourBooking() {
  const g = id => (document.getElementById(id).value || '').trim();
  const name = g('tr_name'), phone = g('tr_phone'), email = g('tr_email');
  const date = g('tr_date'), time = g('tr_time');
  if (!name || !phone || !email) { toast('Please fill your name, phone and email', 'danger'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid email', 'danger'); return; }
  if (!date) { toast('Please choose a preferred date', 'danger'); return; }

  const { schoolId } = publicSchoolContext();
  const ref = publicRef('TOUR');
  DB.insert('tourBookings', {
    id: uid('tour'), ref, schoolId,
    parentName: name, phone, email,
    childName: g('tr_child'), classOfInterest: g('tr_class'),
    date, time, note: g('tr_note'),
    status: 'requested', createdAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: email, action: 'tour_requested', target: name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  publicSuccess('Tour requested!', ref, `We've received your request for ${date} at ${time}. The school will confirm shortly by email or phone.`);
}

/* ---------- Book a Tour — full page (opened from the portal, not a modal) ---------- */
function openTourPage() {
  document.getElementById('modalBackdrop')?.click(); // close any open modal first
  APP.publicView = 'tour';
  APP.render();
}

function closeTourPage() {
  APP.publicView = null;
  APP.render();
}

function renderTourPage() {
  const { schoolName } = publicSchoolContext();
  const displayName = (typeof APP !== 'undefined' && APP.portalSchoolId && schoolName) ? schoolName : 'CASPAA';
  return `
    <div class="login-bg min-h-screen flex">

      <!-- Hero panel (left) — CASPAA Blue field -->
      <div class="login-hero hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden shrink-0 flex-col justify-center p-10 xl:p-12">
        <div class="relative text-white">
          <div class="flex items-center gap-3 mb-8">
            <img src="logo/caspaa-white.svg" alt="CASPAA" class="h-8 w-auto" onerror="this.remove()" />
            ${displayName === 'CASPAA' ? '' : `<div class="pl-3 border-l border-white/25">
              <h1 class="text-lg font-extrabold tracking-tight leading-tight">${displayName}</h1>
              <p class="text-white/70 text-xs">Powered by CASPAA</p>
            </div>`}
          </div>

          <h2 class="text-3xl xl:text-4xl font-extrabold leading-tight mb-2">
            Come and see the school for yourself
          </h2>
          <p class="text-white/80 text-sm max-w-md mb-7">Book a visit at a time that suits you. Meet the team, walk the grounds and see how ${displayName === 'CASPAA' ? 'the school' : displayName} runs day to day. We'll confirm your slot and share directions.</p>

          <div class="grid grid-cols-2 gap-3">
            ${PORTAL_FEATURES.map(portalFeatureCard).join('')}
          </div>
        </div>
      </div>

      <!-- Form area (right) -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div class="login-card w-full max-w-md">
          <img src="logo/caspaa-navy.svg" alt="CASPAA" class="lg:hidden h-8 w-auto mx-auto mb-8" onerror="this.remove()" />

          <button type="button" onclick="closeTourPage()" class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
            <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">${icon('arrow_left', 'w-4 h-4')}</span>
            <span class="font-semibold text-slate-700">Back to sign in</span>
          </button>

          <div class="bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-8">
            <h3 class="text-2xl font-bold text-slate-900 leading-tight mb-1">Book a Tour${displayName === 'CASPAA' ? '' : ' · ' + displayName}</h3>
            <p class="text-sm text-slate-500 mb-5">Pick a day and time to visit. All fields marked * are required.</p>

            <div class="space-y-3">
              <div><label class="input-label">Parent / Guardian Name *</label><input id="tr_name" class="input" placeholder="e.g. Mrs. Grace Bello" /></div>
              <div><label class="input-label">Phone *</label><input id="tr_phone" class="input" placeholder="+234…" /></div>
              <div><label class="input-label">Email *</label><input id="tr_email" type="email" class="input" placeholder="you@email.com" autocomplete="email" /></div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="input-label">Child's Name</label><input id="tr_child" class="input" placeholder="Optional" /></div>
                <div><label class="input-label">Class of Interest</label>
                  <select id="tr_class" class="input">${CLASS_LEVELS.map(c => `<option>${c}</option>`).join('')}</select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="input-label">Preferred Date *</label><input id="tr_date" type="date" class="input" min="${today()}" /></div>
                <div><label class="input-label">Preferred Time *</label>
                  <select id="tr_time" class="input">${TOUR_SLOTS.map(s => `<option>${s}</option>`).join('')}</select>
                </div>
              </div>
              <div><label class="input-label">Anything we should know?</label><textarea id="tr_note" class="input" rows="2" placeholder="Optional"></textarea></div>
              <button class="btn btn-primary w-full !py-2.5" onclick="saveTourBookingPage()">${icon('calendar','w-4 h-4')} Request Tour</button>
            </div>
          </div>

          <p class="text-xs text-slate-500 text-center mt-5">Prefer to talk first? Your school will confirm the slot by email or phone.</p>
        </div>
      </div>
    </div>
  `;
}

function saveTourBookingPage() {
  const g = id => (document.getElementById(id).value || '').trim();
  const name = g('tr_name'), phone = g('tr_phone'), email = g('tr_email');
  const date = g('tr_date'), time = g('tr_time');
  if (!name || !phone || !email) { toast('Please fill your name, phone and email', 'danger'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid email', 'danger'); return; }
  if (!date) { toast('Please choose a preferred date', 'danger'); return; }

  const { schoolId } = publicSchoolContext();
  const ref = publicRef('TOUR');
  DB.insert('tourBookings', {
    id: uid('tour'), ref, schoolId,
    parentName: name, phone, email,
    childName: g('tr_child'), classOfInterest: g('tr_class'),
    date, time, note: g('tr_note'),
    status: 'requested', createdAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: email, action: 'tour_requested', target: name, timestamp: now() });
  // Return to sign-in, then confirm.
  APP.publicView = null;
  APP.render();
  publicSuccess('Tour requested!', ref, `We've received your request for ${date} at ${time}. The school will confirm shortly by email or phone.`);
}

/* ---------- Admissions application ---------- */
function admissionsModal() {
  const { schoolName } = publicSchoolContext();
  modal({
    title: `Admissions${schoolName ? ' · ' + schoolName : ''}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Submit your child's details to begin the application. The school reviews it and reaches out to schedule a visit and next steps.
        </div>
        <div class="text-xs font-semibold uppercase text-slate-500 pt-1">Child's details</div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="ad_child">Child's Full Name *</label><input id="ad_child" class="input" placeholder="e.g. Tobi Okafor" /></div>
          <div><label class="input-label" for="ad_dob">Date of Birth *</label><input id="ad_dob" type="date" class="input" max="${today()}" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="ad_gender">Gender</label>
            <select id="ad_gender" class="input"><option>Male</option><option>Female</option></select>
          </div>
          <div><label class="input-label" for="ad_class">Class Applying For *</label>
            <select id="ad_class" class="input">${CLASS_LEVELS.map(c => `<option>${c}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label" for="ad_prev">Previous School</label><input id="ad_prev" class="input" placeholder="Optional" /></div>
        <div class="text-xs font-semibold uppercase text-slate-500 pt-1">Parent / Guardian</div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="ad_parent">Full Name *</label><input id="ad_parent" class="input" placeholder="e.g. Mr. Tunde Okafor" /></div>
          <div><label class="input-label" for="ad_phone">Phone *</label><input id="ad_phone" class="input" placeholder="+234…" /></div>
        </div>
        <div><label class="input-label" for="ad_email">Email *</label><input id="ad_email" type="email" class="input" placeholder="you@email.com" /></div>
        <div><label class="input-label" for="ad_note">Notes</label><textarea id="ad_note" class="input" rows="2" placeholder="Anything else you'd like the school to know (optional)"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveAdmissionApplication()">${icon('check','w-4 h-4')} Submit Application</button>`
  });
}

function saveAdmissionApplication() {
  const g = id => (document.getElementById(id).value || '').trim();
  const child = g('ad_child'), dob = g('ad_dob');
  const parent = g('ad_parent'), phone = g('ad_phone'), email = g('ad_email');
  if (!child || !dob) { toast("Please enter the child's name and date of birth", 'danger'); return; }
  if (!parent || !phone || !email) { toast("Please fill the parent's name, phone and email", 'danger'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid email', 'danger'); return; }

  const { schoolId } = publicSchoolContext();
  const ref = publicRef('ADM');
  // Written in the schema the built-in Admissions inbox (view_adm_admissions)
  // understands, so a public application lands straight in the school's queue
  // and counts toward the dashboard + nav badge.
  const classOfInterest = g('ad_class');
  const noteParts = [];
  if (classOfInterest) noteParts.push('Class of interest: ' + classOfInterest);
  if (g('ad_note')) noteParts.push(g('ad_note'));
  DB.insert('admissionApplications', {
    id: uid('app'), ref, schoolId,
    applicantName: child, dob,
    gender: g('ad_gender') === 'Female' ? 'F' : 'M',
    requestedClass: '',            // school assigns the actual class on review
    currentSchool: g('ad_prev'),
    parentName: parent, parentPhone: phone, parentEmail: email,
    address: '', reason: noteParts.join(' — '),
    status: 'pending', appliedAt: now(), documents: {}, source: 'public_portal'
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: email, action: 'admission_submitted', target: child, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  publicSuccess('Application submitted!', ref, `Thanks — we've received ${child}'s application. The school will review it and contact you to schedule a visit.`);
}

/* ---------- Careers (register interest) ---------- */
function careersModal() {
  const { schoolName } = publicSchoolContext();
  modal({
    title: `Careers${schoolName ? ' · ' + schoolName : ''}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Interested in joining the team? Tell us about yourself and we'll be in touch when a matching role opens.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="cr_name">Full Name *</label><input id="cr_name" class="input" placeholder="Your name" /></div>
          <div><label class="input-label" for="cr_phone">Phone *</label><input id="cr_phone" class="input" placeholder="+234…" /></div>
        </div>
        <div><label class="input-label" for="cr_email">Email *</label><input id="cr_email" type="email" class="input" placeholder="you@email.com" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="cr_role">Role of Interest *</label>
            <select id="cr_role" class="input"><option>Teacher</option><option>Administrative</option><option>Finance / Bursary</option><option>ICT</option><option>Operations</option><option>Other</option></select>
          </div>
          <div><label class="input-label" for="cr_exp">Years of Experience</label><input id="cr_exp" class="input" placeholder="e.g. 5" /></div>
        </div>
        <div><label class="input-label" for="cr_link">LinkedIn / Portfolio / CV link</label><input id="cr_link" class="input" placeholder="Optional" /></div>
        <div><label class="input-label" for="cr_note">Cover note</label><textarea id="cr_note" class="input" rows="2" placeholder="Optional"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveCareerApplication()">${icon('check','w-4 h-4')} Register Interest</button>`
  });
}

function saveCareerApplication() {
  const g = id => (document.getElementById(id).value || '').trim();
  const name = g('cr_name'), phone = g('cr_phone'), email = g('cr_email');
  if (!name || !phone || !email) { toast('Please fill your name, phone and email', 'danger'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid email', 'danger'); return; }

  const { schoolId } = publicSchoolContext();
  const ref = publicRef('JOB');
  DB.insert('careerApplications', {
    id: uid('job'), ref, schoolId,
    name, phone, email, role: g('cr_role'), experience: g('cr_exp'),
    link: g('cr_link'), note: g('cr_note'),
    status: 'received', createdAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: email, action: 'career_interest', target: name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  publicSuccess('Interest registered!', ref, `Thanks ${name.split(' ')[0]} — we've saved your details and will reach out when a matching role opens.`);
}

/* ---------- Public portal feature cards (glass on brand gradient) ---------- */
const PORTAL_FEATURES = [
  { icon: 'book',    title: 'Learning Assistant', desc: 'Personalised, curriculum-aligned help for every learner' },
  { icon: 'results', title: 'Tests & Results', desc: 'Online assessments with instant grading and report cards' },
  { icon: 'classes', title: 'Classes & Content', desc: 'Lessons, resources and timetables in one place' },
  { icon: 'fees',    title: 'Fees & Payments', desc: 'Pay securely by card or transfer, with instant receipts' }
];

function portalFeatureCard(f) {
  return `<div class="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
      <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white mb-3">${icon(f.icon, 'w-5 h-5')}</div>
      <div class="font-bold text-white text-sm">${f.title}</div>
      <div class="text-brand-100/70 text-xs mt-1 leading-snug">${f.desc}</div>
    </div>`;
}

function portalActionBtn(label, iconName, onclick) {
  return `<button type="button" onclick="${onclick}" class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/20 transition">${icon(iconName, 'w-4 h-4')}${label}</button>`;
}

/* ---------- Login screen (public portal) ---------- */
function renderLogin() {
  const { schoolName } = publicSchoolContext();
  const displayName = (typeof APP !== 'undefined' && APP.portalSchoolId && schoolName) ? schoolName : 'CASPAA';
  return `
    <div class="login-bg min-h-screen flex">

      <!-- Hero panel (left) — image only; the wordmark now sits above the form heading. -->
      <div id="loginHero" class="login-hero hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden shrink-0 flex-col items-center justify-start p-10 xl:p-12" style="background-image:url('logo/hero-default.jpg')">
        ${displayName === 'CASPAA' ? '' : `<div class="relative text-white text-center">
          <h1 class="text-xl font-extrabold tracking-tight leading-tight">${displayName}</h1>
          <p class="text-white/70 text-xs">Powered by CASPAA</p>
        </div>`}
      </div>

      <!-- Form area (right) -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="login-card w-full max-w-md">

        <!-- Login card (identifier-first, two-step) -->
        <div class="bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-8">

          <!-- Step 1: who are you? -->
          <div id="loginStep1">
            <img src="logo/caspaa-navy.svg" alt="CASPAA" class="h-6 w-auto mb-4" onerror="this.remove()" />
            <div class="mb-1">
              <h3 class="text-xl font-bold text-slate-900 leading-tight">Sign in to your dashboard</h3>
              <p class="text-sm text-slate-500">Enter your details below to continue.</p>
            </div>
            <div class="space-y-3 mt-5">
              <div>
                <label class="input-label" for="loginIdentifier" id="loginFieldLabel">Email or Admission Number</label>
                <input type="text" class="input" id="loginIdentifier" placeholder="you@school.ng  ·  BL/2025/001" autocomplete="username" />
              </div>
              <button class="btn btn-primary w-full" id="loginContinueBtn">Continue</button>
              <p class="text-xs text-slate-500 text-center" id="loginFieldHint">Staff &amp; parents use email · students use their admission number</p>
            </div>

            <div class="mt-5 pt-5 border-t border-slate-100 text-center">
              <p class="text-xs text-slate-500">Prospective parent?
                <button type="button" class="text-slate-500 font-medium hover:text-slate-700 underline" onclick="openTourPage()">Book a tour</button>
                or
                <button type="button" class="text-slate-500 font-medium hover:text-slate-700 underline" onclick="admissionsModal()">apply for admission</button>
              </p>
            </div>
          </div>

          <!-- Step 2: prove it (password or date of birth, chosen by identifier) -->
          <div id="loginStep2" class="hidden">
            <button type="button" id="loginBackBtn" class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">${icon('arrow_left', 'w-4 h-4')}</span>
              <span id="loginIdentDisplay" class="font-semibold text-slate-700 truncate max-w-[220px]"></span>
            </button>
            <div id="loginStep2Body" class="space-y-3"></div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100 text-center">
            <p class="text-xs text-slate-500">By signing in, you agree to CASPAA's Terms and Privacy Policy. Your data is encrypted with AES-256.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Resolve an email + password against every account source ----------
   Order: platform/system demo accounts → invited or seeded staff (teachers) →
   parents (invited on enrolment) → school proprietor (by school email).
   Role is derived from the matched record — never chosen on the login page.
   Returns { user, ok, acceptInvite? }; user is null when the email is unknown. */
function resolveLogin(email, pwd) {
  const e = (email || '').trim().toLowerCase();
  if (!e) return { user: null, ok: false };

  // 1. Platform / demo personas (fixed demo password)
  const demo = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === e);
  if (demo) return { user: demo, ok: pwd === 'demo1234' };

  // 2. Staff — invited via onboarding or seeded. Login = email OR invitation username.
  const staff = DB.get('teachers').find(t =>
    (t.email || '').toLowerCase() === e ||
    (t.invitation && (t.invitation.username || '').toLowerCase() === e));
  if (staff) {
    const ok = pwd === 'demo1234' || !!(staff.invitation && pwd === staff.invitation.tempPassword);
    const role = staff.staffType === 'Finance' ? 'finance' : 'teacher';
    const firstLogin = role === 'teacher' && !!(staff.invitation && !staff.invitation.accepted) && !staff.passwordChanged;
    return {
      ok,
      user: {
        id: staff.id, role, name: staff.name,
        email: staff.email || (staff.invitation && staff.invitation.username) || '',
        schoolId: staff.schoolId, title: staff.role || staff.staffType, subtitle: staff.staffType, firstLogin
      },
      acceptInvite: () => {
        if (staff.invitation && !staff.invitation.accepted) {
          DB.update('teachers', staff.id, { invitation: { ...staff.invitation, accepted: true, acceptedAt: now() } });
        }
      }
    };
  }

  // 3. Parents — credentials issued when their child is enrolled (username = phone or email)
  const parent = DB.get('parents').find(p =>
    (p.email || '').toLowerCase() === e ||
    (p.credentials && (p.credentials.username || '').toLowerCase() === e));
  if (parent) {
    const ok = pwd === 'demo1234' || !!(parent.credentials && pwd === parent.credentials.tempPassword);
    return { ok, user: { id: parent.id, role: 'parent', name: parent.name, email: parent.email || '', schoolId: parent.schoolId, firstLogin: !!parent.firstLogin } };
  }

  // 4. School proprietor — sign in with the school's contact email
  const school = DB.get('schools').find(s => (s.email || '').toLowerCase() === e);
  if (school) {
    const ok = pwd === 'demo1234' || !!(school.password && pwd === school.password);
    return { ok, user: { id: school.id, role: 'schooladmin', name: school.proprietor || school.name, email: school.email || '', schoolId: school.id } };
  }

  return { user: null, ok: false };
}

/* ---------- Route a step-1 identifier ----------
   Decides which credential step 1 should lead to, without asking the
   user to declare their type. An admission number that matches an
   active student → date-of-birth step; anything that matches a known
   account (email or phone username) → password step; else unknown. */
function routeLoginIdentifier(identifier) {
  const id = (identifier || '').trim();
  if (!id) return { kind: 'empty' };
  // Student — matched by admission number (case-insensitive)
  const student = DB.get('students').find(s =>
    s.admissionNo && s.admissionNo.toUpperCase() === id.toUpperCase() && s.status === 'active');
  if (student) return { kind: 'student', student, label: student.admissionNo };
  // Any credentialled account (staff, parent, admin, school proprietor)
  if (resolveLogin(id, '').user) return { kind: 'password', identifier: id, label: id };
  return { kind: 'unknown' };
}

// Module-level state carried between step 1 and step 2
let _loginRoute = null;

function bindLoginHandlers() {
  const step1 = document.getElementById('loginStep1');
  const step2 = document.getElementById('loginStep2');
  const idInput = document.getElementById('loginIdentifier');

  const goToStep1 = () => {
    _loginRoute = null;
    step2.classList.add('hidden');
    step1.classList.remove('hidden');
    document.getElementById('loginStep2Body').innerHTML = '';
    setTimeout(() => idInput.focus(), 0);
  };

  const goToStep2 = () => {
    const route = routeLoginIdentifier(idInput.value);
    if (route.kind === 'empty') { toast('Please enter your email or admission number', 'danger'); return; }
    if (route.kind === 'unknown') { toast('No account found with that email or admission number', 'danger'); return; }
    _loginRoute = route;
    document.getElementById('loginIdentDisplay').textContent = route.label;

    const body = document.getElementById('loginStep2Body');
    if (route.kind === 'student') {
      body.innerHTML = `
        <p class="text-sm text-slate-500">Enter your date of birth to confirm it's you.</p>
        <div>
          <label class="input-label" for="loginDob">Date of Birth</label>
          <input type="date" class="input" id="loginDob" />
        </div>
        <button class="btn btn-primary w-full" id="loginSubmitBtn">Sign in as Student</button>`;
    } else {
      body.innerHTML = `
        <div>
          <label class="input-label" for="loginPassword">Password</label>
          <div class="relative">
            <input type="password" class="input pr-10" id="loginPassword" placeholder="••••••••" autocomplete="current-password" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600" onclick="togglePwVisibility('loginPassword', this)" aria-label="Show or hide password">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" class="w-4 h-4 accent-brand-600" /> Remember me</label>
          <button type="button" class="text-sm text-brand-700 font-semibold" onclick="toast('If that account exists, a reset link has been sent.','info')">Forgot password?</button>
        </div>
        <button class="btn btn-primary w-full" id="loginSubmitBtn">Sign in</button>
        <p class="text-xs text-slate-500 text-center">Demo accounts use password <strong>demo1234</strong></p>`;
    }

    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    const submit = document.getElementById('loginSubmitBtn');
    submit.onclick = doSubmit;
    const focusEl = document.getElementById(route.kind === 'student' ? 'loginDob' : 'loginPassword');
    if (focusEl) {
      setTimeout(() => focusEl.focus(), 0);
      focusEl.addEventListener('keydown', e => { if (e.key === 'Enter') doSubmit(); });
    }
  };

  const doSubmit = () => {
    if (!_loginRoute) return;
    if (_loginRoute.kind === 'student') return studentSignIn(_loginRoute.student);
    return passwordSignIn(_loginRoute.identifier);
  };

  const passwordSignIn = (identifier) => {
    const pwd = document.getElementById('loginPassword').value;
    const res = resolveLogin(identifier, pwd);
    if (!res.user) { toast('No account found', 'danger'); return; }
    if (!res.ok) { toast('Incorrect password', 'danger'); return; }
    if (res.acceptInvite) res.acceptInvite();
    const user = res.user;
    if (user.role === 'superadmin' || user.role === 'finance') {
      showOTPScreen(user);
    } else {
      AUTH.login(user);
      APP.render();
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      if (user.firstLogin) promptFirstLoginPasswordChange(user);
    }
  };

  const studentSignIn = (student) => {
    const dob = document.getElementById('loginDob').value;
    if (!dob) { toast('Please enter your date of birth', 'danger'); return; }
    if (student.dob !== dob) { toast("That date of birth doesn't match our records", 'danger'); return; }

    const cls = DB.find('classes', student.classId);
    const schoolName = DB.settings().schoolName || 'School';
    const isSecondary = cls && cls.level === 'Secondary';
    const sessionUser = {
      id: student.id, role: 'student', name: student.name, email: student.email || '',
      title: 'Student', subtitle: `${cls ? cls.name : ''} — ${schoolName}`,
      schoolId: student.schoolId, firstLogin: isSecondary && !student.passwordChanged
    };
    AUTH.login(sessionUser);
    DB.insert('auditLog', { id: uid('aud'), schoolId: student.schoolId, actor: student.id, action: 'student_login', target: student.name, timestamp: now() });
    toast(`Welcome, ${student.name.split(' ')[0]}!`, 'success');
    APP.render();
    if (sessionUser.firstLogin) promptFirstLoginPasswordChange(sessionUser);
  };

  document.getElementById('loginContinueBtn').onclick = goToStep2;
  idInput.addEventListener('keydown', e => { if (e.key === 'Enter') goToStep2(); });
  document.getElementById('loginBackBtn').onclick = goToStep1;

  setTimeout(() => idInput.focus(), 0);
}

/* ---------- School self-signup (hybrid: instant trial, verify to go live) ----------
   Anyone can create a school account and start the getting-started wizard
   immediately. The school begins on a 14-day trial in an 'unverified' state;
   money features (payments, financing) stay gated until the CASPAA team
   approves the school's KYC. */
function signupSchoolModal() {
  const eye = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
  modal({
    title: 'Sign up your school',
    size: 'lg',
    body: `
      <div class="signup-form space-y-4">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Register your school with your <strong>official school email</strong> and upload a verification document. To keep the platform secure, our team reviews every school before the dashboard is unlocked — usually within 1 business day.
        </div>
        <div><label class="input-label" for="su_name">School Name *</label><input id="su_name" class="input" placeholder="e.g. Sunrise Academy" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="su_prop">Your Name (Proprietor) *</label><input id="su_prop" class="input" placeholder="e.g. Mrs. Grace Bello" /></div>
          <div><label class="input-label" for="su_phone">Phone *</label><input id="su_phone" class="input" placeholder="+234…" /></div>
        </div>
        <div><label class="input-label" for="su_email">Work Email *</label><input id="su_email" type="email" class="input" placeholder="you@yourschool.ng" /></div>
        <div><label class="input-label" for="su_plan">Subscription Plan</label>
          <select id="su_plan" class="input">
            <option value="Essential">Essential — ₦45,000/mo (up to 100 students)</option>
            <option value="Professional" selected>Professional — ₦95,000/mo (up to 300 students)</option>
            <option value="Enterprise">Enterprise — from ₦250,000/mo (unlimited)</option>
          </select>
        </div>
        <div><label class="input-label" for="su_doc">School Verification Document *</label>
          <input id="su_doc" type="file" class="input" accept=".pdf,.jpg,.jpeg,.png" />
          <p class="text-xs text-slate-500 mt-1">CAC certificate, Ministry of Education approval, or similar proof. Required to verify your school.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="su_pw">Password *</label>
            <div class="relative">
              <input id="su_pw" type="password" class="input pr-10" placeholder="Min 8 characters" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600" onclick="togglePwVisibility('su_pw', this)" aria-label="Show or hide password">${eye}</button>
            </div>
          </div>
          <div><label class="input-label" for="su_pw2">Confirm Password *</label><input id="su_pw2" type="password" class="input" placeholder="Repeat password" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" id="su_terms" class="w-5 h-5 accent-brand-600" /> I agree to CASPAA's Terms and Privacy Policy</label>
      </div>
    `,
    footer: `<button class="btn btn-lg btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-lg btn-primary" onclick="saveSchoolSignup()">${icon('check','w-5 h-5')} Create account</button>`
  });
}

function saveSchoolSignup() {
  const name = document.getElementById('su_name').value.trim();
  const proprietor = document.getElementById('su_prop').value.trim();
  const phone = document.getElementById('su_phone').value.trim();
  const email = document.getElementById('su_email').value.trim();
  const plan = document.getElementById('su_plan').value;
  const pw = document.getElementById('su_pw').value;
  const pw2 = document.getElementById('su_pw2').value;
  const terms = document.getElementById('su_terms').checked;
  const docFile = (document.getElementById('su_doc') || {}).files && document.getElementById('su_doc').files[0];
  if (!name || !proprietor || !phone || !email) { toast('Please fill all required fields', 'danger'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid official school email', 'danger'); return; }
  if (!docFile) { toast('Please attach a school verification document', 'danger'); return; }
  if (pw.length < 8) { toast('Password must be at least 8 characters', 'danger'); return; }
  if (pw !== pw2) { toast('Passwords do not match', 'danger'); return; }
  if (!terms) { toast('Please accept the Terms to continue', 'danger'); return; }
  // Email must be unique across every account source
  if (resolveLogin(email, '').user) { toast('An account with that email already exists — try signing in', 'danger'); return; }

  const planFees = { Essential: 45000, Professional: 95000, Enterprise: 250000 };
  const emailDomain = email.split('@')[1] || '';
  const school = {
    id: uid('sch'),
    name, proprietor, email, phone, address: '', emailDomain,
    students: 0, teachers: 0,
    subscriptionPlan: plan, monthlyFee: planFees[plan],
    status: 'trial', joinedAt: today(), nextRenewal: daysAhead(14),
    autoRenew: false, signupSource: 'self', password: pw,
    // Gated onboarding: no dashboard access until CASPAA verifies the school.
    // status 'pending' is what the Super Admin review queue surfaces.
    verification: { status: 'pending', submittedAt: now(), officialEmail: email, docs: [{ name: docFile.name, uploadedAt: now() }] },
    kyc: { regNumber: 'Pending', ownerNIN: '', cacUploaded: true, accreditation: 'Pending' },
    branding: null
  };
  DB.insert('schools', school);
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: school.id, action: 'school_signup_pending', target: name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  // Sign them in so a session exists — but render() gates them to the
  // verification-pending holding screen until CASPAA approves.
  AUTH.login({ id: school.id, role: 'schooladmin', name: proprietor, email, schoolId: school.id });
  APP.render();
  toast(`Thanks ${proprietor.split(' ')[0]} — your school has been submitted for verification.`, 'success');
}

/* ---------- Verification gate (hybrid-gated onboarding) ----------
   A self-registered school proprietor gets NO dashboard access until the
   CASPAA team verifies their documents. Seeded/established schools have no
   `verification` field and are never gated; approved schools pass through. */
function pendingVerificationGate() {
  const u = AUTH.current;
  if (!u || u.role !== 'schooladmin') return null;
  const school = DB.find('schools', u.schoolId || u.id);
  if (!school || !school.verification) return null;
  const s = school.verification.status;
  return (s === 'pending' || s === 'rejected' || s === 'unverified') ? school : null;
}

function renderVerificationPending(school) {
  const v = school.verification || {};
  const rejected = v.status === 'rejected';
  const docs = v.docs || [];
  return `
    <div class="login-bg min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full ${rejected ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center">
          ${icon(rejected ? 'x' : 'bell', 'w-8 h-8')}
        </div>
        <h2 class="text-2xl font-extrabold text-slate-900 mb-1">${rejected ? 'Verification needs attention' : 'Your school is being verified'}</h2>
        <p class="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
          ${rejected
            ? 'We could not verify your school with the document provided. Please review the note below and re-submit.'
            : `Thanks, ${(school.proprietor || '').split(' ')[0]}. Our team is reviewing <strong>${school.name}</strong>. You'll get full access as soon as it's approved — usually within 1 business day.`}
        </p>

        ${rejected && v.reason ? `<div class="bg-rose-50 rounded-xl p-3 text-sm text-rose-800 text-left mb-4"><strong>Reviewer note:</strong> ${v.reason}</div>` : ''}

        <div class="bg-slate-50 rounded-xl p-4 text-left mb-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase text-slate-500">Status</span>
            <span class="badge ${rejected ? 'badge-danger' : 'badge-warn'}">${rejected ? 'Rejected' : 'Under review'}</span>
          </div>
          <div class="text-sm text-slate-600"><span class="text-slate-500">School:</span> ${school.name}</div>
          <div class="text-sm text-slate-600"><span class="text-slate-500">Official email:</span> ${school.email}</div>
          <div class="text-sm text-slate-600"><span class="text-slate-500">Documents:</span> ${docs.length ? docs.map(d => d.name).join(', ') : '—'}</div>
        </div>

        <div class="flex flex-col gap-2">
          <button class="btn btn-primary w-full" onclick="addVerificationDoc()">${icon('paperclip','w-4 h-4')} ${rejected ? 'Re-submit document' : 'Add another document'}</button>
          <button class="btn btn-secondary w-full" onclick="AUTH.logout()">${icon('logout','w-4 h-4')} Sign out</button>
        </div>
        <p class="text-xs text-slate-500 mt-4">Need help? Contact the CASPAA team at support@caspaa.com</p>
      </div>
    </div>
  `;
}

function addVerificationDoc() {
  modal({
    title: 'Submit verification document',
    body: `
      <div class="space-y-3">
        <p class="text-sm text-slate-500">Upload your CAC certificate, Ministry of Education approval, or similar proof that your school is legitimate.</p>
        <input id="vd_doc" type="file" class="input" accept=".pdf,.jpg,.jpeg,.png" />
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveVerificationDoc()">${icon('check','w-4 h-4')} Submit for review</button>`
  });
}

function saveVerificationDoc() {
  const el = document.getElementById('vd_doc');
  const file = el && el.files && el.files[0];
  if (!file) { toast('Please choose a document', 'danger'); return; }
  const school = DB.find('schools', AUTH.current.schoolId || AUTH.current.id);
  if (!school) return;
  const docs = [ ...((school.verification && school.verification.docs) || []), { name: file.name, uploadedAt: now() } ];
  DB.update('schools', school.id, {
    verification: { ...(school.verification || {}), status: 'pending', docs, resubmittedAt: now(), reason: null }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: school.id, action: 'verification_resubmitted', target: school.name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast('Document submitted — your school is back in the review queue', 'success');
  APP.render();
}

function togglePwVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  // Toggle icon between eye and eye-off
  btn.innerHTML = isHidden
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
}

function promptFirstLoginPasswordChange(account) {
  setTimeout(() => modal({
    title: 'Change Your Password',
    body: `
      <div class="space-y-3">
        <div class="bg-amber-50 rounded-xl p-3 text-sm text-amber-900">
          <strong>Action required:</strong> For your security, please set a personal password before continuing. You will not be able to proceed until this is done.
        </div>
        <div>
          <label class="input-label" for="fl_pw_new">New Password</label>
          <div class="relative">
            <input type="password" id="fl_pw_new" class="input pr-10" placeholder="Minimum 8 characters" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600" onclick="togglePwVisibility('fl_pw_new',this)" aria-label="Show or hide password">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
        <div>
          <label class="input-label" for="fl_pw_confirm">Confirm Password</label>
          <div class="relative">
            <input type="password" id="fl_pw_confirm" class="input pr-10" placeholder="Repeat new password" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600" onclick="togglePwVisibility('fl_pw_confirm',this)" aria-label="Show or hide password">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary w-full" onclick="saveFirstLoginPassword('${account.id}')">Set Password &amp; Continue</button>`
  }), 300);
}

function saveFirstLoginPassword(accountId) {
  const pw = document.getElementById('fl_pw_new').value;
  const confirm = document.getElementById('fl_pw_confirm').value;
  if (pw.length < 8) { toast('Password must be at least 8 characters', 'danger'); return; }
  if (pw !== confirm) { toast('Passwords do not match', 'danger'); return; }
  // Mark password as changed — in a real app this would hash and store server-side
  const collection = AUTH.current.role === 'parent'  ? 'parents'
                   : AUTH.current.role === 'teacher' ? 'teachers'
                   : AUTH.current.role === 'student' ? 'students'
                   : 'staff';
  const record = DB.find(collection, accountId);
  if (record) {
    DB.update(collection, accountId, { firstLogin: false, passwordChanged: true, passwordChangedAt: now() });
  }
  // Update current session flag
  AUTH.current.firstLogin = false;
  document.getElementById('modalBackdrop')?.click();
  toast('Password updated — welcome to CASPAA!', 'success');
  APP.render();
}

function showOTPScreen(account) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  // In a real app the code is emailed; here we display it for the demo.
  document.getElementById('app').innerHTML = `
    <div class="login-bg min-h-screen flex">

      <!-- Hero panel (left) — deep CASPAA Green -->
      <div class="login-hero hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden shrink-0 flex-col justify-center p-10 xl:p-12">
        <img src="logo/caspaa-white.svg" alt="CASPAA" class="relative h-8 w-auto" onerror="this.remove()" />
      </div>

      <!-- Verification card (right) -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="login-card w-full max-w-md">
          <img src="logo/caspaa-navy.svg" alt="CASPAA" class="lg:hidden h-8 w-auto mx-auto mb-8" />
          <div class="bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-8">
            <div class="w-12 h-12 mb-4 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">${icon('shield', 'w-6 h-6')}</div>
            <h3 class="text-2xl font-bold text-slate-900 mb-1">Two-factor authentication</h3>
            <p class="text-sm text-slate-500 mb-6">A 6-digit code was sent to <strong class="text-slate-700">${account.email}</strong></p>

            <div class="bg-amber-50 rounded-lg p-3 mb-5 text-center">
              <div class="text-xs text-amber-800 font-semibold mb-1 uppercase tracking-wide">Demo code (for testing)</div>
              <div class="text-2xl font-mono font-bold text-amber-900 tracking-[0.3em]">${otp}</div>
            </div>

            <form id="otpForm" class="space-y-4">
              <div>
                <label class="input-label" for="otpInput">Verification code</label>
                <input id="otpInput" inputmode="numeric" maxlength="6" class="input text-center text-2xl font-mono tracking-[0.4em]" placeholder="000000" autocomplete="one-time-code" />
              </div>
              <button type="submit" class="btn btn-accent w-full" id="otpVerify">Verify &amp; sign in</button>
            </form>

            <div class="text-center mt-4">
              <button type="button" id="otpBack" class="text-sm text-coral-600 hover:text-coral-700 font-semibold">← Back to sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById('otpInput');
  setTimeout(() => input && input.focus(), 100);

  document.getElementById('otpForm').onsubmit = (e) => {
    e.preventDefault();
    const entered = input.value.trim();
    if (entered !== otp) { toast('Invalid code. Please try again.', 'danger'); return; }
    AUTH.login(account);
    toast(`Welcome back, ${account.name.split(' ')[0]}!`, 'success');
    APP.render();
  };

  document.getElementById('otpBack').onclick = () => { APP.render(); };
}

AUTH.init();
