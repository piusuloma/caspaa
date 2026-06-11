/* ============================================================
   EVENT CALENDAR MODULE
   - All roles see the school calendar
   - Admin can create / edit / delete events
   - Events filtered by audience
   ============================================================ */

const CAL_TYPES = {
  holiday:   { label: 'Holiday',      color: 'bg-red-100 text-red-700 border-red-200',      dot: 'bg-red-500' },
  meeting:   { label: 'Meeting',      color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  event:     { label: 'Event',        color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  exam:      { label: 'Exam',         color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  milestone: { label: 'Milestone',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  other:     { label: 'Other',        color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }
};

function cal_eventsForRole(role) {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const all = DB.query('schoolEvents', e => e.schoolId === schoolId);
  return all.filter(e => {
    if (e.audience === 'all') return true;
    if (e.audience === 'parents' && role === 'parent') return true;
    if (e.audience === 'students' && role === 'student') return true;
    if (e.audience === 'teachers' && (role === 'teacher' || role === 'principal')) return true;
    if (role === 'schooladmin' || role === 'principal') return true;
    return false;
  }).sort((a,b) => a.startDate.localeCompare(b.startDate));
}

function cal_monthDays(year, month) {
  // month is 0-based (JS Date). Returns array of date strings for that month grid (including padding).
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    days.push(ds);
  }
  return days;
}

function view_cal_main(params) {
  const role = AUTH.current.role;
  const isAdmin = role === 'schooladmin' || role === 'principal';
  const now = new Date();
  const viewYear  = (params && params.year)  ? parseInt(params.year)  : now.getFullYear();
  const viewMonth = (params && params.month) ? parseInt(params.month) : now.getMonth(); // 0-based

  const events = cal_eventsForRole(role);
  const days   = cal_monthDays(viewYear, viewMonth);
  const todayStr = today();
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  // Navigation helpers
  const prevMonth = viewMonth === 0  ? { month: 11, year: viewYear - 1 } : { month: viewMonth - 1, year: viewYear };
  const nextMonth = viewMonth === 11 ? { month: 0,  year: viewYear + 1 } : { month: viewMonth + 1, year: viewYear };

  // Events that fall on a given date (startDate or within range)
  function eventsOn(dateStr) {
    return events.filter(e => dateStr >= e.startDate && dateStr <= (e.endDate || e.startDate));
  }

  // Upcoming list (next 90 days)
  const upcomingCutoff = new Date(); upcomingCutoff.setDate(upcomingCutoff.getDate() + 90);
  const upcoming = events.filter(e => e.startDate >= todayStr && e.startDate <= upcomingCutoff.toISOString().slice(0,10)).slice(0,8);

  return `
    ${pageHeader({
      title: 'School Calendar',
      subtitle: 'Upcoming events, holidays, and important dates',
      actions: isAdmin ? `<button class="btn btn-primary" onclick="cal_addEventModal()">${icon('plus','w-4 h-4')} Add Event</button>` : ''
    })}

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Calendar grid -->
      <div class="lg:col-span-2">
        <div class="card p-4">
          <!-- Month nav -->
          <div class="flex items-center justify-between mb-4">
            <button onclick="APP.go('cal_main',{month:${prevMonth.month},year:${prevMonth.year}})" class="btn btn-secondary px-3 py-1.5 text-sm">${icon('arrow_left','w-4 h-4')}</button>
            <h2 class="font-bold text-slate-900">${monthName}</h2>
            <button onclick="APP.go('cal_main',{month:${nextMonth.month},year:${nextMonth.year}})" class="btn btn-secondary px-3 py-1.5 text-sm">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
          </div>
          <!-- Day headers -->
          <div class="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 uppercase mb-2">
            ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="py-1">${d}</div>`).join('')}
          </div>
          <!-- Date cells -->
          <div class="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
            ${days.map(ds => {
              if (!ds) return `<div class="bg-white min-h-[64px]"></div>`;
              const dayEvents = eventsOn(ds);
              const isToday = ds === todayStr;
              const isPast  = ds < todayStr;
              return `<div class="bg-white min-h-[64px] p-1.5 ${isPast ? 'opacity-60' : ''} hover:bg-slate-50 transition-colors cursor-default" onclick="cal_showDay('${ds}')">
                <div class="text-xs font-bold mb-1 ${isToday ? 'w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center' : 'text-slate-600'}">${parseInt(ds.slice(8))}</div>
                ${dayEvents.slice(0,2).map(e => {
                  const t = CAL_TYPES[e.type] || CAL_TYPES.other;
                  return `<div class="text-xs truncate px-1 py-0.5 rounded mb-0.5 border ${t.color} leading-tight">${e.title}</div>`;
                }).join('')}
                ${dayEvents.length > 2 ? `<div class="text-xs text-slate-400 px-1">+${dayEvents.length-2} more</div>` : ''}
              </div>`;
            }).join('')}
          </div>
          <!-- Legend -->
          <div class="flex flex-wrap gap-3 mt-4">
            ${Object.entries(CAL_TYPES).map(([k,v]) => `<div class="flex items-center gap-1.5 text-xs text-slate-500"><span class="w-2.5 h-2.5 rounded-full ${v.dot}"></span>${v.label}</div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Upcoming events sidebar -->
      <div class="space-y-3">
        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Upcoming</h3>
        ${upcoming.length === 0 ? `<div class="card p-4 text-sm text-slate-400 text-center">No upcoming events in the next 90 days.</div>` :
          upcoming.map(e => {
            const t = CAL_TYPES[e.type] || CAL_TYPES.other;
            const dateStr = e.endDate && e.endDate !== e.startDate
              ? `${fdate(e.startDate, {short:true})} – ${fdate(e.endDate, {short:true})}`
              : fdate(e.startDate, {long:true});
            return `<div class="card p-3 cursor-pointer hover:shadow-md transition-shadow" onclick="cal_showEvent('${e.id}')">
              <div class="flex items-start gap-3">
                <span class="w-2.5 h-2.5 rounded-full ${t.dot} mt-1.5 flex-shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-900 text-sm leading-tight">${e.title}</div>
                  <div class="text-xs text-slate-400 mt-0.5">${dateStr}</div>
                  <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${t.color}">${t.label}</span>
                </div>
                ${isAdmin ? `<button onclick="event.stopPropagation();cal_deleteEvent('${e.id}')" class="text-slate-300 hover:text-red-400 flex-shrink-0">${icon('trash','w-4 h-4')}</button>` : ''}
              </div>
            </div>`;
          }).join('')}
      </div>
    </div>
  `;
}

function cal_showDay(ds) {
  const role = AUTH.current.role;
  const events = cal_eventsForRole(role).filter(e => ds >= e.startDate && ds <= (e.endDate || e.startDate));
  if (!events.length) return;
  if (events.length === 1) { cal_showEvent(events[0].id); return; }
  modal({
    title: fdate(ds, { long: true }),
    body: `<div class="space-y-2">
      ${events.map(e => {
        const t = CAL_TYPES[e.type] || CAL_TYPES.other;
        return `<div class="p-3 rounded-xl border ${t.color}">
          <div class="font-bold">${e.title}</div>
          ${e.description ? `<p class="text-sm mt-1 opacity-80">${e.description}</p>` : ''}
          <span class="text-xs font-semibold mt-1 inline-block">${t.label} · Audience: ${e.audience}</span>
        </div>`;
      }).join('')}
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function cal_showEvent(id) {
  const e = DB.find('schoolEvents', id);
  if (!e) return;
  const t = CAL_TYPES[e.type] || CAL_TYPES.other;
  const isAdmin = AUTH.current.role === 'schooladmin' || AUTH.current.role === 'principal';
  const dateStr = e.endDate && e.endDate !== e.startDate
    ? `${fdate(e.startDate, {long:true})} – ${fdate(e.endDate, {long:true})}`
    : fdate(e.startDate, {long:true});
  modal({
    title: e.title,
    body: `<div class="space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-3 py-1 rounded-full border text-sm font-semibold ${t.color}">${t.label}</span>
        <span class="text-sm text-slate-500">${dateStr}</span>
      </div>
      <div class="bg-slate-50 rounded-xl p-3">
        <div class="text-xs uppercase font-semibold text-slate-400 mb-1">Audience</div>
        <div class="text-sm font-semibold text-slate-700 capitalize">${e.audience}</div>
      </div>
      ${e.description ? `<p class="text-sm text-slate-700">${e.description}</p>` : ''}
    </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      ${isAdmin ? `<button class="btn btn-danger" onclick="document.getElementById('modalBackdrop').click();cal_deleteEvent('${e.id}')">Delete Event</button>` : ''}
    `
  });
}

function cal_addEventModal() {
  modal({
    title: 'Add School Event',
    size: 'lg',
    body: `<div class="space-y-3">
      <div><label class="input-label">Event Title *</label>
        <input id="ce_title" class="input" placeholder="e.g. PTA Meeting, Sports Day, Mid-Term Break"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Start Date *</label><input id="ce_start" type="date" class="input"></div>
        <div><label class="input-label">End Date (for multi-day events)</label><input id="ce_end" type="date" class="input"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Event Type</label>
          <select id="ce_type" class="input">
            ${Object.entries(CAL_TYPES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select></div>
        <div><label class="input-label">Audience</label>
          <select id="ce_audience" class="input">
            <option value="all">Everyone</option>
            <option value="parents">Parents Only</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
          </select></div>
      </div>
      <div><label class="input-label">Description (optional)</label>
        <textarea id="ce_desc" rows="3" class="input" placeholder="Additional details shown when staff or parents click on the event..."></textarea></div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="cal_saveEvent()">Save Event</button>`
  });
  // Default start to today
  const el = document.getElementById('ce_start');
  if (el) el.value = today();
}

function cal_saveEvent() {
  const title = (document.getElementById('ce_title') || {}).value.trim();
  const startDate = (document.getElementById('ce_start') || {}).value;
  const endDate   = (document.getElementById('ce_end')   || {}).value || startDate;
  const type      = (document.getElementById('ce_type')  || {}).value;
  const audience  = (document.getElementById('ce_audience') || {}).value;
  const desc      = (document.getElementById('ce_desc')  || {}).value.trim();
  if (!title || !startDate) { toast('Title and start date are required', 'danger'); return; }
  if (endDate < startDate)  { toast('End date cannot be before start date', 'danger'); return; }
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  DB.insert('schoolEvents', { id: uid('evt'), schoolId, title, startDate, endDate, type, audience, description: desc, createdBy: AUTH.current.id, createdAt: now() });
  document.getElementById('modalBackdrop').click();
  const d = new Date(startDate);
  APP.go('cal_main', { month: d.getMonth(), year: d.getFullYear() });
  toast('Event added to calendar', 'success');
}

function cal_deleteEvent(id) {
  confirm('Delete this event from the calendar?', () => {
    DB.remove('schoolEvents', id);
    APP.render();
    toast('Event deleted');
  }, { danger: true });
}
