import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../constants/theme";
import {
  formatCurrency,
  calculateEscrowAmount,
} from "../lib/hooks/usePayments";

interface PaymentSummaryCardProps {
  jobBudget: number;
  showBreakdown?: boolean;
  compact?: boolean;
}

export default function PaymentSummaryCard({
  jobBudget,
  showBreakdown = true,
  compact = false,
}: PaymentSummaryCardProps) {
  const { halfBudget, platformFee, total } = calculateEscrowAmount(jobBudget);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>Escrow Payment</Text>
        <Text style={styles.compactAmount}>{formatCurrency(total)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Summary</Text>
      </View>

      <View style={styles.content}>
        {/* Job Budget */}
        <View style={styles.row}>
          <Text style={styles.label}>Job Budget</Text>
          <Text style={styles.value}>{formatCurrency(jobBudget)}</Text>
        </View>

        {showBreakdown && (
          <>
            {/* Divider */}
            <View style={styles.divider} />

            {/* Escrow Amount (50%) */}
            <View style={styles.row}>
              <Text style={styles.label}>Escrow Amount (50%)</Text>
              <Text style={styles.value}>{formatCurrency(halfBudget)}</Text>
            </View>

            {/* Platform Fee (5%) */}
            <View style={styles.row}>
              <Text style={styles.label}>Platform Fee (5%)</Text>
              <Text style={styles.value}>{formatCurrency(platformFee)}</Text>
            </View>

            {/* Divider */}
            <View style={styles.dividerThick} />
          </>
        )}

        {/* Total */}
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total to Pay</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 You pay 50% now to secure the worker. The remaining 50% is paid
          after job completion.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  compactContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  compactLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  compactAmount: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    fontWeight: "600",
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  dividerThick: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.primary,
  },
  infoBox: {
    backgroundColor: Colors.primary + "20",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primary + "40",
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    lineHeight: 18,
  },
});
