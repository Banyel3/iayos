// lib/hooks/useImageUpload.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { compressImage } from "@/lib/utils/image-utils";
import { API_BASE_URL } from "@/lib/api/config";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  uri: string;
  endpoint: string;
  fieldName?: string;
  additionalData?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  compress?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Hook for uploading images with progress tracking
 */
export const useImageUpload = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const resetProgress = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (options: UploadOptions): Promise<UploadResult> => {
      const {
        uri,
        endpoint,
        fieldName = "image",
        additionalData,
        onProgress,
        compress = true,
      } = options;

      try {
        // Compress image first if enabled
        let uploadUri = uri;
        if (compress) {
          const compressed = await compressImage(uri, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
          });
          uploadUri = compressed.uri;
        }

        // Create FormData
        const formData = new FormData();

        // Add image
        const filename = uri.split("/").pop() || "upload.jpg";
        formData.append(fieldName, {
          uri: uploadUri,
          type: "image/jpeg",
          name: filename,
        } as any);

        // Add additional fields
        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        // Get auth token from storage (before Promise to avoid async issues)
        const token = await AsyncStorage.getItem("access_token");

        // Build full endpoint URL if relative path provided
        let fullEndpoint = endpoint;
        if (endpoint.startsWith("/")) {
          // Relative path - prepend base URL
          fullEndpoint = `${API_BASE_URL.replace("/api", "")}${endpoint}`;
        }

        // Upload with progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              const progressData = {
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
                resolve({ success: true, data });
              } catch (error) {
                resolve({ success: true, data: xhr.responseText });
              }
            } else {
              reject(
                new Error(
                  `Upload failed with status ${xhr.status}: ${xhr.statusText}`
                )
              );
            }
          };

          // Handle errors
          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };

          xhr.ontimeout = () => {
            reject(new Error("Upload timed out"));
          };

          // Configure and send request
          xhr.open("POST", fullEndpoint);
          xhr.timeout = 60000; // 60 second timeout
          xhr.setRequestHeader("Accept", "application/json");

          // Add Authorization header for authenticated uploads
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.send(formData);
        });
      } catch (error) {
        console.error("Upload error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        };
      }
    },
    onSuccess: (result, variables) => {
      resetProgress();

      // Invalidate relevant queries based on endpoint
      if (variables.endpoint.includes("/avatar")) {
        queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      } else if (variables.endpoint.includes("/portfolio")) {
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      }
    },
    onError: () => {
      resetProgress();
    },
  });

  return {
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    progress,
    resetProgress,
  };
};

/**
 * Hook for sequential multi-image upload
 */
export const useMultiImageUpload = () => {
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);

  const resetState = useCallback(() => {
    setUploadingIndex(-1);
    setCompletedCount(0);
    setFailedIndexes([]);
  }, []);

  const uploadMultiple = useCallback(
    async (
      images: Array<{ uri: string; caption?: string }>,
      endpoint: string,
      onProgress?: (index: number, progress: UploadProgress) => void,
      onComplete?: (results: UploadResult[]) => void
    ) => {
      resetState();
      const results: UploadResult[] = [];

      for (let i = 0; i < images.length; i++) {
        setUploadingIndex(i);

        try {
          const { uri, caption } = images[i];

          // Create upload options
          const options: UploadOptions = {
            uri,
            endpoint,
            additionalData: caption ? { caption } : undefined,
            onProgress: (progress) => {
              if (onProgress) {
                onProgress(i, progress);
              }
            },
          };

          // Upload using XHR (same logic as single upload)
          const compressed = await compressImage(uri);
          const formData = new FormData();

          const filename = uri.split("/").pop() || `upload_${i}.jpg`;
          formData.append("image", {
            uri: compressed.uri,
            type: "image/jpeg",
            name: filename,
          } as any);

          if (caption) {
            formData.append("caption", caption);
          }

          // Get auth token before creating Promise
          const token = await AsyncStorage.getItem("access_token");

          // Build full endpoint URL if relative path provided
          let fullEndpoint = endpoint;
          if (endpoint.startsWith("/")) {
            fullEndpoint = `${API_BASE_URL.replace("/api", "")}${endpoint}`;
          }

          const result = await new Promise<UploadResult>((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable && onProgress) {
                const percentage = Math.round(
                  (event.loaded / event.total) * 100
                );
                onProgress(i, {
                  loaded: event.loaded,
                  total: event.total,
                  percentage,
                });
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve({ success: true, data });
                } catch {
                  resolve({ success: true, data: xhr.responseText });
                }
              } else {
                resolve({
                  success: false,
                  error: `Upload failed: ${xhr.status}`,
                });
              }
            };

            xhr.onerror = () =>
              resolve({ success: false, error: "Network error" });

            // Configure and send request
            xhr.open("POST", fullEndpoint);
            xhr.timeout = 60000;
            xhr.setRequestHeader("Accept", "application/json");

            // Add Authorization header
            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            xhr.send(formData);
          });

          results.push(result);

          if (result.success) {
            setCompletedCount((prev) => prev + 1);
          } else {
            setFailedIndexes((prev) => [...prev, i]);
          }
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          setFailedIndexes((prev) => [...prev, i]);
        }
      }

      setUploadingIndex(-1);

      if (onComplete) {
        onComplete(results);
      }

      return results;
    },
    [resetState]
  );

  return {
    uploadMultiple,
    uploadingIndex,
    completedCount,
    failedIndexes,
    resetState,
  };
};
