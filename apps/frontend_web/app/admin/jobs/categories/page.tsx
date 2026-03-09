"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { API_BASE } from "@/lib/api/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Banknote,
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
  ChevronRight,
  Loader2,
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

  const validate = (): boolean => {
    const errors: Partial<CategoryFormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    const rate = parseFloat(formData.minimum_rate);
    if (formData.minimum_rate === "" || isNaN(rate) || rate < 0)
      errors.minimum_rate = "Enter a valid rate (≥ 0)";
    const min = formData.average_project_cost_min === "" ? 0 : parseFloat(formData.average_project_cost_min);
    const max = formData.average_project_cost_max === "" ? 0 : parseFloat(formData.average_project_cost_max);
    if (isNaN(min) || min < 0) errors.average_project_cost_min = "Enter a valid amount (≥ 0)";
    if (isNaN(max) || max < 0) errors.average_project_cost_max = "Enter a valid amount (≥ 0)";
    if (!isNaN(min) && !isNaN(max) && max < min)
      errors.average_project_cost_max = "Max must be ≥ Min";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto" />
                <Briefcase className="h-6 w-6 text-[#00BAF1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">Loading categories...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-8 pt-10">
          {/* Header */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Categories & Rates</h1>
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Minimum rates based on DOLE guidelines and industry standards
                </p>
              </div>
              <Button
                onClick={openCreate}
                className="bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Target className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Categories</p>
                <p className="text-xl font-bold text-gray-900">{totalCategories}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Banknote className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Avg Min Rate</p>
                <p className="text-xl font-bold text-gray-900">₱{avgMinRate.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><FileText className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Jobs</p>
                <p className="text-xl font-bold text-gray-900">{totalJobs}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="py-1.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#00BAF1]/10 rounded-lg"><Users className="h-5 w-5 text-[#00BAF1]" /></div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Total Workers</p>
                <p className="text-xl font-bold text-gray-900">{totalWorkers}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white shadow-sm"
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
                    className={`flex items-center gap-1.5 px-4 h-12 rounded-xl text-sm font-semibold border-2 transition-all ${active
                      ? "border-[#00BAF1] bg-[#00BAF1]/10 text-[#00BAF1]"
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
                <CardContent className="relative p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Name and Description */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                            {category.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {category.description || <span className="text-gray-400 italic">No description provided</span>}
                        </p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Banknote className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Min Rate</p>
                            <p className="font-bold text-gray-900">₱{category.minimum_rate}/day</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Avg Project</p>
                            <p className="font-semibold text-gray-900 truncate">
                              ₱{category.average_project_cost_min.toLocaleString()}-
                              {category.average_project_cost_max.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <FileText className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Jobs</p>
                            <p className="font-bold text-gray-900">{category.jobs_count}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                            <Users className="h-4 w-4 text-[#00BAF1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Workers</p>
                            <p className="font-bold text-gray-900">{category.workers_count}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex md:flex-col gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-sky-50 hover:bg-[#00BAF1] text-[#00BAF1] hover:text-white transition-all"
                        onClick={() => openEdit(category)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <Briefcase className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchQuery ? "No categories match your search criteria." : "There are no job categories yet. Start by adding one."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? "Update Category" : "New Category"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Configure job category rates and details</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                  <Input
                    ref={firstInputRef}
                    placeholder="e.g. Graphic Design"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all ${formErrors.name ? "border-red-500 ring-red-100" : "focus:border-[#00BAF1] focus:ring-[#00BAF1]/20"}`}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe the services included in this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#00BAF1] focus:ring-4 focus:ring-[#00BAF1]/10 focus:outline-none transition-all resize-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Daily Rate (₱)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.minimum_rate}
                    onChange={(e) => setFormData({ ...formData, minimum_rate: e.target.value })}
                    className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all ${formErrors.minimum_rate ? "border-red-500 ring-red-100" : "focus:border-[#00BAF1] focus:ring-[#00BAF1]/20"}`}
                  />
                  {formErrors.minimum_rate && <p className="mt-1 text-xs text-red-600">{formErrors.minimum_rate}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Avg Min Project Cost (₱)</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={formData.average_project_cost_min}
                      onChange={(e) => setFormData({ ...formData, average_project_cost_min: e.target.value })}
                      className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all focus:border-[#00BAF1] focus:ring-[#00BAF1]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Avg Max Project Cost (₱)</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={formData.average_project_cost_max}
                      onChange={(e) => setFormData({ ...formData, average_project_cost_max: e.target.value })}
                      className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all focus:border-[#00BAF1] focus:ring-[#00BAF1]/20 ${formErrors.average_project_cost_max ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>
                {formErrors.average_project_cost_max && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.average_project_cost_max}</p>
                )}
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-3xl">
              <Button variant="ghost" onClick={closeModal} className="h-12 px-6 rounded-xl hover:bg-gray-200 transition-all font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-12 px-8 bg-[#00BAF1] hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-[#00BAF1]/20 transition-all font-bold flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Category?</h2>
              <p className="text-gray-500 leading-relaxed">
                Deletion will permanently remove <span className="font-bold text-gray-900">"{deleteTarget.name}"</span>.
                This cannot be undone.
              </p>
              {deleteTarget.jobs_count > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-700 italic">
                  Note: This category has {deleteTarget.jobs_count} associated jobs.
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-semibold hover:bg-gray-100"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
