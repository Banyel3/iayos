# iAyos Mobile UI Components - Quick Reference Guide

**Last Updated:** November 16, 2025

This directory contains production-ready UI components that match the Next.js web app design system.

---

## Available Components

1. **Button** - Interactive button with variants and states
2. **Input** - Text input with labels, icons, and validation
3. **Card** - Container component with variants
4. **Badge** - Status indicator badges

---

## Button Component

**File:** `components/ui/Button.tsx`

### Basic Usage

```tsx
import Button from '@/components/ui/Button';

<Button onPress={handleSubmit}>
  Submit
</Button>
```

### Variants

```tsx
// Primary (default) - Blue background, white text
<Button variant="primary" onPress={handleSubmit}>
  Submit
</Button>

// Secondary - Gray background, dark text
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Outline - Transparent background, blue border
<Button variant="outline" onPress={handleEdit}>
  Edit
</Button>

// Ghost - Transparent background, no border
<Button variant="ghost" onPress={handleView}>
  View Details
</Button>

// Danger - Red background, white text
<Button variant="danger" onPress={handleDelete}>
  Delete
</Button>
```

### Sizes

```tsx
// Small (40px height)
<Button size="sm" onPress={handleAction}>
  Small
</Button>

// Medium (48px height) - DEFAULT
<Button size="md" onPress={handleAction}>
  Medium
</Button>

// Large (56px height)
<Button size="lg" onPress={handleAction}>
  Large
</Button>
```

### With Icons

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

// Icon on the left
<Button
  variant="primary"
  iconLeft={<Ionicons name="add" size={20} color={Colors.white} />}
  onPress={handleAdd}
>
  Add Item
</Button>

