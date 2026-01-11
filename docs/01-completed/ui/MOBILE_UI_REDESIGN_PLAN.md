# Mobile UI Redesign Plan - Comprehensive Specification

**Created**: November 16, 2025
**Purpose**: Complete UI redesign of React Native mobile app to match Next.js web design while enhancing for native mobile
**Estimated Duration**: 60-80 hours
**Priority**: HIGH

---

## Executive Summary

This document outlines a comprehensive redesign of the iAyos React Native mobile application UI to align with the Next.js web application's modern, clean design system. The redesign will maintain brand consistency across platforms while leveraging native mobile advantages like haptic feedback, gestures, and smooth animations.

### Goals:
1. **Visual Consistency**: Match Next.js web app color scheme, typography, and component styling
2. **Native Enhancement**: Add mobile-specific features (haptics, gestures, animations)
3. **Better UX**: Improve usability with larger tap targets, better spacing, clearer hierarchy
4. **Accessibility**: Ensure proper contrast ratios, touch targets (44x44pt minimum)
5. **Performance**: Maintain 60fps animations and smooth scrolling

---

## Part 1: Design System Alignment

### 1.1 Color Palette Update

**Current Mobile Colors** (to be replaced):
```typescript
primary: "#54B7EC" // Sky blue - too light
primaryLight: "#D0EAF8"
primaryDark: "#3A9FD5"
```

**New Colors** (from Next.js):
```typescript
// Primary Brand Colors
primary: "#3B82F6"        // blue-600 (matching Next.js oklch(66.98% 0.124 242.37))
primaryLight: "#DBEAFE"   // blue-100
primaryDark: "#2563EB"    // blue-700
primaryHover: "#1D4ED8"   // blue-800

// Background Colors (KEEP - already matching)
background: "#FFFFFF"
backgroundSecondary: "#F5F5F5"  // gray-50
surface: "#F9FAFB"              // gray-50
surfaceLight: "#FAFAFA"

// Text Colors (KEEP - already matching)
textPrimary: "#212121"    // gray-900
textSecondary: "#757575"  // gray-600
textHint: "#9CA3AF"       // gray-400 (slightly updated)
textLight: "#FFFFFF"

// Status Colors
success: "#10B981"        // green-500 (updated from #4CAF50)
successLight: "#D1FAE5"   // green-100
warning: "#F59E0B"        // amber-500 (updated from #FFA726)
warningLight: "#FEF3C7"   // amber-100
error: "#EF4444"          // red-500 (updated from #BD0000)
errorLight: "#FEE2E2"     // red-100
info: "#3B82F6"           // blue-500
infoLight: "#DBEAFE"      // blue-100

// Borders
border: "#E5E7EB"         // gray-200
borderLight: "#F3F4F6"    // gray-100
borderDark: "#D1D5DB"     // gray-300

// Focus Ring
ring: "#93C5FD"           // blue-300 (20% opacity overlay)
ringDark: "#60A5FA"       // blue-400

// Divider
divider: "#E5E7EB"        // gray-200

// White/Black (KEEP)
white: "#FFFFFF"
black: "#000000"
```

**Color Usage Guidelines:**
- **Primary**: Buttons, links, active states, branding
- **Text Primary**: Headings, important text
- **Text Secondary**: Body text, descriptions
- **Text Hint**: Placeholders, disabled text
- **Success**: Completed states, positive actions
- **Warning**: Warnings, pending states
- **Error**: Errors, destructive actions
- **Surface**: Card backgrounds, elevated elements

---

### 1.2 Typography Scale Update

**Current Mobile Typography** (fontSize too small):
```typescript
xs: 11    // Next.js: 12
sm: 12    // Next.js: 14
md: 13    // Next.js: 14
base: 14  // Next.js: 16
lg: 16    // Next.js: 18
xl: 20    // Next.js: 20
xxl: 22   // Next.js: 24
```

