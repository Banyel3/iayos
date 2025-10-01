"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";

// Extended User interface for home page
interface HomeUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

// Job/Service interfaces
interface JobSpecialization {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedPrice: string;
  workerCount: number;
}

interface ActiveJob {
  id: string;
  title: string;
  client: string;
  status: "IN_PROGRESS" | "PENDING" | "COMPLETED";
  price: string;
  timeRemaining: string;
  progress: number;
}

interface RecentActivity {
  id: string;
  type:
    | "JOB_COMPLETED"
    | "NEW_BOOKING"
    | "PAYMENT_RECEIVED"
    | "REVIEW_RECEIVED";
  title: string;
  description: string;
  timeAgo: string;
  amount?: string;
  rating?: number;
}

const HomePage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as HomeUser;
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState<
    string | null
  >(null);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
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

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Mock data for job specializations
  const jobSpecializations: JobSpecialization[] = [
    {
      id: "1",
      name: "Appliance Repair",
      description: "Fix refrigerators, washing machines, and more",
      icon: "🔧",
      estimatedPrice: "₱300-800",
      workerCount: 45,
    },
    {
      id: "2",
      name: "Electrical Work",
      description: "Wiring, outlets, and electrical repairs",
      icon: "⚡",
      estimatedPrice: "₱400-1200",
      workerCount: 32,
    },
    {
      id: "3",
      name: "Plumbing",
      description: "Pipe repairs, drain cleaning, installations",
      icon: "🚿",
      estimatedPrice: "₱250-600",
      workerCount: 28,
    },
    {
      id: "4",
      name: "Carpentry",
      description: "Furniture repair, installations, woodwork",
      icon: "🔨",
      estimatedPrice: "₱500-1500",
      workerCount: 21,
    },
    {
      id: "5",
      name: "Cleaning Services",
      description: "House cleaning, deep cleaning, maintenance",
      icon: "🧽",
      estimatedPrice: "₱200-500",
      workerCount: 67,
    },
    {
      id: "6",
      name: "Gardening",
      description: "Lawn care, plant maintenance, landscaping",
      icon: "🌱",
      estimatedPrice: "₱150-400",
      workerCount: 19,
    },
  ];

  // Mock data for active jobs (Worker view)
  const activeJobs: ActiveJob[] = [
    {
      id: "1",
      title: "Refrigerator Repair",
      client: "Maria Santos",
      status: "IN_PROGRESS",
      price: "₱650",
      timeRemaining: "2h 30m",
      progress: 65,
    },
    {
      id: "2",
      title: "Kitchen Sink Installation",
      client: "Juan Dela Cruz",
      status: "PENDING",
      price: "₱450",
      timeRemaining: "4h 15m",
      progress: 0,
    },
  ];

  // Mock data for recent activity
  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      description: "From washing machine repair job",
      timeAgo: "2 hours ago",
      amount: "₱380",
    },
    {
      id: "2",
      type: "REVIEW_RECEIVED",
      title: "New Review",
      description: "5-star rating from Anna Lopez",
      timeAgo: "1 day ago",
      rating: 5,
    },
    {
      id: "3",
      type: "JOB_COMPLETED",
      title: "Job Completed",
      description: "Microwave repair for Lisa Cruz",
      timeAgo: "2 days ago",
    },
  ];

  // Worker Dashboard
  const renderWorkerDashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Status Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isAvailable ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => setIsAvailable(!isAvailable)}
            >
              {isAvailable ? "Available for Work" : "Currently Unavailable"}
            </span>
          </div>
          <button className="text-blue-500 text-sm font-medium">
            📍 Set Location
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Image
            src="/worker1.jpg"
            alt="Profile"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Welcome back, {user?.profile_data?.firstName || "Worker"}!
            </h1>
            <p className="text-sm text-gray-600">
              Ready to start working today?
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-xs text-gray-600">Jobs This Month</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">₱4,850</p>
            <p className="text-xs text-gray-600">Total Earnings</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">4.8</p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Active Jobs</h2>
            <button className="text-blue-500 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700"
                        : job.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Client: {job.client}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {job.price}
                  </span>
                  <span className="text-sm text-gray-600">
                    {job.timeRemaining} remaining
                  </span>
                </div>
                {job.status === "IN_PROGRESS" && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Specializations */}
      <div className="mx-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            My Specializations
          </h2>
          <button className="text-blue-500 text-sm font-medium">Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {jobSpecializations.slice(0, 4).map((spec) => (
            <div
              key={spec.id}
              className="bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => setSelectedSpecialization(spec.id)}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{spec.icon}</div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  {spec.name}
                </h3>
                <p className="text-xs text-gray-600">{spec.estimatedPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mx-4 mt-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Activity
        </h2>
        <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.type === "PAYMENT_RECEIVED"
                      ? "bg-green-100 text-green-600"
                      : activity.type === "REVIEW_RECEIVED"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {activity.type === "PAYMENT_RECEIVED"
                    ? "💰"
                    : activity.type === "REVIEW_RECEIVED"
                    ? "⭐"
                    : "✅"}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {activity.timeAgo}
                    </span>
                    {activity.amount && (
                      <span className="text-sm font-medium text-green-600">
                        {activity.amount}
                      </span>
                    )}
                    {activity.rating && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < activity.rating!
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Client Dashboard
  const renderClientDashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Welcome Section */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Image
            src="/worker2.jpg"
            alt="Profile"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Hello, {user?.profile_data?.firstName || "Client"}!
            </h1>
            <p className="text-sm text-gray-600">
              What service do you need today?
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mx-4 mt-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for services..."
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:border-blue-500"
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

      {/* Quick Stats */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">8</p>
            <p className="text-xs text-gray-600">Jobs Posted</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">₱3,200</p>
            <p className="text-xs text-gray-600">Total Spent</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">4.9</p>
            <p className="text-xs text-gray-600">Your Rating</p>
          </div>
        </div>
      </div>

      {/* Popular Services */}
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Popular Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {jobSpecializations.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg p-4 border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() =>
                router.push(`/dashboard/search?service=${service.id}`)
              }
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{service.icon}</div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  {service.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">
                    {service.estimatedPrice}
                  </span>
                  <span className="text-gray-500">
                    {service.workerCount} workers
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mx-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h2>
          <button className="text-blue-500 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                Washing Machine Repair
              </h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Completed
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Worker: John Reyes</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">2 days ago</span>
              <span className="text-sm font-medium text-gray-900">₱380</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Electrical Wiring</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                In Progress
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Worker: Maria Garcia</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Started 1 hour ago</span>
              <span className="text-sm font-medium text-gray-900">₱750</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Fallback for users without profile type
  const renderDefaultDashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
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
            To access your dashboard, please complete your profile setup.
          </p>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isWorker && renderWorkerDashboard()}
      {isClient && renderClientDashboard()}
      {!isWorker && !isClient && renderDefaultDashboard()}
      <MobileNav />
    </>
  );
};

export default HomePage;