// Icon on the right
<Button
  variant="primary"
  iconRight={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
  onPress={handleContinue}
>
  Continue
</Button>
```

### Loading State

```tsx
<Button
  variant="primary"
  loading={isLoading}
  disabled={isLoading}
  onPress={handleSubmit}
>
  Submit
</Button>
```

### Full Width

```tsx
<Button
  variant="primary"
  fullWidth
  onPress={handleSubmit}
>
  Submit
</Button>
```

### All Props

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  hapticFeedback?: boolean; // Default: true
  style?: ViewStyle;
  textStyle?: TextStyle;
}
```

---

## Input Component

**File:** `components/ui/Input.tsx`

### Basic Usage

```tsx
import Input from '@/components/ui/Input';

<Input
  placeholder="Enter text"
  value={text}
  onChangeText={setText}
/>
```

### With Label

```tsx
<Input
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

### Required Field

```tsx
<Input
  label="Email Address"
  required
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

### With Icon

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

<Input
  label="Email Address"
  iconLeft={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

### Password Input (Auto-Toggle)

```tsx
<Input
  label="Password"
  isPassword
  placeholder="Enter your password"
  value={password}
  onChangeText={setPassword}
/>
```

### With Validation

```tsx
<Input
  label="Email Address"
  required
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  touched={touched.email}
/>
```

### Different Input Types

```tsx
// Email
<Input
  label="Email"
  keyboardType="email-address"
  autoCapitalize="none"
  value={email}
  onChangeText={setEmail}
/>

// Phone
<Input
  label="Phone Number"
  keyboardType="phone-pad"
  value={phone}
  onChangeText={setPhone}
/>

// Number
<Input
  label="Amount"
  keyboardType="numeric"
  value={amount}
  onChangeText={setAmount}
/>
```

### All Props

```typescript
interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
  touched?: boolean;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}
```

---

## Card Component

**File:** `components/ui/Card.tsx`

### Basic Usage

```tsx
import Card from '@/components/ui/Card';

<Card>
  <Text>Card content</Text>
</Card>
```

### Variants

```tsx
// Default - White background with shadow
<Card variant="default">
  <Text>Default card</Text>
</Card>

// Outlined - White background with border, no shadow
<Card variant="outlined">
  <Text>Outlined card</Text>
</Card>

// Elevated - White background with large shadow
<Card variant="elevated">
  <Text>Elevated card</Text>
</Card>
```

### Pressable Card

```tsx
<Card
  variant="default"
  onPress={() => router.push('/details')}
  pressable
>
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>Settings</Text>
    <Ionicons name="chevron-forward" size={24} color={Colors.textHint} />
  </View>
</Card>
```

### Menu Item Pattern

```tsx
<Card
  variant="outlined"
  onPress={() => router.push('/settings')}
  pressable
  style={{ marginBottom: 12 }}
>
  <View style={styles.menuItem}>
    <Ionicons name="settings-outline" size={24} color={Colors.primary} />
    <Text style={styles.menuText}>Settings</Text>
    <Ionicons name="chevron-forward" size={24} color={Colors.textHint} />
  </View>
</Card>

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
```

### Stats Card Pattern

```tsx
<Card variant="elevated">
  <Ionicons name="briefcase" size={32} color={Colors.primary} />
  <Text style={styles.statValue}>12</Text>
  <Text style={styles.statLabel}>Active Jobs</Text>
</Card>

const styles = StyleSheet.create({
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
```

### All Props

```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  onPress?: () => void;
  pressable?: boolean;
  style?: ViewStyle;
  hapticFeedback?: boolean; // Default: true
}
```

---

## Badge Component

**File:** `components/ui/Badge.tsx`

### Basic Usage

```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="info">Info</Badge>
```

### Status Variants

```tsx
// Active - Blue
<Badge variant="active">ACTIVE</Badge>

// In Progress - Amber/Orange
<Badge variant="in_progress">IN PROGRESS</Badge>

// Completed/Success - Green
<Badge variant="completed">COMPLETED</Badge>
<Badge variant="success">SUCCESS</Badge>

// Cancelled/Rejected/Error - Red
<Badge variant="cancelled">CANCELLED</Badge>
<Badge variant="rejected">REJECTED</Badge>
<Badge variant="error">ERROR</Badge>

// Pending - Gray
<Badge variant="pending">PENDING</Badge>

// Warning - Amber/Orange
<Badge variant="warning">WARNING</Badge>

// Info - Blue (default)
<Badge variant="info">INFO</Badge>
```

### Sizes

```tsx
// Small
<Badge variant="active" size="sm">Active</Badge>

// Medium (default)
<Badge variant="active" size="md">Active</Badge>

// Large
<Badge variant="active" size="lg">Active</Badge>
```

### Usage in Job Cards

```tsx
// Category badge
<Badge variant="info" size="sm">
  {job.category}
</Badge>

// Status badge
<Badge variant={job.status}>
  {job.status.replace('_', ' ').toUpperCase()}
</Badge>
```

### All Props

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'pending' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}
```

---

## Common Patterns

### Login/Register Form

```tsx
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View>
      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        iconLeft={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        isPassword
        iconLeft={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        onPress={handleLogin}
      >
        Login
      </Button>
    </View>
  );
}
```

### Profile Menu

```tsx
import Card from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

function ProfileMenu() {
  const menuItems = [
    { title: 'Edit Profile', icon: 'person-outline', route: '/profile/edit' },
    { title: 'Settings', icon: 'settings-outline', route: '/settings' },
    { title: 'Help & Support', icon: 'help-circle-outline', route: '/support' },
  ];

  return (
    <View>
      {menuItems.map((item, index) => (
        <Card
          key={index}
          variant="outlined"
          onPress={() => router.push(item.route)}
          pressable
          style={{ marginBottom: 12 }}
        >
          <View style={styles.menuItem}>
            <Ionicons name={item.icon} size={24} color={Colors.primary} />
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textHint} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
```

### Status Display

```tsx
import Badge from '@/components/ui/Badge';

function JobStatus({ status }) {
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusLabel}>Status:</Text>
      <Badge variant={status}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    </View>
  );
}
```

---

## Best Practices

### 1. Always Use Theme Constants

```tsx
// ✅ GOOD
import { Colors, Typography, Spacing } from '@/constants/theme';

<Text style={{ color: Colors.textPrimary, fontSize: Typography.fontSize.lg }}>
  Hello
</Text>

// ❌ BAD
<Text style={{ color: '#212121', fontSize: 18 }}>
  Hello
</Text>
```

### 2. Use Consistent Spacing

```tsx
// ✅ GOOD
<View style={{ padding: Spacing.lg, marginBottom: Spacing.md }}>
  ...
</View>

// ❌ BAD
<View style={{ padding: 16, marginBottom: 12 }}>
  ...
</View>
```

### 3. Haptic Feedback

```tsx
// Haptic feedback is automatic in Button and Card components
// No need to add manual haptics

// ✅ GOOD
<Button onPress={handlePress}>Press Me</Button>

// ❌ BAD (redundant)
<Button onPress={() => {
  Haptics.impactAsync();
  handlePress();
}}>
  Press Me
</Button>
```

### 4. Loading States

```tsx
// ✅ GOOD
<Button loading={isLoading} disabled={isLoading} onPress={handleSubmit}>
  Submit
</Button>

// ❌ BAD
{isLoading ? (
  <ActivityIndicator />
) : (
  <Button onPress={handleSubmit}>Submit</Button>
)}
```

### 5. Form Validation

```tsx
// ✅ GOOD
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  touched={touched.email}
/>

// ❌ BAD
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
/>
{errors.email && <Text style={{ color: 'red' }}>{errors.email}</Text>}
```

---

## TypeScript Tips

### Import Types

```tsx
import { ViewStyle, TextStyle } from 'react-native';
import type { ButtonProps } from '@/components/ui/Button';
```

### Extend Component Props

```tsx
interface MyFormProps {
  onSubmit: () => void;
  buttonVariant?: ButtonProps['variant'];
}
```

---

## Troubleshooting

### Component Not Found Error

```bash
# Make sure you're using the correct import path
import Button from '@/components/ui/Button';

# If @/ doesn't work, use relative path
import Button from '../components/ui/Button';
```

### Haptic Feedback Not Working

```bash
# Make sure expo-haptics is installed
npx expo install expo-haptics

# Test on real device (simulator doesn't support haptics)
```

### Icons Not Showing

```bash
# Make sure @expo/vector-icons is installed
npx expo install @expo/vector-icons

# Import Ionicons
import { Ionicons } from '@expo/vector-icons';
```

### Theme Constants Not Found

```bash
# Check if theme.ts exists
# Path: constants/theme.ts

# Import correctly
import { Colors, Typography, Spacing } from '@/constants/theme';
```

---

## Need Help?

- Check the progress document: `docs/02-in-progress/MOBILE_UI_REDESIGN_NEXTJS_MATCH_PROGRESS.md`
- Look at completed screens: `app/auth/login.tsx`, `app/auth/register.tsx`
- Look at JobCard component: `components/JobCard.tsx`
- Refer to Next.js screenshots for design reference

---

**Happy Coding! 🚀**
