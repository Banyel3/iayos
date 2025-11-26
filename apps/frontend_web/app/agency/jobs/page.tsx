"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PendingInviteCard, RejectReasonModal } from "@/components/agency";
import AssignEmployeeModal from "@/components/agency/AssignEmployeeModal";
import {
  Loader2,
  AlertCircle,
  Mail,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  totalJobsCompleted: number;
  isActive: boolean;
}

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
  assignedEmployeeID?: number;
  assignedEmployee?: {
    employeeId: number;
    name: string;
  };
  client: {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

type TabType = "invites" | "accepted";

export default function AgencyJobsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("invites");
  const [pendingInvites, setPendingInvites] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedJobForReject, setSelectedJobForReject] = useState<Job | null>(
    null
  );
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] =
    useState<Job | null>(null);
  const hasFetched = React.useRef(false);

  // Fetch jobs based on active tab
  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode (dev only)
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchPendingInvites();
    fetchAcceptedJobs();
    fetchEmployees();
  }, []);

  // Refetch when tab changes
  useEffect(() => {
    if (!hasFetched.current) return; // Don't fetch on initial mount

    if (activeTab === "invites") {
      fetchPendingInvites();
    } else if (activeTab === "accepted") {
      fetchAcceptedJobs();
    }
  }, [activeTab]);

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

  const fetchAcceptedJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/agency/jobs?invite_status=ACCEPTED`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch accepted jobs: ${response.statusText}`
        );
      }

      const data = await response.json();
      setAcceptedJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching accepted jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load accepted jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/agency/employees`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
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
        const errorMessage = errorData.error || "Failed to accept invitation";

        // Provide user-friendly message for payment-related errors
        if (errorMessage.includes("escrow payment")) {
          throw new Error(
            "This job invitation cannot be accepted yet. The client has not completed the payment. " +
              "Please wait for the client to complete their GCash/payment transaction."
          );
        }

        throw new Error(errorMessage);
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

  const handleAssignEmployee = async (employeeId: number, notes: string) => {
    if (!selectedJobForAssignment) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("employee_id", employeeId.toString());
      if (notes) {
        formData.append("assignment_notes", notes);
      }

      const response = await fetch(
        `${apiUrl}/api/agency/jobs/${selectedJobForAssignment.jobID}/assign-employee`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign employee");
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(
        `Employee successfully assigned to "${selectedJobForAssignment.title}"!`
      );

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Refresh accepted jobs list
      fetchAcceptedJobs();

      // Close modal
      setAssignModalOpen(false);
      setSelectedJobForAssignment(null);
    } catch (err) {
      console.error("Error assigning employee:", err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleOpenAssignModal = (job: Job) => {
    setSelectedJobForAssignment(job);
    setAssignModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">
              Loading available jobs...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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

              <button
                onClick={() => setActiveTab("accepted")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "accepted"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Accepted Jobs</span>
                  {acceptedJobs.length > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === "accepted"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {acceptedJobs.length}
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

        {/* Tab Content */}
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
                      You don't have any pending job invitations at the moment.
                      When clients send you direct invitations, they will appear
                      here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  You have {pendingInvites.length} pending{" "}
                  {pendingInvites.length === 1 ? "invitation" : "invitations"}
                </div>
                {pendingInvites.map((job) => (
                  <PendingInviteCard
                    key={job.jobID}
                    job={job}
                    onAccept={handleAcceptInvite}
                    onReject={handleRejectInviteClick}
                    accepting={accepting === job.jobID}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "accepted" && (
          <>
            {acceptedJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Accepted Jobs
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      You haven't accepted any job invitations yet. Accepted
                      jobs that need employee assignment will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {acceptedJobs.length} accepted{" "}
                  {acceptedJobs.length === 1 ? "job" : "jobs"}
                </div>
                {acceptedJobs.map((job) => (
                  <Card
                    key={job.jobID}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {job.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Budget</span>
                          <p className="font-semibold text-gray-900">
                            ₱{job.budget}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            Category
                          </span>
                          <p className="font-semibold text-gray-900">
                            {job.category?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Urgency</span>
                          <p
                            className={`font-semibold ${
                              job.urgency === "HIGH"
                                ? "text-red-600"
                                : job.urgency === "MEDIUM"
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {job.urgency}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status</span>
                          <p className="font-semibold text-gray-900">
                            {job.status}
                          </p>
                        </div>
                      </div>

                      {job.assignedEmployee ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="text-green-800 font-medium">
                              Assigned to: {job.assignedEmployee.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(job)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <UserPlus size={18} />
                          <span>Assign Employee</span>
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
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

      {/* Assign Employee Modal */}
      {selectedJobForAssignment && (
        <AssignEmployeeModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedJobForAssignment(null);
          }}
          job={selectedJobForAssignment}
          employees={employees}
          onAssign={handleAssignEmployee}
        />
      )}
    </div>
  );
}
