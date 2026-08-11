/* ============================================================================
   SUBSCRIPTION BILLING — the school's own view of what it pays CASPAA.
   ----------------------------------------------------------------------------
   Renders as the "Billing & Plan" tab under School Settings. Until now the
   subscription lived entirely in the superadmin console: a school could see
   "Renews in 6 days" on its dashboard but had no way to see what it owed,
   pay it, or move tiers without emailing someone.

   Split of responsibility, matching how SaaS billing normally works:
     • UPGRADE  — self-serve and immediate. The school pays the pro-rata
                  difference for the remainder of the current period and the
                  new tier applies the moment the payment clears.
     • DOWNGRADE— scheduled, never immediate. Dropping a tier can strip
                  features a school is mid-term dependent on, so it takes
                  effect at the next renewal and files a ticket so ops can
                  sanity-check it first. Reversible until it fires.
     • RENEWAL  — the pending schoolInvoices row CASPAA generates monthly is
                  now payable from here instead of only bank transfer +
                  operator marking it paid by hand.

   Invoices written here are the same `schoolInvoices` rows the superadmin
   Revenue console reads, so both sides stay in sync with no extra plumbing.
   ============================================================================ */

const PLAN_PRICING = { Essential: 45000, Professional: 95000, Enterprise: 250000 };
const PLAN_TIERS = ['Essential', 'Professional', 'Enterprise'];

const PLAN_BLURB = {
  Essential:    'Everything a single school needs to run day to day.',
  Professional: 'Adds financing, transport and payroll for growing schools.',
  Enterprise:   'Multi-campus groups, AI insights and dedicated support.'
};

function bill_planPrice(plan) { return PLAN_PRICING[plan] || 0; }
function bill_tierIndex(plan) { const i = PLAN_TIERS.indexOf(plan); return i < 0 ? 0 : i; }

// Days until renewal — negative once expired, null when no date is set.
function bill_daysToRenewal(school) {
  return school.nextRenewal ? Math.ceil((new Date(school.nextRenewal) - new Date()) / 86400000) : null;
}

// What a tier includes, derived from the entitlement catalogue so the pricing
// table can never drift from what hasFeature() actually grants.
function bill_planFeatures(plan) {
  if (typeof FEATURE_CATALOG === 'undefined') return [];
  return FEATURE_CATALOG
    .filter(f => !f.defaultOff && bill_tierIndex(plan) >= bill_tierIndex(f.minPlan))
    .map(f => f.label);
}

// Add-ons: catalogue entries this school can't currently use. defaultOff
// features never come with a tier, so they show here at every plan level.
function bill_availableAddOns(schoolId) {
  if (typeof FEATURE_CATALOG === 'undefined') return [];
  return FEATURE_CATALOG.filter(f => !hasFeature(f.key, schoolId));
}

// Pro-rata top-up for the unused remainder of the current billing period.
// Downgrades are scheduled rather than charged, so they cost nothing today.
function bill_prorata(school, newPlan) {
  const delta = bill_planPrice(newPlan) - bill_planPrice(school.subscriptionPlan);
  if (delta <= 0) return 0;
  const days = bill_daysToRenewal(school);
  // No renewal date, or already expired: charge the full period difference.
  const remaining = days === null ? 30 : Math.min(30, Math.max(0, days));
  return Math.max(0, Math.round(delta * (remaining || 30) / 30));
}

