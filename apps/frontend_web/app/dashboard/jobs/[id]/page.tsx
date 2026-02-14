"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import { useAuth } from "@/context/AuthContext";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  budget: string;
  location: string;
  urgency: string;
  expectedDuration?: string;
  preferredStartDate?: string;
  materialsNeeded?: string[];
  status: string;
  client: {
    name: string;
    avatar: string;
    rating: number;
    city?: string;
    totalJobsPosted?: number;
  };
  createdAt: string;
  postedAt: string;
}

interface JobApplication {
  id: number;
  worker: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
    city: string;
    specialization: string | null;
  };
  proposal_message: string;
  proposed_budget: number;
  estimated_duration: string;
  budget_option: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [budgetOption, setBudgetOption] = useState<
    "accept" | "negotiate" | null
  >(null);
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<
    number | null
  >(null);

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.job) {
          setJob(data.job);

          // If user is the client who owns this job, fetch applications
          if (isClient) {
            fetchApplications();
          }
        } else {
          console.error("Failed to fetch job details");
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }
  }, [id, isClient]);

  const fetchApplications = async () => {
    try {
      setIsLoadingApplications(true);
      const response = await fetch(`${API_BASE}/api/jobs/${id}/applications`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.applications) {
        setApplications(data.applications);
        console.log(`✅ Loaded ${data.applications.length} applications`);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleAcceptApplication = async (applicationId: number) => {
    if (
      !confirm(
        "Are you sure you want to accept this application? This will reject all other pending applications and start the job.",
      )
    ) {
      return;
    }

    try {
      setProcessingApplicationId(applicationId);
      const response = await fetch(
        `${API_BASE}/api/jobs/${id}/applications/${applicationId}/accept`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        alert("Application accepted! A chat conversation has been created.");
        // Refresh job details and applications
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept application");
      }
    } catch (error) {
      console.error("Error accepting application:", error);
      alert("Failed to accept application");
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    if (!confirm("Are you sure you want to reject this application?")) {
      return;
    }

    try {
      setProcessingApplicationId(applicationId);
      const response = await fetch(
        `${API_BASE}/api/jobs/${id}/applications/${applicationId}/reject`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: "REJECTED" } : app,
          ),
        );
        alert("Application rejected");
      } else {
        alert(data.error || "Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application");
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleSendProposal = () => {
    setIsProposalModalOpen(true);
    setProposalMessage("");
    setBudgetOption(null);
    setProposedBudget("");
    setEstimatedDuration("");
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposalMessage || !budgetOption) {
      alert("Please fill in all required fields");
      return;
    }

    if (budgetOption === "negotiate" && !proposedBudget) {
      alert("Please enter your proposed budget");
      return;
    }

    setIsSubmittingProposal(true);

    try {
      const budgetToSend =
        budgetOption === "accept"
          ? parseFloat(job?.budget.replace(/[₱,]/g, "") || "0")
          : parseFloat(proposedBudget);

      const response = await fetch(
        `${API_BASE}/api/accounts/job-applications/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            job_posting_id: id,
            proposal_message: proposalMessage,
            proposed_budget: budgetToSend,
            budget_option: budgetOption,
            estimated_duration: estimatedDuration || null,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ Proposal sent successfully!");
        setIsProposalModalOpen(false);
        setProposalMessage("");
        setBudgetOption(null);
        setProposedBudget("");
        setEstimatedDuration("");
      } else {
        alert(`Error: ${data.error || "Failed to send proposal"}`);
      }
    } catch (error) {
      console.error("Error sending proposal:", error);
      alert("An error occurred while sending your proposal");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toUpperCase()) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The job you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <DesktopNavbar
          isWorker={isWorker}
          userName={
            `${user?.profile_data?.firstName || ""} ${user?.profile_data?.lastName || ""}`.trim() ||
            "User"
          }
          userAvatar={user?.profile_data?.profileImg || "/worker2.jpg"}
          onLogout={logout}
          isAvailable={false}
          isLoadingAvailability={false}
          onAvailabilityToggle={() => {}}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Job Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {job.category.name}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}
                  >
                    {job.urgency} Urgency
                  </span>
                  <span className="text-sm text-gray-500">{job.postedAt}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Budget</p>
                <p className="text-3xl font-bold text-green-600">
                  {job.budget}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <Image
                src={job.client.avatar || "/worker2.jpg"}
                alt={job.client.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{job.client.name}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="text-yellow-400 mr-1">⭐</span>
                    {job.client.rating}
                  </span>
                  {job.client.city && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {job.client.city}
                    </span>
                  )}
                  {job.client.totalJobsPosted && (
                    <span>{job.client.totalJobsPosted} jobs posted</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isWorker && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleSendProposal}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Send Proposal
              </button>
            </div>
          )}
        </div>

        {/* Job Details Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Job Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Materials Needed */}
            {job.materialsNeeded && job.materialsNeeded.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Materials Needed
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.materialsNeeded.map((material, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Section - Only visible to job owner (client) */}
            {isClient && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Applications ({applications.length})
                </h2>

                {isLoadingApplications ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-sm">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        {/* Worker Info */}
                        <div className="flex items-start gap-3 mb-3">
                          <Image
                            src={application.worker.avatar || "/worker1.jpg"}
                            alt={application.worker.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {application.worker.name}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <span className="text-yellow-400 mr-1">⭐</span>
                                {application.worker.rating.toFixed(1)}
                              </span>
                              {application.worker.city && (
                                <span>{application.worker.city}</span>
                              )}
                              {application.worker.specialization && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  {application.worker.specialization}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              application.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : application.status === "ACCEPTED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {application.status}
                          </span>
                        </div>

                        {/* Proposal Message */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Proposal:
                          </p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {application.proposal_message}
                          </p>
                        </div>

                        {/* Budget & Duration */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">
                              Proposed Budget
                            </p>
                            <p className="font-semibold text-gray-900">
                              ₱{application.proposed_budget.toFixed(2)}
                            </p>
                            {application.budget_option === "ACCEPT" && (
                              <span className="text-xs text-green-600">
                                Accepts your budget
                              </span>
                            )}
                          </div>
                          {application.estimated_duration && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500 mb-1">Duration</p>
                              <p className="font-semibold text-gray-900">
                                {application.estimated_duration}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons - Only show for pending applications */}
                        {application.status === "PENDING" && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() =>
                                handleAcceptApplication(application.id)
                              }
                              disabled={
                                processingApplicationId === application.id
                              }
                              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {processingApplicationId === application.id ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Accept
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRejectApplication(application.id)
                              }
                              disabled={
                                processingApplicationId === application.id
                              }
                              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {processingApplicationId === application.id ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-3">
                          Applied{" "}
                          {new Date(
                            application.created_at,
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            application.created_at,
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Job Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900">{job.location}</p>
                </div>
                {job.expectedDuration && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Expected Duration
                    </p>
                    <p className="font-medium text-gray-900">
                      {job.expectedDuration}
                    </p>
                  </div>
                )}
                {job.preferredStartDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Preferred Start Date
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(job.preferredStartDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setIsProposalModalOpen(false)}
          />

          <div className="relative bg-white rounded-xl max-w-2xl w-full mb-8 shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-xl font-bold text-gray-900">Send Proposal</h2>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="px-6 py-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder="Explain why you're the best fit for this job..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetOption("accept");
                        setProposedBudget("");
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-all ${
                        budgetOption === "accept"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Accept Client&apos;s Budget
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            I agree with {job.budget}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            budgetOption === "accept"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {budgetOption === "accept" && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBudgetOption("negotiate")}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-all ${
                        budgetOption === "negotiate"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Negotiate a Different Budget
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            I&apos;d like to propose a different price
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            budgetOption === "negotiate"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {budgetOption === "negotiate" && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>

                    {budgetOption === "negotiate" && (
                      <div className="mt-3 pl-4 border-l-4 border-blue-500">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Your Proposed Budget (₱)
                        </label>
                        <input
                          type="number"
                          value={proposedBudget}
                          onChange={(e) => setProposedBudget(e.target.value)}
                          placeholder="Enter your budget"
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Client&apos;s budget: {job.budget}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (Optional)
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 3 days, 1 week, 2 weeks"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmittingProposal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmittingProposal ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Proposal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav isWorker={isWorker} />
    </div>
  );
}
