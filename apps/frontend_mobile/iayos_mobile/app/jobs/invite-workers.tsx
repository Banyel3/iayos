import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, fetchJson, getAbsoluteMediaUrl } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import type { Worker } from "@/lib/hooks/useWorkers";

// Backend worker shape (from NEARBY_WORKERS endpoint)
interface BackendWorker {
  worker_id: number;
  name: string;
  profile_img?: string;
  bio?: string;
  hourly_rate?: number;
  availability_status: string;
  average_rating?: number;
  completed_jobs?: number;
  distance_km?: number;
  skills?: Array<{ id: number; name: string }>;
  specializations?: Array<{ id: number; name: string }>;
}

export default function InviteWorkersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { jobId, categoryId } = useLocalSearchParams<{
    jobId: string;
    categoryId?: string;
  }>();
  const queryClient = useQueryClient();
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());

  // Fetch already-invited worker IDs
  const { data: invitedData } = useQuery({
    queryKey: ["invited-workers", jobId],
    queryFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.INVITED_WORKERS(parseInt(jobId))
      );
      const data = await response.json();
      return data as { success: boolean; invited_worker_ids: number[] };
    },
    enabled: !!jobId,
  });

  // Merge server-side invited IDs with local state
  const allInvitedIds = new Set([
    ...invitedIds,
    ...(invitedData?.invited_worker_ids || []),
  ]);

  // Fetch nearby workers, filtered by category if available
  const {
    data: workersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workers", "invite", categoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append("category", categoryId);
      params.append("limit", "50");

      // Use client location if available
      const lat = user?.profile_data?.latitude;
      const lon = user?.profile_data?.longitude;
      if (lat) params.append("latitude", String(lat));
      if (lon) params.append("longitude", String(lon));

      const url = `${ENDPOINTS.NEARBY_WORKERS}?${params.toString()}`;
      const data = await fetchJson<{
        workers: BackendWorker[];
        total_count: number;
      }>(url, { method: "GET" });
      return data;
    },
  });

  // Transform workers
  const workers: Worker[] = (workersData?.workers || []).map((w) => {
    const specs = w.skills || w.specializations || [];
    return {
      id: w.worker_id,
      name: w.name,
      avatar: getAbsoluteMediaUrl(w.profile_img) || undefined,
      rating: w.average_rating || 0,
      completedJobs: w.completed_jobs || 0,
      categories: specs.map((s) => s.name || ""),
      hourlyRate: w.hourly_rate,
      distance: w.distance_km,
      bio: w.bio,
      isAvailable: w.availability_status === "AVAILABLE",
    };
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (workerId: number) => {
      const response = await apiRequest(
        ENDPOINTS.INVITE_WORKER(parseInt(jobId)),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ worker_id: workerId }),
        }
      );
      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to invite worker");
      }
      return data;
    },
    onSuccess: (data, workerId) => {
      setInvitedIds((prev) => new Set([...prev, workerId]));
      Alert.alert("Invited!", data.message || "Worker has been invited");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleInvite = useCallback(
    (workerId: number, workerName: string) => {
      Alert.alert(
        "Invite Worker",
        `Send a job invitation to ${workerName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Invite",
            onPress: () => inviteMutation.mutate(workerId),
          },
        ]
      );
    },
    [inviteMutation]
  );

  const renderWorker = useCallback(
    ({ item }: { item: Worker }) => {
      const isInvited = allInvitedIds.has(item.id);

      return (
        <View style={styles.workerCard}>
          <View style={styles.workerInfo}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person"
                  size={24}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.workerDetails}>
              <Text style={styles.workerName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.workerMeta}>
                {item.rating > 0 ? (
                  <>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {item.rating.toFixed(1)}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.ratingText, { color: Colors.textSecondary }]}>
                    New
                  </Text>
                )}
                {item.completedJobs > 0 && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>
                      {item.completedJobs} jobs
                    </Text>
                  </>
                )}
                {item.distance != null && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>
                      {item.distance.toFixed(1)} km
                    </Text>
                  </>
                )}
              </View>
              {item.categories.length > 0 && (
                <Text
                  style={styles.categoriesText}
                  numberOfLines={1}
                >
                  {item.categories.join(", ")}
                </Text>
              )}
            </View>
          </View>

          {/* Invite / Invited button */}
          {isInvited ? (
            <View style={styles.invitedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.invitedText}>Invited</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => handleInvite(item.id, item.name)}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending &&
              inviteMutation.variables === item.id ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [allInvitedIds, handleInvite, inviteMutation]
  );

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Invite Workers</Text>
          <Text style={styles.headerSubtitle}>
            {workers.length} worker{workers.length !== 1 ? "s" : ""} available
          </Text>
        </View>
      </View>

      {/* Workers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding available workers...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />
          <Text style={styles.emptyText}>Failed to load workers</Text>
        </View>
      ) : workers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No workers found</Text>
          <Text style={styles.emptySubtext}>
            Try again later or post your job to attract applications
          </Text>
        </View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderWorker}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  workerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  workerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  metaDot: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoriesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    marginLeft: 8,
  },
  inviteButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  invitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    marginLeft: 8,
  },
  invitedText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: "600",
  },
});
