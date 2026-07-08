/* ============================================================
   HEALTH MODULE
   - Admin / Nurse logs sickbay visits and views health profiles
   - Parent views child's sickbay history and allergy info
   ============================================================ */

const HEALTH_OUTCOMES = {
  returned_to_class: { label: 'Returned to Class', badge: 'badge-success',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  sent_home:         { label: 'Sent Home',          badge: 'badge-warn',  color: 'bg-amber-100  text-amber-800  border-amber-200'  },
  referred_hospital: { label: 'Referred to Hospital', badge: 'badge-danger', color: 'bg-rose-100   text-rose-800   border-rose-200'   }
};

function health_outcomeBadge(outcome) {
  const o = HEALTH_OUTCOMES[outcome];
  if (!o) return `<span class="badge badge-neutral">${outcome || '—'}</span>`;
  return `<span class="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${o.color}">${o.label}</span>`;
}

/* ──────────────────────────────────────────────────────────────
   ADMIN / NURSE VIEWS
────────────────────────────────────────────────────────────── */

function view_adm_health(params) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const tab = (params && params.tab) || 'log';

  const visits   = DB.query('sickbayVisits', v => v.schoolId === schoolId);
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');

  const tabBar = `
    <div class="flex gap-1 mb-5 border-b border-slate-200">
      ${[
        ['log',      'Log Visit'],
        ['history',  `Visit History${visits.length ? ' (' + visits.length + ')' : ''}`],
        ['profiles', 'Health Profiles']
      ].map(([k, l]) =>
        `<button onclick="APP.params.tab = '${k}'; APP.render();"
          class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}">${l}</button>`
      ).join('')}
    </div>`;

  let content = '';
  if (tab === 'log')      content = adm_renderLogVisitTab(students);
  if (tab === 'history')  content = adm_renderVisitHistoryTab(visits, schoolId);
  if (tab === 'profiles') content = adm_renderHealthProfilesTab(students, visits);

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'Sickbay & Health Records',
        subtitle: `${visits.length} recorded visit${visits.length !== 1 ? 's' : ''} · ${students.length} active students`
      })}
      ${tabBar}
      ${content}
    </div>
  `;
}

