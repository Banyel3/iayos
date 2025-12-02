import { API_BASE_URL } from "./config";

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
  const response = await fetch(`${API_BASE_URL}/accounts/wallet/transactions`, {
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
    throw new Error(data.error || "Failed to deposit funds");
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
    throw new Error(data.error || "Failed to request withdrawal");
  }

  return data;
}
