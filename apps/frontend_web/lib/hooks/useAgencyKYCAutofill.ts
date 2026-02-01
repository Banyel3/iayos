/**
 * useAgencyKYCAutofill Hook
 *
 * Fetches OCR-extracted business data for Agency KYC and provides
 * methods to confirm/edit the extracted data.
 *
 * Mirrors the mobile useKYCAutofill hook for consistency.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { API_BASE } from "@/lib/api/config";

// Field configuration for Agency KYC - business + representative info
export interface AgencyKYCField {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  section: "business" | "representative";
  /** If set, field only shown for these business types. If undefined, shown for all. */
  applicableBusinessTypes?: string[];
}

// Government ID types matching mobile app
export const ID_TYPES = [
  { value: "PHILSYS_ID", label: "Philippine ID (PhilSys/ePhilID)" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "PASSPORT", label: "Passport" },
  { value: "UMID", label: "UMID" },
  { value: "SSS_ID", label: "SSS ID" },
  { value: "PRC_ID", label: "PRC ID" },
  { value: "POSTAL_ID", label: "Postal ID" },
  { value: "VOTERS_ID", label: "Voter's ID" },
  { value: "TIN_ID", label: "TIN ID" },
  { value: "SENIOR_CITIZEN_ID", label: "Senior Citizen ID" },
  { value: "OFW_ID", label: "OFW ID" },
  { value: "OTHER", label: "Other Government ID" },
];

// Business types for conditional field rendering
export const BUSINESS_TYPES = {
  SOLE_PROPRIETORSHIP: "SOLE_PROPRIETORSHIP",
  PARTNERSHIP: "PARTNERSHIP",
  CORPORATION: "CORPORATION",
  COOPERATIVE: "COOPERATIVE",
} as const;

// Business type dropdown options (for select field)
export const BUSINESS_TYPE_OPTIONS = [
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship (DTI)" },
  { value: "PARTNERSHIP", label: "Partnership (SEC)" },
  { value: "CORPORATION", label: "Corporation (SEC)" },
  { value: "COOPERATIVE", label: "Cooperative (CDA)" },
];

