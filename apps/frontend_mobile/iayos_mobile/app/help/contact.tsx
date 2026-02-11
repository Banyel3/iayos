import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useContactSupport } from "@/lib/hooks/useContactSupport";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { value: "account", label: "Account Issue" },
  { value: "payment", label: "Payment Issue" },
  { value: "technical", label: "Technical Problem" },
  { value: "bug", label: "Report a Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export default function ContactSupportScreen() {
  const { data: userProfile } = useUserProfile();
  const contactSupport = useContactSupport();

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (contactSupport.isSuccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success!",
        `Thank you for contacting us. Your support ticket has been created. We'll respond within 24 hours.`,
        [
          {
            text: "OK",
            onPress: () => safeGoBack(router, "/(tabs)/profile"),
          },
        ]
      );
    }
  }, [contactSupport.isSuccess]);

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant photo library access to attach images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: `screenshot_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateForm = (): string | null => {
    if (!category) return "Please select a category";
    if (subject.trim().length < 5)
      return "Subject must be at least 5 characters";
    if (message.trim().length < 10)
      return "Message must be at least 10 characters";
    if (message.trim().length > 500)
      return "Message must be less than 500 characters";
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateForm();

    if (validationError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Validation Error", validationError);
      return;
    }

    if (!userProfile) {
      Alert.alert("Error", "User profile not loaded");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    contactSupport.mutate({
      name: `${userProfile.firstName} ${userProfile.lastName}`,
      email: userProfile.email,
      category,
      subject: subject.trim(),
      message: message.trim(),
      attachment: attachment || undefined,
    });
  };

  const isFormValid = !validateForm();
  const characterCount = message.length;
  const characterLimit = 500;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contact Support</Text>
          <Text style={styles.subtitle}>
            {
              "We're here to help. Send us a message and we'll respond within 24 hours."
            }
          </Text>
        </View>

        {/* User Info (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>
                {userProfile
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : "Loading..."}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>
                {userProfile?.email || "Loading..."}
              </Text>
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !category && styles.pickerButtonTextPlaceholder,
                ]}
              >
                {category
                  ? CATEGORIES.find((c) => c.value === category)?.label
                  : "Select a category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of your issue"
              placeholderTextColor="#9CA3AF"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
              autoCapitalize="sentences"
            />
            <Text style={styles.helperText}>
              {subject.length}/100 characters
            </Text>
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide as much detail as possible..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={characterLimit}
              autoCapitalize="sentences"
            />
            <Text
              style={[
                styles.helperText,
                characterCount > characterLimit - 50 &&
                  styles.helperTextWarning,
              ]}
            >
              {characterCount}/{characterLimit} characters
            </Text>
          </View>

          {/* Attachment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attachment (Optional)</Text>
            {attachment ? (
              <View style={styles.attachmentContainer}>
                <View style={styles.attachmentInfo}>
                  <Ionicons name="document-attach" size={20} color="#3B82F6" />
                  <Text style={styles.attachmentName}>{attachment.name}</Text>
                </View>
                <TouchableOpacity onPress={handleRemoveAttachment}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickImage}
              >
                <Ionicons name="camera-outline" size={24} color="#3B82F6" />
                <Text style={styles.attachButtonText}>Attach Screenshot</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.helperText}>
              You can attach a screenshot to help explain your issue
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || contactSupport.isPending) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || contactSupport.isPending}
          activeOpacity={0.7}
        >
          {contactSupport.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
          disabled={contactSupport.isPending}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryPicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{cat.label}</Text>
                  {category === cat.value && (
                    <Ionicons name="checkmark" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputDisabledText: {
    fontSize: 16,
    color: "#6B7280",
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  pickerButtonTextPlaceholder: {
    color: "#9CA3AF",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  helperTextWarning: {
    color: "#F59E0B",
  },
  attachmentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: "#1E40AF",
    marginLeft: 8,
    flex: 1,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderStyle: "dashed",
    paddingVertical: 16,
    gap: 8,
  },
  attachButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3B82F6",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#111827",
  },
});
