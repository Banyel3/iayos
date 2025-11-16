import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyJobs, JobStatus } from '@/lib/hooks/useMyJobs';
import { useUserType } from '@/lib/hooks/useUserProfile';
import * as Haptics from 'expo-haptics';

// Worker Tabs: Active, In Progress, Completed
// Client Tabs: Active Requests, In Progress, Past Requests, Applications

type WorkerTab = 'active' | 'in_progress' | 'completed';
type ClientTab = 'active' | 'in_progress' | 'completed' | 'applications';

export default function MyJobsScreen() {
  const userType = useUserType();
  const isClient = userType === 'CLIENT';

  const [workerTab, setWorkerTab] = useState<WorkerTab>('active');
  const [clientTab, setClientTab] = useState<ClientTab>('active');

  const currentTab = isClient ? clientTab : workerTab;
  const statusFilter: JobStatus =
    currentTab === 'applications' ? 'all' : currentTab;

  const { data, isLoading, error, refetch, isFetching } = useMyJobs(
    statusFilter,
    userType,
    1,
    20
  );

  const handleTabPress = (tab: WorkerTab | ClientTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isClient) {
      setClientTab(tab as ClientTab);
    } else {
      setWorkerTab(tab as WorkerTab);
    }
  };

  const handleJobPress = (jobId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/jobs/${jobId}` as any);
  };

  const renderTab = (
    label: string,
    value: WorkerTab | ClientTab,
    badge?: number
  ) => {
    const isActive = currentTab === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.tab, isActive && styles.tabActive]}
        onPress={() => handleTabPress(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWorkerTabs = () => (
    <View style={styles.tabContainer}>
      {renderTab('Active', 'active')}
      {renderTab('In Progress', 'in_progress')}
      {renderTab('Completed', 'completed')}
    </View>
  );

  const renderClientTabs = () => (
    <View style={styles.tabContainer}>
      {renderTab('Active', 'active')}
      {renderTab('In Progress', 'in_progress')}
      {renderTab('Past', 'completed')}
      {renderTab('Applications', 'applications', data?.total || 0)}
    </View>
  );

  const renderJobCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => handleJobPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.jobFooter}>
        <View style={styles.jobBudget}>
          <Ionicons name="cash-outline" size={16} color="#10B981" />
          <Text style={styles.jobBudgetText}>PHP {item.budget.toLocaleString()}</Text>
        </View>

        {item.applicationCount !== undefined && (
          <View style={styles.jobApplications}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.jobApplicationsText}>
              {item.applicationCount} applicants
            </Text>
          </View>
        )}
      </View>

      {isClient && item.worker && (
        <View style={styles.workerInfo}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.workerName}>
            {item.worker.firstName} {item.worker.lastName}
          </Text>
        </View>
      )}

      {!isClient && item.client && (
        <View style={styles.clientInfo}>
          <Ionicons name="business-outline" size={14} color="#6B7280" />
          <Text style={styles.clientName}>
            {item.client.firstName} {item.client.lastName}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    let message = '';
    if (isClient) {
      switch (clientTab) {
        case 'active':
          message = 'You have no active job requests.';
          break;
        case 'in_progress':
          message = 'No jobs currently in progress.';
          break;
        case 'completed':
          message = 'You have no past job requests.';
          break;
        case 'applications':
          message = 'No applications received yet.';
          break;
      }
    } else {
      switch (workerTab) {
        case 'active':
          message = 'You have not applied to any jobs yet.';
          break;
        case 'in_progress':
          message = 'No jobs currently in progress.';
          break;
        case 'completed':
          message = 'You have not completed any jobs yet.';
          break;
      }
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateText}>{message}</Text>
        {!isClient && workerTab === 'active' && (
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading && !isFetching) {
    return (
      <View style={styles.container}>
        {isClient ? renderClientTabs() : renderWorkerTabs()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {isClient ? renderClientTabs() : renderWorkerTabs()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load jobs</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isClient ? renderClientTabs() : renderWorkerTabs()}

      <FlatList
        data={data?.jobs || []}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = '#6B7280';
  let bgColor = '#F3F4F6';

  switch (status.toUpperCase()) {
    case 'ACTIVE':
      color = '#10B981';
      bgColor = '#D1FAE5';
      break;
    case 'IN_PROGRESS':
      color = '#3B82F6';
      bgColor = '#DBEAFE';
      break;
    case 'COMPLETED':
      color = '#8B5CF6';
      bgColor = '#EDE9FE';
      break;
    case 'CANCELLED':
      color = '#EF4444';
      bgColor = '#FEE2E2';
      break;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusBadgeText, { color }]}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobBudgetText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  jobApplications: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobApplicationsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  workerName: {
    fontSize: 14,
    color: '#6B7280',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clientName: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
