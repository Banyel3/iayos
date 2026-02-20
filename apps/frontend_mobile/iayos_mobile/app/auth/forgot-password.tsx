import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TextInput as RNTextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ENDPOINTS } from "@/lib/api/config";

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpTimeLeft, setOtpTimeLeft] = useState(5 * 60);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(RNTextInput | null)[]>([]);

  // Stored after OTP is verified
  const [verifyToken, setVerifyToken] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);

  // Refs for password inputs — keyboardDidHide re-focus workaround
  const emailRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const newPasswordRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const confirmPasswordRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const lastFocusedRef = useRef<any>(null);

  // iOS: KAV padding-mode can trigger a layout scroll that fires keyboardDismissMode.
  // Re-focus the last focused field if the keyboard hides unexpectedly.
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      const fieldRef = lastFocusedRef.current?.current ?? null;
      if (fieldRef && (fieldRef as any).isFocused?.()) {
        setTimeout(() => {
          try {
            (fieldRef as any).focus?.();
          } catch (e) {}
        }, 50);
      }
    });
    return () => {
      try {
        subscription.remove();
      } catch (e) {}
    };
  }, []);

  // OTP expiry countdown
  useEffect(() => {
    if (step !== "otp" || otpTimeLeft <= 0) return;
    const timer = setInterval(() => setOtpTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, otpTimeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: send OTP to email
  const handleSendReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.FORGOT_PASSWORD_SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data: any = await response.json();
      if (data.error) {
        const errorMsg =
          Array.isArray(data.error) && data.error[0]?.message
            ? data.error[0].message
            : typeof data.error === "string"
              ? data.error
              : "Failed to send reset code";
        setError(errorMsg);
        return;
      }
      // Transition to OTP step
      setOtp(Array(6).fill(""));
      setOtpTimeLeft(5 * 60);
      setResendCooldown(60);
      setStep("otp");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP digit input handler
  const handleOtpInput = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    if (digit && index === 5) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        Keyboard.dismiss();
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: verify OTP → get resetToken
  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode ?? otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.FORGOT_PASSWORD_VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });
      const data: any = await response.json();
      if (!data.success) {
        const errorMsg = data.error || "Invalid code. Please try again.";
        setError(errorMsg);
        if (data.max_attempts_reached || data.expired) {
          setOtp(Array(6).fill(""));
          setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        }
        return;
      }
      setVerifyToken(data.resetToken);
      setAccountId(data.accountId);
      setStep("reset");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.FORGOT_PASSWORD_SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data: any = await response.json();
      if (data.error) {
        setError("Failed to resend code. Please try again.");
        return;
      }
      setOtp(Array(6).fill(""));
      setOtpTimeLeft(5 * 60);
      setResendCooldown(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: set new password
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const url = `${ENDPOINTS.FORGOT_PASSWORD_VERIFY}?verifyToken=${encodeURIComponent(verifyToken)}&id=${accountId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data: any = await response.json();
      if (data.error) {
        const errorMsg =
          Array.isArray(data.error) && data.error[0]?.message
            ? data.error[0].message
            : typeof data.error === "string"
              ? data.error
              : "Password reset failed";
        setError(errorMsg);
        return;
      }
      Alert.alert(
        "Password Reset Successful",
        "Your password has been updated. Please log in with your new password.",
        [{ text: "Go to Login", onPress: () => router.replace("/auth/login") }],
      );
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepConfig = {
    email: {
      icon: "mail-outline" as const,
      title: "Forgot Password?",
      subtitle: "Enter your email address and we'll send you a verification code.",
    },
    otp: {
      icon: "shield-checkmark-outline" as const,
      title: "Verify Your Email",
      subtitle: `Enter the 6-digit code sent to ${email || "your email"}.`,
    },
    reset: {
      icon: "lock-closed-outline" as const,
      title: "Create New Password",
      subtitle: "Enter your new password below.",
    },
  };

  const { icon, title, subtitle } = stepConfig[step];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="none"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === "otp") {
                setStep("email");
                setError("");
              } else if (step === "reset") {
                setStep("otp");
                setError("");
              } else {
                router.back();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={32} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Step 1: Email */}
            {step === "email" && (
              <>
                <Input
                  ref={emailRef}
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text: string) => {
                    setEmail(text);
                    setError("");
                  }}
                  onFocus={() => { lastFocusedRef.current = emailRef; }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                  iconLeft={
                    <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                  }
                />
                <Button
                  onPress={handleSendReset}
                  disabled={isLoading || !email.trim()}
                  loading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={{ marginTop: Spacing.xl }}
                >
                  Send Verification Code
                </Button>
              </>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <RNTextInput
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : null,
                        error && !digit ? styles.otpInputError : null,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpInput(value, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                      editable={!isLoading}
                    />
                  ))}
                </View>

                <View style={styles.timerContainer}>
                  {otpTimeLeft > 0 ? (
                    <>
                      <Text style={styles.timerText}>Code expires in </Text>
                      <Text style={styles.timerValue}>{formatTime(otpTimeLeft)}</Text>
                    </>
                  ) : (
                    <Text style={styles.timerExpired}>Code has expired. Please resend.</Text>
                  )}
                </View>

                <Button
                  onPress={() => handleVerifyOTP()}
                  disabled={isLoading || otp.join("").length !== 6 || otpTimeLeft === 0}
                  loading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={{ marginTop: Spacing.lg }}
                >
                  Verify Code
                </Button>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                  {resendCooldown > 0 ? (
                    <Text style={styles.resendCooldown}>Resend in {resendCooldown}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                      <Text style={styles.resendButton}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Step 3: New password */}
            {step === "reset" && (
              <>
                <Input
                  ref={newPasswordRef}
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(text: string) => {
                    setNewPassword(text);
                    setError("");
                  }}
                  onFocus={() => { lastFocusedRef.current = newPasswordRef; }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                  iconLeft={
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
                  }
                />
                <Input
                  ref={confirmPasswordRef}
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={(text: string) => {
                    setConfirmPassword(text);
                    setError("");
                  }}
                  onFocus={() => { lastFocusedRef.current = confirmPasswordRef; }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                  iconLeft={
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
                  }
                />
                <Button
                  onPress={handleResetPassword}
                  disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
                  loading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={{ marginTop: Spacing.xl }}
                >
                  Reset Password
                </Button>
              </>
            )}

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace("/auth/login")}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    padding: Spacing.lg,
    alignSelf: "flex-start",
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["2xl"],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  formContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.lg,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.error}10`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  // OTP digit boxes
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  timerValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  timerExpired: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  resendLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  resendCooldown: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  resendButton: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
    gap: Spacing.xs,
  },
  loginLinkText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: "600",
  },
});
