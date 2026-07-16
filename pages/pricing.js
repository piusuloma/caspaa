import { useState } from 'react'
import SiteLayout, {
  Eyebrow,
  Check,
  PrimaryButton,
  GhostButton,
} from '../components/SiteLayout'
import Icon from '../components/Icons'
import { SlotBackdrop } from '../components/SlotImage'
import { PRICING, PRICING_NOTES, COMPARISON, FAQ, CONTACT } from '../data/site'

function PricingFaq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-3">
      {FAQ.slice(0, 4).map((f, i) => (
        <div
          key={f.q}
          className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden"
          data-reveal
          data-reveal-delay={String((i % 4) + 1)}
        >
          <button
            className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-slate-900"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
          >
            {f.q}
            <span className="text-brand-600 text-xl shrink-0 leading-none">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <p className="px-5 pb-5 -mt-1 text-slate-600 text-sm slide-up">{f.a}</p>}
        </div>
      ))}
    </div>
  )
}

function PlanCard({ plan }) {
  const highlight = plan.popular
  const gold = plan.gold
  return (
    <div
      className={`relative rounded-3xl p-7 flex flex-col ${
        highlight
          ? 'bg-navy-600 text-white ring-2 ring-accent-600 shadow-2xl lg:-translate-y-3'
          : gold
          ? 'bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-xl'
          : 'bg-white text-slate-800 ring-1 ring-slate-200 shadow-sm'
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow">
          MOST POPULAR
        </span>
      )}
      <h3 className={`text-lg font-extrabold ${gold || highlight ? 'text-white' : 'text-slate-900'}`}>
        {plan.name}
      </h3>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-4xl font-extrabold">{plan.price}</span>
      </div>
      <p className={`text-sm mt-1 ${highlight ? 'text-brand-100' : gold ? 'text-white/80' : 'text-slate-500'}`}>
        {plan.unit}
      </p>
      <p className={`mt-4 text-sm font-medium ${highlight ? 'text-brand-100' : gold ? 'text-white/90' : 'text-slate-600'}`}>
        {plan.tagline}
      </p>

      <div className="mt-6">
        {plan.cta === 'Talk to Sales' ? (
          <GhostButton href="/contact" className={`w-full ${gold ? '!text-white !border-white/40 hover:!bg-white/10' : ''}`}>
            {plan.cta}
          </GhostButton>
        ) : (
          <PrimaryButton href="/contact" className="w-full">{plan.cta}</PrimaryButton>
        )}
      </div>

      {plan.inherits && (
        <p className={`mt-6 text-sm font-bold ${highlight ? 'text-accent-300' : gold ? 'text-white' : 'text-navy-600'}`}>
          {plan.inherits}
        </p>
      )}
      <ul className="mt-4 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={gold ? 'text-white' : highlight ? 'text-accent-400' : 'text-brand-600'} />
            <span className={highlight || gold ? 'text-white/90' : 'text-slate-700'}>{f}</span>
          </li>
        ))}
      </ul>

      {plan.setup && (
        <div className={`mt-6 rounded-xl p-4 text-sm ${highlight ? 'bg-white/10' : 'bg-slate-50'}`}>
          <p className={`font-bold ${highlight ? 'text-white' : 'text-slate-800'}`}>One-off setup — {plan.setup.fee}</p>
          <p className={highlight ? 'text-brand-100' : 'text-slate-500'}>Includes {plan.setup.training}</p>
        </div>
      )}
    </div>
  )
}

export default function PricingPage() {
  return (
    <SiteLayout title="Pricing" description="Simple, per-student pricing that scales with your school. Standard, Premium and Ultimate plans.">
      {/* Header */}
      <section className="relative overflow-hidden bg-navy-600 text-white">
        <SlotBackdrop src="/images/hero-backdrop.jpg" opacity="opacity-15" />
        <div className="relative max-w-7xl mx-auto px-5 pt-32 pb-16 md:pt-36 md:pb-20 text-center">
          <Eyebrow light>SIMPLE, PER-STUDENT PRICING</Eyebrow>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Pricing that scales with your school.</h1>
          <p className="mt-4 text-lg text-brand-100 max-w-2xl mx-auto">
            Pay per student, per term. No hidden platform fees. Choose the plan that fits where your school is today —
            and upgrade as you grow.
          </p>
          <p className="mt-3 text-sm text-brand-200">Prices are per student, per term · VAT exclusive.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="-mt-10 pb-8">
        <div className="max-w-7xl mx-auto px-5 grid gap-6 lg:grid-cols-3 items-start">
          {PRICING.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>
      </section>

      {/* Notes — each note is its own card, so no one line hides in a bullet
          list, and the "need help" ask is lifted out into its own panel. */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-8" data-reveal>
            <Eyebrow>BEFORE YOU CHOOSE</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              The small print, in plain sight.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PRICING_NOTES.map((n, i) => (
              <div
                key={n}
                className="flex items-start gap-3 rounded-xl bg-white ring-1 ring-slate-200 p-4 mkt-card"
                data-reveal
                data-reveal-delay={String((i % 2) + 1)}
              >
                <span className="w-7 h-7 rounded-lg bg-brand-50 text-navy-600 grid place-items-center shrink-0">
                  <Icon name="info" className="w-4 h-4" />
                </span>
                <p className="text-sm text-slate-600 leading-snug">{n}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-6 rounded-2xl bg-navy-600 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
            data-reveal
          >
            <div>
              <p className="font-bold">Not sure which plan fits?</p>
              <p className="text-sm text-brand-100 mt-0.5">Tell us your size and we'll size the plan to it.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent-400 transition-colors"
              >
                <Icon name="mail" className="w-4 h-4 shrink-0 text-accent-400" />
                {CONTACT.email}
              </a>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Icon name="phone" className="w-4 h-4 shrink-0 text-accent-400" />
                {CONTACT.phones.join(' · ')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Full comparison */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-8">
            <Eyebrow>WHY SCHOOLS ARE SWITCHING</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              A regular SMS manages records. CASPAA runs your school.
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <div className="grid grid-cols-2 text-sm font-bold">
              <div className="p-4 bg-slate-100 text-slate-500">Regular SMS</div>
              <div className="p-4 bg-navy-600 text-white">CASPAA</div>
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
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-8">
            Pricing questions
          </h2>
          <PricingFaq />
          <div className="text-center mt-10">
            <PrimaryButton href="/contact">Book a Free Demo</PrimaryButton>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
