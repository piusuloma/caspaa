/* ============================================================
   SHARED MODULES — messages & announcements
   Used by parent, teacher, and admin roles.
   ============================================================ */

/* ---------- Messages / Chat ---------- */
function view_messages_shared(role) {
  const me = AUTH.current.id;
  const myConvos = COMPUTE.conversationsFor(me);
  const activeConvoId = APP.params.convoId || (myConvos[0] ? myConvos[0].id : null);

  // Compose new chat options
  let contacts = [];
  if (role === 'parent') {
    // teachers of my children
    const children = parentChildren();
    const classIds = [...new Set(children.map(c => c.classId))];
    const teacherIds = new Set();
    classIds.forEach(cid => {
      const cls = DB.find('classes', cid);
      if (cls && cls.teacherId) teacherIds.add(cls.teacherId);
      // also subject teachers for that class
      DB.query('timetable', t => t.classId === cid).forEach(t => teacherIds.add(t.teacherId));
    });
    contacts = [...teacherIds].map(id => DB.find('teachers', id)).filter(Boolean);
  } else if (role === 'teacher') {
    // parents of my students
    const t = DB.find('teachers', me);
    if (t) {
      const classIds = t.classes || [];
      const parentIds = new Set();
      classIds.forEach(cid => COMPUTE.studentsByClass(cid).forEach(s => parentIds.add(s.parentId)));
      contacts = [...parentIds].map(id => DB.find('parents', id)).filter(Boolean);
    }
  } else if (role === 'schooladmin') {
    contacts = [...DB.get('teachers'), ...DB.get('parents')];
  }

  // For admin, split contacts into two groups for the button
  const teacherContacts = role === 'schooladmin' ? DB.query('teachers', t => t.schoolId === currentSchoolId()) : [];
  const parentContacts  = role === 'schooladmin' ? DB.get('parents') : [];

  const activeConvo = activeConvoId ? DB.find('conversations', activeConvoId) : null;
  let otherParty = null;
  if (activeConvo) {
    const otherId = activeConvo.participants.find(p => p !== me);
    otherParty = DB.find('teachers', otherId) || DB.find('parents', otherId);
  }

  const newChatActions = role === 'schooladmin'
    ? `<button class="btn btn-secondary" onclick="newChatModal(${JSON.stringify(teacherContacts.map(c=>c.id)).replace(/"/g,'&quot;')}, 'Teacher')">${icon('teacher','w-4 h-4')} Chat with Teacher</button>
       <button class="btn btn-primary" onclick="newChatModal(${JSON.stringify(parentContacts.map(c=>c.id)).replace(/"/g,'&quot;')}, 'Parent')">${icon('students','w-4 h-4')} Chat with Parent</button>`
    : contacts.length ? `<button class="btn btn-primary" onclick="newChatModal(${JSON.stringify(contacts.map(c=>c.id)).replace(/"/g,'&quot;')})">${icon('plus','w-4 h-4')} New Chat</button>` : '';

  return `
    ${pageHeader({
      title: 'Messages',
      subtitle: role === 'parent' ? 'Chat with your child\'s teachers' : 'Connect with parents and teachers',
      actions: newChatActions
    })}

    <div class="card overflow-hidden" style="height: calc(100vh - 220px); min-height: 500px;">
      <div class="flex h-full">
        <!-- Convo list -->
        <div class="w-full sm:w-72 border-r border-slate-200 flex flex-col ${activeConvo ? 'hidden sm:flex' : ''}">
          <div class="p-3 border-b border-slate-100">
            <input id="chat_search" class="input" placeholder="Search conversations…" oninput="chatSearchFilter(this)" />
          </div>
          <div class="flex-1 overflow-y-auto scroll-area">
            ${myConvos.length === 0 ? `<div class="p-6 text-center text-slate-500">
              <p class="text-sm">No messages yet</p>
              ${contacts.length ? `<button class="btn btn-primary mt-3 text-sm" onclick="newChatModal(${JSON.stringify(contacts.map(c=>c.id)).replace(/"/g,'&quot;')})">Start a chat with ${role === 'parent' ? 'a teacher' : 'a parent'}</button>` : ''}
            </div>` : myConvos.map(c => {
              const otherId = c.participants.find(p => p !== me);
              const other = DB.find('teachers', otherId) || DB.find('parents', otherId) || { name: 'Unknown' };
              const last = c.messages[c.messages.length - 1];
              return `<div class="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${activeConvoId === c.id ? 'bg-brand-50' : ''}" data-chat-name="${other.name.toLowerCase()}" onclick="APP.go('${role==='parent'?'par_messages':role==='teacher'?'tch_messages':'adm_messages'}', { convoId: '${c.id}' })">
                <div class="flex items-center gap-2.5">
                  ${avatar(other.name, 'md')}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm text-slate-900 truncate">${other.name}</div>
                    <div class="text-xs text-slate-500 truncate">${last ? last.text : '(no messages)'}</div>
                  </div>
                  <div class="text-xs text-slate-500">${last ? fdate(last.timestamp, { relative: true }) : ''}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Chat panel -->
        <div class="flex-1 flex flex-col ${activeConvo ? '' : 'hidden sm:flex'}">
          ${activeConvo && otherParty ? `
            <div class="p-3 border-b border-slate-200 flex items-center gap-3">
              <button class="sm:hidden btn btn-ghost !p-1.5" onclick="APP.go('${role==='parent'?'par_messages':role==='teacher'?'tch_messages':'adm_messages'}', { convoId: null })">${icon('arrow_left','w-4 h-4')}</button>
              ${avatar(otherParty.name, 'sm')}
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-900">${otherParty.name}</div>
                <div class="text-xs text-slate-500">Active</div>
              </div>
              <button class="btn btn-ghost !p-1.5" aria-label="Send via WhatsApp" title="Send via WhatsApp" onclick="sendWhatsApp('${otherParty.phone || ''}')">
                <svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto scroll-area p-4 flex flex-col gap-1.5" id="chatBody">
              ${activeConvo.messages.map(m => renderBubble(m, me)).join('')}
            </div>

            <div class="p-3 border-t border-slate-200 flex gap-2 items-center">
              <input type="file" id="chatFileInput" accept="image/*,.pdf,.doc,.docx" class="hidden" onchange="onChatFilePick(event, '${activeConvo.id}')" />
              <button class="btn btn-ghost !p-2" onclick="document.getElementById('chatFileInput').click()" aria-label="Attach file" title="Attach file">${icon('paperclip','w-5 h-5')}</button>
              <input id="msgInput" class="input flex-1" placeholder="Type a message…" onkeypress="if(event.key==='Enter') sendMessage('${activeConvo.id}')" />
              <button class="btn btn-primary" onclick="sendMessage('${activeConvo.id}')">${icon('send','w-5 h-5')}</button>
            </div>
          ` : `
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              ${icon('chat','w-20 h-20 mb-3 opacity-30')}
              <p class="font-semibold">Select a conversation</p>
              <p class="text-sm">or start a new one</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderBubble(m, me) {
  const inner = m.attachment
    ? (m.attachment.type === 'image'
        ? `<img src="${m.attachment.data}" class="rounded-lg max-h-48" style="display:block" />${m.text ? `<div class="mt-1">${escapeHtml(m.text)}</div>` : ''}`
        : `<a href="${m.attachment.data}" download="${escapeHtml(m.attachment.name)}" class="flex items-center gap-2 underline">${icon('paperclip','w-4 h-4')}<span>${escapeHtml(m.attachment.name)}</span></a>${m.text ? `<div class="mt-1">${escapeHtml(m.text)}</div>` : ''}`)
    : escapeHtml(m.text);
  return `<div class="bubble ${m.from === me ? 'mine' : 'theirs'}">
    ${inner}
    <div class="text-xs ${m.from === me ? 'text-emerald-100' : 'text-slate-500'} mt-1">${fdate(m.timestamp, { relative: true })}</div>
  </div>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function onChatFilePick(ev, convoId) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { toast('File too large (max 1MB for this demo)', 'danger'); ev.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const isImage = file.type.startsWith('image/');
    const convo = DB.find('conversations', convoId);
    const message = {
      from: AUTH.current.id,
      text: '',
      attachment: { type: isImage ? 'image' : 'file', name: file.name, data: e.target.result },
      timestamp: now()
    };
    convo.messages.push(message);
    DB.update('conversations', convoId, { messages: convo.messages });
    const body = document.getElementById('chatBody');
    if (body) {
      body.insertAdjacentHTML('beforeend', renderBubble(message, AUTH.current.id));
      body.scrollTop = body.scrollHeight;
    }
    const other = convo.participants.find(p => p !== AUTH.current.id);
    DB.insert('notifications', { id: uid('not'), userId: other, title: 'New attachment', body: `${file.name}`, type: 'info', read: false, timestamp: now() });
    toast(isImage ? 'Photo sent' : 'File sent', 'success');
  };
  reader.onerror = () => toast('Could not read file', 'danger');
  reader.readAsDataURL(file);
  ev.target.value = '';
}

function sendMessage(convoId) {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text) return;
  const convo = DB.find('conversations', convoId);
  const message = { from: AUTH.current.id, text, timestamp: now() };
  convo.messages.push(message);
  DB.update('conversations', convoId, { messages: convo.messages });
  input.value = '';
  const body = document.getElementById('chatBody');
  if (body) {
    body.insertAdjacentHTML('beforeend', renderBubble(message, AUTH.current.id));
    body.scrollTop = body.scrollHeight;
  }
  const other = convo.participants.find(p => p !== AUTH.current.id);
  DB.insert('notifications', { id: uid('not'), userId: other, title: 'New message', body: text.slice(0, 60), type: 'info', read: false, timestamp: now() });
}

