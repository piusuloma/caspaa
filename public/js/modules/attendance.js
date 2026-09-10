/* ============================================================
   Attendance — schedule boundaries, live oversight, instant
   roster marking, the cutoff sweep, and the alert dispatcher.
   ------------------------------------------------------------
   Epic 1  renderTimeAttendanceSettings   admin schedule console
           attScheduleBarHtml /            fragments the existing
           attPendingCount /               Academic > Attendance
           attAlertsViewHtml               page composes
   Epic 2  view_tch_attendance (override) pending state, instant
                                          marking, late warning,
                                          post-cutoff correction
   Epic 3  attRunSweep                    auto-absent at cutoff
           attDispatch                    WhatsApp + push alerts

   NOTE ON DELIVERY STATUS: there is no messaging backend in this
   build. Every alert is written to the commsLog, and its
   Sent -> Delivered -> Read progression is DERIVED from how long
   ago it was queued so the oversight screen behaves like the real
   thing. The UI says so plainly rather than implying real
   delivery receipts.
   ============================================================ */

const ATT_DEFAULTS = { homeroomStart: '08:00', absenceCutoff: '08:30', whatsapp: true, push: true };

function attSettings() {
  return Object.assign({}, ATT_DEFAULTS, DB.settings().attendance || {});
}

/* "08:30" -> 510. Used for every comparison so nothing has to reason
   about Date objects and timezones. */
function attMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}
function attNowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function attNowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function att12h(hhmm) {
  const m = attMinutes(hhmm), h = Math.floor(m / 60), mm = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}
function _attEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* =============================================================
   EPIC 1.1 — Time & Attendance Settings console
   ============================================================= */
function renderTimeAttendanceSettings() {
  const s = attSettings();
  return `
    <div class="space-y-4">
      <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900 flex items-start gap-2">
        ${icon('info','w-4 h-4 flex-shrink-0 mt-0.5')}
        <span>These two times drive everything else: a student marked present after the
        homeroom start is flagged late-arriving, and anyone still unmarked at the cutoff is
        swept to absent automatically so no child is silently unaccounted for.</span>
      </div>

      <div class="card p-5">
        <h4 class="font-bold text-slate-900 mb-4">Daily Schedule Boundaries</h4>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label" for="att_start">Homeroom Start Time</label>
            <input id="att_start" type="time" class="input" value="${s.homeroomStart}" onchange="attValidateTimes()" />
            <p class="text-xs text-slate-500 mt-1">Marking a student present after this flags a late arrival.</p>
          </div>
          <div>
            <label class="input-label" for="att_cutoff">Absence Cutoff Time</label>
            <input id="att_cutoff" type="time" class="input" value="${s.absenceCutoff}" onchange="attValidateTimes()" />
            <p class="text-xs text-slate-500 mt-1">Unmarked students are swept to absent at this time.</p>
          </div>
        </div>
        <div id="att_timeError" class="hidden mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-800 font-semibold"></div>

        <div id="att_window" class="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"></div>
      </div>

      <div class="card p-5">
        <h4 class="font-bold text-slate-900 mb-1">Guardian Alert Channels</h4>
        <p class="text-xs text-slate-500 mb-3">Every status change fires on the channels enabled here.</p>
        <div class="space-y-2">
          ${[['att_whatsapp', 'WhatsApp', 'A message to the guardian\'s registered number', s.whatsapp],
             ['att_push', 'In-App Push', 'A banner in the parent\'s CASPAA app', s.push]].map(([id, label, hint, on]) => `
            <label class="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl cursor-pointer">
              <input id="${id}" type="checkbox" class="mt-0.5" ${on ? 'checked' : ''} />
              <span class="text-sm">
                <span class="font-semibold text-slate-900">${label}</span>
                <span class="block text-xs text-slate-500 mt-0.5">${hint}</span>
              </span>
            </label>`).join('')}
        </div>
        <div class="mt-3 text-xs text-amber-800 bg-amber-50 rounded-xl px-4 py-2.5">
          No messaging provider is connected in this build — alerts are recorded in the
          communication log and their delivery status is simulated.
        </div>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-primary" onclick="attSaveSettings()">${icon('check','w-4 h-4')} Save Settings</button>
        <button class="btn btn-secondary" onclick="attResetSettings()">Reset to Default</button>
      </div>
    </div>`;
}

