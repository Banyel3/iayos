"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleX, SquareCheckBig, Loader2, AlertTriangle } from "lucide-react";

const VerifyEmail = () => {
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
        `/api/auth/verify-email?verifyToken=${verifyToken}&id=${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setLoading(false);
        setVerified(true);
      } else {
        setLoading(false);
        setError(true);
        setErrorMessage(data.error || "Email verification failed.");
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-700">
            Verifying your email address...
          </h1>
          <p className="text-gray-500">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-4">
        {verified && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <SquareCheckBig className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Email Verified Successfully!
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Your email has been verified successfully. You can now sign in to
              your account.
            </AlertDescription>
            <div className="mt-4">
              <a
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
              >
                Sign In Now
              </a>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <CircleX className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              Email Verification Failed
            </AlertTitle>
            <AlertDescription className="text-red-700">
              {errorMessage || "Your verification token is invalid or expired."}
            </AlertDescription>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-600">
                Need help? Try these options:
              </p>
              <div className="space-y-1">
                <a
                  href="/auth/register"
                  className="block text-sm text-red-600 hover:text-red-800 underline"
                >
                  • Register again to get a new verification email
                </a>
                <a
                  href="/auth/login"
                  className="block text-sm text-red-600 hover:text-red-800 underline"
                >
                  • Try signing in if you're already verified
                </a>
              </div>
            </div>
          </Alert>
        )}

        {!verified && !error && (
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              Processing Verification
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              We're currently processing your email verification. Please wait...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
