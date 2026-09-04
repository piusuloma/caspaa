import { useEffect } from 'react'
import Head from 'next/head'

const APP_SCRIPTS = [
  '/js/data.js',
  '/js/ui.js',
  '/js/auth.js',
  '/js/modules/admin.js',
  '/js/modules/frontdesk.js',
  '/js/modules/teacher.js',
  '/js/modules/parent.js',
  '/js/modules/finance.js',
  '/js/modules/superadmin.js',
  '/js/modules/student.js',
  '/js/modules/shared.js',
  '/js/modules/calendar.js',
  '/js/modules/diary.js',
  '/js/modules/houses.js',
  '/js/modules/payslip.js',
  '/js/modules/feedback.js',
  '/js/modules/formative.js',
  '/js/modules/transport.js',
  '/js/modules/health.js',
  '/js/modules/assessments.js',
  '/js/modules/payment.js',
  '/js/modules/notify.js',
  '/js/modules/inventory.js',
  '/js/modules/ledger.js',
  '/js/modules/entitlements.js',
  '/js/modules/group.js',
  '/js/app.js',
]

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src + '?v=' + Date.now()
    el.onload = resolve
    el.onerror = reject
    document.body.appendChild(el)
  })
}

function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  // Only register on http(s); file:// and unsupported contexts are skipped.
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return
  // Only run the SW in production builds — this avoids any stale-cache
  // headaches during `npm run dev`. It's active on Vercel and `npm run start`.
  if (process.env.NODE_ENV !== 'production') return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err)
    })
  })
}

// Reflect real connectivity in the shared #connStatus pill and expose a flag
// the app can read (replaces the old simulated offline toggle).
function wireConnectivityStatus() {
  const render = () => {
    const online = navigator.onLine
    window.__caspaaOnline = online
    const el = document.getElementById('connStatus')
    if (!el) return
    const dot = el.querySelector('.rounded-full')
    const label = el.querySelector('.text-label')
    if (online) {
      el.classList.add('hidden')
    } else {
      el.classList.remove('hidden')
      const box = el.firstElementChild
      if (box) box.className = 'px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 bg-amber-500 text-white'
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-white'
      if (label) label.textContent = "You're offline — showing saved data"
    }
  }
  window.addEventListener('online', render)
  window.addEventListener('offline', render)
  render()
}

// Capture the install prompt so the app can offer "Install app" on demand.
function wireInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.__caspaaInstallPrompt = e
  })
}

export default function Home() {
  useEffect(() => {
    if (window.__CASPAA_LOADED) return
    window.__CASPAA_LOADED = true
    registerServiceWorker()
    wireInstallPrompt()
    ;(async () => {
      for (const src of APP_SCRIPTS) {
        await loadScript(src)
      }
      wireConnectivityStatus()
    })()
  }, [])

  return (
    <>
      <Head>
        <title>CASPAA — School Operating System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div id="connStatus" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 hidden">
        <div className="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full"></span>
          <span className="text-label"></span>
        </div>
      </div>

      <div id="toasts" className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"></div>

      <div id="modalRoot"></div>

      <div id="app"></div>
    </>
  )
}
