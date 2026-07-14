Add-Type -AssemblyName "System.IO.Compression.FileSystem"
$A = [char]38   # ampersand

$outPath = "C:\Users\USER\Desktop\CASPAA\CASPAA_Onboarding_PRD.docx"
$tmpDir  = Join-Path $env:TEMP "caspaa_onboarding_prd_build"

if (Test-Path $tmpDir) { Remove-Item -Recurse -Force $tmpDir }
New-Item -ItemType Directory -Path $tmpDir              | Out-Null
New-Item -ItemType Directory -Path "$tmpDir\_rels"      | Out-Null
New-Item -ItemType Directory -Path "$tmpDir\word"       | Out-Null
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
function vspace()        { "<w:p/>" }
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

$b = [System.Text.StringBuilder]::new()
function add([string]$xml) { $b.Append($xml) | Out-Null }

# -- COVER --------------------------------------------------------------------
add (p "CASPAA" "DocTitle")
add (p "School Operating System" "DocSubtitle")
add (vspace)
add (p "Product Requirements Document" "DocTitle2")
add (p "Onboarding $($A) Sign-In Flow" "DocSubtitle")
add (vspace)
add (p "Version 1.0   |   10 July 2026   |   Status: Implemented" "Normal" -italic)
add (pb)

# -- TABLE OF CONTENTS --------------------------------------------------------
add (h1 "Table of Contents")
add (bul "1. Overview")
add (bul "2. Personas and Roles")
add (bul "3. Scope Summary")
add (bul "4. User Journeys (A-G)")
add (bul "5. Epics, User Stories and Acceptance Criteria")
add (bul "6. Functional Requirements Detail")
add (bul "7. Business Rules")
add (bul "8. Edge Cases")
add (bul "9. Known Limitations")
add (bul "10. Success Metrics")
add (bul "11. Future Work")
add (bul "12. Appendix - Surfaces and Data")
add (pb)

# -- 1. OVERVIEW --------------------------------------------------------------
add (h1 "1. Overview")
add (p "CASPAA is a multi-tenant school operating system. Schools are first onboarded onto the platform by a CASPAA operator (Super Admin), and each school then sets itself up and invites its own people (staff, and - through enrolment - parents and students).")
add (p "This document specifies the end-to-end onboarding journey and the sign-in model that ties it together:")
add (bul "Platform onboarding - a Super Admin creates the school account (on a 14-day trial).")
add (bul "School getting-started wizard - a guided setup checklist the School Admin completes to take the school live: branding, classes, invite staff, fees, students and families.")
add (bul "Staff invitation - individual and bulk email invitations that issue real credentials.")
add (bul "Parent and student provisioning - parents get a login automatically when their child is enrolled; students sign in with an admission number plus date of birth.")
add (bul "Identifier-first sign-in - a single two-step sign-in that routes each person to the right credential without asking them to pick a role or type.")

add (h2 "1.1 Problem Statement")
add (p "Before this work, the platform could create schools but there was no guided path for a school to become operational, no way to invite a team, and the sign-in page presented a role picker whose email form only recognised seven hard-coded demo accounts - so the credentials the product generated for real staff and parents did not actually work.")

add (h2 "1.2 Goals")
add (bul "Give a newly-onboarded school a clear, measurable path to 'live' (a setup checklist with live progress).")
add (bul "Let a school invite its staff in minutes (single and bulk), issuing working credentials.")
add (bul "Make sign-in credential-based and self-routing, so no user must declare their type.")
add (bul "Ensure every credential the onboarding flow issues can actually authenticate.")

add (h2 "1.3 Non-Goals (this release)")
add (bul "Real email/SMS/WhatsApp delivery (messages are simulated in-app).")
add (bul "Real password hashing / server-side identity (client-side mock; demo password demo1234).")
add (bul "SSO, QR/badge login, and bulk student CSV import (see section 11).")
add (bul "Redesign of the Super Admin 'Onboard School' modal (functional; out of scope here).")

# -- 2. PERSONAS --------------------------------------------------------------
add (h1 "2. Personas and Roles")
add (tbl @(
  @("Persona","App role","How they get access"),
  @("CASPAA Operator","superadmin","Platform account; OTP on sign-in"),
  @("School Proprietor","schooladmin","Created at platform onboarding; signs in with school email"),
  @("Principal","principal","Invited/seeded; email plus password"),
  @("Finance Officer / Bursar","finance","Invited as Finance staff; email plus password; OTP"),
  @("Teacher / other staff","teacher","Invited via the wizard; email plus temp password"),
  @("Parent","parent","Auto-provisioned when their child is enrolled"),
  @("Student","student","Admission number plus date of birth")
))
add (p "Staff-type to role mapping (at sign-in): Finance maps to finance; all other staff types (Academic, Administration, Operations, ICT, Transport) map to teacher. Known simplification - see section 9." "Normal" -italic)

