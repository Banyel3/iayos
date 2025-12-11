import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SelectRoleScreen() {
  const [selectedRole, setSelectedRole] = useState<"WORKER" | "CLIENT" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { assignRole } = useAuth();
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Error", "Please select a role to continue");
      return;
    }

    setIsLoading(true);
    try {
      const success = await assignRole(selectedRole);
      if (success) {
        // Redirect to home after successful role assignment
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to assign role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use iAyos. You can change this later in
            settings.
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {/* Worker Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "WORKER" && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole("WORKER")}
            disabled={isLoading}
          >
            <View style={styles.roleIconContainer}>
              <View style={styles.roleIconBadge}>
                <Ionicons
                  name="construct"
                  size={40}
                  color={
                    selectedRole === "WORKER"
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
              </View>
            </View>
            <Text
              style={[
                styles.roleTitle,
                selectedRole === "WORKER" && styles.roleTitleSelected,
              ]}
            >
              I&apos;m a Worker
            </Text>
            <Text style={styles.roleDescription}>
              Find jobs, offer your services, and earn income by helping clients
              with their tasks.
            </Text>
            <View style={styles.featuresRow}>
              <View style={styles.featurePill}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Jobs Feed</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Secure Pay</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons
                  name="star-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Ratings</Text>
              </View>
            </View>
            {selectedRole === "WORKER" && (
              <View style={styles.checkmark}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.primary}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Client Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "CLIENT" && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole("CLIENT")}
            disabled={isLoading}
          >
            <View style={styles.roleIconContainer}>
              <View style={styles.roleIconBadge}>
                <Ionicons
                  name="people"
                  size={40}
                  color={
                    selectedRole === "CLIENT"
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
              </View>
            </View>
            <Text
              style={[
                styles.roleTitle,
                selectedRole === "CLIENT" && styles.roleTitleSelected,
              ]}
            >
              I&apos;m a Client
            </Text>
            <Text style={styles.roleDescription}>
              Post jobs, hire skilled workers, and get your tasks completed
              quickly and professionally.
            </Text>
            <View style={styles.featuresRow}>
              <View style={styles.featurePill}>
                <Ionicons
                  name="megaphone-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Post Jobs</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Escrow</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>Chat</Text>
              </View>
            </View>
            {selectedRole === "CLIENT" && (
              <View style={styles.checkmark}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.primary}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  rolesContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl * 2,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    position: "relative",
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleIconContainer: {
    marginBottom: Spacing.md,
  },
  roleIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleTitleSelected: {
    color: Colors.primary,
  },
  roleDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    backgroundColor: "rgba(46, 125, 255, 0.08)",
  },
  featureText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  checkmark: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
