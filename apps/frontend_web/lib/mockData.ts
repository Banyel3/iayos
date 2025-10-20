// Centralized mock data for admin panel
// This file contains all mock data to ensure consistency across all admin pages

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: "personal" | "business";
  location: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  totalJobsPosted: number;
  totalSpent: number;
  activeJobs: number;
  preferredCategories: string[];
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  location: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  completedJobs: number;
}

export interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  description: string;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "verified" | "pending" | "rejected";
  joinDate: string;
  totalWorkers: number;
  totalJobs: number;
  avgRating: number;
  reviewCount: number;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  client: {
    name: string;
    rating: number;
  };
  budget: number;
  budgetType: "fixed" | "hourly";
  location: string;
  postedDate: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  applicationsCount: number;
  urgency: "low" | "medium" | "high";
  duration: string;
}

export interface ActiveJob {
  id: string;
  title: string;
  description: string;
  category: string;
  client: {
    id: string;
    name: string;
    rating: number;
  };
  worker: {
    id: string;
    name: string;
    rating: number;
  };
  budget: number;
  budgetType: "fixed" | "hourly";
  paymentStatus: "50% paid" | "fully_paid" | "pending_payment";
  startDate: string;
  duration: string;
  location: string;
  status: "in_progress" | "awaiting_completion";
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  worker: {
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
    profileImage?: string;
  };
  appliedDate: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  proposedRate: number;
  rateType: "fixed" | "hourly";
  coverLetter: string;
  estimatedDuration: string;
  availability: string;
  client: {
    name: string;
    id: string;
  };
}

// Mock Clients Data
export const mockClients: Client[] = [
  {
    id: "1",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1234567890",
    accountType: "personal",
    location: "New York, NY",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    totalJobsPosted: 15,
    totalSpent: 2450.0,
    activeJobs: 3,
    preferredCategories: ["Home Cleaning", "Plumbing", "Electrical"],
  },
  {
    id: "2",
    name: "David Chen",
    email: "david.chen@example.com",
    phone: "+1234567891",
    accountType: "business",
    location: "San Francisco, CA",
    status: "inactive",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    totalJobsPosted: 8,
    totalSpent: 1200.0,
    activeJobs: 0,
    preferredCategories: ["IT Support", "Electrical"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@techstartup.com",
    phone: "+1234567892",
    accountType: "business",
    location: "Austin, TX",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-03-10",
    totalJobsPosted: 23,
    totalSpent: 4890.0,
    activeJobs: 5,
    preferredCategories: ["Painting", "Carpentry", "Home Cleaning"],
  },
  {
    id: "4",
    name: "Michael Thompson",
    email: "m.thompson@gmail.com",
    phone: "+1234567893",
    accountType: "personal",
    location: "Seattle, WA",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-04-05",
    totalJobsPosted: 12,
    totalSpent: 1850.0,
    activeJobs: 2,
    preferredCategories: ["Plumbing", "HVAC"],
  },
  {
    id: "5",
    name: "Jennifer Lee",
    email: "jennifer.lee@realestate.com",
    phone: "+1234567894",
    accountType: "business",
    location: "Miami, FL",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-28",
    totalJobsPosted: 42,
    totalSpent: 8720.0,
    activeJobs: 8,
    preferredCategories: [
      "Home Cleaning",
      "Landscaping",
      "Painting",
      "Plumbing",
    ],
  },
  {
    id: "6",
    name: "Robert Martinez",
    email: "robert.m@yahoo.com",
    phone: "+1234567895",
    accountType: "personal",
    location: "Boston, MA",
    status: "suspended",
    verificationStatus: "rejected",
    joinDate: "2024-05-12",
    totalJobsPosted: 3,
    totalSpent: 180.0,
    activeJobs: 0,
    preferredCategories: ["Electrical"],
  },
  {
    id: "7",
    name: "Amanda Foster",
    email: "amanda@designstudio.com",
    phone: "+1234567896",
    accountType: "business",
    location: "Portland, OR",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-14",
    totalJobsPosted: 18,
    totalSpent: 3240.0,
    activeJobs: 4,
    preferredCategories: ["Painting", "Carpentry", "Interior Design"],
  },
  {
    id: "8",
    name: "James Anderson",
    email: "j.anderson@construction.com",
    phone: "+1234567897",
    accountType: "business",
    location: "Denver, CO",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-05",
    totalJobsPosted: 56,
    totalSpent: 15670.0,
    activeJobs: 11,
    preferredCategories: [
      "Carpentry",
      "Plumbing",
      "Electrical",
      "HVAC",
      "Roofing",
    ],
  },
];

// Mock Workers Data
export const mockWorkers: Worker[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    skills: ["Plumbing", "Electrical", "Carpentry"],
    rating: 4.8,
    reviewCount: 127,
    location: "New York, NY",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    completedJobs: 89,
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1234567891",
    skills: ["Painting", "Cleaning"],
    rating: 4.6,
    reviewCount: 73,
    location: "Los Angeles, CA",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    completedJobs: 56,
  },
];

