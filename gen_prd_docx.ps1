Add-Type -AssemblyName "System.IO.Compression.FileSystem"
$A = [char]38

$outPath = "C:\Users\USER\Desktop\CASPAA\CASPAA_PRD.docx"
$tmpDir  = Join-Path $env:TEMP "caspaa_prd_build"

if (Test-Path $tmpDir) { Remove-Item -Recurse -Force $tmpDir }
New-Item -ItemType Directory -Path $tmpDir            | Out-Null
New-Item -ItemType Directory -Path "$tmpDir\_rels"    | Out-Null
New-Item -ItemType Directory -Path "$tmpDir\word"     | Out-Null
New-Item -ItemType Directory -Path "$tmpDir\word\_rels" | Out-Null

function xe([string]$s) { $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;' }

function p([string]$text,[string]$sty="Normal",[switch]$bold,[switch]$italic) {
    $rpr = if ($bold) { "<w:rPr><w:b/></w:rPr>" } elseif ($italic) { "<w:rPr><w:i/><w:color w:val=""666666""/></w:rPr>" } else { "" }
    "<w:p><w:pPr><w:pStyle w:val=""$sty""/></w:pPr><w:r>$rpr<w:t xml:space=""preserve"">$(xe $text)</w:t></w:r></w:p>"
}
function h1([string]$t)  { p $t "Heading1" }
function h2([string]$t)  { p $t "Heading2" }
function h3([string]$t)  { p $t "Heading3" }
function h4([string]$t)  { p $t "Heading4" }
function sp()            { "<w:p/>" }
function pb()            { "<w:p><w:r><w:br w:type=""page""/></w:r></w:p>" }
function bul([string]$t) { p $t "ListBullet" }
function it([string]$t)  { p $t "Normal" -italic }

function code([string]$block) {
    $out = ""
    foreach ($line in ($block -split "`n")) {
        $out += "<w:p><w:pPr><w:pStyle w:val=""Code""/></w:pPr><w:r><w:t xml:space=""preserve"">$(xe $line)</w:t></w:r></w:p>"
    }
    $out
}

function tbl([string[][]]$rows) {
    $nCols = $rows[0].Length
    $cw    = [int](8800 / $nCols)
    $bdr   = "<w:tblBorders><w:top w:val=""single"" w:sz=""4"" w:color=""auto""/><w:left w:val=""single"" w:sz=""4"" w:color=""auto""/><w:bottom w:val=""single"" w:sz=""4"" w:color=""auto""/><w:right w:val=""single"" w:sz=""4"" w:color=""auto""/><w:insideH w:val=""single"" w:sz=""4"" w:color=""auto""/><w:insideV w:val=""single"" w:sz=""4"" w:color=""auto""/></w:tblBorders>"
    $out = "<w:tbl><w:tblPr><w:tblW w:w=""8800"" w:type=""dxa""/>$bdr</w:tblPr>"
    $first = $true
    foreach ($row in $rows) {
        $out += "<w:tr>"
        if ($first) { $out += "<w:trPr><w:tblHeader/></w:trPr>" }
        foreach ($cell in $row) {
            $shd = if ($first) { "<w:shd w:val=""clear"" w:color=""auto"" w:fill=""1F3864""/>" } else { "" }
            $rpr = if ($first) { "<w:rPr><w:b/><w:color w:val=""FFFFFF""/></w:rPr>" } else { "" }
            $out += "<w:tc><w:tcPr><w:tcW w:w=""$cw"" w:type=""dxa""/>$shd<w:tcMar><w:top w:w=""80"" w:type=""dxa""/><w:left w:w=""140"" w:type=""dxa""/><w:bottom w:w=""80"" w:type=""dxa""/><w:right w:w=""140"" w:type=""dxa""/></w:tcMar></w:tcPr><w:p><w:r>$rpr<w:t xml:space=""preserve"">$(xe $cell)</w:t></w:r></w:p></w:tc>"
        }
        $out += "</w:tr>"
        $first = $false
    }
    $out += "</w:tbl><w:p/>"
    $out
}

function partBanner([string]$label,[string]$title) {
    (pb) + (p $label "PartLabel") + (p $title "PartTitle") + (sp)
}

function actor([string]$title,[string]$actor,[string]$trigger="") {
    $line = if ($trigger) { "Actor: $actor  |  Trigger: $trigger" } else { "Actor: $actor" }
    (h3 $title) + (p $line "ActorLine")
}

$b = [System.Text.StringBuilder]::new()
function add([string]$xml) { $b.Append($xml) | Out-Null }

# ── COVER ───────────────────────────────────────────────────────────────────
add (p "CASPAA" "DocTitle")
add (p "EduFinTech Platform" "DocSubtitle")
add (sp)
add (p "Product Requirements Document" "DocTitle2")
add (p "School Management Platform $($A) Core Operations Portal (COP)" "DocSubtitle")
add (sp)
add (p "Version 2.0   |   June 2026   |   Status: Approved" "Normal" -italic)
add (pb)

# ── TOC ─────────────────────────────────────────────────────────────────────
add (h1 "Table of Contents")
add (p "Part A — School Management Platform" "Normal" -bold)
add (bul "1. Executive Summary")
add (bul "Brand Mission and Vision")
add (bul "2. Platform Goals")
add (bul "3. User Roles")
add (bul "4. School Platform Modules")
add (bul "5. User Flows 01-20")
add (bul "6. Data Model Summary")
add (p "Part B — Core Operations Portal (COP)" "Normal" -bold)
add (bul "7. COP Overview")
add (bul "8. COP Target Users")
add (bul "9. COP System Modules 1-8")
add (bul "10. COP User Flows 01-08")
add (p "Part C — Governance" "Normal" -bold)
add (bul "11. Non-Functional Requirements")
add (bul "12. Success Metrics $($A) KPIs")
add (bul "13. Roles $($A) Permissions Matrix")
add (bul "14. Out of Scope (Post-MVP)")
add (pb)

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PART A
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
add (partBanner "PART A" "CASPAA School Management Platform")
add (h2 "1. Executive Summary")
add (p "CASPAA is a comprehensive school ERP and EduFinTech platform serving K-12 schools across Nigeria and sub-Saharan Africa. It unifies academic management, financial operations, staff administration, parent engagement, and school lending into a single, role-aware web application.")
add (p "This document defines all user flows, acceptance criteria, user stories, and data models for both the School Platform (used by schools) and the Core Operations Portal (COP, used internally by the CASPAA team).")

add (h2 "Brand Mission and Vision")
add (h3 "Mission")
add (p "To empower K-12 schools across Nigeria and sub-Saharan Africa with a unified EduFinTech platform that eliminates administrative burden, deepens parent engagement, and unlocks access to school-fee financing -- so educators can focus entirely on teaching.")
add (h3 "Vision")
add (p "A future where every African school operates paperlessly, every parent stays connected in real time, and no student loses their place in the classroom because of a financial barrier.")

add (h2 "2. Platform Goals")
add (bul "Eliminate paper-based administration across all school departments")
add (bul "Enable real-time parent engagement and transparency")
add (bul "Provide embedded school-fee financing (CASPAA Loans)")
add (bul "Give CASPAA full operational visibility through the COP")
add (bul "Support 50,000+ concurrent users across 10,000+ schools")

add (h2 "3. User Roles")
add (tbl @(
    @("Role","Description"),
    @("Super Admin","CASPAA staff with full cross-school visibility"),
    @("School Admin","School-level administrator managing all operations"),
    @("Principal","Academic leadership; result approval and staff oversight"),
    @("Finance Officer","Fee collection, payroll, loans, and financial reporting"),
    @("Teacher","Academic delivery, attendance, assignments, grading"),
    @("Parent","Fee payment, child monitoring, loan applications"),
    @("Student","Assignments, results, assessments, house points")
))

add (h2 "4. School Platform Modules")
add (tbl @(
    @("Module","Key Capabilities"),
    @("Student Management","Enrolment, profiles, promotion, graduation, alumni"),
    @("Academic","Timetable, attendance, lesson plans, schemes of work, CBT exams"),
    @("Results $($A) Reports","Score entry, grade computation, report cards, approval workflow"),
    @("Finance","Fee structure, invoicing, payments, loans, payroll, expenses"),
    @("Assignments","Creation, submission, inline image annotation, resubmission"),
    @("Communication","Diary, notice board, consent forms, surveys, announcements"),
    @("Transport","Bus routes, live status, authorised pickup management"),
    @("Operations","Inventory, sickbay, visitor log, leave requests, staff attendance"),
    @("House Points","Merit awards, competition scoring, leaderboard"),
    @("HR $($A) Staff","Staff profiles, appraisals, payslips, leave management"),
    @("Calendar","Academic calendar, events, notice board, term dates"),
    @("Settings","School configuration, branding, role management, integrations")
))

add (h2 "5. User Flows")

# ── FLOW 01 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 01 — Student Enrolment" "School Admin" "New student joining the school")
$s = "NEW ADMISSION:`n1. Admin > Students > Add New Student`n2. Fills: first name, last name, gender, date of birth, class, arm, admission number`n3. Adds parent/guardian: name, phone, email, relationship`n4. Uploads optional profile photo`n5. Saves > student assigned unique ID, parent account auto-created`n6. Parent receives welcome notification with login credentials`n`nBULK IMPORT:`n7. Admin > Students > Import CSV`n8. Downloads CSV template, fills student + parent details per row`n9. Uploads CSV > system validates each row`n10. Rows with errors flagged (duplicate admission number, missing required fields)`n11. Admin resolves errors and re-imports; all valid students created in batch"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Duplicate admission number blocked","Error message shown; student not created"),
    @("Parent account created automatically","Parent can log in with generated credentials"),
    @("CSV import validates each row","Invalid rows listed with reason; valid rows created"),
    @("Student appears in class register","Visible in attendance and results for assigned class"),
    @("Profile photo upload works","Photo stored and displayed on student card")
))

