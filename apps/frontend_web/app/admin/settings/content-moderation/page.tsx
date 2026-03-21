"use client";

import { API_BASE } from "@/lib/api/config";
import { useEffect, useMemo, useState } from "react";
import { Sidebar, useMainContentClass } from "../../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldAlert,
  Plus,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
} from "lucide-react";

interface ModerationTerm {
  id: number;
  term: string;
  normalized_term: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export default function ContentModerationSettingsPage() {
  const mainClass = useMainContentClass("p-4 sm:p-8 min-h-screen");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState<ModerationTerm[]>([]);
  const [search, setSearch] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: "1", page_size: "100" });
      if (search.trim()) {
        query.set("search", search.trim());
      }

      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/content-moderation?${query.toString()}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load moderation terms");
      }

      setTerms(data.terms || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load moderation terms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTerms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.normalized_term.toLowerCase().includes(q),
    );
  }, [terms, search]);

  const handleCreate = async () => {
    const term = newTerm.trim();
    if (!term) {
      toast.error("Please enter a term");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/content-moderation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ term }),
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create term");
      }

      toast.success("Moderation term added");
      setNewTerm("");
      await fetchTerms();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create term");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (termId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/content-moderation/${termId}/toggle`,
        {
          method: "PUT",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update term status");
      }

      toast.success("Term status updated");
      await fetchTerms();
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle term");
    }
  };

  const handleDelete = async (termId: number, termLabel: string) => {
    if (!confirm(`Delete moderation term "${termLabel}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/content-moderation/${termId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete term");
      }

      toast.success("Term deleted");
      await fetchTerms();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete term");
    }
  };

  const handleSaveEdit = async (termId: number) => {
    const next = editValue.trim();
    if (!next) {
      toast.error("Term is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/content-moderation/${termId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ term: next }),
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update term");
      }

      toast.success("Term updated");
      setEditingId(null);
      setEditValue("");
      await fetchTerms();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update term");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        <div className="max-w-7xl mx-auto space-y-6 pt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Content Moderation
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage profanity and blocked words used for job posting validation.
              </p>
            </div>
            <Button
              onClick={fetchTerms}
              variant="secondary"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#00BAF1]" />
                Add Moderation Term
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter word or phrase"
                maxLength={120}
              />
              <Button onClick={handleCreate} disabled={saving} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-[#00BAF1]" />
                Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search term"
              />

              {loading ? (
                <p className="text-sm text-gray-500">Loading terms...</p>
              ) : filteredTerms.length === 0 ? (
                <p className="text-sm text-gray-500">No terms found.</p>
              ) : (
                <div className="space-y-2">
                  {filteredTerms.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              maxLength={120}
                            />
                            <Button
                              onClick={() => handleSaveEdit(item.id)}
                              size="sm"
                            >
                              Save
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditValue("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900 break-words">
                              {item.term}
                            </p>
                            <p className="text-xs text-gray-500 break-words">
                              normalized: {item.normalized_term}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggle(item.id)}
                          className="gap-1"
                        >
                          {item.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditValue(item.term);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.term)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
