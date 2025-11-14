/**
 * Theme constants matching Flutter iAyos design
 * Primary color: #54B7EC (Sky Blue)
 * Brand: "iAyos - May sira? May iAyos."
 */

export const Colors = {
  // Primary Brand Colors
  primary: "#54B7EC",
  primaryLight: "#D0EAF8",
  primaryDark: "#3A9FD5",

  // Status Colors
  success: "#4CAF50",
  warning: "#FFA726",
  error: "#BD0000",

  // Background Colors
  background: "#FFFFFF",
  surface: "#F5F5F5",
  surfaceLight: "#FAFAFA",

  // Text Colors
  textPrimary: "#212121",
  textSecondary: "#757575",
  textHint: "#BDBDBD",

  // Other
  divider: "#E0E0E0",
  border: "#E0E0E0",
  white: "#FFFFFF",
  black: "#000000",

  // Legacy support for existing code
  light: {
    text: "#212121",
    background: "#FFFFFF",
    tint: "#54B7EC",
    icon: "#757575",
    tabIconDefault: "#757575",
    tabIconSelected: "#54B7EC",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#54B7EC",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#54B7EC",
  },
};

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },

  // Font Weights
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
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
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  pill: 25,
  circle: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};
