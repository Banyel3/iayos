import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAvailableJobs,
  fetchJobCategories,
  fetchWorkers,
  fetchMyApplications,
  submitJobApplication,
} from "@/lib/api/jobs";

// Query Keys
export const jobKeys = {
  all: ["jobs"] as const,
  available: () => [...jobKeys.all, "available"] as const,
  categories: () => [...jobKeys.all, "categories"] as const,
  workers: () => [...jobKeys.all, "workers"] as const,
  applications: () => [...jobKeys.all, "applications"] as const,
};

/**
 * Hook to fetch available job postings for workers
 * Session storage: Instant load + background refresh
 */
export function useAvailableJobs(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.available(),
    queryFn: fetchAvailableJobs,
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to fetch job categories
 * Session storage: Instant load + background refresh
 */
export function useJobCategories(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.categories(),
    queryFn: fetchJobCategories,
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to fetch workers near user
 * Session storage: Instant load + background refresh
 */
export function useWorkers(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.workers(),
    queryFn: fetchWorkers,
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to fetch worker's applications
 * Session storage: Instant load + background refresh
 */
export function useMyApplications(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.applications(),
    queryFn: fetchMyApplications,
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to submit a job application
 */
export function useSubmitJobApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitJobApplication,
    onSuccess: (data, variables) => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: jobKeys.applications() });

      // Optimistically update the applications cache
      queryClient.setQueryData<Set<string>>(jobKeys.applications(), (old) => {
        const newSet = new Set(old || []);
        newSet.add(variables.jobId);
        return newSet;
      });
    },
  });
}
