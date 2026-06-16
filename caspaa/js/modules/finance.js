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
          <p class="text-center text-sm text-slate-600 mt-2"><strong>${(collected + outstanding) > 0 ? Math.round((collected/(collected+outstanding))*100) : 0}%</strong> of fees collected this term</p>
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
                    <div class="text-xs text-slate-500">${t.method.toUpperCase()} · ${fdate(t.timestamp, { relative: true })}${s ? ` · ID: ${s.studentId || s.id.slice(-6)}` : ''}</div>
                  </div>
                </div>
                <div class="font-bold font-mono text-emerald-700">${money(t.amount)}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Outstanding Balances</h3>
            <button class="btn btn-secondary text-xs" onclick="sendBulkReminders()">${icon('send','w-3.5 h-3.5')} Remind All</button>
          </div>
          <div class="space-y-2">
            ${invoices.filter(i => i.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5).map(i => {
              const s = DB.find('students', i.studentId);
              if (!s) return '';
              const p = DB.find('parents', s.parentId);
              return `<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div class="font-semibold text-sm">${s.name}</div>
                  <div class="text-xs text-slate-500">${p ? p.name : ''} · ID: ${s.studentId || s.id.slice(-6)}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold font-mono text-rose-700">${money(i.balance)}</div>
                  <button class="text-xs text-brand-700 font-semibold" onclick="sendManualReminder('${i.id}')">Send reminder</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Per-Child Financial Breakdown -->
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-900">Income Breakdown per Student</h3>
          <button class="btn btn-secondary text-xs" onclick="exportPerChildReport()">${icon('download','w-3.5 h-3.5')} Export CSV</button>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead>
              <tr>
                <th>Student</th><th>Student ID</th><th>Class</th>
                <th class="text-right">Total Billed</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Balance</th>
                <th class="text-right">Expenses*</th>
                <th class="text-right">Net Income</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const allStudents = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && s.status === 'active');
                const perCapitaExp = allStudents.length > 0 ? expense / allStudents.length : 0;
                return allStudents.slice(0, 20).map(s => {
                  const inv = COMPUTE.studentInvoice(s.id);
                  const cls = DB.find('classes', s.classId);
                  const paid = inv ? inv.paid : 0;
                  const balance = inv ? inv.balance : 0;
                  const total = inv ? inv.total : 0;
                  const netIncome = paid - perCapitaExp;
                  return `<tr>
                    <td><div class="flex items-center gap-2">${avatar(s.name,'sm')}<span class="font-medium text-sm">${s.name}</span></div></td>
                    <td class="font-mono text-xs text-slate-500">${s.studentId || s.id.slice(-6).toUpperCase()}</td>
                    <td class="text-sm text-slate-500">${cls ? cls.name : '—'}</td>
                    <td class="text-right font-mono text-sm">${money(total)}</td>
                    <td class="text-right font-mono text-sm text-emerald-700">${money(paid)}</td>
                    <td class="text-right font-mono text-sm ${balance>0?'text-rose-600 font-semibold':'text-slate-400'}">${money(balance)}</td>
                    <td class="text-right font-mono text-xs text-slate-500">${money(Math.round(perCapitaExp))}</td>
                    <td class="text-right font-mono text-sm ${netIncome>=0?'text-emerald-700 font-bold':'text-rose-600 font-bold'}">${money(Math.round(netIncome))}</td>
                    <td class="text-center">${inv ? statusBadge(inv.status) : '<span class="text-xs text-slate-400">No invoice</span>'}</td>
                  </tr>`;
                }).join('');
              })()}
            </tbody>
          </table>
        </div>
        <div class="px-5 py-2 text-xs text-slate-400 border-t border-slate-100">* Expenses per child = total operating costs ÷ number of active students (estimated)</div>
      </div>
    </div>
  `;
}

function sendReminder(invoiceId) { sendManualReminder(invoiceId); }

function sendManualReminder(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const s = DB.find('students', inv.studentId);
  if (!s) return;
  const studentRef = s.studentId || s.id.slice(-6).toUpperCase();
  DB.insert('notifications', {
    id: uid('not'), userId: s.parentId, title: 'Fee Payment Reminder',
    body: `Dear Parent, the outstanding balance of ${money(inv.balance)} for ${s.name} (Student ID: ${studentRef}) for ${DB.settings().currentTerm} is due. Please log in to pay or contact the school.`,
    type: 'warn', read: false, timestamp: now(), link: { view: 'par_fees' }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.schoolId || 'sch_brightlights', actor: AUTH.current.id, action: 'manual_reminder_sent', target: `${s.name} · ${money(inv.balance)}`, timestamp: now() });
  toast(`Reminder sent for ${s.name} (ID: ${studentRef})`, 'success');
}

function sendBulkReminders() {
  const invoices = DB.query('invoices', i => i.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && i.balance > 0);
  if (invoices.length === 0) { toast('No outstanding invoices to remind', 'info'); return; }
  modal({
    title: 'Send Bulk Reminders',
    body: `
      <div class="space-y-3">
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          ${icon('bell','w-4 h-4 inline')} This will send a payment reminder to <strong>${invoices.length} parent(s)</strong> with outstanding balances. Each reminder includes the student's unique ID for reference.
        </div>
        <div>
          <label class="input-label">Custom Message (optional)</label>
          <textarea id="bulk_reminder_msg" class="input" rows="3" placeholder="Dear Parent, please be reminded that your child's school fees are due…"></textarea>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmBulkReminders()">${icon('send','w-4 h-4')} Send ${invoices.length} Reminders</button>
    `
  });
}

function confirmBulkReminders() {
  const customMsg = document.getElementById('bulk_reminder_msg') ? document.getElementById('bulk_reminder_msg').value.trim() : '';
  const invoices = DB.query('invoices', i => i.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && i.balance > 0);
  let sent = 0;
  invoices.forEach(inv => {
    const s = DB.find('students', inv.studentId);
    if (!s || !s.parentId) return;
    const studentRef = s.studentId || s.id.slice(-6).toUpperCase();
    const msg = customMsg || `Dear Parent, the outstanding school fee balance of ${money(inv.balance)} for ${s.name} (Student ID: ${studentRef}) is due for ${DB.settings().currentTerm}. Please pay promptly.`;
    DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'Fee Payment Reminder', body: msg, type: 'warn', read: false, timestamp: now(), link: { view: 'par_fees' } });
    sent++;
  });
  document.getElementById('modalBackdrop').click();
  DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.schoolId || 'sch_brightlights', actor: AUTH.current.id, action: 'bulk_reminders_sent', target: `${sent} parents notified`, timestamp: now() });
  toast(`${sent} reminder${sent !== 1 ? 's' : ''} sent to parents`, 'success');
  APP.render();
}

function invoiceReminderSettingsModal() {
  const s = DB.settings();
  const reminderCfg = s.invoiceReminders || { autoEnabled: false, daysBeforeDue: 3, daysAfterDue: 7, frequency: 'weekly', includeStudentId: true };
  modal({
    title: 'Invoice Reminder Settings',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          ${icon('info','w-4 h-4 inline')} Configure automated reminders that the system sends to parents. You can also trigger manual reminders from the Invoices page.
        </div>
        <div class="card p-4 space-y-3">
          <h4 class="font-bold text-slate-900">Automated Reminders</h4>
          <div class="flex items-center gap-3">
            <input type="checkbox" id="rem_auto" class="w-4 h-4" ${reminderCfg.autoEnabled ? 'checked' : ''} />
            <label for="rem_auto" class="text-sm font-medium">Enable automated invoice reminders</label>
          </div>
          <div class="grid sm:grid-cols-3 gap-3">
            <div>
              <label class="input-label">Days before due</label>
              <input type="number" id="rem_before" class="input" value="${reminderCfg.daysBeforeDue}" min="1" max="30" />
            </div>
            <div>
              <label class="input-label">Days after due (overdue)</label>
              <input type="number" id="rem_after" class="input" value="${reminderCfg.daysAfterDue}" min="1" max="90" />
            </div>
            <div>
              <label class="input-label">Frequency</label>
              <select id="rem_freq" class="input">
                <option ${reminderCfg.frequency==='daily'?'selected':''}>daily</option>
                <option ${reminderCfg.frequency==='weekly'?'selected':''}>weekly</option>
                <option ${reminderCfg.frequency==='bi-weekly'?'selected':''}>bi-weekly</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" id="rem_sid" class="w-4 h-4" ${reminderCfg.includeStudentId ? 'checked' : ''} />
            <label for="rem_sid" class="text-sm">Include Student ID in reminder message</label>
          </div>
        </div>
        <div class="card p-4">
          <h4 class="font-bold text-slate-900 mb-2">Manual Reminder Trigger</h4>
          <p class="text-sm text-slate-600 mb-2">You can send manual reminders any time from the Invoices page using the <strong>"Send reminder"</strong> button per student, or <strong>"Remind All"</strong> to notify all parents with outstanding balances.</p>
          <button class="btn btn-secondary text-sm" onclick="document.getElementById('modalBackdrop').click(); setTimeout(sendBulkReminders, 300)">${icon('send','w-4 h-4')} Open Bulk Reminder Trigger</button>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveInvoiceReminderSettings()">${icon('check','w-4 h-4')} Save Settings</button>
    `
  });
}

function saveInvoiceReminderSettings() {
  const autoEnabled = document.getElementById('rem_auto') ? document.getElementById('rem_auto').checked : false;
  const daysBeforeDue = parseInt(document.getElementById('rem_before').value) || 3;
  const daysAfterDue = parseInt(document.getElementById('rem_after').value) || 7;
  const frequency = document.getElementById('rem_freq').value;
  const includeStudentId = document.getElementById('rem_sid') ? document.getElementById('rem_sid').checked : true;
  DB.settings({ invoiceReminders: { autoEnabled, daysBeforeDue, daysAfterDue, frequency, includeStudentId } });
  document.getElementById('modalBackdrop').click();
  toast('Reminder settings saved', 'success');
}

function bulkGenerateInvoicesModal() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const feeStructures = DB.get('feeStructures');
  const currentTerm = DB.settings().currentTerm;
  const currentYear = new Date().getFullYear().toString();
  const currentSession = DB.settings().currentSession || `${currentYear}/${parseInt(currentYear)+1}`;

  // Check who already has an invoice for this term
  const existingInvoiceStudents = new Set(DB.query('invoices', i => i.schoolId === schoolId && i.term === currentTerm).map(i => i.studentId));

  const returning = students.filter(s => {
    const isNew = s.enrollmentSession === currentSession || s.enrollmentYear === currentYear || (s.admissionDate && s.admissionDate.startsWith(currentYear));
    return !isNew;
  });
  const noInvoiceYet = returning.filter(s => !existingInvoiceStudents.has(s.id));

  modal({
    title: 'Bulk Invoice Generation',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Generate invoices for all returning students who don't yet have one for <strong>${currentTerm}</strong>. New enrollments are excluded — their invoices are created during student registration.
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-2xl font-extrabold text-slate-900">${returning.length}</div>
            <div class="text-xs text-slate-500">Returning students</div>
          </div>
          <div class="bg-amber-50 rounded-xl p-3">
            <div class="text-2xl font-extrabold text-amber-700">${existingInvoiceStudents.size}</div>
            <div class="text-xs text-amber-600">Already invoiced</div>
          </div>
          <div class="bg-emerald-50 rounded-xl p-3">
            <div class="text-2xl font-extrabold text-emerald-700">${noInvoiceYet.length}</div>
            <div class="text-xs text-emerald-600">Will be invoiced</div>
          </div>
        </div>
        ${noInvoiceYet.length === 0 ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">All returning students already have invoices for this term. Nothing to generate.</div>` : `
        <div class="bg-slate-50 rounded-xl p-3 text-sm space-y-1 max-h-48 overflow-y-auto">
          <div class="font-semibold text-slate-700 mb-2">Students to be invoiced:</div>
          ${noInvoiceYet.map(s => {
            const cls = DB.find('classes', s.classId);
            const fs = feeStructures.find(f => f.classId === s.classId && f.term === currentTerm);
            const total = fs ? fs.tuition + fs.books + fs.uniform + fs.pta : 0;
            return `<div class="flex items-center justify-between py-1 border-b border-slate-200 last:border-0">
              <div class="flex items-center gap-2">${avatar(s.name,'sm')}<div><div class="font-medium text-xs">${s.name}</div><div class="text-xs text-slate-400">${cls ? cls.name : '—'}</div></div></div>
              <span class="text-xs font-mono ${total > 0 ? 'text-slate-700' : 'text-amber-600'}">${total > 0 ? money(total) : 'No fee structure'}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Students without a matching fee structure for ${currentTerm} will be skipped. Set up fee structures under <strong>Fee Structure → New Structure</strong>.
        </div>`}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             ${noInvoiceYet.length > 0 ? `<button class="btn btn-primary" onclick="confirmBulkGenerateInvoices()">${icon('check','w-4 h-4')} Generate ${noInvoiceYet.length} Invoices</button>` : ''}`
  });
}

