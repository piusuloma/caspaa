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
  return buildHub('Students', 'Students, admissions, alumni, enrollment trends', [
    { key: 'students',       label: 'Students',        view: 'view_adm_students' },
    { key: 'new_enrollment', label: 'New Enrollment',  view: 'view_adm_new_enrollment' },
    { key: 'returning',      label: 'Returning',       view: 'view_adm_returning_students' },
    { key: 'admissions',     label: 'Admissions',      view: 'view_adm_admissions', badge: () => DB.query('admissionApplications', a => a.schoolId === currentSchoolId() && a.status !== 'accepted' && a.status !== 'rejected').length || null },
    { key: 'alumni',         label: 'Alumni',          view: 'view_adm_alumni' },
    { key: 'analytics',      label: 'Analytics',       view: 'view_adm_enrollment_analytics' }
  ], 'students', 'peopleTab');
}

function view_adm_new_enrollment() {
  APP.params.enrollmentView = 'new';
  return view_adm_students();
}

function view_adm_returning_students() {
  APP.params.enrollmentView = 'returning';
  return view_adm_students();
}

function view_adm_workforce() {
  return buildHub('Staff & HR', 'Staff directory, attendance, leave requests, appraisal', [
    { key: 'staff',       label: 'Staff Directory',   view: 'view_adm_staff' },
    { key: 'attendance',  label: 'Staff Attendance',  view: 'view_adm_staff_att' },
    { key: 'leave',       label: 'Leave Requests',    view: 'view_adm_leave_requests', badge: () => DB.query('leaveRequests', l => l.schoolId === currentSchoolId() && l.status === 'pending').length || null },
    { key: 'apr_cycles',  label: 'Appraisal Cycles',  view: 'view_adm_appraisal_cycles', badge: () => { const sid=currentSchoolId(); return DB.query('appraisals', a => a.schoolId===sid && ['manager_pending','principal_pending','outcome_pending'].includes(a.status)).length || null; } },
    { key: 'apr_advances',label: 'Salary Advances',   view: 'view_adm_salary_advances',  badge: () => { const sid=currentSchoolId(); return DB.query('salaryAdvances', a => a.schoolId===sid && a.status==='pending').length || null; } }
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
function view_adm_appraisal_cycles() {
  const sid = currentSchoolId();
  const cycleId = APP.params.aprCycle || null;
  const cycles = DB.query('appraisalCycles', c => c.schoolId === sid).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return _renderCycles(cycles, cycleId);
}

function view_adm_salary_advances() {
  const sid = currentSchoolId();
  const advances = DB.query('salaryAdvances', a => a.schoolId === sid).sort((a,b) => b.requestedAt.localeCompare(a.requestedAt));
  return _renderSalaryAdvances(advances);
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  const t = DB.find('teachers', apr.staffId);
  toast(`Approved · ${t.name} · ${finalOverall}% — now set the outcome`, 'success');
}

function aprReturnForRevision(aprId) {
  DB.update('appraisals', aprId, { status: 'manager_pending', managerScores: null, managerComment: '', managerBy: null, managerSubmittedAt: null });
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
  return buildHub('Academic', 'Classes, curriculum, timetable, attendance, results, discipline, assessment setup', [
    { key: 'classes',    label: 'Classes',          view: 'view_adm_classes' },
    { key: 'curriculum', label: 'Curriculum',        view: 'view_adm_curriculum' },
    { key: 'timetable',  label: 'Timetable',         view: 'view_adm_timetable' },
    { key: 'attendance', label: 'Attendance',        view: 'view_adm_attendance' },
    { key: 'results',    label: 'Results',           view: 'view_adm_results' },
    { key: 'discipline', label: 'Discipline',        view: 'view_adm_discipline' },
    { key: 'assessment', label: 'Assessment Setup',  view: 'view_adm_exam_structure' }
  ], 'classes', 'academicTab');
}

function view_adm_exam_structure() {
  return `
    ${pageHeader({ title: 'Assessment Setup', subtitle: 'Define CA count, weights, mock exams, and pre-tests per term. Teachers see these columns when entering results.' })}
    ${renderExamStructureSettings()}
  `;
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
        <button class="btn btn-secondary" onclick="importFullSchoolCurriculumModal()">${icon('upload','w-4 h-4')} Import All Schemes (CSV)</button>
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
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
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: `Edit Week ${w.week}`,
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Topic</label><input id="wk_topic" class="input" value="${w.topic}" /></div>
        <div><label class="input-label">Sub-topics (comma-separated)</label><input id="wk_sub" class="input" value="${(w.subtopics || []).join(', ')}" /></div>
        <div><label class="input-label">Learning Objective</label><textarea id="wk_obj" rows="2" class="input" placeholder="e.g. Students will be able to identify and name the parts of the human digestive system">${w.objectives || ''}</textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Duration</label><input id="wk_dur" class="input" value="${w.duration || '3 periods'}" /></div>
          <div><label class="input-label">Methods</label><input id="wk_meth" class="input" value="${w.methods || ''}" placeholder="e.g. Group discussion, demonstration, worksheet" /></div>
        </div>
        <div><label class="input-label">Resources</label><input id="wk_res" class="input" value="${w.resources || ''}" placeholder="e.g. Textbook p.42, diagram chart, whiteboard" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); openSchemeEditor('${schemeId}')">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => editSchemeWeek(schemeId, sch.weeks.length - 1), 50);
}

function deleteScheme(schemeId) {
  const sch = DB.find('schemesOfWork', schemeId);
  const sub = DB.find('subjects', sch.subjectId);
  const cls = DB.find('classes', sch.classId);
  confirm(`Delete the scheme of work for ${sub ? sub.name : ''} in ${cls ? cls.name : ''}? Coverage history will be lost.`, () => {
    DB.remove('schemesOfWork', schemeId);
    document.getElementById('modalBackdrop')?.click();
    APP.render();
    toast('Scheme deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

function newSchemeModal(prefilledClassId) {
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const terms = DB.query('academicTerms', t => t.schoolId === currentSchoolId());
  const currentTerm = DB.settings().currentTerm || '';
  window._newSchemeCsvData = null;
  modal({
    title: 'New Scheme of Work',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="nsch_class" class="input">${classes.map(c => `<option value="${c.id}" ${prefilledClassId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="nsch_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label">Term</label>
          <select id="nsch_term" class="input">
            ${terms.length
              ? terms.map(t => `<option value="${t.name}" ${t.current ? 'selected' : ''}>${t.name}</option>`).join('')
              : `<option value="${currentTerm}">${currentTerm}</option>`}
          </select>
        </div>
        <div>
          <label class="input-label">How do you want to create this scheme?</label>
          <select id="nsch_method" class="input" onchange="nschMethodChange(this.value)">
            <option value="template">Use NERDC/UBEC template — auto-fills 12 weeks for you (recommended)</option>
            <option value="blank">Start blank — I'll type in the topics week by week</option>
            <option value="csv">Upload my own CSV file — I have my plan in a spreadsheet</option>
          </select>
        </div>

        <!-- Template info (shown by default) -->
        <div id="nsch_template_info" class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900 space-y-1">
          <div class="font-semibold">${icon('check','w-4 h-4 inline mr-1 text-blue-600')} What happens when you click Create:</div>
          <ul class="list-disc pl-5 text-xs space-y-0.5">
            <li>12 weeks of topics are generated automatically based on the subject</li>
            <li>UBEC structure is used for Nursery/Primary; NERDC for JSS/SS</li>
            <li>You can open the scheme afterwards and edit every week's topic, objectives, and resources</li>
            <li>Teachers tick off each week as they cover it during the term</li>
          </ul>
        </div>

        <!-- Blank weeks row (hidden) -->
        <div id="nsch_blank_row" class="hidden">
          <label class="input-label">Number of weeks</label>
          <input id="nsch_weeks" type="number" class="input" value="12" min="4" max="16" />
          <p class="text-xs text-slate-400 mt-1">Empty week slots will be created. Open the scheme to fill in each week's topic.</p>
        </div>

        <!-- CSV upload row (hidden) -->
        <div id="nsch_csv_row" class="hidden space-y-2">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <div class="font-semibold">How to prepare your CSV:</div>
            <ol class="list-decimal pl-4 space-y-0.5">
              <li>Download the template below, or open Excel/Google Sheets</li>
              <li>Add one row per week with columns: <strong>Week, Topic, Objectives, Activities, Resources</strong></li>
              <li>Save as CSV, then upload it here</li>
            </ol>
            <a href="#" class="inline-flex items-center gap-1 mt-1 text-amber-800 underline font-semibold" onclick="downloadSchemeCSVTemplate(); return false;">${icon('download','w-3 h-3')} Download blank CSV template</a>
          </div>
          <div class="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-xl p-6 text-center cursor-pointer transition" onclick="document.getElementById('nsch_csv_file').click()">
            ${icon('upload','w-7 h-7 mx-auto text-slate-400 mb-1')}
            <p class="text-sm font-semibold text-slate-700">Click to select your CSV file</p>
            <p class="text-xs text-slate-400 mt-0.5">Week · Topic · Objectives · Activities · Resources</p>
            <input type="file" id="nsch_csv_file" accept=".csv,.xlsx" class="hidden" onchange="nschPreviewCSV(this)">
          </div>
          <div id="nsch_csv_preview"></div>
        </div>

        <div id="nsch_alignment_row" class="hidden">
          <label class="input-label">Curriculum alignment <span class="text-slate-400 font-normal text-xs">— for labelling only</span></label>
          <select id="nsch_source" class="input"><option>Custom</option><option>NERDC</option><option>UBEC</option><option>WAEC</option><option>NECO</option></select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="createNewScheme()">${icon('plus','w-4 h-4')} Create Scheme</button>`
  });
}

function nschMethodChange(method) {
  document.getElementById('nsch_template_info').classList.toggle('hidden', method !== 'template');
  document.getElementById('nsch_blank_row').classList.toggle('hidden', method !== 'blank');
  document.getElementById('nsch_csv_row').classList.toggle('hidden', method !== 'csv');
  document.getElementById('nsch_alignment_row').classList.toggle('hidden', method === 'template');
}

function nschPreviewCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
    const rows = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    const isHeader = rows[0] && isNaN(parseInt(rows[0][0]));
    const data = isHeader ? rows.slice(1) : rows;
    const valid = data.filter(r => r.length >= 2 && r[0]);
    window._newSchemeCsvData = valid;
    const preview = document.getElementById('nsch_csv_preview');
    if (preview) preview.innerHTML = valid.length
      ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-xs text-emerald-900">${icon('check','w-3.5 h-3.5 inline')} <strong>${file.name}</strong> — ${valid.length} week${valid.length !== 1 ? 's' : ''} ready to import</div>`
      : `<div class="bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs text-rose-800">${icon('alert','w-3.5 h-3.5 inline')} No valid rows found. Check the file has Week and Topic columns.</div>`;
  };
  reader.readAsText(file);
}

function downloadSchemeCSVTemplate() {
  const csv = 'Week,Topic,Objectives,Activities,Resources\n1,Introduction,Students will be able to...,Group work,Textbook p.1\n2,Core Unit 1,Students will understand...,Discussion,Worksheet\n3,Core Unit 2,Students will apply...,Demonstration,Textbook p.10\n';
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'scheme_template.csv' });
  a.click();
}

function createNewScheme() {
  const classId = document.getElementById('nsch_class').value;
  const subjectId = document.getElementById('nsch_subject').value;
  const term = document.getElementById('nsch_term').value;
  const method = (document.getElementById('nsch_method') || {}).value || 'template';

  const existing = DB.query('schemesOfWork', s => s.classId === classId && s.subjectId === subjectId && s.term === term)[0];
  if (existing) { toast('A scheme for this subject/class/term already exists', 'warn'); return; }

  const cls = DB.find('classes', classId);
  const sub = DB.find('subjects', subjectId);
  let weeks = [], source = '';

  if (method === 'template') {
    const isPrimary = cls && (cls.level === 'Primary' || cls.level === 'Nursery');
    source = isPrimary ? 'UBEC' : 'NERDC';
    const subName = sub ? sub.name : 'Subject';
    weeks = [
      { week: 1, topic: `Introduction to ${subName}`, subtopics: ['Welcome', 'Course overview'], objectives: `Introduce ${subName} for the term.`, methods: 'Lecture, examples, group work', resources: `${subName} textbook`, duration: '2 periods', covered: false },
      { week: 2, topic: 'Foundational concepts', subtopics: [], objectives: 'Cover prerequisites and prior knowledge.', methods: 'Lecture, examples, group work', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 3, topic: 'Core unit 1', subtopics: [], objectives: 'Master core concepts.', methods: 'Lecture, examples, group work', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 4, topic: 'Core unit 2', subtopics: [], objectives: 'Build on unit 1.', methods: 'Lecture, examples, group work', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 5, topic: 'Core unit 3 + Mid-term CA', subtopics: [], objectives: 'Continuous assessment 1.', methods: 'Lecture, assessment', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 6, topic: 'Application & practice', subtopics: [], objectives: 'Apply concepts to real problems.', methods: 'Group work, problem solving', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 7, topic: 'Advanced concepts', subtopics: [], objectives: 'Extend and deepen learning.', methods: 'Lecture, examples, group work', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 8, topic: 'Project / Practical', subtopics: [], objectives: 'Hands-on practice and project work.', methods: 'Demonstration, project work', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 9, topic: 'Integration & review', subtopics: [], objectives: 'Connect all concepts covered so far.', methods: 'Discussion, review exercises', resources: `${subName} textbook`, duration: '3 periods', covered: false },
      { week: 10, topic: 'Continuous Assessment 2', subtopics: [], objectives: 'Second continuous assessment.', methods: 'Assessment', resources: 'Assessment papers', duration: '3 periods', covered: false },
      { week: 11, topic: 'Revision', subtopics: ['Past questions', 'Q&A session'], objectives: 'Prepare students for the terminal exam.', methods: 'Q&A, drilling, past questions', resources: 'Past question papers', duration: '3 periods', covered: false },
      { week: 12, topic: 'Term Examination', subtopics: ['Written examination'], objectives: 'End of term assessment.', methods: 'Examination', resources: 'Question papers', duration: '2 hours', covered: false }
    ];
  } else if (method === 'csv') {
    const csvData = window._newSchemeCsvData;
    if (!csvData || !csvData.length) { toast('Please upload a CSV file first', 'danger'); return; }
    source = (document.getElementById('nsch_source') || {}).value || 'Custom';
    weeks = csvData.map((r, i) => ({
      week: parseInt(r[0]) || (i + 1),
      topic: r[1] || `Week ${i + 1}`,
      objectives: r[2] || '',
      activities: r[3] || '',
      resources: r[4] || '',
      subtopics: [],
      methods: 'Lecture, group work',
      duration: '3 periods',
      covered: false
    }));
    window._newSchemeCsvData = null;
  } else {
    source = (document.getElementById('nsch_source') || {}).value || 'Custom';
    const weekCount = parseInt((document.getElementById('nsch_weeks') || {}).value) || 12;
    for (let i = 1; i <= weekCount; i++) {
      weeks.push({ week: i, topic: i === weekCount ? 'Term Examination' : i === weekCount - 1 ? 'Revision' : `Week ${i} Topic`, subtopics: [], objectives: '', methods: 'Lecture, examples, group work', resources: 'Approved textbook', duration: '3 periods', covered: false });
    }
  }

  DB.insert('schemesOfWork', {
    id: uid('sch'), schoolId: currentSchoolId(),
    classId, subjectId, term, source,
    sessionId: DB.settings().sessionId || 'sess_2025_26',
    status: 'draft', weeks,
    createdAt: now()
  });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  const msg = method === 'template' ? `${source} template created · ${weeks.length} weeks ready to customise` :
              method === 'csv'      ? `Scheme imported from CSV · ${weeks.length} weeks` :
                                     'Scheme created · open it to fill in the weeks';
  toast(msg, 'success');
}

function importExcelCurriculumModal() {
  const classes = DB.get('classes');
  modal({
    title: 'Import Curriculum via Excel',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline mr-1')} Upload one Excel file per class. Each sheet should represent one subject, with columns: <strong>Week, Topic, Objectives, Activities, Resources</strong>.
        </div>
        <div>
          <label class="input-label">Select Class</label>
          <select id="exc_class" class="input">
            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="input-label">Term</label>
          <select id="exc_term" class="input">
            <option>First Term</option><option>Second Term</option><option>Third Term</option>
          </select>
        </div>
        <div>
          <label class="input-label">Upload Excel File (.xlsx or .csv)</label>
          <div class="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-xl p-8 text-center cursor-pointer transition" onclick="document.getElementById('exc_file').click()">
            ${icon('upload','w-8 h-8 mx-auto text-slate-400 mb-2')}
            <p class="text-sm font-semibold text-slate-700">Click to upload or drag & drop</p>
            <p class="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv — one file per class</p>
            <input type="file" id="exc_file" accept=".xlsx,.xls,.csv" class="hidden" onchange="previewExcelCurriculum(this)" />
          </div>
        </div>
        <div id="exc_preview" class="hidden">
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
            ${icon('check','w-4 h-4 inline mr-1')} <span id="exc_preview_text">File loaded</span>. Review below and click <strong>Import</strong> to populate schemes.
          </div>
        </div>
        <div class="bg-slate-50 rounded-xl p-3">
          <p class="text-xs font-semibold text-slate-700 mb-2">Expected Excel format (one sheet per subject):</p>
          <table class="tbl text-xs">
            <thead><tr><th>Week</th><th>Topic</th><th>Objectives</th><th>Activities</th><th>Resources</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Introduction to Algebra</td><td>Pupils will identify variables</td><td>Group work, flashcards</td><td>Textbook p.12</td></tr>
              <tr><td>2</td><td>Simple Equations</td><td>Pupils will solve x + 3 = 7</td><td>Whiteboard drill</td><td>Worksheet A</td></tr>
            </tbody>
          </table>
          <a href="#" class="text-xs text-brand-700 font-semibold mt-2 inline-block" onclick="downloadExcelTemplate(); return false;">${icon('download','w-3.5 h-3.5 inline')} Download blank template</a>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-primary" onclick="processExcelCurriculum()">${icon('upload','w-4 h-4')} Import Curriculum</button>
    `
  });
}

function previewExcelCurriculum(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('exc_preview');
  const previewText = document.getElementById('exc_preview_text');
  if (preview && previewText) {
    preview.classList.remove('hidden');
    previewText.textContent = `"${file.name}" ready (${(file.size / 1024).toFixed(1)} KB)`;
  }
}

function downloadExcelTemplate() {
  const csvContent = 'Week,Topic,Objectives,Activities,Resources\n1,Introduction,Students will be able to...,Group work,Textbook p.1\n2,Topic 2,Students will understand...,Discussion,Worksheet';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'curriculum_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

function processExcelCurriculum() {
  const classId = document.getElementById('exc_class').value;
  const term = document.getElementById('exc_term').value;
  const fileInput = document.getElementById('exc_file');
  if (!fileInput || !fileInput.files[0]) { toast('Please select a file to import', 'danger'); return; }
  const cls = DB.find('classes', classId);
  const subjects = DB.get('subjects');
  // Simulate bulk import — create schemes for all subjects in the class
  let created = 0;
  subjects.slice(0, 5).forEach(sub => {
    const existing = DB.query('schemesOfWork', s => s.classId === classId && s.subjectId === sub.id && s.term === term)[0];
    if (!existing) {
      DB.insert('schemesOfWork', {
        id: uid('sow'), schoolId: currentSchoolId(), classId, subjectId: sub.id, term, source: 'Excel Import',
        weeks: Array.from({ length: 12 }, (_, i) => ({ week: i + 1, topic: `Week ${i + 1} Topic`, objectives: '', activities: '', resources: '', covered: false }))
      });
      created++;
    }
  });
  document.getElementById('modalBackdrop')?.click();
  toast(`${created} subject scheme${created !== 1 ? 's' : ''} imported for ${cls ? cls.name : 'class'}`, 'success');
  APP.render();
}

/* School-wide curriculum CSV import
   Expected CSV columns: Class, Subject, Week, Topic, Objectives, Activities, Resources
   One row per week per subject per class. */
function importFullSchoolCurriculumModal() {
  const term = DB.settings().currentTerm;
  modal({
    title: 'Import Full-School Curriculum (CSV)',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline mr-1')} Upload one CSV file covering <strong>all classes and subjects</strong> for the school. Each row = one week of a subject.
          <div class="mt-2 font-mono text-xs bg-white rounded p-2 border border-blue-100 text-slate-700">
            Class,Subject,Week,Topic,Objectives,Activities,Resources<br>
            JSS 1,Mathematics,1,Number Bases,Understand base 10 and 2,Group work,Textbook<br>
            JSS 1,Mathematics,2,Algebraic Expressions,…,…,…
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div><label class="input-label">Term</label><input id="fsc_term" class="input" value="${term}" readonly /></div>
          <div><label class="input-label">CSV File</label><input type="file" id="fsc_file" class="input" accept=".csv" onchange="previewFullSchoolCSV()" /></div>
        </div>
        <div id="fsc_preview" class="hidden">
          <div class="text-xs font-semibold text-slate-600 mb-2">Preview (first 10 rows)</div>
          <div class="card overflow-hidden"><div class="overflow-x-auto" id="fsc_preview_table"></div></div>
          <div id="fsc_summary" class="mt-2 text-sm text-slate-700"></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button id="fsc_import_btn" class="btn btn-primary hidden" onclick="confirmFullSchoolImport()">${icon('check','w-4 h-4')} Import All Schemes</button>`
  });
}

function previewFullSchoolCSV() {
  const file = document.getElementById('fsc_file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
    const rows = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    const headers = rows[0] || [];
    const data = rows.slice(1).filter(r => r.length >= 4 && r[0]);
    const preview = data.slice(0, 10);
    // Count unique class×subject combos
    const combos = new Set(data.map(r => `${r[0]}|${r[1]}`));
    document.getElementById('fsc_preview_table').innerHTML = `
      <table class="tbl text-xs">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${preview.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    document.getElementById('fsc_summary').innerHTML = `<span class="text-brand-700 font-semibold">${data.length} rows</span> · <span class="text-brand-700 font-semibold">${combos.size} class-subject schemes</span> will be created.`;
    document.getElementById('fsc_preview').classList.remove('hidden');
    document.getElementById('fsc_import_btn').classList.remove('hidden');
    window._fscCSVData = data;
  };
  reader.readAsText(file);
}

function confirmFullSchoolImport() {
  const data = window._fscCSVData;
  if (!data || !data.length) { toast('No data to import', 'danger'); return; }
  const term = document.getElementById('fsc_term').value.trim();
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const sid = currentSchoolId();
  // Group rows by class name × subject name
  const schemeMap = {};
  data.forEach(r => {
    const [className, subjectName, weekStr, topic, objectives, activities, resources] = r;
    const cls = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
    const sub = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (!cls || !sub) return;
    const key = `${cls.id}|${sub.id}`;
    if (!schemeMap[key]) schemeMap[key] = { classId: cls.id, subjectId: sub.id, weeks: [] };
    const weekNum = parseInt(weekStr) || (schemeMap[key].weeks.length + 1);
    schemeMap[key].weeks.push({ week: weekNum, topic: topic || `Week ${weekNum}`, objectives: objectives || '', activities: activities || '', resources: resources || '', methods: 'Lecture, group work', duration: '3 periods', covered: false, subtopics: [] });
  });
  let created = 0, skipped = 0;
  Object.values(schemeMap).forEach(({ classId, subjectId, weeks }) => {
    weeks.sort((a, b) => a.week - b.week);
    const existing = DB.query('schemesOfWork', s => s.classId === classId && s.subjectId === subjectId && s.term === term)[0];
    if (existing) { skipped++; return; }
    DB.insert('schemesOfWork', { id: uid('sow'), schoolId: sid, classId, subjectId, term, source: 'CSV Import', status: 'draft', weeks, createdAt: now() });
    created++;
  });
  delete window._fscCSVData;
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${created} scheme${created !== 1 ? 's' : ''} imported${skipped ? ` · ${skipped} skipped (already exist)` : ''}`, 'success');
}

function importNERDCTemplateModal() {
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const terms = DB.query('academicTerms', t => t.schoolId === currentSchoolId());
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
        <div><label class="input-label">Term</label>
          <select id="nrd_term" class="input">${terms.map(t => `<option ${t.current ? 'selected' : ''}>${t.name} 2025/26</option>`).join('')}</select>
        </div>
        <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
          The template will be imported as a draft. You can edit/remove/add weeks before publishing. Coverage will start at 0%.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="importNERDCTemplate()">${icon('download','w-4 h-4')} Import Template</button>`
  });
}

function importNERDCTemplate() {
  const classId = document.getElementById('nrd_class').value;
  const subjectId = document.getElementById('nrd_subject').value;
  const cls = DB.find('classes', classId);
  const sub = DB.find('subjects', subjectId);
  const term = document.getElementById('nrd_term').value;
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
  document.getElementById('modalBackdrop')?.click();
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
  return buildHub('Operations', 'Welfare, library, gate, inventory, activities', [
    { key: 'sickbay',     label: 'Sick Bay',    view: 'view_adm_sickbay' },
    { key: 'visitors',    label: 'Visitor Log', view: 'view_adm_visitors' },
    { key: 'library',     label: 'Library',     view: 'view_adm_library' },
    { key: 'inventory',   label: 'Inventory',   view: 'view_adm_inventory' },
    { key: 'activities',  label: 'Activities',  view: 'view_adm_activities' }
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
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
          animation: { duration: 0 },
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
          animation: { duration: 0 },
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
          <div class="flex items-center justify-between mb-3 gap-2 min-w-0">
            <h3 class="font-bold text-slate-900 truncate">Revenue · <span class="text-brand-700 font-extrabold">${revenueView === 'monthly' ? 'Monthly' : revenueView === 'annually' ? 'Annual' : 'Per Term'}</span></h3>
            <div class="flex items-center gap-2 flex-shrink-0">
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
              // Students at academic risk (F grade in approved results)
              const atRiskIds = new Set(DB.query('results', r => r.schoolId === schoolId && r.grade === 'F' && r.approved).map(r => r.studentId));
              if (atRiskIds.size > 0) items.push({ icon: 'students', tone: atRiskIds.size > 3 ? 'rose' : 'amber', text: `${atRiskIds.size} student${atRiskIds.size !== 1 ? 's' : ''} failing in at least one subject`, go: "APP.go('adm_academic',{academicTab:'results',resView:'overview'})" });
              // Pending leave requests
              const pendingLeave = DB.query('leaveRequests', l => l.schoolId === schoolId && l.status === 'pending').length;
              if (pendingLeave) items.push({ icon: 'calendar', tone: 'amber', text: `${pendingLeave} staff leave request${pendingLeave !== 1 ? 's' : ''} awaiting decision`, go: "APP.go('adm_workforce',{workforceTab:'leave'})" });
              // Open appraisal cycle with staff yet to self-assess
              const pendingSelf = DB.query('appraisals', a => a.schoolId === schoolId && a.status === 'self_pending').length;
              if (pendingSelf) items.push({ icon: 'reports', tone: 'amber', text: `${pendingSelf} staff yet to complete appraisal self-assessment`, go: "APP.go('adm_workforce',{workforceTab:'apr_cycles'})" });
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

      <!-- Revenue analytics panel -->
      ${(() => {
        const expenses = DB.query('expenses', e => e.schoolId === schoolId);
        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        const staffExpenses = expenses.filter(e => ['Salaries', 'Staff', 'Payroll'].some(k => (e.category || '').includes(k)));
        const staffCost = staffExpenses.reduce((s, e) => s + e.amount, 0) || teachers.reduce((s, t) => s + (t.salary || 0), 0);
        const nonStaffExp = totalExp - staffCost;
        const profitMargin = collected > 0 ? Math.round(((collected - totalExp) / collected) * 100) : 0;
        // Teacher cost ratio = teaching staff cost / total income
        const academicStaff = teachers.filter(t => t.staffType === 'Academic');
        const academicSalaryCost = academicStaff.reduce((s, t) => s + (t.salary || 0), 0);
        const teacherCostRatio = collected > 0 ? Math.round((academicSalaryCost / collected) * 100) : 0;
        const revenueAnalytics = DB.settings().revenueAnalytics || {};
        const targetMargin = revenueAnalytics.targetMargin || 20;
        const targetTeacherRatio = revenueAnalytics.targetTeacherRatio || 40;

        return `<div class="grid lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-bold text-slate-900">Revenue Analytics</h3>
                <p class="text-xs text-slate-400 mt-0.5">How much the school earns vs. spends · tiles turn amber when below your benchmarks</p>
              </div>
              <button class="btn btn-ghost text-sm" onclick="revenueAnalyticsParamsModal()">${icon('settings','w-3.5 h-3.5')} Benchmarks</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div class="bg-emerald-50 rounded-xl p-3 text-center">
                <div class="text-xl font-extrabold text-emerald-700">${money(collected)}</div>
                <div class="text-xs text-emerald-600">Total Income</div>
              </div>
              <div class="bg-rose-50 rounded-xl p-3 text-center">
                <div class="text-xl font-extrabold text-rose-700">${money(totalExp)}</div>
                <div class="text-xs text-rose-600">Total Expenses</div>
              </div>
              <div class="bg-${profitMargin >= targetMargin ? 'emerald' : 'amber'}-50 rounded-xl p-3 text-center">
                <div class="text-xl font-extrabold text-${profitMargin >= targetMargin ? 'emerald' : 'amber'}-700">${profitMargin}%</div>
                <div class="text-xs text-${profitMargin >= targetMargin ? 'emerald' : 'amber'}-600">Profit Margin</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Target: ${targetMargin}%</div>
              </div>
              <div class="bg-${teacherCostRatio <= targetTeacherRatio ? 'blue' : 'amber'}-50 rounded-xl p-3 text-center">
                <div class="text-xl font-extrabold text-${teacherCostRatio <= targetTeacherRatio ? 'blue' : 'amber'}-700">${teacherCostRatio}%</div>
                <div class="text-xs text-${teacherCostRatio <= targetTeacherRatio ? 'blue' : 'amber'}-600">Teacher Cost Ratio</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Target: ≤${targetTeacherRatio}%</div>
              </div>
            </div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-slate-600">Teaching Staff Cost</span><span class="font-semibold">${money(academicSalaryCost)} (${teacherCostRatio}% of income)</span></div>
                <div class="progress"><div class="progress-bar ${teacherCostRatio > targetTeacherRatio ? 'bg-amber-500' : ''}" style="width:${Math.min(100,teacherCostRatio)}%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-slate-600">Non-Staff Expenses</span><span class="font-semibold">${money(nonStaffExp)} (${collected > 0 ? Math.round(nonStaffExp/collected*100) : 0}% of income)</span></div>
                <div class="progress"><div class="progress-bar bg-rose-400" style="width:${collected > 0 ? Math.min(100, Math.round(nonStaffExp/collected*100)) : 0}%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-slate-600">Profit Margin</span><span class="font-semibold ${profitMargin >= targetMargin ? 'text-emerald-700' : 'text-amber-700'}">${profitMargin}% ${profitMargin >= targetMargin ? '✓' : `(target ${targetMargin}%)`}</span></div>
                <div class="progress"><div class="progress-bar ${profitMargin < targetMargin ? 'bg-amber-500' : ''}" style="width:${Math.max(0,Math.min(100,profitMargin))}%"></div></div>
              </div>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-slate-900 mb-3">Staff Cost Breakdown</h3>
            ${(() => {
              const byType = {};
              teachers.forEach(t => { const k = t.staffType || 'Other'; byType[k] = (byType[k] || 0) + (t.salary || 0); });
              const total = Object.values(byType).reduce((s, v) => s + v, 0);
              const colors = ['bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-purple-500'];
              return Object.entries(byType).map(([type, amt], i) => `<div class="mb-2">
                <div class="flex justify-between text-xs mb-1"><span class="text-slate-600">${type}</span><span class="font-semibold">${money(amt)} (${total > 0 ? Math.round(amt/total*100) : 0}%)</span></div>
                <div class="progress"><div class="${colors[i % colors.length]} h-full rounded-full" style="width:${total > 0 ? Math.round(amt/total*100) : 0}%"></div></div>
              </div>`).join('');
            })()}
            <div class="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm font-bold">
              <span>Total Staff Cost</span>
              <span class="font-mono text-rose-700">${money(teachers.reduce((s, t) => s + (t.salary || 0), 0))}</span>
            </div>
          </div>
        </div>`;
      })()}

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

function revenueAnalyticsParamsModal() {
  const cfg = DB.settings().revenueAnalytics || {};
  modal({
    title: 'Financial Benchmarks',
    body: `
      <p class="text-sm text-slate-500 mb-4">Set the targets your school aims to hit. Metrics on your dashboard turn amber when they fall short of a benchmark.</p>
      <div class="space-y-3">

        <div class="rounded-xl border border-slate-200 p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-slate-800 text-sm">Profit Margin Target</p>
              <p class="text-xs text-slate-500 mt-0.5">% of income that should remain after all expenses</p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1">
              <input id="ra_margin" type="number" min="0" max="60"
                class="w-10 text-center font-bold text-slate-900 bg-transparent border-none outline-none text-sm"
                value="${cfg.targetMargin || 20}"
                oninput="document.getElementById('ra_margin_r').value=this.value" />
              <span class="text-slate-500 text-sm">%</span>
            </div>
          </div>
          <input id="ra_margin_r" type="range" min="0" max="60" value="${cfg.targetMargin || 20}"
            class="w-full accent-emerald-600 cursor-pointer"
            oninput="document.getElementById('ra_margin').value=this.value" />
          <div class="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0%</span><span class="text-emerald-600 font-medium">Typical: 15–25%</span><span>60%</span>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-slate-800 text-sm">Max Teacher Cost Ratio</p>
              <p class="text-xs text-slate-500 mt-0.5">Teaching staff payroll as % of total income</p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1">
              <input id="ra_teacher" type="number" min="0" max="80"
                class="w-10 text-center font-bold text-slate-900 bg-transparent border-none outline-none text-sm"
                value="${cfg.targetTeacherRatio || 40}"
                oninput="document.getElementById('ra_teacher_r').value=this.value" />
              <span class="text-slate-500 text-sm">%</span>
            </div>
          </div>
          <input id="ra_teacher_r" type="range" min="0" max="80" value="${cfg.targetTeacherRatio || 40}"
            class="w-full accent-blue-600 cursor-pointer"
            oninput="document.getElementById('ra_teacher').value=this.value" />
          <div class="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0%</span><span class="text-blue-600 font-medium">Typical: 35–50%</span><span>80%</span>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 p-4">
          <p class="font-semibold text-slate-800 text-sm mb-1">Annual Revenue Target <span class="text-slate-400 font-normal">(optional)</span></p>
          <p class="text-xs text-slate-500 mb-2">Shown as a reference line on revenue charts</p>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
            <input id="ra_target" type="number" class="input pl-7" value="${cfg.annualTarget || ''}" placeholder="e.g. 60000000" />
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-slate-800 text-sm">Fee Collection Alert</p>
              <p class="text-xs text-slate-500 mt-0.5">Warn me when the collection rate drops below this</p>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1">
              <input id="ra_alert_col" type="number" min="0" max="100"
                class="w-10 text-center font-bold text-slate-900 bg-transparent border-none outline-none text-sm"
                value="${cfg.alertCollectionBelow || 70}"
                oninput="document.getElementById('ra_alert_r').value=this.value" />
              <span class="text-slate-500 text-sm">%</span>
            </div>
          </div>
          <input id="ra_alert_r" type="range" min="0" max="100" value="${cfg.alertCollectionBelow || 70}"
            class="w-full accent-amber-500 cursor-pointer"
            oninput="document.getElementById('ra_alert_col').value=this.value" />
          <div class="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0%</span><span class="text-amber-600 font-medium">Recommended: 70–80%</span><span>100%</span>
          </div>
        </div>

      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveRevenueAnalyticsParams()">${icon('check','w-4 h-4')} Save Targets</button>`
  });
}

function saveRevenueAnalyticsParams() {
  const targetMargin = parseInt(document.getElementById('ra_margin').value) || 20;
  const targetTeacherRatio = parseInt(document.getElementById('ra_teacher').value) || 40;
  const annualTarget = parseInt(document.getElementById('ra_target').value) || null;
  const alertCollectionBelow = parseInt(document.getElementById('ra_alert_col').value) || 70;
  DB.settings({ revenueAnalytics: { targetMargin, targetTeacherRatio, annualTarget, alertCollectionBelow } });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Targets updated', 'success');
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
  const enrollmentView = APP.params.enrollmentView || 'all';
  const currentYear = new Date().getFullYear().toString();
  const currentSession = DB.settings().currentSession || `${currentYear}/${parseInt(currentYear)+1}`;

  const filtered = students.filter(s => {
    if (filter !== 'all' && s.classId !== filter) return false;
    // Enrollment category filter — only applies to active students
    if (enrollmentView !== 'all') {
      if (s.status !== 'active') return false;
      const isNew = s.enrollmentSession === currentSession || s.enrollmentYear === currentYear || (s.admissionDate && s.admissionDate.startsWith(currentYear));
      if (enrollmentView === 'new' && !isNew) return false;
      if (enrollmentView === 'returning' && isNew) return false;
    }
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
        <button class="btn btn-secondary" onclick="exportStudentsCSV()">${icon('download','w-4 h-4')} Student Report</button>
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
                      <button class="btn btn-ghost !p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg" title="Suspend student" onclick="event.stopPropagation(); suspendStudentModal('${s.id}')">${icon('bell','w-4 h-4')}</button>
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

function viewStudent(id, activeTab) {
  const s = DB.find('students', id);
  if (!s) return;
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const inv = COMPUTE.studentInvoice(s.id);
  const attRate = COMPUTE.attendanceRate(s.id);
  const allResults = COMPUTE.studentResults(s.id);
  const results = allResults;
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  const subjects = DB.get('subjects');
  const tab = activeTab || 'profile';

  // ─── Tab bar ────────────────────────────────────────────────────────────────
  const tabs = [
    { k: 'profile',    l: 'Profile' },
    { k: 'transcript', l: 'Transcript' },
    { k: 'attendance', l: 'Attendance' },
    { k: 'finance',    l: 'Finance' },
    { k: 'discipline', l: 'Discipline' },
    { k: 'health',     l: 'Health' },
  ];
  const tabBar = `<div class="flex gap-0.5 mb-4 border-b border-slate-200 overflow-x-auto -mx-1 px-1">
    ${tabs.map(t => `<button onclick="viewStudent('${id}','${t.k}')" class="whitespace-nowrap px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab===t.k?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}">${t.l}</button>`).join('')}
  </div>`;

  // ─── Header (always shown) ───────────────────────────────────────────────────
  const suspensions = DB.query('studentSuspensions', ss => ss.studentId === id).sort((a, b) => b.suspendedAt.localeCompare(a.suspendedAt));
  const header = `
    <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
      ${avatar(s, 'xl')}
      <div class="flex-1">
        <h2 class="text-xl font-bold text-slate-900">${s.name}</h2>
        <p class="text-sm text-slate-500">${cls ? cls.name : '—'} · ${s.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(s.dob)} yrs</p>
        <div class="flex flex-wrap gap-1.5 mt-1.5">
          <code class="text-xs bg-slate-100 px-2 py-0.5 rounded">${s.admissionNo}</code>
          ${statusBadge(s.status)}
          ${s.admissionType === 'transfer' ? `<span class="badge badge-info">Transfer-In</span>` : ''}
          ${s.houseId ? (() => { const h = DB.find('houses', s.houseId); return h ? `<span class="badge badge-neutral">${h.name}</span>` : ''; })() : ''}
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-xs text-slate-400 mb-1">Att.</div>
        <div class="text-2xl font-extrabold ${attRate >= 85 ? 'text-brand-700' : 'text-rose-600'}">${attRate}%</div>
        <div class="text-xs text-slate-400 mt-2">Avg</div>
        <div class="text-2xl font-extrabold text-blue-700">${avg}%</div>
      </div>
    </div>`;

  // ─── TAB: Profile ────────────────────────────────────────────────────────────
  const profileTab = () => {
    const allActs = DB.query('activities', a => a.schoolId === s.schoolId);
    const enrolled = DB.query('studentActivities', sa => sa.studentId === s.id);
    const enrolledIds = enrolled.map(sa => sa.activityId);
    const actTotal = enrolled.reduce((sum, sa) => { const a = DB.find('activities', sa.activityId); return sum + (a ? a.price : 0); }, 0);
    const docs = s.documents || {};
    const presentDocs = _docTypes.filter(d => docs[d.key]);
    return `
      <div class="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Date of Birth</div><div>${fdate(s.dob, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Blood Group</div><div>${s.bloodGroup || '—'}${s.allergies && s.allergies !== 'None' ? ` <span class="badge badge-warn text-xs">${s.allergies}</span>` : ''}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Parent / Guardian</div><div>${parent ? parent.name : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Parent Phone</div><div>${parent ? parent.phone : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Admission Date</div><div>${fdate(s.admissionDate, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Admission Type</div><div>${s.admissionType === 'transfer' ? 'Transfer-in' : 'New Admission'}</div></div>
        ${s.admissionType === 'transfer' && s.transferFromSchool ? `
        <div class="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div class="text-xs text-blue-700 font-semibold uppercase mb-1">Transfer Origin</div>
          <div class="font-semibold text-slate-900">${s.transferFromSchool}</div>
          ${s.transferFromClass ? `<div class="text-xs text-slate-500">Last class: ${s.transferFromClass}</div>` : ''}
          ${s.transferInDate ? `<div class="text-xs text-slate-500">Transfer date: ${fdate(s.transferInDate, { long: true })}</div>` : ''}
          ${s.transferInReason ? `<div class="text-xs text-slate-500 mt-0.5">Reason: ${s.transferInReason}</div>` : ''}
        </div>` : ''}
        ${s.status === 'transferred' ? `
        <div class="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div class="text-xs text-amber-700 font-semibold uppercase mb-1">Transferred Out</div>
          <div class="font-semibold text-slate-900">${s.transferDest || '—'}</div>
          ${s.transferReason ? `<div class="text-xs text-slate-500">${s.transferReason}</div>` : ''}
          ${s.transferredAt ? `<div class="text-xs text-slate-500">Date: ${fdate(s.transferredAt, { long: true })}</div>` : ''}
        </div>` : ''}
        ${s.status === 'withdrawn' ? `
        <div class="col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <div class="text-xs text-rose-700 font-semibold uppercase mb-1">Withdrawn</div>
          <div class="font-semibold text-slate-900">${s.withdrawReason || '—'}</div>
          ${s.withdrawnAt ? `<div class="text-xs text-slate-500">Date: ${fdate(s.withdrawnAt, { long: true })}</div>` : ''}
        </div>` : ''}
      </div>

      ${presentDocs.length ? `<div class="mb-4">
        <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Documents on File</div>
        <div class="grid grid-cols-2 gap-2">
          ${presentDocs.map(d => `<a href="${docs[d.key].data}" download="${docs[d.key].name || d.key}" class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm">
            ${icon('paperclip','w-4 h-4 text-brand-600')}
            <div class="flex-1 min-w-0"><div class="font-semibold truncate">${d.label}</div><div class="text-xs text-slate-500 truncate">${docs[d.key].name || 'view'}</div></div>
            ${icon('download','w-3.5 h-3.5 text-slate-400')}
          </a>`).join('')}
        </div>
      </div>` : ''}

      ${allActs.length ? `<div class="border-t border-slate-100 pt-4">
        <div class="flex items-center justify-between mb-2">
          <div><div class="font-bold text-slate-900 text-sm">Extracurricular Activities</div>
          <div class="text-xs text-slate-500">Toggle — fees update invoice instantly</div></div>
          ${actTotal ? `<div class="text-right"><div class="text-xs text-slate-400">On invoice</div><div class="font-extrabold text-brand-700">${money(actTotal)}/term</div></div>` : ''}
        </div>
        <div class="space-y-2">
          ${allActs.map(a => { const isEnrolled = enrolledIds.includes(a.id);
            return `<div class="flex items-center gap-3 p-2.5 rounded-xl border-2 ${isEnrolled ? 'border-brand-300 bg-brand-50' : 'border-slate-100 hover:border-slate-300'}">
              <span class="text-xl flex-shrink-0">${a.icon}</span>
              <div class="flex-1 min-w-0"><div class="font-semibold text-sm">${a.name}</div><div class="text-xs text-slate-500">${money(a.price)}/term</div></div>
              <button class="btn ${isEnrolled ? 'btn-danger' : 'btn-secondary'} !py-1 !px-3 text-xs" onclick="toggleStudentActivity('${s.id}','${a.id}',${isEnrolled})">
                ${isEnrolled ? 'Remove' : 'Enroll'}
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    `;
  };

  // ─── TAB: Transcript ─────────────────────────────────────────────────────────
  const transcriptTab = () => {
    if (!results.length) return `<div class="text-center text-slate-400 py-8">No results recorded yet.</div>`;
    const terms = [...new Set(results.map(r => r.term))].sort((a,b) => b.localeCompare(a));
    const _es = DB.settings().examStructure || {};
    return terms.map(term => {
      const termResults = results.filter(r => r.term === term);
      const termAvg = termResults.length ? Math.round(termResults.reduce((s,r) => s+r.total, 0) / termResults.length) : 0;
      const _esTypes = _es.terms ? ((_es.terms.find(t => t.name === term) || {}).types || []) : [];
      const ca1L = _esTypes[0] ? _esTypes[0].label : 'CA 1';
      const ca2L = _esTypes[1] ? _esTypes[1].label : 'CA 2';
      const exL  = _esTypes.length > 2 ? _esTypes[_esTypes.length-1].label : 'Exam';
      return `<div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <div class="font-bold text-slate-900">${term}</div>
          <div class="text-sm text-slate-500">Avg: <strong class="${termAvg >= 60 ? 'text-brand-700' : 'text-rose-600'}">${termAvg}%</strong></div>
        </div>
        <div class="card overflow-hidden">
          <table class="tbl text-sm">
            <thead><tr><th>Subject</th><th class="text-center">${ca1L}</th><th class="text-center">${ca2L}</th><th class="text-center">${exL}</th><th class="text-center">Total</th><th class="text-center">Grade</th><th class="text-center">Status</th></tr></thead>
            <tbody>
              ${termResults.map(r => {
                const sub = subjects.find(x => x.id === r.subjectId);
                const gBadge = r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : (r.grade==='D'||r.grade==='E') ? 'badge-warn' : 'badge-info';
                return `<tr>
                  <td class="font-medium">${sub ? sub.name : '—'}</td>
                  <td class="text-center">${r.ca1 ?? '—'}</td>
                  <td class="text-center">${r.ca2 ?? '—'}</td>
                  <td class="text-center">${r.exam ?? '—'}</td>
                  <td class="text-center font-bold">${r.total}</td>
                  <td class="text-center"><span class="badge ${gBadge}">${r.grade}</span></td>
                  <td class="text-center"><span class="badge ${r.approved ? 'badge-success' : 'badge-warn'}">${r.approved ? 'Approved' : 'Pending'}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }).join('');
  };

  // ─── TAB: Attendance ─────────────────────────────────────────────────────────
  const attendanceTab = () => {
    const recs = COMPUTE.studentAttendance(s.id).sort((a,b) => b.date.localeCompare(a.date));
    const present = recs.filter(r => r.status === 'present').length;
    const late    = recs.filter(r => r.status === 'late').length;
    const absent  = recs.filter(r => r.status === 'absent').length;
    if (!recs.length) return `<div class="text-center text-slate-400 py-8">No attendance records yet.</div>`;
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-700 font-semibold uppercase">Present</div><div class="text-2xl font-bold text-brand-900">${present}</div></div>
        <div class="bg-amber-50 rounded-xl p-3 text-center"><div class="text-xs text-amber-700 font-semibold uppercase">Late</div><div class="text-2xl font-bold text-amber-900">${late}</div></div>
        <div class="bg-rose-50 rounded-xl p-3 text-center"><div class="text-xs text-rose-700 font-semibold uppercase">Absent</div><div class="text-2xl font-bold text-rose-900">${absent}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="tbl text-sm">
          <thead><tr><th>Date</th><th class="text-center">Status</th><th>Recorded By</th></tr></thead>
          <tbody>
            ${recs.slice(0, 60).map(r => {
              const tch = DB.find('teachers', r.recordedBy);
              return `<tr>
                <td>${fdate(r.date, { long: true })}</td>
                <td class="text-center"><span class="badge ${r.status==='present'?'badge-success':r.status==='late'?'badge-warn':'badge-danger'}">${r.status}</span></td>
                <td class="text-xs text-slate-500">${tch ? tch.name : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${recs.length > 60 ? `<div class="text-center text-xs text-slate-400 py-2">Showing last 60 of ${recs.length} records</div>` : ''}
      </div>`;
  };

  // ─── TAB: Finance ────────────────────────────────────────────────────────────
  const financeTab = () => {
    const allInv = DB.query('invoices', i => i.studentId === s.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    const allTxns = DB.query('transactions', t => t.studentId === s.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    const totalOwed = allInv.reduce((sum,i) => sum + i.total, 0);
    const totalPaid = allInv.reduce((sum,i) => sum + i.paid, 0);
    const totalBal  = totalOwed - totalPaid;
    if (!allInv.length) return `<div class="text-center text-slate-400 py-8">No invoices found.</div>`;
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-slate-50 rounded-xl p-3 text-center"><div class="text-xs text-slate-500 font-semibold uppercase">Total Billed</div><div class="text-lg font-bold text-slate-900">${money(totalOwed)}</div></div>
        <div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-700 font-semibold uppercase">Total Paid</div><div class="text-lg font-bold text-brand-900">${money(totalPaid)}</div></div>
        <div class="bg-${totalBal > 0 ? 'amber' : 'emerald'}-50 rounded-xl p-3 text-center"><div class="text-xs text-${totalBal > 0 ? 'amber' : 'emerald'}-700 font-semibold uppercase">Outstanding</div><div class="text-lg font-bold text-${totalBal > 0 ? 'amber' : 'emerald'}-900">${money(totalBal)}</div></div>
      </div>
      <div class="space-y-3 mb-4">
        ${allInv.map(i => `<div class="card p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold text-slate-900">${i.term}</div>
            <div class="flex items-center gap-2">${statusBadge(i.status)}<span class="text-xs text-slate-400">${fdate(i.createdAt, { short: true })}</span></div>
          </div>
          <div class="space-y-1">
            ${(i.lineItems || []).map(l => `<div class="flex justify-between text-xs text-slate-600"><span>${l.name}</span><span class="font-mono">${money(l.amount)}</span></div>`).join('')}
            <div class="flex justify-between text-sm font-bold border-t border-slate-100 pt-1 mt-1"><span>Total</span><span>${money(i.total)}</span></div>
            <div class="flex justify-between text-sm text-emerald-700"><span>Paid</span><span>${money(i.paid)}</span></div>
            ${i.balance > 0 ? `<div class="flex justify-between text-sm text-amber-700 font-semibold"><span>Balance</span><span>${money(i.balance)}</span></div>` : ''}
          </div>
        </div>`).join('')}
      </div>
      ${allTxns.length ? `<div class="card overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-100 font-semibold text-sm">Payment History</div>
        <table class="tbl text-xs">
          <thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th><th>Reference</th></tr></thead>
          <tbody>
            ${allTxns.map(t => `<tr>
              <td>${fdate(t.timestamp, { short: true })}</td>
              <td>${t.method}</td>
              <td class="text-right font-mono font-semibold text-brand-700">${money(t.amount)}</td>
              <td><code class="text-xs bg-slate-100 px-1 rounded">${t.reference || '—'}</code></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}`;
  };

  // ─── TAB: Discipline ─────────────────────────────────────────────────────────
  const disciplineTab = () => {
    const discRecs = DB.query('discipline', d => d.studentId === s.id).sort((a,b) => b.date.localeCompare(a.date));
    const suspRecs = DB.query('studentSuspensions', ss => ss.studentId === s.id).sort((a,b) => b.suspendedAt.localeCompare(a.suspendedAt));
    const reward = COMPUTE.studentRewards(s.id);
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-emerald-50 rounded-xl p-3 text-center"><div class="text-xs text-emerald-700 font-semibold uppercase">Points</div><div class="text-2xl font-bold text-emerald-900">${reward.points}</div></div>
        <div class="bg-amber-50 rounded-xl p-3 text-center"><div class="text-xs text-amber-700 font-semibold uppercase">Stars</div><div class="text-2xl font-bold text-amber-900">${'★'.repeat(reward.stars)}</div></div>
        <div class="bg-rose-50 rounded-xl p-3 text-center"><div class="text-xs text-rose-700 font-semibold uppercase">Suspensions</div><div class="text-2xl font-bold text-rose-900">${suspRecs.length}</div></div>
      </div>

      ${suspRecs.length ? `<div class="mb-4">
        <div class="font-bold text-slate-900 text-sm mb-2">Suspension History</div>
        <div class="space-y-2">
          ${suspRecs.map(ss => `<div class="border border-amber-200 bg-amber-50 rounded-xl p-3 text-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="font-semibold text-amber-900">${ss.reason}</div>
              <span class="badge ${ss.reinstatedAt ? 'badge-success' : 'badge-warn'} flex-shrink-0">${ss.reinstatedAt ? 'Reinstated' : 'Active'}</span>
            </div>
            ${ss.notes ? `<div class="text-xs text-amber-700 mt-0.5">${ss.notes}</div>` : ''}
            <div class="text-xs text-slate-500 mt-1">${ss.days} day(s) · Suspended ${fdate(ss.suspendedAt, { long: true })} · Return ${fdate(ss.resumeDate, { short: true })}</div>
            ${ss.reinstatedAt ? `<div class="text-xs text-emerald-700 mt-0.5">Reinstated ${fdate(ss.reinstatedAt, { long: true })}${ss.reinstateNotes ? ' — ' + ss.reinstateNotes : ''}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="font-bold text-slate-900 text-sm mb-2">Conduct Record</div>
      ${discRecs.length === 0 ? `<div class="text-slate-400 text-sm py-4 text-center">No conduct records yet.</div>` : `
        <div class="card overflow-hidden">
          <table class="tbl text-sm">
            <thead><tr><th>Date</th><th>Type</th><th>Note</th><th class="text-center">Points</th></tr></thead>
            <tbody>
              ${discRecs.map(d => `<tr>
                <td class="text-xs text-slate-500">${fdate(d.date, { short: true })}</td>
                <td><span class="badge ${d.type==='commendation'?'badge-success':d.type==='suspension'?'badge-warn':'badge-danger'}">${d.type}</span></td>
                <td class="text-xs">${d.note}</td>
                <td class="text-center font-bold ${d.points >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${d.points >= 0 ? '+' : ''}${d.points}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}`;
  };

  // ─── TAB: Health ─────────────────────────────────────────────────────────────
  const healthTab = () => {
    const visits = DB.query('sickbayVisits', v => v.studentId === s.id).sort((a,b) => b.date.localeCompare(a.date));
    return `
      <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Blood Group</div><div class="font-bold">${s.bloodGroup || '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-0.5">Allergies</div><div class="${s.allergies && s.allergies !== 'None' ? 'text-rose-700 font-semibold' : ''}">${s.allergies || 'None stated'}</div></div>
      </div>
      <div class="font-bold text-slate-900 text-sm mb-2">Sickbay Visits <span class="text-slate-400 font-normal">(${visits.length})</span></div>
      ${visits.length === 0 ? `<div class="text-slate-400 text-sm py-4 text-center">No sickbay visits recorded.</div>` : `
        <div class="space-y-2">
          ${visits.map(v => `<div class="card p-3 text-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="font-semibold text-slate-900">${v.complaint}</div>
              <div class="flex gap-1 flex-shrink-0">
                <span class="badge ${v.outcome==='returned_to_class'?'badge-success':v.outcome==='sent_home'?'badge-warn':'badge-danger'}">${v.outcome?.replace(/_/g,' ') || '—'}</span>
                ${v.parentNotified ? `<span class="badge badge-info">Parent notified</span>` : ''}
              </div>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${fdate(v.date, { long: true })} · Temp: ${v.temperature}°C</div>
            ${v.treatment ? `<div class="text-xs text-slate-600 mt-1 bg-slate-50 rounded-lg px-2 py-1">${v.treatment}</div>` : ''}
          </div>`).join('')}
        </div>`}`;
  };

  const bodyContent = tab === 'profile' ? profileTab()
    : tab === 'transcript' ? transcriptTab()
    : tab === 'attendance' ? attendanceTab()
    : tab === 'finance' ? financeTab()
    : tab === 'discipline' ? disciplineTab()
    : tab === 'health' ? healthTab()
    : profileTab();

  modal({
    title: 'Student Record',
    size: 'lg',
    body: header + tabBar + `<div class="min-h-40">${bodyContent}</div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
      <button class="btn btn-secondary" onclick="printStudentID('${s.id}')">${icon('download','w-4 h-4')} Print ID</button>
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>studentLifecycleModal('${s.id}'),50)">${icon('settings','w-4 h-4')} Actions</button>
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>editStudent('${s.id}'),50)">${icon('edit','w-4 h-4')} Edit</button>
      <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click(); viewAsParent('${s.parentId}')">View as Parent</button>
    `
  });
}

function printStudentID(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const school = DB.find('schools', s.schoolId) || {};
  const house = s.houseId ? DB.find('houses', s.houseId) : null;
  const acts = DB.query('studentActivities', sa => sa.studentId === s.id).map(sa => DB.find('activities', sa.activityId)).filter(Boolean);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Student ID — ${s.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { width: 86mm; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
    .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 16px; text-align: center; }
    .school-name { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; }
    .school-sub { font-size: 9px; opacity: 0.8; margin-top: 2px; text-transform: uppercase; }
    .id-label { font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.2); border-radius: 4px; padding: 2px 8px; margin-top: 8px; display: inline-block; letter-spacing: 1px; }
    .body { padding: 16px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; margin: 0 auto 12px; border: 3px solid #2563eb; }
    .name { font-size: 16px; font-weight: bold; color: #0f172a; text-align: center; }
    .class { font-size: 11px; color: #64748b; text-align: center; margin-top: 2px; }
    .adm { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 4px; font-family: monospace; }
    .divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item .label { font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
    .info-item .value { font-size: 11px; color: #1e293b; font-weight: 600; margin-top: 1px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; }
    .footer-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; }
    .footer-val { font-size: 10px; color: #475569; font-weight: 600; }
    @media print { body { background: white; } .card { box-shadow: none; margin: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="school-name">${school.name || 'Bright Lights Academy'}</div>
      <div class="school-sub">${school.address || ''}</div>
      <div class="id-label">Student ID Card</div>
    </div>
    <div class="body">
      <div class="avatar">${s.name.charAt(0)}</div>
      <div class="name">${s.name}</div>
      <div class="class">${cls ? cls.name : '—'}</div>
      <div class="adm">${s.admissionNo || s.id}</div>
      <div class="divider"></div>
      <div class="info-grid">
        <div class="info-item"><div class="label">Blood Group</div><div class="value">${s.bloodGroup || '—'}</div></div>
        <div class="info-item"><div class="label">Allergies</div><div class="value">${s.allergies || 'None'}</div></div>
        <div class="info-item"><div class="label">House</div><div class="value">${house ? house.name : '—'}</div></div>
        <div class="info-item"><div class="label">Admission Date</div><div class="value">${(s.admissionDate || '').slice(0, 4) || '—'}</div></div>
        <div class="info-item"><div class="label">Parent / Guardian</div><div class="value">${parent ? parent.name : '—'}</div></div>
        <div class="info-item"><div class="label">Parent Phone</div><div class="value">${parent ? parent.phone : '—'}</div></div>
      </div>
      ${acts.length ? `<div class="divider"></div><div class="info-item"><div class="label">Activities</div><div class="value" style="font-size:10px">${acts.map(a=>a.icon+' '+a.name).join(' · ')}</div></div>` : ''}
    </div>
    <div class="footer">
      <div><div class="footer-label">Session</div><div class="footer-val">${DB.settings().currentSession || DB.settings().currentTerm || '—'}</div></div>
      <div style="text-align:right"><div class="footer-label">In emergency call</div><div class="footer-val">${parent ? parent.phone : school.phone || '—'}</div></div>
    </div>
  </div>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else toast('Allow pop-ups to print the ID card', 'warn');
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

/* ---------- Activities Management ---------- */
function view_adm_activities() {
  const schoolId = currentSchoolId();
  const activities = DB.query('activities', a => a.schoolId === schoolId);
  const allEnrollments = DB.query('studentActivities', sa => {
    const s = DB.find('students', sa.studentId);
    return s && s.schoolId === schoolId;
  });

  const rows = activities.map(a => {
    const enrolled = allEnrollments.filter(sa => sa.activityId === a.id);
    const revenue = enrolled.length * (a.price || 0);
    const cost = enrolled.length * (a.instructorCost || 0);
    const net = revenue - cost;
    return { ...a, enrolledCount: enrolled.length, revenue, cost, net };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalNet = totalRevenue - totalCost;

  return `
    ${pageHeader({
      title: 'Extracurricular Activities',
      subtitle: 'Manage clubs, sports and enrichment programmes · track revenue vs instructor cost',
      actions: `<button class="btn btn-primary" onclick="newActivityModal()">${icon('plus','w-4 h-4')} Add Activity</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      ${statCard({ label: 'Activities', value: activities.length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Total Revenue', value: money(totalRevenue), icon: 'fees', color: 'blue' })}
      ${statCard({ label: 'Total Cost', value: money(totalCost), icon: 'trending_up', color: 'gold' })}
      ${statCard({ label: 'Net Income', value: money(totalNet), icon: 'reports', color: totalNet >= 0 ? 'brand' : 'rose' })}
    </div>

    ${rows.length === 0
      ? emptyState({ title: 'No activities yet', body: 'Add clubs, sports and enrichment programmes to start tracking enrollment and revenue.', icon: 'check', action: `<button class="btn btn-primary" onclick="newActivityModal()">${icon('plus','w-4 h-4')} Add Activity</button>` })
      : `<div class="card overflow-hidden">
          <table class="tbl">
            <thead>
              <tr>
                <th>Activity</th>
                <th class="text-center">Enrolled</th>
                <th class="text-right">Fee / Student</th>
                <th class="text-right">Instructor Cost / Student</th>
                <th class="text-right">Total Revenue</th>
                <th class="text-right">Total Cost</th>
                <th class="text-right">Net</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(a => `<tr>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${a.icon || '📋'}</span>
                    <div>
                      <div class="font-semibold text-slate-900">${a.name}</div>
                      ${a.description ? `<div class="text-xs text-slate-400 truncate max-w-xs">${a.description}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td class="text-center font-bold">${a.enrolledCount}</td>
                <td class="text-right">${money(a.price || 0)}</td>
                <td class="text-right text-rose-600">${a.instructorCost ? money(a.instructorCost) : '<span class="text-slate-300">—</span>'}</td>
                <td class="text-right font-semibold text-emerald-700">${money(a.revenue)}</td>
                <td class="text-right text-rose-600">${money(a.cost)}</td>
                <td class="text-right font-bold ${a.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${money(a.net)}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost !p-1.5" onclick="editActivityModal('${a.id}')">${icon('edit','w-4 h-4')}</button>
                    <button class="btn btn-ghost !p-1.5 text-rose-400" onclick="deleteActivity('${a.id}')">${icon('trash','w-4 h-4')}</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td class="px-4 py-3 text-slate-700" colspan="4">Totals</td>
                <td class="px-4 py-3 text-right text-emerald-700">${money(totalRevenue)}</td>
                <td class="px-4 py-3 text-right text-rose-600">${money(totalCost)}</td>
                <td class="px-4 py-3 text-right ${totalNet >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${money(totalNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`}
  `;
}

function newActivityModal() {
  modal({
    title: 'New Activity',
    body: `<div class="space-y-3">
      <div class="grid grid-cols-4 gap-3">
        <div><label class="input-label">Icon</label><input id="act_icon" class="input text-center text-xl" value="🏫" maxlength="2" /></div>
        <div class="col-span-3"><label class="input-label">Activity Name *</label><input id="act_name" class="input" placeholder="e.g. Swimming, Debate Club, Ballet" /></div>
      </div>
      <div><label class="input-label">Description</label><input id="act_desc" class="input" placeholder="Brief description of the activity" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Student Fee (₦)</label><input id="act_price" type="number" class="input" placeholder="0" min="0" /></div>
        <div><label class="input-label">Instructor Cost per Student (₦)</label><input id="act_cost" type="number" class="input" placeholder="0" min="0" /></div>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        ${icon('info','w-3.5 h-3.5 inline mr-1')} Net income per student = Fee − Instructor Cost. This drives the revenue report above.
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveNewActivity()">Add Activity</button>`
  });
}

function saveNewActivity() {
  const name = (document.getElementById('act_name') || {}).value.trim();
  if (!name) { toast('Activity name is required', 'danger'); return; }
  DB.insert('activities', {
    id: uid('act'), schoolId: currentSchoolId(),
    name,
    icon: (document.getElementById('act_icon') || {}).value.trim() || '📋',
    description: (document.getElementById('act_desc') || {}).value.trim(),
    price: parseInt((document.getElementById('act_price') || {}).value) || 0,
    instructorCost: parseInt((document.getElementById('act_cost') || {}).value) || 0
  });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Activity added', 'success');
}

function editActivityModal(id) {
  const a = DB.find('activities', id);
  if (!a) return;
  modal({
    title: 'Edit Activity',
    body: `<div class="space-y-3">
      <div class="grid grid-cols-4 gap-3">
        <div><label class="input-label">Icon</label><input id="eact_icon" class="input text-center text-xl" value="${a.icon || '📋'}" maxlength="2" /></div>
        <div class="col-span-3"><label class="input-label">Activity Name *</label><input id="eact_name" class="input" value="${a.name}" /></div>
      </div>
      <div><label class="input-label">Description</label><input id="eact_desc" class="input" value="${a.description || ''}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Student Fee (₦)</label><input id="eact_price" type="number" class="input" value="${a.price || 0}" min="0" /></div>
        <div><label class="input-label">Instructor Cost per Student (₦)</label><input id="eact_cost" type="number" class="input" value="${a.instructorCost || 0}" min="0" /></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveEditActivity('${id}')">Save Changes</button>`
  });
}

function saveEditActivity(id) {
  const name = (document.getElementById('eact_name') || {}).value.trim();
  if (!name) { toast('Activity name is required', 'danger'); return; }
  DB.update('activities', id, {
    name,
    icon: (document.getElementById('eact_icon') || {}).value.trim() || '📋',
    description: (document.getElementById('eact_desc') || {}).value.trim(),
    price: parseInt((document.getElementById('eact_price') || {}).value) || 0,
    instructorCost: parseInt((document.getElementById('eact_cost') || {}).value) || 0
  });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Activity updated', 'success');
}

function deleteActivity(id) {
  const a = DB.find('activities', id);
  if (!a) return;
  const enrolled = DB.query('studentActivities', sa => sa.activityId === id).length;
  confirm(`Delete "${a.name}"?${enrolled ? ` ${enrolled} student(s) are currently enrolled.` : ''}`, () => {
    DB.remove('activities', id);
    APP.render();
    toast('Activity deleted', 'info');
  }, { danger: true });
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
          <select id="sf_admType" class="input" onchange="toggleTransferFields(this.value)">
            <option value="new">New Admission</option>
            <option value="transfer">Transfer from another school</option>
          </select>
        </div>
        <div id="sf_transferFields" class="sm:col-span-2 hidden space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div><label class="input-label">Previous School Name *</label><input id="sf_transferFrom" class="input" placeholder="e.g. Holy Trinity Primary School, Ikeja" /></div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="input-label">Last Class at Previous School</label><input id="sf_transferFromClass" class="input" placeholder="e.g. Primary 3" /></div>
            <div><label class="input-label">Transfer Date</label><input id="sf_transferInDate" type="date" class="input" value="${today()}" /></div>
          </div>
          <div><label class="input-label">Reason for Transfer</label><input id="sf_transferInReason" class="input" placeholder="e.g. Family relocated to this area" /></div>
          <div class="text-xs text-blue-700">${icon('info','w-3.5 h-3.5 inline mr-1')} A transfer record is created automatically. Upload the student's previous school result/leaving certificate in Documents below.</div>
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
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
    document.getElementById('modalBackdrop')?.click();
    setTimeout(() => addStudentModal(editingId), 50);
    toast('Document uploaded');
  };
  reader.readAsDataURL(file);
}

function clearStudentDoc(key) {
  delete _studentDocsBuffer[key];
  const editingMatch = /saveStudent\('([^']+)'\)/.exec(document.querySelector('#modalRoot .btn-primary')?.getAttribute('onclick') || '');
  const editingId = editingMatch ? editingMatch[1] : null;
  document.getElementById('modalBackdrop')?.click();
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
    document.getElementById('modalBackdrop')?.click();
    APP.render();
    toast(`${name} updated`);
    return;
  }

  const admTypeEl = document.getElementById('sf_admType');
  const admType = admTypeEl ? admTypeEl.value : 'new';
  const transferFromSchool = admType === 'transfer' ? ((document.getElementById('sf_transferFrom') || {}).value || '').trim() : null;
  const transferFromClass  = admType === 'transfer' ? ((document.getElementById('sf_transferFromClass') || {}).value || '').trim() : null;
  const transferInDate     = admType === 'transfer' ? ((document.getElementById('sf_transferInDate') || {}).value || today()) : null;
  const transferInReason   = admType === 'transfer' ? ((document.getElementById('sf_transferInReason') || {}).value || '').trim() : null;
  if (admType === 'transfer' && !transferFromSchool) { toast('Please enter the previous school name for the transfer', 'danger'); return; }
  const newStudent = {
    id: uid('stu'),
    schoolId: currentSchoolId(),
    name, admissionNo: admNo, classId, dob, gender,
    parentId, bloodGroup: blood,
    admissionDate: today(),
    admissionType: admType,
    // Transfer-in fields (null for new admissions)
    transferFromSchool, transferFromClass, transferInDate, transferInReason,
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Done</button>
             <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click(); viewAsParent('${parent.id}')">Login as parent (demo) →</button>`
  });
}

function copyParentCredentials(parentId) {
  const p = DB.find('parents', parentId);
  if (!p || !p.credentials) return;
  const text = `Username: ${p.credentials.username}\nPassword: ${p.credentials.tempPassword}\nLogin: https://caspaa.com/login`;
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  toast('Credentials copied to clipboard');
}

function toggleTransferFields(val) {
  const el = document.getElementById('sf_transferFields');
  if (el) el.classList.toggle('hidden', val !== 'transfer');
}

// Backward-compat aliases
function saveNewStudent() { saveStudent(null); }

function editStudent(id) {
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => addStudentModal(id), 50);
}

/* ---------- Student Lifecycle ---------- */
function studentLifecycleModal(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  document.getElementById('modalBackdrop')?.click();
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

          ${s.status === 'suspended' ? `
          <div class="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-sm text-amber-900 mb-1">
            ${icon('bell','w-4 h-4 inline mr-1')} Currently suspended${s.suspensionReason ? ` — <strong>${s.suspensionReason}</strong>` : ''}${s.suspensionResumeDate ? `. Expected return: ${fdate(s.suspensionResumeDate, { long: true })}` : ''}.
          </div>
          <button class="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl text-left transition" onclick="reinstateStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center">${icon('check','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-emerald-900">Reinstate</div>
                <div class="text-xs text-emerald-700">Lift suspension and restore active status</div>
              </div>
            </div>
          </button>` : `
          <button class="w-full p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl text-left transition" onclick="suspendStudentModal('${studentId}')">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center">${icon('bell','w-5 h-5')}</div>
              <div class="flex-1">
                <div class="font-bold text-amber-900">Suspend</div>
                <div class="text-xs text-amber-700">Temporarily remove from school (reversible)</div>
              </div>
            </div>
          </button>`}

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
      footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>`
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
          Students with status other than "active" will be skipped. Students who transferred <em>into</em> this school and are now enrolled (status = active) will be included — this is correct behaviour. You can review who is included on the next step.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Confirm Bulk Promotion',
    size: 'lg',
    body: `
      <p class="text-sm text-slate-600 mb-3">${students.length} students will move from <strong>${fromCls.name}</strong> to <strong>${toCls ? toCls.name : 'Alumni 🎓'}</strong>:</p>
      <div class="max-h-80 overflow-y-auto space-y-1.5">
        ${students.map(s => `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          ${avatar(s, 'sm')}
          <span class="flex-1 text-sm font-medium">${s.name}</span>
          ${s.admissionType === 'transfer' ? '<span class="badge badge-warn text-xs">Transfer In</span>' : ''}
          <code class="text-xs text-slate-500">${s.admissionNo}</code>
        </div>`).join('')}
      </div>
      <div class="bg-${toCls ? 'emerald' : 'purple'}-50 border border-${toCls ? 'emerald' : 'purple'}-200 rounded-xl p-3 text-sm mt-3">
        ${toCls
          ? `Each parent will be notified. Fee structure for ${toCls.name} will apply from the next invoice cycle.`
          : `All ${students.length} students will be marked as Alumni. Their full academic records remain on file.`}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${count} students ${toId === '__graduate__' ? 'graduated 🎓' : 'promoted'}`, 'success');
}

function promoteStudentModal(studentId) {
  const s = DB.find('students', studentId);
  const levelOrder = { 'Nursery': 1, 'Primary': 2, 'Secondary': 3 };
  const classes = DB.get('classes').sort((a, b) => {
    const la = levelOrder[a.level] || 9, lb = levelOrder[b.level] || 9;
    if (la !== lb) return la - lb;
    return (parseInt(a.name.match(/\d+/)?.[0]) || 0) - (parseInt(b.name.match(/\d+/)?.[0]) || 0);
  });
  const currentIdx = classes.findIndex(c => c.id === s.classId);
  const currentCls = classes[currentIdx];
  const nextCls = currentIdx >= 0 && currentIdx < classes.length - 1 ? classes[currentIdx + 1] : null;
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Promote ' + s.name,
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
          Currently in <strong>${currentCls ? currentCls.name : '—'}</strong>. Promotion takes effect at the start of the new session.
        </div>
        <div>
          <label class="input-label">Promote to</label>
          <select id="promote_class" class="input">
            ${nextCls ? `<option value="${nextCls.id}">${nextCls.name} (recommended — next class)</option>` : ''}
            ${classes.filter(c => c.id !== s.classId && (!nextCls || c.id !== nextCls.id)).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            <option value="__repeat__">Repeat ${currentCls ? currentCls.name : 'same class'} — defer promotion</option>
            <option value="__graduate__">Graduate to Alumni 🎓</option>
          </select>
        </div>
        <div>
          <label class="input-label">Reason / Note (optional)</label>
          <input id="promote_reason" class="input" placeholder="e.g. End of 2024/25 session · satisfactory performance" />
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Academic history is preserved. Fee structure for the new class applies from the next invoice cycle. Parent will be notified.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmPromotion('${studentId}')">${icon('trending_up','w-4 h-4')} Confirm</button>`
  }), 50);
}

function confirmPromotion(studentId) {
  const newClassId = document.getElementById('promote_class').value;
  const reason = (document.getElementById('promote_reason') || {}).value || '';
  const s = DB.find('students', studentId);
  const currentClsName = (DB.find('classes', s.classId) || {}).name || '—';

  if (newClassId === '__repeat__') {
    DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'deferred_promotion', target: `${s.name} repeats ${currentClsName}${reason ? ' — ' + reason : ''}`, timestamp: now() });
    document.getElementById('modalBackdrop')?.click();
    APP.render();
    toast(`${s.name} will repeat ${currentClsName}`, 'info');
    return;
  }

  if (newClassId === '__graduate__') {
    document.getElementById('modalBackdrop')?.click();
    setTimeout(() => graduateStudentModal(studentId), 50);
    return;
  }

  const newCls = DB.find('classes', newClassId);
  if (!newCls) return;
  DB.update('students', studentId, { classId: newClassId });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'promoted_student', target: `${s.name} → ${newCls.name}${reason ? ' (' + reason + ')' : ''}`, timestamp: now() });
  if (s.parentId) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Class Promotion', body: `${s.name} has been promoted to ${newCls.name}. Congratulations! This takes effect from the new session.`, type: 'success', read: false, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} promoted to ${newCls.name}`, 'success');
}

function transferStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
  document.getElementById('modalBackdrop')?.click();
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
        <div><label class="input-label">Notes (optional)</label><textarea id="wd_notes" rows="2" class="input" placeholder="e.g. Will rejoin next term"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-danger" onclick="confirmWithdraw('${studentId}')">${icon('logout','w-4 h-4')} Confirm Withdrawal</button>`
  }), 50);
}

function confirmWithdraw(studentId) {
  const s = DB.find('students', studentId);
  const reason = document.getElementById('wd_reason').value;
  const notes = document.getElementById('wd_notes').value.trim();
  DB.update('students', studentId, { status: 'withdrawn', withdrawReason: reason, withdrawNotes: notes, withdrawnAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'withdrew_student', target: `${s.name} (${reason})`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();

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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); APP.render()">Skip refund</button>
             <button class="btn btn-primary" onclick="processRefund('${studentId}')">${icon('check','w-4 h-4')} Issue Refund</button>`
  });
}

function processRefund(studentId) {
  const amount = parseInt(document.getElementById('rf_amount').value) || 0;
  const method = document.getElementById('rf_method').value;
  if (amount <= 0) { document.getElementById('modalBackdrop')?.click(); APP.render(); return; }
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Refund of ${money(amount)} issued · parent notified`, 'success');
}

function graduateStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop')?.click();
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
        <div>
          <label class="input-label">Examination Type</label>
          <select id="gr_exam" class="input">
            <option value="">— Select if applicable —</option>
            <option value="WAEC">WAEC (West Africa Senior School Certificate)</option>
            <option value="NECO">NECO</option>
            <option value="BECE">BECE (Basic Education Certificate)</option>
            <option value="NABTEB">NABTEB</option>
            <option value="Other">Other</option>
            <option value="None">None (Junior school leaving)</option>
          </select>
        </div>
        <div>
          <label class="input-label">Examination Index Number</label>
          <input id="gr_index" class="input" placeholder="e.g. 4240101001">
        </div>
        <div>
          <label class="input-label">Leaving Certificate Issued?</label>
          <select id="gr_cert" class="input">
            <option value="yes">Yes — certificate issued</option>
            <option value="no">No — pending</option>
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmGraduation('${studentId}')">${icon('check','w-4 h-4')} Graduate</button>`
  }), 50);
}

function confirmGraduation(studentId) {
  const year = parseInt(document.getElementById('gr_year').value) || new Date().getFullYear();
  const finalClass = document.getElementById('gr_class').value.trim();
  const awards = document.getElementById('gr_awards').value.trim();
  const examType = (document.getElementById('gr_exam') || {}).value;
  const examIndex = (document.getElementById('gr_index') || {}).value.trim();
  const certIssued = (document.getElementById('gr_cert') || {}).value === 'yes';
  const s = DB.find('students', studentId);
  DB.update('students', studentId, { status: 'alumni', graduationYear: year, finalClass, awards, examType, examIndex, certIssued, graduatedAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'graduated_student', target: `${s.name} (Class of ${year})`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} graduated to alumni 🎓`, 'success');
}

function suspendStudentModal(studentId) {
  const s = DB.find('students', studentId);
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Suspend ' + s.name,
    body: `
      <div class="space-y-3">
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          Suspension temporarily removes the student from school. Their records and history are fully preserved. The parent is notified immediately. You can reinstate at any time.
        </div>
        <div>
          <label class="input-label">Reason for Suspension</label>
          <select id="susp_reason" class="input">
            ${(DB.settings().disciplineReasons || ['Fighting / Physical Violence','Gross Insubordination','Bullying or Harassment','Damage to School Property','Academic Dishonesty / Exam Malpractice','Possession of Prohibited Item','Non-payment of fees','Persistent Unexplained Absences','Pending Disciplinary Investigation','Other']).map(r => `<option>${r}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Duration (school days)</label>
            <input id="susp_days" type="number" class="input" min="1" max="90" value="3" />
          </div>
          <div>
            <label class="input-label">Expected Return Date</label>
            <input id="susp_resume" type="date" class="input" value="${daysAhead(3).split('T')[0]}" />
          </div>
        </div>
        <div>
          <label class="input-label">Details / Notes (optional)</label>
          <textarea id="susp_notes" rows="2" class="input" placeholder="e.g. Incident occurred during lunch break on 14th June. Both parents informed verbally."></textarea>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="susp_notify" checked class="w-4 h-4 accent-brand-600" />
          <span class="text-sm">Send in-app notification to parent immediately</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-danger" onclick="confirmSuspension('${studentId}')">${icon('bell','w-4 h-4')} Suspend Student</button>`
  }), 50);
}

function confirmSuspension(studentId) {
  const reason = document.getElementById('susp_reason').value;
  const days = parseInt(document.getElementById('susp_days').value) || 3;
  const resumeDate = document.getElementById('susp_resume').value || daysAhead(days).split('T')[0];
  const notes = document.getElementById('susp_notes').value.trim();
  const notify = document.getElementById('susp_notify').checked;
  const s = DB.find('students', studentId);
  const suspId = uid('ssp');
  DB.update('students', studentId, { status: 'suspended', suspensionReason: reason, suspensionDays: days, suspensionNotes: notes, suspendedAt: now(), suspensionResumeDate: resumeDate, activeSuspensionId: suspId });
  // Permanent record — survives reinstatement, builds lifetime history
  DB.insert('studentSuspensions', {
    id: suspId, schoolId: s.schoolId, studentId,
    reason, days, notes, resumeDate,
    suspendedAt: now(), suspendedBy: AUTH.current.id || currentSchoolId(),
    reinstatedAt: null, reinstatedBy: null, reinstateNotes: ''
  });
  DB.insert('discipline', { id: uid('dis'), schoolId: s.schoolId, studentId, type: 'suspension', points: -10, note: reason + (notes ? ' — ' + notes : ''), recordedBy: AUTH.current.id || currentSchoolId(), date: today() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'suspended_student', target: `${s.name} (${days}d — ${reason})`, timestamp: now() });
  if (notify && s.parentId) {
    DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: `Suspension Notice — ${s.name}`, body: `Your child ${s.name} has been suspended. Reason: ${reason}. Expected return: ${fdate(resumeDate, { long: true })}. Please contact the school to discuss.${notes ? ' Details: ' + notes : ''}`, type: 'danger', read: false, timestamp: now() });
  }
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} suspended${notify ? ' · parent notified' : ''}`, 'warn');
}

function changeStudentStatus(studentId, status, label) {
  const s = DB.find('students', studentId);
  DB.update('students', studentId, { status });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'changed_status', target: `${s.name}: ${status}`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(label || `${s.name} status: ${status}`, status === 'suspended' ? 'warn' : undefined);
}

function reinstateStudentModal(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Reinstate ' + s.name,
    body: `
      <div class="space-y-3">
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          ${s.name} is currently suspended${s.suspensionReason ? ` for <strong>${s.suspensionReason}</strong>` : ''}. Reinstating restores their active status and allows them to resume school activities.
        </div>
        <div>
          <label class="input-label">Reinstatement Note (optional)</label>
          <textarea id="ri_notes" rows="2" class="input" placeholder="e.g. Student and parents appeared before the disciplinary committee. Matter resolved."></textarea>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="ri_notify" checked class="w-4 h-4 accent-brand-600" />
          <span class="text-sm">Notify parent of reinstatement</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmReinstatement('${studentId}')">${icon('check','w-4 h-4')} Reinstate Student</button>`
  }), 50);
}

function confirmReinstatement(studentId) {
  const s = DB.find('students', studentId);
  const notes = (document.getElementById('ri_notes') || {}).value || '';
  const notify = (document.getElementById('ri_notify') || {}).checked !== false;
  // Close the permanent suspension record (keeps full history)
  if (s.activeSuspensionId) {
    DB.update('studentSuspensions', s.activeSuspensionId, {
      reinstatedAt: now(), reinstatedBy: AUTH.current.id || currentSchoolId(), reinstateNotes: notes
    });
  } else {
    // fallback: close most recent open record for this student
    const open = DB.query('studentSuspensions', ss => ss.studentId === studentId && !ss.reinstatedAt).slice(-1)[0];
    if (open) DB.update('studentSuspensions', open.id, { reinstatedAt: now(), reinstatedBy: AUTH.current.id || currentSchoolId(), reinstateNotes: notes });
  }
  // Clear live fields but history is preserved in studentSuspensions
  DB.update('students', studentId, { status: 'active', suspensionReason: null, suspensionDays: null, suspensionNotes: null, suspendedAt: null, suspensionResumeDate: null, activeSuspensionId: null });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: 'reinstated_student', target: s.name + (notes ? ' — ' + notes : ''), timestamp: now() });
  if (notify && s.parentId) {
    DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: `${s.name} — Reinstated`, body: `${s.name} has been reinstated and may resume school activities immediately.${notes ? ' ' + notes : ''}`, type: 'success', read: false, timestamp: now() });
  }
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} reinstated · active`, 'success');
}

/* ---------- Alumni Page ---------- */
function view_adm_alumni() {
  const alumni = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'alumni');
  const yearF = APP.params.alumniYear || 'all';
  const years = [...new Set(alumni.map(a => a.graduationYear).filter(Boolean))].sort((a, b) => b - a);

  // Stats
  const totalAlumni = alumni.length;
  const thisYear = new Date().getFullYear();
  const thisYearGrads = alumni.filter(a => a.graduationYear == thisYear).length;
  const withPostInfo = alumni.filter(a => a.alumniEmail || a.currentInstitution).length;

  // Search + year filter
  let filtered = alumni;
  if (APP.params.alumniSearch) {
    const q = APP.params.alumniSearch.toLowerCase();
    filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || (a.admissionNo || '').toLowerCase().includes(q));
  }
  if (yearF !== 'all') filtered = filtered.filter(a => String(a.graduationYear) === yearF);

  return `
    ${pageHeader({
      title: 'Alumni',
      subtitle: `${alumni.length} graduate${alumni.length !== 1 ? 's' : ''} across ${years.length} year${years.length !== 1 ? 's' : ''}`,
      actions: alumni.length ? `<button class="btn btn-secondary" onclick="exportAlumniCSV()">${icon('download','w-4 h-4')} CSV</button>` : ''
    })}

    ${alumni.length === 0 ? emptyState({
      title: 'No alumni yet',
      body: 'Graduate students from their profile (Actions → Graduate to Alumni) to track them here.',
      icon: 'students'
    }) : `
      <div class="flex gap-3 mb-4 flex-wrap">
        <div class="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-sm text-purple-900 font-semibold">${icon('students','w-4 h-4 inline-block mr-1')} ${totalAlumni} Total Alumni</div>
        <div class="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-900 font-semibold">${icon('check','w-4 h-4 inline-block mr-1')} ${thisYearGrads} Graduated ${thisYear}</div>
        <div class="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-sm text-sky-900 font-semibold">${icon('edit','w-4 h-4 inline-block mr-1')} ${withPostInfo} With Post-Grad Info</div>
      </div>
      <input id="alumni_search" class="input mb-3" placeholder="Search by name or admission number..."
        oninput="APP.params.alumniSearch = this.value; APP.render()"
        value="${APP.params.alumniSearch || ''}">
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="chip ${yearF === 'all' ? 'active' : ''}" onclick="APP.params.alumniYear = 'all'; APP.render()">All years</button>
        ${years.map(y => `<button class="chip ${yearF === String(y) ? 'active' : ''}" onclick="APP.params.alumniYear='${y}'; APP.render()">Class of ${y}</button>`).join('')}
      </div>
      ${filtered.length === 0 ? '<div class="text-center text-slate-500 py-8">No alumni match your search.</div>' : `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${filtered.map(a => {
          const hasPostInfo = a.currentInstitution || a.alumniEmail || a.alumniPhone;
          const postInfoHtml = hasPostInfo
            ? '<div class="mt-2 space-y-1 text-xs text-slate-700">'
              + (a.currentInstitution ? `<div>${icon('students','w-3 h-3 inline-block mr-1 text-purple-500')} ${a.currentInstitution}${a.currentCourse ? ' — ' + a.currentCourse : ''}</div>` : '')
              + (a.alumniEmail ? `<div>${icon('edit','w-3 h-3 inline-block mr-1 text-sky-500')} ${a.alumniEmail}</div>` : '')
              + (a.alumniPhone ? `<div>${icon('phone','w-3 h-3 inline-block mr-1 text-green-500')} ${a.alumniPhone}</div>` : '')
              + '</div>'
            : '<div class="mt-2 text-xs text-slate-400 italic">No post-graduation info</div>';
          return '<div class="card p-4">'
            + '<div class="flex items-center gap-3 mb-3">'
            + avatar(a, 'lg')
            + '<div class="flex-1 min-w-0"><div class="font-bold truncate">' + a.name + '</div>'
            + '<div class="text-xs text-slate-500">Class of ' + (a.graduationYear || '—') + '</div></div>'
            + '<span class="badge badge-success">🎓</span></div>'
            + '<div class="text-sm space-y-1">'
            + '<div><span class="text-slate-500">Final class:</span> <strong>' + (a.finalClass || '—') + '</strong></div>'
            + '<div><span class="text-slate-500">Admission:</span> <code class="text-xs">' + a.admissionNo + '</code></div>'
            + (a.examType ? '<div><span class="text-slate-500">Exam:</span> <strong>' + a.examType + '</strong>' + (a.examIndex ? ' · <code class="text-xs">' + a.examIndex + '</code>' : '') + '</div>' : '')
            + (a.awards ? '<div class="bg-purple-50 rounded-lg p-2 text-xs text-purple-900 mt-2"><strong>Awards:</strong> ' + a.awards + '</div>' : '')
            + postInfoHtml
            + '</div>'
            + '<div class="flex flex-wrap gap-2 mt-3">'
            + '<button class="btn btn-secondary text-xs flex-1" onclick="viewStudent(\'' + a.id + '\')">View record</button>'
            + '<button class="btn btn-secondary text-xs flex-1" onclick="adm_updateAlumniModal(\'' + a.id + '\')">' + icon('edit','w-3 h-3 inline-block') + ' Update Info</button>'
            + '</div>'
            + '<div class="flex flex-wrap gap-2 mt-2">'
            + '<button class="btn btn-secondary text-xs flex-1" onclick="adm_printLeavingCertificate(\'' + a.id + '\')">' + icon('download','w-3 h-3 inline-block') + ' Certificate</button>'
            + '<button class="btn btn-secondary text-xs flex-1" style="color:#b45309;border-color:#fcd34d" onclick="adm_readmitAlumni(\'' + a.id + '\')">' + icon('check','w-3 h-3 inline-block') + ' Re-admit</button>'
            + '</div>'
            + '</div>';
        }).join('')}
      </div>
      `}
    `}
  `;
}

/* ---------- Enrollment Analytics ---------- */
function view_adm_enrollment_analytics() {
  const schoolId = currentSchoolId();
  const allStudents = DB.query('students', s => s.schoolId === schoolId);
  const active = allStudents.filter(s => s.status === 'active');
  const alumni = allStudents.filter(s => s.status === 'alumni');
  const classes = DB.get('classes');

  // Enrollment by academic year (from admissionDate)
  const yearMap = {};
  allStudents.forEach(s => {
    if (!s.admissionDate) return;
    const y = s.admissionDate.slice(0, 4);
    yearMap[y] = (yearMap[y] || 0) + 1;
  });
  const yearLabels = Object.keys(yearMap).sort();
  const yearData = yearLabels.map(y => yearMap[y]);

  // Class distribution
  const classMap = {};
  active.forEach(s => {
    const cls = DB.find('classes', s.classId);
    const label = cls ? cls.name : 'Unassigned';
    classMap[label] = (classMap[label] || 0) + 1;
  });
  const classLabels = Object.keys(classMap).sort();
  const classData = classLabels.map(k => classMap[k]);

  // Gender breakdown
  const maleCount = active.filter(s => /^m/i.test(s.gender || '')).length;
  const femaleCount = active.filter(s => /^f/i.test(s.gender || '')).length;
  const otherCount = active.length - maleCount - femaleCount;

  window.afterRender = () => {
    const yearCtx = document.getElementById('enrolYearChart');
    if (yearCtx) {
      new Chart(yearCtx, {
        type: 'bar',
        data: {
          labels: yearLabels.map(y => `${y}/${String(parseInt(y)+1).slice(-2)}`),
          datasets: [{ label: 'New Students', data: yearData,
            backgroundColor: '#f59e0b', borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }
    const classCtx = document.getElementById('enrolClassChart');
    if (classCtx) {
      new Chart(classCtx, {
        type: 'bar',
        data: {
          labels: classLabels,
          datasets: [{ label: 'Students', data: classData,
            backgroundColor: '#3b82f6', borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }
    const genderCtx = document.getElementById('enrolGenderChart');
    if (genderCtx) {
      new Chart(genderCtx, {
        type: 'doughnut',
        data: {
          labels: ['Male', 'Female', 'Other'],
          datasets: [{ data: [maleCount, femaleCount, otherCount],
            backgroundColor: ['#3b82f6', '#f472b6', '#94a3b8'] }]
        },
        options: { responsive: true, cutout: '65%',
          plugins: { legend: { position: 'bottom' } } }
      });
    }
  };

  return `
    ${pageHeader({
      title: 'Enrollment Analytics',
      subtitle: 'Trends, class distribution and demographic breakdown',
      actions: `<button class="btn btn-secondary" onclick="exportEnrollmentCSV()">${icon('download','w-4 h-4')} Export</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      ${statCard({ label: 'Active Students', value: active.length, icon: 'students', color: 'brand' })}
      ${statCard({ label: 'Alumni', value: alumni.length, icon: 'check', color: 'blue' })}
      ${statCard({ label: 'Male', value: maleCount, icon: 'students', color: 'blue' })}
      ${statCard({ label: 'Female', value: femaleCount, icon: 'students', color: 'rose' })}
    </div>

    <div class="grid lg:grid-cols-3 gap-4 mb-4">
      <div class="lg:col-span-2 card p-5">
        <h3 class="font-bold text-slate-900 mb-4">New Enrollments by Academic Year</h3>
        <canvas id="enrolYearChart" height="180"></canvas>
      </div>
      <div class="card p-5 flex flex-col items-center">
        <h3 class="font-bold text-slate-900 mb-4 self-start">Gender Split</h3>
        <canvas id="enrolGenderChart" height="200"></canvas>
      </div>
    </div>

    <div class="card p-5 mb-4">
      <h3 class="font-bold text-slate-900 mb-4">Students by Class</h3>
      <canvas id="enrolClassChart" height="120"></canvas>
    </div>

    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Enrollment by Year Detail</h3>
      </div>
      <table class="tbl">
        <thead><tr><th>Academic Year</th><th class="text-center">New Students</th><th class="text-center">Cumulative</th></tr></thead>
        <tbody>
          ${yearLabels.map((y, i) => {
            const cumulative = yearData.slice(0, i + 1).reduce((s, n) => s + n, 0);
            return `<tr>
              <td class="font-medium">${y}/${String(parseInt(y)+1).slice(-2)}</td>
              <td class="text-center font-bold">${yearMap[y]}</td>
              <td class="text-center text-slate-600">${cumulative}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportEnrollmentCSV() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId);
  const headers = ['Name', 'Admission No', 'Class', 'Gender', 'Admission Date', 'Status'];
  const rows = students.map(s => {
    const cls = DB.find('classes', s.classId);
    return [s.name, s.admissionNo || s.id, cls ? cls.name : '', s.gender || '', s.admissionDate || '', s.status];
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `enrollment_report_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Enrollment report exported', 'success');
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

function adm_updateAlumniModal(alumniId) {
  const a = DB.find('students', alumniId);
  if (!a) return;
  modal({
    title: 'Update Alumni Information — ' + a.name,
    size: 'md',
    body: `<div class="space-y-3">
      <div class="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-900">
        Keep this record up to date to maintain a strong alumni network.
      </div>
      <div>
        <label class="input-label">Current Institution / Employer</label>
        <input id="al_inst" class="input" placeholder="e.g. University of Lagos, Faculty of Medicine" value="${a.currentInstitution || ''}">
      </div>
      <div>
        <label class="input-label">Course / Programme</label>
        <input id="al_course" class="input" placeholder="e.g. MBBS Medicine &amp; Surgery" value="${a.currentCourse || ''}">
      </div>
      <div>
        <label class="input-label">Alumni Email Address</label>
        <input id="al_email" type="email" class="input" placeholder="e.g. john.doe@gmail.com" value="${a.alumniEmail || ''}">
      </div>
      <div>
        <label class="input-label">Alumni Phone Number</label>
        <input id="al_phone" type="tel" class="input" placeholder="e.g. 0812 345 6789" value="${a.alumniPhone || ''}">
      </div>
      <div>
        <label class="input-label">Leaving Certificate Issued?</label>
        <select id="al_cert" class="input">
          <option value="yes" ${a.certIssued ? 'selected' : ''}>Yes — issued</option>
          <option value="no" ${!a.certIssued ? 'selected' : ''}>No — pending</option>
        </select>
      </div>
      <div>
        <label class="input-label">Notes</label>
        <textarea id="al_notes" class="input" rows="2" placeholder="Any notable achievements, contact notes, etc.">${a.alumniNotes || ''}</textarea>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="adm_saveAlumniInfo('${alumniId}')">Save</button>`
  });
}

function adm_saveAlumniInfo(alumniId) {
  const currentInstitution = (document.getElementById('al_inst') || {}).value.trim();
  const currentCourse = (document.getElementById('al_course') || {}).value.trim();
  const alumniEmail = (document.getElementById('al_email') || {}).value.trim();
  const alumniPhone = (document.getElementById('al_phone') || {}).value.trim();
  const certIssued = (document.getElementById('al_cert') || {}).value === 'yes';
  const alumniNotes = (document.getElementById('al_notes') || {}).value.trim();
  DB.update('students', alumniId, { currentInstitution, currentCourse, alumniEmail, alumniPhone, certIssued, alumniNotes });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Alumni information updated', 'success');
}

function adm_printLeavingCertificate(alumniId) {
  const a = DB.find('students', alumniId);
  if (!a) return;
  const schoolName = (DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html><head><title>School Leaving Certificate — ${a.name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #111; }
  .header { text-align: center; border-bottom: 3px double #111; padding-bottom: 16px; margin-bottom: 24px; }
  .school-name { font-size: 22px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .cert-title { font-size: 18px; margin: 12px 0 4px; text-transform: uppercase; letter-spacing: 2px; color: #555; }
  .body { line-height: 2.2; font-size: 15px; }
  .field { border-bottom: 1px solid #999; display: inline-block; min-width: 220px; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; }
  .sig { text-align: center; }
  .sig-line { border-top: 1px solid #111; width: 200px; margin: 0 auto 4px; }
  @media print { button { display: none; } }
</style>
</head><body>
<div class="header">
  <div class="school-name">${schoolName}</div>
  <div class="cert-title">School Leaving Certificate</div>
</div>
<div class="body">
  <p>This is to certify that</p>
  <p><strong><span class="field">&nbsp;${a.name}&nbsp;</span></strong> (Admission No: <span class="field">&nbsp;${a.admissionNo || '—'}&nbsp;</span>)</p>
  <p>was a bona fide student of <strong>${schoolName}</strong></p>
  <p>from <span class="field">&nbsp;${a.enrollmentDate ? a.enrollmentDate.slice(0,4) : '—'}&nbsp;</span> to <span class="field">&nbsp;${a.graduatedAt ? a.graduatedAt.slice(0,4) : a.graduationYear || '—'}&nbsp;</span></p>
  <p>and satisfactorily completed the <span class="field">&nbsp;${a.finalClass || '—'}&nbsp;</span> programme.</p>
  ${a.examType ? `<p>The student sat the <strong>${a.examType}</strong> examination${a.examIndex ? ' with index number <span class="field">&nbsp;' + a.examIndex + '&nbsp;</span>' : ''}.</p>` : ''}
  ${a.awards ? `<p><strong>Awards &amp; Distinctions:</strong> ${a.awards}</p>` : ''}
  <p>This certificate is issued at the request of the student for whatever purpose it may serve.</p>
</div>
<div class="footer">
  <div class="sig"><div class="sig-line"></div><div>Class Teacher / Form Tutor</div></div>
  <div class="sig"><div class="sig-line"></div><div>Head Teacher / Principal</div></div>
  <div class="sig"><div class="sig-line"></div><div>Date Issued</div></div>
</div>
<br><br>
<div style="text-align:center"><button onclick="window.print()">Print Certificate</button></div>
</body></html>`);
  w.document.close();
}

function adm_readmitAlumni(alumniId) {
  const a = DB.find('students', alumniId);
  if (!a) return;
  confirm('Re-admit ' + a.name + ' as an active student? Their alumni record will be preserved but status will change to active.', () => {
    DB.update('students', alumniId, { status: 'active', readmittedAt: now(), readmittedBy: AUTH.current.id });
    APP.render();
    toast(a.name + ' re-admitted as active student', 'success');
  }, { yesLabel: 'Re-admit' });
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  if (created.length && !errors.length) toast(`Imported ${created.length} student${created.length!==1?'s':''} from ${fileName}`, 'success');
  else if (created.length && errors.length) {
    modal({
      title: `Partial import: ${created.length} ok, ${errors.length} skipped`,
      body: `<div class="space-y-2"><div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">${created.length} student${created.length!==1?'s':''} successfully imported.</div>
      <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm"><strong class="block mb-1">Skipped rows:</strong>${errors.map(e=>`<div>• ${e}</div>`).join('')}</div></div>`,
      footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click()">OK</button>`
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
            <div class="flex items-center gap-1.5">
              <div class="font-semibold text-slate-900">${t.name}</div>
              ${t.status === 'suspended' ? `<span class="badge badge-warn text-xs">Suspended</span>` : ''}
              ${t.status === 'terminated' ? `<span class="badge badge-danger text-xs">Terminated</span>` : ''}
            </div>
            <div class="text-xs text-slate-500">${t.email}</div>
          </div>
        </div>
      </td>
      <td>${staffSubjectLabel(t)}</td>
      <td>${t.classes && t.classes.length ? `<span class="badge badge-neutral">${t.classes.length} class${t.classes.length !== 1 ? 'es' : ''}</span>` : '<span class="text-slate-400 text-sm">—</span>'}</td>
      <td>${fdate(t.hireDate, { short: true })}</td>
      <td><span class="font-mono">${money(t.salary)}</span></td>
      <td class="text-right" onclick="event.stopPropagation()">
        <div class="flex items-center justify-end gap-1">
          ${t.status !== 'terminated' ? (
            t.status === 'suspended'
              ? `<button class="btn btn-secondary text-xs !py-1" onclick="reinstateStaffModal('${t.id}')">${icon('check_circle','w-3.5 h-3.5')} Reinstate</button>`
              : `<button class="btn btn-secondary text-xs !py-1" onclick="suspendStaffModal('${t.id}')">${icon('pause_circle','w-3.5 h-3.5')} Suspend</button>`
          ) : '<span class="text-xs text-slate-400">Offboarded</span>'}
          ${t.status !== 'terminated' ? `<button class="btn btn-secondary text-xs !py-1 text-rose-600 border-rose-200 hover:bg-rose-50" onclick="terminateStaffModal('${t.id}')">${icon('logout','w-3.5 h-3.5')} Offboard</button>` : ''}
          <button class="btn btn-ghost !p-1.5" onclick="viewStaff('${t.id}')">${icon('arrow_left','w-4 h-4 rotate-180 text-slate-400')}</button>
        </div>
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

function viewStaff(id, activeTab) {
  const t = DB.find('teachers', id);
  if (!t) return;
  const allClasses = DB.get('classes');
  const allSubjects = DB.get('subjects');
  const classes = allClasses.filter(c => (t.classes || []).includes(c.id));
  const subjectsTaught = (t.subjects || []).map(sid => allSubjects.find(s => s.id === sid)).filter(Boolean);
  const myResults = DB.query('results', r => (t.classes || []).includes(r.classId) && (t.subjects || []).includes(r.subjectId));
  const avgScore = myResults.length ? Math.round(myResults.reduce((s, r) => s + r.total, 0) / myResults.length) : 0;
  const passRate = myResults.length ? Math.round(myResults.filter(r => r.grade !== 'F').length / myResults.length * 100) : 0;
  const myAttendance = DB.query('staffAttendance', a => a.staffId === t.id);
  const myAttRate = myAttendance.length ? Math.round((myAttendance.filter(a => a.status === 'present').length / myAttendance.length) * 100) : 0;
  const myAssignments = DB.query('assignments', a => a.teacherId === t.id);
  const docs = t.documents || {};
  const presentDocs = _staffDocTypes.filter(d => docs[d.key]);
  const tab = activeTab || 'profile';

  const tabs = [
    { k: 'profile',    l: 'Profile' },
    { k: 'leave',      l: 'Leave & Attendance' },
    { k: 'appraisals', l: 'Appraisals' },
    { k: 'payslips',   l: 'Payslips' },
    { k: 'hr',         l: 'HR Actions' },
  ];
  const tabBar = `<div class="flex gap-0.5 mb-4 border-b border-slate-200 overflow-x-auto -mx-1 px-1">
    ${tabs.map(tb => `<button onclick="viewStaff('${id}','${tb.k}')" class="whitespace-nowrap px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab===tb.k?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}">${tb.l}</button>`).join('')}
  </div>`;

  const suspensions = DB.query('staffDiscipline', d => d.staffId === id).sort((a,b) => b.date.localeCompare(a.date));
  const openSusp = suspensions.filter(d => d.type === 'suspension' && !d.reinstatedAt);
  const isSuspended = t.status === 'suspended';
  const isTerminated = t.status === 'terminated';

  const header = `
    <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
      ${avatar(t.name, 'xl')}
      <div class="flex-1">
        <h2 class="text-lg font-bold text-slate-900">${t.name}</h2>
        <div class="flex flex-wrap gap-1.5 mt-1">
          <span class="badge ${t.staffType === 'Academic' ? 'badge-success' : 'badge-info'}">${t.staffType || 'Academic'}</span>
          ${t.role && t.staffType !== 'Academic' ? `<span class="badge badge-neutral">${t.role}</span>` : ''}
          ${isSuspended ? `<span class="badge badge-warn">Suspended</span>` : ''}
          ${isTerminated ? `<span class="badge badge-danger">Terminated</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1.5">${t.email || ''} ${t.email && t.phone ? '·' : ''} ${t.phone || ''}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-xs text-slate-400 mb-0.5">Attendance</div>
        <div class="text-2xl font-extrabold ${myAttRate >= 85 ? 'text-brand-700' : 'text-rose-600'}">${myAttRate}%</div>
        ${t.staffType === 'Academic' ? `<div class="text-xs text-slate-400 mt-1.5">Avg Score</div><div class="text-xl font-extrabold text-blue-700">${avgScore}%</div>` : ''}
      </div>
    </div>`;

  // ─── Profile ─────────────────────────────────────────────────────────────────
  const profileTab = () => `
    <div class="space-y-3">
      ${subjectsTaught.length ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Subjects Taught</div>
        <div class="flex flex-wrap gap-1.5">${subjectsTaught.map(s => `<span class="badge badge-success">${s.name}</span>`).join('')}</div>
      </div>` : ''}
      ${classes.length ? `<div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Assigned Classes</div>
        <div class="flex flex-wrap gap-1.5">${classes.map(c => `<span class="badge badge-info">${c.name}</span>`).join('')}</div>
      </div>` : ''}
      ${t.staffType === 'Academic' ? `<div class="grid grid-cols-4 gap-2">
        <div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-700 font-semibold">AVG SCORE</div><div class="text-xl font-bold text-brand-900 mt-1">${avgScore}%</div></div>
        <div class="bg-emerald-50 rounded-xl p-3 text-center"><div class="text-xs text-emerald-700 font-semibold">PASS RATE</div><div class="text-xl font-bold text-emerald-900 mt-1">${passRate}%</div></div>
        <div class="bg-amber-50 rounded-xl p-3 text-center"><div class="text-xs text-amber-700 font-semibold">PUNCTUALITY</div><div class="text-xl font-bold text-amber-900 mt-1">${myAttRate}%</div></div>
        <div class="bg-blue-50 rounded-xl p-3 text-center"><div class="text-xs text-blue-700 font-semibold">ASSIGNMENTS</div><div class="text-xl font-bold text-blue-900 mt-1">${myAssignments.length}</div></div>
      </div>` : ''}
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><div class="text-xs uppercase text-slate-500 font-semibold mb-0.5">Date of Birth</div><div>${t.dob ? fdate(t.dob, { long: true }) : '—'}</div></div>
        <div><div class="text-xs uppercase text-slate-500 font-semibold mb-0.5">Hire Date</div><div>${fdate(t.hireDate, { long: true })}</div></div>
        <div><div class="text-xs uppercase text-slate-500 font-semibold mb-0.5">Monthly Salary</div><div class="font-mono">${money(t.salary)}</div></div>
        <div><div class="text-xs uppercase text-slate-500 font-semibold mb-0.5">Payroll Account</div><div>${t.bank ? `${t.bank.name} · ${t.bank.account}` : '—'}</div></div>
      </div>
      ${presentDocs.length ? `<div>
        <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Documents on File</div>
        <div class="grid grid-cols-2 gap-2">
          ${presentDocs.map(d => `<a href="${docs[d.key].data}" download="${docs[d.key].name || d.key}" class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm">
            ${icon('paperclip','w-4 h-4 text-brand-600')}
            <div class="flex-1 min-w-0"><div class="font-semibold truncate">${d.label}</div><div class="text-xs text-slate-500 truncate">${docs[d.key].name || 'view'}</div></div>
            ${icon('download','w-3.5 h-3.5 text-slate-400')}
          </a>`).join('')}
        </div>
      </div>` : ''}
    </div>`;

  // ─── Leave & Attendance ───────────────────────────────────────────────────────
  const leaveTab = () => {
    const leaves = DB.query('leaveRequests', l => l.staffId === id).sort((a,b) => b.requestedAt.localeCompare(a.requestedAt));
    const attRecs = myAttendance.sort((a,b) => b.date.localeCompare(a.date));
    const present = attRecs.filter(r => r.status === 'present').length;
    const late    = attRecs.filter(r => r.status === 'late').length;
    const absent  = attRecs.filter(r => r.status === 'absent').length;
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-700 font-semibold uppercase">Present</div><div class="text-2xl font-bold text-brand-900">${present}</div></div>
        <div class="bg-amber-50 rounded-xl p-3 text-center"><div class="text-xs text-amber-700 font-semibold uppercase">Late</div><div class="text-2xl font-bold text-amber-900">${late}</div></div>
        <div class="bg-rose-50 rounded-xl p-3 text-center"><div class="text-xs text-rose-700 font-semibold uppercase">Absent</div><div class="text-2xl font-bold text-rose-900">${absent}</div></div>
      </div>
      <div class="font-bold text-slate-900 text-sm mb-2">Leave Requests <span class="text-slate-400 font-normal">(${leaves.length})</span></div>
      ${leaves.length === 0 ? `<div class="text-slate-400 text-sm py-3 text-center">No leave requests found.</div>` : `
        <div class="card overflow-hidden mb-4">
          <table class="tbl text-sm">
            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th class="text-center">Status</th><th>Reason</th></tr></thead>
            <tbody>
              ${leaves.map(l => `<tr>
                <td class="capitalize">${l.leaveType}</td>
                <td>${fdate(l.startDate, { short: true })}</td>
                <td>${fdate(l.endDate, { short: true })}</td>
                <td>${l.days}</td>
                <td class="text-center"><span class="badge ${l.status==='approved'?'badge-success':l.status==='rejected'?'badge-danger':'badge-warn'}">${l.status}</span></td>
                <td class="text-xs text-slate-500 max-w-xs truncate">${l.reason || '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      ${attRecs.length ? `<div class="font-bold text-slate-900 text-sm mb-2">Attendance Log <span class="text-slate-400 font-normal">(recent 40)</span></div>
        <div class="card overflow-hidden">
          <table class="tbl text-sm">
            <thead><tr><th>Date</th><th class="text-center">Status</th></tr></thead>
            <tbody>${attRecs.slice(0,40).map(r => `<tr>
              <td>${fdate(r.date, { long: true })}</td>
              <td class="text-center"><span class="badge ${r.status==='present'?'badge-success':r.status==='late'?'badge-warn':'badge-danger'}">${r.status}</span></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>` : ''}
    `;
  };

  // ─── Appraisals ───────────────────────────────────────────────────────────────
  const appraisalsTab = () => {
    const apps = DB.query('appraisals', a => a.staffId === id).sort((a,b) => b.date.localeCompare(a.date));
    if (!apps.length) return `<div class="text-slate-400 text-sm py-8 text-center">No appraisals recorded yet.</div>`;
    return `<div class="space-y-3">
      ${apps.map(a => `<div class="card p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-bold text-slate-900">${a.cycle || a.term || '—'}</div>
            <div class="text-xs text-slate-400 mt-0.5">${fdate(a.date, { long: true })}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-extrabold ${a.score >= 70 ? 'text-brand-700' : a.score >= 50 ? 'text-amber-600' : 'text-rose-600'}">${a.score}<span class="text-sm font-normal text-slate-400">/100</span></div>
            ${a.rating ? `<div class="badge ${a.rating==='Excellent'?'badge-success':a.rating==='Good'?'badge-info':a.rating==='Poor'?'badge-danger':'badge-warn'}">${a.rating}</div>` : ''}
          </div>
        </div>
        ${a.comments ? `<div class="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">${a.comments}</div>` : ''}
        ${a.goals ? `<div class="text-xs text-slate-500 mt-1">Goals: ${a.goals}</div>` : ''}
      </div>`).join('')}
    </div>`;
  };

  // ─── Payslips ─────────────────────────────────────────────────────────────────
  const payslipsTab = () => {
    const slips = DB.query('payslips', p => p.staffId === id).sort((a,b) => b.periodEnd.localeCompare(a.periodEnd));
    if (!slips.length) return `<div class="text-slate-400 text-sm py-8 text-center">No payslips found.</div>`;
    return `<div class="card overflow-hidden">
      <table class="tbl text-sm">
        <thead><tr><th>Period</th><th class="text-right">Gross</th><th class="text-right">Deductions</th><th class="text-right">Net</th><th class="text-center">Status</th></tr></thead>
        <tbody>
          ${slips.map(p => `<tr>
            <td>${fdate(p.periodStart, { short: true })} → ${fdate(p.periodEnd, { short: true })}</td>
            <td class="text-right font-mono">${money(p.grossPay || p.salary)}</td>
            <td class="text-right font-mono text-rose-600">${money(p.totalDeductions || 0)}</td>
            <td class="text-right font-mono font-bold text-brand-700">${money(p.netPay || p.salary)}</td>
            <td class="text-center"><span class="badge ${p.status==='paid'?'badge-success':'badge-warn'}">${p.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  };

  // ─── HR Actions ───────────────────────────────────────────────────────────────
  const hrTab = () => {
    const discRecs = suspensions; // all staffDiscipline records for this staff
    const termRec = DB.query('staffTerminations', r => r.staffId === id)[0];
    const suspRecs = discRecs.filter(d => d.type === 'suspension');
    const warnings = discRecs.filter(d => d.type === 'warning');
    const commendations = discRecs.filter(d => d.type === 'commendation');
    return `
      ${termRec ? `<div class="border border-rose-300 bg-rose-50 rounded-xl p-4 mb-4">
        <div class="flex items-start gap-3">
          ${icon('x_circle','w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5')}
          <div>
            <div class="font-bold text-rose-900">Termination Record</div>
            <div class="text-sm text-rose-700 mt-0.5">${termRec.reason}</div>
            <div class="text-xs text-rose-500 mt-1">Effective ${fdate(termRec.effectiveDate, { long: true })} · Category: ${termRec.category || '—'}</div>
            ${termRec.notes ? `<div class="text-xs text-slate-600 mt-1">${termRec.notes}</div>` : ''}
            ${termRec.finalPayment ? `<div class="text-xs text-slate-500 mt-0.5">Final payment: ${money(termRec.finalPayment)}</div>` : ''}
          </div>
        </div>
      </div>` : ''}

      ${suspRecs.length ? `<div class="mb-4">
        <div class="font-bold text-slate-900 text-sm mb-2">Suspension History <span class="text-slate-400 font-normal">(${suspRecs.length})</span></div>
        <div class="space-y-2">
          ${suspRecs.map(d => `<div class="border border-amber-200 bg-amber-50 rounded-xl p-3 text-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="font-semibold text-amber-900">${d.reason}</div>
              <span class="badge ${d.reinstatedAt ? 'badge-success' : 'badge-warn'} flex-shrink-0">${d.reinstatedAt ? 'Reinstated' : 'Active'}</span>
            </div>
            ${d.notes ? `<div class="text-xs text-amber-700 mt-0.5">${d.notes}</div>` : ''}
            <div class="text-xs text-slate-500 mt-1">${d.days} day(s) · ${fdate(d.date, { long: true })}</div>
            ${d.reinstatedAt ? `<div class="text-xs text-emerald-700 mt-0.5">Reinstated ${fdate(d.reinstatedAt, { long: true })}${d.reinstateNotes ? ' — ' + d.reinstateNotes : ''}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${warnings.length ? `<div class="mb-4">
        <div class="font-bold text-slate-900 text-sm mb-2">Warnings <span class="text-slate-400 font-normal">(${warnings.length})</span></div>
        <div class="space-y-2">
          ${warnings.map(d => `<div class="border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm">
            <div class="font-semibold text-slate-900">${d.reason}</div>
            ${d.notes ? `<div class="text-xs text-slate-500 mt-0.5">${d.notes}</div>` : ''}
            <div class="text-xs text-slate-400 mt-1">${fdate(d.date, { long: true })}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${commendations.length ? `<div class="mb-4">
        <div class="font-bold text-slate-900 text-sm mb-2">Commendations</div>
        <div class="space-y-2">
          ${commendations.map(d => `<div class="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-sm">
            <div class="font-semibold text-emerald-900">${d.reason}</div>
            <div class="text-xs text-emerald-600 mt-0.5">${fdate(d.date, { long: true })}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${!termRec && !suspRecs.length && !warnings.length && !commendations.length ? `<div class="text-slate-400 text-sm py-8 text-center">No HR actions recorded for this staff member.</div>` : ''}

      ${!isTerminated ? `<div class="border-t border-slate-100 pt-4 mt-4 flex flex-wrap gap-2">
        ${isSuspended
          ? `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>reinstateStaffModal('${id}'),50)">${icon('check_circle','w-4 h-4')} Reinstate Staff</button>`
          : `<button class="btn btn-warn" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>suspendStaffModal('${id}'),50)">${icon('pause_circle','w-4 h-4')} Suspend Staff</button>`}
        <button class="btn btn-danger" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>terminateStaffModal('${id}'),50)">${icon('logout','w-4 h-4')} Offboard Staff</button>
        <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>issueStaffWarningModal('${id}'),50)">${icon('alert_triangle','w-4 h-4')} Issue Warning</button>
      </div>` : ''}
    `;
  };

  const bodyContent = tab === 'profile'    ? profileTab()
    : tab === 'leave'      ? leaveTab()
    : tab === 'appraisals' ? appraisalsTab()
    : tab === 'payslips'   ? payslipsTab()
    : tab === 'hr'         ? hrTab()
    : profileTab();

  modal({
    title: 'Staff Record',
    size: 'lg',
    body: header + tabBar + `<div class="min-h-40">${bodyContent}</div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
      ${!isTerminated ? `
        ${isSuspended
          ? `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>reinstateStaffModal('${id}'),50)">${icon('check_circle','w-4 h-4')} Reinstate</button>`
          : `<button class="btn btn-warn" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>suspendStaffModal('${id}'),50)">${icon('pause_circle','w-4 h-4')} Suspend</button>`}
        <button class="btn btn-danger" onclick="document.getElementById('modalBackdrop')?.click(); setTimeout(()=>terminateStaffModal('${id}'),50)">${icon('logout','w-4 h-4')} Offboard</button>
      ` : ''}
    `
  });
}

// ─── Staff HR Action Modals ───────────────────────────────────────────────────

function suspendStaffModal(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  if (t.status === 'terminated') { toast('This staff member has been terminated', 'danger'); return; }
  modal({
    title: `Suspend — ${t.name}`,
    size: 'md',
    body: `
      <div class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        ${icon('alert_triangle','w-5 h-5 text-amber-600 flex-shrink-0')}
        <div class="text-sm text-amber-800">The staff member will be suspended and access may be restricted until reinstated.</div>
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Reason for Suspension *</label>
          <select id="stf_susp_reason" class="input">
            <option>Gross Misconduct</option>
            <option>Financial Irregularity</option>
            <option>Insubordination</option>
            <option>Pending Investigation</option>
            <option>Absent Without Leave</option>
            <option>Other</option>
          </select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Duration (days)</label><input id="stf_susp_days" class="input" type="number" value="5" min="1" max="90" /></div>
          <div><label class="input-label">With Pay?</label>
            <select id="stf_susp_pay" class="input"><option value="yes">Yes — with pay</option><option value="no">No — without pay</option></select></div>
        </div>
        <div><label class="input-label">Additional Notes</label><textarea id="stf_susp_notes" class="input" rows="2" placeholder="Details, incident report reference, etc."></textarea></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-warn" onclick="confirmStaffSuspension('${id}')">${icon('pause_circle','w-4 h-4')} Suspend Staff</button>`
  });
}

function confirmStaffSuspension(staffId) {
  const t = DB.find('teachers', staffId);
  const reason  = document.getElementById('stf_susp_reason').value;
  const days    = parseInt(document.getElementById('stf_susp_days').value) || 5;
  const withPay = document.getElementById('stf_susp_pay').value === 'yes';
  const notes   = (document.getElementById('stf_susp_notes') || {}).value || '';
  const discId  = uid('sdf');
  DB.update('teachers', staffId, { status: 'suspended', activeStaffSuspId: discId, suspendedAt: now(), suspensionDays: days, suspensionReason: reason });
  DB.insert('staffDiscipline', {
    id: discId, schoolId: t.schoolId, staffId,
    type: 'suspension', reason, days, withPay, notes,
    date: today(), suspendedAt: now(), suspendedBy: AUTH.current.id || currentSchoolId(),
    reinstatedAt: null, reinstatedBy: null, reinstateNotes: ''
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: t.schoolId, actor: AUTH.current.id, action: 'suspended_staff', target: `${t.name} (${days}d — ${reason})`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${t.name} suspended`, 'warn');
}

function reinstateStaffModal(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  modal({
    title: `Reinstate — ${t.name}`,
    size: 'sm',
    body: `
      <div class="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4">
        ${icon('check_circle','w-5 h-5 text-brand-600 flex-shrink-0')}
        <div class="text-sm text-brand-800">${t.name} will be reinstated and their status set back to active.</div>
      </div>
      <div><label class="input-label">Reinstatement Notes</label><textarea id="stf_ri_notes" class="input" rows="2" placeholder="Conditions, outcome, etc."></textarea></div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmStaffReinstatement('${id}')">${icon('check_circle','w-4 h-4')} Reinstate</button>`
  });
}

function confirmStaffReinstatement(staffId) {
  const t = DB.find('teachers', staffId);
  const notes = (document.getElementById('stf_ri_notes') || {}).value || '';
  if (t.activeStaffSuspId) {
    DB.update('staffDiscipline', t.activeStaffSuspId, { reinstatedAt: now(), reinstatedBy: AUTH.current.id || currentSchoolId(), reinstateNotes: notes });
  } else {
    const open = DB.query('staffDiscipline', d => d.staffId === staffId && d.type === 'suspension' && !d.reinstatedAt).slice(-1)[0];
    if (open) DB.update('staffDiscipline', open.id, { reinstatedAt: now(), reinstatedBy: AUTH.current.id || currentSchoolId(), reinstateNotes: notes });
  }
  DB.update('teachers', staffId, { status: 'active', activeStaffSuspId: null, suspendedAt: null, suspensionDays: null, suspensionReason: null });
  DB.insert('auditLog', { id: uid('aud'), schoolId: t.schoolId, actor: AUTH.current.id, action: 'reinstated_staff', target: t.name + (notes ? ' — ' + notes : ''), timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${t.name} reinstated · active`, 'success');
}

function terminateStaffModal(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  modal({
    title: `Offboard Staff — ${t.name}`,
    size: 'md',
    body: `
      <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
        ${icon('logout','w-5 h-5 text-slate-600 flex-shrink-0')}
        <div class="text-sm text-slate-700">Records the exit of this staff member — covers resignations, retirements, dismissals, and contract endings. They will be removed from active payroll. All HR history is preserved.</div>
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Exit Category *</label>
          <select id="stf_term_cat" class="input">
            <option value="resignation">Resignation — staff chose to leave</option>
            <option value="contract_end">End of Contract — contract period completed</option>
            <option value="retirement">Retirement</option>
            <option value="redundancy">Redundancy — role no longer needed</option>
            <option value="dismissal">Dismissal — terminated for cause</option>
            <option value="death">Death in Service</option>
          </select></div>
        <div><label class="input-label">Reason / Summary *</label><textarea id="stf_term_reason" class="input" rows="2" placeholder="e.g. Resigned to pursue further studies — handover completed with HOD"></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Effective Date</label><input id="stf_term_date" type="date" class="input" value="${today()}" /></div>
          <div><label class="input-label">Final / Gratuity Payment (₦)</label><input id="stf_term_pay" type="number" class="input" placeholder="0" value="0" /></div>
        </div>
        <div><label class="input-label">Handover / Exit Notes</label><textarea id="stf_term_notes" class="input" rows="2" placeholder="Handover arrangements, equipment returned, clearance status…"></textarea></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmStaffTermination('${id}')">${icon('logout','w-4 h-4')} Confirm Offboarding</button>`
  });
}

function confirmStaffTermination(staffId) {
  const t = DB.find('teachers', staffId);
  const reason       = (document.getElementById('stf_term_reason') || {}).value || '';
  const category     = (document.getElementById('stf_term_cat') || {}).value || 'dismissal';
  const effectiveDate = (document.getElementById('stf_term_date') || {}).value || today();
  const finalPayment = parseFloat((document.getElementById('stf_term_pay') || {}).value) || 0;
  const notes        = (document.getElementById('stf_term_notes') || {}).value || '';
  if (!reason.trim()) { toast('Please provide a reason for termination', 'danger'); return; }
  DB.update('teachers', staffId, { status: 'terminated', terminatedAt: now(), terminationReason: reason });
  DB.insert('staffTerminations', {
    id: uid('stm'), schoolId: t.schoolId, staffId,
    category, reason, notes, effectiveDate, finalPayment,
    terminatedAt: now(), terminatedBy: AUTH.current.id || currentSchoolId()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: t.schoolId, actor: AUTH.current.id, action: 'terminated_staff', target: `${t.name} (${category} — ${reason})`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${t.name} marked as terminated`, 'danger');
}

function issueStaffWarningModal(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  modal({
    title: `Issue Warning — ${t.name}`,
    size: 'sm',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Warning Type</label>
          <select id="stf_warn_type" class="input">
            <option value="verbal">Verbal Warning</option>
            <option value="written">Written Warning</option>
            <option value="final">Final Warning</option>
          </select></div>
        <div><label class="input-label">Reason *</label><input id="stf_warn_reason" class="input" placeholder="Reason for warning" /></div>
        <div><label class="input-label">Notes</label><textarea id="stf_warn_notes" class="input" rows="2" placeholder="Additional details"></textarea></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-warn" onclick="confirmStaffWarning('${id}')">${icon('alert_triangle','w-4 h-4')} Issue Warning</button>`
  });
}

function confirmStaffWarning(staffId) {
  const t       = DB.find('teachers', staffId);
  const wtype   = (document.getElementById('stf_warn_type') || {}).value || 'written';
  const reason  = (document.getElementById('stf_warn_reason') || {}).value || '';
  const notes   = (document.getElementById('stf_warn_notes') || {}).value || '';
  if (!reason.trim()) { toast('Please enter a reason', 'danger'); return; }
  DB.insert('staffDiscipline', {
    id: uid('sdf'), schoolId: t.schoolId, staffId,
    type: 'warning', subType: wtype, reason, notes,
    date: today(), issuedAt: now(), issuedBy: AUTH.current.id || currentSchoolId()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: t.schoolId, actor: AUTH.current.id, action: 'staff_warning', target: `${t.name} (${wtype} — ${reason})`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast(`Warning issued to ${t.name}`, 'warn');
}

// Buffer for staff documents during the modal lifecycle
let _staffDocsBuffer = {};
const _staffDocTypes = [
  { key: 'cv',           label: 'CV / Resume' },
  { key: 'certificates', label: 'Educational Certificates' },
  { key: 'id',           label: 'Government ID (NIN / Passport)' },
  { key: 'guarantor',    label: 'Guarantor Form' },
  { key: 'others',       label: 'Others' }
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
          <label class="input-label">Subjects Taught</label>
          <div class="space-y-2">
            <select id="stf_subjects" class="input" multiple size="4">
              ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
            <div>
              <p class="text-xs text-slate-400 mb-1">Or enter subjects manually (comma-separated, for subjects not listed above):</p>
              <input id="stf_subjects_manual" class="input" placeholder="e.g. Introductory Technology, Agricultural Science" />
            </div>
          </div>
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
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  const subjectsManual = staffType === 'Academic'
    ? ((document.getElementById('stf_subjects_manual') || {}).value || '').split(',').map(s => s.trim()).filter(Boolean)
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
    subjectsManual,
    classes: classSel,
    salary, hireDate, dob,
    bank: bankName ? { name: bankName, account: bankAcc } : null,
    documents: Object.assign({}, _staffDocsBuffer),
    permissions,
    invitation: { username, tempPassword, sentAt: now(), accepted: false, channels }
  });
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click()">Done</button>`
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveClass()">Save Class</button>`
  });
}

function saveClass() {
  const name = document.getElementById('cl_name').value.trim();
  const level = document.getElementById('cl_level').value;
  const teacherId = document.getElementById('cl_teacher').value || null;
  if (!name) { toast('Class name required', 'danger'); return; }
  DB.insert('classes', { id: uid('cls'), schoolId: currentSchoolId(), name, level, teacherId });
  document.getElementById('modalBackdrop')?.click();
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
  const ttConfig = DB.settings().timetableConfig || {};
  const periodTimes = ttConfig.periodTimes || {1:'08:00-08:40',2:'08:40-09:20',3:'09:20-10:00',4:'10:00-10:40',5:'11:00-11:40',6:'11:40-12:20',7:'13:00-13:40',8:'13:40-14:20'};
  const break1After = ttConfig.break1After || 4;
  const break2After = ttConfig.break2After || 6;
  const break1Label = ttConfig.break1Label || 'Short Break (10:40–11:00)';
  const break2Label = ttConfig.break2Label || 'Lunch (12:20–13:00)';

  return `
    ${pageHeader({
      title: 'Timetable',
      subtitle: 'Click any empty cell to add a period, or upload an entire week',
      actions: `
        <button class="btn btn-secondary" onclick="APP.params.ttView='school'; APP.render()">${icon('calendar','w-4 h-4')} Whole-School View</button>
        <button class="btn btn-secondary" onclick="ttTimeConfigModal()">${icon('settings','w-4 h-4')} Times & Breaks</button>
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
              const timeLabel = periodTimes[p] || `P${p}`;
              const rows = [];
              // Insert break row before this period if configured
              if (p === break1After + 1) {
                rows.push(`<tr class="bg-amber-50"><td colspan="${days.length + 1}" class="text-center text-xs text-amber-800 font-semibold py-1.5">${icon('sun','w-3.5 h-3.5 inline mr-1')} ${break1Label}</td></tr>`);
              } else if (p === break2After + 1) {
                rows.push(`<tr class="bg-sky-50"><td colspan="${days.length + 1}" class="text-center text-xs text-sky-800 font-semibold py-1.5">${icon('food','w-3.5 h-3.5 inline mr-1')} ${break2Label}</td></tr>`);
              }
              rows.push(`<tr>
                <td><strong class="text-slate-900">P${p}</strong><br><span class="text-xs text-slate-500">${timeLabel}</span></td>
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
              </tr>`);
              return rows.join('');
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

function ttTimeConfigModal() {
  const s = DB.settings();
  const cfg = s.timetableConfig || {};
  const periodTimes = cfg.periodTimes || {1:'08:00-08:40',2:'08:40-09:20',3:'09:20-10:00',4:'10:00-10:40',5:'11:00-11:40',6:'11:40-12:20',7:'13:00-13:40',8:'13:40-14:20'};
  const b1After = cfg.break1After || 4;
  const b2After = cfg.break2After || 6;
  const b1Label = cfg.break1Label || 'Short Break (10:40–11:00)';
  const b2Label = cfg.break2Label || 'Lunch (12:20–13:00)';
  const periods = [1,2,3,4,5,6,7,8];
  modal({
    title: 'Timetable Times & Break Configuration',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <p class="text-sm text-slate-600">Set the start/end time for each period and define two break slots. Changes apply to all classes.</p>
        <div class="grid grid-cols-2 gap-3">
          ${periods.map(p => `
            <div>
              <label class="input-label">Period ${p}</label>
              <input type="text" id="tt_p${p}" class="input font-mono text-sm" value="${periodTimes[p] || ''}" placeholder="HH:MM-HH:MM" />
            </div>
          `).join('')}
        </div>
        <div class="border-t border-slate-100 pt-4 space-y-3">
          <h4 class="font-semibold text-slate-900 text-sm">Break Configuration</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">Break 1 — after period</label>
              <select id="tt_b1after" class="input">
                ${periods.slice(0, 7).map(p => `<option value="${p}" ${b1After===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="input-label">Break 1 Label / Time</label>
              <input type="text" id="tt_b1label" class="input text-sm" value="${b1Label}" placeholder="Short Break (10:40–11:00)" />
            </div>
            <div>
              <label class="input-label">Break 2 — after period</label>
              <select id="tt_b2after" class="input">
                ${periods.slice(1, 8).map(p => `<option value="${p}" ${b2After===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="input-label">Break 2 Label / Time</label>
              <input type="text" id="tt_b2label" class="input text-sm" value="${b2Label}" placeholder="Lunch (12:20–13:00)" />
            </div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTtTimeConfig()">${icon('check','w-4 h-4')} Save Configuration</button>
    `
  });
}

function saveTtTimeConfig() {
  const periodTimes = {};
  [1,2,3,4,5,6,7,8].forEach(p => {
    const el = document.getElementById(`tt_p${p}`);
    if (el) periodTimes[p] = el.value.trim() || `P${p}`;
  });
  const b1After = parseInt(document.getElementById('tt_b1after').value);
  const b2After = parseInt(document.getElementById('tt_b2after').value);
  const b1Label = document.getElementById('tt_b1label').value.trim();
  const b2Label = document.getElementById('tt_b2label').value.trim();
  DB.settings({ timetableConfig: { periodTimes, break1After: b1After, break2After: b2After, break1Label: b1Label, break2Label: b2Label } });
  document.getElementById('modalBackdrop')?.click();
  toast('Timetable configuration saved', 'success');
  APP.render();
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
    document.getElementById('modalBackdrop')?.click();
    APP.render();
    if (errors.length) {
      modal({
        title: `Imported ${added + replaced} periods, ${skipped} skipped`,
        body: `<div class="space-y-2">
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">${added} new · ${replaced} replaced · ${skipped} skipped</div>
          <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm"><strong>Errors:</strong>${errors.slice(0, 10).map(e => `<div>• ${e}</div>`).join('')}</div>
        </div>`,
        footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click()">OK</button>`
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Period updated');
}

function deletePeriod(periodId) {
  DB.remove('timetable', periodId);
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Period added');
}

/* ---------- Attendance (admin overview) ---------- */
function view_adm_attendance() {
  const attView = APP.params.attView || 'school';
  const classes = DB.get('classes');
  const date = APP.params.date || today();
  const dateFrom = APP.params.dateFrom || date;
  const dateTo = APP.params.dateTo || date;

  if (attView === 'class') {
    const classId = APP.params.classId || (classes.length ? classes[0].id : '');
    const cls = DB.find('classes', classId);
    const students = COMPUTE.studentsByClass(classId);
    const recs = COMPUTE.classAttendance(classId, date);
    return `
      ${pageHeader({
        title: 'Attendance — Class View',
        subtitle: 'Attendance record for a single class and date',
        actions: `
          <button class="btn btn-secondary" onclick="APP.params.attView='school'; APP.render()">${icon('dashboard','w-4 h-4')} School Overview</button>
          <button class="btn btn-secondary" onclick="exportAttendanceCSV('${classId}', '${dateFrom}', '${dateTo}')">${icon('download','w-4 h-4')} Export CSV</button>
        `
      })}
      <div class="card p-4 mb-4 grid sm:grid-cols-3 gap-3">
        <div><label class="input-label">Class</label>
          <select class="input" onchange="APP.params.classId = this.value; APP.render()">
            ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div><label class="input-label">Date From</label>
          <input type="date" class="input" value="${dateFrom}" onchange="APP.params.dateFrom=this.value; APP.render()" />
        </div>
        <div><label class="input-label">Date To</label>
          <input type="date" class="input" value="${dateTo}" onchange="APP.params.dateTo=this.value; APP.params.date=this.value; APP.render()" />
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">${cls ? cls.name : ''} · ${fdate(date, { long: true })}</h3>
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

  // School-wide attendance dashboard
  const allRecs = DB.query('attendance', a => a.schoolId === currentSchoolId() && a.date >= dateFrom && a.date <= dateTo);
  const dateRecs = allRecs.filter(a => a.date === date);
  const totalPresent = dateRecs.filter(r => r.status === 'present').length;
  const totalLate = dateRecs.filter(r => r.status === 'late').length;
  const totalAbsent = dateRecs.filter(r => r.status === 'absent').length;
  const totalStudents = DB.query('students', s => s.schoolId === currentSchoolId() && s.status === 'active').length;
  const attendanceRate = totalStudents > 0 ? Math.round(((totalPresent + totalLate) / totalStudents) * 100) : 0;

  return `
    ${pageHeader({
      title: 'Attendance Dashboard',
      subtitle: 'School-wide attendance overview with reporting',
      actions: `
        <button class="btn btn-secondary" onclick="APP.params.attView='class'; APP.render()">${icon('classes','w-4 h-4')} Class View</button>
        <button class="btn btn-secondary" onclick="exportSchoolAttendanceCSV('${dateFrom}', '${dateTo}')">${icon('download','w-4 h-4')} Export Report</button>
      `
    })}

    <div class="card p-4 mb-4 grid sm:grid-cols-3 gap-3">
      <div><label class="input-label">Date</label>
        <input type="date" class="input" value="${date}" onchange="APP.params.date=this.value; APP.params.dateFrom=this.value; APP.render()" />
      </div>
      <div><label class="input-label">Range From</label>
        <input type="date" class="input" value="${dateFrom}" onchange="APP.params.dateFrom=this.value; APP.render()" />
      </div>
      <div><label class="input-label">Range To</label>
        <input type="date" class="input" value="${dateTo}" onchange="APP.params.dateTo=this.value; APP.render()" />
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Present Today', value: totalPresent, icon: 'check', color: 'brand', trend: { direction: attendanceRate >= 80 ? 'up' : 'down', label: `${attendanceRate}% rate` } })}
      ${statCard({ label: 'Late Today', value: totalLate, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'Absent Today', value: totalAbsent, icon: 'x', color: 'rose' })}
      ${statCard({ label: 'Total Students', value: totalStudents, icon: 'students', color: 'blue' })}
    </div>

    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Attendance by Class · ${fdate(date, { long: true })}</h3>
        <span class="text-xs text-slate-500">Click a class for detailed view</span>
      </div>
      <table class="tbl">
        <thead><tr><th>Class</th><th class="text-center">Total</th><th class="text-center text-emerald-700">Present</th><th class="text-center text-amber-600">Late</th><th class="text-center text-rose-600">Absent</th><th class="text-center">Rate</th><th></th></tr></thead>
        <tbody>
          ${classes.map(cls => {
            const classStudents = COMPUTE.studentsByClass(cls.id);
            const classRecs = dateRecs.filter(r => classStudents.find(s => s.id === r.studentId));
            const present = classRecs.filter(r => r.status === 'present').length;
            const late = classRecs.filter(r => r.status === 'late').length;
            const absent = classStudents.length - present - late;
            const rate = classStudents.length > 0 ? Math.round(((present + late) / classStudents.length) * 100) : 0;
            return `<tr class="cursor-pointer hover:bg-slate-50" onclick="APP.params.attView='class'; APP.params.classId='${cls.id}'; APP.render()">
              <td><strong class="text-sm">${cls.name}</strong></td>
              <td class="text-center">${classStudents.length}</td>
              <td class="text-center font-semibold text-emerald-700">${present}</td>
              <td class="text-center font-semibold text-amber-600">${late}</td>
              <td class="text-center font-semibold text-rose-600">${absent}</td>
              <td class="text-center">
                <div class="flex items-center gap-2 justify-center">
                  <div class="progress" style="width:80px"><div class="progress-bar" style="width:${rate}%"></div></div>
                  <span class="text-xs font-semibold">${rate}%</span>
                </div>
              </td>
              <td>${icon('arrow_left','w-4 h-4 rotate-180 text-slate-400')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportAttendanceCSV(classId, dateFrom, dateTo) {
  const cls = DB.find('classes', classId);
  const students = COMPUTE.studentsByClass(classId);
  let csv = `Student,Date,Status,Marked At\n`;
  const recs = DB.query('attendance', a => a.classId === classId && a.date >= dateFrom && a.date <= dateTo);
  students.forEach(s => {
    const sRecs = recs.filter(r => r.studentId === s.id);
    if (sRecs.length === 0) csv += `"${s.name}","${dateFrom}","Not marked",""\n`;
    else sRecs.forEach(r => { csv += `"${s.name}","${r.date}","${r.status}","${r.markedAt || ''}"\n`; });
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `attendance_${cls ? cls.name.replace(/\s/g,'_') : 'class'}_${dateFrom}_${dateTo}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Attendance report exported', 'success');
}

function exportSchoolAttendanceCSV(dateFrom, dateTo) {
  const classes = DB.get('classes');
  let csv = `Class,Student,Date,Status\n`;
  classes.forEach(cls => {
    const students = COMPUTE.studentsByClass(cls.id);
    const recs = DB.query('attendance', a => a.classId === cls.id && a.date >= dateFrom && a.date <= dateTo);
    students.forEach(s => {
      const sRecs = recs.filter(r => r.studentId === s.id);
      if (sRecs.length === 0) csv += `"${cls.name}","${s.name}","${dateFrom}","Not marked"\n`;
      else sRecs.forEach(r => { csv += `"${cls.name}","${s.name}","${r.date}","${r.status}"\n`; });
    });
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `school_attendance_${dateFrom}_${dateTo}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('School attendance report exported', 'success');
}

/* ---------- Results overview ---------- */
function view_adm_results() {
  const resView = APP.params.resView || 'overview';
  const classes = DB.get('classes');
  const classId = APP.params.classId || (classes.length ? classes[0].id : '');
  const allClassResults = DB.query('results', r => r.classId === classId);
  const pending = allClassResults.filter(r => !r.approved);

  return `
    ${pageHeader({
      title: 'Results',
      subtitle: 'School overview, broadsheet, approvals, and reports',
      actions: resView === 'broadsheet' ? `
        <button class="btn btn-secondary" onclick="exportBroadsheet('${classId}')">${icon('download','w-4 h-4')} Export PDF</button>
        ${pending.length ? `<button class="btn btn-primary" onclick="approveAllResults('${classId}')">${icon('check','w-4 h-4')} Approve ${pending.length}</button>` : ''}
      ` : ''
    })}
    ${tabs([
      { key: 'overview',   label: 'School Overview' },
      { key: 'broadsheet', label: 'Class Broadsheet' }
    ], resView, k => { APP.params.resView = k; APP.render(); })}
    <div class="pt-4">
      ${resView === 'broadsheet' ? _renderResultsBroadsheet(classes, classId) : _renderSchoolResultsOverview()}
    </div>
  `;
}

function _renderSchoolResultsOverview() {
  const sid = currentSchoolId();
  const classes = DB.get('classes');
  const subjects = DB.get('subjects');
  const allRes = DB.query('results', r => r.schoolId === sid && r.approved);
  // Collect unique terms from results data, fallback to current setting
  const availableTerms = [...new Set(allRes.map(r => r.term).filter(Boolean))].sort().reverse();
  const currentTerm = DB.settings().currentTerm;
  const term = APP.params.resTerm || (availableTerms.includes(currentTerm) ? currentTerm : (availableTerms[0] || currentTerm));
  const termRes = allRes.filter(r => r.term === term);

  const totalStudents = new Set(termRes.map(r => r.studentId)).size;
  const schoolAvg = termRes.length ? Math.round(termRes.reduce((s, r) => s + (r.total || 0), 0) / termRes.length) : 0;
  const passMin = (DB.settings().gradeScale || []).slice().reverse().find(g => g.remark && g.remark.toLowerCase() !== 'fail') || { min: 40 };
  const passRate = termRes.length ? Math.round(termRes.filter(r => (r.total || 0) >= passMin.min).length / termRes.length * 100) : 0;
  const classesReported = new Set(termRes.map(r => r.classId)).size;

  // Per-class data
  const classRows = classes.map(cls => {
    const clsRes = termRes.filter(r => r.classId === cls.id);
    if (!clsRes.length) return null;
    const studs = new Set(clsRes.map(r => r.studentId)).size;
    const avg = Math.round(clsRes.reduce((s, r) => s + (r.total || 0), 0) / clsRes.length);
    const pass = Math.round(clsRes.filter(r => (r.total || 0) >= passMin.min).length / clsRes.length * 100);
    const subAvgs = subjects.map(sub => {
      const subs = clsRes.filter(r => r.subjectId === sub.id);
      return subs.length ? { name: sub.name, avg: Math.round(subs.reduce((s,r) => s+(r.total||0), 0) / subs.length) } : null;
    }).filter(Boolean).sort((a,b) => b.avg - a.avg);
    return { cls, studs, avg, pass, best: subAvgs[0] || null, weak: subAvgs[subAvgs.length-1] || null };
  }).filter(Boolean).sort((a,b) => b.avg - a.avg);

  // Per-subject data (school-wide)
  const subjectRows = subjects.map(sub => {
    const subs = termRes.filter(r => r.subjectId === sub.id);
    if (!subs.length) return null;
    const avg = Math.round(subs.reduce((s,r) => s+(r.total||0), 0) / subs.length);
    const pass = Math.round(subs.filter(r => (r.total||0) >= passMin.min).length / subs.length * 100);
    return { sub, avg, pass, count: subs.length };
  }).filter(Boolean).sort((a,b) => b.avg - a.avg);

  const _pBadge = rate => `<span class="badge ${rate>=80?'badge-success':rate>=60?'badge-warn':'badge-danger'}">${rate}%</span>`;
  const _avgColor = avg => avg>=70?'text-emerald-700':avg>=50?'text-amber-700':'text-rose-700';

  return `
    ${availableTerms.length > 1 ? `
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <span class="text-xs text-slate-500 font-semibold uppercase mr-1">Term:</span>
      ${availableTerms.map(t => `<button class="chip ${t===term?'active':''}" onclick="APP.params.resTerm='${t}'; APP.render()">${t}</button>`).join('')}
    </div>` : ''}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      ${statCard({ label: 'Students with Results', value: totalStudents, icon: 'students', color: 'brand' })}
      ${statCard({ label: 'School Average', value: schoolAvg + '%', icon: 'results', color: schoolAvg >= 60 ? 'brand' : 'gold', trend: { direction: schoolAvg>=60?'up':'down', label: term } })}
      ${statCard({ label: 'Pass Rate', value: passRate + '%', icon: 'check', color: passRate >= 70 ? 'brand' : 'rose' })}
      ${statCard({ label: 'Classes Reported', value: classesReported + '/' + classes.length, icon: 'class', color: 'brand' })}
    </div>

    ${classRows.length === 0 ? emptyState({ icon: 'results', title: 'No approved results yet', body: `Results for ${term} are pending teacher submission and admin approval.`, action: `<button class="btn btn-primary" onclick="APP.params.resView='broadsheet'; APP.render()">${icon('results','w-4 h-4')} Go to Broadsheet</button>` }) : `
    <div class="card overflow-hidden mb-4">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Class Performance — ${term}</h3>
        <span class="text-xs text-slate-400">${classRows.length} class${classRows.length!==1?'es':''} with data</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Rank</th><th>Class</th><th class="text-center">Students</th><th class="text-center">Average</th><th class="text-center">Pass Rate</th><th>Best Subject</th><th>Needs Attention</th><th></th></tr></thead>
          <tbody>
            ${classRows.map((d, i) => `<tr>
              <td class="text-center font-bold text-slate-400 w-10">${i+1}</td>
              <td class="font-semibold">${d.cls.name}</td>
              <td class="text-center">${d.studs}</td>
              <td class="text-center"><span class="font-bold text-lg ${_avgColor(d.avg)}">${d.avg}%</span></td>
              <td class="text-center">${_pBadge(d.pass)}</td>
              <td>${d.best ? `<span class="font-medium text-emerald-700">${d.best.name}</span> <span class="text-xs text-slate-400">(${d.best.avg}%)</span>` : '<span class="text-slate-400">—</span>'}</td>
              <td>${d.weak && d.weak.avg < 50 ? `<span class="font-medium text-rose-600">${d.weak.name}</span> <span class="text-xs text-slate-400">(${d.weak.avg}%)</span>` : '<span class="text-slate-400">—</span>'}</td>
              <td><button class="btn btn-ghost !py-1 text-xs" onclick="APP.params.resView='broadsheet'; APP.params.classId='${d.cls.id}'; APP.render()">${icon('arrow_left','w-3.5 h-3.5 rotate-180')} View</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-900">Subject Performance — School-Wide</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Subject</th><th class="text-center">Entries</th><th class="text-center">Average</th><th class="text-center">Pass Rate</th><th>Performance</th></tr></thead>
          <tbody>
            ${subjectRows.length === 0 ? `<tr><td colspan="5" class="text-center text-slate-400 py-8">No results yet</td></tr>` :
              subjectRows.map(d => `<tr>
                <td class="font-semibold">${d.sub.name}</td>
                <td class="text-center text-slate-500">${d.count}</td>
                <td class="text-center"><span class="font-bold ${_avgColor(d.avg)}">${d.avg}%</span></td>
                <td class="text-center">${_pBadge(d.pass)}</td>
                <td><div class="flex items-center gap-2"><div class="progress flex-1 max-w-28"><div class="progress-bar ${d.avg>=70?'bg-emerald-500':d.avg>=50?'bg-amber-500':'bg-rose-500'}" style="width:${d.avg}%"></div></div><span class="text-xs text-slate-400">${d.avg}%</span></div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `}
  `;
}

function _renderResultsBroadsheet(classes, classId) {
  const subjects = DB.get('subjects');
  const students = COMPUTE.studentsByClass(classId);
  const resType = APP.params.resType || 'all';
  const allResults = DB.query('results', r => r.classId === classId);
  const results = resType === 'all' ? allResults : allResults.filter(r => (r.examType || 'examination').toLowerCase() === resType);
  const typeCounts = { extracurricular: 0, midterm: 0, examination: 0 };
  allResults.forEach(r => { const t = (r.examType || 'examination').toLowerCase(); if (typeCounts[t] !== undefined) typeCounts[t]++; });

  return `
    <div class="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
      <div>
        <label class="input-label">Class</label>
        <select class="input" onchange="APP.params.classId = this.value; APP.render()">
          ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="input-label">Exam Type</label>
        <div class="flex flex-wrap gap-2 mt-1">
          <button class="chip ${resType==='all'?'active':''}" onclick="APP.params.resType='all'; APP.render()">All (${allResults.length})</button>
          <button class="chip ${resType==='examination'?'active':''}" onclick="APP.params.resType='examination'; APP.render()">${icon('results','w-3.5 h-3.5')} Examination (${typeCounts.examination})</button>
          <button class="chip ${resType==='midterm'?'active':''}" onclick="APP.params.resType='midterm'; APP.render()">${icon('book','w-3.5 h-3.5')} Midterm (${typeCounts.midterm})</button>
          <button class="chip ${resType==='extracurricular'?'active':''}" onclick="APP.params.resType='extracurricular'; APP.render()">${icon('check','w-3.5 h-3.5')} Extracurricular (${typeCounts.extracurricular})</button>
        </div>
      </div>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr><th>Student</th>${subjects.map(s => `<th class="text-center">${s.name.split(' ')[0]}</th>`).join('')}<th class="text-center">Avg</th><th class="text-center">Pos</th><th class="text-center">Type</th><th class="text-center">Result</th></tr>
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
                <td class="text-center">${(() => {
                  const t = (studRes[0] && studRes[0].examType) || 'examination';
                  const colors = { examination: 'badge-success', midterm: 'badge-info', extracurricular: 'badge-warn' };
                  return studRes.length ? `<span class="badge ${colors[t.toLowerCase()] || 'badge-neutral'} text-xs">${t}</span>` : '';
                })()}</td>
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
function view_adm_reports() {
  const rTab = APP.params.rTab || 'enrollment';
  const schoolId = currentSchoolId();
  const tabs_list = [
    { key: 'insights',    label: 'Insights', badge: () => { const i = computeInsights(schoolId); return i.filter(x => x.level === 'critical').length || null; } },
    { key: 'enrollment',  label: 'Enrollment' },
    { key: 'leavers',     label: 'Leavers' },
    { key: 'attendance',  label: 'Attendance' },
    { key: 'financial',   label: 'Financial' },
    { key: 'applications', label: 'Applications' },
    { key: 'print',       label: 'Print & Export' }
  ];
  return `
    ${pageHeader({
      title: 'School Reports',
      subtitle: 'Enrollment, leavers, attendance, financial, and admissions data',
      actions: `${rTab === 'financial' ? `
        <button class="btn btn-secondary" onclick="exportPL()">${icon('download','w-4 h-4')} Export P&L</button>
        <button class="btn btn-secondary" onclick="exportPeachtreeJournal()">${icon('download','w-4 h-4')} Peachtree</button>` : ''}
        ${rTab !== 'print' && rTab !== 'financial' ? `<button class="btn btn-secondary" onclick="exportConsolidatedReport('${rTab}')">${icon('download','w-4 h-4')} Export</button>` : ''}`
    })}
    ${tabs(tabs_list, rTab, k => { APP.params.rTab = k; APP.render(); })}
    <div class="pt-4">${
      rTab === 'insights'     ? renderAIInsights(schoolId) :
      rTab === 'leavers'      ? renderLeaversReport(schoolId) :
      rTab === 'attendance'   ? renderAttendanceReport(schoolId) :
      rTab === 'financial'    ? view_fin_reports(true) :
      rTab === 'applications' ? renderApplicationsReport(schoolId) :
      rTab === 'print'        ? _renderPrintCenter() :
      renderEnrollmentReport(schoolId)
    }</div>
  `;
}

function computeInsights(schoolId) {
  const insights = [];

  // Overdue invoices
  const overdueInvs = DB.query('invoices', i => i.schoolId === schoolId && i.balance > 0 && i.dueDate && i.dueDate < today());
  if (overdueInvs.length) {
    const tot = overdueInvs.reduce((s, i) => s + i.balance, 0);
    insights.push({ level: 'critical', cat: 'Finance', msg: `${overdueInvs.length} overdue invoice${overdueInvs.length > 1 ? 's' : ''} · ${money(tot)} uncollected past due date`, view: 'view_fin_invoices' });
  }

  // Fee collection below target
  const allInvs = DB.query('invoices', i => i.schoolId === schoolId);
  const billed = allInvs.reduce((s, i) => s + i.total, 0);
  const paidTotal = allInvs.reduce((s, i) => s + i.paid, 0);
  const collRate = billed ? Math.round(paidTotal / billed * 100) : 100;
  const target = ((DB.settings().revenueAnalytics || {}).alertCollectionBelow) || 80;
  if (collRate < target) {
    insights.push({ level: 'warn', cat: 'Finance', msg: `Fee collection at ${collRate}% — below ${target}% target`, view: 'view_fin_invoices' });
  }

  // Stale pending applications (>7 days unreviewed)
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const weekAgoStr = d7.toISOString().substring(0, 10);
  const staleApps = DB.query('admissionApplications', a => a.schoolId === schoolId && a.status === 'pending' && a.appliedAt && a.appliedAt.substring(0, 10) < weekAgoStr);
  if (staleApps.length) {
    insights.push({ level: 'info', cat: 'Admissions', msg: `${staleApps.length} application${staleApps.length > 1 ? 's' : ''} pending for 7+ days without a review`, view: 'view_adm_admissions' });
  }

  // Visits scheduled but past date and not confirmed
  const staleVisits = DB.query('admissionApplications', a => a.schoolId === schoolId && a.status === 'visit_scheduled' && a.visitDate && a.visitDate < today());
  if (staleVisits.length) {
    insights.push({ level: 'warn', cat: 'Admissions', msg: `${staleVisits.length} school visit${staleVisits.length > 1 ? 's' : ''} past scheduled date — confirm or reschedule`, view: 'view_adm_admissions' });
  }

  // At-risk students (3+ consecutive absences)
  const activeStudents = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const allAtt = DB.query('attendance', a => a.schoolId === schoolId);
  const attByStudent = {};
  allAtt.forEach(a => { if (!attByStudent[a.studentId]) attByStudent[a.studentId] = []; attByStudent[a.studentId].push(a); });
  const atRisk = [];
  activeStudents.forEach(s => {
    const sAtt = (attByStudent[s.id] || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    let cons = 0;
    for (const r of sAtt) { if (r.status === 'absent') cons++; else break; }
    if (cons >= 3) atRisk.push(s.name);
  });
  if (atRisk.length) {
    insights.push({ level: 'critical', cat: 'Attendance', msg: `${atRisk.length} student${atRisk.length > 1 ? 's' : ''} absent 3+ consecutive days: ${atRisk.slice(0, 3).join(', ')}${atRisk.length > 3 ? ` +${atRisk.length - 3} more` : ''}`, view: 'view_adm_attendance' });
  }

  // Club viability (enrolled < 5)
  const activities = DB.query('activities', a => a.schoolId === schoolId);
  activities.forEach(act => {
    const enrolled = DB.query('studentActivities', sa => sa.activityId === act.id).length;
    if (enrolled > 0 && enrolled < 5) {
      insights.push({ level: 'info', cat: 'Clubs', msg: `${act.icon || '🎯'} ${act.name} has only ${enrolled} student${enrolled !== 1 ? 's' : ''} — review viability or run a promotion`, view: 'view_adm_activities' });
    }
  });

  if (insights.length === 0) {
    insights.push({ level: 'ok', cat: 'All Clear', msg: 'No critical issues detected — school operations look healthy' });
  }
  return insights;
}

function renderAIInsights(schoolId) {
  const insights = computeInsights(schoolId);
  const levelCfg = {
    critical: { cls: 'bg-red-50 border-red-200 text-red-900', dot: 'bg-red-500', icon: '🔴' },
    warn:     { cls: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-400', icon: '🟡' },
    info:     { cls: 'bg-blue-50 border-blue-200 text-blue-900', dot: 'bg-blue-400', icon: '🔵' },
    ok:       { cls: 'bg-emerald-50 border-emerald-200 text-emerald-900', dot: 'bg-emerald-500', icon: '🟢' }
  };
  return `
    <div class="card p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">✨</span>
          <h3 class="font-bold text-slate-900">Operational Insights</h3>
        </div>
        <span class="text-xs text-slate-400">Auto-detected · updated on load</span>
      </div>
      <div class="space-y-2">
        ${insights.map(ins => {
          const cfg = levelCfg[ins.level] || levelCfg.info;
          return `<div class="flex items-start gap-3 p-3 rounded-xl border ${cfg.cls}">
            <span class="text-sm mt-0.5">${cfg.icon}</span>
            <div class="flex-1 min-w-0">
              <span class="text-xs font-bold uppercase tracking-wide opacity-60">${ins.cat}</span>
              <div class="text-sm">${ins.msg}</div>
            </div>
            ${ins.view ? `<button class="btn btn-ghost !py-1 !px-2 text-xs flex-shrink-0" onclick="APP.go('${ins.view}')" title="Go to ${ins.cat}">View ${icon('arrow_left','w-3 h-3 rotate-180')}</button>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function exportPeachtreeJournal() {
  const schoolId = currentSchoolId();
  const school = DB.find('schools', schoolId);
  const headers = ['Journal', 'Date', 'Reference', 'G/L Account No.', 'Account Description', 'Debit', 'Credit', 'Memo'];
  const rows = [];

  // Payments received → Debit Cash, Credit Income
  const payments = DB.query('payments', p => p.schoolId === schoolId);
  payments.forEach(p => {
    const s = DB.find('students', p.studentId);
    const ref = p.id.slice(-8).toUpperCase();
    const d = (p.date || p.createdAt || today()).substring(0, 10);
    const memo = `Fee payment — ${s ? s.name : 'Student'}`;
    rows.push(['GJ', d, ref, '1100', 'Cash & Bank', p.amount, '', memo]);
    rows.push(['GJ', d, ref, '4000', 'School Fees Income', '', p.amount, memo]);
  });

  // Invoices raised → Debit AR, Credit Income (if no payment record)
  const invoices = DB.query('invoices', i => i.schoolId === schoolId);
  invoices.forEach(inv => {
    const s = DB.find('students', inv.studentId);
    const ref = inv.id.slice(-8).toUpperCase();
    const d = (inv.createdAt || today()).substring(0, 10);
    const memo = `Invoice — ${s ? s.name : 'Student'} (${inv.term})`;
    rows.push(['GJ', d, ref, '1200', 'Accounts Receivable', inv.total, '', memo]);
    rows.push(['GJ', d, ref, '4000', 'School Fees Income', '', inv.total, memo]);
  });

  const csv = [headers, ...rows].map(r => r.map(v => {
    const str = String(v == null ? '' : v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(school ? school.name : 'school').replace(/\s+/g, '_')}_peachtree_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Peachtree journal exported — import into Sage 50 via Maintain → Chart of Accounts → Import', 'success');
}

function renderEnrollmentReport(schoolId) {
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const classes = DB.get('classes');
  const currentYear = new Date().getFullYear().toString();
  const currentSession = DB.settings().currentSession || `${currentYear}/${parseInt(currentYear)+1}`;
  const newEnrolled = students.filter(s => s.enrollmentSession === currentSession || s.enrollmentYear === currentYear || (s.admissionDate && s.admissionDate.startsWith(currentYear)));
  const returning = students.filter(s => !newEnrolled.includes(s));
  const byClass = classes.map(c => {
    const cls = students.filter(s => s.classId === c.id);
    const male = cls.filter(s => s.gender === 'M').length;
    const female = cls.filter(s => s.gender !== 'M').length;
    return { cls: c, count: cls.length, male, female };
  }).filter(x => x.count > 0);

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Active', value: students.length, icon: 'user', color: 'brand' })}
      ${statCard({ label: 'New Enrollment', value: newEnrolled.length, icon: 'plus', color: 'blue' })}
      ${statCard({ label: 'Returning', value: returning.length, icon: 'trending_up', color: 'brand' })}
      ${statCard({ label: 'Classes', value: byClass.length, icon: 'academic', color: 'gold' })}
    </div>
    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Enrollment by Class</h3>
        <table class="tbl">
          <thead><tr><th>Class</th><th class="text-center">Total</th><th class="text-center">Male</th><th class="text-center">Female</th></tr></thead>
          <tbody>
            ${byClass.map(({ cls, count, male, female }) => `<tr>
              <td class="font-medium">${cls.name}</td>
              <td class="text-center font-semibold">${count}</td>
              <td class="text-center text-blue-700">${male}</td>
              <td class="text-center text-rose-600">${female}</td>
            </tr>`).join('')}
            <tr class="font-bold bg-slate-50"><td>Total</td><td class="text-center">${students.length}</td><td class="text-center text-blue-700">${students.filter(s=>s.gender==='M').length}</td><td class="text-center text-rose-600">${students.filter(s=>s.gender!=='M').length}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">New vs Returning (${currentSession})</h3>
        <div class="space-y-3">
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div><div class="font-semibold text-blue-900">New Enrollment</div><div class="text-xs text-blue-700">First time joining this session</div></div>
            <div class="text-2xl font-extrabold text-blue-700">${newEnrolled.length}</div>
          </div>
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div><div class="font-semibold text-emerald-900">Returning Students</div><div class="text-xs text-emerald-700">Enrolled from previous sessions</div></div>
            <div class="text-2xl font-extrabold text-emerald-700">${returning.length}</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <div class="text-xs text-slate-500 mb-1">Retention rate</div>
            <div class="flex items-center gap-2">
              <div class="flex-1 progress"><div class="progress-bar" style="width:${students.length > 0 ? Math.round(returning.length/students.length*100) : 0}%"></div></div>
              <span class="font-semibold text-sm">${students.length > 0 ? Math.round(returning.length/students.length*100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLeaversReport(schoolId) {
  const leavers = DB.query('students', s => s.schoolId === schoolId && ['withdrawn','transferred','suspended','alumni'].includes(s.status));
  const withdrawn = leavers.filter(s => s.status === 'withdrawn');
  const transferredOut = leavers.filter(s => s.status === 'transferred');
  const alumni = leavers.filter(s => s.status === 'alumni');
  const transfersIn = DB.query('students', s => s.schoolId === schoolId && s.admissionType === 'transfer' && s.status === 'active');

  const leavTab = APP.params.leavTab || 'leavers';

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Leavers Total', value: leavers.length, icon: 'logout', color: 'rose' })}
      ${statCard({ label: 'Withdrawn', value: withdrawn.length, icon: 'x', color: 'rose' })}
      ${statCard({ label: 'Transferred Out', value: transferredOut.length, icon: 'arrow_left', color: 'blue' })}
      ${statCard({ label: 'Transfers In', value: transfersIn.length, icon: 'arrow_left', color: 'brand' })}
    </div>

    <div class="flex gap-2 mb-4">
      <button class="chip ${leavTab==='leavers'?'active':''}" onclick="APP.params.leavTab='leavers'; APP.render()">Leavers Register</button>
      <button class="chip ${leavTab==='transfers_in'?'active':''}" onclick="APP.params.leavTab='transfers_in'; APP.render()">Transfer-In Log ${transfersIn.length ? `<span class="ml-1 badge badge-success">${transfersIn.length}</span>` : ''}</button>
    </div>

    ${leavTab === 'transfers_in' ? `
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100">
          <h3 class="font-bold text-slate-900">Transfer Students (Currently Enrolled)</h3>
          <p class="text-xs text-slate-400 mt-0.5">Students who joined this school from another institution</p>
        </div>
        <table class="tbl">
          <thead><tr><th>Student</th><th>Class</th><th>Previous School</th><th>Last Class</th><th>Transfer Date</th><th>Reason</th></tr></thead>
          <tbody>
            ${transfersIn.length === 0
              ? `<tr><td colspan="6" class="text-center text-slate-400 py-8">No transfer students recorded yet</td></tr>`
              : transfersIn.map(s => {
                  const cls = DB.find('classes', s.classId);
                  return `<tr>
                    <td><div class="flex items-center gap-2">${avatar(s.name,'sm')}<div><div class="font-medium text-sm">${s.name}</div><div class="text-xs text-slate-500">${s.admissionNo || ''}</div></div></div></td>
                    <td class="text-sm">${cls ? cls.name : '—'}</td>
                    <td class="text-sm">${s.transferFromSchool || '—'}</td>
                    <td class="text-sm text-slate-500">${s.transferFromClass || '—'}</td>
                    <td class="text-xs text-slate-500">${s.transferInDate ? fdate(s.transferInDate, { short: true }) : '—'}</td>
                    <td class="text-sm text-slate-500">${s.transferInReason || '—'}</td>
                  </tr>`;
                }).join('')
            }
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-900">Leavers Register</h3>
          <button class="btn btn-secondary text-sm" onclick="exportLeaversCSV()">${icon('download','w-4 h-4')} CSV</button>
        </div>
        <table class="tbl">
          <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Reason</th><th>Date</th><th>Destination</th></tr></thead>
          <tbody>
            ${leavers.length === 0 ? `<tr><td colspan="6" class="text-center text-slate-400 py-8">No leavers recorded yet</td></tr>` : leavers.map(s => {
              const cls = DB.find('classes', s.classId);
              const date = s.withdrawnAt || s.transferredAt || s.graduatedAt || s.suspendedAt || s.updatedAt || '';
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s.name,'sm')}<div><div class="font-medium text-sm">${s.name}</div><div class="text-xs text-slate-500">${s.admissionNo || ''}</div></div></div></td>
                <td class="text-sm">${cls ? cls.name : '—'}</td>
                <td>${statusBadge(s.status)}</td>
                <td class="text-sm text-slate-500">${s.withdrawReason || s.transferReason || s.suspensionReason || '—'}</td>
                <td class="text-xs text-slate-500">${date ? fdate(date, { short: true }) : '—'}</td>
                <td class="text-sm">${s.transferDest || (s.status === 'alumni' ? s.finalClass || 'Graduated' : '—')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function renderAttendanceReport(schoolId) {
  const dateFrom = APP.params.rAttFrom || daysAgo(30);
  const dateTo = APP.params.rAttTo || today();
  const classes = DB.get('classes');
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const recs = DB.query('attendance', a => a.schoolId === schoolId && a.date >= dateFrom && a.date <= dateTo);
  const byClass = classes.map(c => {
    const classStudents = students.filter(s => s.classId === c.id);
    const classRecs = recs.filter(r => classStudents.find(s => s.id === r.studentId));
    const present = classRecs.filter(r => r.status === 'present').length;
    const total = classRecs.length;
    return { cls: c, count: classStudents.length, recs: total, present, rate: total > 0 ? Math.round(present/total*100) : 0 };
  }).filter(x => x.count > 0);

  return `
    <div class="card p-4 mb-4 flex items-end gap-3 flex-wrap">
      <div><label class="input-label">From</label><input type="date" class="input" value="${dateFrom}" onchange="APP.params.rAttFrom=this.value; APP.render()" /></div>
      <div><label class="input-label">To</label><input type="date" class="input" value="${dateTo}" onchange="APP.params.rAttTo=this.value; APP.render()" /></div>
      <button class="btn btn-secondary" onclick="exportSchoolAttendanceCSV('${dateFrom}','${dateTo}')">${icon('download','w-4 h-4')} Export CSV</button>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Class</th><th class="text-center">Students</th><th class="text-center">Records</th><th class="text-center">Present</th><th>Attendance Rate</th></tr></thead>
        <tbody>
          ${byClass.map(({ cls, count, recs: total, present, rate }) => `<tr>
            <td class="font-medium">${cls.name}</td>
            <td class="text-center">${count}</td>
            <td class="text-center text-slate-500">${total}</td>
            <td class="text-center text-emerald-700 font-semibold">${present}</td>
            <td>
              <div class="flex items-center gap-2">
                <div class="progress flex-1"><div class="progress-bar ${rate < 70 ? 'bg-rose-500' : ''}" style="width:${rate}%"></div></div>
                <span class="text-xs font-semibold w-10 text-right">${rate}%</span>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderApplicationsReport(schoolId) {
  const apps = DB.query('admissionApplications', a => a.schoolId === schoolId);
  const pending = apps.filter(a => a.status === 'pending');
  const reviewing = apps.filter(a => a.status === 'reviewing');
  const accepted = apps.filter(a => a.status === 'accepted');
  const rejected = apps.filter(a => a.status === 'rejected');

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Applications', value: apps.length, icon: 'user', color: 'brand' })}
      ${statCard({ label: 'Pending', value: pending.length, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'Accepted', value: accepted.length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Rejected', value: rejected.length, icon: 'x', color: 'rose' })}
    </div>
    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">All Applications</h3>
        <button class="btn btn-secondary text-sm" onclick="exportApplicationsCSV()">${icon('download','w-4 h-4')} Export CSV</button>
      </div>
      <table class="tbl">
        <thead><tr><th>Applicant</th><th>Parent</th><th>Class</th><th>Location</th><th>Applied</th><th>Status</th></tr></thead>
        <tbody>
          ${apps.length === 0 ? `<tr><td colspan="6" class="text-center text-slate-400 py-8">No applications yet</td></tr>` : apps.map(a => {
            const cls = DB.find('classes', a.requestedClass);
            return `<tr class="cursor-pointer" onclick="viewApplication('${a.id}')">
              <td><div class="flex items-center gap-2">${avatar(a.applicantName,'sm')}<div><div class="font-medium text-sm">${a.applicantName}</div><div class="text-xs text-slate-500">${a.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(a.dob)} yrs</div></div></div></td>
              <td class="text-sm">${a.parentName}<div class="text-xs text-slate-500">${a.parentPhone}</div></td>
              <td class="text-sm">${cls ? cls.name : '—'}</td>
              <td class="text-sm text-slate-500">${a.location || a.address || '—'}</td>
              <td class="text-xs text-slate-500">${fdate(a.appliedAt, { short: true })}</td>
              <td>${statusBadge(a.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportConsolidatedReport(rTab) {
  if (rTab === 'financial') { exportPL(); return; }
  if (rTab === 'attendance') { exportSchoolAttendanceCSV(APP.params.rAttFrom || daysAgo(30), APP.params.rAttTo || today()); return; }
  if (rTab === 'leavers') { exportLeaversCSV(); return; }
  if (rTab === 'applications') { exportApplicationsCSV(); return; }
  exportEnrollmentCSV();
}

function exportLeaversCSV() {
  const schoolId = currentSchoolId();
  const leavers = DB.query('students', s => s.schoolId === schoolId && ['withdrawn','transferred','suspended','alumni'].includes(s.status));
  const rows = [['Name','Admission No','Class','Status','Reason','Date','Destination']];
  leavers.forEach(s => {
    const cls = DB.find('classes', s.classId);
    const date = s.withdrawnAt || s.transferredAt || s.graduatedAt || s.suspendedAt || '';
    rows.push([s.name, s.admissionNo || '', cls ? cls.name : '', s.status, s.withdrawReason || s.transferReason || s.suspensionReason || '', date ? fdate(date, { short: true }) : '', s.transferDest || '']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leavers_report.csv'; a.click(); URL.revokeObjectURL(a.href);
  toast('Leavers report exported');
}

function exportEnrollmentCSV() {
  const schoolId = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const rows = [['Name','Admission No','Class','Gender','Status','Admission Date']];
  students.forEach(s => {
    const cls = DB.find('classes', s.classId);
    rows.push([s.name, s.admissionNo || '', cls ? cls.name : '', s.gender === 'M' ? 'Male' : 'Female', s.status, s.admissionDate || '']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'enrollment_report.csv'; a.click(); URL.revokeObjectURL(a.href);
  toast('Enrollment report exported');
}

function exportApplicationsCSV() {
  const schoolId = currentSchoolId();
  const apps = DB.query('admissionApplications', a => a.schoolId === schoolId);
  const rows = [['Applicant','Gender','DOB','Parent Name','Parent Phone','Parent Email','Class','Location','Status','Applied','Review Notes']];
  apps.forEach(a => {
    const cls = DB.find('classes', a.requestedClass);
    rows.push([a.applicantName, a.gender === 'M' ? 'Male' : 'Female', a.dob || '', a.parentName, a.parentPhone, a.parentEmail || '', cls ? cls.name : '', a.location || a.address || '', a.status, a.appliedAt ? fdate(a.appliedAt, { short: true }) : '', a.reviewNotes || '']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'applications_export.csv'; a.click(); URL.revokeObjectURL(a.href);
  toast('Applications data exported');
}

/* ---------- Discipline ---------- */
function view_adm_discipline() {
  const records = DB.query('discipline', d => d.schoolId === currentSchoolId());
  const students = DB.query('students', s => s.schoolId === currentSchoolId());
  const discView = APP.params.discView || 'list';
  const selStudent = APP.params.discStudent || '';

  if (discView === 'student' && selStudent) {
    const s = DB.find('students', selStudent);
    const sRecs = records.filter(r => r.studentId === selStudent);
    const totalPoints = sRecs.reduce((sum, r) => sum + (r.points || 0), 0);
    const admissionRecord = DB.find('admissions', a => a.studentId === selStudent) || null;
    const studentParent = s && s.parentId ? DB.find('parents', s.parentId) : null;
    return `
      ${pageHeader({
        title: `Discipline — ${s ? s.name : 'Student'}`,
        subtitle: 'Full discipline history linked to admission record',
        actions: `
          <button class="btn btn-secondary" onclick="APP.params.discView='list'; APP.render()">${icon('arrow_left','w-4 h-4')} All Records</button>
          <button class="btn btn-primary" onclick="addDisciplineModal('${selStudent}')">${icon('plus','w-4 h-4')} New Record</button>
        `
      })}
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 space-y-3">
          <div class="card p-4 flex items-center gap-4">
            ${avatar(s ? s.name : '?', 'xl')}
            <div class="flex-1">
              <div class="font-bold text-slate-900 text-lg">${s ? s.name : '—'}</div>
              <div class="text-sm text-slate-500">${s ? (DB.find('classes', s.classId) || {}).name || 'No class' : ''} · Admission #${s ? (s.admissionNumber || s.id.slice(-6)) : '—'}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge ${totalPoints >= 0 ? 'badge-success' : 'badge-danger'}">Net Points: ${totalPoints > 0 ? '+' : ''}${totalPoints}</span>
                <span class="badge badge-neutral">${sRecs.length} records</span>
              </div>
            </div>
          </div>
          <div class="card overflow-hidden">
            ${sRecs.length === 0 ? emptyState({ title: 'No discipline records', icon: 'check' }) : `
              <table class="tbl">
                <thead><tr><th>Type</th><th>Points</th><th>Note</th><th>Recorded By</th><th>Date</th></tr></thead>
                <tbody>
                  ${sRecs.sort((a,b)=>b.date.localeCompare(a.date)).map(r => {
                    const recorder = DB.find('teachers', r.recordedBy) || DB.find('teachers', r.recordedBy);
                    return `<tr>
                      <td><span class="badge ${r.type === 'commendation' ? 'badge-success' : 'badge-danger'}">${r.type}</span></td>
                      <td class="font-mono font-bold ${r.points > 0 ? 'text-emerald-600' : 'text-rose-600'}">${r.points > 0 ? '+' : ''}${r.points}</td>
                      <td class="text-sm">${r.note}</td>
                      <td class="text-xs text-slate-500">${recorder ? recorder.name : 'Admin'}</td>
                      <td class="text-sm text-slate-500">${fdate(r.date, { short: true })}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
        <div class="space-y-3">
          <div class="card p-4">
            <h4 class="font-bold text-slate-900 mb-2 text-sm">${icon('check','w-4 h-4 inline')} Admission Portal Link</h4>
            <p class="text-xs text-slate-500 mb-3">Discipline records are synced with this student's admission profile for comprehensive tracking.</p>
            ${admissionRecord ? `
              <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 mb-2">
                ${icon('check','w-3.5 h-3.5 inline')} Admission record found
              </div>
              <div class="text-xs space-y-1">
                <div><span class="text-slate-500">Status:</span> <span class="font-semibold">${admissionRecord.status || 'enrolled'}</span></div>
                <div><span class="text-slate-500">Admitted:</span> <span class="font-semibold">${fdate(admissionRecord.admittedAt || admissionRecord.createdAt || '', { short: true })}</span></div>
              </div>
            ` : `
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                ${icon('bell','w-3.5 h-3.5 inline')} No separate admission record found. Records are tracked here.
              </div>
            `}
            <button class="btn btn-secondary w-full mt-3 text-xs" onclick="APP.go('adm_people', { peopleTab: 'admissions' })">${icon('arrow_left','w-3.5 h-3.5 rotate-180')} View Admission</button>
          </div>
          <div class="card p-4">
            <h4 class="font-bold text-slate-900 mb-2 text-sm">${icon('parent','w-4 h-4 inline')} Parent / Guardian</h4>
            ${studentParent ? `
              <div class="flex items-center gap-2 mb-2">
                ${avatar(studentParent.name, 'sm')}
                <span class="font-semibold text-slate-900 text-sm">${studentParent.name}</span>
              </div>
              <div class="text-xs text-slate-600 space-y-1 mt-2">
                <div>${icon('phone','w-3.5 h-3.5 inline mr-1 text-slate-400')}${studentParent.phone || '—'}</div>
                ${studentParent.email ? `<div>${icon('edit','w-3.5 h-3.5 inline mr-1 text-slate-400')}${studentParent.email}</div>` : ''}
              </div>
              <a href="https://wa.me/${(studentParent.phone || '').replace(/\D/g, '')}" target="_blank" class="btn btn-secondary w-full mt-3 text-xs text-emerald-700" style="border-color:#86efac">
                ${icon('check','w-3.5 h-3.5 inline mr-1')} WhatsApp Parent
              </a>
            ` : `<p class="text-xs text-slate-500">No parent linked to this student.</p>`}
          </div>
          <div class="card p-4">
            <h4 class="font-bold text-slate-900 mb-2 text-sm">Points Summary</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Commendations</span><span class="text-emerald-700 font-semibold">+${sRecs.filter(r=>r.points>0).reduce((s,r)=>s+r.points,0)}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Deductions</span><span class="text-rose-600 font-semibold">${sRecs.filter(r=>r.points<0).reduce((s,r)=>s+r.points,0)}</span></div>
              <div class="flex justify-between border-t pt-1 mt-1 font-bold"><span>Net Total</span><span class="${totalPoints>=0?'text-emerald-700':'text-rose-600'}">${totalPoints>0?'+':''}${totalPoints}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Aggregate list view with tabs: Records | Suspensions
  const discTab = APP.params.discTab || 'records';
  const searchQ = (APP.params.discSearch || '').toLowerCase();
  const suspensions = DB.query('studentSuspensions', s => s.schoolId === currentSchoolId()).sort((a, b) => b.suspendedAt.localeCompare(a.suspendedAt));
  const filteredStudents = searchQ ? students.filter(s => s.name.toLowerCase().includes(searchQ)) : students;
  const studentsWithRecords = filteredStudents.map(s => ({ ...s, _recs: records.filter(r => r.studentId === s.id), _points: records.filter(r => r.studentId === s.id).reduce((sum, r) => sum + (r.points || 0), 0) })).filter(s => s._recs.length > 0 || searchQ);

  return `
    ${pageHeader({
      title: 'Discipline & Behaviour',
      subtitle: 'Commendations, misconduct, suspension history',
      actions: `<button class="btn btn-primary" onclick="addDisciplineModal()">${icon('plus','w-4 h-4')} New Record</button>`
    })}

    <div class="flex gap-2 mb-4">
      <button class="chip ${discTab==='records'?'active':''}" onclick="APP.params.discTab='records'; APP.render()">Behaviour Records</button>
      <button class="chip ${discTab==='suspensions'?'active':''}" onclick="APP.params.discTab='suspensions'; APP.render()">Suspension Log ${suspensions.length ? `<span class="ml-1 badge badge-danger">${suspensions.length}</span>` : ''}</button>
    </div>

    ${discTab === 'suspensions' ? `
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-900">All Suspension Records</h3>
          <span class="text-xs text-slate-500">${suspensions.length} total</span>
        </div>
        ${suspensions.length === 0
          ? emptyState({ title: 'No suspension records', body: 'Suspensions appear here when you suspend a student from their profile.', icon: 'check' })
          : `<table class="tbl">
              <thead><tr><th>Student</th><th>Class</th><th>Reason</th><th class="text-center">Days</th><th>Suspended</th><th>Resume Date</th><th class="text-center">Status</th></tr></thead>
              <tbody>
                ${suspensions.map(sus => {
                  const stu = DB.find('students', sus.studentId);
                  const cls = stu ? DB.find('classes', stu.classId) : null;
                  const isActive = !sus.reinstatedAt;
                  return `<tr>
                    <td><div class="flex items-center gap-2">${avatar(stu ? stu.name : '?', 'sm')}<span class="font-medium">${stu ? stu.name : '—'}</span></div></td>
                    <td class="text-sm">${cls ? cls.name : '—'}</td>
                    <td class="text-sm">${sus.reason || '—'}</td>
                    <td class="text-center">${sus.days || '—'}</td>
                    <td class="text-xs text-slate-500">${sus.suspendedAt ? fdate(sus.suspendedAt, { short: true }) : '—'}</td>
                    <td class="text-xs text-slate-500">${sus.resumeDate ? fdate(sus.resumeDate, { short: true }) : '—'}</td>
                    <td class="text-center"><span class="badge ${isActive ? 'badge-danger' : 'badge-neutral'}">${isActive ? 'Active' : 'Reinstated'}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`
        }
      </div>
    ` : `
      <div class="card p-4 mb-4 flex gap-3">
        <input type="text" class="input flex-1" placeholder="Search students…" value="${APP.params.discSearch || ''}" oninput="APP.params.discSearch=this.value; APP.render()" />
      </div>
      ${studentsWithRecords.length === 0
        ? emptyState({ title: 'No discipline records yet', body: searchQ ? 'No matching students found.' : 'Record commendations or misconduct to track student behavior.', icon: 'check',
            action: `<button class="btn btn-primary" onclick="addDisciplineModal()">${icon('plus','w-4 h-4')} New Record</button>` })
        : `<div class="card overflow-hidden">
            <table class="tbl">
              <thead><tr><th>Student</th><th class="text-center">Records</th><th class="text-center">Net Points</th><th>Latest</th><th></th></tr></thead>
              <tbody>
                ${studentsWithRecords.map(s => {
                  const latest = s._recs.sort((a,b)=>b.date.localeCompare(a.date))[0];
                  return `<tr class="cursor-pointer hover:bg-slate-50" onclick="APP.params.discView='student'; APP.params.discStudent='${s.id}'; APP.render()">
                    <td><div class="flex items-center gap-2">${avatar(s.name,'sm')}<span class="font-medium">${s.name}</span></div></td>
                    <td class="text-center">${s._recs.length}</td>
                    <td class="text-center font-mono font-bold ${s._points>=0?'text-emerald-700':'text-rose-600'}">${s._points>0?'+':''}${s._points}</td>
                    <td class="text-sm">${latest ? `<span class="badge ${latest.type==='commendation'?'badge-success':'badge-danger'} mr-1">${latest.type}</span>${fdate(latest.date,{short:true})}` : '—'}</td>
                    <td>${icon('arrow_left','w-4 h-4 rotate-180 text-slate-400')}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
    `}
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Item added to inventory');
}

/* ---------- Leave Requests (top-level tab) ---------- */
function view_adm_leave_requests() {
  const leaves = DB.query('leaveRequests', l => l.schoolId === currentSchoolId());
  const pending = leaves.filter(l => l.status === 'pending');
  return `
    ${pageHeader({
      title: 'Leave Requests',
      subtitle: `${leaves.length} total · ${pending.length} pending`,
    })}
    ${renderHRLeave()}
  `;
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
    ${pageHeader({
      title: 'HR Hub',
      subtitle: 'Leave requests and HR management',
      actions: `<button class="btn btn-secondary" onclick="APP.go('adm_staff_att')">${icon('attendance','w-4 h-4')} Staff Attendance Report</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Total Staff', value: teachers.length, icon: 'teacher', color: 'brand' })}
      ${statCard({ label: 'Pending Leave', value: pendingLeaves.length, icon: 'bell', color: pendingLeaves.length ? 'gold' : 'brand' })}
      ${statCard({ label: 'In Today', value: todayAttendance.length, icon: 'check', color: 'blue', action: { label: 'View report →', onclick: "APP.go('adm_staff_att')" } })}
      ${statCard({ label: 'Monthly Payroll', value: money(teachers.reduce((s, t) => s + (t.salary || 0), 0)), icon: 'fees', color: 'purple' })}
    </div>

    ${tabs([
      { key: 'leave', label: 'Leave Requests', badge: pendingLeaves.length || null }
    ], tab, k => { APP.params.hrTab = k; APP.render(); })}

    <div class="pt-4">
      ${renderHRLeave()}
      <div class="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
        <span class="text-sm text-slate-600">${icon('attendance','w-4 h-4 inline')} Staff Attendance has been moved for better visibility.</span>
        <button class="btn btn-secondary text-sm" onclick="APP.go('adm_staff_att')">${icon('arrow_left','w-4 h-4 rotate-180')} Go to Staff Attendance</button>
      </div>
      <div class="mt-2 text-center text-xs text-slate-500">
        Looking for payroll? It's been moved to <button class="text-brand-700 font-semibold underline" onclick="APP.go('adm_finance_hub', { financeTab: 'payroll' })">Finance → Payroll</button> (handled by the bursar/accountant).
      </div>
    </div>
  `;
}

/* ---------- Staff Attendance — Standalone Dashboard ---------- */
function view_adm_staff_att() {
  const date = APP.params.staffAttDate || today();
  const dateFrom = APP.params.staffAttFrom || daysAgo(30);
  const dateTo = APP.params.staffAttTo || today();
  const all = DB.query('staffAttendance', a => a.schoolId === currentSchoolId());
  const rangeRecs = all.filter(a => a.date >= dateFrom && a.date <= dateTo);
  const todayRecs = all.filter(a => a.date === date);
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const absent = teachers.filter(t => !todayRecs.find(r => r.staffId === t.id));
  const isToday = date === today();
  const days = []; const dayCounts = [];
  for (let d = 6; d >= 0; d--) {
    const dt = daysAgo(d);
    const wd = new Date(dt).getDay();
    if (wd === 0 || wd === 6) continue;
    days.push(fdate(dt, { short: true }));
    dayCounts.push(all.filter(a => a.date === dt).length);
  }
  window.afterRender = () => {
    const c = document.getElementById('staffAttChart2');
    if (c) new Chart(c, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Staff present', data: dayCounts, backgroundColor: '#10b981', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  };
  return `
    ${pageHeader({
      title: 'Staff Attendance Report',
      subtitle: 'Daily and range reporting for all staff members',
      actions: `
        <button class="btn btn-secondary" onclick="exportStaffAttendanceCSV('${dateFrom}', '${dateTo}')">${icon('download','w-4 h-4')} Export CSV</button>
        <button class="btn btn-primary" onclick="adminMarkStaffAttendanceModal('${date}')">${icon('check','w-4 h-4')} Mark Attendance</button>
      `
    })}

    <div class="card p-4 mb-4 grid sm:grid-cols-3 gap-3">
      <div><label class="input-label">View Date</label>
        <input type="date" class="input" value="${date}" onchange="APP.params.staffAttDate=this.value; APP.render()" />
      </div>
      <div><label class="input-label">Report From</label>
        <input type="date" class="input" value="${dateFrom}" onchange="APP.params.staffAttFrom=this.value; APP.render()" />
      </div>
      <div><label class="input-label">Report To</label>
        <input type="date" class="input" value="${dateTo}" onchange="APP.params.staffAttTo=this.value; APP.render()" />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'Present Today', value: todayRecs.filter(r=>r.status==='present').length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Late Today', value: todayRecs.filter(r=>r.status==='late').length, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'Absent Today', value: absent.length, icon: 'x', color: 'rose' })}
    </div>

    <div class="grid lg:grid-cols-3 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3 text-sm">7-Day Attendance Trend</h3>
        <div style="height: 200px;"><canvas id="staffAttChart2"></canvas></div>
      </div>
      <div class="card p-5 lg:col-span-2 overflow-hidden">
        <h3 class="font-bold text-slate-900 mb-3 text-sm">Clock-in Records · ${fdate(date, { long: true })}</h3>
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead><tr><th>Staff</th><th>Department</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead>
            <tbody>
              ${teachers.map(t => {
                const rec = todayRecs.find(r => r.staffId === t.id);
                return `<tr>
                  <td><div class="flex items-center gap-2">${avatar(t.name,'sm')}<div><div class="font-medium text-sm">${t.name}</div><div class="text-xs text-slate-500">${t.role || t.staffType || ''}</div></div></div></td>
                  <td class="text-sm text-slate-500">${t.department || t.staffType || '—'}</td>
                  <td class="font-mono text-sm">${rec ? rec.clockIn : '—'}</td>
                  <td class="font-mono text-sm">${rec ? (rec.clockOut || (isToday ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-rose-600" onclick="adm_clockOutStaff('${rec.id}')">${icon('logout','w-3.5 h-3.5')} Out</button>` : '—')) : '—'}</td>
                  <td>${rec ? statusBadge(rec.status) : statusBadge('absent')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    ${rangeRecs.length > 0 ? `
    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Attendance Summary (${dateFrom} → ${dateTo})</h3>
      </div>
      <table class="tbl">
        <thead><tr><th>Staff</th><th class="text-center">Days Present</th><th class="text-center">Late</th><th class="text-center">Absent</th><th class="text-center">Attendance %</th></tr></thead>
        <tbody>
          ${teachers.map(t => {
            const tRecs = rangeRecs.filter(r => r.staffId === t.id);
            const present = tRecs.filter(r => r.status === 'present').length;
            const late = tRecs.filter(r => r.status === 'late').length;
            const workDays = Math.max(1, Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000 * 5 / 7));
            const rate = Math.min(100, Math.round(((present + late) / workDays) * 100));
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(t.name,'sm')}<span class="font-medium text-sm">${t.name}</span></div></td>
              <td class="text-center font-semibold text-emerald-700">${present}</td>
              <td class="text-center font-semibold text-amber-600">${late}</td>
              <td class="text-center font-semibold text-rose-600">${workDays - present - late < 0 ? 0 : workDays - present - late}</td>
              <td class="text-center">
                <div class="flex items-center gap-2 justify-center">
                  <div class="progress" style="width:80px"><div class="progress-bar ${rate < 70 ? 'bg-rose-500' : ''}" style="width:${rate}%"></div></div>
                  <span class="text-xs font-semibold">${rate}%</span>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  `;
}

function exportStaffAttendanceCSV(dateFrom, dateTo) {
  const teachers = DB.query('teachers', t => t.schoolId === currentSchoolId());
  const recs = DB.query('staffAttendance', a => a.schoolId === currentSchoolId() && a.date >= dateFrom && a.date <= dateTo);
  let csv = `Staff,Date,Status,Clock In,Clock Out\n`;
  teachers.forEach(t => {
    const tRecs = recs.filter(r => r.staffId === t.id);
    if (tRecs.length === 0) csv += `"${t.name}","${dateFrom}","absent","",""\n`;
    else tRecs.forEach(r => { csv += `"${t.name}","${r.date}","${r.status}","${r.clockIn || ''}","${r.clockOut || ''}"\n`; });
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `staff_attendance_${dateFrom}_${dateTo}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Staff attendance report exported', 'success');
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
          <thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th>Source</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${filtered.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).map(l => {
              const staff = DB.find('teachers', l.staffId);
              const days = Math.ceil((new Date(l.to) - new Date(l.from)) / 86400000) + 1;
              return `<tr class="cursor-pointer hover:bg-slate-50" onclick="viewLeaveDetails('${l.id}')">
                <td><div class="flex items-center gap-2">${avatar(staff ? staff.name : '?', 'sm')}<div><div class="font-medium text-sm">${staff ? staff.name : '—'}</div><div class="text-xs text-slate-500">${staff ? (staff.role || staff.staffType || 'Staff') : ''}</div></div></div></td>
                <td><span class="badge badge-info">${l.type}</span></td>
                <td class="text-sm">${fdate(l.from, { short: true })} – ${fdate(l.to, { short: true })} <span class="text-xs text-slate-500">(${days}d)</span></td>
                <td>${l.source === 'self' ? '<span class="badge badge-neutral">Staff submitted</span>' : '<span class="badge badge-neutral">Admin entered</span>'}</td>
                <td>${statusBadge(l.status === 'approved' ? 'successful' : l.status === 'rejected' ? 'failed' : 'pending')}</td>
                <td class="text-right whitespace-nowrap" onclick="event.stopPropagation()">
                  ${l.status === 'pending' ? `
                    <button class="btn btn-ghost !p-1.5 text-emerald-700" title="Approve" onclick="decideLeave('${l.id}', 'approved')">${icon('check','w-4 h-4')}</button>
                    <button class="btn btn-ghost !p-1.5 text-rose-600" title="Reject" onclick="decideLeave('${l.id}', 'rejected')">${icon('x','w-4 h-4')}</button>
                  ` : icon('arrow_left','w-4 h-4 rotate-180 text-slate-300')}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function viewLeaveDetails(leaveId) {
  const l = DB.find('leaveRequests', leaveId);
  if (!l) return;
  const staff = DB.find('teachers', l.staffId);
  const decidedBy = l.decidedBy ? (DB.find('teachers', l.decidedBy) || DB.find('schools', l.decidedBy) || { name: 'Admin' }) : null;
  const days = Math.ceil((new Date(l.to) - new Date(l.from)) / 86400000) + 1;
  const statusColor = l.status === 'approved' ? 'emerald' : l.status === 'rejected' ? 'rose' : 'amber';
  const statusLabel = l.status === 'approved' ? 'Approved' : l.status === 'rejected' ? 'Rejected' : 'Awaiting Decision';

  modal({
    title: 'Leave Request Details',
    size: 'md',
    body: `
      <div class="space-y-4">
        <!-- Staff card -->
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          ${avatar(staff ? staff.name : '?', 'md')}
          <div>
            <div class="font-bold text-slate-900">${staff ? staff.name : '—'}</div>
            <div class="text-xs text-slate-500">${staff ? (staff.role || staff.staffType || 'Staff') : ''}</div>
          </div>
          <span class="ml-auto badge bg-${statusColor}-100 text-${statusColor}-800 border-${statusColor}-200">${statusLabel}</span>
        </div>

        <!-- Leave details -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Leave Type</div>
            <div class="font-semibold text-slate-900">${l.type}</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Duration</div>
            <div class="font-semibold text-slate-900">${days} day${days !== 1 ? 's' : ''}</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs text-slate-400 uppercase font-semibold mb-1">From</div>
            <div class="font-semibold text-slate-900">${fdate(l.from, { long: true })}</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs text-slate-400 uppercase font-semibold mb-1">To</div>
            <div class="font-semibold text-slate-900">${fdate(l.to, { long: true })}</div>
          </div>
        </div>

        <!-- Reason -->
        <div>
          <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Reason / Notes</div>
          <div class="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 min-h-10">${l.reason || '<span class="text-slate-400 italic">No reason provided</span>'}</div>
        </div>

        <!-- Meta -->
        <div class="text-xs text-slate-400 space-y-0.5">
          <div>Submitted: ${fdate(l.requestedAt, { long: true })} · ${l.source === 'self' ? 'by staff member' : 'entered by admin'}</div>
          ${l.decidedAt ? `<div>${l.status === 'approved' ? 'Approved' : 'Rejected'} on ${fdate(l.decidedAt, { long: true })}${decidedBy ? ' by ' + decidedBy.name : ''}</div>` : ''}
        </div>

        ${l.status === 'pending' ? `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          ${icon('info','w-4 h-4 inline mr-1')} This request is awaiting your decision. Approve to authorise the leave, or reject to decline it (the staff member will be notified either way).
        </div>` : ''}
      </div>
    `,
    footer: l.status === 'pending'
      ? `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
         <button class="btn btn-danger" onclick="document.getElementById('modalBackdrop')?.click(); decideLeave('${l.id}','rejected')">${icon('x','w-4 h-4')} Reject</button>
         <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click(); decideLeave('${l.id}','approved')">${icon('check','w-4 h-4')} Approve</button>`
      : `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
  });
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); APP.render()">Skip for now</button>`
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
  document.getElementById('modalBackdrop')?.click();
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
        <div><label class="input-label">Reason</label><textarea id="lv_reason" rows="2" class="input" placeholder="e.g. Attending hospital for knee surgery"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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

  // Group staff: academic (self-clock) vs non-academic (admin-marked)
  const academic = teachers.filter(t => t.staffType === 'Academic');
  const nonAcademic = teachers.filter(t => t.staffType !== 'Academic');

  const renderStaffRow = (t) => {
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
  };

  modal({
    title: `Mark Staff Attendance · ${fdate(date, { long: true })}`,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Enter staff attendance from the sign-in book. Non-academic staff (security, cleaners, drivers, etc.) are marked manually by admin. Academic staff can also be overridden here. Anything after <strong>08:00</strong> is marked late by default.
        </div>
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div class="text-sm text-slate-600">${teachers.length} staff members</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary text-xs" onclick="bulkMarkStaff('present')">${icon('check','w-3 h-3')} All present</button>
            <button class="btn btn-secondary text-xs" onclick="bulkMarkStaff('absent')">${icon('x','w-3 h-3')} All absent</button>
          </div>
        </div>
        ${nonAcademic.length > 0 ? `
        <div>
          <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Non-Academic Staff (${nonAcademic.length})</div>
          <div class="space-y-1.5">${nonAcademic.map(renderStaffRow).join('')}</div>
        </div>` : ''}
        ${academic.length > 0 ? `
        <div>
          <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Academic / Teaching Staff (${academic.length})</div>
          <div class="space-y-1.5 max-h-64 overflow-y-auto">${academic.map(renderStaffRow).join('')}</div>
        </div>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    ${pageHeader({ title: 'School Settings', subtitle: 'Branding · Academic · Appraisal · Budget · Calendar · Notifications · Roles · AI · Payments · Backup' })}
    ${tabs([
      { key: 'branding',     label: 'Branding' },
      { key: 'academic',     label: 'Academic' },
      { key: 'appraisal',    label: 'Appraisal' },
      { key: 'budget',       label: 'Budget Categories' },
      { key: 'lists',        label: 'Lists & Options' },
      { key: 'calendar',     label: 'Calendar' },
      { key: 'roles',        label: 'Roles & Permissions' },
      { key: 'notifications',label: 'Notifications' },
      { key: 'ai',           label: 'AI Assistant' },
      { key: 'payments',     label: 'Payment Gateway' },
      { key: 'backup',       label: 'Data Backup' }
    ], tab, k => { APP.params.setTab = k; APP.render(); })}
    <div class="pt-4">
      ${tab === 'academic' ? renderAcademicStructure() :
        tab === 'appraisal' ? renderAppraisalSettings() :
        tab === 'budget' ? renderBudgetCategoriesSettings() :
        tab === 'lists'  ? renderCustomListsSettings() :
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
        <div><label class="input-label">Description</label><textarea id="ro_desc" rows="2" class="input" placeholder="Describe what this role can access and do...">${existing ? existing.description : ''}</textarea></div>
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
          <button class="btn btn-ghost text-sm" onclick="reconnectPaystackModal()">Reconnect</button>
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

function reconnectPaystackModal() {
  const school = DB.find('schools', currentSchoolId()) || {};
  modal({
    title: 'Reconnect Paystack',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline mr-1')} Get your API keys from the Paystack dashboard under <strong>Settings › API Keys & Webhooks</strong>.
        </div>
        <div><label class="input-label">Public Key</label><input id="ps_pk" class="input font-mono text-sm" placeholder="pk_live_…" /></div>
        <div><label class="input-label">Secret Key</label><input id="ps_sk" class="input font-mono text-sm" type="password" placeholder="sk_live_…" /></div>
        <div><label class="input-label">Business Name (shown on receipts)</label><input id="ps_name" class="input" value="${school.name || ''}" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="savePaystackConfig()">${icon('check','w-4 h-4')} Save & Reconnect</button>`
  });
}

function savePaystackConfig() {
  const pk = document.getElementById('ps_pk').value.trim();
  const sk = document.getElementById('ps_sk').value.trim();
  const name = document.getElementById('ps_name').value.trim();
  if (!pk || !sk) { toast('Enter both public and secret keys', 'danger'); return; }
  DB.settings({ paystackPk: pk, paystackName: name });
  document.getElementById('modalBackdrop')?.click();
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'updated_paystack_config', target: 'Payment Gateway', timestamp: now() });
  toast('Paystack configuration updated', 'success');
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-danger" onclick="document.getElementById('modalBackdrop')?.click(); toast('Restore request logged — Super Admin approval required', 'info')">Request Restore</button>`
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
          <div>
            <label class="input-label">Custom Letterhead</label>
            <p class="text-xs text-slate-500 mb-2">Used on official documents: invoices, transfer certificates, report cards. Recommended: A4 header image (PNG/JPG, max 1MB, transparent background).</p>
            <input type="file" id="br_letterheadFile" accept="image/*" class="hidden" onchange="onLetterheadPick(event)" />
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              ${branding.letterheadImage
                ? `<img src="${branding.letterheadImage}" class="h-16 object-contain rounded-lg border border-slate-200 bg-white" />`
                : `<div class="h-16 w-32 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 text-xs">No letterhead</div>`}
              <div class="flex gap-2">
                <button type="button" class="btn btn-secondary text-sm" onclick="document.getElementById('br_letterheadFile').click()">${icon('upload','w-4 h-4')} Upload</button>
                ${branding.letterheadImage ? `<button type="button" class="btn btn-ghost text-sm" onclick="clearLetterhead()">Remove</button>` : ''}
              </div>
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
let _letterheadBuffer = null;
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

function onLetterheadPick(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { toast('Letterhead too large (max 1MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _letterheadBuffer = e.target.result;
    toast('Letterhead ready — click Save Branding to apply', 'info');
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

function clearLetterhead() {
  _letterheadBuffer = null;
  const school = DB.find('schools', AUTH.current.id);
  if (school && school.branding) school.branding.letterheadImage = null;
  DB.update('schools', school.id, { branding: school.branding });
  APP.render();
  toast('Letterhead removed');
}

function saveBranding() {
  const school = DB.find('schools', AUTH.current.id);
  const branding = {
    primaryColor: document.getElementById('br_color').value,
    logoText: document.getElementById('br_logoText').value.trim().toUpperCase(),
    motto: document.getElementById('br_motto').value.trim(),
    logoImage: _logoBuffer !== null ? _logoBuffer : (school.branding && school.branding.logoImage) || null,
    letterheadImage: _letterheadBuffer !== null ? _letterheadBuffer : (school.branding && school.branding.letterheadImage) || null
  };
  const name = document.getElementById('br_name').value.trim() || school.name;
  DB.update('schools', school.id, { branding, name });
  _logoBuffer = null; _letterheadBuffer = null;
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close wizard</button>`
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
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => bulkPromoteModal(), 100);
}

/* ---------- Exam Structure Settings ---------- */
const _DEFAULT_EXAM_STRUCTURE = {
  terms: [
    { name: 'First Term',  types: [{ label: 'CA 1', weight: 10, category: 'cbt' }, { label: 'CA 2', weight: 10, category: 'midterm' }, { label: 'Midterm Test', weight: 20, category: 'midterm' }, { label: 'Exam', weight: 60, category: 'examination' }] },
    { name: 'Second Term', types: [{ label: 'CA 1', weight: 10, category: 'cbt' }, { label: 'CA 2', weight: 10, category: 'midterm' }, { label: 'Midterm Test', weight: 20, category: 'midterm' }, { label: 'Exam', weight: 60, category: 'examination' }] },
    { name: 'Third Term',  types: [{ label: 'CA 1', weight: 15, category: 'cbt' }, { label: 'Mock', weight: 25, category: 'mock' }, { label: 'Exam', weight: 60, category: 'examination' }] }
  ]
};

function _getExamStructure() {
  const es = DB.settings().examStructure;
  // Guard against corrupt/empty saves from before this helper existed
  if (es && Array.isArray(es.terms) && es.terms.length > 0) return es;
  const def = JSON.parse(JSON.stringify(_DEFAULT_EXAM_STRUCTURE));
  DB.settings({ examStructure: def });
  return def;
}

function renderExamStructureSettings() {
  const examStructure = _getExamStructure();
  return `
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
        ${icon('info','w-4 h-4 inline mr-1')} Define the assessment types (CBT, midterm, mock, final exam) and their weighting for each term. Teachers will see these categories when entering results.
      </div>
      ${examStructure.terms.map((term, ti) => `
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-900">${term.name}</h4>
            <button class="btn btn-secondary text-xs" onclick="addExamTypeToTerm(${ti})">${icon('plus','w-3.5 h-3.5')} Add Type</button>
          </div>
          <table class="tbl">
            <thead><tr><th>Assessment Type</th><th>Category</th><th>Weight (%)</th><th></th></tr></thead>
            <tbody>
              ${term.types.map((t, xi) => `<tr>
                <td><input type="text" class="input input-sm" value="${t.label}" onchange="updateExamType(${ti},${xi},'label',this.value)" /></td>
                <td>
                  <select class="input input-sm" onchange="updateExamType(${ti},${xi},'category',this.value)">
                    <option ${(t.category||'examination')==='examination'?'selected':''}>examination</option>
                    <option ${(t.category||'')==='midterm'?'selected':''}>midterm</option>
                    <option ${(t.category||'')==='extracurricular'?'selected':''}>extracurricular</option>
                    <option ${(t.category||'')==='cbt'?'selected':''}>cbt</option>
                    <option ${(t.category||'')==='mock'?'selected':''}>mock</option>
                  </select>
                </td>
                <td><input type="number" class="input input-sm w-20" value="${t.weight}" min="0" max="100" onchange="updateExamType(${ti},${xi},'weight',parseInt(this.value))" /></td>
                <td><button class="btn btn-ghost !p-1.5 text-rose-600" onclick="removeExamType(${ti},${xi})">${icon('trash','w-4 h-4')}</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div class="text-right text-xs mt-2 ${term.types.reduce((s,t)=>s+t.weight,0)!==100?'text-rose-600 font-semibold':'text-slate-500'}">
            Total: ${term.types.reduce((s,t)=>s+t.weight,0)}% ${term.types.reduce((s,t)=>s+t.weight,0)!==100?'⚠ must equal 100%':'✓'}
          </div>
        </div>
      `).join('')}
      <button class="btn btn-primary" onclick="saveExamStructure()">${icon('check','w-4 h-4')} Save Exam Structure</button>
    </div>
  `;
}

function updateExamType(termIdx, typeIdx, field, value) {
  const es = _getExamStructure();
  if (es.terms[termIdx] && es.terms[termIdx].types[typeIdx]) {
    es.terms[termIdx].types[typeIdx][field] = value;
    DB.settings({ examStructure: es });
  }
}

function addExamTypeToTerm(termIdx) {
  const es = _getExamStructure();
  if (es.terms[termIdx]) {
    es.terms[termIdx].types.push({ label: 'New Type', weight: 0, category: 'examination' });
    DB.settings({ examStructure: es });
    APP.render();
  }
}

function removeExamType(termIdx, typeIdx) {
  const es = _getExamStructure();
  if (es.terms[termIdx]) {
    es.terms[termIdx].types.splice(typeIdx, 1);
    DB.settings({ examStructure: es });
    APP.render();
  }
}

function saveExamStructure() {
  toast('Exam structure saved successfully', 'success');
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'updated_exam_structure', target: 'Exam Structure Settings', timestamp: now() });
}

/* ---------- Appraisal Parameters Settings ---------- */
function renderAppraisalSettings() {
  const s = DB.settings();
  const appraisalParams = s.appraisalParams || {
    cycle: 'termly',
    parameters: [
      { key: 'punctuality', label: 'Punctuality & Attendance', weight: 15, description: 'Arrives on time, consistent attendance' },
      { key: 'lesson_delivery', label: 'Lesson Delivery', weight: 25, description: 'Quality and clarity of teaching' },
      { key: 'student_outcomes', label: 'Student Outcomes', weight: 25, description: 'Student performance and progress' },
      { key: 'professionalism', label: 'Professionalism', weight: 20, description: 'Conduct, dress, communication' },
      { key: 'collaboration', label: 'Collaboration', weight: 15, description: 'Team work and peer support' }
    ]
  };
  return `
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
        ${icon('info','w-4 h-4 inline mr-1')} Define how teacher appraisals are scored. Weights must total 100%. These parameters appear on appraisal forms for principals and department heads.
      </div>
      <div class="card p-5">
        <div class="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label class="input-label">Appraisal Cycle</label>
            <select id="apr_cycle" class="input" onchange="">
              <option ${appraisalParams.cycle==='termly'?'selected':''}>termly</option>
              <option ${appraisalParams.cycle==='annual'?'selected':''}>annual</option>
              <option ${appraisalParams.cycle==='bi-annual'?'selected':''}>bi-annual</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn btn-secondary" onclick="addAppraisalParam()">${icon('plus','w-4 h-4')} Add Parameter</button>
          </div>
        </div>
        <table class="tbl">
          <thead><tr><th>Parameter</th><th>Description</th><th>Weight (%)</th><th></th></tr></thead>
          <tbody>
            ${appraisalParams.parameters.map((p, i) => `<tr>
              <td><input type="text" class="input input-sm" value="${p.label}" onchange="updateAppraisalParam(${i},'label',this.value)" /></td>
              <td><input type="text" class="input input-sm" value="${p.description}" onchange="updateAppraisalParam(${i},'description',this.value)" /></td>
              <td><input type="number" class="input input-sm w-20" value="${p.weight}" min="0" max="100" onchange="updateAppraisalParam(${i},'weight',parseInt(this.value)||0)" /></td>
              <td><button class="btn btn-ghost !p-1.5 text-rose-600" onclick="removeAppraisalParam(${i})">${icon('trash','w-4 h-4')}</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs ${appraisalParams.parameters.reduce((s,p)=>s+p.weight,0)!==100?'text-rose-600 font-semibold':'text-slate-500'}">
            Total: ${appraisalParams.parameters.reduce((s,p)=>s+p.weight,0)}% ${appraisalParams.parameters.reduce((s,p)=>s+p.weight,0)!==100?'⚠ must equal 100%':'✓'}
          </span>
          <button class="btn btn-primary" onclick="saveAppraisalSettings()">${icon('check','w-4 h-4')} Save Parameters</button>
        </div>
      </div>
    </div>
  `;
}

function updateAppraisalParam(idx, field, value) {
  const s = DB.settings();
  const ap = s.appraisalParams || { parameters: [] };
  if (ap.parameters[idx]) { ap.parameters[idx][field] = value; DB.settings({ appraisalParams: ap }); APP.render(); }
}

function addAppraisalParam() {
  const s = DB.settings();
  const ap = s.appraisalParams || { cycle: 'termly', parameters: [] };
  ap.parameters.push({ key: `param_${Date.now()}`, label: 'New Parameter', description: '', weight: 0 });
  DB.settings({ appraisalParams: ap }); APP.render();
}

function removeAppraisalParam(idx) {
  const s = DB.settings();
  const ap = s.appraisalParams || { parameters: [] };
  ap.parameters.splice(idx, 1); DB.settings({ appraisalParams: ap }); APP.render();
}

function saveAppraisalSettings() {
  const cycle = document.getElementById('apr_cycle') ? document.getElementById('apr_cycle').value : 'termly';
  const s = DB.settings();
  const ap = s.appraisalParams || { parameters: [] };
  ap.cycle = cycle; DB.settings({ appraisalParams: ap });
  toast('Appraisal parameters saved', 'success');
}

/* ---------- Budget Categories Settings ---------- */
function renderBudgetCategoriesSettings() {
  const s = DB.settings();
  const budgetCats = s.budgetCategories || ['Salaries','Utilities','Maintenance','Supplies','Internet','Transport','Events','Other'];
  return `
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
        ${icon('info','w-4 h-4 inline mr-1')} These categories appear in the Expenses and Budget sections. Edit, reorder, or add your own categories to match your school's accounting structure.
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-slate-900">Budget Categories</h4>
          <button class="btn btn-secondary text-sm" onclick="addBudgetCategory()">${icon('plus','w-4 h-4')} Add Category</button>
        </div>
        <div class="space-y-2" id="budgetCatList">
          ${budgetCats.map((cat, i) => `
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <div class="text-slate-400 cursor-grab">${icon('menu','w-4 h-4')}</div>
              <input type="text" class="input flex-1" value="${cat}" id="bcat_${i}" onchange="updateBudgetCategory(${i}, this.value)" />
              <button class="btn btn-ghost !p-1.5 text-rose-600" onclick="removeBudgetCategory(${i})">${icon('trash','w-4 h-4')}</button>
            </div>
          `).join('')}
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn btn-primary" onclick="saveBudgetCategories()">${icon('check','w-4 h-4')} Save Categories</button>
          <button class="btn btn-secondary" onclick="resetBudgetCategories()">Reset to Default</button>
        </div>
      </div>
    </div>
  `;
}

function addBudgetCategory() {
  const s = DB.settings();
  const cats = [...(s.budgetCategories || ['Salaries','Utilities','Maintenance','Supplies','Internet','Transport','Events','Other']), 'New Category'];
  DB.settings({ budgetCategories: cats }); APP.render();
}

function removeBudgetCategory(idx) {
  const s = DB.settings();
  const cats = [...(s.budgetCategories || [])];
  cats.splice(idx, 1); DB.settings({ budgetCategories: cats }); APP.render();
}

function updateBudgetCategory(idx, value) {
  const s = DB.settings();
  const cats = [...(s.budgetCategories || [])];
  cats[idx] = value; DB.settings({ budgetCategories: cats });
}

function saveBudgetCategories() {
  const cats = Array.from(document.querySelectorAll('#budgetCatList input')).map(el => el.value.trim()).filter(Boolean);
  DB.settings({ budgetCategories: cats });
  toast('Budget categories saved', 'success');
}

function resetBudgetCategories() {
  DB.settings({ budgetCategories: ['Salaries','Utilities','Maintenance','Supplies','Internet','Transport','Events','Other'] });
  toast('Categories reset to default', 'info'); APP.render();
}

/* ============================================================
   CUSTOM LISTS & OPTIONS SETTINGS
   ============================================================ */

const _CLIST_DEFS = {
  expenseCategories: { title: 'Expense Categories', desc: 'Shown when recording a school expense (Finance → Expenses).', defaults: ['Salaries','Electricity','Diesel','Maintenance','Supplies','Internet','Transport','Security','Cleaning','Bank Charges','Other'] },
  leaveTypes:        { title: 'Staff Leave Types',   desc: 'Options a teacher can choose when submitting a leave request.', defaults: ['Annual','Casual','Sick','Maternity','Paternity','Bereavement','Study','Compassionate'] },
  inventoryCategories: { title: 'Inventory Categories', desc: 'Categories for items in the school store.', defaults: ['Books','Stationery','Equipment','Uniforms','Furniture','Sports','Other'] },
  diaryCategories:   { title: 'Diary Note Categories', desc: 'Labels on teacher-to-parent communication diary entries.', defaults: ['Homework','Behaviour','Academic','Health','General'] },
  disciplineReasons: { title: 'Suspension Reasons',  desc: 'Selectable reasons when suspending a student.', defaults: ['Fighting / Physical Violence','Gross Insubordination','Bullying or Harassment','Damage to School Property','Academic Dishonesty / Exam Malpractice','Possession of Prohibited Item','Persistent Unexplained Absences','Pending Disciplinary Investigation','Other'] }
};

function renderCustomListsSettings() {
  const s = DB.settings();
  return `
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
        ${icon('info','w-4 h-4 inline mr-1')} Every dropdown below is used across the system. Add, rename, or remove items to match your school's terminology. Changes take effect immediately on new entries.
      </div>
      <div class="grid lg:grid-cols-2 gap-4">
        ${Object.entries(_CLIST_DEFS).map(([key, cfg]) => {
          const items = s[key] || cfg.defaults;
          return `
            <div class="card p-5">
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-bold text-slate-900">${cfg.title}</h4>
                <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="customListAdd('${key}')">${icon('plus','w-3 h-3')} Add</button>
              </div>
              <p class="text-xs text-slate-500 mb-3">${cfg.desc}</p>
              <div class="space-y-1.5" id="clist_${key}">
                ${items.map((item, i) => `
                  <div class="flex items-center gap-2">
                    <input type="text" class="input flex-1 !py-1.5 text-sm" value="${item.replace(/"/g,'&quot;')}" id="cli_${key}_${i}" />
                    <button class="text-rose-400 hover:text-rose-600 p-1 flex-shrink-0" onclick="customListRemove('${key}', ${i})">${icon('x','w-4 h-4')}</button>
                  </div>
                `).join('')}
              </div>
              <div class="mt-3 flex gap-2">
                <button class="btn btn-primary text-sm" onclick="customListSave('${key}')">${icon('check','w-4 h-4')} Save</button>
                <button class="btn btn-ghost text-xs text-slate-400" onclick="customListReset('${key}')">Reset to defaults</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function customListSave(key) {
  const inputs = document.querySelectorAll(`#clist_${key} input`);
  const items = Array.from(inputs).map(el => el.value.trim()).filter(Boolean);
  if (!items.length) { toast('List cannot be empty', 'danger'); return; }
  DB.settings({ [key]: items });
  toast(`${(_CLIST_DEFS[key] || {}).title || 'List'} saved`, 'success');
}

function customListAdd(key) {
  const cfg = _CLIST_DEFS[key]; if (!cfg) return;
  const items = [...(DB.settings()[key] || cfg.defaults), 'New item'];
  DB.settings({ [key]: items }); APP.render();
}

function customListRemove(key, idx) {
  const cfg = _CLIST_DEFS[key]; if (!cfg) return;
  const items = [...(DB.settings()[key] || cfg.defaults)];
  if (items.length <= 1) { toast('Keep at least one item', 'warn'); return; }
  items.splice(idx, 1);
  DB.settings({ [key]: items }); APP.render();
}

function customListReset(key) {
  const cfg = _CLIST_DEFS[key]; if (!cfg) return;
  DB.settings({ [key]: cfg.defaults });
  toast(`Reset to defaults`, 'info'); APP.render();
}

function renderAcademicStructure() {
  const sessions = DB.query('academicSessions', s => s.schoolId === currentSchoolId());
  const terms = DB.query('academicTerms', t => t.schoolId === currentSchoolId());
  const arms = DB.query('arms', a => a.schoolId === currentSchoolId());
  const subjects = DB.get('subjects');
  return `
    <div class="grid lg:grid-cols-3 gap-4 mb-4">
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
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-bold text-slate-900">Subjects</h3>
          <p class="text-xs text-slate-500 mt-0.5">These subjects appear in scheme of work, results entry, and staff assignments.</p>
        </div>
        <button class="btn btn-primary text-sm" onclick="newSubjectModal()">${icon('plus','w-3.5 h-3.5')} Add Subject</button>
      </div>
      <div class="flex flex-wrap gap-2">
        ${subjects.length ? subjects.map(sub => `
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
            ${sub.name}
            <button onclick="deleteSubject('${sub.id}')" class="text-slate-400 hover:text-rose-600 transition-colors leading-none" title="Remove subject">&times;</button>
          </span>
        `).join('') : `<p class="text-sm text-slate-400">No subjects added yet. Click "Add Subject" to get started.</p>`}
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSession()">Save</button>`
  });
}

function saveSession() {
  const name = document.getElementById('ses_name').value.trim();
  if (!name) { toast('Name required', 'danger'); return; }
  DB.insert('academicSessions', { id: uid('sess'), schoolId: currentSchoolId(), name, startDate: document.getElementById('ses_start').value, endDate: document.getElementById('ses_end').value, current: false });
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Term added');
}

function newArmModal() {
  modal({
    title: 'New Arm',
    body: `<div><label class="input-label">Arm Name (e.g. A, B, Gold)</label><input id="arm_name" class="input" placeholder="e.g. A, B, Gold, Diamond" /></div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveArm()">Save</button>`
  });
}

function saveArm() {
  const name = document.getElementById('arm_name').value.trim();
  if (!name) { toast('Name required', 'danger'); return; }
  DB.insert('arms', { id: uid('arm'), schoolId: currentSchoolId(), name });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Arm added');
}

function newSubjectModal() {
  modal({
    title: 'Add Subject',
    body: `<div class="space-y-3">
      <div>
        <label class="input-label">Subject Name</label>
        <input id="sub_name" class="input" placeholder="e.g. Mathematics, English Language, Basic Science" />
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveSubject()">Add Subject</button>`
  });
  setTimeout(() => document.getElementById('sub_name')?.focus(), 100);
}

function saveSubject() {
  const name = document.getElementById('sub_name').value.trim();
  if (!name) { toast('Subject name required', 'danger'); return; }
  const existing = DB.get('subjects').find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) { toast('A subject with that name already exists', 'warn'); return; }
  DB.insert('subjects', { id: uid('sub'), name });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Subject added');
}

function deleteSubject(subjectId) {
  const sub = DB.find('subjects', subjectId);
  if (!sub) return;
  const inUse = DB.query('schemes', s => s.subjectId === subjectId).length > 0
              || DB.query('results', r => r.subjectId === subjectId).length > 0;
  if (inUse) {
    toast(`"${sub.name}" is referenced in schemes or results and cannot be removed`, 'warn');
    return;
  }
  if (!confirm(`Remove "${sub.name}"? This cannot be undone.`)) return;
  DB.remove('subjects', subjectId);
  APP.render();
  toast('Subject removed');
}

function renderAcademicCalendar() {
  const s = DB.settings();
  const atd = s.academicTermDates || {
    session: '',
    terms: [
      { name: 'First Term',  staffPDDate: '', resumptionDate: '', firstHalfEnd: '', openDayDate: '', midtermStart: '', midtermEnd: '', secondHalfStart: '', termEndDate: '', vacationStart: '', vacationEnd: '' },
      { name: 'Second Term', staffPDDate: '', resumptionDate: '', firstHalfEnd: '', openDayDate: '', midtermStart: '', midtermEnd: '', secondHalfStart: '', termEndDate: '', vacationStart: '', vacationEnd: '' },
      { name: 'Third Term',  staffPDDate: '', resumptionDate: '', firstHalfEnd: '', openDayDate: '', midtermStart: '', midtermEnd: '', secondHalfStart: '', termEndDate: '', vacationStart: '', vacationEnd: '' }
    ]
  };

  const termDateFields = [
    { key: 'staffPDDate',      label: 'Staff PD / Inservice Day' },
    { key: 'resumptionDate',   label: 'Resumption Date' },
    { key: 'firstHalfEnd',     label: 'First Half Ends' },
    { key: 'openDayDate',      label: 'Open Day' },
    { key: 'midtermStart',     label: 'Mid-Term Break Starts' },
    { key: 'midtermEnd',       label: 'Mid-Term Break Ends' },
    { key: 'secondHalfStart',  label: 'Second Half Starts' },
    { key: 'termEndDate',      label: 'Last Day of Term' },
    { key: 'vacationStart',    label: 'Vacation Starts' },
    { key: 'vacationEnd',      label: 'Vacation Ends / Next Resumption' }
  ];

  const events = DB.query('academicCalendar', e => e.schoolId === currentSchoolId()).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = events.filter(e => new Date(e.date) < new Date());
  return `
    <!-- Academic Year Term Dates -->
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-slate-900">Academic Year Term Dates</h3>
          <p class="text-xs text-slate-500 mt-0.5">These dates power the Academic Year overview on the Calendar page</p>
        </div>
      </div>
      <div class="mb-3">
        <label class="input-label">Session (e.g. 2025/2026)</label>
        <input id="atd_session" class="input w-48" value="${atd.session || ''}" placeholder="2025/2026" />
      </div>
      <div class="space-y-5">
        ${atd.terms.map((term, ti) => `
          <div>
            <h4 class="font-semibold text-slate-800 mb-2 text-sm border-b border-slate-100 pb-1">${term.name}</h4>
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
              ${termDateFields.map(f => `
                <div>
                  <label class="input-label text-xs">${f.label}</label>
                  <input type="date" id="atd_${ti}_${f.key}" class="input input-sm" value="${term[f.key] || ''}" />
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="mt-4">
        <button class="btn btn-primary" onclick="saveAcademicTermDates()">${icon('check','w-4 h-4')} Save Term Dates</button>
      </div>
    </div>

    <!-- Ad-hoc Calendar Events -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-slate-900">Additional Calendar Events</h3>
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
      <div><label class="input-label">Title</label><input id="cal_title" class="input" placeholder="e.g. Inter-House Sports Day" /></div>
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast('Event added');
}

function saveAcademicTermDates() {
  const termDateKeys = ['staffPDDate','resumptionDate','firstHalfEnd','openDayDate','midtermStart','midtermEnd','secondHalfStart','termEndDate','vacationStart','vacationEnd'];
  const session = (document.getElementById('atd_session') || {}).value.trim();
  const terms = [0, 1, 2].map(ti => {
    const names = ['First Term', 'Second Term', 'Third Term'];
    const obj = { name: names[ti] };
    termDateKeys.forEach(k => {
      const el = document.getElementById(`atd_${ti}_${k}`);
      obj[k] = el ? el.value : '';
    });
    return obj;
  });
  DB.settings({ academicTermDates: { session, terms } });
  toast('Term dates saved', 'success');
  APP.render();
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
      actions: `<button class="btn btn-secondary" onclick="copyAdmissionLink()">${icon('paperclip','w-4 h-4')} Copy public link</button>
               <button class="btn btn-primary" onclick="newApplicationModal()">${icon('plus','w-4 h-4')} New Application</button>`
    })}

    <div class="card bg-gradient-to-br from-brand-700 to-brand-800 text-white p-4 mb-4">
      <div class="text-xs text-brand-200 uppercase font-semibold">Your public admission link</div>
      <div class="flex items-center gap-3 mt-1">
        <code class="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-mono flex-1">${publicLink}</code>
        <button class="btn btn-gold !py-1.5" onclick="copyAdmissionLink()">${icon('paperclip','w-4 h-4')} Copy</button>
      </div>
      <p class="text-xs text-brand-200 mt-2">Share this with prospective parents on your website, WhatsApp, or in print. They can apply without creating an account.</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'Total', value: apps.length, icon: 'plus', color: 'brand' })}
      ${statCard({ label: 'Pending Review', value: apps.filter(a => a.status === 'pending').length, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'Reviewing', value: apps.filter(a => a.status === 'reviewing').length, icon: 'chat', color: 'blue' })}
      ${statCard({ label: 'Visit Booked', value: apps.filter(a => a.status === 'visit_scheduled').length, icon: 'calendar', color: 'brand' })}
      ${statCard({ label: 'Visit Done', value: apps.filter(a => a.status === 'visit_confirmed').length, icon: 'check', color: 'gold' })}
      ${statCard({ label: 'Accepted', value: apps.filter(a => a.status === 'accepted').length, icon: 'check', color: 'brand' })}
    </div>

    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${filter==='all'?'active':''}" onclick="APP.params.appFilter='all'; APP.render()">All ${apps.length}</button>
      <button class="chip ${filter==='pending'?'active':''}" onclick="APP.params.appFilter='pending'; APP.render()">Pending</button>
      <button class="chip ${filter==='reviewing'?'active':''}" onclick="APP.params.appFilter='reviewing'; APP.render()">Reviewing</button>
      <button class="chip ${filter==='visit_scheduled'?'active':''}" onclick="APP.params.appFilter='visit_scheduled'; APP.render()">Visit Booked</button>
      <button class="chip ${filter==='visit_confirmed'?'active':''}" onclick="APP.params.appFilter='visit_confirmed'; APP.render()">Visit Done</button>
      <button class="chip ${filter==='accepted'?'active':''}" onclick="APP.params.appFilter='accepted'; APP.render()">Accepted</button>
      <button class="chip ${filter==='rejected'?'active':''}" onclick="APP.params.appFilter='rejected'; APP.render()">Rejected</button>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Applicant</th><th>Parent</th><th>Class</th><th>Applied</th><th>Documents</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${filtered.length === 0
            ? `<tr><td colspan="7" class="py-14 text-center">
                ${apps.length === 0
                  ? `<div class="space-y-2">
                      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">${icon('user','w-7 h-7')}</div>
                      <div class="font-semibold text-slate-700 text-base">No applications yet</div>
                      <div class="text-sm text-slate-500 max-w-sm mx-auto">Share your public admission link with prospective parents, or use <strong>New Application</strong> to enter a walk-in enquiry manually.</div>
                    </div>`
                  : `<div class="text-slate-500"><div class="font-semibold">No ${filter.replace('_', ' ')} applications</div><div class="text-xs mt-1">Switch the filter above to see other stages.</div></div>`
                }
              </td></tr>`
            : filtered.map(a => {
                const cls = DB.find('classes', a.requestedClass);
                const docsCount = Object.values(a.documents || {}).filter(Boolean).length;
                return `<tr class="cursor-pointer" onclick="viewApplication('${a.id}')">
                  <td><div class="flex items-center gap-2">${avatar(a.applicantName, 'sm')}<div><div class="font-medium text-sm">${a.applicantName}</div><div class="text-xs text-slate-500">${a.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(a.dob)} yrs</div></div></div></td>
                  <td class="text-sm">${a.parentName}<div class="text-xs text-slate-500">${a.parentPhone}</div></td>
                  <td>${cls ? cls.name : '—'}</td>
                  <td class="text-xs text-slate-500">${fdate(a.appliedAt, { relative: true })}</td>
                  <td><span class="badge ${docsCount >= 3 ? 'badge-success' : docsCount >= 1 ? 'badge-warn' : 'badge-danger'}">${docsCount}/4</span></td>
                  <td>${statusBadge(a.status)}</td>
                  <td><button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); viewApplication('${a.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
                </tr>`;
              }).join('')
          }
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

function newApplicationModal() {
  const classes = DB.get('classes').filter(c => !c.schoolId || c.schoolId === currentSchoolId());
  modal({
    title: 'New Admission Application',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline')} Use this for walk-in enquiries or phone calls. For online self-service, share your <strong>public admission link</strong>.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="input-label">Applicant Full Name *</label>
            <input id="na_name" class="input" placeholder="e.g. Chisom Okafor" />
          </div>
          <div>
            <label class="input-label">Date of Birth *</label>
            <input id="na_dob" type="date" class="input" />
          </div>
          <div>
            <label class="input-label">Gender *</label>
            <select id="na_gender" class="input">
              <option value="">— Select —</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div>
            <label class="input-label">Class Applying For *</label>
            <select id="na_class" class="input">
              <option value="">— Select class —</option>
              ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="input-label">Current / Previous School</label>
            <input id="na_school" class="input" placeholder="School name" />
          </div>
        </div>
        <div class="border-t border-slate-100 pt-3">
          <div class="text-xs uppercase text-slate-500 font-semibold mb-2">Parent / Guardian Details</div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">Parent Name *</label>
              <input id="na_pname" class="input" placeholder="Full name" />
            </div>
            <div>
              <label class="input-label">Phone *</label>
              <input id="na_pphone" class="input" placeholder="+234…" />
            </div>
            <div>
              <label class="input-label">Email</label>
              <input id="na_pemail" type="email" class="input" placeholder="parent@email.com" />
            </div>
            <div>
              <label class="input-label">Home Address</label>
              <input id="na_address" class="input" placeholder="Residential address" />
            </div>
          </div>
        </div>
        <div>
          <label class="input-label">Reason / Notes</label>
          <textarea id="na_reason" rows="2" class="input" placeholder="e.g. Transfer from another school, referral by parent…"></textarea>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewApplication()">${icon('check','w-4 h-4')} Submit Application</button>
    `
  });
}

function saveNewApplication() {
  const name    = ((document.getElementById('na_name')   || {}).value || '').trim();
  const dob     = (document.getElementById('na_dob')    || {}).value || '';
  const gender  = (document.getElementById('na_gender') || {}).value || '';
  const classId = (document.getElementById('na_class')  || {}).value || '';
  const pName   = ((document.getElementById('na_pname') || {}).value || '').trim();
  const pPhone  = ((document.getElementById('na_pphone')|| {}).value || '').trim();
  if (!name)   { toast('Applicant name is required', 'danger'); return; }
  if (!dob)    { toast('Date of birth is required', 'danger'); return; }
  if (!gender) { toast('Please select gender', 'danger'); return; }
  if (!classId){ toast('Please select a class', 'danger'); return; }
  if (!pName)  { toast('Parent name is required', 'danger'); return; }
  if (!pPhone) { toast('Parent phone is required', 'danger'); return; }
  DB.insert('admissionApplications', {
    id: uid('app'), schoolId: currentSchoolId(),
    applicantName: name, dob, gender, requestedClass: classId,
    currentSchool: ((document.getElementById('na_school')  || {}).value || '').trim(),
    parentName: pName, parentPhone: pPhone,
    parentEmail: ((document.getElementById('na_pemail')  || {}).value || '').trim(),
    address:    ((document.getElementById('na_address') || {}).value || '').trim(),
    reason:     ((document.getElementById('na_reason')  || {}).value || '').trim(),
    status: 'pending', appliedAt: now(), documents: {}, source: 'admin'
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'created_application', target: name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Application for ${name} created`, 'success');
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
    { key: 'photo',        label: 'Passport Photograph' },
    { key: 'others',       label: 'Others' }
  ];
  const statusOrder = ['pending', 'reviewing', 'visit_scheduled', 'visit_confirmed', 'accepted'];
  const statusLabels = { pending: 'Pending Review', reviewing: 'Under Review', visit_scheduled: 'Visit Booked', visit_confirmed: 'Visit Done', accepted: 'Accepted', rejected: 'Rejected' };
  const stepLabels  = { pending: 'Received', reviewing: 'Reviewing', visit_scheduled: 'Visit Booked', visit_confirmed: 'Visit Done', accepted: 'Enrolled' };
  const currentIdx  = a.status === 'rejected' ? -1 : statusOrder.indexOf(a.status);

  modal({
    title: 'Application — ' + a.applicantName,
    size: 'lg',
    body: `
      <div class="space-y-4">

        <!-- Header: name + status badge -->
        <div class="flex items-center gap-4 pb-3 border-b border-slate-100">
          ${avatar(a.applicantName, 'xl')}
          <div class="flex-1">
            <h2 class="text-lg font-bold text-slate-900">${a.applicantName}</h2>
            <p class="text-sm text-slate-500">${a.gender === 'M' ? 'Male' : 'Female'} · DOB ${fdate(a.dob, { long: true })} (${calcAge(a.dob)} yrs)</p>
            <span class="badge ${a.status === 'accepted' ? 'badge-success' : a.status === 'rejected' ? 'badge-danger' : a.status === 'visit_confirmed' ? 'badge-info' : 'badge-warn'} mt-1">${statusLabels[a.status] || a.status}</span>
          </div>
        </div>

        <!-- Pipeline progress (hidden for rejected) -->
        ${a.status !== 'rejected' ? '<div class="relative flex items-start justify-between py-1">' +
            '<div class="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-100 z-0"></div>' +
            statusOrder.map((s, i) => {
              const done = i <= currentIdx, active = i === currentIdx;
              return '<div class="flex flex-col items-center gap-1 text-center flex-1 relative z-10">' +
                '<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ' + (done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400') + (active ? ' ring-2 ring-brand-300 ring-offset-1' : '') + '">' +
                (done ? icon('check','w-3.5 h-3.5') : String(i + 1)) +
                '</div><div class="text-xs leading-tight max-w-[3.5rem] ' + (active ? 'text-brand-700 font-semibold' : done ? 'text-slate-600' : 'text-slate-400') + '">' + stepLabels[s] + '</div></div>';
            }).join('') +
          '</div>'
        : '<div class="bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs text-rose-700 text-center font-semibold">This application has been rejected</div>'}

        <!-- What happens next (pending/reviewing only) -->
        ${a.status === 'pending' ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          <div class="font-semibold mb-0.5">${icon('bell','w-3.5 h-3.5 inline mr-1')} Next step: Review the application</div>
          Click <strong>Review</strong> to log notes and mark it as actively considered. Once reviewing, you can <strong>Schedule a Visit</strong> or go straight to <strong>Accept &amp; Enrol</strong> if the family walked in.
        </div>` : ''}
        ${a.status === 'reviewing' ? `<div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <div class="font-semibold mb-0.5">${icon('calendar','w-3.5 h-3.5 inline mr-1')} Next step: Schedule a school visit</div>
          Use <strong>Schedule Visit</strong> to pick a date and notify the parent. After the family visits, click <strong>Mark Visit Done</strong> — this unlocks the fee preview in the parent portal. You can also <strong>Accept &amp; Enrol</strong> directly without a visit.
        </div>` : ''}
        ${a.status === 'visit_scheduled' ? `<div class="bg-brand-50 border border-brand-200 rounded-xl p-3 text-sm text-brand-900">
          <div class="font-semibold mb-0.5">${icon('check','w-3.5 h-3.5 inline mr-1')} Waiting for the visit to happen</div>
          Once the family comes in, click <strong>Mark Visit Done</strong>. This confirms the visit, creates a parent account (if they don't have one), and unlocks the fee preview for them.
        </div>` : ''}
        ${a.status === 'visit_confirmed' ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          <div class="font-semibold mb-0.5">${icon('check','w-3.5 h-3.5 inline mr-1')} Visit done — ready to enrol</div>
          The parent can now see the fee structure in their portal. Click <strong>Accept &amp; Enrol</strong> to create the student record, assign an admission number, and auto-generate the first invoice.
        </div>` : ''}

        <!-- Details grid -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Requested Class</div><div>${cls ? cls.name : '—'}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Current School</div><div>${a.currentSchool || '—'}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Name</div><div>${a.parentName}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Phone</div><div>${a.parentPhone}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Parent Email</div><div>${a.parentEmail || '—'}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Home Address</div><div>${a.location || a.address || '—'}</div></div>
        </div>

        ${a.reviewNotes ? `<div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div class="text-xs uppercase text-blue-600 font-semibold mb-1">Review Notes</div>
          <div class="text-sm text-blue-900">${a.reviewNotes}</div>
          ${a.reviewedAt ? `<div class="text-xs text-blue-500 mt-1">Noted ${fdate(a.reviewedAt, { relative: true })}</div>` : ''}
        </div>` : ''}
        ${a.status === 'rejected' && a.rejectionReason ? `<div class="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <div class="text-xs uppercase text-rose-600 font-semibold mb-1">Rejection Reason</div>
          <div class="text-sm text-rose-900">${a.rejectionReason}</div>
          ${a.decidedAt ? `<div class="text-xs text-rose-400 mt-1">Decided ${fdate(a.decidedAt, { relative: true })}</div>` : ''}
        </div>` : ''}

        ${(a.visitDate || a.visitConfirmed) ? `<div class="rounded-xl p-3 border ${a.visitConfirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-brand-50 border-brand-200'}">
          <div class="text-xs uppercase font-semibold mb-1 flex items-center gap-1.5 ${a.visitConfirmed ? 'text-emerald-600' : 'text-brand-600'}">
            ${icon('calendar','w-3.5 h-3.5')} School Visit — ${a.visitConfirmed ? 'Completed' : 'Scheduled'}
          </div>
          ${a.visitDate ? `<div class="text-sm font-semibold text-slate-900">${fdate(a.visitDate, { long: true })}${a.visitTime ? ' at ' + a.visitTime : ''}</div>` : ''}
          ${a.visitNotes ? `<div class="text-xs text-slate-600 mt-0.5">${a.visitNotes}</div>` : ''}
          ${a.visitCompletionNotes ? `<div class="text-xs text-emerald-700 mt-0.5 italic">${a.visitCompletionNotes}</div>` : ''}
          ${a.visitConfirmedAt ? `<div class="text-xs text-emerald-500 mt-1">Confirmed ${fdate(a.visitConfirmedAt, { relative: true })}</div>` : ''}
        </div>` : ''}

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
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
      ${a.status === 'pending' ? `<button class="btn btn-secondary" onclick="reviewApplicationModal('${a.id}')">${icon('search','w-4 h-4')} Review</button>` : ''}
      ${a.status === 'pending' ? `<button class="btn btn-gold" onclick="scheduleVisitModal('${a.id}')">${icon('calendar','w-4 h-4')} Schedule Visit</button>` : ''}
      ${a.status === 'reviewing' ? `<button class="btn btn-secondary" onclick="reviewApplicationModal('${a.id}')">${icon('search','w-4 h-4')} Update Review</button>` : ''}
      ${a.status === 'reviewing' ? `<button class="btn btn-gold" onclick="scheduleVisitModal('${a.id}')">${icon('calendar','w-4 h-4')} Schedule Visit</button>` : ''}
      ${a.status === 'visit_scheduled' ? `<button class="btn btn-gold" onclick="scheduleVisitModal('${a.id}')">${icon('calendar','w-4 h-4')} Reschedule</button>` : ''}
      ${a.status === 'visit_scheduled' ? `<button class="btn btn-secondary" onclick="markVisitCompleteModal('${a.id}')">${icon('check','w-4 h-4')} Mark Visit Done</button>` : ''}
      ${a.status !== 'rejected' && a.status !== 'accepted' ? `<button class="btn btn-danger" onclick="rejectApplicationModal('${a.id}')">Reject</button>` : ''}
      ${(a.status === 'visit_confirmed' || a.status === 'reviewing' || a.status === 'visit_scheduled' || a.status === 'pending') ? `<button class="btn btn-primary" onclick="acceptApplication('${a.id}')">${icon('check','w-4 h-4')} Accept &amp; Enrol</button>` : ''}
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click(); viewApplication('${appId}')">← Back to application</button>
             <button class="btn btn-primary" onclick="toast('Download started','success')">${icon('download','w-4 h-4')} Download</button>`
  }), 50);
}

function reviewApplicationModal(appId) {
  const a = DB.find('admissionApplications', appId);
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Review Application — ' + a.applicantName,
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Mark this application as under review and record notes. The application remains visible to your team but is clearly flagged as being actively reviewed.
        </div>
        <div>
          <label class="input-label">Review Notes (optional)</label>
          <textarea id="rev_notes" rows="3" class="input" placeholder="e.g. Awaiting last term report card from parent, scheduled school visit on Friday...">${a.reviewNotes || ''}</textarea>
        </div>
        <div>
          <label class="input-label">Follow-up Action</label>
          <select id="rev_followup" class="input">
            <option value="">— None —</option>
            <option value="request_docs">Request additional documents</option>
            <option value="schedule_visit">Schedule school visit</option>
            <option value="interview">Arrange interview</option>
            <option value="contact_school">Contact previous school</option>
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmReview('${appId}')">${icon('search','w-4 h-4')} Save Review</button>`
  }), 50);
}

function confirmReview(appId) {
  const notes = document.getElementById('rev_notes').value.trim();
  const followup = document.getElementById('rev_followup').value;
  DB.update('admissionApplications', appId, { status: 'reviewing', reviewNotes: notes, reviewFollowup: followup, reviewedAt: now(), reviewedBy: AUTH.current.id });
  const a = DB.find('admissionApplications', appId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'reviewing_application', target: a.applicantName + (followup ? ` (${followup})` : ''), timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${a.applicantName} — marked as Reviewing`);
}

function setAppStatus(appId, status) {
  DB.update('admissionApplications', appId, { status, decidedAt: now() });
  const a = DB.find('admissionApplications', appId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: status === 'rejected' ? 'rejected_application' : 'updated_application', target: a.applicantName, timestamp: now() });
  toast(`Application ${status}`);
  APP.render();
  document.getElementById('modalBackdrop')?.click();
}

function rejectApplicationModal(appId) {
  const a = DB.find('admissionApplications', appId);
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Reject Application — ' + a.applicantName,
    body: `
      <div class="space-y-3">
        <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
          ${icon('x_circle','w-4 h-4 inline')} This will mark the application as <strong>rejected</strong>.
          If the parent has a portal account, they will receive a notification.
        </div>
        <div>
          <label class="input-label">Reason (optional — visible to parent)</label>
          <textarea id="rej_reason" rows="3" class="input" placeholder="e.g. No vacancy in the requested class for this term. The family is welcome to reapply next session."></textarea>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmRejectApplication('${appId}')">${icon('x','w-4 h-4')} Confirm Rejection</button>
    `
  }), 50);
}

function confirmRejectApplication(appId) {
  const reason = ((document.getElementById('rej_reason') || {}).value || '').trim();
  DB.update('admissionApplications', appId, { status: 'rejected', rejectionReason: reason, decidedAt: now(), decidedBy: AUTH.current.id });
  const a = DB.find('admissionApplications', appId);
  const parent = DB.query('parents', p => p.phone === a.parentPhone)[0];
  if (parent) {
    DB.insert('notifications', {
      id: uid('not'), userId: parent.id,
      title: `Admission Update — ${a.applicantName}`,
      body: `Thank you for your interest in our school. After careful review, we are unable to offer a place to ${a.applicantName} at this time.${reason ? ' ' + reason : ''} Please contact the admissions office if you have any questions.`,
      type: 'danger', read: false, timestamp: now()
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'rejected_application', target: a.applicantName + (reason ? ' — ' + reason.slice(0, 60) : ''), timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Application rejected`);
}

function scheduleVisitModal(appId) {
  const a = DB.find('admissionApplications', appId);
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Schedule School Visit — ' + a.applicantName,
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 border border-brand-200 rounded-xl p-3 text-sm text-brand-900">
          Schedule a visit for <strong>${a.parentName}</strong> to bring <strong>${a.applicantName}</strong> to school.
          Fee information will only be revealed to the parent <strong>after</strong> the visit is confirmed as complete.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Visit Date <span class="text-red-500">*</span></label>
            <input type="date" id="vis_date" class="input" value="${a.visitDate || ''}" min="${today()}">
          </div>
          <div>
            <label class="input-label">Preferred Time</label>
            <input type="time" id="vis_time" class="input" value="${a.visitTime || '10:00'}">
          </div>
        </div>
        <div>
          <label class="input-label">Instructions for Parent (optional)</label>
          <textarea id="vis_notes" rows="2" class="input" placeholder="e.g. Please bring last term's report card and the child's birth certificate…">${a.visitNotes || ''}</textarea>
        </div>
        <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          ${icon('bell','w-4 h-4 flex-shrink-0 mt-0.5')}
          <span>A notification will be sent to the parent with visit details. Fees remain hidden until you mark the visit as done.</span>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-gold" onclick="confirmScheduleVisit('${appId}')">${icon('calendar','w-4 h-4')} Confirm Schedule</button>`
  }), 50);
}

function confirmScheduleVisit(appId) {
  const date = document.getElementById('vis_date').value;
  if (!date) { toast('Please select a visit date', 'error'); return; }
  const time = document.getElementById('vis_time').value;
  const notes = document.getElementById('vis_notes').value.trim();
  DB.update('admissionApplications', appId, {
    status: 'visit_scheduled',
    visitDate: date, visitTime: time, visitNotes: notes,
    visitScheduledAt: now(), visitScheduledBy: AUTH.current.id
  });
  const a = DB.find('admissionApplications', appId);
  const parent = DB.query('parents', p => p.phone === a.parentPhone)[0];
  if (parent) {
    DB.insert('notifications', {
      id: uid('not'), userId: parent.id,
      title: 'School Visit Scheduled',
      body: `Your visit for ${a.applicantName} is booked for ${fdate(date, { long: true })}${time ? ' at ' + time : ''}.${notes ? ' Note: ' + notes : ''} Fee details will be shared after your visit.`,
      type: 'info', read: false, timestamp: now(),
      link: { view: 'par_fees' }
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'scheduled_visit', target: `${a.applicantName} — ${fdate(date, { long: true })}`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Visit scheduled for ${fdate(date, { long: true })}`);
}

function markVisitCompleteModal(appId) {
  const a = DB.find('admissionApplications', appId);
  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Confirm Visit Attended — ' + a.applicantName,
    body: `
      <div class="space-y-3">
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          <div class="font-semibold mb-0.5">${icon('check','w-4 h-4 inline')} Confirm ${a.applicantName} visited the school</div>
          <div class="text-xs text-emerald-700">After confirmation the parent will gain access to fee information for their child's class.</div>
        </div>
        ${a.visitDate ? `<div class="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-sm">
          <span class="text-brand-600">${icon('calendar','w-4 h-4')}</span>
          <div><span class="font-semibold">Scheduled:</span> ${fdate(a.visitDate, { long: true })}${a.visitTime ? ' at ' + a.visitTime : ''}</div>
        </div>` : ''}
        <div>
          <label class="input-label">Visit Notes (optional)</label>
          <textarea id="vc_notes" rows="2" class="input" placeholder="e.g. Child participated well in assessment. Parent asked questions about transport..."></textarea>
        </div>
        <div class="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
          ${icon('bell','w-4 h-4 flex-shrink-0 mt-0.5')}
          <span>If the parent has no portal account yet, one will be created and login credentials sent to them so they can view fees.</span>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmVisitComplete('${appId}')">${icon('check','w-4 h-4')} Confirm Visit Done</button>`
  }), 50);
}

function confirmVisitComplete(appId) {
  const visitNotes = document.getElementById('vc_notes').value.trim();
  const a = DB.find('admissionApplications', appId);
  let parent = DB.query('parents', p => p.phone === a.parentPhone)[0];
  const isNewParent = !parent;
  let tempPassword = null;
  if (!parent) {
    tempPassword = 'Caspaa' + Math.floor(Math.random() * 9000 + 1000);
    parent = {
      id: uid('par'), schoolId: currentSchoolId(),
      name: a.parentName, phone: a.parentPhone, email: a.parentEmail || '',
      occupation: '—', monthlyIncome: 0, address: a.location || a.address || '',
      credentials: { username: a.parentPhone, tempPassword, createdAt: now() },
      firstLogin: true, prospectApplicationId: appId
    };
    DB.insert('parents', parent);
  }
  DB.update('admissionApplications', appId, {
    status: 'visit_confirmed', visitConfirmed: true,
    visitCompletionNotes: visitNotes,
    visitConfirmedAt: now(), visitConfirmedBy: AUTH.current.id,
    prospectParentId: parent.id
  });
  const school = DB.find('schools', currentSchoolId());
  DB.insert('notifications', {
    id: uid('not'), userId: parent.id,
    title: 'Visit Confirmed — Fees Now Visible',
    body: `Thank you for visiting ${school ? school.name : 'the school'} with ${a.applicantName}. The fee structure for your child's class is now available in your portal.${isNewParent ? ' Login with phone: ' + a.parentPhone + ' · Password: ' + tempPassword : ''}`,
    type: 'success', read: false, timestamp: now(),
    link: { view: 'par_fees' }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'confirmed_visit', target: a.applicantName, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Visit confirmed — ${a.applicantName}'s parent can now view fees${isNewParent ? ' · Credentials sent' : ''}`);
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
    const extraLines = (fs.extraItems || []).filter(i => i.name && i.amount > 0).map(i => ({ name: i.name, amount: i.amount }));
    const total = fs.tuition + fs.books + fs.uniform + fs.pta + extraLines.reduce((s, l) => s + l.amount, 0) + actLines2.reduce((s, l) => s + l.amount, 0);
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
        ...extraLines,
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
    body: `${a.applicantName} has been accepted. Admission number: ${admNo}. ${newInvoice ? 'Your first invoice for ' + money(newInvoice.total) + ' is ready.' : ''}`,
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
        ${newInvoice ? `<div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>Invoice for ${money(newInvoice.total)} auto-generated</span></div>` : `<div class="flex items-center gap-2"><span class="text-amber-600">${icon('bell','w-4 h-4')}</span><span>No fee structure for ${(DB.find('classes', a.requestedClass) || {}).name} yet — set one up</span></div>`}
        <div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span><span>Welcome notification sent to parent</span></div>
      </div>
      <p class="text-xs text-slate-500 text-center mt-3">What would you like to do next?</p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Done</button>
      ${isNewParent ? `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click(); showParentCredentialsModal(DB.find('parents','${parent.id}'), DB.find('students','${newStudent.id}'), ${newInvoice ? "DB.find('invoices','" + newInvoice.id + "')" : 'null'})">Send Login Credentials →</button>` : `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop')?.click(); viewStudent('${newStudent.id}')">View ${a.applicantName.split(' ')[0]}'s profile →</button>`}
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
      <div><label class="input-label">Treatment / Action</label><textarea id="sb_treatment" rows="2" class="input" placeholder="e.g. Paracetamol 500mg given, advised to rest"></textarea></div>
      <label class="flex items-center gap-2 text-sm"><input id="sb_referred" type="checkbox" /> Referred to hospital</label>
      <label class="flex items-center gap-2 text-sm"><input id="sb_notify" type="checkbox" checked /> Notify parent via WhatsApp</label>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
      <div><label class="input-label">Visitor Name</label><input id="vis_name" class="input" placeholder="e.g. Mrs. Amaka Okonkwo" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Phone</label><input id="vis_phone" class="input" placeholder="e.g. 0803 123 4567" /></div>
        <div><label class="input-label">Relation</label>
          <select id="vis_rel" class="input"><option>Parent</option><option>Vendor</option><option>Maintenance</option><option>Government Official</option><option>Visitor</option><option>Delivery</option></select>
        </div>
      </div>
      <div><label class="input-label">To See</label>
        <select id="vis_tosee" class="input"><option>Mr. Olusegun Adebayo (Proprietor)</option>${teachers.map(t => `<option>${t.name}</option>`).join('')}</select>
      </div>
      <div><label class="input-label">Purpose</label><input id="vis_purpose" class="input" placeholder="e.g. Collect report card" /></div>
      <div><label class="input-label">Vehicle (or "Foot")</label><input id="vis_vehicle" class="input" placeholder="e.g. Toyota Camry LSD-241-AB" /></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
      <div><label class="input-label">Title</label><input id="bk_title" class="input" placeholder="e.g. New General Mathematics JSS1" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Author</label><input id="bk_author" class="input" placeholder="e.g. M.F. Macrae" /></div>
        <div><label class="input-label">ISBN</label><input id="bk_isbn" class="input" placeholder="e.g. 978-0-582-60324-0" /></div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div><label class="input-label">Category</label>
          <select id="bk_category" class="input"><option>Fiction</option><option>Reference</option><option>Maths</option><option>Science</option><option>Languages</option><option>History</option><option>Other</option></select>
        </div>
        <div><label class="input-label">Copies</label><input id="bk_copies" type="number" class="input" value="1" /></div>
        <div><label class="input-label">Location</label><input id="bk_location" class="input" placeholder="Shelf A-01" /></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
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
  document.getElementById('modalBackdrop')?.click();
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

/* ============================================================
   REPORT CENTER  —  _renderPrintCenter()
   Every report available to school owners, no jargon.
   Rendered as the "Print & Export" tab inside view_adm_reports().
   ============================================================ */

function _renderPrintCenter() {
  const card = ({ title, desc, onPrint, onCsv }) => `
    <div class="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div class="flex-1">
        <div class="font-bold text-slate-900 mb-1">${title}</div>
        <p class="text-xs text-slate-500 leading-relaxed">${desc}</p>
      </div>
      <div class="space-y-2">
        <button class="btn btn-primary w-full !text-sm" onclick="${onPrint}">${icon('download','w-4 h-4')} Print / Save as PDF</button>
        ${onCsv ? `<button class="btn btn-secondary w-full !text-xs" onclick="${onCsv}">${icon('download','w-3 h-3')} Download Spreadsheet (.csv)</button>` : ''}
      </div>
    </div>`;

  const section = (label, iconKey, color, cards) => `
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-lg bg-${color}-100 text-${color}-700 flex items-center justify-center">${icon(iconKey,'w-4 h-4')}</div>
        <h3 class="font-bold text-slate-900">${label}</h3>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${cards}</div>
    </div>`;

  return `
    <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900 mb-5 flex items-start gap-3">
      ${icon('reports','w-5 h-5 flex-shrink-0 mt-0.5')}
      <span>Click <strong>Print / Save as PDF</strong> on any report to open a formatted, ready-to-print document you can save, share or file. <strong>Download Spreadsheet</strong> gives you an Excel-compatible file for those who want to work with the numbers.</span>
    </div>

    ${section('Student Reports', 'students', 'brand', `
      ${card({ title: 'Full Student Register', desc: 'All active students with their class, admission number, date of birth, parent name and contact number.', onPrint: 'rpt_studentRegister()', onCsv: 'rpt_studentRegisterCSV()' })}
      ${card({ title: 'Outstanding Fees', desc: 'Students who have not fully paid their fees this term — with the exact amount each person still owes, sorted from highest to lowest.', onPrint: 'rpt_outstandingFees()', onCsv: 'rpt_outstandingFeesCSV()' })}
      ${card({ title: 'Attendance Summary', desc: 'Each student\'s days present, absent and late this term with their overall attendance percentage.', onPrint: 'rpt_attendanceSummary()', onCsv: 'rpt_attendanceSummaryCSV()' })}
      ${card({ title: 'New Admissions This Term', desc: 'Students who joined the school during the current term, with their class and parent contact details.', onPrint: 'rpt_newAdmissions()' })}
    `)}

    ${section('Finance Reports', 'fees', 'emerald', `
      ${card({ title: 'Fee Collection Report', desc: 'Class-by-class breakdown showing what each student was billed, how much has been paid, and what is still outstanding.', onPrint: 'rpt_feeCollection()', onCsv: 'rpt_feeCollectionCSV()' })}
      ${card({ title: 'Income & Expenses Summary', desc: 'Total money received this term minus all recorded costs (salaries, electricity, maintenance, etc.) — shows your net profit or loss.', onPrint: 'rpt_incomeExpenses()' })}
      ${card({ title: 'All Payments Received', desc: 'Every payment made by parents this term — student name, amount paid, date, and how the payment was made.', onPrint: 'rpt_paymentsLog()', onCsv: 'rpt_paymentsLogCSV()' })}
      ${card({ title: 'Expense Record', desc: 'All costs recorded this term — salaries, electricity, diesel, maintenance, supplies, internet, security and more.', onPrint: 'rpt_expenseRecord()', onCsv: 'rpt_expenseRecordCSV()' })}
    `)}

    ${section('Staff Reports', 'teacher', 'purple', `
      ${card({ title: 'Staff Directory', desc: 'All teaching and non-teaching staff with their department, subjects, phone number and date of employment.', onPrint: 'rpt_staffDirectory()', onCsv: 'rpt_staffDirectoryCSV()' })}
      ${card({ title: 'Payroll Summary', desc: 'Staff salaries from the latest payroll run — gross pay, tax (PAYE), pension deducted, and net take-home for each person.', onPrint: 'rpt_payrollSummary()', onCsv: 'rpt_payrollSummaryCSV()' })}
    `)}

    ${section('Academic Reports', 'classes', 'sky', `
      ${card({ title: 'Academic Results Summary', desc: 'School-wide average scores per class and per subject. Quickly see which classes or subjects need more attention.', onPrint: 'rpt_academicSummary()' })}
      ${card({ title: 'Class Broadsheet', desc: 'Full result table for a class — every student\'s score in every subject with totals and grades. Ready to print and present.', onPrint: 'rpt_broadsheetSelectModal()' })}
    `)}
  `;
}

/* ── Shared letterhead ─────────────────────────────────────── */
function _rptHead(title, subtitle) {
  const sc = DB.find('schools', currentSchoolId()) || {};
  const term = DB.settings().currentTerm || '';
  const date = new Date().toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' });
  return `
    <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:28px">
      <h1 style="margin:0 0 4px;font-size:22px;color:#047857;letter-spacing:.5px">${(sc.name||'School').toUpperCase()}</h1>
      ${sc.address ? `<p style="margin:2px 0;color:#555;font-size:12px">${sc.address}</p>` : ''}
      ${sc.phone ? `<p style="margin:2px 0;color:#555;font-size:12px">Tel: ${sc.phone}</p>` : ''}
      <h2 style="margin:16px 0 4px;font-size:18px;font-weight:700">${title}</h2>
      ${subtitle ? `<p style="margin:2px 0;color:#555;font-size:13px">${subtitle}</p>` : ''}
      <p style="margin:6px 0 0;color:#999;font-size:11px">Generated: ${date} &nbsp;|&nbsp; ${term}</p>
    </div>`;
}

function _rptSign() {
  return `<div style="margin-top:48px;display:flex;justify-content:space-between;font-size:12px;color:#555">
    <div>________________________________<br>Head Teacher / Principal<br><span style="font-size:10px;color:#999">Name &amp; Signature</span></div>
    <div style="text-align:right">________________________________<br>School Stamp<br><span style="font-size:10px;color:#999">Official Stamp</span></div>
  </div>`;
}

/* ── STUDENT REPORTS ───────────────────────────────────────── */
function rpt_studentRegister() {
  const sid = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === sid && s.status === 'active')
    .sort((a,b) => a.classId.localeCompare(b.classId) || a.name.localeCompare(b.name));
  const classes = DB.get('classes');
  const parents = DB.get('parents');
  const rows = students.map((s,i) => {
    const cls = classes.find(c => c.id === s.classId);
    const par = parents.find(p => p.id === s.parentId);
    return `<tr>
      <td>${i+1}</td><td><strong>${s.name}</strong></td><td>${cls ? cls.name : '—'}</td>
      <td>${s.admissionNo}</td><td>${s.gender}</td><td>${fdate(s.dob,{long:true})}</td>
      <td>${par ? par.name : '—'}</td><td>${par ? par.phone : '—'}</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Full Student Register', `${students.length} active students`)}
    <table><thead><tr><th>#</th><th>Full Name</th><th>Class</th><th>Admission No.</th><th>Sex</th><th>Date of Birth</th><th>Parent / Guardian</th><th>Phone</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="8">Total active students: <strong>${students.length}</strong></td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_studentRegisterCSV() {
  const sid = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === sid && s.status === 'active');
  const classes = DB.get('classes'); const parents = DB.get('parents');
  downloadCSV('student-register.csv',
    ['Name','Class','Admission No','Gender','Date of Birth','Parent Name','Parent Phone','Status'],
    students.map(s => {
      const cls = classes.find(c=>c.id===s.classId); const par = parents.find(p=>p.id===s.parentId);
      return [s.name, cls?cls.name:'', s.admissionNo, s.gender, s.dob, par?par.name:'', par?par.phone:'', s.status];
    })
  );
}

function rpt_outstandingFees() {
  const sid = currentSchoolId();
  const invoices = DB.query('invoices', i => i.schoolId === sid && i.balance > 0)
    .sort((a,b) => b.balance - a.balance);
  const classes = DB.get('classes');
  let total = 0;
  const rows = invoices.map((inv,i) => {
    const s = DB.find('students', inv.studentId);
    const cls = s ? classes.find(c=>c.id===s.classId) : null;
    total += inv.balance;
    return `<tr>
      <td>${i+1}</td><td><strong>${s ? s.name : '—'}</strong></td><td>${cls ? cls.name : '—'}</td>
      <td style="text-align:right">${money(inv.total)}</td>
      <td style="text-align:right;color:#16a34a">${money(inv.paid)}</td>
      <td style="text-align:right;color:#dc2626;font-weight:700">${money(inv.balance)}</td>
      <td>${fdate(inv.dueDate,{long:true})}</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Outstanding Fees Report', `${invoices.length} students with unpaid balances`)}
    <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th style="text-align:right">Billed</th><th style="text-align:right">Paid</th><th style="text-align:right">Outstanding</th><th>Due Date</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5" style="text-align:right">Total Outstanding:</td><td style="text-align:right;color:#dc2626"><strong>${money(total)}</strong></td><td></td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_outstandingFeesCSV() {
  const sid = currentSchoolId();
  const invoices = DB.query('invoices', i => i.schoolId === sid && i.balance > 0).sort((a,b)=>b.balance-a.balance);
  const classes = DB.get('classes');
  downloadCSV('outstanding-fees.csv',
    ['Student','Class','Total Billed','Amount Paid','Amount Outstanding','Due Date'],
    invoices.map(inv => {
      const s = DB.find('students', inv.studentId);
      const cls = s ? classes.find(c=>c.id===s.classId) : null;
      return [s?s.name:'', cls?cls.name:'', inv.total, inv.paid, inv.balance, inv.dueDate];
    })
  );
}

function rpt_attendanceSummary() {
  const sid = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === sid && s.status === 'active')
    .sort((a,b) => a.classId.localeCompare(b.classId) || a.name.localeCompare(b.name));
  const classes = DB.get('classes');
  const rows = students.map((s,i) => {
    const att = COMPUTE.studentAttendance(s.id);
    const present = att.filter(a=>a.status==='present').length;
    const absent  = att.filter(a=>a.status==='absent').length;
    const late    = att.filter(a=>a.status==='late').length;
    const total   = att.length;
    const rate    = total > 0 ? Math.round((present+late)/total*100) : 0;
    const cls = classes.find(c=>c.id===s.classId);
    const rColor = rate >= 90 ? '#16a34a' : rate >= 75 ? '#d97706' : '#dc2626';
    return `<tr>
      <td>${i+1}</td><td><strong>${s.name}</strong></td><td>${cls?cls.name:'—'}</td>
      <td style="text-align:right;color:#16a34a">${present}</td>
      <td style="text-align:right;color:#dc2626">${absent}</td>
      <td style="text-align:right;color:#d97706">${late}</td>
      <td style="text-align:right">${total}</td>
      <td style="text-align:right;font-weight:700;color:${rColor}">${rate}%</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Attendance Summary', `${students.length} students · ${DB.settings().currentTerm}`)}
    <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th style="text-align:right">Present</th><th style="text-align:right">Absent</th><th style="text-align:right">Late</th><th style="text-align:right">Days Recorded</th><th style="text-align:right">Attendance %</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${_rptSign()}
  `);
}

function rpt_attendanceSummaryCSV() {
  const sid = currentSchoolId();
  const students = DB.query('students', s => s.schoolId === sid && s.status === 'active');
  const classes = DB.get('classes');
  downloadCSV('attendance-summary.csv',
    ['Student','Class','Present','Absent','Late','Total Days','Attendance %'],
    students.map(s => {
      const att = COMPUTE.studentAttendance(s.id);
      const present = att.filter(a=>a.status==='present').length;
      const absent  = att.filter(a=>a.status==='absent').length;
      const late    = att.filter(a=>a.status==='late').length;
      const total   = att.length;
      const rate    = total > 0 ? Math.round((present+late)/total*100) : 0;
      const cls = classes.find(c=>c.id===s.classId);
      return [s.name, cls?cls.name:'', present, absent, late, total, rate+'%'];
    })
  );
}

function rpt_newAdmissions() {
  const sid = currentSchoolId();
  const cutoff = daysAgo(120);
  const students = DB.query('students', s => s.schoolId === sid && s.admissionDate >= cutoff)
    .filter(s => s.status !== 'alumni')
    .sort((a,b) => b.admissionDate.localeCompare(a.admissionDate));
  const classes = DB.get('classes'); const parents = DB.get('parents');
  const rows = students.map((s,i) => {
    const cls = classes.find(c=>c.id===s.classId);
    const par = parents.find(p=>p.id===s.parentId);
    return `<tr>
      <td>${i+1}</td><td><strong>${s.name}</strong></td><td>${cls?cls.name:'—'}</td>
      <td>${s.admissionNo}</td><td>${fdate(s.admissionDate,{long:true})}</td>
      <td>${par?par.name:'—'}</td><td>${par?par.phone:'—'}</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('New Admissions', `${students.length} students admitted recently`)}
    <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th>Admission No.</th><th>Date Admitted</th><th>Parent</th><th>Phone</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="7">Total new admissions: <strong>${students.length}</strong></td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

/* ── FINANCE REPORTS ───────────────────────────────────────── */
function rpt_feeCollection() {
  const sid = currentSchoolId();
  const invoices = DB.query('invoices', i => i.schoolId === sid);
  const classes = DB.get('classes');
  const grouped = {};
  invoices.forEach(inv => {
    const s = DB.find('students', inv.studentId); if (!s) return;
    const cName = (classes.find(c=>c.id===s.classId)||{}).name || '—';
    if (!grouped[cName]) grouped[cName] = [];
    grouped[cName].push({ ...inv, studentName: s.name });
  });
  let totalBilled=0, totalPaid=0, totalOwe=0;
  const body = Object.keys(grouped).sort().map(cls => {
    const list = grouped[cls].sort((a,b)=>b.balance-a.balance);
    const clsBilled = list.reduce((s,i)=>s+i.total,0);
    const clsPaid   = list.reduce((s,i)=>s+i.paid,0);
    const clsOwe    = list.reduce((s,i)=>s+i.balance,0);
    totalBilled+=clsBilled; totalPaid+=clsPaid; totalOwe+=clsOwe;
    return `<tr style="background:#f0fdf4"><td colspan="5" style="font-weight:700;color:#166534">${cls} — ${list.length} student${list.length!==1?'s':''}</td><td style="text-align:right;font-weight:700">${money(clsBilled)}</td><td style="text-align:right;font-weight:700;color:#16a34a">${money(clsPaid)}</td><td style="text-align:right;font-weight:700;color:#dc2626">${money(clsOwe)}</td></tr>
    ${list.map((inv,i) => `<tr><td>${i+1}</td><td style="padding-left:16px">${inv.studentName}</td><td>${cls}</td><td>${fdate(inv.dueDate,{long:true})}</td><td style="text-align:center">${inv.status==='paid'?'✓ Paid':inv.status==='partial'?'Partial':'Outstanding'}</td><td style="text-align:right">${money(inv.total)}</td><td style="text-align:right;color:#16a34a">${money(inv.paid)}</td><td style="text-align:right;color:${inv.balance>0?'#dc2626':'#999'}">${inv.balance>0?money(inv.balance):'—'}</td></tr>`).join('')}`;
  }).join('');
  printElement(`
    ${_rptHead('Fee Collection Report', DB.settings().currentTerm)}
    <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th>Due Date</th><th>Status</th><th style="text-align:right">Billed</th><th style="text-align:right">Paid</th><th style="text-align:right">Outstanding</th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><td colspan="5" style="font-weight:700">SCHOOL TOTAL</td><td style="text-align:right">${money(totalBilled)}</td><td style="text-align:right;color:#16a34a">${money(totalPaid)}</td><td style="text-align:right;color:#dc2626">${money(totalOwe)}</td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_feeCollectionCSV() {
  const sid = currentSchoolId();
  const invoices = DB.query('invoices', i => i.schoolId === sid);
  const classes = DB.get('classes');
  downloadCSV('fee-collection.csv',
    ['Student','Class','Total Billed','Amount Paid','Outstanding','Status','Due Date'],
    invoices.map(inv => {
      const s = DB.find('students', inv.studentId);
      const cls = s ? (classes.find(c=>c.id===s.classId)||{}).name : '';
      return [s?s.name:'', cls, inv.total, inv.paid, inv.balance, inv.status, inv.dueDate];
    })
  );
}

function rpt_incomeExpenses() {
  const sid = currentSchoolId();
  const invoices = DB.query('invoices', i => i.schoolId === sid);
  const expenses = DB.query('expenses', e => e.schoolId === sid);
  const collected = invoices.reduce((s,i)=>s+i.paid,0);
  const billed    = invoices.reduce((s,i)=>s+i.total,0);
  const outstanding = invoices.reduce((s,i)=>s+i.balance,0);
  const expByCat = {};
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category]||0)+e.amount; });
  const totalExp = expenses.reduce((s,e)=>s+e.amount,0);
  const net = collected - totalExp;
  const expRows = Object.entries(expByCat).sort((a,b)=>b[1]-a[1])
    .map(([cat,amt]) => `<tr><td style="padding-left:20px">${cat}</td><td style="text-align:right;color:#dc2626">${money(amt)}</td></tr>`).join('');
  printElement(`
    ${_rptHead('Income & Expenses Summary', DB.settings().currentTerm)}
    <table>
      <tr style="background:#f0fdf4"><td colspan="2" style="font-weight:700;font-size:15px;color:#166534">INCOME</td></tr>
      <tr><td style="padding-left:20px">Total Fees Billed</td><td style="text-align:right">${money(billed)}</td></tr>
      <tr><td style="padding-left:20px">Amount Collected</td><td style="text-align:right;color:#16a34a;font-weight:700">${money(collected)}</td></tr>
      <tr><td style="padding-left:20px;color:#888">Still Outstanding</td><td style="text-align:right;color:#888">(${money(outstanding)} awaited)</td></tr>
      <tr><td colspan="2">&nbsp;</td></tr>
      <tr style="background:#fff5f5"><td colspan="2" style="font-weight:700;font-size:15px;color:#991b1b">EXPENSES</td></tr>
      ${expRows}
      <tr style="background:#f8fafc;font-weight:700"><td>Total Expenses</td><td style="text-align:right;color:#dc2626">${money(totalExp)}</td></tr>
      <tr><td colspan="2">&nbsp;</td></tr>
      <tr style="background:${net>=0?'#dcfce7':'#fee2e2'};font-size:16px;font-weight:700">
        <td>${net>=0?'NET PROFIT':'NET LOSS'}</td>
        <td style="text-align:right;color:${net>=0?'#15803d':'#dc2626'}">${money(Math.abs(net))}</td>
      </tr>
    </table>
    <p style="font-size:11px;color:#999;margin-top:16px">Note: Income figure shows cash collected, not total billed. ${money(outstanding)} in outstanding fees not yet included.</p>
    ${_rptSign()}
  `);
}

function rpt_paymentsLog() {
  const sid = currentSchoolId();
  const txns = DB.query('transactions', t => t.schoolId === sid && t.status === 'successful')
    .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  const total = txns.reduce((s,t)=>s+t.amount,0);
  const rows = txns.map((t,i) => {
    const s = DB.find('students', t.studentId);
    return `<tr>
      <td>${i+1}</td><td>${fdate(t.timestamp,{long:true})}</td>
      <td><strong>${s?s.name:'—'}</strong></td>
      <td style="text-align:right;color:#16a34a;font-weight:700">${money(t.amount)}</td>
      <td>${t.method}</td><td><code style="font-size:11px">${t.reference||'—'}</code></td>
      <td>${t.gateway||'—'}</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Payments Received', `${txns.length} transactions · ${DB.settings().currentTerm}`)}
    <table><thead><tr><th>#</th><th>Date</th><th>Student</th><th style="text-align:right">Amount</th><th>Method</th><th>Reference</th><th>Gateway</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">Total received:</td><td style="text-align:right"><strong>${money(total)}</strong></td><td colspan="3">&nbsp;</td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_paymentsLogCSV() {
  const sid = currentSchoolId();
  const txns = DB.query('transactions', t => t.schoolId === sid && t.status === 'successful')
    .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  downloadCSV('payments-received.csv',
    ['Date','Student','Amount','Method','Reference','Gateway'],
    txns.map(t => {
      const s = DB.find('students', t.studentId);
      return [fdate(t.timestamp,{long:true}), s?s.name:'', t.amount, t.method, t.reference||'', t.gateway||''];
    })
  );
}

function rpt_expenseRecord() {
  const sid = currentSchoolId();
  const expenses = DB.query('expenses', e => e.schoolId === sid).sort((a,b)=>b.date.localeCompare(a.date));
  const total = expenses.reduce((s,e)=>s+e.amount,0);
  const rows = expenses.map((e,i) => `<tr>
    <td>${i+1}</td><td>${fdate(e.date,{long:true})}</td>
    <td><strong>${e.category}</strong></td>
    <td>${e.description}</td>
    <td style="text-align:right;color:#dc2626;font-weight:700">${money(e.amount)}</td>
  </tr>`).join('');
  printElement(`
    ${_rptHead('Expense Record', `${expenses.length} entries · ${DB.settings().currentTerm}`)}
    <table><thead><tr><th>#</th><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right">Total Expenses:</td><td style="text-align:right"><strong>${money(total)}</strong></td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_expenseRecordCSV() {
  const sid = currentSchoolId();
  const expenses = DB.query('expenses', e => e.schoolId === sid).sort((a,b)=>b.date.localeCompare(a.date));
  downloadCSV('expense-record.csv',
    ['Date','Category','Description','Amount'],
    expenses.map(e => [e.date, e.category, e.description, e.amount])
  );
}

/* ── STAFF REPORTS ─────────────────────────────────────────── */
function rpt_staffDirectory() {
  const sid = currentSchoolId();
  const staff = DB.query('teachers', t => t.schoolId === sid).sort((a,b)=>a.name.localeCompare(b.name));
  const rows = staff.map((t,i) => `<tr>
    <td>${i+1}</td><td><strong>${t.name}</strong></td>
    <td>${t.staffType||'Academic'}</td>
    <td>${(t.subjects||[]).join(', ') || (t.department||'—')}</td>
    <td>${t.phone||'—'}</td>
    <td>${t.email||'—'}</td>
    <td>${t.hireDate ? fdate(t.hireDate,{long:true}) : '—'}</td>
    <td style="text-align:right;font-weight:700">${t.salary ? money(t.salary) : '—'}</td>
  </tr>`).join('');
  printElement(`
    ${_rptHead('Staff Directory', `${staff.length} staff members`)}
    <table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Subjects / Dept.</th><th>Phone</th><th>Email</th><th>Date Hired</th><th style="text-align:right">Monthly Salary</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="7">Total staff: <strong>${staff.length}</strong></td><td style="text-align:right">${money(staff.reduce((s,t)=>s+(t.salary||0),0))}/month</td></tr></tfoot></table>
    ${_rptSign()}
  `);
}

function rpt_staffDirectoryCSV() {
  const sid = currentSchoolId();
  const staff = DB.query('teachers', t => t.schoolId === sid);
  downloadCSV('staff-directory.csv',
    ['Name','Type','Phone','Email','Date Hired','Monthly Salary'],
    staff.map(t => [t.name, t.staffType||'Academic', t.phone||'', t.email||'', t.hireDate||'', t.salary||0])
  );
}

function rpt_payrollSummary() {
  const sid = currentSchoolId();
  const runs = DB.query('payrollRuns', r => r.schoolId === sid && r.stage === 'paid')
    .sort((a,b) => (b.paidAt||'').localeCompare(a.paidAt||''));
  const run = runs[0];
  if (!run) { toast('No paid payroll run found', 'warn'); return; }
  const payslips = DB.query('payslips', p => p.schoolId === sid && p.period === run.period);
  const rows = payslips.map((p,i) => {
    const t = DB.find('teachers', p.staffId);
    return `<tr>
      <td>${i+1}</td><td><strong>${t?t.name:'—'}</strong></td>
      <td style="text-align:right">${money(p.grossPay)}</td>
      <td style="text-align:right;color:#dc2626">−${money(p.deductions.paye)}</td>
      <td style="text-align:right;color:#dc2626">−${money(p.deductions.pension)}</td>
      <td style="text-align:right;font-weight:700;color:#15803d">${money(p.netPay)}</td>
      <td>${p.bankName||'—'} · ${p.bankAccount||'—'}</td>
    </tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Payroll Summary', `Period: ${run.period} · ${run.staffCount} staff`)}
    <table><thead><tr><th>#</th><th>Staff Member</th><th style="text-align:right">Gross Pay</th><th style="text-align:right">PAYE Tax</th><th style="text-align:right">Pension</th><th style="text-align:right">Net Pay</th><th>Bank Details</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="2">TOTALS</td><td style="text-align:right">${money(run.grossTotal)}</td><td style="text-align:right;color:#dc2626">−${money(run.payeTotal)}</td><td style="text-align:right;color:#dc2626">−${money(run.pensionTotal)}</td><td style="text-align:right;color:#15803d">${money(run.netTotal)}</td><td></td></tr>
    </tfoot></table>
    <p style="font-size:11px;color:#666;margin-top:12px">PAYE withheld: ${money(run.payeTotal)} ${run.taxRemitted?'(Remitted ✓)':'(Pending remittance)'}  ·  Pension: ${money(run.pensionTotal)} ${run.pensionRemitted?'(Remitted ✓)':'(Pending)'}</p>
    ${_rptSign()}
  `);
}

function rpt_payrollSummaryCSV() {
  const sid = currentSchoolId();
  const runs = DB.query('payrollRuns', r => r.schoolId === sid && r.stage === 'paid').sort((a,b)=>(b.paidAt||'').localeCompare(a.paidAt||''));
  const run = runs[0]; if (!run) { toast('No paid payroll run','warn'); return; }
  const payslips = DB.query('payslips', p => p.schoolId === sid && p.period === run.period);
  downloadCSV(`payroll-${run.period.replace(/\s/g,'-')}.csv`,
    ['Staff Name','Gross Pay','PAYE Tax','Pension','Net Pay','Bank','Account'],
    payslips.map(p => {
      const t = DB.find('teachers', p.staffId);
      return [t?t.name:'', p.grossPay, p.deductions.paye, p.deductions.pension, p.netPay, p.bankName||'', p.bankAccount||''];
    })
  );
}

/* ── ACADEMIC REPORTS ──────────────────────────────────────── */
function rpt_academicSummary() {
  const sid = currentSchoolId();
  const results = DB.query('results', r => r.schoolId === sid && r.approved);
  const classes  = DB.get('classes');
  const subjects = DB.get('subjects');
  const byClass = {};
  results.forEach(r => {
    if (!byClass[r.classId]) byClass[r.classId] = [];
    byClass[r.classId].push(r);
  });
  const rows = Object.keys(byClass).sort().map(cId => {
    const cls = classes.find(c=>c.id===cId);
    const recs = byClass[cId];
    const avg = recs.length ? Math.round(recs.reduce((s,r)=>s+r.total,0)/recs.length) : 0;
    const pass = recs.filter(r=>r.grade!=='F').length;
    const passRate = recs.length ? Math.round(pass/recs.length*100) : 0;
    const color = avg>=70?'#15803d':avg>=50?'#d97706':'#dc2626';
    return `<tr><td><strong>${cls?cls.name:cId}</strong></td>
      <td style="text-align:right">${[...new Set(recs.map(r=>r.studentId))].length}</td>
      <td style="text-align:right">${recs.length}</td>
      <td style="text-align:right;font-weight:700;color:${color}">${avg}/100</td>
      <td style="text-align:right">${passRate}%</td>
    </tr>`;
  }).join('');
  const subRows = subjects.map(sub => {
    const recs = results.filter(r=>r.subjectId===sub.id);
    if (!recs.length) return '';
    const avg = Math.round(recs.reduce((s,r)=>s+r.total,0)/recs.length);
    const color = avg>=70?'#15803d':avg>=50?'#d97706':'#dc2626';
    return `<tr><td><strong>${sub.name}</strong></td><td style="text-align:right">${recs.length}</td><td style="text-align:right;font-weight:700;color:${color}">${avg}/100</td></tr>`;
  }).join('');
  printElement(`
    ${_rptHead('Academic Results Summary', DB.settings().currentTerm)}
    <h3 style="margin-top:0;font-size:14px;color:#374151">Performance by Class</h3>
    <table><thead><tr><th>Class</th><th style="text-align:right">Students</th><th style="text-align:right">Entries</th><th style="text-align:right">Average Score</th><th style="text-align:right">Pass Rate</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <h3 style="margin-top:24px;font-size:14px;color:#374151">Performance by Subject</h3>
    <table><thead><tr><th>Subject</th><th style="text-align:right">Entries</th><th style="text-align:right">Average Score</th></tr></thead>
    <tbody>${subRows}</tbody></table>
    ${_rptSign()}
  `);
}

function rpt_broadsheetSelectModal() {
  const classes = DB.get('classes');
  modal({
    title: 'Choose a Class',
    body: `<div class="space-y-3">
      <p class="text-sm text-slate-600">Select the class you want to print a broadsheet for:</p>
      <select id="rpt_bs_class" class="input">
        ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="rpt_classBroadsheet(document.getElementById('rpt_bs_class').value); document.getElementById('modalBackdrop')?.click()">${icon('download','w-4 h-4')} Print Broadsheet</button>`
  });
}

function rpt_classBroadsheet(classId) {
  const sid = currentSchoolId();
  const cls = DB.find('classes', classId);
  const students = COMPUTE.studentsByClass(classId);
  const subjects = DB.get('subjects');
  const results  = DB.query('results', r => r.classId === classId && r.schoolId === sid);
  const cols = subjects.filter(sub => results.some(r=>r.subjectId===sub.id));
  const thead = `<tr><th>S/N</th><th>Student</th>${cols.map(s=>`<th style="text-align:right;font-size:11px">${s.name}</th>`).join('')}<th style="text-align:right">Total</th><th style="text-align:right">Avg</th><th>Grade</th></tr>`;
  const tbody = students.map((stu,i) => {
    const stuRes = results.filter(r=>r.studentId===stu.id);
    let grandTotal=0, count=0;
    const cells = cols.map(sub => {
      const r = stuRes.find(x=>x.subjectId===sub.id);
      if (r) { grandTotal+=r.total; count++; }
      return `<td style="text-align:right">${r ? r.total : '—'}</td>`;
    }).join('');
    const avg = count > 0 ? Math.round(grandTotal/count) : 0;
    const grade = avg>=75?'A':avg>=60?'B':avg>=50?'C':avg>=45?'D':avg>=40?'E':'F';
    const gColor = grade==='A'?'#15803d':grade==='F'?'#dc2626':'#374151';
    return `<tr><td>${i+1}</td><td><strong>${stu.name}</strong></td>${cells}<td style="text-align:right;font-weight:700">${grandTotal}</td><td style="text-align:right;font-weight:700;color:${gColor}">${avg}%</td><td style="font-weight:700;color:${gColor}">${grade}</td></tr>`;
  }).join('');
  printElement(`
    ${_rptHead(`${cls?cls.name:''} — Broadsheet`, `${students.length} students · ${cols.length} subjects · ${DB.settings().currentTerm}`)}
    <div style="overflow-x:auto"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>
    ${_rptSign()}
  `);
}
