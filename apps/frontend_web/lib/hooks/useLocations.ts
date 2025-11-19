import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/config";

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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const response = await fetch(`${API_BASE_URL}/mobile/locations/cities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }

      const data = await response.json();
      return data.cities as City[];
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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      console.log("[useBarangays] Fetching barangays for city:", cityId);
      console.log(
        "[useBarangays] API URL:",
        `${API_BASE_URL}/mobile/locations/cities/${cityId}/barangays`
      );
      console.log("[useBarangays] Has token:", !!token);

      const response = await fetch(
        `${API_BASE_URL}/mobile/locations/cities/${cityId}/barangays`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("[useBarangays] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useBarangays] Error response:", errorText);
        throw new Error(`Failed to fetch barangays: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "[useBarangays] Success! Barangays count:",
        data.barangays?.length
      );
      return data.barangays as Barangay[];
    },
    enabled: !!cityId, // Only fetch if cityId is provided
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (barangays rarely change)
  });
};
