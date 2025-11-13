import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

type NavItem = {
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  showBadge?: boolean;
};

type BottomNavBarProps = {
  currentIndex: number;
  onTap: (index: number) => void;
  isWorker?: boolean;
};

export default function BottomNavBar({
  currentIndex,
  onTap,
  isWorker = false,
}: BottomNavBarProps) {
  const navItems: NavItem[] = [
    {
      index: 0,
      icon: "home-outline",
      activeIcon: "home",
      label: "Home",
    },
    {
      index: 1,
      icon: isWorker ? "briefcase-outline" : "document-text-outline",
      activeIcon: isWorker ? "briefcase" : "document-text",
      label: isWorker ? "My Jobs" : "Requests",
    },
    {
      index: 2,
      icon: "chatbubble-outline",
      activeIcon: "chatbubble",
      label: "Inbox",
      showBadge: false, // TODO: Connect to unread count
    },
    {
      index: 3,
      icon: "person-outline",
      activeIcon: "person",
      label: "Profile",
    },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = currentIndex === item.index;

    return (
      <TouchableOpacity
        key={item.index}
        onPress={() => onTap(item.index)}
        style={[styles.navItem, isActive && styles.navItemActive]}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? item.activeIcon : item.icon}
            size={26}
            color={isActive ? Colors.primary : Colors.textSecondary}
          />
          {item.showBadge && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          )}
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>{navItems.map(renderNavItem)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === "ios" ? Spacing.xl : Spacing.sm,
    height: Platform.OS === "ios" ? 85 : 70,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  navItemActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  iconContainer: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.circle,
    padding: Spacing.xs,
    minWidth: 14,
    minHeight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
    width: 6,
    height: 6,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
  },
  labelActive: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
});
