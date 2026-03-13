"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
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
  Search,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import { Badge } from "@/components/ui/badge";

// FAQ Data
const FAQ_CATEGORIES = [
  {
    id: "kyc",
    title: "KYC Verification",
    icon: Shield,
    questions: [
      {
        q: "What documents do I need for KYC verification?",
        a: "You need: 1) Business registration document (DTI or SEC), 2) Representative's valid government ID, and 3) Proof of business address.",
      },
      {
        q: "How long does KYC verification take?",
        a: "KYC verification typically takes 24-72 hours. You'll receive a notification once documents have been reviewed.",
      },
      {
        q: "Why was my KYC rejected?",
        a: "Common reasons include: blurry scans, expired IDs, or mismatch between business name and registration.",
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
        a: "Go to the Employees page and click 'Add Employee'. Invite them via email or add details manually.",
      },
      {
        q: "Can I assign employees to specific jobs?",
        a: "Yes, when accepting a job invitation, you can assign specific team members to the project.",
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
        a: "Earnings are deposited to your agency wallet after job completion. Withdrawals are processed to linked GCash or Bank accounts.",
      },
      {
        q: "What are the platform fees?",
        a: "The platform charges a 10% fee on the downpayment. Completion payments are subject to standard transaction processing fees.",
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>("kyc");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/agency/support/ticket`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.subject,
          category: formData.category,
          description: formData.description,
          contact_email: formData.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData, "Failed to submit ticket"));
      }

      const data = await response.json();
      setTicketId(data.ticket_id || "TKT-" + Date.now());
      setTicketSubmitted(true);
      toast.success("Support ticket submitted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setExpandedQuestion(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
             <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Help & Support</h1>
               <p className="text-gray-500 text-sm sm:text-base">
                 We're here to help you resolve issues and grow your agency
               </p>
             </div>
          </div>
          <Button
            onClick={() => router.push("/agency/support/tickets")}
            className="bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white border-0 rounded-xl px-5 font-bold text-[10px] uppercase tracking-wider h-11 shadow-lg shadow-sky-100"
          >
            <FileText className="h-3 w-3 mr-2" />
            My Support Tickets
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left: FAQ Section */}
        <div className="lg:col-span-2 space-y-8">
          <div>
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
               Frequenty Asked Questions
             </h3>
             <div className="space-y-4">
                {FAQ_CATEGORIES.map((category) => (
                  <Card key={category.id} className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white group">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl transition-colors ${expandedCategory === category.id ? "bg-[#00BAF1] text-white shadow-lg shadow-sky-100" : "bg-gray-50 text-gray-400"}`}>
                          <category.icon className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-900">{category.title}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">
                              {category.questions.length} Topics
                           </p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-300 ${expandedCategory === category.id ? "rotate-180 text-[#00BAF1]" : ""}`} />
                    </button>

                    {expandedCategory === category.id && (
                      <CardContent className="p-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="divide-y divide-gray-50">
                          {category.questions.map((qa, idx) => {
                            const questionKey = `${category.id}-${idx}`;
                            const isEq = expandedQuestion === questionKey;
                            return (
                              <div key={questionKey}>
                                <button
                                  onClick={() => setExpandedQuestion(isEq ? null : questionKey)}
                                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/30 transition-colors"
                                >
                                  <span className="text-xs font-bold text-gray-700 leading-relaxed max-w-[90%]">
                                    {qa.q}
                                  </span>
                                  {isEq ? (
                                    <ChevronUp className="h-3.5 w-3.5 text-[#00BAF1] flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                  )}
                                </button>
                                {isEq && (
                                  <div className="px-5 pb-5 text-xs font-medium text-gray-500 leading-relaxed bg-[#00BAF1]/[0.02]">
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

        </div>

        {/* Right: Contact Form */}
        <div className="space-y-8">
           <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Open a Ticket
              </h3>
              {ticketSubmitted ? (
                <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl bg-white text-center p-8">
                   <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Request Received</h3>
                   <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
                      We've assigned ID <span className="text-[#00BAF1] font-bold">{ticketId?.split('-')[1]}</span> to your ticket. A support agent will respond within 24 hours.
                   </p>
                   <Button
                      onClick={() => setTicketSubmitted(false)}
                      className="w-full bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                   >
                      Submit Another
                   </Button>
                </Card>
              ) : (
                <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl bg-white">
                  <CardHeader className="p-6 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold">Contact Support</CardTitle>
                    <CardDescription className="text-xs font-medium">We usually respond within 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmitTicket} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inquiry Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#00BAF1]/20 transition-all outline-none"
                        >
                          <option value="kyc">KYC Verification</option>
                          <option value="employees">Employee Management</option>
                          <option value="payments">Payments & Wallet</option>
                          <option value="account">Account Access</option>
                          <option value="other">Other Inquiry</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                        <Input
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="What do you need help with?"
                          className="h-12 bg-gray-50 border-gray-100 focus:bg-white rounded-xl font-bold"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe the issue in detail..."
                          className="min-h-[120px] bg-gray-50 border-gray-100 focus:bg-white rounded-xl p-4 font-bold text-sm resize-none"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#00BAF1] hover:bg-[#00BAF1]/90 text-white h-13 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-sky-100"
                      >
                        {isSubmitting ? "Sending..." : "Send Request"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
           </div>

           {/* Stats/Quick Tips */}
           <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-[#00BAF1]/10 rounded-xl">
                    <LifeBuoy className="h-4 w-4 text-[#00BAF1]" />
                 </div>
                 <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Quick Contact</p>
              </div>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">Email Response</span>
                    <span className="text-xs font-bold text-gray-900">~24 Hours</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">Operating Hours</span>
                    <span className="text-xs font-bold text-gray-900">Mon-Fri, 9AM-6PM</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
