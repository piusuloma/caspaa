// notify.js — Bulk Email Announcements module for CASPAA

// ─── Main View ────────────────────────────────────────────────────────────────

function view_adm_bulk_notify(params) {
  const tab = (APP.params && APP.params.notifyTab) || 'email';

  const campaigns = (DB.query('smsCampaigns', r => r.schoolId === AUTH.current.schoolId) || [])
    .filter(c => c.channel === 'email');
  const historyCount = campaigns.length;

  const tabs = [
    { key: 'email',   label: 'Compose Email' },
    { key: 'history', label: `History (${historyCount})` },
  ];

  const tabBar = tabs.map(t => {
    const isActive = tab === t.key;
    return `<button
      class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${isActive ? 'bg-navy-800 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}"
      onclick="APP.params.notifyTab='${t.key}';APP.render()">
      ${t.label}
    </button>`;
  }).join('');

  let tabContent = '';
  if (tab === 'email') tabContent = notify_composeEmailTab();
  else                 tabContent = notify_historyTab(campaigns);

  return `
    <div class="p-6 max-w-6xl mx-auto">
      ${pageHeader({
        title: 'Email Announcements',
        subtitle: 'Send bulk emails to parents, teachers, or specific classes',
      })}
      <div class="flex gap-2 mb-6 flex-wrap">${tabBar}</div>
      ${tabContent}
    </div>
  `;
}

// ─── Compose Email Tab ────────────────────────────────────────────────────────

function notify_composeEmailTab() {
  const classOptions = notify_classOptions();
  const school = DB.find('schools', AUTH.current.schoolId) || {};
  const schoolName = school.name || 'School';

  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Form -->
      <div class="flex flex-col gap-4">
        <div class="card p-5">
          <h3 class="font-semibold text-slate-800 mb-4">Compose Email</h3>

          <!-- Audience -->
          <div class="mb-3">
            <label class="input-label" for="email_audience">Audience</label>
            <select id="email_audience" class="input" onchange="notify_updateEmailCount()">
              <option value="all_parents">All Parents</option>
              <option value="all_teachers">All Teachers &amp; Staff</option>
              <option value="all_students">All Students</option>
              <option value="class">Specific Class (Parents)</option>
            </select>
          </div>

          <!-- Class sub-dropdown -->
          <div id="email_class_row" class="mb-3 hidden">
            <label class="input-label" for="email_class">Select Class</label>
            <select id="email_class" class="input" onchange="notify_updateEmailCount()">
              ${classOptions}
            </select>
          </div>

          <!-- Recipient count banner -->
          <div id="email_count_banner" class="mb-3 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl px-3 py-2 hidden"></div>

          <!-- Subject -->
          <div class="mb-3">
            <label class="input-label" for="email_subject">Subject Line</label>
            <input id="email_subject" class="input" type="text"
              placeholder="e.g. End of Term Notice — ${schoolName}"
              oninput="notify_updateEmailPreview()" />
          </div>

          <!-- Body -->
          <div class="mb-5">
            <label class="input-label" for="email_body">Email Body</label>
            <textarea id="email_body" class="input text-sm" rows="9"
              placeholder="Dear Parent,&#10;&#10;We would like to inform you that…&#10;&#10;Thank you,&#10;The Management"
              oninput="notify_updateEmailPreview()"></textarea>
            <p class="text-xs text-slate-500 mt-1">The school logo header and contact footer are added automatically.</p>
          </div>

          <button class="btn btn-primary w-full" onclick="notify_previewEmail()">
            ${icon('chat','w-4 h-4 inline mr-1')} Preview &amp; Send Email
          </button>
        </div>
      </div>

      <!-- Live preview -->
      <div class="flex flex-col gap-3">
        <div class="card p-0 overflow-hidden">
          <div class="bg-navy-800 text-white text-center py-4 px-6">
            <div class="font-bold text-lg tracking-wide">${schoolName}</div>
            <div class="text-brand-200 text-xs mt-0.5">Official Communication</div>
          </div>
          <div class="p-6">
            <p class="text-xs text-slate-500 uppercase font-semibold mb-1 tracking-widest">Subject</p>
            <p id="email_preview_subject" class="font-semibold mb-4 text-base italic text-slate-500">
              (Subject will appear here)
            </p>
            <hr class="border-slate-100 mb-4" />
            <div id="email_preview_body" class="text-sm text-slate-600 whitespace-pre-wrap min-h-[8rem] leading-relaxed italic text-slate-500">
              (Email body will appear here as you type…)
            </div>
            <hr class="border-slate-100 mt-6 mb-3" />
            <p class="text-xs text-slate-500 text-center">
              ${schoolName} · Sent via CASPAA School System
            </p>
          </div>
        </div>
        <p class="text-xs text-slate-500 text-center">Live preview — updates as you type</p>
      </div>

    </div>
  `;
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function notify_historyTab(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return emptyState({
      icon: 'chat',
      title: 'No emails sent yet',
      body: 'Sent email announcements will appear here.',
    });
  }

  const sorted = [...campaigns].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));

  const rows = sorted.map(c => {
    const statusBadge = c.status === 'sent'
      ? `<span class="badge badge-success">Sent</span>`
      : `<span class="badge badge-danger">Failed</span>`;

    const preview = c.subject || '(no subject)';
    const truncated = preview.length > 60 ? preview.substring(0, 57) + '…' : preview;

    return `
      <tr>
        <td class="text-xs text-slate-500 whitespace-nowrap">${fdate(c.sentAt, { short: true })}</td>
        <td class="text-sm text-slate-600">${c.audienceLabel || c.audienceKey || '—'}</td>
        <td class="text-sm text-slate-700 max-w-xs"><span title="${preview.replace(/"/g,'&quot;')}">${truncated}</span></td>
        <td class="font-semibold text-center">${c.recipientCount || 0}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card overflow-hidden">
      <table class="tbl">
        <th scope="col"ead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Audience</th>
            <th scope="col">Subject</th>
            <th scope="col" class="text-center">Recipients</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notify_classOptions() {
  const classes = (DB.query('classes', r => r.schoolId === AUTH.current.schoolId) || []);
  if (!classes.length) return '<option value="">No classes found</option>';
  return classes.map(c => `<option value="${c.id}">${c.name || c.id}</option>`).join('');
}

