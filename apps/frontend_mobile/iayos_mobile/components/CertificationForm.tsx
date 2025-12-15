// Certification Form Modal
// Add or edit worker certifications with document upload

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery } from "@tanstack/react-query";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  useCreateCertification,
  useUpdateCertification,
  type Certification,
  type CreateCertificationRequest,
  type UpdateCertificationRequest,
} from "@/lib/hooks/useCertifications";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";

// ===== TYPES =====

interface Skill {
  id: number; // Specialization ID (used to link certification)
  specializationId: number; // Specializations ID
  name: string;
  experienceYears: number;
  certificationCount: number;
}

// ===== PROPS =====

interface CertificationFormProps {
  visible: boolean;
  onClose: () => void;
  certification?: Certification; // If provided, edit mode
  preselectedSkillId?: number; // If provided, skill is pre-filled and cannot be changed
}

// ===== VALIDATION =====

interface FormErrors {
  name?: string;
  organization?: string; // Fixed: backend expects 'organization' not 'issuingOrganization'
  issueDate?: string;
  expiryDate?: string;
}

function validateForm(
  name: string,
  organization: string,
  issueDate: Date,
  expiryDate: Date | null
): FormErrors {
  const errors: FormErrors = {};

  if (!name || name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  } else if (name.trim().length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  if (!organization || organization.trim().length < 3) {
    errors.organization = "Organization must be at least 3 characters";
  } else if (organization.trim().length > 100) {
    errors.organization = "Organization must be less than 100 characters";
  }

  if (issueDate > new Date()) {
    errors.issueDate = "Issue date cannot be in the future";
  }

  if (expiryDate && expiryDate <= issueDate) {
    errors.expiryDate = "Expiry date must be after issue date";
  }

  return errors;
}

// ===== MAIN COMPONENT =====

export default function CertificationForm({
  visible,
  onClose,
  certification,
  preselectedSkillId,
}: CertificationFormProps) {
  const isEditMode = !!certification;
  const isSkillLocked = !!preselectedSkillId || isEditMode; // Skill is locked if preselected or editing
  const createCertification = useCreateCertification();
  const updateCertification = useUpdateCertification();

  // Fetch worker's skills using the dedicated endpoint
  interface MySkillsResponse {
    success: boolean;
    data: Array<{
      id: number; // Specialization ID
      name: string;
      description: string;
      experienceYears: number;
      certification: string;
    }>;
    count: number;
  }

  const {
    data: skillsData,
    isLoading: skillsLoading,
    error: skillsError,
  } = useQuery({
    queryKey: ["my-skills"],
    queryFn: async () => {
      console.log(
        "🔍 [CertificationForm] Fetching skills from:",
        ENDPOINTS.MY_SKILLS
      );
      const response = await apiRequest(ENDPOINTS.MY_SKILLS);
      console.log("🔍 [CertificationForm] Response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch skills");
      const data = await response.json();
      console.log(
        "🔍 [CertificationForm] Skills response:",
        JSON.stringify(data, null, 2)
      );
      return data as MySkillsResponse;
    },
  });

  // Map the skills data to the format expected by the skill picker
  const skills: Skill[] = (skillsData?.data || []).map((s) => ({
    id: s.id, // This is specializationID, used to link certification
    specializationId: s.id,
    name: s.name,
    experienceYears: s.experienceYears,
    certificationCount: 0,
  }));

  // Debug log
  console.log("🔍 [CertificationForm] Mapped skills array:", skills);
  console.log("🔍 [CertificationForm] skillsLoading:", skillsLoading);
  console.log("🔍 [CertificationForm] skillsError:", skillsError);

  // Skill picker modal state
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [issueDate, setIssueDate] = useState(new Date());
  const [selectedSkillId, setSelectedSkillId] = useState<number>(-1);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [certificateImage, setCertificateImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Date picker states
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  // Initialize form with certification data (edit mode) or preselected skill
  useEffect(() => {
    if (certification) {
      setName(certification.name);
      setOrganization(certification.issuingOrganization);
      setIssueDate(new Date(certification.issueDate));
      // Use the certification's skill ID
      setSelectedSkillId(certification.specializationId || -1);
      if (certification.expiryDate) {
        setExpiryDate(new Date(certification.expiryDate));
        setHasExpiry(true);
      }
    } else if (preselectedSkillId) {
      // Pre-fill skill ID for new certification
      setSelectedSkillId(preselectedSkillId);
      resetForm();
    } else {
      resetForm();
    }
  }, [certification, preselectedSkillId, visible]);

  // Reset form
  const resetForm = () => {
    setName("");
    setOrganization("");
    setIssueDate(new Date());
    setExpiryDate(null);
    setHasExpiry(false);
    setCertificateImage(null);
    setSelectedSkillId(-1);
    setShowSkillPicker(false);
    setErrors({});
  };

  // Handle image picker
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCertificateImage(result.assets[0]);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    const formErrors = validateForm(
      name,
      organization,
      issueDate,
      hasExpiry ? expiryDate : null
    );
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (isEditMode) {
      // Edit mode - Update
      const data: UpdateCertificationRequest = {
        name: name.trim(),
        organization: organization.trim(), // Fixed: backend expects 'organization'
        issueDate: issueDate.toISOString().split("T")[0],
        expiryDate:
          hasExpiry && expiryDate
            ? expiryDate.toISOString().split("T")[0]
            : undefined,
        // 0 = General (send undefined to backend), positive = skill ID
        specializationId: selectedSkillId > 0 ? selectedSkillId : undefined,
        certificateFile: certificateImage
          ? {
              uri: certificateImage.uri,
              name: certificateImage?.fileName ?? "certificate.jpg",
              type: certificateImage?.mimeType ?? "image/jpeg",
            }
          : undefined,
      };

      updateCertification.mutate(
        { id: certification.id, data },
        {
          onSuccess: () => {
            Alert.alert("Success", "Certification updated successfully");
            onClose();
          },
          onError: (error: Error) => {
            Alert.alert(
              "Error",
              error.message || "Failed to update certification"
            );
          },
        }
      );
    } else {
      // Create mode
      if (selectedSkillId <= 0) {
        Alert.alert(
          "Skill Required",
          "Please select a skill for this certification"
        );
        return;
      }

      if (!certificateImage) {
        Alert.alert("Image Required", "Please upload a certificate document");
        return;
      }

      const data: CreateCertificationRequest = {
        name: name.trim(),
        organization: organization.trim(), // Fixed: backend expects 'organization'
        issueDate: issueDate.toISOString().split("T")[0],
        expiryDate:
          hasExpiry && expiryDate
            ? expiryDate.toISOString().split("T")[0]
            : undefined,
        specializationId: selectedSkillId, // Already validated > 0 above
        certificateFile: {
          uri: certificateImage.uri,
          name: certificateImage?.fileName ?? "certificate.jpg",
          type: certificateImage?.mimeType ?? "image/jpeg",
        },
      };

      createCertification.mutate(data, {
        onSuccess: () => {
          Alert.alert("Success", "Certification added successfully");
          resetForm();
          onClose();
        },
        onError: (error: Error) => {
          Alert.alert("Error", error.message || "Failed to add certification");
        },
      });
    }
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (name || organization || certificateImage) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const isLoading =
    createCertification.isPending || updateCertification.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Certification" : "Add Certification"}
            </Text>
            <Pressable onPress={handleClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Certificate Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Certification Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="e.g., Certified Electrician"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Issuing Organization */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Issuing Organization <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.organization && styles.inputError]}
                value={organization}
                onChangeText={(text) => {
                  setOrganization(text);
                  if (errors.organization)
                    setErrors({ ...errors, organization: undefined });
                }}
                placeholder="e.g., National Electrical Association"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              {errors.organization && (
                <Text style={styles.errorText}>{errors.organization}</Text>
              )}
            </View>

            {/* Skill Link (Required - locked if preselected or editing) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Link to Skill <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={[
                  styles.skillPickerButton,
                  isSkillLocked && styles.skillPickerButtonDisabled,
                ]}
                onPress={() =>
                  !isLoading && !isSkillLocked && setShowSkillPicker(true)
                }
                disabled={isLoading || isSkillLocked}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={
                    isSkillLocked ? Colors.textTertiary : Colors.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.skillPickerText,
                    isSkillLocked && styles.skillPickerTextDisabled,
                  ]}
                >
                  {selectedSkillId === -1
                    ? "-- Select a skill --"
                    : skills.find((s) => s.id === selectedSkillId)?.name ||
                      "Select a skill"}
                </Text>
                {!isSkillLocked && (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textSecondary}
                  />
                )}
                {isSkillLocked && (
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={Colors.textTertiary}
                  />
                )}
              </Pressable>
              {!isSkillLocked && (
                <Text style={styles.hint}>
                  Select the skill this certification applies to
                </Text>
              )}
              {isSkillLocked && (
                <Text style={styles.hint}>
                  Certification is locked to this skill
                </Text>
              )}
            </View>

            {/* Skill Picker Modal */}
            <Modal
              visible={showSkillPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowSkillPicker(false)}
            >
              <Pressable
                style={styles.skillModalOverlay}
                onPress={() => setShowSkillPicker(false)}
              >
                <View style={styles.skillModalContent}>
                  <View style={styles.skillModalHeader}>
                    <Text style={styles.skillModalTitle}>Select Skill</Text>
                    <Pressable onPress={() => setShowSkillPicker(false)}>
                      <Ionicons
                        name="close"
                        size={24}
                        color={Colors.textPrimary}
                      />
                    </Pressable>
                  </View>
                  <ScrollView style={styles.skillList}>
                    {/* Worker's skills */}
                    {skillsLoading ? (
                      <View style={styles.skillLoadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                        <Text style={styles.skillLoadingText}>
                          Loading skills...
                        </Text>
                      </View>
                    ) : skills.length === 0 ? (
                      <Text style={styles.noSkillsText}>
                        No skills added yet. Add skills in your profile first.
                      </Text>
                    ) : (
                      skills.map((skill) => (
                        <Pressable
                          key={skill.id}
                          style={[
                            styles.skillOption,
                            selectedSkillId === skill.id &&
                              styles.skillOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedSkillId(skill.id);
                            setShowSkillPicker(false);
                          }}
                        >
                          <Text style={styles.skillOptionText}>
                            {skill.name}
                          </Text>
                          {selectedSkillId === skill.id && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={Colors.primary}
                            />
                          )}
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>

            {/* Issue Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Issue Date <Text style={styles.required}>*</Text>
              </Text>
              <Pressable
                style={[
                  styles.dateButton,
                  errors.issueDate && styles.inputError,
                ]}
                onPress={() => !isEditMode && setShowIssueDatePicker(true)}
                disabled={isLoading || isEditMode}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors.textPrimary}
                />
                <Text style={styles.dateButtonText}>
                  {issueDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </Pressable>
              {errors.issueDate && (
                <Text style={styles.errorText}>{errors.issueDate}</Text>
              )}
              {isEditMode && (
                <Text style={styles.hint}>
                  Date cannot be changed after creation
                </Text>
              )}
            </View>

            {/* Issue Date Picker */}
            {showIssueDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={issueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    const isIOS = Platform.OS === "ios";
                    setShowIssueDatePicker(isIOS);

                    if (event.type === "dismissed") {
                      return;
                    }

                    if (selectedDate) {
                      setIssueDate(selectedDate);
                      if (errors.issueDate)
                        setErrors({ ...errors, issueDate: undefined });
                    }
                  }}
                  maximumDate={new Date()}
                  themeVariant="light"
                  textColor={
                    Platform.OS === "ios" ? Colors.textPrimary : undefined
                  }
                  style={
                    Platform.OS === "ios" ? styles.inlineDatePicker : undefined
                  }
                />
              </View>
            )}

            {/* Expiry Date Toggle */}
            <View style={styles.formGroup}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  setHasExpiry(!hasExpiry);
                  if (!hasExpiry) setExpiryDate(null);
                }}
                disabled={isLoading}
              >
                <View
                  style={[styles.checkbox, hasExpiry && styles.checkboxChecked]}
                >
                  {hasExpiry && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.textLight}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  This certification expires
                </Text>
              </Pressable>
            </View>

            {/* Expiry Date Picker */}
            {hasExpiry && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Expiry Date <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={[
                    styles.dateButton,
                    errors.expiryDate && styles.inputError,
                  ]}
                  onPress={() => !isEditMode && setShowExpiryDatePicker(true)}
                  disabled={isLoading || isEditMode}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors.textPrimary}
                  />
                  <Text style={styles.dateButtonText}>
                    {expiryDate
                      ? expiryDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Select date"}
                  </Text>
                </Pressable>
                {errors.expiryDate && (
                  <Text style={styles.errorText}>{errors.expiryDate}</Text>
                )}
                {isEditMode && (
                  <Text style={styles.hint}>
                    Date cannot be changed after creation
                  </Text>
                )}
              </View>
            )}

            {/* Expiry Date Picker */}
            {showExpiryDatePicker && hasExpiry && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={expiryDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    const isIOS = Platform.OS === "ios";
                    setShowExpiryDatePicker(isIOS);

                    if (event.type === "dismissed") {
                      return;
                    }

                    if (selectedDate) {
                      setExpiryDate(selectedDate);
                      if (errors.expiryDate)
                        setErrors({ ...errors, expiryDate: undefined });
                    }
                  }}
                  minimumDate={issueDate}
                  themeVariant="light"
                  textColor={
                    Platform.OS === "ios" ? Colors.textPrimary : undefined
                  }
                  style={
                    Platform.OS === "ios" ? styles.inlineDatePicker : undefined
                  }
                />
              </View>
            )}

            {/* Certificate Image Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Certificate Document{" "}
                {isEditMode ? (
                  "(Optional - Update if needed)"
                ) : (
                  <Text style={styles.required}>*</Text>
                )}
              </Text>
              {certificateImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: certificateImage.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => setCertificateImage(null)}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={Colors.error}
                    />
                  </Pressable>
                </View>
              ) : certification?.certificateUrl ? (
                <View>
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: certification.certificateUrl }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  </View>
                  <Pressable
                    style={styles.uploadButton}
                    onPress={handlePickImage}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.uploadButtonText}>
                      Change Certificate
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color={Colors.primary}
                  />
                  <Text style={styles.uploadButtonText}>
                    Upload Certificate
                  </Text>
                  <Text style={styles.uploadButtonHint}>
                    Tap to select image from gallery
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.submitButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditMode ? "Update" : "Add"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: "90%",
    ...Shadows.medium,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  scrollView: {
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  required: {
    color: Colors.error,
  },
  input: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  dateButtonText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  uploadButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  uploadButtonHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: BorderRadius.medium,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.medium,
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  skillPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  skillPickerButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
  },
  skillPickerText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  skillPickerTextDisabled: {
    color: Colors.textTertiary,
  },
  skillModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  skillModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: "70%",
  },
  skillModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  skillModalTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
  },
  skillList: {
    padding: Spacing.md,
  },
  skillOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xs,
  },
  skillOptionSelected: {
    backgroundColor: Colors.primary + "15",
  },
  skillOptionText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  skillLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  skillLoadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  noSkillsText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    padding: Spacing.lg,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  inlineDatePicker: {
    width: "100%",
    minHeight: 180,
  },
});
