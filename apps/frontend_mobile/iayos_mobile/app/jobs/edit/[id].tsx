/**
 * Edit Job Screen
 *
 * Features:
 * - Edit existing job details (title, description, budget, etc.)
 * - Budget change impact card with wallet adjustment preview
 * - DOLE minimum rate validation per category
 * - Block budget changes if pending applications exist
 * - Edit reason tracking (optional)
 * - All edits logged in JobLog with metadata
 */

import React, { useState, useEffect, useCallback } from "react";
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
  SafeAreaView,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson, ENDPOINTS, apiRequest } from "@/lib/api/config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useBarangays } from "@/lib/hooks/useLocations";
import { useWallet } from "@/lib/hooks/useWallet";

interface Category {
  id: number;
  name: string;
  icon: string;
  minimum_rate: number;
}

interface JobDetail {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string };
  budget: number;
  location: string;
  expected_duration?: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  materials_needed?: string[];
  job_scope?: "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION";
  skill_level_required?: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  work_environment?: "INDOOR" | "OUTDOOR" | "BOTH";
  status: string;
  has_pending_applications: boolean;
  pending_applications_count: number;
}

interface UpdateJobRequest {
  title?: string;
  description?: string;
  category_id?: number;
  budget?: number;
  location?: string;
  expected_duration?: string;
  urgency_level?: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  materials_needed?: string[];
  job_scope?: "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION";
  skill_level_required?: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  work_environment?: "INDOOR" | "OUTDOOR" | "BOTH";
  edit_reason?: string;
}

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const jobId = parseInt(id);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [budget, setBudget] = useState("");
  const [originalBudget, setOriginalBudget] = useState(0);
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [duration, setDuration] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [materialInput, setMaterialInput] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [editReason, setEditReason] = useState("");

  // Universal job fields
  const [skillLevel, setSkillLevel] = useState<
    "ENTRY" | "INTERMEDIATE" | "EXPERT"
  >("INTERMEDIATE");
  const [jobScope, setJobScope] = useState<
    "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION"
  >("MODERATE_PROJECT");
  const [workEnvironment, setWorkEnvironment] = useState<
    "INDOOR" | "OUTDOOR" | "BOTH"
  >("INDOOR");

  const [hasPendingApplications, setHasPendingApplications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [budgetChanged, setBudgetChanged] = useState(false);

  // Wallet data for budget change validation
  const { data: walletData } = useWallet();
  const walletBalance = walletData?.balance ?? 0;

  // Fetch job details
  const {
    data: jobData,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["jobs", id, "edit"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(jobId));
      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }
      const result = (await response.json()) as any;
      const data = result.data || result;
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        location: data.location,
        expected_duration: data.expected_duration,
        urgency_level: data.urgency_level || "MEDIUM",
        preferred_start_date: data.preferred_start_date,
        materials_needed: data.materials_needed || [],
        // Use model-consistent defaults if backend returns null
        job_scope: data.job_scope || "MINOR_REPAIR",
        skill_level_required: data.skill_level_required || "INTERMEDIATE",
        work_environment: data.work_environment || "INDOOR",
        status: data.status,
        has_pending_applications: data.has_pending_applications || false,
        pending_applications_count: data.pending_applications_count || 0,
      } as JobDetail;
    },
  });

  // Populate form when job data loads
  useEffect(() => {
    if (jobData) {
      setTitle(jobData.title);
      setDescription(jobData.description);
      setCategoryId(jobData.category.id);
      setBudget(jobData.budget.toString());
      setOriginalBudget(jobData.budget);

      // Parse location
      if (jobData.location) {
        const parts = jobData.location.split(", ");
        if (parts.length >= 2) {
          setStreet(parts[0]);
          setBarangay(parts.slice(1).join(", "));
        } else {
          setStreet(jobData.location);
        }
      }

      setDuration(jobData.expected_duration || "");
      setUrgency(jobData.urgency_level);

      if (jobData.preferred_start_date) {
        setStartDate(new Date(jobData.preferred_start_date));
      }

      setMaterials(jobData.materials_needed || []);
      // Use model-consistent defaults
      setJobScope(jobData.job_scope || "MINOR_REPAIR");
      setSkillLevel(jobData.skill_level_required || "INTERMEDIATE");
      setWorkEnvironment(jobData.work_environment || "INDOOR");
      setHasPendingApplications(jobData.has_pending_applications);
      setPendingCount(jobData.pending_applications_count);
    }
  }, [jobData]);

  // Track budget changes
  useEffect(() => {
    const currentBudget = parseFloat(budget) || 0;
    setBudgetChanged(currentBudget !== originalBudget);
  }, [budget, originalBudget]);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchJson<{ categories: Category[] }>(
        ENDPOINTS.GET_CATEGORIES,
      );
      return response.categories || [];
    },
  });

  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Fetch barangays for Zamboanga City (cityID = 1)
  const { data: barangaysData } = useBarangays(1);
  const barangays = barangaysData || [];

  // Calculate budget change impact
  const budgetDelta = (parseFloat(budget) || 0) - originalBudget;
  const isIncreasingBudget = budgetDelta > 0;
  const additionalDownpayment = isIncreasingBudget
    ? (budgetDelta * 0.5 * 1.05).toFixed(2)
    : "0.00";
  const refundAmount =
    budgetDelta < 0 ? Math.abs(budgetDelta * 0.5).toFixed(2) : "0.00";

  const hasInsufficientBalance =
    isIncreasingBudget && parseFloat(additionalDownpayment) > walletBalance;

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (updateData: UpdateJobRequest) => {
      const response = await apiRequest(ENDPOINTS.UPDATE_JOB(jobId), {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData.error || errorData.message || "Failed to update job",
        );
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      Alert.alert("Success", data.message || "Job updated successfully!", [
        {
          text: "View Job",
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["jobs", id] });
            router.replace(`/jobs/${id}` as any);
          },
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update job");
    },
  });

  const handleAddMaterial = () => {
    const trimmed = materialInput.trim();
    if (trimmed && !materials.includes(trimmed)) {
      setMaterials([...materials, trimmed]);
      setMaterialInput("");
      setIsFormDirty(true);
    }
  };

  const handleRemoveMaterial = (material: string) => {
    setMaterials(materials.filter((m) => m !== material));
    setIsFormDirty(true);
  };

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

    // Validate against minimum rate
    if (selectedCategory && selectedCategory.minimum_rate > 0) {
      const budgetValue = parseFloat(budget);
      if (budgetValue < selectedCategory.minimum_rate) {
        Alert.alert(
          "Budget Too Low",
          `The minimum budget for ${selectedCategory.name} is ₱${selectedCategory.minimum_rate.toFixed(2)} (DOLE minimum rate). Please enter a higher amount.`,
        );
        return;
      }
    }

    // Block budget changes with pending applications
    if (budgetChanged && hasPendingApplications) {
      Alert.alert(
        "Budget Change Blocked",
        `You have ${pendingCount} pending application(s). Budget changes are not allowed while applications are pending.\n\nYou can still update other job details like title, description, or materials.`,
      );
      return;
    }

    // Check wallet balance for budget increase
    if (hasInsufficientBalance) {
      Alert.alert(
        "Insufficient Wallet Balance",
        `You need ₱${additionalDownpayment} for the additional 50% downpayment + fee, but your wallet only has ₱${walletBalance.toFixed(2)}.\n\nWould you like to deposit funds first?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Deposit Funds",
            onPress: () =>
              router.push({
                pathname: "/payments/deposit",
                params: {
                  amount: Math.ceil(
                    parseFloat(additionalDownpayment) - walletBalance,
                  ).toString(),
                },
              } as any),
          },
        ],
      );
      return;
    }

    // Build update payload (only changed fields)
    const updateData: UpdateJobRequest = {};

    if (title.trim() !== jobData?.title) {
      updateData.title = title.trim();
    }
    if (description.trim() !== jobData?.description) {
      updateData.description = description.trim();
    }
    if (categoryId !== jobData?.category.id) {
      updateData.category_id = categoryId;
    }
    if (parseFloat(budget) !== jobData?.budget) {
      updateData.budget = parseFloat(budget);
    }

    const newLocation = `${street.trim()}, ${barangay.trim()}`;
    if (newLocation !== jobData?.location) {
      updateData.location = newLocation;
    }

    if (duration.trim() !== (jobData?.expected_duration || "")) {
      updateData.expected_duration = duration.trim() || undefined;
    }
    if (urgency !== jobData?.urgency_level) {
      updateData.urgency_level = urgency;
    }

    const newStartDate = startDate
      ? startDate.toISOString().split("T")[0]
      : undefined;
    if (newStartDate !== jobData?.preferred_start_date) {
      updateData.preferred_start_date = newStartDate;
    }

    // Compare materials arrays
    const materialsChanged =
      JSON.stringify(materials.sort()) !==
      JSON.stringify((jobData?.materials_needed || []).sort());
    if (materialsChanged) {
      updateData.materials_needed = materials;
    }

    if (jobScope !== jobData?.job_scope) {
      updateData.job_scope = jobScope;
    }
    if (skillLevel !== jobData?.skill_level_required) {
      updateData.skill_level_required = skillLevel;
    }
    if (workEnvironment !== jobData?.work_environment) {
      updateData.work_environment = workEnvironment;
    }

    if (editReason.trim()) {
      updateData.edit_reason = editReason.trim();
    }

    // Check if anything changed
    if (Object.keys(updateData).length === 0) {
      Alert.alert("No Changes", "No changes were made to the job.");
      return;
    }

    // Confirm budget change
    if (updateData.budget !== undefined) {
      const changeText = isIncreasingBudget
        ? `₱${additionalDownpayment} will be reserved from your wallet.`
        : `₱${refundAmount} will be refunded to your wallet.`;

      Alert.alert(
        "Confirm Budget Change",
        `Budget changing from ₱${originalBudget.toLocaleString()} to ₱${parseFloat(budget).toLocaleString()}.\n\n${changeText}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: () => updateJobMutation.mutate(updateData),
          },
        ],
      );
    } else {
      updateJobMutation.mutate(updateData);
    }
  };

  if (jobLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (jobError || !jobData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load job details</Text>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonErrorText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if job is editable
  if (jobData.status !== "ACTIVE") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color={Colors.warning} />
          <Text style={styles.errorText}>
            This job cannot be edited because it is{" "}
            {jobData.status.toLowerCase()}.
          </Text>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonErrorText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
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
          <Text style={styles.headerTitle}>Edit Job</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Pending Applications Warning */}
            {hasPendingApplications && (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons
                    name="warning-outline"
                    size={20}
                    color={Colors.warning}
                  />
                  <Text style={styles.warningTitle}>
                    {pendingCount} Pending Application
                    {pendingCount > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={styles.warningText}>
                  Budget changes are blocked while applications are pending.
                  Other details can still be edited.
                </Text>
              </View>
            )}

            {/* Job Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Job Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Fix leaking pipe in bathroom"
                  value={title}
                  onChangeText={(t) => {
                    setTitle(t);
                    setIsFormDirty(true);
                  }}
                  placeholderTextColor={Colors.textHint}
                  maxLength={100}
                />
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the job in detail..."
                  value={description}
                  onChangeText={(d) => {
                    setDescription(d);
                    setIsFormDirty(true);
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={Colors.textHint}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text
                    style={
                      selectedCategory
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {selectedCategory?.name || "Select a category"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
                {selectedCategory && selectedCategory.minimum_rate > 0 && (
                  <Text style={styles.minimumRateHint}>
                    💼 DOLE minimum rate: ₱
                    {selectedCategory.minimum_rate.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Budget Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Budget</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget Amount (₱) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasPendingApplications &&
                    budgetChanged &&
                    styles.inputDisabled,
                  ]}
                  placeholder="Enter budget"
                  value={budget}
                  onChangeText={(b) => {
                    setBudget(b);
                    setIsFormDirty(true);
                  }}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textHint}
                />
                {hasPendingApplications && (
                  <Text style={styles.disabledHint}>
                    Budget cannot be changed with pending applications
                  </Text>
                )}
              </View>

              {/* Budget Change Impact Card */}
              {budgetChanged && !hasPendingApplications && (
                <View
                  style={[
                    styles.budgetImpactCard,
                    isIncreasingBudget
                      ? styles.budgetImpactIncrease
                      : styles.budgetImpactDecrease,
                  ]}
                >
                  <View style={styles.budgetImpactHeader}>
                    <Ionicons
                      name={
                        isIncreasingBudget ? "trending-up" : "trending-down"
                      }
                      size={20}
                      color={
                        isIncreasingBudget ? Colors.warning : Colors.success
                      }
                    />
                    <Text style={styles.budgetImpactTitle}>
                      Budget {isIncreasingBudget ? "Increase" : "Decrease"}
                    </Text>
                  </View>
                  <View style={styles.budgetImpactRow}>
                    <Text style={styles.budgetImpactLabel}>Original:</Text>
                    <Text style={styles.budgetImpactValue}>
                      ₱{originalBudget.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.budgetImpactRow}>
                    <Text style={styles.budgetImpactLabel}>New:</Text>
                    <Text style={styles.budgetImpactValue}>
                      ₱{parseFloat(budget).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.budgetImpactDivider} />
                  <View style={styles.budgetImpactRow}>
                    <Text style={styles.budgetImpactLabel}>
                      {isIncreasingBudget
                        ? "Additional Reserve:"
                        : "Refund to Wallet:"}
                    </Text>
                    <Text
                      style={[
                        styles.budgetImpactAmount,
                        {
                          color: isIncreasingBudget
                            ? Colors.warning
                            : Colors.success,
                        },
                      ]}
                    >
                      {isIncreasingBudget ? "-" : "+"}₱
                      {isIncreasingBudget
                        ? additionalDownpayment
                        : refundAmount}
                    </Text>
                  </View>
                  {isIncreasingBudget && (
                    <View style={styles.budgetImpactRow}>
                      <Text style={styles.budgetImpactLabel}>
                        Wallet Balance:
                      </Text>
                      <Text
                        style={[
                          styles.budgetImpactValue,
                          hasInsufficientBalance && { color: Colors.error },
                        ]}
                      >
                        ₱{walletBalance.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {hasInsufficientBalance && (
                    <Text style={styles.insufficientWarning}>
                      ⚠️ Insufficient balance. Deposit funds to continue.
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Location</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street name, building, unit..."
                  value={street}
                  onChangeText={(s) => {
                    setStreet(s);
                    setIsFormDirty(true);
                  }}
                  placeholderTextColor={Colors.textHint}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Barangay *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowBarangayModal(true)}
                >
                  <Text
                    style={
                      barangay
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {barangay || "Select a barangay"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏱️ Timeline</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expected Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2-3 hours, 1 day"
                  value={duration}
                  onChangeText={(d) => {
                    setDuration(d);
                    setIsFormDirty(true);
                  }}
                  placeholderTextColor={Colors.textHint}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Start Date</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={
                      startDate
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {startDate
                      ? startDate.toLocaleDateString()
                      : "Select a date (optional)"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Urgency Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyRow}>
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.urgencyButton,
                        urgency === level && styles.urgencyButtonActive,
                        level === "LOW" && styles.urgencyLow,
                        level === "MEDIUM" && styles.urgencyMedium,
                        level === "HIGH" && styles.urgencyHigh,
                        urgency === level &&
                        level === "LOW" &&
                        styles.urgencyLowActive,
                        urgency === level &&
                        level === "MEDIUM" &&
                        styles.urgencyMediumActive,
                        urgency === level &&
                        level === "HIGH" &&
                        styles.urgencyHighActive,
                      ]}
                      onPress={() => {
                        setUrgency(level);
                        setIsFormDirty(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          urgency === level && styles.urgencyTextActive,
                        ]}
                      >
                        {level === "LOW"
                          ? "🟢 Low"
                          : level === "MEDIUM"
                            ? "🟡 Medium"
                            : "🔴 High"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Skill Level Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Skill Level Required</Text>
              <View style={styles.urgencyRow}>
                {(["ENTRY", "INTERMEDIATE", "EXPERT"] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.urgencyButton,
                      skillLevel === level && styles.urgencyButtonActive,
                    ]}
                    onPress={() => {
                      setSkillLevel(level);
                      setIsFormDirty(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        skillLevel === level && styles.urgencyTextActive,
                      ]}
                    >
                      {level === "ENTRY"
                        ? "🌱 Entry"
                        : level === "INTERMEDIATE"
                          ? "⭐ Intermediate"
                          : "👑 Expert"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Job Scope Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Job Scope</Text>
              <View style={styles.urgencyRow}>
                {(
                  [
                    "MINOR_REPAIR",
                    "MODERATE_PROJECT",
                    "MAJOR_RENOVATION",
                  ] as const
                ).map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[
                      styles.urgencyButton,
                      jobScope === scope && styles.urgencyButtonActive,
                    ]}
                    onPress={() => {
                      setJobScope(scope);
                      setIsFormDirty(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        jobScope === scope && styles.urgencyTextActive,
                      ]}
                    >
                      {scope === "MINOR_REPAIR"
                        ? "🔧 Minor"
                        : scope === "MODERATE_PROJECT"
                          ? "🛠️ Moderate"
                          : "🏗️ Major"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Work Environment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏠 Work Environment</Text>
              <View style={styles.urgencyRow}>
                {(["INDOOR", "OUTDOOR", "BOTH"] as const).map((env) => (
                  <TouchableOpacity
                    key={env}
                    style={[
                      styles.urgencyButton,
                      workEnvironment === env && styles.urgencyButtonActive,
                    ]}
                    onPress={() => {
                      setWorkEnvironment(env);
                      setIsFormDirty(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        workEnvironment === env && styles.urgencyTextActive,
                      ]}
                    >
                      {env === "INDOOR"
                        ? "🏠 Indoor"
                        : env === "OUTDOOR"
                          ? "🌳 Outdoor"
                          : "🔄 Both"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Materials Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧰 Materials Needed</Text>
              <View style={styles.materialInputRow}>
                <TextInput
                  style={[styles.input, styles.materialInput]}
                  placeholder="Add a material..."
                  value={materialInput}
                  onChangeText={setMaterialInput}
                  onSubmitEditing={handleAddMaterial}
                  placeholderTextColor={Colors.textHint}
                />
                <TouchableOpacity
                  style={styles.addMaterialButton}
                  onPress={handleAddMaterial}
                >
                  <Ionicons name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
              {materials.length > 0 && (
                <View style={styles.materialsContainer}>
                  {materials.map((material, index) => (
                    <View key={index} style={styles.materialChip}>
                      <Text style={styles.materialChipText}>{material}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveMaterial(material)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Edit Reason Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Edit Reason (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why are you editing this job? (e.g., added more details, changed scope)"
                value={editReason}
                onChangeText={setEditReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={Colors.textHint}
                maxLength={200}
              />
              <Text style={styles.charCount}>{editReason.length}/200</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (updateJobMutation.isPending || hasInsufficientBalance) &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={updateJobMutation.isPending || hasInsufficientBalance}
            >
              {updateJobMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    categoryId === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryModal(false);
                    setIsFormDirty(true);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.minimum_rate > 0 && (
                    <Text style={styles.modalItemSubtext}>
                      Min: ₱{item.minimum_rate.toLocaleString()}
                    </Text>
                  )}
                  {categoryId === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Barangay Modal */}
      <Modal
        visible={showBarangayModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBarangayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={barangays}
              keyExtractor={(item) => item.barangayID.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    barangay === item.name && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setBarangay(item.name);
                    setShowBarangayModal(false);
                    setIsFormDirty(true);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {barangay === item.name && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              setIsFormDirty(true);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    textAlign: "center",
  },
  backButtonError: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonErrorText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semiBold as any,
  },
  warningCard: {
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  warningTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.warning,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.textHint,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
    textAlign: "right",
    marginTop: 2,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: Typography.fontSize.md,
    color: Colors.textHint,
  },
  minimumRateHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  disabledHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  budgetImpactCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  budgetImpactIncrease: {
    backgroundColor: Colors.warning + "15",
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  budgetImpactDecrease: {
    backgroundColor: Colors.success + "15",
    borderWidth: 1,
    borderColor: Colors.success,
  },
  budgetImpactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  budgetImpactTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  budgetImpactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  budgetImpactLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  budgetImpactValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
  },
  budgetImpactDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  budgetImpactAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as any,
  },
  insufficientWarning: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  urgencyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  urgencyButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  urgencyLow: {},
  urgencyMedium: {},
  urgencyHigh: {},
  urgencyLowActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + "10",
  },
  urgencyMediumActive: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + "10",
  },
  urgencyHighActive: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + "10",
  },
  urgencyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  urgencyTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  materialInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  materialInput: {
    flex: 1,
  },
  addMaterialButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  materialsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  materialChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  materialChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textHint,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemSelected: {
    backgroundColor: Colors.primary + "10",
  },
  modalItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  modalItemSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
});
