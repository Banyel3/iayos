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
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  BorderRadius,
  Spacing,
} from "../../constants/theme";
import PaymentSummaryCard from "../../components/PaymentSummaryCard";
import PaymentMethodButton from "../../components/PaymentMethodButton";
import WalletBalanceCard from "../../components/WalletBalanceCard";
import { useWalletBalance } from "../../lib/hooks/usePayments";

type PaymentMethod = "wallet";

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get job details from params
  const jobId = params.jobId ? parseInt(params.jobId as string) : null;
  const jobBudget = params.budget ? parseFloat(params.budget as string) : 0;
  const jobTitle = (params.title as string) || "Untitled Job";

  // Escrow payment is wallet-only
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  // Fetch wallet balance
  const {
    data: walletData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useWalletBalance();

  const walletBalance = walletData?.balance || 0;

  // Check if wallet has sufficient balance
  const isWalletSufficient = walletBalance >= jobBudget * 0.6; // 50% + 10% fee = 60% of budget

  const handleMethodSelect = (method: PaymentMethod) => {
    if (method === "wallet" && !isWalletSufficient) {
      Alert.alert(
        "Insufficient Balance",
        "Your wallet balance is not enough. Please deposit funds or choose another payment method.",
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
    setSelectedMethod(method);
  };

  const handleProceed = () => {
    if (!selectedMethod) {
      Alert.alert(
        "Select Payment Method",
        "Please select a payment method to continue.",
      );
      return;
    }

    if (!jobId) {
      Alert.alert("Error", "Job ID is missing. Please try again.");
      return;
    }

    // Navigate to wallet payment (escrow is wallet-only)
    router.push({
      pathname: "/payments/wallet" as any,
      params: { jobId, budget: jobBudget, title: jobTitle },
    });
  };

  const handleDeposit = () => {
    router.push("/payments/deposit" as any);
  };

  if (!jobId || !jobBudget) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Invalid job details</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
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
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment Method</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {jobTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payment Summary */}
        <PaymentSummaryCard jobBudget={jobBudget} />

        {/* Wallet Balance Card */}
        <WalletBalanceCard
          balance={walletBalance}
          isLoading={isLoadingBalance}
          onRefresh={refetchBalance}
          onDeposit={handleDeposit}
        />

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* Wallet - Only option for escrow */}
          <PaymentMethodButton
            method="wallet"
            label="Wallet"
            description={
              isWalletSufficient
                ? "Pay using your wallet balance"
                : "Insufficient balance - Deposit required"
            }
            icon="wallet"
            selected={selectedMethod === "wallet"}
            onPress={() => handleMethodSelect("wallet")}
            disabled={!isWalletSufficient}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            This is the escrow payment (50% downpayment). Wallet payment only.
            Cash payment is available for the final 50% after job completion.
            {"\n\n"}
            Need to add funds? Tap "Deposit Funds" above to top up via QR PH.
          </Text>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            !selectedMethod && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceed}
          disabled={!selectedMethod}
        >
          <Text
            style={[
              styles.proceedButtonText,
              !selectedMethod && styles.proceedButtonTextDisabled,
            ]}
          >
            Proceed to Payment
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={!selectedMethod ? Colors.textLight : Colors.white}
          />
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primary + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: Spacing.md,
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
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  proceedButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
  },
  proceedButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  proceedButtonTextDisabled: {
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
