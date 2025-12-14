// Skill-Specific Certifications Screen
// Lists and manages certifications for a specific skill

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
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
import { useMySkills } from "@/lib/hooks/useSkills";
import CertificationForm from "@/components/CertificationForm";
import CustomBackButton from "@/components/navigation/CustomBackButton";

export default function SkillCertificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { skillId } = useLocalSearchParams<{ skillId: string }>();

  // Check if user is a worker - redirect if not
  const isWorker = user?.profile_data?.profileType === "WORKER";

  // Get skills to find the skill name
  const { data: mySkills = [] } = useMySkills();
  const currentSkill = mySkills.find((s) => s.id === parseInt(skillId || "0"));

  useEffect(() => {
    if (!isWorker && user) {
      Alert.alert(
        "Worker Feature Only",
        "Certifications are only available for worker profiles.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }

    if (!skillId) {
      Alert.alert("Error", "Skill ID is required", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [isWorker, user, router, skillId]);

  const {
    data: allCertifications = [],
    isLoading,
    error,
    refetch,
  } = useCertifications();

  // Filter certifications for this specific skill
  const certifications = allCertifications.filter(
    (cert) =>
      cert.specializationId !== null && cert.specializationId === validSkillId
  );

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

  // Handle add new (with skill ID pre-filled)
  const handleAdd = () => {
    setEditingCertification(undefined);
    setFormVisible(true);
  };

  // Handle edit
  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification);
    setFormVisible(true);
  };

  // Render certification card
  const renderCertification = ({ item }: { item: Certification }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const isExpiringSoon =
      daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    const isExpired = item.isExpired;

    return (
      <View style={styles.certificationCard}>
        {/* Top row: Name + Verified badge */}
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.certName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.success}
                />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={20} color={Colors.primary} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </Pressable>
          </View>
        </View>

        {/* Organization */}
        {item.issuingOrganization && (
          <View style={styles.infoRow}>
            <Ionicons
              name="business-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>{item.issuingOrganization}</Text>
          </View>
        )}

        {/* Issue date */}
        {item.issueDate && (
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Issued: {formatCertificationDate(item.issueDate)}
            </Text>
          </View>
        )}

        {/* Expiry date with status badges */}
        {item.expiryDate && (
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Expires: {formatCertificationDate(item.expiryDate)}
            </Text>
            {isExpired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>Expired</Text>
              </View>
            )}
            {isExpiringSoon && !isExpired && (
              <View style={styles.expiringSoonBadge}>
                <Text style={styles.expiringSoonText}>
                  {daysUntilExpiry} days left
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Certificate image indicator */}
        {item.certificateUrl && (
          <View style={styles.infoRow}>
            <Ionicons
              name="document-attach-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.attachmentText}>Certificate attached</Text>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>
            {currentSkill?.name || "Skill"} Certifications
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading certifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>
            {currentSkill?.name || "Skill"} Certifications
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load certifications</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentSkill?.name || "Skill"} Certifications
        </Text>
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="ribbon-outline" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          Add professional certifications for{" "}
          {currentSkill?.name || "this skill"} to boost your credibility
        </Text>
      </View>

      {/* Certifications list */}
      {certifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="ribbon-outline"
            size={64}
            color={Colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>No Certifications Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your professional certifications for {currentSkill?.name} to
            stand out
          </Text>
          <Pressable style={styles.emptyButton} onPress={handleAdd}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.white}
            />
            <Text style={styles.emptyButtonText}>Add First Certification</Text>
          </Pressable>
        </View>
      ) : (
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
            />
          }
          ListFooterComponent={
            <Pressable style={styles.addAnotherButton} onPress={handleAdd}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.addAnotherText}>
                Add Another Certification
              </Text>
            </Pressable>
          }
        />
      )}

      {/* Certification Form Modal */}
      <CertificationForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditingCertification(undefined);
        }}
        certification={editingCertification}
        preselectedSkillId={parseInt(skillId || "0")} // Pre-fill skill ID
      />
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: Spacing.sm,
  },
  addButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.primary,
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
  },
  certificationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  certName: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  attachmentText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "500",
  },
  expiredBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  expiredText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: "600",
  },
  expiringSoonBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  expiringSoonText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  emptyButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  addAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  addAnotherText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
});
