"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/generic_button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Star,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { JobDetail, JobDetailResponse } from "@/types/admin-job-detail";
import { JobTimelineVisualization } from "../../components/JobTimelineVisualization";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/jobs/listings/${jobId}`,
        {
          credentials: "include",
        },
      );
      const data: JobDetailResponse = await response.json();

      if (data.success && data.data) {
        setJob(data.data);
      } else {
        setError(data.error || "Failed to load job details");
      }
    } catch (error) {
      console.error("Error fetching job detail:", error);
      setError("An error occurred while loading job details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toUpperCase()) {
      case "HIGH":
        return "text-red-600 bg-red-50";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50";
      case "LOW":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Job</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">Job ID: #{job.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={getStatusBadgeVariant(job.status)}>
            {job.status.replace("_", " ")}
          </Badge>
          <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold">
                      ₱{(job.budget ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-sm">{job.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-sm">
                      {job.expected_duration || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Applications
                    </p>
                    <p className="font-semibold">{job.applications_count}</p>
                  </div>
                </div>
              </div>

              {job.materials_needed && job.materials_needed.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Materials Needed</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {job.materials_needed.map((material, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.category && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Category</h4>
                  <Badge variant="secondary">{job.category.name}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <JobTimelineVisualization
                timeline={job.timeline}
                photos={job.photos}
                workerName={job.worker?.name}
              />
            </CardContent>
          </Card>

          {/* Applications */}
          {job.applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applications ({job.applications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {app.worker.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{app.worker.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{app.worker.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ₱{(app.proposed_budget ?? 0).toLocaleString()}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {app.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied{" "}
                          {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {job.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {review.reviewer_name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {review.reviewer_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {review.comment}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                  {job.client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold">{job.client.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{job.client.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {job.client.email}
                  </span>
                </div>
                {job.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {job.client.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {job.client.location}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/admin/users/clients/${job.client.id}`)
                }
              >
                View Profile
              </Button>
            </CardContent>
          </Card>

          {/* Worker Information */}
          {job.worker && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned Worker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {job.worker.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold">{job.worker.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{job.worker.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {job.worker.email}
                    </span>
                  </div>
                  {job.worker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {job.worker.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {job.worker.completed_jobs} jobs completed
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/users/workers/${job.worker?.id}`)
                  }
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Escrow (50%)</span>
                <span className="font-semibold">
                  ₱{(job.escrow_amount ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Escrow Status</span>
                <Badge variant={job.escrow_paid ? "outline" : "destructive"}>
                  {job.escrow_paid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">
                  ₱{(job.remaining_payment ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Status</span>
                <Badge
                  variant={
                    job.remaining_payment_paid ? "outline" : "destructive"
                  }
                >
                  {job.remaining_payment_paid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Job ID</dt>
                <dd className="font-medium text-xs">#{job.id}</dd>

                <dt className="text-muted-foreground">Posted</dt>
                <dd className="font-medium text-xs">
                  {new Date(job.created_at).toLocaleDateString()}
                </dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-xs">
                  {job.status.toUpperCase()}
                </dd>

                <dt className="text-muted-foreground">Job Type</dt>
                <dd className="font-medium text-xs">{job.job_type}</dd>

                {job.completed_at && (
                  <>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="font-medium text-xs">
                      {new Date(job.completed_at).toLocaleDateString()}
                    </dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
