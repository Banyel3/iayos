"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Flag,
  Star,
  Search,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Sidebar } from "../../components";

interface FlaggedReview {
  id: string;
  reviewer: { name: string; type: string };
  reviewee: { name: string; type: string };
  rating: number;
  comment: string;
  reason: string;
  flaggedBy: string;
  date: string;
  status: "pending" | "reviewed" | "removed";
}

const mockFlaggedReviews: FlaggedReview[] = [
  {
    id: "flag001",
    reviewer: { name: "John Smith", type: "Client" },
    reviewee: { name: "Maria Santos", type: "Worker" },
    rating: 1,
    comment:
      "This worker was completely unprofessional and used inappropriate language. The work was not done properly and they damaged my property. I would never recommend them to anyone!",
    reason: "Inappropriate Content",
    flaggedBy: "System Auto-detect",
    date: "2024-10-16",
    status: "pending",
  },
  {
    id: "flag002",
    reviewer: { name: "Tom Wilson", type: "Worker" },
    reviewee: { name: "Sarah Lee", type: "Client" },
    rating: 1,
    comment:
      "This client made false accusations about my work and refused to pay. They are trying to scam workers and should be banned from the platform immediately!",
    reason: "False Information",
    flaggedBy: "User Report",
    date: "2024-10-15",
    status: "reviewed",
  },
  {
    id: "flag003",
    reviewer: { name: "Mike Johnson", type: "Client" },
    reviewee: { name: "Pedro Alvarez", type: "Worker" },
    rating: 1,
    comment:
      "Terrible experience. This person is a complete fraud and scammer. They took my money and never showed up. Contact info: [PHONE NUMBER] [EMAIL]",
    reason: "Personal Information Disclosure",
    flaggedBy: "System Auto-detect",
    date: "2024-10-14",
    status: "pending",
  },
  {
    id: "flag004",
    reviewer: { name: "Anna Martinez", type: "Worker" },
    reviewee: { name: "Robert Chen", type: "Client" },
    rating: 1,
    comment:
      "This client was extremely rude and discriminatory. Made offensive comments about my background. Hostile work environment. Should not be allowed on platform.",
    reason: "Harassment/Discrimination",
    flaggedBy: "User Report",
    date: "2024-10-13",
    status: "pending",
  },
  {
    id: "flag005",
    reviewer: { name: "David Park", type: "Client" },
    reviewee: { name: "Lisa Wong", type: "Worker" },
    rating: 1,
    comment:
      "Worst service ever! Complete waste of money. They clearly don't know what they're doing. Save yourself the trouble and hire someone else. Incompetent and lazy!",
    reason: "Abusive Language",
    flaggedBy: "User Report",
    date: "2024-10-12",
    status: "reviewed",
  },
  {
    id: "flag006",
    reviewer: { name: "James Brown", type: "Worker" },
    reviewee: { name: "Jennifer Taylor", type: "Client" },
    rating: 1,
    comment:
      "Client violated safety protocols and put me at risk. Dangerous work environment with no proper equipment. This is illegal and the client should face consequences!",
    reason: "Safety Violation Report",
    flaggedBy: "System Auto-detect",
    date: "2024-10-11",
    status: "pending",
  },
  {
    id: "flag007",
    reviewer: { name: "Emily Davis", type: "Client" },
    reviewee: { name: "Carlos Rodriguez", type: "Worker" },
    rating: 1,
    comment:
      "This review is spam. Click here for amazing deals! Visit our website for discount services. Don't use this platform, go to competitor site instead!",
    reason: "Spam/Advertisement",
    flaggedBy: "Multiple User Reports",
    date: "2024-10-10",
    status: "removed",
  },
  {
    id: "flag008",
    reviewer: { name: "Michael Lee", type: "Worker" },
    reviewee: { name: "Amanda Foster", type: "Client" },
    rating: 1,
    comment:
      "Client made threatening statements and created an unsafe situation. I felt physically threatened and had to leave the job site. This behavior is unacceptable!",
    reason: "Threat/Violence",
    flaggedBy: "System Auto-detect",
    date: "2024-10-09",
    status: "pending",
  },
  {
    id: "flag009",
    reviewer: { name: "Susan White", type: "Client" },
    reviewee: { name: "Ricardo Santos", type: "Worker" },
    rating: 1,
    comment:
      "Worker arrived drunk and completely unprofessional. Damaged my property worth thousands of dollars. Criminal behavior! They should be in jail not on this platform!",
    reason: "Defamatory Content",
    flaggedBy: "User Report",
    date: "2024-10-08",
    status: "reviewed",
  },
  {
    id: "flag010",
    reviewer: { name: "Thomas Anderson", type: "Worker" },
    reviewee: { name: "Patricia Moore", type: "Client" },
    rating: 1,
    comment:
      "Fake review - I never worked for this client. Someone is creating false reviews to damage my reputation. This is identity theft and defamation!",
    reason: "Fraudulent Review",
    flaggedBy: "User Report",
    date: "2024-10-07",
    status: "pending",
  },
];

export default function FlaggedReviewsPage() {
  const [reviews] = useState<FlaggedReview[]>(mockFlaggedReviews);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = reviews.filter(
    (r) =>
      r.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reviewee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Flagged Reviews</h1>
            <p className="text-muted-foreground">
              Reviews flagged for moderation
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Flagged
                </CardTitle>
                <Flag className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviews.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Review
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Under Review
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.status === "reviewed").length}
                </div>
                <p className="text-xs text-muted-foreground">Being assessed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Removed</CardTitle>
                <Trash2 className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.status === "removed").length}
                </div>
                <p className="text-xs text-muted-foreground">Taken down</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Flagged Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flagged reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="border-red-200">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-red-600">
                            {review.reason}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Flagged by: {review.flaggedBy} •{" "}
                            {new Date(review.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          review.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : review.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                      <div>
                        <p className="text-muted-foreground">Reviewer</p>
                        <p className="font-medium">{review.reviewer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ({review.reviewer.type})
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reviewed</p>
                        <p className="font-medium">{review.reviewee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ({review.reviewee.type})
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Context
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Review
                      </Button>
                      <Button variant="default" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Dismiss Flag
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