function notify_countAudience(audienceKey, classId) {
  const sid = AUTH.current.schoolId;
  try {
    if (audienceKey === 'all_parents')  return (DB.query('parents',  p => p.schoolId === sid) || []).length;
    if (audienceKey === 'all_teachers') return (DB.query('teachers', t => t.schoolId === sid) || []).length;
    if (audienceKey === 'all_students') return (DB.query('students', s => s.schoolId === sid && s.status === 'active') || []).length;
    if (audienceKey === 'class' && classId) return (COMPUTE.studentsByClass(classId) || []).length;
  } catch(e) {}
  return 0;
}

function notify_getRecipientIds(audienceKey, classId) {
  const sid = AUTH.current.schoolId;
  try {
    if (audienceKey === 'all_parents')  return (DB.query('parents',  p => p.schoolId === sid) || []).map(p => p.id);
    if (audienceKey === 'all_teachers') return (DB.query('teachers', t => t.schoolId === sid) || []).map(t => t.id);
    if (audienceKey === 'all_students') return (DB.query('students', s => s.schoolId === sid && s.status === 'active') || []).map(s => s.id);
    if (audienceKey === 'class' && classId) {
      const students = COMPUTE.studentsByClass(classId) || [];
      return [...new Set(students.map(s => s.parentId).filter(Boolean))];
    }
  } catch(e) {}
  return [];
}

function notify_audienceLabel(audienceKey, classId) {
  if (audienceKey === 'all_parents')  return 'All Parents';
  if (audienceKey === 'all_teachers') return 'All Teachers & Staff';
  if (audienceKey === 'all_students') return 'All Students';
  if (audienceKey === 'class') {
    const cls = DB.find('classes', classId);
    return cls ? `${cls.name} (Parents)` : `Class ${classId}`;
  }
  return audienceKey;
}

// ─── Live DOM Updates ─────────────────────────────────────────────────────────

function notify_updateEmailPreview() {
  const subjectEl  = document.getElementById('email_subject');
  const bodyEl     = document.getElementById('email_body');
  const previewSub = document.getElementById('email_preview_subject');
  const previewBod = document.getElementById('email_preview_body');

  if (subjectEl && previewSub) {
    const val = subjectEl.value.trim();
    previewSub.textContent = val || '(Subject will appear here)';
    previewSub.className = val
      ? 'font-semibold mb-4 text-base text-slate-700'
      : 'font-semibold mb-4 text-base italic text-slate-500';
  }

  if (bodyEl && previewBod) {
    const val = bodyEl.value.trim();
    previewBod.textContent = val || '(Email body will appear here as you type…)';
    previewBod.className = val
      ? 'text-sm text-slate-600 whitespace-pre-wrap min-h-[8rem] leading-relaxed'
      : 'text-sm whitespace-pre-wrap min-h-[8rem] leading-relaxed italic text-slate-500';
  }

  notify_updateEmailCount();
}

