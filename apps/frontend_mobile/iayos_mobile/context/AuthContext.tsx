import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CacheManager } from "../lib/utils/cacheManager";
import websocketService from "../lib/services/websocket";
import { User, AuthContextType, RegisterPayload } from "../types";
import {
  ENDPOINTS,
  apiRequest,
  EMAIL_VERIFICATION_ENDPOINT,
  OTP_EMAIL_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  RESEND_OTP_ENDPOINT,
  checkNetworkConnectivity,
  getApiUrl,
  debugNetworkDiagnostics,
  preflightBackendReachability,
} from "../lib/api/config";
import { getErrorMessage } from "../lib/utils/parse-api-error";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Registration response type with OTP data
type RegistrationResponse = {
  accountID: number;
  email: string;
  otp_code?: string;
  otp_expiry_minutes?: number;
  verifyLink?: string;
  verifyLinkExpire?: string;
};

type VerificationPayload = {
  email?: string;
  verifyLink?: string;
  verifyLinkExpire?: string;
};

const triggerVerificationEmail = async (
  payload: VerificationPayload,
): Promise<boolean> => {
  console.log("📧 [triggerVerificationEmail] Called with payload:", payload);
  console.log(
    "📧 [triggerVerificationEmail] Endpoint:",
    EMAIL_VERIFICATION_ENDPOINT,
  );

  if (
    !payload?.email ||
    !payload?.verifyLink ||
    !payload?.verifyLinkExpire ||
    !EMAIL_VERIFICATION_ENDPOINT
  ) {
    console.warn(
      "⚠️ Missing verification payload or endpoint, skipping email.",
      {
        hasEmail: !!payload?.email,
        hasVerifyLink: !!payload?.verifyLink,
        hasVerifyLinkExpire: !!payload?.verifyLinkExpire,
        hasEndpoint: !!EMAIL_VERIFICATION_ENDPOINT,
      },
    );
    return false;
  }

  try {
    console.log(
      "📧 [triggerVerificationEmail] Sending request to:",
      EMAIL_VERIFICATION_ENDPOINT,
    );
    console.log("📧 [triggerVerificationEmail] Request body:", {
      email: payload.email,
      verifyLink: payload.verifyLink,
      verifyLinkExpire: payload.verifyLinkExpire,
    });

    const response = await fetch(EMAIL_VERIFICATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email,
        verifyLink: payload.verifyLink,
        verifyLinkExpire: payload.verifyLinkExpire,
      }),
    });

    console.log(
      "📧 [triggerVerificationEmail] Response status:",
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Failed to send verification email via Resend endpoint",
        {
          status: response.status,
          body: errorText,
        },
      );
      return false;
    }

    const responseData = await response.json();
    console.log(
      "✅ Verification email dispatched via Resend endpoint.",
      responseData,
    );
    return true;
  } catch (error) {
    console.error("❌ Error while sending verification email:", error);
    return false;
  }
};

