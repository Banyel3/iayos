import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";

const HAS_SEEN_WELCOME_KEY = "hasSeenWelcome";
const BOOT_WATCHDOG_MS = 8000;

export default function Index() {
  const { user, isLoading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [bootTimedOut, setBootTimedOut] = useState(false);

  // Check if user has seen the welcome screen before
  useEffect(() => {
    AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY)
      .then((value) => setHasSeenWelcome(value === "true"))
      .catch(() => setHasSeenWelcome(false));
  }, []);

  // Wait for BOTH auth and welcome-flag to resolve before hiding splash
  const isReady = !isLoading && hasSeenWelcome !== null;
  const forceReady = bootTimedOut && hasSeenWelcome !== null;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("⚠️ [INDEX] Boot watchdog fired - forcing splash hide fallback");
        setBootTimedOut(true);
      }
    }, BOOT_WATCHDOG_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isReady || forceReady) {
      // Hide splash screen now that we know where to route
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, forceReady]);

  if (!isReady && !forceReady) {
    // Keep splash screen visible — return nothing
    return null;
  }

  if (bootTimedOut) {
    if (__DEV__) {
      console.warn("⚠️ [INDEX] Forcing login route after bootstrap timeout");
    }
    return <Redirect href="/auth/login" />;
  }

  // If authenticated with profile type, go to tabs
  if (user?.profile_data?.profileType) {
    if (__DEV__) console.log("🔀 [INDEX] User authenticated, redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  }

  // If authenticated but no profile type, go to role selection
  if (user && !user.profile_data?.profileType) {
    if (__DEV__) console.log("🔀 [INDEX] User authenticated but no profile, redirecting to role selection");
    return <Redirect href="/auth/select-role" />;
  }

  // Not authenticated — first launch shows welcome, subsequent opens go to login
  if (!hasSeenWelcome) {
    if (__DEV__) console.log("🔀 [INDEX] First launch, showing welcome");
    return <Redirect href="/welcome" />;
  }

  if (__DEV__) console.log("🔀 [INDEX] Returning user, going straight to login");
  return <Redirect href="/auth/login" />;
}
