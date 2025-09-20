"use client";
import React from "react";
import { useErrorModal } from "@/components/ui/error-modal";
import { Button } from "@/components/ui/form_button";

/**
 * Error Testing Component
 *
 * This component provides buttons to test different types of error scenarios
 * that might occur in your authentication system. Use this to verify that
 * error handling is working correctly.
 *
 * To use this component, add it to any page:
 * ```tsx
 * import { ErrorTester } from "@/components/dev/error-tester";
 *
 * // Add this to your JSX
 * <ErrorTester />
 * ```
 */
export function ErrorTester() {
  const errorModal = useErrorModal();

  const testErrors = [
    {
      title: "Service Unavailable Error",
      message:
        "Our authentication service is currently experiencing issues. Please try again in a few minutes.",
      type: "error" as const,
    },
    {
      title: "Google Sign-In Error",
      message:
        "We couldn&apos;t sign you in with Google. Please try again or use email and password.",
      type: "error" as const,
    },
    {
      title: "Email Verification Required",
      message:
        "Your email address needs to be verified before you can sign in. Please check your email.",
      type: "warning" as const,
    },
    {
      title: "Connection Error",
      message:
        "We&apos;re having trouble connecting to our servers. Please check your internet connection and try again.",
      type: "error" as const,
    },
    {
      title: "Session Expired",
      message: "Your session has expired. Please sign in again to continue.",
      type: "info" as const,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Error Testing (Development Only)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Click these buttons to test different error scenarios and modals:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {testErrors.map((error, index) => (
          <Button
            key={index}
            onClick={() => {
              if (error.type === "error") {
                errorModal.showError(
                  error.message,
                  "Try Again",
                  undefined,
                  error.title
                );
              } else if (error.type === "warning") {
                errorModal.showWarning(
                  error.message,
                  "OK",
                  undefined,
                  error.title
                );
              } else {
                errorModal.showInfo(
                  error.message,
                  "Sign In",
                  undefined,
                  error.title
                );
              }
            }}
            className="text-left text-sm"
          >
            {error.title}
          </Button>
        ))}
      </div>

      {/* Error Modal */}
      <errorModal.Modal />
    </div>
  );
}

/**
 * How to test the error handling system:
 *
 * 1. **Service Unavailable Error (DATABASE_URL missing):**
 *    - Temporarily rename your .env file to .env.backup
 *    - Try to sign in with email/password
 *    - You should be redirected to /auth/error with a user-friendly message
 *    - Rename .env.backup back to .env to restore functionality
 *
 * 2. **Test different error scenarios:**
 *    - Use the buttons above to simulate various error types
 *    - Check that no technical details are exposed to users
 *    - Verify that error messages are helpful and actionable
 *
 * 3. **Security verification:**
 *    - All error messages should be user-friendly
 *    - No database connection strings, stack traces, or technical details
 *    - Error IDs and timestamps only visible in development mode
 */
