/* CASPAA School OS — finance views. Structure follows the real app:
   pageHeader + stat row + .card panels + .tbl tables, all inside #mainArea. */
window.VIEWS = {};

const Icon = OS.Icon;
const StatCard = OS.StatCard;
const StatusBadge = OS.StatusBadge;

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
  </div>
);

const Bars = ({ data }) => {
  const max = Math.max.apply(null, data.map(d => d.value));
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col justify-end h-full">
          <div className="rounded-t transition-all" style={{
            height: Math.round((d.value / max) * 150) + 'px',
            background: i === data.length - 1 ? '#00b386' : '#0a8491',
            opacity: i === data.length - 1 ? 1 : 0.45 + (i / data.length) * 0.5,
          }} />
          <span className="text-[11px] text-slate-500 text-center pt-1.5">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const Donut = ({ segments, caption }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const stops = segments.map(s => {
    const from = (acc / total) * 100; acc += s.value;
    return s.color + ' ' + from.toFixed(1) + '% ' + ((acc / total) * 100).toFixed(1) + '%';
  }).join(', ');
  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40 rounded-full grid place-items-center shrink-0" style={{ background: 'conic-gradient(' + stops + ')' }}>
        <div className="w-24 h-24 rounded-full bg-white grid place-items-center text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">{caption}</div>
            <div className="text-xs text-slate-500">collected</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-slate-500 min-w-[124px]">{s.label}</span>
            <span className="font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

VIEWS.fin_dashboard = ({ onRecord }) => (
  <div>
    <PageHeader title="Dashboard" subtitle={APPDATA.term + ' · ' + APPDATA.user.school}
      actions={<>
        <button className="btn btn-secondary"><Icon name="download" className="w-4 h-4" /> Export</button>
        <button className="btn btn-primary" onClick={onRecord}><Icon name="plus" className="w-4 h-4" /> Record Payment</button>
      </>} />

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
      {APPDATA.stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>

    {/* School pulse — the wider school at a glance, one colour per module. */}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
      {APPDATA.schoolPulse.map(p => (
        <div key={p.label} className="card p-4 flex items-center gap-3" style={{ background: p.soft, borderColor: 'transparent' }}>
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: p.color, color: '#fff' }}>
            <Icon name={p.icon} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight" style={{ color: '#1e293b' }}>{p.value}</div>
            <div className="text-xs font-semibold" style={{ color: p.color }}>{p.label}</div>
            <div className="text-xs text-slate-500">{p.sub}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="grid gap-4 lg:grid-cols-3 mb-5">
      <div className="card lg:col-span-2">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Collection by month</h3>
            <p className="text-xs text-slate-500 mt-0.5">Session 2025/2026 · ₦ millions</p>
          </div>
          <div className="flex gap-1"><span className="chip active">This session</span><span className="chip">Last session</span></div>
        </div>
        <div className="p-4"><Bars data={APPDATA.collectionByMonth} /></div>
      </div>
      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Fee mix</h3>
          <p className="text-xs text-slate-500 mt-0.5">₦13,480,000 billed</p>
        </div>
        <div className="p-4"><Donut segments={APPDATA.feeMix} caption="92%" /></div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Recent payments</h3>
          <button className="btn btn-ghost">View all</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Method</th><th className="num">Amount</th><th>Status</th></tr></thead>
          <tbody>
            {APPDATA.payments.slice(0, 5).map(p => (
              <tr key={p.ref}>
                <td className="font-medium">{p.student}</td>
                <td className="text-slate-500">{p.method}</td>
                <td className="num">{p.amount}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="font-bold text-slate-900 mb-3">Collection rate by class</h3>
          <div className="space-y-3">
            {APPDATA.classRates.slice(0, 5).map(c => (
              <div key={c.klass}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{c.klass} · {c.owing} owing</span>
                  <span className="font-semibold text-slate-700">{c.rate}%</span>
                </div>
                <div className="progress"><div className={'progress-bar ' + (c.tone || '')} style={{ width: c.rate + '%' }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3" style={{ background: '#fdf6e0', borderColor: '#f7d78a' }}>
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: '#e69514', color: '#fff' }}><Icon name="bell" className="w-5 h-5" /></div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900">14 invoices are outstanding</h4>
            <p className="text-sm text-slate-600 mt-0.5">Parents were last reminded on 12 May. Reminders go out on WhatsApp and email.</p>
            <button className="btn btn-gold mt-3">Send Reminders</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

VIEWS.fin_invoices = ({ onRecord }) => {
  const [tab, setTab] = React.useState('all');
  const tabs = [['all', 'All', '#0a8491'], ['paid', 'Paid', '#00b386'], ['partial', 'Partial', '#e69514'], ['outstanding', 'Outstanding', '#dc2626']];
  const rows = tab === 'all' ? APPDATA.invoices : APPDATA.invoices.filter(r => r.status === tab);
  return (
    <div>
      <PageHeader title="Invoices" subtitle={APPDATA.term}
        actions={<>
          <button className="btn btn-secondary"><Icon name="download" className="w-4 h-4" /> Export CSV</button>
          <button className="btn btn-primary" onClick={onRecord}><Icon name="plus" className="w-4 h-4" /> Create Invoice</button>
        </>} />
      <div className="card overflow-hidden">
        <div className="px-4 pt-3">
          <div className="tabs" role="tablist">
            {tabs.map(t => (
              <button key={t[0]} role="tab" aria-selected={tab === t[0]} className={'tab ' + (tab === t[0] ? 'active' : '')} onClick={() => setTab(t[0])}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: t[2] }} />{t[1]}
                  <span className="badge badge-neutral">{t[0] === 'all' ? APPDATA.invoices.length : APPDATA.invoices.filter(r => r.status === t[0]).length}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Student</th><th>Class</th><th className="num">Billed</th><th className="num">Paid</th><th className="num">Balance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ref}>
                <td className="font-medium">{r.ref}</td>
                <td className="flex items-center gap-2"><OS.Avatar name={r.student} size="sm" /> {r.student}</td>
                <td className="text-slate-500">{r.klass}</td>
                <td className="num">{r.billed}</td>
                <td className="num">{r.paid}</td>
                <td className="num">{r.balance}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

VIEWS.fin_payments = ({ onRecord }) => (
  <div>
    <PageHeader title="Payments" subtitle={APPDATA.term}
      actions={<button className="btn btn-primary" onClick={onRecord}><Icon name="plus" className="w-4 h-4" /> Record Payment</button>} />
    <div className="grid gap-4 sm:grid-cols-3 mb-5">
      <StatCard label="Collected This Term" value="₦12,400,000" icon="fees" accent="#00b386" trend={{ direction: 'up', label: '8.2%' }} />
      <StatCard label="Awaiting Reconciliation" value="₦412,000" icon="check" accent="#e69514" />
      <StatCard label="Failed" value="₦52,000" icon="trending_down" accent="#e0655c" trend={{ direction: 'down', label: '3 payments' }} />
    </div>
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">All payments</h3>
        <div className="flex gap-1"><span className="chip active">This term</span><span className="chip">Last term</span><span className="chip">Session</span></div>
      </div>
      <table className="tbl">
        <thead><tr><th>Reference</th><th>Student</th><th>Method</th><th>Date</th><th className="num">Amount</th><th>Status</th></tr></thead>
        <tbody>
          {APPDATA.payments.map(p => (
            <tr key={p.ref}>
              <td className="font-medium">{p.ref}</td>
              <td>{p.student}</td>
              <td className="text-slate-500">{p.method}</td>
              <td className="text-slate-500">{p.date}</td>
              <td className="num">{p.amount}</td>
              <td><StatusBadge status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

VIEWS.fin_recon = () => (
  <div>
    <PageHeader title="Reconciliation" subtitle="3 bank credits waiting to be matched" />
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Unmatched bank credits</h3>
          <p className="text-xs text-slate-500 mt-0.5">Imported from the school account, 28 Jul 09:12</p>
        </div>
        <table className="tbl">
          <thead><tr><th>Reference</th><th>Narration</th><th>Date</th><th className="num">Amount</th><th></th></tr></thead>
          <tbody>
            {APPDATA.unmatched.map(u => (
              <tr key={u.ref}>
                <td className="font-medium">{u.ref}</td>
                <td className="text-slate-500">{u.narration}</td>
                <td className="text-slate-500">{u.date}</td>
                <td className="num">{u.amount}</td>
                <td><button className="btn btn-accent">Match</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-4">
        <h3 className="font-bold text-slate-900 mb-3">Outstanding by class</h3>
        <table className="tbl">
          <thead><tr><th>Class</th><th className="num">Owing</th><th className="num">Outstanding</th><th>Rate</th></tr></thead>
          <tbody>
            {APPDATA.classRates.map(c => (
              <tr key={c.klass}>
                <td className="font-medium">{c.klass}</td>
                <td className="num">{c.owing}</td>
                <td className="num">{c.outstanding}</td>
                <td><div className="progress w-24"><div className={'progress-bar ' + (c.tone || '')} style={{ width: c.rate + '%' }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

VIEWS.__fallback = key => () => (
  <div>
    <PageHeader title={(APPDATA.nav.find(n => n.key === key) || {}).label || 'CASPAA'} subtitle={APPDATA.term} />
    <div className="card">
      <div className="empty-state">
        <OS.Icon name="package" className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">Not part of this kit</h3>
        <p className="text-sm mb-4">
          The repo ships this view in <code>public/js/modules/finance.js</code>. Four finance views are
          recreated here — Dashboard, Invoices, Payments and Reconciliation.
        </p>
      </div>
    </div>
  </div>
);
