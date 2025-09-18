"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { useRouter } from "next/navigation";

/**
 * User Type Selection Page
 *
 * This component allows users to choose between registering as a:
 * - Client: Someone who needs services/hire workers
 * - Worker: Someone who provides services/freelance work
 *
 * This page serves as a contingency when users can't access the onboard flow
 * and provides a direct way to choose their registration type.
 */
const UserTypeSelection = () => {
  const router = useRouter();

  useEffect(() => {
    // Mark that user has seen onboarding to prevent redirect loops
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenOnboard", "true");
    }
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-between">
        {/* Header Section */}
        <div className="flex flex-col justify-center flex-1 px-6">
          {/* App Branding */}
          <div className="text-center mb-8">
            <header className="font-bold text-3xl font-[Fredoka] text-black mb-2">
              iAyos
            </header>
            <header className="text-lg font-[Fredoka] text-gray-600">
              May sira? May iAyos.
            </header>
          </div>

          {/* Main Content */}
          <div className="text-center mb-12">
            <h1 className="text-[28px] leading-[120%] font-[700] font-[Inter] text-black mb-4">
              Choose Your Path
            </h1>
            <p className="text-gray-600 text-base leading-[150%] px-4">
              Join iAyos as a client looking for services, or as a worker ready
              to provide your skills.
            </p>
          </div>

          {/* User Type Cards */}
          <div className="space-y-6 mb-8">
            {/* Client Option */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center mb-4">
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
                <h3 className="text-xl font-[600] font-[Inter] text-black mb-2">
                  I need services
                </h3>
                <p className="text-gray-600 text-sm leading-[140%]">
                  Find skilled workers for your projects. Post jobs, hire
                  freelancers, and get things done.
                </p>
              </div>

              <ButtonComp
                label="Register as Client"
                variant="primary"
                link="/auth/register?type=client"
              />
            </div>

            {/* Worker Option */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2H6a2 2 0 00-2 2v2m8 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2V6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-[600] font-[Inter] text-black mb-2">
                  I provide services
                </h3>
                <p className="text-gray-600 text-sm leading-[140%]">
                  Showcase your skills and find clients. Build your freelance
                  career and earn money.
                </p>
              </div>

              <ButtonComp
                label="Register as Worker"
                variant="black"
                link="/auth/register?type=worker"
              />
            </div>
          </div>

          {/* Alternative Actions */}
          <div className="text-center space-y-3">
            <p className="text-gray-500 text-sm">Already have an account?</p>
            <ButtonComp
              label="Sign In"
              variant="secondary"
              link="/auth/login"
            />
          </div>
        </div>

        {/* Footer - Optional: Add back to onboard if needed */}
        <div className="p-6 text-center">
          <button
            onClick={() => router.push("/onboard")}
            className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
          >
            Back to Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
