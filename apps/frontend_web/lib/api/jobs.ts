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
  });

  if (!response.ok) {
    throw new Error("Failed to fetch workers");
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
