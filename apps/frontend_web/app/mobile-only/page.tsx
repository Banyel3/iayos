"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Smartphone,
  Monitor,
  ArrowRight,
  CheckCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Mobile-Only Page
 *
 * This page is shown when workers or clients try to access the web dashboard.
 * It explains that the platform is mobile-first and directs them to download the app.
 *
 * Agency and Admin users are redirected away from this page automatically.
 */

export default function MobileOnlyPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [profileType, setProfileType] = useState<string>("");

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if user should be here
      const accountType = ((user as any).accountType || "").toLowerCase();
      const role = ((user as any).role || "").toUpperCase();
      const userProfileType = (user as any).profile_data?.profileType || "";

      // Redirect agencies to their dashboard
      if (accountType === "agency" || role === "AGENCY") {
        router.replace("/agency/dashboard");
        return;
      }

      // Redirect admins to their dashboard
      if (role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      setProfileType(userProfileType);
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const handleSwitchToAgency = () => {
    // If user wants to access as agency, they need agency account
    router.push("/auth/register?type=agency");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const features = [
    "Browse and apply to jobs in your area",
    "Real-time notifications for new opportunities",
    "Secure in-app messaging with clients",
    "Track your earnings and job history",
    "Easy photo upload for work completion",
    "GPS-based job matching",
  ];

  const clientFeatures = [
    "Post jobs and find skilled workers",
    "Browse verified worker profiles",
    "Secure payment via GCash or wallet",
    "Real-time chat with workers",
    "Track job progress with photos",
    "Rate and review completed work",
  ];

  const displayFeatures = profileType === "CLIENT" ? clientFeatures : features;
  const userTypeLabel = profileType === "CLIENT" ? "Client" : "Worker";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">iA</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">iAyos</span>
        </div>

        {isAuthenticated && (
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            iAyos is Better on Mobile
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {profileType === "CLIENT"
              ? "For the best experience posting jobs and connecting with workers, please use our mobile app."
              : "For the best experience finding jobs and connecting with clients, please use our mobile app."}
          </p>

          {profileType && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700">
              <span className="text-sm">Logged in as:</span>
              <span className="font-semibold">{userTypeLabel}</span>
            </div>
          )}
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Mobile Card - Recommended */}
          <Card className="border-2 border-blue-500 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
              Recommended
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    Mobile App
                  </h3>
                  <p className="text-sm text-gray-500">Full feature access</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {displayFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full gap-2" size="lg">
                <Download className="w-5 h-5" />
                Download iAyos App
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Available on iOS and Android
              </p>
            </CardContent>
          </Card>

          {/* Web Card - Limited */}
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-700">
                    Web Browser
                  </h3>
                  <p className="text-sm text-gray-500">Limited access</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>
                    Web access for {userTypeLabel.toLowerCase()}s is currently
                    limited.
                  </strong>{" "}
                  For full functionality including job applications, messaging,
                  and payments, please use our mobile app.
                </p>
              </div>

              <div className="space-y-2 text-gray-500 text-sm">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center">
                    ✕
                  </span>
                  Cannot apply to or post jobs
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center">
                    ✕
                  </span>
                  No messaging features
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center">
                    ✕
                  </span>
                  No payment processing
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center">
                    ✕
                  </span>
                  Limited profile management
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agency Promotion */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🏢</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Running a Service Business?
                </h3>
                <p className="text-gray-600 mb-4">
                  Register as an Agency to get full web dashboard access. Manage
                  your team, track jobs, view analytics, and grow your business
                  - all from your browser.
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSwitchToAgency}
                >
                  Register as Agency
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Scan to download the app</p>
          <div className="inline-block p-4 bg-white rounded-xl shadow-md">
            {/* Placeholder for QR code - would need actual QR code image */}
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">QR Code</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Or search "iAyos" in the App Store or Google Play
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>© 2025 iAyos Platform. All rights reserved.</p>
        <p className="mt-2">
          Need help?{" "}
          <a
            href="mailto:support@iayos.com"
            className="text-blue-600 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </footer>
    </div>
  );
}
