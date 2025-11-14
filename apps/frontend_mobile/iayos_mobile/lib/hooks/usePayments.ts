import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "../api/config";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

// Types
export interface WalletBalance {
  balance: number;
  currency: string;
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
  return useQuery<WalletBalance>({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.WALLET_BALANCE, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch wallet balance");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook: Create escrow payment
export const useCreateEscrowPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: EscrowPayment) => {
      const response = await fetch(ENDPOINTS.CREATE_ESCROW_PAYMENT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create escrow payment");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
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
      const response = await fetch(ENDPOINTS.CREATE_XENDIT_INVOICE, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create Xendit invoice");
      }

      return response.json() as Promise<XenditInvoice>;
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

      const response = await fetch(ENDPOINTS.UPLOAD_CASH_PROOF, {
        method: "POST",
        credentials: "include",
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
    queryFn: async () => {
      if (!paymentId) throw new Error("Payment ID is required");

      const response = await fetch(ENDPOINTS.PAYMENT_STATUS(paymentId), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch payment status");
      }

      return response.json();
    },
    enabled: !!paymentId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if payment is pending
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
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch payment history");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook: Wallet deposit
export const useWalletDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch(ENDPOINTS.WALLET_DEPOSIT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate deposit");
      }

      return response.json() as Promise<XenditInvoice>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      
      Toast.show({
        type: "success",
        text1: "Deposit Initiated",
        text2: "Redirecting to payment page...",
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

// Utility: Calculate escrow amount (50% of job budget + 5% platform fee)
export const calculateEscrowAmount = (jobBudget: number) => {
  const halfBudget = jobBudget * 0.5;
  const platformFee = jobBudget * 0.05;
  const total = halfBudget + platformFee;

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
