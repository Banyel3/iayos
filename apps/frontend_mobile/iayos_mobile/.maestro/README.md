# E2E Testing with Maestro - iAyos Mobile App

> **🎯 Simple, Fast, Reliable E2E Testing with YAML flows**

## 📋 Overview

We use [Maestro](https://maestro.mobile.dev/) for end-to-end testing of the iAyos mobile app. Maestro is a simple, powerful, and fast mobile UI testing framework that uses YAML-based test flows.

## 🚀 Quick Start

### Prerequisites

1. **Install Maestro CLI**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Android Emulator or Physical Device** with USB debugging enabled

3. **Release APK** installed on the device/emulator

### Running Tests Locally

```bash
# Navigate to mobile app directory
cd apps/frontend_mobile/iayos_mobile

# Run all auth tests
maestro test .maestro/auth

# Run a specific test
maestro test .maestro/auth/01_welcome_screen.yaml

# Run all tests
maestro test .maestro

# Run with screenshots
maestro test .maestro/auth --format junit --output report.xml
```

### Running by Test Suite

```bash
# Authentication tests
maestro test .maestro/auth

# Worker job browsing
maestro test .maestro/jobs_worker

# Client job management
maestro test .maestro/jobs_client

# Wallet & payments
maestro test .maestro/wallet

# KYC verification
maestro test .maestro/kyc

# Profile management
maestro test .maestro/profile
```

### Running by Tag

```bash
# Smoke tests (quick sanity check)
maestro test --include-tags=smoke .maestro/

# Critical path tests
maestro test --include-tags=critical .maestro/

# Partial tests (can't fully complete in emulator)
maestro test --include-tags=partial .maestro/
```

## 🧹 Test Data Cleanup

Tests are designed to be non-destructive and all test data is cleaned up automatically.

### Cleanup Strategy

1. **No actual transactions** - Deposit/withdraw tests don't submit payment
2. **No permanent data** - Job creation shows dry-run (form verification only)
3. **Reverted changes** - Profile edits are cancelled without saving
4. **Auto-cleanup endpoint** - CI workflow calls cleanup after tests

### Cleanup Endpoint

The backend provides a cleanup endpoint that runs after every test run:

```
DELETE /api/mobile/test/cleanup-maestro-data
```

This deletes:
- Jobs with title containing `[TEST]` or `MAESTRO`
- Payment methods with name containing `Maestro`
- Saved jobs from test users
- Job applications from test users

**Security**: Only works in non-production environments.

### Partial Tests

Some tests are marked as "partial" because they can't fully complete in an emulator:
- **Avatar Upload** - Camera/gallery requires physical device
- **KYC Upload** - Document photos require camera access
- **Payment Completion** - Redirects to external payment (Xendit)

These tests verify the UI flow up to the point requiring device hardware.

## 📁 Test Structure

```
.maestro/
├── config.yaml                    # Global configuration
├── README.md                      # This file
│
├── auth/                          # Authentication tests (8 tests)
│   ├── 01_welcome_screen.yaml
│   ├── 02_navigate_to_login.yaml
│   ├── 03_login_validation_empty.yaml
│   ├── 04_login_invalid_credentials.yaml
│   ├── 05_login_worker_success.yaml
│   ├── 06_login_client_success.yaml
│   ├── 07_logout.yaml
│   └── 08_navigate_to_register.yaml
│
├── jobs_worker/                   # Worker job browsing (5 tests)
│   ├── 01_browse_categories.yaml
│   ├── 02_search_jobs.yaml
│   ├── 03_view_job_detail.yaml
│   ├── 04_save_job.yaml
│   └── 05_view_applications.yaml
│
├── jobs_client/                   # Client job management (3 tests)
│   ├── 01_create_job.yaml
│   ├── 02_view_my_jobs.yaml
│   └── 03_browse_workers.yaml
│
├── wallet/                        # Wallet & payments (4 tests)
│   ├── 01_view_balance.yaml
│   ├── 02_deposit_flow.yaml
│   ├── 03_withdraw_flow.yaml
│   └── 04_payment_methods.yaml
│
├── kyc/                           # KYC verification (2 tests)
│   ├── 01_start_kyc.yaml
│   └── 02_check_status.yaml
│
└── profile/                       # Profile management (4 tests)
    ├── 01_view_profile.yaml
    ├── 02_edit_profile.yaml
    ├── 03_avatar_upload.yaml
    └── 04_switch_profile.yaml
```

## 🧪 Test Users

For successful login tests, these users must exist in the **production database**:

| Role   | Email                     | Password    |
|--------|---------------------------|-------------|
| WORKER | worker.test@iayos.com     | Test1234!   |
| CLIENT | client.test@iayos.com     | Test1234!   |

## 📝 Writing Tests

### Basic Test Template

```yaml
# Test: Description of what this test does
appId: com.iayos.app
tags:
  - auth
  - login

---

# Launch app fresh
- launchApp:
    clearState: true

# Wait for screen to load
- waitForAnimationToEnd

# Assert element is visible
- assertVisible:
    id: "welcome-screen"

# Tap on element
- tapOn:
    id: "welcome-login-button"

# Input text
- tapOn:
    id: "login-email-input"
- inputText: "user@example.com"

# Hide keyboard
- hideKeyboard

# Take screenshot
- takeScreenshot: "test_result"
```

### Common Commands

| Command | Description |
|---------|-------------|
| `launchApp` | Launch or restart the app |
| `tapOn` | Tap on an element by id, text, or coordinates |
| `inputText` | Type text into focused field |
| `assertVisible` | Assert element is visible |
| `assertNotVisible` | Assert element is not visible |
| `waitForAnimationToEnd` | Wait for animations to complete |
| `extendedWaitUntil` | Wait for condition with timeout |
| `scrollUntilVisible` | Scroll until element is found |
| `hideKeyboard` | Hide the keyboard |
| `takeScreenshot` | Capture screenshot |

## 🔧 Test IDs Required

Make sure these testIDs are set in your React Native components:

### Welcome Screen ✅ (Already implemented)
- `welcome-screen` - Container
- `welcome-get-started-button` - Get Started button
- `welcome-login-button` - Login button

### Login Screen ✅ (Already implemented)
- `login-screen` - Container
- `login-email-input` - Email input
- `login-password-input` - Password input
- `login-submit-button` - Login button
- `login-register-link` - Register link

### Profile Screen ✅ (Already implemented)
- `profile-tab` - Profile tab button
- `profile-logout-button` - Logout button

### Main App ✅ (Already implemented)
- `jobs-screen` - Jobs screen container
- `home-screen` - Home screen container
- `select-role-screen` - Role selection screen
- `tab-bar` - Tab navigation bar

### Jobs Screens - Worker (Need to add)
- `categories-grid` - Category grid container
- `job-card-{index}` - Individual job cards (0, 1, 2...)
- `search-button` - Open search
- `search-input` - Search text input
- `filter-button` - Open filters
- `apply-filters-button` - Apply filter selections
- `clear-search-button` - Clear search
- `saved-jobs-button` - View saved jobs
- `save-job-button` - Save/unsave job toggle
- `job-detail-screen` - Job detail container
- `apply-button` - Apply to job
- `applications-tab` - Applications list tab
- `application-card-{index}` - Application cards

### Jobs Screens - Client (Need to add)
- `create-job-button` - Start job creation
- `job-title-input` - Job title field
- `job-description-input` - Job description field
- `job-category-picker` - Category selector
- `job-budget-input` - Budget amount field
- `job-location-picker` - Location selector
- `submit-job-button` - Submit job posting
- `workers-section` - Browse workers section
- `worker-card-{index}` - Worker profile cards

### Wallet Screens (Need to add)
- `wallet-screen` - Wallet main screen
- `wallet-section` - Wallet section in profile
- `balance-amount` - Balance display
- `deposit-button` - Open deposit flow
- `withdraw-button` - Open withdraw flow
- `deposit-amount-input` - Deposit amount
- `withdraw-amount-input` - Withdraw amount
- `deposit-submit-button` - Submit deposit
- `transaction-history` - Transaction list
- `payment-methods` - Payment methods section
- `add-payment-method` - Add new payment method
- `account-name-input` - Payment account name
- `account-number-input` - Payment account number
- `save-payment-method` - Save payment method

### KYC Screens (Need to add)
- `kyc-section` - KYC section in profile
- `kyc-upload-screen` - KYC upload screen
- `id-type-national` - National ID option
- `id-type-passport` - Passport option
- `front-id-upload` - Front ID upload button
- `back-id-upload` - Back ID upload button
- `selfie-upload` - Selfie upload button
- `kyc-submit-button` - Submit KYC
- `kyc-status` - KYC status indicator
- `refresh-status` - Refresh KYC status

### Profile Screens (Need to add)
- `profile-screen` - Profile main screen
- `profile-avatar` - Avatar image/button
- `edit-profile-button` - Edit profile button
- `bio-input` - Bio text input
- `hourly-rate-input` - Hourly rate input
- `save-profile-button` - Save profile changes
- `switch-profile-button` - Switch profile role
- `camera-option` - Camera picker option
- `gallery-option` - Gallery picker option

### Navigation (Need to add)
- `home-tab` - Home tab button
- `jobs-tab` - Jobs tab button
- `messages-tab` - Messages tab button
- `back-button` - Back navigation button
- `close-modal` - Close modal button

## 🤖 GitHub Actions

Tests run automatically via `.github/workflows/maestro-tests.yml`:

- **On push** to `main` (if mobile code changed)
- **On PRs** affecting mobile code
- **Manual trigger** with test suite selection

### Manual Trigger Options

1. Go to Actions → Maestro E2E Tests
2. Click "Run workflow"
3. Select test suite: `auth`, `jobs_worker`, `jobs_client`, `wallet`, `kyc`, `profile`, or `all`
4. Optionally specify APK version tag

## 🐛 Debugging

### View test execution

```bash
# Run with verbose output
maestro test .maestro/auth/01_welcome_screen.yaml --debug-output debug/

# Interactive studio mode
maestro studio
```

### Common Issues

1. **Element not found**: Check testID is set correctly
2. **Timeout**: Increase `waitTimeout` in config.yaml
3. **Animation issues**: Add `waitForAnimationToEnd` before assertions

## 📊 CI/CD Integration

Test results are:
- Published as JUnit XML reports
- Screenshots uploaded as artifacts
- Summarized in PR comments

## 🔄 Migration from Detox

The old Detox tests are archived in `e2e/` folder. Maestro was chosen because:
- ✅ No native build required (uses release APK)
- ✅ Simple YAML syntax (vs TypeScript)
- ✅ Faster test execution
- ✅ Better CI/CD integration
- ✅ Built-in retry mechanism
- ✅ No WebSocket connection issues
