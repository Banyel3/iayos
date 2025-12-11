"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/form_button";

interface ErrorDetails {
  title: string;
  message: string;
  suggestion: string;
  actionText: string;
  actionHref: string;
  isRateLimit?: boolean;
}

// Rate limit timer component
function RateLimitTimer({ onTimerEnd }: { onTimerEnd: () => void }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Check if there's a stored rate limit end time
    const rateLimitEndTime = localStorage.getItem("rateLimitEndTime");

    if (rateLimitEndTime) {
      const endTime = parseInt(rateLimitEndTime);
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      if (remaining > 0) {
        setTimeRemaining(remaining);
      } else {
        // Timer expired, clean up
        localStorage.removeItem("rateLimitEndTime");
        onTimerEnd();
        return;
      }
    } else {
      // Set new rate limit (5 minutes from now based on your rateLimiter config)
      const endTime = Date.now() + 300 * 1000; // 300 seconds = 5 minutes
      localStorage.setItem("rateLimitEndTime", endTime.toString());
      setTimeRemaining(300);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("rateLimitEndTime");
          onTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimerEnd]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (timeRemaining === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-700 font-mono">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-red-600">
            Time remaining until you can try again
          </div>
        </div>
      </div>
      <div className="w-full bg-red-200 rounded-full h-2">
        <div
          className="bg-red-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${((300 - timeRemaining) / 300) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [canRetry, setCanRetry] = useState(false);

  /**
   * Parse and categorize different types of authentication errors
   * Returns user-friendly error details based on the error type
   * SECURITY NOTE: Never expose raw database errors or technical details to users
   */
  const getErrorDetails = (errorString: string | null): ErrorDetails => {
    if (!errorString) {
      return {
        title: "Authentication Error",
        message: "We&apos;re having trouble signing you in right now.",
        suggestion: "Please try again in a moment.",
        actionText: "Try Again",
        actionHref: "/auth/login",
      };
    }

    // Convert to lowercase for pattern matching, but don't expose the raw error
    const decodedError = decodeURIComponent(errorString).toLowerCase();

    // Database connection errors
    if (
      decodedError.includes("database_url") ||
      decodedError.includes("environment variable not found")
    ) {
      return {
        title: "Service Temporarily Unavailable",
        message: "Our authentication service is currently experiencing issues.",
        suggestion:
          "Please try again in a few minutes. If the problem continues, contact our support team.",
        actionText: "Try Again",
        actionHref: "/auth/login",
      };
    }

    // ✅ ADD: Rate limiting detection
    if (
      decodedError.includes("too many") ||
      decodedError.includes("rate") ||
      decodedError.includes("attempts")
    ) {
      return {
        title: "Too Many Attempts",
        message:
          "You&apos;ve made too many login attempts. This is a security measure to protect your account.",
        suggestion:
          "Please wait for the timer to complete before trying again.",
        actionText: "Back to Login",
        actionHref: "/auth/login",
        isRateLimit: true,
      };
    }

    // Prisma/Database query errors
    if (
      decodedError.includes("prisma") ||
      decodedError.includes("invocation") ||
      decodedError.includes("query")
    ) {
      return {
        title: "Service Unavailable",
        message: "We&apos;re unable to process your request right now.",
        suggestion: "This is a temporary issue. Please try again shortly.",
        actionText: "Retry Login",
        actionHref: "/auth/login",
      };
    }

    // OAuth provider errors (Google, etc.)
    if (decodedError.includes("oauth") || decodedError.includes("callback")) {
      return {
        title: "Sign-In Issue",
        message: "We couldn&apos;t complete your sign-in request.",
        suggestion:
          "Try using email and password instead, or attempt the same method again.",
        actionText: "Back to Login",
        actionHref: "/auth/login",
      };
    }

    // Verification errors
    if (
      decodedError.includes("verify") ||
      decodedError.includes("verification")
    ) {
      return {
        title: "Email Verification Required",
        message:
          "Your email address needs to be verified before you can sign in.",
        suggestion:
          "Please check your email for a verification link, or request a new one.",
        actionText: "Verify Email",
        actionHref: "/auth/verify-email",
      };
    }

    // Network/timeout errors
    if (decodedError.includes("network") || decodedError.includes("timeout")) {
      return {
        title: "Connection Issue",
        message: "We&apos;re having trouble connecting to our servers.",
        suggestion: "Please check your internet connection and try again.",
        actionText: "Try Again",
        actionHref: "/auth/login",
      };
    }

    // Generic fallback for other errors - NO technical details exposed
    return {
      title: "Sign-In Error",
      message: "We encountered an issue while trying to sign you in.",
      suggestion:
        "Please try again. If this problem continues, contact our support team.",
      actionText: "Back to Login",
      actionHref: "/auth/login",
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="mx-8 my-15 w-[500px] min-h-[400px] flex flex-col items-center justify-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
          {errorDetails.title}
        </h1>

        {/* Rate Limit Timer */}
        {errorDetails.isRateLimit && (
          <RateLimitTimer onTimerEnd={() => setCanRetry(true)} />
        )}

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-4 leading-relaxed">
          {errorDetails.message}
        </p>

        {/* Suggestion */}
        <p className="text-sm text-gray-500 text-center mb-8 max-w-md">
          {errorDetails.suggestion}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button
            asChild
            className="flex-1"
            disabled={errorDetails.isRateLimit && !canRetry}
          >
            <Link href={errorDetails.actionHref}>
              {errorDetails.isRateLimit && !canRetry
                ? "Please Wait..."
                : errorDetails.actionText}
            </Link>
          </Button>

          <button
            onClick={() => window.history.back()}
            className="flex-1 px-4 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Still having trouble?{" "}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Contact Support
            </Link>
          </p>
        </div>

        {/* Technical Details - ONLY for developers in development mode with minimal info */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 w-full max-w-md">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Error ID (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700">
              Error Type: {error ? "AUTH_ERROR" : "UNKNOWN_ERROR"}
              <br />
              Timestamp: {new Date().toISOString()}
              <br />
              {/* DO NOT expose the actual error message for security */}
              Status: Error detected and categorized
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Main Error Page Component
 * Wrapped in Suspense to handle the useSearchParams hook
 */
export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
