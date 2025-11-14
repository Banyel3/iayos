// Worker Certifications Screen
// Lists all worker certifications with ability to add, edit, and delete

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  useCertifications,
  useDeleteCertification,
  type Certification,
  formatCertificationDate,
  getDaysUntilExpiry,
} from "@/lib/hooks/useCertifications";
import CertificationForm from "@/components/CertificationForm";

// ===== MAIN COMPONENT =====

export default function CertificationsScreen() {
  const router = useRouter();
  const {
    data: certifications = [],
    isLoading,
    error,
    refetch,
  } = useCertifications();
  const deleteCertification = useDeleteCertification();
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCertification, setEditingCertification] = useState<
    Certification | undefined
  >();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle delete with confirmation
  const handleDelete = (certification: Certification) => {
    Alert.alert(
      "Delete Certification",
      `Are you sure you want to delete "${certification.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCertification.mutate(certification.id),
        },
      ]
    );
  };

  // Handle add new
  const handleAdd = () => {
    setEditingCertification(undefined);
    setFormVisible(true);
  };

  // Handle edit
  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification);
    setFormVisible(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setFormVisible(false);
    setEditingCertification(undefined);
  };

  // ===== LOADING STATE =====
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading certifications...</Text>
      </View>
    );
  }

  // ===== ERROR STATE =====
  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load certifications</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ===== EMPTY STATE =====
  if (certifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="ribbon-outline"
          size={80}
          color={Colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>No Certifications Yet</Text>
        <Text style={styles.emptyText}>
          Add your professional certifications to build credibility with clients
        </Text>
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add-circle" size={20} color={Colors.textLight} />
          <Text style={styles.addButtonText}>Add Certification</Text>
        </Pressable>
      </View>
    );
  }

  // ===== RENDER CERTIFICATION CARD =====
  const renderCertification = ({ item }: { item: Certification }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item);
    const isExpiringSoon =
      daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

    return (
      <Pressable
        style={styles.certificationCard}
        onPress={() => handleEdit(item)}
      >
        {/* Certificate Image Thumbnail */}
        {item.certificateUrl && (
          <View style={styles.certificateThumbnail}>
            <Ionicons name="document-text" size={32} color={Colors.primary} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.certificationContent}>
          {/* Header */}
          <View style={styles.certificationHeader}>
            <Text style={styles.certificationName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.statusBadges}>
              {item.isVerified && (
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
              {item.isExpired && (
                <View style={[styles.badge, styles.expiredBadge]}>
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={Colors.error}
                  />
                  <Text style={[styles.badgeText, styles.expiredText]}>
                    Expired
                  </Text>
                </View>
              )}
              {isExpiringSoon && !item.isExpired && (
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
            {item.issuingOrganization}
          </Text>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Issued:</Text>
              <Text style={styles.dateValue}>
                {formatCertificationDate(item.issueDate)}
              </Text>
            </View>
            {item.expiryDate && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Expires:</Text>
                <Text
                  style={[
                    styles.dateValue,
                    item.isExpired && styles.expiredDateValue,
                  ]}
                >
                  {formatCertificationDate(item.expiryDate)}
                </Text>
              </View>
            )}
            {!item.expiryDate && (
              <View style={styles.dateItem}>
                <Text style={styles.noExpiryText}>No Expiry</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.editButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <>
      <CertificationForm
        visible={formVisible}
        onClose={handleFormClose}
        certification={editingCertification}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Certifications</Text>
            <Text style={styles.headerSubtitle}>
              {certifications.length}{" "}
              {certifications.length === 1 ? "certification" : "certifications"}
            </Text>
          </View>
          <Pressable style={styles.addHeaderButton} onPress={handleAdd}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={certifications}
          renderItem={renderCertification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  addHeaderButton: {
    padding: Spacing.sm,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  addButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // List
  listContent: {
    padding: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },

  // Certification Card
  certificationCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  certificateThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  certificationContent: {
    flex: 1,
  },
  certificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  certificationName: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadges: {
    flexDirection: "row",
    gap: Spacing.xs,
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
