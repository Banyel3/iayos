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
    comment:
      "Excellent work! Very professional and on time. Maria fixed our AC unit quickly and efficiently. The cooling is working perfectly now and she even cleaned up after herself. Will definitely hire again!",
    jobTitle: "Air Conditioner Repair",
    date: "2024-10-15",
  },
  {
    id: "rev002",
    reviewer: { name: "Maria Santos", type: "Worker" },
    reviewee: { name: "John Doe", type: "Client" },
    rating: 5,
    comment:
      "Great client! Clear instructions, payment was prompt. The work environment was professional and everything was well organized. Highly recommend working with John.",
    jobTitle: "Air Conditioner Repair",
    date: "2024-10-15",
  },
  {
    id: "rev003",
    reviewer: { name: "Sarah Lee", type: "Client" },
    reviewee: { name: "James Rodriguez", type: "Worker" },
    rating: 4,
    comment:
      "Good work overall. James arrived on time and completed the plumbing installation. Minor issue with cleanup but the job was done well. Would hire again.",
    jobTitle: "Plumbing Installation",
    date: "2024-10-14",
  },
  {
    id: "rev004",
    reviewer: { name: "James Rodriguez", type: "Worker" },
    reviewee: { name: "Sarah Lee", type: "Client" },
    rating: 5,
    comment:
      "Excellent client! Very understanding and provided all necessary materials. Payment was prompt and communication was clear throughout the project.",
    jobTitle: "Plumbing Installation",
    date: "2024-10-14",
  },
  {
    id: "rev005",
    reviewer: { name: "Michael Chen", type: "Client" },
    reviewee: { name: "Pedro Alvarez", type: "Worker" },
    rating: 5,
    comment:
      "Amazing service! Pedro did an outstanding job with the electrical wiring. Very knowledgeable, safe practices, and explained everything clearly. Highly recommended!",
    jobTitle: "Electrical Wiring",
    date: "2024-10-13",
  },
  {
    id: "rev006",
    reviewer: { name: "Pedro Alvarez", type: "Worker" },
    reviewee: { name: "Michael Chen", type: "Client" },
    rating: 5,
    comment:
      "Great experience! Michael was very professional and prepared. All materials were ready and he made the job easy. Would definitely work with him again.",
    jobTitle: "Electrical Wiring",
    date: "2024-10-13",
  },
  {
    id: "rev007",
    reviewer: { name: "Anna Cruz", type: "Client" },
    reviewee: { name: "Lisa Wong", type: "Worker" },
    rating: 5,
    comment:
      "Lisa did an exceptional job cleaning our office. Very thorough and paid attention to every detail. The space looks brand new! Professional and reliable service.",
    jobTitle: "Office Deep Cleaning",
    date: "2024-10-12",
  },
  {
    id: "rev008",
    reviewer: { name: "Lisa Wong", type: "Worker" },
    reviewee: { name: "Anna Cruz", type: "Client" },
    rating: 5,
    comment:
      "Wonderful client! Anna was very respectful and appreciative of the work. Clear expectations and prompt payment. Would love to work together again.",
    jobTitle: "Office Deep Cleaning",
    date: "2024-10-12",
  },
  {
    id: "rev009",
    reviewer: { name: "Robert Taylor", type: "Client" },
    reviewee: { name: "Carlos Mendez", type: "Worker" },
    rating: 4,
    comment:
      "Good carpentry work. Carlos built the custom shelves as requested. Took a bit longer than expected but the quality is solid. Happy with the final result.",
    jobTitle: "Custom Carpentry",
    date: "2024-10-11",
  },
  {
    id: "rev010",
    reviewer: { name: "Carlos Mendez", type: "Worker" },
    reviewee: { name: "Robert Taylor", type: "Client" },
    rating: 4,
    comment:
      "Decent project. Some miscommunication on measurements but we sorted it out. Client was patient and understanding. Payment was on time.",
    jobTitle: "Custom Carpentry",
    date: "2024-10-11",
  },
  {
    id: "rev011",
    reviewer: { name: "Jennifer Park", type: "Client" },
    reviewee: { name: "Thomas Lee", type: "Worker" },
    rating: 5,
    comment:
      "Thomas painted our entire house beautifully! The colors are perfect and the finish is flawless. He was clean, punctual, and very professional. Exceeded expectations!",
    jobTitle: "House Painting",
    date: "2024-10-10",
  },
  {
    id: "rev012",
    reviewer: { name: "Thomas Lee", type: "Worker" },
    reviewee: { name: "Jennifer Park", type: "Client" },
    rating: 5,
    comment:
      "Fantastic client! Jennifer had great taste in colors and was very organized. The house was well-prepared for painting. Smooth project from start to finish.",
    jobTitle: "House Painting",
    date: "2024-10-10",
  },
  {
    id: "rev013",
    reviewer: { name: "David Kim", type: "Client" },
    reviewee: { name: "Elena Reyes", type: "Worker" },
    rating: 3,
    comment:
      "Decent work but had some communication issues. Elena completed the garden landscaping but not exactly as discussed. Had to request some changes. Final result is okay.",
    jobTitle: "Garden Landscaping",
    date: "2024-10-09",
  },
  {
    id: "rev014",
    reviewer: { name: "Elena Reyes", type: "Worker" },
    reviewee: { name: "David Kim", type: "Client" },
    rating: 3,
    comment:
      "Project had some challenges. Instructions changed midway through the work which caused delays. Payment was fine but communication could have been better.",
    jobTitle: "Garden Landscaping",
    date: "2024-10-09",
  },
  {
    id: "rev015",
    reviewer: { name: "Amanda Foster", type: "Client" },
    reviewee: { name: "Ricardo Santos", type: "Worker" },
    rating: 5,
    comment:
      "Ricardo is a master plumber! Fixed our leaking pipes perfectly and even spotted a potential issue we didn't know about. Very honest and skilled. Will call him for all plumbing needs!",
    jobTitle: "Emergency Plumbing Repair",
    date: "2024-10-08",
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
