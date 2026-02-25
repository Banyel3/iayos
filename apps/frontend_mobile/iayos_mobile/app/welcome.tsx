import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

const HAS_SEEN_WELCOME_KEY = "hasSeenWelcome";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container} testID="welcome-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Main content */}
          <View style={styles.mainContent}>
            {/* iAyos branding */}
            <View style={styles.brandingSection}>
              <Text style={styles.brandTitle}>iAyos</Text>
              <Text style={styles.brandTagline}>May sira? May iAyos.</Text>
            </View>

            {/* Illustration placeholder */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationPlaceholder}>
                <Text style={styles.illustrationText}>🔧</Text>
                <Text style={styles.illustrationSubtext}>Tools & Services</Text>
              </View>
            </View>

            {/* Heading and subheading */}
            <View style={styles.headingSection}>
              <Text style={styles.heading}>
                Find the right people{"\n"}for the job
              </Text>
              <Text style={styles.subheading}>
                Connect with skilled workers for all your home service needs.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsSection}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, "true").catch(() => {});
                  router.push("/auth/register");
                }}
                activeOpacity={0.8}
                testID="welcome-get-started-button"
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => {
                  AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, "true").catch(() => {});
                  router.push("/auth/login");
                }}
                activeOpacity={0.8}
                testID="welcome-login-button"
              >
                <Text style={styles.outlineButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page indicators */}
          <View style={styles.indicatorsSection}>
            <View style={styles.indicatorRow}>
              <View style={[styles.indicator, styles.activeIndicator]} />
              <View style={styles.indicator} />
              <View style={styles.indicator} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    minHeight: SCREEN_HEIGHT - 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 35,
    justifyContent: "space-between",
  },
  mainContent: {
    flex: 1,
    paddingTop: Spacing["5xl"],
  },
  brandingSection: {
    alignItems: "flex-start",
    marginBottom: Spacing["3xl"],
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "400",
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  brandTagline: {
    fontSize: 20,
    fontWeight: "400",
    color: Colors.black,
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: Spacing["3xl"],
    transform: [{ translateX: -20 }],
  },
  illustrationPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  illustrationText: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  illustrationSubtext: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  headingSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  heading: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.black,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsSection: {
    gap: Spacing.sm,
  },
  primaryButton: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base + 1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  outlineButton: {
    height: 54,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: Typography.fontSize.base + 1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  indicatorsSection: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  indicatorRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  activeIndicator: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});
