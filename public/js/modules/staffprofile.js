/* ============================================================
   Staff Profile — full page, mirroring the student profile.
   Same header card, same tab bar, same three-column Overview
   grid, so a proprietor moving between a student record and a
   staff record is looking at one layout, not two.
   ============================================================ */

const STF_TABS = [
  { k: 'overview',   l: 'Overview',           i: 'user' },
  { k: 'teaching',   l: 'Teaching',           i: 'classes' },
  { k: 'attendance', l: 'Leave & Attendance', i: 'attendance' },
  { k: 'appraisals', l: 'Appraisals',         i: 'results' },
  { k: 'payroll',    l: 'Payroll & Payslips', i: 'wallet' },
  { k: 'hr',         l: 'HR Actions',         i: 'shield' },
  { k: 'history',    l: 'History',            i: 'clock' },
  { k: 'documents',  l: 'Documents',          i: 'book' }
];

function openStaffProfile(staffId, tab) {
  document.getElementById('modalBackdrop')?.click();
  APP.go('stf_profile', { staffId, stfTab: tab || 'overview' });
}

/* payslips store deductions as a breakdown ({ paye, pension, nhf, total }),
   and a teacher's bank as { name, account } — both used to render as
   "[object Object]" / NaN when treated as scalars. */
function stfDeductions(p) {
  const d = p.deductions;
  if (d == null) return 0;
  if (typeof d === 'number') return d;
  if (typeof d.total === 'number') return d.total;
  return Object.values(d).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

function stfBankLabel(t) {
  const b = t.bank;
  const name = (b && typeof b === 'object') ? b.name : b;
  const acct = (b && typeof b === 'object') ? b.account : t.accountNo;
  if (!name && !acct) return '—';
  return [name, acct].filter(Boolean).join(' · ');
}

function _stfEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Every number the page shows, computed once so the header, the tiles and the
   Overview cards can never disagree with each other. */
function stfStats(t) {
  const results = DB.query('results', r => (t.classes || []).includes(r.classId) && (t.subjects || []).includes(r.subjectId));
  const att = DB.query('staffAttendance', a => a.staffId === t.id);
  const present = att.filter(a => a.status === 'present').length;
  return {
    results,
    avgScore: results.length ? Math.round(results.reduce((s, r) => s + r.total, 0) / results.length) : 0,
    passRate: results.length ? Math.round(results.filter(r => r.grade !== 'F').length / results.length * 100) : 0,
    att, present,
    absent: att.filter(a => a.status === 'absent').length,
    late: att.filter(a => a.status === 'late').length,
    attRate: att.length ? Math.round(present / att.length * 100) : 0,
    assignments: DB.query('assignments', a => a.teacherId === t.id),
    classes: DB.get('classes').filter(c => (t.classes || []).includes(c.id)),
    subjects: (t.subjects || []).map(sid => DB.find('subjects', sid)).filter(Boolean)
  };
}

function view_stf_profile() {
  const t = DB.find('teachers', APP.params.staffId);
  if (!t) {
    return emptyState({ icon: 'teacher', title: 'Staff member not found', body: 'That record may have been removed.',
      action: `<button class="btn btn-primary" onclick="APP.go('adm_workforce')">Back to Staff &amp; HR</button>` });
  }
  const tab = APP.params.stfTab || 'overview';
  const st = stfStats(t);

  const body =
      tab === 'teaching'   ? stfTeachingTab(t, st)
    : tab === 'attendance' ? stfAttendanceTab(t, st)
    : tab === 'appraisals' ? stfAppraisalsTab(t)
    : tab === 'payroll'    ? stfPayrollTab(t)
    : tab === 'hr'         ? stfHrTab(t)
    : tab === 'history'    ? stfHistoryTab(t)
    : tab === 'documents'  ? stfDocumentsTab(t)
    : stfOverviewTab(t, st);

  return `
    <nav class="flex items-center gap-2 text-sm text-slate-500 mb-3" aria-label="Breadcrumb">
      <button class="hover:text-brand-700 font-medium" onclick="APP.go('adm_workforce')">Staff &amp; HR</button>
      ${icon('chevron_right','w-3.5 h-3.5')}
      <span class="text-slate-700 font-semibold">Staff Profile</span>
    </nav>

    ${stfProfileHeader(t, st)}

    <div class="mt-4 border-b border-slate-200 overflow-x-auto">
      <div class="flex gap-1 -mb-px min-w-max" role="tablist">
        ${STF_TABS.map(x => `
          <button role="tab" aria-selected="${tab === x.k}"
                  class="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
                         ${tab === x.k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}"
                  onclick="APP.go('stf_profile', { staffId: '${t.id}', stfTab: '${x.k}' })">
            ${icon(x.i, 'w-4 h-4')} ${x.l}
          </button>`).join('')}
      </div>
    </div>

    <div class="pt-4">${body}</div>
  `;
}

function stfProfileHeader(t, st) {
  const isSuspended = t.status === 'suspended';
  const isTerminated = t.status === 'terminated';
  return `
    <div class="card p-5">
      <div class="flex flex-col sm:flex-row items-start gap-5">
        <div class="flex-shrink-0">${avatar(t, 'xl')}</div>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-extrabold text-slate-900">${_stfEsc(t.name)}</h1>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="badge ${t.staffType === 'Academic' ? 'badge-success' : 'badge-info'}">${_stfEsc(t.staffType || 'Academic')}</span>
            ${t.role ? `<span class="badge badge-neutral">${_stfEsc(t.role)}</span>` : ''}
            ${t.staffNo ? `<span class="badge badge-neutral">${_stfEsc(t.staffNo)}</span>` : ''}
            ${isSuspended ? '<span class="badge badge-warn">Suspended</span>' : ''}
            ${isTerminated ? '<span class="badge badge-danger">Offboarded</span>' : ''}
          </div>
          <div class="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3 text-sm text-slate-600">
            <div class="flex items-center gap-2 min-w-0">${icon('mail','w-4 h-4 text-slate-400')}
              <span class="truncate">${_stfEsc(t.email || '—')}</span></div>
            <div class="flex items-center gap-2 min-w-0">${icon('phone','w-4 h-4 text-slate-400')}
              <span class="truncate">${_stfEsc(t.phone || '—')}</span></div>
            <div class="flex items-center gap-2">${icon('calendar','w-4 h-4 text-slate-400')}
              <span>Hired ${fdate(t.hireDate, { long: true })}</span></div>
            <div class="flex items-center gap-2">${icon('classes','w-4 h-4 text-slate-400')}
              <span>${st.classes.length} class${st.classes.length === 1 ? '' : 'es'} · ${st.subjects.length} subject${st.subjects.length === 1 ? '' : 's'}</span></div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="btn btn-primary" onclick="editStaff('${t.id}')">${icon('edit','w-4 h-4')} Edit Profile</button>
          <button class="btn btn-secondary !px-2.5" aria-label="More actions" title="More actions" onclick="APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'hr' })">${icon('more','w-4 h-4')}</button>
        </div>
      </div>
    </div>`;
}

/* ---------- Overview ---------- */
function stfOverviewTab(t, st) {
  const field = (label, value, cls = 'text-slate-900') =>
    `<div><div class="text-xs text-slate-500">${label}</div><div class="font-semibold ${cls} mt-0.5">${value}</div></div>`;

  return `
    <div class="grid xl:grid-cols-12 gap-4 items-start">

      <div class="xl:col-span-5 space-y-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">${icon('user','w-4 h-4 text-brand-600')} Personal Information</h3>
            <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="editStaff('${t.id}')">${icon('edit','w-3.5 h-3.5')} Edit</button>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            ${field('Full Name', _stfEsc(t.name))}
            ${field('Staff Type', _stfEsc(t.staffType || 'Academic'))}
            ${field('Date of Birth', fdate(t.dob, { long: true }))}
            ${field('Hire Date', `<span class="text-brand-700">${fdate(t.hireDate, { long: true })}</span>`)}
            ${field('Gender', t.gender === 'M' ? 'Male' : t.gender === 'F' ? 'Female' : '—')}
            ${field('Role', _stfEsc(t.role || 'Teacher'))}
            ${field('Email', `<span class="font-normal text-brand-700 truncate block">${_stfEsc(t.email || '—')}</span>`)}
            ${field('Phone', `<span class="font-normal text-slate-700">${_stfEsc(t.phone || '—')}</span>`)}
            ${field('Address', `<span class="font-normal text-slate-700">${_stfEsc(t.address || '—')}</span>`)}
            ${field('Qualification', `<span class="font-normal text-slate-700">${_stfEsc(t.qualification || '—')}</span>`)}
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="card p-5">
            <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('classes','w-4 h-4 text-brand-600')} Teaching Assignment</h3>
            <div class="space-y-3.5">
              <div>
                <div class="text-xs text-slate-500 mb-1.5">Subjects Taught</div>
                <div class="flex flex-wrap gap-1.5">${st.subjects.length
                  ? st.subjects.map(s => `<span class="badge badge-success">${_stfEsc(s.name)}</span>`).join('')
                  : '<span class="text-sm text-slate-400">None assigned</span>'}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1.5">Assigned Classes</div>
                <div class="flex flex-wrap gap-1.5">${st.classes.length
                  ? st.classes.map(c => `<span class="badge badge-neutral">${_stfEsc(c.name)}</span>`).join('')
                  : '<span class="text-sm text-slate-400">None assigned</span>'}</div>
              </div>
              ${field('Open Assignments', st.assignments.length)}
            </div>
          </div>

          <div class="card p-5">
            <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('building','w-4 h-4 text-brand-600')} Employment</h3>
            <div class="space-y-3.5">
              ${field('Monthly Salary', money(t.salary))}
              ${field('Payroll Account', `<span class="font-normal text-slate-700">${_stfEsc(stfBankLabel(t))}</span>`)}
              ${field('Employment Status', t.status === 'terminated'
                ? '<span class="badge badge-danger">Offboarded</span>'
                : t.status === 'suspended' ? '<span class="badge badge-warn">Suspended</span>'
                : '<span class="badge badge-success">Active</span>')}
              ${field('Years of Service', (() => {
                if (!t.hireDate) return '—';
                const yrs = (Date.now() - new Date(t.hireDate)) / 31557600000;
                return yrs < 1 ? 'Under a year' : `${Math.floor(yrs)} year${Math.floor(yrs) === 1 ? '' : 's'}`;
              })())}
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('trending_up','w-4 h-4 text-brand-600')} Performance Summary</h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${[['results','bg-slate-100 text-slate-600','Avg Score', st.avgScore + '%'],
               ['check','bg-emerald-50 text-emerald-600','Pass Rate', st.passRate + '%'],
               ['clock', st.attRate >= 85 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600','Punctuality', st.attRate + '%'],
               ['book','bg-brand-50 text-brand-600','Assignments', st.assignments.length]].map(([ic, tone, label, value]) => `
              <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                <span class="w-10 h-10 rounded-xl ${tone} inline-flex items-center justify-center flex-shrink-0">${icon(ic,'w-5 h-5')}</span>
                <div class="min-w-0">
                  <div class="text-xs text-slate-500">${label}</div>
                  <div class="text-lg font-extrabold text-slate-900">${value}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="xl:col-span-4 space-y-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('package','w-4 h-4 text-brand-600')} Quick Summary</h3>
          <div class="flex items-center gap-3 p-3 rounded-xl ${t.status === 'terminated' ? 'bg-rose-50' : t.status === 'suspended' ? 'bg-amber-50' : 'bg-emerald-50'}">
            <span class="${t.status === 'terminated' ? 'text-rose-600' : t.status === 'suspended' ? 'text-amber-600' : 'text-emerald-600'}">
              ${icon(t.status === 'active' || !t.status ? 'check' : 'bell','w-6 h-6')}</span>
            <div>
              <div class="font-bold text-slate-900 text-sm">${t.status === 'terminated' ? 'Offboarded' : t.status === 'suspended' ? 'Suspended' : 'Active Staff'}</div>
              <div class="text-xs text-slate-500">${_stfEsc(t.staffType || 'Academic')} · since ${fdate(t.hireDate, { long: true })}</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3">
            ${[['Classes', st.classes.length], ['Subjects', st.subjects.length], ['Records', st.att.length]].map(([l, v]) => `
              <div class="p-3 rounded-xl bg-slate-50">
                <div class="text-xs text-slate-500">${l}</div>
                <div class="font-bold text-slate-900 text-sm mt-0.5">${v}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-4">${icon('attendance','w-4 h-4 text-brand-600')} Punctuality</h3>
          <div class="flex items-center gap-5">
            ${typeof conDonut === 'function' ? conDonut(st.attRate) : `<div class="text-3xl font-extrabold">${st.attRate}%</div>`}
            <button class="flex-1 flex items-center justify-between text-left p-3 rounded-xl hover:bg-slate-50 transition"
                    onclick="APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'attendance' })">
              <div>
                <div class="text-sm text-slate-500">Clock-in Rate</div>
                <div class="text-xl font-extrabold text-slate-900">${st.attRate}%</div>
              </div>
              ${icon('chevron_right','w-4 h-4 text-slate-400')}
            </button>
          </div>
          <div class="mt-4 space-y-2 text-sm">
            ${[['On time', st.present, 'bg-emerald-500'], ['Absent', st.absent, 'bg-rose-500'], ['Late', st.late, 'bg-slate-400']].map(([label, n, dot]) => `
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-slate-600"><span class="w-2 h-2 rounded-full ${dot}"></span>${label}</span>
                <span class="text-slate-500">${n} day${n === 1 ? '' : 's'} (${st.att.length ? Math.round(n / st.att.length * 100) : 0}%)</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="xl:col-span-3 space-y-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 flex items-center gap-2 mb-3">${icon('sparkles','w-4 h-4 text-brand-600')} Quick Actions</h3>
          <div class="-mx-2">
            ${[
              ['classes',    'Teaching Load',   `APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'teaching' })`],
              ['attendance', 'Leave &amp; Attendance', `APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'attendance' })`],
              ['results',    'Appraisals',      `APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'appraisals' })`],
              ['wallet',     'Payslips',        `APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'payroll' })`],
              ['shield',     'HR Actions',      `APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'hr' })`],
              ['edit',       'Edit Profile',    `editStaff('${t.id}')`]
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
            <button class="text-xs font-semibold text-brand-700 hover:underline" onclick="APP.go('stf_profile', { staffId: '${t.id}', stfTab: 'history' })">View All</button>
          </div>
          ${stfActivityFeed(t, 4)}
        </div>
      </div>
    </div>`;
}

function stfActivityFeed(t, limit) {
  const items = [];
  DB.query('staffAttendance', a => a.staffId === t.id).forEach(a => {
    items.push({ at: a.date, ic: 'attendance', tone: a.status === 'present' ? 'emerald' : 'rose',
      title: `Clocked ${a.status}`, meta: `${fdate(a.date, { long: true })}${a.clockIn ? ' · ' + a.clockIn : ''}` });
  });
  DB.query('payslips', p => p.staffId === t.id).forEach(p => {
    items.push({ at: p.createdAt || p.generatedAt || p.date, ic: 'wallet', tone: 'brand', title: 'Payslip issued', meta: `${_stfEsc(p.period || p.month || '')} · ${money(p.netPay || p.net || 0)}` });
  });
  DB.query('appraisals', a => a.staffId === t.id).forEach(a => {
    items.push({ at: a.createdAt || a.date, ic: 'results', tone: 'brand', title: 'Appraisal recorded', meta: _stfEsc(a.cycleTitle || a.title || 'Performance review') });
  });
  DB.query('leaveRequests', l => l.staffId === t.id).forEach(l => {
    items.push({ at: l.requestedAt || l.startDate, ic: 'calendar', tone: 'slate', title: `Leave ${_stfEsc(l.status || 'requested')}`, meta: `${_stfEsc(l.type || 'Leave')} · ${fdate(l.startDate, { long: true })}` });
  });

  const tones = { emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', brand: 'bg-brand-50 text-brand-600', slate: 'bg-slate-100 text-slate-500' };
  const rows = items.filter(i => i.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, limit || 8);
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

/* ---------- Remaining tabs ---------- */
function stfTeachingTab(t, st) {
  if (!st.classes.length && !st.subjects.length) {
    return emptyState({ icon: 'classes', title: 'No teaching assignment', body: 'Assign classes and subjects from the staff editor.' });
  }
  return `
    <div class="grid lg:grid-cols-2 gap-4 items-start">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Assigned Classes</h3>
        ${st.classes.length ? `<div class="space-y-2">${st.classes.map(c => {
          const n = COMPUTE.studentsByClass(c.id).length;
          return `<button class="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-left"
                          onclick="APP.go('adm_academic')">
            <span><span class="font-semibold text-slate-900">${_stfEsc(c.name)}</span>
              <span class="block text-xs text-slate-500 mt-0.5">${n} student${n === 1 ? '' : 's'}${c.teacherId === t.id ? ' · class teacher' : ''}</span></span>
            ${icon('chevron_right','w-4 h-4 text-slate-300')}
          </button>`;
        }).join('')}</div>` : '<p class="text-sm text-slate-500">No classes assigned.</p>'}
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Subjects &amp; Results</h3>
        <div class="flex flex-wrap gap-1.5 mb-4">${st.subjects.map(s => `<span class="badge badge-success">${_stfEsc(s.name)}</span>`).join('') || '<span class="text-sm text-slate-400">None</span>'}</div>
        <div class="grid grid-cols-3 gap-2">
          ${[['Results marked', st.results.length], ['Avg score', st.avgScore + '%'], ['Pass rate', st.passRate + '%']].map(([l, v]) => `
            <div class="p-3 rounded-xl bg-slate-50"><div class="text-xs text-slate-500">${l}</div>
              <div class="font-bold text-slate-900 mt-0.5">${v}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
}

function stfAttendanceTab(t, st) {
  const leave = DB.query('leaveRequests', l => l.staffId === t.id)
    .slice().sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
  const recent = st.att.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 40);
  return `
    <div class="grid sm:grid-cols-4 gap-3 mb-4">
      ${[['Days recorded', st.att.length, 'text-slate-900'], ['On time', st.present, 'text-emerald-700'],
         ['Absent', st.absent, 'text-rose-700'], ['Late', st.late, 'text-amber-700']].map(([l, v, c]) => `
        <div class="card p-4"><div class="text-xs text-slate-500">${l}</div>
          <div class="text-2xl font-extrabold ${c} mt-1">${v}</div></div>`).join('')}
    </div>
    <div class="grid lg:grid-cols-2 gap-4 items-start">
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Clock-in</th></tr></thead>
          <tbody>${recent.map(a => `<tr>
            <td>${fdate(a.date, { long: true })}</td>
            <td>${statusBadge(a.status)}</td>
            <td class="font-mono text-slate-600">${_stfEsc(a.clockIn || '—')}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Leave Requests</h3>
        ${leave.length ? `<div class="space-y-2">${leave.map(l => `
          <div class="p-3 rounded-xl bg-slate-50">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-900 text-sm">${_stfEsc(l.type || 'Leave')}</span>
              ${statusBadge(l.status)}
            </div>
            <div class="text-xs text-slate-500 mt-1">${fdate(l.startDate, { long: true })} → ${fdate(l.endDate, { long: true })}</div>
            ${l.reason ? `<p class="text-xs text-slate-600 mt-1">${_stfEsc(l.reason)}</p>` : ''}
          </div>`).join('')}</div>` : '<p class="text-sm text-slate-500">No leave requests on file.</p>'}
      </div>
    </div>`;
}

function stfAppraisalsTab(t) {
  const rows = DB.query('appraisals', a => a.staffId === t.id);
  if (!rows.length) return emptyState({ icon: 'results', title: 'No appraisals yet', body: 'Performance reviews appear here once an appraisal cycle includes this staff member.' });
  return `
    <div class="space-y-3">
      ${rows.map(a => `
        <div class="card p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-bold text-slate-900">${_stfEsc(a.cycleTitle || a.title || 'Performance Review')}</div>
              <div class="text-xs text-slate-500 mt-0.5">${_stfEsc(a.term || '')} ${a.createdAt ? '· ' + fdate(a.createdAt, { long: true }) : ''}</div>
            </div>
            ${a.score != null ? `<div class="text-right flex-shrink-0">
              <div class="text-xs text-slate-500">Score</div>
              <div class="text-2xl font-extrabold ${a.score >= 70 ? 'text-emerald-700' : 'text-amber-700'}">${a.score}%</div>
            </div>` : ''}
          </div>
          ${a.comments ? `<p class="text-sm text-slate-600 mt-2">${_stfEsc(a.comments)}</p>` : ''}
        </div>`).join('')}
    </div>`;
}

function stfPayrollTab(t) {
  const slips = DB.query('payslips', p => p.staffId === t.id)
    .slice().sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)));
  return `
    <div class="grid sm:grid-cols-3 gap-3 mb-4">
      ${[['Monthly Salary', money(t.salary)], ['Payslips Issued', slips.length],
         ['Payroll Account', _stfEsc(stfBankLabel(t))]].map(([l, v]) => `
        <div class="card p-4"><div class="text-xs text-slate-500">${l}</div>
          <div class="text-lg font-extrabold text-slate-900 mt-1 truncate">${v}</div></div>`).join('')}
    </div>
    ${slips.length ? `<div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th scope="col">Period</th><th scope="col" class="num">Gross</th><th scope="col" class="num">Deductions</th><th scope="col" class="num">Net</th><th scope="col">Status</th></tr></thead>
        <tbody>${slips.map(p => `<tr>
          <td class="font-semibold">${_stfEsc(p.period || p.month || '—')}</td>
          <td class="num font-mono">${money(p.grossPay || p.gross || 0)}</td>
          <td class="num font-mono text-rose-700">${money(stfDeductions(p))}</td>
          <td class="num font-mono font-bold">${money(p.netPay || p.net || 0)}</td>
          <td>${statusBadge(p.status || 'paid')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>` : emptyState({ icon: 'wallet', title: 'No payslips yet', body: 'Payslips appear here once a payroll run includes this staff member.' })}`;
}

function stfHrTab(t) {
  const isSuspended = t.status === 'suspended';
  const isTerminated = t.status === 'terminated';
  const records = DB.query('staffDiscipline', d => d.staffId === t.id)
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return `
    <div class="grid lg:grid-cols-2 gap-4 items-start">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-1">HR Actions</h3>
        <p class="text-xs text-slate-500 mb-4">Every action here is written to the audit log against your account.</p>
        ${isTerminated
          ? '<div class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">This staff member has been offboarded. No further HR actions are available.</div>'
          : `<div class="space-y-2">
              ${isSuspended
                ? `<button class="w-full p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-left transition" onclick="reinstateStaffModal('${t.id}')">
                    <div class="font-bold text-emerald-900 text-sm">Reinstate staff</div>
                    <div class="text-xs text-emerald-700 mt-0.5">Lift the suspension and restore full access</div></button>`
                : `<button class="w-full p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-left transition" onclick="suspendStaffModal('${t.id}')">
                    <div class="font-bold text-amber-900 text-sm">Suspend staff</div>
                    <div class="text-xs text-amber-700 mt-0.5">Temporarily remove access — reversible</div></button>`}
              <button class="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition" onclick="issueStaffWarningModal('${t.id}')">
                <div class="font-bold text-slate-900 text-sm">Issue warning</div>
                <div class="text-xs text-slate-600 mt-0.5">Record a formal written warning on file</div></button>
              <button class="w-full p-3 bg-rose-50 hover:bg-rose-100 rounded-xl text-left transition" onclick="terminateStaffModal('${t.id}')">
                <div class="font-bold text-rose-900 text-sm">Offboard staff</div>
                <div class="text-xs text-rose-700 mt-0.5">End employment and remove from active payroll</div></button>
            </div>`}
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Disciplinary Record</h3>
        ${records.length ? `<div class="space-y-2">${records.map(d => `
          <div class="p-3 rounded-xl bg-slate-50 border-l-4" style="border-left-color:${d.type === 'suspension' ? '#f4b400' : '#dc2626'}">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-900 text-sm">${_stfEsc(d.type || 'Record')}</span>
              <span class="text-xs text-slate-500">${fdate(d.date, { long: true })}</span>
            </div>
            ${d.reason ? `<p class="text-xs text-slate-600 mt-1">${_stfEsc(d.reason)}</p>` : ''}
          </div>`).join('')}</div>`
          : '<p class="text-sm text-slate-500">Clean record — no warnings or suspensions on file.</p>'}
      </div>
    </div>`;
}

function stfHistoryTab(t) {
  const logs = DB.query('auditLog', l => (l.target && String(l.target).includes(t.name)) || l.actor === t.id)
    .slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return `
    <div class="grid lg:grid-cols-2 gap-4 items-start">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-4">Recent Activity</h3>
        ${stfActivityFeed(t, 20)}
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-4">Audit Trail</h3>
        ${logs.length ? `<div class="space-y-3">${logs.slice(0, 40).map(l => `
          <div class="border-l-2 border-slate-200 pl-3">
            <div class="text-sm font-semibold text-slate-900">${_stfEsc(String(l.action).replace(/_/g, ' '))}</div>
            <div class="text-sm text-slate-600">${_stfEsc(l.target || '')}</div>
            <div class="text-xs text-slate-400 mt-0.5">${fdate(l.timestamp, { time: true })}</div>
          </div>`).join('')}</div>`
          : '<p class="text-sm text-slate-500">No audit entries reference this staff member yet.</p>'}
      </div>
    </div>`;
}

function stfDocumentsTab(t) {
  const docs = t.documents || {};
  const types = typeof _staffDocTypes !== 'undefined' ? _staffDocTypes : [];
  if (!types.length) {
    return emptyState({ icon: 'book', title: 'No documents on file',
      body: 'Contracts, certificates and identification attached to this staff member appear here.' });
  }
  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th scope="col">Document</th><th scope="col">Status</th><th scope="col">File</th></tr></thead>
        <tbody>${types.map(d => {
          const f = docs[d.key];
          return `<tr>
            <td class="font-semibold">${_stfEsc(d.label || d.key)}</td>
            <td>${f ? '<span class="badge badge-success">On file</span>' : '<span class="badge badge-neutral">Missing</span>'}</td>
            <td class="text-slate-500">${f ? _stfEsc(f.name || 'Uploaded') : '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}
