// app/kyc/upload.tsx
// KYC document upload wizard screen

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip } from "react-native-paper";
import { DocumentUploader } from "@/components/KYC/DocumentUploader";
import {
  UploadProgressBar,
  MultiUploadProgress,
} from "@/components/KYC/UploadProgressBar";
import { useKYCUpload } from "@/lib/hooks/useKYCUpload";
import { Colors, Typography, Spacing } from "@/constants/theme";
import type {
  DocumentCaptureResult,
  KYCDocumentType,
  DocumentCategory,
} from "@/lib/types/kyc";
import {
  DOCUMENT_TYPES,
  getDocumentsByCategory,
  getRequiredDocuments,
} from "@/lib/types/kyc";

type UploadStep =
  | "select_id"
  | "upload_documents"
  | "review"
  | "uploading"
  | "complete";

export default function KYCUploadScreen() {
  const router = useRouter();
  const { upload, isUploading, isSuccess, isError, error, progress } =
    useKYCUpload();

  // State
  const [currentStep, setCurrentStep] = useState<UploadStep>("select_id");
  const [selectedIDType, setSelectedIDType] =
    useState<KYCDocumentType>("NATIONALID");
  const [selectedClearanceType, setSelectedClearanceType] =
    useState<KYCDocumentType | null>(null);
  const [capturedDocuments, setCapturedDocuments] = useState<
    DocumentCaptureResult[]
  >([]);

  // Required documents based on selection
  const requiredDocuments = getRequiredDocuments();
  const idConfig = DOCUMENT_TYPES[selectedIDType];

  /**
   * Handle document capture
   */
  const handleDocumentCaptured = useCallback(
    (result: DocumentCaptureResult) => {
      setCapturedDocuments((prev) => {
        // Remove existing document of same type and side
        const filtered = prev.filter(
          (doc) => !(doc.type === result.type && doc.side === result.side)
        );
        return [...filtered, result];
      });
    },
    []
  );

  /**
   * Remove captured document
   */
  const handleRemoveDocument = useCallback(
    (type: KYCDocumentType, side?: "FRONT" | "BACK") => {
      setCapturedDocuments((prev) =>
        prev.filter((doc) => !(doc.type === type && doc.side === side))
      );
    },
    []
  );

  /**
   * Get captured document by type and side
   */
  const getCapturedDocument = (
    type: KYCDocumentType,
    side?: "FRONT" | "BACK"
  ) => {
    return capturedDocuments.find(
      (doc) => doc.type === type && doc.side === side
    );
  };

  /**
   * Check if all required documents are captured
   */
  const hasAllRequiredDocuments = () => {
    // Check for ID (front required, back if applicable)
    const hasFrontID = capturedDocuments.some(
      (doc) =>
        doc.type === selectedIDType &&
        (!idConfig.requiresBothSides || doc.side === "FRONT")
    );
    const hasBackID =
      !idConfig.requiresBothSides ||
      capturedDocuments.some(
        (doc) => doc.type === selectedIDType && doc.side === "BACK"
      );

    // Check for selfie (required)
    const hasSelfie = capturedDocuments.some((doc) => doc.type === "SELFIE");

    return hasFrontID && hasBackID && hasSelfie;
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (currentStep === "select_id") {
      setCurrentStep("upload_documents");
    } else if (currentStep === "upload_documents") {
      if (!hasAllRequiredDocuments()) {
        Alert.alert(
          "Missing Documents",
          "Please upload all required documents before continuing."
        );
        return;
      }
      setCurrentStep("review");
    } else if (currentStep === "review") {
      handleSubmit();
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep === "upload_documents") {
      setCurrentStep("select_id");
    } else if (currentStep === "review") {
      setCurrentStep("upload_documents");
    }
  };

  /**
   * Submit KYC documents
   */
  const handleSubmit = async () => {
    try {
      setCurrentStep("uploading");

      await upload(
        {
          documents: capturedDocuments,
          IDType: selectedIDType,
          clearanceType: selectedClearanceType || undefined,
          compress: true,
        },
        {
          onSuccess: () => {
            setCurrentStep("complete");
            setTimeout(() => {
              router.replace("/kyc/status");
            }, 2000);
          },
          onError: (err) => {
            setCurrentStep("review");
            Alert.alert(
              "Upload Failed",
              err instanceof Error ? err.message : "Failed to upload documents"
            );
          },
        }
      );
    } catch (err) {
      setCurrentStep("review");
      console.error("KYC submission error:", err);
      Alert.alert(
        "Upload Error",
        err instanceof Error ? err.message : "An error occurred"
      );
    }
  };

  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    const steps = [
      { key: "select_id", label: "Select ID" },
      { key: "upload_documents", label: "Upload" },
      { key: "review", label: "Review" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index <= currentStepIndex && styles.stepCircleActive,
              ]}
            >
              {index < currentStepIndex ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    index <= currentStepIndex && styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                index === currentStepIndex && styles.stepLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render ID selection step
   */
  const renderSelectIDStep = () => {
    const governmentIDs = getDocumentsByCategory("GOVERNMENT_ID");

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Select Your Government ID</Text>
        <Text style={styles.stepDescription}>
          {"Choose the primary ID document you'll use for verification"}
        </Text>

        <View style={styles.idOptions}>
          {governmentIDs.map((config) => (
            <TouchableIDCard
              key={config.type}
              config={config}
              selected={selectedIDType === config.type}
              onSelect={() => setSelectedIDType(config.type)}
            />
          ))}
        </View>

        {/* Optional Clearance Selection */}
        <Text style={styles.sectionTitle}>Additional Documents (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Upload clearance certificates to increase your trustworthiness
        </Text>

        <View style={styles.chipContainer}>
          {getDocumentsByCategory("CLEARANCE").map((config) => (
            <Chip
              key={config.type}
              selected={selectedClearanceType === config.type}
              onPress={() =>
                setSelectedClearanceType(
                  selectedClearanceType === config.type ? null : config.type
                )
              }
              style={styles.chip}
              mode="outlined"
            >
              {config.label}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render document upload step
   */
  const renderUploadStep = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Upload Documents</Text>
        <Text style={styles.stepDescription}>
          Take clear photos of your documents. Ensure all text is readable.
        </Text>

        {/* Required Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>

          {/* ID Front */}
          <DocumentUploader
            documentType={selectedIDType}
            side={idConfig.requiresBothSides ? "FRONT" : undefined}
            onDocumentCaptured={handleDocumentCaptured}
            onRemove={() => handleRemoveDocument(selectedIDType, "FRONT")}
            existingDocument={getCapturedDocument(selectedIDType, "FRONT")}
            disabled={isUploading}
          />

          {/* ID Back (if required) */}
          {idConfig.requiresBothSides && (
            <DocumentUploader
              documentType={selectedIDType}
              side="BACK"
              onDocumentCaptured={handleDocumentCaptured}
              onRemove={() => handleRemoveDocument(selectedIDType, "BACK")}
              existingDocument={getCapturedDocument(selectedIDType, "BACK")}
              disabled={isUploading}
            />
          )}

          {/* Selfie with ID */}
          <DocumentUploader
            documentType="SELFIE"
            onDocumentCaptured={handleDocumentCaptured}
            onRemove={() => handleRemoveDocument("SELFIE")}
            existingDocument={getCapturedDocument("SELFIE")}
            disabled={isUploading}
          />
        </View>

        {/* Optional Clearance */}
        {selectedClearanceType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional Documents</Text>
            <DocumentUploader
              documentType={selectedClearanceType}
              onDocumentCaptured={handleDocumentCaptured}
              onRemove={() => handleRemoveDocument(selectedClearanceType)}
              existingDocument={getCapturedDocument(selectedClearanceType)}
              disabled={isUploading}
            />
          </View>
        )}
      </View>
    );
  };

  /**
   * Render review step
   */
  const renderReviewStep = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review Your Documents</Text>
        <Text style={styles.stepDescription}>
          Please review your documents before submission. Make sure all images
          are clear and readable.
        </Text>

        <Card style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Documents to Submit:</Text>
          {capturedDocuments.map((doc, index) => (
            <View key={index} style={styles.reviewItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.reviewText}>
                {DOCUMENT_TYPES[doc.type].label}
                {doc.side && ` (${doc.side})`}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors.warning}
            />
            <Text style={styles.warningTitle}>Important</Text>
          </View>
          <Text style={styles.warningText}>
            • Ensure all documents are valid and not expired{"\n"}• All text
            must be clearly visible{"\n"}• Photos should be well-lit and in
            focus{"\n"}• Review typically takes 1-3 business days
          </Text>
        </Card>
      </View>
    );
  };

  /**
   * Render uploading step
   */
  const renderUploadingStep = () => {
    return (
      <View style={styles.uploadingContainer}>
        <Ionicons
          name="cloud-upload-outline"
          size={80}
          color={Colors.primary}
        />
        <Text style={styles.uploadingTitle}>Uploading Documents...</Text>
        <Text style={styles.uploadingDescription}>
          Please wait while we securely upload your documents
        </Text>

        <UploadProgressBar progress={progress} showDetails />

        <Text style={styles.uploadingNote}>
          Do not close this screen until upload completes
        </Text>
      </View>
    );
  };

  /**
   * Render completion step
   */
  const renderCompleteStep = () => {
    return (
      <View style={styles.completeContainer}>
        <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
        <Text style={styles.completeTitle}>Documents Submitted!</Text>
        <Text style={styles.completeDescription}>
          Your KYC documents have been successfully uploaded. Our team will
          review them within 1-3 business days.
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: "KYC Verification",
          headerShown: true,
          headerBackVisible:
            currentStep !== "uploading" && currentStep !== "complete",
        }}
      />

      <View style={styles.container}>
        {/* Step Indicator */}
        {currentStep !== "uploading" &&
          currentStep !== "complete" &&
          renderStepIndicator()}

        {/* Step Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === "select_id" && renderSelectIDStep()}
          {currentStep === "upload_documents" && renderUploadStep()}
          {currentStep === "review" && renderReviewStep()}
          {currentStep === "uploading" && renderUploadingStep()}
          {currentStep === "complete" && renderCompleteStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        {currentStep !== "uploading" && currentStep !== "complete" && (
          <View style={styles.navigationButtons}>
            {currentStep !== "select_id" && (
              <Button
                mode="outlined"
                onPress={handleBack}
                style={styles.backButton}
                icon="arrow-left"
              >
                Back
              </Button>
            )}
            <Button
              mode="contained"
              onPress={handleNext}
              style={[
                styles.nextButton,
                currentStep === "select_id" && styles.nextButtonFull,
              ]}
              icon={currentStep === "review" ? "check" : "arrow-right"}
              contentStyle={styles.buttonContent}
              disabled={
                currentStep === "upload_documents" && !hasAllRequiredDocuments()
              }
            >
              {currentStep === "review" ? "Submit" : "Next"}
            </Button>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Touchable ID card component
 */
interface TouchableIDCardProps {
  config: any;
  selected: boolean;
  onSelect: () => void;
}

const TouchableIDCard: React.FC<TouchableIDCardProps> = ({
  config,
  selected,
  onSelect,
}) => {
  return (
    <Card
      style={[styles.idCard, selected && styles.idCardSelected]}
      onPress={onSelect}
    >
      <View style={styles.idCardContent}>
        <View
          style={[
            styles.idIconContainer,
            selected && styles.idIconContainerSelected,
          ]}
        >
          <Ionicons
            name={config.icon}
            size={32}
            color={selected ? Colors.primary : Colors.textSecondary}
          />
        </View>
        <View style={styles.idTextContainer}>
          <Text style={[styles.idTitle, selected && styles.idTitleSelected]}>
            {config.label}
          </Text>
          <Text style={styles.idDescription} numberOfLines={2}>
            {config.description}
          </Text>
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,

    color: Colors.textHint,
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  stepContent: {
    paddingBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,

    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.fontSize.base,

    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,

    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  idOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  idCard: {
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: "transparent",
  },
  idCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  idCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  idIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  idIconContainerSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  idTextContainer: {
    flex: 1,
  },
  idTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  idTitleSelected: {
    color: Colors.primary,
  },
  idDescription: {
    fontSize: Typography.fontSize.sm,

    color: Colors.textSecondary,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    marginRight: 0,
  },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  reviewLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.xs / 2,
  },
  reviewText: {
    fontSize: Typography.fontSize.base,

    color: Colors.textPrimary,
  },
  warningCard: {
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: `${Colors.warning}10`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  warningTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,

    color: Colors.textPrimary,
    lineHeight: 20,
  },
  uploadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  uploadingTitle: {
    fontSize: Typography.fontSize.xl,

    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  uploadingDescription: {
    fontSize: Typography.fontSize.base,

    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  uploadingNote: {
    fontSize: Typography.fontSize.sm,

    color: Colors.textHint,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  completeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  completeTitle: {
    fontSize: Typography.fontSize.xl,

    color: Colors.success,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  completeDescription: {
    fontSize: Typography.fontSize.base,

    color: Colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  navigationButtons: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  backButton: {
    flex: 1,
    borderColor: Colors.primary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  nextButtonFull: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: Spacing.xs,
  },
});
