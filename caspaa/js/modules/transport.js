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
  const tab = (params && params.tab) || 'routes';

  const routes      = DB.query('busRoutes',       r => r.schoolId === schoolId);
  const assignments = DB.query('busAssignments',  a => a.schoolId === schoolId);
  const pickups     = DB.query('authorizedPickups', p => p.schoolId === schoolId);
  const pendingCount = pickups.filter(p => p.status === 'pending').length;

  const tabBar = `
    <div class="flex gap-1 mb-5 border-b border-slate-200">
      ${[
        ['routes',  'Bus Routes',            routes.length],
        ['assign',  'Student Assignments',   assignments.length],
        ['pickups', 'Pickup Authorizations', pendingCount ? `<span class="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">${pendingCount}</span>` : '']
      ].map(([k, l, badge]) =>
        `<button onclick="APP.go('adm_transport',{tab:'${k}'})"
          class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          ${l}${badge !== undefined && badge !== '' ? (typeof badge === 'number' ? '' : badge) : ''}
        </button>`
      ).join('')}
    </div>`;

  let content = '';
  if (tab === 'routes')  content = adm_renderRoutesTab(routes, schoolId);
  if (tab === 'assign')  content = adm_renderAssignmentsTab(assignments, schoolId);
  if (tab === 'pickups') content = adm_renderPickupsTab(pickups, schoolId);

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

  return `
    <div class="mb-4 flex justify-end">
      <button class="btn btn-primary" onclick="adm_addRouteModal()">${icon('plus','w-4 h-4')} Add Route</button>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${routes.map(route => {
        const driver = allStaff.find(s => s.id === route.driverStaffId);
        const assignedCount = DB.query('busAssignments', a => a.routeId === route.id).length;
        const stops = Array.isArray(route.stops) ? route.stops : (route.stops || '').split('\n').map(s => s.trim()).filter(Boolean);
        return `
          <div class="card p-5 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-bold text-slate-900 text-base leading-tight">${route.name}</h3>
                <div class="text-xs text-slate-400 mt-0.5">${route.vehiclePlate || 'No plate'} · Capacity: ${route.capacity || '—'}</div>
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
                <div class="font-semibold text-slate-800">${assignedCount} / ${route.capacity || '?'}</div>
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
            ${stops.length ? `
              <div>
                <div class="text-xs font-semibold uppercase text-slate-400 mb-1.5">Stops</div>
                <div class="flex flex-wrap gap-1">
                  ${stops.map((s, i) => `<span class="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                    <span class="w-3.5 h-3.5 bg-brand-700 text-white rounded-full flex items-center justify-center font-bold" style="font-size:9px">${i + 1}</span>
                    ${s}
                  </span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
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
          <thead><tr><th>Student</th><th>Class</th><th>Route</th><th>Direction</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            ${assignments.map(a => {
              const student = DB.find('students', a.studentId);
              const cls     = student ? DB.find('classes', student.classId) : null;
              const route   = DB.find('busRoutes', a.routeId);
              const dirLabel = { both: 'Both ways', pickup: 'Pickup only', dropoff: 'Drop-off only' }[a.direction] || a.direction;
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(student || { name: '?' }, 'sm')}<span class="font-semibold">${student ? student.name : '—'}</span></div></td>
                <td class="text-sm text-slate-500">${cls ? cls.name : '—'}</td>
                <td><span class="badge badge-info">${route ? route.name : '—'}</span></td>
                <td><span class="text-sm text-slate-600">${dirLabel}</span></td>
                <td class="text-right">
                  <button class="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50" title="Remove assignment" onclick="adm_removeAssignment('${a.id}')">${icon('trash','w-4 h-4')}</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${unassigned.length > 0 ? `
      <div class="card p-4 bg-amber-50 border border-amber-200">
        <div class="flex items-center gap-2 mb-2">
          <div class="text-amber-700">${icon('bell','w-4 h-4')}</div>
          <h4 class="font-semibold text-amber-900">${unassigned.length} student${unassigned.length !== 1 ? 's' : ''} not registered for school bus</h4>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${unassigned.slice(0, 12).map(s => `<span class="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">${s.name}</span>`).join('')}
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
        <div class="card p-4 bg-emerald-50 border border-emerald-200 flex items-center gap-3">
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

  const stopsVal = existing
    ? (Array.isArray(existing.stops) ? existing.stops.join('\n') : (existing.stops || ''))
    : '';

  modal({
    title: existing ? 'Edit Bus Route' : 'Add Bus Route',
    body: `
      <div class="space-y-3">
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
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Capacity (seats)</label>
            <input id="rt_capacity" type="number" class="input" placeholder="e.g. 25" value="${existing ? (existing.capacity || '') : ''}" />
          </div>
          <div></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
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
          <label class="input-label">Stops (one per line)</label>
          <textarea id="rt_stops" class="input" rows="4" placeholder="e.g.&#10;Lekki Phase 1 Gate&#10;Chevron Roundabout&#10;VGC Entrance&#10;School">${stopsVal}</textarea>
          <p class="text-xs text-slate-400 mt-1">List each bus stop on a new line, in order of route.</p>
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
  const name       = (document.getElementById('rt_name')      || {}).value.trim();
  const driverStaffId = (document.getElementById('rt_driver') || {}).value;
  const vehiclePlate  = (document.getElementById('rt_plate')  || {}).value.trim();
  const capacity   = parseInt((document.getElementById('rt_capacity')  || {}).value) || null;
  const departureTime = (document.getElementById('rt_departure') || {}).value;
  const returnTime    = (document.getElementById('rt_return')   || {}).value;
  const stopsRaw      = (document.getElementById('rt_stops')   || {}).value;
  const stops = stopsRaw.split('\n').map(s => s.trim()).filter(Boolean);

  if (!name) { toast('Route name is required', 'danger'); return; }
  if (!driverStaffId) { toast('Please select a driver', 'danger'); return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const data = { schoolId, name, stops, driverStaffId, vehiclePlate, capacity, departureTime, returnTime };

  if (routeId) {
    DB.update('busRoutes', routeId, data);
    toast('Route updated', 'success');
  } else {
    DB.insert('busRoutes', { id: uid('rt'), ...data, createdAt: now() });
    toast('Route added', 'success');
  }
  document.getElementById('modalBackdrop').click();
  APP.go('adm_transport', { tab: 'routes' });
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
      APP.go('adm_transport', { tab: 'routes' });
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
          <select id="as_student" class="input">
            <option value="">— Select student —</option>
            ${students.map(s => {
              const cls = DB.find('classes', s.classId);
              return `<option value="${s.id}">${s.name}${cls ? ' · ' + cls.name : ''}</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label class="input-label">Bus Route *</label>
          <select id="as_route" class="input">
            <option value="">— Select route —</option>
            ${routes.map(r => `<option value="${r.id}">${r.name}${r.vehiclePlate ? ' (' + r.vehiclePlate + ')' : ''}</option>`).join('')}
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
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="adm_saveAssignment()">${icon('check','w-4 h-4')} Assign Student</button>
    `
  });
}

function adm_saveAssignment() {
  const studentId = (document.getElementById('as_student')  || {}).value;
  const routeId   = (document.getElementById('as_route')    || {}).value;
  const direction = (document.getElementById('as_direction') || {}).value;

  if (!studentId) { toast('Please select a student', 'danger'); return; }
  if (!routeId)   { toast('Please select a route', 'danger');   return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';

  // Check for existing assignment
  const existing = DB.query('busAssignments', a => a.studentId === studentId);
  if (existing.length) {
    toast('This student already has a bus assignment. Remove the existing one first.', 'danger');
    return;
  }

  DB.insert('busAssignments', {
    id: uid('ba'), schoolId, studentId, routeId, direction, createdAt: now()
  });

  const student = DB.find('students', studentId);
  const route   = DB.find('busRoutes', routeId);
  document.getElementById('modalBackdrop').click();
  APP.go('adm_transport', { tab: 'assign' });
  toast(`${student ? student.name : 'Student'} assigned to ${route ? route.name : 'route'}`, 'success');
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

  const routeStops = route
    ? (Array.isArray(route.stops) ? route.stops : (route.stops || '').split('\n').map(s => s.trim()).filter(Boolean))
    : [];

  const dirLabel = assignment
    ? ({ both: 'Both ways', pickup: 'Morning pickup only', dropoff: 'Afternoon drop-off only' }[assignment.direction] || assignment.direction)
    : '';

  return `
    <div class="space-y-5">
      ${pageHeader({ title: 'Transport & Pickup', subtitle: 'Bus route and authorized pickup persons for your children' })}

      ${children.length > 1 ? `
        <div class="flex gap-2 flex-wrap">
          ${children.map(c => `<button onclick="APP.go('par_transport',{studentId:'${c.id}'})"
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
            ${routeStops.length ? `
              <div class="mt-4">
                <div class="text-xs font-semibold uppercase text-slate-400 mb-2">Route Stops</div>
                <div class="flex flex-wrap gap-1.5">
                  ${routeStops.map((s, i) => `<span class="inline-flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full">
                    <span class="w-4 h-4 bg-brand-700 text-white rounded-full flex items-center justify-center font-bold" style="font-size:9px">${i + 1}</span>
                    ${s}
                  </span>`).join('')}
                </div>
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
          <div class="mb-3 card p-3 bg-amber-50 border border-amber-200">
            <div class="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">${icon('bell','w-4 h-4')} ${pendingPickups.length} pending approval${pendingPickups.length !== 1 ? 's' : ''}</div>
            <div class="space-y-1">
              ${pendingPickups.map(p => `<div class="text-sm text-amber-800 flex items-center gap-2">
                <span class="badge badge-warning">Pending</span>
                <span>${p.name} · ${p.relationship}</span>
              </div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${approvedPickups.length > 0 ? `
          <div class="space-y-2">
            ${approvedPickups.map(p => `
              <div class="card p-4 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600">${icon('check','w-5 h-5')}</div>
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
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
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
