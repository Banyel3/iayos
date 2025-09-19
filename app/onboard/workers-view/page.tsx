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
    <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
      <div
        className="w-full max-w-sm min-h-[90vh] flex flex-col justify-between transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: isTransitioning ? 0.8 : 1,
        }}
      >
        <div className="flex flex-col text-center w-full flex-1 justify-center px-2">
          <p className="font-inter mb-6">Explore your fellow freelancers</p>
          {results && results.length > 0 ? (
            <div className="flex flex-col justify-center gap-6 mb-8">
              <div className="grid grid-cols-3 gap-4 place-items-center">
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker1.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker1"
                  />
                  <p className="text-sm font-inter mt-2">John Batumbakal</p>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={"/worker2.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker2"
                  />
                  <p className="text-sm font-inter mt-2">John Montefalco</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker3.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker3"
                  />
                  <p className="text-sm font-inter mt-2">John Paul</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 place-items-center">
                {results.slice(0, 3).map((worker) => (
                  <div
                    key={worker.profileID}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={worker.profileImg ?? "/default-avatar.jpg"}
                      alt={worker.profile.firstName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <p className="text-sm font-inter mt-2">
                      {worker.profile.firstName} {worker.profile.lastName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 place-items-center mb-8">
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker1.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker1"
                  />
                  <p className="text-sm font-inter mt-2">John Doe</p>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={"/worker2.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker2"
                  />
                  <p className="text-sm font-inter mt-2">John Doe</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker3.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker3"
                  />
                  <p className="text-sm font-inter mt-2">John Doe</p>
                </div>
              </div>
            </>
          )}
          <ButtonComp
            label="Create your account and be part of the worker community."
            variant="black"
            link={`/auth/register?type=worker`}
          ></ButtonComp>
        </div>
        <div className="pb-8">
          <PageIndicator currentPage={3} totalPages={3} />
        </div>
      </div>
    </div>
  );
};

export default TempWorkers;
