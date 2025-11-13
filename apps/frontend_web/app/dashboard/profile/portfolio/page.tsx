"use client";

import { ProfileCompletionCard } from "@/components/worker/ProfileCompletionCard";
import { PortfolioManager } from "@/components/worker/PortfolioManager";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function PortfolioContent() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-600">
        <a href="/dashboard" className="hover:text-gray-900">
          Dashboard
        </a>
        <span className="mx-2">/</span>
        <a href="/dashboard/profile" className="hover:text-gray-900">
          Profile
        </a>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Portfolio</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Work Portfolio
        </h1>
        <p className="text-gray-600">
          Showcase your best work and completed projects
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <PortfolioManager />
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <ProfileCompletionCard />
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
