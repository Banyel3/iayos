"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUserSession} from "@/lib/session";

// MOBILE FIRST ALWAYS
const WorkerView = () => {
  const router = useRouter();

  const { translateX, isTransitioning } = useSwipeGesture({
    onSwipeLeft: () => {
      router.push("/onboard/page");
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
            <header className="px-4 font-bold text-2xl font-[Fredoka]">
              iAyos
            </header>
            <header className="px-4 text-sm font-[Fredoka]">
              May sira? May iAyos.
            </header>
          </div>
          <div>
            <img src="/onboard_stockimg.svg" alt="" />
            <h1 className="p-4 text-[34px] leading-[100%] font-[700] font-[Inter] text-center">
              Find the right people for the job
            </h1>
            <p className="px-4 font-[Inter] text-lg text-center">
              Connect with skilled workers for all your <br />
              home service needs
            </p>
            <main className="p-4 text-black space-y-4">
              <ButtonComp
                label="Get Started"
                variant="primary"
                link="/onboard/page"
                style="h-15"
              />
            </main>
          </div>
        </div>
        <PageIndicator currentPage={1} totalPages={3} />
      </div>
    </div>
  );
};

export default WorkerView;
