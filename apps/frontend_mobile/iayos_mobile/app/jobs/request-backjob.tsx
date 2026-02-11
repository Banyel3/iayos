import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { useAuth } from "@/context/AuthContext";
import {
  BACKJOB_CONTRACT_POINTS,
  BACKJOB_TERMS_VERSION,
  BACKJOB_AGREEMENT_HEADER,
  BACKJOB_AGREEMENT_ACKNOWLEDGMENT,
} from "@/constants/backjobContract";

interface Evidence {
  uri: string;
  type: "image";
  name: string;
}

interface JobDetails {
  id: number;
  title: string;
  category: string;
  budget: number;
  completedAt?: string;
}

export default function RequestBackjobScreen() {
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const { isLoggedIn } = useAuth();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showContract, setShowContract] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(parseInt(jobId)));
      if (response.ok) {
        const data = await response.json();
        setJob({
          id: data.id || data.jobID,
          title: data.title,
          category: data.category?.name || data.category || "Unknown",
          budget: data.budget,
          completedAt: data.completedAt || data.completed_at,
        });
      } else {
        Alert.alert("Error", "Failed to load job details");
        safeGoBack(router, "/(tabs)/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      Alert.alert("Error", "Failed to load job details");
      safeGoBack(router, "/(tabs)/jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    if (evidence.length >= 5) {
      Alert.alert("Maximum Limit", "You can upload up to 5 evidence images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const newEvidence: Evidence = {
        uri: compressed.uri,
        type: "image",
        name: `backjob_evidence_${Date.now()}.jpg`,
      };

      setEvidence([...evidence, newEvidence]);
    }
  };

  const takePhoto = async () => {
    if (evidence.length >= 5) {
      Alert.alert("Maximum Limit", "You can upload up to 5 evidence images.");
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const newEvidence: Evidence = {
        uri: compressed.uri,
        type: "image",
        name: `backjob_evidence_${Date.now()}.jpg`,
      };

      setEvidence([...evidence, newEvidence]);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const addEvidence = () => {
    Alert.alert("Add Photo Evidence", "Choose how to add evidence", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validateForm = (): boolean => {
    if (!reason.trim() || reason.length < 10) {
      Alert.alert(
        "Validation Error",
        "Reason must be at least 10 characters long."
      );
      return false;
    }

    if (!description.trim() || description.length < 50) {
      Alert.alert(
        "Validation Error",
        "Description must be at least 50 characters long. Please provide detailed information about what needs to be redone."
      );
      return false;
    }

    if (evidence.length === 0) {
      Alert.alert(
        "Evidence Required",
        "Please add at least one photo showing the issue before submitting your request."
      );
      return false;
    }

    if (!termsAccepted) {
      Alert.alert(
        "Terms Required",
        "Please accept the backjob agreement terms before submitting your request."
      );
      return false;
    }

    return true;
  };

  const submitBackjobRequest = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Request Backjob",
      "Are you sure you want to request a backjob? The admin team will review your request within 1-3 business days.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);

            try {
              const formData = new FormData();
              formData.append("reason", reason);
              formData.append("description", description);
              formData.append("terms_accepted", "true");

              // Add evidence images
              evidence.forEach((item, index) => {
                formData.append("images", {
                  uri: item.uri,
                  type: "image/jpeg",
                  name: item.name,
                } as any);
              });

              const response = await apiRequest(
                ENDPOINTS.REQUEST_BACKJOB(parseInt(jobId)),
                {
                  method: "POST",
                  body: formData,
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  "Backjob Request Submitted",
                  data.message ||
                    "Your backjob request has been submitted successfully. Our team will review it within 1-3 business days.",
                  [
                    {
                      text: "OK",
                      onPress: () => safeGoBack(router, "/(tabs)/jobs"),
                    },
                  ]
                );
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.error || "Failed to submit backjob request."
                );
              }
            } catch (error) {
              console.error("Backjob submission error:", error);
              Alert.alert(
                "Error",
                "Failed to submit backjob request. Please try again later."
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="refresh-circle"
                size={48}
                color={Colors.warning}
              />
            </View>
            <Text style={styles.headerTitle}>Request Backjob</Text>
            <Text style={styles.headerSubtitle}>
              Request the worker/agency to redo or fix issues with the completed
              work
            </Text>
          </View>
        </View>

        {/* Job Info Card */}
        {job && (
          <View style={styles.jobCard}>
            <Text style={styles.jobCardLabel}>Related Job</Text>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>{job.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  ₱{job.budget?.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reason for Backjob <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionHint}>
            Brief summary of what needs to be redone (10-100 characters)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Leaky pipe was not properly fixed"
            value={reason}
            onChangeText={setReason}
            maxLength={100}
          />
          <Text style={styles.charCounter}>{reason.length} / 100</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Detailed Description <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionHint}>
            Explain what was done incorrectly and what you expect (50-1000
            characters)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe in detail what issues you found with the completed work. Be specific about what needs to be fixed or redone..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCounter}>{description.length} / 1000</Text>
        </View>

        {/* Evidence Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence *</Text>
          <Text style={styles.sectionHint}>
            Add at least 1 photo showing the issue (required, max 5 images)
          </Text>

          <View style={styles.evidenceGrid}>
            {evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.evidenceImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeEvidence(index)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {evidence.length < 5 && (
              <TouchableOpacity
                style={styles.addEvidenceButton}
                onPress={addEvidence}
              >
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={Colors.textSecondary}
                />
                <Text style={styles.addEvidenceText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Backjob Agreement Section */}
        <View style={styles.contractSection}>
          <TouchableOpacity
            style={styles.contractHeader}
            onPress={() => setShowContract(!showContract)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={Colors.warning}
            />
            <Text style={styles.contractTitle}>{BACKJOB_AGREEMENT_HEADER}</Text>
            <Ionicons
              name={showContract ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {showContract && (
            <View style={styles.contractContent}>
              <Text style={styles.contractAcknowledgment}>
                {BACKJOB_AGREEMENT_ACKNOWLEDGMENT}
              </Text>
              {BACKJOB_CONTRACT_POINTS.map((point, index) => (
                <View key={index} style={styles.contractPoint}>
                  <Text style={styles.contractBullet}>•</Text>
                  <Text style={styles.contractPointText}>{point}</Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => router.push("/legal/terms")}
                style={styles.viewFullTermsButton}
              >
                <Text style={styles.viewFullTermsLink}>
                  View Full Terms of Service →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Terms Acceptance Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
            >
              {termsAccepted && (
                <Ionicons name="checkmark" size={16} color={Colors.textLight} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I accept the backjob agreement terms
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              1. Submit your backjob request with evidence{"\n"}
              2. Our team will review it within 1-3 business days{"\n"}
              3. If approved, the worker/agency will be notified{"\n"}
              4. They will redo the work at no extra cost to you
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || !termsAccepted) && styles.submitButtonDisabled,
          ]}
          onPress={submitBackjobRequest}
          disabled={isSubmitting || !termsAccepted}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.warning}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  jobCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  jobMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  charCounter: {
    textAlign: "right",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  evidenceItem: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  addEvidenceButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
  },
  addEvidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: `${Colors.info}15`,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contractSection: {
    margin: 16,
    marginBottom: 20,
    backgroundColor: `${Colors.warning}10`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
    overflow: "hidden",
  },
  contractHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  contractTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contractContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: `${Colors.warning}20`,
  },
  contractAcknowledgment: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontWeight: "500",
  },
  contractPoint: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 4,
  },
  contractBullet: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 8,
    fontWeight: "600",
  },
  contractPointText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  viewFullTermsButton: {
    marginTop: 12,
    marginBottom: 4,
  },
  viewFullTermsLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: `${Colors.warning}20`,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
    marginHorizontal: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
