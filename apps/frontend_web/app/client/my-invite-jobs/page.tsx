'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import InviteJobCard from '@/components/client/jobs/InviteJobCard';

interface InviteTarget {
  id: number;
  name: string;
  type: 'AGENCY' | 'WORKER';
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

type TabType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALL';

export default function MyInviteJobsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [jobs, setJobs] = useState<InviteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode (dev only)
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchInviteJobs();
  }, []);

  // Refetch when tab changes
  useEffect(() => {
    if (!hasFetched.current) return; // Don't fetch on initial mount
    fetchInviteJobs();
  }, [activeTab]);

  const fetchInviteJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = activeTab === 'ALL' 
        ? `${apiUrl}/api/jobs/my-invite-jobs`
        : `${apiUrl}/api/jobs/my-invite-jobs?invite_status=${activeTab}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invite jobs: ${response.statusText}`);
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching invite jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invite jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs;

  const getTabCount = (status: TabType) => {
    if (status === 'ALL') return jobs.length;
    return jobs.filter(job => job.inviteStatus === status).length;
  };

  // Loading state
  if (loading && !hasFetched.current) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Job Invitations</h1>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading your invitations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => window.location.href = '/client/agencies'}
              className="text-gray-600 hover:text-gray-900 pb-1"
            >
              Browse Agencies
            </button>
            <button
              onClick={() => window.location.href = '/client/my-invite-jobs'}
              className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
            >
              My Invitations
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Invitations</h1>
          <p className="text-gray-600">Track the status of your direct job invitations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={fetchInviteJobs}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {/* All Tab */}
              <button
                onClick={() => setActiveTab('ALL')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ALL'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>All Invitations</span>
                  {getTabCount('ALL') > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === 'ALL'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getTabCount('ALL')}
                    </span>
                  )}
                </div>
              </button>

              {/* Pending Tab */}
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'PENDING'
                    ? 'border-yellow-600 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending</span>
                  {getTabCount('PENDING') > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getTabCount('PENDING')}
                    </span>
                  )}
                </div>
              </button>

              {/* Accepted Tab */}
              <button
                onClick={() => setActiveTab('ACCEPTED')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ACCEPTED'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Accepted</span>
                  {getTabCount('ACCEPTED') > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === 'ACCEPTED'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getTabCount('ACCEPTED')}
                    </span>
                  )}
                </div>
              </button>

              {/* Rejected Tab */}
              <button
                onClick={() => setActiveTab('REJECTED')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'REJECTED'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5" />
                  <span>Rejected</span>
                  {getTabCount('REJECTED') > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === 'REJECTED'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getTabCount('REJECTED')}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'ALL' && 'No Invitations Yet'}
              {activeTab === 'PENDING' && 'No Pending Invitations'}
              {activeTab === 'ACCEPTED' && 'No Accepted Invitations'}
              {activeTab === 'REJECTED' && 'No Rejected Invitations'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {activeTab === 'ALL' && "You haven't sent any job invitations yet. Browse agencies to hire directly."}
              {activeTab === 'PENDING' && 'All your invitations have been responded to.'}
              {activeTab === 'ACCEPTED' && "None of your invitations have been accepted yet."}
              {activeTab === 'REJECTED' && "None of your invitations have been rejected."}
            </p>
            {activeTab === 'ALL' && (
              <button
                onClick={() => window.location.href = '/client/agencies'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Agencies
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'invitation' : 'invitations'}
            </div>
            {filteredJobs.map((job) => (
              <InviteJobCard key={job.jobID} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
