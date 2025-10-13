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

  // Use the worker availability hook
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

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
                "✅ Got user location from profile:",
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
              "✅ Got user location from browser:",
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

  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Mock data for job postings (Worker view) - sorted by distance
  const jobPostings: JobPosting[] = [
    {
      id: "1",
      title: "Refrigerator Not Cooling",
      category: "Appliance Repair",
      description:
        "My refrigerator stopped cooling. Need urgent repair. It's a Samsung model, about 3 years old.",
      budget: "₱500-800",
      location: "Quezon City, Metro Manila",
      distance: 1.2,
      postedBy: {
        name: "Maria Santos",
        avatar: "/worker2.jpg",
        rating: 4.8,
      },
      postedAt: "2 hours ago",
      urgency: "HIGH" as const,
    },
    {
      id: "2",
      title: "Install New Light Fixtures",
      category: "Electrical Work",
      description:
        "Need to install 5 new LED light fixtures in living room and bedrooms.",
      budget: "₱800-1200",
      location: "Makati City, Metro Manila",
      distance: 2.5,
      postedBy: {
        name: "Juan Dela Cruz",
        avatar: "/worker1.jpg",
        rating: 4.9,
      },
      postedAt: "5 hours ago",
      urgency: "MEDIUM" as const,
    },
    {
      id: "3",
      title: "Fix Leaking Kitchen Sink",
      category: "Plumbing",
      description:
        "Kitchen sink has been leaking under the cabinet. Water damage starting to show.",
      budget: "₱300-500",
      location: "Pasig City, Metro Manila",
      distance: 3.8,
      postedBy: {
        name: "Anna Lopez",
        avatar: "/worker3.jpg",
        rating: 5.0,
      },
      postedAt: "1 day ago",
      urgency: "HIGH" as const,
    },
    {
      id: "4",
      title: "Washing Machine Repair",
      category: "Appliance Repair",
      description:
        "Washing machine not spinning properly. Makes loud noise during wash cycle.",
      budget: "₱400-600",
      location: "Manila City, Metro Manila",
      distance: 4.2,
      postedBy: {
        name: "Carlos Reyes",
        avatar: "/worker1.jpg",
        rating: 4.7,
      },
      postedAt: "3 hours ago",
      urgency: "MEDIUM" as const,
    },
    {
      id: "5",
      title: "Deep House Cleaning",
      category: "Cleaning Services",
      description:
        "Need complete house cleaning for 2-bedroom apartment before moving in.",
      budget: "₱1200-1800",
      location: "Mandaluyong City, Metro Manila",
      distance: 5.0,
      postedBy: {
        name: "Lisa Cruz",
        avatar: "/worker2.jpg",
        rating: 4.6,
      },
      postedAt: "6 hours ago",
      urgency: "LOW" as const,
    },
  ].sort((a, b) => a.distance - b.distance);

  // Mock data for job categories (Client view)
  const jobCategories: JobCategory[] = [
    {
      id: "1",
      name: "Appliance Repair",
      description: "Fix refrigerators, washing machines, and more",
      icon: "🔧",
      workerCount: 45,
    },
    {
      id: "2",
      name: "Electrical Work",
      description: "Wiring, outlets, and electrical repairs",
      icon: "⚡",
      workerCount: 32,
    },
    {
      id: "3",
      name: "Plumbing",
      description: "Pipe repairs, drain cleaning, installations",
      icon: "🚿",
      workerCount: 28,
    },
    {
      id: "4",
      name: "Carpentry",
      description: "Furniture repair, installations, woodwork",
      icon: "🔨",
      workerCount: 21,
    },
    {
      id: "5",
      name: "Cleaning Services",
      description: "House cleaning, deep cleaning, maintenance",
      icon: "🧽",
      workerCount: 67,
    },
    {
      id: "6",
      name: "Gardening",
      description: "Lawn care, plant maintenance, landscaping",
      icon: "🌱",
      workerCount: 19,
    },
  ];

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
            {jobPostings.map((job) => (
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
                        <span>•</span>
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
                          <span className="text-yellow-400 mr-1">⭐</span>
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
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex space-x-2">
                  <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                    Send Proposal
                  </button>
                </div>
              </div>
            ))}
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
              {jobPostings.map((job) => (
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
                          <span>•</span>
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
                            <span className="text-yellow-400 mr-1">⭐</span>
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
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
                    <button className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-white text-blue-500 border border-blue-500 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                      Send Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                              <span className="text-yellow-400 mr-1">⭐</span>
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
                            <span className="text-yellow-400 mr-1">⭐</span>
                            <span className="font-medium">{worker.rating}</span>
                            <span className="ml-1">({worker.reviewCount})</span>
                          </div>
                          <span>•</span>
                          <span>{worker.experience}</span>
                          <span>•</span>
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
                            <span className="text-yellow-400 mr-1">⭐</span>
                            <span className="font-medium">{worker.rating}</span>
                            <span className="ml-1">({worker.reviewCount})</span>
                          </div>
                          <span>•</span>
                          <span>{worker.experience}</span>
                          <span>•</span>
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
                                <span className="text-yellow-400">⭐</span>
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
                              <span className="text-yellow-400">⭐</span>
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
