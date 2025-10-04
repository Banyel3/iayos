"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Sidebar } from "../components";

export default function NotificationsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Notifications Management
            </h1>
            <p className="text-muted-foreground">
              Manage system notifications and alerts
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Info Notices
              </CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Information updates
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Latest system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                type: "alert",
                message: "High server load detected",
                time: "2 minutes ago",
                icon: AlertTriangle,
                color: "text-yellow-600",
              },
              {
                type: "info",
                message: "System maintenance scheduled for tonight",
                time: "1 hour ago",
                icon: Info,
                color: "text-blue-600",
              },
              {
                type: "success",
                message: "Backup completed successfully",
                time: "3 hours ago",
                icon: CheckCircle,
                color: "text-green-600",
              },
            ].map((notification, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <notification.icon
                  className={`h-5 w-5 ${notification.color}`}
                />
                <div className="flex-1">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.time}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
