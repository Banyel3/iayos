import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

/**
 * PaymentStatusBadge Component
 *
 * Color-coded status badge for payment status:
 * - Pending: Yellow
 * - Completed: Green
 * - Failed: Red
 * - Verifying: Blue
 * - Refunded: Purple
 */

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "verifying"
  | "refunded";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

const statusConfig = {
  pending: {
    label: "Pending",
    backgroundColor: "#FEF3C7",
    textColor: "#92400E",
    icon: "⏳",
  },
  completed: {
    label: "Completed",
    backgroundColor: "#D1FAE5",
    textColor: "#065F46",
    icon: null,
  },
  failed: {
    label: "Failed",
    backgroundColor: "#FEE2E2",
    textColor: "#991B1B",
    icon: null,
  },
  verifying: {
    label: "Verifying",
    backgroundColor: "#DBEAFE",
    textColor: "#1E40AF",
    icon: "🔍",
  },
  refunded: {
    label: "Refunded",
    backgroundColor: "#E9D5FF",
    textColor: "#6B21A8",
    icon: "↩",
  },
};

export default function PaymentStatusBadge({
  status,
  size = "medium",
  style,
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  const sizeStyles = {
    small: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 4,
      fontSize: Typography.fontSize.xs,
    },
    medium: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: Typography.fontSize.sm,
    },
    large: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.fontSize.base,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: config.textColor,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {config.icon ? `${config.icon} ` : ""}{config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontWeight: Typography.fontWeight.semiBold as any,
  },
});
