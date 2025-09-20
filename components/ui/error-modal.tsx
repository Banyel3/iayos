"use client";
import React from "react";
import { Button } from "@/components/ui/form_button";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "warning" | "info";
  actionText?: string;
  onAction?: () => void;
  showCloseButton?: boolean;
}

/**
 * Reusable Error Modal Component
 *
 * This modal can be used throughout the application to display error messages
 * in a user-friendly way. It supports different error types and customizable actions.
 *
 * SECURITY NOTE: Only pass user-friendly error messages to this component.
 * Never expose raw database errors, stack traces, or technical details.
 *
 * Usage:
 * ```tsx
 * const [showError, setShowError] = useState(false);
 *
 * <ErrorModal
 *   isOpen={showError}
 *   onClose={() => setShowError(false)}
 *   title="Authentication Error"
 *   message="We&apos;re having trouble signing you in. Please try again."
 *   actionText="Try Again"
 *   onAction={() => { setShowError(false); retryAction(); }}
 * />
 * ```
 */
export function ErrorModal({
  isOpen,
  onClose,
  title = "Error",
  message,
  type = "error",
  actionText = "OK",
  onAction,
  showCloseButton = true,
}: ErrorModalProps) {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "warning":
        return {
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          ),
        };
      case "info":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      default: // error
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          ),
        };
    }
  };

  const { bgColor, textColor, icon } = getIconAndColors();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-10 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-center mb-4">
              <div
                className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mr-4`}
              >
                <svg
                  className={`w-6 h-6 ${textColor}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>

            {/* Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              {showCloseButton && onAction && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <Button onClick={handleAction} className="px-6">
                {actionText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook for using error modals throughout the application
 *
 * Usage:
 * ```tsx
 * const errorModal = useErrorModal();
 *
 * // Show an error
 * errorModal.showError("Database connection failed", "Try Again", () => retryConnection());
 *
 * // Show a warning
 * errorModal.showWarning("Session expired", "Login Again", () => router.push("/auth/login"));
 * ```
 */
export function useErrorModal() {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "info";
    actionText: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
    actionText: "OK",
  });

  const showError = (
    message: string,
    actionText: string = "OK",
    onAction?: () => void,
    title: string = "Error"
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: "error",
      actionText,
      onAction,
    });
  };

  const showWarning = (
    message: string,
    actionText: string = "OK",
    onAction?: () => void,
    title: string = "Warning"
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: "warning",
      actionText,
      onAction,
    });
  };

  const showInfo = (
    message: string,
    actionText: string = "OK",
    onAction?: () => void,
    title: string = "Information"
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: "info",
      actionText,
      onAction,
    });
  };

  const close = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const Modal = () => (
    <ErrorModal
      isOpen={modalState.isOpen}
      onClose={close}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      actionText={modalState.actionText}
      onAction={modalState.onAction}
    />
  );

  return {
    showError,
    showWarning,
    showInfo,
    close,
    Modal,
  };
}
