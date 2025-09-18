"use client";

import React from "react";
import { CheckCircle, Mail, X } from "lucide-react";

interface EmailVerificationAlertProps {
  isVisible: boolean;
  onClose: () => void;
  email?: string;
}

export function EmailVerificationAlert({
  isVisible,
  onClose,
  email,
}: EmailVerificationAlertProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Success icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Account Created Successfully!
          </h3>

          {/* Email icon and message */}
          <div className="flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Check your email</span>
          </div>

          {/* Main message */}
          <p className="text-gray-600 mb-4 leading-relaxed">
            We've sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-gray-900">{email}</span>
            ) : (
              "your email address"
            )}
            . Please click the link to verify your account and complete the
            registration process.
          </p>

          {/* Additional info */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Don't forget to check your spam/junk folder
              if you don't see the email in your inbox.
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
          >
            Got it!
          </button>

          {/* Resend link */}
          <p className="text-xs text-gray-500 mt-3">
            Didn't receive the email?{" "}
            <button className="text-blue-600 hover:text-blue-700 underline">
              Resend verification email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
