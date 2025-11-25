"use client";

import { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Agency {
  agencyId: number;
  businessName: string;
}

interface InviteJobCreationModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobId: number) => void;
}

interface JobFormData {
  title: string;
  description: string;
  category_id: number;
  budget: string;
  location: string;
  expected_duration: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date: string;
  materials_needed: string[];
  payment_method: "WALLET" | "GCASH";
}

interface Category {
  specializationID: number;
  categoryName: string;
}

export default function InviteJobCreationModal({
  agency,
  isOpen,
  onClose,
  onSuccess,
}: InviteJobCreationModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    category_id: 0,
    budget: "",
    location: "",
    expected_duration: "",
    urgency: "MEDIUM",
    preferred_start_date: "",
    materials_needed: [],
    payment_method: "WALLET",
  });

  const [currentMaterial, setCurrentMaterial] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchWalletBalance();
    }
  }, [isOpen]);

  const parseResponseBody = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (contentType.includes("application/json")) {
      try {
        return text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("⚠️ Failed to parse JSON response", err);
        return {};
      }
    }

    return text;
  };

  const fetchCategories = async () => {
    try {
      console.log("🔄 Fetching categories...");
      const response = await fetch(`/api/accounts/specializations`, {
        credentials: "include",
      });
      console.log("📡 Categories response status:", response.status);
      const data = await parseResponseBody(response);
      if (response.ok && Array.isArray(data)) {
        console.log("✅ Categories fetched:", data.length, "categories");
        setCategories(data);
      } else {
        console.error(
          "❌ Failed to fetch categories:",
          response.status,
          response.statusText,
          data
        );
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(`/api/profiles/wallet-balance`, {
        credentials: "include",
      });
      const data = await parseResponseBody(response);
      if (response.ok && data && typeof data === "object") {
        setWalletBalance((data as any).balance || 0);
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  };

  const updateFormData = (field: keyof JobFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addMaterial = () => {
    if (currentMaterial.trim()) {
      updateFormData("materials_needed", [
        ...formData.materials_needed,
        currentMaterial.trim(),
      ]);
      setCurrentMaterial("");
    }
  };

  const removeMaterial = (index: number) => {
    updateFormData(
      "materials_needed",
      formData.materials_needed.filter((_, i) => i !== index)
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);

    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError("Job title is required");
        return false;
      }
      if (formData.title.length < 10) {
        setError("Job title must be at least 10 characters");
        return false;
      }
      if (!formData.description.trim()) {
        setError("Job description is required");
        return false;
      }
      if (formData.description.length < 50) {
        setError("Job description must be at least 50 characters");
        return false;
      }
      if (!formData.category_id || formData.category_id === 0) {
        setError("Please select a category");
        return false;
      }
      if (!formData.location.trim()) {
        setError("Location is required");
        return false;
      }
    }

    if (currentStep === 2) {
      const budget = parseFloat(formData.budget);
      if (!formData.budget || isNaN(budget) || budget <= 0) {
        setError("Please enter a valid budget amount");
        return false;
      }
      if (budget < 500) {
        setError("Minimum budget is ₱500");
        return false;
      }
      if (!formData.expected_duration.trim()) {
        setError("Expected duration is required");
        return false;
      }
    }

    if (currentStep === 4) {
      const budget = parseFloat(formData.budget);
      const downpayment = budget * 0.5;

      if (formData.payment_method === "WALLET" && walletBalance < downpayment) {
        setError(
          `Insufficient wallet balance. You need ₱${downpayment.toFixed(2)} but only have ₱${walletBalance.toFixed(2)}`
        );
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        budget: parseFloat(formData.budget),
        location: formData.location.trim(),
        expected_duration: formData.expected_duration.trim(),
        urgency: formData.urgency,
        preferred_start_date: formData.preferred_start_date || null,
        materials_needed: formData.materials_needed,
        agency_id: agency.agencyId,
        payment_method: formData.payment_method,
      };

      const response = await fetch(`/api/jobs/create-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseData = await parseResponseBody(response);

      if (!response.ok) {
        const errorMessage =
          (responseData && typeof responseData === "object"
            ? (responseData as any).error
            : undefined) ||
          (typeof responseData === "string" ? responseData : null) ||
          "Failed to create job invitation";
        throw new Error(errorMessage);
      }

      const data =
        responseData && typeof responseData === "object"
          ? (responseData as any)
          : {};

      if (data.requires_payment && data.invoice_url) {
        // GCash payment required
        setPaymentUrl(data.invoice_url);
        // Redirect to payment page
        window.location.href = data.invoice_url;
      } else {
        // Wallet payment successful
        if (onSuccess) {
          onSuccess(data.job_id);
        }
        // Show success and close
        alert(`Success! Invitation sent to ${agency.businessName}`);
        onClose();
        // Redirect to dashboard myRequests page (client jobs)
        window.location.href = "/dashboard/myRequests";
      }
    } catch (err: any) {
      console.error("Error creating invite job:", err);
      setError(err.message || "Failed to create job invitation");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      title: "",
      description: "",
      category_id: 0,
      budget: "",
      location: "",
      expected_duration: "",
      urgency: "MEDIUM",
      preferred_start_date: "",
      materials_needed: [],
      payment_method: "WALLET",
    });
    setCurrentMaterial("");
    setError(null);
    setPaymentUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const budget = parseFloat(formData.budget) || 0;
  const downpayment = budget * 0.5;
  const remaining = budget * 0.5;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Hire {agency.businessName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a direct job invitation
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Job Details" },
              { num: 2, label: "Budget & Timeline" },
              { num: 3, label: "Materials" },
              { num: 4, label: "Payment" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step > s.num
                        ? "bg-green-500 text-white"
                        : step === s.num
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${step > s.num ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="px-6 py-6">
          {/* Step 1: Job Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="e.g., House Renovation and Painting"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  placeholder="Describe your project in detail..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length} characters (min 50)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    updateFormData("category_id", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select a category</option>
                  {categories.map((cat) => (
                    <option
                      key={cat.specializationID}
                      value={cat.specializationID}
                    >
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  placeholder="e.g., Quezon City, Metro Manila"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Budget & Timeline */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget (₱) *
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => updateFormData("budget", e.target.value)}
                  placeholder="e.g., 50000"
                  min="500"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {budget > 0 && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      Payment Breakdown:
                    </p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        • 50% Downpayment (Escrow):{" "}
                        <span className="font-semibold">
                          ₱{downpayment.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        • Remaining (Upon Completion):{" "}
                        <span className="font-semibold">
                          ₱{remaining.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Duration *
                </label>
                <input
                  type="text"
                  value={formData.expected_duration}
                  onChange={(e) =>
                    updateFormData("expected_duration", e.target.value)
                  }
                  placeholder="e.g., 2 weeks, 1 month, 3 days"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency *
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => updateFormData("urgency", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low - Flexible timing</option>
                  <option value="MEDIUM">Medium - Within a week</option>
                  <option value="HIGH">High - ASAP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.preferred_start_date}
                  onChange={(e) =>
                    updateFormData("preferred_start_date", e.target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Materials */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materials Needed (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  List any specific materials or equipment required for the
                  project
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMaterial}
                    onChange={(e) => setCurrentMaterial(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addMaterial())
                    }
                    placeholder="e.g., Paint (5 gallons), Cement bags"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {formData.materials_needed.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Materials List:
                  </p>
                  <ul className="space-y-2">
                    {formData.materials_needed.map((material, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {material}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  💡 Tip: Adding materials helps the agency prepare better and
                  provide accurate quotes.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Budget:</span>
                    <span className="font-semibold">₱{budget.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700">
                      50% Downpayment (Escrow):
                    </span>
                    <span className="font-semibold text-blue-600">
                      ₱{downpayment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      Remaining (Pay upon completion):
                    </span>
                    <span className="font-semibold">
                      ₱{remaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method for Downpayment *
                </label>

                {/* Wallet Option */}
                <label
                  className={`block border-2 rounded-lg p-4 mb-3 cursor-pointer transition-colors ${
                    formData.payment_method === "WALLET"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="WALLET"
                    checked={formData.payment_method === "WALLET"}
                    onChange={(e) =>
                      updateFormData("payment_method", e.target.value)
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          formData.payment_method === "WALLET"
                            ? "border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.payment_method === "WALLET" && (
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          iAyos Wallet
                        </p>
                        <p className="text-sm text-gray-600">
                          Current Balance: ₱{walletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {walletBalance >= downpayment ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </label>

                {/* GCash Option */}
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.payment_method === "GCASH"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="GCASH"
                    checked={formData.payment_method === "GCASH"}
                    onChange={(e) =>
                      updateFormData("payment_method", e.target.value)
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          formData.payment_method === "GCASH"
                            ? "border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.payment_method === "GCASH" && (
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">GCash</p>
                        <p className="text-sm text-gray-600">
                          Pay via GCash e-wallet
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>What happens next:</strong>
                </p>
                <ol className="mt-2 space-y-1 text-sm text-gray-600 list-decimal list-inside">
                  <li>Your invitation will be sent to {agency.businessName}</li>
                  <li>The agency can accept or decline within 48 hours</li>
                  <li>If accepted, work begins and escrow is released</li>
                  <li>If declined, you'll be refunded immediately</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={prevStep}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Send Invitation</span>
                    <CheckCircle className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
