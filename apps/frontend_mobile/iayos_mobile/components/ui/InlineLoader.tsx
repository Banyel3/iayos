/**
 * InlineLoader Component - Subtle inline loading indicator
 *
 * Features:
 * - Non-intrusive loading state
 * - Shows at top of content area
 * - Doesn't block the entire screen
 * - Optional message
 */

import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface InlineLoaderProps {
  text?: string;
  style?: ViewStyle;
  size?: "small" | "large";
}

export default function InlineLoader({
  text = "Loading...",
  style,
  size = "small",
}: InlineLoaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <ActivityIndicator
          size={size}
          color={Colors.primary}
          style={styles.spinner}
        />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  spinner: {
    // No additional styles needed
  },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
});
