/* ============================================================
   SUPER ADMIN MODULE (CASPAA Platform Operator)
   ============================================================ */

function view_sa_dashboard() {
  const schools = DB.get('schools');
  const active = schools.filter(s => s.status === 'active');
  const inactive = schools.filter(s => s.status === 'suspended');
  const trial = schools.filter(s => s.status === 'trial');
  const totalStudents = schools.reduce((s, x) => s + x.students, 0);
  const mrr = active.reduce((s, x) => s + x.monthlyFee, 0);
  const arr = mrr * 12;

  const allTxns = DB.query('transactions', t => t.status === 'successful');
  const platformFees = allTxns.reduce((s, t) => s + Math.round(t.amount * 0.015), 0); // 1.5% transaction fee

  const allLoans = DB.get('loans');
  const activeLoans = allLoans.filter(l => l.status === 'active');
  const pendingLoans = allLoans.filter(l => l.status === 'pending');
  const loanBook = activeLoans.reduce((s, l) => s + l.amount, 0);
  const interestRev = activeLoans.reduce((s, l) => s + (l.totalRepayment - l.amount), 0);
  const totalRepaid = activeLoans.reduce((s, l) => s + l.repayments.filter(r => r.paid).reduce((x, r) => x + r.amount, 0), 0);
  const outstandingLoans = loanBook - totalRepaid;
  // PAR: % of portfolio with at least one overdue repayment
  const defaultingLoans = activeLoans.filter(l => l.repayments.some(r => !r.paid && new Date(r.dueDate) < new Date()));
  const par = loanBook ? Math.round((defaultingLoans.reduce((s, l) => s + l.amount, 0) / loanBook) * 100) : 0;
  const studentsOnLoan = activeLoans.reduce((s, l) => s + (l.studentIds || []).length, 0);

  // Remittance metrics
  const remits = DB.get('remittances');
  const remittedTotal = remits.filter(r => r.status === 'completed').reduce((s, r) => s + r.amount, 0);
  const pendingRemits = remits.filter(r => r.status === 'pending');
  const pendingRemitAmount = pendingRemits.reduce((s, r) => s + r.amount, 0);

  // Top schools
  const topByVolume = schools.slice().sort((a, b) => b.students - a.students).slice(0, 10);
  const topByValue = schools.slice().sort((a, b) => b.monthlyFee * 12 - a.monthlyFee * 12).slice(0, 10);

  window.afterRender = () => {
    const el1 = document.getElementById('saChart1');
    if (el1 && typeof ApexCharts !== 'undefined') {
      // Defer so the grid column width is settled before ApexCharts measures it
      setTimeout(() => {
        el1.innerHTML = '';
        new ApexCharts(el1, {
          chart: { type: 'area', height: 250, width: '100%', parentHeightOffset: 0, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Figtree, system-ui, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 700 } },
          series: [{ name: 'MRR', data: [1500000, 1800000, 2100000, 2500000, 2900000, mrr] }],
          colors: ['#00b386'],
          stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.02, stops: [0, 95, 100] } },
          markers: { size: 0, colors: ['#00b386'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
          dataLabels: { enabled: false },
          grid: { borderColor: '#eef2f6', strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { top: 4, right: 14, bottom: 0, left: 6 } },
          xaxis: { categories: ['Jul','Aug','Sep','Oct','Nov','Dec'], axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false }, labels: { style: { colors: '#94a3b8', fontSize: '12px', fontWeight: 500 } } },
          yaxis: { labels: { formatter: v => '₦' + (v/1000000).toFixed(1) + 'M', style: { colors: '#94a3b8', fontSize: '12px' } } },
          tooltip: { theme: 'light', x: { show: true }, y: { formatter: v => '₦' + Number(v).toLocaleString('en-NG') }, marker: { show: true } }
        }).render();
      }, 60);
    }
  };

  // Compute composite school health (0-100)
  const computeSchoolHealth = (s) => {
    const inv = DB.query('invoices', i => i.schoolId === s.id);
    const collection = inv.length ? (inv.reduce((x, i) => x + i.paid, 0) / inv.reduce((x, i) => x + i.total, 0)) * 100 : 80;
    const att = DB.query('attendance', a => a.schoolId === s.id);
    const attRate = att.length ? (att.filter(a => a.status !== 'absent').length / att.length) * 100 : 85;
    const openTickets = DB.query('supportTickets', t => t.schoolId === s.id && t.status !== 'resolved').length;
    const sub = s.subscriptionPlan;
    const renewalDays = s.nextRenewal ? Math.ceil((new Date(s.nextRenewal) - new Date()) / 86400000) : 30;
    const ticketPenalty = Math.min(20, openTickets * 5);
    const renewalPenalty = renewalDays <= 0 ? 25 : (renewalDays <= 7 ? 10 : 0);
    const score = Math.round(Math.max(0, Math.min(100,
      collection * 0.35 + attRate * 0.3 + 50 * 0.2 + 70 * 0.15 - ticketPenalty - renewalPenalty
    )));
    return { score, tone: score >= 75 ? 'emerald' : score >= 55 ? 'amber' : 'rose' };
  };

  // Onboarding completion per school
  const computeOnboardingCompletion = (s) => {
    const steps = [
      s.kyc && s.kyc.cacUploaded,
      s.kyc && s.kyc.regNumber && s.kyc.regNumber !== 'Pending',
      s.subscriptionPlan,
      DB.query('teachers', t => t.schoolId === s.id).length > 0,
      DB.query('students', x => x.schoolId === s.id).length > 0,
      DB.query('feeStructures', f => f.schoolId === s.id).length > 0,
      DB.query('classes', c => c.schoolId === s.id).length > 0,
      (s.branding && s.branding.logoText) ? true : false
    ];
    return Math.round(steps.filter(Boolean).length / steps.length * 100);
  };

  // Build action queue
  const needsAttention = [];
  if (trial.length) needsAttention.push({ count: trial.length, label: `${trial.length} schools on trial`, sub: 'Convert before expiry', view: 'sa_schools', params: { schoolStatus: 'trial' }, tone: 'amber' });
  if (pendingRemits.length) needsAttention.push({ count: pendingRemits.length, label: `${pendingRemits.length} schools haven't remitted`, sub: `${money(pendingRemitAmount)} pending`, view: 'sa_revenue', params: { revTab: 'subscriptions' }, tone: 'amber' });
  if (pendingLoans.length) needsAttention.push({ count: pendingLoans.length, label: `${pendingLoans.length} loan${pendingLoans.length !== 1 ? 's' : ''} awaiting review`, sub: 'Credit team decision needed', view: 'sa_lending', params: {}, tone: 'rose' });
  const slaBreaching = DB.query('supportTickets', t => t.status !== 'resolved').filter(t => ((new Date() - new Date(t.createdAt)) / 3600000) > t.slaHours * 0.8).length;
  if (slaBreaching) needsAttention.push({ count: slaBreaching, label: `${slaBreaching} tickets at SLA risk`, sub: 'Escalate or reassign', view: 'sa_support', params: {}, tone: 'rose' });
  const kycPending = schools.filter(s => s.kyc && !s.kyc.cacUploaded).length;
  if (kycPending) needsAttention.push({ count: kycPending, label: `${kycPending} schools missing KYC docs`, sub: 'CAC certificate pending', view: 'sa_schools', params: {}, tone: 'amber' });
  const pendingVerif = schools.filter(s => s.verification && s.verification.status === 'pending').length;
  if (pendingVerif) needsAttention.push({ count: pendingVerif, label: `${pendingVerif} school${pendingVerif !== 1 ? 's' : ''} awaiting verification`, sub: 'Review KYC and approve to unlock payments', view: 'sa_schools', params: {}, tone: 'amber' });

  const platformRevenue = mrr + platformFees + interestRev;

  return `
    <div class="space-y-5">
      <!-- HERO: single big metric, everything else secondary -->
      <div class="bg-navy-900 rounded-2xl p-6 lg:p-8 text-white">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p class="text-brand-200 text-sm">Welcome back, ${AUTH.current.name.split(' ')[0]}</p>
            <h1 class="text-3xl lg:text-5xl font-extrabold tracking-tight mt-1">${active.length} <span class="text-brand-300 text-2xl lg:text-3xl">active schools</span></h1>
            <p class="text-brand-100 text-sm mt-2">${totalStudents.toLocaleString()} students · ${trial.length} on trial · ${inactive.length} suspended</p>
          </div>
          <div class="grid grid-cols-2 gap-3 lg:gap-4">
            <div>
              <div class="text-brand-200 text-xs uppercase font-semibold">MRR</div>
              <div class="text-2xl font-extrabold">${money(mrr)}</div>
              <div class="text-emerald-300 text-xs mt-0.5">↑ 22% MoM</div>
            </div>
            <div>
              <div class="text-brand-200 text-xs uppercase font-semibold">Platform Revenue</div>
              <div class="text-2xl font-extrabold">${money(platformRevenue)}</div>
              <div class="text-brand-200 text-xs mt-0.5">SaaS + fees + interest</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 KPI cards (was 8+) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'ARR', value: money(arr), icon: 'trending_up', color: 'brand' })}
        ${statCard({ label: 'Payment Volume', value: money(allTxns.reduce((s,t)=>s+t.amount,0)), icon: 'fees', color: 'brand' })}
        ${statCard({ label: 'Loan Book', value: money(loanBook), icon: 'loan', color: 'gold', trend: par > 10 ? { direction: 'down', label: `PAR ${par}%` } : { direction: 'up', label: `PAR ${par}%` } })}
        ${statCard({ label: 'Open Tickets', value: DB.query('supportTickets', t => t.status !== 'resolved').length, icon: 'chat', color: slaBreaching ? 'rose' : 'brand', trend: slaBreaching ? { direction: 'down', label: `${slaBreaching} at risk` } : null })}
      </div>

      <!-- Main chart + Action queue -->
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5 lg:col-span-2 overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">MRR Growth (6 months)</h3>
            <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('sa_revenue')">Revenue details →</button>
          </div>
          <div id="saChart1" style="min-height:250px;overflow:hidden"></div>
        </div>

        <!-- Needs Attention -->
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3 flex items-center gap-2">${icon('bell','w-4 h-4 text-rose-500')} Needs Attention</h3>
          ${needsAttention.length === 0 ? `<div class="bg-emerald-50 rounded-xl p-4 text-center text-sm text-emerald-800">${icon('check','w-6 h-6 mx-auto mb-1')}<div class="font-semibold">All clear today.</div></div>` : `
            <div class="space-y-2">
              ${needsAttention.map(n => `<button class="w-full flex items-center gap-3 p-2.5 bg-${n.tone}-50 hover:bg-${n.tone}-100 rounded-xl text-left transition" onclick="APP.go('${n.view}', ${JSON.stringify(n.params).replace(/"/g, '&quot;')})">
                <div class="w-9 h-9 rounded-lg bg-${n.tone}-200 text-${n.tone}-800 flex items-center justify-center font-bold flex-shrink-0">${n.count}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-${n.tone}-900 text-sm truncate">${n.label}</div>
                  <div class="text-xs text-${n.tone}-700 truncate">${n.sub}</div>
                </div>
                ${icon('arrow_left','w-4 h-4 text-' + n.tone + '-700 rotate-180')}
              </button>`).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Schools health grid: at-a-glance, color-coded, no raw numbers -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-slate-900">Schools at a Glance</h3>
            <p class="text-xs text-slate-500">Status dot shows composite health · click any card to drill in</p>
          </div>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('sa_schools')">All schools →</button>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          ${schools.map(s => {
            const h = computeSchoolHealth(s);
            const onboarding = computeOnboardingCompletion(s);
            const renewalDays = s.nextRenewal ? Math.ceil((new Date(s.nextRenewal) - new Date()) / 86400000) : null;
            const dotClasses = { emerald: 'bg-green-500', amber: 'bg-amber-500', rose: 'bg-red-500' };
            return `<button class="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition" onclick="viewSchoolDetail('${s.id}')">
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2 h-2 rounded-full ${dotClasses[h.tone]} flex-shrink-0" title="Health ${h.score}%"></span>
                  <div class="font-semibold text-sm text-slate-900 truncate">${s.name}</div>
                </div>
                ${statusBadge(s.status)}
              </div>
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div><div class="text-[11px] text-slate-400">Health</div><div class="font-semibold text-sm text-slate-800">${h.score}%</div></div>
                <div><div class="text-[11px] text-slate-400">Onboarding</div><div class="font-semibold text-sm text-slate-800">${onboarding}%</div></div>
                <div><div class="text-[11px] text-slate-400">Students</div><div class="font-semibold text-sm text-slate-800">${s.students}</div></div>
              </div>
              <div class="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
                <span class="text-slate-500">${s.subscriptionPlan}</span>
                <span class="${renewalDays !== null && renewalDays <= 7 ? 'text-red-600 font-semibold' : 'text-slate-400'}">${renewalDays === null ? '' : renewalDays <= 0 ? 'Overdue' : `Renews ${renewalDays}d`}</span>
              </div>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ---------- CSV exporters used by Overview ---------- */
function exportRemittancesCSV() {
  const remits = DB.get('remittances');
  const headers = ['School', 'Period', 'Amount', 'Status', 'Remitted At'];
  const rows = remits.map(r => {
    const sch = DB.find('schools', r.schoolId);
    return [sch ? sch.name : '', r.period, r.amount, r.status, r.remittedAt || ''];
  });
  downloadCSV(headers, rows, 'caspaa_remittances');
}

function exportTopSchoolsCSV(mode) {
  const schools = DB.get('schools').slice();
  schools.sort((a, b) => mode === 'value' ? (b.monthlyFee * 12) - (a.monthlyFee * 12) : b.students - a.students);
  const headers = mode === 'value'
    ? ['Rank', 'School', 'Proprietor', 'Plan', 'ARR', 'Status']
    : ['Rank', 'School', 'Proprietor', 'Students', 'Plan', 'Status'];
  const rows = schools.slice(0, 10).map((s, i) => mode === 'value'
    ? [i + 1, s.name, s.proprietor, s.subscriptionPlan, s.monthlyFee * 12, s.status]
    : [i + 1, s.name, s.proprietor, s.students, s.subscriptionPlan, s.status]);
  downloadCSV(headers, rows, mode === 'value' ? 'caspaa_top_schools_by_value' : 'caspaa_top_schools_by_volume');
}

function downloadCSV(headers, rows, filename) {
  const csv = [headers, ...rows].map(r => r.map(v => {
    const str = String(v == null ? '' : v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('CSV downloaded');
}

/* ---------- Schools ---------- */
function view_sa_schools() {
  const schools = DB.get('schools');
  const statusF = APP.params.schoolStatus || 'all';
  const filtered = statusF === 'all' ? schools : schools.filter(s => s.status === statusF);
  return `
    ${pageHeader({
      title: 'Schools',
      subtitle: 'Manage onboarded schools across the platform',
      actions: `
        <button class="btn btn-secondary" onclick="exportSchoolsCSV()">${icon('download','w-4 h-4')} CSV</button>
        <button class="btn btn-primary" onclick="onboardSchoolModal()">${icon('plus','w-4 h-4')} Onboard School</button>
      `
    })}
    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${statusF==='all'?'active':''}" onclick="APP.go('sa_schools', { schoolStatus: 'all' })">All ${schools.length}</button>
      <button class="chip ${statusF==='active'?'active':''}" onclick="APP.go('sa_schools', { schoolStatus: 'active' })">Active ${schools.filter(s=>s.status==='active').length}</button>
      <button class="chip ${statusF==='trial'?'active':''}" onclick="APP.go('sa_schools', { schoolStatus: 'trial' })">Trial ${schools.filter(s=>s.status==='trial').length}</button>
      <button class="chip ${statusF==='suspended'?'active':''}" onclick="APP.go('sa_schools', { schoolStatus: 'suspended' })">Suspended ${schools.filter(s=>s.status==='suspended').length}</button>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${filtered.map(s => {
        const days = s.nextRenewal ? Math.ceil((new Date(s.nextRenewal) - new Date()) / 86400000) : null;
        const renewClass = days === null ? 'text-slate-500' : (days <= 0 ? 'text-rose-700 font-bold' : days <= 7 ? 'text-amber-700 font-semibold' : 'text-slate-500');
        return `<div class="card p-5">
        <div class="flex items-start justify-between mb-3">
          ${avatar(s.name, 'lg')}
          ${statusBadge(s.status)}
        </div>
        <h3 class="font-bold text-slate-900">${s.name}</h3>
        <p class="text-sm text-slate-500">${s.proprietor}</p>
        ${s.kyc ? `<div class="mt-2 flex items-center gap-1.5 flex-wrap">
          <span class="badge badge-neutral">CAC: ${s.kyc.regNumber}</span>
          ${s.kyc.cacUploaded ? `<span class="badge badge-success">${icon('check','w-3 h-3')} KYC Verified</span>` : `<span class="badge badge-warn">KYC Pending</span>`}
        </div>` : ''}
        <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div><div class="text-xs text-slate-500">Students</div><div class="font-bold">${s.students}</div></div>
          <div><div class="text-xs text-slate-500">Plan</div><div class="font-bold">${s.subscriptionPlan}</div></div>
          <div><div class="text-xs text-slate-500">MRR</div><div class="font-bold font-mono">${money(s.monthlyFee)}</div></div>
          <div><div class="text-xs text-slate-500">Renewal</div><div class="${renewClass} text-sm">${days === null ? '—' : (days <= 0 ? `Overdue ${Math.abs(days)}d` : `In ${days}d`)}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 mt-3">
          <button class="btn btn-secondary !py-1.5 text-xs" onclick="viewSchoolDetail('${s.id}')">View</button>
          ${s.status === 'suspended' ?
            `<button class="btn btn-primary !py-1.5 text-xs" onclick="toggleSchoolStatus('${s.id}', 'active')">Reactivate</button>` :
            `<button class="btn btn-danger !py-1.5 text-xs" onclick="toggleSchoolStatus('${s.id}', 'suspended')">Suspend</button>`}
        </div>
      </div>`;
      }).join('')}
    </div>
  `;
}

function viewSchoolDetail(schoolId) {
  const s = DB.find('schools', schoolId);
  if (!s) return;
  const tab = APP.params.schoolTab || 'profile';
  const days = s.nextRenewal ? Math.ceil((new Date(s.nextRenewal) - new Date()) / 86400000) : null;
  const features = s.features || {};
  const schoolInvs = DB.query('schoolInvoices', i => i.schoolId === schoolId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const profileTab = `
    <div class="grid sm:grid-cols-2 gap-3 text-sm">
      <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Email</div><div>${s.email}</div></div>
      <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Phone</div><div>${s.phone}</div></div>
      <div class="sm:col-span-2"><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Address</div><div>${s.address}</div></div>
      <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Joined</div><div>${fdate(s.joinedAt, { long: true })}</div></div>
      <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Students / Teachers</div><div>${s.students} / ${s.teachers || 0}</div></div>
    </div>
    ${s.kyc ? `<div class="mt-4 pt-4 border-t border-slate-100">
      <h3 class="text-xs uppercase text-slate-500 font-semibold mb-2">KYC Documents</h3>
      <div class="grid sm:grid-cols-2 gap-3 text-sm">
        <div><div class="text-xs text-slate-500">CAC Registration No.</div><code class="text-sm">${s.kyc.regNumber}</code></div>
        <div><div class="text-xs text-slate-500">Owner NIN</div><code class="text-sm">${s.kyc.ownerNIN || '—'}</code></div>
        <div><div class="text-xs text-slate-500">CAC Document</div><div>${s.kyc.cacUploaded ? '<span class="badge badge-success">Uploaded</span>' : '<span class="badge badge-warn">Pending</span>'}</div></div>
        <div><div class="text-xs text-slate-500">Accreditation</div><div>${s.kyc.accreditation || '—'}</div></div>
      </div>
    </div>` : ''}
    ${s.verification ? `<div class="mt-4 pt-4 border-t border-slate-100">
      <h3 class="text-xs uppercase text-slate-500 font-semibold mb-2">Verification</h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="badge ${s.verification.status === 'verified' ? 'badge-success' : s.verification.status === 'pending' ? 'badge-info' : s.verification.status === 'rejected' ? 'badge-danger' : 'badge-warn'}">${s.verification.status}</span>
        ${s.signupSource === 'self' ? '<span class="badge badge-neutral">Self-signup</span>' : ''}
        ${s.bank ? `<span class="text-xs text-slate-500">${s.bank.name} · ${s.bank.account}</span>` : ''}
      </div>
      ${s.verification.reason ? `<div class="text-xs text-slate-500 mt-1">Reason: ${s.verification.reason}</div>` : ''}
    </div>` : ''}
  `;

  const subscriptionTab = `
    <div class="space-y-4">
      <div class="bg-navy-800 text-white rounded-2xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-brand-200 uppercase font-semibold">Current Plan</div>
            <div class="text-2xl font-extrabold">${s.subscriptionPlan}</div>
            <div class="text-sm text-brand-100 mt-1">${money(s.monthlyFee)} per month</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-brand-200">Next renewal</div>
            <div class="text-lg font-bold">${s.nextRenewal ? fdate(s.nextRenewal, { long: true }) : '—'}</div>
            <div class="text-xs ${days === null ? 'text-brand-200' : (days <= 0 ? 'text-rose-200 font-bold' : days <= 7 ? 'text-amber-200 font-bold' : 'text-brand-200')}">
              ${days === null ? '' : days <= 0 ? `Overdue by ${Math.abs(days)} days` : `In ${days} days`}
            </div>
          </div>
        </div>
      </div>
      <div>
        <label class="input-label">Change Plan</label>
        <div class="grid grid-cols-3 gap-2">
          ${['Essential','Professional','Enterprise'].map(p => {
            const fees = { Essential: 45000, Professional: 95000, Enterprise: 250000 };
            const isCurrent = s.subscriptionPlan === p;
            return `<button class="p-3 rounded-xl border-2 ${isCurrent ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-500'} text-left text-sm" ${isCurrent ? '' : `onclick="changeSchoolPlan('${s.id}', '${p}')"`}>
              <div class="font-bold text-slate-900">${p}</div>
              <div class="font-mono text-xs">${money(fees[p])}/mo</div>
              ${isCurrent ? '<span class="badge badge-success mt-1">Current</span>' : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
      <label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
        <div>
          <div class="font-semibold text-sm">Auto-renew at month-end</div>
          <div class="text-xs text-slate-500">Charge automatically when subscription expires</div>
        </div>
        <input type="checkbox" class="w-5 h-5 accent-brand-600" ${s.autoRenew ? 'checked' : ''} onchange="toggleAutoRenew('${s.id}', this.checked)" />
      </label>
      <div class="flex gap-2">
        <button class="btn btn-primary flex-1" onclick="renewSchoolSubscription('${s.id}')">${icon('check','w-4 h-4')} Renew now (30 days)</button>
      </div>
      ${days !== null && days <= 7 ? `<div class="bg-${days <= 0 ? 'rose' : 'amber'}-50 border border-${days <= 0 ? 'rose' : 'amber'}-200 rounded-xl p-3 text-sm">
        <strong>${days <= 0 ? 'EXPIRED' : 'EXPIRY WARNING'}:</strong> ${days <= 0 ? `Subscription expired ${Math.abs(days)} day${Math.abs(days)!==1?'s':''} ago.` : `Renews in ${days} day${days!==1?'s':''}.`} ${s.autoRenew ? 'Auto-renewal will fire automatically.' : 'Auto-renewal is off — schedule a manual renewal.'}
      </div>` : ''}

      <div class="pt-3 border-t border-slate-100">
        <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Recent Invoices</h4>
        <table class="tbl">
          <thead><tr><th>Period</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            ${schoolInvs.slice(0, 6).map(i => `<tr>
              <td>${i.period}</td>
              <td class="font-mono">${money(i.amount)}</td>
              <td class="text-sm text-slate-500">${fdate(i.dueDate, { short: true })}</td>
              <td>${statusBadge(i.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const featuresTab = `
    <p class="text-sm text-slate-500 mb-3">Enable or disable specific platform capabilities for this school.</p>
    <div class="space-y-2">
      ${[
        { key: 'whatsapp', label: 'WhatsApp Integration', desc: 'Send absence and announcement alerts via WhatsApp' },
        { key: 'lending',  label: 'Lending Engine',       desc: 'Parents in this school can apply for fee loans' },
        { key: 'ai',       label: 'AI Assistant',         desc: 'AI-generated report comments and recommendations' },
        { key: 'offline',  label: 'Offline Mode',         desc: 'Teachers can mark attendance without internet' },
        { key: 'transport',label: 'Transport Module',     desc: 'Pickup / drop tracking (Beta)' },
        { key: 'payroll',  label: 'Payroll',              desc: 'Staff salary management and payslips' }
      ].map(f => `<label class="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
        <div>
          <div class="font-semibold text-sm">${f.label}</div>
          <div class="text-xs text-slate-500">${f.desc}</div>
        </div>
        <input type="checkbox" class="w-5 h-5 accent-brand-600" ${features[f.key] ? 'checked' : ''} onchange="toggleSchoolFeature('${s.id}', '${f.key}', this.checked)" />
      </label>`).join('')}
    </div>
  `;

  modal({
    title: s.name,
    size: 'lg',
    body: `
      <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        ${avatar(s.name, 'xl')}
        <div class="flex-1">
          <h2 class="text-lg font-bold text-slate-900">${s.name}</h2>
          <p class="text-sm text-slate-500">${s.proprietor}</p>
          <div class="flex gap-1.5 mt-1">${statusBadge(s.status)}<span class="badge badge-info">${s.subscriptionPlan}</span></div>
        </div>
      </div>

      ${tabs([
        { key: 'profile', label: 'Profile' },
        { key: 'subscription', label: 'Subscription' },
        { key: 'features', label: 'Features' }
      ], tab, (k) => { APP.params.schoolTab = k; viewSchoolDetail(schoolId); })}

      <div class="pt-4">
        ${tab === 'subscription' ? subscriptionTab : tab === 'features' ? featuresTab : profileTab}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click(); APP.params.schoolTab=null">Close</button>
             ${s.verification && s.verification.status === 'pending'
               ? `<button class="btn btn-danger" onclick="rejectSchoolVerification('${s.id}')">Reject</button>
                  <button class="btn btn-primary" onclick="approveSchoolVerification('${s.id}')">${icon('check','w-4 h-4')} Approve &amp; Verify</button>`
               : ''}
             ${s.status === 'suspended'
               ? `<button class="btn btn-primary" onclick="toggleSchoolStatus('${s.id}', 'active'); document.getElementById('modalBackdrop').click(); APP.params.schoolTab=null">Reactivate</button>`
               : `<button class="btn btn-danger" onclick="toggleSchoolStatus('${s.id}', 'suspended'); document.getElementById('modalBackdrop').click(); APP.params.schoolTab=null">Suspend</button>`}`
  });
}

function changeSchoolPlan(schoolId, newPlan) {
  const fees = { Essential: 45000, Professional: 95000, Enterprise: 250000 };
  const s = DB.find('schools', schoolId);
  const oldPlan = s.subscriptionPlan;
  DB.update('schools', schoolId, { subscriptionPlan: newPlan, monthlyFee: fees[newPlan] });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'changed_plan', target: `${s.name}: ${oldPlan} → ${newPlan}`, timestamp: now() });
  toast(`${s.name} moved from ${oldPlan} to ${newPlan}`, 'success');
  viewSchoolDetail(schoolId);
}

function toggleAutoRenew(schoolId, on) {
  DB.update('schools', schoolId, { autoRenew: on });
  toast(`Auto-renewal ${on ? 'enabled' : 'disabled'}`);
}

function renewSchoolSubscription(schoolId) {
  const s = DB.find('schools', schoolId);
  const newRenewal = daysAhead(30);
  // Create a paid invoice for this renewal period
  const period = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  DB.insert('schoolInvoices', {
    id: uid('sinv'), schoolId, period, plan: s.subscriptionPlan,
    amount: s.monthlyFee, status: 'paid',
    dueDate: today(), paidAt: now(),
    remindersSent: 0
  });
  DB.update('schools', schoolId, { nextRenewal: newRenewal, status: s.status === 'trial' ? 'active' : s.status });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'renewed_subscription', target: `${s.name} (${money(s.monthlyFee)})`, timestamp: now() });
  toast(`${s.name} renewed — next billing ${fdate(newRenewal, { long: true })}`, 'success');
  viewSchoolDetail(schoolId);
}

function toggleSchoolFeature(schoolId, featureKey, on) {
  const s = DB.find('schools', schoolId);
  const features = Object.assign({}, s.features || {}, { [featureKey]: on });
  DB.update('schools', schoolId, { features });
  toast(`${featureKey} ${on ? 'enabled' : 'disabled'} for ${s.name.split(' ').slice(-1)}`);
}

function exportSchoolsCSV() {
  const schools = DB.get('schools');
  const headers = ['Name', 'Proprietor', 'Email', 'Phone', 'Address', 'Plan', 'MRR', 'ARR', 'Students', 'Teachers', 'Status', 'Joined', 'Next Renewal', 'Auto Renew', 'CAC Reg', 'KYC'];
  const rows = schools.map(s => [
    s.name, s.proprietor, s.email, s.phone, s.address,
    s.subscriptionPlan, s.monthlyFee, s.monthlyFee * 12,
    s.students, s.teachers, s.status,
    s.joinedAt, s.nextRenewal || '', s.autoRenew ? 'Yes' : 'No',
    s.kyc ? s.kyc.regNumber : '', s.kyc && s.kyc.cacUploaded ? 'Verified' : 'Pending'
  ]);
  downloadCSV(headers, rows, 'caspaa_schools');
}

function toggleSchoolStatus(schoolId, status) {
  DB.update('schools', schoolId, { status });
  toast(`School ${status === 'active' ? 'reactivated' : 'suspended'}`);
  APP.render();
}

/* ---------- School verification review (approve / reject KYC) ---------- */
function approveSchoolVerification(schoolId) {
  const s = DB.find('schools', schoolId);
  if (!s) return;
  DB.update('schools', schoolId, {
    verification: { ...(s.verification || {}), status: 'verified', verifiedAt: now(), verifiedBy: AUTH.current.id, reason: null }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'verified_school', target: s.name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.params.schoolTab = null;
  APP.render();
  toast(`${s.name} verified — payments & financing unlocked`, 'success');
}

function rejectSchoolVerification(schoolId) {
  const s = DB.find('schools', schoolId);
  if (!s) return;
  modal({
    title: 'Reject verification',
    body: `<div class="space-y-2">
      <p class="text-sm text-slate-600">Tell ${s.name} what needs fixing. They can resubmit.</p>
      <textarea id="vrej_reason" rows="3" class="input" placeholder="e.g. CAC number does not match the uploaded certificate."></textarea>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
             <button class="btn btn-danger" onclick="confirmRejectVerification('${schoolId}')">Reject</button>`
  });
}

function confirmRejectVerification(schoolId) {
  const s = DB.find('schools', schoolId);
  if (!s) return;
  const reason = document.getElementById('vrej_reason').value.trim();
  DB.update('schools', schoolId, {
    verification: { ...(s.verification || {}), status: 'rejected', reason: reason || 'Details could not be verified.', reviewedAt: now() }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'rejected_verification', target: s.name, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  APP.params.schoolTab = null;
  APP.render();
  toast(`${s.name} verification rejected`, 'warn');
}

function onboardSchoolModal() {
  modal({
    title: 'Onboard New School',
    size: 'lg',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Required: school name, proprietor details, CAC registration, accreditation. School starts on a 14-day free trial.
        </div>

        <h4 class="text-xs uppercase font-semibold text-slate-500 mt-2">School Profile</h4>
        <div><label class="input-label">School Name *</label><input id="ns_name" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Proprietor *</label><input id="ns_prop" class="input" /></div>
          <div><label class="input-label">Phone *</label><input id="ns_phone" class="input" placeholder="+234…" /></div>
        </div>
        <div><label class="input-label">Email *</label><input id="ns_email" type="email" class="input" /></div>
        <div><label class="input-label">Address *</label><input id="ns_addr" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Expected Students</label><input id="ns_stu" type="number" class="input" placeholder="100" /></div>
          <div><label class="input-label">Subscription Plan *</label>
            <select id="ns_plan" class="input">
              <option value="Essential">Essential — ₦45,000/mo (up to 100 students)</option>
              <option value="Professional" selected>Professional — ₦95,000/mo (up to 300 students)</option>
              <option value="Enterprise">Enterprise — from ₦250,000/mo (unlimited)</option>
            </select>
          </div>
        </div>

        <h4 class="text-xs uppercase font-semibold text-slate-500 mt-3">KYC (Know Your Customer)</h4>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">CAC Registration No.</label><input id="ns_reg" class="input" placeholder="e.g. RC-228491" /></div>
          <div><label class="input-label">Owner NIN</label><input id="ns_nin" class="input" placeholder="11-digit NIN" /></div>
        </div>
        <div><label class="input-label">Accreditation Body</label><input id="ns_accred" class="input" placeholder="e.g. Lagos State Ministry of Education" /></div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="ns_cac" checked />
          <span>CAC document uploaded (simulated)</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="ns_autorenew" checked />
          <span>Enable auto-renewal at month-end</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveNewSchool()">${icon('check','w-4 h-4')} Onboard School</button>`
  });
}

function saveNewSchool() {
  const plan = document.getElementById('ns_plan').value;
  const planFees = { 'Essential': 45000, 'Professional': 95000, 'Enterprise': 250000 };
  const name = document.getElementById('ns_name').value.trim();
  const proprietor = document.getElementById('ns_prop').value.trim();
  const email = document.getElementById('ns_email').value.trim();
  const phone = document.getElementById('ns_phone').value.trim();
  if (!name || !proprietor || !email || !phone) { toast('Name, proprietor, email and phone are required', 'danger'); return; }
  DB.insert('schools', {
    id: uid('sch'),
    name, proprietor, email, phone,
    address: document.getElementById('ns_addr').value.trim(),
    students: parseInt(document.getElementById('ns_stu').value) || 0,
    teachers: 0,
    subscriptionPlan: plan, monthlyFee: planFees[plan],
    status: 'trial', joinedAt: today(),
    nextRenewal: daysAhead(14),
    autoRenew: document.getElementById('ns_autorenew').checked,
    kyc: {
      regNumber: document.getElementById('ns_reg').value.trim() || 'Pending',
      ownerNIN: document.getElementById('ns_nin').value.trim() || '',
      cacUploaded: document.getElementById('ns_cac').checked,
      accreditation: document.getElementById('ns_accred').value.trim() || 'Pending'
    }
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'onboarded_school', target: name, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} onboarded on ${plan} — 14-day free trial started`);
}

/* ---------- Revenue (tabbed) ---------- */
function view_sa_revenue() {
  const tab = APP.params.revTab || 'subscriptions';
  const schools = DB.get('schools');
  const activeSchools = schools.filter(s => s.status === 'active');
  const mrr = activeSchools.reduce((s, x) => s + x.monthlyFee, 0);
  const commissions = DB.get('commissions');
  const paymentComm = commissions.filter(c => c.type === 'payment').reduce((s, c) => s + c.amount, 0);
  const lendingComm = commissions.filter(c => c.type === 'lending').reduce((s, c) => s + c.amount, 0);
  const referralComm = commissions.filter(c => c.type === 'referral').reduce((s, c) => s + c.amount, 0);
  const schoolInvs = DB.get('schoolInvoices');

  return `
    ${pageHeader({ title: 'Revenue', subtitle: 'Subscription / Payment / Lending / Referral streams' })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'SaaS MRR', value: money(mrr), icon: 'fees', color: 'brand' })}
      ${statCard({ label: 'Payment Fees', value: money(paymentComm), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Lending Interest', value: money(lendingComm), icon: 'loan', color: 'brand' })}
      ${statCard({ label: 'Referral Fees', value: money(referralComm), icon: 'trending_up', color: 'brand' })}
    </div>

    ${tabs([
      { key: 'subscriptions', label: 'Subscription Revenue' },
      { key: 'invoices', label: 'School Invoices', badge: schoolInvs.filter(i => i.status === 'pending').length || null },
      { key: 'commissions', label: 'Commissions' }
    ], tab, k => { APP.params.revTab = k; APP.render(); })}

    <div class="pt-4">
      ${tab === 'invoices' ? view_sa_revenue_invoices() :
        tab === 'commissions' ? view_sa_revenue_commissions() :
        view_sa_revenue_subscriptions()}
    </div>
  `;
}

function view_sa_revenue_subscriptions() {
  const schools = DB.get('schools');
  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>School</th><th>Plan</th><th>Students</th><th>Monthly Fee</th><th>ARR</th><th>Next Renewal</th><th>Status</th></tr></thead>
        <tbody>
          ${schools.map(s => {
            const days = s.nextRenewal ? Math.ceil((new Date(s.nextRenewal) - new Date()) / 86400000) : null;
            return `<tr class="cursor-pointer" onclick="APP.params.schoolTab='subscription'; viewSchoolDetail('${s.id}')">
              <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span class="font-medium">${s.name}</span></div></td>
              <td><span class="badge ${s.subscriptionPlan==='Enterprise'?'badge-success':s.subscriptionPlan==='Professional'?'badge-info':'badge-neutral'}">${s.subscriptionPlan}</span></td>
              <td>${s.students}</td>
              <td class="font-mono">${money(s.monthlyFee)}</td>
              <td class="font-mono font-bold">${money(s.monthlyFee * 12)}</td>
              <td class="text-sm ${days === null ? 'text-slate-500' : days <= 0 ? 'text-rose-700 font-bold' : days <= 7 ? 'text-amber-700 font-semibold' : 'text-slate-500'}">${days === null ? '—' : days <= 0 ? `Overdue ${Math.abs(days)}d` : `${days}d`}</td>
              <td>${statusBadge(s.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function view_sa_revenue_invoices() {
  const filter = APP.params.invFilter || 'all';
  const invs = DB.get('schoolInvoices').sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const filtered = filter === 'all' ? invs : invs.filter(i => i.status === filter);
  const pending = invs.filter(i => i.status === 'pending');
  return `
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div class="flex gap-2">
        <button class="chip ${filter==='all'?'active':''}" onclick="APP.params.invFilter='all'; APP.render()">All ${invs.length}</button>
        <button class="chip ${filter==='paid'?'active':''}" onclick="APP.params.invFilter='paid'; APP.render()">Paid ${invs.filter(i=>i.status==='paid').length}</button>
        <button class="chip ${filter==='pending'?'active':''}" onclick="APP.params.invFilter='pending'; APP.render()">Pending ${pending.length}</button>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary text-sm" onclick="generateSubscriptionInvoices()">${icon('plus','w-3.5 h-3.5')} Generate this month</button>
        <button class="btn btn-secondary text-sm" onclick="sendAllReminders()">${icon('bell','w-3.5 h-3.5')} Send ${pending.length} reminders</button>
        <button class="btn btn-secondary text-sm" onclick="exportSchoolInvoicesCSV()">${icon('download','w-3.5 h-3.5')} CSV</button>
      </div>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Invoice</th><th>School</th><th>Period</th><th>Plan</th><th>Amount</th><th>Due</th><th>Status</th><th>Reminders</th><th></th></tr></thead>
        <tbody>
          ${filtered.map(inv => {
            const s = DB.find('schools', inv.schoolId);
            const overdue = inv.status === 'pending' && new Date(inv.dueDate) < new Date();
            return `<tr>
              <td><code class="text-xs">${inv.id.slice(-8).toUpperCase()}</code></td>
              <td>${s ? s.name : '—'}</td>
              <td class="text-sm">${inv.period}</td>
              <td><span class="badge badge-neutral">${inv.plan}</span></td>
              <td class="font-mono font-semibold">${money(inv.amount)}</td>
              <td class="text-sm ${overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}">${fdate(inv.dueDate, { short: true })}</td>
              <td>${overdue ? '<span class="badge badge-danger">Overdue</span>' : statusBadge(inv.status)}</td>
              <td class="text-sm">${inv.remindersSent || 0}</td>
              <td class="text-right whitespace-nowrap">
                <button class="btn btn-ghost !p-1.5" title="Download" onclick="downloadSchoolInvoice('${inv.id}')">${icon('download','w-3.5 h-3.5')}</button>
                ${inv.status === 'pending' ? `<button class="btn btn-ghost !p-1.5" title="Send reminder" onclick="sendInvoiceReminder('${inv.id}')">${icon('bell','w-3.5 h-3.5')}</button>
                <button class="btn btn-ghost !p-1.5 text-emerald-700" title="Mark paid" onclick="markSchoolInvoicePaid('${inv.id}')">${icon('check','w-3.5 h-3.5')}</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function view_sa_revenue_commissions() {
  const commissions = DB.get('commissions');
  const subFilter = APP.params.cmFilter || 'all';
  const filtered = subFilter === 'all' ? commissions : commissions.filter(c => c.type === subFilter);
  const total = filtered.reduce((s, c) => s + c.amount, 0);
  return `
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div class="flex gap-2">
        <button class="chip ${subFilter==='all'?'active':''}" onclick="APP.params.cmFilter='all'; APP.render()">All</button>
        <button class="chip ${subFilter==='payment'?'active':''}" onclick="APP.params.cmFilter='payment'; APP.render()">Payment fees</button>
        <button class="chip ${subFilter==='lending'?'active':''}" onclick="APP.params.cmFilter='lending'; APP.render()">Lending interest</button>
        <button class="chip ${subFilter==='referral'?'active':''}" onclick="APP.params.cmFilter='referral'; APP.render()">Referrals</button>
      </div>
      <div class="text-sm font-semibold text-slate-700">Total: <span class="font-mono text-brand-700">${money(total)}</span></div>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Date</th><th>Type</th><th>School</th><th>Source</th><th>Amount</th></tr></thead>
        <tbody>
          ${filtered.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50).map(c => {
            const s = DB.find('schools', c.schoolId);
            return `<tr>
              <td class="text-sm text-slate-500">${fdate(c.timestamp, { short: true })}</td>
              <td><span class="badge ${c.type==='payment'?'badge-info':c.type==='lending'?'badge-success':'badge-warn'}">${c.type}</span></td>
              <td class="text-sm">${s ? s.name : '—'}</td>
              <td class="text-sm">${c.source}</td>
              <td class="font-mono font-semibold text-emerald-700">${money(c.amount)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateSubscriptionInvoices() {
  const schools = DB.get('schools').filter(s => s.status !== 'suspended');
  const period = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  let count = 0;
  schools.forEach(s => {
    const exists = DB.query('schoolInvoices', i => i.schoolId === s.id && i.period === period)[0];
    if (exists) return;
    DB.insert('schoolInvoices', {
      id: uid('sinv'), schoolId: s.id, period, plan: s.subscriptionPlan,
      amount: s.monthlyFee, status: 'pending',
      dueDate: daysAhead(7), paidAt: null, remindersSent: 0
    });
    count++;
  });
  if (count === 0) toast('All schools already invoiced for this period', 'info');
  else { APP.render(); toast(`Generated ${count} invoices for ${period}`, 'success'); }
}

function sendInvoiceReminder(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  DB.update('schoolInvoices', invoiceId, { remindersSent: (inv.remindersSent || 0) + 1 });
  const s = DB.find('schools', inv.schoolId);
  toast(`Reminder sent to ${s ? s.proprietor : 'school'} via WhatsApp + Email`);
  APP.render();
}

function sendAllReminders() {
  const pending = DB.query('schoolInvoices', i => i.status === 'pending');
  pending.forEach(i => DB.update('schoolInvoices', i.id, { remindersSent: (i.remindersSent || 0) + 1 }));
  toast(`Reminders sent for ${pending.length} pending invoices`, 'success');
  APP.render();
}

function markSchoolInvoicePaid(invoiceId) {
  DB.update('schoolInvoices', invoiceId, { status: 'paid', paidAt: now() });
  toast('Invoice marked paid');
  APP.render();
}

function downloadSchoolInvoice(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  const s = DB.find('schools', inv.schoolId);
  const html = `
    <div style="max-width:680px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #00b386;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#00b386">CASPAA</h1>
        <p style="margin:4px 0;color:#666;font-size:13px">School Operating System · Lagos, Nigeria</p>
        <h2 style="margin:14px 0 4px;font-size:18px">SUBSCRIPTION INVOICE</h2>
      </div>
      <table style="width:100%;font-size:14px;margin-bottom:20px">
        <tr><td><strong>Billed To:</strong></td><td align="right">${s.name}</td></tr>
        <tr><td></td><td align="right">${s.proprietor}</td></tr>
        <tr><td></td><td align="right">${s.email}</td></tr>
        <tr><td><strong>Invoice No:</strong></td><td align="right"><code>${inv.id.toUpperCase().slice(-10)}</code></td></tr>
        <tr><td><strong>Period:</strong></td><td align="right">${inv.period}</td></tr>
        <tr><td><strong>Due Date:</strong></td><td align="right">${fdate(inv.dueDate, { long: true })}</td></tr>
      </table>
      <table border="1" cellpadding="10" style="border-collapse:collapse;width:100%;font-size:14px">
        <thead style="background:#f3f4f6"><tr><th align="left">Description</th><th align="right">Amount</th></tr></thead>
        <tbody>
          <tr><td>${inv.plan} Subscription — ${inv.period}</td><td align="right">${money(inv.amount)}</td></tr>
        </tbody>
        <tfoot style="background:${inv.status === 'paid' ? '#d1fae5' : '#fee2e2'};font-weight:bold">
          <tr><td>${inv.status === 'paid' ? 'PAID' : 'TOTAL DUE'}</td><td align="right">${money(inv.amount)}</td></tr>
        </tfoot>
      </table>
      ${inv.status === 'paid' ? `<p style="margin-top:20px;color:#065f46">Paid on ${fdate(inv.paidAt, { long: true })}. Thank you.</p>` : `<p style="margin-top:20px;color:#991b1b">Please remit payment by ${fdate(inv.dueDate, { long: true })} to avoid service interruption.</p>`}
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Computer-generated invoice — no signature required.</p>
    </div>
  `;
  printElement(html);
}

function exportSchoolInvoicesCSV() {
  const invs = DB.get('schoolInvoices');
  const headers = ['Invoice ID', 'School', 'Period', 'Plan', 'Amount', 'Status', 'Due Date', 'Paid At', 'Reminders Sent'];
  const rows = invs.map(i => {
    const s = DB.find('schools', i.schoolId);
    return [i.id, s ? s.name : '', i.period, i.plan, i.amount, i.status, i.dueDate, i.paidAt || '', i.remindersSent || 0];
  });
  downloadCSV(headers, rows, 'caspaa_school_invoices');
}

/* ---------- Lending Book (tabbed) ---------- */
function view_sa_lending() {
  const tab = APP.params.lendTab || 'book';
  const loans = DB.get('loans');
  const active = loans.filter(l => l.status === 'active');
  const book = active.reduce((s, l) => s + l.amount, 0);
  const interest = active.reduce((s, l) => s + (l.totalRepayment - l.amount), 0);
  const repaid = active.reduce((s, l) => s + l.repayments.filter(r => r.paid).reduce((x, r) => x + r.amount, 0), 0);
  const pendingDisbursements = active.filter(l => !DB.query('disbursements', d => d.loanId === l.id)[0]);

  return `
    ${pageHeader({ title: 'Lending', subtitle: 'Loan book and disbursement console' })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Loans', value: active.length, icon: 'loan', color: 'brand' })}
      ${statCard({ label: 'Total Disbursed', value: money(book), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Interest Income', value: money(interest), icon: 'trending_up', color: 'brand' })}
      ${statCard({ label: 'Repaid So Far', value: money(repaid), icon: 'check', color: 'brand' })}
    </div>

    ${tabs([
      { key: 'book', label: 'Loan Book' },
      { key: 'disburse', label: 'Disbursement Console', badge: pendingDisbursements.length || null },
      { key: 'analytics', label: 'Loan Analytics' }
    ], tab, k => { APP.params.lendTab = k; APP.render(); })}

    <div class="pt-4">
      ${tab === 'disburse' ? renderDisbursementTab() :
        tab === 'analytics' ? renderLoanAnalyticsTab() :
        renderLoanBookTab()}
    </div>
  `;
}

function renderLoanBookTab() {
  const loans = DB.get('loans');
  return `
    <div class="flex items-center justify-end mb-3">
      <button class="btn btn-secondary text-sm" onclick="exportLoanBookCSV()">${icon('download','w-3.5 h-3.5')} CSV</button>
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

function renderDisbursementTab() {
  const loans = DB.get('loans').filter(l => l.status === 'active');
  const disbursements = DB.get('disbursements').sort((a, b) => (b.completedAt || b.initiatedAt).localeCompare(a.completedAt || a.initiatedAt));
  const pending = loans.filter(l => !DB.query('disbursements', d => d.loanId === l.id)[0]);
  const completed = disbursements.filter(d => d.status === 'completed');
  const totalDisbursedAmount = completed.reduce((s, d) => s + d.amount, 0);

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Pending Disbursement', value: pending.length, icon: 'bell', color: pending.length ? 'rose' : 'brand' })}
      ${statCard({ label: 'Completed', value: completed.length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Total Disbursed', value: money(totalDisbursedAmount), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Failed', value: disbursements.filter(d => d.status === 'failed').length, icon: 'trending_down', color: 'rose' })}
    </div>

    ${pending.length ? `<div class="card p-4 mb-4 bg-amber-50">
      <h4 class="font-bold text-amber-900 mb-2">${pending.length} approved loan${pending.length>1?'s':''} awaiting disbursement</h4>
      <div class="space-y-2">
        ${pending.map(l => {
          const p = DB.find('parents', l.parentId);
          const sch = DB.find('schools', l.schoolId);
          return `<div class="bg-white rounded-xl p-3 flex items-center gap-3 flex-wrap">
            ${avatar(p ? p.name : '?', 'sm')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${p ? p.name : '—'} <span class="text-slate-500 font-normal">→ ${sch ? sch.name : '—'}</span></div>
              <div class="text-xs text-slate-500">${money(l.amount)} approved ${fdate(l.approvedAt, { relative: true })}</div>
            </div>
            <button class="btn btn-primary !py-1.5" onclick="initiateDisbursement('${l.id}')">${icon('check','w-3.5 h-3.5')} Disburse ${money(l.amount)}</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : `<div class="card p-4 mb-4 bg-emerald-50 text-sm text-emerald-900 flex items-center gap-2">
      ${icon('check','w-5 h-5')} <span>All approved loans have been disbursed.</span>
    </div>`}

    <div class="flex items-center justify-between mb-3">
      <h4 class="font-bold text-slate-900">Disbursement Ledger</h4>
      <button class="btn btn-secondary text-sm" onclick="exportDisbursementsCSV()">${icon('download','w-3.5 h-3.5')} CSV</button>
    </div>
    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Reference</th><th>Recipient (School)</th><th>Account</th><th>Amount</th><th>Method</th><th>Status</th><th>Completed</th></tr></thead>
        <tbody>
          ${disbursements.map(d => `<tr>
            <td><code class="text-xs">${d.reference}</code></td>
            <td>${d.recipientName}</td>
            <td><code class="text-xs">${d.recipientAccount}</code></td>
            <td class="font-mono font-semibold">${money(d.amount)}</td>
            <td>${d.method}</td>
            <td>${statusBadge(d.status === 'completed' ? 'successful' : d.status === 'failed' ? 'failed' : 'pending')}</td>
            <td class="text-sm text-slate-500">${d.completedAt ? fdate(d.completedAt, { short: true }) : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function initiateDisbursement(loanId) {
  const l = DB.find('loans', loanId);
  const sch = DB.find('schools', l.schoolId);
  modal({
    title: 'Verify & Disburse',
    body: `
      <div class="space-y-3">
        <div class="bg-brand-50 rounded-xl p-3 text-sm text-brand-900">
          Confirm the recipient and amount. Funds move via NIBSS transfer to the school's verified account. This action is logged in the audit trail.
        </div>
        <div class="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Recipient (School)</span><strong>${sch ? sch.name : '—'}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Account Name</span><strong>${sch ? sch.name : '—'}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Account Number</span><code>01${Math.random().toString().slice(2, 10)}</code></div>
          <div class="flex justify-between"><span class="text-slate-500">Bank</span><strong>GTBank</strong></div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t border-slate-200"><span>Amount to disburse</span><span class="text-brand-700">${money(l.amount)}</span></div>
        </div>
        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" id="disb_confirm" />
          <span>I have verified the recipient details and confirm this disbursement.</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="executeDisbursement('${loanId}')">${icon('check','w-4 h-4')} Disburse ${money(l.amount)}</button>`
  });
}

function executeDisbursement(loanId) {
  if (!document.getElementById('disb_confirm').checked) { toast('Please confirm verification first', 'danger'); return; }
  const l = DB.find('loans', loanId);
  const sch = DB.find('schools', l.schoolId);
  const dsb = {
    id: uid('dsb'),
    loanId, schoolId: l.schoolId,
    recipientName: sch ? sch.name : '—',
    recipientAccount: '01' + Math.random().toString().slice(2, 10),
    amount: l.amount,
    status: 'pending',
    method: 'NIBSS transfer',
    reference: 'DSB-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    initiatedAt: now(),
    verifiedBy: AUTH.current.id
  };
  DB.insert('disbursements', dsb);
  document.getElementById('modalBackdrop').click();
  toast(`Disbursement of ${money(l.amount)} initiated`, 'info');
  // Simulate NIBSS confirmation after 2 seconds
  setTimeout(() => {
    DB.update('disbursements', dsb.id, { status: 'completed', completedAt: now() });
    DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current.id, action: 'disbursed_loan', target: `${money(l.amount)} → ${sch ? sch.name : '—'}`, timestamp: now() });
    toast(`Funds confirmed received by ${sch ? sch.name : 'school'}`, 'success');
    if (APP.view === 'sa_lending' && APP.params.lendTab === 'disburse') APP.render();
  }, 2000);
}

function renderLoanAnalyticsTab() {
  const loans = DB.get('loans');
  const active = loans.filter(l => l.status === 'active');
  const totalRequested = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalApproved = active.reduce((s, l) => s + l.amount, 0);
  const totalRepaid = active.reduce((s, l) => s + l.repayments.filter(r => r.paid).reduce((x, r) => x + r.amount, 0), 0);
  const totalDue = active.reduce((s, l) => s + l.totalRepayment, 0);
  const overdueRepayments = [];
  active.forEach(l => {
    l.repayments.filter(r => !r.paid && new Date(r.dueDate) < new Date()).forEach(r => overdueRepayments.push({ loan: l, repayment: r }));
  });
  const par = totalApproved ? Math.round((overdueRepayments.reduce((s, x) => s + x.repayment.amount, 0) / totalApproved) * 100) : 0;
  // Risk buckets
  const buckets = { 'A (≥750)': 0, 'B (650-749)': 0, 'C (580-649)': 0, 'D (<580)': 0 };
  active.forEach(l => {
    const score = l.creditScore || 0;
    if (score >= 750) buckets['A (≥750)']++;
    else if (score >= 650) buckets['B (650-749)']++;
    else if (score >= 580) buckets['C (580-649)']++;
    else buckets['D (<580)']++;
  });

  window.afterRender = () => {
    const c1 = document.getElementById('loanAnaChart1');
    if (c1) new Chart(c1, {
      type: 'doughnut',
      data: { labels: Object.keys(buckets), datasets: [{ data: Object.values(buckets), backgroundColor: ['#00b386', '#10b981', '#f59e0b', '#dc2626'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
    });
    const c2 = document.getElementById('loanAnaChart2');
    if (c2) {
      // Repayment trend (last 6 months)
      const months = [];
      const repaymentData = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date(); d.setMonth(d.getMonth() - m);
        months.push(d.toLocaleString('en-GB', { month: 'short' }));
        // Simulated values
        repaymentData.push(Math.round((totalRepaid / 6) * (1 + (Math.random() - 0.5) * 0.4)));
      }
      new Chart(c2, {
        type: 'bar',
        data: { labels: months, datasets: [{ label: 'Repaid', data: repaymentData, backgroundColor: '#10b981', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => '₦' + (v/1000).toFixed(0) + 'k' } } } }
      });
    }
  };

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Loan Volume', value: money(totalApproved), icon: 'fees', color: 'brand' })}
      ${statCard({ label: 'Repayment Rate', value: totalDue ? Math.round((totalRepaid / totalDue) * 100) + '%' : '—', icon: 'trending_up', color: 'brand' })}
      ${statCard({ label: 'Overdue Installments', value: overdueRepayments.length, icon: 'bell', color: overdueRepayments.length ? 'rose' : 'brand' })}
      ${statCard({ label: 'Portfolio at Risk', value: par + '%', icon: 'trending_down', color: par > 10 ? 'rose' : 'gold' })}
    </div>
    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Risk Categorization (Active Loans)</h3>
        <div style="height: 220px;"><canvas id="loanAnaChart1"></canvas></div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Monthly Repayment Trend</h3>
        <div style="height: 220px;"><canvas id="loanAnaChart2"></canvas></div>
      </div>
    </div>
    ${overdueRepayments.length ? `<div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-bold text-slate-900">Delinquency / Overdue</h3>
          <p class="text-xs text-slate-500">Repayments past due date</p>
        </div>
        <button class="btn btn-secondary text-sm" onclick="sendDelinquencyReminders()">${icon('bell','w-3.5 h-3.5')} Send reminders</button>
      </div>
      <table class="tbl">
        <thead><tr><th>Loan</th><th>Parent</th><th>Amount Due</th><th>Days Overdue</th></tr></thead>
        <tbody>
          ${overdueRepayments.map(o => {
            const p = DB.find('parents', o.loan.parentId);
            const days = Math.ceil((new Date() - new Date(o.repayment.dueDate)) / 86400000);
            return `<tr>
              <td><code class="text-xs">${o.loan.id.slice(-8)}</code></td>
              <td>${p ? p.name : '—'}</td>
              <td class="font-mono">${money(o.repayment.amount)}</td>
              <td><span class="badge ${days > 14 ? 'badge-danger' : 'badge-warn'}">${days} day${days !== 1 ? 's' : ''}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `;
}

function sendDelinquencyReminders() {
  toast('Reminders queued for all overdue borrowers via WhatsApp', 'success');
}

function exportLoanBookCSV() {
  const loans = DB.get('loans');
  const headers = ['Loan ID', 'School', 'Parent', 'Amount', 'Term (months)', 'Interest %', 'Credit Score', 'Status', 'Applied', 'Approved'];
  const rows = loans.map(l => {
    const p = DB.find('parents', l.parentId);
    const s = DB.find('schools', l.schoolId);
    return [l.id, s ? s.name : '', p ? p.name : '', l.amount, l.term, l.interestRate, l.creditScore || '', l.status, l.appliedAt, l.approvedAt || ''];
  });
  downloadCSV(headers, rows, 'caspaa_loan_book');
}

function exportDisbursementsCSV() {
  const disb = DB.get('disbursements');
  const headers = ['Reference', 'Loan ID', 'Recipient', 'Account', 'Amount', 'Method', 'Status', 'Initiated', 'Completed'];
  const rows = disb.map(d => [d.reference, d.loanId, d.recipientName, d.recipientAccount, d.amount, d.method, d.status, d.initiatedAt, d.completedAt || '']);
  downloadCSV(headers, rows, 'caspaa_disbursements');
}

/* ---------- Analytics (tabbed) ---------- */
function view_sa_analytics() {
  const tab = APP.params.anaTab || 'business';
  // Date range defaults: last 30 days to today
  const dateFrom = APP.params.anaFrom || daysAgo(30);
  const dateTo = APP.params.anaTo || today();
  return `
    ${pageHeader({ title: 'Analytics', subtitle: 'Business · Platform Usage · System Performance' })}
    ${tabs([
      { key: 'business', label: 'Business' },
      { key: 'usage', label: 'Platform Usage' },
      { key: 'system', label: 'System Performance' }
    ], tab, k => { APP.params.anaTab = k; APP.render(); })}

    <!-- Date range filter -->
    <div class="flex flex-wrap items-center gap-3 mt-4 mb-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <span class="text-sm font-semibold text-slate-700">${icon('calendar','w-4 h-4 inline mr-1')} Date range:</span>
      <div class="flex items-center gap-2 flex-1 flex-wrap">
        <input type="date" class="input !w-40 text-sm" value="${dateFrom}" max="${dateTo}" onchange="APP.params.anaFrom = this.value; APP.render()" />
        <span class="text-slate-400 text-sm">to</span>
        <input type="date" class="input !w-40 text-sm" value="${dateTo}" min="${dateFrom}" max="${today()}" onchange="APP.params.anaTo = this.value; APP.render()" />
      </div>
      <div class="flex gap-1 flex-wrap">
        ${[['7d','Last 7 days',7],['30d','Last 30 days',30],['90d','Last 90 days',90],['term','This term',null]].map(([k,label,n]) => {
          const isActive = n ? (dateFrom === daysAgo(n) && dateTo === today()) : (dateFrom <= daysAgo(60));
          return `<button class="btn btn-ghost !py-1 !px-2 text-xs ${isActive?'bg-brand-100 text-brand-700':''}" onclick="APP.params.anaFrom='${n?daysAgo(n):daysAgo(90)}'; APP.params.anaTo='${today()}'; APP.render()">${label}</button>`;
        }).join('')}
        <button class="btn btn-ghost !py-1 !px-2 text-xs text-rose-600" onclick="APP.params.anaFrom=null; APP.params.anaTo=null; APP.render()">Reset</button>
      </div>
    </div>
    <p class="text-xs text-slate-400 mb-4">Showing data from <strong>${fdate(dateFrom, { long: true })}</strong> to <strong>${fdate(dateTo, { long: true })}</strong></p>

    <div>
      ${tab === 'usage' ? renderUsageTab(dateFrom, dateTo) :
        tab === 'system' ? renderSystemTab() :
        renderBusinessTab(dateFrom, dateTo)}
    </div>
  `;
}

function renderBusinessTab(dateFrom, dateTo) {
  dateFrom = dateFrom || daysAgo(30); dateTo = dateTo || today();
  window.afterRender = () => {
    const c1 = document.getElementById('anaChart1');
    if (c1) new Chart(c1, {
      type: 'bar',
      data: {
        labels: ['Lekki', 'Ikoyi', 'Ikeja', 'VI', 'Magodo', 'Festac'],
        datasets: [{ label: 'Schools', data: [3, 2, 2, 1, 1, 1], backgroundColor: '#00b386', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const c2 = document.getElementById('anaChart2');
    if (c2) {
      const schools = DB.get('schools');
      new Chart(c2, {
        type: 'bar',
        data: {
          labels: schools.map(s => s.name.split(' ').slice(0, 2).join(' ')),
          datasets: [{ label: 'Students', data: schools.map(s => s.students), backgroundColor: '#10b981', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
      });
    }
    const c3 = document.getElementById('anaChart3');
    if (c3) {
      const schools = DB.get('schools');
      const txnsBySchool = schools.map(s => DB.query('transactions', t => t.schoolId === s.id && t.status === 'successful' && t.timestamp >= dateFrom && t.timestamp <= dateTo + 'T23:59:59').reduce((sum, t) => sum + t.amount, 0));
      new Chart(c3, {
        type: 'bar',
        data: {
          labels: schools.map(s => s.name.split(' ').slice(0, 2).join(' ')),
          datasets: [{ label: 'Revenue', data: txnsBySchool, backgroundColor: '#f59e0b', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: v => '₦' + (v/1000000).toFixed(1) + 'M' } } } }
      });
    }
  };
  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Active Users (DAU)', value: '1,247', icon: 'students', color: 'brand', trend: { direction: 'up', label: '+12%' } })}
      ${statCard({ label: 'MAU', value: '4,820', icon: 'students', color: 'brand' })}
      ${statCard({ label: 'NPS', value: '62', icon: 'trending_up', color: 'gold' })}
      ${statCard({ label: 'Crash-free', value: '99.7%', icon: 'check', color: 'brand' })}
    </div>
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-slate-900 mb-3">Schools by Location</h3>
      <div style="height: 220px;"><canvas id="anaChart1"></canvas></div>
    </div>
    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Students per School</h3>
        <div style="height: 220px;"><canvas id="anaChart2"></canvas></div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Revenue per School</h3>
        <div style="height: 220px;"><canvas id="anaChart3"></canvas></div>
      </div>
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
        <h3 class="font-bold text-slate-900 mb-3">Customer Success KPIs</h3>
        <div class="space-y-3">
          <div><div class="flex justify-between text-sm mb-1"><span>Parent satisfaction (avg)</span><strong>4.6 / 5</strong></div><div class="progress"><div class="progress-bar" style="width:92%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>Support resolution SLA</span><strong>8.4 hrs avg</strong></div><div class="progress"><div class="progress-bar" style="width:88%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span>Onboarding completion</span><strong>87%</strong></div><div class="progress"><div class="progress-bar" style="width:87%"></div></div></div>
        </div>
      </div>
    </div>
    <button class="btn btn-secondary mt-4" onclick="exportAnalyticsCSV()">${icon('download','w-4 h-4')} Export business analytics</button>
  `;
}

function renderUsageTab(dateFrom, dateTo) {
  dateFrom = dateFrom || daysAgo(14); dateTo = dateTo || today();
  const usage = DB.get('usageEvents').filter(e => !e.timestamp || (e.timestamp >= dateFrom && e.timestamp <= dateTo + 'T23:59:59'));
  const days = [];
  for (let d = 13; d >= 0; d--) days.push(daysAgo(d));
  const dauByDay = days.map(d => {
    const rows = usage.filter(u => u.date === d);
    return rows.length ? Math.round(rows.reduce((s, r) => s + r.dau, 0) / [...new Set(rows.map(r => r.schoolId))].length) : 0;
  });
  // Feature totals
  const featureTotals = {};
  usage.forEach(u => { featureTotals[u.feature] = (featureTotals[u.feature] || 0) + u.count; });
  const sortedFeatures = Object.entries(featureTotals).sort((a, b) => b[1] - a[1]);
  // School login frequency (active days in last 14)
  const schools = DB.get('schools');
  const schoolFreq = schools.map(s => {
    const active = days.filter(d => usage.some(u => u.schoolId === s.id && u.date === d)).length;
    return { school: s, active };
  }).sort((a, b) => b.active - a.active);

  window.afterRender = () => {
    const c1 = document.getElementById('usageChart1');
    if (c1) new Chart(c1, {
      type: 'line',
      data: { labels: days.map(d => fdate(d, { short: true })), datasets: [{ label: 'DAU', data: dauByDay, borderColor: '#00b386', backgroundColor: 'rgba(0, 179, 134,0.15)', tension: 0.35, fill: true, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const c2 = document.getElementById('usageChart2');
    if (c2) new Chart(c2, {
      type: 'bar',
      data: { labels: sortedFeatures.map(f => f[0]), datasets: [{ label: 'Events', data: sortedFeatures.map(f => f[1]), backgroundColor: '#10b981', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
    });
  };

  const totalEvents = sortedFeatures.reduce((s, f) => s + f[1], 0);

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'Daily Active Users', value: dauByDay[dauByDay.length - 1] || 0, icon: 'students', color: 'brand', trend: { direction: 'up', label: 'last 24h' } })}
      ${statCard({ label: 'Weekly Active Users', value: Math.max(...dauByDay), icon: 'students', color: 'brand' })}
      ${statCard({ label: 'Feature Events (14d)', value: totalEvents.toLocaleString(), icon: 'dashboard', color: 'gold' })}
      ${statCard({ label: 'Avg Logins / school / week', value: '5.2', icon: 'check', color: 'brand' })}
    </div>
    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Daily Active Users (last 14 days)</h3>
        <div style="height: 220px;"><canvas id="usageChart1"></canvas></div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Most Used Features</h3>
        <div style="height: 220px;"><canvas id="usageChart2"></canvas></div>
      </div>
    </div>
    <div class="card p-5">
      <h3 class="font-bold text-slate-900 mb-3">School Login Frequency (last 14 days)</h3>
      <table class="tbl">
        <thead><tr><th>School</th><th>Active Days</th><th>Engagement</th></tr></thead>
        <tbody>
          ${schoolFreq.map(({ school, active }) => `<tr>
            <td><div class="flex items-center gap-2">${avatar(school.name, 'sm')}<span class="font-medium">${school.name}</span></div></td>
            <td><strong>${active} / ${days.length}</strong></td>
            <td><div class="progress" style="width: 200px;"><div class="progress-bar" style="width: ${Math.round((active / days.length) * 100)}%"></div></div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSystemTab() {
  const m = DB.settings ? (DB.load().systemMetrics || {}) : {};
  const logs = DB.get('errorLogs').sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'API Uptime (90d)', value: (m.apiUptime || 99.9) + '%', icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Avg Response Time', value: (m.avgResponseMs || 200) + 'ms', icon: 'trending_up', color: 'brand' })}
      ${statCard({ label: 'Failed Payment Rate', value: (m.failedPaymentRate || 0) + '%', icon: 'trending_down', color: m.failedPaymentRate > 3 ? 'rose' : 'gold' })}
      ${statCard({ label: 'Crash-free Sessions', value: (m.crashFreeSessions || 99) + '%', icon: 'check', color: 'brand' })}
    </div>

    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Infrastructure Health</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <span class="flex items-center gap-2 text-emerald-900">${icon('check','w-4 h-4')} Web API</span>
            <span class="font-semibold">Healthy · ${m.avgResponseMs}ms</span>
          </div>
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <span class="flex items-center gap-2 text-emerald-900">${icon('check','w-4 h-4')} Database (primary)</span>
            <span class="font-semibold">Healthy</span>
          </div>
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <span class="flex items-center gap-2 text-emerald-900">${icon('check','w-4 h-4')} Paystack Webhooks</span>
            <span class="font-semibold">Healthy · 99.8%</span>
          </div>
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <span class="flex items-center gap-2 text-emerald-900">${icon('check','w-4 h-4')} WhatsApp API</span>
            <span class="font-semibold">Healthy</span>
          </div>
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <span class="flex items-center gap-2 text-emerald-900">${icon('check','w-4 h-4')} S3 (file storage)</span>
            <span class="font-semibold">Healthy</span>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">Performance Detail</h3>
        <div class="space-y-3 text-sm">
          <div>
            <div class="flex justify-between mb-1"><span>API p50 latency</span><strong>${m.avgResponseMs}ms</strong></div>
            <div class="progress"><div class="progress-bar" style="width: ${Math.min(100, m.avgResponseMs / 5)}%"></div></div>
          </div>
          <div>
            <div class="flex justify-between mb-1"><span>API p95 latency</span><strong>${m.p95ResponseMs}ms</strong></div>
            <div class="progress"><div class="progress-bar" style="width: ${Math.min(100, m.p95ResponseMs / 10)}%"></div></div>
          </div>
          <div>
            <div class="flex justify-between mb-1"><span>Uptime SLA target (99.9%)</span><strong>${m.apiUptime}%</strong></div>
            <div class="progress"><div class="progress-bar" style="width: ${m.apiUptime}%"></div></div>
          </div>
          <div>
            <div class="flex justify-between mb-1"><span>Open incidents</span><strong>${m.incidentsOpen || 0}</strong></div>
          </div>
          <div>
            <div class="flex justify-between mb-1"><span>Backups (last 24h)</span><strong>${m.backupsLast24h || 0} successful</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-900">Error / Event Logs</h3>
        <span class="text-xs text-slate-500">${logs.length} entries · last 7 days</span>
      </div>
      <div class="space-y-2">
        ${logs.map(l => {
          const tone = l.level === 'error' ? 'rose' : l.level === 'warning' ? 'amber' : 'blue';
          const toneClasses = { rose: 'bg-rose-50 text-rose-900 border-rose-200', amber: 'bg-amber-50 text-amber-900 border-amber-200', blue: 'bg-brand-50 text-brand-900 border-brand-200' };
          return `<div class="flex items-start gap-3 p-3 rounded-xl border ${toneClasses[tone]}">
            <span class="badge badge-${tone === 'rose' ? 'danger' : tone === 'amber' ? 'warn' : 'info'} uppercase text-xs">${l.level}</span>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-mono opacity-70">${l.source}</div>
              <div class="text-sm">${l.message}</div>
              <div class="text-xs opacity-60 mt-1">${fdate(l.timestamp, { time: true })} ${l.resolved ? '· resolved' : '· open'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function exportAnalyticsCSV() {
  const schools = DB.get('schools');
  const headers = ['School', 'Plan', 'Students', 'Status', 'ARR', 'Joined', 'Revenue Collected'];
  const rows = schools.map(s => {
    const revenue = DB.query('transactions', t => t.schoolId === s.id && t.status === 'successful').reduce((sum, t) => sum + t.amount, 0);
    return [s.name, s.subscriptionPlan, s.students, s.status, s.monthlyFee * 12, s.joinedAt, revenue];
  });
  downloadCSV(headers, rows, 'caspaa_business_analytics');
}

/* ---------- Support Desk ---------- */
function view_sa_support() {
  const tickets = DB.get('supportTickets');
  const filter = APP.params.tktFilter || 'all';
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'escalated');
  const slaBreaching = open.filter(t => {
    const ageH = (new Date() - new Date(t.createdAt)) / 3600000;
    return ageH > t.slaHours * 0.8;
  });

  return `
    ${pageHeader({
      title: 'Support Desk',
      subtitle: `${open.length} open tickets · ${slaBreaching.length} at risk of SLA breach`,
      actions: `<button class="btn btn-primary" onclick="newTicketModal()">${icon('plus','w-4 h-4')} New Ticket</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      ${statCard({ label: 'Open', value: tickets.filter(t => t.status === 'open').length, icon: 'bell', color: 'gold' })}
      ${statCard({ label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, icon: 'chat', color: 'brand' })}
      ${statCard({ label: 'Escalated', value: tickets.filter(t => t.status === 'escalated').length, icon: 'trending_up', color: 'rose' })}
      ${statCard({ label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'SLA at Risk', value: slaBreaching.length, icon: 'bell', color: slaBreaching.length ? 'rose' : 'brand' })}
    </div>

    <div class="flex gap-2 mb-4 flex-wrap">
      <button class="chip ${filter==='all'?'active':''}" onclick="APP.params.tktFilter='all'; APP.render()">All ${tickets.length}</button>
      <button class="chip ${filter==='open'?'active':''}" onclick="APP.params.tktFilter='open'; APP.render()">Open</button>
      <button class="chip ${filter==='in_progress'?'active':''}" onclick="APP.params.tktFilter='in_progress'; APP.render()">In Progress</button>
      <button class="chip ${filter==='escalated'?'active':''}" onclick="APP.params.tktFilter='escalated'; APP.render()">Escalated</button>
      <button class="chip ${filter==='resolved'?'active':''}" onclick="APP.params.tktFilter='resolved'; APP.render()">Resolved</button>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Ticket</th><th>School</th><th>Subject</th><th>Priority</th><th>Channel</th><th>SLA</th><th>Status</th><th>Assigned</th><th></th></tr></thead>
        <tbody>
          ${filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(t => {
            const sch = DB.find('schools', t.schoolId);
            const ageH = (new Date() - new Date(t.createdAt)) / 3600000;
            const slaRemaining = t.slaHours - ageH;
            const slaPct = Math.max(0, Math.min(100, (slaRemaining / t.slaHours) * 100));
            const slaClass = t.status === 'resolved' ? 'text-emerald-700' : slaRemaining <= 0 ? 'text-rose-700 font-bold' : slaRemaining < t.slaHours * 0.2 ? 'text-amber-700 font-semibold' : 'text-slate-600';
            const assignee = t.assignedTo ? DB.get('platformTeam').find(p => p.id === t.assignedTo) : null;
            return `<tr class="cursor-pointer" onclick="viewTicket('${t.id}')">
              <td><code class="text-xs">${t.id.toUpperCase()}</code></td>
              <td class="text-sm">${sch ? sch.name : '—'}</td>
              <td class="font-medium">${t.subject}</td>
              <td><span class="badge ${t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}">${t.priority}</span></td>
              <td><span class="badge badge-info uppercase">${t.channel}</span></td>
              <td class="${slaClass} text-sm">${t.status === 'resolved' ? '—' : (slaRemaining <= 0 ? `BREACHED ${Math.abs(Math.round(slaRemaining))}h` : `${Math.round(slaRemaining)}h left`)}</td>
              <td>${statusBadge(t.status === 'in_progress' ? 'pending' : t.status === 'escalated' ? 'failed' : t.status === 'resolved' ? 'successful' : 'pending')}<span class="ml-1 text-xs">${t.status.replace('_', ' ')}</span></td>
              <td class="text-sm">${assignee ? assignee.name.split(' ')[0] : '—'}</td>
              <td><button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); viewTicket('${t.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewTicket(ticketId) {
  const t = DB.find('supportTickets', ticketId);
  if (!t) return;
  const sch = DB.find('schools', t.schoolId);
  const team = DB.get('platformTeam').filter(p => p.permissions.includes('support') || p.permissions.includes('*'));
  const ageH = (new Date() - new Date(t.createdAt)) / 3600000;
  const slaRemaining = t.slaHours - ageH;
  const assignee = t.assignedTo ? DB.get('platformTeam').find(p => p.id === t.assignedTo) : null;

  modal({
    title: t.id.toUpperCase() + ' — ' + t.subject,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
          ${avatar(sch ? sch.name : '?', 'lg')}
          <div class="flex-1">
            <div class="font-bold text-slate-900">${sch ? sch.name : '—'}</div>
            <div class="text-sm text-slate-500">${t.requester}</div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span class="badge ${t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warn' : 'badge-neutral'}">${t.priority} priority</span>
              <span class="badge badge-info">via ${t.channel}</span>
              ${statusBadge(t.status === 'in_progress' ? 'pending' : t.status === 'escalated' ? 'failed' : t.status === 'resolved' ? 'successful' : 'pending')}
            </div>
          </div>
          <div class="text-right text-sm">
            <div class="text-xs text-slate-500">SLA</div>
            <div class="font-bold ${t.status === 'resolved' ? 'text-emerald-700' : slaRemaining <= 0 ? 'text-rose-700' : slaRemaining < t.slaHours * 0.2 ? 'text-amber-700' : 'text-slate-700'}">
              ${t.status === 'resolved' ? 'Met' : (slaRemaining <= 0 ? `Breached ${Math.abs(Math.round(slaRemaining))}h ago` : `${Math.round(slaRemaining)}h left`)}
            </div>
            <div class="text-xs text-slate-400 mt-1">Opened ${fdate(t.createdAt, { relative: true })}</div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h4 class="text-xs uppercase font-semibold text-slate-500 mb-1">Description</h4>
          <div class="bg-slate-50 rounded-xl p-3 text-sm">${t.description || '(no description provided)'}</div>
        </div>

        <!-- Status controls -->
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="input-label">Status</label>
            <select class="input" onchange="changeTicketStatus('${t.id}', this.value)">
              <option value="open" ${t.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="escalated" ${t.status === 'escalated' ? 'selected' : ''}>Escalated</option>
              <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </div>
          <div>
            <label class="input-label">Assigned To</label>
            <select class="input" onchange="assignTicket('${t.id}', this.value)">
              <option value="">— Unassigned —</option>
              ${team.map(p => `<option value="${p.id}" ${t.assignedTo === p.id ? 'selected' : ''}>${p.name} (${p.role})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Notes timeline -->
        <div>
          <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Resolution Notes (${t.notes.length})</h4>
          <div class="space-y-2 mb-3">
            ${t.notes.length === 0 ? '<p class="text-sm text-slate-500">No notes yet.</p>' : t.notes.map(n => {
              const author = DB.get('platformTeam').find(p => p.id === n.by);
              return `<div class="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                ${avatar(author ? author.name : 'Support', 'sm')}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-sm">${author ? author.name : 'Support'}</span>
                    ${n.internal ? '<span class="badge badge-warn">internal</span>' : '<span class="badge badge-info">shared</span>'}
                    <span class="text-xs text-slate-400 ml-auto">${fdate(n.timestamp, { relative: true })}</span>
                  </div>
                  <div class="text-sm mt-1">${n.text}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="flex gap-2">
            <input id="tkt_noteText" class="input flex-1" placeholder="Add a note…" />
            <label class="flex items-center gap-1 text-xs whitespace-nowrap">
              <input id="tkt_noteInternal" type="checkbox" />
              <span>Internal only</span>
            </label>
            <button class="btn btn-primary" onclick="addTicketNote('${t.id}')">${icon('send','w-4 h-4')}</button>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      ${sch && sch.phone ? `<button class="btn btn-secondary" onclick="sendWhatsApp('${sch.phone}')">${icon('chat','w-4 h-4')} WhatsApp</button>` : ''}
      ${t.status !== 'escalated' && t.status !== 'resolved' ? `<button class="btn btn-danger" onclick="changeTicketStatus('${t.id}', 'escalated')">${icon('trending_up','w-4 h-4')} Escalate</button>` : ''}
      ${t.status !== 'resolved' ? `<button class="btn btn-primary" onclick="changeTicketStatus('${t.id}', 'resolved')">${icon('check','w-4 h-4')} Mark Resolved</button>` : ''}
    `
  });
}

function changeTicketStatus(ticketId, status) {
  const t = DB.find('supportTickets', ticketId);
  DB.update('supportTickets', ticketId, { status, resolvedAt: status === 'resolved' ? now() : t.resolvedAt });
  toast(`Ticket marked ${status.replace('_', ' ')}`);
  viewTicket(ticketId);
}

function assignTicket(ticketId, teamMemberId) {
  DB.update('supportTickets', ticketId, { assignedTo: teamMemberId || null });
  const team = teamMemberId ? DB.get('platformTeam').find(p => p.id === teamMemberId) : null;
  toast(team ? `Assigned to ${team.name}` : 'Unassigned');
}

function addTicketNote(ticketId) {
  const text = document.getElementById('tkt_noteText').value.trim();
  if (!text) return;
  const internal = document.getElementById('tkt_noteInternal').checked;
  const t = DB.find('supportTickets', ticketId);
  const notes = t.notes.concat([{ by: AUTH.current.id, text, internal, timestamp: now() }]);
  DB.update('supportTickets', ticketId, { notes });
  toast(internal ? 'Internal note added' : 'Note added (visible to school)');
  viewTicket(ticketId);
}

function newTicketModal() {
  const schools = DB.get('schools');
  modal({
    title: 'Open New Support Ticket',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">School</label>
          <select id="tkt_school" class="input">${schools.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Requester (name)</label><input id="tkt_requester" class="input" placeholder="e.g. Mr. Olusegun Adebayo" /></div>
        <div><label class="input-label">Subject</label><input id="tkt_subject" class="input" /></div>
        <div><label class="input-label">Description</label><textarea id="tkt_desc" rows="3" class="input"></textarea></div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="input-label">Priority</label>
            <select id="tkt_priority" class="input"><option>low</option><option selected>medium</option><option>high</option></select>
          </div>
          <div><label class="input-label">Channel</label>
            <select id="tkt_channel" class="input"><option>platform</option><option>whatsapp</option><option>email</option></select>
          </div>
          <div><label class="input-label">SLA (hours)</label><input id="tkt_sla" type="number" class="input" value="24" /></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveNewTicket()">Open Ticket</button>`
  });
}

function saveNewTicket() {
  const subject = document.getElementById('tkt_subject').value.trim();
  if (!subject) { toast('Subject required', 'danger'); return; }
  DB.insert('supportTickets', {
    id: 'tkt_' + Date.now().toString(36).slice(-4),
    schoolId: document.getElementById('tkt_school').value,
    requester: document.getElementById('tkt_requester').value.trim() || '—',
    subject,
    description: document.getElementById('tkt_desc').value.trim(),
    priority: document.getElementById('tkt_priority').value,
    status: 'open',
    channel: document.getElementById('tkt_channel').value,
    assignedTo: null,
    createdAt: now(),
    slaHours: parseInt(document.getElementById('tkt_sla').value) || 24,
    notes: []
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Ticket opened');
}

/* ---------- CASPAA Team ---------- */
function view_sa_team() {
  const team = DB.get('platformTeam');
  const allPermissions = [
    { key: 'schools',     label: 'Schools Management' },
    { key: 'revenue',     label: 'Revenue & MRR' },
    { key: 'invoices',    label: 'School Invoices' },
    { key: 'commissions', label: 'Commissions' },
    { key: 'lending',     label: 'Lending Book' },
    { key: 'disbursement',label: 'Disbursement Console' },
    { key: 'support',     label: 'Support Desk' },
    { key: 'audit',       label: 'Audit Log' },
    { key: 'analytics',   label: 'Analytics' },
    { key: 'security',    label: 'Security & Compliance' }
  ];

  return `
    ${pageHeader({
      title: 'CASPAA Team',
      subtitle: `${team.length} team members across operations, finance, credit, risk, support, compliance, and BI`,
      actions: `<button class="btn btn-primary" onclick="addTeamMemberModal()">${icon('plus','w-4 h-4')} Add Team Member</button>`
    })}

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Member</th><th>Role</th><th>Email</th><th>Permissions</th><th>Last Active</th><th></th></tr></thead>
        <tbody>
          ${team.map(m => `<tr>
            <td><div class="flex items-center gap-2">${avatar(m.name, 'sm')}<div><div class="font-semibold text-sm">${m.name}</div><div class="text-xs text-slate-500">Joined ${fdate(m.createdAt, { short: true })}</div></div></div></td>
            <td><span class="badge ${m.role === 'Super Admin' ? 'badge-success' : 'badge-info'}">${m.role}</span></td>
            <td class="text-sm">${m.email}</td>
            <td><div class="text-xs">${m.permissions.includes('*') ? '<span class="badge badge-success">All access</span>' : m.permissions.length + ' module' + (m.permissions.length !== 1 ? 's' : '')}</div></td>
            <td class="text-xs text-slate-500">${fdate(m.lastActive, { relative: true })}</td>
            <td class="text-right">
              <button class="btn btn-ghost !p-1.5" title="Edit permissions" onclick="editTeamMember('${m.id}')">${icon('edit','w-4 h-4')}</button>
              ${m.id !== 'sa_001' ? `<button class="btn btn-ghost !p-1.5 text-rose-600" title="Remove" onclick="removeTeamMember('${m.id}')">${icon('trash','w-4 h-4')}</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="card p-5 mt-4">
      <h3 class="font-bold text-slate-900 mb-3">Roles & Responsibilities</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${[
          { role: 'Super Admin', desc: 'Full system control, platform-wide ownership' },
          { role: 'Operations', desc: 'School onboarding, monitoring, account health' },
          { role: 'Finance', desc: 'Revenue, school invoicing, reconciliation' },
          { role: 'Credit', desc: 'Loan approvals, disbursement, monitoring' },
          { role: 'Risk', desc: 'Fraud detection, default monitoring, PAR' },
          { role: 'Support', desc: 'School support tickets, WhatsApp interim' },
          { role: 'Compliance', desc: 'NDPR / FERPA audits, regulatory readiness' },
          { role: 'BI / Analytics', desc: 'Platform insights, growth metrics, reports' }
        ].map(r => `<div class="p-3 bg-slate-50 rounded-xl">
          <div class="font-bold text-sm text-slate-900">${r.role}</div>
          <div class="text-xs text-slate-600 mt-1">${r.desc}</div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

function editTeamMember(memberId) {
  const m = DB.find('platformTeam', memberId);
  if (!m) return;
  const allPermissions = [
    { key: 'schools',     label: 'Schools Management' },
    { key: 'revenue',     label: 'Revenue & MRR' },
    { key: 'invoices',    label: 'School Invoices' },
    { key: 'commissions', label: 'Commissions' },
    { key: 'lending',     label: 'Lending Book' },
    { key: 'disbursement',label: 'Disbursement Console' },
    { key: 'support',     label: 'Support Desk' },
    { key: 'audit',       label: 'Audit Log' },
    { key: 'analytics',   label: 'Analytics' },
    { key: 'security',    label: 'Security & Compliance' }
  ];
  const isSuper = m.permissions.includes('*');

  modal({
    title: m.name + ' — Permissions',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          ${avatar(m.name, 'md')}
          <div>
            <div class="font-bold">${m.name}</div>
            <div class="text-xs text-slate-500">${m.role} · ${m.email}</div>
          </div>
        </div>
        ${isSuper ? `<div class="bg-amber-50 rounded-xl p-3 text-sm text-amber-900">
          This is the platform Super Admin. They have unrestricted access to all modules.
        </div>` : `<div>
          <label class="input-label">Granular Permissions (RBAC)</label>
          <div class="space-y-1.5">
            ${allPermissions.map(p => `<label class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg cursor-pointer">
              <span class="text-sm">${p.label}</span>
              <input type="checkbox" class="w-4 h-4 accent-brand-600" data-perm="${p.key}" ${m.permissions.includes(p.key) ? 'checked' : ''} />
            </label>`).join('')}
          </div>
        </div>`}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             ${isSuper ? '' : `<button class="btn btn-primary" onclick="saveTeamMemberPermissions('${memberId}')">Save Permissions</button>`}`
  });
}

function saveTeamMemberPermissions(memberId) {
  const checks = Array.from(document.querySelectorAll('[data-perm]'));
  const perms = checks.filter(c => c.checked).map(c => c.dataset.perm);
  DB.update('platformTeam', memberId, { permissions: perms });
  document.getElementById('modalBackdrop').click();
  toast('Permissions updated');
  APP.render();
}

function removeTeamMember(memberId) {
  const m = DB.find('platformTeam', memberId);
  confirm(`Remove ${m.name} from the CASPAA team? Their access will be revoked immediately.`, () => {
    DB.remove('platformTeam', memberId);
    APP.render();
    toast('Team member removed', 'info');
  }, { yesLabel: 'Remove', danger: true });
}

function addTeamMemberModal() {
  modal({
    title: 'Add CASPAA Team Member',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Full Name</label><input id="tm_name" class="input" /></div>
        <div><label class="input-label">Email</label><input id="tm_email" type="email" class="input" placeholder="@caspaa.com" /></div>
        <div><label class="input-label">Role</label>
          <select id="tm_role" class="input" onchange="onTeamRoleChange()">
            <option>Operations</option>
            <option>Finance</option>
            <option>Credit</option>
            <option>Risk</option>
            <option>Support</option>
            <option>Compliance</option>
            <option>BI / Analytics</option>
          </select>
        </div>
        <div class="text-sm text-slate-600 bg-brand-50 rounded-xl p-3">
          Default permissions will be assigned based on role. You can fine-tune them after creation.
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveTeamMember()">Add Member</button>`
  });
}

function onTeamRoleChange() { /* placeholder for default permission preview */ }

function saveTeamMember() {
  const name = document.getElementById('tm_name').value.trim();
  const email = document.getElementById('tm_email').value.trim();
  const role = document.getElementById('tm_role').value;
  if (!name || !email) { toast('Name and email required', 'danger'); return; }
  const rolePerms = {
    'Operations':     ['schools', 'support', 'audit'],
    'Finance':        ['revenue', 'invoices', 'commissions'],
    'Credit':         ['lending', 'disbursement'],
    'Risk':           ['lending', 'audit', 'analytics'],
    'Support':        ['support', 'schools'],
    'Compliance':     ['audit', 'security'],
    'BI / Analytics': ['analytics', 'revenue']
  };
  DB.insert('platformTeam', {
    id: uid('team'),
    name, email, role,
    permissions: rolePerms[role] || [],
    createdAt: now(),
    lastActive: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} added to CASPAA team as ${role}`);
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
