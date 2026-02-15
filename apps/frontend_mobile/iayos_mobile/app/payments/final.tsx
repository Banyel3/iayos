import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import PaymentSummaryCard from "../../components/PaymentSummaryCard";
import PaymentMethodButton from "../../components/PaymentMethodButton";
import WalletBalanceCard from "../../components/WalletBalanceCard";
import { useWalletBalance } from "../../lib/hooks/usePayments";
import {
  useCreateFinalPayment,
  useJobPaymentStatus,
} from "../../lib/hooks/useFinalPayment";

export default function FinalPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = parseInt(params.jobId as string);
  const budget = parseFloat(params.budget as string);
  const jobTitle = (params.title as string) || "Job";

  const [selectedMethod, setSelectedMethod] = useState<
    "wallet" | "cash" | null
  >(null);

  const {
    data: walletBalance,
    isLoading: loadingBalance,
    refetch: refetchBalance,
  } = useWalletBalance();
  const { data: paymentStatus } = useJobPaymentStatus(jobId);
  const createFinalPaymentMutation = useCreateFinalPayment();

  // Calculate final payment (remaining 50% + 10% fee on the remaining 50%)
  // Worker receives full budget, client pays platform fee on top
  const halfBudget = budget / 2; // 50% to worker
  const platformFee = halfBudget * 0.2; // 10% of total budget = 20% of the half
  const totalAmount = halfBudget + platformFee; // Total client pays

  const paymentBreakdown = {
    halfBudget,
    platformFee,
    total: totalAmount,
  };

  const insufficientBalance =
    walletBalance && walletBalance.balance < totalAmount;

  const handleProceed = () => {
    if (!selectedMethod) {
      Alert.alert(
        "Select Payment Method",
        "Please select a payment method to continue.",
      );
      return;
    }

    // Check wallet balance if wallet selected
    if (selectedMethod === "wallet" && insufficientBalance) {
      Alert.alert(
        "Insufficient Balance",
        "Your wallet balance is insufficient. Please deposit funds or choose another payment method.",
        [
          {
            text: "Deposit Funds",
            onPress: () => router.push("/payments/deposit" as any),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    // Navigate to appropriate payment screen
    switch (selectedMethod) {
      case "wallet":
        router.push({
          pathname: "/payments/wallet" as any,
          params: {
            jobId: jobId.toString(),
            budget: budget.toString(),
            title: jobTitle,
            paymentType: "final",
          },
        });
        break;
      case "cash":
        router.push({
          pathname: "/payments/cash" as any,
          params: {
            jobId: jobId.toString(),
            budget: budget.toString(),
            title: jobTitle,
            paymentType: "final",
          },
        });
        break;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Final Payment",
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
        {/* Header Info */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={Colors.success}
            />
          </View>
          <Text style={styles.headerTitle}>Job Completed!</Text>
          <Text style={styles.headerSubtitle}>
            Complete the final payment to release funds to the worker
          </Text>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfoCard}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <View style={styles.jobMetaRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.jobMetaText}>Completed today</Text>
          </View>
        </View>

        {/* Payment Summary */}
        {/* Payment Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Final Payment Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Remaining Payment (50%)</Text>
            <Text style={styles.breakdownValue}>
              ₱
              {halfBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform Fee (10%)</Text>
            <Text style={styles.breakdownValue}>
              ₱
              {platformFee.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₱
              {totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        {/* Previous Payment Info */}
        {paymentStatus?.escrowPaid && (
          <View style={styles.previousPaymentCard}>
            <View style={styles.previousPaymentRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.previousPaymentLabel}>Escrow Payment</Text>
            </View>
            <Text style={styles.previousPaymentAmount}>
              ₱
              {paymentStatus.escrowAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.previousPaymentDate}>
              Paid on {new Date(paymentStatus.escrowDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Wallet Balance Card */}
        <WalletBalanceCard
          balance={walletBalance?.balance || 0}
          isLoading={loadingBalance}
          onRefresh={refetchBalance}
          showDepositButton={insufficientBalance}
        />

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <PaymentMethodButton
            method="wallet"
            icon="wallet"
            label="Wallet"
            description={`Available: ₱${walletBalance?.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}`}
            selected={selectedMethod === "wallet"}
            disabled={insufficientBalance}
            onPress={() => setSelectedMethod("wallet")}
          />

          <PaymentMethodButton
            method="cash"
            icon="cash"
            label="Cash"
            description="Requires admin verification"
            selected={selectedMethod === "cash"}
            onPress={() => setSelectedMethod("cash")}
          />
        </View>

        {/* Insufficient Balance Warning */}
        {selectedMethod === "wallet" && insufficientBalance && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color={Colors.error} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>
                Insufficient wallet balance
              </Text>
              <Text style={styles.warningText}>
                You need ₱
                {(totalAmount - (walletBalance?.balance || 0)).toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 },
                )}{" "}
                more to complete this payment
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/payments/deposit" as any)}
                style={styles.depositButtonInWarning}
              >
                <Text style={styles.depositButtonText}>Deposit Funds</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
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
            This is the final payment (remaining 50%). Cash payment is accepted
            here. The worker will receive the full listing price. Platform fee
            is charged to you on top of the payment.
          </Text>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!selectedMethod ||
              (selectedMethod === "wallet" && insufficientBalance)) &&
              styles.proceedButtonDisabled,
          ]}
          onPress={handleProceed}
          disabled={
            !selectedMethod ||
            (selectedMethod === "wallet" && insufficientBalance)
          }
        >
          {createFinalPaymentMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
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
  headerSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  headerIcon: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  jobInfoCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  jobMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  jobMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  previousPaymentCard: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  previousPaymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  previousPaymentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
  previousPaymentAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  previousPaymentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  depositButtonInWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    gap: Spacing.xs,
  },
  depositButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
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
  breakdownCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
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
  },
  proceedButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  proceedButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
