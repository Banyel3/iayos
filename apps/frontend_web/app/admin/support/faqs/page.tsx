"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Sidebar } from "../../components";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  views: number;
  order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["all", "account", "payments", "jobs", "workers", "general"];

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [previewFaq, setPreviewFaq] = useState<FAQ | null>(null);
  const [selectedFaqs, setSelectedFaqs] = useState<string[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);

  // Form state
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formIsPublished, setFormIsPublished] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [faqs, searchTerm, categoryFilter, publishedFilter]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/faqs`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterFaqs = () => {
    let filtered = faqs;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((f) => f.category === categoryFilter);
    }

    if (publishedFilter === "published") {
      filtered = filtered.filter((f) => f.is_published);
    } else if (publishedFilter === "draft") {
      filtered = filtered.filter((f) => !f.is_published);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.question.toLowerCase().includes(search) ||
          f.answer.toLowerCase().includes(search)
      );
    }

    setFilteredFaqs(filtered);
  };

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormQuestion(faq.question);
      setFormAnswer(faq.answer);
      setFormCategory(faq.category);
      setFormIsPublished(faq.is_published);
    } else {
      setEditingFaq(null);
      setFormQuestion("");
      setFormAnswer("");
      setFormCategory("general");
      setFormIsPublished(false);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        question: formQuestion,
        answer: formAnswer,
        category: formCategory,
        is_published: formIsPublished,
      };

      const url = editingFaq
        ? `${API_BASE}/api/adminpanel/support/faqs/${editingFaq.id}`
        : `${API_BASE}/api/adminpanel/support/faqs`;

      await fetch(url, {
        method: editingFaq ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      setShowModal(false);
      fetchFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
    }
  };

  const handleDelete = async (id: string, views: number) => {
    const warningMsg =
      views > 100
        ? `This FAQ has ${views} views. Are you sure you want to delete it?`
        : "Delete this FAQ?";

    if (!confirm(warningMsg)) return;

    try {
      await fetch(`${API_BASE}/api/adminpanel/support/faqs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchFaqs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const handleDuplicate = (faq: FAQ) => {
    setFormQuestion(faq.question + " (Copy)");
    setFormAnswer(faq.answer);
    setFormCategory(faq.category);
    setFormIsPublished(false);
    setEditingFaq(null);
    setShowModal(true);
  };

  const handlePreview = (faq: FAQ) => {
    setPreviewFaq(faq);
    setShowPreviewModal(true);
  };

  const handleBulkPublish = async () => {
    if (selectedFaqs.length === 0) return;
    alert(`Publishing ${selectedFaqs.length} FAQs`);
    // TODO: Implement bulk publish API
  };

  const handleBulkUnpublish = async () => {
    if (selectedFaqs.length === 0) return;
    alert(`Unpublishing ${selectedFaqs.length} FAQs`);
    // TODO: Implement bulk unpublish API
  };

  const handleBulkDelete = async () => {
    if (selectedFaqs.length === 0) return;
    if (!confirm(`Delete ${selectedFaqs.length} FAQs?`)) return;
    alert(`Deleting ${selectedFaqs.length} FAQs`);
    // TODO: Implement bulk delete API
  };

  const toggleExpanded = (id: string) => {
    setExpandedFaqs((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const toggleSelectFaq = (id: string) => {
    setSelectedFaqs((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-teal-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <HelpCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">FAQ Management</h1>
                  </div>
                  <p className="text-green-100 text-lg">
                    Manage frequently asked questions for self-service support
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-white text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 self-center">
                    Category:
                  </span>
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      variant={categoryFilter === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <span className="text-sm font-medium text-gray-700 self-center">
                    Status:
                  </span>
                  <Button
                    variant={publishedFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPublishedFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      publishedFilter === "published" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPublishedFilter("published")}
                  >
                    Published
                  </Button>
                  <Button
                    variant={
                      publishedFilter === "draft" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPublishedFilter("draft")}
                  >
                    Drafts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedFaqs.length > 0 && (
            <Card className="border-0 shadow-lg bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedFaqs.length} FAQ(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkPublish}
                    >
                      Bulk Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkUnpublish}
                    >
                      Bulk Unpublish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                    >
                      Bulk Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFaqs([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQs List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-400 animate-pulse mx-auto" />
                  <p className="text-gray-500 mt-4">Loading FAQs...</p>
                </CardContent>
              </Card>
            ) : filteredFaqs.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-500 mt-4">No FAQs found</p>
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    Create Your First FAQ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFaqs.map((faq) => (
                <Card
                  key={faq.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFaqs.includes(faq.id)}
                          onChange={() => toggleSelectFaq(faq.id)}
                          className="mt-1"
                        />
                        <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">
                                {faq.question}
                              </h3>
                              {expandedFaqs.includes(faq.id) && (
                                <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                                  {faq.answer}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(faq.id)}
                            >
                              {expandedFaqs.includes(faq.id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-green-100 text-green-700">
                              {faq.category}
                            </Badge>
                            <Badge
                              className={
                                faq.is_published
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {faq.is_published ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">
                              👁 {faq.views} views
                            </Badge>
                            <Badge variant="outline">Order: {faq.order}</Badge>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(faq)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenModal(faq)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicate(faq)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(faq.id, faq.views)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </h2>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="What is your question?"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formQuestion.length}/200 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="Provide a detailed answer..."
                    className="w-full min-h-[200px] px-4 py-3 border rounded-lg resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="account">Account</option>
                    <option value="payments">Payments</option>
                    <option value="jobs">Jobs</option>
                    <option value="workers">Workers</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    id="published"
                  />
                  <label htmlFor="published" className="text-sm font-medium">
                    Publish immediately
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formQuestion.trim() || !formAnswer.trim()}
                    className="flex-1"
                  >
                    {editingFaq
                      ? "Update"
                      : formIsPublished
                        ? "Publish"
                        : "Save as Draft"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Preview</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-xl font-bold mb-3">
                    {previewFaq.question}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {previewFaq.answer}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge>{previewFaq.category}</Badge>
                  <Badge variant="outline">👁 {previewFaq.views} views</Badge>
                </div>

                <Button
                  onClick={() => setShowPreviewModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
