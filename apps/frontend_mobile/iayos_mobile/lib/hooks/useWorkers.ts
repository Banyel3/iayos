/**
 * useWorkers Hook - Fetch and manage worker listings for clients
 *
 * Features:
 * - Fetch nearby workers filtered by distance
 * - Category filtering
 * - Pagination support
 * - Caching with TanStack Query
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/query-core";
import { ENDPOINTS, fetchJson, getAbsoluteMediaUrl, apiRequest } from "@/lib/api/config";

export interface Worker {
  id: number;
  name: string;
  avatar?: string;
  rating: number;
  completedJobs: number;
  categories: string[];
  hourlyRate?: number;
  distance?: number;
  location?: string;
  bio?: string;
  isAvailable: boolean;
  verificationLevel?: number; // 0=Unverified, 1=ID Verified, 2=Fully Verified
}

// Backend response interface (API returns data directly, not wrapped)
interface BackendWorker {
  worker_id: number;
  profile_id: number;
  account_id: number;
  name: string;
  profile_img?: string;
  bio?: string;
  hourly_rate?: number;
  availability_status: string;
  average_rating?: number;
  review_count?: number;
  completed_jobs?: number;
  specializations?: Array<{ id: number; name: string }>;
  // Newer backend returns skills instead of specializations; mirror shape
  skills?: Array<{
    id: number;
    specializationId?: number;
    name: string;
    experienceYears?: number;
    certificationCount?: number;
  }>;
  total_earning?: number;
  distance_km?: number;
  verification_level?: number;
}

interface BackendWorkersResponse {
  workers: BackendWorker[];
  total_count: number;
  page: number;
  pages: number;
}

export interface WorkersResponse {
  success: boolean;
  workers: Worker[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkerFilters {
  category?: number;
  minRate?: number;
  maxRate?: number;
  maxDistance?: number;
  // Location is needed for backend distance calculation
  latitude?: number;
  longitude?: number;
  // Client-side sort options (distance asc/desc, rating asc/desc)
  sortBy?: "distance_asc" | "distance_desc" | "rating_desc" | "rating_asc";
  // Minimum rating filter (e.g., 3, 4, 4.5)
  minRating?: number;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch nearby workers with optional filters
 */
