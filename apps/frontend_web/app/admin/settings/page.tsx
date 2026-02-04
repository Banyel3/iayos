"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  Settings,
  DollarSign,
  FolderTree,
  Mail,
  CreditCard,
  Shield,
  FileText,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../components";

export default function SettingsPage() {
  const router = useRouter();
  const mainClass = useMainContentClass("p-8 min-h-screen");

  const settingsModules = [
    {
      title: "Platform Settings",
      description:
        "Configure system-wide financial, verification, and operational settings",
      icon: Settings,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      stats: "3 sections",
      route: "/admin/settings/platform",
    },
    {
      title: "Category Management",
      description: "Manage service categories, icons, and job classifications",
      icon: FolderTree,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      stats: "Active categories",
      route: "/admin/settings/categories",
    },
    {
      title: "Notification Templates",
      description: "Customize email, SMS, and push notification templates",
      icon: Mail,
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      stats: "Email, SMS, Push",
      route: "/admin/settings/notifications",
    },
    {
      title: "Payment Gateways",
      description: "Configure Xendit, GCash, and bank transfer payment methods",
      icon: CreditCard,
      color: "from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      stats: "3 gateways",
      route: "/admin/settings/payment-gateways",
    },
    {
      title: "Admin User Management",
      description: "Manage administrator accounts, roles, and permissions",
      icon: Shield,
      color: "from-red-500 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      stats: "Roles & Permissions",
      route: "/admin/settings/admins",
    },
    {
      title: "Audit Logs",
      description: "View system activity logs and administrator actions",
      icon: FileText,
      color: "from-slate-500 to-slate-600",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      stats: "Activity monitor",
      route: "/admin/settings/audit-logs",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Modern Header with Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Settings className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">
                      Settings & Configuration
                    </h1>
                  </div>
                  <p className="text-slate-100 text-lg">
                    Manage platform settings, payment gateways, and system
                    configuration
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm font-medium">6 Modules</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsModules.map((module, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg overflow-hidden cursor-pointer"
                onClick={() => router.push(module.route)}
              >
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${module.iconBg} rounded-xl`}>
                      <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {module.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {module.stats}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(module.route);
                      }}
                    >
                      Configure →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Security
                    </p>
                    <p className="text-2xl font-bold text-gray-900">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Payment Gateways
                    </p>
                    <p className="text-2xl font-bold text-gray-900">3 Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      System Status
                    </p>
                    <p className="text-2xl font-bold text-gray-900">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
