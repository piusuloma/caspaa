/* ============================================================
   SCHOOL ADMIN MODULE
   Views prefixed with view_adm_*
   ============================================================ */

/* ---------- Dashboard ---------- */
function view_adm_dashboard() {
  const schoolId = AUTH.current.id;
  const students = DB.query('students', s => s.schoolId === schoolId);
  const teachers = DB.query('teachers', t => t.schoolId === schoolId);
  const invoices = DB.query('invoices', i => i.schoolId === schoolId);
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const collectionRate = invoices.length ? Math.round((collected / (collected + outstanding)) * 100) : 0;
  const attToday = DB.query('attendance', a => a.schoolId === schoolId && a.date === today());
  const presentToday = attToday.filter(a => a.status !== 'absent').length;
  const attRate = students.length ? Math.round((presentToday / students.length) * 100) : 0;

  // Schedule chart render after DOM
  window.afterRender = () => {
    const ctx = document.getElementById('revenueChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Collected (₦)',
            data: [3200000, 3800000, 4100000, 3900000, 4500000, collected || 4200000],
            borderColor: '#047857', backgroundColor: 'rgba(16,185,129,0.15)',
            tension: 0.35, fill: true, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#047857'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { ticks: { callback: v => '₦' + (v/1000000).toFixed(1) + 'M' } }
          }
        }
      });
    }
    const ctx2 = document.getElementById('attendanceChart');
    if (ctx2) {
      const last7 = [];
      const labels = [];
      for (let d = 6; d >= 0; d--) {
        const dt = daysAgo(d);
        const wd = new Date(dt).getDay();
        if (wd === 0 || wd === 6) continue;
        const recs = DB.query('attendance', a => a.schoolId === schoolId && a.date === dt);
        const p = recs.filter(r => r.status !== 'absent').length;
        last7.push(recs.length ? Math.round(p / recs.length * 100) : 0);
        labels.push(new Date(dt).toLocaleDateString('en-GB', { weekday: 'short' }));
      }
      new Chart(ctx2, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Attendance %', data: last7, backgroundColor: '#10b981', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
      });
    }
  };

  return `
    <div class="space-y-5">
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-brand-200 text-sm">Welcome back,</p>
            <h1 class="text-2xl lg:text-3xl font-extrabold">${AUTH.current.name.split(' ').slice(-1)}</h1>
            <p class="text-brand-100 text-sm mt-1">Bright Lights Academy · ${DB.settings().currentTerm}</p>
          </div>
          <div class="hidden sm:block text-right">
            <p class="text-brand-200 text-xs uppercase tracking-wide font-semibold">Today</p>
            <p class="font-bold text-lg">${fdate(today(), { long: true })}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        ${statCard({ label: 'Students', value: students.length, icon: 'students', color: 'brand', trend: { direction: 'up', label: '+2 this term' } })}
        ${statCard({ label: 'Staff', value: teachers.length, icon: 'teacher', color: 'blue' })}
        ${statCard({ label: 'Attendance Today', value: attRate + '%', icon: 'attendance', color: 'gold' })}
        ${statCard({ label: 'Collection Rate', value: collectionRate + '%', icon: 'fees', color: 'purple', trend: { direction: collectionRate >= 60 ? 'up' : 'down', label: money(collected) } })}
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900">Revenue (6 months)</h3>
            <button class="btn btn-ghost text-sm" onclick="APP.go('adm_reports')">View report →</button>
          </div>
          <div style="height: 240px;"><canvas id="revenueChart"></canvas></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-4">Attendance (this week)</h3>
          <div style="height: 240px;"><canvas id="attendanceChart"></canvas></div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Quick Actions</h3>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-secondary justify-start" onclick="APP.go('adm_students'); setTimeout(addStudentModal, 100)">${icon('plus','w-4 h-4')} Add Student</button>
            <button class="btn btn-secondary justify-start" onclick="APP.go('adm_staff'); setTimeout(addStaffModal, 100)">${icon('plus','w-4 h-4')} Add Staff</button>
            <button class="btn btn-secondary justify-start" onclick="APP.go('adm_announce'); setTimeout(newAnnouncementModal, 100)">${icon('bell','w-4 h-4')} Send Notice</button>
            <button class="btn btn-secondary justify-start" onclick="APP.go('adm_fees')">${icon('fees','w-4 h-4')} Set Fees</button>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3">Recent Activity</h3>
          <div class="space-y-2">
            ${DB.get('auditLog').slice(-4).reverse().map(l => `
              <div class="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">${icon('check','w-4 h-4')}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900">${l.action.replace(/_/g,' ')}</div>
                  <div class="text-xs text-slate-500">${l.target} · ${fdate(l.timestamp, { relative: true })}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Students ---------- */
