/* ============================================================
   PARENT MODULE
   Designed for the lowest-tech user: big buttons, clear copy.
   ============================================================ */

function parentChildren() {
  return COMPUTE.parentChildren(AUTH.current.id);
}

/* ---------- Dashboard ---------- */
function view_par_dashboard() {
  const parent = DB.find('parents', AUTH.current.id) || { name: AUTH.current.name || 'Parent' };
  const children = parentChildren();
  // First-login welcome flow
  if (parent.firstLogin) {
    setTimeout(() => { if (!document.getElementById('modalBackdrop')?.innerHTML) parentWelcomeWizard(); }, 200);
  }
  const totalOutstanding = children.reduce((s, c) => {
    const inv = COMPUTE.studentInvoice(c.id);
    return s + (inv ? inv.balance : 0);
  }, 0);
  const totalPaid = children.reduce((s, c) => {
    const inv = COMPUTE.studentInvoice(c.id);
    return s + (inv ? inv.paid : 0);
  }, 0);
  const totalBilled = totalPaid + totalOutstanding;
  const paidPct = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const announcements = DB.query('announcements', a => a.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && (a.audience === 'all' || a.audience === 'parents')).slice(0, 3);
  // Pending digital-consent requests across this parent's children
  const childClassIds = children.map(c => c.classId);
  const consentForms = DB.query('consentForms', f => f.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && (f.classId === 'all' || childClassIds.includes(f.classId)));
  let pendingConsent = 0;
  consentForms.forEach(f => {
    const kids = f.classId === 'all' ? children : children.filter(c => c.classId === f.classId);
    kids.forEach(k => { if (!DB.query('consentResponses', x => x.formId === f.id && x.studentId === k.id)[0]) pendingConsent++; });
  });

  return `
    <div class="space-y-5">
      <!-- Hero greeting -->
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <p class="text-brand-200 text-sm">Hello,</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold">${parent.name.split(' ').slice(-1)}</h1>
        <p class="text-brand-100 text-sm mt-1">${children.length} ${children.length === 1 ? 'child' : 'children'} at ${(DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School'}</p>

        ${totalBilled > 0 ? `<div class="mt-4 bg-white/15 backdrop-blur rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-xs text-brand-100">Term fees · ${money(totalBilled)} total</div>
              <div class="text-xs text-brand-100 mt-0.5">${paidPct}% paid · ${children.length} child${children.length !== 1 ? 'ren' : ''}</div>
            </div>
            ${totalOutstanding > 0 ? `<button class="bg-white text-brand-700 px-4 py-2 rounded-lg font-bold text-sm" onclick="APP.go('par_fees')">Pay Now</button>` : `<span class="badge badge-success">${icon('check','w-3 h-3')} All Paid</span>`}
          </div>
          <div class="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div class="text-xs text-emerald-200">Paid</div>
              <div class="text-lg font-bold text-emerald-200">${money(totalPaid)}</div>
            </div>
            <div class="text-right">
              <div class="text-xs ${totalOutstanding > 0 ? 'text-amber-200' : 'text-brand-100'}">${totalOutstanding > 0 ? 'Outstanding' : 'Cleared'}</div>
              <div class="text-lg font-bold ${totalOutstanding > 0 ? 'text-amber-200' : 'text-emerald-200'}">${money(totalOutstanding)}</div>
            </div>
          </div>
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-300 rounded-full transition-all" style="width: ${paidPct}%"></div>
          </div>
        </div>` : `<div class="mt-4 bg-white/15 rounded-xl p-3 flex items-center gap-3">
          ${icon('bell','w-5 h-5 text-amber-200')}
          <div class="text-sm">No invoices have been issued yet for this term.</div>
        </div>`}
      </div>

      <!-- Pending consent alert -->
      ${pendingConsent ? `<button class="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left hover:bg-amber-100 transition" onclick="APP.go('par_consent')">
        <span class="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">${icon('check','w-5 h-5')}</span>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-amber-900">${pendingConsent} consent form${pendingConsent !== 1 ? 's' : ''} awaiting your approval</div>
          <div class="text-sm text-amber-700">Tap to review and sign — no paperwork needed.</div>
        </div>
        <span class="text-amber-700">${icon('arrow_left','w-4 h-4 rotate-180')}</span>
      </button>` : ''}

      <!-- Children cards -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-slate-900">My Children</h2>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('par_children')">See all →</button>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          ${children.map(c => renderChildCard(c)).join('')}
        </div>
      </div>

      <!-- Student achievements banner -->
      ${(() => {
        const achievers = children.filter(c => c.awards || c.achievements || c.badges);
        if (!achievers.length) return '';
        return `<div class="card bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center text-base">🏆</span>
            <h3 class="font-bold text-amber-900">Recent Achievements</h3>
          </div>
          <div class="space-y-2">
            ${achievers.map(c => {
              const awards = c.awards || c.achievements || '';
              const badge = c.badges || '';
              return `<div class="flex items-start gap-3 p-2.5 bg-white/70 rounded-xl">
                ${avatar(c.name, 'sm')}
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm text-slate-900">${c.name}</div>
                  ${awards ? `<div class="text-xs text-amber-800 mt-0.5">🌟 ${awards}</div>` : ''}
                  ${badge ? `<div class="mt-1 flex flex-wrap gap-1">${badge.split(',').map(b => `<span class="badge badge-warn text-xs">${b.trim()}</span>`).join('')}</div>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      })()}

      <!-- Parent assistance banner -->
      ${(() => {
        const school = DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {};
        return `<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <span class="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">${icon('chat','w-5 h-5')}</span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-blue-900">Need help?</div>
            <div class="text-sm text-blue-700 mt-0.5">For queries on fees, records, or your child's welfare, contact the school directly.</div>
            ${school.phone ? `<div class="mt-2 flex flex-wrap gap-2">
              <a href="tel:${school.phone}" class="btn btn-secondary !text-xs !py-1.5">${icon('bell','w-3 h-3')} ${school.phone}</a>
              ${school.email ? `<a href="mailto:${school.email}" class="btn btn-secondary !text-xs !py-1.5">${icon('chat','w-3 h-3')} Email school</a>` : ''}
            </div>` : `<button class="btn btn-secondary !text-xs !py-1.5 mt-2" onclick="APP.go('par_messages')">${icon('chat','w-3 h-3')} Send a message</button>`}
          </div>
        </div>`;
      })()}

      <!-- Quick actions -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_fees')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-2">${icon('fees','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Pay Fees</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_loans')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">${icon('loan','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Apply for Loan</div>
        </button>
        <button class="card card-hover p-4 text-center relative" onclick="APP.go('par_consent')">
          ${pendingConsent ? `<span class="absolute top-2 right-2 badge badge-warn">${pendingConsent}</span>` : ''}
          <div class="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">${icon('check','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Consent</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_messages')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">${icon('chat','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Message Teacher</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_announce')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">${icon('bell','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Announcements</div>
        </button>
      </div>

      <!-- Announcements -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Latest from School</h3>
        </div>
        ${announcements.length === 0
          ? `<p class="text-slate-500 text-sm p-4 text-center">No announcements from the school yet.</p>`
          : `<div class="space-y-3">
          ${announcements.map(a => `<div class="border-l-4 border-brand-500 pl-3 py-1">
            <div class="font-semibold text-sm text-slate-900">${a.title}</div>
            <div class="text-sm text-slate-600 line-clamp-2">${a.body}</div>
            <div class="text-xs text-slate-400 mt-1">${fdate(a.timestamp, { relative: true })}</div>
          </div>`).join('')}
        </div>`}
      </div>
    </div>
  `;
}

/* ---------- First-login welcome wizard ---------- */
function parentWelcomeWizard() {
  const parent = DB.find('parents', AUTH.current.id);
  if (!parent) return;
  const step = APP.params.welcomeStep || 1;
  const children = parentChildren();
  const totalOutstanding = children.reduce((s, c) => { const i = COMPUTE.studentInvoice(c.id); return s + (i ? i.balance : 0); }, 0);

  const stepIndicator = `
    <div class="flex items-center gap-2 mb-4">
      ${[1,2,3].map(n => `
        <div class="flex-1 flex items-center gap-2">
          <div class="w-7 h-7 rounded-full ${n < step ? 'bg-emerald-500 text-white' : n === step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-xs font-bold">${n < step ? icon('check','w-3 h-3') : n}</div>
          ${n < 3 ? `<div class="flex-1 h-0.5 ${n < step ? 'bg-emerald-500' : 'bg-slate-200'}"></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  let bodyContent = '';
  let footerContent = '';

  if (step === 1) {
    bodyContent = `
      <div class="text-center mb-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mb-3">${icon('user','w-8 h-8')}</div>
        <h2 class="text-xl font-bold text-slate-900">Welcome, ${parent.name.split(' ').slice(-1)}!</h2>
        <p class="text-sm text-slate-500 mt-1">First, let's change your temporary password to something secure.</p>
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Temporary password (we sent this)</label>
          <input id="pw_old" type="password" class="input" placeholder="${parent.credentials ? parent.credentials.tempPassword : ''}" />
          <p class="text-xs text-slate-400 mt-1">${parent.credentials ? 'Pre-fill hint: ' + parent.credentials.tempPassword : ''}</p>
        </div>
        <div><label class="input-label">New password</label><input id="pw_new" type="password" class="input" placeholder="At least 8 characters" /></div>
        <div><label class="input-label">Confirm new password</label><input id="pw_new2" type="password" class="input" placeholder="Re-enter new password" /></div>
      </div>
    `;
    footerContent = `<button class="btn btn-primary w-full" onclick="parentWelcomeStep1Next()">Set password →</button>`;
  } else if (step === 2) {
    bodyContent = `
      <div class="text-center mb-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mb-3">${icon('chat','w-8 h-8')}</div>
        <h2 class="text-xl font-bold text-slate-900">Confirm your contact</h2>
        <p class="text-sm text-slate-500 mt-1">We'll send WhatsApp and email updates here. You can change later in your profile.</p>
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Phone (WhatsApp)</label><input id="cnt_phone" class="input" value="${parent.phone || ''}" /></div>
        <div><label class="input-label">Email</label><input id="cnt_email" type="email" class="input" value="${parent.email || ''}" /></div>
        <label class="flex items-center gap-2 text-sm p-3 bg-slate-50 rounded-xl"><input type="checkbox" checked /> <span>Send me WhatsApp alerts for absences, fee reminders, and announcements</span></label>
        <label class="flex items-center gap-2 text-sm p-3 bg-slate-50 rounded-xl"><input type="checkbox" checked /> <span>Email me termly report cards</span></label>
      </div>
    `;
    footerContent = `
      <button class="btn btn-secondary" onclick="APP.params.welcomeStep = 1; parentWelcomeWizard()">← Back</button>
      <button class="btn btn-primary" onclick="parentWelcomeStep2Next()">Continue →</button>
    `;
  } else {
    bodyContent = `
      <div class="text-center mb-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">${icon('check','w-8 h-8')}</div>
        <h2 class="text-xl font-bold text-slate-900">You're all set</h2>
        <p class="text-sm text-slate-500 mt-1">Here's what's on your dashboard right now.</p>
      </div>
      <div class="space-y-2">
        ${children.map(c => {
          const cls = DB.find('classes', c.classId);
          const inv = COMPUTE.studentInvoice(c.id);
          return `<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            ${avatar(c, 'md')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold">${c.name}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : ''}</div>
            </div>
            ${inv ? `<div class="text-right"><div class="text-xs text-slate-500">Outstanding</div><div class="font-mono font-bold ${inv.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}">${money(inv.balance)}</div></div>` : ''}
          </div>`;
        }).join('')}
      </div>
      ${totalOutstanding > 0 ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 mt-3">
        ${icon('fees','w-4 h-4 inline')} Your first invoice (<strong>${money(totalOutstanding)} outstanding</strong>) is ready. We made paying easy — card, transfer, USSD, or visit the school office.
      </div>` : ''}
    `;
    footerContent = `
      <button class="btn btn-secondary" onclick="APP.params.welcomeStep = 2; parentWelcomeWizard()">← Back</button>
      <button class="btn btn-primary" onclick="parentWelcomeFinish()">${totalOutstanding > 0 ? 'View fees →' : 'Take me to my dashboard →'}</button>
    `;
  }

  modal({
    title: `Welcome to CASPAA · Step ${step} of 3`,
    body: stepIndicator + bodyContent,
    footer: footerContent
  });
}

function parentWelcomeStep1Next() {
  const pw = document.getElementById('pw_new').value;
  const pw2 = document.getElementById('pw_new2').value;
  if (!pw || pw.length < 8) { toast('Password must be at least 8 characters', 'danger'); return; }
  if (pw !== pw2) { toast('Passwords do not match', 'danger'); return; }
  const parent = DB.find('parents', AUTH.current.id);
  DB.update('parents', parent.id, { credentials: Object.assign({}, parent.credentials, { tempPassword: null, passwordChangedAt: now() }) });
  APP.params.welcomeStep = 2;
  parentWelcomeWizard();
}

function parentWelcomeStep2Next() {
  const phone = document.getElementById('cnt_phone').value.trim();
  const email = document.getElementById('cnt_email').value.trim();
  const parent = DB.find('parents', AUTH.current.id);
  DB.update('parents', parent.id, { phone, email });
  APP.params.welcomeStep = 3;
  parentWelcomeWizard();
}

function parentWelcomeFinish() {
  const parent = DB.find('parents', AUTH.current.id);
  DB.update('parents', parent.id, { firstLogin: false, onboardedAt: now() });
  APP.params.welcomeStep = null;
  document.getElementById('modalBackdrop').click();
  // If outstanding, route to fees page
  const children = parentChildren();
  const totalOutstanding = children.reduce((s, c) => { const i = COMPUTE.studentInvoice(c.id); return s + (i ? i.balance : 0); }, 0);
  if (totalOutstanding > 0) APP.go('par_fees');
  else APP.render();
  toast('You\'re all set up. Welcome!');
}

function renderChildCard(child) {
  const cls = DB.find('classes', child.classId);
  const inv = COMPUTE.studentInvoice(child.id);
  const attRate = COMPUTE.attendanceRate(child.id);
  const results = COMPUTE.studentResults(child.id).filter(r => r.approved);
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  return `
    <div class="card card-hover p-4 cursor-pointer" onclick="viewChildDetail('${child.id}')">
      <div class="flex items-center gap-3 mb-3">
        ${avatar(child, 'lg')}
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-900 truncate">${child.name}</div>
          <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${child.admissionNo}</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-center mb-3">
        <div class="bg-brand-50 rounded-lg p-2">
          <div class="text-xs text-brand-700 font-semibold">ATTENDANCE</div>
          <div class="font-bold text-brand-900">${attRate}%</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-2">
          <div class="text-xs text-blue-700 font-semibold">AVG SCORE</div>
          <div class="font-bold text-blue-900">${avg}%</div>
        </div>
      </div>
      ${inv ? `<div class="bg-slate-50 rounded-lg p-3 mb-3">
        <div class="flex justify-between items-baseline mb-1.5">
          <span class="text-xs font-semibold text-slate-700 uppercase">Fees this term</span>
          ${inv.status === 'paid' ? '<span class="badge badge-success">Cleared</span>' : inv.status === 'partial' ? '<span class="badge badge-warn">Partial</span>' : '<span class="badge badge-danger">Outstanding</span>'}
        </div>
        <div class="flex justify-between text-xs mb-1.5">
          <span class="text-emerald-700"><strong class="font-mono">${money(inv.paid)}</strong> paid</span>
          <span class="${inv.balance > 0 ? 'text-rose-700' : 'text-slate-500'}"><strong class="font-mono">${money(inv.balance)}</strong> ${inv.balance > 0 ? 'outstanding' : 'cleared'}</span>
        </div>
        <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full" style="width: ${inv.total ? Math.round((inv.paid / inv.total) * 100) : 0}%"></div>
        </div>
      </div>` : '<div class="bg-slate-50 rounded-lg p-3 mb-3 text-xs text-slate-500 text-center">No invoice yet for this term</div>'}
      <button class="btn btn-secondary w-full text-sm">View full profile →</button>
    </div>
  `;
}

function viewChildDetail(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  const inv = COMPUTE.studentInvoice(studentId);
  const attRate = COMPUTE.attendanceRate(studentId);
  const results = COMPUTE.studentResults(studentId).filter(r => r.approved);
  const subjects = DB.get('subjects');
  const recentAtt = COMPUTE.studentAttendance(studentId).slice(-10).reverse();
  const assignments = DB.query('assignments', a => a.classId === s.classId);

  modal({
    title: `${s.name}'s Profile`,
    size: 'lg',
    body: `
      <div class="text-center mb-4 pb-4 border-b border-slate-100">
        ${avatar(s.name, 'xl')}
        <h2 class="text-xl font-bold text-slate-900 mt-3">${s.name}</h2>
        <p class="text-sm text-slate-500">${cls ? cls.name : ''} · ${calcAge(s.dob)} years</p>
      </div>

      ${tabs([
        { key: 'overview', label: 'Overview' },
        { key: 'results', label: 'Results' },
        { key: 'attendance', label: 'Attendance' },
        { key: 'assignments', label: 'Homework', badge: assignments.length || null }
      ], APP.params.childTab || 'overview', (k) => { APP.params.childTab = k; viewChildDetail(studentId); })}

      <div class="pt-4">
        ${
          (APP.params.childTab === 'results') ? `
            <div class="space-y-2">
              ${results.length ? results.map(r => {
                const sub = subjects.find(x => x.id === r.subjectId);
                return `<div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div class="font-semibold text-sm">${sub ? sub.name : ''}</div>
                    <div class="text-xs text-slate-500">CA1: ${r.ca1} · CA2: ${r.ca2} · Exam: ${r.exam}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-lg">${r.total}<span class="text-sm text-slate-400">/100</span></div>
                    <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'}">${r.grade}</span>
                  </div>
                </div>`;
              }).join('') : emptyState({ title: 'No results yet', body: 'Results will appear here once teachers submit them.', icon: 'results' })}
              ${results.length ? `<div class="grid grid-cols-2 gap-2">
                <button class="btn btn-secondary" onclick="printReportCard('${studentId}')">${icon('download','w-4 h-4')} Report Card</button>
                <button class="btn btn-secondary" onclick="printTranscript('${studentId}')">${icon('download','w-4 h-4')} Full Transcript</button>
              </div>` : ''}
            </div>
          ` : (APP.params.childTab === 'attendance') ? `
            <div class="mb-3 grid grid-cols-3 gap-2 text-center">
              <div class="bg-emerald-50 p-3 rounded-xl"><div class="text-xs text-emerald-700">Present</div><div class="font-bold text-emerald-900">${recentAtt.filter(a=>a.status==='present').length}</div></div>
              <div class="bg-amber-50 p-3 rounded-xl"><div class="text-xs text-amber-700">Late</div><div class="font-bold text-amber-900">${recentAtt.filter(a=>a.status==='late').length}</div></div>
              <div class="bg-rose-50 p-3 rounded-xl"><div class="text-xs text-rose-700">Absent</div><div class="font-bold text-rose-900">${recentAtt.filter(a=>a.status==='absent').length}</div></div>
            </div>
            <div class="space-y-1">
              ${recentAtt.map(a => `<div class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                <span>${fdate(a.date, { long: true })}</span>
                ${statusBadge(a.status)}
              </div>`).join('')}
            </div>
          ` : (APP.params.childTab === 'assignments') ? `
            <div class="space-y-2">
              ${assignments.length ? assignments.map(a => {
                const sub = subjects.find(s2 => s2.id === a.subjectId);
                const submitted = a.submissions.some(sub => sub.studentId === studentId);
                return `<div class="p-3 bg-slate-50 rounded-xl">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-sm">${a.title}</span>
                    ${submitted ? '<span class="badge badge-success">Submitted</span>' : '<span class="badge badge-warn">Pending</span>'}
                  </div>
                  <div class="text-xs text-slate-600 mb-1">${sub ? sub.name : ''} · Due ${fdate(a.dueDate, { short: true })}</div>
                  <div class="text-sm text-slate-700">${a.description}</div>
                </div>`;
              }).join('') : emptyState({ title: 'No homework right now', icon: 'book' })}
            </div>
          ` : `
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Admission No.</div><code class="text-sm">${s.admissionNo}</code></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Date of Birth</div><div>${fdate(s.dob, { long: true })}</div></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Class</div><div>${cls ? cls.name : '—'}</div></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Class Teacher</div><div>${(() => { const t = DB.find('teachers', cls.teacherId); return t ? t.name : '—'; })()}</div></div>
              </div>
              ${inv ? `<div class="p-4 bg-amber-50 rounded-xl">
                <div class="text-xs font-semibold text-amber-700 uppercase mb-1">Fees Status</div>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-bold text-amber-900">${money(inv.balance)} <span class="text-sm font-normal">outstanding</span></div>
                    <div class="text-xs text-amber-700">Paid ${money(inv.paid)} of ${money(inv.total)}</div>
                  </div>
                  ${inv.balance > 0 ? `<button class="btn btn-primary" onclick="payNowFromChild('${studentId}')">Pay Now</button>` : ''}
                </div>
              </div>` : ''}
            </div>
          `
        }
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.params.childTab = null">Close</button>`
  });
}

function payNowFromChild(studentId) {
  document.getElementById('modalBackdrop').click();
  APP.go('par_fees');
  setTimeout(() => payInvoiceModal(COMPUTE.studentInvoice(studentId).id), 200);
}

function printTranscript(studentId) {
  const s = DB.find('students', studentId);
  const subjects = DB.get('subjects');
  const results = COMPUTE.studentResults(studentId).filter(r => r.approved);
  // Group results by term (single term in demo seed, but stub for multi-year capability)
  const byTerm = {};
  results.forEach(r => {
    const key = r.term || DB.settings().currentTerm;
    if (!byTerm[key]) byTerm[key] = [];
    byTerm[key].push(r);
  });
  const termOrder = Object.keys(byTerm).sort();

  const overallAvg = (() => {
    let sum = 0, count = 0;
    termOrder.forEach(t => byTerm[t].forEach(r => { sum += r.total; count++; }));
    return count ? Math.round(sum / count) : 0;
  })();

  const html = `
    <div style="max-width:820px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;color:#047857">${((DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School').toUpperCase()}</h1>
        <p style="margin:4px 0;color:#666">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:12px 0 0;font-size:22px">OFFICIAL ACADEMIC TRANSCRIPT</h2>
      </div>
      <table style="width:100%;margin-bottom:20px">
        <tr><td><strong>Student:</strong> ${s.name}<br/><strong>Admission No:</strong> ${s.admissionNo}</td>
            <td style="text-align:right"><strong>DOB:</strong> ${fdate(s.dob, { long: true })}<br/><strong>Gender:</strong> ${s.gender === 'M' ? 'Male' : 'Female'}</td></tr>
      </table>
      ${termOrder.length === 0
        ? `<p style="margin:24px 0;text-align:center;color:#6b7280;font-style:italic">Historical results for previous terms will appear here once published.</p>`
        : termOrder.map(term => {
            const rows = byTerm[term];
            const termAvg = Math.round(rows.reduce((s, r) => s + r.total, 0) / rows.length);
            return `<h3 style="margin:24px 0 8px;color:#047857;border-bottom:1px solid #ddd;padding-bottom:4px">${term}</h3>
        <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px">
          <thead style="background:#f3f4f6">
            <tr><th align="left">Subject</th><th>CA1</th><th>CA2</th><th>Exam</th><th>Total</th><th>Grade</th></tr>
          </thead>
          <tbody>
            ${rows.map(r => {
              const sub = subjects.find(x => x.id === r.subjectId);
              return `<tr><td>${sub ? sub.name : '—'}</td><td align="center">${r.ca1}</td><td align="center">${r.ca2}</td><td align="center">${r.exam}</td><td align="center"><strong>${r.total}</strong></td><td align="center"><strong>${r.grade}</strong></td></tr>`;
            }).join('')}
          </tbody>
          <tfoot><tr style="background:#f3f4f6;font-weight:bold"><td colspan="4">Term Average</td><td colspan="2" align="center">${termAvg}%</td></tr></tfoot>
        </table>`;
          }).join('')
      }
      <div style="margin-top:24px;background:#d1fae5;padding:14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:16px">CUMULATIVE AVERAGE</strong>
        <strong style="font-size:20px;color:#047857">${overallAvg}%</strong>
      </div>
      <div style="margin-top:60px;display:flex;justify-content:space-between">
        <div><strong>Principal</strong><br/><br/>____________________<br/><span style="font-size:11px;color:#666">Signature &amp; Stamp</span></div>
        <div style="text-align:right">${fdate(now(), { long: true })}<br/><span style="font-size:11px;color:#666">Date Issued</span></div>
      </div>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">This transcript is an official record. Verification: caspaa.com/verify/${s.admissionNo}</p>
    </div>
  `;
  printElement(html);
}

function printReportCard(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  const results = COMPUTE.studentResults(studentId).filter(r => r.approved);
  const subjects = DB.get('subjects');
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const avg = results.length ? Math.round(total / results.length) : 0;
  const attRate = COMPUTE.attendanceRate(studentId);
  const reportComment = DB.query('reportComments', c => c.studentId === studentId && c.term === DB.settings().currentTerm)[0];
  const html = `
    <div style="max-width:780px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;color:#047857">${((DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School').toUpperCase()}</h1>
        <p style="margin:4px 0;color:#666">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:12px 0 0;font-size:20px">STUDENT REPORT CARD</h2>
        <p style="margin:4px 0">${DB.settings().currentTerm}</p>
      </div>
      <table style="width:100%;margin-bottom:20px"><tr>
        <td><strong>Student:</strong> ${s.name}<br/><strong>Class:</strong> ${cls.name}<br/><strong>Admission No:</strong> ${s.admissionNo}</td>
        <td style="text-align:right"><strong>DOB:</strong> ${fdate(s.dob, { long: true })}<br/><strong>Gender:</strong> ${s.gender==='M'?'Male':'Female'}<br/><strong>Attendance:</strong> ${attRate}%</td>
      </tr></table>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-size:13px">
        <thead style="background:#f3f4f6">
          <tr><th align="left">Subject</th><th>CA1/20</th><th>CA2/20</th><th>Exam/60</th><th>Total</th><th>Grade</th><th>Remark</th></tr>
        </thead>
        <tbody>
          ${results.map(r => {
            const sub = subjects.find(x => x.id === r.subjectId);
            const { remark } = COMPUTE.gradeFromScore(r.total);
            return `<tr><td>${sub ? sub.name : '—'}</td><td align="center">${r.ca1}</td><td align="center">${r.ca2}</td><td align="center">${r.exam}</td><td align="center"><strong>${r.total}</strong></td><td align="center"><strong>${r.grade}</strong></td><td>${remark}</td></tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f3f4f6;font-weight:bold"><td colspan="4">Average</td><td colspan="3">${avg}%</td></tr>
        </tfoot>
      </table>
      ${reportComment ? `
          <div style="margin-top:20px;padding:12px;background:#f0fdf4;border-left:4px solid #047857;border-radius:4px">
            <strong style="font-size:12px;color:#065f46">CLASS TEACHER'S COMMENT</strong>
            <p style="margin:6px 0 0;font-size:13px;color:#1e293b">${reportComment.comment}</p>
          </div>` : ''}
      <div style="margin-top:28px;display:flex;justify-content:space-between">
        ${(() => {
          const ct = reportComment?.classTeacher || 'Class Teacher';
          const ht = reportComment?.headTeacher || 'Head Teacher';
          return `<div><strong>Class Teacher:</strong> ${ct}<br/><br/>____________________</div>
                  <div style="text-align:right"><strong>Head Teacher:</strong> ${ht}<br/><br/>____________________</div>`;
        })()}
      </div>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Generated by CASPAA · ${fdate(today(), { long: true })}</p>
    </div>
  `;
  printElement(html);
}

/* ---------- My Children ---------- */
function view_par_children() {
  const children = parentChildren();
  return `
    ${pageHeader({ title: 'My Children', subtitle: `${children.length} ${children.length===1?'child':'children'} at ${(DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School'}` })}
    <div class="grid sm:grid-cols-2 gap-4">
      ${children.map(c => renderChildCard(c)).join('')}
    </div>
  `;
}

/* ---------- Fees & Payment ---------- */
function view_par_fees() {
  const children = parentChildren();

  // Prospective parent: no enrolled children yet — show application status gate
  if (children.length === 0) {
    const me = DB.find('parents', AUTH.current.id);
    const myApp = me ? DB.query('admissionApplications', a =>
      a.schoolId === (me.schoolId || AUTH.current.schoolId || 'sch_brightlights') &&
      a.parentPhone === me.phone &&
      a.status !== 'rejected' && a.status !== 'accepted'
    )[0] : null;
    if (myApp) return renderProspectFeeGate(myApp);
  }

  const invoices = children.map(c => COMPUTE.studentInvoice(c.id)).filter(Boolean);
  const totalDue = invoices.reduce((s, i) => s + i.balance, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);

  return `
    ${pageHeader({ title: 'Fees & Payment', subtitle: DB.settings().currentTerm })}

    <div class="card bg-gradient-to-br from-brand-700 to-brand-800 text-white p-5 mb-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-brand-200 text-xs uppercase">Total Outstanding</div>
          <div class="text-3xl font-extrabold">${money(totalDue)}</div>
        </div>
        <div class="text-right">
          <div class="text-brand-200 text-xs uppercase">Paid So Far</div>
          <div class="text-3xl font-extrabold text-emerald-200">${money(totalPaid)}</div>
        </div>
      </div>
      ${totalDue > 0 ? `<button class="btn btn-primary w-full mt-4 !py-3 text-base" onclick="payAllModal()">${icon('fees','w-5 h-5')} Pay All Fees Now</button>` : ''}
    </div>

    <div class="space-y-3">
      ${invoices.map(inv => {
        const s = DB.find('students', inv.studentId);
        const cls = DB.find('classes', s.classId);
        const pct = inv.total ? Math.round((inv.paid / inv.total) * 100) : 0;
        return `<div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            ${avatar(s.name, 'md')}
            <div class="flex-1">
              <div class="font-bold text-slate-900">${s.name}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${inv.term}</div>
            </div>
            ${statusBadge(inv.status)}
          </div>

          <div class="space-y-1 mb-3">
            ${(() => {
              const standard = inv.lineItems.filter(l => l.amount > 0 && !l.name.includes('🏊') && !l.name.includes('🩰') && !l.name.includes('🎹') && !l.name.includes('⚽') && !l.name.includes('♟') && !l.name.includes('🎤') && !l.name.includes('🏃'));
              const activities = inv.lineItems.filter(l => l.amount > 0 && !standard.includes(l));
              const discounts = inv.lineItems.filter(l => l.amount < 0);
              return `
                ${standard.map(l => `<div class="flex justify-between text-sm"><span class="text-slate-600">${l.name}</span><span class="font-mono">${money(l.amount)}</span></div>`).join('')}
                ${activities.length ? `<div class="mt-1.5 pt-1.5 border-t border-dashed border-slate-200">
                  <div class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Extracurricular</div>
                  ${activities.map(l => `<div class="flex justify-between text-sm"><span class="text-slate-600">${l.name}</span><span class="font-mono">${money(l.amount)}</span></div>`).join('')}
                </div>` : ''}
                ${discounts.map(l => `<div class="flex justify-between text-sm text-emerald-700"><span>🎓 ${l.name}</span><span class="font-mono">-${money(Math.abs(l.amount))}</span></div>`).join('')}
                <div class="flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5 mt-1"><span>Total</span><span class="font-mono">${money(inv.total)}</span></div>
              `;
            })()}
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Paid ${money(inv.paid)} of ${money(inv.total)}</span>
              <span class="font-semibold">${pct}%</span>
            </div>
            <div class="progress"><div class="progress-bar" style="width: ${pct}%"></div></div>
          </div>

          <div class="grid grid-cols-2 gap-2 mt-3">
            <button class="btn btn-secondary" onclick="viewInvoice('${inv.id}')">View Invoice</button>
            ${inv.balance > 0 ? `<button class="btn btn-primary" onclick="payInvoiceModal('${inv.id}')">Pay ${money(inv.balance)}</button>` : `<button class="btn btn-secondary" onclick="downloadReceipt('${inv.id}')">${icon('download','w-4 h-4')} Receipt</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderProspectFeeGate(app) {
  const cls = DB.find('classes', app.requestedClass);
  const fs = cls ? DB.query('feeStructures', f => f.classId === cls.id)[0] : null;
  const school = DB.find('schools', AUTH.current.schoolId || 'sch_brightlights');

  const statusOrder = ['pending', 'reviewing', 'visit_scheduled', 'visit_confirmed', 'accepted'];
  const currentIdx = statusOrder.indexOf(app.status);
  const steps = [
    { label: 'Application Received' },
    { label: 'Under Review' },
    { label: 'Visit Scheduled' },
    { label: 'Fees Unlocked' },
    { label: 'Enrolled' }
  ];

  return `
    ${pageHeader({ title: 'Fees & Enrolment', subtitle: 'Track your application progress' })}

    <div class="card p-5 mb-4">
      <div class="text-sm font-semibold text-slate-700 mb-4">Application Progress — <span class="text-brand-700">${app.applicantName}</span></div>
      <div class="relative flex items-start justify-between">
        <div class="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
        ${steps.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return `<div class="flex flex-col items-center gap-1.5 text-center flex-1 relative z-10">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'} ${active ? 'ring-2 ring-brand-300 ring-offset-1' : ''}">
              ${done ? icon('check','w-4 h-4') : (i + 1)}
            </div>
            <div class="text-xs leading-tight max-w-[4.5rem] ${done ? 'text-brand-700 font-semibold' : 'text-slate-400'}">${step.label}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${app.status === 'visit_scheduled' ? `
    <div class="card p-4 mb-4 border border-brand-200 bg-brand-50">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 flex-shrink-0">${icon('calendar','w-5 h-5')}</div>
        <div class="flex-1">
          <div class="font-semibold text-brand-900">School Visit Scheduled</div>
          <div class="text-sm text-brand-700 mt-0.5">${fdate(app.visitDate, { long: true })}${app.visitTime ? ' at ' + app.visitTime : ''}</div>
          ${app.visitNotes ? `<div class="text-xs text-brand-600 mt-1 bg-white/60 rounded-lg p-2">${app.visitNotes}</div>` : ''}
        </div>
      </div>
      <div class="mt-3 text-xs text-brand-800 bg-white/60 rounded-lg p-2.5">
        Please bring <strong>${app.applicantName}</strong> to ${school ? school.name : 'the school'} on the scheduled date.
        Fee information will be revealed here once your visit has been confirmed by the admissions team.
      </div>
    </div>` : ''}

    ${app.status === 'visit_confirmed' ? `
    <div class="card p-4 mb-4 border border-emerald-200 bg-emerald-50">
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">${icon('check','w-5 h-5')}</span>
        <div>
          <div class="font-semibold text-emerald-900">Visit Confirmed — Fee Details Unlocked</div>
          <div class="text-xs text-emerald-700">Thank you for visiting. Here is the fee breakdown for ${cls ? cls.name : 'your child\'s class'}.</div>
        </div>
      </div>
    </div>

    ${fs ? `
    <div class="card p-4 mb-4">
      <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        ${avatar(app.applicantName, 'md')}
        <div>
          <div class="font-bold text-slate-900">${app.applicantName}</div>
          <div class="text-sm text-slate-500">${cls ? cls.name : '—'} · ${DB.settings().currentTerm || 'Upcoming Term'}</div>
        </div>
        <span class="ml-auto badge badge-info">Preview</span>
      </div>
      <div class="space-y-2 mb-4">
        ${[{ name: 'Tuition Fee', amount: fs.tuition }, { name: 'Books & Materials', amount: fs.books }, { name: 'Uniform', amount: fs.uniform }, { name: 'PTA Levy', amount: fs.pta }]
          .filter(l => l.amount > 0)
          .map(l => `<div class="flex justify-between text-sm"><span class="text-slate-600">${l.name}</span><span class="font-mono font-semibold">${money(l.amount)}</span></div>`).join('')}
        <div class="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1">
          <span>Total</span>
          <span class="font-mono text-brand-700">${money(fs.tuition + fs.books + fs.uniform + fs.pta)}</span>
        </div>
      </div>
      <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
        ${icon('bell','w-3.5 h-3.5 flex-shrink-0 mt-0.5')}
        <span>These fees will be invoiced once your child is formally enrolled. Contact the admissions office to confirm your place.</span>
      </div>
    </div>` : `
    <div class="card p-4 text-center text-slate-500 text-sm">
      <div class="mb-1 font-semibold">Fee structure not yet published for ${cls ? cls.name : 'this class'}</div>
      <div class="text-xs">The school will update fees shortly. Check back soon or contact the admissions office.</div>
    </div>`}` : ''}

    ${app.status !== 'visit_scheduled' && app.status !== 'visit_confirmed' ? `
    <div class="card p-6 text-center">
      <div class="w-14 h-14 mx-auto mb-3 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">${icon('fees','w-7 h-7')}</div>
      <h3 class="font-bold text-slate-800 mb-1">Fees Available After School Visit</h3>
      <p class="text-sm text-slate-500 max-w-xs mx-auto">Our admissions team will contact you to schedule a visit. Fee details are shared once the visit is complete.</p>
      ${school ? `<p class="text-xs text-slate-400 mt-3">Questions? Call ${school.phone || school.email || 'the school office'}</p>` : ''}
    </div>` : ''}
  `;
}

function viewInvoice(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  const cls = DB.find('classes', s.classId);
  const isFinance = AUTH.current && (AUTH.current.role === 'finance' || AUTH.current.role === 'schooladmin');
  const invFs = s ? DB.query('feeStructures', f => f.classId === s.classId && f.term === inv.term)[0] : null;
  const installmentsAllowed = invFs ? (invFs.installmentEnabled === true) : false;
  modal({
    title: 'Invoice Details',
    body: `
      <div class="print-area">
        <div class="text-center mb-4 pb-3 border-b">
          <h2 class="text-xl font-bold text-brand-700">${((DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School').toUpperCase()}</h2>
          <p class="text-xs text-slate-500">15 Liberty Estate, Lekki, Lagos</p>
        </div>
        <div class="grid grid-cols-2 text-sm mb-4">
          <div>
            <div class="text-xs text-slate-500">BILLED TO</div>
            <div class="font-semibold">${DB.find('parents', s.parentId).name}</div>
            <div class="text-xs">For: ${s.name}</div>
            <div class="text-xs">${cls ? cls.name : ''}</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500">INVOICE NO.</div>
            <code class="text-sm">${inv.id.toUpperCase().slice(-10)}</code>
            <div class="text-xs text-slate-500 mt-2">DUE DATE</div>
            <div class="text-sm">${fdate(inv.dueDate, { long: true })}</div>
          </div>
        </div>
        <table class="w-full text-sm border-t">
          <thead><tr class="border-b"><th class="text-left py-2">Description</th><th class="text-right py-2">Amount</th></tr></thead>
          <tbody>
            ${(() => {
              // Detect activity items by emoji prefix — activities catalog uses emoji icons
              const emojiRe = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}♟]/u;
              const standard = inv.lineItems.filter(l => l.amount > 0 && !emojiRe.test(l.name));
              const activities = inv.lineItems.filter(l => l.amount > 0 && emojiRe.test(l.name));
              const discounts = inv.lineItems.filter(l => l.amount < 0);
              const actTotal = activities.reduce((s, l) => s + l.amount, 0);
              return `
                ${standard.map(l => `<tr class="border-b"><td class="py-2 text-slate-700">${l.name}</td><td class="text-right font-mono py-2">${money(l.amount)}</td></tr>`).join('')}
                ${activities.length ? `
                  <tr><td colspan="2" class="pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Extracurricular Activities</td></tr>
                  ${activities.map(l => `<tr class="border-b border-dashed border-slate-100"><td class="py-2 text-slate-700 pl-2">${l.name}</td><td class="text-right font-mono py-2">${money(l.amount)}</td></tr>`).join('')}
                  <tr class="border-b"><td class="py-1 text-xs text-slate-500 pl-2">Activities subtotal</td><td class="text-right font-mono py-1 text-xs text-slate-500">${money(actTotal)}</td></tr>
                ` : ''}
                ${discounts.map(l => `<tr class="border-b border-emerald-100 bg-emerald-50"><td class="py-2 text-emerald-700">🎓 ${l.name}</td><td class="text-right font-mono py-2 text-emerald-700">-${money(Math.abs(l.amount))}</td></tr>`).join('')}
              `;
            })()}
          </tbody>
          <tfoot>
            <tr><td class="pt-3 font-bold">Total</td><td class="text-right font-bold pt-3 font-mono">${money(inv.total)}</td></tr>
            <tr><td class="text-emerald-700">Paid</td><td class="text-right font-mono text-emerald-700">${money(inv.paid)}</td></tr>
            <tr><td class="font-bold text-rose-700">Balance</td><td class="text-right font-bold text-rose-700 font-mono">${money(inv.balance)}</td></tr>
          </tfoot>
        </table>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary no-print" onclick="window.print()">${icon('download','w-4 h-4')} Print</button>
      ${isFinance ? `<button class="btn btn-secondary no-print" onclick="applyDiscountModal('${invoiceId}')">${icon('plus','w-4 h-4')} Discount</button>` : ''}
      ${(isFinance || AUTH.current.role === 'parent') && inv.balance > 0 && installmentsAllowed ? `<button class="btn btn-secondary no-print" onclick="installmentPlanModal('${invoiceId}')">${icon('calendar','w-4 h-4')} Installment Plan</button>` : ''}
      ${inv.balance > 0 ? `<button class="btn btn-primary no-print" onclick="document.getElementById('modalBackdrop').click(); payInvoiceModal('${invoiceId}')">Pay Now</button>` : ''}
    `
  });
}

function installmentPlanModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  const hasExisting = inv.installmentPlan && inv.installmentPlan.length;
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Installment Plan — ' + s.name,
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Split the outstanding balance of <strong>${money(inv.balance)}</strong> across several scheduled payments. The school keeps track of due dates and sends reminders automatically.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Number of installments</label>
            <select id="ip_count" class="input" onchange="renderInstallmentPreview('${invoiceId}')">
              <option value="2">2 payments</option>
              <option value="3" selected>3 payments</option>
              <option value="4">4 payments</option>
              <option value="6">6 payments</option>
            </select>
          </div>
          <div><label class="input-label">First payment due</label>
            <input id="ip_start" type="date" class="input" value="${daysAhead(7)}" onchange="renderInstallmentPreview('${invoiceId}')" />
          </div>
        </div>
        <div><label class="input-label">Interval</label>
          <select id="ip_interval" class="input" onchange="renderInstallmentPreview('${invoiceId}')">
            <option value="30" selected>Monthly (every 30 days)</option>
            <option value="14">Bi-weekly (every 14 days)</option>
            <option value="60">Bi-monthly (every 60 days)</option>
          </select>
        </div>
        <div id="ip_preview"></div>
        ${hasExisting ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">A plan already exists. Saving will replace it.</div>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveInstallmentPlan('${invoiceId}')">${icon('check','w-4 h-4')} Save Plan</button>`
  }), 50);
  setTimeout(() => renderInstallmentPreview(invoiceId), 100);
}

function renderInstallmentPreview(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const count = parseInt(document.getElementById('ip_count').value) || 3;
  const start = document.getElementById('ip_start').value || today();
  const interval = parseInt(document.getElementById('ip_interval').value) || 30;
  const each = Math.ceil(inv.balance / count);
  const schedule = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + interval * i);
    schedule.push({ due: d.toISOString().slice(0, 10), amount: i === count - 1 ? inv.balance - each * (count - 1) : each });
  }
  document.getElementById('ip_preview').innerHTML = `
    <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Schedule</h4>
    <div class="space-y-1.5">
      ${schedule.map((p, i) => `<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
        <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">${i + 1}</span><span>${fdate(p.due, { long: true })}</span></div>
        <span class="font-mono font-semibold">${money(p.amount)}</span>
      </div>`).join('')}
    </div>
  `;
}

function saveInstallmentPlan(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const count = parseInt(document.getElementById('ip_count').value) || 3;
  const start = document.getElementById('ip_start').value || today();
  const interval = parseInt(document.getElementById('ip_interval').value) || 30;
  const each = Math.ceil(inv.balance / count);
  const schedule = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + interval * i);
    schedule.push({ due: d.toISOString().slice(0, 10), amount: i === count - 1 ? inv.balance - each * (count - 1) : each, paid: false });
  }
  DB.update('invoices', invoiceId, { installmentPlan: schedule });
  const s = DB.find('students', inv.studentId);
  DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Installment Plan Created', body: `Your ${count}-installment plan for ${s.name}'s fees is set. First payment of ${money(schedule[0].amount)} is due ${fdate(schedule[0].due, { long: true })}.`, type: 'info', read: false, timestamp: now() });
  toast(`${count}-installment plan saved · parent notified`);
  document.getElementById('modalBackdrop').click();
  APP.render();
}

function applyDiscountModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const dcStudent = DB.find('students', inv.studentId);
  const dcFs = dcStudent ? DB.query('feeStructures', f => f.classId === dcStudent.classId && f.term === inv.term)[0] : null;
  const dcDeadline = dcFs ? dcFs.discountDeadline : null;
  const promptExpired = dcDeadline && today() > dcDeadline;
  modal({
    title: 'Apply Discount / Scholarship',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          The discount appears as a negative line item on the invoice. The student's balance reduces immediately.
        </div>
        ${promptExpired ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          ${icon('bell','w-4 h-4 inline')} The <strong>Prompt Payment Discount</strong> deadline was ${fdate(dcDeadline, { long: true })} — this discount type is no longer available.
        </div>` : dcDeadline ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          ${icon('check','w-4 h-4 inline')} Prompt Payment Discount available until <strong>${fdate(dcDeadline, { long: true })}</strong>.
        </div>` : ''}
        <div>
          <label class="input-label">Type</label>
          <select id="dc_type" class="input" onchange="onDiscountTypeChange()">
            <option value="sibling">Sibling Discount (10% of tuition)</option>
            <option value="scholarship">Scholarship — Full Tuition Waiver</option>
            <option value="partial">Partial Scholarship — % off tuition</option>
            <option value="prompt" ${promptExpired ? 'disabled' : ''}>Prompt Payment Discount (5%)${promptExpired ? ' — Expired' : ''}</option>
            <option value="custom">Custom amount</option>
          </select>
        </div>
        <div id="dc_pctRow" class="hidden">
          <label class="input-label">% off tuition</label>
          <input id="dc_pct" type="number" class="input" value="25" min="1" max="100" />
        </div>
        <div id="dc_customRow" class="hidden">
          <label class="input-label">Discount Amount (NGN)</label>
          <input id="dc_custom" type="number" class="input" placeholder="e.g. 25000" />
        </div>
        <div>
          <label class="input-label">Label on invoice</label>
          <input id="dc_label" class="input" value="Sibling Discount" />
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveDiscount('${invoiceId}')">Apply</button>`
  });
  // Update label as type changes
  document.getElementById('dc_type').addEventListener('change', e => {
    const map = { sibling: 'Sibling Discount', scholarship: 'Scholarship - Tuition Waiver', partial: 'Partial Scholarship', prompt: 'Prompt Payment Discount', custom: 'Discount' };
    document.getElementById('dc_label').value = map[e.target.value];
  });
}

