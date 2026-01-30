import React, { useEffect, Component, ErrorInfo, ReactNode } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as PaperProvider } from "react-native-paper";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Toast from "react-native-toast-message";

const queryClient = new QueryClient();

// DEV-only guard: detect when React.createElement is called with an undefined type.
// Moved to module scope to prevent re-patching on every render.
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

/**
 * Error Boundary to catch JavaScript errors and prevent full app crash.
 * Shows a fallback UI instead of crashing the app.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={this.handleRetry}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Keep Android/iOS system bars consistent with our light background
    SystemUI.setBackgroundColorAsync("transparent").catch((error) => {
      console.warn("Failed to set system UI background", error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <PaperProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack
                screenOptions={{
                  headerShown: false, // Hide default headers globally
                }}
              >
                <Stack.Screen
                  name="auth/login"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="auth/register"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="auth/select-role"
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
              <StatusBar
                style={colorScheme === "dark" ? "light" : "dark"}
                backgroundColor="transparent"
                translucent
              />
              <Toast />
            </ThemeProvider>
          </PaperProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
