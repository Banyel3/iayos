// lib/hooks/useKYCUpload.ts
// Hook for uploading KYC documents with progress tracking

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { ENDPOINTS } from "@/lib/api/config";
import { compressImage } from "@/lib/utils/image-utils";
import type {
  DocumentCaptureResult,
  KYCDocumentType,
  KYCUploadResponse,
} from "@/lib/types/kyc";

export interface KYCUploadProgress {
  documentType: KYCDocumentType;
  loaded: number;
  total: number;
  percentage: number;
}

export interface KYCUploadOptions {
  documents: DocumentCaptureResult[];
  IDType: KYCDocumentType;
  clearanceType?: KYCDocumentType;
  onProgress?: (progress: KYCUploadProgress) => void;
  compress?: boolean;
}

/**
 * Upload KYC documents to backend
 */
const uploadKYCDocuments = async (
  options: KYCUploadOptions,
  setProgress: (progress: KYCUploadProgress) => void
): Promise<KYCUploadResponse> => {
  const { documents, IDType, clearanceType, onProgress, compress = true } =
    options;

  try {
    // Create FormData
    const formData = new FormData();

    // Add document type metadata
    formData.append("IDType", IDType);
    if (clearanceType) {
      formData.append("clearanceType", clearanceType);
    }

    // Process and add each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Compress image if enabled
      let uploadUri = doc.uri;
      if (compress && doc.uri.startsWith("file://")) {
        const compressed = await compressImage(doc.uri, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
        });
        uploadUri = compressed.uri;
      }

      // Determine field name based on document type
      let fieldName = "frontID"; // Default
      if (doc.type === "SELFIE") {
        fieldName = "selfie";
      } else if (
        doc.type === "NBI" ||
        doc.type === "POLICE" ||
        doc.type === "BUSINESS_PERMIT"
      ) {
        fieldName = "clearance";
      } else if (doc.side === "BACK") {
        fieldName = "backID";
      } else if (doc.side === "FRONT") {
        fieldName = "frontID";
      }

      // Add file to FormData
      formData.append(fieldName, {
        uri: uploadUri,
        type: "image/jpeg",
        name: doc.fileName || `${doc.type}_${Date.now()}.jpg`,
      } as any);

      // Add metadata for each document
      formData.append(`${fieldName}_type`, doc.type);
      if (doc.side) {
        formData.append(`${fieldName}_side`, doc.side);
      }
    }

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          const progressData: KYCUploadProgress = {
            documentType: IDType,
            loaded: event.loaded,
            total: event.total,
            percentage,
          };

          setProgress(progressData);
          if (onProgress) {
            onProgress(progressData);
          }
        }
      };

      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              message: data.message || "KYC documents uploaded successfully",
              kyc_id: data.kyc_id,
              file_url: data.file_url,
              file_name: data.file_name,
              files: data.files,
            });
          } catch (error) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errorData.message || `Upload failed with status ${xhr.status}`
              )
            );
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      // Handle errors
      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload timed out. Please try again."));
      };

      // Configure and send request
      xhr.open("POST", ENDPOINTS.UPLOAD_KYC);
      xhr.timeout = 120000; // 120 second timeout (KYC uploads can be large)
      xhr.setRequestHeader("Accept", "application/json");
      xhr.withCredentials = true; // Include cookies
      xhr.send(formData);
    });
  } catch (error) {
    console.error("KYC upload error:", error);
    throw error instanceof Error ? error : new Error("Upload failed");
  }
};

/**
 * Hook for uploading KYC documents
 */
export const useKYCUpload = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<KYCUploadProgress>({
    documentType: "NATIONALID",
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const resetProgress = useCallback(() => {
    setProgress({
      documentType: "NATIONALID",
      loaded: 0,
      total: 0,
      percentage: 0,
    });
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (options: KYCUploadOptions): Promise<KYCUploadResponse> => {
      return uploadKYCDocuments(options, setProgress);
    },
    onSuccess: () => {
      // Invalidate KYC status to refetch
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
      queryClient.invalidateQueries({ queryKey: ["kycHistory"] });
      resetProgress();
    },
    onError: () => {
      resetProgress();
    },
  });

  return {
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isSuccess: uploadMutation.isSuccess,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
    data: uploadMutation.data,
    progress,
    resetProgress,
  };
};

/**
 * Hook for sequential multi-document KYC upload
 */
export const useMultiDocumentKYCUpload = () => {
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const resetState = useCallback(() => {
    setUploadingIndex(-1);
    setCompletedCount(0);
    setFailedIndexes([]);
  }, []);

  const uploadMultipleDocumentSets = useCallback(
    async (
      documentSets: Array<KYCUploadOptions>,
      onProgress?: (index: number, progress: KYCUploadProgress) => void,
      onComplete?: (results: Array<{ success: boolean; error?: string }>) => void
    ) => {
      resetState();
      const results: Array<{ success: boolean; error?: string }> = [];

      for (let i = 0; i < documentSets.length; i++) {
        setUploadingIndex(i);

        try {
          const progressCallback = (progress: KYCUploadProgress) => {
            if (onProgress) {
              onProgress(i, progress);
            }
          };

          await uploadKYCDocuments(
            {
              ...documentSets[i],
              onProgress: progressCallback,
            },
            progressCallback
          );

          results.push({ success: true });
          setCompletedCount((prev) => prev + 1);
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          setFailedIndexes((prev) => [...prev, i]);
        }
      }

      setUploadingIndex(-1);

      // Invalidate queries after all uploads
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
      queryClient.invalidateQueries({ queryKey: ["kycHistory"] });

      if (onComplete) {
        onComplete(results);
      }

      return results;
    },
    [resetState, queryClient]
  );

  return {
    uploadMultiple: uploadMultipleDocumentSets,
    uploadingIndex,
    completedCount,
    failedIndexes,
    resetState,
  };
};
