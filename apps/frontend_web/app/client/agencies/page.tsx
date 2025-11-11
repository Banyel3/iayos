"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AgencyCard from "@/components/client/agencies/AgencyCard";
import AgencySearchBar from "@/components/client/agencies/AgencySearchBar";
import AgencyFilters, {
  FilterState,
} from "@/components/client/agencies/AgencyFilters";
import { ChevronLeft, ChevronRight, Loader2, Building2 } from "lucide-react";

interface Agency {
  agencyId: number;
  businessName: string;
  businessDesc: string | null;
  city: string | null;
  province: string | null;
  averageRating: number | null;
  totalReviews: number;
  completedJobs: number;
  activeJobs: number;
  kycStatus: string;
  specializations: string[];
}

interface BrowseResponse {
  agencies: Agency[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function AgenciesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    city: "",
    province: "",
    minRating: null,
    sortBy: "rating",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: filters.sortBy,
      });

      if (filters.city) params.append("city", filters.city);
      if (filters.province) params.append("province", filters.province);
      if (filters.minRating)
        params.append("min_rating", filters.minRating.toString());

      // Use search endpoint if there's a query, otherwise browse
      const endpoint = searchQuery
        ? `/api/client/agencies/search?q=${encodeURIComponent(searchQuery)}&limit=50`
        : `/api/client/agencies/browse?${params.toString()}`;

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agencies");
      }

      const data: BrowseResponse = await response.json();
      setAgencies(data.agencies);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      console.error("Error fetching agencies:", err);
      setError("Failed to load agencies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, searchQuery]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/client/agencies")}
              className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
            >
              Browse Agencies
            </button>
            <button
              onClick={() => router.push("/client/my-invite-jobs")}
              className="text-gray-600 hover:text-gray-900 pb-1"
            >
              My Invitations
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Verified Agencies
          </h1>
          <p className="text-gray-600">
            Browse and hire trusted, KYC-verified agencies for your projects
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <AgencySearchBar onSearch={handleSearch} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <AgencyFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Agencies Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading agencies...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchAgencies}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : agencies.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Agencies Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try different keywords.`
                    : "Try adjusting your filters to see more results."}
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {agencies.length} of {pagination.total} agencies
                  {searchQuery && ` for "${searchQuery}"`}
                </div>

                {/* Agencies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {agencies.map((agency) => (
                    <AgencyCard key={agency.agencyId} agency={agency} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && !searchQuery && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - pagination.page) <= 1
                          );
                        })
                        .map((page, idx, arr) => (
                          <>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span
                                key={`ellipsis-${page}`}
                                className="px-2 text-gray-400"
                              >
                                ...
                              </span>
                            )}
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 rounded-md ${
                                pagination.page === page
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          </>
                        ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgenciesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      }
    >
      <AgenciesPageContent />
    </Suspense>
  );
}
