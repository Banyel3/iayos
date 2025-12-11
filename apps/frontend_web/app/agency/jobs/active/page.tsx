"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Briefcase,
} from "lucide-react";

interface ActiveJob {
  jobID: number;
  title: string;
  description: string;
  budget: number;
  status: string;
  urgency: string;
  client: { name: string; email: string };
  assignedEmployee: { name: string; email: string } | null;
  location: string;
  createdAt: string;
  clientConfirmedWorkStarted: boolean;
  workerMarkedComplete: boolean;
  clientMarkedComplete: boolean;
  completionNotes: string | null;
  photos: string[];
}

export default function ActiveJobsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_progress" | "pending"
  >("all");

  const { data, isLoading } = useQuery({
    queryKey: ["agency-active-jobs"],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/agency/jobs?status=IN_PROGRESS`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  const jobs: ActiveJob[] = data?.jobs || [];

  const getVisualStatus = (job: ActiveJob): string => {
    if (job.clientMarkedComplete) return "COMPLETED";
    if (job.workerMarkedComplete) return "PENDING_APPROVAL";
    if (job.clientConfirmedWorkStarted) return "IN_PROGRESS";
    return "ASSIGNED";
  };

  const getStatusBadge = (job: ActiveJob) => {
    const visualStatus = getVisualStatus(job);

    const badges = {
      ASSIGNED: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: User,
        label: "Assigned",
      },
      IN_PROGRESS: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
        label: "In Progress",
      },
      PENDING_APPROVAL: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Pending Approval",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Completed",
      },
    };

    const badge = badges[visualStatus as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}
      >
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[urgency as keyof typeof colors]}`}
      >
        {urgency}
      </span>
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "in_progress") {
      return job.clientConfirmedWorkStarted && !job.workerMarkedComplete;
    }
    if (statusFilter === "pending") {
      return job.workerMarkedComplete && !job.clientMarkedComplete;
    }
    return true;
  });

  const inProgressCount = jobs.filter(
    (j) => j.clientConfirmedWorkStarted && !j.workerMarkedComplete
  ).length;
  const pendingCount = jobs.filter(
    (j) => j.workerMarkedComplete && !j.clientMarkedComplete
  ).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Briefcase className="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-600">
              Monitor ongoing jobs and completions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === "all"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          All Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setStatusFilter("in_progress")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === "in_progress"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === "pending"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Pending Approval ({pendingCount})
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 font-medium">No active jobs</p>
            <p className="text-gray-500 text-sm mt-1">
              Jobs will appear here once work has started
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.jobID}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => router.push(`/agency/jobs/${job.jobID}`)}
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-emerald-600 transition">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(job)}
                    {getUrgencyBadge(job.urgency)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/agency/jobs/${job.jobID}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.description}
              </p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-green-100 rounded">
                    <DollarSign className="text-green-600" size={16} />
                  </div>
                  <span className="text-gray-700 font-medium">
                    ₱{job.budget.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <MapPin className="text-blue-600" size={16} />
                  </div>
                  <span className="text-gray-700 truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <User className="text-purple-600" size={16} />
                  </div>
                  <span className="text-gray-700 truncate">
                    {job.client.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-gray-100 rounded">
                    <Calendar className="text-gray-600" size={16} />
                  </div>
                  <span className="text-gray-700">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Assigned Employee */}
              {job.assignedEmployee && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-emerald-900">
                    <span className="font-medium">✓ Assigned to:</span>{" "}
                    {job.assignedEmployee.name}
                  </p>
                </div>
              )}

              {/* Progress Indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`text-center p-3 rounded-lg transition ${
                    job.clientConfirmedWorkStarted
                      ? "bg-green-100 border border-green-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <CheckCircle
                    className={`mx-auto ${job.clientConfirmedWorkStarted ? "text-green-600" : "text-gray-400"}`}
                    size={20}
                  />
                  <p
                    className={`text-xs mt-1 font-medium ${job.clientConfirmedWorkStarted ? "text-green-900" : "text-gray-600"}`}
                  >
                    Work Started
                  </p>
                </div>
                <div
                  className={`text-center p-3 rounded-lg transition ${
                    job.workerMarkedComplete
                      ? "bg-orange-100 border border-orange-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <CheckCircle
                    className={`mx-auto ${job.workerMarkedComplete ? "text-orange-600" : "text-gray-400"}`}
                    size={20}
                  />
                  <p
                    className={`text-xs mt-1 font-medium ${job.workerMarkedComplete ? "text-orange-900" : "text-gray-600"}`}
                  >
                    Worker Complete
                  </p>
                </div>
                <div
                  className={`text-center p-3 rounded-lg transition ${
                    job.clientMarkedComplete
                      ? "bg-green-100 border border-green-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <CheckCircle
                    className={`mx-auto ${job.clientMarkedComplete ? "text-green-600" : "text-gray-400"}`}
                    size={20}
                  />
                  <p
                    className={`text-xs mt-1 font-medium ${job.clientMarkedComplete ? "text-green-900" : "text-gray-600"}`}
                  >
                    Client Approved
                  </p>
                </div>
              </div>

              {/* Worker Marked Complete Alert */}
              {job.workerMarkedComplete && !job.clientMarkedComplete && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="text-orange-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Worker marked this job as complete
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Waiting for client approval to release payment
                      </p>
                      {job.completionNotes && (
                        <p className="text-sm text-gray-700 mt-2 italic bg-white p-2 rounded border border-orange-200">
                          "{job.completionNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
