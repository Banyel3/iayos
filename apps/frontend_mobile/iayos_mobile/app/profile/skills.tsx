// Skills Management Screen
// Workers can add, update, and remove skills (specializations) from their profile

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  useAvailableSkills,
  useMySkills,
  useAddSkill,
  useUpdateSkill,
  useRemoveSkill,
  type AvailableSkill,
  type WorkerSkill,
} from "@/lib/hooks/useSkills";

export default function SkillsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificationSuggestion, setShowCertificationSuggestion] =
    useState(false);
  const [justAddedSkillId, setJustAddedSkillId] = useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<AvailableSkill | null>(
    null,
  );
  const [editingSkill, setEditingSkill] = useState<WorkerSkill | null>(null);
  const [experienceYears, setExperienceYears] = useState("0");

  // Queries
  const { data: availableSkills = [], isLoading: availableLoading } =
    useAvailableSkills();
  const {
    data: mySkills = [],
    isLoading: mySkillsLoading,
    refetch,
  } = useMySkills();

  // Mutations
  const addSkill = useAddSkill();
  const updateSkill = useUpdateSkill();
  const removeSkill = useRemoveSkill();

  // Get skills the worker doesn't have yet
  const mySkillIds = new Set(mySkills.map((s) => s.specializationId));
  const availableToAdd = availableSkills.filter((s) => !mySkillIds.has(s.id));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle add skill
  const handleAddSkill = () => {
    if (!selectedSkill) return;

    Keyboard.dismiss(); // Dismiss keyboard before processing

    const years = parseInt(experienceYears, 10) || 0;
    if (years < 0 || years > 50) {
      Alert.alert("Invalid Input", "Experience years must be between 0 and 50");
      return;
    }

    addSkill.mutate(
      {
        specialization_id: selectedSkill.id,
        experience_years: years,
      },
      {
        onSuccess: (data) => {
          setShowAddModal(false);
          const addedSkillId = data.data?.id; // Store the skill ID
          setJustAddedSkillId(addedSkillId || null);
          setSelectedSkill(null);
          setExperienceYears("0");

          // Show custom certification suggestion modal with skill ID
          setShowCertificationSuggestion(true);
        },
        onError: (error) => {
          Alert.alert("Error", error.message);
        },
      },
    );
  };

  // Handle update skill
  const handleUpdateSkill = () => {
    if (!editingSkill) return;

    Keyboard.dismiss(); // Dismiss keyboard before processing

    const years = parseInt(experienceYears, 10) || 0;
    if (years < 0 || years > 50) {
      Alert.alert("Invalid Input", "Experience years must be between 0 and 50");
      return;
    }

    updateSkill.mutate(
      {
        skill_id: editingSkill.id,
        experience_years: years,
      },
      {
        onSuccess: (data) => {
          Alert.alert("Success", data.message);
          setShowEditModal(false);
          setEditingSkill(null);
          setExperienceYears("0");
        },
        onError: (error) => {
          Alert.alert("Error", error.message);
        },
      },
    );
  };

  // Handle remove skill
  const handleRemoveSkill = (skill: WorkerSkill) => {
    Alert.alert(
      "Remove Skill?",
      `Are you sure you want to remove "${skill.name}" from your profile?\n\nThis will also delete any certifications linked to this skill.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeSkill.mutate(skill.id, {
              onSuccess: (data) => {
                if (data.deletedCertifications > 0) {
                  Alert.alert(
                    "Skill Removed",
                    `${data.message}\n\n${data.deletedCertifications} linked certification(s) were also removed.`,
                  );
                } else {
                  Alert.alert("Success", data.message);
                }
              },
              onError: (error) => {
                Alert.alert("Error", error.message);
              },
            });
          },
        },
      ],
    );
  };

  // Open edit modal
  const openEditModal = (skill: WorkerSkill) => {
    setEditingSkill(skill);
    setExperienceYears(skill.experienceYears.toString());
    setShowEditModal(true);
  };

  // Loading state
  if (mySkillsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Skills</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading skills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Skills</Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Add skills to showcase your expertise. Skills are used to filter
            jobs and link certifications.
          </Text>
        </View>

        {/* My Skills Section */}
        <Text style={styles.sectionTitle}>My Skills ({mySkills.length})</Text>

        {mySkills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="construct-outline"
              size={48}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Skills Added</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your skills and specializations.
            </Text>
          </View>
        ) : (
          mySkills.map((skill) => (
            <View key={skill.id} style={styles.skillCard}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillExperience}>
                  {skill.experienceYears} year
                  {skill.experienceYears !== 1 ? "s" : ""} experience
                </Text>
                {skill.description ? (
                  <Text style={styles.skillDescription} numberOfLines={2}>
                    {skill.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.skillActions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => openEditModal(skill)}
                >
                  <Ionicons name="pencil" size={18} color={Colors.primary} />
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleRemoveSkill(skill)}
                >
                  <Ionicons name="trash" size={18} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Skill</Text>
                  <Pressable onPress={() => setShowAddModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={Colors.textPrimary}
                    />
                  </Pressable>
                </View>

                {availableLoading ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>
                      Loading available skills...
                    </Text>
                  </View>
                ) : availableToAdd.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={Colors.success}
                    />
                    <Text style={styles.modalEmptyTitle}>
                      All Skills Added!
                    </Text>
                    <Text style={styles.modalEmptyText}>
                      You've added all available specializations to your
                      profile.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.modalLabel}>Select a Skill</Text>
                    <ScrollView
                      style={styles.skillsList}
                      showsVerticalScrollIndicator={false}
                    >
                      {availableToAdd.map((skill) => (
                        <Pressable
                          key={skill.id}
                          style={[
                            styles.skillOption,
                            selectedSkill?.id === skill.id &&
                              styles.skillOptionSelected,
                          ]}
                          onPress={() => setSelectedSkill(skill)}
                        >
                          <View style={styles.skillOptionInfo}>
                            <Text style={styles.skillOptionName}>
                              {skill.name}
                            </Text>
                            {skill.description ? (
                              <Text
                                style={styles.skillOptionDesc}
                                numberOfLines={2}
                              >
                                {skill.description}
                              </Text>
                            ) : null}
                          </View>
                          {selectedSkill?.id === skill.id && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={Colors.primary}
                            />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>

                    {selectedSkill && (
                      <View style={styles.experienceSection}>
                        <Text style={styles.modalLabel}>
                          Years of Experience
                        </Text>
                        <TextInput
                          style={styles.experienceInput}
                          value={experienceYears}
                          onChangeText={setExperienceYears}
                          keyboardType="number-pad"
                          placeholder="0"
                          maxLength={2}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          blurOnSubmit={true}
                        />
                        <Text style={styles.experienceHint}>
                          Tap outside or press Done to close keyboard
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={[
                        styles.modalButton,
                        (!selectedSkill || addSkill.isPending) &&
                          styles.modalButtonDisabled,
                      ]}
                      onPress={handleAddSkill}
                      disabled={!selectedSkill || addSkill.isPending}
                    >
                      {addSkill.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.modalButtonText}>Add Skill</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowEditModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Experience</Text>
                  <Pressable onPress={() => setShowEditModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={Colors.textPrimary}
                    />
                  </Pressable>
                </View>

                {editingSkill && (
                  <>
                    <View style={styles.editSkillInfo}>
                      <Text style={styles.editSkillName}>
                        {editingSkill.name}
                      </Text>
                    </View>

                    <View style={styles.experienceSection}>
                      <Text style={styles.modalLabel}>Years of Experience</Text>
                      <TextInput
                        style={styles.experienceInput}
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                        keyboardType="number-pad"
                        placeholder="0"
                        maxLength={2}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                        blurOnSubmit={true}
                      />
                      <Text style={styles.experienceHint}>
                        Tap outside or press Done to close keyboard
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        styles.modalButton,
                        updateSkill.isPending && styles.modalButtonDisabled,
                      ]}
                      onPress={handleUpdateSkill}
                      disabled={updateSkill.isPending}
                    >
                      {updateSkill.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.modalButtonText}>Save Changes</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Certification Suggestion Modal */}
      <Modal
        visible={showCertificationSuggestion}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCertificationSuggestion(false)}
      >
        <View style={styles.suggestionOverlay}>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionIcon}>
              <Ionicons name="ribbon" size={48} color={Colors.primary} />
            </View>

            <Text style={styles.suggestionTitle}>Skill Added! 🎉</Text>

            <Text style={styles.suggestionText}>
              Great! Would you like to add a certification to verify this skill
              and boost your profile credibility?
            </Text>

            <View style={styles.suggestionButtons}>
              <Pressable
                style={styles.suggestionButtonSecondary}
                onPress={() => setShowCertificationSuggestion(false)}
              >
                <Text style={styles.suggestionButtonSecondaryText}>
                  Not Now
                </Text>
              </Pressable>

              <Pressable
                style={styles.suggestionButtonPrimary}
                onPress={() => {
                  setShowCertificationSuggestion(false);
                  // Navigate with skill ID as query parameter
                  if (justAddedSkillId) {
                    router.push(
                      `/profile/skills/${justAddedSkillId}/certifications` as any,
                    );
                  }
                }}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.suggestionButtonPrimaryText}>
                  Add Certification
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  addButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.primary,
    flex: 1,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    ...Typography.body.large,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  skillExperience: {
    ...Typography.body.small,
    color: Colors.primary,
    marginTop: 2,
  },
  skillDescription: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  skillActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  modalLabel: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalLoading: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalEmpty: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalEmptyTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  modalEmptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  skillsList: {
    maxHeight: 400,
    marginBottom: Spacing.md,
  },
  skillOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  skillOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  skillOptionInfo: {
    flex: 1,
  },
  skillOptionName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  skillOptionDesc: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  experienceSection: {
    marginBottom: Spacing.lg,
  },
  experienceInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body.medium,
    color: Colors.textPrimary,
    textAlign: "center",
    fontSize: 24,
  },
  experienceHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  modalButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  modalButtonText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.white,
  },
  editSkillInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  editSkillName: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
  },
  // Certification Suggestion Modal Styles
  suggestionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  suggestionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    ...Shadows.lg,
  },
  suggestionIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  suggestionTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  suggestionText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  suggestionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  suggestionButtonSecondary: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionButtonSecondaryText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  suggestionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  suggestionButtonPrimaryText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.white,
  },
});
