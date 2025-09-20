"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const ClientDash = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <p>Loading...</p>; // optional loading state

  if (!session) {
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
        onClick={() => signOut({ callbackUrl: "/onboard" })}
        className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
      >
        Sign Out
      </button>
    </>
  );
};

export default ClientDash;
