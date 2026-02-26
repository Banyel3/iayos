"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../components";

interface SupportStats {
  open_tickets: number;
  total_tickets: number;
  avg_response_time: number;
  resolution_rate: number;
  satisfaction_rate: number;
}

export default function SupportPage() {
  const mainClass = useMainContentClass("p-6 space-y-6 min-h-screen");
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/tickets/stats`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        const ticketStats = data.stats;
        // Calculate resolution rate: (resolved + closed) / total * 100
        const resolvedAndClosed =
          (ticketStats.resolved || 0) + (ticketStats.closed || 0);
        const total = ticketStats.total || 1;
        const resolutionRate = Math.round((resolvedAndClosed / total) * 100);

        setStats({
          open_tickets: ticketStats.open || 0,
          total_tickets: total,
          avg_response_time: 2.4, // TODO: calculate from actual data
          resolution_rate: resolutionRate,
          satisfaction_rate: 4.8, // TODO: from actual reviews
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        open_tickets: 0,
        total_tickets: 0,
        avg_response_time: 0,
        resolution_rate: 0,
        satisfaction_rate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className={mainClass}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Help & Support
            </h1>
            <p className="text-muted-foreground">
              Get help and support for platform administration
            </p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Tickets
              </CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : (stats?.open_tickets ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                of {stats?.total_tickets ?? 0} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatTime(stats?.avg_response_time ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolution Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${stats?.resolution_rate ?? 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">Issues resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfaction
              </CardTitle>
              <Star className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading
                  ? "..."
                  : (stats?.satisfaction_rate?.toFixed(1) ?? "0.0")}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Get in touch with our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Email Support</div>
                  <div className="text-sm text-muted-foreground">
                    support@iayos.com
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Phone Support</div>
                  <div className="text-sm text-muted-foreground">
                    +63 (917) 123-4567
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Live Chat</div>
                  <div className="text-sm text-muted-foreground">
                    Available 24/7
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Help</CardTitle>
              <CardDescription>Common questions and resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "How to manage user accounts?",
                "Setting up payment processing",
                "Configuring system notifications",
                "Understanding analytics reports",
                "Managing KYC verifications",
              ].map((question, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{question}</span>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
