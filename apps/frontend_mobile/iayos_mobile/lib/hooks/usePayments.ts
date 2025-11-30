import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson, apiRequest } from "../api/config";
import Toast from "react-native-toast-message";
import { useWallet } from "./useWallet";

// Types
export interface WalletBalance {
  success: boolean;
  balance: number;
  currency: string;
  pending: number;
  this_month: number;
  total_earned: number;
  last_updated: string | null;
  created: boolean;
}

export interface EscrowPayment {
  jobId: number;
  amount: number;
  paymentMethod: "gcash" | "wallet" | "cash";
  transactionId?: string;
}

export interface PaymentStatus {
  id: number;
  status: "pending" | "completed" | "failed" | "verifying";
  amount: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  jobId: number;
  jobTitle: string;
  xenditInvoiceUrl?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "deposit" | "withdrawal" | "payment" | "refund";
  status: "pending" | "completed" | "failed";
  description: string;
  createdAt: string;
  paymentMethod?: string;
}

export interface XenditInvoice {
  invoiceUrl: string;
  invoiceId: string;
  expiryDate: string;
  amount: number;
}

export interface WalletDepositResponse {
  success: boolean;
  payment_url?: string;
  invoice_url?: string;
  invoice_id?: string;
  transaction_id?: number;
  amount: number;
  new_balance: number;
  message?: string;
  error?: string;
}

export interface CashProofUpload {
  jobId: number;
  image: {
    uri: string;
    type: string;
    name: string;
  };
}

// Hook: Get wallet balance
export const useWalletBalance = () => {
  return useWallet();
};

// Hook: Create escrow payment
export const useCreateEscrowPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: EscrowPayment) => {
      return fetchJson<any>(ENDPOINTS.CREATE_ESCROW_PAYMENT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payment),
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });

      Toast.show({
        type: "success",
        text1: "Payment Initiated",
        text2: `${variables.paymentMethod.toUpperCase()} payment started successfully`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// Hook: Create Xendit invoice for GCash payment
export const useCreateXenditInvoice = () => {
  return useMutation({
    mutationFn: async (data: { jobId: number; amount: number }) => {
      return fetchJson<XenditInvoice>(ENDPOINTS.CREATE_XENDIT_INVOICE, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Invoice Creation Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// Hook: Upload cash payment proof
export const useUploadCashProof = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CashProofUpload) => {
      const formData = new FormData();
      formData.append("job_id", data.jobId.toString());
      formData.append("image", data.image as any);

      const response = await apiRequest(ENDPOINTS.UPLOAD_CASH_PROOF, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload cash proof");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });

      Toast.show({
        type: "success",
        text1: "Cash Proof Uploaded",
        text2: "Your payment proof is being verified by admin",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// Hook: Get payment status
export const usePaymentStatus = (paymentId: number | null) => {
  return useQuery<PaymentStatus>({
    queryKey: ["paymentStatus", paymentId],
    queryFn: async (): Promise<PaymentStatus> => {
      if (!paymentId) throw new Error("Payment ID is required");
      return fetchJson<PaymentStatus>(ENDPOINTS.PAYMENT_STATUS(paymentId), {
        credentials: "include",
      });
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if payment is pending
      const data = query.state.data;
      if (data?.status === "pending" || data?.status === "verifying") {
        return 5000;
      }
      return false;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook: Get payment history
export const usePaymentHistory = (filters?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append("page", filters.page.toString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.status) queryParams.append("status", filters.status);

  const url = `${ENDPOINTS.PAYMENT_HISTORY}?${queryParams.toString()}`;

  return useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: ["paymentHistory", filters],
    queryFn: async () => {
      return fetchJson<{ transactions: Transaction[]; total: number }>(url, {
        credentials: "include",
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook: Wallet deposit
export const useWalletDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation<WalletDepositResponse, Error, number>({
    mutationFn: async (amount: number) => {
      return fetchJson<WalletDepositResponse>(ENDPOINTS.WALLET_DEPOSIT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          payment_method: "GCASH",
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Deposit Initiated",
        text2: data.payment_url
          ? "Redirecting to payment page..."
          : "Wallet balance updated",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Deposit Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// Utility: Calculate escrow amount (50% of job budget + 10% platform fee on that 50%)
// Worker receives full job budget, client pays platform fee on top
export const calculateEscrowAmount = (jobBudget: number) => {
  const halfBudget = jobBudget * 0.5; // 50% to worker
  const platformFee = halfBudget * 0.10; // 10% of the 50% (5% of total budget)
  const total = halfBudget + platformFee; // Total client pays for escrow

  return {
    halfBudget: parseFloat(halfBudget.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

// Utility: Format currency (PHP ₱)
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
