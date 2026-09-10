/* ============================================================
   Financial Concession & Discount Management — UI layer
   ------------------------------------------------------------
   Screens in this file:
     1. view_stu_profile        full-page student record, Overview
                                + Finance & Wallet (statement of account)
     2. editBillModal           OVERRIDES ledger.js — charge line items,
                                policy-driven concessions, and the
                                mandatory audit panel
     3. conFeePolicyBlock       the "Applicable Discount & Waiver
                                Policies" block inside the fee structure
                                modal

   Policies come from discounts.js. Nothing here invents its own
   discount maths — a concession is always a named policy, a base,
   and a computed deduction, so the ledger can group and the P&L
   can split it out by contra-revenue account.
   ============================================================ */

/* ---------- Small shared pieces ---------- */

function conPolicyOptions(selectedId) {
  return discountPolicies(currentSchoolId())
    .filter(p => p.status === 'active')
    .map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${_conEsc(p.name)} (${dpValueLabel(p)} on ${dpBaseLabel(p.appliesTo)})</option>`)
    .join('');
}

function _conEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Reason codes are a fixed vocabulary on purpose — free text cannot be
   reported on, and the whole point of the audit trail is that a proprietor
   can ask "how much did we give away as hardship waivers this term?". */
const CON_REASON_CODES = [
  'Principal Approved Concession',
  'Proprietor Approved Concession',
  'Sibling Policy Application',
  'Staff Dependant Entitlement',
  'Scholarship Award',
  'Bursary / Hardship Relief',
  'Billing Error Correction',
  'Negotiated Settlement'
];

/* Above this, a manual override needs a proprietor's approval reference.
   Configured in the Institutional Discount Policies dialog. */
function conApprovalLimit() {
  return typeof discountApprovalLimit === 'function' ? discountApprovalLimit() : 50000;
}

/* =============================================================
   1. STUDENT PROFILE — full page
   ============================================================= */

const CON_STUDENT_TABS = [
  { k: 'overview',   l: 'Overview',         i: 'user' },
  { k: 'academic',   l: 'Academic',         i: 'results' },
  { k: 'attendance', l: 'Attendance',       i: 'attendance' },
  { k: 'finance',    l: 'Finance & Wallet', i: 'wallet' },
  { k: 'discipline', l: 'Discipline',       i: 'shield' },
  { k: 'health',     l: 'Health',           i: 'heart' },
  { k: 'history',    l: 'History',          i: 'clock' },
  { k: 'documents',  l: 'Documents',        i: 'book' }
];

function openStudentProfile(studentId, tab) {
  document.getElementById('modalBackdrop')?.click();
  APP.go('stu_profile', { studentId, stuTab: tab || 'overview' });
}

function view_stu_profile() {
  const s = DB.find('students', APP.params.studentId);
  if (!s) {
    return emptyState({ icon: 'students', title: 'Student not found', body: 'That record may have been removed.',
      action: `<button class="btn btn-primary" onclick="APP.go('adm_people', { peopleTab: 'students' })">Back to Students</button>` });
  }
  const tab = APP.params.stuTab || 'overview';
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const school = DB.find('schools', s.schoolId) || {};
  const house = s.houseId ? DB.find('houses', s.houseId) : null;

  const body =
      tab === 'finance'    ? conFinanceTab(s)
    : tab === 'academic'   ? conAcademicTab(s)
    : tab === 'attendance' ? conAttendanceTab(s)
    : tab === 'discipline' ? conDisciplineTab(s)
    : tab === 'health'     ? conHealthTab(s, parent)
    : tab === 'history'    ? conHistoryTab(s)
    : tab === 'documents'  ? conDocumentsTab(s)
    : conOverviewTab(s, cls, parent, school, house);

  return `
    <nav class="flex items-center gap-2 text-sm text-slate-500 mb-3" aria-label="Breadcrumb">
      <button class="hover:text-brand-700 font-medium" onclick="APP.go('adm_people', { peopleTab: 'students' })">Students</button>
      ${icon('chevron_right','w-3.5 h-3.5')}
      <span class="text-slate-700 font-semibold">Student Profile</span>
    </nav>

    ${conProfileHeader(s, cls, parent, house)}

    <div class="mt-4 border-b border-slate-200 overflow-x-auto">
      <div class="flex gap-1 -mb-px min-w-max" role="tablist">
        ${CON_STUDENT_TABS.map(t => `
          <button role="tab" aria-selected="${tab === t.k}"
                  class="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
                         ${tab === t.k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}"
                  onclick="APP.go('stu_profile', { studentId: '${s.id}', stuTab: '${t.k}' })">
            ${icon(t.i, 'w-4 h-4')} ${t.l}
          </button>`).join('')}
      </div>
    </div>

    <div class="pt-4">${body}</div>
  `;
}

function conProfileHeader(s, cls, parent, house) {
  const age = typeof calcAge === 'function' ? calcAge(s.dob) : '';
  const statusCls = { active: 'badge-success', withdrawn: 'badge-danger', suspended: 'badge-warn', alumni: 'badge-neutral' }[s.status] || 'badge-neutral';
  return `
    <div class="card p-5">
      <div class="flex flex-col sm:flex-row items-start gap-5">
        <div class="flex-shrink-0">${avatar(s, 'xl')}</div>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-extrabold text-slate-900">${_conEsc(s.name)}</h1>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="badge ${statusCls}">${s.status ? s.status[0].toUpperCase() + s.status.slice(1) : 'Active'}</span>
            <span class="badge badge-neutral">${cls ? _conEsc(cls.name) : '—'}</span>
            <span class="badge badge-neutral">${_conEsc(s.admissionNo || '—')}</span>
            ${house ? `<span class="badge badge-neutral">${_conEsc(house.name)}</span>` : ''}
          </div>
          <div class="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3 text-sm text-slate-600">
            <div class="flex items-center gap-2">${icon('user','w-4 h-4 text-slate-400')}
              <span>${s.gender === 'M' ? 'Male' : 'Female'}</span><span class="text-slate-300">•</span>
              <span>${age} years</span><span class="text-slate-300">•</span>
              ${icon('calendar','w-4 h-4 text-slate-400')}<span>${fdate(s.dob, { long: true })}</span>
            </div>
            <div class="flex items-center gap-2 min-w-0">${icon('phone','w-4 h-4 text-slate-400')}
              <span class="truncate">${parent ? _conEsc(parent.phone || '—') : '—'}</span>
            </div>
            <div class="flex items-center gap-2 min-w-0">${icon('students','w-4 h-4 text-slate-400')}
              <span class="truncate">${parent ? _conEsc(parent.name) : '—'}</span>
              <span class="text-slate-400">(Parent / Guardian)</span>
            </div>
            <div class="flex items-center gap-2 min-w-0">${icon('mail','w-4 h-4 text-slate-400')}
              <span class="truncate">${parent ? _conEsc(parent.email || '—') : '—'}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="btn btn-primary" onclick="editStudent('${s.id}')">${icon('edit','w-4 h-4')} Edit Profile</button>
          <button class="btn btn-secondary !px-2.5" aria-label="More actions" title="More actions" onclick="studentLifecycleModal('${s.id}')">${icon('more','w-4 h-4')}</button>
        </div>
      </div>
    </div>`;
}

/* ---------- Overview ---------- */
function conOverviewTab(s, cls, parent, school, house) {
  const att = DB.query('attendance', a => a.studentId === s.id);
  const present = att.filter(a => a.status === 'present').length;
  const late = att.filter(a => a.status === 'late').length;
  const absent = att.filter(a => a.status === 'absent').length;
  const rate = att.length ? Math.round((present + late) / att.length * 100) : 100;
  const L = buildStudentLedger(s.id, s.schoolId);

  const field = (label, value, cls2 = 'text-slate-900') =>
    `<div><div class="text-xs text-slate-500">${label}</div><div class="font-semibold ${cls2} mt-0.5">${value}</div></div>`;

  return `
    <div class="grid xl:grid-cols-12 gap-4 items-start">

      <!-- Column 1 -->
      <div class="xl:col-span-5 space-y-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('user','w-4 h-4 text-brand-600')} Personal Information</h3>
            <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="editStudent('${s.id}')">${icon('edit','w-3.5 h-3.5')} Edit</button>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            ${field('Full Name', _conEsc(s.name))}
            ${field('Class', cls ? _conEsc(cls.name) : '—')}
            ${field('Gender', s.gender === 'M' ? 'Male' : 'Female')}
            ${field('Admission Date', `<span class="text-brand-700">${fdate(s.admissionDate, { long: true })}</span>`)}
            ${field('Date of Birth', fdate(s.dob, { long: true }))}
            ${field('Admission Type', `<span class="text-brand-700">${s.admissionType === 'transfer' ? 'Transfer-In' : 'New Admission'}</span>`)}
            ${field('Age', (typeof calcAge === 'function' ? calcAge(s.dob) : '—') + ' years')}
            ${field('Blood Group', _conEsc(s.bloodGroup || '—'))}
            ${field('Parent / Guardian', `${parent ? _conEsc(parent.name) : '—'}
              <div class="text-sm font-normal text-slate-600 flex items-center gap-1.5 mt-1">${icon('phone','w-3.5 h-3.5 text-slate-400')} ${parent ? _conEsc(parent.phone || '—') : '—'}</div>
              <div class="text-sm font-normal text-brand-700 flex items-center gap-1.5 mt-0.5 truncate">${icon('mail','w-3.5 h-3.5 text-slate-400')} ${parent ? _conEsc(parent.email || '—') : '—'}</div>`)}
            ${field('House', house ? `<span class="badge badge-danger">${_conEsc(house.name)}</span>` : '—')}
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('classes','w-4 h-4 text-brand-600')} Academic Details</h3>
            </div>
            <div class="space-y-3.5">
              ${field('School', _conEsc(school.name || '—'))}
              ${field('Class', cls ? _conEsc(cls.name) : '—')}
              ${field('Stream', _conEsc((cls && cls.arm) || 'General'))}
              ${field('Admission Date', fdate(s.admissionDate, { long: true }))}
              ${field('Current Term', _conEsc(DB.settings().currentTerm || '—'))}
            </div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('building','w-4 h-4 text-brand-600')} Contact &amp; Address</h3>
            </div>
            <div class="space-y-3.5">
              ${field('Parent / Guardian', `${parent ? _conEsc(parent.name) : '—'}
                <div class="text-sm font-normal text-slate-600 flex items-center gap-1.5 mt-1">${icon('phone','w-3.5 h-3.5 text-slate-400')} ${parent ? _conEsc(parent.phone || '—') : '—'}</div>
                <div class="text-sm font-normal text-brand-700 flex items-center gap-1.5 mt-0.5 truncate">${icon('mail','w-3.5 h-3.5 text-slate-400')} ${parent ? _conEsc(parent.email || '—') : '—'}</div>`)}
              ${field('Residential Address', `<span class="font-normal text-slate-700">${parent ? _conEsc(parent.address || '—') : '—'}</span>`)}
              ${field('Next of Kin', `<span class="font-normal text-slate-700">${_conEsc(s.nextOfKin || (parent ? parent.name : '—'))}</span>`)}
            </div>
          </div>
        </div>

        ${conFeeSummaryCard(s, L)}
      </div>

      <!-- Column 2 -->
      <div class="xl:col-span-4 space-y-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('package','w-4 h-4 text-brand-600')} Quick Summary</h3>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
            <span class="text-emerald-600">${icon('check','w-6 h-6')}</span>
            <div>
              <div class="font-bold text-slate-900 text-sm">${s.status === 'active' ? 'Active Student' : (s.status || '').replace(/^./, c => c.toUpperCase())}</div>
              <div class="text-xs text-slate-500">Enrolled for ${_conEsc(DB.settings().currentSession || '2024/2025')} session</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3">
            <div class="p-3 rounded-xl bg-slate-50">
              <div class="text-xs text-slate-500">Class</div>
              <div class="font-bold text-slate-900 text-sm mt-0.5">${cls ? _conEsc(cls.name) : '—'}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-50">
              <div class="text-xs text-slate-500">House</div>
              <div class="font-bold text-sm mt-0.5 ${house ? 'text-rose-600' : 'text-slate-900'}">${house ? _conEsc(house.name) : '—'}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-50">
              <div class="text-xs text-slate-500">Gender</div>
              <div class="font-bold text-slate-900 text-sm mt-0.5">${s.gender === 'M' ? 'Male' : 'Female'}</div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('results','w-4 h-4 text-brand-600')} Academic Progress</h3>
          <div class="flex items-center gap-5">
            ${conDonut(rate)}
            <button class="flex-1 flex items-center justify-between text-left p-3 rounded-xl hover:bg-slate-50 transition"
                    onclick="APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'attendance' })">
              <div>
                <div class="text-sm text-slate-500">Overall Attendance</div>
                <div class="text-xl font-extrabold text-slate-900">${rate}%</div>
              </div>
              ${icon('chevron_right','w-4 h-4 text-slate-400')}
            </button>
          </div>
          <div class="mt-4 space-y-2 text-sm">
            ${[['Present', present, 'bg-emerald-500'], ['Absent', absent, 'bg-rose-500'], ['Late', late, 'bg-slate-400']].map(([label, n, dot]) => `
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-slate-600"><span class="w-2 h-2 rounded-full ${dot}"></span>${label}</span>
                <span class="text-slate-500">${n} days (${att.length ? Math.round(n / att.length * 100) : 0}%)</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('heart','w-4 h-4 text-brand-600')} Health Information</h3>
            <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="editStudent('${s.id}')">${icon('edit','w-3.5 h-3.5')} Edit</button>
          </div>
          <div class="space-y-3.5">
            ${field('Blood Group', _conEsc(s.bloodGroup || '—'))}
            ${field('Medical Conditions', `<span class="font-normal text-slate-700">${_conEsc(s.medicalConditions || 'None')}</span>`)}
            ${field('Allergies', `<span class="font-normal text-slate-700">${_conEsc(s.allergies || 'None')}</span>`)}
            ${field('Emergency Contact', `${parent ? _conEsc(parent.name) : '—'}
              <div class="text-sm font-normal text-slate-600 flex items-center gap-1.5 mt-1">${icon('phone','w-3.5 h-3.5 text-slate-400')} ${parent ? _conEsc(parent.phone || '—') : '—'}</div>`)}
          </div>
        </div>
      </div>

      <!-- Column 3 -->
      <div class="xl:col-span-3 space-y-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-3">${icon('sparkles','w-4 h-4 text-brand-600')} Quick Actions</h3>
          <div class="-mx-2">
            ${[
              ['results',    'View Transcript',      `APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'academic' })`],
              ['attendance', 'View Attendance',      `APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'attendance' })`],
              ['wallet',     'View Finance &amp; Wallet', `APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'finance' })`],
              ['naira',      'Make Payment',         `conRecordPayment('${s.id}')`],
              ['fees',       'Record Payment',       `conRecordPayment('${s.id}')`],
              ['reports',    'View Reports',         `APP.go('adm_reports')`]
            ].map(([ic, label, act]) => `
              <button class="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition text-left" onclick="${act}">
                <span class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 inline-flex items-center justify-center flex-shrink-0">${icon(ic,'w-4 h-4')}</span>
                <span class="flex-1 text-sm font-medium text-slate-700">${label}</span>
                ${icon('chevron_right','w-4 h-4 text-slate-300')}
              </button>`).join('')}
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('bell','w-4 h-4 text-brand-600')} Recent Activities</h3>
            <button class="text-xs font-semibold text-brand-700 hover:underline" onclick="APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'history' })">View All</button>
          </div>
          ${conActivityFeed(s, 4)}
        </div>
      </div>
    </div>`;
}

