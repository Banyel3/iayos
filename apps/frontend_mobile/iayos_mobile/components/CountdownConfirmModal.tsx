/**
 * CountdownConfirmModal - Reusable confirmation modal with countdown timer
 *
 * Adds a mandatory waiting period before critical/irreversible actions
 * (e.g., payments, application acceptance, job deletion).
 * The confirm button is disabled during the countdown, giving users
 * time to reconsider. Cancel is always available.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

interface CountdownConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: "default" | "destructive";
  countdownSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function CountdownConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  confirmStyle = "default",
  countdownSeconds = 5,
  onConfirm,
  onCancel,
  isLoading = false,
  icon = "alert-circle",
  iconColor,
}: CountdownConfirmModalProps) {
  const [remaining, setRemaining] = useState(countdownSeconds);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Reset countdown when modal opens
  useEffect(() => {
    if (visible) {
      setRemaining(countdownSeconds);
      progressAnim.setValue(0);

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: countdownSeconds * 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, countdownSeconds]);

  // Countdown interval
  useEffect(() => {
    if (!visible || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, remaining > 0]);

  const canConfirm = remaining === 0 && !isLoading;
  const isDestructive = confirmStyle === "destructive";
  const resolvedIconColor =
    iconColor || (isDestructive ? Colors.error : Colors.warning);

  const confirmBgColor = isDestructive
    ? canConfirm
      ? Colors.error
      : Colors.errorLight
    : canConfirm
      ? Colors.primary
      : Colors.primaryLight;

  const confirmTextColor = canConfirm ? Colors.textLight : Colors.textSecondary;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDestructive
                  ? Colors.errorLight
                  : Colors.warningLight,
              },
            ]}
          >
            <Ionicons name={icon} size={32} color={resolvedIconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Progress bar */}
          {remaining > 0 && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth,
                    backgroundColor: isDestructive
                      ? Colors.error
                      : Colors.primary,
                  },
                ]}
              />
            </View>
          )}

          {/* Countdown hint */}
          {remaining > 0 && (
            <Text style={styles.countdownHint}>
              Please wait {remaining}s before confirming...
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: confirmBgColor }]}
              onPress={onConfirm}
              disabled={!canConfirm}
              activeOpacity={canConfirm ? 0.7 : 1}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={[styles.confirmText, { color: confirmTextColor }]}>
                  {remaining > 0
                    ? `${confirmLabel} (${remaining}s)`
                    : confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    ...Shadows.medium,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  countdownHint: {
    ...Typography.body.small,
    color: Colors.textHint,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  confirmText: {
    ...Typography.body.medium,
    fontWeight: "600",
  },
});
