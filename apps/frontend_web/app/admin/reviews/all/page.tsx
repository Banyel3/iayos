"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Star, Search, ThumbsUp, MessageSquare, User } from "lucide-react";
import { Sidebar } from "../../components";

interface Review {
  id: string;
  reviewer: { name: string; type: string };
  reviewee: { name: string; type: string };
  rating: number;
  comment: string;
  jobTitle: string;
  date: string;
}

const mockReviews: Review[] = [
  {
    id: "rev001",
    reviewer: { name: "John Doe", type: "Client" },
    reviewee: { name: "Maria Santos", type: "Worker" },
    rating: 5,
    comment: "Excellent work! Very professional and on time.",
    jobTitle: "Air Conditioner Repair",
    date: "2024-01-15",
  },
  {
    id: "rev002",
    reviewer: { name: "Sarah Lee", type: "Worker" },
    reviewee: { name: "Mike Chen", type: "Client" },
    rating: 4,
    comment: "Good communication, payment was prompt.",
    jobTitle: "Plumbing Installation",
    date: "2024-01-14",
  },
  {
    id: "rev003",
    reviewer: { name: "Anna Cruz", type: "Client" },
    reviewee: { name: "Tom Wilson", type: "Worker" },
    rating: 5,
    comment: "Amazing service! Highly recommended.",
    jobTitle: "Electrical Wiring",
    date: "2024-01-13",
  },
];

export default function AllReviewsPage() {
  const [reviews] = useState<Review[]>(mockReviews);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = reviews.filter(
    (r) =>
      r.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reviewee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">All Reviews</h1>
            <p className="text-muted-foreground">
              Platform reviews and ratings
            </p>
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
                <div className="text-2xl font-bold">{reviews.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgRating}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < Math.round(Number(avgRating)) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  5-Star Reviews
                </CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.rating === 5).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(
                    (reviews.filter((r) => r.rating === 5).length /
                      reviews.length) *
                      100
                  )}
                  % of all reviews
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">New reviews</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <p className="font-medium">{review.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Reviewer</p>
                          <p className="font-medium">{review.reviewer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ({review.reviewer.type})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Reviewed</p>
                          <p className="font-medium">{review.reviewee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ({review.reviewee.type})
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{review.comment}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
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
