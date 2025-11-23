import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Job {
  job_id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
  category_name: string;
  client_name: string;
  client_avatar: string | null;
  is_applied: boolean;
  expected_duration: string;
}

interface JobCategory {
  id: number;
  name: string;
}

interface SearchFilters {
  minBudget: number;
  maxBudget: number;
  location: string;
  categories: number[];
  urgency: string[];
  sortBy: "latest" | "budget_high" | "budget_low";
}

const RECENT_SEARCHES_KEY = "@recent_searches";
const MAX_RECENT_SEARCHES = 5;

export default function SearchJobsScreen() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minBudget: 0,
    maxBudget: 50000,
    location: "",
    categories: [],
    urgency: [],
    sortBy: "latest",
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Fetch categories for filter
  const { data: categoriesData } = useQuery<{ categories: JobCategory[] }>({
    queryKey: ["jobs", "categories"],
    queryFn: async (): Promise<{ categories: JobCategory[] }> => {
      const response = await apiRequest(ENDPOINTS.JOB_CATEGORIES);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json() as { categories: JobCategory[] };
    },
    staleTime: 1000 * 60 * 60,
  });

  const categories: JobCategory[] = categoriesData?.categories || [];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Check if filters are active
  useEffect(() => {
    const active =
      filters.minBudget > 0 ||
      filters.maxBudget < 50000 ||
      filters.location !== "" ||
      filters.categories.length > 0 ||
      filters.urgency.length > 0 ||
      filters.sortBy !== "latest";
    setHasActiveFilters(active);
  }, [filters]);

  // Search query
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery<{ jobs: Job[] }>({
    queryKey: ["jobs", "search", debouncedQuery, filters],
    queryFn: async (): Promise<{ jobs: Job[] }> => {
      if (debouncedQuery.length < 2) return { jobs: [] };

      // If we have filters, use the filtered list endpoint
      if (hasActiveFilters) {
        const response = await apiRequest(
          ENDPOINTS.JOB_LIST_FILTERED({
            minBudget: filters.minBudget > 0 ? filters.minBudget : undefined,
            maxBudget:
              filters.maxBudget < 50000 ? filters.maxBudget : undefined,
            location: filters.location || undefined,
            category: filters.categories[0], // API only supports single category
            page: 1,
            limit: 50,
          })
        );
        if (!response.ok) throw new Error("Search failed");
        return await response.json() as { jobs: Job[] };
      }

      // Otherwise use search endpoint
      const response = await apiRequest(
        ENDPOINTS.JOB_SEARCH(debouncedQuery, 1, 50)
      );
      if (!response.ok) throw new Error("Search failed");
      return await response.json() as { jobs: Job[] };
    },
    enabled: debouncedQuery.length >= 2,
  });

  const jobs: Job[] = searchResults?.jobs || [];

  // Apply client-side filters that backend doesn't support
  const filteredJobs = jobs.filter((job) => {
    // Filter by urgency
    if (
      filters.urgency.length > 0 &&
      !filters.urgency.includes(job.urgency_level)
    ) {
      return false;
    }
    // Filter by multiple categories (backend only supports one)
    if (filters.categories.length > 1) {
      const categoryNames = filters.categories.map(
        (id) => categories.find((c) => c.id === id)?.name || ""
      );
      if (!categoryNames.includes(job.category_name)) {
        return false;
      }
    }
    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (filters.sortBy) {
      case "budget_high":
        return b.budget - a.budget;
      case "budget_low":
        return a.budget - b.budget;
      case "latest":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;

      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s !== trimmed),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      saveRecentSearch(query);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setFilters({
      minBudget: 0,
      maxBudget: 50000,
      location: "",
      categories: [],
      urgency: [],
      sortBy: "latest",
    });
  };

  const toggleCategory = (categoryId: number) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleUrgency = (urgency: string) => {
    setFilters((prev) => ({
      ...prev,
      urgency: prev.urgency.includes(urgency)
        ? prev.urgency.filter((u) => u !== urgency)
        : [...prev.urgency, urgency],
    }));
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "MEDIUM":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "LOW":
      default:
        return { bg: "#D1FAE5", text: "#065F46" };
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const urgencyColors = getUrgencyColor(item.urgency_level);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobPress(item.job_id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.urgencyIndicator,
            { backgroundColor: urgencyColors.text },
          ]}
        />

        <View style={styles.jobCardContent}>
          <View style={styles.jobHeader}>
            <View style={styles.jobHeaderLeft}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.category_name}
                </Text>
              </View>
            </View>
            <View style={styles.budgetContainer}>
              <Text style={styles.budgetAmount}>
                ₱{item.budget.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.jobDetails}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailText}>{item.expected_duration}</Text>
            </View>
          </View>

          <View style={styles.jobFooter}>
            <View style={styles.clientInfo}>
              <View style={styles.clientAvatar}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <Text style={styles.clientName}>{item.client_name}</Text>
            </View>

            <View style={styles.footerRight}>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: urgencyColors.bg },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyBadgeText,
                    { color: urgencyColors.text },
                  ]}
                >
                  {item.urgency_level}
                </Text>
              </View>
              <Text style={styles.timeAgo}>
                {formatTimeAgo(item.created_at)}
              </Text>
            </View>
          </View>

          {item.is_applied && (
            <View style={styles.appliedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.success}
              />
              <Text style={styles.appliedBadgeText}>Applied</Text>
            </View>
          )}
        </View>
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
        <Text style={styles.headerTitle}>Search Jobs</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showFilters ? "close" : "options-outline"}
            size={24}
            color={hasActiveFilters ? Colors.primary : Colors.textPrimary}
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
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
          placeholder="Search jobs by title, description, location..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={Colors.textHint}
          autoFocus
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

      {/* Filter Panel */}
      {showFilters && (
        <ScrollView
          style={styles.filterPanel}
          showsVerticalScrollIndicator={false}
        >
          {/* Budget Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Budget Range</Text>
            <View style={styles.budgetInputs}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Min ₱</Text>
                <TextInput
                  style={styles.budgetField}
                  value={filters.minBudget.toString()}
                  onChangeText={(text) =>
                    setFilters((prev) => ({
                      ...prev,
                      minBudget: parseInt(text) || 0,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <Text style={styles.budgetSeparator}>to</Text>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Max ₱</Text>
                <TextInput
                  style={styles.budgetField}
                  value={filters.maxBudget.toString()}
                  onChangeText={(text) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxBudget: parseInt(text) || 50000,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="50000"
                />
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Location</Text>
            <TextInput
              style={styles.locationInput}
              value={filters.location}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, location: text }))
              }
              placeholder="Enter city or barangay"
              placeholderTextColor={Colors.textHint}
            />
          </View>

          {/* Categories */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <View style={styles.chipContainer}>
              {categories.slice(0, 12).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterChip,
                    filters.categories.includes(category.id) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.categories.includes(category.id) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Urgency</Text>
            <View style={styles.chipContainer}>
              {["LOW", "MEDIUM", "HIGH"].map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[
                    styles.filterChip,
                    filters.urgency.includes(urgency) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => toggleUrgency(urgency)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.urgency.includes(urgency) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {urgency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.chipContainer}>
              {[
                { value: "latest", label: "Latest First" },
                { value: "budget_high", label: "Highest Budget" },
                { value: "budget_low", label: "Lowest Budget" },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[
                    styles.filterChip,
                    filters.sortBy === sort.value && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: sort.value as any,
                    }))
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.sortBy === sort.value &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Content */}
      <View style={styles.content}>
        {searchQuery.length < 2 ? (
          // Recent searches
          <View style={styles.recentSearchesContainer}>
            {recentSearches.length > 0 ? (
              <>
                <View style={styles.recentSearchesHeader}>
                  <Text style={styles.recentSearchesTitle}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearButton}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => handleRecentSearchPress(search)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.recentSearchText}>{search}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={Colors.textHint}
                    />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={Colors.textSecondary}
                />
                <Text style={styles.emptyStateText}>
                  Start typing to search for jobs
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Try searching by job title, category, or location
                </Text>
              </View>
            )}
          </View>
        ) : isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={Colors.error}
            />
            <Text style={styles.errorText}>Search failed</Text>
            <Text style={styles.errorSubtext}>
              Please check your connection and try again
            </Text>
          </View>
        ) : sortedJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="file-tray-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              {`No jobs found for "${searchQuery}"`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCount}>
                {sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}{" "}
                found
              </Text>
            </View>
            <FlatList
              data={sortedJobs}
              renderItem={renderJobCard}
              keyExtractor={(item) => item.job_id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
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
  filterButton: {
    padding: Spacing.xs,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
  filterPanel: {
    maxHeight: 400,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  budgetInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  budgetLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  budgetField: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  budgetSeparator: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  locationInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  clearFiltersText: {
    ...Typography.body.medium,
    color: Colors.error,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  recentSearchesContainer: {
    padding: Spacing.md,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  recentSearchesTitle: {
    ...Typography.body.large,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  clearButton: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.medium,
  },
  recentSearchText: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  resultHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  resultCount: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  listContainer: {
    padding: Spacing.md,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadows.medium,
  },
  urgencyIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  jobCardContent: {
    padding: Spacing.md,
    paddingLeft: Spacing.md + 8,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  jobHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  budgetContainer: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  budgetAmount: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.success,
  },
  jobDescription: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  detailText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  clientName: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  urgencyBadgeText: {
    ...Typography.body.small,
    fontWeight: "600",
  },
  timeAgo: {
    ...Typography.body.small,
    color: Colors.textHint,
  },
  appliedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  appliedBadgeText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "600",
    marginLeft: 4,
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
    textAlign: "center",
  },
  errorSubtext: {
    ...Typography.body.medium,
    color: Colors.textHint,
    marginTop: Spacing.xs,
    textAlign: "center",
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
  emptyStateSubtext: {
    ...Typography.body.medium,
    color: Colors.textHint,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
