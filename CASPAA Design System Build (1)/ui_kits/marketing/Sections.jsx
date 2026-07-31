/* CASPAA marketing site — sections recreated from pages/home.js +
   components/SiteLayout.js + components/Icons.js. Registered on window.MK so the
   kit runs from plain <script type="text/babel"> with no bundler. */
window.MK = {};

const ICONS = {
  'trending-down': ['M22 17l-8.5-8.5-5 5L2 7', 'M16 17h6v-6'],
  puzzle: ['M15.5 3.5a2 2 0 1 1 4 0V5h1.5a1 1 0 0 1 1 1v3.5h-1.5a2 2 0 1 0 0 4H22V17a1 1 0 0 1-1 1h-3.5v-1.5a2 2 0 1 0-4 0V18H10a1 1 0 0 1-1-1v-3.5H7.5a2 2 0 1 1 0-4H9V6a1 1 0 0 1 1-1h3.5V3.5'],
  'wifi-off': ['M2 2l20 20', 'M8.5 16.4a5 5 0 0 1 7 0', 'M5 12.9a10 10 0 0 1 5.2-2.7', 'M19 12.9a10 10 0 0 0-2-1.5', 'M2 8.8a15 15 0 0 1 4.2-2.6', 'M22 8.8a15 15 0 0 0-11.3-3.8', 'M12 20h.01'],
  hourglass: ['M5 22h14M5 2h14', 'M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22', 'M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2'],
  'cloud-off': ['M2 2l20 20', 'M5.8 5.8A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.3-.2', 'M21.5 16.5A4.5 4.5 0 0 0 17.5 10h-1.8A7 7 0 0 0 10 5.1'],
  card: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M2 10h20'],
  bank: ['M2 9l10-6 10 6', 'M3 22h18', 'M6 18v-7M10 18v-7M14 18v-7M18 18v-7'],
  sparkles: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M18 16l.7 1.8 1.8.7-1.8.7L18 21l-.7-1.8-1.8-.7 1.8-.7z'],
  'file-edit': ['M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4', 'M13 3v5h5', 'M18.4 12.6a2 2 0 1 1 2.8 2.8L17 19.6l-3 .7.7-3z'],
  'check-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M8 12l3 3 5-6'],
  'trending-up': ['M22 7l-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  calculator: ['M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M8 6h8', 'M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'],
  globe: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  headset: ['M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3'],
  folders: ['M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2z', 'M2 8v11a2 2 0 0 0 2 2h14'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  lightbulb: ['M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'],
  shield: ['M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
  sync: ['M21 12a9 9 0 0 0-9-9 9.8 9.8 0 0 0-6.7 2.7L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 9 9 9.8 9.8 0 0 0 6.7-2.7L21 16', 'M16 16h5v5'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M22 7l-9 5.7a2 2 0 0 1-2 0L2 7'],
  phone: ['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z'],
};

const Icon = MK.Icon = ({ name, className = 'w-5 h-5' }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
};

const Check = MK.Check = ({ className = 'text-site-600' }) => (
  <svg viewBox="0 0 20 20" className={'w-5 h-5 shrink-0 ' + className} fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" />
  </svg>
);

const Eyebrow = MK.Eyebrow = ({ children, light }) => (
  <p className={'text-xs font-bold tracking-[0.15em] mb-3 ' + (light ? 'text-accent-300' : 'text-site-700')}>{children}</p>
);

const PrimaryButton = MK.PrimaryButton = ({ children, onClick, className = '' }) => (
  <a href="#" onClick={e => { e.preventDefault(); onClick && onClick(); }}
    className={'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-bold text-sm shadow-lg shadow-accent-600/25 hover:shadow-xl hover:shadow-accent-600/40 mkt-btn ' + className}>
    {children}
  </a>
);

const GhostButton = MK.GhostButton = ({ children, light, onClick, className = '' }) => (
  <a href="#" onClick={e => { e.preventDefault(); onClick && onClick(); }}
    className={'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm mkt-btn ' +
      (light ? 'text-white border-white/30 hover:bg-white/10' : 'text-site-700 border-site-200 hover:bg-site-50') + ' ' + className}>
    {children}
  </a>
);

const Section = MK.Section = ({ id, className = '', children }) => (
  <section id={id} className={'py-24 md:py-32 scroll-mt-16 ' + className}>
    <div className="max-w-7xl mx-auto px-5">{children}</div>
  </section>
);

const Backdrop = ({ src, opacity = 'opacity-15' }) => (
  <div className={'absolute inset-0 ' + opacity} aria-hidden="true">
    <img src={src} alt="" className="w-full h-full object-cover" />
  </div>
);

MK.Nav = function Nav({ onCta }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={'fixed top-0 inset-x-0 z-40 transition-colors duration-300 ' +
      (scrolled ? 'bg-white/90 backdrop-blur border-b border-slate-100' : 'bg-transparent border-b border-transparent')}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <a href="#" className="flex items-center shrink-0" aria-label="CASPAA home">
          <img src={scrolled ? '../../assets/logo/caspaa-green.svg' : '../../assets/logo/caspaa-white.svg'} alt="CASPAA" className="h-8 w-auto" />
        </a>
        <nav className={'hidden md:flex items-center gap-8 text-sm font-semibold ' + (scrolled ? 'text-slate-600' : 'text-white/80')}>
          {SITE.NAV_LINKS.map((l, i) => (
            <a key={l.label} href={l.href} className={'relative py-1 transition-colors ' + (i === 0 ? (scrolled ? 'text-site-700' : 'text-white') : '')}>
              {l.label}
              {i === 0 && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-600" />}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className={'text-sm font-semibold ' + (scrolled ? 'text-slate-600 hover:text-site-700' : 'text-white/80 hover:text-white')}>Sign in</a>
          <PrimaryButton onClick={onCta} className="px-4 py-2.5">Book a Demo</PrimaryButton>
        </div>
      </div>
    </header>
  );
};

MK.Hero = function Hero({ onCta }) {
  const HERO = SITE.HERO;
  const [typed, setTyped] = React.useState('');
  const [i, setI] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  React.useEffect(() => {
    const full = HERO.titles[i];
    if (!deleting && typed === full) { const t = setTimeout(() => setDeleting(true), 2800); return () => clearTimeout(t); }
    if (deleting && typed === '') { const t = setTimeout(() => { setDeleting(false); setI(n => (n + 1) % HERO.titles.length); }, 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setTyped(full.slice(0, typed.length + (deleting ? -1 : 1))), deleting ? 35 : 75);
    return () => clearTimeout(t);
  }, [typed, deleting, i]);
  const longest = HERO.titles.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <section className="relative overflow-hidden bg-site-800 text-white">
      <Backdrop src="../../assets/images/hero-backdrop.jpg" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-site-500/30 blur-3xl" />
      <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-accent-400/10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-5 pt-36 pb-20 md:pt-44 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow light>{HERO.eyebrow}</Eyebrow>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight relative">
            <span className="sr-only">{HERO.title}</span>
            <span className="invisible" aria-hidden="true">{longest}</span>
            <span className="absolute inset-0" aria-hidden="true">{typed}<span className="tw-caret" /></span>
          </h1>
          <p className="mt-5 text-lg text-site-100 max-w-xl">{HERO.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton onClick={onCta}>Book a Free Demo</PrimaryButton>
            <GhostButton light>See Pricing →</GhostButton>
          </div>
          <p className="mt-5 text-sm text-site-200">{HERO.microtrust}</p>
        </div>
        <div className="lg:pl-6 relative">
          <img src="../../assets/images/hero-woman.webp" alt="A school administrator holding a laptop"
            className="relative z-10 w-full max-w-[17rem] sm:max-w-sm lg:max-w-sm xl:max-w-md mx-auto h-auto select-none pointer-events-none" />
          <div className="hidden lg:block absolute z-20 float-card left-6 xl:left-12 top-10 w-40 xl:w-48">
            <img src="../../assets/images/chart-enrolment.webp" alt="Enrolment rate trending up" className="tilt-face w-full h-auto rounded-xl shadow-2xl shadow-black/40" />
          </div>
          <div className="hidden lg:block absolute z-20 float-card d1 left-2 xl:left-6 bottom-10 w-32 xl:w-36">
            <img src="../../assets/images/chart-collection.webp" alt="Fee collection rate" className="tilt-face w-full h-auto rounded-xl shadow-2xl shadow-black/40" />
          </div>
          <div className="hidden lg:block absolute z-20 float-card d2 right-4 xl:right-10 bottom-24 w-40 xl:w-48">
            <img src="../../assets/images/chart-retention.webp" alt="Retention rate at 90 percent" className="tilt-face w-full h-auto rounded-xl shadow-2xl shadow-black/40" />
          </div>
        </div>
      </div>
    </section>
  );
};

MK.TrustBar = () => (
  <section className="bg-site-50 border-y border-site-100">
    <div className="max-w-7xl mx-auto px-5 py-10">
      <p className="text-center text-xs font-bold tracking-[0.15em] text-site-700 mb-6">TRUSTED BY FORWARD-THINKING AFRICAN SCHOOLS</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 max-w-3xl mx-auto">
        {SITE.METRICS.map(m => (
          <div key={m.label} className="text-center">
            <p className="text-3xl font-extrabold text-site-700">{m.value}</p>
            <p className="text-xs text-slate-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

MK.Problem = () => (
  <Section>
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <Eyebrow>THE PROBLEM</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Most schools run on a patchwork of tools that don’t talk to each other.
        </h2>
        <p className="mt-5 text-lg text-slate-600">
          A record system here. A separate accounting package there. Fees in a spreadsheet. Consent forms on paper.
          Every tool holds a piece of the truth — and none of them give you the whole picture. The result? Revenue
          leaks, reconciliation eats your week, and reports reach your desk after the moment to act has passed.
        </p>
      </div>
      <img src="../../assets/images/problem.jpg" alt="Paper forms being filled in beside a keyboard"
        className="w-full aspect-[3/2] object-cover rounded-2xl shadow-lg mkt-lift" />
    </div>
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {SITE.PROBLEMS.map(p => (
        <div key={p.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mkt-card">
          <div className="w-11 h-11 rounded-xl bg-site-50 text-site-600 grid place-items-center"><Icon name={p.icon} /></div>
          <h3 className="mt-3 font-bold text-slate-900">{p.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{p.body}</p>
        </div>
      ))}
    </div>
    <p className="mt-10 text-xl font-bold text-site-700">There’s a better way to run a school.</p>
  </Section>
);

MK.Solution = ({ onCta }) => (
  <Section id="features" className="bg-slate-50">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <Eyebrow>THE SOLUTION</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">One platform for every part of your school.</h2>
        <p className="mt-5 text-lg text-slate-600">
          From school operations, payments and financing to attendance, learning, CBT and engagement — CASPAA is a
          unified operating system that replaces the many different tools your school is using right now.
        </p>
        <PrimaryButton onClick={onCta} className="mt-8">Explore the platform →</PrimaryButton>
      </div>
      <img src="../../assets/images/solution.jpg" alt="CASPAA in use at a school"
        className="w-full aspect-[3/2] object-cover rounded-2xl shadow-lg mkt-lift" />
    </div>
  </Section>
);

MK.PlatformMarquee = () => {
  const run = SITE.PLATFORM_TILES.concat(SITE.PLATFORM_TILES);
  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 text-center mb-10">
        <Eyebrow>INSIDE THE PLATFORM</Eyebrow>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">The tools your school runs on.</h2>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {run.map((t, i) => (
            <div key={t.title + i} aria-hidden={i >= SITE.PLATFORM_TILES.length || undefined}
              className="group w-[360px] shrink-0 rounded-2xl bg-white p-7 ring-1 ring-slate-200 shadow-sm transition-colors duration-300 hover:bg-site-800">
              <div className="w-12 h-12 rounded-xl bg-site-50 text-site-600 grid place-items-center transition-colors duration-300 group-hover:bg-white/10 group-hover:text-accent-300">
                <Icon name={t.icon} className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-white">{t.title}</h3>
              <p className="mt-2 text-sm text-slate-600 transition-colors duration-300 group-hover:text-white">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

MK.Roles = () => {
  const [active, setActive] = React.useState(0);
  const role = SITE.ROLES[active];
  return (
    <Section id="roles">
      <div className="text-center max-w-2xl mx-auto">
        <Eyebrow>BUILT FOR YOUR WHOLE SCHOOL</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Every role gets a purpose-built experience.</h2>
        <p className="mt-4 text-lg text-slate-600">
          Proprietors, principals, teachers, parents, students and finance teams each get a workspace designed around what they actually do.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {SITE.ROLES.map((r, i) => (
          <button key={r.slug} onClick={() => setActive(i)}
            className={'px-4 py-2 rounded-full text-sm font-semibold transition ' +
              (i === active ? 'bg-site-800 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            {r.tab}
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-3xl bg-site-800 text-white p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-accent-300 font-bold text-sm">{role.name}</p>
          <h3 className="mt-2 text-2xl md:text-3xl font-extrabold">{role.headline}</h3>
          <p className="mt-4 text-site-100">{role.body}</p>
          <p className="mt-5 text-accent-300 font-semibold italic">{role.punch}</p>
          <GhostButton light className="mt-6">Learn more →</GhostButton>
        </div>
        <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[3/2] grid place-items-center text-center p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] text-accent-300">ROLE IMAGE SLOT</p>
            <p className="mt-2 text-sm text-white/70">900×600 · person in context</p>
            <p className="mt-1 text-xs text-white/50">/images/roles/{role.slug}.jpg — empty in the repo</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

MK.Comparison = () => (
  <Section>
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>WHY SCHOOLS ARE SWITCHING</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">A regular SMS manages records. CASPAA runs your school.</h2>
    </div>
    <div className="mt-10 max-w-4xl mx-auto overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <div className="grid grid-cols-2 text-sm font-bold">
        <div className="p-4 bg-slate-100 text-slate-500">Regular School Management System</div>
        <div className="p-4 bg-site-800 text-white">CASPAA School Operating System</div>
      </div>
      {SITE.COMPARISON.map((row, i) => (
        <div key={row[0]} className={'grid grid-cols-2 text-sm ' + (i % 2 ? 'bg-white' : 'bg-slate-50')}>
          <div className="p-4 text-slate-500 border-t border-slate-100">{row[0]}</div>
          <div className="p-4 text-slate-800 font-semibold border-t border-site-100 bg-site-50/40 flex items-center gap-2"><Check /> {row[1]}</div>
        </div>
      ))}
    </div>
    <div className="text-center mt-8"><GhostButton>See the full feature list →</GhostButton></div>
  </Section>
);

MK.Advantages = () => (
  <Section className="bg-site-800 text-white">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow light>OUR UNIQUE ADVANTAGES</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything a modern school needs, in one system.</h2>
    </div>
    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {SITE.ADVANTAGES.map(a => (
        <div key={a} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <Check className="text-accent-300" /><span className="text-sm text-white/90">{a}</span>
        </div>
      ))}
    </div>
    <p className="text-center mt-10 text-xl font-bold text-accent-300">Smart schools run on systems. Great schools run on CASPAA.</p>
  </Section>
);

MK.Outcomes = () => (
  <Section id="why">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>THE FUTURE OF SCHOOL OPERATIONS IS HERE</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">What changes when you run on CASPAA.</h2>
    </div>
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SITE.OUTCOMES.map(o => (
        <div key={o.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md mkt-card">
          <div className="w-11 h-11 rounded-xl bg-site-50 text-site-600 grid place-items-center"><Icon name={o.icon} /></div>
          <h3 className="mt-3 font-bold text-slate-900">{o.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{o.body}</p>
        </div>
      ))}
    </div>
  </Section>
);

MK.Onboarding = () => (
  <Section className="bg-slate-50">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>GO LIVE IN DAYS, NOT MONTHS</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">From sign-up to fully running — we handle the heavy lifting.</h2>
    </div>
    <div className="mt-12 grid gap-6 md:grid-cols-4">
      {SITE.STEPS.map(s => (
        <div key={s.n} className="relative rounded-2xl bg-white p-6 ring-1 ring-slate-100 mkt-card">
          <div className="w-10 h-10 rounded-full bg-site-800 text-white grid place-items-center font-extrabold">{s.n}</div>
          <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{s.body}</p>
        </div>
      ))}
    </div>
    <p className="text-center mt-8 text-sm text-slate-500">Dedicated onboarding, live chat and 24/7 client support at every step.</p>
  </Section>
);

MK.Pricing = ({ onCta }) => (
  <Section id="pricing" className="bg-white">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>PRICING</Eyebrow>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Per student, per term.</h2>
      <p className="mt-4 text-lg text-slate-600">Setup includes data migration and 2–3 days of hands-on training. Prices are VAT exclusive.</p>
    </div>
    <div className="mt-12 grid gap-5 lg:grid-cols-3 items-start">
      {SITE.PRICING.map(p => (
        <div key={p.name} className={'rounded-2xl p-7 ' + (p.popular ? 'bg-site-800 text-white shadow-xl' : 'bg-white ring-1 ring-slate-200 shadow-sm')}>
          <div className="flex items-center justify-between gap-3">
            <h3 className={'text-lg font-bold ' + (p.popular ? 'text-white' : 'text-slate-900')}>{p.name}</h3>
            {p.popular && <span className="px-3 py-1 rounded-full bg-accent-600 text-white text-xs font-bold">MOST POPULAR</span>}
            {p.gold && <span className="px-3 py-1 rounded-full bg-gold-500 text-white text-xs font-bold">GROUPS</span>}
          </div>
          <p className={'mt-2 text-sm ' + (p.popular ? 'text-site-100' : 'text-slate-600')}>{p.tagline}</p>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
            <span className={'text-sm ' + (p.popular ? 'text-site-200' : 'text-slate-500')}>{p.unit}</span>
          </div>
          {p.setup && <p className={'mt-2 text-xs ' + (p.popular ? 'text-site-200' : 'text-slate-500')}>{p.setup}</p>}
          <div className="mt-6">
            {p.popular
              ? <PrimaryButton onClick={onCta} className="w-full">Choose Premium</PrimaryButton>
              : <GhostButton onClick={onCta} className="w-full">{p.gold ? 'Talk to Sales' : 'Get Started'}</GhostButton>}
          </div>
          {p.inherits && <p className={'mt-6 text-xs font-bold ' + (p.popular ? 'text-accent-300' : 'text-site-700')}>{p.inherits}</p>}
          <ul className="mt-3 space-y-2">
            {p.features.map(ft => (
              <li key={ft} className={'flex items-start gap-2 text-sm ' + (p.popular ? 'text-white/90' : 'text-slate-600')}>
                <Check className={p.popular ? 'text-accent-300' : 'text-site-600'} />{ft}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Section>
);

MK.Security = () => (
  <Section id="security">
    <div className="relative overflow-hidden rounded-3xl bg-site-800 text-white p-8 md:p-12">
      <Backdrop src="../../assets/images/security.jpg" opacity="opacity-20" />
      <div className="relative max-w-2xl">
        <Eyebrow light>BUILT ON TRUST</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Bank-grade security for your school’s most sensitive data.</h2>
        <p className="mt-4 text-site-100">
          Student records and payment data are protected end-to-end. CASPAA uses secure payment infrastructure,
          encrypted data handling, and role-based access so the right people see the right things — and nothing more.
        </p>
      </div>
      <div className="relative mt-8 flex flex-wrap gap-3">
        {SITE.SECURITY.map(s => (
          <span key={s.label} className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm font-semibold">
            <Icon name={s.icon} className="w-4 h-4 text-accent-300" /> {s.label}
          </span>
        ))}
      </div>
    </div>
  </Section>
);

MK.Faq = () => {
  const [open, setOpen] = React.useState(0);
  return (
    <Section id="faq" className="bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <Eyebrow>QUESTIONS, ANSWERED</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently asked questions.</h2>
        </div>
        <div className="mt-10 space-y-3">
          {SITE.FAQ.map((f, i) => (
            <div key={f.q} className="rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden">
              <button className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-slate-900"
                onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}<span className="text-site-700 text-xl shrink-0">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <p className="px-5 pb-5 -mt-1 text-slate-600 text-sm slide-up">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

MK.FinalCta = ({ onCta }) => (
  <section className="relative overflow-hidden bg-site-800 text-white">
    <Backdrop src="../../assets/images/cta-backdrop.jpg" />
    <div className="relative max-w-5xl mx-auto px-5 py-20 text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to run your school the modern way?</h2>
      <p className="mt-4 text-lg text-site-100 max-w-2xl mx-auto">
        Join the schools transforming how they operate, collect fees and engage parents — online and offline. See
        CASPAA on your own workflows in a free, no-obligation demo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PrimaryButton onClick={onCta}>Book Your Free Demo</PrimaryButton>
        <GhostButton light>Talk to Sales — 0803 201 1561</GhostButton>
      </div>
      <p className="mt-6 text-accent-300 font-bold">Smart schools run on systems. Great schools run on CASPAA.</p>
    </div>
  </section>
);

MK.Footer = () => {
  const cols = [
    { title: 'Product', links: SITE.ROLES.map(r => 'For ' + r.tab) },
    { title: 'Company', links: ['Why CASPAA', 'Pricing', 'Contact', 'Book a Demo'] },
    { title: 'Resources', links: ['Features', 'Security', 'FAQ', 'Sign in'] },
  ];
  return (
    <footer id="contact" className="bg-site-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <img src="../../assets/logo/caspaa-white.svg" alt="CASPAA" className="h-8 w-auto" />
          <p className="mt-4 text-sm text-slate-400 max-w-xs">{SITE.CONTACT.tagline}</p>
          <div className="mt-5 text-sm space-y-1">
            <p className="flex items-center gap-2"><Icon name="mail" className="w-4 h-4 shrink-0 text-accent-300" />
              <a className="hover:text-white" href={'mailto:' + SITE.CONTACT.email}>{SITE.CONTACT.email}</a></p>
            <p className="flex items-center gap-2"><Icon name="phone" className="w-4 h-4 shrink-0 text-accent-300" />
              {SITE.CONTACT.phones.join(' · ')}</p>
          </div>
        </div>
        {cols.map(c => (
          <div key={c.title}>
            <h4 className="text-white font-bold text-sm mb-3">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map(l => <li key={l}><a href="#" className="hover:text-white transition">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-5 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 CASPAA. All rights reserved.</p>
          <p>Built for African schools.</p>
        </div>
      </div>
    </footer>
  );
};
