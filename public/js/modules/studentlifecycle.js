/* ============================================================
   Student Lifecycle — exit and re-admission
   ------------------------------------------------------------
   A student record is permanent. Enrolment is an episode.
   Leaving ends an enrolment; returning opens a new one on the
   same record, keeping the admission number and the history.
   Nothing here deletes, archives or is irreversible.

   EXIT REASONS are layered, which is what lets one dropdown do
   the whole job:

     outcome  fixed, because the system behaves differently for
              each — a transfer issues a certificate, a
              graduation creates an alumnus, a death must drop
              out of fee chasing and messaging.

     label    the school's own words. Free to add, rename and
              retire, because a label carries no behaviour.

   The school edits the list under School Settings > Lists &
   Options. Entries that behaviour depends on cannot be deleted.
   ============================================================ */

const EXIT_OUTCOMES = [
  { key: 'transferred', label: 'Transferred out', status: 'transferred',
    hint: 'Moved to another school. A transfer certificate can be issued.' },
  { key: 'graduated',   label: 'Graduated',       status: 'alumni',
    hint: 'Completed the final class. Becomes an alumnus.' },
  { key: 'withdrawn',   label: 'Withdrawn',       status: 'withdrawn',
    hint: 'Left the school for any other reason.' },
  { key: 'deceased',    label: 'Deceased',        status: 'deceased',
    hint: 'Record closed. Excluded from fee chasing, messaging and bulk actions.' }
];

/* Shipped defaults. The four marked system carry the behaviour above and
   cannot be removed; everything else is the school's to change. */
function defaultExitReasons() {
  return [
    { id: 'exr_transfer',  label: 'Transferred to another school', outcome: 'transferred', system: true },
    { id: 'exr_graduate',  label: 'Graduated',                     outcome: 'graduated',   system: true },
    { id: 'exr_withdrawn', label: 'Withdrawn by parent',           outcome: 'withdrawn',   system: true },
    { id: 'exr_deceased',  label: 'Deceased',                      outcome: 'deceased',    system: true },
    { id: 'exr_relocated', label: 'Family relocated',              outcome: 'withdrawn',   system: false },
    { id: 'exr_fees',      label: 'Non-payment of fees',           outcome: 'withdrawn',   system: false },
    { id: 'exr_discipline',label: 'Disciplinary',                  outcome: 'withdrawn',   system: false },
    { id: 'exr_health',    label: 'Health reasons',                outcome: 'withdrawn',   system: false }
  ];
}

function exitReasons() {
  const stored = DB.settings().exitReasons;
  return Array.isArray(stored) && stored.length ? stored : defaultExitReasons();
}
function exitReason(id) { return exitReasons().find(r => r.id === id); }
function exitOutcome(key) { return EXIT_OUTCOMES.find(o => o.key === key) || EXIT_OUTCOMES[2]; }

function _slcEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Every status that means "no longer on the roll". */
const SLC_FORMER = ['withdrawn', 'transferred', 'alumni', 'deceased'];
function isFormerStudent(s) { return !!s && SLC_FORMER.indexOf(s.status) !== -1; }
function isEnrolled(s) { return !!s && (s.status === 'active' || s.status === 'suspended'); }

/* Enrolment episodes. A record created before this existed has none, so the
   first one is inferred from the admission date rather than invented. */
function enrolmentPeriods(s) {
  if (Array.isArray(s.enrolments) && s.enrolments.length) return s.enrolments;
  return [{
    id: 'enr_initial',
    startDate: s.admissionDate || '',
    endDate: isFormerStudent(s) ? (s.exitDate || (s.withdrawnAt || '').slice(0, 10) || '') : '',
    classId: s.classId,
    session: s.enrollmentSession || DB.settings().currentSession || '',
    reason: s.exitReason || s.withdrawReason || '',
    outcome: isFormerStudent(s) ? (s.exitOutcome || s.status) : ''
  }];
}

function outstandingBalance(studentId) {
  return DB.query('invoices', i => i.studentId === studentId)
    .reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
}

/* ============================================================
   LIFECYCLE MENU — overrides admin.js
   ============================================================ */
