import { useEffect } from 'react'
import Head from 'next/head'

const APP_SCRIPTS = [
  '/js/data.js',
  '/js/ui.js',
  '/js/auth.js',
  '/js/modules/admin.js',
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
  '/js/app.js',
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

export default function Home() {
  useEffect(() => {
    if (window.__CASPAA_LOADED) return
    window.__CASPAA_LOADED = true
    ;(async () => {
      for (const src of APP_SCRIPTS) {
        await loadScript(src)
      }
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