/* Cutoff must be strictly later than start — the sweep would otherwise fire
   before the teacher could mark anyone, absenting a full class. */
function attValidateTimes() {
  const startEl = document.getElementById('att_start');
  const cutoffEl = document.getElementById('att_cutoff');
  const err = document.getElementById('att_timeError');
  const win = document.getElementById('att_window');
  if (!startEl || !cutoffEl) return true;

  const start = attMinutes(startEl.value), cutoff = attMinutes(cutoffEl.value);
  let msg = '';
  if (!startEl.value || !cutoffEl.value) msg = 'Both times are required.';
  else if (cutoff <= start) msg = 'The absence cutoff must be strictly later than the homeroom start time.';

  if (err) { err.classList.toggle('hidden', !msg); err.textContent = msg; }
  if (win) {
    win.innerHTML = msg ? '<span class="text-slate-400">—</span>' : `
      ${icon('clock','w-4 h-4 inline text-brand-600')}
      Arrivals between <strong>${att12h(startEl.value)}</strong> and <strong>${att12h(cutoffEl.value)}</strong>
      are recorded as late. That is a <strong>${cutoff - start} minute</strong> grace window.`;
  }
  return !msg;
}

function attSaveSettings() {
  if (!attValidateTimes()) { toast('Fix the schedule times first', 'danger'); return; }
  DB.settings({ attendance: {
    homeroomStart: document.getElementById('att_start').value,
    absenceCutoff: document.getElementById('att_cutoff').value,
    whatsapp: document.getElementById('att_whatsapp').checked,
    push: document.getElementById('att_push').checked
  } });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'updated_attendance_settings',
    target: `Homeroom ${att12h(attSettings().homeroomStart)} · cutoff ${att12h(attSettings().absenceCutoff)}`, timestamp: now() });
  toast('Attendance settings saved', 'success');
  APP.render();
}

function attResetSettings() {
  DB.settings({ attendance: Object.assign({}, ATT_DEFAULTS) });
  toast('Reset to 8:00 AM / 8:30 AM', 'info');
  APP.render();
}

/* =============================================================
   EPIC 3.2 — the dispatcher
   ============================================================= */

/* One call per status change. Writes the in-app notification the parent
   actually sees, plus a commsLog row per enabled channel so the admin can
   prove what was sent. */
function attDispatch(student, status, stamp, opts = {}) {
  if (!student) return;
  const cfg = attSettings();
  const cls = DB.find('classes', student.classId);
  const where = cls ? cls.name : 'homeroom';
  const auto = !!opts.auto;

  let title, body, tone;
  if (opts.correction) {
    title = 'Attendance Corrected';
    body = `Update: ${student.name} has safely arrived at ${att12h(stamp)}. Attendance status corrected to ${status === 'late' ? 'Late' : 'Present'}.`;
    tone = 'info';
  } else if (status === 'absent') {
    title = 'Urgent — Missing from Homeroom';
    body = `Urgent: ${student.name} is missing from morning homeroom as of ${att12h(stamp)}. Please contact us to confirm.`;
    tone = 'warn';
  } else {
    title = status === 'late' ? 'Late Arrival' : 'Arrived Safely';
    body = `Notice: ${student.name} arrived at school at ${att12h(stamp)}${status === 'late' ? ' (late)' : ''}.`;
    tone = 'success';
  }

  if (student.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: student.parentId, title, body,
      channel: [cfg.whatsapp && 'whatsapp', cfg.push && 'app'].filter(Boolean).join('+') || 'app',
      type: tone, read: false, timestamp: now(), link: { view: 'par_dashboard' }
    });
  }

  const parent = student.parentId ? DB.find('parents', student.parentId) : null;
  const channels = [];
  if (cfg.whatsapp) channels.push('whatsapp');
  if (cfg.push) channels.push('push');
  channels.forEach(ch => {
    DB.insert('commsLog', {
      id: uid('cml'), schoolId: student.schoolId, studentId: student.id, classId: student.classId,
      parentId: student.parentId || null,
      to: ch === 'whatsapp' ? (parent ? parent.phone : '—') : (parent ? parent.name : '—'),
      channel: ch, trigger: opts.correction ? 'correction' : status,
      auto, body, queuedAt: now()
    });
  });
}

