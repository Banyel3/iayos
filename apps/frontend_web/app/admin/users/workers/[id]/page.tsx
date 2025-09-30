"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  startingRate: number;
  status: "verified" | "banned" | "suspended";
  joinDate: string;
  completedJobs: number;
  totalJobs: number;
  jobTitle: string;
  experience: string;
}

export default function WorkerDetailPage() {
  const { id } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    async function fetchWorker() {
      try {
        const res = await fetch(`/api/workers/${id}`);
        const data = await res.json();
        setWorker(data);
      } catch (err) {
        console.error("Failed to fetch worker:", err);
      }
    }
    if (id) fetchWorker();
  }, [id]);

  if (!worker) {
    return <div className="p-6">Loading worker details...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => history.back()}>
        ← Back
      </Button>

      {/* Worker Header */}
      <h1 className="text-2xl font-semibold">Worker Profile #{worker.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Worker Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-6">
            {/* Placeholder Circle Avatar */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-200"></div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{worker.name}</h2>
                <p className="text-sm text-gray-500">{worker.jobTitle}</p>
              </div>
              <p className="text-lg font-semibold">₱{worker.startingRate}</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <p>
                <strong>Ratings:</strong> {worker.rating} ⭐
              </p>
              <p>
                <strong>Total Jobs:</strong> {worker.totalJobs}
              </p>
              <p>
                <strong>Jobs Completed:</strong> {worker.completedJobs}
              </p>
              <p>
                <strong>Experience:</strong> {worker.experience}
              </p>
              <p>
                <strong>Status:</strong> {worker.status}
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {new Date(worker.joinDate).toLocaleDateString()}
              </p>
            </div>

            {/* Skills */}
            <div>
              <p className="font-medium">Skills</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {worker.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs (Jobs, Transactions, Disputes) */}
            <Tabs defaultValue="jobs" className="mt-6">
              <TabsList>
                <TabsTrigger value="jobs">Jobs & Reviews</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="mt-4">
                {/* Example Job Item */}
                <Card className="p-4">
                  <p className="text-sm font-semibold">Ceiling Fan Repair</p>
                  <p className="text-xs text-gray-500">Completed · ₱300</p>
                  <p className="text-xs mt-2 italic">"my fan is ok na hehe"</p>
                  <div className="flex items-center mt-1 text-yellow-500">
                    <Star className="h-4 w-4" /> 5.0
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                <p>Transactions data here...</p>
              </TabsContent>
              <TabsContent value="disputes" className="mt-4">
                <p>Disputes data here...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Status and User Details Panel */}
        <div className="space-y-4 lg:max-w-xs lg:ml-auto">
          {/* Status card */}
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div>
                {/* Full width bordered status bar */}
                <div className="w-full border rounded-md bg-white">
                  <div className="bg-blue-50 text-center text-xs text-blue-600 font-semibold py-2 rounded-md">
                    {worker.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Add a note"
                  className="w-full rounded border border-gray-200 p-2 text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="destructive" className="w-full justify-center">
                  <span className="mr-2">⦸</span>Ban
                </Button>
                <Button variant="outline" className="w-full justify-center">
                  <span className="mr-2">⏸</span>Suspend
                </Button>
                <Button variant="outline" className="w-full justify-center">
                  Reset Password
                </Button>
                <Button variant="default" className="w-full justify-center">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User details card */}
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">User Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Use a description list to align labels and values */}
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">User Type</dt>
                <dd className="font-medium">Worker</dd>

                <dt className="text-gray-500">User ID</dt>
                <dd className="font-medium">#{worker.id}</dd>

                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{worker.email}</dd>

                <dt className="text-gray-500">Phone Number</dt>
                <dd className="font-medium">{worker.phone}</dd>

                <dt className="text-gray-500">Date of Birth</dt>
                <dd className="font-medium">
                  {(worker as any).dateOfBirth
                    ? new Date((worker as any).dateOfBirth).toLocaleDateString()
                    : "—"}
                </dd>

                <dt className="text-gray-500">Date Joined</dt>
                <dd className="font-medium">
                  {new Date(worker.joinDate).toLocaleDateString()}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
