import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";
import PaymentStatusBadge, { PaymentStatus } from "./PaymentStatusBadge";
import { formatCurrency } from "../lib/hooks/usePayments";
import ReceiptDisclaimer, { RECEIPT_DISCLAIMER_TEXT } from "./ReceiptDisclaimer";

/**
 * PaymentReceiptModal Component
 *
 * Full-screen modal for payment receipt:
 * - Transaction details
 * - Job information
 * - Timestamp
 * - Transaction ID
 * - Share receipt
 * - Download option (future)
 */

interface PaymentReceipt {
  id: number;
  transaction_id: string;
  amount: number;
  platform_fee: number;
  total_amount: number;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  job?: {
    id: number;
    title: string;
    budget: number;
  };
  worker?: {
    id: number;
    name: string;
  };
}

interface PaymentReceiptModalProps {
  visible: boolean;
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export default function PaymentReceiptModal({
  visible,
  receipt,
  onClose,
}: PaymentReceiptModalProps) {
  const [isSharing, setIsSharing] = useState(false);

  if (!receipt) return null;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const message = `
iAyos Payment Receipt

Transaction ID: ${receipt.transaction_id}
Amount: ${formatCurrency(receipt.amount)}
Platform Fee: ${formatCurrency(receipt.platform_fee)}
Total: ${formatCurrency(receipt.total_amount)}
Method: ${receipt.payment_method.toUpperCase()}
Status: ${receipt.status.toUpperCase()}
Date: ${new Date(receipt.created_at).toLocaleString()}

${receipt.job ? `Job: ${receipt.job.title}` : ""}

Thank you for using iAyos!

${RECEIPT_DISCLAIMER_TEXT}
      `.trim();

      await Share.share({
        message,
        title: "Payment Receipt",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share receipt");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            disabled={isSharing}
          >
            <Ionicons name="share-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receipt Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="receipt" size={60} color={Colors.primary} />
          </View>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <PaymentStatusBadge status={receipt.status} size="large" />
          </View>

          {/* Total Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(receipt.total_amount)}
            </Text>
          </View>

          {/* Transaction ID */}
          <View style={styles.transactionIdContainer}>
            <Text style={styles.transactionIdLabel}>Transaction ID</Text>
            <Text style={styles.transactionIdValue}>
              {receipt.transaction_id}
            </Text>
          </View>

          {/* Payment Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Job Budget (50%)</Text>
              <Text style={styles.rowValue}>
                {formatCurrency(receipt.amount)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Platform Fee (5%)</Text>
              <Text style={styles.rowValue}>
                {formatCurrency(receipt.platform_fee)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabelBold}>Total Paid</Text>
              <Text style={styles.rowValueBold}>
                {formatCurrency(receipt.total_amount)}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Payment Method</Text>
              <Text style={styles.rowValue}>
                {receipt.payment_method.toUpperCase()}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date & Time</Text>
              <Text style={styles.rowValue}>
                {new Date(receipt.created_at).toLocaleString()}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <View style={styles.rowValue}>
                <PaymentStatusBadge status={receipt.status} size="small" />
              </View>
            </View>
          </View>

          {/* Job Details */}
          {receipt.job && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Details</Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Job Title</Text>
                <Text style={styles.rowValue} numberOfLines={2}>
                  {receipt.job.title}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Job Budget</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(receipt.job.budget)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Job ID</Text>
                <Text style={styles.rowValue}>#{receipt.job.id}</Text>
              </View>
            </View>
          )}

          {/* Worker Details */}
          {receipt.worker && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Worker Details</Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Worker Name</Text>
                <Text style={styles.rowValue}>{receipt.worker.name}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Worker ID</Text>
                <Text style={styles.rowValue}>#{receipt.worker.id}</Text>
              </View>
            </View>
          )}

          {/* Receipt Disclaimer */}
          <ReceiptDisclaimer />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  shareButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  amountLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  transactionIdContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIdLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  transactionIdValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
    fontFamily: "monospace",
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  rowLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  rowValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
  },
  rowLabelBold: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowValueBold: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  footerNoteText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
