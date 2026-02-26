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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Help & Support
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Get help and support for platform administration
            </p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            disabled={loading}
            className="w-full sm:w-auto h-10 sm:h-9 rounded-xl sm:rounded-md"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Open Tickets
              </CardTitle>
              <HelpCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl sm:text-2xl font-black">
                {loading ? "..." : (stats?.open_tickets ?? 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                of {stats?.total_tickets ?? 0} total
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl sm:text-2xl font-black">
                {loading ? "..." : formatTime(stats?.avg_response_time ?? 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Average response</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resolution Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl sm:text-2xl font-black">
                {loading ? "..." : `${stats?.resolution_rate ?? 0}%`}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Issues resolved</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Satisfaction
              </CardTitle>
              <Star className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl sm:text-2xl font-black">
                {loading
                  ? "..."
                  : (stats?.satisfaction_rate?.toFixed(1) ?? "0.0")}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl font-bold">Contact Support</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">
                Get in touch with our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 pt-0">
              <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-100 transition-all">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm sm:text-base">Email Support</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                    support@iayos.com
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-2 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-green-100 transition-all">
                <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm sm:text-base">Phone Support</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                    +63 (917) 123-4567
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-2 hover:bg-green-50 hover:text-green-600 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-purple-100 transition-all">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm sm:text-base">Live Chat</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                    Available 24/7
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-2 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl font-bold">Quick Help</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">Common questions and resources</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2.5 sm:space-y-3 pt-0">
              {[
                "How to manage user accounts?",
                "Setting up payment processing",
                "Configuring system notifications",
                "Understanding analytics reports",
                "Managing KYC verifications",
              ].map((question, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-3.5 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-100 transition-all"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{question}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-2 shrink-0 ml-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">
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
