// Job Detail Types for Admin Panel

export interface JobTimeline {
  job_posted: string;
  worker_assigned: string | null;
  start_initiated: string | null;
  worker_arrived: string | null;
  worker_completed: string | null;
  client_confirmed: string | null;
  reviews_submitted: string | null;
}

export interface JobPhoto {
  id: number;
  url: string;
  uploaded_at: string;
}

export interface JobApplication {
  id: string;
  worker: {
    id: string;
    name: string;
    rating: number;
    avatar_url: string | null;
  };
  proposed_budget: number;
  status: string;
  message: string;
  applied_at: string;
}

export interface JobReview {
  id: string;
  reviewer_name: string;
  reviewer_type: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface JobDetail {
  id: string;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  } | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  job_type: string;
  materials_needed: string[];
  expected_duration: string | null;
  preferred_start_date: string | null;

  // Payment tracking
  escrow_amount: number;
  escrow_paid: boolean;
  escrow_paid_at: string | null;
  remaining_payment: number;
  remaining_payment_paid: boolean;
  remaining_payment_paid_at: string | null;

  // Completion tracking
  worker_marked_complete: boolean;
  client_marked_complete: boolean;
  client_confirmed_work_started: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;

  // Related entities
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    rating: number;
    avatar_url: string | null;
  };
  worker: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    completed_jobs: number;
    avatar_url: string | null;
  } | null;
  timeline: JobTimeline;
  photos: JobPhoto[];
  applications: JobApplication[];
  applications_count: number;
  reviews: JobReview[];
}

export interface JobDetailResponse {
  success: boolean;
  data?: JobDetail;
  error?: string;
}
