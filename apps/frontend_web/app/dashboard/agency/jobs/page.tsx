"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  JobCard,
  PendingInviteCard,
  RejectReasonModal,
} from "@/components/agency";
import { Loader2, AlertCircle, Briefcase, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import NotificationBell from "@/components/notifications/NotificationBell";

interface Job {
  jobID: number;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  } | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  jobType: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  materialsNeeded?: string[];
  inviteStatus?: string;
  client: {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

type TabType = "available" | "invites";

export default function AgencyJobsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("available");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedJobForReject, setSelectedJobForReject] = useState<Job | null>(
    null
  );
  const hasFetched = React.useRef(false);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch jobs based on active tab
  useEffect(() => {
    if (!isAuthenticated) return;
    // Prevent duplicate fetches in React Strict Mode (dev only)
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchJobs();
    fetchPendingInvites();
  }, [isAuthenticated]);

  // Refetch when tab changes
  useEffect(() => {
    if (!hasFetched.current) return; // Don't fetch on initial mount
    if (!isAuthenticated) return;

    if (activeTab === "available") {
      fetchJobs();
    } else if (activeTab === "invites") {
      fetchPendingInvites();
    }
  }, [activeTab, isAuthenticated]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/agency/jobs?status=ACTIVE`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/agency/jobs?invite_status=PENDING`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pending invites: ${response.statusText}`
        );
      }

      const data = await response.json();
      setPendingInvites(data.jobs || []);
    } catch (err) {
      console.error("Error fetching pending invites:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load pending invites"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: number) => {
    try {
      setAccepting(jobId);
      setError(null);
      setSuccessMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/jobs/${jobId}/accept`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept job");
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(result.message || "Job accepted successfully!");

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Optionally remove the job from the list
      setJobs((prevJobs) => prevJobs.filter((job) => job.jobID !== jobId));
    } catch (err) {
      console.error("Error accepting job:", err);
      setError(err instanceof Error ? err.message : "Failed to accept job");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAccepting(null);
    }
  };

  const handleAcceptInvite = async (jobId: number) => {
    try {
      setAccepting(jobId);
      setError(null);
      setSuccessMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/agency/jobs/${jobId}/accept`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(
        result.message || "Invitation accepted successfully! Job is now active."
      );

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Remove from pending invites list
      setPendingInvites((prevInvites) =>
        prevInvites.filter((job) => job.jobID !== jobId)
      );
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectInviteClick = (job: Job) => {
    setSelectedJobForReject(job);
    setRejectModalOpen(true);
  };

  const handleRejectInviteSubmit = async (reason: string) => {
    if (!selectedJobForReject) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/agency/jobs/${selectedJobForReject.jobID}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject invitation");
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(
        result.message || "Invitation rejected. Client has been refunded."
      );

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Remove from pending invites list
      setPendingInvites((prevInvites) =>
        prevInvites.filter((job) => job.jobID !== selectedJobForReject.jobID)
      );

      // Close modal
      setRejectModalOpen(false);
      setSelectedJobForReject(null);
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={false}
        userName={(user as any)?.firstName || user?.email || "User"}
        userAvatar={(user as any)?.profile_data?.profileImg || "/default-avatar.jpg"}
        onLogout={logout}
      />

      {/* Mobile Navigation */}
      <MobileNav isWorker={false} />

      {/* Main Content */}
      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Job Management
            </h1>
            <p className="text-gray-600">
              Browse available jobs and manage direct invitations
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("available")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "available"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Available Jobs</span>
                    {jobs.length > 0 && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          activeTab === "available"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {jobs.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("invites")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "invites"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Pending Invites</span>
                    {pendingInvites.length > 0 && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          activeTab === "invites"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {pendingInvites.length}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading indicator for tab content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">
                Loading {activeTab === "available" ? "jobs" : "invites"}...
              </span>
            </div>
          ) : (
            <>
              {/* Tab Content */}
              {activeTab === "available" && (
                <>
                  {jobs.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Jobs Available
                          </h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            There are currently no jobs available. Check back
                            later for new opportunities.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-sm text-gray-600 mb-4">
                        Showing {jobs.length}{" "}
                        {jobs.length === 1 ? "job" : "jobs"}
                      </div>
                      {jobs.map((job) => (
                        <JobCard
                          key={job.jobID}
                          job={job}
                          onAccept={handleAcceptJob}
                          accepting={accepting === job.jobID}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "invites" && (
                <>
                  {pendingInvites.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Pending Invites
                          </h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            You don't have any pending job invitations at the
                            moment. When clients send you direct invitations,
                            they will appear here.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-sm text-gray-600 mb-4">
                        You have {pendingInvites.length} pending{" "}
                        {pendingInvites.length === 1
                          ? "invitation"
                          : "invitations"}
                      </div>
                      {pendingInvites.map((job) => (
                        <PendingInviteCard
                          key={job.jobID}
                          job={job as any}
                          onAccept={handleAcceptInvite}
                          onReject={handleRejectInviteClick as any}
                          accepting={accepting === job.jobID}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedJobForReject(null);
        }}
        onSubmit={handleRejectInviteSubmit}
        jobTitle={selectedJobForReject?.title || ""}
      />
    </div>
  );
}
