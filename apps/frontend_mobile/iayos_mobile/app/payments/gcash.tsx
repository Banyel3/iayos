import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing } from "../../constants/theme";

/**
 * GCash Payment Screen - DEPRECATED
 *
 * GCash payment via Xendit has been removed.
 * All payments now go through Wallet (with QR PH deposits).
 * This screen redirects users to the wallet payment flow.
 */
export default function GCashPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobId = params.jobId as string;
  const budget = params.budget as string;
  const title = params.title as string;
  const paymentType = params.paymentType as string;

  useEffect(() => {
    // Show deprecation notice and redirect to wallet payment
    Alert.alert(
      "Payment Method Changed",
      "GCash payments are no longer available. Please use your Wallet instead. You can deposit funds via QR PH if needed.",
      [
        {
          text: "Deposit Funds",
          onPress: () => router.replace("/payments/deposit" as any),
        },
        {
          text: "Go to Wallet Payment",
          onPress: () => {
            router.replace({
              pathname: "/payments/wallet" as any,
              params: { jobId, budget, title, paymentType },
            });
          },
        },
      ],
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="warning" size={64} color={Colors.warning} />
        <Text style={styles.title}>Payment Method Unavailable</Text>
        <Text style={styles.subtitle}>
          GCash payments have been discontinued.{"\n"}
          Please use your Wallet balance instead.
        </Text>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: Spacing.lg }}
        />
        <Text style={styles.redirectText}>Redirecting...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  redirectText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
    marginTop: Spacing.sm,
  },
});
