"use client";

import { useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface PortfolioUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  maxFiles?: number;
}

export function PortfolioUploadZone({
  onFilesSelected,
  isUploading = false,
  maxFiles = 10,
}: PortfolioUploadZoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles.slice(0, maxFiles));
      }
    },
    [isUploading, maxFiles, onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles));
    }
    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isUploading
          ? "border-gray-300 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 bg-white hover:border-gray-400 cursor-pointer"
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="portfolio-upload"
        className="hidden"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        onChange={handleFileInput}
        disabled={isUploading}
      />

      <label
        htmlFor="portfolio-upload"
        className={`flex flex-col items-center gap-4 ${
          isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        <div className="rounded-full bg-gray-100 p-4">
          {isUploading ? (
            <Upload className="h-8 w-8 text-gray-400 animate-pulse" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700">
            {isUploading ? "Uploading images..." : "Upload Portfolio Images"}
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-400">
            JPEG or PNG, max 5MB per image, up to {maxFiles} images
          </p>
        </div>
      </label>
    </div>
  );
}
