// components/KYC/KYCFieldEditor.tsx
// Editable form for KYC OCR-extracted fields with confidence indicators

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import {
  ExtractedFieldWithConfidence,
  getConfidenceColor,
  getConfidenceLabel,
  formatFieldName,
} from "@/lib/hooks/useKYCAutofill";

interface KYCFieldEditorProps {
  /** Label for the field */
  label: string;
  /** Field key for identification */
  fieldKey: string;
  /** Extracted field data with value and confidence */
  field?: ExtractedFieldWithConfidence;
  /** Current value (may differ from extracted if user edited) */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Whether the field is editable */
  editable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Input type (default, date) */
  inputType?: "default" | "date";
  /** Whether the field is required */
  required?: boolean;
  /** Custom validation error message */
  errorMessage?: string;
}

/**
 * KYCFieldEditor - Editable field with confidence badge
 * 
 * Features:
 * - Shows OCR confidence level with color-coded badge
 * - Allows user to edit extracted values
 * - Shows "Manual Entry" badge when user clears OCR value
 * - Visual indicator when value differs from extracted
 */
export const KYCFieldEditor: React.FC<KYCFieldEditorProps> = ({
  label,
  fieldKey,
  field,
  value,
  onValueChange,
  editable = true,
  placeholder,
  inputType = "default",
  required = false,
  errorMessage,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Determine if value was modified from OCR extraction
  const isModified = field?.value && value !== field.value;
  const hasExtraction = field?.value && field.value.length > 0;
  const confidence = field?.confidence ?? 0;
  
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View style={styles.container}>
      {/* Label Row with Confidence Badge */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        
        {/* Confidence Badge */}
        {hasExtraction && (
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: `${getConfidenceColor(confidence)}20` },
            ]}
          >
            <View
              style={[
                styles.confidenceDot,
                { backgroundColor: getConfidenceColor(confidence) },
              ]}
            />
            <Text
              style={[
                styles.confidenceText,
                { color: getConfidenceColor(confidence) },
              ]}
            >
              {Math.round(confidence * 100)}% {getConfidenceLabel(confidence)}
            </Text>
          </View>
        )}
        
        {/* Manual Entry Badge (when no OCR data or user cleared it) */}
        {!hasExtraction && value.length > 0 && (
          <View style={styles.manualBadge}>
            <Ionicons name="pencil" size={12} color={Colors.textSecondary} />
            <Text style={styles.manualText}>Manual</Text>
          </View>
        )}
        
        {/* Modified Badge (when user changed OCR value) */}
        {isModified && (
          <View style={styles.modifiedBadge}>
            <Ionicons name="create-outline" size={12} color={Colors.primary} />
            <Text style={styles.modifiedText}>Edited</Text>
          </View>
        )}
      </View>
      
      {/* Input Field */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          errorMessage && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          value={value}
          onChangeText={onValueChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textSecondary}
          editable={editable}
          autoCapitalize="words"
          autoCorrect={false}
        />
        
        {/* Clear Button (when has value and editable) */}
        {value.length > 0 && editable && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onValueChange("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error Message */}
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
      
      {/* OCR Hint (when low confidence) */}
      {hasExtraction && confidence < 0.6 && (
        <Text style={styles.hintText}>
          ⚠️ Low confidence - please verify this value
        </Text>
      )}
    </View>
  );
};

/**
 * KYCExtractionForm - Complete form with all extracted fields
 */
interface KYCExtractionFormProps {
  /** Type of extraction (id or clearance) - use 'type' or 'documentType' */
  type?: "id" | "clearance";
  /** Alternative prop name for type */
  documentType?: "id" | "clearance";
  /** Form title */
  title?: string;
  /** Form subtitle */
  subtitle?: string;
  /** Extracted fields data */
  fields: Record<string, ExtractedFieldWithConfidence | undefined>;
  /** Current form values */
  values: Record<string, string>;
  /** Callback when any value changes - can use onValuesChange or onFieldChange */
  onValuesChange?: (values: Record<string, string>) => void;
  /** Alternative callback for single field change */
  onFieldChange?: (fieldName: string, value: string) => void;
  /** Whether extraction is loading */
  isLoading?: boolean;
  /** Whether form is in manual entry mode (no OCR) */
  isManualMode?: boolean;
  /** Error message if extraction failed */
  errorMessage?: string;
  /** Alternative error prop name */
  error?: string;
  /** Callback when proceed button is pressed */
  onProceed?: () => void;
  /** Text for proceed button */
  proceedButtonText?: string;
}

export const KYCExtractionForm: React.FC<KYCExtractionFormProps> = ({
  type: typeProp,
  documentType,
  title,
  subtitle,
  fields,
  values,
  onValuesChange,
  onFieldChange,
  isLoading = false,
  isManualMode = false,
  errorMessage,
  error,
  onProceed,
  proceedButtonText = "Continue",
}) => {
  // Support both type and documentType prop names
  const type = typeProp || documentType || "id";
  // Support both error prop names
  const errorMsg = errorMessage || error;
  
  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      if (onFieldChange) {
        onFieldChange(key, value);
      } else if (onValuesChange) {
        onValuesChange({ ...values, [key]: value });
      }
    },
    [values, onValuesChange, onFieldChange]
  );

  // Define fields based on type
  interface FieldConfig {
    key: string;
    label: string;
    required?: boolean;
    inputType?: "default" | "date";
    editable?: boolean;
  }

  const fieldConfigs: FieldConfig[] =
    type === "id"
      ? [
          { key: "full_name", label: "Full Name", required: true },
          { key: "id_number", label: "ID Number", required: true },
          { key: "birth_date", label: "Date of Birth", inputType: "date" },
          { key: "address", label: "Address" },
          { key: "sex", label: "Sex" },
        ]
      : [
          { key: "holder_name", label: "Holder Name", required: true },
          { key: "clearance_number", label: "Clearance Number", required: true },
          { key: "issue_date", label: "Issue Date", inputType: "date" },
          { key: "validity_date", label: "Valid Until", inputType: "date" },
          { key: "clearance_type", label: "Clearance Type", editable: false },
        ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Extracting data from document...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color={Colors.error} />
        <Text style={styles.errorTitle}>Extraction Failed</Text>
        <Text style={styles.errorDescription}>{errorMsg}</Text>
        <Text style={styles.errorHint}>Please fill in the fields manually below.</Text>
      </View>
    );
  }

  // Check if we're in manual mode (no extraction data)
  const isManualEntry = isManualMode || Object.keys(fields).length === 0;

  return (
    <View style={styles.formContainer}>
      {/* Header */}
      <View style={styles.formHeader}>
        <Ionicons
          name={type === "id" ? "card-outline" : "shield-checkmark-outline"}
          size={24}
          color={Colors.primary}
        />
        <View style={styles.formHeaderText}>
          <Text style={styles.formTitle}>
            {title || (type === "id" ? "ID Information" : "Clearance Information")}
          </Text>
          <Text style={styles.formSubtitle}>
            {subtitle || (isManualEntry
              ? "Please fill in the details manually"
              : "Review and edit extracted data if needed")}
          </Text>
        </View>
      </View>

      {/* Fields */}
      {fieldConfigs.map((config) => (
        <KYCFieldEditor
          key={config.key}
          label={config.label}
          fieldKey={config.key}
          field={fields[config.key]}
          value={values[config.key] || ""}
          onValueChange={(value) => handleFieldChange(config.key, value)}
          editable={config.editable !== false}
          required={config.required}
          inputType={config.inputType}
          placeholder={`Enter ${config.label.toLowerCase()}`}
        />
      ))}

      {/* Proceed Button */}
      {onProceed && (
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={onProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedButtonText}>{proceedButtonText}</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Field Editor Styles
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  required: {
    color: Colors.error,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  manualBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  manualText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.primary}15`,
    gap: 4,
  },
  modifiedText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.surface,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm + 2,
  },
  inputDisabled: {
    color: Colors.textSecondary,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: 4,
  },

  // Form Styles
  formContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  formHeaderText: {
    flex: 1,
  },
  formTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  formSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    fontWeight: "500",
  },
  loadingSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.body.medium,
    color: Colors.error,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  errorDescription: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  errorHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  proceedButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
});

export default KYCFieldEditor;
