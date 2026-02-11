// app/kyc/upload.tsx
// KYC document upload screen - 7-step flow with separate verification screens
// Updated: Per-step OCR extraction with dedicated verification steps
// Updated: Uses expo-camera via /kyc/camera screen for real-time overlay guide

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useKYC } from "@/lib/hooks/useKYC";
import {
  useExtractID,
  useExtractClearance,
  IDExtractionResponse,
  ClearanceExtractionResponse,
  ExtractedFieldWithConfidence,
} from "@/lib/hooks/useKYCAutofill";
import CustomBackButton from "@/components/navigation/CustomBackButton";
import { KYCExtractionForm } from "@/components/KYC";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  ENDPOINTS,
  apiRequest,
  VALIDATION_TIMEOUT,
  OCR_TIMEOUT,
  KYC_UPLOAD_TIMEOUT,
} from "@/lib/api/config";
import { cameraEvents } from "@/lib/utils/cameraEvents";
import { compressImage } from "@/lib/utils/image-utils";

// Total steps in the KYC flow
const TOTAL_STEPS = 7;

type IDType =
  | ""
  | "NATIONALID"
  | "DRIVERSLICENSE"
  | "PASSPORT"
  | "UMID"
  | "PHILHEALTH";
type ClearanceType = "" | "POLICE" | "NBI";

interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

const ID_TYPES = [
  { value: "NATIONALID", label: "National ID", icon: "card-outline" },
  { value: "DRIVERSLICENSE", label: "Driver's License", icon: "car-outline" },
  { value: "PASSPORT", label: "Passport", icon: "airplane-outline" },
  { value: "UMID", label: "UMID", icon: "card-outline" },
  { value: "PHILHEALTH", label: "PhilHealth", icon: "medical-outline" },
];

const CLEARANCE_TYPES = [
  { value: "POLICE", label: "Police Clearance" },
  { value: "NBI", label: "NBI Clearance" },
];

