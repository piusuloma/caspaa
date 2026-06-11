/* ============================================================
   ASSESSMENTS HUB
   Unified view for Assignments + CBT Exams + Quick Tests.
   Redefines: view_tch_assessments, view_stu_assessments
   Adds:      assess_bulkUploadModal — create exam/test from CSV
   ============================================================ */

// ── Teacher Hub ──────────────────────────────────────────────────────────────

function view_tch_assessments(params) {
  const tab = APP.params.assessTab || 'assignments';

  const tabDefs = [
    { key: 'assignments', label: 'Assignments' },
    { key: 'cbt',         label: 'CBT Exams'   },
    { key: 'formative',   label: 'Quick Tests'  },
  ];

  const actions = {
    assignments: `<button class="btn btn-primary" onclick="createAssignmentModal()">${icon('plus','w-4 h-4')} New Assignment</button>`,
    cbt: `
      <button class="btn btn-secondary" onclick="assess_bulkUploadModal('cbt')">${icon('book','w-4 h-4')} Bulk Upload CSV</button>
      <button class="btn btn-primary" onclick="createCbtExamModal()">${icon('plus','w-4 h-4')} New CBT Exam</button>`,
    formative: `
      <button class="btn btn-secondary" onclick="assess_bulkUploadModal('formative')">${icon('book','w-4 h-4')} Bulk Upload CSV</button>
      <button class="btn btn-primary" onclick="tch_createTestModal()">${icon('plus','w-4 h-4')} New Quick Test</button>`,
  }[tab] || '';

  let content = '';
  if (tab === 'assignments') content = tch_renderAssignments();
  else if (tab === 'cbt')    content = assess_tch_cbtList();
  else                       content = assess_tch_formativeList();

  return `
    ${pageHeader({ title: 'Assessments', subtitle: 'Assignments, CBT exams, and formative quick tests in one place', actions })}
    <div class="flex gap-2 mb-5 flex-wrap">
      ${tabDefs.map(t => `<button onclick="APP.params.assessTab='${t.key}';APP.render()"
        class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${tab===t.key?'bg-brand-700 text-white border-brand-700':'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">
        ${t.label}
      </button>`).join('')}
    </div>
    ${content}
  `;
}

function assess_tch_cbtList() {
  const t = AUTH.current;
  const exams = DB.query('cbtExams', e => e.teacherId === t.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (!exams.length) return emptyState({ title: 'No CBT exams yet', body: 'Create a new CBT exam or bulk-upload a question bank via CSV.', icon: 'classes' });
  return `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
    ${exams.map(e => {
      const cls  = DB.find('classes', e.classId);
      const subj = DB.find('subjects', e.subjectId);
      const subs = DB.query('cbtSubmissions', x => x.examId === e.id);
      const pending   = subs.filter(x => x.status === 'submitted').length;
      const classSize = COMPUTE.studentsByClass(e.classId).length;
      return `<div class="card p-4 flex flex-col gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="badge badge-info">${cls ? cls.name : '—'}</span>
          <span class="badge badge-neutral">${subj ? subj.name : '—'}</span>
          <span class="badge ${e.status === 'published' ? 'badge-success' : 'badge-warn'}">${e.status}</span>
        </div>
        <div class="font-bold text-slate-900">${e.title}</div>
        <div class="text-xs text-slate-500">${e.questions.length} questions · ${e.durationMins} min · Due ${fdate(e.dueDate,{short:true})}</div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>Submissions</span><span class="font-semibold">${subs.length}/${classSize}</span>
        </div>
        ${pending ? `<div class="text-xs text-amber-700">⚠ ${pending} need theory review</div>` : ''}
        <button class="btn btn-secondary w-full text-sm mt-1" onclick="reviewCbt('${e.id}')">${icon('reports','w-4 h-4')} Review Submissions</button>
      </div>`;
    }).join('')}
  </div>`;
}

function assess_tch_formativeList() {
  const schoolId  = AUTH.current.schoolId;
  const teacherId = AUTH.current.id;
  const ftTab     = APP.params.ftTab || 'active';
  const allTests  = DB.query('formativeTests', t => t.schoolId === schoolId && t.teacherId === teacherId);
  const tabTests  = allTests.filter(t => t.status === ftTab);
  const schoolId  = AUTH.current.schoolId || 'sch_brightlights';
  const classes   = DB.query('classes', c => c.schoolId === schoolId);
  const subjects  = DB.get('subjects');

  const subTabs = [
    { key: 'active', label: 'Active' },
    { key: 'draft',  label: 'Draft'  },
    { key: 'closed', label: 'Closed' },
  ];

  return `
    <div class="flex gap-2 mb-4 flex-wrap">
      ${subTabs.map(t => {
        const count = allTests.filter(x => x.status === t.key).length;
        return `<button onclick="APP.params.ftTab='${t.key}';APP.render()"
          class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${ftTab===t.key?'bg-slate-700 text-white border-slate-700':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}">
          ${t.label} <span class="opacity-60 text-xs">${count}</span>
        </button>`;
      }).join('')}
    </div>
    ${tabTests.length === 0
      ? emptyState({ icon:'book', title:`No ${ftTab} quick tests`, body:'Create and publish tests to see them here.' })
      : `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${tabTests.map(test => {
            const cls  = classes.find(c => c.id === test.classId);
            const subj = subjects.find(s => s.id === test.subjectId);
            const subs = DB.query('formativeSubmissions', s => s.testId === test.id);
            const classSize = COMPUTE.studentsByClass(test.classId).length;
            return `<div class="card p-4 flex flex-col gap-2">
              <div class="flex items-start justify-between">
                <div class="min-w-0">
                  <div class="font-bold text-slate-900 truncate">${test.title}</div>
                  <div class="text-xs text-slate-500 mt-0.5">${cls ? cls.name : '—'} · ${subj ? subj.name : '—'}</div>
                </div>
                <span class="badge flex-shrink-0 ml-2 ${test.status==='active'?'badge-success':test.status==='draft'?'badge-warn':'badge-neutral'}">${test.status}</span>
              </div>
              <div class="grid grid-cols-3 gap-1 text-center text-xs">
                <div class="bg-slate-50 rounded-lg py-1.5"><div class="font-bold">${(test.questions||[]).length}</div><div class="text-slate-400">Qs</div></div>
                <div class="bg-slate-50 rounded-lg py-1.5"><div class="font-bold">${test.duration}m</div><div class="text-slate-400">Time</div></div>
                <div class="bg-slate-50 rounded-lg py-1.5"><div class="font-bold">${subs.length}/${classSize}</div><div class="text-slate-400">Done</div></div>
              </div>
              <div class="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
                <button class="btn btn-secondary !py-1 text-xs" onclick="tch_viewTestResults('${test.id}')">${icon('results','w-3.5 h-3.5')} Results</button>
                ${test.status==='active'?`<button class="btn btn-secondary !py-1 text-xs" onclick="tch_closeTest('${test.id}')">Close</button>`:''}
                ${test.status==='draft'?`<button class="btn btn-primary !py-1 text-xs" onclick="tch_publishTest('${test.id}')">Publish</button>`:''}
                <button class="btn btn-ghost !py-1 text-xs text-rose-600 ml-auto" onclick="tch_deleteTest('${test.id}')">${icon('trash','w-3.5 h-3.5')}</button>
              </div>
            </div>`;
          }).join('')}
        </div>`}
  `;
}

// ── Student Hub ───────────────────────────────────────────────────────────────

function view_stu_assessments(params) {
  const tab = APP.params.stuAssessTab || 'assignments';
  const s   = (typeof me === 'function') ? me() : DB.find('students', AUTH.current.id);
  if (!s) return `<p class="text-rose-600 p-4">Student profile not found.</p>`;

  const sName = (id) => { const sub = DB.find('subjects', id); return sub ? sub.name : ''; };

  const tabDefs = [
    { key: 'assignments', label: 'Assignments'  },
    { key: 'cbt',         label: 'CBT Exams'    },
    { key: 'formative',   label: 'Quick Tests'  },
  ];

  // Badge counts for tabs
  const pendingAssign = DB.query('assignments', a => a.classId === s.classId)
    .filter(a => !a.submissions.find(x => x.studentId === s.id) && new Date(a.dueDate) >= new Date()).length;
  const pendingCbt = DB.query('cbtExams', e => e.classId === s.classId && e.status === 'published')
    .filter(e => !DB.query('cbtSubmissions', x => x.studentId === s.id && x.examId === e.id).length).length;
  const pendingFt  = DB.query('formativeTests', t => t.classId === s.classId && t.status === 'active' && t.dueDate >= today())
    .filter(t => !DB.query('formativeSubmissions', x => x.studentId === s.id && x.testId === t.id).length).length;

  const badges = { assignments: pendingAssign, cbt: pendingCbt, formative: pendingFt };

  let content = '';
  if (tab === 'assignments') content = assess_stu_assignments(s, sName);
  else if (tab === 'cbt')    content = assess_stu_cbt(s);
  else                       content = assess_stu_formative(s, sName);

  return `
    ${pageHeader({ title: 'My Assessments', subtitle: 'Assignments, exams, and quick tests' })}
    <div class="flex gap-2 mb-5 flex-wrap">
      ${tabDefs.map(t => {
        const n = badges[t.key];
        return `<button onclick="APP.params.stuAssessTab='${t.key}';APP.render()"
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${tab===t.key?'bg-brand-700 text-white border-brand-700':'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">
          ${t.label}${n ? ` <span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${tab===t.key?'bg-white text-brand-700':'bg-rose-500 text-white'}">${n}</span>` : ''}
        </button>`;
      }).join('')}
    </div>
    ${content}
  `;
}

function assess_stu_assignments(s, sName) {
  const assignments = DB.query('assignments', a => a.classId === s.classId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (!assignments.length) return emptyState({ title: 'No assignments yet', body: 'Nothing has been set yet — check back later.', icon: 'book' });
  return `<div class="space-y-3">
    ${assignments.map(a => {
      const sub     = a.submissions.find(x => x.studentId === s.id);
      const graded  = sub && sub.grade != null;
      const overdue = !sub && new Date(a.dueDate) < new Date();
      const subj    = DB.find('subjects', a.subjectId);
      const teacher = DB.find('teachers', a.teacherId);
      return `<div class="card p-4 flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="badge badge-neutral">${subj ? subj.name : '—'}</span>
            ${graded  ? `<span class="badge badge-success">Graded · ${sub.grade}/100</span>`
            : sub     ? `<span class="badge badge-info">Submitted</span>`
            : overdue ? `<span class="badge badge-danger">Overdue</span>`
            :            `<span class="badge badge-warn">To do</span>`}
          </div>
          <div class="font-bold text-slate-900">${a.title}</div>
          <p class="text-sm text-slate-500 mt-0.5 line-clamp-2">${a.description}</p>
          <div class="text-xs text-slate-400 mt-1.5">Due ${fdate(a.dueDate,{long:true})} · ${teacher ? teacher.name : '—'}</div>
          ${graded && sub.feedback ? `<div class="mt-2 bg-emerald-50 rounded-lg p-2 text-xs text-emerald-800"><strong>Feedback:</strong> ${sub.feedback}</div>` : ''}
        </div>
        <div class="flex-shrink-0 text-center">
          ${sub
            ? (graded
                ? `<div class="text-2xl font-extrabold text-emerald-700">${sub.grade}<span class="text-sm text-slate-400">/100</span></div>`
                : `<span class="text-xs text-slate-400">Awaiting grade</span>`)
            : `<button class="btn btn-primary text-sm" onclick="stu_submitAssignmentModal('${a.id}')">${icon('upload','w-4 h-4')} Submit</button>`}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function assess_stu_cbt(s) {
  const exams = DB.query('cbtExams', e => e.classId === s.classId && e.status === 'published').sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const subs  = DB.query('cbtSubmissions', x => x.studentId === s.id);
  if (!exams.length) return emptyState({ title: 'No exams available', body: 'Published CBT exams from your teachers will appear here.', icon: 'classes' });
  return `<div class="space-y-3">
    ${exams.map(e => {
      const sub = subs.find(x => x.examId === e.id);
      const subj = DB.find('subjects', e.subjectId);
      const objCount    = e.questions.filter(q => q.type === 'objective').length;
      const theoryCount = e.questions.filter(q => q.type === 'theory').length;
      return `<div class="card p-4 flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="badge badge-neutral">${subj ? subj.name : '—'}</span>
            <span class="badge badge-info">${e.durationMins} min</span>
            <span class="badge badge-neutral">${e.questions.length} Qs</span>
            ${sub ? `<span class="badge ${sub.status==='graded'?'badge-success':'badge-warn'}">${sub.status==='graded'?'Graded':'Submitted'}</span>` : ''}
          </div>
          <div class="font-bold text-slate-900">${e.title}</div>
          <div class="text-xs text-slate-500 mt-0.5">${objCount} objective · ${theoryCount} theory · Due ${fdate(e.dueDate,{short:true})}</div>
          ${e.rules ? `<div class="text-xs text-amber-700 mt-1">⚠ ${e.rules}</div>` : ''}
        </div>
        <div class="flex-shrink-0 text-right">
          ${sub
            ? `<div class="text-2xl font-extrabold text-brand-700">${sub.totalScore}<span class="text-sm text-slate-400">/${sub.maxScore}</span></div>
               <button class="btn btn-secondary !py-1 !px-2 text-xs mt-1" onclick="stu_viewCbtResult('${sub.id}')">View</button>`
            : `<button class="btn btn-primary text-sm" onclick="stu_startCbt('${e.id}')">${icon('classes','w-4 h-4')} Start</button>`}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function assess_stu_formative(s, sName) {
  const schoolId = AUTH.current.schoolId;
  const todayStr = today();
  const allTests = DB.query('formativeTests', t => t.schoolId === schoolId && t.classId === s.classId);
  const doneIds  = new Set(DB.query('formativeSubmissions', x => x.studentId === s.id).map(x => x.testId));
  const pending   = allTests.filter(t => t.status === 'active' && !doneIds.has(t.id) && t.dueDate >= todayStr);
  const completed = allTests.filter(t => doneIds.has(t.id));
  const subjects  = DB.get('subjects');

  const ftSubTab = APP.params.stuFtTab || 'pending';
  const list = ftSubTab === 'pending' ? pending : completed;

  return `
    <div class="flex gap-2 mb-4">
      ${[{key:'pending',label:`To Do (${pending.length})`},{key:'done',label:`Completed (${completed.length})`}].map(t =>
        `<button onclick="APP.params.stuFtTab='${t.key}';APP.render()"
          class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${ftSubTab===t.key?'bg-slate-700 text-white border-slate-700':'bg-white text-slate-500 border-slate-200'}">${t.label}</button>`
      ).join('')}
    </div>
    ${list.length === 0
      ? emptyState({ icon:'book', title: ftSubTab==='pending'?'All done!':'No completed tests yet', body: ftSubTab==='pending'?'No quick tests due right now.':'Tests you complete will appear here.' })
      : `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${list.map(test => {
            const subj = subjects.find(s => s.id === test.subjectId);
            const sub  = DB.query('formativeSubmissions', x => x.testId === test.id && x.studentId === s.id)[0];
            return `<div class="card p-4 flex flex-col gap-2">
              <div class="font-bold text-slate-900">${test.title}</div>
              <div class="text-xs text-slate-500">${subj ? subj.name : '—'}</div>
              <div class="grid grid-cols-2 gap-1 text-xs text-center">
                <div class="bg-slate-50 rounded-lg py-1.5"><div class="font-bold">${(test.questions||[]).length}</div><div class="text-slate-400">Questions</div></div>
                <div class="bg-slate-50 rounded-lg py-1.5"><div class="font-bold">${test.duration}m</div><div class="text-slate-400">Duration</div></div>
              </div>
              ${sub
                ? `<div class="bg-emerald-50 rounded-xl p-2 text-center">
                    <div class="text-lg font-extrabold text-emerald-700">${sub.score}/${sub.total} <span class="text-sm">(${sub.percentage}%)</span></div>
                    <button class="text-xs text-brand-700 underline mt-1" onclick="stu_viewMyResult('${test.id}')">View answers</button>
                   </div>`
                : `<div class="text-xs text-slate-400">Due: ${fdate(test.dueDate,{short:true})}</div>
                   <button class="btn btn-primary w-full" onclick="stu_startTest('${test.id}')">${icon('book','w-4 h-4')} Start Test</button>`}
            </div>`;
          }).join('')}
        </div>`}
  `;
}

// ── Bulk CSV Upload ───────────────────────────────────────────────────────────

function assess_bulkUploadModal(targetType) {
  const isCbt = targetType === 'cbt';
  const classes  = (typeof teacherClasses === 'function' ? teacherClasses() : DB.query('classes', c => c.schoolId === (AUTH.current.schoolId || 'sch_brightlights')));
  const subjects = DB.get('subjects');
  const label    = isCbt ? 'CBT Exam' : 'Quick Test';

  modal({
    title: `Bulk Upload — Create ${label} from CSV`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <!-- Meta fields -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Class *</label>
            <select id="bu_class" class="input">
              <option value="">— Select class —</option>
              ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="input-label">Subject *</label>
            <select id="bu_subject" class="input">
              <option value="">— Select subject —</option>
              ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Title *</label>
            <input id="bu_title" class="input" placeholder="e.g. Chapter 5 — Forces Quiz" />
          </div>
          <div>
            <label class="input-label">Duration (minutes)</label>
            <input id="bu_duration" type="number" class="input" value="${isCbt ? 30 : 15}" min="1" />
          </div>
        </div>
        <div>
          <label class="input-label">Due Date *</label>
          <input id="bu_due" type="date" class="input" value="${daysAhead(7)}" />
        </div>

        <!-- CSV input -->
        <div class="border-t border-slate-100 pt-3">
          <div class="flex items-center justify-between mb-2">
            <label class="input-label !mb-0">Question Bank (CSV) *</label>
            <label class="btn btn-secondary text-xs cursor-pointer">
              ${icon('upload','w-3.5 h-3.5')} Upload file
              <input type="file" accept=".csv,.txt" class="hidden" onchange="assess_onCsvFile(event)" />
            </label>
          </div>
          <textarea id="bu_csv" class="input font-mono text-xs" rows="10"
            placeholder="Paste CSV here — one question per line:

For MCQ:
question text, option A, option B, option C, option D, correct (A/B/C/D), marks
What is 2+2?, 2, 3, 4, 5, C, 1
Capital of Nigeria?, Kano, Lagos, Abuja, Ibadan, C, 1

For Theory (leave options blank):
question text, , , , , theory, marks
Explain Newton's first law., , , , , theory, 5"></textarea>
          <p class="text-xs text-slate-400 mt-1">Columns: Question, Opt A, Opt B, Opt C, Opt D, Correct (A–D) or "theory", Marks (default 1)</p>
        </div>

        <div id="bu_preview" class="hidden"></div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-secondary" onclick="assess_previewCsv('${targetType}')">Preview Questions</button>
      <button class="btn btn-primary" onclick="assess_saveBulk('${targetType}')">${icon('check','w-4 h-4')} Create ${label}</button>
    `
  });
}

function assess_onCsvFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const ta = document.getElementById('bu_csv');
    if (ta) { ta.value = e.target.result; assess_previewCsv(); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function assess_parseCsvQuestions(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const questions = [];

  lines.forEach((line, idx) => {
    // Simple CSV parse (handles basic quoted fields)
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g,''));
    if (cols.length < 1 || !cols[0]) return;

    const text    = cols[0];
    const optA    = cols[1] || '';
    const optB    = cols[2] || '';
    const optC    = cols[3] || '';
    const optD    = cols[4] || '';
    const correct = (cols[5] || '').toLowerCase();
    const marks   = parseInt(cols[6]) || 1;

    if (correct === 'theory') {
      questions.push({ id: uid('q'), text, type: 'theory', marks });
    } else {
      // MCQ — correct is A/B/C/D → index 0/1/2/3
      const correctIdx = { a: 0, b: 1, c: 2, d: 3 }[correct] ?? 0;
      const options = [optA, optB, optC, optD].filter(o => o);
      if (!options.length) return; // skip malformed
      questions.push({ id: uid('q'), text, type: 'objective', options, answer: correctIdx, marks });
    }
  });

  return questions;
}

function assess_previewCsv(targetType) {
  const csv = (document.getElementById('bu_csv') || {}).value || '';
  const questions = assess_parseCsvQuestions(csv);
  const preview = document.getElementById('bu_preview');
  if (!preview) return;

  if (!questions.length) {
    preview.className = 'block bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700';
    preview.innerHTML = 'No valid questions found. Check your CSV format.';
    return;
  }

  preview.className = 'block space-y-2';
  preview.innerHTML = `
    <div class="font-semibold text-slate-700 text-sm">${icon('check','w-4 h-4 inline text-emerald-600')} ${questions.length} question${questions.length !== 1 ? 's' : ''} detected</div>
    <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      ${questions.map((q, i) => `
        <div class="bg-slate-50 rounded-lg px-3 py-2 text-xs">
          <span class="font-semibold text-slate-600">${i+1}.</span>
          <span class="badge ${q.type==='objective'?'badge-info':'badge-neutral'} ml-1">${q.type==='objective'?'MCQ':'Theory'}</span>
          <span class="text-slate-700 ml-1">${q.text}</span>
          ${q.type==='objective' ? `<div class="text-slate-400 mt-0.5 pl-4">${q.options.map((o,oi) => `<span class="${oi===q.answer?'text-emerald-700 font-bold':''}">${['A','B','C','D'][oi]}) ${o}</span>`).join(' · ')}</div>` : ''}
          <span class="text-slate-400">(${q.marks} mark${q.marks!==1?'s':''})</span>
        </div>
      `).join('')}
    </div>
  `;
}

