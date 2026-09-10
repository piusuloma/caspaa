# PRD: CASPAA — School Operating System

**Product Requirements Doc**

**Author:** [Product Manager name]
**PRD Status:** Draft
**Version:** 4.1 · Structured on the Academy of Product Management PRD template
**Product:** CASPAA — School ERP + Embedded Finance + Internal Operations Portal
**Company:** AfriSprings Resources Ltd.

> **Scope note for this cycle:** We are building **every module in this document**. The only feature **ON HOLD** is the **Lending / Loans engine** (parent fee loans, credit scoring, disbursement, repayment). It is documented for continuity but is **not in this build** — see *Requirements → Out of scope*.

> **What changed in 4.1:** v4.0 named several surfaces in the Roles table and Must-have list but never gave them module sections, so they carried no journey, stories, flow, acceptance criteria or Definition of Done. v4.1 adds **M22–M34** to close that gap: Front Desk, the Operations hub (visitor log, library, inventory, activities), School Store, School Settings & Branding, School Reports & Analytics, Audit Log, Notifications, Help & Support, Subscription Billing, AI Assistant & Insights, the Public Site & self-service acquisition funnel, Role Dashboards, and COP Platform Settings. Deltas were also added to M1, M5 and M7 for sub-features that exist in the product but were unwritten.

---

# Overview

## Customer Problem

**Who the customer is.** African (initially Nigerian) K–12 schools — proprietors, administrators, bursars, principals, teachers — and the parents and students they serve. A secondary customer is the **CASPAA operations team** who onboard and run the platform.

**The problem.** Schools run day-to-day operations on paper registers, spreadsheets and WhatsApp:

- **Fees** are hard to track — who has paid, who owes, how much is outstanding — and receipts/records are manual.
- **Attendance, results and report cards** are recorded and computed by hand: slow and error-prone.
- **Parent communication** is fragmented across calls, WhatsApp and printed notes.
- **Staff, payroll and records** live in disconnected files.
- **Day-to-day operations** — who came through the gate, what stock is left, which books are out, which clubs are running — have no record at all.
- **Unreliable internet** means cloud-only tools stop working when the connection drops.
- Schools with **multiple branches** have no consolidated view and duplicate everything per site.
- Existing platforms are often **expensive, heavy, or built for always-on connectivity**.

## Rationale

**Why solve it, why now.** Nigeria has tens of thousands of private schools digitising for the first time. Whoever gives them one affordable, offline-tolerant system that runs the whole school — and lets parents pay and follow their children from a phone — wins the operating layer and the payment flow on top of it.

- **Benefit to schools:** replace disconnected tools with one system; get paid faster; transparency builds parent trust.
- **Benefit to parents:** pay fees and track children from a phone; itemised, printable statements.
- **Benefit to CASPAA/AfriSprings:** SaaS subscription revenue + transaction revenue on embedded payments; a data moat for future finance products.

## Solution

A multi-tenant **School Operating System** (student information, academics, HR, operations, finance) plus a **Core Operations Portal (COP)** for the internal team. Each school is an isolated tenant reached at its own URL / installable offline-first PWA. Features are gated by **subscription plan with per-school overrides**. Multi-branch schools operate as a **group** of branch tenants with a consolidated overview and branch switcher.

**Lending is deferred** this cycle; every other module ships.

---

# Roles & Portals

CASPAA is one platform with a **role-aware experience**: everyone signs in at the same door and lands in the portal built for them. The modules below (M1–M34) are delivered to the roles that need them — this section maps each role to the portal and modules they get, so nothing is missed for any user type.

## Who uses CASPAA, and what they get

| Role | Portal focus | Modules in their portal |
|---|---|---|
| **School Owner / Proprietor** (School Admin) | Runs the whole school and owns the account. For multi-branch schools, the **group owner** with a consolidated overview + branch switcher. | Everything — Dashboard (M33), Students & admissions (M1), Front desk (M22), Academic (M2), Attendance (M3), Results (M4), Staff & HR (M7), Finance & fees (M5), Payments (M6), Operations — visitors, library, inventory, activities (M23), School store (M24), Communications (M8), Calendar (M9), House points (M10), Transport (M11), Sickbay (M12), Alumni (M13), Assessments (M14), Learning (M19), Behaviour (M20), Messaging (M21), Reports & analytics (M26), Notifications (M28), Help & support (M29), **Settings & branding (M25)**, **Subscription & billing (M30)**, **AI insights (M31)**, **Multi-branch groups (M15)**, **Audit log (M27)** |
| **Principal** | Academic & HR leadership; result approval; no finance. | Dashboard, Students, Academic, Results **approval**, Staff & HR, Attendance oversight, Front desk, Operations, Calendar & notices, House points, Health, Behaviour, Reports, Help & support |
| **Finance Officer / Bursar** | The school's money. | Dashboard, Fee structure, Invoicing, **Itemised student ledger / statements**, Discounts, Payments & reconciliation, Expenses, **Payroll & payslips**, **School store**, Cost-centre / P&L overview, Financial reports |
| **Teacher** | Teaching and their classes. | Dashboard, Attendance, Results entry, Assignments & inline marking, CBT / assessments, Lesson plans & materials, Timetable, Teacher–parent diary, Messages, House points, **My payslip**, Leave requests, My appraisal |
| **Parent** | Their children. | Dashboard, Per-child views, **Fees & Wallet / Ledger**, Results & report cards, Timetable, Diary & messages, Consent forms, Surveys, Transport & pickup, Health, House points, Announcements |
| **Student** | Their own learning. | Dashboard, Learning & materials, Assignments (submit / resubmit), CBT / assessments, My results, Timetable, Behaviour, House points, My wallet |
| **Prospective parent / applicant** (no account) | Discovers the school and makes first contact. | **Public site, book-a-tour, online application, career enquiry (M32)** |
| **Super Admin** (CASPAA Operations / COP) | The platform, across all schools. | School onboarding & lifecycle, School verification queue, Revenue, Support desk, **Feature flags & plans (M16)**, Analytics, User management / RBAC, Audit, **Platform settings (M34)** |

> **Lending is the only thing on hold in the Parent and Finance portals** — the "Apply for a loan" / "Lending" entry points ship gated off. Every other module in every portal is in scope this cycle.

## Roles & Permissions matrix (school platform)

| Capability | Owner / Admin | Principal | Finance | Teacher | Parent | Student |
|---|---|---|---|---|---|---|
| Student records | ✅ | ✅ | ✅ | Read | Own child | Own |
| Staff records & HR | ✅ | ✅ | ✅ | Own | ❌ | ❌ |
| Results — enter | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Results — approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Results — view | ✅ | ✅ | ❌ | ✅ | Approved | Approved |
| Fees, invoices, ledger | ✅ | ❌ | ✅ | ❌ | Own | ❌ |
| Payments | ✅ | ❌ | ✅ | ❌ | Own | ❌ |
| Payroll & payslips | ✅ | ✅ | ✅ | Own payslip | ❌ | ❌ |
| Attendance — mark | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Attendance — view | ✅ | ✅ | ❌ | Class | Own child | Own |
| Assignments / CBT — set & mark | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Assignments / CBT — take | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Communications & diary | ✅ oversight | ✅ | ❌ | Write | Read / reply | ❌ |
| Calendar & notices — post | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| House points — award | ✅ | ✅ | ❌ | ✅ | View | View |
| Transport & pickup | ✅ | ✅ | ❌ | ❌ | Own child | ❌ |
| Health / sickbay | ✅ | ✅ | ❌ | ✅ | View | ❌ |
| **Front desk (tours, careers)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Visitor / gate log** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Library** | ✅ | ✅ | ❌ | Issue/return | ❌ | View own loans |
| **Inventory & assets** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Activities & clubs** | ✅ | ✅ | View P&L | ❌ | Own child | Own |
| **School store** | ✅ | ❌ | ✅ | ❌ | View purchases | ❌ |
| **School reports & analytics** | ✅ | ✅ | Financial only | ❌ | ❌ | ❌ |
| **Notifications — configure** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Notifications — receive** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Help & support** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Subscription & billing** | Owner only | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI assistant & insights** | ✅ | ✅ | Financial only | ❌ | ❌ | ❌ |
| **Audit log** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-branch group | Owner only | ❌ | ❌ | ❌ | ❌ | ❌ |
| School settings & branding | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Loans *(on hold)* | ⏸ | ❌ | ⏸ | ❌ | ⏸ apply | ❌ |

---

# Team

| Function | Owner |
|---|---|
| Product | [Product Manager] |
| Engineering | [Eng lead + team] |
| Design | [Designer] |
| Data / Analytics | [BI] |
| Product Marketing | [PMM] |
| Other stakeholders | Proprietor / pilot schools, CASPAA Ops, Finance |

# Project Links

- **Board / backlog:** [add link]
- **Design / prototypes:** [add link]
- **Tech spec / architecture:** [add link]
- **Repo:** github.com/piusuloma/caspaa
- **Related & dependencies:** Paystack, WhatsApp Business API, Email (SendGrid)
- **Launch links:** [GTM, release notes, docs]

---

# Project Details

## Success Criteria

**Quantitative (Year 1)**

| KPI | Target |
|---|---|
| Schools onboarded | 60 |
| Active schools | 50+ |
| Payments processed on platform | ₦1B+ |
| Fee-collection rate (participating schools) | ≥ 85% collected of billed |
| Digital records (attendance/results captured in-app) | ≥ 90% |
| Support ticket resolution | < 12 hours |
| Platform uptime | 99.9% |
| Payment reconciliation accuracy | > 98% |
| Self-service signups converting to verified schools | ≥ 40% |
| Subscription renewal rate | ≥ 90% |

**Qualitative**

- A school can be onboarded and run its **essentials end-to-end** — bill, collect, take attendance, publish results, message parents — without paper.
- Parents describe fee handling as **transparent** (itemised statements, real-time receipts).
- Multi-branch owners manage all campuses from **one login** with a consolidated view.
- An admin can answer "what happened, when, and who did it" from the **audit log** without contacting support.

## Requirements — Use Cases

Ranked by importance. **Must-haves** are the essentials needed to hit the success criteria; everything in *Must-have* and *Nice-to-have* is **in this build**. *Out of scope* is deferred.

### Must haves (building now)

- **Auth & tenancy** — role-aware unified login; per-school isolation; offline-first PWA.
- **Public site & self-service acquisition** — marketing site, pricing, role solution pages, book-a-tour, online application, career enquiry, proprietor self-registration with document verification gate.
- **Students & Admissions** — enrol, bulk CSV, applications, returning students, suspensions, promotion, graduation/alumni, activate/deactivate, enrolment analytics.
- **Front Desk** — tour requests and career leads captured from the public site and worked to outcome.
- **Academic** — calendar/terms, class arms, timetable, curriculum, scheme of work, assessment structure, results broadsheet.
- **Attendance** — daily class register with parent absence alerts.
- **Results & Reporting** — teacher entry → admin approval → parent/student view → printable report card.
- **Finance & Fees** — fee structure, invoice generation, **itemised student ledger / statement of account**, discounts breakdown, payments, reconciliation, advance credit, expenses, **cost-centre / P&L overview**, printable statements & receipts.
- **Payments** — Paystack (card / transfer / USSD), receipts.
- **Staff & HR** — profiles, staff attendance, **payroll**, payslips, leave, **salary advances**, appraisals, substitute coverage, former-staff records.
- **Operations** — visitor / gate log, library catalogue & loans, inventory & assets, extracurricular activities & clubs.
- **School Store** — item catalogue with cost vs selling price, student purchases, margin analysis.
- **Communications** — announcements, notice board, email campaigns, teacher–parent diary, consent forms, surveys, admin oversight.
- **Notifications** — channel configuration, automatic triggers, in-app notification centre.
- **Calendar & Notice Board.**
- **House Points** — individual awards + inter-house competitions + leaderboard.
- **Transport & Pickup** — routes, assignments, live bus status, authorised pickup approval.
- **Health & Sickbay** — visit logging with mandatory parent notification on send-home/referral.
- **Assessments** — assignments (with inline marking), formative tests / CBT.
- **Learning & Content** — lesson plans, notes and materials; student learning area.
- **Behaviour & Discipline** — incidents, merits, sanctions; student behaviour view.
- **Messaging** — direct teacher ↔ parent conversations (distinct from Diary).
- **Reports & Analytics (school)** — insights, enrolment, leavers, attendance, financial, applications, print & export centre.
- **Audit Log** — categorised, searchable, date-ranged record of sensitive actions.
- **Help & Support (school-side)** — live chat, ticketing, help centre.
- **School Settings & Branding** — branding, academic structure, lists, calendar, roles & permissions, notifications, AI, payment gateway, data backup.
- **Subscription Billing & Plan** — plan pricing, upgrade/downgrade, auto-renew, subscription invoices, add-ons.
- **AI Assistant & Insights** — rule-based school insights, AI report comments, fee reminders, attendance-risk and performance flags.
- **Role Dashboards** — a landing dashboard per role with KPIs and action chips.
- **Multi-branch / School Groups** — group overview, branch switcher, add-branch on-ramp.
- **Feature Entitlements** — plan-based gating + per-school add-on overrides + upgrade requests.
- **Super Admin / COP** — onboarding, verification queue, revenue, support desk, feature flags, analytics, RBAC, audit, platform settings.

