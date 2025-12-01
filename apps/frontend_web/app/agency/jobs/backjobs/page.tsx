"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  MapPin,
  DollarSign,
  Tag,
  User,
  Camera,
  ArrowLeft,
} from "lucide-react";

interface BackjobItem {
  dispute_id: number;
  job_id: number;
  job_title: string;
  job_description: string;
  job_budget: number;
  job_location: string;
  job_category: string | null;
  reason: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  opened_date: string | null;
  resolution: string | null;
  resolved_date: string | null;
  evidence_images: string[];
  client: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
}

export default function AgencyBackjobsPage() {
  const router = useRouter();
  const [backjobs, setBackjobs] = useState<BackjobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "UNDER_REVIEW" | "RESOLVED">(
    "all"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBackjobs();
  }, [filter]);

  const fetchBackjobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        filter === "all"
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/jobs/my-backjobs`
          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/jobs/my-backjobs?status=${filter}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setBackjobs(data.backjobs || []);
      } else {
        setError("Failed to fetch backjobs");
      }
    } catch (err) {
      console.error("Error fetching backjobs:", err);
      setError("Failed to fetch backjobs");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Action Required
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <Badge variant="destructive">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-red-100 text-red-700">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-100 text-amber-700">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/agency/jobs")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backjobs</h1>
            <p className="text-gray-500">
              Jobs that clients have requested to be redone or fixed
            </p>
          </div>
          <Button onClick={fetchBackjobs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Action Required</p>
                <p className="text-2xl font-bold text-amber-600">
                  {backjobs.filter((b) => b.status === "UNDER_REVIEW").length}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {backjobs.filter((b) => b.status === "RESOLVED").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Backjobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {backjobs.length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <RefreshCw className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "UNDER_REVIEW" ? "default" : "outline"}
          onClick={() => setFilter("UNDER_REVIEW")}
          className={
            filter === "UNDER_REVIEW" ? "bg-amber-600 hover:bg-amber-700" : ""
          }
        >
          Action Required
        </Button>
        <Button
          variant={filter === "RESOLVED" ? "default" : "outline"}
          onClick={() => setFilter("RESOLVED")}
          className={
            filter === "RESOLVED" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          Completed
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Loading backjobs...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Button onClick={fetchBackjobs} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : backjobs.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Backjobs
              </h3>
              <p className="text-gray-500 max-w-md">
                You don&apos;t have any backjob requests at the moment. Great
                job keeping your clients happy!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {backjobs.map((backjob) => (
            <Card
              key={backjob.dispute_id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/agency/jobs/backjob/${backjob.dispute_id}?jobId=${backjob.job_id}`
                )
              }
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(backjob.status)}
                    {getPriorityBadge(backjob.priority)}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {backjob.job_title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {backjob.reason}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>₱{backjob.job_budget?.toLocaleString()}</span>
                  </div>
                  {backjob.job_category && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span>{backjob.job_category}</span>
                    </div>
                  )}
                  {backjob.job_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">
                        {backjob.job_location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    {backjob.client ? (
                      <>
                        {backjob.client.avatar ? (
                          <img
                            src={backjob.client.avatar}
                            alt={backjob.client.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <span className="text-sm text-gray-600">
                          {backjob.client.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Unknown client
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {backjob.evidence_images &&
                      backjob.evidence_images.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Camera className="w-4 h-4" />
                          <span>{backjob.evidence_images.length} photos</span>
                        </div>
                      )}
                    {backjob.opened_date && (
                      <span className="text-sm text-gray-400">
                        {formatDate(backjob.opened_date)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
