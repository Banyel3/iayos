import { useEffect, useRef } from "react";
import { Alert, DeviceEventEmitter } from "react-native";
import { useRouter } from "expo-router";
import { useKYC } from "@/lib/hooks/useKYC";

/**
 * Global listener for KYC_REQUIRED events emitted by the apiRequest interceptor.
 * Mount once in the root tab layout. Renders nothing visible.
 */
export default function KYCRequiredListener() {
  const router = useRouter();
  const { isPending, isRejected } = useKYC();
  const lastAlertRef = useRef<number>(0);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("KYC_REQUIRED", () => {
      // Debounce — prevent duplicate alerts within 3 seconds
      const now = Date.now();
      if (now - lastAlertRef.current < 3000) return;
      lastAlertRef.current = now;

      if (isPending) {
        Alert.alert(
          "KYC Under Review",
          "Your identity verification is being reviewed. Please wait for approval before performing this action.",
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
          "Your identity verification was rejected. Please resubmit your documents.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resubmit",
              onPress: () => router.push("/kyc/upload" as any),
            },
          ],
        );
      } else {
        Alert.alert(
          "Verification Required",
          "You need to verify your identity before performing this action.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Verify Now",
              onPress: () => router.push("/kyc/upload" as any),
            },
          ],
        );
      }
    });

    return () => subscription.remove();
  }, [isPending, isRejected, router]);

  return null;
}