/* Attendance ring. Stroke-dashoffset on a rotated circle — no chart library
   for one number. */
function conDonut(pct) {
  const r = 34, c = 2 * Math.PI * r;
  const tone = pct >= 85 ? '#00b386' : pct >= 70 ? '#f4b400' : '#dc2626';
  return `
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label="${pct}% attendance" class="flex-shrink-0">
      <circle cx="44" cy="44" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="9"/>
      <circle cx="44" cy="44" r="${r}" fill="none" stroke="${tone}" stroke-width="9" stroke-linecap="round"
              stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 44 44)"/>
      <text x="44" y="49" text-anchor="middle" font-size="17" font-weight="800" fill="#0f172a">${pct}%</text>
    </svg>`;
}

/* One feed from several sources — a parent asking "what happened on this
   account?" does not care which table the row came from. */
function conActivityFeed(s, limit) {
  const items = [];
  DB.query('transactions', t => t.studentId === s.id).forEach(t => {
    items.push({ at: t.date || t.timestamp, ic: 'naira', tone: 'emerald', title: 'Payment received', meta: `${money(t.amount)} · ${fdate(t.date || t.timestamp, { time: true })}` });
  });
  DB.query('invoices', i => i.studentId === s.id).forEach(inv => {
    items.push({ at: inv.createdAt, ic: 'fees', tone: 'rose', title: 'Bill created', meta: `${_conEsc(inv.term)} · ${fdate(inv.createdAt, { long: true })}` });
    (inv.lineItems || []).filter(l => l.amount < 0).forEach(l => {
      items.push({ at: inv.createdAt, ic: 'percent', tone: 'brand', title: 'Discount applied', meta: `${_conEsc(l.name)} · ${fdate(inv.createdAt, { long: true })}` });
    });
  });
  const att = DB.query('attendance', a => a.studentId === s.id);
  if (att.length) {
    const last = att[att.length - 1];
    items.push({ at: last.date, ic: 'attendance', tone: 'slate', title: 'Attendance marked', meta: `${att.length}/${att.length} days · ${fdate(last.date, { long: true })}` });
  }

  const tones = { emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', brand: 'bg-brand-50 text-brand-600', slate: 'bg-slate-100 text-slate-500' };
  const rows = items
    .filter(i => i.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit || 8);

  if (!rows.length) return '<p class="text-sm text-slate-500 py-4 text-center">No activity on this record yet.</p>';

  return `<div class="space-y-3">${rows.map(i => `
    <div class="flex items-start gap-3">
      <span class="w-8 h-8 rounded-lg ${tones[i.tone]} inline-flex items-center justify-center flex-shrink-0">${icon(i.ic,'w-4 h-4')}</span>
      <div class="min-w-0">
        <div class="text-sm font-semibold text-slate-900">${i.title}</div>
        <div class="text-xs text-slate-500 mt-0.5">${i.meta}</div>
      </div>
    </div>`).join('')}</div>`;
}

function conFeeSummaryCard(s, L) {
  const owed = L.balance;
  const tile = (ic, tone, label, value, extra = '') => `
    <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
      <span class="w-10 h-10 rounded-xl ${tone} inline-flex items-center justify-center flex-shrink-0">${icon(ic,'w-5 h-5')}</span>
      <div class="min-w-0">
        <div class="text-xs text-slate-500">${label}</div>
        <div class="text-lg font-extrabold text-slate-900 truncate">${value} ${extra}</div>
      </div>
    </div>`;
  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('fees','w-4 h-4 text-brand-600')} Fee Summary <span class="font-normal text-slate-400 text-sm">(Current Term)</span></h3>
        <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="APP.go('stu_profile', { studentId: '${s.id}', stuTab: 'finance' })">View Full Statement</button>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        ${tile('fees',   'bg-brand-50 text-brand-600',     'Total Billed',    money(L.debitTotal))}
        ${tile('percent','bg-brand-50 text-brand-600',     'Total Discounts', money(L.discountTotal))}
        ${tile('check',  'bg-emerald-50 text-emerald-600', 'Total Paid',      money(L.paidTotal))}
        ${tile('wallet', owed <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
               owed < 0 ? 'Credit Balance' : 'Balance',
               owed < 0 ? money(Math.abs(owed)) : money(owed),
               owed <= 0 ? `<span class="badge badge-success align-middle">${owed < 0 ? 'Cr' : 'Cleared'}</span>` : '')}
      </div>
    </div>`;
}

/* ---------- Finance & Wallet ---------- */
function conFinanceTab(s) {
  return `
    <div class="card p-5">
      ${renderStudentWallet(s.id, s.schoolId)}
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-secondary" onclick="APP.go('adm_people', { peopleTab: 'students' })">Close</button>
      <button class="btn btn-primary" onclick="printStudentStatement('${s.id}','${s.schoolId}')">${icon('download','w-4 h-4')} Print Statement</button>
    </div>`;
}

/* ---------- Remaining tabs ---------- */
function conAcademicTab(s) {
  const results = DB.query('results', r => r.studentId === s.id);
  if (!results.length) return emptyState({ icon: 'results', title: 'No results recorded', body: 'Results appear here once subject teachers submit scores for the term.' });
  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th scope="col">Subject</th><th scope="col">Term</th><th scope="col" class="num">CA</th><th scope="col" class="num">Exam</th><th scope="col" class="num">Total</th><th scope="col">Grade</th></tr></thead>
        <tbody>
          ${results.map(r => {
            const sub = DB.find('subjects', r.subjectId);
            const g = typeof COMPUTE !== 'undefined' && COMPUTE.grade ? COMPUTE.grade(r.total) : null;
            return `<tr>
              <td class="font-semibold">${sub ? _conEsc(sub.name) : '—'}</td>
              <td><span class="badge badge-info">${_conEsc(r.term || '—')}</span></td>
              <td class="num font-mono">${r.ca != null ? r.ca : '—'}</td>
              <td class="num font-mono">${r.exam != null ? r.exam : '—'}</td>
              <td class="num font-mono font-bold">${r.total}</td>
              <td><span class="badge ${r.total >= 50 ? 'badge-success' : 'badge-danger'}">${g ? g.grade : '—'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function conAttendanceTab(s) {
  const att = DB.query('attendance', a => a.studentId === s.id).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (!att.length) return emptyState({ icon: 'attendance', title: 'No attendance yet', body: 'Daily registers appear here once class teachers start marking.' });
  const count = k => att.filter(a => a.status === k).length;
  return `
    <div class="grid sm:grid-cols-4 gap-3 mb-4">
      ${[['Days recorded', att.length, 'text-slate-900'], ['Present', count('present'), 'text-emerald-700'], ['Absent', count('absent'), 'text-rose-700'], ['Late', count('late'), 'text-amber-700']]
        .map(([l, v, c]) => `<div class="card p-4"><div class="text-xs text-slate-500">${l}</div><div class="text-2xl font-extrabold ${c} mt-1">${v}</div></div>`).join('')}
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Arrival</th><th scope="col">Recorded by</th><th scope="col">Note</th></tr></thead>
        <tbody>
          ${att.slice(0, 60).map(a => {
            const by = a.recordedBy === 'system' ? null : DB.find('teachers', a.recordedBy);
            const late = a.status === 'present' && a.markedAt && typeof attMinutes === 'function'
              && attMinutes(a.markedAt) > attMinutes(attSettings().homeroomStart);
            return `<tr>
              <td>${fdate(a.date, { long: true })}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="font-mono ${late ? 'text-amber-700 font-semibold' : 'text-slate-600'}">
                ${a.markedAt ? (typeof att12h === 'function' ? att12h(a.markedAt) : a.markedAt) : '—'}
                ${a.correctedFrom ? '<span class="badge badge-info ml-1">corrected</span>' : ''}
              </td>
              <td class="text-slate-500 text-sm">${a.auto ? 'Cutoff sweep' : (by ? _conEsc(by.name) : '—')}</td>
              <td class="text-slate-500">${_conEsc(a.note || '—')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function conDisciplineTab(s) {
  const rows = DB.query('discipline', d => d.studentId === s.id);
  if (!rows.length) return emptyState({ icon: 'shield', title: 'Clean record', body: 'No disciplinary incidents have been logged for this student.' });
  return `
    <div class="space-y-3">
      ${rows.map(d => `
        <div class="card p-4 border-l-4" style="border-left-color:${d.severity === 'major' ? '#dc2626' : '#f4b400'}">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-bold text-slate-900">${_conEsc(d.type || 'Incident')}</div>
              <p class="text-sm text-slate-600 mt-1">${_conEsc(d.description || '')}</p>
            </div>
            <span class="badge ${d.severity === 'major' ? 'badge-danger' : 'badge-warn'} flex-shrink-0">${_conEsc(d.severity || 'minor')}</span>
          </div>
          <div class="text-xs text-slate-500 mt-2">${fdate(d.date, { long: true })}${d.action ? ' · ' + _conEsc(d.action) : ''}</div>
        </div>`).join('')}
    </div>`;
}

function conHealthTab(s, parent) {
  const visits = DB.query('sickbayVisits', v => v.studentId === s.id)
    .concat(DB.query('sickBayRecords', v => v.studentId === s.id));
  return `
    <div class="grid lg:grid-cols-3 gap-4 items-start">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('heart','w-4 h-4 text-brand-600')} Health Information</h3>
        <div class="space-y-3.5 text-sm">
          <div><div class="text-xs text-slate-500">Blood Group</div><div class="font-semibold mt-0.5">${_conEsc(s.bloodGroup || '—')}</div></div>
          <div><div class="text-xs text-slate-500">Medical Conditions</div><div class="mt-0.5">${_conEsc(s.medicalConditions || 'None')}</div></div>
          <div><div class="text-xs text-slate-500">Allergies</div><div class="mt-0.5">${_conEsc(s.allergies || 'None')}</div></div>
          <div><div class="text-xs text-slate-500">Emergency Contact</div><div class="font-semibold mt-0.5">${parent ? _conEsc(parent.name) : '—'}</div>
            <div class="text-slate-600">${parent ? _conEsc(parent.phone || '') : ''}</div></div>
        </div>
      </div>
      <div class="lg:col-span-2">
        ${visits.length ? `<div class="card overflow-hidden">
          <table class="tbl">
            <thead><tr><th scope="col">Date</th><th scope="col">Complaint</th><th scope="col">Treatment</th><th scope="col">Outcome</th></tr></thead>
            <tbody>${visits.map(v => `<tr>
              <td>${fdate(v.date || v.visitedAt, { long: true })}</td>
              <td class="font-semibold">${_conEsc(v.complaint || v.reason || '—')}</td>
              <td class="text-slate-600">${_conEsc(v.treatment || '—')}</td>
              <td>${_conEsc(v.outcome || v.status || '—')}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>` : emptyState({ icon: 'heart', title: 'No sick bay visits', body: 'Nurse visits recorded for this student will be listed here.' })}
      </div>
    </div>`;
}

function conHistoryTab(s) {
  const logs = DB.query('auditLog', l => l.target && String(l.target).includes(s.name))
    .slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return `
    <div class="grid lg:grid-cols-2 gap-4 items-start">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-4">Account Activity</h3>
        ${conActivityFeed(s, 20)}
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-4">Audit Trail</h3>
        ${logs.length ? `<div class="space-y-3">${logs.map(l => {
          const who = DB.find('teachers', l.actor) || DB.find('parents', l.actor);
          return `<div class="border-l-2 border-slate-200 pl-3">
            <div class="text-sm font-semibold text-slate-900">${_conEsc(String(l.action).replace(/_/g, ' '))}</div>
            <div class="text-sm text-slate-600">${_conEsc(l.target)}</div>
            <div class="text-xs text-slate-400 mt-0.5">${fdate(l.timestamp, { time: true })} · by ${who ? _conEsc(who.name) : _conEsc(l.actor)}</div>
          </div>`;
        }).join('')}</div>` : '<p class="text-sm text-slate-500">No audit entries reference this student yet.</p>'}
      </div>
    </div>`;
}

function conDocumentsTab(s) {
  return emptyState({
    icon: 'book',
    title: 'No documents uploaded',
    body: 'Birth certificates, transfer letters and immunisation records attached to this student will appear here.',
    action: `<button class="btn btn-primary" onclick="toast('Document upload is not wired up in this build', 'info')">${icon('upload','w-4 h-4')} Upload Document</button>`
  });
}

function conRecordPayment(studentId) {
  const inv = COMPUTE.studentInvoice(studentId);
  if (!inv) { toast('No invoice on this account yet', 'warn'); return; }
  if (typeof recordPaymentModal === 'function') recordPaymentModal(inv.id);
  else if (typeof addPaymentModal === 'function') addPaymentModal(inv.id);
  else toast('Payment entry is not available for your role', 'warn');
}

/* =============================================================
   2. EDIT BILL — overrides ledger.js
   ============================================================= */

let _conBillSeq = 0;

function _conBillRow(name, amount, locked, head) {
  const i = _conBillSeq++;
  return `
    <div class="con-bill-row grid grid-cols-[1fr,150px,32px] gap-2 items-center" data-row="${i}" data-head="${_conEsc(head || '')}" ${locked ? 'data-locked="1"' : ''}>
      <input class="input con-bill-name" value="${_conEsc(name || '')}" placeholder="Item (e.g. Tuition Fee)" ${locked ? 'readonly' : ''} />
      <input class="input con-bill-amt text-right font-mono" type="number" value="${amount != null ? amount : ''}" placeholder="0" ${locked ? 'readonly' : ''} oninput="conBillRecalc()" />
      ${locked
        ? `<span class="text-slate-300 text-center" title="Applied by policy — remove from the concessions panel">${icon('shield','w-4 h-4 inline')}</span>`
        : `<button type="button" class="btn btn-ghost !p-1.5 text-slate-400 hover:text-rose-600" aria-label="Remove line" title="Remove line"
                   onclick="this.closest('.con-bill-row').remove(); conBillRecalc()">${icon('x','w-4 h-4')}</button>`}
    </div>`;
}

function conAddBillRow() {
  document.getElementById('conBillRows').insertAdjacentHTML('beforeend', _conBillRow('', ''));
  conBillRecalc();
}

/* OVERRIDE: ledger.js defines editBillModal too; this module loads after it. */
function editBillModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const s = DB.find('students', inv.studentId);
  _conBillSeq = 0;

  const charges = (inv.lineItems || []).filter(l => l.amount >= 0);
  const concessions = (inv.lineItems || []).filter(l => l.amount < 0);

  modal({
    title: `Edit Bill: ${_conEsc(s ? s.name : 'Student')} — ${_conEsc(inv.term)}`,
    size: 'xl',
    body: `
      <div class="flex items-start gap-2 bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-900 mb-4">
        ${icon('info','w-4 h-4 flex-shrink-0 mt-0.5')}
        <span>Editing active term bill. Paid to date: <strong>${money(inv.paid)}</strong> (payments are immutable here).</span>
      </div>

      <div class="grid lg:grid-cols-[1fr,340px] gap-4 items-start">
        <div class="space-y-4">
          <section>
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Charge Line Items</h4>
            <div class="card p-4">
              <div class="grid grid-cols-[1fr,150px,32px] gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>Item</span><span class="text-right">Amount (&#8358;)</span><span></span>
              </div>
              <div id="conBillRows" class="space-y-2">${charges.map(l => _conBillRow(l.name, l.amount, false, l.head)).join('')}</div>
              <button type="button" class="btn btn-ghost text-brand-700 text-sm mt-2 !px-1" onclick="conAddBillRow()">${icon('plus','w-4 h-4')} Add line item</button>
            </div>
          </section>

          <section>
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Applied Concessions &amp; Discounts</h4>
            <div class="card p-4 space-y-3">
              <div>
                <label class="input-label" for="conPolicySel">Policy Selector</label>
                <select id="conPolicySel" class="input" onchange="conBillRecalc()">
                  ${conPolicyOptions()}
                  <option value="__custom">Custom amount — needs approval reference</option>
                </select>
              </div>
              <div id="conCustomRow" class="hidden">
                <label class="input-label" for="conCustomAmt">Custom Deduction (&#8358;)</label>
                <input id="conCustomAmt" type="number" min="0" class="input" placeholder="e.g. 15000" oninput="conBillRecalc()" />
              </div>
              <div class="flex items-end justify-between gap-3">
                <div>
                  <div class="text-xs text-slate-500">Calculated Deduction</div>
                  <div id="conCalcDeduction" class="text-lg font-extrabold text-emerald-700">- &#8358;0</div>
                  <div id="conApprovalWarn" class="text-xs text-amber-700 font-semibold mt-1 hidden"></div>
                </div>
                <button class="btn btn-primary" onclick="conApplyPolicyDiscount()">Apply Discount</button>
              </div>

              <div id="conAppliedList" class="space-y-2 pt-1">${concessions.map(conAppliedRow).join('')}</div>
            </div>
          </section>

          <div id="conBillTotals" class="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"></div>
        </div>

        <aside>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Audit &amp; Compliance</h4>
          <div class="card p-4 space-y-3">
            <div>
              <label class="input-label" for="conReason">Reason Code <span class="text-rose-600">*</span></label>
              <select id="conReason" class="input">
                <option value="">Select a reason code…</option>
                ${CON_REASON_CODES.map(r => `<option value="${_conEsc(r)}">${_conEsc(r)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="input-label" for="conApprovalRef">Approval Reference</label>
              <input id="conApprovalRef" class="input" placeholder="e.g. REF-2026-089" />
            </div>
            <div>
              <label class="input-label" for="conNote">Note <span class="text-rose-600">*</span></label>
              <textarea id="conNote" rows="3" class="input" placeholder="What changed on this bill, and why."></textarea>
            </div>
            <div class="text-xs text-slate-500 border-t border-slate-100 pt-3">
              Logged as <strong>${_conEsc(AUTH.current ? AUTH.current.name : 'you')}</strong> at save time.
              Overrides above <strong>${money(conApprovalLimit())}</strong> require an approval reference.
            </div>
          </div>
        </aside>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-primary" onclick="conSaveBill('${invoiceId}')">${icon('check','w-4 h-4')} Save Bill</button>`
  });

  conBillRecalc(inv.paid);
  window._conBillPaid = inv.paid;
}

function conAppliedRow(l) {
  const i = _conBillSeq++;
  return `
    <div class="con-concession flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2" data-row="${i}"
         data-name="${_conEsc(l.name)}" data-amount="${Math.abs(l.amount)}" data-account="${_conEsc(l.account || '')}">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-emerald-900 truncate">${_conEsc(l.name)}</div>
        ${l.account ? `<div class="text-xs text-emerald-700">${_conEsc(dpAccountLabel(l.account))}</div>` : ''}
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="font-mono text-sm font-bold text-emerald-800">- ${money(Math.abs(l.amount))}</span>
        <button type="button" class="btn btn-ghost !p-1 text-slate-400 hover:text-rose-600" aria-label="Remove concession" title="Remove concession"
                onclick="this.closest('.con-concession').remove(); conBillRecalc()">${icon('x','w-4 h-4')}</button>
      </div>
    </div>`;
}

/* The charge rows currently on screen, as invoice lines. `head` is carried
   through from the stored line item so a generated invoice matches its fee head
   exactly rather than by name. */
function conBillLines() {
  return [...document.querySelectorAll('#conBillRows .con-bill-row')].map(r => ({
    name: r.querySelector('.con-bill-name').value || '',
    amount: parseFloat(r.querySelector('.con-bill-amt').value) || 0,
    head: r.dataset.head || ''
  }));
}

/* The base a policy bites on, read live off the charge rows so the quoted
   deduction always matches what is actually on the bill. Matching is delegated
   to discountBaseAmount so the policy editor's worked example and the real
   deduction can never disagree. */
function conChargeBase(base) {
  return discountBaseAmount(base, conBillLines());
}

function conBillRecalc() {
  const sel = document.getElementById('conPolicySel');
  if (!sel) return;
  const isCustom = sel.value === '__custom';
  document.getElementById('conCustomRow').classList.toggle('hidden', !isCustom);

  let deduction = 0;
  if (isCustom) {
    deduction = parseFloat((document.getElementById('conCustomAmt') || {}).value) || 0;
  } else {
    const p = DB.find('discountPolicies', sel.value);
    if (p) {
      const base = conChargeBase(p.appliesTo);
      deduction = p.type === 'percent' ? Math.round(base * p.value / 100) : Math.min(p.value, base);
    }
  }
  const dEl = document.getElementById('conCalcDeduction');
  if (dEl) dEl.textContent = `- ${money(deduction)}`;

  // Approval gate — surfaced before the click, not as a rejection after it.
  const warn = document.getElementById('conApprovalWarn');
  const needsRef = deduction > conApprovalLimit();
  if (warn) {
    warn.classList.toggle('hidden', !needsRef);
    warn.textContent = needsRef ? `Above the ${money(conApprovalLimit())} limit — proprietor approval reference required.` : '';
  }

  conBillTotals();
}

/* The ledger invariant, live: Debit − Credit = Running Balance. */
function conBillTotals() {
  let charges = 0;
  document.querySelectorAll('#conBillRows .con-bill-row').forEach(r => {
    charges += parseFloat(r.querySelector('.con-bill-amt').value) || 0;
  });
  let concessions = 0;
  document.querySelectorAll('#conAppliedList .con-concession').forEach(c => {
    concessions += parseFloat(c.dataset.amount) || 0;
  });
  const paid = Number(window._conBillPaid) || 0;
  const billTotal = charges - concessions;
  const balance = billTotal - paid;

  const box = document.getElementById('conBillTotals');
  if (!box) return;
  box.innerHTML = `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>Bill Total: <strong class="text-slate-900">${money(billTotal)}</strong></span>
      <span class="text-slate-300">·</span>
      <span>Paid: <strong class="text-slate-900">${money(paid)}</strong></span>
      <span class="text-slate-300">·</span>
      <span>Balance after payment:
        <strong class="${balance < 0 ? 'text-emerald-700' : balance === 0 ? 'text-emerald-700' : 'text-amber-700'}">
          ${balance < 0 ? money(Math.abs(balance)) + ' Cr' : money(balance)}
        </strong></span>
    </div>
    <div class="text-xs font-normal text-slate-500 mt-1">
      Debit ${money(charges)} − Credit ${money(concessions + paid)} = ${balance < 0 ? money(Math.abs(balance)) + ' Cr' : money(balance)}
    </div>`;
}

function conApplyPolicyDiscount() {
  const sel = document.getElementById('conPolicySel');
  const isCustom = sel.value === '__custom';
  const ref = (document.getElementById('conApprovalRef').value || '').trim();

  let name, amount, account;
  if (isCustom) {
    amount = parseFloat((document.getElementById('conCustomAmt') || {}).value) || 0;
    name = 'Custom Discount';
    account = '4290';
  } else {
    const p = DB.find('discountPolicies', sel.value);
    if (!p) { toast('Pick a policy first', 'danger'); return; }
    const base = conChargeBase(p.appliesTo);
    amount = p.type === 'percent' ? Math.round(base * p.value / 100) : Math.min(p.value, base);
    name = p.type === 'percent' ? `${p.name} (${p.value}%)` : p.name;
    account = p.account;
  }

  if (amount <= 0) { toast('That policy computes to nothing on this bill', 'warn'); return; }
  if (amount > conApprovalLimit() && !ref) {
    toast(`A deduction above ${money(conApprovalLimit())} needs an approval reference`, 'danger');
    document.getElementById('conApprovalRef').focus();
    return;
  }
  const dupe = [...document.querySelectorAll('#conAppliedList .con-concession')].some(c => c.dataset.name === name);
  if (dupe) { toast('That concession is already on this bill', 'warn'); return; }

  document.getElementById('conAppliedList')
    .insertAdjacentHTML('beforeend', conAppliedRow({ name, amount: -amount, account }));
  conBillRecalc();
  toast(`${name} applied — ${money(amount)}`, 'success');
}

function conSaveBill(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;

  const reason = document.getElementById('conReason').value;
  const note = (document.getElementById('conNote').value || '').trim();
  const ref = (document.getElementById('conApprovalRef').value || '').trim();
  if (!reason) { toast('A reason code is required on every bill edit', 'danger'); document.getElementById('conReason').focus(); return; }
  if (!note) { toast('Add a short note explaining the change', 'danger'); document.getElementById('conNote').focus(); return; }

  const lineItems = [];
  let bad = false;
  document.querySelectorAll('#conBillRows .con-bill-row').forEach(r => {
    const name = (r.querySelector('.con-bill-name').value || '').trim();
    const raw = r.querySelector('.con-bill-amt').value;
    if (!name && raw === '') return;
    const amount = parseFloat(raw);
    if (!name || isNaN(amount)) { bad = true; return; }
    const item = { name, amount };
    if (r.dataset.head) item.head = r.dataset.head;
    lineItems.push(item);
  });
  if (bad) { toast('Each charge line needs a name and a numeric amount', 'danger'); return; }
  if (!lineItems.length) { toast('A bill needs at least one charge line', 'danger'); return; }

  let concessionTotal = 0;
  document.querySelectorAll('#conAppliedList .con-concession').forEach(c => {
    const amt = parseFloat(c.dataset.amount) || 0;
    concessionTotal += amt;
    lineItems.push({ name: c.dataset.name, amount: -amt, type: 'discount', account: c.dataset.account || '4290' });
  });

  if (concessionTotal > conApprovalLimit() && !ref) {
    toast(`Total concessions of ${money(concessionTotal)} exceed the ${money(conApprovalLimit())} limit — an approval reference is required`, 'danger');
    document.getElementById('conApprovalRef').focus();
    return;
  }

  const total = lineItems.reduce((sum, l) => sum + l.amount, 0);
  if (total < 0) { toast('Bill total cannot be negative', 'danger'); return; }
  const balance = Math.max(0, total - inv.paid);
  const status = balance === 0 ? 'paid' : (inv.paid > 0 ? 'partial' : 'outstanding');
  DB.update('invoices', invoiceId, { lineItems, total, balance, status });

  const s = DB.find('students', inv.studentId);
  DB.insert('auditLog', {
    id: uid('aud'), schoolId: inv.schoolId,
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'edited_bill',
    target: `${s ? s.name : inv.studentId} · ${inv.term} → ${money(total)} · ${reason}${ref ? ' · ' + ref : ''} · "${note}"`,
    reasonCode: reason, approvalRef: ref || null, note,
    timestamp: now()
  });
  if (s && s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId, title: 'Bill Updated',
      body: `${s.name}'s bill for ${inv.term} was updated. New total: ${money(total)}, balance ${money(balance)}.`,
      type: 'info', read: false, timestamp: now(), link: { view: 'par_fees' }
    });
  }

  document.getElementById('modalBackdrop')?.click();
  toast('Bill updated and logged to the audit trail', 'success');
  APP.render();
}

/* =============================================================
   3. FEE STRUCTURE — applicable policies block
   ============================================================= */

/* Rendered inside the fee structure modal. Ticking a policy here says which
   concessions bulk invoice generation is allowed to apply for this class and
   term — it does not grant anything on its own. */
function conFeePolicyBlock(existing) {
  const policies = discountPolicies(currentSchoolId()).filter(p => p.status === 'active');
  const allowed = (existing && existing.allowedPolicies) || policies.filter(p => p.autoApply).map(p => p.id);
  if (!policies.length) {
    return `<div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
      No discount policies defined yet — set them up under <strong>Discount Policies</strong> on the Fee Structure page.
    </div>`;
  }
  return `
    <div>
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Applicable Discount &amp; Waiver Policies</h4>
      <p class="text-xs text-slate-500 mb-2">Select permitted concessions for this term's bulk invoice generation:</p>
      <div class="space-y-1.5">
        ${policies.map(p => `
          <label class="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" class="fs-policy" value="${p.id}" ${allowed.includes(p.id) ? 'checked' : ''} onchange="conFeePolicyTotals()" />
            <span class="text-slate-800">${_conEsc(p.name)}
              <span class="text-slate-500">(${dpValueLabel(p)} ${p.type === 'percent' ? 'off' : 'fixed on'} ${dpBaseLabel(p.appliesTo)})</span>
            </span>
          </label>`).join('')}
      </div>
    </div>`;
}

/* Footer strip: base total plus the worst case if every ticked policy landed on
   one student — the number a proprietor actually wants before approving. */
function conFeePolicyTotals() {
  const box = document.getElementById('fs_policyTotals');
  if (!box) return;

  // Build the lines this structure would bill, so a policy written against any
  // head — including an additional fee — is costed correctly.
  const lines = FEE_HEADS.map(h => ({
    name: h.label, head: h.key,
    amount: parseInt((document.getElementById('fs_' + h.key) || {}).value) || 0
  }));
  [...document.querySelectorAll('.fs-extra-row')].forEach(row => {
    const idx = row.getAttribute('data-idx');
    const name = ((document.getElementById('fs_ei_name_' + idx) || {}).value || '').trim();
    const amount = parseInt((document.getElementById('fs_ei_amt_' + idx) || {}).value) || 0;
    if (name) lines.push({ name, amount, head: 'extra:' + _dpNorm(name) });
  });
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  let maxDiscount = 0;
  document.querySelectorAll('.fs-policy:checked').forEach(cb => {
    const p = DB.find('discountPolicies', cb.value);
    if (!p) return;
    const on = discountBaseAmount(p.appliesTo, lines);
    maxDiscount += p.type === 'percent' ? Math.round(on * p.value / 100) : Math.min(p.value, on);
  });

  box.innerHTML = `
    ${icon('info','w-3.5 h-3.5 inline text-brand-600')}
    Base Total: <strong>${money(total)}</strong>
    <span class="text-slate-300 mx-1">·</span>
    Max Potential Discount Applied: <strong class="text-emerald-700">-${money(maxDiscount)}</strong>`;
}
