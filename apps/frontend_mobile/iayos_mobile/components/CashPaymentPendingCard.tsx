import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { formatDistanceToNow } from "date-fns";

interface CashPaymentPendingCardProps {
  jobTitle: string;
  amount: number;
  submittedDate: string;
  proofImageUrl?: string;
  estimatedTime?: string; // e.g., "24-48 hours"
}

export default function CashPaymentPendingCard({
  jobTitle,
  amount,
  submittedDate,
  estimatedTime = "24-48 hours",
}: CashPaymentPendingCardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with Warning Icon */}
      <View style={styles.header}>
        <View style={styles.warningIcon}>
          <Ionicons name="time" size={28} color={Colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Payment Pending Verification</Text>
          <Text style={styles.subtitle}>
            Submitted{" "}
            {formatDistanceToNow(new Date(submittedDate), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {/* Job & Amount */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Job</Text>
          <Text style={styles.detailValue} numberOfLines={2}>
            {jobTitle}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountValue}>₱{formatAmount(amount)}</Text>
        </View>
      </View>

      {/* Status Info */}
      <View style={styles.statusBox}>
        <View style={styles.statusHeader}>
          <ActivityIndicator size="small" color={Colors.warning} />
          <Text style={styles.statusTitle}>Verification in Progress</Text>
        </View>
        <Text style={styles.statusText}>
          Our admin team is verifying your cash payment proof. This usually
          takes {estimatedTime}.
        </Text>
      </View>

      {/* Timeline Steps */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.timelineDotComplete]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
          <Text style={styles.timelineTextComplete}>Proof submitted</Text>
        </View>

        <View style={styles.timelineLine} />

        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.timelineDotPending]}>
            <ActivityIndicator size="small" color={Colors.warning} />
          </View>
          <Text style={styles.timelineTextPending}>Admin verification</Text>
        </View>

        <View style={styles.timelineLine} />

        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.timelineDotUpcoming]} />
          <Text style={styles.timelineTextUpcoming}>Payment released</Text>
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Ionicons
          name="information-circle"
          size={16}
          color={Colors.textSecondary}
        />
        <Text style={styles.infoNoteText}>
          You'll receive a notification once the payment is verified and
          released to your wallet.
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
    borderColor: Colors.warning,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsSection: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.warning,
  },
  statusBox: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.warning,
  },
  statusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  timelineSection: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotComplete: {
    backgroundColor: Colors.success,
  },
  timelineDotPending: {
    backgroundColor: Colors.warningLight,
  },
  timelineDotUpcoming: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 11,
  },
  timelineTextComplete: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.success,
  },
  timelineTextPending: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.warning,
  },
  timelineTextUpcoming: {
    fontSize: 13,
    color: Colors.textLight,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.background,
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
