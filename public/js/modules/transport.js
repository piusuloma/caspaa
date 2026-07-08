/* ============================================================
   TRANSPORT MODULE
   - Admin manages bus routes, student assignments, pickup authorizations
   - Parent views child's route and manages authorized pickup persons
   ============================================================ */

/* ──────────────────────────────────────────────────────────────
   ADMIN VIEWS
────────────────────────────────────────────────────────────── */

function view_adm_transport(params) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const tab = (params && params.tab) || APP.params.tab || 'routes';

  const routes      = DB.query('busRoutes',       r => r.schoolId === schoolId);
  const assignments = DB.query('busAssignments',  a => a.schoolId === schoolId);
  const pickups     = DB.query('authorizedPickups', p => p.schoolId === schoolId);
  const pendingCount = pickups.filter(p => p.status === 'pending').length;

  // Clock-out: students not yet dismissed today
  const todayDismissals = DB.query('studentDismissals', d => d.schoolId === schoolId && d.date === today());
  const activeStudents = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const notDismissed = activeStudents.filter(s => !todayDismissals.find(d => d.studentId === s.id)).length;

  const tabBar = `
    <div class="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
      ${[
        ['routes',     'Bus Routes',            ''],
        ['assign',     'Student Assignments',   ''],
        ['pickups',    'Pickup Authorizations', pendingCount ? `<span class="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">${pendingCount}</span>` : ''],
        ['dismissal',  'Dismissal Clock-Out',   notDismissed > 0 ? `<span class="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">${notDismissed}</span>` : ''],
        ['status',     'Bus Status',            '']
      ].map(([k, l, badge]) =>
        `<button onclick="APP.params.tab = '${k}'; APP.render();"
          class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          ${l}${badge || ''}
        </button>`
      ).join('')}
    </div>`;

  let content = '';
  if (tab === 'routes')    content = adm_renderRoutesTab(routes, schoolId);
  if (tab === 'assign')    content = adm_renderAssignmentsTab(assignments, schoolId);
  if (tab === 'pickups')   content = adm_renderPickupsTab(pickups, schoolId);
  if (tab === 'dismissal') content = adm_renderDismissalTab(schoolId, todayDismissals, activeStudents);
  if (tab === 'status')    content = adm_renderBusStatusTab(routes, schoolId);

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'Transport & Pickup Management',
        subtitle: `${routes.length} route${routes.length !== 1 ? 's' : ''} · ${assignments.length} student${assignments.length !== 1 ? 's' : ''} assigned`
      })}
      ${tabBar}
      ${content}
    </div>
  `;
}

/* ---------- Bus Routes tab ---------- */
function adm_renderRoutesTab(routes, schoolId) {
  if (routes.length === 0) {
    return `
      <div class="mb-4 flex justify-end">
        <button class="btn btn-primary" onclick="adm_addRouteModal()">${icon('plus','w-4 h-4')} Add Route</button>
      </div>
      ${emptyState({ icon: 'package', title: 'No bus routes yet', body: 'Add your first school bus route to get started.' })}
    `;
  }

  const allStaff = [
    ...DB.query('teachers', t => t.schoolId === schoolId),
    ...DB.query('staff',    s => s.schoolId === schoolId)
  ];

  const chartRows = routes.map((r, i) => {
    const count = DB.query('busAssignments', a => a.routeId === r.id && a.schoolId === schoolId).length;
    return { name: r.name, count, color: ['#fd7d71','#10b981','#f59e0b','#ef4444','#fd7d71','#ec4899','#fd5f54','#f97316'][i % 8] };
  }).filter(d => d.count > 0);

  const totalAssigned = chartRows.reduce((s, d) => s + d.count, 0);

  const chartSection = chartRows.length ? `
    <div class="card p-5 mt-4">
      <h3 class="font-bold text-slate-900 mb-4">Student Distribution by Route</h3>
      <div class="flex flex-col sm:flex-row items-center gap-8">
        <div style="width:200px;height:200px;flex-shrink:0"><canvas id="routeDistChart"></canvas></div>
        <div class="space-y-2 flex-1">
          ${chartRows.map(d => `
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${d.color}"></div>
              <span class="text-sm flex-1">${d.name}</span>
              <span class="text-sm font-bold">${d.count}</span>
              <span class="text-xs text-slate-400">${Math.round(d.count/totalAssigned*100)}%</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <script>
      (function() {
        setTimeout(function() {
          const el = document.getElementById('routeDistChart');
          if (!el || !window.Chart) return;
          if (el._chartInstance) el._chartInstance.destroy();
          el._chartInstance = new Chart(el, {
            type: 'pie',
            data: {
              labels: [${chartRows.map(d => `'${d.name}'`).join(',')}],
              datasets: [{ data: [${chartRows.map(d => d.count).join(',')}], backgroundColor: [${chartRows.map(d => `'${d.color}'`).join(',')}], borderWidth: 2, borderColor: '#fff' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }, 80);
      })();
    </script>` : '';

  return `
    <div class="mb-4 flex justify-end">
      <button class="btn btn-primary" onclick="adm_addRouteModal()">${icon('plus','w-4 h-4')} Add Route</button>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${routes.map(route => {
        const driver = allStaff.find(s => s.id === route.driverStaffId);
        const assignedCount = DB.query('busAssignments', a => a.routeId === route.id && a.schoolId === (AUTH.current.schoolId || 'sch_brightlights')).length;
        return `
          <div class="card p-5 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-bold text-slate-900 text-base leading-tight">${route.name}</h3>
                <div class="text-xs text-slate-400 mt-0.5">${route.vehiclePlate || 'No plate'} · ${route.area || 'House-to-house'}</div>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <button class="btn btn-ghost !p-1.5" title="Edit route" onclick="adm_editRouteModal('${route.id}')">${icon('edit','w-4 h-4')}</button>
                <button class="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50" title="Delete route" onclick="adm_deleteRoute('${route.id}')">${icon('trash','w-4 h-4')}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-50 rounded-xl p-2.5">
                <div class="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Driver</div>
                <div class="font-semibold text-slate-800">${driver ? driver.name : '<span class="text-slate-400">Unassigned</span>'}</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-2.5">
                <div class="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Students</div>
                <div class="font-semibold ${route.capacity && assignedCount >= route.capacity ? 'text-rose-600' : 'text-slate-800'}">
                  ${assignedCount} / ${route.capacity || '?'}${route.capacity && assignedCount >= route.capacity ? ' <span class="text-xs font-bold text-rose-600 ml-1">FULL</span>' : ''}
                </div>
              </div>
              <div class="bg-slate-50 rounded-xl p-2.5">
                <div class="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Departure</div>
                <div class="font-semibold text-slate-800">${route.departureTime || '—'}</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-2.5">
                <div class="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Return</div>
                <div class="font-semibold text-slate-800">${route.returnTime || '—'}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${chartSection}
  `;
}

/* ---------- Student Assignments tab ---------- */
function adm_renderAssignmentsTab(assignments, schoolId) {
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const routes   = DB.query('busRoutes', r => r.schoolId === schoolId);
  const assignedIds = new Set(assignments.map(a => a.studentId));
  const unassigned  = students.filter(s => !assignedIds.has(s.id));

  return `
    <div class="mb-4 flex justify-end">
      <button class="btn btn-primary" onclick="adm_assignStudentModal()">${icon('plus','w-4 h-4')} Assign Student</button>
    </div>

    ${assignments.length === 0 && unassigned.length === 0 ? emptyState({ icon: 'students', title: 'No students yet', body: 'Add students before assigning routes.' }) : ''}

    ${assignments.length > 0 ? `
      <div class="card overflow-hidden mb-4">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">Assigned Students (${assignments.length})</h3>
        </div>
        <table class="tbl">
          <thead><tr><th class="text-center">#</th><th>Student</th><th>Class</th><th>Route</th><th>Direction</th><th>Pickup Address</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            ${assignments.slice().sort((a,b) => (a.pickupOrder||999) - (b.pickupOrder||999)).map(a => {
              const student = DB.find('students', a.studentId);
              const cls     = student ? DB.find('classes', student.classId) : null;
              const route   = DB.find('busRoutes', a.routeId);
              const parent  = student && student.parentId ? DB.find('parents', student.parentId) : null;
              const addr    = a.pickupAddress || (parent ? parent.address : '') || '—';
              const dirLabel = { both: 'Both ways', pickup: 'Pickup only', dropoff: 'Drop-off only' }[a.direction] || a.direction;
              return `<tr>
                <td class="text-center font-bold text-slate-500 text-sm">${a.pickupOrder || '—'}</td>
                <td><div class="flex items-center gap-2">${avatar(student || { name: '?' }, 'sm')}<span class="font-semibold">${student ? student.name : '—'}</span></div></td>
                <td class="text-sm text-slate-500">${cls ? cls.name : '—'}</td>
                <td><span class="badge badge-info">${route ? route.name : '—'}</span></td>
                <td><span class="text-sm text-slate-600">${dirLabel}</span></td>
                <td class="text-sm text-slate-600 max-w-xs truncate">${addr}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn btn-ghost !p-1.5 text-brand-600 hover:bg-brand-50" title="Edit pickup order/address" onclick="adm_editAssignmentModal('${a.id}')">${icon('edit','w-4 h-4')}</button>
                  <button class="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50" title="Remove assignment" onclick="adm_removeAssignment('${a.id}')">${icon('trash','w-4 h-4')}</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${unassigned.length > 0 ? `
      <div class="card p-4 bg-amber-50">
        <div class="flex items-center gap-2 mb-2">
          <div class="text-amber-700">${icon('bell','w-4 h-4')}</div>
          <h4 class="font-semibold text-amber-900">${unassigned.length} student${unassigned.length !== 1 ? 's' : ''} not registered for school bus</h4>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${unassigned.slice(0, 12).map(s => `<span class="text-xs bg-white text-amber-800 px-2 py-0.5 rounded-full">${s.name}</span>`).join('')}
          ${unassigned.length > 12 ? `<span class="text-xs text-amber-700 px-2 py-0.5">+${unassigned.length - 12} more</span>` : ''}
        </div>
      </div>
    ` : ''}
  `;
}

/* ---------- Pickup Authorizations tab ---------- */
function adm_renderPickupsTab(pickups, schoolId) {
  const pending  = pickups.filter(p => p.status === 'pending');
  const approved = pickups.filter(p => p.status === 'approved');
  const denied   = pickups.filter(p => p.status === 'denied');

  return `
    <div class="space-y-6">
      ${pending.length > 0 ? `
        <div>
          <h3 class="font-bold text-slate-700 mb-3 flex items-center gap-2">
            ${icon('bell','w-4 h-4 text-amber-500')}
            Pending Requests (${pending.length})
          </h3>
          <div class="space-y-3">
            ${pending.map(p => {
              const student = DB.find('students', p.studentId);
              return `
                <div class="card p-4 border-l-4 border-amber-400 flex items-start justify-between gap-3 flex-wrap">
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-slate-900">${p.name}</div>
                    <div class="text-sm text-slate-500">${p.relationship} · ${p.phone}</div>
                    <div class="text-xs text-slate-400 mt-1">
                      For: <strong>${student ? student.name : '—'}</strong> · Submitted ${fdate(p.createdAt, { relative: true })}
                    </div>
                  </div>
                  <div class="flex gap-2 flex-shrink-0">
                    <button class="btn btn-primary !py-1.5 text-sm" onclick="adm_approvePickup('${p.id}')">${icon('check','w-3.5 h-3.5')} Approve</button>
                    <button class="btn btn-danger !py-1.5 text-sm" onclick="adm_denyPickup('${p.id}')">Deny</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div class="card p-4 bg-emerald-50 flex items-center gap-3">
          <div class="text-emerald-600">${icon('check','w-5 h-5')}</div>
          <p class="text-sm text-emerald-800 font-medium">No pending pickup authorisation requests.</p>
        </div>
      `}

      ${approved.length > 0 ? `
        <div>
          <h3 class="font-bold text-slate-700 mb-3">Approved Pickup Persons (${approved.length})</h3>
          <div class="card overflow-hidden">
            <table class="tbl">
              <thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Student</th><th>Approved</th><th class="text-right">Actions</th></tr></thead>
              <tbody>
                ${approved.map(p => {
                  const student = DB.find('students', p.studentId);
                  return `<tr>
                    <td class="font-semibold">${p.name}</td>
                    <td class="text-sm text-slate-500">${p.relationship}</td>
                    <td class="text-sm font-mono">${p.phone}</td>
                    <td>${student ? student.name : '—'}</td>
                    <td class="text-xs text-slate-400">${fdate(p.approvedAt, { short: true })}</td>
                    <td class="text-right">
                      <button class="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50" title="Revoke authorization" onclick="adm_revokePickup('${p.id}')">${icon('trash','w-4 h-4')}</button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      ${denied.length > 0 ? `
        <div>
          <h3 class="font-bold text-slate-700 mb-3">Denied Requests (${denied.length})</h3>
          <div class="space-y-2">
            ${denied.map(p => {
              const student = DB.find('students', p.studentId);
              return `<div class="card p-3 flex items-center gap-3 opacity-60">
                <div class="flex-1 min-w-0">
                  <span class="font-semibold text-slate-700">${p.name}</span>
                  <span class="text-sm text-slate-500 ml-2">· ${p.relationship}</span>
                  <div class="text-xs text-slate-400">For: ${student ? student.name : '—'}</div>
                </div>
                <span class="badge badge-danger">Denied</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/* ──────────────────────────────────────────────────────────────
   ADMIN MODALS & ACTIONS
────────────────────────────────────────────────────────────── */

function adm_addRouteModal() {
  adm_editRouteModal(null);
}

function adm_editRouteModal(routeId) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const existing = routeId ? DB.find('busRoutes', routeId) : null;

  const allStaff = [
    ...DB.query('teachers', t => t.schoolId === schoolId),
    ...DB.query('staff',    s => s.schoolId === schoolId)
  ];

  modal({
    title: existing ? 'Edit Bus Route' : 'Add Bus Route',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          This system uses <strong>house-to-house pickup</strong>. After creating a route, assign students to it and set each student's pickup order (1st house, 2nd house, etc.).
        </div>
        <div>
          <label class="input-label">Route Name *</label>
          <input id="rt_name" class="input" placeholder="e.g. Lekki Morning Route" value="${existing ? existing.name.replace(/"/g, '&quot;') : ''}" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Driver *</label>
            <select id="rt_driver" class="input">
              <option value="">— Select driver —</option>
              ${allStaff.map(s => `<option value="${s.id}" ${existing && existing.driverStaffId === s.id ? 'selected' : ''}>${s.name}${s.role ? ' · ' + s.role : ''}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="input-label">Vehicle Plate</label>
            <input id="rt_plate" class="input" placeholder="e.g. LND 234 HJ" value="${existing ? (existing.vehiclePlate || '') : ''}" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="input-label">Capacity (seats)</label>
            <input id="rt_capacity" type="number" class="input" placeholder="e.g. 25" value="${existing ? (existing.capacity || '') : ''}" />
          </div>
          <div>
            <label class="input-label">Departure Time</label>
            <input id="rt_departure" type="time" class="input" value="${existing ? (existing.departureTime || '') : '06:30'}" />
          </div>
          <div>
            <label class="input-label">Return Time</label>
            <input id="rt_return" type="time" class="input" value="${existing ? (existing.returnTime || '') : '15:00'}" />
          </div>
        </div>
        <div>
          <label class="input-label">Area / Corridor (optional)</label>
          <input id="rt_area" class="input" placeholder="e.g. Lekki / Ajah corridor" value="${existing ? (existing.area || '') : ''}" />
          <p class="text-xs text-slate-400 mt-1">General area this route covers — for reference only.</p>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="adm_saveRoute(${routeId ? `'${routeId}'` : 'null'})">${icon('check','w-4 h-4')} ${existing ? 'Save Changes' : 'Add Route'}</button>
    `
  });
}

function adm_saveRoute(routeId) {
  const name          = (document.getElementById('rt_name')      || {}).value.trim();
  const driverStaffId = (document.getElementById('rt_driver')    || {}).value;
  const vehiclePlate  = (document.getElementById('rt_plate')     || {}).value.trim();
  const capacity      = parseInt((document.getElementById('rt_capacity')  || {}).value) || null;
  const departureTime = (document.getElementById('rt_departure') || {}).value;
  const returnTime    = (document.getElementById('rt_return')    || {}).value;
  const area          = (document.getElementById('rt_area')      || {}).value.trim();

  if (!name) { toast('Route name is required', 'danger'); return; }
  if (!driverStaffId) { toast('Please select a driver', 'danger'); return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const data = { schoolId, name, area, driverStaffId, vehiclePlate, capacity, departureTime, returnTime };

  if (routeId) {
    DB.update('busRoutes', routeId, data);
    toast('Route updated', 'success');
  } else {
    DB.insert('busRoutes', { id: uid('rt'), ...data, createdAt: now() });
    toast('Route added', 'success');
  }
  document.getElementById('modalBackdrop').click();
  APP.params.tab = 'routes'; APP.render();
}

function adm_deleteRoute(routeId) {
  const route = DB.find('busRoutes', routeId);
  if (!route) return;
  const assignedCount = DB.query('busAssignments', a => a.routeId === routeId).length;
  confirm(
    `Delete route "${route.name}"?${assignedCount ? ` This will also remove ${assignedCount} student assignment${assignedCount !== 1 ? 's' : ''}.` : ''}`,
    () => {
      DB.query('busAssignments', a => a.routeId === routeId).forEach(a => DB.remove('busAssignments', a.id));
      DB.remove('busRoutes', routeId);
      APP.params.tab = 'routes'; APP.render();
      toast('Route deleted', 'info');
    },
    { danger: true, yesLabel: 'Delete Route' }
  );
}

function adm_assignStudentModal() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const routes   = DB.query('busRoutes', r => r.schoolId === schoolId);

  if (!routes.length) {
    toast('Create a bus route first before assigning students', 'danger');
    return;
  }

  modal({
    title: 'Assign Student to Bus Route',
    body: `
      <div class="space-y-4">
        <div>
          <label class="input-label">Student *</label>
          <select id="as_student" class="input" onchange="adm_previewStudentAddress(this.value)">
            <option value="">— Select student —</option>
            ${students.map(s => {
              const cls = DB.find('classes', s.classId);
              return `<option value="${s.id}">${s.name}${cls ? ' · ' + cls.name : ''}</option>`;
            }).join('')}
          </select>
          <div id="as_addr_preview" class="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hidden"></div>
        </div>
        <div>
          <label class="input-label">Bus Route *</label>
          <select id="as_route" class="input">
            <option value="">— Select route —</option>
            ${routes.map(r => {
              const count = DB.query('busAssignments', a => a.routeId === r.id && a.schoolId === schoolId).length;
              return `<option value="${r.id}">${r.name}${r.vehiclePlate ? ' (' + r.vehiclePlate + ')' : ''} · ${count} students</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label class="input-label">Direction *</label>
          <select id="as_direction" class="input">
            <option value="both">Both ways (morning pickup + afternoon drop-off)</option>
            <option value="pickup">Morning pickup only</option>
            <option value="dropoff">Afternoon drop-off only</option>
          </select>
        </div>
        <div>
          <label class="input-label">Pickup Order *</label>
          <input id="as_order" type="number" min="1" class="input" placeholder="e.g. 1 = first house driver visits, 2 = second…" />
          <p class="text-xs text-slate-400 mt-1">Position in the route. Sets the order on the driver's manifest and printed route sheet.</p>
        </div>
        <div>
          <label class="input-label">Pickup Address</label>
          <input id="as_addr" class="input" placeholder="Leave blank to use parent's home address on file" />
          <p class="text-xs text-slate-400 mt-1">Only fill this if their pickup point differs from their registered home address.</p>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="adm_saveAssignment()">${icon('check','w-4 h-4')} Assign Student</button>
    `
  });
}

function adm_saveAssignment() {
  const studentId   = (document.getElementById('as_student')   || {}).value;
  const routeId     = (document.getElementById('as_route')     || {}).value;
  const direction   = (document.getElementById('as_direction') || {}).value;
  const pickupOrder = parseInt((document.getElementById('as_order') || {}).value) || 0;
  const pickupAddress = ((document.getElementById('as_addr') || {}).value || '').trim();

  if (!studentId) { toast('Please select a student', 'danger'); return; }
  if (!routeId)   { toast('Please select a route', 'danger');   return; }
  if (!pickupOrder) { toast('Please enter the pickup order number', 'danger'); return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';

  // Check for existing assignment
  const existing = DB.query('busAssignments', a => a.studentId === studentId);
  if (existing.length) {
    toast('This student already has a bus assignment. Remove the existing one first.', 'danger');
    return;
  }

  // Capacity enforcement
  const route = DB.find('busRoutes', routeId);
  if (route && route.capacity) {
    const currentCount = DB.query('busAssignments', a => a.routeId === routeId && a.schoolId === schoolId).length;
    if (currentCount >= route.capacity) {
      toast('This route is full — capacity: ' + route.capacity + ' students. Remove a student or increase capacity.', 'danger');
      return;
    }
  }

  DB.insert('busAssignments', {
    id: uid('ba'), schoolId, studentId, routeId, direction, pickupOrder, pickupAddress, createdAt: now()
  });

  const student = DB.find('students', studentId);
  document.getElementById('modalBackdrop').click();
  APP.params.tab = 'assign'; APP.render();
  toast(`${student ? student.name : 'Student'} assigned to ${route ? route.name : 'route'}`, 'success');
}

function adm_previewStudentAddress(studentId) {
  const preview = document.getElementById('as_addr_preview');
  const addrInput = document.getElementById('as_addr');
  if (!preview) return;
  const stu    = DB.find('students', studentId);
  const parent = stu && stu.parentId ? DB.find('parents', stu.parentId) : null;
  const addr   = parent ? (parent.address || '') : '';
  preview.classList.remove('hidden');
  if (addr) {
    preview.innerHTML = '<span class="font-semibold text-slate-700">Home address:</span> ' + addr;
    if (addrInput && !addrInput.value) addrInput.placeholder = addr;
  } else {
    preview.innerHTML = '<span class="text-rose-500 italic">No home address on file for this parent — enter pickup address manually below.</span>';
  }
}

function adm_editAssignmentModal(assignmentId) {
  const a = DB.find('busAssignments', assignmentId);
  if (!a) return;
  const stu    = DB.find('students', a.studentId);
  const parent = stu && stu.parentId ? DB.find('parents', stu.parentId) : null;
  const homeAddr = parent ? (parent.address || '') : '';
  modal({
    title: `Edit Pickup — ${stu ? stu.name : 'Student'}`,
    size: 'sm',
    body: `
      <div class="space-y-3">
        ${homeAddr ? `<div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600"><span class="font-semibold text-slate-700">Home address on file:</span> ${homeAddr}</div>` : `<div class="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">No home address on file for this parent.</div>`}
        <div>
          <label class="input-label">Pickup Order *</label>
          <input id="ea_order" type="number" min="1" class="input" value="${a.pickupOrder || ''}" placeholder="e.g. 3 = 3rd house the driver visits" />
        </div>
        <div>
          <label class="input-label">Pickup Address (override)</label>
          <input id="ea_addr" class="input" value="${a.pickupAddress || ''}" placeholder="${homeAddr || 'Enter address if different from home address'}" />
          <p class="text-xs text-slate-400 mt-1">Leave blank to use home address.</p>
        </div>
        <div>
          <label class="input-label">Direction</label>
          <select id="ea_dir" class="input">
            <option value="both" ${a.direction==='both'?'selected':''}>Both ways</option>
            <option value="pickup" ${a.direction==='pickup'?'selected':''}>Morning pickup only</option>
            <option value="dropoff" ${a.direction==='dropoff'?'selected':''}>Afternoon drop-off only</option>
          </select>
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="adm_saveEditAssignment('${assignmentId}')">${icon('check','w-4 h-4')} Save</button>`
  });
}

function adm_saveEditAssignment(assignmentId) {
  const pickupOrder   = parseInt((document.getElementById('ea_order') || {}).value) || 0;
  const pickupAddress = ((document.getElementById('ea_addr') || {}).value || '').trim();
  const direction     = (document.getElementById('ea_dir') || {}).value;
  if (!pickupOrder) { toast('Pickup order is required', 'danger'); return; }
  DB.update('busAssignments', assignmentId, { pickupOrder, pickupAddress, direction });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Assignment updated', 'success');
}

function adm_removeAssignment(assignmentId) {
  const a = DB.find('busAssignments', assignmentId);
  const s = a ? DB.find('students', a.studentId) : null;
  confirm(
    `Remove bus assignment for ${s ? s.name : 'this student'}?`,
    () => {
      DB.remove('busAssignments', assignmentId);
      APP.render();
      toast('Assignment removed', 'info');
    },
    { danger: true, yesLabel: 'Remove' }
  );
}

function adm_approvePickup(pickupId) {
  const p = DB.find('authorizedPickups', pickupId);
  if (!p) return;
  DB.update('authorizedPickups', pickupId, {
    status: 'approved',
    approvedBy: AUTH.current.id,
    approvedAt: now()
  });
  // Notify parent
  const student = DB.find('students', p.studentId);
  if (student && student.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: student.parentId,
      title: 'Pickup Authorization Approved',
      body: `${p.name} (${p.relationship}) has been approved to pick up ${student ? student.name : 'your child'}.`,
      type: 'success', read: false, timestamp: now(),
      link: { view: 'par_transport' }
    });
  }
  APP.render();
  toast('Pickup authorization approved', 'success');
}

function adm_denyPickup(pickupId) {
  const p = DB.find('authorizedPickups', pickupId);
  if (!p) return;
  DB.update('authorizedPickups', pickupId, {
    status: 'denied',
    approvedBy: AUTH.current.id,
    approvedAt: now()
  });
  // Notify parent
  const student = DB.find('students', p.studentId);
  if (student && student.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: student.parentId,
      title: 'Pickup Authorization Denied',
      body: `Your request to authorize ${p.name} (${p.relationship}) to pick up ${student ? student.name : 'your child'} was not approved. Please contact the school for more information.`,
      type: 'warn', read: false, timestamp: now(),
      link: { view: 'par_transport' }
    });
  }
  APP.render();
  toast('Pickup authorization denied', 'info');
}

function adm_revokePickup(pickupId) {
  const p = DB.find('authorizedPickups', pickupId);
  if (!p) return;
  const student = DB.find('students', p.studentId);
  confirm(
    `Revoke authorization for ${p.name} to pick up ${student ? student.name : 'this student'}?`,
    () => {
      DB.remove('authorizedPickups', pickupId);
      // Notify parent
      if (student && student.parentId) {
        DB.insert('notifications', {
          id: uid('not'), userId: student.parentId,
          title: 'Pickup Authorization Revoked',
          body: `${p.name}'s authorization to pick up ${student.name} has been revoked by the school.`,
          type: 'warn', read: false, timestamp: now(),
          link: { view: 'par_transport' }
        });
      }
      APP.render();
      toast('Authorization revoked', 'info');
    },
    { danger: true, yesLabel: 'Revoke' }
  );
}

/* ---------- Bus Status tab ---------- */
function adm_renderBusStatusTab(routes, schoolId) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const statuses  = DB.query('busStatus', s => s.schoolId === schoolId && s.date === todayStr);

  const STATUS = {
    waiting:  { label: 'Waiting at School',  badge: 'badge-neutral', dot: 'bg-slate-400' },
    departed: { label: 'Departed — En Route', badge: 'badge-warn',    dot: 'bg-amber-500' },
    arrived:  { label: 'Arrived',             badge: 'badge-success', dot: 'bg-emerald-500' },
    delayed:  { label: 'Delayed',             badge: 'badge-danger',  dot: 'bg-rose-500' }
  };

  if (!routes.length) return emptyState({ icon: 'package', title: 'No routes', body: 'Add bus routes first.' });

  return `
    <div class="space-y-5">
      <div>
        <h3 class="font-semibold text-slate-800">Today's Bus Status</h3>
        <p class="text-sm text-slate-500">Update each route's status and see the full boarding manifest by stop.</p>
      </div>
      ${routes.map(route => {
        const statusRec = statuses.find(s => s.routeId === route.id);
        const current   = statusRec ? statusRec.status : 'waiting';
        const info      = STATUS[current] || STATUS.waiting;
        const assignments = DB.query('busAssignments', a => a.routeId === route.id && a.schoolId === schoolId);

        // Build ordered manifest for house-to-house pickup
        const manifest = assignments.map(a => {
          const stu    = DB.find('students', a.studentId);
          const cls    = stu ? DB.find('classes', stu.classId) : null;
          const parent = stu && stu.parentId ? DB.find('parents', stu.parentId) : null;
          const addr   = a.pickupAddress || (parent ? parent.address : '') || '';
          return {
            pickupOrder: a.pickupOrder || 999,
            name: stu ? stu.name : '—',
            className: cls ? cls.name : '',
            direction: a.direction,
            parentPhone: parent ? (parent.phone || '') : '',
            pickupAddress: addr,
            noAddress: !addr
          };
        }).sort((a, b) => a.pickupOrder - b.pickupOrder);
        const noOrder = manifest.filter(m => m.pickupOrder === 999);

        return `
          <div class="card overflow-hidden">
            <!-- Route header + status controls -->
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ${info.dot}"></span>
                    <span class="font-bold text-slate-900">${route.name}</span>
                    <span class="badge ${info.badge}">${info.label}</span>
                  </div>
                  <div class="text-xs text-slate-400">${route.vehiclePlate || 'No plate'} · ${assignments.length} students · Departs ${route.departureTime || '—'} · Returns ${route.returnTime || '—'}</div>
                  ${statusRec && statusRec.note ? `<div class="text-sm text-slate-600 mt-1 italic">"${statusRec.note}"</div>` : ''}
                  ${statusRec && statusRec.updatedAt ? `<div class="text-xs text-slate-400 mt-0.5">Last updated ${statusRec.updatedAt.slice(11, 16)}</div>` : ''}
                </div>
                <div class="flex gap-2 flex-wrap flex-shrink-0">
                  ${Object.entries(STATUS).map(([k, v]) => `
                    <button onclick="adm_updateBusStatus('${route.id}', '${k}')"
                      class="btn btn-sm ${current === k ? 'btn-primary' : 'btn-secondary'} !py-1.5 text-xs">
                      ${v.label}
                    </button>`).join('')}
                  <button onclick="adm_addBusNote('${route.id}')" class="btn btn-ghost btn-sm !py-1.5 text-xs">+ Note</button>
                </div>
              </div>
            </div>

            <!-- House-to-house pickup manifest -->
            <div class="p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs font-semibold uppercase text-slate-400">Pickup Manifest — ${manifest.length} student${manifest.length !== 1 ? 's' : ''} in pickup order</div>
                <button class="btn btn-secondary text-xs !py-1.5" onclick="printRouteSheet('${route.id}')">${icon('download','w-3.5 h-3.5')} Print Route Sheet</button>
              </div>
              ${manifest.length === 0
                ? `<p class="text-sm text-slate-400">No students assigned to this route yet.</p>`
                : `<div class="space-y-2">
                    ${manifest.filter(m => m.pickupOrder !== 999).map((m, i) => `
                      <div class="flex gap-3 items-start">
                        <div class="flex flex-col items-center flex-shrink-0">
                          <div class="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs">${m.pickupOrder}</div>
                          ${i < manifest.filter(x=>x.pickupOrder!==999).length - 1 ? `<div class="w-px flex-1 bg-slate-200 mt-0.5" style="min-height:16px"></div>` : ''}
                        </div>
                        <div class="flex-1 pb-2 min-w-0">
                          <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                              <span class="font-semibold text-sm text-slate-800">${m.name}</span>
                              <span class="text-xs text-slate-400">${m.className}</span>
                              ${m.direction !== 'both' ? `<span class="badge badge-warn text-xs">${m.direction === 'pickup' ? 'AM only' : 'PM only'}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-3 flex-wrap">
                              ${m.pickupAddress
                                ? `<span class="text-xs text-slate-600">${icon('home','w-3 h-3 inline')} ${m.pickupAddress}</span>`
                                : `<span class="text-xs text-rose-400 italic">No address on file — edit assignment to add</span>`}
                              ${m.parentPhone ? `<a href="tel:${m.parentPhone}" class="text-xs text-brand-700 font-medium">${icon('phone','w-3 h-3 inline')} ${m.parentPhone}</a>` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                    ${noOrder.length > 0 ? `
                      <div class="mt-2 p-3 bg-amber-50 rounded-xl">
                        <div class="text-xs font-semibold text-amber-800 mb-1.5">Pickup order not set (${noOrder.length})</div>
                        <div class="flex flex-wrap gap-1.5">
                          ${noOrder.map(m => `<span class="text-xs bg-white text-amber-800 px-2 py-0.5 rounded-full">${m.name}</span>`).join('')}
                        </div>
                        <p class="text-xs text-amber-700 mt-1.5">Go to Student Assignments → edit the pencil icon to set their pickup order.</p>
                      </div>
                    ` : ''}
                  </div>`
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function adm_updateBusStatus(routeId, status) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const today = new Date().toISOString().slice(0, 10);
  const existing = DB.query('busStatus', s => s.schoolId === schoolId && s.routeId === routeId && s.date === today)[0];
  const route = DB.find('busRoutes', routeId);
  const data = { schoolId, routeId, date: today, status, updatedBy: AUTH.current.id, updatedAt: new Date().toISOString() };

  if (existing) {
    DB.update('busStatus', existing.id, data);
  } else {
    DB.insert('busStatus', { id: uid('bs'), ...data });
  }

  // Notify all parents of students on this route
  const assignments = DB.query('busAssignments', a => a.routeId === routeId && a.schoolId === schoolId);
  const statusMessages = {
    departed: `The ${route ? route.name : 'school bus'} has departed and is now en route.`,
    arrived:  `The ${route ? route.name : 'school bus'} has arrived at its destination.`,
    delayed:  `The ${route ? route.name : 'school bus'} is delayed. Please bear with us.`,
    waiting:  `The ${route ? route.name : 'school bus'} is waiting at school.`
  };

  assignments.forEach(a => {
    const student = DB.find('students', a.studentId);
    if (student && student.parentId) {
      DB.insert('notifications', {
        id: uid('not'), userId: student.parentId,
        title: 'Bus Status Update — ' + (route ? route.name : 'School Bus'),
        body: statusMessages[status] || 'Bus status updated.',
        type: status === 'delayed' ? 'warn' : 'info',
        read: false, timestamp: new Date().toISOString(),
        link: { view: 'par_transport' }
      });
    }
  });

  APP.render();
  const labels = { departed: 'Marked as departed', arrived: 'Marked as arrived', delayed: 'Marked as delayed', waiting: 'Reset to waiting' };
  toast(labels[status] || 'Status updated', 'success');
}

function adm_addBusNote(routeId) {
  modal({
    title: 'Add Note to Bus Update',
    size: 'sm',
    body: `<div><label class="input-label">Note (e.g. "Stuck in traffic at Lekki bridge")</label>
      <textarea id="bn_note" class="input" rows="3" placeholder="Optional message for parents..."></textarea></div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="adm_saveBusNote('${routeId}')">Save Note</button>`
  });
}

function adm_saveBusNote(routeId) {
  const note = (document.getElementById('bn_note') || {}).value.trim();
  if (!note) { toast('Enter a note', 'danger'); return; }
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const today = new Date().toISOString().slice(0, 10);
  const existing = DB.query('busStatus', s => s.schoolId === schoolId && s.routeId === routeId && s.date === today)[0];
  if (existing) {
    DB.update('busStatus', existing.id, { note, updatedAt: new Date().toISOString() });
  } else {
    DB.insert('busStatus', { id: uid('bs'), schoolId, routeId, date: today, status: 'waiting', note, updatedBy: AUTH.current.id, updatedAt: new Date().toISOString() });
  }
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Note saved', 'success');
}

/* ──────────────────────────────────────────────────────────────
   PARENT VIEWS
────────────────────────────────────────────────────────────── */

function view_par_transport(params) {
  const parentId = AUTH.current.id;
  const children = COMPUTE.parentChildren(parentId).filter(c => c.status === 'active');

  if (!children.length) {
    return `
      ${pageHeader({ title: 'Transport & Pickup', subtitle: 'Bus routes and authorized pickup persons' })}
      ${emptyState({ icon: 'package', title: 'No children linked', body: 'No active children found on your account.' })}
    `;
  }

  const activeId = (params && params.studentId) || children[0].id;
  const child    = DB.find('students', activeId);

  const schoolId  = AUTH.current.schoolId || (child && child.schoolId) || 'sch_brightlights';
  const assignment = DB.query('busAssignments', a => a.studentId === activeId)[0];
  const route      = assignment ? DB.find('busRoutes', assignment.routeId) : null;
  const pickups    = DB.query('authorizedPickups', p => p.studentId === activeId && p.schoolId === schoolId);
  const approvedPickups = pickups.filter(p => p.status === 'approved');
  const pendingPickups  = pickups.filter(p => p.status === 'pending');

  let driverName = '—';
  if (route && route.driverStaffId) {
    const driver = DB.find('teachers', route.driverStaffId) || DB.find('staff', route.driverStaffId);
    if (driver) driverName = driver.name;
  }


  const dirLabel = assignment
    ? ({ both: 'Both ways', pickup: 'Morning pickup only', dropoff: 'Afternoon drop-off only' }[assignment.direction] || assignment.direction)
    : '';

  const todayStr = new Date().toISOString().slice(0, 10);
  const busStatusRecord = route ? DB.query('busStatus', s => s.routeId === route.id && s.date === todayStr)[0] : null;
  const busStatusInfo = busStatusRecord ? {
    waiting:  { label: 'Waiting at school',  color: 'text-slate-500',   dot: 'bg-slate-400' },
    departed: { label: 'Bus is en route',     color: 'text-amber-700',   dot: 'bg-amber-500' },
    arrived:  { label: 'Bus has arrived',     color: 'text-emerald-700', dot: 'bg-emerald-500' },
    delayed:  { label: 'Bus is delayed',      color: 'text-rose-700',    dot: 'bg-rose-500' }
  }[busStatusRecord.status] : null;

  // Pre-compute pickup address block to avoid deeply nested template literals
  const childParent = child && child.parentId ? DB.find('parents', child.parentId) : null;
  const pickupAddr  = assignment ? (assignment.pickupAddress || (childParent ? childParent.address : '') || '') : '';
  const pickupBlock = pickupAddr
    ? '<div class="mt-4 p-3 bg-brand-50 rounded-xl">'
      + '<div class="text-xs font-semibold uppercase text-brand-600 mb-1">Your Pickup Address</div>'
      + '<div class="text-sm font-semibold text-brand-900">' + pickupAddr + '</div>'
      + (assignment && assignment.pickupOrder ? '<div class="text-xs text-brand-600 mt-0.5">Stop #' + assignment.pickupOrder + ' on this route</div>' : '')
      + '</div>'
    : '<div class="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">No pickup address on file. Please contact the school to confirm your pickup location.</div>';

  return `
    <div class="space-y-5">
      ${pageHeader({ title: 'Transport & Pickup', subtitle: 'Bus route and authorized pickup persons for your children' })}

      ${children.length > 1 ? `
        <div class="flex gap-2 flex-wrap">
          ${children.map(c => `<button onclick="APP.params.studentId = '${c.id}'; APP.render();"
            class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
        </div>
      ` : ''}

      <!-- Route card -->
      <div>
        <h3 class="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Bus Route</h3>
        ${route ? `
          <div class="card p-5">
            <div class="flex items-start gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-900 text-lg">${route.name}</div>
                <div class="text-sm text-slate-500 mt-0.5">${route.vehiclePlate || ''} · ${dirLabel}</div>
              </div>
              <div class="grid grid-cols-3 gap-3 text-sm text-center flex-shrink-0">
                <div class="bg-slate-50 rounded-xl p-3">
                  <div class="text-xs text-slate-400 font-semibold uppercase mb-0.5">Departure</div>
                  <div class="font-bold text-slate-900">${route.departureTime || '—'}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3">
                  <div class="text-xs text-slate-400 font-semibold uppercase mb-0.5">Return</div>
                  <div class="font-bold text-slate-900">${route.returnTime || '—'}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-3">
                  <div class="text-xs text-slate-400 font-semibold uppercase mb-0.5">Driver</div>
                  <div class="font-bold text-slate-900 truncate">${driverName}</div>
                </div>
              </div>
            </div>
            ${pickupBlock}
            ${busStatusInfo ? `
              <div class="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ${busStatusInfo.dot}"></span>
                <span class="text-sm font-semibold ${busStatusInfo.color}">${busStatusInfo.label}</span>
                ${busStatusRecord.note ? `<span class="text-sm text-slate-500 ml-1">— ${busStatusRecord.note}</span>` : ''}
                ${busStatusRecord.updatedAt ? `<span class="text-xs text-slate-400 ml-auto">${busStatusRecord.updatedAt.slice(11,16)}</span>` : ''}
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="card p-5 flex items-center gap-4 bg-slate-50 border border-slate-200">
            <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">${icon('package','w-5 h-5 text-slate-400')}</div>
            <div>
              <div class="font-semibold text-slate-700">${child ? child.name : 'This child'} is not registered for the school bus.</div>
              <div class="text-sm text-slate-500">Contact the school office to enrol in a bus route.</div>
            </div>
          </div>
        `}
      </div>

      <!-- Authorized Pickups section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Authorized Pickup Persons</h3>
          <button class="btn btn-primary text-sm" onclick="par_addPickupModal('${activeId}')">${icon('plus','w-4 h-4')} Add Person</button>
        </div>

        ${pendingPickups.length > 0 ? `
          <div class="mb-3 card p-3 bg-amber-50">
            <div class="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">${icon('bell','w-4 h-4')} ${pendingPickups.length} pending approval${pendingPickups.length !== 1 ? 's' : ''}</div>
            <div class="space-y-1">
              ${pendingPickups.map(p => `<div class="text-sm text-amber-800 flex items-center gap-2">
                <span class="badge badge-warn">Pending</span>
                <span>${p.name} · ${p.relationship}</span>
              </div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${approvedPickups.length > 0 ? `
          <div class="space-y-2">
            ${approvedPickups.map(p => `
              <div class="card p-4 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">${icon('check','w-5 h-5')}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-900">${p.name}</div>
                  <div class="text-sm text-slate-500">${p.relationship} · ${p.phone}</div>
                  <div class="text-xs text-slate-400 mt-0.5">Approved ${fdate(p.approvedAt, { relative: true })}</div>
                </div>
                <button class="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50 flex-shrink-0" title="Remove this authorized person"
                  onclick="par_removePickup('${p.id}')">${icon('trash','w-4 h-4')}</button>
              </div>
            `).join('')}
          </div>
        ` : `
          ${pendingPickups.length === 0 ? `
            <div class="card p-5 text-center text-slate-400">
              <div class="mb-2">${icon('students','w-8 h-8 mx-auto text-slate-300')}</div>
              <div class="text-sm font-medium text-slate-500">No authorized pickup persons yet.</div>
              <div class="text-xs text-slate-400 mt-1">Add people who are allowed to pick up ${child ? child.name : 'your child'} from school.</div>
            </div>
          ` : ''}
        `}
      </div>
    </div>
  `;
}

function par_addPickupModal(studentId) {
  const student = DB.find('students', studentId);
  modal({
    title: `Add Authorized Pickup Person${student ? ' — ' + student.name : ''}`,
    body: `
      <div class="space-y-4">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          ${icon('bell','w-4 h-4 inline mr-1')}
          Your request will be reviewed by the school admin before the person is authorized.
        </div>
        <div>
          <label class="input-label">Full Name *</label>
          <input id="pu_name" class="input" placeholder="e.g. Mrs. Grace Adeyemi" />
        </div>
        <div>
          <label class="input-label">Relationship to Child *</label>
          <select id="pu_rel" class="input">
            <option value="">— Select relationship —</option>
            <option value="Parent/Guardian">Parent / Guardian</option>
            <option value="Aunt/Uncle">Aunt / Uncle</option>
            <option value="Grandparent">Grandparent</option>
            <option value="Sibling">Sibling</option>
            <option value="Family Friend">Family Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label class="input-label">Phone Number *</label>
          <input id="pu_phone" class="input" type="tel" placeholder="e.g. 08012345678" />
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="par_savePickup('${studentId}')">${icon('check','w-4 h-4')} Submit Request</button>
    `
  });
}

function par_savePickup(studentId) {
  const name  = (document.getElementById('pu_name')  || {}).value.trim();
  const rel   = (document.getElementById('pu_rel')   || {}).value;
  const phone = (document.getElementById('pu_phone') || {}).value.trim();

  if (!name)  { toast('Full name is required', 'danger'); return; }
  if (!rel)   { toast('Please select a relationship', 'danger'); return; }
  if (!phone) { toast('Phone number is required', 'danger'); return; }

  const student  = DB.find('students', studentId);
  const schoolId = student ? student.schoolId : (AUTH.current.schoolId || 'sch_brightlights');

  DB.insert('authorizedPickups', {
    id: uid('pu'), schoolId, studentId,
    name, relationship: rel, phone,
    approvedBy: null, approvedAt: null,
    status: 'pending',
    createdAt: now()
  });

  // Notify school admin — find admin notifications target
  const admins = DB.query('teachers', t => t.role === 'schooladmin');
  const adminId = admins.length ? admins[0].id : 'adm_principal';
  DB.insert('notifications', {
    id: uid('not'), userId: adminId,
    title: 'New Pickup Authorization Request',
    body: `${AUTH.current.name} has requested to add ${name} (${rel}) as an authorized pickup person for ${student ? student.name : 'a student'}.`,
    type: 'info', read: false, timestamp: now(),
    link: { view: 'adm_transport', params: { tab: 'pickups' } }
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Request submitted — school admin will review and approve.', 'success');
}

function par_removePickup(pickupId) {
  const p = DB.find('authorizedPickups', pickupId);
  if (!p) return;
  confirm(
    `Remove ${p.name} from authorized pickup persons?`,
    () => {
      DB.remove('authorizedPickups', pickupId);
      APP.render();
      toast('Removed from authorized pickup persons', 'info');
    },
    { danger: true, yesLabel: 'Remove' }
  );
}

/* ---------- Dismissal / Clock-Out Tab ---------- */
function adm_renderDismissalTab(schoolId, todayDismissals, activeStudents) {
  const cfg = DB.settings().dismissalConfig || { schoolEndTime: '15:00', lateThreshold: '15:30' };
  const nowH = new Date().getHours();
  const nowM = new Date().getMinutes();
  const nowMins = nowH * 60 + nowM;
  const [endH, endM] = cfg.schoolEndTime.split(':').map(Number);
  const [lateH, lateM] = cfg.lateThreshold.split(':').map(Number);
  const schoolEndMins = endH * 60 + endM;
  const lateThreshMins = lateH * 60 + lateM;

  // Time-bound model:
  // Before school end → teachers handle (Academic staff in attendance module)
  // After lateThreshold → parents (late pickup) or admin
  const isLatePickupTime = nowMins > lateThreshMins;
  const isDuringSchool = nowMins <= schoolEndMins;

  const classes = DB.get('classes');
  const classFilter = APP.params.dismissClass || 'all';
  const searchQ = (APP.params.dismissQ || '').toLowerCase();

  let displayStudents = activeStudents.filter(s => {
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    if (searchQ && !s.name.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  const dismissed = displayStudents.filter(s => todayDismissals.find(d => d.studentId === s.id));
  const notDismissed = displayStudents.filter(s => !todayDismissals.find(d => d.studentId === s.id));

  return `
    <div class="space-y-4">
      <!-- Config banner -->
      <div class="flex items-start gap-3 flex-wrap">
        <div class="flex-1 ${isLatePickupTime ? 'bg-amber-50' : isDuringSchool ? 'bg-brand-50' : 'bg-emerald-50'} rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            ${icon('bell','w-4 h-4 text-current')}
            <span class="font-semibold text-sm">${
              isLatePickupTime ? 'Late Pickup Period — Admin/parent handles dismissal' :
              isDuringSchool   ? 'School Hours — Teachers handle student release' :
              'Closing Time — Confirm student pickups below'
            }</span>
          </div>
          <div class="text-xs text-slate-600">School ends at <strong>${cfg.schoolEndTime}</strong> · Late pickup threshold: <strong>${cfg.lateThreshold}</strong>
            <button class="ml-2 underline text-brand-700 font-semibold" onclick="adm_dismissalConfigModal()">Edit</button>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary text-sm" onclick="adm_bulkDismissAll()">${icon('check','w-4 h-4')} Mark All Dismissed</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-2xl font-extrabold text-emerald-700">${dismissed.length}</div>
          <div class="text-xs text-slate-500">Dismissed</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-2xl font-extrabold text-amber-700">${notDismissed.length}</div>
          <div class="text-xs text-slate-500">Still Here</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-2xl font-extrabold text-slate-700">${displayStudents.length}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 flex-wrap items-center">
        <div class="relative flex-1 min-w-40">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
          <input type="text" class="input pl-9" placeholder="Search student…" value="${APP.params.dismissQ || ''}" oninput="APP.params.dismissQ=this.value; APP.render()" />
        </div>
        <select class="input w-auto" onchange="APP.params.dismissClass=this.value; APP.render()">
          <option value="all">All Classes</option>
          ${classes.map(c => `<option value="${c.id}" ${classFilter===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>

      <!-- Student list -->
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th>Student</th><th>Class</th><th>Dismissal</th><th>Time</th><th>Handler</th><th></th></tr></thead>
          <tbody>
            ${displayStudents.length === 0 ? `<tr><td colspan="6" class="text-center text-slate-400 py-8">No students found</td></tr>` : displayStudents.map(s => {
              const cls = DB.find('classes', s.classId);
              const rec = todayDismissals.find(d => d.studentId === s.id);
              const handlerType = rec ? rec.handlerType : null;
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s.name,'sm')}<div><div class="font-medium text-sm">${s.name}</div><div class="text-xs text-slate-500">${s.admissionNo || ''}</div></div></div></td>
                <td class="text-sm">${cls ? cls.name : '—'}</td>
                <td>${rec
                  ? `<span class="badge badge-success">${icon('check','w-3 h-3')} Dismissed</span>`
                  : `<span class="badge badge-warn">Still here</span>`}</td>
                <td class="font-mono text-xs text-slate-500">${rec ? rec.dismissedAt : '—'}</td>
                <td class="text-xs text-slate-500">${rec ? (handlerType === 'teacher' ? icon('teacher','w-3.5 h-3.5 inline') + ' Teacher' : handlerType === 'parent' ? icon('user','w-3.5 h-3.5 inline') + ' Parent' : 'Admin') : '—'}</td>
                <td>${rec
                  ? `<button class="btn btn-ghost !p-1.5 text-rose-500 text-xs" onclick="adm_undoDismissal('${s.id}')" title="Undo dismissal">Undo</button>`
                  : `<button class="btn btn-primary !py-1.5 text-xs" onclick="adm_dismissStudent('${s.id}', '${isLatePickupTime ? 'parent' : 'admin'}')">${icon('check','w-3.5 h-3.5')} Dismiss</button>`}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function adm_dismissStudent(studentId, handlerType) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const s = DB.find('students', studentId);
  const timeStr = new Date().toTimeString().slice(0, 5);
  const existing = DB.query('studentDismissals', d => d.schoolId === schoolId && d.studentId === studentId && d.date === today())[0];
  if (existing) return;
  DB.insert('studentDismissals', {
    id: uid('dism'), schoolId, studentId,
    date: today(), dismissedAt: timeStr,
    handlerType, recordedBy: AUTH.current.id, timestamp: now()
  });
  // Notify parent
  if (s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId,
      title: 'Student Dismissed',
      body: `${s.name} was dismissed from school at ${timeStr}.${handlerType === 'parent' ? ' This was recorded as a late pickup.' : ''}`,
      type: 'info', read: false, timestamp: now()
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: AUTH.current.id, action: 'student_dismissed', target: `${s ? s.name : studentId} @ ${timeStr} (${handlerType})`, timestamp: now() });
  APP.render();
  toast(`${s ? s.name.split(' ')[0] : 'Student'} dismissed at ${timeStr}`, 'success');
}

function adm_undoDismissal(studentId) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const rec = DB.query('studentDismissals', d => d.schoolId === schoolId && d.studentId === studentId && d.date === today())[0];
  if (!rec) return;
  DB.remove('studentDismissals', rec.id);
  APP.render();
  toast('Dismissal undone', 'info');
}

function adm_bulkDismissAll() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const activeStudents = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const todayRecs = DB.query('studentDismissals', d => d.schoolId === schoolId && d.date === today());
  const notYet = activeStudents.filter(s => !todayRecs.find(d => d.studentId === s.id));
  const timeStr = new Date().toTimeString().slice(0, 5);
  notYet.forEach(s => {
    DB.insert('studentDismissals', { id: uid('dism'), schoolId, studentId: s.id, date: today(), dismissedAt: timeStr, handlerType: 'admin', recordedBy: AUTH.current.id, timestamp: now() });
  });
  APP.render();
  toast(`${notYet.length} students marked dismissed at ${timeStr}`, 'success');
}

function adm_dismissalConfigModal() {
  const cfg = DB.settings().dismissalConfig || { schoolEndTime: '15:00', lateThreshold: '15:30' };
  modal({
    title: 'Dismissal Time Configuration',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          <strong>Time-bound model:</strong> During school hours, teachers handle student release from class. After the late pickup threshold, the system flags remaining students for parent/admin action and sends parent notifications.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">School End Time</label>
            <input type="time" id="dism_end" class="input" value="${cfg.schoolEndTime}" />
            <p class="text-xs text-slate-400 mt-1">Regular dismissal time</p>
          </div>
          <div>
            <label class="input-label">Late Pickup Threshold</label>
            <input type="time" id="dism_late" class="input" value="${cfg.lateThreshold}" />
            <p class="text-xs text-slate-400 mt-1">After this, parent/admin must handle</p>
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="adm_saveDismissalConfig()">${icon('check','w-4 h-4')} Save</button>`
  });
}

function adm_saveDismissalConfig() {
  const schoolEndTime = (document.getElementById('dism_end') || {}).value || '15:00';
  const lateThreshold = (document.getElementById('dism_late') || {}).value || '15:30';
  DB.settings({ dismissalConfig: { schoolEndTime, lateThreshold } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Dismissal times saved', 'success');
}

/* ---------- Print Route Sheet ---------- */
function printRouteSheet(routeId) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const school   = DB.find('schools', schoolId);
  const route    = DB.find('busRoutes', routeId);
  if (!route) return;

  const allStaff   = [...DB.query('teachers', t => t.schoolId === schoolId), ...DB.query('staff', s => s.schoolId === schoolId)];
  const driver     = allStaff.find(s => s.id === route.driverStaffId);
  const assignments = DB.query('busAssignments', a => a.routeId === routeId && a.schoolId === schoolId);

  const manifest = assignments.map(a => {
    const stu    = DB.find('students', a.studentId);
    const cls    = stu ? DB.find('classes', stu.classId) : null;
    const parent = stu && stu.parentId ? DB.find('parents', stu.parentId) : null;
    return {
      pickupOrder: a.pickupOrder || 999,
      name: stu ? stu.name : '—',
      admissionNo: stu ? (stu.admissionNo || '') : '',
      className: cls ? cls.name : '',
      direction: a.direction,
      parentName: parent ? parent.name : '',
      parentPhone: parent ? (parent.phone || '') : '',
      pickupAddress: a.pickupAddress || (parent ? parent.address : '') || ''
    };
  }).sort((a, b) => a.pickupOrder - b.pickupOrder);

  const todayFormatted = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stopRows = manifest.map((m, i) => `
    <tr style="${i % 2 === 0 ? '' : 'background:#f1f5f9'}">
      <td style="padding:7px 10px;font-size:13px;font-weight:700;color:#9e2a22;text-align:center">${m.pickupOrder === 999 ? '—' : m.pickupOrder}</td>
      <td style="padding:7px 10px;font-size:12px;font-weight:600">${m.name}</td>
      <td style="padding:7px 10px;font-size:12px;color:#475569">${m.className}</td>
      <td style="padding:7px 10px;font-size:12px;color:#0f172a">${m.parentPhone || '—'}</td>
      <td style="padding:7px 10px;font-size:12px;color:#475569">${m.pickupAddress || '<span style="color:#f59e0b;font-style:italic">No address on file</span>'}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html><html><head><title>Route Sheet — ${route.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
    h1 { font-size: 20px; margin: 0 0 2px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1e293b; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .info-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
    .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .info-value { font-size: 14px; font-weight: 700; }
    @media print { body { padding: 10px; } }
  </style></head><body>
  <div class="header-box">
    <div>
      <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:2px">${school ? school.name : 'School'}</div>
      <h1>${route.name} — Route Sheet</h1>
      <div class="meta">${todayFormatted} &nbsp;·&nbsp; ${manifest.length} students &nbsp;·&nbsp; House-to-house pickup</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b">
      <div><strong>Plate:</strong> ${route.vehiclePlate || '—'}</div>
      <div><strong>Driver:</strong> ${driver ? driver.name : '—'}</div>
      <div><strong>Phone:</strong> ${driver ? (driver.phone || '—') : '—'}</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-cell"><div class="info-label">Departure</div><div class="info-value">${route.departureTime || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Return</div><div class="info-value">${route.returnTime || '—'}</div></div>
    <div class="info-cell"><div class="info-label">Total Students</div><div class="info-value">${assignments.length}</div></div>
  </div>
  <table>
    <thead><tr>
      <th style="width:30px">#</th>
      <th>Student Name</th>
      <th>Class</th>
      <th>Parent Phone</th>
      <th>Home Address</th>
    </tr></thead>
    <tbody>
      ${stopRows}
    </tbody>
  </table>
  <div style="margin-top:20px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px">
    Printed from CASPAA · ${todayFormatted} · Driver: ${driver ? driver.name : '—'}
  </div>
  <script>window.onload = () => window.print();</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}
