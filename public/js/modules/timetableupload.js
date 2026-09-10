/* ============================================================
   Bulk Timetable Upload — UI
   ------------------------------------------------------------
   Implements the flow in CASPAA_Timetable_Setup_and_Bulk_Upload_PRD.docx:

     Step 1  pick a term, download the grid template, upload a file
     Step 2  validate into a STAGED result held in memory
             - errors  -> reject the whole batch, show the report
             - clean   -> preview with counts, loads and warnings
     Step 3  publish, choosing Replace or Merge, in one write

   A class is a teaching group: JSS 1 A and JSS 1 B are two classes
   and get two columns. Arms are not a separate dimension.

   Scope is either the whole school or a single class, so an admin
   can set the term up in one pass or correct one class at a time.

   GRID SHAPE: each class occupies TWO columns, "<Class> - Subject"
   and "<Class> - Teacher". Every value therefore has its own header,
   which is what lets a spreadsheet attach a dropdown per column and
   lets an error name the exact column. A single composite cell
   ("teacher|subject") looked tidier and was worse at all three.

   DEVIATION FROM THE PRD, stated plainly rather than hidden:
   the PRD specifies .xlsx so the file can carry a Reference tab and
   per-cell dropdowns. That needs a spreadsheet library. This build
   uses CSV and carries its instructions as comment rows in the file
   itself. Everything else — validation, preview, atomic publish —
   is as specified.

   OVERRIDES bulkTimetableUploadModal() from admin.js; this module
   loads after it.
   ============================================================ */

const TTU_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TTU_DEFAULT_TIMES = { 1:'08:00-08:40', 2:'08:40-09:20', 3:'09:20-10:00', 4:'10:00-10:40',
                            5:'11:00-11:40', 6:'11:40-12:20', 7:'13:00-13:40', 8:'13:40-14:20' };
const TTU_MAX_WEEKLY_PERIODS = 30;   // above this a teacher is flagged as overloaded
const TTU_COL_SEP = ' - ';           // "JSS 1 A - Subject" / "JSS 1 A - Teacher"

/* ---------- flow state ---------- */
let _ttuStep = 'setup';
let _ttuTermId = null;
let _ttuSeedTermId = '';
let _ttuScope = '';         // '' = every class, otherwise a single classId
let _ttuMode = 'replace';
let _ttuStaged = null;      // { rows, errors, warnings, stats }
let _ttuFileName = '';

function _ttuEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _ttuNorm(s) {
  return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();
}

/* ---------- school context ---------- */
function ttuTerms() {
  const sid = currentSchoolId();
  return DB.query('academicTerms', t => t.schoolId === sid);
}
function ttuClasses() {
  const sid = currentSchoolId();
  return DB.query('classes', c => c.schoolId === sid);
}
function ttuTeachers() {
  const sid = currentSchoolId();
  return DB.query('teachers', t => t.schoolId === sid && (t.staffType || 'Academic') === 'Academic' && t.status !== 'terminated');
}
function ttuSubjects() { return DB.get('subjects'); }

/* Period rows the template carries, in order, with breaks marked. Reads the
   school's bell schedule, so a three-break day or a six-period day produces a
   template that matches it. */
function ttuSlots() {
  if (typeof bellRows !== 'function') {
    return Object.keys(TTU_DEFAULT_TIMES).map(Number).sort((a, b) => a - b)
      .map(p => ({ period: p, time: TTU_DEFAULT_TIMES[p], isBreak: false }));
  }
  return bellRows().map(r => r.isBreak
    ? { period: 'BREAK', time: `${r.label} (${r.start}-${r.end})`, isBreak: true }
    : { period: r.period, time: `${r.start}-${r.end}`, isBreak: false });
}

/* Term dates minus weekends minus published breaks. */
function ttuTeachingDays(term) {
  if (!term || !term.startDate || !term.endDate) return null;
  const sid = currentSchoolId();
  const closed = new Set(
    DB.query('academicCalendar', e => e.schoolId === sid && (e.type === 'break' || e.type === 'holiday')).map(e => e.date)
  );
  const start = new Date(term.startDate), end = new Date(term.endDate);
  if (isNaN(start) || isNaN(end) || end < start) return null;
  let n = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    if (closed.has(d.toISOString().slice(0, 10))) continue;
    n++;
  }
  return n;
}

/* Rows already stored for a term. Rows predating term scoping carry no termId
   and are treated as belonging to the current term. */
function ttuRowsForTerm(termId) {
  const sid = currentSchoolId();
  const currentId = (ttuTerms().find(t => t.current) || {}).id;
  return DB.query('timetable', r => r.schoolId === sid &&
    (r.termId ? r.termId === termId : termId === currentId));
}