/* ---------- Log Visit tab (inline form) ---------- */
function adm_renderLogVisitTab(students) {
  return `
    <div class="max-w-2xl">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">${icon('book','w-5 h-5 text-brand-600')} New Sickbay Visit</h3>
        <div class="space-y-4" id="healthLogForm">

          <div>
            <label class="input-label">Student *</label>
            <select id="hv_student" class="input">
              <option value="">— Select student —</option>
              ${students.map(s => {
                const cls = DB.find('classes', s.classId);
                const allergyFlag = s.allergies && s.allergies.toLowerCase() !== 'none' && s.allergies.trim() !== '' ? ' ⚠️' : '';
                return `<option value="${s.id}">${s.name}${cls ? ' · ' + cls.name : ''}${allergyFlag}</option>`;
              }).join('')}
            </select>
          </div>

          <div id="hv_allergyWarning" class="hidden bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
            ${icon('bell','w-4 h-4 inline mr-1')} <strong>Known Allergies:</strong> <span id="hv_allergyText"></span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="input-label">Date *</label>
              <input id="hv_date" type="date" class="input" value="${today()}" />
            </div>
            <div>
              <label class="input-label">Temperature (°C)</label>
              <input id="hv_temp" type="number" step="0.1" min="34" max="42" class="input" placeholder="e.g. 37.5" />
            </div>
          </div>

          <div>
            <label class="input-label">Complaint / Symptoms *</label>
            <textarea id="hv_complaint" class="input" rows="3" placeholder="Describe the student's complaint or observed symptoms..."></textarea>
          </div>

          <div>
            <label class="input-label">Treatment / Action Taken</label>
            <textarea id="hv_treatment" class="input" rows="3" placeholder="Medication given, first aid, observations..."></textarea>
          </div>

          <div>
            <label class="input-label">Outcome *</label>
            <div class="grid grid-cols-3 gap-3 mt-1">
              ${Object.entries(HEALTH_OUTCOMES).map(([val, o]) => `
                <label class="relative cursor-pointer">
                  <input type="radio" name="hv_outcome" value="${val}" class="sr-only peer" ${val === 'returned_to_class' ? 'checked' : ''} />
                  <div class="p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all border-slate-200 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 hover:border-slate-300">
                    ${o.label}
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <input id="hv_notify" type="checkbox" class="w-4 h-4 rounded accent-brand-600" />
            <label for="hv_notify" class="text-sm font-medium text-slate-700 cursor-pointer">
              Notify parent via in-app notification
            </label>
          </div>

          <button class="btn btn-primary w-full" onclick="adm_saveVisit()">${icon('check','w-4 h-4')} Save Visit Record</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Wire up allergy warning on student select ---------- */
// Called inline via onchange — injected into the rendered form
window.hv_onStudentChange = function() {
  const select  = document.getElementById('hv_student');
  const warning = document.getElementById('hv_allergyWarning');
  const text    = document.getElementById('hv_allergyText');
  if (!select || !warning || !text) return;
  const studentId = select.value;
  if (!studentId) { warning.classList.add('hidden'); return; }
  const s = DB.find('students', studentId);
  if (s && s.allergies && s.allergies.toLowerCase() !== 'none' && s.allergies.trim() !== '') {
    text.textContent = s.allergies;
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
};

// Attach event listener after render
(function attachHealthFormListener() {
  window.afterRender = (function(prev) {
    return function() {
      if (prev) prev();
      const sel = document.getElementById('hv_student');
      if (sel) sel.addEventListener('change', window.hv_onStudentChange);
    };
  })(window.afterRender || null);
})();

function adm_saveVisit() {
  const studentId = (document.getElementById('hv_student')   || {}).value;
  const date      = (document.getElementById('hv_date')      || {}).value || today();
  const complaint = (document.getElementById('hv_complaint') || {}).value.trim();
  const treatment = (document.getElementById('hv_treatment') || {}).value.trim();
  const tempEl    = document.getElementById('hv_temp');
  const temperature = tempEl && tempEl.value ? parseFloat(tempEl.value) : null;
  const outcomeEl = document.querySelector('input[name="hv_outcome"]:checked');
  const outcome   = outcomeEl ? outcomeEl.value : 'returned_to_class';
  const notifyEl  = document.getElementById('hv_notify');
  let parentNotified = notifyEl ? notifyEl.checked : false;
  if (outcome === 'sent_home' || outcome === 'referred_hospital') parentNotified = true;

  if (!studentId) { toast('Please select a student', 'danger'); return; }
  if (!complaint) { toast('Complaint / symptoms are required', 'danger'); return; }

  const schoolId = AUTH.current.schoolId || 'sch_brightlights';

  DB.insert('sickbayVisits', {
    id: uid('hv'), schoolId, studentId,
    date, complaint, treatment,
    temperature,
    outcome,
    parentNotified,
    recordedBy: AUTH.current.id,
    createdAt: now()
  });

  // Notify parent if requested
  if (parentNotified) {
    const student = DB.find('students', studentId);
    if (student && student.parentId) {
      const outcomeInfo = HEALTH_OUTCOMES[outcome] || {};
      DB.insert('notifications', {
        id: uid('not'), userId: student.parentId,
        title: `Sickbay Visit — ${student.name}`,
        body: `${student.name} visited the sickbay on ${fdate(date, { long: true })}. Complaint: ${complaint}. Outcome: ${outcomeInfo.label || outcome}.`,
        type: outcome === 'referred_hospital' ? 'danger' : outcome === 'sent_home' ? 'warn' : 'info',
        read: false, timestamp: now(),
        link: { view: 'par_health' }
      });
    }
  }

  toast('Visit recorded successfully', 'success');
  APP.params.tab = 'history'; APP.render();
}

/* ---------- Visit History tab ---------- */
function adm_renderVisitHistoryTab(visits, schoolId) {
  if (visits.length === 0) {
    return emptyState({ icon: 'book', title: 'No visits recorded yet', body: 'Use the Log Visit tab to record sickbay visits.' });
  }

  const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date));
  const q = (APP.params && APP.params.healthQ || '').toLowerCase();
  const filtered = q
    ? sorted.filter(v => {
        const s = DB.find('students', v.studentId);
        return (s && s.name.toLowerCase().includes(q)) || (v.complaint || '').toLowerCase().includes(q);
      })
    : sorted;

  return `
    <div class="mb-4">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('book','w-4 h-4')}</span>
        <input type="text" class="input pl-9" placeholder="Search by student name or complaint…"
          value="${q}" oninput="APP.params.healthQ = this.value; APP.render()" />
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Complaint</th>
            <th>Temp</th>
            <th>Outcome</th>
            <th>Parent Notified</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(v => {
            const student = DB.find('students', v.studentId);
            const cls     = student ? DB.find('classes', student.classId) : null;
            const complaint = v.complaint && v.complaint.length > 50
              ? v.complaint.slice(0, 50) + '…'
              : (v.complaint || '—');
            return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="adm_viewVisit('${v.id}')">
              <td class="text-sm text-slate-600 whitespace-nowrap">${fdate(v.date, { long: true })}</td>
              <td>
                <div class="flex items-center gap-2">
                  ${avatar(student || { name: '?' }, 'sm')}
                  <div>
                    <div class="font-semibold text-sm">${student ? student.name : '—'}</div>
                    <div class="text-xs text-slate-400">${cls ? cls.name : ''}</div>
                  </div>
                </div>
              </td>
              <td class="text-sm text-slate-700 max-w-xs">${complaint}</td>
              <td class="text-sm font-mono text-slate-700">${v.temperature != null ? v.temperature + '°C' : '—'}</td>
              <td>${health_outcomeBadge(v.outcome)}</td>
              <td>${v.parentNotified
                  ? `<span class="text-xs text-emerald-600 font-semibold">${icon('check','w-3.5 h-3.5 inline')} Yes</span>`
                  : `<span class="text-xs text-slate-400">No</span>`}
              </td>
              <td class="text-right">
                <button class="btn btn-ghost !p-1.5 text-brand-600 hover:bg-brand-50" title="View full details"
                  onclick="event.stopPropagation(); adm_viewVisit('${v.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
              </td>
            </tr>`;
          }).join('')}
          ${filtered.length === 0 ? `<tr><td colspan="7" class="text-center text-slate-400 py-8">No matching records found.</td></tr>` : ''}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-slate-400 mt-2 text-right">${filtered.length} of ${visits.length} records</p>
  `;
}

function adm_viewVisit(visitId) {
  const v = DB.find('sickbayVisits', visitId);
  if (!v) return;
  const student   = DB.find('students', v.studentId);
  const cls       = student ? DB.find('classes', student.classId) : null;
  const recorder  = DB.find('teachers', v.recordedBy) || DB.find('staff', v.recordedBy);
  const outcomeInfo = HEALTH_OUTCOMES[v.outcome] || {};

  modal({
    title: 'Sickbay Visit Details',
    body: `
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
          ${avatar(student || { name: '?' }, 'md')}
          <div>
            <div class="font-bold text-slate-900">${student ? student.name : '—'}</div>
            <div class="text-sm text-slate-500">${cls ? cls.name : ''}${student && student.allergies && student.allergies.toLowerCase() !== 'none' && student.allergies.trim() !== '' ? ` · ⚠️ ${student.allergies}` : ''}</div>
          </div>
          <div class="ml-auto text-right">
            <div class="text-xs text-slate-400 uppercase">Date</div>
            <div class="font-semibold text-slate-800">${fdate(v.date, { long: true })}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Temperature</div>
            <div class="font-bold text-slate-900 text-lg">${v.temperature != null ? v.temperature + ' °C' : '—'}</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Outcome</div>
            <div>${health_outcomeBadge(v.outcome)}</div>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Complaint / Symptoms</div>
          <div class="bg-rose-50 border border-rose-100 rounded-xl p-3 text-sm text-slate-800">${v.complaint || '—'}</div>
        </div>

        ${v.treatment ? `
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Treatment / Action</div>
            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-slate-800">${v.treatment}</div>
          </div>
        ` : ''}

        <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>Recorded by: <strong>${recorder ? recorder.name : v.recordedBy || '—'}</strong></span>
          <span>Parent notified: <strong>${v.parentNotified ? 'Yes' : 'No'}</strong></span>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

