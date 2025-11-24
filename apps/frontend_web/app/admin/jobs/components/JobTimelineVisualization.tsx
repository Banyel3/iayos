"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/generic_button";
import {
  FileText,
  UserCheck,
  Play,
  MapPin,
  CheckCircle,
  CheckCircle2,
  Star,
  Clock,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobTimeline {
  job_posted: string;
  worker_assigned: string | null;
  worker_name: string | null;
  start_initiated: string | null;
  worker_arrived: string | null;
  worker_marked_complete: string | null;
  completion_photos: string[];
  completion_notes: string | null;
  client_confirmed: string | null;
  client_reviewed: string | null;
  worker_reviewed: string | null;
  reviews_complete: boolean;
}

interface JobTimelineVisualizationProps {
  timeline: JobTimeline;
  jobStatus: string;
}

// Helper function to calculate time elapsed between timestamps
function calculateTimeElapsed(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Helper function to format timestamp
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function JobTimelineVisualization({
  timeline,
  jobStatus,
}: JobTimelineVisualizationProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const milestones = [
    {
      id: 1,
      label: "Job Posted",
      timestamp: timeline.job_posted,
      icon: FileText,
      status: "completed",
      color: "green",
    },
    {
      id: 2,
      label: "Worker Assigned",
      timestamp: timeline.worker_assigned,
      icon: UserCheck,
      status: timeline.worker_assigned ? "completed" : "pending",
      color: timeline.worker_assigned ? "green" : "gray",
      subtitle: timeline.worker_name,
    },
    {
      id: 3,
      label: "Client Initiated Start",
      timestamp: timeline.start_initiated,
      icon: Play,
      status: timeline.start_initiated
        ? "completed"
        : timeline.worker_assigned
          ? "pending"
          : "locked",
      color: timeline.start_initiated
        ? "green"
        : timeline.worker_assigned
          ? "blue"
          : "gray",
    },
    {
      id: 4,
      label: "Worker Arrived On-Site",
      timestamp: timeline.worker_arrived,
      icon: MapPin,
      status: timeline.worker_arrived
        ? "completed"
        : timeline.start_initiated
          ? "pending"
          : "locked",
      color: timeline.worker_arrived
        ? "green"
        : timeline.start_initiated
          ? "blue"
          : "gray",
    },
    {
      id: 5,
      label: "Worker Marked Complete",
      timestamp: timeline.worker_marked_complete,
      icon: CheckCircle,
      status: timeline.worker_marked_complete
        ? "completed"
        : timeline.worker_arrived
          ? "pending"
          : "locked",
      color: timeline.worker_marked_complete
        ? "green"
        : timeline.worker_arrived
          ? "blue"
          : "gray",
      hasPhotos: timeline.completion_photos?.length > 0,
    },
    {
      id: 6,
      label: "Client Confirmed",
      timestamp: timeline.client_confirmed,
      icon: CheckCircle2,
      status: timeline.client_confirmed
        ? "completed"
        : timeline.worker_marked_complete
          ? "pending"
          : "locked",
      color: timeline.client_confirmed
        ? "green"
        : timeline.worker_marked_complete
          ? "blue"
          : "gray",
    },
    {
      id: 7,
      label: "Reviews Submitted",
      timestamp: timeline.reviews_complete
        ? timeline.client_reviewed || timeline.worker_reviewed
        : null,
      icon: Star,
      status: timeline.reviews_complete
        ? "completed"
        : timeline.client_confirmed
          ? "pending"
          : "locked",
      color: timeline.reviews_complete
        ? "green"
        : timeline.client_confirmed
          ? "blue"
          : "gray",
      subtitle: timeline.reviews_complete
        ? "Both parties reviewed"
        : timeline.client_reviewed
          ? "Client reviewed"
          : timeline.worker_reviewed
            ? "Worker reviewed"
            : "Awaiting reviews",
    },
  ];

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Export to PDF");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Progress Timeline</CardTitle>
        <CardDescription>
          Track key milestones from posting to completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const nextMilestone = milestones[index + 1];
              const timeElapsed =
                milestone.timestamp && nextMilestone?.timestamp
                  ? calculateTimeElapsed(
                      milestone.timestamp,
                      nextMilestone.timestamp
                    )
                  : null;

              return (
                <div key={milestone.id} className="relative">
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      "absolute left-0 w-12 h-12 rounded-full flex items-center justify-center",
                      milestone.status === "completed"
                        ? "bg-green-100"
                        : milestone.status === "pending"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        milestone.status === "completed"
                          ? "text-green-600"
                          : milestone.status === "pending"
                            ? "text-blue-600"
                            : "text-gray-400"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="ml-16">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {milestone.label}
                        </h3>
                        {milestone.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">
                            {milestone.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {milestone.timestamp ? (
                          <>
                            <p className="text-sm font-medium text-gray-900">
                              {formatTimestamp(milestone.timestamp)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(milestone.timestamp)}
                            </p>
                          </>
                        ) : (
                          <Badge
                            variant={
                              milestone.status === "pending"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {milestone.status === "pending"
                              ? "Pending"
                              : "Not Started"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Special content for completion photos */}
                    {milestone.hasPhotos &&
                      timeline.completion_photos &&
                      timeline.completion_photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {timeline.completion_photos
                            .slice(0, 4)
                            .map((photo, i) => (
                              <img
                                key={i}
                                src={photo}
                                alt={`Completion photo ${i + 1}`}
                                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedPhoto(photo)}
                              />
                            ))}
                        </div>
                      )}

                    {/* Completion Notes */}
                    {milestone.id === 5 &&
                      timeline.completion_notes &&
                      milestone.timestamp && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          <p className="font-medium mb-1">Notes:</p>
                          <p>{timeline.completion_notes}</p>
                        </div>
                      )}

                    {/* Time Elapsed to Next Milestone */}
                    {timeElapsed && (
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {timeElapsed} until next milestone
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 pt-6 border-t">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export Timeline as PDF
          </Button>
        </div>
      </CardContent>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <img
              src={selectedPhoto}
              alt="Completion photo"
              className="max-w-full max-h-screen rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
