import { useRouter } from "expo-router";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";

type FallbackRoute = "/(tabs)" | "/(tabs)/jobs" | "/(tabs)/messages" | "/(tabs)/profile" | string;

interface UseSafeBackOptions {
  /** Route to navigate to if no history exists (default: "/(tabs)") */
  fallbackRoute?: FallbackRoute;
  /** Whether to trigger haptic feedback (default: true) */
  haptic?: boolean;
}

/**
 * Hook that provides a safe back navigation function.
 * 
 * Prevents the app from closing when there's no navigation history
 * by falling back to a specified route (default: home tabs).
 * 
 * @example
 * // Basic usage
 * const goBack = useSafeBack();
 * <TouchableOpacity onPress={goBack}>
 * 
 * @example
 * // With custom fallback
 * const goBack = useSafeBack({ fallbackRoute: "/(tabs)/jobs" });
 * 
 * @example
 * // Inline in onPress
 * const { safeBack } = useSafeBackWithRouter();
 * onPress={() => safeBack()}
 */
export function useSafeBack(options: UseSafeBackOptions = {}): () => void {
  const router = useRouter();
  const { fallbackRoute = "/(tabs)", haptic = true } = options;

  const goBack = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      // No navigation history - go to fallback instead of closing app
      router.replace(fallbackRoute as any);
    }
  }, [router, fallbackRoute, haptic]);

  return goBack;
}

/**
 * Alternative hook that returns both the router and safeBack function.
 * Useful when you need access to both.
 */
export function useSafeBackWithRouter(options: UseSafeBackOptions = {}) {
  const router = useRouter();
  const safeBack = useSafeBack(options);

  return { router, safeBack };
}

/**
 * Utility function for use in callbacks where you already have the router.
 * Use this when you can't use the hook (e.g., in Alert.alert callbacks).
 * 
 * @example
 * Alert.alert("Title", "Message", [
 *   { text: "Cancel", onPress: () => safeGoBack(router) }
 * ]);
 */
export function safeGoBack(
  router: ReturnType<typeof useRouter>,
  fallbackRoute: FallbackRoute = "/(tabs)"
): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}

export default useSafeBack;
