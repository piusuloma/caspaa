/* CASPAA School OS shell — recreated from public/js/app.js (APP.render) and
   public/js/ui.js. Registered on window.OS. */
window.OS = {};

const ICONS = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  students: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  teacher: ['M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'],
  classes: ['M3 3h18v18H3z', 'M9 3v18'],
  results: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  fees: ['M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1', 'M18 11h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z'],
  check: ['M20 6L9 17l-5-5'],
  trending_down: ['M23 18l-9.5-9.5-5 5L1 6', 'M17 18h6v-6'],
  trending_up: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  package: ['M16.5 9.4L7.5 4.21', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96L12 12l8.73-5.04', 'M12 22.08V12'],
  loan: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M2 10h20'],
  reports: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 5.78 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.18l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 11H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  wifi: ['M5 12.55a11 11 0 0 1 14.08 0', 'M1.42 9a16 16 0 0 1 21.16 0', 'M8.53 16.11a6 6 0 0 1 6.95 0', 'M12 20h.01'],
  wifi_off: ['M1 1l22 22', 'M16.72 11.06A10.94 10.94 0 0 1 19 12.55', 'M5 12.55a10.94 10.94 0 0 1 5.17-2.39', 'M10.71 5.05A16 16 0 0 1 22.58 9', 'M1.42 9a15.91 15.91 0 0 1 4.7-2.88', 'M8.53 16.11a6 6 0 0 1 6.95 0', 'M12 20h.01'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z'],
};

const Icon = OS.Icon = ({ name, className = 'w-5 h-5' }) => {
  const paths = ICONS[name] || ICONS.dashboard;
  return (
    <span className={className + ' inline-flex'} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
    </span>
  );
};

OS.initials = name => (name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
/* Initials pick a brand hue from the name so a list of students is legible at a glance. */
const AV_TONES = ['tone-teal', 'tone-green', 'tone-gold'];
OS.Avatar = ({ name, size = 'sm' }) => {
  const i = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_TONES.length;
  return <span className={'avatar ' + size + ' ' + AV_TONES[i]}>{OS.initials(name)}</span>;
};
OS.StatusBadge = ({ status }) => {
  const map = {
    paid: ['badge-success', 'Paid'], partial: ['badge-warn', 'Partial'], outstanding: ['badge-danger', 'Outstanding'],
    pending: ['badge-warn', 'Pending'], successful: ['badge-success', 'Successful'], failed: ['badge-danger', 'Failed'],
    active: ['badge-success', 'Active'], trial: ['badge-info', 'Trial'],
  };
  const m = map[status] || ['badge-neutral', status];
  return <span className={'badge ' + m[0]}>{m[1]}</span>;
};

OS.StatCard = ({ label, value, trend, icon, accent = '#0a8491' }) => {
  return (
    <div className="stat" style={{ '--stat-accent': accent }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {trend
            ? <div className={'stat-trend ' + trend.direction}><Icon name={trend.direction === 'up' ? 'trending_up' : 'trending_down'} className="w-3 h-3" /><span>{trend.label}</span></div>
            : <div className="stat-trend" aria-hidden="true">&nbsp;</div>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: accent + '1f', color: accent }}>
            <Icon name={icon} className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

OS.Sidebar = ({ active, onSelect }) => (
  <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-screen">
    <div className="px-5 py-5 border-b border-slate-200">
      <img src="../../assets/logo/caspaa-green.svg" alt="CASPAA" className="h-6 w-auto" />
      <div className="text-xs text-slate-500 mt-2">{APPDATA.user.roleLabel}</div>
      <div className="mt-3 h-1 rounded-full" style={{ background: 'linear-gradient(90deg,#00b386 0 34%,#0a8491 34% 67%,#e69514 67% 100%)' }} />
    </div>
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-area">
      {APPDATA.nav.map(n => {
        const on = active === n.key;
        return (
          <a key={n.key} className={'nav-item ' + (on ? 'active' : '')} onClick={() => onSelect(n.key)}>
            <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
              style={{ background: on ? n.color : n.color + '1a', color: on ? '#fff' : n.color }}>
              <Icon name={n.icon} className="w-4 h-4" />
            </span>
            <span>{n.label}</span>
          </a>
        );
      })}
    </nav>
    <div className="p-3 border-t border-slate-200">
      <a className="nav-item signout"><Icon name="logout" className="w-5 h-5" /><span>Sign out</span></a>
    </div>
  </aside>
);

OS.TopBar = ({ title, offline, onToggleOffline, onSearch, onNotify }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div className="flex items-center justify-between px-4 lg:px-6 h-14 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden btn btn-ghost !p-1.5" aria-label="Open navigation menu"><Icon name="menu" /></button>
        <h2 className="font-bold text-slate-900 text-base lg:text-lg truncate">{title}</h2>
      </div>
      <button onClick={onSearch}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-500 min-w-[160px] lg:min-w-[260px]">
        <Icon name="search" className="w-4 h-4" />
        <span className="flex-1 text-left">Search students, staff, classes…</span>
        <kbd className="hidden lg:inline text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono">/</kbd>
      </button>
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost !p-2 relative" aria-label="Notifications — 3 unread" onClick={onNotify}>
          <Icon name="bell" className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        <button className={'btn btn-ghost !p-2 ' + (offline ? 'text-rose-600' : 'text-emerald-600')}
          aria-label={offline ? 'Offline mode — tap to go online' : 'Online — tap to go offline'} onClick={onToggleOffline}>
          <Icon name={offline ? 'wifi_off' : 'wifi'} className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 hover:bg-slate-100 rounded-xl pl-1 pr-2 py-1 transition">
          <OS.Avatar name={APPDATA.user.name} size="sm" />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-900 leading-tight">{APPDATA.user.name}</div>
            <div className="text-xs text-slate-500 leading-tight">{APPDATA.user.roleLabel}</div>
          </div>
        </button>
      </div>
    </div>
  </header>
);

OS.BottomNav = ({ active, onSelect }) => (
  <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-2 pb-safe pt-1 flex z-30">
    {APPDATA.nav.slice(0, 4).map(n => (
      <div key={n.key} className={'bnav-item ' + (active === n.key ? 'active' : '')} onClick={() => onSelect(n.key)}>
        <Icon name={n.icon} className="w-5 h-5" /><span>{n.label.split(' ')[0]}</span>
      </div>
    ))}
    <div className="bnav-item"><Icon name="menu" className="w-5 h-5" /><span>More</span></div>
  </nav>
);

OS.ConnStatus = ({ offline }) => {
  if (!offline) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-16 z-40">
      <div className="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 bg-amber-100 text-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-label">Offline — changes saved locally</span>
      </div>
    </div>
  );
};
