import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";

const HAS_SEEN_WELCOME_KEY = "hasSeenWelcome";

export default function Index() {
  const { user, isLoading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  // Check if user has seen the welcome screen before
  useEffect(() => {
    AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY)
      .then((value) => setHasSeenWelcome(value === "true"))
      .catch(() => setHasSeenWelcome(false));
  }, []);

  // Wait for BOTH auth and welcome-flag to resolve before hiding splash
  const isReady = !isLoading && hasSeenWelcome !== null;

  useEffect(() => {
    if (isReady) {
      // Hide splash screen now that we know where to route
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    // Keep splash screen visible — return nothing
    return null;
  }

  // If authenticated with profile type, go to tabs
  if (user?.profile_data?.profileType) {
    console.log("🔀 [INDEX] User authenticated, redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  }

  // If authenticated but no profile type, go to role selection
  if (user && !user.profile_data?.profileType) {
    console.log("🔀 [INDEX] User authenticated but no profile, redirecting to role selection");
    return <Redirect href="/auth/select-role" />;
  }

  // Not authenticated — first launch shows welcome, subsequent opens go to login
  if (!hasSeenWelcome) {
    console.log("🔀 [INDEX] First launch, showing welcome");
    return <Redirect href="/welcome" />;
  }

  console.log("🔀 [INDEX] Returning user, going straight to login");
  return <Redirect href="/auth/login" />;
}
