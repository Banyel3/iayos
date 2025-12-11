import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width: boxWidth = "100%",
  height = 20,
  borderRadius = BorderRadius.medium,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: boxWidth,
          height,
          borderRadius,
          backgroundColor: Colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const JobDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Job Header Skeleton */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <SkeletonBox width="70%" height={28} />
          <SkeletonBox
            width={80}
            height={28}
            borderRadius={BorderRadius.large}
          />
        </View>
        <SkeletonBox
          width="40%"
          height={16}
          style={{ marginTop: Spacing.sm }}
        />
      </View>

      {/* Budget & Location Skeleton */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
            <SkeletonBox width="40%" height={14} />
            <SkeletonBox width="60%" height={20} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.infoCard}>
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
            <SkeletonBox width="40%" height={14} />
            <SkeletonBox width="80%" height={20} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Description Skeleton */}
      <View style={styles.section}>
        <SkeletonBox
          width={120}
          height={20}
          style={{ marginBottom: Spacing.sm }}
        />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="95%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="88%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="70%" height={16} />
      </View>

      {/* Photos Skeleton */}
      <View style={styles.section}>
        <SkeletonBox
          width={100}
          height={20}
          style={{ marginBottom: Spacing.sm }}
        />
        <View style={styles.photosGrid}>
          <SkeletonBox width={(width - 48) / 3} height={(width - 48) / 3} />
          <SkeletonBox width={(width - 48) / 3} height={(width - 48) / 3} />
          <SkeletonBox width={(width - 48) / 3} height={(width - 48) / 3} />
        </View>
      </View>

      {/* Client Info Skeleton */}
      <View style={styles.section}>
        <SkeletonBox
          width={100}
          height={20}
          style={{ marginBottom: Spacing.sm }}
        />
        <View style={styles.clientCard}>
          <SkeletonBox width={56} height={56} borderRadius={28} />
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <SkeletonBox width="50%" height={18} />
            <SkeletonBox width={100} height={16} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Action Button Skeleton */}
      <View style={styles.buttonSection}>
        <SkeletonBox
          width="100%"
          height={50}
          borderRadius={BorderRadius.large}
        />
      </View>
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Avatar Skeleton */}
      <View style={styles.avatarSection}>
        <SkeletonBox width={120} height={120} borderRadius={60} />
        <SkeletonBox
          width="60%"
          height={24}
          style={{ marginTop: Spacing.md }}
        />
        <SkeletonBox
          width="40%"
          height={16}
          style={{ marginTop: Spacing.xs }}
        />
      </View>

      {/* Stats Cards Skeleton */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <SkeletonBox width={40} height={28} />
          <SkeletonBox
            width="80%"
            height={14}
            style={{ marginTop: Spacing.xs }}
          />
        </View>
        <View style={styles.statCard}>
          <SkeletonBox width={40} height={28} />
          <SkeletonBox
            width="80%"
            height={14}
            style={{ marginTop: Spacing.xs }}
          />
        </View>
        <View style={styles.statCard}>
          <SkeletonBox width={40} height={28} />
          <SkeletonBox
            width="80%"
            height={14}
            style={{ marginTop: Spacing.xs }}
          />
        </View>
      </View>

      {/* Info Section Skeleton */}
      <View style={styles.section}>
        <SkeletonBox
          width={100}
          height={20}
          style={{ marginBottom: Spacing.sm }}
        />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="90%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="95%" height={16} />
      </View>
    </View>
  );
};

export const WorkerCardSkeleton: React.FC = () => {
  return (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <View style={{ marginLeft: Spacing.md, flex: 1 }}>
          <SkeletonBox width="60%" height={18} />
          <SkeletonBox width="40%" height={14} style={{ marginTop: 6 }} />
          <SkeletonBox width={100} height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={{ marginTop: Spacing.sm }}>
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 4 }} />
        <SkeletonBox width="80%" height={16} />
      </View>
    </View>
  );
};

export const JobCardSkeleton: React.FC = () => {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardHeader}>
        <SkeletonBox width="70%" height={20} />
        <SkeletonBox width={60} height={24} borderRadius={BorderRadius.large} />
      </View>
      <SkeletonBox width="40%" height={14} style={{ marginTop: Spacing.xs }} />
      <SkeletonBox width="100%" height={16} style={{ marginTop: Spacing.sm }} />
      <SkeletonBox width="90%" height={16} style={{ marginTop: 4 }} />
      <View style={styles.jobCardFooter}>
        <SkeletonBox width={100} height={16} />
        <SkeletonBox width={80} height={16} />
      </View>
    </View>
  );
};

export const ApplicationCardSkeleton: React.FC = () => {
  return (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
          <SkeletonBox width="60%" height={18} />
          <SkeletonBox width="40%" height={14} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox
          width={80}
          height={28}
          borderRadius={BorderRadius.medium}
        />
      </View>
      <View style={{ marginTop: Spacing.sm }}>
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 4 }} />
        <SkeletonBox width="70%" height={16} />
      </View>
      <View style={styles.applicationFooter}>
        <SkeletonBox width={100} height={14} />
        <SkeletonBox width={100} height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  photosGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
  },
  buttonSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
  },
  workerCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  applicationCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  applicationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
