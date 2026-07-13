# CASPAA — Onboarding & Security Findings Report

| | |
|---|---|
| **Prepared by** | Tech4mation (Engineering) |
| **Prepared for** | Gbemisola Ibitoye |
| **Meeting reference** | Caspaa Update — 2026-07-10 |
| **Report date** | 2026-07-13 (Monday) |
| **Re: action items** | Paystack simulation · Offline-first feasibility · Edves/parent onboarding analysis · Portal & URL strategy |

---

## 0. Executive summary

Following the 10 July review, I simulated the Paystack merchant onboarding flow, evaluated the technical feasibility of offline-first operation with engineering, and studied the Edves / BridgeGap (bgvest.net) model that we agreed to benchmark against. The findings converge on a single recommendation:

> **Ship a public, per-school portal (unique URL) with role-differentiated login, gated behind mandatory document verification, and make the app installable/offline-capable as a PWA. Take Paystack live by submitting the compliance form.**

None of this requires abandoning our current build. CASPAA already has self-service school signup, an unverified→verified school state, identifier-first login, and a getting-started wizard. The work is to **complete the verification gate, add the public portal surface, and add the offline layer** — described in the companion *Sprint 1 Implementation Plan*.

The four decisions I need from you to start building are listed in §6.

---

## 1. Paystack onboarding simulation

**Assignment:** perform an end-to-end merchant registration on Paystack, analyse the flow and automated emails, and extract lessons for CASPAA's own onboarding.

### 1.1 What Paystack's flow looks like

1. **Instant account, restricted mode.** You create a business account with just an email + password and land in the dashboard immediately — but in **test mode**. You can build and integrate against test keys right away; you cannot receive real money.
2. **Compliance form is the gate.** To move from test → live, you submit a **Compliance / "Go Live" form**: business type (registered vs. starter/unregistered), business name, RC number, industry, business description, support contact, and a settlement bank account.
3. **Document verification.** Registered businesses upload proof — **CAC certificate, TIN, proof of address, director ID (NIN/BVN)**. Paystack reviews and either approves, rejects with a reason, or requests more.
4. **Automated email cadence.** Welcome email on signup → "complete your compliance" nudges → "documents received / under review" → "you're live" (or "we need X"). Each email is single-purpose, tells you exactly the *one* next action, and deep-links back to the exact form.
5. **Restricted until verified.** Business accounts exist but stay restricted until credentials are provided — the platform's value is in the backend engine, not just the dashboard UI.

### 1.2 Lessons CASPAA should copy

| Paystack behaviour | What we do in CASPAA |
|---|---|
| Instant account, but **restricted** until verified | Keep our "instant trial, verify to go live" model. Let a school set up classes/staff immediately; **gate money features (fees, payments, lending) until KYC is approved.** *(We already stamp `verification: { status: 'unverified' }` at signup — we just need to enforce it.)* |
| **One document set** unlocks everything | Define a single CASPAA verification pack: **CAC/registration certificate + official school email (domain match) + proprietor ID.** |
| **Single-action emails** with deep links | Our onboarding banner + wizard already do this in-app; when we add real email, each message should carry one action + deep link. |
| **Explicit states**: test / pending / live | Adopt matching school states: `unverified → pending_review → verified` (+ `rejected`). |
| Verification protects the network | Directly satisfies your security mandate — see §4. |

### 1.3 Paystack compliance status (action for us)

Our Paystack account is currently in **test mode**. To accept live payments we must **submit the compliance form** with CASPAA's own business documents (CAC, settlement account, TIN, director ID). This is an operational task, not an engineering blocker, and can proceed in parallel with the build. **Recommended owner + target date needed.**

---

## 2. Offline-first feasibility

**Assignment:** discuss offline-first requirements with engineering and evaluate technical feasibility.

### 2.1 Verdict: feasible, in stages

CASPAA is a single-page app whose data already lives in the browser (LocalStorage). That makes offline **read** access very achievable now, and offline **write-and-sync** achievable later with more work. The right vehicle is a **PWA (Progressive Web App)** — not a native APK — which also resolves the "app vs. website" question from the meeting.

### 2.2 Why PWA over APK

- **One codebase, both experiences.** A PWA is *installable* — it gets a home-screen icon and full-screen app window on Android, iOS, Windows and Mac — while remaining the same web portal. This is exactly the **hybrid** approach we proposed (Casper-onboards *or* self-register via website), with no separate app build to maintain.
- **No app-store friction.** Schools install straight from their unique URL; updates ship instantly.
- **Edves parallel.** Edves ships both a web portal and a mobile app; a PWA lets us match that presence from a single build.

### 2.3 Staged plan

| Phase | Capability | Effort |
|---|---|---|
| **1 (now)** | **Installable + offline read.** App shell and last-loaded data cached; the app opens and is browsable with no connection. | Low — add a web manifest + service worker. |
| **2 (next)** | **Offline write + sync.** Create/edit while offline (mark attendance, record a payment), queue changes, sync on reconnect. | Medium — needs a sync queue + conflict rules. |
| **3 (later)** | **Server-backed identity & real sync** across devices. | Larger — depends on backend/identity work already on the roadmap. |

