/**
 * Deep Link Handler
 * Handles navigation from push notification taps
 */

import { router } from 'expo-router';
import { Notification } from '@/lib/hooks/useNotifications';

export interface DeepLinkData {
  screen?: string;
  id?: string;
  params?: Record<string, any>;
}

/**
 * Handle deep link from notification tap
 */
export function handleNotificationDeepLink(notification: Notification) {
  const { notificationType, relatedJobID, relatedApplicationID, relatedKYCLogID } =
    notification;

  try {
    // Job-related notifications
    if (relatedJobID) {
      if (
        notificationType === 'JOB_STARTED' ||
        notificationType === 'JOB_COMPLETED_WORKER' ||
        notificationType === 'JOB_COMPLETED_CLIENT' ||
        notificationType === 'JOB_CANCELLED'
      ) {
        router.push(`/jobs/${relatedJobID}` as any);
        return;
      }

      // Payment notifications for jobs
      if (
        notificationType === 'PAYMENT_RECEIVED' ||
        notificationType === 'ESCROW_PAID' ||
        notificationType === 'REMAINING_PAYMENT_PAID' ||
        notificationType === 'PAYMENT_RELEASED'
      ) {
        router.push(`/payments/timeline/${relatedJobID}` as any);
        return;
      }
    }

    // Application-related notifications
    if (relatedApplicationID) {
      if (
        notificationType === 'APPLICATION_RECEIVED' ||
        notificationType === 'APPLICATION_ACCEPTED' ||
        notificationType === 'APPLICATION_REJECTED'
      ) {
        router.push(`/applications/${relatedApplicationID}` as any);
        return;
      }
    }

    // KYC notifications
    if (
      notificationType === 'KYC_APPROVED' ||
      notificationType === 'KYC_REJECTED' ||
      notificationType === 'AGENCY_KYC_APPROVED' ||
      notificationType === 'AGENCY_KYC_REJECTED'
    ) {
      router.push('/profile/kyc' as any);
      return;
    }

    // Message notifications
    if (notificationType === 'MESSAGE') {
      router.push('/(tabs)/messages' as any);
      return;
    }

    // Review notifications
    if (notificationType === 'REVIEW_RECEIVED') {
      router.push('/profile/reviews' as any);
      return;
    }

    // Payment notifications without job
    if (
      notificationType === 'PAYMENT_RECEIVED' ||
      notificationType === 'PAYMENT_RELEASED'
    ) {
      router.push('/payments/history' as any);
      return;
    }

    // Default: Navigate to notifications screen
    router.push('/notifications' as any);
  } catch (error) {
    console.error('Error handling deep link:', error);
    // Fallback to notifications screen
    router.push('/notifications' as any);
  }
}

/**
 * Parse deep link URL
 */
export function parseDeepLink(url: string): DeepLinkData | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return null;
    }

    const [screen, id] = pathSegments;
    const params: Record<string, any> = {};

    // Parse query parameters
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      screen,
      id,
      params: Object.keys(params).length > 0 ? params : undefined,
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Build deep link URL for notification
 */
export function buildDeepLink(notification: Notification): string {
  const { notificationType, relatedJobID, relatedApplicationID } = notification;

  const baseUrl = 'iayosmobile://';

  // Job-related
  if (relatedJobID) {
    if (
      notificationType.includes('PAYMENT') ||
      notificationType.includes('ESCROW')
    ) {
      return `${baseUrl}payments/timeline/${relatedJobID}`;
    }
    return `${baseUrl}jobs/${relatedJobID}`;
  }

  // Application-related
  if (relatedApplicationID) {
    return `${baseUrl}applications/${relatedApplicationID}`;
  }

  // Category-based
  if (notificationType.includes('KYC')) {
    return `${baseUrl}profile/kyc`;
  }

  if (notificationType === 'MESSAGE') {
    return `${baseUrl}messages`;
  }

  if (notificationType === 'REVIEW_RECEIVED') {
    return `${baseUrl}profile/reviews`;
  }

  // Default
  return `${baseUrl}notifications`;
}
