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
import { API_BASE_URL } from "@/lib/api/config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 Centralized cache clearing function
const clearAllAuthCaches = () => {
  const cacheKeys = [
    "cached_user",
    "cached_worker_availability",
    // Add any future cache keys here
  ];

  cacheKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log("🗑️ Cleared all auth caches:", cacheKeys);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      // Always verify with server on mount - don't trust cache alone
      await checkAuthWithServer();
    };

    initializeAuth();
  }, []);

  const checkAuthWithServer = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}/api/accounts/me`,
        {
          credentials: "include", // 🔥 HTTP-only cookies sent automatically
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

        // 🔥 Cache user data (not token!) for faster subsequent loads
        localStorage.setItem(
          "cached_user",
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          })
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
        `${API_BASE_URL.replace("/api", "")}/api/accounts/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // 🔥 Cookies handled automatically
        }
      );

      if (!response.ok) {
        // Login failed - ensure everything is cleared
        setUser(null);
        clearAllAuthCaches();
        throw new Error("Login failed");
      }

      // Login successful - now fetch user data
      const userDataResponse = await fetch(
        `${API_BASE_URL.replace("/api", "")}/api/accounts/me`,
        {
          credentials: "include",
        }
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
          })
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
      await fetch(`${API_BASE_URL.replace("/api", "")}/api/accounts/logout`, {
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