function onDiscountTypeChange() {
  const t = document.getElementById('dc_type').value;
  document.getElementById('dc_pctRow').classList.toggle('hidden', t !== 'partial');
  document.getElementById('dc_customRow').classList.toggle('hidden', t !== 'custom');
}

function saveDiscount(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const type = document.getElementById('dc_type').value;
  // Block expired prompt payment discounts
  if (type === 'prompt') {
    const dcStu = DB.find('students', inv.studentId);
    const dcFs2 = dcStu ? DB.query('feeStructures', f => f.classId === dcStu.classId && f.term === inv.term)[0] : null;
    if (dcFs2 && dcFs2.discountDeadline && today() > dcFs2.discountDeadline) {
      toast('Prompt Payment Discount deadline has passed — cannot apply', 'error'); return;
    }
  }
  const label = document.getElementById('dc_label').value.trim() || 'Discount';
  const tuitionLine = inv.lineItems.find(l => l.name.toLowerCase().includes('tuition'));
  const tuitionAmt = tuitionLine ? tuitionLine.amount : 0;
  let amount = 0;
  if (type === 'sibling') amount = Math.round(tuitionAmt * 0.1);
  else if (type === 'scholarship') amount = tuitionAmt;
  else if (type === 'partial') {
    const pct = parseInt(document.getElementById('dc_pct').value) || 0;
    amount = Math.round(tuitionAmt * pct / 100);
  } else if (type === 'prompt') amount = Math.round(tuitionAmt * 0.05);
  else amount = parseInt(document.getElementById('dc_custom').value) || 0;

  if (amount <= 0) { toast('Discount amount must be positive', 'danger'); return; }
  if (amount > inv.balance) { toast(`Discount (${money(amount)}) exceeds balance (${money(inv.balance)})`, 'danger'); return; }

  const lineItems = inv.lineItems.concat([{ name: label, amount: -amount, type: 'discount' }]);
  const total = lineItems.reduce((s, l) => s + l.amount, 0);
  const balance = Math.max(0, total - inv.paid);
  const status = balance === 0 ? 'paid' : (inv.paid > 0 ? 'partial' : 'outstanding');
  DB.update('invoices', invoiceId, { lineItems, total, balance, status });
  const s = DB.find('students', inv.studentId);
  DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Discount Applied', body: `${label} of ${money(amount)} applied to ${s.name}'s fees.`, type: 'success', read: false, timestamp: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: inv.schoolId, actor: AUTH.current.id, action: 'applied_discount', target: `${money(amount)} (${label}) for ${s.name}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${label} of ${money(amount)} applied`, 'success');
}

/* ---------- Paystack-style Payment Flow ---------- */
function payInvoiceModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  modal({
    title: 'Pay School Fees',
    body: `
      <div class="text-center mb-4">
        ${avatar(s.name, 'lg')}
        <div class="mt-3 font-bold text-slate-900">${s.name}</div>
        <div class="text-xs text-slate-500">Outstanding balance</div>
        <div class="text-3xl font-extrabold text-brand-700 mt-1">${money(inv.balance)}</div>
      </div>

      <div class="bg-slate-50 rounded-xl p-3 mb-4">
        <label class="input-label">Pay Amount</label>
        <input id="pay_amount" type="number" class="input text-xl font-bold" value="${inv.balance}" max="${inv.balance}" min="1" />
        <div class="flex gap-2 mt-2">
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${Math.round(inv.balance / 3)}">⅓</button>
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${Math.round(inv.balance / 2)}">½</button>
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${inv.balance}">Full</button>
        </div>
      </div>

      <div>
        <label class="input-label">Payment Method</label>
        <div class="space-y-2">
          <label class="flex items-center gap-3 p-3 border-2 border-brand-500 rounded-xl cursor-pointer bg-brand-50">
            <input type="radio" name="payMethod" value="card" checked class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">Debit / Credit Card</div>
              <div class="text-xs text-slate-500">Verve, Mastercard, Visa</div>
            </div>
            <div class="text-xs text-slate-400">Instant</div>
          </label>
          <label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
            <input type="radio" name="payMethod" value="transfer" class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">Bank Transfer</div>
              <div class="text-xs text-slate-500">Pay to a dedicated account</div>
            </div>
            <div class="text-xs text-slate-400">Instant</div>
          </label>
          <label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
            <input type="radio" name="payMethod" value="ussd" class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">USSD</div>
              <div class="text-xs text-slate-500">Dial code on your phone</div>
            </div>
            <div class="text-xs text-slate-400">No internet</div>
          </label>
        </div>
      </div>

      <p class="text-xs text-slate-400 text-center mt-3">Secured payment · Your card details are never stored.</p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" id="proceedPay" onclick="processPayment('${invoiceId}')">${icon('check','w-4 h-4')} Proceed to Pay</button>
    `
  });
}

function processPayment(invoiceId) {
  const amount = parseInt(document.getElementById('pay_amount').value);
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const inv = DB.find('invoices', invoiceId);
  if (!amount || amount <= 0 || amount > inv.balance) { toast('Enter a valid amount', 'danger'); return; }

  document.getElementById('proceedPay').innerHTML = '<div class="spinner"></div> Processing…';
  document.getElementById('proceedPay').disabled = true;

  // Simulate Paystack iframe / USSD instruction
  if (method === 'ussd') {
    setTimeout(() => {
      document.getElementById('modalBackdrop').click();
      modal({
        title: 'Dial This USSD Code',
        body: `
          <div class="text-center py-4">
            <div class="text-xs text-slate-500 mb-2">On your phone, dial:</div>
            <div class="text-4xl font-extrabold text-brand-700 font-mono">*737*50*${amount}#</div>
            <p class="text-sm text-slate-500 mt-4">Follow the prompts on your phone to complete payment. The system will detect and confirm automatically.</p>
            <button class="btn btn-primary mt-4" onclick="completePayment('${invoiceId}', ${amount}, 'ussd')">I've completed the USSD</button>
          </div>
        `
      });
    }, 800);
    return;
  }

  // Card/Transfer flow — always succeeds in demo mode
  setTimeout(() => {
    completePayment(invoiceId, amount, method);
  }, 1500);
}

function failPayment(invoiceId, amount, method) {
  // Log the failed transaction for the finance officer's ledger
  const reasons = [
    { code: 'INSUFFICIENT_FUNDS', message: 'Your card does not have enough funds to complete this transaction.' },
    { code: 'BANK_DECLINED', message: 'Your bank declined the transaction. Please try a different card or method.' },
    { code: 'NETWORK_TIMEOUT', message: 'Network timeout. Your account was not charged.' }
  ];
  const r = reasons[Math.floor(Math.random() * reasons.length)];
  DB.insert('transactions', {
    id: uid('txn'),
    schoolId: AUTH.current.schoolId || 'sch_brightlights',
    invoiceId, studentId: DB.find('invoices', invoiceId).studentId,
    amount, method,
    reference: 'CSP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: 'failed',
    gateway: 'Paystack',
    failureReason: r.code,
    timestamp: now(),
    reconciled: false
  });
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  modal({
    title: 'Payment Failed',
    body: `
      <div class="text-center py-5">
        <div class="w-20 h-20 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">${icon('x','w-12 h-12')}</div>
        <h2 class="text-lg font-bold text-slate-900">${money(amount)} could not be charged</h2>
        <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 mt-4 text-sm text-rose-900 text-left">
          <div class="font-semibold mb-1">${r.code.replace(/_/g, ' ')}</div>
          <div>${r.message}</div>
        </div>
        <p class="text-xs text-slate-500 mt-3">No money has left your account. You can try again with the same or a different payment method.</p>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); payInvoiceModal('${invoiceId}')">${icon('check','w-4 h-4')} Try again</button>
    `
  });
  toast('Payment failed — please try again', 'danger');
}

function completePayment(invoiceId, amount, method) {
  const inv = DB.find('invoices', invoiceId);
  const newPaid = inv.paid + amount;
  const newBalance = inv.total - newPaid;
  let newStatus = 'outstanding';
  if (newBalance <= 0) newStatus = 'paid';
  else if (newPaid > 0) newStatus = 'partial';

  const txn = {
    id: uid('txn'),
    schoolId: inv.schoolId,
    invoiceId: inv.id,
    studentId: inv.studentId,
    amount, method,
    reference: 'CSP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: 'successful',
    gateway: 'Paystack',
    timestamp: now(),
    reconciled: true
  };
  DB.insert('transactions', txn);
  DB.update('invoices', invoiceId, { paid: newPaid, balance: newBalance, status: newStatus });
  // Notify parent
  DB.insert('notifications', { id: uid('not'), userId: AUTH.current.id, title: 'Payment Received', body: `Your payment of ${money(amount)} was successful.`, type: 'success', read: false, timestamp: now(), link: { view: 'par_fees' } });
  DB.insert('auditLog', { id: uid('aud'), schoolId: inv.schoolId, actor: AUTH.current.id, action: 'payment', target: `${money(amount)} for ${DB.find('students', inv.studentId).name}`, timestamp: now() });

  document.getElementById('modalBackdrop').click();
  const hasMore = _payQueue.length > 0;
  const nextChild = hasMore ? DB.find('students', DB.find('invoices', _payQueue[0]).studentId) : null;
  modal({
    title: 'Payment Successful!',
    body: `
      <div class="text-center py-6">
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">${icon('check','w-12 h-12')}</div>
        <h2 class="text-2xl font-bold text-slate-900">${money(amount)}</h2>
        <p class="text-slate-500 mt-1">paid successfully</p>
        <div class="bg-slate-50 rounded-xl p-3 mt-5 text-left text-sm">
          <div class="flex justify-between py-1"><span class="text-slate-500">Reference</span><code class="text-xs">${txn.reference}</code></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Method</span><span class="font-semibold capitalize">${method}</span></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Date</span><span>${fdate(txn.timestamp, { time: true })}</span></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Status</span>${statusBadge('successful')}</div>
        </div>
        ${hasMore ? `<div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Next up: <strong>${nextChild.name}</strong> · ${_payQueue.length} more invoice${_payQueue.length>1?'s':''} to pay
        </div>` : ''}
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="downloadReceipt('${invoiceId}')">${icon('download','w-4 h-4')} Receipt</button>
      ${hasMore
        ? `<button class="btn btn-secondary" onclick="_payQueue=[]; document.getElementById('modalBackdrop').click(); APP.render()">Stop here</button>
           <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); payAllContinue()">Pay for ${nextChild.name.split(' ')[0]} →</button>`
        : `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.render()">Done</button>`
      }
    `
  });
  toast(`Payment of ${money(amount)} successful`, 'success');
}

function downloadReceipt(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const txns = DB.query('transactions', t => t.invoiceId === invoiceId);
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">${((DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School').toUpperCase()}</h1>
        <p style="margin:4px 0;color:#666;font-size:13px">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:14px 0 4px;font-size:18px">OFFICIAL PAYMENT RECEIPT</h2>
      </div>
      <table style="width:100%;font-size:14px">
        <tr><td><strong>Received From:</strong></td><td align="right">${parent.name}</td></tr>
        <tr><td><strong>For Student:</strong></td><td align="right">${s.name} (${cls.name})</td></tr>
        <tr><td><strong>Term:</strong></td><td align="right">${inv.term}</td></tr>
        <tr><td><strong>Issued:</strong></td><td align="right">${fdate(now(), { long: true })}</td></tr>
      </table>
      <hr style="margin:20px 0;border:none;border-top:1px solid #ddd"/>
      <h3 style="margin-bottom:8px">Payment History</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead style="background:#f3f4f6"><tr><th align="left" style="padding:8px">Date</th><th align="left">Method</th><th align="left">Reference</th><th align="right" style="padding:8px">Amount</th></tr></thead>
        <tbody>
          ${txns.map(t => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${fdate(t.timestamp, { short: true })}</td><td>${t.method.toUpperCase()}</td><td><code style="font-size:11px">${t.reference}</code></td><td align="right" style="padding:8px"><strong>${money(t.amount)}</strong></td></tr>`).join('')}
        </tbody>
        <tfoot style="font-weight:bold;background:#d1fae5">
          <tr><td colspan="3" style="padding:10px">Total Paid</td><td align="right" style="padding:10px">${money(inv.paid)}</td></tr>
          <tr><td colspan="3" style="padding:10px">Balance</td><td align="right" style="padding:10px;color:${inv.balance > 0 ? '#dc2626' : '#059669'}">${money(inv.balance)}</td></tr>
        </tfoot>
      </table>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">This is a computer-generated receipt and does not require a signature.<br/>Powered by CASPAA School Operating System</p>
    </div>
  `;
  printElement(html);
}

// Queue of remaining invoice IDs in a multi-pay session
let _payQueue = [];

function payAllModal() {
  const children = parentChildren();
  const invoices = children.map(c => COMPUTE.studentInvoice(c.id)).filter(i => i && i.balance > 0);
  if (invoices.length === 0) { toast('No outstanding fees', 'info'); return; }
  if (invoices.length === 1) { payInvoiceModal(invoices[0].id); return; }
  const total = invoices.reduce((s, i) => s + i.balance, 0);
  modal({
    title: 'Pay All Fees',
    body: `
      <p class="text-sm text-slate-600 mb-3">You'll pay for ${invoices.length} children. We'll walk you through each invoice so you can use a different payment method for each if you want.</p>
      <div class="space-y-2 mb-4">
        ${invoices.map((i, idx) => {
          const s = DB.find('students', i.studentId);
          return `<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">${idx + 1}</div>
            ${avatar(s, 'sm')}
            <span class="flex-1 font-semibold">${s.name}</span>
            <span class="font-mono font-semibold">${money(i.balance)}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="border-t pt-3 flex justify-between font-bold text-lg">
        <span>Total</span><span class="text-brand-700">${money(total)}</span>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="payAllExecute(${JSON.stringify(invoices.map(i=>i.id)).replace(/"/g,'&quot;')})">${icon('check','w-4 h-4')} Start — ${money(total)}</button>
    `
  });
}

