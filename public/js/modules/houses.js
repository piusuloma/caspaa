/* ============================================================
   HOUSE POINTS MODULE
   Real-life flow:
   - Admin creates houses, assigns students, records inter-house events
   - Teacher awards OR deducts points from class roster
   - Student sees own standing and school leaderboard
   - Parent sees child's house standing
   ============================================================ */

const HP_CATEGORIES = ['Academic', 'Sports', 'Conduct', 'Community Service', 'Arts & Culture'];

const HP_EVENT_TYPES = ['Sports Day', 'Quiz Competition', 'Debate', 'Cultural Day', 'Drama', 'Spelling Bee', 'Mathematics Olympiad', 'Other'];

// Default points per position in a competition
const HP_EVENT_POSITIONS = [
  { pos: 1, label: '1st Place', points: 50 },
  { pos: 2, label: '2nd Place', points: 35 },
  { pos: 3, label: '3rd Place', points: 20 },
  { pos: 4, label: '4th Place', points: 10 }
];

function house_totals(schoolId) {
  const hs = DB.query('houses', h => h.schoolId === schoolId);
  const pts = DB.query('housePoints', p => p.schoolId === schoolId);
  const events = DB.query('houseEvents', e => e.schoolId === schoolId);

  return hs.map(h => {
    const individualPts = pts.filter(p => p.houseId === h.id).reduce((s, p) => s + p.points, 0);
    const eventPts = events.reduce((sum, e) => {
      const pos = (e.results || []).find(r => r.houseId === h.id);
      return sum + (pos ? pos.points : 0);
    }, 0);
    return { ...h, total: individualPts + eventPts, individualPts, eventPts };
  }).sort((a, b) => b.total - a.total);
}

function house_studentPoints(studentId) {
  return DB.query('housePoints', p => p.studentId === studentId)
           .reduce((s, p) => s + p.points, 0);
}

// ── Admin ──────────────────────────────────────────────────────

