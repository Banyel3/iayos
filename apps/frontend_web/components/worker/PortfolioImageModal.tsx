"use client";

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import type { PortfolioItemData } from "@/lib/api/worker-profile";

interface PortfolioImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: PortfolioItemData[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onUpdateCaption: (id: number, caption: string) => void;
  isUpdating?: boolean;
}

export function PortfolioImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  onUpdateCaption,
  isUpdating = false,
}: PortfolioImageModalProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleEditClick = () => {
    setEditedCaption(currentImage.caption || "");
    setIsEditingCaption(true);
  };

  const handleSaveCaption = () => {
    onUpdateCaption(currentImage.portfolioID, editedCaption);
    setIsEditingCaption(false);
  };

  const handleCancelEdit = () => {
    setIsEditingCaption(false);
    setEditedCaption("");
  };

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(currentIndex - 1);
      setIsEditingCaption(false);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
      setIsEditingCaption(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditingCaption) return;

    if (e.key === "ArrowLeft" && hasPrev) {
      handlePrev();
    } else if (e.key === "ArrowRight" && hasNext) {
      handleNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 text-white hover:text-gray-300 z-10"
        >
          <ChevronLeft className="h-12 w-12" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300 z-10"
        >
          <ChevronRight className="h-12 w-12" />
        </button>
      )}

      {/* Image and Caption Container */}
      <div
        className="max-w-6xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative max-h-[70vh] w-full flex items-center justify-center">
          <img
            src={currentImage.image_url}
            alt={currentImage.caption || "Portfolio image"}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Caption Section */}
        <div className="mt-4 w-full max-w-2xl bg-white rounded-lg p-4">
          {isEditingCaption ? (
            <div className="space-y-3">
              <Input
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full"
                maxLength={200}
                disabled={isUpdating}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {editedCaption.length}/200
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveCaption}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <p className="text-gray-700 flex-1">
                {currentImage.caption || "No caption"}
              </p>
              <Button variant="ghost" size="sm" onClick={handleEditClick}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Image Counter */}
          <div className="mt-3 text-center text-sm text-gray-500">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
}
