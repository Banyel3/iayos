// lib/hooks/useCertifications.ts
// React Query hooks for managing worker certifications

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/lib/api/config";

// ===== TYPES =====

export interface Certification {
  id: number;
  name: string;
  issuingOrganization: string;
  issueDate: string; // ISO date string
  expiryDate: string | null; // ISO date string or null
  certificateUrl: string | null; // Supabase URL
  isVerified: boolean;
  isExpired: boolean; // Computed on backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationRequest {
  name: string;
  issuingOrganization: string;
  issueDate: string; // ISO date string
  expiryDate?: string; // ISO date string (optional)
  certificateFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface UpdateCertificationRequest {
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

// ===== HOOKS =====

/**
 * Fetch all certifications for the current worker
 * Cached for 5 minutes
 */
export const useCertifications = () => {
  return useQuery<Certification[]>({
    queryKey: ["certifications"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.CERTIFICATIONS, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certifications");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single certification by ID
 */
export const useCertification = (id: number) => {
  return useQuery<Certification>({
    queryKey: ["certification", id],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.CERTIFICATION_DETAIL(id), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certification");
      }

      return response.json();
    },
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create a new certification
 * Supports multipart form data for certificate image upload
 */
export const useCreateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCertificationRequest) => {
      const formData = new FormData();

      // Add text fields
      formData.append("name", data.name);
      formData.append("issuingOrganization", data.issuingOrganization);
      formData.append("issueDate", data.issueDate);

      if (data.expiryDate) {
        formData.append("expiryDate", data.expiryDate);
      }

      // Add certificate file if provided
      if (data.certificateFile) {
        formData.append("certificate", {
          uri: data.certificateFile.uri,
          name: data.certificateFile.name,
          type: data.certificateFile.type,
        } as any);
      }

      const response = await fetch(ENDPOINTS.CERTIFICATIONS, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create certification");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate certifications list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      // Invalidate worker profile (affects completion percentage)
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
};

/**
 * Update an existing certification
 */
export const useUpdateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCertificationRequest;
    }) => {
      const formData = new FormData();

      // Add fields that are being updated
      if (data.name) formData.append("name", data.name);
      if (data.issuingOrganization)
        formData.append("issuingOrganization", data.issuingOrganization);
      if (data.issueDate) formData.append("issueDate", data.issueDate);
      if (data.expiryDate) formData.append("expiryDate", data.expiryDate);

      // Add certificate file if provided
      if (data.certificateFile) {
        formData.append("certificate", {
          uri: data.certificateFile.uri,
          name: data.certificateFile.name,
          type: data.certificateFile.type,
        } as any);
      }

      const response = await fetch(ENDPOINTS.CERTIFICATION_DETAIL(id), {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update certification");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate certifications list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      // Invalidate specific certification
      queryClient.invalidateQueries({
        queryKey: ["certification", variables.id],
      });
    },
  });
};

/**
 * Delete a certification
 */
export const useDeleteCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(ENDPOINTS.CERTIFICATION_DETAIL(id), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete certification");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate certifications list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      // Invalidate worker profile
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
};

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a certification is expired
 */
export const isCertificationExpired = (
  certification: Certification
): boolean => {
  if (!certification.expiryDate) return false;
  return new Date(certification.expiryDate) < new Date();
};

/**
 * Get days until expiry (negative if expired)
 */
export const getDaysUntilExpiry = (
  certification: Certification
): number | null => {
  if (!certification.expiryDate) return null;

  const today = new Date();
  const expiry = new Date(certification.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Format date for display
 */
export const formatCertificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
