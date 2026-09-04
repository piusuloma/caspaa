/* ============================================================================
   Feature entitlements — plan-based defaults + per-school overrides.
   ----------------------------------------------------------------------------
   Industry-standard SaaS gating:
     • A subscription PLAN sets which features are included by default.
     • The platform operator (superadmin) can OVERRIDE per school to grant an
       add-on (custom feature beyond the plan) or remove one. Overrides live in
       school.features (already toggled from the superadmin Features tab).
     • hasFeature() resolves the effective entitlement; nav items and views for
       features a school isn't entitled to are hidden/locked with an upgrade CTA.
   ============================================================================ */

const PLAN_ORDER = ['Essential', 'Professional', 'Enterprise'];
function planRank(plan) { const i = PLAN_ORDER.indexOf(plan); return i < 0 ? 0 : i + 1; }

// Single source of truth for what each feature is, when it's included, and which
// nav/view keys it gates. Features with no navKeys are entitlements only (recorded
// + superadmin-toggizable) and not yet nav-enforced.
const FEATURE_CATALOG = [
  { key: 'multibranch', label: 'Multiple Branches',      minPlan: 'Enterprise',    defaultOff: true,  navKeys: ['grp_overview', 'grp_branches'], desc: 'Run multiple campuses under one group with consolidated reporting and a branch switcher.' },
  { key: 'lending',     label: 'Fee Financing & Loans',  minPlan: 'Professional',                     navKeys: ['par_loans', 'fin_lending'],     desc: 'Let parents apply for fee loans / financing.' },
  { key: 'transport',   label: 'Transport & Buses',      minPlan: 'Professional',  defaultOff: true,  navKeys: ['adm_transport', 'par_transport'], desc: 'Bus routes, pickups and transport tracking.' },
  { key: 'payroll',     label: 'Payroll',                minPlan: 'Professional',                     navKeys: [],                               desc: 'Staff salary runs and payslips.' },
  { key: 'ai',          label: 'AI Assistant',           minPlan: 'Enterprise',                       navKeys: [],                               desc: 'AI-assisted report comments and insights.' },
  { key: 'whatsapp',    label: 'WhatsApp Notifications', minPlan: 'Essential',                        navKeys: [],                               desc: 'Send alerts to parents via WhatsApp.' }
];

function featureByKey(key) { return FEATURE_CATALOG.find(f => f.key === key) || null; }
function featureForNav(navKey) { const f = FEATURE_CATALOG.find(x => (x.navKeys || []).includes(navKey)); return f ? f.key : null; }

// Effective entitlement: an explicit per-school override wins; otherwise the plan default.
function hasFeature(key, schoolId) {
  const f = featureByKey(key);
  if (!f) return true;                                   // unknown key => not gated
  const sid = schoolId || (typeof currentSchoolId === 'function' ? currentSchoolId() : null);
  const school = sid ? DB.find('schools', sid) : null;
  if (school && school.features && typeof school.features[key] === 'boolean') return school.features[key];
  if (f.defaultOff) return false;                        // opt-in / add-on features start off
  return school ? planRank(school.subscriptionPlan) >= planRank(f.minPlan) : false;
}

// Screen shown in place of a gated view (or a locked nav item routed to directly).
function lockedFeatureView(key) {
  const f = featureByKey(key) || { label: 'This feature', desc: '', minPlan: '' };
  const sid = typeof currentSchoolId === 'function' ? currentSchoolId() : null;
  const school = (sid ? DB.find('schools', sid) : null) || {};
  return `
    <div class="max-w-md mx-auto text-center py-12">
      <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4"><span class="text-3xl">🔒</span></div>
      <h2 class="text-xl font-bold text-slate-900">${f.label} isn't on your plan</h2>
      <p class="text-slate-500 mt-2">${f.desc} Your school is on the <strong>${school.subscriptionPlan || '—'}</strong> plan${f.minPlan ? `; ${f.label} is included from <strong>${f.minPlan}</strong>, or can be added on request` : ''}.</p>
      <div class="flex gap-2 justify-center mt-6">
        <button class="btn btn-primary" onclick="requestFeatureUpgrade('${key}')">${icon('bell', 'w-4 h-4')} Request this feature</button>
      </div>
    </div>`;
}

// Self-serve request: files a ticket to the platform operator (appears in Support Desk).
function requestFeatureUpgrade(key) {
  const f = featureByKey(key) || { label: key };
  const sid = typeof currentSchoolId === 'function' ? currentSchoolId() : null;
  const school = (sid ? DB.find('schools', sid) : null) || {};
  DB.insert('supportTickets', {
    id: uid('tick'), schoolId: sid, subject: `Feature request: ${f.label}`,
    message: `${school.name || 'A school'} (${school.subscriptionPlan || '—'} plan) requested "${f.label}".`,
    category: 'upgrade', status: 'open', priority: 'normal', from: AUTH.current ? AUTH.current.id : sid, createdAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: 'platform', actor: AUTH.current ? AUTH.current.id : sid, action: 'feature_requested', target: `${school.name || sid} · ${f.label}`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast(`Request sent to CASPAA for "${f.label}". Our team will be in touch.`, 'success');
}
