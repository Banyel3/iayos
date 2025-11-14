import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../constants/theme";
import PaymentSummaryCard from "../../components/PaymentSummaryCard";
import WalletBalanceCard from "../../components/WalletBalanceCard";
import {
  useWalletBalance,
  useCreateEscrowPayment,
  calculateEscrowAmount,
  formatCurrency,
} from "../../lib/hooks/usePayments";

export default function WalletPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobId = params.jobId ? parseInt(params.jobId as string) : null;
  const jobBudget = params.budget ? parseFloat(params.budget as string) : 0;
  const jobTitle = params.title as string || "Untitled Job";

  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: walletData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useWalletBalance();

  const createEscrowPayment = useCreateEscrowPayment();

  const walletBalance = walletData?.balance || 0;
  const { total } = calculateEscrowAmount(jobBudget);
  const remainingBalance = walletBalance - total;
  const isBalanceSufficient = walletBalance >= total;

  const handleConfirmPayment = () => {
    if (!isBalanceSufficient) {
      Alert.alert(
        "Insufficient Balance",
        "Your wallet balance is not enough. Please deposit funds first.",
        [
          {
            text: "Deposit Funds",
            onPress: () => router.push("/payments/deposit"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Are you sure you want to pay ${formatCurrency(total)} from your wallet?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: processPayment },
      ]
    );
  };

  const processPayment = () => {
    setIsProcessing(true);

    createEscrowPayment.mutate(
      {
        jobId: jobId!,
        amount: total,
        paymentMethod: "wallet",
      },
      {
        onSuccess: () => {
          setIsProcessing(false);
          refetchBalance(); // Refresh wallet balance

          Alert.alert(
            "Payment Successful",
            "Your wallet payment has been processed successfully.",
            [
              {
                text: "View Status",
                onPress: () => router.push(`/payments/status?jobId=${jobId}`),
              },
            ]
          );
        },
        onError: () => {
          setIsProcessing(false);
        },
      }
    );
  };

  const handleDeposit = () => {
    router.push("/payments/deposit");
  };

  if (!jobId || !jobBudget) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Invalid payment details</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Wallet Payment</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {jobTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance */}
        <WalletBalanceCard
          balance={walletBalance}
          isLoading={isLoadingBalance}
          onRefresh={refetchBalance}
          onDeposit={handleDeposit}
        />

        {/* Payment Summary */}
        <PaymentSummaryCard jobBudget={jobBudget} />

        {/* Balance After Payment */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(walletBalance)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Payment Amount</Text>
            <Text style={[styles.balanceValue, styles.deductionValue]}>
              -{formatCurrency(total)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceRow}>
            <Text style={styles.totalLabel}>Remaining Balance</Text>
            <Text
              style={[
                styles.totalValue,
                remainingBalance < 0 && styles.insufficientValue,
              ]}
            >
              {formatCurrency(remainingBalance)}
            </Text>
          </View>
        </View>

        {/* Insufficient Balance Warning */}
        {!isBalanceSufficient && (
          <View style={styles.warningBox}>
            <Ionicons
              name="warning"
              size={20}
              color={Colors.warning}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Insufficient balance. Please deposit{" "}
              {formatCurrency(total - walletBalance)} or more to continue.
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            The payment will be instantly deducted from your wallet balance upon confirmation.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!isBalanceSufficient || isProcessing) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmPayment}
          disabled={!isBalanceSufficient || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={!isBalanceSufficient ? Colors.textLight : Colors.white}
              />
              <Text
                style={[
                  styles.confirmButtonText,
                  !isBalanceSufficient && styles.confirmButtonTextDisabled,
                ]}
              >
                Confirm Payment
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: {
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  deductionValue: {
    color: Colors.error,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.success,
  },
  insufficientValue: {
    color: Colors.error,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: Spacing.md,
  },
  warningIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    flex: 1,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primary + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  confirmButtonTextDisabled: {
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: Typography.fontSize["2xl"],
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});