# ── FLOW 02 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 02 — Fee Payment (Parent)" "Parent > Finance Officer" "School term begins, invoices generated")
$s = "INVOICE GENERATION:`n1. Finance > Fee Structure > confirm current term structure`n2. Finance > Invoices > Generate Invoices for [Class/All Students]`n3. System creates per-student invoice based on fee structure + any credits/discounts`n4. Parent notified: Your child's invoice for [Term] is ready`n`nPAYMENT:`n5. Parent > Finance > sees outstanding invoice with breakdown`n6. Clicks Pay Now > selects payment method (bank transfer / card / USSD)`n7. Payment processed via Paystack`n8. Receipt generated automatically`n9. Invoice marked as Paid or Part Paid (if partial)`n`nRECORDING CASH / BANK TRANSFER:`n10. Finance > Payments > Record Manual Payment`n11. Selects student, enters amount, payment method, reference, date`n12. Saves > invoice updated, receipt generated"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Invoice total matches fee structure","No rounding errors; discounts applied correctly"),
    @("Online payment updates invoice immediately","Invoice status changes to Paid on webhook confirmation"),
    @("Part payment updates outstanding balance","Balance = original amount minus amount paid"),
    @("Receipt downloadable","PDF receipt generated with payment reference"),
    @("Finance dashboard reflects new payment","Daily collection total updates in real time")
))

# ── FLOW 03 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 03 — Attendance Marking" "Teacher" "Each school day")
$s = "DAILY ATTENDANCE:`n1. Teacher > Attendance > select class + date (defaults to today)`n2. Student list loads with three-state toggle: Present / Absent / Late`n3. Teacher marks each student`n4. Clicks Save > attendance recorded for that class on that date`n5. Absent students parents notified: [Child name] was marked absent today`n`nEDITING:`n6. Teacher or Admin can edit a past record (today only for teachers, any date for admin)`n7. Edit reason logged for audit trail`n`nREPORTS:`n8. Admin > Attendance > Reports > filter by class / date range / student`n9. Attendance % computed per student: days present / school days`n10. Students below threshold (e.g. 75%) flagged with amber badge"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Absent parent notification sent","Parent receives in-app notification within 60 seconds"),
    @("Attendance % calculated correctly","Formula: present days / total school days x 100"),
    @("Below-threshold students flagged","Amber badge visible on report and student profile"),
    @("Teacher can only edit today's record","Past dates locked for teachers; admin can override"),
    @("Attendance visible on report card","Term attendance % shown on printed report card")
))

# ── FLOW 04 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 04 — Results Entry $($A) Report Card" "Teacher > Principal" "End of term")
$s = "RESULT ENTRY:`n1. Teacher > Results > select subject + class + term`n2. Student list loads with score columns (CA1, CA2, CA3, Exam)`n3. Teacher enters scores for each student`n4. System computes total and grade automatically`n5. Teacher clicks Submit for Approval`n`nPRINCIPAL APPROVAL:`n6. Principal > Results > Pending Approval`n7. Reviews scores per subject/class`n8. Must add a comment per student before approving`n9. Clicks Approve > results locked for editing`n10. Students and parents notified: Your [Term] results are available`n`nREPORT CARD:`n11. Admin/Principal > Reports > select student > Print Report Card`n12. Report card opens in print view with school branding, scores, grades, attendance, and class position"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Total computed automatically","CA1+CA2+CA3+Exam = Total; Grade from grade table"),
    @("Scores locked after approval","Teacher cannot edit after principal approves"),
    @("Report comment required before approval","Approve button disabled if any student lacks a comment"),
    @("Rank positions calculated correctly","Tied scores produce same rank; next rank skips"),
    @("Notification sent on approval","Students and parents receive in-app notification"),
    @("Report card printable","Print view opens in new window with school branding")
))

# ── FLOW 05 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 05 — Loan Application (Parent)" "Parent > Finance Officer" "Parent cannot pay full fees upfront")
$s = "1. Parent > Loans > Apply for Loan`n2. Fills: amount requested, purpose, preferred repayment period`n3. System runs live credit score: analyses payment history + income estimate + tenure`n4. Score shown to parent (Excellent / Good / Fair / Poor)`n5. Application submitted -- Finance notified`n`nFINANCE OFFICER:`n6. Finance > Lending > Pending applications`n7. Reviews application + credit score breakdown (5-factor assessment)`n8. Approves with repayment schedule OR rejects with reason`n9. If approved: disbursement recorded, parent notified with schedule`n`nREPAYMENT:`n10. Parent > Loans > sees outstanding balance + instalment due dates`n11. Parent makes repayment via payment modal`n12. Instalment marked paid, balance reduces`n13. Loan closes when all instalments paid"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Credit score computed on submission","Score displayed before parent submits"),
    @("Finance notified of new application","Pending badge appears in Finance > Lending"),
    @("Repayment schedule generated on approval","Instalment dates and amounts visible to parent"),
    @("Loan balance reduces on each repayment","Outstanding balance updates in real time"),
    @("Loan closes on full repayment","Loan no longer appears in active loans"),
    @("Rejection reason communicated to parent","Parent sees reason in notification and loan detail")
))