**New Typography Scale** (matching Next.js):
```typescript
export const Typography = {
  // Font Sizes (matching Tailwind/Next.js scale)
  fontSize: {
    xs: 12,      // 0.75rem - Captions, small text
    sm: 14,      // 0.875rem - Body small, labels
    base: 16,    // 1rem - Base body text
    lg: 18,      // 1.125rem - Large body, emphasis
    xl: 20,      // 1.25rem - H4 headings
    "2xl": 24,   // 1.5rem - H3 headings
    "3xl": 30,   // 1.875rem - H2 headings
    "4xl": 36,   // 2.25rem - H1 headings
    "5xl": 48,   // 3rem - Display headings
  },

  // Font Weights (KEEP - already good)
  fontWeight: {
    normal: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },

  // Line Heights (NEW - for better readability)
  lineHeight: {
    tight: 1.25,    // Headings
    normal: 1.5,    // Body text
    relaxed: 1.75,  // Large text
  },

  // Font Family (use Inter if available, fallback to system)
  fontFamily: {
    regular: "Inter_400Regular",  // If loaded via expo-google-fonts
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    // Fallback to system
    system: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
};
```

**Typography Presets** (for common patterns):
```typescript
// Add to theme.ts for easy reuse
Typography.presets = {
  // Headings
  h1: {
    fontSize: Typography.fontSize["4xl"],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 44,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 38,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: 28,
    color: Colors.textPrimary,
  },

  // Body
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 16,
    color: Colors.textHint,
  },

  // Buttons
  button: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: 24,
  },
  buttonLarge: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: 28,
  },

  // Labels
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
};
```

---

### 1.3 Spacing System

**Current Spacing** (KEEP - already matches Next.js):
```typescript
xs: 4
sm: 8
md: 12
lg: 16
xl: 20
"2xl": 24
"3xl": 28
"4xl": 32
"5xl": 40
```

**Add Component-Specific Spacing**:
```typescript
Spacing.container = {
  horizontal: 16,   // Default horizontal padding for screens
  vertical: 20,     // Default vertical padding
};

Spacing.card = {
  padding: 16,      // Card internal padding
  gap: 12,          // Gap between card elements
};

Spacing.form = {
  fieldGap: 16,     // Gap between form fields
  sectionGap: 24,   // Gap between form sections
};

Spacing.list = {
  itemGap: 8,       // Gap between list items
  sectionGap: 16,   // Gap between list sections
};
```

---

### 1.4 Border Radius System

**Current Border Radius**:
```typescript
sm: 8, md: 12, lg: 16, xl: 20
```

**Updated Border Radius** (matching Next.js):
```typescript
export const BorderRadius = {
  none: 0,
  xs: 4,           // NEW - Tiny corners
  sm: 6,           // Reduced from 8
  md: 8,           // Reduced from 12 (standard for inputs, buttons)
  lg: 10,          // Reduced from 16 (standard for cards)
  xl: 14,          // Reduced from 20
  "2xl": 16,       // Larger cards
  "3xl": 24,       // Very large containers
  full: 9999,      // Pills, circular
};

// Component-specific radius
BorderRadius.components = {
  button: BorderRadius.md,      // 8px for buttons
  input: BorderRadius.md,       // 8px for inputs
  card: BorderRadius.lg,        // 10px for cards
  cardLarge: BorderRadius["2xl"], // 16px for prominent cards
  badge: BorderRadius.full,     // Pill-shaped badges
  avatar: BorderRadius.full,    // Circular avatars
};
```

---

### 1.5 Shadow/Elevation System

**Current Shadows** (need enhancement):
```typescript
small: { elevation: 2, shadowOpacity: 0.1 }
medium: { elevation: 4, shadowOpacity: 0.15 }
```

