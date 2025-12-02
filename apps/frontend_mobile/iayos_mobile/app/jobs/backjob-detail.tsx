import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BackjobDetail {
  has_backjob: boolean;
  dispute: {
    dispute_id: number;
    reason: string;
    description: string;
    status: string;
    priority: string;
    opened_date: string | null;
    resolution: string | null;
    resolved_date: string | null;
    evidence_images: string[];
  } | null;
}

interface JobInfo {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  category: string;
  client: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
}

export default function BackjobDetailScreen() {
  const params = useLocalSearchParams();
  const disputeId = params.disputeId as string;
  const jobId = params.jobId as string;

  const [backjob, setBackjob] = useState<BackjobDetail | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchBackjobDetails();
  }, [jobId]);

  const fetchBackjobDetails = async () => {
    try {
      // Fetch backjob status
      const backjobResponse = await apiRequest(
        ENDPOINTS.BACKJOB_STATUS(parseInt(jobId))
      );
      if (backjobResponse.ok) {
        const data = await backjobResponse.json();
        setBackjob(data);
      }

      // Fetch job details
      const jobResponse = await apiRequest(
        ENDPOINTS.JOB_DETAILS(parseInt(jobId))
      );
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob({
          id: jobData.id || jobData.jobID,
          title: jobData.title,
          description: jobData.description,
          budget: jobData.budget,
          location: jobData.location,
          category: jobData.category?.name || jobData.category || "Unknown",
          client: jobData.client || null,
        });
      }
    } catch (error) {
      console.error("Error fetching backjob details:", error);
      Alert.alert("Error", "Failed to load backjob details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteBackjob = () => {
    Alert.alert(
      "Complete Backjob",
      "Are you sure you have completed the backjob work? The client will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          onPress: async () => {
            setIsCompleting(true);
            try {
              const formData = new FormData();
              formData.append("notes", "Backjob work completed");

              const response = await apiRequest(
                ENDPOINTS.COMPLETE_BACKJOB(parseInt(jobId)),
                {
                  method: "POST",
                  body: formData,
                }
              );

              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  "Success",
                  data.message || "Backjob marked as completed!",
                  [{ text: "OK", onPress: () => router.back() }]
                );
              } else {
                const error = await response.json();
                Alert.alert(
                  "Error",
                  error.error || "Failed to complete backjob"
                );
              }
            } catch (error) {
              console.error("Error completing backjob:", error);
              Alert.alert("Error", "Failed to complete backjob");
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "OPEN":
        return { label: "Pending Review", color: Colors.info, icon: "time" };
      case "UNDER_REVIEW":
        return {
          label: "Action Required",
          color: Colors.warning,
          icon: "alert-circle",
        };
      case "RESOLVED":
        return {
          label: "Completed",
          color: Colors.success,
          icon: "checkmark-circle",
        };
      case "CLOSED":
        return {
          label: "Closed",
          color: Colors.textSecondary,
          icon: "close-circle",
        };
      default:
        return {
          label: status,
          color: Colors.textSecondary,
          icon: "help-circle",
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { label: "Critical", color: Colors.error };
      case "HIGH":
        return { label: "High Priority", color: Colors.error };
      case "MEDIUM":
        return { label: "Medium Priority", color: Colors.warning };
      default:
        return { label: "Low Priority", color: Colors.textSecondary };
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading backjob details...</Text>
      </View>
    );
  }

  if (!backjob?.has_backjob || !backjob.dispute) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Backjob Not Found</Text>
        <Text style={styles.errorText}>
          The backjob you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          style={styles.backButtonLarge}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dispute = backjob.dispute;
  const statusInfo = getStatusInfo(dispute.status);
  const priorityInfo = getPriorityInfo(dispute.priority);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backjob Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View
          style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}
        >
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusInfo.color}20` },
              ]}
            >
              <Ionicons
                name={statusInfo.icon as any}
                size={18}
                color={statusInfo.color}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: `${priorityInfo.color}15` },
              ]}
            >
              <Text
                style={[styles.priorityText, { color: priorityInfo.color }]}
              >
                {priorityInfo.label}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            {dispute.status === "UNDER_REVIEW"
              ? "Please review and complete the backjob work requested by the client."
              : dispute.status === "RESOLVED"
                ? "This backjob has been completed successfully."
                : "This backjob request is pending admin review."}
          </Text>
        </View>

        {/* Job Info */}
        {job && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Job</Text>
            <View style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.jobMeta}>
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
                    name="location-outline"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {job.location}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Client Info */}
        {job?.client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.clientCard}>
              {job.client.avatar ? (
                <Image
                  source={{ uri: job.client.avatar }}
                  style={styles.clientAvatar}
                />
              ) : (
                <View style={[styles.clientAvatar, styles.avatarPlaceholder]}>
                  <Ionicons
                    name="person"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </View>
              )}
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{job.client.name}</Text>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.contactButtonText}>Contact Client</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Backjob Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Backjob</Text>
          <View style={styles.infoCard}>
            <Text style={styles.reason}>{dispute.reason}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Description</Text>
          <View style={styles.infoCard}>
            <Text style={styles.description}>{dispute.description}</Text>
          </View>
        </View>

        {/* Evidence Images */}
        {dispute.evidence_images && dispute.evidence_images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Evidence Photos ({dispute.evidence_images.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.evidenceScroll}
            >
              {dispute.evidence_images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.evidenceImageContainer}
                  onPress={() => openImageViewer(index)}
                >
                  <Image source={{ uri }} style={styles.evidenceImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View
                style={[styles.timelineDot, { backgroundColor: Colors.info }]}
              />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Requested</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(dispute.opened_date)}
                </Text>
              </View>
            </View>
            {dispute.resolved_date && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: Colors.success },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Completed</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(dispute.resolved_date)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Resolution */}
        {dispute.resolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: `${Colors.success}10` },
              ]}
            >
              <Text style={styles.resolution}>{dispute.resolution}</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {dispute.status === "UNDER_REVIEW" && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              isCompleting && styles.buttonDisabled,
            ]}
            onPress={handleCompleteBackjob}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent animationType="fade">
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeImageViewer}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.imageCounter}>
            {selectedImageIndex + 1} / {dispute.evidence_images?.length || 0}
          </Text>
          {dispute.evidence_images &&
            dispute.evidence_images[selectedImageIndex] && (
              <Image
                source={{ uri: dispute.evidence_images[selectedImageIndex] }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          <View style={styles.imageNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
              }
              disabled={selectedImageIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={selectedImageIndex === 0 ? "#666" : "#FFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                setSelectedImageIndex(
                  Math.min(
                    (dispute.evidence_images?.length || 1) - 1,
                    selectedImageIndex + 1
                  )
                )
              }
              disabled={
                selectedImageIndex ===
                (dispute.evidence_images?.length || 1) - 1
              }
            >
              <Ionicons
                name="chevron-forward"
                size={28}
                color={
                  selectedImageIndex ===
                  (dispute.evidence_images?.length || 1) - 1
                    ? "#666"
                    : "#FFF"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  jobCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  jobMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reason: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  resolution: {
    fontSize: 14,
    color: Colors.success,
    lineHeight: 22,
  },
  evidenceScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  evidenceImageContainer: {
    width: 140,
    height: 105,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  timeline: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeImageViewer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageCounter: {
    position: "absolute",
    top: 68,
    left: 20,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  imageNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 100,
  },
  navButton: {
    padding: 12,
  },
});
