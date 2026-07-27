/* ============================================================================
   Multi-branch — Model A (branch = tenant + group layer)
   ----------------------------------------------------------------------------
   A "school group" owns several branch schools. Each branch is a full tenant
   (isolated by schoolId) that runs unchanged. The group owner logs in, sees a
   consolidated Group Overview, and can "enter" any branch — which re-points
   currentSchoolId() (see admin.js) so every existing per-school module scopes
   to the selected branch automatically. No per-module changes required.
   ============================================================================ */

/* ---------- Group helpers ---------- */
function currentGroupId() {
  const sid = AUTH.current && (AUTH.current.schoolId || AUTH.current.id);
  const school = sid ? DB.find('schools', sid) : null;
  return school ? (school.groupId || null) : null;
}

function isGroupOwner() {
  // The proprietor of a school that belongs to a group. (Principals/finance stay
  // scoped to their own branch; only the owner sees the group layer for this MVP.)
  return !!(AUTH.current && AUTH.current.role === 'schooladmin' && currentGroupId());
}

function groupBranches(groupId) {
  groupId = groupId || currentGroupId();
  if (!groupId) return [];
  return DB.query('schools', s => s.groupId === groupId);
}

function activeBranchId() { return (typeof APP !== 'undefined' && APP._activeBranchId) || null; }
function activeBranch() { const id = activeBranchId(); return id ? DB.find('schools', id) : null; }

function setActiveBranch(id) {
  if (!id || id === '__group') { exitToGroup(); return; }
  APP._activeBranchId = id;
  APP.go('adm_dashboard');
}

function exitToGroup() {
  APP._activeBranchId = null;
  APP.go('grp_overview');
}

