/* ============================================================
   CASPAA FRONT DESK — public enquiries that reach the school
   Surfaces the prospective-parent / job-seeker submissions made from
   the public portal (auth.js): Tour bookings and Career interests.
   Admissions have their own dedicated inbox (view_adm_admissions);
   here we cross-link to it so everything is in one place.
   ============================================================ */

/* ---------- Counts for the current school ---------- */
function frontdeskCounts() {
  const sid = currentSchoolId();
  return {
    tours:   DB.query('tourBookings', t => t.schoolId === sid && t.status === 'requested').length,
    careers: DB.query('careerApplications', c => c.schoolId === sid && c.status === 'received').length,
    admissions: DB.query('admissionApplications', a => a.schoolId === sid && a.status === 'pending').length
  };
}

/* ---------- Dashboard banner (rendered on view_adm_dashboard) ---------- */
function enquiriesBanner() {
  const c = frontdeskCounts();
  const total = c.tours + c.careers + c.admissions;
  if (!total) return '';
  const chip = (n, label, view, params) => n
    ? `<button onclick="APP.go('${view}'${params ? ", " + JSON.stringify(params) : ''})" class="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition rounded-xl px-3 py-2 text-left">
         <span class="text-lg font-extrabold">${n}</span>
         <span class="text-xs leading-tight">new<br>${label}</span>
       </button>`
    : '';
  return `
    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 lg:p-5 text-white">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">${icon('bell','w-6 h-6')}</div>
          <div>
            <div class="font-bold text-lg leading-tight">You have ${total} new enquir${total === 1 ? 'y' : 'ies'}</div>
            <div class="text-blue-100 text-sm">Submitted from your public portal — review and respond.</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${chip(c.admissions, 'admissions', 'adm_admissions')}
          ${chip(c.tours, 'tour requests', 'adm_frontdesk', { fdTab: 'tours' })}
          ${chip(c.careers, 'career leads', 'adm_frontdesk', { fdTab: 'careers' })}
        </div>
      </div>
    </div>
  `;
}