/* ---------- Health Profiles tab ---------- */
function adm_renderHealthProfilesTab(students, visits) {
  if (students.length === 0) {
    return emptyState({ icon: 'students', title: 'No students found', body: 'No active students in this school.' });
  }

  // Build visit counts
  const visitCountMap = {};
  visits.forEach(v => { visitCountMap[v.studentId] = (visitCountMap[v.studentId] || 0) + 1; });

  // Sort: students with allergies first
  const withAllergies = students.filter(s => s.allergies && s.allergies.toLowerCase() !== 'none' && s.allergies.trim() !== '');
  const withoutAllergies = students.filter(s => !s.allergies || s.allergies.toLowerCase() === 'none' || s.allergies.trim() === '');
  const sorted = [...withAllergies, ...withoutAllergies];

  return `
    ${withAllergies.length > 0 ? `
      <div class="mb-4 card p-3 bg-rose-50 border border-rose-200 flex items-center gap-3">
        <div class="text-rose-600">${icon('bell','w-5 h-5')}</div>
        <div class="text-sm text-rose-800">
          <strong>${withAllergies.length} student${withAllergies.length !== 1 ? 's' : ''}</strong> have known allergies — shown first below.
        </div>
      </div>
    ` : ''}

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Allergies</th>
            <th>Sickbay Visits</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(s => {
            const cls          = DB.find('classes', s.classId);
            const visitCount   = visitCountMap[s.id] || 0;
            const hasAllergies = s.allergies && s.allergies.toLowerCase() !== 'none' && s.allergies.trim() !== '';
            return `<tr class="hover:bg-slate-50">
              <td>
                <div class="flex items-center gap-2">
                  ${avatar(s, 'sm')}
                  <span class="font-semibold text-sm">${s.name}</span>
                </div>
              </td>
              <td class="text-sm text-slate-500">${cls ? cls.name : '—'}</td>
              <td>
                ${hasAllergies
                  ? `<span class="inline-flex items-center gap-1 text-xs bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">${icon('bell','w-3 h-3')} ${s.allergies}</span>`
                  : `<span class="text-xs text-slate-400">None known</span>`}
              </td>
              <td>
                <span class="font-bold text-slate-900">${visitCount}</span>
                <span class="text-xs text-slate-400 ml-1">${visitCount === 1 ? 'visit' : 'visits'}</span>
              </td>
              <td class="text-right">
                <button class="btn btn-secondary text-xs py-1.5 px-3" onclick="adm_viewStudentHealth('${s.id}')">View Profile</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function adm_viewStudentHealth(studentId) {
  const student    = DB.find('students', studentId);
  if (!student) { toast('Student not found', 'danger'); return; }
  const cls        = DB.find('classes', student.classId);
  const schoolId   = student.schoolId || 'sch_brightlights';
  const visits     = DB.query('sickbayVisits', v => v.studentId === studentId && v.schoolId === (schoolId || 'sch_brightlights'))
                       .sort((a, b) => b.date.localeCompare(a.date));
  const hasAllergies = student.allergies && student.allergies.toLowerCase() !== 'none' && student.allergies.trim() !== '';

  modal({
    title: `Health Profile — ${student.name}`,
    size: 'lg',
    body: `
      <div class="space-y-4">

        <!-- Student header -->
        <div class="flex items-center gap-4 pb-3 border-b border-slate-100">
          ${avatar(student, 'md')}
          <div>
            <div class="font-bold text-slate-900 text-lg">${student.name}</div>
            <div class="text-sm text-slate-500">${cls ? cls.name : ''} · Adm No: ${student.admissionNo || '—'}</div>
            <div class="text-xs text-slate-400">Blood Group: ${student.bloodGroup || '—'}</div>
          </div>
        </div>

        <!-- Allergies card -->
        ${hasAllergies ? `
          <div class="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3">
            <div class="text-rose-600 flex-shrink-0">${icon('bell','w-5 h-5 mt-0.5')}</div>
            <div>
              <div class="font-bold text-rose-800 mb-1">Known Allergies</div>
              <div class="text-sm text-rose-900">${student.allergies}</div>
            </div>
          </div>
        ` : `
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <div class="text-emerald-600">${icon('check','w-4 h-4')}</div>
            <div class="text-sm text-emerald-800 font-medium">No known allergies</div>
          </div>
        `}

        <!-- Sickbay visit history -->
        <div>
          <h4 class="font-bold text-slate-800 mb-3">
            Sickbay Visits
            <span class="ml-2 text-sm font-normal text-slate-400">${visits.length} total</span>
          </h4>
          ${visits.length === 0 ? `
            <div class="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl">No sickbay visits on record.</div>
          ` : `
            <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
              ${visits.map(v => {
                const recorder = DB.find('teachers', v.recordedBy) || DB.find('staff', v.recordedBy);
                return `
                  <div class="border border-slate-200 rounded-xl p-4">
                    <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div class="font-semibold text-sm text-slate-800">${fdate(v.date, { long: true })}</div>
                      <div>${health_outcomeBadge(v.outcome)}</div>
                    </div>
                    <div class="text-sm text-slate-700 mb-2">
                      <span class="text-xs text-slate-400 uppercase font-semibold">Complaint: </span>${v.complaint || '—'}
                    </div>
                    ${v.treatment ? `<div class="text-sm text-slate-600 mb-2">
                      <span class="text-xs text-slate-400 uppercase font-semibold">Treatment: </span>${v.treatment}
                    </div>` : ''}
                    <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      ${v.temperature != null ? `<span>Temp: ${v.temperature}°C</span>` : ''}
                      <span>Recorded by: ${recorder ? recorder.name : '—'}</span>
                      ${v.parentNotified ? `<span class="text-emerald-600 font-semibold">${icon('check','w-3 h-3 inline')} Parent notified</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

/* ──────────────────────────────────────────────────────────────
   PARENT VIEW
────────────────────────────────────────────────────────────── */

function view_par_health(params) {
  const parentId = AUTH.current.id;
  const children = COMPUTE.parentChildren(parentId).filter(c => c.status === 'active');

  if (!children.length) {
    return `
      ${pageHeader({ title: 'Child Health Records', subtitle: 'Sickbay visits and allergy information' })}
      ${emptyState({ icon: 'students', title: 'No children linked', body: 'No active children found on your account.' })}
    `;
  }

  const activeId = (params && params.studentId) || children[0].id;
  const child    = DB.find('students', activeId);
  const visits   = DB.query('sickbayVisits', v => v.studentId === activeId && v.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                     .sort((a, b) => b.date.localeCompare(a.date));

  const hasAllergies = child && child.allergies && child.allergies.toLowerCase() !== 'none' && child.allergies.trim() !== '';

  return `
    <div class="space-y-5">
      ${pageHeader({ title: 'Child Health Records', subtitle: 'Sickbay visits and allergy information' })}

      ${children.length > 1 ? `
        <div class="flex gap-2 flex-wrap">
          ${children.map(c => `<button onclick="APP.go('par_health',{studentId:'${c.id}'})"
            class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
        </div>
      ` : ''}

      <!-- Allergy card -->
      <div>
        <h3 class="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Allergy Information</h3>
        ${hasAllergies ? `
          <div class="card p-4 bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
            <div class="text-rose-600 flex-shrink-0 mt-0.5">${icon('bell','w-5 h-5')}</div>
            <div>
              <div class="font-bold text-rose-800">Known Allergies</div>
              <div class="text-sm text-rose-900 mt-0.5">${child.allergies}</div>
              <div class="text-xs text-rose-700 mt-2">Please inform the school nurse if anything changes.</div>
            </div>
          </div>
        ` : `
          <div class="card p-4 bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div class="text-emerald-600">${icon('check','w-5 h-5')}</div>
            <div>
              <div class="font-semibold text-emerald-800">No known allergies</div>
              <div class="text-xs text-emerald-700 mt-0.5">No allergies are on record for ${child ? child.name : 'your child'}.</div>
            </div>
          </div>
        `}
      </div>

      <!-- Visit history -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Sickbay Visit History</h3>
          ${visits.length > 0 ? `<span class="text-xs text-slate-400">${visits.length} visit${visits.length !== 1 ? 's' : ''} recorded</span>` : ''}
        </div>

        ${visits.length === 0 ? `
          ${emptyState({ icon: 'book', title: 'No sickbay visits recorded', body: `${child ? child.name : 'Your child'} has not visited the sickbay this term.` })}
        ` : `
          <div class="space-y-3">
            ${visits.map(v => {
              const outcomeInfo = HEALTH_OUTCOMES[v.outcome] || {};
              return `
                <div class="card p-4">
                  <div class="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <div class="font-semibold text-slate-900">${fdate(v.date, { long: true })}</div>
                      ${v.temperature != null ? `<div class="text-xs text-slate-400 mt-0.5">Temperature: ${v.temperature}°C</div>` : ''}
                    </div>
                    ${health_outcomeBadge(v.outcome)}
                  </div>
                  <div class="space-y-2">
                    <div>
                      <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Complaint</div>
                      <div class="text-sm text-slate-700">${v.complaint || '—'}</div>
                    </div>
                    ${v.treatment ? `
                      <div>
                        <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Treatment</div>
                        <div class="text-sm text-slate-700">${v.treatment}</div>
                      </div>
                    ` : ''}
                  </div>
                  ${v.outcome === 'referred_hospital' ? `
                    <div class="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                      ${icon('bell','w-3.5 h-3.5 inline mr-1')} ${child ? child.name : 'Your child'} was referred to hospital. Contact the school for details.
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}
