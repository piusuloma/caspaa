/* ============================================================
   SCHOOL ADMIN MODULE
   Views prefixed with view_adm_*
   ============================================================ */

/* ============================================================
   Helper: resolve "the school" for the currently logged-in user.
   - School Proprietor: their account ID IS the school ID (sch_brightlights)
   - Principal / Finance / etc.: stored on AUTH.current.schoolId
   ============================================================ */
function currentSchoolId() {
  return (AUTH.current && AUTH.current.schoolId) || (AUTH.current && AUTH.current.id) || 'sch_brightlights';
}

/* ============================================================
   HUB VIEWS — group related sub-views into single nav items
   to keep the sidebar manageable (8 items instead of 21).
   ============================================================ */

function buildHub(title, subtitle, tabsList, defaultTab, paramKey) {
  const tab = APP.params[paramKey] || defaultTab;
  const activeTab = tabsList.find(t => t.key === tab) || tabsList[0];
  const subContent = renderSubView(activeTab.view);
  return `
    ${pageHeader({ title, subtitle })}
    ${tabs(tabsList.map(t => ({ key: t.key, label: t.label, badge: typeof t.badge === 'function' ? t.badge() : t.badge })), activeTab.key,
      k => { APP.params[paramKey] = k; APP.render(); })}
    <div class="pt-4">${subContent}</div>
  `;
}

function view_adm_people() {
  return buildHub('Students', 'Students, admissions, alumni', [
    { key: 'students',   label: 'Students',   view: 'view_adm_students' },
    { key: 'admissions', label: 'Admissions', view: 'view_adm_admissions', badge: () => DB.query('admissionApplications', a => a.schoolId === currentSchoolId() && a.status !== 'accepted' && a.status !== 'rejected').length || null },
    { key: 'alumni',     label: 'Alumni',     view: 'view_adm_alumni' }
  ], 'students', 'peopleTab');
}

function view_adm_workforce() {
  return buildHub('Staff & HR', 'Staff, attendance, leave, appraisal, permissions', [
    { key: 'staff',       label: 'Staff Directory', view: 'view_adm_staff' },
    { key: 'hr',          label: 'HR Hub',          view: 'view_adm_hr',  badge: () => DB.query('leaveRequests', l => l.schoolId === currentSchoolId() && l.status === 'pending').length || null },
    { key: 'appraisal',   label: 'Appraisal',       view: 'view_adm_appraisal', badge: () => { const sid=currentSchoolId(); return DB.query('appraisals', a => a.schoolId===sid && ['manager_pending','principal_pending','outcome_pending'].includes(a.status)).length + DB.query('salaryAdvances', a => a.schoolId===sid && a.status==='pending').length || null; } },
    { key: 'permissions', label: 'Permissions Report', view: 'view_adm_permissions' }
  ], 'staff', 'workforceTab');
}