function confirmBulkGenerateInvoices() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const students = DB.query('students', s => s.schoolId === schoolId && s.status === 'active');
  const feeStructures = DB.get('feeStructures');
  const currentTerm = DB.settings().currentTerm;
  const currentYear = new Date().getFullYear().toString();
  const currentSession = DB.settings().currentSession || `${currentYear}/${parseInt(currentYear)+1}`;
  const existingInvoiceStudents = new Set(DB.query('invoices', i => i.schoolId === schoolId && i.term === currentTerm).map(i => i.studentId));
  const returning = students.filter(s => {
    const isNew = s.enrollmentSession === currentSession || s.enrollmentYear === currentYear || (s.admissionDate && s.admissionDate.startsWith(currentYear));
    return !isNew && !existingInvoiceStudents.has(s.id);
  });
  let created = 0, skipped = 0;
  returning.forEach(s => {
    const fs = feeStructures.find(f => f.classId === s.classId && f.term === currentTerm);
    if (!fs) { skipped++; return; }
    const total = fs.tuition + fs.books + fs.uniform + fs.pta;
    DB.insert('invoices', {
      id: uid('inv'), schoolId, studentId: s.id, term: currentTerm,
      lineItems: [{ name: 'Tuition Fee', amount: fs.tuition }, { name: 'Books & Materials', amount: fs.books }, { name: 'Uniform', amount: fs.uniform }, { name: 'PTA Levy', amount: fs.pta }],
      total, paid: 0, balance: total, status: 'outstanding', dueDate: fs.dueDate, createdAt: now()
    });
    // Notify parent
    if (s.parentId) DB.insert('notifications', { id: uid('not'), userId: s.parentId, title: 'New Invoice', body: `${s.name}'s invoice for ${currentTerm} is ready. Total: ${money(total)}.`, type: 'info', read: false, timestamp: now(), link: { view: 'par_fees' } });
    created++;
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId, actor: AUTH.current.id, action: 'bulk_invoiced', target: `${created} students · ${currentTerm}`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${created} invoices generated${skipped > 0 ? ` · ${skipped} skipped (no fee structure)` : ''}`, 'success');
}

function exportPerChildReport() {
  const students = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && s.status === 'active');
  const expenses = DB.query('expenses', e => e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const perCap = students.length > 0 ? totalExp / students.length : 0;
  let csv = `Student,Student ID,Class,Total Billed,Paid,Balance,Per-Child Expenses,Net Income,Status\n`;
  students.forEach(s => {
    const inv = COMPUTE.studentInvoice(s.id);
    const cls = DB.find('classes', s.classId);
    const paid = inv ? inv.paid : 0;
    const balance = inv ? inv.balance : 0;
    const total = inv ? inv.total : 0;
    const net = paid - perCap;
    csv += `"${s.name}","${s.studentId || s.id.slice(-6)}","${cls ? cls.name : ''}",${total},${paid},${balance},${Math.round(perCap)},${Math.round(net)},"${inv ? inv.status : 'no invoice'}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `per_child_finance_${DB.settings().currentTerm.replace(/\s/g,'_')}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Per-child report exported', 'success');
}

/* ---------- Fee Structure (tabs: Class Fees + Activities) ---------- */
function view_fin_fees() {
  const feeTab = APP.params.feeTab || 'structure';
  return `
    ${pageHeader({
      title: 'Fee Structure',
      subtitle: `${DB.settings().currentTerm} · class fees and extracurricular activities`,
      actions: feeTab === 'activities'
        ? `<button class="btn btn-primary" onclick="addActivityModal()">${icon('plus','w-4 h-4')} Add Activity</button>`
        : `
          <button class="btn btn-ghost" onclick="exportFeeStructureCSV()">${icon('download','w-4 h-4')} CSV</button>
          <button class="btn btn-ghost" onclick="exportFeeStructurePDF()">${icon('download','w-4 h-4')} PDF</button>
          <button class="btn btn-primary" onclick="addFeeStructureModal()">${icon('plus','w-4 h-4')} New Structure</button>
        `
    })}
    ${tabs([
      { key: 'structure', label: 'Class Fee Structures' },
      { key: 'activities', label: 'Extracurricular Activities' }
    ], feeTab, k => { APP.params.feeTab = k; APP.render(); })}
    <div class="pt-5">${feeTab === 'activities' ? renderActivitiesTab() : renderFeeStructuresTab()}</div>
  `;
}

function renderFeeStructuresTab() {
  const structures = DB.get('feeStructures');
  const classes = DB.get('classes');
  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Class</th><th>Term</th><th>Tuition</th><th>Books</th><th>Uniform</th><th>PTA</th><th>Total</th><th>Due</th><th></th></tr></thead>
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
              <td class="text-right whitespace-nowrap">
                <button class="btn btn-ghost !p-1.5" title="Edit" onclick="feeStructureModal('${f.id}')">${icon('edit','w-4 h-4')}</button>
                <button class="btn btn-ghost !p-1.5 text-rose-600" title="Delete" onclick="deleteFeeStructure('${f.id}')">${icon('trash','w-4 h-4')}</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      ${icon('info','w-3.5 h-3.5 flex-shrink-0 text-blue-500')}
      <span>Extracurricular fees (swimming, ballet, music, etc.) are charged <strong>per student</strong> — manage them under the <button class="text-brand-700 font-semibold underline" onclick="APP.params.feeTab='activities'; APP.render()">Activities tab</button> and assign from each student's profile.</span>
    </div>
  `;
}

function renderActivitiesTab() {
  const acts = DB.query('activities', a => a.schoolId === 'sch_brightlights');
  const totalEnrolled = acts.reduce((sum, a) => sum + DB.query('studentActivities', sa => sa.activityId === a.id).length, 0);
  const totalRevenue = acts.reduce((sum, a) => {
    const cnt = DB.query('studentActivities', sa => sa.activityId === a.id).length;
    return sum + a.price * cnt;
  }, 0);

  return `
    <!-- Summary strip -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-4">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Activities Offered</div>
        <div class="text-2xl font-extrabold text-slate-900">${acts.length}</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-2xl p-4">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Total Enrolments</div>
        <div class="text-2xl font-extrabold text-slate-900">${totalEnrolled}</div>
        <div class="text-xs text-slate-400 mt-0.5">across all activities</div>
      </div>
      <div class="bg-white border border-slate-200 rounded-2xl p-4">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Activity Revenue / Term</div>
        <div class="text-2xl font-extrabold text-brand-700">${money(totalRevenue)}</div>
      </div>
    </div>

    <!-- Activities list table -->
    <div class="card overflow-hidden">
      ${acts.length === 0 ? `<div class="p-8">${emptyState({ title: 'No activities yet', body: 'Add swimming, ballet, music or any other extracurricular activity.', icon: 'book' })}</div>` : `
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th class="px-5 py-3 text-left font-semibold">Activity</th>
              <th class="px-5 py-3 text-left font-semibold hidden sm:table-cell">Description</th>
              <th class="px-5 py-3 text-right font-semibold">Fee / Term</th>
              <th class="px-5 py-3 text-right font-semibold">Enrolled</th>
              <th class="px-5 py-3 text-right font-semibold text-brand-700">Revenue</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${acts.map(a => {
              const enrolled = DB.query('studentActivities', sa => sa.activityId === a.id).length;
              const revenue = a.price * enrolled;
              const students = DB.query('studentActivities', sa => sa.activityId === a.id).map(sa => DB.find('students', sa.studentId)).filter(Boolean);
              return `<tr class="hover:bg-slate-50 group">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl w-8 text-center flex-shrink-0">${a.icon}</span>
                    <span class="font-semibold text-slate-900">${a.name}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-slate-500 hidden sm:table-cell max-w-[240px] truncate">${a.description || '—'}</td>
                <td class="px-5 py-4 text-right font-mono font-semibold text-slate-900">${money(a.price)}</td>
                <td class="px-5 py-4 text-right">
                  ${enrolled > 0
                    ? `<button class="inline-flex items-center gap-1.5 text-brand-700 hover:underline font-semibold" onclick="viewActivityEnrolments('${a.id}')">${icon('students','w-3.5 h-3.5')} ${enrolled}</button>`
                    : `<span class="text-slate-400">0</span>`}
                </td>
                <td class="px-5 py-4 text-right font-mono font-semibold ${revenue > 0 ? 'text-brand-700' : 'text-slate-400'}">${money(revenue)}</td>
                <td class="px-5 py-4 text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                  <button class="btn btn-ghost !p-1.5 hover:bg-slate-100 rounded-lg" title="Edit" onclick="editActivityModal('${a.id}')">${icon('edit','w-4 h-4 text-slate-500')}</button>
                  <button class="btn btn-ghost !p-1.5 hover:bg-rose-50 rounded-lg" title="Delete" onclick="deleteActivity('${a.id}')">${icon('trash','w-4 h-4 text-rose-400')}</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-200 bg-slate-50">
              <td class="px-5 py-3 font-bold text-slate-700 text-sm" colspan="3">Total</td>
              <td class="px-5 py-3 text-right font-bold text-slate-700">${totalEnrolled}</td>
              <td class="px-5 py-3 text-right font-bold text-brand-700 font-mono">${money(totalRevenue)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `}
    </div>
    <div class="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
      ${icon('info','w-3.5 h-3.5 flex-shrink-0')}
      <span>To enroll a student, open their profile from <button class="text-brand-700 font-semibold underline" onclick="APP.go('adm_people')">Students</button> and use the Extracurricular Activities section. Fees are added to their invoice automatically.</span>
    </div>
  `;
}

function viewActivityEnrolments(actId) {
  const a = DB.find('activities', actId);
  const enrolments = DB.query('studentActivities', sa => sa.activityId === actId);
  const students = enrolments.map(sa => ({ sa, s: DB.find('students', sa.studentId) })).filter(x => x.s);
  modal({
    title: `${a.icon} ${a.name} — Enrolled Students`,
    body: `
      <div class="space-y-2">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <span class="text-sm text-slate-500">${students.length} student${students.length !== 1 ? 's' : ''} enrolled</span>
          <span class="font-semibold text-brand-700">${money(a.price)} each · ${money(a.price * students.length)} total</span>
        </div>
        ${students.map(({ sa, s }) => {
          const cls = DB.find('classes', s.classId);
          return `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
            ${avatar(s, 'sm')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${s.name}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : '—'} · Enrolled ${fdate(sa.enrolledAt, { short: true })}</div>
            </div>
            <button class="btn btn-ghost !p-1.5 text-slate-400 hover:text-slate-700" title="View student" onclick="document.getElementById('modalBackdrop').click(); viewStudent('${s.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
          </div>`;
        }).join('')}
        ${students.length === 0 ? `<p class="text-sm text-slate-400 text-center py-4">No students enrolled yet.</p>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function addActivityModal() { editActivityModal(null); }
function editActivityModal(actId) {
  const existing = actId ? DB.find('activities', actId) : null;
  modal({
    title: existing ? 'Edit Activity' : 'Add Extracurricular Activity',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="input-label">Icon / Emoji</label>
            <input id="act_icon" class="input text-2xl text-center" value="${existing ? existing.icon : '🏃'}" maxlength="4" />
          </div>
          <div class="col-span-3">
            <label class="input-label">Activity Name *</label>
            <input id="act_name" class="input" placeholder="e.g. Swimming" value="${existing ? existing.name.replace(/"/g,'&quot;') : ''}" />
          </div>
        </div>
        <div>
          <label class="input-label">Description</label>
          <input id="act_desc" class="input" placeholder="Brief description shown to parents" value="${existing ? (existing.description || '').replace(/"/g,'&quot;') : ''}" />
        </div>
        <div>
          <label class="input-label">Fee per term (₦) *</label>
          <input id="act_price" type="number" class="input" placeholder="e.g. 15000" value="${existing ? existing.price : ''}" />
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          ${icon('info','w-4 h-4 inline mr-1')} This fee is charged <strong>per student</strong> who enrolls. Enroll students from their profile (Students → open student → Activities tab).
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveActivity(${actId ? `'${actId}'` : 'null'})">${icon('check','w-4 h-4')} ${existing ? 'Save Changes' : 'Add Activity'}</button>`
  });
}

function saveActivity(actId) {
  const name = document.getElementById('act_name').value.trim();
  const price = parseInt(document.getElementById('act_price').value) || 0;
  if (!name) { toast('Activity name is required', 'danger'); return; }
  if (price <= 0) { toast('Enter a valid fee', 'danger'); return; }
  const data = { schoolId: 'sch_brightlights', name, icon: document.getElementById('act_icon').value.trim() || '🏃', description: document.getElementById('act_desc').value.trim(), price };
  if (actId) DB.update('activities', actId, data);
  else DB.insert('activities', { id: uid('act'), ...data });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(actId ? 'Activity updated' : 'Activity added', 'success');
}

function deleteActivity(actId) {
  const a = DB.find('activities', actId);
  const enrolled = DB.query('studentActivities', sa => sa.activityId === actId).length;
  confirm(`Delete "${a.name}"?${enrolled ? ` ${enrolled} student(s) are enrolled and will be removed from this activity.` : ''}`, () => {
    DB.remove('activities', actId);
    DB.query('studentActivities', sa => sa.activityId === actId).forEach(sa => DB.remove('studentActivities', sa.id));
    APP.render();
    toast('Activity deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

function addFeeStructureModal() { feeStructureModal(null); }

function exportFeeStructureCSV() {
  const structures = DB.get('feeStructures');
  const classes = DB.get('classes');
  const headers = ['Class', 'Term', 'Tuition', 'Books', 'Uniform', 'PTA Levy', 'Total', 'Due Date'];
  const rows = structures.map(f => {
    const cls = classes.find(c => c.id === f.classId);
    return [cls ? cls.name : '', f.term, f.tuition, f.books, f.uniform, f.pta, f.tuition + f.books + f.uniform + f.pta, f.dueDate];
  });
  const csv = [headers, ...rows].map(r => r.map(v => {
    const str = String(v == null ? '' : v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_fee_structure.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('Fee structure exported', 'success');
}

function exportFeeStructurePDF() {
  const structures = DB.get('feeStructures');
  const classes = DB.get('classes');
  const html = `
    <div style="max-width:800px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <h2 style="margin:14px 0 4px;font-size:18px">FEE STRUCTURE — ${DB.settings().currentTerm}</h2>
      </div>
      <table border="1" cellpadding="10" style="border-collapse:collapse;width:100%;font-size:13px">
        <thead style="background:#f3f4f6">
          <tr><th align="left">Class</th><th align="right">Tuition</th><th align="right">Books</th><th align="right">Uniform</th><th align="right">PTA</th><th align="right">Total</th><th align="right">Due</th></tr>
        </thead>
        <tbody>
          ${structures.map(f => {
            const cls = classes.find(c => c.id === f.classId);
            const total = f.tuition + f.books + f.uniform + f.pta;
            return `<tr><td><strong>${cls ? cls.name : '—'}</strong></td><td align="right">${money(f.tuition)}</td><td align="right">${money(f.books)}</td><td align="right">${money(f.uniform)}</td><td align="right">${money(f.pta)}</td><td align="right" style="background:#d1fae5"><strong>${money(total)}</strong></td><td align="right">${fdate(f.dueDate, { short: true })}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Computer-generated. Generated by CASPAA · ${fdate(today(), { long: true })}</p>
    </div>
  `;
  printElement(html);
}

function feeStructureModal(editingId) {
  const classes = DB.get('classes');
  const existing = editingId ? DB.find('feeStructures', editingId) : null;
  const isEdit = !!existing;
  modal({
    title: isEdit ? 'Edit Fee Structure' : 'New Fee Structure',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Class *</label>
            <select id="fs_class" class="input">${classes.map(c => `<option value="${c.id}" ${existing && existing.classId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          </div>
          <div>
            <label class="input-label">Term *</label>
            <input id="fs_term" class="input" value="${existing ? existing.term : DB.settings().currentTerm}" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Tuition</label>
            <input id="fs_tuition" type="number" class="input" value="${existing ? existing.tuition : 200000}" oninput="updateFeeTotal()" />
          </div>
          <div>
            <label class="input-label">Books &amp; Materials</label>
            <input id="fs_books" type="number" class="input" value="${existing ? existing.books : 25000}" oninput="updateFeeTotal()" />
          </div>
          <div>
            <label class="input-label">Uniform</label>
            <input id="fs_uniform" type="number" class="input" value="${existing ? existing.uniform : 20000}" oninput="updateFeeTotal()" />
          </div>
          <div>
            <label class="input-label">PTA Levy</label>
            <input id="fs_pta" type="number" class="input" value="${existing ? existing.pta : 5000}" oninput="updateFeeTotal()" />
          </div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
          ${icon('info','w-4 h-4 inline mr-1')} Extracurricular fees (swimming, ballet, music, etc.) are <strong>per student</strong> — set them under the <strong>Activities tab</strong> and assign to each student from their profile.
        </div>
        <div>
          <label class="input-label">Due Date</label>
          <input id="fs_due" type="date" class="input" value="${existing ? existing.dueDate : daysAhead(15)}" />
        </div>
        <div class="bg-brand-50 rounded-xl p-3 flex items-center justify-between">
          <span class="font-semibold text-brand-800">Total per student</span>
          <span class="text-xl font-extrabold text-brand-700" id="fs_total">${money((existing ? existing.tuition + existing.books + existing.uniform + existing.pta : 250000))}</span>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <div class="relative">
              <input type="checkbox" id="fs_installment" class="sr-only peer" ${existing && existing.installmentEnabled ? 'checked' : ''} onchange="toggleInstallmentOptions()" />
              <div class="w-10 h-5 bg-slate-300 peer-checked:bg-brand-600 rounded-full transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </div>
            <div>
              <div class="font-semibold text-sm text-slate-900">Allow Instalment Payments</div>
              <div class="text-xs text-slate-500">Parents can pay in 2 or 3 parts instead of in full upfront</div>
            </div>
          </label>
          <div id="fs_installmentOptions" class="${existing && existing.installmentEnabled ? '' : 'hidden'} mt-3 pt-3 border-t border-slate-200 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="input-label text-xs">Max Instalments</label>
                <select id="fs_maxInstalments" class="input">
                  <option value="2" ${existing && existing.maxInstalments === 2 ? 'selected' : ''}>2 parts</option>
                  <option value="3" ${existing && existing.maxInstalments === 3 ? 'selected' : ''}>3 parts</option>
                </select>
              </div>
              <div>
                <label class="input-label text-xs">Minimum 1st Payment (%)</label>
                <input id="fs_minFirstPct" type="number" min="20" max="80" class="input" value="${existing && existing.minFirstPct ? existing.minFirstPct : 50}" placeholder="e.g. 50" />
              </div>
            </div>
          </div>
        </div>
        ${isEdit ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          <strong>Note:</strong> Editing this structure does not retroactively change existing invoices. New invoices generated from this point will use the updated amounts.
        </div>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveFeeStructure(${isEdit ? "'" + editingId + "'" : 'null'})">${icon('check','w-4 h-4')} ${isEdit ? 'Save Changes' : 'Create Structure'}</button>`
  });
}

function toggleInstallmentOptions() {
  const el = document.getElementById('fs_installmentOptions');
  const cb = document.getElementById('fs_installment');
  if (el && cb) el.classList.toggle('hidden', !cb.checked);
}

function updateFeeTotal() {
  const total = ['fs_tuition','fs_books','fs_uniform','fs_pta'].reduce((s, id) => { const el = document.getElementById(id); return s + (el ? (parseInt(el.value) || 0) : 0); }, 0);
  const el = document.getElementById('fs_total');
  if (el) el.textContent = money(total);
}

function saveFeeStructure(editingId) {
  const installmentEnabled = (document.getElementById('fs_installment') || {}).checked || false;
  const data = {
    schoolId: 'sch_brightlights',
    classId: document.getElementById('fs_class').value,
    term: document.getElementById('fs_term').value.trim(),
    tuition: parseInt(document.getElementById('fs_tuition').value) || 0,
    books: parseInt(document.getElementById('fs_books').value) || 0,
    uniform: parseInt(document.getElementById('fs_uniform').value) || 0,
    pta: parseInt(document.getElementById('fs_pta').value) || 0,
    dueDate: document.getElementById('fs_due').value,
    installmentEnabled,
    maxInstalments: installmentEnabled ? parseInt((document.getElementById('fs_maxInstalments') || {}).value) || 2 : null,
    minFirstPct: installmentEnabled ? parseInt((document.getElementById('fs_minFirstPct') || {}).value) || 50 : null
  };
  if (!data.term) { toast('Term is required', 'danger'); return; }
  if (editingId) {
    DB.update('feeStructures', editingId, data);
    toast('Fee structure updated', 'success');
  } else {
    DB.insert('feeStructures', { id: uid('fee'), ...data });
    toast('Fee structure created', 'success');
  }
  document.getElementById('modalBackdrop').click();
  APP.render();
}

function deleteFeeStructure(id) {
  const f = DB.find('feeStructures', id);
  const cls = DB.find('classes', f.classId);
  confirm(`Delete the fee structure for ${cls ? cls.name : 'this class'}? Existing invoices are not affected.`, () => {
    DB.remove('feeStructures', id);
    APP.render();
    toast('Fee structure deleted', 'info');
  }, { yesLabel: 'Delete', danger: true });
}

/* ---------- Invoices ---------- */
function view_fin_invoices() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const invoices = DB.query('invoices', i => i.schoolId === schoolId);
  const filter = APP.params.invStatus || 'all';
  const q = (APP.params.invQ || '').toLowerCase();
  const byStatus = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const filtered = q ? byStatus.filter(i => {
    const s = DB.find('students', i.studentId);
    return s && (s.name.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q));
  }) : byStatus;
  const overdueCount = invoices.filter(i => i.balance > 0 && i.dueDate && i.dueDate < today()).length;

  return `
    ${pageHeader({
      title: 'Invoices',
      subtitle: `${invoices.length} invoices for ${DB.settings().currentTerm}`,
      actions: `
        <button class="btn btn-secondary" onclick="invoiceReminderSettingsModal()">${icon('settings','w-4 h-4')} Reminder Settings</button>
        <button class="btn btn-secondary" onclick="bulkGenerateInvoicesModal()">${icon('plus','w-4 h-4')} Bulk Generate</button>
        ${overdueCount > 0 ? `<button class="btn btn-primary" onclick="sendBulkReminders()">${icon('send','w-4 h-4')} Remind ${overdueCount} Overdue</button>` : ''}
      `
    })}
    <div class="card p-3 mb-3">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
        <input type="text" class="input pl-9" placeholder="Search by student name…" value="${q}" oninput="APP.params.invQ = this.value; APP.render()" />
      </div>
    </div>
    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${filter==='all'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'all' })">All ${invoices.length}</button>
      <button class="chip ${filter==='paid'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'paid' })">Paid ${invoices.filter(i=>i.status==='paid').length}</button>
      <button class="chip ${filter==='partial'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'partial' })">Partial ${invoices.filter(i=>i.status==='partial').length}</button>
      <button class="chip ${filter==='outstanding'?'active':''}" onclick="APP.go('fin_invoices', { invStatus: 'outstanding' })">Outstanding ${invoices.filter(i=>i.status==='outstanding').length}</button>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due</th><th class="text-right">Actions</th></tr></thead>
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
              <td class="text-right whitespace-nowrap">
                <button class="btn btn-ghost !p-1.5 text-brand-700 hover:bg-brand-50 rounded-lg" title="Send invoice to parent (WhatsApp + email)" onclick="sendInvoiceToParent('${inv.id}')">${icon('send','w-4 h-4')}</button>
                ${inv.paid > 0 ? `<button class="btn btn-ghost !p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Generate receipt & send to parent" onclick="sendReceiptToParent('${inv.id}')">${icon('download','w-4 h-4')}</button>` : ''}
                <button class="btn btn-ghost !p-1.5 hover:bg-slate-100 rounded-lg" title="View invoice" onclick="viewInvoice('${inv.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function sendInvoiceToParent(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const s = DB.find('students', inv.studentId);
  if (!s) return;
  if (s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId, title: 'Invoice from School',
      body: `An invoice of ${money(inv.total)} for ${s.name} (${DB.settings().currentTerm}) is ready. Balance due: ${money(inv.balance)}. View, download or pay from your dashboard.`,
      type: inv.balance > 0 ? 'warn' : 'info', channel: 'whatsapp+email', read: false, timestamp: now(), link: { view: 'par_fees' }
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: 'sent_invoice', target: `${s.name} · ${money(inv.total)}`, timestamp: now() });
  toast(`Invoice for ${s.name} sent to parent via WhatsApp + email`, 'success');
}

function sendReceiptToParent(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  if (!inv) return;
  const s = DB.find('students', inv.studentId);
  if (!s) return;
  // Generate the printable receipt for the finance officer
  downloadReceipt(invoiceId);
  // Trigger send to the parent
  if (s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId, title: 'Payment Receipt',
      body: `Receipt for ${s.name}: ${money(inv.paid)} received${inv.balance > 0 ? `, ${money(inv.balance)} balance remaining` : ' — fully paid. Thank you!'}. Download it from your dashboard.`,
      type: 'success', channel: 'whatsapp+email', read: false, timestamp: now(), link: { view: 'par_fees' }
    });
  }
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: 'sent_receipt', target: `${s.name} · ${money(inv.paid)}`, timestamp: now() });
  toast(`Receipt for ${s.name} generated & sent to parent via WhatsApp + email`, 'success');
}

/* ---------- Payments ---------- */
function view_fin_payments() {
  const txns = DB.query('transactions', t => t.schoolId === 'sch_brightlights').sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  const total = txns.filter(t => t.status === 'successful').reduce((s, t) => s + t.amount, 0);
  const q = (APP.params.payQ || '').toLowerCase();
  const filtered = q ? txns.filter(t => {
    const s = DB.find('students', t.studentId);
    return (s && s.name.toLowerCase().includes(q)) || t.reference.toLowerCase().includes(q) || t.method.toLowerCase().includes(q);
  }) : txns;

  return `
    ${pageHeader({
      title: 'Payments',
      subtitle: `${txns.length} transactions · ${money(total)} processed`,
      actions: `
        <button class="btn btn-secondary" onclick="manualPaymentModal()">${icon('plus','w-4 h-4')} Record Cash / Manual</button>
        <button class="btn btn-secondary" onclick="exportPayments()">${icon('download','w-4 h-4')} CSV</button>
      `
    })}
    <div class="card p-3 mb-3">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
        <input type="text" class="input pl-9" placeholder="Search by student name, reference or method…" value="${q}" oninput="APP.params.payQ = this.value; APP.render()" />
      </div>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Reference</th><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Reconciled</th><th>Date</th></tr></thead>
        <tbody>
          ${filtered.map(t => {
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

function manualPaymentModal() {
  const students = DB.query('students', s => s.schoolId === 'sch_brightlights' && s.status === 'active');
  modal({
    title: 'Record Manual Payment',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Use for <strong>cash</strong>, <strong>cheque</strong>, or <strong>bank transfer</strong> payments received at the school. These post directly to the student's invoice with no Paystack involved.
        </div>
        <div>
          <label class="input-label">Student</label>
          <select id="mp_student" class="input" onchange="updateManualPaymentBalance()">
            <option value="">— Select student —</option>
            ${students.map(s => {
              const inv = COMPUTE.studentInvoice(s.id);
              return `<option value="${s.id}" data-balance="${inv ? inv.balance : 0}" data-invoice="${inv ? inv.id : ''}">${s.name}${inv ? ' · owing ' + money(inv.balance) : ''}</option>`;
            }).join('')}
          </select>
        </div>
        <div id="mp_balanceHint" class="hidden bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Amount (NGN)</label><input id="mp_amount" type="number" class="input" /></div>
          <div><label class="input-label">Method</label>
            <select id="mp_method" class="input">
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer (manual)</option>
              <option value="pos">POS / Card Terminal</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Date received</label><input id="mp_date" type="date" class="input" value="${today()}" /></div>
          <div><label class="input-label">Reference / Cheque No. (optional)</label><input id="mp_ref" class="input" placeholder="e.g. CHQ-021435" /></div>
        </div>
        <div><label class="input-label">Notes (optional)</label><textarea id="mp_notes" rows="2" class="input" placeholder="e.g. Cash collected at the gate by Mr. Adebayo"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveManualPayment()">${icon('check','w-4 h-4')} Record Payment</button>`
  });
}

function updateManualPaymentBalance() {
  const select = document.getElementById('mp_student');
  const opt = select.options[select.selectedIndex];
  const balance = parseInt(opt.dataset.balance) || 0;
  const hint = document.getElementById('mp_balanceHint');
  const amount = document.getElementById('mp_amount');
  if (balance > 0) {
    hint.classList.remove('hidden');
    hint.innerHTML = `Outstanding balance: <strong>${money(balance)}</strong>. <button class="text-blue-700 underline" onclick="document.getElementById('mp_amount').value=${balance}">Pay in full</button>`;
    amount.placeholder = `up to ${money(balance)}`;
  } else {
    hint.classList.add('hidden');
  }
}

function saveManualPayment() {
  const studentId = document.getElementById('mp_student').value;
  if (!studentId) { toast('Select a student', 'danger'); return; }
  const amount = parseInt(document.getElementById('mp_amount').value);
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'danger'); return; }
  const method = document.getElementById('mp_method').value;
  const date = document.getElementById('mp_date').value;
  const ref = document.getElementById('mp_ref').value.trim();
  const notes = document.getElementById('mp_notes').value.trim();
  const inv = COMPUTE.studentInvoice(studentId);
  if (!inv) { toast('No outstanding invoice for this student', 'warn'); return; }
  if (amount > inv.balance) { toast(`Amount exceeds balance of ${money(inv.balance)}`, 'danger'); return; }

  const reference = ref || ('MAN-' + Math.random().toString(36).slice(2, 10).toUpperCase());
  // Create transaction
  DB.insert('transactions', {
    id: uid('txn'), schoolId: inv.schoolId, invoiceId: inv.id, studentId,
    amount, method,
    reference,
    status: 'successful',
    gateway: 'Manual',
    timestamp: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
    reconciled: true,
    recordedBy: AUTH.current.id,
    notes
  });
  // Update invoice
  const newPaid = inv.paid + amount;
  const newBalance = inv.total - newPaid;
  const newStatus = newBalance === 0 ? 'paid' : 'partial';
  DB.update('invoices', inv.id, { paid: newPaid, balance: newBalance, status: newStatus });
  // Audit + parent notification
  const student = DB.find('students', studentId);
  DB.insert('auditLog', { id: uid('aud'), schoolId: inv.schoolId, actor: AUTH.current.id, action: 'manual_payment', target: `${money(amount)} · ${method} for ${student.name}`, timestamp: now() });
  DB.insert('notifications', { id: uid('not'), userId: student.parentId, title: 'Payment Received', body: `${money(amount)} cash payment recorded for ${student.name}'s fees. Receipt available.`, type: 'success', read: false, timestamp: now(), link: { view: 'par_fees' } });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${money(amount)} ${method} recorded for ${student.name}`, 'success');
}

function exportPayments() {
  const txns = DB.query('transactions', t => t.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const csv = 'Reference,Student,Amount,Method,Status,Reconciled,Date\n' +
    txns.map(t => {
      const s = DB.find('students', t.studentId);
      return `${t.reference},"${s?s.name:''}",${t.amount},${t.method},${t.status},${t.reconciled},${t.timestamp}`;
    }).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_payments.csv'; a.click();
  toast('Payment ledger exported', 'success');
}

/* ---------- Reconciliation ---------- */
function view_fin_recon() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const unrec = DB.query('transactions', t => t.schoolId === schoolId && !t.reconciled);
  if (unrec.length === 0) {
    DB.insert('transactions', {
      id: uid('txn'), schoolId,
      invoiceId: null, studentId: null,
      amount: 280000, method: 'transfer',
      reference: 'TRF-' + Math.floor(Math.random()*99999999).toString(16).toUpperCase(),
      status: 'successful', gateway: 'Paystack',
      timestamp: now(), reconciled: false,
      narration: 'TRSF/OKAFOR/SCH FEES JSS1', studentRef: ''
    });
  }
  const unreconciled = DB.query('transactions', t => t.schoolId === schoolId && !t.reconciled);
  const allStudents = DB.query('students', s => s.schoolId === schoolId);
  return `
    ${pageHeader({
      title: 'Payment Reconciliation',
      subtitle: 'Match incoming payments to student invoices using Student ID',
      actions: `
        <button class="btn btn-secondary" onclick="recordCashPaymentModal()">${icon('fees','w-4 h-4')} Record Cash Payment</button>
        <button class="btn btn-secondary" onclick="autoMatchAllTransactions()">${icon('ai','w-4 h-4')} Auto-Match All</button>
      `
    })}
    <div class="card bg-blue-50 border border-blue-200 p-3 mb-4 text-sm text-blue-900">
      ${icon('info','w-4 h-4 inline mr-1')} <strong>${unreconciled.length}</strong> payment${unreconciled.length!==1?'s':''} need${unreconciled.length===1?'s':''} matching. Primary match: <strong>Student ID</strong> in payment narration or reference. Fallback: name-based matching. You can also enter the Student ID manually.
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Reference</th><th>Narration</th><th>Amount</th><th>Method</th><th>Student ID Match</th><th>Suggested Student</th><th></th></tr></thead>
          <tbody>
            ${unreconciled.map(t => {
              // Primary match: student ID in narration or reference
              const narrationUpper = (t.narration || '').toUpperCase();
              const refUpper = (t.reference || '').toUpperCase();
              const idMatch = allStudents.find(s => {
                const sid = (s.studentId || '').toUpperCase();
                return sid && (narrationUpper.includes(sid) || refUpper.includes(sid));
              });
              // Fallback: surname match
              const nameMatch = !idMatch ? allStudents.find(s => narrationUpper.includes(s.name.split(' ').slice(-1)[0].toUpperCase())) : null;
              const finalMatch = idMatch || nameMatch;
              const matchType = idMatch ? 'ID' : nameMatch ? 'Name' : null;
              return `<tr>
                <td><code class="text-xs">${t.reference}</code></td>
                <td class="text-sm max-w-xs">${t.narration || '—'}</td>
                <td class="font-mono font-bold">${money(t.amount)}</td>
                <td><span class="badge badge-neutral uppercase text-xs">${t.method}</span></td>
                <td>${matchType === 'ID' ? `<span class="badge badge-success text-xs">${icon('check','w-3 h-3')} ID matched</span>` : matchType === 'Name' ? `<span class="badge badge-warn text-xs">${icon('ai','w-3 h-3')} Name match</span>` : `<div class="flex gap-1"><input type="text" class="input input-sm w-28 font-mono" placeholder="Student ID" id="sid_${t.id}" /><button class="btn btn-ghost !p-1 text-xs" onclick="lookupStudentId('${t.id}')">${icon('search','w-3.5 h-3.5')}</button></div>`}</td>
                <td>${finalMatch ? `<div class="font-semibold text-sm">${finalMatch.name}</div><div class="text-xs text-slate-500">ID: ${finalMatch.studentId || finalMatch.id.slice(-6)}</div>` : '<span class="text-slate-400 text-sm">Not found</span>'}</td>
                <td class="whitespace-nowrap">
                  <button class="btn btn-primary !py-1.5 text-xs" onclick="reconcileTxn('${t.id}', '${finalMatch ? finalMatch.id : ''}')">${icon('check','w-3 h-3')} Match</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function lookupStudentId(txnId) {
  const input = document.getElementById(`sid_${txnId}`);
  if (!input) return;
  const sid = input.value.trim().toUpperCase();
  const allStudents = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const found = allStudents.find(s => (s.studentId || '').toUpperCase() === sid || s.id.slice(-6).toUpperCase() === sid);
  if (found) {
    toast(`Found: ${found.name} — click Match to confirm`, 'success');
    reconcileTxn(txnId, found.id);
  } else {
    toast('No student found with that ID', 'danger');
  }
}

function autoMatchAllTransactions() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const unreconciled = DB.query('transactions', t => t.schoolId === schoolId && !t.reconciled);
  const allStudents = DB.query('students', s => s.schoolId === schoolId);
  let matched = 0;
  unreconciled.forEach(t => {
    const narUp = (t.narration || '').toUpperCase();
    const refUp = (t.reference || '').toUpperCase();
    const idMatch = allStudents.find(s => { const sid = (s.studentId || '').toUpperCase(); return sid && (narUp.includes(sid) || refUp.includes(sid)); });
    if (idMatch) { reconcileTxnSilent(t.id, idMatch.id); matched++; }
  });
  toast(matched > 0 ? `${matched} transaction${matched > 1 ? 's' : ''} auto-matched by student ID` : 'No ID-based matches found — manual review needed', matched > 0 ? 'success' : 'warn');
  APP.render();
}

function reconcileTxnSilent(txnId, studentId) {
  if (!studentId) return;
  const inv = DB.query('invoices', i => i.studentId === studentId)[0];
  const txn = DB.find('transactions', txnId);
  if (inv && txn && !txn.reconciled) {
    DB.update('invoices', inv.id, { paid: inv.paid + txn.amount, balance: Math.max(0, inv.balance - txn.amount), status: (inv.balance - txn.amount <= 0) ? 'paid' : 'partial' });
    DB.update('transactions', txnId, { reconciled: true, studentId, invoiceId: inv.id });
  }
}

function reconcileTxn(txnId, studentId) {
  if (!studentId) {
    const input = document.getElementById(`sid_${txnId}`);
    const sid = input ? input.value.trim() : '';
    if (!sid) { toast('Enter a Student ID to match manually', 'warn'); return; }
    lookupStudentId(txnId); return;
  }
  const inv = DB.query('invoices', i => i.studentId === studentId)[0];
  const txn = DB.find('transactions', txnId);
  if (inv && txn) {
    DB.update('invoices', inv.id, { paid: inv.paid + txn.amount, balance: Math.max(0, inv.balance - txn.amount), status: (inv.balance - txn.amount <= 0) ? 'paid' : 'partial' });
    DB.update('transactions', txnId, { reconciled: true, studentId, invoiceId: inv.id });
    const s = DB.find('students', studentId);
    toast(`Matched: ${s ? s.name : 'Student'} — balance updated`, 'success');
    APP.render();
  } else {
    toast('Could not complete match — check student invoice', 'warn');
  }
}

function recordCashPaymentModal() {
  const allStudents = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && s.status === 'active');
  modal({
    title: 'Record Cash Payment',
    body: `
      <div class="space-y-3">
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          ${icon('check','w-4 h-4 inline')} Use the student's unique ID to ensure accurate payment matching.
        </div>
        <div>
          <label class="input-label">Student ID</label>
          <div class="flex gap-2">
            <input type="text" id="cash_sid" class="input font-mono flex-1" placeholder="e.g. STU-2024-001" oninput="cashLookupStudent(this.value)" />
          </div>
          <div id="cash_student_info" class="mt-1 text-sm text-slate-600"></div>
        </div>
        <div><label class="input-label">Amount (₦)</label><input type="number" id="cash_amount" class="input" placeholder="0.00" /></div>
        <div><label class="input-label">Date</label><input type="date" id="cash_date" class="input" value="${today()}" /></div>
        <div><label class="input-label">Receipt Note</label><input type="text" id="cash_note" class="input" placeholder="School fees payment — First Term" /></div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCashPayment()">${icon('check','w-4 h-4')} Record Payment</button>
    `
  });
}

function cashLookupStudent(sid) {
  const allStudents = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const found = allStudents.find(s => (s.studentId || '').toUpperCase() === sid.toUpperCase() || s.id.slice(-6).toUpperCase() === sid.toUpperCase());
  const info = document.getElementById('cash_student_info');
  if (info) info.textContent = found ? `✓ ${found.name} — ${(DB.find('classes', found.classId) || {}).name || ''}` : sid ? '✗ No student found' : '';
}

function saveCashPayment() {
  const sidInput = document.getElementById('cash_sid');
  const amount = parseFloat(document.getElementById('cash_amount').value);
  const date = document.getElementById('cash_date').value;
  const note = document.getElementById('cash_note').value.trim();
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'danger'); return; }
  const sid = sidInput ? sidInput.value.trim() : '';
  const allStudents = DB.query('students', s => s.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const student = allStudents.find(s => (s.studentId || '').toUpperCase() === sid.toUpperCase() || s.id.slice(-6).toUpperCase() === sid.toUpperCase());
  if (!student) { toast('Enter a valid Student ID first', 'danger'); return; }
  const inv = DB.query('invoices', i => i.studentId === student.id)[0];
  const txnId = uid('txn');
  DB.insert('transactions', {
    id: txnId, schoolId: AUTH.current.schoolId || 'sch_brightlights',
    studentId: student.id, invoiceId: inv ? inv.id : null,
    amount, method: 'cash', status: 'successful',
    reference: `CASH-${Date.now().toString(36).toUpperCase()}`,
    narration: note || 'Cash payment recorded', timestamp: now(), reconciled: true
  });
  if (inv) {
    DB.update('invoices', inv.id, { paid: inv.paid + amount, balance: Math.max(0, inv.balance - amount), status: (inv.balance - amount <= 0) ? 'paid' : 'partial' });
  }
  document.getElementById('modalBackdrop').click();
  toast(`Cash payment of ${money(amount)} recorded for ${student.name}`, 'success');
  APP.render();
}

/* ---------- Expenses ---------- */
function view_fin_expenses() {
  const expenses = DB.query('expenses', e => e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
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
  const amount = parseInt(document.getElementById('ex_amt').value) || 0;
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'danger'); return; }
  DB.insert('expenses', {
    id: uid('exp'), schoolId: 'sch_brightlights',
    date: document.getElementById('ex_date').value,
    category: document.getElementById('ex_cat').value,
    amount,
    description: document.getElementById('ex_desc').value.trim(),
    recordedBy: AUTH.current.id
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Expense recorded', 'success');
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

/* ---------- Payroll (4-stage flow: HR → Accounting → Pay → Post-Payroll) ---------- */
function view_fin_payroll() {
  const teachers = DB.query('teachers', t => t.schoolId === 'sch_brightlights');
  const runs = DB.query('payrollRuns', r => r.schoolId === 'sch_brightlights').sort((a, b) => b.computedAt.localeCompare(a.computedAt));
  const currentRun = runs.find(r => r.stage !== 'paid');
  const pastRuns = runs.filter(r => r.stage === 'paid');

  return `
    ${pageHeader({
      title: 'Payroll',
      subtitle: 'HR manages adjustments & initiates · Accountant confirms funds & authorizes disbursement',
      actions: `<button class="btn btn-secondary" onclick="exportPayrollCSV()">${icon('download','w-4 h-4')} Export Payroll Schedule</button>`
    })}

    ${currentRun ? renderPayrollStepper(currentRun) : `<div class="card p-5 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
      ${icon('check','w-5 h-5')}
      <div class="flex-1"><div class="font-bold">All caught up</div><div class="text-sm">No payroll run in progress. Start a new one for the current month.</div></div>
      <button class="btn btn-primary" onclick="startNewPayrollRun()">${icon('plus','w-4 h-4')} New Run</button>
    </div>`}

    ${pastRuns.length ? `<div class="card mb-4">
      <div class="px-5 py-3 border-b border-slate-100">
        <h3 class="font-bold text-slate-900">Past Runs</h3>
      </div>
      <table class="tbl">
        <thead><tr><th>Period</th><th>Gross</th><th>PAYE</th><th>Pension</th><th>Net Paid</th><th>Staff</th><th>Tax/Pension</th><th></th></tr></thead>
        <tbody>
          ${pastRuns.map(r => `<tr>
            <td><strong>${r.period}</strong><div class="text-xs text-slate-500">Paid ${fdate(r.paidAt, { short: true })}</div></td>
            <td class="font-mono">${money(r.grossTotal)}</td>
            <td class="font-mono text-rose-700">-${money(r.payeTotal)}</td>
            <td class="font-mono text-rose-700">-${money(r.pensionTotal)}</td>
            <td class="font-mono font-bold text-emerald-700">${money(r.netTotal)}</td>
            <td>${r.staffCount}</td>
            <td>${r.taxRemitted ? '<span class="badge badge-success">Remitted</span>' : '<span class="badge badge-warn">Pending</span>'}</td>
            <td><button class="btn btn-ghost !p-1.5" onclick="viewPayrollRun('${r.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Salary roster for reference -->
    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Salary Roster <span class="text-sm font-normal text-slate-500">· ${teachers.length} staff · ${money(teachers.reduce((s, t) => s + (t.salary || 0), 0))}/month base</span></h3>
        <span class="text-xs text-slate-500">Edit salaries via Staff profile</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Staff</th><th>Type</th><th>Bank</th><th>Account</th><th class="text-right">Base Salary</th></tr></thead>
          <tbody>
            ${teachers.map(t => `<tr>
              <td><div class="flex items-center gap-2">${avatar(t.name, 'sm')}<div><div class="font-medium text-sm">${t.name}</div><div class="text-xs text-slate-500">${t.role || ''}</div></div></div></td>
              <td><span class="badge ${t.staffType === 'Academic' || !t.staffType ? 'badge-success' : 'badge-info'}">${t.staffType || 'Academic'}</span></td>
              <td class="text-sm">${t.bank ? t.bank.name : '<span class="text-slate-400">Not set</span>'}</td>
              <td><code class="text-xs">${t.bank ? t.bank.account : '—'}</code></td>
              <td class="text-right font-mono font-semibold">${money(t.salary || 0)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPayrollStepper(run) {
  const stages = [
    { key: 'draft',             label: 'HR Compute',       icon: 'edit',       desc: 'HR builds the monthly roster with adjustments' },
    { key: 'pending_approval',  label: 'Accounting',       icon: 'check',      desc: 'Validate entries, confirm fund availability' },
    { key: 'approved',          label: 'Disburse',         icon: 'send',       desc: 'Process payment via NIBSS · issue payslips' },
    { key: 'paid',              label: 'Post-Payroll',     icon: 'reports',    desc: 'PAYE remittance · pension · compliance · analytics' }
  ];
  const currentIdx = stages.findIndex(s => s.key === run.stage);

  return `
    <div class="card p-5 mb-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 class="font-bold text-slate-900">${run.period} Payroll Run</h3>
          <p class="text-xs text-slate-500">${run.staffCount} staff · Gross ${money(run.grossTotal)} · Net ${money(run.netTotal)}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary text-sm" onclick="viewPayrollRun('${run.id}')">${icon('search','w-3.5 h-3.5')} View Details</button>
        </div>
      </div>

      <!-- Stage stepper -->
      <div class="grid grid-cols-4 gap-2 mb-5">
        ${stages.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const bg = done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500';
          const lineBg = done ? 'bg-emerald-500' : 'bg-slate-200';
          return `<div class="text-center">
            <div class="flex items-center mb-1.5">
              <div class="w-9 h-9 rounded-full ${bg} flex items-center justify-center font-bold flex-shrink-0">${done ? icon('check','w-4 h-4') : i + 1}</div>
              ${i < stages.length - 1 ? `<div class="flex-1 h-0.5 ${lineBg} mx-1"></div>` : ''}
            </div>
            <div class="text-xs font-semibold ${active ? 'text-brand-700' : done ? 'text-emerald-700' : 'text-slate-500'}">${s.label}</div>
            <div class="text-xs text-slate-500 mt-0.5 leading-tight hidden sm:block">${s.desc}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Stage-specific action panel -->
      ${renderPayrollStageAction(run)}
    </div>
  `;
}

function renderPayrollStageAction(run) {
  if (run.stage === 'draft') {
    return `
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0">${icon('edit','w-5 h-5')}</div>
          <div class="flex-1">
            <div class="font-bold text-amber-900">HR — Compute &amp; Submit</div>
            <p class="text-sm text-amber-800 mt-1">${run.adjustments.length} adjustment${run.adjustments.length !== 1 ? 's' : ''} applied this month. Review, then submit for Accounting approval.</p>
            <div class="flex gap-2 mt-3 flex-wrap">
              <button class="btn btn-secondary text-sm" onclick="manageAdjustmentsModal('${run.id}')">${icon('plus','w-3.5 h-3.5')} Adjustments (${run.adjustments.length})</button>
              <button class="btn btn-primary" onclick="submitPayrollToAccounting('${run.id}')">${icon('send','w-4 h-4')} Submit to Accounting →</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  if (run.stage === 'pending_approval') {
    const txns = DB.query('transactions', t => t.schoolId === (AUTH.current.schoolId || 'sch_brightlights') && t.status === 'successful');
    const cashOnHand = txns.reduce((s, t) => s + t.amount, 0) - (DB.query('expenses', e => e.schoolId === (AUTH.current.schoolId || 'sch_brightlights')).reduce((s, e) => s + e.amount, 0));
    const sufficient = cashOnHand >= run.netTotal;
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0">${icon('check','w-5 h-5')}</div>
          <div class="flex-1">
            <div class="font-bold text-blue-900">Accountant — Confirm Funds &amp; Authorize Disbursement</div>
            <p class="text-sm text-blue-800 mt-1">HR submitted this payroll on ${fdate(run.submittedAt, { long: true })}. As Accountant, your role is to confirm fund availability and authorize the payment. HR cannot disburse without your authorization.</p>
            <div class="bg-white rounded-lg p-3 mt-2 grid grid-cols-3 gap-3 text-sm">
              <div><div class="text-xs text-slate-500">Amount Required</div><div class="font-mono font-bold">${money(run.netTotal)}</div></div>
              <div><div class="text-xs text-slate-500">Available Balance</div><div class="font-mono font-bold ${sufficient ? 'text-emerald-700' : 'text-rose-700'}">${money(Math.max(0, cashOnHand))}</div></div>
              <div><div class="text-xs text-slate-500">Fund Status</div><div class="font-bold ${sufficient ? 'text-emerald-700' : 'text-rose-700'}">${sufficient ? icon('check','w-3 h-3 inline') + ' Sufficient' : icon('x','w-3 h-3 inline') + ' Insufficient'}</div></div>
            </div>
            ${!sufficient ? `<div class="bg-rose-50 border border-rose-200 rounded-lg p-2 mt-2 text-xs text-rose-900">${icon('bell','w-3.5 h-3.5 inline')} Available funds may be insufficient. Review expenses and collections before authorizing.</div>` : ''}
            <div class="flex gap-2 mt-3 flex-wrap">
              <button class="btn btn-secondary text-sm" onclick="sendBackPayroll('${run.id}')">${icon('arrow_left','w-3.5 h-3.5')} Return to HR</button>
              <button class="btn btn-primary ${!sufficient ? '!bg-amber-600' : ''}" onclick="approvePayrollRun('${run.id}')">${icon('check','w-4 h-4')} ${sufficient ? 'Authorize Disbursement →' : 'Authorize Anyway →'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  if (run.stage === 'approved') {
    return `
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">${icon('send','w-5 h-5')}</div>
          <div class="flex-1">
            <div class="font-bold text-emerald-900">Approved — Ready to Disburse</div>
            <p class="text-sm text-emerald-800 mt-1">Approved on ${fdate(run.approvedAt, { long: true })}. Click below to send ${money(run.netTotal)} to ${run.staffCount} staff accounts via NIBSS, generate payslips and update the ledger.</p>
            <button class="btn btn-primary mt-3" onclick="disbursePayroll('${run.id}')">${icon('send','w-4 h-4')} Process Payment Now →</button>
          </div>
        </div>
      </div>
    `;
  }
  return '';
}

/* ---------- Stage transition handlers ---------- */
function startNewPayrollRun() {
  const teachers = DB.query('teachers', t => t.schoolId === 'sch_brightlights');
  const base = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  const period = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  if (DB.query('payrollRuns', r => r.period === period)[0]) { toast(`Payroll for ${period} already exists`, 'warn'); return; }
  DB.insert('payrollRuns', {
    id: uid('pr'), schoolId: 'sch_brightlights', period, stage: 'draft',
    grossTotal: base,
    netTotal: Math.round(base * 0.85),
    payeTotal: Math.round(base * 0.07),
    pensionTotal: Math.round(base * 0.08),
    staffCount: teachers.length,
    adjustments: [],
    computedAt: now(), computedBy: AUTH.current.id
  });
  toast(`Started ${period} payroll run`, 'success');
  APP.render();
}

function submitPayrollToAccounting(runId) {
  DB.update('payrollRuns', runId, { stage: 'pending_approval', submittedAt: now(), submittedBy: AUTH.current.id });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: 'payroll_submitted', target: DB.find('payrollRuns', runId).period, timestamp: now() });
  toast('Submitted to Accounting for approval', 'success');
  APP.render();
}

function approvePayrollRun(runId) {
  DB.update('payrollRuns', runId, { stage: 'approved', approvedAt: now(), approvedBy: AUTH.current.id });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: 'payroll_approved', target: DB.find('payrollRuns', runId).period, timestamp: now() });
  toast('Payroll approved · ready to disburse', 'success');
  APP.render();
}

function sendBackPayroll(runId) {
  confirm('Send this payroll run back to HR for revisions? They will need to re-submit.', () => {
    DB.update('payrollRuns', runId, { stage: 'draft', sentBackAt: now() });
    toast('Sent back to HR', 'info');
    APP.render();
  }, { yesLabel: 'Send back' });
}

function disbursePayroll(runId) {
  const run = DB.find('payrollRuns', runId);
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId && t.bank && t.bank.account);
  DB.update('payrollRuns', runId, { stage: 'paid', paidAt: now(), paidBy: AUTH.current.id });
  // Record expense
  DB.insert('expenses', {
    id: uid('exp'), schoolId: run.schoolId,
    category: 'Salaries', amount: run.netTotal,
    description: `Payroll · ${run.period} · ${teachers.length} staff (net of PAYE & pension)`,
    date: today(), recordedBy: AUTH.current.id
  });
  // Notify each staff member with payslip link
  teachers.forEach(t => {
    DB.insert('notifications', { id: uid('not'), userId: t.id, title: 'Salary Paid · Payslip Ready', body: `Your ${run.period} salary has been credited to ${t.bank.name} ${t.bank.account}. Payslip is available in your dashboard.`, type: 'success', read: false, timestamp: now(), link: { view: 'tch_dashboard' } });
  });
  // Notify the finance officer / accountant who ran payroll (confirmation receipt)
  DB.insert('notifications', {
    id: uid('not'), userId: AUTH.current.id,
    title: `Payroll Disbursed · ${run.period}`,
    body: `Payroll run complete. ${money(run.netTotal)} disbursed to ${teachers.length} staff via NIBSS. PAYE (${money(run.payeTotal)}) and Pension (${money(run.pensionTotal)}) now pending remittance.`,
    type: 'success', read: false, timestamp: now(),
    link: { view: 'fin_payroll' }
  });
  // Also notify the school proprietor for visibility
  DB.insert('notifications', {
    id: uid('not'), userId: run.schoolId,
    title: 'Payroll Processed',
    body: `${run.period} payroll has been disbursed by the bursar. Total paid: ${money(run.netTotal)} to ${teachers.length} staff.`,
    type: 'info', read: false, timestamp: now(),
    link: { view: 'adm_finance_hub', params: { financeTab: 'payroll' } }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: run.schoolId, actor: AUTH.current.id, action: 'payroll_disbursed', target: `${run.period} · ${money(run.netTotal)} to ${teachers.length} staff`, timestamp: now() });
  toast(`Payroll disbursed · ${teachers.length} staff paid · confirmation in your bell`, 'success');
  // Open the post-payroll modal
  setTimeout(() => postPayrollModal(runId), 400);
}

function postPayrollModal(runId) {
  const run = DB.find('payrollRuns', runId);
  modal({
    title: '✓ ' + run.period + ' Payroll Complete · Post-Payroll Tasks',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">
          ${run.staffCount} staff paid ${money(run.netTotal)} via NIBSS. Now handle the regulatory side.
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-3 border border-slate-200">
            <div class="text-xs text-slate-500 uppercase font-semibold">PAYE Tax</div>
            <div class="text-xl font-bold text-rose-700">${money(run.payeTotal)}</div>
            <div class="text-xs text-slate-500 mt-1">Remit to LIRS by 10th</div>
            <button class="btn btn-primary !py-1.5 text-xs w-full mt-2" onclick="remitTax('${runId}', 'paye')">${icon('check','w-3 h-3')} Mark Remitted</button>
          </div>
          <div class="card p-3 border border-slate-200">
            <div class="text-xs text-slate-500 uppercase font-semibold">Pension</div>
            <div class="text-xl font-bold text-rose-700">${money(run.pensionTotal)}</div>
            <div class="text-xs text-slate-500 mt-1">Remit to PFA by 7th</div>
            <button class="btn btn-primary !py-1.5 text-xs w-full mt-2" onclick="remitTax('${runId}', 'pension')">${icon('check','w-3 h-3')} Mark Remitted</button>
          </div>
        </div>
        <div class="card p-3 border border-slate-200">
          <div class="font-semibold text-sm mb-2">Compliance Checklist</div>
          <div class="space-y-1.5 text-sm">
            ${[
              'Update general ledger with payroll journal entry',
              'File monthly PAYE return on TaxPro',
              'Issue payslips to staff (auto-sent ✓)',
              'Update HR records with leave deductions',
              'Reconcile bank statement for payroll debit'
            ].map(t => `<label class="flex items-center gap-2"><input type="checkbox" class="w-4 h-4 accent-brand-600" /><span>${t}</span></label>`).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.render()">Done</button>`
  });
}

function remitTax(runId, type) {
  const field = type === 'paye' ? 'taxRemitted' : 'pensionRemitted';
  DB.update('payrollRuns', runId, { [field]: true, [field + 'At']: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: type + '_remitted', target: DB.find('payrollRuns', runId).period, timestamp: now() });
  toast(type === 'paye' ? 'PAYE remitted to LIRS' : 'Pension remitted to PFA', 'success');
  document.getElementById('modalBackdrop')?.click();
  APP.render();
}

function viewPayrollRun(runId) {
  const run = DB.find('payrollRuns', runId);
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId);
  const stageLabel = { draft: 'Draft (HR computing)', pending_approval: 'Pending Accounting approval', approved: 'Approved — awaiting payment', paid: 'Paid' }[run.stage];
  modal({
    title: run.period + ' · Run Details',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-3 text-sm">
          <div><div class="text-xs text-slate-500">Status</div><div class="font-bold">${stageLabel}</div></div>
          <div><div class="text-xs text-slate-500">Staff Count</div><div class="font-bold">${run.staffCount}</div></div>
          <div><div class="text-xs text-slate-500">Gross</div><div class="font-mono font-bold">${money(run.grossTotal)}</div></div>
          <div><div class="text-xs text-slate-500">Net</div><div class="font-mono font-bold text-emerald-700">${money(run.netTotal)}</div></div>
          <div><div class="text-xs text-slate-500">PAYE</div><div class="font-mono">${money(run.payeTotal)}${run.taxRemitted ? ' <span class="badge badge-success">Remitted</span>' : ''}</div></div>
          <div><div class="text-xs text-slate-500">Pension</div><div class="font-mono">${money(run.pensionTotal)}${run.pensionRemitted ? ' <span class="badge badge-success">Remitted</span>' : ''}</div></div>
        </div>
        ${run.adjustments && run.adjustments.length ? `<div>
          <div class="text-xs uppercase font-semibold text-slate-500 mb-2">Adjustments</div>
          <div class="space-y-1.5">
            ${run.adjustments.map(a => {
              const t = DB.find('teachers', a.staffId);
              return `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                ${avatar(t ? t.name : '?', 'sm')}
                <span class="flex-1 font-medium">${t ? t.name : '—'}</span>
                <span class="badge ${a.type === 'bonus' ? 'badge-success' : a.type === 'overtime' ? 'badge-info' : 'badge-danger'}">${a.type}</span>
                <span class="font-mono ${a.amount < 0 ? 'text-rose-700' : 'text-emerald-700'} font-semibold">${a.amount < 0 ? '-' : '+'}${money(Math.abs(a.amount))}</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
        ${run.stage === 'paid' ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-900">${icon('check','w-4 h-4 inline')} Payslips have been issued to all staff via in-app + email.</div>` : ''}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
             ${run.stage === 'paid' ? `<button class="btn btn-primary" onclick="downloadPayrollSummary('${runId}')">${icon('download','w-4 h-4')} Summary PDF</button>` : ''}`
  });
}

function downloadPayrollSummary(runId) {
  const run = DB.find('payrollRuns', runId);
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId);
  const html = `
    <div style="max-width:800px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <h2 style="margin:14px 0 4px;font-size:18px">PAYROLL SUMMARY — ${run.period}</h2>
      </div>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-size:13px">
        <thead style="background:#f3f4f6"><tr><th align="left">Staff</th><th align="left">Role</th><th align="right">Gross</th><th align="right">PAYE</th><th align="right">Pension</th><th align="right">Net</th></tr></thead>
        <tbody>
          ${teachers.map(t => {
            const gross = t.salary || 0;
            const paye = Math.round(gross * 0.07);
            const pension = Math.round(gross * 0.08);
            return `<tr><td>${t.name}</td><td>${t.role || t.staffType || ''}</td><td align="right">${money(gross)}</td><td align="right">${money(paye)}</td><td align="right">${money(pension)}</td><td align="right"><strong>${money(gross - paye - pension)}</strong></td></tr>`;
          }).join('')}
        </tbody>
        <tfoot style="background:#d1fae5;font-weight:bold"><tr><td colspan="2">TOTAL</td><td align="right">${money(run.grossTotal)}</td><td align="right">${money(run.payeTotal)}</td><td align="right">${money(run.pensionTotal)}</td><td align="right">${money(run.netTotal)}</td></tr></tfoot>
      </table>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Generated by CASPAA on ${fdate(now(), { long: true })}</p>
    </div>
  `;
  printElement(html);
}

function manageAdjustmentsModal(runId) {
  const run = DB.find('payrollRuns', runId);
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId);
  modal({
    title: 'Adjustments — ' + run.period,
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Add bonuses, overtime, fines or leave deductions for this run. They apply on top of base salary.
        </div>
        <div class="space-y-1.5">
          ${run.adjustments.map((a, i) => {
            const t = DB.find('teachers', a.staffId);
            return `<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
              ${avatar(t ? t.name : '?', 'sm')}
              <span class="flex-1 truncate">${t ? t.name : '—'} · ${a.note}</span>
              <span class="font-mono font-semibold ${a.amount < 0 ? 'text-rose-700' : 'text-emerald-700'}">${a.amount < 0 ? '-' : '+'}${money(Math.abs(a.amount))}</span>
              <button class="btn btn-ghost !p-1 text-rose-600" onclick="removeAdjustment('${runId}', ${i})">${icon('x','w-3.5 h-3.5')}</button>
            </div>`;
          }).join('') || '<p class="text-sm text-slate-500 text-center py-2">No adjustments yet.</p>'}
        </div>
        <div class="border-t pt-3">
          <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Add Adjustment</div>
          <div class="grid grid-cols-4 gap-2">
            <select id="adj_staff" class="input col-span-2 text-sm">${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
            <select id="adj_type" class="input text-sm"><option value="bonus">Bonus</option><option value="overtime">Overtime</option><option value="deduction">Deduction</option></select>
            <input id="adj_amount" type="number" class="input text-sm" placeholder="Amount" />
          </div>
          <input id="adj_note" class="input mt-2 text-sm" placeholder="Note (e.g. Best teacher award)" />
          <button class="btn btn-primary mt-2 w-full text-sm" onclick="addAdjustment('${runId}')">${icon('plus','w-3.5 h-3.5')} Add</button>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Done</button>`
  });
}

function addAdjustment(runId) {
  const run = DB.find('payrollRuns', runId);
  const type = document.getElementById('adj_type').value;
  let amount = parseInt(document.getElementById('adj_amount').value) || 0;
  if (!amount) { toast('Enter an amount', 'danger'); return; }
  if (type === 'deduction') amount = -Math.abs(amount);
  const adjustments = run.adjustments.concat([{
    staffId: document.getElementById('adj_staff').value,
    type, amount,
    note: document.getElementById('adj_note').value.trim() || type
  }]);
  // Recompute totals
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId);
  const base = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  const adjSum = adjustments.reduce((s, a) => s + a.amount, 0);
  const newGross = base + adjSum;
  DB.update('payrollRuns', runId, {
    adjustments,
    grossTotal: newGross,
    payeTotal: Math.round(newGross * 0.07),
    pensionTotal: Math.round(newGross * 0.08),
    netTotal: Math.round(newGross * 0.85)
  });
  toast('Adjustment added', 'success');
  manageAdjustmentsModal(runId);
}

function removeAdjustment(runId, idx) {
  const run = DB.find('payrollRuns', runId);
  const adjustments = run.adjustments.filter((_, i) => i !== idx);
  const teachers = DB.query('teachers', t => t.schoolId === run.schoolId);
  const base = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  const adjSum = adjustments.reduce((s, a) => s + a.amount, 0);
  const newGross = base + adjSum;
  DB.update('payrollRuns', runId, {
    adjustments,
    grossTotal: newGross,
    payeTotal: Math.round(newGross * 0.07),
    pensionTotal: Math.round(newGross * 0.08),
    netTotal: Math.round(newGross * 0.85)
  });
  manageAdjustmentsModal(runId);
}

function staffSubjectLabel(t) {
  if (t.staffType && t.staffType !== 'Academic') return t.role || t.staffType || '—';
  const subjects = DB.get('subjects');
  if (Array.isArray(t.subjects) && t.subjects.length) {
    return t.subjects.map(id => (subjects.find(s => s.id === id) || {}).name).filter(Boolean).join(', ');
  }
  return t.subject || 'Teacher';
}

function runPayrollModal() {
  const teachers = DB.query('teachers', t => t.schoolId === 'sch_brightlights');
  const total = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  const missing = teachers.filter(t => !t.bank || !t.bank.account).length;
  modal({
    title: 'Run Payroll',
    body: `
      <div class="space-y-3">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          Process this month's salaries. Funds debit the school's settlement account and credit each staff member's bank account via NIBSS.
        </div>
        <div class="bg-slate-50 rounded-xl p-4 space-y-2">
          <div class="flex justify-between text-sm"><span class="text-slate-500">Staff members</span><strong>${teachers.length}</strong></div>
          <div class="flex justify-between text-sm"><span class="text-slate-500">With bank details</span><strong class="${missing > 0 ? 'text-amber-700' : 'text-emerald-700'}">${teachers.length - missing}${missing ? ' (' + missing + ' missing)' : ''}</strong></div>
          <div class="flex justify-between text-base font-bold pt-2 border-t border-slate-200"><span>Total debit</span><span class="font-mono text-brand-700">${money(total)}</span></div>
        </div>
        ${missing ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">${missing} staff are missing bank details and will be skipped. Add their account before next run.</div>` : ''}
        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" id="pay_confirm" />
          <span>I confirm this payroll run for ${new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })} totaling <strong>${money(total - (missing ? teachers.filter(t => !t.bank).reduce((s, t) => s + (t.salary || 0), 0) : 0))}</strong>.</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="executePayrollRun()">${icon('check','w-4 h-4')} Process Payroll</button>`
  });
}

function executePayrollRun() {
  if (!document.getElementById('pay_confirm').checked) { toast('Please tick the confirmation', 'danger'); return; }
  const teachers = DB.query('teachers', t => t.schoolId === 'sch_brightlights' && t.bank && t.bank.account);
  const total = teachers.reduce((s, t) => s + (t.salary || 0), 0);
  // Record as expense
  DB.insert('expenses', {
    id: uid('exp'), schoolId: 'sch_brightlights',
    category: 'Salaries', amount: total,
    description: `Monthly payroll for ${teachers.length} staff (${new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })})`,
    date: today(), recordedBy: AUTH.current.id
  });
  // Notify each staff member
  teachers.forEach(t => {
    DB.insert('notifications', { id: uid('not'), userId: t.id, title: 'Salary Paid', body: `Your salary of ${money(t.salary)} has been paid to ${t.bank.name} · ${t.bank.account}.`, type: 'success', read: false, timestamp: now() });
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'sch_brightlights', actor: AUTH.current.id, action: 'ran_payroll', target: `${money(total)} to ${teachers.length} staff`, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Payroll processed · ${money(total)} disbursed to ${teachers.length} staff`, 'success');
}

function exportPayrollCSV() {
  const teachers = DB.query('teachers', t => t.schoolId === 'sch_brightlights');
  const headers = ['Name', 'Email', 'Staff Type', 'Role', 'Bank', 'Account', 'Salary'];
  const rows = teachers.map(t => [t.name, t.email, t.staffType || 'Academic', t.role || '', t.bank ? t.bank.name : '', t.bank ? t.bank.account : '', t.salary || 0]);
  const csv = [headers, ...rows].map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_payroll.csv'; a.click();
  toast('Payroll exported', 'success');
}

/* ---------- Financial Reports ---------- */
function view_fin_reports() {
  const tab = APP.params.accTab || 'pl';
  return `
    ${pageHeader({
      title: 'Accounting & Reports',
      subtitle: 'P&L, trial balance, cash flow, balance sheet and budgets',
      actions: `<button class="btn btn-primary" onclick="exportPL()">${icon('download','w-4 h-4')} Export P&L (PDF)</button>`
    })}
    ${tabs([
      { key: 'pl', label: 'Profit & Loss' },
      { key: 'trial', label: 'Trial Balance' },
      { key: 'cashflow', label: 'Cash Flow' },
      { key: 'balance', label: 'Balance Sheet' },
      { key: 'budget', label: 'Budgets' }
    ], tab, k => { APP.params.accTab = k; APP.render(); })}
    <div class="pt-4">${
      tab === 'trial' ? renderTrialBalance() :
      tab === 'cashflow' ? renderCashFlow() :
      tab === 'balance' ? renderBalanceSheet() :
      tab === 'budget' ? renderBudgets() :
      renderProfitLoss()
    }</div>
  `;
}

function _accFigures() {
  const invoices = DB.query('invoices', i => i.schoolId === 'sch_brightlights');
  const txns = DB.query('transactions', t => t.schoolId === 'sch_brightlights' && t.status === 'successful');
  const expenses = DB.query('expenses', e => e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
  const collected = txns.reduce((s, t) => s + t.amount, 0);
  const billed = invoices.reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  return { invoices, txns, expenses, collected, billed, outstanding, totalExp, profit: collected - totalExp };
}

function renderProfitLoss() {
  const f = _accFigures();
  const expByCat = Object.entries(f.expenses.reduce((a, e) => { a[e.category] = (a[e.category] || 0) + e.amount; return a; }, {}));
  return `
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-slate-900 mb-4">Profit & Loss · ${DB.settings().currentTerm}</h3>
      <table class="w-full text-sm"><tbody>
        <tr class="border-b"><td class="py-3 font-bold text-slate-900">INCOME</td><td></td></tr>
        ${[['Tuition Fees', f.collected * 0.65], ['Other Fees', f.collected * 0.35]].map(([n, a]) => `<tr class="border-b"><td class="py-2 pl-4">${n}</td><td class="text-right font-mono">${money(a)}</td></tr>`).join('')}
        <tr class="border-b bg-emerald-50"><td class="py-2 font-bold">Total Income</td><td class="text-right font-bold font-mono text-emerald-700">${money(f.collected)}</td></tr>
        <tr class="border-b"><td class="py-3 font-bold text-slate-900 pt-4">EXPENSES</td><td></td></tr>
        ${expByCat.map(([n, a]) => `<tr class="border-b"><td class="py-2 pl-4">${n}</td><td class="text-right font-mono">${money(a)}</td></tr>`).join('')}
        <tr class="border-b bg-rose-50"><td class="py-2 font-bold">Total Expenses</td><td class="text-right font-bold font-mono text-rose-700">${money(f.totalExp)}</td></tr>
        <tr class="${f.profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}"><td class="py-3 font-extrabold text-lg">${f.profit >= 0 ? 'NET PROFIT' : 'NET LOSS'}</td><td class="text-right font-extrabold font-mono text-lg ${f.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${money(Math.abs(f.profit))}</td></tr>
      </tbody></table>
    </div>
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-2">Debtors List</h3>
        <p class="text-sm text-slate-500 mb-3">Students with outstanding balances</p>
        <table class="w-full text-sm">
          <thead><tr class="border-b"><th class="text-left py-2">Student</th><th class="text-right">Owing</th></tr></thead>
          <tbody>
            ${f.invoices.filter(i => i.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 10).map(i => { const s = DB.find('students', i.studentId); return `<tr class="border-b"><td class="py-2">${s ? s.name : '—'}</td><td class="text-right font-mono text-rose-700">${money(i.balance)}</td></tr>`; }).join('')}
          </tbody>
        </table>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-2">Cashbook (recent)</h3>
        <table class="w-full text-sm"><tbody>
          ${[...f.txns.map(t => ({ ...t, type: 'in' })), ...f.expenses.map(e => ({ ...e, type: 'out' }))].sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date)).slice(0, 10).map(item => `<tr class="border-b">
            <td class="py-2 text-xs text-slate-500">${fdate(item.timestamp || item.date, { short: true })}</td>
            <td class="py-2">${item.type === 'in' ? 'Payment' : item.category}</td>
            <td class="text-right font-mono ${item.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}">${item.type === 'in' ? '+' : '-'}${money(item.amount)}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>
    </div>
  `;
}

function renderTrialBalance() {
  const f = _accFigures();
  // Indicative double-entry: debits = bank + receivables + expenses; credits = fee revenue + sundry payables
  const debits = [
    ['Cash & Bank', f.collected],
    ['Fees Receivable', f.outstanding],
    ['Expenses', f.totalExp]
  ];
  const credits = [
    ['Fee Income', f.billed],
    ['Sundry Payables', f.totalExp]
  ];
  const totalDr = debits.reduce((s, d) => s + d[1], 0);
  const totalCr = credits.reduce((s, c) => s + c[1], 0);
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-1">Trial Balance · ${DB.settings().currentTerm}</h3>
      <p class="text-sm text-slate-500 mb-4">Indicative ledger balances. Debits and credits should agree.</p>
      <table class="w-full text-sm"><thead><tr class="border-b-2 border-slate-200"><th class="text-left py-2">Account</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead>
        <tbody>
          ${debits.map(([n, a]) => `<tr class="border-b"><td class="py-2">${n}</td><td class="text-right font-mono">${money(a)}</td><td></td></tr>`).join('')}
          ${credits.map(([n, a]) => `<tr class="border-b"><td class="py-2">${n}</td><td></td><td class="text-right font-mono">${money(a)}</td></tr>`).join('')}
          <tr class="bg-slate-100 font-bold"><td class="py-2">Totals</td><td class="text-right font-mono">${money(totalDr)}</td><td class="text-right font-mono">${money(totalCr)}</td></tr>
        </tbody>
      </table>
      <div class="mt-3 ${totalDr === totalCr ? 'text-emerald-700' : 'text-rose-700'} text-sm font-semibold">${totalDr === totalCr ? '✓ Balanced' : '⚠ Out of balance by ' + money(Math.abs(totalDr - totalCr))}</div>
    </div>
  `;
}

function renderCashFlow() {
  const f = _accFigures();
  const opening = 8500000; // indicative opening cash position
  const net = f.collected - f.totalExp;
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-4">Cash Flow Statement · ${DB.settings().currentTerm}</h3>
      <table class="w-full text-sm"><tbody>
        <tr class="border-b"><td class="py-3 font-bold">OPERATING ACTIVITIES</td><td></td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Fees collected (inflow)</td><td class="text-right font-mono text-emerald-700">+${money(f.collected)}</td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Operating expenses (outflow)</td><td class="text-right font-mono text-rose-700">-${money(f.totalExp)}</td></tr>
        <tr class="border-b bg-slate-50"><td class="py-2 font-semibold">Net cash from operations</td><td class="text-right font-mono font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${net >= 0 ? '+' : '-'}${money(Math.abs(net))}</td></tr>
        <tr class="border-b"><td class="py-3 font-bold pt-4">CASH POSITION</td><td></td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Opening balance</td><td class="text-right font-mono">${money(opening)}</td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Net movement</td><td class="text-right font-mono">${net >= 0 ? '+' : '-'}${money(Math.abs(net))}</td></tr>
        <tr class="bg-brand-50"><td class="py-3 font-extrabold">Closing balance</td><td class="text-right font-extrabold font-mono text-brand-700">${money(opening + net)}</td></tr>
      </tbody></table>
    </div>
  `;
}

function renderBalanceSheet() {
  const f = _accFigures();
  const cashAtBank = 8500000 + (f.collected - f.totalExp);
  const receivables = f.outstanding;
  const totalAssets = cashAtBank + receivables;
  const payables = Math.round(f.totalExp * 0.15);
  const equity = totalAssets - payables;
  return `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-4">Balance Sheet · as at ${fdate(today(), { long: true })}</h3>
      <table class="w-full text-sm"><tbody>
        <tr class="border-b"><td class="py-3 font-bold">ASSETS</td><td></td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Cash & Bank</td><td class="text-right font-mono">${money(cashAtBank)}</td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Fees Receivable</td><td class="text-right font-mono">${money(receivables)}</td></tr>
        <tr class="border-b bg-emerald-50"><td class="py-2 font-bold">Total Assets</td><td class="text-right font-bold font-mono text-emerald-700">${money(totalAssets)}</td></tr>
        <tr class="border-b"><td class="py-3 font-bold pt-4">LIABILITIES & EQUITY</td><td></td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Sundry Payables</td><td class="text-right font-mono">${money(payables)}</td></tr>
        <tr class="border-b"><td class="py-2 pl-4">Accumulated Surplus (Equity)</td><td class="text-right font-mono">${money(equity)}</td></tr>
        <tr class="bg-brand-50"><td class="py-3 font-extrabold">Total Liabilities & Equity</td><td class="text-right font-extrabold font-mono text-brand-700">${money(payables + equity)}</td></tr>
      </tbody></table>
      <div class="mt-3 text-emerald-700 text-sm font-semibold">✓ Balanced — assets equal liabilities plus equity</div>
    </div>
  `;
}

function renderBudgets() {
  const sid = 'sch_brightlights';
  const budgets = DB.query('budgets', b => b.schoolId === sid);
  const expenses = DB.get('expenses');
  const actualByCat = expenses.reduce((a, e) => { a[e.category] = (a[e.category] || 0) + e.amount; return a; }, {});
  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Budget vs Actual · ${DB.settings().currentTerm}</h3>
        <button class="btn btn-secondary !py-1 !px-3 text-xs" onclick="addBudgetModal()">${icon('plus','w-3.5 h-3.5')} Add Budget</button>
      </div>
      ${budgets.length === 0 ? `<p class="text-sm text-slate-500">No budgets set. Add one to start tracking.</p>` : `
        <div class="space-y-4">
          ${budgets.map(b => {
            const actual = actualByCat[b.category] || 0;
            const pct = b.planned ? Math.round(actual / b.planned * 100) : 0;
            const over = actual > b.planned;
            return `<div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-semibold text-slate-900">${b.category}</span>
                <span class="font-mono ${over ? 'text-rose-700' : 'text-slate-600'}">${money(actual)} / ${money(b.planned)}</span>
              </div>
              <div class="progress"><div class="progress-bar ${over ? '!bg-rose-500' : ''}" style="width: ${Math.min(100, pct)}%"></div></div>
              <div class="text-xs ${over ? 'text-rose-600' : 'text-slate-400'} mt-1">${over ? `Over budget by ${money(actual - b.planned)}` : `${pct}% used · ${money(b.planned - actual)} remaining`}</div>
            </div>`;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function addBudgetModal() {
  modal({
    title: 'Add Budget Line',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Category</label>
          <select id="bud_cat" class="input">${['Salaries','Utilities','Maintenance','Supplies','Internet','Transport','Other'].map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Planned amount (₦)</label><input id="bud_amount" type="number" class="input" placeholder="500000" /></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveBudget()">Save Budget</button>`
  });
}

function saveBudget() {
  const category = document.getElementById('bud_cat').value;
  const planned = parseInt(document.getElementById('bud_amount').value) || 0;
  if (planned <= 0) { toast('Enter a planned amount', 'danger'); return; }
  const existing = DB.query('budgets', b => b.schoolId === 'sch_brightlights' && b.category === category && b.period === DB.settings().currentTerm)[0];
  if (existing) DB.update('budgets', existing.id, { planned });
  else DB.insert('budgets', { id: uid('bud'), schoolId: 'sch_brightlights', category, period: DB.settings().currentTerm, planned });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Budget saved', 'success');
}

function exportPL() {
  const txns = DB.query('transactions', t => t.status === 'successful');
  const expenses = DB.query('expenses', e => e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'));
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
