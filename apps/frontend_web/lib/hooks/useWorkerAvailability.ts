/**
 * Custom hook for managing worker availability status
 * Handles fetching current status and updating it via backend API
 */

import { useState, useEffect } from "react";

export const useWorkerAvailability = (
  isWorker: boolean,
  isAuthenticated: boolean
) => {
  // Initialize with null to indicate "unknown" state, not false
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch worker's current availability status on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isAuthenticated || !isWorker) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8000/api/accounts/workers/availability",
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setIsAvailable(data.data.isAvailable);
          }
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [isAuthenticated, isWorker]);

  // Handle availability toggle
  const handleAvailabilityToggle = async () => {
    // Prevent toggle if still loading initial state
    if (isAvailable === null) {
      console.warn("⚠️ Cannot toggle while loading initial state");
      return;
    }

    console.log("🟡 handleAvailabilityToggle CALLED");
    console.log("Current isAvailable:", isAvailable);

    const newAvailability = !isAvailable;
    console.log("New availability:", newAvailability);

    // Optimistically update UI
    setIsAvailable(newAvailability);

    try {
      const url = `http://localhost:8000/api/accounts/workers/availability?is_available=${newAvailability}`;
      console.log("🌐 Fetching URL:", url);

      const response = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response received, status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok || !data.success) {
        // Revert on failure
        setIsAvailable(!newAvailability);
        console.error("Failed to update availability:", data);
        alert(
          `Failed to update availability: ${data.error || "Unknown error"}`
        );
      } else {
        console.log("✅ Availability updated successfully:", data);
      }
    } catch (error) {
      // Revert on error
      setIsAvailable(!newAvailability);
      console.error("Error updating availability:", error);
      alert("Network error: Could not update availability");
    }
  };

  return {
    isAvailable,
    isLoading,
    handleAvailabilityToggle,
  };
};
