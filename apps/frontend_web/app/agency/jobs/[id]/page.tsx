"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Package,
} from "lucide-react";

interface Job {
  jobID: number;
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
  jobType: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  materialsNeeded?: string[];
  inviteStatus?: string;
  assignedEmployeeID?: number;
  assignedEmployee?: {
    employeeId: number;
    name: string;
    email: string;
    role: string;
  };
  client: {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  employeeAssignedAt?: string;
  assignmentNotes?: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/agency/jobs/${jobId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.statusText}`);
      }

      const data = await response.json();
      setJob(data.job || data);
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load job details"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      ASSIGNED: { color: "bg-blue-100 text-blue-800", icon: User },
      IN_PROGRESS: { color: "bg-orange-100 text-orange-800", icon: Loader2 },
      COMPLETED: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyColors = {
      HIGH: "bg-red-100 text-red-800 border-red-200",
      MEDIUM: "bg-orange-100 text-orange-800 border-orange-200",
      LOW: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${urgencyColors[urgency as keyof typeof urgencyColors] || "bg-gray-100 text-gray-800"}`}
      >
        {urgency}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/agency/jobs")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || "Job not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/agency/jobs")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <div className="flex items-center space-x-4">
                {getStatusBadge(job.status)}
                {getUrgencyBadge(job.urgency)}
                {job.inviteStatus && (
                  <span className="text-sm text-gray-600">
                    Invite: {job.inviteStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Job ID</div>
              <div className="text-lg font-semibold text-gray-900">
                #{job.jobID}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Job Description
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Job Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Budget</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ₱{job.budget?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Category</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {job.category?.name || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Location</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {job.location}
                      </div>
                    </div>
                  </div>

                  {job.expectedDuration && (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {job.expectedDuration}
                        </div>
                      </div>
                    </div>
                  )}

                  {job.preferredStartDate && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Start Date</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Date(job.preferredStartDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Materials Needed */}
            {job.materialsNeeded && job.materialsNeeded.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Materials Needed
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.materialsNeeded.map((material, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment Notes */}
            {job.assignmentNotes && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Assignment Notes
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.assignmentNotes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Client Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {job.client.name}
                      </div>
                      <div className="text-sm text-gray-600">Client</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {job.client.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Employee */}
            {job.assignedEmployee && (
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Assigned Employee
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {job.assignedEmployee.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.assignedEmployee.role}
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {job.assignedEmployee.email}
                      </div>
                      {job.employeeAssignedAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Assigned {new Date(job.employeeAssignedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Timeline
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
