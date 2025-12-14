// Certification Card Component
// Displays a single certification with status badges and actions

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  type Certification,
  formatCertificationDate,
  getDaysUntilExpiry,
} from "@/lib/hooks/useCertifications";

// ===== PROPS =====

interface CertificationCardProps {
  certification: Certification;
  onEdit?: (cert: Certification) => void;
  onDelete?: (cert: Certification) => void;
  onPress?: (cert: Certification) => void;
  compact?: boolean; // Compact mode for profile preview
  showActions?: boolean; // Show edit/delete buttons
}

// ===== MAIN COMPONENT =====

export default function CertificationCard({
  certification,
  onEdit,
  onDelete,
  onPress,
  compact = false,
  showActions = true,
}: CertificationCardProps) {
  const daysUntilExpiry = getDaysUntilExpiry(certification.expiryDate);
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  const handlePress = () => {
    if (onPress) {
      onPress(certification);
    } else if (onEdit) {
      onEdit(certification);
    }
  };

  // ===== COMPACT MODE (for profile preview) =====
  if (compact) {
    return (
      <Pressable
        style={[styles.card, styles.compactCard]}
        onPress={handlePress}
      >
        {/* Certificate Icon */}
        <View style={styles.compactIcon}>
          <Ionicons name="ribbon" size={20} color={Colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {certification.name}
          </Text>
          <Text style={styles.compactOrg} numberOfLines={1}>
            {certification.issuingOrganization}
          </Text>
        </View>

        {/* Status Badge */}
        {certification.isVerified && (
          <View style={[styles.badge, styles.verifiedBadge]}>
            <Ionicons
              name="checkmark-circle"
              size={12}
              color={Colors.success}
            />
          </View>
        )}
        {certification.isExpired && (
          <View style={[styles.badge, styles.expiredBadge]}>
            <Ionicons name="alert-circle" size={12} color={Colors.error} />
          </View>
        )}
      </Pressable>
    );
  }

  // ===== FULL MODE =====
  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Certificate Image/Icon */}
      <View style={styles.thumbnail}>
        {certification.certificateUrl ? (
          <Image
            source={{ uri: certification.certificateUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="document-text" size={32} color={Colors.primary} />
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header with Name and Status Badges */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {certification.name}
          </Text>
          <View style={styles.badges}>
            {certification.isVerified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.success}
                />
                <Text style={[styles.badgeText, styles.verifiedText]}>
                  Verified
                </Text>
              </View>
            )}
            {certification.isExpired && (
              <View style={[styles.badge, styles.expiredBadge]}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={[styles.badgeText, styles.expiredText]}>
                  Expired
                </Text>
              </View>
            )}
            {isExpiringSoon && !certification.isExpired && (
              <View style={[styles.badge, styles.warningSoon]}>
                <Ionicons name="warning" size={14} color={Colors.warning} />
                <Text style={[styles.badgeText, styles.warningText]}>
                  Expiring Soon
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Organization */}
        <Text style={styles.organization} numberOfLines={1}>
          {certification.issuingOrganization}
        </Text>

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Issued:</Text>
            <Text style={styles.dateValue}>
              {formatCertificationDate(certification.issueDate)}
            </Text>
          </View>
          {certification.expiryDate && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Expires:</Text>
              <Text
                style={[
                  styles.dateValue,
                  certification.isExpired && styles.expiredDateValue,
                ]}
              >
                {formatCertificationDate(certification.expiryDate)}
              </Text>
            </View>
          )}
          {!certification.expiryDate && (
            <View style={styles.dateItem}>
              <Text style={styles.noExpiryText}>No Expiry</Text>
            </View>
          )}
        </View>

        {/* Days Until Expiry (if expiring soon) */}
        {isExpiringSoon &&
          !certification.isExpired &&
          daysUntilExpiry !== null && (
            <View style={styles.expiryWarning}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.expiryWarningText}>
                Expires in {daysUntilExpiry}{" "}
                {daysUntilExpiry === 1 ? "day" : "days"}
              </Text>
            </View>
          )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                style={styles.editButton}
                onPress={() => onEdit(certification)}
              >
                <Ionicons name="pencil" size={16} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => onDelete(certification)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },

  // Compact Mode
  compactCard: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  compactOrg: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Full Mode - Thumbnail
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  // Full Mode - Content
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  badges: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
  },
  expiredBadge: {
    backgroundColor: Colors.errorLight,
  },
  warningSoon: {
    backgroundColor: Colors.warningLight,
  },
  badgeText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "600",
  },
  verifiedText: {
    color: Colors.success,
  },
  expiredText: {
    color: Colors.error,
  },
  warningText: {
    color: Colors.warning,
  },
  organization: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  expiredDateValue: {
    color: Colors.error,
    fontWeight: "600",
  },
  noExpiryText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "500",
  },
  expiryWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.small,
    alignSelf: "flex-start",
  },
  expiryWarningText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.small,
  },
  editButtonText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.small,
  },
  deleteButtonText: {
    ...Typography.body.small,
    color: Colors.error,
    fontWeight: "600",
  },
});
