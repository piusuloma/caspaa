/* ============================================================================
   Student Ledger / Statement of Account
   ----------------------------------------------------------------------------
   Implements the stakeholder billing spec (CASPAA_Ledger): an itemised, dated,
   running-balance statement — charges, discounts and payments broken out on
   their own lines (never lumped), with opening balances, credit balances,
   editable bills, printable statements/receipts and account activation.

   This file is loaded AFTER student.js in pages/index.js, so its
   renderStudentWallet() intentionally overrides the earlier "lumped" version.
   The upgraded ledger is shared by BOTH the admin student profile and the
   parent "Wallet & Ledger" view — one source of truth.
   ========================================================================== */

/* Emoji-prefixed line items are extracurricular activities in this codebase. */
const LEDGER_EMOJI_RE = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}♟]/u;

function _ledgerEscAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------------------------------------------------------------------------
   buildStudentLedger — the single computation behind every view/print.
   Returns dated entries with a running balance (positive = owed, negative =
   credit / overpayment), plus category totals.
   Rows, in date order (opening balance always first):
     • Opening balance  (walletLedger, category 'opening')      debit or credit
     • Each invoice charge (positive line item)                 debit
     • Each invoice discount (negative line item)               credit
     • Each successful payment (transaction)                    credit
     • Manual adjustments (walletLedger, non-opening)           debit or credit
--------------------------------------------------------------------------- */
function buildStudentLedger(studentId, schoolId) {
  const entries = [];

  // 1. Opening balance brought forward
  DB.query('walletLedger', e => e.studentId === studentId && e.category === 'opening').forEach(e => {
    entries.push({
      date: e.createdAt, kind: 'opening', ref: e.id,
      particulars: e.description || 'Opening balance b/f',
      debit: e.type === 'debit' ? e.amount : 0,
      credit: e.type === 'credit' ? e.amount : 0
    });
  });

  // 2. Invoice line items — charges as debits, discounts as credits
  DB.query('invoices', i => i.studentId === studentId && i.schoolId === schoolId).forEach(inv => {
    (inv.lineItems || []).forEach(li => {
      if (!li || !li.amount) return;
      if (li.amount > 0) {
        entries.push({ date: inv.createdAt, kind: 'charge', ref: inv.id, particulars: li.name, debit: li.amount, credit: 0 });
      } else {
        const label = /discount|scholarship|waiver|bursary/i.test(li.name) ? li.name : `${li.name} — Discount`;
        entries.push({ date: inv.createdAt, kind: 'discount', ref: inv.id, particulars: label, debit: 0, credit: Math.abs(li.amount) });
      }
    });
  });

  // 3. Payments received
  DB.query('transactions', t => t.studentId === studentId && t.schoolId === schoolId && t.status === 'successful').forEach(t => {
    const via = t.method ? String(t.method).toUpperCase() : (t.gateway || 'Bank');
    entries.push({
      date: t.timestamp, kind: 'payment', ref: t.id, invoiceId: t.invoiceId,
      particulars: `Payment received — ${via}${t.reference ? ' · ' + t.reference : ''}`,
      debit: 0, credit: t.amount
    });
  });

  // 4. Manual adjustments (admin credit/debit that isn't an opening balance)
  DB.query('walletLedger', e => e.studentId === studentId && e.category !== 'opening').forEach(e => {
    entries.push({
      date: e.createdAt, kind: 'adjustment', ref: e.id,
      particulars: e.description || (e.type === 'credit' ? 'Credit adjustment' : 'Debit adjustment'),
      debit: e.type === 'debit' ? e.amount : 0,
      credit: e.type === 'credit' ? e.amount : 0
    });
  });

  // Sort by date ascending; opening balance is always the first row
  entries.sort((a, b) => {
    if (a.kind === 'opening' && b.kind !== 'opening') return -1;
    if (b.kind === 'opening' && a.kind !== 'opening') return 1;
    return String(a.date || '').localeCompare(String(b.date || ''));
  });

  let running = 0;
  entries.forEach(e => { running += (e.debit - e.credit); e.balance = running; });

  const debitTotal    = entries.reduce((s, e) => s + e.debit, 0);
  const creditTotal   = entries.reduce((s, e) => s + e.credit, 0);
  const discountTotal = entries.filter(e => e.kind === 'discount').reduce((s, e) => s + e.credit, 0);
  const paidTotal     = entries.filter(e => e.kind === 'payment').reduce((s, e) => s + e.credit, 0);

  return { entries, debitTotal, creditTotal, discountTotal, paidTotal, balance: running };
}

