# First Build Test Guide

## Quick Test Checklist

Use this guide to verify the new local build workflow works correctly.

### Pre-Test: Merge the PR

1. Review and approve PR on GitHub
2. Merge to main branch
3. Navigate to Actions tab

### Test 1: Manual Workflow Trigger

**Steps:**

1. Go to **Actions** → **Mobile App Release**
2. Click **Run workflow**
3. Select branch: `main`
4. Configure inputs:
   - Version bump type: `patch`
   - Use latest build: `false` (unchecked)
   - Skip build: `false` (unchecked)
   - Local build mode: `false` (unchecked)
   - Mark as QA: `false` (optional)
   - Mark as prerelease: `false` (optional)
5. Click **Run workflow**

**Expected Results:**

- ✅ Workflow starts immediately
- ✅ "Setup Java" step completes successfully
- ✅ "Setup Android SDK" step completes successfully
- ✅ "Setup Expo" step completes successfully
- ✅ "Build Android APK" step shows:
  - "📱 Generating native Android project..."
  - "🔨 Building release APK with Gradle..."
  - "📦 Copying APK to release location..."
  - "✅ Local build complete!"
- ✅ "Create Release" step creates GitHub release
- ✅ APK is attached to release (e.g., `iayos-3.0.2.apk`)
- ✅ Total build time: ~5-8 minutes

**Check Build Logs:**

```bash
# In "Build Android APK" step, you should see:
> Task :app:bundleReleaseJsAndAssets
> Task :app:processReleaseMainManifest
> Task :app:compileReleaseKotlin
> Task :app:assembleRelease

BUILD SUCCESSFUL in Xm Ys
```

### Test 2: Download and Install APK

**Steps:**

1. Go to **Releases** tab
2. Find the latest release (e.g., `mobile-v3.0.2`)
3. Download the `.apk` file
4. Transfer to Android device
5. Install APK (enable "Install from unknown sources" if needed)
6. Open iAyos app
7. Verify app loads and functions correctly

**Expected Results:**

- ✅ APK size: ~40-60 MB (similar to previous EAS builds)
- ✅ App installs without errors
- ✅ App opens to login/home screen
- ✅ All features work (login, job browsing, etc.)
- ✅ No crashes or abnormal behavior

### Test 3: Automatic Build on Push

**Steps:**

1. Make a small change to mobile code:
   ```bash
   cd apps/frontend_mobile/iayos_mobile
   # Edit any .tsx file (e.g., add a comment)
   git add .
   git commit -m "chore: trigger automatic build test"
   git push origin main
   ```

2. Check Actions tab for automatic workflow run

**Expected Results:**

- ✅ Workflow triggers automatically
- ✅ Build completes successfully
- ✅ Version auto-incremented (e.g., 3.0.2 → 3.0.3)
- ✅ New release created automatically

### Test 4: Use Latest Build Option

**Steps:**

1. Go to **Actions** → **Mobile App Release**
2. Click **Run workflow**
3. Check **"Use latest build"** ✓
4. Click **Run workflow**

**Expected Results:**

- ✅ Workflow downloads APK from latest GitHub Release
- ✅ No Gradle build steps run
- ✅ New release created with existing APK
- ✅ Much faster (~1-2 minutes)

### Troubleshooting

If tests fail, check:

#### Build Fails at "Setup Java"
- Check workflow log for exact error
- Verify actions/setup-java@v4 is available
- Java 17 should be downloaded and cached

#### Build Fails at "Setup Android SDK"
- Check workflow log for exact error
- Verify android-actions/setup-android@v3 is available
- Android SDK should be installed to `$ANDROID_HOME`

#### Build Fails at "expo prebuild"
- Check if Node.js dependencies installed correctly
- Verify `package.json` has required Expo dependencies
- Look for missing native module errors

#### Build Fails at "gradlew assembleRelease"
- Check Gradle version compatibility
- Look for memory errors (unlikely with 7GB RAM)
- Check for missing Android SDK components

#### APK Not Found After Build
- Verify path: `android/app/build/outputs/apk/release/app-release.apk`
- Check if Gradle build actually completed successfully
- Look for file permission issues

### Success Criteria

All tests should pass:
- ✅ Manual trigger builds successfully
- ✅ APK installs and runs correctly
- ✅ Automatic build on push works
- ✅ "Use latest build" option works
- ✅ Build time ~5-8 minutes
- ✅ No EAS credits consumed

### Rollback if Needed

If any critical issues occur:

1. Go to `.github/workflows/mobile-release.yml`
2. Uncomment lines 74-78 (EAS CLI setup)
3. Replace build steps with original EAS build
4. Add EXPO_TOKEN back to secrets
5. Push changes

### Report Results

After testing, document:
- ✅ Which tests passed
- ❌ Which tests failed (if any)
- 📊 Build time comparison with previous EAS builds
- 📦 APK size comparison
- 🐛 Any issues encountered

### Next Steps After Successful Testing

1. ✅ Archive this test guide
2. ✅ Update team documentation
3. ✅ Monitor next few builds
4. ✅ Celebrate cost savings! 🎉
