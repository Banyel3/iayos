/**
 * Custom hook for managing worker availability status
 * Handles fetching current status and updating it via backend API
 * Implements localStorage caching to reduce API calls
 */

import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_KEY = "cached_worker_availability";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWorkerAvailability = (
  isWorker: boolean,
  isAuthenticated: boolean
) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch worker's current availability status on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isAuthenticated || !isWorker) {
        setIsLoading(false);
        return;
      }

      //  Try to load from cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { availability, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Use cached data if less than 5 minutes old
          if (age < CACHE_DURATION) {
            console.log(" Using cached availability:", availability);
            setIsAvailable(availability);
            setIsLoading(false);
            return; // Skip API call
          } else {
            console.log(" Cache expired, fetching fresh data");
          }
        }
      } catch (error) {
        console.error("Error reading availability cache:", error);
      }

      // Fetch from API if no valid cache
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/accounts/workers/availability`,
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
            const availability = data.data.isAvailable;
            setIsAvailable(availability);

            //  Cache the availability data
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                availability,
                timestamp: Date.now(),
              })
            );
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
    console.log(" handleAvailabilityToggle CALLED");
    console.log("Current isAvailable:", isAvailable);

    const newAvailability = !isAvailable;
    console.log("New availability:", newAvailability);

    // Optimistically update UI
    setIsAvailable(newAvailability);

    //  Update cache immediately for instant persistence
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          availability: newAvailability,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error updating availability cache:", error);
    }

    try {
      const url = `${API_BASE_URL}/api/accounts/workers/availability?is_available=${newAvailability}`;
      console.log(" Fetching URL:", url);

      const response = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(" Response received, status:", response.status);
      const data = await response.json();
      console.log(" Response data:", data);

      if (!response.ok || !data.success) {
        // Revert on failure
        setIsAvailable(!newAvailability);

        //  Revert cache as well
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            availability: !newAvailability,
            timestamp: Date.now(),
          })
        );

        console.error("Failed to update availability:", data);
        alert(
          `Failed to update availability: ${data.error || "Unknown error"}`
        );
      } else {
        console.log(" Availability updated successfully:", data);
      }
    } catch (error) {
      // Revert on error
      setIsAvailable(!newAvailability);

      //  Revert cache as well
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          availability: !newAvailability,
          timestamp: Date.now(),
        })
      );

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
