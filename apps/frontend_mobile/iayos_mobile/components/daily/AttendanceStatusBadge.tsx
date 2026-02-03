/**
 * Attendance Status Badge
 * Visual badge for PRESENT/HALF_DAY/ABSENT/PENDING status
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { AttendanceStatus } from "@/lib/hooks/useDailyPayment";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  size?: "sm" | "md" | "lg";
}

const getStatusConfig = (status: AttendanceStatus) => {
  switch (status) {
    case "PRESENT":
      return {
        label: "Present",
        icon: "checkmark-circle" as const,
        color: Colors.success,
        bg: Colors.successLight,
      };
    case "HALF_DAY":
      return {
        label: "Half Day",
        icon: "time" as const,
        color: Colors.warning,
        bg: Colors.warningLight,
      };
    case "ABSENT":
      return {
        label: "Absent",
        icon: "close-circle" as const,
        color: Colors.error,
        bg: Colors.errorLight,
      };
    case "DISPUTED":
      return {
        label: "Disputed",
        icon: "alert-circle" as const,
        color: "#DC2626",
        bg: "#FEE2E2",
      };
    case "PENDING":
    default:
      return {
        label: "Pending",
        icon: "hourglass" as const,
        color: Colors.textSecondary,
        bg: Colors.backgroundSecondary,
      };
  }
};

const sizeConfig = {
  sm: { icon: 12, fontSize: Typography.fontSize.xs, padding: 4 },
  md: { icon: 14, fontSize: Typography.fontSize.sm, padding: 6 },
  lg: { icon: 16, fontSize: Typography.fontSize.base, padding: 8 },
};

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const config = getStatusConfig(status);
  const sizeProps = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, paddingHorizontal: sizeProps.padding + 4, paddingVertical: sizeProps.padding },
      ]}
    >
      <Ionicons name={config.icon} size={sizeProps.icon} color={config.color} />
      <Text style={[styles.label, { fontSize: sizeProps.fontSize, color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  label: {
    fontWeight: "500",
  },
});

export default AttendanceStatusBadge;
