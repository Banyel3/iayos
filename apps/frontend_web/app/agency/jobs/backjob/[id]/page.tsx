"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  MapPin,
  DollarSign,
  Tag,
  User,
  MessageCircle,
  Calendar,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface BackjobDetail {
  has_backjob: boolean;
  dispute: {
    dispute_id: number;
    reason: string;
    description: string;
    status: string;
    priority: string;
    opened_date: string | null;
    resolution: string | null;
    resolved_date: string | null;
    evidence_images: string[];
    backjob_started: boolean;
    backjob_started_at: string | null;
    worker_marked_complete: boolean;
    worker_marked_complete_at: string | null;
    client_confirmed: boolean;
    client_confirmed_at: string | null;
  } | null;
}

interface JobInfo {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  category: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    profileImg: string | null;
  } | null;
}

export default function AgencyBackjobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [backjob, setBackjob] = useState<BackjobDetail | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (jobId) {
      fetchBackjobDetails();
    }
  }, [jobId]);

  const fetchBackjobDetails = async () => {
    try {
      // Fetch backjob status
      const backjobResponse = await fetch(
        `${API_BASE}/api/jobs/${jobId}/backjob-status`,
        { credentials: "include" },
      );
      if (backjobResponse.ok) {
        const data = await backjobResponse.json();
        setBackjob(data);
      }

      // Fetch job details
      const jobResponse = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        credentials: "include",
      });
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob({
          id: jobData.jobID || jobData.id,
          title: jobData.title,
          description: jobData.description,
          budget: parseFloat(jobData.budget),
          location: jobData.location,
          category: jobData.categoryID?.name || jobData.category || "Unknown",
          client: jobData.clientID?.profileID || null,
        });
      }
    } catch (error) {
      console.error("Error fetching backjob details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkBackjobComplete = async () => {
    if (!jobId) return;
    setIsCompleting(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/backjob/mark-complete`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: completionNotes || "Backjob work completed",
          }),
        },
      );

      if (response.ok) {
        setShowCompleteDialog(false);
        setCompletionNotes("");
        // Refresh data
        await fetchBackjobDetails();
        alert(
          "Backjob marked as complete! Client will be notified to verify and approve.",
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to mark backjob complete");
      }
    } catch (error) {
      console.error("Error marking backjob complete:", error);
      alert("Failed to mark backjob complete");
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "OPEN":
        return { label: "Pending Review", color: "blue", icon: Clock };
      case "UNDER_REVIEW":
        return { label: "Action Required", color: "amber", icon: AlertCircle };
      case "RESOLVED":
        return { label: "Completed", color: "green", icon: CheckCircle };
      case "CLOSED":
        return { label: "Closed", color: "gray", icon: X };
      default:
        return { label: status, color: "gray", icon: Clock };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <Badge variant="destructive">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-red-100 text-red-700">High Priority</Badge>;
      case "MEDIUM":
        return (
          <Badge className="bg-amber-100 text-amber-700">Medium Priority</Badge>
        );
      default:
        return <Badge variant="secondary">Low Priority</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading backjob details...</p>
        </div>
      </div>
    );
  }

  if (!backjob?.has_backjob || !backjob.dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Backjob Not Found</h2>
          <p className="text-gray-500 mb-6">
            The backjob you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push("/agency/jobs/backjobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Backjobs
          </Button>
        </Card>
      </div>
    );
  }

  const dispute = backjob.dispute;
  const statusInfo = getStatusInfo(dispute.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/agency/jobs/backjobs")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Backjobs
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Backjob Details
            </h1>
            <p className="text-gray-500">Dispute #{dispute.dispute_id}</p>
          </div>
          {/* 3-Phase Backjob Workflow Buttons */}
          {dispute.status === "UNDER_REVIEW" && (
            <div className="flex flex-col gap-2">
              {/* Phase 1: Waiting for client to confirm work started */}
              {!dispute.backjob_started && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Waiting for client to confirm backjob work has started...
                  </p>
                </div>
              )}

              {/* Phase 2: Agency can mark complete after client confirms started */}
              {dispute.backjob_started && !dispute.worker_marked_complete && (
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Backjob Complete
                </Button>
              )}

              {/* Phase 3: Waiting for client approval */}
              {dispute.worker_marked_complete && !dispute.client_confirmed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Waiting for client to verify and approve completion...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card className={`border-l-4 border-l-${statusInfo.color}-500`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 bg-${statusInfo.color}-100 rounded-full`}
                  >
                    <StatusIcon
                      className={`w-5 h-5 text-${statusInfo.color}-600`}
                    />
                  </div>
                  <div>
                    <Badge
                      className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                {getPriorityBadge(dispute.priority)}
              </div>
              <p className="text-gray-600">
                {dispute.status === "UNDER_REVIEW"
                  ? "Please review and complete the backjob work requested by the client."
                  : dispute.status === "RESOLVED"
                    ? "This backjob has been completed successfully."
                    : "This backjob request is pending admin review."}
              </p>
            </CardContent>
          </Card>

          {/* Reason & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Backjob Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Reason for Backjob
                </h4>
                <p className="text-lg font-semibold text-gray-900">
                  {dispute.reason}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Detailed Description
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Images */}
          {dispute.evidence_images && dispute.evidence_images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Evidence Photos ({dispute.evidence_images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {dispute.evidence_images.map((uri, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setImageViewerOpen(true);
                      }}
                    >
                      <img
                        src={uri}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution */}
          {dispute.resolution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">
                  Resolution Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800">{dispute.resolution}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Info */}
          {job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>₱{job.budget?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{job.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-2">{job.location}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/agency/jobs/${job.id}`)}
                >
                  View Job Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client Info */}
          {job?.client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  {job.client.profileImg ? (
                    <img
                      src={job.client.profileImg}
                      alt={`${job.client.firstName} ${job.client.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {job.client.firstName} {job.client.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Client</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Client
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Backjob Workflow Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1: Request Created */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Backjob Requested
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(dispute.opened_date)}
                    </p>
                  </div>
                </div>

                {/* Step 2: Client confirmed work started */}
                {dispute.backjob_started && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Work Started (Client Confirmed)
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(dispute.backjob_started_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Agency marked complete */}
                {dispute.worker_marked_complete && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Marked Complete (Agency)
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(dispute.worker_marked_complete_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Client confirmed completion */}
                {dispute.resolved_date && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Completed & Verified
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(dispute.resolved_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Backjob</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you have completed the backjob work? The client will
              be notified.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Completion Notes (optional)
              </label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completed work..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkBackjobComplete}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {imageViewerOpen && dispute.evidence_images && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setImageViewerOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setImageViewerOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 text-white">
            {currentImageIndex + 1} / {dispute.evidence_images.length}
          </div>
          <button
            className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
            }}
            disabled={currentImageIndex === 0}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={dispute.evidence_images[currentImageIndex]}
            alt={`Evidence ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(
                Math.min(
                  dispute.evidence_images.length - 1,
                  currentImageIndex + 1,
                ),
              );
            }}
            disabled={currentImageIndex === dispute.evidence_images.length - 1}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