function bill_openInvoices(schoolId) {
  return DB.query('schoolInvoices', i => i.schoolId === schoolId && i.status === 'pending')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* ---------------------------------------------------------------- Main view */

function renderBillingSettings() {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  if (!school) {
    return emptyState({ icon: 'building', title: 'No subscription found', body: 'This school has no billing record yet. Contact CASPAA support.' });
  }

  const days = bill_daysToRenewal(school);
  const expired = days !== null && days <= 0;
  const open = bill_openInvoices(sid);
  const dueNow = open.reduce((s, i) => s + i.amount, 0);
  const invoices = DB.query('schoolInvoices', i => i.schoolId === sid)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const countdown = days === null ? 'No renewal date set'
    : expired ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
    : `In ${days} day${days !== 1 ? 's' : ''}`;

  // ── Current plan hero ────────────────────────────────────────────────────
  const hero = `
    <div class="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-2xl p-5 lg:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="text-xs text-brand-200 uppercase font-semibold tracking-wide">Current Plan</div>
          <div class="text-3xl font-extrabold mt-0.5">${school.subscriptionPlan || '—'}</div>
          <div class="text-sm text-brand-100 mt-1">${money(school.monthlyFee || bill_planPrice(school.subscriptionPlan))} per month</div>
          <div class="mt-2">${school.status === 'trial' ? '<span class="badge badge-info">Free trial</span>' : statusBadge(school.status)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-brand-200 uppercase font-semibold tracking-wide">${school.status === 'trial' ? 'Trial ends' : 'Next renewal'}</div>
          <div class="text-lg font-bold mt-0.5">${school.nextRenewal ? fdate(school.nextRenewal, { long: true }) : '—'}</div>
          <div class="text-xs font-semibold ${expired ? 'text-rose-200' : days !== null && days <= 7 ? 'text-amber-200' : 'text-brand-200'}">${countdown}</div>
        </div>
      </div>
    </div>`;

  // ── Amount outstanding to CASPAA ─────────────────────────────────────────
  const dueStrip = open.length ? `
    <div class="card p-5 border-l-4 ${expired ? 'border-l-rose-500' : 'border-l-amber-500'}">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="stat-label">Due to CASPAA</div>
          <div class="text-3xl font-extrabold text-slate-900 mt-0.5">${money(dueNow)}</div>
          <p class="text-xs text-slate-500 mt-1">
            ${open.length} unpaid invoice${open.length !== 1 ? 's' : ''} · earliest due ${fdate(open[0].dueDate, { long: true })}
            ${expired ? ' · <span class="text-rose-600 font-semibold">your subscription has lapsed</span>' : ''}
          </p>
        </div>
        <button class="btn btn-primary" onclick="bill_payInvoice('${open[0].id}')">${icon('fees', 'w-4 h-4')} Pay ${money(open[0].amount)} now</button>
      </div>
    </div>` : `
    <div class="card p-5 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">${icon('check', 'w-5 h-5')}</div>
      <div>
        <div class="font-semibold text-slate-900">You're all paid up</div>
        <p class="text-xs text-slate-500">Nothing outstanding${school.nextRenewal ? ` — the next invoice is raised around ${fdate(school.nextRenewal, { long: true })}` : ''}.</p>
      </div>
    </div>`;

  // ── A downgrade already queued for the next renewal ──────────────────────
  const pendingChange = school.pendingPlan ? `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-amber-900">
        <strong>Plan change scheduled.</strong> You move from ${school.subscriptionPlan} to <strong>${school.pendingPlan}</strong>
        on ${school.nextRenewal ? fdate(school.nextRenewal, { long: true }) : 'your next renewal'}. Nothing changes until then.
      </div>
      <button class="btn btn-secondary text-sm" onclick="bill_cancelScheduledChange()">Cancel change</button>
    </div>` : '';

  // ── Plan comparison ──────────────────────────────────────────────────────
  const planCards = PLAN_TIERS.map(p => {
    const isCurrent = school.subscriptionPlan === p;
    const isUpgrade = bill_tierIndex(p) > bill_tierIndex(school.subscriptionPlan);
    const feats = bill_planFeatures(p);
    const topUp = isUpgrade ? bill_prorata(school, p) : 0;
    return `
      <div class="card p-5 flex flex-col ${isCurrent ? 'ring-2 ring-brand-500' : ''}">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-900">${p}</h4>
          ${isCurrent ? '<span class="badge badge-success">Current</span>' : ''}
        </div>
        <div class="text-2xl font-extrabold text-slate-900 mt-2">${money(PLAN_PRICING[p])}<span class="text-sm font-medium text-slate-500">/mo</span></div>
        <p class="text-xs text-slate-500 mt-1">${PLAN_BLURB[p]}</p>
        <ul class="text-xs text-slate-600 space-y-1.5 mt-3 flex-1">
          <li class="flex gap-1.5">${icon('check', 'w-3.5 h-3.5 text-emerald-600 shrink-0')} <span>Core school management</span></li>
          ${feats.map(f => `<li class="flex gap-1.5">${icon('check', 'w-3.5 h-3.5 text-emerald-600 shrink-0')} <span>${f}</span></li>`).join('')}
        </ul>
        <div class="pt-4">
          ${isCurrent
            ? `<button class="btn btn-secondary w-full" disabled>Your plan</button>`
            : isUpgrade
              ? `<button class="btn btn-primary w-full" onclick="bill_startUpgrade('${p}')">Upgrade${topUp ? ` — ${money(topUp)} today` : ''}</button>`
              : `<button class="btn btn-secondary w-full" onclick="bill_scheduleDowngrade('${p}')">Downgrade at renewal</button>`}
        </div>
      </div>`;
  }).join('');

  // ── Add-ons outside the plan ─────────────────────────────────────────────
  const addOns = bill_availableAddOns(sid);
  const addOnBlock = addOns.length ? `
    <div class="card p-5">
      <h3 class="font-bold text-slate-900">Add-ons</h3>
      <p class="text-xs text-slate-500 mb-3">Available on request — our team will confirm pricing and switch it on for your school.</p>
      <div class="space-y-2">
        ${addOns.map(f => `
          <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="min-w-0">
              <div class="font-semibold text-sm text-slate-900">${f.label}</div>
              <div class="text-xs text-slate-500">${f.desc}${f.minPlan ? ` · included from ${f.minPlan}` : ''}</div>
            </div>
            <button class="btn btn-ghost text-sm whitespace-nowrap" onclick="requestFeatureUpgrade('${f.key}')">${icon('bell', 'w-3.5 h-3.5')} Request</button>
          </div>`).join('')}
      </div>
    </div>` : '';

  // ── Auto-renew ───────────────────────────────────────────────────────────
  const autoRenew = `
    <label class="card p-4 flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <div class="font-semibold text-sm text-slate-900">Auto-renew my subscription</div>
        <div class="text-xs text-slate-500">Charge the saved payment method when the current period ends, so access never lapses.</div>
      </div>
      <input type="checkbox" class="w-5 h-5 accent-brand-600 shrink-0" ${school.autoRenew ? 'checked' : ''} onchange="bill_toggleAutoRenew(this.checked)" />
    </label>`;

  // ── Invoice history ──────────────────────────────────────────────────────
  const history = `
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-900">Invoice History</h3>
        <p class="text-xs text-slate-500">Every subscription invoice CASPAA has raised for this school.</p>
      </div>
      ${invoices.length === 0
        ? `<div class="p-5">${emptyState({ icon: 'fees', title: 'No invoices yet', body: 'Your first subscription invoice appears here once your trial converts.' })}</div>`
        : `<div class="overflow-x-auto"><table class="tbl">
            <thead><tr>
              <th scope="col">Invoice</th><th scope="col">Period</th><th scope="col">Plan</th>
              <th scope="col">Amount</th><th scope="col">Due</th><th scope="col">Status</th><th scope="col"></th>
            </tr></thead>
            <tbody>
              ${invoices.map(inv => {
                const overdue = inv.status === 'pending' && new Date(inv.dueDate) < new Date();
                return `<tr>
                  <td><code class="text-xs">${inv.id.slice(-8).toUpperCase()}</code></td>
                  <td class="text-sm">${inv.period}</td>
                  <td><span class="badge badge-neutral">${inv.plan}</span></td>
                  <td class="font-mono font-semibold">${money(inv.amount)}</td>
                  <td class="text-sm ${overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}">${fdate(inv.dueDate, { short: true })}</td>
                  <td>${overdue ? '<span class="badge badge-danger">Overdue</span>' : statusBadge(inv.status)}</td>
                  <td class="text-right whitespace-nowrap">
                    ${inv.status === 'pending'
                      ? `<button class="btn btn-primary !py-1 !px-2.5 text-xs" onclick="bill_payInvoice('${inv.id}')">Pay</button>`
                      : `<button class="btn btn-ghost !p-1.5" aria-label="Download receipt" title="Download receipt" onclick="bill_downloadDocument('${inv.id}')">${icon('download', 'w-3.5 h-3.5')}</button>`}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table></div>`}
    </div>`;

  return `
    <div class="space-y-4">
      ${hero}
      ${pendingChange}
      ${dueStrip}
      <div>
        <h3 class="font-bold text-slate-900 mb-1">Plans</h3>
        <p class="text-xs text-slate-500 mb-3">Upgrades apply immediately and are charged pro-rata for the rest of this period. Downgrades take effect at your next renewal.</p>
        <div class="grid md:grid-cols-3 gap-3">${planCards}</div>
      </div>
      ${addOnBlock}
      ${autoRenew}
      ${history}
      <p class="text-xs text-slate-500 text-center">
        Questions about a charge? ${icon('chat', 'w-3.5 h-3.5 inline')}
        <button class="underline font-semibold" onclick="APP.go('adm_support')">Contact CASPAA support</button>
      </p>
    </div>`;
}

/* ------------------------------------------------------------ Plan changes */

function bill_toggleAutoRenew(on) {
  const sid = currentSchoolId();
  DB.update('schools', sid, { autoRenew: on });
  DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: AUTH.current.id, action: on ? 'autorenew_enabled' : 'autorenew_disabled', target: 'Subscription', timestamp: now() });
  toast(`Auto-renewal ${on ? 'enabled' : 'disabled'}`);
}

// Upgrade = raise a pro-rata invoice, then send the school straight to payment.
// The plan only moves once that invoice is settled (see bill_applyPayment).
function bill_startUpgrade(newPlan) {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  if (!school || school.subscriptionPlan === newPlan) return;
  const amount = bill_prorata(school, newPlan);
  const days = bill_daysToRenewal(school);
  const gained = (typeof FEATURE_CATALOG !== 'undefined' ? FEATURE_CATALOG : [])
    .filter(f => !f.defaultOff && bill_tierIndex(newPlan) >= bill_tierIndex(f.minPlan) && bill_tierIndex(school.subscriptionPlan) < bill_tierIndex(f.minPlan));

  modal({
    title: `Upgrade to ${newPlan}`,
    body: `
      <div class="space-y-4">
        <div class="flex items-center gap-3 text-sm">
          <div class="flex-1 p-3 rounded-xl bg-slate-50 text-center">
            <div class="text-xs text-slate-500">From</div>
            <div class="font-bold text-slate-900">${school.subscriptionPlan}</div>
            <div class="text-xs text-slate-500">${money(bill_planPrice(school.subscriptionPlan))}/mo</div>
          </div>
          <div class="text-slate-400">→</div>
          <div class="flex-1 p-3 rounded-xl bg-brand-50 text-center">
            <div class="text-xs text-brand-700">To</div>
            <div class="font-bold text-brand-900">${newPlan}</div>
            <div class="text-xs text-brand-700">${money(bill_planPrice(newPlan))}/mo</div>
          </div>
        </div>

        ${gained.length ? `<div>
          <div class="text-xs uppercase font-semibold text-slate-500 mb-2">Unlocks straight away</div>
          <ul class="space-y-1.5">
            ${gained.map(f => `<li class="flex gap-2 text-sm text-slate-700">${icon('check', 'w-4 h-4 text-emerald-600 shrink-0')} <span><strong>${f.label}</strong> — ${f.desc}</span></li>`).join('')}
          </ul>
        </div>` : ''}

        <div class="card p-4 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Pro-rata for the rest of this period${days !== null && days > 0 ? ` (${days} day${days !== 1 ? 's' : ''})` : ''}</span><span class="font-mono font-semibold">${money(amount)}</span></div>
          <div class="flex justify-between border-t border-slate-100 pt-2"><span class="font-semibold text-slate-900">Due today</span><span class="font-mono font-bold text-brand-700">${money(amount)}</span></div>
          <p class="text-xs text-slate-500 pt-1">From ${school.nextRenewal ? fdate(school.nextRenewal, { long: true }) : 'your next renewal'} you'll be billed ${money(bill_planPrice(newPlan))} monthly.</p>
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="bill_confirmUpgrade('${newPlan}')">${icon('fees', 'w-4 h-4')} Continue to payment</button>`
  });
}

function bill_confirmUpgrade(newPlan) {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  const amount = bill_prorata(school, newPlan);
  const period = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const inv = {
    id: uid('sinv'), schoolId: sid, period: `Plan upgrade · ${period}`, plan: newPlan,
    amount, status: 'pending', dueDate: today(), paidAt: null, remindersSent: 0,
    upgradeTo: newPlan                       // read back on payment to apply the tier
  };
  DB.insert('schoolInvoices', inv);
  document.getElementById('modalBackdrop')?.click();
  // A zero-cost upgrade (same-price tier, or an expired period) needs no gateway trip.
  if (amount <= 0) { bill_applyPayment(inv.id, 'none'); return; }
  bill_payInvoice(inv.id);
}

// Downgrades are scheduled, not charged. Ops sees the ticket and can intervene
// if the school is about to lose something it depends on.
function bill_scheduleDowngrade(newPlan) {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  if (!school || school.subscriptionPlan === newPlan) return;
  // Only tier-derived entitlements are at risk. A feature CASPAA switched on as a
  // per-school override survives the downgrade, so warning about it would be a lie.
  const overrides = school.features || {};
  const lost = (typeof FEATURE_CATALOG !== 'undefined' ? FEATURE_CATALOG : [])
    .filter(f => hasFeature(f.key, sid) && f.minPlan && overrides[f.key] !== true
              && bill_tierIndex(newPlan) < bill_tierIndex(f.minPlan));

  modal({
    title: `Downgrade to ${newPlan}`,
    body: `
      <div class="space-y-4">
        <p class="text-sm text-slate-700">
          Your ${school.subscriptionPlan} plan stays active until
          <strong>${school.nextRenewal ? fdate(school.nextRenewal, { long: true }) : 'your next renewal'}</strong>.
          From then you'll be billed ${money(bill_planPrice(newPlan))} monthly.
        </p>
        ${lost.length ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div class="text-xs uppercase font-semibold text-amber-800 mb-2">You'll lose access to</div>
          <ul class="space-y-1.5">
            ${lost.map(f => `<li class="flex gap-2 text-sm text-amber-900">${icon('info', 'w-4 h-4 shrink-0')} <span><strong>${f.label}</strong> — ${f.desc}</span></li>`).join('')}
          </ul>
          <p class="text-xs text-amber-800 mt-2">Your data isn't deleted — these screens are hidden until you upgrade again.</p>
        </div>` : ''}
        <p class="text-xs text-slate-500">You can cancel this from the Billing tab any time before it takes effect.</p>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Keep ${school.subscriptionPlan}</button>
             <button class="btn btn-danger" onclick="bill_confirmDowngrade('${newPlan}')">Schedule downgrade</button>`
  });
}

function bill_confirmDowngrade(newPlan) {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  DB.update('schools', sid, { pendingPlan: newPlan });
  DB.insert('supportTickets', {
    id: uid('tick'), schoolId: sid, subject: `Plan downgrade scheduled: ${school.subscriptionPlan} → ${newPlan}`,
    message: `${school.name || 'A school'} scheduled a downgrade to ${newPlan}, effective ${school.nextRenewal ? fdate(school.nextRenewal, { long: true }) : 'next renewal'}.`,
    category: 'upgrade', status: 'open', priority: 'normal',
    from: AUTH.current ? AUTH.current.id : sid, createdAt: now()
  });
  DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: AUTH.current.id, action: 'scheduled_plan_change', target: `${school.subscriptionPlan} → ${newPlan}`, timestamp: now() });
  document.getElementById('modalBackdrop')?.click();
  toast(`Downgrade to ${newPlan} scheduled for your next renewal`, 'success');
  APP.render();
}

