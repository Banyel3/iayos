// app/kyc/confirm.tsx
// KYC Data Confirmation Screen - Review and edit AI-extracted data

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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useKYCAutofill,
  useConfirmKYC,
  formatFieldName,
  validateKYCFields,
  KYCConfirmPayload,
} from "@/lib/hooks/useKYCAutofill";
import CustomBackButton from "@/components/navigation/CustomBackButton";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface EditableField {
  key: string;
  label: string;
  value: string;
  originalValue: string;
  confidence: number;
  required: boolean;
  edited: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}

const FIELD_CONFIG: Array<{
  key: keyof KYCConfirmPayload;
  label: string;
  required: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  section?: "personal" | "clearance"; // Group fields by section
}> = [
  // ============================================================
  // PERSONAL INFORMATION (from ID documents)
  // ============================================================
  {
    key: "full_name",
    label: "Full Name",
    required: true,
    placeholder: "Juan Dela Cruz",
    section: "personal",
  },
  {
    key: "first_name",
    label: "First Name",
    required: false,
    placeholder: "Juan",
    section: "personal",
  },
  {
    key: "middle_name",
    label: "Middle Name",
    required: false,
    placeholder: "Santos",
    section: "personal",
  },
  {
    key: "last_name",
    label: "Last Name",
    required: false,
    placeholder: "Dela Cruz",
    section: "personal",
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    required: true,
    placeholder: "YYYY-MM-DD",
    section: "personal",
  },
  {
    key: "address",
    label: "Address",
    required: true,
    placeholder: "123 Main St, Barangay, City",
    section: "personal",
  },
  {
    key: "id_number",
    label: "ID Number",
    required: true,
    placeholder: "1234-5678-9012-3456",
    section: "personal",
  },
  {
    key: "nationality",
    label: "Nationality",
    required: false,
    placeholder: "Filipino",
    section: "personal",
  },
  {
    key: "sex",
    label: "Sex",
    required: false,
    placeholder: "Male / Female",
    section: "personal",
  },
  {
    key: "place_of_birth",
    label: "Place of Birth",
    required: false,
    placeholder: "City, Province",
    section: "personal",
  },
  // ============================================================
  // CLEARANCE INFORMATION (NBI / Police Clearance)
  // ============================================================
  {
    key: "clearance_number",
    label: "Clearance Number",
    required: false,
    placeholder: "NBI-2025-XXXXXXXX",
    section: "clearance",
  },
  {
    key: "clearance_type",
    label: "Clearance Type",
    required: false,
    placeholder: "NBI / Police",
    section: "clearance",
  },
  {
    key: "clearance_issue_date",
    label: "Clearance Issue Date",
    required: false,
    placeholder: "YYYY-MM-DD",
    section: "clearance",
  },
  {
    key: "clearance_validity_date",
    label: "Clearance Valid Until",
    required: false,
    placeholder: "YYYY-MM-DD",
    section: "clearance",
  },
];