// Mock Agencies Data
export const mockAgencies: Agency[] = [
  {
    id: "agency_001",
    name: "ProServices Agency",
    email: "info@proservices.com",
    phone: "+1-555-0123",
    address: "123 Business Ave",
    city: "New York",
    state: "NY",
    country: "USA",
    website: "www.proservices.com",
    description:
      "Full-service agency providing home maintenance and repair services",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-15",
    totalWorkers: 45,
    totalJobs: 342,
    avgRating: 4.7,
    reviewCount: 128,
  },
  {
    id: "agency_002",
    name: "HomeHelp Solutions",
    email: "contact@homehelp.com",
    phone: "+1-555-0456",
    address: "456 Service St",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    description: "Specialized in residential cleaning and maintenance services",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-02-20",
    totalWorkers: 28,
    totalJobs: 189,
    avgRating: 4.5,
    reviewCount: 76,
  },
  {
    id: "agency_003",
    name: "CityWide Services",
    email: "hello@citywide.com",
    phone: "+1-555-0789",
    address: "789 Urban Blvd",
    city: "Chicago",
    state: "IL",
    country: "USA",
    description:
      "Urban service provider for commercial and residential clients",
    status: "active",
    verificationStatus: "pending",
    joinDate: "2024-03-10",
    totalWorkers: 12,
    totalJobs: 45,
    avgRating: 4.2,
    reviewCount: 18,
  },
];

// Return agency-specific stats for the dashboard
export const getAgencyStats = (agencyId?: string) => {
  // Find agency by id, or fallback to the first agency
  const agency = agencyId
    ? mockAgencies.find((a) => a.id === agencyId) || mockAgencies[0]
    : mockAgencies[0];

  // For mock purposes compute active jobs as jobs with status in mockActiveJobs
  // (this is coarse-grained since mock data doesn't map jobs to agencies)
  const activeJobs = mockActiveJobs.filter(
    (j) => j.status === "in_progress"
  ).length;

  return {
    agencyId: agency.id,
    name: agency.name,
    totalWorkers: agency.totalWorkers,
    totalJobs: agency.totalJobs,
    avgRating: agency.avgRating,
    reviewCount: agency.reviewCount,
    activeJobs,
    pendingKYC: agency.verificationStatus === "pending" ? 1 : 0,
  };
};

