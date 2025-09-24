"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const TempDashboard = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"WORKER" | "CLIENT" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Redirect logic for existing profileType
  useEffect(() => {
    if (
      session?.user?.profileType === "WORKER" ||
      session?.user?.profileType === "CLIENT"
    ) {
      router.replace("/dashboard/profile");
    }
  }, [session?.user?.profileType, router]);

  // Auto-redirect countdown for unauthorized users
  useEffect(() => {
    if (status !== "loading" && !session) {
      let countdown = 3; // change this number for seconds
      setRedirectCountdown(countdown);

      const interval = setInterval(() => {
        countdown -= 1;
        setRedirectCountdown(countdown);

        if (countdown <= 0) {
          clearInterval(interval);
          router.push("/auth/login");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        {/* Modal Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 relative">
            {/* Content */}
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 6.5c-.77.833-.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-inter">
                Access Denied
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-4 font-inter">
                You are not logged in. Redirecting to login page...
              </p>

              {/* Countdown */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-inter">
                  Redirecting in{" "}
                  <span className="font-bold text-blue-900">
                    {redirectCountdown}
                  </span>{" "}
                  second{redirectCountdown !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Manual redirect button */}
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 font-inter"
              >
                Go to Login Now
              </button>
            </div>
          </div>
        </div>

        {/* Background content (blurred) */}
        <div className="flex justify-center items-center min-h-screen bg-gray-50 blur-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    // Check if user email exists
    if (!session?.user?.email) {
      console.error("No email found in session:", session);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const values = {
        selectedType,
        email: session.user.email,
      };

      console.log("Sending request:", values);

      const res = await fetch("/api/auth/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Response Error:", errorData);
        throw new Error(errorData.error || "An Error Occurred");
      } else {
        console.log("Profile type assigned successfully");

        // Refresh the session to get the updated profileType
        console.log("Refreshing session...");
        await update();

        // The useEffect will automatically redirect once the session is updated
        console.log("Session refreshed, should redirect automatically");
      }
    } catch (error) {
      console.error("Error updating profile type:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-between">
        {/* Header Section */}
        <div className="flex flex-col justify-center flex-1 px-6">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-blue-600"
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
              )}
            </div>

            <h1 className="text-[28px] leading-[120%] font-[700] font-[Inter] text-black mb-2">
              Welcome, {session.user?.name?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-gray-600 text-base leading-[150%]">
              To get started, please choose how you&apos;ll be using iAyos
            </p>
          </div>

          {/* User Type Selection Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {/* Client Option */}
            <div
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                selectedType === "CLIENT"
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              onClick={() => setSelectedType("CLIENT")}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedType === "CLIENT"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedType === "CLIENT" && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
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
                    <h3 className="text-lg font-[600] font-[Inter] text-black">
                      I need services
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-[140%] ml-15">
                    Find skilled workers for your projects. Post jobs and hire
                    freelancers.
                  </p>
                </div>
              </div>
            </div>

            {/* Worker Option */}
            <div
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                selectedType === "WORKER"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              onClick={() => setSelectedType("WORKER")}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedType === "WORKER"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedType === "WORKER" && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                    <h3 className="text-lg font-[600] font-[Inter] text-black">
                      I provide services
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-[140%] ml-15">
                    Showcase your skills and find clients. Build your freelance
                    career.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedType || isSubmitting}
              className={`w-full py-4 rounded-xl font-[600] font-[Inter] text-white transition-all duration-200 ${
                selectedType && !isSubmitting
                  ? "bg-black hover:bg-gray-800 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up your account...</span>
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* User Info */}
          <div className="text-center text-sm text-gray-500 mb-4">
            Signed in as: {session.user?.email}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/onboard" })}
            className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const TempDashboardWrapper = () => <TempDashboard />;

export default TempDashboardWrapper;
