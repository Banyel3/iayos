/**
 * useCategories Hook - Fetch and manage job categories
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export interface Category {
  id: number;
  name: string;
  specializationName?: string;
  icon?: string;
  jobCount?: number;
  description?: string;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  total: number;
}

/**
 * Hook to fetch all job categories
 */
export function useCategories(
  options?: UseQueryOptions<CategoriesResponse, Error, CategoriesResponse>
) {
  return useQuery<CategoriesResponse, Error, CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoriesResponse> => {
      const response = await apiRequest(ENDPOINTS.JOB_CATEGORIES, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = (await response.json()) as CategoriesResponse;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
    ...options,
  });
}

/**
 * Helper function to get category icon name
 */
export function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    Plumbing: "water-outline",
    Electrical: "flash-outline",
    Carpentry: "hammer-outline",
    Painting: "color-palette-outline",
    Cleaning: "sparkles-outline",
    Landscaping: "leaf-outline",
    Masonry: "cube-outline",
    HVAC: "thermometer-outline",
    Roofing: "home-outline",
    Welding: "flame-outline",
    Automotive: "car-outline",
    "General Labor": "person-outline",
    Moving: "move-outline",
    Delivery: "bicycle-outline",
  };

  return iconMap[categoryName] || "briefcase-outline";
}
