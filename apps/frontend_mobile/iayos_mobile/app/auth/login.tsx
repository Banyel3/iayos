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
  Keyboard,
  TextInput as RNTextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Image } from "react-native";

// Required for auth session redirect to complete properly
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, googleSignIn, user } = useAuth();
  const router = useRouter();

  // Google OAuth - uses authorization code flow (auto-exchanged for tokens)
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      ...(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        ? { androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID }
        : {}),
      ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
        ? { iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID }
        : {}),
    });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleSignIn(idToken);
      }
    } else if (googleResponse?.type === "error") {
      console.error("❌ [GOOGLE] Auth error:", googleResponse.error);
      Alert.alert("Error", "Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    } else if (googleResponse?.type === "dismiss") {
      setIsGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleSignIn = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      const userData = await googleSignIn(idToken);
      if (!userData?.profile_data?.profileType) {
        router.replace("/auth/select-role");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("❌ [GOOGLE] Sign-in error:", error);
      Alert.alert("Error", error.message || "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Refs for inputs so we can programmatically focus and check isFocused
  const emailRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const passwordRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  // Track the last focused field's ref object
  const lastFocusedRef = useRef<any>(null);

  // Redirect authenticated users away from login screen
  // Only redirect if user exists AND there's a valid token in AsyncStorage
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Check if there's a token in AsyncStorage
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        // No token = definitely not authenticated, stay on login
        console.log("🔀 [LOGIN] No token found, staying on login screen");
        return;
      }

      // Token exists, check user state
      if (user?.profile_data?.profileType) {
        console.log(
          "🔀 [LOGIN] User already authenticated, redirecting to tabs",
        );
        router.replace("/(tabs)");
      } else if (user && !user.profile_data?.profileType) {
        console.log(
          "🔀 [LOGIN] User authenticated but no profile type, redirecting to role selection",
        );
        router.replace("/auth/select-role");
      }
    };

    checkAuthAndRedirect();
  }, [user]);

  // When keyboard hides, try to re-focus the last focused field if it still reports focused
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const userData = await login(email, password);
      // Check profileType immediately from returned data
      if (!userData?.profile_data?.profileType) {
        router.replace("/auth/select-role");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="login-screen">
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
          keyboardDismissMode="on-drag"
        >
          {/* Clean Header with Logo */}

          <View style={styles.headerContainer}>
            <Image
              source={require("../../assets/logo-white.png")}
              style={{
                width: 120,
                height: 120,
                resizeMode: "contain",
                marginBottom: Spacing["2xl"],
              }}
              accessibilityLabel="iAyos Logo"
            />
            <Text style={styles.headerTitle}>Welcome to iAyos</Text>
            <Text style={styles.headerSubtitle}>May Sira? May iAyos</Text>
          </View>
          <View style={styles.formContainer}>
            {/* Email Input */}
            <Input
              ref={emailRef}
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              testID="login-email-input"
              iconLeft={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = emailRef;
              }}
            />

            {/* Password Input */}
            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              editable={!isLoading}
              testID="login-password-input"
              iconLeft={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = passwordRef;
              }}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              activeOpacity={0.7}
              disabled={isLoading}
              testID="login-forgot-password-link"
              onPress={() => router.push("/auth/forgot-password" as any)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              disabled={isLoading || isGoogleLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              testID="login-submit-button"
            >
              Login
            </Button>

            {/* OR Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                (!googleRequest || isGoogleLoading || isLoading) &&
                  styles.googleButtonDisabled,
              ]}
              onPress={() => {
                setIsGoogleLoading(true);
                promptGoogleAsync();
              }}
              disabled={!googleRequest || isGoogleLoading || isLoading}
              activeOpacity={0.7}
              testID="login-google-button"
            >
              {isGoogleLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.textPrimary}
                  style={{ marginRight: Spacing.sm }}
                />
              ) : (
                <Ionicons
                  name="logo-google"
                  size={20}
                  color="#DB4437"
                  style={{ marginRight: Spacing.sm }}
                />
              )}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View
              style={styles.registerContainer}
              testID="login-register-container"
            >
              <Text style={styles.registerText}>
                {"Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/register")}
                disabled={isLoading}
                activeOpacity={0.7}
                testID="login-register-link"
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  headerContainer: {
    backgroundColor: Colors.white,
    paddingTop: Spacing["6xl"],
    paddingBottom: Spacing["4xl"],
    alignItems: "center",
  },
  // logoCircle removed
  logoText: {
    fontSize: 64,
    fontWeight: "700",
    color: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  formContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing["2xl"],
    marginTop: -Spacing.sm, // Negative margin to bring closer to password input
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  registerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    height: 52,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