function bill_cancelScheduledChange() {
  const sid = currentSchoolId();
  const school = DB.find('schools', sid);
  DB.update('schools', sid, { pendingPlan: null });
  DB.insert('auditLog', { id: uid('aud'), schoolId: sid, actor: AUTH.current.id, action: 'cancelled_plan_change', target: `${school.subscriptionPlan} retained`, timestamp: now() });
  toast(`Cancelled — you stay on ${school.subscriptionPlan}`, 'success');
  APP.render();
}

/* ---------------------------------------------------------------- Payment */

function bill_payInvoice(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  if (!inv) { toast('Invoice not found', 'danger'); return; }
  if (inv.status === 'paid') { toast('This invoice is already paid'); return; }

  modal({
    title: 'Pay CASPAA',
    body: `
      <div class="space-y-4">
        <div class="bg-brand-50 rounded-2xl p-5 text-center">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">${inv.period}</div>
          <div class="text-3xl font-extrabold text-brand-700">${money(inv.amount)}</div>
          <div class="text-xs text-slate-500 mt-1">${inv.plan} plan${inv.upgradeTo ? ' · upgrade' : ' · subscription'}</div>
        </div>
        <div>
          <label class="input-label">Payment method</label>
          <div class="space-y-2">
            ${[
              { v: 'card',     t: 'Debit / Credit Card',  d: 'Verve, Mastercard, Visa — instant' },
              { v: 'transfer', t: 'Bank Transfer',        d: 'To CASPAA\'s corporate account' },
              { v: 'ussd',     t: 'USSD',                 d: 'Dial a code from your phone' }
            ].map((m, i) => `
              <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 cursor-pointer">
                <input type="radio" name="billPayMethod" value="${m.v}" class="w-4 h-4 accent-brand-600" ${i === 0 ? 'checked' : ''} />
                <div><div class="font-semibold text-sm text-slate-900">${m.t}</div><div class="text-xs text-slate-500">${m.d}</div></div>
              </label>`).join('')}
          </div>
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" id="billProceedPay" onclick="bill_processPayment('${inv.id}')">Pay ${money(inv.amount)}</button>`
  });
}

