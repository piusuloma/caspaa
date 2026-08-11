# PRD: CASPAA — School Operating System

**Product Requirements Doc**

**Author:** [Product Manager name]
**PRD Status:** Draft
**Version:** 4.0 · Structured on the Academy of Product Management PRD template
**Product:** CASPAA — School ERP + Embedded Finance + Internal Operations Portal
**Company:** AfriSprings Resources Ltd.

> **Scope note for this cycle:** We are building **every module in this document**. The only feature **ON HOLD** is the **Lending / Loans engine** (parent fee loans, credit scoring, disbursement, repayment). It is documented for continuity but is **not in this build** — see *Requirements → Out of scope*.

---

# Overview

## Customer Problem

**Who the customer is.** African (initially Nigerian) K–12 schools — proprietors, administrators, bursars, principals, teachers — and the parents and students they serve. A secondary customer is the **CASPAA operations team** who onboard and run the platform.

**The problem.** Schools run day-to-day operations on paper registers, spreadsheets and WhatsApp:

- **Fees** are hard to track — who has paid, who owes, how much is outstanding — and receipts/records are manual.
- **Attendance, results and report cards** are recorded and computed by hand: slow and error-prone.
- **Parent communication** is fragmented across calls, WhatsApp and printed notes.
- **Staff, payroll and records** live in disconnected files.
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

CASPAA is one platform with a **role-aware experience**: everyone signs in at the same door and lands in the portal built for them. The modules below (M1–M21) are delivered to the roles that need them — this section maps each role to the portal and modules they get, so nothing is missed for any user type.

## Who uses CASPAA, and what they get

| Role | Portal focus | Modules in their portal |
|---|---|---|
| **School Owner / Proprietor** (School Admin) | Runs the whole school and owns the account. For multi-branch schools, the **group owner** with a consolidated overview + branch switcher. | Everything — Students & admissions, Academic, Attendance, Results, Staff & HR, Finance & fees, Payments, Operations (front desk, inventory, transport, health), Communications, Calendar, House points, School store, Reports, **Settings & branding**, **Multi-branch groups**, Audit |
| **Principal** | Academic & HR leadership; result approval; no finance. | Students, Academic, Results **approval**, Staff & HR, Attendance oversight, Calendar & notices, House points, Health, Reports |
| **Finance Officer / Bursar** | The school's money. | Fee structure, Invoicing, **Itemised student ledger / statements**, Discounts, Payments & reconciliation, Expenses, **Payroll & payslips**, School store, Financial reports |
| **Teacher** | Teaching and their classes. | Attendance, Results entry, Assignments & inline marking, CBT / assessments, Lesson plans & materials, Timetable, Teacher–parent diary, House points, **My payslip**, Leave requests, My appraisal |
| **Parent** | Their children. | Per-child dashboards, **Fees & Wallet / Ledger**, Results & report cards, Timetable, Diary, Consent forms, Surveys, Transport & pickup, Health, House points, Announcements |
| **Student** | Their own learning. | Dashboard, Learning & materials, Assignments (submit / resubmit), CBT / assessments, My results, Timetable, Behaviour, House points, My wallet |
| **Super Admin** (CASPAA Operations / COP) | The platform, across all schools. | School onboarding & lifecycle, Revenue, Support desk, **Feature flags & plans**, Analytics, User management / RBAC, Audit |

> **Lending is the only thing on hold in the Parent and Finance portals** — the "Apply for a loan" / "Lending" entry points ship gated off. Every other module in every portal is in scope this cycle.

## Roles & Permissions matrix (school platform)

