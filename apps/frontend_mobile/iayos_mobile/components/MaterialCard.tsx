// Material Card Component
// Displays a single material/product with availability toggle and actions

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { type Material, formatPricePerUnit } from "@/lib/hooks/useMaterials";

// ===== PROPS =====

interface MaterialCardProps {
  material: Material;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
  onToggleAvailability?: (material: Material) => void;
  onPress?: (material: Material) => void;
  compact?: boolean; // Compact mode for profile preview
  showActions?: boolean; // Show edit/delete buttons
}

// ===== MAIN COMPONENT =====

export default function MaterialCard({
  material,
  onEdit,
  onDelete,
  onToggleAvailability,
  onPress,
  compact = false,
  showActions = true,
}: MaterialCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(material);
    } else if (onEdit) {
      onEdit(material);
    }
  };

  // ===== COMPACT MODE (for profile preview) =====
  if (compact) {
    return (
      <Pressable
        style={[styles.card, styles.compactCard]}
        onPress={handlePress}
      >
        {/* Material Icon */}
        <View style={styles.compactIcon}>
          <Ionicons name="cube" size={20} color={Colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {material.name}
          </Text>
          <Text style={styles.compactPrice} numberOfLines={1}>
            {formatPricePerUnit(
              material.price,
              material.unit,
              material.quantity
            )}
          </Text>
        </View>

        {/* Availability Badge */}
        <View
          style={[
            styles.compactBadge,
            material.isAvailable
              ? styles.compactBadgeAvailable
              : styles.compactBadgeUnavailable,
          ]}
        >
          <Ionicons
            name={material.isAvailable ? "checkmark-circle" : "close-circle"}
            size={16}
            color={material.isAvailable ? Colors.success : Colors.error}
          />
        </View>
      </Pressable>
    );
  }

  // ===== FULL MODE =====
  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Material Image/Icon */}
      <View style={styles.thumbnail}>
        {material.imageUrl ? (
          <Image
            source={{ uri: material.imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube" size={32} color={Colors.primary} />
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header with Name and Availability Toggle */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {material.name}
          </Text>
          {onToggleAvailability && (
            <Pressable
              style={styles.availabilityToggle}
              onPress={() => onToggleAvailability(material)}
            >
              <Ionicons
                name={
                  material.isAvailable ? "checkmark-circle" : "close-circle"
                }
                size={24}
                color={material.isAvailable ? Colors.success : Colors.error}
              />
            </Pressable>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {material.description}
        </Text>

        {/* Category Badge (if linked to a skill) */}
        {material.categoryName && (
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag" size={12} color={Colors.primary} />
            <Text style={styles.categoryBadgeText}>
              {material.categoryName}
            </Text>
          </View>
        )}

        {/* Price and Availability Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            {formatPricePerUnit(
              material.price,
              material.unit,
              material.quantity
            )}
          </Text>
          <View
            style={[
              styles.availabilityBadge,
              material.isAvailable
                ? styles.availableBadge
                : styles.unavailableBadge,
            ]}
          >
            <Text
              style={[
                styles.availabilityText,
                material.isAvailable
                  ? styles.availableText
                  : styles.unavailableText,
              ]}
            >
              {material.isAvailable ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                style={styles.editButton}
                onPress={() => onEdit(material)}
              >
                <Ionicons name="pencil" size={16} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => onDelete(material)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },

  // Compact Mode
  compactCard: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  compactPrice: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "600",
  },
  compactBadge: {
    padding: Spacing.xs,
  },
  compactBadgeAvailable: {
    // Icon color handles the visual
  },
  compactBadgeUnavailable: {
    // Icon color handles the visual
  },

  // Full Mode - Thumbnail
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  // Full Mode - Content
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  availabilityToggle: {
    padding: Spacing.xs,
  },
  description: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  categoryBadgeText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  priceText: {
    ...Typography.heading.h4,
    color: Colors.success,
    fontWeight: "bold",
  },
  availabilityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  availableBadge: {
    backgroundColor: Colors.successLight,
  },
  unavailableBadge: {
    backgroundColor: Colors.errorLight,
  },
  availabilityText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "600",
  },
  availableText: {
    color: Colors.success,
  },
  unavailableText: {
    color: Colors.error,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.small,
  },
  editButtonText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.small,
  },
  deleteButtonText: {
    ...Typography.body.small,
    color: Colors.error,
    fontWeight: "600",
  },
});
