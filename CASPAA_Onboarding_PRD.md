# CASPAA — Onboarding & Sign-In PRD

| | |
|---|---|
| **Product** | CASPAA — School Operating System |
| **Feature area** | School onboarding, staff invitation, and credential-based sign-in |
| **Version** | 1.0 |
| **Status** | Implemented — reflects shipped behaviour as of 2026-07-10 |
| **Last updated** | 2026-07-10 |
| **Owner** | Product / Engineering |

---

## 1. Overview

CASPAA is a multi-tenant school operating system. Schools are first **onboarded onto the platform** by a CASPAA operator (Super Admin), and each school then **sets itself up and invites its own people** (staff, and — through enrolment — parents and students).

This document specifies the end-to-end onboarding journey and the sign-in model that ties it together:

1. **Platform onboarding** — a Super Admin creates the school account (on a 14-day trial).
2. **School getting-started wizard** — a guided, industry-standard setup checklist the School Admin completes to take the school live (branding → classes → **invite staff** → fees → students & families).
3. **Staff invitation** — individual and bulk email invitations that issue real credentials.
4. **Parent & student provisioning** — parents get a login automatically when their child is enrolled; students sign in with an admission number + date of birth.
5. **Identifier-first sign-in** — a single, two-step sign-in that routes each person to the right credential without asking them to pick a "role" or "type".

### 1.1 Problem statement

Before this work, the platform could create schools but there was no guided path for a school to become operational, no way to invite a team, and the sign-in page presented a **role picker** whose email form only recognised seven hard-coded demo accounts — so the credentials the product generated for real staff and parents did not actually work.

### 1.2 Goals

- Give a newly-onboarded school a clear, measurable path to "live" (a setup checklist with live progress).
- Let a school invite its staff in minutes (single + bulk), issuing working credentials.
- Make sign-in credential-based and self-routing, so no user must declare their type.
- Ensure every credential the onboarding flow issues can actually authenticate.

### 1.3 Non-goals (this release)

- Real email/SMS/WhatsApp delivery (messages are simulated in-app).
- Real password hashing / server-side identity (client-side mock; demo password `demo1234`).
- SSO, QR/badge login, and bulk student CSV import (see §10, Future work).
- Redesign of the Super Admin "Onboard School" modal (functional; out of scope here).

---

## 2. Personas & roles

| Persona | App role | How they get access |
|---|---|---|
| CASPAA Operator | `superadmin` | Platform account; OTP on sign-in |
| School Proprietor | `schooladmin` | Created at platform onboarding; signs in with school email |
| Principal | `principal` | Invited/seeded; email + password |
| Finance Officer / Bursar | `finance` | Invited as Finance staff; email + password; OTP on sign-in |
| Teacher / other staff | `teacher` | Invited via the wizard; email + temp password |
| Parent | `parent` | Auto-provisioned when their child is enrolled |
| Student | `student` | Admission number + date of birth |

**Staff-type → role mapping** (at sign-in): `Finance` → `finance`; all other staff types (`Academic`, `Administration`, `Operations`, `ICT`, `Transport`) → `teacher`. *(Known simplification — see §9.)*

---

## 3. Scope summary

| # | Capability | Surface |
|---|---|---|
| S1 | School getting-started wizard | `view_adm_onboarding` + dashboard banner |
| S2 | School profile & branding | Wizard step 1 (modal) |
| S3 | Invite staff (single + bulk) | Wizard "Invite your team" panel |
| S4 | Fee / academic / student deep-links | Wizard steps 2, 4, 5 |
| S5 | Parent provisioning on enrolment | Add-student flow |
| S6 | Identifier-first two-step sign-in | Login page |
| S7 | First-login password change & OTP | Sign-in |

---

## 4. User journeys

### Journey A — Platform onboards a school

```
Super Admin ─▶ Schools ─▶ "Onboard School"
    └─ enters profile + KYC + subscription plan
        └─ school created (status: trial, 14-day)
            └─ proprietor can now sign in with the school's contact email
```

### Journey B — School Admin completes getting-started

```
Proprietor signs in
   └─ Dashboard shows "Finish setting up your school" banner (X of 5, %)
        └─ Continue setup ─▶ Getting-started wizard
             ├─ Step 1  School profile & branding      [modal]
             ├─ Step 2  Classes & terms                [→ Academic]
             ├─ Step 3  Invite your staff              [inline panel]  ★
             ├─ Step 4  Fee structure                  [→ Finance]
             └─ Step 5  Students & families            [→ Students]
        └─ Each completed step flips to ✓ (progress recomputed live)
   └─ At 100% the banner disappears; wizard still reachable via
      Profile ▸ "School setup guide"
```