function bill_processPayment(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  const methodEl = document.querySelector('input[name="billPayMethod"]:checked');
  if (!inv || !methodEl) { toast('Payment form error — please try again', 'danger'); return; }
  const method = methodEl.value;

  const btn = document.getElementById('billProceedPay');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Processing…'; btn.disabled = true; }

  setTimeout(() => {
    document.getElementById('modalBackdrop')?.click();
    if (method === 'ussd')     return bill_showUSSD(invoiceId, inv.amount);
    if (method === 'transfer') return bill_showTransfer(invoiceId, inv.amount);
    bill_showCardInput(invoiceId, inv.amount);
  }, 500);
}

function bill_showUSSD(invoiceId, amount) {
  modal({
    title: 'Dial This USSD Code',
    body: `<div class="text-center py-4">
      <div class="text-xs text-slate-500 mb-2">On your phone, dial:</div>
      <div class="text-3xl font-extrabold text-brand-700 font-mono">*737*51*${amount}#</div>
      <p class="text-sm text-slate-500 mt-4">Follow the prompts. We'll confirm automatically once the transfer lands.</p>
      <button class="btn btn-primary mt-6 w-full" onclick="bill_applyPayment('${invoiceId}', 'ussd')">I've completed the USSD payment</button>
    </div>`
  });
}