// Send OTP email for new registration flow
// Backend now sends email automatically on register, but this can be used for manual retry
const sendOTPEmail = async (email: string): Promise<boolean> => {
  console.log("📧 [sendOTPEmail] Requesting OTP email for:", email);

  if (!email || !OTP_EMAIL_ENDPOINT) {
    console.warn("⚠️ Missing OTP email parameters");
    return false;
  }

  try {
    const response = await fetch(OTP_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to send OTP email:", {
        status: response.status,
        body: errorText,
      });
      return false;
    }

    console.log("✅ OTP email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Clear all cached data (AsyncStorage + React Query + CacheManager + WebSocket)
  const clearAllCaches = async () => {
    if (__DEV__) {
      console.log("🗑️ [CLEAR_CACHE] clearAllCaches called!");
    }

    // Clear AsyncStorage auth keys
    const cacheKeys = [
      "cached_user",
      "cached_worker_availability",
      "access_token",
    ];
    await Promise.all(cacheKeys.map((key) => AsyncStorage.removeItem(key)));
    console.log("🗑️ [CLEAR_CACHE] Removed AsyncStorage keys:", cacheKeys);

    // Clear React Query cache to prevent cross-user data leakage
    queryClient.clear();
    console.log("🗑️ [CLEAR_CACHE] Cleared React Query cache");

    // Clear CacheManager cache (offline cache)
    await CacheManager.clearAll();
    console.log("🗑️ [CLEAR_CACHE] Cleared CacheManager");

    // Reset WebSocket service (disconnect and clear handlers)
    websocketService.reset();
    console.log("🗑️ [CLEAR_CACHE] Reset WebSocket service");

    console.log(
      "🗑️ [CLEAR_CACHE] All caches cleared (AsyncStorage + React Query + CacheManager + WebSocket)",
    );
  };

  // Check authentication with server
  // silent: if true, don't set isLoading (for background refreshes)
  const checkAuth = async (silent = false): Promise<boolean> => {
    console.log(`🔄 [CHECK_AUTH] Starting auth check (silent: ${silent})...`);
    if (!silent) {
      setIsLoading(true);
    }
    try {
      console.log("🔄 [CHECK_AUTH] Calling API:", ENDPOINTS.ME);
      const response = await apiRequest(ENDPOINTS.ME);
      console.log(
        `🔄 [CHECK_AUTH] Response status: ${response.status}, ok: ${response.ok}`,
      );

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ [CHECK_AUTH] Auth successful, user data:", {
          email: userData?.email,
          profileType: userData?.profile_data?.profileType,
        });
        setUser(userData);

        // Cache user data
        await AsyncStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );
        console.log("✅ [CHECK_AUTH] User data cached successfully");
        return true;
      } else if (response.status === 401) {
        // ONLY logout on 401 Unauthorized (invalid/expired token)
        console.log("🔐 [CHECK_AUTH] Token invalid (401), logging out");
        setUser(null);
        await clearAllCaches();
        return false;
      } else {
        // Other errors (network, 500, etc.) - keep cached session
        console.warn(
          `⚠️ [CHECK_AUTH] Auth check failed with status ${response.status}, keeping cached session`,
        );
        return false;
      }
    } catch (error) {
      // Network errors - keep cached session
      console.warn(
        "⚠️ [CHECK_AUTH] Network error, keeping cached session:",
        error,
      );
      return false;
    } finally {
      if (!silent) {
        console.log("🔄 [CHECK_AUTH] Setting isLoading to false");
        setIsLoading(false);
      }
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      // Cancel any in-flight queries and clear React Query cache to avoid
      // cross-user data exposure when starting a new login session.
      // This prevents a refetch flood because we clear (not invalidate)
      // the cache after cancelling running queries.
      try {
        await queryClient.cancelQueries();
        queryClient.clear();
      } catch (e) {
        console.warn("⚠️ Failed to clear React Query cache on login:", e);
      }

      // Clear AsyncStorage auth keys for the previous session
      await AsyncStorage.multiRemove([
        "access_token",
        "cached_user",
        "cached_worker_availability",
      ]);
      setUser(null);

      if (process.env.EXPO_PUBLIC_DEBUG_NETWORK === "true") {
        void debugNetworkDiagnostics("login");
      }

      await preflightBackendReachability("login");

      const response = await apiRequest(ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage = getErrorMessage(errorBody, "Login failed");
        console.error("❌ Login failed:", errorMessage);
        throw new Error(errorMessage);
      }

      // Parse login response - backend returns token with key "access"
      const loginData = await response.json();
      console.log("✅ Login response data:", JSON.stringify(loginData));

      // Handle potential wrapped response format (e.g. { data: { access: ... } })
      const token =
        loginData?.access ||
        loginData?.access_token ||
        loginData?.data?.access ||
        loginData?.data?.access_token ||
        null;

      if (!token) {
        console.error("❌ No access token in login response:", loginData);
        throw new Error("No access token received");
      }

      // Store access token for future API requests
      await AsyncStorage.setItem("access_token", token);
      console.log("✅ Access token stored successfully");

      // Fetch user data after successful login (token now stored)
      const userDataResponse = await apiRequest(ENDPOINTS.ME);

      if (userDataResponse.ok) {
        const userData = await userDataResponse.json();
        setUser(userData);

        await AsyncStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );

        // Return user data for immediate access (before state update completes)
        return userData;
      } else {
        setUser(null);
        await AsyncStorage.multiRemove([
          "access_token",
          "cached_user",
          "cached_worker_availability",
        ]);
        throw new Error("Failed to fetch user data after login");
      }
    } catch (error) {
      setUser(null);
      await AsyncStorage.multiRemove([
        "access_token",
        "cached_user",
        "cached_worker_availability",
      ]);
      throw error;
    }
  };

  // Register function - returns registration data with OTP for email verification
  const register = async (
    payload: RegisterPayload,
  ): Promise<RegistrationResponse> => {
    try {
      // Pre-flight network connectivity check
      console.log("📡 [Register] Checking network connectivity...");
      const networkState = await checkNetworkConnectivity();
      console.log(
        `📡 [Register] Network: connected=${networkState.isConnected}, type=${networkState.type}`,
      );

      if (!networkState.isConnected) {
        throw new Error(
          "No internet connection. Please check your network settings and try again.",
        );
      }

      console.log(`📡 [Register] API URL: ${getApiUrl()}`);
      console.log(`📡 [Register] Endpoint: ${ENDPOINTS.REGISTER}`);

      await preflightBackendReachability("register");

      const { confirmPassword, ...rest } = payload;
      const requestPayload = {
        ...rest,
        middleName: rest.middleName?.trim() || "",
        country: rest.country || "Philippines",
      };

      console.log("📡 [Register] Sending registration request...");
      const response = await apiRequest(ENDPOINTS.REGISTER, {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });

      const responseBody = await response.json().catch(() => null);
      console.log(`📡 [Register] Response status: ${response.status}`);

      if (!response.ok) {
        const message = getErrorMessage(responseBody, "Registration failed");
        console.error("❌ Registration failed:", message);
        throw new Error(message);
      }

      // Backend returns registration data with OTP
      const registrationData: RegistrationResponse =
        responseBody?.data || responseBody;
      console.log("📧 Registration response:", registrationData);

      // Backend now auto-sends OTP email on registration
      // If it failed, try manually via the send-otp endpoint
      if (registrationData.email) {
        // Backend already sent the email during registration
        // Only call sendOTPEmail as a fallback if needed
        console.log(
          "📧 OTP email should have been sent by backend during registration",
        );
      } else if (registrationData.verifyLink) {
        // Fallback to old verification link flow
        const emailSent = await triggerVerificationEmail({
          email: registrationData.email,
          verifyLink: registrationData.verifyLink,
          verifyLinkExpire: registrationData.verifyLinkExpire,
        });
        if (!emailSent) {
          console.warn("⚠️ Verification email was not sent successfully");
        }
      }

      return registrationData;
    } catch (error) {
      throw error;
    }
  };

  // Assign role (WORKER or CLIENT)
  const assignRole = async (
    profileType: "WORKER" | "CLIENT",
  ): Promise<boolean> => {
    try {
      const response = await apiRequest(ENDPOINTS.ASSIGN_ROLE, {
        method: "POST",
        body: JSON.stringify({ profile_type: profileType }),
      });

      if (response.ok) {
        // Refresh user data
        await checkAuth();
        return true;
      }

      const errorBody = await response.json().catch(() => null);
      const errorMessage = getErrorMessage(errorBody, "Failed to assign role");
      console.error("❌ Assign role failed:", errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      throw error;
    }
  };

  // Switch profile without logging out
  const switchProfile = async (
    profileType: "WORKER" | "CLIENT",
  ): Promise<void> => {
    try {
      console.log(`🔄 Attempting to switch profile to ${profileType}...`);

      const response = await apiRequest(ENDPOINTS.SWITCH_PROFILE, {
        method: "POST",
        body: JSON.stringify({ profile_type: profileType }),
      });

      console.log(`📡 Switch profile response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.log(
          "📡 Switch profile error body:",
          JSON.stringify(errorBody, null, 2),
        );

        const errorMessage = getErrorMessage(
          errorBody,
          `Failed to switch profile (HTTP ${response.status})`,
        );

        console.error("❌ Switch profile failed:", errorMessage);
        throw new Error(errorMessage);
      }

      // Parse response and extract new tokens
      const switchData = await response.json();
      console.log(
        "✅ Switch profile response data:",
        JSON.stringify(switchData, null, 2),
      );

      const newAccessToken = switchData?.access || switchData?.access_token;

      if (!newAccessToken) {
        console.error("❌ No access token in switch response:", switchData);
        throw new Error("No access token received from server");
      }

      // Store new access token
      await AsyncStorage.setItem("access_token", newAccessToken);
      console.log(`✅ Switched to ${profileType} profile, new token stored`);

      // Fetch updated user data with new profile
      const userDataResponse = await apiRequest(ENDPOINTS.ME);

      if (userDataResponse.ok) {
        const userData = await userDataResponse.json();

        // Detailed logging to verify profile type is in the data
        console.log(
          `📊 User data received after switch:`,
          JSON.stringify(userData, null, 2),
        );
        console.log(
          `📊 Profile type in userData: ${userData?.profile_data?.profileType}`,
        );

        setUser(userData);

        await AsyncStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );

        console.log(`✅ Profile switched to ${profileType}, user data updated`);
        console.log(
          `✅ User state now has profileType: ${userData?.profile_data?.profileType}`,
        );
      } else {
        const userError = await userDataResponse.json().catch(() => null);
        console.error("❌ Failed to fetch user data after switch:", userError);
        throw new Error("Failed to fetch user data after profile switch");
      }
    } catch (error) {
      // Better error logging
      if (error instanceof Error) {
        console.error("❌ Switch profile error:", error.message);
        console.error("❌ Error stack:", error.stack);
      } else {
        console.error(
          "❌ Switch profile error (unknown type):",
          JSON.stringify(error, null, 2),
        );
      }
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("🚪 [LOGOUT] Starting logout...");

      // Clear user state first
      setUser(null);

      // Cancel any in-flight queries and clear React Query cache to prevent
      // sensitive cached data from remaining accessible post-logout.
      // Clear after setUser(null) and cancel queries to mitigate refetch storms.
      try {
        await queryClient.cancelQueries();
        queryClient.clear();
        console.log("🗑️ [LOGOUT] Cleared React Query cache");
      } catch (e) {
        console.warn("⚠️ Failed to clear React Query cache on logout:", e);
      }

      // Clear AsyncStorage auth keys
      await AsyncStorage.multiRemove([
        "access_token",
        "cached_user",
        "cached_worker_availability",
      ]);
      console.log("🗑️ [LOGOUT] Cleared AsyncStorage auth keys");

      // Call backend logout endpoint (best effort, don't block on errors)
      try {
        await apiRequest(ENDPOINTS.LOGOUT, {
          method: "POST",
        });
        console.log("✅ [LOGOUT] Backend logout successful");
      } catch (error) {
        console.warn(
          "⚠️ [LOGOUT] Backend logout failed (non-critical):",
          error,
        );
      }

      // Navigate to welcome screen
      console.log("🔀 [LOGOUT] Navigating to welcome screen");
      router.replace("/welcome");

      console.log("✅ [LOGOUT] Logout complete");
    } catch (error) {
      console.error("❌ [LOGOUT] Logout error:", error);
      // Even if logout fails, clear state and navigate
      setUser(null);
      await AsyncStorage.multiRemove([
        "access_token",
        "cached_user",
        "cached_worker_availability",
      ]);
      router.replace("/welcome");
    }
  };

  // Initialize auth on mount with offline-first approach
  // E2E_MODE: Skip auth check entirely so app becomes ready immediately for Detox
  // Offline-first: Restore cached session immediately, then refresh in background
  useEffect(() => {
    let isMounted = true;
    const isE2EMode = process.env.EXPO_PUBLIC_E2E_MODE === "true";

    const initializeAuth = async () => {
      console.log("🚀 [INIT] Starting authentication initialization...");

      // E2E Mode: Skip auth check entirely - app becomes ready immediately
      if (isE2EMode) {
        console.log(
          "🧪 [INIT] E2E Mode: Skipping auth check for Detox testing",
        );
        setIsLoading(false);
        return;
      }

      try {
        // Step 1: Check for stored token
        console.log("🔍 [INIT] Step 1: Checking for stored access_token...");
        const token = await AsyncStorage.getItem("access_token");
        console.log(
          `🔍 [INIT] Token found: ${token ? "YES (length: " + token.length + ")" : "NO"}`,
        );

        if (!token) {
          // No token = not authenticated
          console.log("🔐 [INIT] No stored token, user not authenticated");
          setIsLoading(false);
          return;
        }

        // Step 2: Load cached user data
        console.log("🔍 [INIT] Step 2: Loading cached user data...");
        const cachedUserJson = await AsyncStorage.getItem("cached_user");
        console.log(
          `🔍 [INIT] Cached user found: ${cachedUserJson ? "YES (length: " + cachedUserJson.length + ")" : "NO"}`,
        );

        if (cachedUserJson) {
          try {
            const cached = JSON.parse(cachedUserJson);
            console.log("🔍 [INIT] Parsed cached user:", {
              email: cached.user?.email,
              profileType: cached.user?.profile_data?.profileType,
              timestamp: cached.timestamp,
            });

            // Restore user session immediately from cache
            if (isMounted) {
              setUser(cached.user);
              console.log("✅ [INIT] Session restored from cache", {
                email: cached.user?.email,
                profileType: cached.user?.profile_data?.profileType,
                cachedAt: new Date(cached.timestamp).toISOString(),
              });
            } else {
              console.warn("⚠️ [INIT] Component unmounted, skipping setUser");
            }
          } catch (parseError) {
            console.error("❌ [INIT] Failed to parse cached user:", parseError);
          }
        } else {
          console.warn("⚠️ [INIT] Token exists but no cached user data found");
        }

        // Step 3: Background refresh (non-blocking, don't await)
        console.log("🔄 [INIT] Step 3: Starting background auth refresh...");
        checkAuth(true).catch((err) => {
          console.warn("⚠️ [INIT] Background auth refresh failed:", err);
        });
      } catch (error) {
        console.error("❌ [INIT] Failed to initialize auth:", error);
      } finally {
        if (isMounted) {
          console.log("✅ [INIT] Setting isLoading to false");
          setIsLoading(false);
        } else {
          console.warn("⚠️ [INIT] Component unmounted, skipping setIsLoading");
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Refresh user data without showing loading state
   * Useful for updating user data when external state changes (e.g., KYC verification)
   * Memoized with useCallback to prevent refresh loops in dependent hooks
   */
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      console.log("🔄 [REFRESH_USER] Refreshing user data...");
      const response = await apiRequest(ENDPOINTS.ME);

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ [REFRESH_USER] User data refreshed:", {
          email: userData?.email,
          kycVerified: userData?.kycVerified,
        });
        setUser(userData);

        // Update cache
        await AsyncStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );
      } else {
        console.warn("⚠️ [REFRESH_USER] Failed to refresh user data");
      }
    } catch (error) {
      console.error("❌ [REFRESH_USER] Error refreshing user data:", error);
    }
  }, []);

  const isAuthenticated = !!user;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      checkAuth,
      assignRole,
      switchProfile,
      refreshUserData,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      checkAuth,
      assignRole,
      switchProfile,
      refreshUserData,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
