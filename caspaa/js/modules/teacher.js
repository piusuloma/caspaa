/* ============================================================
   TEACHER MODULE
   ============================================================ */

/* Returns the assessment type columns for the current term from exam structure settings.
   Maps: first N-1 types → ca1/ca2/ca3/ca4, last type → exam (always the final exam). */
function getTermAssessmentTypes() {
  const s = DB.settings();
  const term = (s.currentTerm || '').toLowerCase();
  const es = s.examStructure;
  const fallback = [{ label: 'CA 1', weight: 20 }, { label: 'CA 2', weight: 20 }, { label: 'Exam', weight: 60 }];
  if (!es || !es.terms || !es.terms.length) return fallback;
  const match = es.terms.find(t => {
    const tn = t.name.toLowerCase();
    if (term.includes('1st') || term.includes('first'))  return tn.includes('first')  || tn.includes('1st');
    if (term.includes('2nd') || term.includes('second')) return tn.includes('second') || tn.includes('2nd');
    if (term.includes('3rd') || term.includes('third'))  return tn.includes('third')  || tn.includes('3rd');
    return false;
  });
  const types = (match || es.terms[0]).types;
  return types && types.length ? types : fallback;
}

/* Maps position index → storage field name (last type always = 'exam'). */
function termTypeKey(types, idx) {
  if (idx === types.length - 1) return 'exam';
  return ['ca1', 'ca2', 'ca3', 'ca4'][idx] || `ca${idx + 1}`;
}

/* ---------- Self clock-in / clock-out ---------- */
function todaysClockRecord(staffId) {
  return DB.query('staffAttendance', a => a.staffId === staffId && a.date === today())[0];
}

function renderClockInCard(staffId) {
  const rec = todaysClockRecord(staffId);
  if (!rec) {
    // Not clocked in yet
    return `<div class="bg-white/15 backdrop-blur rounded-2xl p-4 lg:min-w-[260px]">
      <div class="text-brand-200 text-xs uppercase font-semibold mb-1">Not clocked in</div>
      <div class="text-2xl font-bold mb-2">${new Date().toTimeString().slice(0,5)}</div>
      <button class="bg-white text-brand-700 px-5 py-2.5 rounded-xl font-bold w-full text-sm hover:bg-brand-50" onclick="staffClockIn()">${icon('check','w-4 h-4 inline')} Clock In Now</button>
    </div>`;
  }
  if (rec.clockOut) {
    // Done for the day
    const inH = parseInt(rec.clockIn.split(':')[0]);
    const inM = parseInt(rec.clockIn.split(':')[1]);
    const outH = parseInt(rec.clockOut.split(':')[0]);
    const outM = parseInt(rec.clockOut.split(':')[1]);
    const mins = (outH * 60 + outM) - (inH * 60 + inM);
    const hrs = Math.floor(mins / 60);
    const minsLeft = mins % 60;
    return `<div class="bg-emerald-500/30 backdrop-blur rounded-2xl p-4 lg:min-w-[260px]">
      <div class="text-emerald-100 text-xs uppercase font-semibold mb-1">${icon('check','w-3 h-3 inline')} Day complete</div>
      <div class="text-2xl font-bold mb-1">${hrs}h ${minsLeft}m</div>
      <div class="text-xs text-emerald-100">${rec.clockIn} → ${rec.clockOut}</div>
    </div>`;
  }
  // Clocked in, not clocked out yet
  return `<div class="bg-white/15 backdrop-blur rounded-2xl p-4 lg:min-w-[260px]">
    <div class="text-brand-200 text-xs uppercase font-semibold mb-1">Clocked in at ${rec.clockIn}${rec.status === 'late' ? ' · <span class="text-amber-200 font-bold">LATE</span>' : ''}</div>
    <div class="text-2xl font-bold mb-2">${new Date().toTimeString().slice(0,5)}</div>
    <button class="bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold w-full text-sm hover:bg-rose-600" onclick="staffClockOut()">${icon('logout','w-4 h-4 inline')} Clock Out</button>
  </div>`;
}

