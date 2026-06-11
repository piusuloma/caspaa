/* ============================================================
   HOUSE POINTS MODULE
   - Admin creates/manages houses and assigns students
   - Teacher awards points from their class roster
   - Student sees own points and house leaderboard
   - Parent sees child's house standing
   ============================================================ */

const HP_CATEGORIES = ['Academic', 'Sports', 'Conduct', 'Community Service', 'Arts'];

function house_totals(schoolId) {
  const hs = DB.query('houses', h => h.schoolId === schoolId);
  const pts = DB.get('housePoints');
  return hs.map(h => ({
    ...h,
    total: pts.filter(p => p.houseId === h.id).reduce((s, p) => s + p.points, 0)
  })).sort((a,b) => b.total - a.total);
}

function house_studentPoints(studentId) {
  return DB.query('housePoints', p => p.studentId === studentId)
           .reduce((s, p) => s + p.points, 0);
}

// ── Admin: manage houses ──────────────────────────────────────

function view_adm_houses(params) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const tab = (params && params.tab) || 'leaderboard';

  const tabBar = `<div class="flex gap-1 mb-5 border-b border-slate-200">
    ${[['leaderboard','Leaderboard'],['students','Student Assignments'],['manage','Manage Houses'],['history','Points History']].map(([k,l]) =>
      `<button onclick="APP.go('adm_houses',{tab:'${k}'})" class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}">${l}</button>`
    ).join('')}
  </div>`;

  const totals = house_totals(schoolId);

  if (tab === 'leaderboard') {
    return `
      ${pageHeader({ title: 'House Points', subtitle: 'Inter-house competition standings',
        actions: `<button class="btn btn-primary" onclick="hp_awardModal(null,'admin')">${icon('plus','w-4 h-4')} Award Points</button>` })}
      ${tabBar}
      ${renderLeaderboard(totals, schoolId, true)}
    `;
  }

  if (tab === 'students') {
    const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
    return `
      ${pageHeader({ title: 'House Points', subtitle: 'Assign students to houses',
        actions: `<button class="btn btn-primary" onclick="hp_bulkAssignModal()">${icon('edit','w-4 h-4')} Bulk Assign</button>` })}
      ${tabBar}
      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr><th>Student</th><th>Class</th><th>House</th><th>Personal Points</th><th></th></tr></thead>
          <tbody>
            ${students.map(s => {
              const cls = DB.find('classes', s.classId);
              const house = s.houseId ? DB.find('houses', s.houseId) : null;
              const pts = house_studentPoints(s.id);
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s,'sm')}<span class="font-semibold">${s.name}</span></div></td>
                <td>${cls ? cls.name : '—'}</td>
                <td>${house ? `<span class="font-bold" style="color:${house.color}">${house.icon} ${house.name}</span>` : '<span class="text-slate-400">Unassigned</span>'}</td>
                <td><span class="font-bold text-slate-900">${pts}</span></td>
                <td><button class="btn btn-secondary text-xs py-1 px-2" onclick="hp_assignHouseModal('${s.id}')">Change House</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (tab === 'manage') {
    const houses = DB.query('houses', h => h.schoolId === schoolId);
    return `
      ${pageHeader({ title: 'House Points', subtitle: 'Create and configure houses',
        actions: `<button class="btn btn-primary" onclick="hp_createHouseModal()">${icon('plus','w-4 h-4')} Create House</button>` })}
      ${tabBar}
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${houses.map(h => {
          const members = DB.query('students', s => s.houseId === h.id && s.status === 'active');
          const pts = DB.query('housePoints', p => p.houseId === h.id).reduce((s,p) => s+p.points, 0);
          return `<div class="card p-5 text-center">
            <div class="text-4xl mb-2">${h.icon}</div>
            <h3 class="font-bold text-slate-900 text-lg" style="color:${h.color}">${h.name}</h3>
            <div class="text-xs text-slate-400 italic mb-3">${h.motto}</div>
            <div class="grid grid-cols-2 gap-2 mb-4">
              <div class="bg-slate-50 rounded-xl p-2">
                <div class="text-xl font-bold text-slate-900">${pts}</div>
                <div class="text-xs text-slate-500">Points</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-2">
                <div class="text-xl font-bold text-slate-900">${members.length}</div>
                <div class="text-xs text-slate-500">Members</div>
              </div>
            </div>
            <button class="btn btn-secondary text-sm w-full" onclick="hp_editHouseModal('${h.id}')">Edit</button>
          </div>`;
        }).join('')}
        ${houses.length === 0 ? emptyState({ title: 'No houses yet', body: 'Create your school\'s houses to start the inter-house competition.', icon: 'students' }) : ''}
      </div>
    `;
  }

  // History tab
  const allPoints = DB.query('housePoints', p => {
    const s = DB.find('students', p.studentId);
    return s && s.schoolId === schoolId;
  }).sort((a,b) => b.awardedAt.localeCompare(a.awardedAt)).slice(0, 50);

  return `
    ${pageHeader({ title: 'House Points', subtitle: 'Full points history (last 50 entries)' })}
    ${tabBar}
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Student</th><th>House</th><th>Points</th><th>Category</th><th>Reason</th><th>Awarded By</th><th>Date</th></tr></thead>
        <tbody>
          ${allPoints.map(p => {
            const s = DB.find('students', p.studentId);
            const h = DB.find('houses', p.houseId);
            const t = DB.find('teachers', p.awardedBy);
            return `<tr>
              <td>${s ? s.name : '—'}</td>
              <td>${h ? `<span style="color:${h.color}" class="font-bold">${h.icon} ${h.name}</span>` : '—'}</td>
              <td><span class="badge badge-success">+${p.points}</span></td>
              <td><span class="badge badge-neutral">${p.category}</span></td>
              <td class="max-w-xs truncate text-sm">${p.reason}</td>
              <td class="text-sm">${t ? t.name : '—'}</td>
              <td class="text-xs text-slate-400">${fdate(p.awardedAt, {short:true})}</td>
            </tr>`;
          }).join('')}
          ${allPoints.length === 0 ? `<tr><td colspan="7" class="text-center text-slate-400 py-8">No points awarded yet.</td></tr>` : ''}
        </tbody>
      </table>
    </div>
  `;
}

