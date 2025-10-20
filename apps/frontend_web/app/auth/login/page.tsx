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
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    checkAuth,
    user,
  } = useAuth();
  const { showAuthError } = useAuthToast();

  // Initialize form hook at the top (before any returns)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleForgotPassword = () => {
    if (!isAuthenticated) {
      router.push("/auth/forgot-password");
    }
  };

  // Function to check actual rate limit status from backend
  const checkRateLimitStatus = async () => {
    try {
      const response = await fetch("/api/auth/check-rate-limit");

      // Check if response is ok and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

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

  // 🔥 FIX: Only redirect if we're SURE user is authenticated AND not loading
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Prefer backend accountType when available (more authoritative)
      const accountType = (user.accountType || "").toString().toLowerCase();
      const role = (user.role || "").toString().toUpperCase();
      console.log(
        "✅ User already authenticated, accountType:",
        accountType,
        "role:",
        role
      );

      if (accountType === "agency") {
        console.log(
          "🏢 Account type 'agency' detected, redirecting to agency dashboard"
        );
        router.replace("/agency/dashboard");
      } else if (role === "ADMIN") {
        console.log("🔐 Admin user detected, redirecting to admin panel");
        router.replace("/admin/dashboard");
      } else {
        console.log("👤 Regular user, redirecting to dashboard");
        router.replace("/dashboard/profile");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 🔥 FIX: Show loading only during initial auth check, not the form
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 🔥 FIX: Only show login form if NOT authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleGoogle = async () => {
    try {
      const googleLogin = await fetch(
        "http://localhost:8000/accounts/api/google/login"
      );
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Use the AuthContext login function which handles everything
      await login(values.email, values.password);
      console.log("✅ Login successful");
      localStorage.removeItem("rateLimitEndTime");
      setIsRateLimited(false);
      setRateLimitTime(0);

      // Fetch fresh user data to get the role
      const userResponse = await fetch(
        "http://localhost:8000/api/accounts/me",
        {
          credentials: "include",
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log("📋 User data:", userData);

        // Prefer authoritative accountType from backend (set in /me)
        const accountType = (userData.accountType || "")
          .toString()
          .toLowerCase();
        if (accountType === "agency") {
          console.log(
            "🏢 Account type 'agency' detected, redirecting to agency dashboard"
          );
          router.push("/agency/dashboard");
        } else {
          // Fallback to role-based redirect (role may be ADMIN)
          const backendRole = (userData.role || "").toString().toUpperCase();
          if (backendRole === "ADMIN") {
            console.log("🔐 Admin login, redirecting to admin panel");
            router.push("/admin/dashboard");
          } else {
            console.log("👤 User login, redirecting to dashboard");
            router.push("/dashboard/profile");
          }
        }
      } else {
        // Fallback to regular dashboard if can't fetch user data
        router.push("/dashboard/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      showAuthError(errorMessage, "Login Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isAuthenticated && (
        <>
          {/* Desktop Navigation Bar */}
          <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-900">iAyos</div>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="min-h-screen bg-gray-50">
            {/* Mobile Layout */}
            <div className="lg:hidden flex justify-center items-center min-h-screen max-h-screen overflow-hidden p-4">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-2xl">
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-8 w-8 text-blue-600"
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
                      <p className="mt-2 text-gray-700 font-inter text-sm">
                        Signing in...
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h1 className="font-inter text-xl font-semibold text-gray-900 mb-1">
                    Welcome back
                  </h1>
                  <p className="font-inter text-sm text-gray-600">
                    Sign in to continue
                  </p>
                </div>

                {/* Form */}
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

                {/* Google Sign In Button */}
                <a
                  href="http://localhost:8000/api/accounts/auth/google/login"
                  className="flex items-center justify-center w-full h-11 border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 transition-all duration-200 font-inter font-medium"
                >
                  <Image
                    src="/google-logo.svg"
                    alt="Google logo"
                    width={18}
                    height={18}
                    className="mr-2"
                  />
                  <span className="text-sm">Continue with Google</span>
                </a>

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

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen pt-20">
              {/* Left Side - Branding */}
              <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8">
                <div className="max-w-md text-center text-white">
                  <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
                  <p className="text-xl mb-8 opacity-90">
                    Sign in to your account and continue your journey
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Access your dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Manage your projects</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Connect with professionals</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-2xl">
                      <div className="flex flex-col items-center">
                        <svg
                          className="animate-spin h-8 w-8 text-blue-600"
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
                        <p className="mt-2 text-gray-700 font-inter text-sm">
                          Signing in...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Sign in to your account
                    </h2>
                    <p className="text-gray-600">
                      Welcome back! Please enter your details
                    </p>
                  </div>

                  {/* Form */}
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-6"
                    >
                      {/* Email */}
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
                                className={`h-12 ${
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
                      {/* Password */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-inter text-sm font-medium text-gray-700">
                              Password
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                className={`h-12 ${
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

                      {/* Forgot Password */}
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-sm font-inter text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        className="w-full h-12 font-inter font-medium mt-6"
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

                  {/* Google Sign In Button (Desktop) */}
                  <a
                    href="http://localhost:8000/api/accounts/auth/google/login"
                    className="flex items-center justify-center w-full h-12 border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 transition-all duration-200 font-inter font-medium"
                    aria-label="Continue with Google"
                  >
                    <Image
                      src="/google-logo.svg"
                      alt="Google logo"
                      width={18}
                      height={18}
                      className="mr-2"
                    />
                    <span className="text-sm">Continue with Google</span>
                  </a>

                  <div className="mt-6 text-center">
                    <p className="text-sm font-inter text-gray-600">
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
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Login;
