"use client";

import { useState, useEffect } from "react";
import { Sidebar, useMainContentClass } from "../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Banknote,
    Search,
    Eye,
    AlertTriangle,
    Clock,
    CheckCircle,
    Calendar,
    TrendingUp,
    FileText,
    Users,
    MessageSquare,
    ChevronRight,
    XCircle,
} from "lucide-react";
import Link from "next/link";

interface BackJob {
    id: string;
    dispute_id: number;
    job_id: string;
    job_title: string;
    category: string | null;
    requested_by: "client" | "worker";
    client: {
        id: string;
        name: string;
    };
    worker: {
        id: string;
        name: string;
    } | null;
    reason: string;
    description: string;
    requested_date: string;
    status:
    | "pending"
    | "in_negotiation"
    | "under_review"
    | "approved"
    | "rejected"
    | "completed";
    priority: "low" | "medium" | "high" | "urgent";
    job_amount: number;
    backjob_amount: number;
    resolution?: string | null;
    resolved_date?: string | null;
    assigned_to?: string | null;
}

interface BackJobStats {
    total_disputes: number;
    open_disputes: number;
    in_negotiation: number;
    under_review: number;
    resolved_disputes: number;
    urgent_requests: number;
    critical_disputes: number;
    total_disputed_amount: number;
}

export default function DisputesPage() {
    const mainClass = useMainContentClass("p-8 min-h-screen");
    const [backjobs, setBackjobs] = useState<BackJob[]>([]);
    const [stats, setStats] = useState<BackJobStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchDisputes();
    }, [page, statusFilter, priorityFilter]);

    const fetchStats = async () => {
        try {
            const response = await fetch(
                `${API_BASE}/api/adminpanel/jobs/disputes/stats`,
                { credentials: "include" },
            );
            const data = await response.json();
            if (data.success) setStats(data.stats);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchDisputes = async () => {
        try {
            setIsLoading(true);
            let url = `${API_BASE}/api/adminpanel/jobs/disputes?page=${page}&page_size=20`;
            if (statusFilter !== "all") url += `&status=${statusFilter}`;
            if (priorityFilter !== "all") url += `&priority=${priorityFilter}`;
            const response = await fetch(url, { credentials: "include" });
            const data = await response.json();
            if (data.success) {
                setBackjobs(data.disputes);
                setTotalPages(data.total_pages);
            }
        } catch (error) {
            console.error("Error fetching disputes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredJobs = backjobs.filter((job) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            job.job_title.toLowerCase().includes(query) ||
            job.reason.toLowerCase().includes(query) ||
            job.description.toLowerCase().includes(query) ||
            job.client.name.toLowerCase().includes(query) ||
            (job.worker?.name.toLowerCase().includes(query) ?? false);
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pending Review</Badge>;
            case "in_negotiation":
                return <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100">In Negotiation</Badge>;
            case "under_review":
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Under Review</Badge>;
            case "approved":
                return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Approved</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Rejected</Badge>;
            case "completed":
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">Completed</Badge>;
            default:
                return null;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "urgent":
                return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Urgent</Badge>;
            case "high":
                return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">High</Badge>;
            case "medium":
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Medium</Badge>;
            case "low":
                return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Low</Badge>;
            default:
                return null;
        }
    };

    if (isLoading && !stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Sidebar />
                <main className={mainClass}>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                                <AlertTriangle className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="mt-6 text-lg font-medium text-gray-700">Loading disputes...</p>
                            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the data</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar />
            <main className={mainClass}>
                <div className="max-w-7xl mx-auto space-y-8 pt-10">
                    {/* Header */}
                    <div className="pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-1">
                            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Disputes & Back Jobs</h1>
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Dispute resolutions and back job request management
                        </p>
                    </div>

                    {/* Summary Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <CardContent className="py-1.5 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-sky-100 rounded-lg"><FileText className="h-5 w-5 text-sky-600" /></div>
                                        <TrendingUp className="h-4 w-4 text-sky-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Total Requests</p>
                                    <p className="text-xl font-bold text-gray-900">{stats.total_disputes}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <CardContent className="py-1.5 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
                                        <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Review</p>
                                    <p className="text-xl font-bold text-yellow-600">{stats.open_disputes}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <CardContent className="py-1.5 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-sky-100 rounded-lg"><MessageSquare className="h-5 w-5 text-sky-600" /></div>
                                        <div className="h-1.5 w-1.5 bg-sky-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">In Negotiation</p>
                                    <p className="text-xl font-bold text-sky-600">{stats.in_negotiation ?? 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <CardContent className="py-1.5 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full opacity-50"></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Approved</p>
                                    <p className="text-xl font-bold text-green-600">{stats.resolved_disputes}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <CardContent className="py-1.5 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                                        <div className="h-1.5 w-1.5 bg-red-500 rounded-full opacity-50"></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Urgent</p>
                                    <p className="text-xl font-bold text-red-600">{stats.critical_disputes}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by title, user, reason, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_negotiation">In Negotiation</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-6 h-12 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm"
                        >
                            <option value="all">All Priority</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    {/* Job Cards */}
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <Card
                                key={job.dispute_id || job.id}
                                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                            >
                                <CardContent className="relative p-4 sm:p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3 flex-wrap">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {job.job_title}
                                                    </h3>
                                                    {getStatusBadge(job.status)}
                                                    {getPriorityBadge(job.priority)}
                                                    <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100">
                                                        {job.requested_by === "client" ? "Client" : "Worker"} Request
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        <span className="text-gray-500">Reason:</span> {job.reason}
                                                    </p>
                                                    <p className="text-gray-600 leading-relaxed line-clamp-2">{job.description}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                                                    <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg"><Banknote className="h-4 w-4 text-[#00BAF1]" /></div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">Job Amount</p>
                                                        <p className="font-bold text-gray-900">₱{(job.job_amount ?? 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                                                    <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg"><Calendar className="h-4 w-4 text-[#00BAF1]" /></div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">Requested</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {job.requested_date ? new Date(job.requested_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                                                    <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg"><FileText className="h-4 w-4 text-[#00BAF1]" /></div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">Dispute ID</p>
                                                        <p className="font-bold text-gray-900">#{job.dispute_id}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Client:</span>
                                                    <Link href={`/admin/users/clients/${job.client.id}`} className="text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline flex items-center gap-1">
                                                        {job.client.name}<ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                                {job.worker && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Worker:</span>
                                                        <Link href={`/admin/users/workers/${job.worker.id}`} className="text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline flex items-center gap-1">
                                                            {job.worker.name}<ChevronRight className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                )}
                                                {job.category && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Category:</span>
                                                        <Badge variant="secondary" className="font-medium">{job.category}</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 sm:gap-3">
                                            <Link href={`/admin/disputes/${job.dispute_id}`}>
                                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Review
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredJobs.length === 0 && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-16 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                                    <AlertTriangle className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No disputes found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">No disputes match your filters. Try adjusting your search criteria.</p>
                            </CardContent>
                        </Card>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1} className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50">
                                Previous
                            </Button>
                            <div className="flex items-center gap-2 px-6 h-11 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">Page <span className="text-blue-600 font-bold">{page}</span> of {totalPages}</span>
                            </div>
                            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="h-11 px-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50">
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
