import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing } from "../../constants/theme";
import PaymentSummaryCard from "../../components/PaymentSummaryCard";
import {
  useCreateXenditInvoice,
  useCreateEscrowPayment,
  calculateEscrowAmount,
} from "../../lib/hooks/usePayments";

export default function GCashPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobId = params.jobId ? parseInt(params.jobId as string) : null;
  const jobBudget = params.budget ? parseFloat(params.budget as string) : 0;
  const jobTitle = params.title as string || "Untitled Job";

  const [xenditUrl, setXenditUrl] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const createInvoice = useCreateXenditInvoice();
  const createEscrowPayment = useCreateEscrowPayment();

  const { total } = calculateEscrowAmount(jobBudget);

  // Create Xendit invoice on mount
  useEffect(() => {
    if (jobId && jobBudget) {
      createInvoice.mutate(
        { jobId, amount: total },
        {
          onSuccess: (data) => {
            setXenditUrl(data.invoiceUrl);
          },
          onError: () => {
            Alert.alert(
              "Error",
              "Failed to create payment invoice. Please try again.",
              [{ text: "Go Back", onPress: () => router.back() }]
            );
          },
        }
      );
    }
  }, [jobId, jobBudget]);

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Check if payment is completed (Xendit success callback)
    if (url.includes("/payment/success") || url.includes("/callback/success")) {
      handlePaymentSuccess();
    } else if (url.includes("/payment/failed") || url.includes("/callback/failed")) {
      handlePaymentFailure();
    }
  };

  const handlePaymentSuccess = () => {
    if (paymentCompleted) return;
    setPaymentCompleted(true);

    // Create escrow payment record
    createEscrowPayment.mutate(
      {
        jobId: jobId!,
        amount: total,
        paymentMethod: "gcash",
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Payment Successful",
            "Your GCash payment has been processed successfully.",
            [
              {
                text: "View Status",
                onPress: () => router.push(`/payments/status?jobId=${jobId}`),
              },
            ]
          );
        },
      }
    );
  };

  const handlePaymentFailure = () => {
    Alert.alert(
      "Payment Failed",
      "Your GCash payment could not be processed. Please try again.",
      [
        { text: "Try Again", onPress: () => router.back() },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", onPress: () => router.back() },
      ]
    );
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
        <TouchableOpacity onPress={handleCancel} style={styles.backIcon}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>GCash Payment</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {jobTitle}
          </Text>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <PaymentSummaryCard jobBudget={jobBudget} showBreakdown={false} compact />
      </View>

      {/* WebView or Loading */}
      {createInvoice.isPending || !xenditUrl ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparing GCash payment...</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: xenditUrl }}
          style={styles.webview}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />
      )}
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
  summaryContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
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
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});
