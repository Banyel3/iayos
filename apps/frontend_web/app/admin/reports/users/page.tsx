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
import { UserX, Search, Eye, Ban, CheckCircle, Clock } from "lucide-react";
import { Sidebar } from "../../components";

interface UserReport {
  id: string;
  reportedUser: { name: string; email: string; type: string };
  reportedBy: { name: string; email: string };
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  date: string;
}

const mockReports: UserReport[] = [
  {
    id: "r001",
    reportedUser: { name: "John Doe", email: "john@email.com", type: "Worker" },
    reportedBy: { name: "Jane Smith", email: "jane@email.com" },
    reason: "Unprofessional Behavior",
    description: "Worker was rude and did not complete the job properly",
    status: "pending",
    date: "2024-01-15",
  },
  {
    id: "r002",
    reportedUser: {
      name: "Mike Chen",
      email: "mike@email.com",
      type: "Client",
    },
    reportedBy: { name: "Anna Lee", email: "anna@email.com" },
    reason: "Non-payment",
    description: "Client refused to pay after job completion",
    status: "reviewed",
    date: "2024-01-14",
  },
];

export default function UserReportsPage() {
  const [reports] = useState<UserReport[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter(
    (r) =>
      r.reportedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Reports</h1>
            <p className="text-muted-foreground">
              Reported users and violations
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reports
                </CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
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
                  {reports.filter((r) => r.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground">Need review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter((r) => r.status === "resolved").length}
                </div>
                <p className="text-xs text-muted-foreground">Closed</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{report.reason}</h3>
                        <p className="text-sm text-muted-foreground">
                          Reported on{" "}
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          report.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : report.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Reported User</p>
                        <p className="font-medium">
                          {report.reportedUser.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {report.reportedUser.email} (
                          {report.reportedUser.type})
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reported By</p>
                        <p className="font-medium">{report.reportedBy.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {report.reportedBy.email}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{report.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend User
                      </Button>
                      <Button variant="default" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
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
