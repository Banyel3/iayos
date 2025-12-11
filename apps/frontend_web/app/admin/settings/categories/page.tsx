"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "../../components";

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  is_active: boolean;
  job_count: number;
  order_index?: number;
}

interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  total: number;
}

export default function CategoryManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [reassignCategoryId, setReassignCategoryId] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/settings/categories",
        {
          credentials: "include",
        }
      );
      const data: CategoriesResponse = await response.json();

      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cat) =>
        statusFilter === "active" ? cat.is_active : !cat.is_active
      );
    }

    setFilteredCategories(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Category name is required";
    } else if (formData.name.length > 50) {
      errors.name = "Name must be 50 characters or less";
    }

    if (!formData.icon.trim()) {
      errors.icon = "Icon is required";
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = "Description must be 200 characters or less";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = () => {
    setModalMode("add");
    setFormData({
      name: "",
      icon: "",
      description: "",
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description || "",
      is_active: category.is_active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    try {
      const url =
        modalMode === "add"
          ? "http://localhost:8000/api/adminpanel/settings/categories"
          : `http://localhost:8000/api/adminpanel/settings/categories/${selectedCategory?.id}`;

      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          modalMode === "add"
            ? "Category created successfully!"
            : "Category updated successfully!"
        );
        setShowModal(false);
        fetchCategories();
      } else {
        alert(data.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/settings/categories/${category.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_active: !category.is_active }),
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Error toggling category status:", error);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setReassignCategoryId("");
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    if (categoryToDelete.job_count > 0 && !reassignCategoryId) {
      alert("Please select a category to reassign existing jobs to");
      return;
    }

    try {
      const url = `http://localhost:8000/api/adminpanel/settings/categories/${categoryToDelete.id}`;
      const params = reassignCategoryId
        ? `?reassign_to=${reassignCategoryId}`
        : "";

      const response = await fetch(url + params, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        alert("Category deleted successfully!");
        setShowDeleteModal(false);
        fetchCategories();
      } else {
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <FolderTree className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading categories...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching service categories
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
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-purple-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-pink-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <FolderTree className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Service Categories
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-white">
                Category Management
              </h1>
              <p className="text-lg text-purple-100">
                Manage service categories and organize job listings
              </p>
            </div>
            <Button
              onClick={handleAddCategory}
              className="gap-2 bg-white text-purple-600 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4" />
              Add New Category
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Categories
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {categories.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FolderTree className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {activeCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">
                    {inactiveCount}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-purple-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-4 h-12 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle>Categories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-gray-500 font-medium">
                            No categories found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your filters"
                              : "Get started by creating your first category"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-3xl">{category.icon}</div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {category.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-md truncate">
                            {category.description || (
                              <span className="text-gray-400 italic">
                                No description
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Briefcase className="h-3 w-3" />
                            {category.job_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(category)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              category.is_active
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                category.is_active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEditCategory(category)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(category)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalMode === "add" ? "Add New Category" : "Edit Category"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Plumbing, Electrical, etc."
                    className={formErrors.name ? "border-red-500" : ""}
                    maxLength={50}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.name.length}/50 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="🔧 Enter emoji"
                    className={formErrors.icon ? "border-red-500" : ""}
                  />
                  {formErrors.icon && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.icon}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Use emoji or icon character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this category..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.description
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    rows={3}
                    maxLength={200}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/200 characters
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Active Status</p>
                    <p className="text-sm text-gray-500">
                      Make this category visible to users
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: !formData.is_active,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_active ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <Button onClick={() => setShowModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCategory}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {modalMode === "add" ? "Create Category" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-red-600">
                  Delete Category
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">Warning</p>
                    <p className="text-sm text-red-700 mt-1">
                      You are about to delete the category "
                      {categoryToDelete.name}"
                    </p>
                  </div>
                </div>

                {categoryToDelete.job_count > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      This category has{" "}
                      <strong>
                        {categoryToDelete.job_count} active job(s)
                      </strong>
                      . Please select a category to reassign them to:
                    </p>
                    <select
                      value={reassignCategoryId}
                      onChange={(e) => setReassignCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select category...</option>
                      {categories
                        .filter(
                          (c) => c.id !== categoryToDelete.id && c.is_active
                        )
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteCategory}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Category
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
