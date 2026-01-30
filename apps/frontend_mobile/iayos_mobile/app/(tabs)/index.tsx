/**
 * Browse Jobs Screen - Main tab screen for job discovery
 *
 * Features:
 * - SearchBar at top with filter button
 * - FilterChips for categories and urgency
 * - JobCard list with pull-to-refresh
 * - Loading with SkeletonCard
 * - EmptyState when no jobs
 * - ErrorState on API failure
 * - Infinite scroll pagination
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

// Components
import SearchBar from "@/components/ui/SearchBar";
import FilterChip from "@/components/ui/FilterChip";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import JobCard from "@/components/JobCard";
import WorkerCard from "@/components/WorkerCard";
import AgencyCard from "@/components/AgencyCard";
import InlineLoader from "@/components/ui/InlineLoader";
import LocationButton from "@/components/LocationButton";

// Hooks
import { useInfiniteJobs, Job } from "@/lib/hooks/useJobs";
import { useInfiniteWorkers, Worker } from "@/lib/hooks/useWorkers";
import { useInfiniteAgencies, Agency } from "@/lib/hooks/useAgencies";
import { useCategories } from "@/lib/hooks/useCategories";
import { useMyLocation } from "@/lib/hooks/useLocation";

export default function BrowseJobsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [viewTab, setViewTab] = useState<"workers" | "agencies">("workers");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("distance_asc");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const { data: myLocation } = useMyLocation();
  const hasLocation = Boolean(myLocation?.latitude && myLocation?.longitude);

  // Fetch categories (needed for both)
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();

  // Refetch workers when filters change
  useEffect(() => {
    if (!isWorker && viewTab === "workers" && workersQuery.data) {
      workersQuery.refetch();
    }
  }, [maxDistance, sortBy, selectedCategory, minRating]);
  const categories = categoriesData?.categories || [];

  // WORKER: Only fetch jobs
  const jobsQuery = useInfiniteJobs(
    {
      category: selectedCategory,
    },
    {
      enabled: isWorker, // Only fetch jobs if user is a worker
    }
  );

  // CLIENT: Only fetch workers or agencies based on active tab
  const workersQuery = useInfiniteWorkers(
    {
      category: selectedCategory,
      maxDistance,
      latitude: myLocation?.latitude,
      longitude: myLocation?.longitude,
      sortBy,
      minRating,
    },
    {
      enabled: !isWorker && viewTab === "workers", // Only fetch workers if client and workers tab
    }
  );

  const agenciesQuery = useInfiniteAgencies(
    {
      // Add filters as needed
    },
    {
      enabled: !isWorker && viewTab === "agencies", // Only fetch agencies if client and agencies tab
    }
  );

  // Unified state based on user type and tab
  const activeQuery = isWorker
    ? jobsQuery
    : viewTab === "workers"
      ? workersQuery
      : agenciesQuery;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = activeQuery;

  // Flatten pages into single array based on profile type
  const jobs = isWorker ? data?.pages?.flatMap((page) => page.jobs) || [] : [];
  const workers =
    !isWorker && viewTab === "workers"
      ? data?.pages?.flatMap((page) => page.workers) || []
      : [];
  const agencies =
    !isWorker && viewTab === "agencies"
      ? data?.pages?.flatMap((page) => page.agencies) || []
      : [];

  // Client-side filtering with useMemo to prevent keyboard dismissal
  const filteredItems = useMemo(() => {
    const rawItems = isWorker
      ? jobs
      : viewTab === "workers"
        ? workers
        : agencies;

    if (!searchQuery.trim()) {
      return rawItems;
    }

    const query = searchQuery.toLowerCase();

    if (isWorker) {
      // Filter jobs
      return (rawItems as Job[]).filter((job) => {
        const matchTitle = job.title?.toLowerCase().includes(query);
        const matchDescription = job.description?.toLowerCase().includes(query);
        const matchCategory = job.category?.toLowerCase().includes(query);
        const matchLocation = job.location?.toLowerCase().includes(query);
        return matchTitle || matchDescription || matchCategory || matchLocation;
      });
    } else if (viewTab === "workers") {
      // Filter workers
      return (rawItems as Worker[]).filter((worker) => {
        const matchName = worker.name?.toLowerCase().includes(query);
        const matchBio = worker.bio?.toLowerCase().includes(query);
        const matchCategories = worker.categories?.some((cat) =>
          cat.toLowerCase().includes(query)
        );
        const matchLocation = worker.location?.toLowerCase().includes(query);
        return matchName || matchBio || matchCategories || matchLocation;
      });
    } else {
      // Filter agencies
      return (rawItems as Agency[]).filter((agency) => {
        const matchName = agency.name?.toLowerCase().includes(query);
        const matchDescription = agency.description
          ?.toLowerCase()
          .includes(query);
        return matchName || matchDescription;
      });
    }
  }, [isWorker, viewTab, jobs, workers, agencies, searchQuery]);

  const items = filteredItems;
  const itemCount = items.length;

  // Handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCategoryPress = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
  };

  const handleWorkerPress = (workerId: number) => {
    console.log("[Navigation] Attempting to navigate to worker:", workerId);
    try {
      router.push({
        pathname: "/workers/[id]",
        params: { id: workerId.toString() },
      } as any);
    } catch (error) {
      console.error("[Navigation] Failed to navigate:", error);
    }
  };

  const handleAgencyPress = (agencyId: number) => {
    console.log("[Navigation] Attempting to navigate to agency:", agencyId);
    try {
      router.push({
        pathname: "/agencies/[id]",
        params: { id: agencyId.toString() },
      } as any);
    } catch (error) {
      console.error("[Navigation] Failed to navigate:", error);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewCategories = () => {
    router.push("/jobs/categories" as any);
  };

  // Render functions
  const renderHeader = useMemo(() => {
    const HeaderComponent = () => (
      <View style={styles.headerContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>
              {isWorker ? "🔨 Find Your Next Gig" : "👋 Welcome Back"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isWorker
                ? `${itemCount} opportunities waiting for you`
                : `Discover ${itemCount} talented ${viewTab === "workers" ? "professionals" : "agencies"}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIconButton}
            onPress={() => router.push("/notifications" as any)}
          >
            <View style={styles.notificationIconWrapper}>
              <Ionicons name="notifications" size={20} color={Colors.primary} />
              {/* Notification badge */}
              <View style={styles.notificationBadge} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Client Tab Switcher */}
        {!isWorker && (
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewTab === "workers" && styles.activeTabButton,
              ]}
              onPress={() => setViewTab("workers")}
            >
              <Ionicons
                name={viewTab === "workers" ? "people" : "people-outline"}
                size={20}
                color={
                  viewTab === "workers" ? Colors.white : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabButtonText,
                  viewTab === "workers" && styles.activeTabButtonText,
                ]}
              >
                Workers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewTab === "agencies" && styles.activeTabButton,
              ]}
              onPress={() => setViewTab("agencies")}
            >
              <Ionicons
                name={viewTab === "agencies" ? "business" : "business-outline"}
                size={20}
                color={
                  viewTab === "agencies" ? Colors.white : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabButtonText,
                  viewTab === "agencies" && styles.activeTabButtonText,
                ]}
              >
                Agencies
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories Scroller - Story Style */}
        {!categoriesLoading && categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isWorker ? "Popular Categories" : "Specializations"}
              </Text>
              <TouchableOpacity onPress={handleViewCategories}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={[
                { id: 0, name: "All", specializationName: "All" },
                ...categories.slice(0, 10),
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    (item.id === 0
                      ? !selectedCategory
                      : selectedCategory === item.id) &&
                      styles.categoryCardSelected,
                  ]}
                  onPress={() =>
                    item.id === 0
                      ? setSelectedCategory(undefined)
                      : handleCategoryPress(item.id)
                  }
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      (item.id === 0
                        ? !selectedCategory
                        : selectedCategory === item.id) &&
                        styles.categoryIconSelected,
                    ]}
                  >
                    <Ionicons
                      name="hammer"
                      size={24}
                      color={
                        (
                          item.id === 0
                            ? !selectedCategory
                            : selectedCategory === item.id
                        )
                          ? Colors.white
                          : Colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      (item.id === 0
                        ? !selectedCategory
                        : selectedCategory === item.id) &&
                        styles.categoryNameSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {item.specializationName || item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroller}
            />
          </View>
        )}

        {/* Feed Divider */}
        <View style={styles.feedDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            {isWorker
              ? "Available Jobs"
              : viewTab === "workers"
                ? "Top Workers"
                : "Featured Agencies"}
          </Text>
          <View style={styles.dividerLine} />
        </View>
      </View>
    );

    HeaderComponent.displayName = "HomeHeaderSection";
    return HeaderComponent;
  }, [isWorker, viewTab, itemCount, selectedCategory, categories, router]);

  const renderJobItem = ({ item }: { item: Job }) => (
    <JobCard
      id={item.id}
      title={item.title}
      category={item.category}
      location={item.location}
      distance={item.distance}
      postedAt={item.postedAt}
      budget={item.budget}
      status={item.status?.toLowerCase() as any}
      applicationCount={item.applicationCount}
      onPress={() => handleJobPress(item.id)}
      // Team Job Fields
      isTeamJob={item.is_team_job}
      totalWorkersNeeded={item.total_workers_needed}
      totalWorkersAssigned={item.total_workers_assigned}
      teamFillPercentage={item.team_fill_percentage}
    />
  );

  const renderWorkerItem = ({ item }: { item: Worker }) => (
    <WorkerCard worker={item} onPress={() => handleWorkerPress(item.id)} />
  );

  const renderAgencyItem = ({ item }: { item: Agency }) => (
    <AgencyCard agency={item} />
  );

  const renderItem = isWorker
    ? renderJobItem
    : viewTab === "workers"
      ? renderWorkerItem
      : renderAgencyItem;

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    return (
      <EmptyState
        icon={isWorker ? "briefcase-outline" : "people-outline"}
        title={isWorker ? "No jobs found" : "No workers found"}
        message={
          selectedCategory
            ? `Try adjusting your filters to see more ${isWorker ? "jobs" : "workers"}`
            : isWorker
              ? "No jobs available at the moment. Check back soon!"
              : "No workers available matching your criteria"
        }
        actionLabel={selectedCategory ? "Clear Filters" : undefined}
        onActionPress={() => {
          setSelectedCategory(undefined);
        }}
      />
    );
  };

  // Loading state - show inline loader instead of full screen
  const showInlineLoader = isLoading && !itemCount;

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title={`Failed to load ${isWorker ? "jobs" : "workers"}`}
          message="Something went wrong. Please try again."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      {/* Search Bar - Outside FlatList to prevent keyboard dismissal */}
      <View style={styles.fixedSearchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={
            isWorker ? "Search jobs, categories..." : "Search professionals..."
          }
          showFilterButton
          onFilterPress={handleFilterPress}
          style={styles.searchBar}
          autoFocus={false}
        />
      </View>

      <FlatList
        data={items as any}
        renderItem={renderItem as any}
        keyExtractor={(item: any) => item.id.toString()}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Results</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Distance Filter (clients on Workers tab) */}
              {!isWorker && viewTab === "workers" && hasLocation && (
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelRow}>
                    <Text style={styles.filterLabel}>Distance Radius</Text>
                    <Text style={styles.filterValue}>
                      {maxDistance ? `${maxDistance} km` : "Any distance"}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={50}
                    step={5}
                    value={maxDistance || 0}
                    onValueChange={setMaxDistance}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Any</Text>
                    <Text style={styles.sliderLabel}>10km</Text>
                    <Text style={styles.sliderLabel}>25km</Text>
                    <Text style={styles.sliderLabel}>50km</Text>
                  </View>
                  {maxDistance === 0 && (
                    <TouchableOpacity
                      style={styles.resetDistanceButton}
                      onPress={() => setMaxDistance(undefined)}
                    >
                      <Text style={styles.resetDistanceText}>
                        Show all distances
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* No Location Banner */}
              {!isWorker && viewTab === "workers" && !hasLocation && (
                <View style={styles.noLocationBanner}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={Colors.warning}
                  />
                  <Text style={styles.noLocationText}>
                    Enable location to filter by distance
                  </Text>
                  <LocationButton
                    size="small"
                    variant="secondary"
                    onLocationUpdated={() => workersQuery.refetch()}
                  />
                </View>
              )}

              {/* Sort By (clients on Workers tab) */}
              {!isWorker && viewTab === "workers" && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Sort By</Text>
                  <View style={styles.sortOptions}>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortBy === "distance_asc" && styles.sortOptionSelected,
                      ]}
                      onPress={() => setSortBy("distance_asc")}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={
                          sortBy === "distance_asc"
                            ? Colors.white
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortBy === "distance_asc" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Nearest First
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortBy === "distance_desc" && styles.sortOptionSelected,
                      ]}
                      onPress={() => setSortBy("distance_desc")}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={
                          sortBy === "distance_desc"
                            ? Colors.white
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortBy === "distance_desc" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Farthest First
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Minimum Rating Filter (clients on Workers tab) */}
              {!isWorker && viewTab === "workers" && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Minimum Rating</Text>
                  <View style={styles.ratingChipsContainer}>
                    <FilterChip
                      label="Any"
                      selected={!minRating}
                      onPress={() => setMinRating(undefined)}
                    />
                    <FilterChip
                      label="⭐ 3+"
                      selected={minRating === 3}
                      onPress={() => setMinRating(3)}
                    />
                    <FilterChip
                      label="⭐ 4+"
                      selected={minRating === 4}
                      onPress={() => setMinRating(4)}
                    />
                    <FilterChip
                      label="⭐ 4.5+"
                      selected={minRating === 4.5}
                      onPress={() => setMinRating(4.5)}
                    />
                  </View>
                </View>
              )}

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.filterChipsContainer}>
                  <FilterChip
                    label="All"
                    selected={!selectedCategory}
                    onPress={() => setSelectedCategory(undefined)}
                  />
                  {categories.map((category) => (
                    <FilterChip
                      key={category.id}
                      label={category.name || category.specializationName}
                      selected={selectedCategory === category.id}
                      onPress={() => handleCategoryPress(category.id)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedCategory(undefined);
                  setMaxDistance(undefined);
                  setSortBy("distance_asc");
                  setMinRating(undefined);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  fixedSearchContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16, // Add spacing after header
    paddingBottom: 120,
  },
  headerContainer: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
  },
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroContent: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
    lineHeight: 20,
  },
  notificationIconButton: {
    marginLeft: 12,
  },
  notificationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    marginHorizontal: 0,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F1F3F5",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTabButtonText: {
    color: Colors.white,
  },
  categoriesSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  categoriesScroller: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    alignItems: "center",
    width: 90,
    padding: 12,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}08`,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryIconSelected: {
    backgroundColor: `${Colors.white}25`,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: Colors.white,
  },
  urgencySection: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  urgencyScroller: {
    marginTop: 12,
    gap: 8,
  },
  urgencyChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#F1F3F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  urgencyChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  urgencyChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  urgencyChipTextSelected: {
    color: Colors.white,
  },
  feedDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingChipsContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  resetDistanceButton: {
    marginTop: 8,
  },
  resetDistanceText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  noLocationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.warning}10`,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
    marginBottom: 16,
  },
  noLocationText: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sortOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: Colors.white,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    ...Shadows.sm,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
