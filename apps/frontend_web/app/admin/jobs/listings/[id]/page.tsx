"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Clock,
  Briefcase,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  location: string;
  duration: string;
  urgency: "low" | "medium" | "high";
  status: "open" | "in_progress" | "completed" | "cancelled";
  client: {
    id: string;
    name: string;
    email: string;
    rating: number;
  };
  postedDate: string;
  applicationsCount: number;
  requirements: string[];
  preferredSkills: string[];
}

const mockJobListings: JobListing[] = [
  {
    id: "JOB-001",
    title: "Residential Plumbing Repair",
    description:
      "Need a professional plumber to fix leaking pipes in the kitchen and bathroom. Urgent repair needed.",
    category: "Plumbing",
    budget: 250,
    budgetType: "fixed",
    location: "Brooklyn, NY",
    duration: "1-2 days",
    urgency: "high",
    status: "open",
    client: {
      id: "client_001",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      rating: 4.8,
    },
    postedDate: "2024-10-12T10:30:00Z",
    applicationsCount: 12,
    requirements: [
      "Licensed plumber",
      "At least 3 years experience",
      "Own tools required",
      "Insurance coverage",
    ],
    preferredSkills: ["Pipe fitting", "Leak detection", "Emergency repairs"],
  },
  {
    id: "JOB-002",
    title: "House Cleaning Service",
    description:
      "Looking for a thorough house cleaning service for a 3-bedroom apartment. Deep cleaning required.",
    category: "Home Cleaning",
    budget: 35,
    budgetType: "hourly",
    location: "Manhattan, NY",
    duration: "4-6 hours",
    urgency: "medium",
    status: "in_progress",
    client: {
      id: "client_002",
      name: "Michael Brown",
      email: "michael@example.com",
      rating: 4.5,
    },
    postedDate: "2024-10-11T14:20:00Z",
    applicationsCount: 8,
    requirements: [
      "Professional cleaning experience",
      "Own cleaning supplies",
      "Background check required",
    ],
    preferredSkills: [
      "Deep cleaning",
      "Eco-friendly products",
      "Attention to detail",
    ],
  },
  {
    id: "JOB-003",
    title: "Electrical Installation - Smart Home",
    description:
      "Need an electrician to install smart switches, outlets, and lighting system throughout the house.",
    category: "Electrical",
    budget: 800,
    budgetType: "fixed",
    location: "Queens, NY",
    duration: "2-3 days",
    urgency: "medium",
    status: "open",
    client: {
      id: "client_003",
      name: "Emily Chen",
      email: "emily@example.com",
      rating: 4.9,
    },
    postedDate: "2024-10-10T09:15:00Z",
    applicationsCount: 15,
    requirements: [
      "Licensed electrician",
      "Smart home system experience",
      "5+ years experience",
    ],
    preferredSkills: ["IoT integration", "Home automation", "Troubleshooting"],
  },
];

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a small delay for loading state
    const timer = setTimeout(() => {
      const foundJob = mockJobListings.find((j) => j.id === id);
      setJob(foundJob || null);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The job listing you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case "in_progress":
        return {
          label: "In Progress",
          color: "bg-blue-100 text-blue-800",
          icon: Clock,
        };
      case "completed":
        return {
          label: "Completed",
          color: "bg-gray-100 text-gray-800",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-red-100 text-red-800",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: Briefcase,
        };
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const statusInfo = getStatusInfo(job.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push("/admin/jobs/listings")}
      >
        ← Back to Job Listings
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground mt-1">Job #{job.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(job.urgency)}`}
          >
            {job.urgency.toUpperCase()} PRIORITY
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Job Description */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Job Description</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            {/* Budget & Location */}
            <div className="grid grid-cols-2 gap-6 border-t pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="font-bold text-2xl text-green-600">
                    ₱{job.budget.toLocaleString()}
                  </p>
                  {job.budgetType === "hourly" && (
                    <span className="text-sm text-muted-foreground">/hr</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{job.location}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{job.duration}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-semibold">{job.category}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preferred Skills */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Client Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Posted By
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{job.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.client.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{job.client.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Client Rating
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/users/clients/${job.client.id}`)
                  }
                >
                  View Client Profile
                </Button>
              </div>
            </div>

            <Tabs defaultValue="applications" className="border-t pt-6">
              <TabsList>
                <TabsTrigger value="applications">
                  Applications ({job.applicationsCount})
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Admin Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="applications" className="mt-4">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {job.applicationsCount} workers have applied for this job
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/admin/jobs/applications?job=${job.id}`)
                    }
                  >
                    View All Applications
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm border-l-2 border-blue-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">Job Posted</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.postedDate).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Posted by {job.client.name}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <textarea
                  placeholder="Add admin notes about this job..."
                  className="w-full rounded border border-gray-200 p-3 text-sm resize-none h-32"
                />
                <Button size="sm" className="mt-2">
                  Save Notes
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.status === "open" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Flag Job
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Close Job
                  </Button>
                </>
              )}
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Applications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Job ID</dt>
                <dd className="font-medium text-xs">#{job.id}</dd>

                <dt className="text-muted-foreground">Posted</dt>
                <dd className="font-medium text-xs">
                  {new Date(job.postedDate).toLocaleDateString()}
                </dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-xs">
                  {job.status.toUpperCase()}
                </dd>

                <dt className="text-muted-foreground">Applications</dt>
                <dd className="font-medium">{job.applicationsCount}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
