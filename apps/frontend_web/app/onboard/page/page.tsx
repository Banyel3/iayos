"use client";

import React from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
// MOBILE FIRST ALWAYS
const Onboard = () => {
  const router = useRouter();

  useEffect(() => {
    const hasSeenOnboard = localStorage.getItem("hasSeenOnboard");

    if (hasSeenOnboard) {
      // Already visited before → go to login
      router.replace("/auth/login");
    }
  }, [router]);
  // Add swipe gestures for navigation with smooth animations
  const { translateX, isTransitioning } = useSwipeGesture({
    onSwipeRight: () => {
      router.push("/onboard");
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
      <div
        className="w-full max-w-sm h-full flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: isTransitioning ? 0.8 : 1,
        }}
      >
        <div className="flex flex-col justify-center flex-1 py-8">
          <div className="text-center px-2 mb-8">
            <header className="font-bold text-xl font-inter leading-tight">
              Who&apos;s in the iAyos Community
            </header>
          </div>
          <div className="text-center px-2">
            <div className="flex justify-center mb-6">
              <img
                src="/iayos_stat.svg"
                alt="iAyos statistics"
                className="max-w-full h-auto"
              />
            </div>
            <h1 className="text-3xl leading-tight font-bold font-inter mb-6">
              Find the right people for the job
            </h1>
            <p className="text-base text-gray-600 font-inter mb-8">
              Connect with skilled workers for all your home service needs
            </p>
          </div>
          <div className="px-2">
            <div className="text-center mb-6">
              <h2 className="font-medium text-lg font-inter">
                What are you looking for?
              </h2>
            </div>
            <div className="space-y-4">
              <ButtonComp
                label="I'm looking for a worker"
                variant="primary"
                link="/onboard/clients-view"
                style="h-12 w-full"
              />
              <ButtonComp
                label="I'm looking for a job"
                variant="secondary"
                link="/onboard/workers-view"
                style="h-12 w-full"
              />
            </div>
          </div>
        </div>
        <div className="pb-8">
          <PageIndicator currentPage={2} totalPages={3} />
        </div>
      </div>
    </div>
  );
};

export default Onboard;
