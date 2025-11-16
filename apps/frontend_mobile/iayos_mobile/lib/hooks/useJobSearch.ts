/**
 * useJobSearch Hook - Search and filter jobs
 *
 * Features:
 * - Real-time search with debouncing
 * - Recent searches tracking
 * - Advanced filters
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '@/lib/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, JobsResponse } from './useJobs';

const RECENT_SEARCHES_KEY = '@iayos_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Hook to search jobs by query string
 */
export function useJobSearch(
  query: string,
  page: number = 1,
  limit: number = 20,
  options?: UseQueryOptions<JobsResponse>
) {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', 'search', query, page, limit],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_SEARCH(query, page, limit);
      const response = await apiRequest(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }

      const data = await response.json();
      return data;
    },
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to manage recent searches
 */
export function useRecentSearches() {
  const queryClient = useQueryClient();

  // Get recent searches
  const { data: recentSearches = [], refetch } = useQuery<string[]>({
    queryKey: ['recentSearches'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading recent searches:', error);
        return [];
      }
    },
    staleTime: Infinity, // Never auto-refetch
  });

  // Add search to recent searches
  const addSearch = useMutation({
    mutationFn: async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed || trimmed.length < 2) return recentSearches;

      // Remove duplicates and add to beginning
      const filtered = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['recentSearches'], data);
    },
  });

  // Clear all recent searches
  const clearSearches = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(['recentSearches'], []);
    },
  });

  // Remove a specific search
  const removeSearch = useMutation({
    mutationFn: async (searchQuery: string) => {
      const updated = recentSearches.filter(s => s !== searchQuery);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['recentSearches'], data);
    },
  });

  return {
    recentSearches,
    addSearch: addSearch.mutate,
    clearSearches: clearSearches.mutate,
    removeSearch: removeSearch.mutate,
    refetch,
  };
}