### Nice to haves (this build or fast-follow)

- Installment plans on invoices.
- Alumni network enrichment (university/employer) + leaving certificate printing.
- Report scheduling/exports (COP).
- Peachtree / accounting-package journal export.

### Out of scope (deferred / on hold)

| Item | Status | Reason |
|---|---|---|
| **Lending / Loans engine** (apply, credit score, approve, disburse, repay) | **ON HOLD — not this cycle** | Business decision to defer; documented for continuity. All loan nav/views ship **gated off**. |
| **SMS channel** | **Disabled platform-wide (decision, May 2026)** | Cost and deliverability; WhatsApp + email + in-app replace it. The channel toggle ships visible but locked off. |
| Bulk disbursement / NIBSS direct settlement | Post-MVP | Phase-2 banking integration |
| Savings / investment products | Post-MVP | Requires banking/microfinance licence |
| Cross-border lending | Post-MVP | Regulatory complexity |
| Advanced AI underwriting | Phase 3 | Requires larger dataset |
| Generative-LLM features (free-text AI beyond templated comments) | Phase 2 | Current AI features are rule-based / templated by design |
| Native mobile app | Phase 2 | Web PWA validated first |

## Tracking Requirements

To measure the success criteria, instrument:

- **Acquisition:** public-site visits, tour bookings, career leads, self-registrations, verification approval rate and time-to-verify.
- **Onboarding:** schools created, time-to-active, modules enabled per plan.
- **Finance:** billed vs collected vs outstanding per school/branch; receipts generated; reconciliation match rate; statements printed; store margin.
- **Subscription:** MRR/ARR, upgrades, downgrades, churn, renewal rate, add-on attach rate.
- **Engagement:** DAU/MAU by role; attendance submissions/day; results approved; messages/diary notes sent; dashboard action-chip clicks.
- **Operations:** visitor check-ins, library loans & overdue rate, low-stock events, club enrolment vs viability threshold.
- **Notifications:** sends per channel, delivery/failure rate, trigger-level opt-outs.
- **Support:** tickets raised, live-chat sessions, help-centre article views, first-response and resolution time.
- **Entitlements:** feature-request tickets raised; overrides granted; upgrade conversions.
- **Reliability:** uptime, API latency, failed-payment rate, error logs.
- **Audit:** every sensitive action writes an immutable `auditLog` entry (actor, action, target, timestamp).

## Rollout Plan & Milestones

Phased, feature-flagged per school.

| Phase | Contents | Gate |
|---|---|---|
| **P0 — Foundation** | Auth/tenancy, public site & self-registration, verification gate, role dashboards, Students, Academic, Attendance, Results | Internal dogfood on seed school |
| **P1 — Money** | Fee structure, invoices, **itemised ledger/statement**, payments, reconciliation, receipts, school store | Pilot schools live on real fees |
| **P2 — Operations & Comms** | Staff/HR + payroll, communications, notifications, calendar, house points, transport, sickbay, visitor log, library, inventory, activities, assessments, help & support | Whole-school pilot |
| **P3 — Scale** | Multi-branch groups, feature entitlements enforcement, subscription billing, school reports & audit log, AI insights, COP portal hardening | Multi-branch pilot + billing tiers live |
| **On hold** | Lending engine | Resume when business greenlights |

---

# Global Definition of Done

Every user story is "done" only when **all** of the following hold (module-specific DoD is added per section):

- ✅ **Scoped & isolated** — reads/writes go through `currentSchoolId()`; no cross-tenant leakage; branch-aware where a group owner is switched into a branch.
- ✅ **Role-correct** — respects the Roles & Permissions matrix; unauthorised access shows a denied/locked screen, not a blank or a crash.
- ✅ **Entitlement-gated** — feature hidden/locked when the school lacks it; upgrade path shown.
- ✅ **States handled** — empty, loading, error, and success states all designed and implemented.
- ✅ **Responsive & accessible** — works on mobile; inputs have labels; colour is never the only signal; AA contrast.
- ✅ **Notifications & audit** — relevant in-app notification fired; sensitive actions write an immutable `auditLog` entry.
- ✅ **Persistence & offline** — data persists; offline-tolerant where the module is used without connectivity, syncing on reconnect.
- ✅ **Acceptance criteria pass** — every row in the section's AC table verified; no console errors.
- ✅ **Print/export correct** where the story produces a document (school branding, computer-generated footer).

---

# Modules — Journeys, Stories, Flows, Acceptance Criteria & Definition of Done

> Format per module: **User journey** (end-to-end experience) → **User stories** → **Flow** (step sequence) → **Acceptance criteria** → **Definition of Done** (module-specific; the Global Definition of Done above applies to all).

## Module coverage index

Which of the five each module currently carries. ✅ present · ⏸ on hold (documented, minimal by design).

| # | Module | Journey | User Stories | Flow | Acceptance Criteria | Definition of Done |
|---|---|:--:|:--:|:--:|:--:|:--:|
| M1 | Students & Admissions | ✅ | ✅ | ✅ | ✅ | ✅ |
| M2 | Academic Management | ✅ | ✅ | ✅ | ✅ | ✅ |
| M3 | Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| M4 | Results & Reporting | ✅ | ✅ | ✅ | ✅ | ✅ |
| M5 | Finance & Fees (incl. Ledger) | ✅ | ✅ | ✅ | ✅ | ✅ |
| M6 | Payments | ✅ | ✅ | ✅ | ✅ | ✅ |
| M7 | Staff & HR (incl. Payroll) | ✅ | ✅ | ✅ | ✅ | ✅ |
| M8 | Communications | ✅ | ✅ | ✅ | ✅ | ✅ |
| M9 | Calendar & Notice Board | ✅ | ✅ | ✅ | ✅ | ✅ |
| M10 | House Points | ✅ | ✅ | ✅ | ✅ | ✅ |
| M11 | Transport & Pickup | ✅ | ✅ | ✅ | ✅ | ✅ |
| M12 | Health & Sickbay | ✅ | ✅ | ✅ | ✅ | ✅ |
| M13 | Alumni | ✅ | ✅ | ✅ | ✅ | ✅ |
| M14 | Assessments (Assignments + CBT) | ✅ | ✅ | ✅ | ✅ | ✅ |
| M15 | Multi-branch / School Groups | ✅ | ✅ | ✅ | ✅ | ✅ |
| M16 | Feature Entitlements | ✅ | ✅ | ✅ | ✅ | ✅ |
| M17 | Super Admin / COP | ✅ | ✅ | ✅ | ✅ | ✅ |
| M18 | Lending / Loans | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ |
| M19 | Learning & Content | ✅ | ✅ | ✅ | ✅ | ✅ |
| M20 | Behaviour & Discipline | ✅ | ✅ | ✅ | ✅ | ✅ |
| M21 | Messaging (Teacher ↔ Parent) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M22** | **Front Desk (Tours & Career Leads)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M23** | **Operations Hub** (Visitors · Library · Inventory · Activities) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M24** | **School Store** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M25** | **School Settings & Branding** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M26** | **Reports & Analytics (School)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M27** | **Audit Log** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M28** | **Notifications & Channels** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M29** | **Help & Support (School-side)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M30** | **Subscription Billing & Plan** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M31** | **AI Assistant & Insights** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M32** | **Public Site & Self-Service Acquisition** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M33** | **Role Dashboards** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M34** | **COP Platform Settings** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Coverage:** every active module (M1–M17, M19–M34) carries all five. M18 (Lending) is intentionally minimal while on hold.

---

## M1. Students & Admissions

**User journey.** A proprietor opens Students, adds a child (or bulk-imports a spreadsheet, or accepts an online application). The student instantly appears in the class roster, attendance register and fee system, and the linked parent is notified. Over the year the admin promotes, graduates, deactivates or re-admits the student — and the record persists as history.

**User stories**
- As an admin, I want to **add a student** with details, class and parent link, so they can access all services from day one.
- As an admin, I want to **bulk-upload students via CSV**, so migration from spreadsheets is fast.
- As an admin, I want to **review online admission applications** and accept/reject them.
- As an admin, I want a **returning-students flow** so a re-enrolling child is picked from history rather than re-keyed.
- As an admin, I want a **suspensions register** showing who is currently suspended and when they are due back.
- As an admin, I want **enrolment analytics** (intake trend, class distribution, gender split) to plan capacity.
- As an admin, I want to **promote students in bulk** at term end.
- As an admin, I want to **graduate leavers to alumni** (individually or by class) and print a Leaving Certificate.
- As an admin, I want to **suspend, withdraw, deactivate or re-admit** a student with a reason, so status reflects reality.

**Flow — Student enrolment**
```
1. Admin → Students → Add Student (or Bulk Import CSV, or Returning Student)
2. Fill: name, DOB, gender, class, house, admission no., photo, parent link
3. System validates duplicate admission number
4. Save → student created, parent notified, appears in roster/attendance/fees
5. Bulk: upload CSV → preview rows → confirm → valid rows imported, invalid flagged
6. Returning: search leavers/alumni → select → restore with prior admission no. and history intact
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Duplicate admission number | Error shown, not saved |
| Parent linked at registration | Parent receives in-app notification |
| Bulk CSV import | Valid rows imported; invalid rows flagged with reason |
| New student visible everywhere | Appears in attendance, results, fees immediately |
| Returning student | Prior record restored, not duplicated; ledger history preserved |
| Suspensions tab | Lists only students with an un-reinstated suspension; badge count matches |
| Enrolment analytics | Intake trend and class distribution match the student table |
| Deactivate / re-admit | Status changes; record & ledger preserved; reversible |

**Definition of Done (delta)**
- Admission number uniqueness enforced per school.
- Deactivation hides from active rosters but preserves ledger/history; re-admission restores cleanly.
- Bulk import is transactional per row (one bad row never blocks the rest).
- Returning-student restore never creates a second record for the same child.

---

## M2. Academic Management

**User journey.** Before term, the admin sets the calendar (session/term/holidays), splits year-groups into arms, builds the timetable, curriculum and scheme of work, and defines the assessment structure (CA/exam weightings and grade boundaries). Through term, results roll up into a ranked broadsheet.

**User stories**
- As an admin, I want to **set the academic calendar** so all scheduling anchors to real dates.
- As an admin, I want to **create class arms** (JSS1A/B) to split large groups.
- As an admin, I want to **build the timetable**, **curriculum** and **scheme of work** per subject/term.
- As an admin, I want to **define the assessment structure** — CA/exam weightings and grade boundaries — so results compute correctly.
- As an admin, I want a **ranked results broadsheet** to see standing at a glance.

**Flow — Term setup**
```
1. Admin → Academic → Calendar → define session, terms, holidays
2. Academic → Classes/Arms → create arms under each class
3. Academic → Curriculum → subjects per class
4. Academic → Timetable → build periods per class
5. Academic → Assessment Setup → CA/exam split, grade boundaries
6. Results → Broadsheet → auto-ranked by average once results approved
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Calendar drives scheduling | Terms/holidays reflected across modules |
| Broadsheet ranking | Ties share a rank; next rank skips accordingly |
| Timetable visible to teachers/students | Correct periods per class |
| Assessment structure applied | Totals and grades follow the configured weightings/boundaries |

