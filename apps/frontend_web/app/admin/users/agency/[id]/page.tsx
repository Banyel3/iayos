"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Star,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Agency {
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

// Mock data - should match the data from agency list page
const mockAgencies: Agency[] = [
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
  {
    id: "agency_004",
    name: "Expert Fixers",
    email: "info@expertfixers.com",
    phone: "+1-555-1011",
    address: "321 Repair Rd",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Professional repair and maintenance agency",
    status: "inactive",
    verificationStatus: "verified",
    joinDate: "2024-04-05",
    totalWorkers: 8,
    totalJobs: 23,
    avgRating: 4.3,
    reviewCount: 9,
  },
  {
    id: "agency_005",
    name: "Premium Care Services",
    email: "support@premiumcare.com",
    phone: "+1-555-1213",
    address: "654 Elite Plaza",
    city: "Miami",
    state: "FL",
    country: "USA",
    website: "www.premiumcare.com",
    description: "High-end service provider for luxury properties",
    status: "active",
    verificationStatus: "verified",
    joinDate: "2024-01-28",
    totalWorkers: 32,
    totalJobs: 267,
    avgRating: 4.8,
    reviewCount: 95,
  },
];

export default function AgencyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);

  useEffect(() => {
    // Mock fetch - replace with actual API call
    const foundAgency = mockAgencies.find((a) => a.id === id);
    if (foundAgency) {
      setAgency(foundAgency);
    }
  }, [id]);

  if (!agency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agency details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/admin/users/agency")}
      >
        ← Back to Agencies
      </Button>

      {/* Agency Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{agency.name}</h1>
          <p className="text-muted-foreground mt-1">{agency.description}</p>
        </div>
        <Button
          onClick={() =>
            router.push(`/admin/users/agency/${agency.id}/workers`)
          }
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Workers
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Agency Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Agency Logo Placeholder */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 border-y py-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold">{agency.avgRating}</p>
                </div>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{agency.totalWorkers}</p>
                <p className="text-xs text-muted-foreground">Workers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{agency.totalJobs}</p>
                <p className="text-xs text-muted-foreground">Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{agency.reviewCount}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{agency.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{agency.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {agency.address}
                      <br />
                      {agency.city}, {agency.state} {agency.country}
                    </p>
                  </div>
                </div>
                {agency.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={`https://${agency.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {agency.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workers">Workers</TabsTrigger>
                <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">
                    {agency.description}
                  </p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Business Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Completion Rate
                        </p>
                        <p className="font-semibold">94%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avg Response Time
                        </p>
                        <p className="font-semibold">2.4 hours</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="workers" className="mt-4">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Agency Workers</h4>
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/users/agency/${agency.id}/workers`)
                      }
                    >
                      View All Workers
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                          <div>
                            <p className="font-medium">Worker #{i}</p>
                            <p className="text-xs text-muted-foreground">
                              Electrician • 4.5 ⭐
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Recent Job Completions</h4>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-3 border rounded hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                Plumbing Repair #{i}
                              </p>
                              <Link
                                href={`/admin/jobs/completed/COMP-00${i}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Completed 2 days ago
                            </p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Completed
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Fixed kitchen sink leak and replaced old pipes...
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Client Reviews</h4>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, j) => (
                              <Star
                                key={j}
                                className="h-4 w-4 text-yellow-500 fill-yellow-500"
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            Client #{i}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Excellent service! The workers were professional and
                          completed the job perfectly.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          3 days ago
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Status and Actions */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Status
                </p>
                <div
                  className={`text-center text-xs font-semibold py-2 rounded-md ${
                    agency.status === "active"
                      ? "bg-green-50 text-green-600"
                      : agency.status === "inactive"
                        ? "bg-gray-50 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {agency.status.toUpperCase()}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Verification Status
                </p>
                <div
                  className={`text-center text-xs font-semibold py-2 rounded-md ${
                    agency.verificationStatus === "verified"
                      ? "bg-blue-50 text-blue-600"
                      : agency.verificationStatus === "pending"
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {agency.verificationStatus.toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  placeholder="Add notes about this agency..."
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Workers
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Suspend Agency
              </Button>
              <Button variant="destructive" className="w-full justify-start">
                Delete Agency
              </Button>
            </CardContent>
          </Card>

          {/* Agency Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agency Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">Agency ID</dt>
                <dd className="font-medium text-xs">#{agency.id}</dd>

                <dt className="text-gray-500">Joined</dt>
                <dd className="font-medium text-xs">
                  {new Date(agency.joinDate).toLocaleDateString()}
                </dd>

                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-xs">
                  {agency.city}, {agency.state}
                </dd>

                <dt className="text-gray-500">Country</dt>
                <dd className="font-medium text-xs">{agency.country}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
