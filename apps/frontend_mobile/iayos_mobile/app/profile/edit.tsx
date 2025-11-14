// Edit Profile Screen
// Allows workers to update their profile information

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS } from "@/lib/api/config";
import { PortfolioUpload } from "@/components/PortfolioUpload";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { ImageViewer } from "@/components/ImageViewer";
import {
  usePortfolioManagement,
  type PortfolioImage,
} from "@/lib/hooks/usePortfolioManagement";

// ===== TYPES =====

interface WorkerProfile {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  };
  bio: string | null;
  hourlyRate: number | null;
  skills: string[];
}

interface UpdateProfileData {
  bio: string;
  hourlyRate: string;
  phoneNumber: string;
  skills: string;
}

// ===== MAIN COMPONENT =====

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [skills, setSkills] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Portfolio state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editingCaption, setEditingCaption] = useState<{
    id: number;
    caption: string;
  } | null>(null);

  // Portfolio management
  const {
    images: portfolioImages,
    isLoading: portfolioLoading,
    updateCaption,
    reorderImages,
    deleteImage,
    canAddMore,
    remainingSlots,
  } = usePortfolioManagement();

  // Fetch current profile
  const { data: profile, isLoading } = useQuery<WorkerProfile>({
    queryKey: ["worker-profile"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.WORKER_PROFILE, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
  });

  // Initialize form with current values
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setHourlyRate(profile.hourlyRate ? profile.hourlyRate.toString() : "");
      setPhoneNumber(profile.user.phoneNumber || "");
      setSkills(profile.skills.join(", "));
    }
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch(ENDPOINTS.UPDATE_WORKER_PROFILE, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: data.bio,
          hourly_rate: parseFloat(data.hourlyRate) || null,
          phone_number: data.phoneNumber,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Track if form has changes
  useEffect(() => {
    if (!profile) return;

    const changed =
      bio !== (profile.bio || "") ||
      hourlyRate !==
        (profile.hourlyRate ? profile.hourlyRate.toString() : "") ||
      phoneNumber !== (profile.user.phoneNumber || "") ||
      skills !== profile.skills.join(", ");

    setHasChanges(changed);
  }, [bio, hourlyRate, phoneNumber, skills, profile]);

  // Validation
  const validateForm = (): string | null => {
    // Bio validation
    if (bio.trim().length > 0 && bio.trim().length < 50) {
      return "Bio must be at least 50 characters";
    }
    if (bio.length > 500) {
      return "Bio cannot exceed 500 characters";
    }

    // Hourly rate validation
    if (hourlyRate) {
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate)) {
        return "Hourly rate must be a valid number";
      }
      if (rate < 0) {
        return "Hourly rate cannot be negative";
      }
      if (rate > 10000) {
        return "Hourly rate seems too high";
      }
    }

    // Phone number validation (basic)
    if (phoneNumber && phoneNumber.trim().length > 0) {
      const cleaned = phoneNumber.replace(/\D/g, "");
      if (cleaned.length < 10 || cleaned.length > 15) {
        return "Phone number must be 10-15 digits";
      }
    }

    // Skills validation
    if (skills.trim().length > 0) {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (skillList.some((s) => s.length < 2)) {
        return "Each skill must be at least 2 characters";
      }
      if (skillList.some((s) => s.length > 50)) {
        return "Each skill cannot exceed 50 characters";
      }
    }

    return null;
  };

  // Handle save
  const handleSave = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    if (!hasChanges) {
      Alert.alert("No Changes", "You haven't made any changes");
      return;
    }

    updateMutation.mutate({
      bio: bio.trim(),
      hourlyRate: hourlyRate.trim(),
      phoneNumber: phoneNumber.trim(),
      skills: skills.trim(),
    });
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ===== MAIN CONTENT =====
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            style={[
              styles.saveButton,
              (!hasChanges || updateMutation.isPending) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.textLight} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  !hasChanges && styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        {/* Bio Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Bio <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.textArea, bio.length > 0 && styles.textAreaActive]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell clients about your experience, skills, and what makes you stand out..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.fieldFooter}>
            <Text
              style={[
                styles.hint,
                bio.length > 0 && bio.length < 50 && styles.hintWarning,
              ]}
            >
              {bio.length > 0 && bio.length < 50
                ? `${50 - bio.length} more characters needed`
                : "Minimum 50 characters recommended"}
            </Text>
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>
        </View>

        {/* Hourly Rate Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Hourly Rate <Text style={styles.optional}>(optional)</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={[
                styles.input,
                hourlyRate.length > 0 && styles.inputActive,
              ]}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputSuffix}>/hour</Text>
          </View>
          <Text style={styles.hint}>Set your preferred hourly rate</Text>
        </View>

        {/* Phone Number Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Phone Number <Text style={styles.optional}>(optional)</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.textSecondary}
            />
            <TextInput
              style={[
                styles.input,
                styles.inputWithPadding,
                phoneNumber.length > 0 && styles.inputActive,
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+63 XXX XXX XXXX"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.hint}>Add your contact number</Text>
        </View>

        {/* Skills Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Skills <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, skills.length > 0 && styles.inputActive]}
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. Plumbing, Electrical, Carpentry"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={styles.hint}>Separate multiple skills with commas</Text>
        </View>

        {/* Certifications Section */}
        <View style={styles.managementSection}>
          <View style={styles.managementHeader}>
            <View>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <Text style={styles.managementHint}>
                Add professional certifications
              </Text>
            </View>
            <Ionicons name="ribbon" size={32} color={Colors.primary} />
          </View>
          <Pressable
            style={styles.manageButton}
            onPress={() => router.push("/profile/certifications" as any)}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            <Text style={styles.manageButtonText}>Manage Certifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Materials Management */}
        <View style={styles.managementSection}>
          <View style={styles.managementHeader}>
            <View>
              <Text style={styles.sectionTitle}>Materials & Products</Text>
              <Text style={styles.managementHint}>
                List materials or products you offer
              </Text>
            </View>
            <Ionicons name="cube" size={32} color={Colors.primary} />
          </View>
          <Pressable
            style={styles.manageButton}
            onPress={() => router.push("/profile/materials" as any)}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            <Text style={styles.manageButtonText}>Manage Materials</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Portfolio Section */}
        <View style={styles.portfolioSection}>
          <View style={styles.portfolioHeader}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <Text style={styles.portfolioCount}>
              {portfolioImages.length} / 10
            </Text>
          </View>
          <Text style={styles.portfolioHint}>
            Showcase your work with up to 10 images
          </Text>

          {/* Upload Component */}
          {canAddMore && (
            <View style={styles.uploadContainer}>
              <PortfolioUpload
                maxImages={10}
                disabled={!canAddMore}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["worker-profile"],
                  });
                }}
              />
              {remainingSlots > 0 && (
                <Text style={styles.uploadHint}>
                  {remainingSlots} {remainingSlots === 1 ? "slot" : "slots"}{" "}
                  remaining
                </Text>
              )}
            </View>
          )}

          {/* Portfolio Grid */}
          {portfolioImages.length > 0 && (
            <View style={styles.portfolioGrid}>
              <PortfolioGrid
                images={portfolioImages}
                onImageTap={(image, index) => {
                  setViewerIndex(index);
                  setViewerVisible(true);
                }}
                onEdit={(image) => {
                  setEditingCaption({
                    id: image.id,
                    caption: image.caption || "",
                  });
                }}
                onDelete={(image) => {
                  deleteImage.mutate(image.id);
                }}
                onReorder={(newOrder) => {
                  reorderImages.mutate(newOrder);
                }}
                editable={true}
              />
            </View>
          )}
        </View>

        {/* Edit Caption Modal */}
        {editingCaption && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Caption</Text>
              <TextInput
                style={styles.captionInput}
                value={editingCaption.caption}
                onChangeText={(text) =>
                  setEditingCaption({ ...editingCaption, caption: text })
                }
                placeholder="Enter caption (optional)"
                placeholderTextColor={Colors.textSecondary}
                multiline
                maxLength={200}
              />
              <Text style={styles.captionCharCount}>
                {editingCaption.caption.length}/200
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setEditingCaption(null)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={() => {
                    if (editingCaption) {
                      updateCaption.mutate({
                        id: editingCaption.id,
                        caption: editingCaption.caption,
                      });
                      setEditingCaption(null);
                    }
                  }}
                >
                  <Text style={styles.modalButtonTextSave}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Image Viewer */}
        <ImageViewer
          visible={viewerVisible}
          images={portfolioImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
          onEdit={(image: PortfolioImage) => {
            setViewerVisible(false);
            setEditingCaption({ id: image.id, caption: image.caption || "" });
          }}
          onDelete={(image: PortfolioImage) => {
            setViewerVisible(false);
            deleteImage.mutate(image.id);
          }}
          showActions={true}
        />

        {/* Preview Changes */}
        {hasChanges && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview Changes</Text>

            {bio.trim() !== (profile?.bio || "") && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Bio:</Text>
                <Text style={styles.previewValue} numberOfLines={2}>
                  {bio.trim() || "None"}
                </Text>
              </View>
            )}

            {hourlyRate.trim() !== (profile?.hourlyRate?.toString() || "") && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Hourly Rate:</Text>
                <Text style={styles.previewValue}>
                  {hourlyRate
                    ? `₱${parseFloat(hourlyRate).toFixed(2)}/hour`
                    : "Not set"}
                </Text>
              </View>
            )}

            {phoneNumber.trim() !== (profile?.user.phoneNumber || "") && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Phone:</Text>
                <Text style={styles.previewValue}>
                  {phoneNumber.trim() || "Not set"}
                </Text>
              </View>
            )}

            {skills.trim() !== profile?.skills.join(", ") && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Skills:</Text>
                <Text style={styles.previewValue} numberOfLines={2}>
                  {skills.trim() || "None"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  saveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
  },
  saveButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
  saveButtonTextDisabled: {
    color: Colors.textSecondary,
  },

  // Form Fields
  fieldContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optional: {
    color: Colors.textSecondary,
    fontWeight: "400",
    fontSize: 12,
  },
  input: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  inputActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
  },
  inputWithPadding: {
    borderWidth: 0,
    flex: 1,
    marginLeft: Spacing.xs,
  },
  currencySymbol: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  inputSuffix: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  textArea: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 120,
  },
  textAreaActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  hintWarning: {
    color: Colors.warning,
  },
  charCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Preview
  previewContainer: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  previewTitle: {
    ...Typography.heading.h4,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  previewItem: {
    marginTop: Spacing.sm,
  },
  previewLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  previewValue: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },

  // Portfolio Section
  portfolioSection: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  portfolioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
  portfolioCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  portfolioHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  uploadContainer: {
    marginBottom: Spacing.md,
  },
  uploadHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  portfolioGrid: {
    marginTop: Spacing.md,
  },

  // Management Section (Certifications)
  managementSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  managementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  managementHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.medium,
  },
  manageButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
    flex: 1,
    marginLeft: Spacing.sm,
  },

  // Caption Edit Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "85%",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  captionInput: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  captionCharCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSave: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  modalButtonTextSave: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
});