# -- 3. SCOPE -----------------------------------------------------------------
add (h1 "3. Scope Summary")
add (tbl @(
  @("#","Capability","Surface"),
  @("S1","School getting-started wizard","view_adm_onboarding plus dashboard banner"),
  @("S2","School profile and branding","Wizard step 1 (modal)"),
  @("S3","Invite staff (single and bulk)","Wizard 'Invite your team' panel"),
  @("S4","Fee / academic / student deep-links","Wizard steps 2, 4, 5"),
  @("S5","Parent provisioning on enrolment","Add-student flow"),
  @("S6","Identifier-first two-step sign-in","Login page"),
  @("S7","First-login password change and OTP","Sign-in")
))
add (pb)

# -- 4. JOURNEYS --------------------------------------------------------------
add (h1 "4. User Journeys")

add (h2 "Journey A - Platform onboards a school")
add (code @"
Super Admin -> Schools -> 'Onboard School'
   enters profile + KYC + subscription plan
   -> school created (status: trial, 14-day)
      -> proprietor can now sign in with the school contact email
"@)

add (h2 "Journey B - School Admin completes getting-started")
add (code @"
Proprietor signs in
  -> Dashboard shows 'Finish setting up your school' banner (X of 5, %)
       -> Continue setup -> Getting-started wizard
            Step 1  School profile and branding      [modal]
            Step 2  Classes and terms                [-> Academic]
            Step 3  Invite your staff                [inline panel]  *
            Step 4  Fee structure                    [-> Finance]
            Step 5  Students and families            [-> Students]
       -> Each completed step flips to done (progress recomputed live)
  -> At 100% the banner disappears; wizard still reachable via
     Profile > 'School setup guide'
"@)

add (h2 "Journey C - Invite staff (the centrepiece)")
add (code @"
Wizard > Invite your team
   Row: Full name . Email . Staff type . Role     (+ Add another)
   OR Bulk invite: paste 'Name, email' lines -> prefilled rows
   Send invitations
       each valid row -> teacher record + invitation (email + temp password)
       audit log: staff_invited
       roster updates: 'Invite sent' (pending) / 'Joined' (accepted) + Resend
"@)

add (h2 "Journey D - Invited staff first sign-in")
add (code @"
Staff opens invite -> Login page
   Step 1: enters their email -> Continue
   Step 2: enters temp password -> Sign in
       invitation marked accepted
       (Academic -> teacher / Finance -> finance + OTP)
       prompted to set a personal password (first login)
"@)

add (h2 "Journey E - Enrol student then provision parent")
add (code @"
Admin > Add Student
   new parent -> parent record + credentials (username: phone, temp password)
                 + firstLogin: true
   welcome message shown (simulated WhatsApp/email) with the login details
   student record created with admission number + date of birth
"@)

add (h2 "Journey F - Student sign-in")
add (code @"
Login page
   Step 1: enters admission number -> Continue
   Step 2: enters date of birth -> Sign in
       secondary students -> prompted to set a password (first login)
       audit log: student_login
"@)

add (h2 "Journey G - Identifier-first routing (all returning users)")
add (code @"
Step 1: one field - 'Email or Admission Number'
   matches an active student's admission number -> ask DATE OF BIRTH
   matches a known account (staff/parent/admin/proprietor) -> ask PASSWORD
   matches nothing -> 'No account found' (stay on step 1)
Back button returns to step 1 and clears the credential field.
"@)
add (pb)

# -- 5. EPICS / USER STORIES / AC ---------------------------------------------
add (h1 "5. Epics, User Stories and Acceptance Criteria")
add (p "Acceptance criteria use Given / When / Then. All criteria below are covered by automated DOM-level checks." "Normal" -italic)

add (h2 "Epic 1 - School getting-started wizard")

add (h3 "US-1.1  As a School Admin, I want a guided checklist after I sign in, so that I know exactly what to do to take my school live.")
add (bul "AC-1.1.1  Given I am a schooladmin or principal with an incomplete setup, When I open the dashboard, Then a 'Finish setting up your school' banner shows my progress as 'N of 5 steps done' and a percentage.")
add (bul "AC-1.1.2  Given setup is 100% complete, When I open the dashboard, Then the banner is not shown.")
add (bul "AC-1.1.3  Given I dismiss the banner, Then it collapses to a slim 'School setup X% complete - Resume setup' bar, and the wizard remains reachable from Profile > School setup guide.")
add (bul "AC-1.1.4  Given I open the wizard, Then I see 5 steps, each showing done/to-do state, and an overall progress ring.")

add (h3 "US-1.2  As a School Admin, I want each step to reflect what I have actually done, so that progress is trustworthy.")
add (bul "AC-1.2.1  Step completion is derived live from data, not a stored flag: branding done when logo initials are set; classes done when at least one class exists; staff done when at least one staff member exists; fees done when at least one fee structure exists; students done when at least one student exists.")
add (bul "AC-1.2.2  Given a step's underlying data is created, When the wizard re-renders, Then that step shows as Done and the ring/percentage update.")
add (bul "AC-1.2.3  Given every step is complete, Then the hero shows a 'ready' state and a Go to dashboard action.")

add (h3 "US-1.3  As a School Admin, I want to jump straight to the tool a step needs, so that I do not hunt through the menu.")
add (bul "AC-1.3.1  Classes and terms opens Academic; Fee structure opens Finance; Students and families opens Students.")
add (bul "AC-1.3.2  School profile and branding opens a modal in place.")
add (bul "AC-1.3.3  Invite your staff scrolls to the inline invite panel on the wizard.")

add (h2 "Epic 2 - School profile and branding")
add (h3 "US-2.1  As a School Admin, I want to set my school's identity, so that CASPAA reflects my school.")
add (bul "AC-2.1.1  Given the branding modal, When I save, Then school name, logo initials (stored upper-cased), primary colour, motto, address, phone and contact email persist to the school record.")
add (bul "AC-2.1.2  Given I leave the school name empty, When I save, Then I get a validation error and nothing is saved.")
add (bul "AC-2.1.3  Given I save branding, Then the school name is also written to settings and an audit entry branding_updated is recorded.")

add (h2 "Epic 3 - Invite staff")
add (h3 "US-3.1  As a School Admin, I want to invite staff by email, so that my team can access CASPAA.")
add (bul "AC-3.1.1  Given one or more invite rows with a name and a valid email, When I click Send invitations, Then for each row a staff record is created with an invitation object (username = email, generated temp password, accepted = false, channel email) and an audit entry staff_invited.")
add (bul "AC-3.1.2  Given a row has a name but no email (or vice-versa), When I send, Then I get an error and no records are created (all-or-nothing per submit).")
add (bul "AC-3.1.3  Given an email is malformed, When I send, Then I get a 'not a valid email' error and no records are created.")
add (bul "AC-3.1.4  Given no rows are filled, When I send, Then I get an 'add at least one teammate' error.")
add (bul "AC-3.1.5  Each invited staff member is assigned a staff type and a school role, and a default permission set (attendance, results, assignments, messaging, lesson plans).")

add (h3 "US-3.2  As a School Admin, I want to add or remove invite rows and paste a list, so that inviting many people is fast.")
add (bul "AC-3.2.1  Given the invite panel, When I click Add another, Then a new empty row appears.")
add (bul "AC-3.2.2  Given more than one row, When I remove a row, Then it is deleted; When only one row remains and I remove it, Then its fields are cleared instead.")
add (bul "AC-3.2.3  Given I paste lines of 'Full name, email' into bulk invite, When I add them, Then one prefilled row is created per line for review before sending.")

add (h3 "US-3.3  As a School Admin, I want to see who I have invited and resend, so that I can chase pending staff.")
add (bul "AC-3.3.1  Given staff have been invited, Then the panel lists each with name, email, role and a status badge: Invite sent (pending) or Joined (accepted).")
add (bul "AC-3.3.2  Given a pending invite, When I click Resend, Then the invitation's sent timestamp is refreshed and I see a confirmation.")

add (h2 "Epic 4 - Parent and student provisioning")
add (h3 "US-4.1  As a School Admin, I want a parent's login created automatically when I enrol their child, so that I do not manage separate invites.")
add (bul "AC-4.1.1  Given I add a student with a new parent, When I save, Then a parent record is created with credentials (username = phone, temp password) and firstLogin = true.")
add (bul "AC-4.1.2  Given the parent is created, Then a welcome message (simulated) is presented containing the login details.")

add (h3 "US-4.2  As a student, I want to sign in with my admission number and date of birth, so that I do not need an email.")
add (bul "AC-4.2.1  Given an active student, When they enter their admission number and correct date of birth, Then they are signed in as student.")
add (bul "AC-4.2.2  Given a wrong date of birth, Then sign-in is refused.")
add (bul "AC-4.2.3  Given a secondary-school student who has not set a password, When they sign in, Then they are prompted to set one.")

add (h2 "Epic 5 - Identifier-first sign-in")
add (h3 "US-5.1  As any user, I want to sign in from one place without choosing my type, so that the flow is simple.")
add (bul "AC-5.1.1  Given the login page, Then there is a single 'Email or Admission Number' field and no role-picker buttons.")
add (bul "AC-5.1.2  Given I enter an active student's admission number (case-insensitive) and Continue, Then step 2 asks for date of birth.")
add (bul "AC-5.1.3  Given I enter a known account's email/username and Continue, Then step 2 asks for a password.")
add (bul "AC-5.1.4  Given I enter an unrecognised identifier and Continue, Then I get 'No account found' and remain on step 1.")
add (bul "AC-5.1.5  Given I am on step 2, When I click Back, Then I return to step 1 and the credential field is cleared.")
add (bul "AC-5.1.6  Enter key advances step 1 and submits step 2.")

add (h3 "US-5.2  As an invited staff member, I want my temp password to work, so that onboarding actually lets me in.")
add (bul "AC-5.2.1  Given an invited staff member, When they sign in with their temp password, Then they are authenticated with the correct role and their invitation is marked accepted.")
add (bul "AC-5.2.2  Given the account is superadmin or finance, When credentials are correct, Then an OTP step is required before entry.")
add (bul "AC-5.2.3  Given an invited teacher's first successful sign-in, Then they are prompted to set a personal password.")
add (bul "AC-5.2.4  Given a wrong password, Then sign-in is refused with an 'Incorrect password' message.")

add (h3 "US-5.3  As a returning user, I want my identity resolved across all account types, so that whoever I am, sign-in works.")
add (bul "AC-5.3.1  resolveLogin matches, in order: platform/demo accounts, staff (by email or invitation username), parents (by email or phone username), school proprietor (by school email).")
add (bul "AC-5.3.2  Given no source matches the identifier, Then no user is returned and sign-in fails cleanly.")
add (pb)

# -- 6. FUNCTIONAL DETAIL -----------------------------------------------------
add (h1 "6. Functional Requirements Detail")
add (h2 "6.1 Getting-started wizard")
add (bul "Route key: adm_onboarding. Centred single-column layout; hero with progress ring; 5 step cards; inline 'Invite your team' panel.")
add (bul "The Invite your staff step is highlighted ('Recommended next') until complete.")
add (bul "Entry points: dashboard banner (until 100%), and Profile > 'School setup guide' (always).")
add (h2 "6.2 Invite panel")
add (bul "Row fields: Full name (required), Email (required, validated), Staff type (select), Role (from the school's roles, excluding Proprietor/Parent).")
add (bul "Bulk parser splits each line on comma/semicolon/tab; first token = name, first @-token = email.")
add (bul "Submit is all-or-nothing: any invalid filled row aborts the whole send.")
add (h2 "6.3 Sign-in")
add (bul "Step 1: single identifier field plus Continue.")
add (bul "Router (routeLoginIdentifier): active-student admission number (case-insensitive) routes to student branch; else if resolveLogin finds a user, password branch; else unknown.")
add (bul "Step 2 (password): password with show/hide, Remember me, Forgot password (simulated), Sign in.")
add (bul "Step 2 (student): date-of-birth picker, Sign in as Student.")
add (bul "OTP retained for superadmin/finance; first-login password change retained for applicable roles.")

# -- 7. BUSINESS RULES --------------------------------------------------------
add (h1 "7. Business Rules")
add (bul "A school begins on a 14-day trial at platform onboarding.")
add (bul "Onboarding progress is always computed from live data - there is no 'mark complete' override.")
add (bul "Invited staff credentials: username = email, system-generated temp password, accepted = false until first successful sign-in.")
add (bul "Parent credentials: username = phone, generated temp password, firstLogin = true.")
add (bul "Students authenticate with admission number plus date of birth; no email required.")
add (bul "Demo/testing password for any account is demo1234 (non-production).")
add (bul "Sensitive roles (superadmin, finance) require an OTP step.")

# -- 8. EDGE CASES ------------------------------------------------------------
add (h1 "8. Edge Cases")
add (tbl @(
  @("Case","Expected behaviour"),
  @("Duplicate email invited twice","Second invite creates a second record (no dedupe in v1)"),
  @("Admission number typed in different case","Matched case-insensitively -> student branch"),
  @("Parent username is a phone number (no @)","Routed to password branch via account match, not student"),
  @("Identifier matches nothing","'No account found', stays on step 1"),
  @("Wrong DOB / wrong password","Refused with a specific message; no session created"),
  @("Branding saved with empty name","Blocked with validation error"),
  @("Partial invite row (name xor email)","Whole submit aborts; nothing created"),
  @("Setup already complete","Banner hidden; wizard shows 'ready' state")
))

# -- 9. LIMITATIONS -----------------------------------------------------------
add (h1 "9. Known Limitations")
add (bul "Staff-type to role mapping collapses Administration/Operations/ICT/Transport to the teacher role (no dedicated dashboards for those types yet).")
add (bul "No invite de-duplication - inviting the same email twice creates two staff records.")
add (bul "Messaging is simulated - no real email/SMS/WhatsApp is sent.")
add (bul "First-login password change is enforced for teacher/parent/student collections; finance-mapped invited staff skip the forced change (collection-mapping quirk).")

# -- 10. METRICS --------------------------------------------------------------
add (h1 "10. Success Metrics")
add (tbl @(
  @("Metric","Target intent"),
  @("Time-to-first-staff-invite (from first proprietor sign-in)","Minimise"),
  @("% of new schools reaching 100% setup within 7 days","Maximise"),
  @("Invited-staff activation rate (accepted / invited)","Maximise"),
  @("Sign-in success rate on first attempt (by role)","Maximise"),
  @("Support tickets tagged 'can't log in'","Minimise")
))

# -- 11. FUTURE WORK ----------------------------------------------------------
add (h1 "11. Future Work")
add (bul "QR/badge sign-in (Clever-style) and/or parent-mediated access for the youngest pupils.")
add (bul "Bulk student import (CSV) on the 'Students and families' step.")
add (bul "Invite de-duplication plus a 'pending invites' management view.")
add (bul "Real credential delivery (email/SMS/WhatsApp) and server-side identity plus hashing.")
add (bul "Multi-step redesign of the Super Admin 'Onboard School' creation flow.")

# -- 12. APPENDIX -------------------------------------------------------------
add (h1 "12. Appendix - Surfaces and Data")
add (h3 "Views / functions")
add (p "view_adm_onboarding, onboardingBanner, schoolOnboardingSteps, onbInviteRowHtml, onbSendInvites, onbParseBulk, onbBrandingModal / onbSaveBranding, onbResend (School Admin module); renderLogin, routeLoginIdentifier, resolveLogin, bindLoginHandlers (Auth).")
add (h3 "Data collections")
add (p "schools (branding, kyc), teachers (invitation), parents (credentials), students (admissionNo, dob), feeStructures, classes, schoolRoles, auditLog, settings.")
add (h3 "Audit actions")
add (p "onboarded_school, branding_updated, staff_invited, student_login.")
add (vspace)
add (p "CASPAA School Operating System  |  Onboarding and Sign-In PRD v1.0  |  10 July 2026  |  Confidential" "Normal" -italic)

# ============================================================================
# WRITE XML FILES
# ============================================================================

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
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/>
    <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:shd w:val="clear" w:color="auto" w:fill="F4F4F8"/><w:ind w:left="280" w:right="280"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/><w:sz w:val="20"/><w:color w:val="1A1A2E"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="ListBullet"/>
    <w:pPr><w:spacing w:before="0" w:after="80"/><w:ind w:left="720" w:hanging="360"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>'
[System.IO.File]::WriteAllText("$tmpDir\word\styles.xml", $styles, [System.Text.Encoding]::UTF8)

# word/document.xml
$W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
$docXml = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><w:document $W><w:body>" + $b.ToString() + "<w:sectPr><w:pgSz w:w=`"12240`" w:h=`"15840`"/><w:pgMar w:top=`"1440`" w:right=`"1080`" w:bottom=`"1440`" w:left=`"1080`"/></w:sectPr></w:body></w:document>"
[System.IO.File]::WriteAllText("$tmpDir\word\document.xml", $docXml, [System.Text.Encoding]::UTF8)

# -- ZIP into .docx -----------------------------------------------------------
if (Test-Path $outPath) { Remove-Item $outPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmpDir, $outPath)
Write-Output "Wrote $outPath"
