import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import * as ImagePicker from "expo-image-picker";
import { EstimatedTimeCard, type EstimatedCompletion } from "@/components";
import {
  useTeamJobDetail,
  useWorkerCompleteAssignment,
  useClientApproveTeamJob,
  type SkillSlot,
  type WorkerAssignment,
} from "@/lib/hooks/useTeamJob";

// ============================================================================
// Interfaces
// ============================================================================

interface ActiveJobDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location_city: string;
  location_barangay: string;
  status: "ASSIGNED" | "IN_PROGRESS";
  worker_marked_complete: boolean;
  client_marked_complete: boolean;
  completion_notes: string | null;
  assigned_at: string;
  started_at: string | null;
  worker_marked_complete_at: string | null;
  client: {
    id: number;
    name: string;
    avatar: string;
    phone: string;
  };
  worker: {
    id: number;
    name: string;
    avatar: string;
    phone: string;
  } | null;
  photos: Array<{
    id: number;
    url: string;
    file_name: string;
  }>;
  estimated_completion?: EstimatedCompletion | null;
  // Team Job Fields
  is_team_job?: boolean;
  skill_slots?: SkillSlot[];
  worker_assignments?: WorkerAssignment[];
  total_workers_needed?: number;
  total_workers_assigned?: number;
  team_fill_percentage?: number;
}

// ============================================================================
// Helper functions for team jobs
// ============================================================================

const getSkillLevelBadge = (level: string) => {
  switch (level) {
    case "ENTRY":
      return { label: "Entry", emoji: "🌱", color: "#10B981" };
    case "INTERMEDIATE":
      return { label: "Intermediate", emoji: "⭐", color: "#F59E0B" };
    case "EXPERT":
      return { label: "Expert", emoji: "👑", color: "#8B5CF6" };
    default:
      return { label: level, emoji: "📋", color: Colors.textSecondary };
  }
};

const getAssignmentStatusBadge = (status: string, markedComplete: boolean) => {
  if (markedComplete) {
    return { label: "Done", color: "#10B981", bg: "#D1FAE5" };
  }
  switch (status) {
    case "ACTIVE":
      return { label: "Working", color: "#3B82F6", bg: "#DBEAFE" };
    case "COMPLETED":
      return { label: "Done", color: "#10B981", bg: "#D1FAE5" };
    case "REMOVED":
      return { label: "Removed", color: "#EF4444", bg: "#FEE2E2" };
    case "WITHDRAWN":
      return { label: "Withdrawn", color: "#6B7280", bg: "#F3F4F6" };
    default:
      return {
        label: status,
        color: Colors.textSecondary,
        bg: Colors.background,
      };
  }
};