function payAllExecute(invoiceIds) {
  document.getElementById('modalBackdrop').click();
  _payQueue = invoiceIds.slice(1);
  setTimeout(() => payInvoiceModal(invoiceIds[0]), 200);
}

function payAllContinue() {
  if (_payQueue.length === 0) return false;
  const next = _payQueue.shift();
  setTimeout(() => payInvoiceModal(next), 200);
  return true;
}

/* ---------- Loans ---------- */
function view_par_loans() {
  const parentId = AUTH.current.id;
  const loans = COMPUTE.parentLoans(parentId);
  const creditScore = COMPUTE.computeCreditScore(parentId);
  const eligibleAmount = Math.round(creditScore * 1000); // simple mock
  const scoreClass = creditScore >= 700
    ? { grad: 'from-emerald-500 to-emerald-700', text: 'text-emerald-100', btn: 'text-emerald-700', label: 'Excellent' }
    : creditScore >= 600
    ? { grad: 'from-amber-500 to-amber-700', text: 'text-amber-100', btn: 'text-amber-700', label: 'Good' }
    : { grad: 'from-rose-500 to-rose-700', text: 'text-rose-100', btn: 'text-rose-700', label: 'Fair' };

  return `
    ${pageHeader({ title: 'School Fee Loans', subtitle: 'Spread fee payments. Get a decision in minutes.' })}

    <div class="card p-5 mb-4 bg-gradient-to-br ${scoreClass.grad} text-white">
      <div class="flex items-center justify-between">
        <div>
          <div class="${scoreClass.text} text-xs uppercase font-semibold">Your CASPAA Credit Score</div>
          <div class="text-5xl font-extrabold">${creditScore}</div>
          <div class="${scoreClass.text} text-sm mt-1">${scoreClass.label} · Eligible up to ${money(eligibleAmount)}</div>
        </div>
        <div class="text-right">
          <button class="bg-white ${scoreClass.btn} px-4 py-2 rounded-xl font-bold" onclick="applyLoanModal()">Apply for Loan</button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mt-4 text-sm">
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">Payment History</div>
          <div class="font-bold">Strong</div>
        </div>
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">School Tenure</div>
          <div class="font-bold">2+ years</div>
        </div>
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">Income Tier</div>
          <div class="font-bold">Verified</div>
        </div>
      </div>
    </div>

    ${loans.length === 0 ? emptyState({
      title: 'No loans yet',
      body: 'Apply for school fee financing to spread your child\'s school fees across the term.',
      icon: 'loan',
      action: `<button class="btn btn-primary" onclick="applyLoanModal()">${icon('plus','w-4 h-4')} Apply Now</button>`
    }) : `
      <h3 class="font-bold text-slate-900 mb-3">My Loans</h3>
      <div class="space-y-3">
        ${loans.map(l => renderLoanCard(l)).join('')}
      </div>
    `}
  `;
}

