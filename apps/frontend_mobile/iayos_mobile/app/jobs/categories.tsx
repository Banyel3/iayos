import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

interface JobCategory {
  id: number;
  name: string;
  job_count?: number;
}

interface CategoryResponse {
  categories: JobCategory[];
  total_count: number;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch job categories
  const { data, isLoading, error, refetch } = useQuery<CategoryResponse>({
    queryKey: ["jobs", "categories"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.JOB_CATEGORIES);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return await response.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (categories don't change often)
  });

  const categories = data?.categories || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId: number, categoryName: string) => {
    router.push({
      pathname: "/jobs/browse/[categoryId]" as any,
      params: { categoryId, categoryName },
    });
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category icon based on name
  const getCategoryIcon = (
    categoryName: string
  ): keyof typeof Ionicons.glyphMap => {
    const name = categoryName.toLowerCase();

    if (name.includes("plumb")) return "water-outline";
    if (name.includes("electr")) return "flash-outline";
    if (name.includes("carpent") || name.includes("wood"))
      return "hammer-outline";
    if (name.includes("paint")) return "color-palette-outline";
    if (name.includes("clean")) return "sparkles-outline";
    if (name.includes("garden") || name.includes("landscap"))
      return "leaf-outline";
    if (name.includes("mason") || name.includes("construct"))
      return "construct-outline";
    if (name.includes("weld")) return "bonfire-outline";
    if (name.includes("mechanic") || name.includes("auto"))
      return "car-outline";
    if (name.includes("hvac") || name.includes("aircon")) return "snow-outline";
    if (name.includes("appliance")) return "home-outline";
    if (name.includes("roof")) return "triangle-outline";
    if (name.includes("tile")) return "grid-outline";
    if (name.includes("glass")) return "diamond-outline";
    if (name.includes("security")) return "shield-checkmark-outline";
    if (name.includes("pest")) return "bug-outline";
    if (name.includes("moving")) return "cube-outline";
    if (name.includes("delivery")) return "bicycle-outline";

    return "briefcase-outline"; // Default icon
  };

  // Get category color based on index (cycling through colors)
  const getCategoryColor = (index: number): string => {
    const colors = [
      Colors.primary, // Blue
      "#10B981", // Green
      "#F59E0B", // Orange
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#06B6D4", // Cyan
      "#EF4444", // Red
      "#6366F1", // Indigo
    ];
    return colors[index % colors.length];
  };

  const renderCategoryCard = ({
    item,
    index,
  }: {
    item: JobCategory;
    index: number;
  }) => {
    const categoryColor = getCategoryColor(index);
    const iconName = getCategoryIcon(item.name);

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item.id, item.name)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: `${categoryColor}15` },
          ]}
        >
          <Ionicons name={iconName} size={32} color={categoryColor} />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.job_count !== undefined && (
          <View
            style={[styles.jobCountBadge, { backgroundColor: categoryColor }]}
          >
            <Text style={styles.jobCountText}>
              {item.job_count} {item.job_count === 1 ? "job" : "jobs"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Categories</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textHint}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load categories</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="file-tray-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? `No categories found for "${searchQuery}"`
              : "No categories available"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40, // Same as back button for centering
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  gridContainer: {
    padding: Spacing.md,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: "center",
    ...Shadows.medium,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  categoryName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
    minHeight: 36, // Reserve space for 2 lines
  },
  jobCountBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  jobCountText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
