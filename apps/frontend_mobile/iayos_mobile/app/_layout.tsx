import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Toast from "react-native-toast-message";

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // DEV-only guard: detect when React.createElement is called with an undefined type.
  // This helps pin down which route/screen is returning an undefined component
  // that leads to the "Element type is invalid ... got: undefined" error.
  if (__DEV__) {
    try {
      const origCreateElement = React.createElement;
      // eslint-disable-next-line no-global-assign
      React.createElement = function patchedCreateElement(
        type: any,
        props: any,
        ...children: any[]
      ) {
        if (type === undefined) {
          // eslint-disable-next-line no-console
          console.error(
            "[DEV] React.createElement called with undefined type",
            {
              props,
              childrenCount: children.length,
              stack: new Error().stack,
            }
          );
        }
        return origCreateElement(type, props, ...children);
      } as typeof React.createElement;
    } catch (e) {
      // ignore in case environment prevents monkey-patching
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen
                name="auth/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/register"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="notifications/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="notifications/settings"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
            <Toast />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
