"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import Link from "next/link";

interface InvoiceData {
  job_id: number;
  invoice_number: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
  created_at: string;
  completed_at: string | null;
  client: {
    id: number | null;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  worker: {
    id: number | null;
    name: string;
    email: string;
    phone: string;
  };
  budget: number;
  budget_type: string;
  subtotal: number;
  downpayment: number;
  platform_fee: number;
  remaining_balance: number;
  final_amount: number;
  payment_status: string;
  transactions: {
    id: number;
    type: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }[];
  materials: string[];
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [jobId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/jobs/${jobId}/invoice`,
        { credentials: "include" }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (response.status === 404) {
          setError("Invoice not found.");
        } else {
          setError(`Failed to fetch invoice: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || "Failed to load invoice.");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to load invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Invoice Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">
              The requested invoice could not be loaded.
            </p>
            <Link href="/admin/jobs/completed">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Completed Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons - Hidden when printing */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <Link href="/admin/jobs/completed">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Completed Jobs
            </Button>
          </Link>
          <Button onClick={handlePrint} className="bg-blue-600 text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg">
          <CardContent className="p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold text-blue-600 mb-2">IAYOS</h1>
                <p className="text-gray-600">Professional Service Platform</p>
                <p className="text-sm text-gray-500 mt-2">
                  Zamboanga City, Philippines
                  <br />
                  contact@iayos.ph
                  <br />
                  +63 (XXX) XXX-XXXX
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  INVOICE
                </h2>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Invoice #:</span>{" "}
                    {invoice.invoice_number}
                  </p>
                  <p>
                    <span className="font-semibold">Job ID:</span> {invoice.job_id}
                  </p>
                  <p>
                    <span className="font-semibold">Date Issued:</span>{" "}
                    {invoice.completed_at 
                      ? new Date(invoice.completed_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Pending"}
                  </p>
                  <p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded ${
                        invoice.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.payment_status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {invoice.payment_status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To / Service Provider */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                  Bill To
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {invoice.client.name}
                  </p>
                  <p className="text-gray-600">{invoice.client.address}</p>
                  <p className="text-gray-600">{invoice.client.email}</p>
                  <p className="text-gray-600">{invoice.client.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                  Service Provider
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {invoice.worker.name}
                  </p>
                  <p className="text-gray-600">{invoice.worker.email}</p>
                  <p className="text-gray-600">{invoice.worker.phone}</p>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">
                Service Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-bold text-xl text-gray-900 mb-2">
                  {invoice.title}
                </h4>
                <p className="text-sm text-gray-600 mb-4">{invoice.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 text-sm font-bold text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="text-right py-3 text-sm font-bold text-gray-700 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="font-semibold text-gray-900">
                        Service Fee ({invoice.budget_type})
                      </p>
                    </td>
                    <td className="text-right py-4 font-semibold text-gray-900">
                      ₱{invoice.budget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {invoice.materials && invoice.materials.length > 0 && invoice.materials.map((material, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">
                          Materials: {material}
                        </p>
                      </td>
                      <td className="text-right py-4 font-medium text-gray-900">
                        -
                      </td>
                    </tr>
                  ))}

                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="text-gray-700">50% Downpayment (Escrow)</p>
                    </td>
                    <td className="text-right py-4 text-gray-700">
                      ₱{invoice.downpayment.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="text-gray-700">Platform Fee (5% of downpayment)</p>
                    </td>
                    <td className="text-right py-4 text-gray-700">
                      ₱{invoice.platform_fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="text-gray-700">Remaining Balance (50%)</p>
                    </td>
                    <td className="text-right py-4 text-gray-700">
                      ₱{invoice.remaining_balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-gray-300">
                    <td className="py-4">
                      <p className="text-xl font-bold text-gray-900">
                        Total Amount (Worker Receives)
                      </p>
                    </td>
                    <td className="text-right py-4">
                      <p className="text-2xl font-bold text-blue-600">
                        ₱{invoice.final_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transaction History */}
            {invoice.transactions && invoice.transactions.length > 0 && (
              <div className="border-t pt-8 mt-8">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">
                  Transaction History
                </h3>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="space-y-3">
                    {invoice.transactions.map((txn, index) => (
                      <div key={index} className="flex justify-between text-sm border-b border-blue-100 pb-2 last:border-0">
                        <div>
                          <p className="font-semibold text-gray-900">{txn.type}</p>
                          <p className="text-gray-500 text-xs">
                            {txn.payment_method} • {txn.created_at ? new Date(txn.created_at).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₱{txn.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`text-xs ${txn.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {txn.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-8 mt-8 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Thank you for using IAYOS Platform!
              </p>
              <p className="text-xs text-gray-500">
                For questions about this invoice, please contact us at
                support@iayos.ph
              </p>
              <p className="text-xs text-gray-400 mt-4">
                This is a computer-generated invoice and is valid without
                signature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