**New Shadow System** (matching Next.js + Native):
```typescript
export const Shadows = {
  // No shadow
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Extra small shadow (subtle)
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Small shadow (buttons, small cards)
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Medium shadow (cards, modals)
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Large shadow (prominent cards, drawers)
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  // Extra large shadow (modals, bottom sheets)
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },

  // Primary-colored shadow (for buttons, key actions)
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  // Focus ring (for inputs)
  focus: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 0,
  },
};
```

---

## Part 2: Component-Level Redesign

### 2.1 Button Component

**File**: `components/ui/Button.tsx`

**Variants**:
1. **Primary**: Blue background, white text (default)
2. **Secondary**: Gray background, dark text
3. **Outline**: Transparent background, border, colored text
4. **Ghost**: Transparent background, no border, colored text
5. **Danger**: Red background, white text

**Sizes**:
1. **Small**: Height 36px, padding 8px 12px, fontSize 14px
2. **Medium**: Height 44px, padding 10px 16px, fontSize 16px (default)
3. **Large**: Height 52px, padding 12px 20px, fontSize 18px

**States**:
- Default
- Pressed (darker shade)
- Disabled (opacity 0.5)
- Loading (spinner + text)

**Implementation**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean; // Enable haptic feedback
}

// Usage:
<Button variant="primary" size="large" onPress={handleSubmit} haptic>
  Sign In
</Button>
```

---

### 2.2 Input Component

**File**: `components/ui/Input.tsx`

**Features**:
- Label (optional)
- Placeholder
- Helper text (optional)
- Error message (optional)
- Left icon (optional)
- Right icon (optional, e.g., eye for password)
- Character counter (optional)

**States**:
- Default
- Focused (blue border + ring shadow)
- Error (red border + error message)
- Disabled (gray background, lower opacity)

**Implementation**:
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  showCharacterCount?: boolean;
  required?: boolean;
  disabled?: boolean;
}

// Usage:
<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
  required
  error={errors.email}
/>
```

---

### 2.3 Card Component

**File**: `components/ui/Card.tsx`

**Variants**:
1. **Default**: White background, subtle shadow
2. **Elevated**: Larger shadow
3. **Outlined**: Border instead of shadow
4. **Flat**: No shadow, no border

**Implementation**:
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Usage:
<Card variant="elevated" onPress={handleCardPress}>
  <Text>Card content</Text>
</Card>
```

---

### 2.4 Badge Component

**File**: `components/ui/Badge.tsx`

**Variants**:
1. **Success**: Green
2. **Warning**: Amber/Orange
3. **Error**: Red
4. **Info**: Blue
5. **Neutral**: Gray

**Sizes**:
- Small, Medium, Large

**Implementation**:
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

// Usage:
<Badge variant="success" size="small">Active</Badge>
```

---

### 2.5 Other Components to Create

1. **Label Component** (`components/ui/Label.tsx`)
   - Consistent form labels
   - Required asterisk support
   - Helper text

2. **Divider Component** (`components/ui/Divider.tsx`)
   - Horizontal/vertical
   - With text (e.g., "or")

3. **Skeleton Component** (`components/ui/Skeleton.tsx`)
   - Loading placeholders
   - Animated shimmer effect

4. **Toast Component** (`components/ui/Toast.tsx`)
   - Success, error, info toasts
   - Auto-dismiss
   - Swipe to dismiss

---

## Part 3: Screen-by-Screen Redesign

### 3.1 Authentication Screens (PRIORITY 1)

#### Login Screen (`app/auth/login.tsx`)

**Current Issues**:
- Gradient header (inconsistent with web)
- Button too tall (50px vs 44px)
- Font sizes too small
- Primary color too light

**Redesign Goals**:
```
Layout:
┌─────────────────────────────────┐
│                                 │
│        (Safe Area Top)          │
│                                 │
│      ┌──────────────┐           │
│      │  Welcome back │           │
│      │ Sign in to    │           │
│      │  continue     │           │
│      └──────────────┘           │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email *                   │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ 📧 [email input]      │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ Password *                │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ 🔒 [password input] 👁 │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │        Forgot password? → │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │     Sign In (Blue)    │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ ─────────  or  ────────── │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ G  Continue with Google│ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │ Don't have an account?    │  │
│  │      Sign up →            │  │
│  └───────────────────────────┘  │
│                                 │
│        (Safe Area Bottom)       │
└─────────────────────────────────┘
```

