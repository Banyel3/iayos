/**
 * Request Extension Modal
 * Modal for requesting additional days on a daily rate job
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface RequestExtensionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (additionalDays: number, reason: string) => void;
  isSubmitting?: boolean;
  dailyRate: number;
  currentDuration: number;
  daysWorked: number;
}

const QUICK_DAYS = [1, 3, 5, 7, 14];

export const RequestExtensionModal: React.FC<RequestExtensionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  dailyRate,
  currentDuration,
  daysWorked,
}) => {
  const [additionalDays, setAdditionalDays] = useState<number>(0);
  const [customDays, setCustomDays] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const effectiveDays = customDays ? parseInt(customDays, 10) || 0 : additionalDays;
  const additionalEscrow = effectiveDays * dailyRate;
  const newDuration = currentDuration + effectiveDays;

  const handleSubmit = () => {
    if (effectiveDays <= 0 || !reason.trim()) return;
    onSubmit(effectiveDays, reason.trim());
  };

  const handleClose = () => {
    setAdditionalDays(0);
    setCustomDays("");
    setReason("");
    onClose();
  };

  const handleQuickDaysSelect = (days: number) => {
    setAdditionalDays(days);
    setCustomDays("");
  };

  const handleCustomDaysChange = (text: string) => {
    // Only allow numbers
    const numeric = text.replace(/[^0-9]/g, "");
    setCustomDays(numeric);
    setAdditionalDays(0);
  };

  const isValid = effectiveDays > 0 && reason.trim().length >= 10;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Request Extension</Text>
              <Text style={styles.subtitle}>Add more days to this job</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Current Status */}
            <View style={styles.currentStatus}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Original Duration</Text>
                <Text style={styles.statusValue}>{currentDuration} days</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Days Worked</Text>
                <Text style={styles.statusValue}>{daysWorked} days</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Remaining</Text>
                <Text style={styles.statusValue}>{currentDuration - daysWorked} days</Text>
              </View>
            </View>

            {/* Quick Days Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Add Days</Text>
              <View style={styles.quickDaysGrid}>
                {QUICK_DAYS.map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.quickDayButton,
                      additionalDays === days && !customDays && styles.quickDayButtonSelected,
                    ]}
                    onPress={() => handleQuickDaysSelect(days)}
                  >
                    <Text
                      style={[
                        styles.quickDayText,
                        additionalDays === days && !customDays && styles.quickDayTextSelected,
                      ]}
                    >
                      +{days}
                    </Text>
                    <Text
                      style={[
                        styles.quickDayLabel,
                        additionalDays === days && !customDays && styles.quickDayLabelSelected,
                      ]}
                    >
                      {days === 1 ? "day" : "days"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Days Input */}
              <View style={styles.customDaysRow}>
                <Text style={styles.orText}>or specify:</Text>
                <TextInput
                  style={[
                    styles.customDaysInput,
                    customDays && styles.customDaysInputActive,
                  ]}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="number-pad"
                  value={customDays}
                  onChangeText={handleCustomDaysChange}
                  maxLength={3}
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>
            </View>

            {/* Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reason for Extension *</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Why do you need more time? (min 10 characters)"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={reason}
                onChangeText={setReason}
                maxLength={500}
              />
              <Text style={styles.charCount}>{reason.length}/500</Text>
            </View>

            {/* Cost Summary */}
            {effectiveDays > 0 && (
              <View style={styles.costSummary}>
                <Text style={styles.costTitle}>Extension Summary</Text>
                
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Additional Days</Text>
                  <Text style={styles.costValue}>+{effectiveDays} days</Text>
                </View>
                
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>New Total Duration</Text>
                  <Text style={styles.costValue}>{newDuration} days</Text>
                </View>
                
                <View style={styles.costDivider} />
                
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Daily Rate</Text>
                  <Text style={styles.costValue}>₱{dailyRate.toLocaleString()}/day</Text>
                </View>
                
                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Additional Escrow Required</Text>
                  <Text style={styles.totalValue}>₱{additionalEscrow.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                The client will need to approve this extension and deposit additional funds before the days are added.
              </Text>
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
              style={[
                styles.submitButton,
                (!isValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              <Ionicons name="paper-plane" size={18} color={Colors.white} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Send Request"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  currentStatus: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statusLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  quickDaysGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quickDayButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  quickDayButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  quickDayText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickDayTextSelected: {
    color: Colors.primary,
  },
  quickDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  quickDayLabelSelected: {
    color: Colors.primary,
  },
  customDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  orText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  customDaysInput: {
    width: 80,
    height: 44,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: "center",
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  customDaysInputActive: {
    borderColor: Colors.primary,
  },
  daysLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  costSummary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  costTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  costLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  costValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  costDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});

export default RequestExtensionModal;
