/**
 * Dual Confirmation Badge
 * Shows worker ✓ / client ✓ confirmation status
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface DualConfirmationBadgeProps {
  workerConfirmed: boolean;
  clientConfirmed: boolean;
  compact?: boolean;
}

export const DualConfirmationBadge: React.FC<DualConfirmationBadgeProps> = ({
  workerConfirmed,
  clientConfirmed,
  compact = false,
}) => {
  const bothConfirmed = workerConfirmed && clientConfirmed;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View
          style={[
            styles.compactDot,
            { backgroundColor: workerConfirmed ? Colors.success : Colors.textHint },
          ]}
        />
        <View
          style={[
            styles.compactDot,
            { backgroundColor: clientConfirmed ? Colors.success : Colors.textHint },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, bothConfirmed && styles.containerConfirmed]}>
      {/* Worker Confirmation */}
      <View style={styles.confirmationItem}>
        <Ionicons
          name={workerConfirmed ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={workerConfirmed ? Colors.success : Colors.textHint}
        />
        <Text
          style={[
            styles.label,
            workerConfirmed ? styles.labelConfirmed : styles.labelPending,
          ]}
        >
          Worker
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Client Confirmation */}
      <View style={styles.confirmationItem}>
        <Ionicons
          name={clientConfirmed ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={clientConfirmed ? Colors.success : Colors.textHint}
        />
        <Text
          style={[
            styles.label,
            clientConfirmed ? styles.labelConfirmed : styles.labelPending,
          ]}
        >
          Client
        </Text>
      </View>

      {/* Status Indicator */}
      {bothConfirmed && (
        <View style={styles.paidBadge}>
          <Ionicons name="wallet" size={10} color={Colors.white} />
          <Text style={styles.paidText}>Paid</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  containerConfirmed: {
    backgroundColor: Colors.successLight,
  },
  confirmationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
  },
  labelConfirmed: {
    color: Colors.success,
  },
  labelPending: {
    color: Colors.textHint,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: 4,
    gap: 2,
  },
  paidText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  compactContainer: {
    flexDirection: "row",
    gap: 4,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default DualConfirmationBadge;
