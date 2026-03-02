/**
 * VerificationBadge - Displays KYC verification level badge
 *
 * Level 0: Nothing rendered (unverified)
 * Level 1: Green checkmark - "ID Verified"
 * Level 2: Blue shield - "Fully Verified"
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/theme";

interface VerificationBadgeProps {
  /** Verification level: 0=unverified, 1=ID verified, 2=fully verified */
  level?: number;
  /** Display mode: 'icon' (icon only), 'badge' (icon+text), 'inline' (compact text) */
  variant?: "icon" | "badge" | "inline";
  /** Icon size (default: 20 for icon, 16 for badge/inline) */
  size?: number;
  /** Additional container style */
  style?: ViewStyle;
}

export function VerificationBadge({
  level = 0,
  variant = "badge",
  size,
  style,
}: VerificationBadgeProps) {
  if (!level || level < 1) return null;

  const isFullyVerified = level >= 2;

  const iconSize =
    size || (variant === "icon" ? 20 : variant === "badge" ? 16 : 14);

  const iconName = isFullyVerified ? "shield-checkmark" : "checkmark-circle";
  const iconColor = isFullyVerified ? "#2563EB" : Colors.success;
  const label = isFullyVerified ? "Fully Verified" : "Verified";
  const bgColor = isFullyVerified ? "#EFF6FF" : "#ECFDF5";
  const textColor = isFullyVerified ? "#1D4ED8" : "#047857";

  if (variant === "icon") {
    return (
      <View style={style}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>
    );
  }

  if (variant === "inline") {
    return (
      <View style={[styles.inlineContainer, style]}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
        <Text style={[styles.inlineText, { color: textColor }]}>{label}</Text>
      </View>
    );
  }

  // Default: badge variant
  return (
    <View style={[styles.badgeContainer, { backgroundColor: bgColor }, style]}>
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  inlineText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default VerificationBadge;
