// app/profile/avatar.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AvatarUpload } from "@/components/AvatarUpload";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface WorkerProfile {
  id: number;
  avatarUrl: string | null;
  fullName: string;
  email: string;
  profileCompletionPercentage: number;
}

export default function AvatarUploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch current profile
  const { data: profile, isLoading } = useQuery<WorkerProfile>({
    queryKey: ["workerProfile"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WORKER_PROFILE);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete avatar mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.DELETE_AVATAR, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete avatar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      Alert.alert("Success", "Avatar removed successfully");
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to remove avatar"
      );
    },
  });

  const handleUploadSuccess = (avatarUrl: string) => {
    setUploadSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] });

    setTimeout(() => {
      Alert.alert("Success!", "Your avatar has been updated successfully.", [
        {
          text: "OK",
          onPress: () => safeGoBack(router, "/(tabs)/profile"),
        },
      ]);
    }, 500);
  };

  const handleUploadError = (error: string) => {
    Alert.alert("Upload Failed", error);
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Avatar",
      "Are you sure you want to remove your avatar? This will decrease your profile completion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Avatar</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Avatar Upload */}
      <View style={styles.avatarSection}>
        <AvatarUpload
          currentAvatarUrl={profile?.avatarUrl}
          size={150}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          onDelete={handleDelete}
          editable={true}
          showEditOverlay={true}
        />

        {uploadSuccess && (
          <View style={styles.successBadge}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.successText}>Updated!</Text>
          </View>
        )}
      </View>

      {/* Instructions Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="information-circle"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.cardTitle}>Photo Requirements</Text>
        </View>

        <View style={styles.requirementsList}>
          <View style={styles.requirementItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.requirementText}>JPEG or PNG format</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.requirementText}>Maximum 5MB file size</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.requirementText}>
              Recommended: 300x300 pixels or larger
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.requirementText}>
              Clear photo of your face (professional)
            </Text>
          </View>
        </View>
      </View>

      {/* Tips Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={24} color={Colors.warning} />
          <Text style={styles.cardTitle}>Tips for Great Photos</Text>
        </View>

        <Text style={styles.tipText}>
          • Use good lighting (natural light works best)
        </Text>
        <Text style={styles.tipText}>• Face the camera directly</Text>
        <Text style={styles.tipText}>• Avoid sunglasses or hats</Text>
        <Text style={styles.tipText}>• Smile naturally</Text>
        <Text style={styles.tipText}>• Use a plain background</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {profile?.avatarUrl && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                <Text style={styles.removeButtonText}>Remove Avatar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Completion Note */}
      {profile?.profileCompletionPercentage !== undefined && (
        <View style={styles.completionNote}>
          <Ionicons name="trophy" size={20} color={Colors.primary} />
          <Text style={styles.completionText}>
            Adding an avatar increases your profile completion by 12.5%!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.successLight || "#E8F5E9",
    borderRadius: BorderRadius.full,
  },
  successText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.success,
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  requirementsList: {
    gap: Spacing.sm,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  actions: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.surface,
  },
  removeButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.error,
  },
  completionNote: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight || "#E3F2FD",
    borderRadius: BorderRadius.md,
  },
  completionText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    flex: 1,
  },
});
