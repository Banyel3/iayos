"use client";

import React, { useEffect, useState, Suspense } from "react";
import { API_BASE } from "@/lib/api/config";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleX, SquareCheckBig, Loader2, AlertTriangle } from "lucide-react";

const VerifyAgencyEmail = () => {
  const initialized = React.useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const verifyToken = searchParams.get("verifyToken");
  const id = searchParams.get("id");

  const verifyEmail = async () => {
    // Check if required parameters are present
    if (!verifyToken || !id) {
      setError(true);
      setErrorMessage("Invalid verification URL. Missing required parameters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/accounts/verify?verifyToken=${verifyToken}&accountID=${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setLoading(false);
        setVerified(true);
        // Redirect to agency dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = "/dashboard/agency";
        }, 3000);
      } else {
        setLoading(false);
        setError(true);
        setErrorMessage(
          data.error?.[0]?.message || "Email verification failed."
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setLoading(false);
      setError(true);
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    }
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      verifyEmail();
    }
  }, [verifyToken, id]); // only rerun if search params change

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "20vh" }}>
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">
            Verifying your agency email address...
          </h1>
          <p className="text-gray-500">
            Please wait while we verify your agency account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: "20vh" }}>
      <div className="w-full max-w-md mx-auto px-4">
        {verified && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <SquareCheckBig className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-green-800">
                Agency Email Verified Successfully!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Your agency email has been verified successfully. You will be
                redirected to your agency dashboard in a few seconds.
              </AlertDescription>
              <div className="mt-4">
                <a
                  href="/dashboard/agency"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
                >
                  Go to Agency Dashboard
                </a>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <CircleX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-red-800">
                Agency Email Verification Failed
              </AlertTitle>
              <AlertDescription className="text-red-700">
                {errorMessage ||
                  "Your verification token is invalid or expired."}
              </AlertDescription>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-red-600">
                  Need help? Try these options:
                </p>
                <div className="space-y-1">
                  <a
                    href="/auth/register/agency"
                    className="block text-sm text-red-600 hover:text-red-800 underline"
                  >
                    • Register your agency again to get a new verification email
                  </a>
                  <a
                    href="/auth/login"
                    className="block text-sm text-red-600 hover:text-red-800 underline"
                  >
                    • Try signing in if your agency is already verified
                  </a>
                </div>
              </div>
            </div>
          </Alert>
        )}

        {!verified && !error && (
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-yellow-800">
                Processing Agency Verification
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                We&apos;re currently processing your agency email verification.
                Please wait...
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default function AgencyEmailVerification() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyAgencyEmail />
    </Suspense>
  );
}
