/**
 * Attendance Card
 * Single attendance record with status, date, and confirmation actions
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { DualConfirmationBadge } from "./DualConfirmationBadge";
import type { DailyAttendance } from "@/lib/hooks/useDailyPayment";
import { format, parseISO } from "date-fns";

interface AttendanceCardProps {
  attendance: DailyAttendance;
  isWorker: boolean;
  onConfirm?: () => void;       // Client: "Mark Worker Arrived" (verify-arrival)
  onDayComplete?: () => void;   // Client: "Mark Day Complete" (mark-day-complete)
  onAdjust?: () => void;
  isConfirming?: boolean;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  attendance,
  isWorker,
  onConfirm,
  onDayComplete,
  onAdjust,
  isConfirming = false,
}) => {
  // Simplified flow: worker_confirmed is auto-set by verify-arrival.
  // Worker no longer has a manual "confirm" step.
  const canClientMarkArrived = !isWorker && !attendance.time_in;
  const canClientMarkDayComplete =
    !isWorker && !!attendance.time_in && !attendance.client_confirmed;
  const canAdjust = !isWorker && !attendance.client_confirmed;
  const bothConfirmed = attendance.worker_confirmed && attendance.client_confirmed;

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "--:--";
    try {
      return format(parseISO(timeStr), "h:mm a");
    } catch {
      return timeStr;
    }
  };

  return (
    <View style={[styles.container, bothConfirmed && styles.containerCompleted]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{formatDate(attendance.date)}</Text>
        </View>
        <AttendanceStatusBadge status={attendance.status} size="sm" />
      </View>

      {/* Time Row */}
      {(attendance.time_in || attendance.time_out) && (
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>In:</Text>
            <Text style={styles.timeValue}>{formatTime(attendance.time_in)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Out:</Text>
            <Text style={styles.timeValue}>{formatTime(attendance.time_out)}</Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {attendance.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.notesText} numberOfLines={2}>
            {attendance.notes}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Earnings */}
        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>Earned:</Text>
          <Text style={[styles.earningsValue, bothConfirmed && styles.earningsPaid]}>
            ₱{attendance.amount_earned.toLocaleString()}
          </Text>
        </View>

        {/* Confirmation Status */}
        <DualConfirmationBadge
          workerConfirmed={attendance.worker_confirmed}
          clientConfirmed={attendance.client_confirmed}
        />
      </View>

      {/* Worker info banner — no action needed, client handles arrival */}
      {isWorker && !attendance.time_in && (
        <View style={styles.workerBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.workerBannerText}>
            The client will mark your arrival for this day.
          </Text>
        </View>
      )}

      {/* Action Buttons — Simplified two-step client flow */}
      {(canClientMarkArrived || canClientMarkDayComplete) && (
        <View style={styles.actionsContainer}>
          {canClientMarkArrived && onConfirm && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={isConfirming}
            >
              <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
              <Text style={styles.confirmButtonText}>
                {isConfirming ? "Confirming..." : "Mark Worker Arrived"}
              </Text>
            </TouchableOpacity>
          )}

          {canClientMarkDayComplete && (
            <View style={styles.clientActions}>
              {onAdjust && (
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={onAdjust}
                  disabled={isConfirming}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.warning} />
                  <Text style={styles.adjustButtonText}>Adjust</Text>
                </TouchableOpacity>
              )}
              {onDayComplete && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onDayComplete}
                  disabled={isConfirming}
                >
                  <Ionicons name="checkmark-done" size={16} color={Colors.white} />
                  <Text style={styles.confirmButtonText}>
                    {isConfirming ? "..." : "Mark Day Complete"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.small,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  containerCompleted: {
    borderLeftColor: Colors.success,
    backgroundColor: "#FAFFFE",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  timeValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  earningsValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  earningsPaid: {
    color: Colors.success,
  },
  actionsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clientActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  adjustButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.warningLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  adjustButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.warning,
  },
  workerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.info}15`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  workerBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.info,
  },
});

export default AttendanceCard;
