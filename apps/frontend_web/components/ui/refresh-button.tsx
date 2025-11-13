"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { refreshPageData } from "@/lib/cache/refresh";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  /**
   * Which data tier to refresh
   * - 'page': Refresh current page data (smart)
   * - 'all': Refresh everything
   */
  scope?: "page" | "all";

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Show label text
   */
  showLabel?: boolean;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Manual Refresh Button Component
 *
 * Provides a button to manually refresh cached data.
 * Use this for pages with Tier 1 static data that needs manual refresh.
 *
 * @example
 * ```tsx
 * // In your page component
 * <RefreshButton scope="page" showLabel />
 * ```
 */
export function RefreshButton({
  scope = "page",
  className,
  showLabel = false,
  size = "md",
}: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      if (scope === "all") {
        await queryClient.invalidateQueries();
      } else {
        await refreshPageData(queryClient, pathname);
      }

      // Let queries refetch
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg",
        "bg-blue-600 text-white hover:bg-blue-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        "font-medium",
        sizeClasses[size],
        className
      )}
      aria-label="Refresh data"
    >
      <RefreshCw
        size={iconSizes[size]}
        className={cn("transition-transform", isRefreshing && "animate-spin")}
      />
      {showLabel && <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>}
    </button>
  );
}
