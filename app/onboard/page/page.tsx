"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
// MOBILE FIRST ALWAYS
const onboard = () => {
  const router = useRouter();

  // Add swipe gestures for navigation with smooth animations
  const { translateX, isTransitioning } = useSwipeGesture({
    onSwipeRight: () => {
      router.push("/onboard");
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div
        className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-between transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: isTransitioning ? 0.8 : 1,
        }}
      >
        <div className="flex flex-col justify-around flex-1">
          <div>
            <header className="px-4 font-bold text-2xl text-center font-[Fredoka]">
              Who's in the iAyos Community
            </header>
          </div>
          <div>
            <div className="flex justify-center">
              <img src="/iayos_stat.svg" alt="" />
            </div>
            <h1 className="p-4 text-[34px] leading-[100%] font-[700] font-[Inter] text-center">
              Find the right people for the job
            </h1>
            <br />
            <p className="px-4 text-lg text-center">
              Connect with skilled workers for all your <br />
              home service needs
            </p>
          </div>
          <div>
            <header className="px-4 py-1 text-center space-y-2">
              <h1 className="font-light text-[18px] text-sm/snug">
                What are you looking for?
              </h1>
            </header>
            <main className="p-4 text-black space-y-4">
              <ButtonComp
                label="I'm looking for a worker"
                variant="primary"
                link="/onboard/clients-view"
                style="h-12"
              />
              <ButtonComp
                label="I'm looking for a job"
                variant="secondary"
                link="/onboard/workers-view"
                style="h-12"
              />
            </main>
          </div>
        </div>
        <PageIndicator currentPage={2} totalPages={3} />
      </div>
    </div>
  );
};

export default onboard;
