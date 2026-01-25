# Detox E2E Testing Setup - iAyos Mobile App

## 📋 Overview

Comprehensive end-to-end testing setup using Detox for React Native mobile app.

## 🎯 Features Implemented

### ✅ Core Setup (Complete)

- Detox configuration for iOS & Android
- Jest test runner with custom config
- Global setup/teardown hooks
- Test helpers and utilities
- Mock data fixtures
- GitHub Actions CI/CD with auto-issue creation

### 🧪 Test Coverage (Phase 1)

- **Authentication Flow**: Login, logout, session persistence
- More tests to be added in Phase 2-3

### 🔧 Configuration Files

1. **`.detoxrc.js`** - Main Detox configuration
   - iOS Simulator: iPhone 15
   - Android Emulator: Pixel 5 API 31
   - Build paths and schemes
   - Behavior settings

2. **`e2e/jest.config.js`** - Jest test runner config
   - Test patterns: `**/*.e2e.ts`
   - Timeout: 120 seconds
   - HTML reporter for visual reports

3. **`package.json`** - NPM scripts
   - `test:e2e` - Run iOS tests
   - `test:e2e:android` - Run Android tests
   - `test:e2e:build:ios` - Build iOS app
   - `test:e2e:build:android` - Build Android app

### 📁 File Structure

```
e2e/
├── setup/
│   ├── global-setup.ts           # Pre-test setup (backend check)
│   ├── global-teardown.ts        # Post-test cleanup
│   └── setup-after-env.ts        # Per-file setup
├── helpers/
│   ├── auth.ts                   # Login/logout helpers
│   ├── navigation.ts             # Navigation helpers
│   ├── assertions.ts             # Custom assertions
│   └── mocking.ts                # Native module mocks
├── fixtures/
│   ├── users.json                # Test user data
│   ├── jobs.json                 # Test job data
│   └── images/                   # Test images
├── tests/
│   └── auth/
│       └── login.e2e.ts          # Login flow tests
├── reports/                       # HTML test reports
└── artifacts/                     # Screenshots on failure
```

## 🚀 Running Tests

### Local Development

**iOS (Mac only)**:

```bash
cd apps/frontend_mobile/iayos_mobile

# Install dependencies
npm install

# Build app for testing
npm run test:e2e:build:ios

# Run tests
npm run test:e2e
```

**Android (Linux/Mac/Windows with WSL)**:

```bash
cd apps/frontend_mobile/iayos_mobile

# Create Android emulator (first time only)
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "system-images;android-31;google_apis;x86_64"
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_5_API_31 -k "system-images;android-31;google_apis;x86_64" --device "pixel_5"

# Start emulator
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_31 &

# Build app for testing
npm run test:e2e:build:android

# Run tests
npm run test:e2e:android
```

### CI/CD (GitHub Actions)

Tests run automatically on:

- Pull requests to `main` or `dev` branches
- Pushes to `main` or `dev` branches
- Manual workflow dispatch

**Workflow Features**:

- ✅ Parallel execution (iOS + Android)
- ✅ Test reports uploaded as artifacts
- ✅ Screenshots on failure
- ✅ **Auto-create GitHub issues on test failures**
- ✅ 60-minute timeout per job

## 🎯 Test Data Setup

### Staging Backend Requirements

Create these test users in staging backend:

1. **Worker Account**:
   - Email: `worker.test@iayos.com`
   - Password: `Test1234!`
   - Profile Type: WORKER
   - KYC Status: APPROVED
   - Wallet Balance: ₱5,000

2. **Client Account**:
   - Email: `client.test@iayos.com`
   - Password: `Test1234!`
   - Profile Type: CLIENT
   - KYC Status: APPROVED
   - Wallet Balance: ₱50,000

3. **Agency Account**:
   - Email: `agency.test@iayos.com`
   - Password: `Test1234!`
   - Profile Type: AGENCY
   - KYC Status: APPROVED

### Test Jobs

See `e2e/fixtures/jobs.json` for sample job data to seed staging database.

