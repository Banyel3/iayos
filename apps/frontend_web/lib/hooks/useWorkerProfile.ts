import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateWorkerProfile,
  getProfileCompletion,
  addCertification,
  getCertifications,
  updateCertification,
  deleteCertification,
  uploadPortfolioImage,
  getPortfolio,
  updatePortfolioCaption,
  reorderPortfolio,
  deletePortfolioImage,
} from "@/lib/api/worker-profile";
import { toast } from "sonner";

// Query Keys
export const workerProfileKeys = {
  all: ["worker-profile"] as const,
  completion: () => [...workerProfileKeys.all, "completion"] as const,
  certifications: () => [...workerProfileKeys.all, "certifications"] as const,
  portfolio: () => [...workerProfileKeys.all, "portfolio"] as const,
};

// ========================================
// PROFILE HOOKS
// ========================================

/**
 * Hook to get profile completion data
 * Tier 2: Semi-static data - 1 hour background refresh
 */
export function useProfileCompletion(enabled: boolean = true) {
  return useQuery({
    queryKey: workerProfileKeys.completion(),
    queryFn: getProfileCompletion,
    enabled,
    staleTime: Infinity, // Use cache indefinitely
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: 60 * 60 * 1000, // Background refresh every 1 hour
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook to update worker profile
 */
export function useUpdateWorkerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: (data) => {
      // Invalidate profile completion to refresh
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.completion(),
      });
      toast.success(data.message || "Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

// ========================================
// CERTIFICATION HOOKS
// ========================================

/**
 * Hook to get all certifications
 * Tier 1: Static data - cache forever, manual refresh only
 */
export function useCertifications(enabled: boolean = true) {
  return useQuery({
    queryKey: workerProfileKeys.certifications(),
    queryFn: getCertifications,
    enabled,
    staleTime: Infinity, // Never auto-refetch
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: false, // No background refresh
  });
}

/**
 * Hook to add a certification
 */
export function useAddCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCertification,
    onSuccess: (data) => {
      // Invalidate both certifications and profile completion
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.certifications(),
      });
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.completion(),
      });
      toast.success(data.message || "Certification added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add certification");
    },
  });
}

/**
 * Hook to update a certification
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      data,
    }: {
      certificationId: number;
      data: {
        name?: string;
        organization?: string;
        issue_date?: string;
        expiry_date?: string;
      };
    }) => updateCertification(certificationId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.certifications(),
      });
      toast.success(data.message || "Certification updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update certification");
    },
  });
}

/**
 * Hook to delete a certification
 */
export function useDeleteCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCertification,
    onSuccess: (data) => {
      // Invalidate both certifications and profile completion
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.certifications(),
      });
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.completion(),
      });
      toast.success(data.message || "Certification deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete certification");
    },
  });
}

// ========================================
// PORTFOLIO HOOKS
// ========================================

/**
 * Hook to get all portfolio images
 * Tier 1: Static data - cache forever, manual refresh only
 */
export function usePortfolio(enabled: boolean = true) {
  return useQuery({
    queryKey: workerProfileKeys.portfolio(),
    queryFn: getPortfolio,
    enabled,
    staleTime: Infinity, // Never auto-refetch
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: false, // No background refresh
  });
}

/**
 * Hook to upload a portfolio image
 */
export function useUploadPortfolioImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ image, caption }: { image: File; caption?: string }) =>
      uploadPortfolioImage(image, caption),
    onSuccess: (data) => {
      // Invalidate both portfolio and profile completion
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.portfolio(),
      });
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.completion(),
      });
      toast.success(data.message || "Portfolio image uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload portfolio image");
    },
  });
}

/**
 * Hook to update portfolio caption
 */
export function useUpdatePortfolioCaption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      portfolioId,
      caption,
    }: {
      portfolioId: number;
      caption: string;
    }) => updatePortfolioCaption(portfolioId, caption),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.portfolio(),
      });
      toast.success(data.message || "Caption updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update caption");
    },
  });
}

/**
 * Hook to reorder portfolio images
 */
export function useReorderPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderPortfolio,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.portfolio(),
      });
      toast.success(data.message || "Portfolio reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder portfolio");
    },
  });
}

/**
 * Hook to delete a portfolio image
 */
export function useDeletePortfolioImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePortfolioImage,
    onSuccess: (data) => {
      // Invalidate both portfolio and profile completion
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.portfolio(),
      });
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.completion(),
      });
      toast.success(data.message || "Portfolio image deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete portfolio image");
    },
  });
}
