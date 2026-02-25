/**
 * useJobMaterials - Hooks for the job materials purchasing workflow
 *
 * Handles: fetching materials, uploading purchase proof, approving/rejecting,
 * marking buying status, and skipping the materials step.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import type { JobMaterialItem } from "./useMessages";

export interface JobMaterialsResponse {
  success: boolean;
  materials: JobMaterialItem[];
  materials_status: string;
  materials_cost: number;
}

/**
 * Fetch all materials for a specific job
 */
export function useJobMaterials(jobId: number | null, enabled: boolean = true) {
  return useQuery<JobMaterialsResponse, Error>({
    queryKey: ["job-materials", jobId],
    queryFn: async (): Promise<JobMaterialsResponse> => {
      if (!jobId) throw new Error("Job ID is required");
      const response = await apiRequest(ENDPOINTS.JOB_MATERIALS(jobId));
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: "Failed to fetch materials",
        }))) as { error?: string };
        throw new Error(errorData.error || "Failed to fetch materials");
      }
      return response.json() as Promise<JobMaterialsResponse>;
    },
    enabled: enabled && !!jobId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Add a material to a job (worker only)
 */
export function useAddJobMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      material,
    }: {
      jobId: number;
      material: {
        name: string;
        description?: string;
        quantity?: number;
        unit?: string;
        source: "FROM_PROFILE" | "TO_PURCHASE";
        worker_material_id?: number;
        added_by?: string;
      };
    }) => {
      const response = await apiRequest(ENDPOINTS.JOB_MATERIALS(jobId), {
        method: "POST",
        body: JSON.stringify(material),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to add material",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to add material");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

/**
 * Upload purchase proof for a material (worker only)
 */
export function useUploadPurchaseProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      materialId,
      purchase_price,
      receipt_image_url,
    }: {
      jobId: number;
      materialId: number;
      purchase_price: number;
      receipt_image_url: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_MATERIAL_PURCHASE_PROOF(jobId, materialId),
        {
          method: "PUT",
          body: JSON.stringify({ purchase_price, receipt_image_url }),
        }
      );
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to upload proof",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to upload proof");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

/**
 * Client approves a material purchase
 */
export function useApproveMaterialPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      materialId,
    }: {
      jobId: number;
      materialId: number;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_MATERIAL_APPROVE(jobId, materialId),
        { method: "PUT" }
      );
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to approve",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to approve");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

/**
 * Client rejects a material purchase
 */
export function useRejectMaterialPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      materialId,
      reason,
    }: {
      jobId: number;
      materialId: number;
      reason?: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_MATERIAL_REJECT(jobId, materialId),
        {
          method: "PUT",
          body: JSON.stringify({ reason: reason || "" }),
        }
      );
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to reject",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to reject");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

/**
 * Worker marks they are buying materials
 */
export function useMarkMaterialsBuying() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_MATERIALS_MARK_BUYING(jobId),
        { method: "PUT" }
      );
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to update",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to update");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

/**
 * Skip the materials step (no materials needed)
 */
export function useSkipMaterialsStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_MATERIALS_SKIP(jobId),
        { method: "PUT" }
      );
      if (!response.ok) {
        const err = (await response.json().catch(() => ({
          error: "Failed to skip",
        }))) as { error?: string };
        throw new Error(err.error || "Failed to skip");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["job-materials", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}
