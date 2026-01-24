"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBarangays } from "@/lib/hooks/useLocations";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import { ChevronLeft, Plus, X, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Category {
  specializationID: number;
  categoryName: string;
}

export default function CreateListingJobPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: barangays = [], isLoading: isLoadingBarangays } =
    useBarangays(1); // cityId=1 for Zamboanga City

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [budget, setBudget] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [duration, setDuration] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [materialsInput, setMaterialsInput] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect if not client
  useEffect(() => {
    if (isAuthenticated && user?.profile_data?.profileType !== "CLIENT") {
      router.push("/dashboard/home");
    }
  }, [isAuthenticated, user, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/adminpanel/jobs/categories`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Add material
  const handleAddMaterial = () => {
    const trimmed = materialsInput.trim();
    if (trimmed && !materials.includes(trimmed)) {
      setMaterials([...materials, trimmed]);
      setMaterialsInput("");
    }
  };

  // Remove material
  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (title.trim().length < 10)
      newErrors.title = "Title must be at least 10 characters";

    if (!description.trim()) newErrors.description = "Description is required";
    if (description.trim().length < 50)
      newErrors.description = "Description must be at least 50 characters";

    if (!categoryId) newErrors.category = "Category is required";

    if (!budget.trim()) newErrors.budget = "Budget is required";
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 100)
      newErrors.budget = "Budget must be at least ₱100";
    if (budgetNum > 100000) newErrors.budget = "Budget cannot exceed ₱100,000";

    if (!barangay) newErrors.location = "Barangay is required";
    if (!street.trim()) newErrors.location = "Street address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        budget: parseFloat(budget),
        location: `${street.trim()}, ${barangay}, Zamboanga City`,
        expected_duration: duration.trim() || null,
        urgency_level: urgency,
        preferred_start_date: startDate || null,
        materials_needed: materials,
      };

      console.log("[CreateListing] Submitting:", payload);

      const response = await fetch(
        `${API_BASE}/api/jobs/create-mobile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/jobs/${data.job.id}`);
        }, 1500);
      } else {
        alert(data.error || "Failed to create job listing");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />
      <div className="lg:flex">
        <DesktopNavbar />

        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <div className="bg-white border-b px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Post a Job Listing
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Workers will apply and you'll choose the best fit
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto p-4 pb-24">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h2>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Fix Leaking Faucet in Kitchen"
                      className={errors.title ? "border-red-500" : ""}
                      maxLength={100}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {title.length}/100 characters
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={categoryId?.toString()}
                      onValueChange={(value) => setCategoryId(Number(value))}
                      disabled={isLoadingCategories}
                    >
                      <SelectTrigger
                        className={errors.category ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.specializationID}
                            value={cat.specializationID.toString()}
                          >
                            {cat.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the job in detail: what needs to be done, any specific requirements..."
                      className={
                        errors.description
                          ? "border-red-500 min-h-[120px]"
                          : "min-h-[120px]"
                      }
                      maxLength={1000}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/1000 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Budget & Timeline */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Budget & Timeline
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget (₱) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="1000"
                        min="100"
                        max="100000"
                        step="50"
                        className={errors.budget ? "border-red-500" : ""}
                      />
                      {errors.budget && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.budget}
                        </p>
                      )}
                      {budget && parseFloat(budget) >= 100 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs space-y-1">
                          <p className="font-medium text-gray-700">
                            Payment Breakdown:
                          </p>
                          <p className="text-gray-600">
                            • Worker receives:{" "}
                            <span className="font-semibold text-gray-900">
                              ₱{parseFloat(budget).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            • 50% Downpayment:{" "}
                            <span className="font-semibold">
                              ₱{(parseFloat(budget) * 0.5).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            • Platform fee (10% of downpayment):{" "}
                            <span className="font-semibold">
                              ₱{(parseFloat(budget) * 0.5 * 0.1).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-blue-600 font-semibold border-t border-blue-200 pt-1">
                            • You pay at acceptance:{" "}
                            <span className="font-bold">
                              ₱
                              {(
                                parseFloat(budget) * 0.5 +
                                parseFloat(budget) * 0.5 * 0.1
                              ).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            • Remaining at completion:{" "}
                            <span className="font-semibold">
                              ₱{(parseFloat(budget) * 0.5).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-gray-900 font-bold border-t border-blue-200 pt-1">
                            • Total you pay:{" "}
                            <span className="text-lg">
                              ₱
                              {(
                                parseFloat(budget) +
                                parseFloat(budget) * 0.5 * 0.1
                              ).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Duration
                      </label>
                      <Input
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 2 hours, 1 day"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional</p>
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <div className="flex gap-2">
                      {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setUrgency(level)}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            urgency === level
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {level === "LOW" && "🟢 Low"}
                          {level === "MEDIUM" && "🟡 Medium"}
                          {level === "HIGH" && "🔴 High"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional</p>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Location
                  </h2>

                  {/* Barangay */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    <Select value={barangay} onValueChange={setBarangay}>
                      <SelectTrigger
                        className={errors.location ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {barangays.map(
                          (brgy: { barangayID: number; name: string }) => (
                            <SelectItem key={brgy.barangayID} value={brgy.name}>
                              {brgy.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Street */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="House/Building No., Street Name"
                      className={errors.location ? "border-red-500" : ""}
                    />
                    {errors.location && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.location}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Materials Needed
                  </h2>
                  <p className="text-sm text-gray-600">
                    List any materials or tools the worker needs to bring
                  </p>

                  <div className="flex gap-2">
                    <Input
                      value={materialsInput}
                      onChange={(e) => setMaterialsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMaterial();
                        }
                      }}
                      placeholder="e.g., Pipe wrench, PVC pipes"
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {materials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {materials.map((material, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="pl-3 pr-1 py-1"
                        >
                          {material}
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(index)}
                            className="ml-2 hover:bg-gray-200 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="bg-white border-t fixed bottom-0 left-0 right-0 p-4 lg:ml-64">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Posting..." : "Post Job Listing"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Job Posted Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Workers will start applying soon
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
