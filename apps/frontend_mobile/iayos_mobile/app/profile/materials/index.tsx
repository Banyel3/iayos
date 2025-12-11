// Worker Materials/Products Screen
// Lists all materials/products offered by the worker

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import {
  useMaterials,
  useDeleteMaterial,
  useToggleMaterialAvailability,
  type Material,
  formatPricePerUnit,
} from "@/lib/hooks/useMaterials";
import MaterialForm from "@/components/MaterialForm";
import CustomBackButton from "@/components/navigation/CustomBackButton";

// ===== MAIN COMPONENT =====

export default function MaterialsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Check if user is a worker - redirect if not
  const isWorker = user?.profile_data?.profileType === "WORKER";

  useEffect(() => {
    if (!isWorker && user) {
      Alert.alert(
        "Worker Feature Only",
        "Materials/Products are only available for worker profiles.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [isWorker, user, router]);

  const { data: materials = [], isLoading, error, refetch } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const toggleAvailability = useToggleMaterialAvailability();
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<
    Material | undefined
  >();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle delete with confirmation
  const handleDelete = (material: Material) => {
    Alert.alert(
      "Delete Material",
      `Are you sure you want to delete "${material.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMaterial.mutate(material.id),
        },
      ]
    );
  };

  // Handle availability toggle
  const handleToggleAvailability = (material: Material) => {
    toggleAvailability.mutate({
      id: material.id,
      isAvailable: !material.isAvailable,
    });
  };

  // Handle add new
  const handleAdd = () => {
    setEditingMaterial(undefined);
    setFormVisible(true);
  };

  // Handle edit
  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormVisible(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setFormVisible(false);
    setEditingMaterial(undefined);
  };

  // ===== LOADING STATE =====
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MaterialForm
          visible={formVisible}
          onClose={handleFormClose}
          material={editingMaterial}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===== ERROR STATE =====
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MaterialForm
          visible={formVisible}
          onClose={handleFormClose}
          material={editingMaterial}
        />
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load materials</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ===== EMPTY STATE =====
  if (materials.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MaterialForm
          visible={formVisible}
          onClose={handleFormClose}
          material={editingMaterial}
        />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="cube-outline"
            size={80}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No Materials Yet</Text>
          <Text style={styles.emptyText}>
            Add materials or products you offer to clients
          </Text>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add-circle" size={20} color={Colors.textLight} />
            <Text style={styles.addButtonText}>Add Material</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ===== RENDER MATERIAL CARD =====
  const renderMaterial = ({ item }: { item: Material }) => {
    return (
      <Pressable style={styles.materialCard} onPress={() => handleEdit(item)}>
        {/* Material Image/Icon */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.materialImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.materialThumbnail}>
            <Ionicons name="cube" size={32} color={Colors.primary} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.materialContent}>
          {/* Header with Name and Availability Toggle */}
          <View style={styles.materialHeader}>
            <Text style={styles.materialName} numberOfLines={2}>
              {item.name}
            </Text>
            <Pressable
              style={[
                styles.availabilityToggle,
                item.isAvailable && styles.availabilityToggleActive,
              ]}
              onPress={() => handleToggleAvailability(item)}
            >
              <Ionicons
                name={item.isAvailable ? "checkmark-circle" : "close-circle"}
                size={20}
                color={item.isAvailable ? Colors.success : Colors.error}
              />
            </Pressable>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {formatPricePerUnit(item.price, item.unit, item.quantity)}
            </Text>
            <View
              style={[
                styles.availabilityBadge,
                item.isAvailable
                  ? styles.availableBadge
                  : styles.unavailableBadge,
              ]}
            >
              <Text
                style={[
                  styles.availabilityText,
                  item.isAvailable
                    ? styles.availableText
                    : styles.unavailableText,
                ]}
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.editButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <SafeAreaView style={styles.safeArea}>
      <MaterialForm
        visible={formVisible}
        onClose={handleFormClose}
        material={editingMaterial}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <CustomBackButton />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Materials & Products</Text>
            <Text style={styles.headerSubtitle}>
              {materials.length}{" "}
              {materials.length === 1 ? "material" : "materials"}
            </Text>
          </View>
          <Pressable style={styles.addHeaderButton} onPress={handleAdd}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={materials}
          renderItem={renderMaterial}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  addHeaderButton: {
    padding: Spacing.sm,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  addButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // List
  listContent: {
    padding: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },

  // Material Card
  materialCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  materialThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialContent: {
    flex: 1,
  },
  materialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  materialName: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  description: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
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
  availabilityToggle: {
    padding: Spacing.xs,
  },
  availabilityToggleActive: {
    // Active state handled by icon color
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
