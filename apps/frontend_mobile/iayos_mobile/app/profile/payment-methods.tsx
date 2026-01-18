import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";
import * as WebBrowser from "expo-web-browser";

interface PaymentMethod {
  id: number;
  type: "GCASH" | "BANK" | "PAYPAL";
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

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<"GCASH" | "BANK" | "PAYPAL">("GCASH");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

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
  const addMethodMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      account_name: string;
      account_number: string;
      bank_name?: string;
    }) => {
      const response = await apiRequest(ENDPOINTS.ADD_PAYMENT_METHOD, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      // Check if verification is required (GCash with PayMongo)
      if (data.verification_required && data.checkout_url) {
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
                  await WebBrowser.openBrowserAsync(data.checkout_url, {
                    dismissButtonStyle: "close",
                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                  });
                  
                  // Poll for verification status (webhook may take a moment to process)
                  let verified = false;
                  for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s between polls
                    await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
                    const result = await refetch();
                    const methods = result.data?.payment_methods || [];
                    const method = methods.find((m: PaymentMethod) => m.id === data.method_id);
                    if (method?.is_verified) {
                      verified = true;
                      break;
                    }
                  }
                  
                  await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
                  
                  if (verified) {
                    Alert.alert(
                      "Success! ✓",
                      "Your GCash account has been verified and ₱1 has been credited to your wallet!"
                    );
                  } else {
                    // Verification may still be processing
                    Alert.alert(
                      "Verification Processing",
                      "Your payment was received. Verification will complete shortly. Please refresh if your payment method doesn't appear as verified."
                    );
                  }
                } catch (error) {
                  // Fallback to Linking if WebBrowser fails
                  Linking.openURL(data.checkout_url);
                }
              },
            },
          ]
        );
      } else {
        // Bank/PayPal - no verification needed (instant add)
        await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
        await refetch();
        setShowAddForm(false);
        resetForm();
        Alert.alert(
          "Success! ✓", 
          data.message || "Payment method added successfully!"
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
        }
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
        }
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
  };

  const handleAddMethod = () => {
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter account name");
      return;
    }
    if (!accountNumber.trim()) {
      Alert.alert("Error", "Please enter account number");
      return;
    }

    // Type-specific validation
    if (selectedType === "GCASH") {
      // Validate GCash number format (11 digits starting with 09)
      if (!/^09\d{9}$/.test(accountNumber.replace(/\s/g, ""))) {
        Alert.alert("Error", "Invalid GCash number format (e.g., 09123456789)");
        return;
      }
    } else if (selectedType === "BANK") {
      if (!bankName.trim()) {
        Alert.alert("Error", "Please enter bank name");
        return;
      }
      // Validate bank account number (5-20 digits)
      if (!/^\d{5,20}$/.test(accountNumber.replace(/\s/g, ""))) {
        Alert.alert("Error", "Invalid bank account number (5-20 digits)");
        return;
      }
    } else if (selectedType === "PAYPAL") {
      // Validate email format for PayPal
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountNumber)) {
        Alert.alert("Error", "Invalid PayPal email format");
        return;
      }
    }

    addMethodMutation.mutate({
      type: selectedType,
      account_name: accountName,
      account_number: accountNumber,
      bank_name: selectedType === "BANK" ? bankName : undefined,
    });
  };

  const handleDelete = (method: PaymentMethod) => {
    const typeLabel = method.type === "GCASH" ? "GCash account" : method.type === "BANK" ? "bank account" : "PayPal account";
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
      ]
    );
  };

  const handleSetPrimary = (method: PaymentMethod) => {
    if (method.is_primary) return;
    const typeLabel = method.type === "GCASH" ? "GCash account" : method.type === "BANK" ? "bank account" : "PayPal account";
    Alert.alert(
      "Set as Primary",
      `Set this ${typeLabel} as your primary withdrawal method?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Primary",
          onPress: () => setPrimaryMutation.mutate(method.id),
        },
      ]
    );
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "GCASH": return "phone-portrait";
      case "BANK": return "business";
      case "PAYPAL": return "logo-paypal";
      default: return "card";
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case "GCASH": return "GCash";
      case "BANK": return "Bank Account";
      case "PAYPAL": return "PayPal";
      default: return type;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodIconContainer}>
          <Ionicons name={getMethodIcon(method.type) as any} size={24} color={Colors.primary} />
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
          </View>
          <Text style={styles.methodName}>{method.account_name}</Text>
          {method.type === "BANK" && method.bank_name && (
            <Text style={styles.methodBankName}>{method.bank_name}</Text>
          )}
          <Text style={styles.methodNumber}>
            {method.type === "GCASH" 
              ? method.account_number.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3")
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
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
            <Ionicons
              name="information-circle"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              Add your payment accounts for withdrawals (GCash, Bank, or PayPal). Your primary method will be used by default.
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
                      color={selectedType === "GCASH" ? Colors.white : Colors.primary}
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
                      selectedType === "BANK" && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType("BANK")}
                  >
                    <Ionicons
                      name="business"
                      size={20}
                      color={selectedType === "BANK" ? Colors.white : Colors.primary}
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
                      color={selectedType === "PAYPAL" ? Colors.white : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === "PAYPAL" && styles.typeButtonTextActive,
                      ]}
                    >
                      PayPal
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
                  value={accountName}
                  onChangeText={setAccountName}
                  autoCapitalize="words"
                />
              </View>

              {selectedType === "BANK" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., BPI, BDO, Metrobank"
                    value={bankName}
                    onChangeText={setBankName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {selectedType === "GCASH" ? "GCash Number" : selectedType === "BANK" ? "Account Number" : "PayPal Email"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    selectedType === "GCASH" 
                      ? "09123456789" 
                      : selectedType === "BANK"
                      ? "1234567890"
                      : "email@example.com"
                  }
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType={selectedType === "PAYPAL" ? "email-address" : "numeric"}
                  maxLength={selectedType === "GCASH" ? 11 : selectedType === "BANK" ? 20 : undefined}
                  autoCapitalize="none"
                />
              </View>

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
    backgroundColor: Colors.primaryLight,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: BorderRadius.medium,
    gap: 12,
  },
  infoText: {
    ...Typography.body.medium,
    color: Colors.primary,
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
    gap: 8,
  },
  typeButton: {
    flex: 1,
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
    color: Colors.textPrimary,
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