# ── FLOW 06 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 06 — House Points Award" "Teacher > Student (via leaderboard)" "")
$s = "INDIVIDUAL AWARD:`n1. Teacher > House Points > Award Points button`n2. Selects student, enters points (positive = award, negative = deduction)`n3. Toggles between Award (green) and Deduct (red) with reason`n4. Saves > student's house total increases/decreases`n5. Student and parent notified: [Name] was awarded 5 house points for Good Conduct`n`nCOMPETITION (Inter-house event):`n6. Admin > House Points > Competitions tab > Record Competition`n7. Enters event name and type`n8. For each house: selects position (1st=50 pts, 2nd=35, 3rd=20, 4th=10)`n9. Leaderboard recalculates: individual merit points + competition points`n`nLEADERBOARD:`n10. Houses sorted by total points (merit + competition)`n11. Student sees their personal points within the house total"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Points update leaderboard immediately","House total changes on save"),
    @("Competition points assigned by position","1st=50, 2nd=35, 3rd=20, 4th=10"),
    @("Student and parent notified on award","Both receive in-app notification"),
    @("Leaderboard shows correct ranking","Houses sorted highest to lowest total"),
    @("Individual student point history visible","Admin/teacher can see per-student point log")
))

# ── FLOW 07 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 07 — Authorised Pickup Management" "Parent > Admin" "Parent wants someone else to collect their child")
$s = "PARENT:`n1. Parent > Transport > Authorized Pickup Persons > Add Person`n2. Fills: full name, relationship, phone number`n3. Submits request -- status: Pending`n4. School admin notified`n`nADMIN:`n5. Admin > Transport > Pickup Authorizations tab`n6. Reviews: name, relationship, phone, which student`n7. Clicks Approve or Deny`n8. Parent notified of outcome`n9. If approved: person appears in the child's approved pickup list`n`nDAILY USE:`n10. When person arrives, admin verifies against approved list`n11. Admin can revoke authorization at any time"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Admin notified of new pickup request","Notification with child name and requester"),
    @("Approved person appears in pickup list","Visible to admin at gate check"),
    @("Denied request triggers parent notification","Parent sees reason if provided"),
    @("Revoked authorization removes person from list","Revocation reflected immediately")
))

# ── FLOW 08 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 08 — Bus Status Updates" "Admin / Transport Officer > Parent" "Each school day, morning and afternoon runs")
$s = "1. Admin > Transport > Bus Status tab`n2. Sees all active routes with current status (default: Waiting at School)`n3. When bus departs: clicks Departed -- En Route for that route`n4. All parents of students on that route receive push notification`n5. If delay: clicks Delayed + optionally adds note (Stuck in traffic)`n6. Parents notified of delay with note`n7. When bus arrives: clicks Arrived > parents notified`n8. Parent > Transport > sees live status pill on child's route card"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Status change triggers push notification","All parents on the route notified within seconds"),
    @("Status pill visible on parent transport card","Shows current status with colour coding"),
    @("Delay note visible to parents","Note text appears in notification and status card"),
    @("Multiple routes manageable independently","Each route has its own status")
))

# ── FLOW 09 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 09 — Student Graduation (Alumni)" "School Admin" "End of final year (SS3 or JSS3)")
$s = "INDIVIDUAL GRADUATION:`n1. Admin > Students > open student profile > Actions > Graduate to Alumni`n2. Admin enters/confirms: graduation year, final class, exam type, index number, awards`n3. Confirms > student status changes to alumni`n4. Student no longer appears in active registers, fee invoices, or attendance`n`nBULK GRADUATION:`n5. Admin > Academic > Bulk Promotion`n6. Selects class (e.g. SS3A) > destination: Graduate to Alumni`n7. All students in class are graduated at once`n`nALUMNI RECORD MANAGEMENT:`n8. Admin > Alumni > search for graduate by name or admission number`n9. Update Info: current university/employer, course, alumni email, phone`n10. Certificate: prints School Leaving Certificate in new window`n`nRE-ADMISSION:`n11. Admin > Alumni > find alumnus > Re-admit`n12. Status returns to active; all alumni data preserved"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Graduated student removed from active rolls","No longer in attendance, results, or fee invoice system"),
    @("Alumni record preserves all school data","Historical records intact after graduation"),
    @("School Leaving Certificate printable","Opens formatted print view in new window"),
    @("Bulk graduation processes entire class","All students change to alumni status in one action"),
    @("Re-admitted alumnus rejoins active students","All modules reflect re-activation")
))

# ── FLOW 10 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 10 — Teacher-Parent Communication Diary" "Teacher > Parent (and back)" "")
$s = "TEACHER:`n1. Teacher > Diary > select student > Write Note`n2. Chooses category (Homework, Academic, Behaviour, Health, General)`n3. Saves > parent notified: Your child's teacher left a note`n`nPARENT:`n4. Parent > Diary > sees notes filtered by category`n5. Reads note -- automatically marked as read when viewed`n6. Taps Reply > writes response`n7. Teacher notified: A parent replied to your note about [student name]`n`nADMIN OVERSIGHT:`n8. Admin > Communications > Oversight tab`n9. Sees all teacher-parent conversations school-wide (read-only)"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Note saved and parent notified","Notification delivered with teacher name and student"),
    @("Note marked read on parent view","Read status updates automatically on open"),
    @("Reply threads correctly threaded","Replies appear under the original note"),
    @("Admin can see all conversations","Oversight tab shows school-wide threads"),
    @("Category filter works correctly","Only notes of selected category displayed")
))

# ── FLOW 11 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 11 — Digital Consent Form" "Admin > Parent" "School event requiring parental permission")
$s = "1. Admin > Communications > Digital Consent > Create Form`n2. Enters: title, description, deadline, target audience`n3. Publishes form > parents notified in-app`n4. Parent > Consent > sees open forms with deadline countdown`n5. Parent reads form, selects Agree or Decline`n6. Admin > Consent > sees real-time response count and list`n7. Admin can export consent list`n8. After deadline: form auto-closes, final response tally visible"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Form created and parents notified","All targeted parents receive notification"),
    @("Deadline countdown visible","Timer shown on form card"),
    @("Parent cannot re-submit","Submit button disabled after first response"),
    @("Response tally updates in real time","Admin sees count without refreshing"),
    @("Form auto-closes after deadline","No new submissions accepted after deadline"),
    @("Export works","Consent list downloadable for record-keeping")
))

# ── FLOW 12 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 12 — Formative Assessment / CBT Exam" "Teacher > Student" "")
$s = "TEACHER CREATES:`n1. Teacher > Assessments > Create Test`n2. Enters: title, subject, duration, pass mark, due date`n3. Adds questions: MCQ (A/B/C/D), True/False, Short Answer`n4. Publishes test > students in class notified`n`nSTUDENT TAKES:`n5. Student > Assessments > sees Pending tests`n6. Answers all questions > Clicks Submit`n7. Score computed immediately for MCQ/True-False`n8. Short answer: teacher marks, then score released`n`nADMIN OVERSIGHT:`n9. Admin > Academic > CBT tab > sees all published CBT exams school-wide"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("MCQ/True-False auto-graded on submit","Score computed immediately"),
    @("Short-answer held until teacher grades","Score shown as pending until teacher marks"),
    @("Timer counts down during test","Student sees time remaining"),
    @("Overdue tests marked with badge","Overdue badge shown; student cannot submit"),
    @("Admin can see all school-wide CBT exams","Oversight view includes all teachers' exams")
))

# ── FLOW 13 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 13 — Payroll Processing" "Finance Officer / Admin" "Monthly, on payroll run date")
$s = "STEP 1 - Generate:`n1. Finance > Payroll > Start New Payroll Run`n2. System loads all active staff with salary components`n3. Auto-calculates: basic salary, allowances, deductions, net pay`n`nSTEP 2 - Adjustments:`n4. Finance adds one-off adjustments: bonus, salary advance deduction, etc.`n`nSTEP 3 - Review $($A) Approve:`n5. Finance / Admin reviews final payroll summary`n6. Checks total payroll vs budget > Clicks Approve`n`nSTEP 4 - Publish:`n7. System creates payslip records for all staff`n8. Each staff member notified: Your payslip for [Month] is available`n9. Teacher > My Payslip > views breakdown, can download PDF"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("All active staff loaded for run","No inactive or terminated staff included"),
    @("Net pay calculated correctly","Basic + Allowances minus Deductions = Net"),
    @("Adjustments reflected before approval","Preview shows updated net per staff member"),
    @("Payslips published to all staff simultaneously","All notifications sent on approval"),
    @("Staff can view and download payslip","PDF download available from staff portal"),
    @("Payroll run history preserved","Previous runs visible and not editable")
))

