// lib/hooks/useKYC.ts
// Hook for fetching KYC verification status and history

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import type { KYCStatusResponse } from "@/lib/types/kyc";
import { useAuth } from "@/context/AuthContext";

/**
 * Fetch KYC status for current user
 */
const fetchKYCStatus = async (): Promise<KYCStatusResponse> => {
  const response = await apiRequest(ENDPOINTS.KYC_STATUS, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(getErrorMessage(errorData, "Failed to fetch KYC status"));
  }

  const data = (await response.json()) as {
    success?: boolean;
    status?: string;
    kyc_id?: number;
    reviewed_at?: string;
    notes?: string;
    submitted_at?: string;
    files?: Array<{ fileID: number; file_type: string; fileUrl: string }>;
    message?: string;
  };

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
  const { refreshUserData } = useAuth();

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
   * Get current KYC status (normalized to uppercase for comparisons)
   */
  const kycStatus = data?.status || "NOT_SUBMITTED";
  const normalizedStatus = kycStatus.toUpperCase();

  /**
   * Check if KYC is verified/approved
   */
  const isVerified = normalizedStatus === "APPROVED";

  /**
   * Check if KYC is pending review
   */
  const isPending = normalizedStatus === "PENDING";

  /**
   * Check if KYC is rejected
   */
  const isRejected = normalizedStatus === "REJECTED";

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

  // Track whether we've already refreshed user data for the current verified state
  const hasRefreshedForKYC = React.useRef(false);

  // Auto-refresh user data when KYC status changes to APPROVED
  // This ensures user.kycVerified is updated immediately, without causing a refresh loop
  React.useEffect(() => {
    if (!isLoading && isVerified && !hasRefreshedForKYC.current) {
      hasRefreshedForKYC.current = true;
      console.log("✅ [useKYC] KYC verified, refreshing user data...");
      refreshUserData().catch((err) => {
        console.error("❌ [useKYC] Failed to refresh user data:", err);
      });
    } else if (!isVerified) {
      // Allow a future verified transition to trigger a refresh again
      hasRefreshedForKYC.current = false;
    }
  }, [isVerified, isLoading, refreshUserData]);

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
    const errorData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(getErrorMessage(errorData, "Failed to fetch KYC history"));
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
