/**
 * Transaction Hooks - useTransactions
 *
 * Manages transaction history queries with pagination and filtering
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export type TransactionType = "all" | "deposit" | "payment" | "withdrawal";

export interface Transaction {
  id: number;
  type: "DEPOSIT" | "PAYMENT" | "WITHDRAWAL" | "REFUND";
  title: string;
  description: string;
  amount: number;
  created_at: string;
  status: "pending" | "completed" | "failed" | "verifying" | "refunded";
  payment_method: string;
  job?: {
    id: number;
    title: string;
  };
  transaction_id?: string;
}

interface TransactionsResponse {
  results: Transaction[];
  count: number;
  next_page?: number;
  has_next: boolean;
}

/**
 * Fetch transactions with infinite scroll and filtering
 */
export function useTransactions(type: TransactionType = "all") {
  return useInfiniteQuery<TransactionsResponse>({
    queryKey: ["transactions", type],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "20",
      });

      if (type !== "all") {
        params.append("type", type.toUpperCase());
      }

      const url = `${ENDPOINTS.WALLET_TRANSACTIONS}?${params.toString()}`;
      const response = await apiRequest(url);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.next_page ?? undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes (cacheTime)
  });
}

/**
 * Fetch single transaction details
 */
export function useTransaction(transactionId: number) {
  return useInfiniteQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      // TODO: Replace with actual transaction detail endpoint
      const response = await apiRequest(
        `${ENDPOINTS.WALLET_TRANSACTIONS}/${transactionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transaction details");
      }

      return response.json();
    },
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialPageParam: 1,
    getNextPageParam: () => undefined,
  });
}