function renderLoanCard(loan) {
  if (loan.status === 'pending') {
    return `<div class="card p-4 border-l-4 border-amber-500">
      <div class="flex items-center justify-between mb-2">
        <div>
          <span class="badge badge-warn">Under Review</span>
          <h4 class="font-bold text-slate-900 mt-1">Loan Application</h4>
          <p class="text-xs text-slate-500">Applied ${fdate(loan.appliedAt, { relative: true })}</p>
        </div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        Our risk engine is reviewing your application. Decision usually within 24 hours.
      </div>
    </div>`;
  }
  if (loan.status === 'rejected') {
    return `<div class="card p-4 border-l-4 border-rose-500">
      <div class="flex items-center justify-between mb-2">
        <div>
          <span class="badge badge-danger">Declined</span>
          <h4 class="font-bold text-slate-900 mt-1">Loan Application</h4>
          <p class="text-xs text-slate-500">Decision ${fdate(loan.decidedAt || loan.appliedAt, { relative: true })}</p>
        </div>
      </div>
      ${loan.rejectionReason ? `<div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
        <strong>Reason:</strong> ${loan.rejectionReason}${loan.rejectionNote ? `<br/><span class="text-xs">${loan.rejectionNote}</span>` : ''}
      </div>` : ''}
    </div>`;
  }
  const paidCount = loan.repayments.filter(r => r.paid).length;
  const totalCount = loan.repayments.length;
  const nextPayment = loan.repayments.find(r => !r.paid);
  return `<div class="card p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        ${statusBadge(loan.status)}
        <h4 class="font-bold text-lg text-slate-900 mt-1">${money(loan.amount)} loan</h4>
        <p class="text-xs text-slate-500">${loan.term}-month term · ${loan.interestRate}% interest</p>
      </div>
      <div class="text-right">
        <div class="text-xs text-slate-500">Monthly</div>
        <div class="font-bold">${money(loan.monthlyPayment)}</div>
      </div>
    </div>
    <div class="space-y-2 mb-3">
      <div class="flex justify-between text-xs">
        <span class="text-slate-500">Repaid ${paidCount}/${totalCount}</span>
        <span class="font-semibold">${Math.round((paidCount/totalCount)*100)}%</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width: ${(paidCount/totalCount)*100}%"></div></div>
    </div>
    ${nextPayment ? `<div class="bg-slate-50 rounded-xl p-3 text-sm flex items-center justify-between mb-2">
      <div>
        <div class="text-xs text-slate-500">Next payment</div>
        <div class="font-semibold">${money(nextPayment.amount)} · ${fdate(nextPayment.dueDate, { long: true })}</div>
      </div>
      <button class="btn btn-primary !py-1.5" onclick="payLoanInstallment('${loan.id}')">Pay Now</button>
    </div>
    <label class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm cursor-pointer">
      <div>
        <div class="font-semibold text-blue-900">Auto-debit on due date</div>
        <div class="text-xs text-blue-700">We'll charge your saved card automatically when payment is due</div>
      </div>
      <input type="checkbox" class="w-5 h-5 accent-brand-600" ${loan.autoDebit ? 'checked' : ''} onchange="toggleLoanAutoDebit('${loan.id}', this.checked)" />
    </label>
    ` : `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">${icon('check','w-4 h-4 inline')} Loan fully repaid. Thank you!</div>`}
  </div>`;
}

function toggleLoanAutoDebit(loanId, enabled) {
  DB.update('loans', loanId, { autoDebit: enabled });
  toast(enabled ? 'Auto-debit enabled — your next payment will be charged automatically' : 'Auto-debit disabled');
}

function applyLoanModal() {
  const children = parentChildren();
  modal({
    title: 'Apply for School Fee Loan',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>How it works:</strong> Tell us how much you need, choose a repayment term, and we'll give you an instant decision. No paperwork required.
        </div>

        <div>
          <label class="input-label">Which children is this for?</label>
          <div class="space-y-2">
            ${children.map(c => `<label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
              <input type="checkbox" name="loanChild" value="${c.id}" />
              ${avatar(c.name, 'sm')}
              <div class="flex-1">
                <div class="font-semibold text-sm">${c.name}</div>
                <div class="text-xs text-slate-500">${(DB.find('classes', c.classId) || {}).name}</div>
              </div>
              <div class="text-sm font-semibold">${money((COMPUTE.studentInvoice(c.id) || {}).balance || 0)}</div>
            </label>`).join('')}
          </div>
        </div>

        <div>
          <label class="input-label">Loan Amount Needed</label>
          <input id="ln_amount" type="number" class="input text-xl font-bold" placeholder="250000" />
          <input id="ln_slider" type="range" min="50000" max="1000000" step="10000" value="250000" class="w-full mt-2" oninput="document.getElementById('ln_amount').value = this.value; updateLoanCalc()" />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>${money(50000)}</span><span>${money(1000000)}</span>
          </div>
        </div>

        <div>
          <label class="input-label">Repayment Term</label>
          <div class="grid grid-cols-4 gap-2">
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold text-sm" data-term="3" onclick="selectTerm(3)">3 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="6" onclick="selectTerm(6)">6 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="9" onclick="selectTerm(9)">9 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="12" onclick="selectTerm(12)">12 months</button>
          </div>
        </div>

        <div class="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-2xl p-4">
          <div class="text-xs text-brand-200 uppercase font-semibold">Your Monthly Payment</div>
          <div class="text-3xl font-extrabold" id="ln_monthly">${money(43750)}</div>
          <div class="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div><div class="text-brand-200">Total to repay</div><div class="font-bold" id="ln_total">${money(262500)}</div></div>
            <div><div class="text-brand-200">Interest</div><div class="font-bold" id="ln_interest">${money(12500)}</div></div>
            <div><div class="text-brand-200">Rate</div><div class="font-bold">5%</div></div>
          </div>
        </div>

        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" id="ln_consent" />
          <span class="text-slate-600">I authorize CASPAA to auto-debit my registered account on each due date.</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="submitLoanApplication()">${icon('check','w-4 h-4')} Submit Application</button>`
  });
  setTimeout(updateLoanCalc, 50);
}

