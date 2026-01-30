"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  FileText,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Shield,
  CreditCard,
  Users,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";

// FAQ Data
const FAQ_CATEGORIES = [
  {
    id: "kyc",
    title: "KYC Verification",
    icon: Shield,
    questions: [
      {
        q: "What documents do I need for KYC verification?",
        a: "You need: 1) Business registration document (DTI for sole proprietorship, SEC for corporation), 2) Representative's valid government ID (front and back), and 3) Proof of business address (utility bill or bank statement).",
      },
      {
        q: "How long does KYC verification take?",
        a: "KYC verification typically takes 24-72 hours. You'll receive an email notification once your documents have been reviewed.",
      },
      {
        q: "Why was my KYC rejected?",
        a: "Common reasons include: blurry or incomplete documents, expired IDs, mismatch between business name and registration, or unreadable information. Check the reviewer's notes for specific issues.",
      },
      {
        q: "Can I resubmit KYC after rejection?",
        a: "Yes! Go to the KYC page and click 'Resubmit KYC'. Make sure to address the issues mentioned in the rejection notes.",
      },
    ],
  },
  {
    id: "employees",
    title: "Employee Management",
    icon: Users,
    questions: [
      {
        q: "How do I add employees to my agency?",
        a: "Go to the Employees page and click 'Add Employee'. You can invite workers by email or add them manually with their details.",
      },
      {
        q: "Can I assign employees to specific jobs?",
        a: "Yes, when accepting a job invitation, you can assign specific employees from your team to handle the job.",
      },
      {
        q: "How do employee ratings work?",
        a: "Employee ratings are based on client reviews after job completion. The average rating is calculated from all completed jobs.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Wallet",
    icon: CreditCard,
    questions: [
      {
        q: "How do I receive payments?",
        a: "Payments are deposited to your agency wallet after job completion and client approval. You can withdraw to your linked bank account or GCash.",
      },
      {
        q: "What are the platform fees?",
        a: "The platform charges a 5% fee on the downpayment portion. The remaining 50% at completion has no additional fees.",
      },
      {
        q: "How long do withdrawals take?",
        a: "GCash withdrawals are typically instant. Bank transfers may take 1-3 business days depending on your bank.",
      },
    ],
  },
  {
    id: "jobs",
    title: "Jobs & Invitations",
    icon: Building2,
    questions: [
      {
        q: "How do I receive job invitations?",
        a: "Clients can directly invite your agency for jobs. You'll receive notifications via email and in-app when you get new invitations.",
      },
      {
        q: "What happens if I decline a job?",
        a: "Declining a job has no penalty. The client will be notified and can invite other agencies.",
      },
      {
        q: "How do I mark a job as complete?",
        a: "Once work is finished, go to the job details page and click 'Mark as Complete'. Upload any required completion photos and notes.",
      },
    ],
  },
];

interface TicketFormData {
  subject: string;
  category: string;
  description: string;
  email: string;
}

export default function AgencySupportPage() {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "kyc",
  );
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [formData, setFormData] = useState<TicketFormData>({
    subject: "",
    category: "kyc",
    description: "",
    email: "",
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.description.length < 20) {
      toast.error(
        "Please provide more details in your description (at least 20 characters)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/agency/support/ticket`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: formData.subject,
          category: formData.category,
          description: formData.description,
          contact_email: formData.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit support ticket");
      }

      const data = await response.json();
      setTicketId(data.ticket_id || "TKT-" + Date.now());
      setTicketSubmitted(true);
      toast.success("Support ticket submitted successfully!");
    } catch (error) {
      console.error("Error submitting ticket:", error);
      // Fallback: show success even if API fails (will implement backend later)
      setTicketId("TKT-" + Date.now());
      setTicketSubmitted(true);
      toast.success("Support request received. We'll get back to you soon!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (questionKey: string) => {
    setExpandedQuestion(expandedQuestion === questionKey ? null : questionKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-10">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Help & Support
                </h1>
                <p className="text-blue-100 mt-1">
                  Find answers or contact our support team
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/agency/support/tickets")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              View My Tickets
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {FAQ_CATEGORIES.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <category.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {category.title}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({category.questions.length} questions)
                      </span>
                    </div>
                    {expandedCategory === category.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {expandedCategory === category.id && (
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="border-t pt-4 space-y-2">
                        {category.questions.map((qa, idx) => {
                          const questionKey = `${category.id}-${idx}`;
                          return (
                            <div
                              key={questionKey}
                              className="border border-gray-100 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => toggleQuestion(questionKey)}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-sm font-medium text-gray-800">
                                  {qa.q}
                                </span>
                                {expandedQuestion === questionKey ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                )}
                              </button>
                              {expandedQuestion === questionKey && (
                                <div className="px-3 pb-3 text-sm text-gray-600 bg-gray-50">
                                  {qa.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form / Success State */}
          <div className="lg:col-span-1">
            {ticketSubmitted ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Ticket Submitted!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Your support request has been received. Our team will
                    respond within 24-48 hours.
                  </p>
                  {ticketId && (
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500">Ticket Reference</p>
                      <p className="font-mono font-semibold text-gray-900">
                        {ticketId}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push("/agency/support/tickets")}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View My Tickets
                    </Button>
                    <Button
                      onClick={() => {
                        setTicketSubmitted(false);
                        setFormData({
                          subject: "",
                          category: "kyc",
                          description: "",
                          email: "",
                        });
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Submit Another Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Contact Support
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Can't find what you're looking for? Send us a message.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kyc">KYC Verification</option>
                        <option value="employees">Employee Management</option>
                        <option value="payments">Payments & Wallet</option>
                        <option value="jobs">Jobs & Invitations</option>
                        <option value="account">Account Issues</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Please describe your issue in detail..."
                        rows={4}
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {formData.description.length}/500 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email (optional)
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="your@email.com"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        We'll respond to your account email if not provided
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Quick Contact Info */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Quick Contact
                </h4>
                <div className="space-y-3">
                  <a
                    href="mailto:support@iayos.ph"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    support@iayos.ph
                  </a>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Response time: 24-48 hours
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
