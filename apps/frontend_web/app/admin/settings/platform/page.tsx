"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  DollarSign,
  Shield,
  Server,
  Save,
  RotateCcw,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Sidebar } from "../../components";

interface PlatformSettings {
  platform_fee_percentage: number;
  escrow_holding_days: number;
  max_job_budget: number;
  min_job_budget: number;
  worker_verification_required: boolean;
  auto_approve_kyc: boolean;
  maintenance_mode: boolean;
  kyc_document_expiry_days: number;
  session_timeout_minutes: number;
  max_upload_size_mb: number;
  last_updated?: string;
  updated_by?: string;
  // New KYC auto-approval thresholds
  kyc_auto_approve_min_confidence: number;
  kyc_face_match_min_similarity: number;
  kyc_require_user_confirmation: boolean;
}

export default function PlatformSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_fee_percentage: 5,
    escrow_holding_days: 7,
    max_job_budget: 100000,
    min_job_budget: 100,
    worker_verification_required: true,
    auto_approve_kyc: false,
    maintenance_mode: false,
    kyc_document_expiry_days: 365,
    session_timeout_minutes: 60,
    max_upload_size_mb: 10,
    // New KYC auto-approval thresholds
    kyc_auto_approve_min_confidence: 0.9,
    kyc_face_match_min_similarity: 0.85,
    kyc_require_user_confirmation: true,
  });
  const [originalSettings, setOriginalSettings] =
    useState<PlatformSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();

    // Warn before leaving with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/platform`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setOriginalSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate budget range
    if (settings.min_job_budget >= settings.max_job_budget) {
      newErrors.min_job_budget =
        "Minimum budget must be less than maximum budget";
      newErrors.max_job_budget =
        "Maximum budget must be greater than minimum budget";
    }

    // Validate fee percentage
    if (
      settings.platform_fee_percentage < 0 ||
      settings.platform_fee_percentage > 100
    ) {
      newErrors.platform_fee_percentage =
        "Fee percentage must be between 0 and 100";
    }

    // Validate positive numbers
    if (settings.escrow_holding_days < 0) {
      newErrors.escrow_holding_days = "Must be a positive number";
    }
    if (settings.kyc_document_expiry_days < 0) {
      newErrors.kyc_document_expiry_days = "Must be a positive number";
    }
    if (settings.session_timeout_minutes < 1) {
      newErrors.session_timeout_minutes = "Must be at least 1 minute";
    }
    if (settings.max_upload_size_mb < 1) {
      newErrors.max_upload_size_mb = "Must be at least 1 MB";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof PlatformSettings,
    value: number | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/platform`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
        alert("Settings updated successfully!");
        fetchSettings(); // Refresh to get updated timestamp
      } else {
        alert(data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      !confirm(
        "Reset all settings to default values? This will discard any unsaved changes."
      )
    ) {
      return;
    }

    const defaults: PlatformSettings = {
      platform_fee_percentage: 5,
      escrow_holding_days: 7,
      max_job_budget: 100000,
      min_job_budget: 100,
      worker_verification_required: true,
      auto_approve_kyc: false,
      maintenance_mode: false,
      kyc_document_expiry_days: 365,
      session_timeout_minutes: 60,
      max_upload_size_mb: 10,
      // New KYC auto-approval thresholds
      kyc_auto_approve_min_confidence: 0.9,
      kyc_face_match_min_similarity: 0.85,
      kyc_require_user_confirmation: true,
    };

    setSettings(defaults);
    setHasUnsavedChanges(true);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Settings className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading platform settings...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching configuration data
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <Settings className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Platform Configuration
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-white">
                Platform Settings
              </h1>
              <p className="text-lg text-blue-100">
                Configure system-wide settings, fees, and policies
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="secondary"
                disabled={saving}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className="gap-2 bg-white text-blue-600 hover:bg-blue-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Unsaved Changes</p>
              <p className="text-sm text-orange-700">
                You have unsaved changes. Click "Save Changes" to apply them or
                "Reset to Defaults" to discard.
              </p>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        {settings.last_updated && (
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <span className="text-gray-600">Last updated: </span>
              <span className="font-medium text-gray-900">
                {new Date(settings.last_updated).toLocaleString()}
              </span>
              {settings.updated_by && (
                <>
                  <span className="text-gray-600"> by </span>
                  <span className="font-medium text-gray-900">
                    {settings.updated_by}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Financial Settings */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Financial Settings</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure platform fees and budget limits
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Platform Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee Percentage
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.platform_fee_percentage}
                      onChange={(e) =>
                        handleChange(
                          "platform_fee_percentage",
                          parseFloat(e.target.value)
                        )
                      }
                      className={`pr-8 ${errors.platform_fee_percentage ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                  {errors.platform_fee_percentage && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.platform_fee_percentage}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Fee charged on each transaction (0-100%)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escrow Holding Days
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.escrow_holding_days}
                      onChange={(e) =>
                        handleChange(
                          "escrow_holding_days",
                          parseInt(e.target.value)
                        )
                      }
                      className={`pr-16 ${errors.escrow_holding_days ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      days
                    </span>
                  </div>
                  {errors.escrow_holding_days && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.escrow_holding_days}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Days to hold payment in escrow (0-365)
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-200"></div>

              {/* Budget Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Job Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={settings.min_job_budget}
                      onChange={(e) =>
                        handleChange("min_job_budget", parseInt(e.target.value))
                      }
                      className={`pl-8 ${errors.min_job_budget ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.min_job_budget && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.min_job_budget}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum amount for a job posting
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Job Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={settings.max_job_budget}
                      onChange={(e) =>
                        handleChange("max_job_budget", parseInt(e.target.value))
                      }
                      className={`pl-8 ${errors.max_job_budget ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.max_job_budget && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.max_job_budget}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum amount for a job posting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Settings */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Verification Settings
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure user verification and KYC policies
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Toggle Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">
                      Worker Verification Required
                    </p>
                    <p className="text-sm text-gray-500">
                      Workers must complete verification before accepting jobs
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange(
                        "worker_verification_required",
                        !settings.worker_verification_required
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.worker_verification_required
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.worker_verification_required
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">
                      Auto-Approve KYC
                    </p>
                    <p className="text-sm text-gray-500">
                      Automatically approve KYC submissions without manual
                      review
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange(
                        "auto_approve_kyc",
                        !settings.auto_approve_kyc
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.auto_approve_kyc ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.auto_approve_kyc
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* KYC Auto-Approval Thresholds (shown when auto-approve is enabled) */}
                {settings.auto_approve_kyc && (
                  <div className="ml-4 p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-4">
                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      AI Auto-Approval Thresholds
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Require User Confirmation
                        </p>
                        <p className="text-xs text-gray-500">
                          Users must review and confirm extracted data before
                          auto-approval
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleChange(
                            "kyc_require_user_confirmation",
                            !settings.kyc_require_user_confirmation
                          )
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          settings.kyc_require_user_confirmation
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            settings.kyc_require_user_confirmation
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min. Confidence Score
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.kyc_auto_approve_min_confidence}
                            onChange={(e) =>
                              handleChange(
                                "kyc_auto_approve_min_confidence",
                                parseFloat(e.target.value)
                              )
                            }
                            className="pr-8"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          AI extraction confidence (0.0 - 1.0)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min. Face Match Score
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.kyc_face_match_min_similarity}
                            onChange={(e) =>
                              handleChange(
                                "kyc_face_match_min_similarity",
                                parseFloat(e.target.value)
                              )
                            }
                            className="pr-8"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ID-selfie similarity (0.0 - 1.0)
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-blue-700 mt-2">
                      💡 Higher thresholds = stricter auto-approval.
                      Recommended: 0.85-0.95
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-200"></div>

              {/* KYC Document Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KYC Document Expiry Days
                </label>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="0"
                    max="3650"
                    value={settings.kyc_document_expiry_days}
                    onChange={(e) =>
                      handleChange(
                        "kyc_document_expiry_days",
                        parseInt(e.target.value)
                      )
                    }
                    className={`pr-16 ${errors.kyc_document_expiry_days ? "border-red-500" : ""}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    days
                  </span>
                </div>
                {errors.kyc_document_expiry_days && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.kyc_document_expiry_days}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Number of days before KYC documents expire and require renewal
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Server className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">System Settings</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure system behavior and limits
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Maintenance Mode */}
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-900">Maintenance Mode</p>
                    <p className="text-sm text-red-700 mt-1">
                      ⚠️ Platform will be inaccessible to users when enabled
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        !settings.maintenance_mode ||
                        confirm(
                          "Enable maintenance mode? Users will not be able to access the platform."
                        )
                      ) {
                        handleChange(
                          "maintenance_mode",
                          !settings.maintenance_mode
                        );
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.maintenance_mode ? "bg-red-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.maintenance_mode
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-200"></div>

              {/* Other System Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={settings.session_timeout_minutes}
                      onChange={(e) =>
                        handleChange(
                          "session_timeout_minutes",
                          parseInt(e.target.value)
                        )
                      }
                      className={`pr-20 ${errors.session_timeout_minutes ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      minutes
                    </span>
                  </div>
                  {errors.session_timeout_minutes && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.session_timeout_minutes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Inactivity timeout for user sessions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Upload Size
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.max_upload_size_mb}
                      onChange={(e) =>
                        handleChange(
                          "max_upload_size_mb",
                          parseInt(e.target.value)
                        )
                      }
                      className={`pr-12 ${errors.max_upload_size_mb ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      MB
                    </span>
                  </div>
                  {errors.max_upload_size_mb && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.max_upload_size_mb}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size for uploads
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