## 🔒 Environment Variables

Set in GitHub Secrets:

```
STAGING_BACKEND_URL=https://staging.iayos.com
```

## 📊 Test Reports

After running tests:

1. **HTML Report**: `e2e/reports/test-report.html`
2. **Screenshots**: `e2e/artifacts/` (on failure)
3. **CI/CD Artifacts**: Downloaded from workflow run

## 🐛 Debugging Failed Tests

### Local Debugging

```bash
# Run tests in debug mode
npm run test:e2e -- --loglevel trace

# Run single test file
npm run test:e2e -- e2e/tests/auth/login.e2e.ts

# Keep app open after test failure
npm run test:e2e -- --cleanup
```

### CI/CD Debugging

When tests fail in CI/CD:

1. **Auto-created GitHub Issue** will contain:
   - Workflow run link
   - Branch and commit info
   - Links to artifacts (screenshots, reports)
   - Debugging steps

2. **Download Artifacts**:
   - Navigate to failed workflow run
   - Download `ios-e2e-test-report` or `android-e2e-test-report`
   - Download `ios-e2e-screenshots` or `android-e2e-screenshots`

3. **Review HTML Report**:
   - Open `test-report.html` in browser
   - See detailed test results, timings, and errors

## 🧩 Adding New Tests

### 1. Create Test File

```typescript
// e2e/tests/jobs/browse.e2e.ts
import { device, element, by, expect, waitFor } from "detox";
import { loginAsWorker } from "../../helpers/auth";
import { navigateToTab } from "../../helpers/navigation";

describe("Jobs: Browse Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsWorker();
  });

  it("should display job listings", async () => {
    await navigateToTab("jobs");
    await expect(element(by.id("job-list"))).toBeVisible();
  });
});
```

### 2. Add testID Props to Components

```tsx
// app/jobs/index.tsx
<View testID="job-list">
  {jobs.map((job) => (
    <TouchableOpacity key={job.id} testID={`job-card-${job.id}`}>
      <Text testID={`job-title-${job.id}`}>{job.title}</Text>
    </TouchableOpacity>
  ))}
</View>
```

### 3. Run Test

```bash
npm run test:e2e -- e2e/tests/jobs/browse.e2e.ts
```

## 🎨 Best Practices

1. **Use Descriptive testIDs**: `job-card-123`, not `card1`
2. **Add Timeouts**: Use `waitFor().withTimeout(5000)` for network calls
3. **Mock Native Modules**: Use helpers from `e2e/helpers/mocking.ts`
4. **Clean Up**: Reset app state between tests
5. **Parallelize**: Keep tests independent (no shared state)

## 📈 Roadmap

### Phase 1 (Current)

- ✅ Core setup complete
- ✅ Authentication tests
- ✅ CI/CD workflow with auto-issue creation
- ⏳ Add testIDs to screens (20+ critical components)

### Phase 2 (2-4 weeks)

- Job browsing & search tests
- Application submission tests
- Payment flow tests
- Profile management tests

### Phase 3 (1-2 months)

- Real-time messaging tests
- KYC document upload tests
- Review submission tests
- Edge cases & error handling

## 🆘 Troubleshooting

### iOS Simulator Issues

```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Rebuild framework cache
npm run test:e2e:clean
```

### Android Emulator Issues

```bash
# List emulators
$ANDROID_HOME/emulator/emulator -list-avds

# Wipe emulator data
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_31 -wipe-data

# Force close
adb devices
adb -s <device-id> emu kill
```

### Test Timeout Issues

- Increase timeout in test: `it('...', async () => { ... }, 180000)`
- Check staging backend is responsive
- Verify emulator performance (allocate more RAM)

## 📚 Resources

- [Detox Docs](https://wix.github.io/Detox/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Expo + Detox Guide](https://docs.expo.dev/guides/detox/)

---

**Status**: ✅ Phase 1 Setup Complete  
**Next**: Add testIDs to 20 critical screens, write job browsing tests
