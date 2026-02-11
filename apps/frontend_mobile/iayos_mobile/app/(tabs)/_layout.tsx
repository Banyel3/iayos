import { Redirect, Tabs, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { KYCBanner } from "@/components/KYCBanner";
import PendingReviewModal from "@/components/PendingReviewModal";
import { usePendingReviews } from "@/lib/hooks/useReviews";
// Debug imports at runtime to detect undefined exports
try {
  // eslint-disable-next-line no-console
  console.log("[TabsLayout] Imports:", {
    Tabs: typeof Tabs !== "undefined" ? "defined" : "undefined",
    HapticTab: typeof HapticTab !== "undefined" ? "defined" : "undefined",
    IconSymbol: typeof IconSymbol !== "undefined" ? "defined" : "undefined",
    Colors: typeof Colors !== "undefined" ? "defined" : "undefined",
    useColorScheme:
      typeof useColorScheme !== "undefined" ? "defined" : "undefined",
    useAuth: typeof useAuth !== "undefined" ? "defined" : "undefined",
  });
} catch (e) { }

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Pending review check - force review on app reopen
  const [showPendingReview, setShowPendingReview] = useState(false);
  const appState = useRef(AppState.currentState);
  const { data: pendingReviews, refetch: refetchPendingReviews } =
    usePendingReviews(isAuthenticated);

  // Check for pending reviews when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground - check pending reviews
          refetchPendingReviews();
        }
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, [refetchPendingReviews]);

  // Show modal when pending reviews exist
  useEffect(() => {
    if (pendingReviews && pendingReviews.count > 0) {
      // Only show if the first pending review has a conversation_id
      const firstReview = pendingReviews.pending_reviews[0];
      if (firstReview?.conversation_id) {
        setShowPendingReview(true);
      }
    } else {
      setShowPendingReview(false);
    }
  }, [pendingReviews]);

  // Redirect logic based on authentication and profile type
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to login
        console.log("🔀 [TABS] Redirecting to login (not authenticated)");
        router.replace("/auth/login");
      } else if (!user?.profile_data?.profileType) {
        // Logged in but no role selected - redirect to role selection
        console.log("🔀 [TABS] Redirecting to role selection (no profile type)");
        router.replace("/auth/select-role");
      } else {
        console.log("✅ [TABS] User authenticated, showing tabs");
      }
    } else {
      console.log("⏳ [TABS] Waiting for auth to load...");
    }
  }, [isAuthenticated, isLoading, user]);

  // Wait for auth state to be determined before rendering anything
  if (isLoading) {
    console.log("⏳ [TABS] Still loading, returning null");
    return null; // Wait for auth state before deciding what to render
  }

  // After loading is complete, check auth state
  if (!isAuthenticated) {
    console.log("🔀 [TABS] Not authenticated after loading, redirecting to login");
    return <Redirect href="/auth/login" />;
  }

  if (!user?.profile_data?.profileType) {
    console.log("🔀 [TABS] No profile type after loading, redirecting to role selection");
    return <Redirect href="/auth/select-role" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: "absolute",
            bottom: 25,
            marginHorizontal: 14,
            backgroundColor: Colors.white,
            borderRadius: 25,
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 16 : 8,
            height: Platform.OS === "ios" ? 85 : 70,
            elevation: 20,
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.05)",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="briefcase.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-jobs"
          options={{
            title: "My Jobs",
            href: null, // Hidden from tab bar
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="message.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
      {/* Force Review Modal - shown when user has pending reviews */}
      <PendingReviewModal
        visible={showPendingReview}
        pendingReview={
          pendingReviews?.pending_reviews?.[0] ?? null
        }
      />
    </View>
  );
}