**Implementation Checklist**:
- [ ] Remove gradient header
- [ ] White background with subtle gray for screen
- [ ] Clean card container (rounded-2xl, shadow-lg)
- [ ] Update typography (h1: 24px, labels: 14px, inputs: 16px)
- [ ] Update primary color to #3B82F6
- [ ] Reduce button height to 48px
- [ ] Add focus ring to inputs (blue shadow)
- [ ] Add haptic feedback to button press
- [ ] Match spacing (16px horizontal padding, 24px between sections)
- [ ] Add smooth transitions for input focus states

---

#### Register Screen (`app/auth/register.tsx`)

**Current Issues**:
- Same as login (gradient header, colors, sizes)
- Long form needs better visual grouping
- Scrolling UX could be improved

**Redesign Goals**:
- Match login screen design
- Group fields logically (Personal Info, Address Info)
- Add section headers (h3, 18px, semibold)
- Add progress indicator (optional)
- Better password strength indicator

**Implementation Checklist**:
- [ ] Remove gradient header
- [ ] Add section headers ("Personal Information", "Address")
- [ ] Group fields visually (spacing)
- [ ] Update all colors, typography, button sizes
- [ ] Add password strength meter
- [ ] Add date picker (native)
- [ ] Improve scrolling with KeyboardAwareScrollView
- [ ] Add haptic feedback

---

### 3.2 Job Browsing Screens (PRIORITY 2)

#### Browse Jobs Screen (`app/(tabs)/index.tsx`)

**Current Issues**:
- Job cards need redesign to match web aesthetic
- Category chips need refinement
- Search bar styling outdated

**Redesign Goals**:
```
Layout:
┌─────────────────────────────────┐
│  🔍 Search for jobs...     🔔   │ Search bar + notification
│                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │ Category chips (horizontal scroll)
│  │All│ │Plum│ │Elec│ │Carp│       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Plumbing Service Needed   │  │ Job card
│  │ ₱500-750 · Zamboanga      │  │
│  │ Posted 2 hours ago        │  │
│  │ 💼 5 applicants           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Electrical Repair         │  │
│  │ ₱1,200 · Cebu City        │  │
│  │ Posted 1 day ago          │  │
│  │ 💼 3 applicants  🔥 URGENT │  │
│  └───────────────────────────┘  │
│                                 │
│  (Pull to refresh)              │
└─────────────────────────────────┘
```

**Job Card Redesign**:
- White background
- Border radius: 12px
- Shadow: medium
- Padding: 16px
- Gap between elements: 8px
- Title: fontSize 18px, fontWeight 600
- Metadata: fontSize 14px, fontWeight 400, color gray-600
- Badge for urgency: red badge, "URGENT"
- Hover/press: scale 0.98, haptic feedback

**Implementation Checklist**:
- [ ] Redesign search bar (rounded-full, shadow-sm)
- [ ] Update category chips (rounded-full, better colors)
- [ ] Redesign job cards (layout, typography, spacing, shadows)
- [ ] Add pull-to-refresh with custom spinner
- [ ] Add loading skeleton for cards
- [ ] Add empty state illustration
- [ ] Add haptic feedback on card press
- [ ] Smooth scroll animations

---

#### Job Details Screen (`app/jobs/[id].tsx`)

**Redesign Goals**:
- Hero section with job title and key info
- Clear sections (Description, Budget, Timeline, Requirements)
- Prominent apply button (sticky bottom)
- Better image gallery
- Client info card

**Implementation Checklist**:
- [ ] Hero section with gradient background
- [ ] Section headers with icons
- [ ] Info cards for budget, timeline, location
- [ ] Better typography hierarchy
- [ ] Sticky apply button at bottom with safe area
- [ ] Image carousel with dots indicator
- [ ] Client avatar and rating
- [ ] Add haptic feedback

