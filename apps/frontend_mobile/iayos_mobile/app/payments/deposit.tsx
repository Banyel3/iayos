import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Share,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import {
  useWalletDeposit,
  useWalletDepositGCash,
  useWalletBalance,
  formatCurrency,
  WalletDepositResponse,
} from "../../lib/hooks/usePayments";
import WalletBalanceCard from "../../components/WalletBalanceCard";
import { ENDPOINTS } from "../../lib/api/config";

/**
 * Wallet Deposit Screen
 *
 * Allows users to deposit funds to wallet via QR PH or GCash Direct (testing):
 * - Enter deposit amount
 * - Select payment method (QR PH or GCash Direct in testing mode)
 * - Create PayMongo checkout session
 * - Display WebView for payment (QR code shown)
 * - Option to download/share QR code for mobile users
 * - Detect payment success/failure
 * - Update wallet balance
 *
 * Route params: amount (optional)
 */

// Payment method type
type PaymentMethod = "qrph" | "gcash";

export default function WalletDepositScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();

  const [depositAmount, setDepositAmount] = useState(params.amount || "");
  const [xenditUrl, setXenditUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pendingDeposit, setPendingDeposit] = useState<number | null>(null);
  const [webViewHandled, setWebViewHandled] = useState(false);

  // TODO: REMOVE FOR PROD - Testing mode for GCash direct
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("qrph");

  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const depositMutation = useWalletDeposit();
  // TODO: REMOVE FOR PROD - GCash direct deposit for testing
  const depositGCashMutation = useWalletDepositGCash();

  // Fetch config to check if testing mode is enabled
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(ENDPOINTS.MOBILE_CONFIG);
        if (response.ok) {
          const config = await response.json();
          setIsTestingMode(config.testing === true);
        }
      } catch (error) {
        console.log("Failed to fetch mobile config:", error);
      }
    };
    fetchConfig();
  }, []);

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

      // TODO: REMOVE FOR PROD - Use GCash direct in testing mode if selected
      let response: WalletDepositResponse;
      if (isTestingMode && selectedPaymentMethod === "gcash") {
        // GCash Direct checkout - testing only
        response = await depositGCashMutation.mutateAsync({ amount });
      } else {
        // QR PH payment - standard flow
        response = await depositMutation.mutateAsync({ amount });
      }

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

  // Intercept navigation requests BEFORE they load to catch success/failure redirects
  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const url = request.url as string;

    if (!url || webViewHandled) {
      return true;
    }

    const isSuccess =
      url.includes("payment=success") ||
      url.includes("/payment/success") ||
      url.includes("/callback/success") ||
      url.includes("?status=success");
    const isFailure =
      url.includes("payment=failed") ||
      url.includes("/payment/failed") ||
      url.includes("/callback/failed") ||
      url.includes("?status=failed");

    if (isSuccess) {
      // Prevent loading the redirect URL - close WebView instead
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
      return false; // Don't load the URL
    }

    if (isFailure) {
      // Prevent loading the redirect URL - close WebView instead
      setWebViewHandled(true);
      setIsProcessing(false);
      setXenditUrl(null);
      setPendingDeposit(null);

      Alert.alert(
        "Deposit Failed",
        "Your deposit could not be processed. Please try again.",
        [{ text: "OK" }],
      );
      return false; // Don't load the URL
    }

    return true; // Allow all other URLs to load normally
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

  const handleSharePaymentLink = async () => {
    if (!xenditUrl) return;
    try {
      await Share.share({
        message: `Please scan this QR code to complete my deposit payment:\n${xenditUrl}`,
        url: xenditUrl,
        title: "Share Payment Link",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOpenInBrowser = async () => {
    if (!xenditUrl) return;
    try {
      await Linking.openURL(xenditUrl);
    } catch (error) {
      Alert.alert("Error", "Could not open browser");
    }
  };

  const handleSaveQROptions = () => {
    Alert.alert("Save QR Code", "Choose how you'd like to save the QR code:", [
      {
        text: "Open in Browser",
        onPress: () => {
          // Open in browser where user can long-press to save QR image
          handleOpenInBrowser();
        },
      },
      {
        text: "Share Link",
        onPress: handleSharePaymentLink,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSaveQROptions}
              style={styles.headerActionButton}
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSharePaymentLink}
              style={styles.headerActionButton}
            >
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tip for mobile users */}
        <View style={styles.mobileTipBar}>
          <Ionicons
            name="information-circle"
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.mobileTipText}>
            Tap <Text style={{ fontWeight: "600" }}>Download</Text> to save QR,
            or <Text style={{ fontWeight: "600" }}>Share</Text> to send to
            another device
          </Text>
        </View>

        <WebView
          source={{ uri: xenditUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
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

        {/* TODO: REMOVE FOR PROD - Payment Method Selector (Testing Mode Only) */}
        {isTestingMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <Text style={styles.sectionSubtitle}>
              🧪 Testing Mode - Choose payment method
            </Text>

            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  selectedPaymentMethod === "qrph" &&
                    styles.paymentMethodButtonActive,
                ]}
                onPress={() => setSelectedPaymentMethod("qrph")}
              >
                <Ionicons
                  name="qr-code"
                  size={24}
                  color={
                    selectedPaymentMethod === "qrph"
                      ? Colors.white
                      : Colors.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === "qrph" &&
                      styles.paymentMethodTextActive,
                  ]}
                >
                  QR PH
                </Text>
                <Text
                  style={[
                    styles.paymentMethodSubtext,
                    selectedPaymentMethod === "qrph" &&
                      styles.paymentMethodSubtextActive,
                  ]}
                >
                  Any banking app
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  selectedPaymentMethod === "gcash" &&
                    styles.paymentMethodButtonActive,
                ]}
                onPress={() => setSelectedPaymentMethod("gcash")}
              >
                <Ionicons
                  name="wallet"
                  size={24}
                  color={
                    selectedPaymentMethod === "gcash"
                      ? Colors.white
                      : Colors.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === "gcash" &&
                      styles.paymentMethodTextActive,
                  ]}
                >
                  Direct Deposit
                </Text>
                <Text
                  style={[
                    styles.paymentMethodSubtext,
                    selectedPaymentMethod === "gcash" &&
                      styles.paymentMethodSubtextActive,
                  ]}
                >
                  Test Only - Instant
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Info Card - Dynamic based on selected method */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons
              name={selectedPaymentMethod === "gcash" ? "wallet" : "qr-code"}
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.infoTitle}>
              {selectedPaymentMethod === "gcash"
                ? "Direct Test Deposit"
                : "QR PH Payment"}
            </Text>
          </View>
          {selectedPaymentMethod === "gcash" ? (
            <>
              <Text style={styles.infoText}>
                🧪 <Text style={{ fontWeight: "600" }}>Testing Mode:</Text>{" "}
                Funds will be added to your wallet instantly without any payment
                gateway. No real money is involved.
              </Text>
              <Text
                style={[
                  styles.infoText,
                  { marginTop: Spacing.sm, color: Colors.warning },
                ]}
              >
                ⚠️ This option is for testing only and will be removed in
                production.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.infoText}>
                You'll be shown a QR code that you can scan with any Philippine
                banking app (GCash, Maya, BPI, BDO, UnionBank, etc.) to complete
                your deposit.
              </Text>
              <Text style={[styles.infoText, { marginTop: Spacing.sm }]}>
                Since you're on your phone, you can save or share the QR code to
                scan from another device.
              </Text>
            </>
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
  shareButton: {
    padding: Spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerActionButton: {
    padding: Spacing.xs,
  },
  mobileTipBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  mobileTipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    flex: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  // TODO: REMOVE FOR PROD - Payment method selector styles
  paymentMethodContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  paymentMethodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  paymentMethodTextActive: {
    color: Colors.white,
  },
  paymentMethodSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  paymentMethodSubtextActive: {
    color: Colors.white,
    opacity: 0.8,
  },
});
