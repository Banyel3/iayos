"use client";
import React, { useEffect } from "react";
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
  // Authentication and user state are strictly derived from backend JWT validation via context
  // Do NOT use localStorage or any client-side fallback for authentication
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as AgencyUser;
  const router = useRouter();

  if (isLoading) return <p>Loading...</p>; // strictly loading from backend validation

  // Authentication check (strictly from backend JWT validation)
  if (!isAuthenticated || !user) {
    useEffect(() => {
      router.push("/auth/login");
    }, [router]);
    return null; // Will redirect
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
