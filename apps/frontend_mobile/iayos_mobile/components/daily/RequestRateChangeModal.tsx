/**
 * Request Rate Change Modal
 * Modal for requesting a change to the daily rate
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addDays } from "date-fns";

interface RequestRateChangeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newRate: number, reason: string, effectiveDate: string) => void;
  isSubmitting?: boolean;
  currentRate: number;
  remainingDays: number;
  isWorker: boolean;
}

const RATE_ADJUSTMENTS = [-500, -200, -100, 100, 200, 500];

export const RequestRateChangeModal: React.FC<RequestRateChangeModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  currentRate,
  remainingDays,
  isWorker,
}) => {
  const [newRate, setNewRate] = useState<string>(currentRate.toString());
  const [reason, setReason] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<Date>(addDays(new Date(), 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parsedNewRate = parseInt(newRate.replace(/[^0-9]/g, ""), 10) || 0;
  const rateChange = parsedNewRate - currentRate;
  const isIncrease = rateChange > 0;
  const isDecrease = rateChange < 0;
  const escrowAdjustment = rateChange * remainingDays;

  const handleSubmit = () => {
    if (parsedNewRate <= 0 || parsedNewRate === currentRate || !reason.trim()) return;
    onSubmit(parsedNewRate, reason.trim(), format(effectiveDate, "yyyy-MM-dd"));
  };

  const handleClose = () => {
    setNewRate(currentRate.toString());
    setReason("");
    setEffectiveDate(addDays(new Date(), 1));
    onClose();
  };

  const handleRateAdjustment = (adjustment: number) => {
    const newValue = currentRate + adjustment;
    if (newValue > 0) {
      setNewRate(newValue.toString());
    }
  };

  const handleRateChange = (text: string) => {
    // Only allow numbers
    const numeric = text.replace(/[^0-9]/g, "");
    setNewRate(numeric);
  };

  const isValid = parsedNewRate > 0 && parsedNewRate !== currentRate && reason.trim().length >= 10;

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
            <View style={[styles.headerIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="swap-horizontal" size={24} color={Colors.warning} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Request Rate Change</Text>
              <Text style={styles.subtitle}>
                {isWorker ? "Request a different daily rate" : "Propose a new daily rate"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Current Rate Display */}
            <View style={styles.currentRateBox}>
              <Text style={styles.currentRateLabel}>Current Daily Rate</Text>
              <Text style={styles.currentRateValue}>₱{currentRate.toLocaleString()}</Text>
            </View>

            {/* New Rate Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>New Daily Rate *</Text>
              <View style={styles.rateInputContainer}>
                <Text style={styles.currencyPrefix}>₱</Text>
                <TextInput
                  style={styles.rateInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="number-pad"
                  value={newRate}
                  onChangeText={handleRateChange}
                  maxLength={7}
                />
              </View>

              {/* Quick Adjustments */}
              <View style={styles.adjustmentsGrid}>
                {RATE_ADJUSTMENTS.map((adj) => (
                  <TouchableOpacity
                    key={adj}
                    style={[
                      styles.adjustmentButton,
                      adj > 0 ? styles.adjustmentPositive : styles.adjustmentNegative,
                    ]}
                    onPress={() => handleRateAdjustment(adj)}
                  >
                    <Text
                      style={[
                        styles.adjustmentText,
                        adj > 0 ? styles.adjustmentTextPositive : styles.adjustmentTextNegative,
                      ]}
                    >
                      {adj > 0 ? "+" : ""}₱{Math.abs(adj)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rate Change Indicator */}
            {rateChange !== 0 && (
              <View
                style={[
                  styles.changeIndicator,
                  isIncrease ? styles.changeIncrease : styles.changeDecrease,
                ]}
              >
                <Ionicons
                  name={isIncrease ? "arrow-up-circle" : "arrow-down-circle"}
                  size={24}
                  color={isIncrease ? Colors.success : Colors.error}
                />
                <View style={styles.changeTextContainer}>
                  <Text
                    style={[
                      styles.changeAmount,
                      isIncrease ? styles.textSuccess : styles.textError,
                    ]}
                  >
                    {isIncrease ? "+" : ""}₱{rateChange.toLocaleString()}/day
                  </Text>
                  <Text style={styles.changePercent}>
                    ({isIncrease ? "+" : ""}
                    {((rateChange / currentRate) * 100).toFixed(1)}%)
                  </Text>
                </View>
              </View>
            )}

            {/* Effective Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Effective From</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.dateButtonText}>
                  {format(effectiveDate, "EEEE, MMMM d, yyyy")}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={effectiveDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={addDays(new Date(), 1)}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setEffectiveDate(date);
                  }}
                />
              )}
            </View>

            {/* Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reason for Change *</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Explain why the rate should change (min 10 characters)"
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

            {/* Escrow Impact */}
            {rateChange !== 0 && remainingDays > 0 && (
              <View style={styles.escrowImpact}>
                <Text style={styles.escrowTitle}>Escrow Impact</Text>
                
                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Remaining Days</Text>
                  <Text style={styles.escrowValue}>{remainingDays} days</Text>
                </View>
                
                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Rate Change</Text>
                  <Text style={styles.escrowValue}>
                    {isIncrease ? "+" : ""}₱{rateChange.toLocaleString()}/day
                  </Text>
                </View>

                <View style={styles.escrowDivider} />
                
                <View style={styles.escrowRow}>
                  <Text style={styles.escrowTotalLabel}>
                    {isIncrease ? "Additional Escrow Needed" : "Escrow Refund"}
                  </Text>
                  <Text
                    style={[
                      styles.escrowTotalValue,
                      isIncrease ? styles.textError : styles.textSuccess,
                    ]}
                  >
                    {isIncrease ? "+" : "-"}₱{Math.abs(escrowAdjustment).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                {isWorker
                  ? "The client must approve this rate change before it takes effect."
                  : "The worker must agree to this rate change before it takes effect."}
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
  currentRateBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  currentRateLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  currentRateValue: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
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
  rateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  rateInput: {
    flex: 1,
    height: 56,
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  adjustmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  adjustmentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  adjustmentPositive: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  adjustmentNegative: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  adjustmentText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  adjustmentTextPositive: {
    color: Colors.success,
  },
  adjustmentTextNegative: {
    color: Colors.error,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  changeIncrease: {
    backgroundColor: Colors.successLight,
  },
  changeDecrease: {
    backgroundColor: Colors.errorLight,
  },
  changeTextContainer: {
    flex: 1,
  },
  changeAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
  },
  changePercent: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  textSuccess: {
    color: Colors.success,
  },
  textError: {
    color: Colors.error,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateButtonText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
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
  escrowImpact: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  escrowTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  escrowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  escrowLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  escrowValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  escrowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  escrowTotalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  escrowTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
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
    backgroundColor: Colors.warning,
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

export default RequestRateChangeModal;