export default function ActiveJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAssignment, setSelectedAssignment] =
    useState<WorkerAssignment | null>(null);

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const currentWorkerId = user?.profile_data?.profileID;

  // Fetch job details
  const {
    data: job,
    isLoading,
    error,
    refetch,
  } = useQuery<ActiveJobDetail>({
    queryKey: ["jobs", "active", id],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(Number(id)));

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      return data; // Backend returns job data directly, not wrapped
    },
  });

  // Team job detail hook (for additional team data)
  const { data: teamJobData } = useTeamJobDetail(
    Number(id),
    !!job?.is_team_job
  );

  // Team job completion hooks
  const workerCompleteMutation = useWorkerCompleteAssignment();
  const clientApproveMutation = useClientApproveTeamJob();

  // Determine if this worker is assigned to this team job
  const myAssignment =
    job?.is_team_job && job?.worker_assignments
      ? job.worker_assignments.find((a) => a.worker_id === currentWorkerId)
      : null;

  // Check if all workers in team have marked complete
  const allWorkersComplete =
    job?.is_team_job && job?.worker_assignments
      ? job.worker_assignments.every((a) => a.worker_marked_complete)
      : false;

  // Count completed workers
  const completedWorkersCount =
    job?.worker_assignments?.filter((a) => a.worker_marked_complete).length ||
    0;

  // Upload photos helper function
  const uploadPhotos = async (jobId: string): Promise<boolean> => {
    if (uploadedPhotos.length === 0) return true;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadedPhotos.length; i++) {
        const photoUri = uploadedPhotos[i];

        // Create FormData for photo upload
        const formData = new FormData();

        // Get file extension from URI
        const uriParts = photoUri.split(".");
        const fileExtension = uriParts[uriParts.length - 1];
        const fileName = `completion_photo_${Date.now()}_${i}.${fileExtension}`;

        // Append file to FormData
        formData.append("image", {
          uri: photoUri,
          type: `image/${fileExtension}`,
          name: fileName,
        } as any);

        // Upload to backend
        const response = await apiRequest(
          `${ENDPOINTS.AVAILABLE_JOBS}/${jobId}/upload-image`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to upload photo ${i + 1}:`, errorData);
          throw new Error(`Failed to upload photo ${i + 1}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / uploadedPhotos.length) * 100);
      }

      return true;
    } catch (error) {
      console.error("Photo upload error:", error);
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Mark job as complete (worker)
  const markCompleteMutation = useMutation({
    mutationFn: async (data: { completion_notes: string }) => {
      // First, mark job as complete
      const response = await apiRequest(ENDPOINTS.MARK_COMPLETE(parseInt(id)), {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark job complete");
      }

      const result = await response.json();

      // Then upload photos if any
      if (uploadedPhotos.length > 0) {
        const uploadSuccess = await uploadPhotos(id);
        if (!uploadSuccess) {
          throw new Error(
            "Job marked complete, but some photos failed to upload"
          );
        }
      }

      return result;
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        uploadedPhotos.length > 0
          ? `Job marked as complete with ${uploadedPhotos.length} photo(s)! The client will review your work.`
          : "Job marked as complete! The client will review your work and approve completion."
      );
      setShowCompletionModal(false);
      setCompletionNotes("");
      setUploadedPhotos([]);
      queryClient.invalidateQueries({ queryKey: ["jobs", "active", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "active"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Approve completion (client)
  const approveCompletionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.APPROVE_COMPLETION(parseInt(id)),
        {
          method: "POST",
          body: JSON.stringify({ payment_method: "GCASH" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve completion");
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Job completion approved! Payment will be processed shortly.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
      queryClient.invalidateQueries({ queryKey: ["jobs", "active", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "active"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handlePickImages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - uploadedPhotos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset: any) => asset.uri);
        setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleMarkComplete = () => {
    if (!completionNotes.trim()) {
      Alert.alert(
        "Required",
        "Please add completion notes describing the work done"
      );
      return;
    }

    Alert.alert(
      "Confirm Completion",
      "Are you sure you want to mark this job as complete? The client will need to approve.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          onPress: () => {
            markCompleteMutation.mutate({ completion_notes: completionNotes });
          },
        },
      ]
    );
  };

  const handleApproveCompletion = () => {
    Alert.alert(
      "Approve Completion",
      "Are you satisfied with the work? Approving will release the payment to the worker.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => approveCompletionMutation.mutate(),
        },
      ]
    );
  };

  // ============================================================================
  // Team Job Handlers
  // ============================================================================

  const handleTeamWorkerComplete = (assignment: WorkerAssignment) => {
    setSelectedAssignment(assignment);
    setShowCompletionModal(true);
  };

  const handleTeamMarkComplete = () => {
    if (!completionNotes.trim()) {
      Alert.alert(
        "Required",
        "Please add completion notes describing the work done"
      );
      return;
    }

    if (!selectedAssignment) {
      Alert.alert("Error", "No assignment selected");
      return;
    }

    Alert.alert(
      "Confirm Completion",
      "Are you sure you want to mark your work as complete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          onPress: () => {
            workerCompleteMutation.mutate(
              {
                assignmentId: selectedAssignment.assignment_id,
                completionNotes: completionNotes,
              },
              {
                onSuccess: () => {
                  Alert.alert(
                    "Success",
                    "Your work has been marked as complete!"
                  );
                  setShowCompletionModal(false);
                  setCompletionNotes("");
                  setSelectedAssignment(null);
                  refetch();
                  queryClient.invalidateQueries({
                    queryKey: ["team-job", Number(id)],
                  });
                },
                onError: (error: any) => {
                  Alert.alert(
                    "Error",
                    error.message || "Failed to mark complete"
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleTeamApproveCompletion = () => {
    if (!allWorkersComplete) {
      Alert.alert(
        "Workers Not Complete",
        `${completedWorkersCount}/${job?.total_workers_needed || 0} workers have marked their work complete. All workers must complete their work first.`
      );
      return;
    }

    Alert.alert(
      "Approve Team Job",
      "Are you satisfied with all workers' work? Approving will release payment to all team members.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve All",
          onPress: () => {
            clientApproveMutation.mutate(
              { jobId: Number(id) },
              {
                onSuccess: () => {
                  Alert.alert(
                    "Success",
                    "Team job completed! Payments will be processed.",
                    [{ text: "OK", onPress: () => router.back() }]
                  );
                },
                onError: (error: any) => {
                  Alert.alert(
                    "Error",
                    error.message || "Failed to approve completion"
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load job details</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        {job.worker_marked_complete && !job.client_marked_complete && (
          <View style={styles.statusBanner}>
            <Ionicons name="time" size={24} color={Colors.warning} />
            <Text style={styles.statusBannerText}>
              {isWorker
                ? "Completion pending client approval"
                : "Worker marked complete - Review needed"}
            </Text>
          </View>
        )}

        {job.client_marked_complete && (
          <View style={[styles.statusBanner, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <Text style={[styles.statusBannerText, { color: "#065F46" }]}>
              Job completed successfully!
            </Text>
          </View>
        )}

        {/* Job Info */}
        <View style={styles.section}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCategory}>{job.category}</Text>
          <Text style={styles.jobDescription}>{job.description}</Text>
        </View>

        {/* Budget and Location */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>{job.budget}</Text>
          </View>
          <View style={styles.detailCard}>
            <Ionicons
              name="location-outline"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {job.location_barangay}, {job.location_city}
            </Text>
          </View>
        </View>

        {/* ML Estimated Completion Time - Countdown mode for active jobs */}
        {(isLoading ||
          (job.estimated_completion && !job.client_marked_complete)) && (
          <View style={styles.section}>
            <EstimatedTimeCard
              prediction={job?.estimated_completion || null}
              countdownMode={job?.status === "IN_PROGRESS" && !!job?.started_at}
              jobStartTime={job?.started_at || undefined}
              isLoading={isLoading}
            />
          </View>
        )}

        {/* Client/Worker Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isWorker ? "Client Information" : "Worker Information"}
          </Text>
          {isWorker ? (
            /* Client info - clickable for workers */
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                job.client?.id &&
                router.push(`/clients/${job.client.id}` as any)
              }
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: job.client.avatar || "https://via.placeholder.com/60",
                }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{job.client.name}</Text>
                <View style={styles.userContact}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.userPhone}>{job.client.phone}</Text>
                </View>
                <Text style={styles.tapToViewHint}>Tap to view profile</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            /* Worker info - clickable */
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                job.worker?.id &&
                router.push(`/workers/${job.worker.id}` as any)
              }
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: job.worker?.avatar || "https://via.placeholder.com/60",
                }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {job.worker?.name || "Unknown"}
                </Text>
                <View style={styles.userContact}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.userPhone}>
                    {job.worker?.phone || "N/A"}
                  </Text>
                </View>
                <Text style={styles.tapToViewHint}>Tap to view profile</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Completion Notes (if marked complete) */}
        {job.completion_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{job.completion_notes}</Text>
            </View>
          </View>
        )}

        {/* Job Photos */}
        {job.photos && job.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {job.photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  style={styles.photoThumbnail}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Team Job Section */}
        {job.is_team_job && job.skill_slots && job.skill_slots.length > 0 && (
          <View style={styles.section}>
            <View style={styles.teamJobHeader}>
              <View style={styles.teamBadge}>
                <Ionicons name="people" size={16} color={Colors.white} />
                <Text style={styles.teamBadgeText}>Team Job</Text>
              </View>
              <Text style={styles.teamFillText}>
                {job.total_workers_assigned || 0}/
                {job.total_workers_needed || 0} Workers Assigned
              </Text>
            </View>

            {/* Team Progress Bar */}
            <View style={styles.teamProgressContainer}>
              <View style={styles.teamProgressBar}>
                <View
                  style={[
                    styles.teamProgressFill,
                    { width: `${job.team_fill_percentage || 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.teamProgressText}>
                {Math.round(job.team_fill_percentage || 0)}% Filled
              </Text>
            </View>

            {/* Skill Slots */}
            <Text style={styles.subsectionTitle}>Skill Requirements</Text>
            {job.skill_slots.map((slot: SkillSlot) => (
              <View key={slot.skill_slot_id} style={styles.skillSlotCard}>
                <View style={styles.skillSlotHeader}>
                  <Text style={styles.skillSlotName}>
                    {slot.specialization_name}
                  </Text>
                  {getSkillLevelBadge(slot.skill_level)}
                </View>
                <View style={styles.skillSlotMeta}>
                  <View style={styles.skillSlotMetaItem}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.skillSlotMetaText}>
                      {slot.workers_assigned}/{slot.workers_needed} workers
                    </Text>
                  </View>
                  <View style={styles.skillSlotMetaItem}>
                    <Ionicons
                      name="cash-outline"
                      size={14}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.skillSlotMetaText}>
                      ₱{slot.budget_allocated?.toLocaleString() || "0"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.slotStatusBadge,
                      slot.status === "FILLED"
                        ? styles.slotStatusFilled
                        : slot.status === "PARTIAL"
                          ? styles.slotStatusPartial
                          : styles.slotStatusOpen,
                    ]}
                  >
                    <Text style={styles.slotStatusText}>{slot.status}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Worker Assignments */}
            {job.worker_assignments && job.worker_assignments.length > 0 && (
              <>
                <Text
                  style={[styles.subsectionTitle, { marginTop: Spacing.lg }]}
                >
                  Assigned Workers ({completedWorkersCount}/
                  {job.worker_assignments.length} Complete)
                </Text>
                {job.worker_assignments.map((assignment: WorkerAssignment) => (
                  <View
                    key={assignment.assignment_id}
                    style={styles.assignmentCard}
                  >
                    <View style={styles.assignmentHeader}>
                      <Image
                        source={{
                          uri:
                            assignment.worker_avatar ||
                            "https://via.placeholder.com/40",
                        }}
                        style={styles.assignmentAvatar}
                      />
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentWorkerName}>
                          {assignment.worker_name}
                        </Text>
                        <Text style={styles.assignmentSlot}>
                          {assignment.slot_specialization}
                        </Text>
                      </View>
                      {getAssignmentStatusBadge(assignment.assignment_status)}
                    </View>

                    {/* Worker Completion Status */}
                    <View style={styles.assignmentStatus}>
                      <View style={styles.assignmentStatusItem}>
                        <Ionicons
                          name={
                            assignment.worker_marked_complete
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={18}
                          color={
                            assignment.worker_marked_complete
                              ? Colors.success
                              : Colors.textHint
                          }
                        />
                        <Text
                          style={[
                            styles.assignmentStatusText,
                            assignment.worker_marked_complete &&
                              styles.assignmentStatusComplete,
                          ]}
                        >
                          {assignment.worker_marked_complete
                            ? "Work Completed"
                            : "In Progress"}
                        </Text>
                      </View>
                      {assignment.completion_notes && (
                        <Text style={styles.assignmentNotes} numberOfLines={2}>
                          "{assignment.completion_notes}"
                        </Text>
                      )}
                    </View>

                    {/* Worker's own assignment - show mark complete button */}
                    {isWorker &&
                      assignment.worker_id === currentWorkerId &&
                      !assignment.worker_marked_complete && (
                        <TouchableOpacity
                          style={styles.assignmentActionButton}
                          onPress={() => {
                            setSelectedAssignment(assignment);
                            setShowCompletionModal(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color={Colors.white}
                          />
                          <Text style={styles.assignmentActionText}>
                            Mark My Work Complete
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                ))}

                {/* Client: Approve All Workers Button */}
                {!isWorker &&
                  allWorkersComplete &&
                  !job.client_marked_complete && (
                    <TouchableOpacity
                      style={styles.approveAllButton}
                      onPress={handleTeamApproveCompletion}
                      disabled={clientApproveMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {clientApproveMutation.isPending ? (
                        <ActivityIndicator color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-done"
                            size={20}
                            color={Colors.white}
                          />
                          <Text style={styles.approveAllText}>
                            Approve All & Complete Job
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* Client waiting message */}
                {!isWorker && !allWorkersComplete && (
                  <View style={styles.waitingMessage}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.warning}
                    />
                    <Text style={styles.waitingMessageText}>
                      Waiting for{" "}
                      {job.worker_assignments.length - completedWorkersCount}{" "}
                      worker(s) to complete
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Job Assigned</Text>
                <Text style={styles.timelineTime}>{job.assigned_at}</Text>
              </View>
            </View>

            {job.started_at && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons
                    name="play-circle"
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Work Started</Text>
                  <Text style={styles.timelineTime}>{job.started_at}</Text>
                </View>
              </View>
            )}

            {job.worker_marked_complete_at && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={20}
                    color={Colors.warning}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Worker Marked Complete
                  </Text>
                  <Text style={styles.timelineTime}>
                    {job.worker_marked_complete_at}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      {isWorker && !job.worker_marked_complete && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowCompletionModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={Colors.white}
            />
            <Text style={styles.primaryButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isWorker &&
        job.worker_marked_complete &&
        !job.client_marked_complete && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleApproveCompletion}
              disabled={approveCompletionMutation.isPending}
              activeOpacity={0.8}
            >
              {approveCompletionMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={24}
                    color={Colors.white}
                  />
                  <Text style={styles.primaryButtonText}>
                    Approve Completion
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mark Job Complete</Text>
            <TouchableOpacity
              onPress={() => setShowCompletionModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Completion Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Completion Notes <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the work you completed..."
                placeholderTextColor={Colors.textHint}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photos (Optional)</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickImages}
                disabled={uploadedPhotos.length >= 10}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.uploadButtonText}>
                  Add Photos ({uploadedPhotos.length}/10)
                </Text>
              </TouchableOpacity>

              {uploadedPhotos.length > 0 && (
                <View style={styles.photoGrid}>
                  {uploadedPhotos.map((uri, index) => (
                    <View key={index} style={styles.photoPreview}>
                      <Image
                        source={{ uri }}
                        style={styles.photoPreviewImage}
                      />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={Colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadProgress}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Uploading photos... {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (markCompleteMutation.isPending || isUploading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleMarkComplete}
              disabled={markCompleteMutation.isPending || isUploading}
              activeOpacity={0.8}
            >
              {markCompleteMutation.isPending || isUploading ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    {isUploading ? "Uploading..." : "Submitting..."}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "#FEF3C7",
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: "#92400E",
  },
  section: {
    padding: Spacing.lg,
  },
  jobTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  jobCategory: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  userContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  userPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  tapToViewHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  notesCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  notesText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
  },
  timeline: {
    gap: Spacing.md,
  },
  timelineItem: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 140,
    textAlignVertical: "top",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.primary,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoPreview: {
    width: 100,
    height: 100,
    position: "relative",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.error,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  uploadProgress: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Team Job Styles
  teamJobHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  teamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  teamBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  teamFillText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  teamProgressContainer: {
    marginBottom: Spacing.lg,
  },
  teamProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  teamProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  teamProgressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  skillSlotCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  skillSlotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  skillSlotName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  skillLevelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  skillLevelBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
  },
  skillSlotMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  skillSlotMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skillSlotMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  slotStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  slotStatusFilled: {
    backgroundColor: "#D1FAE5",
  },
  slotStatusPartial: {
    backgroundColor: "#FEF3C7",
  },
  slotStatusOpen: {
    backgroundColor: "#FEE2E2",
  },
  slotStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  assignmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  assignmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentWorkerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  assignmentSlot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  assignmentStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  assignmentStatusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
  },
  assignmentStatus: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  assignmentStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  assignmentStatusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  assignmentStatusComplete: {
    color: Colors.success,
    fontWeight: "500",
  },
  assignmentNotes: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  assignmentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  assignmentActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  approveAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  approveAllText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  waitingMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FEF3C7",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  waitingMessageText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: "#92400E",
  },
});
