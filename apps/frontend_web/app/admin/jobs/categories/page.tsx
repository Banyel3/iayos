"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Target,
  Edit,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface JobCategory {
  id: number;
  name: string;
  description: string;
  minimum_rate: number;
  average_project_cost_min: number;
  average_project_cost_max: number;
  jobs_count: number;
  workers_count: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  minimum_rate: string;
  average_project_cost_min: string;
  average_project_cost_max: string;
}

const EMPTY_FORM: CategoryFormData = {
  name: "",
  description: "",
  minimum_rate: "",
  average_project_cost_min: "",
  average_project_cost_max: "",
};

export default function JobCategoriesPage() {
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"minimum_rate" | "jobs_count" | "workers_count" | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<JobCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Focus first input when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/adminpanel/jobs/categories`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────
  // Modal helpers
  // ──────────────────────────────────────────
  const openCreate = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat: JobCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description,
      minimum_rate: String(cat.minimum_rate),
      average_project_cost_min: String(cat.average_project_cost_min),
      average_project_cost_max: String(cat.average_project_cost_max),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormErrors({});
  };

  // ──────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Partial<CategoryFormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    const rate = parseFloat(formData.minimum_rate);
    if (formData.minimum_rate === "" || isNaN(rate) || rate < 0)
      errors.minimum_rate = "Enter a valid rate (≥ 0)";
    // Cost fields are optional — only validate if provided
    const min = formData.average_project_cost_min === "" ? 0 : parseFloat(formData.average_project_cost_min);
    const max = formData.average_project_cost_max === "" ? 0 : parseFloat(formData.average_project_cost_max);
    if (isNaN(min) || min < 0) errors.average_project_cost_min = "Enter a valid amount (≥ 0)";
    if (isNaN(max) || max < 0) errors.average_project_cost_max = "Enter a valid amount (≥ 0)";
    if (!isNaN(min) && !isNaN(max) && max < min)
      errors.average_project_cost_max = "Max must be ≥ Min";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ──────────────────────────────────────────
  // Save (Create or Update)
  // ──────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        minimum_rate: parseFloat(formData.minimum_rate),
        rate_type: "daily",
        average_project_cost_min: formData.average_project_cost_min === "" ? 0 : parseFloat(formData.average_project_cost_min),
        average_project_cost_max: formData.average_project_cost_max === "" ? 0 : parseFloat(formData.average_project_cost_max),
      };

      const url = editingCategory
        ? `${API_BASE}/api/adminpanel/jobs/categories/${editingCategory.id}`
        : `${API_BASE}/api/adminpanel/jobs/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          editingCategory
            ? `"${payload.name}" updated successfully`
            : `"${payload.name}" created successfully`
        );
        closeModal();
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch (e) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ──────────────────────────────────────────
  // Delete
  // ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/adminpanel/jobs/categories/${deleteTarget.id}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Category deleted");
        setDeleteTarget(null);
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch (e) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────
  // Derived data
  // ──────────────────────────────────────────
  const filtered = categories
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      return sortDir === "desc" ? b[sortField] - a[sortField] : a[sortField] - b[sortField];
    });

  const handleSort = (field: "minimum_rate" | "jobs_count" | "workers_count") => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      // third click — clear
      setSortField(null);
      setSortDir("desc");
    }
  };
  const totalCategories = categories.length;
  const avgMinRate =
    categories.length > 0
      ? Math.round(
        categories.reduce((s, c) => s + c.minimum_rate, 0) / totalCategories
      )
      : 0;
  const totalJobs = categories.reduce((s, c) => s + c.jobs_count, 0);
  const totalWorkers = categories.reduce((s, c) => s + c.workers_count, 0);



  // ──────────────────────────────────────────
  // Loading
  // ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto" />
                <Briefcase className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">Loading categories...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">Job Categories & Rates</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Minimum rates based on DOLE guidelines and industry standards
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl shadow hover:bg-blue-50 hover:shadow-md transition-all shrink-0"
              >
                <Plus className="h-5 w-5" />
                Add Category
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Total Categories", value: totalCategories, icon: Target, color: "blue" },
              { label: "Avg Min Rate", value: `₱${avgMinRate}`, icon: DollarSign, color: "emerald" },
              { label: "Total Jobs", value: totalJobs, icon: FileText, color: "orange" },
              { label: "Total Workers", value: totalWorkers, icon: Users, color: "indigo" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-${color}-100 rounded-xl`}>
                      <Icon className={`h-6 w-6 text-${color}-600`} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                  <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {([
                { field: "minimum_rate" as const, label: "Min Rate" },
                { field: "jobs_count" as const, label: "Jobs" },
                { field: "workers_count" as const, label: "Workers" },
              ]).map(({ field, label }) => {
                const active = sortField === field;
                return (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${active
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {label}
                    <span className={`text-xs ${active ? "opacity-100" : "opacity-30"}`}>
                      {active && sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Cards */}
          <div className="space-y-4">
            {filtered.map((category) => (
              <Card
                key={category.id}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {category.description || <span className="text-gray-400 italic">No description</span>}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Min Rate</p>
                            <p className="font-bold text-gray-900">
                              ₱{category.minimum_rate}/day
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Project Cost</p>
                            <p className="font-semibold text-gray-900 truncate">
                              ₱{(category.average_project_cost_min ?? 0).toLocaleString()}-
                              {(category.average_project_cost_max ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Jobs</p>
                            <p className="font-bold text-gray-900">{category.jobs_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Workers</p>
                            <p className="font-bold text-gray-900">{category.workers_count}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(category)}
                        className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-100"
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-100"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <Briefcase className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {searchQuery
                    ? "No categories match your search."
                    : "There are no job categories yet."}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Category
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────
          Create / Edit Modal
      ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingCategory
                    ? "Update the category details below"
                    : "Fill in the details for the new job category"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Plumbing Services"
                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.name ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                    } focus:outline-none focus:ring-2 focus:border-blue-500 text-gray-900 transition-colors`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this job category..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-900 resize-none transition-colors"
                />
              </div>

              {/* Rate row */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Minimum Daily Rate (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_rate}
                  onChange={(e) => setFormData({ ...formData, minimum_rate: e.target.value })}
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.minimum_rate ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                    } focus:outline-none focus:ring-2 focus:border-blue-500 text-gray-900 transition-colors`}
                />
                {formErrors.minimum_rate && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.minimum_rate}</p>
                )}
              </div>


              {/* Project cost range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Avg Project Cost Range (₱)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.average_project_cost_min}
                      onChange={(e) =>
                        setFormData({ ...formData, average_project_cost_min: e.target.value })
                      }
                      placeholder="Min"
                      className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.average_project_cost_min
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 focus:border-blue-500 text-gray-900 transition-colors`}
                    />
                    {formErrors.average_project_cost_min && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.average_project_cost_min}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.average_project_cost_max}
                      onChange={(e) =>
                        setFormData({ ...formData, average_project_cost_max: e.target.value })
                      }
                      placeholder="Max"
                      className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.average_project_cost_max
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 focus:border-blue-500 text-gray-900 transition-colors`}
                    />
                    {formErrors.average_project_cost_max && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.average_project_cost_max}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  editingCategory ? "Save Changes" : "Create Category"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          Delete Confirmation Dialog
      ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delete Category</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">"{deleteTarget.name}"</span>?
              </p>
              {deleteTarget.jobs_count > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  ⚠️ This category has <strong>{deleteTarget.jobs_count}</strong> job(s) associated with it.
                  Deletion will be blocked if any are active or in-progress.
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