**Definition of Done (delta)**
- Ranking handles ties deterministically; broadsheet matches per-student report cards.
- Timetable clashes (same teacher, two rooms) are surfaced.
- Changing grade boundaries mid-term does not silently rewrite already-approved results.

---

## M3. Attendance

**User journey.** Each morning a teacher opens their class, everyone defaults to Present, they tap the exceptions, submit — and parents of absentees get an alert the same day. Admin sees rates per class and school-wide.

**User stories**
- As a teacher, I want to **take attendance daily** so the register is current.
- As an admin, I want **attendance rates** per class/school.
- As a parent, I want to **see my child's attendance** and be alerted on absence.

**Flow — Daily attendance**
```
1. Teacher → Attendance → select class → today auto-filled
2. Roster loads, all "Present" by default
3. Tap to toggle Present / Absent / Late (late badge if after threshold)
4. Submit → saved with schoolId, classId, date, teacher
5. Absentees → parents notified same day
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Submission locks the day | No re-submit without admin override |
| Absence → parent alert | Parent notified same day |
| Rate calculation | % present per class/day correct |
| Late tracked separately | Distinct from absent in reports |

**Definition of Done (delta)**
- Works offline (mark now, sync later); duplicate submission for a day is prevented.

---

## M4. Results & Reporting

**User journey.** A teacher enters CA + exam scores; the system computes totals/grades; they submit for approval. Admin reviews the ranked broadsheet, adds required comments, approves — and only then do parents and students see verified results and can print a report card.

**User stories**
- As a teacher, I want to **enter results** and **submit for approval**.
- As an admin, I want to **approve/reject** results with a required comment.
- As a parent/student, I want to **see approved results** and **print a report card**.

**Flow — Results submission & approval**
```
TEACHER: Enter Results → CA + Exam per student → total & grade auto → Submit (approved:false)
ADMIN:  Academic → Results (pending badge) → broadsheet → comment per student → Approve (approved:true)
        → parents & students notified
VIEW:   Student/Parent see approved only; pending shows amber banner; report card printable
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Auto total & grade | Total = CA+Exam; grade matches boundaries |
| Unapproved hidden | Nothing visible to parent/student until approved |
| Comment required | Approve disabled if any student lacks a comment |
| Rank correctness | Ties share rank; next rank skips |
| Report card print | Opens print view with school branding |

**Definition of Done (delta)**
- Approval is atomic per class/subject; notification fires once on approval.
- Report card print matches broadsheet figures exactly.

---

## M5. Finance & Fees  *(includes the Student Ledger / Statement of Account)*

**User journey.** Finance sets the term's fee structure, generates invoices for all active students, and applies any discounts. Each student's account becomes an **itemised, dated ledger** — every charge, every discount, every payment on its own line with a running balance and any credit balance. Parents view and **print the statement**, pay online, and get a **real-time receipt**. Finance reconciles bank transfers, records expenses, and reads the **cost-centre / P&L overview** to see where the money went.

**User stories**
- As finance, I want to **set fee structure** per class/term so invoices generate correctly.
- As finance, I want to **generate & send invoices** in bulk at term start.
- As finance, I want an **itemised student ledger** — charges, discounts and payments **broken out, not lumped** — with a running balance, opening balance and credit balance.
- As finance, I want to **edit a bill** (add/remove line items) and **apply itemised discounts**.
- As finance, I want to **reconcile transfers** by narration matching.
- As finance, I want to **record expenses** against budget categories for an accurate P&L.
- As finance, I want a **cost-centre / P&L overview** as my landing tab, so I see income vs cost per department at a glance.
- As a parent, I want to **view/print my child's statement** and **download receipts** from my phone.
- As a parent, I want **overpayments** to show as a **credit balance** and auto-apply to the next invoice.

**Flow — Fee invoice, ledger & collection**
```
ADMIN:  Fee Structure → set per class → Generate Invoices (all active) → parents notified
LEDGER: Each student account = dated rows: Opening balance b/f → charges (debit) →
        discounts (credit) → payments (credit) → running balance (credit shows "Cr")
PARENT: Fees → View statement (itemised) / Print statement → Pay Now (card/transfer/USSD)
        → invoice paid, real-time receipt available to view/print
RECON:  Reconciliation → unmatched transfers auto-matched by narration → confirm
CREDIT: Overpayment → studentCredit balance → auto-applied to next invoice, parent notified
P&L:    Finance → Overview → income (fees, store, activities) vs cost per budget category
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Invoice per active student | Count matches active students |
| Itemised ledger | Each charge/discount/payment is its own dated row; nothing lumped |
| Running balance & credit | Balance correct; overpayment shows as "X Cr"; invariant debit − credit = balance |
| Discounts broken down | Sibling/bus/special discounts appear as separate credit lines |
| Editable bill | Add/remove line items recomputes total, balance, status |
| Reconciliation | Narration auto-match; manual override possible |
| Statement & receipt | Both printable from parent side with school branding |
| Advance credit | Surplus stored and auto-applied to next invoice |
| Cost-centre overview | Income and cost per category reconcile to the expense and invoice tables |

**Definition of Done (delta)**
- Ledger computation holds the invariant `debitTotal − creditTotal = balance` for every student.
- Discounts/opening balances never double-count against invoice totals.
- Receipts are real-time (visible to parent immediately after payment) and printable.
- Store and activity income appear in the P&L without being double-counted against fee invoices.
- All money actions write `auditLog` entries.

---

## M6. Payments

**User journey.** A parent taps Pay Now on an invoice, picks card/transfer/USSD, completes payment, and the invoice clears with a downloadable receipt; finance sees the transaction reconciled.

**User stories**
- As a parent, I want to **pay fees online** (card/transfer/USSD) so I skip the office queue.
- As a parent, I want a **receipt** for every payment.
- As finance, I want **failed payments logged** for follow-up.

**Flow**
```
Parent → Fees → Pay Now → method → (card: OTP; transfer: copy acct → pay → reconcile; USSD)
→ invoice status Paid → receipt generated → parent can download/print anytime
Failed attempt → logged to finance ledger for follow-up
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Partial payment | Invoice shows remaining balance |
| Receipt after payment | Available in parent portal immediately |
| Failed payment logged | Visible to finance with reason |
| Multi-child "pay all" | Sequential invoices, method per child |

**Definition of Done (delta)**
- Zero tolerance for lost payment records; every transaction persisted with reference.
- Idempotent — a double-submit never double-charges or double-credits.

---

## M7. Staff & HR (incl. Payroll)

**User journey.** Admin maintains staff profiles and daily staff attendance; each month finance runs payroll through a stepper (generate → adjust → approve → publish); staff get payslips. Teachers request leave and salary advances and see outcomes; appraisal cycles run to an outcome; departed staff move to a former-staff register without losing their history.

**User stories**
- As an admin, I want to **manage staff profiles** with roles and class assignments.
- As an admin, I want to **record staff attendance** so punctuality is measurable.
- As finance/admin, I want to **run monthly payroll** through an auditable stepper.
- As a teacher, I want to **apply for leave**, **request a salary advance**, and **view my payslip**.
- As an admin, I want to **approve leave and advances**, **run appraisal cycles** to an outcome, and **assign substitutes**.
- As an admin, I want **terminated staff moved to a former-staff register**, out of payroll but not out of history.

**Flow — Payroll**
```
1. Generate: load active staff + salary components → auto net pay
2. Adjustments: bonuses, advance deductions (impact shown)
3. Review & Approve: total vs budget → Approve
4. Publish: payslips created, staff notified, PDF downloadable; run history immutable
```

**Flow — Salary advance**
```
Teacher → request advance (amount, reason, repayment months) → pending
Admin → Staff & HR → Salary Advances (badge) → approve/decline
Approved → deduction schedule created → applied automatically in each payroll run until cleared
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Only active staff in run | No terminated/inactive staff |
| Net pay | Basic + Allowances − Deductions = Net |
| Adjustments before approval | Preview updates per staff |
| Payslips published together | All notified on approval |
| Run history preserved | Prior runs visible, not editable |
| Leave outcome | Teacher notified; approved leave in attendance |
| Advance repayment | Deducted automatically each run; balance decreases to zero and stops |
| Appraisal cycle stages | Manager → principal → outcome; badge counts match pending items |
| Former staff | Removed from payroll and rosters; record and payslip history retained |

**Definition of Done (delta)**
- Payroll runs are immutable once published; corrections are new adjustments, not edits.
- Leave balances decrement correctly; substitute coverage visible on affected classes.
- An approved advance can never over-deduct past its outstanding balance.

---

## M8. Communications (Announcements, Notice Board, Diary, Consent, Surveys)

**User journey.** Admin broadcasts announcements and notices, runs consent forms and surveys with deadlines, and monitors teacher–parent diary threads for safeguarding. Teachers leave diary notes parents read and reply to.

**User stories**
- As an admin, I want to **send announcements** to targeted audiences and **post notices**.
- As an admin, I want **digital consent forms** and **surveys** with deadlines and aggregated results.
- As a teacher, I want to **write diary notes** parents can read and reply to.
- As an admin, I want **oversight** of all teacher–parent conversations.

**Flow — Consent form**
```
Admin → Communications → Consent → Create (title, deadline, audience) → publish → parents notified
Parent → Consent → Agree/Decline (optional reason) → cannot re-submit
Admin → live response tally → export → auto-close after deadline
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Audience targeting | Only targeted role sees the item |
| No re-submission | Submit disabled after first response |
| Live tally | Count updates without refresh |
| Auto-close after deadline | No new submissions accepted |
| Diary threading & read state | Replies threaded; note marked read on open |
| Oversight | Admin sees school-wide threads read-only |

**Definition of Done (delta)**
- Deadline enforcement is server-truth, not just UI.
- Oversight is read-only and never injects the admin into the thread.
- Outbound sends go through the channel configuration in M28 — no module hard-codes a channel.

---

## M9. Calendar & Notice Board

**User journey.** Admin/principal post dated events and pinned notices to the right audiences; everyone sees the relevant calendar; only admins can edit.

**User stories**
- As an admin/principal, I want to **post dated calendar events** to a chosen audience so the community knows what's happening when.
- As an admin, I want to **pin notices** to the notice board for non-date-specific information.
- As any user, I want to **see the calendar and notices relevant to my role**.

**Flow — Event & notice**
```
Admin → Calendar → Add Event (title, dates, type, audience) → appears on targeted calendars
Admin → Notice Board → Post Notice (title, message, audience) → pinned, newest first
Users → Calendar / Notice Board → see items for their role; empty day shows "No events"
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Event on correct calendars | Visible to targeted audience |
| Notice audience filter | Only targeted role sees it |
| Edit gated | Teachers/parents see view-only |
| Multi-day events | Shown across all affected days |
| Unconfigured calendar | Admin sees a "Configure Term Dates" call to action; other roles see a plain explanatory message |

**Definition of Done (delta):** role-gated create/edit/delete; empty-day state ("No events") handled; the calendar reads its term dates from School Settings (M25) rather than a second source of truth.

---

## M10. House Points

**User journey.** Teachers award/deduct individual merit points with a reason; admin records inter-house competition results; a live leaderboard blends merit + competition points; students/parents see standings.

**User stories**
- As a teacher, I want to **award or deduct house points** to a student with a reason.
- As an admin, I want to **record inter-house competition results** by position.
- As a student/parent, I want to **see the house leaderboard** and my/our standing.

**Flow**
```
Teacher → House Points → Award (student, ± points, reason) → house total updates, student+parent notified
Admin → Competitions → record event → position per house (1st=50,2nd=35,3rd=20,4th=10) → leaderboard recalcs
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Award/deduct updates leaderboard | Immediate on save |
| Competition points by position | 1st=50, 2nd=35, 3rd=20, 4th=10 |
| Notifications | Student + parent notified on award |
| Ranking | Houses sorted by total (merit + competition) |

**Definition of Done (delta):** per-student point history auditable; breakdown (merit · competition) shown.

---

## M11. Transport & Pickup

**User journey.** Admin manages routes and assigns students; each run, the transport officer flips live status (Waiting → Departed → Arrived / Delayed) and parents get real-time alerts. Parents submit authorised pickup persons for admin approval.

