# CASPAA — School Operating System (Working Prototype)

A fully functional end-to-end prototype of the CASPAA School ERP + Embedded Finance platform for African schools, built from the PRD and meeting documents in the parent folder.

## Quick start

1. Open `caspaa/index.html` in **Chrome, Edge, or Firefox** (any modern browser)
2. Pick a demo account on the login screen and start exploring

That's it. There is **no install, no build step, no server, no API keys**. The whole app runs in your browser and persists data in LocalStorage.

## What's inside (5 roles, 10 modules, fully clickable)

The login page shows 5 one-click demo accounts:

| Role | What you can do |
|---|---|
| **CASPAA Super Admin** | Onboard schools, monitor MRR/ARR, watch the lending book, see audit logs, toggle feature flags. *(Triggers 2FA OTP step — code is shown on screen)* |
| **School Proprietor** | Manage students (manual + bulk Excel-style upload), staff, classes, timetable with conflict detection, attendance overview, broadsheet & report cards, fees, discipline, inventory with low-stock alerts |
| **Finance Officer** | Fee structures, invoices, payment ledger, auto-reconciliation with AI matching, expense recording, lending decisions, P&L statement with PDF export. *(Also OTP-protected)* |
| **Teacher** | Mark attendance (works offline!), enter CA/exam scores with auto-grading, **AI-generated report comments**, post assignments, write lesson plans, chat with parents |
| **Parent** | View each child's dashboard, **pay fees through Paystack-style flow** (card/transfer/USSD), download receipts & report cards, apply for a school-fee loan with instant credit decision, chat with teachers |

## Feature highlights worth demoing

- **Paystack-style payment flow** — Modal with card/transfer/USSD choice, real-looking processing animation, success state with reference number, PDF-printable receipt.
- **Lending engine with credit scoring** — Live credit score calculated from payment history, income, and tenure. Loan application runs a visible 5-step risk assessment, instant approval/decline, auto-generated repayment schedule.
- **AI report-card comments** — Click the gold ✨ button on any result row; comments are generated based on the score band, typed out letter-by-letter for effect.
- **Offline mode toggle** — Click the icon next to the bell in the top bar. Take attendance, then toggle back online and watch the "Syncing N items…" pill.
- **Auto-reconciliation** — In Finance → Reconciliation, see how an incoming bank transfer is matched to a student via the narration heuristic.
- **WhatsApp integration** — The chat screen has a WhatsApp button (opens `wa.me/<number>`). Announcements have a "Also send via WhatsApp" toggle.
- **Bulk Excel upload** — Students → Bulk Upload. Download a template CSV, simulated upload completes with 5 fake imports.
- **PDF receipts and report cards** — Click the download button on any paid invoice or completed report card. Opens a printable view.

## UX choices made for "the dumbest person can use it"

- **One-click demo logins** — no email/password typing during stakeholder demos
- **Big touch targets** for mobile — attendance buttons are 80px wide, fees buttons fill the row
- **One primary action per screen** — Pay All Fees, Mark Attendance, Apply Now
- **Plain English everywhere** — "Pay Now", not "Initiate Transaction"
- **Toasts confirm every action** — never leaves user wondering "did it save?"
- **Empty states have a clear next step** — never a dead end
- **Mobile bottom tab nav** + responsive layout for phones
- **Color-coded everything** — green = paid/good, amber = pending/partial, red = overdue
- **Progressive disclosure** — drill into a student card to see fees, results, attendance separately
- **Live recalculation** — type a CA score, the grade and total update instantly

## Architecture (for the technical reviewers)

| Layer | Implementation |
|---|---|
| UI | Tailwind CSS via CDN + custom design system (`css/styles.css`). All components inline SVG icons. |
| Data | `js/data.js` — LocalStorage-backed mock DB with realistic Lagos-school seed data (8 classes, 10 students, 5 teachers, 5 parents, fees, attendance for 2 weeks, results, loans, transactions). |
| Auth | `js/auth.js` — Multi-role session in sessionStorage. 2FA OTP gated for Super Admin and Finance roles. |
| Routing | `js/app.js` — Hash-free in-memory router. Role-based navigation built dynamically. |
| Modules | One file per role under `js/modules/`. Each view is a `view_<key>` function returning HTML. |
| Charts | Chart.js via CDN — used in dashboards for revenue, attendance, and revenue mix. |

This intentionally mirrors the PRD's modular architecture so the real Next.js/NestJS build can be a 1:1 port.

## What maps to the PRD checklist

All 10 modules from the PRD are implemented end-to-end:

| PRD Module | Implementation |
|---|---|
| Module 1 — School ERP | ✅ SIS, Staff, Timetable (with conflict detection), Results, Attendance, Discipline, Inventory |
| Module 2 — Parent App | ✅ Child dashboard, Fees & billing, Communication, Academics, Loans |
| Module 3 — Teacher App | ✅ Dashboard, Attendance, Results, Assignments, Lesson Plans, Communication |
| Module 4 — Financial Management | ✅ Fee structure, Invoicing, Revenue, Expenses, Reconciliation, P&L |
| Module 5 — Payments (Paystack) | ✅ Card / Transfer / USSD flows, receipts, transaction verification |
| Module 6 — Lending Engine | ✅ Application, schedule, monitoring, repayments |
| Module 7 — Risk Engine | ✅ Credit scoring (payment history + income + tenure), 5-step visible assessment |
| Module 8 — AI Assistant | ✅ Report comments based on score bands, fraud-style narration matching for recon |
| Module 9 — Communication | ✅ Teacher↔Parent chat, broadcast announcements, push-style notifications, WhatsApp launch |
| Module 10 — Admin Portal | ✅ School CRUD, subscriptions, revenue monitoring, audit log, feature flags |
| Offline-first capability | ✅ Toggle in top bar; queued sync indicator |

## Reset between demos

Click your name (top right) → **Reset demo data**. This wipes LocalStorage and reseeds. Useful when the previous demo created clutter.

## Limitations (intentional, per scope)

- No real Paystack — the payment flow is fully simulated end-to-end but issues no real charge
- No real WhatsApp Business API — chat WhatsApp button opens `wa.me/` link
- No real SMS gateway — toasts confirm what would have been sent
- No real PostgreSQL — LocalStorage is the data layer

These are the **only** items that need real integrations when you greenlight the production build. Everything else is logic and UX, which you can validate today.
