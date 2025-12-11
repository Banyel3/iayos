/**
 * useAgencies Hook - Fetch and manage agency listings for clients
 *
 * Features:
 * - Fetch agencies with filters (city, province, rating)
 * - Sorting by rating, jobs, or created date
 * - Pagination support
 * - Caching with TanStack Query
 */

import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/query-core";
import { ENDPOINTS, fetchJson } from "@/lib/api/config";

export interface Agency {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  activeJobs: number;
  city?: string;
  province?: string;
  specializations: string[];
  kycStatus: string;
  isVerified: boolean;
}

// Backend response interface
interface BackendAgency {
  agencyId: number;
  businessName: string;
  businessDesc?: string;
  averageRating: number | null;
  totalReviews: number;
  completedJobs: number;
  activeJobs: number;
  city?: string;
  province?: string;
  specializations?: string[];
  kycStatus: string;
}

interface BackendAgenciesResponse {
  agencies: BackendAgency[];
  total: number;
  page: number;
  pages: number;
}

export interface AgenciesResponse {
  success: boolean;
  agencies: Agency[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgencyFilters {
  city?: string;
  province?: string;
  minRating?: number;
  sortBy?: "rating" | "jobs" | "created";
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch agencies with optional filters
 */
export function useAgencies(
  filters: AgencyFilters = {},
  options?: UseQueryOptions<AgenciesResponse, Error, AgenciesResponse>
) {
  return useQuery<AgenciesResponse, Error, AgenciesResponse>({
    queryKey: ["agencies", filters],
    queryFn: async (): Promise<AgenciesResponse> => {
      const params = new URLSearchParams();

      if (filters.city) params.append("city", filters.city);
      if (filters.province) params.append("province", filters.province);
      if (filters.minRating)
        params.append("min_rating", String(filters.minRating));
      if (filters.sortBy) params.append("sort_by", filters.sortBy);
      if (filters.page) params.append("page", String(filters.page));
      params.append("limit", String(filters.limit || 20));

      const url = `${ENDPOINTS.AGENCIES_LIST}?${params.toString()}`;
      const backendResponse = await fetchJson<BackendAgenciesResponse>(url, {
        method: "GET",
      });

      // Transform backend response to frontend format
      const transformedAgencies: Agency[] = backendResponse.agencies.map(
        (agency: BackendAgency) => ({
          id: agency.agencyId,
          name: agency.businessName,
          description: agency.businessDesc,
          avatar: undefined, // Agencies use generated avatars
          rating: agency.averageRating || 0,
          reviewCount: agency.totalReviews,
          completedJobs: agency.completedJobs,
          activeJobs: agency.activeJobs,
          city: agency.city,
          province: agency.province,
          specializations: agency.specializations || [],
          kycStatus: agency.kycStatus,
          isVerified: agency.kycStatus === "APPROVED",
        })
      );

      return {
        success: true,
        agencies: transformedAgencies,
        total: backendResponse.total,
        page: backendResponse.page,
        limit: filters.limit || 20,
        totalPages: backendResponse.pages,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch agencies with infinite scroll pagination
 */
export function useInfiniteAgencies(filters: Omit<AgencyFilters, "page"> = {}) {
  return useInfiniteQuery<
    AgenciesResponse,
    Error,
    InfiniteData<AgenciesResponse>
  >({
    queryKey: ["agencies", "infinite", filters],
    queryFn: async ({ pageParam = 1 }): Promise<AgenciesResponse> => {
      const params = new URLSearchParams();

      if (filters.city) params.append("city", filters.city);
      if (filters.province) params.append("province", filters.province);
      if (filters.minRating)
        params.append("min_rating", String(filters.minRating));
      if (filters.sortBy) params.append("sort_by", filters.sortBy);
      params.append("page", String(pageParam));
      params.append("limit", String(filters.limit || 20));

      const url = `${ENDPOINTS.AGENCIES_LIST}?${params.toString()}`;
      const backendResponse = await fetchJson<BackendAgenciesResponse>(url, {
        method: "GET",
      });

      // Transform backend response to frontend format
      const transformedAgencies: Agency[] = backendResponse.agencies.map(
        (agency: BackendAgency) => ({
          id: agency.agencyId,
          name: agency.businessName,
          description: agency.businessDesc,
          avatar: undefined,
          rating: agency.averageRating || 0,
          reviewCount: agency.totalReviews,
          completedJobs: agency.completedJobs,
          activeJobs: agency.activeJobs,
          city: agency.city,
          province: agency.province,
          specializations: agency.specializations || [],
          kycStatus: agency.kycStatus,
          isVerified: agency.kycStatus === "APPROVED",
        })
      );

      return {
        success: true,
        agencies: transformedAgencies,
        total: backendResponse.total,
        page: backendResponse.page,
        limit: filters.limit || 20,
        totalPages: backendResponse.pages,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
