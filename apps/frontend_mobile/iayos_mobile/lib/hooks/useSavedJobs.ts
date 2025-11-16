/**
 * useSavedJobs Hook - Manage saved/bookmarked jobs
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '@/lib/api/config';
import { Job } from './useJobs';

export interface SavedJobsResponse {
  success: boolean;
  jobs: Job[];
  total: number;
}

/**
 * Hook to fetch saved jobs
 */
export function useSavedJobs(options?: UseQueryOptions<SavedJobsResponse>) {
  return useQuery<SavedJobsResponse>({
    queryKey: ['jobs', 'saved'],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.SAVED_JOBS, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved jobs');
      }

      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    ...options,
  });
}

/**
 * Hook to check if a job is saved
 */
export function useIsJobSaved(jobId: number | string) {
  const { data: savedJobs } = useSavedJobs();

  const isSaved = savedJobs?.jobs?.some(
    (job) => job.id.toString() === jobId.toString()
  ) ?? false;

  return { isSaved };
}
