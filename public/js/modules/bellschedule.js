/* ============================================================
   Bell Schedule — the shape of the school day
   ------------------------------------------------------------
   The day is ONE ORDERED LIST of typed rows. A break is not a
   special case pinned to a period number — it is a row whose
   type is 'break', with its own real start and end times.

   The previous model could only ever express eight periods and
   exactly two breaks, and stored each break's times inside its
   display label ("Short Break (10:40-11:00)"), so nothing could
   validate an overlap or print a real time. Schools running one
   break, or three, or a six-period day, or a registration slot,
   had no way to say so.

   {
     slots: [
       { type: 'teaching', label: 'Period 1',    start: '08:00', end: '08:40' },
       { type: 'break',    label: 'Short Break', start: '09:20', end: '09:40' },
       ...
     ]
   }

   Period numbers are DERIVED: the nth teaching row is period n.
   Breaks never consume a number, so inserting one mid-morning
   does not renumber the afternoon.

   Stored settings in the old shape are converted on read, so
   nothing has to be migrated before this file is useful.
   ============================================================ */

/* Only one distinction has any behaviour behind it: does this row hold a
   lesson and take a period number, or not. Assembly, registration and the
   rest are just named rows — the Name column already says which. */
const BELL_TYPES = [
  { key: 'teaching', label: 'Period' },
  { key: 'break',    label: 'Break' }
];

/* The shape a school gets before it configures anything. */
function bellDefaultSlots() {
  return [
    { type: 'teaching', label: 'Period 1', start: '08:00', end: '08:40' },
    { type: 'teaching', label: 'Period 2', start: '08:40', end: '09:20' },
    { type: 'teaching', label: 'Period 3', start: '09:20', end: '10:00' },
    { type: 'teaching', label: 'Period 4', start: '10:00', end: '10:40' },
    { type: 'break',    label: 'Short Break', start: '10:40', end: '11:00' },
    { type: 'teaching', label: 'Period 5', start: '11:00', end: '11:40' },
    { type: 'teaching', label: 'Period 6', start: '11:40', end: '12:20' },
    { type: 'break',    label: 'Lunch',   start: '12:20', end: '13:00' },
    { type: 'teaching', label: 'Period 7', start: '13:00', end: '13:40' },
    { type: 'teaching', label: 'Period 8', start: '13:40', end: '14:20' }
  ];
}

function bellMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return null;
  const h = Number(m[1]), mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}
function bellHHMM(mins) {
  const v = Math.max(0, Math.min(24 * 60 - 1, Math.round(mins)));
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}
function bellDuration(slot) {
  const a = bellMinutes(slot.start), b = bellMinutes(slot.end);
  return (a == null || b == null) ? null : b - a;
}
function _bellEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Convert a stored config in the old shape. The break labels carried their
   times in brackets — "Short Break (10:40-11:00)" — so pull them back out
   where possible and otherwise infer the gap between the periods either side. */
