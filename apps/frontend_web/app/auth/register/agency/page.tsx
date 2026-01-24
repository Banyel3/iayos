"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Agency registration form schema
const agencyFormSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  street_address: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(255, "Street address must be less than 255 characters"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be less than 100 characters"),
  province: z
    .string()
    .min(2, "Province must be at least 2 characters")
    .max(100, "Province must be less than 100 characters"),
  postal_code: z
    .string()
    .min(4, "Postal code must be at least 4 characters")
    .max(20, "Postal code must be less than 20 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const AgencyRegister = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Agency form
  const agencyForm = useForm<z.infer<typeof agencyFormSchema>>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      businessName: "",
      email: "",
      password: "",
      confirmPassword: "",
      street_address: "",
      city: "Zamboanga City",
      province: "Zamboanga del Sur",
      postal_code: "7000",
    },
  });

  const [agencyError, setAgencyError] = useState("");
  const [isAgencyLoading, setIsAgencyLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  // State for resend verification email functionality
  const [verificationData, setVerificationData] = useState<{
    email: string;
    verifyLink: string;
    verifyLinkExpire: string;
  } | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailSendError, setEmailSendError] = useState("");

  // Function to check actual rate limit status from backend
  const checkRateLimitStatus = async () => {
    try {
      console.log("Checking rate limit status...");
      const response = await fetch("/api/auth/check-rate-limit");

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers));

      // Check if response is ok and content-type is JSON
      if (!response.ok) {
        const text = await response.text();
        console.log("Error response body:", text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response body:", text);
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      console.log("Rate limit data:", data);

      if (data.isRateLimited) {
        setIsRateLimited(true);
        setRateLimitTime(data.remainingTime);

        // Sync localStorage with backend time
        const endTime = Date.now() + data.remainingTime * 1000;
        localStorage.setItem("registerRateLimitEndTime", endTime.toString());
      } else {
        setIsRateLimited(false);
        setRateLimitTime(0);
        localStorage.removeItem("registerRateLimitEndTime");
      }
    } catch (error) {
      console.error("Failed to check rate limit status:", error);
      // Fallback to localStorage check
      checkLocalStorageRateLimit();
    }
  };

  // Fallback function to check localStorage
  const checkLocalStorageRateLimit = () => {
    const rateLimitEndTime = localStorage.getItem("registerRateLimitEndTime");
    if (rateLimitEndTime) {
      const endTime = parseInt(rateLimitEndTime);
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      if (remaining > 0) {
        setIsRateLimited(true);
        setRateLimitTime(remaining);
      } else {
        localStorage.removeItem("registerRateLimitEndTime");
        setIsRateLimited(false);
        setRateLimitTime(0);
      }
    }
  };

  // Check rate limit status on component mount
  useEffect(() => {
    // First check backend, then localStorage as fallback
    checkRateLimitStatus();
  }, []);

  // Ensure readonly fields are properly initialized
  useEffect(() => {
    agencyForm.setValue("city", "Zamboanga City");
    agencyForm.setValue("province", "Zamboanga del Sur");
    agencyForm.setValue("postal_code", "7000");
  }, [agencyForm]);

  // Update rate limit timer every second
  useEffect(() => {
    if (!isRateLimited) return;

    const timer = setInterval(() => {
      setRateLimitTime((prev) => {
        const newTime = Math.max(0, prev - 1);

        if (newTime === 0) {
          setIsRateLimited(false);
          localStorage.removeItem("registerRateLimitEndTime");
          // Double-check with backend when timer reaches 0
          checkRateLimitStatus();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRateLimited]);

  // Handler to resend verification email
  const handleResendEmail = async () => {
    if (!verificationData) {
      setEmailSendError("Verification data not available. Please register again.");
      return;
    }

    setIsResendingEmail(true);
    setEmailSendError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationData.email,
          verifyLink: verificationData.verifyLink,
          verifyLinkExpire: verificationData.verifyLinkExpire,
        }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setEmailSendError("");
      } else {
        const data = await response.json().catch(() => ({}));
        setEmailSendError(
          data.error?.[0]?.message ||
            data?.message ||
            "Failed to resend verification email. Please try again."
        );
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      setEmailSendError("Network error. Please check your connection and try again.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Agency form submission handler
  const onAgencySubmit = async (values: z.infer<typeof agencyFormSchema>) => {
    // Ensure all fields have valid string values
    const submissionData = {
      businessName: values.businessName || "",
      email: values.email || "",
      password: values.password || "",
      street_address: values.street_address || "",
      city: values.city || "Zamboanga City",
      province: values.province || "Zamboanga del Sur",
      postal_code: values.postal_code || "7000",
    };

    console.log("Form submission data:", submissionData); // Debug log

    // Validate that all required fields are present
    if (
      !submissionData.businessName ||
      !submissionData.email ||
      !submissionData.password ||
      !submissionData.street_address
    ) {
      setAgencyError("Please fill in all required fields");
      return;
    }

    setIsAgencyLoading(true);
    setAgencyError(""); // Clear previous errors
    try {
      const agencyReg = await fetch(
        "http://localhost:8000/api/accounts/register/agency",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        }
      );

      console.log("API Response status:", agencyReg.status);
      console.log(
        "API Response headers:",
        Object.fromEntries(agencyReg.headers)
      );

      let data;
      try {
        data = await agencyReg.json();
        console.log("API Response data:", data);
      } catch (parseError) {
        console.error("Failed to parse API response as JSON:", parseError);
        setAgencyError("Server returned invalid response format");
        return;
      }

      if (!agencyReg.ok) {
        // Handle rate limiting with actual backend timing
        if (agencyReg.status === 429 && data.rateLimited) {
          const backendRemainingTime = data.remainingTime || 300;
          const endTime = Date.now() + backendRemainingTime * 1000;

          localStorage.setItem("registerRateLimitEndTime", endTime.toString());
          setIsRateLimited(true);
          setRateLimitTime(backendRemainingTime);
          setAgencyError(
            data.error ||
              "Too many registration attempts. Please wait before trying again."
          );
        } else {
          // Handle other error responses
          setAgencyError(data.error?.[0]?.message || "Registration failed");
        }
      } else {
        setIsRateLimited(false);
        setRateLimitTime(0);

        // Check if OTP response (new flow) or legacy verification link
        if (data?.otp_code && data?.email) {
          // New OTP flow: Send OTP email and redirect to verify-otp page
          try {
            const otpEmailResponse = await fetch("/api/auth/send-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.email,
                otp_code: data.otp_code,
              }),
            });

            if (!otpEmailResponse.ok) {
              console.error("Failed to send OTP email");
            }
          } catch (emailError) {
            console.error("Error sending OTP email:", emailError);
          }

          // Redirect to OTP verification page
          router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
          return;
        }

        // Legacy flow: Only call the send endpoint if the backend returned the expected
        // verification fields. Otherwise surface an error and avoid POSTing
        // undefined values which trigger zod validation errors in the API.
        if (!data?.email || !data?.verifyLink || !data?.verifyLinkExpire) {
          console.error(
            "Missing fields from agency registration response:",
            data
          );
          setAgencyError(
            `Registration succeeded but verification data is missing. Response: ${JSON.stringify(data)}`
          );
          return; // Don't proceed with verification email sending
        }

        // Store verification data for potential resend
        const verifyData = {
          email: data.email,
          verifyLink: data.verifyLink,
          verifyLinkExpire: data.verifyLinkExpire,
        };
        setVerificationData(verifyData);
        setRegisteredEmail(values.email);

        // Send verification email
        try {
          const verify = await fetch("/api/auth/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(verifyData),
          });

          if (verify.ok) {
            // Email sent successfully - show success state
            setRegistrationSuccess(true);
            setAgencyError("");
            setEmailSendError("");
          } else {
            const verifyResponseData = await verify.json().catch(() => ({}));
            const errorMessage =
              verifyResponseData.error?.[0]?.message ||
              verifyResponseData?.message ||
              "Failed to send verification email";
            
            // Registration succeeded but email failed - still show success but with warning
            setRegistrationSuccess(true);
            setAgencyError("");
            setEmailSendError(errorMessage);
          }
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
          // Registration succeeded but email failed - still show success but with warning
          setRegistrationSuccess(true);
          setAgencyError("");
          setEmailSendError("Failed to send verification email. Please use the resend button below.");
        }
      }
    } catch (err) {
      setAgencyError("Something went wrong. Try again.");
    } finally {
      setIsAgencyLoading(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.png" alt="iAyos" width={120} height={40} className="h-10 w-auto" />
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Freelancer Registration
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout - Desktop Only Message */}
        <div className="lg:hidden flex justify-center items-center min-h-screen p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="font-inter text-xl font-semibold text-gray-900 mb-2">
                Desktop Required
              </h1>
              <p className="font-inter text-sm text-gray-600 mb-6">
                Agency registration is only available on desktop devices for the
                best experience.
              </p>
              <p className="font-inter text-xs text-gray-500 mb-6">
                Please switch to a desktop or laptop computer to register your
                agency.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="block w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Freelancer Registration
              </Link>
              <Link
                href="/auth/login"
                className="block w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen pt-20">
          {/* Left Side - Branding/Image */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8">
            <div className="max-w-md text-center text-white">
              <Image src="/logo-white.png" alt="iAyos" width={180} height={60} className="h-16 w-auto mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4">
                Find Contracts for Your Agency
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Connect your agency with clients seeking professional services
              </p>
              <div className="space-y-4">
                {/* Agency benefits */}
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Access to diverse contract opportunities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Showcase your agency's capabilities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Secure project management tools</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Register Your Agency
                </h2>
                <p className="text-gray-600">
                  Find contract opportunities for your agency on iAyos
                </p>
              </div>

              {registrationSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Agency Registration Successful!
                  </h3>
                  <p className="text-green-700 mb-4">
                    {emailSendError ? (
                      <>Your account has been created for <strong>{registeredEmail}</strong></>
                    ) : (
                      <>We've sent a verification email to <strong>{registeredEmail}</strong></>
                    )}
                  </p>
                  
                  {/* Email status messages */}
                  {emailSendError && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <p className="text-yellow-700 text-sm mb-2">
                        ⚠️ {emailSendError}
                      </p>
                      <p className="text-yellow-600 text-xs">
                        Click the button below to resend the verification email.
                      </p>
                    </div>
                  )}

                  {resendSuccess && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-blue-700 text-sm">
                        ✓ Verification email sent successfully! Please check your inbox.
                      </p>
                    </div>
                  )}

                  <p className="text-green-600 text-sm mb-6">
                    Please check your email and click the verification link to
                    activate your agency account.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Resend Verification Email Button */}
                    {verificationData && (
                      <button
                        onClick={handleResendEmail}
                        disabled={isResendingEmail}
                        className="block w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResendingEmail ? (
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
                          "Resend Verification Email"
                        )}
                      </button>
                    )}
                    
                    <Link
                      href="/auth/login"
                      className="block w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Go to Login
                    </Link>
                    <button
                      onClick={() => {
                        setRegistrationSuccess(false);
                        setRegisteredEmail("");
                        setVerificationData(null);
                        setEmailSendError("");
                        setResendSuccess(false);
                        agencyForm.reset();
                      }}
                      className="block w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Register Another Agency
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Form {...agencyForm}>
                    <form
                      onSubmit={agencyForm.handleSubmit(onAgencySubmit)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {/* Left Column */}
                      <div className="space-y-6">
                        <FormField
                          control={agencyForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Business Name
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your business name"
                                  className="h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={agencyForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Business Email
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your business email"
                                  className="h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={agencyForm.control}
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
                                    placeholder="Create a strong password"
                                    className="h-12 pr-10"
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

                        <FormField
                          control={agencyForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Confirm Password
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    className="h-12 pr-10"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    {showConfirmPassword ? (
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

                        <FormField
                          control={agencyForm.control}
                          name="street_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Street Address
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your street address"
                                  className="h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <FormField
                          control={agencyForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                City
                                <span className="text-gray-500 ml-1">
                                  (Pre-filled)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Zamboanga City"
                                  className="h-12 bg-gray-50"
                                  readOnly
                                  value={field.value || "Zamboanga City"}
                                  onChange={field.onChange}
                                  name={field.name}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={agencyForm.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Province
                                <span className="text-gray-500 ml-1">
                                  (Pre-filled)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Zamboanga del Sur"
                                  className="h-12 bg-gray-50"
                                  readOnly
                                  value={field.value || "Zamboanga del Sur"}
                                  onChange={field.onChange}
                                  name={field.name}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={agencyForm.control}
                          name="postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-inter text-sm font-medium text-gray-700">
                                Postal Code
                                <span className="text-gray-500 ml-1">
                                  (Pre-filled)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="7000"
                                  className="h-12 bg-gray-50"
                                  readOnly
                                  value={field.value || "7000"}
                                  onChange={field.onChange}
                                  name={field.name}
                                />
                              </FormControl>
                              <FormMessage className="font-inter text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Full Width Elements */}
                      <div className="md:col-span-2">
                        {agencyError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
                            <p className="text-red-600 text-sm">
                              {agencyError}
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-12 font-inter font-medium text-base"
                          disabled={isAgencyLoading || isRateLimited}
                        >
                          {isRateLimited ? (
                            `Wait ${Math.floor(rateLimitTime / 60)}:${(
                              rateLimitTime % 60
                            )
                              .toString()
                              .padStart(2, "0")} before trying again`
                          ) : isAgencyLoading ? (
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
                              Creating Agency Account...
                            </span>
                          ) : (
                            "Register Agency"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <div className="mt-6 text-center">
                    <p className="text-sm font-inter text-gray-600">
                      Already have an account?{" "}
                      <Link
                        href="/auth/login"
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-inter text-gray-600">
                      Looking for freelancer registration?{" "}
                      <Link
                        href="/auth/register"
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Register here
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgencyRegister;
