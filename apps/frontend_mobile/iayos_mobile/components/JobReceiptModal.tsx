/**
 * JobReceiptModal - Professional receipt/invoice modal for completed jobs
 *
 * Displays:
 * - Job details and timeline
 * - Complete payment breakdown
 * - Buffer status for workers
 * - Transaction history
 * - Client and worker information
 *
 * Works for all completed jobs, including those completed before this feature.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import {
  useJobReceipt,
  formatCurrency,
  formatReceiptDate,
  getTransactionTypeLabel,
  getHoldReasonLabel,
  JobReceipt,
  ReceiptTransaction,
} from "../lib/hooks/useJobReceipt";
import { getAbsoluteMediaUrl } from "../lib/api/config";
import ReceiptDisclaimer, { RECEIPT_DISCLAIMER_TEXT } from "./ReceiptDisclaimer";
import { downloadJobReceiptPdf } from "../lib/utils/generate-receipt-pdf";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface JobReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  jobId: number | null;
  userRole?: "CLIENT" | "WORKER";
}

export default function JobReceiptModal({
  visible,
  onClose,
  jobId,
  userRole = "CLIENT",
}: JobReceiptModalProps) {
  const { data, isLoading, error } = useJobReceipt(jobId, visible);
  const receipt = data?.receipt as JobReceipt | undefined;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!receipt) return;
    setIsDownloading(true);
    try {
      await downloadJobReceiptPdf(
        {
          completed_at: receipt.completed_at,
          job: { id: receipt.job_id, title: receipt.title, status: receipt.status },
          payments: {
            job_budget: receipt.payment?.budget,
            platform_fee: receipt.payment?.platform_fee,
            total_paid: receipt.payment?.total_client_paid,
            worker_earnings: receipt.payment?.worker_earnings,
            escrow_amount: receipt.payment?.escrow_amount,
            remaining_payment: receipt.payment?.final_payment,
          },
          client: receipt.client ? { name: receipt.client.name, email: receipt.client.contact ?? undefined } : null,
          worker: receipt.worker ? { name: receipt.worker.name, email: receipt.worker.contact ?? undefined } : null,
        },
        userRole
      );
    } catch (err) {
      console.log('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;

    try {
      const message = `
📄 iAyos Job Receipt

Job: ${receipt.title}
Status: ${receipt.status}

💰 Payment Summary:
• Budget: ${formatCurrency(receipt.payment.budget)}
• Platform Fee (${receipt.payment.platform_fee_rate}): ${formatCurrency(receipt.payment.platform_fee)}
• Total Paid: ${formatCurrency(receipt.payment.total_client_paid)}

📅 Completed: ${formatReceiptDate(receipt.completed_at)}

iAyos - May sira? May iAyos.

${RECEIPT_DISCLAIMER_TEXT}
      `.trim();

      await Share.share({
        message,
        title: `Receipt - ${receipt.title}`,
      });
    } catch (error) {
      console.log("Share error:", error);
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Receipt</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDownloadPdf}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={!receipt || isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={22}
                  color={receipt ? Colors.primary : Colors.textHint}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={!receipt}
            >
              <Ionicons
                name="share-outline"
                size={22}
                color={receipt ? Colors.primary : Colors.textHint}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading receipt...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { }}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : receipt ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Receipt Header with Logo */}
            <View style={styles.receiptHeader}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>iAyos</Text>
                <Text style={styles.logoTagline}>May sira? May iAyos.</Text>
              </View>
              <View style={styles.receiptBadge}>
                <Ionicons
                  name={
                    receipt.status === "COMPLETED" ? "checkmark-circle" : "time"
                  }
                  size={16}
                  color={
                    receipt.status === "COMPLETED"
                      ? Colors.success
                      : Colors.warning
                  }
                />
                <Text
                  style={[
                    styles.receiptBadgeText,
                    receipt.status === "COMPLETED"
                      ? styles.completedText
                      : styles.pendingText,
                  ]}
                >
                  {receipt.status === "COMPLETED" ? "Paid" : "Pending"}
                </Text>
              </View>
            </View>

            {/* Receipt Disclaimer */}
            <ReceiptDisclaimer />

            {/* Buffer Status Card (Payment Status) */}
            {receipt.buffer && (
              <View
                style={[
                  styles.card,
                  receipt.buffer.is_released
                    ? styles.releasedCard
                    : styles.bufferCard,
                ]}
              >
                <View style={styles.bufferHeader}>
                  <Ionicons
                    name={
                      receipt.buffer.is_released ? "checkmark-circle" : "time"
                    }
                    size={24}
                    color={
                      receipt.buffer.is_released ? Colors.success : "#FFA000"
                    }
                  />
                  <Text style={styles.cardTitle}>
                    {receipt.buffer.is_released
                      ? "Payment Released"
                      : "Payment Pending"}
                  </Text>
                </View>
                <View style={styles.divider} />

                {receipt.buffer.is_released ? (
                  <View style={styles.bufferContent}>
                    <Text style={styles.bufferText}>
                      ₱
                      {formatCurrency(receipt.payment.worker_earnings).replace(
                        "₱",
                        ""
                      )}{" "}
                      has been added to the wallet.
                    </Text>
                    <Text style={styles.bufferDate}>
                      Released on{" "}
                      {formatReceiptDate(receipt.buffer.released_at)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.bufferContent}>
                    <Text style={styles.bufferText}>
                      Earnings are held for {receipt.buffer.buffer_days}{" "}
                      days to allow for backjob requests.
                    </Text>
                    <View style={styles.bufferStats}>
                      <View style={styles.bufferStat}>
                        <Text style={styles.bufferStatValue}>
                          {receipt.buffer.remaining_days ?? "—"}
                        </Text>
                        <Text style={styles.bufferStatLabel}>Days Left</Text>
                      </View>
                      <View style={styles.bufferStat}>
                        <Text style={styles.bufferStatValue}>
                          {formatReceiptDate(receipt.buffer.end_date)?.split(
                            ","
                          )[0] ?? "—"}
                        </Text>
                        <Text style={styles.bufferStatLabel}>Release Date</Text>
                      </View>
                    </View>
                    <Text style={styles.bufferReason}>
                      Status: {getHoldReasonLabel(receipt.buffer.hold_reason)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Job Details Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Job Details</Text>
              <View style={styles.divider} />

              <Text style={styles.jobTitle}>{receipt.title}</Text>

              <View style={styles.infoRow}>
                <Ionicons
                  name="folder-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  {receipt.category || "Uncategorized"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.infoText}>{receipt.location}</Text>
              </View>

              {receipt.is_team_job && (
                <View style={styles.teamBadge}>
                  <Ionicons name="people" size={14} color={Colors.primary} />
                  <Text style={styles.teamBadgeText}>Team Job</Text>
                </View>
              )}
            </View>

            {/* Payment Breakdown Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Breakdown</Text>
              <View style={styles.divider} />

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Job Budget</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(receipt.payment.budget)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  50% Escrow (Downpayment)
                </Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(receipt.payment.escrow_amount)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>50% Final Payment</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(receipt.payment.final_payment)}
                </Text>
              </View>

              <View style={styles.paymentDivider} />

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  Platform Fee ({receipt.payment.platform_fee_rate})
                </Text>
                <Text style={[styles.paymentValue, styles.feeText]}>
                  +{formatCurrency(receipt.payment.platform_fee)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {userRole === "CLIENT" ? "Total You Paid" : "Worker Earnings"}
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    userRole === "CLIENT"
                      ? receipt.payment.total_client_paid
                      : receipt.payment.worker_earnings
                  )}
                </Text>
              </View>

              {receipt.payment.payment_method && (
                <View style={styles.paymentMethodRow}>
                  <Ionicons
                    name={
                      receipt.payment.payment_method === "GCASH"
                        ? "wallet"
                        : "cash"
                    }
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.paymentMethodText}>
                    Paid via {receipt.payment.payment_method}
                  </Text>
                </View>
              )}
            </View>

            {/* Timeline Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Timeline</Text>
              <View style={styles.divider} />

              <TimelineItem
                label="Job Created"
                date={receipt.created_at}
                icon="add-circle"
                isFirst
                completed
              />
              <TimelineItem
                label="Work Started"
                date={receipt.started_at}
                icon="play-circle"
                completed={!!receipt.started_at}
              />
              <TimelineItem
                label="Worker Completed"
                date={receipt.worker_completed_at}
                icon="checkmark-circle"
                completed={!!receipt.worker_completed_at}
              />
              <TimelineItem
                label="Client Approved"
                date={receipt.client_approved_at}
                icon="thumbs-up"
                completed={!!receipt.client_approved_at}
              />
              <TimelineItem
                label="Job Completed"
                date={receipt.completed_at}
                icon="flag"
                isLast
                completed={!!receipt.completed_at}
              />
            </View>


            {/* Parties Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Parties</Text>
              <View style={styles.divider} />

              {/* Client */}
              <View style={styles.partyRow}>
                <View style={styles.partyAvatar}>
                  {receipt.client.avatar ? (
                    <Image
                      source={{
                        uri:
                          getAbsoluteMediaUrl(receipt.client.avatar) ||
                          undefined,
                      }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={24}
                      color={Colors.textSecondary}
                    />
                  )}
                </View>
                <View style={styles.partyInfo}>
                  <Text style={styles.partyLabel}>Client</Text>
                  <Text style={styles.partyName}>{receipt.client.name}</Text>
                </View>
              </View>

              {/* Worker/Agency */}
              {receipt.worker && (
                <View style={styles.partyRow}>
                  <View style={styles.partyAvatar}>
                    {receipt.worker.avatar ? (
                      <Image
                        source={{
                          uri:
                            getAbsoluteMediaUrl(receipt.worker.avatar) ||
                            undefined,
                        }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons
                        name={
                          receipt.worker.type === "AGENCY"
                            ? "business"
                            : "person"
                        }
                        size={24}
                        color={Colors.textSecondary}
                      />
                    )}
                  </View>
                  <View style={styles.partyInfo}>
                    <Text style={styles.partyLabel}>
                      {receipt.worker.type === "AGENCY" ? "Agency" : "Worker"}
                    </Text>
                    <Text style={styles.partyName}>{receipt.worker.name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Transactions Card */}
            {receipt.transactions && receipt.transactions.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Transaction History</Text>
                <View style={styles.divider} />

                {receipt.transactions.map(
                  (txn: ReceiptTransaction, index: number) => (
                    <View
                      key={txn.id}
                      style={[
                        styles.transactionRow,
                        index < receipt.transactions.length - 1 &&
                        styles.transactionBorder,
                      ]}
                    >
                      <View style={styles.transactionIcon}>
                        <Ionicons
                          name={
                            txn.type === "EARNING" ||
                              txn.type === "PENDING_EARNING"
                              ? "arrow-down"
                              : txn.type === "PAYMENT"
                                ? "arrow-up"
                                : "swap-horizontal"
                          }
                          size={16}
                          color={
                            txn.type === "EARNING" ||
                              txn.type === "PENDING_EARNING"
                              ? Colors.success
                              : Colors.error
                          }
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType}>
                          {getTransactionTypeLabel(txn.type)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatReceiptDate(txn.created_at)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          txn.type === "EARNING" ||
                            txn.type === "PENDING_EARNING"
                            ? styles.positiveAmount
                            : styles.negativeAmount,
                        ]}
                      >
                        {txn.type === "EARNING" ||
                          txn.type === "PENDING_EARNING"
                          ? "+"
                          : "-"}
                        {formatCurrency(txn.amount)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Receipt ID: JOB-{receipt.job_id}
              </Text>
              <Text style={styles.footerText}>
                Generated on {new Date().toLocaleDateString("en-PH")}
              </Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  label: string;
  date: string | null;
  icon: string;
  isFirst?: boolean;
  isLast?: boolean;
  completed?: boolean;
}

function TimelineItem({
  label,
  date,
  icon,
  isFirst,
  isLast,
  completed,
}: TimelineItemProps) {
  return (
    <View style={styles.timelineItem}>
      {/* Line before */}
      {!isFirst && (
        <View
          style={[
            styles.timelineLine,
            styles.timelineLineBefore,
            completed && styles.timelineLineCompleted,
          ]}
        />
      )}

      {/* Icon */}
      <View
        style={[styles.timelineIcon, completed && styles.timelineIconCompleted]}
      >
        <Ionicons
          name={icon as any}
          size={16}
          color={completed ? Colors.white : Colors.textHint}
        />
      </View>

      {/* Line after */}
      {!isLast && (
        <View
          style={[
            styles.timelineLine,
            styles.timelineLineAfter,
            completed && styles.timelineLineCompleted,
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.timelineContent}>
        <Text
          style={[
            styles.timelineLabel,
            !completed && styles.timelineLabelPending,
          ]}
        >
          {label}
        </Text>
        <Text style={styles.timelineDate}>
          {date ? formatReceiptDate(date) : "Pending"}
        </Text>
      </View>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    ...Typography.heading.h1,
    color: Colors.primary,
    fontWeight: "700",
  },
  logoTagline: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  receiptBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  receiptBadgeText: {
    ...Typography.body.small,
    fontWeight: "600",
  },
  completedText: {
    color: Colors.success,
  },
  pendingText: {
    color: Colors.warning,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bufferCard: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFE082",
  },
  releasedCard: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  cardTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  jobTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  teamBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
    gap: 4,
  },
  teamBadgeText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  paymentValue: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  feeText: {
    color: Colors.warning,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    marginHorizontal: -Spacing.md,
    marginBottom: -Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  totalLabel: {
    ...Typography.heading.h4,
    color: Colors.primary,
  },
  totalValue: {
    ...Typography.heading.h3,
    color: Colors.primary,
    fontWeight: "700",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  paymentMethodText: {
    ...Typography.body.small,
    color: Colors.primary,
  },
  bufferHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bufferContent: {
    marginTop: Spacing.xs,
  },
  bufferText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  bufferStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  bufferStat: {
    alignItems: "center",
  },
  bufferStatValue: {
    ...Typography.heading.h2,
    color: "#F57C00",
    fontWeight: "700",
  },
  bufferStatLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  bufferDate: {
    ...Typography.body.small,
    color: Colors.success,
    textAlign: "center",
  },
  bufferReason: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  partyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  partyName: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  transactionDate: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    ...Typography.body.medium,
    fontWeight: "600",
  },
  positiveAmount: {
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.error,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 60,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 15,
    width: 2,
    backgroundColor: Colors.border,
  },
  timelineLineBefore: {
    top: 0,
    height: 16,
  },
  timelineLineAfter: {
    top: 32,
    bottom: 0,
  },
  timelineLineCompleted: {
    backgroundColor: Colors.success,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineIconCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  timelineLabel: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  timelineLabelPending: {
    color: Colors.textSecondary,
  },
  timelineDate: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.body.small,
    color: Colors.textHint,
  },
});