# ── FLOW 14 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 14 — Calendar Event $($A) Notice Board" "Admin / Principal" "Upcoming school event or information to share")
$s = "CALENDAR EVENT (date-specific):`n1. Admin > Calendar > Add Event`n2. Enters: title, start/end date, type (Holiday, Academic, Sports, Exam), audience`n3. Event appears on calendar grid for all relevant users`n4. Admin can edit or delete events (role-gated)`n`nNOTICE BOARD (non-date-specific):`n1. Admin > Calendar > Notice Board tab > Post Notice`n2. Enters: title, message, audience (Everyone / Parents / Teachers / Students)`n3. Notice appears as pinned card, sorted newest first`n4. Admin can delete notices when no longer relevant"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Event appears on all relevant user calendars","Visible to correct audience on their calendar view"),
    @("Notice audience filter works","Notice only visible to targeted role"),
    @("Only admin/principal can post/edit/delete","Teachers and parents see view-only calendar"),
    @("Events spanning multiple days shown correctly","Multi-day events displayed across all affected days")
))

# ── FLOW 15 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 15 — Survey / Feedback Collection" "Admin > Parent" "End of term, after events, ongoing quality monitoring")
$s = "ADMIN:`n1. Admin > Surveys > Create Survey`n2. Enters: title, description, deadline`n3. Adds questions (rating / multiple choice / open text)`n4. Publishes > all parents notified`n`nPARENT:`n5. Parent > Surveys > sees open surveys with deadline`n6. Opens survey, answers all questions > Submits`n7. If deadline passed: This survey has closed message shown`n`nADMIN REVIEWS:`n8. Admin > Surveys > clicks View Results`n9. Sees aggregated responses: rating averages, option breakdowns, open text answers"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Parents notified on publish","All parents receive in-app notification"),
    @("Parent cannot re-submit","Submission button disabled after first response"),
    @("Closed survey shows correct message","Survey closed shown after deadline"),
    @("Results aggregated accurately","Rating averages and option counts correct"),
    @("Admin can close survey early","Survey closes immediately, no new submissions")
))

# ── FLOW 16 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 16 — Sickbay Visit Recording" "Admin / Health Staff" "Student reports ill during school hours")
$s = "1. Admin > Health/Sickbay > Log Visit`n2. Selects student, enters: complaint, vital signs (optional), treatment given`n3. Selects outcome:`n   - Treated $($A) Returned to class`n   - Resting in sickbay`n   - Sent Home  [parent notification MANDATORY, auto-triggered]`n   - Referred to Hospital  [parent notification MANDATORY, auto-triggered]`n4. Parent receives: [Child name] has been sent home from school.`n5. Admin > Health > Student record > visit history (newest first)`n6. Parent > Health > sees child's sickbay visit history"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Sent Home or Referred forces notification","Parent notified even if checkbox unchecked"),
    @("Visit logged with timestamp","Date and time recorded on each visit"),
    @("Parent sees visit history","All visits visible in parent's health tab"),
    @("Complaint and treatment visible to admin","Full record accessible from student profile")
))

# ── FLOW 17 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 17 — Leave Request (Staff)" "Teacher > Admin" "Teacher needs time off")
$s = "1. Teacher > My Payslip > Leave Requests tab > Apply for Leave`n2. Fills: leave type (Annual, Sick, Emergency, Study), start date, end date, reason`n3. Submits > Admin / Principal notified`n`nADMIN:`n4. Admin > Staff $($A) HR > Leave Requests > sees pending requests`n5. Reviews: dates, type, reason, remaining leave balance`n6. Approves or Denies with optional comment`n7. Teacher notified of outcome`n8. If approved: leave dates reflected in staff attendance record"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Admin notified on submission","Notification with teacher name and dates"),
    @("Leave balance shown to admin","Remaining entitlement visible before decision"),
    @("Teacher notified of outcome","Approval or denial with comment delivered"),
    @("Approved leave reflected in records","Staff attendance updated with leave dates"),
    @("Substitute can be assigned to affected classes","Coverage tracked and visible")
))

# ── FLOW 18 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 18 — Inventory Management" "Admin" "Receiving stock, issuing items, conducting stock check")
$s = "ADDING STOCK:`n1. Admin > Operations > Inventory`n2. If new item: Add Item (name, category, initial qty, unit cost, min stock, supplier)`n3. If existing: Stock In (quantity received, reason)`n`nISSUING:`n4. Admin > select item > Issue`n5. Enters: quantity, recipient, reason`n6. Stock level decreases; if below min level: low-stock badge shown`n`nWRITE-OFF:`n7. Admin selects item > Write Off (for damaged/lost items)`n8. Quantity decreases, history entry shows reason`n`nHISTORY:`n9. Admin > item > View History: full log of all stock movements newest first"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Stock in increases quantity correctly","Quantity updates immediately"),
    @("Issuing decreases quantity correctly","Issued quantity deducted from current stock"),
    @("Low-stock badge appears at threshold","Badge shown when quantity <= min stock level"),
    @("Write-off logged with reason","History entry shows write-off reason and quantity"),
    @("Full history auditable","All movements logged with timestamp and action")
))

# ── FLOW 19 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 19 — Assignment Marking with Inline Comments" "Teacher" "Student submits an assignment with an image or PDF attachment")
$s = "TEACHER MARKS:`n1. Teacher > Assignments > select assignment > View Submissions`n2. Clicks Mark on a student's row`n3. Marking panel opens: student submission on left, grading panel on right`n`nFOR IMAGE SUBMISSIONS:`n4. Pin comment tool auto-activates when marking panel opens`n5. Teacher clicks any spot on the image`n6. Floating bubble appears at the click location`n7. Teacher types comment > presses Enter or Save`n8. Numbered blue pin (1, 2, 3...) appears on the image at that location`n9. Teacher can click any pin to expand/collapse the comment`n`nFOR PDF SUBMISSIONS:`n4. PDF rendered in embedded viewer`n5. Teacher clicks Add button in Inline Comments section`n6. Comment saved to sidebar list`n`nGRADING:`n7. Teacher enters Score / 100 (or uses rubric if defined)`n8. Selects Mark Status: Excellent / Satisfactory / Needs Revision`n9. Writes General Feedback in text area`n`nSAVE OPTIONS:`n10a. Save $($A) Grade -- saves grade, feedback, and all inline comments`n10b. Return to Student -- saves everything AND notifies student and parent"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Pin placed at click position on image","Pin appears at the exact % coordinates of the click"),
    @("Bubble appears at click location","Floating popup opens adjacent to the clicked spot"),
    @("Empty pin cancelled removes the pin","Clicking Cancel or closing without text removes the pin"),
    @("Existing pins reloaded when teacher re-opens","Previously saved comments restored as pins"),
    @("PDF submission shows embed viewer","PDF renders in embedded viewer panel"),
    @("Return to Student notifies student and parent","Both receive in-app notification with grade and feedback"),
    @("Rubric total auto-calculated","Weighted % shown when all criterion scores entered")
))