---

### 3.3 Profile Screens (PRIORITY 3)

#### Profile Screen (`app/(tabs)/profile.tsx`)

**Redesign Goals**:
```
Layout:
┌─────────────────────────────────┐
│  ┌─────────────────────────────┐ │ Header (gradient or image)
│  │                             │ │
│  │       ┌──────┐              │ │
│  │       │Avatar│              │ │
│  │       └──────┘              │ │
│  │     John Worker             │ │
│  │   ⭐ 4.8 (23 reviews)       │ │
│  └─────────────────────────────┘ │
│                                 │
│  Profile Completion: 85% ━━━━░  │ Progress bar
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📝 Edit Profile      →    │  │ Quick actions
│  │ 📜 Certifications    →    │  │
│  │ 📸 Portfolio         →    │  │
│  │ 🛠️  Materials        →    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 💰 Earnings Overview      │  │ Stats card
│  │   Total Earned: ₱45,230   │  │
│  │   This Month: ₱12,500     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ⚙️ Settings          →    │  │ Settings section
│  │ 🔔 Notifications     →    │  │
│  │ 🚪 Log Out                │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Implementation Checklist**:
- [ ] Profile header with gradient/image background
- [ ] Avatar with edit button overlay
- [ ] Completion progress bar with animation
- [ ] Menu items with icons (consistent spacing)
- [ ] Stats cards with better visuals
- [ ] Pull-to-refresh to update data
- [ ] Smooth transitions between screens

---

### 3.4 Payment/Wallet Screens (PRIORITY 4)

#### Wallet Screen (`app/payments/wallet.tsx`)

**Redesign Goals**:
- Large balance card (hero)
- Quick action buttons (Deposit, Withdraw)
- Transaction history list
- Better visual hierarchy

**Implementation Checklist**:
- [ ] Hero balance card with gradient
- [ ] Action buttons (icon + text)
- [ ] Transaction list items (icon, title, amount, date)
- [ ] Pull-to-refresh
- [ ] Loading skeleton
- [ ] Empty state

---

#### Payment Method Screen (`app/payments/method.tsx`)

**Redesign Goals**:
- Payment method cards (GCash, Cash)
- Visual selection state
- Better icons and branding

**Implementation Checklist**:
- [ ] Payment method cards (bordered, selectable)
- [ ] Check mark for selected method
- [ ] Brand logos (GCash logo)
- [ ] Smooth selection animation
- [ ] Haptic feedback on selection

---

### 3.5 Messaging Screens (PRIORITY 5)

#### Messages List (`app/(tabs)/messages.tsx`)

**Redesign Goals**:
- Conversation cards with avatar, name, preview, timestamp
- Unread indicator (blue dot + badge count)
- Better typography and spacing

**Implementation Checklist**:
- [ ] Conversation cards redesign
- [ ] Avatar with online status indicator
- [ ] Unread badge
- [ ] Timestamp formatting (relative)
- [ ] Swipe to delete/archive
- [ ] Empty state

---

#### Chat Screen (`app/messages/[id].tsx`)

**Redesign Goals**:
- Clean chat bubbles (rounded corners, shadows)
- Better message grouping
- Typing indicator
- Image previews
- Input field with better styling

**Implementation Checklist**:
- [ ] Message bubbles (sender: blue right, receiver: gray left)
- [ ] Avatar for received messages
- [ ] Timestamp between message groups
- [ ] Typing indicator animation
- [ ] Image message with lightbox
- [ ] Input field with send button (icon)
- [ ] Smooth scroll to bottom on new message

---

## Part 4: Native Mobile Enhancements

### 4.1 Haptic Feedback

**Usage**:
- Button presses (light impact)
- Form submissions (medium impact)
- Errors (notification impact)
- Success actions (success notification)
- Toggle switches (selection impact)

**Implementation**:
```typescript
import * as Haptics from 'expo-haptics';

