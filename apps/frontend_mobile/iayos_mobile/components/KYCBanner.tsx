import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useKYC } from "@/lib/hooks/useKYC";
import { Colors, BorderRadius, Shadows } from "@/constants/theme";

/**
 * Global KYC Verification Banner
 *
 * Displays at the top of the app when user is not KYC verified.
 * - Shows "Verify Now" if KYC not submitted
 * - Shows "Check Status" if KYC submitted but pending/rejected
 */
export function KYCBanner() {
  const { user } = useAuth();
  const { hasSubmittedKYC, kycStatus, isLoading } = useKYC();
  const router = useRouter();

  // Debug logging
  console.log(
    "🔍 KYCBanner - hasSubmittedKYC:",
    hasSubmittedKYC,
    "kycStatus:",
    kycStatus,
    "isLoading:",
    isLoading
  );

  // Don't show banner if user is already verified or not logged in
  if (!user || user.kycVerified || isLoading) {
    return null;
  }

  const handlePress = () => {
    if (hasSubmittedKYC) {
      router.push("/kyc/status");
    } else {
      router.push("/kyc/upload");
    }
  };

  // Different messages based on KYC status
  const getBannerContent = () => {
    console.log(
      "🎯 Getting banner content - hasSubmittedKYC:",
      hasSubmittedKYC,
      "kycStatus:",
      kycStatus
    );

    if (hasSubmittedKYC) {
      if (kycStatus === "PENDING") {
        return {
          icon: "time-outline" as const,
          title: "KYC Under Review",
          subtitle: "Your documents are being verified",
          buttonText: "Check Status",
          iconColor: "#F59E0B",
        };
      } else if (kycStatus === "REJECTED") {
        return {
          icon: "alert-circle-outline" as const,
          title: "KYC Verification Required",
          subtitle: "Your submission needs attention",
          buttonText: "Check Status",
          iconColor: "#EF4444",
        };
      }
    }

    return {
      icon: "shield-checkmark" as const,
      title: "Complete KYC Verification",
      subtitle: "Verify your identity to unlock all features",
      buttonText: "Verify Now",
      iconColor: "#F59E0B",
    };
  };

  const content = getBannerContent();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name={content.icon} size={24} color={content.iconColor} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>{content.buttonText}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFBEB", // amber-50
    borderWidth: 1,
    borderColor: "#FED7AA", // amber-200
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E", // amber-900
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B45309", // amber-700
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B", // amber-500
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 4,
    ...Shadows.sm,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },
});
