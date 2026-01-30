import { Redirect, Tabs, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { KYCBanner } from "@/components/KYCBanner";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  // Redirect logic based on authentication and profile type
  // Use ref to prevent race conditions from multiple simultaneous redirects
  useEffect(() => {
    if (!isLoading && !hasRedirectedRef.current) {
      if (!isAuthenticated) {
        // Not logged in - redirect to login
        hasRedirectedRef.current = true;
        router.replace("/auth/login");
      } else if (!user?.profile_data?.profileType) {
        // Logged in but no role selected - redirect to role selection
        hasRedirectedRef.current = true;
        router.replace("/auth/select-role");
      }
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return null; // Wait for auth state before deciding what to render
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (!user?.profile_data?.profileType) {
    return <Redirect href="/auth/select-role" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <KYCBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: "absolute",
            bottom: 25,
            left: 20,
            right: 20,
            backgroundColor:
              Platform.OS === "ios" ? "rgba(255, 255, 255, 0.9)" : Colors.white,
            borderRadius: 25,
            borderTopWidth: 0,
            paddingTop: 12,
            paddingBottom: Platform.OS === "ios" ? 20 : 12,
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
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            // tabBarTestID: "tab-home",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            // tabBarTestID: "tab-jobs",
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
            // tabBarTestID: "tab-messages",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="message.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            // tabBarTestID: "tab-profile",
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
