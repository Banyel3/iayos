# GitHub Issues Creation Guide

This directory contains 15 detailed issue templates for the iAyos platform implementation:

## Agency Features (5 Issues)
1. **AGENCY_PHASE_1_CRITICAL_BUSINESS_LOGIC.md** - Critical business logic fixes (15-20 hours)
2. **AGENCY_PHASE_2_EMPLOYEE_MANAGEMENT.md** - Employee management enhancements (20-25 hours)
3. **AGENCY_PHASE_3_JOB_WORKFLOW.md** - Job workflow & assignment system (25-30 hours)
4. **AGENCY_PHASE_4_KYC_REVIEW.md** - KYC review & resubmission (15-20 hours)
5. **AGENCY_PHASE_5_ANALYTICS.md** - Analytics & reporting (10-15 hours)

**Total Agency Implementation: 85-125 hours**

## Flutter Mobile Features (10 Issues)
1. **MOBILE_PHASE_1_JOB_APPLICATION.md** - Job application flow (80-100 hours)
2. **MOBILE_PHASE_2_JOB_COMPLETION.md** - Two-phase job completion (60-80 hours)
3. **MOBILE_PHASE_3_ESCROW_PAYMENT.md** - Escrow payment system (100-120 hours)
4. **MOBILE_PHASE_4_FINAL_PAYMENT.md** - Final payment system (80-100 hours)
5. **MOBILE_PHASE_5_REALTIME_CHAT.md** - Real-time chat & messaging (100-120 hours)
6. **MOBILE_PHASE_6_ENHANCED_PROFILES.md** - Enhanced user profiles (80-100 hours)
7. **MOBILE_PHASE_7_KYC_UPLOAD.md** - KYC document upload (60-80 hours)
8. **MOBILE_PHASE_8_REVIEWS_RATINGS.md** - Reviews & ratings system (60-80 hours)
9. **MOBILE_PHASE_9_NOTIFICATIONS.md** - Notifications system (60-80 hours)
10. **MOBILE_PHASE_10_ADVANCED_FEATURES.md** - Advanced features & polish (100-120 hours)

**Total Mobile Implementation: 920 hours (~24 weeks)**

---

## Option 1: Manual Creation via GitHub Web Interface

