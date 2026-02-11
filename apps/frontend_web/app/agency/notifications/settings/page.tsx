"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  BellOff,
  Briefcase,
  MessageSquare,
  CreditCard,
  Shield,
  Star,
  ArrowLeft,
  Loader2,
  Check,
  Info,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

interface NotificationSettings {
  emailNotifications: boolean;
  jobUpdates: boolean;
  messages: boolean;
  payments: boolean;
  reviews: boolean;
  kycUpdates: boolean;
}

export default function AgencyNotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    jobUpdates: true,
    messages: true,
    payments: true,
    reviews: true,
    kycUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/accounts/notification-settings`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            emailNotifications: data.settings.emailNotifications ?? true,
            jobUpdates: data.settings.jobUpdates ?? true,
            messages: data.settings.messages ?? true,
            payments: data.settings.payments ?? true,
            reviews: data.settings.reviews ?? true,
            kycUpdates: data.settings.kycUpdates ?? true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/accounts/notification-settings`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        },
      );

      if (response.ok) {
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to save settings"));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(getErrorMessage(error, "Failed to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const SettingToggle = ({
    icon: Icon,
    title,
    description,
    settingKey,
    iconColor,
    bgColor,
    disabled,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    settingKey: keyof NotificationSettings;
    iconColor: string;
    bgColor: string;
    disabled?: boolean;
  }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        disabled
          ? "opacity-50 bg-gray-50"
          : settings[settingKey]
            ? "bg-white hover:bg-gray-50"
            : "bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => !disabled && toggleSetting(settingKey)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled ? "cursor-not-allowed" : ""
        } ${settings[settingKey] ? "bg-blue-600" : "bg-gray-200"}`}
        role="switch"
        aria-checked={settings[settingKey]}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            settings[settingKey] ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

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
              <h1 className="text-3xl font-bold">Notification Settings</h1>
              <p className="text-blue-100 mt-1">
                Manage your notification preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <>
            {/* Master Toggle */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        settings.emailNotifications
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {settings.emailNotifications ? (
                        <Bell className="h-6 w-6 text-blue-600" />
                      ) : (
                        <BellOff className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Email Notifications
                      </h2>
                      <p className="text-sm text-gray-500">
                        Receive email updates for important activities
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting("emailNotifications")}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.emailNotifications
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={settings.emailNotifications}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.emailNotifications
                          ? "translate-x-7"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Category Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Notification Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingToggle
                  icon={Briefcase}
                  title="Job Updates"
                  description="New job invites, status changes, and completions"
                  settingKey="jobUpdates"
                  iconColor="text-blue-600"
                  bgColor="bg-blue-100"
                  disabled={!settings.emailNotifications}
                />
                <SettingToggle
                  icon={MessageSquare}
                  title="Messages"
                  description="New messages from clients and employees"
                  settingKey="messages"
                  iconColor="text-orange-600"
                  bgColor="bg-orange-100"
                  disabled={!settings.emailNotifications}
                />
                <SettingToggle
                  icon={CreditCard}
                  title="Payments"
                  description="Payment confirmations and transaction updates"
                  settingKey="payments"
                  iconColor="text-green-600"
                  bgColor="bg-green-100"
                  disabled={!settings.emailNotifications}
                />
                <SettingToggle
                  icon={Star}
                  title="Reviews"
                  description="New reviews and ratings from clients"
                  settingKey="reviews"
                  iconColor="text-yellow-600"
                  bgColor="bg-yellow-100"
                  disabled={!settings.emailNotifications}
                />
                <SettingToggle
                  icon={Shield}
                  title="KYC Updates"
                  description="Verification status changes and requirements"
                  settingKey="kycUpdates"
                  iconColor="text-purple-600"
                  bgColor="bg-purple-100"
                  disabled={!settings.emailNotifications}
                />
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                These settings control which email notifications you receive.
                In-app notifications will still appear in the notifications
                center regardless of these settings.
              </p>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
