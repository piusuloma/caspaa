/* ============================================================
   TEACHER MODULE
   ============================================================ */

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

  // Today's timetable
  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const todaySchedule = DB.query('timetable', tt => tt.teacherId === t.id && tt.day === day).sort((a,b) => a.period - b.period);
  const subjects = DB.get('subjects');

  return `
    <div class="space-y-5">
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <p class="text-brand-200 text-sm">Welcome,</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold">${t.name}</h1>
        <p class="text-brand-100 text-sm mt-1">${t.subject} · ${fdate(today(), { long: true })}</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'My Classes', value: classes.length, icon: 'classes', color: 'brand' })}
        ${statCard({ label: 'Total Students', value: totalStudents, icon: 'students', color: 'blue' })}
        ${statCard({ label: 'Today Marked', value: todayAttendance.length, icon: 'attendance', color: 'gold' })}
        ${statCard({ label: 'Pending Approval', value: pendingResults, icon: 'results', color: 'rose' })}
      </div>

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
  return `
    ${pageHeader({ title: 'My Classes', subtitle: 'Classes you teach this term' })}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${classes.map(c => {
        const students = COMPUTE.studentsByClass(c.id);
        return `<div class="card p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="badge badge-info">${c.level}</span>
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
  toast(`All marked ${status}`);
}

function saveAttendance(classId, date) {
  const students = COMPUTE.studentsByClass(classId);
  const existing = COMPUTE.classAttendance(classId, date);
  let added = 0, absent = 0;
  students.forEach(s => {
    const status = _attBuffer[s.id];
    if (!status) return;
    const cur = existing.find(e => e.studentId === s.id);
    if (cur) DB.update('attendance', cur.id, { status });
    else {
      DB.insert('attendance', { id: uid('att'), schoolId: AUTH.current.id, studentId: s.id, classId, date, status, recordedBy: AUTH.current.id });
    }
    added++;
    if (status === 'absent') absent++;
  });
  if (added === 0) { toast('Mark at least one student first', 'warn'); return; }
  if (isOffline()) {
    for (let i = 0; i < added; i++) queueOfflineAction();
    toast(`Saved ${added} entries offline. Will sync when online.`, 'warn');
  } else {
    toast(`Saved ${added} entries. ${absent} parent${absent !== 1 ? 's' : ''} notified of absence.`);
  }
  Object.keys(_attBuffer).forEach(k => delete _attBuffer[k]);
  APP.render();
}

/* ---------- Results Entry ---------- */
function view_tch_results() {
  const classes = teacherClasses();
  if (classes.length === 0) return emptyState({ title: 'No classes assigned', body: 'Contact admin.', icon: 'classes' });
  const classId = APP.params.classId || classes[0].id;
  const subjectId = APP.params.subjectId || 'sub_math';
  const cls = DB.find('classes', classId);
  const subjects = DB.get('subjects');
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId && r.subjectId === subjectId);

  return `
    ${pageHeader({
      title: 'Enter Results',
      subtitle: `Enter CA1 (max 20), CA2 (max 20) and Exam (max 60) scores`
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
          <th>Student</th><th class="text-center">CA1 /20</th><th class="text-center">CA2 /20</th><th class="text-center">Exam /60</th>
          <th class="text-center">Total</th><th class="text-center">Grade</th><th>Comment</th>
        </tr></thead>
        <tbody>
          ${students.map(s => {
            const r = results.find(x => x.studentId === s.id);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span>${s.name}</span></div></td>
              <td><input type="number" max="20" min="0" class="input !w-16 text-center" id="res_ca1_${s.id}" value="${r ? r.ca1 : ''}" oninput="recalcResult('${s.id}')" /></td>
              <td><input type="number" max="20" min="0" class="input !w-16 text-center" id="res_ca2_${s.id}" value="${r ? r.ca2 : ''}" oninput="recalcResult('${s.id}')" /></td>
              <td><input type="number" max="60" min="0" class="input !w-16 text-center" id="res_exam_${s.id}" value="${r ? r.exam : ''}" oninput="recalcResult('${s.id}')" /></td>
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
  const ca1 = parseInt(document.getElementById(`res_ca1_${studentId}`).value) || 0;
  const ca2 = parseInt(document.getElementById(`res_ca2_${studentId}`).value) || 0;
  const exam = parseInt(document.getElementById(`res_exam_${studentId}`).value) || 0;
  if (ca1 > 20) document.getElementById(`res_ca1_${studentId}`).value = 20;
  if (ca2 > 20) document.getElementById(`res_ca2_${studentId}`).value = 20;
  if (exam > 60) document.getElementById(`res_exam_${studentId}`).value = 60;
  const total = ca1 + ca2 + exam;
  document.getElementById(`res_total_${studentId}`).textContent = total;
  const { grade } = COMPUTE.gradeFromScore(total);
  const cls = grade==='A'?'badge-success':grade==='F'?'badge-danger':'badge-info';
  document.getElementById(`res_grade_${studentId}`).innerHTML = `<span class="badge ${cls}">${grade}</span>`;
}

function saveResults(classId, subjectId) {
  const students = COMPUTE.studentsByClass(classId);
  let count = 0;
  students.forEach(s => {
    const ca1 = parseInt(document.getElementById(`res_ca1_${s.id}`).value) || 0;
    const ca2 = parseInt(document.getElementById(`res_ca2_${s.id}`).value) || 0;
    const exam = parseInt(document.getElementById(`res_exam_${s.id}`).value) || 0;
    const comment = document.getElementById(`res_cmt_${s.id}`).value.trim();
    if (ca1 === 0 && ca2 === 0 && exam === 0) return;
    const total = ca1 + ca2 + exam;
    const { grade } = COMPUTE.gradeFromScore(total);
    const existing = DB.query('results', r => r.studentId === s.id && r.subjectId === subjectId && r.classId === classId)[0];
    if (existing) DB.update('results', existing.id, { ca1, ca2, exam, total, grade, comment, approved: false });
    else DB.insert('results', { id: uid('res'), schoolId: AUTH.current.id, studentId: s.id, classId, subjectId, term: DB.settings().currentTerm, ca1, ca2, exam, total, grade, comment, approved: false });
    count++;
  });
  toast(`${count} result${count !== 1 ? 's' : ''} submitted for approval`);
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

/* ---------- Assignments ---------- */
function view_tch_assignments() {
  const t = AUTH.current;
  const assignments = DB.query('assignments', a => a.teacherId === t.id);
  return `
    ${pageHeader({
      title: 'Assignments',
      subtitle: 'Create, edit, and grade assignments',
      actions: `<button class="btn btn-primary" onclick="createAssignmentModal()">${icon('plus','w-4 h-4')} New Assignment</button>`
    })}
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
          <div class="space-y-1.5 max-h-72 overflow-y-auto scroll-area">
            ${students.map(s => {
              const sub = submissionsMap[s.id];
              const graded = sub && sub.grade != null;
              return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                ${avatar(s.name, 'sm')}
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm">${s.name}</div>
                  <div class="text-xs text-slate-500">${sub ? 'Submitted ' + fdate(sub.submittedAt, { relative: true }) : 'Not submitted'}</div>
                </div>
                ${sub ? (graded ? `<span class="badge badge-success">${sub.grade}/100</span>` : `
                  <input type="number" min="0" max="100" placeholder="Grade /100" class="input !w-28 text-sm" id="grd_${s.id}" />
                  <button class="btn btn-primary !py-1.5 !px-2 text-xs" onclick="gradeSubmission('${a.id}', '${s.id}')">Grade</button>
                `) : `<span class="badge badge-neutral">Pending</span>`}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-danger" onclick="deleteAssignmentConfirm('${a.id}')">${icon('trash','w-4 h-4')} Delete</button>
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      <button class="btn btn-primary" onclick="editAssignmentModal('${a.id}')">${icon('edit','w-4 h-4')} Edit</button>
    `
  });
}

function gradeSubmission(assignmentId, studentId) {
  const a = DB.find('assignments', assignmentId);
  const input = document.getElementById('grd_' + studentId);
  const grade = parseInt(input.value);
  if (isNaN(grade) || grade < 0 || grade > 100) { toast('Enter a grade 0–100', 'danger'); return; }
  const idx = a.submissions.findIndex(s => s.studentId === studentId);
  if (idx === -1) return;
  a.submissions[idx].grade = grade;
  a.submissions[idx].gradedAt = now();
  DB.update('assignments', assignmentId, { submissions: a.submissions });
  const student = DB.find('students', studentId);
  if (student) DB.insert('notifications', { id: uid('not'), userId: student.parentId, title: 'Assignment Graded', body: `${a.title}: ${grade}/100`, type: 'info', read: false, timestamp: now() });
  toast(`${student ? student.name : 'Student'} graded ${grade}/100`);
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
    toast('Assignment updated');
    return;
  }

  DB.insert('assignments', {
    id: uid('asn'), schoolId: AUTH.current.id, classId, subjectId, teacherId: AUTH.current.id,
    title, description, dueDate, createdAt: now(), submissions: []
  });
  // Notify all parents in the class
  const parents = COMPUTE.studentsByClass(classId).map(s => s.parentId);
  [...new Set(parents)].forEach(pid => {
    DB.insert('notifications', { id: uid('not'), userId: pid, title: 'New Assignment', body: `${title} — due ${fdate(dueDate, { short: true })}`, type: 'info', read: false, timestamp: now() });
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Assignment posted. ${parents.length} parents notified.`);
}

/* ---------- Lesson Plans ---------- */
function view_tch_lessons() {
  const lessons = DB.query('lessonPlans', l => l.teacherId === AUTH.current.id);
  const subjects = DB.get('subjects');
  return `
    ${pageHeader({
      title: 'Lesson Plans',
      subtitle: 'Weekly schemes and lesson notes',
      actions: `<button class="btn btn-primary" onclick="createLessonModal()">${icon('plus','w-4 h-4')} New Lesson Plan</button>`
    })}
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
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function createLessonModal() {
  const classes = teacherClasses();
  const subjects = DB.get('subjects');
  modal({
    title: 'New Lesson Plan',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Class</label>
            <select id="lp_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
          </div>
          <div><label class="input-label">Subject</label>
            <select id="lp_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Week</label><input id="lp_week" class="input" placeholder="e.g. Week 7" /></div>
          <div><label class="input-label">Topic</label><input id="lp_topic" class="input" placeholder="e.g. Quadratic Equations" /></div>
        </div>
        <div><label class="input-label">Objectives</label><textarea id="lp_obj" rows="2" class="input"></textarea></div>
        <div><label class="input-label">Activities</label><textarea id="lp_act" rows="2" class="input"></textarea></div>
        <div><label class="input-label">Resources</label><input id="lp_res" class="input" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveLesson()">Save Plan</button>`
  });
}

function saveLesson() {
  const lp = {
    id: uid('lp'), schoolId: AUTH.current.id, teacherId: AUTH.current.id,
    classId: document.getElementById('lp_class').value,
    subjectId: document.getElementById('lp_subject').value,
    week: document.getElementById('lp_week').value.trim(),
    topic: document.getElementById('lp_topic').value.trim(),
    objectives: document.getElementById('lp_obj').value.trim(),
    activities: document.getElementById('lp_act').value.trim(),
    resources: document.getElementById('lp_res').value.trim(),
    createdAt: now()
  };
  if (!lp.topic || !lp.week) { toast('Week and topic required', 'danger'); return; }
  DB.insert('lessonPlans', lp);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Lesson plan saved');
}

/* ---------- My Timetable ---------- */
function view_tch_timetable() {
  const t = AUTH.current;
  const tt = DB.query('timetable', x => x.teacherId === t.id);
  const subjects = DB.get('subjects');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];

  return `
    ${pageHeader({ title: 'My Timetable', subtitle: 'Your weekly teaching schedule' })}
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

/* ---------- Messages ---------- */
function view_tch_messages() { return view_messages_shared('teacher'); }
