"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false, not loading

  // Optional: Check auth on mount if user might have existing cookies
  // Uncomment this if you want to restore auth state on page refresh
  // useEffect(() => {
  //   checkAuth();
  // }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 AuthContext: Checking authentication...");

      const response = await fetch("http://localhost:8000/api/accounts/me", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("📡 AuthContext: Response status:", response.status);

      if (!response.ok) {
        console.log("❌ AuthContext: Not authenticated");
        setAccessToken(null);
        setUser(null);
        return false;
      }

      const userData = await response.json();
      console.log("✅ AuthContext: Auth successful, user:", userData);

      setUser(userData);
      setAccessToken("authenticated");
      return true;
    } catch (error) {
      console.error("💥 AuthContext: Auth check error:", error);
      setAccessToken(null);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(user);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔄 AuthContext: Attempting login...");

      const response = await fetch("http://localhost:8000/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      // Check if response has errors
      if (data.error && data.error.length > 0) {
        const errorMessage = data.error[0].message;
        // console.log("❌ AuthContext: Login failed with error:", errorMessage);
        throw new Error(errorMessage); // Throw specific error message
      }

      if (!response.ok) {
        // console.log("❌ AuthContext: Login failed with status:", response.status);
        throw new Error(`Login failed with status ${response.status}`);
      }

      console.log("✅ AuthContext: Login successful, checking auth...");

      // Add a small delay to ensure cookies are fully set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now check authentication to get real user data
      const authSuccess = await checkAuth();
      if (authSuccess) {
        // console.log("✅ AuthContext: Login and auth check successful");
        return true;
      } else {
        // console.log("❌ AuthContext: Auth check failed after login");
        throw new Error("Authentication verification failed");
      }
    } catch (error) {
      // console.error("💥 AuthContext: Login error:", error);
      throw error; // Re-throw the error so caller can handle it
    }
  };

  const logout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/accounts/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshTokenInternal = async (): Promise<boolean> => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/refresh",
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAccessToken("authenticated");
        if (data.user) {
          setUser(data.user);
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const result = await refreshTokenInternal();
    if (!result) {
      setAccessToken(null);
      setUser(null);
    }
    return result;
  };

  const value = {
    accessToken,
    isLoading,
    isAuthenticated,
    user,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
  const { accessToken, refreshToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }
    }

    return response;
  };

  return authenticatedFetch;
};
