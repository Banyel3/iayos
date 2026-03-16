import { API_BASE_URL } from "./config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

// Wallet types
export interface WalletBalance {
  balance: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  payment_method?: string;
  reference_id?: string;
  balance_after?: number;
  xendit_invoice_id?: string;
  xendit_external_id?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface WalletTransactionsPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface WalletTransactionsPaginatedResponse {
  transactions: Transaction[];
  pagination: WalletTransactionsPagination;
}

/**
 * Fetch wallet balance
 */
export async function fetchWalletBalance(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/accounts/wallet/balance`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch wallet balance");
    return 0;
  }

  const data = await response.json();
  return data.balance || 0;
}

/**
 * Fetch wallet transactions
 */
export async function fetchWalletTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/accounts/wallet/transactions?page=1&page_size=1000`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch transactions");
    return [];
  }

  const data = await response.json();
  return data.transactions || [];
}

export async function fetchWalletTransactionsPaginated(params?: {
  page?: number;
  pageSize?: number;
  transactionType?: string;
  status?: string;
}): Promise<WalletTransactionsPaginatedResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("page_size", String(params.pageSize));
  if (params?.transactionType && params.transactionType !== "all") {
    search.set("transaction_type", params.transactionType);
  }
  if (params?.status && params.status !== "all") {
    search.set("status", params.status);
  }

  const query = search.toString();
  const response = await fetch(
    `${API_BASE_URL}/accounts/wallet/transactions${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch paginated wallet transactions");
  }

  const data = await response.json();
  return {
    transactions: data.transactions || [],
    pagination: data.pagination || {
      page: 1,
      page_size: params?.pageSize || 50,
      total_items: (data.transactions || []).length,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}

/**
 * Deposit funds to wallet
 */
export async function depositToWallet(
  amount: number,
  paymentMethod: string = "GCASH"
): Promise<{
  success: boolean;
  payment_url?: string;
  new_balance?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/wallet/deposit`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      payment_method: paymentMethod,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to deposit funds"));
  }

  return data;
}

/**
 * Request withdrawal from wallet
 */
export async function requestWithdrawal(amount: number): Promise<{
  success: boolean;
  new_balance?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/payments/request-withdrawal`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to request withdrawal"));
  }

  return data;
}
