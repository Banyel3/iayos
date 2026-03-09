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
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-[#00BAF1] transition-all">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-[#00BAF1]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings Hub</h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                  Manage platform protocols, system configurations, and security settings
                </p>
              </div>
            </div>
          </div>

          {/* Settings Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsModules.map((module, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => router.push(module.route)}
              >
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-sky-50 rounded-xl group-hover:bg-[#00BAF1] transition-colors">
                      <module.icon className="h-6 w-6 text-[#00BAF1] group-hover:text-white transition-colors" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#00BAF1] group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#00BAF1] transition-colors">
                    {module.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00BAF1] bg-sky-50 px-2 py-1 rounded">
                      {module.stats}
                    </span>
                    <span className="text-xs font-bold text-[#00BAF1] hover:underline">
                      Configure Settings
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-4 px-6 flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl">
                  <Shield className="h-6 w-6 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wider">System Security</p>
                  <p className="text-xl font-bold text-gray-900">Protected</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-4 px-6 flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl">
                  <Zap className="h-6 w-6 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wider">Node Status</p>
                  <p className="text-xl font-bold text-gray-900">All Online</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-4 px-6 flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl">
                  <FileText className="h-6 w-6 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wider">Log Status</p>
                  <p className="text-xl font-bold text-gray-900">Recording</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>

  );
}
