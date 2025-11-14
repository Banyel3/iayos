import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../constants/theme";

interface PaymentMethodButtonProps {
  method: "gcash" | "wallet" | "cash";
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PaymentMethodButton({
  method,
  label,
  description,
  icon,
  selected,
  onPress,
  disabled = false,
  style,
}: PaymentMethodButtonProps) {
  const getIconColor = () => {
    if (disabled) return Colors.textLight;
    switch (method) {
      case "gcash":
        return "#007DFF";
      case "wallet":
        return Colors.primary;
      case "cash":
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Radio Circle */}
      <View style={styles.radioContainer}>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() + "20" }]}>
        <Ionicons name={icon} size={28} color={getIconColor()} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
        <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
          {description}
        </Text>
      </View>

      {/* Checkmark (when selected) */}
      {selected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "05",
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.backgroundSecondary,
  },
  radioContainer: {
    marginRight: Spacing.sm,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  labelDisabled: {
    color: Colors.textLight,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  descriptionDisabled: {
    color: Colors.textLight,
  },
  checkmark: {
    marginLeft: Spacing.sm,
  },
});
