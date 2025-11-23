// Location Button Component
// Button to scan and update current location for nearby worker/job filtering

import React, { useState } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useScanLocation } from "@/lib/hooks/useLocation";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";

interface LocationButtonProps {
  onLocationUpdated?: (coords: { latitude: number; longitude: number }) => void;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
}

export default function LocationButton({
  onLocationUpdated,
  variant = "primary",
  size = "medium",
}: LocationButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scanLocation = useScanLocation();

  const handleScanLocation = async () => {
    try {
      setIsScanning(true);

      const coords = await scanLocation.mutateAsync();

      Alert.alert(
        "Location Updated",
        "Your current location has been saved. Nearby workers/jobs will now be sorted by distance.",
        [{ text: "OK" }]
      );

      if (onLocationUpdated && coords) {
        onLocationUpdated(coords);
      }
    } catch (error) {
      console.error("Failed to scan location:", error);
      // Alert is already shown in the hook
    } finally {
      setIsScanning(false);
    }
  };

  const isLoading = isScanning || scanLocation.isPending;

  return (
    <Pressable
      style={[
        styles.button,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        size === "small" && styles.smallButton,
        size === "large" && styles.largeButton,
        isLoading && styles.buttonDisabled,
      ]}
      onPress={handleScanLocation}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? Colors.white : Colors.primary}
        />
      ) : (
        <>
          <Ionicons
            name="location"
            size={size === "small" ? 16 : size === "large" ? 24 : 20}
            color={variant === "primary" ? Colors.white : Colors.primary}
          />
          <Text
            style={[
              styles.buttonText,
              variant === "primary"
                ? styles.primaryButtonText
                : styles.secondaryButtonText,
              size === "small" && styles.smallButtonText,
              size === "large" && styles.largeButtonText,
            ]}
          >
            Scan Current Location
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  smallButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  largeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body.regular,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  smallButtonText: {
    fontSize: 13,
  },
  largeButtonText: {
    fontSize: 17,
  },
});
