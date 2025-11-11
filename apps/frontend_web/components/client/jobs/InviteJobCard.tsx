"use client";

import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  Package,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface InviteTarget {
  id: number;
  name: string;
  type: "AGENCY" | "WORKER";
}

interface Category {
  id: number;
  name: string;
}

interface InviteJob {
  jobID: number;
  title: string;
  description: string;
  category: Category | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  materialsNeeded?: string[];
  inviteStatus: string;
  inviteTarget?: InviteTarget;
  inviteRejectionReason?: string | null;
  inviteRespondedAt?: string | null;
  createdAt: string;
}

interface InviteJobCardProps {
  job: InviteJob;
}

export default function InviteJobCard({ job }: InviteJobCardProps) {
  const urgencyColors = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ACCEPTED: "bg-green-100 text-green-800 border-green-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const statusIcons = {
    PENDING: Clock,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    COMPLETED: CheckCircle,
  };

  const StatusIcon =
    statusIcons[job.inviteStatus as keyof typeof statusIcons] || AlertCircle;

  const downpayment = job.budget * 0.5;
  const remaining = job.budget * 0.5;

  const getStatusMessage = () => {
    switch (job.inviteStatus) {
      case "PENDING":
        return `Waiting for ${job.inviteTarget?.name || "recipient"} to respond...`;
      case "ACCEPTED":
        return `${job.inviteTarget?.name || "Recipient"} accepted your invitation!`;
      case "REJECTED":
        return `${job.inviteTarget?.name || "Recipient"} declined your invitation`;
      case "COMPLETED":
        return "Job completed successfully";
      default:
        return "Status unknown";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 hover:shadow-lg transition-shadow ${
        job.inviteStatus === "REJECTED" ? "opacity-75" : ""
      }`}
    >
      {/* Header with Status */}
      <div
        className={`px-6 py-4 border-b ${
          job.inviteStatus === "PENDING"
            ? "bg-yellow-50 border-yellow-200"
            : job.inviteStatus === "ACCEPTED"
              ? "bg-green-50 border-green-200"
              : job.inviteStatus === "REJECTED"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[job.inviteStatus as keyof typeof statusColors]}`}
              >
                <div className="flex items-center space-x-1">
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{job.inviteStatus}</span>
                </div>
              </span>
              {job.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {job.category.name}
                </span>
              )}
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${urgencyColors[job.urgency as keyof typeof urgencyColors]}`}
              >
                {job.urgency} PRIORITY
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600">
              Sent on{" "}
              {new Date(job.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {/* Invite Target Info */}
        {job.inviteTarget && (
          <div className="flex items-center space-x-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                job.inviteTarget.type === "AGENCY"
                  ? "bg-blue-600"
                  : "bg-purple-600"
              } text-white`}
            >
              {job.inviteTarget.type === "AGENCY" ? (
                <Building2 className="h-6 w-6" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {job.inviteTarget.type === "AGENCY"
                  ? "Agency Invited"
                  : "Worker Invited"}
              </p>
              <p className="font-semibold text-gray-900">
                {job.inviteTarget.name}
              </p>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div
          className={`mb-4 p-4 rounded-lg ${
            job.inviteStatus === "PENDING"
              ? "bg-yellow-50 border border-yellow-200"
              : job.inviteStatus === "ACCEPTED"
                ? "bg-green-50 border border-green-200"
                : job.inviteStatus === "REJECTED"
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
          }`}
        >
          <p
            className={`text-sm font-medium flex items-center space-x-2 ${
              job.inviteStatus === "PENDING"
                ? "text-yellow-800"
                : job.inviteStatus === "ACCEPTED"
                  ? "text-green-800"
                  : job.inviteStatus === "REJECTED"
                    ? "text-red-800"
                    : "text-blue-800"
            }`}
          >
            <StatusIcon className="h-5 w-5" />
            <span>{getStatusMessage()}</span>
          </p>
          {job.inviteRespondedAt && (
            <p className="text-xs text-gray-600 mt-1">
              Responded on{" "}
              {new Date(job.inviteRespondedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Rejection Reason */}
        {job.inviteStatus === "REJECTED" && job.inviteRejectionReason && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-900 mb-2">
              Rejection Reason:
            </p>
            <p className="text-sm text-red-800">{job.inviteRejectionReason}</p>
          </div>
        )}

        {/* Job Description */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
          <p className="text-gray-700 leading-relaxed line-clamp-3">
            {job.description}
          </p>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-sm text-gray-900">{job.location}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Expected Duration
              </p>
              <p className="text-sm text-gray-900">
                {job.expectedDuration || "Not specified"}
              </p>
            </div>
          </div>

          {job.preferredStartDate && (
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Preferred Start Date
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(job.preferredStartDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Budget Breakdown */}
        <div
          className={`mb-4 p-4 rounded-lg border ${
            job.inviteStatus === "REJECTED"
              ? "bg-gray-50 border-gray-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <DollarSign
                className={`h-5 w-5 mr-2 ${job.inviteStatus === "REJECTED" ? "text-gray-600" : "text-green-600"}`}
              />
              Payment Details
            </h4>
            <span
              className={`text-2xl font-bold ${job.inviteStatus === "REJECTED" ? "text-gray-600" : "text-green-600"}`}
            >
              ₱{job.budget.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">50% Downpayment (Escrow):</span>
              <span
                className={`font-semibold ${job.inviteStatus === "REJECTED" ? "text-gray-700" : "text-green-700"}`}
              >
                ₱{downpayment.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">
                Remaining (Upon Completion):
              </span>
              <span className="font-semibold text-gray-700">
                ₱{remaining.toLocaleString()}
              </span>
            </div>
          </div>
          {job.inviteStatus === "REJECTED" && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                💰 Your downpayment has been refunded to your wallet.
              </p>
            </div>
          )}
          {job.inviteStatus === "PENDING" && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <p className="text-xs text-gray-600">
                💰 Your downpayment is held in escrow until the invitation is
                accepted.
              </p>
            </div>
          )}
        </div>

        {/* Materials Needed */}
        {job.materialsNeeded && job.materialsNeeded.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Package className="h-5 w-5 text-gray-600 mr-2" />
              Materials Needed
            </h4>
            <ul className="space-y-2">
              {job.materialsNeeded.map((material, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{material}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons Based on Status */}
        {job.inviteStatus === "ACCEPTED" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() =>
                (window.location.href = `/client/jobs/${job.jobID}`)
              }
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View Job Details
            </button>
          </div>
        )}

        {job.inviteStatus === "REJECTED" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => (window.location.href = "/client/agencies")}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Find Another Agency
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
