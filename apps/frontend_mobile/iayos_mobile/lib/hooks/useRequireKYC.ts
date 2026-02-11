import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useKYC } from "@/lib/hooks/useKYC";

/**
 * Hook for pre-action KYC enforcement on the frontend.
 *
 * Example: const { requireKYC } = useRequireKYC();
 */
export function useRequireKYC() {
  const router = useRouter();
  const { user } = useAuth();
  const { isVerified, isPending, isRejected, hasSubmittedKYC } = useKYC();

  const isKYCVerified = !!user?.kycVerified || isVerified;

  /** Show an alert appropriate to the user's KYC state and offer navigation. */
  const showKYCAlert = useCallback(() => {
    if (isPending) {
      Alert.alert(
        "KYC Under Review",
        "Your identity verification is being reviewed. You'll be able to perform this action once approved.",
        [
          { text: "OK", style: "cancel" },
          {
            text: "Check Status",
            onPress: () => router.push("/kyc/status" as any),
          },
        ],
      );
    } else if (isRejected) {
      Alert.alert(
        "KYC Rejected",
        "Your identity verification was rejected. Please resubmit your documents to continue.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Resubmit",
            onPress: () => router.push("/kyc/upload" as any),
          },
        ],
      );
    } else {
      // Not submitted at all
      Alert.alert(
        "Verification Required",
        "You need to complete identity verification before performing this action.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Verify Now",
            onPress: () => router.push("/kyc/upload" as any),
          },
        ],
      );
    }
  }, [isPending, isRejected, router]);

  /**
   * Call before performing a gated action.
   * Returns `true` if user is KYC-verified (proceed), `false` otherwise (alert shown).
   */
  const requireKYC = useCallback((): boolean => {
    if (isKYCVerified) return true;
    showKYCAlert();
    return false;
  }, [isKYCVerified, showKYCAlert]);

  /**
   * Call from a catch block or response handler when the backend returns
   * `error_code: "KYC_REQUIRED"` (403). Shows the same contextual alert.
   */
  const handleKYCError = useCallback(() => {
    showKYCAlert();
  }, [showKYCAlert]);

  return { requireKYC, handleKYCError, isKYCVerified, showKYCAlert };
}
