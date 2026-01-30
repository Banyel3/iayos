"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Globe,
  Shield,
  Trash2,
  ArrowLeft,
  Lock,
  LogOut,
  ChevronRight,
  Info,
  RefreshCw,
  Mail,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SETTINGS_VERSION = "1.0.0";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <Card>
        <CardContent className="p-0 divide-y divide-gray-100">{children}</CardContent>
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

function SettingsRow({ icon, title, description, action, onClick, danger }: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 ${onClick ? "cursor-pointer hover:bg-gray-50" : ""} ${danger ? "text-red-600" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${danger ? "bg-red-100" : "bg-gray-100"}`}>
          {icon}
        </div>
        <div>
          <p className={`font-medium ${danger ? "text-red-600" : "text-gray-900"}`}>{title}</p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {action ? action : onClick ? <ChevronRight className="h-5 w-5 text-gray-400" /> : null}
    </div>
  );
}

export default function AgencySettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  // Theme settings
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  // Language
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const savedEmailNotif = localStorage.getItem("emailNotifications");
    const savedPushNotif = localStorage.getItem("pushNotifications");
    const savedJobAlerts = localStorage.getItem("jobAlerts");
    const savedMessageAlerts = localStorage.getItem("messageAlerts");

    if (savedTheme) setIsDarkMode(savedTheme === "dark");
    if (savedEmailNotif) setEmailNotifications(savedEmailNotif === "true");
    if (savedPushNotif) setPushNotifications(savedPushNotif === "true");
    if (savedJobAlerts) setJobAlerts(savedJobAlerts === "true");
    if (savedMessageAlerts) setMessageAlerts(savedMessageAlerts === "true");
  }, []);

  const saveSetting = (key: string, value: boolean | string) => {
    localStorage.setItem(key, String(value));
    toast.success("Setting saved");
  };

  const handleThemeToggle = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    saveSetting("theme", newValue ? "dark" : "light");
    // Note: Theme implementation would require a ThemeProvider
    toast.info("Theme changes will take effect on next page load");
  };

  const handleClearCache = () => {
    if (confirm("This will clear all cached data. Are you sure?")) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Cache cleared successfully");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("This will permanently delete your account and all associated data. This action cannot be undone.")) {
      if (prompt('Type "DELETE" to confirm account deletion:') === "DELETE") {
        toast.error("Please contact support to delete your account.");
      }
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-700 to-slate-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gray-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-gray-300 mt-1">Manage your agency preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-3xl mx-auto">
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsRow
            icon={isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            title="Dark Mode"
            description="Switch between light and dark themes"
            action={
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
            }
          />
          <SettingsRow
            icon={<Globe className="h-5 w-5" />}
            title="Language"
            description={language}
            onClick={() => {
              toast.info("Language switching coming soon!");
            }}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<Mail className="h-5 w-5" />}
            title="Email Notifications"
            description="Receive updates via email"
            action={
              <Switch
                checked={emailNotifications}
                onCheckedChange={(checked: boolean) => {
                  setEmailNotifications(checked);
                  saveSetting("emailNotifications", checked);
                }}
              />
            }
          />
          <SettingsRow
            icon={<Bell className="h-5 w-5" />}
            title="Push Notifications"
            description="Browser push notifications"
            action={
              <Switch
                checked={pushNotifications}
                onCheckedChange={(checked: boolean) => {
                  setPushNotifications(checked);
                  saveSetting("pushNotifications", checked);
                }}
              />
            }
          />
          <SettingsRow
            icon={<Settings className="h-5 w-5" />}
            title="Job Alerts"
            description="Get notified about new job invitations"
            action={
              <Switch
                checked={jobAlerts}
                onCheckedChange={(checked: boolean) => {
                  setJobAlerts(checked);
                  saveSetting("jobAlerts", checked);
                }}
              />
            }
          />
          <SettingsRow
            icon={<MessageSquare className="h-5 w-5" />}
            title="Message Alerts"
            description="Get notified about new messages"
            action={
              <Switch
                checked={messageAlerts}
                onCheckedChange={(checked: boolean) => {
                  setMessageAlerts(checked);
                  saveSetting("messageAlerts", checked);
                }}
              />
            }
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security">
          <SettingsRow
            icon={<Lock className="h-5 w-5" />}
            title="Change Password"
            description="Update your account password"
            onClick={() => router.push("/agency/settings/change-password")}
          />
          <SettingsRow
            icon={<Shield className="h-5 w-5" />}
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            onClick={() => toast.info("2FA coming soon!")}
          />
        </SettingsSection>

        {/* Data & Storage */}
        <SettingsSection title="Data & Storage">
          <SettingsRow
            icon={<RefreshCw className="h-5 w-5" />}
            title="Clear Cache"
            description="Remove temporary data"
            onClick={handleClearCache}
          />
        </SettingsSection>

        {/* Account Actions */}
        <SettingsSection title="Account">
          <SettingsRow
            icon={<LogOut className="h-5 w-5" />}
            title="Log Out"
            description="Sign out of your account"
            onClick={handleLogout}
          />
          <SettingsRow
            icon={<Trash2 className="h-5 w-5" />}
            title="Delete Account"
            description="Permanently remove your account and data"
            onClick={handleDeleteAccount}
            danger
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            icon={<Info className="h-5 w-5" />}
            title="App Version"
            description={`v${SETTINGS_VERSION}`}
          />
        </SettingsSection>
      </div>
    </div>
  );
}
