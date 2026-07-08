/* ============================================================
   FEEDBACK MODULE
   - Parent: view active surveys, submit responses
   - Admin / Principal: create surveys, view aggregated results
   ============================================================ */

/* ---------- Helper: render one question's answer input ---------- */
function fb_questionInput(q, idx) {
  if (q.type === 'star') {
    return `
      <div class="fb-star-group flex items-center gap-1" id="star_group_${q.id}">
        ${[1, 2, 3, 4, 5].map(n => `
          <button type="button"
            class="fb-star text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
            data-qid="${q.id}" data-val="${n}"
            onclick="fb_setStar('${q.id}', ${n})"
            aria-label="${n} star${n !== 1 ? 's' : ''}"
          >☆</button>
        `).join('')}
        <input type="hidden" id="ans_${q.id}" value="" />
        <span id="star_label_${q.id}" class="ml-2 text-sm text-slate-400"></span>
      </div>
    `;
  }

  if (q.type === 'yesno') {
    return `
      <div class="flex gap-3" id="yesno_group_${q.id}">
        <button type="button" id="yesno_yes_${q.id}"
          class="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50"
          onclick="fb_setYesNo('${q.id}', 'yes')"
        >Yes</button>
        <button type="button" id="yesno_no_${q.id}"
          class="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:bg-rose-50"
          onclick="fb_setYesNo('${q.id}', 'no')"
        >No</button>
        <input type="hidden" id="ans_${q.id}" value="" />
      </div>
    `;
  }

  // default: text
  return `
    <textarea
      id="ans_${q.id}"
      rows="3"
      class="input w-full"
      placeholder="Your answer…"
    ></textarea>
  `;
}

/* ---------- Star interaction helpers (called from inline onclick) ---------- */
function fb_setStar(qid, val) {
  const group = document.getElementById('star_group_' + qid);
  if (!group) return;
  document.getElementById('ans_' + qid).value = val;
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const labelEl = document.getElementById('star_label_' + qid);
  if (labelEl) { labelEl.textContent = labels[val] || ''; labelEl.className = 'ml-2 text-sm font-semibold text-amber-600'; }
  group.querySelectorAll('.fb-star').forEach(btn => {
    const n = parseInt(btn.dataset.val);
    btn.textContent = n <= val ? '★' : '☆';
    btn.style.color = n <= val ? '#f59e0b' : '#94a3b8';
  });
}

function fb_setYesNo(qid, val) {
  document.getElementById('ans_' + qid).value = val;
  const yesBtn = document.getElementById('yesno_yes_' + qid);
  const noBtn  = document.getElementById('yesno_no_'  + qid);
  if (yesBtn && noBtn) {
    yesBtn.className = val === 'yes'
      ? 'px-6 py-2.5 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800 transition'
      : 'px-6 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50';
    noBtn.className = val === 'no'
      ? 'px-6 py-2.5 rounded-xl bg-rose-50 text-sm font-semibold text-rose-800 transition'
      : 'px-6 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:bg-rose-50';
  }
}

/* ============================================================
   PARENT VIEW
   ============================================================ */