// Mock Job Listings Data
export const mockJobListings: JobListing[] = [
  {
    id: "JOB-001",
    title: "Residential Plumbing Repair",
    description:
      "Need a professional plumber to fix leaking pipes in the kitchen and bathroom. Urgent repair needed.",
    category: "Plumbing",
    client: {
      name: "Sarah Wilson",
      rating: 4.8,
    },
    budget: 250,
    budgetType: "fixed",
    location: "Brooklyn, NY",
    postedDate: "2024-10-12",
    status: "open",
    applicationsCount: 12,
    urgency: "high",
    duration: "1-2 days",
  },
  {
    id: "JOB-002",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
    client: {
      name: "Michael Brown",
      rating: 4.5,
    },
    budget: 35,
    budgetType: "hourly",
    location: "Manhattan, NY",
    postedDate: "2024-10-11",
    status: "in_progress",
    applicationsCount: 8,
    urgency: "medium",
    duration: "4-6 hours",
  },
  {
    id: "JOB-003",
    title: "Electrical Installation - Smart Home",
    description:
      "Need an electrician to install smart switches, outlets, and lighting system throughout the house.",
    category: "Electrical",
    client: {
      name: "Emily Chen",
      rating: 4.9,
    },
    budget: 800,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-10",
    status: "open",
    applicationsCount: 15,
    urgency: "medium",
    duration: "2-3 days",
  },
  {
    id: "JOB-004",
    title: "Interior Painting - Living Room",
    description:
      "Professional painting service needed for living room and dining area. Includes wall preparation.",
    category: "Painting",
    client: {
      name: "David Martinez",
      rating: 4.6,
    },
    budget: 450,
    budgetType: "fixed",
    location: "Bronx, NY",
    postedDate: "2024-10-09",
    status: "completed",
    applicationsCount: 6,
    urgency: "low",
    duration: "2 days",
  },
  {
    id: "JOB-005",
    title: "Custom Carpentry - Built-in Shelves",
    description:
      "Looking for an experienced carpenter to build custom shelving units in home office.",
    category: "Carpentry",
    client: {
      name: "Jessica Lee",
      rating: 4.7,
    },
    budget: 650,
    budgetType: "fixed",
    location: "Staten Island, NY",
    postedDate: "2024-10-08",
    status: "open",
    applicationsCount: 9,
    urgency: "low",
    duration: "3-4 days",
  },
  {
    id: "JOB-006",
    title: "HVAC System Maintenance",
    description:
      "Annual maintenance and inspection of HVAC system for a commercial property.",
    category: "HVAC",
    client: {
      name: "Robert Johnson",
      rating: 4.4,
    },
    budget: 300,
    budgetType: "fixed",
    location: "Manhattan, NY",
    postedDate: "2024-10-07",
    status: "in_progress",
    applicationsCount: 5,
    urgency: "medium",
    duration: "1 day",
  },
  {
    id: "JOB-007",
    title: "Landscaping and Garden Design",
    description:
      "Complete landscaping service for backyard including design, planting, and maintenance.",
    category: "Landscaping",
    client: {
      name: "Amanda White",
      rating: 4.9,
    },
    budget: 1200,
    budgetType: "fixed",
    location: "Brooklyn, NY",
    postedDate: "2024-10-06",
    status: "open",
    applicationsCount: 18,
    urgency: "low",
    duration: "5-7 days",
  },
  {
    id: "JOB-008",
    title: "Emergency Roof Leak Repair",
    description:
      "Urgent roof repair needed due to recent storm damage. Immediate attention required.",
    category: "Roofing",
    client: {
      name: "Thomas Garcia",
      rating: 4.3,
    },
    budget: 500,
    budgetType: "fixed",
    location: "Queens, NY",
    postedDate: "2024-10-12",
    status: "open",
    applicationsCount: 10,
    urgency: "high",
    duration: "1 day",
  },
];

// Mock Active Jobs Data
export const mockActiveJobs: ActiveJob[] = [
  {
    id: "ACT-001",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
    client: {
      id: "CLI-202",
      name: "Michael Brown",
      rating: 4.5,
    },
    worker: {
      id: "WRK-103",
      name: "Maria Garcia",
      rating: 4.8,
    },
    budget: 180,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-11",
    duration: "4-6 hours",
    location: "Manhattan, NY",
    status: "in_progress",
  },
  {
    id: "ACT-002",
    title: "HVAC System Maintenance",
    description:
      "Regular maintenance check and cleaning of HVAC system for residential property.",
    category: "HVAC",
    client: {
      id: "CLI-207",
      name: "Robert Johnson",
      rating: 4.4,
    },
    worker: {
      id: "WRK-111",
      name: "Kevin Martinez",
      rating: 4.7,
    },
    budget: 300,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-07",
    duration: "1 week",
    location: "Manhattan, NY",
    status: "in_progress",
  },
  {
    id: "ACT-003",
    title: "Emergency Roof Leak Repair",
    description:
      "Urgent repair needed for roof leak in residential property. Water damage prevention required.",
    category: "Roofing",
    client: {
      id: "CLI-206",
      name: "Thomas Garcia",
      rating: 4.3,
    },
    worker: {
      id: "WRK-108",
      name: "John Williams",
      rating: 4.8,
    },
    budget: 480,
    budgetType: "fixed",
    paymentStatus: "fully_paid",
    startDate: "2024-10-12",
    duration: "2 days",
    location: "Queens, NY",
    status: "awaiting_completion",
  },
  {
    id: "ACT-004",
    title: "Kitchen Renovation",
    description:
      "Complete kitchen renovation including cabinet installation and countertop replacement.",
    category: "Carpentry",
    client: {
      id: "CLI-208",
      name: "Jennifer Taylor",
      rating: 4.9,
    },
    worker: {
      id: "WRK-112",
      name: "Daniel Foster",
      rating: 4.9,
    },
    budget: 2500,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-01",
    duration: "3 weeks",
    location: "Brooklyn, NY",
    status: "in_progress",
  },
  {
    id: "ACT-005",
    title: "Electrical Panel Upgrade",
    description:
      "Upgrade old electrical panel to modern standards with increased capacity.",
    category: "Electrical",
    client: {
      id: "CLI-209",
      name: "William Davis",
      rating: 4.6,
    },
    worker: {
      id: "WRK-113",
      name: "Steven Clark",
      rating: 4.8,
    },
    budget: 1200,
    budgetType: "fixed",
    paymentStatus: "50% paid",
    startDate: "2024-10-09",
    duration: "1 week",
    location: "Queens, NY",
    status: "in_progress",
  },
];

