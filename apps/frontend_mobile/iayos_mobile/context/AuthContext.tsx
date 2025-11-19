import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AuthContextType, RegisterPayload } from "../types";
import { ENDPOINTS, apiRequest } from "../lib/api/config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear all cached data
  const clearAllCaches = async () => {
    const cacheKeys = [
      "cached_user",
      "cached_worker_availability",
      "access_token",
    ];
    await Promise.all(cacheKeys.map((key) => AsyncStorage.removeItem(key)));
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
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await clearAllCaches();
      setUser(null);

      const response = await apiRequest(ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setUser(null);
        await clearAllCaches();
        throw new Error("Login failed");
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

        return true;
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

      if (!response.ok) {
        let message = "Registration failed";
        try {
          const errorData = await response.json();
          message =
            errorData?.error?.[0]?.message ||
            errorData?.message ||
            errorData?.detail ||
            message;
        } catch (parseError) {
          console.error("Failed to parse registration error:", parseError);
        }
        throw new Error(message);
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
        body: JSON.stringify({ profileType }),
      });

      if (response.ok) {
        // Refresh user data
        await checkAuth();
        return true;
      }

      throw new Error("Failed to assign role");
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