function sendWhatsApp(phone) {
  if (!phone) { toast('Phone number not available', 'warn'); return; }
  const num = phone.replace(/[^0-9]/g, '').replace(/^0/, '234');
  window.open(`https://wa.me/${num}`, '_blank');
}

function newChatModal(contactIds, groupLabel) {
  const contacts = contactIds.map(id => DB.find('teachers', id) || DB.find('parents', id)).filter(Boolean);
  const label = groupLabel ? `Chat with a ${groupLabel}` : 'Start New Chat';
  const hint = groupLabel === 'Parent' ? 'Select a parent to message:' : groupLabel === 'Teacher' ? 'Select a teacher to message:' : 'Choose someone to message:';
  modal({
    title: label,
    body: `
      <p class="text-sm text-slate-500 mb-3">${hint}</p>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        ${contacts.map(c => {
          const sub = Array.isArray(c.subjects) && c.subjects.length ? c.subjects.map(id => { const s = DB.find('subjects', id); return s ? s.name : ''; }).filter(Boolean).join(', ') : (c.role || c.occupation || '');
          return `<button class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 hover:border-brand-500 border-2 border-slate-100 transition text-left" onclick="startChat('${c.id}')">
            ${avatar(c.name, 'md')}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${c.name}</div>
              <div class="text-xs text-slate-500 truncate">${sub}</div>
            </div>
          </button>`;
        }).join('')}
        ${contacts.length === 0 ? `<p class="text-sm text-slate-500 text-center py-4">No contacts available.</p>` : ''}
      </div>
    `
  });
}

