/* ============================================================
   EVENT CALENDAR MODULE
   - All roles see the school calendar
   - Admin can create / edit / delete events
   - Events filtered by audience
   ============================================================ */

const CAL_TYPES = {
  holiday:   { label: 'Holiday',      color: 'bg-red-100 text-red-700 border-red-200',      dot: 'bg-red-500' },
  meeting:   { label: 'Meeting',      color: 'bg-brand-100 text-brand-700 border-brand-200',    dot: 'bg-brand-500' },
  event:     { label: 'Event',        color: 'bg-brand-100 text-brand-700 border-brand-200', dot: 'bg-brand-500' },
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

function cal_renderCalendar(params) {
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
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Calendar grid -->
      <div class="lg:col-span-2">
        <div class="card p-4">
          <!-- Month nav -->
          <div class="flex items-center justify-between mb-4">
            <button onclick="APP.params.month=${prevMonth.month};APP.params.year=${prevMonth.year};APP.render()" class="btn btn-secondary px-3 py-1.5 text-sm">${icon('arrow_left','w-4 h-4')}</button>
            <h2 class="font-bold text-slate-900">${monthName}</h2>
            <button onclick="APP.params.month=${nextMonth.month};APP.params.year=${nextMonth.year};APP.render()" class="btn btn-secondary px-3 py-1.5 text-sm">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
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
                <div class="text-xs font-bold mb-1 ${isToday ? 'w-5 h-5 bg-brand-600 text-navy-800 rounded-full flex items-center justify-center' : 'text-slate-600'}">${parseInt(ds.slice(8))}</div>
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

function view_cal_main(params) {
  const role = AUTH.current.role;
  const isAdmin = role === 'schooladmin' || role === 'principal';
  const activeTab = (APP.params && APP.params.calTab) || 'calendar';

  const tabBar = `<div class="flex gap-2 mb-4 border-b border-slate-200 pb-1">
    <button onclick="APP.params.calTab='calendar'; APP.render()" class="px-4 py-2 text-sm font-medium rounded-t ${activeTab === 'calendar' ? 'bg-white border border-b-white border-slate-200 text-brand-600' : 'text-slate-500 hover:text-slate-700'}">
      <i class="ph ph-calendar mr-1"></i>Calendar
    </button>
    <button onclick="APP.params.calTab='academic_year'; APP.render()" class="px-4 py-2 text-sm font-medium rounded-t ${activeTab === 'academic_year' ? 'bg-white border border-b-white border-slate-200 text-brand-600' : 'text-slate-500 hover:text-slate-700'}">
      <i class="ph ph-graduation-cap mr-1"></i>Academic Year
    </button>
    <button onclick="APP.params.calTab='noticeboard'; APP.render()" class="px-4 py-2 text-sm font-medium rounded-t ${activeTab === 'noticeboard' ? 'bg-white border border-b-white border-slate-200 text-brand-600' : 'text-slate-500 hover:text-slate-700'}">
      <i class="ph ph-note mr-1"></i>Notice Board
    </button>
  </div>`;

  const header = pageHeader({
    title: 'School Calendar',
    subtitle: 'Upcoming events, holidays, and important dates',
    actions: isAdmin && activeTab === 'calendar' ? `<button class="btn btn-primary" onclick="cal_addEventModal()">${icon('plus','w-4 h-4')} Add Event</button>` : ''
  });

  const content = activeTab === 'noticeboard' ? cal_renderNoticeBoard() :
                  activeTab === 'academic_year' ? cal_renderAcademicYear() :
                  cal_renderCalendar(params);

  return `${header}${tabBar}${content}`;
}

function cal_showDay(ds) {
  const role = AUTH.current.role;
  const events = cal_eventsForRole(role).filter(e => ds >= e.startDate && ds <= (e.endDate || e.startDate));
  if (!events.length) { toast('No events on this day', 'info'); return; }
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
      ${(AUTH.current.role === 'schooladmin' || AUTH.current.role === 'principal') ? '<button class="btn btn-secondary btn-sm" onclick="cal_editEventModal(\''+e.id+'\')">Edit</button>' : ''}
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
  APP.params.month = new Date(startDate).getMonth();
  APP.params.year = new Date(startDate).getFullYear();
  APP.render();
  toast('Event added to calendar', 'success');
}

function cal_deleteEvent(id) {
  if (AUTH.current.role !== 'schooladmin' && AUTH.current.role !== 'principal') {
    toast('Only admins can delete events', 'danger');
    return;
  }
  confirm('Delete this event from the calendar?', () => {
    DB.remove('schoolEvents', id);
    APP.render();
    toast('Event deleted', 'info');
  }, { danger: true });
}

function cal_editEventModal(id) {
  const ev = DB.find('schoolEvents', id);
  if (!ev) return;
  modal({
    title: 'Edit Event',
    size: 'md',
    body: `<div class="space-y-3">
      <div><label class="input-label">Title *</label><input id="ce_edit_title" class="input" value="${ev.title || ''}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Start Date</label><input id="ce_edit_start" type="date" class="input" value="${ev.startDate || ev.date || ''}"></div>
        <div><label class="input-label">End Date</label><input id="ce_edit_end" type="date" class="input" value="${ev.endDate || ev.date || ''}"></div>
      </div>
      <div><label class="input-label">Type</label>
        <select id="ce_edit_type" class="input">
          ${['Holiday','Academic','Sports','Meeting','Exam','Other'].map(t => '<option value="'+t+'"'+(ev.type===t?' selected':'')+'>'+t+'</option>').join('')}
        </select>
      </div>
      <div><label class="input-label">Audience</label>
        <select id="ce_edit_audience" class="input">
          ${['all','students','parents','teachers'].map(a => '<option value="'+a+'"'+(ev.audience===a?' selected':'')+'>'+({all:'Everyone',students:'Students',parents:'Parents',teachers:'Teachers'}[a])+'</option>').join('')}
        </select>
      </div>
      <div><label class="input-label">Description</label><textarea id="ce_edit_desc" class="input" rows="2">${ev.description || ''}</textarea></div>
    </div>`,
    footer: '<button class="btn btn-secondary" onclick="document.getElementById(\'modalBackdrop\').click()">Cancel</button><button class="btn btn-primary" onclick="cal_saveEdit(\''+id+'\')">Save Changes</button>'
  });
}

function cal_saveEdit(id) {
  const title = (document.getElementById('ce_edit_title') || {}).value.trim();
  if (!title) { toast('Title is required', 'danger'); return; }
  DB.update('schoolEvents', id, {
    title,
    startDate: (document.getElementById('ce_edit_start') || {}).value,
    endDate: (document.getElementById('ce_edit_end') || {}).value,
    type: (document.getElementById('ce_edit_type') || {}).value,
    audience: (document.getElementById('ce_edit_audience') || {}).value,
    description: (document.getElementById('ce_edit_desc') || {}).value.trim()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Event updated', 'success');
}

/* ============================================================
   ACADEMIC YEAR OVERVIEW
   ============================================================ */

function cal_schoolDays(startDate, endDate, excludeRanges, holidayDates) {
  // Count Mon–Fri days between startDate and endDate (inclusive), minus excluded ranges and holidays
  if (!startDate || !endDate || endDate < startDate) return 0;
  let count = 0;
  const d = new Date(startDate);
  const end = new Date(endDate);
  const excluded = new Set(holidayDates || []);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      const ds = d.toISOString().slice(0, 10);
      const inBreak = (excludeRanges || []).some(r => ds >= r.start && ds <= r.end);
      if (!inBreak && !excluded.has(ds)) count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function cal_renderAcademicYear() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const isAdmin = AUTH.current.role === 'schooladmin' || AUTH.current.role === 'principal';
  const s = DB.settings();
  const atd = s.academicTermDates;

  const hasAnyDate = atd && (atd.session || (atd.terms && atd.terms.some(t =>
    Object.entries(t).some(([k, v]) => k !== 'name' && v)
  )));
  if (!hasAnyDate) {
    return `
      <div class="card p-8 text-center">
        <div class="text-4xl mb-3">📅</div>
        <h3 class="font-bold text-slate-900 mb-2">Academic Year Not Configured</h3>
        <p class="text-sm text-slate-500 mb-4">Set the term dates in Settings → Calendar to generate the academic year overview.</p>
        ${isAdmin ? `<button class="btn btn-primary" onclick="APP.go('adm_settings', { setTab: 'calendar' })">${icon('settings','w-4 h-4')} Configure Term Dates</button>` : '<p class="text-sm text-slate-400">Please ask your school admin to configure the academic calendar.</p>'}
      </div>
    `;
  }

  // All school events (shown per-term in the academic year view)
  const holidays = DB.query('schoolEvents', e => e.schoolId === schoolId);
  const holidayDates = holidays.filter(h => h.type === 'holiday').map(h => h.startDate);

  const termColors = [
    { bg: 'bg-brand-50', border: 'border-brand-300', header: 'bg-brand-600', text: 'text-brand-900', label: 'text-brand-700' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', header: 'bg-emerald-600', text: 'text-emerald-900', label: 'text-emerald-700' },
    { bg: 'bg-amber-50', border: 'border-amber-300', header: 'bg-amber-600', text: 'text-amber-900', label: 'text-amber-700' }
  ];

  const rows = (term, ti) => {
    const c = termColors[ti] || termColors[0];
    const midBreak = (term.midtermStart && term.midtermEnd) ? [{ start: term.midtermStart, end: term.midtermEnd }] : [];
    const totalDays = cal_schoolDays(term.resumptionDate, term.termEndDate, midBreak, holidayDates);

    // School events that fall within this term
    const termHolidays = holidays.filter(h =>
      term.resumptionDate && term.termEndDate &&
      h.startDate >= term.resumptionDate && h.startDate <= term.termEndDate
    ).sort((a, b) => a.startDate.localeCompare(b.startDate));

    const row = (label, value, highlight) => value ? `
      <tr class="${highlight ? c.bg : 'bg-white'}">
        <td class="px-4 py-2.5 text-sm font-semibold text-slate-700 whitespace-nowrap w-48">${label}</td>
        <td class="px-4 py-2.5 text-sm text-slate-800">${value}</td>
        <td class="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap text-right"></td>
      </tr>` : '';

    const fmt = d => d ? fdate(d, { long: true }) : '—';
    const fmtRange = (s, e) => (s && e) ? `${fdate(s, { long: true })} – ${fdate(e, { long: true })}` : (s ? fdate(s, { long: true }) : '—');

    const midtermDays = cal_schoolDays(term.midtermStart, term.midtermEnd, [], []);
    const firstHalfDays = cal_schoolDays(term.resumptionDate, term.firstHalfEnd, [], holidayDates);
    const secondHalfDays = cal_schoolDays(term.secondHalfStart, term.termEndDate, [], holidayDates);

    return `
      <div class="card overflow-hidden mb-5 border ${c.border}">
        <div class="${c.header} text-white px-5 py-3 flex items-center justify-between">
          <div class="font-bold text-lg">${term.name}</div>
          ${atd.session ? `<div class="text-sm opacity-80">${atd.session}</div>` : ''}
        </div>
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 text-left w-48">Description</th>
              <th class="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 text-left">Date</th>
              <th class="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 text-right">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${term.staffPDDate ? `<tr class="bg-white"><td class="px-4 py-2.5 text-sm font-semibold text-slate-700">Staff PD / Inservice</td><td class="px-4 py-2.5 text-sm text-slate-800">${fmt(term.staffPDDate)}</td><td class="px-4 py-2.5 text-xs text-right text-slate-500">1 day</td></tr>` : ''}
            ${term.resumptionDate ? `<tr class="${c.bg}"><td class="px-4 py-2.5 text-sm font-bold ${c.label}">Resumption</td><td class="px-4 py-2.5 text-sm font-semibold text-slate-900">${fmt(term.resumptionDate)}</td><td class="px-4 py-2.5 text-xs text-right text-slate-500"></td></tr>` : ''}
            ${(term.resumptionDate && term.firstHalfEnd) ? `<tr class="bg-white"><td class="px-4 py-2.5 text-sm font-semibold text-slate-700">First Half</td><td class="px-4 py-2.5 text-sm text-slate-800">${fmtRange(term.resumptionDate, term.firstHalfEnd)}</td><td class="px-4 py-2.5 text-xs text-right ${c.label} font-bold">${firstHalfDays} days</td></tr>` : ''}
            ${term.openDayDate ? `<tr class="bg-white"><td class="px-4 py-2.5 text-sm font-semibold text-slate-700">Open Day</td><td class="px-4 py-2.5 text-sm text-slate-800">${fmt(term.openDayDate)}</td><td class="px-4 py-2.5 text-xs text-right text-slate-500">1 day</td></tr>` : ''}
            ${(term.midtermStart && term.midtermEnd) ? `<tr class="bg-red-50"><td class="px-4 py-2.5 text-sm font-semibold text-red-700">Mid-Term Break</td><td class="px-4 py-2.5 text-sm text-red-800">${fmtRange(term.midtermStart, term.midtermEnd)}</td><td class="px-4 py-2.5 text-xs text-right text-red-600 font-bold">${midtermDays} days</td></tr>` : ''}
            ${(term.secondHalfStart && term.termEndDate) ? `<tr class="bg-white"><td class="px-4 py-2.5 text-sm font-semibold text-slate-700">Second Half</td><td class="px-4 py-2.5 text-sm text-slate-800">${fmtRange(term.secondHalfStart, term.termEndDate)}</td><td class="px-4 py-2.5 text-xs text-right ${c.label} font-bold">${secondHalfDays} days</td></tr>` : ''}
            ${termHolidays.length ? `
              <tr class="bg-brand-50">
                <td class="px-4 py-2.5 text-sm font-semibold text-brand-700 align-top">School Events</td>
                <td class="px-4 py-2.5 text-sm text-slate-800" colspan="2">
                  <div class="space-y-1.5">
                    ${termHolidays.map(h => {
                      const typeColor = h.type==='exam'?'bg-red-100 text-red-700':h.type==='holiday'?'bg-brand-100 text-brand-700':h.type==='meeting'?'bg-amber-100 text-amber-700':h.type==='milestone'?'bg-emerald-100 text-emerald-700':'bg-brand-100 text-brand-700';
                      const dateStr = h.endDate && h.endDate !== h.startDate ? `${fdate(h.startDate,{long:true})} – ${fdate(h.endDate,{long:true})}` : fdate(h.startDate,{long:true});
                      return `<div class="flex items-center gap-2"><span class="text-xs px-2 py-0.5 rounded-full font-semibold ${typeColor}">${h.type}</span><span>${h.title}</span><span class="text-slate-400 text-xs">— ${dateStr}</span></div>`;
                    }).join('')}
                  </div>
                </td>
              </tr>` : ''}
            ${term.vacationStart ? `<tr class="${c.bg}"><td class="px-4 py-2.5 text-sm font-bold ${c.label}">Vacation</td><td class="px-4 py-2.5 text-sm text-slate-800">${fmtRange(term.vacationStart, term.vacationEnd)}</td><td class="px-4 py-2.5 text-xs text-right text-slate-500">${cal_schoolDays(term.vacationStart, term.vacationEnd || term.vacationStart, [], [])} days</td></tr>` : ''}
          </tbody>
          ${totalDays ? `
          <tfoot>
            <tr class="${c.header} text-white">
              <td class="px-4 py-3 font-bold text-sm" colspan="2">Total Days in School (${term.name})</td>
              <td class="px-4 py-3 font-extrabold text-lg text-right">${totalDays} Days</td>
            </tr>
          </tfoot>` : ''}
        </table>
      </div>
    `;
  };

  return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-slate-900 text-lg">Academic Calendar ${atd.session ? `— ${atd.session}` : ''}</h2>
        <p class="text-xs text-slate-500 mt-0.5">Lagos State Harmonised Academic Calendar · Term-by-term overview</p>
      </div>
      ${isAdmin ? `<button class="btn btn-secondary text-sm" onclick="APP.go('adm_settings', { setTab: 'calendar' })">${icon('settings','w-4 h-4')} Edit Term Dates</button>` : ''}
    </div>
    ${atd.terms.map((term, ti) => rows(term, ti)).join('')}
  `;
}

/* ============================================================
   NOTICE BOARD
   ============================================================ */

function cal_renderNoticeBoard() {
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const role = AUTH.current.role;
  const canPost = role === 'schooladmin' || role === 'principal';

  // Build audience filter for this role
  let audience = ['all'];
  if (role === 'teacher') audience = ['all', 'teachers'];
  else if (role === 'student') audience = ['all', 'students'];
  else if (role === 'parent') audience = ['all', 'parents'];
  else if (canPost) audience = ['all', 'teachers', 'students', 'parents'];

  const notices = DB.query('announcements', a =>
    a.schoolId === schoolId && audience.includes(a.audience)
  ).sort((a, b) => (b.createdAt || b.timestamp || '').localeCompare(a.createdAt || a.timestamp || ''));

  const audienceLabels = { all: 'Everyone', teachers: 'Teachers', students: 'Students', parents: 'Parents' };

  const postBtn = canPost ? `<button class="btn btn-primary btn-sm" onclick="cal_newNoticeModal()">
    <i class="ph ph-plus mr-1"></i>Post Notice
  </button>` : '';

  const noticeCards = notices.length === 0
    ? `<div class="text-center py-12 text-slate-500">
         <i class="ph ph-note text-4xl block mb-2"></i>
         <p>No notices posted yet.</p>
       </div>`
    : notices.map(n => `
      <div class="card p-4 border-l-4 border-brand-400">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-slate-800">${n.title || 'Notice'}</span>
              <span class="badge badge-info text-xs">${audienceLabels[n.audience] || n.audience || 'Everyone'}</span>
            </div>
            <p class="text-sm text-slate-600 whitespace-pre-line">${n.body || n.message || ''}</p>
            <p class="text-xs text-slate-400 mt-2">${n.authorName || 'School Admin'} · ${(n.createdAt || n.timestamp || '').slice(0, 10)}</p>
          </div>
          ${canPost ? `<button onclick="cal_deleteNotice('${n.id}')" class="btn btn-sm text-slate-400 hover:text-rose-500" title="Delete"><i class="ph ph-trash"></i></button>` : ''}
        </div>
      </div>`).join('');

  return `<div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Notice Board</h2>
        <p class="text-sm text-slate-500">Pinned announcements from the school</p>
      </div>
      ${postBtn}
    </div>
    <div class="space-y-3">${noticeCards}</div>
  </div>`;
}

function cal_newNoticeModal() {
  modal({
    title: 'Post a Notice',
    size: 'md',
    body: `<div class="space-y-3">
      <div><label class="input-label">Title *</label><input id="cn_title" class="input" placeholder="e.g. School Closure Notice"></div>
      <div><label class="input-label">Message *</label><textarea id="cn_body" class="input" rows="4" placeholder="Write the notice here..."></textarea></div>
      <div><label class="input-label">Visible to</label>
        <select id="cn_audience" class="input">
          <option value="all">Everyone</option>
          <option value="parents">Parents only</option>
          <option value="teachers">Teachers only</option>
          <option value="students">Students only</option>
        </select>
      </div>
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="cal_saveNotice()">Post Notice</button>`
  });
}

function cal_saveNotice() {
  const title = (document.getElementById('cn_title') || {}).value.trim();
  const body = (document.getElementById('cn_body') || {}).value.trim();
  if (!title || !body) { toast('Title and message are required', 'danger'); return; }
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  const audience = (document.getElementById('cn_audience') || {}).value || 'all';
  DB.insert('announcements', {
    id: uid('ann'),
    schoolId,
    title,
    body,
    audience,
    authorId: AUTH.current.id,
    authorName: AUTH.current.name,
    createdAt: now(),
    timestamp: now()
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Notice posted', 'success');
}

function cal_deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  DB.remove('announcements', id);
  APP.render();
  toast('Notice removed', 'info');
}
