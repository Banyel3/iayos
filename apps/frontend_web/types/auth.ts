// User types and interfaces for the authentication system

export type UserProfileType = "WORKER" | "CLIENT" | null;

// types/auth.ts
export interface User {
  accountID?: number; // Make optional with ?
  email: string;
  role?: "ADMIN" | "USER"; // Add role property
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileImg?: string;
    profileType?: UserProfileType;
  };
  user_data?: any;
  skill_categories?: any[];
}

export interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null; // User can be null
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// API Response types
export interface LoginResponse {
  accountID: number;
  email: string;
  access: string;
  refresh: string;
  user?: Partial<User>;
}

export interface ApiError {
  detail: string;
  msBeforeNext?: number;
}

// Form validation types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProfileSetupFormData {
  selectedType: UserProfileType;
  email: string;
}
