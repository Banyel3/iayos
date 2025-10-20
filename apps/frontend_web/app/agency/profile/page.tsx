"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAgencyStats } from "@/lib/mockData";

export default function AgencyProfilePage() {
  const stats = getAgencyStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Agency Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{stats.name}</p>
            <p className="text-sm text-gray-600">
              Workers: {stats.totalWorkers}
            </p>
            <p className="text-sm text-gray-600">Jobs: {stats.totalJobs}</p>
            <p className="text-sm text-gray-600">
              Rating: {stats.avgRating} ({stats.reviewCount} reviews)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
