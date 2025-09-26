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

const TOKEN_KEY = "accessToken";

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn("Failed to store token:", error);
  }
};

const removeStoredToken = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to remove token:", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        setAccessToken(storedToken);
        try {
          const response = await fetch(
            "http://127.0.0.1:8000/api/accounts/me",
            {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            const refreshed = await refreshTokenInternal();
            if (!refreshed) {
              removeStoredToken();
              setAccessToken(null);
            }
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          removeStoredToken();
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const isAuthenticated = Boolean(accessToken && user);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    setStoredToken(token);
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
      removeStoredToken();
    }
  };

  const refreshTokenInternal = async (): Promise<boolean> => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/refresh",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access);
        setStoredToken(data.access);
        if (data.user) {
          setUser(data.user);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const result = await refreshTokenInternal();
    if (!result) {
      setAccessToken(null);
      setUser(null);
      removeStoredToken();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const useAuthToken = (): string | null => {
  const { accessToken } = useAuth();
  return accessToken;
};

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
