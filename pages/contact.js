import { useState } from 'react'
import SiteLayout, { Eyebrow, Check } from '../components/SiteLayout'
import { CONTACT, STEPS } from '../data/site'

const PLANS = ['Standard', 'Premium', 'Ultimate', 'Not sure yet']

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    students: '',
    plan: 'Not sure yet',
    message: '',
  })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    // No backend yet — surface a mailto so the enquiry actually reaches CASPAA.
    const body = encodeURIComponent(
      `Name: ${form.name}\nSchool: ${form.school}\nEmail: ${form.email}\nPhone: ${form.phone}\n` +
        `Students: ${form.students}\nPlan: ${form.plan}\n\n${form.message}`
    )
    const subject = encodeURIComponent(`Demo request — ${form.school || form.name}`)
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  const field = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition'

  return (
    <SiteLayout title="Book a Demo" description="Book a free CASPAA demo or talk to our team about your school.">
      <section className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow light>GET STARTED</Eyebrow>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              See CASPAA on your school’s own workflows.
            </h1>
            <p className="mt-4 text-lg text-brand-100 max-w-lg">
              Book a free, no-obligation demo. We’ll show you exactly how CASPAA handles your fees, attendance,
              admissions and reporting — online and offline.
            </p>
            <div className="mt-8 space-y-4">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-gold-500 text-navy-600 grid place-items-center text-sm font-extrabold shrink-0">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-brand-200">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-sm text-brand-100 space-y-1">
              <p>📧 <a className="underline hover:text-white" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
              <p>📞 {CONTACT.phones.join(' · ')}</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl p-7 md:p-8 shadow-2xl text-slate-800">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-brand-50 grid place-items-center mx-auto">
                  <Check className="text-brand-600" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-slate-900">Thanks — your request is ready to send.</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your email app should have opened with the details filled in. If it didn’t, email us directly at{' '}
                  <a className="text-navy-600 font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
                </p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-navy-600 hover:underline">
                  ← Edit your request
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900">Book a free demo</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full name*</label>
                    <input required value={form.name} onChange={update('name')} className={field} placeholder="Jane Akande" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">School name*</label>
                    <input required value={form.school} onChange={update('school')} className={field} placeholder="Bright Lights Academy" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email*</label>
                    <input required type="email" value={form.email} onChange={update('email')} className={field} placeholder="you@school.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone*</label>
                    <input required value={form.phone} onChange={update('phone')} className={field} placeholder="0803 000 0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. of students</label>
                    <input value={form.students} onChange={update('students')} className={field} placeholder="e.g. 250" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plan of interest</label>
                    <select value={form.plan} onChange={update('plan')} className={field}>
                      {PLANS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Anything else?</label>
                  <textarea value={form.message} onChange={update('message')} rows={3} className={field} placeholder="Tell us about your school…" />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-600 font-bold text-sm shadow-lg transition"
                >
                  Request my demo
                </button>
                <p className="text-xs text-slate-400 text-center">
                  By submitting, you agree to be contacted about CASPAA. No spam, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
