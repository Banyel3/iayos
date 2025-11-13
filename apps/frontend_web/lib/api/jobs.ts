import { API_BASE_URL } from "./config";

// Types
export interface JobPosting {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string;
  location: string;
  distance: number;
  postedBy: {
    name: string;
    avatar: string;
    rating: number;
  };
  postedAt: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  photos: Array<{
    id: number;
    url: string;
    file_name: string;
  }>;
}

export interface JobCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  workerCount: number;
}

export interface WorkerListing {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  rating: number;
  completedJobs: number;
  hourlyRate: string;
  distance: number;
  isAvailable: boolean;
  isVerified: boolean;
  startingPrice: string;
  reviewCount: number;
  experience: string;
}

export interface AgencyListing {
  agencyId: number;
  businessName: string;
  businessDesc: string | null;
  city: string | null;
  province: string | null;
  averageRating: number | null;
  totalReviews: number;
  completedJobs: number;
  activeJobs: number;
  kycStatus: string;
  specializations: string[];
}

export interface AgencyProfile {
  agencyId: number;
  businessName: string;
  businessDesc: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  contactNumber: string | null;
  kycStatus: string;
  stats: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    cancelledJobs: number;
    averageRating: number;
    totalReviews: number;
    onTimeCompletionRate: number;
    responseTime: string;
  };
  employees: Array<{
    employeeId: number;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    rating: number | null;
  }>;
  specializations: string[];
  createdAt: string;
}

export interface JobApplication {
  job_id: number;
  status: string;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60)
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
};

/**
 * Fetch available job postings for workers
 */
export async function fetchAvailableJobs(): Promise<JobPosting[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/available`, {
    credentials: "include",
    next: { revalidate: 120 }, // Cache for 2 minutes
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch jobs: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.success && data.jobs) {
    return data.jobs.map((job: any) => ({
      id: job.id.toString(),
      title: job.title,
      category: job.category?.name || "Uncategorized",
      description: job.description,
      budget: `₱${job.budget.toFixed(2)}`,
      location: job.location,
      distance: 0,
      postedBy: {
        name: job.client.name,
        avatar: job.client.avatar,
        rating: job.client.rating || 0,
      },
      postedAt: formatTimeAgo(job.created_at),
      urgency: job.urgency as "LOW" | "MEDIUM" | "HIGH",
      photos: job.photos || [],
    }));
  }

  return [];
}

/**
 * Fetch job categories
 */
export async function fetchJobCategories(): Promise<JobCategory[]> {
  const response = await fetch(`${API_BASE_URL}/adminpanel/jobs/categories`, {
    credentials: "include",
    next: { revalidate: 600 }, // Cache for 10 minutes (categories rarely change)
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch categories: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.success && data.categories) {
    return data.categories.map((cat: any) => ({
      id: cat.id.toString(),
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "🔧",
      workerCount: cat.worker_count || 0,
    }));
  }

  return [];
}

/**
 * Fetch workers near user
 */
export async function fetchWorkers(): Promise<WorkerListing[]> {
  // Try to get user's location
  let userLatitude: number | null = null;
  let userLongitude: number | null = null;

  try {
    const locationResponse = await fetch(
      `${API_BASE_URL}/accounts/location/me`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      if (locationData.success && locationData.location) {
        userLatitude = locationData.location.latitude;
        userLongitude = locationData.location.longitude;
      }
    }
  } catch (error) {
    console.log("User location not available from profile");
  }

  // If no location from profile, try browser
  if (userLatitude === null || userLongitude === null) {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        }
      );
      userLatitude = position.coords.latitude;
      userLongitude = position.coords.longitude;
    } catch (error) {
      console.log("Browser location not available");
    }
  }

  // Build URL
  let url = `${API_BASE_URL}/accounts/users/workers`;
  if (userLatitude !== null && userLongitude !== null) {
    url += `?latitude=${userLatitude}&longitude=${userLongitude}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to fetch workers" }));
    throw new Error(
      errorData.error ||
        errorData.message ||
        `Failed to fetch workers: ${response.status}`
    );
  }

  const data = await response.json();

  if (data.success && data.workers) {
    return data.workers;
  }

  return [];
}

/**
 * Fetch worker's job applications
 */
export async function fetchMyApplications(): Promise<Set<string>> {
  const response = await fetch(`${API_BASE_URL}/jobs/my-applications`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.status}`);
  }

  const data = await response.json();

  if (data.success && data.applications) {
    return new Set<string>(
      data.applications.map((app: any) => app.job_id.toString())
    );
  }

  return new Set<string>();
}

/**
 * Submit job application
 */
export async function submitJobApplication(params: {
  jobId: string;
  proposalMessage: string;
  proposedBudget: number;
  estimatedDuration: string | null;
  budgetOption: "ACCEPT" | "NEGOTIATE";
}) {
  const response = await fetch(`${API_BASE_URL}/jobs/${params.jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      proposal_message: params.proposalMessage,
      proposed_budget: params.proposedBudget,
      estimated_duration: params.estimatedDuration,
      budget_option: params.budgetOption,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to submit application");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to submit application");
  }

  return data;
}

/**
 * Fetch completed jobs for the current user
 */
