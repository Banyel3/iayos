"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";

// Extended User interface for agency page
interface AgencyUser extends User {
  firstName?: string;
  lastName?: string;
  profileType?: "WORKER" | "CLIENT" | null;
}

const WorkerDash = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as AgencyUser; // Type assertion for this page
  const router = useRouter();

  if (isLoading) return <p>Loading...</p>; // optional loading state

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">You are not logged in.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      {" "}
      <div>ClientDash</div>
      <button
        onClick={() => logout()}
        className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
      >
        Sign Out
      </button>
    </>
  );
};

export default WorkerDash;
