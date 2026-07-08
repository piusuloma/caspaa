/* ============================================================
   CASPAA UI HELPERS
   - Toasts, Modals, Icons, Form factories
   - Designed for clarity: every function returns an HTML string
     or accepts an element ID to render into.
   ============================================================ */

/* ---------- Icon Library (inline SVG) ---------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  students: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>',
  classes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  results: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  fees: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M18 11h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z"/><circle cx="10" cy="12" r="2"/></svg>',
  naira: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="7" y1="3" x2="17" y2="21"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  loan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  arrow_left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="10" y1="22" x2="10" y2="18"/><line x1="14" y1="22" x2="14" y2="18"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  trending_up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  trending_down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6m8-6v6M3 10h18M5 17h2m10 0h2M5 21V8c0-2 2-4 5-4h4c3 0 5 2 5 4v13"/></svg>',
  wifi_off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>'
};

function icon(name, className = 'w-5 h-5') {
  const svg = ICONS[name] || ICONS.dashboard;
  return `<span class="${className} inline-flex">${svg}</span>`;
}

/* ---------- Toast ---------- */
function toast(msg, type = 'success') {
  const root = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const iconMap = { success: 'check', danger: 'x', warn: 'bell', info: 'bell' };
  const colorMap = { success: 'text-green-600', danger: 'text-red-600', warn: 'text-amber-600', info: 'text-blue-600' };
  t.innerHTML = `
    <div class="${colorMap[type] || 'text-green-600'}">${icon(iconMap[type] || 'check', 'w-5 h-5')}</div>
    <div class="flex-1 text-sm font-medium text-slate-800">${msg}</div>
  `;
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.25s'; setTimeout(() => t.remove(), 250); }, 3000);
}

/* ---------- Modal ---------- */
function modal({ title, body, footer, size = '', onClose }) {
  const root = document.getElementById('modalRoot');
  const close = () => { root.innerHTML = ''; if (onClose) onClose(); };
  root.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal-panel ${size}" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 class="font-bold text-lg text-slate-900">${title}</h3>
          <button class="btn btn-ghost !p-1.5" id="modalClose">${icon('x', 'w-5 h-5')}</button>
        </div>
        <div class="px-5 py-4 overflow-y-auto scroll-area flex-1">${body}</div>
        ${footer ? `<div class="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">${footer}</div>` : ''}
      </div>
    </div>
  `;
  document.getElementById('modalBackdrop').addEventListener('click', close);
  document.getElementById('modalClose').addEventListener('click', close);
  return { close };
}

function confirm(msg, onYes, { yesLabel = 'Confirm', danger = false } = {}) {
  modal({
    title: 'Please confirm',
    body: `<p class="text-slate-700">${msg}</p>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmYes">${yesLabel}</button>
    `
  });
  document.getElementById('confirmYes').onclick = () => {
    document.getElementById('modalBackdrop').click();
    onYes();
  };
}

/* ---------- Money formatter ---------- */
function money(n) { return '₦' + Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 }); }

/* ---------- Date formatter ---------- */
function fdate(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (opts.long) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (opts.time) return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (opts.short) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  if (opts.relative) {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-GB');
  }
  return d.toLocaleDateString('en-GB');
}

/* ---------- Initials ---------- */
function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function avatar(nameOrObj, size = 'md') {
  // Accept either a name string or an object with { name, photo }
  let name, photo;
  if (typeof nameOrObj === 'object' && nameOrObj) { name = nameOrObj.name; photo = nameOrObj.photo; }
  else { name = nameOrObj; }
  if (photo) {
    return `<span class="avatar ${size}" style="background:none;overflow:hidden;padding:0"><img src="${photo}" alt="${name||''}" style="width:100%;height:100%;object-fit:cover" /></span>`;
  }
  return `<span class="avatar ${size}">${initials(name)}</span>`;
}

/* ---------- Empty State ---------- */
function emptyState({ icon: iconName = 'package', title, body, action }) {
  return `
    <div class="empty-state">
      ${icon(iconName, 'w-16 h-16 mx-auto mb-4 opacity-50')}
      <h3 class="text-base font-semibold text-slate-700 mb-1">${title}</h3>
      <p class="text-sm mb-4">${body || ''}</p>
      ${action || ''}
    </div>
  `;
}

/* ---------- Page header ---------- */
// When _suppressHeader is true (set by hub views around sub-view calls),
// only the action buttons are rendered (floated right). The title is owned by the hub.
function pageHeader({ title, subtitle, actions }) {
  if (window._suppressHeader) {
    if (!actions) return '';
    return `<div class="flex justify-end gap-2 flex-wrap mb-4">${actions}</div>`;
  }
  return `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h1 class="page-title">${title}</h1>
        ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="flex gap-2 flex-wrap">${actions}</div>` : ''}
    </div>
  `;
}

// Helper for hub views to render a sub-view without its own page title
function renderSubView(viewFnName) {
  window._suppressHeader = true;
  let html = '';
  try { html = window[viewFnName] ? window[viewFnName]() : ''; }
  catch (e) { html = `<div class="card p-4 text-rose-700">Sub-view error: ${e.message}</div>`; console.error(e); }
  window._suppressHeader = false;
  return html;
}

