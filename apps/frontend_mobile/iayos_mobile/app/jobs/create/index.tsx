/**
 * Job Request Form Screen
 *
 * Features:
 * - Create job request for specific worker or agency
 * - Form fields: title, description, category, budget, location, etc.
 * - Material needs checklist
 * - Urgency level selection
 * - Preferred start date picker
 * - Wallet payment only (deposits via QR PH - any bank/e-wallet)
 * - AI-powered price suggestion based on job details
 * - Validation and error handling
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
  StatusBar,
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
import { usePricePrediction } from "@/lib/hooks/usePricePrediction";
import PriceSuggestionCard from "@/components/PriceSuggestionCard";

interface Category {
  id: number;
  name: string;
  icon: string;
  minimum_rate: number;
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
  budget?: number; // Optional for daily payment model
  location: string;
  expected_duration?: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  downpayment_method: "WALLET" | "GCASH"; // Payment method for job escrow
  worker_id?: number;
  agency_id?: number;
  // Universal job fields for ML accuracy
  skill_level_required: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  job_scope: "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION";
  work_environment: "INDOOR" | "OUTDOOR" | "BOTH";
  // Multi-employee mode for agencies
  skill_slots?: SkillSlot[];
  // Daily payment model fields
  payment_model?: "PROJECT" | "DAILY";
  daily_rate?: number;
  duration_days?: number;
}

// Skill slot for multi-employee agency hiring
interface SkillSlot {
  specialization_id: number;
  workers_needed: number;
  skill_level_required: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  notes?: string;
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
    agencyId,
  );

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [budget, setBudget] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [street, setStreet] = useState("");
  const [duration, setDuration] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  // New universal job fields for ML accuracy
  const [skillLevel, setSkillLevel] = useState<
    "ENTRY" | "INTERMEDIATE" | "EXPERT"
  >("INTERMEDIATE");
  const [jobScope, setJobScope] = useState<
    "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION"
  >("MINOR_REPAIR");
  const [workEnvironment, setWorkEnvironment] = useState<
    "INDOOR" | "OUTDOOR" | "BOTH"
  >("INDOOR");
  // Daily payment model fields
  const [paymentModel, setPaymentModel] = useState<"PROJECT" | "DAILY">("PROJECT");
  const [dailyRate, setDailyRate] = useState("");
  const [durationDays, setDurationDays] = useState("");

  // Skill slots for agency hiring (unified model - no toggle needed)
  // When hiring an agency, skill slots are always used (even for 1 worker)
  const [skillSlots, setSkillSlots] = useState<SkillSlot[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotSpecializationId, setNewSlotSpecializationId] = useState<
    number | null
  >(null);
  const [newSlotWorkersNeeded, setNewSlotWorkersNeeded] = useState("1");
  const [newSlotSkillLevel, setNewSlotSkillLevel] = useState<
    "ENTRY" | "INTERMEDIATE" | "EXPERT"
  >("INTERMEDIATE");
  const [newSlotNotes, setNewSlotNotes] = useState("");

  const queryClient = useQueryClient();
  // Jobs only use Wallet payment - deposits via QR PH (any bank/e-wallet)
  // No payment method selection needed - always WALLET

  // Fetch wallet balance
  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useWallet();

  const walletBalance =
    walletData?.availableBalance ?? walletData?.balance ?? 0;
  const reservedBalance = walletData?.reservedBalance ?? 0;

  // Payment methods are no longer required - deposits use QR PH (any bank/e-wallet)

  // Calculate required downpayment based on payment model
  // PROJECT: 50% of budget + 5% platform fee
  // DAILY: 100% of (daily_rate * duration_days) + 5% platform fee
  const requiredDownpayment = React.useMemo(() => {
    if (paymentModel === "PROJECT") {
      return budget ? parseFloat(budget) * 0.5 * 1.05 : 0;
    } else {
      // DAILY payment model
      const rate = parseFloat(dailyRate) || 0;
      const days = parseInt(durationDays) || 0;
      if (rate > 0 && days > 0) {
        const totalEscrow = rate * days;
        return totalEscrow * 1.05; // 100% escrow + 5% platform fee
      }
      return 0;
    }
  }, [paymentModel, budget, dailyRate, durationDays]);
  
  const hasInsufficientBalance = walletBalance < requiredDownpayment;
  const shortfallAmount = requiredDownpayment - walletBalance;

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

  // AI Price Prediction Hook
  const {
    mutate: predictPrice,
    data: pricePrediction,
    isPending: isPredictingPrice,
    error: pricePredictionError,
    reset: resetPricePrediction,
  } = usePricePrediction();

  // Debounce timer ref for price prediction
  const predictionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger price prediction when job details change (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }

    // Only predict if we have enough data
    if (title.length >= 5 && description.length >= 10 && categoryId) {
      // Debounce prediction by 800ms to avoid too many API calls
      predictionTimeoutRef.current = setTimeout(() => {
        predictPrice({
          title,
          description,
          category_id: categoryId,
          urgency,
          skill_level: skillLevel,
          job_scope: jobScope,
          work_environment: workEnvironment,
        });
      }, 800);
    } else {
      // Reset prediction if insufficient data
      resetPricePrediction();
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, [
    title,
    description,
    categoryId,
    urgency,
    skillLevel,
    jobScope,
    workEnvironment,
    predictPrice,
    resetPricePrediction,
  ]);

  // Handler to apply the AI suggested price
  const handleApplySuggestedPrice = useCallback((price: number) => {
    setBudget(price.toFixed(2));
  }, []);

  // Multi-employee skill slot management
  const addSkillSlot = useCallback(() => {
    if (!newSlotSpecializationId) {
      Alert.alert("Error", "Please select a specialization");
      return;
    }
    const workersCount = parseInt(newSlotWorkersNeeded) || 1;
    if (workersCount < 1 || workersCount > 10) {
      Alert.alert("Error", "Workers needed must be between 1 and 10");
      return;
    }
    // Check total workers doesn't exceed 20
    const currentTotal = skillSlots.reduce(
      (sum, slot) => sum + slot.workers_needed,
      0,
    );
    if (currentTotal + workersCount > 20) {
      Alert.alert(
        "Error",
        `Cannot add ${workersCount} workers. Maximum total is 20. Current: ${currentTotal}`,
      );
      return;
    }

    setSkillSlots((prev) => [
      ...prev,
      {
        specialization_id: newSlotSpecializationId,
        workers_needed: workersCount,
        skill_level_required: newSlotSkillLevel,
        notes: newSlotNotes.trim() || undefined,
      },
    ]);

    // Reset form
    setNewSlotSpecializationId(null);
    setNewSlotWorkersNeeded("1");
    setNewSlotSkillLevel("INTERMEDIATE");
    setNewSlotNotes("");
    setShowAddSlotModal(false);
  }, [
    newSlotSpecializationId,
    newSlotWorkersNeeded,
    newSlotSkillLevel,
    newSlotNotes,
    skillSlots,
  ]);

  const removeSkillSlot = useCallback((index: number) => {
    setSkillSlots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getTotalWorkersNeeded = useCallback(() => {
    return skillSlots.reduce((sum, slot) => sum + slot.workers_needed, 0);
  }, [skillSlots]);

  // Fetch categories - MUST be defined BEFORE getSpecializationName callback
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchJson<{ categories: Category[] }>(
        ENDPOINTS.GET_CATEGORIES,
      );
      return response.categories || [];
    },
  });

  const categories = categoriesData || [];

  const getSpecializationName = useCallback(
    (specId: number) => {
      if (!categories || !Array.isArray(categories)) {
        return `Specialization #${specId}`;
      }
      const cat = categories.find((c) => c.id === specId);
      return cat?.name || `Specialization #${specId}`;
    },
    [categories],
  );

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
    Array.isArray(categories),
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
      // Invalidate wallet queries to reflect reserved balance change
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });

      // Validate job_posting_id exists
      if (!data.job_posting_id || isNaN(Number(data.job_posting_id))) {
        console.error("Invalid job_posting_id in response:", data);
        Alert.alert(
          "Success!",
          "Job created, but there was an issue retrieving the details.",
          [
            {
              text: "Go to Home",
              onPress: () => router.replace("/"),
            },
          ],
        );
        return;
      }

      // Check if payment is required (wallet payment)
      if (data.requires_payment && data.invoice_url) {
        // Navigate to wallet payment screen
        // Use replace so back button doesn't return to the form
        router.replace({
          pathname: "/payments/wallet",
          params: {
            jobId: data.job_posting_id.toString(),
            budget: budget || "0", // full job budget for breakdown
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
              // Use replace so back button goes to home, not the form
              onPress: () =>
                router.replace(`/jobs/${data.job_posting_id}` as any),
            },
            {
              text: "Back to Home",
              onPress: () => router.replace("/"),
            },
          ],
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

    // Validate payment model specific fields
    if (paymentModel === "PROJECT") {
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
            `The minimum budget for ${selectedCategory.name} is ₱${selectedCategory.minimum_rate.toFixed(2)}. Please enter a higher amount.`,
          );
          return;
        }
      }
    } else {
      // DAILY payment model validation
      if (!dailyRate || parseFloat(dailyRate) <= 0) {
        Alert.alert("Error", "Please enter a valid daily rate");
        return;
      }
      if (!durationDays || parseInt(durationDays) <= 0) {
        Alert.alert("Error", "Please enter a valid duration (number of days)");
        return;
      }
      if (parseInt(durationDays) > 365) {
        Alert.alert("Error", "Duration cannot exceed 365 days");
        return;
      }
    }

    if (!barangay.trim()) {
      Alert.alert("Error", "Please enter a barangay");
      return;
    }
    if (!street.trim()) {
      Alert.alert("Error", "Please enter a street address");
      return;
    }

    // Skill slot validation for agency jobs (unified model - always require at least 1 slot)
    if (agencyId) {
      if (skillSlots.length === 0) {
        Alert.alert(
          "Error",
          "Please add at least one worker requirement for this agency job",
        );
        return;
      }
    }

    // Wallet balance check only - deposits use QR PH (any bank/e-wallet)

    // Check wallet balance
    if (hasInsufficientBalance) {
      const paymentDesc = paymentModel === "PROJECT" 
        ? "50% downpayment" 
        : "100% escrow (daily rate × days)";
      Alert.alert(
        "Insufficient Wallet Balance",
        `You need ₱${requiredDownpayment.toFixed(2)} for the ${paymentDesc}, but your wallet only has ₱${walletBalance.toFixed(2)}.\n\nYou're short by ₱${shortfallAmount.toFixed(2)}.\n\nWould you like to deposit funds now?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Deposit Funds",
            onPress: () =>
              router.push({
                pathname: "/payments/deposit",
                params: { amount: Math.ceil(shortfallAmount).toString() },
              } as any),
          },
        ],
      );
      return;
    }

    const jobData: CreateJobRequest = {
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId,
      location: `${street.trim()}, ${barangay.trim()}`,
      expected_duration: duration.trim() || undefined,
      urgency_level: urgency,
      preferred_start_date: startDate
        ? startDate.toISOString().split("T")[0]
        : undefined,
      downpayment_method: "WALLET", // Jobs only use Wallet payment
      // Universal job fields for ML accuracy - explicitly passed
      skill_level_required: skillLevel,
      job_scope: jobScope,
      work_environment: workEnvironment,
      // Payment model specific fields
      payment_model: paymentModel,
    };

    // Add payment model specific fields
    if (paymentModel === "PROJECT") {
      jobData.budget = parseFloat(budget);
    } else {
      jobData.daily_rate = parseFloat(dailyRate);
      jobData.duration_days = parseInt(durationDays);
    }

    // Add worker or agency ID if provided
    if (workerId) {
      (jobData as any).worker_id = parseInt(workerId);
    }
    if (agencyId) {
      (jobData as any).agency_id = parseInt(agencyId);
      // Always add skill slots for agency jobs (unified hiring model)
      if (skillSlots.length > 0) {
        jobData.skill_slots = skillSlots;
      }
    }

    createJobMutation.mutate(jobData);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: workerId
            ? "Hire Worker"
            : agencyId
              ? "Hire Agency"
              : "Post a Job",
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
            {workerId ? "Hire Worker" : agencyId ? "Hire Agency" : "Post a Job"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Job Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Job Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Fix leaking pipe in bathroom"
                  value={title}
                  onChangeText={setTitle}
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
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={Colors.textHint}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                {categoriesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>
                      Loading categories...
                    </Text>
                  </View>
                ) : !Array.isArray(categories) || categories.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color={Colors.warning}
                    />
                    <Text style={styles.emptyStateText}>
                      No specializations available in database. Please contact
                      support.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          categoryId === category.id &&
                            styles.categoryChipActive,
                        ]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setSelectedCategory(category);
                          if (category.minimum_rate > 0) {
                            setBudget(category.minimum_rate.toFixed(2));
                          }
                        }}
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
            </View>

            {/* Worker Requirements Section - Only visible when hiring an agency */}
            {agencyId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Worker Requirements</Text>
                <Text style={styles.sectionHint}>
                  Specify the workers you need for this job. You can add multiple skill types.
                </Text>

                {/* Skill Slots List - Always shown for agency jobs */}
                <View style={styles.skillSlotsContainer}>
                  {skillSlots.length === 0 ? (
                    <View style={styles.emptySlots}>
                      <Ionicons
                        name="people-outline"
                        size={32}
                        color={Colors.textHint}
                      />
                      <Text style={styles.emptySlotsText}>
                        No workers added yet. Add at least one worker requirement.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.slotsSummary}>
                        Total: {getTotalWorkersNeeded()} worker
                        {getTotalWorkersNeeded() !== 1 ? "s" : ""} across{" "}
                        {skillSlots.length} requirement
                        {skillSlots.length !== 1 ? "s" : ""}
                      </Text>
                      {skillSlots.map((slot, index) => (
                        <View key={index} style={styles.slotCard}>
                          <View style={styles.slotHeader}>
                            <Text style={styles.slotTitle}>
                              {getSpecializationName(slot.specialization_id)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeSkillSlot(index)}
                                style={styles.removeSlotBtn}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={24}
                                  color={Colors.error}
                                />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.slotDetails}>
                              <View style={styles.slotBadge}>
                                <Ionicons
                                  name="people"
                                  size={14}
                                  color={Colors.primary}
                                />
                                <Text style={styles.slotBadgeText}>
                                  {slot.workers_needed} worker
                                  {slot.workers_needed !== 1 ? "s" : ""}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.slotBadge,
                                  styles.slotBadgeSkill,
                                ]}
                              >
                                <Text style={styles.slotBadgeText}>
                                  {slot.skill_level_required === "ENTRY"
                                    ? "🌱 Entry"
                                    : slot.skill_level_required ===
                                        "INTERMEDIATE"
                                      ? "⭐ Intermediate"
                                      : "👑 Expert"}
                                </Text>
                              </View>
                            </View>
                            {slot.notes && (
                              <Text style={styles.slotNotes}>{slot.notes}</Text>
                            )}
                          </View>
                        ))}
                      </>
                    )}

                    {/* Add Worker Button */}
                    <TouchableOpacity
                      style={styles.addSlotBtn}
                      onPress={() => setShowAddSlotModal(true)}
                    >
                      <Ionicons
                        name="add-circle"
                        size={20}
                        color={Colors.white}
                      />
                      <Text style={styles.addSlotBtnText}>Add Worker Requirement</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            )}

            {/* Budget Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Budget & Payment Model</Text>

              {/* Payment Model Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Model *</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      paymentModel === "PROJECT" && styles.optionButtonActive,
                    ]}
                    onPress={() => setPaymentModel("PROJECT")}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        paymentModel === "PROJECT" &&
                          styles.optionButtonTextActive,
                      ]}
                    >
                      💼 Fixed Budget
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      paymentModel === "DAILY" && styles.optionButtonActive,
                    ]}
                    onPress={() => setPaymentModel("DAILY")}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        paymentModel === "DAILY" &&
                          styles.optionButtonTextActive,
                      ]}
                    >
                      📅 Daily Rate
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>
                  {paymentModel === "PROJECT"
                    ? "Pay for the entire project (50% downpayment, 50% on completion)"
                    : "Pay per day of work (100% escrow upfront)"}
                </Text>
              </View>

              {/* Fixed Budget Fields */}
              {paymentModel === "PROJECT" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Budget (₱) *</Text>
                <View
                  style={[
                    styles.budgetInput,
                    !categoryId && styles.inputDisabled,
                  ]}
                >
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={styles.budgetTextInput}
                    placeholder={
                      categoryId ? "0.00" : "Select a category first"
                    }
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textHint}
                    editable={!!categoryId}
                  />
                </View>
                <Text style={styles.hint}>
                  {selectedCategory && selectedCategory.minimum_rate > 0
                    ? `Minimum: ₱${selectedCategory.minimum_rate.toFixed(2)}`
                    : categoryId
                      ? "This is what the worker will receive"
                      : "Select a category first"}
                </Text>
              </View>
              )}

              {/* Daily Rate Fields */}
              {paymentModel === "DAILY" && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Daily Rate per Worker (₱) *</Text>
                    <View
                      style={[
                        styles.budgetInput,
                        !categoryId && styles.inputDisabled,
                      ]}
                    >
                      <Text style={styles.currencySymbol}>₱</Text>
                      <TextInput
                        style={styles.budgetTextInput}
                        placeholder={
                          categoryId ? "0.00" : "Select a category first"
                        }
                        value={dailyRate}
                        onChangeText={setDailyRate}
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.textHint}
                        editable={!!categoryId}
                      />
                    </View>
                    <Text style={styles.hint}>
                      Worker's daily rate (per 8-hour day)
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Duration (Days) *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        !categoryId && styles.inputDisabled,
                      ]}
                      placeholder={
                        categoryId ? "e.g., 5" : "Select a category first"
                      }
                      value={durationDays}
                      onChangeText={setDurationDays}
                      keyboardType="number-pad"
                      placeholderTextColor={Colors.textHint}
                      editable={!!categoryId}
                    />
                    <Text style={styles.hint}>
                      Estimated number of working days
                    </Text>
                  </View>
                </>
              )}

              {/* AI Price Suggestion Card - Only for PROJECT model */}
              {paymentModel === "PROJECT" &&
                categoryId &&
                (title.length >= 5 || description.length >= 10) && (
                  <PriceSuggestionCard
                    minPrice={pricePrediction?.min_price}
                    suggestedPrice={pricePrediction?.suggested_price}
                    maxPrice={pricePrediction?.max_price}
                    confidence={pricePrediction?.confidence}
                    source={pricePrediction?.source}
                    isLoading={isPredictingPrice}
                    error={pricePredictionError?.message}
                    onApplySuggested={handleApplySuggestedPrice}
                  />
                )}

              {/* Payment Summary - PROJECT Model */}
              {paymentModel === "PROJECT" && budget && parseFloat(budget) > 0 && (
                <View style={styles.paymentSummary}>
                  <Text style={styles.summaryTitle}>Payment Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Total Budget (Worker Receives)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{parseFloat(budget).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      50% Escrow (Downpayment)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{(parseFloat(budget) * 0.5).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Platform Fee (5% of escrow)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{(parseFloat(budget) * 0.5 * 0.05).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryLabelTotal}>Due Now</Text>
                    <Text style={styles.summaryValueTotal}>
                      ₱{(parseFloat(budget) * 0.5 * 1.05).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.walletBalanceRow}>
                    {walletLoading ? (
                      <Text style={styles.walletLabel}>
                        Loading wallet balance...
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.walletLabel}>
                          Wallet Balance: ₱{walletBalance.toFixed(2)}
                        </Text>
                        {hasInsufficientBalance && (
                          <Text style={styles.insufficientText}>
                            (Need ₱{shortfallAmount.toFixed(2)} more)
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Payment Summary - DAILY Model */}
              {paymentModel === "DAILY" && dailyRate && durationDays && parseFloat(dailyRate) > 0 && parseInt(durationDays) > 0 && (
                <View style={styles.paymentSummary}>
                  <Text style={styles.summaryTitle}>Payment Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Daily Rate per Worker
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{parseFloat(dailyRate).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Duration
                    </Text>
                    <Text style={styles.summaryValue}>
                      {parseInt(durationDays)} day{parseInt(durationDays) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Total Worker Payment
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{(parseFloat(dailyRate) * parseInt(durationDays)).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Platform Fee (5% of total)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{(parseFloat(dailyRate) * parseInt(durationDays) * 0.05).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryLabelTotal}>Due Now (100% Escrow)</Text>
                    <Text style={styles.summaryValueTotal}>
                      ₱{(parseFloat(dailyRate) * parseInt(durationDays) * 1.05).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.walletBalanceRow}>
                    {walletLoading ? (
                      <Text style={styles.walletLabel}>
                        Loading wallet balance...
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.walletLabel}>
                          Wallet Balance: ₱{walletBalance.toFixed(2)}
                        </Text>
                        {hasInsufficientBalance && (
                          <Text style={styles.insufficientText}>
                            (Need ₱{shortfallAmount.toFixed(2)} more)
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                  <Text style={styles.dailyNote}>
                    💡 Daily jobs require 100% escrow upfront. Workers confirm attendance daily.
                  </Text>
                </View>
              )}
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Location</Text>

              {/* Barangay */}
              <View style={styles.inputGroup}>
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
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="location-outline"
                      size={24}
                      color={Colors.warning}
                    />
                    <Text style={styles.emptyStateText}>
                      No barangays available in database for Zamboanga City.
                      Please contact support.
                    </Text>
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
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
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
                <Text style={styles.hint}>
                  Provide the specific street address or landmark
                </Text>
              </View>
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

            {/* Add Skill Slot Modal */}
            <Modal
              visible={showAddSlotModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowAddSlotModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Skill Slot</Text>
                    <TouchableOpacity
                      onPress={() => setShowAddSlotModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    {/* Specialization Selection */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Specialization *</Text>
                      {categoriesLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator
                            size="small"
                            color={Colors.primary}
                          />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : !Array.isArray(categories) ||
                        categories.length === 0 ? (
                        <Text style={styles.emptyStateText}>
                          No specializations available
                        </Text>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.categoryScroll}
                        >
                          {categories.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={[
                                styles.categoryChip,
                                newSlotSpecializationId === category.id &&
                                  styles.categoryChipActive,
                              ]}
                              onPress={() =>
                                setNewSlotSpecializationId(category.id)
                              }
                            >
                              <Text
                                style={[
                                  styles.categoryChipText,
                                  newSlotSpecializationId === category.id &&
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

                    {/* Workers Needed */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Workers Needed *</Text>
                      <View style={styles.workersRow}>
                        <TouchableOpacity
                          style={styles.workerBtn}
                          onPress={() => {
                            const current = parseInt(newSlotWorkersNeeded) || 1;
                            if (current > 1)
                              setNewSlotWorkersNeeded((current - 1).toString());
                          }}
                        >
                          <Text style={styles.workerBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.workersCount}>
                          {newSlotWorkersNeeded}
                        </Text>
                        <TouchableOpacity
                          style={styles.workerBtn}
                          onPress={() => {
                            const current = parseInt(newSlotWorkersNeeded) || 1;
                            if (current < 10)
                              setNewSlotWorkersNeeded((current + 1).toString());
                          }}
                        >
                          <Text style={styles.workerBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Skill Level */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Skill Level Required</Text>
                      <View style={styles.skillLevelRow}>
                        {(["ENTRY", "INTERMEDIATE", "EXPERT"] as const).map(
                          (level) => (
                            <TouchableOpacity
                              key={level}
                              style={[
                                styles.skillLevelBtn,
                                newSlotSkillLevel === level &&
                                  styles.skillLevelBtnActive,
                              ]}
                              onPress={() => setNewSlotSkillLevel(level)}
                            >
                              <Text
                                style={[
                                  styles.skillLevelText,
                                  newSlotSkillLevel === level &&
                                    styles.skillLevelTextActive,
                                ]}
                              >
                                {level === "ENTRY"
                                  ? "🌱 Entry"
                                  : level === "INTERMEDIATE"
                                    ? "⭐ Intermediate"
                                    : "👑 Expert"}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Notes (Optional)</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Any specific requirements for this role..."
                        value={newSlotNotes}
                        onChangeText={setNewSlotNotes}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor={Colors.textHint}
                        maxLength={200}
                      />
                    </View>
                  </ScrollView>

                  {/* Add Button */}
                  <TouchableOpacity
                    style={[
                      styles.addSlotConfirmBtn,
                      !newSlotSpecializationId &&
                        styles.addSlotConfirmBtnDisabled,
                    ]}
                    onPress={addSkillSlot}
                    disabled={!newSlotSpecializationId}
                  >
                    <Text style={styles.addSlotConfirmBtnText}>
                      Add Skill Slot
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Timing Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Timing & Urgency</Text>

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
                        urgency === level &&
                          level === "LOW" &&
                          styles.urgencyLow,
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

              {/* Expected Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expected Duration (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2-3 hours, 1 day"
                  value={duration}
                  onChangeText={setDuration}
                  placeholderTextColor={Colors.textHint}
                />
              </View>

              {/* Preferred Start Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Preferred Start Date (Optional)
                </Text>
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
                    {startDate
                      ? startDate.toLocaleDateString()
                      : "Select a date"}
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
            </View>

            {/* Job Options Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Job Options</Text>

              {/* Skill Level Required */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Skill Level Required</Text>
                <View style={styles.urgencyRow}>
                  {(
                    [
                      { value: "ENTRY", label: "🌱 Entry" },
                      { value: "INTERMEDIATE", label: "⭐ Intermediate" },
                      { value: "EXPERT", label: "👑 Expert" },
                    ] as const
                  ).map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.urgencyButton,
                        skillLevel === level.value && styles.skillLevelActive,
                      ]}
                      onPress={() => setSkillLevel(level.value)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          skillLevel === level.value &&
                            styles.urgencyTextActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Job Scope */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Scope</Text>
                <View style={styles.urgencyRow}>
                  {(
                    [
                      { value: "MINOR_REPAIR", label: "🔧 Minor" },
                      { value: "MODERATE_PROJECT", label: "🛠️ Moderate" },
                      { value: "MAJOR_RENOVATION", label: "🏗️ Major" },
                    ] as const
                  ).map((scope) => (
                    <TouchableOpacity
                      key={scope.value}
                      style={[
                        styles.urgencyButton,
                        jobScope === scope.value && styles.jobScopeActive,
                      ]}
                      onPress={() => setJobScope(scope.value)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          jobScope === scope.value && styles.urgencyTextActive,
                        ]}
                      >
                        {scope.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Work Environment */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work Environment</Text>
                <View style={styles.urgencyRow}>
                  {(
                    [
                      { value: "INDOOR", label: "🏠 Indoor" },
                      { value: "OUTDOOR", label: "🌳 Outdoor" },
                      { value: "BOTH", label: "🔄 Both" },
                    ] as const
                  ).map((env) => (
                    <TouchableOpacity
                      key={env.value}
                      style={[
                        styles.urgencyButton,
                        workEnvironment === env.value && styles.workEnvActive,
                      ]}
                      onPress={() => setWorkEnvironment(env.value)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          workEnvironment === env.value &&
                            styles.urgencyTextActive,
                        ]}
                      >
                        {env.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Materials Section (only if worker selected) */}
            {workerId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧰 Materials</Text>
                <View style={styles.inputGroup}>
                  {materialsLoading ? (
                    <View style={styles.loadingCategories}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.loadingText}>
                        Loading materials...
                      </Text>
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
                                : [...prev, material.id],
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
                    <Text style={styles.hint}>
                      This worker has no materials listed
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Payment Method Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💳 Payment</Text>

              {/* Wallet Balance Card */}
              <View
                style={[
                  styles.walletBalanceCard,
                  hasInsufficientBalance &&
                    budget &&
                    styles.walletBalanceCardWarning,
                ]}
              >
                <View style={styles.walletBalanceHeader}>
                  <Ionicons
                    name="wallet"
                    size={24}
                    color={
                      hasInsufficientBalance && budget
                        ? Colors.warning
                        : Colors.primary
                    }
                  />
                  <Text style={styles.walletBalanceLabel}>
                    Available Balance
                  </Text>
                </View>
                <Text
                  style={[
                    styles.walletBalanceAmount,
                    hasInsufficientBalance &&
                      budget &&
                      styles.walletBalanceAmountWarning,
                  ]}
                >
                  ₱{walletBalance.toFixed(2)}
                </Text>
                {reservedBalance > 0 && (
                  <View style={styles.reservedBalanceRow}>
                    <Ionicons
                      name="lock-closed"
                      size={14}
                      color={Colors.warning}
                    />
                    <Text style={styles.reservedBalanceText}>
                      ₱{reservedBalance.toFixed(2)} reserved in escrow
                    </Text>
                  </View>
                )}
                {budget && parseFloat(budget) > 0 && (
                  <View style={styles.walletBalanceDetails}>
                    <Text style={styles.walletBalanceDetailText}>
                      Required downpayment (50%): ₱
                      {requiredDownpayment.toFixed(2)}
                    </Text>
                    {hasInsufficientBalance && (
                      <Text style={styles.walletBalanceShortfall}>
                        Short by: ₱{shortfallAmount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                )}
                {hasInsufficientBalance && budget && (
                  <TouchableOpacity
                    style={styles.depositButton}
                    onPress={() =>
                      router.push({
                        pathname: "/payments/deposit",
                        params: {
                          amount: Math.ceil(shortfallAmount).toString(),
                        },
                      } as any)
                    }
                  >
                    <Ionicons
                      name="add-circle"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.depositButtonText}>Deposit Funds</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Payment Info - QR PH deposits supported */}
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.successText}>
                  QR PH deposits enabled (any bank/e-wallet)
                </Text>
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
                    {workerId || agencyId
                      ? // INVITE job - immediate deduction
                        `• 50% downpayment will be deducted immediately\n• Funds held in escrow until job completion\n• Worker/Agency completes the job\n• You approve completion\n• Remaining 50% is released`
                      : // LISTING job - reservation
                        `• 50% downpayment will be reserved (not deducted)\n• Funds are held when a worker is accepted\n• Worker completes the job\n• You approve completion\n• Remaining 50% is released`}
                  </Text>
                </View>
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
                <Text style={styles.submitButtonText}>
                  {workerId || agencyId ? "Send Job Request" : "Post Job"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
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
    gap: 16,
  },
  // Section Card Styles
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textHint,
    textAlign: "right",
    marginTop: 4,
  },
  // Loading styles
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: 8,
  },
  // Empty state styles
  emptyStateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  emptyStateText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 20,
  },
  // Payment Summary Styles
  paymentSummary: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  summaryLabelTotal: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  summaryValueTotal: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
  walletBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  walletLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  insufficientText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "500",
  },
  // Legacy styles below
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
  inputDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.7,
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
  // Skill Level active style
  skillLevelActive: {
    backgroundColor: Colors.info || "#3B82F6",
  },
  // Job Scope active style
  jobScopeActive: {
    backgroundColor: Colors.warning || "#F59E0B",
  },
  // Work Environment active style
  workEnvActive: {
    backgroundColor: Colors.success || "#10B981",
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
  // Wallet Balance Card Styles
  walletBalanceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  walletBalanceCardWarning: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + "10",
  },
  walletBalanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  walletBalanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  walletBalanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  walletBalanceAmountWarning: {
    color: Colors.warning,
  },
  reservedBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  reservedBalanceText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: "500",
  },
  walletBalanceDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  walletBalanceDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  walletBalanceShortfall: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "600",
    marginTop: 4,
  },
  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    marginTop: 12,
  },
  depositButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  // Warning Box Styles
  warningBox: {
    flexDirection: "row",
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
    marginBottom: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.warning,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  addPaymentButton: {
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  addPaymentButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },
  // Success Box Styles
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "15",
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.success + "30",
  },
  successText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: "500",
  },
  // Team Hire Styles
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },
  skillSlotsContainer: {
    marginTop: 8,
  },
  emptySlots: {
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptySlotsText: {
    fontSize: 14,
    color: Colors.textHint,
    textAlign: "center",
    marginTop: 8,
  },
  slotsSummary: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 12,
  },
  slotCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  removeSlotBtn: {
    padding: 4,
  },
  slotDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  slotBadgeSkill: {
    backgroundColor: Colors.warning + "15",
  },
  slotBadgeText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  slotNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  addSlotBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: 4,
  },
  workersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  workerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  workerBtnText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
  workersCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    minWidth: 50,
    textAlign: "center",
  },
  skillLevelRow: {
    flexDirection: "column",
    gap: 8,
  },
  skillLevelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  skillLevelBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  skillLevelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  skillLevelTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  addSlotConfirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  addSlotConfirmBtnDisabled: {
    backgroundColor: Colors.border,
  },
  addSlotConfirmBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  // Payment Model Selector Styles
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
  },
  optionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  optionButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  optionButtonTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  inputDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
  },
  dailyNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    fontStyle: "italic",
  },
});