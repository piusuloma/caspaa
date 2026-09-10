/* ============================================================
   Institutional Discount Policies
   ------------------------------------------------------------
   Organisation-wide concession rules — sibling waivers, staff
   dependant concessions, scholarships and bursaries — each one
   mapped to a contra-revenue account so the finance team can
   report gross fees, concessions given, and net revenue
   separately instead of seeing a single netted-down figure.

   The dialog edits a DRAFT copy. Nothing touches the database
   until "Save Changes", so Cancel / Escape / the X really do
   discard everything — including deletions, which stage as a
   struck-through row with an Undo rather than a nested confirm
   dialog (modal() replaces #modalRoot wholesale, so a second
   modal opened from inside this one would destroy it).
   ============================================================ */

/* Contra-revenue accounts. Concessions are NOT expenses — they reduce
   revenue, so they sit in the 4xxx series alongside the fee income they
   offset and carry a natural debit balance. */
const DISCOUNT_ACCOUNTS = [
  { code: '4210', name: 'Sibling & Family Concessions' },
  { code: '4220', name: 'Staff Dependant Concessions' },
  { code: '4230', name: 'Academic Scholarships' },
  { code: '4240', name: 'Sports & Talent Scholarships' },
  { code: '4250', name: 'Bursaries & Hardship Waivers' },
  { code: '4260', name: 'Prompt Payment Discounts' },
  { code: '4290', name: 'Other Concessions' }
];

/* ------------------------------------------------------------------
   Fee heads — what a policy can bite on.

   This list is built from the school's OWN fee structures, not from a
   fixed menu. It used to be hardcoded, which meant Books, Uniform and
   PTA could not be targeted at all while Boarding and Transport were
   offered but did not exist as fee heads anywhere.

   The four standard heads below are the columns every fee structure
   has; anything a school adds under "Additional Fees" appears as its
   own head, as do extracurricular activities.
   ------------------------------------------------------------------ */
const FEE_HEADS = [
  { key: 'tuition', label: 'Tuition Fee',       field: 'tuition' },
  { key: 'books',   label: 'Books & Materials', field: 'books' },
  { key: 'uniform', label: 'Uniform',           field: 'uniform' },
  { key: 'pta',     label: 'PTA Levy',          field: 'pta' }
];

