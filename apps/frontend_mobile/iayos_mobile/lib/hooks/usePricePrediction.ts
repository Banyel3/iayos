/**
 * usePricePrediction - React Query hook for ML-based price prediction
 *
 * Calls the LSTM price prediction model to get suggested price range
 * based on job details (title, description, category, urgency).
 *
 * Usage in job creation form:
 * ```tsx
 * const { mutate: predictPrice, data: priceData, isPending } = usePricePrediction();
 *
 * // Call when user enters job details
 * useEffect(() => {
 *   if (title && description && categoryId) {
 *     predictPrice({ title, description, category_id: categoryId, urgency });
 *   }
 * }, [title, description, categoryId, urgency]);
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson } from "../api/config";

// ============================================================================
// Types
// ============================================================================

export interface PricePredictionRequest {
  title: string;
  description: string;
  category_id: number;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
  skill_level?: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  job_scope?: "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION";
  work_environment?: "INDOOR" | "OUTDOOR" | "BOTH";
  materials?: string[];
}

export interface PricePredictionResponse {
  min_price: number;
  suggested_price: number;
  max_price: number;
  confidence: number; // 0-1, higher = more reliable
  currency: string; // "PHP"
  source: "model" | "ml_service" | "fallback" | "error";
  error?: string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for price prediction mutation.
 *
 * Returns a mutation that can be called with job details to get
 * a suggested price range from the ML model.
 */
export function usePricePrediction() {
  return useMutation({
    mutationKey: ["price-prediction"],
    mutationFn: async (
      data: PricePredictionRequest
    ): Promise<PricePredictionResponse> => {
      // Validate minimum input requirements
      if (!data.title || data.title.length < 5) {
        throw new Error("Title too short for prediction");
      }
      if (!data.description || data.description.length < 10) {
        throw new Error("Description too short for prediction");
      }
      if (!data.category_id) {
        throw new Error("Category required for prediction");
      }

      const response = await fetchJson<PricePredictionResponse>(
        ENDPOINTS.PREDICT_PRICE,
        {
          method: "POST",
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category_id: data.category_id,
            urgency: data.urgency || "MEDIUM",
            skill_level: data.skill_level || "INTERMEDIATE",
            job_scope: data.job_scope || "MINOR_REPAIR",
            work_environment: data.work_environment || "INDOOR",
            materials: data.materials || [],
          }),
        }
      );

      // Check for API-level errors
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    retry: 1, // Retry once on failure
    retryDelay: 500,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format price range for display.
 * Returns "₱500 - ₱1,500" format string.
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: string = "PHP"
): string {
  const formatNum = (n: number) =>
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return `₱${formatNum(min)} - ₱${formatNum(max)}`;
}

/**
 * Get confidence label based on confidence value.
 */
export function getConfidenceLabel(
  confidence: number
): "high" | "medium" | "low" {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.4) return "medium";
  return "low";
}

/**
 * Get source display label.
 */
export function getSourceLabel(source: string): string {
  switch (source) {
    case "model":
      return "AI Model";
    case "ml_service":
      return "AI Service";
    case "fallback":
      return "Category Average";
    case "fallback_ph":
      return "Category Average (PH)";
    default:
      return "Estimate";
  }
}
