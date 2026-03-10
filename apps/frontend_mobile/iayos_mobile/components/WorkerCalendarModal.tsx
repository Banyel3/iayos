import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "../constants/theme";
import { apiRequest, ENDPOINTS } from "../lib/api/config";
import {
  useWorkerSchedule,
  buildMarkedDates,
  getJobsForDate,
  ScheduledJob,
} from "../lib/hooks/useWorkerSchedule";

interface WorkerCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WorkerCalendarModal({
  visible,
  onClose,
}: WorkerCalendarModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useWorkerSchedule();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const jobs = data?.jobs ?? [];
  const markedDates = buildMarkedDates(jobs);

  // Highlight selected date
  const markedWithSelected: Record<string, any> = { ...markedDates };
  if (selectedDate) {
    markedWithSelected[selectedDate] = {
      ...(markedWithSelected[selectedDate] || {}),
      selected: true,
      selectedColor: Colors.primary,
    };
  }

  const selectedJobs: ScheduledJob[] = selectedDate
    ? getJobsForDate(jobs, selectedDate)
    : [];

  const today = new Date().toISOString().split("T")[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS": return "#10B981";
      case "ACTIVE": return "#3B82F6";
      case "COMPLETED": return "#6B7280";
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_PROGRESS": return "In Progress";
      case "ACTIVE": return "Scheduled";
      case "COMPLETED": return "Completed";
      default: return status;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Schedule</Text>
              <Text style={styles.subtitle}>
                {jobs.length === 0
                  ? "No calendar jobs"
                  : `${jobs.length} calendar job${jobs.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={40} color={Colors.error} />
              <Text style={styles.errorText}>Failed to load schedule</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Calendar
                markingType="multi-dot"
                markedDates={markedWithSelected}
                onDayPress={(day) => {
                  setSelectedDate(
                    selectedDate === day.dateString ? null : day.dateString
                  );
                }}
                current={today}
                theme={{
                  backgroundColor: Colors.background,
                  calendarBackground: Colors.background,
                  textSectionTitleColor: Colors.textSecondary,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: "#fff",
                  todayTextColor: Colors.primary,
                  dayTextColor: Colors.textPrimary,
                  textDisabledColor: Colors.textHint,
                  dotColor: Colors.primary,
                  selectedDotColor: "#fff",
                  arrowColor: Colors.primary,
                  monthTextColor: Colors.textPrimary,
                  indicatorColor: Colors.primary,
                }}
                style={styles.calendar}
              />

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                  <Text style={styles.legendText}>Scheduled</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                  <Text style={styles.legendText}>In Progress</Text>
                </View>
              </View>

              {/* Selected date jobs */}
              {selectedDate && (
                <View style={styles.selectedSection}>
                  <Text style={styles.selectedDateTitle}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Text>

                  {selectedJobs.length === 0 ? (
                    <Text style={styles.noJobsText}>No jobs scheduled for this date</Text>
                  ) : (
                    <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
                      {selectedJobs.map((job) => (
                        <TouchableOpacity
                          key={job.id}
                          style={styles.jobCard}
                          onPress={async () => {
                            try {
                              const response = await apiRequest(
                                ENDPOINTS.CONVERSATION_BY_JOB(job.id)
                              );
                              const data = await response.json();

                              onClose();
                              if (data?.success && data?.conversation_id) {
                                router.push(`/conversation/${data.conversation_id}` as any);
                              } else {
                                router.push(`/messages` as any);
                              }
                            } catch {
                              onClose();
                              router.push(`/messages` as any);
                            }
                          }}
                        >
                          <View style={styles.jobCardInner}>
                            <View style={styles.jobCardLeft}>
                              <Text style={styles.jobTitle} numberOfLines={1}>
                                {job.title}
                              </Text>
                              <Text style={styles.jobLocation} numberOfLines={1}>
                                <Ionicons
                                  name="location-outline"
                                  size={12}
                                  color={Colors.textSecondary}
                                />{" "}
                                {job.location}
                              </Text>
                              <Text style={styles.jobDates}>
                                {new Date(job.preferred_start_date + "T00:00:00").toLocaleDateString(
                                  undefined, { month: "short", day: "numeric" }
                                )}{" "}
                                →{" "}
                                {new Date(job.scheduled_end_date + "T00:00:00").toLocaleDateString(
                                  undefined, { month: "short", day: "numeric" }
                                )}
                              </Text>
                            </View>
                            <View style={styles.jobCardRight}>
                              <View
                                style={[
                                  styles.statusBadge,
                                  { backgroundColor: getStatusColor(job.status) + "22" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusText,
                                    { color: getStatusColor(job.status) },
                                  ]}
                                >
                                  {getStatusLabel(job.status)}
                                </Text>
                              </View>
                              <Text style={styles.jobBudget}>
                                ₱{job.budget.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "94%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legend: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  noJobsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  jobsList: {
    flex: 1,
    minHeight: 140,
  },
  jobCard: {
    backgroundColor: Colors.cardBackground || "#fff",
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobCardLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  jobLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  jobDates: {
    fontSize: 11,
    color: Colors.textHint,
  },
  jobCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  jobBudget: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