/* ---------------------------------------------------------------------------
   renderStudentWallet — OVERRIDES the lumped version. Returns the ledger HTML
   embedded by both the admin student profile and the parent wallet page.
--------------------------------------------------------------------------- */
function renderStudentWallet(studentId, schoolId) {
  const s = DB.find('students', studentId);
  if (!s) return '';
  schoolId = schoolId || s.schoolId;

  const L = buildStudentLedger(studentId, schoolId);
  const owed = L.balance;                       // + = owed by parent, − = school owes credit
  const inCredit = owed < 0;
  const role = AUTH.current ? AUTH.current.role : '';
  const canManage = ['schooladmin', 'principal', 'finance'].includes(role);

  const statusBadge = ({
    active:     '<span class="badge badge-success text-xs">Account active</span>',
    inactive:   '<span class="badge badge-warn text-xs">Account deactivated</span>',
    withdrawn:  '<span class="badge badge-danger text-xs">Withdrawn</span>',
    suspended:  '<span class="badge badge-warn text-xs">Suspended</span>',
    transferred:'<span class="badge text-xs">Transferred</span>',
    alumni:     '<span class="badge text-xs">Alumni</span>'
  })[s.status] || '';

  // Ledger table rows (most recent first for on-screen reading)
  const rows = [...L.entries].reverse().map(e => {
    const isCredit = e.credit > 0;
    const balCls = e.balance < 0 ? 'text-emerald-700' : 'text-slate-800';
    const balTxt = e.balance < 0 ? `${money(Math.abs(e.balance))} Cr` : money(e.balance);
    const receiptBtn = (e.kind === 'payment' && e.invoiceId)
      ? `<button class="text-[11px] text-brand-600 hover:underline font-semibold" onclick="downloadReceipt('${e.invoiceId}')">Receipt</button>` : '';
    return `
      <tr class="border-b border-slate-100">
        <td class="py-2 pr-2 text-xs text-slate-500 whitespace-nowrap align-top">${fdate(e.date, { short: true })}</td>
        <td class="py-2 pr-2 align-top">
          <div class="text-sm text-slate-800">${e.particulars}</div>
          ${receiptBtn}
        </td>
        <td class="py-2 px-2 text-right font-mono text-sm text-rose-600 whitespace-nowrap align-top">${e.debit ? money(e.debit) : ''}</td>
        <td class="py-2 px-2 text-right font-mono text-sm text-emerald-700 whitespace-nowrap align-top">${isCredit ? money(e.credit) : ''}</td>
        <td class="py-2 pl-2 text-right font-mono text-sm font-semibold ${balCls} whitespace-nowrap align-top">${balTxt}</td>
      </tr>`;
  }).join('');

  const manageBtns = canManage ? `
    <div class="flex flex-wrap gap-2 mb-3">
      <button class="btn btn-secondary text-xs" onclick="ledgerEditBill('${studentId}')">${icon('edit','w-4 h-4')} Edit Bill</button>
      <button class="btn btn-secondary text-xs" onclick="ledgerAddDiscount('${studentId}')">${icon('plus','w-4 h-4')} Add Discount</button>
      <button class="btn btn-secondary text-xs" onclick="openingBalanceModal('${studentId}')">${icon('fees','w-4 h-4')} Opening Balance</button>
      <button class="btn btn-secondary text-xs" onclick="adm_walletEntry('${studentId}','credit')">+ Credit</button>
      <button class="btn btn-secondary text-xs" onclick="adm_walletEntry('${studentId}','debit')">− Debit</button>
      <button class="btn btn-secondary text-xs ${s.status === 'active' ? 'text-rose-600' : 'text-emerald-700'}" onclick="toggleStudentAccount('${studentId}')">
        ${s.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
      </button>
    </div>` : '';

  return `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      <div class="text-center p-3 bg-rose-50 rounded-xl">
        <div class="text-base sm:text-lg font-extrabold text-rose-700">${money(L.debitTotal)}</div>
        <div class="text-xs text-slate-500">Total Billed</div>
      </div>
      <div class="text-center p-3 bg-brand-50 rounded-xl">
        <div class="text-base sm:text-lg font-extrabold text-brand-700">${money(L.discountTotal)}</div>
        <div class="text-xs text-slate-500">Discounts</div>
      </div>
      <div class="text-center p-3 bg-emerald-50 rounded-xl">
        <div class="text-base sm:text-lg font-extrabold text-emerald-700">${money(L.paidTotal)}</div>
        <div class="text-xs text-slate-500">Total Paid</div>
      </div>
      <div class="text-center p-3 ${inCredit ? 'bg-emerald-50' : 'bg-slate-100'} rounded-xl">
        <div class="text-base sm:text-lg font-extrabold ${inCredit ? 'text-emerald-700' : 'text-slate-800'}">${money(Math.abs(owed))}</div>
        <div class="text-xs text-slate-500">${inCredit ? 'Credit Balance' : 'Balance Due'}</div>
      </div>
    </div>

    ${manageBtns}

    <div class="card p-0">
      <div class="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-700">Statement of Account</span>
          ${statusBadge}
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary text-xs" onclick="printStudentStatement('${studentId}','${schoolId}')">${icon('download','w-4 h-4')} Print Statement</button>
        </div>
      </div>
      <div class="px-4 pb-2 overflow-x-auto">
        ${L.entries.length ? `
        <table class="w-full min-w-[520px]">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
              <th scope="col" class="text-left font-semibold py-2 pr-2">Date</th>
              <th scope="col" class="text-left font-semibold py-2 pr-2">Particulars</th>
              <th scope="col" class="text-right font-semibold py-2 px-2">Debit</th>
              <th scope="col" class="text-right font-semibold py-2 px-2">Credit</th>
              <th scope="col" class="text-right font-semibold py-2 pl-2">Balance</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-200">
              <td class="py-2 pr-2 text-xs font-semibold text-slate-500" colspan="2">Totals</td>
              <td class="py-2 px-2 text-right font-mono text-sm font-bold text-rose-700">${money(L.debitTotal)}</td>
              <td class="py-2 px-2 text-right font-mono text-sm font-bold text-emerald-700">${money(L.creditTotal)}</td>
              <td class="py-2 pl-2 text-right font-mono text-sm font-extrabold ${inCredit ? 'text-emerald-700' : 'text-slate-900'}">${inCredit ? money(Math.abs(owed)) + ' Cr' : money(owed)}</td>
            </tr>
          </tfoot>
        </table>` : '<div class="py-8 text-center text-slate-500 text-sm">No transactions on this account yet.</div>'}
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
   printStudentStatement — a printable statement in the tabulated form of the
   stakeholder sample (Date | Particulars | Debit | Credit | Balance).
   Available to admin/finance AND parents (the parent wallet shows the button).
--------------------------------------------------------------------------- */
function printStudentStatement(studentId, schoolId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  schoolId = schoolId || s.schoolId;
  const school = DB.find('schools', schoolId) || {};
  const brand = school.branding || {};
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const L = buildStudentLedger(studentId, schoolId);
  const owed = L.balance;
  const primary = brand.primaryColor || '#00b386';

  const logo = brand.logoImage
    ? `<img src="${brand.logoImage}" alt="" style="height:52px;width:52px;object-fit:contain;border-radius:8px"/>`
    : `<div style="height:52px;width:52px;border-radius:10px;background:${primary};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px">${_ledgerEscAttr(brand.logoText || (school.name || 'S').slice(0, 2).toUpperCase())}</div>`;

  const bodyRows = L.entries.map(e => {
    const balTxt = e.balance < 0 ? `${money(Math.abs(e.balance))} Cr` : money(e.balance);
    return `<tr>
      <td style="white-space:nowrap">${fdate(e.date, { short: true })}</td>
      <td>${_ledgerEscAttr(e.particulars)}</td>
      <td style="text-align:right;font-family:monospace">${e.debit ? money(e.debit) : ''}</td>
      <td style="text-align:right;font-family:monospace;color:#047857">${e.credit ? money(e.credit) : ''}</td>
      <td style="text-align:right;font-family:monospace;font-weight:600">${balTxt}</td>
    </tr>`;
  }).join('');

  const closingLabel = owed < 0 ? 'Credit balance in favour of parent' : (owed === 0 ? 'Account settled — nil balance' : 'Balance due');
  const closingValue = owed < 0 ? `${money(Math.abs(owed))} Cr` : money(owed);

  const html = `
    <div style="max-width:760px;margin:0 auto;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid ${primary};padding-bottom:14px;margin-bottom:18px">
        ${logo}
        <div style="flex:1">
          <h1 style="margin:0;font-size:22px;color:${primary}">${_ledgerEscAttr((school.name || 'School').toUpperCase())}</h1>
          <div style="font-size:12px;color:#64748b">${_ledgerEscAttr(school.address || '')}${school.phone ? ' · ' + _ledgerEscAttr(school.phone) : ''}${school.email ? ' · ' + _ledgerEscAttr(school.email) : ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:15px;font-weight:800;letter-spacing:.5px">STATEMENT OF ACCOUNT</div>
          <div style="font-size:11px;color:#64748b">Generated ${fdate(now(), { long: true })}</div>
        </div>
      </div>

      <table style="width:100%;font-size:13px;margin-bottom:14px;border:none">
        <tr>
          <td style="border:none;padding:2px 0"><strong>Student:</strong> ${_ledgerEscAttr(s.name)}</td>
          <td style="border:none;padding:2px 0;text-align:right"><strong>Admission No:</strong> ${_ledgerEscAttr(s.admissionNo || '—')}</td>
        </tr>
        <tr>
          <td style="border:none;padding:2px 0"><strong>Class:</strong> ${_ledgerEscAttr(cls ? cls.name : '—')}</td>
          <td style="border:none;padding:2px 0;text-align:right"><strong>Parent/Guardian:</strong> ${_ledgerEscAttr(parent ? parent.name : '—')}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="text-align:left;padding:8px;border:1px solid #e2e8f0">Date</th>
            <th style="text-align:left;padding:8px;border:1px solid #e2e8f0">Particulars</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0">Debit</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0">Credit</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0">No transactions yet.</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc;font-weight:700">
            <td colspan="2" style="padding:8px;border:1px solid #e2e8f0">Totals</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-family:monospace">${money(L.debitTotal)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-family:monospace">${money(L.creditTotal)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-family:monospace">${owed < 0 ? money(Math.abs(owed)) + ' Cr' : money(owed)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <div style="min-width:280px;background:${owed <= 0 ? '#ecfdf5' : '#fff7ed'};border:1px solid ${owed <= 0 ? '#a7f3d0' : '#fed7aa'};border-radius:10px;padding:12px 16px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b">${closingLabel}</div>
          <div style="font-size:22px;font-weight:800;color:${owed <= 0 ? '#047857' : '#b45309'}">${closingValue}</div>
        </div>
      </div>

      <p style="margin-top:28px;text-align:center;color:#94a3b8;font-size:11px">
        This is a computer-generated statement and does not require a signature.<br/>
        Powered by CASPAA School Operating System · ${fdate(now(), { short: true })}
      </p>
    </div>`;
  printElement(html);
}

/* ---------------------------------------------------------------------------
   Editable bill — add / edit / remove charge line items on the student's
   current-term invoice (stakeholder point 7: "Can bills be editable?").
   Discounts are handled by the existing applyDiscountModal.
--------------------------------------------------------------------------- */
function ledgerAddDiscount(studentId) {
  const inv = COMPUTE.studentInvoice(studentId) || DB.query('invoices', i => i.studentId === studentId).slice(-1)[0];
  if (!inv) { toast('No invoice to discount — edit the bill first', 'warn'); return; }
  if (typeof applyDiscountModal === 'function') applyDiscountModal(inv.id);
}

function ledgerEditBill(studentId) {
  const invoices = DB.query('invoices', i => i.studentId === studentId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!invoices.length) { toast('This student has no invoice yet', 'warn'); return; }
  // Default to current-term invoice; if several exist, let the admin pick.
  const current = COMPUTE.studentInvoice(studentId) || invoices[0];
  if (invoices.length > 1) {
    modal({
      title: 'Choose bill to edit',
      body: `<div class="space-y-2">${invoices.map(inv => `
        <button class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition" onclick="document.getElementById('modalBackdrop')?.click(); editBillModal('${inv.id}')">
          <div class="font-semibold text-sm">${inv.term}</div>
          <div class="text-xs text-slate-500">Total ${money(inv.total)} · Balance ${money(inv.balance)} · ${inv.status}</div>
        </button>`).join('')}</div>`,
      footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>`
    });
  } else {
    editBillModal(current.id);
  }
}

