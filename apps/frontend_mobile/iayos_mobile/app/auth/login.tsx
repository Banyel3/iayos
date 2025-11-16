import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Invalid email or password");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Clean Header with Logo */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>i</Text>
            </View>
            <Text style={styles.headerTitle}>Welcome to iAyos</Text>
            <Text style={styles.headerSubtitle}>
              May sira? May iAyos.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              iconLeft={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              editable={!isLoading}
              iconLeft={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
            >
              Login
            </Button>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/register")}
                disabled={isLoading}
                activeOpacity={0.7}
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
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    ...Shadows.md,
  },
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
});
