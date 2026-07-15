import { NextResponse } from 'next/server'

/* ============================================================
   HOST-BASED ROUTING — the standard "marketing vs. app" split.

   Target structure (activates automatically once the domains are
   connected in Vercel):
     caspaa.org / www.caspaa.org  → marketing site (root = /home)
     app.caspaa.org               → the operating system (the SPA + its login)

   Interim (before the custom domain is connected), on *.vercel.app:
     root "/" stays the app, marketing lives at /home — nothing breaks.

   In all cases the marketing "Sign In" points at /login, which this
   middleware redirects to the operating system's own login — never an
   inline form on the marketing site. That is the Edves / PowerSchool model:
   the marketing site sells, the application authenticates.
   ============================================================ */

const MARKETING_HOSTS = ['caspaa.org', 'www.caspaa.org']
const APP_ORIGIN = 'https://app.caspaa.org'
const MARKETING_ORIGIN = 'https://caspaa.org'

// Paths that belong to the marketing site (used to bounce them off the app host).
const MARKETING_PATHS = ['/home', '/pricing', '/contact']

const isAppHost = (host) => host.startsWith('app.')
const isMarketingApex = (host) => MARKETING_HOSTS.includes(host)
const isMarketingPath = (p) => MARKETING_PATHS.includes(p) || p.startsWith('/solutions')

export function middleware(req) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0]
  const { pathname } = req.nextUrl

  // 1) Sign-in entry point → always the operating system's own login.
  if (pathname === '/login' || pathname === '/signin') {
    if (isAppHost(host)) return NextResponse.redirect(new URL('/', req.url))
    if (isMarketingApex(host)) return NextResponse.redirect(APP_ORIGIN + '/')
    // Interim host (vercel.app / previews): the app lives at "/" on this host.
    return NextResponse.redirect(new URL('/', req.url))
  }

  // 2) Marketing apex: the root shows the marketing home.
  if (isMarketingApex(host) && pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.rewrite(url)
  }

  // 3) App subdomain: keep marketing pages on the marketing domain.
  if (isAppHost(host) && isMarketingPath(pathname)) {
    return NextResponse.redirect(MARKETING_ORIGIN + pathname)
  }

  return NextResponse.next()
}

// Only run on the routes that need host logic — never on static assets,
// the app's /js and /css, the service worker, or /_next.
export const config = {
  matcher: ['/', '/home', '/pricing', '/contact', '/login', '/signin', '/solutions/:path*'],
}
