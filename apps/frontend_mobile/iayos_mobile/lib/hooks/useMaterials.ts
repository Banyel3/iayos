// Materials/Products Management Hooks
// React Query hooks for managing worker materials/products

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson } from "@/lib/api/config";

// ===== TYPES =====

export interface Material {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string; // e.g., "per kg", "per piece", "per meter"
  isAvailable: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  name: string;
  description: string;
  price: number;
  unit: string;
  isAvailable?: boolean;
  imageFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface UpdateMaterialRequest {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  isAvailable?: boolean;
}

// ===== HOOKS =====

/**
 * Fetch all materials for the current worker
 */
export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async (): Promise<Material[]> => {
      return fetchJson<Material[]>(ENDPOINTS.MATERIALS, {
        credentials: "include",
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single material by ID
 */
export function useMaterial(id: number) {
  return useQuery<Material>({
    queryKey: ["materials", id],
    queryFn: async (): Promise<Material> => {
      return fetchJson<Material>(ENDPOINTS.MATERIAL_DETAIL(id), {
        credentials: "include",
      });
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new material
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterialRequest) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", data.price.toString());
      formData.append("unit", data.unit);
      formData.append("isAvailable", (data.isAvailable ?? true).toString());

      if (data.imageFile) {
        formData.append("image", {
          uri: data.imageFile.uri,
          name: data.imageFile.name,
          type: data.imageFile.type,
        } as any);
      }

      const response = await fetch(ENDPOINTS.MATERIALS, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create material");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

/**
 * Update an existing material
 */
export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateMaterialRequest;
    }) => {
      const response = await fetch(ENDPOINTS.MATERIAL_DETAIL(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update material");
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["materials", id] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

/**
 * Toggle material availability (quick action)
 */
export function useToggleMaterialAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: number;
      isAvailable: boolean;
    }) => {
      const response = await fetch(ENDPOINTS.MATERIAL_DETAIL(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isAvailable }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle availability");
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["materials", id] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

/**
 * Delete a material
 */
export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(ENDPOINTS.MATERIAL_DETAIL(id), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete material");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format price with currency
 */
export function formatPrice(price: number): string {
  return `₱${price.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format price per unit
 */
export function formatPricePerUnit(price: number, unit: string): string {
  return `${formatPrice(price)} ${unit}`;
}

/**
 * Validate price (must be positive)
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 1000000;
}
