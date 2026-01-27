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

## 📁 Test Structure

```
.maestro/
├── config.yaml                    # Global configuration
├── auth/                          # Authentication tests
│   ├── 01_welcome_screen.yaml     # Welcome screen display
│   ├── 02_navigate_to_login.yaml  # Navigate to login
│   ├── 03_login_validation_empty.yaml
│   ├── 04_login_invalid_credentials.yaml
│   ├── 05_login_worker_success.yaml
│   ├── 06_login_client_success.yaml
│   ├── 07_logout.yaml
│   └── 08_navigate_to_register.yaml
├── jobs/                          # Job-related tests (TODO)
└── profile/                       # Profile tests (TODO)
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

### Welcome Screen
- `welcome-screen` - Container
- `welcome-get-started-button` - Get Started button
- `welcome-login-button` - Login button

### Login Screen
- `login-screen` - Container
- `login-email-input` - Email input
- `login-password-input` - Password input
- `login-submit-button` - Login button
- `login-register-link` - Register link

### Profile Screen
- `profile-tab` - Profile tab button
- `profile-logout-button` - Logout button

### Main App
- `jobs-screen` - Jobs screen container
- `home-screen` - Home screen container
- `select-role-screen` - Role selection screen
- `tab-bar` - Tab navigation bar

## 🤖 GitHub Actions

Tests run automatically via `.github/workflows/maestro-tests.yml`:

- **On push** to `main` (if mobile code changed)
- **On PRs** affecting mobile code
- **Manual trigger** with test suite selection

### Manual Trigger Options

1. Go to Actions → Maestro E2E Tests
2. Click "Run workflow"
3. Select test suite: `auth`, `jobs`, `profile`, or `all`
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
