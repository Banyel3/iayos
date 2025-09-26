"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
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
import { EmailVerificationAlert } from "@/components/ui/email-verification-alert";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthToast } from "@/components/ui/toast";
import { sendEmail } from "@/lib/email";
import { generateVerificationEmailHTML } from "@/components/auth/verification/verification_email";

const formSchema = z.object({
  lastName: z
    .string()
    .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

  firstName: z
    .string()
    .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

  contactNum: z.string().max(11, "Invalid Mobile Number"),

  email: z.string().email("Invalid email address"),

  birthDate: z
    .string()
    .min(1, "Date of birth is required")
    .refine((dateStr) => {
      const birthDate = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Check if birthday has occurred this year
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        return age - 1 >= 18;
      }
      return age >= 18;
    }, "You must be at least 18 years old to register"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  // turnstileToken: z.string().min(1, "Captcha required"), // ✅ add this
});

// Create a separate component that uses useSearchParams
function RegisterContent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenOnboard", "true");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      email: "",
      contactNum: "",
      birthDate: "",
      password: "",
    },
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { showAuthError } = useAuthToast();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          contactNum: parseInt(values.contactNum),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.[0]?.message || "Registration failed");
      } else {
        // ✅ Registration success → show email verification alert
        setUserEmail(values.email);
        setShowEmailAlert(true);
        // Clear any existing errors
        setError("");
        const verify = await fetch("/api/auth/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            verifyLink: data.verifyLink,
            verifyLinkExpire: data.verifyLinkExpire,
          }),
        });
        if (!res.ok) {
          setError(data.error?.[0]?.message || "Registration failed");
        }
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setShowEmailAlert(false);
    // Navigate to onboard page after user acknowledges the email alert
    router.push("/onboard");
  };

  return (
    <>
      <EmailVerificationAlert
        isVisible={showEmailAlert}
        onClose={handleCloseAlert}
        email={userEmail}
      />

      {/* Desktop Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">iAyos</div>
          <Link
            href="/auth/register/agency"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Looking for contracts for your agency? Register here
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout */}
        <div className="lg:hidden flex justify-center items-center min-h-screen max-h-screen overflow-hidden p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h1 className="font-inter text-xl font-semibold text-gray-900 mb-1">
                Create account
              </h1>
              <p className="font-inter text-sm text-gray-600">
                Get started today
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        First Name<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Last Name<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />
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
                          placeholder="Email address"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Phone<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contact number"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Date of Birth
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11" {...field} />
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
                          placeholder="Create password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 font-inter font-medium mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="flex items-center w-full my-4">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs font-inter text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={async () => {
                try {
                  const result = await signIn("google", {
                    redirect: false,
                  });

                  if (result?.error) {
                    showAuthError(
                      "We couldn't sign you up with Google. Please try again or use email registration.",
                      "Google Sign-Up Error"
                    );
                  } else if (result?.ok) {
                    router.push("/dashboard");
                  }
                } catch (error) {
                  showAuthError(
                    "Unable to connect to Google. Please check your internet connection and try again.",
                    "Connection Error"
                  );
                }
              }}
              disabled={isLoading}
              className="flex items-center justify-center w-full h-11 border border-gray-200 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm font-inter font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image
                src="/google-logo.svg"
                alt="Google logo"
                width={18}
                height={18}
                className="mr-2"
              />
              <span className="text-sm">Continue with Google</span>
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs font-inter text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen pt-20">
          {/* Left Side - Branding/Image */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8">
            <div className="max-w-md text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Join iAyos</h1>
              <p className="text-xl mb-8 opacity-90">
                Connect with skilled professionals or find your next opportunity
              </p>
              <div className="space-y-4">
                {/* Freelancer benefits */}
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Find verified professionals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Secure payments & reviews</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Available 24/7 support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* Freelancer Registration Form */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Create your account
                </h2>
                <p className="text-gray-600">
                  Join thousands of users already on iAyos
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Name Fields Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            First Name
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First name"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Last Name
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Last name"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-inter text-sm font-medium text-gray-700">
                          Email Address
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-inter text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Contact and Birth Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactNum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Phone Number
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contact number"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Date of Birth
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            placeholder="Create a strong password"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-inter text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 font-inter font-medium text-base"
                    disabled={isLoading}
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
                        Creating Account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>

              {/* Desktop Divider */}
              <div className="flex items-center w-full my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm font-inter text-gray-500">
                  or continue with
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Desktop Google Sign In */}
              <button
                onClick={async () => {
                  try {
                    const result = await signIn("google", {
                      redirect: false,
                    });

                    if (result?.error) {
                      showAuthError(
                        "We couldn't sign you up with Google. Please try again or use email registration.",
                        "Google Sign-Up Error"
                      );
                    } else if (result?.ok) {
                      router.push("/dashboard");
                    }
                  } catch (error) {
                    showAuthError(
                      "Unable to connect to Google. Please check your internet connection and try again.",
                      "Connection Error"
                    );
                  }
                }}
                disabled={isLoading}
                className="flex items-center justify-center w-full h-12 border border-gray-300 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 shadow-sm font-inter font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google logo"
                  width={20}
                  height={20}
                  className="mr-3"
                />
                <span>Continue with Google</span>
              </button>

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main component that wraps with Suspense
const Register = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
};

export default Register;