# ── FLOW 20 ─────────────────────────────────────────────────────────────────
add (actor "FLOW 20 — Student Views Returned Work $($A) Resubmits" "Student / Parent" "Teacher clicks Return to Student on a marked assignment")
$s = "STUDENT RECEIVES NOTIFICATION:`n1. Student notified: Your work on [Assignment] has been returned: 78/100 (Satisfactory)`n2. Student > My Assignments > sees Returned 78/100 badge on the assignment`n`nSTUDENT VIEWS FEEDBACK:`n3. Student clicks View Feedback button`n4. Modal opens showing:`n   - Grade: 78/100`n   - Status badge: Satisfactory / Excellent / Revision Requested`n   - General Feedback text from teacher`n   - Numbered inline comments list (from teacher's image pins)`n   - Image preview (if image submission)`n`nSTUDENT RESUBMITS:`n5. Student clicks Resubmit button (always visible on returned work)`n6. Resubmit modal opens with previous answer pre-populated`n7. Student updates text / uploads new file`n8. Clicks Submit Resubmission`n9. Teacher notified: [Name] has resubmitted [Assignment]`n10. Previous submission replaced; teacher can re-mark`n`nPARENT PARALLEL:`n11. Parent also notified when work is returned`n12. Parent sees View Feedback with same modal content as student"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Returned badge appears on assignment card","Distinct from Graded badge; includes score"),
    @("View Feedback shows grade, status, feedback, and inline comments","All teacher comments visible"),
    @("Resubmit button always visible on returned work","Not gated by Needs Revision flag"),
    @("Resubmit modal pre-populates previous text","Student sees their original answer to edit"),
    @("Teacher notified on resubmission","Notification delivered to teacher immediately"),
    @("Parent sees same feedback content","Parent modal mirrors student modal")
))

add (h2 "6. Data Model Summary")
add (p "The platform uses 56+ named collections:")
add (tbl @(
    @("Category","Collections"),
    @("People","schools, teachers, parents, students"),
    @("Academic","classes, subjects, arms, academicSessions, academicTerms, schemesOfWork, timetable, lessonPlans, learningMaterials, cbtExams, cbtSubmissions, formativeTests"),
    @("Records","attendance, results, assignments, discipline, appraisals, appraisalCycles"),
    @("Finance","feeStructures, invoices, transactions, expenses, loans, disbursements, payrollRuns, payslips, salaryAdvances, budgets, remittances"),
    @("Communication","conversations, announcements, notifications, diaryEntries, consentForms, consentResponses, feedbackForms, smsCampaigns"),
    @("Operations","inventory, busRoutes, busAssignments, authorizedPickups, busStatus, sickbayVisits, visitorLog, leaveRequests, staffAttendance"),
    @("Engagement","houses, housePoints, houseEvents, schoolEvents, activities, libraryBooks, libraryLoans, admissionApplications"),
    @("Platform","auditLog, loginSessions, supportTickets, helpArticles, usageEvents, errorLogs, systemMetrics"),
    @("Config","settings, academicCalendar")
))
$s = "submissions (sub-array on assignments):`n{ studentId, submittedAt, text, file, grade, feedback, markStatus, annotation,`n  marginalComments: [{ id, pin, x, y, text, createdAt }],`n  rubricScores, returned, returnedAt, resubmissionRequested, resubmittedAt }"
add (h4 "Key Data Structure")
add (code $s)

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PART B
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
add (partBanner "PART B" "CASPAA Core Operations Portal (COP)")

add (h2 "7. COP Overview")
add (p "The CASPAA Core Operations Portal is the centralised EDU_FINTECH administration and operational control platform used internally by the CASPAA team to monitor schools, manage subscriptions, oversee financial activities, manage loan disbursement and repayments, track analytics, configure platform features, manage customer support, and oversee revenue operations.")
add (p "The COP is the internal mission control center powering the EduFinOS ecosystem: the operational backbone, risk monitoring engine, lending command center, business intelligence layer, and revenue operations dashboard.")

add (h2 "8. COP Target Users")
add (tbl @(
    @("Role","Description"),
    @("Founder / Super Admin","Full platform control"),
    @("Operations Team","School management and onboarding"),
    @("Finance Team","Revenue and remittance oversight"),
    @("Credit/Risk Team","Lending management and portfolio risk"),
    @("Customer Support Team","Ticket resolution and school liaison"),
    @("Compliance Team","Monitoring and audit trail review"),
    @("Business Intelligence Team","Analytics and reporting")
))

add (h2 "9. COP System Modules")

add (h3 "COP MODULE 1 — Analytics Dashboard (Mission Control)")
add (p "Objective: Provide real-time business intelligence and operational visibility.")
add (tbl @(
    @("Metric","Description"),
    @("Total Schools Onboarded","Total registered schools"),
    @("Active Schools","Schools currently subscribed"),
    @("Inactive Schools","Expired/suspended schools"),
    @("Number of Students","Total student records across all schools"),
    @("Transaction Value","Total transaction amount processed"),
    @("Transaction Volume","Total transaction count"),
    @("Highest Value Schools","Schools with largest revenue contribution"),
    @("Students on Loan","Active borrowers count"),
    @("Total Loans Disbursed","Successful loans value"),
    @("Outstanding Loans","Unpaid balances"),
    @("Portfolio at Risk (PAR)","Risk monitoring ratio")
))
add (it "User Story: As a Super Admin, I want to view real-time operational and financial analytics so that I can make informed strategic decisions.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Dashboard loads in < 5 seconds","Fast visibility for daily use"),
    @("Metrics refresh automatically","Near real-time updates without page reload"),
    @("Charts filterable by date/state/school","Drill-down to specific segments"),
    @("Export supported","Excel/CSV/PDF export of any metric"),
    @("KPI trends visualised","Historical comparison visible on charts")
))

add (h3 "COP MODULE 2 — School Management")
add (p "Objective: Enable centralised onboarding and lifecycle management of schools.")
add (bul "Create School: Register with unique ID, configure subscription plan, assign feature modules")
add (bul "Suspend School: Temporary (with reactivation date) or permanent; restricts all access; notifies school admin")
add (bul "Subscription Management: Assign/upgrade/downgrade plans (Starter / Growth / Enterprise); expiry notifications at 30-day, 7-day, 1-day")
add (bul "School Usage Analytics: Per-school usage statistics, active teacher/student counts, payment activity summary")
add (it "User Story: As an Operations Manager, I want to onboard and manage schools centrally so that platform operations remain scalable and controlled.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Admin can create and activate a school","School immediately accessible to school-side admin"),
    @("Subscription assigned at onboarding","Billing activated with correct plan"),
    @("School suspension restricts all access","School-side logins blocked on suspension"),
    @("Notifications sent on suspension","School admin receives email and in-app notification"),
    @("Usage metrics visible per school","Analytics updated in real time")
))

add (h3 "COP MODULE 3 — Revenue Management")
add (p "Objective: Maintain full visibility over all platform revenue streams.")
add (bul "Subscription Revenue: MRR, ARR, breakdown by tier and geography")
add (bul "Payment Tracking: All incoming payments, failed payments, full transaction history")
add (bul "Invoicing Schools: Auto-generate platform invoices, send reminders, download invoices")
add (bul "Commission Tracking: Payment processing, lending interest/margin, referral commissions")
add (it "User Story: As a Finance Officer, I want to track all platform revenues so that financial operations remain transparent and measurable.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Revenue dashboard matches transactions","Figures reconcile with payment processor"),
    @("Invoices auto-generated for subscriptions","Schools billed on renewal date"),
    @("Failed payments flagged with alert","Finance team notified immediately"),
    @("MRR/ARR dashboard filterable","By month, tier, and geography")
))

