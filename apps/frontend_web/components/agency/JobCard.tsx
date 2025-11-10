"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";

interface JobCategory {
  id: number;
  name: string;
}

interface JobClient {
  id: number;
  name: string;
  avatar: string | null;
  email: string;
}

interface Job {
  jobID: number;
  title: string;
  description: string;
  category: JobCategory | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  jobType: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  client: JobClient;
  createdAt: string;
  updatedAt: string;
}

interface JobCardProps {
  job: Job;
  onAccept: (jobId: number) => void;
  accepting: boolean;
}

export function JobCard({ job, onAccept, accepting }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {job.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.category.name}
                </Badge>
              )}
              <Badge
                className={`flex items-center gap-1 ${getUrgencyColor(job.urgency)}`}
              >
                <AlertCircle className="h-3 w-3" />
                {job.urgency}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatBudget(job.budget)}
            </div>
            <div className="text-sm text-gray-500">Project Budget</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>
            Posted by: <span className="font-medium">{job.client.name}</span>
          </span>
          <span className="text-gray-400">• {job.client.email}</span>
        </div>

        {/* Description */}
        <div>
          <p className={`text-gray-700 ${!expanded && "line-clamp-3"}`}>
            {job.description}
          </p>
          {job.description.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 text-sm font-medium mt-1 hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              <span className="font-medium">Location:</span> {job.location}
            </span>
          </div>

          {job.expectedDuration && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                <span className="font-medium">Duration:</span>{" "}
                {job.expectedDuration}
              </span>
            </div>
          )}

          {job.preferredStartDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                <span className="font-medium">Start Date:</span>{" "}
                {formatDate(job.preferredStartDate)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              <span className="font-medium">Posted:</span>{" "}
              {formatDate(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Job Type Badge */}
        <div className="pt-3 border-t">
          <Badge variant="outline" className="text-xs">
            {job.jobType === "INVITE" ? "🎯 Direct Hire" : "📋 Job Listing"}
          </Badge>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => onAccept(job.jobID)}
            disabled={accepting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {accepting ? "Starting Job..." : "Start Working on This Job"}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            You've been hired for this job
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