let _billRowSeq = 0;
function _billRowHtml(name, amount) {
  const i = _billRowSeq++;
  return `
    <div class="bill-row flex items-center gap-2" data-row="${i}">
      <input class="input flex-1 bill-name" value="${_ledgerEscAttr(name || '')}" placeholder="Item (e.g. Tuition Fee, Bus Service)" />
      <input class="input w-32 bill-amt" type="number" value="${amount != null ? amount : ''}" placeholder="Amount" />
      <button type="button" class="btn btn-secondary !px-2 text-rose-600" onclick="this.closest('.bill-row').remove()" title="Remove line">✕</button>
    </div>`;
}

function editBillModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const s = DB.find('students', inv.studentId);
  _billRowSeq = 0;
  const rows = (inv.lineItems || []).map(li => _billRowHtml(li.name, li.amount)).join('');
  modal({
    title: 'Edit Bill',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Editing <strong>${s ? s.name : 'student'}</strong> — ${inv.term}. Use a <strong>negative amount</strong> for a discount line.
          Paid to date: <strong>${money(inv.paid)}</strong> (payments are not changed here).
        </div>
        <div id="billRows" class="space-y-2">${rows}</div>
        <button type="button" class="btn btn-secondary text-xs" onclick="document.getElementById('billRows').insertAdjacentHTML('beforeend', _billRowHtml())">${icon('plus','w-4 h-4')} Add line item</button>
        <div id="billLiveTotal" class="text-right text-sm font-semibold text-slate-600 pt-2 border-t border-slate-100"></div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveBillEdits('${invoiceId}')">${icon('check','w-4 h-4')} Save Bill</button>`
  });
  // Live total
  const recalc = () => {
    let t = 0;
    document.querySelectorAll('#billRows .bill-row').forEach(r => { t += parseFloat(r.querySelector('.bill-amt').value) || 0; });
    const el = document.getElementById('billLiveTotal');
    if (el) el.textContent = `Bill total: ${money(t)} · Balance after paid: ${money(Math.max(0, t - inv.paid))}`;
  };
  setTimeout(() => {
    const box = document.getElementById('billRows');
    if (box) { box.addEventListener('input', recalc); recalc(); }
    const addBtn = box ? box.nextElementSibling : null;
    if (addBtn) addBtn.addEventListener('click', () => setTimeout(recalc, 0));
  }, 60);
}

