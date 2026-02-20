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

type Step = "email" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Stored from step 1 response
  const [verifyToken, setVerifyToken] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);

  // Refs for inputs — needed for the keyboardDidHide re-focus workaround
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
              : "Failed to send reset request";
        setError(errorMsg);
        return;
      }

      // Extract verifyToken from the verifyLink URL
      if (data.verifyLink && data.accountID) {
        try {
          const url = new URL(data.verifyLink);
          const token = url.searchParams.get("verifyToken");
          if (token) {
            setVerifyToken(token);
            setAccountId(data.accountID);
            setStep("reset");
          } else {
            setError("Invalid reset response from server");
          }
        } catch {
          setError("Invalid reset response from server");
        }
      } else {
        // Backend returns generic message for non-existent emails (security)
        Alert.alert(
          "Check Your Email",
          data.message ||
            "If an account with that email exists, you can now reset your password.",
          [{ text: "OK" }],
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
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
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/auth/login"),
          },
        ],
      );
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              if (step === "reset") {
                setStep("email");
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
              <Ionicons
                name={step === "email" ? "mail-outline" : "lock-closed-outline"}
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.headerTitle}>
              {step === "email" ? "Forgot Password?" : "Create New Password"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === "email"
                ? "Enter your email address and we'll help you reset your password."
                : "Enter your new password below."}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === "email" ? (
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
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={Colors.primary}
                    />
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
                  Send Reset Request
                </Button>
              </>
            ) : (
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
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={Colors.primary}
                    />
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
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  }
                />

                <Button
                  onPress={handleResetPassword}
                  disabled={
                    isLoading || !newPassword.trim() || !confirmPassword.trim()
                  }
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
