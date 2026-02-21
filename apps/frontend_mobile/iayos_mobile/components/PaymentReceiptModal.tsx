import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";
import PaymentStatusBadge, { PaymentStatus } from "./PaymentStatusBadge";
import { formatCurrency } from "../lib/hooks/usePayments";
import ReceiptDisclaimer, { RECEIPT_DISCLAIMER_TEXT } from "./ReceiptDisclaimer";
import { downloadDepositReceiptPdf } from "../lib/utils/generate-receipt-pdf";

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
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  type?: string;
  transaction_type_label?: string;
  description?: string;
  reference_number?: string | null;
  balance_after?: number | null;
  paymongo_checkout_url?: string | null;
  job?: {
    id: number;
    title: string;
    status?: string;
  } | null;
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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!receipt) return null;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const message = `
iAyos Payment Receipt

Transaction ID: ${receipt.transaction_id}
${receipt.transaction_type_label ? `Type: ${receipt.transaction_type_label}\n` : ''}Amount: ${formatCurrency(receipt.amount)}
Method: ${receipt.payment_method.toUpperCase()}
Status: ${receipt.status.toUpperCase()}
Date: ${new Date(receipt.created_at).toLocaleString()}${receipt.reference_number ? `\nReference: ${receipt.reference_number}` : ''}${receipt.job ? `\nJob: ${receipt.job.title}` : ''}

Thank you for using iAyos!

${RECEIPT_DISCLAIMER_TEXT}
      `.trim();

      await Share.share({
        message,
        title: "Payment Receipt",
      });
    } catch (error) {
      console.log("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadDepositReceiptPdf(receipt);
    } catch (error) {
      console.log("PDF download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenPayMongo = async () => {
    if (receipt.paymongo_checkout_url) {
      await Linking.openURL(receipt.paymongo_checkout_url);
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleDownloadPdf}
              style={styles.headerActionButton}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerActionButton}
              disabled={isSharing}
            >
              <Ionicons name="share-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
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

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>
              {receipt.transaction_type_label || "Amount"}
            </Text>
            <Text style={styles.amountValue}>
              {formatCurrency(receipt.amount)}
            </Text>
          </View>

          {/* Transaction ID */}
          <View style={styles.transactionIdContainer}>
            <Text style={styles.transactionIdLabel}>Transaction ID</Text>
            <Text style={styles.transactionIdValue}>
              {receipt.transaction_id}
            </Text>
          </View>

          {/* Transaction Info */}
          {(receipt.description || receipt.reference_number) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Info</Text>

              {receipt.description ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Description</Text>
                  <Text style={[styles.rowValue, { flexShrink: 1 }]} numberOfLines={2}>
                    {receipt.description}
                  </Text>
                </View>
              ) : null}

              {receipt.reference_number ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Reference No.</Text>
                  <Text style={styles.rowValue}>{receipt.reference_number}</Text>
                </View>
              ) : null}
            </View>
          )}

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

            {receipt.balance_after != null && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Balance After</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(receipt.balance_after)}
                </Text>
              </View>
            )}
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

              {receipt.job.status && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Job Status</Text>
                  <Text style={styles.rowValue}>{receipt.job.status}</Text>
                </View>
              )}

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Job ID</Text>
                <Text style={styles.rowValue}>#{receipt.job.id}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {receipt.paymongo_checkout_url ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.paymongoButton]}
                onPress={handleOpenPayMongo}
              >
                <Ionicons name="open-outline" size={18} color={Colors.primary} />
                <Text style={styles.paymongoButtonText}>View on PayMongo</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadPdfButton]}
              onPress={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="download-outline" size={18} color={Colors.white} />
              )}
              <Text style={styles.downloadPdfButtonText}>
                {isDownloading ? "Generating PDF..." : "Download PDF Receipt"}
              </Text>
            </TouchableOpacity>
          </View>

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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerActionButton: {
    padding: Spacing.xs,
    minWidth: 36,
    alignItems: "center",
  },
  actionButtons: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  paymongoButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  paymongoButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.primary,
  },
  downloadPdfButton: {
    backgroundColor: Colors.primary,
  },
  downloadPdfButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.white,
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
