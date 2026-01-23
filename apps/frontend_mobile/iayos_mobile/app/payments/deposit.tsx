import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import {
  useWalletDeposit,
  useWalletBalance,
  formatCurrency,
  WalletDepositResponse,
} from "../../lib/hooks/usePayments";
import WalletBalanceCard from "../../components/WalletBalanceCard";

/**
 * Wallet Deposit Screen
 *
 * Allows users to deposit funds to wallet via Xendit:
 * - Enter deposit amount
 * - Create Xendit invoice
 * - Display WebView for payment
 * - Detect payment success/failure
 * - Update wallet balance
 *
 * Route params: amount (optional)
 */

export default function WalletDepositScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();

  const [depositAmount, setDepositAmount] = useState(params.amount || "");
  const [xenditUrl, setXenditUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pendingDeposit, setPendingDeposit] = useState<number | null>(null);
  const [webViewHandled, setWebViewHandled] = useState(false);

  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const depositMutation = useWalletDeposit();

  // Preset amounts
  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  const sanitizeAmountInput = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return sanitized;
  };

  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeAmountInput(value);
    setDepositAmount(sanitized);
    if (amountError) {
      setAmountError(null);
    }
  };

  const validateAmount = (amount: number) => {
    if (!amount || isNaN(amount)) {
      setAmountError("Please enter a valid amount");
      return false;
    }

    if (amount < 100) {
      setAmountError("Minimum deposit is ₱100");
      return false;
    }

    if (amount > 100000) {
      setAmountError("Maximum deposit is ₱100,000");
      return false;
    }

    return true;
  };

  const getInvoiceUrl = (
    response: WalletDepositResponse | null | undefined,
  ) => {
    return (
      response?.payment_url ||
      response?.invoice_url ||
      response?.invoiceUrl ||
      null
    );
  };

  const parsedAmount = parseFloat(depositAmount);
  const isDepositDisabled =
    !depositAmount ||
    isNaN(parsedAmount) ||
    parsedAmount < 100 ||
    parsedAmount > 100000 ||
    isProcessing;
  const formattedDepositAmount = !isNaN(parsedAmount)
    ? formatCurrency(parsedAmount)
    : formatCurrency(0);

  const handlePresetAmount = (amount: number) => {
    setDepositAmount(amount.toString());
    if (amountError) {
      setAmountError(null);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!validateAmount(amount)) {
      return;
    }

    let redirectedToWebView = false;

    try {
      setIsProcessing(true);
      // QR PH payment - no payment method selection needed
      const response = await depositMutation.mutateAsync({
        amount,
      });
      const invoiceUrl = getInvoiceUrl(response);
      setPendingDeposit(amount);
      setAmountError(null);

      if (invoiceUrl) {
        redirectedToWebView = true;
        setWebViewHandled(false);
        setXenditUrl(invoiceUrl);
        setIsProcessing(false);
        return;
      }

      setDepositAmount("");
      setPendingDeposit(null);
      setIsProcessing(false);
      Alert.alert(
        "Deposit Successful",
        `${formatCurrency(amount)} has been added to your wallet.`,
        [
          {
            text: "OK",
            onPress: () => {
              refetchBalance();
              router.back();
            },
          },
        ],
      );
    } catch (error: any) {
      const message =
        error?.message || "Failed to initiate deposit. Please try again.";
      Alert.alert("Deposit Failed", message);
    } finally {
      if (!redirectedToWebView) {
        setIsProcessing(false);
      }
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const url = navState.url as string;
    if (!url || webViewHandled) {
      return;
    }

    const isSuccess =
      url.includes("payment=success") ||
      url.includes("/payment/success") ||
      url.includes("/callback/success");
    const isFailure =
      url.includes("payment=failed") ||
      url.includes("/payment/failed") ||
      url.includes("/callback/failed");

    if (isSuccess) {
      setWebViewHandled(true);
      setIsProcessing(false);
      setXenditUrl(null);
      const amountLabel = pendingDeposit
        ? formatCurrency(pendingDeposit)
        : "Your deposit";
      setPendingDeposit(null);

      Alert.alert(
        "Deposit Successful",
        `${amountLabel} is being processed. Your balance will refresh shortly.`,
        [
          {
            text: "OK",
            onPress: () => {
              refetchBalance();
              router.back();
            },
          },
        ],
      );
      return;
    }

    if (isFailure) {
      setWebViewHandled(true);
      setIsProcessing(false);
      setXenditUrl(null);
      setPendingDeposit(null);

      Alert.alert(
        "Deposit Failed",
        "Your deposit could not be processed. Please try again.",
        [{ text: "OK" }],
      );
    }
  };

  const handleCancel = () => {
    if (xenditUrl) {
      Alert.alert(
        "Cancel Deposit",
        "Are you sure you want to cancel this deposit?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: () => {
              setXenditUrl(null);
              setIsProcessing(false);
              setPendingDeposit(null);
              setWebViewHandled(false);
            },
          },
        ],
      );
    } else {
      router.back();
    }
  };

  // If WebView is active, show payment screen
  if (xenditUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <WebView
          source={{ uri: xenditUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.webViewLoadingText}>
                Loading payment page...
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <WalletBalanceCard
          balance={walletBalance?.balance || 0}
          isLoading={!walletBalance}
          onRefresh={refetchBalance}
          showDepositButton={false}
        />

        {/* Deposit Amount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <Text style={styles.sectionSubtitle}>
            Minimum ₱100, Maximum ₱100,000
          </Text>

          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={depositAmount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={Colors.textHint}
              maxLength={12}
              accessibilityLabel="Deposit amount"
            />
          </View>
          {amountError && <Text style={styles.amountError}>{amountError}</Text>}

          {/* Preset Amounts */}
          <View style={styles.presetGrid}>
            {presetAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.presetButton,
                  depositAmount === amount.toString() &&
                    styles.presetButtonActive,
                ]}
                onPress={() => handlePresetAmount(amount)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    depositAmount === amount.toString() &&
                      styles.presetButtonTextActive,
                  ]}
                >
                  ₱{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select GCash Account</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which account to use for this deposit
          </Text>

          {paymentMethodsLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginTop: Spacing.md }}
            />
          ) : gcashMethods.length > 0 ? (
            <View style={styles.paymentMethodsList}>
              {gcashMethods.map((method: any) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethodId === method.id &&
                      styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethodId(method.id)}
                >
                  <View style={styles.paymentMethodInfo}>
                    <View style={styles.paymentMethodHeader}>
                      <Ionicons
                        name="wallet-outline"
                        size={24}
                        color={
                          selectedPaymentMethodId === method.id
                            ? Colors.primary
                            : Colors.textSecondary
                        }
                      />
                      <View style={styles.paymentMethodDetails}>
                        <Text
                          style={[
                            styles.paymentMethodName,
                            selectedPaymentMethodId === method.id &&
                              styles.paymentMethodNameSelected,
                          ]}
                        >
                          {method.account_name}
                        </Text>
                        <Text style={styles.paymentMethodNumber}>
                          {method.account_number.replace(
                            /(\d{4})(\d{3})(\d{4})/,
                            "$1 $2 $3",
                          )}
                        </Text>
                      </View>
                    </View>
                    {method.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                    {method.is_verified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={Colors.success}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedPaymentMethodId === method.id &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {selectedPaymentMethodId === method.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={Colors.warning}
                />
                <Text style={styles.infoTitle}>No GCash Account Found</Text>
              </View>
              <Text style={styles.infoText}>
                Please add a GCash account before making a deposit.
              </Text>
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={() => router.push("/profile/payment-methods" as any)}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.addMethodButtonText}>
                  Add GCash Account
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          style={[
            styles.depositButton,
            isDepositDisabled && styles.depositButtonDisabled,
          ]}
          onPress={handleDeposit}
          disabled={isDepositDisabled}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.depositButtonText}>
                Deposit {formattedDepositAmount}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  amountError: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  presetButtonTextActive: {
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  addMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  addMethodButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  depositButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  depositButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  depositButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  webViewLoadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  // Payment Method Selection Styles
  paymentMethodsList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || "#e8f5e9",
  },
  paymentMethodInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  paymentMethodNameSelected: {
    color: Colors.primary,
  },
  paymentMethodNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  primaryBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium as any,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
