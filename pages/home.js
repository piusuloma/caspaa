import { useState } from 'react'
import Link from 'next/link'
import SiteLayout, {
  Eyebrow,
  Check,
  PrimaryButton,
  GhostButton,
} from '../components/SiteLayout'
import SlotImage, { SlotBackdrop } from '../components/SlotImage'
import Icon from '../components/Icons'
import {
  HERO,
  METRICS,
  PROBLEMS,
  PLATFORM_TILES,
  ROLES,
  FEATURE_DEEPDIVES,
  COMPARISON,
  ADVANTAGES,
  OUTCOMES,
  STEPS,
  SECURITY,
  FAQ,
} from '../data/site'

// --- An inline, on-brand dashboard mockup so the hero looks premium
//     without depending on external image assets. ---
function DashboardMock() {
  const tiles = [
    { label: 'OUTSTANDING FEES', value: '₦2,982,200', sub: '12 students owing' },
    { label: 'PAYMENT RECEIVED', value: '₦3,613,800', sub: '7 paid in full' },
    { label: 'FEE COLLECTION', value: '55%', sub: 'of ₦6.6m billed' },
    { label: 'ATTENDANCE TODAY', value: '92%', sub: 'across 19 classes' },
  ]
  return (
    <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 h-9 bg-slate-100 border-b border-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-[11px] text-slate-400 font-medium">app.caspaa.org</span>
      </div>
      <div className="p-4 bg-slate-50">
        <div className="rounded-xl bg-navy-600 text-white p-4 mb-3">
          <p className="text-[11px] text-brand-100">Welcome back,</p>
          <p className="text-lg font-bold">Akande</p>
          <p className="text-[11px] text-brand-100">Bright Lights Academy · 1st Term 2025/26</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold tracking-wide text-slate-400">{t.label}</p>
              <p className="text-base font-extrabold text-slate-800 mt-1">{t.value}</p>
              <p className="text-[10px] text-brand-600 mt-0.5">{t.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <p className="text-[9px] font-bold tracking-wide text-slate-400 mb-2">ENROLMENT BY GENDER</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-[6px] border-brand-500 border-r-pink-400 border-b-pink-400" />
            <div className="flex-1 text-[11px] text-slate-500">
              <div className="flex justify-between"><span>Boys</span><span className="font-bold text-slate-700">10</span></div>
              <div className="flex justify-between"><span>Girls</span><span className="font-bold text-slate-700">9</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`py-24 md:py-32 scroll-mt-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-5">{children}</div>
    </section>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-600 text-white">
      <SlotBackdrop src="/images/hero-backdrop.jpg" opacity="opacity-15" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-navy-400/30 blur-3xl" />
      <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-accent-600/10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-5 pt-36 pb-20 md:pt-44 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div data-reveal><Eyebrow light>{HERO.eyebrow}</Eyebrow></div>
          <h1 data-reveal data-reveal-delay="1" className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight">
            {HERO.title}
          </h1>
          <p data-reveal data-reveal-delay="2" className="mt-5 text-lg text-brand-100 max-w-xl">{HERO.subtitle}</p>
          <div data-reveal data-reveal-delay="3" className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton href="/contact">Book a Free Demo</PrimaryButton>
            <GhostButton href="/pricing" light>See Pricing →</GhostButton>
          </div>
          <p data-reveal data-reveal-delay="4" className="mt-5 text-sm text-brand-200">{HERO.microtrust}</p>
        </div>
        <div className="lg:pl-6 mkt-lift" data-reveal="right" data-reveal-delay="2">
          <DashboardMock />
        </div>
      </div>
    </section>
  )
}

function TrustBar() {
  return (
    <section className="bg-brand-50 border-y border-brand-100">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <p className="text-center text-xs font-bold tracking-[0.15em] text-brand-600 mb-6">
          TRUSTED BY FORWARD-THINKING AFRICAN SCHOOLS
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 max-w-3xl mx-auto">
          {METRICS.map((m, i) => (
            <div key={m.label} className="text-center" data-reveal data-reveal-delay={String((i % 4) + 1)}>
              <p className="text-3xl font-extrabold text-navy-600">{m.value}</p>
              <p className="text-xs text-slate-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div data-reveal>
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
        <SlotImage
          src="/images/problem.jpg"
          alt="Paper forms being filled in beside a keyboard"
          label="Problem — paperwork"
          size="1200×800"
          ratio="aspect-[3/2]"
          className="shadow-lg mkt-lift"
          data-reveal="right"
        />
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((p, i) => (
          <div key={p.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mkt-card" data-reveal data-reveal-delay={String((i % 4) + 1)}>
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-navy-600 grid place-items-center">
              <Icon name={p.icon} className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-bold text-slate-900">{p.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{p.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xl font-bold text-navy-600" data-reveal>There’s a better way to run a school.</p>
    </Section>
  )
}

function Solution() {
  return (
    <Section id="features" className="bg-slate-50">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div data-reveal="left">
          <Eyebrow>THE SOLUTION</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            One platform for every part of your school.
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            From school operations, payments and financing to attendance, learning, CBT and engagement — CASPAA is a
            unified operating system that replaces the many different tools your school is using right now.
          </p>
          <PrimaryButton href="/solutions/proprietors" className="mt-8">Explore the platform →</PrimaryButton>
        </div>
        <SlotImage
          src="/images/solution.jpg"
          alt="CASPAA in use at a school"
          label="Solution — wide shot"
          size="1200×800 · school office or classroom"
          ratio="aspect-[3/2]"
          className="shadow-lg mkt-lift"
          data-reveal="right"
        />
      </div>
    </Section>
  )
}

function PlatformMarquee() {
  // The list is rendered twice as ONE flat run of cards. The track shifts by
  // exactly the width of the first copy, so copy two arrives where copy one
  // began and the loop never seams. The halves must stay structurally
  // identical — wrapping either one would break that measurement.
  const run = [...PLATFORM_TILES, ...PLATFORM_TILES]
  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="marquee">
        <div className="marquee-track">
          {run.map((t, i) => {
            const dup = i >= PLATFORM_TILES.length
            return (
              <div
                key={`${t.title}-${i}`}
                aria-hidden={dup || undefined}
                className="group w-[360px] shrink-0 rounded-2xl bg-white p-7 ring-1 ring-slate-200 shadow-sm transition-colors duration-300 hover:bg-navy-600"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-navy-600 grid place-items-center transition-colors duration-300 group-hover:bg-white/10 group-hover:text-accent-400">
                  <Icon name={t.icon} className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-white">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 transition-colors duration-300 group-hover:text-white">
                  {t.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Roles() {
  const [active, setActive] = useState(0)
  const role = ROLES[active]
  return (
    <Section id="roles">
      <div className="text-center max-w-2xl mx-auto" data-reveal>
        <Eyebrow>BUILT FOR YOUR WHOLE SCHOOL</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Every role gets a purpose-built experience.
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Proprietors, principals, teachers, parents, students and finance teams each get a workspace designed around
          what they actually do.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {ROLES.map((r, i) => (
          <button
            key={r.slug}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              i === active ? 'bg-navy-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {r.tab}
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-3xl bg-navy-600 text-white p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-accent-400 font-bold text-sm">{role.name}</p>
          <h3 className="mt-2 text-2xl md:text-3xl font-extrabold">{role.headline}</h3>
          <p className="mt-4 text-brand-100">{role.body}</p>
          <p className="mt-5 text-accent-300 font-semibold italic">{role.punch}</p>
          <GhostButton href={`/solutions/${role.slug}`} light className="mt-6">
            Learn more →
          </GhostButton>
        </div>
        <SlotImage
          key={role.slug}
          src={`/images/roles/${role.slug}.jpg`}
          alt={role.name}
          label={`Role — ${role.tab}`}
          size="900×600 · person in context"
          ratio="aspect-[3/2]"
          dark
          className="shadow-xl"
        />
      </div>
    </Section>
  )
}

function FeatureDeepDives() {
  return (
    <Section className="bg-slate-50">
      <div className="space-y-16">
        {FEATURE_DEEPDIVES.map((f, i) => (
          <div key={f.title} className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 ? 'lg:[&>div:first-child]:order-2' : ''}`}>
            <div data-reveal={i % 2 ? "right" : "left"}>
              <Eyebrow>{f.eyebrow}</Eyebrow>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{f.title}</h3>
              <p className="mt-4 text-slate-600">{f.body}</p>
              <div className="mt-5 inline-flex items-center gap-2 bg-brand-50 text-navy-600 rounded-full px-4 py-2 text-sm font-bold">
                {f.stat}
              </div>
            </div>
            <SlotImage
              src={`/images/features/feature-${i + 1}.jpg`}
              alt={f.title}
              label={`Feature ${i + 1} — ${f.eyebrow}`}
              size="1000×640"
              ratio="aspect-[25/16]"
              className="shadow-lg mkt-lift"
              data-reveal={i % 2 ? "left" : "right"}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

function Comparison() {
  return (
    <Section>
      <div className="text-center max-w-2xl mx-auto" data-reveal>
        <Eyebrow>WHY SCHOOLS ARE SWITCHING</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          A regular SMS manages records. CASPAA runs your school.
        </h2>
      </div>
      <div className="mt-10 max-w-4xl mx-auto overflow-hidden rounded-2xl ring-1 ring-slate-200" data-reveal="scale">
        <div className="grid grid-cols-2 text-sm font-bold">
          <div className="p-4 bg-slate-100 text-slate-500">Regular School Management System</div>
          <div className="p-4 bg-navy-600 text-white">CASPAA School Operating System</div>
        </div>
        {COMPARISON.map((row, i) => (
          <div key={row[0]} className={`grid grid-cols-2 text-sm ${i % 2 ? 'bg-white' : 'bg-slate-50'}`}>
            <div className="p-4 text-slate-500 border-t border-slate-100">{row[0]}</div>
            <div className="p-4 text-slate-800 font-semibold border-t border-brand-100 bg-brand-50/40 flex items-center gap-2">
              <Check /> {row[1]}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <GhostButton href="/pricing">See the full feature list →</GhostButton>
      </div>
    </Section>
  )
}

function Advantages() {
  return (
    <Section className="bg-navy-600 text-white">
      <div className="text-center max-w-2xl mx-auto" data-reveal>
        <Eyebrow light>OUR UNIQUE ADVANTAGES</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Everything a modern school needs, in one system.
        </h2>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {ADVANTAGES.map((a, i) => (
          <div key={a} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3" data-reveal data-reveal-delay={String((i % 6) + 1)}>
            <Check className="text-accent-400" />
            <span className="text-sm text-white/90">{a}</span>
          </div>
        ))}
      </div>
      <p className="text-center mt-10 text-xl font-bold text-accent-400" data-reveal>
        Smart schools run on systems. Great schools run on CASPAA.
      </p>
    </Section>
  )
}

function Outcomes() {
  return (
    <Section id="why">
      <div className="text-center max-w-2xl mx-auto" data-reveal>
        <Eyebrow>THE FUTURE OF SCHOOL OPERATIONS IS HERE</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          What changes when you run on CASPAA.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OUTCOMES.map((o, i) => (
          <div key={o.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md mkt-card" data-reveal data-reveal-delay={String((i % 3) + 1)}>
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-navy-600 grid place-items-center">
              <Icon name={o.icon} className="w-5 h-5" />
            </div>
            <h3 className="mt-3 font-bold text-slate-900">{o.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{o.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Onboarding() {
  return (
    <Section className="bg-slate-50">
      <div className="text-center max-w-2xl mx-auto" data-reveal>
        <Eyebrow>GO LIVE IN DAYS, NOT MONTHS</Eyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          From sign-up to fully running — we handle the heavy lifting.
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.n} className="relative rounded-2xl bg-white p-6 ring-1 ring-slate-100 mkt-card" data-reveal data-reveal-delay={String((i % 4) + 1)}>
            <div className="w-10 h-10 rounded-full bg-navy-600 text-white grid place-items-center font-extrabold">{s.n}</div>
            <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="text-center mt-8 text-sm text-slate-500">
        Dedicated onboarding, live chat and 24/7 client support at every step.
      </p>
    </Section>
  )
}

function Security() {
  return (
    <Section id="security">
      <div className="relative overflow-hidden rounded-3xl bg-navy-600 text-white p-8 md:p-12" data-reveal="scale">
        <SlotBackdrop src="/images/security.jpg" opacity="opacity-20" />
        <div className="relative max-w-2xl">
          <Eyebrow light>BUILT ON TRUST</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Bank-grade security for your school’s most sensitive data.
          </h2>
          <p className="mt-4 text-brand-100">
            Student records and payment data are protected end-to-end. CASPAA uses secure payment infrastructure,
            encrypted data handling, and role-based access so the right people see the right things — and nothing more.
          </p>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-3">
          {SECURITY.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm font-semibold">
              <Icon name={s.icon} className="w-4 h-4 text-accent-400" /> {s.label}
            </span>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <Section id="faq" className="bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center" data-reveal>
          <Eyebrow>QUESTIONS, ANSWERED</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently asked questions.
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden" data-reveal data-reveal-delay={String((i % 5) + 1)}>
              <button
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-slate-900"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {f.q}
                <span className="text-brand-600 text-xl shrink-0">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <p className="px-5 pb-5 -mt-1 text-slate-600 text-sm slide-up">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-600 text-white">
      <SlotBackdrop src="/images/cta-backdrop.jpg" opacity="opacity-15" />
      <div className="relative max-w-5xl mx-auto px-5 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" data-reveal>
          Ready to run your school the modern way?
        </h2>
        <p className="mt-4 text-lg text-brand-100 max-w-2xl mx-auto" data-reveal data-reveal-delay="1">
          Join the schools transforming how they operate, collect fees and engage parents — online and offline. See
          CASPAA on your own workflows in a free, no-obligation demo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3" data-reveal data-reveal-delay="2">
          <PrimaryButton href="/contact">Book Your Free Demo</PrimaryButton>
          <GhostButton href="/contact" light>Talk to Sales — 0803 201 1561</GhostButton>
        </div>
        <p className="mt-6 text-accent-400 font-bold" data-reveal data-reveal-delay="3">Smart schools run on systems. Great schools run on CASPAA.</p>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <TrustBar />
      <Problem />
      <Solution />
      <PlatformMarquee />
      <Roles />
      <FeatureDeepDives />
      <Comparison />
      <Advantages />
      <Outcomes />
      <Onboarding />
      <Security />
      <Faq />
      <FinalCta />
    </SiteLayout>
  )
}
