"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Client {
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

// Mock data - replace with actual API call
const mockClients: Client[] = [
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

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    // Mock fetch - replace with actual API call
    const foundClient = mockClients.find((c) => c.id === id);
    if (foundClient) {
      setClient(foundClient);
    }
  }, [id]);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/admin/users/clients")}
      >
        ← Back to Clients
      </Button>

      {/* Client Header */}
      <h1 className="text-2xl font-semibold">Client Profile #{client.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Client Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Placeholder Circle Avatar */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{client.name}</h2>
                <p className="text-sm text-gray-500">
                  {client.accountType === "business" ? "Business" : "Personal"}{" "}
                  Account
                </p>
                <p className="text-sm text-gray-500">{client.location}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  ${client.totalSpent.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-3 text-sm border-t pt-4">
              <div>
                <p className="text-gray-500">Jobs Posted</p>
                <p className="font-semibold">{client.totalJobsPosted}</p>
              </div>
              <div>
                <p className="text-gray-500">Active Jobs</p>
                <p className="font-semibold text-blue-600">
                  {client.activeJobs}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Account Type</p>
                <p className="font-semibold capitalize">{client.accountType}</p>
              </div>
              <div>
                <p className="text-gray-500">Verification</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.verificationStatus === "verified"
                      ? "bg-green-100 text-green-800"
                      : client.verificationStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.verificationStatus}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Join Date</p>
                <p className="font-semibold">
                  {new Date(client.joinDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-800"
                      : client.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.status}
                </span>
              </div>
            </div>

            {/* Preferred Categories */}
            <div className="border-t pt-4">
              <p className="font-medium mb-2">Preferred Service Categories</p>
              <div className="flex flex-wrap gap-2">
                {client.preferredCategories.map((category, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs (Jobs, Transactions, Activity) */}
            <Tabs defaultValue="jobs" className="mt-6">
              <TabsList>
                <TabsTrigger value="jobs">Posted Jobs</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="mt-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Plumbing Repair Needed
                        </p>
                        <Link
                          href="/admin/jobs/listings/JOB-001"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500">Posted 2 days ago</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Need experienced plumber for kitchen sink repair...
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <DollarSign className="inline h-3 w-3" /> $150 - $200
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Payment to Worker
                        </p>
                        <Link
                          href="/admin/jobs/completed/COMP-001"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500">
                        TXN-2024-001234 • Jan 15, 2024
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">$180.00</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Payment for Appliance Repair job
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Posted a new job</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Completed payment</p>
                      <p className="text-xs text-gray-500">5 days ago</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Status and User Details Panel */}
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                {/* Full width bordered status bar */}
                <div className="w-full border rounded-md bg-white">
                  <div
                    className={`text-center text-xs font-semibold py-2 rounded-md ${
                      client.status === "active"
                        ? "bg-green-50 text-green-600"
                        : client.status === "inactive"
                          ? "bg-gray-50 text-gray-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {client.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  placeholder="Add a note about this client..."
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="destructive" className="w-full justify-center">
                  <span className="mr-2">⦸</span>Ban
                </Button>
                <Button variant="outline" className="w-full justify-center">
                  <span className="mr-2">⏸</span>Suspend
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center col-span-2"
                >
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Use a description list to align labels and values */}
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">User Type</dt>
                <dd className="font-medium">Client</dd>

                <dt className="text-gray-500">Client ID</dt>
                <dd className="font-medium">#{client.id}</dd>

                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-xs break-all">
                  {client.email}
                </dd>

                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium">{client.phone}</dd>

                <dt className="text-gray-500">Account Type</dt>
                <dd className="font-medium capitalize">{client.accountType}</dd>

                <dt className="text-gray-500">Date Joined</dt>
                <dd className="font-medium">
                  {new Date(client.joinDate).toLocaleDateString()}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
