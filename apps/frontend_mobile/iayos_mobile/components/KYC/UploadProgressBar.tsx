// components/KYC/UploadProgressBar.tsx
// Progress indicator for KYC document uploads

import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { ProgressBar } from "react-native-paper";
import type { KYCUploadProgress } from "@/lib/hooks/useKYCUpload";
import { DOCUMENT_TYPES } from "@/lib/types/kyc";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface UploadProgressBarProps {
  progress: KYCUploadProgress;
  showDetails?: boolean;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  progress,
  showDetails = true,
}) => {
  const config = DOCUMENT_TYPES[progress.documentType];
  const progressValue = progress.percentage / 100;

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <View style={styles.container}>
      {showDetails && (
        <View style={styles.header}>
          <Text style={styles.documentLabel}>Uploading {config.label}</Text>
          <Text style={styles.percentage}>{progress.percentage}%</Text>
        </View>
      )}

      <ProgressBar
        progress={progressValue}
        color={Colors.primary}
        style={styles.progressBar}
      />

      {showDetails && progress.total > 0 && (
        <Text style={styles.sizeInfo}>
          {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  documentLabel: {
    fontSize: Typography.fontSize.sm,
    
    color: Colors.textPrimary,
  },
  percentage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSecondary,
  },
  sizeInfo: {
    fontSize: Typography.fontSize.xs,
    
    color: Colors.textSecondary,
    marginTop: Spacing.xs / 2,
  },
});

/**
 * Multi-document upload progress indicator
 */
interface MultiUploadProgressProps {
  totalDocuments: number;
  uploadedCount: number;
  currentDocument?: string;
  currentProgress?: number;
}

export const MultiUploadProgress: React.FC<MultiUploadProgressProps> = ({
  totalDocuments,
  uploadedCount,
  currentDocument,
  currentProgress = 0,
}) => {
  const overallProgress =
    totalDocuments > 0 ? uploadedCount / totalDocuments : 0;

  return (
    <View style={multiStyles.multiContainer}>
      <View style={multiStyles.multiHeader}>
        <Text style={multiStyles.multiTitle}>Uploading Documents</Text>
        <Text style={multiStyles.multiCount}>
          {uploadedCount} / {totalDocuments}
        </Text>
      </View>

      {/* Overall Progress */}
      <ProgressBar
        progress={overallProgress}
        color={Colors.success}
        style={multiStyles.overallProgress}
      />

      {/* Current Document Progress */}
      {currentDocument && currentProgress > 0 && (
        <View style={multiStyles.currentUpload}>
          <Text style={multiStyles.currentLabel}>Current: {currentDocument}</Text>
          <ProgressBar
            progress={currentProgress / 100}
            color={Colors.primary}
            style={multiStyles.currentProgress}
          />
          <Text style={multiStyles.currentPercentage}>{currentProgress}%</Text>
        </View>
      )}
    </View>
  );
};

const multiStyles = StyleSheet.create({
  multiContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginVertical: Spacing.md,
  },
  multiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  multiTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  multiCount: {
    fontSize: Typography.fontSize.base,
    
    color: Colors.primary,
  },
  overallProgress: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.backgroundSecondary,
  },
  currentUpload: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  currentLabel: {
    fontSize: Typography.fontSize.sm,
    
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  currentProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.backgroundSecondary,
  },
  currentPercentage: {
    fontSize: Typography.fontSize.xs,
    
    color: Colors.textHint,
    marginTop: Spacing.xs / 2,
    textAlign: "right",
  },
});