// Mock Job Applications Data
export const mockApplications: JobApplication[] = [
  {
    id: "APP-001",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-101",
      name: "Mike Thompson",
      rating: 4.9,
      completedJobs: 127,
    },
    appliedDate: "2024-10-12T09:30:00",
    status: "pending",
    proposedRate: 240,
    rateType: "fixed",
    coverLetter:
      "I have 10+ years of experience in residential plumbing. I can complete this job within 24 hours with guaranteed quality work.",
    estimatedDuration: "1 day",
    availability: "Available immediately",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
  {
    id: "APP-002",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-102",
      name: "James Rodriguez",
      rating: 4.7,
      completedJobs: 89,
    },
    appliedDate: "2024-10-12T10:15:00",
    status: "pending",
    proposedRate: 250,
    rateType: "fixed",
    coverLetter:
      "Licensed plumber with expertise in leak repairs. I can provide same-day service with a warranty on all work.",
    estimatedDuration: "1-2 days",
    availability: "Can start today",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
  {
    id: "APP-003",
    jobId: "JOB-002",
    jobTitle: "House Cleaning Service",
    worker: {
      id: "WRK-103",
      name: "Maria Garcia",
      rating: 4.8,
      completedJobs: 156,
    },
    appliedDate: "2024-10-11T14:20:00",
    status: "accepted",
    proposedRate: 32,
    rateType: "hourly",
    coverLetter:
      "Professional house cleaning specialist with eco-friendly products. Deep cleaning is my specialty!",
    estimatedDuration: "4-5 hours",
    availability: "Available this week",
    client: {
      name: "Michael Brown",
      id: "CLI-202",
    },
  },
  {
    id: "APP-004",
    jobId: "JOB-003",
    jobTitle: "Electrical Installation - Smart Home",
    worker: {
      id: "WRK-104",
      name: "Robert Chen",
      rating: 4.9,
      completedJobs: 203,
    },
    appliedDate: "2024-10-10T11:00:00",
    status: "pending",
    proposedRate: 750,
    rateType: "fixed",
    coverLetter:
      "Certified electrician specializing in smart home installations. I have extensive experience with all major smart home systems.",
    estimatedDuration: "2 days",
    availability: "Available next week",
    client: {
      name: "Emily Chen",
      id: "CLI-203",
    },
  },
  {
    id: "APP-005",
    jobId: "JOB-003",
    jobTitle: "Electrical Installation - Smart Home",
    worker: {
      id: "WRK-105",
      name: "David Kim",
      rating: 4.6,
      completedJobs: 78,
    },
    appliedDate: "2024-10-10T13:45:00",
    status: "rejected",
    proposedRate: 900,
    rateType: "fixed",
    coverLetter:
      "I can install your smart home system with premium quality components and provide ongoing support.",
    estimatedDuration: "3 days",
    availability: "Available in 2 weeks",
    client: {
      name: "Emily Chen",
      id: "CLI-203",
    },
  },
  {
    id: "APP-006",
    jobId: "JOB-005",
    jobTitle: "Custom Carpentry - Built-in Shelves",
    worker: {
      id: "WRK-106",
      name: "Thomas Anderson",
      rating: 4.9,
      completedJobs: 145,
    },
    appliedDate: "2024-10-08T16:30:00",
    status: "pending",
    proposedRate: 625,
    rateType: "fixed",
    coverLetter:
      "Master carpenter with 15 years experience. I specialize in custom built-ins and can provide design consultation.",
    estimatedDuration: "3-4 days",
    availability: "Available immediately",
    client: {
      name: "Jessica Lee",
      id: "CLI-204",
    },
  },
  {
    id: "APP-007",
    jobId: "JOB-007",
    jobTitle: "Landscaping and Garden Design",
    worker: {
      id: "WRK-107",
      name: "Carlos Martinez",
      rating: 4.7,
      completedJobs: 92,
    },
    appliedDate: "2024-10-06T09:00:00",
    status: "pending",
    proposedRate: 1150,
    rateType: "fixed",
    coverLetter:
      "Professional landscaper with design certification. I can create a beautiful outdoor space with sustainable plants.",
    estimatedDuration: "5-6 days",
    availability: "Available next week",
    client: {
      name: "Amanda White",
      id: "CLI-205",
    },
  },
  {
    id: "APP-008",
    jobId: "JOB-008",
    jobTitle: "Emergency Roof Leak Repair",
    worker: {
      id: "WRK-108",
      name: "John Williams",
      rating: 4.8,
      completedJobs: 134,
    },
    appliedDate: "2024-10-12T11:00:00",
    status: "accepted",
    proposedRate: 480,
    rateType: "fixed",
    coverLetter:
      "Emergency roofing specialist. I can start immediately and provide a temporary fix today, with permanent repair tomorrow.",
    estimatedDuration: "2 days",
    availability: "Available now",
    client: {
      name: "Thomas Garcia",
      id: "CLI-206",
    },
  },
  {
    id: "APP-009",
    jobId: "JOB-001",
    jobTitle: "Residential Plumbing Repair",
    worker: {
      id: "WRK-109",
      name: "Linda Martinez",
      rating: 4.5,
      completedJobs: 67,
    },
    appliedDate: "2024-10-12T12:30:00",
    status: "pending",
    proposedRate: 260,
    rateType: "fixed",
    coverLetter:
      "Experienced plumber specializing in residential repairs. I offer competitive rates and quality service.",
    estimatedDuration: "1-2 days",
    availability: "Available tomorrow",
    client: {
      name: "Sarah Wilson",
      id: "CLI-201",
    },
  },
  {
    id: "APP-010",
    jobId: "JOB-003",
    jobTitle: "Electrical Installation - Smart Home",
    worker: {
      id: "WRK-110",
      name: "Patrick O'Brien",
      rating: 4.8,
      completedJobs: 112,
    },
    appliedDate: "2024-10-10T15:00:00",
    status: "pending",
    proposedRate: 775,
    rateType: "fixed",
    coverLetter:
      "Smart home expert with certification in home automation systems. I can integrate all your devices seamlessly.",
    estimatedDuration: "2-3 days",
    availability: "Available next week",
    client: {
      name: "Emily Chen",
      id: "CLI-203",
    },
  },
];

