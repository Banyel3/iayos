/**
 * Daily Job Summary Card
 * Displays daily rate, days worked, escrow balance, and key stats
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { DailySummary } from "@/lib/hooks/useDailyPayment";

interface DailyJobSummaryCardProps {
  summary: DailySummary;
  isWorker: boolean;
}

export const DailyJobSummaryCard: React.FC<DailyJobSummaryCardProps> = ({
  summary,
  isWorker,
}) => {
  const progressPercent = summary.duration_days > 0
    ? Math.min(100, (summary.days_worked / summary.duration_days) * 100)
    : 0;

  const escrowUsedPercent = summary.payments.escrow_total > 0
    ? Math.min(100, ((summary.payments.escrow_total - summary.payments.escrow_remaining) / summary.payments.escrow_total) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Ionicons name="calendar" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>Daily Rate Job</Text>
          </View>
        </View>
        <Text style={styles.rateText}>₱{summary.daily_rate.toLocaleString()}/day</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Days Progress</Text>
          <Text style={styles.progressValue}>
            {summary.days_worked} / {summary.duration_days} days
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.remainingText}>
          {summary.remaining_days} days remaining
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Attendance Stats */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{summary.attendance.days_present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="time" size={16} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{summary.attendance.days_half}</Text>
          <Text style={styles.statLabel}>Half Day</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.errorLight }]}>
            <Ionicons name="close-circle" size={16} color={Colors.error} />
          </View>
          <Text style={styles.statValue}>{summary.attendance.days_absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.infoLight }]}>
            <Ionicons name="hourglass" size={16} color={Colors.info} />
          </View>
          <Text style={styles.statValue}>{summary.attendance.pending_confirmation}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Escrow/Earnings Section */}
      <View style={styles.escrowSection}>
        <View style={styles.escrowHeader}>
          <Text style={styles.escrowLabel}>
            {isWorker ? "Your Earnings" : "Escrow Status"}
          </Text>
          <Text style={styles.escrowTotal}>
            ₱{summary.payments.total_earned.toLocaleString()} earned
          </Text>
        </View>
        
        <View style={styles.escrowProgressContainer}>
          <View style={[styles.escrowProgressBar, { width: `${escrowUsedPercent}%` }]} />
        </View>
        
        <View style={styles.escrowDetails}>
          <View style={styles.escrowDetailItem}>
            <Text style={styles.escrowDetailLabel}>Total Escrow</Text>
            <Text style={styles.escrowDetailValue}>
              ₱{summary.payments.escrow_total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.escrowDetailItem}>
            <Text style={styles.escrowDetailLabel}>Remaining</Text>
            <Text style={[styles.escrowDetailValue, { color: Colors.success }]}>
              ₱{summary.payments.escrow_remaining.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Pending Requests Badge */}
      {(summary.pending_requests.extensions > 0 || summary.pending_requests.rate_changes > 0) && (
        <View style={styles.pendingBadge}>
          <Ionicons name="alert-circle" size={16} color={Colors.warning} />
          <Text style={styles.pendingBadgeText}>
            {summary.pending_requests.extensions > 0 && `${summary.pending_requests.extensions} extension request(s)`}
            {summary.pending_requests.extensions > 0 && summary.pending_requests.rate_changes > 0 && " • "}
            {summary.pending_requests.rate_changes > 0 && `${summary.pending_requests.rate_changes} rate change(s)`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
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
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.primary,
  },
  rateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  escrowSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  escrowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  escrowLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textSecondary,
  },
  escrowTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.success,
  },
  escrowProgressContainer: {
    height: 6,
    backgroundColor: Colors.successLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  escrowProgressBar: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  escrowDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  escrowDetailItem: {
    alignItems: "center",
  },
  escrowDetailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  escrowDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: 6,
  },
  pendingBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    fontWeight: Typography.fontWeight.medium as any,
    flex: 1,
  },
});

export default DailyJobSummaryCard;