function bill_showTransfer(invoiceId, amount) {
  const school = DB.find('schools', currentSchoolId()) || {};
  modal({
    title: 'Pay via Bank Transfer',
    body: `<div class="space-y-4">
      <div class="bg-brand-50 rounded-2xl p-5 text-center">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transfer exactly</div>
        <div class="text-3xl font-extrabold text-brand-700">${money(amount)}</div>
      </div>
      <div class="card p-5 space-y-3">
        <div class="flex justify-between text-sm"><span class="text-slate-500">Bank</span><span class="font-semibold text-slate-900">Providus Bank</span></div>
        <div class="flex justify-between text-sm"><span class="text-slate-500">Account Number</span><span class="font-bold text-xl font-mono text-brand-700">7100 4412 09</span></div>
        <div class="flex justify-between text-sm"><span class="text-slate-500">Account Name</span><span class="font-semibold text-slate-900">CASPAA Technologies Ltd</span></div>
        <div class="flex justify-between text-sm"><span class="text-slate-500">Narration</span><span class="font-semibold text-slate-900">${(school.name || 'School')} subscription</span></div>
      </div>
      <div class="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
        Use the narration above so your payment is matched automatically. Bank transfers reconcile within 10 minutes on business days.
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="bill_applyPayment('${invoiceId}', 'transfer')">I've made the transfer</button>`
  });
}