/* Sent -> Delivered -> Read, derived from age. No provider webhooks exist here,
   so this is a simulation and the screen says so. */
function attCommsStatus(entry) {
  const age = (Date.now() - new Date(entry.queuedAt).getTime()) / 1000;
  if (entry.channel === 'push') return age < 8 ? 'Sent' : 'Delivered';
  if (age < 5) return 'Sent';
  if (age < 25) return 'Delivered';
  return 'Read';
}

/* =============================================================
   EPIC 3.1 — the safety auto-absent sweep
   ============================================================= */

/* Marks every student with no record for the day as absent, stamped with the
   scheduled cutoff (not "now") so the record reflects the rule that fired it.
   Returns how many were swept. */
function attRunSweep(date, opts = {}) {
  const cfg = attSettings();
  const sid = currentSchoolId();
  date = date || today();
  const classes = DB.query('classes', c => c.schoolId === sid);
  let swept = 0;

  classes.forEach(cls => {
    COMPUTE.studentsByClass(cls.id).forEach(s => {
      const has = DB.query('attendance', a => a.studentId === s.id && a.date === date)[0];
      if (has) return;
      DB.insert('attendance', {
        id: uid('att'), schoolId: sid, studentId: s.id, classId: cls.id, date,
        status: 'absent', recordedBy: 'system', auto: true,
        markedAt: cfg.absenceCutoff, markedAtFull: now()
      });
      attDispatch(s, 'absent', cfg.absenceCutoff, { auto: true });
      swept++;
    });
  });

  if (swept) {
    DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: 'system',
      action: 'auto_absent_sweep',
      target: `${swept} student${swept === 1 ? '' : 's'} auto-marked absent at ${att12h(cfg.absenceCutoff)} on ${fdate(date, { long: true })}`,
      timestamp: now() });
  }
  if (!opts.silent) {
    toast(swept ? `Sweep complete — ${swept} auto-marked absent` : 'Sweep ran — every student was already marked', swept ? 'warn' : 'success');
    APP.render();
  }
  return swept;
}

/* Has today's sweep already happened? One audit row per sweep per day. */
function attSweptToday(date) {
  date = date || today();
  return DB.query('auditLog', l => l.action === 'auto_absent_sweep' && String(l.target).includes(fdate(date, { long: true }))).length > 0;
}

/* Called from the render path of both attendance screens: if the wall clock is
   past the cutoff and nothing has swept today, do it quietly. This is the
   nearest honest equivalent to the PRD's cron job in a client-only build. */
function attMaybeAutoSweep() {
  const cfg = attSettings();
  if (attNowMinutes() < attMinutes(cfg.absenceCutoff)) return 0;
  if (attSweptToday()) return 0;
  return attRunSweep(today(), { silent: true });
}

/* =============================================================
   EPIC 2 — teacher roster (overrides teacher.js)
   ============================================================= */

const ATT_STATUS_META = {
  present: { label: 'Present', badge: 'badge-success', dot: 'bg-emerald-500' },
  late:    { label: 'Late',    badge: 'badge-warn',    dot: 'bg-amber-500' },
  absent:  { label: 'Absent',  badge: 'badge-danger',  dot: 'bg-rose-500' },
  pending: { label: 'Pending', badge: 'badge-neutral', dot: 'bg-slate-300' }
};