function _dpNorm(s) {
  // Activity lines carry an emoji prefix ("\u26bd Football"), so strip anything
  // that is not a letter, digit or space before comparing.
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/* Every base a policy in this school can be written against. */
function discountBases(schoolId) {
  const sid = schoolId || currentSchoolId();
  const structures = DB.query('feeStructures', f => f.schoolId === sid);
  const bases = [{ key: 'total', label: 'Total Bill', hint: 'Every billed line on the invoice' }];

  FEE_HEADS.forEach(h => bases.push({ key: h.key, label: h.label, hint: `The ${h.label.toLowerCase()} line only` }));

  // Anything the school added under "Additional Fees" on any structure.
  const seen = new Set(bases.map(b => _dpNorm(b.label)));
  structures.forEach(f => (f.extraItems || []).forEach(it => {
    const n = _dpNorm(it.name);
    if (!it.name || seen.has(n)) return;
    seen.add(n);
    bases.push({ key: 'extra:' + n, label: it.name, hint: 'This additional fee only' });
  }));

  const acts = DB.query('activities', a => a.schoolId === sid);
  if (acts.length) bases.push({ key: 'activity', label: 'Activity Fees', hint: 'Extracurricular charges only' });

  return bases;
}

/* Does one invoice line belong to this base? Newly generated invoices tag each
   line with `head`, which is exact. Invoices created before that tagging (and
   rows typed by hand in the bill editor) fall back to matching the label. */
function discountLineMatches(baseKey, line, schoolId) {
  if (baseKey === 'total') return true;
  if (line.head) {
    return baseKey === 'activity' ? line.head === 'activity' : line.head === baseKey;
  }
  const n = _dpNorm(line.name);
  if (baseKey === 'activity') {
    const acts = DB.query('activities', a => a.schoolId === (schoolId || currentSchoolId()));
    return acts.some(a => n === _dpNorm(a.name) || n.includes(_dpNorm(a.name)));
  }
  if (baseKey.indexOf('extra:') === 0) return n === baseKey.slice(6);
  const h = FEE_HEADS.find(x => x.key === baseKey);
  return h ? n === _dpNorm(h.label) : false;
}

/* Sum the lines a base covers. `lines` is [{ name, amount, head? }]. */
function discountBaseAmount(baseKey, lines, schoolId) {
  return (lines || []).reduce((sum, l) => {
    const amt = Number(l.amount) || 0;
    if (amt < 0) return sum;                       // never discount a discount
    return discountLineMatches(baseKey, l, schoolId) ? sum + amt : sum;
  }, 0);
}

/* The billed lines a fee structure produces, in invoice form. */
function feeStructureLines(f) {
  const lines = FEE_HEADS.map(h => ({ name: h.label, amount: f[h.field] || 0, head: h.key }));
  (f.extraItems || []).forEach(it => {
    if (it.name) lines.push({ name: it.name, amount: it.amount || 0, head: 'extra:' + _dpNorm(it.name) });
  });
  return lines;
}

/* What kind of concession this is, in the school's own words. The author picks
   ONE of these; the contra-revenue account falls out of it. Splitting the two
   was the mistake — account names like "Sibling & Family Concessions" read like
   policy names, so choosing one felt like picking another policy. */
const DISCOUNT_CATEGORIES = [
  { key: 'sibling',   label: 'Sibling / family',    account: '4210' },
  { key: 'staff',     label: 'Staff dependant',     account: '4220' },
  { key: 'academic',  label: 'Academic scholarship', account: '4230' },
  { key: 'sports',    label: 'Sports & talent',     account: '4240' },
  { key: 'bursary',   label: 'Bursary / hardship',  account: '4250' },
  { key: 'prompt',    label: 'Prompt payment',      account: '4260' },
  { key: 'other',     label: 'Other concession',    account: '4290' }
];

function dpCategoryFor(p) {
  if (p.category) return p.category;
  const c = DISCOUNT_CATEGORIES.find(x => x.account === p.account);
  return c ? c.key : 'other';
}
function dpAccountForCategory(key) {
  const c = DISCOUNT_CATEGORIES.find(x => x.key === key);
  return c ? c.account : '4290';
}

function dpAccountLabel(code) {
  const a = DISCOUNT_ACCOUNTS.find(x => x.code === code);
  return a ? `${a.code} · ${a.name}` : (code || 'Unmapped');
}
function dpBaseLabel(key) {
  const b = discountBases().find(x => x.key === key);
  if (b) return b.label;
  // A head the school has since renamed or removed still has to read sensibly.
  if (key && key.indexOf('extra:') === 0) return key.slice(6).replace(/\b\w/g, c => c.toUpperCase());
  return key ? String(key) : '—';
}
function dpValueLabel(p) {
  return p.type === 'percent' ? `${Number(p.value || 0)}%` : money(p.value);
}

/* The four policies every school starts with — they mirror the concessions
   already handed out ad hoc in applyDiscountModal(). Seeded on first open so
   an existing browser database picks them up without a schema migration. */
function defaultDiscountPolicies(schoolId) {
  return [
    { name: 'Second Sibling Waiver',      type: 'percent', value: 10,    appliesTo: 'tuition',  category: 'sibling',  account: '4210', status: 'active', autoApply: true,  expiresOn: '', notes: 'Applied to the second and each subsequent child enrolled from the same household.' },
    { name: 'Staff Dependant Concession', type: 'percent', value: 50,    appliesTo: 'tuition',  category: 'staff',    account: '4220', status: 'active', autoApply: true,  expiresOn: '', notes: 'For children of full-time staff. Lapses when the parent leaves employment.' },
    { name: 'Academic Scholar Tier A',    type: 'fixed',   value: 50000, appliesTo: 'total',    category: 'academic', account: '4230', status: 'active', autoApply: false, expiresOn: '', notes: 'Awarded by the scholarship committee each session. Reviewed on end-of-term results.' },
    { name: 'Sports Scholarship',         type: 'fixed',   value: 25000, appliesTo: 'activity', category: 'sports',   account: '4240', status: 'active', autoApply: false, expiresOn: '', notes: 'Covers activity fees for students on a school team.' }
  ].map((p, i) => Object.assign({ id: `dpol_${schoolId}_${String(i + 1).padStart(3, '0')}`, schoolId, createdAt: now() }, p));
}

/* Policies are per branch, so the "already seeded" flag has to be too — a single
   boolean would hand the defaults to whichever branch opened this first and
   leave every other branch with an empty table it could never refill. */
function discountPolicies(schoolId) {
  const sid = schoolId || currentSchoolId();
  let rows = DB.query('discountPolicies', p => p.schoolId === sid);
  const seeded = DB.settings().discountPoliciesSeeded || {};
  if (!rows.length && !seeded[sid]) {
    defaultDiscountPolicies(sid).forEach(p => DB.insert('discountPolicies', p));
    DB.settings({ discountPoliciesSeeded: Object.assign({}, seeded, { [sid]: true }) });
    rows = DB.query('discountPolicies', p => p.schoolId === sid);
  }
  return rows;
}

/* The saved manual-override approval limit. Read by the bill editor in
   concessions.js, which blocks a large override without an approval reference. */
function discountApprovalLimit() {
  const v = DB.settings().discountApprovalLimit;
  return typeof v === 'number' ? v : 50000;
}

/* ---------- Draft state ---------- */
let _dpDraft = null;    // working copy of every policy row
let _dpEditing = null;  // id being edited, 'new', or null while the list shows
let _dpLimitDraft = null;

function _dpLimit() { return _dpLimitDraft == null ? discountApprovalLimit() : _dpLimitDraft; }

/* Fires on blur, so repaint only the footer — a full re-render here would throw
   the reader back to the top of a dialog they were part-way through. */
function dpSetLimit(value) {
  const n = Math.max(0, parseInt(value, 10) || 0);
  _dpLimitDraft = n;
  const foot = document.getElementById('dpFooter');
  if (foot && !_dpEditing) foot.innerHTML = dpListFooterHtml();
}

function discountPoliciesModal() {
  const sid = currentSchoolId();
  _dpDraft = discountPolicies(sid).map(p => Object.assign({}, p));
  _dpLimitDraft = discountApprovalLimit();
  _dpEditing = null;

  modal({
    title: 'Settings · Institutional Discount Policies',
    size: 'lg',
    body: '<div id="dpBody"></div>',
    footer: '<div id="dpFooter" class="flex items-center gap-3 w-full justify-end"></div>',
    onClose: () => { _dpDraft = null; _dpEditing = null; _dpLimitDraft = null; }
  });
  dpRender();
}

/* Repaints both panes. The editor and the list are two screens of one dialog,
   so the footer swaps with the body — one action row, never two. */
function dpRender() {
  const body = document.getElementById('dpBody');
  const foot = document.getElementById('dpFooter');
  if (!body || !foot) return;
  body.innerHTML = _dpEditing ? dpEditorHtml() : dpListHtml();
  foot.innerHTML = _dpEditing ? dpEditorFooterHtml() : dpListFooterHtml();
  if (_dpEditing) { initDatePickers(); dpSuggestCategory(); dpSyncHints(); dpPreview(); }
}

/* ---------- List screen ---------- */
function dpListHtml() {
  const live = _dpDraft.filter(p => !p._removed);
  const active = live.filter(p => p.status === 'active');
  const inactive = live.filter(p => p.status !== 'active');
  const removed = _dpDraft.filter(p => p._removed);

  return `
    <p class="text-sm text-slate-600">
      Define organisation-wide concession rules mapped to contra-revenue accounts.
      Concessions post against the account you choose, so gross fees and the
      discount given both stay visible on the revenue report.
    </p>

    <div class="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 mt-4">
      <div>
        <label class="input-label" for="dp_limit">Manual Override Approval Limit</label>
        <div class="flex items-stretch gap-2">
          <span class="inline-flex items-center px-3 rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold">&#8358;</span>
          <input id="dp_limit" type="number" min="0" step="5000" class="input w-40" value="${_dpLimit()}" onchange="dpSetLimit(this.value)" />
        </div>
      </div>
      <p class="text-xs text-slate-500 flex-1 min-w-[16rem]">
        Any custom discount or bill override above this figure requires a proprietor
        approval reference before it can be saved.
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 mt-5 mb-2">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Policies</h4>
      <button class="btn btn-secondary text-sm" onclick="dpNew()">${icon('plus','w-4 h-4')} Create New Policy</button>
    </div>

    ${dpTableHtml(active)}

    ${inactive.length ? `
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-5 mb-2">Inactive · ${inactive.length}</h4>
      ${dpTableHtml(inactive, 'opacity-75')}` : ''}

    ${removed.length ? `
      <h4 class="text-xs font-semibold uppercase tracking-wide text-rose-600 mt-5 mb-2">Marked for deletion · ${removed.length}</h4>
      <div class="card overflow-hidden">
        <table class="tbl"><tbody>
          ${removed.map(p => `<tr>
            <td class="text-slate-400 line-through">${p.name}</td>
            <td class="text-slate-400 text-sm">${dpValueLabel(p)} off ${dpBaseLabel(p.appliesTo)}</td>
            <td class="text-right"><button class="btn btn-ghost text-sm !py-1" onclick="dpRestore('${p.id}')">Undo</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>` : ''}

    <div class="flex items-start gap-2 text-xs text-slate-600 bg-brand-50 rounded-xl px-4 py-3 mt-5">
      ${icon('info','w-3.5 h-3.5 flex-shrink-0 text-brand-600 mt-0.5')}
      <span>Editing a policy changes concessions granted from here on. Invoices that
      already carry a discount line are not recalculated — adjust those on the
      student's ledger.</span>
    </div>
  `;
}

/* Active and inactive render as two stacked cards, so they share one header
   markup — otherwise the two tables size their columns independently and the
   stack reads as ragged. */
function dpTableHtml(rows, extraClass = '') {
  return `
    <div class="card overflow-hidden ${extraClass}">
      <table class="tbl">
        <thead>
          <tr>
            <th scope="col">Policy Name</th>
            <th scope="col" class="w-24">Type</th>
            <th scope="col" class="num w-28">Value</th>
            <th scope="col" class="w-32">Applies To</th>
            <th scope="col" class="w-24">Status</th>
            <th scope="col" class="w-24"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>${rows.map(dpRowHtml).join('')}</tbody>
      </table>
    </div>`;
}

function dpRowHtml(p) {
  const isActive = p.status === 'active';
  return `<tr>
    <td>
      <div class="font-semibold text-slate-900">${p.name}</div>
      <div class="text-xs text-slate-500 mt-0.5">${dpAccountLabel(p.account)}${p.autoApply ? ' · auto-applied' : ''}</div>
    </td>
    <td><span class="badge badge-neutral">${p.type === 'percent' ? '%' : 'Fixed'}</span></td>
    <td class="num font-mono font-semibold">${dpValueLabel(p)}</td>
    <td class="text-slate-700">${dpBaseLabel(p.appliesTo)}</td>
    <td>
      <button class="badge ${isActive ? 'badge-success' : 'badge-neutral'}"
              title="${isActive ? 'Deactivate this policy' : 'Activate this policy'}"
              onclick="dpToggleStatus('${p.id}')">${isActive ? 'Active' : 'Inactive'}</button>
    </td>
    <td class="text-right whitespace-nowrap">
      <button class="btn btn-ghost !p-1.5" aria-label="Edit ${p.name}" title="Edit" onclick="dpEdit('${p.id}')">${icon('edit','w-4 h-4')}</button>
      <button class="btn btn-ghost !p-1.5 text-rose-600" aria-label="Delete ${p.name}" title="Delete" onclick="dpRemove('${p.id}')">${icon('trash','w-4 h-4')}</button>
    </td>
  </tr>`;
}

function dpListFooterHtml() {
  const n = dpChangeCount();
  return `
    ${n ? `<span class="text-xs text-amber-700 font-semibold mr-auto">${n} unsaved change${n === 1 ? '' : 's'}</span>` : ''}
    <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">${n ? 'Discard' : 'Cancel'}</button>
    <button class="btn btn-primary" ${n ? '' : 'disabled'} onclick="dpSave()">${icon('check','w-4 h-4')} Save Changes</button>
  `;
}

/* ---------- Editor screen ---------- */
function dpEditorHtml() {
  const isNew = _dpEditing === 'new';
  const p = isNew
    ? { name: '', type: 'percent', value: 10, appliesTo: 'tuition', category: 'other', account: '4290', status: 'active', autoApply: false, expiresOn: '', notes: '' }
    : _dpDraft.find(x => x.id === _dpEditing);
  if (!p) { _dpEditing = null; return dpListHtml(); }

  return `
    <div class="space-y-4">
      <div>
        <label class="input-label" for="dp_name">Policy Name</label>
        <input id="dp_name" class="input" value="${p.name}" placeholder="e.g. Second Sibling Waiver" oninput="dpSuggestCategory(); dpPreview()" />
      </div>

      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <span class="input-label" id="dp_typeLabel">Type</span>
          <div class="flex gap-2" role="group" aria-labelledby="dp_typeLabel">
            ${[['percent','Percentage'],['fixed','Fixed amount']].map(([k, label]) => `
              <button type="button" data-dptype="${k}" aria-pressed="${p.type === k}"
                      class="btn ${p.type === k ? 'btn-primary' : 'btn-secondary'} flex-1 text-sm"
                      onclick="dpSetType('${k}')">${label}</button>`).join('')}
          </div>
        </div>
        <div>
          <label class="input-label" for="dp_value">Value</label>
          <div class="flex items-stretch gap-2">
            <span id="dp_prefix" class="inline-flex items-center px-3 rounded-lg bg-slate-100 text-slate-600 font-semibold" ${p.type === 'percent' ? 'hidden' : ''}>&#8358;</span>
            <input id="dp_value" type="number" min="0" step="${p.type === 'percent' ? '1' : '500'}" class="input flex-1" value="${p.value}" oninput="dpPreview()" />
            <span id="dp_suffix" class="inline-flex items-center px-3 rounded-lg bg-slate-100 text-slate-600 font-semibold" ${p.type === 'percent' ? '' : 'hidden'}>%</span>
          </div>
        </div>
      </div>

      <div>
        <label class="input-label" for="dp_base">Applies To</label>
        <select id="dp_base" class="input sm:max-w-sm" onchange="dpPreview()">
          ${discountBases().map(b => `<option value="${b.key}" ${p.appliesTo === b.key ? 'selected' : ''}>${b.label}</option>`).join('')}
        </select>
        <p id="dp_baseHint" class="text-xs text-slate-500 mt-1"></p>
      </div>

      <div id="dp_previewBox" class="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700"></div>

      <p id="dp_accountHint" class="text-xs text-slate-500"></p>
      <div id="dp_categoryBox" class="hidden">
        <label class="input-label" for="dp_category">Report this concession under</label>
        <select id="dp_category" class="input sm:max-w-sm" onchange="dpCategoryChanged()">
          ${DISCOUNT_CATEGORIES.map(c => `<option value="${c.key}" ${dpCategoryFor(p) === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="dp_account" value="${p.account || '4290'}" />

      <div>
        <label class="input-label" for="dp_expires">Valid Until <span class="font-normal text-slate-400">(optional)</span></label>
        <input id="dp_expires" type="date" class="input sm:max-w-xs" value="${p.expiresOn || ''}" />
        <p class="text-xs text-slate-500 mt-1">Leave empty for a standing policy. Status is toggled from the policy list.</p>
      </div>

      <label class="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl cursor-pointer">
        <input id="dp_auto" type="checkbox" class="mt-0.5" ${p.autoApply ? 'checked' : ''} />
        <span class="text-sm">
          <span class="font-semibold text-slate-900">Apply automatically when a student qualifies</span>
          <span class="block text-xs text-slate-500 mt-0.5">Leave this off for awards the school grants case by case, such as scholarships.</span>
        </span>
      </label>

      <div>
        <label class="input-label" for="dp_notes">Eligibility Notes <span class="font-normal text-slate-400">(optional)</span></label>
        <textarea id="dp_notes" rows="2" class="input" placeholder="Who qualifies, who approves, and when it lapses.">${p.notes || ''}</textarea>
      </div>
    </div>
  `;
}

function dpEditorFooterHtml() {
  return `
    <button class="btn btn-ghost mr-auto" onclick="dpBack()">${icon('arrow_left','w-4 h-4')} Back to policies</button>
    <button class="btn btn-primary" onclick="dpCommitEditor()">
      ${icon('check','w-4 h-4')} ${_dpEditing === 'new' ? 'Add Policy' : 'Update Policy'}
    </button>
  `;
}

/* A concession is easier to sanity-check against a real bill than in the
   abstract, so quote it against a representative fee structure for this school
   — the same lines an invoice would actually carry. */
function dpReferenceLines() {
  const sid = currentSchoolId();
  const structures = DB.query('feeStructures', f => f.schoolId === sid);
  let lines = [];
  if (structures.length) {
    // The middle structure by total, so the example is not the cheapest or dearest class.
    const ranked = structures.slice().sort((a, b) =>
      feeStructureLines(a).reduce((s, l) => s + l.amount, 0) - feeStructureLines(b).reduce((s, l) => s + l.amount, 0));
    lines = feeStructureLines(ranked[Math.floor(ranked.length / 2)]);
  } else {
    lines = [
      { name: 'Tuition Fee', amount: 180000, head: 'tuition' },
      { name: 'Books & Materials', amount: 25000, head: 'books' },
      { name: 'Uniform', amount: 20000, head: 'uniform' },
      { name: 'PTA Levy', amount: 10000, head: 'pta' }
    ];
  }
  DB.query('activities', a => a.schoolId === sid).slice(0, 2)
    .forEach(a => lines.push({ name: a.name, amount: a.price || 0, head: 'activity' }));
  return lines;
}

function dpPreview() {
  const box = document.getElementById('dp_previewBox');
  if (!box) return;
  const pressed = document.querySelector('[data-dptype][aria-pressed="true"]');
  const isPct = !pressed || pressed.dataset.dptype === 'percent';
  const value = Number((document.getElementById('dp_value') || {}).value) || 0;
  const base = (document.getElementById('dp_base') || {}).value || 'tuition';
  const ref = discountBaseAmount(base, dpReferenceLines());
  const off = isPct ? Math.round(ref * value / 100) : Math.min(value, ref);
  const over = !isPct && value > ref;

  box.innerHTML = `
    <div class="flex items-center gap-2 font-semibold text-slate-900">
      ${icon('naira','w-4 h-4 text-brand-600')} Worked example
    </div>
    <div class="mt-1.5">
      On a typical <strong>${dpBaseLabel(base).toLowerCase()}</strong> of ${money(ref)},
      this waives <strong class="text-emerald-700">${money(off)}</strong> —
      leaving ${money(Math.max(0, ref - off))} payable.
    </div>
    ${over ? `<div class="text-xs text-amber-700 font-semibold mt-1.5">
      That is more than the typical ${dpBaseLabel(base).toLowerCase()} — the concession will cap at the billed amount.
    </div>` : ''}
  `;
}

/* Nobody should have to learn the 4xxx chart of accounts to add a sibling
   waiver, so the author picks a plain-language Concession Type and the account
   is derived. Typing a name pre-selects that type; once the author changes the
   type themselves, their choice is never overwritten.

   Order is significant: the first match wins, so narrow categories are listed
   before broad ones. "Sports Scholarship" has to reach sports before the word
   "scholar" claims it for academic. Avoid short fragments that appear inside
   ordinary words ("art" would match "Start" and "Quarter"). */
const DP_CATEGORY_HINTS = [
  { key: 'sibling',  words: ['sibling', 'second child', 'third child', 'family', 'household'] },
  { key: 'staff',    words: ['staff', 'dependant', 'dependent', 'teacher child', 'employee'] },
  { key: 'bursary',  words: ['bursary', 'hardship', 'need-based', 'welfare', 'relief', 'orphan'] },
  { key: 'prompt',   words: ['prompt', 'early payment', 'upfront', 'full payment', 'advance'] },
  { key: 'sports',   words: ['sport', 'athlet', 'football', 'talent', 'music'] },
  { key: 'academic', words: ['scholar', 'academic', 'merit', 'tier', 'distinction'] }
];

let _dpCategoryLocked = false;

/* The author never has to open this. Changing it re-points the account. */
function dpCategoryChanged() {
  _dpCategoryLocked = true;
  const catEl = document.getElementById('dp_category');
  const accEl = document.getElementById('dp_account');
  if (catEl && accEl) accEl.value = dpAccountForCategory(catEl.value);
  dpSyncHints();
}

/* The policy name already says what kind of concession this is, so read it
   from there rather than asking. The author can still correct it. */
function dpSuggestCategory() {
  if (_dpCategoryLocked) return;
  const nameEl = document.getElementById('dp_name');
  const catEl = document.getElementById('dp_category');
  const accEl = document.getElementById('dp_account');
  if (!nameEl || !catEl) return;
  const name = nameEl.value.toLowerCase();
  if (!name.trim()) return;
  const hit = DP_CATEGORY_HINTS.find(h => h.words.some(w => name.includes(w)));
  const key = hit ? hit.key : 'other';
  if (catEl.value !== key) {
    catEl.value = key;
    if (accEl) accEl.value = dpAccountForCategory(key);
  }
  dpSyncHints();
}

function dpToggleCategoryBox() {
  const box = document.getElementById('dp_categoryBox');
  if (!box) return;
  const willShow = box.classList.contains('hidden');
  box.classList.toggle('hidden', !willShow);
  dpSyncHints();
  if (willShow) document.getElementById('dp_category').focus();
}

/* Keeps the two captions in step with what is chosen. */
function dpSyncHints() {
  const baseEl = document.getElementById('dp_base');
  const baseHint = document.getElementById('dp_baseHint');
  if (baseEl && baseHint) {
    const b = discountBases().find(x => x.key === baseEl.value);
    baseHint.textContent = b ? b.hint : '';
  }
  const accEl = document.getElementById('dp_account');
  const accHint = document.getElementById('dp_accountHint');
  const box = document.getElementById('dp_categoryBox');
  if (accEl && accHint) {
    const open = box && !box.classList.contains('hidden');
    accHint.innerHTML = 'Reported under <strong>' + dpAccountLabel(accEl.value) + '</strong>' +
      (open ? '' : ' &middot; <button type="button" class="text-brand-700 font-semibold underline" onclick="dpToggleCategoryBox()">change</button>');
  }
}

/* ---------- Draft mutations ---------- */
function dpNew() { _dpEditing = 'new'; _dpCategoryLocked = false; dpRender(); }
function dpEdit(id) { _dpEditing = id; _dpCategoryLocked = true; dpRender(); }
function dpBack() { _dpEditing = null; dpRender(); }

function dpSetType(type) {
  document.querySelectorAll('[data-dptype]').forEach(b => {
    const on = b.dataset.dptype === type;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('btn-primary', on);
    b.classList.toggle('btn-secondary', !on);
  });
  const val = document.getElementById('dp_value');
  document.getElementById('dp_prefix').hidden = type === 'percent';
  document.getElementById('dp_suffix').hidden = type !== 'percent';
  val.step = type === 'percent' ? '1' : '500';
  // 50000% is not a discount anyone meant to type.
  if (type === 'percent' && Number(val.value) > 100) val.value = 100;
  dpPreview();
}

function dpToggleStatus(id) {
  const p = _dpDraft.find(x => x.id === id);
  if (!p) return;
  p.status = p.status === 'active' ? 'inactive' : 'active';
  dpRender();
}

function dpRemove(id) {
  const p = _dpDraft.find(x => x.id === id);
  if (!p) return;
  p._removed = true;
  dpRender();
}

function dpRestore(id) {
  const p = _dpDraft.find(x => x.id === id);
  if (!p) return;
  delete p._removed;
  dpRender();
}

function dpCommitEditor() {
  const nameEl = document.getElementById('dp_name');
  const name = nameEl.value.trim();
  if (!name) { toast('Give the policy a name', 'danger'); nameEl.focus(); return; }

  const pressed = document.querySelector('[data-dptype][aria-pressed="true"]');
  const type = pressed ? pressed.dataset.dptype : 'percent';
  const value = Number(document.getElementById('dp_value').value) || 0;
  if (value <= 0) { toast('The value must be greater than zero', 'danger'); return; }
  if (type === 'percent' && value > 100) { toast('A percentage discount cannot exceed 100%', 'danger'); return; }

  // Two policies sharing a name make the discount lines on an invoice ambiguous —
  // the student ledger groups those lines by their label.
  const clash = _dpDraft.some(x => !x._removed && x.id !== _dpEditing && x.name.toLowerCase() === name.toLowerCase());
  if (clash) { toast(`A policy named "${name}" already exists`, 'danger'); return; }

  const existingRow = _dpEditing === 'new' ? null : _dpDraft.find(x => x.id === _dpEditing);
  const patch = {
    name, type, value,
    appliesTo: document.getElementById('dp_base').value,
    category: document.getElementById('dp_category').value,
    account: document.getElementById('dp_account').value,
    // Status is toggled from the policy list, so a new policy starts active and
    // an edit keeps whatever it already had.
    status: existingRow ? existingRow.status : 'active',
    expiresOn: document.getElementById('dp_expires').value || '',
    autoApply: document.getElementById('dp_auto').checked,
    notes: document.getElementById('dp_notes').value.trim()
  };

  if (_dpEditing === 'new') {
    _dpDraft.push(Object.assign({ id: uid('dpol'), schoolId: currentSchoolId(), createdAt: now() }, patch));
  } else {
    Object.assign(_dpDraft.find(x => x.id === _dpEditing), patch);
  }
  _dpEditing = null;
  dpRender();
}

/* ---------- Dirty tracking & commit ---------- */
const DP_FIELDS = ['name','type','value','appliesTo','category','account','status','autoApply','expiresOn','notes'];

function dpChangeCount() {
  const byId = new Map(discountPolicies(currentSchoolId()).map(p => [p.id, p]));
  let n = _dpLimitDraft != null && _dpLimitDraft !== discountApprovalLimit() ? 1 : 0;
  _dpDraft.forEach(d => {
    const orig = byId.get(d.id);
    if (!orig) { n++; return; }       // newly added
    if (d._removed) { n++; return; }  // staged for deletion
    if (DP_FIELDS.some(k => (orig[k] ?? '') !== (d[k] ?? ''))) n++;
  });
  return n;
}

function dpSave() {
  const sid = currentSchoolId();
  const changes = dpChangeCount();
  const keep = _dpDraft.filter(p => !p._removed);
  const keepIds = new Set(keep.map(p => p.id));

  discountPolicies(sid).forEach(p => { if (!keepIds.has(p.id)) DB.remove('discountPolicies', p.id); });
  if (_dpLimitDraft != null) DB.settings({ discountApprovalLimit: _dpLimitDraft });

  keep.forEach(p => {
    const row = Object.assign({}, p);
    delete row._removed;
    if (DB.find('discountPolicies', p.id)) DB.update('discountPolicies', p.id, row);
    else DB.insert('discountPolicies', row);
  });

  DB.insert('auditLog', {
    id: uid('aud'), schoolId: sid,
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'updated_discount_policies',
    target: `${changes} change${changes === 1 ? '' : 's'} to institutional discount policies`,
    timestamp: now()
  });

  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`Discount policies saved — ${changes} change${changes === 1 ? '' : 's'}`, 'success');
}
