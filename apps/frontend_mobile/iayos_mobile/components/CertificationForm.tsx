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

// ===== PROPS =====

interface CertificationFormProps {
  visible: boolean;
  onClose: () => void;
  certification?: Certification; // If provided, edit mode
}

// ===== VALIDATION =====

interface FormErrors {
  name?: string;
  issuingOrganization?: string;
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
    errors.issuingOrganization = "Organization must be at least 3 characters";
  } else if (organization.trim().length > 100) {
    errors.issuingOrganization =
      "Organization must be less than 100 characters";
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
}: CertificationFormProps) {
  const isEditMode = !!certification;
  const createCertification = useCreateCertification();
  const updateCertification = useUpdateCertification();

  // Form State
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [issueDate, setIssueDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [certificateImage, setCertificateImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Date picker states
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  // Initialize form with certification data (edit mode)
  useEffect(() => {
    if (certification) {
      setName(certification.name);
      setOrganization(certification.issuingOrganization);
      setIssueDate(new Date(certification.issueDate));
      if (certification.expiryDate) {
        setExpiryDate(new Date(certification.expiryDate));
        setHasExpiry(true);
      }
    } else {
      resetForm();
    }
  }, [certification, visible]);

  // Reset form
  const resetForm = () => {
    setName("");
    setOrganization("");
    setIssueDate(new Date());
    setExpiryDate(null);
    setHasExpiry(false);
    setCertificateImage(null);
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
        issuingOrganization: organization.trim(),
        issueDate: issueDate.toISOString().split("T")[0],
        expiryDate:
          hasExpiry && expiryDate
            ? expiryDate.toISOString().split("T")[0]
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
      if (!certificateImage) {
        Alert.alert("Image Required", "Please upload a certificate document");
        return;
      }

      const data: CreateCertificationRequest = {
        name: name.trim(),
        issuingOrganization: organization.trim(),
        issueDate: issueDate.toISOString().split("T")[0],
        expiryDate:
          hasExpiry && expiryDate
            ? expiryDate.toISOString().split("T")[0]
            : undefined,
        certificateFile: {
          uri: certificateImage.uri,
          name: certificateImage.fileName || "certificate.jpg",
          type: certificateImage.mimeType || "image/jpeg",
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
                style={[
                  styles.input,
                  errors.issuingOrganization && styles.inputError,
                ]}
                value={organization}
                onChangeText={(text) => {
                  setOrganization(text);
                  if (errors.issuingOrganization)
                    setErrors({ ...errors, issuingOrganization: undefined });
                }}
                placeholder="e.g., National Electrical Association"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              {errors.issuingOrganization && (
                <Text style={styles.errorText}>
                  {errors.issuingOrganization}
                </Text>
              )}
            </View>

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
              <DateTimePicker
                value={issueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowIssueDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setIssueDate(selectedDate);
                    if (errors.issueDate)
                      setErrors({ ...errors, issueDate: undefined });
                  }
                }}
                maximumDate={new Date()}
              />
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
              <DateTimePicker
                value={expiryDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowExpiryDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setExpiryDate(selectedDate);
                    if (errors.expiryDate)
                      setErrors({ ...errors, expiryDate: undefined });
                  }
                }}
                minimumDate={issueDate}
              />
            )}

            {/* Certificate Image Upload */}
            {!isEditMode && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Certificate Document <Text style={styles.required}>*</Text>
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
            )}
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
});
