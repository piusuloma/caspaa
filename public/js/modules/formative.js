/* ============================================================
   FORMATIVE ASSESSMENTS MODULE  (Quick Tests)
   Collections: formativeTests, formativeSubmissions
   ============================================================ */

/* ─────────────────────────────────────────────────────────────
   TEACHER VIEWS
   ───────────────────────────────────────────────────────────── */

function view_tch_formative(params) {
  const schoolId = AUTH.current.schoolId;
  const teacherId = AUTH.current.id;
  const activeTab = APP.params.ftTab || 'active';

  const allTests = DB.query('formativeTests', t => t.schoolId === schoolId && t.teacherId === teacherId);
  const tabTests = allTests.filter(t => t.status === activeTab);

  const classes  = DB.get('classes');
  const subjects = DB.get('subjects');

  function testCard(test) {
    const cls  = classes.find(c => c.id === test.classId);
    const subj = subjects.find(s => s.id === test.subjectId);
    const submissions = DB.query('formativeSubmissions', s => s.testId === test.id);
    const classSize   = COMPUTE.studentsByClass(test.classId).length;
    const qCount      = (test.questions || []).length;

    return `
      <div class="card p-4 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-bold text-slate-900 truncate">${test.title}</div>
            <div class="text-xs text-slate-500 mt-0.5">
              ${cls ? cls.name : '—'} &middot; ${subj ? subj.name : test.subjectId || '—'}
            </div>
          </div>
          ${test.status === 'active'  ? '<span class="badge badge-success flex-shrink-0">Active</span>'  : ''}
          ${test.status === 'draft'   ? '<span class="badge badge-warn flex-shrink-0">Draft</span>'   : ''}
          ${test.status === 'closed'  ? '<span class="badge badge-danger flex-shrink-0">Closed</span>'   : ''}
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${qCount}</div>
            <div class="text-slate-500">Question${qCount !== 1 ? 's' : ''}</div>
          </div>
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${test.duration} min</div>
            <div class="text-slate-500">Duration</div>
          </div>
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${submissions.length}/${classSize}</div>
            <div class="text-slate-500">Submitted</div>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>Due: <strong>${fdate(test.dueDate, { short: true })}</strong></span>
        </div>

        <div class="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
          <button class="btn btn-secondary !py-1.5 text-xs" onclick="tch_viewTestResults('${test.id}')">
            ${icon('results', 'w-3.5 h-3.5')} View Results
          </button>
          ${test.status === 'active' ? `
            <button class="btn btn-secondary !py-1.5 text-xs" onclick="tch_closeTest('${test.id}')">
              ${icon('check', 'w-3.5 h-3.5')} Close Test
            </button>
          ` : ''}
          ${test.status === 'draft' ? `
            <button class="btn btn-primary !py-1.5 text-xs" onclick="tch_publishTest('${test.id}')">
              ${icon('check', 'w-3.5 h-3.5')} Publish
            </button>
          ` : ''}
          <button class="btn btn-ghost !py-1.5 text-xs text-rose-600 ml-auto" onclick="tch_deleteTest('${test.id}')">
            ${icon('trash', 'w-3.5 h-3.5')}
          </button>
        </div>
      </div>
    `;
  }

  const tabDef = [
    { key: 'active', label: 'Active' },
    { key: 'draft',  label: 'Draft'  },
    { key: 'closed', label: 'Closed' }
  ];

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'Quick Tests',
        subtitle: 'Create and manage formative assessments for your classes',
        actions: `<button class="btn btn-primary" onclick="tch_createTestModal()">${icon('plus', 'w-4 h-4')} Create Test</button>`
      })}

      <div class="flex gap-2 flex-wrap">
        ${tabDef.map(t => {
          const count = allTests.filter(x => x.status === t.key).length;
          const isActive = activeTab === t.key;
          return `<button
            class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${isActive ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}"
            onclick="APP.params.ftTab = '${t.key}'; APP.render()">
            ${t.label} <span class="ml-1 opacity-70">${count}</span>
          </button>`;
        }).join('')}
      </div>

      ${tabTests.length === 0
        ? `<div class="pt-6">${emptyState({
            icon: 'book',
            title: `No ${activeTab} tests`,
            body: activeTab === 'active'
              ? 'Create and publish a quick test to get started.'
              : activeTab === 'draft'
              ? 'Tests saved as drafts will appear here.'
              : 'Closed tests are archived here for review.'
          })}</div>`
        : `<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${tabTests.map(testCard).join('')}
           </div>`
      }
    </div>
  `;
}

/* ── Create Test Modal ── */
function tch_createTestModal() {
  const classes  = typeof teacherClasses === 'function' ? teacherClasses() : DB.get('classes');
  const subjects = DB.get('subjects');

  modal({
    title: 'Create Quick Test',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Class *</label>
            <select id="ft_class" class="input">
              <option value="">— Select class —</option>
              ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="input-label">Subject *</label>
            <select id="ft_subject" class="input">
              <option value="">— Select subject —</option>
              ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="input-label">Test Title *</label>
          <input id="ft_title" class="input" placeholder="e.g. Chapter 3 — Motion Quiz" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Duration (minutes)</label>
            <input id="ft_duration" type="number" class="input" value="15" min="1" />
          </div>
          <div>
            <label class="input-label">Due Date *</label>
            <input id="ft_due" type="date" class="input" value="${daysAhead(3)}" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="input-label !mb-0">Questions</label>
            <button type="button" class="text-xs text-brand-700 font-semibold hover:underline" onclick="tch_addQuestion()">
              ${icon('plus', 'w-3.5 h-3.5 inline')} Add Question
            </button>
          </div>
          <div id="ft_questions" class="space-y-3">
            ${tch_questionBlock(0)}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-secondary" onclick="tch_saveTest('draft')">${icon('edit', 'w-4 h-4')} Save as Draft</button>
      <button class="btn btn-primary"   onclick="tch_saveTest('active')">${icon('check', 'w-4 h-4')} Publish</button>
    `
  });
}

