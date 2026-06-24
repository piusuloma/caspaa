# CASPAA — Complete Product Requirements Document
## School Operating System + Core Operations Portal

**Version:** 3.0  
**Last Updated:** June 2026  
**Product:** CASPAA — School ERP + Embedded Finance Platform + Internal Operations Portal  
**Company:** AfriSprings Resources Ltd.

---

## Table of Contents

**PART A — CASPAA SCHOOL OPERATING SYSTEM (School-Facing Platform)**

1. [Product Overview](#1-product-overview)
2. [User Roles](#2-user-roles)
3. [Module Index](#3-module-index)
4. [User Stories by Role](#4-user-stories-by-role)
5. [User Flows — School Platform](#5-user-flows--school-platform)
6. [Data Model Summary](#6-data-model-summary)

**PART B — CASPAA CORE OPERATIONS PORTAL (COP) — Internal**

7. [COP Overview](#7-cop-overview)
8. [COP Target Users](#8-cop-target-users)
9. [COP System Modules](#9-cop-system-modules)
10. [COP User Flows](#10-cop-user-flows)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Success Metrics & KPIs](#12-success-metrics--kpis)

**PART C — GOVERNANCE**

13. [Roles & Permissions Matrix](#13-roles--permissions-matrix)
14. [Out of Scope (Post-MVP)](#14-out-of-scope-post-mvp)

---

# PART A — CASPAA SCHOOL OPERATING SYSTEM

---

## 1. Product Overview

CASPAA is a fully integrated School Operating System for African schools. It combines a School ERP (student information, academic management, HR, operations) with embedded financial services (fee collection, lending, payroll) into a single platform accessible to all school stakeholders — administrators, teachers, parents, and students.

### Core Value Proposition

- **For schools:** Replace spreadsheets, paper registers, and disconnected tools with one system
- **For parents:** Pay fees, track children, communicate with school — from a phone
- **For teachers:** Mark attendance, enter results, and communicate — without paperwork
- **For the platform operator (CASPAA/AfriSprings):** SaaS subscription + transaction revenue from embedded payments and lending

### Technical Architecture

- **Frontend:** Vanilla JS, Tailwind CSS, Chart.js — single-page app, no build step
- **Storage:** LocalStorage mock DB (production: cloud PostgreSQL)
- **Auth:** Multi-role session with role-based access control
- **Payments:** Paystack integration (card, bank transfer, USSD)
- **Notifications:** In-app push + WhatsApp deep-links

---

## 2. User Roles

| Role | Access Level | Primary Concern |
|------|-------------|-----------------|
| **Super Admin** (CASPAA staff) | Platform-wide | School management, revenue, support, lending oversight |
| **School Admin** (Proprietor/Bursar) | School-wide | All modules — full access |
| **Principal** | School-wide | Academic + HR, no finance |
| **Finance Officer** | Finance only | Fees, payments, expenses, lending |
| **Teacher** | Class-level | Teaching, attendance, results, communication |
| **Parent** | Own children | Fees, academics, communication |
| **Student** | Own record | Learning, results, timetable |

---

## 3. Module Index

| # | Module | Key Actors |
|---|--------|-----------|
| 1 | **Students & Admissions** | Admin, Principal |
| 2 | **Academic Management** | Admin, Principal, Teacher |
| 3 | **Attendance** | Teacher, Admin |
| 4 | **Results & Reporting** | Teacher, Admin, Student, Parent |
| 5 | **Staff & HR** | Admin, Principal |
| 6 | **Finance & Fees** | Finance Officer, Admin, Parent |
| 7 | **Lending Engine** | Finance Officer, Admin, Parent |
| 8 | **Payments** | Parent, Finance Officer |
| 9 | **Communications** | All roles |
| 10 | **Calendar & Notice Board** | Admin, Principal, All roles |
| 11 | **House Points** | Admin, Teacher, Student, Parent |
| 12 | **Transport & Pickup** | Admin, Parent |
| 13 | **Health & Sickbay** | Admin, Parent |
| 14 | **Alumni** | Admin |
| 15 | **Surveys & Feedback** | Admin, Parent |
| 16 | **Communication Diary** | Teacher, Parent |
| 17 | **Inventory** | Admin |
| 18 | **Assessments (Formative/CBT)** | Teacher, Student |
| 19 | **Payslips & Payroll** | Admin, Finance, Teacher |
| 20 | **Super Admin Portal** | CASPAA Staff |

---

## 4. User Stories by Role

---

### 4.1 School Admin / Proprietor

#### Students & Admissions

- As a school admin, I want to **add a new student** with personal details, class, and parent link, so that the student can access all school services from day one.
- As a school admin, I want to **bulk upload students via CSV**, so that I can migrate from spreadsheets without entering records one by one.
- As a school admin, I want to **view all admission applications** submitted online, so that I can review and accept or reject them.
- As a school admin, I want to **promote students to the next class** in bulk at the end of term, so that I don't have to update each student individually.
- As a school admin, I want to **graduate SS3 students to alumni** individually or in bulk, so that their records are preserved and the active student list stays clean.
- As a school admin, I want to **suspend or withdraw a student** with a reason and date, so that the system reflects the real enrollment status.
- As a school admin, I want to **manage alumni records** including post-graduation info (university, course, contact), so that the school maintains a living alumni network.
- As a school admin, I want to **print a School Leaving Certificate** for any alumnus, so that leavers get official documentation.
- As a school admin, I want to **re-admit an alumnus** as an active student, so that returning students can be reinstated.

#### Academic

- As a school admin, I want to **set up the academic calendar** (terms, sessions, holidays), so that all scheduling is anchored to real school dates.
- As a school admin, I want to **create class arms** (e.g. JSS1A, JSS1B), so that large year groups can be split into manageable classes.
- As a school admin, I want to **build the school timetable**, so that teachers and students know what happens when.
- As a school admin, I want to **create a scheme of work** per subject per term, so that teaching is planned and documented.
- As a school admin, I want to **view a results broadsheet** sorted by student average with proper rank positions, so that I can see academic standing at a glance.
- As a school admin, I want to **approve or reject teacher-submitted results** with a comment, so that results are verified before students and parents can see them.
- As a school admin, I want to **manage the school library** (add/remove books, track loans), so that library usage is recorded.
- As a school admin, I want to **oversee all assignments, CBT exams, and learning materials** school-wide, so that I have full visibility into what teachers are setting.

#### Staff & HR

- As a school admin, I want to **add and manage staff profiles** with roles, qualifications, and class assignments, so that workforce data is centralised.
- As a school admin, I want to **run monthly payroll** through a structured stepper (generate → review → adjustments → confirm → publish), so that salary processing is auditable.
- As a school admin, I want to **approve or reject leave requests**, so that staff absence is tracked and authorised.
- As a school admin, I want to **record staff appraisals** with scores and comments, so that performance management is documented.
- As a school admin, I want to **track substitute teacher coverage** when a teacher is absent, so that no class goes unattended.

#### Operations

- As a school admin, I want to **manage the school's physical inventory** (books, equipment, uniforms), so that stock levels and asset values are tracked.
- As a school admin, I want to **log visitor check-ins and check-outs**, so that there is a record of everyone who enters the school.
- As a school admin, I want to **record sickbay visits** with outcome and parent notification, so that student health incidents are documented and parents are informed.
- As a school admin, I want to **manage bus routes and assign students**, so that transport logistics are organised and parents know which bus their child is on.
- As a school admin, I want to **mark daily bus status** (Waiting / Departed / Arrived / Delayed), so that parents get real-time updates without having to call the school.
- As a school admin, I want to **approve or deny pickup authorisation requests** submitted by parents, so that child safety is maintained — only authorised persons can collect students.

#### Communications

- As a school admin, I want to **send announcements to parents, teachers, or everyone**, so that school-wide information reaches the right audience.
- As a school admin, I want to **post notices to the Notice Board**, so that important, non-date-specific information stays visible to the community.
- As a school admin, I want to **send bulk SMS/email campaigns** to parents or staff, so that I can reach everyone quickly for urgent matters.
- As a school admin, I want to **create digital consent forms** for events or permissions, so that I can collect parental consent electronically.
- As a school admin, I want to **run satisfaction surveys** for parents and view aggregated responses, so that I can improve school services.
- As a school admin, I want to **see all teacher-parent conversations** in oversight mode, so that I can monitor communication quality and safeguard students.

---

### 4.2 Finance Officer

- As a finance officer, I want to **create and manage the fee structure** per class and term, so that invoices are generated correctly.
- As a finance officer, I want to **generate and send invoices** to all parents at the start of term, so that fee collection can begin.
- As a finance officer, I want to **view and export the payment ledger**, so that I can see which invoices are paid, outstanding, or overdue.
- As a finance officer, I want to **reconcile bank transfer payments** against outstanding invoices using narration matching, so that manual payment matching is fast and accurate.
- As a finance officer, I want to **record school expenses** with category, amount, and supporting notes, so that the P&L report is accurate.
- As a finance officer, I want to **run and manage payroll**, so that staff salaries are processed on time each month.
- As a finance officer, I want to **review and decide on parent loan applications**, so that the lending programme runs in a controlled way.
- As a finance officer, I want to **export financial reports** (P&L, fee collection, payment ledger), so that I can share data with the proprietor or accountant.
- As a finance officer, I want to **apply advance payments to outstanding invoices**, so that student credit balances are utilised automatically.
- As a finance officer, I want to **view cost centre analytics** (revenue, expenses, profit margin by department), so that the school can identify which activities are financially sustainable.

---

### 4.3 Principal

- As a principal, I want to **view the academic dashboard** with attendance rates, average results, and discipline summary, so that I can monitor school performance at a glance.
- As a principal, I want to **approve or reject teacher results** before they are released to students, so that I sign off on academic outcomes.
- As a principal, I want to **manage staff** (add, edit, leave, appraisals), so that HR is handled from one place.
- As a principal, I want to **view and manage the timetable**, so that academic scheduling is correct.
- As a principal, I want to **post calendar events and notices**, so that the school community is kept informed.
- As a principal, I want to **manage house points** and record inter-house competitions, so that the co-curricular programme is tracked.

---

### 4.4 Teacher

- As a teacher, I want to **take class attendance daily**, so that the register is always up to date.
- As a teacher, I want to **enter exam and test results** for my subject, so that students' academic performance is recorded.
- As a teacher, I want to **submit results for admin approval**, so that results go through a proper verification process.
- As a teacher, I want to **create and assign homework**, so that students are given structured work outside class.
- As a teacher, I want to **create rubrics** when setting assignments so that grading criteria are clear and consistent.
- As a teacher, I want to **mark submitted assignments** with grades, rubric scores, general feedback, and inline comments anchored to the student's image or PDF submission, so that my feedback is specific and actionable.
- As a teacher, I want to **return marked work to the student** in one click, so that the student is notified and can view feedback immediately.
- As a teacher, I want to **create and publish formative tests / CBT exams**, so that students are assessed regularly.
- As a teacher, I want to **write lesson plans and class notes** and attach materials, so that my teaching is planned and resources are accessible.
- As a teacher, I want to **award house points to students** (individual merit) or record deductions, so that the house system rewards positive behaviour.
- As a teacher, I want to **write diary notes about students** that parents can read and reply to, so that parent-teacher communication is ongoing and documented.
- As a teacher, I want to **message parents directly**, so that I can communicate about individual students.
- As a teacher, I want to **view my timetable and payslip**, so that I know my schedule and can verify my salary.
- As a teacher, I want to **apply for leave** and see the outcome, so that my absence is formally requested and approved.
- As a teacher, I want to **submit an appraisal self-assessment**, so that my performance review is on record.

---

### 4.5 Parent

- As a parent, I want to **see a dashboard for each of my children** (attendance, results, fees, behaviour), so that I can monitor my children's progress without coming to the school.
- As a parent, I want to **pay school fees online** using card, bank transfer, or USSD, so that I don't have to queue at the school office.
- As a parent, I want to **view invoices and payment receipts**, so that I have records of all payments made.
- As a parent, I want to **apply for a loan** to cover school fees, so that I can spread the cost over instalments.
- As a parent, I want to **view my child's exam results** only after the school has approved them, so that I receive verified information.
- As a parent, I want to **print a report card or transcript** for my child, so that I have an official record of academic performance.
- As a parent, I want to **see my child's attendance record**, so that I know when they were absent.
- As a parent, I want to **read diary notes from teachers** and reply to them, so that I stay informed about my child's day-to-day progress.
- As a parent, I want to **add authorised pickup persons** for my child and submit them for school approval, so that trusted adults can collect my child safely.
- As a parent, I want to **see the bus status** for my child's route in real time, so that I know when to expect the bus.
- As a parent, I want to **respond to digital consent forms**, so that I can give or withhold permission for school events electronically.
- As a parent, I want to **complete school surveys** before the deadline, so that my feedback reaches the school in time.
- As a parent, I want to **see school announcements and the notice board**, so that I am kept informed of important school news.
- As a parent, I want to **view the school calendar**, so that I know about upcoming events, holidays, and exams.
- As a parent, I want to **see my child's health/sickbay visit history**, so that I am aware of any medical incidents at school.
- As a parent, I want to **see my child's house points standing**, so that I can encourage participation in the house system.
- As a parent, I want to **view my child's returned assignments with the teacher's inline comments**, so that I understand the specific feedback given.
- As a parent, I want to **resubmit my child's work** after it is returned by a teacher, so that my child can respond to the teacher's corrections.

---

### 4.6 Student

- As a student, I want to **see my dashboard** with my attendance, upcoming assignments, results, and house points, so that I know where I stand.
- As a student, I want to **access lesson notes and videos** uploaded by my teacher, so that I can study at home.
- As a student, I want to **submit assignments online** (text, image, or PDF), so that I don't have to carry physical work to school.
- As a student, I want to **take CBT tests and formative assessments** on the platform, so that my performance is recorded immediately.
- As a student, I want to **view my approved results**, so that I can see my grades once the teacher and admin have signed off.
- As a student, I want to **see my timetable**, so that I know what subjects I have each day.
- As a student, I want to **see the school calendar**, so that I'm aware of upcoming events.
- As a student, I want to **see the house leaderboard** and my personal house points, so that I know how my house is performing.
- As a student, I want to **view returned assignments with the teacher's feedback and inline comments**, so that I know exactly what to correct.
- As a student, I want to **resubmit my work** after reviewing teacher feedback, so that I can improve my answer and send it back.

---

### 4.7 Super Admin (CASPAA Staff)

- As a super admin, I want to **onboard new schools** with full configuration (classes, terms, fee structure, staff), so that a school is operational from day one.
- As a super admin, I want to **view platform-wide revenue** (subscriptions, transaction fees, lending margins), so that I can track CASPAA's financial health.
- As a super admin, I want to **monitor all active loans** across all schools with default risk scoring, so that credit risk is visible at the platform level.
- As a super admin, I want to **manage support tickets** from schools with SLA tracking, so that issues are resolved within target response times.
- As a super admin, I want to **view real-time platform analytics** (active schools, MAU, top features, transaction volumes), so that product and commercial decisions are data-driven.
- As a super admin, I want to **audit all sensitive actions** across the platform with immutable logs, so that compliance and security are maintained.
- As a super admin, I want to **manage feature flags per school**, so that I can roll out features gradually or restrict access by subscription tier.
- As a super admin, I want to **approve or reject loan disbursements**, so that CASPAA maintains control over the credit portfolio.
- As a super admin, I want to **suspend or reactivate schools**, so that non-paying or policy-violating schools can be restricted.
- As a super admin, I want to **manage COP team user accounts** with granular RBAC, so that each internal team member only accesses what they need.
- As a super admin, I want to **view payment remittance status per school**, so that I know which schools have completed financial reconciliation.
- As a super admin, I want to **configure SMS, email, and storage quotas per school**, so that resource usage is managed per subscription plan.
- As a super admin, I want to **generate and download reports** (revenue, loans, usage) in Excel/CSV/PDF, so that I can share operational data with stakeholders.
- As a super admin, I want to **track commission revenue** (payment commissions, lending margins, referral commissions) separately, so that each revenue stream is measured independently.

---

## 5. User Flows — School Platform

---

### FLOW 01 — Student Enrollment

**Actor:** School Admin  
**Trigger:** New student joins the school

```
1. Admin → Students tab → Add Student
2. Fills form: name, DOB, gender, class, house, admission number, photo, parent link
3. System validates: checks for duplicate admission number
4. On save: student record created, parent account notified
5. If bulk: Admin uploads CSV → system previews rows → Admin confirms import
6. Student now appears in class roster, attendance register, and fee invoice system
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Duplicate admission number detected | Error shown, form not saved |
| Parent linked at registration | Parent receives in-app notification |
| Bulk CSV import succeeds | All valid rows imported, invalid rows flagged with reason |
| Student appears in class roster | Visible in attendance, results, and fee modules immediately |
| House assigned at registration | Student appears in house leaderboard |

---

### FLOW 02 — Fee Invoice & Collection

**Actor:** Finance Officer / Admin → Parent  
**Trigger:** Start of each term

```
ADMIN SIDE:
1. Finance → Fee Structure → Set fees per class for current term
2. Finance → Invoices → Generate Invoices (bulk, for all active students)
3. Invoices created with status: Unpaid
4. Parents notified in-app: "Your fee invoice for Term X is ready"

PARENT SIDE:
5. Parent → Fees → View invoice (itemised breakdown)
6. Parent clicks "Pay Now"
7. Payment modal opens — selects method: Card / Bank Transfer / USSD
8. Card: enters details → OTP → confirmed
   Bank Transfer: copies account number → pays from bank app → system reconciles
9. Invoice status → Paid, receipt generated
10. Parent can download/print receipt at any time

RECONCILIATION:
11. Finance → Reconciliation → unreconciled transfers appear
12. System auto-matches by narration (student name / admission no in reference)
13. Finance confirms match or manually selects invoice
14. Transaction marked reconciled, invoice marked paid

ADVANCE PAYMENT:
15. If parent overpays, surplus is saved as studentCredit balance
16. On next invoice generation, credit is auto-applied to reduce the new invoice balance
17. Parent notified: "₦X credit applied from previous advance payment"
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Invoice generated for all active students | Invoice count matches active student count |
| Partial payment recorded correctly | Invoice shows remaining balance |
| Overpayment creates advance credit | studentCredits balance increases by surplus amount |
| Advance credit auto-applied on next invoice | New invoice balance reduced accordingly |
| Receipt downloadable after payment | PDF receipt available in parent portal |
| Ledger ⋮ menu always visible | Actions button visible on every ledger row |

---

### FLOW 03 — Daily Attendance

**Actor:** Teacher  
**Trigger:** Start of each school day

```
1. Teacher → Attendance → Select class → Today's date auto-filled
2. Student roster loads — all shown as "Present" by default
3. Teacher taps name to toggle: Present / Absent / Late
4. For late arrivals: system shows late badge if clock-in after threshold time
5. Teacher clicks "Submit Attendance"
6. System saves record with schoolId, classId, date, teacher
7. For absent students: parents notified in-app ("Your child was marked absent today")
8. Admin can view attendance summary per class or whole school from dashboard
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Attendance submission locks the day | Teacher cannot re-submit without admin override |
| Absent student triggers parent notification | Parent receives push notification same day |
| Attendance rate calculated correctly | Dashboard shows % present per class per day |
| Late arrivals tracked separately | Late count distinct from absent count in reports |

---

### FLOW 04 — Results Submission & Approval

**Actor:** Teacher → Admin → Student / Parent  
**Trigger:** End of term / after exams

```
TEACHER:
1. Teacher → Enter Results → Select subject + class + term
2. For each student: enter CA score and exam score
3. System computes total and grade automatically
4. Teacher reviews then clicks "Submit for Approval"
5. Results saved with approved: false

ADMIN:
6. Admin → Academic → Results → sees pending results (badge count)
7. Clicks class/subject → reviews broadsheet (sorted by average, ranked)
8. Adds report comment per student (required before approval)
9. Clicks "Approve" — system sets approved: true
10. Parents and students notified: "Results for [Subject] are now available"

STUDENT / PARENT:
11. Student → My Results → sees only approved results
12. Parent → My Children → select child → Results tab → approved results
13. Parent can print Report Card (shows comment, grade, position in class)
14. Pending results show amber banner: "X result(s) awaiting teacher approval"
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| System computes total and grade automatically | Total = CA + Exam; grade matches configured grade boundaries |
| Unapproved results hidden from students/parents | No results visible until admin approves |
| Report comment required before approval | Approve button disabled if any student lacks a comment |
| Rank positions calculated correctly | Tied scores produce the same rank; next rank skips accordingly |
| Notification sent on approval | Students and parents receive in-app notification |
| Report card printable | Print view opens in new window with school branding |

---

### FLOW 05 — Loan Application (Parent)

**Actor:** Parent → Finance Officer  
**Trigger:** Parent cannot pay full fees upfront

```
1. Parent → Loans → Apply for Loan
2. Fills application: amount requested, purpose, preferred repayment period
3. System runs live credit score: analyses payment history + income estimate + tenure
4. Score shown to parent (Excellent / Good / Fair / Poor)
5. Application submitted — Finance notified

FINANCE OFFICER:
6. Finance → Lending → Pending applications
7. Reviews application + credit score breakdown (5-factor assessment)
8. Approves with repayment schedule OR rejects with reason
9. If approved: disbursement recorded, parent notified with schedule

REPAYMENT:
10. Parent → Loans → sees outstanding balance + instalment due dates
11. Parent makes repayment via payment modal (same as fee payment)
12. Instalment marked paid, balance reduces
13. Loan closes when all instalments paid
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Credit score computed on submission | Score displayed before parent submits |
| Finance notified of new application | Pending badge appears in Finance → Lending |
| Repayment schedule generated on approval | Instalment dates and amounts visible to parent |
| Loan balance reduces on each repayment | Outstanding balance updates in real time |
| Loan status changes to "Closed" on full repayment | Loan no longer appears in active loans |
| Rejection reason communicated to parent | Parent sees reason in notification and loan detail |

---

### FLOW 06 — House Points Award

**Actor:** Teacher → Student (via leaderboard)

```
INDIVIDUAL AWARD:
1. Teacher → House Points → Award Points button
2. Selects student, enters points (positive = award, negative = deduction)
3. Toggles between Award (green) and Deduct (red) with reason
4. Saves → student's house total increases/decreases
5. Student and parent notified: "[Name] was awarded 5 house points for Good Conduct"

COMPETITION (Inter-house event):
6. Admin → House Points → Competitions tab → Record Competition
7. Enters event name (e.g. "Sports Day") and type
8. For each participating house: selects house and position (1st, 2nd, 3rd, 4th)
9. System assigns competition points: 1st=50, 2nd=35, 3rd=20, 4th=10
10. Saves → leaderboard recalculates (individual merit points + competition points)
11. All house members notified of the result

LEADERBOARD:
12. Admin/Teacher/Student/Parent → House Points → Leaderboard
13. Houses sorted by total points (merit + competition)
14. Breakdown shown: merit pts · competition pts
15. Student sees their personal points within the house total
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Points awarded/deducted update leaderboard immediately | House total changes on save |
| Competition points assigned by position correctly | 1st=50, 2nd=35, 3rd=20, 4th=10 |
| Student and parent notified on award | Both receive in-app notification |
| Leaderboard shows correct house ranking | Houses sorted highest to lowest total |
| Individual student point history visible | Admin/teacher can see per-student point log |

---

### FLOW 07 — Authorized Pickup Management

**Actor:** Parent → Admin  
**Trigger:** Parent wants someone else to collect their child

```
PARENT:
1. Parent → Transport → Authorized Pickup Persons → Add Person
2. Fills: full name, relationship (Aunt, Grandparent, etc.), phone number
3. Submits request — status: Pending
4. School admin notified: "New pickup authorization request for [child name]"

ADMIN:
5. Admin → Transport → Pickup Authorizations tab
6. Sees pending requests with amber highlight
7. Reviews: name, relationship, phone, which student
8. Clicks Approve or Deny
9. Parent notified of outcome
10. If approved: person appears in the child's approved pickup list
11. If denied: parent can submit a new request or contact school

DAILY USE:
12. When person arrives to collect child, admin can verify against approved list
13. Admin can revoke authorization at any time — parent notified
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Admin notified of new pickup request | Notification with child name and requester |
| Approved person appears in pickup list | Visible to admin at gate check |
| Denied request triggers parent notification | Parent sees reason if provided |
| Revoked authorization removes person from list | Revocation reflected immediately |

---

### FLOW 08 — Bus Status Updates

**Actor:** Admin / Transport Officer → Parent  
**Trigger:** Each school day, morning and afternoon runs

```
1. Admin → Transport → Bus Status tab
2. Sees all active routes with current status (default: Waiting at School)
3. When bus departs: clicks "Departed — En Route" for that route
4. All parents of students on that route receive push notification:
   "The [Route Name] bus has departed and is now en route"
5. If delay occurs: clicks "Delayed" + optionally adds note ("Stuck in traffic")
6. Parents notified: "Bus is delayed — Stuck in traffic"
7. When bus arrives: clicks "Arrived" → parents notified
8. Parent → Transport → sees live status pill on child's route card
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Status change triggers push notification | All parents on the route notified within seconds |
| Status pill visible on parent transport card | Shows current status with colour coding |
| Delay note visible to parents | Note text appears in notification and status card |
| Multiple routes manageable independently | Each route has its own status |

---

### FLOW 09 — Student Graduation (Alumni)

**Actor:** School Admin  
**Trigger:** End of final year (SS3 or JSS3)

```
INDIVIDUAL GRADUATION:
1. Admin → Students → open student profile → Actions → Graduate to Alumni
2. Graduation modal opens with pre-filled info (final class, year)
3. Admin enters/confirms:
   - Graduation year
   - Final class
   - Examination type (WAEC, NECO, BECE, etc.)
   - Examination index number
   - Awards and distinctions
   - Leaving certificate issued? (Yes/No)
4. Confirms → student status changes to 'alumni'
5. Student no longer appears in active registers, fee invoices, or attendance

BULK GRADUATION:
6. Admin → Academic → Bulk Promotion
7. Selects class (e.g. SS3A) → destination: "Graduate to Alumni"
8. All students in class are graduated at once

ALUMNI RECORD MANAGEMENT:
9. Admin → Alumni → search for graduate by name or admission number
10. Clicks "Update Info" → adds: current university/employer, course, alumni email, phone
11. Clicks "Certificate" → prints School Leaving Certificate in new window
12. Alumni page shows stats: total alumni, this year's graduates, % with post-grad info

RE-ADMISSION:
13. Admin → Alumni → find alumnus → "Re-admit"
14. Confirms → status returns to active, alumni data preserved
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Graduated student removed from active rolls | No longer in attendance, results, or fee invoice system |
| Alumni record preserves all school data | Historical records intact after graduation |
| School Leaving Certificate printable | Opens formatted print view in new window |
| Bulk graduation processes entire class | All students in class change to alumni status in one action |
| Re-admitted alumnus rejoins active students | All modules reflect re-activation |

---

### FLOW 10 — Teacher-Parent Communication Diary

**Actor:** Teacher → Parent (and back)

```
TEACHER:
1. Teacher → Diary → select student → Write Note
2. Chooses category (Homework, Academic, Behaviour, Health, General)
3. Writes note: e.g. "Dawit struggled with fractions today — extra practice recommended"
4. Saves → parent notified: "Your child's teacher left a note"

PARENT:
5. Parent → Diary → sees notes filtered by category (All / Homework / Academic / etc.)
6. Reads note — automatically marked as read when viewed
7. Taps Reply → writes response
8. Teacher notified: "A parent replied to your note about [student name]"

TEACHER:
9. Teacher → Diary → sees reply in thread
10. Can continue the conversation or mark as resolved

ADMIN OVERSIGHT:
11. Admin → Communications → Oversight tab
12. Sees all teacher-parent conversations school-wide
13. Can read full thread history (read-only)
14. Badge count shows conversations admin is not part of
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Note saved and parent notified | Notification delivered with teacher name and student |
| Note marked read on parent view | Read status updates automatically on open |
| Reply threads correctly threaded | Replies appear under the original note |
| Admin can see all conversations | Oversight tab shows school-wide threads |
| Category filter works correctly | Only notes of selected category displayed |

---

### FLOW 11 — Digital Consent Form

**Actor:** Admin → Parent  
**Trigger:** School event requiring parental permission

```
1. Admin → Communications → Digital Consent → Create Form
2. Enters: title, description, deadline, target audience (all parents / specific class)
3. Publishes form → parents notified in-app
4. Parent → Consent → sees open forms with deadline countdown
5. Parent reads form, selects Agree or Decline
6. If declining: optionally notes reason
7. Admin → Consent → sees real-time response count and list
8. Admin can export consent list (for trip registers, etc.)
9. After deadline: form auto-closes, final response tally visible
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Form created and parents notified | All targeted parents receive notification |
| Deadline countdown visible | Timer shown on form card |
| Parent cannot re-submit | Submit button disabled after first response |
| Response tally updates in real time | Admin sees count without refreshing |
| Form auto-closes after deadline | No new submissions accepted after deadline |
| Export works | Consent list downloadable for record-keeping |

---

### FLOW 12 — Formative Assessment / CBT Exam

**Actor:** Teacher → Student

```
TEACHER CREATES:
1. Teacher → Assessments → Create Test
2. Enters: title, subject, duration, pass mark, due date
3. Adds questions: MCQ (A/B/C/D), True/False, Short Answer
4. Sets correct answers and marks per question
5. Publishes test → students in class notified

STUDENT TAKES:
6. Student → Assessments → sees Pending tests (overdue tests shown with 'Overdue' badge)
7. Opens test → sees duration reminder
8. Answers all questions
9. Clicks Submit → confirmation dialog: "Submit? You cannot edit after submission"
10. Confirms → submission saved, score computed for auto-graded questions
11. Teacher notified: "[Name] submitted [Test Name]"
12. Score shown to student immediately (for MCQ/True-False)
13. Short answer: marked by teacher, then score released

TEACHER REVIEWS:
14. Teacher → Assessments → sees submission list for each test
15. For short answer: enters score + feedback
16. Student sees final score in completed tests

ADMIN OVERSIGHT:
17. Admin → Academic → CBT tab → sees all published CBT exams school-wide
18. Clicks any exam to view per-student submissions and scores
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| MCQ/True-False auto-graded on submit | Score computed immediately |
| Short-answer held until teacher grades | Score shown as pending until teacher marks |
| Timer counts down during test | Student sees time remaining |
| Overdue tests marked with badge | Overdue badge shown; student cannot submit overdue tests |
| Admin can see all school-wide CBT exams | Oversight view includes all teachers' exams |

---

### FLOW 13 — Payroll Processing

**Actor:** Finance Officer / Admin  
**Trigger:** Monthly, on payroll run date

```
STEP 1 — Generate:
1. Finance → Payroll → Start New Payroll Run
2. System loads all active staff with their salary components
3. Auto-calculates: basic salary, allowances, deductions, net pay
4. Finance reviews generated payroll (all staff, total outflow)

STEP 2 — Adjustments:
5. Finance adds one-off adjustments: bonus, salary advance deduction, etc.
6. Each adjustment shows impact on net pay

STEP 3 — Review & Approve:
7. Finance / Admin reviews final payroll summary
8. Checks total payroll vs budget
9. Clicks Approve

STEP 4 — Publish:
10. System creates payslip records for all staff
11. Each staff member notified: "Your payslip for [Month] is available"
12. Teacher → My Payslip → views breakdown, can download PDF
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| All active staff loaded for run | No inactive or terminated staff included |
| Net pay calculated correctly | Basic + Allowances − Deductions = Net |
| Adjustments reflected before approval | Preview shows updated net per staff member |
| Payslips published to all staff simultaneously | All notifications sent on approval |
| Staff can view and download payslip | PDF download available from staff portal |
| Payroll run history preserved | Previous runs visible and not editable |

---

### FLOW 14 — Calendar Event & Notice Board

**Actor:** Admin / Principal  
**Trigger:** Upcoming school event or information to share

```
CALENDAR EVENT (date-specific):
1. Admin → Calendar → Add Event
2. Enters: title, start/end date, type (Holiday, Academic, Sports, Exam, etc.), audience
3. Event appears on calendar grid for all relevant users
4. Admin can edit or delete events (role-gated)
5. Clicking an empty day shows: "No events on this day"

NOTICE BOARD (non-date-specific pinned info):
1. Admin → Calendar → Notice Board tab → Post Notice
2. Enters: title, message, audience (Everyone / Parents / Teachers / Students)
3. Notice appears as pinned card, sorted newest first
4. All users in the audience see the notice on their Calendar → Notice Board tab
5. Admin can delete notices when no longer relevant
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Event appears on all relevant user calendars | Visible to correct audience on their calendar view |
| Notice audience filter works | Notice only visible to targeted role |
| Only admin/principal can post/edit/delete | Teachers and parents see view-only calendar |
| Events spanning multiple days shown correctly | Multi-day events displayed across all affected days |

---

### FLOW 15 — Survey / Feedback Collection

**Actor:** Admin → Parent  
**Trigger:** End of term, after events, ongoing quality monitoring

```
ADMIN:
1. Admin → Surveys → Create Survey
2. Enters: title, description, deadline
3. Adds questions (rating / multiple choice / open text)
4. Publishes → all parents notified: "New survey: [Title]"

PARENT:
5. Parent → Surveys → sees open surveys with deadline
6. Opens survey, answers all questions
7. Submits → cannot re-submit
8. If deadline passed: "This survey has closed" message shown

ADMIN REVIEWS:
9. Admin → Surveys → clicks "View Results (N)"
10. Sees aggregated responses: rating averages, option breakdowns, open text answers
11. Can close survey early or delete it
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Parents notified on publish | All parents receive in-app notification |
| Parent cannot re-submit | Submission button disabled after first response |
| Closed survey shows correct message | "Survey closed" shown after deadline |
| Results aggregated accurately | Rating averages and option counts correct |
| Admin can close survey early | Survey closes immediately, no new submissions |

---

### FLOW 16 — Sickbay Visit Recording

**Actor:** Admin / Health Staff  
**Trigger:** Student reports ill during school hours

```
1. Admin → Health/Sickbay → Log Visit
2. Selects student, enters: complaint, vital signs (optional), treatment given
3. Selects outcome:
   - Treated & Returned to class
   - Resting in sickbay
   - Sent Home → parent notification MANDATORY, auto-triggered
   - Referred to Hospital → parent notification MANDATORY, auto-triggered
4. If "Sent Home" or "Referred": system forces parent notification regardless of checkbox
5. Parent receives: "[Child name] has been sent home from school. Please contact the school."
6. Admin → Health → Student record → visit history (newest first)
7. Parent → Health → sees child's sickbay visit history
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| "Sent Home" or "Referred" forces notification | Parent notified even if checkbox unchecked |
| Visit logged with timestamp | Date and time recorded on each visit |
| Parent sees visit history | All visits visible in parent's health tab |
| Complaint and treatment visible to admin | Full record accessible from student profile |

---

### FLOW 17 — Leave Request (Staff)

**Actor:** Teacher → Admin  
**Trigger:** Teacher needs time off

```
1. Teacher → My Payslip → Leave Requests tab → Apply for Leave
   (or within HR module from admin side)
2. Fills: leave type (Annual, Sick, Emergency, Study), start date, end date, reason
3. Submits → Admin / Principal notified

ADMIN:
4. Admin → Staff & HR → Leave Requests → sees pending requests
5. Reviews: dates, type, reason, remaining leave balance
6. Approves or Denies with optional comment
7. Teacher notified of outcome
8. If approved: leave dates reflected in staff attendance record
9. Admin can arrange substitute coverage for affected classes
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Admin notified on submission | Notification with teacher name and dates |
| Leave balance shown to admin | Remaining entitlement visible before decision |
| Teacher notified of outcome | Approval or denial with comment delivered |
| Approved leave reflected in records | Staff attendance updated with leave dates |
| Substitute can be assigned to affected classes | Coverage tracked and visible |

---

### FLOW 18 — Inventory Management

**Actor:** Admin  
**Trigger:** Receiving stock, issuing items, conducting stock check

```
ADDING STOCK:
1. Admin → Operations → Inventory
2. If new item: Add Item (name, category, initial qty, unit cost, min stock, supplier)
3. If existing: Stock In (quantity received, reason: "New delivery")
4. History entry created automatically

ISSUING:
5. Admin → select item → Issue
6. Enters: quantity, recipient, reason
7. Stock level decreases, history entry created
8. If stock drops below min level: low-stock badge shown on item card

WRITE-OFF:
9. Admin selects item → Write Off (for damaged/lost items)
10. Quantity decreases, history entry shows reason

HISTORY:
11. Admin → item → View History: full log of all stock movements (in/out/write-off) newest first
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Stock in increases quantity correctly | Quantity updates immediately |
| Issuing decreases quantity correctly | Issued quantity deducted from current stock |
| Low-stock badge appears at threshold | Badge shown when quantity ≤ min stock level |
| Write-off logged with reason | History entry shows write-off reason and quantity |
| Full history auditable | All movements logged with timestamp and action |

---

### FLOW 19 — Assignment Marking with Inline Comments

**Actor:** Teacher  
**Trigger:** Student submits an assignment with an image or PDF attachment

```
TEACHER MARKS:
1. Teacher → Assignments → select assignment → View Submissions
2. Clicks "Mark" on a student's row
3. Marking panel opens: student submission on left, grading panel on right

FOR IMAGE SUBMISSIONS:
4. Teacher selects tool: ✏️ Pen / 🖊 Highlight / ⬜ Eraser / 📍 Comment
5. With 📍 Comment active: teacher clicks any spot on the image
6. Floating bubble appears at the click location
7. Teacher types the comment in the bubble, presses Enter or Save
8. Numbered blue pin (①, ②, ③…) appears on the image at that location
9. Teacher can click any pin to expand/collapse the comment
10. Teacher can add multiple pins across the image

FOR PDF SUBMISSIONS:
4. PDF rendered in embedded viewer
5. Teacher clicks "Add" button in the Inline Comments section
6. Floating bubble appears, teacher types comment
7. Comment saved to sidebar list (no image anchor for PDF)

GRADING:
8. Teacher enters Score / 100 (or uses rubric if defined)
9. Selects Mark Status: ⭐ Excellent / ✓ Satisfactory / 🔄 Needs Revision
10. Writes General Feedback in text area
11. Uses Quick Comment chips for common feedback phrases

SAVE OPTIONS:
12a. "Save & Grade" — saves grade, feedback, and all inline comments
12b. "Return to Student" — saves everything AND sets returned:true, notifies student and parent
13. "Next →" navigates to next submitted student without closing panel
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Pin placed at click position on image | Pin appears at the exact % coordinates of the click |
| Bubble appears at click location | Floating popup opens adjacent to the clicked spot |
| Empty pin cancelled removes the pin | Clicking Cancel or closing without text removes the pin |
| Existing pins reloaded when teacher re-opens | Previously saved marginalComments restored as pins |
| PDF submission shows embed viewer | PDF renders in embedded viewer panel |
| Return to Student notifies student and parent | Both receive in-app notification with grade and feedback |
| Rubric total auto-calculated | Weighted % shown when all criterion scores entered |

---

### FLOW 20 — Student Views Returned Work & Resubmits

**Actor:** Student / Parent  
**Trigger:** Teacher clicks "Return to Student" on a marked assignment

```
STUDENT RECEIVES NOTIFICATION:
1. Student notified: "Your work on [Assignment] has been returned: 78/100 (✓ Satisfactory)"
2. Student → My Assignments → sees "Returned · 78/100" badge on the assignment

STUDENT VIEWS FEEDBACK:
3. Student clicks "View Feedback" button
4. Modal opens showing:
   - Grade: 78/100
   - Status badge: ✓ Satisfactory / ⭐ Excellent / 🔄 Revision Requested
   - Return date
   - General Feedback text from teacher
   - Numbered inline comments list (from teacher's image pins)
   - Image preview (if image submission)
5. If "Revision Requested" banner shown: student prompted to revise and resubmit

STUDENT RESUBMITS:
6. Student clicks "Resubmit" button (always visible on returned work)
7. Resubmit modal opens with previous answer pre-populated
8. Student updates text / uploads new file / photo
9. Clicks "Submit Resubmission"
10. Teacher notified: "[Name] has resubmitted [Assignment]"
11. Previous submission replaced; teacher can re-mark

PARENT PARALLEL:
11. Parent also notified when work is returned
12. Parent → child's assignment → sees "View Feedback" with same modal content
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| "Returned" badge appears on assignment card | Distinct from "Graded" badge; includes score |
| View Feedback shows grade, status, feedback, and inline comments | All teacher comments visible |
| Resubmit button always visible on returned work | Not gated by "Needs Revision" flag |
| Resubmit modal pre-populates previous text | Student sees their original answer to edit |
| Teacher notified on resubmission | Notification delivered to teacher immediately |
| Parent sees same feedback content | Parent modal mirrors student modal |

---

## 6. Data Model Summary

The platform uses 56+ named collections:

| Category | Tables |
|----------|--------|
| **People** | schools, teachers, parents, students |
| **Academic** | classes, subjects, arms, academicSessions, academicTerms, schemesOfWork, timetable, lessonPlans, learningMaterials, cbtExams, cbtSubmissions, formativeTests, formativeSubmissions, reportComments |
| **Records** | attendance, results, assignments, discipline, appraisals, appraisalCycles |
| **Finance** | feeStructures, invoices, transactions, expenses, loans, disbursements, payrollRuns, payslips, salaryAdvances, budgets, remittances, schoolInvoices, studentCredits |
| **Communication** | conversations, announcements, notifications, diaryEntries, consentForms, consentResponses, feedbackForms, feedbackResponses, smsCampaigns |
| **Operations** | inventory, inventoryRequests, busRoutes, busAssignments, authorizedPickups, busStatus, sickbayVisits, visitorLog, leaveRequests, staffAttendance, substituteCoverage |
| **Engagement** | houses, housePoints, houseEvents, schoolEvents, activities, studentActivities, libraryBooks, libraryLoans, admissionApplications |
| **Platform** | auditLog, loginSessions, supportTickets, helpArticles, usageEvents, errorLogs, systemMetrics, platformTeam, schoolRoles |
| **Config** | settings, academicCalendar |

### Key Data Structures

**submissions** (sub-array on assignments):
```
{ studentId, submittedAt, text, file, grade, feedback, markStatus, annotation,
  marginalComments: [{ id, pin, x, y, text, createdAt }],
  rubricScores, returned, returnedAt, resubmissionRequested, resubmittedAt }
```

**studentCredits**:
```
{ id, studentId, schoolId, balance, updatedAt }
```

---

# PART B — CASPAA CORE OPERATIONS PORTAL (COP)

---

## 7. COP Overview

**Product Name:** CASPAA Core Operations Portal (COP)

The CASPAA Core Operations Portal is the centralized EDU_FINTECH administration and operational control platform used internally by the CASPAA team to:

- Monitor schools
- Manage subscriptions
- Monitor financial activities
- Manage loan disbursement and repayments
- Track analytics and performance
- Configure platform features
- Manage customer support
- Oversee revenue and financial operations

This portal serves as the internal "mission control center" powering the EduFinOS ecosystem. It is the operational backbone of CASPAA, the risk monitoring engine, the lending command center, the business intelligence layer, and the revenue operations dashboard. It transforms CASPAA into a scalable education-finance infrastructure company.

---

## 8. COP Target Users

| Role | Description |
|------|-------------|
| **Founder / Super Admin** | Full platform control |
| **Operations Team** | School management |
| **Finance Team** | Revenue & remittance |
| **Credit/Risk Team** | Lending management |
| **Customer Support Team** | Ticket resolution |
| **Compliance Team** | Monitoring & audit |
| **Business Intelligence Team** | Analytics & reporting |

---

## 9. COP System Modules

---

### COP MODULE 1 — Analytics Dashboard (Mission Control)

**Objective:** Provide real-time business intelligence and operational visibility.

#### Dashboard Overview Metrics

| Metric | Description |
|--------|-------------|
| Total Schools Onboarded | Total registered schools |
| Active Schools | Schools currently subscribed |
| Inactive Schools | Expired/suspended schools |
| Number of Students | Total student records |
| Number of Countries | Geographic expansion tracking |
| Number of States/Provinces | Regional analytics |
| Transaction Value | Total transaction amount |
| Transaction Volume | Total transaction count |
| Highest Value Schools | Schools with largest revenue |
| Highest Student Volume Schools | Schools with most students |

#### Payment & Remittance Analytics

| Metric | Description |
|--------|-------------|
| Total Amount Remitted | Total payments received |
| Schools Yet to Remit | Outstanding schools |
| Amount Pending Remission | Outstanding payment volume |
| Schools with Completed Remittance | Reconciled schools |

#### Lending Analytics

| Metric | Description |
|--------|-------------|
| Number of Students on Loan | Active borrowers |
| Total Loan Requests | Aggregate applications |
| Total Loans Disbursed | Successful loans |
| Total Loan Repayments | Recovered amounts |
| Outstanding Loans | Unpaid balances |
| Defaulting Students | Delinquent borrowers |
| Portfolio at Risk (PAR) | Risk monitoring |

#### Platform Usage Analytics

| Metric | Description |
|--------|-------------|
| Most Used Features | Product adoption |
| Daily Active Users | Engagement monitoring |
| App Usage Trends | Retention tracking |
| School Login Frequency | Usage consistency |

#### System Performance Metrics

| Metric | Description |
|--------|-------------|
| API Uptime | Reliability |
| Failed Payment Rate | Payment health |
| Average Response Time | Platform performance |
| Error Logs | Incident tracking |

**User Story:**  
As a Super Admin, I want to view real-time operational and financial analytics so that I can make informed strategic decisions.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Dashboard loads in < 5 seconds | Fast visibility for daily use |
| Metrics refresh automatically | Near real-time updates without page reload |
| Charts filterable by date/state/school | Drill-down to specific segments |
| Export supported | Excel/CSV/PDF export of any metric |
| KPI trends visualised | Historical comparison visible on charts |

---

### COP MODULE 2 — School Management

**Objective:** Enable centralised onboarding and lifecycle management of schools.

#### Functional Requirements

**1. Create School**
- Register school with unique ID
- Configure subscription plan
- Assign feature modules
- Set onboarding status (pending / active / onboarded)

**2. Suspend School**
- Temporary suspension (with reactivation date)
- Permanent suspension
- Restrict all school-side access on suspension
- Notify school admin and stakeholders on suspension

**3. Subscription Management**
- Assign subscription plan (Starter / Growth / Enterprise)
- Upgrade or downgrade plan
- Renew subscription
- Expiry notifications (30-day, 7-day, 1-day warnings)
- Auto-renewal configuration

**4. School Usage Analytics**
- Per-school usage statistics
- Active teachers and students count
- Payment activity summary
- Engagement and login frequency metrics

**User Story:**  
As an Operations Manager, I want to onboard and manage schools centrally so that platform operations remain scalable and controlled.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Admin can create and activate a school | School immediately accessible to school-side admin |
| Subscription assigned at onboarding | Billing activated with correct plan |
| School suspension restricts all access | School-side logins blocked on suspension |
| Notifications sent on suspension | School admin receives email and in-app notification |
| Students can be onboarded from COP | Bulk import or CSV upload from operations team |
| Usage metrics visible per school | Analytics updated in real time |

---

### COP MODULE 3 — Revenue Management

**Objective:** Maintain full visibility over all platform revenue streams.

#### Functional Requirements

**1. Subscription Revenue**
- Subscription tracking per school and plan
- Revenue breakdown by tier and geography
- MRR (Monthly Recurring Revenue) and ARR (Annual Recurring Revenue) analytics

**2. Payment Tracking**
- Monitor all incoming payments across schools
- Track failed and retry payments
- Full transaction history with filtering

**3. Invoicing Schools**
- Auto-generate platform invoices for school subscriptions
- Send invoice reminders
- Download invoices

**4. Commission Tracking**
- Payment processing commissions
- Lending interest/margin commissions
- Referral commissions

**User Story:**  
As a Finance Officer, I want to track all platform revenues so that financial operations remain transparent and measurable.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Revenue dashboard matches transactions | Figures reconcile with payment processor |
| Invoices auto-generated for subscriptions | Schools billed on renewal date |
| Failed payments flagged with alert | Finance team notified immediately |
| Commission calculations accurate | Report generated per commission type |
| MRR/ARR dashboard filterable | By month, tier, and geography |

---

### COP MODULE 4 — Lending & Disbursement Engine

**Objective:** Operate CASPAA's embedded school fee lending product.

#### Functional Requirements

**1. Loan Management**
- View all loan requests across schools
- Approve or reject loans with reason
- Disburse loans to parent accounts
- Monitor repayment schedules per borrower
- Loan status tracking (Pending / Approved / Disbursed / Repaying / Closed / Defaulted)
- Generate loan reports

**2. Loan Analytics**
- Loan volume tracking by school, term, amount range
- Risk categorisation (low / medium / high)
- Default analytics and early warning signals
- Repayment trend analysis

**3. Repayment Monitoring**
- Outstanding balances per borrower and school
- Due date reminders (auto-sent to borrowers)
- Delinquency tracking (7-day, 30-day, 60-day overdue)

**4. Disbursement Console**
- Trigger loan disbursement to verified accounts
- Verify recipient details before disbursement
- Monitor disbursement status (pending / sent / confirmed)
- Generate disbursement reports

**User Story:**  
As a Credit Officer, I want to review and disburse school fee loans so that parents can access education financing seamlessly and efficiently.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Loan requests visible in queue | Real-time updates as new applications arrive |
| Approval workflow changes status | Status updates visible to parent immediately |
| Disbursement logged as transaction | Transaction record created on disbursement |
| Repayment schedules generated | Parent receives schedule on approval |
| Default alerts triggered at 30 days | Risk dashboard updated and team notified |
| Portfolio at Risk (PAR) calculated | Updated daily based on overdue balances |

---

### COP MODULE 5 — System Control

**Objective:** Dynamically configure platform capabilities and resource allocation.

#### Functional Requirements

**1. Create / Manage Modules**
- Add new feature modules to the platform
- Enable beta features for selected schools
- Configure module-level permissions

**2. Enable / Disable Features per School**
- Feature toggles per school
- Tier-based feature access (plan determines available modules)
- Dynamic permission updates without redeploy

**3. Manage Storage**
- Storage allocation per school
- Monitor media usage (images, PDFs, documents)
- Over-quota alerts and enforcement

**4. Manage SMS Units**
- SMS credit allocation per school
- Usage monitoring and reporting
- Recharge functionality

**5. Manage Email Usage**
- Email quota tracking per school
- Delivery monitoring and bounce rates

**User Story:**  
As a Platform Administrator, I want to dynamically configure platform capabilities so that schools receive customised experiences based on their subscription tier.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Feature toggle applies instantly | School-side access changes without redeploy |
| Usage tracked in real time | Storage and SMS usage visible per school |
| Quotas enforced at threshold | School receives warning and then blocked at limit |
| Tier changes update feature access | Upgrade/downgrade reflected immediately |

---

### COP MODULE 6 — User Management

**Objective:** Secure and granular management of internal CASPAA team access.

#### Functional Requirements

**1. Create Roles**
- Admin
- Finance
- Support
- Risk/Credit
- Analyst/BI

**2. Permission Control**
- Granular RBAC (Role-Based Access Control)
- Module-level permissions (e.g. Support can see schools but not revenue)
- Access restrictions enforced at API and UI level

**3. Activity Logs**
- All user actions tracked with timestamp and user ID
- Login logs (successful + failed attempts)
- Change history (who changed what, when)
- Immutable audit trails for compliance

**User Story:**  
As a Super Admin, I want role-based access control for all internal team members so that sensitive operations remain secure and auditable.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Roles configurable without code change | Permissions saved and applied immediately |
| Unauthorised access blocked at module level | User sees access-denied screen, not blank page |
| Logs are immutable | Audit records cannot be edited or deleted |
| Login failures logged | Failed attempts visible with IP and timestamp |
| Change history queryable | Filter by user, date range, and action type |

---

### COP MODULE 7 — Support Desk

**Objective:** Manage all inbound support requests from schools efficiently.

#### Functional Requirements

**1. Support Tickets**
- Ticket creation (by school admin or by COP team on behalf of school)
- Priority assignment (Low / Medium / High / Critical)
- SLA tracking per priority level

**2. Issue Tracking**
- Bug tracking with severity classification
- Resolution workflows (Open → In Progress → Resolved → Closed)
- Escalation system (auto-escalate if SLA breached)

**3. Live Chat Support**
- Real-time support chat with school admins
- Internal support notes (not visible to school)
- Full chat history archived

**User Story:**  
As a Support Agent, I want to manage school support requests efficiently so that customer satisfaction remains high and SLAs are met.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Tickets assigned correctly | Routed to correct team by type |
| SLA timer visible on each ticket | Countdown shows time remaining before breach |
| Live chat functional | Real-time messaging with < 1 second latency |
| Resolution feedback sent to school | School admin notified when ticket resolved |
| Resolution history stored | Closed tickets searchable and auditable |
| Auto-escalation on SLA breach | Alert sent to team lead if ticket unresolved at deadline |

---

### COP MODULE 8 — Advanced Analytics & Business Intelligence

**Objective:** Provide actionable insights for management and product decisions.

#### Functional Requirements

**1. Revenue per School**
- School-level revenue analytics over time
- Payment trend analysis (MoM, QoQ, YoY)

**2. Student Enrollment Analytics**
- Number of students per school
- Enrollment trends and growth analysis
- Cohort tracking

**3. Feature Adoption**
- Most used features across the platform
- Engagement heatmaps per feature
- Feature adoption by school tier

**4. System Performance**
- Infrastructure monitoring
- Error rates and incident frequency
- API response time trends
- Uptime history

**User Story:**  
As a Business Intelligence Analyst, I want actionable platform insights so that management can optimise growth, product investment, and operational efficiency.

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Reports exportable | Excel/CSV/PDF export available on all reports |
| Filters supported | Region, date range, school, and feature filters |
| BI dashboard interactive | Drill-down from summary to school to user level |
| Trend charts rendered correctly | MoM and YoY comparisons shown side by side |
| Data refreshes without full reload | Charts update on filter change without page refresh |

---

## 10. COP User Flows

---

### COP FLOW 01 — School Onboarding (Operations Team)

**Actor:** Operations Team Member  
**Trigger:** New school signs up or is referred

```
1. COP → School Management → Create School
2. Enters school details: name, address, state, type (primary/secondary/combined), contact
3. Assigns subscription plan (Starter / Growth / Enterprise)
4. Selects feature modules to enable for this school
5. System generates school ID and admin credentials
6. Sends onboarding email to school proprietor with login link and credentials
7. School status set to: Onboarding
8. Operations team follows up to complete configuration:
   - Create classes and arms
   - Upload staff roster
   - Configure fee structure
   - Set academic calendar
9. Status updated to: Active
10. School appears in COP dashboard as Active School
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| School created with unique ID | Duplicate school name within same state flagged |
| Admin credentials auto-generated | School admin can log in immediately |
| Onboarding email sent | School receives credentials email within 60 seconds |
| Feature modules assigned by plan | School-side only sees modules in their plan |
| School appears in COP active count | Dashboard count updates |

---

### COP FLOW 02 — School Suspension

**Actor:** Operations Team / Super Admin  
**Trigger:** School subscription expired, non-payment, or policy violation

```
1. COP → School Management → select school → Suspend
2. Selects suspension type: Temporary (with reactivation date) or Permanent
3. Enters reason for suspension
4. Confirms action
5. System immediately blocks all school-side logins
6. School admin receives notification: "Your school account has been suspended. Contact support."
7. COP dashboard shows school as Inactive
8. All student and parent logins for that school also suspended
9. To reactivate: COP → school → Reactivate → confirm
10. All access restored, school notified of reactivation
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| All school-side logins blocked immediately | No session persists after suspension |
| School admin notified | Notification delivered within 60 seconds |
| COP dashboard reflects inactive count | Active/inactive counts update |
| Reactivation restores full access | All users can log in after reactivation |
| Suspension reason logged | Audit trail records who suspended and why |

---

### COP FLOW 03 — Loan Approval & Disbursement

**Actor:** Credit/Risk Team Member  
**Trigger:** Parent loan application submitted from school platform

```
1. COP → Lending → Pending Loan Requests
2. Credit officer opens application: sees amount, purpose, repayment period, credit score
3. Reviews 5-factor credit assessment:
   - Payment history (previous fee payments)
   - Loan history (prior CASPAA loans)
   - School tenure (how long child has been enrolled)
   - Income estimate (from fee payment patterns)
   - Requested amount vs estimated capacity
4. Adds internal risk note (visible to COP team only)
5. Decision:
   a. Approve: sets repayment schedule, clicks Approve
   b. Reject: enters reason for parent, clicks Reject

ON APPROVAL:
6. System generates repayment schedule
7. Parent notified: "Your loan of ₦X has been approved. Repayment starts [date]."
8. Credit officer → Disbursement Console → verifies recipient account
9. Triggers disbursement
10. Disbursement status monitored: Pending → Sent → Confirmed
11. Disbursement report generated

REPAYMENT MONITORING:
12. COP → Lending → Active Loans → shows outstanding per borrower
13. Automated reminders sent to parent 3 days before due date
14. Overdue loans escalate: 7-day → 30-day → 60-day flags
15. Portfolio at Risk (PAR) updated daily
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Credit score visible to reviewer | Full 5-factor breakdown shown |
| Approval triggers repayment schedule | Schedule created with correct dates and amounts |
| Parent notified on approval and rejection | Notification includes reason if rejected |
| Disbursement logged as transaction | Transaction record with timestamp and amount |
| Overdue loans trigger escalation alerts | Team lead notified at 30-day overdue mark |
| PAR calculated correctly | Outstanding overdue / total portfolio |

---

### COP FLOW 04 — Revenue Dashboard & Reporting

**Actor:** Finance Team Member  
**Trigger:** Monthly close, investor reporting, or ad-hoc query

```
1. COP → Revenue Management → Dashboard
2. Views summary: Total Revenue MTD, MRR, ARR, by stream (subscriptions, commissions, lending)
3. Filters by: date range, school, region, plan tier
4. Drills down to school level: clicks any school to see its revenue contribution
5. Views payment breakdown: successful, failed, retried
6. Commission report: payment commissions, lending margins, referral fees
7. Clicks Export → selects format (Excel / CSV / PDF)
8. Report downloaded with selected filters applied
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Dashboard loads in < 5 seconds | Fast access for daily monitoring |
| Filters apply without full reload | Charts update dynamically |
| Revenue figures match payment processor | Reconciliation diff = 0 |
| Export includes applied filters | Exported data matches dashboard view |
| Commission calculations broken down by type | Payment / lending / referral shown separately |

---

### COP FLOW 05 — Support Ticket Resolution

**Actor:** Customer Support Team Member  
**Trigger:** School admin submits a support ticket

```
1. School admin → Help/Support → Submit Ticket (school-side)
   OR COP agent creates ticket on school's behalf
2. COP → Support Desk → New ticket appears in queue
3. Agent reviews: school, issue type, priority, description
4. Assigns to themselves or routes to specialist
5. Changes status: Open → In Progress
6. Adds internal notes (not visible to school)
7. If bug: escalates to engineering with reproduction steps
8. Resolves issue, changes status: In Progress → Resolved
9. Sends resolution message to school admin
10. School admin receives: "Your support ticket #X has been resolved"
11. Agent closes ticket after school confirms resolution
12. If SLA breached: automatic escalation to team lead with breach alert

AUDIT:
13. All ticket history preserved and searchable
14. Resolution time recorded and visible in SLA report
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Tickets assigned with correct priority | Priority drives SLA timer |
| SLA countdown visible on each ticket | Timer shows time remaining to resolution |
| Internal notes not visible to school | School only sees agent's outbound messages |
| School notified on resolution | Notification with ticket number and resolution detail |
| SLA breach triggers escalation | Team lead alerted automatically |
| All ticket history archived | Searchable by school, date, type, and agent |

---

### COP FLOW 06 — Feature Flag Management

**Actor:** Super Admin / Operations Team  
**Trigger:** New feature rollout, tier upgrade, or plan downgrade

```
1. COP → System Control → Feature Management
2. Selects school or selects plan tier
3. Sees list of all available modules with current on/off state
4. Toggles module on or off for selected school or tier
5. Change applied immediately — no redeploy required
6. School-side: affected users see or lose access to the module instantly
7. Change logged in audit trail: who changed, what module, for which school, when
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Toggle applies without redeploy | School-side access changes within 5 seconds |
| Change logged in audit trail | Immutable record with agent ID and timestamp |
| Tier-level change affects all schools on that tier | All schools in tier updated simultaneously |
| School-side user sees change in real time | Module appears/disappears on next navigation |

---

### COP FLOW 07 — COP User & Role Management

**Actor:** Super Admin  
**Trigger:** New team member onboarded or role change required

```
1. COP → User Management → Create User
2. Enters: name, email, team (Finance / Support / Risk / Operations / BI)
3. Assigns role: determines module-level access
4. Sets temporary password, sends invite email
5. New team member logs in, resets password, completes profile
6. Super Admin can edit or revoke access at any time
7. On revocation: all active sessions terminated immediately

ACTIVITY MONITORING:
8. COP → User Management → Activity Logs
9. Filters by: user, date range, action type (login / data view / change / export)
10. Sees full audit trail with IP address and timestamp
11. Failed login attempts visible with source IP
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| Invite email sent on user creation | New user receives login link within 60 seconds |
| Role determines module access correctly | User only sees permitted modules |
| Revocation terminates all sessions | User cannot access COP after revocation |
| Activity logs are immutable | No user (including super admin) can delete logs |
| Failed logins logged with IP | Security team can investigate brute-force attempts |

---

### COP FLOW 08 — Analytics & BI Reporting

**Actor:** Business Intelligence Team  
**Trigger:** Weekly/monthly reporting or ad-hoc management query

```
1. COP → Analytics → select report type:
   - Platform Overview (schools, users, transactions)
   - Revenue Analysis (MRR, ARR, by tier)
   - Lending Portfolio (volume, defaults, PAR)
   - Feature Adoption (most-used features, DAU)
   - System Performance (uptime, API latency, errors)
2. Sets filters: date range, region, school, plan tier
3. Charts render with selected data
4. Drill-down: clicks any bar/segment → see school-level breakdown
5. Annotates key findings (internal notes on chart)
6. Exports report in required format
7. Schedules automated report delivery to management email (daily/weekly/monthly)
```

**Acceptance Criteria:**

| Criteria | Expected Outcome |
|----------|-----------------|
| All 5 report types render correctly | Data accurate and filters applied |
| Drill-down works to school level | Click on any metric to see per-school breakdown |
| Export includes charts and tables | PDF export includes visualisations |
| Scheduled reports delivered on time | Email sent at configured time with correct data |
| Trend comparisons shown | MoM and YoY deltas visible on each metric |

---

## 11. Non-Functional Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Dashboard load time | < 5 seconds |
| Concurrent admin users (COP) | 5,000+ |
| Concurrent school-side users | 50,000+ |
| API response time | < 300ms |
| Real-time notification delivery | < 5 seconds |

### Security

| Requirement | Description |
|-------------|-------------|
| RBAC | Granular role-based permissions at module and action level |
| MFA | Required for all COP admin accounts |
| Audit logs | Immutable; cannot be edited or deleted |
| Encryption | AES-256 at rest + TLS 1.3 in transit |
| Session timeout | Auto logout after 30 minutes of inactivity (COP) |
| IP allowlisting | COP accessible only from approved IPs |

### Reliability

| Requirement | Target |
|-------------|--------|
| Platform uptime | 99.9% SLA |
| Backups | Daily automated with 30-day retention |
| Disaster recovery | Multi-region failover; RTO < 4 hours |
| Data integrity | Zero tolerance for data loss on payment transactions |

### Scalability

| Requirement | Description |
|-------------|-------------|
| Multi-tenant architecture | Strict school-level data isolation |
| Horizontal scaling | Auto-scale on demand |
| Target school capacity | 10,000+ schools on a single deployment |

### Tech Stack (Production Target)

| Layer | Technology |
|-------|-----------|
| School Portal Frontend | React.js / Next.js |
| COP Frontend | React.js / Next.js |
| Backend | Node.js (NestJS) |
| Database | PostgreSQL (multi-tenant) |
| Cache | Redis |
| Realtime Messaging | Socket.io |
| Cloud | AWS |
| Analytics | Metabase / Power BI |
| Monitoring | CloudWatch + PagerDuty |
| Payments | Paystack |
| SMS | Termii / Africa's Talking |
| Email | SendGrid |

---

## 12. Success Metrics & KPIs

### Business KPIs (Year 1)

| KPI | Target |
|-----|--------|
| Schools onboarded | 60 |
| Active schools | 50+ |
| Revenue tracked | ₦1B+ payments |
| Loan disbursement | ₦300M |

### Operations KPIs

| KPI | Target |
|-----|--------|
| Support ticket resolution time | < 12 hours |
| Platform uptime | 99.9% |
| Payment reconciliation accuracy | > 98% |

### Lending KPIs

| KPI | Target |
|-----|--------|
| Loan repayment rate | > 92% |
| Default rate | < 8% |
| Loan approval turnaround | < 24 hours |
| Portfolio at Risk (PAR 30) | < 10% |

---

# PART C — GOVERNANCE

---

## 13. Roles & Permissions Matrix

### School Platform

| Feature | Super Admin | School Admin | Principal | Finance | Teacher | Parent | Student |
|---------|------------|--------------|-----------|---------|---------|--------|---------|
| Student records | ✓ | ✓ | ✓ | — | Read | Own child | Own |
| Staff records | ✓ | ✓ | ✓ | — | Own | — | — |
| Results (enter) | — | — | — | — | ✓ | — | — |
| Results (approve) | — | ✓ | ✓ | — | — | — | — |
| Results (view) | ✓ | ✓ | ✓ | — | ✓ | Approved only | Approved only |
| Fee structure | — | ✓ | — | ✓ | — | — | — |
| Invoices | — | ✓ | — | ✓ | — | Own | — |
| Payments | — | ✓ | — | ✓ | — | Own | — |
| Loans (apply) | — | — | — | — | — | ✓ | — |
| Loans (approve) | ✓ | ✓ | — | ✓ | — | — | — |
| Payroll | — | ✓ | — | ✓ | — | — | — |
| Payslip | — | — | — | — | Own | — | — |
| Attendance (mark) | — | — | — | — | ✓ | — | — |
| Attendance (view) | ✓ | ✓ | ✓ | — | Class | Own child | Own |
| Assignments (create) | — | — | — | — | ✓ | — | — |
| Assignments (mark) | — | — | — | — | ✓ | — | — |
| Assignments (submit) | — | — | — | — | — | — | ✓ |
| Assignments (view all) | ✓ | ✓ | — | — | Own | — | — |
| Calendar | ✓ | ✓ | ✓ | — | View | View | View |
| Notice Board (post) | — | ✓ | ✓ | — | — | — | — |
| House Points (award) | — | ✓ | ✓ | — | ✓ | — | — |
| Transport (manage) | — | ✓ | — | — | — | Own child | — |
| Pickup (authorise) | — | ✓ | — | — | — | Submit | — |
| Sickbay | — | ✓ | ✓ | — | — | View | — |
| Inventory | — | ✓ | ✓ | — | — | — | — |
| Alumni | — | ✓ | ✓ | — | — | — | — |
| Surveys (create) | — | ✓ | ✓ | — | — | — | — |
| Surveys (respond) | — | — | — | — | — | ✓ | — |
| Diary (write) | — | — | — | — | ✓ | — | — |
| Diary (read/reply) | — | — | — | — | — | ✓ | — |
| Comms oversight | — | ✓ | — | — | — | — | — |
| CBT/Assessments (create) | — | — | — | — | ✓ | — | — |
| CBT/Assessments (take) | — | — | — | — | — | — | ✓ |
| CBT/Assessments (view all) | ✓ | ✓ | — | — | — | — | — |
| Platform settings | ✓ | — | — | — | — | — | — |
| School settings | — | ✓ | — | — | — | — | — |
| All schools data | ✓ | — | — | — | — | — | — |

### COP — Internal Team

| Module | Super Admin | Operations | Finance | Credit/Risk | Support | BI/Analyst | Compliance |
|--------|------------|------------|---------|-------------|---------|------------|------------|
| Analytics Dashboard | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| School Management | ✓ | ✓ | — | — | Read | — | Read |
| Revenue Management | ✓ | — | ✓ | — | — | ✓ | Read |
| Lending & Disbursement | ✓ | — | — | ✓ | — | Read | ✓ |
| System Control | ✓ | ✓ | — | — | — | — | — |
| User Management | ✓ | — | — | — | — | — | ✓ |
| Support Desk | ✓ | — | — | — | ✓ | — | — |
| Advanced Analytics | ✓ | — | ✓ | — | — | ✓ | ✓ |

---

## 14. Out of Scope (Post-MVP)

| Feature | Reason |
|---------|--------|
| Bulk disbursement | Future treasury operations layer |
| NIBSS direct settlement | Phase 2 banking integration |
| Savings products | Requires banking/microfinance licence |
| Investment products | Future EDU_FINTECH vertical |
| Cross-border lending | Regulatory complexity |
| Advanced AI underwriting | Requires larger dataset (Phase 3) |
| Native mobile app | Phase 2 after web platform validated |
| Offline mode | Complex sync; deferred to Phase 2 |

---

*Document Version 3.0 — June 2026*  
*Covers: CASPAA School Operating System (School-Facing) + CASPAA Core Operations Portal (Internal)*  
*Company: AfriSprings Resources Ltd.*