// Field configuration for the editable form
export const AGENCY_KYC_FIELD_CONFIG: AgencyKYCField[] = [
  // Business Information
  {
    key: "business_name",
    label: "Business Name",
    required: true,
    placeholder: "ABC Services Corp.",
    section: "business",
    // Shown for all business types
  },
  {
    key: "business_type",
    label: "Business Type",
    required: true,
    type: "select",
    options: [
      { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship (DTI)" },
      { value: "PARTNERSHIP", label: "Partnership (SEC)" },
      { value: "CORPORATION", label: "Corporation (SEC)" },
      { value: "COOPERATIVE", label: "Cooperative (CDA)" },
    ],
    section: "business",
    // Dropdown to select business registration type
  },
  {
    key: "business_address",
    label: "Business Address",
    required: false,
    placeholder: "123 Business St., Makati City",
    section: "business",
    // Shown for all business types
  },
  {
    key: "dti_number",
    label: "DTI Business Name Number",
    required: false,
    placeholder: "BN-7663018",
    section: "business",
    // Only for Sole Proprietorship (DTI Registration)
    applicableBusinessTypes: [BUSINESS_TYPES.SOLE_PROPRIETORSHIP],
  },
  {
    key: "permit_number",
    label: "Certificate/Permit ID",
    required: false,
    placeholder: "BPXW658418425073",
    section: "business",
    // Shown for all - but labeled based on context (DTI Cert ID or Mayor's Permit No.)
  },
  {
    key: "permit_issue_date",
    label: "Valid From",
    required: false,
    placeholder: "2025-01-06",
    type: "date",
    section: "business",
    // Shown for all business types
  },
  {
    key: "permit_expiry_date",
    label: "Valid Until",
    required: false,
    placeholder: "2030-01-06",
    type: "date",
    section: "business",
    // Shown for all business types
  },
  {
    key: "sec_number",
    label: "SEC Registration Number",
    required: false,
    placeholder: "SEC-XXXXXXX",
    section: "business",
    // Only for Corporations and Partnerships
    applicableBusinessTypes: [
      BUSINESS_TYPES.CORPORATION,
      BUSINESS_TYPES.PARTNERSHIP,
    ],
  },
  // Representative Information
  {
    key: "rep_full_name",
    label: "Representative Full Name",
    required: true,
    placeholder: "Juan Dela Cruz",
    section: "representative",
  },
  {
    key: "rep_id_type",
    label: "ID Type",
    required: true,
    type: "select",
    options: ID_TYPES,
    section: "representative",
  },
  {
    key: "rep_id_number",
    label: "ID Number",
    required: true,
    placeholder: "1234-5678-9012",
    section: "representative",
  },
  {
    key: "rep_birth_date",
    label: "Date of Birth",
    required: false,
    placeholder: "YYYY-MM-DD",
    type: "date",
    section: "representative",
  },
  {
    key: "rep_address",
    label: "Representative Address",
    required: false,
    placeholder: "123 Home St., City",
    section: "representative",
  },
];

// Response types
export interface ExtractedField {
  value: string | null;
  confidence: number;
  source: "ocr" | "confirmed" | "manual";
}

export interface AgencyKYCAutofillResponse {
  success: boolean;
  has_extracted_data: boolean;
  extraction_status?: "PENDING" | "EXTRACTED" | "CONFIRMED" | "FAILED";
  needs_confirmation?: boolean;
  extracted_at?: string;
  confirmed_at?: string;
  fields?: Record<string, ExtractedField>;
  user_edited_fields?: string[];
  message?: string;
  error?: string;
}

export interface AgencyKYCConfirmPayload {
  business_name?: string;
  business_type?: string;
  business_address?: string;
  permit_number?: string;
  dti_number?: string;
  sec_number?: string;
  tin?: string;
  rep_full_name?: string;
  rep_id_type?: string;
  rep_id_number?: string;
  rep_birth_date?: string;
  rep_address?: string;
  edited_fields?: string[];
}

// Fetch autofill data
async function fetchAgencyKYCAutofill(): Promise<AgencyKYCAutofillResponse> {
  const response = await fetch(`${API_BASE}/api/agency/kyc/autofill`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch autofill data");
  }

  return response.json();
}

// Confirm autofill data
async function confirmAgencyKYCData(
  payload: AgencyKYCConfirmPayload,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/api/agency/kyc/confirm`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(data, "Failed to confirm data"));
  }

  return response.json();
}

// Main hook
export function useAgencyKYCAutofill() {
  const queryClient = useQueryClient();

  const {
    data: autofillData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AgencyKYCAutofillResponse>({
    queryKey: ["agency-kyc-autofill"],
    queryFn: fetchAgencyKYCAutofill,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmAgencyKYCData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-kyc-autofill"] });
      queryClient.invalidateQueries({ queryKey: ["agency-kyc-status"] });
    },
  });

  // Helper to get field value
  const getFieldValue = (fieldKey: string): string => {
    if (!autofillData?.fields) return "";
    const field = autofillData.fields[fieldKey];
    return field?.value || "";
  };

  // Helper to get field confidence (0-100)
  const getFieldConfidence = (fieldKey: string): number => {
    if (!autofillData?.fields) return 0;
    const field = autofillData.fields[fieldKey];
    return field?.confidence ? field.confidence * 100 : 0;
  };

  // Helper to get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return "text-green-600 bg-green-100";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Helper to get confidence label
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 90) return "High";
    if (confidence >= 70) return "Medium";
    return "Low";
  };

  return {
    autofillData,
    hasAutofillData: autofillData?.has_extracted_data || false,
    needsConfirmation: autofillData?.needs_confirmation || false,
    extractionStatus: autofillData?.extraction_status,
    isLoading,
    isError,
    error,
    refetch,
    // Confirm mutation
    confirmData: confirmMutation.mutate,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
    // Helpers
    getFieldValue,
    getFieldConfidence,
    getConfidenceColor,
    getConfidenceLabel,
  };
}

export default useAgencyKYCAutofill;
