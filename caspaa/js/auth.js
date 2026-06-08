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

        <!-- Login card -->
        <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <h3 class="text-xl font-bold text-slate-900 mb-1">Sign in to your dashboard</h3>
          <p class="text-sm text-slate-500 mb-6">Choose your role to continue</p>

          <!-- Quick demo logins (the killer UX feature) -->
          <div class="space-y-2 mb-5">
            ${DEMO_ACCOUNTS.map(a => `
              <button data-account="${a.id}" class="demo-login w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50 transition text-left group">
                ${avatar(a.name, 'md')}
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-900 text-sm truncate">${a.title}</div>
                  <div class="text-xs text-slate-500 truncate">${a.subtitle}</div>
                </div>
                <div class="text-brand-600 opacity-0 group-hover:opacity-100 transition">${icon('arrow_left', 'w-4 h-4 rotate-180')}</div>
              </button>
            `).join('')}
          </div>

          <div class="text-center">
            <button id="emailLoginToggle" class="text-sm text-brand-700 hover:text-brand-800 font-semibold">Or sign in with email →</button>
          </div>

          <div id="emailLoginForm" class="hidden mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div>
              <label class="input-label">Email</label>
              <input type="email" class="input" id="loginEmail" placeholder="you@school.ng" />
            </div>
            <div>
              <label class="input-label">Password</label>
              <input type="password" class="input" id="loginPassword" placeholder="••••••••" value="demo1234" />
              <p class="text-xs text-slate-400 mt-1">Use password <strong>demo1234</strong> for any demo email</p>
            </div>
            <button class="btn btn-primary w-full" id="emailLoginBtn">Sign in</button>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100 text-center">
            <p class="text-xs text-slate-400">By signing in, you agree to CASPAA's Terms and Privacy Policy. Your data is encrypted with AES-256.</p>
          </div>
        </div>

      </div>
    </div>
  `;
}

function bindLoginHandlers() {
  document.querySelectorAll('.demo-login').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.account;
      const acc = DEMO_ACCOUNTS.find(a => a.id === id);
      if (!acc) return;
      // Sensitive roles get OTP step
      if (acc.role === 'superadmin' || acc.role === 'finance') {
        showOTPModal(acc);
      } else {
        AUTH.login(acc);
        toast(`Welcome back, ${acc.name.split(' ')[0]}!`, 'success');
        APP.render();
      }
    };
  });

  document.getElementById('emailLoginToggle').onclick = () => {
    document.getElementById('emailLoginForm').classList.toggle('hidden');
  };

  document.getElementById('emailLoginBtn').onclick = () => {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pwd = document.getElementById('loginPassword').value;
    if (pwd !== 'demo1234') { toast('Incorrect password', 'danger'); return; }
    const acc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
    if (!acc) { toast('No account found with that email', 'danger'); return; }
    if (acc.role === 'superadmin' || acc.role === 'finance') { showOTPModal(acc); }
    else { AUTH.login(acc); APP.render(); toast(`Welcome back, ${acc.name.split(' ')[0]}!`); }
  };
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
