# GitHub Issues Creation Script for iAyos Platform
# Creates 15 issues (5 Agency + 10 Mobile) from markdown templates

Set-Location -Path "C:\code\iayos\docs\github-issues"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "iAyos GitHub Issues Creation Script" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Agency Issues
Write-Host "Creating Agency Issues (5)..." -ForegroundColor Green
Write-Host ""

Write-Host "[1/15] Creating Agency Phase 1..." -ForegroundColor Cyan
gh issue create --title "[Agency] Phase 1: Critical Business Logic Fixes" `
  --label "priority:critical,type:bug,area:agency" `
  --body-file "AGENCY_PHASE_1_CRITICAL_BUSINESS_LOGIC.md"

Write-Host "[2/15] Creating Agency Phase 2..." -ForegroundColor Cyan
gh issue create --title "[Agency] Phase 2: Employee Management Enhancements" `
  --label "priority:high,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_2_EMPLOYEE_MANAGEMENT.md"

Write-Host "[3/15] Creating Agency Phase 3..." -ForegroundColor Cyan
gh issue create --title "[Agency] Phase 3: Agency Job Workflow & Assignment System" `
  --label "priority:high,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_3_JOB_WORKFLOW.md"

Write-Host "[4/15] Creating Agency Phase 4..." -ForegroundColor Cyan
gh issue create --title "[Agency] Phase 4: KYC Review & Resubmission System" `
  --label "priority:medium,type:feature,area:agency,area:kyc" `
  --body-file "AGENCY_PHASE_4_KYC_REVIEW.md"

Write-Host "[5/15] Creating Agency Phase 5..." -ForegroundColor Cyan
gh issue create --title "[Agency] Phase 5: Analytics, Reporting & Performance Dashboard" `
  --label "priority:low,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_5_ANALYTICS.md"

Write-Host ""
Write-Host "Agency issues created! (5/15)" -ForegroundColor Green
Write-Host ""

# Mobile Issues
Write-Host "Creating Mobile Issues (10)..." -ForegroundColor Magenta
Write-Host ""

Write-Host "[6/15] Creating Mobile Phase 1..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 1: Job Application Flow" `
  --label "priority:critical,type:feature,area:mobile,area:jobs" `
  --body-file "MOBILE_PHASE_1_JOB_APPLICATION.md"

Write-Host "[7/15] Creating Mobile Phase 2..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 2: Two-Phase Job Completion Workflow" `
  --label "priority:critical,type:feature,area:mobile,area:jobs" `
  --body-file "MOBILE_PHASE_2_JOB_COMPLETION.md"

Write-Host "[8/15] Creating Mobile Phase 3..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 3: Escrow Payment System (50% Downpayment)" `
  --label "priority:critical,type:feature,area:mobile,area:payments" `
  --body-file "MOBILE_PHASE_3_ESCROW_PAYMENT.md"

Write-Host "[9/15] Creating Mobile Phase 4..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 4: Final Payment System (50% Completion Payment)" `
  --label "priority:critical,type:feature,area:mobile,area:payments" `
  --body-file "MOBILE_PHASE_4_FINAL_PAYMENT.md"

Write-Host "[10/15] Creating Mobile Phase 5..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 5: Real-Time Chat & Messaging" `
  --label "priority:high,type:feature,area:mobile,area:chat" `
  --body-file "MOBILE_PHASE_5_REALTIME_CHAT.md"

Write-Host "[11/15] Creating Mobile Phase 6..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 6: Enhanced User Profiles (Certifications & Materials)" `
  --label "priority:high,type:feature,area:mobile,area:profiles" `
  --body-file "MOBILE_PHASE_6_ENHANCED_PROFILES.md"

Write-Host "[12/15] Creating Mobile Phase 7..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 7: KYC Document Upload & Verification" `
  --label "priority:high,type:feature,area:mobile,area:kyc" `
  --body-file "MOBILE_PHASE_7_KYC_UPLOAD.md"

Write-Host "[13/15] Creating Mobile Phase 8..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 8: Reviews & Ratings System" `
  --label "priority:medium,type:feature,area:mobile,area:reviews" `
  --body-file "MOBILE_PHASE_8_REVIEWS_RATINGS.md"

Write-Host "[14/15] Creating Mobile Phase 9..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 9: Comprehensive Notifications System" `
  --label "priority:medium,type:feature,area:mobile,area:notifications" `
  --body-file "MOBILE_PHASE_9_NOTIFICATIONS.md"

Write-Host "[15/15] Creating Mobile Phase 10..." -ForegroundColor Cyan
gh issue create --title "[Mobile] Phase 10: Advanced Features & Polish" `
  --label "priority:low,type:enhancement,area:mobile" `
  --body-file "MOBILE_PHASE_10_ADVANCED_FEATURES.md"

Write-Host ""
Write-Host "Mobile issues created! (10/15)" -ForegroundColor Magenta
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "All 15 issues created successfully!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "View issues at: https://github.com/Banyel3/iayos/issues" -ForegroundColor Green
