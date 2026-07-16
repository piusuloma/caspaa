import Link from 'next/link'
import SiteLayout, {
  Eyebrow,
  Check,
  PrimaryButton,
  GhostButton,
} from '../../components/SiteLayout'
import { ROLES } from '../../data/site'

export async function getStaticPaths() {
  return {
    paths: ROLES.map((r) => ({ params: { role: r.slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const index = ROLES.findIndex((r) => r.slug === params.role)
  return { props: { index } }
}

export default function RolePage({ index }) {
  const role = ROLES[index]
  const others = ROLES.filter((_, i) => i !== index)

  return (
    <SiteLayout title={`For ${role.tab}`} description={`${role.headline} — ${role.body}`}>
      {/* Hero */}
      <section className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow light>FOR {role.name.toUpperCase()}</Eyebrow>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">{role.headline}</h1>
            <p className="mt-5 text-lg text-brand-100 max-w-xl">{role.body}</p>
            <p className="mt-5 text-accent-300 font-semibold italic">{role.punch}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton href="/contact">Book a Free Demo</PrimaryButton>
              <GhostButton href="/pricing" light>See Pricing →</GhostButton>
            </div>
          </div>
          <div className="lg:pl-6">
            <div className="rounded-3xl bg-navy-600 p-8 ring-1 ring-white/10">
              <p className="text-accent-400 font-bold text-sm mb-4">What {role.tab.toLowerCase()} get</p>
              <ul className="grid gap-3">
                {role.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <Check className="text-accent-400" />
                    <span className="text-sm text-white/90">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature detail cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>EVERYTHING IN ONE PLACE</Eyebrow>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built around what {role.tab.toLowerCase()} actually do.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {role.bullets.map((b) => (
              <div key={b} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-brand-50 grid place-items-center">
                  <Check className="text-brand-600" />
                </span>
                <p className="mt-4 font-semibold text-slate-900">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore other roles */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center mb-8">
            Explore CASPAA for every role
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((r) => (
              <Link
                key={r.slug}
                href={`/solutions/${r.slug}`}
                className="rounded-2xl bg-white ring-1 ring-slate-100 p-5 hover:shadow-md hover:ring-brand-200 transition"
              >
                <p className="font-bold text-slate-900">For {r.tab}</p>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.headline}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-navy-600">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-600 text-white">
        <div className="max-w-5xl mx-auto px-5 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to see it in action?</h2>
          <p className="mt-3 text-brand-100">Book a free demo tailored to your school.</p>
          <PrimaryButton href="/contact" className="mt-6">Book Your Free Demo</PrimaryButton>
        </div>
      </section>
    </SiteLayout>
  )
}