/* ---------- Stat Card ---------- */
function statCard({ label, value, trend, icon: iconName, color = 'brand', tooltip }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
    purple: 'bg-purple-50 text-purple-700'
  };
  const tooltipId = tooltip ? 'tip_' + Math.random().toString(36).slice(2, 8) : null;
  if (tooltipId) {
    // Defer the click handler binding
    setTimeout(() => {
      const el = document.getElementById(tooltipId);
      if (el) el.onclick = (e) => { e.stopPropagation(); toast(tooltip, 'info'); };
    }, 0);
  }
  return `
    <div class="stat">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 stat-label">
            ${label}
            ${tooltipId ? `<button id="${tooltipId}" class="text-slate-400 hover:text-slate-600" title="How is this calculated?">${icon('info','w-3 h-3')}</button>` : ''}
          </div>
          <div class="stat-value">${value}</div>
          ${trend ? `<div class="stat-trend ${trend.direction === 'up' ? 'up' : 'down'}">
            ${icon(trend.direction === 'up' ? 'trending_up' : 'trending_down', 'w-3 h-3')}
            <span>${trend.label}</span>
          </div>` : ''}
        </div>
        ${iconName ? `<div class="w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]} flex-shrink-0">${icon(iconName, 'w-5 h-5')}</div>` : ''}
      </div>
    </div>
  `;
}

/* ---------- Tab system ---------- */
function tabs(tabList, activeKey, onChange) {
  const id = 'tabs_' + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    document.querySelectorAll(`#${id} .tab`).forEach(el => {
      el.onclick = () => onChange(el.dataset.key);
    });
  }, 0);
  return `
    <div id="${id}" class="tabs">
      ${tabList.map(t => { const bv = typeof t.badge === 'function' ? t.badge() : t.badge; return `<div class="tab ${t.key === activeKey ? 'active' : ''}" data-key="${t.key}">${t.label}${bv ? `<span class="ml-2 badge badge-danger">${bv}</span>` : ''}</div>`; }).join('')}
    </div>
  `;
}

/* ---------- Badge for status ---------- */
function statusBadge(status) {
  const map = {
    paid: { cls: 'badge-success', label: 'Paid' },
    partial: { cls: 'badge-warn', label: 'Partial' },
    outstanding: { cls: 'badge-danger', label: 'Outstanding' },
    pending: { cls: 'badge-warn', label: 'Pending' },
    approved: { cls: 'badge-success', label: 'Approved' },
    rejected: { cls: 'badge-danger', label: 'Rejected' },
    active: { cls: 'badge-success', label: 'Active' },
    trial: { cls: 'badge-info', label: 'Trial' },
    suspended: { cls: 'badge-danger', label: 'Suspended' },
    successful: { cls: 'badge-success', label: 'Successful' },
    failed: { cls: 'badge-danger', label: 'Failed' },
    present: { cls: 'badge-success', label: 'Present' },
    absent: { cls: 'badge-danger', label: 'Absent' },
    late: { cls: 'badge-warn', label: 'Late' },
    reviewing: { cls: 'badge-info', label: 'Reviewing' },
    accepted: { cls: 'badge-success', label: 'Accepted' },
    transferred: { cls: 'badge-neutral', label: 'Transferred' },
    withdrawn: { cls: 'badge-neutral', label: 'Withdrawn' },
    alumni: { cls: 'badge-info', label: 'Alumni' },
    visit_scheduled: { cls: 'badge-info', label: 'Visit Scheduled' },
    visit_confirmed: { cls: 'badge-success', label: 'Visit Confirmed' }
  };
  const m = map[status] || { cls: 'badge-neutral', label: status };
  return `<span class="badge ${m.cls}">${m.label}</span>`;
}

/* ---------- Print helper ---------- */
function printElement(html) {
  const w = window.open('', '_blank', 'width=800,height=900');
  w.document.write(`
    <!DOCTYPE html><html><head><title>Print</title>
    <script src="https://cdn.tailwindcss.com"></` + `script>
    <style>body{font-family:system-ui;padding:32px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-size:13px} thead th{background:#f8fafc;font-weight:700;color:#374151} tr:nth-child(even){background:#f8fafc} tfoot td{font-weight:700;background:#f1f5f9} @media print{button{display:none}}</style>
    </head><body>${html}<script>setTimeout(()=>window.print(),500);</` + `script></body></html>
  `);
}

/* ---------- CSV download helper ---------- */
function downloadCSV(filename, headers, rows) {
  const esc = v => { const s = String(v ?? ''); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename; a.click();
}

/* ---------- Network/offline simulation ---------- */
let _offline = false;
function setOffline(state) {
  _offline = state;
  const el = document.getElementById('connStatus');
  if (!el) return;
  if (state) {
    el.classList.remove('hidden');
    el.querySelector('div').className = 'px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 bg-amber-100 text-amber-800';
    el.querySelector('span.w-2').className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
    el.querySelector('.text-label').textContent = 'Offline — changes saved locally';
  } else {
    const pending = DB.settings().pendingSync;
    if (pending > 0) {
      el.classList.remove('hidden');
      el.querySelector('div').className = 'px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 bg-blue-100 text-blue-800';
      el.querySelector('span.w-2').className = 'w-2 h-2 rounded-full bg-blue-500 animate-pulse';
      el.querySelector('.text-label').textContent = `Syncing ${pending} item${pending > 1 ? 's' : ''}…`;
      setTimeout(() => {
        DB.settings({ pendingSync: 0 });
        el.classList.add('hidden');
        toast('All offline changes synced', 'success');
      }, 1800);
    } else {
      el.classList.add('hidden');
    }
  }
}
function isOffline() { return _offline; }
function queueOfflineAction() {
  const s = DB.settings();
  DB.settings({ pendingSync: (s.pendingSync || 0) + 1 });
}
