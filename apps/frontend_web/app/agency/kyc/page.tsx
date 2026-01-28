"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import {
  useAgencyKYCAutofill,
  AGENCY_KYC_FIELD_CONFIG,
  ID_TYPES,
  AgencyKYCConfirmPayload,
} from "@/lib/hooks/useAgencyKYCAutofill";

interface KYCUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

const AgencyKYCPage = () => {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const user = authUser as KYCUser;
  const router = useRouter();
  const { showToast } = useToast();

  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // NEW: Business Type selector (determines registration authority)
  const [businessType, setBusinessType] = useState("SOLE_PROPRIETORSHIP");

  // NEW: ID Type selector for representative
  const [repIdType, setRepIdType] = useState("PHILSYS_ID");

  // Files
  const [businessPermit, setBusinessPermit] = useState<File | null>(null);
  const [repIDFront, setRepIDFront] = useState<File | null>(null);
  const [repIDBack, setRepIDBack] = useState<File | null>(null);
  const [addressProof, setAddressProof] = useState<File | null>(null);
  const [authLetterFile, setAuthLetterFile] = useState<File | null>(null);

  // Previews
  const [permitPreview, setPermitPreview] = useState("");
  const [repFrontPreview, setRepFrontPreview] = useState("");
  const [repBackPreview, setRepBackPreview] = useState("");
  const [addressPreview, setAddressPreview] = useState("");
  const [authLetterPreview, setAuthLetterPreview] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Loading state for navigation
  const [agencyKycStatus, setAgencyKycStatus] = useState<string | null>(null);
  const [agencyKycFiles, setAgencyKycFiles] = useState<any[]>([]);
  const [agencyKycNotes, setAgencyKycNotes] = useState<string | null>(null);

  // NEW: OCR Confirmation State (Step 5)
  const [ocrFields, setOcrFields] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [isConfirmingOcr, setIsConfirmingOcr] = useState(false);

  // Hook for OCR autofill data
  const {
    autofillData,
    hasAutofillData,
    needsConfirmation,
    isLoading: ocrLoading,
    getFieldValue,
    getFieldConfidence,
    getConfidenceColor,
    getConfidenceLabel,
    confirmData,
    isConfirming,
    refetch: refetchAutofill,
  } = useAgencyKYCAutofill();

  // AI Validation States
  const [isValidatingRepFront, setIsValidatingRepFront] = useState(false);
  const [isValidatingRepBack, setIsValidatingRepBack] = useState(false);
  const [repFrontValidationError, setRepFrontValidationError] = useState<
    string | null
  >(null);
  const [repBackValidationError, setRepBackValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // If authenticated, fetch agency KYC status to prevent duplicate submissions
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/agency/status`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const status = data?.status || data?.kycStatus || null;
        if (status) {
          setAgencyKycStatus(status);
          if (data?.files) setAgencyKycFiles(data.files || []);
          if (data?.notes) setAgencyKycNotes(data.notes || null);
          // If KYC already exists (pending/approved/rejected), show status page
          if (status !== "NOT_STARTED") {
            setCurrentStep(6); // Go to status page, not OCR confirmation
          }
        }
      } catch (err) {
        console.error("Failed to fetch agency kyc status", err);
      }
    };


    if (!isLoading && isAuthenticated) fetchStatus();
  }, [isAuthenticated, isLoading, router]);

  // Hydration fix: only render content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early returns moved to bottom to prevent Hook execution mismatch


  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return "Please upload an image or PDF file";
    }
    if (file.size > 15 * 1024 * 1024) {
      return "File size must be less than 15MB";
    }
    return null;
  };

  // AI Document Validation - validates ID photos have detectable face
  const validateDocumentWithAI = async (
    file: File,
    documentType: string,
  ): Promise<{
    valid: boolean;
    error?: string;
    warning?: string;
    details?: any;
  }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      // Pass ID type for type-specific OCR validation (unified naming)
      if (documentType === "REP_ID_FRONT" || documentType === "REP_ID_BACK") {
        formData.append("rep_id_type", repIdType);
      }

      const response = await fetch(
        `${API_BASE}/api/agency/kyc/validate-document`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const data = await response.json();
      // Handle HTTP error responses which have valid=false in body
      if (!response.ok && !data.error) {
        data.error = `Server error (${response.status})`;
      }
      return data;
    } catch (error) {
      console.error("AI validation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { valid: false, error: `Validation failed: ${errorMessage}` };
    }
  };

  const handleFilePreview = (
    file: File | null,
    setter: (s: string) => void,
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setBusinessPermit(f);
    handleFilePreview(f, setPermitPreview);
  };

  const handleRepFrontChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });

    // Show preview immediately
    handleFilePreview(f, setRepFrontPreview);
    setRepFrontValidationError(null);

    // Skip AI validation for PDFs (ID should be image)
    if (f.type === "application/pdf") {
      setRepIDFront(f);
      return;
    }

    // Run AI validation for face detection
    setIsValidatingRepFront(true);
    const result = await validateDocumentWithAI(f, "REP_ID_FRONT");
    setIsValidatingRepFront(false);

    if (!result.valid) {
      setRepFrontValidationError(
        result.error || "Face not detected in ID photo",
      );
      showToast({
        type: "error",
        title: "ID Validation Failed",
        message:
          result.error ||
          "Please upload a clear photo of your ID with your face visible",
      });
      // Clear preview on failure
      setRepFrontPreview("");
      return;
    }

    setRepIDFront(f);

    // Check if face detection was skipped (CompreFace unavailable) - show warning
    if (result.details?.face_detection_skipped) {
      showToast({
        type: "warning",
        title: "Manual Review Required",
        message:
          result.warning ||
          "Face verification unavailable. Your document will be reviewed manually.",
      });
    } else {
      showToast({
        type: "success",
        title: "ID Validated",
        message: "Face detected successfully",
      });
    }
  };

  const handleRepBackChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });

    // Show preview immediately
    handleFilePreview(f, setRepBackPreview);
    setRepBackValidationError(null);

    // Skip AI validation for PDFs
    if (f.type === "application/pdf") {
      setRepIDBack(f);
      return;
    }

    // Run AI validation for back of ID (face detection optional but quality check)
    setIsValidatingRepBack(true);
    const result = await validateDocumentWithAI(f, "REP_ID_BACK");
    setIsValidatingRepBack(false);

    if (!result.valid) {
      setRepBackValidationError(result.error || "ID back validation failed");
      showToast({
        type: "error",
        title: "ID Validation Failed",
        message:
          result.error || "Please upload a clear photo of the back of your ID",
      });
      // Clear preview on failure
      setRepBackPreview("");
      return;
    }

    setRepIDBack(f);

    // Check if face detection was skipped (CompreFace unavailable) - show warning
    if (result.details?.face_detection_skipped) {
      showToast({
        type: "warning",
        title: "Manual Review Required",
        message:
          result.warning ||
          "Face verification unavailable. Your document will be reviewed manually.",
      });
    } else {
      showToast({
        type: "success",
        title: "ID Back Validated",
        message: "Document accepted",
      });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setAddressProof(f);
    handleFilePreview(f, setAddressPreview);
  };

  const handleAuthLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });
    setAuthLetterFile(f);
    handleFilePreview(f, setAuthLetterPreview);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "permit" | "address" | "authLetter",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err)
      return showToast({ type: "error", title: "Invalid file", message: err });

    if (type === "permit") {
      setBusinessPermit(file);
      handleFilePreview(file, setPermitPreview);
    } else if (type === "front") {
      setRepIDFront(file);
      handleFilePreview(file, setRepFrontPreview);
    } else if (type === "back") {
      setRepIDBack(file);
      handleFilePreview(file, setRepBackPreview);
    } else if (type === "address") {
      setAddressProof(file);
      handleFilePreview(file, setAddressPreview);
    } else if (type === "authLetter") {
      setAuthLetterFile(file);
      handleFilePreview(file, setAuthLetterPreview);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) {
      if (!repIDFront || !repIDBack)
        return showToast({
          type: "warning",
          title: "Missing ID",
          message: "Please upload both front and back of authorized rep ID",
        });
      if (!businessPermit)
        return showToast({
          type: "warning",
          title: "Missing Document",
          message: "Please upload business permit",
        });
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!authLetterFile)
        return showToast({
          type: "warning",
          title: "Missing Authorization Letter",
          message:
            "Please upload an authorization letter on company letterhead",
        });
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.push("/agency/dashboard");
  };

  const handleSubmit = async () => {
    if (
      !businessName ||
      !registrationNumber ||
      !businessPermit ||
      !repIDFront ||
      !repIDBack ||
      !addressProof ||
      !authLetterFile
    ) {
      showToast({
        type: "warning",
        title: "Incomplete",
        message: "Please complete all required fields and uploads",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      // align field names with backend agency KYC endpoint
      formData.append("businessName", businessName);
      formData.append("businessDesc", businessDesc);
      formData.append("registrationNumber", registrationNumber);
      formData.append("business_type", businessType); // Business type for OCR filtering
      formData.append("rep_id_type", repIdType); // Issue #2: Include ID type
      formData.append("rep_front", repIDFront as Blob);
      formData.append("rep_back", repIDBack as Blob);
      formData.append("business_permit", businessPermit as Blob);
      formData.append("address_proof", addressProof as Blob);
      formData.append("auth_letter", authLetterFile as Blob);

      const upload = await fetch(`${API_BASE}/api/agency/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseData = await upload.json().catch(() => ({}));

      // Issue #3: Check for auto-rejection in response body, not just HTTP status
      if (!upload.ok) {
        let msg =
          responseData?.message || responseData?.error || "Upload failed";
        if (upload.status === 413) msg = "One or more files are too large";
        showToast({ type: "error", title: "Upload failed", message: msg });
        setIsSubmitting(false);
        return;
      }

      // Check if upload succeeded but documents were auto-rejected by AI
      if (responseData?.status === "REJECTED") {
        const rejectionReasons = responseData?.rejection_reasons || [];
        showToast({
          type: "error",
          title: "Documents Rejected",
          message:
            rejectionReasons[0] ||
            "Your documents failed AI verification. Please upload clearer images.",
        });
        // Update local state to show rejection
        setAgencyKycStatus("REJECTED");
        setAgencyKycNotes(rejectionReasons.join("\n"));
        if (responseData?.files) setAgencyKycFiles(responseData.files || []);
        setCurrentStep(6); // Go to status step
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: "success",
        title:
          agencyKycStatus?.toUpperCase() === "REJECTED"
            ? "Resubmitted"
            : "Submitted",
        message: "Documents uploaded. Please review the extracted data.",
      });

      // After successful upload, fetch autofill data and go to OCR confirmation step
      await refetchAutofill();
      setCurrentStep(5); // Issue #1: Go to OCR confirmation step
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to submit KYC",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Issue #1: Handle OCR field changes
  const handleOcrFieldChange = (key: string, value: string) => {
    setOcrFields((prev) => ({ ...prev, [key]: value }));
    setEditedFields((prev) => new Set(prev).add(key));
  };

  // Issue #1: Initialize OCR fields when autofill data loads
  useEffect(() => {
    if (hasAutofillData && autofillData?.fields) {
      const initialFields: Record<string, string> = {};
      AGENCY_KYC_FIELD_CONFIG.forEach((config) => {
        initialFields[config.key] = getFieldValue(config.key);
      });
      // Also include form fields that user entered
      if (businessName) initialFields["business_name"] = businessName;
      if (registrationNumber)
        initialFields["permit_number"] = registrationNumber;
      setOcrFields(initialFields);
    }
  }, [hasAutofillData, autofillData]);

  // Issue #1: Handle OCR confirmation submit
  const handleOcrConfirmSubmit = async () => {
    setIsConfirmingOcr(true);
    try {
      const payload: AgencyKYCConfirmPayload = {
        ...ocrFields,
        rep_id_type: repIdType,
        edited_fields: Array.from(editedFields),
      };

      await new Promise<void>((resolve, reject) => {
        confirmData(payload, {
          onSuccess: () => {
            showToast({
              type: "success",
              title: "Data Confirmed",
              message: "Your business information has been saved.",
            });
            fetchStatusAndGoToStep6();
            resolve();
          },
          onError: (error: Error) => {
            showToast({
              type: "error",
              title: "Confirmation Failed",
              message: error?.message || "Failed to confirm data",
            });
            reject(error);
          },
        });
      });
    } catch {
      // Error already shown in toast
    } finally {
      setIsConfirmingOcr(false);
    }
  };

  // Helper to fetch status and go to step 6
  const fetchStatusAndGoToStep6 = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agency/status`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const status = data?.status || data?.kycStatus || null;
        setAgencyKycStatus(status);
        if (data?.files) setAgencyKycFiles(data.files || []);
        if (data?.notes) setAgencyKycNotes(data.notes || null);
      }
    } catch {
      // Ignore errors
    }
    setCurrentStep(6);
  };

  const handleResubmit = () => {
    // Clear ALL state for a fresh resubmission - not just status

    // Clear KYC status
    setAgencyKycStatus(null);
    setAgencyKycNotes(null);
    setAgencyKycFiles([]);

    // Clear form fields
    setBusinessName("");
    setBusinessDesc("");
    setRegistrationNumber("");
    setRepIdType("PHILSYS_ID");

    // Clear all file uploads
    setBusinessPermit(null);
    setRepIDFront(null);
    setRepIDBack(null);
    setAddressProof(null);
    setAuthLetterFile(null);

    // Clear all previews
    setPermitPreview("");
    setRepFrontPreview("");
    setRepBackPreview("");
    setAddressPreview("");
    setAuthLetterPreview("");

    // Clear OCR/confirmation state
    setOcrFields({});
    setEditedFields(new Set());
    setIsConfirmingOcr(false);

    // Clear validation states
    setRepFrontValidationError(null);
    setRepBackValidationError(null);

    // Go back to step 1
    setCurrentStep(1);

    showToast({
      type: "info",
      title: "Resubmission Started",
      message: "Please upload corrected documents",
    });
  };

  const renderProgressBar = () => {
    const steps = 6; // Updated: 6 steps including OCR confirmation
    return (
      <div className="flex items-center justify-center space-x-2 mb-8">
        {Array.from({ length: steps }).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${index + 1 <= currentStep ? "bg-blue-500 w-12" : "bg-gray-300 w-8"}`}
          />
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Verify Your Agency
      </h1>
      <p className="text-gray-600 mb-6">
        Provide your business documents to verify your agency account.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          What to prepare:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Business registration certificate (DTI/SEC/CDA based on business
            type)
          </li>
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Authorized representative ID (front & back)
          </li>
          <li className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Proof of business address
          </li>
        </ul>
      </div>

      <button
        onClick={handleNextStep}
        className="w-full max-w-md bg-blue-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-600 transition-colors"
      >
        Get Started
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Upload Business Registration & Rep ID
      </h1>
      <p className="text-gray-600 mb-8">
        Upload your official business registration certificate (DTI/SEC/CDA).
        Take clear photos or upload PDFs.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Details
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business name <span className="text-red-500">*</span>
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="SOLE_PROPRIETORSHIP">
                Sole Proprietorship (DTI)
              </option>
              <option value="PARTNERSHIP">Partnership (SEC)</option>
              <option value="CORPORATION">Corporation (SEC)</option>
              <option value="COOPERATIVE">Cooperative (CDA/SEC)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {businessType === "SOLE_PROPRIETORSHIP" &&
                "📄 Upload DTI Certificate of Business Name Registration"}
              {businessType === "PARTNERSHIP" &&
                "📄 Upload SEC Certificate of Partnership Registration"}
              {businessType === "CORPORATION" &&
                "📄 Upload SEC Certificate of Incorporation"}
              {businessType === "COOPERATIVE" &&
                "📄 Upload CDA/SEC Certificate of Cooperative Registration"}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration number <span className="text-red-500">*</span>
            </label>
            <Input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder={
                businessType === "SOLE_PROPRIETORSHIP"
                  ? "e.g., BN-7663018 or Certificate ID"
                  : "e.g., SEC Registration No."
              }
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {businessType === "SOLE_PROPRIETORSHIP" &&
                "DTI Certificate of Business Name Registration"}
              {businessType === "PARTNERSHIP" &&
                "SEC Certificate of Partnership"}
              {businessType === "CORPORATION" &&
                "SEC Certificate of Incorporation"}
              {businessType === "COOPERATIVE" &&
                "CDA/SEC Certificate of Registration"}
              <span className="text-red-500"> *</span>
            </label>
            <label
              htmlFor="permitUpload"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
            >
              {permitPreview ? (
                <div>
                  <Image
                    src={permitPreview}
                    alt="Permit"
                    width={300}
                    height={180}
                    className="mx-auto rounded-lg object-cover"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Permit uploaded ✓
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload business permit (PDF or image){" "}
                    <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF (Max 15MB)
                  </p>
                </div>
              )}
            </label>
            <input
              id="permitUpload"
              type="file"
              accept="image/*,.pdf"
              onChange={handlePermitChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Authorized Representative ID
          </h2>

          {/* Issue #2: ID Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Type <span className="text-red-500">*</span>
            </label>
            <select
              value={repIdType}
              onChange={(e) => setRepIdType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {ID_TYPES.map((idType) => (
                <option key={idType.value} value={idType.value}>
                  {idType.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front side{" "}
              {isValidatingRepFront && (
                <span className="text-blue-500 text-xs ml-2">
                  Validating...
                </span>
              )}
            </label>
            <label
              htmlFor="repFront"
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center ${repFrontValidationError
                ? "border-red-400 bg-red-50"
                : repIDFront
                  ? "border-green-400"
                  : "border-gray-300 hover:border-blue-500"
                } ${isValidatingRepFront ? "opacity-60 pointer-events-none" : ""}`}
            >
              {isValidatingRepFront ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm text-blue-600">Detecting face...</p>
                </div>
              ) : repFrontPreview ? (
                <div className="relative">
                  <Image
                    src={repFrontPreview}
                    alt="Rep front"
                    width={250}
                    height={150}
                    className="mx-auto rounded-lg object-cover"
                  />
                  {repIDFront && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload front side <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (Max 15MB)</p>
                </div>
              )}
            </label>
            {repFrontValidationError && (
              <p className="text-red-500 text-xs mt-1">
                {repFrontValidationError}
              </p>
            )}
            <input
              id="repFront"
              type="file"
              accept="image/*"
              onChange={handleRepFrontChange}
              className="hidden"
              disabled={isValidatingRepFront}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Back side{" "}
              {isValidatingRepBack && (
                <span className="text-blue-500 text-xs ml-2">
                  Validating...
                </span>
              )}
            </label>
            <label
              htmlFor="repBack"
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center ${repBackValidationError
                ? "border-red-400 bg-red-50"
                : repIDBack
                  ? "border-green-400"
                  : "border-gray-300 hover:border-blue-500"
                } ${isValidatingRepBack ? "opacity-60 pointer-events-none" : ""}`}
            >
              {isValidatingRepBack ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm text-blue-600">
                    Validating document...
                  </p>
                </div>
              ) : repBackPreview ? (
                <div className="relative">
                  <Image
                    src={repBackPreview}
                    alt="Rep back"
                    width={250}
                    height={150}
                    className="mx-auto rounded-lg object-cover"
                  />
                  {repIDBack && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload back side <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (Max 15MB)</p>
                </div>
              )}
            </label>
            {repBackValidationError && (
              <p className="text-red-500 text-xs mt-1">
                {repBackValidationError}
              </p>
            )}
            <input
              id="repBack"
              type="file"
              accept="image/*"
              onChange={handleRepBackChange}
              className="hidden"
              disabled={isValidatingRepBack}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-8">
        <Button onClick={handleNextStep}>Continue</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Proof of Address & Authorization Letter
      </h1>
      <p className="text-gray-600 mb-6">
        Upload proof of business address and a signed authorization letter on
        company letterhead.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proof of business address (image or PDF)
        </label>
        <label
          htmlFor="addressUpload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
        >
          {addressPreview ? (
            <Image
              src={addressPreview}
              alt="Address"
              width={300}
              height={160}
              className="mx-auto rounded-lg object-cover"
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload proof of address
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, PDF (Max 15MB)
              </p>
            </div>
          )}
        </label>
        <input
          id="addressUpload"
          type="file"
          accept="image/*,.pdf"
          onChange={handleAddressChange}
          className="hidden"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authorization letter (signed on company letterhead)
        </label>
        <label
          htmlFor="authLetterUpload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 min-h-[150px] flex items-center justify-center"
        >
          {authLetterPreview ? (
            <Image
              src={authLetterPreview}
              alt="Authorization letter"
              width={300}
              height={200}
              className="mx-auto rounded-lg object-cover"
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload signed authorization letter (PDF or image){" "}
                <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, PNG, JPG (Max 15MB)
              </p>
            </div>
          )}
        </label>
        <input
          id="authLetterUpload"
          type="file"
          accept="image/*,.pdf"
          onChange={handleAuthLetterChange}
          className="hidden"
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button onClick={handleSubmit} className="bg-blue-500 text-white">
          Submit
        </Button>
      </div>
    </div>
  );

  const getStatusBadge = () => {
    const status = agencyKycStatus?.toUpperCase();
    if (status === "APPROVED") {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Verified
        </div>
      );
    }
    if (status === "REJECTED") {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 font-semibold">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Rejected
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Under Review
      </div>
    );
  };

  // Issue #1: Step 5 - OCR Confirmation Form
  const renderStep5 = () => {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Review Extracted Information
        </h1>
        <p className="text-gray-600 mb-6 text-center text-sm">
          We've extracted the following information from your documents. Please
          review and correct any errors before submitting.
        </p>

        {ocrLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading extracted data...</p>
          </div>
        ) : (
          <>
            {/* Business Information Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                Business Information
              </h2>
              <div className="space-y-4">
                {AGENCY_KYC_FIELD_CONFIG.filter(
                  (f) => f.section === "business",
                ).map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={ocrFields[field.key] || ""}
                        onChange={(e) =>
                          handleOcrFieldChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editedFields.has(field.key)
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-300"
                          }`}
                      />
                      {hasAutofillData && (
                        <div className="absolute right-2 top-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
                              getFieldConfidence(field.key),
                            )}`}
                          >
                            {getConfidenceLabel(getFieldConfidence(field.key))}
                          </span>
                        </div>
                      )}
                    </div>
                    {editedFields.has(field.key) && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ✏️ Edited by you
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Representative Information Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                Authorized Representative
              </h2>
              <div className="space-y-4">
                {AGENCY_KYC_FIELD_CONFIG.filter(
                  (f) => f.section === "representative",
                ).map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <div className="relative">
                      {field.type === "select" ? (
                        <select
                          value={ocrFields[field.key] || repIdType}
                          onChange={(e) => {
                            handleOcrFieldChange(field.key, e.target.value);
                            setRepIdType(e.target.value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${editedFields.has(field.key)
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-gray-300"
                            }`}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "date" ? "date" : "text"}
                          value={ocrFields[field.key] || ""}
                          onChange={(e) =>
                            handleOcrFieldChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editedFields.has(field.key)
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-gray-300"
                            }`}
                        />
                      )}
                      {hasAutofillData && field.type !== "select" && (
                        <div className="absolute right-2 top-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
                              getFieldConfidence(field.key),
                            )}`}
                          >
                            {getConfidenceLabel(getFieldConfidence(field.key))}
                          </span>
                        </div>
                      )}
                    </div>
                    {editedFields.has(field.key) && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ✏️ Edited by you
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Legend */}
            {hasAutofillData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Confidence Legend:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    High (&gt;80%)
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    Medium (50-80%)
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                    Low (&lt;50%)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleOcrConfirmSubmit}
                disabled={isConfirmingOcr}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isConfirmingOcr ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Step 6: Status Page (renamed from Step 4)
  const renderStep6 = () => {
    const status = agencyKycStatus?.toUpperCase();
    const isRejected = status === "REJECTED";
    const isApproved = status === "APPROVED";
    const isPending = status === "PENDING";

    return (
      <div className="text-center max-w-2xl mx-auto">
        {/* Status Header */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            KYC Verification Status
          </h1>
          <div className="flex justify-center mb-4">{getStatusBadge()}</div>
        </div>

        {/* Status-specific messages */}
        {isApproved && (
          <div className="mb-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-600 flex-shrink-0 mt-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left">
                <h3 className="font-semibold text-green-900 mb-1">
                  Agency Verified!
                </h3>
                <p className="text-sm text-green-800">
                  Your agency has been successfully verified. You now have full
                  access to all agency features including job management,
                  employee assignments, and performance analytics.
                </p>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Review in Progress
                </h3>
                <p className="text-sm text-yellow-800">
                  Our verification team is currently reviewing your submitted
                  documents. This usually takes 1-3 business days. You'll
                  receive an email notification once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && agencyKycNotes && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  Verification Rejected
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  Your KYC submission was rejected. Please review the feedback
                  below and resubmit with corrected documents.
                </p>
                <div className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-900 mb-1 uppercase tracking-wide">
                    Reviewer Feedback:
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {agencyKycNotes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submitted Files */}
        {agencyKycFiles && agencyKycFiles.length > 0 && (
          <div className="mb-6 text-left bg-gray-50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Submitted Documents ({agencyKycFiles.length})
            </h3>
            <div className="space-y-2">
              {agencyKycFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {f.file_name || f.fileName || `Document ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {f.fileType?.replace(/_/g, " ").toLowerCase() ||
                          "Document"}
                      </p>
                    </div>
                  </div>
                  {f.file_url || f.fileURL ? (
                    <a
                      href={f.file_url || f.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {isRejected && (
            <button
              onClick={handleResubmit}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Resubmit Documents
            </button>
          )}
          <button
            onClick={() => {
              setIsNavigating(true);
              router.push("/agency/dashboard");
            }}
            disabled={isNavigating}
            className={`px-6 py-3 rounded-full font-semibold transition-colors ${isRejected
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              }`}
          >
            {isRejected ? "Back to Dashboard" : "Go to Dashboard"}
          </button>
        </div>

        {/* Additional Info */}
        {isPending && (
          <p className="text-xs text-gray-500 mt-6">
            Need help? Contact support at{" "}
            <a
              href="mailto:support@iayos.ph"
              className="text-blue-600 hover:underline"
            >
              support@iayos.ph
            </a>
          </p>
        )}
      </div>
    );
  };

  // Hydration fix: only render content after mount
  if (!isMounted) return null;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl space-y-6">
          <div className="w-full max-w-2xl mx-auto">
            {renderProgressBar()}

            <div className="relative bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              {(isSubmitting || isNavigating) && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-blue-700 font-medium text-base">
                    {isNavigating ? "Loading..." : "Uploading your documents..."}
                  </div>
                </div>
              )}
              <div
                className={
                  (isSubmitting || isNavigating)
                    ? "opacity-50 pointer-events-none select-none"
                    : ""
                }
              >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep5()}
                {currentStep === 5 && renderStep5()}
                {currentStep === 6 && renderStep6()}
                {/* Fallback for any unmapped step */}
                {currentStep > 6 && renderStep6()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyKYCPage;
