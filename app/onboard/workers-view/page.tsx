"use client";
import React, { useState, useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
const TempWorkers = () => {
  const router = useRouter();

  // Add swipe gesture for back navigation with smooth animations
  const { translateX, isTransitioning } = useSwipeGesture({
    onSwipeRight: () => {
      router.push("/onboard/page");
    },
  });

  useEffect(() => {
    const hasSeenOnboard = localStorage.getItem("hasSeenOnboard");

    if (hasSeenOnboard) {
      // Already visited before → go to login
      router.replace("/auth/login");
    }
  }, [router]);
  interface Worker {
    profileID: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    rating: number;
    location: string;
    profileImg?: string;
    hourlyRate?: number;
  }
  const [results, setResults] = useState<Worker[]>([]);

  useEffect(() => {
    async function fetchAllWorkers() {
      const res = await fetch(`/api/all-workers`);
      const data = await res.json();
      setResults(data.results || []);
      console.log(data.results);
    }
    fetchAllWorkers();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="w-[390px] min-h-screen flex flex-col justify-between transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: isTransitioning ? 0.8 : 1,
        }}
      >
        <div className="flex flex-col text-center w-full flex-1 justify-center">
          <p>Explore your fellow freelancers</p>
          <div className="relative w-full mt-4"></div>
          <br />
          <br />
          {results && results.length > 0 ? (
            <div className="flex flex-col justify-center gap-2">
              <div className="flex justify-center gap-2">
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker1.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Batumbakal</p>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={"/worker2.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Montefalco</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker3.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Paul</p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {results.map((worker) => (
                  <div
                    key={worker.profileID}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={worker.profileImg}
                      alt={worker.profile.firstName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <p className="text-sm">
                      {worker.profile.firstName} {worker.profile.lastName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker1.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Doe</p>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={"/worker2.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Doe</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker3.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm">John Doe</p>
                </div>
              </div>
            </>
          )}
          <br />
          <br />
          <ButtonComp
            label="Create your account and be part of the worker community."
            variant="black"
            link={`/auth/register?type=worker`}
          ></ButtonComp>
        </div>
        <PageIndicator currentPage={3} totalPages={3} />
      </div>
    </div>
  );
};

export default TempWorkers;