/* ============================================================
   ENTRY — overrides admin.js
   ============================================================ */
function bulkTimetableUploadModal() {
  const terms = ttuTerms();
  _ttuStep = 'setup';
  _ttuStaged = null;
  _ttuFileName = '';
  _ttuSeedTermId = '';
  _ttuScope = '';
  _ttuMode = 'replace';
  _ttuTermId = (terms.find(t => t.current) || terms[0] || {}).id || null;

  modal({
    title: 'Bulk Timetable Upload',
    size: 'xl',
    body: '<div id="ttuBody"></div>',
    footer: '<div id="ttuFooter" class="flex items-center gap-3 w-full justify-end"></div>',
    onClose: () => { _ttuStaged = null; _ttuStep = 'setup'; }
  });
  ttuRender();
}

function ttuRender() {
  const body = document.getElementById('ttuBody');
  const foot = document.getElementById('ttuFooter');
  if (!body || !foot) return;
  body.innerHTML = _ttuStep === 'errors' ? ttuErrorsHtml()
                 : _ttuStep === 'preview' ? ttuPreviewHtml()
                 : ttuSetupHtml();
  foot.innerHTML = _ttuStep === 'errors' ? ttuErrorsFooter()
                 : _ttuStep === 'preview' ? ttuPreviewFooter()
                 : ttuSetupFooter();
}

/* ============================================================
   STEP 1 — term, template, upload
   ============================================================ */