function assess_saveBulk(targetType) {
  const classId   = (document.getElementById('bu_class')   || {}).value;
  const subjectId = (document.getElementById('bu_subject') || {}).value;
  const title     = ((document.getElementById('bu_title')  || {}).value || '').trim();
  const duration  = parseInt((document.getElementById('bu_duration') || {}).value) || 15;
  const dueDate   = (document.getElementById('bu_due')     || {}).value || daysAhead(7);
  const csv       = (document.getElementById('bu_csv')     || {}).value || '';

  if (!classId)   { toast('Please select a class',   'danger'); return; }
  if (!subjectId) { toast('Please select a subject', 'danger'); return; }
  if (!title)     { toast('Please enter a title',    'danger'); return; }

  const questions = assess_parseCsvQuestions(csv);
  if (!questions.length) { toast('No valid questions found in CSV — check the format', 'danger'); return; }

  const schoolId  = AUTH.current.schoolId || 'sch_brightlights';
  const teacherId = AUTH.current.id;

  if (targetType === 'cbt') {
    DB.insert('cbtExams', {
      id: uid('cbt'), schoolId, teacherId, classId, subjectId,
      title, durationMins: duration, dueDate,
      questions, rules: 'Answer all questions. Submissions are final.',
      status: 'draft', createdAt: now()
    });
    toast(`CBT exam created with ${questions.length} questions — review and publish when ready`, 'success');
  } else {
    DB.insert('formativeTests', {
      id: uid('ft'), schoolId, teacherId, classId, subjectId,
      title, duration, dueDate,
      questions, status: 'draft', createdAt: now()
    });
    toast(`Quick test created with ${questions.length} questions — review and publish when ready`, 'success');
  }

  document.getElementById('modalBackdrop').click();
  APP.params.assessTab = targetType === 'cbt' ? 'cbt' : 'formative';
  APP.render();
}
