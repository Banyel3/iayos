// components/KYC/KYCStatusBadge.tsx
// Status indicator badge for KYC verification

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KYCStatus } from "@/lib/types/kyc";
import { getKYCStatusDisplay } from "@/lib/types/kyc";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface KYCStatusBadgeProps {
  status: KYCStatus;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  showDescription?: boolean;
}

export const KYCStatusBadge: React.FC<KYCStatusBadgeProps> = ({
  status,
  size = "medium",
  showIcon = true,
  showDescription = false,
}) => {
  const statusInfo = getKYCStatusDisplay(status);

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      icon: 16,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      icon: 20,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      icon: 24,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          currentSize.container,
          { backgroundColor: `${statusInfo.color}15` },
        ]}
      >
        {showIcon && (
          <Ionicons
            name={statusInfo.icon as any}
            size={currentSize.icon}
            color={statusInfo.color}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.text,
            currentSize.text,
            { color: statusInfo.color },
          ]}
        >
          {statusInfo.label}
        </Text>
      </View>
      {showDescription && (
        <Text style={styles.description}>{statusInfo.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-start",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
  },
  containerSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
  },
  containerMedium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  containerLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
  },
  textSmall: {
    fontSize: Typography.fontSize.xs,
  },
  textMedium: {
    fontSize: Typography.fontSize.sm,
  },
  textLarge: {
    fontSize: Typography.fontSize.md,
  },
  description: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});
