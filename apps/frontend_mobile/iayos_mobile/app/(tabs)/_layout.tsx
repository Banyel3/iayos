import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";

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
        // Disable tab animations to avoid keyboard / input focus issues
        // (some platforms/versions cause TextInput to lose focus when tabs animate)
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
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
        name="applications"
        options={{
          title: "Applications",
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