function studentLifecycleModal(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const cls = DB.find('classes', s.classId);
  document.getElementById('modalBackdrop')?.click();

  const card = (tone, iconName, title, desc, action) => `
    <button class="w-full p-3 ${tone} rounded-xl text-left transition" onclick="${action}">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">${icon(iconName, 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-900">${title}</div>
          <div class="text-xs text-slate-600 mt-0.5">${desc}</div>
        </div>
      </div>
    </button>`;

  const former = isFormerStudent(s);
  const periods = enrolmentPeriods(s);

  setTimeout(() => modal({
    title: `${_slcEsc(s.name)} — Lifecycle`,
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          ${avatar(s, 'md')}
          <div class="min-w-0">
            <div class="font-bold text-slate-900">${_slcEsc(s.name)}</div>
            <div class="text-xs text-slate-500">
              ${cls ? _slcEsc(cls.name) : '—'} · ${_slcEsc(s.admissionNo || '')} · ${statusBadge(s.status)}
            </div>
          </div>
        </div>

        ${former ? `
          <div class="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Left on <strong>${fdate(s.exitDate || s.withdrawnAt, { long: true })}</strong>${s.exitReason ? ` · ${_slcEsc(s.exitReason)}` : ''}.
            The record is intact — results, attendance and fees are all still here.
          </div>
          ${card('bg-emerald-50 hover:bg-emerald-100', 'check', 'Re-admit',
                 'Return to an active class, keeping this admission number and history',
                 `readmitStudentModal('${s.id}')`)}
          ${s.status === 'transferred' ? card('bg-slate-50 hover:bg-slate-100', 'download', 'Transfer certificate',
                 'Issue or reissue the certificate for this exit', `toast('Transfer certificate is not wired up in this build','info')`) : ''}
        ` : `
          ${card('bg-emerald-50 hover:bg-emerald-100', 'trending_up', 'Promote to next class',
                 'Move to a higher class for the new session', `promoteStudentModal('${s.id}')`)}
          ${s.status === 'suspended'
            ? card('bg-brand-50 hover:bg-brand-100', 'check', 'Reinstate',
                   'Lift the suspension and restore active status', `reinstateStudentModal('${s.id}')`)
            : card('bg-amber-50 hover:bg-amber-100', 'bell', 'Suspend',
                   'Temporarily remove from school — still enrolled, reversible', `suspendStudentModal('${s.id}')`)}
          ${card('bg-rose-50 hover:bg-rose-100', 'logout', 'Exit the school',
                 'Record that the student has left, and why. Reversible — they can be re-admitted', `exitStudentModal('${s.id}')`)}
        `}

        ${periods.length > 1 ? `
          <div class="pt-1">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Enrolment history</div>
            <div class="space-y-1.5">
              ${periods.map(p => {
                const c = DB.find('classes', p.classId);
                return `<div class="text-xs text-slate-600 border-l-2 border-slate-200 pl-2.5">
                  ${fdate(p.startDate, { long: true })} → ${p.endDate ? fdate(p.endDate, { long: true }) : '<span class="text-emerald-700 font-semibold">present</span>'}
                  ${c ? ' · ' + _slcEsc(c.name) : ''}${p.reason ? ' · ' + _slcEsc(p.reason) : ''}
                </div>`;
              }).join('')}
            </div>
          </div>` : ''}
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
  }), 50);
}

/* ============================================================
   EXIT — one action, one reason
   ============================================================ */
