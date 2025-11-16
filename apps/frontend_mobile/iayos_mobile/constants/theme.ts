/**
 * iAyos Mobile App - Design System
 * Updated to match Next.js web app design (November 2025)
 *
 * Primary color: #3B82F6 (blue-600) - matching Next.js
 * Brand: "iAyos - May sira? May iAyos."
 *
 * Changes from previous version:
 * - Primary color changed from #54B7EC (sky blue) to #3B82F6 (blue-600)
 * - Typography fontSize increased by 1-2px to match Next.js
 * - Border radius values adjusted to match Next.js (6-10px range)
 * - Enhanced shadow system with more variants
 * - Added focus ring colors
 * - Added typography presets for common patterns
 */

import { Platform } from "react-native";

export const Colors = {
  // Primary Brand Colors (matching Next.js oklch(66.98% 0.124 242.37))
  primary: "#3B82F6", // blue-600 (UPDATED from #54B7EC)
  primaryLight: "#DBEAFE", // blue-100 (UPDATED from #D0EAF8)
  primaryDark: "#2563EB", // blue-700 (UPDATED from #3A9FD5)
  primaryHover: "#1D4ED8", // blue-800 (NEW)

  // Status Colors (updated to match Tailwind/Next.js)
  success: "#10B981", // green-500 (UPDATED from #4CAF50)
  successLight: "#D1FAE5", // green-100 (UPDATED from #E8F5E9)
  warning: "#F59E0B", // amber-500 (UPDATED from #FFA726)
  warningLight: "#FEF3C7", // amber-100 (UPDATED from #FFF3E0)
  error: "#EF4444", // red-500 (UPDATED from #BD0000)
  errorLight: "#FEE2E2", // red-100 (UPDATED from #FFEBEE)
  info: "#3B82F6", // blue-500 (NEW)
  infoLight: "#DBEAFE", // blue-100 (NEW)

  // Background Colors (kept - already matching)
  background: "#FFFFFF", // white
  backgroundSecondary: "#F5F5F5", // gray-50
  surface: "#F9FAFB", // gray-50 (slightly updated)
  surfaceLight: "#FAFAFA", // gray-50

  // Text Colors (kept - already matching)
  textPrimary: "#212121", // gray-900
  textSecondary: "#757575", // gray-600
  textHint: "#9CA3AF", // gray-400 (UPDATED from #BDBDBD)
  textLight: "#FFFFFF", // white

  // Borders (updated to match Next.js)
  border: "#E5E7EB", // gray-200 (UPDATED from #E0E0E0)
  borderLight: "#F3F4F6", // gray-100 (NEW)
  borderDark: "#D1D5DB", // gray-300 (NEW)
  divider: "#E5E7EB", // gray-200 (UPDATED from #E0E0E0)

  // Focus Ring (NEW - for input focus states)
  ring: "#93C5FD", // blue-300 (for 20% opacity overlay)
  ringDark: "#60A5FA", // blue-400

  // Base Colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Legacy support for existing code (will be deprecated)
  light: {
    text: "#212121",
    background: "#FFFFFF",
    tint: "#3B82F6", // UPDATED to new primary
    icon: "#757575",
    tabIconDefault: "#757575",
    tabIconSelected: "#3B82F6", // UPDATED to new primary
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#3B82F6", // UPDATED to new primary
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#3B82F6", // UPDATED to new primary
  },
};