function view_tch_attendance() {
  const classes = teacherClasses();
  if (!classes.length) return emptyState({ title: 'No classes assigned', body: 'Contact admin to assign you to a class.', icon: 'classes' });

  const classId = APP.params.classId || classes[0].id;
  const cls = DB.find('classes', classId);
  const date = APP.params.date || today();
  const isToday = date === today();
  const cfg = attSettings();

  if (isToday) attMaybeAutoSweep();

  const students = COMPUTE.studentsByClass(classId);
  const records = DB.query('attendance', a => a.classId === classId && a.date === date);
  const rec = id => records.find(r => r.studentId === id);

  const count = st => students.filter(s => { const r = rec(s.id); return st === 'pending' ? !r : r && r.status === st; }).length;
  const pending = count('pending');
  const pastCutoff = isToday && attNowMinutes() >= attMinutes(cfg.absenceCutoff);
  const pastStart = isToday && attNowMinutes() > attMinutes(cfg.homeroomStart);

  return `
    ${pageHeader({
      title: 'Mark Attendance',
      subtitle: `${_attEsc(cls.name)} · ${fdate(date, { long: true })}${isOffline() ? ' · <span class="badge badge-warn ml-1">Offline</span>' : ''}`
    })}

    <div class="card p-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <span class="flex items-center gap-2 text-slate-600">${icon('clock','w-4 h-4 text-brand-600')}
        Homeroom starts <strong class="text-slate-900">${att12h(cfg.homeroomStart)}</strong></span>
      <span class="flex items-center gap-2 text-slate-600">${icon('bell','w-4 h-4 text-brand-600')}
        Absence cutoff <strong class="text-slate-900">${att12h(cfg.absenceCutoff)}</strong></span>
      ${isToday ? `<span class="ml-auto">${pastCutoff
        ? `<span class="badge badge-danger">Cutoff passed — unmarked students were swept to absent</span>`
        : `<span class="badge badge-success">Roster open · sweep at ${att12h(cfg.absenceCutoff)}</span>`}</span>` : ''}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      ${[['present', count('present')], ['late', count('late')], ['absent', count('absent')], ['pending', pending]].map(([k, n]) => `
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span class="w-2 h-2 rounded-full ${ATT_STATUS_META[k].dot}"></span>${ATT_STATUS_META[k].label}
          </div>
          <div class="text-2xl font-extrabold text-slate-900 mt-1">${n}</div>
        </div>`).join('')}
    </div>

    <div class="card p-4 mb-4 flex items-center justify-between flex-wrap gap-2">
      <div class="text-sm text-slate-600">
        <strong>${students.length - pending}</strong> of ${students.length} marked${pending ? ` · ${pending} still pending` : ' · roster complete'}
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost text-sm" onclick="attMarkAll('${classId}','${date}','present')">${icon('check','w-4 h-4')} All Present</button>
        ${isToday && pending ? `<button class="btn btn-secondary text-sm" onclick="attRunSweep('${date}')">${icon('bell','w-4 h-4')} Run cutoff sweep now</button>` : ''}
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="divide-y divide-slate-100">
        ${students.map(s => attRosterRow(s, rec(s.id), classId, date, cfg, pastStart)).join('')}
      </div>
    </div>

    <p class="text-xs text-slate-500 mt-3 flex items-start gap-2">
      ${icon('info','w-3.5 h-3.5 flex-shrink-0 mt-0.5')}
      <span>Each tap saves immediately and alerts the guardian — there is no separate save step.
      A student marked absent stays tappable, so checking in a late arrival corrects the record and sends a follow-up.</span>
    </p>
  `;
}

function attRosterRow(s, r, classId, date, cfg, pastStart) {
  const status = r ? r.status : 'pending';
  const meta = ATT_STATUS_META[status];
  const btn = (k, label, activeCls, hoverCls) => `
    <button onclick="attMark('${s.id}','${classId}','${date}','${k}')"
            aria-pressed="${status === k}"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition
                   ${status === k ? activeCls : `bg-white border-slate-200 text-slate-600 ${hoverCls}`}">${label}</button>`;

  // Present, but stamped after the homeroom bell — accepted, and flagged.
  const lateFlag = r && r.status === 'present' && r.markedAt && attMinutes(r.markedAt) > attMinutes(cfg.homeroomStart);
  const corrected = r && r.correctedFrom;

  return `
    <div class="p-3 flex items-center gap-3 flex-wrap">
      ${avatar(s, 'md')}
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-slate-900">${_attEsc(s.name)}</div>
        <div class="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          <span>${_attEsc(s.admissionNo || '')}</span>
          <span class="badge ${meta.badge}">${meta.label}</span>
          ${r && r.markedAt ? `<span>${r.auto ? 'auto-marked' : 'marked'} ${att12h(r.markedAt)}</span>` : ''}
          ${corrected ? `<span class="text-brand-700 font-semibold">corrected from ${ATT_STATUS_META[r.correctedFrom].label}</span>` : ''}
        </div>
        ${lateFlag ? `<div class="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
          ${icon('bell','w-3.5 h-3.5')} Checked in at ${att12h(r.markedAt)}, after the ${att12h(cfg.homeroomStart)} start
        </div>` : ''}
      </div>
      <div class="flex gap-1.5 flex-shrink-0">
        ${btn('present', 'Present', 'bg-emerald-500 text-white border-emerald-500', 'hover:border-emerald-500')}
        ${btn('late',    'Late',    'bg-amber-500 text-white border-amber-500',     'hover:border-amber-500')}
        ${btn('absent',  'Absent',  'bg-rose-500 text-white border-rose-500',       'hover:border-rose-500')}
      </div>
    </div>`;
}

