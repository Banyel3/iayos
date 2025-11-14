// Material Form Modal
// Add or edit worker materials/products

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
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  useCreateMaterial,
  useUpdateMaterial,
  type Material,
  type CreateMaterialRequest,
  type UpdateMaterialRequest,
  isValidPrice,
} from "@/lib/hooks/useMaterials";

// ===== PROPS =====

interface MaterialFormProps {
  visible: boolean;
  onClose: () => void;
  material?: Material; // If provided, edit mode
}

// ===== VALIDATION =====

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  unit?: string;
}

function validateForm(
  name: string,
  description: string,
  price: string,
  unit: string
): FormErrors {
  const errors: FormErrors = {};

  if (!name || name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  } else if (name.trim().length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  if (!description || description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters";
  } else if (description.trim().length > 500) {
    errors.description = "Description must be less than 500 characters";
  }

  const priceNum = parseFloat(price);
  if (!price || isNaN(priceNum)) {
    errors.price = "Price is required";
  } else if (!isValidPrice(priceNum)) {
    errors.price = "Price must be between ₱0.01 and ₱1,000,000";
  }

  if (!unit || unit.trim().length < 2) {
    errors.unit = "Unit is required (e.g., per kg, per piece)";
  } else if (unit.trim().length > 50) {
    errors.unit = "Unit must be less than 50 characters";
  }

  return errors;
}

// ===== MAIN COMPONENT =====

export default function MaterialForm({
  visible,
  onClose,
  material,
}: MaterialFormProps) {
  const isEditMode = !!material;
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [materialImage, setMaterialImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize form with material data (edit mode)
  useEffect(() => {
    if (material) {
      setName(material.name);
      setDescription(material.description);
      setPrice(material.price.toString());
      setUnit(material.unit);
      setIsAvailable(material.isAvailable);
    } else {
      resetForm();
    }
  }, [material, visible]);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setUnit("");
    setIsAvailable(true);
    setMaterialImage(null);
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
      setMaterialImage(result.assets[0]);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    const formErrors = validateForm(name, description, price, unit);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const priceNum = parseFloat(price);

    if (isEditMode) {
      // Edit mode - Update
      const data: UpdateMaterialRequest = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        unit: unit.trim(),
        isAvailable,
      };

      updateMaterial.mutate(
        { id: material.id, data },
        {
          onSuccess: () => {
            Alert.alert("Success", "Material updated successfully");
            onClose();
          },
          onError: (error: Error) => {
            Alert.alert("Error", error.message || "Failed to update material");
          },
        }
      );
    } else {
      // Create mode
      const data: CreateMaterialRequest = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        unit: unit.trim(),
        isAvailable,
        imageFile: materialImage
          ? {
              uri: materialImage.uri,
              name: materialImage.fileName || "material.jpg",
              type: materialImage.mimeType || "image/jpeg",
            }
          : undefined,
      };

      createMaterial.mutate(data, {
        onSuccess: () => {
          Alert.alert("Success", "Material added successfully");
          resetForm();
          onClose();
        },
        onError: (error: Error) => {
          Alert.alert("Error", error.message || "Failed to add material");
        },
      });
    }
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (name || description || price || materialImage) {
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

  const isLoading = createMaterial.isPending || updateMaterial.isPending;

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
              {isEditMode ? "Edit Material" : "Add Material"}
            </Text>
            <Pressable onPress={handleClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Material Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Material/Product Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="e.g., Premium Cement, Steel Bars"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError,
                ]}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description)
                    setErrors({ ...errors, description: undefined });
                }}
                placeholder="Describe the material, quality, specifications..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isLoading}
              />
              <Text style={styles.charCount}>
                {description.length} / 500 characters
              </Text>
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Price <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.priceInput,
                    errors.price && styles.inputError,
                  ]}
                  value={price}
                  onChangeText={(text) => {
                    // Allow only numbers and decimal point
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    setPrice(cleaned);
                    if (errors.price) setErrors({ ...errors, price: undefined });
                  }}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            {/* Unit */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Unit <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.unit && styles.inputError]}
                value={unit}
                onChangeText={(text) => {
                  setUnit(text);
                  if (errors.unit) setErrors({ ...errors, unit: undefined });
                }}
                placeholder="e.g., per kg, per piece, per meter"
                placeholderTextColor={Colors.textSecondary}
                editable={!isLoading}
              />
              {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
              <Text style={styles.hint}>
                How the material is sold (per kg, per bag, per piece, etc.)
              </Text>
            </View>

            {/* Availability Toggle */}
            <View style={styles.formGroup}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsAvailable(!isAvailable)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, isAvailable && styles.checkboxChecked]}>
                  {isAvailable && (
                    <Ionicons name="checkmark" size={16} color={Colors.textLight} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Material is currently available</Text>
              </Pressable>
            </View>

            {/* Material Image Upload */}
            {!isEditMode && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Material Image (Optional)</Text>
                {materialImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: materialImage.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => setMaterialImage(null)}
                      disabled={isLoading}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.uploadButton}
                    onPress={handlePickImage}
                    disabled={isLoading}
                  >
                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Upload Image</Text>
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
              style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    fontWeight: "bold",
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
    marginTop: Spacing.xs,
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
});
