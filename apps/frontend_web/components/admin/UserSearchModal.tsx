"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  UserCheck,
  Building2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  type: "client" | "worker" | "agency";
  name: string;
  email: string;
  status: string;
  additional_info?: string;
}

interface GroupedResults {
  clients: SearchResult[];
  workers: SearchResult[];
  agencies: SearchResult[];
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "admin_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export default function UserSearchModal({
  isOpen,
  onClose,
}: UserSearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    clients: [],
    workers: [],
    agencies: [],
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ clients: [], workers: [], agencies: [] });
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      // Search across all three user types
      const [clientsRes, workersRes, agenciesRes] = await Promise.all([
        fetch(
          `http://localhost:8000/api/adminpanel/users/clients?search=${encodeURIComponent(query)}&page_size=5`,
          {
            credentials: "include",
          },
        ),
        fetch(
          `http://localhost:8000/api/adminpanel/users/workers?search=${encodeURIComponent(query)}&page_size=5`,
          {
            credentials: "include",
          },
        ),
        fetch(
          `http://localhost:8000/api/adminpanel/users/agencies?search=${encodeURIComponent(query)}&page_size=5`,
          {
            credentials: "include",
          },
        ),
      ]);

      const [clientsData, workersData, agenciesData] = await Promise.all([
        clientsRes.json(),
        workersRes.json(),
        agenciesRes.json(),
      ]);

      setResults({
        clients: clientsData.success
          ? clientsData.clients.map((c: any) => ({
              id: c.id,
              type: "client" as const,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              status: c.status,
              additional_info: `${c.job_stats?.total_jobs || 0} jobs`,
            }))
          : [],
        workers: workersData.success
          ? workersData.workers.map((w: any) => ({
              id: w.id,
              type: "worker" as const,
              name: `${w.first_name} ${w.last_name}`,
              email: w.email,
              status: w.status,
              additional_info: `${w.completed_jobs || 0} jobs · ⭐ ${w.rating?.toFixed(1) || "N/A"}`,
            }))
          : [],
        agencies: agenciesData.success
          ? agenciesData.agencies.map((a: any) => ({
              id: a.id,
              type: "agency" as const,
              name: a.agency_name,
              email: a.email,
              status: a.status,
              additional_info: `${a.total_workers || 0} workers`,
            }))
          : [],
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...recentSearches.filter((s) => s !== trimmed),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchTerm);
    const basePath =
      result.type === "client"
        ? "/admin/users/clients"
        : result.type === "worker"
          ? "/admin/users/workers"
          : "/admin/users/agency";
    router.push(`${basePath}/${result.id}`);
    onClose();
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchTerm(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const totalResults =
    results.clients.length + results.workers.length + results.agencies.length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 pt-20"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[600px] overflow-hidden flex flex-col"
      >
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {loading && (
              <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
            )}
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!searchTerm.trim() ? (
            // Recent Searches
            recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700"
                    >
                      <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  Search for clients, workers, or agencies
                </p>
                <p className="text-xs mt-1">by name, email, or ID</p>
              </div>
            )
          ) : totalResults === 0 && !loading ? (
            // No Results
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No users found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            // Search Results
            <div className="space-y-4">
              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                    <Users className="h-3 w-3 mr-2" />
                    Clients ({results.clients.length})
                  </h3>
                  <div className="space-y-1">
                    {results.clients.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.email}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                result.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {result.status}
                            </span>
                            {result.additional_info && (
                              <p className="text-xs text-gray-400 mt-1">
                                {result.additional_info}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Workers */}
              {results.workers.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                    <UserCheck className="h-3 w-3 mr-2" />
                    Workers ({results.workers.length})
                  </h3>
                  <div className="space-y-1">
                    {results.workers.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.email}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                result.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {result.status}
                            </span>
                            {result.additional_info && (
                              <p className="text-xs text-gray-400 mt-1">
                                {result.additional_info}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Agencies */}
              {results.agencies.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                    <Building2 className="h-3 w-3 mr-2" />
                    Agencies ({results.agencies.length})
                  </h3>
                  <div className="space-y-1">
                    {results.agencies.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.email}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                result.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {result.status}
                            </span>
                            {result.additional_info && (
                              <p className="text-xs text-gray-400 mt-1">
                                {result.additional_info}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
          Press <kbd className="px-2 py-1 bg-white border rounded">Esc</kbd> to
          close
        </div>
      </div>
    </div>
  );
}
