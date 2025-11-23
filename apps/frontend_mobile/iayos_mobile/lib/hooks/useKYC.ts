// lib/hooks/useKYC.ts
// Hook for fetching KYC verification status and history

import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import type { KYCStatusResponse } from "@/lib/types/kyc";

/**
 * Fetch KYC status for current user
 */
const fetchKYCStatus = async (): Promise<KYCStatusResponse> => {
  const response = await apiRequest(ENDPOINTS.KYC_STATUS, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch KYC status");
  }

  const data = await response.json();

  // Check if response has success wrapper
  const responseData = data.success ? data : { success: true, ...data };

  // Backend returns different structure - transform it
  const hasKYC =
    responseData.status !== "NOT_STARTED" && responseData.kyc_id != null;

  // Transform API response to match our interface
  return {
    hasKYC,
    status: responseData.status || "NOT_SUBMITTED",
    kycRecord: hasKYC
      ? {
          kycID: responseData.kyc_id,
          accountFK: 0, // Not returned by backend
          kyc_status: responseData.status,
          reviewedAt: responseData.reviewed_at,
          reviewedBy: undefined,
          notes: responseData.notes || "",
          createdAt: responseData.submitted_at,
          updatedAt: responseData.submitted_at,
          files: responseData.files || [],
        }
      : undefined,
    files: responseData.files || [],
    message: responseData.message,
  };
};

/**
 * Hook to fetch and manage KYC status
 */
export const useKYC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
    KYCStatusResponse,
    Error
  >({
    queryKey: ["kycStatus"],
    queryFn: fetchKYCStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    retry: 2,
  });

  /**
   * Manually invalidate KYC status cache
   */
  const invalidateKYCStatus = () => {
    queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
  };

  /**
   * Check if user has submitted KYC
   */
  const hasSubmittedKYC = data?.hasKYC || false;

  /**
   * Get current KYC status
   */
  const kycStatus = data?.status || "NOT_SUBMITTED";

  /**
   * Check if KYC is verified/approved
   */
  const isVerified = kycStatus === "APPROVED";

  /**
   * Check if KYC is pending review
   */
  const isPending = kycStatus === "PENDING";

  /**
   * Check if KYC is rejected
   */
  const isRejected = kycStatus === "REJECTED";

  /**
   * Get rejection reason/notes
   */
  const rejectionReason = data?.kycRecord?.notes || "";

  /**
   * Get uploaded documents
   */
  const uploadedDocuments = data?.files || [];

  /**
   * Get KYC submission date
   */
  const submissionDate = data?.kycRecord?.createdAt;

  /**
   * Get review date
   */
  const reviewDate = data?.kycRecord?.reviewedAt;

  return {
    // Data
    kycData: data,
    kycStatus,
    hasSubmittedKYC,
    isVerified,
    isPending,
    isRejected,
    rejectionReason,
    uploadedDocuments,
    submissionDate,
    reviewDate,

    // Query states
    isLoading,
    isError,
    error,
    isFetching,

    // Actions
    refetch,
    invalidateKYCStatus,
  };
};

/**
 * Fetch KYC application history
 */
const fetchKYCHistory = async () => {
  const response = await apiRequest(ENDPOINTS.KYC_APPLICATION_HISTORY, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch KYC history");
  }

  return response.json();
};

/**
 * Hook to fetch KYC application history
 */
export const useKYCHistory = () => {
  return useQuery({
    queryKey: ["kycHistory"],
    queryFn: fetchKYCHistory,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
};
