import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";

interface FinalPaymentCardProps {
  halfBudget: number; // Remaining 50% of job budget
  platformFee: number; // 5% platform fee on final payment
  totalAmount: number; // Total final payment (50% + 5%)
  workerReceives?: number; // Amount worker receives (optional, calculated from escrow + final)
  showWorkerReceives?: boolean; // Whether to show worker receives section
}

export default function FinalPaymentCard({
  halfBudget,
  platformFee,
  totalAmount,
  workerReceives,
  showWorkerReceives = false,
}: FinalPaymentCardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>Final Payment Breakdown</Text>
      </View>

      {/* Breakdown Items */}
      <View style={styles.breakdownSection}>
        {/* Remaining 50% */}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Remaining Payment (50%)</Text>
          <Text style={styles.breakdownValue}>₱{formatAmount(halfBudget)}</Text>
        </View>

        {/* Platform Fee */}
        <View style={styles.breakdownRow}>
          <View style={styles.labelWithIcon}>
            <Text style={styles.breakdownLabel}>Platform Fee (5%)</Text>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors.textSecondary}
            />
          </View>
          <Text style={styles.breakdownValue}>
            ₱{formatAmount(platformFee)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total Final Payment */}
        <View style={styles.breakdownRow}>
          <Text style={styles.totalLabel}>Total Final Payment</Text>
          <Text style={styles.totalValue}>₱{formatAmount(totalAmount)}</Text>
        </View>
      </View>

      {/* Worker Receives Section (Optional) */}
      {showWorkerReceives && workerReceives !== undefined && (
        <View style={styles.workerSection}>
          <View style={styles.workerHeader}>
            <Ionicons name="person-outline" size={18} color={Colors.success} />
            <Text style={styles.workerHeaderText}>Worker Receives</Text>
          </View>
          <View style={styles.workerAmountRow}>
            <Text style={styles.workerAmountLabel}>Total Earnings</Text>
            <Text style={styles.workerAmountValue}>
              ₱{formatAmount(workerReceives)}
            </Text>
          </View>
          <Text style={styles.workerNote}>
            Worker receives 95% of total payments (platform fee deducted)
          </Text>
        </View>
      )}

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Ionicons
          name="information-circle"
          size={16}
          color={Colors.textSecondary}
        />
        <Text style={styles.infoNoteText}>
          This is the final 50% payment. Funds will be released to the worker
          upon confirmation.
        </Text>
      </View>
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
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  breakdownSection: {
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  workerSection: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  workerHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
  workerAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  workerAmountLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  workerAmountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.success,
  },
  workerNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
