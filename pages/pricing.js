import SiteLayout, {
  Eyebrow,
  Check,
  PrimaryButton,
  GhostButton,
} from '../components/SiteLayout'
import { PRICING, PRICING_NOTES, COMPARISON, FAQ, CONTACT } from '../data/site'

function PlanCard({ plan }) {
  const highlight = plan.popular
  const gold = plan.gold
  return (
    <div
      className={`relative rounded-3xl p-7 flex flex-col ${
        highlight
          ? 'bg-navy-600 text-white ring-2 ring-gold-500 shadow-2xl lg:-translate-y-3'
          : gold
          ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-navy-600 shadow-xl'
          : 'bg-white text-slate-800 ring-1 ring-slate-200 shadow-sm'
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-navy-600 text-xs font-extrabold px-3 py-1 rounded-full shadow">
          MOST POPULAR
        </span>
      )}
      <h3 className={`text-lg font-extrabold ${gold ? 'text-navy-600' : highlight ? 'text-white' : 'text-slate-900'}`}>
        {plan.name}
      </h3>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-4xl font-extrabold">{plan.price}</span>
      </div>
      <p className={`text-sm mt-1 ${highlight ? 'text-brand-100' : gold ? 'text-navy-600' : 'text-slate-500'}`}>
        {plan.unit}
      </p>
      <p className={`mt-4 text-sm font-medium ${highlight ? 'text-brand-100' : gold ? 'text-navy-600' : 'text-slate-600'}`}>
        {plan.tagline}
      </p>

      <div className="mt-6">
        {plan.cta === 'Talk to Sales' ? (
          <GhostButton href="/contact" className={`w-full ${gold ? '!text-navy-600 !border-navy-600/30 hover:!bg-navy-600/10' : ''}`}>
            {plan.cta}
          </GhostButton>
        ) : (
          <PrimaryButton href="/contact" className="w-full">{plan.cta}</PrimaryButton>
        )}
      </div>

      {plan.inherits && (
        <p className={`mt-6 text-sm font-bold ${highlight ? 'text-gold-300' : 'text-navy-600'}`}>
          {plan.inherits}
        </p>
      )}
      <ul className="mt-4 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={gold ? 'text-navy-600' : highlight ? 'text-gold-400' : 'text-brand-600'} />
            <span className={highlight ? 'text-white/90' : gold ? 'text-navy-600' : 'text-slate-700'}>{f}</span>
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
      <section className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20 text-center">
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

      {/* Notes */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">IMPORTANT NOTES</h3>
            <ul className="mt-3 space-y-2">
              {PRICING_NOTES.map((n) => (
                <li key={n} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-gold-600 mt-0.5">•</span> {n}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-600">
              Need help choosing?{' '}
              <a className="text-navy-600 font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>{' '}
              · {CONTACT.phones.join(' · ')}
            </p>
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
          <div className="space-y-4">
            {FAQ.slice(0, 4).map((f) => (
              <div key={f.q} className="rounded-xl bg-white ring-1 ring-slate-100 p-5">
                <p className="font-semibold text-slate-900">{f.q}</p>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <PrimaryButton href="/contact">Book a Free Demo</PrimaryButton>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
