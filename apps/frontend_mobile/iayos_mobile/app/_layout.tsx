import "react-native-reanimated";
import React, { useEffect, Component, ErrorInfo, ReactNode, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as PaperProvider } from "react-native-paper";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Toast from "react-native-toast-message";

console.log("[RootLayout] module evaluation start");
// Lazy-loaded update modules — prevents import crash from killing entire app.
// useAppUpdate imports expo-file-system SDK 54 APIs (Paths, File) and
// expo-intent-launcher which can fail on certain environments.
let useAppUpdateHook: any = null;
let UpdateRequiredModalComponent: any = null;

try {
  useAppUpdateHook = require("@/lib/hooks/useAppUpdate").useAppUpdate;
  UpdateRequiredModalComponent = require("@/components/UpdateRequiredModal").UpdateRequiredModal;
  console.log("[RootLayout] update modules loaded");
} catch (e) {
  console.warn("[RootLayout] Failed to load update modules:", e);
}

const queryClient = new QueryClient();
console.log("[RootLayout] query client initialized");

// Prevent splash screen from auto-hiding before app is ready
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors (e.g., splash screen already hidden)
});

// SAFETY NET: Force-hide splash after 8 seconds no matter what.
// Normally hideAsync() is called in ~100ms when RootLayout mounts.
// This timeout only fires if something catastrophic prevents mounting.
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 8000);

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

/**
 * AppUpdateWrapper - Checks for required app updates on startup.
 * Shows a blocking modal if the app version is below minimum required.
 * Supports OTA updates and in-app APK download with progress.
 * Must be rendered inside QueryClientProvider.
 */
function AppUpdateWrapper({ children }: { children: ReactNode }) {
  const appUpdate = useAppUpdateHook ? useAppUpdateHook() : null;
  const [dismissed, setDismissed] = useState(false);
  console.log("[RootLayout] AppUpdateWrapper render", {
    hasUpdateHook: !!useAppUpdateHook,
    hasModal: !!UpdateRequiredModalComponent,
  });

  // If update modules failed to load, just render children
  if (!appUpdate || !UpdateRequiredModalComponent) {
    return <>{children}</>;
  }

  // Show modal if update is required (and not dismissed for optional updates)
  const showModal = appUpdate.updateRequired && !dismissed;

  return (
    <>
      {children}
      <UpdateRequiredModalComponent
        visible={showModal}
        installedVersion={appUpdate.installedVersion}
        currentVersion={appUpdate.currentVersion}
        downloadUrl={appUpdate.downloadUrl}
        forceUpdate={appUpdate.forceUpdate}
        onDismiss={() => setDismissed(true)}
        // New props for enhanced update
        ota={appUpdate.ota}
        download={appUpdate.download}
        onApplyOTA={appUpdate.applyOTAUpdate}
        onDownloadAPK={appUpdate.downloadAndInstallAPK}
        onInstallAPK={appUpdate.installDownloadedAPK}
      />
    </>
  );
}

export default function RootLayout() {
  console.log("[RootLayout] component render");
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log("[RootLayout] mount effect start");
    // Keep Android/iOS system bars consistent with our light background
    SystemUI.setBackgroundColorAsync("transparent").catch((error) => {
      console.warn("Failed to set system UI background", error);
    });

    // Hide splash screen once root layout has mounted
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors
    });
    console.log("[RootLayout] hideAsync invoked");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AppUpdateWrapper>
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
                  name="messages/[conversationId]"
                  options={{
                    headerShown: false,
                    presentation: "card",
                    animation: "slide_from_right",
                  }}
                />
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
      </AppUpdateWrapper>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
