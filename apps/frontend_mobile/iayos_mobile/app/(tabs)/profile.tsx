import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "react-native-paper";
import { useUnreadNotificationsCount } from "@/lib/hooks/useNotifications";
import { useProfileMetrics } from "@/lib/hooks/useProfileMetrics";
import { useWallet, WalletData } from "@/lib/hooks/useWallet";
import { formatCurrency } from "@/lib/hooks/usePayments";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Get unread notifications count
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWallet();
  const typedWalletData = walletData as WalletData | undefined;
  const walletBalanceValue =
    typeof typedWalletData?.balance === "number" ? typedWalletData.balance : 0;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const fullName =
    `${user?.profile_data?.firstName || ""} ${
      user?.profile_data?.lastName || ""
    }`.trim() || "User";
  const initial = (
    user?.profile_data?.firstName?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  const hasProfileType = Boolean(user?.profile_data?.profileType);
  const shouldFetchMetrics = hasProfileType && !isWorker;
  const {
    data: profileMetrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useProfileMetrics({ enabled: shouldFetchMetrics });

  const renderTrustMetrics = () => {
    if (!shouldFetchMetrics) {
      return null;
    }

    if (isMetricsLoading) {
      return (
        <View style={styles.metricLoadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={[styles.metricHelper, styles.metricLoadingText]}>
            Loading trust metrics…
          </Text>
        </View>
      );
    }

    if (isMetricsError) {
      return (
        <View style={styles.metricErrorContainer}>
          <Text style={styles.metricErrorText}>
            Unable to load trust metrics. Pull to refresh later.
          </Text>
        </View>
      );
    }

    if (!profileMetrics) {
      return (
        <View style={styles.metricErrorContainer}>
          <Text style={styles.metricHelper}>
            Post jobs and respond to applications to build your trust stats.
          </Text>
        </View>
      );
    }

    const paymentVerified = profileMetrics.payment_method_verified;
    const paymentHelper = paymentVerified
      ? profileMetrics.payment_method_verified_at
        ? `Verified ${new Date(
            profileMetrics.payment_method_verified_at
          ).toLocaleDateString()}`
        : "Wallet ready"
      : "Add funds to verify";

    const responseRateValue =
      typeof profileMetrics.response_rate === "number"
        ? profileMetrics.response_rate
        : null;
    const responseSamples = profileMetrics.response_rate_sample || 0;
    const responseHelper =
      responseRateValue !== null
        ? `${responseSamples} application${responseSamples === 1 ? "" : "s"}`
        : "Respond to applicants to build trust";

    const ratingValue =
      typeof profileMetrics.rating === "number" ? profileMetrics.rating : null;
    const totalReviews = profileMetrics.total_reviews || 0;

    return (
      <View style={styles.trustGrid}>
        <TrustMetricCard
          label="Payment Method"
          value={paymentVerified ? "Verified" : "Not Verified"}
          helper={paymentHelper}
          status={paymentVerified ? "success" : "default"}
        />
        <TrustMetricCard
          label="Response Rate"
          value={
            responseRateValue !== null
              ? `${responseRateValue.toFixed(1)}%`
              : "No data yet"
          }
          helper={responseHelper}
          status={responseRateValue !== null ? "success" : "warning"}
        />
        <TrustMetricCard
          label="Average Rating"
          value={
            ratingValue && ratingValue > 0
              ? `${ratingValue.toFixed(1)} ★`
              : "No reviews yet"
          }
          helper={
            totalReviews > 0
              ? `${totalReviews} review${totalReviews === 1 ? "" : "s"}`
              : undefined
          }
          fullWidth
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification Bell Icon */}
      <View style={styles.notificationIconContainer}>
        <TouchableOpacity
          onPress={() => router.push("/notifications" as any)}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={26} color="#007AFF" />
          {unreadCount > 0 && (
            <Badge style={styles.notificationBadge} size={18}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header with Profile Info */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user?.profile_data?.profileImg ? (
                <Image
                  source={{ uri: user.profile_data.profileImg }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
            </View>

            {/* Name & Email */}
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>

            {/* Role Badge */}
            <View
              style={[
                styles.roleBadge,
                isWorker ? styles.workerBadge : styles.clientBadge,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  isWorker ? styles.workerText : styles.clientText,
                ]}
              >
                {isWorker ? "Worker" : "Client"}
              </Text>
            </View>

            {/* View/Edit Profile Button */}
            {isWorker ? (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={() => {
                  // Navigate to public worker profile view (what clients see)
                  // Use the workerProfileId (WorkerProfile.id) for the endpoint
                  const workerProfileId = user?.profile_data?.workerProfileId;
                  console.log("📱 View Public Profile pressed");
                  console.log("   Worker Profile ID:", workerProfileId);
                  console.log("   Navigating to: /workers/" + workerProfileId);

                  if (workerProfileId) {
                    router.push(`/workers/${workerProfileId}` as any);
                  } else {
                    Alert.alert(
                      "Profile Not Found",
                      "Your worker profile ID is not available. Please try logging in again."
                    );
                  }
                }}
              >
                <Ionicons name="eye-outline" size={18} color={Colors.primary} />
                <Text style={styles.editButtonText}>View Public Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Current Balance</Text>
                {walletLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : walletError ? (
                  <TouchableOpacity onPress={() => refetchWallet()}>
                    <Text style={styles.walletBalanceError}>Tap to retry</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.walletBalance}>
                    {formatCurrency(walletBalanceValue)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.addFundsButton}
              activeOpacity={0.8}
              onPress={() => router.push("/payments/deposit" as any)}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.white}
              />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.email || "Not set"}
            />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Email Verified"
              value={user?.isVerified ? "Yes" : "No"}
              valueColor={user?.isVerified ? Colors.success : Colors.warning}
            />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Account Status"
              value="Active"
              valueColor={Colors.success}
            />
          </View>
        </View>

        {/* Client Trust Metrics */}
        {!isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trust & Performance</Text>
            <Text style={styles.sectionDescription}>
              Workers see these stats when reviewing your job requests.
            </Text>
            {renderTrustMetrics()}
          </View>
        )}

        {/* Worker-Specific Info */}
        {isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Worker Information</Text>
            <View style={styles.infoCard}>
              <InfoRow
                icon="location-outline"
                label="Profile Type"
                value={user?.profile_data?.profileType || "Not set"}
              />
              <InfoRow
                icon="star-outline"
                label="Rating"
                value="No ratings yet"
              />
              <InfoRow
                icon="briefcase-outline"
                label="Jobs Completed"
                value="0"
              />
            </View>
          </View>
        )}

        {/* Worker Certifications & Materials */}
        {isWorker && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="school-outline"
                  label="Manage Certifications"
                  onPress={() => router.push("/profile/certifications" as any)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Materials & Products</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="cube-outline"
                  label="Manage Materials"
                  onPress={() => router.push("/profile/materials" as any)}
                />
              </View>
            </View>
          </>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            <MenuItem
              icon="shield-outline"
              label="Privacy & Security"
              onPress={() => {}}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <MenuItem
              icon="information-circle-outline"
              label="About"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>iAyos v1.0.0</Text>
          <Text style={styles.footerSubtext}>May sira? May iAyos.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Components
function InfoRow({
  icon,
  label,
  value,
  valueColor = Colors.textPrimary,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={22} color={Colors.textSecondary} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

type MetricStatus = "default" | "success" | "warning";

function TrustMetricCard({
  label,
  value,
  helper,
  status = "default",
  fullWidth = false,
}: {
  label: string;
  value: string;
  helper?: string;
  status?: MetricStatus;
  fullWidth?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        fullWidth && styles.metricCardFull,
        status === "success" && styles.metricCardSuccess,
        status === "warning" && styles.metricCardWarning,
      ]}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notificationIconContainer: {
    position: "absolute",
    top: 10,
    right: 16,
    zIndex: 100,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    fontSize: 10,
  },
  header: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing["2xl"],
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.primary,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  userName: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.lg,
  },
  workerBadge: {
    backgroundColor: `${Colors.primary}30`,
  },
  clientBadge: {
    backgroundColor: `${Colors.success}20`,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  workerText: {
    color: Colors.primary,
  },
  clientText: {
    color: Colors.success,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  editButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  walletBalanceError: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.error,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addFundsText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  metricCardFull: {
    width: "100%",
  },
  metricCardSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  metricCardWarning: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  metricHelper: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  metricErrorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  metricErrorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
  },
  metricLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricLoadingText: {
    marginLeft: Spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.error,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
  },
});