function bellFromLegacy(cfg) {
  const times = cfg.periodTimes || {};
  const nums = Object.keys(times).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
  if (!nums.length) return bellDefaultSlots();

  const parseLabel = (label) => {
    const m = /\((\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\)/.exec(String(label || ''));
    return m ? { start: m[1], end: m[2], name: String(label).replace(/\s*\(.*\)\s*$/, '').trim() } : null;
  };

  const out = [];
  nums.forEach((n, i) => {
    const range = String(times[n] || '').split(/[-–—]/).map(s => s.trim());
    out.push({ type: 'teaching', label: `Period ${i + 1}`, start: range[0] || '', end: range[1] || '' });

    [[cfg.break1After, cfg.break1Label, 'Short Break'], [cfg.break2After, cfg.break2Label, 'Lunch']].forEach(([after, label, fallback]) => {
      if (after !== n) return;
      const parsed = parseLabel(label);
      const nextRange = String(times[nums[i + 1]] || '').split(/[-–—]/).map(s => s.trim());
      out.push({
        type: 'break',
        label: (parsed && parsed.name) || String(label || fallback).replace(/\s*\(.*\)\s*$/, '').trim() || fallback,
        start: parsed ? parsed.start : (range[1] || ''),
        end: parsed ? parsed.end : (nextRange[0] || '')
      });
    });
  });
  return out;
}

/* The canonical schedule. Accepts either shape in storage. */
function bellSlots() {
  const cfg = DB.settings().timetableConfig || {};
  if (Array.isArray(cfg.slots) && cfg.slots.length) {
    return cfg.slots.map(s => Object.assign({}, s, { type: s.type === 'teaching' ? 'teaching' : 'break' }));
  }
  if (cfg.periodTimes) return bellFromLegacy(cfg);
  return bellDefaultSlots();
}

/* Rows with derived period numbers attached — what every timetable grid
   should iterate instead of assuming 1..8 with breaks bolted on. */
function bellRows() {
  let n = 0;
  return bellSlots().map(s => {
    const teaching = s.type === 'teaching';
    if (teaching) n++;
    return Object.assign({}, s, { period: teaching ? n : null, isBreak: !teaching });
  });
}

function bellTeaching() { return bellRows().filter(r => r.period); }
function bellPeriodCount() { return bellTeaching().length; }

/* "08:00-08:40" for a period number — the form most existing screens want. */
function bellTimeLabel(period) {
  const r = bellTeaching().find(x => x.period === period);
  return r ? `${r.start}-${r.end}` : '';
}

/* The legacy view of the schedule, for screens not yet rewritten. Only the
   first two non-teaching rows survive the round trip — which is exactly the
   limitation this model exists to remove, so prefer bellRows(). */
function bellLegacy() {
  const rows = bellRows();
  const periodTimes = {};
  rows.filter(r => r.period).forEach(r => { periodTimes[r.period] = `${r.start}-${r.end}`; });
  const breaks = [];
  rows.forEach((r, i) => {
    if (r.period) return;
    let after = 0;
    for (let j = i - 1; j >= 0; j--) if (rows[j].period) { after = rows[j].period; break; }
    breaks.push({ after, label: `${r.label} (${r.start}–${r.end})` });
  });
  return {
    periodTimes,
    break1After: breaks[0] ? breaks[0].after : 0,
    break1Label: breaks[0] ? breaks[0].label : '',
    break2After: breaks[1] ? breaks[1].after : 0,
    break2Label: breaks[1] ? breaks[1].label : ''
  };
}

/* ---------- validation ---------- */
function bellProblems(slots) {
  const errors = [];
  const warnings = [];
  slots.forEach((s, i) => {
    const a = bellMinutes(s.start), b = bellMinutes(s.end);
    const where = `Row ${i + 1}${s.label ? ` (${s.label})` : ''}`;
    if (!String(s.label || '').trim()) errors.push(`${where} — needs a name.`);
    if (a == null) errors.push(`${where} — start time is not a valid 24-hour time.`);
    if (b == null) errors.push(`${where} — end time is not a valid 24-hour time.`);
    if (a != null && b != null && b <= a) errors.push(`${where} — ends at or before it starts.`);
    if (i > 0) {
      const prev = slots[i - 1];
      const pe = bellMinutes(prev.end);
      if (pe != null && a != null) {
        if (a < pe) errors.push(`${where} — starts at ${s.start}, before ${prev.label || 'the previous row'} ends at ${prev.end}.`);
        else if (a > pe) warnings.push(`${where} — begins ${a - pe} min after ${prev.label || 'the previous row'} ends. Unaccounted time.`);
      }
    }
  });
  if (!slots.some(s => s.type === 'teaching')) errors.push('The day needs at least one teaching period.');
  return { errors, warnings };
}

/* ============================================================
   CONFIG UI — overrides ttTimeConfigModal() from admin.js
   ============================================================ */

let _bellDraft = null;

function ttTimeConfigModal() {
  _bellDraft = bellSlots();
  modal({
    title: 'Times & Breaks',
    size: 'lg',
    body: '<div id="bellBody"></div>',
    footer: '<div id="bellFooter" class="flex items-center gap-3 w-full justify-end"></div>',
    onClose: () => { _bellDraft = null; }
  });
  bellRender();
}

function bellRender() {
  const body = document.getElementById('bellBody');
  const foot = document.getElementById('bellFooter');
  if (!body || !foot) return;
  body.innerHTML = bellEditorHtml();
  foot.innerHTML = bellFooterHtml();
}

function bellEditorHtml() {
  const slots = _bellDraft;
  const { errors, warnings } = bellProblems(slots);
  const first = bellMinutes(slots[0] && slots[0].start);
  const last = bellMinutes(slots[slots.length - 1] && slots[slots.length - 1].end);
  const dayLen = (first != null && last != null && last > first) ? last - first : null;
  const teachMins = slots.filter(s => s.type === 'teaching')
    .reduce((sum, s) => sum + (bellDuration(s) || 0), 0);
  let n = 0;

  return `
    <p class="text-sm text-slate-600">Describe your school day. A break is a row like any other — add as many as you need.</p>

    <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-3 mb-3">
      <span>${slots.filter(s => s.type === 'teaching').length} teaching periods</span>
      <span>${slots.filter(s => s.type !== 'teaching').length} other rows</span>
      ${dayLen != null ? `<span>Day ${Math.floor(dayLen / 60)}h ${dayLen % 60}m</span>` : ''}
      <span>Teaching ${Math.floor(teachMins / 60)}h ${teachMins % 60}m</span>
    </div>

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead>
          <tr>
            <th scope="col" class="w-10"></th>
            <th scope="col" class="w-32">Type</th>
            <th scope="col">Name</th>
            <th scope="col" class="w-28">Start</th>
            <th scope="col" class="w-28">End</th>
            <th scope="col" class="num w-16">Mins</th>
            <th scope="col" class="w-10"></th>
          </tr>
        </thead>
        <tbody>
          ${slots.map((s, i) => {
            const teaching = s.type === 'teaching';
            if (teaching) n++;
            const mins = bellDuration(s);
            return `<tr class="${teaching ? '' : 'bg-amber-50'}">
              <td class="text-xs font-bold text-slate-400 text-center">${teaching ? 'P' + n : '—'}</td>
              <td>
                <select class="input !py-1 text-xs" onchange="bellSet(${i},'type',this.value)">
                  ${BELL_TYPES.map(t => `<option value="${t.key}" ${s.type === t.key ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
              </td>
              <td><input class="input !py-1 text-sm" value="${_bellEsc(s.label)}" onchange="bellSet(${i},'label',this.value)" /></td>
              <td><input type="time" class="input !py-1 text-sm font-mono" value="${_bellEsc(s.start)}" onchange="bellSetStart(${i},this.value)" /></td>
              <td><input type="time" class="input !py-1 text-sm font-mono" value="${_bellEsc(s.end)}" onchange="bellSetEnd(${i},this.value)" /></td>
              <td class="num text-xs font-mono ${mins == null || mins <= 0 ? 'text-rose-600' : 'text-slate-500'}">${mins == null ? '—' : mins}</td>
              <td class="text-right">
                <button class="btn btn-ghost !p-1 text-slate-400 hover:text-rose-600" aria-label="Remove row" title="Remove row"
                        onclick="bellRemove(${i})">${icon('x','w-4 h-4')}</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap gap-2 mt-3">
      <button class="btn btn-secondary text-sm" onclick="bellAdd('teaching')">${icon('plus','w-4 h-4')} Add period</button>
      <button class="btn btn-secondary text-sm" onclick="bellAdd('break')">${icon('plus','w-4 h-4')} Add break</button>
      <button class="btn btn-ghost text-sm ml-auto" onclick="bellReset()">Reset to default</button>
    </div>

    ${errors.length ? `<div class="rounded-xl bg-rose-50 px-4 py-3 mt-3">
      <div class="text-sm font-bold text-rose-900 mb-1">${errors.length} problem${errors.length === 1 ? '' : 's'} to fix</div>
      ${errors.slice(0, 8).map(e => `<div class="text-xs text-rose-800">${_bellEsc(e)}</div>`).join('')}
    </div>` : ''}

    ${warnings.length ? `<div class="rounded-xl bg-amber-50 px-4 py-3 mt-3">
      ${warnings.slice(0, 5).map(w => `<div class="text-xs text-amber-900">${_bellEsc(w)}</div>`).join('')}
    </div>` : ''}

    <p class="text-xs text-slate-500 mt-3">Applies to every day of the week. Per-day variations are not supported yet.</p>
  `;
}

function bellFooterHtml() {
  const bad = bellProblems(_bellDraft).errors.length;
  return `
    <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
    <button class="btn btn-primary" ${bad ? 'disabled' : ''} onclick="bellSave()">${icon('check','w-4 h-4')} Save</button>`;
}

/* ---------- draft edits ---------- */
function bellSet(i, field, value) {
  if (!_bellDraft[i]) return;
  _bellDraft[i][field] = field === 'label' ? String(value) : value;
  if (field === 'type') bellRenumber();
  bellRender();
}

/* Moving a row's start shifts the row only; moving its end cascades, because
   that is what a school means by "periods are 35 minutes now". */
function bellSetStart(i, value) {
  if (!_bellDraft[i]) return;
  _bellDraft[i].start = value;
  bellRender();
}

function bellSetEnd(i, value) {
  const slot = _bellDraft[i];
  if (!slot) return;
  const oldEnd = bellMinutes(slot.end);
  const newEnd = bellMinutes(value);
  slot.end = value;
  if (oldEnd == null || newEnd == null) { bellRender(); return; }
  const shift = newEnd - oldEnd;
  if (shift !== 0) {
    for (let j = i + 1; j < _bellDraft.length; j++) {
      const s = bellMinutes(_bellDraft[j].start), e = bellMinutes(_bellDraft[j].end);
      if (s != null) _bellDraft[j].start = bellHHMM(s + shift);
      if (e != null) _bellDraft[j].end = bellHHMM(e + shift);
    }
  }
  bellRender();
}

/* Teaching rows are always named Period n unless the school renamed one. */
function bellRenumber() {
  let n = 0;
  _bellDraft.forEach(s => {
    if (s.type !== 'teaching') return;
    n++;
    if (/^period\s*\d*$/i.test(String(s.label || '').trim())) s.label = `Period ${n}`;
  });
}

function bellAdd(type) {
  const last = _bellDraft[_bellDraft.length - 1];
  const start = last ? last.end : '08:00';
  const len = type === 'teaching' ? 40 : 20;
  const s = bellMinutes(start);
  _bellDraft.push({
    type,
    label: type === 'teaching' ? `Period ${_bellDraft.filter(x => x.type === 'teaching').length + 1}` : 'Break',
    start: start || '08:00',
    end: bellHHMM((s == null ? 480 : s) + len)
  });
  bellRender();
}

function bellRemove(i) {
  _bellDraft.splice(i, 1);
  bellRenumber();
  bellRender();
}

function bellReset() {
  _bellDraft = bellDefaultSlots();
  bellRender();
}

function bellSave() {
  const { errors } = bellProblems(_bellDraft);
  if (errors.length) { toast('Fix the highlighted problems first', 'danger'); return; }

  const before = bellPeriodCount();
  const slots = _bellDraft.map(s => ({
    type: s.type,
    label: String(s.label || '').trim(),
    start: s.start,
    end: s.end
  }));
  DB.settings({ timetableConfig: { slots } });
  const after = bellPeriodCount();

  DB.insert('auditLog', {
    id: uid('aud'), schoolId: currentSchoolId(),
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'updated_bell_schedule',
    target: `${after} teaching periods, ${slots.filter(s => s.type !== 'teaching').length} breaks`,
    timestamp: now()
  });

  document.getElementById('modalBackdrop')?.click();
  APP.render();
  // Losing periods orphans anything already scheduled in them.
  if (after < before) {
    toast(`Saved. The day is now ${after} periods — anything already timetabled in periods ${after + 1}–${before} will no longer show.`, 'warn');
  } else {
    toast('Bell schedule saved', 'success');
  }
}

/* ============================================================
   Shared renderer for the weekly grid
   ------------------------------------------------------------
   Four screens drew this table with their own copy of the
   1..8-plus-two-breaks assumption. They now iterate bellRows().
   ============================================================ */
function bellGridRows(tt, days, cellHtml, colspan) {
  return bellRows().map(r => {
    if (r.isBreak) {
      return `<tr class="bg-amber-50">
        <td colspan="${colspan}" class="text-center text-xs font-semibold text-slate-600 py-1.5">
          ${_bellEsc(r.label)} · ${_bellEsc(r.start)}–${_bellEsc(r.end)}
        </td></tr>`;
    }
    const entries = days.map(d => tt.find(x => x.day === d && x.period === r.period));
    return `<tr>
      <td class="whitespace-nowrap"><strong class="text-slate-900">P${r.period}</strong>
        <br><span class="text-xs text-slate-500 font-mono">${_bellEsc(r.start)}-${_bellEsc(r.end)}</span></td>
      ${entries.map((e, i) => cellHtml(e, days[i], r.period)).join('')}
    </tr>`;
  }).join('');
}
