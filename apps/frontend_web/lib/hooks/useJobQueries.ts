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
 */
export function useAvailableJobs(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.available(),
    queryFn: fetchAvailableJobs,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch job categories
 */
export function useJobCategories(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.categories(),
    queryFn: fetchJobCategories,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (categories rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch workers near user
 */
export function useWorkers(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.workers(),
    queryFn: fetchWorkers,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch worker's applications
 */
export function useMyApplications(enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.applications(),
    queryFn: fetchMyApplications,
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
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
