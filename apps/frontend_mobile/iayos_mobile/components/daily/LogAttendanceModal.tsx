/**
 * Log Attendance Modal
 * Modal for workers to log their daily attendance
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { AttendanceStatus } from "@/lib/hooks/useDailyPayment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

interface LogAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    work_date: string;
    status: AttendanceStatus;
    time_in?: string;
    time_out?: string;
    notes?: string;
  }) => void;
  isSubmitting?: boolean;
  dailyRate: number;
}

const statusOptions: { value: AttendanceStatus; label: string; icon: string; color: string }[] = [
  { value: "PRESENT", label: "Full Day", icon: "checkmark-circle", color: Colors.success },
  { value: "HALF_DAY", label: "Half Day", icon: "time", color: Colors.warning },
  { value: "ABSENT", label: "Absent", icon: "close-circle", color: Colors.error },
];

export const LogAttendanceModal: React.FC<LogAttendanceModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  dailyRate,
}) => {
  const [workDate, setWorkDate] = useState(new Date());
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [timeIn, setTimeIn] = useState<Date | null>(null);
  const [timeOut, setTimeOut] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeInPicker, setShowTimeInPicker] = useState(false);
  const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);

  const getEarnings = () => {
    switch (status) {
      case "PRESENT":
        return dailyRate;
      case "HALF_DAY":
        return dailyRate / 2;
      case "ABSENT":
        return 0;
      default:
        return dailyRate;
    }
  };

  const handleSubmit = () => {
    onSubmit({
      work_date: format(workDate, "yyyy-MM-dd"),
      status,
      time_in: timeIn ? timeIn.toISOString() : undefined,
      time_out: timeOut ? timeOut.toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const resetForm = () => {
    setWorkDate(new Date());
    setStatus("PRESENT");
    setTimeIn(null);
    setTimeOut(null);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
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
            <Text style={styles.title}>Log Attendance</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date Picker */}
            <View style={styles.section}>
              <Text style={styles.label}>Work Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.dateText}>
                  {format(workDate, "EEEE, MMMM d, yyyy")}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={workDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setWorkDate(date);
                  }}
                />
              )}
            </View>

            {/* Status Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Attendance Status</Text>
              <View style={styles.statusGrid}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      status === option.value && {
                        borderColor: option.color,
                        backgroundColor: `${option.color}10`,
                      },
                    ]}
                    onPress={() => setStatus(option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={status === option.value ? option.color : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        status === option.value && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time In/Out */}
            {status !== "ABSENT" && (
              <View style={styles.section}>
                <Text style={styles.label}>Time (Optional)</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimeInPicker(true)}
                  >
                    <Ionicons name="log-in" size={18} color={Colors.success} />
                    <Text style={styles.timeButtonText}>
                      {timeIn ? format(timeIn, "h:mm a") : "Time In"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimeOutPicker(true)}
                  >
                    <Ionicons name="log-out" size={18} color={Colors.error} />
                    <Text style={styles.timeButtonText}>
                      {timeOut ? format(timeOut, "h:mm a") : "Time Out"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {showTimeInPicker && (
                  <DateTimePicker
                    value={timeIn || new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowTimeInPicker(Platform.OS === "ios");
                      if (date) setTimeIn(date);
                    }}
                  />
                )}
                {showTimeOutPicker && (
                  <DateTimePicker
                    value={timeOut || new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowTimeOutPicker(Platform.OS === "ios");
                      if (date) setTimeOut(date);
                    }}
                  />
                )}
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes about this day..."
                placeholderTextColor={Colors.textHint}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Earnings Preview */}
            <View style={styles.earningsPreview}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Daily Rate:</Text>
                <Text style={styles.earningsValue}>₱{dailyRate.toLocaleString()}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>This Day:</Text>
                <Text style={[styles.earningsValue, styles.earningsHighlight]}>
                  ₱{getEarnings().toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>

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
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Logging..." : "Log Attendance"}
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
    maxHeight: "90%",
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
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
    color: Colors.textPrimary,
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
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  timeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 80,
  },
  earningsPreview: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  earningsValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  earningsHighlight: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
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
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});

export default LogAttendanceModal;
