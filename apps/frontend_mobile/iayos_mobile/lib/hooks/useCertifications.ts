// lib/hooks/useCertifications.ts
// React Query hooks for managing worker certifications

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

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
  specializationId: number | null; // Linked skill ID
  skillName: string | null; // Linked skill name
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationRequest {
  name: string;
  organization: string; // Fixed: backend expects 'organization' not 'issuingOrganization'
  issueDate: string; // ISO date string
  expiryDate?: string; // ISO date string (optional)
  specializationId?: number; // Link to skill (optional)
  certificateFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface UpdateCertificationRequest {
  name?: string;
  organization?: string; // Fixed: backend expects 'organization' not 'issuingOrganization'
  issueDate?: string;
  expiryDate?: string;
  specializationId?: number; // Link to skill (optional)
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
      const response = await apiRequest(ENDPOINTS.CERTIFICATIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch certifications");
      }

      const data = await response.json();

      // Map backend response (snake_case) to frontend (camelCase)
      return data.map((cert: any) => ({
        id: cert.certificationID,
        name: cert.name,
        issuingOrganization: cert.issuing_organization,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        certificateUrl: cert.certificate_url,
        isVerified: cert.is_verified,
        isExpired: cert.is_expired,
        specializationId: cert.specializationId,
        skillName: cert.skillName,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt,
      }));
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
      const response = await apiRequest(ENDPOINTS.CERTIFICATION_DETAIL(id));

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
      formData.append("organization", data.organization); // Fixed: backend expects 'organization'
      formData.append("issue_date", data.issueDate);

      if (data.expiryDate) {
        formData.append("expiry_date", data.expiryDate);
      }

      if (data.specializationId) {
        formData.append("specialization_id", data.specializationId.toString());
      }

      // Add certificate file if provided
      if (data.certificateFile) {
        formData.append("certificate_file", {
          uri: data.certificateFile.uri,
          name: data.certificateFile.name,
          type: data.certificateFile.type,
        } as any);
      }

      const response = await apiRequest(ENDPOINTS.CERTIFICATIONS, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create certification");
      }

      const result = await response.json();

      // Map backend response (snake_case) to frontend (camelCase)
      if (result.certification) {
        return {
          id: result.certification.certificationID,
          name: result.certification.name,
          issuingOrganization: result.certification.issuing_organization,
          issueDate: result.certification.issue_date,
          expiryDate: result.certification.expiry_date,
          certificateUrl: result.certification.certificate_url,
          isVerified: result.certification.is_verified,
          isExpired: result.certification.is_expired,
          createdAt: result.certification.createdAt,
          updatedAt: result.certification.updatedAt,
        };
      }

      return result;
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

      // Add fields that are being updated (backend expects snake_case field names)
      if (data.name) formData.append("name", data.name);
      if (data.organization) formData.append("organization", data.organization); // Fixed: backend expects 'organization'
      if (data.issueDate) formData.append("issue_date", data.issueDate);
      if (data.expiryDate) formData.append("expiry_date", data.expiryDate);
      if (data.specializationId)
        formData.append("specialization_id", data.specializationId.toString());

      // Add certificate file if provided
      if (data.certificateFile) {
        formData.append("certificate_file", {
          uri: data.certificateFile.uri,
          name: data.certificateFile.name,
          type: data.certificateFile.type,
        } as any);
      }

      const response = await apiRequest(ENDPOINTS.CERTIFICATION_DETAIL(id), {
        method: "PUT",
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
      // Invalidate profile completion
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
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
      const response = await apiRequest(ENDPOINTS.CERTIFICATION_DETAIL(id), {
        method: "DELETE",
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
