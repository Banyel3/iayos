"use client";

import { useEffect, useState } from "react";
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

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [budgetOption, setBudgetOption] = useState<
    "accept" | "negotiate" | null
  >(null);
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const isWorker = user?.profile_data?.profileType === "WORKER";

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/jobs/${id}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.job) {
          setJob(data.job);
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
  }, [id]);

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
        "http://localhost:8000/api/accounts/job-applications/create",
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
        }
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
