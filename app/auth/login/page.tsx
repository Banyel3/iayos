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
import { signIn } from "next-auth/react";
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
import { useSession } from "next-auth/react";

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

function onSubmit(values: z.infer<typeof formSchema>) {
  console.log("Login values:", values);
  // Add your login logic here
  // Example: authenticate user, handle errors, etc.
}
const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard"); // redirect if already logged in
    }
  }, [status, session, router]);

  if (status === "loading") return <p>Loading...</p>; // optional

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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const res = await signIn("credentials", {
        redirect: true,
        email: values.email,
        password: values.password,
        callbackUrl: "/dashboard",
      });
      if (res?.error) {
        setLoginError(res.error); // show error from authorize function
      }
    } catch (error) {
      setLoginError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {status !== "authenticated" && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="flex justify-center items-center min-h-screen">
            <div className="mx-8 my-15 w-[390px] min-h-screen flex flex-col items-center">
              <h3 className="font-[Inter] text-xl font-[400]">
                Login to your account
              </h3>
              <br />
              <br />
              <Form {...form}>
                {loginError && (
                  <div
                    className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg"
                    role="alert"
                  >
                    {loginError}
                  </div>
                )}
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6 w-full"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address<span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className={`${
                              form.formState.errors.email
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                            {...field}
                          />
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
                          Password<span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className={`${
                              form.formState.errors.password
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="self-center w-full"
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
                        Signing in...
                      </span>
                    ) : (
                      "Login to your account →"
                    )}
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
                onClick={() => signIn("google", { callbackUrl: `/dashboard` })}
                disabled={isLoading}
                className={`flex items-center justify-center w-full border border-gray-300 rounded-lg px-4 py-3 bg-white transition-colors duration-200 shadow-sm ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google logo"
                  width={18}
                  height={18}
                  className="mr-3"
                />
                <span className="text-gray-700 font-medium">
                  Sign in with Google
                </span>
              </button>

              <div className="mt-6">
                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Register now
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