export const Typography = {
  // Font Sizes (updated to match Next.js Tailwind scale)
  fontSize: {
    xs: 12, // 0.75rem - Captions, small text (UPDATED from 11)
    sm: 14, // 0.875rem - Body small, labels (UPDATED from 12)
    base: 16, // 1rem - Base body text (UPDATED from 14)
    lg: 18, // 1.125rem - Large body, emphasis (UPDATED from 16)
    xl: 20, // 1.25rem - H4 headings (kept)
    "2xl": 24, // 1.5rem - H3 headings (kept)
    "3xl": 30, // 1.875rem - H2 headings (UPDATED from 28)
    "4xl": 36, // 2.25rem - H1 headings (UPDATED from 32)
    "5xl": 48, // 3rem - Display headings (NEW)
  },

  // Font Weights (kept - already good)
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const, // NEW
  },

  // Line Heights (NEW - for better readability)
  lineHeight: {
    tight: 1.25, // Headings
    normal: 1.5, // Body text
    relaxed: 1.75, // Large text
  },

  // Headings (updated)
  heading: {
    h1: {
      fontSize: 36, // UPDATED from 32
      fontWeight: "700" as const,
      lineHeight: 44, // UPDATED from 40
    },
    h2: {
      fontSize: 30, // UPDATED from 28
      fontWeight: "700" as const,
      lineHeight: 38, // UPDATED from 36
    },
    h3: {
      fontSize: 24, // UPDATED from 20
      fontWeight: "600" as const,
      lineHeight: 32, // UPDATED from 28
    },
    h4: {
      fontSize: 20, // UPDATED from 18
      fontWeight: "600" as const,
      lineHeight: 28, // UPDATED from 24
    },
  },

  // Body Text (updated)
  body: {
    large: {
      fontSize: 18, // UPDATED from 16
      fontWeight: "400" as const,
      lineHeight: 28, // UPDATED from 24
    },
    medium: {
      fontSize: 16, // UPDATED from 14
      fontWeight: "400" as const,
      lineHeight: 24, // UPDATED from 20
    },
    small: {
      fontSize: 14, // UPDATED from 12
      fontWeight: "400" as const,
      lineHeight: 20, // UPDATED from 16
    },
  },

  // Caption
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
};

// Font Family (Inter if available, fallback to system)
// Note: To use Inter, install: npx expo install expo-font @expo-google-fonts/inter
Typography.fontFamily = {
  regular: "Inter_400Regular", // Or "System" if Inter not loaded
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  // Fallback to system fonts
  system: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "System",
  }),
};

// Typography Presets (NEW - for common patterns matching Next.js)
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

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  "5xl": 40,
  "6xl": 48, // NEW
  "7xl": 56, // NEW
  "8xl": 64, // NEW
};

// Component-Specific Spacing (NEW)
Spacing.container = {
  horizontal: 16, // Default horizontal padding for screens
  vertical: 20, // Default vertical padding
};

Spacing.card = {
  padding: 16, // Card internal padding
  gap: 12, // Gap between card elements
};

Spacing.form = {
  fieldGap: 16, // Gap between form fields
  sectionGap: 24, // Gap between form sections
};

Spacing.list = {
  itemGap: 8, // Gap between list items
  sectionGap: 16, // Gap between list sections
};

export const BorderRadius = {
  none: 0, // NEW
  xs: 4, // NEW - Tiny corners
  sm: 6, // Small (UPDATED from 8)
  small: 6, // Alias (UPDATED from 8)
  md: 8, // Medium (UPDATED from 12) - standard for inputs, buttons
  medium: 8, // Alias (UPDATED from 12)
  lg: 10, // Large (UPDATED from 16) - standard for cards
  large: 10, // Alias (UPDATED from 16)
  xl: 14, // Extra large (UPDATED from 20)
  "2xl": 16, // Larger cards (UPDATED from 24)
  "3xl": 24, // Very large containers (NEW)
  pill: 999, // Pill-shaped
  full: 9999, // Fully rounded
  circle: 9999, // Alias for full
};

// Component-specific radius (NEW)
BorderRadius.components = {
  button: BorderRadius.md, // 8px for buttons
  input: BorderRadius.md, // 8px for inputs
  card: BorderRadius.lg, // 10px for cards
  cardLarge: BorderRadius["2xl"], // 16px for prominent cards
  badge: BorderRadius.full, // Pill-shaped badges
  avatar: BorderRadius.full, // Circular avatars
};

export const Shadows = {
  // No shadow
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Extra small shadow (subtle) - NEW
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
    shadowRadius: 3, // UPDATED from 4
    elevation: 2,
  },
  small: {
    // Alias
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
    shadowOpacity: 0.12, // UPDATED from 0.15
    shadowRadius: 6, // UPDATED from 8
    elevation: 4,
  },
  medium: {
    // Alias
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
    shadowOpacity: 0.15, // UPDATED from 0.2
    shadowRadius: 12, // UPDATED from 16
    elevation: 8,
  },

  // Extra large shadow (modals, bottom sheets) - NEW
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
    shadowOpacity: 0.25, // UPDATED from 0.3
    shadowRadius: 8, // UPDATED from 10
    elevation: 6,
  },

  // Focus ring (for inputs) - NEW
  focus: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 0, // Don't elevate, just add ring
  },
};

// Export all constants
export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
