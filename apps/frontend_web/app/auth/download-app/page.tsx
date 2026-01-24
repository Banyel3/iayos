"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/form_button";

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="iAyos"
              width={140}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Download the Mobile App
              </h1>
              <p className="text-gray-600">
                Workers and Clients must use our mobile app to register and access iAyos.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-sm text-center px-4">
                    QR Code
                    <br />
                    Scan to Download
                  </p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <a
              href="https://play.google.com/store/apps/details?id=com.iayos"
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-4"
            >
              <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download on Google Play
              </Button>
            </a>

            <p className="text-center text-sm text-gray-500">
              Coming soon to iOS App Store
            </p>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
