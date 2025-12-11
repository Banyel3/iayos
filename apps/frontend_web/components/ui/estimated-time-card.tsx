/**
 * EstimatedTimeCard Component (Web/Next.js)
 *
 * Displays ML-predicted job completion time with confidence indicator.
 * Shows time range, confidence level, and disclaimers for low confidence.
 *
 * Used in:
 * - Job Detail pages
 * - Active Job pages (with countdown mode)
 * - Conversation/Inbox (compact mode)
 * - My Requests page
 */

"use client";

import React from "react";
import { Clock, BarChart3, AlertCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EstimatedCompletion {
  predicted_hours: number;
  confidence_interval_lower: number | null;
  confidence_interval_upper: number | null;
  confidence_level: number;
  formatted_duration: string;
  source: "model" | "microservice" | "fallback";
  is_low_confidence: boolean;
}

interface EstimatedTimeCardProps {
  /** ML prediction data from backend */
  prediction: EstimatedCompletion | null;
  /** Compact mode for inline display (conversation header) */
  compact?: boolean;
  /** Show as countdown from job start time */
  countdownMode?: boolean;
  /** Job start time for countdown calculation */
  jobStartTime?: string;
  /** Worker's estimated duration for comparison */
  workerEstimate?: string;
  /** Custom className */
  className?: string;
  /** Show loading skeleton */
  isLoading?: boolean;
}

/**
 * Format hours into human-readable duration
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h} hr`;
    return `${h}h ${m}m`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    if (remainingHours === 0) return `${days} day${days > 1 ? "s" : ""}`;
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Format time range from confidence interval
 */
function formatTimeRange(lower: number | null, upper: number | null): string {
  if (lower === null || upper === null) return "";
  return `${formatDuration(lower)} - ${formatDuration(upper)}`;
}

/**
 * Get confidence level info and styling
 */
function getConfidenceInfo(level: number): {
  label: string;
  textClass: string;
  bgClass: string;
  dotClass: string;
} {
  if (level >= 0.8) {
    return {
      label: "High confidence",
      textClass: "text-green-600",
      bgClass: "bg-green-100",
      dotClass: "bg-green-500",
    };
  } else if (level >= 0.5) {
    return {
      label: "Moderate confidence",
      textClass: "text-amber-600",
      bgClass: "bg-amber-100",
      dotClass: "bg-amber-500",
    };
  } else {
    return {
      label: "Limited data",
      textClass: "text-gray-500",
      bgClass: "bg-gray-100",
      dotClass: "bg-gray-400",
    };
  }
}

/**
 * Calculate remaining time for countdown mode
 */
function calculateRemainingTime(
  predictedHours: number,
  jobStartTime: string
): { remainingHours: number; isOverdue: boolean } {
  const start = new Date(jobStartTime);
  const now = new Date();
  const elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const remainingHours = predictedHours - elapsedHours;

  return {
    remainingHours: Math.max(0, remainingHours),
    isOverdue: remainingHours < 0,
  };
}

export function EstimatedTimeCard({
  prediction,
  compact = false,
  countdownMode = false,
  jobStartTime,
  workerEstimate,
  className,
  isLoading = false,
}: EstimatedTimeCardProps) {
  // Loading state - show skeleton
  if (isLoading) {
    if (compact) {
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <div className="h-3.5 w-3.5 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      );
    }
    // Full card loading skeleton
    return (
      <div
        className={cn(
          "bg-white rounded-lg border border-gray-200 p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gray-200 rounded-lg animate-pulse w-9 h-9" />
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1" />
          </div>
          <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!prediction || prediction.predicted_hours === null) {
    return null;
  }

  const confidenceInfo = getConfidenceInfo(prediction.confidence_level);
  const hasRange =
    prediction.confidence_interval_lower !== null &&
    prediction.confidence_interval_upper !== null;

  // Calculate countdown if in countdown mode
  let countdownData = null;
  if (countdownMode && jobStartTime) {
    countdownData = calculateRemainingTime(
      prediction.predicted_hours,
      jobStartTime
    );
  }

  // Compact mode for inline display
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Clock className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-sm font-medium text-blue-600">
          {countdownMode && countdownData ? (
            countdownData.isOverdue ? (
              <span className="text-red-500">Overdue</span>
            ) : (
              `ETA: ${formatDuration(countdownData.remainingHours)}`
            )
          ) : (
            `Est. ${prediction.formatted_duration}`
          )}
        </span>
        {prediction.is_low_confidence && (
          <span className="text-xs text-gray-400">(est.)</span>
        )}
      </div>
    );
  }

  // Full card mode
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900">
          Estimated Completion Time
        </h3>
      </div>

      {/* Main prediction */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          {countdownMode && countdownData ? (
            <>
              {countdownData.isOverdue ? (
                <p className="text-2xl font-bold text-red-500">
                  Overdue by{" "}
                  {formatDuration(Math.abs(countdownData.remainingHours))}
                </p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(countdownData.remainingHours)}
                  </p>
                  <p className="text-sm text-gray-500">remaining</p>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {prediction.formatted_duration}
              </p>
              {hasRange && (
                <p className="text-sm text-gray-500">
                  (
                  {formatTimeRange(
                    prediction.confidence_interval_lower,
                    prediction.confidence_interval_upper
                  )}
                  )
                </p>
              )}
            </>
          )}
        </div>

        {/* Confidence badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
            confidenceInfo.bgClass
          )}
        >
          <div
            className={cn("w-2 h-2 rounded-full", confidenceInfo.dotClass)}
          />
          <span className={cn("text-sm font-medium", confidenceInfo.textClass)}>
            {Math.round(prediction.confidence_level * 100)}%
          </span>
        </div>
      </div>

      {/* Worker estimate comparison */}
      {workerEstimate && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Platform Estimate</p>
              <p className="font-semibold text-gray-900">
                {prediction.formatted_duration}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-3" />
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Worker Estimate</p>
              <p className="font-semibold text-gray-900">{workerEstimate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Low confidence disclaimer */}
      {prediction.is_low_confidence && (
        <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            Based on limited data. Actual time may vary.
          </p>
        </div>
      )}

      {/* Source indicator */}
      <p className="text-[10px] text-gray-400 text-right mt-2">
        {prediction.source === "model" || prediction.source === "microservice"
          ? "Powered by ML"
          : "Statistical estimate"}
      </p>
    </div>
  );
}

export default EstimatedTimeCard;
