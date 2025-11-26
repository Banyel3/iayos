/**
 * Job Request Form Screen
 *
 * Features:
 * - Create job request for specific worker or agency
 * - Form fields: title, description, category, budget, location, etc.
 * - Material needs checklist
 * - Urgency level selection
 * - Preferred start date picker
 * - Payment method selection (Wallet/GCash)
 * - Validation and error handling
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchJson, ENDPOINTS } from "@/lib/api/config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useBarangays } from "@/lib/hooks/useLocations";

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface WorkerMaterial {
  id: number;
  name: string;
  description?: string;
  price: number;
  priceUnit: string;
  inStock: boolean;
}

interface CreateJobRequest {
  title: string;
  description: string;
  category_id: number;
  budget: number;
  location: string;
  expected_duration?: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  payment_method: "WALLET" | "GCASH";
  worker_id?: number;
  agency_id?: number;
}

export default function CreateJobScreen() {
  const { workerId, agencyId } = useLocalSearchParams<{
    workerId?: string;
    agencyId?: string;
  }>();
  const router = useRouter();

  // Debug logging
  console.log(
    "[CreateJob] Screen loaded - workerId:",
    workerId,
    "agencyId:",
    agencyId
  );

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [budget, setBudget] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [street, setStreet] = useState("");
  const [duration, setDuration] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  // Agency jobs only use Wallet payment (no GCash option)
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "GCASH">(
    "WALLET"
  );

  // Fetch worker's materials if workerId is provided
  const { data: workerMaterialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ["worker-materials", workerId],
    queryFn: async () => {
      if (!workerId) return [];
      const response = await fetchJson<{
        success: boolean;
        worker: { materials?: WorkerMaterial[] };
      }>(ENDPOINTS.WORKER_DETAIL(Number(workerId)));
      return response.worker?.materials || [];
    },
    enabled: !!workerId,
  });

  const workerMaterials = workerMaterialsData || [];

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchJson<{ categories: Category[] }>(
        ENDPOINTS.GET_CATEGORIES
      );
      return response.categories || [];
    },
  });

  const categories = categoriesData || [];

  // Fetch barangays for Zamboanga City (cityID = 1)
  const {
    data: barangaysData,
    isLoading: barangaysLoading,
    error: barangaysError,
  } = useBarangays(1);
  const barangays = barangaysData || [];

  // Debug logging
  console.log("[CreateJob] Barangays:", {
    count: barangays.length,
    loading: barangaysLoading,
    error: barangaysError,
    firstThree: barangays.slice(0, 3).map((b) => b.name),
  });

  console.log(
    "[CreateJob] Categories:",
    categories,
    "Type:",
    typeof categories,
    "IsArray:",
    Array.isArray(categories)
  );

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: CreateJobRequest) => {
      const response = await fetchJson<{
        success: boolean;
        job_posting_id: number;
        message: string;
        requires_payment?: boolean;
        payment_method?: string;
        escrow_amount?: number;
        commission_fee?: number;
        downpayment_amount?: number;
        remaining_payment?: number;
        invoice_url?: string;
        invoice_id?: string;
        transaction_id?: number;
        new_wallet_balance?: number;
      }>(ENDPOINTS.CREATE_JOB, {
        method: "POST",
        body: JSON.stringify(jobData),
      });
      return response;
    },
    onSuccess: (data) => {
      // Validate job_posting_id exists
      if (!data.job_posting_id || isNaN(Number(data.job_posting_id))) {
        console.error("Invalid job_posting_id in response:", data);
        Alert.alert(
          "Success!",
          "Job created, but there was an issue retrieving the details.",
          [
            {
              text: "Go to Home",
              onPress: () => router.push("/"),
            },
          ]
        );
        return;
      }

      // Check if payment is required (GCash payment)
      if (data.requires_payment && data.invoice_url) {
        // Navigate to GCash payment screen via WebView
        router.push({
          pathname: "/payments/gcash",
          params: {
            invoiceUrl: data.invoice_url,
            jobId: data.job_posting_id.toString(),
            amount:
              data.downpayment_amount?.toString() ||
              data.total_amount?.toString() ||
              "0", // Total amount to be paid now (escrow + platform fee)
            budget: budget || String(jobData.budget), // full job budget for breakdown
            title: title || "Job Request", // Pass title for better UX
          },
        } as any);
      } else {
        // Wallet payment completed or no payment needed
        Alert.alert(
          "Success!",
          data.message ||
            "Job request created successfully. The worker/agency will be notified.",
          [
            {
              text: "View Job",
              onPress: () => router.push(`/jobs/${data.job_posting_id}` as any),
            },
            {
              text: "Back to Home",
              onPress: () => router.push("/"),
            },
          ]
        );
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create job request";
      Alert.alert("Error", errorMessage);
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a job title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a job description");
      return;
    }
    if (!categoryId) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert("Error", "Please enter a valid budget");
      return;
    }
    if (!barangay.trim()) {
      Alert.alert("Error", "Please enter a barangay");
      return;
    }
    if (!street.trim()) {
      Alert.alert("Error", "Please enter a street address");
      return;
    }

    const jobData: CreateJobRequest = {
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId,
      budget: parseFloat(budget),
      location: `${street.trim()}, ${barangay.trim()}`,
      expected_duration: duration.trim() || undefined,
      urgency_level: urgency,
      preferred_start_date: startDate
        ? startDate.toISOString().split("T")[0]
        : undefined,
      payment_method: paymentMethod,
    };

    // Add worker or agency ID if provided
    if (workerId) {
      (jobData as any).worker_id = parseInt(workerId);
    }
    if (agencyId) {
      (jobData as any).agency_id = parseInt(agencyId);
    }

    createJobMutation.mutate(jobData);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: workerId
            ? "Hire Worker"
            : agencyId
              ? "Hire Agency"
              : "Create Job Request",
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {workerId
              ? "Hire Worker"
              : agencyId
                ? "Hire Agency"
                : "Create Job Request"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Job Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Job Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Fix leaking pipe in bathroom"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={Colors.textHint}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the job in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.textHint}
              />
              <Text style={styles.helperText}>
                {description.length}/500 characters
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              {categoriesLoading ? (
                <View style={styles.loadingCategories}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          categoryId === category.id &&
                            styles.categoryChipActive,
                        ]}
                        onPress={() => setCategoryId(category.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            categoryId === category.id &&
                              styles.categoryChipTextActive,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              )}
            </View>

            {/* Budget */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Budget (₱) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.budgetInput}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={styles.budgetTextInput}
                  placeholder="0.00"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textHint}
                />
              </View>
              <Text style={styles.helperText}>
                50% downpayment (₱
                {budget ? (parseFloat(budget) * 0.5).toFixed(2) : "0.00"}) will
                be held in escrow
              </Text>
            </View>

            {/* Barangay */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Barangay <Text style={styles.required}>*</Text>
              </Text>
              {barangaysLoading ? (
                <View style={styles.pickerContainer}>
                  <View style={[styles.picker, styles.pickerLoading]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.pickerLoadingText}>
                      Loading barangays...
                    </Text>
                  </View>
                </View>
              ) : barangaysError ? (
                <View style={styles.pickerContainer}>
                  <View style={[styles.picker, styles.pickerError]}>
                    <Text style={styles.pickerErrorText}>
                      ⚠️ Failed to load
                    </Text>
                  </View>
                </View>
              ) : barangays.length === 0 ? (
                <View style={styles.pickerContainer}>
                  <View style={[styles.picker, styles.pickerError]}>
                    <Text style={styles.pickerErrorText}>
                      No barangays available
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.barangayButton}
                  onPress={() => setBarangayModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      barangay
                        ? styles.barangayButtonText
                        : styles.barangayButtonPlaceholder
                    }
                  >
                    {barangay || "Select a barangay"}
                  </Text>
                  <Text style={styles.barangayButtonIcon}>▼</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helperText}>
                {barangaysLoading
                  ? "Loading..."
                  : barangaysError
                    ? `Error: ${barangaysError.message || "Failed to load"}`
                    : barangays.length === 0
                      ? "No barangays found"
                      : `${barangays.length} barangays available`}
              </Text>
            </View>

            {/* Barangay Selection Modal */}
            <Modal
              visible={barangayModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setBarangayModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Barangay</Text>
                    <TouchableOpacity
                      onPress={() => setBarangayModalVisible(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={barangays}
                    keyExtractor={(item) => item.barangayID.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.barangayItem,
                          barangay === item.name && styles.barangayItemSelected,
                        ]}
                        onPress={() => {
                          setBarangay(item.name);
                          setBarangayModalVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.barangayItemText,
                            barangay === item.name &&
                              styles.barangayItemTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {barangay === item.name && (
                          <Text style={styles.barangayItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    style={styles.barangayList}
                  />
                </View>
              </View>
            </Modal>

            {/* Street Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Street Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123 Bonifacio Street"
                value={street}
                onChangeText={setStreet}
                placeholderTextColor={Colors.textHint}
              />
              <Text style={styles.helperText}>
                Provide the specific street address or landmark
              </Text>
            </View>

            {/* Expected Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Expected Duration (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2-3 hours, 1 day"
                value={duration}
                onChangeText={setDuration}
                placeholderTextColor={Colors.textHint}
              />
            </View>

            {/* Urgency Level */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Urgency Level</Text>
              <View style={styles.urgencyRow}>
                {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.urgencyButton,
                      urgency === level && styles.urgencyButtonActive,
                      urgency === level && level === "LOW" && styles.urgencyLow,
                      urgency === level &&
                        level === "MEDIUM" &&
                        styles.urgencyMedium,
                      urgency === level &&
                        level === "HIGH" &&
                        styles.urgencyHigh,
                    ]}
                    onPress={() => setUrgency(level)}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        urgency === level && styles.urgencyTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferred Start Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferred Start Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={Colors.textSecondary}
                />
                <Text style={styles.dateButtonText}>
                  {startDate ? startDate.toLocaleDateString() : "Select a date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            {/* Materials Needed */}
            {workerId && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Materials Needed from Worker (Optional)
                </Text>
                {materialsLoading ? (
                  <View style={styles.loadingCategories}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading materials...</Text>
                  </View>
                ) : workerMaterials.length > 0 ? (
                  <View style={styles.materialsContainer}>
                    {workerMaterials.map((material) => (
                      <TouchableOpacity
                        key={material.id}
                        style={[
                          styles.materialCard,
                          selectedMaterials.includes(material.id) &&
                            styles.materialCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedMaterials((prev) =>
                            prev.includes(material.id)
                              ? prev.filter((id) => id !== material.id)
                              : [...prev, material.id]
                          );
                        }}
                      >
                        <View style={styles.materialCardContent}>
                          <View style={styles.materialInfo}>
                            <Text style={styles.materialName}>
                              {material.name}
                            </Text>
                            {material.description && (
                              <Text
                                style={styles.materialDesc}
                                numberOfLines={1}
                              >
                                {material.description}
                              </Text>
                            )}
                            <Text style={styles.materialPrice}>
                              ₱{material.price.toLocaleString()} /{" "}
                              {material.priceUnit}
                            </Text>
                          </View>
                          <View style={styles.materialCheckbox}>
                            {selectedMaterials.includes(material.id) && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={Colors.white}
                              />
                            )}
                          </View>
                        </View>
                        {!material.inStock && (
                          <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>
                              Out of Stock
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    This worker has no materials listed
                  </Text>
                )}
              </View>
            )}

            {/* Payment Method */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Method</Text>
              {agencyId ? (
                // Agency jobs: Wallet only (no GCash option)
                <View style={styles.infoBox}>
                  <Ionicons
                    name="wallet"
                    size={24}
                    color={Colors.primary}
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Wallet Payment Only</Text>
                    <Text style={styles.infoText}>
                      Agency jobs use Wallet payment method. The agency manages payment distribution to their employees.
                    </Text>
                  </View>
                </View>
              ) : (
                // Worker jobs: Wallet or GCash
                <View style={styles.paymentRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      paymentMethod === "WALLET" && styles.paymentButtonActive,
                    ]}
                    onPress={() => setPaymentMethod("WALLET")}
                  >
                    <Ionicons
                      name="wallet"
                      size={24}
                      color={
                        paymentMethod === "WALLET"
                          ? Colors.primary
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.paymentText,
                        paymentMethod === "WALLET" && styles.paymentTextActive,
                      ]}
                    >
                      Wallet
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      paymentMethod === "GCASH" && styles.paymentButtonActive,
                    ]}
                    onPress={() => setPaymentMethod("GCASH")}
                  >
                    <Ionicons
                      name="card"
                      size={24}
                      color={
                        paymentMethod === "GCASH"
                          ? Colors.primary
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.paymentText,
                        paymentMethod === "GCASH" && styles.paymentTextActive,
                      ]}
                    >
                      GCash
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={24}
                color={Colors.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Payment Process</Text>
                <Text style={styles.infoText}>
                  • 50% downpayment will be held in escrow{"\n"}• Worker/Agency
                  completes the job{"\n"}• You approve completion{"\n"}•
                  Remaining 50% is released
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              createJobMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createJobMutation.isPending}
          >
            {createJobMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Job Request</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 4,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  loadingCategories: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  budgetInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginRight: 4,
  },
  budgetTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
  },
  urgencyButtonActive: {
    backgroundColor: Colors.primary,
  },
  urgencyLow: {
    backgroundColor: Colors.success,
  },
  urgencyMedium: {
    backgroundColor: Colors.warning,
  },
  urgencyHigh: {
    backgroundColor: Colors.error,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  urgencyTextActive: {
    color: Colors.white,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  materialsContainer: {
    gap: 8,
    marginTop: 8,
  },
  materialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  materialCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  materialDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 4,
  },
  materialCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockBadge: {
    backgroundColor: Colors.error + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  outOfStockText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  paymentButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  paymentTextActive: {
    color: Colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    gap: 8,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pickerLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pickerError: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pickerErrorText: {
    fontSize: 14,
    color: Colors.error,
  },
  barangayButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barangayButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  barangayButtonPlaceholder: {
    fontSize: 16,
    color: Colors.textHint,
  },
  barangayButtonIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: "300",
  },
  barangayList: {
    paddingHorizontal: 20,
  },
  barangayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  barangayItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  barangayItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  barangayItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  barangayItemCheck: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: "bold",
  },
});
