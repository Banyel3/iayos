/**
 * Utility functions for parsing API errors and displaying user-friendly messages.
 *
 * Backend returns errors in various formats:
 * - { error: "message" }
 * - { message: "detailed explanation" }
 * - { error: "short", message: "detailed" }
 * - { error: ["validation error 1", "validation error 2"] }
 * - { detail: "Django Ninja validation error" }
 *
 * This utility standardizes error extraction across the frontend.
 */

/**
 * Parse error from a Response object.
 * Use this when you have access to the raw fetch Response.
 *
 * @param response - The fetch Response object
 * @returns A user-friendly error message string
 */
export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return extractErrorMessage(data, response.status, response.statusText);
  } catch {
    // JSON parsing failed - return HTTP status
    return `${response.status} ${response.statusText}`;
  }
}

/**
 * Extract error message from an error object or Error instance.
 * Use this in catch blocks or React Query onError handlers.
 *
 * @param error - The caught error (Error instance, string, or object)
 * @param fallback - Fallback message if error cannot be parsed (default: "An unexpected error occurred")
 * @returns A user-friendly error message string
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const defaultFallback =
    fallback || "An unexpected error occurred. Please try again.";

  if (!error) {
    return defaultFallback;
  }

  // Error instance (most common - from throw new Error())
  if (error instanceof Error) {
    return error.message || defaultFallback;
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Object with error/message fields (API response structure)
  if (typeof error === "object") {
    return extractErrorMessage(error as Record<string, unknown>);
  }

  return defaultFallback;
}

/**
 * Extract message from an error data object (parsed JSON response).
 * Handles various backend error formats.
 */
function extractErrorMessage(
  data: Record<string, unknown>,
  status?: number,
  statusText?: string,
): string {
  // Priority 1: message field (detailed explanation)
  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  // Priority 2: error field (main error)
  if (data.error) {
    // Handle array of errors (validation errors)
    if (Array.isArray(data.error)) {
      const messages = data.error
        .map((e) => {
          if (typeof e === "string") return e;
          if (typeof e === "object" && e !== null) {
            return (
              (e as Record<string, unknown>).message ||
              (e as Record<string, unknown>).msg ||
              JSON.stringify(e)
            );
          }
          return String(e);
        })
        .filter(Boolean);

      return messages.length > 0 ? messages.join("; ") : "Validation error";
    }

    // Handle string error
    if (typeof data.error === "string") {
      return data.error;
    }
  }

  // Priority 3: detail field (Django Ninja validation errors)
  if (typeof data.detail === "string" && data.detail) {
    return data.detail;
  }

  // Priority 4: details field
  if (typeof data.details === "string" && data.details) {
    return data.details;
  }

  // Fallback: HTTP status
  if (status) {
    return `Request failed with status ${status}${statusText ? ` (${statusText})` : ""}`;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Helper to show error in toast notification (web) or alert (mobile).
 * Import sonner's toast where this is used.
 *
 * Usage:
 * import { toast } from "sonner";
 * import { showError } from "@/lib/utils/parse-api-error";
 *
 * catch (error) {
 *   showError(error, toast, "Failed to update profile");
 * }
 */
export function showError(
  error: unknown,
  toastFn: { error: (msg: string) => void },
  fallback?: string,
): void {
  const message = getErrorMessage(error, fallback);
  toastFn.error(message);
}
