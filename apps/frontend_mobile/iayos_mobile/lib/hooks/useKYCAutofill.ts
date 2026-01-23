// lib/hooks/useKYCAutofill.ts
// Hook for fetching and confirming AI-extracted KYC data

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

/**
 * Interface for extracted KYC field with confidence
 */
export interface KYCExtractedField {
  value: string | null;
  confidence: number; // 0.0 to 1.0
  source: "ocr" | "manual" | "confirmed";
}

/**
 * Interface for KYC auto-fill response
 */
export interface KYCAutofillResponse {
  success: boolean;
  has_extracted_data: boolean;
  extraction_status?: "PENDING" | "EXTRACTED" | "CONFIRMED" | "FAILED";
  needs_confirmation?: boolean;
  extracted_at?: string;
  confirmed_at?: string;
  fields?: {
    full_name?: KYCExtractedField;
    first_name?: KYCExtractedField;
    middle_name?: KYCExtractedField;
    last_name?: KYCExtractedField;
    date_of_birth?: KYCExtractedField;
    address?: KYCExtractedField;
    id_number?: KYCExtractedField;
    nationality?: KYCExtractedField;
    sex?: KYCExtractedField;
    document_type?: KYCExtractedField;
    place_of_birth?: KYCExtractedField;
    expiry_date?: KYCExtractedField;
    issue_date?: KYCExtractedField;
    // Clearance-specific fields (NBI/Police)
    clearance_number?: KYCExtractedField;
    clearance_type?: KYCExtractedField;
    clearance_issue_date?: KYCExtractedField;
    clearance_validity_date?: KYCExtractedField;
  };
  user_edited_fields?: string[];
  message?: string;
  error?: string;
}

/**
 * Interface for KYC confirm payload
 */
export interface KYCConfirmPayload {
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string;
  address?: string;
  id_number?: string;
  nationality?: string;
  sex?: string;
  place_of_birth?: string;
  // Clearance-specific fields (NBI/Police)
  clearance_number?: string;
  clearance_type?: "NBI" | "POLICE" | "NONE";
  clearance_issue_date?: string;
  clearance_validity_date?: string;
  edited_fields?: string[];
}

/**
 * Fetch AI-extracted KYC data for auto-fill
 */
const fetchKYCAutofill = async (): Promise<KYCAutofillResponse> => {
  const response = await apiRequest(ENDPOINTS.KYC_AUTOFILL, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch KYC auto-fill data");
  }

  return response.json();
};

/**
 * Confirm/save edited KYC data
 */
const confirmKYCData = async (payload: KYCConfirmPayload): Promise<any> => {
  const response = await apiRequest(ENDPOINTS.KYC_CONFIRM, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to confirm KYC data");
  }

  return response.json();
};

/**
 * Hook to fetch KYC auto-fill data
 */
export const useKYCAutofill = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
    KYCAutofillResponse,
    Error
  >({
    queryKey: ["kycAutofill"],
    queryFn: fetchKYCAutofill,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter since this is time-sensitive)
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });

  /**
   * Check if auto-fill data is available and needs confirmation
   */
  const hasAutofillData = data?.has_extracted_data ?? false;
  const needsConfirmation = data?.needs_confirmation ?? false;
  const extractionStatus = data?.extraction_status ?? "PENDING";
  const isConfirmed = extractionStatus === "CONFIRMED";
  const isFailed = extractionStatus === "FAILED";

  /**
   * Get extracted fields with defaults
   */
  const extractedFields = data?.fields ?? {};

  /**
   * Get list of fields user has edited
   */
  const userEditedFields = data?.user_edited_fields ?? [];

  /**
   * Invalidate auto-fill cache
   */
  const invalidateAutofill = () => {
    queryClient.invalidateQueries({ queryKey: ["kycAutofill"] });
  };

  /**
   * Get a field value with fallback
   */
  const getFieldValue = (fieldName: keyof typeof extractedFields): string => {
    const field = extractedFields[fieldName];
    return field?.value ?? "";
  };

  /**
   * Get a field's confidence score (0-100%)
   */
  const getFieldConfidence = (
    fieldName: keyof typeof extractedFields,
  ): number => {
    const field = extractedFields[fieldName];
    return Math.round((field?.confidence ?? 0) * 100);
  };

  /**
   * Check if a field has low confidence (below threshold)
   */
  const isLowConfidence = (
    fieldName: keyof typeof extractedFields,
    threshold = 0.7,
  ): boolean => {
    const field = extractedFields[fieldName];
    return (field?.confidence ?? 0) < threshold;
  };

  /**
   * Get confidence color for UI (red/yellow/green)
   */
  const getConfidenceColor = (
    fieldName: keyof typeof extractedFields,
  ): string => {
    const confidence = extractedFields[fieldName]?.confidence ?? 0;
    if (confidence >= 0.9) return "#22c55e"; // green-500
    if (confidence >= 0.7) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  return {
    // Data
    autofillData: data,
    hasAutofillData,
    needsConfirmation,
    extractionStatus,
    isConfirmed,
    isFailed,
    extractedFields,
    userEditedFields,
    extractedAt: data?.extracted_at,
    confirmedAt: data?.confirmed_at,

    // Query states
    isLoading,
    isError,
    error,
    isFetching,

    // Actions
    refetch,
    invalidateAutofill,

    // Helpers
    getFieldValue,
    getFieldConfidence,
    isLowConfidence,
    getConfidenceColor,
  };
};

/**
 * Hook to confirm/edit KYC extracted data
 */
export const useConfirmKYC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmKYCData,
    onSuccess: () => {
      // Invalidate both KYC status and auto-fill caches
      queryClient.invalidateQueries({ queryKey: ["kycAutofill"] });
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
};

/**
 * Helper to determine if all required fields are filled
 */
export const validateKYCFields = (
  fields: KYCConfirmPayload,
  requiredFields: (keyof KYCConfirmPayload)[] = [
    "full_name",
    "date_of_birth",
    "address",
    "id_number",
  ],
): { valid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  for (const fieldName of requiredFields) {
    const value = fields[fieldName];
    if (!value || (typeof value === "string" && !value.trim())) {
      missingFields.push(fieldName);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Format field name for display
 */
export const formatFieldName = (fieldName: string): string => {
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
