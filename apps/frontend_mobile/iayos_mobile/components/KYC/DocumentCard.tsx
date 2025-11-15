// components/KYC/DocumentCard.tsx
// Display KYC document status and information

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "react-native-paper";
import type { KYCFile, KYCDocumentType } from "@/lib/types/kyc";
import { DOCUMENT_TYPES } from "@/lib/types/kyc";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface DocumentCardProps {
  document?: KYCFile;
  documentType: KYCDocumentType;
  status?: "uploaded" | "pending" | "missing";
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  documentType,
  status = "missing",
  onPress,
  onDelete,
  showActions = true,
}) => {
  const config = DOCUMENT_TYPES[documentType];

  const statusColors = {
    uploaded: Colors.success,
    pending: Colors.warning,
    missing: Colors.textHint,
  };

  const statusIcons = {
    uploaded: "checkmark-circle",
    pending: "time",
    missing: "alert-circle-outline",
  };

  const statusLabels = {
    uploaded: "Uploaded",
    pending: "Pending",
    missing: "Not Uploaded",
  };

  const actualStatus = document ? "uploaded" : status;

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={styles.cardContent}
      >
        <View style={styles.leftSection}>
          {/* Document Thumbnail or Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${statusColors[actualStatus]}15` },
            ]}
          >
            {document?.fileURL ? (
              <Image
                source={{ uri: document.fileURL }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name={config.icon as any}
                size={32}
                color={statusColors[actualStatus]}
              />
            )}
          </View>

          {/* Document Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{config.label}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {config.description}
            </Text>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Ionicons
                name={statusIcons[actualStatus] as any}
                size={14}
                color={statusColors[actualStatus]}
                style={styles.statusIcon}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors[actualStatus] },
                ]}
              >
                {statusLabels[actualStatus]}
              </Text>
            </View>

            {/* Upload Date */}
            {document?.uploadedAt && (
              <Text style={styles.uploadDate}>
                Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
              </Text>
            )}

            {/* File Size */}
            {document?.fileSize && (
              <Text style={styles.fileSize}>
                {formatFileSize(document.fileSize)}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actionsContainer}>
            {document && onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
            {onPress && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textHint}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

/**
 * Format file size in bytes to human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: Colors.background,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  statusIcon: {
    marginRight: Spacing.xs / 2,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  uploadDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textHint,
    marginTop: Spacing.xs / 2,
  },
  fileSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textHint,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