| Capability | Owner / Admin | Principal | Finance | Teacher | Parent | Student |
|---|---|---|---|---|---|---|
| Student records | ✓ | ✓ | — | Read | Own child | Own |
| Staff records & HR | ✓ | ✓ | — | Own | — | — |
| Results — enter | — | — | — | ✓ | — | — |
| Results — approve | ✓ | ✓ | — | — | — | — |
| Results — view | ✓ | ✓ | — | ✓ | Approved | Approved |
| Fees, invoices, ledger | ✓ | — | ✓ | — | Own | — |
| Payments | ✓ | — | ✓ | — | Own | — |
| Payroll & payslips | ✓ | — | ✓ | Own payslip | — | — |
| Attendance — mark | — | — | — | ✓ | — | — |
| Attendance — view | ✓ | ✓ | — | Class | Own child | Own |
| Assignments / CBT — set & mark | — | — | — | ✓ | — | — |
| Assignments / CBT — take | — | — | — | — | — | ✓ |
| Communications & diary | ✓ oversight | ✓ | — | Write | Read / reply | — |
| Calendar & notices — post | ✓ | ✓ | — | — | — | — |
| House points — award | ✓ | ✓ | — | ✓ | View | View |
| Transport & pickup | ✓ | — | — | — | Own child | — |
| Health / sickbay | ✓ | ✓ | — | — | View | — |
| Multi-branch group | Owner only | — | — | — | — | — |
| School settings & branding | ✓ | — | — | — | — | — |
| Loans *(on hold)* | ⏸ | — | ⏸ | — | ⏸ apply | — |

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
- **Related & dependencies:** Paystack, SMS gateway (Termii/Africa's Talking), Email (SendGrid)
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

**Qualitative**

- A school can be onboarded and run its **essentials end-to-end** — bill, collect, take attendance, publish results, message parents — without paper.
- Parents describe fee handling as **transparent** (itemised statements, real-time receipts).
- Multi-branch owners manage all campuses from **one login** with a consolidated view.

## Requirements — Use Cases

Ranked by importance. **Must-haves** are the essentials needed to hit the success criteria; everything in *Must-have* and *Nice-to-have* is **in this build**. *Out of scope* is deferred.

### Must haves (building now)

- **Auth & tenancy** — role-aware unified login; per-school isolation; offline-first PWA.
- **Students & Admissions** — enrol, bulk CSV, applications, promotion, graduation/alumni, activate/deactivate.
- **Academic** — calendar/terms, class arms, timetable, scheme of work, results broadsheet, library.
- **Attendance** — daily class register with parent absence alerts.
- **Results & Reporting** — teacher entry → admin approval → parent/student view → printable report card.
- **Finance & Fees** — fee structure, invoice generation, **itemised student ledger / statement of account**, discounts breakdown, payments, reconciliation, advance credit, expenses, printable statements & receipts.
- **Payments** — Paystack (card / transfer / USSD), receipts.
- **Staff & HR** — profiles, **payroll**, payslips, leave, appraisals, substitute coverage.
- **Communications** — announcements, notice board, SMS/email campaigns, teacher–parent diary, consent forms, surveys, admin oversight.
- **Calendar & Notice Board.**
- **House Points** — individual awards + inter-house competitions + leaderboard.
- **Transport & Pickup** — routes, assignments, live bus status, authorised pickup approval.
- **Health & Sickbay** — visit logging with mandatory parent notification on send-home/referral.
- **Assessments** — assignments (with inline marking), formative tests / CBT.
- **Learning & Content** — lesson plans, notes and materials; student learning area.
- **Behaviour & Discipline** — incidents, merits, sanctions; student behaviour view.
- **Messaging** — direct teacher ↔ parent conversations (distinct from Diary).
- **Multi-branch / School Groups** — group overview, branch switcher, add-branch on-ramp.
- **Feature Entitlements** — plan-based gating + per-school add-on overrides + upgrade requests.
- **Super Admin / COP** — onboarding, revenue, support desk, feature flags, analytics, RBAC, audit.

### Nice to haves (this build or fast-follow)

- Cost-centre / P&L analytics per department.
- Installment plans on invoices.
- Alumni network enrichment (university/employer) + leaving certificate printing.
- Report scheduling/exports (COP).

### Out of scope (deferred / on hold)

| Item | Status | Reason |
|---|---|---|
| **Lending / Loans engine** (apply, credit score, approve, disburse, repay) | **ON HOLD — not this cycle** | Business decision to defer; documented for continuity. All loan nav/views ship **gated off**. |
| Bulk disbursement / NIBSS direct settlement | Post-MVP | Phase-2 banking integration |
| Savings / investment products | Post-MVP | Requires banking/microfinance licence |
| Cross-border lending | Post-MVP | Regulatory complexity |
| Advanced AI underwriting | Phase 3 | Requires larger dataset |
| Native mobile app | Phase 2 | Web PWA validated first |

## Tracking Requirements

To measure the success criteria, instrument:

- **Onboarding:** schools created, time-to-active, modules enabled per plan.
- **Finance:** billed vs collected vs outstanding per school/branch; receipts generated; reconciliation match rate; statements printed.
- **Engagement:** DAU/MAU by role; attendance submissions/day; results approved; messages/diary notes sent.
- **Entitlements:** feature-request tickets raised; overrides granted; upgrade conversions.
- **Reliability:** uptime, API latency, failed-payment rate, error logs.
- **Audit:** every sensitive action writes an immutable `auditLog` entry (actor, action, target, timestamp).

## Rollout Plan & Milestones

Phased, feature-flagged per school.

| Phase | Contents | Gate |
|---|---|---|
| **P0 — Foundation** | Auth/tenancy, Students, Academic, Attendance, Results | Internal dogfood on seed school |
| **P1 — Money** | Fee structure, invoices, **itemised ledger/statement**, payments, reconciliation, receipts | Pilot schools live on real fees |
| **P2 — Operations & Comms** | Staff/HR + payroll, communications, calendar, house points, transport, sickbay, assessments | Whole-school pilot |
| **P3 — Scale** | Multi-branch groups, feature entitlements enforcement, COP portal hardening | Multi-branch pilot + billing tiers live |
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

Which of the five each module currently carries. ✓ present · — not yet written · ⏸ on hold (documented, minimal by design).

| # | Module | Journey | User Stories | Flow | Acceptance Criteria | Definition of Done |
|---|---|:--:|:--:|:--:|:--:|:--:|
| M1 | Students & Admissions | ✓ | ✓ | ✓ | ✓ | ✓ |
| M2 | Academic Management | ✓ | ✓ | ✓ | ✓ | ✓ |
| M3 | Attendance | ✓ | ✓ | ✓ | ✓ | ✓ |
| M4 | Results & Reporting | ✓ | ✓ | ✓ | ✓ | ✓ |
| M5 | Finance & Fees (incl. Ledger) | ✓ | ✓ | ✓ | ✓ | ✓ |
| M6 | Payments | ✓ | ✓ | ✓ | ✓ | ✓ |
| M7 | Staff & HR (incl. Payroll) | ✓ | ✓ | ✓ | ✓ | ✓ |
| M8 | Communications | ✓ | ✓ | ✓ | ✓ | ✓ |
| M9 | Calendar & Notice Board | ✓ | ✓ | ✓ | ✓ | ✓ |
| M10 | House Points | ✓ | ✓ | ✓ | ✓ | ✓ |
| M11 | Transport & Pickup | ✓ | ✓ | ✓ | ✓ | ✓ |
| M12 | Health & Sickbay | ✓ | ✓ | ✓ | ✓ | ✓ |
| M13 | Alumni | ✓ | ✓ | ✓ | ✓ | ✓ |
| M14 | Assessments (Assignments + CBT) | ✓ | ✓ | ✓ | ✓ | ✓ |
| M15 | Multi-branch / School Groups | ✓ | ✓ | ✓ | ✓ | ✓ |
| M16 | Feature Entitlements | ✓ | ✓ | ✓ | ✓ | ✓ |
| M17 | Super Admin / COP | ✓ | ✓ | ✓ | ✓ | ✓ |
| M18 | Lending / Loans | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ |
| M19 | Learning & Content | ✓ | ✓ | ✓ | ✓ | ✓ |
| M20 | Behaviour & Discipline | ✓ | ✓ | ✓ | ✓ | ✓ |
| M21 | Messaging (Teacher ↔ Parent) | ✓ | ✓ | ✓ | ✓ | ✓ |

**Coverage:** every active module (M1–M17, M19–M21) now carries all five. M18 (Lending) is intentionally minimal while on hold.

---

## M1. Students & Admissions

**User journey.** A proprietor opens Students, adds a child (or bulk-imports a spreadsheet, or accepts an online application). The student instantly appears in the class roster, attendance register and fee system, and the linked parent is notified. Over the year the admin promotes, graduates, deactivates or re-admits the student — and the record persists as history.

**User stories**
- As an admin, I want to **add a student** with details, class and parent link, so they can access all services from day one.
- As an admin, I want to **bulk-upload students via CSV**, so migration from spreadsheets is fast.
- As an admin, I want to **review online admission applications** and accept/reject them.
- As an admin, I want to **promote students in bulk** at term end.
- As an admin, I want to **graduate leavers to alumni** (individually or by class) and print a Leaving Certificate.
- As an admin, I want to **suspend, withdraw, deactivate or re-admit** a student with a reason, so status reflects reality.

**Flow — Student enrolment**
```
1. Admin → Students → Add Student (or Bulk Import CSV)
2. Fill: name, DOB, gender, class, house, admission no., photo, parent link
3. System validates duplicate admission number
4. Save → student created, parent notified, appears in roster/attendance/fees
5. Bulk: upload CSV → preview rows → confirm → valid rows imported, invalid flagged
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Duplicate admission number | Error shown, not saved |
| Parent linked at registration | Parent receives in-app notification |
| Bulk CSV import | Valid rows imported; invalid rows flagged with reason |
| New student visible everywhere | Appears in attendance, results, fees immediately |
| Deactivate / re-admit | Status changes; record & ledger preserved; reversible |

**Definition of Done (delta)**
- Admission number uniqueness enforced per school.
- Deactivation hides from active rosters but preserves ledger/history; re-admission restores cleanly.
- Bulk import is transactional per row (one bad row never blocks the rest).

---

## M2. Academic Management

**User journey.** Before term, the admin sets the calendar (session/term/holidays), splits year-groups into arms, builds the timetable and scheme of work. Through term, results roll up into a ranked broadsheet; the library tracks book loans.

**User stories**
- As an admin, I want to **set the academic calendar** so all scheduling anchors to real dates.
- As an admin, I want to **create class arms** (JSS1A/B) to split large groups.
- As an admin, I want to **build the timetable** and **scheme of work** per subject/term.
- As an admin, I want a **ranked results broadsheet** to see standing at a glance.
- As an admin, I want to **manage the library** (books, loans).

**Flow — Term setup**
```
1. Admin → Academic → Calendar → define session, terms, holidays
2. Academic → Arms → create arms under each class
3. Academic → Timetable → build periods per class
4. Academic → Scheme of Work → add per subject per term
5. Results → Broadsheet → auto-ranked by average once results approved
```

**Acceptance criteria**

| Criteria | Expected outcome |
|---|---|
| Calendar drives scheduling | Terms/holidays reflected across modules |
| Broadsheet ranking | Ties share a rank; next rank skips accordingly |
| Timetable visible to teachers/students | Correct periods per class |
| Library loan tracked | Book issued/returned reflected in stock |

**Definition of Done (delta)**
- Ranking handles ties deterministically; broadsheet matches per-student report cards.
- Timetable clashes (same teacher, two rooms) are surfaced.

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

**User journey.** Finance sets the term's fee structure, generates invoices for all active students, and applies any discounts. Each student's account becomes an **itemised, dated ledger** — every charge, every discount, every payment on its own line with a running balance and any credit balance. Parents view and **print the statement**, pay online, and get a **real-time receipt**. Finance reconciles bank transfers and records expenses.

**User stories**
- As finance, I want to **set fee structure** per class/term so invoices generate correctly.
- As finance, I want to **generate & send invoices** in bulk at term start.
- As finance, I want an **itemised student ledger** — charges, discounts and payments **broken out, not lumped** — with a running balance, opening balance and credit balance.
- As finance, I want to **edit a bill** (add/remove line items) and **apply itemised discounts**.
- As finance, I want to **reconcile transfers** by narration matching.
- As finance, I want to **record expenses** for an accurate P&L.
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

**Definition of Done (delta)**
- Ledger computation holds the invariant `debitTotal − creditTotal = balance` for every student.
- Discounts/opening balances never double-count against invoice totals.
- Receipts are real-time (visible to parent immediately after payment) and printable.
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

**User journey.** Admin maintains staff profiles; each month finance runs payroll through a stepper (generate → adjust → approve → publish); staff get payslips. Teachers request leave and see outcomes; appraisals and substitute coverage are recorded.

**User stories**
- As an admin, I want to **manage staff profiles** with roles and class assignments.
- As finance/admin, I want to **run monthly payroll** through an auditable stepper.
- As a teacher, I want to **apply for leave** and **view my payslip**.
- As an admin, I want to **approve leave**, **record appraisals**, and **assign substitutes**.

**Flow — Payroll**
```
1. Generate: load active staff + salary components → auto net pay
2. Adjustments: bonuses, advance deductions (impact shown)
3. Review & Approve: total vs budget → Approve
4. Publish: payslips created, staff notified, PDF downloadable; run history immutable
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

**Definition of Done (delta)**
- Payroll runs are immutable once published; corrections are new adjustments, not edits.
- Leave balances decrement correctly; substitute coverage visible on affected classes.

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

**Definition of Done (delta):** role-gated create/edit/delete; empty-day state ("No events") handled.

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

**Definition of Done (delta):** gated by the **transport** entitlement; revocation reflects immediately.

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

**Definition of Done (delta):** mandatory-notification outcomes cannot be saved without the notification firing.

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
Teacher → Assignments → Submissions → Mark → (image: pen/highlight/📍comment pins; PDF: sidebar comments)
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
School side: gated nav hidden; gated view (deep link) → "🔒 not on your plan" → Request feature → ticket to Support Desk
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

**User journey.** The CASPAA team onboards schools, assigns plans/features, watches revenue and platform analytics, resolves support tickets against SLAs, manages internal RBAC, and audits everything. *(Lending/disbursement console is part of COP but is ON HOLD this cycle.)*

**User stories (condensed)**
- Onboard schools; suspend/reactivate; assign plan & features.
- Track revenue (MRR/ARR, commissions); export reports.
- Manage support tickets with SLA + escalation.
- Manage COP team RBAC; immutable activity logs.
- View platform analytics (schools, MAU, adoption, performance).

**Flow — School onboarding & lifecycle (COP)**
```
COP → School Management → Create School (details, plan, feature modules)
→ system generates school ID + admin credentials → onboarding email sent → status Onboarding
Ops completes config (classes, staff, fees, calendar) → status Active → appears in COP dashboard
Suspend / Reactivate → blocks / restores all school-side logins → audited
```

**Acceptance criteria (highlights)**

| Criteria | Expected outcome |
|---|---|
| Onboard school | Unique ID; admin credentials; modules per plan |
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

**Definition of Done (delta):** records are auditable and attributed; sanctions with a duration auto-expire; parent notification fires for incidents above an agreed threshold.

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

# Assumptions, Risks & Dependencies

## Assumptions

| Assumption | Validation plan | What have we learned? |
|---|---|---|
| Schools accept an offline-first PWA over a native app for v1 | Pilot with 3–5 schools; measure install + usage | [ ] |
| Parents will self-serve payments once statements are transparent | Track pay-online rate vs office payments post-ledger | [ ] |
| Plan tiers + add-ons match how schools want to buy | Test pricing/packaging with pilots | [ ] |
| Multi-branch owners want consolidated view + per-branch isolation (Model A) | Confirmed with owner 2026-07-27; validate in multi-branch pilot | Model A adopted as the design direction |
| Deferring lending doesn't block core adoption | Monitor pilot feedback for loan demand | [ ] |

## Risks

| Risk | Mitigation plan |
|---|---|
| Offline sync conflicts corrupt data | Conflict rules + audit; last-writer + server reconcile; zero-loss on payments |
| Payment/reconciliation errors erode trust | Idempotent payments; narration matching; reconciliation dashboard; >98% accuracy target |
| Feature-gating hides a module a school is entitled to | Seed sensible plan defaults; per-school overrides; QA the nav/view guard per plan |
| Data isolation bug leaks across tenants/branches | All access via `currentSchoolId()`; isolation tests in CI |
| Scope creep from "build everything" | Phased rollout (P0–P3), feature flags, this PRD as the contract |
| Student-data privacy (minors) | RBAC, audit logs, encryption targets; consent flows |

## Dependencies

| Dependency | Providing team | Committed? (Y/N, who) |
|---|---|---|
| Paystack (card/transfer/USSD) | Payments/Paystack | [ ] |
| SMS gateway (Termii / Africa's Talking) | Comms vendor | [ ] |
| Email (SendGrid) | Comms vendor | [ ] |
| Production DB (PostgreSQL, multi-tenant) | Engineering | [ ] |
| Hosting/CI (Vercel now; deploy is manual `vercel --prod`) | Engineering | [ ] |

---

# Appendix

## Solution Ideas (considered)

- **Multi-branch model.** Considered (A) branch = separate tenant + group layer vs (B) single tenant + `branchId` on every record. **Chose A** — lower risk, reuses per-school isolation, every module works per-branch unchanged.
- **Discount model.** Considered a separate discount table vs **negative invoice line items**. Chose negative line items (already supported) surfaced as itemised credit rows in the ledger.
- **Entitlements.** Considered hard-coded plan checks vs a **catalog + per-school override store** (`hasFeature()`). Chose the catalog for custom add-ons.

## Competitor Review

- **Edves** — single unified login with role tabs (Students/Parents/Educator/Admissions); strong in Nigeria. CASPAA differentiates on offline-first + transparent itemised ledger + embedded finance.
- **PowerSchool** — separate heavy admin vs parent/student portals; enterprise/legacy. Heavier than the SME African school segment needs.
- **Spreadsheets + WhatsApp** — the real incumbent; free but fragmented, error-prone, no audit trail.

## Stakeholders

School proprietors & pilot schools; parents & students; CASPAA Operations, Finance, Support, Credit/Risk (for future lending), BI; AfriSprings leadership.

## Open Questions

| Question / Unknown | Plan to answer | Learned? | Resolved? |
|---|---|---|---|
| Final plan tiers & pricing, and which features are add-ons vs included | Pricing test with pilots | | ☐ |
| Are the Year-1 KPI targets (60 schools, ₦1B) committed or aspirational? | Confirm with leadership | | ☐ |
| When does lending resume, and under what licence/partner? | Business/regulatory review | | ☐ |
| Persist active-branch selection across reloads? (currently session-only) | UX decision + small build | | ☐ |
| Extend entitlement enforcement to payroll/AI/WhatsApp (currently nav-enforced for multibranch/lending/transport) | Scope in P3 | | ☐ |

---

# Notes

*(Space for team & stakeholder meeting notes.)*

---

# Changelog

| Change date | Changed by | Description of change |
|---|---|---|
| 2026-07-27 | [PM] | v4.0 — restructured onto the Academy of Product Management PRD template; added user journeys and Definitions of Done; moved Lending/Loans to **On Hold**; added Student Ledger, Multi-branch Groups and Feature Entitlements modules. |
| June 2026 | — | v3.0 — combined School OS + COP PRD (source content). |

---

## PRD Status key

**Draft** → Planning → Implementing → Measuring → Complete.
This document is **Draft**: soliciting feedback before commitment. Update the status field at the top as it progresses.

*CASPAA — AfriSprings Resources Ltd. · Loans on hold; all other modules in scope.*
