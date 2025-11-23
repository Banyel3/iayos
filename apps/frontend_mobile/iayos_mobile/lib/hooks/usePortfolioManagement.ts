// lib/hooks/usePortfolioManagement.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export interface PortfolioImage {
  id: number;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
  uploadedAt: string;
}

export const usePortfolioManagement = () => {
  const queryClient = useQueryClient();

  // Fetch portfolio images
  const {
    data: images = [],
    isLoading,
    error,
  } = useQuery<PortfolioImage[]>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.PORTFOLIO_LIST);
      if (!response.ok) throw new Error("Failed to fetch portfolio");
      const data = await response.json();
      // Ensure sorted by displayOrder
      return Array.isArray(data)
        ? data.sort((a, b) => a.displayOrder - b.displayOrder)
        : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update caption
  const updateCaption = useMutation({
    mutationFn: async ({ id, caption }: { id: number; caption: string }) => {
      const response = await apiRequest(ENDPOINTS.PORTFOLIO_UPDATE(id), {
        method: "PUT",
        body: JSON.stringify({ caption }),
      });
      if (!response.ok) throw new Error("Failed to update caption");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  // Reorder images
  const reorderImages = useMutation({
    mutationFn: async (imageIds: number[]) => {
      const response = await apiRequest(ENDPOINTS.PORTFOLIO_REORDER, {
        method: "PUT",
        body: JSON.stringify({ imageIds }),
      });
      if (!response.ok) throw new Error("Failed to reorder");
      return response.json();
    },
    onMutate: async (newImageIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["portfolio"] });

      // Snapshot previous value
      const previousImages = queryClient.getQueryData<PortfolioImage[]>([
        "portfolio",
      ]);

      // Optimistically update to new value
      if (previousImages) {
        const reordered = newImageIds
          .map((id) => previousImages.find((img) => img.id === id))
          .filter((img): img is PortfolioImage => img !== undefined)
          .map((img, index) => ({ ...img, displayOrder: index }));

        queryClient.setQueryData(["portfolio"], reordered);
      }

      return { previousImages };
    },
    onError: (err, newImageIds, context) => {
      // Rollback on error
      if (context?.previousImages) {
        queryClient.setQueryData(["portfolio"], context.previousImages);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  // Delete image
  const deleteImage = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(ENDPOINTS.PORTFOLIO_DELETE(id), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["portfolio"] });

      // Snapshot previous value
      const previousImages = queryClient.getQueryData<PortfolioImage[]>([
        "portfolio",
      ]);

      // Optimistically update
      if (previousImages) {
        const filtered = previousImages.filter((img) => img.id !== deletedId);
        queryClient.setQueryData(["portfolio"], filtered);
      }

      return { previousImages };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousImages) {
        queryClient.setQueryData(["portfolio"], context.previousImages);
      }
    },
    onSuccess: () => {
      // Invalidate profile to update completion percentage
      queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  return {
    images,
    isLoading,
    error,
    updateCaption,
    reorderImages,
    deleteImage,
    hasMaxImages: images.length >= 10,
    canAddMore: images.length < 10,
    remainingSlots: Math.max(0, 10 - images.length),
  };
};
