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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await fetch("http://localhost:8000/api/accounts/me", {
        credentials: "include", // 🔥 HTTP-only cookies sent automatically
      });

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
        localStorage.removeItem("cached_user");
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("cached_user");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing cached data first
      localStorage.removeItem("cached_user");
      setUser(null);

      const response = await fetch("http://localhost:8000/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 🔥 Cookies handled automatically
      });

      if (!response.ok) {
        // Login failed - ensure everything is cleared
        setUser(null);
        localStorage.removeItem("cached_user");
        throw new Error("Login failed");
      }

      // Login successful - now fetch user data
      const userDataResponse = await fetch(
        "http://localhost:8000/api/accounts/me",
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
        localStorage.removeItem("cached_user");
        throw new Error("Failed to fetch user data after login");
      }
    } catch (error) {
      // Ensure everything is cleared on any error
      setUser(null);
      localStorage.removeItem("cached_user");
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local state and cache first
      setUser(null);
      localStorage.removeItem("cached_user");

      // Call backend to clear cookies
      await fetch("http://localhost:8000/api/accounts/logout", {
        method: "POST",
        credentials: "include",
      });

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Still clear local state even if backend call fails
      setUser(null);
      localStorage.removeItem("cached_user");
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
