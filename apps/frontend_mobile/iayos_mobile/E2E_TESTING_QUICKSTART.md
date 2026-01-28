# E2E Testing Quick Start Guide

This guide shows you how to create and test mobile app builds with Detox E2E tests.

## TL;DR - Fastest Path

```bash
# 1. Create a development build (includes Detox support)
cd apps/frontend_mobile/iayos_mobile
npx expo install expo-dev-client  # One-time install
eas build --profile development --platform android

# 2. Create GitHub release (after build completes)
eas build:download --latest --platform android
gh release create v1.0.0-dev --title "E2E Test Build" ./build-*.apk

# 3. Run E2E tests from GitHub Actions
# - Go to Actions → "Mobile E2E Tests (Detox)"
# - Click "Run workflow"
# - Select: Platform=android, Use release APK=✓, Use live backend=✓
```

That's it! The APK connects to your live `api.iayos.online` backend automatically.

## Prerequisites

- Node.js 20+
- Android SDK
- EAS CLI: `npm install -g eas-cli`
- GitHub CLI: `gh auth login`

## Step 1: Install expo-dev-client

```bash
cd apps/frontend_mobile/iayos_mobile
npx expo install expo-dev-client
```

## Step 2: Use Mobile Release Workflow (EASIEST)

The mobile-release workflow now has a "development" build option:

1. **Go to GitHub Actions** → "Mobile App Release"
2. **Click "Run workflow"**
3. **Select**:
   - Build type: `development` ← This is the key!
   - Version bump: `patch`
   - Other options as needed
4. **Wait for completion** - The workflow will:
   - Build APK with expo-dev-client
   - Create a GitHub release automatically
   - Tag it with `-dev` suffix

**Why this works:**

- ✅ Development profile includes expo-dev-client
- ✅ Backend URL configured in `eas.json` (api.iayos.online)
- ✅ Perfect for E2E testing
- ✅ No manual steps needed!

## Step 3: Build Manually (Alternative)

If you prefer manual control:

### Option A: Cloud Build (Recommended)

```bash
eas build --profile development --platform android
```

Wait for build to complete, then download:

```bash
eas build:download --latest --platform android
```

### Option B: Local Build

```bash
eas build --profile development --platform android --local
```

## Step 4: Create GitHub Release (If Built Manually)

Only needed if you didn't use the Mobile Release workflow:

```bash
# After build completes, create a release
gh release create v1.0.0-e2e \
  --title "E2E Test Build" \
  --notes "Development build with expo-dev-client for Detox testing" \
  ./build-*.apk

# Or if you downloaded from EAS:
gh release create v1.0.0-e2e \
  --title "E2E Test Build" \
  --notes "Development build with expo-dev-client for Detox testing" \
  ./iayos-*.apk
```

## Step 5: Run E2E Tests in CI

1. Go to GitHub Actions
2. Select "Mobile E2E Tests (Detox)" workflow
3. Click "Run workflow"
4. Select:
   - Platform: `android`
   - Use APK from release: `✓` (checked)
   - Use live backend: `✓` (checked) ← Your live API!
   - Release tag: `v1.0.0-e2e` (or leave blank for latest)
5. Click "Run workflow"

The workflow will:

- Download your pre-built development APK
- Test against live backend (api.iayos.online)
- Run all Detox tests
- Generate test report

**Note:** Tests use live backend. Cleanup command provided: `python manage.py cleanup_e2e_test_data`

## Step 6: View Results

After the workflow completes:

1. Click on the workflow run
2. Download artifacts:
   - `detox-test-results` - Test report HTML
   - `detox-artifacts` - Screenshots, logs

## Important Notes

### Backend Connection

- ✅ **Development builds** connect to `api.iayos.online` (configured in `eas.json`)
- ⚠️ **Test accounts needed**: Ensure these exist in production:
  - `client@test.com` / `Test123!`
  - `worker@test.com` / `Test123!`
- 🗑️ **Cleanup**: Run `python manage.py cleanup_e2e_test_data` periodically to remove test data

### Build Types

- **Development**: Includes expo-dev-client, Detox-ready, connects to live API
- **Production**: Optimized for app store, no Detox support

### Release Detection

- ✅ Workflow uses **latest release** automatically (leave tag blank)
- ✅ Works with any APK file in the release

## Local Testing (Optional)

You can also test locally before pushing to CI:

```bash
# 1. Install the APK on emulator
adb install -r ./build-*.apk

# 2. Start backend (in separate terminal)
cd apps/backend/src
python manage.py runserver 0.0.0.0:8000

# 3. Set up ADB reverse (so emulator can reach localhost:8000)
adb reverse tcp:8000 tcp:8000

# 4. Run Detox tests
cd apps/frontend_mobile/iayos_mobile
npm run test:e2e:android
```

## Troubleshooting

### "No releases found"

- Use the Mobile App Release workflow with build_type=development
- Or create manually: `gh release create test-v1 --title "Test" your-app.apk`

### "APK crashes on launch"

Make sure the APK was built with development profile:

```bash
# Check it's a development build
eas build:list --platform android --limit 1
# Should show "development" as the profile
```

### "Tests timeout" or "Backend connection failed"

1. Check live backend is accessible: `curl https://api.iayos.online/health/live`
2. Verify test users exist in production database
3. Check emulator: `adb devices`

### "Build failed in Mobile Release workflow"

- Ensure EXPO_TOKEN secret is set in GitHub
- Check EAS build status: `eas build:list`
- Try local build first to debug

## Best Practices

✅ **DO:**

- Use Mobile Release workflow with `development` build type
- Test against live backend (already configured)
- Keep a "known good" development release for quick testing
- Tag development releases with `-dev` suffix

❌ **DON'T:**

- Build production builds for E2E testing (no Detox support)
- Delete development releases while CI is running
- Forget to create test users in live backend first

## Next Steps

- [ ] Set up automated release creation on merge to main
- [ ] Add iOS testing (requires macOS runner)
- [ ] Configure automatic E2E on PR
- [ ] Add more test suites (jobs, profiles, etc.)

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Detox Docs](https://wix.github.io/Detox/)
- [expo-dev-client](https://docs.expo.dev/development/getting-started/)
