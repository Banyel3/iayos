# Detox E2E Testing Setup for Expo

## Current Status: ⚠️ NOT WORKING

The Detox tests are currently **failing** because Expo managed apps don't support Detox out of the box. The app needs native code integration that isn't available in standard Expo builds.

### Error Observed

```
Failed to run application on the device
HINT: Most likely, your tests have timed out and called detox.cleanup() while it was waiting for "ready" message (over WebSocket) from the instrumentation process.
```

The app crashes during initialization with ClassNotFoundException errors and never connects to Detox's WebSocket server.

## Root Cause

1. **Expo Limitation**: Expo managed workflow doesn't support native modules like Detox without custom native code
2. **Missing Native Integration**: Detox requires native code in both iOS and Android to establish WebSocket connection
3. **No Development Build**: The current setup uses standard Expo builds, not development builds with custom native modules

## Solution Options

### Option 1: Use Expo Development Builds (RECOMMENDED)

Expo Development Builds allow you to include custom native code while still using Expo's developer experience.

#### Steps:

1. **Install expo-dev-client**

   ```bash
   cd apps/frontend_mobile/iayos_mobile
   npx expo install expo-dev-client
   ```

2. **Configure EAS Build**

   Update `eas.json`:

   ```json
   {
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "preview": {
         "distribution": "internal"
       },
       "production": {}
     }
   }
   ```

3. **Add Detox to Development Build**

   Create/update `app.config.js`:

   ```javascript
   module.exports = {
     expo: {
       // ... existing config
       plugins: [
         // ... existing plugins
         [
           "expo-dev-client",
           {
             scheme: "iayos",
           },
         ],
       ],
     },
   };
   ```

4. **Build Development APK with EAS**

   ```bash
   # Install EAS CLI globally
   npm install -g eas-cli

   # Login to Expo
   eas login

   # Build development APK
   eas build --profile development --platform android --local
   ```

5. **Update .detoxrc.js**

   ```javascript
   apps: {
     "android.debug": {
       type: "android.apk",
       binaryPath: "build-*/iAyos-*.apk", // EAS build output
       testBinaryPath: "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
     },
   }
   ```

6. **Update GitHub Actions**

   The workflow needs to use EAS Build instead of `expo export`:

   ```yaml
   - name: Build Android APK for Detox
     run: |
       cd apps/frontend_mobile/iayos_mobile
       eas build --profile development --platform android --local --non-interactive
   ```

### Option 2: Eject to Bare React Native (NOT RECOMMENDED)

This would give full control but lose Expo's benefits:

```bash
npx expo prebuild
```

**Pros**: Full native control, standard Detox setup
**Cons**: Lose Expo managed workflow, more maintenance

### Option 3: Use Alternative Testing (TEMPORARY)

For immediate testing needs, consider:

- **Maestro**: Works with Expo without native integration
- **Appium**: Cross-platform, works with any app
- **Manual testing**: Until proper E2E is set up

## Current Workaround: Use Release APK

The GitHub Actions workflow now supports downloading and testing APKs from GitHub releases! This is useful if you have:

- Pre-built APKs from EAS Build
- Manually created development builds with expo-dev-client
- APKs from previous successful builds

### How to Use:

1. **Create a GitHub Release** with your APK:

   ```bash
   # Build APK with EAS (local or cloud)
   eas build --profile development --platform android --local

   # Create a release and upload the APK
   gh release create v1.0.0-detox --title "E2E Test Build" --notes "Development build with expo-dev-client for Detox" ./build-*.apk
   ```

2. **Run the Workflow**:
   - Go to Actions → Mobile E2E Tests
   - Click "Run workflow"
   - Check "Use APK from latest GitHub release"
   - (Optional) Specify a release tag, or leave blank for latest

3. **The workflow will**:
   - Download the APK from your release
   - Build only the androidTest APK (much faster!)
   - Run all Detox tests

### Benefits:

- ✅ Skip expensive full Android build (saves ~15-20 minutes)
- ✅ Test with production-like builds from EAS
- ✅ Consistent test environment
- ✅ Can test specific versions by tag

### APK Naming:

The workflow looks for these patterns in your release:

- `app-debug.apk` (exact match)
- `*-debug.apk` (any debug APK)
- `*.apk` (any APK file)

## Previous Workaround

The GitHub Actions workflow is set to `workflow_dispatch` only (manual trigger) to avoid automatic failures. The tests are written and ready - they just need proper native integration.

## Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Detox with Expo](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#expo)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [expo-dev-client](https://docs.expo.dev/development/getting-started/)

## Next Steps

1. ✅ Install `expo-dev-client`
2. ✅ Configure `eas.json` for development builds
3. ✅ Build development APK with EAS
4. ✅ Update Detox configuration for EAS builds
5. ✅ Test locally first
6. ✅ Update GitHub Actions workflow
7. ✅ Enable automatic CI/CD testing

## Testing Checklist

Once development builds are set up:

- [ ] App launches successfully in emulator
- [ ] Detox connects to app WebSocket
- [ ] Authentication tests pass
- [ ] Navigation tests work
- [ ] CI/CD workflow succeeds
- [ ] Tests run reliably (< 5% flake rate)

## Notes

- Development builds are required for any native modules (Detox, custom modules, etc.)
- EAS Build can run locally without cloud builds using `--local` flag
- Development builds are larger than production builds (include dev tools)
- For production, use standard Expo builds without Detox
