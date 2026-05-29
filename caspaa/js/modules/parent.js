/* ============================================================
   PARENT MODULE
   Designed for the lowest-tech user: big buttons, clear copy.
   ============================================================ */

function parentChildren() {
  return COMPUTE.parentChildren(AUTH.current.id);
}

/* ---------- Dashboard ---------- */
function view_par_dashboard() {
  const parent = DB.find('parents', AUTH.current.id) || { name: AUTH.current.name || 'Parent' };
  const children = parentChildren();
  const totalOutstanding = children.reduce((s, c) => {
    const inv = COMPUTE.studentInvoice(c.id);
    return s + (inv ? inv.balance : 0);
  }, 0);
  const announcements = DB.query('announcements', a => a.audience === 'all' || a.audience === 'parents').slice(0, 3);

  return `
    <div class="space-y-5">
      <!-- Hero greeting -->
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <p class="text-brand-200 text-sm">Hello,</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold">${parent.name.split(' ').slice(-1)}</h1>
        <p class="text-brand-100 text-sm mt-1">${children.length} ${children.length === 1 ? 'child' : 'children'} at Bright Lights Academy</p>

        ${totalOutstanding > 0 ? `<div class="mt-4 bg-white/15 backdrop-blur rounded-xl p-3 flex items-center justify-between">
          <div>
            <div class="text-xs text-brand-100">Outstanding Fees</div>
            <div class="text-xl font-bold">${money(totalOutstanding)}</div>
          </div>
          <button class="bg-white text-brand-700 px-4 py-2 rounded-lg font-bold text-sm" onclick="APP.go('par_fees')">Pay Now</button>
        </div>` : `<div class="mt-4 bg-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          ${icon('check', 'w-6 h-6 text-emerald-200')}
          <div class="text-sm font-medium">All fees paid. Thank you!</div>
        </div>`}
      </div>

      <!-- Children cards -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-slate-900">My Children</h2>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('par_children')">See all →</button>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          ${children.map(c => renderChildCard(c)).join('')}
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_fees')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-2">${icon('fees','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Pay Fees</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_loans')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">${icon('loan','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Apply for Loan</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_messages')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">${icon('chat','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Message Teacher</div>
        </button>
        <button class="card card-hover p-4 text-center" onclick="APP.go('par_announce')">
          <div class="w-12 h-12 mx-auto rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">${icon('bell','w-6 h-6')}</div>
          <div class="font-semibold text-sm text-slate-900">Announcements</div>
        </button>
      </div>

      <!-- Announcements -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Latest from School</h3>
        </div>
        <div class="space-y-3">
          ${announcements.map(a => `<div class="border-l-4 border-brand-500 pl-3 py-1">
            <div class="font-semibold text-sm text-slate-900">${a.title}</div>
            <div class="text-sm text-slate-600 line-clamp-2">${a.body}</div>
            <div class="text-xs text-slate-400 mt-1">${fdate(a.timestamp, { relative: true })}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderChildCard(child) {
  const cls = DB.find('classes', child.classId);
  const inv = COMPUTE.studentInvoice(child.id);
  const attRate = COMPUTE.attendanceRate(child.id);
  const results = COMPUTE.studentResults(child.id);
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  return `
    <div class="card card-hover p-4 cursor-pointer" onclick="viewChildDetail('${child.id}')">
      <div class="flex items-center gap-3 mb-3">
        ${avatar(child.name, 'lg')}
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-900 truncate">${child.name}</div>
          <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${child.admissionNo}</div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center mb-3">
        <div class="bg-brand-50 rounded-lg p-2">
          <div class="text-xs text-brand-700 font-semibold">ATTEND</div>
          <div class="font-bold text-brand-900">${attRate}%</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-2">
          <div class="text-xs text-blue-700 font-semibold">AVG</div>
          <div class="font-bold text-blue-900">${avg}%</div>
        </div>
        ${inv && inv.status === 'paid' ? `<div class="bg-emerald-50 rounded-lg p-2">
          <div class="text-xs text-emerald-700 font-semibold">FEES</div>
          <div class="font-bold text-emerald-900 text-xs">PAID</div>
        </div>` : `<div class="bg-amber-50 rounded-lg p-2">
          <div class="text-xs text-amber-700 font-semibold">FEES</div>
          <div class="font-bold text-amber-900 text-xs">${inv ? inv.status.toUpperCase() : '—'}</div>
        </div>`}
      </div>
      <button class="btn btn-secondary w-full text-sm">View full profile →</button>
    </div>
  `;
}

function viewChildDetail(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  const inv = COMPUTE.studentInvoice(studentId);
  const attRate = COMPUTE.attendanceRate(studentId);
  const results = COMPUTE.studentResults(studentId);
  const subjects = DB.get('subjects');
  const recentAtt = COMPUTE.studentAttendance(studentId).slice(-10).reverse();
  const assignments = DB.query('assignments', a => a.classId === s.classId);

  modal({
    title: `${s.name}'s Profile`,
    size: 'lg',
    body: `
      <div class="text-center mb-4 pb-4 border-b border-slate-100">
        ${avatar(s.name, 'xl')}
        <h2 class="text-xl font-bold text-slate-900 mt-3">${s.name}</h2>
        <p class="text-sm text-slate-500">${cls ? cls.name : ''} · ${calcAge(s.dob)} years</p>
      </div>

      ${tabs([
        { key: 'overview', label: 'Overview' },
        { key: 'results', label: 'Results' },
        { key: 'attendance', label: 'Attendance' },
        { key: 'assignments', label: 'Homework', badge: assignments.length || null }
      ], APP.params.childTab || 'overview', (k) => { APP.params.childTab = k; viewChildDetail(studentId); })}

      <div class="pt-4">
        ${
          (APP.params.childTab === 'results') ? `
            <div class="space-y-2">
              ${results.length ? results.map(r => {
                const sub = subjects.find(x => x.id === r.subjectId);
                return `<div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div class="font-semibold text-sm">${sub ? sub.name : ''}</div>
                    <div class="text-xs text-slate-500">CA1: ${r.ca1} · CA2: ${r.ca2} · Exam: ${r.exam}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-lg">${r.total}<span class="text-sm text-slate-400">/100</span></div>
                    <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'}">${r.grade}</span>
                  </div>
                </div>`;
              }).join('') : emptyState({ title: 'No results yet', body: 'Results will appear here once teachers submit them.', icon: 'results' })}
              ${results.length ? `<button class="btn btn-secondary w-full" onclick="printReportCard('${studentId}')">${icon('download','w-4 h-4')} Download Report Card</button>` : ''}
            </div>
          ` : (APP.params.childTab === 'attendance') ? `
            <div class="mb-3 grid grid-cols-3 gap-2 text-center">
              <div class="bg-emerald-50 p-3 rounded-xl"><div class="text-xs text-emerald-700">Present</div><div class="font-bold text-emerald-900">${recentAtt.filter(a=>a.status==='present').length}</div></div>
              <div class="bg-amber-50 p-3 rounded-xl"><div class="text-xs text-amber-700">Late</div><div class="font-bold text-amber-900">${recentAtt.filter(a=>a.status==='late').length}</div></div>
              <div class="bg-rose-50 p-3 rounded-xl"><div class="text-xs text-rose-700">Absent</div><div class="font-bold text-rose-900">${recentAtt.filter(a=>a.status==='absent').length}</div></div>
            </div>
            <div class="space-y-1">
              ${recentAtt.map(a => `<div class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                <span>${fdate(a.date, { long: true })}</span>
                ${statusBadge(a.status)}
              </div>`).join('')}
            </div>
          ` : (APP.params.childTab === 'assignments') ? `
            <div class="space-y-2">
              ${assignments.length ? assignments.map(a => {
                const sub = subjects.find(s2 => s2.id === a.subjectId);
                const submitted = a.submissions.some(sub => sub.studentId === studentId);
                return `<div class="p-3 bg-slate-50 rounded-xl">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-sm">${a.title}</span>
                    ${submitted ? '<span class="badge badge-success">Submitted</span>' : '<span class="badge badge-warn">Pending</span>'}
                  </div>
                  <div class="text-xs text-slate-600 mb-1">${sub ? sub.name : ''} · Due ${fdate(a.dueDate, { short: true })}</div>
                  <div class="text-sm text-slate-700">${a.description}</div>
                </div>`;
              }).join('') : emptyState({ title: 'No homework right now', icon: 'book' })}
            </div>
          ` : `
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Admission No.</div><code class="text-sm">${s.admissionNo}</code></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Date of Birth</div><div>${fdate(s.dob, { long: true })}</div></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Class</div><div>${cls ? cls.name : '—'}</div></div>
                <div class="p-3 bg-slate-50 rounded-xl"><div class="text-xs text-slate-500">Class Teacher</div><div>${(() => { const t = DB.find('teachers', cls.teacherId); return t ? t.name : '—'; })()}</div></div>
              </div>
              ${inv ? `<div class="p-4 bg-amber-50 rounded-xl">
                <div class="text-xs font-semibold text-amber-700 uppercase mb-1">Fees Status</div>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-bold text-amber-900">${money(inv.balance)} <span class="text-sm font-normal">outstanding</span></div>
                    <div class="text-xs text-amber-700">Paid ${money(inv.paid)} of ${money(inv.total)}</div>
                  </div>
                  ${inv.balance > 0 ? `<button class="btn btn-primary" onclick="payNowFromChild('${studentId}')">Pay Now</button>` : ''}
                </div>
              </div>` : ''}
            </div>
          `
        }
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.params.childTab = null">Close</button>`
  });
}

function payNowFromChild(studentId) {
  document.getElementById('modalBackdrop').click();
  APP.go('par_fees');
  setTimeout(() => payInvoiceModal(COMPUTE.studentInvoice(studentId).id), 200);
}

function printReportCard(studentId) {
  const s = DB.find('students', studentId);
  const cls = DB.find('classes', s.classId);
  const results = COMPUTE.studentResults(studentId);
  const subjects = DB.get('subjects');
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const avg = results.length ? Math.round(total / results.length) : 0;
  const attRate = COMPUTE.attendanceRate(studentId);
  const html = `
    <div style="max-width:780px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <p style="margin:4px 0;color:#666">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:12px 0 0;font-size:20px">STUDENT REPORT CARD</h2>
        <p style="margin:4px 0">${DB.settings().currentTerm}</p>
      </div>
      <table style="width:100%;margin-bottom:20px"><tr>
        <td><strong>Student:</strong> ${s.name}<br/><strong>Class:</strong> ${cls.name}<br/><strong>Admission No:</strong> ${s.admissionNo}</td>
        <td style="text-align:right"><strong>DOB:</strong> ${fdate(s.dob, { long: true })}<br/><strong>Gender:</strong> ${s.gender==='M'?'Male':'Female'}<br/><strong>Attendance:</strong> ${attRate}%</td>
      </tr></table>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-size:13px">
        <thead style="background:#f3f4f6">
          <tr><th align="left">Subject</th><th>CA1/20</th><th>CA2/20</th><th>Exam/60</th><th>Total</th><th>Grade</th><th>Remark</th></tr>
        </thead>
        <tbody>
          ${results.map(r => {
            const sub = subjects.find(x => x.id === r.subjectId);
            const { remark } = COMPUTE.gradeFromScore(r.total);
            return `<tr><td>${sub ? sub.name : '—'}</td><td align="center">${r.ca1}</td><td align="center">${r.ca2}</td><td align="center">${r.exam}</td><td align="center"><strong>${r.total}</strong></td><td align="center"><strong>${r.grade}</strong></td><td>${remark}</td></tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f3f4f6;font-weight:bold"><td colspan="4">Average</td><td colspan="3">${avg}%</td></tr>
        </tfoot>
      </table>
      <div style="margin-top:30px;display:flex;justify-content:space-between">
        <div><strong>Class Teacher</strong><br/><br/>____________________</div>
        <div><strong>Head Teacher</strong><br/><br/>____________________</div>
      </div>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Generated by CASPAA · ${fdate(today(), { long: true })}</p>
    </div>
  `;
  printElement(html);
}

/* ---------- My Children ---------- */
function view_par_children() {
  const children = parentChildren();
  return `
    ${pageHeader({ title: 'My Children', subtitle: `${children.length} ${children.length===1?'child':'children'} at Bright Lights Academy` })}
    <div class="grid sm:grid-cols-2 gap-4">
      ${children.map(c => renderChildCard(c)).join('')}
    </div>
  `;
}

/* ---------- Fees & Payment ---------- */
function view_par_fees() {
  const children = parentChildren();
  const invoices = children.map(c => COMPUTE.studentInvoice(c.id)).filter(Boolean);
  const totalDue = invoices.reduce((s, i) => s + i.balance, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);

  return `
    ${pageHeader({ title: 'Fees & Payment', subtitle: DB.settings().currentTerm })}

    <div class="card bg-gradient-to-br from-brand-700 to-brand-800 text-white p-5 mb-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-brand-200 text-xs uppercase">Total Outstanding</div>
          <div class="text-3xl font-extrabold">${money(totalDue)}</div>
        </div>
        <div class="text-right">
          <div class="text-brand-200 text-xs uppercase">Paid So Far</div>
          <div class="text-3xl font-extrabold text-emerald-200">${money(totalPaid)}</div>
        </div>
      </div>
      ${totalDue > 0 ? `<button class="btn btn-gold w-full mt-4 !py-3 text-base" onclick="payAllModal()">${icon('fees','w-5 h-5')} Pay All Fees Now</button>` : ''}
    </div>

    <div class="space-y-3">
      ${invoices.map(inv => {
        const s = DB.find('students', inv.studentId);
        const cls = DB.find('classes', s.classId);
        const pct = inv.total ? Math.round((inv.paid / inv.total) * 100) : 0;
        return `<div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            ${avatar(s.name, 'md')}
            <div class="flex-1">
              <div class="font-bold text-slate-900">${s.name}</div>
              <div class="text-xs text-slate-500">${cls ? cls.name : ''} · ${inv.term}</div>
            </div>
            ${statusBadge(inv.status)}
          </div>

          <div class="space-y-1 mb-3">
            ${inv.lineItems.map(l => `<div class="flex justify-between text-sm">
              <span class="text-slate-600">${l.name}</span>
              <span class="font-mono">${money(l.amount)}</span>
            </div>`).join('')}
            <div class="flex justify-between text-sm font-semibold border-t border-slate-100 pt-1 mt-1">
              <span>Total</span>
              <span class="font-mono">${money(inv.total)}</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Paid ${money(inv.paid)} of ${money(inv.total)}</span>
              <span class="font-semibold">${pct}%</span>
            </div>
            <div class="progress"><div class="progress-bar" style="width: ${pct}%"></div></div>
          </div>

          <div class="grid grid-cols-2 gap-2 mt-3">
            <button class="btn btn-secondary" onclick="viewInvoice('${inv.id}')">View Invoice</button>
            ${inv.balance > 0 ? `<button class="btn btn-primary" onclick="payInvoiceModal('${inv.id}')">Pay ${money(inv.balance)}</button>` : `<button class="btn btn-secondary" onclick="downloadReceipt('${inv.id}')">${icon('download','w-4 h-4')} Receipt</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function viewInvoice(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  const cls = DB.find('classes', s.classId);
  modal({
    title: 'Invoice Details',
    body: `
      <div class="print-area">
        <div class="text-center mb-4 pb-3 border-b">
          <h2 class="text-xl font-bold text-brand-700">BRIGHT LIGHTS ACADEMY</h2>
          <p class="text-xs text-slate-500">15 Liberty Estate, Lekki, Lagos</p>
        </div>
        <div class="grid grid-cols-2 text-sm mb-4">
          <div>
            <div class="text-xs text-slate-500">BILLED TO</div>
            <div class="font-semibold">${DB.find('parents', s.parentId).name}</div>
            <div class="text-xs">For: ${s.name}</div>
            <div class="text-xs">${cls ? cls.name : ''}</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500">INVOICE NO.</div>
            <code class="text-sm">${inv.id.toUpperCase().slice(-10)}</code>
            <div class="text-xs text-slate-500 mt-2">DUE DATE</div>
            <div class="text-sm">${fdate(inv.dueDate, { long: true })}</div>
          </div>
        </div>
        <table class="w-full text-sm border-t">
          <thead><tr class="border-b"><th class="text-left py-2">Description</th><th class="text-right py-2">Amount</th></tr></thead>
          <tbody>
            ${inv.lineItems.map(l => `<tr class="border-b"><td class="py-2">${l.name}</td><td class="text-right font-mono py-2">${money(l.amount)}</td></tr>`).join('')}
          </tbody>
          <tfoot>
            <tr><td class="pt-3 font-bold">Total</td><td class="text-right font-bold pt-3 font-mono">${money(inv.total)}</td></tr>
            <tr><td class="text-emerald-700">Paid</td><td class="text-right font-mono text-emerald-700">${money(inv.paid)}</td></tr>
            <tr><td class="font-bold text-rose-700">Balance</td><td class="text-right font-bold text-rose-700 font-mono">${money(inv.balance)}</td></tr>
          </tfoot>
        </table>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window.print()">${icon('download','w-4 h-4')} Print</button>
      ${inv.balance > 0 ? `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); payInvoiceModal('${invoiceId}')">Pay Now</button>` : ''}
    `
  });
}

/* ---------- Paystack-style Payment Flow ---------- */
function payInvoiceModal(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  modal({
    title: 'Pay School Fees',
    body: `
      <div class="text-center mb-4">
        ${avatar(s.name, 'lg')}
        <div class="mt-3 font-bold text-slate-900">${s.name}</div>
        <div class="text-xs text-slate-500">Outstanding balance</div>
        <div class="text-3xl font-extrabold text-brand-700 mt-1">${money(inv.balance)}</div>
      </div>

      <div class="bg-slate-50 rounded-xl p-3 mb-4">
        <label class="input-label">Pay Amount</label>
        <input id="pay_amount" type="number" class="input text-xl font-bold" value="${inv.balance}" max="${inv.balance}" min="1" />
        <div class="flex gap-2 mt-2">
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${Math.round(inv.balance / 3)}">⅓</button>
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${Math.round(inv.balance / 2)}">½</button>
          <button class="chip" onclick="document.getElementById('pay_amount').value = ${inv.balance}">Full</button>
        </div>
      </div>

      <div>
        <label class="input-label">Payment Method</label>
        <div class="space-y-2">
          <label class="flex items-center gap-3 p-3 border-2 border-brand-500 rounded-xl cursor-pointer bg-brand-50">
            <input type="radio" name="payMethod" value="card" checked class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">Debit / Credit Card</div>
              <div class="text-xs text-slate-500">Verve, Mastercard, Visa</div>
            </div>
            <div class="text-xs text-slate-400">Instant</div>
          </label>
          <label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
            <input type="radio" name="payMethod" value="transfer" class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">Bank Transfer</div>
              <div class="text-xs text-slate-500">Pay to a dedicated account</div>
            </div>
            <div class="text-xs text-slate-400">Instant</div>
          </label>
          <label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
            <input type="radio" name="payMethod" value="ussd" class="text-brand-600" />
            <div class="flex-1">
              <div class="font-semibold text-sm">USSD</div>
              <div class="text-xs text-slate-500">Dial code on your phone</div>
            </div>
            <div class="text-xs text-slate-400">No internet</div>
          </label>
        </div>
      </div>

      <p class="text-xs text-slate-400 text-center mt-3">Powered by <strong class="text-brand-700">Paystack</strong> · Your card details are never stored.</p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" id="proceedPay" onclick="processPayment('${invoiceId}')">${icon('check','w-4 h-4')} Proceed to Pay</button>
    `
  });
}

function processPayment(invoiceId) {
  const amount = parseInt(document.getElementById('pay_amount').value);
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const inv = DB.find('invoices', invoiceId);
  if (!amount || amount <= 0 || amount > inv.balance) { toast('Enter a valid amount', 'danger'); return; }

  document.getElementById('proceedPay').innerHTML = '<div class="spinner"></div> Processing…';
  document.getElementById('proceedPay').disabled = true;

  // Simulate Paystack iframe / USSD instruction
  if (method === 'ussd') {
    setTimeout(() => {
      document.getElementById('modalBackdrop').click();
      modal({
        title: 'Dial This USSD Code',
        body: `
          <div class="text-center py-4">
            <div class="text-xs text-slate-500 mb-2">On your phone, dial:</div>
            <div class="text-4xl font-extrabold text-brand-700 font-mono">*737*50*${amount}#</div>
            <p class="text-sm text-slate-500 mt-4">Follow the prompts on your phone to complete payment. The system will detect and confirm automatically.</p>
            <button class="btn btn-primary mt-4" onclick="completePayment('${invoiceId}', ${amount}, 'ussd')">I've completed the USSD</button>
          </div>
        `
      });
    }, 800);
    return;
  }

  // Card/Transfer flow
  setTimeout(() => completePayment(invoiceId, amount, method), 1500);
}

function completePayment(invoiceId, amount, method) {
  const inv = DB.find('invoices', invoiceId);
  const newPaid = inv.paid + amount;
  const newBalance = inv.total - newPaid;
  let newStatus = 'outstanding';
  if (newBalance <= 0) newStatus = 'paid';
  else if (newPaid > 0) newStatus = 'partial';

  const txn = {
    id: uid('txn'),
    schoolId: inv.schoolId,
    invoiceId: inv.id,
    studentId: inv.studentId,
    amount, method,
    reference: 'CSP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: 'successful',
    gateway: 'Paystack',
    timestamp: now(),
    reconciled: true
  };
  DB.insert('transactions', txn);
  DB.update('invoices', invoiceId, { paid: newPaid, balance: newBalance, status: newStatus });
  // Notify parent
  DB.insert('notifications', { id: uid('not'), userId: AUTH.current.id, title: 'Payment Received', body: `Your payment of ${money(amount)} was successful.`, type: 'success', read: false, timestamp: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: inv.schoolId, actor: AUTH.current.id, action: 'payment', target: `${money(amount)} for ${DB.find('students', inv.studentId).name}`, timestamp: now() });

  document.getElementById('modalBackdrop').click();
  modal({
    title: 'Payment Successful!',
    body: `
      <div class="text-center py-6">
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">${icon('check','w-12 h-12')}</div>
        <h2 class="text-2xl font-bold text-slate-900">${money(amount)}</h2>
        <p class="text-slate-500 mt-1">paid successfully</p>
        <div class="bg-slate-50 rounded-xl p-3 mt-5 text-left text-sm">
          <div class="flex justify-between py-1"><span class="text-slate-500">Reference</span><code class="text-xs">${txn.reference}</code></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Method</span><span class="font-semibold capitalize">${method}</span></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Date</span><span>${fdate(txn.timestamp, { time: true })}</span></div>
          <div class="flex justify-between py-1"><span class="text-slate-500">Status</span>${statusBadge('successful')}</div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="downloadReceipt('${invoiceId}')">${icon('download','w-4 h-4')} Receipt</button>
      <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.render()">Done</button>
    `
  });
  toast(`Payment of ${money(amount)} successful`, 'success');
}

function downloadReceipt(invoiceId) {
  const inv = DB.find('invoices', invoiceId);
  const s = DB.find('students', inv.studentId);
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const txns = DB.query('transactions', t => t.invoiceId === invoiceId);
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #047857;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#047857">BRIGHT LIGHTS ACADEMY</h1>
        <p style="margin:4px 0;color:#666;font-size:13px">15 Liberty Estate, Lekki, Lagos · admin@brightlights.ng</p>
        <h2 style="margin:14px 0 4px;font-size:18px">OFFICIAL PAYMENT RECEIPT</h2>
      </div>
      <table style="width:100%;font-size:14px">
        <tr><td><strong>Received From:</strong></td><td align="right">${parent.name}</td></tr>
        <tr><td><strong>For Student:</strong></td><td align="right">${s.name} (${cls.name})</td></tr>
        <tr><td><strong>Term:</strong></td><td align="right">${inv.term}</td></tr>
        <tr><td><strong>Issued:</strong></td><td align="right">${fdate(now(), { long: true })}</td></tr>
      </table>
      <hr style="margin:20px 0;border:none;border-top:1px solid #ddd"/>
      <h3 style="margin-bottom:8px">Payment History</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead style="background:#f3f4f6"><tr><th align="left" style="padding:8px">Date</th><th align="left">Method</th><th align="left">Reference</th><th align="right" style="padding:8px">Amount</th></tr></thead>
        <tbody>
          ${txns.map(t => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${fdate(t.timestamp, { short: true })}</td><td>${t.method.toUpperCase()}</td><td><code style="font-size:11px">${t.reference}</code></td><td align="right" style="padding:8px"><strong>${money(t.amount)}</strong></td></tr>`).join('')}
        </tbody>
        <tfoot style="font-weight:bold;background:#d1fae5">
          <tr><td colspan="3" style="padding:10px">Total Paid</td><td align="right" style="padding:10px">${money(inv.paid)}</td></tr>
          <tr><td colspan="3" style="padding:10px">Balance</td><td align="right" style="padding:10px;color:${inv.balance > 0 ? '#dc2626' : '#059669'}">${money(inv.balance)}</td></tr>
        </tfoot>
      </table>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">This is a computer-generated receipt and does not require a signature.<br/>Powered by CASPAA School Operating System</p>
    </div>
  `;
  printElement(html);
}

function payAllModal() {
  const children = parentChildren();
  const invoices = children.map(c => COMPUTE.studentInvoice(c.id)).filter(i => i && i.balance > 0);
  if (invoices.length === 0) { toast('No outstanding fees', 'info'); return; }
  if (invoices.length === 1) { payInvoiceModal(invoices[0].id); return; }
  // Multi-child: pay invoices sequentially is heavy; show summary
  const total = invoices.reduce((s, i) => s + i.balance, 0);
  modal({
    title: 'Pay All Fees',
    body: `
      <p class="text-sm text-slate-600 mb-3">You're paying for ${invoices.length} children at once.</p>
      <div class="space-y-2 mb-4">
        ${invoices.map(i => {
          const s = DB.find('students', i.studentId);
          return `<div class="flex justify-between p-3 bg-slate-50 rounded-xl">
            <span>${s.name}</span>
            <span class="font-mono font-semibold">${money(i.balance)}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="border-t pt-3 flex justify-between font-bold text-lg">
        <span>Total</span><span class="text-brand-700">${money(total)}</span>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="payAllExecute(${JSON.stringify(invoices.map(i=>i.id)).replace(/"/g,'&quot;')})">${icon('check','w-4 h-4')} Pay ${money(total)}</button>
    `
  });
}

function payAllExecute(invoiceIds) {
  document.getElementById('modalBackdrop').click();
  setTimeout(() => payInvoiceModal(invoiceIds[0]), 200);
  // For brevity, we pay them one at a time, starting with the first
}

/* ---------- Loans ---------- */
function view_par_loans() {
  const parentId = AUTH.current.id;
  const loans = COMPUTE.parentLoans(parentId);
  const creditScore = COMPUTE.computeCreditScore(parentId);
  const eligibleAmount = Math.round(creditScore * 1000); // simple mock
  const scoreClass = creditScore >= 700
    ? { grad: 'from-emerald-500 to-emerald-700', text: 'text-emerald-100', btn: 'text-emerald-700', label: 'Excellent' }
    : creditScore >= 600
    ? { grad: 'from-amber-500 to-amber-700', text: 'text-amber-100', btn: 'text-amber-700', label: 'Good' }
    : { grad: 'from-rose-500 to-rose-700', text: 'text-rose-100', btn: 'text-rose-700', label: 'Fair' };

  return `
    ${pageHeader({ title: 'School Fee Loans', subtitle: 'Spread fee payments. Get a decision in minutes.' })}

    <div class="card p-5 mb-4 bg-gradient-to-br ${scoreClass.grad} text-white">
      <div class="flex items-center justify-between">
        <div>
          <div class="${scoreClass.text} text-xs uppercase font-semibold">Your CASPAA Credit Score</div>
          <div class="text-5xl font-extrabold">${creditScore}</div>
          <div class="${scoreClass.text} text-sm mt-1">${scoreClass.label} · Eligible up to ${money(eligibleAmount)}</div>
        </div>
        <div class="text-right">
          <button class="bg-white ${scoreClass.btn} px-4 py-2 rounded-xl font-bold" onclick="applyLoanModal()">Apply for Loan</button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mt-4 text-sm">
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">Payment History</div>
          <div class="font-bold">Strong</div>
        </div>
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">School Tenure</div>
          <div class="font-bold">2+ years</div>
        </div>
        <div class="bg-white/15 rounded-lg p-2">
          <div class="${scoreClass.text} text-xs">Income Tier</div>
          <div class="font-bold">Verified</div>
        </div>
      </div>
    </div>

    ${loans.length === 0 ? emptyState({
      title: 'No loans yet',
      body: 'Apply for school fee financing to spread your child\'s school fees across the term.',
      icon: 'loan',
      action: `<button class="btn btn-primary" onclick="applyLoanModal()">${icon('plus','w-4 h-4')} Apply Now</button>`
    }) : `
      <h3 class="font-bold text-slate-900 mb-3">My Loans</h3>
      <div class="space-y-3">
        ${loans.map(l => renderLoanCard(l)).join('')}
      </div>
    `}
  `;
}

function renderLoanCard(loan) {
  if (loan.status === 'pending') {
    return `<div class="card p-4 border-l-4 border-amber-500">
      <div class="flex items-center justify-between mb-2">
        <div>
          <span class="badge badge-warn">Under Review</span>
          <h4 class="font-bold text-slate-900 mt-1">Loan Application</h4>
          <p class="text-xs text-slate-500">Applied ${fdate(loan.appliedAt, { relative: true })}</p>
        </div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        Our risk engine is reviewing your application. Decision usually within 24 hours.
      </div>
    </div>`;
  }
  const paidCount = loan.repayments.filter(r => r.paid).length;
  const totalCount = loan.repayments.length;
  const nextPayment = loan.repayments.find(r => !r.paid);
  return `<div class="card p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        ${statusBadge(loan.status)}
        <h4 class="font-bold text-lg text-slate-900 mt-1">${money(loan.amount)} loan</h4>
        <p class="text-xs text-slate-500">${loan.term}-month term · ${loan.interestRate}% interest</p>
      </div>
      <div class="text-right">
        <div class="text-xs text-slate-500">Monthly</div>
        <div class="font-bold">${money(loan.monthlyPayment)}</div>
      </div>
    </div>
    <div class="space-y-2 mb-3">
      <div class="flex justify-between text-xs">
        <span class="text-slate-500">Repaid ${paidCount}/${totalCount}</span>
        <span class="font-semibold">${Math.round((paidCount/totalCount)*100)}%</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width: ${(paidCount/totalCount)*100}%"></div></div>
    </div>
    ${nextPayment ? `<div class="bg-slate-50 rounded-xl p-3 text-sm flex items-center justify-between">
      <div>
        <div class="text-xs text-slate-500">Next payment</div>
        <div class="font-semibold">${money(nextPayment.amount)} · ${fdate(nextPayment.dueDate, { long: true })}</div>
      </div>
      <button class="btn btn-primary !py-1.5" onclick="payLoanInstallment('${loan.id}')">Pay Now</button>
    </div>` : `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">${icon('check','w-4 h-4 inline')} Loan fully repaid. Thank you!</div>`}
  </div>`;
}

function applyLoanModal() {
  const children = parentChildren();
  modal({
    title: 'Apply for School Fee Loan',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          <strong>How it works:</strong> Tell us how much you need, choose a repayment term, and we'll give you an instant decision. No paperwork required.
        </div>

        <div>
          <label class="input-label">Which children is this for?</label>
          <div class="space-y-2">
            ${children.map(c => `<label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500">
              <input type="checkbox" name="loanChild" value="${c.id}" />
              ${avatar(c.name, 'sm')}
              <div class="flex-1">
                <div class="font-semibold text-sm">${c.name}</div>
                <div class="text-xs text-slate-500">${(DB.find('classes', c.classId) || {}).name}</div>
              </div>
              <div class="text-sm font-semibold">${money((COMPUTE.studentInvoice(c.id) || {}).balance || 0)}</div>
            </label>`).join('')}
          </div>
        </div>

        <div>
          <label class="input-label">Loan Amount Needed</label>
          <input id="ln_amount" type="number" class="input text-xl font-bold" placeholder="250000" />
          <input id="ln_slider" type="range" min="50000" max="1000000" step="10000" value="250000" class="w-full mt-2" oninput="document.getElementById('ln_amount').value = this.value; updateLoanCalc()" />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>${money(50000)}</span><span>${money(1000000)}</span>
          </div>
        </div>

        <div>
          <label class="input-label">Repayment Term</label>
          <div class="grid grid-cols-4 gap-2">
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold text-sm" data-term="3" onclick="selectTerm(3)">3 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="6" onclick="selectTerm(6)">6 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="9" onclick="selectTerm(9)">9 months</button>
            <button class="ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm" data-term="12" onclick="selectTerm(12)">12 months</button>
          </div>
        </div>

        <div class="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-2xl p-4">
          <div class="text-xs text-brand-200 uppercase font-semibold">Your Monthly Payment</div>
          <div class="text-3xl font-extrabold" id="ln_monthly">${money(43750)}</div>
          <div class="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div><div class="text-brand-200">Total to repay</div><div class="font-bold" id="ln_total">${money(262500)}</div></div>
            <div><div class="text-brand-200">Interest</div><div class="font-bold" id="ln_interest">${money(12500)}</div></div>
            <div><div class="text-brand-200">Rate</div><div class="font-bold">5%</div></div>
          </div>
        </div>

        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" id="ln_consent" />
          <span class="text-slate-600">I authorize CASPAA to auto-debit my registered account on each due date.</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="submitLoanApplication()">${icon('check','w-4 h-4')} Submit Application</button>`
  });
  setTimeout(updateLoanCalc, 50);
}

let _selectedTerm = 3;
function selectTerm(months) {
  _selectedTerm = months;
  document.querySelectorAll('.ln-term').forEach(b => {
    if (parseInt(b.dataset.term) === months) {
      b.className = 'ln-term px-3 py-2 rounded-lg border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold text-sm';
    } else {
      b.className = 'ln-term px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-sm';
    }
  });
  updateLoanCalc();
}

function updateLoanCalc() {
  const amount = parseInt(document.getElementById('ln_amount').value) || 0;
  const term = _selectedTerm;
  const rate = 0.05;
  const interest = Math.round(amount * rate);
  const total = amount + interest;
  const monthly = Math.round(total / term);
  document.getElementById('ln_monthly').textContent = money(monthly);
  document.getElementById('ln_total').textContent = money(total);
  document.getElementById('ln_interest').textContent = money(interest);
}

function submitLoanApplication() {
  const amount = parseInt(document.getElementById('ln_amount').value) || 0;
  const consent = document.getElementById('ln_consent').checked;
  const childrenSel = Array.from(document.querySelectorAll('input[name="loanChild"]:checked')).map(c => c.value);

  if (!consent) { toast('Please consent to auto-debit', 'danger'); return; }
  if (amount < 50000) { toast('Minimum loan amount is ₦50,000', 'danger'); return; }
  if (childrenSel.length === 0) { toast('Select at least one child', 'danger'); return; }

  document.getElementById('modalBackdrop').click();

  // Simulate processing with the Risk Engine
  modal({
    title: 'Reviewing your application…',
    body: `
      <div class="text-center py-6">
        <div class="spinner mx-auto mb-4" style="width:40px;height:40px;border-color:#047857 transparent transparent transparent;border-width:4px"></div>
        <p class="font-semibold text-slate-900">Running risk assessment</p>
        <p class="text-sm text-slate-500 mt-1">This usually takes 10-15 seconds</p>
        <div id="riskSteps" class="text-left mt-4 space-y-2 text-sm"></div>
      </div>
    `
  });

  const steps = [
    'Verifying identity (NIN)…',
    'Checking payment history…',
    'Computing credit score…',
    'Analyzing school relationship…',
    'Final decision…'
  ];
  let i = 0;
  const stepEl = document.getElementById('riskSteps');
  const interval = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(interval);
      finalizeLoanDecision(amount, _selectedTerm, childrenSel);
      return;
    }
    stepEl.innerHTML += `<div class="flex items-center gap-2"><span class="text-emerald-600">${icon('check','w-4 h-4')}</span>${steps[i]}</div>`;
    i++;
  }, 600);
}