function tch_questionBlock(index) {
  return `
    <div class="ft-question border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50" data-index="${index}">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Question ${index + 1}</span>
        <button type="button" class="text-xs text-rose-600 hover:underline" onclick="tch_removeQuestion(this)">Remove</button>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="col-span-2">
          <label class="input-label">Question Text *</label>
          <textarea class="input ft-q-text" rows="2" placeholder="Enter question…"></textarea>
        </div>
        <div>
          <label class="input-label">Type</label>
          <select class="input ft-q-type" onchange="tch_toggleQuestionType(this)">
            <option value="mcq">MCQ</option>
            <option value="short">Short Answer</option>
          </select>
        </div>
      </div>
      <div class="ft-mcq-section space-y-1.5">
        ${['A', 'B', 'C', 'D'].map(letter => `
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500 w-4">${letter}</span>
            <input class="input ft-opt-${letter}" placeholder="Option ${letter}" />
          </div>
        `).join('')}
        <div>
          <label class="input-label">Correct Answer</label>
          <select class="input ft-q-answer">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

function tch_addQuestion() {
  const container = document.getElementById('ft_questions');
  if (!container) return;
  const count = container.querySelectorAll('.ft-question').length;
  const div = document.createElement('div');
  div.innerHTML = tch_questionBlock(count);
  container.appendChild(div.firstElementChild);
}

function tch_removeQuestion(btn) {
  const container = document.getElementById('ft_questions');
  if (!container) return;
  const all = container.querySelectorAll('.ft-question');
  if (all.length <= 1) { toast('A test needs at least one question', 'danger'); return; }
  btn.closest('.ft-question').remove();
  // Re-number
  container.querySelectorAll('.ft-question').forEach((q, i) => {
    const label = q.querySelector('.text-xs.font-semibold');
    if (label) label.textContent = `Question ${i + 1}`;
    q.setAttribute('data-index', i);
  });
}

function tch_toggleQuestionType(sel) {
  const block = sel.closest('.ft-question');
  if (!block) return;
  const mcqSection = block.querySelector('.ft-mcq-section');
  if (mcqSection) mcqSection.style.display = sel.value === 'mcq' ? '' : 'none';
}

/* ── Save Test ── */
function tch_saveTest(status) {
  const classId   = document.getElementById('ft_class').value;
  const subjectId = document.getElementById('ft_subject').value;
  const title     = document.getElementById('ft_title').value.trim();
  const duration  = parseInt(document.getElementById('ft_duration').value) || 15;
  const dueDate   = document.getElementById('ft_due').value;

  if (!classId)  { toast('Please select a class', 'danger'); return; }
  if (!subjectId){ toast('Please select a subject', 'danger'); return; }
  if (!title)    { toast('Test title is required', 'danger'); return; }
  if (!dueDate)  { toast('Please set a due date', 'danger'); return; }

  const questionBlocks = document.querySelectorAll('#ft_questions .ft-question');
  const questions = [];
  let valid = true;

  questionBlocks.forEach((block, i) => {
    const type = block.querySelector('.ft-q-type').value;
    const text = block.querySelector('.ft-q-text').value.trim();
    if (!text) { toast(`Question ${i + 1} text is required`, 'danger'); valid = false; return; }

    const q = { id: uid('fq'), text, type };

    if (type === 'mcq') {
      q.options = {
        A: block.querySelector('.ft-opt-A').value.trim(),
        B: block.querySelector('.ft-opt-B').value.trim(),
        C: block.querySelector('.ft-opt-C').value.trim(),
        D: block.querySelector('.ft-opt-D').value.trim()
      };
      const emptyOpts = Object.entries(q.options).filter(([, v]) => !v);
      if (emptyOpts.length > 0) {
        toast(`Question ${i + 1}: fill in all four MCQ options`, 'danger');
        valid = false;
        return;
      }
      q.answer = block.querySelector('.ft-q-answer').value;
    } else {
      q.options = [];
      q.answer  = '';
    }
    questions.push(q);
  });

  if (!valid) return;
  if (questions.length === 0) { toast('Add at least one question', 'danger'); return; }

  DB.insert('formativeTests', {
    id: uid('ft'),
    schoolId:  AUTH.current.schoolId,
    teacherId: AUTH.current.id,
    classId,
    subjectId,
    title,
    duration,
    dueDate,
    questions,
    status,
    createdAt: now()
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(status === 'active' ? 'Test published!' : 'Test saved as draft', 'success');
}

/* ── Publish / Close / Delete helpers ── */
function tch_publishTest(testId) {
  DB.update('formativeTests', testId, { status: 'active' });
  toast('Test published and visible to students', 'success');
  APP.render();
}

function tch_closeTest(testId) {
  const test = DB.find('formativeTests', testId);
  confirm(`Close "${test.title}"? Students will no longer be able to submit answers.`, () => {
    DB.update('formativeTests', testId, { status: 'closed' });
    toast('Test closed', 'info');
    APP.render();
  }, { yesLabel: 'Close Test', danger: false });
}

function tch_deleteTest(testId) {
  const test = DB.find('formativeTests', testId);
  confirm(`Delete "${test.title}"? This will also remove all student submissions.`, () => {
    DB.query('formativeSubmissions', s => s.testId === testId).forEach(s => DB.remove('formativeSubmissions', s.id));
    DB.remove('formativeTests', testId);
    toast('Test deleted', 'info');
    APP.render();
  }, { yesLabel: 'Delete', danger: true });
}

/* ── View Test Results Modal ── */
function tch_viewTestResults(testId) {
  const test        = DB.find('formativeTests', testId);
  if (!test) { toast('Test not found', 'danger'); return; }
  const submissions = DB.query('formativeSubmissions', s => s.testId === testId);
  const students    = COMPUTE.studentsByClass(test.classId);
  const classes     = DB.get('classes');
  const subjects    = DB.get('subjects');
  const cls         = classes.find(c => c.id === test.classId);
  const subj        = subjects.find(s => s.id === test.subjectId);

  const scores      = submissions.map(s => s.percentage).filter(p => typeof p === 'number');
  const avg         = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const highest     = scores.length ? Math.max(...scores) : null;
  const lowest      = scores.length ? Math.min(...scores) : null;

  function scoreBg(pct) {
    if (pct >= 75) return 'text-emerald-700 font-bold';
    if (pct >= 50) return 'text-amber-700 font-bold';
    return 'text-rose-700 font-bold';
  }

  function gradeLabel(pct) {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }

  modal({
    title: `Results — ${test.title}`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="text-xs text-slate-500">${cls ? cls.name : '—'} &middot; ${subj ? subj.name : '—'} &middot; ${(test.questions || []).length} questions &middot; due ${fdate(test.dueDate, { short: true })}</div>

        ${submissions.length > 0 ? `
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-50 rounded-xl p-3 text-center">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Avg Score</div>
              <div class="text-2xl font-extrabold ${scoreBg(avg)}">${avg}%</div>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3 text-center">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Highest</div>
              <div class="text-2xl font-extrabold text-emerald-700">${highest}%</div>
            </div>
            <div class="bg-rose-50 rounded-xl p-3 text-center">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Lowest</div>
              <div class="text-2xl font-extrabold text-rose-700">${lowest}%</div>
            </div>
          </div>
        ` : ''}

        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th class="px-4 py-2.5 text-left font-semibold">Student</th>
                <th class="px-4 py-2.5 text-center font-semibold">Score</th>
                <th class="px-4 py-2.5 text-center font-semibold">Percentage</th>
                <th class="px-4 py-2.5 text-center font-semibold">Grade</th>
                <th class="px-4 py-2.5 text-right font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${students.map(student => {
                const sub = submissions.find(s => s.studentId === student.id);
                if (sub) {
                  return `<tr>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        ${avatar(student, 'sm')}
                        <span class="font-medium">${student.name}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center font-mono">${sub.score}/${sub.total}</td>
                    <td class="px-4 py-3 text-center"><span class="${scoreBg(sub.percentage)}">${sub.percentage}%</span></td>
                    <td class="px-4 py-3 text-center"><span class="badge ${sub.percentage >= 75 ? 'badge-success' : sub.percentage >= 50 ? 'badge-warn' : 'badge-danger'}">${gradeLabel(sub.percentage)}</span></td>
                    <td class="px-4 py-3 text-right text-slate-500 text-xs">${fdate(sub.submittedAt, { relative: true })}</td>
                  </tr>`;
                } else {
                  return `<tr class="opacity-60">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        ${avatar(student, 'sm')}
                        <span class="font-medium">${student.name}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center text-slate-400">—</td>
                    <td class="px-4 py-3 text-center text-slate-400">—</td>
                    <td class="px-4 py-3 text-center"><span class="badge badge-info">Pending</span></td>
                    <td class="px-4 py-3 text-right text-slate-400 text-xs">Not submitted</td>
                  </tr>`;
                }
              }).join('')}
            </tbody>
          </table>
          ${students.length === 0 ? `<div class="p-6">${emptyState({ icon: 'students', title: 'No students in this class', body: 'Add students to this class to see results.' })}</div>` : ''}
        </div>

        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> &ge;75% Excellent</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 50–74% Good</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> &lt;50% Needs improvement</span>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}


/* ─────────────────────────────────────────────────────────────
   STUDENT VIEWS
   ───────────────────────────────────────────────────────────── */

function view_stu_formative(params) {
  const studentId = AUTH.current.id;
  const student   = DB.find('students', studentId);
  if (!student) return `<p class="text-rose-600 p-4">Student profile not found.</p>`;

  const classId   = student.classId;
  const schoolId  = AUTH.current.schoolId;
  const activeTab = APP.params.stuFtTab || 'pending';

  const todayStr  = today();

  // All active tests for the student's class
  const allTests  = DB.query('formativeTests', t =>
    t.schoolId === schoolId &&
    t.classId  === classId
  );

  const submittedTestIds = new Set(
    DB.query('formativeSubmissions', s => s.studentId === studentId).map(s => s.testId)
  );

  const pendingTests   = allTests.filter(t => t.status === 'active' && !submittedTestIds.has(t.id) && t.dueDate >= todayStr);
  const overdueTests   = allTests.filter(t => t.status === 'active' && !submittedTestIds.has(t.id) && t.dueDate < todayStr);
  const completedTests = allTests.filter(t => submittedTestIds.has(t.id));

  const classes  = DB.get('classes');
  const subjects = DB.get('subjects');

  function pendingCard(test) {
    const cls  = classes.find(c => c.id === test.classId);
    const subj = subjects.find(s => s.id === test.subjectId);
    return `
      <div class="card p-4 flex flex-col gap-3">
        <div>
          <div class="font-bold text-slate-900">${test.title}</div>
          <div class="text-xs text-slate-500 mt-0.5">${cls ? cls.name : '—'} &middot; ${subj ? subj.name : '—'}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-center">
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${(test.questions || []).length}</div>
            <div class="text-slate-500">Questions</div>
          </div>
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${test.duration} min</div>
            <div class="text-slate-500">Duration</div>
          </div>
        </div>
        <div class="text-xs text-slate-500 flex items-center gap-1">
          ${icon('calendar', 'w-3.5 h-3.5')} Due: <strong>${fdate(test.dueDate, { short: true })}</strong>
        </div>
        <button class="btn btn-primary w-full" onclick="stu_startTest('${test.id}')">
          ${icon('book', 'w-4 h-4')} Start Test
        </button>
      </div>
    `;
  }

  function completedCard(test) {
    const subj = subjects.find(s => s.id === test.subjectId);
    const sub  = DB.query('formativeSubmissions', s => s.testId === test.id && s.studentId === studentId)[0];
    if (!sub) return '';
    return `
      <div class="card p-4 flex flex-col gap-3">
        <div>
          <div class="font-bold text-slate-900">${test.title}</div>
          <div class="text-xs text-slate-500 mt-0.5">${subj ? subj.name : '—'}</div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs text-center">
          <div class="bg-emerald-50 rounded-xl py-2">
            <div class="font-bold text-emerald-700">${sub.score}/${sub.total}</div>
            <div class="text-slate-500">Score</div>
          </div>
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold ${sub.percentage >= 75 ? 'text-emerald-700' : sub.percentage >= 50 ? 'text-amber-700' : 'text-rose-700'}">${sub.percentage}%</div>
            <div class="text-slate-500">Percentage</div>
          </div>
          <div class="bg-slate-50 rounded-xl py-2">
            <div class="font-bold text-slate-900">${sub.percentage >= 75 ? 'Excellent' : sub.percentage >= 50 ? 'Good' : 'Below Pass'}</div>
            <div class="text-slate-500">Result</div>
          </div>
        </div>
        <div class="text-xs text-slate-500">${icon('check', 'w-3.5 h-3.5 inline')} Submitted ${fdate(sub.submittedAt, { relative: true })}</div>
        <button class="btn btn-secondary w-full" onclick="stu_viewMyResult('${test.id}')">
          ${icon('results', 'w-4 h-4')} View My Answers
        </button>
      </div>
    `;
  }

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'Quick Tests',
        subtitle: 'Your formative assessments'
      })}

      <div class="flex gap-2 flex-wrap">
        ${[{ key: 'pending', label: 'Pending', count: pendingTests.length + overdueTests.length }, { key: 'completed', label: 'Completed', count: completedTests.length }].map(t => {
          const isActive = activeTab === t.key;
          return `<button
            class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${isActive ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}"
            onclick="APP.params.stuFtTab = '${t.key}'; APP.render()">
            ${t.label} <span class="ml-1 opacity-70">${t.count}</span>
          </button>`;
        }).join('')}
      </div>

      ${activeTab === 'pending' ? (
        (pendingTests.length === 0 && overdueTests.length === 0)
          ? `<div class="pt-6">${emptyState({ icon: 'check', title: 'All caught up!', body: 'No pending tests right now. Check back later.' })}</div>`
          : `
            ${overdueTests.length > 0 ? `
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-sm font-semibold text-rose-700">
                  ${icon('bell', 'w-4 h-4')} Overdue Tests (${overdueTests.length})
                </div>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  ${overdueTests.map(test => {
                    const cls  = classes.find(c => c.id === test.classId);
                    const subj = subjects.find(s => s.id === test.subjectId);
                    return `
                      <div class="card p-4 flex flex-col gap-3 border-rose-300 bg-rose-50">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <div class="font-bold text-slate-900">${test.title}</div>
                            <div class="text-xs text-slate-500 mt-0.5">${cls ? cls.name : '—'} &middot; ${subj ? subj.name : '—'}</div>
                          </div>
                          <span class="badge badge-danger flex-shrink-0">Overdue</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs text-center">
                          <div class="bg-white rounded-xl py-2">
                            <div class="font-bold text-slate-900">${(test.questions || []).length}</div>
                            <div class="text-slate-500">Questions</div>
                          </div>
                          <div class="bg-white rounded-xl py-2">
                            <div class="font-bold text-slate-900">${test.duration} min</div>
                            <div class="text-slate-500">Duration</div>
                          </div>
                        </div>
                        <div class="text-xs text-rose-700 flex items-center gap-1">
                          ${icon('calendar', 'w-3.5 h-3.5')} Was due: <strong>${fdate(test.dueDate, { short: true })}</strong>
                        </div>
                        <button class="btn btn-secondary w-full border-rose-300 text-rose-700" onclick="stu_startTest('${test.id}')">
                          ${icon('book', 'w-4 h-4')} Start Test
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
            ${pendingTests.length > 0 ? `
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">${pendingTests.map(pendingCard).join('')}</div>
            ` : ''}
          `
      ) : (
        completedTests.length === 0
          ? `<div class="pt-6">${emptyState({ icon: 'results', title: 'No completed tests yet', body: 'Your submitted tests and scores will appear here.' })}</div>`
          : `<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">${completedTests.map(completedCard).join('')}</div>`
      )}
    </div>
  `;
}

/* ── Start Test Modal ── */
function stu_startTest(testId) {
  const test = DB.find('formativeTests', testId);
  if (!test) { toast('Test not found', 'danger'); return; }

  // Check already submitted
  const studentId = AUTH.current.id;
  const existing  = DB.query('formativeSubmissions', s => s.testId === testId && s.studentId === studentId)[0];
  if (existing) { toast('You have already submitted this test', 'info'); stu_viewMyResult(testId); return; }

  const subjects = DB.get('subjects');
  const subj     = subjects.find(s => s.id === test.subjectId);

  function renderQuestion(q, idx) {
    if (q.type === 'mcq') {
      const rawOpts = q.options || {};
      // Support both object {A:..., B:..., C:..., D:...} and legacy array [a, b, c, d] formats
      const optsObj = Array.isArray(rawOpts)
        ? { A: rawOpts[0] || '', B: rawOpts[1] || '', C: rawOpts[2] || '', D: rawOpts[3] || '' }
        : rawOpts;
      return `
        <div class="ft-q-block border border-slate-200 rounded-xl p-4 space-y-3 bg-white" data-qid="${q.id}" data-type="mcq">
          <div class="font-semibold text-slate-900">${idx + 1}. ${q.text}</div>
          <div class="grid grid-cols-2 gap-2">
            ${['A', 'B', 'C', 'D'].map(letter => {
              const optText = optsObj[letter] || '';
              if (!optText) return '';
              return `
                <label class="ft-option-pill flex items-center gap-2 border border-slate-200 rounded-xl p-2.5 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                  <input type="radio" name="ft_q_${q.id}" value="${letter}" class="w-4 h-4 accent-brand-600" />
                  <span class="text-xs font-bold text-slate-500 w-4">${letter}</span>
                  <span class="text-sm text-slate-800 flex-1">${optText}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="ft-q-block border border-slate-200 rounded-xl p-4 space-y-2 bg-white" data-qid="${q.id}" data-type="short">
          <div class="font-semibold text-slate-900">${idx + 1}. ${q.text}</div>
          <textarea class="input ft-short-ans" rows="3" placeholder="Write your answer here…"></textarea>
        </div>
      `;
    }
  }

  modal({
    title: `${test.title} — ${test.duration} minutes`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-start gap-3 bg-amber-50 rounded-xl p-3 text-sm text-amber-900">
          ${icon('bell', 'w-4 h-4 flex-shrink-0 mt-0.5')}
          <span>Once you submit your answers, you cannot change them. Read each question carefully before submitting.</span>
        </div>
        <div class="text-xs text-slate-500">${subj ? subj.name : '—'} &middot; ${(test.questions || []).length} questions &middot; ${test.duration} min</div>
        <div id="ft_stu_questions" class="space-y-3">
          ${(test.questions || []).map((q, i) => renderQuestion(q, i)).join('')}
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary"   onclick="stu_submitTest('${testId}')">${icon('check', 'w-4 h-4')} Submit Test</button>
    `
  });
}

/* ── Submit Test ── */
function stu_submitTest(testId) {
  const test      = DB.find('formativeTests', testId);
  if (!test) return;
  const studentId = AUTH.current.id;
  const questions = test.questions || [];

  const answers = {};
  const container = document.getElementById('ft_stu_questions');
  if (!container) return;

  const qBlocks = container.querySelectorAll('.ft-q-block');
  let unanswered = 0;

  qBlocks.forEach(block => {
    const qid  = block.getAttribute('data-qid');
    const type = block.getAttribute('data-type');
    if (type === 'mcq') {
      const checked = block.querySelector(`input[name="ft_q_${qid}"]:checked`);
      if (checked) {
        answers[qid] = checked.value;
      } else {
        unanswered++;
      }
    } else {
      const ta = block.querySelector('.ft-short-ans');
      answers[qid] = ta ? ta.value.trim() : '';
      if (!answers[qid]) unanswered++;
    }
  });

  if (unanswered > 0) {
    const proceed = window._ftIgnoreUnanswered;
    if (!proceed) {
      // Show a confirm if there are unanswered questions
      confirm(`${unanswered} question${unanswered > 1 ? 's are' : ' is'} unanswered. Submit anyway?`, () => {
        window._ftIgnoreUnanswered = true;
        stu_submitTest(testId);
        window._ftIgnoreUnanswered = false;
      }, { yesLabel: 'Submit anyway' });
      return;
    }
  }

  // Score calculation
  let score = 0;
  let total = questions.length;

  questions.forEach(q => {
    if (q.type === 'mcq') {
      const studentAns = (answers[q.id] || '').toLowerCase().trim();
      const correctAns = (q.answer || '').toLowerCase().trim();
      if (studentAns && studentAns === correctAns) score++;
    } else {
      // Short answer: auto-award 1 point (teacher reviews manually)
      if (answers[q.id] && answers[q.id].trim()) score++;
    }
  });

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  DB.insert('formativeSubmissions', {
    id: uid('fsub'),
    testId,
    studentId,
    schoolId:    AUTH.current.schoolId,
    answers,
    score,
    total,
    percentage,
    submittedAt: now()
  });

  // Close the test modal
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop) backdrop.click();

  // Show score result modal after a brief delay so the previous modal closes cleanly
  setTimeout(() => {
    stu_showScoreModal(testId, score, total, percentage);
  }, 300);
}

function stu_showScoreModal(testId, score, total, percentage) {
  const test = DB.find('formativeTests', testId);
  const colorClass  = percentage >= 75 ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : percentage >= 50 ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800';
  const scoreColor  = percentage >= 75 ? 'text-emerald-700'
                    : percentage >= 50 ? 'text-amber-700'
                    : 'text-rose-700';
  const message     = percentage >= 75 ? 'Great job! Keep it up.'
                    : percentage >= 50 ? 'Good effort. Review the topics you missed.'
                    : 'Keep practising — you will do better next time!';

  modal({
    title: 'Test Submitted',
    body: `
      <div class="space-y-4 text-center">
        <div class="border rounded-2xl p-6 ${colorClass}">
          <div class="text-xs uppercase font-semibold tracking-wide mb-1 opacity-70">${test ? test.title : 'Your Score'}</div>
          <div class="text-6xl font-extrabold ${scoreColor}">${percentage}%</div>
          <div class="text-lg font-semibold mt-2">${score} / ${total} correct</div>
        </div>
        <p class="text-sm text-slate-600">${message}</p>
        <p class="text-xs text-slate-400">Your answers have been saved. Your teacher can view your results.</p>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.params.stuFtTab = 'completed'; APP.render()">Back to Tests</button>
      <button class="btn btn-primary"   onclick="document.getElementById('modalBackdrop').click(); APP.params.stuFtTab = 'completed'; APP.render(); setTimeout(() => stu_viewMyResult('${testId}'), 300)">${icon('results', 'w-4 h-4')} View My Answers</button>
    `
  });
}

/* ── View My Result Modal ── */
function stu_viewMyResult(testId) {
  const test      = DB.find('formativeTests', testId);
  if (!test) { toast('Test not found', 'danger'); return; }
  const studentId = AUTH.current.id;
  const sub       = DB.query('formativeSubmissions', s => s.testId === testId && s.studentId === studentId)[0];
  if (!sub) { toast('No submission found for this test', 'danger'); return; }

  const questions = test.questions || [];
  const answers   = sub.answers || {};

  const subjects  = DB.get('subjects');
  const subj      = subjects.find(s => s.id === test.subjectId);
  const scoreColor = sub.percentage >= 75 ? 'text-emerald-700' : sub.percentage >= 50 ? 'text-amber-700' : 'text-rose-700';

  function reviewQuestion(q, idx) {
    const studentAns = answers[q.id];
    if (q.type === 'mcq') {
      const rawOpts = q.options || {};
      const opts = Array.isArray(rawOpts)
        ? { A: rawOpts[0] || '', B: rawOpts[1] || '', C: rawOpts[2] || '', D: rawOpts[3] || '' }
        : rawOpts;
      const isCorrect = (studentAns || '').toLowerCase().trim() === (q.answer || '').toLowerCase().trim();
      const studentOptText = studentAns ? (opts[studentAns] || studentAns) : '(no answer)';
      const correctOptText = opts[q.answer] || q.answer;
      return `
        <div class="border rounded-xl p-3 space-y-2 ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}">
          <div class="flex items-start gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}">
              ${isCorrect ? icon('check', 'w-3 h-3') : '&times;'}
            </span>
            <div class="flex-1">
              <div class="font-semibold text-sm text-slate-900">${idx + 1}. ${q.text}</div>
            </div>
          </div>
          <div class="pl-7 space-y-1 text-sm">
            <div>Your answer: <strong class="${isCorrect ? 'text-emerald-700' : 'text-rose-700'}">${studentAns ? studentAns + ' — ' + studentOptText : '(not answered)'}</strong></div>
            ${!isCorrect ? `<div>Correct answer: <strong class="text-emerald-700">${q.answer} — ${correctOptText}</strong></div>` : ''}
          </div>
        </div>
      `;
    } else {
      const hasAnswer = studentAns && studentAns.trim();
      return `
        <div class="border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
          <div class="font-semibold text-sm text-slate-900">${idx + 1}. ${q.text}</div>
          <div class="pl-2 space-y-1 text-sm">
            <div class="text-xs text-slate-500 font-semibold uppercase">Your Answer</div>
            <div class="bg-slate-50 rounded-lg p-2 text-slate-800 min-h-[2rem]">${hasAnswer ? studentAns : '<span class="text-slate-400 italic">(not answered)</span>'}</div>
            <div class="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1">
              ${icon('bell', 'w-3.5 h-3.5')} Reviewed by teacher &middot; 1/1 (pending review)
            </div>
          </div>
        </div>
      `;
    }
  }

  modal({
    title: `My Answers — ${test.title}`,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2 bg-slate-50 rounded-xl p-3">
          <div>
            <div class="text-xs text-slate-500">${subj ? subj.name : '—'} &middot; submitted ${fdate(sub.submittedAt, { relative: true })}</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500">Your Score</div>
            <div class="text-2xl font-extrabold ${scoreColor}">${sub.percentage}% <span class="text-base font-semibold">(${sub.score}/${sub.total})</span></div>
          </div>
        </div>

        <div class="space-y-3">
          ${questions.map((q, i) => reviewQuestion(q, i)).join('')}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}
