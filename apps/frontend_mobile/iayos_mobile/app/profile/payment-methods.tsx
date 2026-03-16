import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Colors, Typography, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";
import * as WebBrowser from "expo-web-browser";
import { Picker } from "@react-native-picker/picker";

interface PaymentMethod {
  id: number;
  type:
    | "GCASH"
    | "BANK"
    | "PAYPAL"
    | "VISA"
    | "MASTERCARD"
    | "GRABPAY"
    | "MAYA";
  account_name: string;
  account_number: string;
  bank_name?: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[];
}

const PHILIPPINE_BANK_OPTIONS: string[] = [
  "AllBank (A Thrift Bank), Inc.",
  "Asia United Bank (AUB)",
  "BDO Unibank, Inc.",
  "BPI (Bank of the Philippine Islands)",
  "Bank of Commerce",
  "China Banking Corporation (Chinabank)",
  "CTBC Bank (Philippines) Corp.",
  "Development Bank of the Philippines (DBP)",
  "EastWest Bank",
  "Land Bank of the Philippines",
  "Maybank Philippines, Inc.",
  "Metrobank (Metropolitan Bank & Trust Co.)",
  "Philippine Bank of Communications (PBCom)",
  "Philippine National Bank (PNB)",
  "PSBank (Philippine Savings Bank)",
  "RCBC (Rizal Commercial Banking Corporation)",
  "Robinsons Bank Corporation",
  "Security Bank Corporation",
  "Union Bank of the Philippines (UnionBank)",
  "United Coconut Planters Bank (UCPB)",
  "Veterans Bank",
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "GCASH" | "BANK" | "PAYPAL" | "VISA" | "MASTERCARD" | "GRABPAY" | "MAYA"
  >("GCASH");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = useState("");
  const [cardExpiryYear, setCardExpiryYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Fetch payment methods
  const {
    data: methodsData,
    isLoading,
    error,
    refetch,
  } = useQuery<PaymentMethodsResponse>({
    queryKey: ["payment-methods"],
    queryFn: async (): Promise<PaymentMethodsResponse> => {
      const response = await apiRequest(ENDPOINTS.PAYMENT_METHODS);
      const data = await response.json();
      return data as PaymentMethodsResponse;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Extract payment methods array with safe access
  const paymentMethods = methodsData?.payment_methods || [];

  // Add payment method mutation
  // Response type for add payment method
  interface AddPaymentMethodResponse {
    success?: boolean;
    verification_required?: boolean;
    checkout_url?: string;
    method_id?: number;
    message?: string;
  }

  const addMethodMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      account_name: string;
      account_number: string;
      bank_name?: string;
      card_number?: string;
      card_expiry_month?: number;
      card_expiry_year?: number;
      card_cvv?: string;
    }): Promise<AddPaymentMethodResponse> => {
      const response = await apiRequest(ENDPOINTS.ADD_PAYMENT_METHOD, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as AddPaymentMethodResponse & {
        error?: string;
      };

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to add payment method");
      }

      return result;
    },
    onSuccess: async (data: AddPaymentMethodResponse) => {
      // Check if verification is required (GCash with PayMongo)
      if (data.verification_required && data.checkout_url) {
        const checkoutUrl = data.checkout_url; // Store in const for type narrowing
        setShowAddForm(false);
        resetForm();

        // Show info about the verification process
        Alert.alert(
          "GCash Verification Required",
          "You'll be redirected to PayMongo to verify your GCash account. A ₱1 verification fee (credited to your wallet) will confirm you own this account.",
          [
            {
              text: "Continue",
              onPress: async () => {
                try {
                  // Open PayMongo checkout in browser
                  await WebBrowser.openBrowserAsync(checkoutUrl, {
                    dismissButtonStyle: "close",
                    presentationStyle:
                      WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                  });

                  // Poll for verification status (webhook may take a moment to process)
                  let verified = false;
                  for (let i = 0; i < 5; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait 1.5s between polls
                    await queryClient.invalidateQueries({
                      queryKey: ["payment-methods"],
                    });
                    const result = await refetch();
                    const methods = result.data?.payment_methods || [];
                    const method = methods.find(
                      (m: PaymentMethod) => m.id === data.method_id,
                    );
                    if (method?.is_verified) {
                      verified = true;
                      break;
                    }
                  }

                  await queryClient.invalidateQueries({
                    queryKey: ["wallet-balance"],
                  });

                  if (verified) {
                    Alert.alert(
                      "Success! ✓",
                      "Your GCash account has been verified and ₱1 has been credited to your wallet!",
                    );
                  } else {
                    // Verification may still be processing
                    Alert.alert(
                      "Verification Processing",
                      "Your payment was received. Verification will complete shortly. Please refresh if your payment method doesn't appear as verified.",
                    );
                  }
                } catch (error) {
                  // Fallback to Linking if WebBrowser fails
                  Linking.openURL(checkoutUrl);
                }
              },
            },
          ],
        );
      } else {
        // Bank/PayPal - no verification needed (instant add)
        await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
        await refetch();
        setShowAddForm(false);
        resetForm();
        Alert.alert(
          "Success! ✓",
          data.message || "Payment method added successfully!",
        );
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add payment method");
    },
  });

  // Delete payment method mutation
  const deleteMethodMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiRequest(
        ENDPOINTS.DELETE_PAYMENT_METHOD(methodId),
        {
          method: "DELETE",
        },
      );
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      await refetch();
      Alert.alert("Success", "Payment method removed successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to remove payment method");
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiRequest(
        ENDPOINTS.SET_PRIMARY_PAYMENT_METHOD(methodId),
        {
          method: "POST",
        },
      );
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      await refetch();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to set primary method");
    },
  });

  const resetForm = () => {
    setSelectedType("GCASH");
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setCardNumber("");
    setCardExpiryMonth("");
    setCardExpiryYear("");
    setCardCvv("");
  };

  const formatCardNumberInput = (input: string) => {
    const digitsOnly = input.replace(/\D/g, "").slice(0, 16);
    return digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardNumberChange = (value: string) => {
    setCardNumber(formatCardNumberInput(value));
  };

  const handleCardCvvChange = (value: string) => {
    setCardCvv(value.replace(/\D/g, "").slice(0, 3));
  };

  const handleExpiryMonthChange = (value: string) => {
    setCardExpiryMonth(value.replace(/\D/g, "").slice(0, 2));
  };

  const handleExpiryYearChange = (value: string) => {
    setCardExpiryYear(value.replace(/\D/g, "").slice(0, 4));
  };

  const isLuhnValid = (cardNumberValue: string) => {
    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumberValue.length - 1; i >= 0; i--) {
      let digit = Number(cardNumberValue[i]);
      if (Number.isNaN(digit)) return false;

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  const handleAddMethod = () => {
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter account name");
      return;
    }
    let cleanAccountNumber = accountNumber.trim();
    const payload: {
      type: string;
      account_name: string;
      account_number: string;
      bank_name?: string;
      card_number?: string;
      card_expiry_month?: number;
      card_expiry_year?: number;
      card_cvv?: string;
    } = {
      type: selectedType,
      account_name: accountName.trim(),
      account_number: cleanAccountNumber,
    };

    // Type-specific validation
    if (
      selectedType === "GCASH" ||
      selectedType === "MAYA" ||
      selectedType === "GRABPAY"
    ) {
      if (!accountNumber.trim()) {
        Alert.alert("Error", "Please enter mobile number");
        return;
      }
      // Remove spaces/dashes
      cleanAccountNumber = cleanAccountNumber.replace(/[\s-]/g, "");

      // Validate PH mobile number format (11 digits starting with 09)
      if (!/^09\d{9}$/.test(cleanAccountNumber)) {
        Alert.alert(
          "Error",
          `Invalid ${selectedType === "GCASH" ? "GCash" : "Maya"} number format (e.g., 09123456789)`,
        );
        return;
      }
    } else if (selectedType === "BANK") {
      if (!accountNumber.trim()) {
        Alert.alert("Error", "Please enter account number");
        return;
      }
      if (!bankName.trim()) {
        Alert.alert("Error", "Please select bank name");
        return;
      }
      if (!PHILIPPINE_BANK_OPTIONS.includes(bankName.trim())) {
        Alert.alert(
          "Error",
          "Please select a valid Philippine bank from the dropdown",
        );
        return;
      }
      // Validate bank account number (5-20 digits)
      if (!/^\d{5,20}$/.test(accountNumber.replace(/\s/g, ""))) {
        Alert.alert("Error", "Invalid bank account number (5-20 digits)");
        return;
      }
      payload.bank_name = bankName.trim();
    } else if (selectedType === "PAYPAL") {
      if (!accountNumber.trim()) {
        Alert.alert("Error", "Please enter PayPal email");
        return;
      }
      const email = cleanAccountNumber.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert("Error", "Please enter a valid PayPal email");
        return;
      }
      cleanAccountNumber = email;
    } else if (selectedType === "VISA" || selectedType === "MASTERCARD") {
      const card = cardNumber.replace(/[\s-]/g, "");
      const month = cardExpiryMonth.replace(/\D/g, "");
      const year = cardExpiryYear.replace(/\D/g, "");
      const cvv = cardCvv.replace(/\D/g, "");

      if (!/^\d{16}$/.test(card)) {
        Alert.alert("Error", "Card number must be 16 digits");
        return;
      }
      if (!isLuhnValid(card)) {
        Alert.alert(
          "Error",
          "Invalid card number. Random 16-digit numbers are not accepted. Use a real card number or a Luhn-valid test number.",
        );
        return;
      }
      if (!/^\d{2}$/.test(month) || Number(month) < 1 || Number(month) > 12) {
        Alert.alert("Error", "Enter a valid expiry month (MM)");
        return;
      }
      if (!/^\d{4}$/.test(year)) {
        Alert.alert("Error", "Enter a valid expiry year (YYYY)");
        return;
      }
      if (!/^\d{3}$/.test(cvv)) {
        Alert.alert("Error", "CVV must be exactly 3 digits");
        return;
      }

      cleanAccountNumber = card.slice(-4);
      payload.card_number = card;
      payload.card_expiry_month = Number(month);
      payload.card_expiry_year = Number(year);
      payload.card_cvv = cvv;
    }

    payload.account_number = cleanAccountNumber;
    addMethodMutation.mutate(payload);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "GCASH":
        return "GCash account";
      case "MAYA":
        return "Maya account";
      case "BANK":
        return "bank account";
      case "PAYPAL":
        return "PayPal account";
      case "VISA":
        return "Visa/card account";
      case "MASTERCARD":
        return "Mastercard/card account";
      case "GRABPAY":
        return "GrabPay account";
      default:
        return "account";
    }
  };

  const handleDelete = (method: PaymentMethod) => {
    const typeLabel = getTypeLabel(method.type);
    Alert.alert(
      "Remove Payment Method",
      `Are you sure you want to remove this ${typeLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteMethodMutation.mutate(method.id),
        },
      ],
    );
  };

  const handleSetPrimary = (method: PaymentMethod) => {
    if (method.is_primary) return;
    const typeLabel = getTypeLabel(method.type);
    Alert.alert(
      "Set as Primary",
      `Set this ${typeLabel} as your primary withdrawal method?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Primary",
          onPress: () => setPrimaryMutation.mutate(method.id),
        },
      ],
    );
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "GCASH":
        return "phone-portrait";
      case "MAYA":
        return "wallet";
      case "BANK":
        return "business";
      case "PAYPAL":
        return "logo-paypal";
      case "VISA":
        return "card";
      case "MASTERCARD":
        return "card";
      case "GRABPAY":
        return "phone-portrait";
      default:
        return "card";
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case "GCASH":
        return "GCash";
      case "MAYA":
        return "Maya";
      case "BANK":
        return "Bank Account";
      case "PAYPAL":
        return "PayPal";
      case "VISA":
        return "Visa/Card";
      case "MASTERCARD":
        return "Mastercard/Card";
      case "GRABPAY":
        return "GrabPay";
      default:
        return type;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodIconContainer}>
          <Ionicons
            name={getMethodIcon(method.type) as any}
            size={24}
            color={Colors.primary}
          />
        </View>
        <View style={styles.methodInfo}>
          <View style={styles.methodTitleRow}>
            <Text style={styles.methodType}>{getMethodLabel(method.type)}</Text>
            {method.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
            {method.is_verified && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Colors.success}
              />
            )}
            {!method.is_verified && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.methodName}>{method.account_name}</Text>
          {method.type === "BANK" && method.bank_name && (
            <Text style={styles.methodBankName}>{method.bank_name}</Text>
          )}
          <Text style={styles.methodNumber}>
            {method.type === "GCASH"
              ? method.account_number.replace(
                  /(\d{4})(\d{3})(\d{4})/,
                  "$1 $2 $3",
                )
              : method.account_number}
          </Text>
        </View>
      </View>
      <View style={styles.methodActions}>
        {!method.is_primary && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetPrimary(method)}
            disabled={setPrimaryMutation.isPending}
          >
            <Ionicons name="star-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionText}>Set Primary</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={() => handleDelete(method)}
          disabled={deleteMethodMutation.isPending}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={[styles.actionText, styles.actionTextDanger]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/profile")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              Add your payout accounts (GCash, Maya, GrabPay, Bank, PayPal,
              Visa, or Mastercard). Your primary method will be used by default.
            </Text>
          </View>

          {/* Payment Methods List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading payment methods...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.errorText}>
                Failed to load payment methods
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetch()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="wallet-outline"
                size={64}
                color={Colors.textHint}
              />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptyText}>
                Add your first payment method to receive payments and withdraw
                funds.
              </Text>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map(renderPaymentMethod)}
            </View>
          )}

          {/* Add New Method Form */}
          {showAddForm ? (
            <View style={styles.addForm}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add Payment Method</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "GCASH" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("GCASH")}
                  >
                    <Ionicons
                      name="phone-portrait"
                      size={20}
                      color={
                        selectedType === "GCASH" ? Colors.white : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "GCASH" && styles.typeButtonTextActive,
                      ]}
                    >
                      GCash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "MAYA" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("MAYA")}
                  >
                    <Ionicons
                      name="wallet"
                      size={20}
                      color={
                        selectedType === "MAYA" ? Colors.white : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "MAYA" && styles.typeButtonTextActive,
                      ]}
                    >
                      Maya
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "BANK" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("BANK")}
                  >
                    <Ionicons
                      name="business"
                      size={20}
                      color={
                        selectedType === "BANK" ? Colors.white : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "BANK" && styles.typeButtonTextActive,
                      ]}
                    >
                      Bank
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "PAYPAL" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("PAYPAL")}
                  >
                    <Ionicons
                      name="logo-paypal"
                      size={20}
                      color={
                        selectedType === "PAYPAL"
                          ? Colors.white
                          : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "PAYPAL" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      PayPal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "GRABPAY" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("GRABPAY")}
                  >
                    <Ionicons
                      name="phone-portrait"
                      size={20}
                      color={
                        selectedType === "GRABPAY"
                          ? Colors.white
                          : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "GRABPAY" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      GrabPay
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "VISA" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("VISA")}
                  >
                    <Ionicons
                      name="card"
                      size={20}
                      color={
                        selectedType === "VISA" ? Colors.white : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "VISA" && styles.typeButtonTextActive,
                      ]}
                    >
                      Visa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === "MASTERCARD" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("MASTERCARD")}
                  >
                    <Ionicons
                      name="card"
                      size={20}
                      color={
                        selectedType === "MASTERCARD"
                          ? Colors.white
                          : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "MASTERCARD" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Mastercard
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Juan Dela Cruz"
                  placeholderTextColor={Colors.textHint}
                  value={accountName}
                  onChangeText={setAccountName}
                  autoCapitalize="words"
                />
              </View>

              {selectedType === "BANK" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      mode="dropdown"
                      selectedValue={bankName}
                      onValueChange={(value) =>
                        setBankName(String(value || ""))
                      }
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                      dropdownIconColor={Colors.textSecondary}
                    >
                      <Picker.Item label="Select your bank" value="" />
                      {PHILIPPINE_BANK_OPTIONS.map((bank) => (
                        <Picker.Item key={bank} label={bank} value={bank} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {(selectedType === "GCASH" ||
                selectedType === "MAYA" ||
                selectedType === "GRABPAY") && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09123456789"
                    placeholderTextColor={Colors.textHint}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    maxLength={11}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {selectedType === "BANK" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234567890"
                    placeholderTextColor={Colors.textHint}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    maxLength={20}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {selectedType === "PAYPAL" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PayPal Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.textHint}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {(selectedType === "VISA" || selectedType === "MASTERCARD") && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="4111 1111 1111 1111"
                      placeholderTextColor={Colors.textHint}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                  <View style={styles.cardRow}>
                    <View style={[styles.inputGroup, styles.cardField]}>
                      <Text style={styles.inputLabel}>Exp. Month</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM"
                        placeholderTextColor={Colors.textHint}
                        value={cardExpiryMonth}
                        onChangeText={handleExpiryMonthChange}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.cardField]}>
                      <Text style={styles.inputLabel}>Exp. Year</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY"
                        placeholderTextColor={Colors.textHint}
                        value={cardExpiryYear}
                        onChangeText={handleExpiryYearChange}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.cardField]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={Colors.textHint}
                        value={cardCvv}
                        onChangeText={handleCardCvvChange}
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  <Text style={styles.cardSecurityNote}>
                    For security, CVV is only used for validation and is never
                    stored. We only store the card last4. Use a real card
                    number or a Luhn-valid test card (not random digits).
                  </Text>
                </>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  addMethodMutation.isPending && styles.submitButtonDisabled,
                ]}
                onPress={handleAddMethod}
                disabled={addMethodMutation.isPending}
              >
                {addMethodMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color={Colors.white}
                    />
                    <Text style={styles.submitButtonText}>
                      Add Payment Method
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E0F2FE",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: BorderRadius.medium,
    gap: 12,
  },
  infoText: {
    ...Typography.body.medium,
    color: Colors.info,
    flex: 1,
  },
  loadingContainer: {
    padding: 48,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  errorContainer: {
    padding: 48,
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryText: {
    ...Typography.body.medium,
    color: Colors.white,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  methodsList: {
    padding: 16,
    gap: 12,
  },
  methodCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  methodHeader: {
    flexDirection: "row",
    gap: 12,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: {
    flex: 1,
    gap: 4,
  },
  methodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodType: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  primaryBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  primaryText: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    fontSize: 10,
  },
  pendingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  pendingText: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.warning,
    fontSize: 10,
  },
  methodName: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  methodBankName: {
    ...Typography.body.small,
    color: Colors.textHint,
    fontStyle: "italic",
  },
  methodNumber: {
    ...Typography.body.medium,
    color: Colors.textHint,
  },
  methodActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonDanger: {
    borderColor: Colors.errorLight,
  },
  actionText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontSize: 13,
  },
  actionTextDanger: {
    color: Colors.error,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
  },
  addForm: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    minWidth: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.body.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: 12,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  picker: {
    color: Colors.textPrimary,
    minHeight: 50,
  },
  pickerItem: {
    color: Colors.textPrimary,
  },
  cardRow: {
    flexDirection: "row",
    gap: 8,
  },
  cardField: {
    flex: 1,
  },
  cardSecurityNote: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: BorderRadius.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
  },
  bottomSpacing: {
    height: 32,
  },
});
