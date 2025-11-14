import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, Spacing } from "../constants/theme";

interface PaymentTimelineConnectorProps {
  isActive?: boolean; // Whether the line should be highlighted (for active/completed steps)
  height?: number; // Custom height (default 24)
}

export default function PaymentTimelineConnector({
  isActive = false,
  height = 24,
}: PaymentTimelineConnectorProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.line,
          { height },
          isActive && styles.lineActive,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  line: {
    width: 2,
    backgroundColor: Colors.border,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
});