function view_par_feedback(params) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const forms = DB.query('feedbackForms', f => f.schoolId === schoolId && f.status === 'active');

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'School Surveys & Feedback',
        subtitle: 'Share your views to help us improve'
      })}

      ${forms.length === 0
        ? emptyState({ icon: 'chat', title: 'No active surveys right now', body: 'Check back soon — the school will post surveys here for parents to complete.' })
        : `<div class="space-y-3">
            ${forms.map(form => {
              const myResponse = DB.query('feedbackResponses', r => r.formId === form.id && r.parentId === AUTH.current.id && r.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))[0];
              const qCount = (form.questions || []).length;
              return `
                <div class="card p-5">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-slate-900 text-base">${form.title}</h3>
                      <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span class="text-xs text-slate-500">${qCount} question${qCount !== 1 ? 's' : ''}</span>
                        ${form.deadline ? `<span class="text-xs text-amber-700 font-semibold">Due: ${fdate(form.deadline, { long: true })}</span>` : ''}
                      </div>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                      ${myResponse
                        ? `<span class="badge badge-success">${icon('check', 'w-3 h-3')} Submitted</span>
                           <span class="text-xs text-slate-400">${fdate(myResponse.submittedAt, { short: true })}</span>`
                        : `<button class="btn btn-primary" onclick="par_openFeedbackForm('${form.id}')">
                             ${icon('chat', 'w-4 h-4')} Fill Out
                           </button>`
                      }
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
      }
    </div>
  `;
}

/* ---------- Open form modal for parent to fill ---------- */
function par_openFeedbackForm(formId) {
  const form = DB.find('feedbackForms', formId);
  if (!form) { toast('Survey not found', 'danger'); return; }

  const questions = form.questions || [];

  modal({
    title: form.title,
    size: 'lg',
    body: `
      <div class="space-y-6" id="fb_form_body">
        ${questions.map((q, idx) => `
          <div class="space-y-2">
            <label class="block font-semibold text-slate-800 text-sm">
              ${idx + 1}. ${q.text}
            </label>
            ${fb_questionInput(q, idx)}
          </div>
        `).join('')}
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="par_submitFeedback('${formId}')">${icon('send', 'w-4 h-4')} Submit</button>
    `
  });
}

/* ---------- Submit feedback ---------- */
function par_submitFeedback(formId) {
  const form = DB.find('feedbackForms', formId);
  if (!form) return;

  if (form.deadline && new Date(form.deadline) < new Date()) {
    toast('This survey has closed — deadline has passed', 'warn');
    return;
  }

  const questions = form.questions || [];
  const answers = {};
  const unanswered = [];

  questions.forEach(q => {
    const el = document.getElementById('ans_' + q.id);
    const val = el ? el.value.trim() : '';
    if (!val) {
      unanswered.push(q.id);
    } else {
      answers[q.id] = q.type === 'star' ? parseInt(val) : val;
    }
  });

  if (unanswered.length > 0) {
    toast(`Please answer all ${unanswered.length} unanswered question${unanswered.length !== 1 ? 's' : ''} before submitting.`, 'danger');
    return;
  }

  DB.insert('feedbackResponses', {
    id:          uid('fr'),
    formId,
    schoolId:    AUTH.current.schoolId || 'sch_brightlights',
    parentId:    AUTH.current.id,
    answers,
    submittedAt: now()
  });

  document.getElementById('modalBackdrop').click();
  toast('Thank you — your feedback has been submitted.', 'success');
  APP.render();
}

/* ============================================================
   ADMIN VIEW
   ============================================================ */
function view_adm_feedback(params) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const tab = (params && params.fbTab) || APP.params.fbTab || 'active';

  const allForms = DB.query('feedbackForms', f => f.schoolId === schoolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const activeForms = allForms.filter(f => f.status === 'active');
  const closedForms = allForms.filter(f => f.status === 'closed');
  const displayed   = tab === 'closed' ? closedForms : activeForms;

  return `
    <div class="space-y-5">
      ${pageHeader({
        title: 'School Feedback & Surveys',
        subtitle: 'Create parent surveys and review aggregated results',
        actions: `<button class="btn btn-primary" onclick="adm_createSurveyModal()">${icon('plus', 'w-4 h-4')} Create Survey</button>`
      })}

      ${tabs(
        [
          { key: 'active', label: 'Active', badge: activeForms.length },
          { key: 'closed', label: 'Closed', badge: closedForms.length }
        ],
        tab,
        k => { APP.params.fbTab = k; APP.render(); }
      )}

      <div class="space-y-3 pt-1">
        ${displayed.length === 0
          ? emptyState({ icon: 'chat', title: `No ${tab} surveys`, body: tab === 'active' ? 'Create a survey to collect parent feedback.' : 'Closed surveys will appear here.' })
          : displayed.map(form => {
              const qCount    = (form.questions || []).length;
              const responses = DB.query('feedbackResponses', r => r.formId === form.id && r.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
              return `
                <div class="card p-5">
                  <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <h3 class="font-bold text-slate-900">${form.title}</h3>
                        <span class="badge ${form.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                          ${form.status === 'active' ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                        <span>${qCount} question${qCount !== 1 ? 's' : ''}</span>
                        <span><strong class="text-slate-800">${responses.length}</strong> response${responses.length !== 1 ? 's' : ''}</span>
                        ${form.deadline ? `<span>Deadline: ${fdate(form.deadline, { long: true })}</span>` : ''}
                        <span>Created ${fdate(form.createdAt, { short: true })}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <button class="btn btn-secondary" onclick="adm_viewFeedbackResults('${form.id}')">
                        ${icon('reports', 'w-4 h-4')} View Results (${responses.length})
                      </button>
                      ${form.status === 'active' ? `
                        <button class="btn btn-danger" onclick="adm_closeSurvey('${form.id}')">
                          ${icon('x', 'w-4 h-4')} Close Survey
                        </button>
                      ` : ''}
                      <button class="btn btn-ghost !p-1.5 text-rose-600" title="Delete survey" onclick="adm_deleteSurvey('${form.id}')">${icon('trash', 'w-4 h-4')}</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>
    </div>
  `;
}

/* ---------- Create survey modal ---------- */
function adm_createSurveyModal() {
  _svQCount = 0;
  modal({
    title: 'Create New Survey',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div>
          <label class="input-label">Survey Title *</label>
          <input id="sv_title" class="input" placeholder="e.g. End of Term Parent Survey 2025/26" />
        </div>
        <div>
          <label class="input-label">Deadline (optional)</label>
          <input id="sv_deadline" type="date" class="input max-w-xs" value="${daysAhead(21)}" />
        </div>

        <!-- Dynamic question builder -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="input-label mb-0">Questions *</label>
            <button type="button" class="btn btn-secondary text-xs" onclick="adm_addQuestionRow()">
              ${icon('plus', 'w-3.5 h-3.5')} Add Question
            </button>
          </div>
          <div id="sv_questions" class="space-y-2">
            <!-- Seed with one empty row -->
          </div>
        </div>

        <div class="bg-brand-50 rounded-xl p-3 text-xs text-brand-900">
          ${icon('info', 'w-4 h-4 inline mr-1')} Choose: <strong>Star</strong> (1–5 rating), <strong>Yes / No</strong> (binary), or <strong>Text</strong> (open response).
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="adm_saveSurvey()">${icon('check', 'w-4 h-4')} Save Survey</button>
    `
  });

  // Add first question row after modal renders
  setTimeout(() => adm_addQuestionRow(), 0);
}

let _svQCount = 0;
function adm_addQuestionRow() {
  _svQCount++;
  const container = document.getElementById('sv_questions');
  if (!container) return;
  const rowId = 'sv_q_' + _svQCount;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl';
  row.innerHTML = `
    <div class="flex-shrink-0 w-6 h-6 mt-1 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold">
      ${container.children.length + 1}
    </div>
    <div class="flex-1 grid grid-cols-3 gap-2">
      <div class="col-span-2">
        <input class="input" placeholder="Question text…" id="${rowId}_text" />
      </div>
      <div>
        <select class="input" id="${rowId}_type">
          <option value="star">Star (1–5)</option>
          <option value="yesno">Yes / No</option>
          <option value="text">Text</option>
        </select>
      </div>
    </div>
    <button type="button" class="btn btn-ghost !p-1.5 text-rose-500 mt-0.5 flex-shrink-0" onclick="document.getElementById('${rowId}').remove(); adm_renumberQuestions()">
      ${icon('trash', 'w-4 h-4')}
    </button>
  `;
  container.appendChild(row);
}

function adm_renumberQuestions() {
  const container = document.getElementById('sv_questions');
  if (!container) return;
  Array.from(container.children).forEach((row, idx) => {
    const numEl = row.querySelector('.rounded-full');
    if (numEl) numEl.textContent = idx + 1;
  });
}

/* ---------- Save survey ---------- */
function adm_saveSurvey() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const title    = document.getElementById('sv_title').value.trim();
  if (!title) { toast('Survey title is required', 'danger'); return; }

  const container = document.getElementById('sv_questions');
  const rows = container ? Array.from(container.children) : [];
  if (rows.length === 0) { toast('Add at least one question', 'danger'); return; }

  const questions = [];
  let valid = true;
  rows.forEach((row, idx) => {
    const textEl = row.querySelector('input[id$="_text"]');
    const typeEl = row.querySelector('select');
    const text   = textEl ? textEl.value.trim() : '';
    const type   = typeEl ? typeEl.value : 'text';
    if (!text) { toast(`Question ${idx + 1} has no text`, 'danger'); valid = false; return; }
    questions.push({ id: uid('q'), type, text });
  });
  if (!valid) return;

  const deadlineEl = document.getElementById('sv_deadline');
  const deadline   = deadlineEl ? deadlineEl.value : '';

  _svQCount = 0; // reset counter for next modal open
  DB.insert('feedbackForms', {
    id:        uid('ff'),
    schoolId,
    title,
    questions,
    deadline:  deadline || null,
    status:    'active',
    createdBy: AUTH.current.id,
    createdAt: now()
  });

  // Notify all school parents about the new survey
  const parents = DB.query('parents', p => p.schoolId === schoolId);
  parents.forEach(p => DB.insert('notifications', {
    id: uid('not'), userId: p.id,
    title: 'New Feedback Survey',
    body: 'The school has published a new survey: ' + title + '. Please respond at your earliest convenience.',
    type: 'info', read: false, timestamp: now()
  }));

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Survey created and published to parents', 'success');
}

/* ---------- Close survey ---------- */
function adm_closeSurvey(formId) {
  const form = DB.find('feedbackForms', formId);
  if (!form) { toast('Survey not found', 'danger'); return; }
  confirm(`Close "${form.title}"? Parents will no longer be able to submit new responses.`, () => {
    DB.update('feedbackForms', formId, { status: 'closed' });
    APP.render();
    toast('Survey closed', 'info');
  }, { yesLabel: 'Close Survey' });
}

/* ---------- Delete survey ---------- */
function adm_deleteSurvey(formId) {
  const form = DB.find('feedbackForms', formId);
  if (!form) { toast('Survey not found', 'danger'); return; }
  const rCount = DB.query('feedbackResponses', r => r.formId === formId && r.schoolId === (AUTH.current.schoolId || 'sch_brightlights')).length;
  confirm(`Delete "${form.title}"?${rCount ? ` This will also remove ${rCount} response${rCount !== 1 ? 's' : ''}.` : ''} This cannot be undone.`, () => {
    DB.remove('feedbackForms', formId);
    DB.query('feedbackResponses', r => r.formId === formId && r.schoolId === (AUTH.current.schoolId || 'sch_brightlights')).forEach(r => DB.remove('feedbackResponses', r.id));
    APP.render();
    toast('Survey deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

/* ---------- View aggregated results ---------- */
function adm_viewFeedbackResults(formId) {
  const form = DB.find('feedbackForms', formId);
  if (!form) { toast('Survey not found', 'danger'); return; }

  const responses = DB.query('feedbackResponses', r => r.formId === formId && r.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const questions  = form.questions || [];
  const total      = responses.length;

  const resultsHtml = questions.map(q => {
    const vals = responses.map(r => r.answers[q.id]).filter(v => v !== undefined && v !== null && v !== '');

    if (q.type === 'star') {
      const nums    = vals.map(v => parseInt(v) || 0).filter(v => v > 0);
      const avg     = nums.length ? (nums.reduce((s, n) => s + n, 0) / nums.length) : 0;
      const rounded = Math.round(avg * 10) / 10;
      // Distribution: count per star 1-5
      const dist = [1, 2, 3, 4, 5].map(s => ({ star: s, count: nums.filter(n => n === s).length }));
      const maxCount = Math.max(...dist.map(d => d.count), 1);
      return `
        <div class="p-4 bg-slate-50 rounded-xl">
          <div class="font-semibold text-sm text-slate-800 mb-3">${q.text}</div>
          <div class="flex items-center gap-3 mb-3">
            <div class="text-3xl font-extrabold text-amber-500">${rounded}</div>
            <div>
              <div class="flex gap-0.5">${[1,2,3,4,5].map(s => `<span class="text-lg ${s <= Math.round(avg) ? 'text-amber-500' : 'text-slate-300'}">${s <= Math.round(avg) ? '★' : '☆'}</span>`).join('')}</div>
              <div class="text-xs text-slate-500">out of 5 · ${nums.length} response${nums.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div class="space-y-1.5">
            ${dist.map(d => `
              <div class="flex items-center gap-2 text-xs">
                <span class="w-12 text-slate-600">${d.star} star${d.star !== 1 ? 's' : ''}</span>
                <div class="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div class="h-full bg-amber-400 rounded-full transition-all" style="width: ${maxCount ? Math.round((d.count / maxCount) * 100) : 0}%"></div>
                </div>
                <span class="w-6 text-right text-slate-600 font-semibold">${d.count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (q.type === 'yesno') {
      const yesCount = vals.filter(v => v === 'yes').length;
      const noCount  = vals.filter(v => v === 'no').length;
      const answered = yesCount + noCount;
      const yesPct   = answered ? Math.round((yesCount / answered) * 100) : 0;
      const noPct    = answered ? Math.round((noCount  / answered) * 100) : 0;
      return `
        <div class="p-4 bg-slate-50 rounded-xl">
          <div class="font-semibold text-sm text-slate-800 mb-3">${q.text}</div>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-emerald-50 rounded-xl p-3">
              <div class="text-2xl font-extrabold text-emerald-700">${yesCount}</div>
              <div class="text-xs text-emerald-600">Yes · ${yesPct}%</div>
            </div>
            <div class="bg-rose-50 rounded-xl p-3">
              <div class="text-2xl font-extrabold text-rose-700">${noCount}</div>
              <div class="text-xs text-rose-600">No · ${noPct}%</div>
            </div>
          </div>
          ${answered > 0 ? `
            <div class="mt-3 h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div class="h-full bg-emerald-400 transition-all" style="width:${yesPct}%"></div>
              <div class="h-full bg-rose-400 transition-all" style="width:${noPct}%"></div>
            </div>
          ` : ''}
          <p class="text-xs text-slate-400 mt-1.5 text-right">${answered} answered</p>
        </div>
      `;
    }

    // text type
    return `
      <div class="p-4 bg-slate-50 rounded-xl">
        <div class="font-semibold text-sm text-slate-800 mb-3">${q.text}</div>
        ${vals.length === 0
          ? `<p class="text-sm text-slate-400 italic">No responses yet.</p>`
          : `<div class="space-y-2 max-h-56 overflow-y-auto scroll-area">
              ${vals.map((v, i) => `
                <div class="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                  ${icon('chat', 'w-3.5 h-3.5 inline mr-1 text-slate-400')} ${v}
                </div>
              `).join('')}
            </div>`
        }
        <p class="text-xs text-slate-400 mt-1.5 text-right">${vals.length} response${vals.length !== 1 ? 's' : ''}</p>
      </div>
    `;
  }).join('');

  modal({
    title: `Results: ${form.title}`,
    size: 'lg',
    body: `
      <div class="space-y-5">
        <!-- Summary -->
        <div class="flex items-center gap-4 p-4 bg-brand-50 rounded-xl">
          <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
            ${icon('reports', 'w-6 h-6')}
          </div>
          <div>
            <div class="text-2xl font-extrabold text-brand-800">${total}</div>
            <div class="text-sm text-brand-700">Total response${total !== 1 ? 's' : ''} · ${questions.length} question${questions.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="ml-auto text-right">
            <div class="text-xs text-slate-500">Deadline</div>
            <div class="text-sm font-semibold text-slate-800">${form.deadline ? fdate(form.deadline, { long: true }) : 'None set'}</div>
          </div>
        </div>

        <!-- Per-question results -->
        ${total === 0
          ? emptyState({ icon: 'chat', title: 'No responses yet', body: 'Results will appear here once parents submit their responses.' })
          : resultsHtml
        }
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}
