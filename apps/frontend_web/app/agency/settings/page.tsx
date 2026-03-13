"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Trash2,
  ArrowLeft,
  Lock,
  LogOut,
  ChevronRight,
  Info,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  Layers,
  Trash,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SETTINGS_VERSION = "1.0.0";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {title}
        </h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white">
        <CardContent className="p-0 divide-y divide-gray-50">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({
  icon,
  title,
  description,
  action,
  onClick,
  danger,
}: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-5 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            danger 
              ? "bg-red-50 text-red-500" 
              : "bg-gray-50 text-gray-400 group-hover:bg-[#00BAF1]/10 group-hover:text-[#00BAF1]"
          }`}
        >
          {icon}
        </div>
        <div className="space-y-0.5">
          <p
            className={`text-sm font-bold tracking-tight ${
              danger ? "text-red-600" : "text-gray-900"
            }`}
          >
            {title}
          </p>
          {description && (
            <p className="text-xs font-medium text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action ? (
          <div onClick={(e) => e.stopPropagation()}>{action}</div>
        ) : onClick ? (
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#00BAF1] transition-colors" />
        ) : null}
      </div>
    </div>
  );
}

export default function AgencySettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedPushNotif = localStorage.getItem("pushNotifications");
    const savedJobAlerts = localStorage.getItem("jobAlerts");
    const savedMessageAlerts = localStorage.getItem("messageAlerts");

    if (savedPushNotif) setPushNotifications(savedPushNotif === "true");
    if (savedJobAlerts) setJobAlerts(savedJobAlerts === "true");
    if (savedMessageAlerts) setMessageAlerts(savedMessageAlerts === "true");
  }, []);

  const saveSetting = (key: string, value: boolean | string) => {
    localStorage.setItem(key, String(value));
    toast.success("Settings updated");
  };

  const handleClearCache = () => {
    const isConfirmed = window.confirm(
      "This will clear all locally saved settings and preferences. Are you sure you want to continue?"
    );
    if (!isConfirmed) return;
    toast.promise(
      new Promise((resolve) => {
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(resolve, 1000);
      }),
      {
        loading: 'Clearing cache...',
        success: 'Cache cleared! Reloading...',
        error: 'Error clearing cache',
      }
    ).then(() => {
      window.location.reload();
    });
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires admin approval. Contact support@iayos.com", {
      duration: 5000,
    });
  };

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    if (isConfirmed) {
      await logout();
      router.push("/auth/login");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
             <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
               <p className="text-gray-500 text-sm sm:text-base">
                 Customise your agency experience and security
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Content Vertical List */}
      <div className="flex flex-col pt-4 max-w-2xl">
        {/* Notifications */}
        <SettingsSection 
          title="App Notifications" 
          description="Control how and when you receive in-app alerts"
        >
          <SettingsRow
            icon={<Bell className="h-5 w-5" />}
            title="Push Notifications"
            description="Real-time browser notifications for critical events"
            action={
              <Switch
                checked={pushNotifications}
                onCheckedChange={(checked: boolean) => {
                  setPushNotifications(checked);
                  saveSetting("pushNotifications", checked);
                }}
                className="data-[state=checked]:bg-[#00BAF1]"
              />
            }
          />
          <SettingsRow
            icon={<Briefcase className="h-5 w-5" />}
            title="Job Invitations"
            description="Alerts when clients invite your agency to jobs"
            action={
              <Switch
                checked={jobAlerts}
                onCheckedChange={(checked: boolean) => {
                  setJobAlerts(checked);
                  saveSetting("jobAlerts", checked);
                }}
                className="data-[state=checked]:bg-[#00BAF1]"
              />
            }
          />
          <SettingsRow
            icon={<MessageSquare className="h-5 w-5" />}
            title="Messages"
            description="Notifications for new internal communications"
            action={
              <Switch
                checked={messageAlerts}
                onCheckedChange={(checked: boolean) => {
                  setMessageAlerts(checked);
                  saveSetting("messageAlerts", checked);
                }}
                className="data-[state=checked]:bg-[#00BAF1]"
              />
            }
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection 
          title="Account Security" 
          description="Protect your agency account and credentials"
        >
          <SettingsRow
            icon={<Lock className="h-5 w-5" />}
            title="Change Password"
            description="Ensure your account is using a strong password"
            onClick={() => router.push("/agency/settings/change-password")}
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection 
          title="Data & Optimization" 
          description="Manage your local storage and app performance"
        >
          <SettingsRow
            icon={<RefreshCw className="h-5 w-5" />}
            title="Purge Application Cache"
            description="Reset local configurations and search history"
            onClick={handleClearCache}
          />
        </SettingsSection>

        {/* Session Management */}
        <SettingsSection 
          title="Session Management"
          description="Manage your active account login"
        >
          <SettingsRow
            icon={<LogOut className="h-5 w-5" />}
            title="Log Out"
            description="End your current active session"
            onClick={handleLogout}
          />
          <SettingsRow
            icon={<Trash className="h-5 w-5" />}
            title="Delete Account"
            description="This will permanently wipe your data"
            onClick={handleDeleteAccount}
            danger
          />
        </SettingsSection>

        {/* App Info Footer */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gray-50/50 max-w-2xl mt-4">
          <CardContent className="p-6 text-center space-y-3">
             <div className="p-3 bg-white rounded-2xl w-fit mx-auto shadow-sm">
                <Layers className="h-6 w-6 text-gray-300" />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">iayos for Business</p>
                <p className="text-xs font-bold text-gray-600 mt-1">Version {SETTINGS_VERSION}</p>
             </div>
             <div className="pt-4 flex items-center justify-center gap-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-[#00BAF1] cursor-pointer hover:underline">Terms of Service</p>
                <p className="text-[10px] font-bold text-[#00BAF1] cursor-pointer hover:underline">Privacy Policy</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
