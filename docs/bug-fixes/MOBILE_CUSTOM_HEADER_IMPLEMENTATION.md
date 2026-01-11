# Mobile Header Customization - Custom Back Button Implementation

**Date**: January 2025  
**Status**: ✅ COMPLETE  
**Type**: UI Polish - Navigation Header Customization

---

## Problem

User reported seeing a "black thing" (default Expo Router header bar) appearing above all screens in the mobile app. This default header didn't match the iAyos UI theme and created visual inconsistency.

**Issue**: Default Expo Router headers showing across the app
**User Request**: Remove black header bar and add custom back button matching UI theme

---

## Solution

Implemented a global header hiding configuration and created a reusable custom back button component that matches the iAyos design system.

### Changes Made

#### 1. Global Header Configuration

**File**: `apps/frontend_mobile/iayos_mobile/app/_layout.tsx`

Added `screenOptions={{ headerShown: false }}` to the root `<Stack>` component to hide all default headers by default:

```tsx
<Stack
  screenOptions={{
    headerShown: false, // Hide default headers globally
  }}
>
```

This ensures no screen shows the default black Expo header unless explicitly enabled.

#### 2. Custom Back Button Component

**File**: `apps/frontend_mobile/iayos_mobile/components/navigation/CustomBackButton.tsx` (NEW)

Created a reusable back button component with:

- Ionicons "arrow-back" icon
- Matches Colors.textPrimary from theme
- Automatic router.back() navigation
- Optional custom onPress handler
- Configurable color and size props
- Proper touch target with hitSlop
- 24px default size with 8px padding

```tsx
export default function CustomBackButton({
  onPress,
  color = Colors.textPrimary,
  size = 24,
}: CustomBackButtonProps) {
  const router = useRouter();
  // ...
}
```

#### 3. KYC Upload Screen Header

**File**: `apps/frontend_mobile/iayos_mobile/app/kyc/upload.tsx`

- Removed `Stack.Screen` with `headerShown: true`
- Added custom header with:
  - CustomBackButton on left
  - Centered "KYC Verification" title
  - Empty right view for balance
  - White background with bottom border
  - Typography.fontSize.lg (18px) for title

**Layout**:

```tsx
<View style={styles.customHeader}>
  <CustomBackButton />
  <Text style={styles.headerTitle}>KYC Verification</Text>
  <View style={styles.headerRight} />
</View>
```

#### 4. KYC Status Screen Header

**File**: `apps/frontend_mobile/iayos_mobile/app/kyc/status.tsx`

- Removed `Stack.Screen` with `headerShown: true`
- Added custom header with:
  - CustomBackButton on left
  - Centered "KYC Verification" title
  - Refresh button on right (replaces headerRight)
  - White background with bottom border

**Layout**:

```tsx
<View style={styles.customHeader}>
  <CustomBackButton />
  <Text style={styles.headerTitle}>KYC Verification</Text>
  <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
    <Ionicons name="refresh" size={24} color={Colors.primary} />
  </TouchableOpacity>
</View>
```

---

## Files Modified

### Created (1 file):

- `components/navigation/CustomBackButton.tsx` (48 lines)

### Modified (3 files):

- `app/_layout.tsx` - Added global `screenOptions={{ headerShown: false }}`
- `app/kyc/upload.tsx` - Added custom header with CustomBackButton
- `app/kyc/status.tsx` - Added custom header with CustomBackButton + refresh button

---

## Style Implementation

### Custom Header Styles

```tsx
customHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 12,
  paddingVertical: 12,
  backgroundColor: Colors.white,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},
headerTitle: {
  fontSize: Typography.fontSize.lg, // 18px
  fontWeight: "700",
  color: Colors.textPrimary,
  flex: 1,
  textAlign: "center",
},
headerRight: {
  width: 40, // Balance the back button on the left
},
```

### Design Consistency

- **Colors**: Uses Colors.white, Colors.border, Colors.textPrimary, Colors.primary
- **Typography**: Uses Typography.fontSize.lg (18px) matching Next.js design
- **Spacing**: 12px padding horizontal/vertical
- **Border**: 1px bottom border with Colors.border (#E5E7EB)
- **Icon Size**: 24px for back arrow and refresh button
- **Layout**: Flexbox with space-between, centered title

---

## Features

✅ **No Default Headers**: Global configuration hides all Expo headers  
✅ **Reusable Component**: CustomBackButton can be used across all screens  
✅ **Theme Consistency**: Matches iAyos design system colors and typography  
✅ **Customizable**: Props for onPress, color, size  
✅ **Proper Touch Targets**: hitSlop for better mobile UX  
✅ **Automatic Navigation**: Uses router.back() by default  
✅ **TypeScript Support**: Full type definitions  
✅ **Zero Compilation Errors**: All files validated

---

## Usage Guide

### Basic Usage (Just Back Button)

```tsx
import CustomBackButton from "@/components/navigation/CustomBackButton";

// In your screen component:
<View style={styles.customHeader}>
  <CustomBackButton />
  <Text style={styles.headerTitle}>Screen Title</Text>
  <View style={styles.headerRight} />
</View>;
```

### With Action Button

```tsx
<View style={styles.customHeader}>
  <CustomBackButton />
  <Text style={styles.headerTitle}>Screen Title</Text>
  <TouchableOpacity onPress={handleAction}>
    <Ionicons name="settings" size={24} color={Colors.primary} />
  </TouchableOpacity>
</View>
```

### Custom Back Behavior

```tsx
<CustomBackButton
  onPress={() => {
    // Custom logic before navigation
    router.push("/custom-route");
  }}
/>
```

---

## Testing Checklist

- [ ] No black header bar visible on any screen
- [ ] Back button navigates correctly
- [ ] Header title centered properly
- [ ] Touch target responsive (easy to tap)
- [ ] Consistent spacing and alignment
- [ ] Colors match theme (#3B82F6 for icons)
- [ ] Typography matches Next.js (18px)
- [ ] Refresh button functional on status screen
- [ ] Loading/error states show custom header
- [ ] StatusBar still showing correctly

---

## Next Steps

### Immediate

1. Test navigation flow across all screens
2. Verify SafeAreaView handling on different devices
3. Check iOS notch/Dynamic Island compatibility

### Future Enhancements

1. Add CustomHeader component for more complex headers
2. Create header presets (e.g., with search, with filters)
3. Add slide-in animation for header
4. Support for header shadows/elevation
5. Dark mode support for header

---

## Technical Notes

- **Stack.Screen options**: Set `headerShown: false` on all screens using custom headers
- **SafeAreaView**: Wrap content to respect device safe areas
- **StatusBar**: Maintained translucent StatusBar from \_layout.tsx
- **Navigation**: Uses expo-router's useRouter() hook for navigation
- **Type Safety**: Full TypeScript support with proper interfaces

---

## Related Files

- `constants/theme.ts` - Design system colors and typography
- `app/_layout.tsx` - Root navigation configuration
- `app/(tabs)/_layout.tsx` - Tab navigation (already has headerShown: false)

---

**Implementation Time**: ~15 minutes  
**Lines Added**: ~120 lines (48 component + 72 styles)  
**TypeScript Errors**: 0  
**Status**: ✅ Ready for testing