export function useWorkers(
  filters: WorkerFilters = {},
  options?: UseQueryOptions<WorkersResponse, Error, WorkersResponse>
) {
  return useQuery<WorkersResponse, Error, WorkersResponse>({
    queryKey: ["workers", "nearby", filters],
    queryFn: async (): Promise<WorkersResponse> => {
      const params = new URLSearchParams();

      if (filters.category) params.append("category", String(filters.category));
      if (filters.minRate) params.append("min_rate", String(filters.minRate));
      if (filters.maxRate) params.append("max_rate", String(filters.maxRate));
      if (filters.maxDistance)
        params.append("max_distance", String(filters.maxDistance));
      if (filters.latitude) params.append("latitude", String(filters.latitude));
      if (filters.longitude)
        params.append("longitude", String(filters.longitude));
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit || 20));

      const url = `${ENDPOINTS.NEARBY_WORKERS}?${params.toString()}`;
      const backendResponse = await fetchJson<BackendWorkersResponse>(url, {
        method: "GET",
      });

      // Transform backend response to frontend format
      let transformedWorkers: Worker[] = backendResponse.workers.map(
        (worker: BackendWorker) => {
          // Backend now returns `skills`; fallback to old `specializations`
          const specs = worker.skills || worker.specializations || [];
          return {
            id: worker.worker_id,
            name: worker.name,
            avatar: getAbsoluteMediaUrl(worker.profile_img) || undefined,
            rating: worker.average_rating || 0,
            completedJobs: worker.completed_jobs || 0,
            categories: specs.map((s) => s.name || ""),
            hourlyRate: worker.hourly_rate,
            distance: worker.distance_km,
            location: undefined, // Not provided by backend
            bio: worker.bio,
            isAvailable: worker.availability_status === "AVAILABLE",
            verificationLevel: worker.verification_level,
          };
        }
      );

      // Client-side distance filter (backend may ignore max_distance)
      if (filters.maxDistance) {
        transformedWorkers = transformedWorkers.filter((w) => {
          if (w.distance == null) return true; // keep if no distance info
          return w.distance <= filters.maxDistance!;
        });
      }

      // Client-side minimum rating filter
      if (filters.minRating) {
        transformedWorkers = transformedWorkers.filter((w) => {
          return (w.rating ?? 0) >= filters.minRating!;
        });
      }

      // Client-side sorting
      if (filters.sortBy) {
        const sort = filters.sortBy;
        transformedWorkers = [...transformedWorkers].sort((a, b) => {
          const distA = a.distance ?? Number.POSITIVE_INFINITY;
          const distB = b.distance ?? Number.POSITIVE_INFINITY;
          switch (sort) {
            case "distance_asc":
              return distA - distB;
            case "distance_desc":
              return distB - distA;
            case "rating_desc":
              return (b.rating ?? 0) - (a.rating ?? 0);
            case "rating_asc":
              return (a.rating ?? 0) - (b.rating ?? 0);
            default:
              return 0;
          }
        });
      }

      return {
        success: true,
        workers: transformedWorkers,
        total: backendResponse.total_count,
        page: backendResponse.page,
        limit: filters.limit || 20,
        totalPages: backendResponse.pages,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/** Number of items fetched per page on the homepage */
export const HOMEPAGE_PAGE_SIZE = 15;

/**
 * Hook to fetch workers with infinite scroll pagination (15 items per page)
 */
export function useInfiniteWorkers(filters: Omit<WorkerFilters, "page"> = {}) {
  return useInfiniteQuery<
    WorkersResponse,
    Error,
    InfiniteData<WorkersResponse>
  >({
    queryKey: ["workers", "nearby", "infinite", filters],
    queryFn: async ({ pageParam = 1 }): Promise<WorkersResponse> => {
      const params = new URLSearchParams();

      if (filters.category) params.append("category", String(filters.category));
      if (filters.minRate) params.append("min_rate", String(filters.minRate));
      if (filters.maxRate) params.append("max_rate", String(filters.maxRate));
      if (filters.maxDistance)
        params.append("max_distance", String(filters.maxDistance));
      if (filters.latitude) params.append("latitude", String(filters.latitude));
      if (filters.longitude)
        params.append("longitude", String(filters.longitude));
      params.append("page", String(pageParam));
      params.append("limit", String(filters.limit || HOMEPAGE_PAGE_SIZE));

      const url = `${ENDPOINTS.NEARBY_WORKERS}?${params.toString()}`;
      const backendResponse = await fetchJson<BackendWorkersResponse>(url, {
        method: "GET",
      });

      // Transform backend response to frontend format
      let transformedWorkers: Worker[] = backendResponse.workers.map(
        (worker: BackendWorker) => {
          const specs = worker.skills || worker.specializations || [];
          return {
            id: worker.worker_id,
            name: worker.name,
            avatar: getAbsoluteMediaUrl(worker.profile_img) || undefined,
            rating: worker.average_rating || 0,
            completedJobs: worker.completed_jobs || 0,
            categories: specs.map((s) => s.name || ""),
            hourlyRate: worker.hourly_rate,
            distance: worker.distance_km,
            location: undefined, // Not provided by backend
            bio: worker.bio,
            isAvailable: worker.availability_status === "AVAILABLE",
            verificationLevel: worker.verification_level,
          };
        }
      );

      if (filters.maxDistance) {
        transformedWorkers = transformedWorkers.filter((w) => {
          if (w.distance == null) return true;
          return w.distance <= filters.maxDistance!;
        });
      }

      // Client-side minimum rating filter
      if (filters.minRating) {
        transformedWorkers = transformedWorkers.filter((w) => {
          return (w.rating ?? 0) >= filters.minRating!;
        });
      }

      if (filters.sortBy) {
        const sort = filters.sortBy;
        transformedWorkers = [...transformedWorkers].sort((a, b) => {
          const distA = a.distance ?? Number.POSITIVE_INFINITY;
          const distB = b.distance ?? Number.POSITIVE_INFINITY;
          switch (sort) {
            case "distance_asc":
              return distA - distB;
            case "distance_desc":
              return distB - distA;
            case "rating_desc":
              return (b.rating ?? 0) - (a.rating ?? 0);
            case "rating_asc":
              return (a.rating ?? 0) - (b.rating ?? 0);
            default:
              return 0;
          }
        });
      }

      return {
        success: true,
        workers: transformedWorkers,
        total: backendResponse.total_count,
        page: backendResponse.page,
        limit: filters.limit || HOMEPAGE_PAGE_SIZE,
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

// ---------------------------------------------------------------------------
// Worker availability hooks (worker-side)
// ---------------------------------------------------------------------------

interface WorkerAvailabilityData {
  isAvailable: boolean;
  availabilityStatus: string;
}

/**
 * Fetch the authenticated worker's current availability status.
 */
export function useWorkerAvailability(options?: { enabled?: boolean }) {
  return useQuery<WorkerAvailabilityData>({
    queryKey: ["worker-availability"],
    queryFn: async (): Promise<WorkerAvailabilityData> => {
      const res = await apiRequest(ENDPOINTS.WORKER_AVAILABILITY);
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = await res.json();
      const data = (json?.data ?? json) as Record<string, unknown>;
      return {
        isAvailable: data.isAvailable === true,
        availabilityStatus: (data.availabilityStatus as string) || "OFFLINE",
      };
    },
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

/**
 * Toggle the authenticated worker's availability status.
 * Optimistically updates the cache so the UI responds instantly.
 */
export function useUpdateWorkerAvailability() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, boolean>({
    mutationFn: async (isAvailable: boolean): Promise<void> => {
      const url = `${ENDPOINTS.WORKER_AVAILABILITY}?is_available=${isAvailable}`;
      const res = await apiRequest(url, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update availability");
    },
    onSuccess: (_data, isAvailable) => {
      // Synchronously update the query cache so the toggle reflects immediately
      queryClient.setQueryData<WorkerAvailabilityData>(["worker-availability"], {
        isAvailable,
        availabilityStatus: isAvailable ? "AVAILABLE" : "OFFLINE",
      });
      // Invalidate the client-side workers listing so hidden/shown workers refresh
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}
