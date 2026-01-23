import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email, expiryMinutes } = useLocalSearchParams<{
    email: string;
    expiryMinutes: string;
  }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(
    parseInt(expiryMinutes || "5", 10) * 60,
  );
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      setError("");

      // Focus last filled input or next empty
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if complete
      if (digits.length === OTP_LENGTH) {
        handleVerify(digits);
      }
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter all 6 digits");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await apiRequest(ENDPOINTS.VERIFY_OTP_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          "Email Verified!",
          "Your account has been verified successfully. You can now log in.",
          [{ text: "Login", onPress: () => router.replace("/auth/login") }],
        );
      } else {
        setError(data.error || data.message || "Invalid OTP");
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      const response = await apiRequest(ENDPOINTS.RESEND_OTP_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reset timer with new expiry
        setTimeLeft(parseInt(expiryMinutes || "5", 10) * 60);
        setResendCooldown(RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        Alert.alert(
          "OTP Sent",
          "A new verification code has been sent to your email.",
        );
      } else {
        setError(data.error || data.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isVerifying}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-open-outline"
              size={64}
              color={Colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* Timer */}
          <View style={styles.timerContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>
                Code expires in{" "}
                <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
              </Text>
            ) : (
              <Text style={styles.timerExpired}>
                Code expired. Please request a new one.
              </Text>
            )}
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(value) => handleInputChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setError("")}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isVerifying}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (isVerifying || otp.join("").length !== OTP_LENGTH) &&
                styles.verifyButtonDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={isVerifying || otp.join("").length !== OTP_LENGTH}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : resendCooldown > 0 ? (
                <Text style={styles.resendCooldown}>
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <Text style={styles.resendButton}>Resend Code</Text>
              )}
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    padding: Spacing.sm,
    zIndex: 1,
  },
  iconContainer: {
    marginTop: Spacing.xl * 2,
    marginBottom: Spacing.lg,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    fontWeight: "600",
    color: Colors.primary,
  },
  timerContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timerText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  timerValue: {
    fontWeight: "700",
    color: Colors.primary,
  },
  timerExpired: {
    ...Typography.body.medium,
    color: Colors.error,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
  },
  verifyButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  verifyButtonDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  verifyButtonText: {
    ...Typography.body.large,
    fontWeight: "600",
    color: "#fff",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  resendLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  resendButton: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.primary,
  },
  resendCooldown: {
    ...Typography.body.medium,
    color: Colors.textDisabled,
  },
});
