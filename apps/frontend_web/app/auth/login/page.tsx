"use client";
import React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import Image from "next/image";
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
import { useAuth } from "@/context/AuthContext";
import { useAuthToast } from "@/components/ui/toast";
import { LoginFormData } from "@/types";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { showAuthError } = useAuthToast();

  const handleForgotPassword = () => {
    if (!isAuthenticated) {
      router.push("/auth/forgot-password");
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard"); // redirect if already logged in
    }
  }, [authLoading, isAuthenticated, router]);

  // Function to check actual rate limit status from backend
  const checkRateLimitStatus = async () => {
    try {
      const response = await fetch("/api/auth/check-rate-limit");
      const data = await response.json();

      if (data.isRateLimited) {
        setIsRateLimited(true);
        setRateLimitTime(data.remainingTime);

        // Sync localStorage with backend time
        const endTime = Date.now() + data.remainingTime * 1000;
        localStorage.setItem("rateLimitEndTime", endTime.toString());
      } else {
        setIsRateLimited(false);
        setRateLimitTime(0);
        localStorage.removeItem("rateLimitEndTime");
      }
    } catch (error) {
      console.error("Failed to check rate limit status:", error);
      // Fallback to localStorage check
      checkLocalStorageRateLimit();
    }
  };

  // Fallback function to check localStorage
  const checkLocalStorageRateLimit = () => {
    const rateLimitEndTime = localStorage.getItem("rateLimitEndTime");
    if (rateLimitEndTime) {
      const endTime = parseInt(rateLimitEndTime);
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      if (remaining > 0) {
        setIsRateLimited(true);
        setRateLimitTime(remaining);
      } else {
        localStorage.removeItem("rateLimitEndTime");
        setIsRateLimited(false);
        setRateLimitTime(0);
      }
    }
  };

  // Check for existing rate limit on component mount
  useEffect(() => {
    // First check backend, then localStorage as fallback
    checkRateLimitStatus();
  }, []);

  // Update rate limit timer every second
  useEffect(() => {
    if (!isRateLimited) return;

    const timer = setInterval(() => {
      setRateLimitTime((prev) => {
        const newTime = Math.max(0, prev - 1);

        if (newTime === 0) {
          setIsRateLimited(false);
          localStorage.removeItem("rateLimitEndTime");
          // Double-check with backend when timer reaches 0
          checkRateLimitStatus();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRateLimited]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenOnboard", "true");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (authLoading) return <p>Loading...</p>; // Show loading while checking auth status

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      setIsLoading(true);

      const res = await fetch("http://127.0.0.1:8000/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
        credentials: "include", // allows sending/receiving cookies
      });

      const data = await res.json();

      if (!res.ok) {
        // Extract backend error message
        const detail =
          data.detail ||
          "Unable to sign you in. Please check your credentials.";
        let userMessage = detail;
        let errorTitle = "Sign-In Failed";

        const lower = detail.toLowerCase();

        if (lower.includes("too many") || lower.includes("rate")) {
          // Rate limiting
          const actualRemainingTime = data.msBeforeNext
            ? Math.round(data.msBeforeNext / 1000)
            : 300;

          const endTime = Date.now() + actualRemainingTime * 1000;
          localStorage.setItem("rateLimitEndTime", endTime.toString());
          setIsRateLimited(true);
          setRateLimitTime(actualRemainingTime);

          userMessage =
            "Too many login attempts. Please wait before trying again.";
          errorTitle = "Too Many Attempts";
        } else if (lower.includes("user not found")) {
          userMessage = "No account found with this email address.";
          errorTitle = "Account Not Found";
        } else if (lower.includes("invalid password")) {
          userMessage = "The password you entered is incorrect.";
          errorTitle = "Incorrect Password";
        } else if (lower.includes("verify")) {
          userMessage = "Please verify your email address before signing in.";
          errorTitle = "Email Verification Required";
        }

        showAuthError(userMessage, errorTitle);
        return; // stop execution
      }

      // ✅ Success
      login(data.access, {
        accountID: data.accountID,
        email: data.email,
      });
      localStorage.removeItem("rateLimitEndTime");
      setIsRateLimited(false);
      setRateLimitTime(0);
      router.push("/dashboard");
    } catch (error) {
      // Network/unexpected errors
      console.error(error);
      showAuthError(
        "We're having trouble connecting. Please check your internet connection and try again.",
        "Connection Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isAuthenticated && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <h1 className="font-inter text-xl font-semibold text-gray-900 mb-1">
                  Welcome back
                </h1>
                <p className="font-inter text-sm text-gray-600">
                  Sign in to continue
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
                          Email<span className="text-red-500 ml-1">*</span>
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
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-inter text-sm font-medium text-gray-700">
                          Password<span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className={`h-11 ${
                              form.formState.errors.password
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

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-inter text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-inter font-medium mt-6"
                    disabled={
                      isLoading || !form.formState.isValid || isRateLimited
                    }
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
                        Signing in...
                      </span>
                    ) : isRateLimited ? (
                      <span className="flex items-center justify-center gap-1">
                        🕐 {Math.floor(rateLimitTime / 60)}:
                        {(rateLimitTime % 60).toString().padStart(2, "0")}
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="flex items-center w-full my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs font-inter text-gray-500">
                  or
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Google Sign In Button - Disabled for now */}
              <button
                disabled={true}
                className="flex items-center justify-center w-full h-11 border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 transition-all duration-200 shadow-sm font-inter font-medium text-gray-400 cursor-not-allowed"
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google logo"
                  width={18}
                  height={18}
                  className="mr-2 opacity-50"
                />
                <span className="text-sm">
                  Continue with Google (Coming Soon)
                </span>
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs font-inter text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Suspense>
      )}
    </>
  );
};

export default Login;