function startChat(otherId) {
  // Check if conversation already exists
  const me = AUTH.current.id;
  let convo = DB.query('conversations', c => c.participants.includes(me) && c.participants.includes(otherId))[0];
  if (!convo) {
    convo = { id: uid('conv'), schoolId: currentSchoolId(), participants: [me, otherId], messages: [] };
    DB.insert('conversations', convo);
  }
  document.getElementById('modalBackdrop').click();
  const role = AUTH.current.role;
  if (role === 'parent') {
    APP.go('par_comms', { commsTab: 'messages', convoId: convo.id });
  } else {
    APP.go(role === 'teacher' ? 'tch_messages' : 'adm_messages', { convoId: convo.id });
  }
}

/* ---------- Announcements ---------- */
function view_announce_shared(role) {
  const announcements = DB.query('announcements', a => a.schoolId === currentSchoolId()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const canCreate = role === 'schooladmin' || role === 'superadmin';

  return `
    ${pageHeader({
      title: 'Announcements',
      subtitle: 'Notices from the school',
      actions: canCreate ? `<button class="btn btn-primary" onclick="newAnnouncementModal()">${icon('plus','w-4 h-4')} New Announcement</button>` : ''
    })}
    ${announcements.length === 0 ? emptyState({ title: 'No announcements', body: 'Announcements will appear here.', icon: 'bell' }) : `
      <div class="space-y-3">
        ${(() => { const audienceLabels = { all: 'Everyone', parents: 'Parents', teachers: 'Teachers', students: 'Students' }; return announcements.map(a => `<div class="card p-5">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">${icon('bell','w-5 h-5')}</div>
            <div class="flex-1">
              <h3 class="font-bold text-slate-900">${a.title}</h3>
              <p class="text-xs text-slate-500">${fdate(a.timestamp, { long: true })} · ${audienceLabels[a.audience] || a.audience}</p>
            </div>
            <span class="badge badge-${a.audience === 'all' ? 'info' : 'neutral'}">${audienceLabels[a.audience] || a.audience}</span>
          </div>
          <p class="text-slate-700">${a.body}</p>
        </div>`).join(''); })()}
      </div>
    `}
  `;
}

function newAnnouncementModal() {
  modal({
    title: 'New Announcement',
    body: `
      <div class="space-y-3">
        <div><label class="input-label" for="ann_title">Title</label><input id="ann_title" class="input" placeholder="e.g. Mid-term Break" /></div>
        <div><label class="input-label" for="ann_body">Message</label><textarea id="ann_body" rows="4" class="input" placeholder="Write your announcement…"></textarea></div>
        <div><label class="input-label" for="ann_audience">Audience</label>
          <select id="ann_audience" class="input"><option value="all">Everyone (Parents, Teachers, Students)</option><option value="parents">Parents only</option><option value="teachers">Teachers only</option></select>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="ann_whatsapp" checked />
          <span>Also send to WhatsApp ${icon('check', 'w-3 h-3 inline text-emerald-600')}</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="ann_email" checked />
          <span>Also send to Email ${icon('check', 'w-3 h-3 inline text-emerald-600')}</span>
        </label>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveAnnouncement()">${icon('send','w-4 h-4')} Send Now</button>`
  });
}

function saveAnnouncement() {
  const title = document.getElementById('ann_title').value.trim();
  const body = document.getElementById('ann_body').value.trim();
  const audience = document.getElementById('ann_audience').value;
  const wa = document.getElementById('ann_whatsapp').checked;
  const em = document.getElementById('ann_email').checked;
  if (!title || !body) { toast('Title and message required', 'danger'); return; }

  // Send notifications to relevant users
  let recipients = [];
  if (audience === 'all' || audience === 'parents') recipients.push(...DB.query('parents', p => p.schoolId === currentSchoolId()));
  if (audience === 'all' || audience === 'teachers') recipients.push(...DB.query('teachers', t => t.schoolId === currentSchoolId()));
  recipients.forEach(r => {
    DB.insert('notifications', { id: uid('not'), userId: r.id, title, body, type: 'info', read: false, timestamp: now() });
  });

  // Build a delivery report
  const channels = ['in-app'];
  if (wa) channels.push('WhatsApp');
  if (em) channels.push('Email');
  const deliveryReport = {
    totalRecipients: recipients.length,
    channels,
    sent:   { 'in-app': recipients.length, 'WhatsApp': wa ? recipients.length : 0, 'Email': em ? recipients.length : 0 },
    failed: { 'in-app': 0, 'WhatsApp': 0, 'Email': 0 },
    generatedAt: now()
  };
  DB.insert('announcements', {
    id: uid('ann'), schoolId: currentSchoolId(),
    title, body, audience, sentBy: AUTH.current.id, timestamp: now(),
    deliveryReport
  });

  document.getElementById('modalBackdrop').click();
  APP.render();

  // Show delivery report
  modal({
    title: 'Announcement Sent · Delivery Report',
    body: `
      <div class="text-center py-3">
        <div class="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">${icon('check','w-7 h-7')}</div>
        <div class="font-bold">${recipients.length} recipients</div>
        <div class="text-sm text-slate-500">${title}</div>
      </div>
      <table class="tbl mt-3">
        <th scope="col"ead><tr><th scope="col">Channel</th><th scope="col" class="text-right">Sent</th><th scope="col" class="text-right text-slate-500 text-xs font-normal">Note</th></tr></thead>
        <tbody>
          ${channels.map(c => {
            const d = deliveryReport.sent[c] || 0;
            const note = c === 'in-app' ? 'Delivered' : 'Queued — delivery status not tracked';
            return `<tr><td><strong>${c}</strong></td><td class="text-right text-emerald-700 font-bold">${d}</td><td class="text-right text-xs text-slate-500">${note}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Done</button>`
  });
}

function chatSearchFilter(inp) {
  const q = (inp.value || '').toLowerCase().trim();
  document.querySelectorAll('[data-chat-name]').forEach(el => {
    el.style.display = (!q || el.dataset.chatName.includes(q)) ? '' : 'none';
  });
}
