/**
 * Team Job Creation Screen
 *
 * Features:
 * - Create team job with multiple skill requirements
 * - Multi-skill selection with workers needed per skill
 * - Budget allocation options (equal per worker, per skill, manual, weighted)
 * - Team start threshold configuration
 * - Preview of cost breakdown
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useBarangays } from "@/lib/hooks/useLocations";
import { useWallet } from "@/lib/hooks/useWallet";
import { usePricePrediction } from "@/lib/hooks/usePricePrediction";
import PriceSuggestionCard from "@/components/PriceSuggestionCard";

interface Specialization {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
}

interface SkillSlot {
  id: string; // Temporary ID for UI
  specialization_id: number;
  specialization_name: string;
  workers_needed: number;
  skill_level_required: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  budget_allocated?: number;
  notes?: string;
}

type AllocationMethod =
  | "EQUAL_PER_WORKER"
  | "EQUAL_PER_SKILL"
  | "MANUAL_ALLOCATION"
  | "SKILL_WEIGHTED";

const ALLOCATION_METHODS: {
  value: AllocationMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "EQUAL_PER_WORKER",
    label: "Equal Per Worker",
    description: "Split budget equally among all workers",
  },
  {
    value: "EQUAL_PER_SKILL",
    label: "Equal Per Skill",
    description: "Split budget equally among skill slots",
  },
  {
    value: "SKILL_WEIGHTED",
    label: "Skill Weighted",
    description: "Expert 3x, Intermediate 2x, Entry 1x",
  },
  {
    value: "MANUAL_ALLOCATION",
    label: "Manual",
    description: "Set budget per skill slot manually",
  },
];

const SKILL_LEVELS = [
  { value: "ENTRY", label: "Entry Level 🌱", multiplier: 1 },
  { value: "INTERMEDIATE", label: "Intermediate ⭐", multiplier: 2 },
  { value: "EXPERT", label: "Expert 👑", multiplier: 3 },
];

export default function CreateTeamJobScreen() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [street, setStreet] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState("");

  // Universal job fields for ML accuracy (same as single job form)
  const [jobScope, setJobScope] = useState<
    "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION"
  >("MODERATE_PROJECT");
  const [workEnvironment, setWorkEnvironment] = useState<
    "INDOOR" | "OUTDOOR" | "BOTH"
  >("BOTH");

  // Team-specific state
  const [skillSlots, setSkillSlots] = useState<SkillSlot[]>([]);
  const [allocationMethod, setAllocationMethod] =
    useState<AllocationMethod>("EQUAL_PER_WORKER");
  const [teamStartThreshold, setTeamStartThreshold] = useState(100); // Percentage

  // Modal state
  const [addSkillModalVisible, setAddSkillModalVisible] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<Specialization | null>(null);
  const [newSlotWorkers, setNewSlotWorkers] = useState(1);
  const [newSlotLevel, setNewSlotLevel] = useState<
    "ENTRY" | "INTERMEDIATE" | "EXPERT"
  >("ENTRY");
  const [newSlotNotes, setNewSlotNotes] = useState("");
  const [specSearchQuery, setSpecSearchQuery] = useState("");

  // Wallet balance
  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
  } = useWallet();
  const walletBalance =
    (walletData as { balance?: number } | undefined)?.balance || 0;

  // Fetch specializations (all available skills for team jobs)
  const { data: specializations, isLoading: specsLoading } = useQuery<
    Specialization[]
  >({
    queryKey: ["specializations"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.AVAILABLE_SKILLS);
      const data = (await response.json()) as {
        success?: boolean;
        data?: any[];
        skills?: any[];
        specializations?: any[];
      };
      const rawSkills =
        data.data || data.skills || data.specializations || ([] as any[]);

      return rawSkills.map((skill) => ({
        id: skill.id ?? skill.specializationID,
        name: skill.name ?? skill.specializationName ?? "",
        description: skill.description ?? "",
        category_id:
          skill.category_id ?? skill.categoryId ?? skill.category ?? undefined,
        category_name:
          skill.category_name ?? skill.categoryName ?? skill.category ?? "",
      }));
    },
  });

  // Fetch barangays
  const { data: barangays } = useBarangays(1); // Zamboanga City

  // Calculate totals
  const totalWorkersNeeded = useMemo(() => {
    return skillSlots.reduce((sum, slot) => sum + slot.workers_needed, 0);
  }, [skillSlots]);

  const budgetNum = parseFloat(totalBudget) || 0;

  // Calculate budget allocation preview
  const budgetAllocation = useMemo(() => {
    if (skillSlots.length === 0 || budgetNum === 0) return [];

    if (allocationMethod === "EQUAL_PER_WORKER") {
      const perWorker = budgetNum / totalWorkersNeeded;
      return skillSlots.map((slot) => ({
        ...slot,
        calculated_budget: perWorker * slot.workers_needed,
        per_worker: perWorker,
      }));
    }

    if (allocationMethod === "EQUAL_PER_SKILL") {
      const perSlot = budgetNum / skillSlots.length;
      return skillSlots.map((slot) => ({
        ...slot,
        calculated_budget: perSlot,
        per_worker: perSlot / slot.workers_needed,
      }));
    }

    if (allocationMethod === "SKILL_WEIGHTED") {
      const weights = { ENTRY: 1, INTERMEDIATE: 2, EXPERT: 3 };
      const totalWeight = skillSlots.reduce(
        (sum, slot) =>
          sum + weights[slot.skill_level_required] * slot.workers_needed,
        0
      );
      const perWeight = budgetNum / totalWeight;

      return skillSlots.map((slot) => {
        const slotBudget =
          perWeight * weights[slot.skill_level_required] * slot.workers_needed;
        return {
          ...slot,
          calculated_budget: slotBudget,
          per_worker: slotBudget / slot.workers_needed,
        };
      });
    }

    // MANUAL_ALLOCATION
    return skillSlots.map((slot) => ({
      ...slot,
      calculated_budget: slot.budget_allocated || 0,
      per_worker: (slot.budget_allocated || 0) / slot.workers_needed,
    }));
  }, [skillSlots, budgetNum, allocationMethod, totalWorkersNeeded]);

  // Calculate escrow and fees
  const escrowAmount = budgetNum * 0.5;
  const platformFee = escrowAmount * 0.05;
  const totalDue = escrowAmount + platformFee;
  const hasEnoughBalance = walletBalance >= totalDue;

  // AI Price Prediction
  const {
    mutate: predictPrice,
    data: pricePrediction,
    isPending: isPredictingPrice,
    error: pricePredictionError,
    reset: resetPricePrediction,
  } = usePricePrediction();

  // Debounce timer ref for price prediction
  const predictionTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Get the highest skill level from all slots for prediction
  const highestSkillLevel = useMemo(() => {
    if (skillSlots.length === 0) return "INTERMEDIATE";
    const levels = { ENTRY: 1, INTERMEDIATE: 2, EXPERT: 3 };
    let highest: "ENTRY" | "INTERMEDIATE" | "EXPERT" = "ENTRY";
    for (const slot of skillSlots) {
      if (levels[slot.skill_level_required] > levels[highest]) {
        highest = slot.skill_level_required;
      }
    }
    return highest;
  }, [skillSlots]);

  // Get first skill slot's specialization_id as category proxy for prediction
  const primaryCategoryId = useMemo(() => {
    if (skillSlots.length === 0) return null;
    // Use the specialization_id of the first slot as a proxy for category
    return skillSlots[0].specialization_id;
  }, [skillSlots]);

  // Trigger price prediction when job details change (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }

    // Only predict if we have enough data (title, description, and at least one skill)
    if (title.length >= 5 && description.length >= 10 && primaryCategoryId) {
      // Debounce prediction by 800ms to avoid too many API calls
      predictionTimeoutRef.current = setTimeout(() => {
        predictPrice({
          title,
          description,
          category_id: primaryCategoryId,
          urgency,
          skill_level: highestSkillLevel,
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
    primaryCategoryId,
    urgency,
    highestSkillLevel,
    jobScope,
    workEnvironment,
    materials,
    predictPrice,
    resetPricePrediction,
  ]);

  // Handler to apply the AI suggested price (scaled by total workers needed)
  const handleApplySuggestedPrice = useCallback(
    (price: number) => {
      // Scale the per-worker suggestion by total workers needed for team jobs
      const scaledPrice = price * Math.max(1, totalWorkersNeeded);
      setTotalBudget(scaledPrice.toFixed(2));
    },
    [totalWorkersNeeded]
  );

  // Create mutation response type
  interface CreateTeamJobResponse {
    job_id: number;
    skill_slots_created: number;
    total_workers_needed: number;
    total_budget: number;
    escrow_amount: number;
  }

  // Create mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: any): Promise<CreateTeamJobResponse> => {
      const response = await apiRequest(ENDPOINTS.CREATE_TEAM_JOB, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json() as Promise<CreateTeamJobResponse>;
    },
    onSuccess: (data) => {
      Alert.alert(
        "Success! 🎉",
        `Team job created! ${data.skill_slots_created} skill slots with ${data.total_workers_needed} workers needed.`,
        [
          {
            text: "View Job",
            onPress: () => router.replace(`/jobs/${data.job_id}`),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create team job");
    },
  });

  // Filter specializations by search
  const filteredSpecs = useMemo(() => {
    if (!specializations) return [];
    const query = specSearchQuery.toLowerCase();
    return specializations.filter(
      (s: Specialization) =>
        s.name.toLowerCase().includes(query) ||
        (s.category_name || "").toLowerCase().includes(query)
    );
  }, [specializations, specSearchQuery]);

  // Add skill slot
  const handleAddSkillSlot = () => {
    if (!selectedSpecialization) {
      Alert.alert("Error", "Please select a skill/specialization");
      return;
    }

    // Allow adding same category multiple times for different worker groups
    // Each slot can have its own workers_needed count (1-10)

    const newSlot: SkillSlot = {
      id: Date.now().toString(),
      specialization_id: selectedSpecialization.id,
      specialization_name: selectedSpecialization.name,
      workers_needed: newSlotWorkers,
      skill_level_required: newSlotLevel,
      notes: newSlotNotes || undefined,
    };

    setSkillSlots([...skillSlots, newSlot]);
    setAddSkillModalVisible(false);
    resetAddSkillForm();
  };

  const resetAddSkillForm = () => {
    setSelectedSpecialization(null);
    setNewSlotWorkers(1);
    setNewSlotLevel("ENTRY");
    setNewSlotNotes("");
    setSpecSearchQuery("");
  };

  // Remove skill slot
  const handleRemoveSkillSlot = (slotId: string) => {
    setSkillSlots(skillSlots.filter((s) => s.id !== slotId));
  };

  // Update slot workers needed
  const updateSlotWorkers = (slotId: string, delta: number) => {
    setSkillSlots(
      skillSlots.map((slot) => {
        if (slot.id === slotId) {
          const newCount = Math.max(
            1,
            Math.min(10, slot.workers_needed + delta)
          );
          return { ...slot, workers_needed: newCount };
        }
        return slot;
      })
    );
  };

  // Update manual budget
  const updateSlotBudget = (slotId: string, budget: string) => {
    setSkillSlots(
      skillSlots.map((slot) => {
        if (slot.id === slotId) {
          return { ...slot, budget_allocated: parseFloat(budget) || 0 };
        }
        return slot;
      })
    );
  };

  // Add material
  const handleAddMaterial = () => {
    if (materialInput.trim() && !materials.includes(materialInput.trim())) {
      setMaterials([...materials, materialInput.trim()]);
      setMaterialInput("");
    }
  };

  // Validate form
  const validateForm = () => {
    if (!title.trim()) return "Please enter a job title";
    if (title.length < 10) return "Title must be at least 10 characters";
    if (!description.trim()) return "Please enter a job description";
    if (description.length < 50)
      return "Description must be at least 50 characters";
    if (skillSlots.length === 0)
      return "Please add at least one skill requirement";
    if (totalWorkersNeeded < 2) return "Team jobs require at least 2 workers";
    if (!totalBudget || budgetNum < 100) return "Minimum budget is ₱100";
    if (!barangay || !street) return "Please provide a complete location";
    if (!hasEnoughBalance)
      return `Insufficient wallet balance. Need ₱${totalDue.toFixed(2)}`;

    if (allocationMethod === "MANUAL_ALLOCATION") {
      const totalAllocated = skillSlots.reduce(
        (sum, s) => sum + (s.budget_allocated || 0),
        0
      );
      if (Math.abs(totalAllocated - budgetNum) > 1) {
        return `Manual allocation total (₱${totalAllocated}) must equal budget (₱${budgetNum})`;
      }
    }

    return null;
  };

  // Submit form
  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: `${street.trim()}, ${barangay}, Zamboanga City`,
      total_budget: budgetNum,
      urgency: urgency,
      preferred_start_date: startDate?.toISOString().split("T")[0],
      materials_needed: materials,
      budget_allocation_type: allocationMethod,
      team_start_threshold: teamStartThreshold,
      skill_slots: skillSlots.map((slot) => ({
        specialization_id: slot.specialization_id,
        workers_needed: slot.workers_needed,
        skill_level_required: slot.skill_level_required,
        budget_allocated:
          allocationMethod === "MANUAL_ALLOCATION"
            ? slot.budget_allocated
            : undefined,
        notes: slot.notes,
      })),
      payment_method: "WALLET",
    };

    createJobMutation.mutate(payload);
  };

  const renderSkillSlot = (slot: SkillSlot, index: number) => {
    const allocation = budgetAllocation.find((a) => a.id === slot.id);

    return (
      <View key={slot.id} style={styles.skillSlotCard}>
        <View style={styles.skillSlotHeader}>
          <View style={styles.skillSlotInfo}>
            <Text style={styles.skillSlotName}>{slot.specialization_name}</Text>
            <View style={styles.skillLevelBadge}>
              <Text style={styles.skillLevelText}>
                {
                  SKILL_LEVELS.find(
                    (l) => l.value === slot.skill_level_required
                  )?.label
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSkillSlot(slot.id)}
          >
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.workersRow}>
          <Text style={styles.workersLabel}>Workers Needed:</Text>
          <View style={styles.workersStepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateSlotWorkers(slot.id, -1)}
              disabled={slot.workers_needed <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={
                  slot.workers_needed <= 1
                    ? Colors.textSecondary
                    : Colors.primary
                }
              />
            </TouchableOpacity>
            <Text style={styles.workersCount}>{slot.workers_needed}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateSlotWorkers(slot.id, 1)}
              disabled={slot.workers_needed >= 10}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  slot.workers_needed >= 10
                    ? Colors.textSecondary
                    : Colors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {allocationMethod === "MANUAL_ALLOCATION" ? (
          <View style={styles.manualBudgetRow}>
            <Text style={styles.budgetLabel}>Budget for this slot:</Text>
            <TextInput
              style={styles.manualBudgetInput}
              value={slot.budget_allocated?.toString() || ""}
              onChangeText={(text) => updateSlotBudget(slot.id, text)}
              keyboardType="numeric"
              placeholder="₱0"
            />
          </View>
        ) : (
          allocation && (
            <View style={styles.budgetPreview}>
              <Text style={styles.budgetPreviewLabel}>
                Allocated: ₱{allocation.calculated_budget.toFixed(2)}
              </Text>
              <Text style={styles.perWorkerText}>
                (₱{allocation.per_worker.toFixed(2)}/worker)
              </Text>
            </View>
          )
        )}

        {slot.notes && <Text style={styles.slotNotes}>📝 {slot.notes}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>Create Team Job</Text>
            <Text style={styles.pageSubtitle}>
              Post a multi-skill request in one form
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Home Renovation - Multiple Skills Needed"
                  maxLength={100}
                />
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the job in detail. What needs to be done? What are the requirements?"
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                />
                <Text style={styles.charCount}>{description.length}/1000</Text>
              </View>
            </View>

            {/* Skill Requirements Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>👥 Team Requirements</Text>
                <TouchableOpacity
                  style={styles.addSkillButton}
                  onPress={() => setAddSkillModalVisible(true)}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.addSkillButtonText}>Add Skill</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.hintText}>
                Add skills your team needs. You can add the same skill multiple
                times for different worker groups (e.g., 2 plumbers for
                bathroom, 1 plumber for kitchen).
              </Text>

              {skillSlots.length === 0 ? (
                <View style={styles.emptySkillsCard}>
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.emptySkillsText}>
                    No skills added yet. Add the skills you need for your team
                    job.
                  </Text>
                </View>
              ) : (
                <View style={styles.skillSlotsList}>
                  {skillSlots.map(renderSkillSlot)}

                  <View style={styles.totalWorkersCard}>
                    <Ionicons name="people" size={20} color={Colors.primary} />
                    <Text style={styles.totalWorkersText}>
                      Total Workers Needed: {totalWorkersNeeded}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Budget Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Budget</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Budget (₱) *</Text>
                <TextInput
                  style={styles.input}
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  placeholder="1000"
                  keyboardType="numeric"
                />
                <Text style={styles.hint}>
                  This is the total amount workers will receive for the entire
                  job.
                </Text>
              </View>

              {/* AI Price Suggestion Card */}
              {skillSlots.length > 0 &&
                (title.length >= 5 || description.length >= 10) && (
                  <PriceSuggestionCard
                    minPrice={
                      pricePrediction?.min_price
                        ? pricePrediction.min_price *
                          Math.max(1, totalWorkersNeeded)
                        : undefined
                    }
                    suggestedPrice={
                      pricePrediction?.suggested_price
                        ? pricePrediction.suggested_price *
                          Math.max(1, totalWorkersNeeded)
                        : undefined
                    }
                    maxPrice={
                      pricePrediction?.max_price
                        ? pricePrediction.max_price *
                          Math.max(1, totalWorkersNeeded)
                        : undefined
                    }
                    confidence={pricePrediction?.confidence}
                    source={pricePrediction?.source}
                    isLoading={isPredictingPrice}
                    error={pricePredictionError?.message}
                    onApplySuggested={handleApplySuggestedPrice}
                  />
                )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget Allocation Method</Text>
                <View style={styles.allocationOptions}>
                  {ALLOCATION_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.allocationOption,
                        allocationMethod === method.value &&
                          styles.allocationOptionSelected,
                      ]}
                      onPress={() => setAllocationMethod(method.value)}
                    >
                      <View style={styles.allocationOptionContent}>
                        <Text
                          style={[
                            styles.allocationOptionLabel,
                            allocationMethod === method.value &&
                              styles.allocationOptionLabelSelected,
                          ]}
                        >
                          {method.label}
                        </Text>
                        <Text style={styles.allocationOptionDesc}>
                          {method.description}
                        </Text>
                      </View>
                      {allocationMethod === method.value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Summary */}
              {budgetNum > 0 && (
                <View style={styles.paymentSummary}>
                  <Text style={styles.summaryTitle}>Payment Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Total Budget (Workers Receive)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{budgetNum.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      50% Escrow (Downpayment)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{escrowAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Platform Fee (5% of escrow)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₱{platformFee.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryLabelTotal}>Due Now</Text>
                    <Text style={styles.summaryValueTotal}>
                      ₱{totalDue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.walletBalanceRow}>
                    {walletError ? (
                      <Text style={styles.walletErrorText}>
                        ⚠️ Failed to load wallet balance. Please try again.
                      </Text>
                    ) : walletLoading ? (
                      <Text style={styles.walletLabel}>
                        Loading wallet balance...
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.walletLabel}>
                          Wallet Balance: ₱{walletBalance.toFixed(2)}
                        </Text>
                        {!hasEnoughBalance && (
                          <Text style={styles.insufficientText}>
                            (Need ₱{(totalDue - walletBalance).toFixed(2)} more)
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Team Start Threshold */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚀 Team Start Options</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Start When Team is {teamStartThreshold}% Filled
                </Text>
                <View style={styles.thresholdSlider}>
                  {[50, 75, 100].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.thresholdOption,
                        teamStartThreshold === value &&
                          styles.thresholdOptionSelected,
                      ]}
                      onPress={() => setTeamStartThreshold(value)}
                    >
                      <Text
                        style={[
                          styles.thresholdText,
                          teamStartThreshold === value &&
                            styles.thresholdTextSelected,
                        ]}
                      >
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.hint}>
                  {teamStartThreshold === 100
                    ? "Job will start only when ALL positions are filled."
                    : `Job can start when ${teamStartThreshold}% of positions are filled.`}
                </Text>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Location</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Barangay *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setBarangayModalVisible(true)}
                >
                  <Text
                    style={
                      barangay
                        ? styles.selectButtonText
                        : styles.selectButtonPlaceholder
                    }
                  >
                    {barangay || "Select barangay"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street / House No. *</Text>
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="e.g., 123 Main Street"
                />
              </View>
            </View>

            {/* Urgency & Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Timing</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyOptions}>
                  {[
                    { value: "LOW", label: "Low 🟢", color: Colors.success },
                    {
                      value: "MEDIUM",
                      label: "Medium 🟡",
                      color: Colors.warning,
                    },
                    { value: "HIGH", label: "High 🔴", color: Colors.error },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.urgencyOption,
                        urgency === opt.value && {
                          borderColor: opt.color,
                          backgroundColor: `${opt.color}10`,
                        },
                      ]}
                      onPress={() => setUrgency(opt.value as any)}
                    >
                      <Text style={styles.urgencyText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                  <Text
                    style={startDate ? styles.dateText : styles.datePlaceholder}
                  >
                    {startDate ? startDate.toLocaleDateString() : "Select date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Job Scope & Work Environment (for ML accuracy) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                📊 Job Details (for better pricing)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Scope</Text>
                <View style={styles.urgencyOptions}>
                  {[
                    { value: "MINOR_REPAIR", label: "🔧 Minor" },
                    { value: "MODERATE_PROJECT", label: "🛠️ Moderate" },
                    { value: "MAJOR_RENOVATION", label: "🏗️ Major" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.urgencyOption,
                        jobScope === opt.value && styles.jobScopeActive,
                      ]}
                      onPress={() => setJobScope(opt.value as any)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          jobScope === opt.value && styles.activeButtonText,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work Environment</Text>
                <View style={styles.urgencyOptions}>
                  {[
                    { value: "INDOOR", label: "🏠 Indoor" },
                    { value: "OUTDOOR", label: "🌳 Outdoor" },
                    { value: "BOTH", label: "🔄 Both" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.urgencyOption,
                        workEnvironment === opt.value && styles.workEnvActive,
                      ]}
                      onPress={() => setWorkEnvironment(opt.value as any)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          workEnvironment === opt.value &&
                            styles.activeButtonText,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Materials */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🧰 Materials Needed (Optional)
              </Text>

              <View style={styles.materialInputRow}>
                <TextInput
                  style={[styles.input, styles.materialInput]}
                  value={materialInput}
                  onChangeText={setMaterialInput}
                  placeholder="Add material"
                  onSubmitEditing={handleAddMaterial}
                />
                <TouchableOpacity
                  style={styles.addMaterialButton}
                  onPress={handleAddMaterial}
                >
                  <Ionicons name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {materials.length > 0 && (
                <View style={styles.materialsList}>
                  {materials.map((m, i) => (
                    <View key={i} style={styles.materialTag}>
                      <Text style={styles.materialTagText}>{m}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setMaterials(materials.filter((_, idx) => idx !== i))
                        }
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!hasEnoughBalance ||
                skillSlots.length === 0 ||
                createJobMutation.isPending) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              !hasEnoughBalance ||
              skillSlots.length === 0 ||
              createJobMutation.isPending
            }
          >
            {createJobMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Team Job</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Add Skill Modal */}
        <Modal
          visible={addSkillModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setAddSkillModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Skill Requirement</Text>
              <TouchableOpacity onPress={() => setAddSkillModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Search Skill/Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={specSearchQuery}
                  onChangeText={setSpecSearchQuery}
                  placeholder="e.g., Plumbing, Electrical, Carpentry"
                />
              </View>

              <Text style={styles.label}>Select Specialization</Text>
              <FlatList
                data={filteredSpecs}
                keyExtractor={(item) => item.id.toString()}
                style={styles.specList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.specItem,
                      selectedSpecialization?.id === item.id &&
                        styles.specItemSelected,
                    ]}
                    onPress={() => setSelectedSpecialization(item)}
                  >
                    <View>
                      <Text style={styles.specName}>{item.name}</Text>
                      <Text style={styles.specCategory}>
                        {item.category_name}
                      </Text>
                    </View>
                    {selectedSpecialization?.id === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyListText}>
                    {specsLoading ? "Loading..." : "No specializations found"}
                  </Text>
                }
              />

              {selectedSpecialization && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Workers Needed</Text>
                    <Text style={styles.hintText}>
                      Set the number of workers (1-10) for this skill. You can
                      add the same skill multiple times with different
                      requirements.
                    </Text>
                    <View style={styles.workersStepper}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() =>
                          setNewSlotWorkers(Math.max(1, newSlotWorkers - 1))
                        }
                      >
                        <Ionicons
                          name="remove"
                          size={24}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <Text style={styles.workersCountLarge}>
                        {newSlotWorkers}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() =>
                          setNewSlotWorkers(Math.min(10, newSlotWorkers + 1))
                        }
                      >
                        <Ionicons name="add" size={24} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Skill Level Required</Text>
                    <View style={styles.skillLevelOptions}>
                      {SKILL_LEVELS.map((level) => (
                        <TouchableOpacity
                          key={level.value}
                          style={[
                            styles.skillLevelOption,
                            newSlotLevel === level.value &&
                              styles.skillLevelOptionSelected,
                          ]}
                          onPress={() => setNewSlotLevel(level.value as any)}
                        >
                          <Text style={styles.skillLevelOptionText}>
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newSlotNotes}
                      onChangeText={setNewSlotNotes}
                      placeholder="Any specific requirements for this role?"
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={handleAddSkillSlot}
                  >
                    <Ionicons
                      name="add-circle"
                      size={24}
                      color={Colors.white}
                    />
                    <Text style={styles.modalAddButtonText}>
                      Add {newSlotWorkers} {selectedSpecialization.name} Worker
                      {newSlotWorkers > 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Barangay Selection Modal */}
        <Modal
          visible={barangayModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setBarangayModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setBarangayModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={barangays || []}
              keyExtractor={(item) => item.barangayID.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.barangayItem}
                  onPress={() => {
                    setBarangay(item.name);
                    setBarangayModalVisible(false);
                  }}
                >
                  <Text style={styles.barangayName}>{item.name}</Text>
                  {barangay === item.name && (
                    <Ionicons
                      name="checkmark"
                      size={24}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
  pageHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  pageTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardContent: {
    gap: Spacing.md,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Typography.body.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  hintText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontStyle: "italic",
  },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addSkillButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
  },
  emptySkillsCard: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptySkillsText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  skillSlotsList: {
    gap: Spacing.sm,
  },
  skillSlotCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  skillSlotInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  skillSlotName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  skillLevelBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillLevelText: {
    ...Typography.body.small,
    color: Colors.primary,
  },
  removeButton: {
    padding: 4,
  },
  workersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  workersLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  workersStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workersCount: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    minWidth: 30,
    textAlign: "center",
  },
  workersCountLarge: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
    minWidth: 50,
    textAlign: "center",
  },
  manualBudgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  budgetLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  manualBudgetInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    width: 100,
    ...Typography.body.medium,
    textAlign: "right",
  },
  budgetPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  budgetPreviewLabel: {
    ...Typography.body.medium,
    color: Colors.success,
  },
  perWorkerText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  slotNotes: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  totalWorkersCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalWorkersText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  allocationOptions: {
    gap: Spacing.sm,
  },
  allocationOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  allocationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  allocationOptionContent: {
    flex: 1,
  },
  allocationOptionLabel: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  allocationOptionLabelSelected: {
    color: Colors.primary,
  },
  allocationOptionDesc: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  paymentSummary: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  summaryTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  summaryLabelTotal: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  summaryValueTotal: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.primary,
  },
  walletBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    flexWrap: "wrap",
  },
  walletLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  walletErrorText: {
    ...Typography.body.small,
    color: Colors.error,
  },
  insufficientText: {
    ...Typography.body.small,
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
  thresholdSlider: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  thresholdOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  thresholdOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  thresholdText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  thresholdTextSelected: {
    color: Colors.primary,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  selectButtonText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  selectButtonPlaceholder: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  urgencyOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  urgencyOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  urgencyText: {
    ...Typography.body.medium,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  dateText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  materialInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  materialInput: {
    flex: 1,
  },
  addMaterialButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  materialsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  materialTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  materialTagText: {
    ...Typography.body.small,
    color: Colors.textPrimary,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.white,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
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
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  specList: {
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specItemSelected: {
    backgroundColor: Colors.primary + "10",
  },
  specName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  specCategory: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  emptyListText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    padding: Spacing.xl,
  },
  skillLevelOptions: {
    gap: Spacing.sm,
  },
  skillLevelOption: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  skillLevelOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  skillLevelOptionText: {
    ...Typography.body.medium,
    textAlign: "center",
  },
  modalAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  modalAddButtonText: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.white,
  },
  barangayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  barangayName: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  // Job Scope & Work Environment button active styles
  jobScopeActive: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning,
  },
  workEnvActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  activeButtonText: {
    color: Colors.white,
  },
});
