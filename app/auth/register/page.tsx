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
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";

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
});

// Create a separate component that uses useSearchParams
function RegisterContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const typeParam = searchParams.get("type")?.trim().toUpperCase() || null;
  const profileType =
    typeParam === "WORKER" || typeParam === "CLIENT" ? typeParam : null;

  if (!profileType) {
    redirect("/auth/select-type");
  }
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
  const router = useRouter();
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.[0]?.message || "Registration failed");
        {
          error && <p className="text-red-500 text-sm mt-2">{error}</p>;
        }
      } else {
        // ✅ Registration success → redirect to login
        router.push("/onboard");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="mx-8 my-15 w-[390px] min-h-screen flex flex-col items-center">
        <h3 className="font-[Inter] text-xl font-[400]">Create an account</h3>
        <br />
        <br />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Last Name<span className="text-red-600 ">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    First Name<span className="text-red-600 ">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contact Number
                    <span className="text-red-600 ">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contact Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Address<span className="text-red-600 ">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Email Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password<span className="text-red-600 ">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="self-center" disabled={isLoading}>
              {isLoading
                ? "creating account..."
                : "Create an account to hire now →"}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="flex items-center w-full my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center w-full border border-gray-300 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm"
        >
          <Image
            src="/google-logo.svg"
            alt="Google logo"
            width={18}
            height={18}
            className="mr-3"
          />
          <span className="text-gray-700 font-medium">Sign in with Google</span>
        </button>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
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
