"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import Turnstile from "react-turnstile";

const formSchema = z.object({
  lastName: z
    .string()
    .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

  firstName: z
    .string()
    .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

  contactNum: z.string().max(11, "Invalid Mobile Number"),

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
  // turnstileToken: z.string().min(1, "Captcha required"), // ✅ add this
});

// Create a separate component that uses useSearchParams
function RegisterContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type")?.trim().toUpperCase() || null;
  const profileType =
    typeParam === "WORKER" || typeParam === "CLIENT" ? typeParam : null;

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
      password: "",
    },
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        profileType, // ✅ attach profile type from query param
      };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
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
      <div className="flex justify-center items-center min-h-screen max-h-screen overflow-hidden bg-gray-50 p-4">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {/* <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onVerify={(token) => form.setValue("turnstileToken", token)} // Save to form
              /> */}

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
            onClick={() => signIn("google")}
            className="flex items-center justify-center w-full h-11 border border-gray-200 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm font-inter font-medium text-gray-700"
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