### Journey C — Invite staff (the centrepiece)

```
Wizard ▸ Invite your team
   ├─ Row: Full name · Email · Staff type · Role     (+ Add another)
   ├─ OR Bulk invite: paste "Name, email" lines ─▶ prefilled rows
   └─ Send invitations
        ├─ each valid row ─▶ teacher record + invitation (email + temp password)
        ├─ audit log: staff_invited
        └─ roster updates: "Invite sent" (pending) / "Joined" (accepted) + Resend
```

### Journey D — Invited staff first sign-in

```
Staff opens invite ─▶ Login page
   Step 1: enters their email ─▶ Continue
   Step 2: enters temp password ─▶ Sign in
        ├─ invitation marked accepted
        ├─ (Academic → teacher / Finance → finance + OTP)
        └─ prompted to set a personal password (first login)
```

### Journey E — Enrol student → provision parent

```
Admin ▸ Add Student
   ├─ new parent ─▶ parent record + credentials (username: phone, temp password)
   │                 + firstLogin: true
   ├─ welcome message shown (simulated WhatsApp/email) with the login details
   └─ student record created with admission number + date of birth
```

### Journey F — Student sign-in

```
Login page
   Step 1: enters admission number ─▶ Continue
   Step 2: enters date of birth ─▶ Sign in
        ├─ secondary students → prompted to set a password (first login)
        └─ audit log: student_login
```

### Journey G — Identifier-first routing (all returning users)

```
Step 1: one field — "Email or Admission Number"
   ├─ matches an active student's admission number ─▶ ask DATE OF BIRTH
   ├─ matches a known account (staff/parent/admin/proprietor) ─▶ ask PASSWORD
   └─ matches nothing ─▶ "No account found" (stay on step 1)
Back button returns to step 1 and clears the credential field.
```

---

## 5. Epics, user stories & acceptance criteria

Acceptance criteria use **Given / When / Then**. All criteria below are covered by automated DOM-level checks.

### Epic 1 — School getting-started wizard

**US-1.1** — *As a School Admin, I want a guided checklist after I sign in, so that I know exactly what to do to take my school live.*

- **AC-1.1.1** Given I am a `schooladmin` or `principal` with an incomplete setup, When I open the dashboard, Then a "Finish setting up your school" banner shows my progress as *"N of 5 steps done"* and a percentage.
- **AC-1.1.2** Given setup is 100% complete, When I open the dashboard, Then the banner is not shown.
- **AC-1.1.3** Given I dismiss the banner, Then it collapses to a slim *"School setup X% complete · Resume setup →"* bar, and the wizard remains reachable from **Profile ▸ School setup guide**.
- **AC-1.1.4** Given I open the wizard, Then I see 5 steps, each showing done/to-do state, and an overall progress ring.

**US-1.2** — *As a School Admin, I want each step to reflect what I've actually done, so that progress is trustworthy.*

- **AC-1.2.1** Step completion is derived live from data, not a stored flag:
  - *School profile & branding* → done when the school's logo initials are set.
  - *Classes & terms* → done when ≥ 1 class exists for the school.
  - *Invite your staff* → done when ≥ 1 staff member exists for the school.
  - *Fee structure* → done when ≥ 1 fee structure exists for the school.
  - *Students & families* → done when ≥ 1 student exists for the school.
- **AC-1.2.2** Given a step's underlying data is created, When the wizard re-renders, Then that step shows as **Done** and the ring/percentage update.
- **AC-1.2.3** Given every step is complete, Then the hero shows a "ready" state and a **Go to dashboard** action.

**US-1.3** — *As a School Admin, I want to jump straight to the tool a step needs, so that I don't hunt through the menu.*

- **AC-1.3.1** *Classes & terms* opens Academic; *Fee structure* opens Finance; *Students & families* opens Students.
- **AC-1.3.2** *School profile & branding* opens a modal in place.
- **AC-1.3.3** *Invite your staff* scrolls to the inline invite panel on the wizard.

### Epic 2 — School profile & branding

**US-2.1** — *As a School Admin, I want to set my school's identity, so that CASPAA reflects my school.*

- **AC-2.1.1** Given the branding modal, When I save, Then school name, logo initials (stored upper-cased), primary colour, motto, address, phone and contact email persist to the school record.
- **AC-2.1.2** Given I leave the school name empty, When I save, Then I get a validation error and nothing is saved.
- **AC-2.1.3** Given I save branding, Then the school name is also written to settings and an audit entry `branding_updated` is recorded.