let _selectedTerm = 3;
function selectTerm(months) {
  _selectedTerm = months;
  document.querySelectorAll('.ln-term').forEach(b => {
    if (parseInt(b.dataset.term) === months) {
      b.className = 'ln-term px-3 py-2 rounded-lg border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold text-sm';
    } else {
      b.className = 'ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm';
    }
  });
  updateLoanCalc();
}

function updateLoanCalc() {
  const amount = parseInt(document.getElementById('ln_amount').value) || 0;
  const term = _selectedTerm;
  const rate = 0.05;
  const interest = Math.round(amount * rate);
  const total = amount + interest;
  const monthly = Math.round(total / term);
  document.getElementById('ln_monthly').textContent = money(monthly);
  document.getElementById('ln_total').textContent = money(total);
  document.getElementById('ln_interest').textContent = money(interest);
}

function submitLoanApplication() {
  const amount = parseInt(document.getElementById('ln_amount').value) || 0;
  const consent = document.getElementById('ln_consent').checked;
  const childrenSel = Array.from(document.querySelectorAll('input[name="loanChild"]:checked')).map(c => c.value);

  if (!consent) { toast('Please consent to auto-debit', 'danger'); return; }
  if (amount < 50000) { toast('Minimum loan amount is ₦50,000', 'danger'); return; }
  if (childrenSel.length === 0) { toast('Select at least one child', 'danger'); return; }

  document.getElementById('modalBackdrop').click();

  // Simulate processing with the Risk Engine
  modal({
    title: 'Reviewing your application…',
    body: `
      <div class="text-center py-6">
        <div class="spinner mx-auto mb-4" style="width:40px;height:40px;border-color:#047857 transparent transparent transparent;border-width:4px"></div>
        <p class="font-semibold text-slate-900">Running risk assessment</p>
        <p class="text-sm text-slate-500 mt-1">This usually takes 10-15 seconds</p>
        <div id="riskSteps" class="text-left mt-4 space-y-2 text-sm"></div>
      </div>
    `
  });

  const steps = [
    'Verifying identity (NIN)…',
    'Checking payment history…',
    'Computing credit score…',
    'Analyzing school relationship…',
    'Final decision…'
  ];
  let i = 0;
  const stepEl = document.getElementById('riskSteps');
  const interval = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(interval);
      finalizeLoanDecision(amount, _selectedTerm, childrenSel);
      return;
    }
    stepEl.innerHTML += `<div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span>${steps[i]}</div>`;
    i++;
  }, 600);
}