/* ---------- Branch switcher bar (rendered in the topbar band) ---------- */
function branchSwitcherBar() {
  if (!isGroupOwner()) return '';
  const grp = DB.find('schoolGroups', currentGroupId());
  const branches = groupBranches();
  const ab = activeBranch();
  return `
    <div class="bg-slate-900 text-white px-4 lg:px-6 py-2 flex items-center justify-between gap-3 text-sm">
      <div class="flex items-center gap-2 min-w-0">
        ${icon('building', 'w-4 h-4 flex-shrink-0')}
        <span class="font-semibold truncate">${grp ? grp.name : 'Group'}</span>
        <span class="text-slate-500">/</span>
        <span class="truncate ${ab ? 'text-white' : 'text-emerald-300'}">${ab ? ab.name : 'All branches (overview)'}</span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <label class="sr-only" for="branchSwitch">Switch branch</label>
        <select id="branchSwitch" class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white" onchange="setActiveBranch(this.value)">
          <option value="__group" ${!ab ? 'selected' : ''}>Group overview</option>
          ${branches.map(b => `<option value="${b.id}" ${ab && ab.id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
    </div>`;
}

/* ---------- On-ramp: promote a standalone school into a group (HQ = first branch) ---------- */
function branchOnrampView() {
  const sid = AUTH.current && (AUTH.current.schoolId || AUTH.current.id);
  const school = DB.find('schools', sid) || {};
  return `
    ${pageHeader({ title: 'Branches', subtitle: 'Run multiple campuses under one group' })}
    <div class="max-w-lg mx-auto card p-6 text-center">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">${icon('building', 'w-7 h-7')}</div>
      <h2 class="text-lg font-bold text-slate-900">Turn on multiple branches</h2>
      <p class="text-slate-500 mt-2 text-sm">Your current school (<strong>${school.name || 'this school'}</strong>) becomes the head office (HQ). You'll get a consolidated overview and can add more branches — each with its own students, staff and fees.</p>
      <button class="btn btn-primary mt-5" onclick="enableBranches()">${icon('check', 'w-4 h-4')} Enable multiple branches</button>
    </div>`;
}

function enableBranches() {
  const sid = AUTH.current && (AUTH.current.schoolId || AUTH.current.id);
  const school = DB.find('schools', sid);
  if (!school) return;
  if (school.groupId) { APP.go('grp_overview'); return; }
  const gid = uid('grp');
  DB.insert('schoolGroups', { id: gid, name: `${school.name || 'My School'} Group`, ownerId: sid, ownerName: school.proprietor || school.name, ownerEmail: school.email || '', createdAt: now() });
  DB.update('schools', sid, { groupId: gid });
  DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: AUTH.current.id, action: 'branches_enabled', target: school.name || sid, timestamp: now() });
  toast('Multiple branches enabled — this school is now your HQ branch.', 'success');
  APP.go('grp_overview');
}

/* ---------- Group Overview (consolidated KPIs across branches) ---------- */
function view_grp_overview() {
  if (!currentGroupId()) return branchOnrampView();       // entitled but not yet enabled
  const grp = DB.find('schoolGroups', currentGroupId());
  const branches = groupBranches();

  let gEnrol = 0, gBilled = 0, gCollected = 0, gOutstanding = 0, gStaff = 0;
  const cards = branches.map(b => {
    const enrol = DB.query('students', s => s.schoolId === b.id && s.status === 'active').length;
    const staff = DB.query('teachers', t => t.schoolId === b.id).length;
    const ft = COMPUTE.feeTotals(b.id);
    gEnrol += enrol; gStaff += staff; gBilled += ft.billed; gCollected += ft.collected; gOutstanding += ft.outstanding;
    return { b, enrol, staff, ft };
  });
  const gRate = COMPUTE.collectionRate(gBilled, gCollected);

  const groupStat = (label, value, sub) => `
    <div class="card p-4">
      <div class="text-xs text-slate-500">${label}</div>
      <div class="text-2xl font-extrabold text-slate-900 mt-1">${value}</div>
      ${sub ? `<div class="text-xs text-slate-400 mt-0.5">${sub}</div>` : ''}
    </div>`;

  const branchCards = cards.map(({ b, enrol, staff, ft }) => `
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style="background:${(b.branding && b.branding.primaryColor) || '#00b386'}">${(b.branding && b.branding.logoText) || b.name.slice(0, 2).toUpperCase()}</div>
          <div class="min-w-0">
            <div class="font-bold text-slate-900 truncate">${b.name}</div>
            <div class="text-xs text-slate-500 truncate">${b.address || ''}</div>
          </div>
        </div>
        ${b.id === 'sch_brightlights' ? '<span class="badge text-xs">HQ</span>' : ''}
      </div>
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="text-center p-2 bg-slate-50 rounded-lg"><div class="font-extrabold text-slate-800">${enrol}</div><div class="text-[11px] text-slate-500">Students</div></div>
        <div class="text-center p-2 bg-slate-50 rounded-lg"><div class="font-extrabold text-slate-800">${staff}</div><div class="text-[11px] text-slate-500">Staff</div></div>
        <div class="text-center p-2 bg-slate-50 rounded-lg"><div class="font-extrabold text-slate-800">${ft.rate}%</div><div class="text-[11px] text-slate-500">Collected</div></div>
      </div>
      <div class="space-y-1.5 mb-3 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">Billed</span><span class="font-mono font-semibold">${money(ft.billed)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Collected</span><span class="font-mono font-semibold text-emerald-700">${money(ft.collected)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Outstanding</span><span class="font-mono font-semibold text-rose-600">${money(ft.outstanding)}</span></div>
      </div>
      <button class="btn btn-primary w-full text-sm" onclick="setActiveBranch('${b.id}')">${icon('arrow_left', 'w-4 h-4 rotate-180')} Enter branch</button>
    </div>`).join('');

  return `
    ${pageHeader({ title: grp ? grp.name : 'Group Overview', subtitle: `Consolidated view across ${branches.length} branch${branches.length === 1 ? '' : 'es'}`, actions: `<button class="btn btn-secondary" onclick="addBranchModal()">${icon('plus','w-4 h-4')} Add Branch</button>` })}
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
      ${groupStat('Branches', branches.length)}
      ${groupStat('Total Students', gEnrol)}
      ${groupStat('Group Billed', money(gBilled))}
      ${groupStat('Group Collected', money(gCollected), `${gRate}% collection`)}
      ${groupStat('Group Outstanding', money(gOutstanding))}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${branchCards}
    </div>
  `;
}

/* ---------- Branch management ---------- */
function view_grp_branches() {
  if (!currentGroupId()) return branchOnrampView();       // entitled but not yet enabled
  const branches = groupBranches();
  const rows = branches.map(b => {
    const enrol = DB.query('students', s => s.schoolId === b.id && s.status === 'active').length;
    return `
      <div class="flex items-center gap-3 p-3 border-b border-slate-100 last:border-0">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style="background:${(b.branding && b.branding.primaryColor) || '#00b386'}">${(b.branding && b.branding.logoText) || b.name.slice(0, 2).toUpperCase()}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-900 truncate">${b.name}</div>
          <div class="text-xs text-slate-500 truncate">${b.address || ''} · ${enrol} students</div>
        </div>
        <span class="badge ${b.status === 'active' ? 'badge-success' : 'badge-warn'} text-xs">${b.status}</span>
        <button class="btn btn-secondary text-xs" onclick="setActiveBranch('${b.id}')">Open</button>
      </div>`;
  }).join('');
  return `
    ${pageHeader({ title: 'Branches', subtitle: 'Schools in this group', actions: `<button class="btn btn-primary" onclick="addBranchModal()">${icon('plus','w-4 h-4')} Add Branch</button>` })}
    <div class="card p-0">${rows || '<div class="p-6 text-center text-slate-500 text-sm">No branches yet.</div>'}</div>
  `;
}

function addBranchModal() {
  if (!isGroupOwner()) return;
  modal({
    title: 'Add Branch',
    body: `
      <div class="space-y-3">
        <p class="text-sm text-slate-600">Create a new branch under <strong>${(DB.find('schoolGroups', currentGroupId()) || {}).name || 'this group'}</strong>. It starts empty — set up its classes, staff, students and fees inside the branch.</p>
        <div><label class="input-label" for="nb_name">Branch name</label><input id="nb_name" class="input" placeholder="e.g. Bright Lights Academy — Yaba" /></div>
        <div><label class="input-label" for="nb_address">Address</label><input id="nb_address" class="input" placeholder="e.g. 10 Herbert Macaulay Way, Yaba, Lagos" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="input-label" for="nb_email">Contact email</label><input id="nb_email" class="input" placeholder="branch@school.ng" /></div>
          <div><label class="input-label" for="nb_phone">Phone</label><input id="nb_phone" class="input" placeholder="+234 ..." /></div>
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveNewBranch()">${icon('check','w-4 h-4')} Create Branch</button>`
  });
}

function saveNewBranch() {
  const name = (document.getElementById('nb_name').value || '').trim();
  const address = (document.getElementById('nb_address').value || '').trim();
  const email = (document.getElementById('nb_email').value || '').trim();
  const phone = (document.getElementById('nb_phone').value || '').trim();
  if (!name) { toast('Enter a branch name', 'danger'); return; }
  const groupId = currentGroupId();
  const hq = DB.find('schools', (DB.find('schoolGroups', groupId) || {}).ownerId) || {};
  const id = uid('sch');
  const logoText = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'BR';
  DB.insert('schools', {
    id, groupId, name, proprietor: hq.proprietor || (DB.find('schoolGroups', groupId) || {}).ownerName || '', email, phone, address,
    students: 0, teachers: 0, subscriptionPlan: hq.subscriptionPlan || 'Professional', monthlyFee: hq.monthlyFee || 0,
    status: 'active', joinedAt: now(), autoRenew: true,
    branding: { primaryColor: (hq.branding && hq.branding.primaryColor) || '#00b386', logoText, motto: (hq.branding && hq.branding.motto) || '', logoImage: null }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: id, actor: AUTH.current.id, action: 'branch_created', target: name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast(`Branch "${name}" created`, 'success');
  APP.go('grp_overview');
}
