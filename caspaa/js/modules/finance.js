/* ============================================================
   FINANCE OFFICER MODULE
   ============================================================ */

function view_fin_dashboard() {
  const schoolId = 'sch_brightlights';
  const invoices = DB.query('invoices', i => i.schoolId === schoolId);
  const txns = DB.query('transactions', t => t.schoolId === schoolId && t.status === 'successful');
  const expenses = DB.query('expenses', e => e.schoolId === schoolId);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const expense = expenses.reduce((s, e) => s + e.amount, 0);
  const netCash = collected - expense;
  const unreconciled = DB.query('transactions', t => t.schoolId === schoolId && !t.reconciled).length;

  window.afterRender = () => {
    const ctx1 = document.getElementById('finChart1');
    if (ctx1) {
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Collected', 'Outstanding'],
          datasets: [{ data: [collected, outstanding], backgroundColor: ['#047857', '#fbbf24'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
      });
    }
    const ctx2 = document.getElementById('finChart2');
    if (ctx2) {
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            { label: 'Income', data: [3200000, 3800000, 4100000, 3900000, 4500000, collected], backgroundColor: '#10b981', borderRadius: 6 },
            { label: 'Expenses', data: [2400000, 2600000, 2800000, 2500000, 2700000, expense], backgroundColor: '#ef4444', borderRadius: 6 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { ticks: { callback: v => '₦' + (v/1000000).toFixed(1) + 'M' } } } }
      });
    }
  };

  return `
    <div class="space-y-5">
      ${pageHeader({ title: 'Finance Overview', subtitle: 'Real-time view of school finances' })}

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'Total Collected', value: money(collected), icon: 'fees', color: 'brand', trend: { direction: 'up', label: '+18% MoM' } })}
        ${statCard({ label: 'Outstanding', value: money(outstanding), icon: 'bell', color: 'gold' })}
        ${statCard({ label: 'Expenses', value: money(expense), icon: 'trending_down', color: 'rose' })}
        ${statCard({ label: 'Net Cashflow', value: money(netCash), icon: 'trending_up', color: 'blue' })}
      </div>

      ${unreconciled ? `<div class="card bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
        <div class="flex items-center gap-3"><div class="text-amber-700">${icon('bell','w-5 h-5')}</div>
          <div><div class="font-semibold text-amber-900">${unreconciled} transaction${unreconciled>1?'s':''} unreconciled</div>
          <div class="text-sm text-amber-800">Review and confirm to update student balances.</div></div>
        </div>
        <button class="btn btn-primary !py-1.5" onclick="APP.go('fin_recon')">Review</button>
      </div>` : ''}

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3">Fee Collection</h3>
          <div style="height: 200px;"><canvas id="finChart1"></canvas></div>
          <p class="text-center text-sm text-slate-600 mt-2"><strong>${Math.round((collected/(collected+outstanding))*100)}%</strong> of fees collected this term</p>
        </div>
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-bold text-slate-900 mb-3">Income vs Expenses (6 months)</h3>
          <div style="height: 200px;"><canvas id="finChart2"></canvas></div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Recent Payments</h3>
            <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('fin_payments')">See all →</button>
          </div>
          <div class="space-y-2">
            ${txns.slice(-5).reverse().map(t => {
              const s = DB.find('students', t.studentId);
              return `<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div class="flex items-center gap-3">
                  ${avatar(s ? s.name : '?', 'sm')}
                  <div>
                    <div class="font-semibold text-sm">${s ? s.name : '—'}</div>
                    <div class="text-xs text-slate-500">${t.method.toUpperCase()} · ${fdate(t.timestamp, { relative: true })}</div>
                  </div>
                </div>
                <div class="font-bold font-mono text-emerald-700">${money(t.amount)}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Top Debtors</h3>
          </div>
          <div class="space-y-2">
            ${invoices.filter(i => i.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5).map(i => {
              const s = DB.find('students', i.studentId);
              const p = DB.find('parents', s.parentId);
              return `<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div class="font-semibold text-sm">${s.name}</div>
                  <div class="text-xs text-slate-500">${p ? p.name : ''}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold font-mono text-rose-700">${money(i.balance)}</div>
                  <button class="text-xs text-brand-700 font-semibold" onclick="sendReminder('${i.id}')">Send reminder</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function sendReminder(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Fee Payment Reminder', body: `Your outstanding balance of ${money(inv.balance)} is overdue.`, type: 'warn', read: false, timestamp: now() });
  toast(`Reminder sent for ${s.name}`);
}

/* ---------- Fee Structure ---------- */
function view_fin_fees() {
  const structures = DB.get('feeStructures');
  const classes = DB.get('classes');
  return `
    ${pageHeader({
      title: 'Fee Structure',
      subtitle: 'Configure fees per class, term, and items',
      actions: `<button class="btn btn-primary" onclick="addFeeStructureModal()">${icon('plus','w-4 h-4')} New Structure</button>`
    })}
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Class</th><th>Term</th><th>Tuition</th><th>Books</th><th>Uniform</th><th>PTA</th><th>Total</th><th>Due</th></tr></thead>
        <tbody>
          ${structures.map(f => {
            const cls = classes.find(c => c.id === f.classId);
            const total = f.tuition + f.books + f.uniform + f.pta;
            return `<tr>
              <td class="font-semibold">${cls ? cls.name : '—'}</td>
              <td><span class="badge badge-info">${f.term}</span></td>
              <td class="font-mono">${money(f.tuition)}</td>
              <td class="font-mono">${money(f.books)}</td>
              <td class="font-mono">${money(f.uniform)}</td>
              <td class="font-mono">${money(f.pta)}</td>
              <td class="font-mono font-bold">${money(total)}</td>
              <td class="text-sm text-slate-500">${fdate(f.dueDate, { short: true })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function addFeeStructureModal() {
  toast('Edit fee structures directly in the table (demo)', 'info');
}

/* ---------- Invoices ---------- */
function view_fin_invoices() {
  const invoices = DB.query('invoices', i => i.schoolId === 'sch_brightlights');
  const filter = APP.params.invStatus || 'all';
  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return `
    ${pageHeader({ title: 'Invoices', subtitle: `${invoices.length} invoices for ${DB.settings().currentTerm}` })}
    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${filter==='all'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'all' })">All ${invoices.length}</button>
      <button class="chip ${filter==='paid'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'paid' })">Paid ${invoices.filter(i=>i.status==='paid').length}</button>
      <button class="chip ${filter==='partial'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'partial' })">Partial ${invoices.filter(i=>i.status==='partial').length}</button>
      <button class="chip ${filter==='outstanding'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'outstanding' })">Outstanding ${invoices.filter(i=>i.status==='outstanding').length}</button>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due</th><th></th></tr></thead>
        <tbody>
          ${filtered.map(inv => {
            const s = DB.find('students', inv.studentId);
            const cls = DB.find('classes', s.classId);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span class="font-medium">${s.name}</span></div></td>
              <td>${cls ? cls.name : '—'}</td>
              <td class="font-mono">${money(inv.total)}</td>
              <td class="font-mono text-emerald-700">${money(inv.paid)}</td>
              <td class="font-mono ${inv.balance > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}">${money(inv.balance)}</td>
              <td>${statusBadge(inv.status)}</td>
              <td class="text-sm text-slate-500">${fdate(inv.dueDate, { short: true })}</td>
              <td><button class="btn btn-ghost !p-1.5" onclick="viewInvoice('${inv.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Payments ---------- */
function view_fin_payments() {
  const txns = DB.query('transactions', t => t.schoolId === 'sch_brightlights').sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  const total = txns.filter(t => t.status === 'successful').reduce((s, t) => s + t.amount, 0);

  return `
    ${pageHeader({
      title: 'Payments',
      subtitle: `${txns.length} transactions · ${money(total)} processed`,
      actions: `<button class="btn btn-secondary" onclick="exportPayments()">${icon('download','w-4 h-4')} Export CSV</button>`
    })}
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Reference</th><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Reconciled</th><th>Date</th></tr></thead>
        <tbody>
          ${txns.map(t => {
            const s = DB.find('students', t.studentId);
            return `<tr>
              <td><code class="text-xs">${t.reference}</code></td>
              <td>${s ? s.name : '—'}</td>
              <td class="font-mono font-semibold">${money(t.amount)}</td>
              <td><span class="badge badge-neutral uppercase">${t.method}</span></td>
              <td>${statusBadge(t.status)}</td>
              <td>${t.reconciled ? '<span class="badge badge-success">Auto-matched</span>' : '<span class="badge badge-warn">Pending</span>'}</td>
              <td class="text-sm text-slate-500">${fdate(t.timestamp, { time: true })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportPayments() {
  const txns = DB.get('transactions');
  const csv = 'Reference,Student,Amount,Method,Status,Reconciled,Date\n' +
    txns.map(t => {
      const s = DB.find('students', t.studentId);
      return `${t.reference},"${s?s.name:''}",${t.amount},${t.method},${t.status},${t.reconciled},${t.timestamp}`;
    }).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_payments.csv'; a.click();
  toast('Payment ledger exported');
}

/* ---------- Reconciliation ---------- */
function view_fin_recon() {
  const unrec = DB.query('transactions', t => !t.reconciled);
  // Create a synthetic unreconciled transaction for demo
  if (unrec.length === 0) {
    DB.insert('transactions', {
      id: uid('txn'), schoolId: 'sch_brightlights',
      invoiceId: null, studentId: null,
      amount: 280000, method: 'transfer',
      reference: 'TRF-' + Math.random().toString(36).slice(2,10).toUpperCase(),
      status: 'successful', gateway: 'Paystack',
      timestamp: now(), reconciled: false,
      narration: 'TRSF/OKAFOR/SCH FEES JSS1'
    });
  }
  const unreconciled = DB.query('transactions', t => !t.reconciled);
  return `
    ${pageHeader({ title: 'Payment Reconciliation', subtitle: 'Match incoming payments to student invoices' })}
    <div class="card bg-blue-50 border border-blue-200 p-3 mb-4 text-sm text-blue-900">
      <strong>${unreconciled.length}</strong> incoming payment${unreconciled.length!==1?'s':''} need${unreconciled.length===1?'s':''} to be matched to a student. Auto-matching uses payment narration and amount.
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Reference</th><th>Narration</th><th>Amount</th><th>Method</th><th>Suggested Match</th><th></th></tr></thead>
        <tbody>
          ${unreconciled.map(t => {
            // AI/heuristic match: find a student with similar surname in narration
            const allStudents = DB.query('students', s => s.schoolId === 'sch_brightlights');
            const match = allStudents.find(s => (t.narration || '').toUpperCase().includes(s.name.split(' ').slice(-1)[0].toUpperCase()));
            return `<tr>
              <td><code class="text-xs">${t.reference}</code></td>
              <td class="text-sm">${t.narration || '—'}</td>
              <td class="font-mono font-bold">${money(t.amount)}</td>
              <td><span class="badge badge-neutral uppercase">${t.method}</span></td>
              <td>${match ? `<div class="flex items-center gap-2"><span class="badge badge-success">${icon('ai','w-3 h-3')} ${match.name}</span></div>` : '<span class="text-slate-400 text-sm">Manual</span>'}</td>
              <td><button class="btn btn-primary !py-1.5 text-xs" onclick="reconcileTxn('${t.id}', '${match ? match.id : ''}')">${icon('check','w-3 h-3')} Match</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function reconcileTxn(txnId, studentId) {
  if (!studentId) { toast('No matching student found — manual match needed', 'warn'); return; }
  const inv = DB.query('invoices', i => i.studentId === studentId)[0];
  const txn = DB.find('transactions', txnId);
  if (inv && txn) {
    DB.update('invoices', inv.id, { paid: inv.paid + txn.amount, balance: Math.max(0, inv.balance - txn.amount), status: (inv.balance - txn.amount <= 0) ? 'paid' : 'partial' });
    DB.update('transactions', txnId, { reconciled: true, studentId, invoiceId: inv.id });
    toast('Transaction matched and student balance updated', 'success');
    APP.render();
  }
}

/* ---------- Expenses ---------- */
function view_fin_expenses() {
  const expenses = DB.get('expenses');
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  return `
    ${pageHeader({
      title: 'Expenses',
      subtitle: `${expenses.length} entries · ${money(total)} total`,
      actions: `<button class="btn btn-primary" onclick="addExpenseModal()">${icon('plus','w-4 h-4')} Add Expense</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      ${Object.entries(byCategory).map(([cat, amt]) => `<div class="stat">
        <div class="stat-label">${cat}</div>
        <div class="stat-value text-lg">${money(amt)}</div>
      </div>`).join('')}
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          ${expenses.sort((a,b) => b.date.localeCompare(a.date)).map(e => `<tr>
            <td class="text-sm text-slate-500">${fdate(e.date, { long: true })}</td>
            <td><span class="badge badge-info">${e.category}</span></td>
            <td>${e.description}</td>
            <td class="font-mono font-semibold text-rose-700">${money(e.amount)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function addExpenseModal() {
  modal({
    title: 'Record Expense',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Date</label><input id="ex_date" type="date" class="input" value="${today()}" /></div>
        <div><label class="input-label">Category</label>
          <select id="ex_cat" class="input"><option>Salaries</option><option>Utilities</option><option>Maintenance</option><option>Supplies</option><option>Internet</option><option>Transport</option><option>Other</option></select>
        </div>
        <div><label class="input-label">Amount (NGN)</label><input id="ex_amt" type="number" class="input" /></div>
        <div><label class="input-label">Description</label><textarea id="ex_desc" class="input" rows="2"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveExpense()">Record Expense</button>`
  });
}

function saveExpense() {
  DB.insert('expenses', {
    id: uid('exp'), schoolId: 'sch_brightlights',
    date: document.getElementById('ex_date').value,
    category: document.getElementById('ex_cat').value,
    amount: parseInt(document.getElementById('ex_amt').value) || 0,
    description: document.getElementById('ex_desc').value.trim(),
    recordedBy: AUTH.current.id
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Expense recorded');
}

/* ---------- Lending (school side) ---------- */
function view_fin_lending() {
  const loans = DB.get('loans');
  const active = loans.filter(l => l.status === 'active');
  const totalDisbursed = active.reduce((s, l) => s + l.amount, 0);
  const totalRepaid = active.reduce((s, l) => s + l.repayments.filter(r => r.paid).reduce((x, r) => x + r.amount, 0), 0);
  const pending = loans.filter(l => l.status === 'pending');

  return `
    ${pageHeader({ title: 'Lending Book', subtitle: 'Parent fee loans managed via CASPAA' })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Loans', value: active.length, icon: 'loan', color: 'brand' })}
      ${statCard({ label: 'Total Disbursed', value: money(totalDisbursed), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Repaid', value: money(totalRepaid), icon: 'check', color: 'blue' })}
      ${statCard({ label: 'Awaiting Decision', value: pending.length, icon: 'bell', color: 'rose' })}
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Parent</th><th>Amount</th><th>Term</th><th>Credit Score</th><th>Repaid</th><th>Next Payment</th><th>Status</th></tr></thead>
        <tbody>
          ${loans.map(l => {
            const p = DB.find('parents', l.parentId);
            const repaid = l.repayments.filter(r => r.paid).reduce((s, r) => s + r.amount, 0);
            const next = l.repayments.find(r => !r.paid);
            return `<tr>
              <td><div class="flex items-center gap-2">${avatar(p ? p.name : '?', 'sm')}<span>${p ? p.name : '—'}</span></div></td>
              <td class="font-mono">${money(l.amount)}</td>
              <td>${l.term ? l.term + ' months' : '—'}</td>
              <td><strong>${l.creditScore || '—'}</strong></td>
              <td class="font-mono">${money(repaid)}</td>
              <td class="text-sm">${next ? fdate(next.dueDate, { short: true }) : '—'}</td>
              <td>${statusBadge(l.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${pending.length ? `<div class="card p-4 mt-4 bg-amber-50 border border-amber-200">
      <h4 class="font-semibold text-amber-900 mb-3">${pending.length} pending application${pending.length>1?'s':''} — review before deciding</h4>
      <div class="space-y-2">
        ${pending.map(l => {
          const p = DB.find('parents', l.parentId);
          const live = COMPUTE.computeCreditScore(l.parentId);
          return `<div class="flex items-center justify-between bg-white rounded-xl p-3 gap-3 flex-wrap">
            <div class="flex items-center gap-3 min-w-0">
              ${avatar(p ? p.name : '?', 'md')}
              <div class="min-w-0">
                <div class="font-semibold text-slate-900">${p ? p.name : '—'}</div>
                <div class="text-xs text-slate-500">Requested ${money(l.amount)} · ${l.term}-month term · Applied ${fdate(l.appliedAt, { relative: true })}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="text-xs text-slate-500 uppercase">Score</div>
                <div class="font-bold text-lg ${live >= 700 ? 'text-emerald-600' : live >= 600 ? 'text-amber-600' : 'text-rose-600'}">${live}</div>
              </div>
              <button class="btn btn-primary" onclick="reviewLoanApplication('${l.id}')">${icon('search','w-4 h-4')} Review Application</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}

/* ---------- Loan Application Review (rich modal) ---------- */
function reviewLoanApplication(loanId) {
  const loan = DB.find('loans', loanId);
  if (!loan) { toast('Application not found', 'danger'); return; }
  const parent = DB.find('parents', loan.parentId);
  const children = loan.studentIds.map(id => DB.find('students', id)).filter(Boolean);
  const liveScore = COMPUTE.computeCreditScore(loan.parentId);
  const childInvoices = children.map(c => COMPUTE.studentInvoice(c.id)).filter(Boolean);
  const totalChildFees = childInvoices.reduce((s, i) => s + i.balance, 0);
  const interest = Math.round(loan.amount * 0.05);
  const totalRepay = loan.amount + interest;
  const monthly = Math.round(totalRepay / loan.term);

  // Risk flags
  const flags = [];
  if (loan.amount > parent.monthlyIncome * 1.5) flags.push({ level: 'warn', text: 'Loan exceeds 150% of declared monthly income' });
  if (liveScore < 600) flags.push({ level: 'danger', text: `Credit score (${liveScore}) is below threshold` });
  if (totalChildFees > loan.amount) flags.push({ level: 'warn', text: `Requested amount won't fully cover outstanding fees (${money(totalChildFees)})` });
  if (liveScore >= 700) flags.push({ level: 'ok', text: 'Strong credit history — auto-approve recommended' });

  const scoreClass = liveScore >= 700
    ? { grad: 'from-emerald-500 to-emerald-700', label: 'Excellent', txt: 'text-emerald-100' }
    : liveScore >= 600
    ? { grad: 'from-amber-500 to-amber-700', label: 'Good', txt: 'text-amber-100' }
    : { grad: 'from-rose-500 to-rose-700', label: 'Fair', txt: 'text-rose-100' };

  modal({
    title: 'Loan Application Review',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <!-- Applicant header -->
        <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
          ${avatar(parent.name, 'xl')}
          <div class="flex-1">
            <h2 class="text-xl font-bold text-slate-900">${parent.name}</h2>
            <p class="text-sm text-slate-500">${parent.occupation} · ${parent.phone}</p>
            <p class="text-xs text-slate-400">${parent.address || ''}</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500 uppercase">Applied</div>
            <div class="text-sm font-semibold">${fdate(loan.appliedAt, { long: true })}</div>
          </div>
        </div>

        <!-- Credit score band -->
        <div class="rounded-2xl p-4 bg-gradient-to-br ${scoreClass.grad} text-white">
          <div class="flex items-end justify-between">
            <div>
              <div class="${scoreClass.txt} text-xs uppercase font-semibold">CASPAA Credit Score</div>
              <div class="text-5xl font-extrabold leading-none mt-1">${liveScore}</div>
              <div class="${scoreClass.txt} text-sm mt-1">${scoreClass.label}</div>
            </div>
            <div class="text-right text-sm">
              <div class="${scoreClass.txt}">Range: 300 – 850</div>
              <div class="${scoreClass.txt}">Threshold: 580</div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 mt-4 text-xs">
            <div class="bg-white/15 rounded-lg p-2"><div class="${scoreClass.txt}">Payment History</div><div class="font-bold">${liveScore >= 650 ? 'Strong' : 'Average'}</div></div>
            <div class="bg-white/15 rounded-lg p-2"><div class="${scoreClass.txt}">Income Tier</div><div class="font-bold">${money(parent.monthlyIncome)}/mo</div></div>
            <div class="bg-white/15 rounded-lg p-2"><div class="${scoreClass.txt}">School Tenure</div><div class="font-bold">2+ yrs</div></div>
            <div class="bg-white/15 rounded-lg p-2"><div class="${scoreClass.txt}">Prior Loans</div><div class="font-bold">${DB.query('loans', x => x.parentId === parent.id && x.status === 'active').length}</div></div>
          </div>
        </div>

        <!-- Requested terms -->
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4 border border-slate-200">
            <div class="text-xs text-slate-500 uppercase font-semibold">Amount Requested</div>
            <div class="text-2xl font-extrabold text-slate-900">${money(loan.amount)}</div>
            <div class="text-xs text-slate-500 mt-1">Over ${loan.term} months @ 5% interest</div>
          </div>
          <div class="card p-4 border border-slate-200">
            <div class="text-xs text-slate-500 uppercase font-semibold">Monthly Payment</div>
            <div class="text-2xl font-extrabold text-brand-700">${money(monthly)}</div>
            <div class="text-xs text-slate-500 mt-1">Total to repay: ${money(totalRepay)}</div>
          </div>
        </div>

        <!-- Children covered -->
        <div>
          <h4 class="font-bold text-sm text-slate-900 uppercase tracking-wide mb-2">Children Covered (${children.length})</h4>
          <div class="space-y-2">
            ${children.map(c => {
              const cls = DB.find('classes', c.classId);
              const inv = COMPUTE.studentInvoice(c.id);
              return `<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-2">
                  ${avatar(c.name, 'sm')}
                  <div>
                    <div class="font-semibold text-sm">${c.name}</div>
                    <div class="text-xs text-slate-500">${cls ? cls.name : ''}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-slate-500">Outstanding</div>
                  <div class="font-mono font-semibold ${inv && inv.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}">${money(inv ? inv.balance : 0)}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        ${loan.reason ? `<div>
          <h4 class="font-bold text-sm text-slate-900 uppercase tracking-wide mb-2">Reason</h4>
          <div class="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">${loan.reason}</div>
        </div>` : ''}

        <!-- Risk flags -->
        <div>
          <h4 class="font-bold text-sm text-slate-900 uppercase tracking-wide mb-2">Risk Engine Analysis</h4>
          <div class="space-y-1.5">
            ${flags.length ? flags.map(f => {
              const color = f.level === 'danger' ? 'bg-rose-50 text-rose-800 border-rose-200' : f.level === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
              const ic = f.level === 'ok' ? 'check' : 'bell';
              return `<div class="flex items-start gap-2 p-2.5 rounded-xl border ${color}">${icon(ic,'w-4 h-4 mt-0.5 flex-shrink-0')}<div class="text-sm">${f.text}</div></div>`;
            }).join('') : '<div class="text-sm text-slate-500">No risk flags raised.</div>'}
          </div>
        </div>

        <!-- Adjust offer -->
        <details class="bg-slate-50 rounded-xl">
          <summary class="cursor-pointer p-3 font-semibold text-sm">Counter-offer (adjust amount or term)</summary>
          <div class="p-3 pt-0 grid grid-cols-2 gap-2">
            <div><label class="input-label">New Amount</label><input id="rev_amount" type="number" class="input" value="${loan.amount}" /></div>
            <div><label class="input-label">New Term (months)</label><input id="rev_term" type="number" class="input" value="${loan.term}" /></div>
          </div>
        </details>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      <button class="btn btn-danger" onclick="rejectLoanModal('${loanId}')">${icon('x','w-4 h-4')} Reject</button>
      <button class="btn btn-primary" onclick="approveLoan('${loanId}')">${icon('check','w-4 h-4')} Approve</button>
    `
  });
}

function approveLoan(loanId) {
  const loan = DB.find('loans', loanId);
  const score = COMPUTE.computeCreditScore(loan.parentId);
  // Use review form values if present, otherwise fall back to the parent's requested values
  const newAmt = document.getElementById('rev_amount');
  const newTerm = document.getElementById('rev_term');
  const amount = newAmt ? (parseInt(newAmt.value) || loan.amount) : loan.amount;
  const term = newTerm ? (parseInt(newTerm.value) || loan.term) : loan.term;
  const interest = Math.round(amount * 0.05);
  const total = amount + interest;
  const monthly = Math.round(total / term);
  const repayments = [];
  for (let m = 1; m <= term; m++) {
    repayments.push({ dueDate: daysAhead(30 * m), amount: monthly, paid: false });
  }
  DB.update('loans', loanId, { status: 'active', creditScore: score, amount, term, interestRate: 5, totalRepayment: total, monthlyPayment: monthly, repayments, approvedAt: now() });
  DB.insert('notifications', { id: uid('not'), userId: loan.parentId, title: 'Loan Approved!', body: `Your loan of ${money(amount)} has been approved and disbursed.`, type: 'success', read: false, timestamp: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: loan.schoolId, actor: AUTH.current.id, action: 'approved_loan', target: `${money(amount)} for ${DB.find('parents', loan.parentId).name}`, timestamp: now() });
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  toast(`Loan of ${money(amount)} approved and disbursed`, 'success');
  APP.render();
}

function rejectLoanModal(loanId) {
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  modal({
    title: 'Reject Application',
    body: `
      <p class="text-sm text-slate-600 mb-3">The applicant will be told the decision. A clear reason helps them know what to do next.</p>
      <label class="input-label">Reason for rejection</label>
      <select id="rej_reason" class="input mb-3">
        <option value="insufficient_history">Insufficient payment history</option>
        <option value="income_mismatch">Loan amount too high for income</option>
        <option value="existing_default">Existing default on previous loan</option>
        <option value="incomplete_info">Application information incomplete</option>
        <option value="other">Other</option>
      </select>
      <label class="input-label">Note to applicant (optional)</label>
      <textarea id="rej_note" rows="3" class="input" placeholder="e.g. We'd be glad to revisit after the next term's payments."></textarea>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-danger" onclick="rejectLoan('${loanId}')">${icon('x','w-4 h-4')} Confirm Rejection</button>
    `
  });
}

function rejectLoan(loanId) {
  const loan = DB.find('loans', loanId);
  const reasonSel = document.getElementById('rej_reason');
  const noteEl = document.getElementById('rej_note');
  const reasonMap = {
    insufficient_history: 'Insufficient payment history',
    income_mismatch: 'Loan amount exceeds income capacity',
    existing_default: 'Outstanding default on a prior loan',
    incomplete_info: 'Application is incomplete',
    other: 'Did not meet current lending criteria'
  };
  const reason = reasonSel ? reasonMap[reasonSel.value] : 'Did not meet current lending criteria';
  const note = noteEl ? noteEl.value.trim() : '';
  DB.update('loans', loanId, { status: 'rejected', rejectionReason: reason, rejectionNote: note, decidedAt: now() });
  DB.insert('notifications', { id: uid('not'), userId: loan.parentId, title: 'Loan Decision', body: `We weren't able to approve this loan. Reason: ${reason}${note ? ' — ' + note : ''}`, type: 'warn', read: false, timestamp: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: loan.schoolId, actor: AUTH.current.id, action: 'rejected_loan', target: `${money(loan.amount)} for ${DB.find('parents', loan.parentId).name}`, timestamp: now() });
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  toast('Application rejected and applicant notified', 'info');
  APP.render();
}

/* ---------- Financial Reports ---------- */
function view_fin_reports() {
  const invoices = DB.query('invoices', i => i.schoolId === 'sch_brightlights');
  const txns = DB.query('transactions', t => t.schoolId === 'sch_brightlights' && t.status === 'successful');
  const expenses = DB.get('expenses');
  const totalRev = txns.reduce((s, t) => s + t.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRev - totalExp;

  return `
    ${pageHeader({
      title: 'Financial Reports',
      subtitle: 'P&L, cashflow, and audit-ready statements',
      actions: `<button class="btn btn-primary" onclick="exportPL()">${icon('download','w-4 h-4')} Export P&L (PDF)</button>`
    })}

    <div class="card p-5 mb-4">
      <h3 class="font-bold text-slate-900 mb-4">Profit & Loss · ${DB.settings().currentTerm}</h3>
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b"><td class="py-3 font-bold text-slate-900">REVENUE</td><td></td></tr>
          ${[['Tuition Fees', txns.reduce((s,t) => s + (t.amount * 0.65), 0)], ['Other Fees', txns.reduce((s,t) => s + (t.amount * 0.35), 0)]].map(([n, a]) => `<tr class="border-b"><td class="py-2 pl-4">${n}</td><td class="text-right font-mono">${money(a)}</td></tr>`).join('')}
          <tr class="border-b bg-emerald-50"><td class="py-2 font-bold">Total Revenue</td><td class="text-right font-bold font-mono text-emerald-700">${money(totalRev)}</td></tr>

          <tr class="border-b"><td class="py-3 font-bold text-slate-900 pt-4">EXPENSES</td><td></td></tr>
          ${Object.entries(expenses.reduce((a, e) => { a[e.category] = (a[e.category]||0) + e.amount; return a; }, {})).map(([n, a]) => `<tr class="border-b"><td class="py-2 pl-4">${n}</td><td class="text-right font-mono">${money(a)}</td></tr>`).join('')}
          <tr class="border-b bg-rose-50"><td class="py-2 font-bold">Total Expenses</td><td class="text-right font-bold font-mono text-rose-700">${money(totalExp)}</td></tr>

          <tr class="${profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}"><td class="py-3 font-extrabold text-lg">${profit >= 0 ? 'NET PROFIT' : 'NET LOSS'}</td><td class="text-right font-extrabold font-mono text-lg ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${money(Math.abs(profit))}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-2">Debtors List</h3>
        <p class="text-sm text-slate-500 mb-3">Parents with outstanding balances</p>
        <table class="w-full text-sm">
          <thead><tr class="border-b"><th class="text-left py-2">Parent / Student</th><th class="text-right">Owing</th></tr></thead>
          <tbody>
            ${invoices.filter(i => i.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 10).map(i => {
              const s = DB.find('students', i.studentId);
              return `<tr class="border-b"><td class="py-2">${s.name}</td><td class="text-right font-mono text-rose-700">${money(i.balance)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-2">Cashbook (Last 30 days)</h3>
        <table class="w-full text-sm">
          <tbody>
            ${[...txns.map(t => ({ ...t, type: 'in' })), ...expenses.map(e => ({ ...e, type: 'out' }))].sort((a,b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date)).slice(0, 10).map(item => `<tr class="border-b">
              <td class="py-2 text-xs text-slate-500">${fdate(item.timestamp || item.date, { short: true })}</td>
              <td class="py-2">${item.type === 'in' ? 'Payment' : item.category}</td>
              <td class="text-right font-mono ${item.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}">${item.type === 'in' ? '+' : '-'}${money(item.amount)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function exportPL() {
  const txns = DB.query('transactions', t => t.status === 'successful');
  const expenses = DB.get('expenses');
  const totalRev = txns.reduce((s, t) => s + t.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRev - totalExp;
  const html = `
    <h1>Bright Lights Academy</h1>
    <h2>Profit &amp; Loss Statement</h2>
    <p>${DB.settings().currentTerm}</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
      <tr><th align="left">REVENUE</th><th></th></tr>
      <tr><td>Total Fees Collected</td><td align="right">${money(totalRev)}</td></tr>
      <tr><th align="left">EXPENSES</th><th></th></tr>
      ${expenses.map(e => `<tr><td>${e.category} - ${e.description}</td><td align="right">${money(e.amount)}</td></tr>`).join('')}
      <tr><th align="left">Total Expenses</th><th align="right">${money(totalExp)}</th></tr>
      <tr style="background:${profit >= 0 ? '#d1fae5' : '#fee2e2'}"><th align="left">${profit >= 0 ? 'NET PROFIT' : 'NET LOSS'}</th><th align="right">${money(Math.abs(profit))}</th></tr>
    </table>
  `;
  printElement(html);
}