add (h3 "COP MODULE 4 — Lending $($A) Disbursement Engine")
add (p "Objective: Operate CASPAA's embedded school fee lending product.")
add (bul "Loan Management: View all loan requests, approve/reject, disburse, monitor repayment schedules")
add (bul "Loan Status Tracking: Pending / Approved / Disbursed / Repaying / Closed / Defaulted")
add (bul "Loan Analytics: Volume by school/term/amount, risk categorisation, default analytics, repayment trends")
add (bul "Repayment Monitoring: Outstanding balances, auto-reminders, delinquency tracking (7-day, 30-day, 60-day overdue)")
add (bul "Disbursement Console: Trigger disbursement, verify recipient, monitor status (pending/sent/confirmed)")
add (it "User Story: As a Credit Officer, I want to review and disburse school fee loans so that parents can access education financing seamlessly and efficiently.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Loan requests visible in queue","Real-time updates as new applications arrive"),
    @("Approval workflow changes status","Status updates visible to parent immediately"),
    @("Disbursement logged as transaction","Transaction record created on disbursement"),
    @("Repayment schedules generated","Parent receives schedule on approval"),
    @("Default alerts triggered at 30 days","Risk dashboard updated and team notified"),
    @("Portfolio at Risk (PAR) calculated","Updated daily based on overdue balances")
))

add (h3 "COP MODULE 5 — System Control")
add (p "Objective: Dynamically configure platform capabilities and resource allocation.")
add (bul "Feature Management: Add/enable/disable modules per school; beta feature rollout; tier-based access")
add (bul "Storage Management: Allocation per school, media usage monitoring, over-quota alerts")
add (bul "SMS Units: Credit allocation per school, usage monitoring, recharge")
add (bul "Email Usage: Quota tracking per school, delivery monitoring and bounce rates")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Feature toggle applies instantly","School-side access changes without redeploy"),
    @("Usage tracked in real time","Storage and SMS usage visible per school"),
    @("Quotas enforced at threshold","School receives warning and then blocked at limit"),
    @("Tier changes update feature access","Upgrade/downgrade reflected immediately")
))

add (h3 "COP MODULE 6 — User Management")
add (p "Objective: Secure and granular management of internal CASPAA team access.")
add (bul "Roles: Admin, Finance, Support, Risk/Credit, Analyst/BI")
add (bul "Permission Control: Granular RBAC; module-level permissions enforced at API and UI level")
add (bul "Activity Logs: All user actions tracked with timestamp; login logs; immutable audit trails")
add (it "User Story: As a Super Admin, I want role-based access control for all internal team members so that sensitive operations remain secure and auditable.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Roles configurable without code change","Permissions saved and applied immediately"),
    @("Unauthorised access blocked at module level","User sees access-denied screen, not blank page"),
    @("Logs are immutable","Audit records cannot be edited or deleted"),
    @("Login failures logged","Failed attempts visible with IP and timestamp"),
    @("Change history queryable","Filter by user, date range, and action type")
))

add (h3 "COP MODULE 7 — Support Desk")
add (p "Objective: Manage all inbound support requests from schools efficiently.")
add (bul "Support Tickets: Creation, priority assignment (Low/Medium/High/Critical), SLA tracking per priority")
add (bul "Issue Tracking: Bug tracking with severity, resolution workflows (Open > In Progress > Resolved > Closed), auto-escalation on SLA breach")
add (bul "Live Chat Support: Real-time messaging with school admins; internal notes not visible to school; full chat history archived")
add (it "User Story: As a Support Agent, I want to manage school support requests efficiently so that customer satisfaction remains high and SLAs are met.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Tickets assigned with correct priority","Routed to correct team by type"),
    @("SLA timer visible on each ticket","Countdown shows time remaining before breach"),
    @("Live chat functional","Real-time messaging with < 1 second latency"),
    @("Resolution feedback sent to school","School admin notified when ticket resolved"),
    @("Auto-escalation on SLA breach","Alert sent to team lead if ticket unresolved at deadline")
))

add (h3 "COP MODULE 8 — Advanced Analytics $($A) Business Intelligence")
add (p "Objective: Provide actionable insights for management and product decisions.")
add (bul "Revenue per School: School-level revenue over time, MoM/QoQ/YoY trends")
add (bul "Student Enrollment Analytics: Students per school, enrollment trends, cohort tracking")
add (bul "Feature Adoption: Most-used features, engagement heatmaps, adoption by school tier")
add (bul "System Performance: Infrastructure monitoring, error rates, API response times, uptime history")
add (it "User Story: As a Business Intelligence Analyst, I want actionable platform insights so that management can optimise growth, product investment, and operational efficiency.")
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Reports exportable","Excel/CSV/PDF export available on all reports"),
    @("Filters supported","Region, date range, school, and feature filters"),
    @("BI dashboard interactive","Drill-down from summary to school to user level"),
    @("Trend charts rendered correctly","MoM and YoY comparisons shown side by side")
))

add (h2 "10. COP User Flows")

add (actor "COP FLOW 01 — School Onboarding" "Operations Team Member" "New school signs up or is referred")
$s = "1. COP > School Management > Create School`n2. Enters school details: name, address, state, type, contact`n3. Assigns subscription plan (Starter / Growth / Enterprise)`n4. Selects feature modules to enable`n5. System generates school ID and admin credentials`n6. Sends onboarding email to school proprietor`n7. School status set to: Onboarding`n8. Operations team completes configuration (classes, staff roster, fee structure, calendar)`n9. Status updated to: Active`n10. School appears in COP dashboard as Active School"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("School created with unique ID","Duplicate school name within same state flagged"),
    @("Admin credentials auto-generated","School admin can log in immediately"),
    @("Onboarding email sent","School receives credentials email within 60 seconds"),
    @("Feature modules assigned by plan","School-side only sees modules in their plan")
))

add (actor "COP FLOW 02 — School Suspension" "Operations Team / Super Admin" "Subscription expired, non-payment, or policy violation")
$s = "1. COP > School Management > select school > Suspend`n2. Selects suspension type: Temporary (with reactivation date) or Permanent`n3. Enters reason for suspension and confirms`n4. System immediately blocks all school-side logins`n5. School admin receives notification`n6. COP dashboard shows school as Inactive`n7. All student and parent logins also suspended`n`nTO REACTIVATE:`n8. COP > school > Reactivate > confirm`n9. All access restored, school notified of reactivation"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("All school-side logins blocked immediately","No session persists after suspension"),
    @("School admin notified","Notification delivered within 60 seconds"),
    @("Reactivation restores full access","All users can log in after reactivation"),
    @("Suspension reason logged","Audit trail records who suspended and why")
))

add (actor "COP FLOW 03 — Loan Approval $($A) Disbursement" "Credit/Risk Team Member" "Parent loan application submitted from school platform")
$s = "1. COP > Lending > Pending Loan Requests`n2. Credit officer opens application: amount, purpose, repayment period, credit score`n3. Reviews 5-factor credit assessment:`n   - Payment history (previous fee payments)`n   - Loan history (prior CASPAA loans)`n   - School tenure (how long child has been enrolled)`n   - Income estimate (from fee payment patterns)`n   - Requested amount vs estimated capacity`n4. Adds internal risk note (COP team only)`n5. Decision: Approve with schedule OR Reject with reason`n`nON APPROVAL:`n6. Parent notified: Your loan has been approved. Repayment starts [date].`n7. Credit officer > Disbursement Console > verifies account > triggers disbursement`n8. Status: Pending > Sent > Confirmed`n`nREPAYMENT MONITORING:`n9. Automated reminders sent to parent 3 days before due date`n10. Overdue loans escalate: 7-day > 30-day > 60-day flags`n11. Portfolio at Risk (PAR) updated daily"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Credit score visible to reviewer","Full 5-factor breakdown shown"),
    @("Approval triggers repayment schedule","Schedule created with correct dates and amounts"),
    @("Parent notified on approval and rejection","Notification includes reason if rejected"),
    @("Disbursement logged as transaction","Transaction record with timestamp and amount"),
    @("Overdue loans trigger escalation alerts","Team lead notified at 30-day overdue mark")
))

