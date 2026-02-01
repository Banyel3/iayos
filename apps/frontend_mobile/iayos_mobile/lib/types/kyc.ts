// lib/types/kyc.ts
// TypeScript types for KYC verification system

/**
 * KYC Status Types
 */
export type KYCStatus = "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";

/**
 * KYC Document Types (matching backend kycFiles.IDType)
 */
export type KYCDocumentType =
  | "PASSPORT"
  | "NATIONALID"
  | "UMID"
  | "PHILHEALTH"
  | "DRIVERSLICENSE"
  | "POLICE"
  | "NBI"
  | "SELFIE"
  | "PROOF_OF_ADDRESS"
  | "BUSINESS_PERMIT";

/**
 * Document Category (for UI grouping)
 */
export type DocumentCategory = "GOVERNMENT_ID" | "CLEARANCE" | "SUPPORTING";

/**
 * KYC File Interface (uploaded document)
 */
export interface KYCFile {
  kycFileID: number;
  kycID: number;
  idType: KYCDocumentType;
  fileURL: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * KYC Record Interface
 */
export interface KYCRecord {
  kycID: number;
  accountFK: number;
  kyc_status: KYCStatus;
  reviewedAt?: string;
  reviewedBy?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  files: KYCFile[];
}

/**
 * KYC Status Response from API
 */
export interface KYCStatusResponse {
  hasKYC: boolean;
  status: KYCStatus;
  kycRecord?: KYCRecord;
  files?: KYCFile[];
  message?: string;
}

/**
 * Document Upload Payload
 */
export interface DocumentUploadPayload {
  documentType: KYCDocumentType;
  uri: string;
  fileName?: string;
}

/**
 * Multi-Document Upload Request
 */
export interface KYCUploadRequest {
  accountID: number;
  IDType: KYCDocumentType;
  clearanceType?: KYCDocumentType;
  documents: DocumentUploadPayload[];
}

/**
 * KYC Upload Response
 */
export interface KYCUploadResponse {
  success: boolean;
  message: string;
  kyc_id?: number;
  file_url?: string;
  file_name?: string;
  files?: KYCFile[];
}

/**
 * Document Type Configuration (for UI)
 */
export interface DocumentTypeConfig {
  type: KYCDocumentType;
  label: string;
  description: string;
  category: DocumentCategory;
  required: boolean;
  icon: string;
  instructions: string;
  examples?: string[];
  maxSizeMB: number;
  allowedFormats: string[];
  requiresBothSides?: boolean; // For ID cards (front/back)
}

/**
 * Document Capture Result
 */
export interface DocumentCaptureResult {
  type: KYCDocumentType;
  uri: string;
  fileName: string;
  fileSize: number;
  side?: "FRONT" | "BACK"; // For ID cards
}

/**
 * Upload Progress
 */
export interface UploadProgress {
  documentType: KYCDocumentType;
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Document Validation Result
 */
export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * KYC Submission Status
 */
export interface KYCSubmissionStatus {
  isSubmitting: boolean;
  uploadedDocuments: DocumentCaptureResult[];
  failedDocuments: DocumentCaptureResult[];
  currentUpload?: DocumentCaptureResult;
  progress: number; // 0-100
}

/**
 * Document Type Definitions (constant metadata)
 */
export const DOCUMENT_TYPES: Record<KYCDocumentType, DocumentTypeConfig> = {
  // Government IDs
  NATIONALID: {
    type: "NATIONALID",
    label: "National ID",
    description: "Philippine National ID (PhilSys)",
    category: "GOVERNMENT_ID",
    required: true,
    icon: "card-outline",
    instructions: "Capture both front and back of your National ID",
    examples: ["PhilSys ID", "ePhilID"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: true,
  },
  PASSPORT: {
    type: "PASSPORT",
    label: "Passport",
    description: "Philippine Passport",
    category: "GOVERNMENT_ID",
    required: false,
    icon: "book-outline",
    instructions: "Capture the data page of your passport",
    examples: ["Philippine Passport"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: false,
  },
  UMID: {
    type: "UMID",
    label: "UMID",
    description: "Unified Multi-Purpose ID",
    category: "GOVERNMENT_ID",
    required: false,
    icon: "card-outline",
    instructions: "Capture both front and back of your UMID",
    examples: ["SSS UMID"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: true,
  },
  PHILHEALTH: {
    type: "PHILHEALTH",
    label: "PhilHealth ID",
    description: "PhilHealth ID Card",
    category: "GOVERNMENT_ID",
    required: false,
    icon: "medkit-outline",
    instructions: "Capture both front and back of your PhilHealth ID",
    examples: ["PhilHealth Card"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: true,
  },
  DRIVERSLICENSE: {
    type: "DRIVERSLICENSE",
    label: "Driver's License",
    description: "LTO Driver's License",
    category: "GOVERNMENT_ID",
    required: false,
    icon: "car-outline",
    instructions: "Capture both front and back of your driver's license",
    examples: ["LTO License"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: true,
  },

  // Clearances
  NBI: {
    type: "NBI",
    label: "NBI Clearance",
    description: "NBI Clearance Certificate",
    category: "CLEARANCE",
    required: false,
    icon: "shield-checkmark-outline",
    instructions: "Capture your NBI clearance certificate",
    examples: ["NBI Clearance"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    requiresBothSides: false,
  },
  POLICE: {
    type: "POLICE",
    label: "Police Clearance",
    description: "Barangay/Police Clearance",
    category: "CLEARANCE",
    required: false,
    icon: "shield-outline",
    instructions: "Capture your police or barangay clearance",
    examples: ["Barangay Clearance", "Police Clearance"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    requiresBothSides: false,
  },

  // Supporting Documents
  SELFIE: {
    type: "SELFIE",
    label: "Selfie with ID",
    description: "Selfie holding your ID",
    category: "SUPPORTING",
    required: true,
    icon: "person-outline",
    instructions:
      "Take a selfie holding your ID next to your face. Ensure both your face and ID are clearly visible.",
    examples: ["Selfie with National ID", "Selfie with valid ID"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png"],
    requiresBothSides: false,
  },
  PROOF_OF_ADDRESS: {
    type: "PROOF_OF_ADDRESS",
    label: "Proof of Address",
    description: "Utility bill or bank statement",
    category: "SUPPORTING",
    required: false,
    icon: "home-outline",
    instructions:
      "Upload a recent utility bill or bank statement showing your address",
    examples: [
      "Electric bill",
      "Water bill",
      "Bank statement",
      "Barangay certificate",
    ],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    requiresBothSides: false,
  },
  BUSINESS_PERMIT: {
    type: "BUSINESS_PERMIT",
    label: "Business Permit",
    description: "DTI/SEC/Mayor's Permit",
    category: "SUPPORTING",
    required: false,
    icon: "business-outline",
    instructions: "Upload your business registration or permit",
    examples: ["DTI Registration", "SEC Certificate", "Mayor's Permit"],
    maxSizeMB: 10,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    requiresBothSides: false,
  },
};

/**
 * Get required documents for verification
 */
export const getRequiredDocuments = (): KYCDocumentType[] => {
  return Object.values(DOCUMENT_TYPES)
    .filter((config) => config.required)
    .map((config) => config.type);
};

/**
 * Get documents by category
 */
export const getDocumentsByCategory = (
  category: DocumentCategory
): DocumentTypeConfig[] => {
  return Object.values(DOCUMENT_TYPES).filter(
    (config) => config.category === category
  );
};

/**
 * Validate document file
 */
export const validateDocumentFile = (
  file: { uri: string; size: number; type?: string },
  documentType: KYCDocumentType
): DocumentValidationResult => {
  const config = DOCUMENT_TYPES[documentType];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > config.maxSizeMB) {
    errors.push(`File size exceeds ${config.maxSizeMB}MB limit`);
  }

  // Check file format (if type is provided)
  if (file.type && !config.allowedFormats.includes(file.type)) {
    errors.push(
      `File format not supported. Allowed: ${config.allowedFormats.join(", ")}`
    );
  }

  // File size warning
  if (fileSizeMB > 5 && fileSizeMB <= config.maxSizeMB) {
    warnings.push("Large file size may take longer to upload");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get KYC status display information
 */
export const getKYCStatusDisplay = (
  status: KYCStatus | string | undefined | null
) => {
  // Normalize status to uppercase for comparison
  const normalizedStatus = (status || "").toString().toUpperCase();

  switch (normalizedStatus) {
    case "NOT_SUBMITTED":
      return {
        label: "Not Submitted",
        color: "#757575",
        icon: "alert-circle-outline",
        description: "You haven't submitted KYC documents yet",
      };
    case "PENDING":
      return {
        label: "Pending Review",
        color: "#FF9800",
        icon: "time-outline",
        description: "Your documents are being reviewed by our team. This usually takes 1-3 days.",
      };
    case "APPROVED":
      return {
        label: "Verified",
        color: "#4CAF50",
        icon: "checkmark-circle-outline",
        description: "Your identity has been verified",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        color: "#F44336",
        icon: "close-circle-outline",
        description: "Your KYC submission was rejected",
      };
    default:
      // Fallback for unknown statuses
      return {
        label: status ? String(status) : "Unknown",
        color: "#757575",
        icon: "help-circle-outline",
        description: "Unable to determine KYC status",
      };
  }
};
