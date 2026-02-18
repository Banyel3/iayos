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
      <Ionicons name="warning" size={18} color="#B45309" />
      <Text style={styles.text}>
        This is <Text style={styles.bold}>NOT an Official Receipt (O.R.)</Text>{" "}
        as defined by the Bureau of Internal Revenue (BIR). This document is a
        transaction summary for your records only.
      </Text>
    </View>
  );
}

/** Plain-text version for Share/export contexts */
export const RECEIPT_DISCLAIMER_TEXT =
  "⚠️ This is NOT an Official Receipt (O.R.) as defined by the BIR. This is a transaction summary for your records only.";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#FEF3C7", // amber-100
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FDE68A", // amber-200
  },
  text: {
    flex: 1,
    ...Typography.body.small,
    color: "#92400E", // amber-800
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
  },
});