**User stories**
- As an admin, I want to **manage bus routes and assign students** so transport is organised.
- As a transport officer, I want to **update live bus status** so parents get real-time alerts.
- As a parent, I want to **add authorised pickup persons** for approval and **see my child's bus status**.

**Flow — Bus status + pickup**
```
Admin → Transport → Bus Status → Departed/Delayed(+note)/Arrived → parents on route notified
Parent → Transport → Authorized Pickup → add person → admin approves/denies → appears in child's list
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Status change → alert | All route parents notified within seconds |
| Status pill on parent card | Colour-coded current status |
| Pickup approval | Approved person appears at gate check; revocable |
| Independent routes | Each route managed separately |

**Definition of Done (delta):** gated by the **transport** entitlement; revocation reflects immediately; an approved pickup person is visible to the gate/visitor log (M23) at check-in.

---

## M12. Health & Sickbay

**User journey.** Staff log a sickbay visit with complaint, treatment and outcome; if "Sent home" or "Referred", the parent is **force-notified** regardless of any checkbox. Parents see their child's visit history.

**User stories**
- As health staff, I want to **log a sickbay visit** with complaint, treatment and outcome.
- As an admin, I want **send-home / referral outcomes to force a parent notification**.
- As a parent, I want to **see my child's visit history**.

**Flow — Sickbay visit**
```
Staff → Health/Sickbay → Log Visit (student, complaint, treatment, outcome)
Outcome = Sent Home / Referred → parent notification auto-fired (mandatory)
Parent → Health → child's visit history (newest first)
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Send-home/Referred forces alert | Parent notified even if checkbox unchecked |
| Visit timestamped | Date/time recorded per visit |
| Parent history | All visits visible in parent's health tab |

**Definition of Done (delta):** mandatory-notification outcomes cannot be saved without the notification firing; a mandatory alert bypasses any per-trigger opt-out configured in M28.

---

## M13. Alumni

**User journey.** Admin graduates leavers to alumni (preserving history), enriches records (university/employer), prints leaving certificates, and can re-admit a returnee.

**User stories**
- As an admin, I want to **graduate leavers to alumni** individually or by class, preserving their history.
- As an admin, I want to **enrich alumni records** (university/employer) and **print leaving certificates**.
- As an admin, I want to **re-admit a returning alumnus** back to active status.

**Flow — Graduation & alumni**
```
Admin → Student → Graduate to Alumni (year, final class, exam, awards) → status 'alumni'
Admin → Academic → Bulk Promotion → destination "Graduate to Alumni" → whole class
Admin → Alumni → update info / print certificate / Re-admit → status back to active
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Graduated removed from active rolls | Not in attendance/results/fees |
| History preserved | Records intact after graduation |
| Certificate printable | Formatted print view |
| Bulk graduation | Whole class in one action |
| Re-admit | Returns to active; data preserved |

**Definition of Done (delta):** graduation and re-admission are reversible and audited.

---

## M14. Assessments (Assignments + Formative / CBT)

**User journey.** A teacher sets an assignment or CBT; students submit (text/image/PDF or answer questions); the teacher marks — including **inline pinned comments** on image submissions — grades, and returns work; students/parents see feedback and can resubmit. MCQ/True-False auto-grade; short answers are teacher-marked.

**User stories**
- As a teacher, I want to **create assignments/CBT**, **mark with inline comments**, and **return work**.
- As a student, I want to **submit and resubmit** and **see feedback**.
- As an admin, I want **oversight** of all assignments/CBT school-wide.

**Flow — Marking with inline comments**
```
Teacher → Assignments → Submissions → Mark → (image: pen/highlight/comment pins; PDF: sidebar comments)
→ score + status (Excellent/Satisfactory/Needs Revision) + general feedback
→ Save & Grade  OR  Return to Student (notifies student + parent)
Student → View Feedback (grade, status, inline comments) → Resubmit (pre-populated) → teacher notified
CBT: MCQ/True-False auto-graded on submit; short answer held until teacher marks
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Image pin at click point | Pin at exact % coordinates; reloads on re-open |
| Return notifies student+parent | Both get grade + feedback |
| Resubmit always available on returned work | Modal pre-populates previous answer |
| MCQ/TF auto-graded | Score immediate; short-answer pending until marked |
| Overdue CBT | Badge shown; cannot submit overdue |
| Admin oversight | All teachers' assignments/CBT visible |

**Definition of Done (delta):** inline comments persist and restore; resubmission replaces prior submission for re-marking.

---

## M15. Multi-branch / School Groups

**User journey.** A multi-branch owner enables branches (their school becomes HQ), lands on a **Group Overview** consolidating all campuses, and uses a **branch switcher** to drop into any branch's normal admin — each branch fully isolated. They add new branches self-serve.

**User stories**
- As a group owner, I want a **consolidated overview** across branches (enrolment, billed, collected, outstanding).
- As a group owner, I want to **switch into any branch** and run it normally.
- As a group owner, I want to **enable branches** and **add a branch** without support.

**Flow**
```
Entitled school → Branches → "Enable multiple branches" → school becomes HQ (group created)
Group Overview → per-branch KPIs + group totals → "Enter branch" or branch switcher
Add Branch → new isolated branch tenant under the group
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Enable branches | Standalone school promoted to group HQ |
| Consolidated KPIs | Group totals = sum of branch `feeTotals` + enrolment |
| Branch switch scopes everything | `currentSchoolId()` returns the active branch |
| Isolation | No data leaks between branches |
| Gated | Only shows when the **multibranch** entitlement is on |

**Definition of Done (delta):** branch switching re-scopes every module via `currentSchoolId()` with no per-module changes; group layer gated on the owner's entitlement (stable while switched into a branch).

---

## M16. Feature Entitlements (Plans + Overrides)

**User journey.** A school's plan sets default features; the CASPAA operator can grant per-school **add-ons** (custom features beyond plan). Features a school lacks are hidden in nav and locked in views with an **upgrade request** path; deep-links to gated views show a locked screen.

**User stories**
- As a school, I want to **only see what I pay for**, and **request** a feature I don't have.
- As the operator, I want to **toggle features per school** (plan default or custom override).

**Flow**
```
Plan → default features; Operator → school Features tab → override on/off (add-on or removal)
School side: gated nav hidden; gated view (deep link) → "not on your plan" → Request feature → ticket to Support Desk
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Plan defaults | Included features match plan tier |
| Per-school override wins | Add-on/removal takes effect immediately |
| Nav gating | Unentitled modules hidden |
| View guard | Deep-linked gated view shows locked screen |
| Request → ticket | Upgrade request appears in COP Support Desk |

**Definition of Done (delta):** `hasFeature()` resolves override→plan default; enforced in both nav and view guard; **Lending will ship gated OFF for all schools this cycle.**

---

## M17. Super Admin / Core Operations Portal (COP)

**User journey.** The CASPAA team onboards schools, reviews the **verification queue** of self-registered proprietors, assigns plans/features, watches revenue and platform analytics, resolves support tickets against SLAs, manages internal RBAC, and audits everything. *(Lending/disbursement console is part of COP but is ON HOLD this cycle.)*

**User stories (condensed)**
- Onboard schools; review and approve/reject self-registration documents; suspend/reactivate; assign plan & features.
- Track revenue (MRR/ARR, commissions); export reports.
- Manage support tickets with SLA + escalation.
- Manage COP team RBAC; immutable activity logs.
- View platform analytics (schools, MAU, adoption, performance).

**Flow — School onboarding & lifecycle (COP)**
```
COP → School Management → Create School (details, plan, feature modules)
→ system generates school ID + admin credentials → onboarding email sent → status Onboarding
   (or: proprietor self-registers via M32 → status Pending verification → COP reviews documents
    → Approve → status Onboarding, or Reject with a reason shown back to the proprietor)
Ops completes config (classes, staff, fees, calendar) → status Active → appears in COP dashboard
Suspend / Reactivate → blocks / restores all school-side logins → audited
```

**Acceptance criteria (highlights)**

| Criteria | Expected outcome |
|---|---|
| Onboard school | Unique ID; admin credentials; modules per plan |
| Verification decision | Approve unlocks the dashboard; reject shows the reviewer's reason to the proprietor and allows re-submission |
| Suspend school | All school-side logins blocked immediately; audited |
| Feature flag toggle | School access changes without redeploy; logged |
| Support SLA | Countdown per ticket; auto-escalate on breach |
| RBAC | Users see only permitted modules; logs immutable |
| Analytics export | Excel/CSV/PDF with applied filters |

**Definition of Done (delta):** COP actions are audited and RBAC-enforced; the **Lending & Disbursement** console is present but **disabled/hidden** while loans are on hold.

---

## ⏸ M18. Lending / Loans — **ON HOLD (not being built this cycle)**

Documented for continuity only. **No lending work is in scope this cycle.** All loan entry points (parent "Apply for loan", finance "Lending", COP disbursement console) will ship **gated off** via the `lending` entitlement so no loan flow is reachable.

**Deferred scope (for when resumed):** parent loan application + live credit score (5-factor), finance/COP review & approval, disbursement console, repayment schedule & monitoring, PAR/default analytics, lending KPIs.