*Note:* the current in-app "offline mode" toggle is a **simulation** only. Phase 1 replaces it with genuine offline capability.

### 2.4 Open question for Mr. Ty / engineering

Phase 2/3 sync semantics depend on when we introduce a real backend. If backend/identity is imminent, we design the sync queue against it now; if not, Phase 1 (install + read cache) still delivers visible value immediately and is safe to ship against the current client-only store.

---

## 3. Edves / BridgeGap parent-onboarding analysis

**Assignment:** simulate the parent onboarding experience and study how Edves structures school logins and portals.

### 3.1 What the model does well (bgvest.net / Bridging Gaps College)

- **Per-school URL** using a school abbreviation — each school gets its own branded front door while running on shared infrastructure.
- **Public landing page** doubling as marketing + login: school branding ("Bridging Gaps College — Powered by Edves"), feature cards (AI Tutor, CBT, CodeCraft, Fee Payment), and a login panel side-by-side.
- **Role-differentiated entry points** in the top nav — **Students · Parents · Tour · Admissions** — plus **Quick Access** portal buttons (Student Portal, Parent Portal, Book a Tour) and a mobile-app download prompt.
- **Trust-building admissions funnel:** a prospective parent can *Book a Tour* (pick a time slot), submit a child's details for admission, read FAQs, see contact details and school size — **before** committing. The school verifies, then contacts the parent to schedule the tour.
- **Careers portal** for job seekers.

### 3.2 Testing note

Live testing of the Edves **mobile app** was blocked by device location settings during the meeting; the **web** flows (portal, login, book-a-tour, admissions) were reviewed and are the basis for this analysis and for our portal spec.

### 3.3 What we adopt for CASPAA

1. **Per-school public portal** at a unique URL (branding + feature cards + login).
2. **Role-differentiated login** (Students / Parents / Educator / Tour / Admissions) — *over our existing self-routing login engine, so the backend stays unchanged.*
3. **Public admissions + Book-a-Tour** funnel with FAQ / contact / school-size info.
4. **Careers portal** (later phase).

---

## 4. Security & the verification gate

Your mandate: **no school gets full access until it provides verified documentation**, using only **official school email addresses**, to stop competitors masquerading as schools to scout our features.

**Finding:** this is both a security control *and* the same mechanism Paystack uses (§1). We implement it as a hard state machine:

```
signup ─▶ unverified ─▶ (upload CAC + official-email proof) ─▶ pending_review
   pending_review ─▶ CASPAA approves ─▶ verified   (full access)
   pending_review ─▶ CASPAA rejects  ─▶ rejected   (with reason)
```

- **Before `verified`:** the school can explore setup but **cannot** access money features or expose a public portal — so an impostor never sees the sellable surface.
- **Official-email rule:** registration email domain is checked/enforced against the school's claimed domain.
- **Reviewer:** *decision needed* — CASPAA-staff manual approval (safest) vs. automated domain-match (fastest). Recommendation: **manual approval for v1** given the explicit anti-competitor requirement.

---

## 5. Recommended build sequence

Detailed in the companion **Sprint 1 Implementation Plan**. In brief:

| Priority | Deliverable |
|---|---|
| **Sprint 1** | Public per-school portal + role-differentiated login · **document-verification gate** · PWA (install + offline read) |
| **Sprint 2** | Public admissions + Book-a-Tour funnel · Paystack live-mode integration |
| **Sprint 3** | Careers portal · offline write-and-sync · school-site embed/widget |
| **Parallel/ops** | Submit Paystack compliance form · provision wildcard DNS for per-school subdomains |

---

## 6. Decisions required to start

1. **URL scheme** — confirmed: **subdomain** (`bgc.caspaa.app`). *Requires wildcard DNS `*.caspaa.app` at our host — where is CASPAA hosted (Vercel)? Needed to enable subdomains; otherwise we ship path-based (`caspaa.app/bgc`) short-term.*
2. **Verification pack** — which documents count? (Proposed: CAC/registration certificate + official-domain email + proprietor ID.)
3. **Approval model** — CASPAA-staff manual approval (recommended) vs. automated domain-match.
4. **Offline scope for this phase** — confirmed: **install + read cache** (Phase 1).
5. **Paystack compliance** — owner + target date to submit the go-live form.

---

## 7. Status of assigned action items

| Action item (from 10 Jul) | Status |
|---|---|
| Simulate Paystack onboarding + analyse flow/emails | **Done** — §1 |
| Consult on offline architecture / feasibility | **Done** — §2 (final sync semantics pending backend timing with Mr. Ty) |
| Simulate parent onboarding / Edves analysis | **Done** — §3 (mobile app blocked by location settings; web flows reviewed) |
| Report findings before Monday | **This document** |
| Share BridgeGap link for review | bgvest.net (Bridging Gaps College portal) |