function renderLeaderboard(totals, schoolId, isAdmin) {
  const medals = ['🥇','🥈','🥉'];
  return `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${totals.map((h,i) => `<div class="card p-5 text-center ${i === 0 ? 'ring-2 ring-amber-400' : ''}">
        <div class="text-2xl mb-1">${medals[i] || h.icon}</div>
        <div class="text-3xl font-extrabold mb-1" style="color:${h.color}">${h.total}</div>
        <div class="font-bold text-slate-900">${h.name}</div>
        <div class="text-xs text-slate-400">pts · ${i === 0 ? '1st place' : i === 1 ? '2nd place' : i === 2 ? '3rd place' : '4th place'}</div>
        ${totals[0].total > 0 ? `<div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all" style="background:${h.color};width:${Math.round(h.total/totals[0].total*100)}%"></div>
        </div>` : ''}
      </div>`).join('')}
    </div>
    ${isAdmin ? `<div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Rank</th><th>House</th><th>Total Points</th><th>Members</th><th>Avg Points/Member</th></tr></thead>
        <tbody>
          ${totals.map((h,i) => {
            const members = DB.query('students', s => s.houseId === h.id && s.status === 'active');
            const avg = members.length ? Math.round(h.total / members.length * 10)/10 : 0;
            return `<tr>
              <td class="font-bold text-lg">${medals[i] || i+1}</td>
              <td><span class="font-bold" style="color:${h.color}">${h.icon} ${h.name}</span></td>
              <td><span class="text-2xl font-extrabold" style="color:${h.color}">${h.total}</span></td>
              <td>${members.length}</td>
              <td>${avg}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `;
}

function hp_assignHouseModal(studentId) {
  const s = DB.find('students', studentId);
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const houses = DB.query('houses', h => h.schoolId === schoolId);
  modal({
    title: `Assign House — ${s ? s.name : ''}`,
    body: `<div class="grid grid-cols-2 gap-3">
      ${houses.map(h => `<button onclick="hp_doAssign('${studentId}','${h.id}')" class="card p-4 text-center hover:shadow-md transition-shadow ${s && s.houseId === h.id ? 'ring-2 ring-brand-500' : ''}">
        <div class="text-2xl">${h.icon}</div>
        <div class="font-bold mt-1" style="color:${h.color}">${h.name}</div>
        ${s && s.houseId === h.id ? '<div class="text-xs text-brand-600 mt-1">Current</div>' : ''}
      </button>`).join('')}
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>`
  });
}

function hp_doAssign(studentId, houseId) {
  DB.update('students', studentId, { houseId });
  document.getElementById('modalBackdrop').click();
  APP.render();
  const h = DB.find('houses', houseId);
  toast(`Student assigned to ${h ? h.name : 'house'}`, 'success');
}

function hp_createHouseModal() {
  modal({
    title: 'Create House',
    body: `<div class="space-y-3">
      <div><label class="input-label">House Name *</label><input id="hc_name" class="input" placeholder="e.g. Red House, Eagle House"></div>
      <div><label class="input-label">Icon / Emoji</label><input id="hc_icon" class="input" placeholder="e.g. 🔴 🦅 ⚡" value="🏠"></div>
      <div><label class="input-label">Colour (hex)</label><input id="hc_color" type="color" class="input h-12" value="#047857"></div>
      <div><label class="input-label">Motto</label><input id="hc_motto" class="input" placeholder="e.g. Courage and Integrity"></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_saveHouse()">Create House</button>`
  });
}

function hp_saveHouse() {
  const name = (document.getElementById('hc_name') || {}).value.trim();
  if (!name) { toast('House name required', 'danger'); return; }
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  DB.insert('houses', {
    id: uid('house'), schoolId, name,
    icon: (document.getElementById('hc_icon') || {}).value.trim() || '🏠',
    color: (document.getElementById('hc_color') || {}).value || '#047857',
    motto: (document.getElementById('hc_motto') || {}).value.trim() || ''
  });
  document.getElementById('modalBackdrop').click();
  APP.go('adm_houses', { tab: 'manage' });
  toast('House created', 'success');
}

function hp_editHouseModal(houseId) {
  const h = DB.find('houses', houseId);
  if (!h) return;
  confirm(`Delete "${h.name}"? All point records for this house will be preserved in history.`, () => {
    DB.remove('houses', houseId);
    APP.go('adm_houses', { tab: 'manage' });
    toast('House deleted');
  }, { danger: true, yesLabel: 'Delete House' });
}

function hp_bulkAssignModal() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const houses = DB.query('houses', h => h.schoolId === schoolId);
  const classes = DB.query('classes', c => c.schoolId === schoolId);
  modal({
    title: 'Bulk Assign Class to House',
    body: `<div class="space-y-3">
      <p class="text-sm text-slate-500">Assign all students in a class to a house at once.</p>
      <div><label class="input-label">Class</label>
        <select id="ba_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div><label class="input-label">House</label>
        <select id="ba_house" class="input">${houses.map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('')}</select></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_doBulkAssign()">Assign</button>`
  });
}

function hp_doBulkAssign() {
  const classId  = (document.getElementById('ba_class') || {}).value;
  const houseId  = (document.getElementById('ba_house') || {}).value;
  if (!classId || !houseId) { toast('Select a class and house', 'danger'); return; }
  const students = COMPUTE.studentsByClass(classId);
  students.forEach(s => DB.update('students', s.id, { houseId }));
  document.getElementById('modalBackdrop').click();
  APP.go('adm_houses', { tab: 'students' });
  const h = DB.find('houses', houseId);
  toast(`${students.length} students assigned to ${h ? h.name : 'house'}`, 'success');
}

// ── Teacher: award points ─────────────────────────────────────

function hp_awardModal(studentId, context) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  let studentOptions = '';
  if (!studentId) {
    const classes = context === 'admin' ? DB.query('classes', c => c.schoolId === schoolId) : teacherClasses();
    const students = [];
    classes.forEach(c => COMPUTE.studentsByClass(c.id).forEach(s => students.push(s)));
    studentOptions = students.map(s => {
      const h = s.houseId ? DB.find('houses', s.houseId) : null;
      return `<option value="${s.id}">${s.name}${h ? ` (${h.name})` : ''}`;
    }).join('');
  }

  modal({
    title: 'Award House Points',
    body: `<div class="space-y-3">
      ${!studentId ? `<div><label class="input-label">Student</label>
        <select id="ha_student" class="input">${studentOptions}</select></div>` : `<input type="hidden" id="ha_student" value="${studentId}">`}
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Points (1–5)</label>
          <select id="ha_pts" class="input">
            ${[1,2,3,4,5].map(n => `<option value="${n}">${n} point${n>1?'s':''}</option>`).join('')}
          </select></div>
        <div><label class="input-label">Category</label>
          <select id="ha_cat" class="input">${HP_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></div>
      </div>
      <div><label class="input-label">Reason / Note *</label>
        <input id="ha_reason" class="input" placeholder="e.g. Best essay in class, Perfect attendance this week..."></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_savePoints()">Award Points</button>`
  });
}

function hp_savePoints() {
  const studentId = (document.getElementById('ha_student') || {}).value;
  const reason    = (document.getElementById('ha_reason')  || {}).value.trim();
  const pts       = parseInt((document.getElementById('ha_pts') || {}).value) || 1;
  const cat       = (document.getElementById('ha_cat') || {}).value;
  if (!studentId || !reason) { toast('Student and reason required', 'danger'); return; }

  const s = DB.find('students', studentId);
  if (!s || !s.houseId) { toast('This student is not assigned to a house. Please assign one first.', 'warn'); return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  DB.insert('housePoints', {
    id: uid('hp'), schoolId,
    studentId, houseId: s.houseId,
    points: pts, reason, category: cat,
    awardedBy: AUTH.current.id, awardedAt: now()
  });

  // Notify student
  const house = DB.find('houses', s.houseId);
  DB.insert('notifications', {
    id: uid('not'), userId: studentId,
    title: 'House Points Awarded!',
    body: `You earned ${pts} point${pts>1?'s':''} for ${house ? house.name : 'your house'}! Reason: ${reason}`,
    type: 'info', read: false, timestamp: now(),
    link: { view: 'stu_houses', params: {} }
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${pts} point${pts>1?'s':''} awarded to ${s.name} — ${house ? house.name : ''}`, 'success');
}

// Quick award from teacher class roster (called with studentId inline)
function tch_awardHousePoint(studentId) {
  hp_awardModal(studentId, 'teacher');
}

// ── Student: house leaderboard + own points ───────────────────

function view_stu_houses() {
  const s = me();
  const schoolId = s.schoolId || 'sch_brightlights';
  const totals = house_totals(schoolId);
  const myHouse = s.houseId ? DB.find('houses', s.houseId) : null;
  const myPoints = house_studentPoints(s.id);
  const myHouseRank = myHouse ? totals.findIndex(h => h.id === myHouse.id) + 1 : null;
  const myPointHistory = DB.query('housePoints', p => p.studentId === s.id).sort((a,b) => b.awardedAt.localeCompare(a.awardedAt));

  return `
    ${pageHeader({ title: 'House Points', subtitle: 'Inter-house leaderboard and your personal points' })}

    ${myHouse ? `<div class="card p-5 mb-5" style="border-left: 4px solid ${myHouse.color}">
      <div class="flex items-center gap-4">
        <div class="text-5xl">${myHouse.icon}</div>
        <div>
          <div class="text-xs font-semibold uppercase text-slate-400">Your House</div>
          <div class="text-2xl font-extrabold" style="color:${myHouse.color}">${myHouse.name}</div>
          <div class="text-sm text-slate-500 italic">${myHouse.motto}</div>
        </div>
        <div class="ml-auto text-right">
          <div class="text-3xl font-extrabold text-slate-900">${myPoints}</div>
          <div class="text-xs text-slate-400">Your points</div>
          <div class="text-sm font-semibold mt-1" style="color:${myHouse.color}">${['🥇 1st','🥈 2nd','🥉 3rd','4th'][myHouseRank-1] || myHouseRank + 'th'} place overall</div>
        </div>
      </div>
    </div>` : `<div class="card p-4 mb-5 text-sm text-slate-500">You haven't been assigned to a house yet. Ask your class teacher.</div>`}

    ${renderLeaderboard(totals, schoolId, false)}

    ${myPointHistory.length ? `<div class="mt-6">
      <h3 class="font-bold text-slate-700 mb-3">Your Points History</h3>
      <div class="space-y-2">
        ${myPointHistory.map(p => {
          const t = DB.find('teachers', p.awardedBy);
          return `<div class="card p-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center font-bold text-amber-600 flex-shrink-0">+${p.points}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900 text-sm">${p.reason}</div>
              <div class="text-xs text-slate-400">${p.category} · ${t ? t.name : 'Teacher'} · ${fdate(p.awardedAt, {short:true})}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}

// ── Parent: child's house standing ───────────────────────────

function view_par_houses() {
  const parentId = AUTH.current.id;
  const children = COMPUTE.parentChildren(parentId).filter(c => c.status === 'active');
  const schoolId = children.length ? children[0].schoolId : 'sch_brightlights';
  const totals = house_totals(schoolId);

  return `
    ${pageHeader({ title: 'House Points', subtitle: 'Your children\'s house standing and leaderboard' })}

    ${children.map(child => {
      const myHouse = child.houseId ? DB.find('houses', child.houseId) : null;
      const myPoints = house_studentPoints(child.id);
      const myHouseRank = myHouse ? totals.findIndex(h => h.id === myHouse.id) + 1 : null;
      const history = DB.query('housePoints', p => p.studentId === child.id).sort((a,b) => b.awardedAt.localeCompare(a.awardedAt)).slice(0,5);
      return `<div class="card p-5 mb-4">
        <div class="flex items-center gap-3 mb-4">
          ${avatar(child, 'md')}
          <div>
            <div class="font-bold text-slate-900">${child.name}</div>
            ${myHouse ? `<div class="text-sm font-semibold" style="color:${myHouse.color}">${myHouse.icon} ${myHouse.name} · ${['🥇 1st','🥈 2nd','🥉 3rd','4th'][myHouseRank-1]||myHouseRank+'th'} place</div>` : '<div class="text-sm text-slate-400">Not assigned to a house</div>'}
          </div>
          <div class="ml-auto text-right">
            <div class="text-3xl font-extrabold text-slate-900">${myPoints}</div>
            <div class="text-xs text-slate-400">points this term</div>
          </div>
        </div>
        ${history.length ? history.map(p => {
          const t = DB.find('teachers', p.awardedBy);
          return `<div class="flex items-center gap-2 py-2 border-t border-slate-100">
            <span class="w-7 h-7 bg-amber-50 rounded-full flex items-center justify-center text-xs font-bold text-amber-600">+${p.points}</span>
            <span class="text-sm flex-1">${p.reason}</span>
            <span class="text-xs text-slate-400">${fdate(p.awardedAt, {short:true})}</span>
          </div>`;
        }).join('') : '<div class="text-sm text-slate-400 pt-2">No points earned yet.</div>'}
      </div>`;
    }).join('')}

    <h3 class="font-bold text-slate-700 mb-3 mt-2">Overall Leaderboard</h3>
    ${renderLeaderboard(totals, schoolId, false)}
  `;
}