function exitStudentModal(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const owed = outstandingBalance(studentId);
  const reasons = exitReasons();
  document.getElementById('modalBackdrop')?.click();

  setTimeout(() => {
    modal({
      title: `Exit — ${_slcEsc(s.name)}`,
      body: `
        <div class="space-y-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="input-label" for="ex_reason">Reason</label>
              <select id="ex_reason" class="input" onchange="exitReasonChanged()">
                ${reasons.map(r => `<option value="${r.id}">${_slcEsc(r.label)}</option>`).join('')}
              </select>
              <p id="ex_hint" class="text-xs text-slate-500 mt-1"></p>
            </div>
            <div>
              <label class="input-label" for="ex_date">Date of leaving</label>
              <input id="ex_date" type="date" class="input" value="${today()}" />
            </div>
          </div>

          ${owed > 0 ? `<div class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ${icon('naira','w-4 h-4 inline')} <strong>${money(owed)} still outstanding.</strong>
            The debt stays on this record and keeps appearing in fee reporting — leaving does not clear it.
          </div>` : ''}

          <div>
            <label class="input-label" for="ex_notes">Notes <span class="font-normal text-slate-400">(optional)</span></label>
            <textarea id="ex_notes" rows="2" class="input" placeholder="e.g. moving to Abuja, may return next session"></textarea>
          </div>

          <p class="text-xs text-slate-500">
            Nothing is deleted. Results, attendance, fees and documents stay on the record, and the
            student can be re-admitted at any time with the same admission number.
          </p>
        </div>`,
      footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
               <button class="btn btn-primary" onclick="confirmExitStudent('${studentId}')">${icon('check','w-4 h-4')} Record exit</button>`
    });
    exitReasonChanged();
  }, 50);
}

function exitReasonChanged() {
  const sel = document.getElementById('ex_reason');
  const hint = document.getElementById('ex_hint');
  if (!sel || !hint) return;
  const r = exitReason(sel.value);
  hint.textContent = r ? exitOutcome(r.outcome).hint : '';
}

function confirmExitStudent(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const r = exitReason(document.getElementById('ex_reason').value);
  const date = document.getElementById('ex_date').value;
  const notes = (document.getElementById('ex_notes').value || '').trim();
  if (!r) { toast('Pick a reason', 'danger'); return; }
  if (!date) { toast('A date of leaving is required', 'danger'); return; }

  const periods = enrolmentPeriods(s);
  if (date && periods[0].startDate && date < periods[0].startDate) {
    toast('The date of leaving cannot be before the student joined', 'danger');
    return;
  }

  const outcome = exitOutcome(r.outcome);
  const open = periods.slice();
  const last = open[open.length - 1];
  if (last && !last.endDate) {
    open[open.length - 1] = Object.assign({}, last, { endDate: date, reasonId: r.id, reason: r.label, outcome: r.outcome });
  }

  DB.update('students', studentId, {
    status: outcome.status,
    exitReasonId: r.id, exitReason: r.label, exitOutcome: r.outcome,
    exitDate: date, exitNotes: notes,
    exitedAt: now(), exitedBy: AUTH.current ? AUTH.current.id : 'system',
    enrolments: open
  });

  DB.insert('auditLog', {
    id: uid('aud'), schoolId: s.schoolId,
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'student_exited',
    target: `${s.name} · ${r.label} · left ${fdate(date, { long: true })}${notes ? ' · "' + notes + '"' : ''}`,
    timestamp: now()
  });

  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} recorded as ${outcome.label.toLowerCase()} — the record is kept and can be re-admitted`, 'success');
}

/* ============================================================
   RE-ADMIT
   ============================================================ */
function readmitStudentModal(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const sid = currentSchoolId();
  const classes = DB.query('classes', c => c.schoolId === sid);
  const sessions = DB.query('academicSessions', x => x.schoolId === sid);
  const currentSession = (sessions.find(x => x.current) || {}).name || DB.settings().currentSession || '';
  const owed = outstandingBalance(studentId);
  document.getElementById('modalBackdrop')?.click();

  setTimeout(() => modal({
    title: `Re-admit — ${_slcEsc(s.name)}`,
    body: `
      <div class="space-y-3">
        <div class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Returning on the same record. Admission number <strong>${_slcEsc(s.admissionNo || '—')}</strong> is kept,
          and every result, register and receipt from before stays attached.
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="input-label" for="ra_class">Class</label>
            <select id="ra_class" class="input">
              ${classes.map(c => `<option value="${c.id}" ${c.id === s.classId ? 'selected' : ''}>${_slcEsc(c.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="input-label" for="ra_session">Session</label>
            <select id="ra_session" class="input">
              ${sessions.length
                ? sessions.map(x => `<option value="${_slcEsc(x.name)}" ${x.name === currentSession ? 'selected' : ''}>${_slcEsc(x.name)}</option>`).join('')
                : `<option value="${_slcEsc(currentSession)}">${_slcEsc(currentSession)}</option>`}
            </select>
          </div>
        </div>

        <div>
          <label class="input-label" for="ra_date">Date of return</label>
          <input id="ra_date" type="date" class="input sm:max-w-xs" value="${today()}" />
        </div>

        ${owed > 0 ? `<div class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ${icon('naira','w-4 h-4 inline')} <strong>${money(owed)} outstanding from before.</strong>
          It comes back with them and stays on the ledger.
        </div>` : ''}

        <div>
          <label class="input-label" for="ra_notes">Notes <span class="font-normal text-slate-400">(optional)</span></label>
          <textarea id="ra_notes" rows="2" class="input" placeholder="e.g. returned after a year in Kano"></textarea>
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="confirmReadmitStudent('${studentId}')">${icon('check','w-4 h-4')} Re-admit</button>`
  }), 50);
}

function confirmReadmitStudent(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const classId = document.getElementById('ra_class').value;
  const session = document.getElementById('ra_session').value;
  const date = document.getElementById('ra_date').value;
  const notes = (document.getElementById('ra_notes').value || '').trim();
  if (!isFormerStudent(s)) { toast(`${s.name} is already enrolled`, 'warn'); return; }
  if (!classId) { toast('Pick a class', 'danger'); return; }
  if (!date) { toast('A date of return is required', 'danger'); return; }

  const periods = enrolmentPeriods(s).slice();
  const last = periods[periods.length - 1];
  if (last && last.endDate && date < last.endDate) {
    toast('The date of return cannot be before the date they left', 'danger');
    return;
  }
  periods.push({ id: uid('enr'), startDate: date, endDate: '', classId, session, reason: '', outcome: '', notes });

  DB.update('students', studentId, {
    status: 'active', classId,
    enrollmentSession: session,
    readmittedAt: now(), readmittedBy: AUTH.current ? AUTH.current.id : 'system',
    // The exit stays in the enrolment history; it is no longer the current state.
    exitReasonId: null, exitReason: null, exitOutcome: null, exitDate: null, exitNotes: null,
    enrolments: periods
  });

  const cls = DB.find('classes', classId);
  DB.insert('auditLog', {
    id: uid('aud'), schoolId: s.schoolId,
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'student_readmitted',
    target: `${s.name} · ${cls ? cls.name : classId} · ${session} · returned ${fdate(date, { long: true })}`,
    timestamp: now()
  });

  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${s.name} re-admitted to ${cls ? cls.name : 'class'} — ${periods.length} enrolment periods on record`, 'success');
}

/* ============================================================
   SETTINGS — the school's own reason list
   ============================================================ */
function renderExitReasonSettings() {
  const reasons = exitReasons();
  return `
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3 mb-1">
        <h4 class="font-bold text-slate-900">Reasons for leaving</h4>
        <button class="btn btn-secondary text-sm" onclick="addExitReason()">${icon('plus','w-4 h-4')} Add reason</button>
      </div>
      <p class="text-xs text-slate-500 mb-3">
        Offered when a student leaves. The four the system acts on cannot be removed — a transfer issues
        a certificate, a graduation creates an alumnus, and a death is excluded from fee chasing.
      </p>
      <div class="space-y-2">
        ${reasons.map((r, i) => `
          <div class="flex items-center gap-2">
            <input class="input flex-1 !py-1 text-sm" value="${_slcEsc(r.label)}" ${r.system ? 'readonly' : ''}
                   onchange="setExitReason(${i},'label',this.value)" />
            <select class="input !w-44 !py-1 text-sm" ${r.system ? 'disabled' : ''} onchange="setExitReason(${i},'outcome',this.value)">
              ${EXIT_OUTCOMES.map(o => `<option value="${o.key}" ${r.outcome === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
            ${r.system
              ? `<span class="badge badge-neutral flex-shrink-0">System</span>`
              : `<button class="btn btn-ghost !p-1.5 text-slate-400 hover:text-rose-600 flex-shrink-0" aria-label="Remove" title="Remove"
                         onclick="removeExitReason(${i})">${icon('x','w-4 h-4')}</button>`}
          </div>`).join('')}
      </div>
    </div>`;
}

function _saveExitReasons(list) { DB.settings({ exitReasons: list }); }

function setExitReason(i, field, value) {
  const list = exitReasons().map(r => Object.assign({}, r));
  if (!list[i] || list[i].system) return;
  list[i][field] = field === 'label' ? String(value).trim() : value;
  if (field === 'label' && !list[i].label) { toast('A reason needs a name', 'danger'); return; }
  _saveExitReasons(list);
}

function addExitReason() {
  const list = exitReasons().map(r => Object.assign({}, r));
  list.push({ id: uid('exr'), label: 'New reason', outcome: 'withdrawn', system: false });
  _saveExitReasons(list);
  APP.render();
}

function removeExitReason(i) {
  const list = exitReasons().map(r => Object.assign({}, r));
  const r = list[i];
  if (!r || r.system) return;
  // Re-admission clears the current exit, so the history has to be checked too —
  // otherwise a reason silently becomes deletable the moment a student returns.
  const used = DB.query('students', s => s.exitReasonId === r.id ||
    (Array.isArray(s.enrolments) && s.enrolments.some(e => e.reasonId === r.id))).length;
  if (used) { toast(`"${r.label}" is on ${used} student record${used === 1 ? '' : 's'} — rename it instead of removing it`, 'danger'); return; }
  list.splice(i, 1);
  _saveExitReasons(list);
  APP.render();
  toast('Reason removed', 'info');
}