/* One tap = one saved record + one dispatched alert. Overriding an existing
   absence records a NEW arrival timestamp and fires the correction message. */
function attMark(studentId, classId, date, status) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const existing = DB.query('attendance', a => a.studentId === studentId && a.date === date)[0];
  if (existing && existing.status === status) return;   // same tap twice — nothing changed

  const stamp = date === today() ? attNowHHMM() : attSettings().homeroomStart;
  const wasAbsent = existing && existing.status === 'absent';
  const isCorrection = wasAbsent && status !== 'absent';

  if (existing) {
    DB.update('attendance', existing.id, {
      status, markedAt: stamp, markedAtFull: now(),
      recordedBy: AUTH.current ? AUTH.current.id : 'system',
      auto: false,
      correctedFrom: existing.status,
      previousMarkedAt: existing.markedAt || null
    });
  } else {
    DB.insert('attendance', {
      id: uid('att'), schoolId: s.schoolId, studentId, classId, date, status,
      markedAt: stamp, markedAtFull: now(),
      recordedBy: AUTH.current ? AUTH.current.id : 'system', auto: false
    });
  }

  attDispatch(s, status, stamp, { correction: isCorrection });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current ? AUTH.current.id : 'system',
    action: isCorrection ? 'attendance_corrected' : 'attendance_marked',
    target: `${s.name} → ${ATT_STATUS_META[status].label} at ${att12h(stamp)}${isCorrection ? ' (was Absent)' : ''}`,
    timestamp: now() });

  toast(isCorrection
    ? `${s.name} corrected to ${ATT_STATUS_META[status].label} — guardian notified`
    : `${s.name} marked ${ATT_STATUS_META[status].label}`, isCorrection ? 'info' : 'success');
  APP.render();
}

function attMarkAll(classId, date, status) {
  const students = COMPUTE.studentsByClass(classId);
  const records = DB.query('attendance', a => a.classId === classId && a.date === date);
  let n = 0;
  students.forEach(s => {
    if (records.find(r => r.studentId === s.id)) return;   // never overwrite a deliberate mark
    attMark(s.id, classId, date, status);
    n++;
  });
  toast(n ? `${n} unmarked student${n === 1 ? '' : 's'} set to ${status}` : 'Everyone was already marked', n ? 'success' : 'info');
}

/* =============================================================
   EPIC 1.2 — administrative oversight

   This does NOT get its own page. Attendance already lives at
   Academic > Attendance, which had a school overview and a class
   drill-down; duplicating it in the sidebar just split the same
   job across two screens. The oversight pieces below are
   fragments that view_adm_attendance composes into that page.
   ============================================================= */

/* Deep links and notifications written against the old route still land
   somewhere sensible. */
function view_adm_attendance_live() {
  APP.params = { academicTab: 'attendance', attView: APP.params.attView || 'school' };
  return view_adm_academic();
}

/* The schedule bar: where the boundaries are, whether the sweep has run,
   and the two actions that belong with them. */
function attScheduleBarHtml(date) {
  const cfg = attSettings();
  const isToday = date === today();
  const swept = attSweptToday(date);
  return `
    <div class="card p-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <span class="flex items-center gap-2 text-slate-600">${icon('clock','w-4 h-4 text-brand-600')}
        Homeroom <strong class="text-slate-900">${att12h(cfg.homeroomStart)}</strong></span>
      <span class="flex items-center gap-2 text-slate-600">${icon('bell','w-4 h-4 text-brand-600')}
        Cutoff <strong class="text-slate-900">${att12h(cfg.absenceCutoff)}</strong></span>
      <span>${swept
        ? '<span class="badge badge-neutral">Cutoff sweep has run for this day</span>'
        : isToday ? `<span class="badge badge-success">Sweep pending &middot; ${att12h(cfg.absenceCutoff)}</span>`
                  : '<span class="badge badge-neutral">No sweep recorded for this day</span>'}</span>
      <span class="ml-auto flex flex-wrap gap-2">
        ${isToday ? `<button class="btn btn-secondary text-sm" onclick="attRunSweep('${date}')">${icon('bell','w-4 h-4')} Run sweep now</button>` : ''}
        <button class="btn btn-secondary text-sm" onclick="APP.go('adm_settings', { setTab: 'attendance' })">${icon('settings','w-4 h-4')} Schedule Settings</button>
        <button class="btn btn-secondary text-sm" onclick="APP.params.attView='alerts'; APP.render()">${icon('send','w-4 h-4')} Guardian Alerts</button>
      </span>
    </div>`;
}

