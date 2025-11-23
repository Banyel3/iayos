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
} from "../lib/api/config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type VerificationPayload = {
  email?: string;
  verifyLink?: string;
  verifyLinkExpire?: string;
};

const triggerVerificationEmail = async (
  payload: VerificationPayload
): Promise<boolean> => {
  console.log("📧 [triggerVerificationEmail] Called with payload:", payload);
  console.log(
    "📧 [triggerVerificationEmail] Endpoint:",
    EMAIL_VERIFICATION_ENDPOINT
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
      }
    );
    return false;
  }

  try {
    console.log(
      "📧 [triggerVerificationEmail] Sending request to:",
      EMAIL_VERIFICATION_ENDPOINT
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
      response.status
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Failed to send verification email via Resend endpoint",
        {
          status: response.status,
          body: errorText,
        }
      );
      return false;
    }

    const responseData = await response.json();
    console.log(
      "✅ Verification email dispatched via Resend endpoint.",
      responseData
    );
    return true;
  } catch (error) {
    console.error("❌ Error while sending verification email:", error);
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
      "🗑️ Cleared all caches (AsyncStorage + React Query + CacheManager + WebSocket)"
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
          })
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
          })
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

  // Register function
  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const { confirmPassword, ...rest } = payload;
      const requestPayload = {
        ...rest,
        middleName: rest.middleName?.trim() || "",
        country: rest.country || "Philippines",
      };

      const response = await apiRequest(ENDPOINTS.REGISTER, {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });

      const responseBody = await response.json().catch(() => null);

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

      // Mobile backend wraps result in data: { email, verifyLink, verifyLinkExpire }
      const verificationPayload = responseBody?.data;
      console.log("📧 Registration response body:", responseBody);
      console.log("📧 Verification payload:", verificationPayload);

      if (verificationPayload) {
        const emailSent = await triggerVerificationEmail(verificationPayload);
        if (!emailSent) {
          console.warn("⚠️ Verification email was not sent successfully");
        }
      } else {
        console.warn(
          "⚠️ Registration succeeded but verification payload missing in response"
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Assign role (WORKER or CLIENT)
  const assignRole = async (
    profileType: "WORKER" | "CLIENT"
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

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
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