function saveBillEdits(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const lineItems = [];
  let bad = false;
  document.querySelectorAll('#billRows .bill-row').forEach(r => {
    const name = (r.querySelector('.bill-name').value || '').trim();
    const amtRaw = r.querySelector('.bill-amt').value;
    if (name === '' && amtRaw === '') return;                 // skip fully-blank line
    const amount = parseFloat(amtRaw);
    if (!name || isNaN(amount)) { bad = true; return; }
    const item = { name, amount };
    if (amount < 0) item.type = 'discount';
    lineItems.push(item);
  });
  if (bad) { toast('Each line needs a name and a numeric amount', 'danger'); return; }
  if (!lineItems.length) { toast('A bill needs at least one line item', 'danger'); return; }

  const total = lineItems.reduce((sum, l) => sum + l.amount, 0);
  if (total < 0) { toast('Bill total cannot be negative', 'danger'); return; }
  const balance = Math.max(0, total - inv.paid);
  const status = balance === 0 ? 'paid' : (inv.paid > 0 ? 'partial' : 'outstanding');
  DB.update('invoices', invoiceId, { lineItems, total, balance, status });

  const s = DB.find('students', inv.studentId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: inv.schoolId, actor: AUTH.current.id, action: 'edited_bill', target: `${s ? s.name : inv.studentId} · ${inv.term} → ${money(total)}`, timestamp: now() });
  if (s && s.parentId) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Bill Updated', body: `${s.name}'s bill for ${inv.term} was updated. New total: ${money(total)}, balance ${money(balance)}.`, type: 'info', read: false, timestamp: now(), link: { view: 'par_fees' } });
  document.getElementById('modalBackdrop')?.click();
  toast('Bill updated', 'success');
  APP.render();
}

/* ---------------------------------------------------------------------------
   Opening balance brought forward (stakeholder points 3 & 5).
   Stored as a single walletLedger entry (category 'opening'); re-saving
   replaces the previous one so a student never has two.
--------------------------------------------------------------------------- */
function openingBalanceModal(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const existing = DB.query('walletLedger', e => e.studentId === studentId && e.category === 'opening')[0];
  const dir = existing ? existing.type : 'debit';
  modal({
    title: 'Opening Balance',
    body: `
      <div class="space-y-3">
        <p class="text-sm text-slate-600">Carry a balance forward from a previous term/session onto <strong>${s.name}</strong>'s account. It appears as the first line of the statement.</p>
        <div>
          <label class="input-label" for="ob_dir">Type</label>
          <select id="ob_dir" class="input">
            <option value="debit" ${dir === 'debit' ? 'selected' : ''}>Owing brought forward (student owes)</option>
            <option value="credit" ${dir === 'credit' ? 'selected' : ''}>Credit brought forward (in the parent's favour)</option>
          </select>
        </div>
        <div><label class="input-label" for="ob_amount">Amount (₦)</label><input id="ob_amount" type="number" min="0" class="input" value="${existing ? existing.amount : ''}" placeholder="e.g. 50000" /></div>
        <div><label class="input-label" for="ob_desc">Description</label><input id="ob_desc" class="input" value="${_ledgerEscAttr(existing ? existing.description : 'Opening balance b/f')}" /></div>
        ${existing ? `<button type="button" class="text-xs text-rose-600 font-semibold underline" onclick="clearOpeningBalance('${studentId}')">Remove opening balance</button>` : ''}
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveOpeningBalance('${studentId}')">Save</button>`
  });
}