### Epic 3 — Invite staff

**US-3.1** — *As a School Admin, I want to invite staff by email, so that my team can access CASPAA.*

- **AC-3.1.1** Given one or more invite rows with a name and a valid email, When I click **Send invitations**, Then for each row a staff record is created with an `invitation` object (`username = email`, generated temp password, `accepted = false`, channel `email`) and an audit entry `staff_invited`.
- **AC-3.1.2** Given a row has a name but no email (or vice-versa), When I send, Then I get an error and **no** records are created (all-or-nothing per submit).
- **AC-3.1.3** Given an email is malformed, When I send, Then I get a "not a valid email" error and no records are created.
- **AC-3.1.4** Given no rows are filled, When I send, Then I get a "add at least one teammate" error.
- **AC-3.1.5** Each invited staff member is assigned a staff type and a school role, and a default permission set (attendance, results, assignments, messaging, lesson plans).

**US-3.2** — *As a School Admin, I want to add or remove invite rows and paste a list, so that inviting many people is fast.*

- **AC-3.2.1** Given the invite panel, When I click **Add another**, Then a new empty row appears.
- **AC-3.2.2** Given more than one row, When I remove a row, Then it is deleted; When only one row remains and I remove it, Then its fields are cleared instead.
- **AC-3.2.3** Given I paste lines of `Full name, email` into bulk invite, When I add them, Then one prefilled row is created per line for review before sending.

**US-3.3** — *As a School Admin, I want to see who I've invited and resend, so that I can chase pending staff.*

- **AC-3.3.1** Given staff have been invited, Then the panel lists each with name, email, role and a status badge: **Invite sent** (pending) or **Joined** (accepted).
- **AC-3.3.2** Given a pending invite, When I click **Resend**, Then the invitation's sent timestamp is refreshed and I see a confirmation.

### Epic 4 — Parent & student provisioning

**US-4.1** — *As a School Admin, I want a parent's login created automatically when I enrol their child, so that I don't manage separate invites.*

- **AC-4.1.1** Given I add a student with a new parent, When I save, Then a parent record is created with credentials (`username = phone`, temp password) and `firstLogin = true`.
- **AC-4.1.2** Given the parent is created, Then a welcome message (simulated) is presented containing the login details.

**US-4.2** — *As a student, I want to sign in with my admission number and date of birth, so that I don't need an email.*

- **AC-4.2.1** Given an active student, When they enter their admission number and correct date of birth, Then they are signed in as `student`.
- **AC-4.2.2** Given a wrong date of birth, Then sign-in is refused.
- **AC-4.2.3** Given a secondary-school student who has not set a password, When they sign in, Then they are prompted to set one.

### Epic 5 — Identifier-first sign-in

**US-5.1** — *As any user, I want to sign in from one place without choosing my type, so that the flow is simple.*

- **AC-5.1.1** Given the login page, Then there is a single **Email or Admission Number** field and **no** role-picker buttons.
- **AC-5.1.2** Given I enter an active student's admission number (case-insensitive) and Continue, Then step 2 asks for **date of birth**.
- **AC-5.1.3** Given I enter a known account's email/username and Continue, Then step 2 asks for a **password**.
- **AC-5.1.4** Given I enter an unrecognised identifier and Continue, Then I get "No account found" and remain on step 1.
- **AC-5.1.5** Given I am on step 2, When I click **Back**, Then I return to step 1 and the credential field is cleared.
- **AC-5.1.6** Enter key advances step 1 and submits step 2.

**US-5.2** — *As an invited staff member, I want my temp password to work, so that onboarding actually lets me in.*

- **AC-5.2.1** Given an invited staff member, When they sign in with their temp password, Then they are authenticated with the correct role and their invitation is marked **accepted**.
- **AC-5.2.2** Given the account is `superadmin` or `finance`, When credentials are correct, Then an OTP step is required before entry.
- **AC-5.2.3** Given an invited teacher's first successful sign-in, Then they are prompted to set a personal password.
- **AC-5.2.4** Given a wrong password, Then sign-in is refused with an "Incorrect password" message.

**US-5.3** — *As a returning user, I want my identity resolved across all account types, so that whoever I am, sign-in works.*

- **AC-5.3.1** `resolveLogin` matches, in order: platform/demo accounts → staff (by email or invitation username) → parents (by email or phone username) → school proprietor (by school email).
- **AC-5.3.2** Given no source matches the identifier, Then no user is returned and sign-in fails cleanly.

