// User types and interfaces for the authentication system

export type UserProfileType = "WORKER" | "CLIENT" | null;

export interface User {
  // Core user information
  accountID: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // For backward compatibility with NextAuth migration
  image?: string; // For backward compatibility with NextAuth migration
  profileImg?: string;
  profileType?: UserProfileType;

  // Contact information
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Profile details
  bio?: string;
  skills?: string[];
  experience?: string;
  hourlyRate?: number;
  availability?: boolean;
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  isActive?: boolean;

  // CLIENT-specific fields
  companyName?: string;
  industryType?: string;
  minimumBudget?: number;

  // WORKER-specific fields
  yearsOfExperience?: number;
  certifications?: string[];
  portfolio?: string[]; // URLs to portfolio items
  preferredJobTypes?: string[];

  // Additional profile fields
  languages?: string[];
  timezone?: string;
}

export interface AuthContextType {
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
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
