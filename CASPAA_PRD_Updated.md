# CASPAA — School Operating System
## Product Requirements Document (Updated)
### User Stories & User Flows

**Version:** 2.0  
**Last Updated:** June 2026  
**Product:** CASPAA — School ERP + Embedded Finance Platform  
**Company:** AfriSprings

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles](#2-user-roles)
3. [Module Index](#3-module-index)
4. [User Stories by Role](#4-user-stories-by-role)
5. [User Flows](#5-user-flows)
6. [Data Model Summary](#6-data-model-summary)

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
- **Storage:** LocalStorage mock DB (production: cloud DB)
- **Auth:** Multi-role session with role-based access control
- **Payments:** Paystack integration (card, bank transfer, USSD)
- **Notifications:** In-app push + WhatsApp deep-links

---

## 2. User Roles

| Role | Access Level | Primary Concern |
|------|-------------|-----------------|
| **Super Admin** (CASPAA staff) | Platform-wide | School management, revenue, support |
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
- As a teacher, I want to **mark submitted assignments** and give grades and feedback, so that students know how they performed.
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
- As a parent, I want to **apply for a loan** to cover school fees, so that I can spread the cost over installments.
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

---

### 4.6 Student

- As a student, I want to **see my dashboard** with my attendance, upcoming assignments, results, and house points, so that I know where I stand.
- As a student, I want to **access lesson notes and videos** uploaded by my teacher, so that I can study at home.
- As a student, I want to **submit assignments online**, so that I don't have to carry physical work to school.
- As a student, I want to **take CBT tests and formative assessments** on the platform, so that my performance is recorded immediately.
- As a student, I want to **view my approved results**, so that I can see my grades once the teacher and admin have signed off.
- As a student, I want to **see my timetable**, so that I know what subjects I have each day.
- As a student, I want to **see the school calendar**, so that I'm aware of upcoming events.
- As a student, I want to **see the house leaderboard** and my personal house points, so that I know how my house is performing.

---

### 4.7 Super Admin (CASPAA Staff)

- As a super admin, I want to **onboard new schools** with full configuration (classes, terms, fee structure, staff), so that a school is operational from day one.
- As a super admin, I want to **view platform revenue** (subscriptions, transaction fees, lending margins), so that I can track CASPAA's financial health.
- As a super admin, I want to **monitor all active loans** across all schools, so that credit risk is visible at the platform level.
- As a super admin, I want to **manage support tickets** from schools, so that issues are resolved quickly.
- As a super admin, I want to **view platform analytics** (active schools, MAU, top features), so that product decisions are data-driven.
- As a super admin, I want to **audit all sensitive actions** across the platform, so that compliance and security are maintained.
- As a super admin, I want to **manage feature flags** per school, so that I can roll out features gradually.

---

## 5. User Flows

---

### FLOW 01 — Student Enrollment

**Actor:** School Admin  
**Trigger:** New student joins the school

```
1. Admin → Students tab → Add Student
2. Fills form: name, DOB, gender, class, admission number, photo, parent link
3. System validates: checks for duplicate admission number
4. On save: student record created, parent account notified
5. If bulk: Admin uploads CSV → system previews rows → Admin confirms import
6. Student now appears in class roster, attendance register, and fee invoice system
```

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
```

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
10. Parent → Loans → sees outstanding balance + installment due dates
11. Parent makes repayment via payment modal (same as fee payment)
12. Installment marked paid, balance reduces
13. Loan closes when all installments paid
```

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
```

---

### FLOW 11 — Digital Consent Form

**Actor:** Admin → Parent  
**Trigger:** School event requiring parental permission (field trip, medical procedure, etc.)

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
```

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
5. Clicking an empty day shows: "No events on this day" toast

NOTICE BOARD (non-date-specific pinned info):
1. Admin → Calendar → Notice Board tab → Post Notice
2. Enters: title, message, audience (Everyone / Parents / Teachers / Students)
3. Notice appears as pinned card, sorted newest first
4. All users in the audience see the notice on their Calendar → Notice Board tab
5. Admin can delete notices when no longer relevant
```

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

---

## 6. Data Model Summary

The platform uses 56+ named collections:

| Category | Tables |
|----------|--------|
| **People** | schools, teachers, parents, students |
| **Academic** | classes, subjects, arms, academicSessions, academicTerms, schemesOfWork, timetable, lessonPlans, learningMaterials, cbtExams, cbtSubmissions, formativeTests, formativeSubmissions, reportComments |
| **Records** | attendance, results, assignments, discipline, appraisals, appraisalCycles |
| **Finance** | feeStructures, invoices, transactions, expenses, loans, disbursements, payrollRuns, payslips, salaryAdvances, budgets, remittances, schoolInvoices |
| **Communication** | conversations, announcements, notifications, diaryEntries, consentForms, consentResponses, feedbackForms, feedbackResponses, smsCampaigns |
| **Operations** | inventory, inventoryRequests, busRoutes, busAssignments, authorizedPickups, busStatus, sickbayVisits, visitorLog, leaveRequests, staffAttendance, substituteCoverage |
| **Engagement** | houses, housePoints, houseEvents, schoolEvents, activities, studentActivities, libraryBooks, libraryLoans, admissionApplications |
| **Platform** | auditLog, loginSessions, supportTickets, helpArticles, usageEvents, errorLogs, systemMetrics, platformTeam, schoolRoles |
| **Config** | settings, academicCalendar |

---

## Appendix — Roles & Permissions Matrix

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
| Loans | — | ✓ | — | ✓ | — | Own | — |
| Payroll | — | ✓ | — | ✓ | — | — | — |
| Payslip | — | — | — | — | Own | — | — |
| Attendance (mark) | — | — | — | — | ✓ | — | — |
| Attendance (view) | ✓ | ✓ | ✓ | — | Class | Own child | Own |
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
| Platform settings | ✓ | — | — | — | — | — | — |
| School settings | — | ✓ | — | — | — | — | — |
| All schools data | ✓ | — | — | — | — | — | — |

---

*Document generated from the CASPAA prototype codebase — June 2026*  
*For the original PRD see: PRD_EDTECH_CASPAA_AFRISPRINGS.pdf*
