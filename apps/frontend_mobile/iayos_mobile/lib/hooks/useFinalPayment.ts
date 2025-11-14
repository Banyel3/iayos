import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "../api/config";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

// Types
export interface FinalPayment {
  jobId: number;
  amount: number;
  paymentMethod: "gcash" | "wallet" | "cash";
  transactionId?: string;
}

export interface JobPaymentStatus {
  jobId: number;
  escrowPaid: boolean;
  escrowAmount: number;
  escrowDate: string;
  finalPaid: boolean;
  finalAmount: number;
  finalDate?: string;
  releasedToWorker: boolean;
  releaseDate?: string;
  totalPaid: number;
  status: "escrow_only" | "final_pending" | "completed";
}

export interface JobEarnings {
  jobId: number;
  jobTitle: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  paidAt: string;
  status: "pending" | "released";
}

export interface PaymentTimelineEvent {
  id: number;
  eventType: string;
  amount?: number;
  createdAt: string;
  description?: string;
}

export interface PaymentTimelineResponse {
  events: PaymentTimelineEvent[];
  totalEscrow: number;
  totalFinal: number;
  totalAmount: number;
}

export interface CashPaymentStatus {
  id: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
  imageUrl: string;
}

// Hook: Create final payment
export const useCreateFinalPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: FinalPayment) => {
      const response = await fetch(ENDPOINTS.CREATE_FINAL_PAYMENT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: payment.jobId,
          amount: payment.amount,
          payment_method: payment.paymentMethod,
          transaction_id: payment.transactionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create final payment");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: "success",
        text1: "Payment Successful",
        text2: "Final payment processed successfully!",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["jobPaymentStatus", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
      queryClient.invalidateQueries({ queryKey: ["activeJobs"] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message,
      });
    },
  });
};

// Hook: Get job payment status
export const useJobPaymentStatus = (jobId?: number) => {
  return useQuery<JobPaymentStatus>({
    queryKey: ["jobPaymentStatus", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("Job ID is required");

      const response = await fetch(ENDPOINTS.JOB_PAYMENT_STATUS(jobId), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch payment status");
      }

      return response.json();
    },
    enabled: !!jobId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook: Get job earnings
export const useJobEarnings = (jobId?: number) => {
  return useQuery<JobEarnings>({
    queryKey: ["jobEarnings", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("Job ID is required");

      const response = await fetch(ENDPOINTS.JOB_EARNINGS(jobId), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch earnings");
      }

      return response.json();
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook: Get payment timeline
export const usePaymentTimeline = (jobId?: number) => {
  return useQuery<PaymentTimelineResponse>({
    queryKey: ["paymentTimeline", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("Job ID is required");

      const response = await fetch(ENDPOINTS.PAYMENT_TIMELINE(jobId), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch payment timeline");
      }

      return response.json();
    },
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook: Get cash payment status
export const useCashPaymentStatus = (paymentId?: number) => {
  return useQuery<CashPaymentStatus>({
    queryKey: ["cashPaymentStatus", paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error("Payment ID is required");

      const response = await fetch(ENDPOINTS.CASH_PAYMENT_STATUS(paymentId), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch cash payment status");
      }

      return response.json();
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Poll every 10 seconds if pending
      const data = query.state.data;
      if (data?.status === "pending") {
        return 10000;
      }
      return false;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