function saveOpeningBalance(studentId) {
  const s = DB.find('students', studentId);
  const type = document.getElementById('ob_dir').value === 'credit' ? 'credit' : 'debit';
  const amount = parseInt(document.getElementById('ob_amount').value) || 0;
  const desc = (document.getElementById('ob_desc').value || 'Opening balance b/f').trim();
  if (amount <= 0) { toast('Enter a valid amount', 'danger'); return; }
  // Replace any existing opening entry
  DB.query('walletLedger', e => e.studentId === studentId && e.category === 'opening').forEach(e => DB.remove('walletLedger', e.id));
  DB.insert('walletLedger', { id: uid('wl'), schoolId: s ? s.schoolId : currentSchoolId(), studentId, category: 'opening', type, amount, description: desc, createdBy: AUTH.current.id, createdAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: s ? s.schoolId : currentSchoolId(), actor: AUTH.current.id, action: 'set_opening_balance', target: `${s ? s.name : studentId} · ${type} ${money(amount)}`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast('Opening balance saved', 'success');
  APP.render();
}

function clearOpeningBalance(studentId) {
  DB.query('walletLedger', e => e.studentId === studentId && e.category === 'opening').forEach(e => DB.remove('walletLedger', e.id));
  document.getElementById('modalBackdrop')?.click();
  toast('Opening balance removed', 'info');
  APP.render();
}

/* ---------------------------------------------------------------------------
   Activate / deactivate a student account (stakeholder point 6 — a student
   who leaves and later returns). Toggles between 'active' and 'inactive';
   a withdrawn/suspended student can be reactivated straight to 'active'.
--------------------------------------------------------------------------- */
function toggleStudentAccount(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const activating = s.status !== 'active';
  modal({
    title: activating ? 'Activate Account' : 'Deactivate Account',
    body: `<p class="text-sm text-slate-600">${activating
      ? `Reactivate <strong>${s.name}</strong>'s account? They will appear in class lists and be billable again.`
      : `Deactivate <strong>${s.name}</strong>'s account? They will be hidden from active class lists but their ledger and history are preserved. You can reactivate any time they return.`}</p>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn ${activating ? 'btn-primary' : 'btn-danger'}" onclick="confirmToggleStudentAccount('${studentId}')">${activating ? 'Activate' : 'Deactivate'}</button>`
  });
}

function confirmToggleStudentAccount(studentId) {
  const s = DB.find('students', studentId);
  if (!s) return;
  const activating = s.status !== 'active';
  const patch = activating
    ? { status: 'active', reactivatedAt: now() }
    : { status: 'inactive', deactivatedAt: now() };
  DB.update('students', studentId, patch);
  DB.insert('auditLog', { id: uid('aud'), schoolId: s.schoolId, actor: AUTH.current.id, action: activating ? 'activated_student' : 'deactivated_student', target: s.name, timestamp: now() });
  if (s.parentId) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: activating ? 'Account Reactivated' : 'Account Deactivated', body: `${s.name}'s account has been ${activating ? 'reactivated' : 'deactivated'}.`, type: activating ? 'success' : 'info', read: false, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast(`${s.name} ${activating ? 'activated' : 'deactivated'}`, activating ? 'success' : 'info');
  APP.render();
}
