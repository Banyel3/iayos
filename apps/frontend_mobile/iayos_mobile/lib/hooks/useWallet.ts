/**
 * Wallet Hooks - useWallet, useAddFunds, useWithdraw
 *
 * Manages wallet balance queries and mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export interface WalletData {
  success: boolean;
  balance: number;
  pending: number;
  this_month: number;
  total_earned: number;
  last_updated: string | null;
  currency: string;
  created: boolean;
}

interface AddFundsPayload {
  amount: number;
  payment_method: "GCASH" | "WALLET";
}

interface WithdrawPayload {
  amount: number;
  account_number: string;
  account_name: string;
}

/**
 * Fetch wallet balance and stats
 */
export function useWallet() {
  return useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WALLET_BALANCE);
      if (!response.ok) throw new Error("Failed to fetch wallet");
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (cacheTime)
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
      // TODO: Replace with actual withdraw endpoint when backend is ready
      const response = await apiRequest(
        `${ENDPOINTS.WALLET_BALANCE}/withdraw`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to withdraw");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