add (actor "COP FLOW 04 — Revenue Dashboard $($A) Reporting" "Finance Team Member" "Monthly close, investor reporting, or ad-hoc query")
$s = "1. COP > Revenue Management > Dashboard`n2. Views: Total Revenue MTD, MRR, ARR by stream (subscriptions, commissions, lending)`n3. Filters by: date range, school, region, plan tier`n4. Drills down to school level for revenue contribution`n5. Views payment breakdown: successful, failed, retried`n6. Commission report: payment commissions, lending margins, referral fees`n7. Clicks Export > selects format (Excel / CSV / PDF)"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Dashboard loads in < 5 seconds","Fast access for daily monitoring"),
    @("Filters apply without full reload","Charts update dynamically"),
    @("Revenue figures match payment processor","Reconciliation diff = 0"),
    @("Commission calculations broken down by type","Payment / lending / referral shown separately")
))

add (actor "COP FLOW 05 — Support Ticket Resolution" "Customer Support Team Member" "School admin submits a support ticket")
$s = "1. School admin > Help/Support > Submit Ticket (school-side)`n   OR COP agent creates ticket on school's behalf`n2. COP > Support Desk > New ticket appears in queue`n3. Agent reviews: school, issue type, priority, description`n4. Assigns to themselves or routes to specialist > status: Open > In Progress`n5. Adds internal notes (not visible to school)`n6. If bug: escalates to engineering with reproduction steps`n7. Resolves issue > status: In Progress > Resolved`n8. School admin notified: Your support ticket #X has been resolved`n9. If SLA breached: automatic escalation to team lead`n`nAUDIT:`n10. All ticket history preserved and searchable`n11. Resolution time recorded in SLA report"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("SLA countdown visible on each ticket","Timer shows time remaining to resolution"),
    @("Internal notes not visible to school","School only sees agent's outbound messages"),
    @("School notified on resolution","Notification with ticket number and resolution detail"),
    @("SLA breach triggers escalation","Team lead alerted automatically")
))

add (actor "COP FLOW 06 — Feature Flag Management" "Super Admin / Operations Team" "New feature rollout, tier upgrade, or plan downgrade")
$s = "1. COP > System Control > Feature Management`n2. Selects school or plan tier`n3. Sees list of all available modules with current on/off state`n4. Toggles module on or off`n5. Change applied immediately -- no redeploy required`n6. School-side: affected users see or lose access to the module instantly`n7. Change logged in audit trail: who changed, what module, for which school, when"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Toggle applies without redeploy","School-side access changes within 5 seconds"),
    @("Change logged in audit trail","Immutable record with agent ID and timestamp"),
    @("Tier-level change affects all schools on that tier","All schools in tier updated simultaneously")
))

add (actor "COP FLOW 07 — COP User $($A) Role Management" "Super Admin" "New team member onboarded or role change required")
$s = "1. COP > User Management > Create User`n2. Enters: name, email, team (Finance / Support / Risk / Operations / BI)`n3. Assigns role: determines module-level access`n4. Sets temporary password, sends invite email`n5. Super Admin can edit or revoke access at any time`n6. On revocation: all active sessions terminated immediately`n`nACTIVITY MONITORING:`n7. COP > User Management > Activity Logs`n8. Filters by: user, date range, action type`n9. Sees full audit trail with IP address and timestamp"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("Invite email sent on user creation","New user receives login link within 60 seconds"),
    @("Role determines module access correctly","User only sees permitted modules"),
    @("Revocation terminates all sessions","User cannot access COP after revocation"),
    @("Activity logs are immutable","No user (including super admin) can delete logs")
))

add (actor "COP FLOW 08 — Analytics $($A) BI Reporting" "Business Intelligence Team" "Weekly/monthly reporting or ad-hoc management query")
$s = "1. COP > Analytics > select report type:`n   - Platform Overview (schools, users, transactions)`n   - Revenue Analysis (MRR, ARR, by tier)`n   - Lending Portfolio (volume, defaults, PAR)`n   - Feature Adoption (most-used features, DAU)`n   - System Performance (uptime, API latency, errors)`n2. Sets filters: date range, region, school, plan tier`n3. Charts render with selected data`n4. Drill-down: clicks any bar/segment > see school-level breakdown`n5. Exports report in required format`n6. Schedules automated report delivery to management email"
add (code $s)
add (h4 "Acceptance Criteria")
add (tbl @(
    @("Criteria","Expected Outcome"),
    @("All 5 report types render correctly","Data accurate and filters applied"),
    @("Drill-down works to school level","Click on any metric to see per-school breakdown"),
    @("Export includes charts and tables","PDF export includes visualisations"),
    @("Scheduled reports delivered on time","Email sent at configured time with correct data")
))

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PART C
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
add (partBanner "PART C" "Governance")

add (h2 "11. Non-Functional Requirements")
add (h4 "Performance")
add (tbl @(
    @("Requirement","Target"),
    @("Dashboard load time","< 5 seconds"),
    @("Concurrent admin users (COP)","5,000+"),
    @("Concurrent school-side users","50,000+"),
    @("API response time","< 300ms"),
    @("Real-time notification delivery","< 5 seconds")
))
add (h4 "Security")
add (tbl @(
    @("Requirement","Description"),
    @("RBAC","Granular role-based permissions at module and action level"),
    @("MFA","Required for all COP admin accounts"),
    @("Audit logs","Immutable; cannot be edited or deleted"),
    @("Encryption","AES-256 at rest + TLS 1.3 in transit"),
    @("Session timeout","Auto logout after 30 minutes of inactivity (COP)"),
    @("IP allowlisting","COP accessible only from approved IPs")
))
add (h4 "Reliability")
add (tbl @(
    @("Requirement","Target"),
    @("Platform uptime","99.9% SLA"),
    @("Backups","Daily automated with 30-day retention"),
    @("Disaster recovery","Multi-region failover; RTO < 4 hours"),
    @("Data integrity","Zero tolerance for data loss on payment transactions")
))
add (h4 "Tech Stack (Production Target)")
add (tbl @(
    @("Layer","Technology"),
    @("School Portal Frontend","React.js / Next.js"),
    @("COP Frontend","React.js / Next.js"),
    @("Backend","Node.js (NestJS)"),
    @("Database","PostgreSQL (multi-tenant)"),
    @("Cache","Redis"),
    @("Realtime Messaging","Socket.io"),
    @("Cloud","AWS"),
    @("Analytics","Metabase / Power BI"),
    @("Monitoring","CloudWatch + PagerDuty"),
    @("Payments","Paystack"),
    @("SMS","Termii / Africa's Talking"),
    @("Email","SendGrid")
))

add (h2 "12. Success Metrics $($A) KPIs")
add (h4 "Business KPIs (Year 1)")
add (tbl @(
    @("KPI","Target"),
    @("Schools onboarded","60"),
    @("Active schools","50+"),
    @("Revenue tracked","NGN 1B+ payments"),
    @("Loan disbursement","NGN 300M")
))
add (h4 "Operations KPIs")
add (tbl @(
    @("KPI","Target"),
    @("Support ticket resolution time","< 12 hours"),
    @("Platform uptime","99.9%"),
    @("Payment reconciliation accuracy","> 98%")
))
add (h4 "Lending KPIs")
add (tbl @(
    @("KPI","Target"),
    @("Loan repayment rate","> 92%"),
    @("Default rate","< 8%"),
    @("Loan approval turnaround","< 24 hours"),
    @("Portfolio at Risk (PAR 30)","< 10%")
))

