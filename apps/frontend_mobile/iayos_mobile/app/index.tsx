import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, isLoading } = useAuth();

  // Wait for auth to load before deciding where to route
  if (isLoading) {
    console.log("🔀 [INDEX] Auth loading, showing nothing");
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

  // Not authenticated, show welcome screen
  console.log("🔀 [INDEX] Not authenticated, redirecting to welcome");
  return <Redirect href="/welcome" />;
}
