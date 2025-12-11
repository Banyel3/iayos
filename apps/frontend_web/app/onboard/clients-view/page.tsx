"use client";
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { PageIndicator } from "@/components/ui/page-indicator";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { useRouter } from "next/navigation";
import img from "next/image";

const ClientView = () => {
  //re-routing logic
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

  const [Query, setQuery] = useState("");
  const debouncedQuery = useDebounce(Query, 500);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      handleSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

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

  const [hasSearched, setHasSearched] = useState(false);
  // Sets 500ms delay after keyboard stroke
  function useDebounce<T>(value: T, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }

  async function handleSearch(value: string) {
    if (value.length < 2) {
      setResults([]);
      return;
    }

    const res = await fetch(`/api/search?q=${value}`);
    const data = await res.json();
    setResults(data.results || []);
    setHasSearched(true);
  }

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
          <p className="font-inter mb-4">What help are you looking for?</p>
          <div className="relative w-full mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="bg-gray-100 border rounded-2xl w-full pl-10 pr-4 py-3 text-sm placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              type="search"
              name=""
              id=""
              placeholder="cleaner, seamstress, etc"
              value={Query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(Query)}
            />
          </div>
          {hasSearched && Query !== "" ? (
            <>
              <p className="font-inter mb-4">
                {results.length} results found under {Query}
              </p>

              <div className="flex justify-center gap-4 mb-8">
                {results.map((worker) => (
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
            </>
          ) : (
            <>
              <div className="flex justify-center gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker1.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker1"
                  />
                  <p className="text-sm font-inter mt-2">Carpenter</p>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={"/worker2.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker2"
                  />
                  <p className="text-sm font-inter mt-2">Plumber</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={"/worker3.jpg"}
                    className="w-16 h-16 rounded-full object-cover"
                    alt="worker3"
                  />
                  <p className="text-sm font-inter mt-2">Grass Cutterist</p>
                </div>
              </div>
            </>
          )}
          <ButtonComp
            label="Create an account to hire now"
            variant="black"
            link={`/auth/register?type=client`}
          ></ButtonComp>
        </div>
        <div className="pb-8">
          <PageIndicator currentPage={3} totalPages={3} />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
