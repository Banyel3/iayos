"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  DollarSign,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import JobTimeline from "@/components/agency/JobTimeline";

interface JobDetail {
  jobID: number;
  title: string;
  description: string;
  budget: number;
  status: string;
  urgency: string;
  client: { name: string; email: string; phone: string };
  assignedEmployee: { name: string; email: string; phone: string } | null;
  location: string;
  createdAt: string;
  clientConfirmedWorkStarted: boolean;
  workerMarkedComplete: boolean;
  clientMarkedComplete: boolean;
  completionNotes: string | null;
  photos: string[];
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ["agency-job-detail", jobId],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/agency/jobs/${jobId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch job");
      return response.json() as Promise<JobDetail>;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-8 w-48 rounded" />
          <div className="bg-gray-200 h-64 rounded-lg" />
          <div className="bg-gray-200 h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Job not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Active Jobs</span>
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.clientMarkedComplete
                    ? "bg-green-100 text-green-800"
                    : job.workerMarkedComplete
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {job.clientMarkedComplete
                  ? "Completed"
                  : job.workerMarkedComplete
                    ? "Pending Approval"
                    : "In Progress"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.urgency === "HIGH"
                    ? "bg-red-100 text-red-800"
                    : job.urgency === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {job.urgency} Priority
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-6">{job.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-semibold text-gray-900">
                ₱{job.budget.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-semibold text-gray-900 truncate">
                {job.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-semibold text-gray-900">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Briefcase className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">{job.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Job Timeline
            </h2>
            <JobTimeline
              clientConfirmedWorkStarted={job.clientConfirmedWorkStarted}
              workerMarkedComplete={job.workerMarkedComplete}
              clientMarkedComplete={job.clientMarkedComplete}
              createdAt={job.createdAt}
              completionNotes={job.completionNotes || undefined}
            />
          </div>

          {/* Completion Photos */}
          {job.photos && job.photos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="text-gray-600" size={20} />
                <h2 className="text-xl font-bold text-gray-900">
                  Completion Photos
                </h2>
                <span className="text-sm text-gray-600">
                  ({job.photos.length})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition border border-gray-200"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo}
                      alt={`Completion photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Notes */}
          {job.completionNotes && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Completion Notes
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 italic">
                  &ldquo;{job.completionNotes}&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - People Info */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="text-purple-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Client</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{job.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-700">{job.client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-gray-700">{job.client.phone}</p>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          {job.assignedEmployee && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="text-emerald-600" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Assigned Employee
                </h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {job.assignedEmployee.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-700">{job.assignedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-700">{job.assignedEmployee.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={32} />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
