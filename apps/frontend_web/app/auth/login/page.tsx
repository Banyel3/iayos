"use client";

import React from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE } from "@/lib/api/config";

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
  const [showPassword, setShowPassword] = useState(false);
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
  // Use sessionStorage to track redirects and prevent loops
  useEffect(() => {
    const lastRedirect = sessionStorage.getItem("last_login_redirect");
    const now = Date.now();

    console.log("🔍 Login Page useEffect:", {
      authLoading,
      isAuthenticated,
      hasUser: !!user,
      accountType: user?.accountType,
      role: user?.role,
      lastRedirect: lastRedirect ? new Date(parseInt(lastRedirect)) : "none",
    });

    // Prevent redirect loops - if we redirected in the last 5 seconds, don't redirect again
    if (lastRedirect && now - parseInt(lastRedirect) < 5000) {
      console.log("⏸️ Login Page: Recently redirected, preventing loop");
      return;
    }

    if (!authLoading && isAuthenticated && user) {
      // Prefer backend accountType when available (more authoritative)
      const accountType = (user.accountType || "").toString().toLowerCase();
      const role = (user.role || "").toString().toUpperCase();

      // Mark that we're redirecting
      sessionStorage.setItem("last_login_redirect", now.toString());

      if (accountType === "agency") {
        console.log(
          "🏢 Login Page: Account type 'agency' detected, redirecting to agency dashboard",
        );
        router.replace("/agency/dashboard"); // Use replace instead of push
      } else if (role === "ADMIN") {
        console.log(
          "🔐 Login Page: Admin user detected, redirecting to admin panel",
        );
        router.replace("/admin/dashboard");
      } else {
        console.log("👤 Login Page: Regular user, redirecting to dashboard");
        router.replace("/dashboard");
      }
    } else if (!authLoading && isAuthenticated && !user) {
      console.log(
        "⚠️ Login Page: Authenticated but no user data - staying on login",
      );
    } else if (!authLoading && !isAuthenticated) {
      console.log("ℹ️ Login Page: Not authenticated - showing login form");
      // Clear redirect timestamp when showing login form
      sessionStorage.removeItem("last_login_redirect");
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
      // Redirect to Django Allauth Google OAuth
      window.location.href = `${API_BASE}/auth/google/login/`;
    } catch (error) {
      console.error("Google login error:", error);
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
      const userResponse = await fetch(`${API_BASE}/api/accounts/me`, {
        credentials: "include",
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();

        // Check if user is a worker or client - redirect to download app
        const backendRole = (userData.role || "").toString().toUpperCase();
        const accountType = (userData.accountType || "")
          .toString()
          .toLowerCase();

        // Workers and Clients must use mobile app
        if (backendRole === "WORKER" || backendRole === "CLIENT") {
          console.log(
            `⚠️ ${backendRole} login detected - redirecting to download app`,
          );
          // Logout immediately
          await fetch(`${API_BASE}/api/accounts/logout`, {
            method: "POST",
            credentials: "include",
          });
          router.replace("/auth/download-app");
          return;
        }

        // Agency users
        if (accountType === "agency") {
          console.log(
            "🏢 Account type 'agency' detected, redirecting to agency dashboard",
          );
          sessionStorage.setItem("last_login_redirect", Date.now().toString());
          router.replace("/agency/dashboard");
        }
        // Admin users
        else if (backendRole === "ADMIN") {
          console.log("🔐 Admin login, redirecting to admin panel");
          sessionStorage.setItem("last_login_redirect", Date.now().toString());
          router.replace("/admin/dashboard");
        }
        // Unknown role - should not happen
        else {
          console.log("⚠️ Unknown role, redirecting to download app");
          await fetch(`${API_BASE}/api/accounts/logout`, {
            method: "POST",
            credentials: "include",
          });
          router.replace("/auth/download-app");
        }
      } else {
        // Fallback to regular dashboard if can't fetch user data
        sessionStorage.setItem("last_login_redirect", Date.now().toString());
        router.replace("/dashboard");
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
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="iAyos"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <Link
                href="/auth/register/agency"
                className="px-4 py-2 text-sm font-bold bg-[#54B7EC] text-white hover:text-black hover:bg-blue-50 rounded-lg transition-colors"
              >
                Register as Agency
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
                  <Image
                    src="/logo.png"
                    alt="iAyos"
                    width={100}
                    height={33}
                    className="h-8 w-auto mx-auto mb-4"
                  />
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
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                className={`h-11 pr-10 ${
                                  form.formState.errors.password
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : ""
                                }`}
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
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
                  href={`${API_BASE}/api/accounts/auth/google/login`}
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
                    Looking to hire workers?{" "}
                    <Link
                      href="/auth/register/agency"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Register as Agency
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen pt-10">
              {/* Left Side - Branding */}
              <div className="lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md text-center text-white">
                  <Image
                    src="/fig1.png"
                    alt="iAyos"
                    width={180}
                    height={60}
                    className="h-50 w-auto mx-auto mb-6"
                  />
                  <h1 className="text-3xl font-bold mb-4 text-slate-900">
                    May Sira? May <span className="bg-gradient-to-r from-[#2E9AD5] to-[#B2AF57] bg-clip-text text-transparent">iAyos</span>
                  </h1>
                  <div className="space-y-4 text-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#54B7EC] bg-opacity-20 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Access your dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#54B7EC] bg-opacity-20 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Manage your projects</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#54B7EC] bg-opacity-20 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm">✓</span>
                      </div>
                      <span>Connect with professionals</span>
                    </div>
                  </div>
                  <div className="text-left space-y-4 mt-10">
                    {/* Worker/Client App Download */}
                    <div>
                      <p className="text-sm text-slate-900 mb-2">
                        <strong>
                          Looking to get something done or work as a freelance worker?
                        </strong>
                      </p>
                      {/* <p className="text-xs text-blue-700 mb-3">
                        Download our mobile app to get started
                      </p> */}
                      <Link href="/auth/download-app">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-[#54B7EC] text-white hover:bg-blue-50 p-7 font-bold text-lg"
                        >
                          ⬇ Download App
                        </Button>
                      </Link>
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
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  autoComplete="current-password"
                                  disabled={isLoading}
                                  className={`h-12 pr-10 ${
                                    form.formState.errors.password
                                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                      : ""
                                  }`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
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
                    href={`${API_BASE}/auth/google/login/`}
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