---

## 6. Functional requirements detail

### 6.1 Getting-started wizard
- Route key: `adm_onboarding`. Centred single-column layout; hero with progress ring; 5 step cards; inline "Invite your team" panel.
- The **Invite your staff** step is highlighted ("Recommended next") until complete.
- Entry points: dashboard banner (until 100%), and Profile ▸ "School setup guide" (always).

### 6.2 Invite panel
- Row fields: Full name (required), Email (required, validated), Staff type (select), Role (from the school's roles, excluding Proprietor/Parent).
- Bulk parser splits each line on comma/semicolon/tab; first token = name, first `@`-token = email.
- Submit is all-or-nothing: any invalid filled row aborts the whole send.

### 6.3 Sign-in
- **Step 1:** single identifier field + Continue.
- **Router (`routeLoginIdentifier`):** active-student admission number (case-insensitive) → student branch; else if `resolveLogin(id, '')` finds a user → password branch; else unknown.
- **Step 2 (password):** password (with show/hide), Remember me, Forgot password (simulated), Sign in. Demo hint retained.
- **Step 2 (student):** date-of-birth picker, Sign in as Student.
- OTP retained for `superadmin`/`finance`; first-login password change retained for applicable roles.

---

## 7. Business rules

1. A school begins on a **14-day trial** at platform onboarding.
2. Onboarding progress is always **computed from live data** — there is no "mark complete" override.
3. Invited staff credentials: `username = email`, system-generated temp password, `accepted = false` until first successful sign-in.
4. Parent credentials: `username = phone`, generated temp password, `firstLogin = true`.
5. Students authenticate with **admission number + date of birth**; no email required.
6. Demo/testing password for any account is `demo1234` (non-production).
7. Sensitive roles (`superadmin`, `finance`) require an OTP step.

---

## 8. Edge cases

| Case | Expected behaviour |
|---|---|
| Duplicate email invited twice | Second invite creates a second record (no dedupe in v1 — see §10) |
| Admission number typed in different case | Matched case-insensitively → student branch |
| Parent username is a phone number (no `@`) | Routed to password branch via account match, not student |
| Identifier matches nothing | "No account found", stays on step 1 |
| Wrong DOB / wrong password | Refused with a specific message; no session created |
| Branding saved with empty name | Blocked with validation error |
| Partial invite row (name xor email) | Whole submit aborts; nothing created |
| Setup already complete (seeded/established school) | Banner hidden; wizard shows "ready" state |

---

## 9. Known limitations

- **Staff-type → role mapping** collapses `Administration/Operations/ICT/Transport` to the `teacher` role (no dedicated dashboards for those types yet).
- **No invite de-duplication** — inviting the same email twice creates two staff records.
- **Messaging is simulated** — no real email/SMS/WhatsApp is sent.
- **First-login password change** is enforced for `teacher`/`parent`/`student` collections; `finance`-mapped invited staff skip the forced change (collection-mapping quirk).

---

## 10. Success metrics

| Metric | Target intent |
|---|---|
| Time-to-first-staff-invite (from first proprietor sign-in) | Minimise |
| % of new schools reaching 100% setup within 7 days | Maximise |
| Invited-staff activation rate (accepted / invited) | Maximise |
| Sign-in success rate on first attempt (by role) | Maximise |
| Support tickets tagged "can't log in" | Minimise |

---

## 11. Future work

- QR/badge sign-in (Clever-style) and/or parent-mediated access for the youngest pupils.
- Bulk student import (CSV) on the "Students & families" step.
- Invite de-duplication + "pending invites" management view.
- Real credential delivery (email/SMS/WhatsApp) and server-side identity + hashing.
- Multi-step redesign of the Super Admin "Onboard School" creation flow.

---

## 12. Appendix — surfaces & data touched

**Views / functions:** `view_adm_onboarding`, `onboardingBanner`, `schoolOnboardingSteps`, `onbInviteRowHtml`, `onbSendInvites`, `onbParseBulk`, `onbBrandingModal`/`onbSaveBranding`, `onbResend` (School Admin module); `renderLogin`, `routeLoginIdentifier`, `resolveLogin`, `bindLoginHandlers` (Auth).

**Data collections:** `schools` (branding, kyc), `teachers` (invitation), `parents` (credentials), `students` (admissionNo, dob), `feeStructures`, `classes`, `schoolRoles`, `auditLog`, `settings`.

**Audit actions:** `onboarded_school`, `branding_updated`, `staff_invited`, `student_login`.
