"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  MessageSquare,
  Bell,
  Edit,
  Eye,
  RotateCcw,
  Save,
  X,
  Copy,
} from "lucide-react";
import { Sidebar } from "../../components";

interface NotificationTemplate {
  id: string;
  type: "email" | "sms" | "push";
  name: string;
  subject?: string;
  body_html?: string;
  body_text: string;
  is_active: boolean;
  last_modified?: string;
  variables: string[];
}

interface TemplatesResponse {
  success: boolean;
  templates: NotificationTemplate[];
}

export default function NotificationTemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    subject: "",
    body_html: "",
    body_text: "",
    is_active: true,
  });
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/notifications`,
        {
          credentials: "include",
        },
      );
      const data: TemplatesResponse = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    const data = {
      subject: template.subject || "",
      body_html: template.body_html || "",
      body_text: template.body_text,
      is_active: template.is_active,
    };
    setFormData(data);
    setOriginalData(data);
    setHasUnsavedChanges(false);
    setShowEditModal(true);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/notifications/${selectedTemplate.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert("Template updated successfully!");
        setShowEditModal(false);
        setHasUnsavedChanges(false);
        fetchTemplates();
      } else {
        alert(data.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    }
  };

  const handleResetTemplate = () => {
    if (
      !confirm("Reset this template to default? This will discard all changes.")
    ) {
      return;
    }
    if (originalData) {
      setFormData(originalData);
      setHasUnsavedChanges(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    // Insert at cursor position in body_text
    const textarea = document.getElementById(
      "body_text",
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body_text;
      const newText =
        text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData((prev) => ({ ...prev, body_text: newText }));
      setHasUnsavedChanges(true);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length + 4,
          start + variable.length + 4,
        );
      }, 0);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "sms":
        return <MessageSquare className="h-5 w-5" />;
      case "push":
        return <Bell className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case "email":
        return "blue";
      case "sms":
        return "green";
      case "push":
        return "purple";
      default:
        return "gray";
    }
  };

  const groupedTemplates = {
    email: templates.filter((t) => t.type === "email"),
    sms: templates.filter((t) => t.type === "sms"),
    push: templates.filter((t) => t.type === "push"),
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
                <Mail className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading notification templates...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching email, SMS, and push templates
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
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-pink-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
              <Mail className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Communication Templates
              </span>
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white">
              Notification Templates
            </h1>
            <p className="text-lg text-purple-100">
              Manage email, SMS, and push notification templates
            </p>
          </div>
        </div>

        {/* Template Groups */}
        <div className="space-y-8">
          {/* Email Templates */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Email Templates
              </h2>
              <span className="text-sm text-gray-500">
                ({groupedTemplates.email.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedTemplates.email.map((template) => (
                <Card
                  key={template.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        {template.subject && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Subject:</strong> {template.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {template.body_text.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            template.is_active ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              template.is_active
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {template.last_modified && (
                      <p className="text-xs text-gray-400 mb-3">
                        Last modified:{" "}
                        {new Date(template.last_modified).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditTemplate(template)}
                        size="sm"
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* SMS Templates */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                SMS Templates
              </h2>
              <span className="text-sm text-gray-500">
                ({groupedTemplates.sms.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedTemplates.sms.map((template) => (
                <Card
                  key={template.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-3">
                          {template.body_text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            template.is_active ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              template.is_active
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {template.last_modified && (
                      <p className="text-xs text-gray-400 mb-3">
                        Last modified:{" "}
                        {new Date(template.last_modified).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditTemplate(template)}
                        size="sm"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Push Notification Templates */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Push Notification Templates
              </h2>
              <span className="text-sm text-gray-500">
                ({groupedTemplates.push.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedTemplates.push.map((template) => (
                <Card
                  key={template.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-3">
                          {template.body_text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            template.is_active ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              template.is_active
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {template.last_modified && (
                      <p className="text-xs text-gray-400 mb-3">
                        Last modified:{" "}
                        {new Date(template.last_modified).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditTemplate(template)}
                        size="sm"
                        className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTemplate.type.toUpperCase()} Template
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      hasUnsavedChanges &&
                      !confirm("Discard unsaved changes?")
                    )
                      return;
                    setShowEditModal(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Editor Section */}
                  <div className="col-span-2 space-y-4">
                    {selectedTemplate.type === "email" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject Line
                        </label>
                        <Input
                          value={formData.subject}
                          onChange={(e) =>
                            handleChange("subject", e.target.value)
                          }
                          placeholder="Email subject..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Body
                      </label>
                      <textarea
                        id="body_text"
                        value={formData.body_text}
                        onChange={(e) =>
                          handleChange("body_text", e.target.value)
                        }
                        placeholder="Message content..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={selectedTemplate.type === "sms" ? 4 : 12}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.body_text.length} characters
                        {selectedTemplate.type === "sms" &&
                          " (160 chars per SMS)"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">
                          Active Status
                        </p>
                        <p className="text-sm text-gray-500">
                          Enable this notification template
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleChange("is_active", !formData.is_active)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.is_active ? "bg-green-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.is_active
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Variables Panel */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        Available Variables
                      </h3>
                      <p className="text-xs text-blue-700 mb-3">
                        Click to insert into message
                      </p>
                      <div className="space-y-2">
                        {selectedTemplate.variables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => handleInsertVariable(variable)}
                            className="w-full flex items-center gap-2 p-2 text-left text-sm bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Copy className="h-3 w-3 text-blue-600" />
                            <code className="text-blue-800">{`{{${variable}}}`}</code>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Preview
                      </h3>
                      <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                        {formData.body_text || (
                          <span className="text-gray-400 italic">
                            Empty message
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-between sticky bottom-0">
                <Button
                  onClick={handleResetTemplate}
                  variant="secondary"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Original
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (
                        hasUnsavedChanges &&
                        !confirm("Discard unsaved changes?")
                      )
                        return;
                      setShowEditModal(false);
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={!hasUnsavedChanges}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