function finalizeLoanDecision(amount, term, childrenSel) {
  const score = COMPUTE.computeCreditScore(AUTH.current.id);
  const approved = score >= 580;
  const interest = Math.round(amount * 0.05);
  const total = amount + interest;
  const monthly = Math.round(total / term);

  document.getElementById('modalBackdrop').click();

  if (!approved) {
    modal({
      title: 'Application Decision',
      body: `<div class="text-center py-6">
        <div class="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">${icon('x','w-8 h-8')}</div>
        <h2 class="text-lg font-bold">We can't offer you this loan right now</h2>
        <p class="text-sm text-slate-500 mt-2">Your current credit score is ${score}. We recommend building up your payment history with smaller amounts first.</p>
      </div>`,
      footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">OK</button>`
    });
    return;
  }

  // Create the loan
  const repayments = [];
  for (let m = 1; m <= term; m++) {
    repayments.push({ dueDate: daysAhead(30 * m), amount: monthly, paid: false });
  }
  const loan = {
    id: uid('loan'), schoolId: 'sch_brightlights', parentId: AUTH.current.id,
    studentIds: childrenSel, amount, term, interestRate: 5,
    totalRepayment: total, monthlyPayment: monthly,
    status: 'active', creditScore: score,
    appliedAt: now(), approvedAt: now(),
    repayments
  };
  DB.insert('loans', loan);

  modal({
    title: '🎉 Loan Approved!',
    body: `
      <div class="text-center py-4">
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">${icon('check','w-12 h-12')}</div>
        <h2 class="text-2xl font-bold text-slate-900">${money(amount)}</h2>
        <p class="text-slate-500">approved and disbursed</p>
      </div>
      <div class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">Monthly payment</span><strong>${money(monthly)}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">Total to repay</span><strong>${money(total)}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">First payment due</span><strong>${fdate(repayments[0].dueDate, { long: true })}</strong></div>
        <div class="flex justify-between"><span class="text-slate-500">Interest rate</span><strong>5%</strong></div>
      </div>
      <p class="text-xs text-slate-400 mt-3 text-center">The school will receive ${money(amount)} directly. Your fees are now covered.</p>
    `,
    footer: `<button class="btn btn-primary w-full" onclick="document.getElementById('modalBackdrop').click(); APP.render()">View My Loan</button>`
  });
  toast('Loan approved and disbursed!', 'success');
}

function payLoanInstallment(loanId) {
  const loan = DB.find('loans', loanId);
  const next = loan.repayments.find(r => !r.paid);
  if (!next) return;
  next.paid = true;
  next.paidAt = now();
  DB.update('loans', loanId, { repayments: loan.repayments });
  toast(`Installment of ${money(next.amount)} paid`);
  APP.render();
}

/* ---------- Messages & Announcements (delegated) ---------- */
function view_par_messages() { return view_messages_shared('parent'); }
function view_par_announce() { return view_announce_shared('parent'); }
