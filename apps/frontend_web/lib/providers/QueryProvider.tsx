"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Create persister for sessionStorage (clears on browser close)
const sessionPersister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({
        storage: window.sessionStorage,
        key: "IAYOS_SESSION_CACHE",
        throttleTime: 500, // Faster writes for session storage
      })
    : undefined;

// Backup persister for localStorage (24h retention)
const localPersister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: "IAYOS_PERSISTENT_CACHE",
        throttleTime: 1000,
      })
    : undefined;

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Always consider data stale (will refetch in background)
            gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: "always", // Always refetch but show cached data first
            refetchOnReconnect: true,
            // This is the key: use cached data while refetching
            placeholderData: (previousData) => previousData,
          },
        },
      })
  );

  // Sync sessionStorage to localStorage periodically
  useEffect(() => {
    const syncStorage = () => {
      try {
        const sessionData = sessionStorage.getItem("IAYOS_SESSION_CACHE");
        if (sessionData) {
          localStorage.setItem("IAYOS_PERSISTENT_CACHE", sessionData);
          localStorage.setItem("IAYOS_CACHE_TIME", Date.now().toString());
        }
      } catch (e) {
        console.warn("Failed to sync storage:", e);
      }
    };

    // Sync on mount and before unload
    syncStorage();
    window.addEventListener("beforeunload", syncStorage);

    return () => {
      window.removeEventListener("beforeunload", syncStorage);
      syncStorage();
    };
  }, []);

  // Restore from localStorage to sessionStorage on mount
  useEffect(() => {
    try {
      const localData = localStorage.getItem("IAYOS_PERSISTENT_CACHE");
      const cacheTime = localStorage.getItem("IAYOS_CACHE_TIME");
      const now = Date.now();

      // Only restore if less than 24 hours old
      if (
        localData &&
        cacheTime &&
        now - parseInt(cacheTime) < 24 * 60 * 60 * 1000
      ) {
        sessionStorage.setItem("IAYOS_SESSION_CACHE", localData);
      } else {
        // Clear old cache
        localStorage.removeItem("IAYOS_PERSISTENT_CACHE");
        localStorage.removeItem("IAYOS_CACHE_TIME");
      }
    } catch (e) {
      console.warn("Failed to restore cache:", e);
    }
  }, []);

  if (sessionPersister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: sessionPersister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Persist all successful queries
              return query.state.status === "success";
            },
          },
        }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
