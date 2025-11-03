"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";
import { LocationToggle } from "@/components/ui/location-toggle";

interface HomeUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
    profileImg?: string;
  };
}

interface JobPosting {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string;
  location: string;
  distance: number;
  postedBy: {
    name: string;
    avatar: string;
    rating: number;
  };
  postedAt: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  photos?: Array<{
    id: number;
    url: string;
    file_name?: string;
  }>;
}

interface JobCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  workerCount: number;
}

interface WorkerListing {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  startingPrice: string;
  experience: string;
  specialization: string;
  isVerified: boolean;
  distance: number | null; // Can be null if location unavailable
}

const HomePage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as HomeUser;
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [workerListings, setWorkerListings] = useState<WorkerListing[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Track applied jobs
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  // Job details modal state
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<JobPosting | null>(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);

  // Application modal state
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budgetOption, setBudgetOption] = useState<"ACCEPT" | "NEGOTIATE">(
    "ACCEPT"
  );
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  // Use the worker availability hook
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  // State for job categories (Client view) - will be fetched from API
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch workers from backend
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setIsLoadingWorkers(true);

        // First, try to get the user's location from their profile
        let userLatitude: number | null = null;
        let userLongitude: number | null = null;

        try {
          const locationResponse = await fetch(
            "http://localhost:8000/api/accounts/location/me",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            if (locationData.success && locationData.location) {
              userLatitude = locationData.location.latitude;
              userLongitude = locationData.location.longitude;
              console.log(
                "? Got user location from profile:",
                userLatitude,
                userLongitude
              );
            }
          }
        } catch (locError) {
          console.log(
            "User location not available from profile, will try browser location"
          );
        }

        // If no location from profile, try to get from browser
        if (userLatitude === null || userLongitude === null) {
          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                  enableHighAccuracy: false,
                });
              }
            );
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
            console.log(
              "? Got user location from browser:",
              userLatitude,
              userLongitude
            );
          } catch (geoError) {
            console.log("Browser location not available");
          }
        }

        // Build URL with location parameters if available
        let url = "http://localhost:8000/api/accounts/users/workers";
        if (userLatitude !== null && userLongitude !== null) {
          url += `?latitude=${userLatitude}&longitude=${userLongitude}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error("Failed to fetch workers");
        }

        const data = await response.json();

        if (data.success && data.workers) {
          setWorkerListings(data.workers);
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
        // Optionally set empty array or keep mock data as fallback
        setWorkerListings([]);
      } finally {
        setIsLoadingWorkers(false);
      }
    };

    // Only fetch if user is a client
    if (isAuthenticated && user?.profile_data?.profileType === "CLIENT") {
      fetchWorkers();
    }
  }, [isAuthenticated, user?.profile_data?.profileType]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  };

  // Fetch job postings for workers
  useEffect(() => {
    const fetchJobs = async () => {
      if (!isWorker) return; // Only fetch jobs if user is a worker

      try {
        setIsLoadingJobs(true);
        const response = await fetch(
          "http://localhost:8000/api/jobs/available",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to fetch jobs: ${response.status} ${response.statusText}`
          );
          setJobPostings([]);
          return;
        }

        const data = await response.json();

        if (data.success && data.jobs) {
          // Map backend data to frontend format
          const mappedJobs: JobPosting[] = data.jobs.map((job: any) => ({
            id: job.id.toString(),
            title: job.title,
            category: job.category?.name || "Uncategorized",
            description: job.description,
            budget: `₱${job.budget.toFixed(2)}`,
            location: job.location,
            distance: 0, // Will be calculated if we have coordinates
            postedBy: {
              name: job.client.name,
              avatar: job.client.avatar,
              rating: job.client.rating || 0,
            },
            postedAt: formatTimeAgo(job.created_at),
            urgency: job.urgency as "LOW" | "MEDIUM" | "HIGH",
            photos: job.photos || [],
          }));
          setJobPostings(mappedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobPostings([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (isAuthenticated && isWorker) {
      fetchJobs();
    }
  }, [isAuthenticated, isWorker]);

  // Fetch worker's applications to determine which jobs they've applied to
  useEffect(() => {
    const fetchMyApplications = async () => {
      if (!isWorker || !isAuthenticated) return;

      try {
        const response = await fetch(
          "http://localhost:8000/api/jobs/my-applications",
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📋 My applications response:", data);
          if (data.success && data.applications) {
            // Extract job IDs from applications
            const jobIds = new Set<string>(
              data.applications.map((app: any) => app.job_id.toString())
            );
            console.log("✅ Applied job IDs:", Array.from(jobIds));
            setAppliedJobs(jobIds);
          }
        } else {
          console.error("❌ Failed to fetch applications:", response.status);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    if (isAuthenticated && isWorker) {
      fetchMyApplications();
    }
  }, [isAuthenticated, isWorker]);

  // Fetch job categories for client view
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isClient) return;

      try {
        const response = await fetch(
          "http://localhost:8000/api/adminpanel/jobs/categories",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to fetch categories: ${response.status} ${response.statusText}`
          );
          setJobCategories([]);
          return;
        }

        const data = await response.json();
        if (data.success && data.categories) {
          const mappedCategories = data.categories.map((cat: any) => ({
            id: cat.id.toString(),
            name: cat.name,
            description: cat.description || "",
            icon: cat.icon || "🔧",
            workerCount: cat.worker_count || 0,
          }));
          setJobCategories(mappedCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setJobCategories([]);
      }
    };

    if (isAuthenticated && isClient) {
      fetchCategories();
    }
  }, [isAuthenticated, isClient]);

  // Early returns
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Handle opening job details modal
  const handleViewDetailsClick = (job: JobPosting) => {
    setSelectedJobForDetails(job);
    setShowJobDetailsModal(true);
  };

  // Handle opening application modal
  const handleApplyClick = (job: JobPosting) => {
    setSelectedJob(job);
    setProposalMessage("");
    setProposedBudget(job.budget.replace(/[^0-9.]/g, "")); // Extract number from budget string
    setEstimatedDuration("");
    setBudgetOption("ACCEPT");
    setApplicationError("");
    setShowApplicationModal(true);
  };

  // Handle application submission
  const handleSubmitApplication = async () => {
    if (!selectedJob) return;

    // Validation
    if (!proposalMessage.trim()) {
      setApplicationError("Please provide a proposal message");
      return;
    }

    if (
      budgetOption === "NEGOTIATE" &&
      (!proposedBudget || parseFloat(proposedBudget) <= 0)
    ) {
      setApplicationError("Please enter a valid budget amount");
      return;
    }

    setIsSubmittingApplication(true);
    setApplicationError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/jobs/${selectedJob.id}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            proposal_message: proposalMessage,
            proposed_budget:
              budgetOption === "ACCEPT"
                ? parseFloat(selectedJob.budget.replace(/[^0-9.]/g, ""))
                : parseFloat(proposedBudget),
            estimated_duration: estimatedDuration || null,
            budget_option: budgetOption,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      const data = await response.json();

      if (data.success) {
        // Add job to applied jobs set
        setAppliedJobs((prev) => new Set(prev).add(selectedJob.id));

        alert(
          "Application submitted successfully! You can view your application status in the job details."
        );
        setShowApplicationModal(false);
        setSelectedJob(null);
      } else {
        throw new Error(data.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setApplicationError(
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again."
      );
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Filter workers by selected category
  const filteredWorkers = selectedCategory
    ? workerListings.filter(
        (w) =>
          w.specialization ===
          jobCategories.find((c) => c.id === selectedCategory)?.name
      )
    : workerListings;

  // Render conditional views based on user type
  if (isWorker) {
    // Worker View - Browse Job Postings
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Notification Bell */}
        <div className="fixed top-4 right-4 z-50">
          <NotificationBell />
        </div>

        {/* Desktop Navbar */}
        <div className="hidden lg:block">
          <DesktopNavbar
            isWorker={true}
            userName={
              `${user?.profile_data?.firstName || ""} ${user?.profile_data?.lastName || ""}`.trim() ||
              "Worker"
            }
            userAvatar={user?.profile_data?.profileImg || "/worker1.jpg"}
            onLogout={logout}
            isAvailable={isAvailable}
            isLoadingAvailability={isLoadingAvailability}
            onAvailabilityToggle={handleAvailabilityToggle}
          />
        </div>

        {/* Mobile View */}
        <div className="lg:hidden pb-16">
          <div className="bg-white px-4 py-4 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-900">
              Available Jobs
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Sorted by closest first
            </p>
          </div>
          <div className="bg-white px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="px-4 py-4 space-y-3">
            {isLoadingJobs ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available jobs...</p>
              </div>
            ) : jobPostings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-medium mb-2">
                  No jobs available
                </h3>
                <p className="text-gray-600 text-sm">
                  Check back later for new job postings
                </p>
              </div>
            ) : (
              jobPostings.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z"
                              />
                            </svg>
                            {job.category}
                          </span>
                          <span>�</span>
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
                            {job.distance.toFixed(1)} km away
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}
                      >
                        {job.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {job.description}
                    </p>
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={job.postedBy.avatar}
                          alt={job.postedBy.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {job.postedBy.name}
                          </p>
                          <div className="flex items-center text-xs text-gray-600">
                            <span className="text-yellow-400 mr-1">?</span>
                            {job.postedBy.rating}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{job.postedAt}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-lg font-bold text-green-600">
                          {job.budget}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 text-right">
                          Location
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {job.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col space-y-2">
                    {(() => {
                      const hasApplied = appliedJobs.has(job.id);
                      console.log(
                        `Job ${job.id} - Has Applied: ${hasApplied}, Applied Jobs:`,
                        Array.from(appliedJobs)
                      );
                      return (
                        hasApplied && (
                          <p className="text-xs text-green-600 text-center font-medium">
                            ✓ You have already applied for this job
                          </p>
                        )
                      );
                    })()}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetailsClick(job)}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={appliedJobs.has(job.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          appliedJobs.has(job.id)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-white text-blue-500 border border-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        {appliedJobs.has(job.id) ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <MobileNav isWorker={isWorker} />
        </div>

        {/* Desktop View - Same content but without mobile nav */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white px-6 py-5 border-b border-gray-100 rounded-t-lg">
              <h1 className="text-2xl font-semibold text-gray-900">
                Available Jobs
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Sorted by closest first
              </p>
            </div>
            <div className="bg-white px-6 py-4 border-b border-gray-100">
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Search for jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pl-12 text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {isLoadingJobs ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available jobs...</p>
                </div>
              ) : jobPostings.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-2">
                    No jobs available
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Check back later for new job postings
                  </p>
                </div>
              ) : (
                jobPostings.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
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
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z"
                                />
                              </svg>
                              {job.category}
                            </span>
                            <span>�</span>
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
                              {job.distance.toFixed(1)} km away
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}
                        >
                          {job.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={job.postedBy.avatar}
                            alt={job.postedBy.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {job.postedBy.name}
                            </p>
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="text-yellow-400 mr-1">?</span>
                              {job.postedBy.rating}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{job.postedAt}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-xl font-bold text-green-600">
                            {job.budget}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 text-right">
                            Location
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {job.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col space-y-2">
                      {appliedJobs.has(job.id) && (
                        <p className="text-xs text-green-600 text-center font-medium">
                          ✓ You have already applied for this job
                        </p>
                      )}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewDetailsClick(job)}
                          className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleApplyClick(job)}
                          disabled={appliedJobs.has(job.id)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            appliedJobs.has(job.id)
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-white text-blue-500 border border-blue-500 hover:bg-blue-50"
                          }`}
                        >
                          {appliedJobs.has(job.id) ? "Applied" : "Apply"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Job Details Modal */}
        {showJobDetailsModal && selectedJobForDetails && !fullImageView && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setShowJobDetailsModal(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  Job Details
                </h2>
                <button
                  onClick={() => setShowJobDetailsModal(false)}
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

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Title and Budget */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJobForDetails.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-green-600">
                      {selectedJobForDetails.budget}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getUrgencyColor(selectedJobForDetails.urgency)}`}
                    >
                      {selectedJobForDetails.urgency}
                    </span>
                  </div>
                </div>

                {/* Category and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-medium text-gray-900">
                      {selectedJobForDetails.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedJobForDetails.location}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedJobForDetails.description}
                  </p>
                </div>

                {/* Job Photos */}
                {selectedJobForDetails.photos &&
                  selectedJobForDetails.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Job Photos
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedJobForDetails.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setFullImageView(photo.url)}
                          >
                            <img
                              src={photo.url}
                              alt={photo.file_name || "Job photo"}
                              className="w-full h-full object-contain bg-gray-100"
                              onLoad={(e) => {
                                e.currentTarget.style.opacity = "1";
                              }}
                              style={{ opacity: 0, transition: "opacity 0.3s" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Client Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Client Information
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={selectedJobForDetails.postedBy.avatar}
                      alt={selectedJobForDetails.postedBy.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {selectedJobForDetails.postedBy.name}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedJobForDetails.postedBy.rating} rating
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posted Time */}
                <div className="text-sm text-gray-500">
                  Posted {selectedJobForDetails.postedAt}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowJobDetailsModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowJobDetailsModal(false);
                      handleApplyClick(selectedJobForDetails);
                    }}
                    disabled={appliedJobs.has(selectedJobForDetails.id)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      appliedJobs.has(selectedJobForDetails.id)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {appliedJobs.has(selectedJobForDetails.id)
                      ? "Already Applied"
                      : "Apply Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Modal */}
        {showApplicationModal && selectedJob && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() =>
                !isSubmittingApplication && setShowApplicationModal(false)
              }
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  Apply for Job
                </h2>
                <button
                  onClick={() =>
                    !isSubmittingApplication && setShowApplicationModal(false)
                  }
                  disabled={isSubmittingApplication}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Job Info Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selectedJob.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium text-blue-600">
                      {selectedJob.budget}
                    </span>
                    <span>•</span>
                    <span>{selectedJob.location}</span>
                    <span>•</span>
                    <span>{selectedJob.category}</span>
                  </div>
                </div>

                {/* Proposal Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder="Explain why you're the best fit for this job..."
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isSubmittingApplication}
                  />
                </div>

                {/* Budget Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="budgetOption"
                        value="ACCEPT"
                        checked={budgetOption === "ACCEPT"}
                        onChange={() => setBudgetOption("ACCEPT")}
                        disabled={isSubmittingApplication}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Accept Client's Budget
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          I agree to work for {selectedJob.budget}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="budgetOption"
                        value="NEGOTIATE"
                        checked={budgetOption === "NEGOTIATE"}
                        onChange={() => setBudgetOption("NEGOTIATE")}
                        disabled={isSubmittingApplication}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Negotiate Budget
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Discuss a different budget with the client
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Proposed Budget (shown when NEGOTIATE is selected) */}
                {budgetOption === "NEGOTIATE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Proposed Budget{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                        ₱
                      </span>
                      <input
                        type="number"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmittingApplication}
                      />
                    </div>
                  </div>
                )}

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (Optional)
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 2-3 days, 1 week"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmittingApplication}
                  />
                </div>

                {/* Error Message */}
                {applicationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{applicationError}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    disabled={isSubmittingApplication}
                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmittingApplication}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingApplication
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Image Viewer Modal */}
        {fullImageView && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <button
                  onClick={() => setFullImageView(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
                  Back to Details
                </button>
                <button
                  onClick={() => setFullImageView(null)}
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

              {/* Image Content */}
              <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
                <img
                  src={fullImageView}
                  alt="Full size view"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isClient) {
    // Client View - Browse Categories and Workers
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Notification Bell - Mobile Only */}
        <div className="lg:hidden fixed top-4 right-4 z-50">
          <NotificationBell />
        </div>

        {/* Desktop Navbar */}
        <div className="hidden lg:block">
          <DesktopNavbar
            isWorker={false}
            userName={
              `${user?.profile_data?.firstName || ""} ${user?.profile_data?.lastName || ""}`.trim() ||
              "Client"
            }
            userAvatar={user?.profile_data?.profileImg || "/worker2.jpg"}
            onLogout={logout}
            isAvailable={false}
            isLoadingAvailability={false}
            onAvailabilityToggle={() => {}}
          />
        </div>

        {/* Mobile View */}
        <div className="lg:hidden pb-16">
          <div className="bg-white px-4 py-4 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-900">
              Find Workers
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Browse by category or search
            </p>
          </div>
          <div className="bg-white px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for services or workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Service Categories
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {jobCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                  className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {category.description}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {category.workerCount} workers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workers Near You Section - Mobile */}
          <div className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Workers Near You
            </h2>
            {isLoadingWorkers ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : workerListings.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-600">
                  No workers available at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...workerListings]
                  .sort((a, b) => {
                    // Handle null distances - put them at the end
                    if (a.distance === null && b.distance === null) return 0;
                    if (a.distance === null) return 1;
                    if (b.distance === null) return -1;
                    return a.distance - b.distance;
                  })
                  .map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Image
                            src={worker.avatar}
                            alt={worker.name}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <div className="flex items-center space-x-1">
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {worker.name}
                                </h3>
                                {worker.isVerified && (
                                  <svg
                                    className="w-4 h-4 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {worker.specialization}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {worker.startingPrice}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="flex items-center text-xs text-gray-600">
                              <span className="text-yellow-400 mr-1">?</span>
                              {worker.rating} ({worker.reviewCount})
                            </span>
                            <span className="flex items-center text-xs text-gray-600">
                              <svg
                                className="w-3 h-3 mr-1"
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
                              {worker.distance !== null
                                ? `${worker.distance.toFixed(1)} km`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/workers/${worker.id}`)
                              }
                              className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-xs font-medium"
                            >
                              View Profile
                            </button>
                            <button className="flex-1 border border-blue-500 text-blue-500 py-2 rounded-lg text-xs font-medium">
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {selectedCategory && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {jobCategories.find((c) => c.id === selectedCategory)?.name}{" "}
                  Workers
                </h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-500 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <Image
                        src={worker.avatar}
                        alt={worker.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">
                                {worker.name}
                              </h3>
                              {worker.isVerified && (
                                <svg
                                  className="w-4 h-4 text-blue-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {worker.specialization}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {worker.startingPrice}
                            </p>
                            <p className="text-xs text-gray-500">starting</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">?</span>
                            <span className="font-medium">{worker.rating}</span>
                            <span className="ml-1">({worker.reviewCount})</span>
                          </div>
                          <span>�</span>
                          <span>{worker.experience}</span>
                          <span>�</span>
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
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
                            </svg>
                            {worker.distance !== null
                              ? `${worker.distance.toFixed(1)} km`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/workers/${worker.id}`)
                            }
                            className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            View Profile
                          </button>
                          <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!selectedCategory && (
            <div className="px-4 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Top Rated Workers Nearby
              </h2>
              <div className="space-y-3">
                {workerListings.slice(0, 5).map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <Image
                        src={worker.avatar}
                        alt={worker.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">
                                {worker.name}
                              </h3>
                              {worker.isVerified && (
                                <svg
                                  className="w-4 h-4 text-blue-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {worker.specialization}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {worker.startingPrice}
                            </p>
                            <p className="text-xs text-gray-500">starting</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">?</span>
                            <span className="font-medium">{worker.rating}</span>
                            <span className="ml-1">({worker.reviewCount})</span>
                          </div>
                          <span>�</span>
                          <span>{worker.experience}</span>
                          <span>�</span>
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
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
                            </svg>
                            {worker.distance !== null
                              ? `${worker.distance.toFixed(1)} km`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/workers/${worker.id}`)
                            }
                            className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            View Profile
                          </button>
                          <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <MobileNav isWorker={isWorker} />
        </div>

        {/* Desktop View - Similar layout but without mobile nav */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white px-6 py-5 border-b border-gray-100 rounded-t-lg">
              <h1 className="text-2xl font-semibold text-gray-900">
                Find Workers
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Browse by category or search
              </p>
            </div>
            <div className="bg-white px-6 py-4 border-b border-gray-100">
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Search workers by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pl-12 text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {/* Categories Grid */}
            <div className="bg-white px-6 py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Browse by Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {jobCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCategory === category.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {category.workerCount} workers
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Workers Near You Section */}
            <div className="bg-white px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Workers Near You
                </h2>
              </div>
              {isLoadingWorkers ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : workerListings.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">
                    No workers available at the moment
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...workerListings]
                    .sort((a, b) => {
                      // Handle null distances - put them at the end
                      if (a.distance === null && b.distance === null) return 0;
                      if (a.distance === null) return 1;
                      if (b.distance === null) return -1;
                      return a.distance - b.distance;
                    })
                    .map((worker) => (
                      <div
                        key={worker.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="relative">
                              <Image
                                src={worker.avatar}
                                alt={worker.name}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {worker.name}
                                </h3>
                                {worker.isVerified && (
                                  <svg
                                    className="w-5 h-5 text-blue-500 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {worker.specialization}
                              </p>
                              <div className="flex items-center space-x-1 text-sm">
                                <span className="text-yellow-400">?</span>
                                <span className="font-medium">
                                  {worker.rating}
                                </span>
                                <span className="text-gray-500">
                                  ({worker.reviewCount} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600 flex items-center">
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
                              {worker.distance !== null
                                ? `${worker.distance.toFixed(1)} km away`
                                : "N/A"}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {worker.startingPrice}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/workers/${worker.id}`)
                              }
                              className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                              View Profile
                            </button>
                            <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Workers Grid */}
            {selectedCategory && (
              <div className="bg-white px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {jobCategories.find((c) => c.id === selectedCategory)?.name}{" "}
                    Workers
                  </h2>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start space-x-4 mb-4">
                          <Image
                            src={worker.avatar}
                            alt={worker.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {worker.name}
                              </h3>
                              {worker.isVerified && (
                                <svg
                                  className="w-5 h-5 text-blue-500 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {worker.specialization}
                            </p>
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="text-yellow-400">?</span>
                              <span className="font-medium">
                                {worker.rating}
                              </span>
                              <span className="text-gray-500">
                                ({worker.reviewCount})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Starting Price
                            </span>
                            <span className="font-semibold text-green-600">
                              {worker.startingPrice}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Experience</span>
                            <span className="font-medium text-gray-900">
                              {worker.experience}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Distance</span>
                            <span className="font-medium text-gray-900 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1 text-gray-400"
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
                              {worker.distance !== null
                                ? `${worker.distance.toFixed(1)} km`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/workers/${worker.id}`)
                            }
                            className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            View Profile
                          </button>
                          <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for users without profile type
  return (
    <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="text-center px-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mb-6">
            To access the home page, please complete your profile setup.
          </p>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
      <MobileNav isWorker={isWorker} />
    </div>
  );
};

export default HomePage;
