# GitHub Actions Local Build Setup

## Overview

The mobile release workflow has been configured to build Android APKs locally on GitHub Actions runners instead of using Expo Application Services (EAS) cloud builds. This eliminates the need for EAS credits while maintaining the same release process.

## What Changed

### Previous Setup (EAS Cloud Builds)
- Used `eas build --platform android` command
- Required EXPO_TOKEN secret with EAS subscription
- Built on Expo's cloud infrastructure
- Incurred EAS build credits for each build
- Download APK from EAS servers after build

### Current Setup (Local GitHub Actions Builds)
- Uses `expo prebuild` to generate native Android project
- Builds APK locally using Gradle on GitHub Actions runners
- No EAS credits required
- No EXPO_TOKEN needed for builds
- Faster builds (no EAS queue wait time)

## Build Process

The workflow now follows these steps:

1. **Setup Build Environment**
   - Install Node.js 20
   - Install Java 17 (Temurin distribution)
   - Setup Android SDK
   - Install Expo CLI

2. **Generate Native Project**
   ```bash
   npx expo prebuild --clean --platform android
   ```
   This creates the `android/` folder with native code

3. **Build Release APK**
   ```bash
   cd android
   ./gradlew assembleRelease --no-daemon
   ```
   This compiles the APK at `android/app/build/outputs/apk/release/app-release.apk`

4. **Create GitHub Release**
   - Copy APK to expected location
   - Upload to GitHub Releases
   - Tag with version number

## Benefits

✅ **No EAS Credits Required** - Completely free GitHub Actions builds  
✅ **Faster Builds** - No waiting in EAS queue  
✅ **Full Control** - Direct access to build logs and artifacts  
✅ **Same Output** - Identical production-ready APK  
✅ **Consistent Process** - Same version bumping and release workflow

## Build Options

The workflow still supports multiple build modes:

### 1. Standard Build (Default)
```bash
# Workflow runs automatically on push to main/dev
# Or manually trigger via GitHub Actions UI
```
Builds fresh APK locally on GitHub Actions

### 2. Use Latest Build
```bash
# Check "Use latest build" when manually triggering
```
Downloads APK from the latest GitHub Release (useful for re-releases)

### 3. Local Build Mode
```bash
# Check "Local build mode" when manually triggering
```
Bumps version but you build APK locally on your machine using Android Studio

### 4. Skip Build
```bash
# Check "Skip build" when manually triggering
```
Testing mode - only version bump, no APK build

## Local Development

If you want to build APK locally on your machine:

### Option A: Using Expo CLI (Recommended)
```bash
cd apps/frontend_mobile/iayos_mobile
npm install
npx expo prebuild --clean
npx expo run:android --variant release
```

### Option B: Using Android Studio
```bash
cd apps/frontend_mobile/iayos_mobile
npm install
npx expo prebuild --clean
# Open android/ folder in Android Studio
# Build > Generate Signed Bundle/APK > APK
# Choose 'release' build variant
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Build Fails with "SDK not found"
The workflow installs Android SDK automatically. If it fails:
- Check the `Setup Android SDK` step in workflow logs
- Verify Java 17 is installed (required for Gradle)

### Build Fails with "Out of memory"
GitHub Actions runners have 7GB RAM which should be sufficient. If needed:
- Add `--max-workers=2` to gradlew command
- Add Gradle memory settings in `gradle.properties`

### APK Not Found After Build
Check the exact output path in logs. The default is:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Want to Switch Back to EAS?
1. Uncomment the EAS CLI setup step in workflow
2. Replace local build steps with EAS build command
3. Add back EXPO_TOKEN secret requirement
4. Update release notes to reflect EAS builds

## Environment Variables

The workflow sets these during build:

```yaml
EXPO_PUBLIC_API_URL: "https://api.iayos.online"
```

This matches the production profile in `eas.json`

## GitHub Actions Resources

**Runner Specs:**
- OS: Ubuntu Latest
- CPU: 2-core
- RAM: 7 GB
- Storage: 14 GB SSD
- Build time: ~5-8 minutes for Android release

**Required Secrets:**
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions
- `MOBILE_RELEASE_PAT` - Personal access token for version commits
- `DO_API_TOKEN` - DigitalOcean API (for version env vars)
- `DO_APP_ID` - DigitalOcean App ID

**No longer required:**
- ~~`EXPO_TOKEN`~~ - Not needed for local builds

## Related Documentation

- [COMMIT_GUIDE.md](../COMMIT_GUIDE.md) - How to trigger releases with commit messages
- [Expo Prebuild Docs](https://docs.expo.dev/workflow/prebuild/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Android Gradle Plugin](https://developer.android.com/build)

## Migration Notes

**Date:** February 2026  
**Reason:** EAS credits exhausted  
**Impact:** Zero - Same APK output, faster builds, no costs  
**Rollback:** Uncomment EAS steps if needed in the future