function view_adm_students() {
  const schoolId = AUTH.current.id;
  const students = DB.query('students', s => s.schoolId === schoolId);
  const classes = DB.get('classes');
  const filter = APP.params.classFilter || 'all';
  const search = APP.params.search || '';
  const filtered = students.filter(s => {
    const matchClass = filter === 'all' || s.classId === filter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admissionNo.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return `
    ${pageHeader({
      title: 'Students',
      subtitle: `${students.length} active students across ${classes.length} classes`,
      actions: `
        <button class="btn btn-secondary" onclick="bulkUploadModal()">${icon('upload','w-4 h-4')} Bulk Upload</button>
        <button class="btn btn-primary" onclick="addStudentModal()">${icon('plus','w-4 h-4')} Add Student</button>
      `
    })}

    <div class="card p-4 mb-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search','w-4 h-4')}</span>
          <input type="text" class="input pl-9" placeholder="Search by name or admission no…" value="${search}" oninput="APP.params.search = this.value; APP.render()" />
        </div>
        <select class="input sm:max-w-xs" onchange="APP.params.classFilter = this.value; APP.render()">
          <option value="all" ${filter==='all'?'selected':''}>All classes</option>
          ${classes.map(c => `<option value="${c.id}" ${filter===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card overflow-hidden">
      ${filtered.length === 0 ? emptyState({ title: 'No students found', body: 'Try adjusting your filters or add a new student.', icon: 'students' }) : `
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead><tr>
              <th>Student</th><th>Admission No.</th><th>Class</th><th>Parent</th><th>Fees</th><th></th>
            </tr></thead>
            <tbody>
              ${filtered.map(s => {
                const cls = classes.find(c => c.id === s.classId);
                const parent = DB.find('parents', s.parentId);
                const inv = COMPUTE.studentInvoice(s.id);
                return `
                  <tr class="cursor-pointer" onclick="viewStudent('${s.id}')">
                    <td>
                      <div class="flex items-center gap-3">
                        ${avatar(s.name, 'sm')}
                        <div>
                          <div class="font-semibold text-slate-900">${s.name}</div>
                          <div class="text-xs text-slate-500">${s.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(s.dob)} yrs</div>
                        </div>
                      </div>
                    </td>
                    <td><code class="text-xs bg-slate-100 px-2 py-0.5 rounded">${s.admissionNo}</code></td>
                    <td>${cls ? cls.name : '—'}</td>
                    <td>${parent ? parent.name : '—'}</td>
                    <td>${inv ? statusBadge(inv.status) : '—'}</td>
                    <td class="text-right">
                      <button class="btn btn-ghost !p-1.5" onclick="event.stopPropagation(); viewStudent('${s.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function calcAge(dob) {
  if (!dob) return '—';
  const d = new Date(dob);
  const a = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(a);
}

function viewStudent(id) {
  const s = DB.find('students', id);
  if (!s) return;
  const cls = DB.find('classes', s.classId);
  const parent = DB.find('parents', s.parentId);
  const inv = COMPUTE.studentInvoice(s.id);
  const attRate = COMPUTE.attendanceRate(s.id);
  const results = COMPUTE.studentResults(s.id);
  const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length) : 0;
  const subjects = DB.get('subjects');

  modal({
    title: 'Student Profile',
    size: 'lg',
    body: `
      <div class="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
        ${avatar(s.name, 'xl')}
        <div class="flex-1">
          <h2 class="text-xl font-bold text-slate-900">${s.name}</h2>
          <p class="text-sm text-slate-500">${cls ? cls.name : ''} · ${s.gender === 'M' ? 'Male' : 'Female'} · ${calcAge(s.dob)} years old</p>
          <code class="text-xs bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">${s.admissionNo}</code>
        </div>
        <div class="text-right">
          ${inv ? statusBadge(inv.status) : ''}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-brand-50 rounded-xl p-3 text-center">
          <div class="text-xs text-brand-700 font-semibold uppercase">Attendance</div>
          <div class="text-2xl font-bold text-brand-900 mt-1">${attRate}%</div>
        </div>
        <div class="bg-blue-50 rounded-xl p-3 text-center">
          <div class="text-xs text-blue-700 font-semibold uppercase">Avg Score</div>
          <div class="text-2xl font-bold text-blue-900 mt-1">${avg}%</div>
        </div>
        <div class="bg-amber-50 rounded-xl p-3 text-center">
          <div class="text-xs text-amber-700 font-semibold uppercase">Balance</div>
          <div class="text-lg font-bold text-amber-900 mt-1">${inv ? money(inv.balance) : '—'}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm mb-5">
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Date of Birth</div><div>${fdate(s.dob, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Blood Group</div><div>${s.bloodGroup || '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Parent / Guardian</div><div>${parent ? parent.name : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Parent Phone</div><div>${parent ? parent.phone : '—'}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Admission Date</div><div>${fdate(s.admissionDate, { long: true })}</div></div>
        <div><div class="text-xs text-slate-500 font-semibold uppercase mb-1">Status</div><div>${statusBadge(s.status)}</div></div>
      </div>

      ${results.length ? `
        <h3 class="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Recent Results</h3>
        <div class="space-y-1.5 mb-5">
          ${results.slice(0,5).map(r => {
            const sub = subjects.find(x => x.id === r.subjectId);
            return `<div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
              <span>${sub ? sub.name : '—'}</span>
              <div class="flex items-center gap-3">
                <span class="font-mono text-slate-600">${r.total}/100</span>
                <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'}">${r.grade}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      ` : ''}
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      <button class="btn btn-secondary" onclick="editStudent('${s.id}')">${icon('edit','w-4 h-4')} Edit</button>
      <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); viewAsParent('${s.parentId}')">View as Parent</button>
    `
  });
}

function addStudentModal() {
  const classes = DB.get('classes');
  const parents = DB.get('parents');
  modal({
    title: 'Add New Student',
    size: 'lg',
    body: `
      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label class="input-label">Full Name *</label>
          <input id="sf_name" class="input" placeholder="e.g. Chiamaka Okafor" />
        </div>
        <div>
          <label class="input-label">Admission Number *</label>
          <input id="sf_admno" class="input" placeholder="auto-generated" value="BL/2024/${String(DB.get('students').length + 1).padStart(3, '0')}" />
        </div>
        <div>
          <label class="input-label">Date of Birth *</label>
          <input id="sf_dob" type="date" class="input" />
        </div>
        <div>
          <label class="input-label">Gender *</label>
          <select id="sf_gender" class="input"><option value="M">Male</option><option value="F">Female</option></select>
        </div>
        <div>
          <label class="input-label">Class *</label>
          <select id="sf_class" class="input">${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        </div>
        <div>
          <label class="input-label">Blood Group</label>
          <select id="sf_blood" class="input"><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select>
        </div>
        <div class="sm:col-span-2">
          <label class="input-label">Parent / Guardian *</label>
          <select id="sf_parent" class="input">
            <option value="">— Select existing parent —</option>
            ${parents.map(p => `<option value="${p.id}">${p.name} (${p.phone})</option>`).join('')}
            <option value="__new__">+ Add new parent</option>
          </select>
        </div>
      </div>
      <div id="sf_newParent" class="hidden mt-3 p-3 bg-slate-50 rounded-xl space-y-2">
        <h4 class="font-semibold text-sm">New Parent Details</h4>
        <div class="grid sm:grid-cols-2 gap-2">
          <input id="sf_pname" class="input" placeholder="Parent name" />
          <input id="sf_pphone" class="input" placeholder="Phone (e.g. 0801…)" />
          <input id="sf_pemail" class="input" placeholder="Email" />
          <input id="sf_pocc" class="input" placeholder="Occupation" />
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewStudent()">${icon('check','w-4 h-4')} Save Student</button>
    `
  });

  document.getElementById('sf_parent').addEventListener('change', e => {
    document.getElementById('sf_newParent').classList.toggle('hidden', e.target.value !== '__new__');
  });
}

function saveNewStudent() {
  const name = document.getElementById('sf_name').value.trim();
  const admNo = document.getElementById('sf_admno').value.trim();
  const dob = document.getElementById('sf_dob').value;
  const gender = document.getElementById('sf_gender').value;
  const classId = document.getElementById('sf_class').value;
  const blood = document.getElementById('sf_blood').value;
  let parentId = document.getElementById('sf_parent').value;

  if (!name || !admNo || !dob || !parentId) { toast('Please fill all required fields', 'danger'); return; }

  if (parentId === '__new__') {
    const pname = document.getElementById('sf_pname').value.trim();
    const pphone = document.getElementById('sf_pphone').value.trim();
    if (!pname || !pphone) { toast('Please enter parent name and phone', 'danger'); return; }
    const newParent = {
      id: uid('par'),
      schoolId: AUTH.current.id,
      name: pname, phone: pphone,
      email: document.getElementById('sf_pemail').value.trim(),
      occupation: document.getElementById('sf_pocc').value.trim() || '—',
      monthlyIncome: 0, address: ''
    };
    DB.insert('parents', newParent);
    parentId = newParent.id;
  }

  const newStudent = {
    id: uid('stu'),
    schoolId: AUTH.current.id,
    name, admissionNo: admNo, classId, dob, gender,
    parentId, bloodGroup: blood,
    admissionDate: today(),
    status: 'active', photo: null
  };
  DB.insert('students', newStudent);
  DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.id, actor: AUTH.current.id, action: 'added_student', target: name, timestamp: now() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} has been added successfully`);
}

function editStudent(id) {
  document.getElementById('modalBackdrop').click();
  toast('Edit form would open here', 'info');
}

function bulkUploadModal() {
  modal({
    title: 'Bulk Upload Students',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          <strong>How it works:</strong> Download the template, fill it with your student data, then upload it back. The system will create student records and invite parents automatically.
        </div>

        <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
          ${icon('upload', 'w-12 h-12 mx-auto text-slate-400 mb-2')}
          <p class="font-semibold text-slate-700 mb-1">Drag your Excel file here</p>
          <p class="text-sm text-slate-500 mb-3">or click to browse (.xlsx, .csv)</p>
          <button class="btn btn-primary" onclick="simulateBulkUpload()">Choose file</button>
        </div>

        <button class="btn btn-secondary w-full" onclick="downloadTemplate()">${icon('download','w-4 h-4')} Download Excel Template</button>

        <details class="text-sm">
          <summary class="cursor-pointer font-semibold">Required columns</summary>
          <ul class="mt-2 text-slate-600 space-y-1 list-disc list-inside">
            <li>Full Name (required)</li>
            <li>Admission Number (auto-generated if empty)</li>
            <li>Date of Birth (DD/MM/YYYY)</li>
            <li>Gender (M/F)</li>
            <li>Class (e.g. JSS1, Primary 3)</li>
            <li>Parent Name &amp; Parent Phone (required)</li>
            <li>Parent Email (optional but recommended)</li>
          </ul>
        </details>
      </div>
    `
  });
}

function downloadTemplate() {
  const csv = "Full Name,Admission No,DOB (DD/MM/YYYY),Gender (M/F),Class,Blood Group,Parent Name,Parent Phone,Parent Email,Parent Occupation\nJane Doe,,15/06/2016,F,Primary 3,A+,Mary Doe,08012345678,mary@email.com,Teacher\n";
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'caspaa_student_template.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('Template downloaded');
}

function simulateBulkUpload() {
  // Mock: pretend we imported 5 students
  toast('Validating file…', 'info');
  setTimeout(() => {
    toast('Imported 5 new students successfully', 'success');
    document.getElementById('modalBackdrop').click();
    DB.insert('auditLog', { id: uid('aud'), schoolId: AUTH.current.id, actor: AUTH.current.id, action: 'bulk_import', target: '5 students', timestamp: now() });
    APP.render();
  }, 1400);
}

/* ---------- Staff ---------- */
function view_adm_staff() {
  const teachers = DB.query('teachers', t => t.schoolId === AUTH.current.id);
  return `
    ${pageHeader({
      title: 'Staff Management',
      subtitle: `${teachers.length} teachers and admin staff`,
      actions: `<button class="btn btn-primary" onclick="addStaffModal()">${icon('plus','w-4 h-4')} Add Staff</button>`
    })}
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr>
            <th>Staff</th><th>Subject/Role</th><th>Classes</th><th>Hire Date</th><th>Salary</th><th></th>
          </tr></thead>
          <tbody>
            ${teachers.map(t => `
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    ${avatar(t.name, 'sm')}
                    <div>
                      <div class="font-semibold text-slate-900">${t.name}</div>
                      <div class="text-xs text-slate-500">${t.email}</div>
                    </div>
                  </div>
                </td>
                <td>${t.subject}</td>
                <td><span class="badge badge-neutral">${t.classes.length} class${t.classes.length !== 1 ? 'es' : ''}</span></td>
                <td>${fdate(t.hireDate, { long: true })}</td>
                <td><span class="font-mono">${money(t.salary)}</span></td>
                <td class="text-right">
                  <button class="btn btn-ghost !p-1.5" onclick="viewStaff('${t.id}')">${icon('arrow_left','w-4 h-4 rotate-180')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewStaff(id) {
  const t = DB.find('teachers', id);
  if (!t) return;
  const classes = DB.get('classes').filter(c => t.classes.includes(c.id));
  modal({
    title: 'Staff Profile',
    body: `
      <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        ${avatar(t.name, 'xl')}
        <div>
          <h2 class="text-lg font-bold text-slate-900">${t.name}</h2>
          <p class="text-sm text-slate-500">${t.subject}</p>
          <p class="text-xs text-slate-400 mt-1">${t.email} · ${t.phone}</p>
        </div>
      </div>
      <div class="space-y-3">
        <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Assigned Classes</div>
          <div class="flex flex-wrap gap-1.5">${classes.map(c => `<span class="badge badge-info">${c.name}</span>`).join('')}</div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Hired</div><div>${fdate(t.hireDate, { long: true })}</div></div>
          <div><div class="text-xs uppercase text-slate-500 font-semibold mb-1">Monthly Salary</div><div class="font-mono">${money(t.salary)}</div></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function addStaffModal() {
  const classes = DB.get('classes');
  modal({
    title: 'Add New Staff',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Full Name</label><input id="stf_name" class="input" placeholder="Mrs. Funke Adeyemi" /></div>
        <div><label class="input-label">Email</label><input id="stf_email" class="input" type="email" placeholder="funke@school.ng" /></div>
        <div><label class="input-label">Phone</label><input id="stf_phone" class="input" placeholder="0801…" /></div>
        <div><label class="input-label">Subject / Role</label><input id="stf_subject" class="input" placeholder="Mathematics" /></div>
        <div><label class="input-label">Monthly Salary (NGN)</label><input id="stf_salary" class="input" type="number" placeholder="180000" /></div>
        <div><label class="input-label">Assign Classes</label>
          <select id="stf_class" class="input" multiple size="4">
            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
          <p class="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewStaff()">${icon('check','w-4 h-4')} Save Staff</button>
    `
  });
}

function saveNewStaff() {
  const name = document.getElementById('stf_name').value.trim();
  const email = document.getElementById('stf_email').value.trim();
  const phone = document.getElementById('stf_phone').value.trim();
  const subject = document.getElementById('stf_subject').value.trim();
  const salary = parseInt(document.getElementById('stf_salary').value) || 0;
  const classSel = Array.from(document.getElementById('stf_class').selectedOptions).map(o => o.value);
  if (!name || !email) { toast('Please enter name and email', 'danger'); return; }
  DB.insert('teachers', {
    id: uid('tch'), schoolId: AUTH.current.id,
    name, email, phone, subject, salary,
    classes: classSel, hireDate: today(), role: 'teacher'
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} has been added to staff`);
}

/* ---------- Classes ---------- */
function view_adm_classes() {
  const classes = DB.get('classes');
  return `
    ${pageHeader({
      title: 'Classes',
      subtitle: 'Manage classes and class teachers',
      actions: `<button class="btn btn-primary" onclick="addClassModal()">${icon('plus','w-4 h-4')} Add Class</button>`
    })}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${classes.map(c => {
        const studentCount = COMPUTE.studentsByClass(c.id).length;
        const teacher = DB.find('teachers', c.teacherId);
        return `
          <div class="card card-hover p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="badge badge-info">${c.level}</span>
                <h3 class="font-bold text-lg text-slate-900 mt-2">${c.name}</h3>
              </div>
              <div class="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">${icon('classes','w-6 h-6')}</div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-slate-600">
                ${icon('students','w-4 h-4')}<span>${studentCount} student${studentCount !== 1 ? 's' : ''}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-600">
                ${icon('teacher','w-4 h-4')}<span>${teacher ? teacher.name : '— No teacher —'}</span>
              </div>
            </div>
            <button class="btn btn-secondary w-full mt-3" onclick="APP.go('adm_students', { classFilter: '${c.id}' })">View Students</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function addClassModal() {
  const teachers = DB.query('teachers', t => t.schoolId === AUTH.current.id);
  modal({
    title: 'Add New Class',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Class Name</label><input id="cl_name" class="input" placeholder="e.g. SSS 2" /></div>
        <div><label class="input-label">Level</label>
          <select id="cl_level" class="input"><option>Nursery</option><option>Primary</option><option>Secondary</option></select>
        </div>
        <div><label class="input-label">Class Teacher</label>
          <select id="cl_teacher" class="input">
            <option value="">— Unassigned —</option>
            ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveClass()">Save Class</button>`
  });
}

function saveClass() {
  const name = document.getElementById('cl_name').value.trim();
  const level = document.getElementById('cl_level').value;
  const teacherId = document.getElementById('cl_teacher').value || null;
  if (!name) { toast('Class name required', 'danger'); return; }
  DB.insert('classes', { id: uid('cls'), schoolId: AUTH.current.id, name, level, teacherId });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${name} created`);
}

/* ---------- Timetable ---------- */
function view_adm_timetable() {
  const classes = DB.get('classes');
  const classId = APP.params.classId || classes[0].id;
  const tt = DB.query('timetable', t => t.classId === classId);
  const subjects = DB.get('subjects');
  const teachers = DB.get('teachers');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const periods = [1,2,3,4,5,6,7,8];

  return `
    ${pageHeader({
      title: 'Timetable',
      subtitle: 'Class schedules and conflict detection',
      actions: `<button class="btn btn-primary" onclick="addPeriodModal('${classId}')">${icon('plus','w-4 h-4')} Add Period</button>`
    })}
    <div class="card p-4 mb-4">
      <label class="input-label">Class</label>
      <select class="input max-w-xs" onchange="APP.go('adm_timetable', { classId: this.value })">
        ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr><th>Period</th>${days.map(d => `<th>${d}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${periods.map(p => {
              const periodEntries = days.map(d => tt.find(t => t.day === d && t.period === p));
              if (periodEntries.every(e => !e)) return '';
              return `<tr>
                <td><strong class="text-slate-900">P${p}</strong><br><span class="text-xs text-slate-500">${periodEntries.find(Boolean) ? periodEntries.find(Boolean).time : ''}</span></td>
                ${periodEntries.map(e => {
                  if (!e) return '<td class="text-slate-300">—</td>';
                  const sub = subjects.find(s => s.id === e.subjectId);
                  const tch = teachers.find(t => t.id === e.teacherId);
                  return `<td>
                    <div class="font-semibold text-slate-900">${sub ? sub.name : '—'}</div>
                    <div class="text-xs text-slate-500">${tch ? tch.name.split(' ').slice(-1).join('') : ''}</div>
                  </td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${tt.length === 0 ? emptyState({ title: 'No periods scheduled', body: 'Add periods to build the timetable.', icon: 'calendar' }) : ''}
      </div>
    </div>
  `;
}

function addPeriodModal(classId) {
  const subjects = DB.get('subjects');
  const teachers = DB.get('teachers');
  modal({
    title: 'Add Timetable Period',
    body: `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Day</label>
            <select id="tt_day" class="input"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select>
          </div>
          <div><label class="input-label">Period #</label>
            <select id="tt_period" class="input">${[1,2,3,4,5,6,7,8].map(i => `<option>${i}</option>`).join('')}</select>
          </div>
        </div>
        <div><label class="input-label">Time</label><input id="tt_time" class="input" placeholder="e.g. 08:00-08:40" /></div>
        <div><label class="input-label">Subject</label>
          <select id="tt_subject" class="input">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Teacher</label>
          <select id="tt_teacher" class="input">${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="savePeriod('${classId}')">Add Period</button>`
  });
}

function savePeriod(classId) {
  const day = document.getElementById('tt_day').value;
  const period = parseInt(document.getElementById('tt_period').value);
  const time = document.getElementById('tt_time').value;
  const subjectId = document.getElementById('tt_subject').value;
  const teacherId = document.getElementById('tt_teacher').value;
  // Conflict detection: teacher already booked at this time
  const conflict = DB.query('timetable', t => t.teacherId === teacherId && t.day === day && t.period === period);
  if (conflict.length) { toast(`Conflict: teacher is already teaching ${day} P${period}`, 'danger'); return; }
  DB.insert('timetable', { id: uid('tt'), schoolId: AUTH.current.id, classId, day, period, time, subjectId, teacherId });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Period added');
}

/* ---------- Attendance (admin overview) ---------- */
function view_adm_attendance() {
  const classes = DB.get('classes');
  const classId = APP.params.classId || classes[0].id;
  const date = APP.params.date || today();
  const cls = DB.find('classes', classId);
  const students = COMPUTE.studentsByClass(classId);
  const recs = COMPUTE.classAttendance(classId, date);

  return `
    ${pageHeader({
      title: 'Attendance Overview',
      subtitle: `View and audit attendance records school-wide`
    })}
    <div class="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
      <div><label class="input-label">Class</label>
        <select class="input" onchange="APP.go('adm_attendance', { classId: this.value, date: '${date}' })">
          ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div><label class="input-label">Date</label>
        <input type="date" class="input" value="${date}" onchange="APP.go('adm_attendance', { classId: '${classId}', date: this.value })" />
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-900">${cls.name} · ${fdate(date, { long: true })}</h3>
        <div class="flex gap-2">
          <span class="badge badge-success">${recs.filter(r => r.status === 'present').length} Present</span>
          <span class="badge badge-warn">${recs.filter(r => r.status === 'late').length} Late</span>
          <span class="badge badge-danger">${recs.filter(r => r.status === 'absent').length} Absent</span>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>Student</th><th>Status</th></tr></thead>
        <tbody>
          ${students.map(s => {
            const r = recs.find(x => x.studentId === s.id);
            return `<tr><td>
              <div class="flex items-center gap-2">${avatar(s.name,'sm')}<span class="font-medium">${s.name}</span></div>
            </td><td>${r ? statusBadge(r.status) : '<span class="text-slate-400 text-sm">Not marked</span>'}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Results overview ---------- */
function view_adm_results() {
  const classes = DB.get('classes');
  const classId = APP.params.classId || classes[5].id; // default JSS1
  const subjects = DB.get('subjects');
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId);
  const pending = results.filter(r => !r.approved);

  return `
    ${pageHeader({
      title: 'Results',
      subtitle: 'Broadsheet view, approvals, and reports',
      actions: `<button class="btn btn-secondary" onclick="exportBroadsheet('${classId}')">${icon('download','w-4 h-4')} Export PDF</button>`
    })}
    <div class="card p-4 mb-4">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1">
          <label class="input-label">Class</label>
          <select class="input" onchange="APP.go('adm_results', { classId: this.value })">
            ${classes.map(c => `<option value="${c.id}" ${classId===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        ${pending.length ? `<button class="btn btn-primary" onclick="approveAllResults('${classId}')">${icon('check','w-4 h-4')} Approve ${pending.length} pending</button>` : ''}
      </div>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr><th>Student</th>${subjects.slice(0,6).map(s => `<th class="text-center">${s.name.split(' ')[0]}</th>`).join('')}<th class="text-center">Avg</th><th class="text-center">Pos</th></tr>
          </thead>
          <tbody>
            ${students.map((s, idx) => {
              const studRes = results.filter(r => r.studentId === s.id);
              const total = studRes.reduce((sum, r) => sum + r.total, 0);
              const avg = studRes.length ? Math.round(total / studRes.length) : 0;
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s.name, 'sm')}<span class="font-medium">${s.name}</span></div></td>
                ${subjects.slice(0,6).map(sub => {
                  const r = studRes.find(x => x.subjectId === sub.id);
                  if (!r) return '<td class="text-center text-slate-300">—</td>';
                  return `<td class="text-center"><strong>${r.total}</strong> <span class="badge ${r.grade==='A'?'badge-success':r.grade==='F'?'badge-danger':'badge-info'} ml-1">${r.grade}</span></td>`;
                }).join('')}
                <td class="text-center font-bold">${avg}%</td>
                <td class="text-center">${idx + 1}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function approveAllResults(classId) {
  DB.query('results', r => r.classId === classId && !r.approved).forEach(r => DB.update('results', r.id, { approved: true }));
  APP.render();
  toast('All pending results approved');
}

function exportBroadsheet(classId) {
  const cls = DB.find('classes', classId);
  const subjects = DB.get('subjects').slice(0,6);
  const students = COMPUTE.studentsByClass(classId);
  const results = DB.query('results', r => r.classId === classId);
  const html = `
    <h1>Bright Lights Academy</h1>
    <h2>${cls.name} — ${DB.settings().currentTerm} Broadsheet</h2>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12px">
      <thead><tr><th>Student</th>${subjects.map(s => `<th>${s.name}</th>`).join('')}<th>Avg</th></tr></thead>
      <tbody>
        ${students.map(s => {
          const sr = results.filter(r => r.studentId === s.id);
          const avg = sr.length ? Math.round(sr.reduce((x, r) => x + r.total, 0) / sr.length) : 0;
          return `<tr><td>${s.name}</td>${subjects.map(sub => { const r = sr.find(x=>x.subjectId===sub.id); return `<td>${r ? r.total : '—'}</td>`; }).join('')}<td><strong>${avg}%</strong></td></tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  printElement(html);
}

/* ---------- Fees (admin view) ---------- */
function view_adm_fees() { return view_fin_fees(); }
function view_adm_reports() { return view_fin_reports(); }

/* ---------- Discipline ---------- */
function view_adm_discipline() {
  const records = DB.query('discipline', d => d.schoolId === AUTH.current.id);
  return `
    ${pageHeader({
      title: 'Discipline & Behaviour',
      subtitle: 'Commendations, misconduct, and reward points',
      actions: `<button class="btn btn-primary" onclick="addDisciplineModal()">${icon('plus','w-4 h-4')} New Record</button>`
    })}
    <div class="card overflow-hidden">
      ${records.length === 0 ? emptyState({ title: 'No records yet', body: 'Record commendations or misconduct to track student behavior.', icon: 'check' }) : `
        <table class="tbl">
          <thead><tr><th>Student</th><th>Type</th><th>Points</th><th>Note</th><th>Date</th></tr></thead>
          <tbody>
            ${records.map(r => {
              const s = DB.find('students', r.studentId);
              return `<tr>
                <td><div class="flex items-center gap-2">${avatar(s ? s.name : '?', 'sm')}<span>${s ? s.name : '—'}</span></div></td>
                <td><span class="badge ${r.type === 'commendation' ? 'badge-success' : 'badge-danger'}">${r.type}</span></td>
                <td class="font-mono font-bold ${r.points > 0 ? 'text-emerald-600' : 'text-rose-600'}">${r.points > 0 ? '+' : ''}${r.points}</td>
                <td class="text-sm">${r.note}</td>
                <td class="text-sm text-slate-500">${fdate(r.date, { short: true })}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function addDisciplineModal() {
  const students = DB.query('students', s => s.schoolId === AUTH.current.id);
  modal({
    title: 'New Discipline Record',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Student</label>
          <select id="dc_student" class="input">${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div><label class="input-label">Type</label>
          <select id="dc_type" class="input"><option value="commendation">Commendation</option><option value="misconduct">Misconduct</option></select>
        </div>
        <div><label class="input-label">Points</label><input id="dc_points" type="number" class="input" placeholder="e.g. 5 or -2" /></div>
        <div><label class="input-label">Note</label><textarea id="dc_note" class="input" rows="3" placeholder="What happened?"></textarea></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveDiscipline()">Save Record</button>`
  });
}

function saveDiscipline() {
  const studentId = document.getElementById('dc_student').value;
  const type = document.getElementById('dc_type').value;
  const points = parseInt(document.getElementById('dc_points').value) || 0;
  const note = document.getElementById('dc_note').value.trim();
  if (!note) { toast('Please enter a note', 'danger'); return; }
  DB.insert('discipline', { id: uid('dis'), schoolId: AUTH.current.id, studentId, type, points, note, recordedBy: AUTH.current.id, date: today() });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Discipline record saved');
}

/* ---------- Inventory ---------- */
function view_adm_inventory() {
  const items = DB.query('inventory', i => i.schoolId === AUTH.current.id);
  const lowStock = items.filter(i => i.quantity < i.minStock);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return `
    ${pageHeader({
      title: 'Inventory',
      subtitle: 'Books, uniforms, stationery & assets',
      actions: `<button class="btn btn-primary" onclick="addInventoryModal()">${icon('plus','w-4 h-4')} Add Item</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'Total Items', value: items.length, icon: 'package', color: 'brand' })}
      ${statCard({ label: 'Total Value', value: money(totalValue), icon: 'fees', color: 'gold' })}
      ${statCard({ label: 'Low Stock', value: lowStock.length, icon: 'bell', color: 'rose' })}
    </div>

    ${lowStock.length ? `<div class="card bg-amber-50 border border-amber-200 p-4 mb-4">
      <div class="flex items-start gap-3">
        <div class="text-amber-700">${icon('bell','w-5 h-5')}</div>
        <div>
          <h4 class="font-semibold text-amber-900">Stock Alert</h4>
          <p class="text-sm text-amber-800">${lowStock.length} item${lowStock.length>1?'s':''} below minimum stock level. Reorder soon to avoid shortage.</p>
        </div>
      </div>
    </div>` : ''}

    <div class="card overflow-hidden">
      <table class="tbl">
        <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit Cost</th><th>Value</th><th>Supplier</th></tr></thead>
        <tbody>
          ${items.map(i => {
            const low = i.quantity < i.minStock;
            return `<tr>
              <td><span class="font-medium">${i.name}</span></td>
              <td><span class="badge badge-neutral">${i.category}</span></td>
              <td><span class="${low ? 'text-rose-600 font-bold' : 'font-medium'}">${i.quantity}</span> <span class="text-xs text-slate-400">/ min ${i.minStock}</span> ${low ? '<span class="badge badge-danger ml-2">LOW</span>' : ''}</td>
              <td class="font-mono">${money(i.unitCost)}</td>
              <td class="font-mono font-semibold">${money(i.quantity * i.unitCost)}</td>
              <td>${i.supplier}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function addInventoryModal() {
  modal({
    title: 'Add Inventory Item',
    body: `
      <div class="space-y-3">
        <div><label class="input-label">Item Name</label><input id="iv_name" class="input" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="input-label">Category</label>
            <select id="iv_cat" class="input"><option>Books</option><option>Uniform</option><option>Stationery</option><option>Equipment</option><option>Other</option></select>
          </div>
          <div><label class="input-label">Supplier</label><input id="iv_sup" class="input" /></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="input-label">Quantity</label><input id="iv_qty" type="number" class="input" /></div>
          <div><label class="input-label">Min Stock</label><input id="iv_min" type="number" class="input" /></div>
          <div><label class="input-label">Unit Cost</label><input id="iv_cost" type="number" class="input" /></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="saveInventory()">Save Item</button>`
  });
}

function saveInventory() {
  const item = {
    id: uid('inv'), schoolId: AUTH.current.id,
    name: document.getElementById('iv_name').value.trim(),
    category: document.getElementById('iv_cat').value,
    supplier: document.getElementById('iv_sup').value.trim(),
    quantity: parseInt(document.getElementById('iv_qty').value) || 0,
    minStock: parseInt(document.getElementById('iv_min').value) || 0,
    unitCost: parseInt(document.getElementById('iv_cost').value) || 0
  };
  if (!item.name) { toast('Item name required', 'danger'); return; }
  DB.insert('inventory', item);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Item added to inventory');
}

/* ---------- Messages and Announcements view stubs delegate to shared module ---------- */
function view_adm_messages() { return view_messages_shared('schooladmin'); }
function view_adm_announce() { return view_announce_shared('schooladmin'); }