export default function KYCConfirmScreen() {
  const router = useRouter();
  const {
    autofillData,
    hasAutofillData,
    needsConfirmation,
    extractionStatus,
    isConfirmed,
    extractedFields,
    getFieldValue,
    getFieldConfidence,
    isLoading: autofillLoading,
    isError,
    error,
    refetch,
  } = useKYCAutofill();

  const confirmMutation = useConfirmKYC();

  const [fields, setFields] = useState<EditableField[]>([]);
  const [editedFieldKeys, setEditedFieldKeys] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields from extracted data
  useEffect(() => {
    if (autofillData && hasAutofillData) {
      const initializedFields: EditableField[] = FIELD_CONFIG.map((config) => {
        const extractedValue = getFieldValue(config.key as any);
        const confidence = getFieldConfidence(config.key as any) / 100; // Convert to 0-1

        return {
          key: config.key,
          label: config.label,
          value: extractedValue,
          originalValue: extractedValue,
          confidence,
          required: config.required,
          edited: false,
          placeholder: config.placeholder,
          keyboardType: config.keyboardType,
        };
      });

      setFields(initializedFields);
    }
  }, [autofillData, hasAutofillData]);

  const handleFieldChange = (key: string, newValue: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.key === key
          ? {
              ...field,
              value: newValue,
              edited: newValue !== field.originalValue,
            }
          : field,
      ),
    );

    // Track edited fields
    const field = fields.find((f) => f.key === key);
    if (field && newValue !== field.originalValue) {
      setEditedFieldKeys((prev) => new Set(prev).add(key));
    } else {
      setEditedFieldKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleSubmit = async () => {
    // Build payload from current field values
    const payload: KYCConfirmPayload = {};
    const editedList: string[] = [];

    fields.forEach((field) => {
      if (field.value) {
        (payload as any)[field.key] = field.value;
      }
      if (field.edited) {
        editedList.push(field.key);
      }
    });

    payload.edited_fields = editedList;

    // Validate required fields
    const validation = validateKYCFields(payload);
    if (!validation.valid) {
      const missingLabels = validation.missingFields
        .map(formatFieldName)
        .join(", ");
      Alert.alert(
        "Missing Required Fields",
        `Please fill in the following fields: ${missingLabels}`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmMutation.mutateAsync(payload);

      Alert.alert(
        "Data Confirmed",
        "Your KYC information has been saved successfully.",
        [{ text: "OK", onPress: () => router.replace("/kyc/status") }],
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save KYC data",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return { color: Colors.success, label: "High", icon: "checkmark-circle" };
    }
    if (confidence >= 0.7) {
      return { color: Colors.warning, label: "Medium", icon: "alert-circle" };
    }
    return { color: Colors.error, label: "Low", icon: "warning" };
  };

  // Loading state
  if (autofillLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading extracted data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.customHeader}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>Confirm Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorTitle}>Failed to Load Data</Text>
          <Text style={styles.errorMessage}>
            {error?.message || "Please try again"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No data available
  if (!hasAutofillData || extractionStatus === "PENDING") {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.customHeader}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>Confirm Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="time-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Processing Your Documents</Text>
          <Text style={styles.emptyMessage}>
            We're extracting information from your documents. This usually takes
            a few moments.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.refreshButtonText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Already confirmed
  if (isConfirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.customHeader}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>Confirm Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.confirmedContainer}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={styles.confirmedTitle}>Already Confirmed</Text>
          <Text style={styles.confirmedMessage}>
            Your KYC details have already been confirmed.
          </Text>
          <TouchableOpacity
            style={styles.viewStatusButton}
            onPress={() => router.replace("/kyc/status")}
          >
            <Text style={styles.viewStatusButtonText}>View KYC Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Confirm Details</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors.primary}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoBannerTitle}>
                Review Your Information
              </Text>
              <Text style={styles.infoBannerText}>
                We've extracted information from your documents. Please review
                and correct any errors before confirming.
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Confidence Levels:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.success },
                  ]}
                />
                <Text style={styles.legendText}>High (90%+)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.warning },
                  ]}
                />
                <Text style={styles.legendText}>Medium (70-90%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: Colors.error }]}
                />
                <Text style={styles.legendText}>Low (&lt;70%)</Text>
              </View>
            </View>
          </View>

          {/* Fields */}
          {fields.map((field) => {
            const badge = getConfidenceBadge(field.confidence);
            const isLowConfidence = field.confidence < 0.7;

            return (
              <View
                key={field.key}
                style={[
                  styles.fieldContainer,
                  isLowConfidence && styles.fieldContainerWarning,
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required && (
                      <Text style={styles.requiredStar}> *</Text>
                    )}
                  </Text>
                  {field.originalValue && (
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: badge.color },
                      ]}
                    >
                      <Ionicons
                        name={badge.icon as any}
                        size={12}
                        color={Colors.white}
                      />
                      <Text style={styles.confidenceBadgeText}>
                        {Math.round(field.confidence * 100)}%
                      </Text>
                    </View>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.fieldInput,
                    field.edited && styles.fieldInputEdited,
                  ]}
                  value={field.value}
                  onChangeText={(text) => handleFieldChange(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType={field.keyboardType || "default"}
                />

                {field.edited && (
                  <View style={styles.editedIndicator}>
                    <Ionicons name="pencil" size={12} color={Colors.primary} />
                    <Text style={styles.editedText}>Edited</Text>
                  </View>
                )}

                {isLowConfidence && !field.edited && field.originalValue && (
                  <Text style={styles.warningText}>
                    ⚠️ Low confidence - please verify this field
                  </Text>
                )}
              </View>
            );
          })}

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              {editedFieldKeys.size > 0
                ? `You've edited ${editedFieldKeys.size} field(s)`
                : "No changes made"}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace("/kyc/status")}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              isSubmitting && styles.confirmButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm Details</Text>
                <Ionicons name="checkmark" size={20} color={Colors.white} />
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
  customHeader: {
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  errorMessage: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  emptyMessage: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  refreshButton: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  refreshButtonText: {
    marginLeft: Spacing.sm,
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
  },
  confirmedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  confirmedTitle: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.success,
  },
  confirmedMessage: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  viewStatusButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  viewStatusButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: Colors.primaryLight || "#EBF5FF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoBannerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.primary,
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  legendContainer: {
    backgroundColor: Colors.backgroundSecondary || "#F9FAFB",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  legendTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldContainerWarning: {
    borderColor: Colors.warning,
    backgroundColor: "#FFFBEB",
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
  },
  requiredStar: {
    color: Colors.error,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  fieldInputEdited: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  editedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  editedText: {
    marginLeft: 4,
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
  warningText: {
    marginTop: 4,
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
  },
  summaryContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary || "#F9FAFB",
    borderRadius: BorderRadius.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  summaryText: {
    marginTop: 4,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  skipButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
    marginRight: Spacing.xs,
  },
});
