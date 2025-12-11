"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
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
import { useSearchParams } from "next/navigation";

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don&apos;t match",
    path: ["confirmPassword"],
  });

const ForgotPasswordVerified = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationToken = searchParams.get("verifyToken") as string;
  const idParam = searchParams.get("id");

  useEffect(() => {
    if (!verificationToken || !idParam) {
      setAlertMessage(
        "Invalid verification link. Please request a new password reset."
      );
      setShowErrorAlert(true);

      // Redirect after showing error
      const timer = setTimeout(() => {
        router.replace("/auth/login");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [router, verificationToken, idParam]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleClick = async (values: z.infer<typeof formSchema>) => {
    if (!idParam) return;

    const accountID = parseInt(idParam, 10);
    setError("");
    setIsLoading(true);

    try {
      const verifyRes = await fetch(
        `http://127.0.0.1:8000/api/accounts/forgot-password/verify?verifyToken=${verificationToken}&id=${idParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
          credentials: "include",
        }
      );

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        setAlertMessage(
          errorData?.error?.[0]?.message || "Failed to update password"
        );
        setShowErrorAlert(true);
        return;
      }

      const data = await verifyRes.json();
      console.log("Password updated:", data);

      // Show success alert
      setShowSuccessAlert(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setAlertMessage("Something went wrong. Please try again.");
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Successfully Changed!
              </h3>
              <p className="text-gray-600 mb-4">
                Your password has been updated successfully. You can now login
                with your new password.
              </p>
              <button
                onClick={() => {
                  setShowSuccessAlert(false);
                  router.push("/auth/login");
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {showErrorAlert && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Reset Failed
              </h3>
              <p className="text-gray-600 mb-4">{alertMessage}</p>
              <button
                onClick={() => {
                  setShowErrorAlert(false);
                  setAlertMessage("");
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h3 className="font-inter text-xl font-semibold text-gray-900 mb-1">
              Reset Your Password
            </h3>
            <p className="font-inter text-sm text-gray-600">
              Enter your current password and choose a new one
            </p>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleClick)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      New Password<span className="text-red-600 ">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Confirm New Password
                      <span className="text-red-600 ">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating Password..." : "Update Password →"}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default function ForgotPasswordVerifiedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordVerified />
    </Suspense>
  );
}