function ttuSetupHtml() {
  const terms = ttuTerms();
  if (!terms.length) {
    return emptyState({ icon: 'calendar', title: 'No terms defined',
      body: 'Add academic terms under School Settings before uploading a timetable.' });
  }
  const term = terms.find(t => t.id === _ttuTermId) || terms[0];
  const days = ttuTeachingDays(term);
  const classes = ttuClasses();
  const slots = ttuSlots().filter(s => !s.isBreak).length;
  const scoped = _ttuScope ? classes.filter(c => c.id === _ttuScope) : classes;

  return `
    <div class="space-y-4">
      <p class="text-sm text-slate-600">Upload a term's timetable — the whole school, or one class at a time.</p>

      <div class="grid sm:grid-cols-3 gap-3">
        <div>
          <label class="input-label" for="ttu_term">Term</label>
          <select id="ttu_term" class="input" onchange="ttuSetTerm(this.value)">
            ${terms.map(t => `<option value="${t.id}" ${t.id === term.id ? 'selected' : ''}>${_ttuEsc(t.name)}${t.current ? ' — current' : ''}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="input-label" for="ttu_scope">Classes</label>
          <select id="ttu_scope" class="input" onchange="ttuSetScope(this.value)">
            <option value="">All classes (${classes.length})</option>
            ${classes.map(c => `<option value="${c.id}" ${_ttuScope === c.id ? 'selected' : ''}>${_ttuEsc(c.name)} only</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="input-label" for="ttu_seed">Pre-fill from</label>
          <select id="ttu_seed" class="input" onchange="_ttuSeedTermId = this.value">
            <option value="">This term</option>
            ${terms.filter(t => t.id !== term.id).map(t => `<option value="${t.id}" ${_ttuSeedTermId === t.id ? 'selected' : ''}>${_ttuEsc(t.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <p class="text-xs text-slate-500">
        ${scoped.length === 1 ? _ttuEsc(scoped[0].name) : `${scoped.length} classes`}
        · ${slots} periods/day
        · ${days == null ? 'term dates not set' : `${days} teaching days`}
        ${term.startDate ? ` · ${fdate(term.startDate, { short: true })} – ${fdate(term.endDate, { short: true })}` : ''}
      </p>

      ${days === 0 ? `<div class="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        ${icon('bell','w-4 h-4 inline')} No teaching days in this term once weekends and breaks are removed.
      </div>` : ''}

      <div class="grid sm:grid-cols-2 gap-3 items-stretch">
        <button class="card p-6 text-center hover:border-brand-400 transition" onclick="ttuDownloadTemplate()">
          ${icon('download','w-8 h-8 mx-auto text-brand-600 mb-2')}
          <span class="block font-semibold text-slate-800 text-sm">Download template</span>
        </button>

        <input type="file" id="ttu_file" accept=".csv" class="hidden" onchange="ttuHandleFile(event)" />
        <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 cursor-pointer hover:border-brand-400 transition"
             onclick="document.getElementById('ttu_file').click()">
          ${icon('upload','w-8 h-8 mx-auto text-slate-400 mb-2')}
          <span class="block font-semibold text-slate-700 text-sm">${_ttuFileName ? _ttuEsc(_ttuFileName) : 'Upload completed file'}</span>
        </div>
      </div>
    </div>`;
}

function ttuSetupFooter() {
  return `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop')?.click()">Cancel</button>
          <button class="btn btn-primary" disabled>Continue</button>`;
}

function ttuSetTerm(id) { _ttuTermId = id; _ttuSeedTermId = ''; ttuRender(); }
function ttuSetScope(id) { _ttuScope = id; ttuRender(); }

/* ---------- template ---------- */
function ttuCsvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function ttuDownloadTemplate() {
  const term = ttuTerms().find(t => t.id === _ttuTermId);
  if (!term) { toast('Pick a term first', 'danger'); return; }
  const all = ttuClasses();
  const classes = _ttuScope ? all.filter(c => c.id === _ttuScope) : all;
  if (!classes.length) { toast('No classes to schedule', 'danger'); return; }

  // Duplicate column headers would make a column impossible to map back to a class.
  const seen = {};
  const dupes = [];
  classes.forEach(c => { const k = _ttuNorm(c.name); if (seen[k]) dupes.push(c.name); seen[k] = true; });
  if (dupes.length) {
    toast(`Two classes share the name "${dupes[0]}" — rename one before uploading`, 'danger');
    return;
  }

  const seedRows = ttuRowsForTerm(_ttuSeedTermId || term.id);
  const teachers = ttuTeachers();
  const subjects = ttuSubjects();
  // Names read better than emails in a spreadsheet, but two staff can share a
  // name — fall back to the email, which cannot collide.
  const teacherLabel = t => {
    if (!t) return '';
    const sameName = teachers.filter(x => _ttuNorm(x.name) === _ttuNorm(t.name)).length > 1;
    return sameName ? (t.email || t.name) : t.name;
  };
  const cellFor = (classId, day, period) => {
    const r = seedRows.find(x => x.classId === classId && x.day === day && x.period === period);
    if (!r) return { subject: '', teacher: '' };
    const t = teachers.find(x => x.id === r.teacherId);
    const s = subjects.find(x => x.id === r.subjectId);
    return (t && s) ? { subject: s.name, teacher: teacherLabel(t) } : { subject: '', teacher: '' };
  };

  // Instructions travel with the file rather than crowding the dialog.
  const pad = classes.map(() => ['', '']).reduce((a, b) => a.concat(b), []);
  const note = txt => lines.push([txt, '', '', ...pad].map(ttuCsvCell).join(','));
  const lines = [];
  note(`# CASPAA timetable template — ${term.name}`);
  note(`# TERM_ID=${term.id}`);
  note('# Each class has two columns: Subject and Teacher. Fill both, or leave both blank for a free period.');
  note('# Do not edit the Day, Period or Time columns, or the header row.');

  const header = ['Day', 'Period', 'Time'];
  classes.forEach(c => { header.push(`${c.name}${TTU_COL_SEP}Subject`, `${c.name}${TTU_COL_SEP}Teacher`); });
  lines.push(header.map(ttuCsvCell).join(','));

  TTU_DAYS.forEach(day => {
    ttuSlots().forEach(slot => {
      if (slot.isBreak) {
        lines.push([day, 'BREAK', slot.time, ...pad].map(ttuCsvCell).join(','));
        return;
      }
      const cells = [];
      classes.forEach(c => { const v = cellFor(c.id, day, slot.period); cells.push(v.subject, v.teacher); });
      lines.push([day, slot.period, slot.time, ...cells].map(ttuCsvCell).join(','));
    });
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `caspaa_timetable_${String(term.name).replace(/\s+/g, '_').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Template for ${term.name} downloaded`, 'success');
}

/* ============================================================
   STEP 2 — parse and validate into a staged result
   ============================================================ */

/* Minimal CSV reader — handles quoted fields containing commas. */
function ttuParseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}

function ttuHandleFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  _ttuFileName = file.name;
  const reader = new FileReader();
  reader.onerror = () => toast('That file could not be read', 'danger');
  reader.onload = e => {
    try {
      _ttuStaged = ttuValidate(String(e.target.result));
      _ttuStep = _ttuStaged.errors.length ? 'errors' : 'preview';
    } catch (err) {
      console.error(err);
      toast('That file could not be parsed as a timetable grid', 'danger');
      return;
    }
    ttuRender();
  };
  reader.readAsText(file);
  ev.target.value = '';   // let the same file be re-picked after a fix
}

function ttuValidate(text) {
  const term = ttuTerms().find(t => t.id === _ttuTermId);
  const classes = ttuClasses();
  const teachers = ttuTeachers();
  const subjects = ttuSubjects();
  const slots = ttuSlots();
  const validPeriods = new Set(slots.filter(s => !s.isBreak).map(s => s.period));

  const errors = [];
  const warnings = [];
  const rows = [];
  const at = (day, period, colName) => `${term ? term.name : 'Term'} · ${day} P${period} · ${colName}`;

  const grid = ttuParseCsv(text);
  if (!grid.length) return ttuResult(rows, [{ kind: 'empty', msg: 'No periods found — nothing to publish.' }], warnings, term);

  // The template stamps its term so a file cannot be published over the wrong one.
  const stamp = grid.find(r => /^#\s*TERM_ID=/.test(String(r[0] || '')));
  if (stamp) {
    const fileTerm = String(stamp[0]).replace(/^#\s*TERM_ID=/, '').trim();
    if (term && fileTerm && fileTerm !== term.id) {
      const named = ttuTerms().find(t => t.id === fileTerm);
      return ttuResult(rows, [{ kind: 'wrong-term',
        msg: `This file was generated for ${named ? named.name : fileTerm}, but you selected ${term.name}. Re-select the term or download a fresh template.` }], warnings, term);
    }
  }

  const headerIdx = grid.findIndex(r => _ttuNorm(r[0]) === 'day' && _ttuNorm(r[1]) === 'period');
  if (headerIdx === -1) {
    return ttuResult(rows, [{ kind: 'no-header',
      msg: 'No header row found. The file must contain a row starting Day, Period, Time followed by one column per class.' }], warnings, term);
  }

  // Each class occupies a Subject column and a Teacher column, headed
  // "<Class> - Subject" and "<Class> - Teacher". Pair them up by class.
  const header = grid[headerIdx];
  const pairs = new Map();
  for (let c = 3; c < header.length; c++) {
    const raw = String(header[c] || '').trim();
    if (!raw) continue;
    const m = /^(.*?)[\s\-–—:|]+(subject|teacher)$/i.exec(raw);
    if (!m) {
      errors.push({ kind: 'bad-column', msg: `Column "${raw}" is not recognised. Each class needs a "<Class> - Subject" and a "<Class> - Teacher" column.` });
      continue;
    }
    const clsName = m[1].trim();
    const which = m[2].toLowerCase();
    const cls = classes.find(x => _ttuNorm(x.name) === _ttuNorm(clsName));
    if (!cls) {
      errors.push({ kind: 'bad-column', msg: `Column "${raw}" refers to "${clsName}", which is not a class. Rename the header or remove the column.` });
      continue;
    }
    const entry = pairs.get(cls.id) || { cls, name: cls.name, subject: -1, teacher: -1 };
    entry[which] = c;
    pairs.set(cls.id, entry);
  }

  const columns = [];
  pairs.forEach(p => {
    if (p.subject === -1) errors.push({ kind: 'bad-pair', msg: `${p.name} has a Teacher column but no Subject column.` });
    else if (p.teacher === -1) errors.push({ kind: 'bad-pair', msg: `${p.name} has a Subject column but no Teacher column.` });
    else columns.push(p);
  });
  if (!columns.length && !errors.length) {
    errors.push({ kind: 'no-columns', msg: 'No class columns found in the header row.' });
  }

  // Slot index for clash detection — one pass, keyed by day+period+teacher.
  const slotIndex = new Map();

  for (let r = headerIdx + 1; r < grid.length; r++) {
    const line = grid[r];
    const day = String(line[0] || '').trim();
    const periodRaw = String(line[1] || '').trim();
    const time = String(line[2] || '').trim();

    if (!TTU_DAYS.some(d => _ttuNorm(d) === _ttuNorm(day))) {
      errors.push({ kind: 'bad-day', msg: `Row ${r + 1}: "${day}" is not a school day.` });
      continue;
    }
    const dayName = TTU_DAYS.find(d => _ttuNorm(d) === _ttuNorm(day));

    if (_ttuNorm(periodRaw) === 'break') {
      const filled = columns.filter(col => String(line[col.subject] || '').trim() !== '' || String(line[col.teacher] || '').trim() !== '');
      if (filled.length) warnings.push({ kind: 'break-edited', msg: `${dayName} · ${time || 'break'} — ${filled.length} cell(s) filled on a break row. Ignored.` });
      continue;
    }

    const period = parseInt(periodRaw, 10);
    if (!validPeriods.has(period)) {
      errors.push({ kind: 'bad-period', msg: `Row ${r + 1}: period "${periodRaw}" is not in this school's time slots.` });
      continue;
    }

    columns.forEach(col => {
      const subjectPart = String(line[col.subject] || '').trim();
      const teacherPart = String(line[col.teacher] || '').trim();

      if (!subjectPart && !teacherPart) return;            // both blank = free period

      // Half-filled is always a mistake: a subject with nobody to teach it
      // cannot be staffed, and a teacher with no subject cannot be scheduled.
      if (!subjectPart) {
        errors.push({ kind: 'half-filled', msg: `${at(dayName, period, col.name)} — Teacher "${teacherPart}" given but the Subject column is empty.` });
        return;
      }
      if (!teacherPart) {
        errors.push({ kind: 'half-filled', msg: `${at(dayName, period, col.name)} — Subject "${subjectPart}" given but the Teacher column is empty.` });
        return;
      }

      if (/[,;]|\band\b|\+/i.test(teacherPart)) {
        errors.push({ kind: 'co-teaching', msg: `${at(dayName, period, col.name)} — "${teacherPart}" names more than one teacher. Co-teaching is not supported yet; one teacher per period.` });
        return;
      }

      const teacher = teachers.find(t => t.email && _ttuNorm(t.email) === _ttuNorm(teacherPart))
                   || teachers.find(t => _ttuNorm(t.name) === _ttuNorm(teacherPart));
      if (!teacher) {
        const near = teachers.map(t => t.email).filter(Boolean)
          .find(e => _ttuNorm(e).slice(0, 4) === _ttuNorm(teacherPart).slice(0, 4));
        errors.push({ kind: 'bad-teacher', msg: `${at(dayName, period, col.name)} — no teacher "${teacherPart}"${near ? `. Did you mean ${near}?` : '.'}` });
        return;
      }

      const subject = subjects.find(s => _ttuNorm(s.name) === _ttuNorm(subjectPart));
      if (!subject) {
        const near = subjects.map(s => s.name)
          .find(n => _ttuNorm(n).slice(0, 4) === _ttuNorm(subjectPart).slice(0, 4));
        errors.push({ kind: 'bad-subject', msg: `${at(dayName, period, col.name)} — no subject "${subjectPart}"${near ? `. Did you mean ${near}?` : '.'}` });
        return;
      }

      // Clash: same teacher, same slot, another class.
      const key = `${dayName}|${period}|${teacher.id}`;
      const prior = slotIndex.get(key);
      if (prior) {
        if (prior.subjectId === subject.id) {
          warnings.push({ kind: 'combined',
            msg: `${at(dayName, period, col.name)} — ${teacher.name} also takes ${prior.className} for ${subject.name} in this slot. Treated as a combined class.` });
        } else {
          errors.push({ kind: 'double-booked',
            msg: `${at(dayName, period, col.name)} — ${teacher.name} is already teaching ${prior.className} (${prior.subjectName}) in this slot.` });
          return;
        }
      } else {
        slotIndex.set(key, { className: col.name, subjectId: subject.id, subjectName: subject.name });
      }

      if (Array.isArray(teacher.subjects) && teacher.subjects.length && !teacher.subjects.includes(subject.id)) {
        warnings.push({ kind: 'subject-mismatch',
          msg: `${at(dayName, period, col.name)} — ${teacher.name} is not listed for ${subject.name}.` });
      }

      rows.push({ classId: col.cls.id, className: col.name, day: dayName, period,
                  time: time || (TTU_DEFAULT_TIMES[period] || ''), subjectId: subject.id, teacherId: teacher.id });
    });
  }

  if (!rows.length && !errors.length) {
    errors.push({ kind: 'empty', msg: 'No periods found — nothing to publish.' });
  }

  // Post-pass warnings.
  columns.forEach(col => {
    if (!rows.some(r => r.classId === col.cls.id)) {
      warnings.push({ kind: 'empty-class', msg: `${col.name} has no periods at all — check the column was filled in the right place.` });
    }
  });
  const load = {};
  rows.forEach(r => { load[r.teacherId] = (load[r.teacherId] || 0) + 1; });
  Object.keys(load).forEach(tid => {
    if (load[tid] > TTU_MAX_WEEKLY_PERIODS) {
      const t = teachers.find(x => x.id === tid);
      warnings.push({ kind: 'overload', msg: `${t ? t.name : tid} is scheduled for ${load[tid]} periods a week, above the ${TTU_MAX_WEEKLY_PERIODS} cap.` });
    }
  });

  return ttuResult(rows, errors, warnings, term, load);
}

function ttuResult(rows, errors, warnings, term, load) {
  const slots = ttuSlots().filter(s => !s.isBreak).length * TTU_DAYS.length;
  const classIds = new Set(rows.map(r => r.classId));
  return {
    rows, errors, warnings, term,
    load: load || {},
    stats: {
      classes: classIds.size,
      periods: rows.length,
      teachers: new Set(rows.map(r => r.teacherId)).size,
      free: Math.max(0, slots * classIds.size - rows.length)
    }
  };
}

/* Which stored rows for this term survive a publish in the given mode. */
function ttuSurvivors(mode) {
  const rows = _ttuStaged ? _ttuStaged.rows : [];
  const touched = new Set(rows.map(r => r.classId));
  return ttuRowsForTerm(_ttuTermId).filter(r => {
    if (mode === 'replace') return !touched.has(r.classId);
    return !rows.some(n => n.classId === r.classId && n.day === r.day && n.period === r.period);
  });
}

/* Clashes between the uploaded file and the schedule that will still be there
   after it publishes.

   The file alone is not enough to detect these. Uploading one class in
   isolation — or merging into a full term — leaves other classes' periods in
   place, and a teacher put into an already-occupied slot would otherwise sail
   through validation and double-book on publish. Recomputed whenever the
   publish mode changes, because the mode decides what survives. */
function ttuExternalClashes(mode) {
  const errors = [];
  const warnings = [];
  if (!_ttuStaged) return { errors, warnings };

  const classes = ttuClasses();
  const teachers = ttuTeachers();
  const subjects = ttuSubjects();
  const nameOf = id => (classes.find(c => c.id === id) || {}).name || id;

  const index = new Map();
  ttuSurvivors(mode).forEach(r => {
    index.set(`${r.day}|${r.period}|${r.teacherId}`, r);
  });

  _ttuStaged.rows.forEach(r => {
    const hit = index.get(`${r.day}|${r.period}|${r.teacherId}`);
    if (!hit || hit.classId === r.classId) return;
    const t = teachers.find(x => x.id === r.teacherId);
    const who = t ? t.name : r.teacherId;
    const where = `${_ttuStaged.term ? _ttuStaged.term.name : 'Term'} · ${r.day} P${r.period} · ${r.className}`;
    if (hit.subjectId === r.subjectId) {
      const s = subjects.find(x => x.id === r.subjectId);
      warnings.push({ kind: 'combined',
        msg: `${where} — ${who} also has ${nameOf(hit.classId)} for ${s ? s.name : 'this subject'} in this slot on the saved timetable. Treated as a combined class.` });
    } else {
      const s = subjects.find(x => x.id === hit.subjectId);
      errors.push({ kind: 'double-booked',
        msg: `${where} — ${who} is already teaching ${nameOf(hit.classId)} (${s ? s.name : 'another subject'}) in this slot on the saved timetable.` });
    }
  });
  return { errors, warnings };
}

/* ---------- errors screen ---------- */
function ttuGroup(list) {
  const by = {};
  list.forEach(e => { (by[e.kind] = by[e.kind] || []).push(e.msg); });
  return by;
}

const TTU_KIND_LABEL = {
  'empty': 'Nothing to import', 'no-header': 'Header row missing', 'wrong-term': 'Wrong term',
  'bad-column': 'Unrecognised class column', 'no-columns': 'No class columns',
  'bad-day': 'Invalid day', 'bad-period': 'Period not in your time slots',
  'half-filled': 'Subject or Teacher left empty', 'co-teaching': 'Co-teaching not supported',
  'bad-pair': 'Class missing a Subject or Teacher column',
  'bad-teacher': 'Unknown teacher', 'bad-subject': 'Unknown subject',
  'double-booked': 'Teacher double-booked',
  'combined': 'Combined class', 'subject-mismatch': 'Teacher not listed for subject',
  'break-edited': 'Break row filled', 'empty-class': 'Class with no periods', 'overload': 'Teacher overloaded'
};

function ttuErrorsHtml() {
  const grouped = ttuGroup(_ttuStaged.errors);
  const total = _ttuStaged.errors.length;
  return `
    <div class="space-y-4">
      <div class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2">
        ${icon('x','w-4 h-4 flex-shrink-0 mt-0.5')}
        <span><strong>This file was not imported.</strong> ${total} problem${total === 1 ? '' : 's'} found across
        ${Object.keys(grouped).length} categor${Object.keys(grouped).length === 1 ? 'y' : 'ies'}.
        Nothing has been saved — your existing timetable is unchanged.</span>
      </div>

      ${Object.keys(grouped).map(kind => {
        const msgs = grouped[kind];
        return `<div class="card overflow-hidden">
          <div class="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span class="font-semibold text-slate-900 text-sm">${TTU_KIND_LABEL[kind] || kind}</span>
            <span class="badge badge-danger">${msgs.length}</span>
          </div>
          <div class="px-4 py-3 space-y-1.5 max-h-48 overflow-y-auto">
            ${msgs.slice(0, 25).map(m => `<div class="text-sm text-slate-700">${_ttuEsc(m)}</div>`).join('')}
            ${msgs.length > 25 ? `<div class="text-xs text-slate-400 pt-1">+${msgs.length - 25} more — download the report to see them all.</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function ttuErrorsFooter() {
  return `
    <button class="btn btn-ghost mr-auto" onclick="ttuBackToSetup()">${icon('arrow_left','w-4 h-4')} Back</button>
    <button class="btn btn-secondary" onclick="ttuDownloadReport()">${icon('download','w-4 h-4')} Download report</button>
    <button class="btn btn-primary" disabled>Confirm &amp; Publish</button>`;
}

function ttuBackToSetup() { _ttuStep = 'setup'; ttuRender(); }

function ttuDownloadReport() {
  const s = _ttuStaged;
  const lines = ['Severity,Category,Detail'];
  const ext = ttuExternalClashes(_ttuMode);
  s.errors.concat(ext.errors).forEach(e => lines.push([ 'Error', TTU_KIND_LABEL[e.kind] || e.kind, e.msg ].map(ttuCsvCell).join(',')));
  s.warnings.concat(ext.warnings).forEach(w => lines.push([ 'Warning', TTU_KIND_LABEL[w.kind] || w.kind, w.msg ].map(ttuCsvCell).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'timetable_import_report.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('Report downloaded', 'success');
}

/* ---------- preview screen ---------- */
function ttuPreviewHtml() {
  const s = _ttuStaged;
  const teachers = ttuTeachers();
  const byClass = {};
  s.rows.forEach(r => { byClass[r.className] = (byClass[r.className] || 0) + 1; });
  const ext = ttuExternalClashes(_ttuMode);
  const allWarnings = s.warnings.concat(ext.warnings);
  const grouped = ttuGroup(allWarnings);

  return `
    <div class="space-y-4">
      <div class="rounded-xl ${ext.errors.length ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-900'} px-4 py-2.5 text-sm flex items-start gap-2">
        ${icon(ext.errors.length ? 'info' : 'check','w-4 h-4 flex-shrink-0 mt-0.5')}
        <span><strong>${_ttuEsc(_ttuFileName)}</strong> · ${_ttuEsc(s.term ? s.term.name : 'this term')} · nothing saved yet.</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${[['Classes scheduled', s.stats.classes], ['Periods filled', s.stats.periods],
           ['Teachers allocated', s.stats.teachers], ['Free periods', s.stats.free]].map(([l, v]) => `
          <div class="card p-4"><div class="text-xs text-slate-500">${l}</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">${v}</div></div>`).join('')}
      </div>

      <div class="grid lg:grid-cols-2 gap-4 items-start">
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Periods per class</h4>
          <div class="card overflow-hidden max-h-64 overflow-y-auto">
            <table class="tbl">
              <thead><tr><th scope="col">Class</th><th scope="col" class="num">Periods</th></tr></thead>
              <tbody>${Object.keys(byClass).sort().map(n => `<tr>
                <td class="font-semibold">${_ttuEsc(n)}</td>
                <td class="num font-mono">${byClass[n]}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Weekly load per teacher</h4>
          <div class="card overflow-hidden max-h-64 overflow-y-auto">
            <table class="tbl">
              <thead><tr><th scope="col">Teacher</th><th scope="col" class="num">Periods</th></tr></thead>
              <tbody>${Object.keys(s.load).map(tid => {
                const t = teachers.find(x => x.id === tid);
                const n = s.load[tid];
                return `<tr><td class="font-semibold">${_ttuEsc(t ? t.name : tid)}</td>
                  <td class="num font-mono ${n > TTU_MAX_WEEKLY_PERIODS ? 'text-amber-700 font-bold' : ''}">${n}</td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Apply as</h4>
        <div class="grid sm:grid-cols-2 gap-2">
          ${[['replace', 'Replace', `Clears these ${s.stats.classes} class${s.stats.classes === 1 ? '' : 'es'} first. Blank cells delete.`],
             ['merge', 'Merge', 'Writes filled cells only. Everything else survives.']].map(([k, label, hint]) => `
            <label class="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer ${_ttuMode === k ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-slate-50'}">
              <input type="radio" name="ttu_mode" value="${k}" class="mt-0.5" ${_ttuMode === k ? 'checked' : ''} onchange="ttuSetMode('${k}')" />
              <span class="text-sm">
                <span class="font-semibold text-slate-900">${label}</span>
                <span class="block text-xs text-slate-500 mt-0.5">${hint}</span>
              </span>
            </label>`).join('')}
        </div>
      </div>

      ${ext.errors.length ? `
        <div class="rounded-xl bg-rose-50 px-4 py-3">
          <div class="text-sm font-bold text-rose-900 mb-1.5">
            ${ext.errors.length} clash${ext.errors.length === 1 ? '' : 'es'} with the saved timetable — cannot publish as ${_ttuMode === 'replace' ? 'Replace' : 'Merge'}
          </div>
          <div class="space-y-1 max-h-40 overflow-y-auto">
            ${ext.errors.slice(0, 15).map(e => `<div class="text-xs text-rose-800">${_ttuEsc(e.msg)}</div>`).join('')}
            ${ext.errors.length > 15 ? `<div class="text-xs text-rose-500">+${ext.errors.length - 15} more</div>` : ''}
          </div>
        </div>` : ''}

      ${allWarnings.length ? `
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
            ${allWarnings.length} warning${allWarnings.length === 1 ? '' : 's'} — not blocking
          </h4>
          <div class="card p-4 space-y-2 max-h-40 overflow-y-auto">
            ${Object.keys(grouped).map(kind => `<div>
              <div class="text-sm font-semibold text-slate-900">${TTU_KIND_LABEL[kind] || kind}
                <span class="badge badge-warn ml-1">${grouped[kind].length}</span></div>
              ${grouped[kind].slice(0, 3).map(m => `<div class="text-xs text-slate-600 mt-0.5">${_ttuEsc(m)}</div>`).join('')}
              ${grouped[kind].length > 3 ? `<div class="text-xs text-slate-400 mt-0.5">+${grouped[kind].length - 3} more</div>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}

      ${s.term && s.term.endDate && s.term.endDate < today() ? `
        <div class="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          ${icon('bell','w-4 h-4 inline')} <strong>${_ttuEsc(s.term.name)} has already ended</strong> — publishing rewrites a term already taught.
        </div>` : ''}

      <p class="text-xs text-slate-500">
        Not checked: room availability, teacher working days, co-teaching. A clean import does not on its own guarantee a workable timetable.
      </p>
    </div>`;
}

function ttuSetMode(m) { _ttuMode = m; ttuRender(); }

function ttuPreviewFooter() {
  const blocked = ttuExternalClashes(_ttuMode).errors.length;
  return `
    <button class="btn btn-ghost mr-auto" onclick="ttuBackToSetup()">${icon('arrow_left','w-4 h-4')} Back</button>
    <button class="btn btn-secondary" onclick="ttuDownloadReport()">${icon('download','w-4 h-4')} Report</button>
    <button class="btn btn-primary" ${blocked ? 'disabled' : ''} onclick="ttuPublish()">
      ${icon('check','w-4 h-4')} Confirm &amp; Publish
    </button>`;
}

/* ============================================================
   STEP 3 — publish, in a single write
   ============================================================ */
function ttuPublish() {
  const s = _ttuStaged;
  if (!s || s.errors.length) return;
  const mode = _ttuMode;
  // The saved timetable may have moved since the file was validated, and the
  // mode decides what survives — so re-check rather than trusting the preview.
  const ext = ttuExternalClashes(mode);
  if (ext.errors.length) {
    toast(`${ext.errors.length} clash${ext.errors.length === 1 ? '' : 'es'} with the saved timetable — nothing published`, 'danger');
    ttuRender();
    return;
  }
  const sid = currentSchoolId();
  const termId = _ttuTermId;
  const currentId = (ttuTerms().find(t => t.current) || {}).id;
  const belongsToTerm = r => (r.termId ? r.termId === termId : termId === currentId);
  const touched = new Set(s.rows.map(r => r.classId));

  // Compose the ENTIRE new collection first, then commit once — there is no
  // state in which half the file has been applied.
  const all = DB.get('timetable');
  const kept = all.filter(r => {
    if (r.schoolId !== sid) return true;            // other branches untouched
    if (!belongsToTerm(r)) return true;             // other terms untouched
    if (mode === 'replace') return !touched.has(r.classId);
    return !s.rows.some(n => n.classId === r.classId && n.day === r.day && n.period === r.period);
  });

  const fresh = s.rows.map(r => ({
    id: uid('tt'), schoolId: sid, termId,
    classId: r.classId, day: r.day, period: r.period, time: r.time,
    subjectId: r.subjectId, teacherId: r.teacherId
  }));

  DB.set('timetable', kept.concat(fresh));
  if (DB._saveFailed) {
    toast('Nothing was saved — your storage is full. The previous timetable still stands.', 'danger');
    return;
  }

  const term = s.term;
  DB.insert('auditLog', {
    id: uid('aud'), schoolId: sid,
    actor: AUTH.current ? AUTH.current.id : 'system',
    action: 'bulk_timetable_upload',
    target: `${term ? term.name : termId} · ${mode === 'replace' ? 'Replaced' : 'Merged'} ${s.rows.length} periods across ${s.stats.classes} classes`,
    timestamp: now()
  });

  document.getElementById('modalBackdrop')?.click();
  APP.render();
  toast(`${term ? term.name : 'Timetable'} published — ${s.rows.length} periods across ${s.stats.classes} classes`, 'success');
}
