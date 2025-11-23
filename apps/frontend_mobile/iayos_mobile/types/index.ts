// Type definitions for iAyos Mobile App

export interface User {
  id: number;
  accountID: number; // Backend returns accountID for authenticated requests
  email: string;
  isVerified: boolean;
  kycVerified: boolean; // Lowercase to match backend response
  accountType?: "INDIVIDUAL" | "AGENCY";
  profile_data?: ProfileData;
}

export interface ProfileData {
  id: number;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  contactNum?: string;
  birthDate?: string;
  profileType?: "WORKER" | "CLIENT" | null;
  profileImg?: string;
  latitude?: number;
  longitude?: number;
  workerProfileId?: number; // WorkerProfile.id (only for workers)
}

export interface WorkerProfile {
  id: number;
  hourlyRate?: number;
  bio?: string;
  description?: string;
  availabilityStatus: "AVAILABLE" | "BUSY" | "OFFLINE";
  profileCompletionPercentage: number;
  totalEarningGross: number;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  expectedDuration?: string;
  materialsNeeded?: string[];
  photos?: JobPhoto[];
  client?: {
    id: number;
    firstName?: string;
    lastName?: string;
    profileImg?: string;
  };
  specializations?: Specialization[];
}

export interface JobPhoto {
  id: number;
  photoURL: string;
  uploadedAt: string;
}

export interface Specialization {
  id: number;
  specializationName: string;
}

export interface JobApplication {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  proposalMessage: string;
  proposedBudget: number;
  budgetOption: "ACCEPT" | "NEGOTIATE";
  estimatedDuration?: string;
  appliedAt: string;
  job: Job;
}

export interface Agency {
  id: number;
  businessName: string;
  description?: string;
  logoUrl?: string;
  isKYCVerified: boolean;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
}

export interface Notification {
  id: number;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

export interface WalletBalance {
  success: boolean;
  balance: number;
  pending: number;
  this_month: number;
  total_earned: number;
  last_updated: string | null;
  currency: string;
  created: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "DEPOSIT" | "PAYMENT" | "REFUND" | "WITHDRAWAL";
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  description?: string;
}

export interface RegisterPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNum: string;
  birthDate: string;
  email: string;
  password: string;
  confirmPassword: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  assignRole: (profileType: "WORKER" | "CLIENT") => Promise<boolean>;
  switchProfile: (profileType: "WORKER" | "CLIENT") => Promise<void>;
}
