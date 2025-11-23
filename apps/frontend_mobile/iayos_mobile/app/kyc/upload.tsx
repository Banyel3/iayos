// app/kyc/upload.tsx
// KYC document upload screen - Matches Next.js design

import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useKYC } from "@/lib/hooks/useKYC";
import CustomBackButton from "@/components/navigation/CustomBackButton";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        ]
      );
    }
  }, [hasSubmittedKYC, isPending, kycLoading, router]);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera and photo library access are required."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (type: "front" | "back" | "clearance" | "selfie") => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert("Select Image Source", "Choose how to upload", [
      { text: "Camera", onPress: () => captureImage(type) },
      { text: "Gallery", onPress: () => selectFromGallery(type) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const captureImage = async (
    type: "front" | "back" | "clearance" | "selfie"
  ) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(type, result.assets[0]);
    }
  };

  const selectFromGallery = async (
    type: "front" | "back" | "clearance" | "selfie"
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(type, result.assets[0]);
    }
  };

  const handleImageSelected = (
    type: "front" | "back" | "clearance" | "selfie",
    asset: ImagePicker.ImagePickerAsset
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

  const handleNext = () => {
    if (currentStep === 1 && !selectedIDType) {
      Alert.alert("Required", "Please select an ID type");
      return;
    }
    if (currentStep === 2 && (!frontIDFile || !backIDFile)) {
      Alert.alert("Required", "Please upload both sides of your ID");
      return;
    }
    if (currentStep === 3 && (!selectedClearanceType || !clearanceFile)) {
      Alert.alert("Required", "Please upload clearance certificate");
      return;
    }
    if (currentStep === 4 && !selfieFile) {
      Alert.alert("Required", "Please take a selfie");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
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

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(ENDPOINTS.KYC_UPLOAD, {
        method: "POST",
        headers,
        body: formData as any, // React Native FormData compatible with fetch
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(errorData.message || "Upload failed");
      }

      // Invalidate KYC status cache so banner and status page update immediately
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });

      Alert.alert("Success", "Your KYC documents have been submitted!", [
        { text: "OK", onPress: () => router.replace("/kyc/status") },
      ]);
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        error instanceof Error ? error.message : "Failed to upload"
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 1 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 4 ? "Submit" : "Next"}
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