function bill_showCardInput(invoiceId, amount) {
  modal({
    size: 'sm',
    title: 'Card Payment',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-900 text-white rounded-2xl p-4">
          <div class="text-xs text-slate-400">Paying CASPAA Technologies Ltd</div>
          <div class="text-2xl font-extrabold mt-1">${money(amount)}</div>
        </div>
        <div><label class="input-label" for="bill_cardNo">Card Number</label>
          <input id="bill_cardNo" class="input font-mono" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label" for="bill_cardExp">Expiry</label>
            <input id="bill_cardExp" class="input font-mono" placeholder="MM/YY" maxlength="5" /></div>
          <div><label class="input-label" for="bill_cardCvv">CVV</label>
            <input id="bill_cardCvv" class="input font-mono" type="password" placeholder="123" maxlength="4" /></div>
        </div>
        <p class="text-xs text-slate-500 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')} Secured by Paystack · PCI-DSS compliant. CASPAA never stores your card details.</p>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" id="billCardPay" onclick="bill_submitCard('${invoiceId}', ${amount})">Pay ${money(amount)}</button>`
  });
}

function bill_submitCard(invoiceId, amount) {
  const no = (document.getElementById('bill_cardNo').value || '').replace(/\s/g, '');
  const exp = (document.getElementById('bill_cardExp').value || '').trim();
  const cvv = (document.getElementById('bill_cardCvv').value || '').trim();
  if (no.length < 15) { toast('Enter a valid card number', 'danger'); return; }
  if (!/^\d{2}\/\d{2}$/.test(exp)) { toast('Enter the expiry as MM/YY', 'danger'); return; }
  if (cvv.length < 3) { toast('Enter the 3-digit CVV', 'danger'); return; }

  const btn = document.getElementById('billCardPay');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Authorising…'; btn.disabled = true; }
  setTimeout(() => {
    document.getElementById('modalBackdrop')?.click();
    bill_showOTP(invoiceId, amount);
  }, 900);
}

function bill_showOTP(invoiceId, amount) {
  modal({
    size: 'sm',
    title: 'Verify Payment',
    body: `
      <div class="text-center py-2">
        <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-3">${icon('shield', 'w-7 h-7')}</div>
        <p class="text-sm text-slate-600">Your bank sent a 6-digit code to the phone number on this card. Enter it to authorise ${money(amount)}.</p>
        <input id="bill_otp" class="input text-center text-2xl font-mono tracking-[0.4em] mt-4" inputmode="numeric" maxlength="6" placeholder="••••••" />
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" id="billOtpBtn" onclick="bill_confirmOTP('${invoiceId}')">Authorise</button>`
  });
}

