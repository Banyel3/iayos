import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography, Shadows, BorderRadius } from "@/constants/theme";
import CertificationCard from "@/components/CertificationCard";
import CertificationForm from "@/components/CertificationForm";
import {
  useCertifications,
  useDeleteCertification,
  Certification,
} from "@/lib/hooks/useCertifications";
import { useMySkills } from "@/lib/hooks/useSkills";

export default function CertificationsScreen() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);

  const {
    data: certifications = [],
    isLoading: isCertsLoading,
    refetch,
    isRefreshing,
  } = useCertifications();
  const { data: skills = [], isLoading: isSkillsLoading } = useMySkills();
  const deleteMutation = useDeleteCertification();

  const handleAdd = () => {
    setEditingCert(null);
    setIsFormVisible(true);
  };

  const handleEdit = (cert: Certification) => {
    setEditingCert(cert);
    setIsFormVisible(true);
  };

  const handleDelete = (cert: Certification) => {
    Alert.alert(
      "Delete Certification",
      `Are you sure you want to delete "${cert.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(cert.id),
        },
      ]
    );
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setEditingCert(null);
  };

  const getSkillName = (
    skillId: number | null,
    fallbackName?: string | null
  ): string => {
    // If backend already sent the skill name, prefer it
    if (fallbackName) return fallbackName;

    if (!skillId || !skills || !Array.isArray(skills)) return "Unknown Skill";
    const skill = skills.find((s) => s.id === skillId);
    return skill?.name || "Unknown Skill";
  };

  const isLoading = isCertsLoading || isSkillsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading certifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Certifications</Text>
        <Pressable
          onPress={handleAdd}
          style={styles.addButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            All certifications must be linked to a specific skill. Add skills
            first if you haven't already.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{certifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.statValue}>
              {certifications.filter((c) => c.isVerified).length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>
              {certifications.filter((c) => !c.isVerified).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Certifications List */}
        {certifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Certifications Yet</Text>
            <Text style={styles.emptyText}>
              Add your first professional certification to boost your profile
            </Text>
            <Pressable style={styles.emptyButton} onPress={handleAdd}>
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Add Certification</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.certificationsContainer}>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certWrapper}>
                <CertificationCard
                  certification={cert}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                {/* Skill Badge */}
                <View style={styles.skillBadge}>
                  <Ionicons
                    name="school"
                    size={14}
                    color={Colors.primary}
                    style={styles.skillIcon}
                  />
                  <Text style={styles.skillText}>
                    {getSkillName(
                      cert.specializationId ?? null,
                      cert.skillName
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        {certifications.length > 0 && (
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push("/profile/skills" as any)}
            >
              <Ionicons name="list" size={20} color={Colors.primary} />
              <Text style={styles.quickActionText}>View by Skill</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Certification Modal */}
      <CertificationForm
        visible={isFormVisible}
        onClose={handleFormClose}
        certification={editingCert ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.info + "15",
    padding: 16,
    borderRadius: BorderRadius.medium,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.info,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    ...Shadows.small,
  },
  statValue: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  certificationsContainer: {
    gap: 16,
  },
  certWrapper: {
    position: "relative",
  },
  skillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 8,
    alignSelf: "flex-start",
    marginLeft: 16,
  },
  skillIcon: {
    marginRight: 6,
  },
  skillText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  quickActions: {
    marginTop: 24,
    gap: 12,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
    gap: 8,
  },
  quickActionText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
});