add (h2 "13. Roles $($A) Permissions Matrix")
add (h4 "School Platform")
add (tbl @(
    @("Feature","Super Admin","School Admin","Principal","Finance","Teacher","Parent","Student"),
    @("Student records","Yes","Yes","Yes","--","Read","Own child","Own"),
    @("Staff records","Yes","Yes","Yes","--","Own","--","--"),
    @("Results (enter)","--","--","--","--","Yes","--","--"),
    @("Results (approve)","--","Yes","Yes","--","--","--","--"),
    @("Results (view)","Yes","Yes","Yes","--","Yes","Approved only","Approved only"),
    @("Fee structure","--","Yes","--","Yes","--","--","--"),
    @("Invoices","--","Yes","--","Yes","--","Own","--"),
    @("Payments","--","Yes","--","Yes","--","Own","--"),
    @("Loans (apply)","--","--","--","--","--","Yes","--"),
    @("Loans (approve)","Yes","Yes","--","Yes","--","--","--"),
    @("Payroll","--","Yes","--","Yes","--","--","--"),
    @("Payslip","--","--","--","--","Own","--","--"),
    @("Attendance (mark)","--","--","--","--","Yes","--","--"),
    @("Attendance (view)","Yes","Yes","Yes","--","Class","Own child","Own"),
    @("Assignments (create)","--","--","--","--","Yes","--","--"),
    @("Assignments (mark)","--","--","--","--","Yes","--","--"),
    @("Assignments (submit)","--","--","--","--","--","--","Yes"),
    @("Calendar","Yes","Yes","Yes","--","View","View","View"),
    @("House Points (award)","--","Yes","Yes","--","Yes","--","--"),
    @("Transport (manage)","--","Yes","--","--","--","Own child","--"),
    @("Sickbay","--","Yes","Yes","--","--","View","--"),
    @("Inventory","--","Yes","Yes","--","--","--","--"),
    @("Alumni","--","Yes","Yes","--","--","--","--"),
    @("Surveys (create)","--","Yes","Yes","--","--","--","--"),
    @("Surveys (respond)","--","--","--","--","--","Yes","--"),
    @("Diary (write)","--","--","--","--","Yes","--","--"),
    @("Diary (read/reply)","--","--","--","--","--","Yes","--"),
    @("CBT (create)","--","--","--","--","Yes","--","--"),
    @("CBT (take)","--","--","--","--","--","--","Yes"),
    @("School settings","--","Yes","--","--","--","--","--"),
    @("All schools data","Yes","--","--","--","--","--","--")
))
add (h4 "COP — Internal Team Permissions")
add (tbl @(
    @("Module","Super Admin","Operations","Finance","Credit/Risk","Support","BI/Analyst","Compliance"),
    @("Analytics Dashboard","Yes","Yes","Yes","Yes","--","Yes","Yes"),
    @("School Management","Yes","Yes","--","--","Read","--","Read"),
    @("Revenue Management","Yes","--","Yes","--","--","Yes","Read"),
    @("Lending $($A) Disbursement","Yes","--","--","Yes","--","Read","Yes"),
    @("System Control","Yes","Yes","--","--","--","--","--"),
    @("User Management","Yes","--","--","--","--","--","Yes"),
    @("Support Desk","Yes","--","--","--","Yes","--","--"),
    @("Advanced Analytics","Yes","--","Yes","--","--","Yes","Yes")
))

add (h2 "14. Out of Scope (Post-MVP)")
add (tbl @(
    @("Feature","Reason"),
    @("Bulk disbursement","Future treasury operations layer"),
    @("NIBSS direct settlement","Phase 2 banking integration"),
    @("Savings products","Requires banking/microfinance licence"),
    @("Investment products","Future EDU_FINTECH vertical"),
    @("Cross-border lending","Regulatory complexity"),
    @("Advanced AI underwriting","Requires larger dataset (Phase 3)"),
    @("Native mobile app","Phase 2 after web platform validated"),
    @("Offline mode","Complex sync; deferred to Phase 2")
))

add (sp)
add (p "CASPAA EduFinTech Platform  |  PRD v2.0  |  June 2026  |  Confidential" "Normal" -italic)

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# WRITE XML FILES
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# [Content_Types].xml
$ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'
[System.IO.File]::WriteAllText("$tmpDir\[Content_Types].xml", $ct, [System.Text.Encoding]::UTF8)

# _rels/.rels
$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'
[System.IO.File]::WriteAllText("$tmpDir\_rels\.rels", $rels, [System.Text.Encoding]::UTF8)

# word/_rels/document.xml.rels
$drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>'
[System.IO.File]::WriteAllText("$tmpDir\word\_rels\document.xml.rels", $drels, [System.Text.Encoding]::UTF8)

# word/settings.xml
$settings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
</w:settings>'
[System.IO.File]::WriteAllText("$tmpDir\word\settings.xml", $settings, [System.Text.Encoding]::UTF8)

# word/numbering.xml
$numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'
[System.IO.File]::WriteAllText("$tmpDir\word\numbering.xml", $numbering, [System.Text.Encoding]::UTF8)

# word/styles.xml
$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
      <w:lang w:val="en-GB"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="DocTitle"><w:name w:val="DocTitle"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="720" w:after="160"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="72"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="DocTitle2"><w:name w:val="DocTitle2"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="360" w:after="160"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="48"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="DocSubtitle"><w:name w:val="DocSubtitle"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="555555"/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="PartLabel"><w:name w:val="PartLabel"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="560" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="C0392B"/><w:sz w:val="20"/><w:caps/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="PartTitle"><w:name w:val="PartTitle"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="480"/>
      <w:pBdr><w:top w:val="single" w:sz="12" w:space="4" w:color="1F3864"/><w:bottom w:val="single" w:sz="12" w:space="4" w:color="1F3864"/></w:pBdr>
    </w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="44"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading1"/>
    <w:pPr><w:outlineLvl w:val="0"/><w:spacing w:before="480" w:after="160"/>
      <w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="C0392B"/></w:pBdr>
    </w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading2"/>
    <w:pPr><w:outlineLvl w:val="1"/><w:spacing w:before="400" w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="Heading3"/>
    <w:pPr><w:outlineLvl w:val="2"/><w:spacing w:before="320" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="Heading4"/>
    <w:pPr><w:spacing w:before="200" w:after="60"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="C0392B"/><w:sz w:val="22"/><w:caps/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ActorLine"><w:name w:val="ActorLine"/>
    <w:pPr><w:spacing w:before="0" w:after="120"/><w:shd w:val="clear" w:color="auto" w:fill="EEF2FF"/><w:ind w:left="120" w:right="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:i/><w:color w:val="444444"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/>
    <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:shd w:val="clear" w:color="auto" w:fill="F4F4F8"/><w:ind w:left="280" w:right="280"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/><w:sz w:val="20"/><w:color w:val="1A1A2E"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="ListBullet"/>
    <w:pPr><w:spacing w:before="0" w:after="80"/><w:ind w:left="720" w:hanging="360"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/>
      <w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/>
      <w:insideH w:val="single" w:sz="4" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:color="auto"/>
    </w:tblBorders></w:tblPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
</w:styles>'
[System.IO.File]::WriteAllText("$tmpDir\word\styles.xml", $styles, [System.Text.Encoding]::UTF8)

# word/document.xml
$W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
$docXml = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><w:document $W><w:body>" + $b.ToString() + "<w:sectPr><w:pgSz w:w=`"12240`" w:h=`"15840`"/><w:pgMar w:top=`"1440`" w:right=`"1080`" w:bottom=`"1440`" w:left=`"1080`"/></w:sectPr></w:body></w:document>"
[System.IO.File]::WriteAllText("$tmpDir\word\document.xml", $docXml, [System.Text.Encoding]::UTF8)

# ── ZIP into .docx ───────────────────────────────────────────────────────────
if (Test-Path $outPath) { Remove-Item $outPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmpDir, $outPath)
Remove-Item -Recurse -Force $tmpDir

Write-Host "Done: $outPath"
