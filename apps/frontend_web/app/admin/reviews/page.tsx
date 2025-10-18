"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Search,
  Flag,
  User,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Sidebar } from "../components";
import Link from "next/link";

interface JobReview {
  jobId: string;
  jobTitle: string;
  category: string;
  completionDate: string;
  client: {
    id: string;
    name: string;
  };
  worker: {
    id: string;
    name: string;
  };
  clientReview?: {
    rating: number;
    comment: string;
    date: string;
  };
  workerReview?: {
    rating: number;
    comment: string;
    date: string;
  };
  reviewStatus: "completed" | "pending" | "none";
}

const jobReviews: JobReview[] = [
  {
    jobId: "COMP-001",
    jobTitle: "Interior Painting - Living Room",
    category: "Painting",
    completionDate: "2024-10-09",
    client: { id: "CLI-203", name: "David Martinez" },
    worker: { id: "WRK-114", name: "Carlos Rivera" },
    clientReview: {
      rating: 5.0,
      comment:
        "Carlos did an outstanding job! The painting is flawless and he was very professional throughout the entire process. He protected all furniture and cleaned up perfectly. Highly recommend!",
      date: "2024-10-10",
    },
    workerReview: {
      rating: 4.8,
      comment:
        "Great client to work with! David was very clear about his expectations and the workspace was well-prepared. Payment was prompt and communication was excellent.",
      date: "2024-10-10",
    },
    reviewStatus: "completed",
  },
  {
    jobId: "COMP-002",
    jobTitle: "Bathroom Plumbing Installation",
    category: "Plumbing",
    completionDate: "2024-10-05",
    client: { id: "CLI-210", name: "Lisa Anderson" },
    worker: { id: "WRK-115", name: "Robert Taylor" },
    clientReview: {
      rating: 4.9,
      comment:
        "Robert was extremely knowledgeable and professional. The plumbing installation was done perfectly and he even gave me helpful maintenance tips. Very satisfied with the work!",
      date: "2024-10-06",
    },
    workerReview: {
      rating: 4.7,
      comment:
        "Lisa was a wonderful client. The job site was accessible and she provided all necessary information upfront. Would gladly work with her again.",
      date: "2024-10-06",
    },
    reviewStatus: "completed",
  },
  {
    jobId: "COMP-003",
    jobTitle: "Garden Landscaping Design",
    category: "Landscaping",
    completionDate: "2024-10-02",
    client: { id: "CLI-211", name: "Nancy Wilson" },
    worker: { id: "WRK-116", name: "Miguel Santos" },
    clientReview: {
      rating: 5.0,
      comment:
        "Miguel transformed our backyard into a beautiful oasis! His attention to detail and creative design exceeded our expectations. The irrigation system works perfectly and the plants are thriving.",
      date: "2024-10-03",
    },
    workerReview: {
      rating: 5.0,
      comment:
        "Nancy was the perfect client! She trusted my expertise and was very supportive throughout the project. The property was beautiful to work with and payment was immediate.",
      date: "2024-10-03",
    },
    reviewStatus: "completed",
  },
  {
    jobId: "COMP-004",
    jobTitle: "Home Office Electrical Setup",
    category: "Electrical",
    completionDate: "2024-10-06",
    client: { id: "CLI-212", name: "Kevin Brown" },
    worker: { id: "WRK-117", name: "Anthony Lee" },
    reviewStatus: "pending",
  },
  {
    jobId: "COMP-005",
    jobTitle: "Deck Construction and Staining",
    category: "Carpentry",
    completionDate: "2024-09-30",
    client: { id: "CLI-213", name: "Patricia Moore" },
    worker: { id: "WRK-118", name: "William Harris" },
    clientReview: {
      rating: 4.9,
      comment:
        "William built us a gorgeous deck! The craftsmanship is top-notch and the staining looks beautiful. He completed the work on schedule and the deck is sturdy and well-built.",
      date: "2024-10-01",
    },
    workerReview: {
      rating: 4.8,
      comment:
        "Patricia was very organized and had a clear vision for the project. She was always available for questions and made timely decisions. Great experience!",
      date: "2024-10-01",
    },
    reviewStatus: "completed",
  },
  {
    jobId: "COMP-006",
    jobTitle: "Apartment Deep Cleaning",
    category: "Home Cleaning",
    completionDate: "2024-10-08",
    client: { id: "CLI-214", name: "Steven Clark" },
    worker: { id: "WRK-119", name: "Isabella Martinez" },
    clientReview: {
      rating: 4.7,
      comment:
        "Isabella did a thorough deep cleaning of our apartment. Every corner was spotless and she paid attention to all the details. Very professional and efficient service.",
      date: "2024-10-08",
    },
    workerReview: {
      rating: 4.5,
      comment:
        "Steven was respectful and the apartment was in reasonable condition for move-out cleaning. Payment was on time as agreed.",
      date: "2024-10-08",
    },
    reviewStatus: "completed",
  },
  {
    jobId: "COMP-007",
    jobTitle: "Tile Installation - Kitchen Backsplash",
    category: "Tile Work",
    completionDate: "2024-10-07",
    client: { id: "CLI-215", name: "Christopher White" },
    worker: { id: "WRK-120", name: "Ricardo Lopez" },
    reviewStatus: "none",
  },
  {
    jobId: "COMP-008",
    jobTitle: "Window Replacement Service",
    category: "Windows & Doors",
    completionDate: "2024-10-01",
    client: { id: "CLI-216", name: "Michelle Johnson" },
    worker: { id: "WRK-121", name: "Daniel Rodriguez" },
    clientReview: {
      rating: 5.0,
      comment:
        "Daniel did an exceptional job replacing our windows! The installation was perfect and the new windows have already made a noticeable difference in our home's temperature. Very professional and clean work.",
      date: "2024-10-02",
    },
    workerReview: {
      rating: 4.9,
      comment:
        "Michelle was an excellent client! She had realistic expectations and was very accommodating with scheduling. The job site was well-prepared and payment was prompt.",
      date: "2024-10-02",
    },
    reviewStatus: "completed",
  },
];

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredReviews = jobReviews.filter((job) => {
    const matchesSearch =
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.worker.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || job.reviewStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalJobs = jobReviews.length;
  const jobsWithReviews = jobReviews.filter(
    (j) => j.reviewStatus === "completed"
  ).length;
  const totalReviews = jobReviews.reduce((sum, job) => {
    let count = 0;
    if (job.clientReview) count++;
    if (job.workerReview) count++;
    return sum + count;
  }, 0);

  const allRatings: number[] = [];
  jobReviews.forEach((job) => {
    if (job.clientReview) allRatings.push(job.clientReview.rating);
    if (job.workerReview) allRatings.push(job.workerReview.rating);
  });
  const avgRating =
    allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
      : "0.0";

  const positiveReviews = allRatings.filter((r) => r >= 4.5).length;
  const pendingReviews = jobReviews.filter(
    (j) => j.reviewStatus === "pending"
  ).length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reviews Management
            </h1>
            <p className="text-muted-foreground">
              Monitor job reviews from clients and workers
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                From {jobsWithReviews} jobs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Positive Reviews
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positiveReviews}</div>
              <p className="text-xs text-muted-foreground">
                {allRatings.length > 0
                  ? Math.round((positiveReviews / allRatings.length) * 100)
                  : 0}
                % rated 4.5+
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Flag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting feedback</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Reviews</CardTitle>
            <CardDescription>
              Reviews organized by completed jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by job title, category, client, or worker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      statusFilter === "completed" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                  >
                    Completed
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "none" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("none")}
                  >
                    No Reviews
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredReviews.map((job) => (
            <Card key={job.jobId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/jobs/completed/${job.jobId}`}
                        className="text-xl font-semibold hover:underline"
                      >
                        {job.jobTitle}
                      </Link>
                      <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold">
                        {job.category}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          job.reviewStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : job.reviewStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.reviewStatus === "completed"
                          ? "Reviews Complete"
                          : job.reviewStatus === "pending"
                            ? "Reviews Pending"
                            : "No Reviews"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Completed{" "}
                        {new Date(job.completionDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-xs">{job.jobId}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Link
                        href={`/admin/users/clients/${job.client.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.client.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        (Client)
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <Link
                        href={`/admin/users/workers/${job.worker.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.worker.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        (Worker)
                      </span>
                    </div>
                    {job.clientReview && (
                      <div className="flex items-center gap-2">
                        {renderStars(job.clientReview.rating)}
                        <span className="font-semibold">
                          {job.clientReview.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {job.clientReview ? (
                    <div>
                      <p className="text-gray-700 italic mb-1">
                        "{job.clientReview.comment}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.clientReview.date).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {job.reviewStatus === "pending"
                        ? "Review pending from client"
                        : "No review submitted"}
                    </p>
                  )}
                </div>

                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-green-600" />
                      <Link
                        href={`/admin/users/workers/${job.worker.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.worker.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        (Worker)
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <Link
                        href={`/admin/users/clients/${job.client.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.client.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        (Client)
                      </span>
                    </div>
                    {job.workerReview && (
                      <div className="flex items-center gap-2">
                        {renderStars(job.workerReview.rating)}
                        <span className="font-semibold">
                          {job.workerReview.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {job.workerReview ? (
                    <div>
                      <p className="text-gray-700 italic mb-1">
                        "{job.workerReview.comment}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.workerReview.date).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {job.reviewStatus === "pending"
                        ? "Review pending from worker"
                        : "No review submitted"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReviews.length === 0 && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No reviews found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
