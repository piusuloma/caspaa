import { NextResponse } from 'next/server'

/* ============================================================
   HOST-BASED ROUTING — corporate marketing vs. per-school workspaces.

   Target structure (activates once the domains are connected in Vercel):
     caspaa.org / www.caspaa.org  → marketing site (root = /home)
                                     "Sign In" = /signin workspace finder
     <school>.caspaa.org          → that school's CASPAA (the SPA + its login)
                                     e.g. brightlights.caspaa.org

   The corporate site never hosts the real login. Its "Sign In" is a WORKSPACE
   FINDER (/signin) that sends people to their own school's address, where the
   per-school login lives. (Slack / Classe365 / PowerSchool pattern.)

   Interim (before the custom domain is connected), on *.vercel.app:
     root "/" is the app, marketing lives at /home, /signin renders the finder
     (which falls back to "/" since subdomains don't exist yet). Nothing breaks.
   ============================================================ */

const MARKETING_HOSTS = ['caspaa.org', 'www.caspaa.org']
const MARKETING_ORIGIN = 'https://caspaa.org'
const MARKETING_PATHS = ['/home', '/pricing', '/contact']

const isMarketingApex = (host) => MARKETING_HOSTS.includes(host)
// Any subdomain of caspaa.org that isn't the marketing apex is a school workspace.
const isSchoolHost = (host) => host.endsWith('.caspaa.org') && !isMarketingApex(host)
const isMarketingPath = (p) => MARKETING_PATHS.includes(p) || p.startsWith('/solutions')

export function middleware(req) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0]
  const { pathname } = req.nextUrl

  // 1) Workspace finder — corporate/marketing surface only. On a school
  //    subdomain you're already at a school, so go straight to its login.
  if (pathname === '/signin') {
    if (isSchoolHost(host)) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next() // render the finder on caspaa.org + interim hosts
  }

  // 2) Legacy/direct login entry → route to the right place.
  if (pathname === '/login') {
    if (isSchoolHost(host)) return NextResponse.redirect(new URL('/', req.url)) // school portal login
    return NextResponse.redirect(new URL('/signin', req.url)) // corporate/interim → finder
  }

  // 3) Marketing apex: the root shows the marketing home.
  if (isMarketingApex(host) && pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.rewrite(url)
  }

  // 4) School subdomain: keep marketing pages on the marketing domain.
  if (isSchoolHost(host) && isMarketingPath(pathname)) {
    return NextResponse.redirect(MARKETING_ORIGIN + pathname)
  }

  return NextResponse.next()
}

// Only run on routes that need host logic — never on static assets, the app's
// /js and /css, the service worker, or /_next.
export const config = {
  matcher: ['/', '/home', '/pricing', '/contact', '/login', '/signin', '/solutions/:path*'],
}