/* How many students are still unmarked school-wide for the day. The existing
   dashboard counted present/late/absent but had no word for "nobody has
   touched this child yet", which is the number that actually matters before
   the cutoff. */
function attPendingCount(date) {
  const sid = currentSchoolId();
  const recs = DB.query('attendance', a => a.date === date);
  return DB.query('classes', c => c.schoolId === sid).reduce((sum, cls) => {
    const students = COMPUTE.studentsByClass(cls.id);
    return sum + (students.length - recs.filter(r => r.classId === cls.id).length);
  }, 0);
}

/* The alerts view — the one genuinely new screen, reached from the schedule bar. */
function attAlertsViewHtml(date) {
  return `
    ${pageHeader({
      title: 'Attendance — Guardian Alerts',
      subtitle: `Delivery record for every alert this system raised &middot; ${fdate(date, { long: true })}`,
      actions: `
        <input type="date" class="input !w-auto" value="${date}" onchange="APP.params.date=this.value; APP.render()" />
        <button class="btn btn-secondary" onclick="APP.params.attView='school'; APP.render()">${icon('dashboard','w-4 h-4')} School Overview</button>`
    })}
    ${attScheduleBarHtml(date)}
    ${attCommsLogHtml(date)}`;
}

function attCommsLogHtml(date) {
  const sid = currentSchoolId();
  const day = String(date).slice(0, 10);
  const log = DB.query('commsLog', c => c.schoolId === sid && String(c.queuedAt).slice(0, 10) === day)
    .slice().sort((a, b) => String(b.queuedAt).localeCompare(String(a.queuedAt)));

  if (!log.length) {
    return emptyState({ icon: 'send', title: 'No alerts sent for this day',
      body: 'Guardian alerts appear here the moment a teacher marks a student or the cutoff sweep runs.' });
  }

  const statusBadgeCls = { Sent: 'badge-neutral', Delivered: 'badge-info', Read: 'badge-success', Failed: 'badge-danger' };
  const triggerLabel = { present: 'Arrival', late: 'Late arrival', absent: 'Absence', correction: 'Correction' };

  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead>
          <tr>
            <th scope="col">Time</th><th scope="col">Student</th><th scope="col">Recipient</th>
            <th scope="col">Channel</th><th scope="col">Trigger</th>
            <th scope="col">Message</th><th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          ${log.slice(0, 100).map(c => {
            const s = DB.find('students', c.studentId);
            const st = attCommsStatus(c);
            return `<tr>
              <td class="whitespace-nowrap text-slate-500">${fdate(c.queuedAt, { time: true })}</td>
              <td class="font-semibold">${s ? _attEsc(s.name) : '—'}</td>
              <td class="text-slate-600">${_attEsc(c.to || '—')}</td>
              <td>${c.channel === 'whatsapp'
                ? '<span class="badge badge-success">WhatsApp</span>'
                : '<span class="badge badge-info">In-App Push</span>'}</td>
              <td><span class="badge badge-neutral">${triggerLabel[c.trigger] || c.trigger}${c.auto ? ' · auto' : ''}</span></td>
              <td class="text-slate-600 text-xs max-w-md">${_attEsc(c.body)}</td>
              <td><span class="badge ${statusBadgeCls[st]}">${st}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-slate-500 mt-2 flex items-start gap-2">
      ${icon('info','w-3.5 h-3.5 flex-shrink-0 mt-0.5')}
      <span>No messaging provider is connected in this build. Every row is a real record of an
      alert this system raised; the Sent / Delivered / Read progression is simulated from the
      queue time rather than read from provider receipts.</span>
    </p>`;
}
