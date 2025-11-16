import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
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
} catch (e) {}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null; // Or show a loading screen
  }

  return (
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
  );
}
