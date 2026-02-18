/**
 * useJobSuggestions - React Query hook for database-driven job field suggestions
 *
 * Fetches suggestions for job creation fields (title, description, materials, duration)
 * mined from completed jobs in the same category. Falls back to hardcoded suggestions
 * when the database has insufficient data.
 *
 * Usage:
 * ```tsx
 * const { data, mutate: fetchSuggestions, isPending } = useJobSuggestions();
 *
 * // Fetch suggestions when category changes
 * useEffect(() => {
 *   if (categoryId) {
 *     fetchSuggestions({ category_id: categoryId, field: "title" });
 *   }
 * }, [categoryId]);
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson } from "../api/config";

// ============================================================================
// Types
// ============================================================================

export interface JobSuggestionsRequest {
  category_id: number;
  field: "title" | "description" | "materials" | "duration";
  query?: string; // Optional partial text to filter
  limit?: number; // Max suggestions (default: 8)
}

export interface JobSuggestion {
  text: string;
  frequency: number; // How many completed jobs used this
}

export interface JobSuggestionsResponse {
  suggestions: JobSuggestion[];
  field: string;
  category_name: string | null;
  source: "database" | "fallback";
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching job field suggestions.
 *
 * Uses useMutation so it can be called imperatively (on category change,
 * on text input focus, etc.) without automatic refetching.
 */
export function useJobSuggestions() {
  return useMutation({
    mutationKey: ["job-suggestions"],
    mutationFn: async (
      data: JobSuggestionsRequest,
    ): Promise<JobSuggestionsResponse> => {
      if (!data.category_id) {
        throw new Error("Category required for suggestions");
      }

      const response = await fetchJson<JobSuggestionsResponse>(
        ENDPOINTS.JOB_SUGGESTIONS,
        {
          method: "POST",
          body: JSON.stringify({
            category_id: data.category_id,
            field: data.field || "title",
            query: data.query || null,
            limit: data.limit || 8,
          }),
        },
      );

      return response;
    },
    retry: 1,
    retryDelay: 500,
  });
}
