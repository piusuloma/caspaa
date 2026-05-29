/* ============================================================
   SUPER ADMIN MODULE (CASPAA Platform Operator)
   ============================================================ */

function view_sa_dashboard() {
  const schools = DB.get('schools');
  const active = schools.filter(s => s.status === 'active');
  const trial = schools.filter(s => s.status === 'trial');
  const totalStudents = schools.reduce((s, x) => s + x.students, 0);
  const mrr = active.reduce((s, x) => s + x.monthlyFee, 0);
  const arr = mrr * 12;

  const allTxns = DB.query('transactions', t => t.status === 'successful');
  const platformFees = allTxns.reduce((s, t) => s + Math.round(t.amount * 0.015), 0); // 1.5% transaction fee

  const allLoans = DB.get('loans').filter(l => l.status === 'active');
  const loanBook = allLoans.reduce((s, l) => s + l.amount, 0);
  const interestRev = allLoans.reduce((s, l) => s + (l.totalRepayment - l.amount), 0);

  window.afterRender = () => {
    const ctx1 = document.getElementById('saChart1');
    if (ctx1) {
      new Chart(ctx1, {
        type: 'line',
        data: {
          labels: ['Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [{
            label: 'MRR',
            data: [1500000, 1800000, 2100000, 2500000, 2900000, mrr],
            borderColor: '#047857', backgroundColor: 'rgba(16,185,129,0.12)',
            tension: 0.35, fill: true, borderWidth: 3
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => '₦' + (v/1000000).toFixed(1) + 'M' } } } }
      });
    }
    const ctx2 = document.getElementById('saChart2');
    if (ctx2) {
      new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['SaaS', 'Payment Fees', 'Lending Interest'],
          datasets: [{ data: [mrr, platformFees, interestRev], backgroundColor: ['#047857', '#f59e0b', '#3b82f6'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
      });
    }
  };

  return `
    <div class="space-y-5">
      <div class="bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-5 lg:p-6 text-white">
        <p class="text-brand-200 text-sm">CASPAA Platform Control</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold">Hello, ${AUTH.current.name.split(' ')[0]}</h1>
        <p class="text-brand-100 text-sm mt-1">Monitoring ${schools.length} schools across Nigeria</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'Total Schools', value: schools.length, icon: 'building', color: 'brand', trend: { direction: 'up', label: `+${trial.length} on trial` } })}
        ${statCard({ label: 'Students', value: totalStudents.toLocaleString(), icon: 'students', color: 'blue' })}
        ${statCard({ label: 'MRR', value: money(mrr), icon: 'fees', color: 'gold', trend: { direction: 'up', label: '+22% MoM' } })}
        ${statCard({ label: 'ARR', value: money(arr), icon: 'trending_up', color: 'purple' })}
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
        ${statCard({ label: 'Payment Volume', value: money(allTxns.reduce((s,t)=>s+t.amount,0)), icon: 'fees', color: 'brand' })}
        ${statCard({ label: 'Loan Book', value: money(loanBook), icon: 'loan', color: 'gold' })}
        ${statCard({ label: 'Platform Revenue', value: money(mrr + platformFees + interestRev), icon: 'trending_up', color: 'purple' })}
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-bold text-slate-900 mb-3">MRR Growth</h3>
          <div style="height: 220px;"><canvas id="saChart1"></canvas></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3">Revenue Mix</h3>
          <div style="height: 220px;"><canvas id="saChart2"></canvas></div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Schools by Health</h3>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('sa_schools')">All schools →</button>
        </div>
        <table class="tbl">
          <thead><tr><th>School</th><th>Plan</th><th>Students</th><th>MRR</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>
            ${schools.map(s => `<tr>
              <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<div><div class="font-medium">${s.name}</div><div class="text-xs text-slate-500">${s.proprietor}</div></div></div></td>
              <td><span class="badge ${s.subscriptionPlan==='Enterprise'?'badge-success':s.subscriptionPlan==='Growth'?'badge-info':'badge-neutral'}">${s.subscriptionPlan}</span></td>
              <td>${s.students}</td>
              <td class="font-mono font-semibold">${money(s.monthlyFee)}</td>
              <td class="text-xs text-slate-500">${fdate(s.joinedAt, { short: true })}</td>
              <td>${statusBadge(s.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------- Schools ---------- */
function view_sa_schools() {
  const schools = DB.get('schools');
  return `
    ${pageHeader({
      title: 'Schools',
      subtitle: 'Manage onboarded schools across the platform',
      actions: `<button class="btn btn-primary" onclick="onboardSchoolModal()">${icon('plus','w-4 h-4')} Onboard School</button>`
    })}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${schools.map(s => `<div class="card p-5">
        <div class="flex items-start justify-between mb-3">
          ${avatar(s.name, 'lg')}
          ${statusBadge(s.status)}
        </div>
        <h3 class="font-bold text-slate-900">${s.name}</h3>
        <p class="text-sm text-slate-500">${s.proprietor}</p>
        <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div><div class="text-xs text-slate-500">Students</div><div class="font-bold">${s.students}</div></div>
          <div><div class="text-xs text-slate-500">Plan</div><div class="font-bold">${s.subscriptionPlan}</div></div>
          <div><div class="text-xs text-slate-500">MRR</div><div class="font-bold font-mono">${money(s.monthlyFee)}</div></div>
          <div><div class="text-xs text-slate-500">Since</div><div class="font-bold">${fdate(s.joinedAt, { short: true })}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 mt-3">
          <button class="btn btn-secondary !py-1.5 text-xs">View</button>
          ${s.status === 'suspended' ?
            `<button class="btn btn-primary !py-1.5 text-xs" onclick="toggleSchoolStatus('${s.id}', 'active')">Reactivate</button>` :
            `<button class="btn btn-danger !py-1.5 text-xs" onclick="toggleSchoolStatus('${s.id}', 'suspended')">Suspend</button>`}
        </div>
      </div>`).join('')}
    </div>
  `;
}

function toggleSchoolStatus(schoolId, status) {
  DB.update('schools', schoolId, { status });
  toast(`School ${status === 'active' ? 'reactivated' : 'suspended'}`);
  APP.render();
}

function onboardSchoolModal() {
  modal({
    title: 'Onboard New School',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">School Name</label><input id="ns_name" class="input" /></div>
        <div><label class="input-label">Proprietor / Admin</label><input id="ns_prop" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Email</label><input id="ns_email" type="email" class="input" /></div>
          <div><label class="input-label">Phone</label><input id="ns_phone" class="input" /></div>
        </div>
        <div><label class="input-label">Address</label><input id="ns_addr" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Expected Students</label><input id="ns_stu" type="number" class="input" /></div>
          <div><label class="input-label">Plan</label>
            <select id="ns_plan" class="input"><option>Starter</option><option selected>Growth</option><option>Enterprise</option></select>
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveNewSchool()">Onboard</button>`
  });
}

function saveNewSchool() {
  const plan = document.getElementById('ns_plan').value;
  const planFees = { 'Starter': 45000, 'Growth': 95000, 'Enterprise': 250000 };
  DB.insert('schools', {
    id: uid('sch'),
    name: document.getElementById('ns_name').value.trim(),
    proprietor: document.getElementById('ns_prop').value.trim(),
    email: document.getElementById('ns_email').value.trim(),
    phone: document.getElementById('ns_phone').value.trim(),
    address: document.getElementById('ns_addr').value.trim(),
    students: parseInt(document.getElementById('ns_stu').value) || 0,
    teachers: 0,
    subscriptionPlan: plan, monthlyFee: planFees[plan],
    status: 'trial', joinedAt: today()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('School onboarded with 14-day free trial');
}

/* ---------- Revenue ---------- */
function view_sa_revenue() {
  const schools = DB.get('schools').filter(s => s.status === 'active');
  const mrr = schools.reduce((s, x) => s + x.monthlyFee, 0);

  return `
    ${pageHeader({ title: 'Revenue', subtitle: 'SaaS, payment, and lending revenue streams' })}
    <div class="grid grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'SaaS MRR', value: money(mrr), icon: 'fees', color: 'brand' })}
      ${statCard({ label: 'Payment Fees', value: money(2350000), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Interest', value: money(180000), icon: 'loan', color: 'blue' })}
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>School</th><th>Plan</th><th>Students</th><th>Monthly Fee</th><th>Status</th></tr></thead>
        <tbody>
          ${schools.map(s => `<tr>
            <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span class="font-medium">${s.name}</span></div></td>
            <td><span class="badge badge-info">${s.subscriptionPlan}</span></td>
            <td>${s.students}</td>
            <td class="font-mono font-bold">${money(s.monthlyFee)}</td>
            <td>${statusBadge(s.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Lending Book ---------- */
function view_sa_lending() {
  const loans = DB.get('loans');
  const active = loans.filter(l => l.status === 'active');
  const book = active.reduce((s, l) => s + l.amount, 0);
  const interest = active.reduce((s, l) => s + (l.totalRepayment - l.amount), 0);
  const repaid = active.reduce((s, l) => s + l.repayments.filter(r => r.paid).reduce((x, r) => x + r.amount, 0), 0);
  return `
    ${pageHeader({ title: 'Lending Book', subtitle: 'All loans across all schools' })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Loans', value: active.length, icon: 'loan', color: 'brand' })}
      ${statCard({ label: 'Total Disbursed', value: money(book), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Interest Income', value: money(interest), icon: 'trending_up', color: 'blue' })}
      ${statCard({ label: 'Repaid So Far', value: money(repaid), icon: 'check', color: 'purple' })}
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Loan ID</th><th>School</th><th>Parent</th><th>Amount</th><th>Term</th><th>Score</th><th>Status</th></tr></thead>
        <tbody>
          ${loans.map(l => {
            const p = DB.find('parents', l.parentId);
            const sch = DB.find('schools', l.schoolId);
            return `<tr>
              <td><code class="text-xs">${l.id.slice(-8)}</code></td>
              <td>${sch ? sch.name : '—'}</td>
              <td>${p ? p.name : '—'}</td>
              <td class="font-mono">${money(l.amount)}</td>
              <td>${l.term ? l.term + 'm' : '—'}</td>
              <td><strong>${l.creditScore || '—'}</strong></td>
              <td>${statusBadge(l.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Analytics ---------- */
function view_sa_analytics() {
  window.afterRender = () => {
    const c1 = document.getElementById('anaChart1');
    if (c1) new Chart(c1, {
      type: 'bar',
      data: {
        labels: ['Lekki', 'Ikoyi', 'Ikeja', 'VI', 'Magodo', 'Festac'],
        datasets: [{ label: 'Schools', data: [3, 2, 2, 1, 1, 1], backgroundColor: '#047857', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  };
  return `
    ${pageHeader({ title: 'Business Analytics', subtitle: 'Platform health and growth metrics' })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Users (DAU)', value: '1,247', icon: 'students', color: 'brand', trend: { direction: 'up', label: '+12%' } })}
      ${statCard({ label: 'MAU', value: '4,820', icon: 'students', color: 'blue' })}
      ${statCard({ label: 'NPS', value: '62', icon: 'trending_up', color: 'gold' })}
      ${statCard({ label: 'Crash-free', value: '99.7%', icon: 'check', color: 'purple' })}
    </div>
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-slate-900 mb-3">Schools by Location</h3>
      <div style="height: 220px;"><canvas id="anaChart1"></canvas></div>
    </div>
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Product KPIs</h3>
        <div class="space-y-3">
          <div><div class="flex justify-between text-sm mb-1"><span>Payment success rate</span><strong>96.4%</strong></div><div class="progress"><div class="progress-bar" style="width:96.4%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>Attendance submission rate</span><strong>88%</strong></div><div class="progress"><div class="progress-bar" style="width:88%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>Loan repayment rate</span><strong>94%</strong></div><div class="progress"><div class="progress-bar" style="width:94%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>School retention</span><strong>91%</strong></div><div class="progress"><div class="progress-bar" style="width:91%"></div></div></div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Technical KPIs</h3>
        <div class="space-y-3">
          <div><div class="flex justify-between text-sm mb-1"><span>Uptime (90 days)</span><strong>99.92%</strong></div><div class="progress"><div class="progress-bar" style="width:99.92%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>API response time</span><strong>187ms avg</strong></div><div class="progress"><div class="progress-bar" style="width:65%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>Offline sync success</span><strong>97%</strong></div><div class="progress"><div class="progress-bar" style="width:97%"></div></div></div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Audit Log ---------- */
function view_sa_audit() {
  const logs = DB.get('auditLog').sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  return `
    ${pageHeader({ title: 'Audit Log', subtitle: 'Every action tracked across the platform' })}
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>
          ${logs.map(l => `<tr>
            <td class="text-sm text-slate-500">${fdate(l.timestamp, { time: true })}</td>
            <td><code class="text-xs">${l.actor}</code></td>
            <td><span class="badge badge-info">${l.action.replace(/_/g,' ')}</span></td>
            <td class="text-sm">${l.target}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Settings ---------- */
function view_sa_settings() {
  return `
    ${pageHeader({ title: 'Platform Settings', subtitle: 'Feature flags, security, and global config' })}
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Feature Flags</h3>
        <div class="space-y-3">
          ${[
            { key: 'whatsapp', label: 'WhatsApp Integration', on: true },
            { key: 'lending', label: 'Lending Engine', on: true },
            { key: 'ai_comments', label: 'AI Report Comments', on: true },
            { key: 'offline', label: 'Offline Mode', on: true },
            { key: 'transport', label: 'Transport Module', on: false, badge: 'Beta' }
          ].map(f => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <div class="font-semibold text-sm">${f.label}</div>
              ${f.badge ? `<span class="badge badge-warn">${f.badge}</span>` : ''}
            </div>
            <input type="checkbox" ${f.on ? 'checked' : ''} class="w-5 h-5 accent-brand-600" />
          </label>`).join('')}
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Security</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div><div class="font-semibold text-sm">Encryption</div><div class="text-xs text-slate-500">AES-256 at rest, TLS 1.3 in transit</div></div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div><div class="font-semibold text-sm">MFA for admin roles</div><div class="text-xs text-slate-500">Email OTP required</div></div>
            <span class="badge badge-success">Enforced</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div><div class="font-semibold text-sm">Session timeout</div><div class="text-xs text-slate-500">Auto-logout after 30 minutes idle</div></div>
            <span class="badge badge-success">On</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div><div class="font-semibold text-sm">Daily Backups</div><div class="text-xs text-slate-500">Multi-region snapshots</div></div>
            <span class="badge badge-success">On</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
