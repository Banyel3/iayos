"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  Settings,
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
  const mainClass = useMainContentClass("p-4 sm:p-8 min-h-screen");

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
      description: "Configure PayMongo, GCash, and bank transfer payment methods",
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
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Modern Header with Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-700 p-6 sm:p-8 text-white shadow-xl mx-0 sm:mx-0">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                      Settings Hub
                    </h1>
                  </div>
                  <p className="text-slate-100 text-sm sm:text-lg max-w-2xl font-medium opacity-90">
                    Manage platform protocols, encryption keys, and node configurations
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm shrink-0 border border-white/10">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest">6 Active Nodes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {settingsModules.map((module, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push(module.route)}
              >
                <CardContent className="p-5 sm:p-6 relative text-center sm:text-left">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${module.iconBg} rounded-xl mx-auto sm:mx-0`}>
                      <module.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${module.iconColor}`} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 hidden sm:block" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    {module.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                      {module.stats}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(module.route);
                      }}
                    >
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 sm:p-3 bg-blue-600 rounded-lg shrink-0">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
                      Security Node
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 sm:p-3 bg-green-600 rounded-lg shrink-0">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
                      Payment Nodes
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight">3 Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 sm:p-3 bg-purple-600 rounded-lg shrink-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
                      Core Status
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Healthy</p>
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