function staffClockIn() {
  const staffId = AUTH.current.id;
  const existing = todaysClockRecord(staffId);
  if (existing) { toast('Already clocked in today', 'warn'); return; }
  const clockIn = new Date().toTimeString().slice(0, 5);
  const [h, m] = clockIn.split(':').map(Number);
  // Anything after 08:00 counts as late (configurable in real product)
  const status = (h >= 8 && m > 0) || h >= 9 ? 'late' : 'present';
  DB.insert('staffAttendance', {
    id: uid('satt'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    staffId, date: today(),
    clockIn, clockOut: null,
    status, source: 'self'
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.schoolId || 'sch_brightlights', actor: staffId, action: 'staff_clock_in', target: `${clockIn}${status === 'late' ? ' (late)' : ''}`, timestamp: now() });
  toast(`Clocked in at ${clockIn}${status === 'late' ? ' · marked late' : ''}`, status === 'late' ? 'warn' : 'success');
  APP.render();
}

function staffClockOut() {
  const staffId = AUTH.current.id;
  const rec = todaysClockRecord(staffId);
  if (!rec) { toast("You haven't clocked in today", 'danger'); return; }
  const clockOut = new Date().toTimeString().slice(0, 5);
  DB.update('staffAttendance', rec.id, { clockOut });
  DB.insert('auditLog', { id: uid('aud'), schoolId: rec.schoolId, actor: staffId, action: 'staff_clock_out', target: clockOut, timestamp: now() });
  toast(`Clocked out at ${clockOut}. Have a good evening.`, 'success');
  APP.render();
}

/* ---------- Substitute coverage acceptance widget ---------- */
function renderSubstituteRequestsWidget(staffId) {
  const requests = DB.query('substituteCoverage', c => c.substituteTeacherId === staffId);
  const pending = requests.filter(c => c.status === 'pending' || !c.status);
  const upcoming = requests.filter(c => c.status === 'accepted' && new Date(c.from) >= new Date());
  if (pending.length === 0 && upcoming.length === 0) return '';
  return `
    <div class="card p-5 border-l-4 border-amber-500">
      <h3 class="font-bold text-slate-900 mb-3">${pending.length ? '⚠️ Substitute Coverage Requested' : 'Upcoming Coverage'}</h3>
      <div class="space-y-2">
        ${pending.map(c => {
          const original = DB.find('teachers', c.originalTeacherId);
          const days = Math.ceil((new Date(c.to) - new Date(c.from)) / 86400000) + 1;
          return `<div class="p-3 bg-amber-50 rounded-xl">
            <div class="text-sm">
              <strong>${original ? original.name : 'A colleague'}</strong> needs coverage from <strong>${fdate(c.from, { long: true })}</strong> to <strong>${fdate(c.to, { long: true })}</strong> (${days} days).
            </div>
            <div class="text-xs text-slate-600 mt-1">Their classes will be added to your timetable for that period.</div>
            <div class="flex gap-2 mt-3">
              <button class="btn btn-primary !py-1.5 text-sm" onclick="decideSubstituteCoverage('${c.id}', 'accepted')">${icon('check','w-3.5 h-3.5')} Accept</button>
              <button class="btn btn-secondary !py-1.5 text-sm" onclick="decideSubstituteCoverage('${c.id}', 'declined')">${icon('x','w-3.5 h-3.5')} Decline</button>
            </div>
          </div>`;
        }).join('')}
        ${upcoming.map(c => {
          const original = DB.find('teachers', c.originalTeacherId);
          return `<div class="p-3 bg-emerald-50 rounded-xl text-sm">
            ${icon('check','w-4 h-4 inline text-emerald-700')} Covering for <strong>${original ? original.name : 'colleague'}</strong> · ${fdate(c.from, { short: true })} – ${fdate(c.to, { short: true })}
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ---------- Teacher self-service Leave Request ---------- */
function renderMyLeaveWidget(staffId) {
  const myLeaves = DB.query('leaveRequests', l => l.staffId === staffId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const pending = myLeaves.filter(l => l.status === 'pending').length;
  const upcoming = myLeaves.filter(l => l.status === 'approved' && new Date(l.from) >= new Date()).length;
  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-900">My Leave</h3>
        <button class="btn btn-primary text-sm" onclick="requestLeaveModal()">${icon('plus','w-3.5 h-3.5')} Request Leave</button>
      </div>
      ${myLeaves.length === 0
        ? `<p class="text-sm text-slate-500">You have no leave requests on file. Click <strong>Request Leave</strong> to submit one.</p>`
        : `<div class="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
            <div class="bg-amber-50 rounded-lg p-2"><div class="text-xs text-amber-700">Pending</div><div class="font-bold text-amber-900">${pending}</div></div>
            <div class="bg-emerald-50 rounded-lg p-2"><div class="text-xs text-emerald-700">Upcoming</div><div class="font-bold text-emerald-900">${upcoming}</div></div>
            <div class="bg-blue-50 rounded-lg p-2"><div class="text-xs text-blue-700">Total this year</div><div class="font-bold text-blue-900">${myLeaves.length}</div></div>
          </div>
          <div class="space-y-1.5">
            ${myLeaves.slice(0, 4).map(l => {
              const days = Math.ceil((new Date(l.to) - new Date(l.from)) / 86400000) + 1;
              return `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <span class="badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warn'}">${l.status}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold">${l.type} Leave · ${days}d</div>
                  <div class="text-xs text-slate-500">${fdate(l.from, { short: true })} – ${fdate(l.to, { short: true })}</div>
                </div>
              </div>`;
            }).join('')}
          </div>`}
    </div>
  `;
}

function requestLeaveModal() {
  modal({
    title: 'Request Leave',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Your request goes to the proprietor / HR for approval. They'll typically respond within 24 hours. You'll be notified on the bell icon.
        </div>
        <div>
          <label class="input-label">Leave Type</label>
          <select id="lvreq_type" class="input">
            <option>Casual</option>
            <option>Sick</option>
            <option>Annual</option>
            <option>Maternity</option>
            <option>Bereavement</option>
            <option>Study</option>
            <option>Compassionate</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">From</label><input id="lvreq_from" type="date" class="input" value="${daysAhead(7)}" /></div>
          <div><label class="input-label">To</label><input id="lvreq_to" type="date" class="input" value="${daysAhead(8)}" /></div>
        </div>
        <div>
          <label class="input-label">Reason</label>
          <textarea id="lvreq_reason" rows="3" class="input" placeholder="A brief note for the approver…"></textarea>
        </div>
        <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
          ${icon('check','w-3 h-3 inline')} A substitute teacher for your classes will be suggested automatically once approved.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="submitMyLeaveRequest()">${icon('send','w-4 h-4')} Submit Request</button>`
  });
}

function submitMyLeaveRequest() {
  const type = document.getElementById('lvreq_type').value;
  const from = document.getElementById('lvreq_from').value;
  const to = document.getElementById('lvreq_to').value;
  const reason = document.getElementById('lvreq_reason').value.trim();
  if (!from || !to) { toast('From and To dates required', 'danger'); return; }
  if (new Date(to) < new Date(from)) { toast('"To" date must be after "From" date', 'danger'); return; }
  const t = DB.find('teachers', AUTH.current.id) || {};
  DB.insert('leaveRequests', {
    id: uid('lv'),
    schoolId: t.schoolId || 'sch_brightlights',
    staffId: AUTH.current.id,
    type, from, to, reason,
    status: 'pending',
    source: 'self',
    requestedAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: t.schoolId || 'sch_brightlights', actor: AUTH.current.id, action: 'requested_leave', target: `${type} leave ${fdate(from,{short:true})}–${fdate(to,{short:true})}`, timestamp: now() });
  // Notify proprietor (school admin)
  DB.insert('notifications', { id: uid('not'), userId: t.schoolId || 'sch_brightlights', title: 'Leave Request', body: `${AUTH.current.name} is requesting ${type.toLowerCase()} leave from ${fdate(from,{long:true})} to ${fdate(to,{long:true})}.`, type: 'info', read: false, timestamp: now(), link: { view: 'adm_workforce', params: { workforceTab: 'hr', hrTab: 'leave' } } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Leave request submitted · awaiting approval', 'success');
}

function teacherClasses() {
  const t = DB.find('teachers', AUTH.current.id);
  if (!t) return [];
  return DB.get('classes').filter(c => t.classes.includes(c.id));
}

/* ---------- Dashboard ---------- */
function view_tch_dashboard() {
  const t = DB.find('teachers', AUTH.current.id);
  const classes = teacherClasses();
  const todayAttendance = DB.query('attendance', a => a.recordedBy === t.id && a.date === today());
  const totalStudents = classes.reduce((s, c) => s + COMPUTE.studentsByClass(c.id).length, 0);
  const pendingResults = DB.query('results', r => !r.approved && classes.some(c => c.id === r.classId)).length;
  const myAssignments = DB.query('assignments', a => a.teacherId === t.id);
  // Grading workload — submissions and CBTs awaiting the teacher
  const ungradedSubs = [];
  myAssignments.forEach(a => (a.submissions || []).forEach(sb => { if (sb.grade == null) ungradedSubs.push({ a, sb }); }));
  const myExams = DB.query('cbtExams', e => e.teacherId === t.id);
  const pendingCbt = DB.query('cbtSubmissions', x => x.status === 'submitted' && myExams.some(e => e.id === x.examId));
  const toGrade = ungradedSubs.length + pendingCbt.length;

  // Appraisal alerts
  const myAppraisals = DB.query('appraisals', a => a.staffId === t.id);
  const selfPendingApr = myAppraisals.find(a => a.status === 'self_pending');
  const ackPendingApr = myAppraisals.find(a => a.status === 'ack_pending');

  // Today's timetable
  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const todaySchedule = DB.query('timetable', tt => tt.teacherId === t.id && tt.day === day).sort((a,b) => a.period - b.period);
  const subjects = DB.get('subjects');

  return `
    <div class="space-y-5">
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p class="text-brand-200 text-sm">Welcome,</p>
            <h1 class="text-2xl lg:text-3xl font-extrabold">${t.name}</h1>
            <p class="text-brand-100 text-sm mt-1">${(() => {
              const subs = DB.get('subjects');
              if (Array.isArray(t.subjects) && t.subjects.length) {
                return t.subjects.map(id => (subs.find(s => s.id === id) || {}).name).filter(Boolean).join(', ');
              }
              return t.subject || 'Teacher';
            })()} · ${fdate(today(), { long: true })}</p>
          </div>
          ${renderClockInCard(t.id)}
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'My Classes', value: classes.length, icon: 'classes', color: 'brand', tooltip: `${totalStudents} students across your classes` })}
        ${statCard({ label: 'Today Marked', value: todayAttendance.length, icon: 'attendance', color: 'gold', trend: { direction: todayAttendance.length ? 'up' : 'down', label: todayAttendance.length ? 'attendance taken' : 'not marked yet' } })}
        ${statCard({ label: 'To Grade', value: toGrade, icon: 'edit', color: toGrade ? 'gold' : 'brand', trend: toGrade ? { direction: 'down', label: `${ungradedSubs.length} work · ${pendingCbt.length} CBT` } : { direction: 'up', label: 'all marked' } })}
        ${statCard({ label: 'Results Pending', value: pendingResults, icon: 'results', color: pendingResults ? 'rose' : 'brand', tooltip: 'Results you have submitted that await admin approval' })}
      </div>

      ${selfPendingApr ? `<button class="w-full flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-left hover:bg-amber-100 transition" onclick="APP.go('tch_appraisal')">
        <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-xl">✍️</span>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-amber-900">Self-Assessment Due</div>
          ${(() => { const c = DB.find('appraisalCycles', selfPendingApr.cycleId); return `<div class="text-sm text-amber-700">${c?.title || 'Appraisal'} · Deadline ${fdate(c?.deadline, { short: true })}</div>`; })()}
        </div>
        <span class="badge badge-warn">Action needed</span>
      </button>` : ''}

      ${ackPendingApr ? `<button class="w-full flex items-center gap-3 bg-brand-50 border-2 border-brand-200 rounded-xl p-4 text-left hover:bg-brand-100 transition" onclick="APP.go('tch_appraisal')">
        <span class="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-xl">🏆</span>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-brand-900">Appraisal Result Ready — Please Acknowledge</div>
          <div class="text-sm text-brand-700">Score: ${ackPendingApr.finalOverall}% · Outcome: ${_tch_outcomeLabel(ackPendingApr.outcome)}</div>
        </div>
        <span class="badge badge-info">Tap to view</span>
      </button>` : ''}

      ${toGrade ? `<div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Needs Grading</h3>
          <span class="badge badge-warn">${toGrade} item${toGrade !== 1 ? 's' : ''}</span>
        </div>
        <div class="space-y-2">
          ${ungradedSubs.slice(0, 4).map(({ a, sb }) => {
            const stu = DB.find('students', sb.studentId);
            return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
              <span class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">${icon('results','w-5 h-5')}</span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${stu ? stu.name : 'Student'} · ${a.title}</div>
                <div class="text-xs text-slate-500">Assignment · submitted ${fdate(sb.submittedAt, { relative: true })}</div>
              </div>
              <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="openAssignment('${a.id}')">Grade</button>
            </div>`;
          }).join('')}
          ${pendingCbt.slice(0, 4).map(sub => {
            const e = DB.find('cbtExams', sub.examId); const stu = DB.find('students', sub.studentId);
            return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
              <span class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">${icon('classes','w-5 h-5')}</span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${stu ? stu.name : 'Student'} · ${e ? e.title : 'CBT'}</div>
                <div class="text-xs text-slate-500">CBT · theory answers to review</div>
              </div>
              <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="reviewCbt('${sub.examId}')">Review</button>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3">Today's Schedule (${day})</h3>
          ${todaySchedule.length === 0 ? `<p class="text-sm text-slate-500">No classes scheduled today. Enjoy your day!</p>` : `
            <div class="space-y-2">
              ${todaySchedule.map(s => {
                const sub = subjects.find(x => x.id === s.subjectId);
                const cls = DB.find('classes', s.classId);
                return `<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex flex-col items-center justify-center">
                    <div class="text-xs font-bold">P${s.period}</div>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-slate-900">${sub ? sub.name : '—'}</div>
                    <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${s.time}</div>
                  </div>
                  <button class="btn btn-secondary !py-1.5 !px-2 text-xs" onclick="APP.go('tch_attendance', { classId: '${s.classId}' })">Mark Attendance</button>
                </div>`;
              }).join('')}
            </div>
          `}
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">My Assignments</h3>
            <button class="btn btn-ghost text-sm" onclick="APP.go('tch_assignments')">View all →</button>
          </div>
          ${myAssignments.slice(0,3).map(a => {
            const cls = DB.find('classes', a.classId);
            return `<div class="py-2 border-b border-slate-100 last:border-0">
              <div class="font-semibold text-sm text-slate-900">${a.title}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : ''} · Due ${fdate(a.dueDate, { short: true })}</div>
            </div>`;
          }).join('') || '<p class="text-sm text-slate-500">No assignments yet.</p>'}
          <button class="btn btn-primary w-full mt-3" onclick="createAssignmentModal()">${icon('plus','w-4 h-4')} New Assignment</button>
        </div>
      </div>

      ${renderSubstituteRequestsWidget(t.id)}
      ${renderMyLeaveWidget(t.id)}

      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">My Classes</h3>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${classes.map(c => {
            const count = COMPUTE.studentsByClass(c.id).length;
            return `<div class="p-4 border border-slate-200 rounded-xl hover:border-brand-500 cursor-pointer transition" onclick="APP.go('tch_attendance', { classId: '${c.id}' })">
              <div class="flex items-center justify-between mb-2">
                <span class="badge badge-info">${c.level}</span>
                <span class="text-xs text-slate-500">${count} students</span>
              </div>
              <h4 class="font-bold text-slate-900">${c.name}</h4>
              <div class="flex gap-1 mt-3">
                <button class="btn btn-secondary !py-1 !px-2 text-xs flex-1" onclick="event.stopPropagation(); APP.go('tch_attendance', { classId: '${c.id}' })">Attendance</button>
                <button class="btn btn-secondary !py-1 !px-2 text-xs flex-1" onclick="event.stopPropagation(); APP.go('tch_results', { classId: '${c.id}' })">Results</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ---------- My Classes ---------- */
function view_tch_classes() {
  const classes = teacherClasses();
  const tRecord = DB.find('teachers', AUTH.current.id);
  return `
    ${pageHeader({ title: 'My Classes', subtitle: 'Classes you teach this term' })}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${classes.map(c => {
        const students = COMPUTE.studentsByClass(c.id);
        const isFormTeacher = tRecord && tRecord.classTeacherOf === c.id;
        return `<div class="card p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="badge badge-info">${c.level}</span>
              ${isFormTeacher ? `<span class="badge badge-info ml-1">Form Teacher</span>` : ''}
              <h3 class="font-bold text-lg text-slate-900 mt-2">${c.name}</h3>
              <p class="text-sm text-slate-500">${students.length} students</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">${icon('classes','w-6 h-6')}</div>
          </div>
          <div class="space-y-1">
            ${students.slice(0,3).map(s => `<div class="flex items-center gap-2 text-sm"><span class="avatar sm">${initials(s.name)}</span><span>${s.name}</span></div>`).join('')}
            ${students.length > 3 ? `<p class="text-xs text-slate-400">+ ${students.length - 3} more</p>` : ''}
          </div>
          <div class="grid grid-cols-2 gap-1.5 mt-3">
            <button class="btn btn-secondary !py-1.5 text-xs" onclick="APP.go('tch_attendance', { classId: '${c.id}' })">${icon('attendance','w-3 h-3')} Attendance</button>
            <button class="btn btn-secondary !py-1.5 text-xs" onclick="APP.go('tch_results', { classId: '${c.id}' })">${icon('results','w-3 h-3')} Results</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ---------- Attendance ---------- */
function view_tch_attendance() {
  const classes = teacherClasses();
  if (classes.length === 0) return emptyState({ title: 'No classes assigned', body: 'Contact admin to assign you to a class.', icon: 'classes' });
  const classId = APP.params.classId || classes[0].id;
  const cls = DB.find('classes', classId);
  const students = COMPUTE.studentsByClass(classId);
  const date = APP.params.date || today();
  const existing = COMPUTE.classAttendance(classId, date);

  return `
    ${pageHeader({
      title: 'Mark Attendance',
      subtitle: `${cls.name} · ${fdate(date, { long: true })}${isOffline() ? ' · <span class="badge badge-warn ml-1">Offline</span>' : ''}`
    })}

    <div class="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
      <div><label class="input-label">Class</label>
        <select class="input" onchange="APP.go('tch_attendance', { classId: this.value, date: '${date}' })">
          ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div><label class="input-label">Date</label>
        <input type="date" class="input" value="${date}" onchange="APP.go('tch_attendance', { classId: '${classId}', date: this.value })" />
      </div>
    </div>

    <div class="card p-4 mb-4 flex items-center justify-between flex-wrap gap-2">
      <div class="text-sm text-slate-600">${existing.length}/${students.length} marked</div>
      <div class="flex gap-2">
        <button class="btn btn-ghost text-sm" onclick="bulkMarkAttendance('${classId}', '${date}', 'present')">${icon('check','w-3 h-3')} All Present</button>
        <button class="btn btn-ghost text-sm" onclick="bulkMarkAttendance('${classId}', '${date}', 'absent')">${icon('x','w-3 h-3')} All Absent</button>
        <button class="btn btn-primary text-sm" onclick="saveAttendance('${classId}', '${date}')">${icon('check','w-4 h-4')} Save & Notify</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="divide-y divide-slate-100">
        ${students.map(s => {
          const cur = existing.find(e => e.studentId === s.id);
          const status = cur ? cur.status : null;
          return `<div class="p-3 flex items-center gap-3 flex-wrap" id="att_row_${s.id}">
            ${avatar(s.name, 'md')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900">${s.name}</div>
              <div class="text-xs text-slate-500">${s.admissionNo}</div>
            </div>
            <div class="flex gap-1.5">
              <button onclick="markStudent('${s.id}', 'present')" data-stu="${s.id}" data-st="present" class="att-btn px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${status==='present'?'bg-emerald-500 text-white border-emerald-500':'bg-white border-slate-200 text-slate-600 hover:border-emerald-500'}">Present</button>
              <button onclick="markStudent('${s.id}', 'late')" data-stu="${s.id}" data-st="late" class="att-btn px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${status==='late'?'bg-amber-500 text-white border-amber-500':'bg-white border-slate-200 text-slate-600 hover:border-amber-500'}">Late</button>
              <button onclick="markStudent('${s.id}', 'absent')" data-stu="${s.id}" data-st="absent" class="att-btn px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${status==='absent'?'bg-rose-500 text-white border-rose-500':'bg-white border-slate-200 text-slate-600 hover:border-rose-500'}">Absent</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

const _attBuffer = {};
function markStudent(studentId, status) {
  _attBuffer[studentId] = status;
  // Update button states inline (no full re-render for speed)
  const row = document.getElementById('att_row_' + studentId);
  if (row) {
    row.querySelectorAll('.att-btn').forEach(b => {
      b.className = 'att-btn px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-white border-slate-200 text-slate-600';
      if (b.dataset.st === status) {
        const colors = { present: 'bg-emerald-500 border-emerald-500', late: 'bg-amber-500 border-amber-500', absent: 'bg-rose-500 border-rose-500' };
        b.className = 'att-btn px-3 py-1.5 rounded-lg text-xs font-semibold border-2 text-white ' + colors[status];
      }
    });
  }
}

function bulkMarkAttendance(classId, date, status) {
  const students = COMPUTE.studentsByClass(classId);
  students.forEach(s => markStudent(s.id, status));
  toast(`All marked ${status}`, 'info');
}

function saveAttendance(classId, date) {
  const students = COMPUTE.studentsByClass(classId);
  const existing = COMPUTE.classAttendance(classId, date);
  const cls = DB.find('classes', classId);
  let added = 0, absent = 0, late = 0;
  students.forEach(s => {
    const status = _attBuffer[s.id];
    if (!status) return;
    const cur = existing.find(e => e.studentId === s.id);
    const timeStamp = new Date().toTimeString().slice(0, 5); // HH:MM in 24h
    if (cur) DB.update('attendance', cur.id, { status, markedAt: timeStamp, markedAtFull: now() });
    else {
      DB.insert('attendance', { id: uid('att'), schoolId: AUTH.current.schoolId || 'sch_brightlights', studentId: s.id, classId, date, status, recordedBy: AUTH.current.id, markedAt: timeStamp, markedAtFull: now() });
    }
    added++;
    // Real notification record for absent / late students (sent via WhatsApp + in-app)
    if (status === 'absent' || status === 'late') {
      const niceDate = fdate(date, { long: true });
      const stamp = new Date().toTimeString().slice(0, 5);
      const title = status === 'absent' ? 'Absence Alert' : 'Late Arrival';
      const body = status === 'absent'
        ? `${s.name} was marked absent in ${cls ? cls.name : 'class'} on ${niceDate}. Please contact the school if this is unexpected. — Bright Lights Academy`
        : `${s.name} arrived late to ${cls ? cls.name : 'class'} on ${niceDate} at ${stamp}.`;
      DB.insert('notifications', {
        id: uid('not'), userId: s.parentId,
        title, body,
        channel: 'whatsapp+app',
        type: status === 'absent' ? 'warn' : 'info',
        read: false, timestamp: now(),
        link: { view: 'par_dashboard' }
      });
      if (status === 'absent') absent++; else late++;
    }
  });
  if (added === 0) { toast('Mark at least one student first', 'warn'); return; }
  if (isOffline()) {
    for (let i = 0; i < added; i++) queueOfflineAction();
    toast(`Saved ${added} entries offline. Will sync when online.`, 'warn');
    Object.keys(_attBuffer).forEach(k => delete _attBuffer[k]);
    APP.render();
    return;
  }
  const parts = [`Saved ${added} entries`];
  if (absent) parts.push(`${absent} absence alert${absent!==1?'s':''} sent`);
  if (late) parts.push(`${late} late notice${late!==1?'s':''} sent`);
  toast(parts.join(' · '), 'success');
  Object.keys(_attBuffer).forEach(k => delete _attBuffer[k]);

  // Next-action prompt
  const t = AUTH.current;
  const classes = teacherClasses();
  const nextClass = classes.find(c => c.id !== classId);
  const hasPendingResults = DB.query('results', r => !r.approved && classes.some(c => c.id === r.classId)).length > 0;
  modal({
    title: '✓ Attendance Saved',
    body: `
      <div class="text-center py-3">
        <div class="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">${icon('check','w-7 h-7')}</div>
        <div class="text-base font-bold text-slate-900">${added} student${added!==1?'s':''} marked</div>
        ${absent ? `<div class="text-sm text-rose-700 mt-1">${absent} absent · parents notified via WhatsApp</div>` : ''}
      </div>
      <p class="text-sm text-slate-600 text-center mt-2">What's next?</p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Done for now</button>
      ${nextClass ? `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.go('tch_attendance', { classId: '${nextClass.id}' })">Mark next class</button>` : ''}
      ${hasPendingResults ? `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.go('tch_results')">Enter results →</button>` : `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.go('tch_results')">Enter results →</button>`}
    `
  });
}

/* ---------- Results Entry ---------- */
function view_tch_results() {
  const classes = teacherClasses();
  if (classes.length === 0) return emptyState({ title: 'No classes assigned', body: 'Contact admin.', icon: 'classes' });
  const classId = APP.params.classId || classes[0].id;
  const cls = DB.find('classes', classId);
  const tData = DB.find('teachers', AUTH.current.id);
  const subjects = tData && tData.subjects && tData.subjects.length ? DB.get('subjects').filter(s => tData.subjects.includes(s.id)) : DB.get('subjects');
  const defaultSubjectId = APP.params.subjectId || (subjects[0] ? subjects[0].id : '');
  const subjectId = defaultSubjectId;
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId && r.subjectId === subjectId);

  const types = getTermAssessmentTypes();
  const typeSubtitle = types.map(t => `${t.label} /${t.weight}`).join(' · ');

  return `
    ${pageHeader({
      title: 'Enter Results',
      subtitle: typeSubtitle
    })}
    <div class="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
      <div><label class="input-label">Class</label>
        <select class="input" onchange="APP.go('tch_results', { classId: this.value, subjectId: '${subjectId}' })">
          ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div><label class="input-label">Subject</label>
        <select class="input" onchange="APP.go('tch_results', { classId: '${classId}', subjectId: this.value })">
          ${subjects.map(s => `<option value="${s.id}" ${subjectId===s.id?'selected':''}>${s.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr>
          <th>Student</th>
          ${types.map(t => `<th class="text-center">${t.label} <span class="text-slate-400 font-normal">/${t.weight}</span></th>`).join('')}
          <th class="text-center">Total</th><th class="text-center">Grade</th><th>Comment</th>
        </tr></thead>
        <tbody>
          ${students.map(s => {
            const r = results.find(x => x.studentId === s.id);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span>${s.name}</span></div></td>
              ${types.map((t, i) => {
                const key = termTypeKey(types, i);
                const val = r ? (r[key] || '') : '';
                return `<td><input type="number" max="${t.weight}" min="0" class="input !w-16 text-center" id="res_f${i}_${s.id}" value="${val}" oninput="recalcResult('${s.id}')" /></td>`;
              }).join('')}
              <td class="text-center font-bold text-lg" id="res_total_${s.id}">${r ? r.total : '—'}</td>
              <td class="text-center" id="res_grade_${s.id}">${r ? `<span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'}">${r.grade}</span>` : '—'}</td>
              <td>
                <div class="flex gap-1">
                  <input class="input flex-1 text-sm" id="res_cmt_${s.id}" value="${r ? r.comment : ''}" placeholder="Teacher comment…" />
                  <button class="btn btn-gold !p-1.5" title="AI suggest comment" onclick="aiSuggestComment('${s.id}', '${subjectId}')">${icon('ai','w-4 h-4')}</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div class="p-3 bg-slate-50 flex justify-end gap-2">
        <button class="btn btn-secondary" onclick="aiSuggestAllComments('${classId}', '${subjectId}')">${icon('ai','w-4 h-4')} AI: Suggest all comments</button>
        <button class="btn btn-primary" onclick="saveResults('${classId}', '${subjectId}')">${icon('check','w-4 h-4')} Submit for approval</button>
      </div>
    </div>
  `;
}

function recalcResult(studentId) {
  const types = getTermAssessmentTypes();
  let total = 0;
  types.forEach((t, i) => {
    const el = document.getElementById(`res_f${i}_${studentId}`);
    if (!el) return;
    let v = parseInt(el.value) || 0;
    if (v > t.weight) { el.value = t.weight; v = t.weight; }
    if (v < 0)        { el.value = 0; v = 0; }
    total += v;
  });
  document.getElementById(`res_total_${studentId}`).textContent = total;
  const { grade } = COMPUTE.gradeFromScore(total);
  const cls = grade==='A'?'badge-success':grade==='F'?'badge-danger':'badge-info';
  document.getElementById(`res_grade_${studentId}`).innerHTML = `<span class="badge ${cls}">${grade}</span>`;
}

function saveResults(classId, subjectId) {
  const types = getTermAssessmentTypes();
  const students = COMPUTE.studentsByClass(classId);
  const sub = DB.find('subjects', subjectId);
  let count = 0;
  students.forEach(s => {
    const scores = {};
    let total = 0;
    let allZero = true;
    types.forEach((t, i) => {
      const key = termTypeKey(types, i);
      const v = parseInt((document.getElementById(`res_f${i}_${s.id}`) || {}).value) || 0;
      scores[key] = v;
      total += v;
      if (v !== 0) allZero = false;
    });
    if (allZero) return;
    const comment = document.getElementById(`res_cmt_${s.id}`).value.trim();
    const { grade } = COMPUTE.gradeFromScore(total);
    const existing = DB.query('results', r => r.studentId === s.id && r.subjectId === subjectId && r.classId === classId)[0];
    const record = Object.assign({ total, grade, comment, approved: false }, scores);
    if (existing) DB.update('results', existing.id, record);
    else DB.insert('results', Object.assign({ id: uid('res'), schoolId: AUTH.current.schoolId || 'sch_brightlights', studentId: s.id, classId, subjectId, term: DB.settings().currentTerm }, record));
    if (s.parentId) {
      const scoreStr = types.map((t, i) => `${t.label}: ${scores[termTypeKey(types, i)]}`).join(' · ');
      DB.insert('notifications', {
        id: uid('not'), userId: s.parentId,
        title: `Score update — ${s.name.split(' ')[0]}`,
        body: `${s.name.split(' ')[0]}'s ${sub ? sub.name : 'subject'} scores: ${scoreStr} | Total ${total}/100 · Grade: ${grade}`,
        type: 'result', read: false, timestamp: now(),
        link: { view: 'par_results' }
      });
    }
    count++;
  });
  toast(`${count} result${count !== 1 ? 's' : ''} submitted for approval`, 'success');
  APP.render();
}

/* ---------- AI Report Comments ---------- */
function aiSuggestComment(studentId, subjectId) {
  const total = parseInt(document.getElementById(`res_total_${studentId}`).textContent) || 0;
  if (total === 0) { toast('Enter scores first', 'warn'); return; }
  const student = DB.find('students', studentId);
  const subject = DB.find('subjects', subjectId);
  // Mock AI: deterministic but varied comments based on score
  const banks = {
    excellent: [
      `Outstanding performance in ${subject.name}. ${student.name.split(' ')[0]} consistently demonstrates mastery and helps classmates.`,
      `An exemplary student. Their grasp of ${subject.name} concepts is remarkable. Keep aiming higher.`,
      `Brilliant work this term. ${student.name.split(' ')[0]} is a model student in ${subject.name}.`
    ],
    good: [
      `Very good showing in ${subject.name}. With more consistent practice, ${student.name.split(' ')[0]} can reach the top.`,
      `Strong understanding of ${subject.name} fundamentals. Push a little harder on the harder topics.`,
      `Solid progress this term. Continue working at this pace.`
    ],
    average: [
      `${student.name.split(' ')[0]} shows potential in ${subject.name} but needs more focus and revision.`,
      `Average performance. Please attend extra lessons and complete all assignments on time.`,
      `Capable of better. Encourage more practice exercises at home.`
    ],
    poor: [
      `${student.name.split(' ')[0]} is struggling with ${subject.name} this term. Recommend remedial classes and parental support.`,
      `Needs urgent improvement. Please discuss study habits with the class teacher.`,
      `A worrying drop in performance. We will arrange tutoring support next term.`
    ]
  };
  let key = 'average';
  if (total >= 75) key = 'excellent';
  else if (total >= 60) key = 'good';
  else if (total >= 45) key = 'average';
  else key = 'poor';
  const arr = banks[key];
  const comment = arr[Math.floor(Math.random() * arr.length)];
  // Animate typing
  const input = document.getElementById(`res_cmt_${studentId}`);
  input.value = '';
  input.placeholder = 'AI is thinking…';
  let i = 0;
  const typer = setInterval(() => {
    if (i >= comment.length) { clearInterval(typer); return; }
    input.value += comment[i++];
  }, 12);
  toast('AI comment generated. You can edit it.', 'info');
}

function aiSuggestAllComments(classId, subjectId) {
  const students = COMPUTE.studentsByClass(classId);
  toast('Generating AI comments for all students…', 'info');
  students.forEach((s, i) => {
    setTimeout(() => aiSuggestComment(s.id, subjectId), i * 250);
  });
}

/* ---------- Assignments & Learning (LMS) ---------- */
function view_tch_assignments() {
  const tab = APP.params.learnTab || 'assignments';
  return `
    ${pageHeader({
      title: 'Assignments & Learning',
      subtitle: 'Set homework, grade submissions, and share learning materials',
      actions: tab === 'materials'
        ? `<button class="btn btn-primary" onclick="createMaterialModal()">${icon('plus','w-4 h-4')} Upload Material</button>`
        : `<button class="btn btn-primary" onclick="createAssignmentModal()">${icon('plus','w-4 h-4')} New Assignment</button>`
    })}
    ${tabs([{ key: 'assignments', label: 'Assignments' }, { key: 'materials', label: 'Learning Materials' }], tab, k => { APP.params.learnTab = k; APP.render(); })}
    <div class="pt-4">${tab === 'materials' ? tch_renderMaterials() : tch_renderAssignments()}</div>
  `;
}

function tch_renderAssignments() {
  const t = AUTH.current;
  const assignments = DB.query('assignments', a => a.teacherId === t.id);
  return `
    ${assignments.length === 0 ? emptyState({ title: 'No assignments yet', body: 'Create your first assignment to share with students.', icon: 'book' }) : `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${assignments.map(a => {
          const cls = DB.find('classes', a.classId);
          const sub = DB.find('subjects', a.subjectId);
          const classSize = COMPUTE.studentsByClass(a.classId).length;
          const submissionRate = classSize ? Math.round((a.submissions.length / classSize) * 100) : 0;
          const overdue = new Date(a.dueDate) < new Date();
          return `<div class="card card-hover p-4 cursor-pointer" onclick="openAssignment('${a.id}')">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="badge badge-info">${cls ? cls.name : ''}</span>
                <span class="badge badge-neutral">${sub ? sub.name : ''}</span>
              </div>
              <button class="btn btn-ghost !p-1" onclick="event.stopPropagation(); editAssignmentModal('${a.id}')" title="Edit">${icon('edit', 'w-4 h-4')}</button>
            </div>
            <h3 class="font-bold text-slate-900 mb-1">${a.title}</h3>
            <p class="text-sm text-slate-500 line-clamp-2 mb-3">${a.description}</p>
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Submissions</span>
                <span class="font-semibold">${a.submissions.length}/${classSize}</span>
              </div>
              <div class="progress"><div class="progress-bar" style="width: ${submissionRate}%"></div></div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-slate-500">Due ${fdate(a.dueDate, { short: true })}</span>
                ${overdue ? '<span class="badge badge-danger">Overdue</span>' : '<span class="badge badge-success">Active</span>'}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

/* ---------- LMS: Learning Materials ---------- */
function tch_renderMaterials() {
  const t = AUTH.current;
  const materials = DB.query('learningMaterials', m => m.teacherId === t.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900 mb-4">
      ${icon('info','w-4 h-4 inline mr-1')} Notes and videos you upload here appear instantly on your students' <strong>Learning</strong> portal.
    </div>
    ${materials.length === 0 ? emptyState({ title: 'No materials yet', body: 'Upload notes or share a video link for your students.', icon: 'book' }) : `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${materials.map(m => {
          const cls = DB.find('classes', m.classId);
          return `<div class="card p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="badge ${m.type === 'video' ? 'badge-danger' : 'badge-info'}">${m.type === 'video' ? 'Video' : 'Note'}</span>
                <span class="badge badge-neutral">${cls ? cls.name : ''}</span>
              </div>
              <button class="btn btn-ghost !p-1 text-rose-600" title="Delete" onclick="deleteMaterial('${m.id}')">${icon('trash','w-4 h-4')}</button>
            </div>
            <h3 class="font-bold text-slate-900 text-sm mb-1">${m.title}</h3>
            <p class="text-xs text-slate-500 line-clamp-2 mb-2">${m.description || ''}</p>
            <div class="text-xs text-slate-400">${DB.find('subjects', m.subjectId) ? DB.find('subjects', m.subjectId).name : ''} · ${fdate(m.createdAt, { short: true })}</div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

let _materialFile = null;
function onMaterialFile(ev) {
  _materialFile = null;
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast('File too large (max 3MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _materialFile = { name: file.name, type: file.type, size: Math.round(file.size / 1024) + ' KB', data: e.target.result };
    const p = document.getElementById('mat_preview');
    if (p) p.innerHTML = `<div class="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">${icon('paperclip','w-4 h-4 text-emerald-600')}<span class="flex-1 truncate font-semibold text-emerald-900">${file.name}</span><span class="text-xs text-emerald-700">${_materialFile.size}</span></div>`;
  };
  reader.readAsDataURL(file);
}

function createMaterialModal() {
  _materialFile = null;
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'Upload Learning Material',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Title</label><input id="mat_title" class="input" placeholder="e.g. Photosynthesis — Class Notes" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label><select id="mat_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div><label class="input-label">Subject</label><select id="mat_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        </div>
        <div><label class="input-label">Type</label>
          <select id="mat_type" class="input" onchange="document.getElementById('mat_urlRow').classList.toggle('hidden', this.value!=='video')">
            <option value="note">Note / Document</option>
            <option value="video">Video (link)</option>
          </select>
        </div>
        <div id="mat_urlRow" class="hidden"><label class="input-label">Video URL (YouTube, etc.)</label><input id="mat_url" class="input" placeholder="https://…" /></div>
        <div><label class="input-label">Description</label><textarea id="mat_desc" rows="3" class="input" placeholder="What is this material about?"></textarea></div>
        <div>
          <label class="input-label">Attach file (optional — PDF / Word / image, max 3MB)</label>
          <input type="file" id="mat_file" class="hidden" accept="application/pdf,.doc,.docx,image/*" onchange="onMaterialFile(event)" />
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-brand-400 cursor-pointer" onclick="document.getElementById('mat_file').click()">
            ${icon('upload','w-5 h-5 mx-auto text-slate-400 mb-1')}<div class="text-xs text-slate-500">Click to attach a file</div>
          </div>
          <div id="mat_preview" class="mt-2"></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveMaterial()">${icon('check','w-4 h-4')} Publish to Students</button>`
  });
}

function saveMaterial() {
  const title = document.getElementById('mat_title').value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }
  const classId = document.getElementById('mat_class').value;
  const type = document.getElementById('mat_type').value;
  const url = document.getElementById('mat_url') ? document.getElementById('mat_url').value.trim() : '';
  const m = {
    id: uid('lm'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    classId, subjectId: document.getElementById('mat_subject').value, teacherId: AUTH.current.id,
    title, type, description: document.getElementById('mat_desc').value.trim(),
    url, file: _materialFile || null, createdAt: now()
  };
  DB.insert('learningMaterials', m);
  // Notify students in the class
  COMPUTE.studentsByClass(classId).forEach(s => {
    DB.insert('notifications', { id: uid('not'), userId: s.id, title: 'New Learning Material', body: `${title} (${DB.find('subjects', m.subjectId) ? DB.find('subjects', m.subjectId).name : ''})`, type: 'info', read: false, timestamp: now(), link: { view: 'stu_learning' } });
  });
  _materialFile = null;
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Material published to students', 'success');
}

function deleteMaterial(id) {
  const m = DB.find('learningMaterials', id);
  confirm(`Delete "${m.title}"? Students will no longer see it.`, () => {
    DB.remove('learningMaterials', id);
    APP.render();
    toast('Material deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

/* ---------- Assignment detail / management ---------- */
function openAssignment(assignmentId) {
  const a = DB.find('assignments', assignmentId);
  if (!a) return;
  const cls = DB.find('classes', a.classId);
  const sub = DB.find('subjects', a.subjectId);
  const students = COMPUTE.studentsByClass(a.classId);
  const submissionsMap = {};
  a.submissions.forEach(sub => { submissionsMap[sub.studentId] = sub; });

  modal({
    title: a.title,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge badge-info">${cls ? cls.name : ''}</span>
          <span class="badge badge-neutral">${sub ? sub.name : ''}</span>
          <span class="badge ${new Date(a.dueDate) < new Date() ? 'badge-danger' : 'badge-success'}">Due ${fdate(a.dueDate, { long: true })}</span>
        </div>

        <div>
          <h4 class="text-xs font-semibold uppercase text-slate-500 mb-1">Instructions</h4>
          <div class="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap">${a.description}</div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold uppercase text-slate-500">Submissions (${a.submissions.length}/${students.length})</h4>
          </div>
          <div class="space-y-2 max-h-96 overflow-y-auto scroll-area">
            ${students.map(s => {
              const sub = submissionsMap[s.id];
              const graded = sub && sub.grade != null;
              return `<div class="p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-3">
                  ${avatar(s.name, 'sm')}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm">${s.name}</div>
                    <div class="text-xs text-slate-500">${sub ? 'Submitted ' + fdate(sub.submittedAt, { relative: true }) : 'Not submitted'}</div>
                  </div>
                  ${sub ? (graded ? `<span class="badge badge-success">${sub.grade}/100</span>` : `<span class="badge badge-warn">To grade</span>`) : `<span class="badge badge-neutral">Pending</span>`}
                </div>
                ${sub && (sub.text || sub.file) ? `<div class="mt-2 pl-11 space-y-1">
                  ${sub.text ? `<div class="text-sm text-slate-700 bg-white rounded-lg p-2 border border-slate-200">${sub.text}</div>` : ''}
                  ${sub.file ? `<a href="${sub.file.data}" download="${sub.file.name}" class="inline-flex items-center gap-1.5 text-xs text-brand-700 font-semibold">${icon('paperclip','w-3.5 h-3.5')} ${sub.file.name}</a>` : ''}
                </div>` : ''}
                ${sub && !graded ? `<div class="mt-2 pl-11 space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="number" min="0" max="100" placeholder="/100" class="input !w-20 text-sm" id="grd_${s.id}" />
                    <select id="mk_${s.id}" class="input text-sm flex-1">
                      <option value="">— Mark status —</option>
                      <option value="excellent">⭐ Excellent</option>
                      <option value="satisfactory">✓ Satisfactory</option>
                      <option value="needs_revision">🔄 Needs Revision</option>
                    </select>
                  </div>
                  <textarea id="fb_${s.id}" rows="2" class="input text-sm w-full" placeholder="Comments for student (they will see this)…"></textarea>
                  <div class="flex gap-2">
                    <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="gradeSubmission('${a.id}', '${s.id}')">${icon('check','w-3.5 h-3.5')} Grade</button>
                    <button class="btn btn-secondary !py-1.5 !px-3 text-xs" onclick="tch_returnToStudent('${a.id}', '${s.id}')">${icon('arrow_left','w-3.5 h-3.5 rotate-180')} Return to Student</button>
                  </div>
                </div>` : ''}
                ${graded ? `<div class="mt-2 pl-11 space-y-1">
                  ${sub.markStatus ? `<span class="text-xs font-semibold ${sub.markStatus === 'excellent' ? 'text-emerald-600' : sub.markStatus === 'satisfactory' ? 'text-blue-600' : 'text-amber-600'}">${sub.markStatus === 'excellent' ? '⭐ Excellent' : sub.markStatus === 'needs_revision' ? '🔄 Needs Revision' : '✓ Satisfactory'}</span>` : ''}
                  ${sub.feedback ? `<div class="text-xs text-slate-700 bg-white rounded-lg p-2 border border-slate-200"><strong class="text-slate-500">Teacher comments:</strong> ${sub.feedback}</div>` : ''}
                  ${sub.returned ? `<div class="text-xs text-brand-700 font-semibold">${icon('check','w-3 h-3 inline')} Returned to student ${fdate(sub.returnedAt, { relative: true })}</div>` : `<button class="btn btn-ghost !py-0.5 !px-2 text-xs text-slate-500" onclick="tch_returnToStudent('${a.id}', '${s.id}')">Mark as returned</button>`}
                </div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-danger" onclick="deleteAssignmentConfirm('${a.id}')">${icon('trash','w-4 h-4')} Delete</button>
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      ${a.submissions.some(s => s.grade != null) ? `<button class="btn btn-secondary" onclick="tch_pushToResultsModal('${a.id}')">${icon('reports','w-4 h-4')} Push to Results</button>` : ''}
      <button class="btn btn-primary" onclick="editAssignmentModal('${a.id}')">${icon('edit','w-4 h-4')} Edit</button>
    `
  });
}

function gradeSubmission(assignmentId, studentId) {
  const a = DB.find('assignments', assignmentId);
  const input = document.getElementById('grd_' + studentId);
  const grade = parseInt(input.value);
  if (isNaN(grade) || grade < 0 || grade > 100) { toast('Enter a grade 0–100', 'danger'); return; }
  const fbEl = document.getElementById('fb_' + studentId);
  const feedback = fbEl ? fbEl.value.trim() : '';
  const mkEl = document.getElementById('mk_' + studentId);
  const markStatus = mkEl ? mkEl.value : '';
  const idx = a.submissions.findIndex(s => s.studentId === studentId);
  if (idx === -1) return;
  a.submissions[idx].grade = grade;
  a.submissions[idx].feedback = feedback;
  a.submissions[idx].markStatus = markStatus;
  a.submissions[idx].gradedAt = now();
  DB.update('assignments', assignmentId, { submissions: a.submissions });
  const student = DB.find('students', studentId);
  const statusLabel = markStatus === 'excellent' ? ' · ⭐ Excellent' : markStatus === 'needs_revision' ? ' · 🔄 Needs Revision' : markStatus === 'satisfactory' ? ' · ✓ Satisfactory' : '';
  // Notify the student directly
  if (student) DB.insert('notifications', { id: uid('not'), userId: student.id, title: 'Assignment Graded', body: `${a.title}: ${grade}/100${statusLabel}${feedback ? ' — ' + feedback : ''}`, type: 'success', read: false, timestamp: now(), link: { view: 'stu_assignments' } });
  // And keep the parent informed
  if (student) DB.insert('notifications', { id: uid('not'), userId: student.parentId, title: 'Assignment Graded', body: `${student.name}: ${a.title} — ${grade}/100${statusLabel}`, type: 'info', read: false, timestamp: now(), link: { view: 'par_dashboard' } });
  toast(`${student ? student.name : 'Student'} graded ${grade}/100`, 'success');
  openAssignment(assignmentId);
}

function deleteAssignmentConfirm(assignmentId) {
  const a = DB.find('assignments', assignmentId);
  confirm(`Delete "${a.title}"? This cannot be undone. Any submissions will also be removed.`, () => {
    DB.remove('assignments', assignmentId);
    document.getElementById('modalBackdrop').click();
    APP.render();
    toast('Assignment deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

function editAssignmentModal(assignmentId) {
  // Close any existing modal first
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  createAssignmentModal(assignmentId);
}

function createAssignmentModal(editingId) {
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  const existing = editingId ? DB.find('assignments', editingId) : null;
  const isEdit = !!existing;

  modal({
    title: isEdit ? 'Edit Assignment' : 'Create Assignment',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Title</label><input id="as_title" class="input" placeholder="e.g. Algebra Practice Set 4" value="${existing ? existing.title.replace(/"/g, '&quot;') : ''}" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="as_class" class="input">${classes.map(c => `<option value="${c.id}" ${existing && existing.classId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="as_subject" class="input">${subjects.map(s => `<option value="${s.id}" ${existing && existing.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label">Description / Instructions</label><textarea id="as_desc" rows="4" class="input" placeholder="What students need to do…">${existing ? existing.description : ''}</textarea></div>
        <div><label class="input-label">Due Date</label><input id="as_due" type="date" class="input" value="${existing ? existing.dueDate : daysAhead(7)}" /></div>
        <div class="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center text-sm text-slate-500">
          ${icon('paperclip','w-4 h-4 inline mr-1')} Attach files (simulated)
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveAssignment(${isEdit ? "'" + editingId + "'" : 'null'})">${isEdit ? icon('check','w-4 h-4') + ' Save Changes' : 'Post Assignment'}</button>`
  });
}

function saveAssignment(editingId) {
  const title = document.getElementById('as_title').value.trim();
  const classId = document.getElementById('as_class').value;
  const subjectId = document.getElementById('as_subject').value;
  const description = document.getElementById('as_desc').value.trim();
  const dueDate = document.getElementById('as_due').value;
  if (!title || !description) { toast('Title and description required', 'danger'); return; }

  if (editingId) {
    DB.update('assignments', editingId, { title, classId, subjectId, description, dueDate, updatedAt: now() });
    document.getElementById('modalBackdrop').click();
    APP.render();
    toast('Assignment updated', 'success');
    return;
  }

  DB.insert('assignments', {
    id: uid('asn'), schoolId: AUTH.current.schoolId || 'sch_brightlights', classId, subjectId, teacherId: AUTH.current.id,
    title, description, dueDate, createdAt: now(), submissions: []
  });
  // Notify all parents in the class
  const parents = COMPUTE.studentsByClass(classId).map(s => s.parentId);
  [...new Set(parents)].forEach(pid => {
    DB.insert('notifications', { id: uid('not'), userId: pid, title: 'New Assignment', body: `${title} — due ${fdate(dueDate, { short: true })}`, type: 'info', read: false, timestamp: now(), link: { view: 'par_dashboard' } });
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Assignment posted. ${parents.length} parents notified.`, 'success');
}

/* ---------- Lesson Plans ---------- */
function view_tch_lessons(params) {
  const tab = (params && params.tab) || 'plans';
  const tabs = [
    { key: 'plans',  label: 'Lesson Plans' },
    { key: 'notes',  label: 'Class Notes' },
    { key: 'videos', label: 'Videos' }
  ];
  const tabBar = `<div class="flex gap-1 mb-5 border-b border-slate-200">
    ${tabs.map(t => `<button onclick="APP.go('tch_lessons',{tab:'${t.key}'})" class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}">${t.label}</button>`).join('')}
  </div>`;

  if (tab === 'plans') {
    const lessons = DB.query('lessonPlans', l => l.teacherId === AUTH.current.id);
    const subjects = DB.get('subjects');
    return `
      ${pageHeader({ title: 'Lessons & Content', subtitle: 'Lesson plans, class notes, and videos for your students',
        actions: `<button class="btn btn-primary" onclick="createLessonModal()">${icon('plus','w-4 h-4')} New Plan</button>` })}
      ${tabBar}
      ${lessons.length === 0 ? emptyState({ title: 'No lesson plans yet', body: 'Document your weekly plans here.', icon: 'book' }) : `
        <div class="space-y-3">
          ${lessons.map(l => {
            const cls = DB.find('classes', l.classId);
            const sub = subjects.find(s => s.id === l.subjectId);
            return `<div class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-info">${cls ? cls.name : ''}</span>
                  <span class="badge badge-neutral">${sub ? sub.name : ''}</span>
                  <span class="badge badge-success">${l.week}</span>
                </div>
                <span class="text-xs text-slate-400">${fdate(l.createdAt, { short: true })}</span>
              </div>
              <h3 class="font-bold text-slate-900">${l.topic}</h3>
              <div class="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div><div class="text-xs uppercase font-semibold text-slate-500 mb-1">Objectives</div><div>${l.objectives}</div></div>
                <div><div class="text-xs uppercase font-semibold text-slate-500 mb-1">Activities</div><div>${l.activities}</div></div>
                <div><div class="text-xs uppercase font-semibold text-slate-500 mb-1">Resources</div><div>${l.resources}</div></div>
              </div>
              ${l.file ? `<a href="${l.file.data}" download="${l.file.name}" class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100">
                ${icon('paperclip','w-4 h-4 text-emerald-600')}
                <span class="font-semibold text-emerald-900">${l.file.name}</span>
                <span class="text-xs text-emerald-700">${l.file.size}</span>
                ${icon('download','w-3.5 h-3.5 text-emerald-700')}
              </a>` : ''}
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  if (tab === 'notes') {
    const notes = DB.query('learningMaterials', m => m.teacherId === AUTH.current.id && m.type === 'note' && !m.archived)
                    .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return `
      ${pageHeader({ title: 'Lessons & Content', subtitle: 'Class notes posted to your students',
        actions: `<button class="btn btn-primary" onclick="tch_postNoteModal()">${icon('plus','w-4 h-4')} Post Note</button>` })}
      ${tabBar}
      ${notes.length === 0 ? emptyState({ title: 'No class notes yet', body: 'Post a note and your students will see it instantly in their Learning hub.', icon: 'book' }) : `
        <div class="space-y-3">
          ${notes.map(m => {
            const cls = DB.find('classes', m.classId);
            const sub = DB.find('subjects', m.subjectId);
            const readViews = DB.query('materialViews', v => v.materialId === m.id);
            const classStudents = cls ? COMPUTE.studentsByClass(cls.id) : [];
            return `<div class="card p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="badge badge-info">${cls ? cls.name : '—'}</span>
                    <span class="badge badge-neutral">${sub ? sub.name : '—'}</span>
                    ${m.week ? `<span class="badge badge-success">${m.week}</span>` : ''}
                  </div>
                  <h3 class="font-bold text-slate-900">${m.title}</h3>
                  ${m.description ? `<p class="text-sm text-slate-500 mt-1 line-clamp-2">${m.description}</p>` : ''}
                  ${m.content ? `<div class="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">${m.content}</div>` : ''}
                  ${m.file ? `<a href="${m.file.data}" download="${m.file.name}" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs hover:bg-blue-100">
                    ${icon('paperclip','w-3.5 h-3.5 text-blue-600')}<span class="font-semibold text-blue-900">${m.file.name}</span>${icon('download','w-3 h-3 text-blue-600')}
                  </a>` : ''}
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-xs text-slate-400">${fdate(m.createdAt, { short: true })}${m.updatedAt ? ' · edited' : ''}</div>
                  ${classStudents.length ? `<div class="mt-1 text-xs font-semibold ${readViews.length >= classStudents.length ? 'text-emerald-600' : 'text-amber-600'}">${readViews.length}/${classStudents.length} read</div>` : ''}
                  <div class="flex gap-1 justify-end mt-2">
                    <button class="btn btn-ghost !p-1.5" onclick="tch_editNoteModal('${m.id}')" title="Edit note">${icon('edit','w-3.5 h-3.5')}</button>
                    <button class="btn btn-ghost !p-1.5 text-red-500" onclick="tch_deleteNote('${m.id}')" title="Delete note">${icon('trash','w-3.5 h-3.5')}</button>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  // tab === 'videos'
  const videos = DB.query('learningMaterials', m => m.teacherId === AUTH.current.id && m.type === 'video')
                   .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return `
    ${pageHeader({ title: 'Lessons & Content', subtitle: 'Videos posted to your students',
      actions: `<button class="btn btn-primary" onclick="tch_postVideoModal()">${icon('plus','w-4 h-4')} Add Video</button>` })}
    ${tabBar}
    ${videos.length === 0 ? emptyState({ title: 'No videos yet', body: 'Paste a YouTube or Vimeo link and your students can watch it from their Learning hub.', icon: 'classes' }) : `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${videos.map(m => {
          const cls = DB.find('classes', m.classId);
          const sub = DB.find('subjects', m.subjectId);
          const ytId = m.url ? tch_ytId(m.url) : null;
          return `<div class="card overflow-hidden">
            ${ytId ? `<div class="relative bg-black aspect-video cursor-pointer" onclick="tch_playVideo('${m.id}')">
              <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" class="w-full h-full object-cover opacity-90" onerror="this.style.display='none'">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">${icon('classes','w-6 h-6 text-white')}</div>
              </div>
            </div>` : `<div class="bg-slate-100 aspect-video flex items-center justify-center">${icon('classes','w-12 h-12 text-slate-300')}</div>`}
            <div class="p-3">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="badge badge-info text-xs">${cls ? cls.name : '—'}</span>
                <span class="badge badge-neutral text-xs">${sub ? sub.name : '—'}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-sm leading-tight">${m.title}</h4>
              <div class="text-xs text-slate-400 mt-1">${fdate(m.createdAt, { short: true })}</div>
              <div class="flex gap-2 mt-3">
                <button class="btn btn-secondary flex-1 text-xs py-1.5" onclick="tch_playVideo('${m.id}')">${icon('classes','w-3.5 h-3.5')} Preview</button>
                <button class="btn btn-secondary text-xs py-1.5 px-2 text-red-600" onclick="tch_deleteVideo('${m.id}')">${icon('trash','w-3.5 h-3.5')}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function tch_ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return m ? m[1] : null;
}

let _noteFileBuffer = null;
function tch_postNoteModal() {
  _noteFileBuffer = null;
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'Post Class Note',
    size: 'lg',
    body: `<div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Class</label>
          <select id="cn_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="input-label">Subject</label>
          <select id="cn_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Week (optional)</label><input id="cn_week" class="input" placeholder="e.g. Week 8"></div>
        <div><label class="input-label">Note Title</label><input id="cn_title" class="input" placeholder="e.g. Quadratic Equations — Notes"></div>
      </div>
      <div><label class="input-label">Note Content</label>
        <textarea id="cn_content" rows="6" class="input" placeholder="Type the full note here. Students will read this directly...&#10;&#10;Tip: you can paste content copied from Word — text and basic structure are preserved."></textarea></div>
      <div><label class="input-label">Description / Summary (shown on card)</label>
        <input id="cn_desc" class="input" placeholder="One-line summary for students"></div>
      <div>
        <label class="input-label">Attach File (PDF / Image — optional, max 5MB)</label>
        <input type="file" id="cn_fileInput" accept="application/pdf,image/*" class="hidden" onchange="onNoteFilePick(event)">
        <div class="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center hover:border-brand-400 cursor-pointer" onclick="document.getElementById('cn_fileInput').click()">
          ${icon('upload','w-5 h-5 mx-auto text-slate-400 mb-1')}<div class="text-xs text-slate-500">Click to attach a PDF or image</div>
        </div>
        <div id="cn_filePreview" class="mt-2"></div>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_saveNote()">Post Note</button>`
  });
}

function onNoteFilePick(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('File too large (max 5MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _noteFileBuffer = { name: file.name, type: file.type, size: Math.round(file.size/1024) + ' KB', data: e.target.result };
    const p = document.getElementById('cn_filePreview');
    if (p) p.innerHTML = `<div class="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">${icon('paperclip','w-4 h-4 text-blue-600')}<span class="flex-1 truncate font-semibold text-blue-900">${file.name}</span><span class="text-xs text-blue-700">${_noteFileBuffer.size}</span><button class="text-red-500 text-xs" onclick="_noteFileBuffer=null;document.getElementById('cn_filePreview').innerHTML=''">Remove</button></div>`;
  };
  reader.readAsDataURL(file);
}

function tch_saveNote() {
  const title = (document.getElementById('cn_title') || {}).value.trim();
  const classId = (document.getElementById('cn_class') || {}).value;
  const subjectId = (document.getElementById('cn_subject') || {}).value;
  if (!title || !classId) { toast('Title and class required', 'danger'); return; }
  const mat = {
    id: uid('lm'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    classId, subjectId, teacherId: AUTH.current.id,
    title, type: 'note',
    week: (document.getElementById('cn_week') || {}).value.trim() || null,
    description: (document.getElementById('cn_desc') || {}).value.trim(),
    content: (document.getElementById('cn_content') || {}).value.trim(),
    file: _noteFileBuffer, url: '', createdAt: now()
  };
  DB.insert('learningMaterials', mat);
  // Notify all students in the class
  COMPUTE.studentsByClass(classId).forEach(s => {
    DB.insert('notifications', { id: uid('not'), userId: s.id, title: 'New Class Note', body: `${mat.title} — posted by ${AUTH.current.name}`, type: 'info', read: false, timestamp: now(), link: { view: 'stu_learning', params: { tab: 'notes' } } });
  });
  _noteFileBuffer = null;
  document.getElementById('modalBackdrop').click();
  APP.go('tch_lessons', { tab: 'notes' });
  toast('Note posted · students notified', 'success');
}

function tch_editNoteModal(noteId) {
  const m = DB.find('learningMaterials', noteId);
  if (!m) return;
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'Edit Note',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="en_class" class="input">${classes.map(c => `<option value="${c.id}" ${c.id === m.classId ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="en_subject" class="input">${subjects.map(s => `<option value="${s.id}" ${s.id === m.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Week (optional)</label><input id="en_week" class="input" value="${m.week || ''}"></div>
          <div><label class="input-label">Note Title</label><input id="en_title" class="input" value="${m.title}"></div>
        </div>
        <div><label class="input-label">Note Content</label>
          <textarea id="en_content" rows="8" class="input">${m.content || ''}</textarea>
          <p class="text-xs text-slate-400 mt-1">You can paste content copied from Word — text structure is preserved.</p>
        </div>
        <div><label class="input-label">Description / Summary</label>
          <input id="en_desc" class="input" value="${m.description || ''}"></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_updateNote('${noteId}')">${icon('check','w-4 h-4')} Save Changes</button>`
  });
}

function tch_updateNote(noteId) {
  const title = (document.getElementById('en_title') || {}).value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }
  DB.update('learningMaterials', noteId, {
    classId: document.getElementById('en_class').value,
    subjectId: document.getElementById('en_subject').value,
    week: document.getElementById('en_week').value.trim() || null,
    title,
    description: document.getElementById('en_desc').value.trim(),
    content: document.getElementById('en_content').value.trim(),
    updatedAt: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.go('tch_lessons', { tab: 'notes' });
  toast('Note updated', 'success');
}

function tch_deleteNote(noteId) {
  const m = DB.find('learningMaterials', noteId);
  if (!m) return;
  if (!confirm(`Delete "${m.title}"? Students will lose access to this note.`)) return;
  DB.remove('learningMaterials', noteId);
  APP.go('tch_lessons', { tab: 'notes' });
  toast('Note deleted', 'success');
}

function tch_returnToStudent(assignmentId, studentId) {
  const a = DB.find('assignments', assignmentId);
  const idx = a.submissions.findIndex(s => s.studentId === studentId);
  if (idx === -1) { toast('Student has not submitted', 'warn'); return; }
  const gradeEl = document.getElementById('grd_' + studentId);
  const grade = gradeEl ? parseInt(gradeEl.value) : a.submissions[idx].grade;
  if (isNaN(grade) || grade < 0 || grade > 100) { toast('Enter a grade 0–100 before returning', 'danger'); return; }
  const feedback = (document.getElementById('fb_' + studentId) || {}).value || a.submissions[idx].feedback || '';
  const markStatus = (document.getElementById('mk_' + studentId) || {}).value || a.submissions[idx].markStatus || 'satisfactory';
  a.submissions[idx].grade = grade;
  a.submissions[idx].feedback = (typeof feedback === 'string' ? feedback.trim() : feedback);
  a.submissions[idx].markStatus = markStatus;
  a.submissions[idx].gradedAt = a.submissions[idx].gradedAt || now();
  a.submissions[idx].returned = true;
  a.submissions[idx].returnedAt = now();
  DB.update('assignments', assignmentId, { submissions: a.submissions });
  const student = DB.find('students', studentId);
  const statusLabel = markStatus === 'excellent' ? '⭐ Excellent' : markStatus === 'needs_revision' ? '🔄 Needs Revision' : '✓ Satisfactory';
  if (student) {
    DB.insert('notifications', { id: uid('not'), userId: student.id, title: `Work Returned — ${a.title}`, body: `Your work has been marked and returned: ${grade}/100 (${statusLabel}).${feedback ? ' Comments: ' + feedback : ''}`, type: 'success', read: false, timestamp: now(), link: { view: 'stu_assignments' } });
    if (student.parentId) DB.insert('notifications', { id: uid('not'), userId: student.parentId, title: `Assignment returned: ${a.title}`, body: `${student.name}'s work was marked: ${grade}/100 (${statusLabel}).`, type: 'info', read: false, timestamp: now(), link: { view: 'par_dashboard' } });
  }
  toast(`Returned to ${student ? student.name : 'student'} · ${grade}/100`, 'success');
  openAssignment(assignmentId);
}

function tch_pushToResultsModal(assignmentId) {
  const a = DB.find('assignments', assignmentId);
  const gradedSubs = a.submissions.filter(s => s.grade != null);
  if (!gradedSubs.length) { toast('Grade submissions first', 'warn'); return; }
  document.getElementById('modalBackdrop').click();
  setTimeout(() => modal({
    title: 'Push Grades to Academic Results',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Sync ${gradedSubs.length} graded submission${gradedSubs.length > 1 ? 's' : ''} into academic records as CA scores (scaled to 20 marks). Existing scores for the chosen slot will be overwritten.
        </div>
        ${(() => {
          const types = getTermAssessmentTypes();
          const caSlots = types.slice(0, -1);
          return `<div class="grid grid-cols-2 gap-3">
            <div><label class="input-label">Assessment Slot</label>
              <select id="pr_slot" class="input" onchange="document.getElementById('pr_scaled_info').textContent=this.options[this.selectedIndex].dataset.max">
                ${caSlots.map((t, i) => {
                  const key = termTypeKey(types, i);
                  return `<option value="${key}" data-max="${t.weight}">${t.label} (max ${t.weight} marks)</option>`;
                }).join('')}
              </select>
            </div>
            <div><label class="input-label">Term</label>
              <input id="pr_term" class="input" value="${DB.settings().currentTerm || ''}"></div>
          </div>
          <div class="card overflow-hidden">
            <table class="tbl text-sm">
              <thead><tr><th>Student</th><th>Score</th><th>→ Scaled (<span id="pr_scaled_info">${caSlots[0] ? caSlots[0].weight : 20}</span> marks)</th></tr></thead>
              <tbody>
                ${gradedSubs.map(sub => {
                  const st = DB.find('students', sub.studentId);
                  const max = caSlots[0] ? caSlots[0].weight : 20;
                  const caScore = Math.round(sub.grade * max / 100);
                  return `<tr><td>${st ? st.name : '—'}</td><td class="font-mono">${sub.grade}/100</td><td class="font-semibold text-brand-700">${caScore}/${max}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`;
        })()}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_confirmPushToResults('${assignmentId}')">${icon('check','w-4 h-4')} Push to Results</button>`
  }), 50);
}

function tch_confirmPushToResults(assignmentId) {
  const a = DB.find('assignments', assignmentId);
  const slotEl = document.getElementById('pr_slot');
  const slot = slotEl.value;
  const slotMax = parseInt(slotEl.options[slotEl.selectedIndex].dataset.max) || 20;
  const term = document.getElementById('pr_term').value.trim();
  const gradedSubs = a.submissions.filter(s => s.grade != null);
  let synced = 0;
  gradedSubs.forEach(sub => {
    const caScore = Math.round(sub.grade * slotMax / 100);
    const existing = DB.query('results', r => r.studentId === sub.studentId && r.subjectId === a.subjectId && r.classId === a.classId && r.term === term)[0];
    if (existing) {
      const patch = { [slot]: caScore };
      const keys = ['ca1','ca2','ca3','ca4','exam'];
      const total = keys.reduce((s, k) => s + (k === slot ? caScore : (existing[k] || 0)), 0);
      const { grade } = COMPUTE.gradeFromScore(total);
      DB.update('results', existing.id, Object.assign(patch, { total, grade }));
    } else {
      const rec = { id: uid('res'), schoolId: AUTH.current.schoolId || 'sch_brightlights', studentId: sub.studentId, classId: a.classId, subjectId: a.subjectId, term, [slot]: caScore, exam: 0, total: caScore, grade: COMPUTE.gradeFromScore(caScore).grade, comment: '', approved: false };
      DB.insert('results', rec);
    }
    synced++;
  });
  document.getElementById('modalBackdrop').click();
  toast(`${synced} result${synced > 1 ? 's' : ''} synced to academic records`, 'success');
}

function tch_postVideoModal() {
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'Add Video Lesson',
    size: 'lg',
    body: `<div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Class</label>
          <select id="vid_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="input-label">Subject</label>
          <select id="vid_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      </div>
      <div><label class="input-label">Video Title</label><input id="vid_title" class="input" placeholder="e.g. Solving Quadratic Equations — Khan Academy"></div>
      <div><label class="input-label">YouTube or Vimeo URL</label>
        <input id="vid_url" class="input" placeholder="https://www.youtube.com/watch?v=..." oninput="tch_previewYT()"></div>
      <div id="vid_preview" class="hidden rounded-xl overflow-hidden bg-black aspect-video">
        <iframe id="vid_iframe" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
      </div>
      <div><label class="input-label">Description (optional)</label><input id="vid_desc" class="input" placeholder="What will students learn from this video?"></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_saveVideo()">Save Video</button>`
  });
}

function tch_previewYT() {
  const url = (document.getElementById('vid_url') || {}).value;
  const ytId = tch_ytId(url);
  const preview = document.getElementById('vid_preview');
  const iframe = document.getElementById('vid_iframe');
  if (ytId && preview && iframe) {
    iframe.src = `https://www.youtube.com/embed/${ytId}`;
    preview.classList.remove('hidden');
  } else if (preview) {
    preview.classList.add('hidden');
  }
}

function tch_saveVideo() {
  const title = (document.getElementById('vid_title') || {}).value.trim();
  const url = (document.getElementById('vid_url') || {}).value.trim();
  const classId = (document.getElementById('vid_class') || {}).value;
  const subjectId = (document.getElementById('vid_subject') || {}).value;
  if (!title || !url) { toast('Title and URL required', 'danger'); return; }
  const mat = {
    id: uid('lm'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    classId, subjectId, teacherId: AUTH.current.id,
    title, type: 'video', url,
    description: (document.getElementById('vid_desc') || {}).value.trim(),
    file: null, createdAt: now()
  };
  DB.insert('learningMaterials', mat);
  COMPUTE.studentsByClass(classId).forEach(s => {
    DB.insert('notifications', { id: uid('not'), userId: s.id, title: 'New Video Lesson', body: `${mat.title} — posted by ${AUTH.current.name}`, type: 'info', read: false, timestamp: now(), link: { view: 'stu_learning', params: { tab: 'videos' } } });
  });
  document.getElementById('modalBackdrop').click();
  APP.go('tch_lessons', { tab: 'videos' });
  toast('Video saved · students notified', 'success');
}

function tch_playVideo(id) {
  const m = DB.find('learningMaterials', id);
  if (!m) return;
  const ytId = tch_ytId(m.url);
  modal({
    title: m.title,
    size: 'xl',
    body: `<div class="rounded-xl overflow-hidden bg-black aspect-video w-full">
      ${ytId ? `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>`
             : `<div class="flex items-center justify-center h-full text-white text-sm">Video unavailable</div>`}
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function tch_deleteVideo(id) {
  confirm('Delete this video? Students will no longer see it.', () => {
    DB.remove('learningMaterials', id);
    APP.go('tch_lessons', { tab: 'videos' });
    toast('Video removed', 'info');
  }, { danger: true });
}

let _lessonFileBuffer = null;
function onLessonFilePick(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('File too large (max 2MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _lessonFileBuffer = { name: file.name, type: file.type, size: Math.round(file.size / 1024) + ' KB', data: e.target.result, uploadedAt: now() };
    const preview = document.getElementById('lp_filePreview');
    if (preview) preview.innerHTML = `<div class="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">${icon('paperclip','w-4 h-4 text-emerald-600')}<span class="flex-1 truncate font-semibold text-emerald-900">${file.name}</span><span class="text-xs text-emerald-700">${_lessonFileBuffer.size}</span><button class="text-rose-600 text-xs" onclick="_lessonFileBuffer=null; document.getElementById('lp_filePreview').innerHTML=''">Remove</button></div>`;
  };
  reader.readAsDataURL(file);
}

function createLessonModal() {
  _lessonFileBuffer = null;
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'New Lesson Plan',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="lp_class" class="input" onchange="refreshLessonSchemes()">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="lp_subject" class="input" onchange="refreshLessonSchemes()">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div id="lp_schemeRow">
          <label class="input-label">Tie to Scheme of Work (auto-fills week + topic)</label>
          <select id="lp_scheme" class="input" onchange="onLessonSchemeChange()">
            <option value="">— None (manual entry) —</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Week</label><input id="lp_week" class="input" placeholder="e.g. Week 7" /></div>
          <div><label class="input-label">Topic</label><input id="lp_topic" class="input" placeholder="e.g. Quadratic Equations" /></div>
        </div>
        <div><label class="input-label">Objectives</label><textarea id="lp_obj" rows="2" class="input" placeholder="e.g. Students will be able to solve quadratic equations using the factorisation method"></textarea></div>
        <div><label class="input-label">Activities</label><textarea id="lp_act" rows="2" class="input" placeholder="e.g. Group work, think-pair-share, guided practice on the board"></textarea></div>
        <div><label class="input-label">Resources / Materials</label><input id="lp_res" class="input" placeholder="e.g. Textbook p.55, graph paper, coloured markers" /></div>
        <div>
          <label class="input-label">Attach Lesson Plan File (PDF / Word / Image — optional)</label>
          <input type="file" id="lp_fileInput" accept="application/pdf,.doc,.docx,image/*" class="hidden" onchange="onLessonFilePick(event)" />
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-brand-400 cursor-pointer" onclick="document.getElementById('lp_fileInput').click()">
            ${icon('upload','w-5 h-5 mx-auto text-slate-400 mb-1')}
            <div class="text-xs text-slate-500">Click to upload — your prepared lesson plan</div>
          </div>
          <div id="lp_filePreview" class="mt-2"></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveLesson()">Save Plan</button>`
  });
}

function refreshLessonSchemes() {
  const classId = (document.getElementById('lp_class') || {}).value;
  const subjectId = (document.getElementById('lp_subject') || {}).value;
  const select = document.getElementById('lp_scheme');
  if (!select || !classId || !subjectId) return;
  const schoolId = AUTH.current.schoolId || AUTH.current.id;
  const scheme = DB.query('schemesOfWork', s => s.schoolId === schoolId && s.classId === classId && s.subjectId === subjectId)[0];
  if (!scheme) {
    select.innerHTML = '<option value="">— No scheme of work for this class/subject —</option>';
    return;
  }
  select.innerHTML = '<option value="">— None (manual entry) —</option>' +
    scheme.weeks.map((w, idx) => `<option value="${scheme.id}|${idx}" ${w.covered ? 'data-covered="1"' : ''}>Week ${w.week}: ${w.topic}${w.covered ? ' ✓' : ''}</option>`).join('');
}

function onLessonSchemeChange() {
  const val = document.getElementById('lp_scheme').value;
  if (!val) return;
  const [schemeId, idx] = val.split('|');
  const scheme = DB.find('schemesOfWork', schemeId);
  if (!scheme) return;
  const w = scheme.weeks[parseInt(idx)];
  document.getElementById('lp_week').value = 'Week ' + w.week;
  document.getElementById('lp_topic').value = w.topic;
  document.getElementById('lp_obj').value = w.objectives || '';
  document.getElementById('lp_res').value = w.resources || '';
}

function saveLesson() {
  const schemeRef = (document.getElementById('lp_scheme') || {}).value;
  const lp = {
    id: uid('lp'), schoolId: AUTH.current.schoolId || AUTH.current.id, teacherId: AUTH.current.id,
    classId: document.getElementById('lp_class').value,
    subjectId: document.getElementById('lp_subject').value,
    week: document.getElementById('lp_week').value.trim(),
    topic: document.getElementById('lp_topic').value.trim(),
    objectives: document.getElementById('lp_obj').value.trim(),
    activities: document.getElementById('lp_act').value.trim(),
    resources: document.getElementById('lp_res').value.trim(),
    file: _lessonFileBuffer,
    schemeRef: schemeRef || null,
    createdAt: now()
  };
  if (!lp.topic || !lp.week) { toast('Week and topic required', 'danger'); return; }
  DB.insert('lessonPlans', lp);

  // If tied to a scheme, mark that week as covered automatically
  if (schemeRef) {
    const [schemeId, idx] = schemeRef.split('|');
    const scheme = DB.find('schemesOfWork', schemeId);
    if (scheme && !scheme.weeks[parseInt(idx)].covered) {
      scheme.weeks[parseInt(idx)].covered = true;
      scheme.weeks[parseInt(idx)].coveredAt = now();
      scheme.weeks[parseInt(idx)].coveredBy = AUTH.current.id;
      DB.update('schemesOfWork', schemeId, { weeks: scheme.weeks });
    }
  }

  _lessonFileBuffer = null;
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Lesson plan saved' + (schemeRef ? ' · scheme week marked covered' : '') + (lp.file ? ' · attachment uploaded' : ''), 'success');
}

// Wire scheme dropdown when modal opens
setTimeout(() => {
  // overridden later when the modal actually opens; refreshLessonSchemes is called on class/subject change
}, 0);

/* ---------- My Timetable ---------- */
function view_tch_timetable() {
  const view = APP.params.ttScope || 'week';
  return `
    ${pageHeader({ title: 'My Schedule', subtitle: 'Your classes for the day, week, or month' })}
    <div class="flex gap-2 mb-4">
      <button class="chip ${view==='day'?'active':''}" onclick="APP.params.ttScope='day'; APP.render()">Today</button>
      <button class="chip ${view==='week'?'active':''}" onclick="APP.params.ttScope='week'; APP.render()">This Week</button>
      <button class="chip ${view==='month'?'active':''}" onclick="APP.params.ttScope='month'; APP.render()">This Month</button>
    </div>
    <div>
      ${view === 'day' ? renderTeacherDayView() : view === 'month' ? renderTeacherMonthView() : renderTeacherWeekView()}
    </div>
  `;
}

function renderTeacherWeekView() {
  const t = AUTH.current;
  const tt = DB.query('timetable', x => x.teacherId === t.id);
  const subjects = DB.get('subjects');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];
  return `
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Period</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>
            ${periods.map(p => {
              const entries = days.map(d => tt.find(x => x.day === d && x.period === p));
              if (entries.every(e => !e)) return '';
              return `<tr>
                <td><strong>P${p}</strong><br><span class="text-xs text-slate-500">${entries.find(Boolean) ? entries.find(Boolean).time : ''}</span></td>
                ${entries.map(e => {
                  if (!e) return '<td class="text-slate-300">—</td>';
                  const sub = subjects.find(s => s.id === e.subjectId);
                  const cls = DB.find('classes', e.classId);
                  return `<td><div class="font-semibold">${sub ? sub.name : ''}</div><div class="text-xs text-slate-500">${cls ? cls.name : ''}</div></td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTeacherDayView() {
  const t = AUTH.current;
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const todays = DB.query('timetable', x => x.teacherId === t.id && x.day === dayName).sort((a, b) => a.period - b.period);
  const subjects = DB.get('subjects');
  if (todays.length === 0) {
    return emptyState({ title: 'No classes today', body: dayName + ' is free for you. Use the time for grading or lesson prep.', icon: 'calendar' });
  }
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-3">${dayName}, ${fdate(today(), { long: true })}</h3>
      <div class="space-y-2">
        ${todays.map(e => {
          const sub = subjects.find(s => s.id === e.subjectId);
          const cls = DB.find('classes', e.classId);
          const studentCount = cls ? COMPUTE.studentsByClass(cls.id).length : 0;
          return `<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-14 h-14 rounded-xl bg-brand-100 text-brand-700 flex flex-col items-center justify-center flex-shrink-0">
              <div class="text-xs font-bold">P${e.period}</div>
              <div class="text-xs">${e.time.split('-')[0]}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-slate-900">${sub ? sub.name : '—'}</div>
              <div class="text-sm text-slate-500">${cls ? cls.name : ''} · ${studentCount} students · ${e.time}</div>
            </div>
            <button class="btn btn-secondary !py-1.5 text-xs" onclick="APP.go('tch_attendance', { classId: '${e.classId}' })">${icon('attendance','w-3.5 h-3.5')} Attendance</button>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTeacherMonthView() {
  const t = AUTH.current;
  const tt = DB.query('timetable', x => x.teacherId === t.id);
  const subjects = DB.get('subjects');
  // Count classes per day in the month
  const now_ = new Date();
  const year = now_.getFullYear();
  const month = now_.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  // Build cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dayName = dayNames[dayDate.getDay()];
    const periodsThisDay = tt.filter(p => p.day === dayName);
    cells.push({ day: d, dayName, periods: periodsThisDay, isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6, isToday: d === now_.getDate() });
  }
  const totalThisMonth = cells.filter(Boolean).reduce((s, c) => s + (c.isWeekend ? 0 : c.periods.length), 0);

  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-900">${now_.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h3>
        <span class="text-sm text-slate-500"><strong>${totalThisMonth}</strong> classes scheduled this month</span>
      </div>
      <div class="grid grid-cols-7 gap-1 mb-2 text-xs font-semibold text-slate-500 text-center">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="py-1">${d}</div>`).join('')}
      </div>
      <div class="grid grid-cols-7 gap-1">
        ${cells.map(c => {
          if (!c) return '<div></div>';
          const count = c.isWeekend ? 0 : c.periods.length;
          return `<div class="min-h-[64px] p-1.5 rounded-lg ${c.isToday ? 'bg-brand-100 border-2 border-brand-500' : c.isWeekend ? 'bg-slate-50' : 'bg-white border border-slate-200'}">
            <div class="text-xs font-bold ${c.isToday ? 'text-brand-700' : 'text-slate-700'}">${c.day}</div>
            ${count > 0 ? `<div class="text-xs mt-1 text-brand-700 font-semibold">${count} class${count !== 1 ? 'es' : ''}</div>` : ''}
            ${count > 0 ? c.periods.slice(0, 2).map(p => {
              const sub = subjects.find(s => s.id === p.subjectId);
              return `<div class="text-xs text-slate-600 truncate">${sub ? sub.name.split(' ')[0] : ''}</div>`;
            }).join('') : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ---------- Messages ---------- */
function view_tch_messages() { return view_messages_shared('teacher'); }

/* ============================================================
   CBT — Teacher authoring & review
   ============================================================ */
function view_tch_cbt() {
  const t = AUTH.current;
  const exams = DB.query('cbtExams', e => e.teacherId === t.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    ${pageHeader({
      title: 'CBT Exams',
      subtitle: 'Create computer-based tests and review submissions',
      actions: `<button class="btn btn-primary" onclick="createCbtExamModal()">${icon('plus','w-4 h-4')} New CBT</button>`
    })}
    ${exams.length === 0 ? emptyState({ title: 'No CBT exams yet', body: 'Create your first computer-based test for your class.', icon: 'classes' }) : `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${exams.map(e => {
          const cls = DB.find('classes', e.classId);
          const subs = DB.query('cbtSubmissions', x => x.examId === e.id);
          const pending = subs.filter(x => x.status === 'submitted').length;
          const classSize = COMPUTE.studentsByClass(e.classId).length;
          return `<div class="card p-4">
            <div class="flex items-center gap-1.5 flex-wrap mb-2">
              <span class="badge badge-info">${cls ? cls.name : ''}</span>
              <span class="badge badge-neutral">${DB.find('subjects', e.subjectId) ? DB.find('subjects', e.subjectId).name : ''}</span>
              <span class="badge ${e.status === 'published' ? 'badge-success' : 'badge-warn'}">${e.status}</span>
            </div>
            <h3 class="font-bold text-slate-900 mb-1">${e.title}</h3>
            <div class="text-xs text-slate-500 mb-3">${e.questions.length} questions · ${e.durationMins} min · Due ${fdate(e.dueDate, { short: true })}</div>
            <div class="flex items-center justify-between text-xs mb-3">
              <span class="text-slate-500">Submissions</span>
              <span class="font-semibold">${subs.length}/${classSize}</span>
            </div>
            ${pending ? `<div class="text-xs text-amber-700 mb-2">⚠ ${pending} need theory review</div>` : ''}
            <button class="btn btn-secondary w-full text-sm" onclick="reviewCbt('${e.id}')">${icon('reports','w-4 h-4')} Review Submissions</button>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

let _cbtDraft = null;
function createCbtExamModal() {
  _cbtDraft = { questions: [], title: '', classId: '', subjectId: '', duration: 20, rules: 'Answer all questions.' };
  renderCbtBuilder();
}

function _captureCbtMeta() {
  if (document.getElementById('cbt_title')) {
    _cbtDraft.title = document.getElementById('cbt_title').value;
    _cbtDraft.classId = document.getElementById('cbt_class').value;
    _cbtDraft.subjectId = document.getElementById('cbt_subject').value;
    _cbtDraft.duration = document.getElementById('cbt_duration').value;
    _cbtDraft.rules = document.getElementById('cbt_rules').value;
  }
}

function renderCbtBuilder() {
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  const d = _cbtDraft;
  modal({
    title: 'Create CBT Exam',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div><label class="input-label">Exam Title</label><input id="cbt_title" class="input" value="${(d.title || '').replace(/"/g,'&quot;')}" placeholder="e.g. Mathematics Mid-Term CBT" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label><select id="cbt_class" class="input">${classes.map(c => `<option value="${c.id}" ${d.classId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
          <div><label class="input-label">Subject</label><select id="cbt_subject" class="input">${subjects.map(s => `<option value="${s.id}" ${d.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Duration (minutes)</label><input id="cbt_duration" type="number" class="input" value="${d.duration}" /></div>
          <div><label class="input-label">Rules</label><input id="cbt_rules" class="input" value="${(d.rules || '').replace(/"/g,'&quot;')}" /></div>
        </div>

        <div class="border-t border-slate-100 pt-3">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-bold text-slate-900">Questions (${d.questions.length})</h4>
            <div class="text-xs text-slate-500">Total marks: ${d.questions.reduce((s, q) => s + q.marks, 0)}</div>
          </div>
          ${d.questions.length === 0 ? `<p class="text-sm text-slate-400 mb-3">No questions yet. Add objective or theory questions below.</p>` : `
            <div class="space-y-2 mb-3">
              ${d.questions.map((q, i) => `<div class="bg-slate-50 rounded-xl p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-slate-400 mb-0.5">${i + 1}. ${q.type === 'objective' ? 'Objective' : 'Theory'} · ${q.marks} mark(s)</div>
                    <div class="font-semibold text-sm">${q.text}</div>
                    ${q.type === 'objective' ? `<div class="text-xs text-slate-500 mt-1">${q.options.map((o, oi) => `${oi === q.answer ? '✓ ' : ''}${o}`).join(' · ')}</div>` : ''}
                  </div>
                  <button class="btn btn-ghost !p-1 text-rose-600" onclick="removeCbtQuestion(${i})">${icon('trash','w-4 h-4')}</button>
                </div>
              </div>`).join('')}
            </div>
          `}

          <div class="border-2 border-dashed border-slate-200 rounded-xl p-3 space-y-2">
            <div class="flex gap-2">
              <select id="nq_type" class="input !w-40 text-sm" onchange="document.getElementById('nq_objBlock').classList.toggle('hidden', this.value!=='objective')">
                <option value="objective">Objective (MCQ)</option>
                <option value="theory">Theory</option>
              </select>
              <input id="nq_marks" type="number" class="input !w-24 text-sm" value="1" placeholder="Marks" />
            </div>
            <input id="nq_text" class="input text-sm" placeholder="Question text…" />
            <div id="nq_objBlock" class="space-y-1.5">
              ${[0,1,2,3].map(oi => `<div class="flex items-center gap-2">
                <input type="radio" name="nq_correct" value="${oi}" ${oi === 0 ? 'checked' : ''} />
                <input id="nq_opt${oi}" class="input text-sm" placeholder="Option ${oi + 1}" />
              </div>`).join('')}
              <div class="text-xs text-slate-400">Select the radio next to the correct option.</div>
            </div>
            <button class="btn btn-secondary w-full text-sm" onclick="addCbtQuestion()">${icon('plus','w-4 h-4')} Add Question</button>
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="_cbtDraft=null; document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveCbtExam()">${icon('check','w-4 h-4')} Publish Exam</button>`
  });
}

function addCbtQuestion() {
  _captureCbtMeta();
  const type = document.getElementById('nq_type').value;
  const text = document.getElementById('nq_text').value.trim();
  const marks = parseInt(document.getElementById('nq_marks').value) || 1;
  if (!text) { toast('Enter the question text', 'danger'); return; }
  if (type === 'objective') {
    const options = [0,1,2,3].map(oi => document.getElementById('nq_opt' + oi).value.trim()).filter(Boolean);
    if (options.length < 2) { toast('Provide at least two options', 'danger'); return; }
    const correctEl = document.querySelector('input[name="nq_correct"]:checked');
    const answer = correctEl ? parseInt(correctEl.value) : 0;
    if (answer >= options.length) { toast('Correct option must be one you filled in', 'danger'); return; }
    _cbtDraft.questions.push({ id: 'q' + (_cbtDraft.questions.length + 1), type: 'objective', text, options, answer, marks });
  } else {
    _cbtDraft.questions.push({ id: 'q' + (_cbtDraft.questions.length + 1), type: 'theory', text, marks });
  }
  renderCbtBuilder();
}

function removeCbtQuestion(i) {
  _captureCbtMeta();
  _cbtDraft.questions.splice(i, 1);
  renderCbtBuilder();
}

function saveCbtExam() {
  _captureCbtMeta();
  const d = _cbtDraft;
  if (!d.title.trim()) { toast('Exam title is required', 'danger'); return; }
  if (!d.questions.length) { toast('Add at least one question', 'danger'); return; }
  const exam = {
    id: uid('cbt'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    classId: d.classId, subjectId: d.subjectId, teacherId: AUTH.current.id,
    title: d.title.trim(), durationMins: parseInt(d.duration) || 20, status: 'published',
    dueDate: daysAhead(7), createdAt: now(), rules: d.rules.trim(), questions: d.questions
  };
  DB.insert('cbtExams', exam);
  // Notify students
  COMPUTE.studentsByClass(d.classId).forEach(s => {
    DB.insert('notifications', { id: uid('not'), userId: s.id, title: 'New CBT Exam', body: `${exam.title} — ${exam.questions.length} questions, ${exam.durationMins} min`, type: 'info', read: false, timestamp: now(), link: { view: 'stu_cbt' } });
  });
  _cbtDraft = null;
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('CBT published to students', 'success');
}

function reviewCbt(examId) {
  const e = DB.find('cbtExams', examId);
  const subs = DB.query('cbtSubmissions', x => x.examId === examId);
  const studentName = id => { const s = DB.find('students', id); return s ? s.name : '—'; };
  modal({
    title: e.title + ' — Submissions',
    size: 'lg',
    body: `
      <div class="space-y-3">
        ${subs.length === 0 ? `<p class="text-sm text-slate-500 text-center py-6">No submissions yet.</p>` : subs.map(sub => `
          <div class="border border-slate-200 rounded-xl p-3">
            <div class="flex items-center gap-3 mb-2">
              ${avatar(studentName(sub.studentId), 'sm')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm">${studentName(sub.studentId)}</div>
                <div class="text-xs text-slate-500">Submitted ${fdate(sub.submittedAt, { relative: true })}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-brand-700">${sub.totalScore}/${sub.maxScore}</div>
                <span class="badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warn'}">${sub.status}</span>
              </div>
            </div>
            ${sub.status === 'submitted' && sub.theoryMax > 0 ? `
              <div class="bg-slate-50 rounded-lg p-2 space-y-2">
                <div class="text-xs font-semibold uppercase text-slate-500">Theory answers to mark</div>
                ${e.questions.filter(q => q.type === 'theory').map(q => `
                  <div>
                    <div class="text-xs font-semibold text-slate-700">${q.text} (${q.marks} marks)</div>
                    <div class="text-sm text-slate-600 bg-white border border-slate-200 rounded p-2 my-1">${sub.answers[q.id] || '—'}</div>
                    <input type="number" min="0" max="${q.marks}" id="th_${sub.id}_${q.id}" class="input !w-32 text-sm" placeholder="Marks /${q.marks}" />
                  </div>
                `).join('')}
                <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="finalizeCbtGrade('${sub.id}')">${icon('check','w-3.5 h-3.5')} Finalize Grade</button>
              </div>
            ` : `<div class="text-xs text-emerald-700">Auto-graded — objective ${sub.objectiveScore}/${sub.objectiveMax}${sub.theoryMax ? `, theory ${sub.theoryScore}/${sub.theoryMax}` : ''}</div>`}
          </div>
        `).join('')}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function finalizeCbtGrade(subId) {
  const sub = DB.find('cbtSubmissions', subId);
  const e = DB.find('cbtExams', sub.examId);
  let theoryScore = 0;
  e.questions.filter(q => q.type === 'theory').forEach(q => {
    const el = document.getElementById(`th_${subId}_${q.id}`);
    let m = el ? (parseInt(el.value) || 0) : 0;
    m = Math.max(0, Math.min(q.marks, m));
    theoryScore += m;
  });
  const totalScore = sub.objectiveScore + theoryScore;
  DB.update('cbtSubmissions', subId, { theoryScore, totalScore, status: 'graded', gradedAt: now() });
  const student = DB.find('students', sub.studentId);
  if (student) {
    DB.insert('notifications', { id: uid('not'), userId: student.id, title: 'CBT Result Ready', body: `${e.title}: ${totalScore}/${sub.maxScore}`, type: 'success', read: false, timestamp: now(), link: { view: 'stu_cbt' } });
    DB.insert('notifications', { id: uid('not'), userId: student.parentId, title: 'CBT Result', body: `${student.name} scored ${totalScore}/${sub.maxScore} in ${e.title}`, type: 'info', read: false, timestamp: now() });
  }
  toast(`Graded ${student ? student.name : 'student'} · ${totalScore}/${sub.maxScore}`, 'success');
  reviewCbt(sub.examId);
}

/* ============================================================
   MY APPRAISAL — Teacher view
   Self-assessment form, status tracker, acknowledgement
   ============================================================ */
function view_tch_appraisal() {
  const me = AUTH.current;
  const aprs = DB.query('appraisals', a => a.staffId === me.id).sort((a, b) => {
    const c1 = DB.find('appraisalCycles', a.cycleId);
    const c2 = DB.find('appraisalCycles', b.cycleId);
    return (c2?.createdAt || '').localeCompare(c1?.createdAt || '');
  });
  const pending = aprs.find(a => a.status === 'self_pending');
  const ackPending = aprs.find(a => a.status === 'ack_pending');

  return `
    ${pageHeader({ title: 'My Appraisal', subtitle: 'Self-assessment, progress and results' })}

    ${pending ? `<div class="card p-5 mb-4 border-2 border-amber-300 bg-amber-50">
      <div class="flex items-start gap-3">
        <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-xl">✍️</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-amber-900">Self-Assessment Required</h3>
          ${(() => { const c = DB.find('appraisalCycles', pending.cycleId); return `<p class="text-sm text-amber-800 mt-0.5">${c?.title || 'Appraisal'} · Deadline: ${fdate(c?.deadline, { long: true })}</p>`; })()}
          <p class="text-xs text-amber-700 mt-1">Complete your self-assessment before your manager can review your performance.</p>
        </div>
        <button class="btn btn-primary flex-shrink-0" onclick="tch_selfAssessmentModal('${pending.id}')">${icon('edit','w-4 h-4')} Start Now</button>
      </div>
    </div>` : ''}

    ${ackPending ? `<div class="card p-5 mb-4 border-2 border-brand-300 bg-brand-50">
      <div class="flex items-start gap-3">
        <span class="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-xl">🏆</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-brand-900">Your Appraisal Result is Ready</h3>
          <p class="text-sm text-brand-700 mt-0.5">Score: <strong>${ackPending.finalOverall}%</strong> · Outcome: <strong>${_tch_outcomeLabel(ackPending.outcome)}</strong></p>
          <p class="text-xs text-brand-600 mt-1">Review the full appraisal below and acknowledge to complete the process.</p>
        </div>
        <button class="btn btn-primary flex-shrink-0" onclick="tch_acknowledgeModal('${ackPending.id}')">${icon('check','w-4 h-4')} Acknowledge</button>
      </div>
    </div>` : ''}

    ${aprs.length === 0 ? emptyState({ title: 'No appraisals yet', body: 'Your appraisals will appear here once your school opens an appraisal cycle.', icon: 'reports' }) : `
      <div class="space-y-4">
        ${aprs.map(apr => {
          const cycle = DB.find('appraisalCycles', apr.cycleId);
          const selfOverall = apr.selfScores ? _aprOverall(apr.selfScores) : null;
          const mgrOverall = apr.managerScores ? _aprOverall(apr.managerScores) : null;
          return `<div class="card p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="font-bold text-slate-900">${cycle?.title || 'Appraisal'}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${cycle?.term || ''} · Deadline: ${fdate(cycle?.deadline, { short: true })}</p>
              </div>
              <div class="flex items-center gap-2">
                ${_aprStatusBadge_tch(apr.status)}
                ${apr.finalOverall ? `<div class="text-right"><div class="text-xl font-extrabold ${apr.finalOverall>=80?'text-emerald-700':apr.finalOverall>=60?'text-amber-700':'text-rose-700'}">${apr.finalOverall}%</div></div>` : ''}
              </div>
            </div>

            <!-- 5-step progress bar -->
            <div class="flex items-center gap-0 mb-4 overflow-x-auto">
              ${[
                { label: 'Self', done: !!apr.selfSubmittedAt, active: apr.status === 'self_pending' },
                { label: 'Manager', done: !!apr.managerSubmittedAt, active: apr.status === 'manager_pending' },
                { label: 'Principal', done: !!apr.principalAt, active: apr.status === 'principal_pending' },
                { label: 'Outcome', done: !!apr.outcome, active: apr.status === 'outcome_pending' },
                { label: 'Acknowledged', done: !!apr.ackedAt, active: apr.status === 'ack_pending' }
              ].map((step, i, arr) => `<div class="flex items-center flex-shrink-0">
                <div class="flex flex-col items-center">
                  <div class="w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold ${step.done ? 'bg-brand-600 text-white' : step.active ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}">${step.done ? '✓' : i+1}</div>
                  <div class="text-[10px] mt-0.5 w-16 text-center ${step.active ? 'text-amber-700 font-semibold' : step.done ? 'text-brand-600' : 'text-slate-400'}">${step.label}</div>
                </div>
                ${i < arr.length - 1 ? `<div class="w-6 h-0.5 ${step.done ? 'bg-brand-400' : 'bg-slate-200'} mb-4 flex-shrink-0"></div>` : ''}
              </div>`).join('')}
            </div>

            <!-- Score comparison (only once manager has reviewed) -->
            ${selfOverall !== null || mgrOverall !== null ? `<div class="grid grid-cols-2 gap-3 mb-3">
              ${selfOverall !== null ? `<div class="bg-slate-50 rounded-xl p-3 text-center"><div class="text-xs text-slate-500">My Self-Score</div><div class="text-2xl font-extrabold text-slate-700 mt-0.5">${selfOverall}%</div></div>` : ''}
              ${mgrOverall !== null ? `<div class="bg-brand-50 rounded-xl p-3 text-center"><div class="text-xs text-brand-600">Manager's Score</div><div class="text-2xl font-extrabold text-brand-700 mt-0.5">${mgrOverall}%</div></div>` : ''}
            </div>` : ''}

            <!-- Outcome box -->
            ${apr.outcome ? `<div class="rounded-xl p-3 ${apr.outcome.type === 'pip' ? 'bg-rose-50 border border-rose-200' : apr.outcome.type === 'increment' ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}">
              <div class="font-semibold text-sm mb-1">${_tch_outcomeLabel(apr.outcome)} ${apr.outcome.incrementPct ? `(+${apr.outcome.incrementPct}%)` : ''}</div>
              <div class="text-xs text-slate-600">${apr.outcome.note}</div>
            </div>` : ''}

            <!-- Principal comment (visible once approved) -->
            ${apr.principalComment ? `<div class="mt-3 border-l-4 border-brand-400 pl-3 py-1">
              <div class="text-xs font-semibold text-slate-500 mb-0.5">Principal's Comment</div>
              <div class="text-sm text-slate-700">${apr.principalComment}</div>
            </div>` : ''}

            <!-- Actions -->
            <div class="flex gap-2 mt-3">
              ${apr.status === 'self_pending' ? `<button class="btn btn-primary text-sm" onclick="tch_selfAssessmentModal('${apr.id}')">${icon('edit','w-4 h-4')} Complete Self-Assessment</button>` : ''}
              ${apr.status === 'ack_pending' ? `<button class="btn btn-primary text-sm" onclick="tch_acknowledgeModal('${apr.id}')">${icon('check','w-4 h-4')} Acknowledge Result</button>` : ''}
              ${apr.selfSubmittedAt ? `<button class="btn btn-ghost text-sm" onclick="tch_viewSelfAssessment('${apr.id}')">${icon('reports','w-4 h-4')} My Submission</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function _tch_outcomeLabel(outcome) {
  if (!outcome) return '—';
  return { increment: 'Salary Increment', commendation: 'Letter of Commendation', training: 'Training Plan', pip: 'Performance Improvement Plan', none: 'No Action' }[outcome.type] || outcome.type;
}

function _aprStatusBadge_tch(status) {
  const map = {
    self_pending: ['badge-warn', 'Action needed — complete self-assessment'],
    manager_pending: ['badge-neutral', 'Manager reviewing'],
    principal_pending: ['badge-neutral', 'Principal reviewing'],
    outcome_pending: ['badge-neutral', 'Setting outcome'],
    ack_pending: ['badge-info', 'Ready — please acknowledge'],
    completed: ['badge-success', 'Completed']
  };
  const [cls, lbl] = map[status] || ['badge-neutral', status];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

// Self-assessment form
function tch_selfAssessmentModal(aprId) {
  const apr = DB.find('appraisals', aprId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  modal({
    title: 'Self-Assessment',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>${cycle?.title}</strong><br/>
          Rate yourself honestly on each area. Your manager will review these scores independently.
        </div>
        ${APR_METRICS.map(m => `<div>
          <div class="flex items-center justify-between mb-1">
            <label class="input-label !mb-0 font-semibold">${m.label}</label>
            <span class="text-xs text-slate-400">${m.desc}</span>
          </div>
          <div class="flex items-center gap-3">
            <input id="self_${m.key}" type="range" min="0" max="100" value="75" class="flex-1 accent-brand-600" oninput="tch_updateSelfTotal()" />
            <span id="self_${m.key}_val" class="w-10 text-center font-bold text-brand-700">75</span>
          </div>
        </div>`).join('')}
        <div class="bg-brand-50 rounded-xl p-3 flex items-center justify-between">
          <span class="font-semibold text-brand-800">Your Overall Score</span>
          <span class="text-xl font-extrabold text-brand-700" id="self_overall">75%</span>
        </div>
        <div><label class="input-label">Your Comment <span class="text-slate-400 font-normal">(achievements, challenges, goals)</span></label>
          <textarea id="self_comment" rows="4" class="input" placeholder="What went well this term? What are your development goals?"></textarea>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_submitSelfAssessment('${aprId}')">${icon('check','w-4 h-4')} Submit Self-Assessment</button>`
  });
  setTimeout(tch_updateSelfTotal, 50);
}

function tch_updateSelfTotal() {
  APR_METRICS.forEach(m => {
    const sl = document.getElementById('self_' + m.key);
    const vl = document.getElementById('self_' + m.key + '_val');
    if (sl && vl) vl.textContent = sl.value;
  });
  const overall = Math.round(APR_METRICS.reduce((s, m) => { const el = document.getElementById('self_'+m.key); return s + (el ? parseInt(el.value)||0 : 0); }, 0) / APR_METRICS.length);
  const el = document.getElementById('self_overall');
  if (el) el.textContent = overall + '%';
}

function tch_submitSelfAssessment(aprId) {
  const comment = document.getElementById('self_comment').value.trim();
  if (!comment) { toast('Add a comment about your performance', 'danger'); return; }
  const scores = {};
  APR_METRICS.forEach(m => { const el = document.getElementById('self_'+m.key); scores[m.key] = el ? parseInt(el.value)||0 : 0; });
  DB.update('appraisals', aprId, { selfScores: scores, selfComment: comment, selfSubmittedAt: now(), status: 'manager_pending' });
  // Notify manager
  const apr = DB.find('appraisals', aprId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  DB.insert('notifications', { id: uid('not'), userId: cycle?.createdBy || 'sch_brightlights', title: 'Self-Assessment Submitted', body: `${AUTH.current.name} has submitted their self-assessment for ${cycle?.title}. Please complete the manager review.`, type: 'info', read: false, timestamp: now(), link: { view: 'adm_workforce', params: { workforceTab: 'appraisal' } } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Self-assessment submitted · your manager has been notified', 'success');
}

// View own submission (read-only)
function tch_viewSelfAssessment(aprId) {
  const apr = DB.find('appraisals', aprId);
  const overall = _aprOverall(apr.selfScores);
  modal({
    title: 'Your Self-Assessment',
    body: `
      <div class="space-y-3">
        <div class="space-y-2">
          ${APR_METRICS.map(m => `<div class="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
            <span class="text-slate-600 w-40 flex-shrink-0">${m.label}</span>
            ${_aprScoreBar(apr.selfScores[m.key]||0)}
          </div>`).join('')}
        </div>
        <div class="bg-brand-50 rounded-xl p-3 flex items-center justify-between">
          <span class="font-semibold">Overall</span>
          <span class="text-xl font-extrabold text-brand-700">${overall}%</span>
        </div>
        <div class="bg-slate-50 rounded-xl p-3"><div class="text-xs font-semibold text-slate-500 mb-1">Your Comment</div><div class="text-sm text-slate-700">${apr.selfComment}</div></div>
        <div class="text-xs text-slate-400 text-center">Submitted ${fdate(apr.selfSubmittedAt, { time: true })}</div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

// Staff acknowledgement
function tch_acknowledgeModal(aprId) {
  const apr = DB.find('appraisals', aprId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  modal({
    title: 'Acknowledge Your Appraisal Result',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-xl p-5 text-center">
          <div class="text-4xl font-extrabold">${apr.finalOverall}%</div>
          <div class="text-brand-200 text-sm mt-1">${cycle?.title || 'Appraisal'}</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          ${APR_METRICS.map(m => `<div class="bg-slate-50 rounded-lg p-2.5">
            <div class="text-xs text-slate-500 mb-1">${m.label}</div>
            ${_aprScoreBar(apr.finalScores?.[m.key]||0)}
          </div>`).join('')}
        </div>
        ${apr.outcome ? `<div class="rounded-xl p-3 ${apr.outcome.type==='pip'?'bg-rose-50 border border-rose-200':'bg-emerald-50 border border-emerald-200'}">
          <div class="font-semibold text-sm">${_tch_outcomeLabel(apr.outcome)}${apr.outcome.incrementPct ? ` (+${apr.outcome.incrementPct}%)` : ''}</div>
          <div class="text-xs mt-1">${apr.outcome.note}</div>
        </div>` : ''}
        ${apr.principalComment ? `<div class="border-l-4 border-brand-400 pl-3 py-1"><div class="text-xs font-semibold text-slate-500 mb-0.5">Principal's Comment</div><div class="text-sm text-slate-700">${apr.principalComment}</div></div>` : ''}
        <div><label class="input-label">Your Response <span class="text-slate-400 font-normal">(optional)</span></label>
          <textarea id="ack_response" rows="3" class="input" placeholder="Any comments, queries or concerns about this appraisal…"></textarea>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          ${icon('info','w-4 h-4 inline mr-1')} By acknowledging you confirm you have read and understood this appraisal. This does not mean you necessarily agree with every part.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_confirmAcknowledge('${aprId}')">${icon('check','w-4 h-4')} Acknowledge & Complete</button>`
  });
}

function tch_confirmAcknowledge(aprId) {
  const response = (document.getElementById('ack_response').value || '').trim();
  DB.update('appraisals', aprId, { ackedAt: now(), staffResponse: response, status: 'completed' });
  const apr = DB.find('appraisals', aprId);
  const cycle = DB.find('appraisalCycles', apr.cycleId);
  // Notify admin the cycle is done for this staff member
  DB.insert('notifications', { id: uid('not'), userId: cycle?.createdBy || 'sch_brightlights', title: 'Appraisal Acknowledged', body: `${AUTH.current.name} has acknowledged their appraisal (${apr.finalOverall}%). The cycle is complete for this staff member.`, type: 'success', read: false, timestamp: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.schoolId || 'sch_brightlights', actor: AUTH.current.id, action: 'appraisal_acknowledged', target: `${AUTH.current.name} · ${apr.finalOverall}%`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Appraisal acknowledged · process complete', 'success');
}

// Helper — reuse APR_METRICS in teacher context (defined in admin.js but global)
// If APR_METRICS not available (e.g. loaded before admin.js), fall back gracefully
function _aprOverall(scores) {
  if (!scores) return 0;
  const keys = ['attendance','resultSubmission','parentFeedback','classroomPerformance'];
  const vals = keys.map(k => scores[k] || 0);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function _aprScoreBar(score) {
  const col = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return `<div class="flex items-center gap-2"><div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="${col} h-full rounded-full" style="width:${score}%"></div></div><span class="text-xs font-bold w-8 text-right">${score}</span></div>`;
}

function _aprStatusBadge(status) {
  const map = { self_pending: 'badge-neutral', manager_pending: 'badge-warn', principal_pending: 'badge-info', outcome_pending: 'badge-warn', ack_pending: 'badge-info', completed: 'badge-success' };
  const labels = { self_pending: 'Self pending', manager_pending: 'Manager review', principal_pending: 'Principal review', outcome_pending: 'Setting outcome', ack_pending: 'Awaiting ack', completed: 'Completed' };
  return `<span class="badge ${map[status]||'badge-neutral'}">${labels[status]||status}</span>`;
}

/* ============================================================
   TEACHER PROFILE (self-service)
   ============================================================ */
function view_tch_profile() {
  const t = DB.find('teachers', AUTH.current.id);
  if (!t) return emptyState({ title: 'Profile not found', icon: 'teacher' });

  const classes = teacherClasses();
  const subjects = DB.query('subjects', s => (t.subjectIds || []).includes(s.id));
  const schoolId = t.schoolId || AUTH.current.schoolId;
  const attRecs = DB.query('staffAttendance', a => a.schoolId === schoolId && a.staffId === t.id).sort((a,b) => b.date.localeCompare(a.date));
  const last30 = attRecs.filter(a => a.date >= daysAgo(30));
  const presentDays = last30.filter(a => a.status === 'present').length;
  const lateDays = last30.filter(a => a.status === 'late').length;
  const absentDays = last30.filter(a => a.status === 'absent').length;
  const latestAppraisal = DB.query('appraisals', a => a.staffId === t.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];

  return `
    ${pageHeader({
      title: 'My Profile',
      subtitle: 'Your personal and professional information',
      actions: `<button class="btn btn-primary" onclick="tch_editProfileModal()">${icon('edit','w-4 h-4')} Edit Profile</button>`
    })}

    <div class="grid lg:grid-cols-3 gap-4">
      <!-- Identity card -->
      <div class="space-y-4">
        <div class="card p-5 text-center">
          ${avatar(t.name, 'xxl')}
          <div class="font-bold text-slate-900 text-xl mt-3">${t.name}</div>
          <div class="text-sm text-slate-500 mt-0.5">${t.role || 'Teacher'}</div>
          ${t.department ? `<span class="badge badge-info mt-2">${t.department}</span>` : ''}
          ${t.staffId ? `<div class="text-xs text-slate-400 mt-2">Staff ID: <strong>${t.staffId}</strong></div>` : ''}
        </div>
        <div class="card p-4 space-y-2 text-sm">
          <h4 class="font-bold text-slate-700 text-xs uppercase tracking-wide mb-3">Contact</h4>
          <div class="flex items-center gap-2 text-slate-700">${icon('phone','w-4 h-4 text-slate-400')} ${t.phone || '—'}</div>
          <div class="flex items-center gap-2 text-slate-700">${icon('edit','w-4 h-4 text-slate-400')} ${t.email || '—'}</div>
          ${t.address ? `<div class="flex items-start gap-2 text-slate-700">${icon('package','w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0')} <span>${t.address}</span></div>` : ''}
        </div>
      </div>

      <!-- Teaching assignments + attendance -->
      <div class="lg:col-span-2 space-y-4">
        <div class="grid grid-cols-3 gap-3">
          ${statCard({ label: 'Present (30d)', value: presentDays, icon: 'check', color: 'brand' })}
          ${statCard({ label: 'Late (30d)', value: lateDays, icon: 'bell', color: 'gold' })}
          ${statCard({ label: 'Absent (30d)', value: absentDays, icon: 'attendance', color: absentDays > 3 ? 'rose' : 'blue' })}
        </div>

        <div class="card p-4">
          <h4 class="font-bold text-slate-900 mb-3">Teaching Assignments</h4>
          ${classes.length === 0 ? `<p class="text-sm text-slate-400">No classes assigned.</p>` : `
            <div class="space-y-2">
              ${classes.map(c => {
                const students = COMPUTE.studentsByClass(c.id);
                const classSubs = subjects.filter(s => !s.classId || s.classId === c.id);
                return `<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div class="font-semibold text-slate-900">${c.name}</div>
                    <div class="text-xs text-slate-500">${classSubs.map(s=>s.name).join(' · ') || 'Subjects not listed'}</div>
                  </div>
                  <span class="badge badge-neutral">${students.length} students</span>
                </div>`;
              }).join('')}
            </div>`}
        </div>

        ${latestAppraisal ? `
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-900">Latest Appraisal</h4>
            ${_aprStatusBadge(latestAppraisal.status)}
          </div>
          <div class="text-sm text-slate-500">Cycle: <strong class="text-slate-800">${latestAppraisal.cycle || '—'}</strong></div>
          <button class="btn btn-secondary text-xs mt-3" onclick="APP.go('tch_appraisal')">${icon('arrow_left','w-3.5 h-3.5 rotate-180')} View Appraisal</button>
        </div>` : ''}

        ${attRecs.length ? `
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 class="font-bold text-slate-900">Recent Attendance</h4>
            <span class="text-xs text-slate-400">Last ${Math.min(attRecs.length, 10)} records</span>
          </div>
          <table class="tbl">
            <thead><tr><th>Date</th><th class="text-center">Status</th><th>Note</th></tr></thead>
            <tbody>
              ${attRecs.slice(0,10).map(a => `<tr>
                <td class="text-sm">${fdate(a.date, { short: true })}</td>
                <td class="text-center">${statusBadge(a.status)}</td>
                <td class="text-xs text-slate-500">${a.note || '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      </div>
    </div>
  `;
}

function tch_editProfileModal() {
  const t = DB.find('teachers', AUTH.current.id);
  if (!t) return;
  modal({
    title: 'Edit My Profile',
    body: `<div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Phone</label><input id="tp_phone" class="input" value="${t.phone || ''}" /></div>
        <div><label class="input-label">Email</label><input id="tp_email" class="input" type="email" value="${t.email || ''}" /></div>
      </div>
      <div><label class="input-label">Address</label><textarea id="tp_address" class="input" rows="2">${t.address || ''}</textarea></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="tch_saveProfile()">Save</button>`
  });
}

function tch_saveProfile() {
  const t = DB.find('teachers', AUTH.current.id);
  if (!t) return;
  DB.update('teachers', t.id, {
    phone: (document.getElementById('tp_phone') || {}).value.trim(),
    email: (document.getElementById('tp_email') || {}).value.trim(),
    address: (document.getElementById('tp_address') || {}).value.trim()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Profile updated', 'success');
}

