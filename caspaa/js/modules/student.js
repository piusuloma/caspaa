/* ============================================================
   CASPAA STUDENT PORTAL
   - Dedicated student-facing experience
   - Dashboard, Learning (LMS), Assignments (+submit), CBT (+take),
     Results / report card, Behaviour & rewards, Timetable
   ============================================================ */

function me() { return DB.find('students', AUTH.current.id); }
function myClass() { const s = me(); return s ? DB.find('classes', s.classId) : null; }
function subjName(id) { const s = DB.find('subjects', id); return s ? s.name : '—'; }
function teacherName(id) { const t = DB.find('teachers', id); return t ? t.name : '—'; }

/* ============================================================
   1. DASHBOARD
   ============================================================ */
function view_stu_dashboard() {
  const s = me();
  if (!s) return emptyState({ title: 'Student not found', body: 'Please sign in again.', icon: 'user' });
  const cls = myClass();
  const reward = COMPUTE.studentRewards(s.id);
  const myAssignments = DB.query('assignments', a => a.classId === s.classId);
  const pendingAssignments = myAssignments.filter(a => !a.submissions.find(x => x.studentId === s.id));
  const myExams = DB.query('cbtExams', e => e.classId === s.classId && e.status === 'published');
  const takenExamIds = DB.query('cbtSubmissions', x => x.studentId === s.id).map(x => x.examId);
  const upcomingExams = myExams.filter(e => !takenExamIds.includes(e.id));
  const attRate = COMPUTE.attendanceRate(s.id);
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todays = DB.query('timetable', t => t.classId === s.classId && t.day === day).sort((a, b) => a.period - b.period);
  const commendations = DB.query('discipline', d => d.studentId === s.id && d.type === 'commendation').sort((a, b) => b.date.localeCompare(a.date));

  return `
    <div class="space-y-5">
      <!-- Hero + gamification -->
      <div class="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-5 lg:p-6 text-white">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-brand-200 text-sm">Welcome back,</p>
            <h1 class="text-2xl lg:text-3xl font-extrabold">${s.name.split(' ')[0]} 👋</h1>
            <p class="text-brand-100 text-sm mt-1">${cls ? cls.name : ''} · ${DB.settings().currentTerm}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="text-2xl">${'⭐'.repeat(reward.stars)}<span class="opacity-30">${'⭐'.repeat(5 - reward.stars)}</span></div>
              <div class="text-xs text-brand-200 mt-1">${reward.stars}/5 stars</div>
            </div>
            <div class="text-center bg-white/10 rounded-2xl px-4 py-2">
              <div class="text-2xl font-extrabold">${reward.points}</div>
              <div class="text-xs text-brand-200">points</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${statCard({ label: 'Assignments Due', value: pendingAssignments.length, icon: 'results', color: pendingAssignments.length ? 'gold' : 'brand', trend: pendingAssignments.length ? { direction: 'down', label: 'to submit' } : { direction: 'up', label: 'all done' } })}
        ${statCard({ label: 'Upcoming CBT', value: upcomingExams.length, icon: 'classes', color: upcomingExams.length ? 'gold' : 'brand', trend: upcomingExams.length ? { direction: 'down', label: 'to take' } : { direction: 'up', label: 'none pending' } })}
        ${statCard({ label: 'My Attendance', value: attRate + '%', icon: 'attendance', color: attRate >= 85 ? 'brand' : 'rose' })}
        ${statCard({ label: 'Academic Avg', value: reward.avg + '%', icon: 'reports', color: 'blue' })}
      </div>

      <!-- Badges -->
      <div class="card p-5">
        <h3 class="font-bold text-slate-900 mb-3">My Trophies & Badges</h3>
        <div class="flex flex-wrap gap-3">
          ${reward.badges.length === 0
            ? `<p class="text-sm text-slate-500">No badges yet — keep working hard!</p>`
            : reward.badges.map(b => `<div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span class="text-2xl">${b.icon}</span>
            <span class="text-sm font-semibold text-amber-900">${b.label}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Today's schedule -->
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Today's Schedule · ${day}</h3>
            <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('stu_timetable')">Full timetable →</button>
          </div>
          ${todays.length === 0 ? `<p class="text-sm text-slate-500">No classes scheduled today. Enjoy your day!</p>` : `
            <div class="space-y-2">
              ${todays.map(t => `<div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div class="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex flex-col items-center justify-center flex-shrink-0">
                  <span class="text-[10px] font-semibold">P${t.period}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm">${subjName(t.subjectId)}</div>
                  <div class="text-xs text-slate-500">${t.time || ''} · ${teacherName(t.teacherId)}</div>
                </div>
              </div>`).join('')}
            </div>
          `}
        </div>

        <!-- Recent commendations -->
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 mb-3">Commendations</h3>
          ${commendations.length === 0 ? `<p class="text-sm text-slate-500">No commendations yet — keep it up!</p>` : `
            <div class="space-y-2">
              ${commendations.slice(0, 4).map(c => `<div class="p-2.5 bg-emerald-50 rounded-xl">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-emerald-900">+${Math.abs(c.points)} pts</span>
                  <span class="text-xs text-emerald-600">${fdate(c.date, { short: true })}</span>
                </div>
                <div class="text-xs text-emerald-700 mt-0.5">${c.note}</div>
              </div>`).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Assignments to do -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-900">Assignments to Submit</h3>
          <button class="text-sm text-brand-700 font-semibold" onclick="APP.go('stu_assignments')">View all →</button>
        </div>
        ${pendingAssignments.length === 0 ? `<p class="text-sm text-slate-500">You're all caught up — nothing to submit.</p>` : `
          <div class="space-y-2">
            ${pendingAssignments.slice(0, 3).map(a => `<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div class="min-w-0">
                <div class="font-semibold text-sm truncate">${a.title}</div>
                <div class="text-xs text-slate-500">${subjName(a.subjectId)} · Due ${fdate(a.dueDate, { short: true })}</div>
              </div>
              <button class="btn btn-primary !py-1.5 !px-3 text-xs" onclick="stu_submitAssignmentModal('${a.id}')">Submit</button>
            </div>`).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

/* ============================================================
   2. LEARNING (LMS)
   ============================================================ */
const PHET_SIMS = [
  { id: 'wave-on-a-string',    name: 'Wave on a String',       subject: 'Physics',     desc: 'Explore how waves travel along a string and how frequency, amplitude and tension interact.' },
  { id: 'projectile-motion',   name: 'Projectile Motion',      subject: 'Physics',     desc: 'Fire cannonballs and explore how angle, speed, and gravity affect trajectory.' },
  { id: 'ohms-law',            name: "Ohm's Law",              subject: 'Physics',     desc: 'Discover the relationship between voltage, current, and resistance.' },
  { id: 'circuit-construction-kit-dc', name: 'Circuit Builder', subject: 'Physics',   desc: 'Build circuits using batteries, resistors, switches, and bulbs.' },
  { id: 'masses-and-springs',  name: 'Masses & Springs',       subject: 'Physics',     desc: 'Hang masses from springs and investigate how spring constant and mass affect oscillation.' },
  { id: 'build-an-atom',       name: 'Build an Atom',          subject: 'Chemistry',   desc: 'Construct atoms from protons, neutrons, and electrons. See how the periodic table connects.' },
  { id: 'states-of-matter',    name: 'States of Matter',       subject: 'Chemistry',   desc: 'See atoms and molecules as a solid, liquid, and gas. Add or remove heat and watch what happens.' },
  { id: 'acid-base-solutions', name: 'Acid-Base Solutions',    subject: 'Chemistry',   desc: 'Test the pH of household chemicals and see why some solutions are acidic or basic.' },
  { id: 'concentration',       name: 'Concentration',          subject: 'Chemistry',   desc: 'Add solutes to water and observe how concentration changes as you add or remove particles.' },
  { id: 'natural-selection',   name: 'Natural Selection',      subject: 'Biology',     desc: 'Evolve a population of bunnies and observe how environment drives natural selection.' },
  { id: 'membrane-channels',   name: 'Membrane Channels',      subject: 'Biology',     desc: 'Explore how molecules move through membranes via diffusion and active transport.' },
  { id: 'area-builder',        name: 'Area Builder',           subject: 'Mathematics', desc: 'Build shapes and see how area and perimeter relate. Great for geometry practice.' },
  { id: 'fraction-matcher',    name: 'Fraction Matcher',       subject: 'Mathematics', desc: 'Match fractions to shapes, decimals, and percentages to build deep fraction sense.' },
  { id: 'graphing-lines',      name: 'Graphing Lines',         subject: 'Mathematics', desc: 'Explore how slope and y-intercept affect the appearance of a linear equation.' },
  { id: 'equality-explorer',   name: 'Equality Explorer',      subject: 'Mathematics', desc: 'Balance scales using objects and variables to build intuition for equations.' },
  { id: 'number-line-integers',name: 'Number Line — Integers', subject: 'Mathematics', desc: 'Use a number line to add and subtract positive and negative numbers.' }
];

function view_stu_learning(params) {
  const s = me();
  const tab = (params && params.tab) || 'notes';
  const tabBar = `<div class="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
    ${[['notes','Notes'],['videos','Videos'],['sims','Simulations']].map(([k,l]) =>
      `<button onclick="APP.go('stu_learning',{tab:'${k}'})" class="whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}">${l}</button>`
    ).join('')}
  </div>`;

  if (tab === 'notes') {
    const notes = DB.query('learningMaterials', m => m.classId === s.classId && m.type === 'note')
                    .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return `
      ${pageHeader({ title: 'Learning Hub', subtitle: 'Notes, videos and simulations from your teachers' })}
      ${tabBar}
      ${notes.length === 0 ? emptyState({ title: 'No notes yet', body: 'Your teachers will post class notes here. Check back soon.', icon: 'book' }) : `
        <div class="space-y-3">
          ${notes.map(m => {
            const viewed = DB.query('materialViews', v => v.materialId === m.id && v.studentId === s.id).length > 0;
            return `<div class="card p-4 ${viewed ? '' : 'border-l-4 border-brand-400'}">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="badge badge-neutral">${subjName(m.subjectId)}</span>
                    ${m.week ? `<span class="badge badge-success">${m.week}</span>` : ''}
                    ${viewed ? '' : '<span class="badge badge-info">NEW</span>'}
                  </div>
                  <h3 class="font-bold text-slate-900">${m.title}</h3>
                  ${m.description ? `<p class="text-sm text-slate-500 mt-1">${m.description}</p>` : ''}
                  <div class="text-xs text-slate-400 mt-1">${teacherName(m.teacherId)} · ${fdate(m.createdAt, { short: true })}</div>
                </div>
                <button class="btn btn-primary text-sm flex-shrink-0" onclick="stu_openNote('${m.id}')">${icon('book','w-4 h-4')} Read</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  if (tab === 'videos') {
    const videos = DB.query('learningMaterials', m => m.classId === s.classId && m.type === 'video')
                     .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return `
      ${pageHeader({ title: 'Learning Hub', subtitle: 'Video lessons from your teachers' })}
      ${tabBar}
      ${videos.length === 0 ? emptyState({ title: 'No videos yet', body: 'Your teachers will post video lessons here.', icon: 'classes' }) : `
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${videos.map(m => {
            const ytId = m.url ? m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/) : null;
            const videoId = ytId ? ytId[1] : null;
            const viewed = DB.query('materialViews', v => v.materialId === m.id && v.studentId === s.id).length > 0;
            return `<div class="card overflow-hidden">
              <div class="relative bg-black aspect-video cursor-pointer" onclick="stu_watchVideo('${m.id}')">
                ${videoId ? `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" class="w-full h-full object-cover opacity-90" onerror="this.style.display='none'">` : ''}
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">${icon('classes','w-6 h-6 text-white')}</div>
                </div>
                ${viewed ? '' : '<div class="absolute top-2 right-2 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</div>'}
              </div>
              <div class="p-3">
                <span class="badge badge-neutral text-xs">${subjName(m.subjectId)}</span>
                <h4 class="font-bold text-slate-900 text-sm mt-1">${m.title}</h4>
                ${m.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${m.description}</p>` : ''}
                <div class="text-xs text-slate-400 mt-1">${teacherName(m.teacherId)} · ${fdate(m.createdAt, { short: true })}</div>
                <button class="btn btn-primary w-full text-sm mt-3" onclick="stu_watchVideo('${m.id}')">${icon('classes','w-4 h-4')} Watch Now</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  // tab === 'sims'
  const filter = (params && params.simFilter) || 'All';
  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const filtered = filter === 'All' ? PHET_SIMS : PHET_SIMS.filter(s => s.subject === filter);
  return `
    ${pageHeader({ title: 'Learning Hub', subtitle: 'Interactive science and maths simulations' })}
    ${tabBar}
    <div class="flex gap-2 mb-4 flex-wrap">
      ${subjects.map(sub => `<button onclick="APP.go('stu_learning',{tab:'sims',simFilter:'${sub}'})" class="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${filter===sub?'bg-brand-700 text-white border-brand-700':'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${sub}</button>`).join('')}
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${filtered.map(sim => `<div class="card p-4 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl ${{Physics:'bg-blue-50',Chemistry:'bg-amber-50',Biology:'bg-green-50',Mathematics:'bg-purple-50'}[sim.subject]||'bg-slate-50'}">
            ${{Physics:'⚡',Chemistry:'🧪',Biology:'🌿',Mathematics:'📐'}[sim.subject]||'🔬'}
          </div>
          <div>
            <div class="text-xs font-semibold uppercase text-slate-400">${sim.subject}</div>
            <h4 class="font-bold text-slate-900 text-sm leading-tight">${sim.name}</h4>
          </div>
        </div>
        <p class="text-xs text-slate-500 mb-3">${sim.desc}</p>
        <button class="btn btn-primary w-full text-sm" onclick="stu_launchSim('${sim.id}','${sim.name.replace(/'/g,"\\'")}')">
          ${icon('classes','w-4 h-4')} Launch Simulation
        </button>
      </div>`).join('')}
    </div>
  `;
}

function stu_openNote(id) {
  const m = DB.find('learningMaterials', id);
  if (!m) return;
  const s = me();
  // Mark as read
  if (!DB.query('materialViews', v => v.materialId === id && v.studentId === s.id).length) {
    DB.insert('materialViews', { id: uid('mv'), materialId: id, studentId: s.id, viewedAt: now() });
  }
  modal({
    title: m.title,
    size: 'lg',
    body: `<div class="space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="badge badge-neutral">${subjName(m.subjectId)}</span>
        ${m.week ? `<span class="badge badge-success">${m.week}</span>` : ''}
        <span class="text-xs text-slate-400">${teacherName(m.teacherId)} · ${fdate(m.createdAt, { long: true })}</span>
      </div>
      ${m.content ? `<div class="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">${m.content}</div>` : ''}
      ${m.description && !m.content ? `<p class="text-sm text-slate-700">${m.description}</p>` : ''}
      ${m.file ? `<a href="${m.file.data}" download="${m.file.name}" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm hover:bg-blue-100 font-semibold text-blue-900">
        ${icon('download','w-4 h-4 text-blue-600')} Download Attachment — ${m.file.name} (${m.file.size})
      </a>` : ''}
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
  APP.render();
}

function stu_watchVideo(id) {
  const m = DB.find('learningMaterials', id);
  if (!m) return;
  const s = me();
  if (!DB.query('materialViews', v => v.materialId === id && v.studentId === s.id).length) {
    DB.insert('materialViews', { id: uid('mv'), materialId: id, studentId: s.id, viewedAt: now() });
  }
  const ytMatch = m.url ? m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/) : null;
  const ytId = ytMatch ? ytMatch[1] : null;
  modal({
    title: m.title,
    size: 'xl',
    body: `<div class="rounded-xl overflow-hidden bg-black aspect-video w-full">
      ${ytId ? `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>`
             : `<div class="flex items-center justify-center h-full text-white text-sm p-6 text-center">Video unavailable. Your teacher may have posted an incorrect link.<br><a href="${m.url}" target="_blank" class="underline mt-2 block">Try opening directly</a></div>`}
    </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
  APP.render();
}

function stu_launchSim(simId, simName) {
  const url = `https://phet.colorado.edu/sims/html/${simId}/latest/${simId}_all.html`;
  modal({
    title: simName,
    size: 'xl',
    body: `<div class="rounded-xl overflow-hidden bg-slate-900" style="height:520px">
      <iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen
        onerror="this.outerHTML='<div class=\\'flex items-center justify-center h-full text-white p-6 text-center\\'><div>Unable to load simulation.<br><a href=\\'${url}\\' target=\\'_blank\\' class=\\'underline mt-2 block\\'>Open on PhET website instead</a></div></div>'">
      </iframe>
    </div>
    <p class="text-xs text-slate-400 mt-2 text-center">Simulation provided by <a href="https://phet.colorado.edu" target="_blank" class="underline">PhET Interactive Simulations</a> (University of Colorado Boulder) — free and open-source.</p>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

function stu_openMaterial(id) {
  const m = DB.find('learningMaterials', id);
  if (!m) return;
  if (m.type === 'video' && m.url) { window.open(m.url, '_blank'); return; }
  if (m.file && m.file.data) { const a = document.createElement('a'); a.href = m.file.data; a.download = m.file.name; a.click(); return; }
  modal({
    title: m.title,
    body: `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="badge ${m.type === 'video' ? 'badge-danger' : 'badge-info'}">${m.type === 'video' ? 'Video' : 'Note'}</span>
          <span class="badge badge-neutral">${subjName(m.subjectId)}</span>
        </div>
        <p class="text-sm text-slate-700">${m.description || 'No description provided.'}</p>
        ${m.url ? `<a class="btn btn-primary w-full" href="${m.url}" target="_blank">${icon('classes','w-4 h-4')} Open resource</a>` : `<div class="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-500">${icon('book','w-8 h-8 mx-auto mb-2 opacity-40')}This is a text resource shared by ${teacherName(m.teacherId)}.</div>`}
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

/* ============================================================
   3. ASSIGNMENTS (view + submit)
   ============================================================ */
function view_stu_assignments() {
  const s = me();
  const assignments = DB.query('assignments', a => a.classId === s.classId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    ${pageHeader({ title: 'My Assignments', subtitle: 'Homework and tasks from your teachers' })}
    ${assignments.length === 0 ? emptyState({ title: 'No assignments', body: 'Nothing has been set yet.', icon: 'results' }) : `
      <div class="space-y-3">
        ${assignments.map(a => {
          const sub = a.submissions.find(x => x.studentId === s.id);
          const graded = sub && sub.grade != null;
          const overdue = !sub && new Date(a.dueDate) < new Date();
          return `<div class="card p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge badge-neutral">${subjName(a.subjectId)}</span>
                  ${graded ? `<span class="badge badge-success">Graded · ${sub.grade}/100</span>`
                    : sub ? `<span class="badge badge-info">Submitted</span>`
                    : overdue ? `<span class="badge badge-danger">Overdue</span>`
                    : `<span class="badge badge-warn">To do</span>`}
                </div>
                <h3 class="font-bold text-slate-900">${a.title}</h3>
                <p class="text-sm text-slate-500 mt-1">${a.description}</p>
                <div class="text-xs text-slate-400 mt-2">Due ${fdate(a.dueDate, { long: true })} · ${teacherName(a.teacherId)}</div>
                ${graded && sub.feedback ? `<div class="mt-2 bg-emerald-50 rounded-lg p-2 text-xs text-emerald-800"><strong>Teacher feedback:</strong> ${sub.feedback}</div>` : ''}
              </div>
              <div class="flex-shrink-0">
                ${sub ? (graded
                  ? `<div class="text-center"><div class="text-2xl font-extrabold text-emerald-700">${sub.grade}</div><div class="text-xs text-slate-400">/100</div></div>`
                  : `<span class="text-xs text-slate-400">Awaiting grade</span>`)
                  : (a.dueDate && new Date(a.dueDate) < new Date()) || a.overdue === true
                    ? `<span class="badge badge-danger">Submission closed</span>`
                    : `<button class="btn btn-primary text-sm" onclick="stu_submitAssignmentModal('${a.id}')">${icon('upload','w-4 h-4')} Submit</button>`}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function stu_submitAssignmentModal(assignmentId) {
  const a = DB.find('assignments', assignmentId);
  if (!a) return;
  modal({
    title: 'Submit Assignment',
    body: `
      <div class="space-y-3">
        <div class="bg-slate-50 rounded-xl p-3">
          <div class="font-semibold text-sm">${a.title}</div>
          <div class="text-xs text-slate-500 mt-0.5">${subjName(a.subjectId)} · Due ${fdate(a.dueDate, { long: true })}</div>
        </div>
        <div><label class="input-label">Your answer / notes</label><textarea id="stu_sub_text" rows="5" class="input" placeholder="Type your answer, or describe the work you are attaching…"></textarea></div>
        <div>
          <label class="input-label">Attach file (optional)</label>
          <input type="file" id="stu_sub_file" class="hidden" onchange="stu_onSubFile(event)" />
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-brand-400 cursor-pointer" onclick="document.getElementById('stu_sub_file').click()">
            ${icon('upload','w-5 h-5 mx-auto text-slate-400 mb-1')}<div class="text-xs text-slate-500">Click to attach your work (max 2MB)</div>
          </div>
          <div id="stu_sub_preview" class="mt-2"></div>
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
             <button class="btn btn-primary" onclick="stu_submitAssignment('${assignmentId}')">${icon('check','w-4 h-4')} Submit</button>`
  });
}

let _stuSubFile = null;
function stu_onSubFile(ev) {
  _stuSubFile = null;
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('File too large (max 2MB)', 'danger'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _stuSubFile = { name: file.name, type: file.type, size: Math.round(file.size / 1024) + ' KB', data: e.target.result };
    const p = document.getElementById('stu_sub_preview');
    if (p) p.innerHTML = `<div class="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">${icon('paperclip','w-4 h-4 text-emerald-600')}<span class="flex-1 truncate font-semibold text-emerald-900">${file.name}</span><span class="text-xs text-emerald-700">${_stuSubFile.size}</span></div>`;
  };
  reader.readAsDataURL(file);
}

function stu_submitAssignment(assignmentId) {
  const s = me();
  const a = DB.find('assignments', assignmentId);
  if (!a) return;
  const text = (document.getElementById('stu_sub_text').value || '').trim();
  if (!text && !_stuSubFile) { toast('Type your answer or attach a file', 'danger'); return; }
  const submission = { studentId: s.id, submittedAt: now(), text, file: _stuSubFile || null, grade: null };
  // Replace any existing submission, else add
  const subs = a.submissions.filter(x => x.studentId !== s.id);
  subs.push(submission);
  DB.update('assignments', assignmentId, { submissions: subs });
  _stuSubFile = null;
  // Notify the teacher
  DB.insert('notifications', { id: uid('not'), userId: a.teacherId, title: 'Assignment Submitted', body: `${s.name} submitted "${a.title}".`, type: 'info', read: false, timestamp: now(), link: { view: 'tch_assignments' } });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Assignment submitted · your teacher has been notified', 'success');
}

/* ============================================================
   4. CBT EXAMS (list + take + auto-grade)
   ============================================================ */
function view_stu_cbt() {
  const s = me();
  const exams = DB.query('cbtExams', e => e.classId === s.classId && e.status === 'published').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const subs = DB.query('cbtSubmissions', x => x.studentId === s.id);
  return `
    ${pageHeader({ title: 'CBT Exams', subtitle: 'Computer-based tests and quizzes' })}
    ${exams.length === 0 ? emptyState({ title: 'No exams available', body: 'Published CBT exams will appear here.', icon: 'classes' }) : `
      <div class="space-y-3">
        ${exams.map(e => {
          const sub = subs.find(x => x.examId === e.id);
          const objCount = e.questions.filter(q => q.type === 'objective').length;
          const theoryCount = e.questions.filter(q => q.type === 'theory').length;
          return `<div class="card p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge badge-neutral">${subjName(e.subjectId)}</span>
                  <span class="badge badge-info">${e.durationMins} min</span>
                  <span class="badge badge-neutral">${e.questions.length} questions</span>
                  ${sub ? `<span class="badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warn'}">${sub.status === 'graded' ? 'Graded' : 'Submitted'}</span>` : ''}
                </div>
                <h3 class="font-bold text-slate-900">${e.title}</h3>
                <div class="text-xs text-slate-500 mt-1">${objCount} objective · ${theoryCount} theory · Due ${fdate(e.dueDate, { short: true })}</div>
                ${e.rules ? `<div class="text-xs text-amber-700 mt-1">⚠ ${e.rules}</div>` : ''}
              </div>
              <div class="flex-shrink-0 text-right">
                ${sub
                  ? `<div class="text-2xl font-extrabold text-brand-700">${sub.totalScore}<span class="text-sm text-slate-400">/${sub.maxScore}</span></div>
                     <button class="btn btn-secondary !py-1 !px-2 text-xs mt-1" onclick="stu_viewCbtResult('${sub.id}')">View</button>`
                  : `<button class="btn btn-primary text-sm" onclick="stu_startCbt('${e.id}')">${icon('classes','w-4 h-4')} Start</button>`}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  `;
}

let _cbtState = null;
function stu_startCbt(examId) {
  const e = DB.find('cbtExams', examId);
  if (!e) return;
  _cbtState = { examId, answers: {}, secondsLeft: e.durationMins * 60, timer: null, index: 0 };
  confirm(`You are about to start "${e.title}". You have ${e.durationMins} minutes and one attempt. The timer starts immediately. Ready?`, () => {
    stu_renderCbt();
    _cbtState.timer = setInterval(() => {
      if (!_cbtState) return;
      _cbtState.secondsLeft--;
      const el = document.getElementById('cbtTimer');
      if (el) {
        const m = Math.floor(_cbtState.secondsLeft / 60), sec = _cbtState.secondsLeft % 60;
        el.textContent = `${m}:${String(sec).padStart(2, '0')}`;
        if (_cbtState.secondsLeft <= 30) el.classList.add('text-rose-600');
      }
      if (_cbtState.secondsLeft <= 0) { toast('Time is up — submitting your answers', 'warn'); stu_submitCbt(true); }
    }, 1000);
  }, { yesLabel: 'Start Exam' });
}

function stu_renderCbt() {
  const e = DB.find('cbtExams', _cbtState.examId);
  const answered = Object.keys(_cbtState.answers).length;
  modal({
    title: e.title,
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-2 sticky top-0 z-10">
          <div class="text-sm">${answered}/${e.questions.length} answered</div>
          <div class="flex items-center gap-2 text-sm">${icon('calendar','w-4 h-4')} <span id="cbtTimer" class="font-mono font-bold text-lg">${e.durationMins}:00</span></div>
        </div>
        <div class="space-y-5">
          ${e.questions.map((q, i) => `
            <div class="border border-slate-200 rounded-xl p-4">
              <div class="flex items-start gap-2 mb-3">
                <span class="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">${i + 1}</span>
                <div class="flex-1">
                  <div class="font-semibold text-slate-900">${q.text}</div>
                  <div class="text-xs text-slate-400 mt-0.5">${q.type === 'objective' ? 'Multiple choice' : 'Theory'} · ${q.marks} mark${q.marks > 1 ? 's' : ''}</div>
                </div>
              </div>
              ${q.type === 'objective' ? `
                <div class="space-y-2 pl-8">
                  ${q.options.map((opt, oi) => `
                    <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input type="radio" name="cbt_${q.id}" value="${oi}" ${_cbtState.answers[q.id] === oi ? 'checked' : ''} onchange="stu_cbtAnswer('${q.id}', ${oi})" />
                      <span class="text-sm">${opt}</span>
                    </label>
                  `).join('')}
                </div>
              ` : `
                <div class="pl-8"><textarea class="input" rows="3" placeholder="Type your answer…" oninput="stu_cbtAnswer('${q.id}', this.value)">${_cbtState.answers[q.id] || ''}</textarea></div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="stu_cancelCbt()">Cancel</button>
             <button class="btn btn-primary" onclick="stu_submitCbt(false)">${icon('check','w-4 h-4')} Submit Exam</button>`,
    onClose: () => { /* keep timer running until explicit submit/cancel */ }
  });
}

function stu_cbtAnswer(qid, val) {
  if (!_cbtState) return;
  _cbtState.answers[qid] = val;
  // update answered counter
}

function stu_cancelCbt() {
  if (_cbtState && _cbtState.timer) clearInterval(_cbtState.timer);
  _cbtState = null;
  document.getElementById('modalBackdrop').click();
  toast('Exam cancelled — no answers saved', 'warn');
}

function stu_submitCbt(auto) {
  if (!_cbtState) return;
  const e = DB.find('cbtExams', _cbtState.examId);
  const s = me();
  if (_cbtState.timer) clearInterval(_cbtState.timer);
  // Auto-grade objective questions
  let objectiveScore = 0, objectiveMax = 0, theoryMax = 0;
  e.questions.forEach(q => {
    if (q.type === 'objective') {
      objectiveMax += q.marks;
      if (_cbtState.answers[q.id] === q.answer) objectiveScore += q.marks;
    } else {
      theoryMax += q.marks;
    }
  });
  const hasTheory = theoryMax > 0;
  const submission = {
    id: uid('cbtsub'), examId: e.id, studentId: s.id, schoolId: s.schoolId,
    answers: { ..._cbtState.answers },
    objectiveScore, objectiveMax, theoryScore: 0, theoryMax,
    totalScore: objectiveScore, maxScore: objectiveMax + theoryMax,
    status: hasTheory ? 'submitted' : 'graded',
    submittedAt: now(), gradedAt: hasTheory ? null : now()
  };
  DB.insert('cbtSubmissions', submission);
  // Notify teacher (theory review) and student
  DB.insert('notifications', { id: uid('not'), userId: e.teacherId, title: 'CBT Submitted', body: `${s.name} submitted "${e.title}". ${hasTheory ? 'Theory answers need review.' : 'Auto-graded.'}`, type: 'info', read: false, timestamp: now(), link: { view: 'tch_cbt' } });
  _cbtState = null;
  document.getElementById('modalBackdrop').click();
  // Result summary
  modal({
    title: 'Exam Submitted',
    body: `
      <div class="text-center py-4">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">${icon('check','w-8 h-8')}</div>
        <h3 class="text-lg font-bold text-slate-900">Well done, ${s.name.split(' ')[0]}!</h3>
        <p class="text-sm text-slate-500 mb-4">${auto ? 'Time ran out, but your answers were saved.' : 'Your answers have been submitted.'}</p>
        <div class="bg-slate-50 rounded-xl p-4 inline-block">
          <div class="text-3xl font-extrabold text-brand-700">${objectiveScore}<span class="text-lg text-slate-400">/${objectiveMax}</span></div>
          <div class="text-xs text-slate-500 mt-1">Objective score (auto-graded)</div>
          ${hasTheory ? `<div class="text-xs text-amber-700 mt-2">+ ${theoryMax} theory marks pending teacher review</div>` : ''}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); APP.go('stu_cbt')">Done</button>`
  });
}

function stu_viewCbtResult(subId) {
  const sub = DB.find('cbtSubmissions', subId);
  const e = DB.find('cbtExams', sub.examId);
  modal({
    title: e.title + ' — Result',
    size: 'lg',
    body: `
      <div class="space-y-4">
        <div class="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-xl p-4 text-center">
          <div class="text-4xl font-extrabold">${sub.totalScore}<span class="text-xl opacity-70">/${sub.maxScore}</span></div>
          <div class="text-sm text-brand-200 mt-1">${sub.status === 'graded' ? 'Final score' : 'Objective score (theory pending review)'}</div>
        </div>
        <div class="space-y-3">
          ${e.questions.map((q, i) => {
            const ans = sub.answers[q.id];
            if (q.type === 'objective') {
              const correct = ans === q.answer;
              return `<div class="border ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'} rounded-xl p-3">
                <div class="font-semibold text-sm text-slate-900">${i + 1}. ${q.text}</div>
                <div class="text-xs mt-1 ${correct ? 'text-emerald-700' : 'text-rose-700'}">Your answer: ${ans != null ? q.options[ans] : '—'} ${correct ? '✓' : '✗'}</div>
                ${!correct ? `<div class="text-xs text-slate-600 mt-0.5">Correct answer: ${q.options[q.answer]}</div>` : ''}
              </div>`;
            }
            return `<div class="border border-slate-200 rounded-xl p-3">
              <div class="font-semibold text-sm text-slate-900">${i + 1}. ${q.text}</div>
              <div class="text-xs text-slate-600 mt-1"><strong>Your answer:</strong> ${ans || '—'}</div>
              <div class="text-xs ${sub.status === 'graded' ? 'text-emerald-700' : 'text-amber-700'} mt-1">${sub.status === 'graded' ? `Awarded ${sub.theoryScore}/${sub.theoryMax} theory marks` : 'Pending teacher review'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}

/* ============================================================
   5. MY RESULTS (report card)
   ============================================================ */
function view_stu_results() {
  const s = me();
  const allResults = COMPUTE.studentResults(s.id);
  const results = allResults.filter(r => r.approved);
  const pendingCount = allResults.length - results.length;
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const avg = results.length ? Math.round(total / results.length) : 0;
  const cbtSubs = DB.query('cbtSubmissions', x => x.studentId === s.id);
  const reportComment = DB.query('reportComments', rc => rc.studentId === s.id && rc.term === DB.settings().currentTerm)[0];
  const canDownload = results.length > 0 && !!reportComment;
  return `
    ${pageHeader({ title: 'My Results', subtitle: `${(APP.params && APP.params.term) || (results.length > 0 && results[0].term) || DB.settings().currentTerm} · academic performance`, actions: results.length ? `
      <div class="flex items-center gap-2">
        ${!reportComment ? `<span class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">${icon('info','w-3.5 h-3.5 inline mr-1')} Awaiting teacher comment</span>` : ''}
        <button class="btn btn-secondary ${!canDownload ? 'opacity-50 cursor-not-allowed' : ''}" ${canDownload ? `onclick="printReportCard('${s.id}')"` : 'disabled title="Your class teacher must add a comment before the report card can be downloaded"'}>${icon('download','w-4 h-4')} Report Card</button>
      </div>` : '' })}

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      ${statCard({ label: 'Subjects', value: results.length, icon: 'book', color: 'brand' })}
      ${statCard({ label: 'Average', value: avg + '%', icon: 'reports', color: avg >= 60 ? 'brand' : 'rose' })}
      ${statCard({ label: 'CBT Taken', value: cbtSubs.length, icon: 'classes', color: 'blue' })}
    </div>

    ${pendingCount > 0 ? `<div class="alert alert-warn mb-4">${pendingCount} result(s) are still being reviewed by your teacher and will appear here once approved.</div>` : ''}

    <div class="card overflow-hidden mb-4">
      <div class="px-4 py-3 border-b border-slate-100"><h3 class="font-bold text-slate-900">Subject Results</h3></div>
      ${results.length === 0 ? `<div class="p-6 text-center text-sm text-slate-500">No results published yet.</div>` : `
        <div class="overflow-x-auto"><table class="tbl">
          <thead><tr><th>Subject</th><th class="text-center">CA1</th><th class="text-center">CA2</th><th class="text-center">Exam</th><th class="text-center">Total</th><th class="text-center">Grade</th></tr></thead>
          <tbody>
            ${results.map(r => `<tr>
              <td class="font-medium">${subjName(r.subjectId)}</td>
              <td class="text-center">${r.ca1}</td>
              <td class="text-center">${r.ca2}</td>
              <td class="text-center">${r.exam}</td>
              <td class="text-center font-bold">${r.total}</td>
              <td class="text-center">${(() => { const gradeBadge = r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : (r.grade === 'D' || r.grade === 'E') ? 'badge-warn' : 'badge-info'; return `<span class="badge ${gradeBadge}">${r.grade}</span>`; })()}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      `}
    </div>

    ${reportComment ? `<div class="card p-5 mb-4 border-l-4 border-brand-500">
      <h3 class="font-bold text-slate-900 mb-2">Class Teacher's Comment</h3>
      <p class="text-sm text-slate-700">${reportComment.comment}</p>
      <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>By ${reportComment.classTeacher || 'Class Teacher'}</span>
        <span>Head Teacher: ${reportComment.headTeacher || '—'}</span>
      </div>
    </div>` : `<div class="card p-4 mb-4 bg-amber-50 border border-amber-200">
      <div class="flex items-center gap-3">
        <span class="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">${icon('bell','w-5 h-5')}</span>
        <div>
          <div class="font-semibold text-amber-900 text-sm">Report Card Not Yet Ready</div>
          <div class="text-xs text-amber-700 mt-0.5">Your class teacher needs to add a comment before you can download your report card.</div>
        </div>
      </div>
    </div>`}

    ${cbtSubs.length ? `<div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100"><h3 class="font-bold text-slate-900">CBT Scores</h3></div>
      <div class="overflow-x-auto"><table class="tbl">
        <thead><tr><th>Exam</th><th>Subject</th><th class="text-center">Score</th><th class="text-center">Status</th></tr></thead>
        <tbody>
          ${cbtSubs.map(sub => { const e = DB.find('cbtExams', sub.examId); return `<tr>
            <td class="font-medium">${e ? e.title : '—'}</td>
            <td>${e ? subjName(e.subjectId) : '—'}</td>
            <td class="text-center font-bold">${sub.totalScore}/${sub.maxScore}</td>
            <td class="text-center"><span class="badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warn'}">${sub.status === 'graded' ? 'Graded' : 'Pending'}</span></td>
          </tr>`; }).join('')}
        </tbody>
      </table></div>
    </div>` : ''}
  `;
}

/* ============================================================
   6. BEHAVIOUR & REWARDS
   ============================================================ */
function view_stu_behaviour() {
  const s = me();
  const reward = COMPUTE.studentRewards(s.id);
  const records = DB.query('discipline', d => d.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
  const commend = records.filter(r => r.type === 'commendation');
  const misconduct = records.filter(r => r.type === 'misconduct');
  return `
    ${pageHeader({ title: 'My Behaviour', subtitle: 'Conduct record, commendations and rewards' })}

    <div class="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 mb-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="text-amber-100 text-sm">Reward Points</div>
          <div class="text-4xl font-extrabold">${reward.points}</div>
        </div>
        <div class="text-3xl">${'⭐'.repeat(reward.stars)}</div>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        ${reward.badges.map(b => `<span class="bg-white/20 rounded-lg px-2 py-1 text-sm">${b.icon} ${b.label}</span>`).join('')}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      ${statCard({ label: 'Commendations', value: commend.length, icon: 'check', color: 'brand' })}
      ${statCard({ label: 'Misconduct', value: misconduct.length, icon: 'bell', color: misconduct.length ? 'rose' : 'brand' })}
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100"><h3 class="font-bold text-slate-900">Conduct History</h3></div>
      ${records.length === 0 ? `<div class="p-6 text-center text-sm text-slate-500">No records — keep up the good behaviour!</div>` : `
        <div class="divide-y divide-slate-100">
          ${records.map(r => `<div class="flex items-center gap-3 p-3">
            <span class="w-9 h-9 rounded-lg ${r.type === 'commendation' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center flex-shrink-0">${icon(r.type === 'commendation' ? 'check' : 'bell', 'w-5 h-5')}</span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${r.note}</div>
              <div class="text-xs text-slate-500">${fdate(r.date, { long: true })}</div>
            </div>
            <span class="font-bold ${r.points >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${r.points >= 0 ? '+' : ''}${r.points}</span>
          </div>`).join('')}
        </div>
      `}
    </div>
  `;
}

/* ============================================================
   7. TIMETABLE
   ============================================================ */
function view_stu_timetable() {
  const s = me();
  const cls = myClass();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const entries = DB.query('timetable', t => t.classId === s.classId);
  const cell = (day, period) => entries.find(e => e.day === day && e.period === period);
  const hasAny = entries.length > 0;
  return `
    ${pageHeader({ title: 'My Timetable', subtitle: cls ? `${cls.name} · weekly schedule` : 'Weekly schedule' })}
    ${!hasAny ? emptyState({ title: 'No timetable yet', body: 'Your class timetable will appear here once published.', icon: 'calendar' }) : `
      <div class="card overflow-hidden">
        <div class="overflow-x-auto"><table class="tbl">
          <thead><tr><th>Period</th>${days.map(d => `<th class="text-center">${d.slice(0, 3)}</th>`).join('')}</tr></thead>
          <tbody>
            ${periods.filter(p => days.some(d => cell(d, p))).map(p => `<tr>
              <td class="font-semibold text-slate-500">P${p}</td>
              ${days.map(d => { const c = cell(d, p); return `<td class="text-center text-sm">${c ? `<div class="font-semibold text-slate-900">${subjName(c.subjectId)}</div><div class="text-xs text-slate-400">${teacherName(c.teacherId).split(' ').slice(-1)}</div>` : '<span class="text-slate-300">—</span>'}</td>`; }).join('')}
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `}
  `;
}
