"use client";
import React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useState } from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useErrorModal } from "@/components/ui/error-modal";
import { PasswordResetAlert } from "@/components/ui/email-verification-alert";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const ForgotPassword = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const errorModal = useErrorModal();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      email: "",
    },
  });

  const handleCloseAlert = () => {
    setShowEmailAlert(false);
    // Navigate to onboard page after user acknowledges the email alert
    router.push("/onboard");
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      console.log("Forgot password request for:", values.email);
      if (!res.ok) {
        setError(data.error?.[0]?.message || "Registration failed");
        {
          error && <p className="text-red-500 text-sm mt-2">{error}</p>;
        }
      } else {
        // ✅ Registration success → show email verification alert
        setUserEmail(values.email);
        setShowEmailAlert(true);
        // Clear any existing errors
        setError("");
      }
    } catch (error) {
      // Placeholder error handling
      errorModal.showError(
        "We're having trouble processing your request. Please try again.",
        "Try Again",
        undefined,
        "Request Failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordResetAlert
        isVisible={showEmailAlert}
        onClose={handleCloseAlert}
        email={userEmail}
      />
      <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h1 className="font-inter text-xl font-semibold text-gray-900 mb-1">
              Forgot Your Password?
            </h1>
            <p className="font-inter text-sm text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-inter text-sm font-medium text-gray-700">
                      Email Address<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        className={`h-11 ${
                          form.formState.errors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-inter text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-inter font-medium mt-6"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </Form>

          {/* Info Section */}

          <div className="mt-6 text-center">
            <p className="text-xs font-inter text-gray-600">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <errorModal.Modal />
    </Suspense>
  );
};

export default ForgotPassword;
