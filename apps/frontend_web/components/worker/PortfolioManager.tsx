"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import {
  usePortfolio,
  useUploadPortfolioImage,
  useUpdatePortfolioCaption,
  useReorderPortfolio,
  useDeletePortfolioImage,
} from "@/lib/hooks/useWorkerProfile";
import { PortfolioUploadZone } from "./PortfolioUploadZone";
import { PortfolioGrid } from "./PortfolioGrid";
import { PortfolioImageModal } from "./PortfolioImageModal";
import type { PortfolioItemData } from "@/lib/api/worker-profile";

export function PortfolioManager() {
  const { data: portfolio, isLoading, error } = usePortfolio();
  const uploadImage = useUploadPortfolioImage();
  const updateCaption = useUpdatePortfolioCaption();
  const reorderPortfolio = useReorderPortfolio();
  const deleteImage = useDeletePortfolioImage();

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    // Validate file sizes (5MB max)
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter((file) => file.size <= maxSize);

    if (validFiles.length < files.length) {
      alert(`Some files were too large. Maximum size is 5MB per image.`);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Upload files sequentially to avoid overwhelming the server
    for (const file of validFiles) {
      try {
        await uploadImage.mutateAsync({ image: file });
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Continue with next file even if one fails
      }
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNavigate = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleUpdateCaption = (id: number, caption: string) => {
    updateCaption.mutate({ id, caption });
  };

  const handleReorder = (newItems: PortfolioItemData[]) => {
    // Create order array with IDs
    const order = newItems.map((item) => item.portfolioID);
    reorderPortfolio.mutate({ order });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId !== null) {
      deleteImage.mutate(deleteConfirmId, {
        onSuccess: () => {
          setDeleteConfirmId(null);
          // Close modal if currently viewing deleted image
          if (
            selectedImageIndex !== null &&
            portfolio &&
            portfolio[selectedImageIndex]?.portfolioID === deleteConfirmId
          ) {
            setSelectedImageIndex(null);
          }
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Failed to load portfolio</p>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasImages = portfolio && portfolio.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Portfolio
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {portfolio?.length || 0} image{portfolio?.length !== 1 ? "s" : ""}{" "}
            uploaded
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <PortfolioUploadZone
        onFilesSelected={handleFilesSelected}
        isUploading={uploadImage.isPending}
        maxFiles={10}
      />

      {/* Upload Progress */}
      {uploadImage.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-blue-800 font-medium">Uploading images...</p>
              <p className="text-sm text-blue-600">
                Please wait while we process your images
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {hasImages ? (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            <p>
              💡 Tip: Drag images to reorder them. The first image will be your
              featured portfolio item.
            </p>
          </div>
          <PortfolioGrid
            items={portfolio}
            onImageClick={handleImageClick}
            onDelete={handleDeleteClick}
            onReorder={handleReorder}
          />
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-2">No portfolio images yet</p>
          <p className="text-sm text-gray-500">
            Showcase your best work by uploading images above
          </p>
        </div>
      )}

      {/* Image Modal */}
      {selectedImageIndex !== null && portfolio && (
        <PortfolioImageModal
          isOpen={true}
          onClose={handleCloseModal}
          images={portfolio}
          currentIndex={selectedImageIndex}
          onNavigate={handleNavigate}
          onUpdateCaption={handleUpdateCaption}
          isUpdating={updateCaption.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-2">Delete Image?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this image from your portfolio?
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteImage.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteImage.isPending}
                className="flex-1"
              >
                {deleteImage.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
