import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { NAV_LINKS, CONTACT, ROLES } from '../data/site'

// Small, reusable brand mark (Africa-inspired ring).
export function Logo({ light = false }) {
  const text = light ? 'text-white' : 'text-brand-800'
  return (
    <Link href="/home" className="flex items-center gap-2 shrink-0">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white grid place-items-center font-extrabold shadow-md">
        C
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${text}`}>CASPAA</span>
    </Link>
  )
}

export function PrimaryButton({ href, children, className = '' }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-brand-900 font-bold text-sm shadow-lg shadow-gold-500/20 transition ${className}`}
    >
      {children}
    </Link>
  )
}

export function GhostButton({ href, children, light = false, className = '' }) {
  const base = light
    ? 'text-white border-white/30 hover:bg-white/10'
    : 'text-brand-800 border-brand-200 hover:bg-brand-50'
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition ${base} ${className}`}
    >
      {children}
    </Link>
  )
}

export function Eyebrow({ children, light = false }) {
  return (
    <p className={`text-xs font-bold tracking-[0.15em] mb-3 ${light ? 'text-gold-400' : 'text-brand-600'}`}>
      {children}
    </p>
  )
}

export function Check({ className = 'text-brand-600' }) {
  return (
    <svg viewBox="0 0 20 20" className={`w-5 h-5 shrink-0 ${className}`} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-700 transition">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a href="/signin" className="text-sm font-semibold text-slate-600 hover:text-brand-700">
            Sign in
          </a>
          <PrimaryButton href="/contact" className="px-4 py-2.5">Book a Demo</PrimaryButton>
        </div>
        <button
          className="md:hidden w-10 h-10 grid place-items-center rounded-lg border border-slate-200"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="text-xl leading-none">{open ? '✕' : '☰'}</span>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="py-1.5 font-semibold text-slate-700" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <a href="/signin" className="py-1.5 font-semibold text-slate-700" onClick={() => setOpen(false)}>
            Sign in
          </a>
          <PrimaryButton href="/contact" className="mt-2">Book a Demo</PrimaryButton>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const cols = [
    { title: 'Product', links: ROLES.map((r) => ({ label: `For ${r.tab}`, href: `/solutions/${r.slug}` })) },
    {
      title: 'Company',
      links: [
        { label: 'Why CASPAA', href: '/home#why' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Contact', href: '/contact' },
        { label: 'Book a Demo', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Features', href: '/home#features' },
        { label: 'Security', href: '/home#security' },
        { label: 'FAQ', href: '/home#faq' },
        { label: 'Sign in', href: '/signin' },
      ],
    },
  ]
  return (
    <footer className="bg-brand-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 text-sm text-slate-400 max-w-xs">{CONTACT.tagline}</p>
          <div className="mt-5 text-sm space-y-1">
            <p>📧 <a className="hover:text-white" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
            <p>📞 {CONTACT.phones.join(' · ')}</p>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-white font-bold text-sm mb-3">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href === '/signin' ? (
                    <a href={l.href} className="hover:text-white transition">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="hover:text-white transition">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-5 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 CASPAA. All rights reserved.</p>
          <p>Built for African schools.</p>
        </div>
      </div>
    </footer>
  )
}

export default function SiteLayout({ children, title, description }) {
  const pageTitle = title ? `${title} — CASPAA` : 'CASPAA — School Operating System'
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={description || 'CASPAA is the all-in-one, Edu-Fintech-powered operating system for African schools.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-white text-slate-800">
        <Nav />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  )
}
