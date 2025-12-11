"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUserSession } from "@/lib/session";

// MOBILE FIRST ALWAYS
const WorkerView = () => {
  const router = useRouter();

  useEffect(() => {
    const hasSeenOnboard = localStorage.getItem("hasSeenOnboard");

    if (hasSeenOnboard) {
      // Already visited before → go to login
      router.replace("/auth/login");
    }
  }, [router]);

  const { translateX, isTransitioning } = useSwipeGesture({
    onSwipeLeft: () => {
      router.push("/onboard/page");
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
          <div className="text-center mb-12">
            <header className="font-bold text-2xl font-inter">
              iAyos
            </header>
            <header className="text-sm font-inter text-gray-600 mt-1">
              May sira? May iAyos.
            </header>
          </div>
          <div className="text-center px-2">
            <div className="flex justify-center mb-6">
              <img src="/onboard_stockimg.svg" alt="iAyos illustration" className="max-w-full h-auto" />
            </div>
            <h1 className="text-3xl leading-tight font-bold font-inter mb-4">
              Find the right people for the job
            </h1>
            <p className="font-inter text-base text-gray-600 mb-8">
              Connect with skilled workers for all your home service needs
            </p>
            <ButtonComp
              label="Get Started"
              variant="primary"
              link="/onboard/page"
              style="h-12 w-full"
            />
          </div>
        </div>
        <div className="pb-8">
          <PageIndicator currentPage={1} totalPages={3} />
        </div>
      </div>
    </div>
  );
};

export default WorkerView;
