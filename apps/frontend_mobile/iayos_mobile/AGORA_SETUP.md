# Agora Voice Calling - Setup Instructions

## Current Status: ⚠️ TEMPORARILY DISABLED

The Agora voice calling feature has been temporarily disabled to allow development with Expo Go.

### Why was it disabled?

`react-native-agora` is a **native module** that requires:
- Native iOS/Android code compilation
- Expo config plugin setup
- A custom development build (cannot use Expo Go)

### What was changed?

**File: `lib/services/agora.ts`**
- Commented out the `react-native-agora` import
- Added type stubs to prevent TypeScript errors
- The service will log warnings but won't crash the app

### Impact

The following features are **non-functional** until Agora is re-enabled:
- Voice calling from messages (`app/messages/[conversationId].tsx`)
- Incoming call screen (`app/call/incoming.tsx`)
- Active call screen (`app/call/active.tsx`)

Users will see UI elements but calls won't connect.

---

## How to Re-enable Agora

### Option 1: Quick Re-enable (Recommended for Production)

1. **Install the Expo config plugin:**
   ```bash
   cd apps/frontend_mobile/iayos_mobile
   npm install react-native-agora-expo-plugin
   ```

2. **Update `app.json`** - Add to the `plugins` array:
   ```json
   {
     "expo": {
       "plugins": [
         "expo-router",
         "react-native-agora-expo-plugin",
         // ... other plugins
       ]
     }
   }
   ```

3. **Restore the original import** in `lib/services/agora.ts`:
   - Uncomment lines 12-24 (the original import)
   - Remove lines 26-48 (the stub types and functions)

4. **Create a development build:**
   ```bash
   # Install expo-dev-client if not already installed
   npm install expo-dev-client

   # Create development build
   npx expo prebuild
   
   # For iOS
   npx expo run:ios
   
   # For Android
   npx expo run:android
   ```

### Option 2: Manual Native Setup (Advanced)

If you need more control over the native configuration:

1. Follow the official Agora React Native setup guide:
   https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native

2. Configure native permissions in:
   - **iOS**: `ios/iayos_mobile/Info.plist`
   - **Android**: `android/app/src/main/AndroidManifest.xml`

3. Restore the import in `lib/services/agora.ts`

---

## Testing Voice Calls

After re-enabling:

1. Ensure you have valid Agora credentials in your `.env`:
   ```
   AGORA_APP_ID=your_app_id_here
   ```

2. Test the flow:
   - Open a conversation
   - Tap the call button
   - Accept the call on another device
   - Verify audio connection

---

## Troubleshooting

### "Module not found" error
- Make sure you've run `npm install` after adding the plugin
- Clear cache: `npx expo start -c`

### "Native module cannot be null" error
- You need a development build, not Expo Go
- Run `npx expo run:ios` or `npx expo run:android`

### Audio not working
- Check microphone permissions on device
- Verify Agora App ID is correct
- Check Agora console for token generation issues

---

## Questions?

Contact the development team or refer to:
- [Agora React Native Docs](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
