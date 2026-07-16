import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Logo, Check } from '../components/SiteLayout'
import { CONTACT } from '../data/site'

// Slugify a school name/address into a valid subdomain label.
function slug(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

// The corporate "Sign In" is a WORKSPACE FINDER, not a login. It routes the
// person to their school's own CASPAA address, where the real login lives.
// (Slack / Classe365 / PowerSchool pattern.) Until the custom domain is
// connected, on *.vercel.app it falls back to the app login at "/".
export default function SignInFinder() {
  const [sub, setSub] = useState('')
  const [err, setErr] = useState('')

  const go = (e) => {
    e.preventDefault()
    const s = slug(sub)
    if (!s || s.length < 2) {
      setErr("Enter your school's CASPAA address.")
      return
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : ''
    if (host.endsWith('caspaa.org')) {
      // Live domain → go to the school's own workspace.
      window.location.href = `https://${s}.caspaa.org`
    } else {
      // Interim (no custom domain yet) → the app login lives at "/" on this host.
      window.location.href = '/'
    }
  }

  const preview = slug(sub) || 'your-school'

  return (
    <>
      <Head>
        <title>Go to your school — CASPAA</title>
        <meta name="description" content="Find your school's CASPAA workspace and sign in." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen relative overflow-hidden bg-navy-600 text-white flex flex-col">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-navy-400/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-accent-600/10 blur-3xl" />

        <header className="relative z-10 max-w-6xl w-full mx-auto px-5 h-16 flex items-center justify-between">
          <Logo light />
          <Link href="/home" className="text-sm font-semibold text-brand-100 hover:text-white">← Back to site</Link>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-7 sm:p-8">
              <h1 className="text-2xl font-extrabold text-slate-900">Go to your school</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your school's CASPAA address to sign in. Students, parents and staff all sign in on their
                school's own page.
              </p>

              <form onSubmit={go} className="mt-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your school's CASPAA address</label>
                <div className="flex items-stretch">
                  <input
                    value={sub}
                    onChange={(e) => { setSub(e.target.value); setErr('') }}
                    className="flex-1 min-w-0 px-4 py-3 rounded-l-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="your-school"
                    autoCapitalize="none"
                    spellCheck="false"
                    autoFocus
                  />
                  <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 text-sm text-slate-500 whitespace-nowrap">
                    .caspaa.org
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  You'll go to <span className="font-semibold text-navy-600">{preview}.caspaa.org</span>
                </p>
                {err && <div className="mt-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{err}</div>}
                <button
                  type="submit"
                  className="mt-4 w-full py-3.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-navy-600 font-bold text-sm shadow-lg transition"
                >
                  Continue
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                <p className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="text-brand-600" />
                  <span>Installed the CASPAA app? Just open it — it works offline.</span>
                </p>
                <p className="text-sm text-slate-500">
                  New to CASPAA?{' '}
                  <Link href="/contact" className="text-navy-600 font-semibold hover:underline">Sign up your school →</Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-brand-200">
              Can't remember your school's address? Email{' '}
              <a className="underline hover:text-white" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
