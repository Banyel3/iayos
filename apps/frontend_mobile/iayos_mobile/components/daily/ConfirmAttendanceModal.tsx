/**
 * Confirm Attendance Modal
 * Modal for clients to confirm or adjust worker attendance
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { AttendanceStatus, DailyAttendance } from "@/lib/hooks/useDailyPayment";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { format, parseISO } from "date-fns";

interface ConfirmAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (adjustedStatus?: AttendanceStatus) => void;
  attendance: DailyAttendance | null;
  isSubmitting?: boolean;
  dailyRate: number;
}

const statusOptions: { value: AttendanceStatus; label: string; earnings: (rate: number) => number }[] = [
  { value: "PRESENT", label: "Full Day", earnings: (rate) => rate },
  { value: "HALF_DAY", label: "Half Day", earnings: (rate) => rate / 2 },
  { value: "ABSENT", label: "Absent", earnings: () => 0 },
];

export const ConfirmAttendanceModal: React.FC<ConfirmAttendanceModalProps> = ({
  visible,
  onClose,
  onConfirm,
  attendance,
  isSubmitting = false,
  dailyRate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);

  if (!attendance) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const isAdjusting = selectedStatus !== null && selectedStatus !== attendance.status;
  const finalStatus = selectedStatus || attendance.status;
  const earnings = statusOptions.find((s) => s.value === finalStatus)?.earnings(dailyRate) || 0;

  const handleConfirm = () => {
    onConfirm(isAdjusting ? selectedStatus! : undefined);
  };

  const handleClose = () => {
    setSelectedStatus(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Confirm Attendance</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Date */}
            <View style={styles.dateSection}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDate(attendance.date)}</Text>
            </View>

            {/* Worker's Logged Status */}
            <View style={styles.loggedSection}>
              <Text style={styles.sectionLabel}>Worker Logged:</Text>
              <View style={styles.loggedRow}>
                <AttendanceStatusBadge status={attendance.status} size="lg" />
                {attendance.notes && (
                  <Text style={styles.notesText} numberOfLines={2}>
                    "{attendance.notes}"
                  </Text>
                )}
              </View>
            </View>

            {/* Adjust Status */}
            <View style={styles.adjustSection}>
              <Text style={styles.sectionLabel}>Confirm or Adjust:</Text>
              <View style={styles.statusGrid}>
                {statusOptions.map((option) => {
                  const isSelected = selectedStatus === option.value || 
                    (selectedStatus === null && attendance.status === option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusOption,
                        isSelected && styles.statusOptionSelected,
                      ]}
                      onPress={() => setSelectedStatus(option.value)}
                    >
                      <AttendanceStatusBadge status={option.value} size="md" />
                      <Text style={styles.earningsText}>
                        ₱{option.earnings(dailyRate).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Adjustment Warning */}
            {isAdjusting && (
              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color={Colors.warning} />
                <Text style={styles.warningText}>
                  You are adjusting the worker's logged status from{" "}
                  <Text style={{ fontWeight: "700" }}>{attendance.status}</Text> to{" "}
                  <Text style={{ fontWeight: "700" }}>{selectedStatus}</Text>
                </Text>
              </View>
            )}

            {/* Payment Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount to Pay:</Text>
                <Text style={styles.paymentValue}>₱{earnings.toLocaleString()}</Text>
              </View>
              <Text style={styles.paymentNote}>
                This amount will be transferred to worker's pending earnings
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.confirmButtonText}>
                {isSubmitting ? "Processing..." : isAdjusting ? "Adjust & Confirm" : "Confirm & Pay"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  loggedSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  loggedRow: {
    gap: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  adjustSection: {
    marginBottom: Spacing.lg,
  },
  statusGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  statusOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  earningsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
  },
  paymentSummary: {
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  paymentLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  paymentValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.success,
  },
  paymentNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});

export default ConfirmAttendanceModal;
