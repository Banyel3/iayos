import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useWalletDeposit, useWalletBalance, formatCurrency } from '../../lib/hooks/usePayments';
import WalletBalanceCard from '../../components/WalletBalanceCard';

/**
 * Wallet Deposit Screen
 * 
 * Allows users to deposit funds to wallet via Xendit:
 * - Enter deposit amount
 * - Create Xendit invoice
 * - Display WebView for payment
 * - Detect payment success/failure
 * - Update wallet balance
 * 
 * Route params: amount (optional)
 */

export default function WalletDepositScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();

  const [depositAmount, setDepositAmount] = useState(params.amount || '');
  const [xenditUrl, setXenditUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const depositMutation = useWalletDeposit();

  // Preset amounts
  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handlePresetAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
      return;
    }

    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum deposit amount is ₱100.');
      return;
    }

    if (amount > 100000) {
      Alert.alert('Maximum Amount', 'Maximum deposit amount is ₱100,000.');
      return;
    }

    try {
      setIsProcessing(true);

      const response = await depositMutation.mutateAsync({ amount });

      if (response.invoice_url) {
        setXenditUrl(response.invoice_url);
      } else {
        throw new Error('Failed to create payment invoice');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate deposit. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const url = navState.url;

    // Check for success callback
    if (url.includes('/payment/success') || url.includes('/callback/success')) {
      setIsProcessing(false);
      setXenditUrl(null);
      
      Alert.alert(
        'Deposit Successful',
        `₱${depositAmount} has been added to your wallet!`,
        [
          {
            text: 'OK',
            onPress: () => {
              refetchBalance();
              router.back();
            },
          },
        ]
      );
    }

    // Check for failure callback
    if (url.includes('/payment/failed') || url.includes('/callback/failed')) {
      setIsProcessing(false);
      setXenditUrl(null);
      
      Alert.alert(
        'Deposit Failed',
        'Your deposit could not be processed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    if (xenditUrl) {
      Alert.alert(
        'Cancel Deposit',
        'Are you sure you want to cancel this deposit?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => {
              setXenditUrl(null);
              setIsProcessing(false);
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // If WebView is active, show payment screen
  if (xenditUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <WebView
          source={{ uri: xenditUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <WalletBalanceCard 
          balance={walletBalance?.balance || 0}
          isLoading={!walletBalance}
          onRefresh={refetchBalance}
        />

        {/* Deposit Amount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <Text style={styles.sectionSubtitle}>Minimum ₱100, Maximum ₱100,000</Text>

          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <Text style={styles.amountInput}>{depositAmount || '0'}</Text>
          </View>

          {/* Preset Amounts */}
          <View style={styles.presetGrid}>
            {presetAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.presetButton,
                  depositAmount === amount.toString() && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetAmount(amount)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    depositAmount === amount.toString() && styles.presetButtonTextActive,
                  ]}
                >
                  ₱{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount Input */}
          <TouchableOpacity
            style={styles.customAmountButton}
            onPress={() => {
              Alert.prompt(
                'Enter Custom Amount',
                'Minimum ₱100, Maximum ₱100,000',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: (value) => {
                      if (value) {
                        const amount = parseFloat(value);
                        if (!isNaN(amount) && amount >= 100 && amount <= 100000) {
                          setDepositAmount(amount.toString());
                        } else {
                          Alert.alert('Invalid Amount', 'Please enter a valid amount between ₱100 and ₱100,000.');
                        }
                      }
                    },
                  },
                ],
                'plain-text',
                depositAmount
              );
            }}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.customAmountButtonText}>Enter Custom Amount</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>Payment Method</Text>
          </View>
          <Text style={styles.infoText}>
            You will be redirected to Xendit's secure payment page to complete your deposit via GCash, bank transfer, or other payment methods.
          </Text>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          style={[
            styles.depositButton,
            (!depositAmount || isProcessing) && styles.depositButtonDisabled,
          ]}
          onPress={handleDeposit}
          disabled={!depositAmount || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.depositButtonText}>
                Deposit {depositAmount ? formatCurrency(parseFloat(depositAmount)) : '₱0'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  presetButtonTextActive: {
    color: Colors.white,
  },
  customAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  customAmountButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold as any,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  depositButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  depositButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  depositButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold as any,
    color: Colors.white,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  webViewLoadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
