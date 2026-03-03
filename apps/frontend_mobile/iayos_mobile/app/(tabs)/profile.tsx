import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useProfileMetrics } from "@/lib/hooks/useProfileMetrics";
import { useWallet, WalletData } from "@/lib/hooks/useWallet";
import { formatCurrency } from "@/lib/hooks/usePayments";
import { useScanLocation } from "@/lib/hooks/useLocation";
import {
  useDualProfileStatus,
  useCreateClientProfile,
  useCreateWorkerProfile,
  useSwitchProfile,
} from "@/lib/hooks/useDualProfile";
import { getAbsoluteMediaUrl } from "@/lib/api/config";
import CalendarFAB from "@/components/CalendarFAB";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const router = useRouter();
  const scanLocation = useScanLocation();

  // Dual profile management
  const { data: dualStatus, isLoading: isDualStatusLoading } =
    useDualProfileStatus();
  const createClient = useCreateClientProfile();
  const createWorker = useCreateWorkerProfile();
  const switchProfile = useSwitchProfile();

  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWallet();
  const typedWalletData = walletData as WalletData | undefined;
  const walletBalanceValue =
    typeof typedWalletData?.balance === "number" ? typedWalletData.balance : 0;
  const availableBalanceValue =
    typeof typedWalletData?.availableBalance === "number"
      ? typedWalletData.availableBalance
      : walletBalanceValue;
  const reservedBalanceValue =
    typeof typedWalletData?.reservedBalance === "number"
      ? typedWalletData.reservedBalance
      : 0;

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
            profileMetrics.payment_method_verified_at,
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
      <View style={styles.infoCard}>
        <InfoRow
          icon="star-outline"
          label="Rating"
          value={
            ratingValue && ratingValue > 0
              ? `${ratingValue.toFixed(1)} / 5${
                  totalReviews > 0
                    ? ` (${totalReviews} review${totalReviews === 1 ? "" : "s"})`
                    : ""
                }`
              : "0.0"
          }
          valueColor={
            ratingValue && ratingValue > 0
              ? Colors.textPrimary
              : Colors.textSecondary
          }
          showArrow={true}
          onPress={() => router.push("/profile/reviews" as any)}
        />
        <InfoRow
          icon="chatbubbles-outline"
          label="Response Rate"
          value={
            responseRateValue !== null
              ? `${responseRateValue.toFixed(1)}%`
              : "No data yet"
          }
          valueColor={
            responseRateValue !== null ? Colors.success : Colors.textSecondary
          }
          noBorder={true}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Action Buttons */}
      <View style={styles.topActionsContainer}>
        {/* Location Button */}
        <TouchableOpacity
          onPress={async () => {
            try {
              await scanLocation.mutateAsync();
            } catch (error) {
              // Error alert already shown in hook
            }
          }}
          style={styles.actionButton}
          disabled={scanLocation.isPending}
        >
          {scanLocation.isPending ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="location" size={26} color="#54B7EC" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1, backgroundColor: Colors.backgroundSecondary }}
        style={{ backgroundColor: Colors.primaryLight }}
      >
        {/* Header with Profile Info */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user?.profile_data?.profileImg ? (
                <Image
                  source={{
                    uri: getAbsoluteMediaUrl(
                      user.profile_data.profileImg,
                    ) as string,
                  }}
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
                  if (__DEV__) {
                    console.log("📱 View Public Profile pressed");
                    console.log("   Worker Profile ID:", workerProfileId);
                    console.log(
                      "   Navigating to: /workers/" + workerProfileId,
                    );
                  }

                  if (workerProfileId) {
                    router.push(`/workers/${workerProfileId}` as any);
                  } else {
                    Alert.alert(
                      "Profile Not Found",
                      "Your worker profile ID is not available. Please try logging in again.",
                    );
                  }
                }}
              >
                <Ionicons name="eye-outline" size={18} color={Colors.primary} />
                <Text style={styles.editButtonText}>View Public Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={() => router.push("/profile/edit-client" as any)}
              >
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

        <View style={styles.contentContainer}>
          {/* Profile Switcher Section */}
          {!isDualStatusLoading && dualStatus && (
            <View style={styles.section}>
            {isWorker ? (
              // Worker account - show client profile option
              dualStatus.has_client_profile ? (
                // Has client profile - show switch button
                <TouchableOpacity
                  style={styles.switchProfileCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.alert(
                      "Switch to Client Profile",
                      "Switch to your client profile to post jobs and hire workers. You can switch back anytime.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Switch",
                          style: "default",
                          onPress: () => switchProfile.mutate("CLIENT"),
                        },
                      ],
                    );
                  }}
                  disabled={switchProfile.isPending}
                >
                  <View style={styles.switchProfileContent}>
                    <View style={styles.switchIconContainer}>
                      {switchProfile.isPending ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                      ) : (
                        <Ionicons
                          name="briefcase"
                          size={24}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.switchTextContainer}>
                      <Text style={styles.switchProfileTitle}>
                        {switchProfile.isPending
                          ? "Switching..."
                          : "Switch to Client Profile"}
                      </Text>
                      <Text style={styles.switchProfileDescription}>
                        Post jobs and hire workers
                      </Text>
                    </View>
                    {!switchProfile.isPending && (
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={Colors.textSecondary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                // No client profile - show create option
                <View style={styles.createProfileCard}>
                  <View style={styles.createProfileHeader}>
                    <Ionicons
                      name="briefcase-outline"
                      size={28}
                      color={Colors.primary}
                    />
                    <Text style={styles.createProfileTitle}>
                      Want to hire workers too?
                    </Text>
                  </View>
                  <Text style={styles.createProfileDescription}>
                    Create a client profile to post jobs and hire skilled
                    workers for your projects.
                  </Text>
                  <TouchableOpacity
                    style={styles.createProfileButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        "Create Client Profile",
                        "This will create a separate client profile for posting jobs. You can switch between worker and client profiles anytime. Continue?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Create",
                            style: "default",
                            onPress: () => createClient.mutate(),
                          },
                        ],
                      );
                    }}
                    disabled={createClient.isPending}
                  >
                    {createClient.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.createProfileButtonText}>
                          Create Client Profile
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )
            ) : // Client account - show worker profile option
            dualStatus.has_worker_profile ? (
              // Has worker profile - show switch button
              <TouchableOpacity
                style={styles.switchProfileCard}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    "Switch to Worker Profile",
                    "Switch to your worker profile to find jobs and offer services. You can switch back anytime.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Switch",
                        style: "default",
                        onPress: () => switchProfile.mutate("WORKER"),
                      },
                    ],
                  );
                }}
                disabled={switchProfile.isPending}
              >
                <View style={styles.switchProfileContent}>
                  <View style={styles.switchIconContainer}>
                    {switchProfile.isPending ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons
                        name="hammer"
                        size={24}
                        color={Colors.primary}
                      />
                    )}
                  </View>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchProfileTitle}>
                      {switchProfile.isPending
                        ? "Switching..."
                        : "Switch to Worker Profile"}
                    </Text>
                    <Text style={styles.switchProfileDescription}>
                      Find jobs and offer your services
                    </Text>
                  </View>
                  {!switchProfile.isPending && (
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={Colors.textSecondary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              // No worker profile - show create option
              <View style={styles.createProfileCard}>
                <View style={styles.createProfileHeader}>
                  <Ionicons
                    name="hammer-outline"
                    size={28}
                    color={Colors.primary}
                  />
                  <Text style={styles.createProfileTitle}>
                    Want to work on jobs too?
                  </Text>
                </View>
                <Text style={styles.createProfileDescription}>
                  Create a worker profile to apply for jobs and offer your
                  services to clients.
                </Text>
                <TouchableOpacity
                  style={styles.createProfileButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.alert(
                      "Create Worker Profile",
                      "This will create a separate worker profile for applying to jobs. You can switch between client and worker profiles anytime. Continue?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Create",
                          style: "default",
                          onPress: () => createWorker.mutate(),
                        },
                      ],
                    );
                  }}
                  disabled={createWorker.isPending}
                >
                  {createWorker.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={Colors.white}
                      />
                      <Text style={styles.createProfileButtonText}>
                        Create Worker Profile
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <TouchableOpacity
            style={styles.walletCard}
            activeOpacity={0.8}
            onPress={() => router.push("/wallet" as any)}
          >
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                {walletLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : walletError ? (
                  <TouchableOpacity onPress={() => refetchWallet()}>
                    <Text style={styles.walletBalanceError}>Tap to retry</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.walletBalance}>
                    {formatCurrency(availableBalanceValue)}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.textSecondary}
              />
            </View>

            {/* Reserved Balance Indicator */}
            {!walletLoading && !walletError && reservedBalanceValue > 0 && (
              <View style={styles.reservedBalanceContainer}>
                <Ionicons name="lock-closed" size={14} color={Colors.warning} />
                <Text style={styles.reservedBalanceText}>
                  {formatCurrency(reservedBalanceValue)} reserved in escrow
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.walletActions}>
            {isWorker ? (
              <TouchableOpacity
                style={[styles.withdrawButton, { backgroundColor: '#54B7EB' }]}
                activeOpacity={0.8}
                onPress={() => router.push("/wallet/withdraw" as any)}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            ) : (
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
            )}
          </View>
        </View>

        {/* Client Trust Metrics */}
        {!isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            {renderTrustMetrics()}
          </View>
        )}

        {/* Worker Performance Stats (was Worker Info, stripped of Profile Type) */}
        {isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon="star-outline"
                label="Rating"
                value={
                  user?.profile_data?.workerRating &&
                  user.profile_data.workerRating > 0
                    ? `${user.profile_data.workerRating} / 5`
                    : "0.0"
                }
                showArrow={true}
                onPress={() => router.push("/profile/reviews" as any)}
              />
              <MenuItem
                icon="briefcase-outline"
                label="Jobs Completed"
                value={String(user?.profile_data?.jobsCompleted ?? 0)}
                noBorder={true}
              />
            </View>
          </View>
        )}

        {/* Account & Settings Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-circle-outline"
              label="Account Information"
              onPress={() => router.push("/profile/account-info" as any)}
            />
            <MenuItem
              icon="settings-outline"
              label="Settings"
              onPress={() => router.push("/profile/settings" as any)}
              noBorder={true}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            testID="profile-logout-button"
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>iAyos v1.0.0</Text>
          <Text style={styles.footerSubtext}>May sira? May iAyos.</Text>
        </View>
        </View>
      </ScrollView>
      <CalendarFAB />
    </SafeAreaView>
  );
}

// Helper Components
function InfoRow({
  icon,
  label,
  value,
  valueColor = Colors.textPrimary,
  noBorder = false,
  showArrow = false,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  noBorder?: boolean;
  showArrow?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
        {showArrow && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textHint} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function MenuItem({
  icon,
  label,
  onPress,
  noBorder = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, noBorder && { borderBottomWidth: 0 }]}
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

function CollapsibleSection({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.collapsibleContainer}>
      <TouchableOpacity
        style={[
          styles.collapsibleHeader,
          isExpanded && styles.collapsibleHeaderExpanded,
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.collapsibleHeaderContent}>
          <Ionicons name={icon as any} size={24} color={Colors.primary} />
          <Text
            style={[
              styles.collapsibleTitle,
              isExpanded && styles.collapsibleTitleExpanded,
            ]}
          >
            {title}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.collapsibleContent}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: Spacing.md,
    minHeight: 500,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing["4xl"],
    paddingBottom: Spacing["2xl"] + 32,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primaryLight,
  },
  headerContent: {
    alignItems: "center",
    width: "100%",
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#00BAF1",
    ...Shadows.md,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
  },
  collapsibleContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  collapsibleHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  collapsibleHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  collapsibleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  collapsibleTitleExpanded: {
    color: Colors.primary,
  },
  collapsibleContent: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.sm,
  },
  topActionsContainer: {
    position: "absolute",
    top: 70,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
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
  reservedBalanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning + "15",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: 6,
  },
  reservedBalanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    fontWeight: Typography.fontWeight.medium,
  },
  walletActions: {
    marginTop: Spacing.md,
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
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  withdrawText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
  // Profile Switcher Styles
  switchProfileCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  switchProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  switchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTextContainer: {
    flex: 1,
  },
  switchProfileTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  switchProfileDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  createProfileCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  createProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  createProfileTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  createProfileDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  createProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  createProfileButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
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
