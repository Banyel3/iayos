"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType } from "@/types";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import Cookies from "js-cookie";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 Centralized cache clearing function
const clearAllAuthCaches = () => {
  // Clear all localStorage auth-related items
  const localStorageKeys = [
    "cached_user",
    "cached_worker_availability",
    "ws_token", // WebSocket authentication token
    "hasSeenOnboard",
    "rateLimitEndTime",
    "registerRateLimitEndTime",
    "IAYOS_PERSISTENT_CACHE",
    "IAYOS_CACHE_TIME",
  ];

  localStorageKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Clear all sessionStorage auth-related items
  const sessionStorageKeys = ["IAYOS_SESSION_CACHE", "last_login_redirect"];

  sessionStorageKeys.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  // 🔥 Clear manually set cookies for Local-to-Prod dev
  Cookies.remove("access", { path: "/" });
  Cookies.remove("refresh", { path: "/" });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      // 🔥 Optimization: Use cached user immediately, then verify in background
      const cached = localStorage.getItem("cached_user");
      if (cached) {
        try {
          const { user: cachedUser, timestamp } = JSON.parse(cached);
          const cacheAge = Date.now() - timestamp;
          const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased for stability)

          if (cacheAge < CACHE_TTL && cachedUser) {
            if (process.env.NODE_ENV === "development")
              console.log("🚀 Using cached user for instant load");
            setUser(cachedUser);
            setIsLoading(false);

            // Verify in background (don't await)
            checkAuthWithServer().catch(console.error);
            return;
          }
        } catch (e) {
          console.error("Cache parse error:", e);
        }
      }

      // No valid cache - must verify with server
      await checkAuthWithServer();
    };

    initializeAuth();
  }, []);

  const checkAuthWithServer = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 🔥 Add timeout for cold starts (Render free tier can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      // Use token from localStorage if available (helps with CORS/Local-to-Prod dev)
      const token = localStorage.getItem("ws_token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/accounts/me`, {
        credentials: "include", // 🔥 HTTP-only cookies sent automatically
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

        // 🔥 Cache user data (not token!) for faster subsequent loads
        localStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );
        return true;
      } else {
        // Server says not authenticated - clear everything
        setUser(null);
        clearAllAuthCaches();
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      clearAllAuthCaches();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing cached data first
      clearAllAuthCaches();
      setUser(null);

      const response = await fetch(`${API_BASE}/api/accounts/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 🔥 Cookies handled automatically
      });

      if (!response.ok) {
        // Read error detail from response
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "Login failed";

        // Handle structured error: {"error": [{"message": "..."}]}
        if (Array.isArray(errorData.error) && errorData.error.length > 0) {
          errorMessage = errorData.error[0].message || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        // Login failed - ensure everything is cleared
        setUser(null);
        clearAllAuthCaches();
        throw new Error(errorMessage);
      }

      // Get the login response which includes tokens
      const loginData = await response.json();

      // Backend always returns HTTP 200, even for errors like wrong password,
      // suspended account, unverified email, etc.  Check for error payload first.
      if (loginData.error) {
        let errorMessage = "Login failed";
        if (Array.isArray(loginData.error) && loginData.error.length > 0) {
          errorMessage = (loginData.error[0].message || errorMessage).trim();
        } else if (typeof loginData.error === "string") {
          errorMessage = loginData.error.trim();
        }
        setUser(null);
        clearAllAuthCaches();
        throw new Error(errorMessage);
      }

      // Store access token and set cookies manually
      // This is CRITICAL when proxying live backends that return HttpOnly cookies with 'Domain' restrictions
      if (loginData.access) {
        localStorage.setItem("ws_token", loginData.access);
        // Manually set cookies so they apply to localhost
        Cookies.set("access", loginData.access, { expires: 1, path: "/" });
      }
      if (loginData.refresh) {
        Cookies.set("refresh", loginData.refresh, { expires: 7, path: "/" });
      }

      // Login successful - now fetch user data
      const userDataResponse = await fetch(`${API_BASE}/api/accounts/me`, {
        headers: {
          Authorization: `Bearer ${loginData.access}`,
        },
        credentials: "include",
      });

      if (userDataResponse.ok) {
        const userData = await userDataResponse.json();
        setUser(userData);

        // Cache the user data
        localStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        );

        return true;
      } else {
        // Failed to get user data - clear everything
        setUser(null);
        clearAllAuthCaches();
        throw new Error("Failed to fetch user data after login");
      }
    } catch (error) {
      // Ensure everything is cleared on any error
      setUser(null);
      clearAllAuthCaches();
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local state and cache first
      setUser(null);
      clearAllAuthCaches();

      // Call backend to clear cookies
      await fetch(`${API_BASE}/api/accounts/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (process.env.NODE_ENV === "development")
        console.log("✅ Logout successful");

      // Force full page reload to clear ALL state including React Query cache
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Still clear local state even if backend call fails
      setUser(null);
      clearAllAuthCaches();

      // Force full page reload even on error
      window.location.href = "/auth/login";
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth: checkAuthWithServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Removed useAuthToken since accessToken is not used for auth anymore

export const useAuthStatus = (): {
  isAuthenticated: boolean;
  isLoading: boolean;
} => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("ws_token");
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // With HTTP-only cookies, credentials are sent automatically
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // 🔥 Automatically includes HTTP-only cookies
    });

    return response;
  };

  return authenticatedFetch;
};
