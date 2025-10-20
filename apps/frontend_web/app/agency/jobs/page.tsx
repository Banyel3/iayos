"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AgencyJobsPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Jobs & Assignments</h1>
        <Card>
          <CardHeader>
            <CardTitle>Job Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Your agency's jobs will appear here once KYC is completed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
