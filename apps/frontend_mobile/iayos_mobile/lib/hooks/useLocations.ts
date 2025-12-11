import { useQuery } from "@tanstack/react-query";
import { fetchJson, ENDPOINTS } from "@/lib/api/config";

export interface City {
  cityID: number;
  name: string;
  province: string;
  region: string;
}

export interface Barangay {
  barangayID: number;
  name: string;
  zipCode: string | null;
}

/**
 * Fetch all cities
 */
export const useCities = () => {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const response = await fetchJson<{ success: boolean; cities: City[] }>(
        ENDPOINTS.GET_CITIES
      );
      return response.cities;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (cities rarely change)
  });
};

/**
 * Fetch barangays for a specific city
 */
export const useBarangays = (cityId: number) => {
  return useQuery({
    queryKey: ["barangays", cityId],
    queryFn: async () => {
      try {
        console.log("[useBarangays] Starting fetch for cityId:", cityId);
        console.log(
          "[useBarangays] Endpoint:",
          ENDPOINTS.GET_BARANGAYS(cityId)
        );

        const response = await fetchJson<{
          success: boolean;
          barangays: Barangay[];
        }>(ENDPOINTS.GET_BARANGAYS(cityId));

        console.log("[useBarangays] Response received:", {
          success: response.success,
          count: response.barangays?.length || 0,
          firstThree: response.barangays?.slice(0, 3) || [],
        });

        return response.barangays;
      } catch (error) {
        console.error("[useBarangays] Error fetching barangays:", error);
        throw error;
      }
    },
    enabled: !!cityId, // Only fetch if cityId is provided
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (barangays rarely change)
    retry: 3,
    retryDelay: 1000,
  });
};