/* ---------- Permissions Report ---------- */
function view_adm_permissions() {
  const sid = currentSchoolId();
  const teachers = DB.query('teachers', t => t.schoolId === sid);
  const roles = DB.query('schoolRoles', r => r.schoolId === sid);
  const roleMap = {};
  roles.forEach(r => { roleMap[r.id] = r; });
  // All possible permission keys (from school roles config)
  const allPerms = [
    { key: 'students',       label: 'Students' },
    { key: 'staff',          label: 'Staff' },
    { key: 'admissions',     label: 'Admissions' },
    { key: 'classes',        label: 'Classes' },
    { key: 'curriculum',     label: 'Curriculum' },
    { key: 'timetable',      label: 'Timetable' },
    { key: 'attendance',     label: 'Attendance' },
    { key: 'results',        label: 'Results' },
    { key: 'assignments',    label: 'Assignments' },
    { key: 'lessonPlans',    label: 'Lesson Plans' },
    { key: 'discipline',     label: 'Discipline' },
    { key: 'fees',           label: 'Fees' },
    { key: 'invoices',       label: 'Invoices' },
    { key: 'payments',       label: 'Payments' },
    { key: 'reconciliation', label: 'Reconciliation' },
    { key: 'reports',        label: 'Reports' },
    { key: 'inventory',      label: 'Inventory' },
    { key: 'communications', label: 'Communications' },
    { key: 'messaging',      label: 'Messaging' }
  ];
  // Determine each teacher's effective permissions (from their role or explicit list)
  const staffRows = teachers.map(t => {
    const role = roleMap[t.roleId] || null;
    const perms = t.permissions || (role ? role.permissions : []);
    return { t, role, perms };
  });

  return `
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">All staff mapped to their assigned role and module permissions.</p>
      <button class="btn btn-secondary" onclick="exportPermissionsReport()">${icon('download','w-4 h-4')} Export PDF</button>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl text-xs">
          <thead>
            <tr>
              <th class="sticky left-0 bg-slate-800 text-white z-10 min-w-[160px]">Staff Member</th>
              <th class="bg-slate-800 text-white min-w-[100px]">Role</th>
              ${allPerms.map(p => `<th class="bg-slate-800 text-white text-center px-2" title="${p.label}">${p.label.slice(0,5)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${staffRows.map(({ t, role, perms }) => {
              const hasAll = Array.isArray(perms) && (perms.includes('*') || perms.includes('all'));
              return `<tr>
                <td class="sticky left-0 bg-white border-r border-slate-200 z-10">
                  <div class="flex items-center gap-2">
                    ${avatar(t.name, 'sm')}
                    <div class="min-w-0">
                      <div class="font-semibold text-slate-900 truncate">${t.name}</div>
                      <div class="text-slate-500 truncate">${t.staffType || 'Academic'}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-neutral text-xs">${role ? role.name : (t.role || t.staffType || '—')}</span></td>
                ${allPerms.map(p => {
                  const has = hasAll || (Array.isArray(perms) && perms.includes(p.key));
                  return `<td class="text-center">${has ? `<span class="text-emerald-600 font-bold">✓</span>` : `<span class="text-slate-300">—</span>`}</td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
      ${icon('info','w-4 h-4 inline mr-1')} To change a staff member's permissions, open their profile in <strong>Staff Directory</strong> and edit their role/permission toggles.
    </div>
  `;
}

function exportPermissionsReport() {
  const sid = currentSchoolId();
  const teachers = DB.query('teachers', t => t.schoolId === sid);
  const roles = DB.query('schoolRoles', r => r.schoolId === sid);
  const roleMap = {};
  roles.forEach(r => { roleMap[r.id] = r; });
  const allPerms = ['students','staff','admissions','classes','curriculum','timetable','attendance','results','assignments','lessonPlans','discipline','fees','invoices','payments','reconciliation','reports','inventory','communications','messaging'];
  const html = `
    <div style="max-width:900px;margin:0 auto;font-family:system-ui;font-size:12px">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <h2 style="margin:14px 0 4px;font-size:16px">STAFF PERMISSIONS REPORT</h2>
        <p style="margin:0;color:#666">${DB.settings().currentTerm} · Generated ${fdate(today(), { long: true })}</p>
      </div>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px">
        <thead style="background:#1e293b;color:white">
          <tr>
            <th align="left">Staff Member</th>
            <th align="left">Staff Type</th>
            <th align="left">Role</th>
            <th align="left">Modules Permitted</th>
          </tr>
        </thead>
        <tbody>
          ${teachers.map(t => {
            const role = roleMap[t.roleId] || null;
            const perms = t.permissions || (role ? role.permissions : []);
            const hasAll = perms.includes('*') || perms.includes('all');
            const permLabels = hasAll ? ['All modules'] : perms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).filter(Boolean);
            return `<tr>
              <td><strong>${t.name}</strong><br/>${t.email || ''}</td>
              <td>${t.staffType || 'Academic'}</td>
              <td>${role ? role.name : (t.role || '—')}</td>
              <td>${permLabels.join(', ') || '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <p style="margin-top:24px;color:#999;font-size:10px;text-align:center">Computer-generated by CASPAA. To update permissions, use Settings → Roles & Permissions.</p>
    </div>
  `;
  printElement(html);
}

/* ---------- HR: Staff Appraisal & Salary Advances ---------- */
/* ============================================================
   APPRAISAL — full multi-step workflow
   Steps: 1-Open Cycle → 2-Self Assessment → 3-Manager Review
          → 4-Principal Approval → 5-Set Outcome → 6-Staff Acknowledges
   ============================================================ */

const APR_METRICS = [
  { key: 'attendance',          label: 'Attendance & Punctuality',  desc: '0–100. Based on gate records.' },
  { key: 'resultSubmission',    label: 'Result Submission',         desc: '0–100. Timely CA & exam entry.' },
  { key: 'parentFeedback',      label: 'Parent Engagement',         desc: '0–100. Responsiveness to parents.' },
  { key: 'classroomPerformance',label: 'Classroom Performance',     desc: '0–100. Teaching quality & student outcomes.' }
];

function _aprOverall(scores) {
  if (!scores) return 0;
  const vals = APR_METRICS.map(m => scores[m.key] || 0);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function _aprStatusLabel(status) {
  return { self_pending: 'Awaiting self-assessment', manager_pending: 'Awaiting manager review',
    principal_pending: 'Awaiting principal approval', outcome_pending: 'Awaiting outcome',
    ack_pending: 'Awaiting staff acknowledgement', completed: 'Completed' }[status] || status;
}

function _aprStatusBadge(status) {
  const map = { self_pending: 'badge-neutral', manager_pending: 'badge-warn', principal_pending: 'badge-info',
    outcome_pending: 'badge-warn', ack_pending: 'badge-info', completed: 'badge-success' };
  return `<span class="badge ${map[status] || 'badge-neutral'}">${_aprStatusLabel(status)}</span>`;
}

function _aprScoreBar(score) {
  const col = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return `<div class="flex items-center gap-2"><div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="${col} h-full rounded-full" style="width:${score}%"></div></div><span class="text-xs font-bold w-8 text-right">${score}</span></div>`;
}

/* ---- Main view ---- */
function view_adm_appraisal() {
  const sid = currentSchoolId();
  const cycleId = APP.params.aprCycle || null;
  const appraisalTab = APP.params.aprTab || 'cycles';
  const cycles = DB.query('appraisalCycles', c => c.schoolId === sid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const advances = DB.query('salaryAdvances', a => a.schoolId === sid).sort((a,b) => b.requestedAt.localeCompare(a.requestedAt));
  const pendingAdv = advances.filter(a => a.status === 'pending');
  // Count what needs admin action
  const needsManager = DB.query('appraisals', a => a.schoolId === sid && a.status === 'manager_pending').length;
  const needsPrincipal = DB.query('appraisals', a => a.schoolId === sid && a.status === 'principal_pending').length;
  const needsOutcome = DB.query('appraisals', a => a.schoolId === sid && a.status === 'outcome_pending').length;
  const actionNeeded = needsManager + needsPrincipal + needsOutcome + pendingAdv.length;

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Cycles', value: cycles.filter(c=>c.status!=='closed').length, icon: 'calendar', color: 'brand' })}
      ${statCard({ label: 'Need Your Action', value: actionNeeded, icon: 'bell', color: actionNeeded ? 'rose' : 'brand', trend: actionNeeded ? { direction: 'down', label: `${needsManager} manager · ${needsPrincipal} principal` } : { direction: 'up', label: 'all up to date' } })}
      ${statCard({ label: 'Completed', value: DB.query('appraisals', a => a.schoolId === sid && a.status === 'completed').length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Pending Advances', value: pendingAdv.length, icon: 'fees', color: pendingAdv.length ? 'gold' : 'brand' })}
    </div>

    ${tabs([
      { key: 'cycles',   label: 'Appraisal Cycles', badge: cycles.filter(c=>c.status!=='closed').length || null },
      { key: 'advances', label: 'Salary Advances',  badge: pendingAdv.length || null }
    ], appraisalTab, k => { APP.params.aprTab = k; APP.params.aprCycle = null; APP.render(); })}

    <div class="pt-4">
      ${appraisalTab === 'advances' ? _renderSalaryAdvances(advances) : _renderCycles(cycles, cycleId)}
    </div>
  `;
}

/* ---- Cycles list ---- */
function _renderCycles(cycles, activeCycleId) {
  if (activeCycleId) return _renderCycleDetail(activeCycleId);
  return `
    <div class="flex justify-end mb-3">
      <button class="btn btn-primary" onclick="openAppraisalCycleModal()">${icon('plus','w-4 h-4')} Open New Cycle</button>
    </div>
    ${cycles.length === 0 ? emptyState({ title: 'No appraisal cycles yet', body: 'Open a cycle to begin the appraisal process for your staff.', icon: 'reports' }) : `
      <div class="space-y-3">
        ${cycles.map(c => {
          const aprs = DB.query('appraisals', a => a.cycleId === c.id);
          const done = aprs.filter(a => a.status === 'completed').length;
          const pct = aprs.length ? Math.round(done / aprs.length * 100) : 0;
          const cycleStatusMap = { draft: ['badge-neutral','Draft'], self_assessment: ['badge-warn','Self Assessment'], manager_review: ['badge-warn','Manager Review'], principal_review: ['badge-info','Principal Review'], outcomes: ['badge-info','Setting Outcomes'], closed: ['badge-success','Closed'] };
          const [badgeCls, badgeLbl] = cycleStatusMap[c.status] || ['badge-neutral', c.status];
          return `<div class="card p-4 cursor-pointer hover:border-brand-300 border-2 border-transparent transition" onclick="APP.params.aprCycle='${c.id}'; APP.render()">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge ${badgeCls}">${badgeLbl}</span>
                  <span class="badge badge-neutral">${c.term}</span>
                </div>
                <h3 class="font-bold text-slate-900">${c.title}</h3>
                <div class="text-xs text-slate-500 mt-1">Deadline: ${fdate(c.deadline, { long: true })} · ${aprs.length} staff</div>
              </div>
              <span class="text-brand-600 flex-shrink-0">${icon('arrow_left','w-5 h-5 rotate-180')}</span>
            </div>
            <div class="mt-3">
              <div class="flex justify-between text-xs mb-1"><span class="text-slate-500">Progress</span><span class="font-semibold">${done}/${aprs.length} completed</span></div>
              <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

/* ---- Cycle detail — per-staff step tracker ---- */
function _renderCycleDetail(cycleId) {
  const cycle = DB.find('appraisalCycles', cycleId);
  if (!cycle) return '<p class="text-slate-500">Cycle not found.</p>';
  const aprs = DB.query('appraisals', a => a.cycleId === cycleId);
  const steps = ['Self Assessment', 'Manager Review', 'Principal Approval', 'Outcome', 'Acknowledged'];

  return `
    <button class="btn btn-ghost text-sm mb-4" onclick="APP.params.aprCycle=null; APP.render()">${icon('arrow_left','w-4 h-4')} All Cycles</button>
    <div class="card p-5 mb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-extrabold text-slate-900 text-lg">${cycle.title}</h2>
          <p class="text-sm text-slate-500 mt-0.5">Deadline: ${fdate(cycle.deadline, { long: true })}</p>
        </div>
        ${cycle.status !== 'closed' ? `<button class="btn btn-secondary text-sm" onclick="closeCycleConfirm('${cycleId}')">${icon('check','w-4 h-4')} Close Cycle</button>` : `<span class="badge badge-success">Closed</span>`}
      </div>
      <!-- Step progress tracker -->
      <div class="mt-4 flex items-center gap-0 overflow-x-auto">
        ${steps.map((s, i) => {
          const statuses = [['self_pending'],['manager_pending'],['principal_pending'],['outcome_pending'],['ack_pending','completed']];
          const allDone = aprs.length > 0 && aprs.every(a => !statuses[i].includes(a.status));
          const anyHere = aprs.some(a => statuses[i].includes(a.status));
          const color = allDone ? 'bg-brand-600 text-white' : anyHere ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400';
          return `<div class="flex items-center flex-shrink-0">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-bold">${allDone ? '✓' : i+1}</div>
              <div class="text-[10px] text-center mt-1 w-20 ${anyHere ? 'text-amber-700 font-semibold' : allDone ? 'text-brand-700' : 'text-slate-400'}">${s}</div>
            </div>
            ${i < steps.length - 1 ? `<div class="w-8 h-0.5 ${allDone ? 'bg-brand-400' : 'bg-slate-200'} mb-4 flex-shrink-0"></div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="space-y-3">
      ${aprs.map(apr => {
        const t = DB.find('teachers', apr.staffId);
        if (!t) return '';
        const finalOverall = apr.finalOverall || (apr.managerScores ? _aprOverall(apr.managerScores) : null);
        return `<div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            ${avatar(t, 'md')}
            <div class="flex-1 min-w-0">
              <div class="font-bold text-slate-900">${t.name}</div>
              <div class="text-xs text-slate-500">${t.staffType || 'Academic'} · ${t.role || 'Teacher'}</div>
            </div>
            ${_aprStatusBadge(apr.status)}
            ${finalOverall ? `<div class="text-right flex-shrink-0"><div class="text-xl font-extrabold ${finalOverall>=80?'text-emerald-700':finalOverall>=60?'text-amber-700':'text-rose-700'}">${finalOverall}%</div><div class="text-xs text-slate-400">overall</div></div>` : ''}
          </div>

          <!-- Step pills showing completion -->
          <div class="flex gap-1.5 flex-wrap mb-3 text-xs">
            <span class="px-2 py-0.5 rounded-full ${apr.selfSubmittedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">1. Self ${apr.selfSubmittedAt ? '✓' : '—'}</span>
            <span class="px-2 py-0.5 rounded-full ${apr.managerSubmittedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">2. Manager ${apr.managerSubmittedAt ? '✓' : '—'}</span>
            <span class="px-2 py-0.5 rounded-full ${apr.principalAt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">3. Principal ${apr.principalAt ? '✓' : '—'}</span>
            <span class="px-2 py-0.5 rounded-full ${apr.outcome ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">4. Outcome ${apr.outcome ? '✓' : '—'}</span>
            <span class="px-2 py-0.5 rounded-full ${apr.ackedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">5. Ack ${apr.ackedAt ? '✓' : '—'}</span>
          </div>

          <!-- Contextual action button -->
          <div class="flex gap-2 flex-wrap">
            ${apr.status === 'manager_pending' ? `<button class="btn btn-primary text-sm" onclick="aprManagerReviewModal('${apr.id}')">${icon('edit','w-4 h-4')} Do Manager Review</button>` : ''}
            ${apr.status === 'principal_pending' ? `<button class="btn btn-primary text-sm" onclick="aprPrincipalModal('${apr.id}')">${icon('check','w-4 h-4')} Principal Sign-off</button>` : ''}
            ${apr.status === 'outcome_pending' ? `<button class="btn btn-primary text-sm" onclick="aprOutcomeModal('${apr.id}')">${icon('reports','w-4 h-4')} Set Outcome</button>` : ''}
            ${apr.status === 'ack_pending' ? `<span class="text-xs text-slate-500 py-1">Awaiting staff acknowledgement</span>` : ''}
            ${apr.status === 'completed' ? `<span class="text-xs text-emerald-700 font-semibold py-1">✓ Completed ${fdate(apr.ackedAt, { short: true })}</span>` : ''}
            ${apr.status === 'self_pending' ? `<button class="btn btn-secondary text-sm" onclick="aprNudgeStaff('${apr.id}')">${icon('bell','w-4 h-4')} Nudge Staff</button>` : ''}
            <button class="btn btn-ghost text-sm" onclick="aprViewTimeline('${apr.id}')">${icon('reports','w-4 h-4')} View Timeline</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ---- Open new appraisal cycle ---- */
function openAppraisalCycleModal() {
  const sid = currentSchoolId();
  const teachers = DB.query('teachers', t => t.schoolId === sid);
  modal({
    title: 'Open New Appraisal Cycle',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline mr-1')} Opening a cycle sends a notification to all selected staff asking them to complete their <strong>self-assessment</strong> by the deadline.
        </div>
        <div><label class="input-label">Cycle Title</label><input id="cyc_title" class="input" value="${DB.settings().currentTerm} — Staff Performance Review" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Term</label><input id="cyc_term" class="input" value="${DB.settings().currentTerm}" /></div>
          <div><label class="input-label">Self-Assessment Deadline</label><input id="cyc_deadline" type="date" class="input" value="${daysAhead(14)}" /></div>
        </div>
        <div>
          <label class="input-label">Select Staff to Appraise</label>
          <div class="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3">
            ${teachers.map(t => `<label class="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input type="checkbox" class="apr_staff_cb" value="${t.id}" checked />
              ${avatar(t.name, 'sm')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm">${t.name}</div>
                <div class="text-xs text-slate-500">${t.staffType || 'Academic'}</div>
              </div>
            </label>`).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveAppraisalCycle()">${icon('check','w-4 h-4')} Open Cycle & Notify Staff</button>`
  });
}

function saveAppraisalCycle() {
  const title = document.getElementById('cyc_title').value.trim();
  const deadline = document.getElementById('cyc_deadline').value;
  const staffIds = [...document.querySelectorAll('.apr_staff_cb:checked')].map(cb => cb.value);
  if (!title) { toast('Enter a cycle title', 'danger'); return; }
  if (!staffIds.length) { toast('Select at least one staff member', 'danger'); return; }
  const sid = currentSchoolId();
  const cycle = {
    id: uid('cyc'), schoolId: sid, title, term: document.getElementById('cyc_term').value.trim(),
    deadline, status: 'self_assessment', staffIds, createdBy: AUTH.current.id, createdAt: now()
  };
  DB.insert('appraisalCycles', cycle);
  // Create individual appraisal records + notify each staff member
  staffIds.forEach(staffId => {
    DB.insert('appraisals', {
      id: uid('apr'), cycleId: cycle.id, schoolId: sid, staffId,
      status: 'self_pending',
      selfScores: null, selfComment: '', selfSubmittedAt: null,
      managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null,
      principalComment: '', principalBy: null, principalAt: null,
      finalScores: null, finalOverall: null,
      outcome: null, ackedAt: null, staffResponse: ''
    });
    DB.insert('notifications', {
      id: uid('not'), userId: staffId, title: 'Appraisal: Please Complete Self-Assessment',
      body: `Your ${title} self-assessment is open. Deadline: ${fdate(deadline, { long: true })}. Go to My Appraisal on your dashboard.`,
      type: 'info', read: false, timestamp: now(), link: { view: 'tch_appraisal' }
    });
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: AUTH.current.id, action: 'opened_appraisal_cycle', target: title, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.params.aprCycle = cycle.id;
  APP.render();
  toast(`Cycle opened · ${staffIds.length} staff notified to complete self-assessment`, 'success');
}

/* ---- Manager Review ---- */
function aprManagerReviewModal(aprId) {
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const punctuality = (() => { const recs = DB.query('staffAttendance', a => a.staffId === apr.staffId); if (!recs.length) return 80; return Math.round(recs.filter(r => r.status === 'present').length / recs.length * 100); })();
  modal({
    title: `Manager Review — ${t.name}`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <!-- Staff self-assessment (read-only) -->
        ${apr.selfScores ? `<details open class="bg-slate-50 rounded-xl p-4">
          <summary class="font-semibold text-sm cursor-pointer mb-2">Staff's Self-Assessment (submitted ${fdate(apr.selfSubmittedAt, { relative: true })})</summary>
          <div class="space-y-2 mt-2">
            ${APR_METRICS.map(m => `<div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">${m.label}</span>
              ${_aprScoreBar(apr.selfScores[m.key] || 0)}
            </div>`).join('')}
          </div>
          ${apr.selfComment ? `<div class="mt-3 text-sm text-slate-700 italic">"${apr.selfComment}"</div>` : ''}
        </details>` : `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">Staff has not yet submitted a self-assessment.</div>`}
        <!-- Manager scores -->
        <div>
          <h4 class="font-semibold text-slate-900 mb-3">Your Assessment</h4>
          <div class="space-y-3">
            ${APR_METRICS.map(m => `<div>
              <div class="flex items-center justify-between mb-1">
                <label class="input-label !mb-0">${m.label}</label>
                <span class="text-xs text-slate-400">${m.desc}</span>
              </div>
              <div class="flex items-center gap-3">
                <input id="mgr_${m.key}" type="range" min="0" max="100" value="${m.key==='attendance'?punctuality:80}" class="flex-1 accent-brand-600" oninput="aprUpdateMgrTotal()" />
                <span id="mgr_${m.key}_val" class="w-10 text-center font-bold text-brand-700">${m.key==='attendance'?punctuality:80}</span>
              </div>
            </div>`).join('')}
          </div>
          <div class="bg-brand-50 rounded-xl p-3 mt-3 flex items-center justify-between">
            <span class="font-semibold text-brand-800">Overall Manager Score</span>
            <span class="text-xl font-extrabold text-brand-700" id="mgr_overall">—</span>
          </div>
        </div>
        <div><label class="input-label">Manager Comment <span class="text-slate-400 font-normal">(required)</span></label>
          <textarea id="mgr_comment" rows="3" class="input" placeholder="Strengths, observations, areas for improvement…"></textarea>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveManagerReview('${aprId}')">${icon('check','w-4 h-4')} Submit Manager Review</button>`
  });
  setTimeout(aprUpdateMgrTotal, 50);
}

function aprUpdateMgrTotal() {
  APR_METRICS.forEach(m => {
    const slider = document.getElementById('mgr_' + m.key);
    const val = document.getElementById('mgr_' + m.key + '_val');
    if (slider && val) val.textContent = slider.value;
  });
  const overall = Math.round(APR_METRICS.reduce((s, m) => { const el = document.getElementById('mgr_'+m.key); return s + (el ? parseInt(el.value)||0 : 0); }, 0) / APR_METRICS.length);
  const el = document.getElementById('mgr_overall');
  if (el) el.textContent = overall + '%';
}

function saveManagerReview(aprId) {
  const comment = document.getElementById('mgr_comment').value.trim();
  if (!comment) { toast('Write a manager comment before submitting', 'danger'); return; }
  const scores = {};
  APR_METRICS.forEach(m => { const el = document.getElementById('mgr_' + m.key); scores[m.key] = el ? parseInt(el.value)||0 : 0; });
  DB.update('appraisals', aprId, {
    managerScores: scores, managerComment: comment,
    managerBy: AUTH.current.id, managerSubmittedAt: now(),
    status: 'principal_pending'
  });
  // Notify principal
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  DB.insert('notifications', { id: uid('not'), userId: 'prn_001', title: 'Appraisal Awaiting Principal Approval', body: `${t.name}'s appraisal is ready for your review and sign-off.`, type: 'info', read: false, timestamp: now(), link: { view: 'adm_workforce', params: { workforceTab: 'appraisal' } } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Manager review submitted for ${t.name} · sent to principal`, 'success');
}

/* ---- Principal Approval ---- */
function aprPrincipalModal(aprId) {
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const mgrOverall = _aprOverall(apr.managerScores);
  const selfOverall = apr.selfScores ? _aprOverall(apr.selfScores) : null;
  modal({
    title: `Principal Sign-off — ${t.name}`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <!-- Score comparison -->
        <div class="grid grid-cols-2 gap-3">
          ${selfOverall !== null ? `<div class="bg-slate-50 rounded-xl p-3 text-center"><div class="text-xs text-slate-500 mb-1">Staff Self-Score</div><div class="text-3xl font-extrabold text-slate-700">${selfOverall}%</div></div>` : ''}
          <div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-600 mb-1">Manager Score</div><div class="text-3xl font-extrabold text-brand-700">${mgrOverall}%</div></div>
        </div>
        <!-- Metric breakdown comparison -->
        <div class="space-y-2">
          ${APR_METRICS.map(m => `<div class="p-2 bg-slate-50 rounded-lg">
            <div class="text-xs font-semibold text-slate-700 mb-1">${m.label}</div>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
              ${apr.selfScores ? `<div>Self: ${_aprScoreBar(apr.selfScores[m.key]||0)}</div>` : ''}
              <div>Manager: ${_aprScoreBar(apr.managerScores[m.key]||0)}</div>
            </div>
          </div>`).join('')}
        </div>
        <!-- Manager comment -->
        <div class="bg-blue-50 rounded-xl p-3">
          <div class="text-xs font-semibold text-blue-700 mb-1">Manager's Comment</div>
          <div class="text-sm text-slate-700">${apr.managerComment}</div>
        </div>
        <!-- Principal comment -->
        <div><label class="input-label">Principal's Comment <span class="text-slate-400 font-normal">(required)</span></label>
          <textarea id="prn_comment" rows="3" class="input" placeholder="Add your remarks, endorse or note any adjustments…"></textarea>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          ${icon('info','w-4 h-4 inline mr-1')} Approving locks in the manager scores as the final score and moves to Outcome setting.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-danger" onclick="aprReturnForRevision('${aprId}')">${icon('arrow_left','w-4 h-4')} Return for Revision</button>
             <button class="btn btn-primary" onclick="savePrincipalApproval('${aprId}')">${icon('check','w-4 h-4')} Approve & Move to Outcome</button>`
  });
}

function savePrincipalApproval(aprId) {
  const comment = document.getElementById('prn_comment').value.trim();
  if (!comment) { toast('Add a principal comment before approving', 'danger'); return; }
  const apr = DB.find('appraisals', aprId);
  const finalScores = { ...apr.managerScores };
  const finalOverall = _aprOverall(finalScores);
  DB.update('appraisals', aprId, {
    principalComment: comment, principalBy: AUTH.current.id, principalAt: now(),
    finalScores, finalOverall, status: 'outcome_pending'
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  const t = DB.find('teachers', apr.staffId);
  toast(`Approved · ${t.name} · ${finalOverall}% — now set the outcome`, 'success');
}

function aprReturnForRevision(aprId) {
  DB.update('appraisals', aprId, { status: 'manager_pending', managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Returned to manager for revision', 'info');
}

/* ---- Set Outcome ---- */
function aprOutcomeModal(aprId) {
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const score = apr.finalOverall || 0;
  const suggested = score >= 80 ? 'increment' : score >= 60 ? 'commendation' : score >= 45 ? 'training' : 'pip';
  modal({
    title: `Set Outcome — ${t.name} · ${score}%`,
    body: `
      <div class="space-y-4">
        <div class="grid grid-cols-4 gap-2 text-center text-xs mb-2">
          <div class="bg-emerald-50 rounded-lg p-2"><div class="font-bold text-emerald-700">80–100</div><div class="text-slate-500">Salary Increment</div></div>
          <div class="bg-blue-50 rounded-lg p-2"><div class="font-bold text-blue-700">60–79</div><div class="text-slate-500">Commendation</div></div>
          <div class="bg-amber-50 rounded-lg p-2"><div class="font-bold text-amber-700">45–59</div><div class="text-slate-500">Training</div></div>
          <div class="bg-rose-50 rounded-lg p-2"><div class="font-bold text-rose-700">0–44</div><div class="text-slate-500">PIP</div></div>
        </div>
        <div>
          <label class="input-label">Outcome Type</label>
          <select id="out_type" class="input" onchange="aprOutcomeTypeChange()">
            <option value="increment" ${suggested==='increment'?'selected':''}>Salary Increment</option>
            <option value="commendation" ${suggested==='commendation'?'selected':''}>Letter of Commendation</option>
            <option value="training" ${suggested==='training'?'selected':''}>Training / Development Plan</option>
            <option value="pip" ${suggested==='pip'?'selected':''}>Performance Improvement Plan (PIP)</option>
            <option value="none">No Action</option>
          </select>
        </div>
        <div id="out_increment_row" class="${suggested==='increment'?'':'hidden'}">
          <label class="input-label">Increment % <span class="text-slate-400 font-normal">(of current salary)</span></label>
          <input id="out_increment" type="number" min="0" max="50" class="input" value="${score>=90?10:score>=80?7:5}" />
          <p class="text-xs text-slate-400 mt-1">Current salary: ${money(t.salary || 0)} → New: <span id="out_new_salary">${money((t.salary||0) * 1.07)}</span></p>
        </div>
        <div><label class="input-label">Notes / Instructions for Staff</label>
          <textarea id="out_note" rows="3" class="input" placeholder="Details about the increment, commendation, training programme, or PIP targets…"></textarea>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveAppraisalOutcome('${aprId}')">${icon('check','w-4 h-4')} Confirm & Notify Staff</button>`
  });
}

function aprOutcomeTypeChange() {
  const type = document.getElementById('out_type').value;
  const row = document.getElementById('out_increment_row');
  if (row) row.classList.toggle('hidden', type !== 'increment');
}

function saveAppraisalOutcome(aprId) {
  const type = document.getElementById('out_type').value;
  const note = document.getElementById('out_note').value.trim();
  const incrementPct = type === 'increment' ? (parseInt(document.getElementById('out_increment').value)||0) : 0;
  if (!note) { toast('Add notes for the staff member', 'danger'); return; }
  DB.update('appraisals', aprId, {
    outcome: { type, incrementPct, note },
    status: 'ack_pending'
  });
  // Notify staff
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const outcomeLabels = { increment: `Salary increment of ${incrementPct}%`, commendation: 'Letter of Commendation', training: 'Training / Development Plan', pip: 'Performance Improvement Plan', none: 'No action taken' };
  DB.insert('notifications', {
    id: uid('not'), userId: apr.staffId, title: 'Your Appraisal Result is Ready',
    body: `Your ${DB.find('appraisalCycles', apr.cycleId)?.term || ''} appraisal is complete. Score: ${apr.finalOverall}%. Outcome: ${outcomeLabels[type]}. Please open My Appraisal to acknowledge.`,
    type: 'success', read: false, timestamp: now(), link: { view: 'tch_appraisal' }
  });
  // Apply increment to salary record
  if (type === 'increment' && incrementPct > 0 && t.salary) {
    DB.update('teachers', t.id, { salary: Math.round(t.salary * (1 + incrementPct / 100)) });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'appraisal_outcome_set', target: `${t.name} · ${type} · ${apr.finalOverall}%`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Outcome set · ${t.name} notified to acknowledge`, 'success');
}

/* ---- View Full Timeline ---- */
function aprViewTimeline(aprId) {
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  const timeline = [];
  if (cycle) timeline.push({ icon: '📋', label: 'Cycle opened', note: cycle.title, date: cycle.createdAt, color: 'bg-slate-100' });
  if (apr.selfSubmittedAt) timeline.push({ icon: '✍️', label: 'Self-assessment submitted', note: `Score: ${_aprOverall(apr.selfScores)}%`, date: apr.selfSubmittedAt, color: 'bg-blue-50' });
  if (apr.managerSubmittedAt) timeline.push({ icon: '👨‍💼', label: 'Manager review submitted', note: `Score: ${_aprOverall(apr.managerScores)}%`, date: apr.managerSubmittedAt, color: 'bg-brand-50' });
  if (apr.principalAt) timeline.push({ icon: '✅', label: 'Principal approved', note: apr.principalComment, date: apr.principalAt, color: 'bg-emerald-50' });
  if (apr.outcome) {
    const ol = { increment: `Salary increment ${apr.outcome.incrementPct}%`, commendation: 'Letter of Commendation', training: 'Training Plan', pip: 'Performance Improvement Plan', none: 'No action' };
    timeline.push({ icon: '🏆', label: 'Outcome set', note: ol[apr.outcome.type] + (apr.outcome.note ? ` · ${apr.outcome.note}` : ''), date: now(), color: 'bg-amber-50' });
  }
  if (apr.ackedAt) timeline.push({ icon: '🤝', label: 'Staff acknowledged', note: apr.staffResponse || 'Acknowledged without comment', date: apr.ackedAt, color: 'bg-emerald-50' });
  modal({
    title: `Appraisal Timeline — ${t.name}`,
    size: 'lg',
    body: `
      <div class="space-y-0">
        ${timeline.map((ev, i) => `<div class="flex gap-3">
          <div class="flex flex-col items-center">
            <div class="w-9 h-9 rounded-full ${ev.color} flex items-center justify-center text-lg flex-shrink-0">${ev.icon}</div>
            ${i < timeline.length - 1 ? `<div class="w-0.5 flex-1 bg-slate-200 my-1"></div>` : ''}
          </div>
          <div class="pb-4 flex-1 min-w-0">
            <div class="font-semibold text-sm text-slate-900">${ev.label}</div>
            ${ev.note ? `<div class="text-xs text-slate-600 mt-0.5">${ev.note}</div>` : ''}
            <div class="text-xs text-slate-400 mt-0.5">${fdate(ev.date, { time: true })}</div>
          </div>
        </div>`).join('')}
        ${timeline.length === 0 ? `<p class="text-sm text-slate-400">No activity yet.</p>` : ''}
      </div>
      ${apr.finalOverall ? `<div class="mt-3 bg-brand-50 rounded-xl p-4 text-center">
        <div class="text-3xl font-extrabold text-brand-700">${apr.finalOverall}%</div>
        <div class="text-sm text-slate-600 mt-1">Final Score · ${apr.outcome ? ({increment:'Increment',commendation:'Commendation',training:'Training',pip:'PIP',none:'No action'})[apr.outcome.type] : 'Outcome pending'}</div>
      </div>` : ''}
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function aprNudgeStaff(aprId) {
  const apr = DB.find('appraisals', aprId);
  const t = DB.find('teachers', apr.staffId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  DB.insert('notifications', { id: uid('not'), userId: apr.staffId, title: 'Reminder: Complete Your Self-Assessment', body: `Your appraisal self-assessment is still pending. Deadline: ${fdate(cycle?.deadline, { long: true })}. Please complete it now.`, type: 'warn', read: false, timestamp: now(), link: { view: 'tch_appraisal' } });
  toast(`Reminder sent to ${t.name}`, 'info');
}

function closeCycleConfirm(cycleId) {
  confirm('Close this appraisal cycle? Incomplete appraisals will remain in their current state.', () => {
    DB.update('appraisalCycles', cycleId, { status: 'closed' });
    APP.render();
    toast('Appraisal cycle closed', 'info');
  }, { yesLabel: 'Close Cycle' });
}

/* ---- Salary Advances ---- */
function _renderSalaryAdvances(advances) {
  return `
    <div class="flex justify-end mb-3">
      <button class="btn btn-secondary" onclick="newSalaryAdvanceModal()">${icon('plus','w-4 h-4')} Record Request</button>
    </div>
    ${advances.length === 0 ? emptyState({ title: 'No salary advance requests', body: 'Requests from staff will appear here.', icon: 'fees' }) : `
      <div class="card overflow-hidden"><div class="overflow-x-auto"><table class="tbl">
        <thead><tr><th>Staff</th><th>Amount</th><th>Reason</th><th>Requested</th><th class="text-center">Status</th><th class="text-right">Action</th></tr></thead>
        <tbody>
          ${advances.map(a => {
            const t = DB.find('teachers', a.staffId);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(t ? t.name : '?', 'sm')}<span class="font-medium">${t ? t.name : '—'}</span></div></td>
              <td class="font-mono">${money(a.amount)}</td>
              <td class="text-sm text-slate-600">${a.reason}</td>
              <td class="text-sm text-slate-500">${fdate(a.requestedAt, { short: true })}</td>
              <td class="text-center">${statusBadge(a.status)}</td>
              <td class="text-right whitespace-nowrap">${a.status === 'pending'
                ? `<button class="btn btn-ghost !p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Approve" onclick="decideSalaryAdvance('${a.id}','approved')">${icon('check','w-4 h-4')}</button>
                   <button class="btn btn-ghost !p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Reject" onclick="decideSalaryAdvance('${a.id}','rejected')">${icon('x','w-4 h-4')}</button>`
                : `<span class="text-xs text-slate-400">${a.decidedAt ? fdate(a.decidedAt, { short: true }) : ''}</span>`}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div></div>
    `}
  `;
}

function newSalaryAdvanceModal() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  modal({
    title: 'Record Salary Advance Request',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Staff</label><select id="adv_staff" class="input">${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div><label class="input-label">Amount (₦)</label><input id="adv_amount" type="number" class="input" placeholder="50000" /></div>
        <div><label class="input-label">Reason</label><textarea id="adv_reason" rows="2" class="input" placeholder="e.g. Medical emergency"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSalaryAdvance()">Submit Request</button>`
  });
}

function saveSalaryAdvance() {
  const amount = parseInt(document.getElementById('adv_amount').value) || 0;
  if (amount <= 0) { toast('Enter a valid amount', 'danger'); return; }
  DB.insert('salaryAdvances', {
    id: uid('adv'), schoolId: currentSchoolId(), staffId: document.getElementById('adv_staff').value,
    amount, reason: document.getElementById('adv_reason').value.trim() || 'Not specified',
    status: 'pending', requestedAt: now(), decidedAt: null
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Salary advance request recorded', 'success');
}

function decideSalaryAdvance(id, decision) {
  const adv = DB.find('salaryAdvances', id);
  DB.update('salaryAdvances', id, { status: decision, decidedAt: now() });
  const t = DB.find('teachers', adv.staffId);
  DB.insert('notifications', { id: uid('not'), userId: adv.staffId, title: 'Salary Advance ' + (decision === 'approved' ? 'Approved' : 'Declined'), body: `Your ${money(adv.amount)} salary advance request was ${decision}.`, type: decision === 'approved' ? 'success' : 'warn', read: false, timestamp: now() });
  if (decision === 'approved') {
    DB.insert('expenses', { id: uid('exp'), schoolId: currentSchoolId(), date: today(), category: 'Salaries', amount: adv.amount, description: `Salary advance — ${t ? t.name : 'staff'}`, recordedBy: AUTH.current.id });
  }
  APP.render();
  toast(`Advance ${decision}${decision === 'approved' ? ' · posted to expenses' : ''}`, decision === 'approved' ? 'success' : 'info');
}

function view_adm_academic() {
  return buildHub('Academic', 'Classes, curriculum, timetable, attendance, results, discipline', [
    { key: 'classes',    label: 'Classes',    view: 'view_adm_classes' },
    { key: 'curriculum', label: 'Curriculum', view: 'view_adm_curriculum' },
    { key: 'timetable',  label: 'Timetable',  view: 'view_adm_timetable' },
    { key: 'attendance', label: 'Attendance', view: 'view_adm_attendance' },
    { key: 'results',    label: 'Results',    view: 'view_adm_results' },
    { key: 'discipline', label: 'Discipline', view: 'view_adm_discipline' }
  ], 'classes', 'academicTab');
}

function view_adm_curriculum() {
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const allSchemes = DB.query('schemesOfWork', s => s.schoolId === currentSchoolId());
  const currentTerm = DB.settings().currentTerm;
  const tab = APP.params.curTab || 'overview';

  return `
    ${pageHeader({
      title: 'Curriculum (Schemes of Work)',
      subtitle: 'Term-by-term, week-by-week topic plans · NERDC / UBEC aligned',
      actions: `
        <button class="btn btn-secondary" onclick="importNERDCTemplateModal()">${icon('download','w-4 h-4')} Import NERDC Template</button>
        <button class="btn btn-primary" onclick="newSchemeModal()">${icon('plus','w-4 h-4')} New Scheme</button>
      `
    })}

    ${tabs([
      { key: 'overview', label: 'Overview' },
      { key: 'by-class', label: 'By Class' },
      { key: 'by-subject', label: 'By Subject' }
    ], tab, k => { APP.params.curTab = k; APP.render(); })}

    <div class="pt-4">
      ${tab === 'by-class' ? renderCurriculumByClass(classes, subjects, allSchemes, currentTerm) :
        tab === 'by-subject' ? renderCurriculumBySubject(classes, subjects, allSchemes, currentTerm) :
        renderCurriculumOverview(classes, subjects, allSchemes, currentTerm)}
    </div>
  `;
}

function renderCurriculumOverview(classes, subjects, allSchemes, currentTerm) {
  const termSchemes = allSchemes.filter(s => s.term === currentTerm);
  const totalSchemes = termSchemes.length;
  const totalCovered = termSchemes.reduce((acc, s) => acc + s.weeks.filter(w => w.covered).length, 0);
  const totalWeeks = termSchemes.reduce((acc, s) => acc + s.weeks.length, 0);
  const overallPct = totalWeeks ? Math.round((totalCovered / totalWeeks) * 100) : 0;

  return `
    <!-- Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Schemes of Work', value: totalSchemes, icon: 'book', color: 'brand', tooltip: 'Number of subject × class × term schemes published for the current term.' })}
      ${statCard({ label: 'Total Weeks', value: totalWeeks, icon: 'calendar', color: 'blue', tooltip: 'Sum of weeks planned across all schemes this term.' })}
      ${statCard({ label: 'Weeks Covered', value: totalCovered, icon: 'check', color: 'gold', trend: { direction: 'up', label: `${overallPct}% of plan` }, tooltip: 'Number of week-topics teachers have actually delivered, as ticked on the scheme.' })}
      ${statCard({ label: 'Coverage Rate', value: overallPct + '%', icon: 'trending_up', color: overallPct >= 50 ? 'brand' : 'rose', tooltip: 'Weeks covered ÷ weeks planned. Drives the curriculum-completion reports.' })}
    </div>

    <!-- All schemes for current term -->
    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">${currentTerm} — Schemes of Work</h3>
        <span class="text-xs text-slate-500">Click any scheme to view / edit / tick coverage</span>
      </div>
      ${termSchemes.length === 0
        ? emptyState({ title: 'No schemes yet', body: 'Create your first scheme of work or import a NERDC template to get started.', icon: 'book', action: `<button class="btn btn-primary" onclick="newSchemeModal()">${icon('plus','w-4 h-4')} New Scheme</button>` })
        : `<table class="tbl">
            <thead><tr><th>Class</th><th>Subject</th><th>Source</th><th>Weeks</th><th>Coverage</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${termSchemes.map(sch => {
                const cls = DB.find('classes', sch.classId);
                const sub = DB.find('subjects', sch.subjectId);
                const covered = sch.weeks.filter(w => w.covered).length;
                const pct = sch.weeks.length ? Math.round((covered / sch.weeks.length) * 100) : 0;
                return `<tr class="cursor-pointer hover:bg-slate-50" onclick="openSchemeEditor('${sch.id}')">
                  <td><strong class="text-sm">${cls ? cls.name : '—'}</strong></td>
                  <td>${sub ? sub.name : '—'}</td>
                  <td><span class="badge ${sch.source === 'NERDC' ? 'badge-success' : sch.source === 'WAEC' ? 'badge-info' : 'badge-neutral'}">${sch.source}</span></td>
                  <td>${sch.weeks.length}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="progress" style="width: 100px"><div class="progress-bar" style="width: ${pct}%"></div></div>
                      <span class="text-sm font-semibold">${covered}/${sch.weeks.length}</span>
                    </div>
                  </td>
                  <td>${pct === 100 ? '<span class="badge badge-success">Complete</span>' : pct >= 50 ? '<span class="badge badge-info">In progress</span>' : '<span class="badge badge-warn">Behind</span>'}</td>
                  <td><button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); openSchemeEditor('${sch.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`}
    </div>
  `;
}

function renderCurriculumByClass(classes, subjects, allSchemes, currentTerm) {
  return `
    <div class="space-y-4">
      ${classes.map(c => {
        const classSchemes = allSchemes.filter(s => s.classId === c.id && s.term === currentTerm);
        return `<div class="card overflow-hidden">
          <div class="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900">${c.name} <span class="text-sm font-normal text-slate-500">· ${c.level}</span></h3>
              <p class="text-xs text-slate-500 mt-0.5">${classSchemes.length} subject scheme${classSchemes.length !== 1 ? 's' : ''} for this term</p>
            </div>
            <button class="btn btn-secondary text-xs" onclick="newSchemeModal('${c.id}')">${icon('plus','w-3.5 h-3.5')} Add Subject Scheme</button>
          </div>
          ${classSchemes.length === 0
            ? '<p class="text-sm text-slate-500 p-5 text-center">No schemes of work for this class yet.</p>'
            : `<div class="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                ${classSchemes.map(sch => {
                  const sub = DB.find('subjects', sch.subjectId);
                  const covered = sch.weeks.filter(w => w.covered).length;
                  const pct = sch.weeks.length ? Math.round((covered / sch.weeks.length) * 100) : 0;
                  return `<button class="p-3 bg-slate-50 hover:bg-brand-50 rounded-xl text-left" onclick="openSchemeEditor('${sch.id}')">
                    <div class="font-semibold text-sm">${sub ? sub.name : '—'}</div>
                    <div class="text-xs text-slate-500 mt-0.5">${sch.source} · ${sch.weeks.length} weeks</div>
                    <div class="progress mt-2"><div class="progress-bar" style="width: ${pct}%"></div></div>
                    <div class="text-xs text-slate-600 mt-1">${covered} of ${sch.weeks.length} covered (${pct}%)</div>
                  </button>`;
                }).join('')}
              </div>`}
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderCurriculumBySubject(classes, subjects, allSchemes, currentTerm) {
  return `
    <div class="space-y-4">
      ${subjects.map(sub => {
        const subSchemes = allSchemes.filter(s => s.subjectId === sub.id && s.term === currentTerm);
        if (!subSchemes.length) return '';
        return `<div class="card overflow-hidden">
          <div class="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 class="font-bold text-slate-900">${sub.name} <span class="text-sm font-normal text-slate-500">· ${subSchemes.length} class${subSchemes.length !== 1 ? 'es' : ''}</span></h3>
          </div>
          <div class="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            ${subSchemes.map(sch => {
              const cls = DB.find('classes', sch.classId);
              const covered = sch.weeks.filter(w => w.covered).length;
              const pct = sch.weeks.length ? Math.round((covered / sch.weeks.length) * 100) : 0;
              return `<button class="p-3 bg-slate-50 hover:bg-brand-50 rounded-xl text-left" onclick="openSchemeEditor('${sch.id}')">
                <div class="font-semibold text-sm">${cls ? cls.name : '—'}</div>
                <div class="text-xs text-slate-500 mt-0.5">${sch.source} · ${sch.weeks.length} weeks</div>
                <div class="progress mt-2"><div class="progress-bar" style="width: ${pct}%"></div></div>
                <div class="text-xs text-slate-600 mt-1">${covered} of ${sch.weeks.length} covered (${pct}%)</div>
              </button>`;
            }).join('')}
          </div>
        </div>`;
      }).filter(Boolean).join('') || '<p class="text-sm text-slate-500 text-center py-8">No schemes of work yet. Create one or import a NERDC template.</p>'}
    </div>
  `;
}

function openSchemeEditor(schemeId) {
  const sch = DB.find('schemesOfWork', schemeId);
  if (!sch) return;
  const cls = DB.find('classes', sch.classId);
  const sub = DB.find('subjects', sch.subjectId);
  const covered = sch.weeks.filter(w => w.covered).length;
  const pct = sch.weeks.length ? Math.round((covered / sch.weeks.length) * 100) : 0;

  modal({
    title: `${sub ? sub.name : ''} · ${cls ? cls.name : ''} · ${sch.term}`,
    size: 'xl',
    body: `
      <div class="space-y-3">
        <!-- Coverage summary -->
        <div class="bg-slate-50 rounded-xl p-3">
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="badge ${sch.source === 'NERDC' ? 'badge-success' : sch.source === 'WAEC' ? 'badge-info' : 'badge-neutral'}">${sch.source}</span>
              <span class="text-xs text-slate-500 ml-2">${sch.weeks.length} weeks planned</span>
            </div>
            <div class="text-sm"><strong>${covered} of ${sch.weeks.length}</strong> covered · <strong class="${pct >= 50 ? 'text-emerald-700' : 'text-amber-700'}">${pct}%</strong></div>
          </div>
          <div class="progress"><div class="progress-bar" style="width: ${pct}%"></div></div>
        </div>

        <!-- Weeks -->
        <div class="space-y-2 max-h-[400px] overflow-y-auto scroll-area">
          ${sch.weeks.map((w, idx) => `
            <div class="border ${w.covered ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'} rounded-xl p-3">
              <div class="flex items-start gap-3">
                <label class="flex-shrink-0 mt-0.5 cursor-pointer">
                  <input type="checkbox" class="w-5 h-5 accent-emerald-600" ${w.covered ? 'checked' : ''} onchange="toggleWeekCovered('${schemeId}', ${idx}, this.checked)" />
                </label>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">Week ${w.week}</span>
                    <h4 class="font-bold text-sm">${w.topic}</h4>
                    ${w.covered ? '<span class="badge badge-success">Covered</span>' : ''}
                  </div>
                  ${w.subtopics && w.subtopics.length ? `<div class="text-xs text-slate-600 mb-1"><strong>Subtopics:</strong> ${w.subtopics.join(' · ')}</div>` : ''}
                  ${w.objectives ? `<div class="text-xs text-slate-600 mb-1"><strong>Objective:</strong> ${w.objectives}</div>` : ''}
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 text-xs">
                    <div><strong class="text-slate-500">Duration:</strong> ${w.duration || '3 periods'}</div>
                    <div><strong class="text-slate-500">Methods:</strong> ${w.methods || '—'}</div>
                    <div class="col-span-2"><strong class="text-slate-500">Resources:</strong> ${w.resources || '—'}</div>
                  </div>
                </div>
                <button class="btn btn-ghost !p-1.5" onclick="editSchemeWeek('${schemeId}', ${idx})" title="Edit">${icon('edit','w-3.5 h-3.5')}</button>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-secondary w-full text-sm" onclick="addSchemeWeek('${schemeId}')">${icon('plus','w-3.5 h-3.5')} Add Week</button>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
             <button class="btn btn-danger" onclick="deleteScheme('${schemeId}')">${icon('trash','w-4 h-4')} Delete</button>
             <button class="btn btn-primary" onclick="exportSchemePDF('${schemeId}')">${icon('download','w-4 h-4')} Export PDF</button>`
  });
}

function toggleWeekCovered(schemeId, weekIdx, covered) {
  const sch = DB.find('schemesOfWork', schemeId);
  sch.weeks[weekIdx].covered = covered;
  sch.weeks[weekIdx].coveredAt = covered ? now() : null;
  sch.weeks[weekIdx].coveredBy = covered ? AUTH.current.id : null;
  DB.update('schemesOfWork', schemeId, { weeks: sch.weeks });
  const total = sch.weeks.length;
  const done = sch.weeks.filter(w => w.covered).length;
  toast(`Week ${sch.weeks[weekIdx].week} ${covered ? 'marked covered' : 'unmarked'} · ${done}/${total} (${Math.round(done/total*100)}%)`);
  openSchemeEditor(schemeId);
}

function editSchemeWeek(schemeId, weekIdx) {
  const sch = DB.find('schemesOfWork', schemeId);
  const w = sch.weeks[weekIdx];
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: `Edit Week ${w.week}`,
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Topic</label><input id="wk_topic" class="input" value="${w.topic}" /></div>
        <div><label class="input-label">Sub-topics (comma-separated)</label><input id="wk_sub" class="input" value="${(w.subtopics || []).join(', ')}" /></div>
        <div><label class="input-label">Learning Objective</label><textarea id="wk_obj" rows="2" class="input">${w.objectives || ''}</textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Duration</label><input id="wk_dur" class="input" value="${w.duration || '3 periods'}" /></div>
          <div><label class="input-label">Methods</label><input id="wk_meth" class="input" value="${w.methods || ''}" /></div>
        </div>
        <div><label class="input-label">Resources</label><input id="wk_res" class="input" value="${w.resources || ''}" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); openSchemeEditor('${schemeId}')">Cancel</button>
             <button class="btn btn-primary" onclick="saveSchemeWeek('${schemeId}', ${weekIdx})">Save Week</button>`
  }), 50);
}

function saveSchemeWeek(schemeId, weekIdx) {
  const sch = DB.find('schemesOfWork', schemeId);
  sch.weeks[weekIdx] = Object.assign({}, sch.weeks[weekIdx], {
    topic: document.getElementById('wk_topic').value.trim(),
    subtopics: document.getElementById('wk_sub').value.split(',').map(s => s.trim()).filter(Boolean),
    objectives: document.getElementById('wk_obj').value.trim(),
    duration: document.getElementById('wk_dur').value.trim(),
    methods: document.getElementById('wk_meth').value.trim(),
    resources: document.getElementById('wk_res').value.trim()
  });
  DB.update('schemesOfWork', schemeId, { weeks: sch.weeks });
  toast('Week updated');
  document.getElementById('modalBackdrop').click();
  setTimeout(() => openSchemeEditor(schemeId), 50);
}

function addSchemeWeek(schemeId) {
  const sch = DB.find('schemesOfWork', schemeId);
  const newWeek = {
    week: sch.weeks.length + 1,
    topic: 'New Topic',
    subtopics: [], objectives: '', methods: '', resources: '', duration: '3 periods',
    covered: false, coveredAt: null, coveredBy: null
  };
  sch.weeks.push(newWeek);
  DB.update('schemesOfWork', schemeId, { weeks: sch.weeks });
  document.getElementById('modalBackdrop').click();
  setTimeout(() => editSchemeWeek(schemeId, sch.weeks.length - 1), 50);
}

function deleteScheme(schemeId) {
  const sch = DB.find('schemesOfWork', schemeId);
  const sub = DB.find('subjects', sch.subjectId);
  const cls = DB.find('classes', sch.classId);
  confirm(`Delete the scheme of work for ${sub ? sub.name : ''} in ${cls ? cls.name : ''}? Coverage history will be lost.`, () => {
    DB.remove('schemesOfWork', schemeId);
    document.getElementById('modalBackdrop').click();
    APP.render();
    toast('Scheme deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

function newSchemeModal(prefilledClassId) {
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const terms = DB.query('academicTerms', t => t.schoolId === currentSchoolId());
  modal({
    title: 'New Scheme of Work',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          A scheme of work breaks a subject's term plan into weekly topics. You can build from scratch here, or use <strong>Import NERDC Template</strong> for pre-built schemes.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="nsch_class" class="input">${classes.map(c => `<option value="${c.id}" ${prefilledClassId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="nsch_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Term</label>
            <select id="nsch_term" class="input">${terms.map(t => `<option ${t.current ? 'selected' : ''}>${t.name} 2025/26</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Source</label>
            <select id="nsch_source" class="input"><option>NERDC</option><option>UBEC</option><option>WAEC</option><option>NECO</option><option>custom</option></select>
          </div>
        </div>
        <div><label class="input-label">Number of weeks</label><input id="nsch_weeks" type="number" class="input" value="12" min="4" max="16" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="createNewScheme()">${icon('plus','w-4 h-4')} Create Scheme</button>`
  });
}

function createNewScheme() {
  const classId = document.getElementById('nsch_class').value;
  const subjectId = document.getElementById('nsch_subject').value;
  const term = document.getElementById('nsch_term').value;
  const source = document.getElementById('nsch_source').value;
  const weekCount = parseInt(document.getElementById('nsch_weeks').value) || 12;
  // Check duplicate
  const existing = DB.query('schemesOfWork', s => s.classId === classId && s.subjectId === subjectId && s.term === term)[0];
  if (existing) { toast('A scheme for this subject/class/term already exists', 'warn'); return; }
  const weeks = [];
  for (let i = 1; i <= weekCount; i++) {
    weeks.push({ week: i, topic: i === weekCount ? 'Term Examination' : i === weekCount - 1 ? 'Revision' : `Week ${i} Topic`, subtopics: [], objectives: '', methods: 'Lecture, examples, group work', resources: 'Approved textbook', duration: '3 periods', covered: false });
  }
  DB.insert('schemesOfWork', {
    id: uid('sch'), schoolId: currentSchoolId(),
    classId, subjectId, term, source,
    sessionId: 'sess_2025_26',
    status: 'draft', weeks,
    createdAt: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Scheme of work created · open it to edit weeks');
}

function importNERDCTemplateModal() {
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  modal({
    title: 'Import NERDC / UBEC Template',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          CASPAA ships with pre-built scheme templates aligned to the <strong>NERDC</strong> (junior secondary) and <strong>UBEC</strong> (primary) national curricula. Pick a class and subject to import the standard 12-week plan.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="nrd_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="nrd_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
          The template will be imported as a draft. You can edit/remove/add weeks before publishing. Coverage will start at 0%.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="importNERDCTemplate()">${icon('download','w-4 h-4')} Import Template</button>`
  });
}

function importNERDCTemplate() {
  const classId = document.getElementById('nrd_class').value;
  const subjectId = document.getElementById('nrd_subject').value;
  const cls = DB.find('classes', classId);
  const sub = DB.find('subjects', subjectId);
  const term = '1st Term 2025/26';
  const existing = DB.query('schemesOfWork', s => s.classId === classId && s.subjectId === subjectId && s.term === term)[0];
  if (existing) { toast('A scheme for this subject/class/term already exists', 'warn'); return; }
  // Generic 12-week NERDC-style template
  const isPrimary = cls.level === 'Primary' || cls.level === 'Nursery';
  const source = isPrimary ? 'UBEC' : 'NERDC';
  const weeks = [
    { week: 1, topic: `Introduction to ${sub.name}`, subtopics: ['Welcome', 'Course overview'], objectives: `Introduce ${sub.name} for the term.`, duration: '2 periods', covered: false },
    { week: 2, topic: 'Foundational concepts', subtopics: [], objectives: 'Cover prerequisites.', duration: '3 periods', covered: false },
    { week: 3, topic: 'Core unit 1', subtopics: [], objectives: 'Master core concepts.', duration: '3 periods', covered: false },
    { week: 4, topic: 'Core unit 2', subtopics: [], objectives: 'Build on unit 1.', duration: '3 periods', covered: false },
    { week: 5, topic: 'Core unit 3 + Mid-term CA', subtopics: [], objectives: 'Continuous assessment 1.', duration: '3 periods', covered: false },
    { week: 6, topic: 'Application & practice', subtopics: [], objectives: 'Apply concepts to problems.', duration: '3 periods', covered: false },
    { week: 7, topic: 'Advanced concepts', subtopics: [], objectives: 'Extend learning.', duration: '3 periods', covered: false },
    { week: 8, topic: 'Project / Practical', subtopics: [], objectives: 'Hands-on practice.', duration: '3 periods', covered: false },
    { week: 9, topic: 'Integration & review', subtopics: [], objectives: 'Connect concepts.', duration: '3 periods', covered: false },
    { week: 10, topic: 'Continuous Assessment 2', subtopics: [], objectives: 'Second CA.', duration: '3 periods', covered: false },
    { week: 11, topic: 'Revision', subtopics: ['Past questions', 'Q&A'], objectives: 'Prepare for exam.', duration: '3 periods', covered: false },
    { week: 12, topic: 'Term Examination', subtopics: ['Written exam'], objectives: 'End of term assessment.', duration: '2 hours', covered: false }
  ];
  weeks.forEach(w => { w.methods = 'Lecture, examples, group work'; w.resources = `${sub.name} textbook`; });
  DB.insert('schemesOfWork', {
    id: uid('sch'), schoolId: currentSchoolId(),
    classId, subjectId, term, source,
    sessionId: 'sess_2025_26',
    status: 'draft', weeks,
    createdAt: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${source} template imported for ${sub.name} (${cls.name}) · 12 weeks ready to customise`, 'success');
}

function exportSchemePDF(schemeId) {
  const sch = DB.find('schemesOfWork', schemeId);
  const cls = DB.find('classes', sch.classId);
  const sub = DB.find('subjects', sch.subjectId);
  const html = `
    <div style="max-width:800px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <h2 style="margin:14px 0 4px;font-size:20px">SCHEME OF WORK</h2>
        <p style="margin:4px 0">${sub.name} · ${cls.name} · ${sch.term}</p>
        <p style="margin:4px 0;color:#666;font-size:13px">${sch.source} aligned</p>
      </div>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-size:12px">
        <thead style="background:#f3f4f6">
          <tr><th align="left">Week</th><th align="left">Topic</th><th align="left">Subtopics</th><th align="left">Objectives</th><th>Duration</th><th>Done</th></tr>
        </thead>
        <tbody>
          ${sch.weeks.map(w => `<tr>
            <td align="center"><strong>${w.week}</strong></td>
            <td><strong>${w.topic}</strong></td>
            <td>${(w.subtopics || []).join('; ')}</td>
            <td>${w.objectives}</td>
            <td>${w.duration}</td>
            <td align="center">${w.covered ? '✓' : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Generated by CASPAA · ${fdate(now(), { long: true })}</p>
    </div>
  `;
  printElement(html);
}

function view_adm_finance_hub() {
  return buildHub('Finance', 'Fees, invoices, expenses, payroll, reports', [
    { key: 'fees',     label: 'Fee Structure', view: 'view_fin_fees' },
    { key: 'invoices', label: 'Invoices',      view: 'view_fin_invoices' },
    { key: 'payments', label: 'Payments',      view: 'view_fin_payments' },
    { key: 'expenses', label: 'Expenses',      view: 'view_fin_expenses' },
    { key: 'payroll',  label: 'Payroll',       view: 'view_fin_payroll' },
    { key: 'reports',  label: 'Reports',       view: 'view_fin_reports' }
  ], 'fees', 'financeTab');
}

function view_adm_operations() {
  return buildHub('Operations', 'Welfare, library, gate, inventory', [
    { key: 'sickbay',   label: 'Sick Bay',     view: 'view_adm_sickbay' },
    { key: 'visitors',  label: 'Visitor Log',  view: 'view_adm_visitors' },
    { key: 'library',   label: 'Library',      view: 'view_adm_library' },
    { key: 'inventory', label: 'Inventory',    view: 'view_adm_inventory' }
  ], 'sickbay', 'opsTab');
}

function view_adm_comms() {
  return buildHub('Communications', 'Messages, announcements and digital consent', [
    { key: 'messages',      label: 'Messages',      view: 'view_adm_messages' },
    { key: 'bulk_notify',   label: 'Announcements', view: 'view_adm_bulk_notify' },
    { key: 'consent',       label: 'Digital Consent', view: 'view_adm_consent', badge: () => { const sid = currentSchoolId(); const forms = DB.query('consentForms', f => f.schoolId === sid).length; return forms || null; } }
  ], 'messages', 'commsTab');
}

/* ---------- Digital Consent (admin) ---------- */
function view_adm_consent() {
  const sid = currentSchoolId();
  const forms = DB.query('consentForms', f => f.schoolId === sid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    ${pageHeader({ title: 'Digital Consent', subtitle: 'Create consent forms and track parental approvals', actions: `<button class="btn btn-primary" onclick="createConsentModal()">${icon('plus','w-4 h-4')} New Consent Form</button>` })}
    ${forms.length === 0 ? emptyState({ title: 'No consent forms yet', body: 'Create excursion, media, PTA or policy consent forms for parents to approve digitally.', icon: 'check' }) : `
      <div class="space-y-3">
        ${forms.map(f => {
          const responses = DB.query('consentResponses', r => r.formId === f.id);
          const agreed = responses.filter(r => r.agreed).length;
          const declined = responses.filter(r => !r.agreed).length;
          const audience = f.classId === 'all' ? COMPUTE.studentsByClass : null;
          const targetCount = f.classId === 'all'
            ? DB.query('students', s => s.schoolId === sid && s.status === 'active').length
            : COMPUTE.studentsByClass(f.classId).length;
          const cls = f.classId === 'all' ? 'All classes' : (DB.find('classes', f.classId) ? DB.find('classes', f.classId).name : '');
          const typeBadge = { excursion: 'badge-info', media: 'badge-warn', pta: 'badge-neutral', policy: 'badge-success' }[f.type] || 'badge-neutral';
          return `<div class="card p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge ${typeBadge}">${f.type}</span>
                  <span class="badge badge-neutral">${cls}</span>
                </div>
                <h3 class="font-bold text-slate-900">${f.title}</h3>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">${f.description}</p>
                <div class="text-xs text-slate-400 mt-2">Due ${fdate(f.dueDate, { short: true })}</div>
              </div>
              <button class="btn btn-secondary text-sm flex-shrink-0" onclick="viewConsentResponses('${f.id}')">${icon('reports','w-4 h-4')} Responses</button>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3 text-center">
              <div class="bg-emerald-50 rounded-lg py-2"><div class="font-bold text-emerald-700">${agreed}</div><div class="text-xs text-emerald-600">Agreed</div></div>
              <div class="bg-rose-50 rounded-lg py-2"><div class="font-bold text-rose-700">${declined}</div><div class="text-xs text-rose-600">Declined</div></div>
              <div class="bg-slate-50 rounded-lg py-2"><div class="font-bold text-slate-700">${Math.max(0, targetCount - responses.length)}</div><div class="text-xs text-slate-500">Awaiting</div></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function createConsentModal() {
  const classes = DB.get('classes');
  modal({
    title: 'New Consent Form',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Title</label><input id="cf_title" class="input" placeholder="e.g. JSS1 Excursion to Lekki Conservation Centre" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Type</label>
            <select id="cf_type" class="input">
              <option value="excursion">Excursion / Field trip</option>
              <option value="media">Media / Photo permission</option>
              <option value="pta">PTA approval</option>
              <option value="policy">Policy acceptance</option>
            </select>
          </div>
          <div><label class="input-label">Audience</label>
            <select id="cf_class" class="input">
              <option value="all">All classes</option>
              ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div><label class="input-label">Details / Terms</label><textarea id="cf_desc" rows="4" class="input" placeholder="Explain what parents are approving…"></textarea></div>
        <div><label class="input-label">Response deadline</label><input id="cf_due" type="date" class="input" value="${daysAhead(7)}" /></div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">${icon('info','w-4 h-4 inline mr-1')} Parents will be notified instantly and can approve with a one-tap e-signature. Every response is timestamped for your records.</div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveConsentForm()">${icon('send','w-4 h-4')} Create & Notify Parents</button>`
  });
}

function saveConsentForm() {
  const sid = currentSchoolId();
  const title = document.getElementById('cf_title').value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }
  const classId = document.getElementById('cf_class').value;
  const form = {
    id: uid('cf'), schoolId: sid, title, type: document.getElementById('cf_type').value,
    classId, description: document.getElementById('cf_desc').value.trim(),
    dueDate: document.getElementById('cf_due').value, createdAt: now(), createdBy: AUTH.current.id
  };
  DB.insert('consentForms', form);
  // Notify the relevant parents
  const students = classId === 'all'
    ? DB.query('students', s => s.schoolId === sid && s.status === 'active')
    : COMPUTE.studentsByClass(classId);
  const parents = [...new Set(students.map(s => s.parentId))];
  parents.forEach(pid => {
    DB.insert('notifications', { id: uid('not'), userId: pid, title: 'Consent Required', body: `${title} — please review and respond.`, type: 'warn', read: false, timestamp: now(), link: { view: 'par_consent' } });
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Consent form created · ${parents.length} parents notified`, 'success');
}

function viewConsentResponses(formId) {
  const form = DB.find('consentForms', formId);
  const responses = DB.query('consentResponses', r => r.formId === formId);
  const respMap = {}; responses.forEach(r => respMap[r.studentId] = r);
  const sid = currentSchoolId();
  const students = form.classId === 'all'
    ? DB.query('students', s => s.schoolId === sid && s.status === 'active')
    : COMPUTE.studentsByClass(form.classId);
  modal({
    title: form.title + ' — Responses',
    size: 'lg',
    body: `
      <div class="space-y-2">
        ${students.map(s => {
          const r = respMap[s.id];
          return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
            ${avatar(s.name, 'sm')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${s.name}</div>
              <div class="text-xs text-slate-500">${r ? `Signed by ${r.signature} · ${fdate(r.timestamp, { time: true })}` : 'No response yet'}</div>
            </div>
            ${r ? (r.agreed ? `<span class="badge badge-success">Agreed</span>` : `<span class="badge badge-danger">Declined</span>`) : `<span class="badge badge-neutral">Awaiting</span>`}
          </div>`;
        }).join('')}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

/* ---------- Dashboard ---------- */
function view_adm_dashboard() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId);
  const teachers = DB.query('teachers', t => t.schoolId === schoolId);
  const invoices = DB.query('invoices', i => i.schoolId === schoolId);
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const collectionRate = invoices.length ? Math.round((collected / (collected + outstanding)) * 100) : 0;
  // Date selector — proprietor can review a previous day's analytics
  const dashDate = APP.params.dashDate || today();
  const isToday = dashDate === today();
  const attToday = DB.query('attendance', a => a.schoolId === schoolId && a.date === dashDate);
  const presentToday = attToday.filter(a => a.status !== 'absent').length;
  const attRate = students.length ? Math.round((presentToday / students.length) * 100) : 0;
  // Gender split — helps the school plan supplies at a glance
  const maleCount = students.filter(s => /^m/i.test(s.gender || '')).length;
  const femaleCount = students.filter(s => /^f/i.test(s.gender || '')).length;
  // New insights
  const recentPayments = DB.query('transactions', t => t.schoolId === schoolId && t.status === 'successful').sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);
  const pendingLoans = DB.query('loans', l => l.schoolId === schoolId && l.status === 'pending').length;
  const activeLoans = DB.query('loans', l => l.schoolId === schoolId && l.status === 'active').length;
  const school = DB.find('schools', schoolId) || {};
  const renewalDays = school.nextRenewal ? Math.ceil((new Date(school.nextRenewal) - new Date()) / 86400000) : null;
  // Avg performance
  const allResults = DB.query('results', r => r.schoolId === schoolId);
  const avgScore = allResults.length ? Math.round(allResults.reduce((s, r) => s + r.total, 0) / allResults.length) : 0;

  const revenueView = APP.params.revenueView || 'termly';

  // Schedule chart render after DOM
  window.afterRender = () => {
    const ctx = document.getElementById('revenueChart');
    if (ctx) {
      let labels, data;
      if (revenueView === 'monthly') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data = [0, 0, 4200000, 4600000, 3800000, 0, 0, 4100000, 4400000, 3900000, 4800000, collected || 4500000];
      } else if (revenueView === 'annually') {
        labels = ['2021/22', '2022/23', '2023/24', '2024/25'];
        data = [28000000, 32000000, 38000000, (collected || 12200000) * 3];
      } else {
        // termly (default)
        labels = ['1st Term 24/25', '2nd Term 24/25', '3rd Term 24/25', DB.settings().currentTerm];
        data = [10800000, 12400000, 11600000, collected || 12200000];
      }
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Collected (₦)',
            data,
            backgroundColor: '#047857', borderRadius: 6, maxBarThickness: 60
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { ticks: { callback: v => '₦' + (v/1000000).toFixed(1) + 'M' } } }
        }
      });
    }
    const gctx = document.getElementById('genderChart');
    if (gctx) {
      new Chart(gctx, {
        type: 'doughnut',
        data: {
          labels: ['Boys', 'Girls'],
          datasets: [{
            data: [maleCount, femaleCount],
            backgroundColor: ['#2563eb', '#db2777'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed/(maleCount+femaleCount||1)*100)}%)` } }
          }
        }
      });
    }
  };

  return `
    <div class="space-y-5">
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-brand-200 text-sm">Welcome back,</p>
            <h1 class="text-2xl lg:text-3xl font-extrabold">${AUTH.current.name.split(' ').slice(-1)}</h1>
            <p class="text-brand-100 text-sm mt-1">Bright Lights Academy · ${DB.settings().currentTerm}</p>
          </div>
          <div class="text-right">
            <p class="text-brand-200 text-xs uppercase tracking-wide font-semibold mb-1">${isToday ? 'Today' : 'Viewing'}</p>
            <input type="date" value="${dashDate}" max="${today()}"
              onchange="APP.params.dashDate = this.value; APP.render()"
              class="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-sm text-white font-semibold [color-scheme:dark]" />
            ${!isToday ? `<button class="block ml-auto mt-1 text-xs text-brand-200 underline" onclick="APP.params.dashDate=null; APP.render()">Back to today</button>` : ''}
          </div>
        </div>
      </div>

      <!-- Top row: 4 most operational metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${(() => {
          const owingCount = invoices.filter(i => i.balance > 0).length;
          return statCard({
            label: 'Outstanding Fees',
            value: money(outstanding),
            icon: 'fees', color: 'rose',
            trend: owingCount ? { direction: 'down', label: `${owingCount} student${owingCount === 1 ? '' : 's'} owing` } : { direction: 'up', label: 'All settled' },
            tooltip: 'Total amount across all unpaid + part-paid invoices. We count a student as "owing" when their invoice has a balance.'
          });
        })()}
        ${(() => {
          const paidCount = invoices.filter(i => i.status === 'paid').length;
          const partialCount = invoices.filter(i => i.status === 'partial').length;
          return statCard({
            label: 'Payment Received',
            value: money(collected),
            icon: 'trending_up', color: 'brand',
            trend: { direction: 'up', label: `${paidCount} paid in full · ${partialCount} part-paid` },
            tooltip: 'Sum of all amounts received this term. The count shows how many students have settled in full, versus partial payments.'
          });
        })()}
        ${statCard({
          label: 'Loan Requests',
          value: pendingLoans,
          icon: 'loan',
          color: pendingLoans ? 'gold' : 'brand',
          trend: pendingLoans ? { direction: 'up', label: 'awaiting review' } : null,
          tooltip: 'Parents applying for school-fee financing. CASPAA underwrites these.'
        })}
        ${statCard({
          label: 'Fee Collection Rate',
          value: collectionRate + '%',
          icon: 'check', color: collectionRate >= 80 ? 'brand' : collectionRate >= 60 ? 'gold' : 'rose',
          trend: { direction: collectionRate >= 80 ? 'up' : 'down', label: `${money(collected)} of ${money(collected + outstanding)} billed` },
          tooltip: 'Percentage of total billed fees that have been paid this term. (Paid ÷ Total Billed × 100). Higher = better cash position.'
        })}
      </div>

      <!-- Second row: school health + subscription -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({
          label: 'Students',
          value: students.length,
          icon: 'students', color: 'brand',
          tooltip: 'Active student enrolment. Withdrawn, transferred, suspended and alumni are excluded.'
        })}
        ${statCard({
          label: 'Staff',
          value: teachers.length,
          icon: 'teacher', color: 'blue',
          tooltip: 'All staff on payroll (academic + non-academic). View breakdown in Staff & HR.'
        })}
        ${(() => {
          const attMarkedToday = attToday.length > 0;
          return statCard({
            label: isToday ? 'Attendance Today' : `Attendance · ${fdate(dashDate, { short: true })}`,
            value: attMarkedToday ? attRate + '%' : '— not marked',
            icon: 'attendance', color: attMarkedToday ? 'gold' : 'rose',
            trend: attMarkedToday ? { direction: attRate >= 85 ? 'up' : 'down', label: `${presentToday} of ${students.length} present` } : { direction: 'down', label: isToday ? 'Teachers haven\'t marked yet' : 'No attendance recorded' },
            tooltip: 'Percentage of students marked present on the selected date. Use the date picker at the top to review a previous day. Form teachers mark daily attendance from their dashboard or HR can mark from the gate sign-in book.'
          });
        })()}
        ${(() => {
          if (!school.subscriptionPlan) return statCard({ label: 'Subscription', value: '—', icon: 'settings', color: 'purple' });
          const urgent = renewalDays !== null && renewalDays <= 7;
          return statCard({
            label: 'Subscription',
            value: school.subscriptionPlan,
            icon: 'settings',
            color: urgent ? 'rose' : 'purple',
            trend: renewalDays !== null ? { direction: urgent ? 'down' : 'up', label: renewalDays <= 0 ? 'EXPIRED' : `Renews in ${renewalDays}d` } : null,
            tooltip: 'Your current CASPAA plan. Renewal auto-fires if Auto-renew is on (Settings).'
          });
        })()}
      </div>

      <!-- Gender split — supplies planning, moved up for quick visibility -->
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5 flex flex-col justify-center">
          <h3 class="font-bold text-slate-900 mb-1">Enrolment by Gender</h3>
          <p class="text-xs text-slate-500 mb-3">Helps plan uniforms, facilities and supplies.</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="rounded-xl bg-blue-50 p-4 text-center">
              <div class="text-3xl font-extrabold text-blue-900">${maleCount}</div>
              <div class="text-xs uppercase tracking-wide text-blue-700 font-semibold mt-1">Boys</div>
              <div class="text-xs text-blue-600">${students.length ? Math.round(maleCount / students.length * 100) : 0}%</div>
            </div>
            <div class="rounded-xl bg-pink-50 p-4 text-center">
              <div class="text-3xl font-extrabold text-pink-900">${femaleCount}</div>
              <div class="text-xs uppercase tracking-wide text-pink-700 font-semibold mt-1">Girls</div>
              <div class="text-xs text-pink-600">${students.length ? Math.round(femaleCount / students.length * 100) : 0}%</div>
            </div>
          </div>
          <div class="h-3 rounded-full overflow-hidden bg-pink-200">
            <div class="h-full rounded-full bg-blue-500 transition-all" style="width: ${students.length ? Math.round(maleCount / students.length * 100) : 50}%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-1"><span>Boys</span><span>Girls</span></div>
        </div>
        <div class="card p-5 lg:col-span-2 flex flex-col justify-center items-center">
          <div style="height: 200px; width: 200px;"><canvas id="genderChart"></canvas></div>
        </div>
      </div>

      <!-- Revenue chart + Notifications -->
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h3 class="font-bold text-slate-900">Revenue · <span class="text-brand-700 font-extrabold">${revenueView === 'monthly' ? 'Monthly' : revenueView === 'annually' ? 'Annual' : 'Per Term'}</span></h3>
            <div class="flex items-center gap-2">
              <div class="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                <button class="px-2.5 py-1.5 ${revenueView==='monthly'?'bg-brand-600 text-white font-semibold':'bg-white hover:bg-slate-50 text-slate-700'}" onclick="APP.params.revenueView='monthly'; APP.render()">Monthly</button>
                <button class="px-2.5 py-1.5 border-l border-r border-slate-200 ${revenueView==='termly'?'bg-brand-600 text-white font-semibold':'bg-white hover:bg-slate-50 text-slate-700'}" onclick="APP.params.revenueView='termly'; APP.render()">Termly</button>
                <button class="px-2.5 py-1.5 ${revenueView==='annually'?'bg-brand-600 text-white font-semibold':'bg-white hover:bg-slate-50 text-slate-700'}" onclick="APP.params.revenueView='annually'; APP.render()">Annually</button>
              </div>
              <button class="btn btn-ghost text-sm hidden sm:inline-flex" onclick="APP.go('adm_finance_hub', { financeTab: 'reports' })">Report →</button>
            </div>
          </div>
          <div style="height: 220px;"><canvas id="revenueChart"></canvas></div>
        </div>

        <!-- Notifications + quick actions -->
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-500">School Notifications</h3>
          <div class="space-y-1.5 mb-4">
            ${(() => {
              const items = [];
              if (renewalDays !== null && renewalDays <= 30) items.push({ icon: 'bell', tone: renewalDays <= 7 ? 'rose' : 'amber', text: `Subscription renews in ${renewalDays}d`, go: "APP.go('adm_settings')" });
              if (pendingLoans > 0) items.push({ icon: 'loan', tone: 'amber', text: `${pendingLoans} loan request${pendingLoans !== 1 ? 's' : ''} awaiting decision`, go: "APP.go('adm_finance_hub',{financeTab:'invoices'})" });
              const lowStock = DB.query('inventory', i => i.schoolId === schoolId && i.quantity < i.minStock).length;
              if (lowStock) items.push({ icon: 'package', tone: 'amber', text: `${lowStock} inventory item${lowStock !== 1 ? 's' : ''} low stock`, go: "APP.go('adm_operations',{opsTab:'inventory'})" });
              // Result submission delay alert
              const unapproved = DB.query('results', r => r.schoolId === schoolId && !r.approved).length;
              if (unapproved >= 1) items.push({ icon: 'results', tone: unapproved >= 5 ? 'rose' : 'amber', text: `${unapproved} result entr${unapproved === 1 ? 'y' : 'ies'} pending approval`, go: "APP.go('adm_academic',{academicTab:'results'})" });
              // Pending admissions
              const pendingApps = DB.query('admissionApplications', a => a.schoolId === schoolId && a.status === 'pending').length;
              if (pendingApps) items.push({ icon: 'plus', tone: 'amber', text: `${pendingApps} admission application${pendingApps !== 1 ? 's' : ''} to review`, go: "APP.go('adm_people',{peopleTab:'admissions'})" });
              // Overdue library books
              const overdueBooks = DB.query('libraryLoans', l => l.schoolId === schoolId && !l.returnedAt && new Date(l.dueDate) < new Date()).length;
              if (overdueBooks) items.push({ icon: 'book', tone: 'amber', text: `${overdueBooks} overdue library book${overdueBooks !== 1 ? 's' : ''}`, go: "APP.go('adm_operations',{opsTab:'library'})" });
              if (items.length === 0) items.push({ icon: 'check', tone: 'emerald', text: 'All clear — no urgent items.' });
              // Sort by urgency: rose (critical) → amber (warning) → emerald (ok)
              const toneRank = { rose: 0, amber: 1, emerald: 2 };
              items.sort((a, b) => (toneRank[a.tone] ?? 3) - (toneRank[b.tone] ?? 3));
              const colorMap = { rose: 'bg-rose-50 text-rose-800 hover:bg-rose-100', amber: 'bg-amber-50 text-amber-800 hover:bg-amber-100', emerald: 'bg-emerald-50 text-emerald-800' };
              return items.map(n => n.go
                ? `<button onclick="${n.go}" class="w-full flex items-center gap-2 text-xs p-2 rounded-lg text-left transition ${colorMap[n.tone]}">${icon(n.icon,'w-3.5 h-3.5')}<span class="flex-1">${n.text}</span><span class="opacity-60 font-bold">&rsaquo;</span></button>`
                : `<div class="flex items-center gap-2 text-xs p-2 rounded-lg ${colorMap[n.tone]}">${icon(n.icon,'w-3.5 h-3.5')}<span>${n.text}</span></div>`).join('');
            })()}
          </div>
          <h3 class="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-500">Quick Actions</h3>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-secondary !py-1.5 justify-start text-xs" onclick="APP.go('adm_people', { peopleTab: 'students' }); setTimeout(addStudentModal, 100)">${icon('plus','w-3.5 h-3.5')} Add Student</button>
            <button class="btn btn-secondary !py-1.5 justify-start text-xs" onclick="APP.go('adm_workforce', { workforceTab: 'staff' }); setTimeout(addStaffModal, 100)">${icon('plus','w-3.5 h-3.5')} Add Staff</button>
            <button class="btn btn-secondary !py-1.5 justify-start text-xs" onclick="APP.go('adm_comms', { commsTab: 'announce' }); setTimeout(newAnnouncementModal, 100)">${icon('bell','w-3.5 h-3.5')} Send Notice</button>
            <button class="btn btn-secondary !py-1.5 justify-start text-xs" onclick="APP.go('adm_finance_hub')">${icon('fees','w-3.5 h-3.5')} Fees</button>
          </div>
          <button class="btn btn-gold w-full mt-2 text-xs" onclick="termClosingWizard()">${icon('calendar','w-3.5 h-3.5')} Close Term Wizard</button>
        </div>
      </div>

      <!-- Recent payments (compact, below the fold) -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Recent Payments</h3>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('adm_finance_hub', { financeTab: 'payments' })">View all →</button>
        </div>
        ${recentPayments.length === 0 ? `<p class="text-sm text-slate-500">No recent payments.</p>` : `
          <div class="space-y-1">
            ${recentPayments.map(t => {
              const s = DB.find('students', t.studentId);
              return `<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div class="flex items-center gap-2.5 min-w-0">
                  ${avatar(s ? s.name : '?', 'sm')}
                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate">${s ? s.name : '—'}</div>
                    <div class="text-xs text-slate-500">${t.method.toUpperCase()} · ${fdate(t.timestamp, { relative: true })}</div>
                  </div>
                </div>
                <div class="font-bold font-mono text-emerald-700 whitespace-nowrap">${money(t.amount)}</div>
              </div>`;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

/* ---------- Students ---------- */
function view_adm_students() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId);
  const classes = DB.get('classes');
  const filter = APP.params.classFilter || 'all';
  const search = APP.params.search || '';
  const genderF = APP.params.gender || 'all';
  const payF = APP.params.payment || 'all';
  const attF = APP.params.attendance || 'all';
  const statusF = APP.params.studentStatus || 'all';
  const scholarF = APP.params.scholarship || 'all';

  const filtered = students.filter(s => {
    if (filter !== 'all' && s.classId !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.admissionNo.toLowerCase().includes(q)) return false;
    }
    if (genderF !== 'all' && s.gender !== genderF) return false;
    if (statusF !== 'all' && s.status !== statusF) return false;
    if (payF !== 'all') {
      const inv = COMPUTE.studentInvoice(s.id);
      if (!inv || inv.status !== payF) return false;
    }
    if (attF !== 'all') {
      const rate = COMPUTE.attendanceRate(s.id);
      if (attF === 'good' && rate < 85) return false;
      if (attF === 'concern' && (rate >= 85 || rate === 0)) return false;
    }
    if (scholarF !== 'all') {
      const inv = COMPUTE.studentInvoice(s.id);
      const hasScholarship = inv && (inv.lineItems || []).some(l => l.amount < 0);
      if (scholarF === 'yes' && !hasScholarship) return false;
      if (scholarF === 'no' && hasScholarship) return false;
    }
    return true;
  });

  return `
    ${pageHeader({
      title: 'Students',
      subtitle: (() => { const boys = filtered.filter(s=>/^m/i.test(s.gender||'')).length; const girls = filtered.filter(s=>/^f/i.test(s.gender||'')).length; return `${filtered.length} of ${students.length} students · ${boys} boys · ${girls} girls`; })(),
      actions: `
        <button class="btn btn-secondary" onclick="bulkPromoteModal()">${icon('trending_up','w-4 h-4')} Bulk Promote</button>
        <button class="btn btn-secondary" onclick="exportStudentsCSV()">${icon('download','w-4 h-4')} CSV</button>
        <button class="btn btn-secondary" onclick="bulkUploadModal()">${icon('upload','w-4 h-4')} Bulk Upload</button>
        <button class="btn btn-primary" onclick="addStudentModal()">${icon('plus','w-4 h-4')} Add Student</button>
      `
    })}

    <!-- Gender split strip -->
    ${(() => {
      const boys = filtered.filter(s => /^m/i.test(s.gender||'')).length;
      const girls = filtered.filter(s => /^f/i.test(s.gender||'')).length;
      const total = boys + girls;
      if (!total) return '';
      const boysPct = Math.round(boys / total * 100);
      const girlsPct = 100 - boysPct;
      return `<div class="card p-4 mb-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-slate-900 text-sm">Gender Split</h3>
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><strong class="text-blue-900">${boys}</strong> <span class="text-slate-500">boys (${boysPct}%)</span></span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-pink-500 inline-block"></span><strong class="text-pink-900">${girls}</strong> <span class="text-slate-500">girls (${girlsPct}%)</span></span>
          </div>
        </div>
        <div class="h-3 rounded-full overflow-hidden bg-pink-200 flex">
          <div class="h-full bg-blue-500 transition-all" style="width:${boysPct}%"></div>
        </div>
      </div>`;
    })()}

    <!-- Search bar + quick filter pills -->
    <div class="flex flex-col sm:flex-row gap-3 mb-3">
      <div class="flex-1 relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
        <input type="text" class="input pl-9" placeholder="Search by name or admission no…" value="${search}" oninput="APP.params.search = this.value; APP.render()" />
      </div>
      <select class="input text-sm" onchange="APP.params.gender = this.value; APP.render()">
        <option value="all" ${genderF==='all'?'selected':''}>All genders</option>
        <option value="M" ${genderF==='M'?'selected':''}>Boys only</option>
        <option value="F" ${genderF==='F'?'selected':''}>Girls only</option>
      </select>
      <select class="input text-sm" onchange="APP.params.payment = this.value; APP.render()">
        <option value="all" ${payF==='all'?'selected':''}>All payments</option>
        <option value="paid" ${payF==='paid'?'selected':''}>Paid</option>
        <option value="partial" ${payF==='partial'?'selected':''}>Partial</option>
        <option value="outstanding" ${payF==='outstanding'?'selected':''}>Outstanding</option>
      </select>
      <select class="input text-sm" onchange="APP.params.attendance = this.value; APP.render()">
        <option value="all" ${attF==='all'?'selected':''}>All attendance</option>
        <option value="good" ${attF==='good'?'selected':''}>Good (≥85%)</option>
        <option value="concern" ${attF==='concern'?'selected':''}>Concern (&lt;85%)</option>
      </select>
    </div>
    ${genderF!=='all'||payF!=='all'||attF!=='all'||statusF!=='all'||scholarF!=='all' || filter!=='all' ? `<div class="flex items-center gap-2 flex-wrap mb-3 text-xs">
      <span class="text-slate-500">Active filters:</span>
      ${filter!=='all' ? `<button class="badge badge-info hover:bg-blue-200 cursor-pointer" onclick="APP.params.classFilter='all'; APP.render()">${classes.find(c=>c.id===filter)?.name} ✕</button>` : ''}
      ${genderF!=='all' ? `<button class="badge badge-info hover:bg-blue-200 cursor-pointer" onclick="APP.params.gender='all'; APP.render()">${genderF==='M'?'Boys':'Girls'} ✕</button>` : ''}
      ${payF!=='all' ? `<button class="badge badge-info hover:bg-blue-200 cursor-pointer" onclick="APP.params.payment='all'; APP.render()">${payF} ✕</button>` : ''}
      ${attF!=='all' ? `<button class="badge badge-info hover:bg-blue-200 cursor-pointer" onclick="APP.params.attendance='all'; APP.render()">Attendance: ${attF} ✕</button>` : ''}
      <button class="text-rose-600 font-semibold underline ml-1" onclick="APP.params.classFilter=APP.params.gender=APP.params.payment=APP.params.attendance=APP.params.studentStatus=APP.params.scholarship=APP.params.search='all'; APP.render()">Clear all</button>
    </div>` : ''}

    <div class="card overflow-hidden">
      ${filtered.length === 0 ? emptyState({ title: 'No students found', body: 'Try adjusting your filters or add a new student.', icon: 'students' }) : `
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead><tr>
              <th>Student</th><th>Admission No.</th>
              <th>
                <select class="text-xs font-semibold text-slate-700 bg-transparent border-0 cursor-pointer hover:text-brand-700" onchange="APP.params.classFilter = this.value; APP.render()">
                  <option value="all" ${filter==='all'?'selected':''}>All Classes</option>
                  ${classes.map(c => `<option value="${c.id}" ${filter===c.id?'selected':''}>${c.name}</option>`).join('')}
                </select>
              </th>
              <th>Parent</th><th>Fees</th><th></th>
            </tr></thead>
            <tbody>
              ${filtered.map(s => {
                const cls = classes.find(c => c.id === s.classId);
                const parent = DB.find('parents', s.parentId);
                const inv = COMPUTE.studentInvoice(s.id);
                return `
                  <tr class="cursor-pointer hover:bg-slate-50" onclick="viewStudent('${s.id}')">
                    <td>
                      <div class="flex items-center gap-3">
                        ${avatar(s, 'sm')}
                        <div>
                          <div class="font-semibold text-slate-900">${s.name}</div>
                          <div class="text-xs text-slate-500">${s.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(s.dob)} yrs · ${s.status || 'active'}</div>
                        </div>
                      </div>
                    </td>
                    <td><code class="text-xs bg-slate-100 px-2 py-0.5 rounded">${s.admissionNo}</code></td>
                    <td>${cls ? cls.name : '—'}</td>
                    <td>${parent ? parent.name : '—'}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        ${inv ? statusBadge(inv.status) : '—'}
                        ${(() => { const acts = DB.query('studentActivities', sa => sa.studentId === s.id); return acts.length ? `<span class="badge badge-info" title="Enrolled in ${acts.length} activit${acts.length>1?'ies':'y'}">${acts.length} ${acts.length>1?'activities':'activity'}</span>` : ''; })()}
                      </div>
                    </td>
                    <td class="text-right whitespace-nowrap" onclick="event.stopPropagation()">
                      <button class="btn btn-ghost !p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Promote to next class" onclick="event.stopPropagation(); promoteStudentModal('${s.id}')">${icon('trending_up','w-4 h-4')}</button>
                      <button class="btn btn-ghost !p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg" title="Transfer to another school" onclick="event.stopPropagation(); transferStudentModal('${s.id}')">${icon('arrow_left','w-4 h-4')}</button>
                      <button class="btn btn-ghost !p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg" title="Suspend student" onclick="event.stopPropagation(); changeStudentStatus('${s.id}', 'suspended', '${s.name} suspended')">${icon('bell','w-4 h-4')}</button>
                      <button class="btn btn-ghost !p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Withdraw student" onclick="event.stopPropagation(); withdrawStudentModal('${s.id}')">${icon('logout','w-4 h-4')}</button>
                      <button class="btn btn-ghost !p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit student details" onclick="event.stopPropagation(); editStudent('${s.id}')">${icon('edit','w-4 h-4')}</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function exportStudentsCSV() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId);
  const classes = DB.get('classes');
  const headers = ['Admission No', 'Full Name', 'Class', 'Gender', 'DOB', 'Blood Group', 'Status', 'Parent Name', 'Parent Phone', 'Parent Email', 'Fees Total', 'Fees Paid', 'Fees Balance', 'Fees Status', 'Attendance %'];
  const rows = students.map(s => {
    const cls = classes.find(c => c.id === s.classId);
    const parent = DB.find('parents', s.parentId) || {};
    const inv = COMPUTE.studentInvoice(s.id) || { total: 0, paid: 0, balance: 0, status: '—' };
    const rate = COMPUTE.attendanceRate(s.id);
    return [
      s.admissionNo, s.name, cls ? cls.name : '', s.gender === 'M' ? 'Male' : 'Female', s.dob || '', s.bloodGroup || '',
      s.status || 'active', parent.name || '', parent.phone || '', parent.email || '',
      inv.total, inv.paid, inv.balance, inv.status, rate + '%'
    ];
  });
  const csv = [headers, ...rows].map(r => r.map(v => {
    const str = String(v == null ? '' : v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `caspaa_students_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${students.length} students to CSV`);
}

function calcAge(dob) {
  if (!dob) return '—';
  const d = new Date(dob);
  const a = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(a);
}

function viewStudent(id) {
  const s = DB.find('students', id);
  if (!s) return;
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const inv = COMPUTE.studentInvoice(s.id);
  const attRate = COMPUTE.attendanceRate(s.id);
  const results = COMPUTE.studentResults(s.id);
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  const subjects = DB.get('subjects');

  modal({
    title: 'Student Profile',
    size: 'lg',
    body: `
      <div class="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
        ${avatar(s, 'xl')}
        <div class="flex-1">
          <h2 class="text-xl font-bold text-slate-900">${s.name}</h2>
          <p class="text-sm text-slate-500">${cls ? cls.name : ''} · ${s.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(s.dob)} years old</p>
          <code class="text-xs bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">${s.admissionNo}</code>
        </div>
        <div class="text-right">
          ${inv ? statusBadge(inv.status) : ''}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-brand-50 rounded-xl p-3 text-center">
          <div class="text-xs text-brand-700 font-semibold uppercase">Attendance</div>
          <div class="text-2xl font-bold text-brand-900 mt-1">${attRate}%</div>
        </div>
        <div class="bg-blue-50 rounded-xl p-3 text-center">
          <div class="text-xs text-blue-700 font-semibold uppercase">Academic Avg Score</div>
          <div class="text-2xl font-bold text-blue-900 mt-1">${avg}%</div>
        </div>
        <div class="bg-amber-50 rounded-xl p-3 text-center">
          <div class="text-xs text-amber-700 font-semibold uppercase">Balance</div>
          <div class="text-lg font-bold text-amber-900 mt-1">${inv ? money(inv.balance) : '—'}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm mb-5">
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Date of Birth</div><div>${fdate(s.dob, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Blood Group</div><div>${s.bloodGroup || '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Parent / Guardian</div><div>${parent ? parent.name : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Parent Phone</div><div>${parent ? parent.phone : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Admission Date</div><div>${fdate(s.admissionDate, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Status</div><div>${statusBadge(s.status)}</div></div>
      </div>

      ${(() => {
        const docs = s.documents || {};
        const present = _docTypes.filter(d => docs[d.key]);
        if (!present.length) return '';
        return `<h3 class="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Documents on File</h3>
        <div class="grid grid-cols-2 gap-2 mb-5">
          ${present.map(d => `<a href="${docs[d.key].data}" download="${docs[d.key].name || d.key}" class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm">
            ${icon('paperclip','w-4 h-4 text-brand-600')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">${d.label}</div>
              <div class="text-xs text-slate-500 truncate">${docs[d.key].name || 'view'}</div>
            </div>
            ${icon('download','w-3.5 h-3.5 text-slate-400')}
          </a>`).join('')}
        </div>`;
      })()}

      ${results.length ? `
        <h3 class="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Recent Results</h3>
        <div class="space-y-1.5 mb-5">
          ${results.slice(0,5).map(r => {
            const sub = subjects.find(x => x.id === r.subjectId);
            return `<div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
              <span>${sub ? sub.name : '—'}</span>
              <div class="flex items-center gap-3">
                <span class="font-mono text-slate-600">${r.total}/100</span>
                <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'}">${r.grade}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      ` : ''}

      ${(() => {
        const allActs = DB.query('activities', a => a.schoolId === s.schoolId);
        const enrolled = DB.query('studentActivities', sa => sa.studentId === s.id);
        const enrolledIds = enrolled.map(sa => sa.activityId);
        const actTotal = enrolled.reduce((sum, sa) => { const a = DB.find('activities', sa.activityId); return sum + (a ? a.price : 0); }, 0);
        if (!allActs.length) return '';
        return `
          <div class="border-t border-slate-100 pt-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="font-bold text-slate-900">Extracurricular Activities</h3>
                <p class="text-xs text-slate-500 mt-0.5">Toggle activities below — fees are instantly added to or removed from the student's invoice.</p>
              </div>
              ${actTotal ? `<div class="text-right flex-shrink-0 ml-3"><div class="text-xs text-slate-500">Added to invoice</div><div class="text-lg font-extrabold text-brand-700 font-mono">${money(actTotal)}<span class="text-xs font-normal text-slate-400">/term</span></div></div>` : ''}
            </div>
            <div class="space-y-2">
              ${allActs.map(a => {
                const isEnrolled = enrolledIds.includes(a.id);
                return `<div class="flex items-center gap-3 p-3 rounded-xl border-2 transition ${isEnrolled ? 'border-brand-300 bg-brand-50' : 'border-slate-100 bg-white hover:border-slate-300'}">
                  <span class="text-2xl flex-shrink-0">${a.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm text-slate-900">${a.name}</div>
                    <div class="text-xs text-slate-500">${a.description || ''}</div>
                    <div class="text-xs font-semibold ${isEnrolled ? 'text-brand-700' : 'text-slate-600'} mt-0.5">${money(a.price)} / term${isEnrolled ? ' · <span class="text-emerald-600">On invoice</span>' : ''}</div>
                  </div>
                  <button class="btn ${isEnrolled ? 'btn-danger' : 'btn-secondary'} !py-1.5 !px-3 text-xs flex-shrink-0"
                    onclick="toggleStudentActivity('${s.id}','${a.id}',${isEnrolled})">
                    ${isEnrolled ? `${icon('x','w-3 h-3')} Remove` : `${icon('plus','w-3 h-3')} Enroll`}
                  </button>
                </div>`;
              }).join('')}
            </div>
            ${enrolledIds.length === 0 ? `<p class="text-sm text-slate-400 text-center mt-3 py-2">No activities enrolled — click Enroll on any activity above.</p>` : ''}
          </div>
        `;
      })()}
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      <button class="btn btn-secondary" onclick="studentLifecycleModal('${s.id}')">${icon('settings','w-4 h-4')} Actions</button>
      <button class="btn btn-secondary" onclick="editStudent('${s.id}')">${icon('edit','w-4 h-4')} Edit</button>
      <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); viewAsParent('${s.parentId}')">View as Parent</button>
    `
  });
}

function toggleStudentActivity(studentId, activityId, isCurrentlyEnrolled) {
  const s = DB.find('students', studentId);
  const a = DB.find('activities', activityId);
  if (!s || !a) return;
  if (isCurrentlyEnrolled) {
    // Remove enrollment
    DB.query('studentActivities', sa => sa.studentId === studentId && sa.activityId === activityId)
      .forEach(sa => DB.remove('studentActivities', sa.id));
    // Remove the activity line item from current invoice
    const inv = COMPUTE.studentInvoice(studentId);
    if (inv) {
      const lineItems = inv.lineItems.filter(l => !l.name.includes(a.name));
      const total = lineItems.filter(l => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
      const balance = Math.max(0, total - inv.paid);
      const status = balance === 0 ? 'paid' : inv.paid > 0 ? 'partial' : 'outstanding';
      DB.update('invoices', inv.id, { lineItems, total, balance, status });
    }
    toast(`${a.icon} ${a.name} removed · invoice updated`, 'info');
  } else {
    // Add enrollment
    DB.insert('studentActivities', {
      id: uid('sa'), schoolId: s.schoolId, studentId, activityId,
      enrolledAt: now(), term: DB.settings().currentTerm
    });
    // Add line item to current invoice
    const inv = COMPUTE.studentInvoice(studentId);
    if (inv) {
      const lineItems = [...inv.lineItems, { name: a.icon + ' ' + a.name, amount: a.price }];
      const total = lineItems.filter(l => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
      const balance = Math.max(0, total - inv.paid);
      const status = balance === 0 ? 'paid' : inv.paid > 0 ? 'partial' : 'outstanding';
      DB.update('invoices', inv.id, { lineItems, total, balance, status });
    }
    toast(`${a.icon} ${a.name} enrolled · ${money(a.price)} added to ${s.name.split(' ')[0]}'s invoice`, 'success');
  }
  viewStudent(studentId);
}

// Holds the in-flight photo and documents while the student form is open
let _studentPhotoBuffer = null;
let _studentDocsBuffer = {}; // { birthCert, parentId, passport, immunization }
const _docTypes = [
  { key: 'birthCert',    label: 'Birth Certificate' },
  { key: 'parentId',     label: 'Parent ID (NIN / Driver\'s License)' },
  { key: 'passport',     label: 'Passport Photograph' },
  { key: 'immunization', label: 'Immunization Card' }
];

function addStudentModal(editingId) {
  const classes = DB.get('classes');
  const parents = DB.get('parents');
  const existing = editingId ? DB.find('students', editingId) : null;
  const isEdit = !!existing;
  _studentPhotoBuffer = existing ? (existing.photo || null) : null;
  _studentDocsBuffer = existing ? Object.assign({}, existing.documents || {}) : {};
  const autoAdmNo = 'BL/2024/' + String(DB.get('students').length + 1).padStart(3, '0');

  const bloodGroups = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];

  modal({
    title: isEdit ? 'Edit Student' : 'Add New Student',
    size: 'lg',
    body: `
      <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div id="sf_photoPreview" class="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-2xl">
          ${_studentPhotoBuffer ? `<img src="${_studentPhotoBuffer}" class="w-full h-full object-cover" />` : (existing ? initials(existing.name) : '?')}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm mb-1">Student Photo</div>
          <p class="text-xs text-slate-500 mb-2">JPG / PNG, max 1MB</p>
          <input type="file" id="sf_photoInput" accept="image/*" class="hidden" onchange="onStudentPhotoPick(event)" />
          <div class="flex gap-2">
            <button type="button" class="btn btn-secondary text-xs" onclick="document.getElementById('sf_photoInput').click()">${icon('upload','w-3 h-3')} Choose photo</button>
            ${_studentPhotoBuffer ? `<button type="button" class="btn btn-ghost text-xs" onclick="clearStudentPhoto()">Remove</button>` : ''}
          </div>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label class="input-label">Full Name *</label>
          <input id="sf_name" class="input" placeholder="e.g. Chiamaka Okafor" value="${existing ? existing.name.replace(/"/g, '&quot;') : ''}" />
        </div>
        <div>
          <label class="input-label">Admission Number *</label>
          <input id="sf_admno" class="input" placeholder="auto-generated" value="${existing ? existing.admissionNo : autoAdmNo}" ${isEdit ? 'readonly' : ''} />
        </div>
        <div>
          <label class="input-label">Date of Birth *</label>
          <input id="sf_dob" type="date" class="input" value="${existing ? existing.dob : ''}" />
        </div>
        <div>
          <label class="input-label">Gender *</label>
          <select id="sf_gender" class="input"><option value="M" ${existing && existing.gender === 'M' ? 'selected':''}>Male</option><option value="F" ${existing && existing.gender === 'F' ? 'selected':''}>Female</option></select>
        </div>
        <div>
          <label class="input-label">Class *</label>
          <select id="sf_class" class="input">${classes.map(c => `<option value="${c.id}" ${existing && existing.classId === c.id ? 'selected':''}>${c.name}</option>`).join('')}</select>
        </div>
        <div>
          <label class="input-label">Arm</label>
          <select id="sf_arm" class="input">
            <option value="">— None —</option>
            ${DB.query('arms', a => a.schoolId === currentSchoolId()).map(a => `<option value="${a.id}" ${existing && existing.armId === a.id ? 'selected':''}>${a.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="input-label">Session</label>
          <select id="sf_session" class="input">
            ${DB.query('academicSessions', s => s.schoolId === currentSchoolId()).map(s => `<option value="${s.id}" ${(existing && existing.sessionId === s.id) || (!existing && s.current) ? 'selected':''}>${s.name}${s.current ? ' (current)' : ''}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="input-label">Blood Group</label>
          <select id="sf_blood" class="input">${bloodGroups.map(b => `<option ${existing && existing.bloodGroup === b ? 'selected':''}>${b}</option>`).join('')}</select>
        </div>
        <div>
          <label class="input-label">Allergies / Medical Notes</label>
          <input id="sf_allergies" class="input" placeholder="e.g. Peanut allergy, asthma — or 'None'" value="${existing ? (existing.allergies || '') : ''}" />
        </div>
        <div>
          <label class="input-label">Fee Category</label>
          <select id="sf_feeCat" class="input">
            <option value="standard" ${(!existing || existing.feeCategory === 'standard') ? 'selected':''}>Standard</option>
            <option value="sibling_discount" ${existing && existing.feeCategory === 'sibling_discount' ? 'selected':''}>Sibling Discount</option>
            <option value="staff_child" ${existing && existing.feeCategory === 'staff_child' ? 'selected':''}>Staff Child</option>
            <option value="scholarship" ${existing && existing.feeCategory === 'scholarship' ? 'selected':''}>Scholarship</option>
            <option value="bursary" ${existing && existing.feeCategory === 'bursary' ? 'selected':''}>Bursary</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="input-label">Parent / Guardian *</label>
          <select id="sf_parent" class="input">
            <option value="">— Select existing parent —</option>
            ${parents.map(p => `<option value="${p.id}" ${existing && existing.parentId === p.id ? 'selected':''}>${p.name} (${p.phone})</option>`).join('')}
            <option value="__new__">+ Add new parent</option>
          </select>
        </div>
        ${!isEdit ? `<div class="sm:col-span-2">
          <label class="input-label">Admission Type</label>
          <select id="sf_admType" class="input">
            <option value="new">New Admission</option>
            <option value="transfer">Transfer from another school</option>
          </select>
        </div>` : ''}
        ${isEdit ? `<div class="sm:col-span-2">
          <label class="input-label">Status</label>
          <select id="sf_status" class="input">
            <option value="active" ${existing.status === 'active' ? 'selected':''}>Active</option>
            <option value="transferred" ${existing.status === 'transferred' ? 'selected':''}>Transferred</option>
            <option value="alumni" ${existing.status === 'alumni' ? 'selected':''}>Alumni / Graduated</option>
            <option value="suspended" ${existing.status === 'suspended' ? 'selected':''}>Suspended</option>
          </select>
        </div>` : ''}
      </div>
      <div id="sf_newParent" class="hidden mt-3 p-3 bg-slate-50 rounded-xl space-y-2">
        <h4 class="font-semibold text-sm">New Parent Details</h4>
        <div class="grid sm:grid-cols-2 gap-2">
          <input id="sf_pname" class="input" placeholder="Parent name" />
          <input id="sf_pphone" class="input" placeholder="Phone (e.g. 0801…)" />
          <input id="sf_pemail" class="input" placeholder="Email" />
          <input id="sf_pocc" class="input" placeholder="Occupation" />
        </div>
      </div>

      ${(() => {
        const allActs = DB.query('activities', a => a.schoolId === currentSchoolId());
        if (!allActs.length) return '';
        const existingEnrolled = existing ? DB.query('studentActivities', sa => sa.studentId === existing.id).map(sa => sa.activityId) : [];
        const actTotal = existingEnrolled.reduce((sum, aid) => { const a = DB.find('activities', aid); return sum + (a ? a.price : 0); }, 0);
        return `<details class="mt-4 bg-slate-50 rounded-xl" open>
          <summary class="cursor-pointer p-3 font-semibold text-sm flex items-center justify-between">
            <span>${icon('book','w-4 h-4 inline mr-1')} Extracurricular Activities</span>
            <span id="act_total_preview" class="text-xs font-normal text-brand-700">${actTotal ? money(actTotal) + '/term' : ''}</span>
          </summary>
          <div class="p-3 pt-1 space-y-2">
            <p class="text-xs text-slate-500 mb-2">Select any activities for this student. The fee will be added as a line item on their invoice automatically.</p>
            ${allActs.map(a => {
              const checked = existingEnrolled.includes(a.id);
              return `<label class="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 transition has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
                <input type="checkbox" class="act_enroll_cb" value="${a.id}" data-price="${a.price}" ${checked ? 'checked' : ''} onchange="updateNewStudentActTotal()" />
                <span class="text-xl">${a.icon}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm text-slate-900">${a.name}</div>
                  <div class="text-xs text-slate-500">${a.description || ''}</div>
                </div>
                <div class="text-sm font-semibold text-brand-700 font-mono flex-shrink-0">${money(a.price)}<span class="text-xs font-normal text-slate-400">/term</span></div>
              </label>`;
            }).join('')}
          </div>
        </details>`;
      })()}

      <details class="mt-4 bg-slate-50 rounded-xl" open>
        <summary class="cursor-pointer p-3 font-semibold text-sm">${icon('paperclip','w-4 h-4 inline mr-1')} Upload Documents</summary>
        <div class="p-3 pt-0 grid grid-cols-2 gap-2">
          ${_docTypes.map(d => `
            <div class="bg-white border border-slate-200 rounded-lg p-2.5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-700">${d.label}</span>
                ${_studentDocsBuffer[d.key] ? `<span class="badge badge-success">${icon('check','w-3 h-3')} Uploaded</span>` : '<span class="text-xs text-slate-400">No file</span>'}
              </div>
              <input type="file" id="doc_${d.key}" accept="image/*,application/pdf" class="hidden" onchange="onStudentDocPick(event,'${d.key}')" />
              <div class="flex gap-1.5">
                <button type="button" class="btn btn-secondary !py-1 !px-2 text-xs flex-1" onclick="document.getElementById('doc_${d.key}').click()">${icon('upload','w-3 h-3')} Choose</button>
                ${_studentDocsBuffer[d.key] ? `<button type="button" class="btn btn-ghost !p-1 text-xs" onclick="clearStudentDoc('${d.key}')">${icon('x','w-3 h-3')}</button>` : ''}
              </div>
              ${_studentDocsBuffer[d.key] ? `<div class="text-xs text-slate-500 mt-1 truncate">${_studentDocsBuffer[d.key].name || 'document'}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </details>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveStudent(${isEdit ? "'" + editingId + "'" : 'null'})">${icon('check','w-4 h-4')} ${isEdit ? 'Save Changes' : 'Save Student'}</button>
    `
  });

  document.getElementById('sf_parent').addEventListener('change', e => {
    document.getElementById('sf_newParent').classList.toggle('hidden', e.target.value !== '__new__');
  });
}

function onStudentPhotoPick(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { toast('Image is larger than 1MB. Pick a smaller file.', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _studentPhotoBuffer = e.target.result;
    const preview = document.getElementById('sf_photoPreview');
    if (preview) preview.innerHTML = `<img src="${_studentPhotoBuffer}" class="w-full h-full object-cover" />`;
  };
  reader.readAsDataURL(file);
}

function clearStudentPhoto() {
  _studentPhotoBuffer = null;
  const preview = document.getElementById('sf_photoPreview');
  const name = document.getElementById('sf_name').value.trim();
  if (preview) preview.innerHTML = name ? initials(name) : '?';
}

function onStudentDocPick(ev, key) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { toast('File too large (max 1MB)', 'danger'); ev.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    _studentDocsBuffer[key] = { name: file.name, type: file.type, data: e.target.result, uploadedAt: now() };
    // Re-render the modal in-place to show the green check (cheap: rebuild via addStudentModal with same edit context)
    const editingMatch = /saveStudent\('([^']+)'\)/.exec(document.querySelector('#modalRoot .btn-primary')?.getAttribute('onclick') || '');
    const editingId = editingMatch ? editingMatch[1] : null;
    document.getElementById('modalBackdrop').click();
    setTimeout(() => addStudentModal(editingId), 50);
    toast('Document uploaded');
  };
  reader.readAsDataURL(file);
}

function clearStudentDoc(key) {
  delete _studentDocsBuffer[key];
  const editingMatch = /saveStudent\('([^']+)'\)/.exec(document.querySelector('#modalRoot .btn-primary')?.getAttribute('onclick') || '');
  const editingId = editingMatch ? editingMatch[1] : null;
  document.getElementById('modalBackdrop').click();
  setTimeout(() => addStudentModal(editingId), 50);
}

function updateNewStudentActTotal() {
  const cbs = document.querySelectorAll('.act_enroll_cb:checked');
  const total = [...cbs].reduce((s, cb) => s + (parseInt(cb.dataset.price) || 0), 0);
  const el = document.getElementById('act_total_preview');
  if (el) el.textContent = total ? money(total) + '/term' : '';
}

function saveStudent(editingId) {
  const name = document.getElementById('sf_name').value.trim();
  const admNo = document.getElementById('sf_admno').value.trim();
  const dob = document.getElementById('sf_dob').value;
  const gender = document.getElementById('sf_gender').value;
  const classId = document.getElementById('sf_class').value;
  const blood = document.getElementById('sf_blood').value;
  let parentId = document.getElementById('sf_parent').value;
  const statusEl = document.getElementById('sf_status');

  if (!name || !admNo || !dob || !parentId) { toast('Please fill all required fields', 'danger'); return; }

  let createdNewParent = null;
  if (parentId === '__new__') {
    const pname = document.getElementById('sf_pname').value.trim();
    const pphone = document.getElementById('sf_pphone').value.trim();
    if (!pname || !pphone) { toast('Please enter parent name and phone', 'danger'); return; }
    // Auto-generate parent login credentials
    const tempPassword = 'Caspaa' + Math.floor(Math.random() * 9000 + 1000);
    const newParent = {
      id: uid('par'),
      schoolId: currentSchoolId(),
      name: pname, phone: pphone,
      email: document.getElementById('sf_pemail').value.trim(),
      occupation: document.getElementById('sf_pocc').value.trim() || '—',
      monthlyIncome: 0, address: '',
      credentials: { username: pphone, tempPassword, createdAt: now() },
      firstLogin: true
    };
    DB.insert('parents', newParent);
    parentId = newParent.id;
    createdNewParent = newParent;
  }

  const extras = {
    armId: (document.getElementById('sf_arm') || {}).value || null,
    sessionId: (document.getElementById('sf_session') || {}).value || null,
    allergies: (document.getElementById('sf_allergies') || {}).value?.trim() || '',
    feeCategory: (document.getElementById('sf_feeCat') || {}).value || 'standard'
  };
  if (editingId) {
    DB.update('students', editingId, {
      name, admissionNo: admNo, classId, dob, gender,
      parentId, bloodGroup: blood,
      photo: _studentPhotoBuffer,
      documents: Object.assign({}, _studentDocsBuffer),
      status: statusEl ? statusEl.value : 'active',
      ...extras
    });
    DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'updated_student', target: name, timestamp: now() });
    document.getElementById('modalBackdrop').click();
    APP.render();
    toast(`${name} updated`);
    return;
  }

  const admTypeEl = document.getElementById('sf_admType');
  const newStudent = {
    id: uid('stu'),
    schoolId: currentSchoolId(),
    name, admissionNo: admNo, classId, dob, gender,
    parentId, bloodGroup: blood,
    admissionDate: today(),
    admissionType: admTypeEl ? admTypeEl.value : 'new',
    status: 'active',
    photo: _studentPhotoBuffer,
    documents: Object.assign({}, _studentDocsBuffer),
    ...extras
  };
  // Capture selected activities BEFORE inserting (checkboxes are still in the DOM)
  const selectedActIds = [...(document.querySelectorAll('.act_enroll_cb:checked') || [])].map(cb => cb.value);

  DB.insert('students', newStudent);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'added_student', target: name, timestamp: now() });

  // Enroll in selected activities
  const fs = DB.query('feeStructures', f => f.classId === classId)[0];
  if (selectedActIds.length && fs) {
    selectedActIds.forEach(actId => {
      DB.insert('studentActivities', { id: uid('sa'), schoolId: currentSchoolId(), studentId: newStudent.id, activityId: actId, enrolledAt: now(), term: fs.term });
    });
  }

  // Auto-create first invoice from the class's fee structure
  let invoiceCreated = null;
  if (fs) {
    const actLines = selectedActIds.map(aid => { const a = DB.find('activities', aid); return a ? { name: a.icon + ' ' + a.name, amount: a.price } : null; }).filter(Boolean);
    const total = fs.tuition + fs.books + fs.uniform + fs.pta + actLines.reduce((s, l) => s + l.amount, 0);
    invoiceCreated = {
      id: uid('inv'),
      schoolId: currentSchoolId(),
      studentId: newStudent.id,
      term: fs.term,
      lineItems: [
        { name: 'Tuition Fee', amount: fs.tuition },
        { name: 'Books & Materials', amount: fs.books },
        { name: 'Uniform', amount: fs.uniform },
        { name: 'PTA Levy', amount: fs.pta },
        ...actLines
      ],
      total, paid: 0, balance: total,
      status: 'outstanding',
      dueDate: fs.dueDate,
      createdAt: now()
    };
    DB.insert('invoices', invoiceCreated);
  }

  // Parent invitation
  const parent = DB.find('parents', parentId);
  if (parent) DB.insert('notifications', {
    id: uid('not'), userId: parent.id,
    title: 'Welcome to CASPAA',
    body: `Your child ${name} has been registered.${invoiceCreated ? ' First invoice for ' + money(invoiceCreated.total) + ' is ready in your dashboard.' : ''} You can now view fees, results, and attendance.`,
    type: 'info', read: false, timestamp: now(),
    link: { view: 'par_fees' }
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  if (invoiceCreated) {
    toast(`${name} added · invoice for ${money(invoiceCreated.total)} created`, 'success');
  } else {
    toast(`${name} added. ⚠️ No fee structure for ${(DB.find('classes', classId) || {}).name} — set one up to generate an invoice.`, 'warn');
  }
  // If we created a brand-new parent, show the credentials sharing modal
  if (createdNewParent) {
    setTimeout(() => showParentCredentialsModal(createdNewParent, newStudent, invoiceCreated), 300);
  }
}

/* ---------- Parent credentials & share modal ---------- */
function showParentCredentialsModal(parent, student, invoice) {
  const balance = invoice ? invoice.balance : 0;
  const waMsg = encodeURIComponent(
    `Hello ${parent.name},\n\n` +
    `Welcome to Bright Lights Academy! ${student.name} has been registered (Admission No: ${student.admissionNo}).\n\n` +
    (invoice ? `Outstanding fees for this term: ${money(balance)}.\n\n` : '') +
    `Log in to track ${student.name.split(' ')[0]}'s attendance, results and fees:\n` +
    `Username: ${parent.credentials.username}\n` +
    `Temporary password: ${parent.credentials.tempPassword}\n\n` +
    `You'll be asked to change your password on first login.\n\n` +
    `https://caspaa.com/login`
  );
  const waNum = parent.phone.replace(/[^0-9]/g, '').replace(/^0/, '234');
  const emailSubject = encodeURIComponent('Welcome to Bright Lights Academy on CASPAA');
  const emailBody = waMsg;

  modal({
    title: '🎉 Student Added · Send Parent Credentials',
    body: `
      <div class="space-y-3">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
          ${avatar(student, 'md')}
          <div class="flex-1">
            <div class="font-bold">${student.name}</div>
            <div class="text-xs text-slate-500">${student.admissionNo} · linked to ${parent.name}</div>
          </div>
          ${invoice ? `<div class="text-right"><div class="text-xs text-slate-500">Outstanding</div><div class="font-mono font-bold text-rose-700">${money(balance)}</div></div>` : ''}
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div class="text-xs uppercase font-semibold text-amber-800 mb-2">Parent Login Credentials</div>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between"><span class="text-slate-600">Username (phone)</span><code class="font-mono bg-white px-2 py-0.5 rounded">${parent.credentials.username}</code></div>
            <div class="flex justify-between"><span class="text-slate-600">Temp Password</span><code class="font-mono bg-white px-2 py-0.5 rounded">${parent.credentials.tempPassword}</code></div>
          </div>
          <p class="text-xs text-amber-700 mt-2">${parent.name.split(' ').slice(-1)} will be asked to change this on first login.</p>
        </div>

        <div>
          <div class="text-xs uppercase font-semibold text-slate-500 mb-2">Share login details</div>
          <div class="grid grid-cols-3 gap-2">
            <a href="https://wa.me/${waNum}?text=${waMsg}" target="_blank" class="btn btn-primary !py-2.5 text-xs justify-center" style="background:#25D366">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24z"/></svg>
              WhatsApp
            </a>
            <a href="mailto:${parent.email || ''}?subject=${emailSubject}&body=${emailBody}" class="btn btn-secondary !py-2.5 text-xs justify-center">
              ${icon('paperclip','w-4 h-4')} Email
            </a>
            <button class="btn btn-secondary !py-2.5 text-xs justify-center" onclick="copyParentCredentials('${parent.id}')">
              ${icon('paperclip','w-4 h-4')} Copy
            </button>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
          <strong>Demo helper:</strong> Click below to instantly switch to ${parent.name.split(' ').slice(-1)}'s account and see the first-login experience.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Done</button>
             <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); viewAsParent('${parent.id}')">Login as parent (demo) →</button>`
  });
}

function copyParentCredentials(parentId) {
  const p = DB.find('parents', parentId);
  if (!p || !p.credentials) return;
  const text = `Username: ${p.credentials.username}\nPassword: ${p.credentials.tempPassword}\nLogin: https://caspaa.com/login`;
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  toast('Credentials copied to clipboard');
}

// Backward-compat aliases
function saveNewStudent() { saveStudent(null); }

function editStudent(id) {
  document.getElementById('modalBackdrop').click();
  setTimeout(() => addStudentModal(id), 50);
}

/* ---------- Student Lifecycle ---------- */
function studentLifecycleModal(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  document.getElementById('modalBackdrop').click();
  setTimeout(() => {
    modal({
      title: s.name + ' — Lifecycle Actions',
      body: `
        <div class="space-y-3">
          <div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            ${avatar(s, 'md')}
            <div>
              <div class="font-bold">${s.name}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${statusBadge(s.status)}</div>
            </div>
          </div>

          <button class="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl text-left transition" onclick="promoteStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center">${icon('trending_up','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-emerald-900">Promote to next class</div>
                <div class="text-xs text-emerald-700">Move to a higher class for the new session</div>
              </div>
            </div>
          </button>

          <button class="w-full p-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl text-left transition" onclick="transferStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-200 text-blue-700 flex items-center justify-center">${icon('arrow_left','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-blue-900">Transfer to another school</div>
                <div class="text-xs text-blue-700">Issue a transfer certificate and archive locally</div>
              </div>
            </div>
          </button>

          <button class="w-full p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl text-left transition" onclick="changeStudentStatus('${studentId}', 'suspended', 'Student suspended')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center">${icon('bell','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-amber-900">Suspend</div>
                <div class="text-xs text-amber-700">Temporarily restrict access (reversible)</div>
              </div>
            </div>
          </button>

          <button class="w-full p-3 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 rounded-xl text-left transition" onclick="withdrawStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center">${icon('logout','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-rose-900">Withdraw</div>
                <div class="text-xs text-rose-700">Archive student record (irreversible)</div>
              </div>
            </div>
          </button>

          <button class="w-full p-3 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl text-left transition" onclick="graduateStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center">${icon('check','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-purple-900">Graduate to Alumni</div>
                <div class="text-xs text-purple-700">Mark as graduated, keep records accessible</div>
              </div>
            </div>
          </button>
        </div>
      `,
      footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>`
    });
  }, 50);
}

function bulkPromoteModal() {
  const classes = DB.get('classes');
  modal({
    title: 'Bulk Promote Students',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>End-of-term promotion.</strong> Move every active student in a class to the next class in one click. The final class graduates students to alumni.
        </div>
        <div>
          <label class="input-label">From Class</label>
          <select id="bp_from" class="input">${classes.map(c => `<option value="${c.id}">${c.name} (${COMPUTE.studentsByClass(c.id).length} students)</option>`).join('')}</select>
        </div>
        <div>
          <label class="input-label">Move To</label>
          <select id="bp_to" class="input">
            <option value="__graduate__">🎓 Graduate to Alumni</option>
            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          Students with status other than "active" will be skipped. You can review what's about to happen on the next step.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="previewBulkPromote()">Preview Changes</button>`
  });
}

function previewBulkPromote() {
  const fromId = document.getElementById('bp_from').value;
  const toId = document.getElementById('bp_to').value;
  const fromCls = DB.find('classes', fromId);
  const toCls = toId === '__graduate__' ? null : DB.find('classes', toId);
  const students = COMPUTE.studentsByClass(fromId).filter(s => s.status === 'active');
  if (students.length === 0) { toast('No active students in that class', 'warn'); return; }
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Confirm Bulk Promotion',
    size: 'lg',
    body: `
      <p class="text-sm text-slate-600 mb-3">${students.length} students will move from <strong>${fromCls.name}</strong> to <strong>${toCls ? toCls.name : 'Alumni 🎓'}</strong>:</p>
      <div class="max-h-80 overflow-y-auto space-y-1.5">
        ${students.map(s => `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          ${avatar(s, 'sm')}
          <span class="flex-1 text-sm font-medium">${s.name}</span>
          <code class="text-xs text-slate-500">${s.admissionNo}</code>
        </div>`).join('')}
      </div>
      <div class="bg-${toCls ? 'emerald' : 'purple'}-50 border border-${toCls ? 'emerald' : 'purple'}-200 rounded-xl p-3 text-sm mt-3">
        ${toCls
          ? `Each parent will be notified. Fee structure for ${toCls.name} will apply from the next invoice cycle.`
          : `All ${students.length} students will be marked as Alumni. Their full academic records remain on file.`}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="executeBulkPromote('${fromId}', '${toId}')">${icon('check','w-4 h-4')} Promote ${students.length} Students</button>`
  }), 50);
}

function executeBulkPromote(fromId, toId) {
  const students = COMPUTE.studentsByClass(fromId).filter(s => s.status === 'active');
  const toCls = toId === '__graduate__' ? null : DB.find('classes', toId);
  let count = 0;
  students.forEach(s => {
    if (toId === '__graduate__') {
      DB.update('students', s.id, {
        status: 'alumni',
        graduationYear: new Date().getFullYear(),
        finalClass: (DB.find('classes', s.classId) || {}).name || '',
        graduatedAt: now()
      });
    } else {
      DB.update('students', s.id, { classId: toId });
      DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Class Promotion', body: `${s.name} has been promoted to ${toCls.name}. Congratulations!`, type: 'success', read: false, timestamp: now() });
    }
    count++;
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: toId === '__graduate__' ? 'bulk_graduated' : 'bulk_promoted', target: `${count} students from ${(DB.find('classes', fromId) || {}).name}${toCls ? ' → ' + toCls.name : ' → Alumni'}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${count} students ${toId === '__graduate__' ? 'graduated 🎓' : 'promoted'}`, 'success');
}

function promoteStudentModal(studentId) {
  const s = DB.find('students', studentId);
  const classes = DB.get('classes');
  const currentCls = classes.find(c => c.id === s.classId);
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Promote ' + s.name,
    body: `
      <p class="text-sm text-slate-600 mb-3">Moving from <strong>${currentCls ? currentCls.name : '—'}</strong> to:</p>
      <select id="promote_class" class="input">
        ${classes.filter(c => c.id !== s.classId).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900 mt-3">
        Their academic history stays intact. Fee structure for the new class will apply from the next term.
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmPromotion('${studentId}')">Promote</button>`
  }), 50);
}

function confirmPromotion(studentId) {
  const newClassId = document.getElementById('promote_class').value;
  const s = DB.find('students', studentId);
  const newCls = DB.find('classes', newClassId);
  DB.update('students', studentId, { classId: newClassId });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'promoted_student', target: `${s.name} → ${newCls.name}`, timestamp: now() });
  DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Class Promotion', body: `${s.name} has been promoted to ${newCls.name}. Congratulations!`, type: 'success', read: false, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${s.name} promoted to ${newCls.name}`, 'success');
}

function transferStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Transfer ' + s.name,
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Destination School</label><input id="tr_school" class="input" placeholder="e.g. Greenfield International School" /></div>
        <div><label class="input-label">Reason</label><textarea id="tr_reason" rows="3" class="input" placeholder="e.g. Family relocation to Abuja"></textarea></div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          A transfer certificate will be issued. The student's record will be marked Transferred and archived locally.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmTransfer('${studentId}')">Generate Transfer Certificate</button>`
  }), 50);
}

function confirmTransfer(studentId) {
  const destSchool = document.getElementById('tr_school').value.trim();
  const reason = document.getElementById('tr_reason').value.trim();
  if (!destSchool) { toast('Destination school required', 'danger'); return; }
  const s = DB.find('students', studentId);
  DB.update('students', studentId, { status: 'transferred', transferDest: destSchool, transferReason: reason, transferredAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'transferred_student', target: `${s.name} → ${destSchool}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  // Print certificate
  printTransferCertificate(studentId, destSchool, reason);
  APP.render();
  toast(`${s.name} transferred. Certificate generated.`, 'success');
}

function printTransferCertificate(studentId, destSchool, reason) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  const html = `
    <div style="max-width:780px;margin:0 auto;font-family:system-ui;padding:32px;border:3px solid #047857">
      <div style="text-align:center;border-bottom:2px solid #047857;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <p style="margin:4px 0;color:#666;font-size:13px">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:18px 0 4px;font-size:22px">TRANSFER CERTIFICATE</h2>
        <p style="color:#666">Certificate No: TC-${Date.now().toString(36).toUpperCase()}</p>
      </div>
      <p style="line-height:1.8;font-size:15px">This is to certify that <strong>${s.name}</strong>, bearing admission number <strong>${s.admissionNo}</strong>, was a bona fide student of this school in class <strong>${cls ? cls.name : '—'}</strong> from ${fdate(s.admissionDate, { long: true })} until ${fdate(now(), { long: true })}.</p>
      <p style="line-height:1.8;font-size:15px">The student is being transferred to <strong>${destSchool}</strong>.${reason ? ` Reason: ${reason}.` : ''}</p>
      <p style="line-height:1.8;font-size:15px">Their academic record and conduct were satisfactory and they have no outstanding obligation to this school.</p>
      <div style="margin-top:60px;display:flex;justify-content:space-between">
        <div><strong>Head Teacher</strong><br/><br/>______________________<br/><span style="font-size:12px;color:#666">Signature &amp; Stamp</span></div>
        <div style="text-align:right">${fdate(now(), { long: true })}<br/><span style="font-size:12px;color:#666">Date</span></div>
      </div>
    </div>
  `;
  printElement(html);
}

function withdrawStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Withdraw ' + s.name,
    body: `
      <div class="space-y-3">
        <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
          <strong>Warning:</strong> Withdrawal archives the student record. Fees, results, and attendance history are preserved but the student becomes inactive. This action is logged in the audit trail.
        </div>
        <div><label class="input-label">Reason</label>
          <select id="wd_reason" class="input">
            <option>Voluntary withdrawal by parent</option>
            <option>Non-payment of fees</option>
            <option>Disciplinary action</option>
            <option>Health reasons</option>
            <option>Other</option>
          </select>
        </div>
        <div><label class="input-label">Notes (optional)</label><textarea id="wd_notes" rows="2" class="input"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-danger" onclick="confirmWithdraw('${studentId}')">${icon('logout','w-4 h-4')} Confirm Withdrawal</button>`
  }), 50);
}

function confirmWithdraw(studentId) {
  const s = DB.find('students', studentId);
  const reason = document.getElementById('wd_reason').value;
  const notes = document.getElementById('wd_notes').value.trim();
  DB.update('students', studentId, { status: 'withdrawn', withdrawReason: reason, withdrawNotes: notes, withdrawnAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'withdrew_student', target: `${s.name} (${reason})`, timestamp: now() });
  document.getElementById('modalBackdrop').click();

  // Check if there's a refund-eligible balance
  const inv = COMPUTE.studentInvoice(studentId);
  if (inv && inv.paid > 0) {
    // Compute pro-rata refund: assume remaining proportion of term
    const termDays = 90;
    const elapsed = Math.min(termDays, Math.max(0, Math.ceil((new Date() - new Date(inv.createdAt)) / 86400000)));
    const usedRatio = elapsed / termDays;
    const consumed = Math.round(inv.paid * usedRatio);
    const refundable = Math.max(0, inv.paid - consumed);
    if (refundable > 0) {
      setTimeout(() => offerRefundModal(studentId, refundable, inv.paid, Math.round(usedRatio * 100)), 200);
      return;
    }
  }
  APP.render();
  toast(`${s.name} withdrawn`, 'info');
}

function offerRefundModal(studentId, suggested, totalPaid, usedPct) {
  const s = DB.find('students', studentId);
  const parent = DB.find('parents', s.parentId);
  modal({
    title: 'Refund Eligible',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${s.name} has been withdrawn but their parent paid <strong>${money(totalPaid)}</strong> this term. Approximately <strong>${usedPct}%</strong> of the term has elapsed, so a pro-rata refund may be due.
        </div>
        <div class="bg-slate-50 rounded-xl p-3 space-y-2">
          <div class="flex justify-between text-sm"><span class="text-slate-500">Paid this term</span><strong class="font-mono">${money(totalPaid)}</strong></div>
          <div class="flex justify-between text-sm"><span class="text-slate-500">Term consumed (${usedPct}%)</span><span class="font-mono">${money(totalPaid - suggested)}</span></div>
          <div class="flex justify-between text-base font-bold pt-2 border-t border-slate-200"><span>Suggested refund</span><span class="font-mono text-emerald-700">${money(suggested)}</span></div>
        </div>
        <div>
          <label class="input-label">Refund amount</label>
          <input id="rf_amount" type="number" class="input" value="${suggested}" />
          <p class="text-xs text-slate-400 mt-1">Adjust as needed. Refund of ₦0 = no refund issued.</p>
        </div>
        <div>
          <label class="input-label">Refund method</label>
          <select id="rf_method" class="input">
            <option value="bank_transfer">Bank Transfer (manual)</option>
            <option value="paystack_refund">Paystack Reversal</option>
            <option value="cash">Cash (collected by parent)</option>
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.render()">Skip refund</button>
             <button class="btn btn-primary" onclick="processRefund('${studentId}')">${icon('check','w-4 h-4')} Issue Refund</button>`
  });
}

function processRefund(studentId) {
  const amount = parseInt(document.getElementById('rf_amount').value) || 0;
  const method = document.getElementById('rf_method').value;
  if (amount <= 0) { document.getElementById('modalBackdrop').click(); APP.render(); return; }
  const s = DB.find('students', studentId);
  const inv = COMPUTE.studentInvoice(studentId);
  // Record refund as a negative transaction
  DB.insert('transactions', {
    id: uid('txn'),
    schoolId: s.schoolId,
    invoiceId: inv ? inv.id : null,
    studentId,
    amount: -amount,
    method,
    reference: 'REF-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: 'successful',
    gateway: 'Manual',
    type: 'refund',
    timestamp: now(),
    reconciled: true,
    recordedBy: AUTH.current.id
  });
  // Update invoice paid amount
  if (inv) {
    DB.update('invoices', inv.id, { paid: Math.max(0, inv.paid - amount) });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'issued_refund', target: `${money(amount)} to ${s.name} (${method})`, timestamp: now() });
  DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Refund Issued', body: `A refund of ${money(amount)} has been issued for ${s.name}'s withdrawal via ${method}. Please allow 3–5 business days.`, type: 'success', read: false, timestamp: now(), link: { view: 'par_fees' } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Refund of ${money(amount)} issued · parent notified`, 'success');
}

function graduateStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Graduate ' + s.name + ' to Alumni',
    body: `
      <div class="space-y-3">
        <div class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-900">
          ${s.name} will be marked as Alumni. Their complete academic record is preserved and accessible from the Alumni page.
        </div>
        <div><label class="input-label">Graduation Year</label><input id="gr_year" type="number" class="input" value="${new Date().getFullYear()}" /></div>
        <div><label class="input-label">Final Class</label><input id="gr_class" class="input" value="${(DB.find('classes', s.classId) || {}).name || ''}" /></div>
        <div><label class="input-label">Awards / Honours (optional)</label><textarea id="gr_awards" rows="2" class="input" placeholder="e.g. Valedictorian, Best in Mathematics"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmGraduation('${studentId}')">${icon('check','w-4 h-4')} Graduate</button>`
  }), 50);
}

function confirmGraduation(studentId) {
  const year = parseInt(document.getElementById('gr_year').value) || new Date().getFullYear();
  const finalClass = document.getElementById('gr_class').value.trim();
  const awards = document.getElementById('gr_awards').value.trim();
  const s = DB.find('students', studentId);
  DB.update('students', studentId, { status: 'alumni', graduationYear: year, finalClass, awards, graduatedAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'graduated_student', target: `${s.name} (Class of ${year})`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${s.name} graduated to alumni 🎓`, 'success');
}

function changeStudentStatus(studentId, status, label) {
  const s = DB.find('students', studentId);
  DB.update('students', studentId, { status });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'changed_status', target: `${s.name}: ${status}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(label || `${s.name} status: ${status}`, status === 'suspended' ? 'warn' : undefined);
}

/* ---------- Alumni Page ---------- */
function view_adm_alumni() {
  const alumni = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'alumni');
  const yearF = APP.params.alumniYear || 'all';
  const years = [...new Set(alumni.map(a => a.graduationYear).filter(Boolean))].sort((a, b) => b - a);
  const filtered = yearF === 'all' ? alumni : alumni.filter(a => String(a.graduationYear) === yearF);

  return `
    ${pageHeader({
      title: 'Alumni',
      subtitle: `${alumni.length} graduates across ${years.length} year${years.length !== 1 ? 's' : ''}`,
      actions: alumni.length ? `<button class="btn btn-secondary" onclick="exportAlumniCSV()">${icon('download','w-4 h-4')} CSV</button>` : ''
    })}

    ${alumni.length === 0 ? emptyState({
      title: 'No alumni yet',
      body: 'Graduate students from their profile (Actions → Graduate to Alumni) to track them here.',
      icon: 'students'
    }) : `
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="chip ${yearF === 'all' ? 'active' : ''}" onclick="APP.params.alumniYear = 'all'; APP.render()">All years</button>
        ${years.map(y => `<button class="chip ${yearF === String(y) ? 'active' : ''}" onclick="APP.params.alumniYear='${y}'; APP.render()">Class of ${y}</button>`).join('')}
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${filtered.map(a => `<div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            ${avatar(a, 'lg')}
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate">${a.name}</div>
              <div class="text-xs text-slate-500">Class of ${a.graduationYear || '—'}</div>
            </div>
            <span class="badge badge-success">🎓</span>
          </div>
          <div class="text-sm space-y-1">
            <div><span class="text-slate-500">Final class:</span> <strong>${a.finalClass || '—'}</strong></div>
            <div><span class="text-slate-500">Admission:</span> <code class="text-xs">${a.admissionNo}</code></div>
            ${a.awards ? `<div class="bg-purple-50 rounded-lg p-2 text-xs text-purple-900 mt-2"><strong>Awards:</strong> ${a.awards}</div>` : ''}
          </div>
          <button class="btn btn-secondary w-full mt-3 text-sm" onclick="viewStudent('${a.id}')">View record →</button>
        </div>`).join('')}
      </div>
    `}
  `;
}

function exportAlumniCSV() {
  const alumni = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'alumni');
  const headers = ['Name', 'Admission No', 'Graduation Year', 'Final Class', 'Awards', 'Parent Phone'];
  const rows = alumni.map(a => {
    const p = DB.find('parents', a.parentId) || {};
    return [a.name, a.admissionNo, a.graduationYear || '', a.finalClass || '', a.awards || '', p.phone || ''];
  });
  const csv = [headers, ...rows].map(r => r.map(v => {
    const str = String(v == null ? '' : v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `caspaa_alumni_${today()}.csv`; a.click();
  toast('Alumni list exported');
}

function bulkUploadModal() {
  modal({
    title: 'Bulk Upload Students',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          <strong>How it works:</strong> Download the template, fill it with your student data, then upload it back. The system will create student records and parents automatically.
        </div>

        <input type="file" id="bulk_file" accept=".csv,text/csv" class="hidden" onchange="handleBulkUpload(event)" />
        <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 cursor-pointer" onclick="document.getElementById('bulk_file').click()">
          ${icon('upload', 'w-12 h-12 mx-auto text-slate-400 mb-2')}
          <p class="font-semibold text-slate-700 mb-1">Click to choose a CSV file</p>
          <p class="text-sm text-slate-500 mb-3">Or drag your file onto this area</p>
          <button type="button" class="btn btn-primary" onclick="event.stopPropagation(); document.getElementById('bulk_file').click()">Choose file</button>
        </div>

        <button type="button" class="btn btn-secondary w-full" onclick="downloadTemplate()">${icon('download','w-4 h-4')} Download CSV Template</button>

        <details class="text-sm">
          <summary class="cursor-pointer font-semibold">Required columns (in order)</summary>
          <ul class="mt-2 text-slate-600 space-y-1 list-disc list-inside">
            <li><strong>Full Name</strong> (required)</li>
            <li><strong>Admission No</strong> (auto-generated if empty)</li>
            <li><strong>DOB</strong> in DD/MM/YYYY or YYYY-MM-DD</li>
            <li><strong>Gender</strong> (M or F)</li>
            <li><strong>Class</strong> (must match an existing class name, e.g. <code>JSS 1</code> or <code>Primary 3</code>)</li>
            <li><strong>Blood Group</strong></li>
            <li><strong>Parent Name</strong> (required)</li>
            <li><strong>Parent Phone</strong> (required — used to dedupe parents)</li>
            <li><strong>Parent Email</strong> (optional)</li>
            <li><strong>Parent Occupation</strong> (optional)</li>
          </ul>
        </details>
      </div>
    `
  });
}

function downloadTemplate() {
  const sample = [
    'Full Name,Admission No,DOB,Gender (M/F),Class,Blood Group,Parent Name,Parent Phone,Parent Email,Parent Occupation',
    'Jane Doe,,15/06/2016,F,Primary 3,A+,Mary Doe,08012345678,mary@email.com,Teacher',
    'Peter Adebayo,,20/03/2014,M,JSS 1,O+,Mr Adebayo,08087654321,,Engineer'
  ].join('\n');
  const blob = new Blob([sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_student_template.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('Template downloaded');
}

function handleBulkUpload(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => parseBulkCSV(e.target.result, file.name);
  reader.onerror = () => toast('Could not read file', 'danger');
  reader.readAsText(file);
}

function parseBulkCSV(csvText, fileName) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) { toast('CSV is empty or missing data rows', 'danger'); return; }
  const splitRow = line => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim()); return out;
  };
  const header = splitRow(lines[0]).map(h => h.toLowerCase());
  const idx = (label) => header.findIndex(h => h.includes(label.toLowerCase()));
  const iName = idx('full name');
  const iAdm = idx('admission');
  const iDob = idx('dob');
  const iGen = idx('gender');
  const iCls = idx('class');
  const iBlood = idx('blood');
  const iPName = idx('parent name');
  const iPPhone = idx('parent phone');
  const iPEmail = idx('parent email');
  const iPOcc = idx('parent occupation');
  if (iName < 0 || iCls < 0 || iPName < 0 || iPPhone < 0) {
    toast('CSV is missing required columns. Use the template.', 'danger'); return;
  }

  const classes = DB.get('classes');
  const findClass = (name) => {
    const n = (name || '').toLowerCase().replace(/\s+/g, '');
    return classes.find(c => c.name.toLowerCase().replace(/\s+/g, '') === n);
  };
  const normalizeDate = (s) => {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const yr = m[3].length === 2 ? '20' + m[3] : m[3];
      return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    }
    return s;
  };

  const created = []; const errors = [];
  let admCounter = DB.get('students').length + 1;
  for (let r = 1; r < lines.length; r++) {
    const cols = splitRow(lines[r]);
    const name = cols[iName];
    if (!name) { errors.push(`Row ${r+1}: missing name`); continue; }
    const cls = findClass(cols[iCls]);
    if (!cls) { errors.push(`Row ${r+1}: class "${cols[iCls]}" not found`); continue; }
    const pPhone = cols[iPPhone] || '';
    const pName = cols[iPName] || '';
    if (!pName || !pPhone) { errors.push(`Row ${r+1}: parent name & phone required`); continue; }
    // Dedup parent by phone
    let parent = DB.query('parents', p => p.phone === pPhone)[0];
    if (!parent) {
      parent = {
        id: uid('par'), schoolId: currentSchoolId(),
        name: pName, phone: pPhone,
        email: iPEmail >= 0 ? cols[iPEmail] : '',
        occupation: iPOcc >= 0 ? (cols[iPOcc] || '—') : '—',
        monthlyIncome: 0, address: ''
      };
      DB.insert('parents', parent);
    }
    const admNo = (iAdm >= 0 && cols[iAdm]) || `BL/2024/${String(admCounter++).padStart(3,'0')}`;
    const student = {
      id: uid('stu'), schoolId: currentSchoolId(),
      name, admissionNo: admNo,
      classId: cls.id,
      dob: normalizeDate(iDob >= 0 ? cols[iDob] : ''),
      gender: ((iGen >= 0 ? cols[iGen] : 'M').toUpperCase().startsWith('F')) ? 'F' : 'M',
      bloodGroup: iBlood >= 0 ? cols[iBlood] : 'O+',
      parentId: parent.id,
      admissionDate: today(),
      status: 'active', photo: null
    };
    DB.insert('students', student);
    created.push(student);
  }

  if (created.length) DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'bulk_import', target: `${created.length} students from ${fileName}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  if (created.length && !errors.length) toast(`Imported ${created.length} student${created.length!==1?'s':''} from ${fileName}`, 'success');
  else if (created.length && errors.length) {
    modal({
      title: `Partial import: ${created.length} ok, ${errors.length} skipped`,
      body: `<div class="space-y-2"><div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">${created.length} student${created.length!==1?'s':''} successfully imported.</div>
      <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm"><strong class="block mb-1">Skipped rows:</strong>${errors.map(e=>`<div>• ${e}</div>`).join('')}</div></div>`,
      footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">OK</button>`
    });
  } else toast(`No students imported. ${errors[0] || 'Check the file.'}`, 'danger');
}

/* ---------- Staff ---------- */
function staffSubjectLabel(t) {
  if (t.staffType !== 'Academic') return t.role || t.staffType || '—';
  const subjects = DB.get('subjects');
  if (Array.isArray(t.subjects) && t.subjects.length) {
    const names = t.subjects.map(id => (subjects.find(s => s.id === id) || {}).name).filter(Boolean);
    return names.join(', ');
  }
  return t.subject || 'Teacher';
}

function view_adm_staff() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const academic = teachers.filter(t => t.staffType === 'Academic' || !t.staffType);
  const nonAcademic = teachers.filter(t => t.staffType && t.staffType !== 'Academic');
  // Group non-academic by type
  const nonAcademicGroups = {};
  nonAcademic.forEach(t => {
    if (!nonAcademicGroups[t.staffType]) nonAcademicGroups[t.staffType] = [];
    nonAcademicGroups[t.staffType].push(t);
  });

  const renderRow = (t) => `
    <tr class="cursor-pointer hover:bg-slate-50" onclick="viewStaff('${t.id}')">
      <td>
        <div class="flex items-center gap-3">
          ${avatar(t.name, 'sm')}
          <div>
            <div class="font-semibold text-slate-900">${t.name}</div>
            <div class="text-xs text-slate-500">${t.email}</div>
          </div>
        </div>
      </td>
      <td>${staffSubjectLabel(t)}</td>
      <td>${t.classes && t.classes.length ? `<span class="badge badge-neutral">${t.classes.length} class${t.classes.length !== 1 ? 'es' : ''}</span>` : '<span class="text-slate-400 text-sm">—</span>'}</td>
      <td>${fdate(t.hireDate, { short: true })}</td>
      <td><span class="font-mono">${money(t.salary)}</span></td>
      <td class="text-right">
        <button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); viewStaff('${t.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
      </td>
    </tr>
  `;

  const totalSalary = teachers.reduce((sum, t) => sum + (t.salary || 0), 0);
  const academicSalary    = academic.reduce((sum, t) => sum + (t.salary || 0), 0);
  const nonAcademicSalary = nonAcademic.reduce((sum, t) => sum + (t.salary || 0), 0);

  // Group non-academic for the breakdown chips
  const nonAcadGroups = {};
  nonAcademic.forEach(t => {
    const g = t.staffType || 'Other';
    nonAcadGroups[g] = (nonAcadGroups[g] || 0) + 1;
  });

  return `
    ${pageHeader({
      title: 'Staff & HR',
      subtitle: 'Academic and non-academic staff directory',
      actions: `<button class="btn btn-primary" onclick="addStaffModal()">${icon('plus','w-4 h-4')} Add Staff</button>`
    })}

    <!-- Headcount summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Staff</div>
        <div class="text-3xl font-extrabold text-slate-900">${teachers.length}</div>
        <div class="text-xs text-slate-500 mt-1">All categories</div>
      </div>
      <div class="card p-4 border-l-4 border-brand-500">
        <div class="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Academic</div>
        <div class="text-3xl font-extrabold text-brand-700">${academic.length}</div>
        <div class="text-xs text-slate-500 mt-1">Teachers &amp; subject leads</div>
      </div>
      <div class="card p-4 border-l-4 border-blue-400">
        <div class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Non-Academic</div>
        <div class="text-3xl font-extrabold text-blue-700">${nonAcademic.length}</div>
        <div class="text-xs text-slate-500 mt-1">${Object.entries(nonAcadGroups).map(([k,v]) => `${v} ${k}`).join(' · ') || 'Admin, Operations, etc.'}</div>
      </div>
      <div class="card p-4 border-l-4 border-amber-400">
        <div class="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Monthly Payroll</div>
        <div class="text-2xl font-extrabold text-amber-700">${money(totalSalary)}</div>
        <div class="text-xs text-slate-500 mt-1">Acad: ${money(academicSalary)} · Non-acad: ${money(nonAcademicSalary)}</div>
      </div>
    </div>

    <!-- Academic Staff -->
    <div class="card mb-4 overflow-hidden">
      <div class="px-5 py-3 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-brand-200 text-brand-800 flex items-center justify-center">${icon('teacher','w-4 h-4')}</div>
          <h3 class="font-bold text-brand-900">Academic Staff <span class="text-sm font-normal text-brand-700">· ${academic.length}</span></h3>
        </div>
        <span class="text-xs text-brand-700">Teachers · class teachers · subject leads</span>
      </div>
      ${academic.length === 0
        ? '<div class="p-6 text-center text-slate-500 text-sm">No academic staff yet. <button class="text-brand-700 font-semibold" onclick="addStaffModal()">Add your first teacher</button></div>'
        : `<div class="overflow-x-auto"><table class="tbl">
            <thead><tr><th>Staff</th><th>Subjects</th><th>Classes</th><th>Since</th><th>Salary</th><th></th></tr></thead>
            <tbody>${academic.map(renderRow).join('')}</tbody>
          </table></div>`}
    </div>

    <!-- Non-Academic Staff (grouped by type) -->
    <div class="card overflow-hidden">
      <div class="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center">${icon('user','w-4 h-4')}</div>
          <h3 class="font-bold text-blue-900">Non-Academic Staff <span class="text-sm font-normal text-blue-700">· ${nonAcademic.length}</span></h3>
        </div>
        <span class="text-xs text-blue-700">Bursar · Admin · Operations · ICT · Transport</span>
      </div>
      ${nonAcademic.length === 0
        ? '<div class="p-6 text-center text-slate-500 text-sm">No non-academic staff. <button class="text-brand-700 font-semibold" onclick="addStaffModal()">Add</button></div>'
        : Object.entries(nonAcademicGroups).map(([type, list]) => `
            <div class="border-b border-slate-100 last:border-0">
              <div class="px-5 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wide">${type} <span class="font-normal text-slate-500">· ${list.length}</span></div>
              <div class="overflow-x-auto"><table class="tbl">
                <tbody>${list.map(renderRow).join('')}</tbody>
              </table></div>
            </div>
          `).join('')
      }
    </div>
  `;
}

function viewStaff(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  const allClasses = DB.get('classes');
  const allSubjects = DB.get('subjects');
  const classes = allClasses.filter(c => (t.classes || []).includes(c.id));
  const subjectsTaught = (t.subjects || []).map(sid => allSubjects.find(s => s.id === sid)).filter(Boolean);
  // Performance metrics
  const myResults = DB.query('results', r => (t.classes || []).includes(r.classId) && (t.subjects || []).includes(r.subjectId));
  const avgScore = myResults.length ? Math.round(myResults.reduce((s, r) => s + r.total, 0) / myResults.length) : 0;
  const passRate = myResults.length ? Math.round(myResults.filter(r => r.grade !== 'F').length / myResults.length * 100) : 0;
  const myAttendance = DB.query('staffAttendance', a => a.staffId === t.id);
  const myAttRate = myAttendance.length ? Math.round((myAttendance.filter(a => a.status === 'present').length / myAttendance.length) * 100) : 0;
  const myAssignments = DB.query('assignments', a => a.teacherId === t.id);
  const docs = t.documents || {};
  const presentDocs = _staffDocTypes.filter(d => docs[d.key]);

  modal({
    title: 'Staff Profile',
    size: 'lg',
    body: `
      <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        ${avatar(t.name, 'xl')}
        <div class="flex-1">
          <h2 class="text-lg font-bold text-slate-900">${t.name}</h2>
          <div class="flex flex-wrap gap-1.5 mt-1">
            <span class="badge ${t.staffType === 'Academic' ? 'badge-success' : 'badge-info'}">${t.staffType || 'Academic'}</span>
            ${t.role && t.staffType !== 'Academic' ? `<span class="badge badge-neutral">${t.role}</span>` : ''}
          </div>
          <p class="text-xs text-slate-400 mt-2">${t.email} · ${t.phone}</p>
        </div>
      </div>
      <div class="space-y-3">
        ${subjectsTaught.length ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Subjects Taught</div>
          <div class="flex flex-wrap gap-1.5">${subjectsTaught.map(s => `<span class="badge badge-success">${s.name}</span>`).join('')}</div>
        </div>` : ''}
        ${classes.length ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Assigned Classes</div>
          <div class="flex flex-wrap gap-1.5">${classes.map(c => `<span class="badge badge-info">${c.name}</span>`).join('')}</div>
        </div>` : ''}

        ${t.staffType === 'Academic' ? `<div>
          <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Performance Tracking</div>
          <div class="grid grid-cols-4 gap-2">
            <div class="bg-brand-50 rounded-xl p-3 text-center">
              <div class="text-xs text-brand-700 font-semibold">AVG SCORE</div>
              <div class="text-xl font-bold text-brand-900 mt-1">${avgScore}%</div>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3 text-center">
              <div class="text-xs text-emerald-700 font-semibold">PASS RATE</div>
              <div class="text-xl font-bold text-emerald-900 mt-1">${passRate}%</div>
            </div>
            <div class="bg-amber-50 rounded-xl p-3 text-center">
              <div class="text-xs text-amber-700 font-semibold">PUNCTUALITY</div>
              <div class="text-xl font-bold text-amber-900 mt-1">${myAttRate}%</div>
            </div>
            <div class="bg-blue-50 rounded-xl p-3 text-center">
              <div class="text-xs text-blue-700 font-semibold">ASSIGNMENTS</div>
              <div class="text-xl font-bold text-blue-900 mt-1">${myAssignments.length}</div>
            </div>
          </div>
        </div>` : ''}

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Hired</div><div>${fdate(t.hireDate, { long: true })}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Monthly Salary</div><div class="font-mono">${money(t.salary)}</div></div>
          ${t.dob ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Date of Birth</div><div>${fdate(t.dob, { long: true })}</div></div>` : ''}
          ${t.bank ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Payroll Account</div><div>${t.bank.name} · ${t.bank.account}</div></div>` : ''}
        </div>

        ${presentDocs.length ? `<div>
          <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Documents on File</div>
          <div class="grid grid-cols-2 gap-2">
            ${presentDocs.map(d => `<a href="${docs[d.key].data}" download="${docs[d.key].name || d.key}" class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm">
              ${icon('paperclip','w-4 h-4 text-brand-600')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${d.label}</div>
                <div class="text-xs text-slate-500 truncate">${docs[d.key].name || 'view'}</div>
              </div>
              ${icon('download','w-3.5 h-3.5 text-slate-400')}
            </a>`).join('')}
          </div>
        </div>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

// Buffer for staff documents during the modal lifecycle
let _staffDocsBuffer = {};
const _staffDocTypes = [
  { key: 'cv',           label: 'CV / Resume' },
  { key: 'certificates', label: 'Educational Certificates' },
  { key: 'id',           label: 'Government ID (NIN / Passport)' },
  { key: 'guarantor',    label: 'Guarantor Form' }
];

function onStaffDocPick(ev, key) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { toast('File too large (max 1MB)', 'danger'); ev.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    _staffDocsBuffer[key] = { name: file.name, type: file.type, data: e.target.result, uploadedAt: now() };
    // Visually update the row
    const row = document.getElementById('stfdoc_' + key);
    if (row) row.innerHTML = `<span class="badge badge-success">${icon('check','w-3 h-3')} ${file.name}</span> <button type="button" class="text-xs text-rose-600" onclick="clearStaffDoc('${key}')">Remove</button>`;
    toast('Document attached');
  };
  reader.readAsDataURL(file);
}

function clearStaffDoc(key) {
  delete _staffDocsBuffer[key];
  const row = document.getElementById('stfdoc_' + key);
  if (row) row.innerHTML = `<button type="button" class="btn btn-secondary !py-1 !px-2 text-xs" onclick="document.getElementById('stfdocf_${key}').click()">${icon('upload','w-3 h-3')} Choose</button>`;
}

function addStaffModal() {
  _staffDocsBuffer = {};
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  modal({
    title: 'Add New Staff',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Full Name *</label><input id="stf_name" class="input" placeholder="e.g. Mrs. Funke Adeyemi" /></div>
          <div><label class="input-label">Date of Birth</label><input id="stf_dob" type="date" class="input" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Phone *</label><input id="stf_phone" class="input" placeholder="0801…" /></div>
          <div><label class="input-label">Email <span class="text-slate-400">(optional)</span></label><input id="stf_email" class="input" type="email" placeholder="staff@school.ng" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Staff Type *</label>
            <select id="stf_type" class="input" onchange="toggleStaffTypeFields()">
              <option value="Academic">Academic (Teacher)</option>
              <option value="Finance">Finance (Bursar, Accountant)</option>
              <option value="Administration">Administration (Secretary)</option>
              <option value="Operations">Operations (Security, Cleaner)</option>
              <option value="ICT">ICT (Tech Support)</option>
              <option value="Transport">Transport (Driver)</option>
            </select>
          </div>
          <div><label class="input-label">Assigned Role</label>
            <select id="stf_roleId" class="input">
              ${DB.query('schoolRoles', r => r.schoolId === currentSchoolId() && r.name !== 'Proprietor' && r.name !== 'Parent').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
            <p class="text-xs text-slate-400 mt-1">Manage roles in Settings → Roles &amp; Permissions</p>
          </div>
        </div>
        <div><label class="input-label">Title / Job Description (optional)</label><input id="stf_role" class="input" placeholder="e.g. Senior Maths Teacher, Head of Sciences" /></div>
        <div id="stf_academicFields">
          <label class="input-label">Subjects Taught (hold Ctrl/Cmd to select multiple)</label>
          <select id="stf_subjects" class="input" multiple size="5">
            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          <label class="input-label mt-3">Assigned Classes</label>
          <select id="stf_class" class="input" multiple size="4">
            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Monthly Salary (NGN)</label><input id="stf_salary" class="input" type="number" placeholder="180000" /></div>
          <div><label class="input-label">Hire Date</label><input id="stf_hire" type="date" class="input" value="${today()}" /></div>
        </div>
        <details class="bg-slate-50 rounded-xl">
          <summary class="cursor-pointer p-3 font-semibold text-sm">Payroll / Banking</summary>
          <div class="p-3 pt-0 grid grid-cols-2 gap-2">
            <input id="stf_bankName" class="input" placeholder="Bank name (e.g. GTBank)" />
            <input id="stf_bankAcc" class="input" placeholder="Account number" />
          </div>
        </details>

        <details class="bg-slate-50 rounded-xl">
          <summary class="cursor-pointer p-3 font-semibold text-sm">Set Permissions</summary>
          <div class="p-3 pt-0 space-y-1.5">
            ${[
              { key: 'attendance', label: 'Mark attendance', default: true },
              { key: 'results',    label: 'Enter & submit results', default: true },
              { key: 'assignments', label: 'Create assignments', default: true },
              { key: 'messaging', label: 'Message parents directly', default: true },
              { key: 'lesson_plans', label: 'Manage lesson plans', default: true },
              { key: 'view_finances', label: 'View class fee status', default: false },
              { key: 'discipline', label: 'Record discipline / commendations', default: false }
            ].map(p => `<label class="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer">
              <span class="text-sm">${p.label}</span>
              <input type="checkbox" class="w-4 h-4 accent-brand-600" data-stfperm="${p.key}" ${p.default ? 'checked' : ''} />
            </label>`).join('')}
          </div>
        </details>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <div class="font-semibold mb-1">${icon('check','w-4 h-4 inline')} Login credentials will be auto-generated</div>
          <div class="text-xs">Once saved, an invitation email + WhatsApp message is sent with the username (their email) and a temporary password they'll be asked to change on first login.</div>
        </div>

        <details class="bg-slate-50 rounded-xl" open>
          <summary class="cursor-pointer p-3 font-semibold text-sm">${icon('paperclip','w-4 h-4 inline mr-1')} Documents</summary>
          <div class="p-3 pt-0 space-y-2">
            ${_staffDocTypes.map(d => `
              <div class="bg-white border border-slate-200 rounded-lg p-2.5">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-semibold text-slate-700">${d.label}</span>
                </div>
                <input type="file" id="stfdocf_${d.key}" accept="image/*,application/pdf" class="hidden" onchange="onStaffDocPick(event, '${d.key}')" />
                <div class="flex items-center gap-2" id="stfdoc_${d.key}">
                  <button type="button" class="btn btn-secondary !py-1 !px-2 text-xs" onclick="document.getElementById('stfdocf_${d.key}').click()">${icon('upload','w-3 h-3')} Choose</button>
                </div>
              </div>
            `).join('')}
          </div>
        </details>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewStaff()">${icon('check','w-4 h-4')} Save Staff</button>
    `
  });
}

function toggleStaffTypeFields() {
  const isAcademic = document.getElementById('stf_type').value === 'Academic';
  document.getElementById('stf_academicFields').classList.toggle('hidden', !isAcademic);
}

function saveNewStaff() {
  const name = document.getElementById('stf_name').value.trim();
  const email = document.getElementById('stf_email').value.trim();
  const phone = document.getElementById('stf_phone').value.trim();
  const staffType = document.getElementById('stf_type').value;
  const role = document.getElementById('stf_role').value.trim() || (staffType === 'Academic' ? 'Teacher' : staffType);
  const salary = parseInt(document.getElementById('stf_salary').value) || 0;
  const hireDate = document.getElementById('stf_hire').value || today();
  const dob = document.getElementById('stf_dob').value;
  const subjectsSel = staffType === 'Academic'
    ? Array.from(document.getElementById('stf_subjects').selectedOptions).map(o => o.value)
    : [];
  const classSel = staffType === 'Academic'
    ? Array.from(document.getElementById('stf_class').selectedOptions).map(o => o.value)
    : [];
  const bankName = document.getElementById('stf_bankName').value.trim();
  const bankAcc = document.getElementById('stf_bankAcc').value.trim();
  if (!name || !phone) { toast('Name and phone are required', 'danger'); return; }
  const permissions = Array.from(document.querySelectorAll('[data-stfperm]')).filter(c => c.checked).map(c => c.dataset.stfperm);
  const roleId = (document.getElementById('stf_roleId') || {}).value || null;
  // Generate temporary password (mock)
  const tempPassword = 'Caspaa' + Math.floor(Math.random() * 9000 + 1000);
  const username = email || phone; // fall back to phone if no email
  const channels = email ? ['email', 'whatsapp'] : ['whatsapp'];
  DB.insert('teachers', {
    id: uid('tch'), schoolId: AUTH.current.schoolId || AUTH.current.id,
    name, email, phone,
    staffType, role, roleId,
    subjects: subjectsSel,
    classes: classSel,
    salary, hireDate, dob,
    bank: bankName ? { name: bankName, account: bankAcc } : null,
    documents: Object.assign({}, _staffDocsBuffer),
    permissions,
    invitation: { username, tempPassword, sentAt: now(), accepted: false, channels }
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  // Show invitation confirmation
  modal({
    title: 'Staff Added · Invitation Sent',
    body: `
      <div class="text-center py-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">${icon('check','w-8 h-8')}</div>
        <h3 class="text-lg font-bold">${name} added</h3>
        <p class="text-sm text-slate-500 mt-1">Login credentials sent via WhatsApp + Email.</p>
      </div>
      <div class="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">Username</span><code class="text-xs">${username}</code></div>
        <div class="flex justify-between"><span class="text-slate-500">Temp Password</span><code class="text-xs">${tempPassword}</code></div>
        <div class="flex justify-between"><span class="text-slate-500">Channels</span><span class="text-xs">${channels.join(' · ')}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Permissions</span><span class="text-xs">${permissions.length} modules</span></div>
      </div>
      <p class="text-xs text-slate-400 text-center mt-3">${name.split(' ').slice(-1)} will be asked to change the password on first login.</p>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Done</button>`
  });
}

/* ---------- Classes ---------- */
function view_adm_classes() {
  const classes = DB.get('classes');
  return `
    ${pageHeader({
      title: 'Classes',
      subtitle: 'Manage classes, class teachers, and curriculum',
      actions: `
        <button class="btn btn-secondary" onclick="APP.go('adm_academic', { academicTab: 'curriculum' })">${icon('book','w-4 h-4')} Set Curriculum</button>
        <button class="btn btn-primary" onclick="addClassModal()">${icon('plus','w-4 h-4')} Add Class</button>
      `
    })}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${classes.map(c => {
        const studentCount = COMPUTE.studentsByClass(c.id).length;
        const teacher = DB.find('teachers', c.teacherId);
        const subjectCount = (c.offeredSubjects || []).length;
        return `
          <div class="card card-hover p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="badge badge-info">${c.level}</span>
                <h3 class="font-bold text-lg text-slate-900 mt-2">${c.name}</h3>
              </div>
              <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">${icon('classes','w-6 h-6')}</div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-slate-600">
                ${icon('students','w-4 h-4')}<span>${studentCount} student${studentCount !== 1 ? 's' : ''}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-600">
                ${icon('teacher','w-4 h-4')}<span class="truncate">${teacher ? teacher.name : '— No form teacher —'}</span>
              </div>
              <div class="flex items-center gap-2 ${subjectCount ? 'text-slate-600' : 'text-amber-700'}">
                ${icon('book','w-4 h-4')}<span>${subjectCount ? subjectCount + ' subjects in curriculum' : '<button class="underline" onclick="event.stopPropagation(); APP.go(\'adm_academic\', { academicTab: \'curriculum\' })">Set curriculum</button>'}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-1.5 mt-3">
              <button class="btn btn-secondary !py-1.5 text-xs" onclick="APP.go('adm_people', { peopleTab: 'students', classFilter: '${c.id}' })">Students</button>
              <button class="btn btn-secondary !py-1.5 text-xs" onclick="APP.go('adm_academic', { academicTab: 'timetable', classId: '${c.id}' })">Timetable</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function addClassModal() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  modal({
    title: 'Add New Class',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Class Name</label><input id="cl_name" class="input" placeholder="e.g. SSS 2" /></div>
        <div><label class="input-label">Level</label>
          <select id="cl_level" class="input"><option>Nursery</option><option>Primary</option><option>Secondary</option></select>
        </div>
        <div><label class="input-label">Class Teacher</label>
          <select id="cl_teacher" class="input">
            <option value="">— Unassigned —</option>
            ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveClass()">Save Class</button>`
  });
}

function saveClass() {
  const name = document.getElementById('cl_name').value.trim();
  const level = document.getElementById('cl_level').value;
  const teacherId = document.getElementById('cl_teacher').value || null;
  if (!name) { toast('Class name required', 'danger'); return; }
  DB.insert('classes', { id: uid('cls'), schoolId: currentSchoolId(), name, level, teacherId });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} created`);
}

/* ---------- Timetable ---------- */
function view_adm_timetable() {
  const view = APP.params.ttView || 'class';
  if (view === 'school') return renderSchoolWideTimetable();
  const classes = DB.get('classes');
  const classId = APP.params.classId || classes[0].id;
  const tt = DB.query('timetable', t => t.classId === classId);
  const subjects = DB.get('subjects');
  const teachers = DB.query('teachers', t => t.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];

  return `
    ${pageHeader({
      title: 'Timetable',
      subtitle: 'Click any empty cell to add a period, or upload an entire week',
      actions: `
        <button class="btn btn-secondary" onclick="APP.params.ttView='school'; APP.render()">${icon('calendar','w-4 h-4')} Whole-School View</button>
        <button class="btn btn-secondary" onclick="bulkTimetableUploadModal()">${icon('upload','w-4 h-4')} Bulk Upload CSV</button>
        <button class="btn btn-primary" onclick="quickBuildTimetableModal('${classId}')">${icon('calendar','w-4 h-4')} Build Week</button>
      `
    })}
    <div class="card p-4 mb-4">
      <label class="input-label">Class</label>
      <select class="input max-w-xs" onchange="APP.go('adm_timetable', { classId: this.value, ttView: 'class' })">
        ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm text-blue-900">
      ${icon('check','w-4 h-4 inline')} <strong>Tip:</strong> Click any dashed (empty) cell to add a period. Click a filled cell to edit or remove it. Use <strong>Build Week</strong> to fill the whole grid in one go, or <strong>Bulk Upload</strong> for many classes from CSV.
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr><th>Period</th>${days.map(d => `<th>${d}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${periods.map(p => {
              const periodEntries = days.map(d => tt.find(t => t.day === d && t.period === p));
              // Show all 8 periods, not just filled ones — they're all clickable
              return `<tr>
                <td><strong class="text-slate-900">P${p}</strong><br><span class="text-xs text-slate-500">${periodEntries.find(Boolean) ? periodEntries.find(Boolean).time : ''}</span></td>
                ${days.map((d, i) => {
                  const e = periodEntries[i];
                  if (!e) {
                    return `<td class="cursor-pointer hover:bg-brand-50 transition border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-lg" onclick="addPeriodModal('${classId}', '${d}', ${p})">
                      <div class="text-center text-slate-300 hover:text-brand-600 py-3">${icon('plus','w-4 h-4 mx-auto')}<div class="text-xs">add</div></div>
                    </td>`;
                  }
                  const sub = subjects.find(s => s.id === e.subjectId);
                  const tch = teachers.find(t => t.id === e.teacherId);
                  return `<td class="cursor-pointer hover:bg-slate-50" onclick="editTimetableCell('${e.id}')">
                    <div class="font-semibold text-slate-900">${sub ? sub.name : '—'}</div>
                    <div class="text-xs text-slate-500">${tch ? tch.name.split(' ').slice(-1).join('') : ''}</div>
                  </td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${tt.length === 0 ? emptyState({ title: 'No periods scheduled', body: 'Add periods to build the timetable.', icon: 'calendar' }) : ''}
      </div>
    </div>
  `;
}

function renderSchoolWideTimetable() {
  const classes = DB.get('classes');
  const tt = DB.get('timetable');
  const subjects = DB.get('subjects');
  const teachers = DB.get('teachers');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];

  return `
    ${pageHeader({
      title: 'Whole-School Timetable',
      subtitle: 'Every class · every period · all in one view',
      actions: `
        <button class="btn btn-secondary" onclick="APP.params.ttView='class'; APP.render()">${icon('arrow_left','w-4 h-4')} Class View</button>
        <button class="btn btn-secondary" onclick="bulkTimetableUploadModal()">${icon('upload','w-4 h-4')} Bulk Upload</button>
      `
    })}
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr>
              <th>Class</th>
              ${days.map(d => `<th colspan="${Math.max(2, periods.length)}">${d}</th>`).join('')}
            </tr>
            <tr style="background:#f8fafc">
              <th></th>
              ${days.map(d => periods.slice(0, 2).map(p => `<th class="text-center text-xs">P${p}</th>`).join('')).join('')}
            </tr>
          </thead>
          <tbody>
            ${classes.map(c => `<tr>
              <td><strong>${c.name}</strong></td>
              ${days.map(d => periods.slice(0, 2).map(p => {
                const entry = tt.find(t => t.classId === c.id && t.day === d && t.period === p);
                if (!entry) return '<td class="text-slate-300 text-center text-xs">—</td>';
                const sub = subjects.find(x => x.id === entry.subjectId);
                const tch = teachers.find(t => t.id === entry.teacherId);
                return `<td class="text-center" style="min-width:90px">
                  <div class="font-semibold text-xs">${sub ? sub.name.split(' ')[0] : ''}</div>
                  <div class="text-xs text-slate-500">${tch ? tch.name.split(' ').slice(-1).join('') : ''}</div>
                </td>`;
              }).join('')).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="text-xs text-slate-500 mt-3">Showing first 2 periods of each day for compactness. Click <strong>Class View</strong> to see all 8 periods for a single class.</p>
  `;
}

function bulkTimetableUploadModal() {
  modal({
    title: 'Bulk Upload Timetable',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Upload a CSV with the entire weekly schedule. Rows are periods. Existing periods for the same class/day/period will be replaced.
        </div>

        <input type="file" id="bulk_tt_file" accept=".csv" class="hidden" onchange="handleBulkTimetable(event)" />
        <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 cursor-pointer" onclick="document.getElementById('bulk_tt_file').click()">
          ${icon('upload','w-12 h-12 mx-auto text-slate-400 mb-2')}
          <p class="font-semibold text-slate-700 mb-1">Click to choose timetable CSV</p>
          <button type="button" class="btn btn-primary mt-2" onclick="event.stopPropagation(); document.getElementById('bulk_tt_file').click()">Choose file</button>
        </div>

        <button type="button" class="btn btn-secondary w-full" onclick="downloadTimetableTemplate()">${icon('download','w-4 h-4')} Download Template</button>

        <details class="text-sm">
          <summary class="cursor-pointer font-semibold">Required columns</summary>
          <ul class="mt-2 text-slate-600 space-y-1 list-disc list-inside">
            <li><strong>Class</strong> — must match an existing class name (e.g. JSS 1)</li>
            <li><strong>Day</strong> — Monday to Friday</li>
            <li><strong>Period</strong> — 1 through 8</li>
            <li><strong>Time</strong> — e.g. 08:00-08:40</li>
            <li><strong>Subject</strong> — must match an existing subject</li>
            <li><strong>Teacher Email</strong> — must match an existing teacher's email</li>
          </ul>
        </details>
      </div>
    `
  });
}

function downloadTimetableTemplate() {
  const sample = [
    'Class,Day,Period,Time,Subject,Teacher Email',
    'JSS 1,Monday,1,08:00-08:40,Mathematics,adamu@brightlights.ng',
    'JSS 1,Monday,2,08:40-09:20,English Language,chioma@brightlights.ng',
    'JSS 1,Tuesday,1,08:00-08:40,Basic Science,emeka@brightlights.ng'
  ].join('\n');
  const blob = new Blob([sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_timetable_template.csv'; a.click();
  toast('Template downloaded');
}

function handleBulkTimetable(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast('Empty or invalid CSV', 'danger'); return; }
    const classes = DB.get('classes');
    const subjects = DB.get('subjects');
    const teachers = DB.get('teachers');
    let added = 0, replaced = 0, skipped = 0;
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const [className, day, periodStr, time, subjectName, teacherEmail] = cols;
      const cls = classes.find(c => c.name.toLowerCase().replace(/\s+/g, '') === (className || '').toLowerCase().replace(/\s+/g, ''));
      if (!cls) { errors.push(`Row ${i+1}: class "${className}" not found`); skipped++; continue; }
      const sub = subjects.find(s => s.name.toLowerCase() === (subjectName || '').toLowerCase());
      if (!sub) { errors.push(`Row ${i+1}: subject "${subjectName}" not found`); skipped++; continue; }
      const tch = teachers.find(t => t.email && t.email.toLowerCase() === (teacherEmail || '').toLowerCase());
      if (!tch) { errors.push(`Row ${i+1}: teacher "${teacherEmail}" not found`); skipped++; continue; }
      const period = parseInt(periodStr);
      // Replace if exists
      const existing = DB.query('timetable', t => t.classId === cls.id && t.day === day && t.period === period)[0];
      if (existing) { DB.update('timetable', existing.id, { time, subjectId: sub.id, teacherId: tch.id }); replaced++; }
      else { DB.insert('timetable', { id: uid('tt'), schoolId: currentSchoolId(), classId: cls.id, day, period, time, subjectId: sub.id, teacherId: tch.id }); added++; }
    }
    document.getElementById('modalBackdrop').click();
    APP.render();
    if (errors.length) {
      modal({
        title: `Imported ${added + replaced} periods, ${skipped} skipped`,
        body: `<div class="space-y-2">
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">${added} new · ${replaced} replaced · ${skipped} skipped</div>
          <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm"><strong>Errors:</strong>${errors.slice(0, 10).map(e => `<div>• ${e}</div>`).join('')}</div>
        </div>`,
        footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">OK</button>`
      });
    } else toast(`Imported ${added + replaced} timetable entries`, 'success');
  };
  reader.readAsText(file);
}

function addPeriodModal(classId, preDay, prePeriod) {
  const subjects = DB.get('subjects');
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId() && t.staffType === 'Academic');
  // Suggested time slot per period
  const timeSlots = { 1: '08:00-08:40', 2: '08:40-09:20', 3: '09:20-10:00', 4: '10:20-11:00', 5: '11:00-11:40', 6: '11:40-12:20', 7: '13:00-13:40', 8: '13:40-14:20' };
  const defaultTime = prePeriod ? timeSlots[prePeriod] : '08:00-08:40';
  modal({
    title: 'Add Timetable Period',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Day</label>
            <select id="tt_day" class="input">${['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => `<option ${preDay === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Period #</label>
            <select id="tt_period" class="input">${[1,2,3,4,5,6,7,8].map(i => `<option ${prePeriod === i ? 'selected' : ''}>${i}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label">Time</label><input id="tt_time" class="input" value="${defaultTime}" /></div>
        <div><label class="input-label">Subject</label>
          <select id="tt_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Teacher</label>
          <select id="tt_teacher" class="input">${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="savePeriod('${classId}')">Add Period</button>`
  });
}

function editTimetableCell(periodId) {
  const e = DB.find('timetable', periodId);
  if (!e) return;
  const subjects = DB.get('subjects');
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId() && t.staffType === 'Academic');
  modal({
    title: 'Edit Period',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3 text-sm">${e.day} · Period ${e.period}</div>
        <div><label class="input-label">Time</label><input id="tte_time" class="input" value="${e.time}" /></div>
        <div><label class="input-label">Subject</label>
          <select id="tte_subject" class="input">${subjects.map(s => `<option value="${s.id}" ${e.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Teacher</label>
          <select id="tte_teacher" class="input">${teachers.map(t => `<option value="${t.id}" ${e.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-danger" onclick="deletePeriod('${periodId}')">${icon('trash','w-4 h-4')} Remove</button>
             <button class="btn btn-primary" onclick="updatePeriod('${periodId}')">${icon('check','w-4 h-4')} Save</button>`
  });
}

function updatePeriod(periodId) {
  DB.update('timetable', periodId, {
    time: document.getElementById('tte_time').value,
    subjectId: document.getElementById('tte_subject').value,
    teacherId: document.getElementById('tte_teacher').value
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Period updated');
}

function deletePeriod(periodId) {
  DB.remove('timetable', periodId);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Period removed', 'info');
}

function quickBuildTimetableModal(classId) {
  const cls = DB.find('classes', classId);
  const subjects = DB.get('subjects');
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId() && t.staffType === 'Academic');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4];
  const existing = DB.query('timetable', t => t.classId === classId);
  const timeSlots = { 1: '08:00-08:40', 2: '08:40-09:20', 3: '09:20-10:00', 4: '10:20-11:00' };

  modal({
    title: 'Build Week — ' + cls.name,
    size: 'xl',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Fill each cell with a subject and teacher. Empty cells stay empty. <strong>Showing periods 1-4</strong> — add more after saving these.
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead><tr>
              <th class="p-2"></th>
              ${days.map(d => `<th class="p-2 text-left text-slate-700">${d}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${periods.map(p => `<tr>
                <td class="p-2 font-bold text-slate-700">P${p}<div class="text-xs font-normal text-slate-500">${timeSlots[p]}</div></td>
                ${days.map(d => {
                  const e = existing.find(x => x.day === d && x.period === p);
                  return `<td class="p-1">
                    <select class="input !py-1 !px-2 text-xs mb-1" data-cell-sub="${d}_${p}">
                      <option value="">— empty —</option>
                      ${subjects.map(s => `<option value="${s.id}" ${e && e.subjectId === s.id ? 'selected' : ''}>${s.name.split(' ')[0]}</option>`).join('')}
                    </select>
                    <select class="input !py-1 !px-2 text-xs" data-cell-tch="${d}_${p}">
                      <option value="">— teacher —</option>
                      ${teachers.map(t => `<option value="${t.id}" ${e && e.teacherId === t.id ? 'selected' : ''}>${t.name.split(' ').slice(-1).join('')}</option>`).join('')}
                    </select>
                  </td>`;
                }).join('')}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveQuickBuildTimetable('${classId}')">${icon('check','w-4 h-4')} Save Week</button>`
  });
}

function saveQuickBuildTimetable(classId) {
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4];
  const timeSlots = { 1: '08:00-08:40', 2: '08:40-09:20', 3: '09:20-10:00', 4: '10:20-11:00' };
  let added = 0, removed = 0;
  days.forEach(d => periods.forEach(p => {
    const subId = (document.querySelector(`[data-cell-sub="${d}_${p}"]`) || {}).value || '';
    const tchId = (document.querySelector(`[data-cell-tch="${d}_${p}"]`) || {}).value || '';
    const existing = DB.query('timetable', t => t.classId === classId && t.day === d && t.period === p)[0];
    if (subId && tchId) {
      if (existing) DB.update('timetable', existing.id, { subjectId: subId, teacherId: tchId, time: timeSlots[p] });
      else { DB.insert('timetable', { id: uid('tt'), schoolId: currentSchoolId(), classId, day: d, period: p, time: timeSlots[p], subjectId: subId, teacherId: tchId }); added++; }
    } else if (existing) {
      DB.remove('timetable', existing.id); removed++;
    }
  }));
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Week saved · ${added} added · ${removed} removed`);
}

function savePeriod(classId) {
  const day = document.getElementById('tt_day').value;
  const period = parseInt(document.getElementById('tt_period').value);
  const time = document.getElementById('tt_time').value;
  const subjectId = document.getElementById('tt_subject').value;
  const teacherId = document.getElementById('tt_teacher').value;
  // Conflict detection: teacher already booked at this time
  const conflict = DB.query('timetable', t => t.teacherId === teacherId && t.day === day && t.period === period);
  if (conflict.length) { toast(`Conflict: teacher is already teaching ${day} P${period}`, 'danger'); return; }
  DB.insert('timetable', { id: uid('tt'), schoolId: currentSchoolId(), classId, day, period, time, subjectId, teacherId });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Period added');
}

/* ---------- Attendance (admin overview) ---------- */
function view_adm_attendance() {
  const classes = DB.get('classes');
  const classId = APP.params.classId || classes[0].id;
  const date = APP.params.date || today();
  const cls = DB.find('classes', classId);
  const students = COMPUTE.studentsByClass(classId);
  const recs = COMPUTE.classAttendance(classId, date);

  return `
    ${pageHeader({
      title: 'Attendance Overview',
      subtitle: `View and audit attendance records school-wide`
    })}
    <div class="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
      <div><label class="input-label">Class</label>
        <select class="input" onchange="APP.params.classId = this.value; APP.render()">
          ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div><label class="input-label">Date</label>
        <input type="date" class="input" value="${date}" onchange="APP.go('adm_attendance', { classId: '${classId}', date: this.value })" />
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-900">${cls.name} · ${fdate(date, { long: true })}</h3>
        <div class="flex gap-2">
          <span class="badge badge-success">${recs.filter(r => r.status === 'present').length} Present</span>
          <span class="badge badge-warn">${recs.filter(r => r.status === 'late').length} Late</span>
          <span class="badge badge-danger">${recs.filter(r => r.status === 'absent').length} Absent</span>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>Student</th><th>Status</th><th>Marked at</th></tr></thead>
        <tbody>
          ${students.map(s => {
            const r = recs.find(x => x.studentId === s.id);
            return `<tr><td>
              <div class="flex items-center gap-2">${avatar(s.name,'sm')}<span class="font-medium">${s.name}</span></div>
            </td><td>${r ? statusBadge(r.status) : '<span class="text-slate-400 text-sm">Not marked</span>'}</td>
            <td class="text-sm text-slate-500">${r ? (r.markedAt || '—') : '—'}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Results overview ---------- */
function view_adm_results() {
  const classes = DB.get('classes');
  const classId = APP.params.classId || (classes.length ? classes[0].id : '');
  const subjects = DB.get('subjects');
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId);
  const pending = results.filter(r => !r.approved);

  return `
    ${pageHeader({
      title: 'Results',
      subtitle: 'Broadsheet view, approvals, and reports',
      actions: `<button class="btn btn-secondary" onclick="exportBroadsheet('${classId}')">${icon('download','w-4 h-4')} Export PDF</button>`
    })}
    <div class="card p-4 mb-4">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1">
          <label class="input-label">Class</label>
          <select class="input" onchange="APP.params.classId = this.value; APP.render()">
            ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        ${pending.length ? `<button class="btn btn-primary" onclick="approveAllResults('${classId}')">${icon('check','w-4 h-4')} Approve ${pending.length} pending</button>` : ''}
      </div>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr><th>Student</th>${subjects.map(s => `<th class="text-center">${s.name.split(' ')[0]}</th>`).join('')}<th class="text-center">Avg</th><th class="text-center">Pos</th><th class="text-center">Result</th></tr>
          </thead>
          <tbody>
            ${(() => {
              const studentsWithAvg = students.map(s => {
                const sRes = results.filter(r => r.studentId === s.id);
                const avg = sRes.length ? Math.round(sRes.reduce((sum, r) => sum + (r.total || r.score || 0), 0) / sRes.length) : 0;
                return Object.assign({}, s, { _avg: avg });
              }).sort((a, b) => b._avg - a._avg);
              let _rank = 1;
              const ranked = studentsWithAvg.map((s, i) => {
                if (i > 0 && s._avg < studentsWithAvg[i-1]._avg) _rank = i + 1;
                return Object.assign({}, s, { _rank });
              });
              return ranked.map(s => {
                const studRes = results.filter(r => r.studentId === s.id);
                return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span class="font-medium">${s.name}</span></div></td>
                ${subjects.map(sub => {
                  const r = studRes.find(x => x.subjectId === sub.id);
                  if (!r) return '<td class="text-center text-slate-300">—</td>';
                  return `<td class="text-center"><strong>${r.total}</strong> <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'} ml-1">${r.grade}</span></td>`;
                }).join('')}
                <td class="text-center font-bold">${s._avg}%</td>
                <td class="text-center">${s._rank}</td>
                <td class="text-center">${studRes.length
                  ? `<button class="btn btn-primary !py-1 !px-2 text-xs" title="Generate this student's result and share with the parent" onclick="generateStudentResult('${s.id}')">${icon('send','w-3.5 h-3.5')} Generate</button>`
                  : `<span class="text-xs text-slate-400">No scores</span>`}</td>
              </tr>`;
              }).join('');
            })()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function approveAllResults(classId) {
  DB.query('results', r => r.classId === classId && !r.approved).forEach(r => DB.update('results', r.id, { approved: true }));
  APP.render();
  toast('All pending results approved', 'success');
}

function generateStudentResult(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  // Check if a class-teacher comment already exists
  const existing = DB.query('reportComments', rc => rc.studentId === studentId && rc.term === DB.settings().currentTerm)[0];
  if (existing) {
    _publishStudentResult(studentId);
  } else {
    // Require a comment before publishing
    reportCommentModal(studentId, () => _publishStudentResult(studentId));
  }
}

function reportCommentModal(studentId, onSave) {
  const s = DB.find('students', studentId);
  const results = COMPUTE.studentResults(studentId);
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  // AI suggestion banks
  const aiBanks = {
    A: [`${s.name.split(' ')[0]} has shown outstanding academic commitment this term. We are very proud of this performance. Keep it up!`,
        `An exceptional term from ${s.name.split(' ')[0]}. Their dedication, discipline and hard work are commendable. We look forward to continued excellence.`],
    B: [`${s.name.split(' ')[0]} has performed very well this term and has shown great improvement. With consistent effort this result can be bettered.`,
        `A very good term for ${s.name.split(' ')[0]}. We are pleased with the progress made and encourage continued focus in all subjects.`],
    C: [`${s.name.split(' ')[0]} has shown satisfactory performance this term. We encourage more revision at home and full participation in class to achieve better results.`,
        `There is clear potential here. ${s.name.split(' ')[0]} should focus on weaker subjects and seek extra help where needed.`],
    F: [`${s.name.split(' ')[0]} requires urgent improvement. We strongly encourage additional tutoring, consistent study habits, and closer parental monitoring.`,
        `A challenging term. ${s.name.split(' ')[0]}'s teachers are ready to provide extra support. Please ensure regular attendance and completion of all assignments.`]
  };
  const band = avg >= 75 ? 'A' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : 'F';
  const aiSuggestion = aiBanks[band][0];
  modal({
    title: `Report Comment — ${s.name}`,
    body: `
      <div class="space-y-4">
        <div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          ${avatar(s, 'md')}
          <div>
            <div class="font-semibold text-slate-900">${s.name}</div>
            <div class="text-xs text-slate-500">${DB.settings().currentTerm} · Average: <strong>${avg}%</strong></div>
          </div>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          ${icon('info','w-4 h-4 inline mr-1')} A class teacher or head teacher comment is <strong>required</strong> before this result can be published and shared with the parent.
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="input-label">Teacher's Comment</label>
            <button class="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1" onclick="injectAiComment()">
              ${icon('ai','w-3.5 h-3.5')} AI suggest
            </button>
          </div>
          <textarea id="rpt_comment" rows="4" class="input" placeholder="Write a comment about this student's overall performance, conduct, and areas for improvement…">${aiSuggestion}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Class Teacher</label>
            <input id="rpt_classTeacher" class="input" placeholder="Teacher's name" value="${DB.query('teachers', t => t.schoolId === currentSchoolId() && t.staffType === 'Academic')[0]?.name || ''}" />
          </div>
          <div>
            <label class="input-label">Head Teacher / Principal</label>
            <input id="rpt_headTeacher" class="input" placeholder="Head teacher's name" value="Mrs. Patricia Akande" />
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveReportComment('${studentId}')">${icon('check','w-4 h-4')} Save & Generate</button>`
  });
  // Store callback for after save
  window._onReportCommentSaved = onSave;
}

function injectAiComment() {
  const el = document.getElementById('rpt_comment');
  if (!el) return;
  el.value = '';
  const text = el.getAttribute('placeholder') || 'A good student.';
  let i = 0;
  el.placeholder = 'AI is typing…';
  const timer = setInterval(() => {
    if (i >= text.length) { clearInterval(timer); el.placeholder = ''; return; }
    el.value += text[i++];
  }, 18);
  toast('AI comment generated — edit before saving', 'info');
}

function saveReportComment(studentId) {
  const comment = document.getElementById('rpt_comment').value.trim();
  const classTeacher = document.getElementById('rpt_classTeacher').value.trim();
  const headTeacher = document.getElementById('rpt_headTeacher').value.trim();
  if (!comment) { toast('Please write a comment before publishing', 'danger'); return; }
  // Remove any existing comment for this term
  DB.query('reportComments', rc => rc.studentId === studentId && rc.term === DB.settings().currentTerm)
    .forEach(rc => DB.remove('reportComments', rc.id));
  DB.insert('reportComments', {
    id: uid('rc'), schoolId: currentSchoolId(), studentId, term: DB.settings().currentTerm,
    comment, classTeacher, headTeacher, createdBy: AUTH.current.id, createdAt: now()
  });
  document.getElementById('modalBackdrop').click();
  toast('Comment saved', 'success');
  if (typeof window._onReportCommentSaved === 'function') {
    setTimeout(() => { window._onReportCommentSaved(); window._onReportCommentSaved = null; }, 100);
  }
}

function _publishStudentResult(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  DB.query('results', r => r.studentId === studentId && !r.approved).forEach(r => DB.update('results', r.id, { approved: true }));
  printReportCard(studentId);
  if (s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId, title: 'Result Available',
      body: `${s.name}'s result for ${DB.settings().currentTerm} has been published. View and download it from your dashboard.`,
      type: 'success', channel: 'whatsapp+email', read: false, timestamp: now(), link: { view: 'par_children' }
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'generated_result', target: `${s.name} · ${DB.settings().currentTerm}`, timestamp: now() });
  toast(`${s.name}'s result generated · shared with parent via WhatsApp + email`, 'success');
}

function exportBroadsheet(classId) {
  const cls = DB.find('classes', classId);
  const subjects = DB.get('subjects').slice(0,6);
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId);
  const html = `
    <h1>Bright Lights Academy</h1>
    <h2>${cls.name} — ${DB.settings().currentTerm} Broadsheet</h2>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12px">
      <thead><tr><th>Student</th>${subjects.map(s => `<th>${s.name}</th>`).join('')}<th>Avg</th></tr></thead>
      <tbody>
        ${students.map(s => {
          const sr = results.filter(r => r.studentId === s.id);
          const avg = sr.length ? Math.round(sr.reduce((x, r) => x + r.total, 0) / sr.length) : 0;
          return `<tr><td>${s.name}</td>${subjects.map(sub => { const r = sr.find(x=>x.subjectId===sub.id); return `<td>${r ? r.total : '—'}</td>`; }).join('')}<td><strong>${avg}%</strong></td></tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  printElement(html);
}

/* ---------- Fees (admin view) ---------- */
function view_adm_fees() { return view_fin_fees(); }
function view_adm_reports() { return view_fin_reports(); }

/* ---------- Discipline ---------- */
function view_adm_discipline() {
  const records = DB.query('discipline', d => d.schoolId === currentSchoolId());
  return `
    ${pageHeader({
      title: 'Discipline & Behaviour',
      subtitle: 'Commendations, misconduct, and reward points',
      actions: `<button class="btn btn-primary" onclick="addDisciplineModal()">${icon('plus','w-4 h-4')} New Record</button>`
    })}
    <div class="card overflow-hidden">
      ${records.length === 0 ? emptyState({ title: 'No records yet', body: 'Record commendations or misconduct to track student behavior.', icon: 'check' }) : `
        <table class="tbl">
          <thead><tr><th>Student</th><th>Type</th><th>Points</th><th>Note</th><th>Date</th></tr></thead>
          <tbody>
            ${records.map(r => {
              const s = DB.find('students', r.studentId);
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s ? s.name : '?', 'sm')}<span>${s ? s.name : '—'}</span></div></td>
                <td><span class="badge ${r.type === 'commendation' ? 'badge-success' : 'badge-danger'}">${r.type}</span></td>
                <td class="font-mono font-bold ${r.points > 0 ? 'text-emerald-600' : 'text-rose-600'}">${r.points > 0 ? '+' : ''}${r.points}</td>
                <td class="text-sm">${r.note}</td>
                <td class="text-sm text-slate-500">${fdate(r.date, { short: true })}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function addDisciplineModal() {
  const students = DB.query('students', s => s.schoolId === currentSchoolId());
  modal({
    title: 'New Discipline Record',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Student</label>
          <select id="dc_student" class="input">${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Type</label>
          <select id="dc_type" class="input"><option value="commendation">Commendation</option><option value="misconduct">Misconduct</option></select>
        </div>
        <div><label class="input-label">Points</label><input id="dc_points" type="number" class="input" placeholder="e.g. 5 or -2" /></div>
        <div><label class="input-label">Note</label><textarea id="dc_note" class="input" rows="3" placeholder="What happened?"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveDiscipline()">Save Record</button>`
  });
}

function saveDiscipline() {
  const studentId = document.getElementById('dc_student').value;
  const type = document.getElementById('dc_type').value;
  const points = parseInt(document.getElementById('dc_points').value) || 0;
  const note = document.getElementById('dc_note').value.trim();
  if (!note) { toast('Please enter a note', 'danger'); return; }
  DB.insert('discipline', { id: uid('dis'), schoolId: currentSchoolId(), studentId, type, points, note, recordedBy: AUTH.current.id, date: today() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Discipline record saved');
}

/* ---------- Inventory ---------- */
function view_adm_inventory() {
  const items = DB.query('inventory', i => i.schoolId === currentSchoolId());
  const lowStock = items.filter(i => i.quantity < i.minStock);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return `
    ${pageHeader({
      title: 'Inventory',
      subtitle: 'Books, uniforms, stationery & assets',
      actions: `<button class="btn btn-primary" onclick="addInventoryModal()">${icon('plus','w-4 h-4')} Add Item</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'Total Items', value: items.length, icon: 'package', color: 'brand' })}
      ${statCard({ label: 'Total Value', value: money(totalValue), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Low Stock', value: lowStock.length, icon: 'bell', color: 'rose' })}
    </div>

    ${lowStock.length ? `<div class="card bg-amber-50 border border-amber-200 p-4 mb-4">
      <div class="flex items-start gap-3">
        <div class="text-amber-700">${icon('bell','w-5 h-5')}</div>
        <div>
          <h4 class="font-semibold text-amber-900">Stock Alert</h4>
          <p class="text-sm text-amber-800">${lowStock.length} item${lowStock.length>1?'s':''} below minimum stock level. Reorder soon to avoid shortage.</p>
        </div>
      </div>
    </div>` : ''}

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit Cost</th><th>Value</th><th>Supplier</th><th></th></tr></thead>
        <tbody>
          ${items.map(i => {
            const low = i.quantity < i.minStock;
            return `<tr>
              <td><span class="font-medium">${i.name}</span></td>
              <td><span class="badge badge-neutral">${i.category}</span></td>
              <td><span class="${low ? 'text-rose-600 font-bold' : 'font-medium'}">${i.quantity}</span> <span class="text-xs text-slate-400">/ min ${i.minStock}</span> ${low ? '<span class="badge badge-danger ml-2">LOW</span>' : ''}</td>
              <td class="font-mono">${money(i.unitCost)}</td>
              <td class="font-mono font-semibold">${money(i.quantity * i.unitCost)}</td>
              <td>${i.supplier}</td>
              <td class="text-right whitespace-nowrap">
                <button class="btn btn-ghost !p-1.5" title="Adjust stock" onclick="adjustStockModal('${i.id}')">${icon('edit','w-4 h-4')}</button>
                <button class="btn btn-ghost !p-1.5" title="History" onclick="viewInventoryHistory('${i.id}')">${icon('reports','w-4 h-4')}</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewInventoryHistory(itemId) {
  const it = DB.find('inventory', itemId);
  if (!it) return;
  const hist = (it.history || []).slice().reverse();
  modal({
    title: it.name + ' — History',
    body: `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2">
          <span class="text-sm text-slate-500">Current stock</span>
          <span class="font-bold text-lg">${it.quantity}</span>
        </div>
        ${hist.length === 0 ? emptyState({ title: 'No movements yet', icon: 'reports' }) : hist.map(h => `
          <div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
            <div class="w-9 h-9 rounded-lg ${h.delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center font-bold">${h.delta > 0 ? '+' : ''}${h.delta}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${h.reason}</div>
              <div class="text-xs text-slate-500">${fdate(h.timestamp, { time: true })}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function adjustStockModal(itemId) {
  const it = DB.find('inventory', itemId);
  if (!it) return;
  modal({
    title: 'Adjust Stock — ' + it.name,
    body: `
      <div class="space-y-3">
        <div class="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <span class="text-sm text-slate-500">Current</span>
          <span class="font-bold text-2xl">${it.quantity}</span>
        </div>
        <div>
          <label class="input-label">Change (use negative to remove, e.g. -5)</label>
          <input id="adj_delta" type="number" class="input" placeholder="+10 to add, -5 to remove" />
        </div>
        <div>
          <label class="input-label">Reason</label>
          <select id="adj_reason" class="input">
            <option>Restock from supplier</option>
            <option>Issued to class</option>
            <option>Damage / loss</option>
            <option>Returned</option>
            <option>Stocktake correction</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveStockAdjustment('${itemId}')">Apply</button>`
  });
}

function saveStockAdjustment(itemId) {
  const it = DB.find('inventory', itemId);
  const delta = parseInt(document.getElementById('adj_delta').value);
  const reason = document.getElementById('adj_reason').value;
  if (isNaN(delta) || delta === 0) { toast('Enter a non-zero number', 'danger'); return; }
  const newQty = it.quantity + delta;
  if (newQty < 0) { toast(`Cannot remove ${Math.abs(delta)} — only ${it.quantity} in stock`, 'danger'); return; }
  const history = (it.history || []).concat([{ delta, reason, by: AUTH.current.id, timestamp: now() }]);
  DB.update('inventory', itemId, { quantity: newQty, history });
  // Low-stock notification record
  if (newQty < it.minStock && it.quantity >= it.minStock) {
    DB.insert('notifications', { id: uid('not'), userId: AUTH.current.id, title: 'Low Stock Alert', body: `${it.name} dropped below minimum (${newQty}/${it.minStock})`, type: 'warn', read: false, timestamp: now() });
  }
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Stock ${delta > 0 ? 'added' : 'removed'}: ${reason}`);
}

function addInventoryModal() {
  modal({
    title: 'Add Inventory Item',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Item Name</label><input id="iv_name" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Category</label>
            <select id="iv_cat" class="input"><option>Books</option><option>Uniform</option><option>Stationery</option><option>Equipment</option><option>Other</option></select>
          </div>
          <div><label class="input-label">Supplier</label><input id="iv_sup" class="input" /></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="input-label">Quantity</label><input id="iv_qty" type="number" class="input" /></div>
          <div><label class="input-label">Min Stock</label><input id="iv_min" type="number" class="input" /></div>
          <div><label class="input-label">Unit Cost</label><input id="iv_cost" type="number" class="input" /></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveInventory()">Save Item</button>`
  });
}

function saveInventory() {
  const qty = parseInt(document.getElementById('iv_qty').value) || 0;
  const item = {
    id: uid('inv'), schoolId: currentSchoolId(),
    name: document.getElementById('iv_name').value.trim(),
    category: document.getElementById('iv_cat').value,
    supplier: document.getElementById('iv_sup').value.trim(),
    quantity: qty,
    minStock: parseInt(document.getElementById('iv_min').value) || 0,
    unitCost: parseInt(document.getElementById('iv_cost').value) || 0,
    history: [{ delta: qty, reason: 'Opening stock', by: AUTH.current.id, timestamp: now() }]
  };
  if (!item.name) { toast('Item name required', 'danger'); return; }
  DB.insert('inventory', item);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Item added to inventory');
}

/* ---------- HR Hub (Leave + Staff Attendance) ---------- */
function view_adm_hr() {
  const tab = APP.params.hrTab || 'leave';
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const leaves = DB.query('leaveRequests', l => l.schoolId === currentSchoolId());
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const today_ = today();
  const todayAttendance = DB.query('staffAttendance', a => a.schoolId === currentSchoolId() && a.date === today_);

  return `
    ${pageHeader({ title: 'HR Hub', subtitle: 'Leave requests, staff attendance, payroll snapshot' })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Staff', value: teachers.length, icon: 'teacher', color: 'brand' })}
      ${statCard({ label: 'Pending Leave', value: pendingLeaves.length, icon: 'bell', color: pendingLeaves.length ? 'gold' : 'brand' })}
      ${statCard({ label: 'In Today', value: todayAttendance.length, icon: 'check', color: 'blue' })}
      ${statCard({ label: 'Monthly Payroll', value: money(teachers.reduce((s, t) => s + (t.salary || 0), 0)), icon: 'fees', color: 'purple' })}
    </div>

    ${tabs([
      { key: 'leave',      label: 'Leave Requests', badge: pendingLeaves.length || null },
      { key: 'attendance', label: 'Staff Attendance' }
    ], tab, k => { APP.params.hrTab = k; APP.render(); })}

    <div class="pt-4">
      ${tab === 'attendance' ? renderHRAttendance() : renderHRLeave()}
      <div class="mt-4 text-center text-xs text-slate-500">
        Looking for payroll? It's been moved to <button class="text-brand-700 font-semibold underline" onclick="APP.go('adm_finance_hub', { financeTab: 'payroll' })">Finance → Payroll</button> (handled by the bursar/accountant).
      </div>
    </div>
  `;
}

function renderHRLeave() {
  const leaves = DB.query('leaveRequests', l => l.schoolId === currentSchoolId());
  const filter = APP.params.leaveFilter || 'all';
  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  return `
    <div class="flex items-center justify-between mb-3">
      <div class="flex gap-2">
        <button class="chip ${filter==='all'?'active':''}" onclick="APP.params.leaveFilter='all'; APP.render()">All ${leaves.length}</button>
        <button class="chip ${filter==='pending'?'active':''}" onclick="APP.params.leaveFilter='pending'; APP.render()">Pending</button>
        <button class="chip ${filter==='approved'?'active':''}" onclick="APP.params.leaveFilter='approved'; APP.render()">Approved</button>
        <button class="chip ${filter==='rejected'?'active':''}" onclick="APP.params.leaveFilter='rejected'; APP.render()">Rejected</button>
      </div>
      <button class="btn btn-primary text-sm" onclick="newLeaveRequestModal()">${icon('plus','w-3.5 h-3.5')} New Request</button>
    </div>
    ${filtered.length === 0 ? emptyState({ title: 'No leave requests', icon: 'calendar' }) : `
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th>Reason</th><th>Source</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${filtered.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).map(l => {
              const staff = DB.find('teachers', l.staffId);
              const days = Math.ceil((new Date(l.to) - new Date(l.from)) / 86400000) + 1;
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(staff ? staff.name : '?', 'sm')}<div><div class="font-medium text-sm">${staff ? staff.name : '—'}</div><div class="text-xs text-slate-500">${staff ? (staff.role || staff.staffType || 'Staff') : ''}</div></div></div></td>
                <td><span class="badge badge-info">${l.type}</span></td>
                <td class="text-sm">${fdate(l.from, { short: true })} – ${fdate(l.to, { short: true })} <span class="text-xs text-slate-500">(${days}d)</span></td>
                <td class="text-sm">${l.reason || '—'}</td>
                <td>${l.source === 'self' ? '<span class="badge badge-info">Staff submitted</span>' : '<span class="badge badge-neutral">Admin entered</span>'}</td>
                <td>${statusBadge(l.status === 'approved' ? 'successful' : l.status === 'rejected' ? 'failed' : 'pending')}</td>
                <td class="text-right whitespace-nowrap">
                  ${l.status === 'pending' ? `
                    <button class="btn btn-ghost !p-1.5 text-emerald-700" title="Approve" onclick="decideLeave('${l.id}', 'approved')">${icon('check','w-4 h-4')}</button>
                    <button class="btn btn-ghost !p-1.5 text-rose-600" title="Reject" onclick="decideLeave('${l.id}', 'rejected')">${icon('x','w-4 h-4')}</button>
                  ` : `<span class="text-xs text-slate-400">${fdate(l.decidedAt || l.requestedAt, { short: true })}</span>`}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function decideLeave(leaveId, decision) {
  const l = DB.find('leaveRequests', leaveId);
  const staff = DB.find('teachers', l.staffId);
  DB.update('leaveRequests', leaveId, { status: decision, decidedAt: now(), decidedBy: AUTH.current.id });
  DB.insert('auditLog', { id: uid('aud'), schoolId: l.schoolId, actor: AUTH.current.id, action: decision === 'approved' ? 'approved_leave' : 'rejected_leave', target: `${staff ? staff.name : 'staff'}: ${l.type}`, timestamp: now() });
  // Notify the staff member
  if (staff) {
    DB.insert('notifications', {
      id: uid('not'), userId: staff.id,
      title: `Leave ${decision === 'approved' ? 'Approved' : 'Declined'}`,
      body: decision === 'approved'
        ? `Your ${l.type.toLowerCase()} leave from ${fdate(l.from, { long: true })} to ${fdate(l.to, { long: true })} has been approved. Enjoy.`
        : `Your ${l.type.toLowerCase()} leave request was not approved at this time. Please speak with the proprietor.`,
      type: decision === 'approved' ? 'success' : 'warn',
      read: false, timestamp: now()
    });
  }
  toast(`${staff ? staff.name.split(' ').slice(-1) : 'Staff'} leave ${decision} · staff notified`);
  if (decision === 'approved' && staff && staff.staffType === 'Academic') {
    setTimeout(() => suggestSubstituteCoverageModal(leaveId), 400);
  } else {
    APP.render();
  }
}

function suggestSubstituteCoverageModal(leaveId) {
  const l = DB.find('leaveRequests', leaveId);
  const staffOnLeave = DB.find('teachers', l.staffId);
  if (!staffOnLeave || !staffOnLeave.subjects || !staffOnLeave.subjects.length) { APP.render(); return; }
  // Find candidate substitutes: other Academic staff who teach at least one of the same subjects
  const allTeachers = DB.query('teachers', t => t.schoolId === l.schoolId && t.id !== l.staffId && t.staffType === 'Academic');
  const candidates = allTeachers.map(t => {
    const sharedSubjects = (t.subjects || []).filter(s => staffOnLeave.subjects.includes(s));
    return { teacher: t, sharedSubjects, score: sharedSubjects.length };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
  const subjects = DB.get('subjects');
  const classesAffected = DB.get('classes').filter(c => (staffOnLeave.classes || []).includes(c.id));

  modal({
    title: 'Assign Substitute Coverage',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>${staffOnLeave.name}</strong> is on ${l.type.toLowerCase()} leave from ${fdate(l.from, { short: true })} to ${fdate(l.to, { short: true })}. We've ranked available substitutes by subject overlap.
        </div>
        <div>
          <div class="text-xs uppercase font-semibold text-slate-500 mb-1">Affected Classes</div>
          <div class="flex gap-1.5 flex-wrap">${classesAffected.map(c => `<span class="badge badge-info">${c.name}</span>`).join('') || '<span class="text-sm text-slate-500">No assigned classes</span>'}</div>
        </div>
        <div>
          <div class="text-xs uppercase font-semibold text-slate-500 mb-2">Suggested Substitutes</div>
          ${candidates.length === 0 ? '<div class="text-sm text-slate-500">No teachers found with matching subjects.</div>' : `
            <div class="space-y-2">
              ${candidates.map(c => `<button class="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-brand-50 hover:border-brand-500 border-2 border-slate-200 rounded-xl text-left transition" onclick="assignSubstitute('${leaveId}', '${c.teacher.id}')">
                ${avatar(c.teacher.name, 'sm')}
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm">${c.teacher.name}</div>
                  <div class="text-xs text-slate-500">Can cover: ${c.sharedSubjects.map(s => (subjects.find(sx => sx.id === s) || {}).name).filter(Boolean).join(', ')}</div>
                </div>
                <span class="badge badge-success">${c.score} subject${c.score !== 1 ? 's' : ''}</span>
              </button>`).join('')}
            </div>
          `}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.render()">Skip for now</button>`
  });
}

function assignSubstitute(leaveId, substituteId) {
  const l = DB.find('leaveRequests', leaveId);
  const sub = DB.find('teachers', substituteId);
  const original = DB.find('teachers', l.staffId);
  const coverageId = uid('sub');
  DB.insert('substituteCoverage', {
    id: coverageId, schoolId: l.schoolId,
    leaveId, originalTeacherId: l.staffId, substituteTeacherId: substituteId,
    from: l.from, to: l.to,
    assignedAt: now(),
    status: 'pending'  // pending until substitute accepts
  });
  DB.insert('notifications', {
    id: uid('not'), userId: substituteId,
    title: 'Substitute Assignment',
    body: `You've been asked to cover ${original.name}'s classes from ${fdate(l.from, { long: true })} to ${fdate(l.to, { long: true })}. Please accept or decline.`,
    type: 'info', read: false, timestamp: now(),
    link: { view: 'tch_dashboard' },
    actionable: { coverageId, type: 'substitute' }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: l.schoolId, actor: AUTH.current.id, action: 'assigned_substitute', target: `${sub.name} for ${original.name}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${sub.name.split(' ').slice(-1)} notified · awaiting acceptance`, 'success');
}

function decideSubstituteCoverage(coverageId, decision) {
  const cov = DB.find('substituteCoverage', coverageId);
  if (!cov) return;
  const original = DB.find('teachers', cov.originalTeacherId);
  const sub = DB.find('teachers', cov.substituteTeacherId);
  DB.update('substituteCoverage', coverageId, { status: decision, decidedAt: now() });
  // Notify the school admin
  DB.insert('notifications', {
    id: uid('not'), userId: cov.schoolId,
    title: decision === 'accepted' ? 'Substitute Accepted' : 'Substitute Declined',
    body: `${sub.name} has ${decision} the substitute assignment for ${original.name}.`,
    type: decision === 'accepted' ? 'success' : 'warn',
    read: false, timestamp: now(),
    link: { view: 'adm_workforce', params: { workforceTab: 'hr', hrTab: 'leave' } }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: cov.schoolId, actor: AUTH.current.id, action: 'substitute_' + decision, target: `${sub.name} for ${original.name}`, timestamp: now() });
  toast(`Coverage ${decision} · school notified`);
  APP.render();
}

function newLeaveRequestModal() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  modal({
    title: 'New Leave Request',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Staff</label>
          <select id="lv_staff" class="input">${teachers.map(t => `<option value="${t.id}">${t.name} — ${t.role || t.staffType}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Leave Type</label>
          <select id="lv_type" class="input"><option>Casual</option><option>Sick</option><option>Annual</option><option>Maternity</option><option>Bereavement</option><option>Study</option></select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">From</label><input id="lv_from" type="date" class="input" /></div>
          <div><label class="input-label">To</label><input id="lv_to" type="date" class="input" /></div>
        </div>
        <div><label class="input-label">Reason</label><textarea id="lv_reason" rows="2" class="input"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveLeaveRequest()">Submit</button>`
  });
}

function saveLeaveRequest() {
  const staffId = document.getElementById('lv_staff').value;
  const type = document.getElementById('lv_type').value;
  const from = document.getElementById('lv_from').value;
  const to = document.getElementById('lv_to').value;
  const reason = document.getElementById('lv_reason').value.trim();
  if (!from || !to) { toast('From and To dates required', 'danger'); return; }
  DB.insert('leaveRequests', {
    id: uid('lv'), schoolId: currentSchoolId(), staffId, type, from, to, reason,
    status: 'pending', requestedAt: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Leave request submitted');
}

function renderHRAttendance() {
  const date = APP.params.staffAttDate || today();
  const all = DB.query('staffAttendance', a => a.schoolId === currentSchoolId());
  const todayRecs = all.filter(a => a.date === date);
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const absent = teachers.filter(t => !todayRecs.find(r => r.staffId === t.id));
  const isToday = date === today();
  // 7-day attendance chart data
  const days = []; const dayCounts = [];
  for (let d = 6; d >= 0; d--) {
    const dt = daysAgo(d);
    const wd = new Date(dt).getDay();
    if (wd === 0 || wd === 6) continue;
    days.push(fdate(dt, { short: true }));
    dayCounts.push(all.filter(a => a.date === dt).length);
  }
  window.afterRender = () => {
    const c = document.getElementById('staffAttChart');
    if (c) new Chart(c, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Staff present', data: dayCounts, backgroundColor: '#10b981', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  };
  return `
    <div class="card p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
      <div class="flex-1">
        <label class="input-label">Date</label>
        <input type="date" class="input max-w-xs" value="${date}" onchange="APP.params.staffAttDate=this.value; APP.render()" />
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-success">${todayRecs.length} present</span>
        <span class="badge badge-warn">${todayRecs.filter(r => r.status === 'late').length} late</span>
        <span class="badge badge-danger">${absent.length} absent</span>
        ${isToday ? `<button class="btn btn-primary ml-2" onclick="adminMarkStaffAttendanceModal('${date}')">${icon('check','w-4 h-4')} Mark Attendance</button>` : ''}
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-900">
      <strong>How it works:</strong> Staff clock themselves in/out from their dashboard. As an admin, you can also manually record attendance from the gate sign-in book using <em>Mark Attendance</em>.
    </div>

    <div class="grid lg:grid-cols-3 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3 text-sm">7-Day Attendance Trend</h3>
        <div style="height: 200px;"><canvas id="staffAttChart"></canvas></div>
      </div>
      <div class="card p-5 lg:col-span-2 overflow-hidden">
        <h3 class="font-bold text-slate-900 mb-3 text-sm">Clock-in records · ${fdate(date, { long: true })}</h3>
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead><tr><th>Staff</th><th>Clock In</th><th>Clock Out</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>
              ${teachers.map(t => {
                const rec = todayRecs.find(r => r.staffId === t.id);
                const src = rec ? rec.source : null;
                const srcLabel = src === 'self' ? `<span class="badge badge-info">${icon('user','w-3 h-3')} Self</span>` : src === 'admin' ? `<span class="badge badge-warn">Admin</span>` : src === 'biometric' ? `<span class="badge badge-success">Biometric</span>` : '<span class="text-slate-400 text-xs">Seeded</span>';
                return `<tr>
                  <td><div class="flex items-center gap-2">${avatar(t.name, 'sm')}<div><div class="font-medium text-sm">${t.name}</div><div class="text-xs text-slate-500">${t.role || t.staffType}</div></div></div></td>
                  <td class="font-mono text-sm">${rec ? rec.clockIn : '—'}</td>
                  <td class="font-mono text-sm">${rec ? (rec.clockOut || (isToday ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg" title="Clock this staff out (gate book)" onclick="adm_clockOutStaff('${rec.id}')">${icon('logout','w-3.5 h-3.5')} Clock out</button>` : '—')) : '—'}</td>
                  <td>${rec ? srcLabel : '—'}</td>
                  <td>${rec ? statusBadge(rec.status) : statusBadge('absent')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function adm_clockOutStaff(recId) {
  const rec = DB.find('staffAttendance', recId);
  if (!rec) return;
  const clockOut = new Date().toTimeString().slice(0, 5);
  DB.update('staffAttendance', recId, { clockOut });
  const t = DB.find('teachers', rec.staffId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'staff_clock_out_admin', target: `${t ? t.name : 'Staff'} @ ${clockOut}`, timestamp: now() });
  APP.render();
  toast(`${t ? t.name.split(' ').slice(-1) : 'Staff'} clocked out at ${clockOut}`, 'success');
}

/* ---------- Admin: Mark Staff Attendance ---------- */
const _staffAttBuffer = {};
function adminMarkStaffAttendanceModal(date) {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const todayRecs = DB.query('staffAttendance', a => a.schoolId === currentSchoolId() && a.date === date);
  // Pre-populate buffer with existing
  teachers.forEach(t => {
    const rec = todayRecs.find(r => r.staffId === t.id);
    _staffAttBuffer[t.id] = rec ? rec.status : null;
  });
  const defaultIn = new Date().toTimeString().slice(0, 5);

  modal({
    title: `Mark Staff Attendance · ${fdate(date, { long: true })}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Use this when entering staff from the sign-in book at the gate. Anything after <strong>08:00</strong> is marked late by default.
        </div>
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div class="text-sm text-slate-600">${teachers.length} staff members</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary text-xs" onclick="bulkMarkStaff('present')">${icon('check','w-3 h-3')} All present</button>
            <button class="btn btn-secondary text-xs" onclick="bulkMarkStaff('absent')">${icon('x','w-3 h-3')} All absent</button>
          </div>
        </div>
        <div class="space-y-1.5 max-h-96 overflow-y-auto">
          ${teachers.map(t => {
            const rec = todayRecs.find(r => r.staffId === t.id);
            const status = rec ? rec.status : null;
            return `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl flex-wrap" id="satt_row_${t.id}">
              ${avatar(t.name, 'sm')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${t.name}</div>
                <div class="text-xs text-slate-500 truncate">${t.role || t.staffType}</div>
              </div>
              <input type="time" id="satt_time_${t.id}" class="input !w-24 !py-1 text-xs" value="${rec ? rec.clockIn : defaultIn}" />
              <div class="flex gap-1">
                <button onclick="setStaffStatus('${t.id}','present')" data-stf="${t.id}" data-st="present" class="satt-btn px-2.5 py-1 rounded-lg text-xs font-semibold border-2 ${status==='present'?'bg-emerald-500 text-white border-emerald-500':'bg-white border-slate-200 text-slate-600 hover:border-emerald-500'}">Present</button>
                <button onclick="setStaffStatus('${t.id}','late')" data-stf="${t.id}" data-st="late" class="satt-btn px-2.5 py-1 rounded-lg text-xs font-semibold border-2 ${status==='late'?'bg-amber-500 text-white border-amber-500':'bg-white border-slate-200 text-slate-600 hover:border-amber-500'}">Late</button>
                <button onclick="setStaffStatus('${t.id}','absent')" data-stf="${t.id}" data-st="absent" class="satt-btn px-2.5 py-1 rounded-lg text-xs font-semibold border-2 ${status==='absent'?'bg-rose-500 text-white border-rose-500':'bg-white border-slate-200 text-slate-600 hover:border-rose-500'}">Absent</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveStaffAttendance('${date}')">${icon('check','w-4 h-4')} Save Attendance</button>`
  });
}

function setStaffStatus(staffId, status) {
  _staffAttBuffer[staffId] = status;
  const row = document.getElementById('satt_row_' + staffId);
  if (row) {
    row.querySelectorAll('.satt-btn').forEach(b => {
      b.className = 'satt-btn px-2.5 py-1 rounded-lg text-xs font-semibold border-2 bg-white border-slate-200 text-slate-600';
      if (b.dataset.st === status) {
        const colors = { present: 'bg-emerald-500 border-emerald-500', late: 'bg-amber-500 border-amber-500', absent: 'bg-rose-500 border-rose-500' };
        b.className = 'satt-btn px-2.5 py-1 rounded-lg text-xs font-semibold border-2 text-white ' + colors[status];
      }
    });
  }
}

function bulkMarkStaff(status) {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  teachers.forEach(t => setStaffStatus(t.id, status));
}

function saveStaffAttendance(date) {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const existing = DB.query('staffAttendance', a => a.schoolId === currentSchoolId() && a.date === date);
  let saved = 0;
  teachers.forEach(t => {
    const status = _staffAttBuffer[t.id];
    if (!status) return;
    const clockIn = (document.getElementById('satt_time_' + t.id) || {}).value || '08:00';
    const cur = existing.find(e => e.staffId === t.id);
    if (status === 'absent') {
      // Remove any existing record for absences
      if (cur) DB.remove('staffAttendance', cur.id);
    } else if (cur) {
      DB.update('staffAttendance', cur.id, { status, clockIn, source: 'admin', recordedBy: AUTH.current.id });
    } else {
      DB.insert('staffAttendance', {
        id: uid('satt'), schoolId: currentSchoolId(),
        staffId: t.id, date,
        clockIn, clockOut: null,
        status, source: 'admin', recordedBy: AUTH.current.id
      });
    }
    saved++;
  });
  Object.keys(_staffAttBuffer).forEach(k => delete _staffAttBuffer[k]);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'recorded_staff_attendance', target: `${saved} entries for ${date}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Saved ${saved} staff attendance entries`, 'success');
}

function renderHRPayroll() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const total = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  return `
    <div class="card p-4 mb-4 flex items-center justify-between">
      <div>
        <div class="text-xs text-slate-500 uppercase">Monthly Payroll Total</div>
        <div class="text-2xl font-extrabold text-slate-900">${money(total)}</div>
      </div>
      <button class="btn btn-primary" onclick="toast('Payroll run queued for end of month','success')">${icon('check','w-4 h-4')} Run Payroll</button>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Staff</th><th>Role</th><th>Bank</th><th>Account</th><th>Net Salary</th></tr></thead>
        <tbody>
          ${teachers.map(t => `<tr>
            <td><div class="flex items-center gap-2">${avatar(t.name, 'sm')}<span class="font-medium text-sm">${t.name}</span></div></td>
            <td><span class="badge badge-neutral">${t.role || t.staffType || '—'}</span></td>
            <td class="text-sm">${t.bank ? t.bank.name : '—'}</td>
            <td class="text-sm"><code class="text-xs">${t.bank ? t.bank.account : '—'}</code></td>
            <td class="font-mono font-semibold">${money(t.salary || 0)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- School Settings (Branding, Academic Structure, Calendar) ---------- */
function view_adm_settings() {
  const tab = APP.params.setTab || 'branding';
  return `
    ${pageHeader({ title: 'School Settings', subtitle: 'Branding · Academic · Calendar · Notifications · Roles · AI · Payments · Backup' })}
    ${tabs([
      { key: 'branding',     label: 'Branding' },
      { key: 'academic',     label: 'Academic' },
      { key: 'calendar',     label: 'Calendar' },
      { key: 'roles',        label: 'Roles & Permissions' },
      { key: 'notifications',label: 'Notifications' },
      { key: 'ai',           label: 'AI Assistant' },
      { key: 'payments',     label: 'Payment Gateway' },
      { key: 'backup',       label: 'Data Backup' }
    ], tab, k => { APP.params.setTab = k; APP.render(); })}
    <div class="pt-4">
      ${tab === 'academic' ? renderAcademicStructure() :
        tab === 'calendar' ? renderAcademicCalendar() :
        tab === 'roles' ? renderRolesSettings() :
        tab === 'notifications' ? renderNotificationSettings() :
        tab === 'ai' ? renderAISettings() :
        tab === 'payments' ? renderPaymentSettings() :
        tab === 'backup' ? renderBackupSettings() :
        renderBrandingSettings()}
    </div>
  `;
}

function renderRolesSettings() {
  const roles = DB.query('schoolRoles', r => r.schoolId === currentSchoolId());
  const allPermissions = [
    { key: 'students', label: 'Students' }, { key: 'staff', label: 'Staff' }, { key: 'admissions', label: 'Admissions' }, { key: 'alumni', label: 'Alumni' },
    { key: 'classes', label: 'Classes' }, { key: 'curriculum', label: 'Curriculum' }, { key: 'timetable', label: 'Timetable' }, { key: 'attendance', label: 'Attendance' },
    { key: 'results', label: 'Results' }, { key: 'assignments', label: 'Assignments' }, { key: 'lesson_plans', label: 'Lesson Plans' }, { key: 'discipline', label: 'Discipline' },
    { key: 'fees', label: 'Fees' }, { key: 'invoices', label: 'Invoices' }, { key: 'payments', label: 'Payments' }, { key: 'reconciliation', label: 'Reconciliation' }, { key: 'reports', label: 'Reports' },
    { key: 'sickbay', label: 'Sick Bay' }, { key: 'visitors', label: 'Visitors' }, { key: 'library', label: 'Library' }, { key: 'inventory', label: 'Inventory' },
    { key: 'communications', label: 'Communications' }, { key: 'messaging', label: 'Messaging' }, { key: 'academic', label: 'Academic Admin' },
    { key: 'own_children', label: 'View Own Children' }, { key: 'own_fees', label: 'View Own Fees' }
  ];

  return `
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">${roles.length} role${roles.length !== 1 ? 's' : ''} defined. Assign roles to staff when creating or editing.</p>
      <button class="btn btn-primary" onclick="newRoleModal()">${icon('plus','w-4 h-4')} New Role</button>
    </div>
    <div class="grid lg:grid-cols-2 gap-3">
      ${roles.map(r => {
        const staffCount = DB.query('teachers', t => t.schoolId === currentSchoolId() && t.roleId === r.id).length;
        return `<div class="card p-4 border-l-4" style="border-left-color:${r.color}">
          <div class="flex items-start justify-between mb-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-900">${r.name}</h3>
                ${r.system ? '<span class="badge badge-neutral">System</span>' : '<span class="badge badge-info">Custom</span>'}
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${r.description}</p>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-ghost !p-1.5" title="Edit" onclick="editRoleModal('${r.id}')">${icon('edit','w-4 h-4')}</button>
              ${!r.system ? `<button class="btn btn-ghost !p-1.5 text-rose-600" title="Delete" onclick="deleteRole('${r.id}')">${icon('trash','w-4 h-4')}</button>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
            ${icon('teacher','w-3.5 h-3.5')}<span>${staffCount} staff assigned</span>
            <span>·</span>
            ${icon('settings','w-3.5 h-3.5')}<span>${r.permissions[0] === '*' ? 'All permissions' : r.permissions.length + ' modules'}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${(r.permissions[0] === '*' ? ['Unrestricted'] : r.permissions.slice(0, 6).map(p => (allPermissions.find(x => x.key === p) || {}).label || p)).map(p =>
              `<span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">${p}</span>`
            ).join('')}
            ${r.permissions.length > 6 && r.permissions[0] !== '*' ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">+${r.permissions.length - 6} more</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function newRoleModal() { roleEditorModal(null); }
function editRoleModal(roleId) { roleEditorModal(roleId); }

function roleEditorModal(roleId) {
  const existing = roleId ? DB.find('schoolRoles', roleId) : null;
  const isEdit = !!existing;
  const allPermissions = [
    { group: 'People', perms: [['students','Students'],['staff','Staff'],['admissions','Admissions'],['alumni','Alumni']] },
    { group: 'Academic', perms: [['classes','Classes'],['curriculum','Curriculum'],['timetable','Timetable'],['attendance','Attendance'],['results','Results'],['assignments','Assignments'],['lesson_plans','Lesson Plans'],['discipline','Discipline'],['academic','Academic Admin']] },
    { group: 'Finance', perms: [['fees','Fees'],['invoices','Invoices'],['payments','Payments'],['reconciliation','Reconciliation'],['reports','Reports']] },
    { group: 'Operations', perms: [['sickbay','Sick Bay'],['visitors','Visitors'],['library','Library'],['inventory','Inventory']] },
    { group: 'Communications', perms: [['communications','Announcements'],['messaging','Direct Messaging']] },
    { group: 'Parent-only', perms: [['own_children','View Own Children'],['own_fees','View Own Fees']] }
  ];
  const colors = ['#7c3aed','#0ea5e9','#06b6d4','#f59e0b','#10b981','#22c55e','#a855f7','#ef4444','#6b7280','#0891b2','#ec4899','#84cc16'];
  const has = (k) => existing ? existing.permissions.includes(k) : false;

  modal({
    title: isEdit ? `Edit Role — ${existing.name}` : 'New Role',
    size: 'lg',
    body: `
      ${existing && existing.system ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 mb-3">
        <strong>System role.</strong> You can change permissions but cannot delete or rename this role.
      </div>` : ''}
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Role Name</label><input id="ro_name" class="input" value="${existing ? existing.name : ''}" ${existing && existing.system ? 'readonly' : ''} placeholder="e.g. Sports Coordinator" /></div>
          <div><label class="input-label">Color Tag</label>
            <div class="flex gap-1.5 flex-wrap pt-1">
              ${colors.map(c => `<button type="button" class="w-7 h-7 rounded-full ${existing && existing.color === c || (!existing && c === colors[0]) ? 'ring-2 ring-offset-2 ring-slate-700' : ''}" style="background:${c}" onclick="document.querySelectorAll('[data-color]').forEach(b=>b.classList.remove('ring-2','ring-offset-2','ring-slate-700')); this.classList.add('ring-2','ring-offset-2','ring-slate-700'); this.dataset.selected='true'" data-color="${c}" ${existing && existing.color === c || (!existing && c === colors[0]) ? 'data-selected="true"' : ''}></button>`).join('')}
            </div>
          </div>
        </div>
        <div><label class="input-label">Description</label><textarea id="ro_desc" rows="2" class="input">${existing ? existing.description : ''}</textarea></div>
        <div>
          <label class="input-label">Permissions</label>
          <div class="space-y-3 max-h-72 overflow-y-auto bg-slate-50 rounded-xl p-3">
            ${allPermissions.map(group => `
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500 mb-1">${group.group}</div>
                <div class="grid grid-cols-2 gap-1.5">
                  ${group.perms.map(([k, label]) => `<label class="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" class="w-4 h-4 accent-brand-600" data-perm="${k}" ${has(k) ? 'checked' : ''} />
                    <span>${label}</span>
                  </label>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveRole(${isEdit ? "'" + roleId + "'" : 'null'})">${icon('check','w-4 h-4')} ${isEdit ? 'Save Changes' : 'Create Role'}</button>`
  });
}

function saveRole(roleId) {
  const name = document.getElementById('ro_name').value.trim();
  if (!name) { toast('Role name required', 'danger'); return; }
  const description = document.getElementById('ro_desc').value.trim();
  const selectedColor = document.querySelector('[data-selected="true"]');
  const color = selectedColor ? selectedColor.dataset.color : '#10b981';
  const permissions = Array.from(document.querySelectorAll('[data-perm]')).filter(c => c.checked).map(c => c.dataset.perm);
  if (permissions.length === 0) { toast('Select at least one permission', 'danger'); return; }
  if (roleId) {
    const existing = DB.find('schoolRoles', roleId);
    DB.update('schoolRoles', roleId, {
      name: existing.system ? existing.name : name,
      description,
      color,
      permissions: existing.permissions[0] === '*' ? ['*'] : permissions
    });
    toast(`Role "${name}" updated`);
  } else {
    DB.insert('schoolRoles', {
      id: uid('role'), schoolId: currentSchoolId(),
      name, description, color, permissions, system: false
    });
    toast(`Role "${name}" created`);
  }
  document.getElementById('modalBackdrop').click();
  APP.render();
}

function deleteRole(roleId) {
  const r = DB.find('schoolRoles', roleId);
  if (!r || r.system) { toast('System roles cannot be deleted', 'danger'); return; }
  const assigned = DB.query('teachers', t => t.schoolId === currentSchoolId() && t.roleId === roleId).length;
  if (assigned > 0) { toast(`Cannot delete — ${assigned} staff still assigned to this role`, 'danger'); return; }
  confirm(`Delete "${r.name}"? This cannot be undone.`, () => {
    DB.remove('schoolRoles', roleId);
    APP.render();
    toast('Role deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

function renderAISettings() {
  const s = DB.find('schools', AUTH.current.id) || {};
  const ai = s.aiSettings || {
    reportComments: true,
    feeReminders: true,
    attendanceRisk: true,
    performanceInsights: true,
    feeReminderDays: [7, 3, 1],
    attendanceRiskThreshold: 75
  };
  return `
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">AI-powered Features</h3>
        <div class="space-y-2">
          ${[
            { key: 'reportComments',     label: 'AI Report Comments',    desc: 'Auto-generate report card remarks based on scores' },
            { key: 'feeReminders',       label: 'AI Fee Reminders',      desc: 'Smart-time outbound reminders based on parent response history' },
            { key: 'attendanceRisk',     label: 'AI Attendance Alerts',  desc: 'Flag students at risk of chronic absence' },
            { key: 'performanceInsights',label: 'AI Performance Insights', desc: 'Highlight subjects/students needing intervention' }
          ].map(f => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <div class="font-semibold text-sm">${f.label}</div>
              <div class="text-xs text-slate-500">${f.desc}</div>
            </div>
            <input type="checkbox" class="w-5 h-5 accent-brand-600" ${ai[f.key] ? 'checked' : ''} onchange="toggleAISetting('${f.key}', this.checked)" />
          </label>`).join('')}
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">AI Performance Insights — Live</h3>
        ${(() => {
          const students = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'active');
          // Calculate at-risk students based on attendance + results
          const atRisk = students.filter(stu => {
            const rate = COMPUTE.attendanceRate(stu.id);
            const res = COMPUTE.studentResults(stu.id);
            const avg = res.length ? res.reduce((s, r) => s + r.total, 0) / res.length : 100;
            return rate < ai.attendanceRiskThreshold || avg < 50;
          });
          if (atRisk.length === 0) return `<div class="text-sm text-emerald-700 p-3 bg-emerald-50 rounded-xl">${icon('check','w-4 h-4 inline')} No students currently flagged at risk.</div>`;
          return `<p class="text-xs text-slate-500 mb-2">${atRisk.length} student${atRisk.length !== 1 ? 's' : ''} flagged for intervention</p><div class="space-y-2">${atRisk.slice(0, 6).map(stu => {
            const rate = COMPUTE.attendanceRate(stu.id);
            const res = COMPUTE.studentResults(stu.id);
            const avg = res.length ? Math.round(res.reduce((s, r) => s + r.total, 0) / res.length) : 0;
            const reasons = [];
            if (rate < ai.attendanceRiskThreshold) reasons.push(`Attendance ${rate}%`);
            if (avg < 50) reasons.push(`Average ${avg}%`);
            return `<div class="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl">
              ${avatar(stu, 'sm')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm">${stu.name}</div>
                <div class="text-xs text-amber-700">${reasons.join(' · ')}</div>
              </div>
              <button class="btn btn-ghost !p-1.5" onclick="viewStudent('${stu.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
            </div>`;
          }).join('')}</div>`;
        })()}
      </div>
    </div>
  `;
}

function toggleAISetting(key, on) {
  const s = DB.find('schools', AUTH.current.id);
  const aiSettings = Object.assign({}, s.aiSettings || {}, { [key]: on });
  DB.update('schools', s.id, { aiSettings });
  toast(`${key} ${on ? 'enabled' : 'disabled'}`);
}

function renderPaymentSettings() {
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-3">Payment Gateway Configuration</h3>
      <p class="text-sm text-slate-500 mb-4">Connect Paystack to accept payments. Funds settle to your registered school account.</p>
      <div class="space-y-3">
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-200 text-emerald-700 flex items-center justify-center">${icon('check','w-5 h-5')}</div>
          <div class="flex-1">
            <div class="font-semibold text-emerald-900">Paystack — Connected</div>
            <div class="text-xs text-emerald-700">Business name on receipts: <strong>Bright Lights Academy</strong></div>
          </div>
          <button class="btn btn-ghost text-sm">Reconnect</button>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div><label class="input-label">Public Key</label><input class="input font-mono text-xs" value="pk_test_••••••••••••••5f3a" readonly /></div>
          <div><label class="input-label">Secret Key</label><input class="input font-mono text-xs" value="sk_test_••••••••••••••" type="password" readonly /></div>
          <div><label class="input-label">Settlement Bank</label><input class="input" value="GTBank — 0123456789" readonly /></div>
          <div><label class="input-label">Webhook URL</label><input class="input font-mono text-xs" value="https://api.caspaa.com/webhooks/paystack" readonly /></div>
        </div>
      </div>
    </div>
    <div class="card p-5 mt-4">
      <h3 class="font-bold text-slate-900 mb-3">Accepted Methods</h3>
      <div class="space-y-2">
        ${[
          { name: 'Card payments (Verve, Master, Visa)', fee: '1.5% capped at ₦2,000', on: true },
          { name: 'Bank Transfer', fee: '0.5%', on: true },
          { name: 'USSD', fee: '1.5% capped at ₦2,000', on: true },
          { name: 'Apple Pay / Google Pay', fee: '1.5%', on: false }
        ].map(m => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
          <div><div class="font-semibold text-sm">${m.name}</div><div class="text-xs text-slate-500">Fee: ${m.fee}</div></div>
          <input type="checkbox" class="w-5 h-5 accent-brand-600" ${m.on ? 'checked' : ''} />
        </label>`).join('')}
      </div>
    </div>
  `;
}

function renderBackupSettings() {
  const backups = [
    { date: now(), type: 'Automatic', size: '12.3 MB', records: 4_521, status: 'completed' },
    { date: daysAgo(1), type: 'Automatic', size: '12.1 MB', records: 4_498, status: 'completed' },
    { date: daysAgo(2), type: 'Automatic', size: '12.0 MB', records: 4_480, status: 'completed' },
    { date: daysAgo(3), type: 'Automatic', size: '11.9 MB', records: 4_465, status: 'completed' },
    { date: daysAgo(7), type: 'Manual',    size: '11.4 MB', records: 4_312, status: 'completed' }
  ];
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-3">Backup & Recovery</h3>
      <p class="text-sm text-slate-500 mb-4">Automatic backups run nightly at 2 AM. Snapshots are stored in two AWS regions (Frankfurt and Cape Town) for disaster recovery.</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        ${statCard({ label: 'Last Backup', value: 'Today 02:00', icon: 'check', color: 'brand' })}
        ${statCard({ label: 'Backup Size', value: '12.3 MB', icon: 'package', color: 'blue' })}
        ${statCard({ label: 'Retention', value: '90 days', icon: 'calendar', color: 'gold' })}
        ${statCard({ label: 'Regions', value: '2', icon: 'building', color: 'purple' })}
      </div>
      <div class="flex gap-2 mb-4">
        <button class="btn btn-primary" onclick="runBackupNow()">${icon('upload','w-4 h-4')} Run Backup Now</button>
        <button class="btn btn-secondary" onclick="restoreBackupModal()">${icon('download','w-4 h-4')} Restore from Backup</button>
      </div>
      <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Recent Backups</h4>
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Type</th><th>Records</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            ${backups.map(b => `<tr>
              <td class="text-sm">${fdate(b.date, { long: true })}</td>
              <td><span class="badge ${b.type === 'Automatic' ? 'badge-info' : 'badge-neutral'}">${b.type}</span></td>
              <td>${b.records.toLocaleString()}</td>
              <td class="font-mono text-sm">${b.size}</td>
              <td>${statusBadge('successful')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function runBackupNow() {
  toast('Backup started — running in background', 'info');
  setTimeout(() => toast('Backup complete · 12.4 MB · stored in 2 regions', 'success'), 2000);
}

function restoreBackupModal() {
  modal({
    title: 'Restore from Backup',
    body: `<div class="space-y-3">
      <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
        <strong>Warning:</strong> Restoring will overwrite all current data with the snapshot you choose. This action is reversible only by restoring a newer backup. Schools are typically taken offline during a restore.
      </div>
      <div><label class="input-label">Choose Backup</label>
        <select class="input">
          <option>Today 02:00 — 12.3 MB</option>
          <option>Yesterday 02:00 — 12.1 MB</option>
          <option>2 days ago — 12.0 MB</option>
        </select>
      </div>
      <div><label class="input-label">Reason for restore</label><textarea class="input" rows="2" placeholder="e.g. Accidental bulk delete"></textarea></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-danger" onclick="document.getElementById('modalBackdrop').click(); toast('Restore request logged — Super Admin approval required', 'info')">Request Restore</button>`
  });
}

function renderBrandingSettings() {
  const school = DB.find('schools', AUTH.current.id);
  const branding = school && school.branding || {};
  return `
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">School Identity</h3>
        <div class="space-y-3">
          <div><label class="input-label">School Name</label><input id="br_name" class="input" value="${school ? school.name : ''}" /></div>
          <div><label class="input-label">Motto</label><input id="br_motto" class="input" value="${branding.motto || ''}" /></div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="input-label">Primary Color</label>
              <input id="br_color" type="color" class="input h-12" value="${branding.primaryColor || '#047857'}" />
            </div>
            <div><label class="input-label">Logo Text (fallback)</label>
              <input id="br_logoText" class="input" maxlength="3" value="${branding.logoText || ''}" />
            </div>
          </div>
          <div>
            <label class="input-label">School Logo</label>
            <input type="file" id="br_logoFile" accept="image/*" class="hidden" onchange="onLogoPick(event)" />
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-extrabold" id="br_logoPreview" style="background:${branding.primaryColor || '#047857'}">
                ${branding.logoImage ? `<img src="${branding.logoImage}" class="w-full h-full object-cover rounded-xl"/>` : (branding.logoText || '?')}
              </div>
              <button type="button" class="btn btn-secondary text-sm" onclick="document.getElementById('br_logoFile').click()">${icon('upload','w-4 h-4')} Choose</button>
              ${branding.logoImage ? `<button type="button" class="btn btn-ghost text-sm" onclick="clearLogo()">Remove</button>` : ''}
            </div>
          </div>
          <button class="btn btn-primary w-full" onclick="saveBranding()">${icon('check','w-4 h-4')} Save Branding</button>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Preview</h3>
        <div class="rounded-2xl p-5 text-white" style="background: linear-gradient(135deg, ${branding.primaryColor || '#047857'}, ${branding.primaryColor || '#047857'}cc)">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-xl font-extrabold backdrop-blur">
              ${branding.logoImage ? `<img src="${branding.logoImage}" class="w-full h-full object-cover rounded-xl"/>` : (branding.logoText || school.name.charAt(0))}
            </div>
            <div>
              <div class="text-xs opacity-80">School Operating System</div>
              <div class="text-lg font-extrabold">${school ? school.name : ''}</div>
            </div>
          </div>
          <p class="text-sm opacity-90 italic">"${branding.motto || 'Your school motto here'}"</p>
        </div>
        <p class="text-xs text-slate-500 mt-3">This branding appears on dashboards, receipts, report cards, and parent emails.</p>
      </div>
    </div>
  `;
}

let _logoBuffer = null;
function onLogoPick(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) { toast('Logo too large (max 500KB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _logoBuffer = e.target.result;
    const prev = document.getElementById('br_logoPreview');
    if (prev) prev.innerHTML = `<img src="${_logoBuffer}" class="w-full h-full object-cover rounded-xl"/>`;
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  _logoBuffer = null;
  const school = DB.find('schools', AUTH.current.id);
  if (school && school.branding) school.branding.logoImage = null;
  DB.update('schools', school.id, { branding: school.branding });
  APP.render();
  toast('Logo removed');
}

function saveBranding() {
  const school = DB.find('schools', AUTH.current.id);
  const branding = {
    primaryColor: document.getElementById('br_color').value,
    logoText: document.getElementById('br_logoText').value.trim().toUpperCase(),
    motto: document.getElementById('br_motto').value.trim(),
    logoImage: _logoBuffer !== null ? _logoBuffer : (school.branding && school.branding.logoImage) || null
  };
  const name = document.getElementById('br_name').value.trim() || school.name;
  DB.update('schools', school.id, { branding, name });
  toast('Branding saved', 'success');
  APP.render();
}

/* ---------- Term-Closing Wizard ---------- */
function termClosingWizard() {
  const schoolId = currentSchoolId();
  const currentTerm = (DB.query('academicTerms', t => t.current && t.schoolId === schoolId)[0] || {}).name || DB.settings().currentTerm;
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const pendingResults = DB.query('results', r => r.schoolId === schoolId && !r.approved).length;
  const unsettledFees = DB.query('invoices', i => i.schoolId === schoolId && i.balance > 0).length;

  modal({
    title: `Close ${currentTerm}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>End-of-term close-out.</strong> This guided flow walks you through five steps to formally end the current term and prepare for the next.
        </div>

        <div class="space-y-2">
          ${[
            { n: 1, label: 'Approve all pending results', desc: `${pendingResults} result entries awaiting approval`, action: 'Approve all', fn: 'tcw_approveResults', state: pendingResults === 0 ? 'done' : 'todo' },
            { n: 2, label: 'Generate broadsheets for every class', desc: `${DB.get('classes').length} classes · merged into one PDF`, action: 'Generate', fn: 'tcw_broadsheets', state: 'todo' },
            { n: 3, label: 'Publish report cards to parents', desc: `${students.length} report cards sent via WhatsApp + Email`, action: 'Publish all', fn: 'tcw_publishReports', state: 'todo' },
            { n: 4, label: 'Notify families with outstanding fees', desc: `${unsettledFees} families owe a balance going into next term`, action: 'Send reminders', fn: 'tcw_remindDebtors', state: unsettledFees === 0 ? 'done' : 'todo' },
            { n: 5, label: 'Promote students & set fees for next term', desc: 'Bulk promote whole classes and duplicate fee structure', action: 'Open promotion', fn: 'tcw_promote', state: 'todo' }
          ].map(s => `<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-8 h-8 rounded-full ${s.state === 'done' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600'} flex items-center justify-center font-bold flex-shrink-0">${s.state === 'done' ? icon('check','w-4 h-4') : s.n}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${s.label}</div>
              <div class="text-xs text-slate-500">${s.desc}</div>
            </div>
            <button class="btn ${s.state === 'done' ? 'btn-secondary' : 'btn-primary'} !py-1.5 text-xs whitespace-nowrap" onclick="${s.fn}()">${s.state === 'done' ? 'Re-run' : s.action}</button>
          </div>`).join('')}
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          <strong>Tip:</strong> You don't have to do this all in one sitting — steps can be done over a few days. The wizard will remember which are done.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close wizard</button>`
  });
}

function tcw_approveResults() {
  const schoolId = currentSchoolId();
  const pending = DB.query('results', r => r.schoolId === schoolId && !r.approved);
  pending.forEach(r => DB.update('results', r.id, { approved: true }));
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: AUTH.current.id, action: 'term_close_approve_results', target: `${pending.length} results`, timestamp: now() });
  toast(`Approved ${pending.length} result entries`, 'success');
  termClosingWizard();
}

function tcw_broadsheets() {
  toast('Generating broadsheets for all classes…', 'info');
  setTimeout(() => { toast(`${DB.get('classes').length} broadsheets generated · ready in Reports`, 'success'); termClosingWizard(); }, 1200);
}

function tcw_publishReports() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  students.forEach(s => {
    DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Report Card Published', body: `${s.name}'s end-of-term report card is now available. View and download from your dashboard.`, type: 'success', read: false, timestamp: now(), link: { view: 'par_children' } });
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: AUTH.current.id, action: 'term_close_publish_reports', target: `${students.length} reports`, timestamp: now() });
  toast(`Published ${students.length} report cards · parents notified`, 'success');
  termClosingWizard();
}

function tcw_remindDebtors() {
  const schoolId = currentSchoolId();
  const debtors = DB.query('invoices', i => i.schoolId === schoolId && i.balance > 0);
  debtors.forEach(inv => {
    const s = DB.find('students', inv.studentId);
    if (s) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Outstanding Fees', body: `End of term reminder: ${s.name}'s account has an outstanding balance of ${money(inv.balance)}. Please settle before next term begins.`, type: 'warn', read: false, timestamp: now(), link: { view: 'par_fees' } });
  });
  toast(`Sent reminders to ${debtors.length} families`, 'success');
  termClosingWizard();
}

function tcw_promote() {
  document.getElementById('modalBackdrop').click();
  setTimeout(() => bulkPromoteModal(), 100);
}

function renderAcademicStructure() {
  const sessions = DB.query('academicSessions', s => s.schoolId === currentSchoolId());
  const terms = DB.query('academicTerms', t => t.schoolId === currentSchoolId());
  const arms = DB.query('arms', a => a.schoolId === currentSchoolId());
  return `
    <div class="grid lg:grid-cols-3 gap-4">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Sessions</h3>
          <button class="btn btn-ghost text-sm" onclick="newSessionModal()">${icon('plus','w-3.5 h-3.5')}</button>
        </div>
        <div class="space-y-2">
          ${sessions.map(s => `<div class="p-3 ${s.current ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50'} rounded-xl">
            <div class="font-bold text-sm">${s.name} ${s.current ? '<span class="badge badge-success ml-1">Current</span>' : ''}</div>
            <div class="text-xs text-slate-500 mt-1">${fdate(s.startDate, { short: true })} → ${fdate(s.endDate, { short: true })}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Terms</h3>
          <button class="btn btn-ghost text-sm" onclick="newTermModal()">${icon('plus','w-3.5 h-3.5')}</button>
        </div>
        <div class="space-y-2">
          ${terms.map(t => {
            const sess = sessions.find(s => s.id === t.sessionId);
            return `<div class="p-3 ${t.current ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50'} rounded-xl">
              <div class="font-bold text-sm">${t.name} ${t.current ? '<span class="badge badge-success ml-1">Current</span>' : ''}</div>
              <div class="text-xs text-slate-500 mt-1">${sess ? sess.name : ''} · ${fdate(t.startDate, { short: true })} → ${fdate(t.endDate, { short: true })}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Arms (Sub-divisions)</h3>
          <button class="btn btn-ghost text-sm" onclick="newArmModal()">${icon('plus','w-3.5 h-3.5')}</button>
        </div>
        <div class="flex flex-wrap gap-2">
          ${arms.map(a => `<span class="badge badge-info">${a.name}</span>`).join('')}
        </div>
        <p class="text-xs text-slate-500 mt-3">Arms divide a class into parallel streams (e.g. JSS1A, JSS1B). They appear when creating classes.</p>
      </div>
    </div>
  `;
}

function newSessionModal() {
  modal({
    title: 'New Academic Session',
    body: `<div class="space-y-3">
      <div><label class="input-label">Name</label><input id="ses_name" class="input" placeholder="e.g. 2026/2027" /></div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="input-label">Start</label><input id="ses_start" type="date" class="input" /></div>
        <div><label class="input-label">End</label><input id="ses_end" type="date" class="input" /></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSession()">Save</button>`
  });
}

function saveSession() {
  const name = document.getElementById('ses_name').value.trim();
  if (!name) { toast('Name required', 'danger'); return; }
  DB.insert('academicSessions', { id: uid('sess'), schoolId: currentSchoolId(), name, startDate: document.getElementById('ses_start').value, endDate: document.getElementById('ses_end').value, current: false });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Session added');
}

function newTermModal() {
  const sessions = DB.query('academicSessions', s => s.schoolId === currentSchoolId());
  modal({
    title: 'New Term',
    body: `<div class="space-y-3">
      <div><label class="input-label">Session</label>
        <select id="tm_session" class="input">${sessions.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
      </div>
      <div><label class="input-label">Term Name</label>
        <select id="tm_name" class="input"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="input-label">Start</label><input id="tm_start" type="date" class="input" /></div>
        <div><label class="input-label">End</label><input id="tm_end" type="date" class="input" /></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveTerm()">Save</button>`
  });
}

function saveTerm() {
  DB.insert('academicTerms', {
    id: uid('term'), schoolId: currentSchoolId(),
    sessionId: document.getElementById('tm_session').value,
    name: document.getElementById('tm_name').value,
    startDate: document.getElementById('tm_start').value,
    endDate: document.getElementById('tm_end').value,
    current: false
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Term added');
}

function newArmModal() {
  modal({
    title: 'New Arm',
    body: `<div><label class="input-label">Arm Name (e.g. A, B, Gold)</label><input id="arm_name" class="input" /></div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveArm()">Save</button>`
  });
}

function saveArm() {
  const name = document.getElementById('arm_name').value.trim();
  if (!name) { toast('Name required', 'danger'); return; }
  DB.insert('arms', { id: uid('arm'), schoolId: currentSchoolId(), name });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Arm added');
}

function renderAcademicCalendar() {
  const events = DB.query('academicCalendar', e => e.schoolId === currentSchoolId()).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = events.filter(e => new Date(e.date) < new Date());
  return `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-slate-900">Calendar Events</h3>
      <button class="btn btn-primary text-sm" onclick="newCalendarEventModal()">${icon('plus','w-3.5 h-3.5')} Add Event</button>
    </div>
    <div class="space-y-2 mb-5">
      <h4 class="text-xs uppercase font-semibold text-slate-500">Upcoming (${upcoming.length})</h4>
      ${upcoming.length === 0 ? '<p class="text-sm text-slate-500">No upcoming events.</p>' : upcoming.map(e => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex flex-col items-center justify-center flex-shrink-0">
            <div class="text-xs font-bold">${new Date(e.date).toLocaleString('en-GB', { month: 'short' }).toUpperCase()}</div>
            <div class="text-lg font-extrabold leading-none">${new Date(e.date).getDate()}</div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold">${e.title}</div>
            <div class="text-xs text-slate-500">${fdate(e.date, { long: true })} · ${e.audience}</div>
          </div>
          <span class="badge ${e.type === 'exam' ? 'badge-danger' : e.type === 'break' ? 'badge-info' : e.type === 'meeting' ? 'badge-warn' : 'badge-neutral'}">${e.type}</span>
        </div>
      `).join('')}
    </div>
    ${past.length ? `<div class="space-y-2">
      <h4 class="text-xs uppercase font-semibold text-slate-500">Past</h4>
      ${past.slice(-5).reverse().map(e => `
        <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg opacity-60">
          <span class="text-xs text-slate-500 w-20">${fdate(e.date, { short: true })}</span>
          <span class="text-sm flex-1">${e.title}</span>
          <span class="badge badge-neutral">${e.type}</span>
        </div>
      `).join('')}
    </div>` : ''}
  `;
}

function newCalendarEventModal() {
  modal({
    title: 'Add Calendar Event',
    body: `<div class="space-y-3">
      <div><label class="input-label">Title</label><input id="cal_title" class="input" /></div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="input-label">Date</label><input id="cal_date" type="date" class="input" /></div>
        <div><label class="input-label">Type</label>
          <select id="cal_type" class="input"><option>event</option><option>exam</option><option>break</option><option>meeting</option><option>milestone</option></select>
        </div>
      </div>
      <div><label class="input-label">Audience</label>
        <select id="cal_audience" class="input"><option>all</option><option>parents</option><option>students</option><option>teachers</option></select>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveCalendarEvent()">Add</button>`
  });
}

function saveCalendarEvent() {
  const title = document.getElementById('cal_title').value.trim();
  if (!title) { toast('Title required', 'danger'); return; }
  DB.insert('academicCalendar', {
    id: uid('cal'), schoolId: currentSchoolId(),
    title,
    date: document.getElementById('cal_date').value,
    type: document.getElementById('cal_type').value,
    audience: document.getElementById('cal_audience').value
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Event added');
}

function renderNotificationSettings() {
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-3">Default Channels</h3>
      <p class="text-sm text-slate-500 mb-4">Choose default channels for outbound notifications. SMS is permanently disabled per platform decision (May 2026).</p>
      <div class="space-y-2">
        ${[
          { key: 'whatsapp', label: 'WhatsApp', desc: 'Real-time alerts to parents and teachers', on: true },
          { key: 'email', label: 'Email', desc: 'Formal notifications and weekly summaries', on: true },
          { key: 'inapp', label: 'In-app push', desc: 'Bell notification on dashboard', on: true },
          { key: 'sms', label: 'SMS', desc: 'Disabled platform-wide', on: false, locked: true }
        ].map(c => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl ${c.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}">
          <div>
            <div class="font-semibold text-sm">${c.label}</div>
            <div class="text-xs text-slate-500">${c.desc}</div>
          </div>
          <input type="checkbox" class="w-5 h-5 accent-brand-600" ${c.on ? 'checked' : ''} ${c.locked ? 'disabled' : ''} />
        </label>`).join('')}
      </div>
    </div>
    <div class="card p-5 mt-4">
      <h3 class="font-bold text-slate-900 mb-3">Automatic Triggers</h3>
      <div class="space-y-2 text-sm">
        ${[
          'Send absence alert when a student is marked absent',
          'Send late alert when a student arrives late',
          'Remind parents 7 days before fees due',
          'Remind parents 1 day before fees due',
          'Notify when assignment is posted',
          'Notify when results are published',
          'Birthday greetings on student\'s birthday'
        ].map(t => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
          <span>${t}</span>
          <input type="checkbox" class="w-5 h-5 accent-brand-600" checked />
        </label>`).join('')}
      </div>
    </div>
  `;
}

/* ---------- Online Admissions ---------- */
function view_adm_admissions() {
  const apps = DB.query('admissionApplications', a => a.schoolId === currentSchoolId());
  const filter = APP.params.appFilter || 'all';
  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  const publicLink = `caspaa.com/apply/${(AUTH.current.id || '').replace('sch_', '')}`;
  return `
    ${pageHeader({
      title: 'Online Admissions',
      subtitle: 'Receive applications, review, and convert to students',
      actions: `<button class="btn btn-secondary" onclick="copyAdmissionLink()">${icon('paperclip','w-4 h-4')} Copy public link</button>`
    })}

    <div class="card bg-gradient-to-br from-brand-700 to-brand-800 text-white p-4 mb-4">
      <div class="text-xs text-brand-200 uppercase font-semibold">Your public admission link</div>
      <div class="flex items-center gap-3 mt-1">
        <code class="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-mono flex-1">${publicLink}</code>
        <button class="btn btn-gold !py-1.5" onclick="copyAdmissionLink()">${icon('paperclip','w-4 h-4')} Copy</button>
      </div>
      <p class="text-xs text-brand-200 mt-2">Share this with prospective parents on your website, WhatsApp, or in print. They can apply without creating an account.</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Applications', value: apps.length, icon: 'plus', color: 'brand' })}
      ${statCard({ label: 'Pending Review', value: apps.filter(a => a.status === 'pending').length, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'Reviewing', value: apps.filter(a => a.status === 'reviewing').length, icon: 'chat', color: 'blue' })}
      ${statCard({ label: 'Accepted', value: apps.filter(a => a.status === 'accepted').length, icon: 'check', color: 'brand' })}
    </div>

    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${filter==='all'?'active':''}" onclick="APP.params.appFilter='all'; APP.render()">All ${apps.length}</button>
      <button class="chip ${filter==='pending'?'active':''}" onclick="APP.params.appFilter='pending'; APP.render()">Pending</button>
      <button class="chip ${filter==='reviewing'?'active':''}" onclick="APP.params.appFilter='reviewing'; APP.render()">Reviewing</button>
      <button class="chip ${filter==='accepted'?'active':''}" onclick="APP.params.appFilter='accepted'; APP.render()">Accepted</button>
      <button class="chip ${filter==='rejected'?'active':''}" onclick="APP.params.appFilter='rejected'; APP.render()">Rejected</button>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Applicant</th><th>Parent</th><th>Class</th><th>Applied</th><th>Documents</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${filtered.map(a => {
            const cls = DB.find('classes', a.requestedClass);
            const docsCount = Object.values(a.documents || {}).filter(Boolean).length;
            return `<tr class="cursor-pointer" onclick="viewApplication('${a.id}')">
              <td><div class="flex items-center gap-2">${avatar(a.applicantName, 'sm')}<div><div class="font-medium text-sm">${a.applicantName}</div><div class="text-xs text-slate-500">${a.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(a.dob)} yrs</div></div></div></td>
              <td class="text-sm">${a.parentName}<div class="text-xs text-slate-500">${a.parentPhone}</div></td>
              <td>${cls ? cls.name : '—'}</td>
              <td class="text-xs text-slate-500">${fdate(a.appliedAt, { relative: true })}</td>
              <td><span class="badge ${docsCount >= 3 ? 'badge-success' : docsCount >= 1 ? 'badge-warn' : 'badge-danger'}">${docsCount}/4</span></td>
              <td>${statusBadge(a.status === 'reviewing' ? 'pending' : a.status === 'accepted' ? 'successful' : a.status === 'rejected' ? 'failed' : 'pending')}</td>
              <td><button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); viewApplication('${a.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function copyAdmissionLink() {
  const link = `caspaa.com/apply/${(AUTH.current.id || '').replace('sch_', '')}`;
  if (navigator.clipboard) navigator.clipboard.writeText(link);
  toast('Admission link copied — share with prospective parents');
}

function viewApplication(appId) {
  const a = DB.find('admissionApplications', appId);
  if (!a) return;
  const cls = DB.find('classes', a.requestedClass);
  const docs = a.documents || {};
  const docList = [
    { key: 'birthCert',    label: 'Birth Certificate' },
    { key: 'parentId',     label: 'Parent ID' },
    { key: 'immunization', label: 'Immunization Card' },
    { key: 'photo',        label: 'Passport Photograph' }
  ];

  modal({
    title: 'Application — ' + a.applicantName,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
          ${avatar(a.applicantName, 'xl')}
          <div class="flex-1">
            <h2 class="text-lg font-bold text-slate-900">${a.applicantName}</h2>
            <p class="text-sm text-slate-500">${a.gender === 'M' ? 'Male' : 'Female'} · DOB ${fdate(a.dob, { long: true })} (${calcAge(a.dob)} yrs)</p>
            <span class="badge ${a.status === 'accepted' ? 'badge-success' : a.status === 'rejected' ? 'badge-danger' : 'badge-warn'} mt-1">${a.status}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Requested Class</div><div>${cls ? cls.name : '—'}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Current School</div><div>${a.currentSchool || '—'}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Name</div><div>${a.parentName}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Phone</div><div>${a.parentPhone}</div></div>
          <div class="col-span-2"><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Email</div><div>${a.parentEmail}</div></div>
        </div>

        <div>
          <div class="text-xs uppercase text-slate-500 font-semibold mb-1">Reason for Application</div>
          <div class="bg-slate-50 rounded-xl p-3 text-sm">${a.reason || '(not provided)'}</div>
        </div>

        <div>
          <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Required Documents</div>
          <div class="grid grid-cols-2 gap-2">
            ${docList.map(d => {
              const doc = docs[d.key];
              if (!doc) {
                return `<div class="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <span class="text-amber-600">${icon('bell','w-4 h-4')}</span>
                  <div class="flex-1">
                    <div class="font-semibold text-amber-900">${d.label}</div>
                    <div class="text-xs text-amber-700">Missing — request from parent</div>
                  </div>
                </div>`;
              }
              return `<button type="button" class="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-left hover:bg-emerald-100 transition w-full" onclick="previewAdmissionDoc('${a.id}', '${d.key}')">
                <span class="text-emerald-600 flex-shrink-0">${icon('paperclip','w-4 h-4')}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-emerald-900 truncate">${d.label}</div>
                  <div class="text-xs text-emerald-700 truncate">${doc.name} · ${doc.size}</div>
                </div>
                <span class="text-emerald-700 flex-shrink-0">${icon('search','w-4 h-4')}</span>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      ${a.status === 'pending' ? `<button class="btn btn-secondary" onclick="setAppStatus('${a.id}', 'reviewing')">Mark Reviewing</button>` : ''}
      ${a.status !== 'rejected' && a.status !== 'accepted' ? `<button class="btn btn-danger" onclick="setAppStatus('${a.id}', 'rejected')">Reject</button>` : ''}
      ${a.status !== 'accepted' ? `<button class="btn btn-primary" onclick="acceptApplication('${a.id}')">${icon('check','w-4 h-4')} Accept &amp; Enrol</button>` : ''}
    `
  });
}

function previewAdmissionDoc(appId, docKey) {
  const a = DB.find('admissionApplications', appId);
  const doc = (a.documents || {})[docKey];
  if (!doc) return;
  const docLabels = { birthCert: 'Birth Certificate', parentId: 'Parent ID', immunization: 'Immunization Card', photo: 'Passport Photograph' };
  // Generate a placeholder preview based on file type
  const isImage = doc.type && doc.type.startsWith('image/');
  const isPDF = doc.type === 'application/pdf';
  // We don't have actual file data for seed admissions, so we render a stand-in.
  // (Real student uploads from the live add-student form DO contain base64 and would render properly.)
  const placeholder = isImage
    ? `<div class="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl h-96 flex items-center justify-center"><div class="text-center">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mb-3">${icon('paperclip','w-10 h-10')}</div>
        <div class="font-bold text-slate-700">Image: ${doc.name}</div>
        <div class="text-xs text-slate-500 mt-1">${doc.size} · uploaded by parent at submission</div>
        <button class="btn btn-secondary mt-3" onclick="toast('Downloading…','info')">${icon('download','w-4 h-4')} Download original</button>
      </div></div>`
    : `<div class="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl h-96 flex items-center justify-center"><div class="text-center">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 text-3xl font-bold">PDF</div>
        <div class="font-bold text-slate-700">${doc.name}</div>
        <div class="text-xs text-slate-500 mt-1">${doc.size} · uploaded by parent at submission</div>
        <button class="btn btn-secondary mt-3" onclick="toast('Opening in new tab…','info')">${icon('download','w-4 h-4')} Open PDF</button>
      </div></div>`;

  // Close current modal and open the preview modal
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  setTimeout(() => modal({
    title: docLabels[docKey] + ' — ' + a.applicantName,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          ${avatar(a.applicantName, 'sm')}
          <div class="flex-1">
            <div class="font-semibold text-sm">${a.applicantName}</div>
            <div class="text-xs text-slate-500">Application ${a.id.toUpperCase()}</div>
          </div>
          <span class="badge ${a.status === 'pending' ? 'badge-warn' : 'badge-info'}">${a.status}</span>
        </div>
        ${placeholder}
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>${icon('check','w-3 h-3 inline')} Verified at submission</strong> — uploaded by ${a.parentName} on ${fdate(a.appliedAt, { long: true })}. File checksum on record.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); viewApplication('${appId}')">← Back to application</button>
             <button class="btn btn-primary" onclick="toast('Download started','success')">${icon('download','w-4 h-4')} Download</button>`
  }), 50);
}

function setAppStatus(appId, status) {
  DB.update('admissionApplications', appId, { status, decidedAt: now() });
  const a = DB.find('admissionApplications', appId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: status === 'rejected' ? 'rejected_application' : 'updated_application', target: a.applicantName, timestamp: now() });
  toast(`Application ${status}`);
  APP.render();
  document.getElementById('modalBackdrop')?.click();
}

function acceptApplication(appId) {
  const a = DB.find('admissionApplications', appId);
  // Create parent if not exists (by phone match)
  let parent = DB.query('parents', p => p.phone === a.parentPhone)[0];
  const isNewParent = !parent;
  if (!parent) {
    const tempPassword = 'Caspaa' + Math.floor(Math.random() * 9000 + 1000);
    parent = {
      id: uid('par'), schoolId: currentSchoolId(),
      name: a.parentName, phone: a.parentPhone, email: a.parentEmail,
      occupation: '—', monthlyIncome: 0, address: '',
      credentials: { username: a.parentPhone, tempPassword, createdAt: now() },
      firstLogin: true
    };
    DB.insert('parents', parent);
  }
  // Create student
  const admNo = 'BL/2024/' + String(DB.get('students').length + 1).padStart(3, '0');
  const newStudent = {
    id: uid('stu'), schoolId: currentSchoolId(),
    name: a.applicantName, admissionNo: admNo,
    classId: a.requestedClass, dob: a.dob, gender: a.gender,
    parentId: parent.id, bloodGroup: '—',
    admissionDate: today(), admissionType: 'new',
    status: 'active', photo: null,
    documents: {}
  };
  DB.insert('students', newStudent);

  // CHAIN FIX: auto-create the first invoice from the class's fee structure
  const fs = DB.query('feeStructures', f => f.classId === a.requestedClass)[0];
  let newInvoice = null;
  if (fs) {
    const stuActs2 = DB.query('studentActivities', sa => sa.studentId === newStudent.id && sa.term === fs.term);
    const actLines2 = stuActs2.map(sa => { const a = DB.find('activities', sa.activityId); return a ? { name: a.icon + ' ' + a.name, amount: a.price } : null; }).filter(Boolean);
    const total = fs.tuition + fs.books + fs.uniform + fs.pta + actLines2.reduce((s, l) => s + l.amount, 0);
    newInvoice = {
      id: uid('inv'),
      schoolId: currentSchoolId(),
      studentId: newStudent.id,
      term: fs.term,
      lineItems: [
        { name: 'Tuition Fee', amount: fs.tuition },
        { name: 'Books & Materials', amount: fs.books },
        { name: 'Uniform', amount: fs.uniform },
        { name: 'PTA Levy', amount: fs.pta },
        ...actLines2
      ],
      total, paid: 0, balance: total,
      status: 'outstanding',
      dueDate: fs.dueDate,
      createdAt: now()
    };
    DB.insert('invoices', newInvoice);
  }

  DB.update('admissionApplications', appId, { status: 'accepted', decidedAt: now(), enrolledStudentId: newStudent.id });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'admitted_student', target: `${a.applicantName} (from application)`, timestamp: now() });

  // Welcome notification with deep link
  DB.insert('notifications', {
    id: uid('not'), userId: parent.id,
    title: '🎉 Welcome to Bright Lights Academy',
    body: `${a.applicantName} has been accepted. Admission number: ${admNo}. ${fs ? 'Your first invoice for ' + money(fs.tuition + fs.books + fs.uniform + fs.pta) + ' is ready.' : ''}`,
    type: 'success', read: false, timestamp: now(),
    link: { view: 'par_fees' }
  });
  document.getElementById('modalBackdrop')?.click();
  APP.render();

  // Next-action confirmation modal
  modal({
    title: '🎉 Student Enrolled',
    body: `
      <div class="text-center py-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">${icon('check','w-8 h-8')}</div>
        <h3 class="text-lg font-bold">${a.applicantName} is now a student</h3>
        <p class="text-sm text-slate-500">Admission number <code class="bg-slate-100 px-1.5 py-0.5 rounded">${admNo}</code></p>
      </div>
      <div class="space-y-2 text-sm bg-slate-50 rounded-xl p-3">
        <div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>Student profile created</span></div>
        <div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>${isNewParent ? 'Parent account created' : 'Linked to existing parent ' + parent.name}</span></div>
        ${fs ? `<div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>Invoice for ${money(fs.tuition + fs.books + fs.uniform + fs.pta)} auto-generated</span></div>` : `<div class="flex items-center gap-2"><span class="text-amber-600">${icon('bell','w-4 h-4')}</span><span>No fee structure for ${(DB.find('classes', a.requestedClass) || {}).name} yet — set one up</span></div>`}
        <div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>Welcome notification sent to parent</span></div>
      </div>
      <p class="text-xs text-slate-500 text-center mt-3">What would you like to do next?</p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Done</button>
      ${isNewParent ? `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); showParentCredentialsModal(DB.find('parents','${parent.id}'), DB.find('students','${newStudent.id}'), ${newInvoice ? "DB.find('invoices','" + newInvoice.id + "')" : 'null'})">Send Login Credentials →</button>` : `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); viewStudent('${newStudent.id}')">View ${a.applicantName.split(' ')[0]}'s profile →</button>`}
    `
  });
  toast(`${a.applicantName} enrolled · invoice and welcome message sent`, 'success');
}

/* ---------- Sick Bay ---------- */
function view_adm_sickbay() {
  const records = DB.query('sickBayRecords', r => r.schoolId === currentSchoolId()).sort((a,b) => b.date.localeCompare(a.date));
  const today_ = today();
  const todayCount = records.filter(r => r.date === today_).length;
  const referredCount = records.filter(r => r.referredToHospital).length;
  return `
    ${pageHeader({
      title: 'Sick Bay',
      subtitle: 'Clinic visits and student health records',
      actions: `<button class="btn btn-primary" onclick="newSickBayModal()">${icon('plus','w-4 h-4')} New Record</button>`
    })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Visits', value: records.length, icon: 'bell', color: 'brand' })}
      ${statCard({ label: 'Today', value: todayCount, icon: 'check', color: 'gold' })}
      ${statCard({ label: 'Referred to Hospital', value: referredCount, icon: 'trending_up', color: 'rose' })}
      ${statCard({ label: 'Parents Notified', value: records.filter(r => r.parentNotified).length, icon: 'chat', color: 'blue' })}
    </div>
    ${records.length === 0 ? emptyState({ title: 'No sick bay records', body: 'Log a visit to start tracking.', icon: 'bell' }) : `
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th>Student</th><th>Date</th><th>Complaint</th><th>Temp</th><th>Treatment</th><th>Referred</th><th>Parent</th></tr></thead>
          <tbody>
            ${records.map(r => {
              const s = DB.find('students', r.studentId);
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s ? s.name : '?', 'sm')}<span class="font-medium text-sm">${s ? s.name : '—'}</span></div></td>
                <td class="text-sm text-slate-500">${fdate(r.date, { long: true })}</td>
                <td class="text-sm">${r.complaint}</td>
                <td class="font-mono text-sm">${r.temperature}°C</td>
                <td class="text-sm">${r.treatment}</td>
                <td>${r.referredToHospital ? '<span class="badge badge-danger">Hospital</span>' : '<span class="badge badge-success">On-site</span>'}</td>
                <td>${r.parentNotified ? `<span class="badge badge-success">${icon('check','w-3 h-3')} Notified</span>` : '<span class="badge badge-warn">Pending</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function newSickBayModal() {
  const students = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'active');
  modal({
    title: 'New Sick Bay Visit',
    body: `<div class="space-y-3">
      <div><label class="input-label">Student</label>
        <select id="sb_student" class="input">${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
      </div>
      <div><label class="input-label">Complaint</label><textarea id="sb_complaint" rows="2" class="input" placeholder="e.g. Stomach pain, dizziness"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Temperature (°C)</label><input id="sb_temp" type="number" step="0.1" class="input" value="36.5" /></div>
        <div><label class="input-label">Attended By</label><input id="sb_attendedBy" class="input" value="School Nurse" /></div>
      </div>
      <div><label class="input-label">Treatment / Action</label><textarea id="sb_treatment" rows="2" class="input"></textarea></div>
      <label class="flex items-center gap-2 text-sm"><input id="sb_referred" type="checkbox" /> Referred to hospital</label>
      <label class="flex items-center gap-2 text-sm"><input id="sb_notify" type="checkbox" checked /> Notify parent via WhatsApp</label>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSickBay()">Save Record</button>`
  });
}

function saveSickBay() {
  const studentId = document.getElementById('sb_student').value;
  const complaint = document.getElementById('sb_complaint').value.trim();
  if (!complaint) { toast('Complaint required', 'danger'); return; }
  const notify = document.getElementById('sb_notify').checked;
  DB.insert('sickBayRecords', {
    id: uid('sb'), schoolId: currentSchoolId(), studentId, complaint,
    temperature: parseFloat(document.getElementById('sb_temp').value) || 36.5,
    treatment: document.getElementById('sb_treatment').value.trim(),
    referredToHospital: document.getElementById('sb_referred').checked,
    attendedBy: document.getElementById('sb_attendedBy').value.trim(),
    date: today(),
    parentNotified: notify
  });
  if (notify) {
    const s = DB.find('students', studentId);
    if (s) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Sick Bay Visit', body: `${s.name} visited the school clinic today. Complaint: ${complaint}. Please contact the school for details.`, type: 'warn', read: false, timestamp: now() });
  }
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Sick bay record saved' + (notify ? ' · parent notified' : ''));
}

/* ---------- Visitor Log ---------- */
function view_adm_visitors() {
  const log = DB.query('visitorLog', l => l.schoolId === (AUTH.current.schoolId || 'sch_brightlights')).sort((a,b) => b.checkIn.localeCompare(a.checkIn));
  const today_ = today();
  const todayCount = log.filter(l => l.checkIn.startsWith(today_)).length;
  return `
    ${pageHeader({
      title: 'Visitor / Gate Log',
      subtitle: 'Track everyone who enters and leaves the premises',
      actions: `<button class="btn btn-primary" onclick="newVisitorModal()">${icon('plus','w-4 h-4')} Check-in Visitor</button>`
    })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Visits', value: log.length, icon: 'user', color: 'brand' })}
      ${statCard({ label: 'Today', value: todayCount, icon: 'calendar', color: 'gold' })}
      ${statCard({ label: 'Currently on Premises', value: log.filter(l => !l.checkOut).length, icon: 'check', color: 'blue' })}
      ${statCard({ label: 'With Vehicle', value: log.filter(l => l.vehicle && l.vehicle !== 'Foot').length, icon: 'bus', color: 'purple' })}
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Visitor</th><th>To See</th><th>Purpose</th><th>Vehicle</th><th>Check In</th><th>Check Out</th></tr></thead>
        <tbody>
          ${log.map(l => `<tr>
            <td><div class="flex items-center gap-2">${avatar(l.visitor, 'sm')}<div><div class="font-medium text-sm">${l.visitor}</div><div class="text-xs text-slate-500">${l.relation}</div></div></div></td>
            <td class="text-sm">${l.toSee}</td>
            <td class="text-sm">${l.purpose}</td>
            <td class="text-xs text-slate-500">${l.vehicle || '—'}</td>
            <td class="text-sm font-mono">${l.checkIn.replace('T', ' ')}</td>
            <td class="text-sm font-mono">${l.checkOut ? l.checkOut.replace('T', ' ') : '<button class="btn btn-ghost !py-1 !px-2 text-xs text-emerald-700" onclick="checkOutVisitor(\'' + l.id + '\')">Check out now</button>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function newVisitorModal() {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  modal({
    title: 'Check-in Visitor',
    body: `<div class="space-y-3">
      <div><label class="input-label">Visitor Name</label><input id="vis_name" class="input" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Phone</label><input id="vis_phone" class="input" /></div>
        <div><label class="input-label">Relation</label>
          <select id="vis_rel" class="input"><option>Parent</option><option>Vendor</option><option>Maintenance</option><option>Government Official</option><option>Visitor</option><option>Delivery</option></select>
        </div>
      </div>
      <div><label class="input-label">To See</label>
        <select id="vis_tosee" class="input"><option>Mr. Olusegun Adebayo (Proprietor)</option>${teachers.map(t => `<option>${t.name}</option>`).join('')}</select>
      </div>
      <div><label class="input-label">Purpose</label><input id="vis_purpose" class="input" /></div>
      <div><label class="input-label">Vehicle (or "Foot")</label><input id="vis_vehicle" class="input" placeholder="e.g. Toyota Camry LSD-241-AB" /></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveVisitor()">${icon('check','w-4 h-4')} Check In</button>`
  });
}

function saveVisitor() {
  const name = document.getElementById('vis_name').value.trim();
  if (!name) { toast('Visitor name required', 'danger'); return; }
  const stamp = new Date().toISOString().slice(0, 16);
  DB.insert('visitorLog', {
    id: uid('vis'), schoolId: currentSchoolId(),
    visitor: name,
    phone: document.getElementById('vis_phone').value.trim(),
    relation: document.getElementById('vis_rel').value,
    toSee: document.getElementById('vis_tosee').value,
    purpose: document.getElementById('vis_purpose').value.trim(),
    vehicle: document.getElementById('vis_vehicle').value.trim(),
    checkIn: stamp,
    checkOut: null
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} checked in`);
}

function checkOutVisitor(visitorId) {
  const stamp = new Date().toISOString().slice(0, 16);
  DB.update('visitorLog', visitorId, { checkOut: stamp });
  toast('Visitor checked out');
  APP.render();
}

/* ---------- Library ---------- */
function view_adm_library() {
  const books = DB.query('libraryBooks', b => b.schoolId === currentSchoolId());
  const loans = DB.query('libraryLoans', l => l.schoolId === currentSchoolId());
  const activeLoans = loans.filter(l => !l.returnedAt);
  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date());
  const totalCopies = books.reduce((s, b) => s + b.copiesTotal, 0);
  const availableCopies = books.reduce((s, b) => s + b.copiesAvailable, 0);

  const tab = APP.params.libTab || 'catalog';
  return `
    ${pageHeader({
      title: 'Library',
      subtitle: 'Catalog, borrowing, overdue tracking',
      actions: tab === 'catalog' ? `<button class="btn btn-primary" onclick="addBookModal()">${icon('plus','w-4 h-4')} Add Book</button>` : ''
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Titles', value: books.length, icon: 'book', color: 'brand' })}
      ${statCard({ label: 'Copies Available', value: availableCopies + ' / ' + totalCopies, icon: 'check', color: 'gold' })}
      ${statCard({ label: 'On Loan', value: activeLoans.length, icon: 'book', color: 'blue' })}
      ${statCard({ label: 'Overdue', value: overdueLoans.length, icon: 'bell', color: overdueLoans.length ? 'rose' : 'brand' })}
    </div>

    ${tabs([
      { key: 'catalog', label: 'Catalog' },
      { key: 'loans',   label: 'Active Loans', badge: activeLoans.length || null },
      { key: 'overdue', label: 'Overdue',      badge: overdueLoans.length || null }
    ], tab, k => { APP.params.libTab = k; APP.render(); })}

    <div class="pt-4">
      ${tab === 'loans' ? renderLibraryLoans(activeLoans, books) :
        tab === 'overdue' ? renderLibraryLoans(overdueLoans, books, true) :
        renderLibraryCatalog(books)}
    </div>
  `;
}

function renderLibraryCatalog(books) {
  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Available</th><th>Location</th><th></th></tr></thead>
        <tbody>
          ${books.map(b => `<tr>
            <td><div class="flex items-center gap-2"><div class="w-8 h-8 rounded bg-brand-100 text-brand-700 flex items-center justify-center">${icon('book','w-4 h-4')}</div><span class="font-medium text-sm">${b.title}</span></div></td>
            <td class="text-sm">${b.author}</td>
            <td><code class="text-xs">${b.isbn}</code></td>
            <td><span class="badge badge-info">${b.category}</span></td>
            <td><strong>${b.copiesAvailable}</strong> / ${b.copiesTotal}</td>
            <td class="text-xs text-slate-500">${b.location}</td>
            <td class="text-right">
              <button class="btn btn-ghost !p-1.5" title="Issue" onclick="issueBookModal('${b.id}')" ${b.copiesAvailable === 0 ? 'disabled' : ''}>${icon('arrow_left','w-4 h-4 rotate-180')}</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLibraryLoans(loans, books, showOverdueOnly) {
  if (loans.length === 0) return emptyState({ title: showOverdueOnly ? 'No overdue books' : 'No active loans', icon: 'book' });
  return `<div class="card overflow-hidden">
    <table class="tbl">
      <thead><tr><th>Book</th><th>Borrower</th><th>Borrowed</th><th>Due</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${loans.map(l => {
          const book = books.find(b => b.id === l.bookId);
          const student = DB.find('students', l.studentId);
          const overdue = new Date(l.dueDate) < new Date() && !l.returnedAt;
          const days = Math.ceil((new Date() - new Date(l.dueDate)) / 86400000);
          return `<tr>
            <td><span class="font-medium text-sm">${book ? book.title : '—'}</span></td>
            <td><div class="flex items-center gap-2">${avatar(student ? student.name : '?', 'sm')}<span class="text-sm">${student ? student.name : '—'}</span></div></td>
            <td class="text-sm text-slate-500">${fdate(l.borrowedAt, { short: true })}</td>
            <td class="text-sm ${overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}">${fdate(l.dueDate, { short: true })}</td>
            <td>${overdue ? `<span class="badge badge-danger">${days}d overdue</span>` : '<span class="badge badge-success">Active</span>'}</td>
            <td><button class="btn btn-secondary !py-1 !px-2 text-xs" onclick="returnBook('${l.id}')">${icon('check','w-3 h-3')} Return</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function addBookModal() {
  modal({
    title: 'Add Book',
    body: `<div class="space-y-3">
      <div><label class="input-label">Title</label><input id="bk_title" class="input" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Author</label><input id="bk_author" class="input" /></div>
        <div><label class="input-label">ISBN</label><input id="bk_isbn" class="input" /></div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div><label class="input-label">Category</label>
          <select id="bk_category" class="input"><option>Fiction</option><option>Reference</option><option>Maths</option><option>Science</option><option>Languages</option><option>History</option><option>Other</option></select>
        </div>
        <div><label class="input-label">Copies</label><input id="bk_copies" type="number" class="input" value="1" /></div>
        <div><label class="input-label">Location</label><input id="bk_location" class="input" placeholder="Shelf A-01" /></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveBook()">Add Book</button>`
  });
}

function saveBook() {
  const title = document.getElementById('bk_title').value.trim();
  if (!title) { toast('Title required', 'danger'); return; }
  const copies = parseInt(document.getElementById('bk_copies').value) || 1;
  DB.insert('libraryBooks', {
    id: uid('book'), schoolId: currentSchoolId(),
    title, author: document.getElementById('bk_author').value.trim(),
    isbn: document.getElementById('bk_isbn').value.trim(),
    category: document.getElementById('bk_category').value,
    copiesTotal: copies, copiesAvailable: copies,
    location: document.getElementById('bk_location').value.trim()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Book added to catalog');
}

function issueBookModal(bookId) {
  const book = DB.find('libraryBooks', bookId);
  const students = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'active');
  modal({
    title: 'Issue: ' + book.title,
    body: `<div class="space-y-3">
      <div><label class="input-label">Borrower</label>
        <select id="iss_student" class="input">${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
      </div>
      <div><label class="input-label">Due Date</label><input id="iss_due" type="date" class="input" value="${daysAhead(14)}" /></div>
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">${book.copiesAvailable} of ${book.copiesTotal} copies available · ${book.location}</div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="issueBook('${bookId}')">Issue Book</button>`
  });
}

function issueBook(bookId) {
  const book = DB.find('libraryBooks', bookId);
  if (book.copiesAvailable <= 0) { toast('No copies available', 'danger'); return; }
  const studentId = document.getElementById('iss_student').value;
  DB.insert('libraryLoans', {
    id: uid('lln'), schoolId: currentSchoolId(),
    bookId, studentId,
    borrowedAt: today(),
    dueDate: document.getElementById('iss_due').value,
    returnedAt: null
  });
  DB.update('libraryBooks', bookId, { copiesAvailable: book.copiesAvailable - 1 });
  const s = DB.find('students', studentId);
  toast(`${book.title} issued to ${s ? s.name : 'student'}`);
  document.getElementById('modalBackdrop').click();
  APP.render();
}

function returnBook(loanId) {
  const loan = DB.find('libraryLoans', loanId);
  const book = DB.find('libraryBooks', loan.bookId);
  DB.update('libraryLoans', loanId, { returnedAt: today() });
  if (book) DB.update('libraryBooks', book.id, { copiesAvailable: book.copiesAvailable + 1 });
  toast('Book returned');
  APP.render();
}

/* ---------- Messages and Announcements view stubs delegate to shared module ---------- */
function view_adm_messages() { return view_messages_shared('schooladmin'); }
function view_adm_announce() { return view_announce_shared('schooladmin'); }

/* ============================================================
   Advanced Support & Live Chat (school-facing)
   ============================================================ */
function view_adm_support() {
  const tab = APP.params.supTab || 'chat';
  const sid = currentSchoolId();
  const tickets = DB.query('supportTickets', t => t.schoolId === sid);
  const openCount = tickets.filter(t => t.status !== 'resolved').length;
  return `
    ${pageHeader({ title: 'Help & Support', subtitle: 'Live chat, support tickets and the help centre' })}
    ${tabs([
      { key: 'chat', label: 'Live Chat' },
      { key: 'tickets', label: 'My Tickets', badge: openCount || null },
      { key: 'help', label: 'Help Centre' }
    ], tab, k => { APP.params.supTab = k; APP.render(); })}
    <div class="pt-4">${tab === 'tickets' ? renderSupportTickets() : tab === 'help' ? renderHelpCentre() : renderLiveChat()}</div>
  `;
}

function renderLiveChat() {
  const sid = currentSchoolId();
  let msgs = DB.query('liveChatMessages', m => m.schoolId === sid).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (msgs.length === 0) {
    DB.insert('liveChatMessages', { id: uid('lc'), schoolId: sid, from: 'agent', agentName: 'Bisi (CASPAA Support)', text: 'Hi there! 👋 You\'re connected to CASPAA Support. How can we help you today?', timestamp: now() });
    msgs = DB.query('liveChatMessages', m => m.schoolId === sid).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  return `
    <div class="card overflow-hidden flex flex-col" style="height: 60vh;">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-emerald-50">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-semibold text-sm text-emerald-900">CASPAA Support · online</span>
        <span class="ml-auto text-xs text-emerald-700">Avg reply &lt; 2 min</span>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-3 scroll-area" id="liveChatBody">
        ${msgs.map(m => m.from === 'agent'
          ? `<div class="flex gap-2 items-end"><span class="avatar sm">CS</span><div class="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[75%]"><div class="text-xs text-slate-400 mb-0.5">${m.agentName || 'Support'}</div><div class="text-sm">${m.text}</div></div></div>`
          : `<div class="flex justify-end"><div class="bg-brand-600 text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%] text-sm">${m.text}</div></div>`
        ).join('')}
      </div>
      <div class="border-t border-slate-100 p-3 flex gap-2">
        <input id="liveChatInput" class="input flex-1" placeholder="Type your message…" onkeydown="if(event.key==='Enter')sendLiveChat()" />
        <button class="btn btn-primary" onclick="sendLiveChat()">${icon('send','w-4 h-4')}</button>
      </div>
    </div>
  `;
}

function sendLiveChat() {
  const input = document.getElementById('liveChatInput');
  const text = (input.value || '').trim();
  if (!text) return;
  const sid = currentSchoolId();
  DB.insert('liveChatMessages', { id: uid('lc'), schoolId: sid, from: 'school', text, timestamp: now() });
  // Canned agent reply
  const lower = text.toLowerCase();
  let reply = 'Thanks for reaching out! A support specialist will follow up shortly. Meanwhile, you can check the Help Centre tab for quick answers.';
  if (lower.includes('invoice') || lower.includes('fee') || lower.includes('payment')) reply = 'For invoices and payments, go to Finance → Invoices. You can generate and send an invoice or receipt to a parent via WhatsApp + email. Need anything specific?';
  else if (lower.includes('result') || lower.includes('report')) reply = 'To publish a result, open Academic → Results and click Generate on a student row. It is shared with the parent automatically.';
  else if (lower.includes('cbt') || lower.includes('exam')) reply = 'Teachers create CBTs under Teacher → CBT Exams. Once published, students take them on their portal and objective questions auto-grade.';
  else if (lower.includes('student') || lower.includes('pupil') || lower.includes('add')) reply = 'You can add students under Students → Add Student, or bulk-upload via CSV. Want me to walk you through it?';
  else if (lower.includes('thank')) reply = 'You\'re very welcome! 😊 Anything else I can help with?';
  DB.insert('liveChatMessages', { id: uid('lc'), schoolId: sid, from: 'agent', agentName: 'Bisi (CASPAA Support)', text: reply, timestamp: now() });
  APP.render();
  setTimeout(() => { const b = document.getElementById('liveChatBody'); if (b) b.scrollTop = b.scrollHeight; }, 50);
}

function renderSupportTickets() {
  const sid = currentSchoolId();
  const tickets = DB.query('supportTickets', t => t.schoolId === sid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    <div class="flex justify-end mb-3"><button class="btn btn-primary" onclick="raiseTicketModal()">${icon('plus','w-4 h-4')} Raise a Ticket</button></div>
    ${tickets.length === 0 ? emptyState({ title: 'No tickets yet', body: 'Raise a ticket and our team will respond within SLA.', icon: 'chat' }) : `
      <div class="card overflow-hidden"><div class="overflow-x-auto"><table class="tbl">
        <thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>Raised</th><th>SLA</th></tr></thead>
        <tbody>
          ${tickets.map(t => `<tr>
            <td><code class="text-xs">${t.id.toUpperCase()}</code></td>
            <td class="font-medium">${t.subject}</td>
            <td><span class="badge ${t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}">${t.priority}</span></td>
            <td>${(() => { const m = { open: ['badge-warn', 'Open'], in_progress: ['badge-info', 'In progress'], escalated: ['badge-danger', 'Escalated'], resolved: ['badge-success', 'Resolved'] }[t.status] || ['badge-neutral', t.status]; return `<span class="badge ${m[0]}">${m[1]}</span>`; })()}</td>
            <td class="text-sm text-slate-500">${fdate(t.createdAt, { short: true })}</td>
            <td class="text-sm text-slate-500">${t.slaHours}h</td>
          </tr>`).join('')}
        </tbody>
      </table></div></div>
    `}
  `;
}

function raiseTicketModal() {
  modal({
    title: 'Raise a Support Ticket',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Subject</label><input id="tk_subject" class="input" placeholder="Briefly, what do you need help with?" /></div>
        <div><label class="input-label">Details</label><textarea id="tk_desc" rows="4" class="input" placeholder="Describe the issue…"></textarea></div>
        <div><label class="input-label">Priority</label><select id="tk_priority" class="input"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">${icon('info','w-4 h-4 inline mr-1')} Our team responds within the SLA based on priority (High: 4h, Medium: 24h, Low: 48h).</div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSupportTicket()">${icon('send','w-4 h-4')} Submit Ticket</button>`
  });
}

function saveSupportTicket() {
  const subject = document.getElementById('tk_subject').value.trim();
  if (!subject) { toast('Subject is required', 'danger'); return; }
  const priority = document.getElementById('tk_priority').value;
  const sla = priority === 'high' ? 4 : priority === 'medium' ? 24 : 48;
  DB.insert('supportTickets', {
    id: 'tkt_' + Date.now().toString(36).slice(-5), schoolId: currentSchoolId(),
    requester: AUTH.current.name, subject, description: document.getElementById('tk_desc').value.trim(),
    priority, status: 'open', channel: 'platform', assignedTo: null, createdAt: now(), slaHours: sla, notes: []
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Ticket submitted · our team will respond within ' + sla + 'h', 'success');
}

function renderHelpCentre() {
  const q = (APP.params.helpQ || '').toLowerCase();
  let articles = DB.get('helpArticles');
  if (q) articles = articles.filter(a => a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  const byCat = {};
  articles.forEach(a => { (byCat[a.category] = byCat[a.category] || []).push(a); });
  return `
    <div class="card p-3 mb-4">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
        <input class="input pl-9" placeholder="Search help articles…" value="${q}" oninput="APP.params.helpQ=this.value; APP.render()" />
      </div>
    </div>
    ${articles.length === 0 ? emptyState({ title: 'No articles found', body: 'Try a different search, or start a live chat.', icon: 'book' }) : `
      <div class="space-y-5">
        ${Object.keys(byCat).map(cat => `
          <div>
            <h3 class="font-bold text-slate-700 mb-2">${cat}</h3>
            <div class="space-y-2">
              ${byCat[cat].map(a => `<details class="card p-4">
                <summary class="font-semibold text-slate-900 cursor-pointer">${a.question}</summary>
                <p class="text-sm text-slate-600 mt-2">${a.answer}</p>
              </details>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}