1. Go to https://github.com/Banyel3/iayos/issues/new
2. For each markdown file in this directory:
   - Copy the title (first heading without the #)
   - Copy the entire content below the title
   - Add the labels listed at the top
   - Click "Submit new issue"

---

## Option 2: Automated Creation with GitHub CLI

### Prerequisites
```bash
# GitHub CLI is already installed, but you need to restart your terminal
# or use the full path to gh.exe

# Authenticate with GitHub (run this in a NEW terminal window)
gh auth login
```

### Create All Issues with PowerShell Script

Save this as `create-issues.ps1` in the `docs/github-issues/` directory:

```powershell
# Navigate to the github-issues directory
Set-Location -Path "C:\code\iayos\docs\github-issues"

# Agency Issues
Write-Host "Creating Agency Issues..." -ForegroundColor Green

gh issue create --title "[Agency] Phase 1: Critical Business Logic Fixes" `
  --label "priority:critical,type:bug,area:agency" `
  --body-file "AGENCY_PHASE_1_CRITICAL_BUSINESS_LOGIC.md"

gh issue create --title "[Agency] Phase 2: Employee Management Enhancements" `
  --label "priority:high,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_2_EMPLOYEE_MANAGEMENT.md"

gh issue create --title "[Agency] Phase 3: Agency Job Workflow & Assignment System" `
  --label "priority:high,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_3_JOB_WORKFLOW.md"

gh issue create --title "[Agency] Phase 4: KYC Review & Resubmission System" `
  --label "priority:medium,type:feature,area:agency,area:kyc" `
  --body-file "AGENCY_PHASE_4_KYC_REVIEW.md"

gh issue create --title "[Agency] Phase 5: Analytics, Reporting & Performance Dashboard" `
  --label "priority:low,type:feature,area:agency" `
  --body-file "AGENCY_PHASE_5_ANALYTICS.md"

Write-Host "Agency issues created!" -ForegroundColor Green
Write-Host ""

# Mobile Issues
Write-Host "Creating Mobile Issues..." -ForegroundColor Cyan

gh issue create --title "[Mobile] Phase 1: Job Application Flow" `
  --label "priority:critical,type:feature,area:mobile,area:jobs" `
  --body-file "MOBILE_PHASE_1_JOB_APPLICATION.md"

gh issue create --title "[Mobile] Phase 2: Two-Phase Job Completion Workflow" `
  --label "priority:critical,type:feature,area:mobile,area:jobs" `
  --body-file "MOBILE_PHASE_2_JOB_COMPLETION.md"

gh issue create --title "[Mobile] Phase 3: Escrow Payment System (50% Downpayment)" `
  --label "priority:critical,type:feature,area:mobile,area:payments" `
  --body-file "MOBILE_PHASE_3_ESCROW_PAYMENT.md"

gh issue create --title "[Mobile] Phase 4: Final Payment System (50% Completion Payment)" `
  --label "priority:critical,type:feature,area:mobile,area:payments" `
  --body-file "MOBILE_PHASE_4_FINAL_PAYMENT.md"

gh issue create --title "[Mobile] Phase 5: Real-Time Chat & Messaging" `
  --label "priority:high,type:feature,area:mobile,area:chat" `
  --body-file "MOBILE_PHASE_5_REALTIME_CHAT.md"

gh issue create --title "[Mobile] Phase 6: Enhanced User Profiles (Certifications & Materials)" `
  --label "priority:high,type:feature,area:mobile,area:profiles" `
  --body-file "MOBILE_PHASE_6_ENHANCED_PROFILES.md"

gh issue create --title "[Mobile] Phase 7: KYC Document Upload & Verification" `
  --label "priority:high,type:feature,area:mobile,area:kyc" `
  --body-file "MOBILE_PHASE_7_KYC_UPLOAD.md"

gh issue create --title "[Mobile] Phase 8: Reviews & Ratings System" `
  --label "priority:medium,type:feature,area:mobile,area:reviews" `
  --body-file "MOBILE_PHASE_8_REVIEWS_RATINGS.md"

gh issue create --title "[Mobile] Phase 9: Comprehensive Notifications System" `
  --label "priority:medium,type:feature,area:mobile,area:notifications" `
  --body-file "MOBILE_PHASE_9_NOTIFICATIONS.md"

gh issue create --title "[Mobile] Phase 10: Advanced Features & Polish" `
  --label "priority:low,type:enhancement,area:mobile" `
  --body-file "MOBILE_PHASE_10_ADVANCED_FEATURES.md"

Write-Host "Mobile issues created!" -ForegroundColor Cyan
Write-Host ""
Write-Host "All 15 issues created successfully!" -ForegroundColor Yellow
```

### Run the Script
```powershell
# In a NEW PowerShell window (so gh.exe is available in PATH)
cd C:\code\iayos\docs\github-issues
.\create-issues.ps1
```

---

## Option 3: Create Issues One-by-One with Commands

Open a NEW terminal window and run these commands:

```bash
cd C:\code\iayos

# Agency Issues
gh issue create --title "[Agency] Phase 1: Critical Business Logic Fixes" --label "priority:critical,type:bug,area:agency" --body-file "docs/github-issues/AGENCY_PHASE_1_CRITICAL_BUSINESS_LOGIC.md"

gh issue create --title "[Agency] Phase 2: Employee Management Enhancements" --label "priority:high,type:feature,area:agency" --body-file "docs/github-issues/AGENCY_PHASE_2_EMPLOYEE_MANAGEMENT.md"

gh issue create --title "[Agency] Phase 3: Agency Job Workflow & Assignment System" --label "priority:high,type:feature,area:agency" --body-file "docs/github-issues/AGENCY_PHASE_3_JOB_WORKFLOW.md"

gh issue create --title "[Agency] Phase 4: KYC Review & Resubmission System" --label "priority:medium,type:feature,area:agency,area:kyc" --body-file "docs/github-issues/AGENCY_PHASE_4_KYC_REVIEW.md"

gh issue create --title "[Agency] Phase 5: Analytics, Reporting & Performance Dashboard" --label "priority:low,type:feature,area:agency" --body-file "docs/github-issues/AGENCY_PHASE_5_ANALYTICS.md"

# Mobile Issues
gh issue create --title "[Mobile] Phase 1: Job Application Flow" --label "priority:critical,type:feature,area:mobile,area:jobs" --body-file "docs/github-issues/MOBILE_PHASE_1_JOB_APPLICATION.md"

gh issue create --title "[Mobile] Phase 2: Two-Phase Job Completion Workflow" --label "priority:critical,type:feature,area:mobile,area:jobs" --body-file "docs/github-issues/MOBILE_PHASE_2_JOB_COMPLETION.md"

gh issue create --title "[Mobile] Phase 3: Escrow Payment System (50% Downpayment)" --label "priority:critical,type:feature,area:mobile,area:payments" --body-file "docs/github-issues/MOBILE_PHASE_3_ESCROW_PAYMENT.md"

gh issue create --title "[Mobile] Phase 4: Final Payment System (50% Completion Payment)" --label "priority:critical,type:feature,area:mobile,area:payments" --body-file "docs/github-issues/MOBILE_PHASE_4_FINAL_PAYMENT.md"

gh issue create --title "[Mobile] Phase 5: Real-Time Chat & Messaging" --label "priority:high,type:feature,area:mobile,area:chat" --body-file "docs/github-issues/MOBILE_PHASE_5_REALTIME_CHAT.md"

gh issue create --title "[Mobile] Phase 6: Enhanced User Profiles (Certifications & Materials)" --label "priority:high,type:feature,area:mobile,area:profiles" --body-file "docs/github-issues/MOBILE_PHASE_6_ENHANCED_PROFILES.md"

gh issue create --title "[Mobile] Phase 7: KYC Document Upload & Verification" --label "priority:high,type:feature,area:mobile,area:kyc" --body-file "docs/github-issues/MOBILE_PHASE_7_KYC_UPLOAD.md"

gh issue create --title "[Mobile] Phase 8: Reviews & Ratings System" --label "priority:medium,type:feature,area:mobile,area:reviews" --body-file "docs/github-issues/MOBILE_PHASE_8_REVIEWS_RATINGS.md"

gh issue create --title "[Mobile] Phase 9: Comprehensive Notifications System" --label "priority:medium,type:feature,area:mobile,area:notifications" --body-file "docs/github-issues/MOBILE_PHASE_9_NOTIFICATIONS.md"

gh issue create --title "[Mobile] Phase 10: Advanced Features & Polish" --label "priority:low,type:enhancement,area:mobile" --body-file "docs/github-issues/MOBILE_PHASE_10_ADVANCED_FEATURES.md"
```

---

## Notes

- **Labels:** You may need to create these labels in your GitHub repository first:
  - `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
  - `type:bug`, `type:feature`, `type:enhancement`
  - `area:agency`, `area:mobile`, `area:jobs`, `area:payments`, `area:chat`, `area:profiles`, `area:kyc`, `area:reviews`, `area:notifications`

- **Order:** Issues are created in dependency order where possible

- **Editing:** You can edit the markdown files before creating issues if you want to adjust details

---

Generated with Claude Code
