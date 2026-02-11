import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useCreateTicket, TICKET_CATEGORIES } from "@/lib/hooks/useSupport";

export default function CreateTicketScreen() {
  const router = useRouter();
  const createTicketMutation = useCreateTicket();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState({
    subject: "",
    category: "",
    description: "",
  });

  const validate = (): boolean => {
    const newErrors = {
      subject: "",
      category: "",
      description: "",
    };

    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (subject.length < 10) {
      newErrors.subject = "Subject must be at least 10 characters";
    } else if (subject.length > 200) {
      newErrors.subject = "Subject must be 200 characters or less";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return !newErrors.subject && !newErrors.category && !newErrors.description;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        subject: subject.trim(),
        category,
        description: description.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Ticket Submitted! ✅",
        "Your support ticket has been created. Our team will respond within 24 hours.",
        [
          {
            text: "View My Tickets",
            onPress: () => router.replace("/support/tickets" as any),
          },
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to create ticket");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={[styles.input, errors.subject ? styles.inputError : null]}
              placeholder="Brief description of your issue"
              placeholderTextColor={Colors.textSecondary}
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                if (errors.subject) setErrors({ ...errors, subject: "" });
              }}
              maxLength={200}
            />
            <View style={styles.inputFooter}>
              {errors.subject ? (
                <Text style={styles.errorText}>{errors.subject}</Text>
              ) : (
                <View />
              )}
              <Text style={styles.charCount}>{subject.length}/200</Text>
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {TICKET_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    if (errors.category) setErrors({ ...errors, category: "" });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.value && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <Text style={styles.hint}>
              Please provide as much detail as possible to help us resolve your
              issue quickly.
            </Text>
            <TextInput
              style={[
                styles.textArea,
                errors.description ? styles.inputError : null,
              ]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description)
                  setErrors({ ...errors, description: "" });
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <View style={styles.inputFooter}>
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : (
                <View />
              )}
              <Text style={styles.charCount}>{description.length}/2000</Text>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={Colors.warning}
              />
              <Text style={styles.tipsTitle}>Tips for faster resolution</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                • Include relevant job or transaction IDs
              </Text>
              <Text style={styles.tipItem}>
                • Describe what you expected vs what happened
              </Text>
              <Text style={styles.tipItem}>
                • Mention any error messages you saw
              </Text>
              <Text style={styles.tipItem}>
                • Include screenshots if possible
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              createTicketMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createTicketMutation.isPending}
          >
            {createTicketMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  charCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.textPrimary,
    minHeight: 150,
  },
  tipsCard: {
    backgroundColor: Colors.warning + "10",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tipsTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.body.large,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