function bill_confirmOTP(invoiceId) {
  const otp = (document.getElementById('bill_otp').value || '').trim();
  if (otp.length !== 6) { toast('Enter the 6-digit code', 'danger'); return; }
  const btn = document.getElementById('billOtpBtn');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Verifying…'; btn.disabled = true; }
  setTimeout(() => {
    document.getElementById('modalBackdrop')?.click();
    bill_applyPayment(invoiceId, 'card');
  }, 900);
}

/* --------------------------------------------------------------------------
   Settlement. One place where a subscription payment lands, whatever rail it
   came in on: mark the invoice paid, move the renewal date, convert a trial,
   and — for an upgrade invoice — apply the new tier so entitlements re-resolve
   on the next render.
   -------------------------------------------------------------------------- */
function bill_applyPayment(invoiceId, method) {
  const inv = DB.find('schoolInvoices', invoiceId);
  if (!inv || inv.status === 'paid') return;
  const sid = inv.schoolId;
  const school = DB.find('schools', sid) || {};

  DB.update('schoolInvoices', invoiceId, { status: 'paid', paidAt: now(), paidVia: method });

  const patch = { status: school.status === 'trial' ? 'active' : school.status };
  if (inv.upgradeTo) {
    patch.subscriptionPlan = inv.upgradeTo;
    patch.monthlyFee = bill_planPrice(inv.upgradeTo);
    patch.pendingPlan = null;                    // an upgrade overrides a queued downgrade
  } else {
    // Renewal: extend from the existing date when it's still in the future, so
    // paying early doesn't cost the school the days it already has.
    const base = school.nextRenewal && new Date(school.nextRenewal) > new Date() ? new Date(school.nextRenewal) : new Date();
    base.setDate(base.getDate() + 30);
    patch.nextRenewal = base.toISOString().slice(0, 10);
  }
  DB.update('schools', sid, patch);

  DB.insert('auditLog', {
    id: uid('aud'), schoolId: sid, actor: AUTH.current ? AUTH.current.id : sid,
    action: inv.upgradeTo ? 'upgraded_plan' : 'paid_subscription',
    target: inv.upgradeTo ? `${school.subscriptionPlan} → ${inv.upgradeTo} (${money(inv.amount)})` : `${inv.period} · ${money(inv.amount)}`,
    timestamp: now()
  });

  bill_showReceipt(invoiceId);
  toast(inv.upgradeTo ? `You're now on ${inv.upgradeTo}` : 'Subscription payment received', 'success');
}

