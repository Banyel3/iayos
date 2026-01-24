"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Regular user registration has been moved to the mobile app.
 * This page redirects workers and clients to download the app.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to download app page
    router.replace("/auth/download-app");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to mobile app download...</p>
      </div>
    </div>
  );
}
