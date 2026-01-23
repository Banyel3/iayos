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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthToast } from "@/components/ui/toast";
import { Eye, EyeOff } from "lucide-react";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const formSchema = z
  .object({
    lastName: z
      .string()
      .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

    firstName: z
      .string()
      .regex(/^[A-Za-z]+$/, "Name must consist of only letters"),

    middleName: z
      .string()
      .regex(/^[A-Za-z]*$/, "Name must consist of only letters")
      .optional()
      .or(z.literal("")),

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
        "Password must contain at least one special character",
      ),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    // Address fields
    street_address: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    country: z.string().min(1, "Country is required"),
    postal_code: z.string().regex(/^\d{4}$/, "Postal code must be 4 digits"),
    // turnstileToken: z.string().min(1, "Captcha required"), // ✅ add this
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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
      middleName: "",
      email: "",
      contactNum: "",
      birthDate: "",
      password: "",
      confirmPassword: "",
      street_address: "",
      city: "",
      province: "",
      country: "Philippines",
      postal_code: "",
    },
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { showAuthError } = useAuthToast();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(""); // Clear previous errors
    try {
      // Prepare payload - remove confirmPassword and ensure middleName is always a string
      const { confirmPassword, ...formValues } = values;
      const payload = {
        ...formValues,
        middleName: formValues.middleName || "", // Ensure middleName is always a string
      };

      console.log("📤 Sending registration payload:", payload); // Debug log

      const res = await fetch("http://localhost:8000/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      console.log("📥 Response status:", res.status, "Data:", data); // Debug log

      if (!res.ok) {
        // Handle different error response formats
        const errorMessage =
          data.error?.[0]?.message ||
          data.message ||
          data.detail ||
          "Registration failed";
        setError(errorMessage);
        return;
      }

      // Success case
      setUserEmail(values.email);

      // Send OTP verification email (new flow)
      const otpEmailRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          otp_code: data.otp_code,
          expires_in_minutes: data.otp_expiry_minutes || 5,
        }),
      });

      if (!otpEmailRes.ok) {
        console.error("Failed to send OTP email");
        // Still redirect - user can request resend on OTP page
      }

      // Navigate to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection and try again.");
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
              <Image
                src="/logo.png"
                alt="iAyos"
                width={100}
                height={33}
                className="h-8 w-auto mx-auto mb-4"
              />
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
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Middle Name{" "}
                        <span className="text-gray-500 text-xs">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Middle name"
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
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create password"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onMouseDown={() => setShowPassword(true)}
                            onMouseUp={() => setShowPassword(false)}
                            onMouseLeave={() => setShowPassword(false)}
                            onTouchStart={() => setShowPassword(true)}
                            onTouchEnd={() => setShowPassword(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                            placeholder="Confirm password"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onMouseDown={() => setShowConfirmPassword(true)}
                            onMouseUp={() => setShowConfirmPassword(false)}
                            onMouseLeave={() => setShowConfirmPassword(false)}
                            onTouchStart={() => setShowConfirmPassword(true)}
                            onTouchEnd={() => setShowConfirmPassword(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Address Section */}
                <div className="pt-2">
                  <h3 className="font-inter text-sm font-semibold text-gray-900 mb-3">
                    Address Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Street Address
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="House no., Street name"
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        City<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Zamboanga City"
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
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Province<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Zamboanga del Sur"
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
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Country<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            value="Philippines"
                            className="h-11 bg-gray-50 cursor-not-allowed text-gray-700"
                            readOnly
                            tabIndex={-1}
                          />
                          <input type="hidden" {...field} value="Philippines" />
                        </div>
                      </FormControl>
                      <FormMessage className="font-inter text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-inter text-sm font-medium text-gray-700">
                        Postal Code<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 7000"
                          className="h-11"
                          maxLength={4}
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
                      "Google Sign-Up Error",
                    );
                  } else if (result?.ok) {
                    router.push("/dashboard");
                  }
                } catch (error) {
                  showAuthError(
                    "Unable to connect to Google. Please check your internet connection and try again.",
                    "Connection Error",
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
              <Image
                src="/logo-white.png"
                alt="iAyos"
                width={180}
                height={60}
                className="h-16 w-auto mx-auto mb-6"
              />
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
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Middle Name{" "}
                            <span className="text-gray-500 text-xs">
                              (Optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Middle name"
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              className="h-12 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onMouseDown={() => setShowPassword(true)}
                              onMouseUp={() => setShowPassword(false)}
                              onMouseLeave={() => setShowPassword(false)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    control={form.control}
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
                              onMouseDown={() => setShowConfirmPassword(true)}
                              onMouseUp={() => setShowConfirmPassword(false)}
                              onMouseLeave={() => setShowConfirmPassword(false)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

                  {/* Address Section */}
                  <div className="pt-4">
                    <h3 className="font-inter text-base font-semibold text-gray-900 mb-4">
                      Address Information
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="street_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-inter text-sm font-medium text-gray-700">
                          Street Address
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="House no., Street name, Barangay"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-inter text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* City and Province Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            City
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Zamboanga City"
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
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Province
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Zamboanga del Sur"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Country and Postal Code Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Country
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div>
                              <Input
                                value="Philippines"
                                className="h-12 bg-gray-50 cursor-not-allowed text-gray-700"
                                readOnly
                                tabIndex={-1}
                              />
                              <input
                                type="hidden"
                                {...field}
                                value="Philippines"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-inter text-sm font-medium text-gray-700">
                            Postal Code
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 7000"
                              className="h-12"
                              maxLength={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-inter text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

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
                        "Google Sign-Up Error",
                      );
                    } else if (result?.ok) {
                      router.push("/dashboard");
                    }
                  } catch (error) {
                    showAuthError(
                      "Unable to connect to Google. Please check your internet connection and try again.",
                      "Connection Error",
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
