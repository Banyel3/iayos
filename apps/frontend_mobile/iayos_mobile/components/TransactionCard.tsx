import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import PaymentStatusBadge, { PaymentStatus } from './PaymentStatusBadge';
import { formatCurrency } from '../lib/hooks/usePayments';

/**
 * TransactionCard Component
 * 
 * Displays a transaction history item:
 * - Transaction amount
 * - Payment method icon
 * - Job title
 * - Date & time
 * - Status badge
 * - Tap to view receipt
 */

interface Transaction {
  id: number;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  job?: {
    id: number;
    title: string;
  };
  transaction_id?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

const paymentMethodIcons: Record<string, string> = {
  gcash: 'wallet',
  wallet: 'card',
  cash: 'cash',
  xendit: 'wallet',
};

const paymentMethodColors: Record<string, string> = {
  gcash: '#007DFF',
  wallet: Colors.primary,
  cash: '#10B981',
  xendit: '#007DFF',
};

export default function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const methodIcon = paymentMethodIcons[transaction.payment_method.toLowerCase()] || 'card';
  const methodColor = paymentMethodColors[transaction.payment_method.toLowerCase()] || Colors.primary;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const isPositive = transaction.amount > 0;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: methodColor + '20' }]}>
        <Ionicons name={methodIcon as any} size={24} color={methodColor} />
      </View>

      {/* Center: Details */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {transaction.job?.title || 'Payment'}
          </Text>
          <Text style={[styles.amount, isPositive && styles.amountPositive]}>
            {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaContainer}>
            <Text style={styles.method}>
              {transaction.payment_method.toUpperCase()}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
          </View>
          <PaymentStatusBadge status={transaction.status} size="small" />
        </View>
      </View>

      {/* Right: Arrow */}
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  amount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  amountPositive: {
    color: Colors.success,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  method: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
