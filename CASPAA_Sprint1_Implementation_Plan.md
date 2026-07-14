# CASPAA — Sprint 1 Implementation Plan

**Scope:** Public per-school portal + role-differentiated login · Document-verification gate · PWA (install + offline read)
**Derived from:** Caspaa Update meeting (2026-07-10) and the companion Findings Report.
**Target codebase:** `public/js/*` (vanilla-JS SPA served via Next.js/Vercel).

---

## 1. Guiding principle

Do **not** rewrite what works. CASPAA already has: self-service school signup with an `unverified` state ([auth.js:343](public/js/auth.js#L343)), identifier-first self-routing login ([auth.js:175](public/js/auth.js#L175)), the getting-started wizard, and a role/nav system ([app.js:13](public/js/app.js#L13)). Sprint 1 **adds a public surface and a verification gate on top of that engine** and makes the app installable.

---

## 2. Workstreams

### WS-A — Document-verification gate *(security mandate)*

**Goal:** a school cannot reach money features or expose a public portal until CASPAA approves its documents.

State machine on the `school` record:
```
unverified → pending_review → verified
                    └────────→ rejected (reason)
```

Changes:
- **Data:** extend the existing `verification` object → `{ status, docs: [], submittedAt, reviewedAt, reviewedBy, rejectionReason }`. Add school `slug` + `emailDomain`.
- **School side:** a "Verify your school" step in the wizard — upload registration certificate, confirm official email domain, submit → `pending_review`. Show a persistent "Verification pending / rejected" banner.
- **Gate enforcement:** a single `isSchoolVerified(schoolId)` helper; guard money views (`adm_finance_hub`, `fin_*`, lending, payments) and public-portal exposure behind it. Unverified → show a "locked until verified" state instead of the feature.
- **Super Admin side:** a review queue in `superadmin.js` — list `pending_review` schools, view docs, **Approve** / **Reject (with reason)**; writes `verified`/`rejected` + audit `school_verified` / `school_rejected`.
- **Official-email rule:** on signup/verify, check registration email domain against claimed school domain.

**Decision needed:** manual approval (recommended) vs. automated domain-match.

### WS-B — Per-school public portal + role-differentiated login

**Goal:** each verified school has a unique URL that serves a public landing page (branding + feature cards + role-based login), matching the Edves model.

Changes:
- **Slug resolution:** on boot, read the subdomain from `location.hostname` (e.g. `bgc` from `bgc.caspaa.app`); look up the school by `slug`; set `APP.portalSchool`. Fallback to path-based (`/bgc`) if no wildcard DNS yet. No subdomain → the normal CASPAA app.
- **Public landing view** (`view_portal_home`): school logo/name/colours, feature cards (Fee Payment, CBT, etc.), and a login panel — **rendered before auth**, so `APP.render()` must branch: portal context + logged-out → portal, else existing behaviour.
- **Role-differentiated login:** top-nav / quick-access entry points **Students · Parents · Educator · Tour · Admissions**. Each pre-selects a login *presentation* (labels + role image) but funnels into the **existing** `routeLoginIdentifier` / `resolveLogin` — no backend change. Keeps CASPAA brand colours; uses per-role imagery per Jeremiah's suggestion.
- **Branding source:** reuse the `school.branding` we already persist.

**Decision needed:** hosting/DNS for `*.caspaa.app` (Vercel wildcard domain).

### WS-C — PWA: install + offline read

**Goal:** installable app with a cached shell + last-loaded data readable offline.

Changes:
- **`public/manifest.webmanifest`** — name, icons, `display: standalone`, theme colour, `start_url`. Per-school theming can come later via a dynamic manifest.
- **`public/sw.js`** — service worker: precache the app shell (`index`, `css`, all `js/*`), serve cache-first for the shell, network-falling-back-to-cache for the rest. Data already persists in LocalStorage, so a cached shell + existing LocalStorage = a browsable offline app.
- **Registration** — register the SW on boot; add manifest `<link>` + an "Install app" affordance.
- **Replace the mock** `toggleOffline` ([app.js:676](public/js/app.js#L676)) indicator with real `navigator.onLine` status.

*Constraint:* Next.js/Vercel serving means SW scope + headers must be correct (SW served from root, `Service-Worker-Allowed`); verify against `next.config.js` / `vercel.json`.

---

## 3. Data model changes (summary)

`school` record gains:
| Field | Purpose |
|---|---|
| `slug` | subdomain / path key (e.g. `bgc`) |
| `emailDomain` | official-email enforcement |
| `verification.docs[]` | uploaded document refs |
| `verification.submittedAt / reviewedAt / reviewedBy / rejectionReason` | review audit |

New audit actions: `school_verification_submitted`, `school_verified`, `school_rejected`.

---

## 4. File-by-file touch list

| File | Change |
|---|---|
| `public/js/data.js` | school schema (`slug`, `emailDomain`, richer `verification`); seed slugs for demo schools |
| `public/js/auth.js` | verify-school step in signup/wizard; role-portal login presentation; `emailDomain` check |
| `public/js/app.js` | boot-time slug resolution; portal branch in `render()`; real online/offline status; SW registration |
| `public/js/modules/superadmin.js` | verification review queue (approve/reject) |
| `public/js/modules/admin.js` | wizard "Verify your school" step; gate money views; pending/rejected banner |
| `public/js/portal.js` *(new)* | `view_portal_home` + role login entry points |
| `public/manifest.webmanifest` *(new)* | PWA manifest |
| `public/sw.js` *(new)* | service worker |
| entry HTML (Next `pages/`) | manifest link + SW registration hook |

---

## 5. Acceptance criteria (Given/When/Then)

- **AC-A1** Given an `unverified` school, When it opens a money feature, Then it sees a "verify to unlock" state and no financial data.
- **AC-A2** Given a school submits its documents, Then status → `pending_review` and a Super Admin sees it in the review queue.
- **AC-A3** Given a Super Admin approves, Then status → `verified`, money features unlock, and `school_verified` is audited.
- **AC-A4** Given a Super Admin rejects with a reason, Then status → `rejected` and the school sees the reason.
- **AC-B1** Given `bgc.caspaa.app` (or `/bgc`) for a verified school, When a logged-out visitor loads it, Then the school's branded portal renders with role entry points.
- **AC-B2** Given the portal, When a visitor picks "Parents" and signs in, Then the existing router authenticates them unchanged.
- **AC-B3** Given an `unverified` school, Then no public portal is exposed.
- **AC-C1** Given the app has loaded once, When the device goes offline, Then the app still opens and last-loaded data is browsable.
- **AC-C2** Given a supported browser, Then an "Install app" option is available and installs a standalone window.

---

## 6. Sequencing within the sprint

1. **WS-A data + gate** (foundation; unblocks safe public exposure).
2. **WS-C PWA** (independent, self-contained, immediately demoable).
3. **WS-B portal + role login** (depends on A's `verified` state and `slug`).
4. Super Admin review queue (completes A's loop).

---

## 7. Out of scope (later sprints)

Public admissions + Book-a-Tour funnel · Careers portal · offline write-and-sync · school-site embed/widget · Paystack live-mode (ops-driven, parallel) · real email delivery + server-side identity/hashing.
