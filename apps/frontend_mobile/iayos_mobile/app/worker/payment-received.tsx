import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../../constants/theme";
import { useJobEarnings } from "../../lib/hooks/useFinalPayment";
import { useWalletBalance } from "../../lib/hooks/usePayments";
import { format } from "date-fns";

export default function PaymentReceivedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = parseInt(params.jobId as string);

  const { data: earnings } = useJobEarnings(jobId);
  const { data: walletBalance } = useWalletBalance();

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleShareReceipt = async () => {
    if (!earnings) return;

    const receiptText = `
iAyos Payment Receipt

Job: ${earnings.jobTitle}
Total Earnings: ₱${formatAmount(earnings.grossAmount)}
Platform Fee (5%): -₱${formatAmount(earnings.platformFee)}
Net Received: ₱${formatAmount(earnings.netAmount)}

Date: ${format(new Date(), "PPpp")}
Transaction ID: PAY-${earnings.jobId}

Thank you for using iAyos!
    `.trim();

    try {
      await Share.share({
        message: receiptText,
        title: "Payment Receipt",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share receipt");
    }
  };

  const handleViewTimeline = () => {
    router.push(`/payments/timeline/${jobId}` as any);
  };

  const handleViewEarnings = () => {
    router.push("/worker/earnings" as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Payment Received",
          headerShown: true,
          headerBackTitle: "Back",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Payment Received!</Text>
          <Text style={styles.successSubtitle}>
            Your earnings have been added to your wallet
          </Text>
        </View>

        {/* Earnings Breakdown */}
        {earnings && (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
              <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
            </View>

            {/* Job Title */}
            <View style={styles.jobInfoRow}>
              <Text style={styles.jobLabel}>Job</Text>
              <Text style={styles.jobValue} numberOfLines={2}>
                {earnings.jobTitle}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Gross Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Payment</Text>
              <Text style={styles.amountValue}>
                ₱{formatAmount(earnings.grossAmount)}
              </Text>
            </View>

            {/* Platform Fee */}
            <View style={styles.amountRow}>
              <View style={styles.labelWithIcon}>
                <Text style={styles.amountLabel}>Platform Fee (5%)</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <Text style={styles.feeValue}>
                -₱{formatAmount(earnings.platformFee)}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Net Amount */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>You Received</Text>
              <Text style={styles.totalValue}>
                ₱{formatAmount(earnings.netAmount)}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.dateText}>
                {format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}
              </Text>
            </View>
          </View>
        )}

        {/* Wallet Balance Update */}
        <View style={styles.walletCard}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet" size={32} color={Colors.primary} />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Updated Wallet Balance</Text>
            <Text style={styles.walletBalance}>
              ₱{formatAmount(walletBalance?.balance || 0)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.textLight} />
        </View>

        {/* Transaction ID */}
        <View style={styles.transactionCard}>
          <Text style={styles.transactionLabel}>Transaction ID</Text>
          <Text style={styles.transactionId}>PAY-{jobId}</Text>
        </View>

        {/* Share Receipt Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReceipt}
        >
          <Ionicons name="share-outline" size={20} color={Colors.primary} />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            You can withdraw your earnings anytime from your wallet. Minimum withdrawal amount is ₱100.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewTimeline}
        >
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Payment Timeline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewEarnings}
        >
          <Text style={styles.primaryButtonText}>View All Earnings</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  successHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  successIconContainer: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  breakdownCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  jobInfoRow: {
    marginBottom: Spacing.md,
  },
  jobLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.error,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.success,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  transactionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "monospace",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
