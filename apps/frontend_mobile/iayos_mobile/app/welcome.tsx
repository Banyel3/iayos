import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

const HAS_SEEN_WELCOME_KEY = "hasSeenWelcome";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PAGES = [
  {
    key: "clients",
    emoji: "🔧",
    subtitle: "Tools & Services",
    heading: "Find the right people\nfor the job",
    subheading: "Connect with skilled workers for all your home service needs.",
  },
  {
    key: "workers",
    emoji: "🛠️",
    subtitle: "For Workers",
    heading: "Earn on\nyour schedule",
    subheading:
      "Set your own rates and hours. Get hired for jobs that match your skills.",
  },
  {
    key: "trust",
    emoji: "🔒",
    subtitle: "Trusted & Secure",
    heading: "Safe payments,\nverified profiles",
    subheading:
      "Escrow-protected payments and KYC verification keep every transaction safe.",
  },
] as const;

export default function WelcomeScreen() {
  const [activePage, setActivePage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoAdvance = () => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setActivePage((prev) => {
        const next = prev + 1;
        if (next < PAGES.length) {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        }
        clearInterval(autoAdvanceRef.current!);
        autoAdvanceRef.current = null;
        return prev;
      });
    }, 3000);
  };

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, []);

  const markSeen = () =>
    AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, "true").catch(() => {});

  const renderPage = ({ item }: { item: (typeof PAGES)[number] }) => (
    <View style={styles.page}>
      <View style={styles.brandingSection}>
        <Text style={styles.brandTitle}>iAyos</Text>
        <Text style={styles.brandTagline}>May sira? May iAyos.</Text>
      </View>

      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationText}>{item.emoji}</Text>
        <Text style={styles.illustrationSubtext}>{item.subtitle}</Text>
      </View>

      <View style={styles.headingSection}>
        <Text style={styles.heading}>{item.heading}</Text>
        <Text style={styles.subheading}>{item.subheading}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} testID="welcome-screen">
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setActivePage(newIndex);
          // Restart auto-advance only when user swipes back before end
          if (newIndex < PAGES.length - 1) startAutoAdvance();
          else if (autoAdvanceRef.current) {
            clearInterval(autoAdvanceRef.current);
            autoAdvanceRef.current = null;
          }
        }}
      />

      {/* Dot indicators */}
      <View style={styles.indicatorsSection}>
        <View style={styles.indicatorRow}>
          {PAGES.map((p, i) => (
            <Animated.View
              key={p.key}
              style={[
                styles.indicator,
                i === activePage && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Action buttons — always visible */}
      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            markSeen();
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
            markSeen();
            router.push("/auth/login");
          }}
          activeOpacity={0.8}
          testID="welcome-login-button"
        >
          <Text style={styles.outlineButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 35,
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
  indicatorsSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
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
  buttonsSection: {
    paddingHorizontal: 35,
    paddingBottom: Spacing["3xl"],
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
});