**Definition of Done when resumed (future):** credit score shown pre-submit; approval generates schedule; disbursement logged as transaction; repayments reduce balance; overdue escalation + PAR. *(Not in this build's DoD.)*

---

## M19. Learning & Content

**User journey.** A teacher uploads lesson plans, notes, videos and materials to a class; students open the Learning area to study those resources at home; teachers keep their plans and content organised per subject and term.

**User stories**
- As a teacher, I want to **write lesson plans and class notes** and **attach materials** (files, links, video) so my teaching is planned and resources are accessible.
- As a student, I want to **access lesson notes and learning materials** uploaded by my teachers so I can study at home.
- As an admin, I want **oversight of learning materials** school-wide.

**Flow — Publish & consume content**
```
Teacher → Lessons & Content → New (title, subject, class, term) → attach notes/files/links → Publish
Student → Learning → sees materials for their classes → open / download to study
Admin → Academic → Learning materials → view all published content
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Publish to a class | Only students in that class/subject see it |
| Attachments supported | Files, links and video render/download correctly |
| Draft vs published | Unpublished content hidden from students |
| Admin oversight | All school materials visible to admin |

**Definition of Done (delta):** content scoped to the correct class/subject; large files handled gracefully; unpublished drafts never leak to students.

---

## M20. Behaviour & Discipline

**User journey.** A teacher or admin logs a behaviour incident (or a merit) against a student with category and action taken; the record appears on the student's profile and behaviour view; parents and students see the relevant summary; patterns inform pastoral care.

**User stories**
- As a teacher/admin, I want to **record a behaviour incident or merit** with category, description and action taken.
- As an admin, I want to **apply a sanction** (warning, detention, suspension) with a reason and date.
- As a student/parent, I want to **see the behaviour record** so there are no surprises.

**Flow — Log behaviour**
```
Teacher/Admin → Behaviour → New Record (student, type: incident/merit, category, note, action)
→ saved to student profile; parent notified for significant incidents
Admin → apply sanction (type, reason, dates) → reflected on student status where applicable
Student/Parent → Behaviour → see records and standing
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Record logged | Appears on student profile with timestamp and author |
| Merit vs incident | Distinguished; merits can feed house points |
| Sanction with dates | Suspension reflects on active status for its period |
| Parent visibility | Significant incidents notified; history viewable |

**Definition of Done (delta):** records are auditable and attributed; sanctions with a duration auto-expire; a suspension raised here appears in the M1 Suspensions register; parent notification fires for incidents above an agreed threshold.

---

## M21. Messaging (Teacher ↔ Parent)

**User journey.** A parent messages their child's teacher (or vice-versa) in a direct thread; both are notified of replies; the conversation is threaded and archived; admin can oversee threads for safeguarding. Distinct from the Diary (M8), which is teacher-initiated notes.

**User stories**
- As a parent, I want to **message my child's teacher directly** about my child.
- As a teacher, I want to **message a parent** and see our conversation history.
- As an admin, I want **oversight of all conversations** for safeguarding.

**Flow — Direct message**
```
Parent → Communications → select teacher → send message → teacher notified
Teacher → Messages → reply → parent notified → threaded conversation continues
Admin → Communications → Oversight → read-only view of all threads
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Direct thread | Message reaches the right recipient; reply notified |
| Threaded & archived | Full history preserved and searchable |
| Oversight | Admin sees threads read-only, never injected into them |
| Scoped | Parents can only message staff linked to their child |

**Definition of Done (delta):** messaging is scoped to legitimate teacher–parent relationships; admin oversight is read-only; a notification fires on each new message.

---

## M22. Front Desk (Tours & Career Leads)

**User journey.** A prospective parent books a school tour on the public site; a job-seeker submits a career enquiry. Both land in **Front Desk** as fresh leads with a badge on the admin's nav. The front-desk officer works each lead to an outcome — confirm the tour, mark it completed, convert the family into an admission application, or shortlist the candidate — so nothing that arrives from the public site is ever lost. Front Desk is the school's inbox for people who are not yet on the platform.

**User stories**
- As a front-desk officer, I want **tour requests from the public site to arrive in one place** with a new-lead count, so I can respond the same day.
- As a front-desk officer, I want to **move a tour through Requested → Confirmed → Completed / Cancelled** so I always know what is outstanding.
- As an admin, I want to **convert a completed tour into an admission application** without re-typing the family's details.
- As an admin, I want **career enquiries** captured with the applicant's role interest and CV so hiring has a pipeline.
- As an admin, I want a **single view of pending admissions alongside tours and careers**, so the whole top-of-funnel is one screen.

**Flow — Tour request to admission**
```
PUBLIC:  Visitor → school public site → "Book a tour" → name, phone, email, child's age,
         preferred date → submitted (no account required)
ADMIN:   Front Desk → badge shows new leads → Tour Requests tab
         → Confirm (set date/time, notify family) → Completed / Cancelled
         → "Create application" → prefilled admission application (M1)
CAREERS: Applicant → public site → Careers → role, CV, cover note → Front Desk → Careers tab
         → shortlist / decline → shortlisted candidate can be hired into Staff (M7)
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Public submission needs no account | Tour and career forms submit while signed out |
| New-lead badge | Nav badge counts only unworked tours + careers; clears as they are actioned |
| Status transitions | Requested → Confirmed → Completed / Cancelled; each stamped with actor and time |
| Confirmation notifies family | Family receives confirmation with date and time on their given channel |
| Convert to application | Prefills name, contact and child's age into a new admission application; no re-keying |
| Careers pipeline | Role interest and attachment retained; shortlisted candidates convertible to staff |
| Stat cards | New tours, new career leads, pending admissions and total tours match the underlying tables |
| Empty state | "No tour requests yet" shown rather than an empty table |

**Definition of Done (delta)**
- Every public submission is tenant-scoped to the school whose site it came from — a lead can never surface in another school's Front Desk.
- Leads are never hard-deleted; cancelling sets a status so the funnel-conversion metric stays honest.
- Converting a tour to an application links the two records so the source of every admission is traceable.
- Front Desk actions (confirm, cancel, convert, shortlist) write `auditLog` entries.

---

## M23. Operations Hub (Visitor Log · Library · Inventory & Assets · Activities & Clubs)

**User journey.** The daily running of the physical school lives in one hub. The gate records who is on the premises; the library lends and chases books; the storekeeper tracks stock, issues and write-offs; the activities coordinator runs clubs and sees whether each one pays for itself. Sickbay (M12) is the fifth tab of the same hub and is specified separately.

This module has four sub-modules, each with its own stories, flow and acceptance criteria.

---

### M23.1 Visitor / Gate Log

**User journey.** Anyone entering the premises is checked in at the gate against who they came to see and why; the school can see at any moment exactly who is on site; the visitor is checked out on the way home, leaving a complete dated record for safeguarding and emergencies.

**User stories**
- As gate staff, I want to **check a visitor in** against the staff member they came to see, with purpose and vehicle, so entry is controlled.
- As gate staff, I want to **check a visitor out** in one tap so the on-premises count is always right.
- As an admin, I want to know **who is currently on premises** at a glance for a fire roll-call.
- As an admin, I want an **authorised pickup person recognised at the gate**, so a child is never released to the wrong adult.

**Flow — Check-in / check-out**
```
Gate → Operations → Visitor Log → Check-in Visitor
     → visitor name, relation, who they are here to see (staff picker), purpose, vehicle
     → saved with check-in timestamp; "Currently on Premises" count increments
Gate → row → "Check out now" → check-out timestamp recorded; count decrements
Pickup → gate checks the child's approved-pickup list (M11) before release
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| On-premises count | Equals visitors with a check-in and no check-out |
| Check-out is one action | Single tap from the row; time stamped, not editable afterwards |
| Staff picker | "To see" lists only active staff of this school |
| Today counter | Counts only check-ins dated today |
| Sorting | Newest check-in first |
| Vehicle recorded | Optional; "Foot" excluded from the with-vehicle count |
| Unapproved pickup | Gate is shown a clear warning; release requires an admin override that is logged |

**Definition of Done (delta):** the log is append-only — entries can be checked out but never edited or deleted; an open (un-checked-out) visit from a prior day is flagged rather than silently carried forward.

---

### M23.2 Library

**User journey.** The librarian catalogues titles with copy counts, issues copies to students and staff against a due date, takes them back in, and works an overdue list. Availability is always derived from what is actually out.

**User stories**
- As a librarian, I want to **add books with a total copy count** so the catalogue reflects the shelf.
- As a librarian, I want to **issue a copy to a student** with a due date, and **take it back**.
- As a librarian, I want an **overdue tab** so I can chase late returns.
- As an admin, I want **overdue books surfaced on my dashboard** so it does not go unnoticed.
- As a student, I want to **see what I have on loan** and when it is due.

**Flow — Issue and return**
```
Librarian → Operations → Library → Catalog → Add Book (title, author, category, copies)
          → Issue (book, borrower, due date) → copiesAvailable decrements → appears in Active Loans
          → Return → returnedAt stamped → copiesAvailable increments → leaves Active Loans
Overdue  → any active loan past dueDate appears in Overdue with a day count
Dashboard → admin sees "N overdue library books" chip linking to the Overdue tab
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Availability derived | copiesAvailable = copiesTotal − active loans; never edited directly |
| Cannot over-issue | Issue blocked when no copy is available |
| Overdue definition | Active loan with dueDate < today; recomputed daily, not stored stale |
| Return frees a copy | Availability increases immediately and the loan leaves Active |
| Stat cards | Titles, copies available/total, on loan, overdue all reconcile to the loans table |
| Dashboard chip | Overdue count on the admin dashboard matches the Overdue tab |
| Borrower view | A student sees their own loans and due dates only |

**Definition of Done (delta):** loan history is retained after return (for a borrowing history per student); a book cannot be deleted from the catalogue while copies are on loan.

---

### M23.3 Inventory & Assets

**User journey.** The storekeeper records everything the school owns and consumes — books, stationery, equipment, uniforms, furniture, sports gear — with a unit cost, a supplier and a minimum stock level. Items are issued out, restocked in, or written off, and every movement is kept as history. When something drops below its minimum, it is flagged and appears on the admin's dashboard so it is reordered before it runs out.

**User stories**
- As a storekeeper, I want to **add an item** with category, quantity, unit cost, minimum stock and supplier.
- As a storekeeper, I want to **issue, restock and write off** stock, so quantity always matches the store room.
- As a storekeeper, I want a **movement history per item**, so a discrepancy can be traced.
- As an admin, I want **low-stock items flagged** and surfaced on my dashboard.
- As finance, I want **stock value** (quantity × unit cost) so the asset position is visible in the P&L.
- As a storekeeper, I want to **export purchase orders** for items needing reorder.

**Flow — Stock movement**
```
Store → Operations → Inventory → Add Item (name, category, qty, unit cost, min stock, supplier)
      → Issue    (qty out, to whom, reason)   → quantity decreases, movement logged
      → Restock  (qty in, supplier, cost)     → quantity increases, unit cost may update
      → Write Off(qty, reason)                → quantity decreases, loss recorded against P&L
      → History  → dated list of every movement with actor and reason
Low stock (qty < minStock) → LOW badge on the row + dashboard chip + purchase-order export
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Category filter | Filtering to a category shows only that category; "All" shows everything |
| Low-stock rule | Row badged LOW when quantity < minStock; count matches the stat card and dashboard chip |
| Stock value | Total = Σ(quantity × unitCost) across all items |
| Issue cannot go negative | Issuing more than available is blocked with a clear message |
| Movement history | Every issue/restock/write-off appears dated, with actor and reason |
| Write-off is distinct | Recorded as a loss, not as an issue |
| Purchase-order export | Exports items at or below minimum, grouped by supplier |
| Empty state | Category-aware empty message ("No items in the Sports category") |

**Definition of Done (delta):** quantity is only ever changed through a logged movement — never edited directly; write-offs post to the correct budget category so the P&L (M5) reflects the loss.

---

### M23.4 Extracurricular Activities & Clubs

**User journey.** The coordinator sets up clubs, sports and enrichment programmes with a per-student fee and a per-student instructor cost, enrols students, and sees at a glance which activities make money and which do not. Under-subscribed clubs are flagged so they can be promoted or closed rather than quietly losing money.

**User stories**
- As a coordinator, I want to **create an activity** with a fee per student and an instructor cost per student.
- As a coordinator, I want to **enrol students** into an activity.
- As an admin, I want **revenue, cost and net income per activity** so I know which clubs are viable.
- As an admin, I want **under-subscribed clubs flagged** so I act before the term is wasted.
- As a parent/student, I want to **see which activities the child is enrolled in**.

**Flow — Run an activity**
```
Admin → Operations → Activities → Add Activity (name, icon, fee/student, instructor cost/student)
      → enrol students → enrolled count, revenue, cost and net recompute live
      → activity fee flows into the student's ledger (M5) as a line item
Insight → any activity with 1–4 students enrolled raises a "review viability" insight (M31)
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Per-activity economics | Revenue = enrolled × fee; Cost = enrolled × instructor cost; Net = revenue − cost |
| Totals | Header totals equal the sum of the rows |
| Negative net signalled | A loss-making activity is visually distinguished, not just by sign |
| Viability insight | An activity with between 1 and 4 enrolments raises an insight; zero-enrolment does not |
| Ledger link | An activity fee appears as its own itemised charge on the student's ledger |
| Enrolment scoping | Only students of this school (or active branch) can be enrolled |
| Empty state | "No activities yet" with an add call to action |

**Definition of Done (delta):** activity income and instructor cost land in the cost-centre P&L (M5) without double-counting against fee invoices; unenrolling a student does not silently remove an already-billed charge — it raises a credit line instead.

---

**Operations Hub — Definition of Done (module-wide)**
- All four sub-modules are tenant- and branch-scoped through `currentSchoolId()`.
- Each is independently role-gated per the permissions matrix (finance sees inventory value and activity P&L but not the gate log).
- Every state-changing action (check-in/out, issue/return, stock movement, enrolment) writes an `auditLog` entry.
- The hub remembers the last tab used within a session (`opsTab`) and deep-links from dashboard chips land on the right tab.

---

## M24. School Store

**User journey.** The school sells uniforms, books and sundries to parents. Finance defines each item with both a **cost price and a selling price**, records which student bought what, and reads a **margin analysis** showing whether the store is actually profitable per item. Purchases post to the student's ledger so the family sees one statement, not two.

> **Distinct from Inventory (M23.3):** Inventory tracks what the school *consumes and owns*; the Store tracks what the school *sells to parents* and the margin it makes.

**User stories**
- As finance, I want to **define items with cost price and selling price** so I know my margin before I sell.
- As finance, I want to **record a student purchase** (item, quantity) so it bills the right family.
- As finance, I want purchases to **appear on the student's ledger** as an itemised line, not lumped into fees.
- As finance, I want a **margin analysis** showing margin per item, units sold and stock value at cost.
- As a parent, I want **store purchases itemised on my statement** so I can see what I am being charged for.
- As an admin, I want **store income in the P&L** so the store's contribution is visible.

**Flow — Catalogue to statement**
```
Finance → School Store → Item Catalogue → Add Item (name, category, unit, cost price, selling price, stock)
        → margin and margin % computed and badged (≥30% good · 15–29% fair · <15% warn)
        → Sales & Purchases → record purchase (student, item, qty)
        → charge posted to that student's ledger as its own dated line item
        → Margin Analysis → per-item units sold, revenue, cost of goods, margin, stock value at cost
PARENT  → Fees / Wallet → sees "2 × School Uniform (Set)" as its own charge line on the statement
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Margin computed | Margin = selling − cost; margin % = margin ÷ selling, rounded |
| Margin banding | ≥30% success · 15–29% info · <15% warning; banding is never colour-only |
| Purchase posts to ledger | Appears as its own itemised charge line with quantity and date |
| Units sold | Sums quantity across purchases, not purchase count |
| Stock value | Stock × cost price, shown at cost not at selling price |
| Inactive items | Deactivated items disappear from the catalogue but remain on past purchases and statements |
| Zero selling price | Margin % shows 0 rather than dividing by zero |
| Store income in P&L | Store revenue and cost of goods appear in the cost-centre overview |

**Definition of Done (delta)**
- A purchase is a ledger charge, so it obeys the M5 invariant `debitTotal − creditTotal = balance`.
- Reversing a purchase raises a credit line; it never deletes the original charge.
- Cost price is never exposed to parents in any view, statement or receipt.
- Store item changes and purchase records write `auditLog` entries.

---

## M25. School Settings & Branding

**User journey.** On day one the proprietor uploads their logo and sets their colours, so every report card, statement and receipt carries the school's identity rather than CASPAA's. From the same place they configure the academic structure, term dates, custom lists, staff roles and permissions, notification behaviour, AI features, payment gateway keys and data backup — the single place where "how this school works" is set.

**User stories**
- As an owner, I want to **upload my logo and set my brand colours**, so printed documents look like my school's.
- As an owner, I want to **configure academic structure** (sessions, classes, subjects, grading) in one place.
- As an owner, I want to **define term dates** that the whole calendar anchors to.
- As an owner, I want to **manage custom lists and options** (categories, houses, expense heads) without asking support.
- As an owner, I want to **create staff roles with specific permissions**, so a bursar sees finance and not staff records.
- As an owner, I want to **configure notification channels and triggers** (see M28).
- As an owner, I want to **toggle AI features** on or off (see M31).
- As an owner, I want to **enter my payment gateway credentials**, so collections land in my account.
- As an owner, I want to **back up and restore my data**, so I am not locked in.
- As an owner, I want to **see and manage my plan and billing** (see M30).

**Flow — First-run branding**
```
Owner → School Settings → Branding → upload logo, set primary colour, school address, motto
      → Save → applied immediately to nav, report cards, statements, receipts and print views
Owner → Academic tab → sessions, classes, subjects, grade boundaries
      → Calendar tab → term start/end dates and holidays (feeds M9)
      → Lists & Options → expense categories, houses, activity categories, visit purposes
      → Roles & Permissions → create role → tick permitted modules → assign to staff
      → Payment Gateway → Paystack keys → test connection
      → Data Backup → export full tenant snapshot / restore from file
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Branding applies everywhere | Logo and colour appear on nav and every print/export without a reload |
| Logo constraints | Oversized or wrong-format uploads rejected with a clear message, not silently |
| Term dates single source | The calendar (M9) and every term-anchored module read these dates only |
| Custom lists propagate | A new expense category is immediately selectable in Expenses |
| Custom role enforcement | A user with a custom role sees exactly the ticked modules — nav and deep-link both |
| Gateway keys | Stored write-only (masked after save); a test connection reports success or the actual error |
| Backup export | Produces a complete, re-importable snapshot of this tenant only |
| Restore is guarded | Requires explicit confirmation naming the school; never runs on a mis-click |
| Tab deep-link | `adm_settings` with a tab parameter opens that tab directly (e.g. from the Upgrade Plan button) |

**Definition of Done (delta)**
- Settings are per-tenant and branch-aware — a branch inherits group branding unless it overrides it.
- Payment gateway secrets are never rendered back to the client after save and never appear in the audit log payload.
- Every settings change writes an `auditLog` entry naming the setting, the old value and the new value.
- A restore is refused rather than partially applied if the snapshot's school ID does not match the current tenant.

---

## M26. Reports & Analytics (School)

**User journey.** The proprietor opens Reports to answer the questions a board or a bank asks: how many children do we have and is that growing, why are children leaving, how good is attendance, are we collecting our fees, and how is the admissions funnel converting. Everything is filterable and exportable, and there is a print centre for the documents that have to leave the building on paper.

**User stories**
- As an owner, I want an **insights tab** that tells me what needs attention today (see M31).
- As an owner, I want an **enrolment report** — headcount, trend, class and gender distribution.
- As an owner, I want a **leavers report** — who left, when and why — so I can act on churn.
- As an owner, I want an **attendance report** by class and period.
- As an owner/finance, I want a **financial report** — billed, collected, outstanding, expenses, P&L.
- As an owner, I want an **applications report** so I can see admissions funnel conversion.
- As an owner, I want a **print & export centre** for report cards, statements, registers and lists in bulk.
- As finance, I want to **export a P&L and an accounting-package journal** so my accountant is not re-keying.

**Flow — Report to export**
```
Admin → Reports → tab (Insights · Enrolment · Leavers · Attendance · Financial · Applications · Print & Export)
      → apply filters (term, class, date range)
      → Export → CSV/Excel/PDF of exactly what is on screen, with filters applied and stated
Financial tab → Export P&L  ·  Export accounting journal
Print & Export → bulk-select (e.g. a whole class) → print report cards / statements / registers
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Figures reconcile | Every report total matches its source module (enrolment = active students, financial = ledger) |
| Filters applied to export | The export contains the filtered set, and states the filters used |
| Insights badge | Critical-insight count on the tab matches the Insights tab content |
| Financial tab reuse | Renders the same computation as Finance Reports — never a second, divergent calculation |
| Print centre | Bulk print produces one document per student with school branding and a computer-generated footer |
| Empty period | A term with no data shows an empty state, not a zeroed chart implying real zeros |
| Branch scope | When a group owner is switched into a branch, reports cover that branch only |

**Definition of Done (delta)**
- Reports are read-only — no report view can mutate data.
- Every export is generated client-side from the same in-memory dataset the screen rendered, so screen and file can never disagree.
- Large exports stream or chunk rather than freezing the page.
- Exports are watermarked with school name, generated-by and generated-at.

---

## M27. Audit Log

**User journey.** Something looks wrong — a student's status changed, a payroll run was approved, a result was altered. The owner opens the Audit Log, filters by category and date range, searches the student or staff name, and sees exactly who did what and when. Nothing in the log can be edited or removed, including by the owner.

**User stories**
- As an owner, I want an **immutable record of sensitive actions** with actor, action, target and timestamp.
- As an owner, I want to **filter by category** — students, staff, finance, academic — so I can narrow an investigation.
- As an owner, I want to **filter by date range** (7d / 30d / term / all).
- As an owner, I want to **search by name** to see everything that happened to one student or one staff member.
- As CASPAA support, I want the audit log to be the **first place we look** when a school reports a discrepancy.

**Flow — Investigate**
```
Owner → Audit Log → category (All · Students · Staff · Finance · Academic)
      → date range (7d · 30d · This term · All)
      → search "Chidera" → chronological list, newest first
      → each row: colour-coded action label, actor, target, timestamp, and a link to the record
```

**Covered action categories** (indicative, not exhaustive)

| Category | Actions logged |
|---|---|
| Students | login, added, updated, promoted, bulk promoted, bulk graduated, graduated, transferred out, withdrawn, suspended, status changed, promotion deferred, refund issued |
| Staff | hired, terminated, updated |
| Finance | payroll draft created, submitted, approved, paid; payments; refunds; ledger adjustments |
| Academic | lesson plan note added/updated/deleted, appraisal cycle opened, appraisal outcome set, result approved |
| Settings | branding changed, role permissions changed, gateway configured, backup restored |

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Immutability | No UI path edits or deletes an entry; attempts fail closed |
| Every sensitive action | Each action listed in the categories table produces exactly one entry — no duplicates, no gaps |
| Actor recorded | Entry names the acting user, not just the role |
| Category filter | Filtering returns only actions mapped to that category; "All" returns everything |
| Date range | 7d / 30d / term / all filter correctly against entry timestamps |
| Search | Matches actor and target names, case-insensitive |
| Ordering | Newest first, consistently |
| Uncategorised action | Still listed under "All" rather than being invisible |
| Empty result | "No matching activity" state, distinct from "no activity at all" |
| Secrets excluded | No entry contains a password, token or gateway key |

**Definition of Done (delta)**
- Writing an audit entry is part of the action's transaction — if the entry cannot be written, the action does not silently succeed.
- Entries are tenant- and branch-scoped; a group owner sees a branch's log only while switched into it.
- Retention is at least the full academic session; nothing is pruned within it.
- The COP-side activity log (M17) follows the same rules for CASPAA-team actions.

---

## M28. Notifications & Channels

**User journey.** A school decides how it talks to parents: WhatsApp, email, in-app, or a combination. It switches on the automatic triggers it wants — absence alerts, fee reminders, results published, birthdays — and from then on the platform notifies the right person at the right moment without anyone remembering to. Every user has a notification bell showing what concerns them.

> **Channel decision (May 2026):** **SMS is disabled platform-wide.** The toggle ships visible but locked off, with the reason stated, so schools are not left wondering. WhatsApp, email and in-app are the supported channels.

**User stories**
- As an owner, I want to **choose default channels** (WhatsApp, email, in-app) for outbound notifications.
- As an owner, I want to **switch automatic triggers on and off** individually.
- As an owner, I want to know **why SMS is unavailable**, rather than finding a dead toggle.
- As any user, I want an **in-app notification bell** showing what is relevant to me, with unread state.
- As a parent, I want notifications that are **about my child only**.
- As an owner, I want **safeguarding-critical notifications to fire regardless of trigger settings**.

**Automatic triggers** (configurable per school)

| Trigger | Fires to | Default |
|---|---|---|
| Student marked absent | Parent | On |
| Student marked late | Parent | On |
| Fee due in 7 days | Parent | On |
| Fee due in 1 day | Parent | On |
| Assignment posted | Student + parent | On |
| Results published | Student + parent | On |
| Student's birthday | Parent | On |
| Sickbay send-home / referral | Parent | **Mandatory — not switchable** |
| Bus status change | Parents on route | On |
| House points awarded | Student + parent | On |

**Flow — Configure and fire**
```
Owner → School Settings → Notifications → default channels (WhatsApp · Email · In-app; SMS locked)
      → Automatic Triggers → toggle each trigger on/off
RUNTIME: module action (e.g. attendance submitted with an absentee)
      → notification service resolves: is the trigger on? who is the recipient? which channels?
      → dispatch per channel + always write an in-app notification
USER  → bell icon → unread count → open → item marked read → deep-links to the record
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Channel config respected | A disabled channel is not used by any module |
| SMS locked | Toggle rendered disabled and off, with the platform reason shown; cannot be enabled |
| Trigger off | No notification is sent for that event on any channel |
| Mandatory triggers | Sickbay send-home/referral fires even with every trigger switched off |
| Recipient scoping | A parent receives notifications only for their own children |
| In-app always written | Even when external channels fail, the in-app notification exists |
| Unread state | Bell count matches unread items; opening an item clears exactly that item |
| Deep-link | Opening a notification lands on the relevant record, not a generic list |
| Delivery failure | Logged and visible to the school; never fails the originating action |
| Offline | Notifications queued offline dispatch on reconnect without duplicating |

**Definition of Done (delta)**
- No module composes or dispatches a notification directly — everything goes through the notification service, so channel and trigger config are honoured in one place.
- A notification is never the reason a business action fails; dispatch errors are logged, not thrown.
- Duplicate suppression: the same trigger for the same target on the same day sends once.
- Notification content never includes another family's data.

---

## M29. Help & Support (School-side)

**User journey.** An admin is stuck. Rather than hunting for a phone number, they open Help & Support inside the product: a live chat with CASPAA support, a ticket list showing everything they have raised and its status, and a searchable help centre for the answers that do not need a human. Feature requests raised through entitlement gating (M16) land here too, so the school can follow them.

> **Distinct from the COP Support Desk (M17):** this is the *school-facing* side of the same conversation. M17 is the CASPAA agent's queue; M29 is the school's view of their own tickets.

**User stories**
- As an admin, I want to **chat with CASPAA support in-product** and get a fast answer.
- As an admin, I want to **raise a ticket** and **see its status** without emailing anyone.
- As an admin, I want a **help centre** I can search before raising anything.
- As an admin, I want a **feature request I raised from a locked screen to appear in my tickets**, so I can follow it.
- As a school on an expiring plan, I want a **direct route to support from the billing screen**.

**Flow — Get help**
```
Admin → Help & Support → Live Chat (opens with a greeting; agent name and typical reply time shown)
      → My Tickets  → open-ticket badge; each ticket shows status, last update and thread
      → Help Centre → searchable articles by module
Locked view (M16) → "Request this feature" → creates a ticket visible here and in the COP desk (M17)
Billing (M30)     → "Contact CASPAA support" → opens this module
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Chat opens ready | A greeting message exists on first open; the school never faces a blank chat |
| Chat persists | History survives navigation and reload; scoped to this school |
| Ticket badge | Counts tickets not in `resolved`; clears when resolved |
| Two-way tickets | An agent reply from the COP desk appears here and notifies the school |
| Feature request | Appears in My Tickets with its own type, and in the COP Support Desk |
| Help centre search | Returns relevant articles; a no-result search offers to raise a ticket |
| Scoping | A school only ever sees its own tickets and its own chat |
| Offline | Chat and ticket composition degrade gracefully with a clear "will send when back online" state |

**Definition of Done (delta)**
- Support content is tenant-scoped — no ticket, message or attachment can surface across schools.
- Ticket status is a single shared truth with M17: the school's view and the agent's queue can never disagree.
- Support is reachable from every gated/locked screen and from billing, not only from the nav item.
- Help & Support is **never** entitlement-gated — a school that cannot pay must still be able to ask why.

---

## M30. Subscription Billing & Plan

**User journey.** The proprietor sees which plan they are on, what it includes, what it costs and when it renews. They can upgrade — paying a pro-rata difference immediately and getting the new features at once — or schedule a downgrade for the end of the current period. Subscription invoices are paid by card, transfer or USSD from inside the product, and auto-renew can be switched off. As renewal approaches, the dashboard warns them.

> **Distinct from M16 (Entitlements):** M16 decides *what a school can see*; M30 is *what the school pays and when*. M16 reads the plan; M30 changes it.

**User stories**
- As an owner, I want to **see my current plan, its price and its renewal date**.
- As an owner, I want to **see what my plan includes** and what the tier above adds.
- As an owner, I want to **upgrade immediately**, paying only the **pro-rata** difference for the remaining period.
- As an owner, I want to **schedule a downgrade** to take effect at the end of my paid period, not immediately.
- As an owner, I want to **cancel a scheduled change** before it takes effect.
- As an owner, I want to **turn auto-renew off** without losing access to the period I have paid for.
- As an owner, I want to **pay a subscription invoice by card, transfer or USSD**.
- As an owner, I want to **buy add-ons** beyond my plan.
- As an owner, I want a **renewal warning** on my dashboard before I am cut off.

**Flow — Upgrade, downgrade, pay**
```
Owner → School Settings → Billing & Plan
      → current plan, price, renewal date, auto-renew state, open invoices
UPGRADE   → choose higher tier → pro-rata amount for the remaining period shown → confirm
          → pay (card / transfer / USSD) → entitlements (M16) widen immediately
DOWNGRADE → choose lower tier → "takes effect on <renewal date>" → scheduled, not applied
          → features remain until then → Cancel scheduled change available at any time
RENEWAL   → ≤30 days: amber dashboard chip · ≤7 days: red chip → both deep-link to Billing
AUTO-RENEW→ toggle off → access continues to period end, then lapses
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Pro-rata correctness | Upgrade charge reflects only the unused remainder of the current period |
| Upgrade is immediate | New entitlements available without a re-login or redeploy |
| Downgrade is deferred | Features persist until the renewal date; nothing is removed on the spot |
| Scheduled change visible | The pending change and its effective date are shown until it applies or is cancelled |
| Cancel scheduled change | Restores the current plan with no charge or credit side-effect |
| Auto-renew off | Access continues to period end; the state is clearly shown |
| Payment methods | Card, transfer and USSD each complete and mark the invoice paid |
| Idempotent payment | A double-submit never charges twice |
| Renewal warning | ≤30 days amber, ≤7 days red, on the owner's dashboard, deep-linking to Billing |
| Add-ons | Purchasing an add-on turns on exactly that feature via M16, and no other |
| Owner only | No other role can view or change plan and billing |

**Definition of Done (delta)**
- Billing state and entitlements are consistent at every moment — a paid upgrade that fails to widen entitlements is a P1 defect.
- Subscription invoices are separate from school fee invoices (M5) and never appear in a parent's ledger.
- Every plan change, payment, auto-renew toggle and scheduled change writes an `auditLog` entry.
- A lapsed subscription degrades to a locked screen with a pay-now route and working Help & Support (M29) — never to a blank page or data loss.

---

## M31. AI Assistant & Insights

**User journey.** Instead of reading six reports, the proprietor opens Insights and is told what needs attention today, ranked by severity, each with a link straight to the screen where it is fixed: overdue invoices, collection below target, applications going stale, children absent three days running, clubs that are not viable. Elsewhere, AI drafts report-card comments from scores, times fee reminders, and flags students at risk.

> **Scope note.** These features are **rule-based and templated by design** in this build — deterministic, explainable and offline-capable. Generative-LLM features are Phase 2 (see Out of scope). The label "AI" in the product is a user-facing name, not a claim of a model in the loop.

**User stories**
- As an owner, I want a **prioritised list of what needs attention**, with a link to act on each item.
- As an owner, I want **critical items badged on the Reports nav** so I do not have to go looking.
- As a teacher, I want **report card comments drafted from scores**, which I can edit before submitting.
- As finance, I want **fee reminders timed intelligently** rather than blasted on a fixed day.
- As an admin, I want **students at risk of chronic absence flagged** against a threshold I set.
- As an admin, I want **subjects and students needing intervention highlighted**.
- As an owner, I want to **switch each AI feature off** if I do not want it.

**Insight rules** (deterministic, evaluated per school)

| Level | Rule | Links to |
|---|---|---|
| Critical | One or more invoices past due date with a balance | Invoices |
| Critical | A student absent 3+ consecutive days | Attendance |
| Warning | Fee collection below the configured target (default 80%) | Invoices |
| Warning | An admission visit past its scheduled date and unconfirmed | Admissions |
| Info | An application pending 7+ days without review | Admissions |
| Info | A club with 1–4 students enrolled — review viability | Activities |
| OK | No rule fired — "no critical issues detected" | — |

**Flow — Insight to action**
```
Admin → Reports → Insights (badge = count of critical items)
      → items grouped and ordered: critical → warning → info
      → each item states the number, the money or the names involved, and links to the fixing screen
Settings → AI Assistant → toggle: report comments · fee reminders · attendance risk · performance insights
         → set fee-reminder days (default 7 / 3 / 1) and attendance-risk threshold (default 75%)
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Rules evaluate live | Insights recompute on each view against current data — never cached stale |
| Ordering | Critical before warning before info; ties ordered consistently |
| Actionable | Every insight links to the screen where it can be resolved |
| Specificity | Insights state counts, amounts or names — not "some invoices are overdue" |
| All-clear state | An explicit "no critical issues" item when nothing fires, not an empty list |
| Nav badge | Reports badge equals the count of critical insights only |
| Configurable thresholds | Changing the collection target or attendance threshold changes which insights fire |
| Feature toggles | Switching a feature off removes it everywhere it appeared |
| Drafted comments editable | A teacher can always edit or replace a drafted comment before submitting |
| Never auto-submits | No AI feature approves results, sends money, or messages a parent without a human action |
| Branch scope | Insights cover the active branch only |

**Definition of Done (delta)**
- Every insight is explainable — the rule and the numbers behind it are visible to the user.
- Rules run entirely on the tenant's own data, offline-capable, with no student data leaving the tenant.
- A drafted report comment is marked as a draft until the teacher accepts it, and the accepted text is what is stored.
- Thresholds live in School Settings (M25) and are per-school, never hard-coded.

---

## M32. Public Site & Self-Service Acquisition

**User journey.** A prospective parent finds the school online and reads about it, sees pricing, and books a tour — no account needed. Separately, a proprietor who wants CASPAA registers themselves, uploads proof that the school is real (CAC certificate, Ministry of Education approval), and waits behind a **verification gate** that shows exactly where their application stands. When CASPAA approves, the gate lifts and they land in their dashboard. If it is rejected, they see the reviewer's reason and can re-submit without starting again.

**User stories**
- As a prospective parent, I want to **read about the school and book a tour** without creating an account.
- As a prospective parent, I want to **submit an admission application online**.
- As a job seeker, I want to **submit a career enquiry** with my CV.
- As a proprietor, I want to **see pricing and what each plan includes** before I commit.
- As a proprietor, I want a **solution page for my role** so I can see how CASPAA applies to me.
- As a proprietor, I want to **register my school myself** rather than waiting for a sales call.
- As a proprietor, I want to **upload verification documents** and **see my verification status**.
- As a rejected applicant, I want to **see why and re-submit**, not be left guessing.
- As CASPAA ops, I want **unverified schools blocked from the dashboard** so unvetted tenants never touch real data.

**Flow — Discover to verified tenant**
```
PUBLIC   → Home · Pricing · Solutions (per role) · Contact  → Book a tour / Apply / Careers
           → submission lands in Front Desk (M22) or Admissions (M1) of the target school
SIGN-UP  → Register school (name, proprietor, official email, phone, plan interest)
           → upload verification document (CAC / MoE approval / similar; PDF, JPG, PNG)
           → account created with status "pending verification"
GATE     → on every login while pending: verification screen only — no dashboard, no data
           → shows school name, official email, documents submitted, status
           → "Add another document" always available; "Sign out" always available
REVIEW   → COP verification queue (M17) → Approve → gate lifts, onboarding begins
                                        → Reject (+reason) → proprietor sees the reason and re-submits
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Public routes need no account | Tour, application and career forms all submit while signed out |
| Public routes are not the login | A public route renders its page instead of the sign-in screen, and back-navigates cleanly |
| Submission is tenant-targeted | A form on a school's site creates records for that school only |
| Gate blocks everything | A pending or rejected proprietor reaches no dashboard view, and no deep-link bypasses it |
| Gate is informative | Shows status, school name, official email and the documents submitted |
| Rejection shows the reason | The reviewer's note is displayed verbatim to the proprietor |
| Re-submission | Adding a document is possible in both pending and rejected states, and returns the school to review |
| Approval lifts the gate | On the next render the proprietor lands in their dashboard, no re-login required |
| Sign-out always available | The gate never traps a user with no way out |
| Document constraints | Only accepted file types; oversized files rejected with a clear message |
| Support route | Contact details for CASPAA are visible on the gate screen |
| Pricing accuracy | Public pricing matches the plan pricing used by Billing (M30) |

**Definition of Done (delta)**
- The verification gate is enforced at render, before any module resolves — not by hiding nav items.
- No school data is created for, or readable by, an unverified tenant beyond its own registration record.
- Verification documents are stored against the school and visible in the COP queue with the submitting user and time.
- Public form submissions are rate-limited and validated server-side; a malformed or hostile submission cannot create a malformed lead.
- Public pricing and plan features are read from the same source as M16/M30 — never a second hard-coded list that can drift.

---

## M33. Role Dashboards

**User journey.** Every user lands on a dashboard built for their role: the numbers that matter to them, and a short list of things that need doing, each one clickable straight through to the screen that resolves it. The owner sees money and risk; the teacher sees today's classes and unmarked work; the parent sees each child's balance and latest result; the student sees today's timetable and what is due.

**User stories**
- As an owner, I want **school-wide KPIs** (enrolment, billed, collected, outstanding, attendance rate) on landing.
- As an owner, I want **action chips** — low stock, overdue library books, subscription renewing, pending approvals — that link straight to the fix.
- As a principal, I want **results awaiting approval and attendance exceptions** front and centre.
- As finance, I want **collection rate, outstanding and today's payments** on landing.
- As a teacher, I want **today's classes, unmarked submissions and pending leave** on landing.
- As a parent, I want **each child's balance, latest result and any alerts** on landing.
- As a student, I want **today's timetable and what is due** on landing.
- As a group owner, I want my landing to be the **group overview** (M15) when I am not switched into a branch.

**Flow — Land and act**
```
Login → role resolved → role dashboard renders
      → KPI cards (role-appropriate) + action chips derived from live data:
          • N inventory items low on stock        → Operations · Inventory
          • N overdue library books               → Operations · Library
          • Subscription renews in N days         → Settings · Billing
          • N results awaiting approval           → Academic · Results
          • N leave requests pending              → Staff & HR · Leave
          • N pending admission applications      → Admissions
      → click a chip → deep-link to the exact tab that resolves it
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Role-correct content | Each role's dashboard shows only what its permissions allow — finance sees no staff records |
| KPIs reconcile | Every figure matches its source module exactly |
| Chips are live | A chip appears only while its condition holds and disappears once resolved |
| Chips deep-link | Clicking lands on the specific tab, with the relevant filter applied |
| Severity | Renewal ≤7 days is red, ≤30 days amber; severity is never colour-only |
| Empty dashboard | A new school with no data shows a guided "get started" state, not zeros |
| Parent multi-child | Each child is shown distinctly; no figure is aggregated in a way that hides a debt |
| Branch scope | A group owner switched into a branch sees that branch's dashboard; unswitched, the group overview |
| Performance | The dashboard renders without a perceptible delay on a mid-range phone |

**Definition of Done (delta)**
- Dashboards are read-only surfaces — they display and link, they never mutate.
- Every chip's condition is computed from the same rules as the owning module, so the two can never disagree.
- The dashboard degrades gracefully offline, showing last-known figures with a clear "offline — last updated" marker.

---

## M34. COP Platform Settings

**User journey.** The CASPAA operations team controls the platform itself: global feature flags that gate capabilities across every school, the security posture (encryption, MFA, session timeout, backups) and global configuration. Changing a flag changes behaviour everywhere without a redeploy, and every change is attributed.

> **Distinct from M16:** M16 is *per-school* entitlement. M34 is the *global kill switch* — a capability switched off here is unavailable to every school regardless of plan.

**User stories**
- As CASPAA ops, I want **global feature flags** (WhatsApp, lending engine, AI comments, offline mode, transport) so a capability can be turned off platform-wide without a deploy.
- As CASPAA ops, I want **beta capabilities marked as beta**, so nobody mistakes them for GA.
- As CASPAA ops, I want the **security posture visible** — encryption, MFA enforcement, session timeout, backup status.
- As CASPAA ops, I want **every platform-settings change attributed and logged**.

**Flow — Global flag**
```
COP → Platform Settings → Feature Flags
    → toggle (WhatsApp Integration · Lending Engine · AI Report Comments · Offline Mode · Transport [Beta])
    → confirm → applies platform-wide immediately, no redeploy
    → change written to the COP activity log with actor and previous value
COP → Platform Settings → Security → encryption · MFA for admin roles · session timeout · daily backups
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Global flag wins | A capability off here is unavailable to every school, whatever their plan or per-school override |
| No redeploy | The change takes effect on the next render for every tenant |
| Beta labelled | Beta capabilities carry a visible badge wherever they are toggled |
| Lending consistency | With loans on hold, the lending flag's off state is what makes every loan entry point unreachable |
| Security status truthful | Each security row reflects the actual enforced configuration, not a static badge |
| Attribution | Every change records who made it, when, and what the previous value was |
| RBAC | Only COP roles with the platform-settings permission can open or change this screen |
| Confirmation | Turning off a capability in use by live schools requires explicit confirmation naming the impact |

**Definition of Done (delta)**
- Global flags are read through the same resolution path as `hasFeature()` so precedence is unambiguous: **global flag → per-school override → plan default**.
- No school-side screen ever crashes when a global flag flips mid-session; it degrades to the locked state.
- Every change writes an immutable COP activity-log entry.
- Security settings displayed here are read from actual configuration, never hard-coded to "Active".

---

# Assumptions, Risks & Dependencies

## Assumptions

| Assumption | Validation plan | What have we learned? |
|---|---|---|
| Schools accept an offline-first PWA over a native app for v1 | Pilot with 3–5 schools; measure install + usage | [ ] |
| Parents will self-serve payments once statements are transparent | Track pay-online rate vs office payments post-ledger | [ ] |
| Plan tiers + add-ons match how schools want to buy | Test pricing/packaging with pilots | [ ] |
| Multi-branch owners want consolidated view + per-branch isolation (Model A) | Confirmed with owner 2026-07-27; validate in multi-branch pilot | Model A adopted as the design direction |
| Proprietors will self-register and submit verification documents rather than wait for a sales call | Track signup → verified conversion and time-to-verify | [ ] |
| WhatsApp + email + in-app are sufficient without SMS | Monitor parent reach and complaint volume post-SMS-removal | SMS disabled platform-wide, May 2026 |
| Rule-based insights are useful enough without a generative model | Track insight click-through and resolution rate | [ ] |
| Deferring lending doesn't block core adoption | Monitor pilot feedback for loan demand | [ ] |

## Risks

| Risk | Mitigation plan |
|---|---|
| Offline sync conflicts corrupt data | Conflict rules + audit; last-writer + server reconcile; zero-loss on payments |
| Payment/reconciliation errors erode trust | Idempotent payments; narration matching; reconciliation dashboard; >98% accuracy target |
| Feature-gating hides a module a school is entitled to | Seed sensible plan defaults; per-school overrides; QA the nav/view guard per plan |
| Data isolation bug leaks across tenants/branches | All access via `currentSchoolId()`; isolation tests in CI |
| **Verification gate blocks a legitimate school for too long** | SLA on the COP verification queue; status visible to the proprietor; ops alerting on queue age |
| **Public forms abused to create junk leads** | Rate limiting, validation, and soft-delete rather than hard-delete so metrics stay honest |
| **Store/inventory/activity income double-counted in the P&L** | Single ledger posting path; reconciliation test asserting P&L equals ledger |
| **Notification fatigue drives parents to mute the channel** | Per-trigger configuration, duplicate suppression, and per-school defaults tuned in pilot |
| **"AI" naming over-promises what is a rule engine** | Explainable insights showing the rule and the numbers; scope note in-product |
| **Audit log write failure hides a real action** | Audit write is part of the action's transaction — no silent success |
| Scope creep from "build everything" | Phased rollout (P0–P3), feature flags, this PRD as the contract |
| Student-data privacy (minors) | RBAC, audit logs, encryption targets; consent flows |

## Dependencies

| Dependency | Providing team | Committed? (Y/N, who) |
|---|---|---|
| Paystack (card/transfer/USSD) | Payments/Paystack | [ ] |
| WhatsApp Business API | Comms vendor | [ ] |
| Email (SendGrid) | Comms vendor | [ ] |
| ~~SMS gateway (Termii / Africa's Talking)~~ | — | **Dropped — SMS disabled platform-wide, May 2026** |
| Document storage for verification uploads & CVs | Engineering | [ ] |
| Production DB (PostgreSQL, multi-tenant) | Engineering | [ ] |
| Hosting/CI (Vercel now; deploy is manual `vercel --prod`) | Engineering | [ ] |

---

# Appendix

## Solution Ideas (considered)

- **Multi-branch model.** Considered (A) branch = separate tenant + group layer vs (B) single tenant + `branchId` on every record. **Chose A** — lower risk, reuses per-school isolation, every module works per-branch unchanged.
- **Discount model.** Considered a separate discount table vs **negative invoice line items**. Chose negative line items (already supported) surfaced as itemised credit rows in the ledger.
- **Entitlements.** Considered hard-coded plan checks vs a **catalog + per-school override store** (`hasFeature()`). Chose the catalog for custom add-ons.
- **Store vs Inventory.** Considered one stock module vs two. **Chose two** — what the school *sells to parents* (margin, ledger posting) and what it *consumes and owns* (issue, restock, write-off) have different economics and different owners.
- **Onboarding.** Considered sales-led only vs self-registration. **Chose hybrid** — self-registration with a document verification gate, so the funnel is self-serve but no unvetted tenant reaches real data.
- **AI.** Considered a generative model vs a deterministic rule engine for v1. **Chose rules** — explainable, offline-capable, no student data leaves the tenant. Generative is Phase 2.
- **SMS.** Considered keeping SMS as a fallback channel. **Dropped** on cost and deliverability; the toggle ships visible-but-locked so schools understand why rather than finding a dead control.

## Competitor Review

- **Edves** — single unified login with role tabs (Students/Parents/Educator/Admissions); strong in Nigeria. CASPAA differentiates on offline-first + transparent itemised ledger + embedded finance.
- **PowerSchool** — separate heavy admin vs parent/student portals; enterprise/legacy. Heavier than the SME African school segment needs.
- **Spreadsheets + WhatsApp** — the real incumbent; free but fragmented, error-prone, no audit trail.

## Stakeholders

School proprietors & pilot schools; parents & students; CASPAA Operations, Finance, Support, Credit/Risk (for future lending), BI; AfriSprings leadership.

## Open Questions

| Question / Unknown | Plan to answer | Learned? | Resolved? |
|---|---|---|---|
| Final plan tiers & pricing, and which features are add-ons vs included | Pricing test with pilots | | ❌ |
| Are the Year-1 KPI targets (60 schools, ₦1B) committed or aspirational? | Confirm with leadership | | ❌ |
| When does lending resume, and under what licence/partner? | Business/regulatory review | | ❌ |
| Persist active-branch selection across reloads? (currently session-only) | UX decision + small build | | ❌ |
| Extend entitlement enforcement to payroll/AI/WhatsApp (currently nav-enforced for multibranch/lending/transport) | Scope in P3 | | ❌ |
| What is the SLA on the school verification queue, and who owns it? | Ops staffing decision | | ❌ |
| Should the School Store and Inventory share a single stock pool for items that are both sold and consumed? | Pilot with a school selling uniforms from stock | | ❌ |
| Is a live-chat agent staffed during school hours, or is chat asynchronous with an SLA? | Support staffing decision | | ❌ |
| Are audit logs retained beyond the academic session, and for how long? | Compliance review | | ❌ |
| Does a branch inherit group branding, or set its own? | UX decision + small build | | ❌ |

---

# Notes

*(Space for team & stakeholder meeting notes.)*

---

# Changelog

| Change date | Changed by | Description of change |
|---|---|---|
| 2026-09-02 | [PM] | **v4.1** — closed the module-coverage gap. Added **M22 Front Desk**, **M23 Operations Hub** (visitor log · library · inventory & assets · activities & clubs), **M24 School Store**, **M25 School Settings & Branding**, **M26 Reports & Analytics**, **M27 Audit Log**, **M28 Notifications & Channels**, **M29 Help & Support**, **M30 Subscription Billing & Plan**, **M31 AI Assistant & Insights**, **M32 Public Site & Self-Service Acquisition**, **M33 Role Dashboards**, **M34 COP Platform Settings** — each with journey, stories, flow, acceptance criteria and DoD. Added deltas to M1 (returning students, suspensions register, enrolment analytics), M2 (curriculum, assessment structure), M5 (cost-centre/P&L overview) and M7 (staff attendance, salary advances, former staff). Recorded the **SMS platform-wide disable (May 2026)** in Out of scope and Dependencies. Updated the roles table, permissions matrix, must-have list, coverage index, tracking, rollout, risks and open questions to match. |
| 2026-07-27 | [PM] | v4.0 — restructured onto the Academy of Product Management PRD template; added user journeys and Definitions of Done; moved Lending/Loans to **On Hold**; added Student Ledger, Multi-branch Groups and Feature Entitlements modules. |
| June 2026 | — | v3.0 — combined School OS + COP PRD (source content). |

---

## PRD Status key

**Draft** → Planning → Implementing → Measuring → Complete.
This document is **Draft**: soliciting feedback before commitment. Update the status field at the top as it progresses.

*CASPAA — AfriSprings Resources Ltd. · Loans on hold; all other modules in scope.*
