// app/kyc/status.tsx
// KYC verification status screen

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ActivityIndicator } from "react-native-paper";
import { useKYC } from "@/lib/hooks/useKYC";
import { KYCStatusBadge } from "@/components/KYC/KYCStatusBadge";
import { DocumentCard } from "@/components/KYC/DocumentCard";
import CustomBackButton from "@/components/navigation/CustomBackButton";
import { Colors, Typography, Spacing } from "@/constants/theme";
import type { KYCDocumentType } from "@/lib/types/kyc";
import { getKYCStatusDisplay, DOCUMENT_TYPES } from "@/lib/types/kyc";

export default function KYCStatusScreen() {
  const router = useRouter();
  const {
    kycData,
    kycStatus,
    hasSubmittedKYC,
    isVerified,
    isPending,
    isRejected,
    rejectionReason,
    uploadedDocuments,
    submissionDate,
    reviewDate,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useKYC();

  const statusInfo = getKYCStatusDisplay(kycStatus);

  const handleUploadDocuments = () => {
    router.push("/kyc/upload");
  };

  const handleResubmit = () => {
    Alert.alert(
      "Resubmit Documents",
      "You will need to upload new documents. Your previous submission will be replaced.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => router.push("/kyc/upload") },
      ]
    );
  };

  const handleViewDocument = (
    documentType: KYCDocumentType,
    fileURL: string
  ) => {
    router.push({
      pathname: "/kyc/preview",
      params: { documentType, fileURL },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading KYC status...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={styles.customHeader}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContent}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorTitle}>Failed to Load KYC Status</Text>
          <Text style={styles.errorMessage}>
            {error?.message || "An error occurred"}
          </Text>
          <Button
            mode="contained"
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={statusInfo.icon as any}
              size={56}
              color={statusInfo.color}
            />
            <Text style={styles.statusTitle}>{statusInfo.label}</Text>
          </View>

          <Text style={styles.statusDescription}>{statusInfo.description}</Text>

          {/* Submission Date */}
          {submissionDate && (
            <View style={styles.dateInfo}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.dateText}>
                Submitted: {new Date(submissionDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Review Date - Only show for approved/rejected, not pending */}
          {reviewDate && (isVerified || isRejected) && (
            <View style={styles.dateInfo}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.dateText}>
                Reviewed: {new Date(reviewDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Rejection Reason */}
          {isRejected && rejectionReason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionLabel}>Reason for Rejection:</Text>
              <Text style={styles.rejectionReason}>{rejectionReason}</Text>
            </View>
          )}
        </Card>

        {/* Verification Benefits (if not submitted) */}
        {!hasSubmittedKYC && (
          <Card style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Benefits of Verification</Text>
            <View style={styles.benefitsList}>
              <BenefitItem
                icon="shield-checkmark"
                text="Increased trust from clients"
              />
              <BenefitItem icon="briefcase" text="Access to premium jobs" />
              <BenefitItem icon="star" text="Higher visibility in search" />
              <BenefitItem icon="cash" text="Faster payment processing" />
            </View>
          </Card>
        )}

        {/* Uploaded Documents */}
        {hasSubmittedKYC && uploadedDocuments.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            {uploadedDocuments.map((doc, index) => {
              // Skip if document type is undefined or not in DOCUMENT_TYPES
              if (!doc.idType || !DOCUMENT_TYPES[doc.idType]) {
                return null;
              }

              return (
                <DocumentCard
                  key={doc.kycFileID || `doc-${index}`}
                  document={doc}
                  documentType={doc.idType}
                  status="uploaded"
                  onPress={() => handleViewDocument(doc.idType, doc.fileURL)}
                  showActions={false}
                />
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!hasSubmittedKYC && (
            <Button
              mode="contained"
              onPress={handleUploadDocuments}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              icon="camera"
            >
              Upload Documents
            </Button>
          )}

          {isRejected && (
            <Button
              mode="contained"
              onPress={handleResubmit}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              icon="refresh"
            >
              Resubmit Documents
            </Button>
          )}

          {isVerified && (
            <View style={styles.verifiedInfo}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.success}
              />
              <Text style={styles.verifiedText}>
                Your identity has been verified! You can now access all
                features.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Benefit item component
 */
interface BenefitItemProps {
  icon: string;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <Ionicons name={icon as any} size={20} color={Colors.success} />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,

    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  errorContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,

    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.fontSize.base,

    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
  },
  refreshButton: {
    padding: 8,
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  statusHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: Typography.fontSize.xl,

    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  statusDescription: {
    fontSize: Typography.fontSize.base,

    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.fontSize.sm,

    color: Colors.textSecondary,
  },
  rejectionContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  rejectionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  rejectionReason: {
    fontSize: Typography.fontSize.base,

    color: Colors.textPrimary,
  },
  benefitsCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  benefitsTitle: {
    fontSize: Typography.fontSize.lg,

    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: Typography.fontSize.base,

    color: Colors.textPrimary,
    flex: 1,
  },
  documentsSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,

    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  buttonContent: {
    paddingVertical: Spacing.xs,
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,

    color: Colors.textPrimary,
  },
  verifiedInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: `${Colors.success}15`,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  verifiedText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,

    color: Colors.textPrimary,
  },
});
