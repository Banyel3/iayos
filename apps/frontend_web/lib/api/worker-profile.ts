import { API_BASE_URL } from "./config";

// ========================================
// WORKER PHASE 1 - API CLIENT
// Profile Enhancement API Integration
// ========================================

// Types
export interface WorkerProfileData {
  bio: string;
  description: string;
  hourly_rate: number | null;
  profile_completion_percentage: number;
}

export interface ProfileCompletionData {
  completion_percentage: number;
  missing_fields: string[];
  recommendations: string[];
  completed_fields: string[];
}

export interface CertificationData {
  certificationID: number;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  certificate_url: string;
  is_verified: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
  verified_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItemData {
  portfolioID: number;
  image_url: string;
  caption: string;
  display_order: number;
  file_name: string;
  file_size: number | null;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface WorkerProfileResponse {
  success: boolean;
  message: string;
  profile_completion_percentage: number;
  bio: string;
  description: string;
  hourly_rate: number | null;
}

export interface CertificationResponse {
  success: boolean;
  message: string;
  certification?: CertificationData;
}

export interface PortfolioItemResponse {
  success: boolean;
  message: string;
  portfolio_item?: PortfolioItemData;
}

// ========================================
// PROFILE API FUNCTIONS
// ========================================

/**
 * Update worker profile (bio, description, hourly_rate)
 */
export async function updateWorkerProfile(data: {
  bio?: string;
  description?: string;
  hourly_rate?: number;
}): Promise<WorkerProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/accounts/worker/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

/**
 * Get profile completion percentage and recommendations
 */
export async function getProfileCompletion(): Promise<ProfileCompletionData> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/profile-completion`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get profile completion");
  }

  return response.json();
}

// ========================================
// CERTIFICATION API FUNCTIONS
// ========================================

/**
 * Add a new certification with optional file upload
 */
export async function addCertification(data: {
  name: string;
  organization?: string;
  issue_date?: string;
  expiry_date?: string;
  certificate_file?: File;
}): Promise<CertificationResponse> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.organization) formData.append("organization", data.organization);
  if (data.issue_date) formData.append("issue_date", data.issue_date);
  if (data.expiry_date) formData.append("expiry_date", data.expiry_date);
  if (data.certificate_file)
    formData.append("certificate_file", data.certificate_file);

  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/certifications`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add certification");
  }

  return response.json();
}

/**
 * Get all worker's certifications
 */
export async function getCertifications(): Promise<CertificationData[]> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/certifications`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get certifications");
  }

  return response.json();
}

/**
 * Update certification fields
 */
export async function updateCertification(
  certificationId: number,
  data: {
    name?: string;
    organization?: string;
    issue_date?: string;
    expiry_date?: string;
  }
): Promise<CertificationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/certifications/${certificationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update certification");
  }

  return response.json();
}

/**
 * Delete a certification
 */
export async function deleteCertification(
  certificationId: number
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/certifications/${certificationId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete certification");
  }

  return response.json();
}

// ========================================
// PORTFOLIO API FUNCTIONS
// ========================================

/**
 * Upload a portfolio image with optional caption
 */
export async function uploadPortfolioImage(
  image: File,
  caption?: string
): Promise<PortfolioItemResponse> {
  const formData = new FormData();
  formData.append("image", image);
  if (caption) formData.append("caption", caption);

  const response = await fetch(`${API_BASE_URL}/accounts/worker/portfolio`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload portfolio image");
  }

  return response.json();
}

/**
 * Get all portfolio images
 */
export async function getPortfolio(): Promise<PortfolioItemData[]> {
  const response = await fetch(`${API_BASE_URL}/accounts/worker/portfolio`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get portfolio");
  }

  return response.json();
}

/**
 * Update portfolio image caption
 */
export async function updatePortfolioCaption(
  portfolioId: number,
  caption: string
): Promise<PortfolioItemResponse> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/portfolio/${portfolioId}/caption`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ caption }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update caption");
  }

  return response.json();
}

/**
 * Reorder portfolio images
 */
export async function reorderPortfolio(
  portfolioIdOrder: number[]
): Promise<{ success: boolean; message: string; reordered_count: number }> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/portfolio/reorder`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ portfolio_id_order: portfolioIdOrder }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder portfolio");
  }

  return response.json();
}

/**
 * Delete a portfolio image
 */
export async function deletePortfolioImage(
  portfolioId: number
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/accounts/worker/portfolio/${portfolioId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete portfolio image");
  }

  return response.json();
}
