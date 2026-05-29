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
        { key: 'sa_lending',     label: 'Lending Book',    icon: 'loan' },
        { key: 'sa_analytics',   label: 'Analytics',       icon: 'reports' },
        { key: 'sa_audit',       label: 'Audit Log',       icon: 'reports' },
        { key: 'sa_settings',    label: 'Platform Settings', icon: 'settings' }
      ],
      schooladmin: [
        { key: 'adm_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'adm_students',   label: 'Students',        icon: 'students' },
        { key: 'adm_staff',      label: 'Staff',           icon: 'teacher' },
        { key: 'adm_classes',    label: 'Classes',         icon: 'classes' },
        { key: 'adm_timetable',  label: 'Timetable',       icon: 'calendar' },
        { key: 'adm_attendance', label: 'Attendance',      icon: 'attendance' },
        { key: 'adm_results',    label: 'Results',         icon: 'results' },
        { key: 'adm_fees',       label: 'Fees & Billing',  icon: 'fees' },
        { key: 'adm_discipline', label: 'Discipline',      icon: 'check' },
        { key: 'adm_inventory',  label: 'Inventory',       icon: 'package' },
        { key: 'adm_messages',   label: 'Messages',        icon: 'chat' },
        { key: 'adm_announce',   label: 'Announcements',   icon: 'bell' },
        { key: 'adm_reports',    label: 'Reports',         icon: 'reports' }
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
        { key: 'tch_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'tch_classes',    label: 'My Classes',      icon: 'classes' },
        { key: 'tch_attendance', label: 'Attendance',      icon: 'attendance' },
        { key: 'tch_results',    label: 'Enter Results',   icon: 'results' },
        { key: 'tch_assignments',label: 'Assignments',     icon: 'book' },
        { key: 'tch_lessons',    label: 'Lesson Plans',    icon: 'book' },
        { key: 'tch_timetable',  label: 'My Timetable',    icon: 'calendar' },
        { key: 'tch_messages',   label: 'Messages',        icon: 'chat' }
      ],
      parent: [
        { key: 'par_dashboard',  label: 'Dashboard',       icon: 'dashboard' },
        { key: 'par_children',   label: 'My Children',     icon: 'students' },
        { key: 'par_fees',       label: 'Fees & Payment',  icon: 'fees' },
        { key: 'par_loans',      label: 'Loans',           icon: 'loan' },
        { key: 'par_messages',   label: 'Messages',        icon: 'chat' },
        { key: 'par_announce',   label: 'Announcements',   icon: 'bell' }
      ]
    };
    return menus[role] || [];
  },

  /* ---------- Default view per role ---------- */
  defaultView(role) {
    const map = {
      superadmin: 'sa_dashboard',
      schooladmin: 'adm_dashboard',
      finance: 'fin_dashboard',
      teacher: 'tch_dashboard',
      parent: 'par_dashboard'
    };
    return map[role] || 'dashboard';
  },

  /* ---------- Route to view ---------- */
  go(view, params = {}) {
    this.view = view;
    this.params = params;
    this.sidebarOpen = false;
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
            <div class="flex items-center justify-between px-4 lg:px-6 h-14">
              <div class="flex items-center gap-3">
                <button class="lg:hidden btn btn-ghost !p-1.5" onclick="APP.sidebarOpen=true; APP.render()">${icon('menu')}</button>
                <h2 class="font-bold text-slate-900 text-base lg:text-lg">${this.viewTitle()}</h2>
              </div>
              <div class="flex items-center gap-2">
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

          <!-- Mobile bottom nav -->
          <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-2 pb-safe pt-1 flex z-30">
            ${nav.slice(0, 5).map(n => `
              <div class="bnav-item ${this.view === n.key ? 'active' : ''}" onclick="APP.go('${n.key}')">
                ${icon(n.icon, 'w-5 h-5')}
                <span>${n.label.split(' ')[0]}</span>
              </div>
            `).join('')}
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
    schooladmin: 'School Admin',
    finance: 'Finance Officer',
    teacher: 'Teacher',
    parent: 'Parent'
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
      : `<div class="space-y-2">${notifs.map(n => `
          <div class="p-3 rounded-xl ${n.read ? 'bg-slate-50' : 'bg-brand-50 border border-brand-100'}">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg ${n.type === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center flex-shrink-0">${icon('bell', 'w-4 h-4')}</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm text-slate-900">${n.title}</div>
                <div class="text-sm text-slate-600">${n.body}</div>
                <div class="text-xs text-slate-400 mt-1">${fdate(n.timestamp, { relative: true })}</div>
              </div>
            </div>
          </div>
        `).join('')}</div>`,
    footer: `<button class="btn btn-secondary" onclick="markAllRead()">Mark all read</button>`
  });
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
  modal({
    title: 'Account',
    body: `
      <div class="text-center py-4">
        ${avatar(u.name, 'xl')}
        <h3 class="font-bold text-lg text-slate-900 mt-3">${u.name}</h3>
        <p class="text-sm text-slate-500">${u.email || 'No email'}</p>
        <span class="badge badge-info mt-2">${roleLabel(u.role)}</span>
      </div>
      <div class="space-y-2 mt-2">
        <button class="btn btn-secondary w-full justify-start" onclick="resetDemo()">${icon('settings', 'w-4 h-4')} Reset demo data</button>
        <button class="btn btn-danger w-full justify-start" onclick="document.getElementById('modalBackdrop').click(); AUTH.logout()">${icon('logout', 'w-4 h-4')} Sign out</button>
      </div>
    `
  });
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

function toggleOffline() {
  const newState = !isOffline();
  setOffline(newState);
  if (newState) toast('Offline mode ON — changes will sync when you come back online', 'warn');
  else toast('Back online', 'success');
}

/* ---------- Boot ---------- */
window.addEventListener('DOMContentLoaded', () => {
  APP.render();
});
