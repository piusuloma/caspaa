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
  const ROLE_OPTIONS = [
    { role: 'superadmin',  label: 'CASPAA Super Admin' },
    { role: 'schooladmin', label: 'School Proprietor' },
    { role: 'principal',   label: 'Principal' },
    { role: 'finance',     label: 'Finance Officer' },
    { role: 'teacher',     label: 'Teacher' },
    { role: 'parent',      label: 'Parent' },
    { role: 'student',     label: 'Student' }
  ];
  return `
    <div class="login-bg min-h-screen flex">

      <!-- Hero image panel (left) -->
      <div class="login-hero hidden lg:block lg:w-[42%] xl:w-[38%] relative overflow-hidden shrink-0">
        <img src="logo/login-hero.png" alt="CASPAA" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()" />
        <div class="absolute inset-x-0 bottom-0 p-10 text-center">
          <p class="text-white text-2xl font-bold leading-snug max-w-sm mx-auto" style="text-shadow:0 1px 12px rgba(0,0,0,.4)">One platform for every part of your school.</p>
        </div>
      </div>

      <!-- Form area (right) -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="login-card w-full max-w-md">
          <img src="logo/caspaa-coral.svg" alt="CASPAA" class="lg:hidden h-8 w-auto mx-auto mb-8" />
          <div class="bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-8">
            <h3 class="text-2xl font-bold text-slate-900 mb-1">Sign in to your Account</h3>
            <p class="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

            <form id="signinForm" class="space-y-4" autocomplete="on">
              <div>
                <label class="input-label" for="loginRole">Role</label>
                <select id="loginRole" class="input">
                  <option value="">Select your role…</option>
                  ${ROLE_OPTIONS.map(r => `<option value="${r.role}">${r.label}</option>`).join('')}
                </select>
              </div>

              <!-- Standard credentials (email + password) -->
              <div id="credStandard" class="space-y-4">
                <div>
                  <label class="input-label" for="loginEmail">Email address</label>
                  <input type="email" class="input" id="loginEmail" placeholder="you@school.ng" autocomplete="username" />
                </div>
                <div>
                  <label class="input-label" for="loginPassword">Password</label>
                  <div class="relative">
                    <input type="password" class="input pr-10" id="loginPassword" placeholder="••••••••" value="demo1234" autocomplete="current-password" />
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onclick="togglePwVisibility('loginPassword', this)" tabindex="-1" aria-label="Show password">
                      <svg id="loginEyeIcon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Student credentials (admission number + date of birth) -->
              <div id="credStudent" class="space-y-4 hidden">
                <div>
                  <label class="input-label" for="studentAdmNo">Admission number</label>
                  <input type="text" class="input" id="studentAdmNo" placeholder="e.g. BL/2025/001" style="text-transform:uppercase" />
                </div>
                <div>
                  <label class="input-label" for="studentDob">Date of birth</label>
                  <input type="date" class="input" id="studentDob" />
                </div>
              </div>

              <button type="submit" class="btn btn-accent w-full" id="signinBtn">Sign in</button>
            </form>


            <div class="mt-6 pt-5 border-t border-slate-100 text-center">
              <p class="text-xs text-slate-400">By signing in, you agree to CASPAA's Terms and Privacy Policy. Your data is encrypted with AES-256.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindLoginHandlers() {
  const form     = document.getElementById('signinForm');
  const roleSel  = document.getElementById('loginRole');
  const emailInp = document.getElementById('loginEmail');
  const credStd  = document.getElementById('credStandard');
  const credStu  = document.getElementById('credStudent');
  const demoHint = document.getElementById('demoHint');

  // Swap the credential fields based on the selected role
  const syncFields = () => {
    const stu = roleSel.value === 'student';
    credStd.classList.toggle('hidden', stu);
    credStu.classList.toggle('hidden', !stu);
    if (demoHint) demoHint.classList.toggle('hidden', stu);
    if (!stu) {
      const acc = DEMO_ACCOUNTS.find(a => a.role === roleSel.value);
      if (acc && emailInp && !emailInp.dataset.touched) emailInp.value = acc.email;
    }
  };

  if (roleSel) roleSel.onchange = syncFields;
  if (emailInp) emailInp.oninput = () => { emailInp.dataset.touched = '1'; };

  if (form) form.onsubmit = (e) => {
    e.preventDefault();
    const role = roleSel.value;
    if (!role) { toast('Please select your role', 'danger'); return; }

    if (role === 'student') { studentSignIn(); return; }

    const email = emailInp.value.trim().toLowerCase();
    const pwd   = document.getElementById('loginPassword').value;
    if (!email) { toast('Please enter your email address', 'danger'); return; }
    if (pwd !== 'demo1234') { toast('Incorrect password', 'danger'); return; }
    let acc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    if (!acc) acc = DEMO_ACCOUNTS.find(a => a.role === role);
    if (!acc) { toast('No account found with that email', 'danger'); return; }
    if (acc.role !== role) { toast('This email does not match the selected role', 'danger'); return; }
    if (acc.role === 'superadmin' || acc.role === 'finance') {
      showOTPScreen(acc);
    } else {
      AUTH.login(acc);
      toast(`Welcome back, ${acc.name.split(' ')[0]}!`, 'success');
      APP.render();
      if (acc.firstLogin) promptFirstLoginPasswordChange(acc);
    }
  };
}

function studentSignIn() {
  const admNo = document.getElementById('studentAdmNo').value.trim().toUpperCase();
  const dob   = document.getElementById('studentDob').value;
  if (!admNo || !dob) { toast('Please enter your admission number and date of birth', 'danger'); return; }

  const student = DB.get('students').find(s =>
    s.admissionNo && s.admissionNo.toUpperCase() === admNo &&
    s.dob === dob && s.status === 'active'
  );
  if (!student) { toast('No active student found — please check your admission number and date of birth', 'danger'); return; }

  const cls         = DB.find('classes', student.classId);
  const schoolName  = DB.settings().schoolName || 'School';
  const isSecondary = cls && cls.level === 'Secondary';

  const sessionUser = {
    id:         student.id,
    role:       'student',
    name:       student.name,
    email:      student.email || '',
    title:      'Student',
    subtitle:   `${cls ? cls.name : ''} — ${schoolName}`,
    schoolId:   student.schoolId,
    firstLogin: isSecondary && !student.passwordChanged
  };

  AUTH.login(sessionUser);
  DB.insert('auditLog', { id: uid('aud'), schoolId: student.schoolId, actor: student.id, action: 'student_login', target: student.name, timestamp: now() });
  toast(`Welcome, ${student.name.split(' ')[0]}!`, 'success');
  APP.render();
  if (sessionUser.firstLogin) promptFirstLoginPasswordChange(sessionUser);
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

function showOTPScreen(account) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  // In a real app the code is emailed; here we display it for the demo.
  document.getElementById('app').innerHTML = `
    <div class="login-bg min-h-screen flex">

      <!-- Hero image panel (left) -->
      <div class="login-hero hidden lg:block lg:w-[42%] xl:w-[38%] relative overflow-hidden shrink-0">
        <img src="logo/login-hero.png" alt="CASPAA" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()" />
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
