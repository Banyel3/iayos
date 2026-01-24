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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 Centralized cache clearing function
const clearAllAuthCaches = () => {
  const cacheKeys = [
    "cached_user",
    "cached_worker_availability",
    "ws_token", // WebSocket authentication token
    // Add any future cache keys here
  ];

  cacheKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
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
          const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

          if (cacheAge < CACHE_TTL && cachedUser) {
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

      const response = await fetch(
        `${API_BASE}/api/accounts/me`,
        {
          credentials: "include", // 🔥 HTTP-only cookies sent automatically
          signal: controller.signal,
        },
      );

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

      const response = await fetch(
        `${API_BASE}/api/accounts/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // 🔥 Cookies handled automatically
        },
      );

      if (!response.ok) {
        // Login failed - ensure everything is cleared
        setUser(null);
        clearAllAuthCaches();
        throw new Error("Login failed");
      }

      // Get the login response which includes tokens
      const loginData = await response.json();

      // Store access token for WebSocket authentication
      // (Cookies are HTTP-only, so WebSocket needs token via query param)
      if (loginData.access) {
        localStorage.setItem("ws_token", loginData.access);
      }

      // Login successful - now fetch user data
      const userDataResponse = await fetch(
        `${API_BASE}/api/accounts/me`,
        {
          credentials: "include",
        },
      );

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

      console.log("✅ Logout successful");

      // Immediately redirect to login page
      router.push("/auth/login");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Still clear local state even if backend call fails
      setUser(null);
      clearAllAuthCaches();

      // Redirect even on error
      router.push("/auth/login");
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
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

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
