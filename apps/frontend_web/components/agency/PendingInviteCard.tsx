'use client';

import { useState } from 'react';
import { Calendar, MapPin, User, DollarSign, Clock, AlertTriangle, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  avatar: string | null;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface PendingInviteJob {
  jobID: number;
  title: string;
  description: string;
  category: Category | null;
  budget: number;
  location: string;
  urgency: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  materialsNeeded?: string[];
  client: Client;
  createdAt: string;
  inviteStatus?: string;
}

interface PendingInviteCardProps {
  job: PendingInviteJob;
  onAccept: (jobId: number) => Promise<void>;
  onReject: (job: PendingInviteJob) => void;
  accepting?: boolean;
}

export default function PendingInviteCard({
  job,
  onAccept,
  onReject,
  accepting = false
}: PendingInviteCardProps) {
  const [loading, setLoading] = useState(false);

  const urgencyColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  };

  const downpayment = job.budget * 0.5;
  const remaining = job.budget * 0.5;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(job.jobID);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-blue-200 hover:shadow-lg transition-shadow">
      {/* Header with Invite Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                DIRECT INVITE
              </span>
              {job.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {job.category.name}
                </span>
              )}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${urgencyColors[job.urgency as keyof typeof urgencyColors]}`}>
                {job.urgency} PRIORITY
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
            <p className="text-sm text-gray-600">
              Invited on {new Date(job.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {/* Client Info */}
        <div className="flex items-center space-x-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
            {job.client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{job.client.name}</p>
            <p className="text-sm text-gray-600">{job.client.email}</p>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
          <p className="text-gray-700 leading-relaxed">{job.description}</p>
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
              <p className="text-sm font-medium text-gray-700">Expected Duration</p>
              <p className="text-sm text-gray-900">{job.expectedDuration || 'Not specified'}</p>
            </div>
          </div>

          {job.preferredStartDate && (
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Preferred Start Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(job.preferredStartDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Budget Breakdown */}
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              Payment Details
            </h4>
            <span className="text-2xl font-bold text-green-600">₱{job.budget.toLocaleString()}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">50% Downpayment (In Escrow):</span>
              <span className="font-semibold text-green-700">₱{downpayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Remaining (Upon Completion):</span>
              <span className="font-semibold text-gray-700">₱{remaining.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-300">
            <p className="text-xs text-gray-600">
              💰 The downpayment is held in escrow and will be released to you when you accept the job.
            </p>
          </div>
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

        {/* Warning Box */}
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important</p>
              <p>By accepting this invitation, you commit to completing the job as described. If you reject, the client will be refunded immediately.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAccept}
            disabled={loading || accepting}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {(loading || accepting) ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Accept Invitation</span>
              </>
            )}
          </button>

          <button
            onClick={() => onReject(job)}
            disabled={loading || accepting}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            <XCircle className="h-5 w-5" />
            <span>Reject Invitation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