export async function fetchCompletedJobs(): Promise<JobPosting[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/completed`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch completed jobs: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.success && data.jobs) {
    return data.jobs.map((job: any) => ({
      id: job.id.toString(),
      title: job.title,
      category: job.category?.name || "Uncategorized",
      description: job.description,
      budget: `₱${job.budget.toFixed(2)}`,
      location: job.location,
      distance: 0,
      postedBy: job.client
        ? {
            name: job.client.name,
            avatar: job.client.avatar,
            rating: job.client.rating || 0,
          }
        : job.assigned_worker
          ? {
              name: job.assigned_worker.name,
              avatar: job.assigned_worker.avatar,
              rating: job.assigned_worker.rating || 0,
            }
          : {
              name: "Unknown",
              avatar: "/worker1.jpg",
              rating: 0,
            },
      postedAt: formatTimeAgo(job.created_at),
      urgency: job.urgency as "LOW" | "MEDIUM" | "HIGH",
      photos: job.photos || [],
    }));
  }

  return [];
}

/**
 * Fetch agencies for clients (home page integration)
 */
export async function fetchAgencies(params?: {
  limit?: number;
  sortBy?: "rating" | "jobs" | "created";
}): Promise<AgencyListing[]> {
  const { limit = 12, sortBy = "rating" } = params || {};

  const queryParams = new URLSearchParams({
    page: "1",
    limit: limit.toString(),
    sort_by: sortBy,
  });

  const response = await fetch(
    `${API_BASE_URL}/client/agencies/browse?${queryParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agencies: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.agencies) {
    return data.agencies;
  }

  return [];
}

/**
 * Fetch a single agency profile by ID
 */
export async function fetchAgencyProfile(
  agencyId: string | number
): Promise<AgencyProfile> {
  const response = await fetch(`${API_BASE_URL}/client/agencies/${agencyId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Agency not found");
    }
    throw new Error("Failed to fetch agency profile");
  }

  const data = await response.json();
  return data;
}

// My Jobs / My Requests page types
export interface MyJobRequest {
  id: string;
  title: string;
  price: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING" | "IN_PROGRESS";
  description?: string;
  location?: string;
  client?: {
    name: string;
    avatar: string;
    rating: number;
    city?: string;
  };
  worker?: {
    name: string;
    avatar: string;
    rating: number;
  };
  assignedWorker?: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    city?: string;
  };
  category?: string;
  postedDate?: string;
  completedDate?: string;
  paymentStatus?: "PENDING" | "DOWNPAYMENT_PAID" | "FULLY_PAID";
  downpaymentMethod?: "WALLET" | "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER";
  finalPaymentMethod?:
    | "WALLET"
    | "GCASH"
    | "MAYA"
    | "CARD"
    | "BANK_TRANSFER"
    | "CASH";
  downpaymentAmount?: string;
  finalPaymentAmount?: string;
  totalAmount?: string;
  photos?: Array<{
    id: number;
    url: string;
    file_name?: string;
  }>;
}

/**
 * Fetch client's job postings (my-jobs endpoint)
 */
export async function fetchMyJobs(): Promise<MyJobRequest[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/my-jobs`, {
    credentials: "include",
  });

  if (!response.ok) {
    console.error(`Failed to fetch job postings: ${response.status}`);
    return [];
  }

  const data = await response.json();

  if (data.success && data.jobs) {
    return data.jobs.map((job: any) => {
      const paymentInfo = job.payment_info || {};
      const escrowAmount = parseFloat(paymentInfo.escrow_amount || 0);
      const remainingAmount = parseFloat(paymentInfo.remaining_payment || 0);
      const totalBudget = parseFloat(job.budget);

      let paymentStatus: "PENDING" | "DOWNPAYMENT_PAID" | "FULLY_PAID" =
        "PENDING";
      if (paymentInfo.escrow_paid && paymentInfo.remaining_payment_paid) {
        paymentStatus = "FULLY_PAID";
      } else if (paymentInfo.escrow_paid) {
        paymentStatus = "DOWNPAYMENT_PAID";
      }

      let downpaymentMethod: "WALLET" | "GCASH" | undefined;
      if (paymentInfo.escrow_paid) {
        downpaymentMethod = "WALLET";
      }

      return {
        id: job.id.toString(),
        title: job.title,
        price: `₱${totalBudget.toFixed(2)}`,
        date: new Date(job.created_at).toLocaleDateString(),
        status: job.status as "ACTIVE" | "COMPLETED" | "PENDING",
        description: job.description,
        location: job.location,
        category: job.category?.name || "Uncategorized",
        postedDate: job.created_at,
        photos: (job.photos || []).map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          file_name: photo.file_name,
        })),
        paymentStatus,
        downpaymentMethod,
        finalPaymentMethod: paymentInfo.final_payment_method as
          | "WALLET"
          | "GCASH"
          | "CASH"
          | undefined,
        downpaymentAmount: `₱${escrowAmount.toFixed(2)}`,
        finalPaymentAmount: `₱${remainingAmount.toFixed(2)}`,
        totalAmount: `₱${totalBudget.toFixed(2)}`,
      };
    });
  }

  return [];
}

/**
 * Fetch in-progress jobs for client or worker
 */
export async function fetchInProgressJobs(): Promise<MyJobRequest[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/in-progress`, {
    credentials: "include",
  });

  if (!response.ok) {
    console.error(`Failed to fetch in-progress jobs: ${response.status}`);
    return [];
  }

  const data = await response.json();

  if (data.success && data.jobs) {
    return data.jobs.map((job: any) => ({
      id: job.id.toString(),
      title: job.title,
      price: `₱${parseFloat(job.budget).toFixed(2)}`,
      date: new Date(job.created_at).toLocaleDateString(),
      status: "IN_PROGRESS" as const,
      description: job.description,
      location: job.location,
      category: job.category?.name || "Uncategorized",
      client: job.client
        ? {
            name: job.client.name,
            avatar: job.client.avatar,
            rating: job.client.rating || 0,
            city: job.client.city,
          }
        : undefined,
      worker: job.worker
        ? {
            name: job.worker.name,
            avatar: job.worker.avatar,
            rating: job.worker.rating || 0,
          }
        : undefined,
      photos: (job.photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        file_name: photo.file_name,
      })),
    }));
  }

  return [];
}
