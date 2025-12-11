import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { format } from "date-fns";

interface PaymentReceivedCardProps {
  jobTitle: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  receivedDate: string;
  onViewDetails?: () => void;
}

export default function PaymentReceivedCard({
  jobTitle,
  grossAmount,
  platformFee,
  netAmount,
  receivedDate,
  onViewDetails,
}: PaymentReceivedCardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Payment Received</Text>
            <Text style={styles.headerDate}>
              {format(new Date(receivedDate), "MMM dd, yyyy")}
            </Text>
          </View>
        </View>
      </View>

      {/* Job Title */}
      <View style={styles.jobSection}>
        <Text style={styles.jobLabel}>Job</Text>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {jobTitle}
        </Text>
      </View>

      {/* Earnings Breakdown */}
      <View style={styles.breakdownSection}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Total Payment</Text>
          <Text style={styles.breakdownValue}>
            ₱{formatAmount(grossAmount)}
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.feeLabel}>Platform Fee (5%)</Text>
          <Text style={styles.feeValue}>-₱{formatAmount(platformFee)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>You Received</Text>
          <Text style={styles.totalValue}>₱{formatAmount(netAmount)}</Text>
        </View>
      </View>

      {/* View Details Button */}
      {onViewDetails && (
        <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
          <Text style={styles.detailsButtonText}>View Payment Details</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  jobSection: {
    marginBottom: Spacing.md,
  },
  jobLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  breakdownSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  feeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.success,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
});