// Helper functions to get statistics
export const getAdminStats = () => {
  const totalClients = mockClients.length;
  const totalWorkers = mockWorkers.length;
  const totalAgencies = mockAgencies.length;
  const totalUsers = totalClients + totalWorkers + totalAgencies;

  const activeClients = mockClients.filter((c) => c.status === "active").length;
  const activeWorkers = mockWorkers.filter((w) => w.status === "active").length;
  const activeAgencies = mockAgencies.filter(
    (a) => a.status === "active"
  ).length;
  const activeUsers = activeClients + activeWorkers + activeAgencies;

  const totalJobListings = mockJobListings.length;
  const openJobs = mockJobListings.filter((j) => j.status === "open").length;
  const activeJobs = mockActiveJobs.length;
  const completedJobs = mockJobListings.filter(
    (j) => j.status === "completed"
  ).length;

  const totalApplications = mockApplications.length;
  const pendingApplications = mockApplications.filter(
    (a) => a.status === "pending"
  ).length;
  const acceptedApplications = mockApplications.filter(
    (a) => a.status === "accepted"
  ).length;

  // Calculate revenue from clients' total spent
  const totalRevenue = mockClients.reduce(
    (sum, client) => sum + client.totalSpent,
    0
  );

  return {
    totalUsers,
    totalClients,
    totalWorkers,
    totalAgencies,
    activeUsers,
    activeClients,
    activeWorkers,
    activeAgencies,
    totalJobListings,
    openJobs,
    activeJobs,
    completedJobs,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    totalRevenue,
    monthlyRevenue: Math.round(totalRevenue * 0.15), // Estimate 15% as monthly
  };
};
