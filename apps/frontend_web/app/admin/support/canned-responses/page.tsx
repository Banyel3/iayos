"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Sidebar } from "../../components";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  usage_count: number;
  shortcuts?: string[];
}

const CATEGORIES = ["all", "account", "payment", "technical", "general"];

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<CannedResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formShortcuts, setFormShortcuts] = useState("");

  useEffect(() => {
    fetchResponses();
  }, []);

  useEffect(() => {
    filterResponses();
  }, [responses, searchTerm, categoryFilter]);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/support/canned-responses`,
        { credentials: "include" },
      );
      const data = await response.json();

      if (data.success) {
        setResponses(data.responses);
      }
    } catch (error) {
      console.error("Error fetching canned responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterResponses = () => {
    let filtered = responses;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.content.toLowerCase().includes(search),
      );
    }

    setFilteredResponses(filtered);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenModal = (response?: CannedResponse) => {
    if (response) {
      setEditingResponse(response);
      setFormTitle(response.title);
      setFormContent(response.content);
      setFormCategory(response.category);
      setFormShortcuts(response.shortcuts?.join(", ") || "");
    } else {
      setEditingResponse(null);
      setFormTitle("");
      setFormContent("");
      setFormCategory("general");
      setFormShortcuts("");
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        title: formTitle,
        content: formContent,
        category: formCategory,
        shortcuts: formShortcuts
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const url = editingResponse
        ? `${API_BASE}/api/adminpanel/support/canned-responses/${editingResponse.id}`
        : `${API_BASE}/api/adminpanel/support/canned-responses`;

      await fetch(url, {
        method: editingResponse ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      setShowModal(false);
      fetchResponses();
    } catch (error) {
      console.error("Error saving response:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this canned response?")) return;

    try {
      await fetch(`${API_BASE}/api/adminpanel/support/canned-responses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchResponses();
    } catch (error) {
      console.error("Error deleting response:", error);
    }
  };

  const renderPreview = () => {
    let preview = formContent;
    preview = preview.replace(/\{\{user_name\}\}/g, "John Doe");
    preview = preview.replace(/\{\{ticket_subject\}\}/g, "Sample Ticket");
    preview = preview.replace(
      /\{\{current_date\}\}/g,
      new Date().toLocaleDateString(),
    );
    return preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="pl-72 p-8 min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">Canned Responses</h1>
                  </div>
                  <p className="text-purple-100 text-lg">
                    Quick reply templates for common support questions
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-white text-purple-700 hover:bg-purple-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Response
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
                    placeholder="Search responses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
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
              </div>
            </CardContent>
          </Card>

          {/* Responses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 animate-pulse mx-auto" />
                <p className="text-gray-500 mt-4">Loading responses...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-500 mt-4">No responses found</p>
              </div>
            ) : (
              filteredResponses.map((response) => (
                <Card
                  key={response.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {response.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {response.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-purple-100 text-purple-700">
                          {response.category}
                        </Badge>
                        <Badge variant="outline">
                          Used {response.usage_count} times
                        </Badge>
                        {response.shortcuts?.map((shortcut) => (
                          <Badge
                            key={shortcut}
                            variant="outline"
                            className="text-xs"
                          >
                            {shortcut}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCopy(response.content, response.id)
                          }
                          className="flex-1"
                        >
                          {copiedId === response.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(response)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(response.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingResponse ? "Edit Response" : "Add New Response"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Standard Refund Response"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formTitle.length}/100 characters
                  </p>
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
                    <option value="payment">Payment</option>
                    <option value="technical">Technical</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Use variables: {{user_name}}, {{ticket_subject}}, {{current_date}}"
                    className="w-full min-h-[150px] px-4 py-3 border rounded-lg resize-y"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {"{{user_name}}"},{" "}
                    {"{{ticket_subject}}"}, {"{{current_date}}"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Shortcuts (comma-separated)
                  </label>
                  <Input
                    value={formShortcuts}
                    onChange={(e) => setFormShortcuts(e.target.value)}
                    placeholder="/refund, /ref"
                  />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">
                    Preview
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {renderPreview()}
                    </p>
                  </div>
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
                    disabled={!formTitle.trim() || !formContent.trim()}
                    className="flex-1"
                  >
                    {editingResponse ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
