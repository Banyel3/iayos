/**
 * useJobReceipt - Hook for fetching job receipt/invoice data
 * 
 * This hook fetches complete payment breakdown and timeline information
 * for completed jobs. Works for all completed jobs, including those
 * completed before this feature was implemented.
 */

import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";

// Receipt data types
export interface ReceiptPayment {
  currency: string;
  budget: number;
  escrow_amount: number;
  final_payment: number;
  materials_cost: number;
  platform_fee: number;
  platform_fee_rate: string;
  worker_earnings: number;
  total_client_paid: number;
  escrow_paid: boolean;
  escrow_paid_at: string | null;
  final_payment_paid: boolean;
  final_payment_paid_at: string | null;
  payment_method: string | null;
}

export interface ReceiptBuffer {
  buffer_days: number;
  start_date: string | null;
  end_date: string | null;
  remaining_days: number | null;
  is_released: boolean;
  released_at: string | null;
  hold_reason: string | null;
}

export interface ReceiptParty {
  id: number;
  name: string;
  avatar: string | null;
  contact: string | null;
  type?: 'WORKER' | 'AGENCY';
}

export interface ReceiptTransaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference_number: string | null;
  payment_method: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface ReceiptReviews {
  client_reviewed: boolean;
  worker_reviewed: boolean;
}

export interface ReceiptMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  source: string;
  purchase_price: number | null;
  client_approved: boolean;
}

export interface JobReceipt {
  // Job info
  job_id: number;
  title: string;
  description: string;
  category: string | null;
  location: string;
  is_team_job: boolean;
  job_type: string;
  
  // Status and dates
  status: string;
  created_at: string | null;
  started_at: string | null;
  worker_completed_at: string | null;
  client_approved_at: string | null;
  completed_at: string | null;
  
  // Payment breakdown
  payment: ReceiptPayment;
  
  // Buffer status
  buffer: ReceiptBuffer;
  
  // Parties
  client: ReceiptParty;
  worker: ReceiptParty | null;
  
  // Transaction history
  transactions: ReceiptTransaction[];

  // Materials purchased
  materials: ReceiptMaterial[];

  // Review status
  reviews: ReceiptReviews;
}

export interface JobReceiptResponse {
  success: boolean;
  receipt: JobReceipt;
}

/**
 * Hook to fetch job receipt data
 * @param jobId - The job ID to fetch receipt for
 * @param enabled - Whether to enable the query (default: true when jobId is provided)
 */
export function useJobReceipt(jobId: number | null, enabled: boolean = true) {
  return useQuery<JobReceiptResponse, Error>({
    queryKey: ["job-receipt", jobId],
    queryFn: async (): Promise<JobReceiptResponse> => {
      if (!jobId) throw new Error("Job ID is required");
      
      const response = await apiRequest(ENDPOINTS.JOB_RECEIPT(jobId));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch receipt" })) as { error?: string };
        throw new Error(getErrorMessage(errorData, "Failed to fetch receipt"));
      }
      
      return response.json() as Promise<JobReceiptResponse>;
    },
    enabled: enabled && !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes - receipts don't change often
    retry: 1,
  });
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for receipt display
 */
export function formatReceiptDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get transaction type display label
 */
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    PAYMENT: "Payment",
    REFUND: "Refund",
    EARNING: "Earning",
    PENDING_EARNING: "Pending Earning",
    FEE: "Platform Fee",
  };
  return labels[type] || type;
}

/**
 * Get hold reason display text
 */
export function getHoldReasonLabel(reason: string | null): string {
  if (!reason) return "N/A";
  
  const labels: Record<string, string> = {
    BUFFER_PERIOD: "7-day holding period",
    BACKJOB_PENDING: "Backjob request pending",
    ADMIN_HOLD: "Admin hold",
    RELEASED: "Payment released",
  };
  return labels[reason] || reason;
}
