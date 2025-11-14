import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import {
  useUploadCashProof,
  useCreateEscrowPayment,
  formatCurrency,
  calculateEscrowAmount,
} from "../../lib/hooks/usePayments";
import PaymentSummaryCard from "../../components/PaymentSummaryCard";

/**
 * Cash Payment Screen
 *
 * Allows users to upload proof of cash payment:
 * - Display payment instructions
 * - Camera/gallery picker for proof of payment
 * - Image preview with remove option
 * - Upload progress indicator
 * - Create escrow payment after upload
 *
 * Route params: jobId, budget, title
 */

export default function CashPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId: string;
    budget: string;
    title: string;
  }>();

  const jobId = parseInt(params.jobId);
  const budget = parseFloat(params.budget);
  const jobTitle = params.title || "Job";

  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadCashProofMutation = useUploadCashProof();
  const createEscrowPaymentMutation = useCreateEscrowPayment();

  const { halfBudget, platformFee, total } = calculateEscrowAmount(budget);

  // Request camera/gallery permissions
  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return (
      cameraPermission.status === "granted" &&
      galleryPermission.status === "granted"
    );
  };

  // Pick image from camera
  const pickImageFromCamera = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        "Permissions Required",
        "Please grant camera and gallery permissions to upload proof of payment."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofImage(result.assets[0].uri);
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        "Permissions Required",
        "Please grant gallery permissions to upload proof of payment."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofImage(result.assets[0].uri);
    }
  };

  // Show image source picker
  const showImagePicker = () => {
    Alert.alert("Upload Proof of Payment", "Choose image source", [
      { text: "Camera", onPress: pickImageFromCamera },
      { text: "Gallery", onPress: pickImageFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Remove selected image
  const removeImage = () => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setProofImage(null),
      },
    ]);
  };

  // Submit cash proof
  const handleSubmit = async () => {
    if (!proofImage) {
      Alert.alert("Error", "Please upload proof of payment before continuing.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload proof image with proper type
      await uploadCashProofMutation.mutateAsync({
        jobId,
        image: {
          uri: proofImage,
          type: "image/jpeg",
          name: `cash_proof_${jobId}_${Date.now()}.jpg`,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create escrow payment record
      await createEscrowPaymentMutation.mutateAsync({
        jobId,
        amount: total,
        paymentMethod: "cash",
      });

      // Navigate to payment status
      setTimeout(() => {
        router.replace({
          pathname: "/payments/status" as any,
          params: {
            jobId: jobId.toString(),
            status: "verifying",
            method: "cash",
          },
        });
      }, 500);
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        "Failed to upload proof of payment. Please try again."
      );
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel payment
  const handleCancel = () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cash Payment</Text>
          <Text style={styles.headerSubtitle}>{jobTitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Summary */}
        <PaymentSummaryCard jobBudget={budget} showBreakdown />

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.instructionTitle}>Payment Instructions</Text>
          </View>

          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Prepare cash payment of{" "}
                <Text style={styles.amountText}>{formatCurrency(total)}</Text>
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Take a clear photo of your proof of payment (receipt, bank
                deposit slip, etc.)
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Upload the photo below for admin verification
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.instructionText}>
                Wait for admin approval (usually within 24 hours)
              </Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              Cash payments require admin verification and may take 24-48 hours
              to process.
            </Text>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Proof of Payment</Text>
          <Text style={styles.sectionSubtitle}>
            Required - Clear photo of receipt or deposit slip
          </Text>

          {!proofImage ? (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={showImagePicker}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={40} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>
                Take Photo or Choose from Gallery
              </Text>
              <Text style={styles.uploadButtonHint}>JPG or PNG, max 10MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: proofImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
                disabled={isUploading}
              >
                <Ionicons name="close-circle" size={32} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={showImagePicker}
                disabled={isUploading}
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color={Colors.textSecondary}
                />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                Uploading... {uploadProgress}%
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!proofImage || isUploading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!proofImage || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Submit for Verification
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  instructionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  amountText: {
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    lineHeight: 18,
  },
  uploadSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  uploadButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.primary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  uploadButtonHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  imagePreviewContainer: {
    position: "relative",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePreview: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    gap: Spacing.xs,
  },
  changeImageText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
});
