/* ============================================================
   COMMUNICATION DIARY MODULE
   - Teacher writes structured per-student notes
   - Parent reads and replies (with read receipts)
   - Separate from the live chat system
   ============================================================ */

function getDiaryCategories() { return DB.settings().diaryCategories || ['Homework','Behaviour','Academic','Health','General']; }

// ── Teacher Views ─────────────────────────────────────────────

function view_tch_diary(params) {
  const teacherId = AUTH.current.id;
  const classes = teacherClasses();
  if (!classes.length) return emptyState({ title: 'No classes assigned', body: 'You have no classes to write diary entries for.', icon: 'book' });

  const activeClassId = (params && params.classId) || classes[0].id;
  const students = COMPUTE.studentsByClass(activeClassId);
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';

  return `
    ${pageHeader({ title: 'Communication Diary', subtitle: 'Write structured notes to parents — per student, per day' })}

    <div class="flex gap-2 mb-4 flex-wrap">
      ${classes.map(c => `<button onclick="APP.go('tch_diary',{classId:'${c.id}'})" class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeClassId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
    </div>

    ${students.length === 0 ? emptyState({ title: 'No students in this class', body: 'Enrol students to start writing diary entries.', icon: 'students' }) : `
      <div class="space-y-2">
        ${students.map(s => {
          const entries = DB.query('diaryEntries', e => e.studentId === s.id && e.teacherId === teacherId && e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                           .sort((a,b) => b.date.localeCompare(a.date));
          const unreadReplies = entries.filter(e => e.parentReply && !e.teacherReadReply).length;
          const lastEntry = entries[0];
          const parent = s.parentId ? DB.find('parents', s.parentId) : null;
          return `<div class="card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                ${avatar(s, 'sm')}
                <div class="min-w-0">
                  <div class="font-bold text-slate-900">${s.name}</div>
                  <div class="text-xs text-slate-400">${parent ? parent.name : 'No parent linked'} · ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} this term</div>
                  ${lastEntry ? `<div class="text-xs mt-0.5 ${lastEntry.parentRead ? 'text-emerald-600' : 'text-amber-600'}">
                    Last entry: ${fdate(lastEntry.date, {short:true})} — ${lastEntry.category} — ${lastEntry.parentRead ? 'Read by parent' : 'Unread by parent'}
                  </div>` : `<div class="text-xs text-slate-400 mt-0.5">No entries yet</div>`}
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${unreadReplies ? `<span class="badge badge-danger">${unreadReplies} ${unreadReplies === 1 ? 'reply' : 'replies'}</span>` : ''}
                <button class="btn btn-secondary text-sm" onclick="diary_viewStudent('${s.id}','${activeClassId}')">${icon('chat','w-4 h-4')} ${entries.length ? 'View / Add' : 'Write First Entry'}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function diary_viewStudent(studentId, classId) {
  const s = DB.find('students', studentId);
  const parent = s && s.parentId ? DB.find('parents', s.parentId) : null;
  const teacherId = AUTH.current.id;
  const entries = DB.query('diaryEntries', e => e.studentId === studentId && e.teacherId === teacherId && e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                    .sort((a,b) => b.date.localeCompare(a.date));

  // Mark all unread replies as read
  entries.filter(e => e.parentReply && !e.teacherReadReply).forEach(e => {
    DB.update('diaryEntries', e.id, { teacherReadReply: true });
  });

  const entriesHtml = entries.length === 0
    ? `<div class="text-center text-sm text-slate-400 py-6">No diary entries yet for ${s ? s.name : 'this student'}.</div>`
    : entries.map(e => {
        const catColors = { Homework: 'bg-blue-50 text-blue-700 border-blue-200', Behaviour: 'bg-amber-50 text-amber-700 border-amber-200', Academic: 'bg-emerald-50 text-emerald-700 border-emerald-200', Health: 'bg-red-50 text-red-700 border-red-200', General: 'bg-slate-50 text-slate-700 border-slate-200' };
        const cc = catColors[e.category] || catColors.General;
        return `<div class="border border-slate-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full border ${cc}">${e.category}</span>
              <span class="text-xs text-slate-500">${fdate(e.date, {long:true})}</span>
            </div>
            <span class="text-xs ${e.parentRead ? 'text-emerald-600' : 'text-amber-600'} font-semibold">
              ${e.parentRead ? `Read ${fdate(e.parentReadAt, {relative:true})}` : 'Not yet read by parent'}
            </span>
          </div>
          <p class="text-sm text-slate-800 leading-relaxed">${e.note}</p>
          ${e.parentReply ? `<div class="bg-slate-50 rounded-xl p-3 border-l-4 border-brand-400">
            <div class="text-xs font-semibold text-slate-500 mb-1">${parent ? parent.name : 'Parent'} replied · ${fdate(e.parentRepliedAt, {relative:true})}</div>
            <p class="text-sm text-slate-700">${e.parentReply}</p>
          </div>` : `<div class="text-xs text-slate-400 italic">No parent reply yet.</div>`}
        </div>`;
      }).join('');

  modal({
    title: `Diary — ${s ? s.name : ''}`,
    size: 'lg',
    body: `
      <!-- Write new entry -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
        <div class="font-semibold text-emerald-800 mb-3 text-sm">Write New Entry</div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div><label class="input-label text-xs">Category</label>
            <select id="de_cat" class="input text-sm">${getDiaryCategories().map(c => `<option>${c}</option>`).join('')}</select></div>
          <div><label class="input-label text-xs">Date</label>
            <input id="de_date" type="date" class="input text-sm" value="${today()}"></div>
        </div>
        <div class="mb-3"><label class="input-label text-xs">Note to Parent</label>
          <textarea id="de_note" rows="3" class="input text-sm" placeholder="Describe what you observed today..."></textarea></div>
        <button class="btn btn-primary text-sm w-full" onclick="diary_saveEntry('${studentId}','${classId}')">Send to Parent</button>
      </div>
      <!-- Past entries -->
      <div class="font-semibold text-slate-700 text-sm mb-3">Previous Entries</div>
      <div class="space-y-3 max-h-96 overflow-y-auto pr-1">${entriesHtml}</div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function diary_saveEntry(studentId, classId) {
  const note = (document.getElementById('de_note') || {}).value.trim();
  const cat  = (document.getElementById('de_cat')  || {}).value;
  const date = (document.getElementById('de_date') || {}).value || today();
  if (!note) { toast('Note cannot be empty', 'danger'); return; }

  const entry = {
    id: uid('de'), schoolId: AUTH.current.schoolId || 'sch_brightlights',
    studentId, teacherId: AUTH.current.id, category: cat,
    note, date, parentRead: false, parentReadAt: null,
    parentReply: null, parentRepliedAt: null, teacherReadReply: false,
    createdAt: now()
  };
  DB.insert('diaryEntries', entry);

  // Notify parent
  const s = DB.find('students', studentId);
  if (s && s.parentId) {
    DB.insert('notifications', {
      id: uid('not'), userId: s.parentId,
      title: 'New note from teacher',
      body: `${AUTH.current.name} wrote a note about ${s.name}: ${cat} — tap to read and reply.`,
      type: 'info', read: false, timestamp: now()
    });
  }

  document.getElementById('modalBackdrop').click();
  // Stay on messages / student notes tab
  APP.params.msgTab = 'notes';
  APP.params.notesClassId = classId;
  APP.render();
  toast('Note sent to parent', 'success');
}

// ── Inline notes content for the Messages "Student Notes" tab ─────────────────

function diary_notesContent(role) {
  if (role === 'teacher') return diary_notesTeacher();
  if (role === 'parent')  return diary_notesParent();
  return '';
}

function diary_notesTeacher() {
  const teacherId = AUTH.current.id;
  const classes = (typeof teacherClasses === 'function' ? teacherClasses() : DB.query('classes', c => c.schoolId === (AUTH.current.schoolId || 'sch_brightlights')));
  if (!classes.length) return emptyState({ title: 'No classes assigned', body: 'You have no classes to write notes for.', icon: 'book' });

  const activeClassId = APP.params.notesClassId || classes[0].id;
  const students = COMPUTE.studentsByClass(activeClassId);

  return `
    <div class="flex gap-2 mb-4 flex-wrap">
      ${classes.map(c => `<button onclick="APP.params.notesClassId='${c.id}';APP.render()"
        class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeClassId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
    </div>

    ${students.length === 0
      ? emptyState({ title: 'No students in this class', body: 'Enrol students to start writing notes.', icon: 'students' })
      : `<div class="space-y-2">
          ${students.map(s => {
            const entries = DB.query('diaryEntries', e => e.studentId === s.id && e.teacherId === teacherId && e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                             .sort((a,b) => b.date.localeCompare(a.date));
            const unreadReplies = entries.filter(e => e.parentReply && !e.teacherReadReply).length;
            const lastEntry = entries[0];
            const parent = s.parentId ? DB.find('parents', s.parentId) : null;
            return `<div class="card p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  ${avatar(s, 'sm')}
                  <div class="min-w-0">
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="text-xs text-slate-400">${parent ? parent.name : 'No parent linked'} · ${entries.length} ${entries.length === 1 ? 'note' : 'notes'} this term</div>
                    ${lastEntry ? `<div class="text-xs mt-0.5 ${lastEntry.parentRead ? 'text-emerald-600' : 'text-amber-600'}">
                      Last: ${fdate(lastEntry.date,{short:true})} — ${lastEntry.category} — ${lastEntry.parentRead ? 'Read' : 'Unread by parent'}
                    </div>` : `<div class="text-xs text-slate-400 mt-0.5">No notes yet</div>`}
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  ${unreadReplies ? `<span class="badge badge-danger">${unreadReplies} ${unreadReplies === 1 ? 'reply' : 'replies'}</span>` : ''}
                  <button class="btn btn-secondary text-sm" onclick="diary_viewStudent('${s.id}','${activeClassId}')">
                    ${icon('chat','w-4 h-4')} ${entries.length ? 'View / Add' : 'Write Note'}
                  </button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>`}
  `;
}

function diary_notesParent() {
  const parentId = AUTH.current.id;
  const children = COMPUTE.parentChildren(parentId).filter(s => s.status === 'active');
  if (!children.length) return emptyState({ title: 'No children linked', body: 'No active children found on your account.', icon: 'students' });

  const activeId = APP.params.notesStudentId || children[0].id;
  const student  = DB.find('students', activeId);
  const entries  = DB.query('diaryEntries', e => e.studentId === activeId && e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                     .sort((a,b) => b.date.localeCompare(a.date));
  const unread   = entries.filter(e => !e.parentRead).length;

  // Mark as read — only update entries that are actually unread
  const unreadEntries = entries.filter(e => !e.parentRead);
  if (unreadEntries.length) {
    unreadEntries.forEach(e => {
      DB.update('diaryEntries', e.id, { parentRead: true, parentReadAt: new Date().toISOString() });
    });
  }

  const catColors = { Homework: 'border-blue-400', Behaviour: 'border-amber-400', Academic: 'border-emerald-400', Health: 'border-red-400', General: 'border-slate-300' };
  const catBadge  = { Homework: 'bg-blue-50 text-blue-700 border-blue-200', Behaviour: 'bg-amber-50 text-amber-700 border-amber-200', Academic: 'bg-emerald-50 text-emerald-700 border-emerald-200', Health: 'bg-red-50 text-red-700 border-red-200', General: 'bg-slate-100 text-slate-600 border-slate-200' };

  const catFilter = APP.params.notesCategory;
  const filteredEntries = catFilter ? entries.filter(e => e.category === catFilter) : entries;

  const categories = ['All', ...getDiaryCategories()];
  const catBtns = categories.map(c => `<button onclick="APP.params.notesCategory=${c === 'All' ? 'null' : "'" + c + "'"}; APP.render()" class="badge ${(catFilter || 'All') === c ? 'badge-primary' : 'badge-neutral'} cursor-pointer">${c}</button>`).join('');

  return `
    ${children.length > 1 ? `<div class="flex gap-2 mb-4 flex-wrap">
      ${children.map(c => `<button onclick="APP.params.notesStudentId='${c.id}';APP.render()"
        class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
    </div>` : ''}

    ${unread > 0 ? `<div class="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 font-medium">
      ${icon('bell','w-4 h-4 inline mr-1')} ${unread} new ${unread === 1 ? 'note' : 'notes'} since your last visit — now marked as read.
    </div>` : ''}

    <div class="flex gap-2 mb-4 flex-wrap">${catBtns}</div>

    ${filteredEntries.length === 0
      ? emptyState({ title: 'No notes yet', body: 'Teacher notes about your child will appear here.', icon: 'book' })
      : `<div class="space-y-4">
          ${filteredEntries.map(e => {
            const teacher = DB.find('teachers', e.teacherId);
            const cc = catColors[e.category] || catColors.General;
            const cb = catBadge[e.category]  || catBadge.General;
            return `<div class="card p-4 border-l-4 ${cc}">
              <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full border ${cb}">${e.category}</span>
                  <span class="text-xs text-slate-500">${fdate(e.date,{long:true})}</span>
                </div>
                <span class="text-xs text-slate-400">${teacher ? teacher.name : 'Teacher'}</span>
              </div>
              <p class="text-sm text-slate-800 leading-relaxed mb-3">${e.note}</p>
              ${e.parentReply
                ? `<div class="bg-brand-50 rounded-xl p-3 border border-brand-200">
                    <div class="text-xs font-semibold text-brand-700 mb-1">Your reply · ${fdate(e.parentRepliedAt,{relative:true})}</div>
                    <p class="text-sm text-slate-700">${e.parentReply}</p>
                   </div>`
                : `<div class="flex gap-2 mt-1">
                    <textarea id="reply_${e.id}" rows="2" class="input text-sm flex-1" placeholder="Reply to ${teacher ? teacher.name : 'teacher'}…"></textarea>
                    <button class="btn btn-primary self-end text-sm" onclick="diary_parentReply('${e.id}')">Reply</button>
                   </div>`}
            </div>`;
          }).join('')}
        </div>`}
  `;
}

// ── Parent Views ──────────────────────────────────────────────

function view_par_diary(params) {
  const parentId = AUTH.current.id;
  const children = COMPUTE.parentChildren(parentId).filter(s => s.status === 'active');
  if (!children.length) return emptyState({ title: 'No children linked', body: 'No active children found on your account.', icon: 'students' });

  const activeId = (params && params.studentId) || children[0].id;
  const student  = DB.find('students', activeId);
  const entries  = DB.query('diaryEntries', e => e.studentId === activeId && e.schoolId === (AUTH.current.schoolId || 'sch_brightlights'))
                     .sort((a,b) => b.date.localeCompare(a.date));
  const unread   = entries.filter(e => !e.parentRead).length;

  // Mark all as read when parent opens
  entries.filter(e => !e.parentRead).forEach(e => {
    DB.update('diaryEntries', e.id, { parentRead: true, parentReadAt: now() });
  });

  const catColors = { Homework: 'border-blue-400', Behaviour: 'border-amber-400', Academic: 'border-emerald-400', Health: 'border-red-400', General: 'border-slate-300' };
  const catBadge  = { Homework: 'bg-blue-50 text-blue-700 border-blue-200', Behaviour: 'bg-amber-50 text-amber-700 border-amber-200', Academic: 'bg-emerald-50 text-emerald-700 border-emerald-200', Health: 'bg-red-50 text-red-700 border-red-200', General: 'bg-slate-100 text-slate-600 border-slate-200' };

  return `
    ${pageHeader({ title: 'Diary', subtitle: 'Structured notes from your child\'s teachers' })}

    ${children.length > 1 ? `<div class="flex gap-2 mb-4 flex-wrap">
      ${children.map(c => `<button onclick="APP.go('par_diary',{studentId:'${c.id}'})" class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${c.id === activeId ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c.name}</button>`).join('')}
    </div>` : ''}

    ${unread > 0 ? `<div class="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 font-medium">
      ${icon('bell','w-4 h-4 inline mr-1')} ${unread} new ${unread === 1 ? 'entry' : 'entries'} since your last visit — now marked as read.
    </div>` : ''}

    ${entries.length === 0
      ? emptyState({ title: 'No diary entries yet', body: 'When your child\'s teachers write diary notes, they will appear here.', icon: 'book' })
      : `<div class="space-y-4">
          ${entries.map(e => {
            const teacher = DB.find('teachers', e.teacherId);
            const cc = catColors[e.category] || catColors.General;
            const cb = catBadge[e.category] || catBadge.General;
            return `<div class="card p-4 border-l-4 ${cc}">
              <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full border ${cb}">${e.category}</span>
                  <span class="text-xs text-slate-500">${fdate(e.date, {long:true})}</span>
                </div>
                <span class="text-xs text-slate-400">${teacher ? teacher.name : 'Teacher'}</span>
              </div>
              <p class="text-sm text-slate-800 leading-relaxed mb-3">${e.note}</p>
              ${e.parentReply
                ? `<div class="bg-brand-50 rounded-xl p-3 border border-brand-200">
                    <div class="text-xs font-semibold text-brand-700 mb-1">Your reply · ${fdate(e.parentRepliedAt, {relative:true})}</div>
                    <p class="text-sm text-slate-700">${e.parentReply}</p>
                   </div>`
                : `<div class="flex gap-2 mt-1">
                    <textarea id="reply_${e.id}" rows="2" class="input text-sm flex-1" placeholder="Type your reply to ${teacher ? teacher.name : 'the teacher'}..."></textarea>
                    <button class="btn btn-primary self-end text-sm" onclick="diary_parentReply('${e.id}')">Reply</button>
                   </div>`}
            </div>`;
          }).join('')}
        </div>`}
  `;
}

function diary_parentReply(entryId) {
  const textarea = document.getElementById('reply_' + entryId);
  const reply = textarea ? textarea.value.trim() : '';
  if (!reply) { toast('Reply cannot be empty', 'danger'); return; }
  DB.update('diaryEntries', entryId, { parentReply: reply, parentRepliedAt: now(), teacherReadReply: false });

  // Notify teacher
  const entry = DB.find('diaryEntries', entryId);
  if (entry) {
    const replyStudent = DB.find('students', entry.studentId);
    DB.insert('notifications', {
      id: uid('not'), userId: entry.teacherId,
      title: 'Parent replied to your note',
      body: `A parent replied to your note about ${replyStudent ? replyStudent.name : 'a student'}. Tap to read.`,
      type: 'info', read: false, timestamp: now()
    });
  }
  APP.params.msgTab = 'notes';
  APP.render();
  toast('Reply sent to teacher', 'success');
}