function view_adm_houses(params) {
  const schoolId = currentSchoolId();
  const tab = APP.params.housesTab || 'leaderboard';

  const events = DB.query('houseEvents', e => e.schoolId === schoolId);
  const pendingBadge = 0; // all events are recorded, not pending

  const tabBar = `<div class="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
    ${[
      ['leaderboard', 'Leaderboard'],
      ['events',      `Competitions${events.length ? ` (${events.length})` : ''}`],
      ['students',    'Student Assignments'],
      ['manage',      'Houses'],
      ['history',     'Points Log']
    ].map(([k, l]) =>
      `<button onclick="APP.params.housesTab='${k}';APP.render()" class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}">${l}</button>`
    ).join('')}
  </div>`;

  const totals = house_totals(schoolId);

  // ── Leaderboard ──
  if (tab === 'leaderboard') {
    return `
      ${pageHeader({ title: 'Inter House Points', subtitle: 'Inter-house competition standings',
        actions: `<button class="btn btn-primary" onclick="hp_awardModal(null,'admin')">${icon('plus', 'w-4 h-4')} Award / Deduct Points</button>` })}
      ${tabBar}
      ${renderLeaderboard(totals, schoolId, true)}
    `;
  }

  // ── Competitions / Events ──
  if (tab === 'events') {
    const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));
    const houses = DB.query('houses', h => h.schoolId === schoolId);
    return `
      ${pageHeader({ title: 'Inter-House Competitions', subtitle: 'Record sports day, quiz, debate and other events',
        actions: `<button class="btn btn-primary" onclick="hp_recordEventModal()">${icon('plus', 'w-4 h-4')} Record Event</button>` })}
      ${tabBar}
      ${sorted.length === 0 ? emptyState({ icon: 'results', title: 'No competitions recorded yet', body: 'Record inter-house events like Sports Day, Quiz, Debate — each event awards bulk points to houses based on their placing.' }) : `
        <div class="space-y-4">
          ${sorted.map(ev => {
            const results = (ev.results || []).sort((a, b) => a.position - b.position);
            const medals = ['🥇', '🥈', '🥉', '4️⃣'];
            return `<div class="card p-5">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div class="font-bold text-slate-900 text-lg">${ev.name}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="badge badge-neutral">${ev.type}</span>
                    <span class="text-xs text-slate-500">${fdate(ev.date, { long: true })}</span>
                  </div>
                </div>
                <button class="btn btn-danger text-xs py-1 px-3" onclick="hp_deleteEvent('${ev.id}')">Delete</button>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                ${results.map((r, i) => {
                  const h = houses.find(h => h.id === r.houseId);
                  return h ? `<div class="text-center p-3 rounded-xl bg-slate-50">
                    <div class="text-2xl mb-1">${medals[i] || (i + 1)}</div>
                    <div class="font-bold text-sm" style="color:${h.color}">${h.icon} ${h.name}</div>
                    <div class="text-xs text-slate-500 mt-1">+${r.points} pts</div>
                  </div>` : '';
                }).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  // ── Student Assignments ──
  if (tab === 'students') {
    const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
    return `
      ${pageHeader({ title: 'Student House Assignments', subtitle: 'Assign students to houses',
        actions: `<button class="btn btn-primary" onclick="hp_bulkAssignModal()">${icon('edit', 'w-4 h-4')} Bulk Assign Class</button>` })}
      ${tabBar}
      <div class="card overflow-hidden">
        <table class="tbl">
          <th scope="col"ead><tr><th scope="col">Student</th><th scope="col">Class</th><th scope="col">House</th><th scope="col">Personal Points</th><th scope="col"></th></tr></thead>
          <tbody>
            ${students.map(s => {
              const cls = DB.find('classes', s.classId);
              const house = s.houseId ? DB.find('houses', s.houseId) : null;
              const pts = house_studentPoints(s.id);
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s, 'sm')}<span class="font-semibold">${s.name}</span></div></td>
                <td>${cls ? cls.name : '—'}</td>
                <td>${house ? `<span class="font-bold" style="color:${house.color}">${house.icon} ${house.name}</span>` : '<span class="text-slate-500 text-sm">Unassigned</span>'}</td>
                <td><span class="font-bold text-slate-900">${pts}</span></td>
                <td><button class="btn btn-secondary text-xs py-1 px-2" onclick="hp_assignHouseModal('${s.id}')">Change House</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── Manage Houses ──
  if (tab === 'manage') {
    const houses = DB.query('houses', h => h.schoolId === schoolId);
    return `
      ${pageHeader({ title: 'Manage Houses', subtitle: 'Create and configure school houses',
        actions: `<button class="btn btn-primary" onclick="hp_createHouseModal()">${icon('plus', 'w-4 h-4')} Create House</button>` })}
      ${tabBar}
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${houses.map(h => {
          const members = DB.query('students', s => s.houseId === h.id && s.status === 'active');
          const pts = DB.query('housePoints', p => p.houseId === h.id).reduce((s, p) => s + p.points, 0);
          const evtPts = DB.query('houseEvents', e => e.schoolId === schoolId).reduce((sum, e) => {
            const r = (e.results || []).find(r => r.houseId === h.id);
            return sum + (r ? r.points : 0);
          }, 0);
          return `<div class="card p-5 text-center">
            <div class="text-4xl mb-2">${h.icon}</div>
            <h3 class="font-bold text-lg mb-0.5" style="color:${h.color}">${h.name}</h3>
            <div class="text-xs text-slate-500 italic mb-4">${h.motto || ''}</div>
            <div class="grid grid-cols-2 gap-2 mb-4 text-center">
              <div class="bg-slate-50 rounded-xl p-2">
                <div class="text-xl font-bold text-slate-900">${pts + evtPts}</div>
                <div class="text-xs text-slate-500">Total pts</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-2">
                <div class="text-xl font-bold text-slate-900">${members.length}</div>
                <div class="text-xs text-slate-500">Members</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary text-sm flex-1" onclick="hp_editHouseModal('${h.id}')">Edit</button>
              <button class="btn btn-danger text-sm" onclick="hp_deleteHouseModal('${h.id}')" aria-label="Delete house" title="Delete house">${icon('trash', 'w-4 h-4')}</button>
            </div>
          </div>`;
        }).join('')}
        ${houses.length === 0 ? emptyState({ title: 'No houses yet', body: "Create your school's houses to start the inter-house competition.", icon: 'students' }) : ''}
      </div>
    `;
  }

  // ── Points Log ──
  const allPoints = DB.query('housePoints', p => {
    const s = DB.find('students', p.studentId);
    return s && s.schoolId === schoolId;
  }).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)).slice(0, 100);

  return `
    ${pageHeader({ title: 'Points Log', subtitle: 'Individual award and deduction history' })}
    ${tabBar}
    <div class="card overflow-hidden">
      <table class="tbl">
        <th scope="col"ead><tr><th scope="col">Student</th><th scope="col">House</th><th scope="col">Points</th><th scope="col">Category</th><th scope="col">Reason</th><th scope="col">By</th><th scope="col">Date</th></tr></thead>
        <tbody>
          ${allPoints.map(p => {
            const s = DB.find('students', p.studentId);
            const h = DB.find('houses', p.houseId);
            const t = DB.find('teachers', p.awardedBy);
            const isNeg = p.points < 0;
            return `<tr>
              <td>${s ? s.name : '—'}</td>
              <td>${h ? `<span style="color:${h.color}" class="font-bold">${h.icon} ${h.name}</span>` : '—'}</td>
              <td><span class="badge ${isNeg ? 'badge-danger' : 'badge-success'}">${isNeg ? '' : '+'}${p.points}</span></td>
              <td><span class="badge badge-neutral">${p.category}</span></td>
              <td class="max-w-xs truncate text-sm">${p.reason}</td>
              <td class="text-sm">${t ? t.name : '—'}</td>
              <td class="text-xs text-slate-500">${fdate(p.awardedAt, { short: true })}</td>
            </tr>`;
          }).join('')}
          ${allPoints.length === 0 ? `<tr><td colspan="7" class="text-center text-slate-500 py-8">No points recorded yet.</td></tr>` : ''}
        </tbody>
      </table>
    </div>
  `;
}

// ── Shared leaderboard renderer ──────────────────────────────

function renderLeaderboard(totals, schoolId, isAdmin) {
  const medals = ['🥇', '🥈', '🥉'];
  return `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${totals.map((h, i) => `<div class="card p-5 text-center ${i === 0 ? 'ring-2 ring-amber-400' : ''}">
        <div class="text-3xl mb-1">${medals[i] || h.icon}</div>
        <div class="text-4xl font-extrabold mb-1" style="color:${h.color}">${h.total}</div>
        <div class="font-bold text-slate-900">${h.name}</div>
        <div class="text-xs text-slate-500 mb-3">${i === 0 ? '1st place' : i === 1 ? '2nd place' : i === 2 ? '3rd place' : '4th place'}</div>
        ${totals[0].total > 0 ? `<div class="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all" style="background:${h.color};width:${Math.round(h.total / totals[0].total * 100)}%"></div>
        </div>` : ''}
        ${h.individualPts !== undefined ? `<div class="mt-3 text-xs text-slate-500">${h.individualPts} merit pts · ${h.eventPts} competition pts</div>` : ''}
      </div>`).join('')}
    </div>
    ${isAdmin ? `<div class="card overflow-hidden">
      <table class="tbl">
        <th scope="col"ead><tr><th scope="col">Rank</th><th scope="col">House</th><th scope="col">Total Points</th><th scope="col">Merit (Individual)</th><th scope="col">Competition Events</th><th scope="col">Members</th></tr></thead>
        <tbody>
          ${totals.map((h, i) => {
            const members = DB.query('students', s => s.houseId === h.id && s.status === 'active');
            return `<tr>
              <td class="font-bold text-lg">${medals[i] || i + 1}</td>
              <td><span class="font-bold" style="color:${h.color}">${h.icon} ${h.name}</span></td>
              <td><span class="text-2xl font-extrabold" style="color:${h.color}">${h.total}</span></td>
              <td class="text-slate-600">${h.individualPts !== undefined ? h.individualPts : '—'}</td>
              <td class="text-slate-600">${h.eventPts !== undefined ? h.eventPts : '—'}</td>
              <td>${members.length}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `;
}

// ── House CRUD ───────────────────────────────────────────────

function hp_createHouseModal() {
  modal({
    title: 'Create House',
    body: `<div class="space-y-3">
      <div><label class="input-label" for="hc_name">House Name <span class="text-rose-500">*</span></label><input id="hc_name" class="input" placeholder="e.g. Eagle House, Red House"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label" for="hc_icon">Icon / Emoji</label><input id="hc_icon" class="input" placeholder="e.g. 🦅 🔴 ⚡" value="🏠"></div>
        <div><label class="input-label" for="hc_color">Colour</label><input id="hc_color" type="color" class="input h-11" value="#00b386"></div>
      </div>
      <div><label class="input-label" for="hc_motto">Motto</label><input id="hc_motto" class="input" placeholder="e.g. Courage and Integrity"></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_saveHouse(null)">Create House</button>`
  });
}

function hp_editHouseModal(houseId) {
  const h = DB.find('houses', houseId);
  if (!h) return;
  modal({
    title: `Edit House — ${h.name}`,
    body: `<div class="space-y-3">
      <div><label class="input-label" for="hc_name">House Name <span class="text-rose-500">*</span></label><input id="hc_name" class="input" value="${h.name}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label" for="hc_icon">Icon / Emoji</label><input id="hc_icon" class="input" value="${h.icon || '🏠'}"></div>
        <div><label class="input-label" for="hc_color">Colour</label><input id="hc_color" type="color" class="input h-11" value="${h.color || '#00b386'}"></div>
      </div>
      <div><label class="input-label" for="hc_motto">Motto</label><input id="hc_motto" class="input" value="${h.motto || ''}"></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_saveHouse('${houseId}')">Save Changes</button>`
  });
}

function hp_saveHouse(houseId) {
  const name = (document.getElementById('hc_name') || {}).value.trim();
  if (!name) { toast('House name is required', 'danger'); return; }
  const schoolId = currentSchoolId();
  const payload = {
    name,
    icon:  (document.getElementById('hc_icon')  || {}).value.trim() || '🏠',
    color: (document.getElementById('hc_color') || {}).value || '#00b386',
    motto: (document.getElementById('hc_motto') || {}).value.trim() || ''
  };
  if (houseId) {
    DB.update('houses', houseId, payload);
    toast('House updated', 'success');
  } else {
    DB.insert('houses', { id: uid('house'), schoolId, ...payload });
    toast('House created', 'success');
  }
  document.getElementById('modalBackdrop').click();
  APP.params.housesTab = 'manage';
  APP.render();
}

function hp_deleteHouseModal(houseId) {
  const h = DB.find('houses', houseId);
  if (!h) return;
  confirmDialog(`Delete "${h.name}"? All point records for this house will be preserved in the log.`, () => {
    DB.remove('houses', houseId);
    APP.params.housesTab = 'manage';
    APP.render();
    toast('House deleted', 'info');
  }, { danger: true, yesLabel: 'Delete House' });
}

// ── Assign students to houses ─────────────────────────────────

function hp_assignHouseModal(studentId) {
  const s = DB.find('students', studentId);
  const schoolId = currentSchoolId();
  const houses = DB.query('houses', h => h.schoolId === schoolId);
  modal({
    title: `Assign House — ${s ? s.name : ''}`,
    body: `<div class="grid grid-cols-2 gap-3">
      ${houses.map(h => `<button onclick="hp_doAssign('${studentId}','${h.id}')" class="card p-5 text-center hover:shadow-md transition-shadow ${s && s.houseId === h.id ? 'ring-2 ring-brand-500' : ''}">
        <div class="text-3xl">${h.icon}</div>
        <div class="font-bold mt-1" style="color:${h.color}">${h.name}</div>
        <div class="text-xs text-slate-500 italic mt-0.5">${h.motto || ''}</div>
        ${s && s.houseId === h.id ? '<div class="text-xs text-brand-600 mt-1 font-semibold">Current</div>' : ''}
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

function hp_bulkAssignModal() {
  const schoolId = currentSchoolId();
  const houses = DB.query('houses', h => h.schoolId === schoolId);
  const classes = DB.query('classes', c => c.schoolId === schoolId);
  modal({
    title: 'Bulk Assign Class to House',
    body: `<div class="space-y-3">
      <p class="text-sm text-slate-500">Assigns all students in a class to the selected house at once.</p>
      <div><label class="input-label" for="ba_class">Class</label>
        <select id="ba_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div><label class="input-label" for="ba_house">House</label>
        <select id="ba_house" class="input">${houses.map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('')}</select></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_doBulkAssign()">Assign</button>`
  });
}

function hp_doBulkAssign() {
  const classId = (document.getElementById('ba_class') || {}).value;
  const houseId = (document.getElementById('ba_house') || {}).value;
  if (!classId || !houseId) { toast('Select a class and house', 'danger'); return; }
  const students = COMPUTE.studentsByClass(classId);
  students.forEach(s => DB.update('students', s.id, { houseId }));
  document.getElementById('modalBackdrop').click();
  APP.params.housesTab = 'students';
  APP.render();
  const h = DB.find('houses', houseId);
  toast(`${students.length} student${students.length !== 1 ? 's' : ''} assigned to ${h ? h.name : 'house'}`, 'success');
}

// ── Award / Deduct points ─────────────────────────────────────

function hp_awardModal(studentId, context) {
  const schoolId = currentSchoolId();
  let studentOptions = '';
  if (!studentId) {
    const classes = context === 'admin' ? DB.query('classes', c => c.schoolId === schoolId) : teacherClasses();
    const students = [];
    classes.forEach(c => COMPUTE.studentsByClass(c.id).forEach(s => students.push(s)));
    studentOptions = students.map(s => {
      const h = s.houseId ? DB.find('houses', s.houseId) : null;
      return `<option value="${s.id}">${s.name}${h ? ` — ${h.name}` : ' (no house)'}`;
    }).join('');
  }

  modal({
    title: 'Award or Deduct Inter House Points',
    body: `<div class="space-y-4">
      ${!studentId
        ? `<div><label class="input-label" for="ha_student">Student <span class="text-rose-500">*</span></label>
            <select id="ha_student" class="input">${studentOptions}</select></div>`
        : `<input type="hidden" id="ha_student" value="${studentId}">`}

      <div>
        <label class="input-label">Action</label>
        <div class="flex gap-2">
          <button id="ha_btn_award" type="button" onclick="hp_setAction('award')"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-brand-600 text-white border-brand-600">
            ➕ Award Points
          </button>
          <button id="ha_btn_deduct" type="button" onclick="hp_setAction('deduct')"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-white text-slate-600 border-slate-300 hover:border-rose-400 hover:text-rose-600">
            ➖ Deduct Points
          </button>
        </div>
        <input type="hidden" id="ha_action" value="award">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label" for="ha_pts">Points</label>
          <select id="ha_pts" class="input">
            ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n} point${n > 1 ? 's' : ''}</option>`).join('')}
          </select></div>
        <div><label class="input-label" for="ha_cat">Category</label>
          <select id="ha_cat" class="input">${HP_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></div>
      </div>

      <div><label class="input-label" for="ha_reason">Reason <span class="text-rose-500">*</span></label>
        <input id="ha_reason" class="input" placeholder="e.g. Best essay in class, Late to school three times…"></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button id="ha_submit_btn" class="btn btn-primary" onclick="hp_savePoints()">Award Points</button>`
  });
}

function hp_setAction(action) {
  document.getElementById('ha_action').value = action;
  const awardBtn  = document.getElementById('ha_btn_award');
  const deductBtn = document.getElementById('ha_btn_deduct');
  const submitBtn = document.getElementById('ha_submit_btn');
  if (action === 'award') {
    awardBtn.className  = 'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-brand-600 text-white border-brand-600';
    deductBtn.className = 'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-white text-slate-600 border-slate-300 hover:border-rose-400 hover:text-rose-600';
    submitBtn.textContent = 'Award Points';
    submitBtn.className = 'btn btn-primary';
  } else {
    deductBtn.className = 'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-rose-600 text-white border-rose-600';
    awardBtn.className  = 'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-600';
    submitBtn.textContent = 'Deduct Points';
    submitBtn.className = 'btn btn-danger';
  }
}

function hp_savePoints() {
  const studentId = (document.getElementById('ha_student') || {}).value;
  const reason    = (document.getElementById('ha_reason')  || {}).value.trim();
  const ptsRaw    = parseInt((document.getElementById('ha_pts')    || {}).value) || 1;
  const cat       = (document.getElementById('ha_cat')     || {}).value;
  const action    = (document.getElementById('ha_action')  || {}).value || 'award';
  const pts       = action === 'deduct' ? -ptsRaw : ptsRaw;

  if (!studentId || !reason) { toast('Student and reason are required', 'danger'); return; }

  const s = DB.find('students', studentId);
  if (!s || !s.houseId) {
    toast('This student is not assigned to a house yet. Assign them first.', 'warn');
    return;
  }

  const schoolId = currentSchoolId();
  DB.insert('housePoints', {
    id: uid('hp'), schoolId,
    studentId, houseId: s.houseId,
    points: pts, reason, category: cat,
    awardedBy: AUTH.current.id, awardedAt: now()
  });

  const house = DB.find('houses', s.houseId);
  DB.insert('notifications', {
    id: uid('not'), userId: studentId,
    title: pts > 0 ? 'Inter House Points Awarded! 🎉' : 'Inter House Points Deducted',
    body: pts > 0
      ? `You earned ${pts} point${pts > 1 ? 's' : ''} for ${house ? house.name : 'your house'}! Reason: ${reason}`
      : `${Math.abs(pts)} point${Math.abs(pts) > 1 ? 's' : ''} were deducted from ${house ? house.name : 'your house'}. Reason: ${reason}`,
    type: pts > 0 ? 'success' : 'warn', read: false, timestamp: now(),
    link: { view: 'stu_houses', params: {} }
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(
    pts > 0
      ? `+${pts} point${pts > 1 ? 's' : ''} awarded to ${s.name} — ${house ? house.name : ''}`
      : `${pts} points deducted from ${s.name} — ${house ? house.name : ''}`,
    pts > 0 ? 'success' : 'warn'
  );
}

// Quick award shortcut from teacher class roster
function tch_awardHousePoint(studentId) {
  hp_awardModal(studentId, 'teacher');
}

// ── Inter-house competition events ────────────────────────────

function hp_recordEventModal() {
  const schoolId = currentSchoolId();
  const houses   = DB.query('houses', h => h.schoolId === schoolId);

  if (houses.length < 2) {
    toast('Create at least 2 houses before recording a competition.', 'warn');
    return;
  }

  const positionRows = HP_EVENT_POSITIONS.slice(0, houses.length).map((p, i) => `
    <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span class="text-lg w-8 text-center">${['🥇','🥈','🥉','4️⃣'][i]}</span>
      <span class="text-sm font-semibold text-slate-600 w-20">${p.label}</span>
      <select id="ev_pos_${i}" class="input flex-1">
        <option value="">— Select house —</option>
        ${houses.map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('')}
      </select>
      <span class="text-sm font-semibold text-brand-700 w-16 text-right">+${p.points} pts</span>
    </div>
  `).join('');

  modal({
    title: 'Record Inter-House Competition',
    size: 'md',
    body: `<div class="space-y-4">
      <div><label class="input-label" for="ev_name">Competition Name <span class="text-rose-500">*</span></label>
        <input id="ev_name" class="input" placeholder="e.g. Annual Sports Day 2025/26, Inter-House Quiz"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label" for="ev_type">Type</label>
          <select id="ev_type" class="input">${HP_EVENT_TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div><label class="input-label" for="ev_date">Date</label>
          <input id="ev_date" class="input" type="date" value="${today()}"></div>
      </div>
      <div>
        <label class="input-label">Results (select house for each placing)</label>
        <div class="bg-slate-50 rounded-xl p-3 space-y-1">
          ${positionRows}
        </div>
        <p class="text-xs text-slate-500 mt-2">Points are automatically credited to each house's total.</p>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="hp_saveEvent(${houses.length})">Record Results</button>`
  });
}

function hp_saveEvent(numHouses) {
  const schoolId = currentSchoolId();
  const name = (document.getElementById('ev_name') || {}).value.trim();
  const type = (document.getElementById('ev_type') || {}).value;
  const date = (document.getElementById('ev_date') || {}).value;

  if (!name) { toast('Competition name is required', 'danger'); return; }
  if (!date)  { toast('Date is required', 'danger'); return; }

  const count = Math.min(numHouses, HP_EVENT_POSITIONS.length);
  const results = [];
  const usedHouses = new Set();

  for (let i = 0; i < count; i++) {
    const houseId = (document.getElementById(`ev_pos_${i}`) || {}).value;
    if (!houseId) { toast(`Please select the ${HP_EVENT_POSITIONS[i].label} house`, 'danger'); return; }
    if (usedHouses.has(houseId)) { toast('Each house can only appear once in the results', 'danger'); return; }
    usedHouses.add(houseId);
    results.push({ position: i + 1, houseId, points: HP_EVENT_POSITIONS[i].points });
  }

  DB.insert('houseEvents', {
    id: uid('hev'), schoolId, name, type, date, results,
    recordedBy: AUTH.current.id, createdAt: now()
  });

  // Notify all students in each house
  results.forEach(r => {
    const h = DB.find('houses', r.houseId);
    const members = DB.query('students', s => s.houseId === r.houseId && s.status === 'active');
    const posLabel = ['1st', '2nd', '3rd', '4th'][r.position - 1] || `${r.position}th`;
    members.forEach(s => {
      DB.insert('notifications', {
        id: uid('not'), userId: s.id,
        title: `${h ? h.name : 'Your house'} placed ${posLabel} in ${name}!`,
        body: `Your house earned ${r.points} points from this competition. Check the leaderboard.`,
        type: r.position === 1 ? 'success' : 'info', read: false, timestamp: now(),
        link: { view: 'stu_houses', params: {} }
      });
    });
  });

  document.getElementById('modalBackdrop').click();
  APP.params.housesTab = 'events';
  APP.render();
  toast(`"${name}" results recorded — points credited to all houses`, 'success');
}

function hp_deleteEvent(eventId) {
  const ev = DB.find('houseEvents', eventId);
  if (!ev) return;
  confirmDialog(`Delete "${ev.name}"? The points credited from this event will be removed from the leaderboard.`, () => {
    DB.remove('houseEvents', eventId);
    APP.render();
    toast('Event deleted', 'info');
  }, { danger: true, yesLabel: 'Delete Event' });
}

// ── Teacher: house standings in their classes ─────────────────

function view_tch_houses() {
  const schoolId = currentSchoolId();
  const totals = house_totals(schoolId);
  const myClasses = teacherClasses();
  const myStudents = [];
  myClasses.forEach(c => COMPUTE.studentsByClass(c.id).forEach(s => myStudents.push(s)));

  return `
    ${pageHeader({ title: 'Inter House Points', subtitle: 'Award points and see standings',
      actions: `<button class="btn btn-primary" onclick="hp_awardModal(null,'teacher')">${icon('plus', 'w-4 h-4')} Award / Deduct Points</button>` })}

    ${renderLeaderboard(totals, schoolId, false)}

    <div class="card overflow-hidden mt-4">
      <div class="px-4 py-3 border-b border-slate-100 font-bold text-slate-900">My Students' Points</div>
      <table class="tbl">
        <th scope="col"ead><tr><th scope="col">Student</th><th scope="col">House</th><th scope="col">Personal Points</th><th scope="col"></th></tr></thead>
        <tbody>
          ${myStudents.map(s => {
            const h = s.houseId ? DB.find('houses', s.houseId) : null;
            const pts = house_studentPoints(s.id);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(s, 'sm')}<span class="font-medium">${s.name}</span></div></td>
              <td>${h ? `<span class="font-bold" style="color:${h.color}">${h.icon} ${h.name}</span>` : '<span class="text-slate-500 text-sm">No house</span>'}</td>
              <td><span class="font-bold text-slate-900">${pts > 0 ? '+' : ''}${pts}</span></td>
              <td><button class="btn btn-secondary text-xs py-1 px-2" onclick="hp_awardModal('${s.id}','teacher')">Award / Deduct</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Student: own house + leaderboard ─────────────────────────

function view_stu_houses() {
  const s = me();
  const schoolId = s.schoolId || 'sch_brightlights';
  const totals   = house_totals(schoolId);
  const myHouse  = s.houseId ? DB.find('houses', s.houseId) : null;
  const myPoints = house_studentPoints(s.id);
  const myHouseTotal = myHouse ? (totals.find(h => h.id === myHouse.id) || {}).total || 0 : 0;
  const myHouseRank  = myHouse ? totals.findIndex(h => h.id === myHouse.id) + 1 : null;
  const myHistory    = DB.query('housePoints', p => p.studentId === s.id).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  const events       = DB.query('houseEvents', e => e.schoolId === schoolId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return `
    ${pageHeader({ title: 'Inter House Points', subtitle: 'Your house, standings and competition results' })}

    ${myHouse ? `<div class="card p-5 mb-5" style="border-left: 4px solid ${myHouse.color}">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="text-6xl">${myHouse.icon}</div>
        <div class="flex-1">
          <div class="text-xs font-semibold uppercase text-slate-500 mb-1">Your House</div>
          <div class="text-2xl font-extrabold" style="color:${myHouse.color}">${myHouse.name}</div>
          <div class="text-sm text-slate-500 italic">${myHouse.motto || ''}</div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-extrabold text-slate-900">${myHouseTotal}</div>
          <div class="text-xs text-slate-500">house total pts</div>
          <div class="text-sm font-bold mt-1" style="color:${myHouse.color}">${['🥇 1st','🥈 2nd','🥉 3rd','4th'][myHouseRank-1] || myHouseRank + 'th'} place</div>
        </div>
        <div class="text-right pl-4 border-l border-slate-200">
          <div class="text-3xl font-extrabold" style="color:${myHouse.color}">${myPoints > 0 ? '+' : ''}${myPoints}</div>
          <div class="text-xs text-slate-500">your personal pts</div>
        </div>
      </div>
    </div>` : `<div class="card p-5 mb-5 bg-amber-50 text-sm text-amber-800">You haven't been assigned to a house yet. Ask your class teacher.</div>`}

    ${renderLeaderboard(totals, schoolId, false)}

    ${events.length ? `<div class="card overflow-hidden mt-5">
      <div class="px-4 py-3 border-b border-slate-100 font-bold text-slate-900">Recent Competitions</div>
      ${events.map(ev => {
        const results = (ev.results || []).sort((a, b) => a.position - b.position);
        const medals  = ['🥇','🥈','🥉','4️⃣'];
        return `<div class="px-4 py-3 border-b border-slate-100 last:border-0">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold text-slate-900 text-sm">${ev.name}</div>
            <div class="text-xs text-slate-500">${fdate(ev.date, { short: true })}</div>
          </div>
          <div class="flex gap-3 flex-wrap">
            ${results.map((r, i) => {
              const h = DB.find('houses', r.houseId);
              const isMe = myHouse && r.houseId === myHouse.id;
              return h ? `<span class="px-2 py-1 rounded-lg text-xs font-semibold ${isMe ? 'ring-2' : ''}" style="background:${h.color}22;color:${h.color};${isMe ? `ring-color:${h.color}` : ''}">${medals[i]} ${h.name} +${r.points}pts</span>` : '';
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${myHistory.length ? `<div class="mt-5">
      <h3 class="font-bold text-slate-700 mb-3">Your Points History</h3>
      <div class="space-y-2">
        ${myHistory.map(p => {
          const t = DB.find('teachers', p.awardedBy);
          const isNeg = p.points < 0;
          return `<div class="card p-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isNeg ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}">${isNeg ? '' : '+'}${p.points}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900 text-sm">${p.reason}</div>
              <div class="text-xs text-slate-500">${p.category} · ${t ? t.name : 'Teacher'} · ${fdate(p.awardedAt, { short: true })}</div>
            </div>
            <span class="badge ${isNeg ? 'badge-danger' : 'badge-neutral'} text-xs">${p.category}</span>
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
  const totals   = house_totals(schoolId);
  const events   = DB.query('houseEvents', e => e.schoolId === schoolId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return `
    ${pageHeader({ title: 'Inter House Points', subtitle: "Your children's house standing and competition results" })}

    ${children.map(child => {
      const myHouse  = child.houseId ? DB.find('houses', child.houseId) : null;
      const myPoints = house_studentPoints(child.id);
      const houseTotal = myHouse ? (totals.find(h => h.id === myHouse.id) || {}).total || 0 : 0;
      const rank = myHouse ? totals.findIndex(h => h.id === myHouse.id) + 1 : null;
      const history = DB.query('housePoints', p => p.studentId === child.id).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)).slice(0, 5);

      return `<div class="card p-5 mb-4">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          ${avatar(child, 'md')}
          <div class="flex-1">
            <div class="font-bold text-slate-900">${child.name}</div>
            ${myHouse
              ? `<div class="text-sm font-semibold" style="color:${myHouse.color}">${myHouse.icon} ${myHouse.name} · ${['🥇 1st','🥈 2nd','🥉 3rd','4th'][rank-1]||rank+'th'} place</div>`
              : '<div class="text-sm text-slate-500">Not yet assigned to a house</div>'}
          </div>
          <div class="text-right">
            <div class="text-2xl font-extrabold text-slate-900">${myPoints > 0 ? '+' : ''}${myPoints}</div>
            <div class="text-xs text-slate-500">personal pts</div>
          </div>
        </div>
        ${history.length ? history.map(p => {
          const t = DB.find('teachers', p.awardedBy);
          const isNeg = p.points < 0;
          return `<div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isNeg ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}">${isNeg ? '' : '+'}${p.points}</span>
            <span class="text-sm flex-1">${p.reason}</span>
            <span class="text-xs text-slate-500">${fdate(p.awardedAt, { short: true })}</span>
          </div>`;
        }).join('') : '<div class="text-sm text-slate-500">No individual points yet.</div>'}
      </div>`;
    }).join('')}

    <h3 class="font-bold text-slate-700 mb-3 mt-2">Leaderboard</h3>
    ${renderLeaderboard(totals, schoolId, false)}

    ${events.length ? `<h3 class="font-bold text-slate-700 mb-3 mt-5">Recent Competitions</h3>
    <div class="space-y-3">
      ${events.map(ev => {
        const results = (ev.results || []).sort((a, b) => a.position - b.position);
        const medals  = ['🥇','🥈','🥉','4️⃣'];
        return `<div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <div><div class="font-semibold text-slate-900">${ev.name}</div>
            <div class="text-xs text-slate-500">${ev.type} · ${fdate(ev.date, { short: true })}</div></div>
          </div>
          <div class="flex flex-wrap gap-2">
            ${results.map((r, i) => {
              const h = DB.find('houses', r.houseId);
              return h ? `<span class="px-3 py-1.5 rounded-lg text-sm font-semibold" style="background:${h.color}22;color:${h.color}">${medals[i]} ${h.name} <span class="opacity-70">+${r.points}pts</span></span>` : '';
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}
  `;
}
