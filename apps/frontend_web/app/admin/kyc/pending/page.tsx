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
  Clock,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { Sidebar } from "../../components";

interface PendingKYC {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "worker" | "client";
  submissionDate: string;
  priority: "high" | "medium" | "low";
  documentsCount: number;
  daysPending: number;
}

const mockPendingKYC: PendingKYC[] = [
  {
    id: "1",
    userId: "user_1",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    userType: "worker",
    submissionDate: "2024-03-20",
    priority: "high",
    documentsCount: 3,
    daysPending: 9,
  },
  {
    id: "2",
    userId: "user_4",
    userName: "Sarah Wilson",
    userEmail: "sarah.wilson@example.com",
    userType: "client",
    submissionDate: "2024-03-18",
    priority: "medium",
    documentsCount: 2,
    daysPending: 11,
  },
  {
    id: "3",
    userId: "user_5",
    userName: "Alex Martinez",
    userEmail: "alex.martinez@example.com",
    userType: "worker",
    submissionDate: "2024-03-17",
    priority: "low",
    documentsCount: 4,
    daysPending: 12,
  },
];

export default function PendingKYCPage() {
  const [pendingKYC] = useState<PendingKYC[]>(mockPendingKYC);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "client">(
    "all"
  );

  const filteredRecords = pendingKYC.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || record.priority === priorityFilter;
    const matchesType = typeFilter === "all" || record.userType === typeFilter;

    return matchesSearch && matchesPriority && matchesType;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysPendingColor = (days: number) => {
    if (days > 14) return "text-red-600";
    if (days > 7) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pending KYC Reviews
              </h1>
              <p className="text-muted-foreground">
                KYC submissions awaiting review and approval
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingKYC.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Priority
                </CardTitle>
                <Clock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingKYC.filter((r) => r.priority === "high").length}
                </div>
                <p className="text-xs text-muted-foreground">Urgent reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <Clock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingKYC.filter((r) => r.daysPending > 14).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  &gt; 14 days pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Days Pending
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    pendingKYC.reduce((acc, r) => acc + r.daysPending, 0) /
                      pendingKYC.length
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average wait time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find pending KYC reviews by user name, email, priority, or type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pending reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as "all" | "high" | "medium" | "low"
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "worker" | "client")
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="worker">Workers</option>
                  <option value="client">Clients</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews List */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary text-lg">
                          {record.userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {record.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {record.userEmail}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.userType === "worker"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {record.userType}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}
                          >
                            {record.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Documents
                        </p>
                        <p className="text-lg font-semibold">
                          {record.documentsCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Days Pending
                        </p>
                        <p
                          className={`text-lg font-semibold ${getDaysPendingColor(record.daysPending)}`}
                        >
                          {record.daysPending}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Submitted
                        </p>
                        <p className="text-sm">
                          {new Date(record.submissionDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No pending reviews found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  priorityFilter !== "all" ||
                  typeFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "All KYC submissions have been reviewed"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
