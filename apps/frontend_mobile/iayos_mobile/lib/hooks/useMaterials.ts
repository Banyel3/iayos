// Materials/Products Management Hooks
// React Query hooks for managing worker materials/products

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

// ===== TYPES =====

export interface Material {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string; // e.g., "per kg", "per piece", "per meter"
  isAvailable: boolean;
  imageUrl: string | null;
  categoryId: number | null; // Linked category/specialization ID
  categoryName: string | null; // Category name for display
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  isAvailable?: boolean;
  categoryId?: number; // Optional category link
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
  quantity?: number;
  unit?: string;
  isAvailable?: boolean;
  categoryId?: number | null; // null/-1 to remove category
  imageFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

function mapMaterialResponse(material: any): Material {
  return {
    id: material.materialID,
    name: material.name,
    description: material.description,
    price: Number(material.price ?? 0),
    quantity: Number(material.quantity ?? 1),
    unit: material.unit,
    isAvailable: material.is_available,
    imageUrl: material.image_url,
    categoryId: material.category_id ?? null,
    categoryName: material.category_name ?? null,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

// ===== HOOKS =====

/**
 * Fetch all materials for the current worker
 */
export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async (): Promise<Material[]> => {
      const response = await apiRequest(ENDPOINTS.MATERIALS);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      const result = await response.json();
      return Array.isArray(result) ? result.map(mapMaterialResponse) : [];
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
      const response = await apiRequest(ENDPOINTS.MATERIAL_DETAIL(id));
      if (!response.ok) {
        throw new Error("Failed to fetch material");
      }
      const result = await response.json();
      return mapMaterialResponse(result);
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
      formData.append("quantity", (data.quantity ?? 1).toString());
      formData.append("unit", data.unit);
      formData.append("isAvailable", (data.isAvailable ?? true).toString());

      // Add category_id if provided
      if (data.categoryId !== undefined && data.categoryId !== null) {
        formData.append("category_id", data.categoryId.toString());
      }

      if (data.imageFile) {
        formData.append("image", {
          uri: data.imageFile.uri,
          name: data.imageFile.name,
          type: data.imageFile.type,
        } as any);
      }

      const response = await apiRequest(ENDPOINTS.MATERIALS, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to create material"
        );
      }

      const result = await response.json();

      // Map backend response (snake_case) to frontend (camelCase)
      if (result.material) {
        return {
          id: result.material.materialID,
          name: result.material.name,
          description: result.material.description,
          price: result.material.price,
          quantity: result.material.quantity,
          unit: result.material.unit,
          isAvailable: result.material.is_available,
          imageUrl: result.material.image_url,
          categoryId: result.material.category_id ?? null,
          categoryName: result.material.category_name ?? null,
          createdAt: result.material.createdAt,
          updatedAt: result.material.updatedAt,
        };
      }

      return result;
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
      let response: Response;

      if (data.imageFile) {
        // Use FormData for multipart upload
        const formData = new FormData();
        if (data.name) formData.append("name", data.name);
        if (data.description) formData.append("description", data.description);
        if (data.price !== undefined)
          formData.append("price", data.price.toString());
        if (data.quantity !== undefined)
          formData.append("quantity", data.quantity.toString());
        if (data.unit) formData.append("unit", data.unit);
        if (data.isAvailable !== undefined)
          formData.append("is_available", data.isAvailable.toString());

        // Handle category update: null/-1 removes category, number sets it
        if (data.categoryId !== undefined) {
          const categoryValue = data.categoryId === null ? -1 : data.categoryId;
          formData.append("category_id", categoryValue.toString());
        }

        formData.append("image_file", {
          uri: data.imageFile.uri,
          name: data.imageFile.name,
          type: data.imageFile.type,
        } as any);

        response = await apiRequest(ENDPOINTS.MATERIAL_DETAIL(id), {
          method: "PUT",
          body: formData,
        });
      } else {
        // Use FormData for text-only updates too (backend expects Form params)
        const formData = new FormData();
        if (data.name) formData.append("name", data.name);
        if (data.description !== undefined)
          formData.append("description", data.description);
        if (data.price !== undefined)
          formData.append("price", data.price.toString());
        if (data.quantity !== undefined)
          formData.append("quantity", data.quantity.toString());
        if (data.unit) formData.append("unit", data.unit);
        if (data.isAvailable !== undefined)
          formData.append("is_available", data.isAvailable.toString());

        // Handle category update: null/-1 removes category, number sets it
        if (data.categoryId !== undefined) {
          const categoryValue = data.categoryId === null ? -1 : data.categoryId;
          formData.append("category_id", categoryValue.toString());
        }

        response = await apiRequest(ENDPOINTS.MATERIAL_DETAIL(id), {
          method: "PUT",
          body: formData,
        });
      }

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
      const response = await apiRequest(ENDPOINTS.MATERIAL_DETAIL(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
      const response = await apiRequest(ENDPOINTS.MATERIAL_DETAIL(id), {
        method: "DELETE",
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
 * Format price per unit with optional quantity context
 */
export function formatPricePerUnit(
  price: number,
  unit: string,
  quantity?: number
): string {
  const quantityLabel =
    typeof quantity === "number" && !Number.isNaN(quantity)
      ? ` • Qty: ${quantity}`
      : "";
  return `${formatPrice(price)} ${unit}${quantityLabel}`;
}

/**
 * Validate price (must be positive)
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 1000000;
}

// ===== WORKER SKILLS =====

export interface WorkerSkill {
  id: number;
  name: string;
  description: string;
  experienceYears: number;
  certification: string;
}

/**
 * Fetch worker's own skills/specializations
 * Used for material category selection (workers can only link materials to skills they have)
 */
export function useMySkills() {
  return useQuery<WorkerSkill[]>({
    queryKey: ["my-skills"],
    queryFn: async (): Promise<WorkerSkill[]> => {
      const response = await apiRequest(ENDPOINTS.MY_SKILLS);
      if (!response.ok) {
        throw new Error("Failed to fetch skills");
      }
      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
