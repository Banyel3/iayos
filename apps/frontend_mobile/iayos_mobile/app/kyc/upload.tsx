// app/kyc/upload.tsx
// KYC document upload screen - Matches Next.js design
// Updated: Per-step OCR extraction with editable fields

import React, { useState, useEffect, useCallback } from "react";
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
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

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
  const [idExtractionData, setIdExtractionData] = useState<IDExtractionResponse | null>(null);
  const [idFormValues, setIdFormValues] = useState<Record<string, string>>({});
  const [showIdForm, setShowIdForm] = useState(false);

  // Clearance extraction data and editable values
  const [clearanceExtractionData, setClearanceExtractionData] = useState<ClearanceExtractionResponse | null>(null);
  const [clearanceFormValues, setClearanceFormValues] = useState<Record<string, string>>({});
  const [showClearanceForm, setShowClearanceForm] = useState(false);

  // Track if extraction is happening
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Redirect if KYC already submitted and pending (not rejected)
  useEffect(() => {
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

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Camera access is required to capture your documents for verification.",
      );
      return false;
    }
    return true;
  };

  const pickImage = async (type: "front" | "back" | "clearance" | "selfie") => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Security: Only allow camera capture, no gallery uploads
    // This ensures users take live photos of their documents
    captureImage(type);
  };

  const captureImage = async (
    type: "front" | "back" | "clearance" | "selfie",
  ) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(type, result.assets[0]);
    }
  };

  const handleImageSelected = (
    type: "front" | "back" | "clearance" | "selfie",
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    const imageFile: ImageFile = {
      uri: asset.uri,
      name: `${type}_${Date.now()}.jpg`,
      type: "image/jpeg",
    };

    switch (type) {
      case "front":
        setFrontIDFile(imageFile);
        break;
      case "back":
        setBackIDFile(imageFile);
        break;
      case "clearance":
        setClearanceFile(imageFile);
        break;
      case "selfie":
        setSelfieFile(imageFile);
        break;
    }
  };

  // Helper function to validate a single document
  const validateDocument = async (
    file: ImageFile,
    documentType: string,
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      formData.append("document_type", documentType);

      const response = await fetch(ENDPOINTS.KYC_VALIDATE_DOCUMENT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData as any,
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        // Check content-type to handle HTML error pages gracefully
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          console.error(`Validation API returned non-JSON response (${response.status}): ${contentType}`);
          return {
            valid: false,
            error: `Server error (${response.status}). Please try again later.`,
          };
        }
        
        try {
          const errorData = await response.json() as { error?: string };
          return { valid: false, error: errorData.error || "Validation failed" };
        } catch {
          return { valid: false, error: `Server error (${response.status}). Please try again.` };
        }
      }

      const data = (await response.json()) as {
        valid: boolean;
        error?: string;
      };
      return { valid: data.valid, error: data.error };
    } catch (error) {
      console.error("Validation error:", error);
      return {
        valid: false,
        error: "Failed to validate image. Please try again.",
      };
    }
  };

  const handleNext = async () => {
    // Step 1: ID Type selection (no validation needed)
    if (currentStep === 1 && !selectedIDType) {
      Alert.alert("Required", "Please select an ID type");
      return;
    }

    // Step 2: Front/Back ID - validate both images
    if (currentStep === 2 && (!frontIDFile || !backIDFile)) {
      Alert.alert("Required", "Please upload both sides of your ID");
      return;
    }

    // Step 3: Clearance - validate clearance image
    if (currentStep === 3 && (!selectedClearanceType || !clearanceFile)) {
      Alert.alert("Required", "Please upload clearance certificate");
      return;
    }

    // Step 4: Selfie - validate selfie image
    if (currentStep === 4 && !selfieFile) {
      Alert.alert("Required", "Please take a selfie");
      return;
    }

    // Per-step validation with AI (resolution, blur, face detection)
    setIsValidating(true);

    try {
      // Step 2: Validate ID documents
      if (currentStep === 2) {
        // Validate front ID
        const frontResult = await validateDocument(frontIDFile!, "FRONTID");
        if (!frontResult.valid) {
          Alert.alert(
            "Front ID Issue",
            frontResult.error || "Please retake the front of your ID",
          );
          setIsValidating(false);
          return;
        }

        // Validate back ID
        const backResult = await validateDocument(backIDFile!, "BACKID");
        if (!backResult.valid) {
          Alert.alert(
            "Back ID Issue",
            backResult.error || "Please retake the back of your ID",
          );
          setIsValidating(false);
          return;
        }

        // ===== OCR EXTRACTION: Extract ID data after validation =====
        setIsValidating(false);
        setIsExtracting(true);
        
        try {
          const idFormData = new FormData();
          idFormData.append("id_front", {
            uri: frontIDFile!.uri,
            name: frontIDFile!.name,
            type: frontIDFile!.type,
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
          
          setShowIdForm(true);
        } catch (extractError) {
          console.error("ID extraction error:", extractError);
          // Extraction failed - allow manual entry
          setIdExtractionData(null);
          setIdFormValues({
            full_name: "",
            id_number: "",
            birth_date: "",
            address: "",
            sex: "",
          });
          setShowIdForm(true);
        } finally {
          setIsExtracting(false);
        }
        
        // Don't proceed to next step - wait for user to review/edit form
        return;
      }

      // Step 3: Validate clearance document
      if (currentStep === 3) {
        const clearanceResult = await validateDocument(
          clearanceFile!,
          "CLEARANCE",
        );
        if (!clearanceResult.valid) {
          Alert.alert(
            "Clearance Issue",
            clearanceResult.error || "Please retake your clearance document",
          );
          setIsValidating(false);
          return;
        }

        // ===== OCR EXTRACTION: Extract clearance data after validation =====
        setIsValidating(false);
        setIsExtracting(true);
        
        try {
          const clearanceFormData = new FormData();
          clearanceFormData.append("clearance", {
            uri: clearanceFile!.uri,
            name: clearanceFile!.name,
            type: clearanceFile!.type,
          } as any);
          clearanceFormData.append("clearance_type", selectedClearanceType);
          
          const extractResult = await extractClearanceMutation.mutateAsync(clearanceFormData);
          
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
          
          setShowClearanceForm(true);
        } catch (extractError) {
          console.error("Clearance extraction error:", extractError);
          // Extraction failed - allow manual entry
          setClearanceExtractionData(null);
          setClearanceFormValues({
            holder_name: "",
            clearance_number: "",
            issue_date: "",
            validity_date: "",
            clearance_type: selectedClearanceType,
          });
          setShowClearanceForm(true);
        } finally {
          setIsExtracting(false);
        }
        
        // Don't proceed to next step - wait for user to review/edit form
        return;
      }

      // Step 4: Validate selfie (with face detection)
      if (currentStep === 4) {
        const selfieResult = await validateDocument(selfieFile!, "SELFIE");
        if (!selfieResult.valid) {
          Alert.alert(
            "Selfie Issue",
            selfieResult.error || "Please retake your selfie",
          );
          setIsValidating(false);
          return;
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      Alert.alert(
        "Validation Error",
        "Failed to validate your document. Please try again.",
      );
      setIsValidating(false);
      return;
    } finally {
      setIsValidating(false);
    }

    // All validations passed, proceed to next step or submit
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    // If showing ID form, hide it and stay on step 2
    if (showIdForm && currentStep === 2) {
      setShowIdForm(false);
      setIdExtractionData(null);
      setIdFormValues({});
      return;
    }
    
    // If showing clearance form, hide it and stay on step 3
    if (showClearanceForm && currentStep === 3) {
      setShowClearanceForm(false);
      setClearanceExtractionData(null);
      setClearanceFormValues({});
      return;
    }
    
    if (currentStep > 1) {
      // When going back, also reset the forms for that step
      if (currentStep === 3) {
        setShowIdForm(false);
        setIdExtractionData(null);
        setIdFormValues({});
      }
      if (currentStep === 4) {
        setShowClearanceForm(false);
        setClearanceExtractionData(null);
        setClearanceFormValues({});
      }
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Handle proceeding from ID extraction form to Step 3
  const handleProceedFromIdForm = () => {
    setShowIdForm(false);
    setCurrentStep(3);
  };

  // Handle proceeding from Clearance extraction form to Step 4
  const handleProceedFromClearanceForm = () => {
    setShowClearanceForm(false);
    setCurrentStep(4);
  };

  // Handle field value changes in ID form
  const handleIdFieldChange = (fieldName: string, value: string) => {
    setIdFormValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle field value changes in Clearance form
  const handleClearanceFieldChange = (fieldName: string, value: string) => {
    setClearanceFormValues(prev => ({
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
        formData.append("extracted_clearance_data", JSON.stringify(clearanceFormValues));
      }

      const response = await apiRequest(ENDPOINTS.KYC_UPLOAD, {
        method: "POST",
        body: formData as any, // React Native FormData compatible with apiRequest
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
          [{ text: "OK", onPress: () => router.replace("/kyc/status" as any) }],
        );
      } else {
        // Success - offer to review extracted data
        Alert.alert(
          "Documents Uploaded!",
          isRejected
            ? "Your KYC documents have been resubmitted. Would you like to review the extracted information?"
            : "Your KYC documents are being processed. Would you like to review the extracted information?",
          [
            {
              text: "Skip",
              onPress: () => router.replace("/kyc/status" as any),
            },
            {
              text: "Review Details",
              onPress: () => router.replace("/kyc/confirm" as any),
            },
          ],
        );
      }
    } catch (error) {
      // Network error or backend error - show failed message
      console.error("KYC upload error:", error);
      Alert.alert(
        "Upload Failed",
        error instanceof Error ? error.message : "Failed to upload. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
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
          {step < 4 && <View style={styles.stepLine} />}
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
        Take clear photos of front and back
      </Text>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Front Side</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickImage("front")}
        >
          {frontIDFile ? (
            <Image
              source={{ uri: frontIDFile.uri }}
              style={styles.previewImage}
            />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Back Side</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickImage("back")}
        >
          {backIDFile ? (
            <Image
              source={{ uri: backIDFile.uri }}
              style={styles.previewImage}
            />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ID Extraction Form - shown after OCR processing */}
      {showIdForm && (
        <KYCExtractionForm
          title="Verify ID Information"
          subtitle="Review and edit the extracted details"
          documentType="id"
          fields={idExtractionData?.fields || {}}
          values={idFormValues}
          onFieldChange={handleIdFieldChange}
          isLoading={isExtracting}
          error={extractIDMutation.error ? String(extractIDMutation.error) : undefined}
          onProceed={handleProceedFromIdForm}
          proceedButtonText="Continue to Clearance"
        />
      )}
    </View>
  );

  const renderStep3 = () => (
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
          style={styles.uploadBox}
          onPress={() => pickImage("clearance")}
        >
          {clearanceFile ? (
            <Image
              source={{ uri: clearanceFile.uri }}
              style={styles.previewImage}
            />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Clearance Extraction Form - shown after OCR processing */}
      {showClearanceForm && (
        <KYCExtractionForm
          title="Verify Clearance Information"
          subtitle="Review and edit the extracted details"
          documentType="clearance"
          fields={clearanceExtractionData?.fields || {}}
          values={clearanceFormValues}
          onFieldChange={handleClearanceFieldChange}
          isLoading={isExtracting}
          error={extractClearanceMutation.error ? String(extractClearanceMutation.error) : undefined}
          onProceed={handleProceedFromClearanceForm}
          proceedButtonText="Continue to Selfie"
        />
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Take a Selfie</Text>
      <Text style={styles.description}>Hold your ID next to your face</Text>

      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickImage("selfie")}
        >
          {selfieFile ? (
            <Image
              source={{ uri: selfieFile.uri }}
              style={styles.previewImage}
            />
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
      </ScrollView>

      {/* Hide footer when extraction form is shown (form has its own proceed button) */}
      {!showIdForm && !showClearanceForm && (
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
                  {isExtracting ? "Extracting..." : isValidating ? "Validating..." : "Submitting..."}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 4
                    ? isRejected
                      ? "Resubmit Documents"
                      : "Submit"
                    : "Next"}
                </Text>
                <Ionicons
                  name={currentStep === 4 ? "checkmark" : "arrow-forward"}
                  size={20}
                  color={Colors.white}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    paddingVertical: 20,
    backgroundColor: Colors.surface,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textHint,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 4,
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
});
