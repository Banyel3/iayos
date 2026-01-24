"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Smartphone, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/form_button";

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Information */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <Link href="/" className="mb-8 inline-block">
                <Image
                  src="/logo.png"
                  alt="iAyos"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
                  <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-semibold text-blue-700">
                    Mobile App Required
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Download the iAyos Mobile App
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Workers and Clients can only register and access iAyos through
                  our mobile app for the best experience.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Real-time Job Notifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      Get instant alerts for new jobs and messages
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      GPS Location Services
                    </h3>
                    <p className="text-sm text-gray-600">
                      Find jobs near you and share your location
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      In-App Messaging
                    </h3>
                    <p className="text-sm text-gray-600">
                      Chat directly with clients or workers
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Camera & Photo Upload
                    </h3>
                    <p className="text-sm text-gray-600">
                      Upload work photos and documents easily
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="space-y-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.iayos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-3">
                    <Download className="w-5 h-5" />
                    Download on Google Play
                  </Button>
                </a>

                <div className="text-center text-sm text-gray-500">
                  Coming soon to iOS App Store
                </div>
              </div>

              {/* Agency Registration Link */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Are you an agency looking to hire workers?
                </p>
                <Link href="/auth/register/agency">
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Register as Agency
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl" />

              <div className="relative text-center text-white">
                <Smartphone className="w-32 h-32 mx-auto mb-8 opacity-90" />
                <h2 className="text-2xl font-bold mb-4">
                  Join Thousands of Users
                </h2>
                <p className="text-blue-100 mb-8">
                  Download now and start connecting with skilled workers or find
                  your next job opportunity!
                </p>

                {/* QR Code Placeholder */}
                <div className="bg-white p-6 rounded-2xl inline-block">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 text-sm text-center px-4">
                      QR Code
                      <br />
                      (Scan to Download)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
