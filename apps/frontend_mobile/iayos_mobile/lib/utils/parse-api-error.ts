/**
 * Utility functions for parsing API errors and displaying user-friendly messages.
 * React Native version - uses Alert.alert for displaying errors.
 *
 * Backend returns errors in various formats:
 * - { error: "message" }
 * - { message: "detailed explanation" }
 * - { error: "short", message: "detailed" }
 * - { error: ["validation error 1", "validation error 2"] }
 * - { detail: "Django Ninja validation error" }
 *
 * This utility standardizes error extraction across the mobile app.
 */

import { Alert } from "react-native";

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
    return extractErrorMessage(data as Record<string, unknown>, response.status, response.statusText);
  } catch {
    // JSON parsing failed - return HTTP status
    return `${response.status} ${response.statusText}`;
  }
}

/**
 * Parse error from a Response object and throw as Error.
 * Use this to convert API errors into thrown Errors with proper messages.
 *
 * @param response - The fetch Response object
 * @throws Error with the parsed message
 */
export async function throwApiError(response: Response): Promise<never> {
  const message = await parseApiError(response);
  throw new Error(message);
}

/**
 * Extract error message from an error object or Error instance.
 * Use this in catch blocks or React Query onError handlers.
 *
 * @param error - The caught error (Error instance, string, or object)
 * @param fallback - Fallback message if error cannot be parsed
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
  statusText?: string
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
 * Show error in an Alert dialog.
 * Extracts the message from various error types automatically.
 *
 * @param error - The caught error
 * @param title - Alert title (default: "Error")
 * @param fallback - Fallback message if error cannot be parsed
 */
export function showError(
  error: unknown,
  title: string = "Error",
  fallback?: string
): void {
  const message = getErrorMessage(error, fallback);
  Alert.alert(title, message);
}

/**
 * Log error to console with context and return the message.
 * Useful for debugging while also getting the user-facing message.
 *
 * @param context - Context string (e.g., "submitReview", "fetchJobs")
 * @param error - The caught error
 * @param fallback - Fallback message
 * @returns The extracted error message
 */
export function logAndGetError(
  context: string,
  error: unknown,
  fallback?: string
): string {
  const message = getErrorMessage(error, fallback);
  console.error(`[${context}] Error:`, error);
  console.error(`[${context}] Message:`, message);
  return message;
}