function finalizeLoanDecision(amount, term, childrenSel) {
  const score = COMPUTE.computeCreditScore(AUTH.current.id);
  const approved = score >= 580;
  const interest = Math.round(amount * 0.05);
  const total = amount + interest;
  const monthly = Math.round(total / term);

  document.getElementById('modalBackdrop').click();

  if (!approved) {
    modal({
      title: 'Application Decision',
      body: `<div class="text-center py-6">
        <div class="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">${icon('x','w-8 h-8')}</div>
        <h2 class="text-lg font-bold">We can't offer you this loan right now</h2>
        <p class="text-sm text-slate-500 mt-2">Your current credit score is ${score}. We recommend building up your payment history with smaller amounts first.</p>
      </div>`,
      footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">OK</button>`
    });
    return;
  }

  // Create the loan
  const repayments = [];
  for (let m = 1; m <= term; m++) {
    repayments.push({ dueDate: daysAhead(30 * m), amount: monthly, paid: false });
  }
  const loan = {
    id: uid('loan'), schoolId: AUTH.current.schoolId || 'sch_brightlights', parentId: AUTH.current.id,
    studentIds: childrenSel, amount, term, interestRate: 5,
    totalRepayment: total, monthlyPayment: monthly,
    status: 'active', creditScore: score,
    appliedAt: now(), approvedAt: now(),
    repayments
  };
  DB.insert('loans', loan);

  modal({
    title: '🎉 Loan Approved!',
    body: `
      <div class="text-center py-4">
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">${icon('check','w-12 h-12')}</div>
        <h2 class="text-2xl font-bold text-slate-900">${money(amount)}</h2>
        <p class="text-slate-500">approved and disbursed</p>
      </div>
      <div class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">Monthly payment</span><strong>${money(monthly)}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">Total to repay</span><strong>${money(total)}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">First payment due</span><strong>${fdate(repayments[0].dueDate, { long: true })}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">Interest rate</span><strong>5%</strong></div>
      </div>
      <p class="text-xs text-slate-400 mt-3 text-center">The school will receive ${money(amount)} directly. Your fees are now covered.</p>
    `,
    footer: `<button class="btn btn-primary w-full" onclick="document.getElementById('modalBackdrop').click(); APP.render()">View My Loan</button>`
  });
  toast('Loan approved and disbursed!', 'success');
}

