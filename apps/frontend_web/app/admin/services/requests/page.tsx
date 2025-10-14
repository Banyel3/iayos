"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Inbox, Search, CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { Sidebar } from "../../components";

interface ServiceRequest {
  id: string;
  categoryName: string;
  description: string;
  requestedBy: { name: string; email: string; type: string };
  reason: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  votes: number;
}

const mockRequests: ServiceRequest[] = [
  {
    id: "req001",
    categoryName: "Smart Home Installation",
    description: "Installation and setup of smart home devices and systems",
    requestedBy: { name: "John Doe", email: "john@email.com", type: "Worker" },
    reason: "Growing demand for smart home technology integration",
    date: "2024-01-15",
    status: "pending",
    votes: 24,
  },
  {
    id: "req002",
    categoryName: "Solar Panel Installation",
    description: "Installation and maintenance of solar energy systems",
    requestedBy: {
      name: "Maria Santos",
      email: "maria@email.com",
      type: "Client",
    },
    reason: "Increasing interest in renewable energy solutions",
    date: "2024-01-14",
    status: "pending",
    votes: 18,
  },
  {
    id: "req003",
    categoryName: "Pest Control",
    description: "Pest inspection, treatment, and prevention services",
    requestedBy: { name: "Tom Wilson", email: "tom@email.com", type: "Worker" },
    reason: "Common household need with steady demand",
    date: "2024-01-13",
    status: "approved",
    votes: 32,
  },
];

export default function ServiceRequestsPage() {
  const [requests] = useState<ServiceRequest[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = requests.filter((req) =>
    req.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Service Requests</h1>
            <p className="text-muted-foreground">
              New service category requests
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground">Need review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "approved").length}
                </div>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "rejected").length}
                </div>
                <p className="text-xs text-muted-foreground">Declined</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search service requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {request.categoryName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Requested on{" "}
                          {new Date(request.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          request.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="text-sm">{request.description}</p>

                    <div className="border-t pt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Requested By</p>
                          <p className="font-medium">
                            {request.requestedBy.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedBy.email} (
                            {request.requestedBy.type})
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Community Votes
                          </p>
                          <p className="text-2xl font-bold">{request.votes}</p>
                          <p className="text-xs text-muted-foreground">
                            Users interested
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">
                        {request.reason}
                      </p>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="default" size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
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
