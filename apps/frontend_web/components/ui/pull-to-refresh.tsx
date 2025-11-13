"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState, useEffect, useRef } from "react";
import { refreshPageData } from "@/lib/cache/refresh";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  /**
   * Enable/disable pull-to-refresh (default: true)
   */
  enabled?: boolean;

  /**
   * Distance in pixels to trigger refresh (default: 80)
   */
  threshold?: number;

  /**
   * Custom refresh function (optional)
   */
  onRefresh?: () => Promise<void>;
}

/**
 * Pull-to-Refresh Container
 *
 * Wrap your page content with this component to enable pull-to-refresh gesture.
 * Works on both mobile and desktop (mouse drag).
 *
 * @example
 * ```tsx
 * export default function JobsPage() {
 *   return (
 *     <PullToRefresh>
 *       <div>Your page content</div>
 *     </PullToRefresh>
 *   );
 * }
 * ```
 */
export function PullToRefresh({
  children,
  enabled = true,
  threshold = 80,
  onRefresh,
}: PullToRefreshProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await refreshPageData(queryClient, pathname);
      }

      // Wait for queries to refetch
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled || window.scrollY > 0 || startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = () => {
    if (!enabled || !isPulling) return;

    if (pullDistance >= threshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }

    startY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, isPulling, pullDistance]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
        style={{
          height: isPulling || isRefreshing ? "60px" : "0px",
          opacity: isPulling || isRefreshing ? 1 : 0,
          transform: `translateY(${isPulling ? pullDistance * 0.5 : 0}px)`,
        }}
      >
        <div className="bg-white rounded-full shadow-lg p-3">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 transform -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke={shouldTrigger ? "#2563eb" : "#93c5fd"}
                  strokeWidth="2"
                  strokeDasharray="62.83"
                  strokeDashoffset={62.83 - (62.83 * progress) / 100}
                  className="transition-all duration-200"
                />
              </svg>
              {shouldTrigger && (
                <span className="absolute inset-0 flex items-center justify-center text-blue-600 text-xs font-bold">
                  ↓
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div
        style={{
          transform: `translateY(${isPulling ? pullDistance * 0.3 : 0}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