function payLoanInstallment(loanId) {
  const loan = DB.find('loans', loanId);
  const next = loan.repayments.find(r => !r.paid);
  if (!next) return;
  const updatedRepayments = loan.repayments.map(r => r.id === next.id ? Object.assign({}, r, { paid: true, paidAt: new Date().toISOString() }) : r);
  DB.update('loans', loanId, { repayments: updatedRepayments });
  toast(`Installment of ${money(next.amount)} paid`);
  APP.render();
}

/* ---------- Messages & Announcements (delegated) ---------- */
function view_par_messages() { return view_messages_shared('parent'); }
function view_par_announce() { return view_announce_shared('parent'); }

/* ---------- Timetable (parent) ---------- */
function view_par_timetable() {
  const children = COMPUTE.parentChildren(AUTH.current.id).filter(c => c.status === 'active');
  if (children.length === 0) return emptyState({ title: 'No children registered', body: 'Contact the school to link your children to this account.', icon: 'students' });
  const childId = APP.params.parTtChild || children[0].id;
  const child = DB.find('students', childId) || children[0];
  const cls = child ? DB.find('classes', child.classId) : null;
  const tt = cls ? DB.query('timetable', t => t.classId === cls.id) : [];
  const subjects = DB.get('subjects');
  const teachers = DB.get('teachers');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];
  const ttConfig = DB.settings().timetableConfig || {};
  const periodTimes = ttConfig.periodTimes || {1:'08:00-08:40',2:'08:40-09:20',3:'09:20-10:00',4:'10:00-10:40',5:'11:00-11:40',6:'11:40-12:20',7:'13:00-13:40',8:'13:40-14:20'};
  const break1After = ttConfig.break1After || 4;
  const break2After = ttConfig.break2After || 6;
  const break1Label = ttConfig.break1Label || 'Short Break';
  const break2Label = ttConfig.break2Label || 'Lunch Break';

  return `
    ${pageHeader({ title: 'Class Timetable', subtitle: `Weekly schedule for ${child ? child.name : 'your child'}` })}
    ${children.length > 1 ? `
      <div class="flex gap-2 mb-4 flex-wrap">
        ${children.map(c => `<button class="chip ${c.id===childId?'active':''}" onclick="APP.params.parTtChild='${c.id}'; APP.render()">${c.name.split(' ')[0]}</button>`).join('')}
      </div>
    ` : ''}
    <div class="card p-4 mb-4 flex items-center gap-3">
      ${avatar(child ? child.name : '?', 'md')}
      <div>
        <div class="font-bold text-slate-900">${child ? child.name : '—'}</div>
        <div class="text-sm text-slate-500">${cls ? cls.name : 'Class not assigned'} ${cls ? '· ' + (cls.level || '') : ''}</div>
      </div>
    </div>
    ${tt.length === 0 ? emptyState({ title: 'Timetable not published', body: 'The school has not yet published the timetable for this class.', icon: 'calendar' }) : `
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead><tr><th>Period</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead>
            <tbody>
              ${periods.map(p => {
                const entries = days.map(d => tt.find(x => x.day === d && x.period === p));
                const rows = [];
                if (p === break1After + 1) rows.push(`<tr class="bg-amber-50"><td colspan="6" class="text-center text-xs text-amber-800 font-semibold py-1.5">${break1Label}</td></tr>`);
                else if (p === break2After + 1) rows.push(`<tr class="bg-sky-50"><td colspan="6" class="text-center text-xs text-sky-800 font-semibold py-1.5">${break2Label}</td></tr>`);
                rows.push(`<tr>
                  <td><strong class="text-slate-900">P${p}</strong><br><span class="text-xs text-slate-500">${periodTimes[p] || ''}</span></td>
                  ${entries.map(e => {
                    if (!e) return '<td class="text-center text-slate-300 text-sm">—</td>';
                    const sub = subjects.find(s => s.id === e.subjectId);
                    const tch = teachers.find(t => t.id === e.teacherId);
                    return `<td><div class="font-semibold text-sm text-slate-900">${sub ? sub.name : '—'}</div><div class="text-xs text-slate-500">${tch ? tch.name : ''}</div></td>`;
                  }).join('')}
                </tr>`);
                return rows.join('');
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `}
  `;
}

/* ---------- Digital Consent (parent) ---------- */
function view_par_consent() {
  const children = COMPUTE.parentChildren(AUTH.current.id).filter(c => c.status === 'active');
  const childClassIds = children.map(c => c.classId);
  const allForms = DB.query('consentForms', f => f.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && (f.classId === 'all' || childClassIds.includes(f.classId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const consentF = APP.params.consentFilter || 'all';

  // Determine each form's response state for this parent
  const formsWithState = allForms.map(f => {
    const applicableKids = f.classId === 'all' ? children : children.filter(c => c.classId === f.classId);
    const responses = applicableKids.map(kid => DB.query('consentResponses', x => x.formId === f.id && x.studentId === kid.id)[0]).filter(Boolean);
    const allAnswered = responses.length === applicableKids.length && applicableKids.length > 0;
    const anyApproved = responses.some(r => r.agreed);
    const anyDeclined = responses.some(r => !r.agreed);
    const state = !allAnswered ? 'pending' : anyDeclined ? 'rejected' : 'approved';
    return { ...f, applicableKids, responses, state };
  });

  const pendingCount = formsWithState.filter(f => f.state === 'pending').length;
  const approvedCount = formsWithState.filter(f => f.state === 'approved').length;
  const rejectedCount = formsWithState.filter(f => f.state === 'rejected').length;

  const filtered = consentF === 'all' ? formsWithState
    : formsWithState.filter(f => f.state === consentF);

  return `
    ${pageHeader({ title: 'Digital Consent', subtitle: 'Approve school activities online — no paperwork' })}

    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${consentF==='all'?'active':''}" onclick="APP.params.consentFilter='all'; APP.render()">All (${allForms.length})</button>
      <button class="chip ${consentF==='pending'?'active':''}" onclick="APP.params.consentFilter='pending'; APP.render()">${icon('bell','w-3.5 h-3.5')} Pending (${pendingCount})</button>
      <button class="chip ${consentF==='approved'?'active':''}" onclick="APP.params.consentFilter='approved'; APP.render()">${icon('check','w-3.5 h-3.5')} Approved (${approvedCount})</button>
      <button class="chip ${consentF==='rejected'?'active':''}" onclick="APP.params.consentFilter='rejected'; APP.render()">${icon('logout','w-3.5 h-3.5')} Declined (${rejectedCount})</button>
    </div>

    ${filtered.length === 0 ? emptyState({ title: 'No consent requests', body: consentF === 'all' ? 'When the school needs your approval, it will appear here.' : `No ${consentF} consent forms.`, icon: 'check' }) : `
      <div class="space-y-4">
        ${filtered.map(f => {
          const typeBadge = { excursion: 'badge-info', media: 'badge-warn', pta: 'badge-neutral', policy: 'badge-success' }[f.type] || 'badge-neutral';
          const overdue = new Date(f.dueDate) < new Date();
          const stateColors = { pending: 'badge-warn', approved: 'badge-success', rejected: 'badge-danger' };
          return `<div class="card p-4">
            <div class="flex items-start gap-2 mb-2">
              <div class="flex-1 flex items-center gap-2 flex-wrap">
                <span class="badge ${typeBadge}">${f.type}</span>
                <span class="badge ${stateColors[f.state] || 'badge-neutral'}">${f.state}</span>
                <span class="badge ${overdue ? 'badge-danger' : 'badge-neutral'}">Due ${fdate(f.dueDate, { short: true })}</span>
              </div>
              <button class="btn btn-ghost !p-1.5 text-slate-500 hover:text-brand-700 flex-shrink-0" title="Share this consent form" onclick="shareConsentRecord('${f.id}')">${icon('paperclip','w-4 h-4')}</button>
            </div>
            <h3 class="font-bold text-slate-900">${f.title}</h3>
            <p class="text-sm text-slate-600 mt-1">${f.description}</p>
            <div class="mt-3 space-y-2">
              ${f.applicableKids.map(kid => {
                const r = f.responses.find(res => res.studentId === kid.id);
                return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  ${avatar(kid.name, 'sm')}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm">${kid.name}</div>
                    ${r ? `<div class="text-xs text-slate-500">Signed by ${r.signature} · ${fdate(r.timestamp, { time: true })}</div>` : `<div class="text-xs text-slate-400">Awaiting your response</div>`}
                  </div>
                  ${r
                    ? (r.agreed ? `<span class="badge badge-success">Approved ✓</span>` : `<span class="badge badge-danger">Declined</span>`)
                    : `<div class="flex gap-2">
                         <button class="btn btn-secondary !py-1.5 !px-3 text-xs" onclick="respondConsent('${f.id}','${kid.id}',false)">Decline</button>
                         <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="consentSignModal('${f.id}','${kid.id}')">${icon('check','w-3.5 h-3.5')} Approve</button>
                       </div>`}
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function shareConsentRecord(formId) {
  const form = DB.find('consentForms', formId);
  if (!form) return;
  const shareText = `Consent form: "${form.title}" — please respond by ${fdate(form.dueDate, { short: true })}. Log in to your parent portal to review and sign.`;
  if (navigator.share) {
    navigator.share({ title: form.title, text: shareText }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
    toast('Consent form info copied — share via WhatsApp or email');
  } else {
    toast(shareText, 'info');
  }
}

function consentSignModal(formId, studentId) {
  const form = DB.find('consentForms', formId);
  const kid = DB.find('students', studentId);
  modal({
    title: 'Approve & Sign',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3">
          <div class="font-semibold text-sm">${form.title}</div>
          <div class="text-xs text-slate-500 mt-0.5">For ${kid.name}</div>
        </div>
        <p class="text-sm text-slate-600">By signing below you confirm you have read the details and give your consent on behalf of your child.</p>
        <div><label class="input-label">Type your full name (e-signature)</label><input id="consent_sig" class="input" value="${AUTH.current.name}" /></div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="consent_agree" checked /> I agree and authorise this activity</label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="submitConsentSign('${formId}','${studentId}')">${icon('check','w-4 h-4')} Sign & Submit</button>`
  });
}

function submitConsentSign(formId, studentId) {
  const sig = document.getElementById('consent_sig').value.trim();
  const agree = document.getElementById('consent_agree').checked;
  if (!sig) { toast('Please type your name to sign', 'danger'); return; }
  if (!agree) { toast('Tick the box to authorise, or use Decline', 'warn'); return; }
  _recordConsent(formId, studentId, true, sig);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Consent recorded · timestamp saved', 'success');
}

function respondConsent(formId, studentId, agreed) {
  _recordConsent(formId, studentId, agreed, AUTH.current.name);
  APP.render();
  toast(agreed ? 'Consent recorded' : 'Response recorded as declined', agreed ? 'success' : 'info');
}

function _recordConsent(formId, studentId, agreed, signature) {
  const form = DB.find('consentForms', formId);
  // Remove any prior response for this form+student, then insert
  DB.query('consentResponses', r => r.formId === formId && r.studentId === studentId).forEach(r => DB.remove('consentResponses', r.id));
  DB.insert('consentResponses', { id: uid('cr'), formId, parentId: AUTH.current.id, studentId, agreed, signature, timestamp: now() });
  // Notify the school
  if (form) {
    DB.insert('notifications', { id: uid('not'), userId: form.schoolId, title: 'Consent Response', body: `${signature} ${agreed ? 'approved' : 'declined'} "${form.title}".`, type: agreed ? 'success' : 'warn', read: false, timestamp: now(), link: { view: 'adm_comms', params: { commsTab: 'consent' } } });
  }
}
