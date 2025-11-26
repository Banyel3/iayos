/**
 * Wallet Withdraw Screen
 *
 * Features:
 * - Amount input with validation (min ₱100)
 * - GCash account selection from saved payment methods
 * - Balance check and display
 * - Optional notes field
 * - Xendit disbursement integration
 * - Immediate balance deduction
 * - Success confirmation with transaction details
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWallet, useWithdraw } from "@/lib/hooks/useWallet";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";

interface PaymentMethod {
  id: number;
  type: "GCASH";
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[];
}

interface WithdrawResponse {
  success: boolean;
  transaction_id: number;
  new_balance: number;
  message?: string;
}

export default function WithdrawScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useWallet();

  // Fetch payment methods
  const {
    data: paymentMethodsData,
    isLoading: methodsLoading,
  } = useQuery<PaymentMethodsResponse>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.PAYMENT_METHODS);
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = (await response.json()) as PaymentMethodsResponse;
      return data;
    },
  });

  // Withdraw mutation
  const withdrawMutation = useWithdraw();

  const balance = (walletData as { balance: number })?.balance || 0;
  const amountNum = parseFloat(amount) || 0;
  const paymentMethods = paymentMethodsData?.payment_methods || [];
  const selectedMethod = paymentMethods.find(
    (m: PaymentMethod) => m.id === selectedMethodId
  );

  // Only show GCash methods
  const gcashMethods = paymentMethods.filter(
    (m: PaymentMethod) => m.type === "GCASH"
  );

  // Check if user has GCash payment method on mount
  useEffect(() => {
    if (!methodsLoading && paymentMethodsData && gcashMethods.length === 0) {
      Alert.alert(
        "GCash Account Required",
        "You need to add a GCash account before you can withdraw funds. Would you like to add one now?",
        [
          {
            text: "Cancel",
            onPress: () => router.back(),
            style: "cancel",
          },
          {
            text: "Add GCash Account",
            onPress: () => {
              router.back();
              router.push("/profile/payment-methods" as any);
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [paymentMethodsData, methodsLoading, gcashMethods.length]);

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    // Only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    setAmount(cleaned);
  };

  const handleWithdraw = async () => {
    // Validation
    if (!amount || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (amountNum < 100) {
      Alert.alert("Minimum Amount", "Minimum withdrawal amount is ₱100");
      return;
    }

    if (amountNum > balance) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ₱${balance.toFixed(2)} available`
      );
      return;
    }

    // Final check: Ensure user has GCash account
    if (gcashMethods.length === 0) {
      Alert.alert(
        "GCash Account Required",
        "Please add a GCash account first",
        [
          {
            text: "Add GCash Account",
            onPress: () => router.push("/profile/payment-methods" as any),
          },
        ]
      );
      return;
    }

    if (!selectedMethodId) {
      Alert.alert("Select Account", "Please select a GCash account");
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      "Confirm Withdrawal",
      `Withdraw ₱${amountNum.toFixed(2)} to ${selectedMethod?.account_number}?\n\nFunds will be transferred within 1-3 business days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "default",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            try {
              const result = await withdrawMutation.mutateAsync({
                amount: amountNum,
                payment_method_id: selectedMethodId,
                notes: notes || undefined,
              });

              // Show success modal
              setShowSuccess(true);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );

              // Navigate after 2 seconds
              setTimeout(() => {
                router.back();
              }, 2000);
            } catch (error: any) {
              Alert.alert(
                "Withdrawal Failed",
                error.message || "An error occurred"
              );
            }
          },
        },
      ]
    );
  };

  if (walletLoading || methodsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={Colors.success}
            />
          </View>
          <Text style={styles.successTitle}>Withdrawal Successful!</Text>
          <Text style={styles.successMessage}>
            ₱{amountNum.toFixed(2)} will be transferred to your GCash account
            within 1-3 business days.
          </Text>
          <View style={styles.successDetails}>
            <Text style={styles.successDetails}>
              Transaction ID:{" "}
              {(withdrawMutation.data as WithdrawResponse)?.transaction_id}
            </Text>
            <Text style={styles.successDetails}>
              New Balance: ₱
              {(
                withdrawMutation.data as WithdrawResponse
              )?.new_balance?.toFixed(2)}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₱{balance.toFixed(2)}</Text>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={styles.helperText}>Minimum withdrawal: ₱100.00</Text>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.quickAmountBtn,
                    preset > balance && styles.quickAmountBtnDisabled,
                  ]}
                  onPress={() => {
                    if (preset <= balance) {
                      setAmount(preset.toString());
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  disabled={preset > balance}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      preset > balance && styles.quickAmountTextDisabled,
                    ]}
                  >
                    ₱{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* GCash Account Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GCash Account</Text>
              <TouchableOpacity
                onPress={() => router.push("/profile/payment-methods" as any)}
              >
                <Text style={styles.addAccountLink}>+ Add Account</Text>
              </TouchableOpacity>
            </View>

            {gcashMethods.length === 0 ? (
              <View style={styles.noMethodsCard}>
                <Ionicons
                  name="card-outline"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.noMethodsText}>
                  No GCash accounts found
                </Text>
                <TouchableOpacity
                  style={styles.addMethodBtn}
                  onPress={() => router.push("/profile/payment-methods" as any)}
                >
                  <Text style={styles.addMethodBtnText}>Add GCash Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              gcashMethods.map((method: PaymentMethod) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethodId === method.id && styles.methodCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedMethodId(method.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons
                      name="phone-portrait"
                      size={24}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.account_name}</Text>
                    <Text style={styles.methodNumber}>
                      {method.account_number}
                    </Text>
                  </View>
                  {method.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  {selectedMethodId === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.white}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Notes (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add a note for this withdrawal..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{notes.length}/200</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              • Withdrawals are processed within 1-3 business days{"\n"}•
              Minimum withdrawal amount is ₱100{"\n"}• No fees for GCash
              withdrawals{"\n"}• Balance will be deducted immediately
            </Text>
          </View>
        </ScrollView>

        {/* Footer with Withdraw Button */}
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Withdraw Amount:</Text>
            <Text style={styles.summaryAmount}>₱{amountNum.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>New Balance:</Text>
            <Text style={styles.summaryNewBalance}>
              ₱{(balance - amountNum).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              (withdrawMutation.isPending ||
                !amount ||
                amountNum < 100 ||
                amountNum > balance ||
                !selectedMethodId) &&
                styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={
              withdrawMutation.isPending ||
              !amount ||
              amountNum < 100 ||
              amountNum > balance ||
              !selectedMethodId
            }
          >
            {withdrawMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons
                  name="arrow-down-circle"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.withdrawButtonText}>Withdraw Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: Typography.fontSize["4xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  addAccountLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.small,
  },
  currencySymbol: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  quickAmountBtnDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  quickAmountText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  quickAmountTextDisabled: {
    color: Colors.textLight,
  },
  noMethodsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl * 2,
    alignItems: "center",
    ...Shadows.small,
  },
  noMethodsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addMethodBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  addMethodBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  methodNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  verifiedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryNewBalance: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  withdrawButton: {
    flexDirection: "row",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  withdrawButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl * 2,
  },
  successIcon: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  successDetails: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    gap: Spacing.sm,
  },
  successDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
