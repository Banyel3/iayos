"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";

interface WorkerProfileData {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  startingPrice: string;
  experience: string;
  specialization: string;
  isVerified: boolean;
  distance: number;
}

const WorkerProfileViewPage = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;

  const [workerData, setWorkerData] = useState<WorkerProfileData | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch worker profile by ID
  useEffect(() => {
    const fetchWorkerProfile = async () => {
      if (!workerId) return;

      try {
        setIsLoadingWorker(true);
        setError(null);

        const response = await fetch(
          `http://localhost:8000/api/accounts/users/workers/${workerId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch worker profile");
        }

        const data = await response.json();

        if (data.success && data.worker) {
          setWorkerData(data.worker);
        } else {
          throw new Error("Worker not found");
        }
      } catch (error) {
        console.error("Error fetching worker profile:", error);
        setError("Failed to load worker profile. Please try again.");
      } finally {
        setIsLoadingWorker(false);
      }
    };

    fetchWorkerProfile();
  }, [workerId]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading || isLoadingWorker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading worker profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Error state
  if (error || !workerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesktopNavbar
          isWorker={false}
          userName={user?.profile_data?.firstName || "User"}
          onLogout={logout}
          isAvailable={false}
          onAvailabilityToggle={() => {}}
        />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Worker Not Found
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard/home")}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
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
        userName={user?.profile_data?.firstName || "User"}
        onLogout={logout}
        isAvailable={false}
        onAvailabilityToggle={() => {}}
      />

      {/* Mobile View */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Worker Profile</h1>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-4 py-6 space-y-4">
          {/* Profile Header Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-4 mb-4">
              <Image
                src={workerData.avatar}
                alt={workerData.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {workerData.name}
                  </h2>
                  {workerData.isVerified && (
                    <svg
                      className="w-6 h-6 text-blue-500"
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
                <p className="text-sm text-gray-600 mb-2">
                  {workerData.specialization}
                </p>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-yellow-400 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">
                      {workerData.rating.toFixed(1)}
                    </span>
                    <span className="ml-1">
                      ({workerData.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Experience:</span>
                <span className="text-sm font-medium text-gray-900">
                  {workerData.experience}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Starting Price:</span>
                <span className="text-lg font-bold text-blue-600">
                  {workerData.startingPrice}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Distance:</span>
                <span className="text-sm font-medium text-gray-900">
                  {workerData.distance.toFixed(1)} km away
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Hire Worker
            </button>
            <button className="flex-1 border border-blue-500 text-blue-500 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Message
            </button>
          </div>

          {/* Additional Info Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Professional {workerData.specialization.toLowerCase()} with{" "}
              {workerData.experience.toLowerCase()} of experience. Verified and
              trusted by the iAyos community.
            </p>
          </div>
        </div>

        <MobileNav />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
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
            Back to Workers
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex flex-col items-center text-center mb-6">
                  <Image
                    src={workerData.avatar}
                    alt={workerData.name}
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-full object-cover mb-4"
                  />
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {workerData.name}
                    </h2>
                    {workerData.isVerified && (
                      <svg
                        className="w-6 h-6 text-blue-500"
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
                  <p className="text-gray-600 mb-4">
                    {workerData.specialization}
                  </p>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-lg">
                      {workerData.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      ({workerData.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="text-sm font-medium text-gray-900">
                      {workerData.experience}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Starting Price
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {workerData.startingPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="text-sm font-medium text-gray-900">
                      {workerData.distance.toFixed(1)} km away
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Hire Worker
                  </button>
                  <button className="w-full border border-blue-500 text-blue-500 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  About {workerData.name.split(" ")[0]}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Professional {workerData.specialization.toLowerCase()} with{" "}
                  {workerData.experience.toLowerCase()} of experience. Verified
                  and trusted by the iAyos community. Dedicated to providing
                  high-quality service and ensuring customer satisfaction.
                </p>

                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Specialization
                </h4>
                <div className="bg-blue-50 rounded-lg p-4 mb-8">
                  <p className="text-blue-900 font-medium">
                    {workerData.specialization}
                  </p>
                </div>

                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Reviews & Ratings
                </h4>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">
                    No reviews yet. Be the first to hire and review this worker!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfileViewPage;
