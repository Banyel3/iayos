/**
 * ReceiptDisclaimer - BIR compliance notice for all receipt/transaction summaries
 *
 * Philippine BIR regulations require that documents not issued as Official
 * Receipts (O.R.) be clearly marked as such. This component provides a
 * reusable amber-colored banner with that disclaimer.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/theme";

export default function ReceiptDisclaimer() {
  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={18} color="#8a8988" />
      <Text style={styles.text}>
        This is <Text style={styles.bold}>NOT an Official Receipt (O.R.)</Text>{" "}
        
      </Text>
    </View>
  );
}

/** Plain-text version for Share/export contexts */
export const RECEIPT_DISCLAIMER_TEXT =
  "⚠️ This is NOT an Official Receipt (O.R.)";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  text: {
    flex: 1,
    ...Typography.body.small,
    color: "#989796", // amber-800
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
  },
});
