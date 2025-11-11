"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAgencyStats } from "@/lib/mockData";

export default function AgencyReviewsPage() {
  const stats = getAgencyStats();

  // For mock purposes, assume all reviews are positive fraction of reviewCount
  const totalReviews = stats.reviewCount || 0;
  const positiveReviews = Math.round(totalReviews * 0.7);
  const pendingReviews = Math.max(0, Math.round(totalReviews * 0.1));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Agency Reviews</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-sm text-gray-600">From {stats.totalJobs} jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Positive Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positiveReviews}</div>
              <p className="text-sm text-gray-600">Approximately {Math.round((positiveReviews/Math.max(1,totalReviews))*100)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-sm text-gray-600">Awaiting moderation</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Mock reviews are not available yet. Real reviews will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