export default function KYCUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    hasSubmittedKYC,
    isPending,
    isRejected,
    rejectionReason,
    isLoading: kycLoading,
  } = useKYC();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIDType, setSelectedIDType] = useState<IDType>("");
  const [selectedClearanceType, setSelectedClearanceType] =
    useState<ClearanceType>("");
  const [frontIDFile, setFrontIDFile] = useState<ImageFile | null>(null);
  const [backIDFile, setBackIDFile] = useState<ImageFile | null>(null);
  const [clearanceFile, setClearanceFile] = useState<ImageFile | null>(null);
  const [selfieFile, setSelfieFile] = useState<ImageFile | null>(null);

  // Per-step OCR extraction state
  const extractIDMutation = useExtractID();
  const extractClearanceMutation = useExtractClearance();

  // ID extraction data and editable values
  const [idExtractionData, setIdExtractionData] =
    useState<IDExtractionResponse | null>(null);
  const [idFormValues, setIdFormValues] = useState<Record<string, string>>({});

  // Clearance extraction data and editable values
  const [clearanceExtractionData, setClearanceExtractionData] =
    useState<ClearanceExtractionResponse | null>(null);
  const [clearanceFormValues, setClearanceFormValues] = useState<
    Record<string, string>
  >({});

  // Track if extraction is happening
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-document validation states (validate on upload like agency KYC)
  // This spreads memory usage over time instead of batching all validations on "Next"
  const [isValidatingFrontID, setIsValidatingFrontID] = useState(false);
  const [isValidatingBackID, setIsValidatingBackID] = useState(false);
  const [isValidatingClearance, setIsValidatingClearance] = useState(false);
  const [isValidatingSelfie, setIsValidatingSelfie] = useState(false);

  // Per-document error states for UI feedback
  const [frontIDError, setFrontIDError] = useState<string | null>(null);
  const [backIDError, setBackIDError] = useState<string | null>(null);
  const [clearanceError, setClearanceError] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);

  // Track if we just successfully submitted in this session to prevent duplicate alerts
  const hasJustSubmittedRef = useRef(false);

  // Camera guide modal removed - now using /kyc/camera screen with built-in overlay

  // Computed: is ANY validation in progress?
  const isValidating =
    isValidatingFrontID ||
    isValidatingBackID ||
    isValidatingClearance ||
    isValidatingSelfie;

  // Redirect if KYC already submitted and pending (not rejected)
  useEffect(() => {
    // If we just submitted in this session, don't show the "already submitted" alert
    if (hasJustSubmittedRef.current) return;

    if (!kycLoading && hasSubmittedKYC && isPending) {
      Alert.alert(
        "KYC Already Submitted",
        "Your KYC documents are currently under review. Please wait for the verification process to complete.",
        [
          {
            text: "View Status",
            onPress: () => router.replace("/kyc/status"),
          },
        ],
      );
    }
  }, [hasSubmittedKYC, isPending, kycLoading, router]);

  // Subscribe to camera capture events
  // When the camera screen captures a photo, it emits the URI back to us
  useEffect(() => {
    const unsubscribeFront = cameraEvents.on("front", (uri: string) => {
      console.log("[KYC] Received front ID photo from camera");
      handleCameraPhotoReceived("front", uri);
    });
    const unsubscribeBack = cameraEvents.on("back", (uri: string) => {
      console.log("[KYC] Received back ID photo from camera");
      handleCameraPhotoReceived("back", uri);
    });
    const unsubscribeClearance = cameraEvents.on("clearance", (uri: string) => {
      console.log("[KYC] Received clearance photo from camera");
      handleCameraPhotoReceived("clearance", uri);
    });
    const unsubscribeSelfie = cameraEvents.on("selfie", (uri: string) => {
      console.log("[KYC] Received selfie photo from camera");
      handleCameraPhotoReceived("selfie", uri);
    });

    return () => {
      unsubscribeFront();
      unsubscribeBack();
      unsubscribeClearance();
      unsubscribeSelfie();
    };
  }, []);

  // Handle photo received from camera screen
  const handleCameraPhotoReceived = (
    type: "front" | "back" | "clearance" | "selfie",
    uri: string,
  ) => {
    // Create a mock ImagePickerAsset-like object to reuse existing handleImageSelected
    // Note: ImagePickerAsset.type is "image" | "video" | etc., not MIME type
    const asset = {
      uri,
      width: 0,
      height: 0,
      fileName: `${type}_${Date.now()}.jpg`,
      type: "image",
      assetId: null,
      base64: null,
      exif: null,
      duration: null,
      mimeType: "image/jpeg",
    } as ImagePicker.ImagePickerAsset;

    handleImageSelected(type, asset);
  };

  const requestMediaPermissions = async () => {
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (mediaStatus !== "granted") {
      Alert.alert(
        "Gallery Permission Required",
        "Gallery access is required to select photos from your library.",
      );
      return false;
    }
    return true;
  };

  // Navigate to camera screen with real-time overlay guide
  const openCamera = (type: "front" | "back" | "clearance" | "selfie") => {
    router.push({
      pathname: "/kyc/camera",
      params: { documentType: type },
    });
  };

  const pickImage = async (type: "front" | "back" | "clearance" | "selfie") => {
    // Open camera screen directly - it has real-time overlay guide built-in
    // No need for pre-capture modal anymore
    openCamera(type);
  };

  // Legacy: For gallery selection (if we add a "Choose from gallery" option later)
  const pickFromGallery = async (
    type: "front" | "back" | "clearance" | "selfie",
  ) => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(type, result.assets[0]);
    }
  };

  const handleImageSelected = async (
    type: "front" | "back" | "clearance" | "selfie",
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    // Compress image for upload while preserving face detail and OCR readability
    // Target: ~1-2MB, 1600px max dimension, 0.85 quality (higher to preserve small face details on IDs)
    let finalUri = asset.uri;
    try {
      console.log(`[KYC] Compressing ${type} image...`);
      const compressed = await compressImage(asset.uri, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        format: "jpeg",
      });
      finalUri = compressed.uri;
      console.log(
        `[KYC] Compressed ${type}: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`,
      );
    } catch (compressError) {
      console.warn(
        `[KYC] Compression failed for ${type}, using original:`,
        compressError,
      );
    }

    const imageFile: ImageFile = {
      uri: finalUri,
      name: `${type}_${Date.now()}.jpg`,
      type: "image/jpeg",
    };

    // Map type to document type and state setters
    const config = {
      front: {
        docType: "FRONTID",
        setFile: setFrontIDFile,
        setValidating: setIsValidatingFrontID,
        setError: setFrontIDError,
        label: "Front ID",
      },
      back: {
        docType: "BACKID",
        setFile: setBackIDFile,
        setValidating: setIsValidatingBackID,
        setError: setBackIDError,
        label: "Back ID",
      },
      clearance: {
        docType: "CLEARANCE",
        setFile: setClearanceFile,
        setValidating: setIsValidatingClearance,
        setError: setClearanceError,
        label: "Clearance",
      },
      selfie: {
        docType: "SELFIE",
        setFile: setSelfieFile,
        setValidating: setIsValidatingSelfie,
        setError: setSelfieError,
        label: "Selfie",
      },
    }[type];

    // 1. Show preview immediately (optimistic UI)
    config.setFile(imageFile);
    config.setError(null);

    // 2. Validate immediately (like agency KYC pattern)
    // This prevents 502/503 errors from batch validation by spreading load
    config.setValidating(true);

    try {
      const result = await validateDocument(imageFile, config.docType);

      if (!result.valid) {
        // Validation failed - clear file and show error
        config.setFile(null);
        config.setError(result.error || "Validation failed");

        // Show alert with retry option
        Alert.alert(
          `${config.label} Issue`,
          result.error || "Please try again with a clearer image",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Retry",
              onPress: () => pickImage(type),
            },
          ],
        );
      }
      // If valid, file is already set from step 1
    } catch (error) {
      console.error(`[KYC] ${config.label} validation error:`, error);
      config.setFile(null);
      config.setError("Validation failed. Please try again.");

      Alert.alert(
        "Validation Error",
        "Failed to validate your document. Please check your connection and try again.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
            onPress: () => pickImage(type),
          },
        ],
      );
    } finally {
      config.setValidating(false);
    }
  };

  // Helper function to validate a single document
  const validateDocument = async (
    file: ImageFile,
    documentType: string,
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      formData.append("document_type", documentType);

      // Log the endpoint URL for debugging
      const endpointUrl = ENDPOINTS.KYC_VALIDATE_DOCUMENT;
      console.log(
        `[KYC Validate] Validating ${documentType} at: ${endpointUrl}`,
      );

      // Use apiRequest instead of raw fetch for better error handling and auto-auth
      // Use VALIDATION_TIMEOUT (30s) instead of OCR_TIMEOUT (5min) - validation doesn't do OCR
      const response = await apiRequest(endpointUrl, {
        method: "POST",
        body: formData as any,
        timeout: VALIDATION_TIMEOUT, // 30s for quality checks (no OCR)
      });

      console.log(`[KYC Validate] Response status: ${response.status}`);

      // Check content-type FIRST to handle HTML error pages (502, 503, etc.)
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          `[KYC Validate] Non-JSON response (${response.status}): ${contentType}`,
        );
        console.error(`[KYC Validate] Endpoint was: ${endpointUrl}`);
        // Provide user-friendly messages for common gateway errors
        if (response.status === 502) {
          return {
            valid: false,
            error:
              "Cannot reach server. Please check your connection and try again.",
          };
        }
        if (response.status === 503) {
          return {
            valid: false,
            error:
              "Service is temporarily unavailable. Please try again later.",
          };
        }
        if (response.status === 504) {
          return {
            valid: false,
            error: "Request timed out. Please try again.",
          };
        }
        return {
          valid: false,
          error: `Server error (${response.status}). Please try again later.`,
        };
      }

      // Handle 403 Forbidden specifically
      if (response.status === 403) {
        console.error(
          "[KYC Validate] 403 Forbidden - token may be expired or invalid",
        );
        return {
          valid: false,
          error: "Session expired. Please log in again to continue.",
        };
      }

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        try {
          const errorData = (await response.json()) as { error?: string };
          return {
            valid: false,
            error: errorData.error || "Validation failed",
          };
        } catch {
          return {
            valid: false,
            error: `Server error (${response.status}). Please try again.`,
          };
        }
      }

      // Parse successful JSON response with error handling
      try {
        const data = (await response.json()) as {
          valid: boolean;
          error?: string;
        };
        return { valid: data.valid, error: data.error };
      } catch (parseError) {
        console.error(
          "[KYC Validate] Failed to parse JSON response:",
          parseError,
        );
        return {
          valid: false,
          error: "Invalid server response. Please try again.",
        };
      }
    } catch (error) {
      console.error("[KYC Validate] Error:", error);
      // Check for network/abort errors
      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          return {
            valid: false,
            error:
              "Request timed out. Please check your connection and try again.",
          };
        }
        if (error.message.includes("Network request failed")) {
          return {
            valid: false,
            error: "Network error. Please check your internet connection.",
          };
        }
      }
      return {
        valid: false,
        error: "Failed to validate image. Please try again.",
      };
    }
  };

  const handleNext = async () => {
    // ==== 7-STEP KYC FLOW ====
    // Step 1: Select ID Type
    // Step 2: Upload ID Photos (front + back) - validation now happens on upload
    // Step 3: Verify/Edit ID Information (OCR extracted)
    // Step 4: Select Clearance Type + Upload - validation now happens on upload
    // Step 5: Verify/Edit Clearance Information (OCR extracted)
    // Step 6: Take Selfie - validation now happens on upload
    // Step 7: Review & Submit

    // NOTE: Document validation is now done inline when each image is captured.
    // This reduces memory pressure by spreading validation over time instead of batching.
    // handleNext now just checks files exist and runs OCR extraction.

    // Step 1: ID Type selection
    if (currentStep === 1 && !selectedIDType) {
      Alert.alert("Required", "Please select an ID type");
      return;
    }

    // Step 2: Front/Back ID upload - check files exist (already validated on capture)
    if (currentStep === 2) {
      if (!frontIDFile || !backIDFile) {
        Alert.alert("Required", "Please capture both sides of your ID");
        return;
      }

      // Check for validation errors
      if (frontIDError) {
        Alert.alert("Front ID Issue", frontIDError);
        return;
      }
      if (backIDError) {
        Alert.alert("Back ID Issue", backIDError);
        return;
      }

      // ===== OCR EXTRACTION: Extract ID data (no re-validation needed) =====
      setIsExtracting(true);

      try {
        const idFormData = new FormData();
        idFormData.append("id_front", {
          uri: frontIDFile.uri,
          name: frontIDFile.name,
          type: frontIDFile.type,
        } as any);
        idFormData.append("id_type", selectedIDType);

        const extractResult = await extractIDMutation.mutateAsync(idFormData);

        setIdExtractionData(extractResult);

        // Initialize form values from extraction
        if (extractResult.has_extraction && extractResult.fields) {
          const initialValues: Record<string, string> = {};
          Object.entries(extractResult.fields).forEach(([key, field]) => {
            if (field) {
              initialValues[key] = field.value || "";
            }
          });
          setIdFormValues(initialValues);
        } else {
          // No extraction - enable manual entry mode
          setIdFormValues({
            full_name: "",
            id_number: "",
            birth_date: "",
            address: "",
            sex: "",
          });
        }
      } catch (extractError) {
        console.error("ID extraction error:", extractError);
        // Extraction failed - notify user and allow manual entry
        Alert.alert(
          "Auto-Fill Unavailable",
          "We couldn't automatically extract your ID details. Please enter the information manually on the next screen.",
          [{ text: "OK", style: "default" }],
        );
        setIdExtractionData(null);
        setIdFormValues({
          full_name: "",
          id_number: "",
          birth_date: "",
          address: "",
          sex: "",
        });
      } finally {
        setIsExtracting(false);
      }

      // Proceed to Step 3 (ID verification)
      setCurrentStep(3);
      return;
    }

    // Step 3: ID verification - just check form values exist
    if (currentStep === 3) {
      if (!idFormValues.full_name?.trim() || !idFormValues.id_number?.trim()) {
        Alert.alert(
          "Required",
          "Please fill in at least your full name and ID number",
        );
        return;
      }
      // Proceed to step 4
      setCurrentStep(4);
      return;
    }

    // Step 4: Clearance type + upload - check file exists (already validated on capture)
    if (currentStep === 4) {
      if (!selectedClearanceType || !clearanceFile) {
        Alert.alert(
          "Required",
          "Please select clearance type and upload the document",
        );
        return;
      }

      // Check for validation error
      if (clearanceError) {
        Alert.alert("Clearance Issue", clearanceError);
        return;
      }

      // ===== OCR EXTRACTION: Extract clearance data (no re-validation needed) =====
      setIsExtracting(true);

      try {
        const clearanceFormData = new FormData();
        clearanceFormData.append("clearance", {
          uri: clearanceFile.uri,
          name: clearanceFile.name,
          type: clearanceFile.type,
        } as any);
        clearanceFormData.append("clearance_type", selectedClearanceType);

        const extractResult =
          await extractClearanceMutation.mutateAsync(clearanceFormData);

        setClearanceExtractionData(extractResult);

        // Initialize form values from extraction
        if (extractResult.has_extraction && extractResult.fields) {
          const initialValues: Record<string, string> = {};
          Object.entries(extractResult.fields).forEach(([key, field]) => {
            if (field) {
              initialValues[key] = field.value || "";
            }
          });
          // Set clearance type from selection
          initialValues.clearance_type = selectedClearanceType;
          setClearanceFormValues(initialValues);
        } else {
          // No extraction - enable manual entry mode
          setClearanceFormValues({
            holder_name: "",
            clearance_number: "",
            issue_date: "",
            validity_date: "",
            clearance_type: selectedClearanceType,
          });
        }
      } catch (extractError) {
        console.error("Clearance extraction error:", extractError);
        // Extraction failed - notify user and allow manual entry
        Alert.alert(
          "Auto-Fill Unavailable",
          "We couldn't automatically extract your clearance details. Please enter the information manually on the next screen.",
          [{ text: "OK", style: "default" }],
        );
        setClearanceExtractionData(null);
        setClearanceFormValues({
          holder_name: "",
          clearance_number: "",
          issue_date: "",
          validity_date: "",
          clearance_type: selectedClearanceType,
        });
      } finally {
        setIsExtracting(false);
      }

      // Proceed to Step 5 (Clearance verification)
      setCurrentStep(5);
      return;
    }

    // Step 5: Clearance verification - just check form values exist
    if (currentStep === 5) {
      if (!clearanceFormValues.clearance_number?.trim()) {
        Alert.alert("Required", "Please fill in the clearance number");
        return;
      }
      // Proceed to step 6
      setCurrentStep(6);
      return;
    }

    // Step 6: Selfie upload - check file exists (already validated on capture)
    if (currentStep === 6) {
      if (!selfieFile) {
        Alert.alert("Required", "Please take a selfie");
        return;
      }

      // Check for validation error
      if (selfieError) {
        Alert.alert("Selfie Issue", selfieError);
        return;
      }

      // Proceed to Step 7 (Review & Submit) - no re-validation needed
      setCurrentStep(7);
      return;
    }

    // Step 7: Submit
    if (currentStep === 7) {
      handleSubmit();
      return;
    }

    // Default: proceed to next step (shouldn't reach here)
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    // Step-by-step back navigation for 7-step flow
    if (currentStep > 1) {
      // Reset any data for the step we're leaving
      if (currentStep === 3) {
        // Leaving ID verification - clear extraction data
        setIdExtractionData(null);
        setIdFormValues({});
      }
      if (currentStep === 5) {
        // Leaving clearance verification - clear extraction data
        setClearanceExtractionData(null);
        setClearanceFormValues({});
      }
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Handle field value changes in ID form
  const handleIdFieldChange = (fieldName: string, value: string) => {
    setIdFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle field value changes in Clearance form
  const handleClearanceFieldChange = (fieldName: string, value: string) => {
    setClearanceFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get Bearer token for authentication
      const token = await AsyncStorage.getItem("access_token");

      const formData = new FormData();
      formData.append("accountID", user?.accountID?.toString() || "");
      formData.append("IDType", selectedIDType);
      formData.append("clearanceType", selectedClearanceType);

      formData.append("frontID", {
        uri: frontIDFile!.uri,
        name: frontIDFile!.name,
        type: frontIDFile!.type,
      } as any);

      formData.append("backID", {
        uri: backIDFile!.uri,
        name: backIDFile!.name,
        type: backIDFile!.type,
      } as any);

      formData.append("clearance", {
        uri: clearanceFile!.uri,
        name: clearanceFile!.name,
        type: clearanceFile!.type,
      } as any);

      formData.append("selfie", {
        uri: selfieFile!.uri,
        name: selfieFile!.name,
        type: selfieFile!.type,
      } as any);

      // Include extracted/edited ID fields
      if (Object.keys(idFormValues).length > 0) {
        formData.append("extracted_id_data", JSON.stringify(idFormValues));
      }

      // Include extracted/edited clearance fields
      if (Object.keys(clearanceFormValues).length > 0) {
        formData.append(
          "extracted_clearance_data",
          JSON.stringify(clearanceFormValues),
        );
      }

      const response = await apiRequest(ENDPOINTS.KYC_UPLOAD, {
        method: "POST",
        body: formData as any, // React Native FormData compatible with apiRequest
        timeout: KYC_UPLOAD_TIMEOUT, // 2 minutes for large file uploads
      });

      const responseData = (await response.json().catch(() => ({}))) as {
        message?: string;
        status?: string;
        auto_rejected?: boolean;
        rejection_reasons?: string[];
      };

      if (!response.ok) {
        // Upload failed on backend - don't invalidate cache
        throw new Error(responseData.message || "Upload failed");
      }

      // SUCCESS: Invalidate KYC status cache so banner and status page update immediately
      // Force refetch by setting staleTime to 0 temporarily
      hasJustSubmittedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
      // Also invalidate auto-fill cache to trigger extraction data fetch
      queryClient.invalidateQueries({ queryKey: ["kycAutofill"] });

      // Check if auto-rejected by AI verification
      if (responseData.auto_rejected || responseData.status === "REJECTED") {
        const reasons = responseData.rejection_reasons || [];
        const formattedReasons =
          reasons.length > 0
            ? reasons.map((r) => `• ${r}`).join("\n")
            : "Please ensure your documents are clear and readable.";

        Alert.alert(
          "Verification Failed",
          `Your documents could not be verified automatically:\n\n${formattedReasons}\n\nPlease resubmit with clearer images.`,
          [{ text: "View Status", onPress: () => router.replace("/kyc/status" as any) }],
        );
      } else {
        // Success - redirect to status
        Alert.alert(
          "Documents Uploaded!",
          isRejected
            ? "Your KYC documents have been resubmitted."
            : "Your KYC documents are being processed.",
          [
            {
              text: "View Status",
              onPress: () => router.replace("/kyc/status" as any),
            },
          ],
        );
      }
    } catch (error) {
      // Network error or backend error - show failed message
      console.error("KYC upload error:", error);
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "Failed to upload. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          {step < TOTAL_STEPS && <View style={styles.stepLine} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Select ID Type</Text>
      <Text style={styles.description}>
        Choose your primary government-issued ID
      </Text>

      {ID_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.option,
            selectedIDType === type.value && styles.optionSelected,
          ]}
          onPress={() => setSelectedIDType(type.value as IDType)}
        >
          <Ionicons
            name={type.icon as any}
            size={24}
            color={
              selectedIDType === type.value
                ? Colors.primary
                : Colors.textSecondary
            }
          />
          <Text
            style={[
              styles.optionText,
              selectedIDType === type.value && styles.optionTextSelected,
            ]}
          >
            {type.label}
          </Text>
          {selectedIDType === type.value && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Upload ID Photos</Text>
      <Text style={styles.description}>
        Take clear photos of front and back. Each photo is validated
        automatically.
      </Text>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Front Side</Text>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            frontIDFile && !frontIDError && styles.uploadBoxSuccess,
            frontIDError && styles.uploadBoxError,
          ]}
          onPress={() => pickImage("front")}
          disabled={isValidatingFrontID}
        >
          {isValidatingFrontID ? (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          ) : frontIDFile ? (
            <>
              <Image
                source={{ uri: frontIDFile.uri }}
                style={styles.previewImage}
              />
              {/* ID Frame Overlay on Preview */}
              <View style={styles.idFrameOverlay} pointerEvents="none">
                <View style={styles.idFrameCornerTL} />
                <View style={styles.idFrameCornerTR} />
                <View style={styles.idFrameCornerBL} />
                <View style={styles.idFrameCornerBR} />
              </View>
              {!frontIDError && (
                <View style={styles.uploadSuccessBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to capture</Text>
            </>
          )}
        </TouchableOpacity>
        {frontIDError && (
          <Text style={styles.uploadErrorText}>{frontIDError}</Text>
        )}
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Back Side</Text>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            backIDFile && !backIDError && styles.uploadBoxSuccess,
            backIDError && styles.uploadBoxError,
          ]}
          onPress={() => pickImage("back")}
          disabled={isValidatingBackID}
        >
          {isValidatingBackID ? (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          ) : backIDFile ? (
            <>
              <Image
                source={{ uri: backIDFile.uri }}
                style={styles.previewImage}
              />
              {/* ID Frame Overlay on Preview */}
              <View style={styles.idFrameOverlay} pointerEvents="none">
                <View style={styles.idFrameCornerTL} />
                <View style={styles.idFrameCornerTR} />
                <View style={styles.idFrameCornerBL} />
                <View style={styles.idFrameCornerBR} />
              </View>
              {/* ID Frame Overlay on Preview */}
              <View style={styles.idFrameOverlay} pointerEvents="none">
                <View style={styles.idFrameCornerTL} />
                <View style={styles.idFrameCornerTR} />
                <View style={styles.idFrameCornerBL} />
                <View style={styles.idFrameCornerBR} />
              </View>
              {!backIDError && (
                <View style={styles.uploadSuccessBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to capture</Text>
            </>
          )}
        </TouchableOpacity>
        {backIDError && (
          <Text style={styles.uploadErrorText}>{backIDError}</Text>
        )}
      </View>
    </View>
  );

  // Step 3: ID Verification Form (dedicated step)
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <KYCExtractionForm
        title="Verify ID Information"
        subtitle={
          idExtractionData?.has_extraction
            ? "Review and edit the extracted details"
            : "Please enter your ID details manually"
        }
        documentType="id"
        fields={idExtractionData?.fields || {}}
        values={idFormValues}
        onFieldChange={handleIdFieldChange}
        isLoading={isExtracting}
        error={
          extractIDMutation.error ? String(extractIDMutation.error) : undefined
        }
      />
    </View>
  );

  // Step 4: Clearance type selection + upload
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Clearance Certificate</Text>
      <Text style={styles.description}>Upload Police or NBI clearance</Text>

      {CLEARANCE_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.option,
            selectedClearanceType === type.value && styles.optionSelected,
          ]}
          onPress={() => setSelectedClearanceType(type.value as ClearanceType)}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={
              selectedClearanceType === type.value
                ? Colors.primary
                : Colors.textSecondary
            }
          />
          <Text
            style={[
              styles.optionText,
              selectedClearanceType === type.value && styles.optionTextSelected,
            ]}
          >
            {type.label}
          </Text>
          {selectedClearanceType === type.value && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Upload Clearance</Text>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            clearanceFile && !clearanceError && styles.uploadBoxSuccess,
            clearanceError && styles.uploadBoxError,
          ]}
          onPress={() => pickImage("clearance")}
          disabled={isValidatingClearance}
        >
          {isValidatingClearance ? (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          ) : clearanceFile ? (
            <>
              <Image
                source={{ uri: clearanceFile.uri }}
                style={styles.previewImage}
              />
              {/* Clearance Frame Overlay on Preview */}
              <View style={styles.idFrameOverlay} pointerEvents="none">
                <View style={styles.idFrameCornerTL} />
                <View style={styles.idFrameCornerTR} />
                <View style={styles.idFrameCornerBL} />
                <View style={styles.idFrameCornerBR} />
              </View>
              {!clearanceError && (
                <View style={styles.uploadSuccessBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to capture</Text>
            </>
          )}
        </TouchableOpacity>
        {clearanceError && (
          <Text style={styles.uploadErrorText}>{clearanceError}</Text>
        )}
      </View>
    </View>
  );

  // Step 5: Clearance Verification Form (dedicated step)
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <KYCExtractionForm
        title="Verify Clearance Information"
        subtitle={
          clearanceExtractionData?.has_extraction
            ? "Review and edit the extracted details"
            : "Please enter your clearance details manually"
        }
        documentType="clearance"
        fields={clearanceExtractionData?.fields || {}}
        values={clearanceFormValues}
        onFieldChange={handleClearanceFieldChange}
        isLoading={isExtracting}
        error={
          extractClearanceMutation.error
            ? String(extractClearanceMutation.error)
            : undefined
        }
      />
    </View>
  );

  // Step 6: Selfie
  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Take a Selfie</Text>
      <Text style={styles.description}>
        Hold your ID next to your face. Your photo will be validated
        automatically.
      </Text>

      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            selfieFile && !selfieError && styles.uploadBoxSuccess,
            selfieError && styles.uploadBoxError,
          ]}
          onPress={() => pickImage("selfie")}
          disabled={isValidatingSelfie}
        >
          {isValidatingSelfie ? (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          ) : selfieFile ? (
            <>
              <Image
                source={{ uri: selfieFile.uri }}
                style={styles.previewImage}
              />
              {!selfieError && (
                <View style={styles.uploadSuccessBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons
                name="camera-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to take photo</Text>
            </>
          )}
        </TouchableOpacity>
        {selfieError && (
          <Text style={styles.uploadErrorText}>{selfieError}</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={Colors.warning}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoTitle}>Important Tips</Text>
          <Text style={styles.infoText}>
            • Good lighting{"\n"}• Face clearly visible{"\n"}• Hold ID next to
            face{"\n"}• Remove glasses
          </Text>
        </View>
      </View>
    </View>
  );

  // Step 7: Review & Submit
  const renderStep7 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Review & Submit</Text>
      <Text style={styles.description}>
        Please review your information before submitting
      </Text>

      {/* Summary of uploaded documents */}
      <View style={styles.reviewSection}>
        <View style={styles.reviewItem}>
          <View style={styles.reviewItemHeader}>
            <Ionicons name="card-outline" size={24} color={Colors.primary} />
            <Text style={styles.reviewItemTitle}>Government ID</Text>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
          </View>
          <Text style={styles.reviewItemText}>
            {ID_TYPES.find((t) => t.value === selectedIDType)?.label ||
              selectedIDType}
          </Text>
          {idFormValues.full_name && (
            <Text style={styles.reviewItemDetail}>
              Name: {idFormValues.full_name}
            </Text>
          )}
          {idFormValues.id_number && (
            <Text style={styles.reviewItemDetail}>
              ID #: {idFormValues.id_number}
            </Text>
          )}
        </View>

        <View style={styles.reviewItem}>
          <View style={styles.reviewItemHeader}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.reviewItemTitle}>Clearance</Text>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
          </View>
          <Text style={styles.reviewItemText}>
            {CLEARANCE_TYPES.find((t) => t.value === selectedClearanceType)
              ?.label || selectedClearanceType}
          </Text>
          {clearanceFormValues.clearance_number && (
            <Text style={styles.reviewItemDetail}>
              Clearance #: {clearanceFormValues.clearance_number}
            </Text>
          )}
        </View>

        <View style={styles.reviewItem}>
          <View style={styles.reviewItemHeader}>
            <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            <Text style={styles.reviewItemTitle}>Selfie</Text>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
          </View>
          <Text style={styles.reviewItemText}>Photo captured</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={Colors.primary}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            • Your documents will be verified{"\n"}• This usually takes 1-2
            business days{"\n"}• You'll receive a notification once verified
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.headerRight} />
      </View>

      {renderStepIndicator()}

      {/* Rejection Banner - Show only on first step when resubmitting after rejection */}
      {isRejected && currentStep === 1 && (
        <View style={styles.rejectionBanner}>
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rejectionBannerTitle}>
              Previous Submission Rejected
            </Text>
            {rejectionReason ? (
              <Text style={styles.rejectionBannerReason}>
                Reason: {rejectionReason}
              </Text>
            ) : (
              <Text style={styles.rejectionBannerReason}>
                Please upload new documents to resubmit.
              </Text>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        {currentStep === 7 && renderStep7()}
      </ScrollView>

      {/* Footer with navigation buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isValidating || isSubmitting || isExtracting}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={
                isValidating || isSubmitting || isExtracting
                  ? Colors.textSecondary
                  : Colors.primary
              }
            />
            <Text
              style={[
                styles.backButtonText,
                (isValidating || isSubmitting || isExtracting) && {
                  color: Colors.textSecondary,
                },
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 1 && styles.nextButtonFull,
            (isValidating || isSubmitting || isExtracting) && { opacity: 0.7 },
          ]}
          onPress={handleNext}
          disabled={isSubmitting || isValidating || isExtracting}
        >
          {isSubmitting || isValidating || isExtracting ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>
                {isExtracting
                  ? "Extracting..."
                  : isValidating
                    ? "Validating..."
                    : "Submitting..."}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 7
                  ? isRejected
                    ? "Resubmit"
                    : "Submit"
                  : "Continue"}
              </Text>
              <Ionicons
                name={currentStep === 7 ? "checkmark" : "arrow-forward"}
                size={20}
                color={Colors.white}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Camera Guidance Modal removed - now using /kyc/camera screen with built-in overlay */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40, // Balance the back button on the left
  },
  rejectionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  rejectionBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 4,
  },
  rejectionBannerReason: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textHint,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  uploadSection: {
    marginTop: 8,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  uploadBox: {
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Review & Submit step styles
  reviewSection: {
    gap: 16,
    marginBottom: 20,
  },
  reviewItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  reviewItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  reviewItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 36,
  },
  reviewItemDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 36,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.sm,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: 8,
    ...Shadows.sm,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  // Per-document validation states
  uploadBoxSuccess: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  uploadBoxError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  validatingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  validatingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  uploadSuccessBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
  },
  uploadErrorText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.error,
    textAlign: "center",
  },
  // ID Frame Overlay styles for preview images
  idFrameOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  idFrameCornerTL: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    borderTopLeftRadius: 4,
  },
  idFrameCornerTR: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  idFrameCornerBL: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 4,
  },
  idFrameCornerBR: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  // Camera Guidance Modal styles removed - now using /kyc/camera screen with built-in overlay
});