/* ---------- Front-desk view: Tours + Careers ---------- */
function view_adm_frontdesk() {
  const sid = currentSchoolId();
  const tab = APP.params.fdTab || 'tours';
  const tours = DB.query('tourBookings', t => t.schoolId === sid).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const careers = DB.query('careerApplications', c => c.schoolId === sid).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const c = frontdeskCounts();

  const tabBtn = (key, label, count) => `
    <button class="chip ${tab === key ? 'active' : ''}" onclick="APP.params.fdTab='${key}'; APP.render()">${label}${count ? ` <span class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[11px] rounded-full bg-brand-600 text-navy-800 px-1">${count}</span>` : ''}</button>`;

  return `
    ${pageHeader({ title: 'Front Desk', subtitle: 'Tour requests and career enquiries from your public portal' })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCard({ label: 'New tour requests', value: c.tours, icon: 'calendar', color: 'brand' })}
      ${statCard({ label: 'New career leads', value: c.careers, icon: 'teacher', color: 'gold' })}
      ${statCard({ label: 'Pending admissions', value: c.admissions, icon: 'students', color: 'blue' })}
      ${statCard({ label: 'Total tours', value: tours.length, icon: 'check', color: 'slate' })}
    </div>

    <div class="flex gap-2 mb-4 flex-wrap items-center">
      ${tabBtn('tours', 'Tour Requests', c.tours)}
      ${tabBtn('careers', 'Careers', c.careers)}
      <button class="chip" onclick="APP.go('adm_admissions')">Admissions ${c.admissions ? `<span class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[11px] rounded-full bg-brand-600 text-navy-800 px-1">${c.admissions}</span>` : ''} &rarr;</button>
    </div>

    ${tab === 'tours' ? renderTourTable(tours) : renderCareerTable(careers)}
  `;
}

function tourStatusBadge(s) {
  const map = { requested: 'badge-warn', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
  const label = { requested: 'New', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
  return `<span class="badge ${map[s] || 'badge'}">${label[s] || s}</span>`;
}

function renderTourTable(tours) {
  if (!tours.length) return `<div class="card p-12 text-center text-slate-500">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">${icon('calendar','w-7 h-7')}</div>
      <div class="font-semibold text-slate-700">No tour requests yet</div>
      <div class="text-sm mt-1">When a parent books a tour from your portal, it appears here.</div>
    </div>`;
  return `<div class="card overflow-hidden"><table class="tbl">
      <thead><tr><th>Parent</th><th>Child · Class</th><th>Requested Slot</th><th>Ref</th><th>Status</th><th class="text-right">Action</th></tr></thead>
      <tbody>
        ${tours.map(t => `<tr class="cursor-pointer" onclick="viewTourBooking('${t.id}')">
          <td><div class="font-medium text-sm">${t.parentName}</div><div class="text-xs text-slate-500">${t.phone} · ${t.email}</div></td>
          <td class="text-sm">${t.childName || '—'}<div class="text-xs text-slate-500">${t.classOfInterest || ''}</div></td>
          <td class="text-sm">${fdate(t.confirmedDate || t.date)} <span class="text-slate-400">at</span> ${t.confirmedTime || t.time}${t.confirmedDate ? '' : ''}${t.note ? `<div class="text-xs text-slate-400 truncate max-w-[220px]" title="${(t.note||'').replace(/"/g,'&quot;')}">“${t.note}”</div>` : ''}</td>
          <td class="text-xs font-mono text-slate-500">${t.ref || '—'}</td>
          <td>${tourStatusBadge(t.status)}</td>
          <td class="text-right whitespace-nowrap">
            ${t.status === 'requested' ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-brand-700" onclick="event.stopPropagation(); viewTourBooking('${t.id}')">Review</button>` : ''}
            ${t.status === 'confirmed' ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-emerald-700" onclick="event.stopPropagation(); tourSetStatus('${t.id}','completed')">Mark done</button>` : ''}
            ${(t.status === 'requested' || t.status === 'confirmed') ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-rose-600" onclick="event.stopPropagation(); tourSetStatus('${t.id}','cancelled')">Cancel</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
}

/* ---------- Tour detail: review, confirm (with optional reschedule), notify ---------- */
function viewTourBooking(id) {
  const t = DB.find('tourBookings', id);
  if (!t) return;
  const row = (label, val) => val ? `<div class="flex justify-between gap-4 py-1.5 border-b border-slate-50"><span class="text-sm text-slate-500">${label}</span><span class="text-sm font-medium text-slate-800 text-right">${val}</span></div>` : '';
  const done = t.status === 'completed' || t.status === 'cancelled';
  modal({
    title: 'Tour Request · ' + (t.ref || ''),
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">${avatar(t.parentName, 'lg')}<div>
            <div class="font-bold text-slate-900">${t.parentName}</div>
            <div class="text-xs text-slate-500">${t.phone} · ${t.email}</div>
          </div></div>
          ${tourStatusBadge(t.status)}
        </div>

        <div class="bg-slate-50 rounded-xl p-3">
          ${row('Child', t.childName || '—')}
          ${row('Class of interest', t.classOfInterest || '—')}
          ${row('Requested date', fdate(t.date) + ' at ' + t.time)}
          ${t.confirmedDate ? row('Confirmed for', `<span class="text-emerald-700">${fdate(t.confirmedDate)} at ${t.confirmedTime}</span>`) : ''}
          ${row('Message', t.note || '—')}
          ${row('Submitted', fdate(t.createdAt, { relative: true }))}
        </div>

        ${done ? '' : `
        <div class="border border-slate-200 rounded-xl p-3">
          <div class="text-xs uppercase font-semibold text-slate-500 mb-2">Confirm the visit</div>
          <p class="text-xs text-slate-500 mb-3">Keep the requested slot, or set a new one. Confirming notifies the parent by email &amp; SMS (simulated).</p>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="input-label">Date</label><input id="tv_date" type="date" class="input" value="${t.confirmedDate || t.date}" min="${today()}" /></div>
            <div><label class="input-label">Time</label>
              <select id="tv_time" class="input">${TOUR_SLOTS.map(s => `<option ${s === (t.confirmedTime || t.time) ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
          </div>
        </div>`}
      </div>
    `,
    footer: done
      ? `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>`
      : `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Close</button>
         <button class="btn btn-danger" onclick="tourSetStatus('${t.id}','cancelled', true)">Decline</button>
         <button class="btn btn-primary" onclick="confirmTour('${t.id}')">${icon('check','w-4 h-4')} Confirm &amp; notify parent</button>`
  });
}

function confirmTour(id) {
  const t = DB.find('tourBookings', id);
  if (!t) return;
  const date = (document.getElementById('tv_date') || {}).value || t.date;
  const time = (document.getElementById('tv_time') || {}).value || t.time;
  const rescheduled = date !== t.date || time !== t.time;
  DB.update('tourBookings', id, { status: 'confirmed', confirmedDate: date, confirmedTime: time, confirmedAt: now(), confirmedBy: AUTH.current.id });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'tour_confirmed', target: t.parentName, timestamp: now() });
  // Simulated parent notification (real email/SMS ships with the messaging layer)
  DB.insert('notifications', {
    id: uid('ntf'), userId: t.email, schoolId: currentSchoolId(), read: false, type: 'success',
    title: 'Your school tour is confirmed',
    body: `${t.parentName}, your visit is confirmed for ${fdate(date)} at ${time}.${rescheduled ? ' (Note the updated time.)' : ''}`,
    timestamp: now()
  });
  document.getElementById('modalBackdrop')?.click();
  toast(`Tour confirmed for ${fdate(date)} at ${time} — parent notified`, 'success');
  APP.render();
}

function careerStatusBadge(s) {
  const map = { received: 'badge-warn', reviewing: 'badge-info', contacted: 'badge-success', archived: 'badge' };
  const label = { received: 'New', reviewing: 'Reviewing', contacted: 'Contacted', archived: 'Archived' };
  return `<span class="badge ${map[s] || 'badge'}">${label[s] || s}</span>`;
}

function renderCareerTable(careers) {
  if (!careers.length) return `<div class="card p-12 text-center text-slate-500">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">${icon('teacher','w-7 h-7')}</div>
      <div class="font-semibold text-slate-700">No career enquiries yet</div>
      <div class="text-sm mt-1">Interest submitted from your portal's Careers form appears here.</div>
    </div>`;
  return `<div class="card overflow-hidden"><table class="tbl">
      <thead><tr><th>Candidate</th><th>Role · Experience</th><th>Links</th><th>Ref</th><th>Status</th><th class="text-right">Action</th></tr></thead>
      <tbody>
        ${careers.map(c => `<tr>
          <td><div class="font-medium text-sm">${c.name}</div><div class="text-xs text-slate-500">${c.phone} · ${c.email}</div></td>
          <td class="text-sm">${c.role || '—'}<div class="text-xs text-slate-500">${c.experience ? c.experience + ' yrs' : ''}</div></td>
          <td class="text-sm">${c.link ? `<a href="${c.link}" target="_blank" rel="noopener" class="text-brand-700 underline">CV / link</a>` : '—'}${c.note ? `<div class="text-xs text-slate-400 truncate max-w-[200px]" title="${(c.note||'').replace(/"/g,'&quot;')}">“${c.note}”</div>` : ''}</td>
          <td class="text-xs font-mono text-slate-500">${c.ref || '—'}</td>
          <td>${careerStatusBadge(c.status)}</td>
          <td class="text-right whitespace-nowrap">
            ${c.status === 'received' ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-brand-700" onclick="careerSetStatus('${c.id}','reviewing')">Review</button>` : ''}
            ${c.status === 'reviewing' ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-emerald-700" onclick="careerSetStatus('${c.id}','contacted')">Mark contacted</button>` : ''}
            ${c.status !== 'archived' ? `<button class="btn btn-ghost !py-1 !px-2 text-xs text-slate-500" onclick="careerSetStatus('${c.id}','archived')">Archive</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
}

function tourSetStatus(id, status, closeModal) {
  DB.update('tourBookings', id, { status, updatedAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'tour_' + status, target: id, timestamp: now() });
  if (closeModal) document.getElementById('modalBackdrop')?.click();
  toast('Tour ' + status, status === 'cancelled' ? 'warn' : 'success');
  APP.render();
}

function careerSetStatus(id, status) {
  DB.update('careerApplications', id, { status, updatedAt: now() });
  DB.insert('auditLog', { id: uid('aud'), schoolId: currentSchoolId(), actor: AUTH.current.id, action: 'career_' + status, target: id, timestamp: now() });
  toast('Candidate ' + status, 'success');
  APP.render();
}