// Button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Form submit
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Success
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

### 4.2 Animations

**Use react-native-reanimated for**:
- Screen transitions
- Card press animations (scale 0.98)
- Pull-to-refresh spinner
- Skeleton loading shimmer
- Bottom sheet slide-up
- Toast slide-in
- Swipe gestures

**Example (Card Press Animation)**:
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const onPressIn = () => {
  scale.value = withSpring(0.98);
};

const onPressOut = () => {
  scale.value = withSpring(1);
};

<Animated.View style={[styles.card, animatedStyle]}>
  <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
    {/* Card content */}
  </TouchableWithoutFeedback>
</Animated.View>
```

---

### 4.3 Gestures

**Swipe Gestures**:
- Swipe back to go to previous screen
- Swipe to delete conversation
- Swipe to archive notification
- Pull-to-refresh on lists

**Implementation** (Swipe to Delete):
```typescript
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <View style={styles.deleteAction}>
      <Text>Delete</Text>
    </View>
  )}
  onSwipeableRightOpen={() => handleDelete(item.id)}
>
  <ConversationCard {...item} />
</Swipeable>
```

---

### 4.4 Pull-to-Refresh

**Implementation**:
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetchData();
  setRefreshing(false);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

<FlatList
  data={data}
  renderItem={renderItem}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary}
      colors={[Colors.primary]}
    />
  }
/>
```

---

### 4.5 Bottom Sheets

**Use for**:
- Filter modals
- Action sheets
- Form modals
- Image picker

**Library**: `@gorhom/bottom-sheet`

**Implementation**:
```typescript
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

<BottomSheet
  snapPoints={['25%', '50%', '90%']}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: Colors.white }}
>
  <BottomSheetView>
    {/* Content */}
  </BottomSheetView>
</BottomSheet>
```

---

### 4.6 Status Bar Styling

**Implementation**:
```typescript
import { StatusBar } from 'expo-status-bar';

// Light screens (dark text)
<StatusBar style="dark" />

// Dark screens (light text)
<StatusBar style="light" />

// Automatic based on theme
<StatusBar style="auto" />
```

---

### 4.7 Safe Area Handling

**Use `react-native-safe-area-context`**:
```typescript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
  {/* Content */}
</View>
```

---

## Part 5: Implementation Timeline

### Week 1: Design System Updates (8-10 hours)
- [ ] Update `constants/theme.ts` (colors, typography, spacing, shadows)
- [ ] Create base UI components (Button, Input, Card, Badge, Label)
- [ ] Test components in isolation
- [ ] Document usage in Storybook or dedicated test screen

### Week 2: Authentication Screens (6-8 hours)
- [ ] Redesign login screen
- [ ] Redesign register screen
- [ ] Test on iOS and Android
- [ ] Compare with Next.js mobile view
- [ ] Fix any discrepancies

### Week 3: Job Browsing (10-12 hours)
- [ ] Redesign browse jobs screen
- [ ] Redesign job details screen
- [ ] Redesign job categories screen
- [ ] Redesign search screen
- [ ] Add animations and haptics

### Week 4: Profile Screens (8-10 hours)
- [ ] Redesign main profile screen
- [ ] Redesign profile edit screen
- [ ] Redesign avatar upload screen
- [ ] Redesign certifications screen
- [ ] Redesign portfolio screen
- [ ] Redesign materials screen

### Week 5: Payment/Wallet (6-8 hours)
- [ ] Redesign wallet screen
- [ ] Redesign payment method screen
- [ ] Redesign deposit screen
- [ ] Redesign transaction history screen
- [ ] Redesign earnings screen

### Week 6: Messaging (6-8 hours)
- [ ] Redesign messages list screen
- [ ] Redesign chat screen
- [ ] Add typing indicator
- [ ] Add image messages
- [ ] Add animations

