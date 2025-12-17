/**
 * Wallet Hooks - useWallet, useAddFunds, useWithdraw, usePendingEarnings
 *
 * Manages wallet balance queries and mutations including pending earnings (Due Balance)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

// Pending earnings item for individual job payments held in buffer
export interface PendingEarningItem {
  transaction_id: number;
  job_id: number;
  job_title: string;
  amount: number;
  release_date: string | null;
  release_date_formatted: string;
  days_until_release: number;
  held_reason: "BUFFER_PERIOD" | "BACKJOB_PENDING";
  has_active_backjob: boolean;
  created_at: string;
}

export interface WalletData {
  success: boolean;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  // Pending earnings (Due Balance) - held for 7-day buffer period
  pendingEarnings: number;
  pendingEarningsList: PendingEarningItem[];
  pendingEarningsCount: number;
  pending: number;
  this_month: number;
  total_earned: number;
  last_updated: string | null;
  currency: string;
  created: boolean;
}

export interface PendingEarningsResponse {
  success: boolean;
  pending_earnings: PendingEarningItem[];
  total_pending: number;
  count: number;
  buffer_days: number;
  info_message: string;
}

interface AddFundsPayload {
  amount: number;
  payment_method: "GCASH" | "WALLET";
}

interface WithdrawPayload {
  amount: number;
  payment_method_id: number;
  notes?: string;
}

/**
 * Fetch wallet balance and stats
 * Polls every 10 seconds to keep reserved balance up-to-date
 */
export function useWallet() {
  return useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: async (): Promise<WalletData> => {
      const response = await apiRequest(ENDPOINTS.WALLET_BALANCE);
      if (!response.ok) throw new Error("Failed to fetch wallet");
      return response.json() as Promise<WalletData>;
    },
    staleTime: 1000 * 5, // 5 seconds - data considered fresh
    gcTime: 1000 * 60 * 5, // 5 minutes (cacheTime)
    refetchInterval: 1000 * 10, // Poll every 10 seconds for reserved balance updates
    refetchIntervalInBackground: false, // Don't poll when app is in background
  });
}

/**
 * Add funds to wallet mutation
 */
export function useAddFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddFundsPayload) => {
      const response = await apiRequest(ENDPOINTS.WALLET_DEPOSIT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add funds");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate wallet and transaction queries
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Withdraw funds mutation
 */
export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WithdrawPayload) => {
      const response = await apiRequest(ENDPOINTS.WALLET_WITHDRAW, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to withdraw");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["pendingEarnings"] });
    },
  });
}

/**
 * Fetch detailed pending earnings (Due Balance) for workers
 * Shows payments held in 7-day buffer period
 */
export function usePendingEarnings() {
  return useQuery<PendingEarningsResponse>({
    queryKey: ["pendingEarnings"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WALLET_PENDING_EARNINGS);
      if (!response.ok) throw new Error("Failed to fetch pending earnings");
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