function bill_showReceipt(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  const school = DB.find('schools', inv.schoolId) || {};
  modal({
    size: 'sm',
    title: 'Payment Successful',
    body: `
      <div class="text-center py-3">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">${icon('check', 'w-8 h-8')}</div>
        <div class="text-3xl font-extrabold text-slate-900">${money(inv.amount)}</div>
        <p class="text-sm text-slate-500 mt-1">${inv.period}</p>
        <div class="card p-4 mt-4 space-y-2 text-sm text-left">
          <div class="flex justify-between"><span class="text-slate-500">Reference</span><span class="font-mono">${inv.id.slice(-10).toUpperCase()}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Plan</span><span class="font-semibold">${inv.plan}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Paid</span><span>${fdate(now(), { long: true })}</span></div>
          ${school.nextRenewal ? `<div class="flex justify-between"><span class="text-slate-500">Next renewal</span><span class="font-semibold">${fdate(school.nextRenewal, { long: true })}</span></div>` : ''}
        </div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="bill_downloadDocument('${inv.id}')">${icon('download', 'w-4 h-4')} Receipt</button>
             <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Done</button>`,
    onClose: () => APP.render()   // repaint so the new plan / renewal date show immediately
  });
}

// One printable document that reads as an invoice while unpaid and a receipt
// once settled — the school only ever wants whichever it currently is.
function bill_downloadDocument(invoiceId) {
  const inv = DB.find('schoolInvoices', invoiceId);
  if (!inv) return;
  const s = DB.find('schools', inv.schoolId) || {};
  const paid = inv.status === 'paid';
  printElement(`
    <div style="max-width:680px;margin:0 auto;font-family:system-ui">
      <div style="text-align:center;border-bottom:3px solid #00b386;padding-bottom:16px;margin-bottom:20px">
        <h1 style="margin:0;color:#00b386">CASPAA</h1>
        <p style="margin:4px 0;color:#666;font-size:13px">School Operating System · Lagos, Nigeria</p>
        <h2 style="margin:14px 0 4px;font-size:18px">${paid ? 'PAYMENT RECEIPT' : 'SUBSCRIPTION INVOICE'}</h2>
      </div>
      <table style="width:100%;font-size:14px;margin-bottom:20px">
        <tr><td><strong>${paid ? 'Received From:' : 'Billed To:'}</strong></td><td align="right">${s.name || '—'}</td></tr>
        <tr><td></td><td align="right">${s.proprietor || ''}</td></tr>
        <tr><td></td><td align="right">${s.email || ''}</td></tr>
        <tr><td><strong>Reference:</strong></td><td align="right"><code>${inv.id.toUpperCase().slice(-10)}</code></td></tr>
        <tr><td><strong>Period:</strong></td><td align="right">${inv.period}</td></tr>
        <tr><td><strong>${paid ? 'Paid On:' : 'Due Date:'}</strong></td><td align="right">${fdate(paid ? inv.paidAt : inv.dueDate, { long: true })}</td></tr>
        ${paid && inv.paidVia ? `<tr><td><strong>Method:</strong></td><td align="right">${inv.paidVia}</td></tr>` : ''}
      </table>
      <table border="1" cellpadding="10" style="border-collapse:collapse;width:100%;font-size:14px">
        <thead style="background:#f3f4f6"><tr><th align="left">Description</th><th align="right">Amount</th></tr></thead>
        <tbody><tr><td>${inv.plan} Subscription — ${inv.period}</td><td align="right">${money(inv.amount)}</td></tr></tbody>
        <tfoot style="background:${paid ? '#c3f0e2' : '#fee2e2'};font-weight:bold">
          <tr><td>${paid ? 'PAID' : 'TOTAL DUE'}</td><td align="right">${money(inv.amount)}</td></tr>
        </tfoot>
      </table>
      <p style="margin-top:20px;color:${paid ? '#00966f' : '#991b1b'}">
        ${paid ? 'Thank you — no further action is required.' : `Please settle by ${fdate(inv.dueDate, { long: true })} to avoid service interruption.`}
      </p>
      <p style="margin-top:30px;text-align:center;color:#999;font-size:11px">Computer-generated document — no signature required.</p>
    </div>
  `);
}