### Week 7: Polish & Testing (8-10 hours)
- [ ] Fix bugs and inconsistencies
- [ ] Add remaining animations
- [ ] Test on multiple devices (iPhone SE, iPhone 14 Pro Max, various Android)
- [ ] Performance optimization
- [ ] Accessibility testing
- [ ] Final comparison with Next.js

### Week 8: Documentation (4-6 hours)
- [ ] Create before/after screenshots
- [ ] Document all changes
- [ ] Create completion document
- [ ] Update QA checklist
- [ ] Create deployment notes

**Total Estimated Time**: 56-72 hours

---

## Part 6: Success Metrics

### Visual Consistency:
- [ ] Color palette matches Next.js (100%)
- [ ] Typography scales match Next.js
- [ ] Spacing and sizing consistent
- [ ] Component styles align with web

### User Experience:
- [ ] All tap targets ≥ 44x44pt
- [ ] Contrast ratios meet WCAG AA
- [ ] Animations run at 60fps
- [ ] Haptic feedback feels natural
- [ ] Navigation is intuitive

### Performance:
- [ ] No frame drops during animations
- [ ] Smooth scrolling (60fps)
- [ ] Fast screen transitions (< 300ms)
- [ ] Quick app startup (< 2s)

### Code Quality:
- [ ] Reusable components created
- [ ] Theme constants centralized
- [ ] TypeScript types defined
- [ ] No prop drilling (use context when needed)
- [ ] Code follows React Native best practices

---

## Part 7: Risks & Mitigation

### Risk 1: Design Drift from Next.js
**Mitigation**: Regular comparison with Next.js mobile view, side-by-side screenshots

### Risk 2: Performance Issues with Animations
**Mitigation**: Use `react-native-reanimated` (runs on UI thread), test on lower-end devices

### Risk 3: Platform-Specific Rendering Differences
**Mitigation**: Test on both iOS and Android frequently, use platform-specific code when needed

### Risk 4: Breaking Existing Functionality
**Mitigation**: Thorough testing of each screen before moving to next, QA checklist

### Risk 5: Timeline Overrun
**Mitigation**: Prioritize screens, implement core redesigns first, polish later

---

## Part 8: Before/After Comparison

**To be completed during implementation**

Screenshots will be captured for each screen showing:
1. Before (current design)
2. After (new design)
3. Next.js reference (mobile view)

Comparison categories:
- Color palette
- Typography
- Spacing and layout
- Component styling
- Shadows and elevation
- Animations

---

## Appendix A: Color Conversion Reference

**Next.js oklch() to Hex**:
```
oklch(66.98% 0.124 242.37) → #3B82F6 (blue-600)
oklch(1 0 0) → #FFFFFF (white)
oklch(0.97 0 0) → #F5F5F5 (gray-50)
oklch(0.922 0 0) → #E5E7EB (gray-200)
oklch(0.145 0 0) → #212121 (gray-900)
oklch(0.556 0 0) → #757575 (gray-600)
oklch(0.577 0.245 27.325) → #EF4444 (red-500)
```

---

## Appendix B: Inter Font Setup (Optional)

**Install Inter font**:
```bash
npx expo install expo-font @expo-google-fonts/inter
```

**Load fonts**:
```typescript
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const [fontsLoaded] = useFonts({
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
});

if (!fontsLoaded) {
  return <AppLoading />;
}
```

**Use in styles**:
```typescript
fontFamily: 'Inter_400Regular',
```

---

## Appendix C: Useful Resources

- **Tailwind Color Palette**: https://tailwindcss.com/docs/customizing-colors
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/
- **Bottom Sheet**: https://github.com/gorhom/react-native-bottom-sheet
- **Expo Haptics**: https://docs.expo.dev/versions/latest/sdk/haptics/

---

**Document Status**: ✅ COMPLETE
**Next Steps**: Begin implementation with Week 1 tasks
**Approval Required**: Project lead approval before starting implementation
