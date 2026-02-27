/**
 * useBiometricAuth
 * Wraps expo-local-authentication to provide biometric availability check
 * and a single authenticate() call. Works for Face ID, Touch ID, and Fingerprint.
 */

import { useState, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: "none",
  });

  /** Call once on mount (or when you need to refresh availability). */
  const checkAvailability = useCallback(async (): Promise<BiometricState> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      let biometricType: BiometricType = "none";
      if (compatible) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          biometricType = "facial";
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          biometricType = "fingerprint";
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.IRIS)
        ) {
          biometricType = "iris";
        }
      }

      const next: BiometricState = {
        isAvailable: compatible,
        isEnrolled: enrolled,
        biometricType,
      };
      setState(next);
      return next;
    } catch {
      const fallback: BiometricState = {
        isAvailable: false,
        isEnrolled: false,
        biometricType: "none",
      };
      setState(fallback);
      return fallback;
    }
  }, []);

  /** Prompt the system biometric dialog. Returns true on success. */
  const authenticate = useCallback(
    async (promptMessage = "Confirm your identity"): Promise<boolean> => {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: "Use Password",
          disableDeviceFallback: false,
        });
        return result.success;
      } catch {
        return false;
      }
    },
    []
  );

  /** Human-readable label for the available biometric type. */
  const biometricLabel =
    state.biometricType === "facial"
      ? "Face ID"
      : state.biometricType === "fingerprint"
        ? "Fingerprint"
        : state.biometricType === "iris"
          ? "Iris Scan"
          : "Biometrics";

  return { ...state, checkAvailability, authenticate, biometricLabel };
}
