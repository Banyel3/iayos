"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Eye,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  User,
  Star,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface ActiveJob {
  id: string;
  title: string;
  description: string;
  category: Category | null;
  client: {
    id: string;
    name: string;
    rating: number;
  };
  worker: {
    id: string;
    name: string;
    rating: number;
  } | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  applications_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export default function ActiveJobsPage() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActiveJobs();
  }, [page]);

  const fetchActiveJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/jobs/listings?page=${page}&page_size=20&status=IN_PROGRESS`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Error fetching active jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.category?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading active jobs...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-600 mt-1">
              Monitor jobs currently in progress
            </p>
          </div>

          {/* Summary Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    Jobs In Progress
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {jobs.length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search active jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          IN PROGRESS
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Job Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-semibold">₱{job.budget}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold">{job.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Started</p>
                            <p className="font-semibold">
                              {new Date(job.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-500">Urgency</p>
                            <p className="font-semibold">{job.urgency}</p>
                          </div>
                        </div>
                      </div>

                      {/* Client and Worker Info */}
                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Client</p>
                            <Link
                              href={`/admin/users/clients/${job.client.id}`}
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {job.client.name}
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                              <span className="text-xs">
                                {job.client.rating}
                              </span>
                            </Link>
                          </div>
                        </div>

                        {job.worker && (
                          <>
                            <div className="text-gray-400">→</div>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Worker</p>
                                <Link
                                  href={`/admin/users/workers/${job.worker.id}`}
                                  className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {job.worker.name}
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                                  <span className="text-xs">
                                    {job.worker.rating}
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </>
                        )}

                        {job.category && (
                          <div className="ml-auto">
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-medium text-gray-900">
                              {job.category.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <Link href={`/admin/jobs/listings/${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Jobs
                </h3>
                <p className="text-gray-500">
                  There are currently no jobs in progress
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