function notify_updateEmailCount() {
  const audEl    = document.getElementById('email_audience');
  const classEl  = document.getElementById('email_class');
  const classRow = document.getElementById('email_class_row');
  const banner   = document.getElementById('email_count_banner');
  if (!audEl) return;

  const audienceKey = audEl.value;
  if (classRow) classRow.classList.toggle('hidden', audienceKey !== 'class');

  const classId = (classEl && audienceKey === 'class') ? classEl.value : null;
  const count = notify_countAudience(audienceKey, classId);

  if (banner) {
    banner.textContent = count > 0
      ? `${icon('students','w-4 h-4 inline mr-1')} ${count} recipient${count !== 1 ? 's' : ''} will receive this email`
      : 'No recipients found for the selected audience.';
    banner.classList.remove('hidden');
  }
}

// ─── Preview & Send ───────────────────────────────────────────────────────────

function notify_previewEmail() {
  const audEl     = document.getElementById('email_audience');
  const classEl   = document.getElementById('email_class');
  const subjectEl = document.getElementById('email_subject');
  const bodyEl    = document.getElementById('email_body');
  if (!audEl || !subjectEl || !bodyEl) return;

  const audienceKey = audEl.value;
  const classId     = (audienceKey === 'class' && classEl) ? classEl.value : null;
  const subject     = subjectEl.value.trim();
  const emailBody   = bodyEl.value.trim();

  if (audienceKey === 'class' && !classId) { toast('Please select a class.', 'danger'); return; }
  if (!subject)   { toast('Please enter a subject line.', 'danger'); return; }
  if (!emailBody) { toast('Please enter the email body.', 'danger'); return; }

  const count = notify_countAudience(audienceKey, classId);
  if (count === 0) { toast('No recipients found for the selected audience.', 'danger'); return; }

  const audLabel   = notify_audienceLabel(audienceKey, classId);
  const school     = DB.find('schools', AUTH.current.schoolId) || {};
  const schoolName = school.name || 'School';

  modal({
    title: 'Confirm Email Broadcast',
    size: 'md',
    body: `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-brand-50 rounded-xl p-3">
            <div class="text-2xl font-bold text-brand-700">${count}</div>
            <div class="text-xs text-slate-500 mt-1">Recipients</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-sm font-semibold text-slate-700 truncate">${audLabel}</div>
            <div class="text-xs text-slate-500 mt-1">Audience</div>
          </div>
        </div>
        <div class="border border-slate-200 rounded-xl overflow-hidden text-sm">
          <div class="bg-navy-800 text-white text-center py-3 px-4">
            <div class="font-bold">${schoolName}</div>
          </div>
          <div class="p-4 bg-white space-y-2">
            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Subject</p>
            <p class="font-semibold text-slate-800">${subject}</p>
            <hr class="border-slate-100" />
            <div class="text-slate-600 whitespace-pre-wrap leading-relaxed text-xs max-h-40 overflow-y-auto">${emailBody}</div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="notify_sendEmail('${audienceKey}','${classId || ''}',${count})">
        ${icon('chat','w-4 h-4 inline mr-1')} Send to ${count} Recipient${count !== 1 ? 's' : ''}
      </button>
    `
  });
}

function notify_sendEmail(audienceKey, classId, count) {
  const subject   = ((document.getElementById('email_subject') || {}).value || '').trim();
  const emailBody = ((document.getElementById('email_body')    || {}).value || '').trim();
  const audLabel  = notify_audienceLabel(audienceKey, classId || null);

  document.getElementById('modalBackdrop').click();

  DB.insert('smsCampaigns', {
    id: uid('email'),
    schoolId: AUTH.current.schoolId,
    channel: 'email',
    audienceKey,
    audienceLabel: audLabel,
    classId: classId || null,
    message: null,
    subject,
    body: emailBody,
    recipientCount: count,
    unitsUsed: 0,
    status: 'sent',
    sentBy: AUTH.current.id,
    sentAt: now(),
  });

  const recipientIds = notify_getRecipientIds(audienceKey, classId || null);
  recipientIds.forEach(userId => {
    DB.insert('notifications', {
      id: uid('not'),
      userId,
      title: subject,
      body: emailBody.slice(0, 200),
      type: 'info',
      read: false,
      timestamp: now(),
    });
  });

  toast(`Email sent to ${count} recipient${count !== 1 ? 's' : ''}.`, 'success');
  APP.params.notifyTab = 'history';
  APP.render();
}
