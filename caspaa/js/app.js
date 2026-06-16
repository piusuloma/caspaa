/* ============================================================
   CASPAA APP SHELL
   - Routing, sidebar, topbar, mobile nav
   - Role-based navigation menus
   ============================================================ */

const APP = {
  view: 'dashboard',
  params: {},
  sidebarOpen: false,

  /* ---------- Navigation menus per role ---------- */
  navFor(role) {
    const menus = {
      superadmin: [
        { key: 'sa_dashboard',   label: 'Overview',        icon: 'dashboard' },
        { key: 'sa_schools',     label: 'Schools',         icon: 'building' },
        { key: 'sa_revenue',     label: 'Revenue',         icon: 'fees' },
        { key: 'sa_lending',     label: 'Lending',         icon: 'loan' },
        { key: 'sa_support',     label: 'Support Desk',    icon: 'chat' },
        { key: 'sa_team',        label: 'CASPAA Team',     icon: 'teacher' },
        { key: 'sa_analytics',   label: 'Analytics',       icon: 'reports' },
        { key: 'sa_audit',       label: 'Audit Log',       icon: 'reports' },
        { key: 'sa_settings',    label: 'Platform Settings', icon: 'settings' }
      ],
      schooladmin: [
        { key: 'adm_dashboard',     label: 'Dashboard',         icon: 'dashboard' },
        { key: 'adm_people',        label: 'Students',          icon: 'students' },
        { key: 'adm_workforce',     label: 'Staff & HR',        icon: 'teacher' },
        { key: 'adm_academic',      label: 'Academic',          icon: 'classes' },
        { key: 'adm_finance_hub',   label: 'Finance',           icon: 'fees' },
        { key: 'adm_operations',    label: 'Operations',        icon: 'package' },
        { key: 'adm_comms',         label: 'Communications',    icon: 'chat' },
        { key: 'cal_main',          label: 'Calendar',          icon: 'calendar' },
        { key: 'adm_houses',        label: 'House Points',      icon: 'check' },
        { key: 'adm_transport',     label: 'Transport',         icon: 'package' },
        { key: 'adm_feedback',      label: 'Surveys',           icon: 'check' },
        { key: 'adm_health',        label: 'Sickbay',           icon: 'reports' },
        { key: 'adm_support',       label: 'Help & Support',    icon: 'chat' },
        { key: 'adm_settings',      label: 'School Settings',   icon: 'settings' }
      ],
      principal: [
        { key: 'adm_dashboard',  label: 'Dashboard',      icon: 'dashboard' },
        { key: 'adm_people',     label: 'Students',       icon: 'students' },
        { key: 'adm_workforce',  label: 'Staff & HR',     icon: 'teacher' },
        { key: 'adm_academic',   label: 'Academic',       icon: 'classes' },
        { key: 'adm_operations', label: 'Operations',     icon: 'package' },
        { key: 'adm_comms',      label: 'Communications', icon: 'chat' },
        { key: 'cal_main',       label: 'Calendar',       icon: 'calendar' },
        { key: 'adm_houses',     label: 'House Points',   icon: 'check' },
        { key: 'adm_transport',  label: 'Transport',      icon: 'package' },
        { key: 'adm_feedback',   label: 'Surveys',        icon: 'check' },
        { key: 'adm_health',     label: 'Sickbay',        icon: 'reports' },
        { key: 'adm_support',    label: 'Help & Support', icon: 'chat' }
      ],
      finance: [
        { key: 'fin_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'fin_fees',       label: 'Fee Structure',   icon: 'fees' },
        { key: 'fin_invoices',   label: 'Invoices',        icon: 'results' },
        { key: 'fin_payments',   label: 'Payments',        icon: 'fees' },
        { key: 'fin_recon',      label: 'Reconciliation',  icon: 'check' },
        { key: 'fin_expenses',   label: 'Expenses',        icon: 'trending_down' },
        { key: 'fin_lending',    label: 'Lending',         icon: 'loan' },
        { key: 'fin_reports',    label: 'Financial Reports', icon: 'reports' }
      ],
      teacher: [
        { key: 'tch_dashboard',  label: 'Dashboard',         icon: 'dashboard' },
        { key: 'tch_profile',    label: 'My Profile',        icon: 'teacher' },
        { key: 'tch_classes',    label: 'My Classes',        icon: 'classes' },
        { key: 'tch_attendance', label: 'Attendance',        icon: 'attendance' },
        { key: 'tch_results',    label: 'Enter Results',     icon: 'results' },
        { key: 'tch_assessments', label: 'Assessments',       icon: 'results' },
        { key: 'tch_lessons',    label: 'Lessons & Content', icon: 'book' },
        { key: 'tch_payslip',    label: 'My Payslip',         icon: 'fees' },
        { key: 'cal_main',       label: 'Calendar',           icon: 'calendar' },
        { key: 'tch_timetable',  label: 'My Schedule',        icon: 'calendar' },
        { key: 'tch_houses',     label: 'House Points',        icon: 'check' },
        { key: 'tch_diary',      label: 'Diary',              icon: 'book-open' },
        { key: 'tch_messages',   label: 'Messages',           icon: 'chat' },
        { key: 'tch_appraisal',  label: 'My Appraisal',       icon: 'reports' }
      ],
      parent: [
        { key: 'par_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'par_children',   label: 'My Children',     icon: 'students' },
        { key: 'par_fees',       label: 'Fees & Payment',  icon: 'fees' },
        { key: 'par_timetable',  label: 'Timetable',       icon: 'calendar' },
        { key: 'par_loans',      label: 'Loans',           icon: 'loan' },
        { key: 'par_consent',    label: 'Consent',         icon: 'check' },
        { key: 'par_messages',   label: 'Messages',        icon: 'chat' },
        { key: 'par_announce',   label: 'Announcements',   icon: 'bell' },
        { key: 'cal_main',       label: 'Calendar',        icon: 'calendar' },
        { key: 'par_houses',     label: 'House Points',    icon: 'check' },
        { key: 'par_transport',  label: 'Transport',       icon: 'package' },
        { key: 'par_health',     label: 'Health',          icon: 'reports' },
        { key: 'par_diary',      label: 'Diary',           icon: 'book-open' },
        { key: 'par_feedback',   label: 'Surveys',         icon: 'check' }
      ],
      student: [
        { key: 'stu_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'stu_learning',    label: 'Learning',        icon: 'book' },
        { key: 'stu_assessments', label: 'Assessments',    icon: 'results' },
        { key: 'stu_results',    label: 'My Results',      icon: 'reports' },
        { key: 'stu_behaviour',  label: 'Behaviour',       icon: 'check' },
        { key: 'stu_timetable',  label: 'Timetable',       icon: 'calendar' },
        { key: 'cal_main',       label: 'Calendar',        icon: 'calendar' },
        { key: 'stu_houses',     label: 'House Points',    icon: 'check' }
      ]
    };
    return menus[role] || [];
  },

  /* ---------- Default view per role ---------- */
  defaultView(role) {
    const map = {
      superadmin: 'sa_dashboard',
      schooladmin: 'adm_dashboard',
      principal: 'adm_dashboard',
      finance: 'fin_dashboard',
      teacher: 'tch_dashboard',
      parent: 'par_dashboard',
      student: 'stu_dashboard'
    };
    return map[role] || 'dashboard';
  },

  /* ---------- Route to view ---------- */
  // _skipHistory is set internally by the popstate handler so we don't
  // push another state when we're already responding to a back/forward.
  go(view, params = {}, _skipHistory = false) {
    this.view = view;
    this.params = params;
    this.sidebarOpen = false;
    if (!_skipHistory) {
      try {
        const state = { view, params, ts: Date.now() };
        history.pushState(state, '', '#' + view);
      } catch (e) { /* file:// can throw; ignore */ }
    }
    this.render();
    // Scroll to top
    const main = document.getElementById('mainArea');
    if (main) main.scrollTop = 0;
  },

  /* ---------- Master render ---------- */
  render() {
    if (!AUTH.isLoggedIn()) {
      document.getElementById('app').innerHTML = renderLogin();
      bindLoginHandlers();
      return;
    }

    // Default view if none set
    if (!this.view || !this.viewExists(this.view)) {
      this.view = this.defaultView(AUTH.current.role);
    }

    const user = AUTH.current;
    const nav = this.navFor(user.role);

    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex bg-slate-50">

        <!-- Sidebar (desktop) -->
        <aside class="hidden lg:flex w-64 bg-slate-900 flex-col fixed h-screen">
          <div class="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl font-extrabold text-white">C</div>
            <div>
              <div class="text-white font-extrabold tracking-tight">CASPAA</div>
              <div class="text-xs text-slate-400">${roleLabel(user.role)}</div>
            </div>
          </div>
          <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-area">
            ${nav.map(n => `
              <a class="nav-item ${this.view === n.key ? 'active' : ''}" onclick="APP.go('${n.key}')">
                ${icon(n.icon, 'w-5 h-5')}
                <span>${n.label}</span>
              </a>
            `).join('')}
          </nav>
          <div class="p-3 border-t border-slate-800">
            <a class="nav-item" onclick="AUTH.logout()">
              ${icon('logout', 'w-5 h-5')}
              <span>Sign out</span>
            </a>
          </div>
        </aside>

        <!-- Mobile sidebar drawer -->
        ${this.sidebarOpen ? `
          <div class="lg:hidden fixed inset-0 z-40">
            <div class="absolute inset-0 bg-slate-900/60" onclick="APP.sidebarOpen=false; APP.render()"></div>
            <aside class="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col">
              <div class="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl font-extrabold text-white">C</div>
                <div>
                  <div class="text-white font-extrabold tracking-tight">CASPAA</div>
                  <div class="text-xs text-slate-400">${roleLabel(user.role)}</div>
                </div>
              </div>
              <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-area">
                ${nav.map(n => `
                  <a class="nav-item ${this.view === n.key ? 'active' : ''}" onclick="APP.go('${n.key}')">
                    ${icon(n.icon, 'w-5 h-5')}
                    <span>${n.label}</span>
                  </a>
                `).join('')}
              </nav>
              <div class="p-3 border-t border-slate-800">
                <a class="nav-item" onclick="AUTH.logout()">${icon('logout', 'w-5 h-5')} <span>Sign out</span></a>
              </div>
            </aside>
          </div>
        ` : ''}

        <!-- Main panel -->
        <div class="flex-1 lg:ml-64 flex flex-col min-h-screen">

          ${isImpersonating() ? `
            <div class="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between gap-3 text-sm">
              <div class="flex items-center gap-2 text-amber-900">
                ${icon('user', 'w-4 h-4')}
                <span>You are viewing as <strong>${user.name}</strong> (admin preview)</span>
              </div>
              <button class="btn btn-secondary !py-1 !px-2 text-xs" onclick="endImpersonation()">${icon('arrow_left', 'w-3 h-3')} Return to admin</button>
            </div>
          ` : ''}

          <!-- Topbar -->
          <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div class="flex items-center justify-between px-4 lg:px-6 h-14 gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <button class="lg:hidden btn btn-ghost !p-1.5" onclick="APP.sidebarOpen=true; APP.render()">${icon('menu')}</button>
                <h2 class="font-bold text-slate-900 text-base lg:text-lg truncate">${this.viewTitle()}</h2>
              </div>
              <button class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-500 min-w-[160px] lg:min-w-[260px]" onclick="openGlobalSearch()">
                ${icon('search', 'w-4 h-4')}
                <span class="flex-1 text-left">Search students, staff, classes…</span>
                <kbd class="hidden lg:inline text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono">/</kbd>
              </button>
              <div class="flex items-center gap-2">
                <button class="sm:hidden btn btn-ghost !p-2" onclick="openGlobalSearch()" title="Search">${icon('search', 'w-5 h-5')}</button>
                <button class="btn btn-ghost !p-2 relative" onclick="showNotifications()">
                  ${icon('bell', 'w-5 h-5')}
                  ${COMPUTE.unreadCount(user.id) > 0 ? `<span class="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full"></span>` : ''}
                </button>
                <button class="btn btn-ghost !p-2" onclick="toggleOffline()" title="Toggle offline mode">
                  ${icon(isOffline() ? 'wifi_off' : 'check', 'w-5 h-5')}
                </button>
                <button onclick="showProfile()" class="flex items-center gap-2 hover:bg-slate-100 rounded-xl pl-1 pr-2 py-1 transition">
                  ${avatar(user.name, 'sm')}
                  <div class="hidden sm:block text-left">
                    <div class="text-sm font-semibold text-slate-900 leading-tight">${user.name.split(' ').slice(0,2).join(' ')}</div>
                    <div class="text-xs text-slate-500 leading-tight">${roleLabel(user.role)}</div>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <!-- Main scrollable area -->
          <main id="mainArea" class="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
            <div id="viewRoot" class="fade-in">${this.renderView()}</div>
          </main>

          <!-- Mobile bottom nav (4 items + "More" overflow) -->
          <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-2 pb-safe pt-1 flex z-30">
            ${(nav.length <= 5 ? nav : nav.slice(0, 4)).map(n => `
              <div class="bnav-item ${this.view === n.key ? 'active' : ''}" onclick="APP.go('${n.key}')">
                ${icon(n.icon, 'w-5 h-5')}
                <span>${n.label.split(' ')[0]}</span>
              </div>
            `).join('')}
            ${nav.length > 5 ? `<div class="bnav-item ${nav.slice(4).some(n => n.key === this.view) ? 'active' : ''}" onclick="showMobileMore()">
              ${icon('menu', 'w-5 h-5')}<span>More</span>
            </div>` : ''}
          </nav>

        </div>
      </div>
    `;

    // Bind any post-render handlers from view code
    if (typeof window.afterRender === 'function') {
      try { window.afterRender(); } catch(e){ console.error(e); }
      window.afterRender = null;
    }
  },

  /* ---------- View dispatcher ---------- */
  renderView() {
    try {
      const fn = window['view_' + this.view];
      if (typeof fn === 'function') return fn(this.params);
      return emptyState({ title: 'Coming soon', body: `View "${this.view}" is under construction.`, icon: 'package' });
    } catch (e) {
      console.error('View render error', e);
      return `<div class="card p-6"><h3 class="font-bold text-red-700 mb-2">Something went wrong</h3><pre class="text-xs text-slate-600 overflow-auto">${e.message}\n${e.stack}</pre></div>`;
    }
  },

  viewExists(view) {
    return typeof window['view_' + view] === 'function';
  },

  viewTitle() {
    const nav = this.navFor(AUTH.current.role);
    const item = nav.find(n => n.key === this.view);
    return item ? item.label : 'CASPAA';
  }
};

function roleLabel(role) {
  return {
    superadmin: 'Platform Operator',
    schooladmin: 'School Proprietor',
    principal: 'Principal',
    finance: 'Finance Officer / Bursar',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student'
  }[role] || role;
}

/* ---------- Notifications dropdown ---------- */
function showNotifications() {
  const user = AUTH.current;
  const notifs = DB.query('notifications', n => n.userId === user.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  modal({
    title: 'Notifications',
    body: notifs.length === 0
      ? emptyState({ title: 'All caught up', body: 'No notifications to show.', icon: 'bell' })
      : `<div class="space-y-2">${notifs.map(n => {
          const toneClass = n.type === 'warn' ? 'bg-amber-100 text-amber-700' : n.type === 'danger' ? 'bg-rose-100 text-rose-700' : n.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
          const linkAttr = n.link && n.link.view ? `onclick="openNotification('${n.id}')" style="cursor:pointer"` : '';
          return `<div class="p-3 rounded-xl ${n.read ? 'bg-slate-50' : 'bg-brand-50 border border-brand-100'}" ${linkAttr}>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg ${toneClass} flex items-center justify-center flex-shrink-0">${icon('bell', 'w-4 h-4')}</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm text-slate-900">${n.title}</div>
                <div class="text-sm text-slate-600">${n.body}</div>
                <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>${fdate(n.timestamp, { relative: true })}</span>
                  ${n.link && n.link.view ? `<span class="text-brand-700 font-semibold">→ Open</span>` : ''}
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}</div>`,
    footer: `<button class="btn btn-secondary" onclick="markAllRead()">Mark all read</button>`
  });
}

function openNotification(notifId) {
  const n = DB.find('notifications', notifId);
  if (!n) return;
  // Mark read
  DB.update('notifications', notifId, { read: true });
  // Close notifications modal
  document.getElementById('modalBackdrop')?.click();
  // Navigate if there's a deep link
  if (n.link && n.link.view) {
    APP.go(n.link.view, n.link.params || {});
  }
}

function markAllRead() {
  const user = AUTH.current;
  DB.get('notifications').filter(n => n.userId === user.id && !n.read).forEach(n => DB.update('notifications', n.id, { read: true }));
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('All notifications marked read');
}

/* ---------- Profile menu ---------- */
function showProfile() {
  const u = AUTH.current;
  const otherRoles = (typeof DEMO_ACCOUNTS !== 'undefined' ? DEMO_ACCOUNTS : []).filter(a => a.id !== u.id);
  modal({
    title: 'Account',
    body: `
      <div class="text-center py-4">
        ${avatar(u.name, 'xl')}
        <h3 class="font-bold text-lg text-slate-900 mt-3">${u.name}</h3>
        <p class="text-sm text-slate-500">${u.email || 'No email'}</p>
        <span class="badge badge-info mt-2">${roleLabel(u.role)}</span>
      </div>

      ${otherRoles.length ? `<div class="mt-2 pt-3 border-t border-slate-100">
        <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Switch role <span class="font-normal lowercase">(for demo)</span></div>
        <div class="space-y-1.5">
          ${otherRoles.map(a => `<button class="w-full flex items-center gap-3 p-2.5 rounded-xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50 transition text-left" onclick="quickSwitchRole('${a.id}')">
            ${avatar(a.name, 'sm')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm text-slate-900 truncate">${a.title}</div>
              <div class="text-xs text-slate-500 truncate">${a.subtitle}</div>
            </div>
            <span class="text-brand-600">${icon('arrow_left', 'w-4 h-4 rotate-180')}</span>
          </button>`).join('')}
        </div>
      </div>` : ''}

      <div class="space-y-2 mt-3 pt-3 border-t border-slate-100">
        <button class="btn btn-secondary w-full justify-start" onclick="showLoginSessions()">${icon('user','w-4 h-4')} Active sessions &amp; security</button>
        <button class="btn btn-secondary w-full justify-start" onclick="resetDemo()">${icon('settings', 'w-4 h-4')} Reset demo data</button>
        <button class="btn btn-danger w-full justify-start" onclick="document.getElementById('modalBackdrop').click(); AUTH.logout()">${icon('logout', 'w-4 h-4')} Sign out</button>
      </div>
    `
  });
}

function showLoginSessions() {
  const u = AUTH.current;
  const all = DB.get('loginSessions').filter(s => s.userId === u.id);
  const current = all.filter(s => s.current);
  const other = all.filter(s => !s.current);

  const renderSession = (s, isCurrent) => `
    <div class="flex items-start gap-3 p-3 ${isCurrent ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'} rounded-xl">
      <div class="w-10 h-10 rounded-lg ${isCurrent ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600'} flex items-center justify-center flex-shrink-0">${icon('user','w-5 h-5')}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm">${s.device}${isCurrent ? ' <span class="badge badge-success ml-1">This device</span>' : ''}</div>
        <div class="text-xs text-slate-500 mt-0.5">${s.location} · IP ${s.ip}</div>
        <div class="text-xs text-slate-400 mt-1">Signed in ${fdate(s.loggedInAt, { relative: true })} ${s.twoFA ? '· <span class="text-emerald-700">2FA verified</span>' : '· <span class="text-amber-700">No 2FA</span>'}</div>
      </div>
      ${!isCurrent ? `<button class="btn btn-ghost !p-1.5 text-rose-600" title="Revoke this session" onclick="revokeSession('${s.id}')">${icon('x','w-4 h-4')}</button>` : ''}
    </div>
  `;

  document.getElementById('modalBackdrop')?.click();
  setTimeout(() => modal({
    title: 'Active Sessions & Security',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-3 bg-brand-50 rounded-xl">
            <div class="text-xs text-brand-700 font-semibold uppercase">Active sessions</div>
            <div class="text-2xl font-bold text-brand-900">${current.length}</div>
          </div>
          <div class="p-3 bg-blue-50 rounded-xl">
            <div class="text-xs text-blue-700 font-semibold uppercase">Devices</div>
            <div class="text-2xl font-bold text-blue-900">${[...new Set(all.map(s => s.device))].length}</div>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl">
            <div class="text-xs text-emerald-700 font-semibold uppercase">2FA-verified</div>
            <div class="text-2xl font-bold text-emerald-900">${all.filter(s => s.twoFA).length}/${all.length}</div>
          </div>
        </div>

        <div>
          <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Current Session</h4>
          ${current.map(s => renderSession(s, true)).join('')}
        </div>
        ${other.length ? `<div>
          <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Other Recent Sessions</h4>
          <div class="space-y-2">
            ${other.map(s => renderSession(s, false)).join('')}
          </div>
        </div>` : ''}
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          <strong>Recognize all of these?</strong> If anything looks unfamiliar, revoke the session and change your password immediately.
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      ${other.length ? `<button class="btn btn-danger" onclick="revokeAllOtherSessions()">${icon('logout','w-4 h-4')} Sign out everywhere else</button>` : ''}
    `
  }), 50);
}

function revokeSession(sessionId) {
  DB.remove('loginSessions', sessionId);
  toast('Session revoked');
  showLoginSessions();
}

function revokeAllOtherSessions() {
  const u = AUTH.current;
  DB.get('loginSessions').filter(s => s.userId === u.id && !s.current).forEach(s => DB.remove('loginSessions', s.id));
  toast('All other sessions revoked', 'success');
  showLoginSessions();
}

function quickSwitchRole(accountId) {
  const acc = DEMO_ACCOUNTS.find(a => a.id === accountId);
  if (!acc) return;
  // Close any open modal
  const root = document.getElementById('modalBackdrop'); if (root) root.click();
  // Clear any impersonation context — this is a direct role switch
  sessionStorage.removeItem('caspaa_impersonator');
  AUTH.login(acc);
  APP.view = APP.defaultView(acc.role);
  APP.render();
  toast(`Now viewing as ${acc.name.split(' ').slice(-1)} (${roleLabel(acc.role)})`, 'success');
}

function resetDemo() {
  confirm('This will erase all changes you made and restore the demo to its original seeded state. Continue?', () => {
    DB.reset();
    AUTH.logout();
    toast('Demo data has been reset', 'success');
  }, { yesLabel: 'Reset Demo', danger: true });
}

/* ---------- Impersonation ("View as Parent" from admin) ---------- */
function viewAsParent(parentId) {
  const parent = DB.find('parents', parentId);
  if (!parent) { toast('Parent not found', 'danger'); return; }
  // Save current identity so we can come back
  sessionStorage.setItem('caspaa_impersonator', JSON.stringify(AUTH.current));
  AUTH.login({
    id: parent.id,
    role: 'parent',
    name: parent.name,
    email: parent.email,
    schoolId: parent.schoolId
  });
  APP.view = 'par_dashboard';
  APP.render();
  toast(`Now viewing as ${parent.name}`, 'info');
}

function endImpersonation() {
  const raw = sessionStorage.getItem('caspaa_impersonator');
  if (!raw) { AUTH.logout(); return; }
  const original = JSON.parse(raw);
  sessionStorage.removeItem('caspaa_impersonator');
  AUTH.login(original);
  APP.view = APP.defaultView(original.role);
  APP.render();
  toast('Returned to admin view', 'success');
}

function isImpersonating() {
  return !!sessionStorage.getItem('caspaa_impersonator');
}

/* ---------- Global Search ---------- */
function openGlobalSearch() {
  modal({
    title: 'Search',
    size: 'lg',
    body: `
      <div class="relative">
        <span class="absolute left-3 top-3 text-slate-400">${icon('search','w-5 h-5')}</span>
        <input id="globalSearchInput" class="input pl-11 text-base" placeholder="Search students, staff, classes, invoices, loans…" autocomplete="off" />
      </div>
      <div id="globalSearchResults" class="mt-3 max-h-96 overflow-y-auto"></div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
  setTimeout(() => {
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.focus();
      input.addEventListener('input', runGlobalSearch);
      runGlobalSearch();
    }
  }, 50);
}

function runGlobalSearch() {
  const q = (document.getElementById('globalSearchInput').value || '').trim().toLowerCase();
  const out = document.getElementById('globalSearchResults');
  if (!out) return;
  if (q.length < 1) { out.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Start typing to search across the platform.</p>'; return; }

  const matches = (text) => (text || '').toLowerCase().includes(q);
  const sections = [];

  // Students
  const students = DB.get('students').filter(s => matches(s.name) || matches(s.admissionNo)).slice(0, 8);
  if (students.length) sections.push({
    label: 'Students',
    items: students.map(s => {
      const cls = DB.find('classes', s.classId);
      return { icon: 'students', title: s.name, meta: `${cls ? cls.name : '—'} · ${s.admissionNo}`, action: () => { document.getElementById('modalBackdrop').click(); viewStudent(s.id); } };
    })
  });
  // Staff
  const staff = DB.get('teachers').filter(t => matches(t.name) || matches(t.email)).slice(0, 5);
  if (staff.length) sections.push({
    label: 'Staff',
    items: staff.map(t => ({ icon: 'teacher', title: t.name, meta: `${t.staffType || 'Academic'} · ${t.role || t.email}`, action: () => { document.getElementById('modalBackdrop').click(); viewStaff(t.id); } }))
  });
  // Classes
  const classes = DB.get('classes').filter(c => matches(c.name)).slice(0, 5);
  if (classes.length) sections.push({
    label: 'Classes',
    items: classes.map(c => ({ icon: 'classes', title: c.name, meta: `${c.level} · ${COMPUTE.studentsByClass(c.id).length} students`, action: () => { document.getElementById('modalBackdrop').click(); APP.go('adm_people', { peopleTab: 'students', classFilter: c.id }); } }))
  });
  // Parents
  const parents = DB.get('parents').filter(p => matches(p.name) || matches(p.phone) || matches(p.email)).slice(0, 5);
  if (parents.length) sections.push({
    label: 'Parents',
    items: parents.map(p => ({ icon: 'user', title: p.name, meta: `${p.phone} · ${p.email || ''}`, action: () => { document.getElementById('modalBackdrop').click(); viewAsParent(p.id); } }))
  });
  // Schools (super admin only)
  if (AUTH.current.role === 'superadmin') {
    const schools = DB.get('schools').filter(s => matches(s.name) || matches(s.proprietor)).slice(0, 5);
    if (schools.length) sections.push({
      label: 'Schools',
      items: schools.map(s => ({ icon: 'building', title: s.name, meta: `${s.proprietor} · ${s.subscriptionPlan}`, action: () => { document.getElementById('modalBackdrop').click(); viewSchoolDetail(s.id); } }))
    });
  }
  // Navigation jump
  const nav = APP.navFor(AUTH.current.role);
  const navMatches = nav.filter(n => matches(n.label)).slice(0, 5);
  if (navMatches.length) sections.push({
    label: 'Pages',
    items: navMatches.map(n => ({ icon: n.icon, title: n.label, meta: 'Go to ' + n.label, action: () => { document.getElementById('modalBackdrop').click(); APP.go(n.key); } }))
  });

  if (sections.length === 0) {
    out.innerHTML = `<p class="text-sm text-slate-500 text-center py-8">No matches for "<strong>${q}</strong>".</p>`;
    return;
  }

  out.innerHTML = sections.map((sec, secIdx) => `
    <div class="${secIdx > 0 ? 'mt-4' : ''}">
      <div class="text-xs font-semibold uppercase text-slate-500 mb-1.5 px-1">${sec.label}</div>
      <div class="space-y-1">
        ${sec.items.map((it, i) => `<button class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-50 text-left transition" data-sec="${secIdx}" data-idx="${i}">
          <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">${icon(it.icon, 'w-4 h-4')}</div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${it.title}</div>
            <div class="text-xs text-slate-500 truncate">${it.meta}</div>
          </div>
          <span class="text-slate-300">${icon('arrow_left', 'w-4 h-4 rotate-180')}</span>
        </button>`).join('')}
      </div>
    </div>
  `).join('');

  // Wire actions
  out.querySelectorAll('button[data-sec]').forEach(btn => {
    const sec = parseInt(btn.dataset.sec);
    const idx = parseInt(btn.dataset.idx);
    btn.addEventListener('click', () => sections[sec].items[idx].action());
  });
}

// Keyboard shortcut: "/" opens search
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && AUTH.isLoggedIn() && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    openGlobalSearch();
  }
});

/* ---------- Mobile "More" overflow sheet ---------- */
function showMobileMore() {
  const nav = APP.navFor(AUTH.current.role);
  const overflow = nav.slice(4);
  modal({
    title: 'All sections',
    body: `
      <div class="grid grid-cols-3 gap-3">
        ${overflow.map(n => `<button class="flex flex-col items-center gap-2 p-3 rounded-xl ${APP.view === n.key ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-700'} hover:bg-brand-100" onclick="document.getElementById('modalBackdrop').click(); APP.go('${n.key}')">
          ${icon(n.icon, 'w-6 h-6')}
          <span class="text-xs font-semibold text-center">${n.label}</span>
        </button>`).join('')}
      </div>
    `
  });
}

function toggleOffline() {
  const newState = !isOffline();
  setOffline(newState);
  if (newState) toast('Offline mode ON — changes will sync when you come back online', 'warn');
  else toast('Back online', 'success');
}

/* ---------- Browser back/forward support ---------- */
window.addEventListener('popstate', (e) => {
  // If a modal is open, the user probably means "close the modal"
  const modalRoot = document.getElementById('modalRoot');
  if (modalRoot && modalRoot.innerHTML.trim()) {
    modalRoot.innerHTML = '';
    return;
  }
  if (!AUTH.isLoggedIn()) { APP.render(); return; }
  if (e.state && e.state.view) {
    APP.go(e.state.view, e.state.params || {}, true);
  } else {
    APP.go(APP.defaultView(AUTH.current.role), {}, true);
  }
});

/* ---------- Boot ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // Seed history with current view so back works on first navigation
  if (AUTH.isLoggedIn()) {
    const v = APP.defaultView(AUTH.current.role);
    try { history.replaceState({ view: v, params: {}, ts: Date.now() }, '', '#' + v); } catch (e) {}
    APP.view = v;
  }
  APP.render();
});
