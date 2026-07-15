import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Logo, Check } from '../components/SiteLayout'
import { CONTACT } from '../data/site'

// The marketing-site login reuses the app's own client-side auth
// (public/js/data.js + auth.js). Those are classic scripts: function
// declarations (resolveLogin, routeLoginIdentifier) land on window, but
// top-level `const DB`/`SESSION_KEY` do not — so after loading we inject a
// tiny bridge to expose them. On success we write the same session object the
// app writes, then hand off to "/" where the app boots straight to the dashboard.
const SESSION_KEY = 'caspaa_session_v1'

const TABS = [
  { key: 'staff', label: 'School / Staff', idLabel: 'Work email', idPh: 'you@yourschool.ng', idType: 'email' },
  { key: 'parent', label: 'Parent', idLabel: 'Email or phone', idPh: 'you@email.com · +234…', idType: 'text' },
  { key: 'student', label: 'Student', idLabel: 'Admission number', idPh: 'e.g. BL/2025/001', idType: 'text' },
]

const PANEL_POINTS = [
  'Live revenue, fees & attendance at a glance',
  'Works online and fully offline',
  'One secure login for your whole school',
]

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.onload = resolve
    el.onerror = reject
    document.body.appendChild(el)
  })
}

export default function LoginPage() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('staff')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const active = TABS.find((t) => t.key === tab)

  // Load the app's auth layer once, then bridge the const-scoped globals.
  useEffect(() => {
    if (window.__caspaaAuthReady) { setReady(true); return }
    if (window.__caspaaAuthLoading) return
    window.__caspaaAuthLoading = true
    ;(async () => {
      try {
        await loadScript('/js/data.js')
        await loadScript('/js/auth.js')
        const bridge = document.createElement('script')
        bridge.textContent =
          'try{window.DB=DB;window.SESSION_KEY=SESSION_KEY;' +
          'window.resolveLogin=resolveLogin;window.routeLoginIdentifier=routeLoginIdentifier;}catch(e){}'
        document.body.appendChild(bridge)
        window.__caspaaAuthReady = true
        setReady(true)
      } catch (e) {
        setError('Could not load sign-in. Please refresh the page.')
      }
    })()
  }, [])

  const finish = (user) => {
    try {
      const key = window.SESSION_KEY || SESSION_KEY
      sessionStorage.setItem(key, JSON.stringify(user))
    } catch (e) {}
    setBusy(true)
    window.location.href = '/'
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!ready || typeof window.resolveLogin !== 'function') {
      setError('Sign-in is still loading — please try again in a moment.')
      return
    }

    // Student flow: admission number + date of birth.
    if (tab === 'student') {
      const route = window.routeLoginIdentifier(identifier)
      if (!route || route.kind !== 'student') {
        setError('No student found with that admission number.')
        return
      }
      if (!dob) { setError('Please enter your date of birth.'); return }
      const student = route.student
      if (student.dob !== dob) {
        setError("That date of birth doesn't match our records.")
        return
      }
      const DB = window.DB
      const cls = DB.find('classes', student.classId)
      const schoolName = (DB.settings().schoolName) || 'School'
      const isSecondary = cls && cls.level === 'Secondary'
      finish({
        id: student.id, role: 'student', name: student.name, email: student.email || '',
        title: 'Student', subtitle: `${cls ? cls.name : ''} — ${schoolName}`,
        schoolId: student.schoolId, firstLogin: isSecondary && !student.passwordChanged,
      })
      return
    }

    // Staff / parent flow: identifier + password.
    const res = window.resolveLogin(identifier, password)
    if (!res || !res.user) { setError('No account found with those details.'); return }
    if (!res.ok) { setError('Incorrect password. Demo accounts use “demo1234”.'); return }
    if (res.acceptInvite) { try { res.acceptInvite() } catch (e) {} }
    finish(res.user)
  }

  const useDemo = () => {
    setTab('staff')
    setIdentifier('admin@brightlights.ng')
    setPassword('demo1234')
    setError('')
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 ' +
    'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition'

  return (
    <>
      <Head>
        <title>School Login — CASPAA</title>
        <meta name="description" content="Sign in to your CASPAA school operating system." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen grid lg:grid-cols-2 bg-white text-slate-800">
        {/* Brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between bg-brand-900 text-white p-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-700/40 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="relative">
            <Logo light />
          </div>
          <div className="relative">
            <h1 className="text-3xl font-extrabold leading-tight">Sign in to your school’s operating system.</h1>
            <p className="mt-4 text-brand-100 max-w-sm">
              One secure place to run admissions, fees, attendance, results and communication — online or offline.
            </p>
            <ul className="mt-8 space-y-3">
              {PANEL_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-brand-50">
                  <Check className="text-gold-400" /> <span className="text-sm">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-brand-200">Smart schools run on systems. Great schools run on CASPAA.</p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
            <Link href="/home" className="text-sm font-semibold text-slate-500 hover:text-brand-700">← Back to site</Link>
            <div className="lg:hidden"><Logo /></div>
            <Link href="/contact" className="text-sm font-semibold text-brand-700 hover:underline">Book a demo</Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Choose how you’re signing in.</p>

              {/* Role tabs */}
              <div className="mt-6 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setTab(t.key); setError('') }}
                    className={`py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      tab === t.key ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{active.idLabel}</label>
                  <input
                    type={active.idType}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputCls}
                    placeholder={active.idPh}
                    autoComplete="username"
                    required
                  />
                </div>

                {tab === 'student' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} required />
                    <p className="mt-1.5 text-xs text-slate-400">Sign in with your admission number, then your date of birth.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-600">Password</label>
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-xs text-brand-700 font-semibold">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-brand-900 font-bold text-sm shadow-lg transition disabled:opacity-60"
                >
                  {busy ? 'Signing you in…' : ready ? 'Sign in' : 'Loading…'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button type="button" onClick={useDemo} className="text-slate-500 hover:text-brand-700 font-medium">
                  Try the demo school
                </button>
                <Link href="/contact" className="text-brand-700 font-semibold hover:underline">
                  Register your school →
                </Link>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400">
                Trouble signing in? Email{' '}
                <a className="text-brand-700 font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
