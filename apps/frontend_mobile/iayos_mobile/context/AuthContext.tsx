import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
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
} from "../lib/api/config";

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
const sendOTPEmail = async (
  email: string,
  otpCode: string,
  expiresInMinutes: number = 5,
): Promise<boolean> => {
  console.log("📧 [sendOTPEmail] Sending OTP to:", email);

  if (!email || !otpCode || !OTP_EMAIL_ENDPOINT) {
    console.warn("⚠️ Missing OTP email parameters");
    return false;
  }

  try {
    const response = await fetch(OTP_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp_code: otpCode,
        expires_in_minutes: expiresInMinutes,
      }),
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
    // Clear AsyncStorage auth keys
    const cacheKeys = [
      "cached_user",
      "cached_worker_availability",
      "access_token",
    ];
    await Promise.all(cacheKeys.map((key) => AsyncStorage.removeItem(key)));

    // Clear React Query cache to prevent cross-user data leakage
    queryClient.clear();

    // Clear CacheManager cache (offline cache)
    await CacheManager.clearAll();

    // Reset WebSocket service (disconnect and clear handlers)
    websocketService.reset();

    console.log(
      "🗑️ Cleared all caches (AsyncStorage + React Query + CacheManager + WebSocket)",
    );
  };

  // Check authentication with server
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest(ENDPOINTS.ME);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

        // Cache user data
        await AsyncStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );
        return true;
      } else {
        setUser(null);
        await clearAllCaches();
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      await clearAllCaches();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      await clearAllCaches();
      setUser(null);

      const response = await apiRequest(ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage =
          errorBody?.error ||
          errorBody?.message ||
          errorBody?.detail ||
          "Login failed";
        console.error("❌ Login failed:", errorMessage);
        await clearAllCaches();
        throw new Error(errorMessage);
      }

      // Parse login response - backend returns token with key "access"
      const loginData = await response.json();
      const token = loginData?.access || loginData?.access_token || null;

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
        await clearAllCaches();
        throw new Error("Failed to fetch user data after login");
      }
    } catch (error) {
      setUser(null);
      await clearAllCaches();
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
      console.log(`📡 [Register] Network: connected=${networkState.isConnected}, type=${networkState.type}`);
      
      if (!networkState.isConnected) {
        throw new Error("No internet connection. Please check your network settings and try again.");
      }
      
      console.log(`📡 [Register] API URL: ${getApiUrl()}`);
      console.log(`📡 [Register] Endpoint: ${ENDPOINTS.REGISTER}`);
      
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
        let message = "Registration failed";
        if (responseBody) {
          // Backend returns error in various formats, extract the actual message
          message =
            responseBody?.error || // Most common format: {error: "message"}
            responseBody?.message || // Alternative format: {message: "message"}
            responseBody?.detail || // Django format: {detail: "message"}
            responseBody?.error?.[0]?.message || // Array format
            JSON.stringify(responseBody); // Fallback: show raw response
        }
        console.error("❌ Registration failed:", message);
        throw new Error(message);
      }

      // Backend returns registration data with OTP
      const registrationData: RegistrationResponse =
        responseBody?.data || responseBody;
      console.log("📧 Registration response:", registrationData);

      // Send OTP email if OTP code is present (new flow)
      if (registrationData.otp_code) {
        const emailSent = await sendOTPEmail(
          registrationData.email,
          registrationData.otp_code,
          registrationData.otp_expiry_minutes || 5,
        );
        if (!emailSent) {
          console.warn("⚠️ OTP email was not sent successfully");
        }
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
      const errorMessage =
        errorBody?.error ||
        errorBody?.message ||
        errorBody?.detail ||
        "Failed to assign role";
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

        const errorMessage =
          errorBody?.error ||
          errorBody?.message ||
          errorBody?.detail ||
          `Failed to switch profile (HTTP ${response.status})`;

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
      setUser(null);
      await clearAllCaches();

      await apiRequest(ENDPOINTS.LOGOUT, {
        method: "POST",
      });

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
      setUser(null);
      await clearAllCaches();
    }
  };

  // Initialize auth on mount with E2E mode bypass and timeout
  // E2E_MODE: Skip auth check entirely so app becomes ready immediately for Detox
  // Timeout: If backend is unreachable, app still becomes interactive
  useEffect(() => {
    let isMounted = true;
    const AUTH_TIMEOUT_MS = 120000; // 2 minutes max for auth check (increased for slow networks)
    const isE2EMode = process.env.EXPO_PUBLIC_E2E_MODE === "true";

    const initializeAuth = async () => {
      // E2E Mode: Skip auth check entirely - app becomes ready immediately
      if (isE2EMode) {
        console.log("🧪 E2E Mode: Skipping auth check for Detox testing");
        setIsLoading(false);
        return;
      }

      // Create a timeout promise that resolves (not rejects) to allow app to continue
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (isMounted) {
            console.warn(
              "⏰ Auth check timeout - continuing without authentication",
            );
            setIsLoading(false);
          }
          resolve();
        }, AUTH_TIMEOUT_MS);
      });

      // Race between auth check and timeout
      await Promise.race([
        checkAuth().catch((err) => {
          console.warn("Auth check failed:", err);
          if (isMounted) setIsLoading(false);
        }),
        timeoutPromise,
      ]);
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        assignRole,
        switchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
