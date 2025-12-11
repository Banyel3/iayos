/**
 * useWorkerProfileScore - React Query hook for ML-based worker profile scoring
 *
 * Calls the LSTM worker profile rating model to get a profile score (0-100)
 * and personalized improvement suggestions for the worker.
 *
 * This is designed for workers viewing their OWN profile as an improvement tool,
 * NOT for clients judging workers.
 *
 * Usage in worker profile screen:
 * ```tsx
 * const { data: profileScore, isLoading, error } = useWorkerProfileScore(workerId);
 *
 * if (profileScore) {
 *   console.log(profileScore.profile_score); // 0-100
 *   console.log(profileScore.improvement_suggestions); // string[]
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson } from "../api/config";

// ============================================================================
// Types
// ============================================================================

export interface WorkerProfileScoreResponse {
  profile_score: number | null; // 0-100
  rating_category: "Poor" | "Fair" | "Good" | "Excellent" | "Unknown";
  improvement_suggestions: string[];
  source: "model" | "ml_service" | "fallback" | "error";
  error?: string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching worker profile score.
 *
 * @param workerId - The worker profile ID to get score for
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with profile score and improvement suggestions
 */
export function useWorkerProfileScore(
  workerId: number | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["worker-profile-score", workerId],
    queryFn: async (): Promise<WorkerProfileScoreResponse> => {
      if (!workerId) {
        throw new Error("Worker ID is required");
      }

      const response = await fetchJson<WorkerProfileScoreResponse>(
        ENDPOINTS.WORKER_PROFILE_SCORE(workerId)
      );

      // Check for API-level errors
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    enabled: enabled && !!workerId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change frequently
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get color based on profile score.
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return "#10B981"; // Excellent - green
  if (score >= 70) return "#3B82F6"; // Good - blue
  if (score >= 50) return "#F59E0B"; // Fair - amber
  return "#EF4444"; // Poor - red
}

/**
 * Get category badge info based on rating category.
 */
export function getCategoryInfo(category: string): {
  label: string;
  color: string;
  emoji: string;
} {
  switch (category) {
    case "Excellent":
      return { label: "Excellent", color: "#10B981", emoji: "🌟" };
    case "Good":
      return { label: "Good", color: "#3B82F6", emoji: "✨" };
    case "Fair":
      return { label: "Fair", color: "#F59E0B", emoji: "📈" };
    case "Poor":
      return { label: "Needs Work", color: "#EF4444", emoji: "💪" };
    default:
      return { label: "Unknown", color: "#6B7280", emoji: "❓" };
  }
}

/**
 * Get motivational message based on score.
 */
export function getMotivationalMessage(score: number): string {
  if (score >= 90) {
    return "Your profile is outstanding! You're in the top tier of workers.";
  }
  if (score >= 85) {
    return "Excellent work! Your profile is very competitive.";
  }
  if (score >= 70) {
    return "Good job! A few improvements could boost your visibility.";
  }
  if (score >= 50) {
    return "You're on the right track! Follow the suggestions to stand out.";
  }
  return "Let's improve your profile together! Small changes make a big difference.";
}

/**
 * Calculate progress to next tier.
 */
export function getProgressToNextTier(score: number): {
  nextTier: string;
  pointsNeeded: number;
  progress: number;
} {
  if (score >= 85) {
    return { nextTier: "Max", pointsNeeded: 0, progress: 100 };
  }
  if (score >= 70) {
    return {
      nextTier: "Excellent",
      pointsNeeded: 85 - score,
      progress: ((score - 70) / 15) * 100,
    };
  }
  if (score >= 50) {
    return {
      nextTier: "Good",
      pointsNeeded: 70 - score,
      progress: ((score - 50) / 20) * 100,
    };
  }
  return {
    nextTier: "Fair",
    pointsNeeded: 50 - score,
    progress: (score / 50) * 100,
  };
}
