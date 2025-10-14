"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Activity,
  Server,
  Search,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Sidebar } from "../../components";

interface SystemLog {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  service: string;
  timestamp: string;
  details: string;
}

const mockLogs: SystemLog[] = [
  {
    id: "log001",
    type: "error",
    message: "Database connection timeout",
    service: "Backend API",
    timestamp: "2024-01-16 14:32:18",
    details: "Connection pool exhausted, retrying...",
  },
  {
    id: "log002",
    type: "warning",
    message: "High memory usage detected",
    service: "Web Server",
    timestamp: "2024-01-16 13:15:42",
    details: "Memory usage at 85%, consider scaling",
  },
  {
    id: "log003",
    type: "info",
    message: "Scheduled backup completed",
    service: "Database",
    timestamp: "2024-01-16 02:00:05",
    details: "Daily backup successful - 2.4GB",
  },
];

export default function SystemReportsPage() {
  const [logs] = useState<SystemLog[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const errorCount = logs.filter((l) => l.type === "error").length;
  const warningCount = logs.filter((l) => l.type === "warning").length;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">System Reports</h1>
            <p className="text-muted-foreground">System logs and issues</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All services running
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorCount}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warningCount}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Server className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Search Logs</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search system logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded ${
                          log.type === "error"
                            ? "bg-red-100"
                            : log.type === "warning"
                              ? "bg-yellow-100"
                              : "bg-blue-100"
                        }`}
                      >
                        {log.type === "error" ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : log.type === "warning" ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.message}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {log.service}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.details}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.timestamp}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
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
