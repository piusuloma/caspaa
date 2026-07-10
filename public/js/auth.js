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

/* ---------- Login screen ---------- */
function renderLogin() {
  return `
    <div class="login-bg min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

        <!-- Branding side -->
        <div class="text-white">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl font-extrabold shadow-lg">C</div>
            <div>
              <h1 class="text-3xl font-extrabold tracking-tight">CASPAA</h1>
              <p class="text-brand-200 text-sm">School Operating System</p>
            </div>
          </div>

          <h2 class="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            One platform for <span class="text-brand-300">every part</span> of your school.
          </h2>
          <p class="text-slate-200 text-lg mb-8 max-w-md">
            From School Operations, Payment, Financing, Attendance, Learning, CBT and Engagement Infrastructure — CASPAA is a unified solution that replaces the several different tools your school is using right now.
          </p>

          <div class="grid grid-cols-2 gap-4 max-w-md">
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('attendance', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">Works Offline</div>
                <div class="text-xs text-slate-300">Mark attendance with no signal</div>
              </div>
            </div>
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('fees', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">Payment</div>
                <div class="text-xs text-slate-300">Parents pay in 30 seconds</div>
              </div>
            </div>
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('loan', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">Fee Financing</div>
                <div class="text-xs text-slate-300">Loans approved in 24 hours</div>
              </div>
            </div>
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('ai', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">AI Assistant</div>
                <div class="text-xs text-slate-300">Write report comments instantly</div>
              </div>
            </div>
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('results', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">CBT Learnings</div>
                <div class="text-xs text-slate-300">Run digital tests & exams</div>
              </div>
            </div>
            <div class="flex gap-3 items-start">
              <div class="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">${icon('check', 'w-5 h-5')}</div>
              <div>
                <div class="font-semibold text-sm">Digital Consent</div>
                <div class="text-xs text-slate-300">Approve activities online</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Login card (identifier-first, two-step) -->
        <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

          <!-- Step 1: who are you? -->
          <div id="loginStep1">
            <h3 class="text-xl font-bold text-slate-900 mb-1">Sign in to your dashboard</h3>
            <p class="text-sm text-slate-500 mb-6">Enter your email or admission number to continue.</p>
            <div class="space-y-3">
              <div>
                <label class="input-label">Email or Admission Number</label>
                <input type="text" class="input" id="loginIdentifier" placeholder="you@school.ng  ·  BL/2025/001" autocomplete="username" />
              </div>
              <button class="btn btn-primary w-full" id="loginContinueBtn">Continue</button>
              <p class="text-xs text-slate-400 text-center">Staff &amp; parents use email · students use their admission number</p>
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
            <p class="text-xs text-slate-400">By signing in, you agree to CASPAA's Terms and Privacy Policy. Your data is encrypted with AES-256.</p>
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
    return { ok: pwd === 'demo1234', user: { id: school.id, role: 'schooladmin', name: school.proprietor || school.name, email: school.email || '', schoolId: school.id } };
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
          <label class="input-label">Date of Birth</label>
          <input type="date" class="input" id="loginDob" />
        </div>
        <button class="btn btn-primary w-full" id="loginSubmitBtn">Sign in as Student</button>`;
    } else {
      body.innerHTML = `
        <div>
          <label class="input-label">Password</label>
          <div class="relative">
            <input type="password" class="input pr-10" id="loginPassword" placeholder="••••••••" autocomplete="current-password" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onclick="togglePwVisibility('loginPassword', this)" tabindex="-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" class="w-4 h-4 accent-brand-600" /> Remember me</label>
          <button type="button" class="text-sm text-brand-700 font-semibold" onclick="toast('If that account exists, a reset link has been sent.','info')">Forgot password?</button>
        </div>
        <button class="btn btn-primary w-full" id="loginSubmitBtn">Sign in</button>
        <p class="text-xs text-slate-400 text-center">Demo accounts use password <strong>demo1234</strong></p>`;
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
      showOTPModal(user);
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
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          <strong>Action required:</strong> For your security, please set a personal password before continuing. You will not be able to proceed until this is done.
        </div>
        <div>
          <label class="input-label">New Password</label>
          <div class="relative">
            <input type="password" id="fl_pw_new" class="input pr-10" placeholder="Minimum 8 characters" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onclick="togglePwVisibility('fl_pw_new',this)" tabindex="-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
        <div>
          <label class="input-label">Confirm Password</label>
          <div class="relative">
            <input type="password" id="fl_pw_confirm" class="input pr-10" placeholder="Repeat new password" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onclick="togglePwVisibility('fl_pw_confirm',this)" tabindex="-1">
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

function showOTPModal(account) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  // In real app, we'd send via email. Here we display it.
  modal({
    title: 'Two-Factor Authentication',
    size: '',
    body: `
      <div class="text-center py-4">
        <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">${icon('bell', 'w-7 h-7')}</div>
        <p class="text-slate-700 mb-1">For security, we need to verify your identity.</p>
        <p class="text-sm text-slate-500 mb-5">A 6-digit code was sent to <strong>${account.email}</strong></p>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm">
          <div class="text-amber-800 font-semibold mb-1">Demo OTP (for testing)</div>
          <div class="text-2xl font-mono font-bold text-amber-900 tracking-widest">${otp}</div>
        </div>
        <input id="otpInput" maxlength="6" class="input text-center text-2xl font-mono tracking-widest" placeholder="000000" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" id="otpVerify">Verify & Sign in</button>
    `
  });

  setTimeout(() => document.getElementById('otpInput').focus(), 100);

  document.getElementById('otpVerify').onclick = () => {
    const entered = document.getElementById('otpInput').value.trim();
    if (entered !== otp) { toast('Invalid code. Please try again.', 'danger'); return; }
    document.getElementById('modalBackdrop').click();
    AUTH.login(account);
    toast(`Welcome back, ${account.name.split(' ')[0]}!`);
    APP.render();
  };
}

AUTH.init();
