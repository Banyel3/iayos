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

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Components
import SearchBar from '@/components/ui/SearchBar';
import FilterChip from '@/components/ui/FilterChip';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import SkeletonCard from '@/components/ui/SkeletonCard';
import JobCard from '@/components/JobCard';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Hooks
import { useInfiniteJobs, Job } from '@/lib/hooks/useJobs';
import { useCategories } from '@/lib/hooks/useCategories';

const URGENCY_FILTERS = [
  { id: 'ALL', label: 'All', value: undefined },
  { id: 'LOW', label: 'Low', value: 'LOW' },
  { id: 'MEDIUM', label: 'Medium', value: 'MEDIUM' },
  { id: 'HIGH', label: 'High', value: 'HIGH' },
] as const;

export default function BrowseJobsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedUrgency, setSelectedUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | undefined>(undefined);

  const isWorker = user?.profile_data?.profileType === 'WORKER';

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];

  // Fetch jobs with infinite scroll
  const {
    data: jobsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: jobsLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteJobs({
    category: selectedCategory,
    urgency: selectedUrgency,
  });

  // Flatten pages into single jobs array
  const jobs = jobsData?.pages?.flatMap((page) => page.jobs) || [];

  // Handlers
  const handleSearchFocus = () => {
    router.push('/jobs/search');
  };

  const handleCategoryPress = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleUrgencyPress = (urgency: 'LOW' | 'MEDIUM' | 'HIGH' | undefined) => {
    if (selectedUrgency === urgency) {
      setSelectedUrgency(undefined);
    } else {
      setSelectedUrgency(urgency);
    }
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
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
    router.push('/jobs/categories' as any);
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>
            {isWorker ? 'Find Jobs' : 'Browse Workers'}
          </Text>
          <Text style={styles.subtitle}>
            {jobs.length} {isWorker ? 'jobs' : 'workers'} available
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          {/* Unread badge - can be connected to actual count later */}
        </TouchableOpacity>
      </View>

      {/* SearchBar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search jobs..."
        showFilterButton
        onFilterPress={() => {/* TODO: Open filter modal */}}
        style={styles.searchBar}
        autoFocus={false}
      />

      {/* Category Filters */}
      {!categoriesLoading && categories.length > 0 && (
        <View style={styles.filtersSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Categories</Text>
            <TouchableOpacity onPress={handleViewCategories}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={[{ id: 0, name: 'All', specializationName: 'All' }, ...categories.slice(0, 8)]}
            renderItem={({ item }) => (
              <FilterChip
                label={item.specializationName || item.name}
                selected={item.id === 0 ? !selectedCategory : selectedCategory === item.id}
                onPress={() => item.id === 0 ? setSelectedCategory(undefined) : handleCategoryPress(item.id)}
                style={styles.categoryChip}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
        </View>
      )}

      {/* Urgency Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterTitle}>Urgency</Text>
        <FlatList
          horizontal
          data={URGENCY_FILTERS}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              selected={item.id === 'ALL' ? !selectedUrgency : selectedUrgency === item.value}
              onPress={() => handleUrgencyPress(item.value)}
              style={styles.urgencyChip}
            />
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        />
      </View>
    </View>
  );

  const renderJobItem = ({ item }: { item: Job }) => (
    <JobCard
      id={item.id}
      title={item.title}
      category={item.category}
      location={item.location}
      postedAt={item.postedAt}
      budget={item.budget}
      status={item.status.toLowerCase() as any}
      applicationCount={item.applicationCount}
      onPress={() => handleJobPress(item.id)}
    />
  );

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
    if (jobsLoading) {
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
        icon="briefcase-outline"
        title="No jobs found"
        message={
          selectedCategory || selectedUrgency
            ? 'Try adjusting your filters to see more jobs'
            : isWorker
            ? 'No jobs available at the moment. Check back soon!'
            : 'No workers available matching your criteria'
        }
        actionLabel={selectedCategory || selectedUrgency ? 'Clear Filters' : undefined}
        onActionPress={() => {
          setSelectedCategory(undefined);
          setSelectedUrgency(undefined);
        }}
      />
    );
  };

  // Loading state
  if (jobsLoading && !jobs.length) {
    return <LoadingScreen text="Loading jobs..." />;
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Failed to load jobs"
          message="Something went wrong. Please try again."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  notificationButton: {
    padding: Spacing.sm,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filtersSection: {
    paddingBottom: Spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  filterChipsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    marginRight: Spacing.sm,
  },
  urgencyChip: {
    marginRight: Spacing.sm,
  },
  skeletonContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  footerLoaderText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
