import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { usePaymentStatus, formatCurrency } from '../../lib/hooks/usePayments';
import PaymentStatusBadge, { PaymentStatus } from '../../components/PaymentStatusBadge';

/**
 * Payment Status Screen
 * 
 * Displays payment status with polling:
 * - Payment status badge (pending/completed/failed/verifying)
 * - Job details
 * - Payment details (amount, method, date)
 * - Status timeline
 * - Auto-refresh every 5 seconds if pending/verifying
 * 
 * Route params: jobId, status, method
 */

export default function PaymentStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string; status?: string; method?: string }>();
  
  const jobId = parseInt(params.jobId);
  const initialStatus = (params.status as PaymentStatus) || 'pending';
  const paymentMethod = params.method || 'unknown';

  const { data: paymentData, isLoading, refetch } = usePaymentStatus(jobId);

  // Auto-refresh for pending/verifying payments
  useEffect(() => {
    if (paymentData?.status === 'pending' || paymentData?.status === 'verifying') {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentData?.status, refetch]);

  const status = (paymentData?.status as PaymentStatus) || initialStatus;

  const handleViewJob = () => {
    router.push(`/jobs/${jobId}` as any);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/');
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Your payment is being processed. This usually takes a few minutes.';
      case 'verifying':
        return 'Your cash proof is being verified by our admin team. This may take 24-48 hours.';
      case 'completed':
        return 'Your payment has been confirmed! The job is now active.';
      case 'failed':
        return 'Your payment could not be processed. Please try again or contact support.';
      case 'refunded':
        return 'Your payment has been refunded to your account.';
      default:
        return 'Payment status unknown.';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'verifying':
        return 'search-outline';
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'refunded':
        return 'arrow-undo-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'failed':
        return Colors.error;
      case 'verifying':
        return Colors.primary;
      default:
        return Colors.warning;
    }
  };

  if (isLoading && !paymentData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Icon */}
        <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons name={getStatusIcon() as any} size={80} color={getStatusColor()} />
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadgeContainer}>
          <PaymentStatusBadge status={status} size="large" />
        </View>

        {/* Status Message */}
        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

        {/* Payment Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(paymentData?.amount || 0)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {paymentData?.payment_method || paymentMethod}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValueMono}>
              {paymentData?.transaction_id || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {paymentData?.created_at 
                ? new Date(paymentData.created_at).toLocaleString()
                : 'Just now'
              }
            </Text>
          </View>
        </View>

        {/* Job Details Card */}
        {paymentData?.job && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Job Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Job Title</Text>
              <Text style={styles.detailValue}>{paymentData.job.title}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(paymentData.job.budget)}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.viewJobButton}
              onPress={handleViewJob}
            >
              <Text style={styles.viewJobButtonText}>View Job Details</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Timeline</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Payment Initiated</Text>
                <Text style={styles.timelineDate}>
                  {paymentData?.created_at 
                    ? new Date(paymentData.created_at).toLocaleString()
                    : 'Just now'
                  }
                </Text>
              </View>
            </View>

            {(status === 'verifying' || status === 'completed' || status === 'refunded') && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Verification Started</Text>
                  <Text style={styles.timelineDate}>
                    {paymentData?.updated_at 
                      ? new Date(paymentData.updated_at).toLocaleString()
                      : 'In progress'
                    }
                  </Text>
                </View>
              </View>
            )}

            {status === 'completed' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Payment Confirmed</Text>
                  <Text style={styles.timelineDate}>
                    {paymentData?.completed_at 
                      ? new Date(paymentData.completed_at).toLocaleString()
                      : 'Completed'
                    }
                  </Text>
                </View>
              </View>
            )}

            {status === 'failed' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotFailed]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Payment Failed</Text>
                  <Text style={styles.timelineDate}>
                    {paymentData?.updated_at 
                      ? new Date(paymentData.updated_at).toLocaleString()
                      : 'Just now'
                    }
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {status === 'completed' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewJob}
          >
            <Text style={styles.primaryButtonText}>View Job</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {status === 'failed' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
            <Ionicons name="refresh" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statusBadgeContainer: {
    marginBottom: Spacing.md,
  },
  statusMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
  detailValueMono: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
  viewJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  viewJobButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold as any,
  },
  timeline: {
    paddingLeft: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: Spacing.md,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  timelineDotCompleted: {
    backgroundColor: Colors.success,
  },
  timelineDotFailed: {
    backgroundColor: Colors.error,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  secondaryButton: {
    width: '100%',
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
});
