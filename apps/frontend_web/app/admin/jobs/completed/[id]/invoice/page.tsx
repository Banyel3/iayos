"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

interface CompletedJob {
  id: string;
  title: string;
  description: string;
  category: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  worker: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  budget: number;
  budgetType: "fixed" | "hourly";
  finalAmount: number;
  startDate: string;
  completionDate: string;
  location: string;
  transactionId: string;
  paymentStatus: "paid" | "pending" | "processing";
  invoice: string;
  hoursWorked?: number;
  materials?: { description: string; amount: number }[];
  subtotal: number;
  tax: number;
  platformFee: number;
}

// Mock data - In production, this would come from an API
const mockCompletedJobs: CompletedJob[] = [
  {
    id: "COMP-001",
    title: "Interior Painting - Living Room",
    description:
      "Professional painting service for living room and dining area. Includes wall preparation.",
    category: "Painting",
    client: {
      id: "CLI-203",
      name: "David Martinez",
      email: "david.martinez@email.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main Street, Bronx, NY 10451",
    },
    worker: {
      id: "WRK-114",
      name: "Carlos Rivera",
      email: "carlos.rivera@email.com",
      phone: "+1 (555) 234-5678",
    },
    budget: 450,
    budgetType: "fixed",
    finalAmount: 450,
    subtotal: 400,
    tax: 32,
    platformFee: 18,
    startDate: "2024-10-07",
    completionDate: "2024-10-09",
    location: "Bronx, NY",
    transactionId: "TXN-2024-101",
    paymentStatus: "paid",
    invoice: "INV-2024-001",
  },
  {
    id: "COMP-002",
    title: "Bathroom Plumbing Installation",
    description:
      "Complete bathroom plumbing installation for new construction.",
    category: "Plumbing",
    client: {
      id: "CLI-210",
      name: "Lisa Anderson",
      email: "lisa.anderson@email.com",
      phone: "+1 (555) 345-6789",
      address: "456 Oak Avenue, Brooklyn, NY 11201",
    },
    worker: {
      id: "WRK-115",
      name: "Robert Taylor",
      email: "robert.taylor@email.com",
      phone: "+1 (555) 456-7890",
    },
    budget: 850,
    budgetType: "fixed",
    finalAmount: 875,
    subtotal: 780,
    tax: 62.4,
    platformFee: 32.6,
    startDate: "2024-10-01",
    completionDate: "2024-10-05",
    location: "Brooklyn, NY",
    transactionId: "TXN-2024-102",
    paymentStatus: "paid",
    invoice: "INV-2024-002",
    materials: [
      { description: "Pipe fittings and fixtures", amount: 120 },
      { description: "Installation hardware", amount: 45 },
    ],
  },
  {
    id: "COMP-003",
    title: "Garden Landscaping Design",
    description:
      "Complete backyard landscaping with plants and irrigation system.",
    category: "Landscaping",
    client: {
      id: "CLI-211",
      name: "Nancy Wilson",
      email: "nancy.wilson@email.com",
      phone: "+1 (555) 567-8901",
      address: "789 Garden Lane, Queens, NY 11354",
    },
    worker: {
      id: "WRK-116",
      name: "Miguel Santos",
      email: "miguel.santos@email.com",
      phone: "+1 (555) 678-9012",
    },
    budget: 1800,
    budgetType: "fixed",
    finalAmount: 1850,
    subtotal: 1650,
    tax: 132,
    platformFee: 68,
    startDate: "2024-09-25",
    completionDate: "2024-10-02",
    location: "Queens, NY",
    transactionId: "TXN-2024-103",
    paymentStatus: "paid",
    invoice: "INV-2024-003",
    materials: [
      { description: "Plants and shrubs", amount: 350 },
      { description: "Irrigation system", amount: 280 },
      { description: "Mulch and soil", amount: 120 },
    ],
  },
  {
    id: "COMP-004",
    title: "Home Office Electrical Setup",
    description: "Electrical wiring and outlet installation for home office.",
    category: "Electrical",
    client: {
      id: "CLI-212",
      name: "Kevin Brown",
      email: "kevin.brown@email.com",
      phone: "+1 (555) 789-0123",
      address: "321 Park Avenue, Manhattan, NY 10016",
    },
    worker: {
      id: "WRK-117",
      name: "Anthony Lee",
      email: "anthony.lee@email.com",
      phone: "+1 (555) 890-1234",
    },
    budget: 550,
    budgetType: "fixed",
    finalAmount: 550,
    subtotal: 490,
    tax: 39.2,
    platformFee: 20.8,
    startDate: "2024-10-03",
    completionDate: "2024-10-06",
    location: "Manhattan, NY",
    transactionId: "TXN-2024-104",
    paymentStatus: "processing",
    invoice: "INV-2024-004",
  },
  {
    id: "COMP-005",
    title: "Deck Construction and Staining",
    description: "Build and stain a new wooden deck in backyard.",
    category: "Carpentry",
    client: {
      id: "CLI-213",
      name: "Patricia Moore",
      email: "patricia.moore@email.com",
      phone: "+1 (555) 901-2345",
      address: "654 Beach Street, Staten Island, NY 10301",
    },
    worker: {
      id: "WRK-118",
      name: "William Harris",
      email: "william.harris@email.com",
      phone: "+1 (555) 012-3456",
    },
    budget: 2200,
    budgetType: "fixed",
    finalAmount: 2200,
    subtotal: 1960,
    tax: 156.8,
    platformFee: 83.2,
    startDate: "2024-09-20",
    completionDate: "2024-09-30",
    location: "Staten Island, NY",
    transactionId: "TXN-2024-105",
    paymentStatus: "paid",
    invoice: "INV-2024-005",
    materials: [
      { description: "Pressure-treated lumber", amount: 850 },
      { description: "Deck stain and sealant", amount: 180 },
      { description: "Screws and hardware", amount: 120 },
    ],
  },
  {
    id: "COMP-006",
    title: "Apartment Deep Cleaning",
    description: "Thorough deep cleaning service for 2-bedroom apartment.",
    category: "Cleaning",
    client: {
      id: "CLI-214",
      name: "Jennifer Taylor",
      email: "jennifer.taylor@email.com",
      phone: "+1 (555) 123-9876",
      address: "987 West End Avenue, Manhattan, NY 10025",
    },
    worker: {
      id: "WRK-119",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 234-8765",
    },
    budget: 180,
    budgetType: "hourly",
    finalAmount: 168,
    subtotal: 150,
    tax: 12,
    platformFee: 6,
    hoursWorked: 6,
    startDate: "2024-10-08",
    completionDate: "2024-10-08",
    location: "Manhattan, NY",
    transactionId: "TXN-2024-106",
    paymentStatus: "paid",
    invoice: "INV-2024-006",
  },
  {
    id: "COMP-007",
    title: "Kitchen Backsplash Tile Work",
    description: "Install ceramic tile backsplash in kitchen area.",
    category: "Tile Work",
    client: {
      id: "CLI-215",
      name: "Steven Clark",
      email: "steven.clark@email.com",
      phone: "+1 (555) 345-7654",
      address: "246 Hill Road, Bronx, NY 10468",
    },
    worker: {
      id: "WRK-120",
      name: "Jose Martinez",
      email: "jose.martinez@email.com",
      phone: "+1 (555) 456-6543",
    },
    budget: 700,
    budgetType: "fixed",
    finalAmount: 680,
    subtotal: 605,
    tax: 48.4,
    platformFee: 26.6,
    startDate: "2024-10-04",
    completionDate: "2024-10-07",
    location: "Bronx, NY",
    transactionId: "TXN-2024-107",
    paymentStatus: "paid",
    invoice: "INV-2024-007",
    materials: [
      { description: "Ceramic tiles", amount: 220 },
      { description: "Grout and adhesive", amount: 85 },
    ],
  },
  {
    id: "COMP-008",
    title: "Window Replacement Service",
    description:
      "Replace old windows with energy-efficient double-pane windows.",
    category: "Windows & Doors",
    client: {
      id: "CLI-216",
      name: "Thomas Garcia",
      email: "thomas.garcia@email.com",
      phone: "+1 (555) 567-5432",
      address: "135 River Road, Queens, NY 11375",
    },
    worker: {
      id: "WRK-121",
      name: "Daniel White",
      email: "daniel.white@email.com",
      phone: "+1 (555) 678-4321",
    },
    budget: 1500,
    budgetType: "fixed",
    finalAmount: 1450,
    subtotal: 1290,
    tax: 103.2,
    platformFee: 56.8,
    startDate: "2024-09-28",
    completionDate: "2024-10-03",
    location: "Queens, NY",
    transactionId: "TXN-2024-108",
    paymentStatus: "paid",
    invoice: "INV-2024-008",
    materials: [
      { description: "Double-pane windows (3 units)", amount: 780 },
      { description: "Installation materials", amount: 110 },
    ],
  },
];

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const job = mockCompletedJobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The requested invoice could not be found.
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

  const handlePrint = () => {
    window.print();
  };

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
                  123 Business Street
                  <br />
                  New York, NY 10001
                  <br />
                  contact@iayos.com
                  <br />
                  +1 (555) 000-0000
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  INVOICE
                </h2>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Invoice #:</span>{" "}
                    {job.invoice}
                  </p>
                  <p>
                    <span className="font-semibold">Job ID:</span> {job.id}
                  </p>
                  <p>
                    <span className="font-semibold">Date Issued:</span>{" "}
                    {new Date(job.completionDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    <span className="font-semibold">Transaction ID:</span>{" "}
                    {job.transactionId}
                  </p>
                  <p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded ${
                        job.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : job.paymentStatus === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {job.paymentStatus.toUpperCase()}
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
                    {job.client.name}
                  </p>
                  <p className="text-gray-600">{job.client.address}</p>
                  <p className="text-gray-600">{job.client.email}</p>
                  <p className="text-gray-600">{job.client.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                  Service Provider
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {job.worker.name}
                  </p>
                  <p className="text-gray-600">{job.worker.email}</p>
                  <p className="text-gray-600">{job.worker.phone}</p>
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
                  {job.title}
                </h4>
                <p className="text-sm text-gray-600 mb-4">{job.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">
                      {job.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">
                      {job.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(job.startDate).toLocaleDateString()} -{" "}
                      {new Date(job.completionDate).toLocaleDateString()}
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
                        {job.budgetType === "hourly"
                          ? "Labor (Hourly)"
                          : "Service Fee (Fixed)"}
                      </p>
                      {job.budgetType === "hourly" && job.hoursWorked && (
                        <p className="text-sm text-gray-500">
                          {job.hoursWorked} hours × $
                          {(job.subtotal / job.hoursWorked).toFixed(2)}/hour
                        </p>
                      )}
                    </td>
                    <td className="text-right py-4 font-semibold text-gray-900">
                      ${job.subtotal.toFixed(2)}
                    </td>
                  </tr>

                  {job.materials &&
                    job.materials.map((material, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-4">
                          <p className="font-medium text-gray-900">
                            Materials: {material.description}
                          </p>
                        </td>
                        <td className="text-right py-4 font-medium text-gray-900">
                          ${material.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}

                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="text-gray-700">Tax (8%)</p>
                    </td>
                    <td className="text-right py-4 text-gray-700">
                      ${job.tax.toFixed(2)}
                    </td>
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-4">
                      <p className="text-gray-700">Platform Service Fee</p>
                    </td>
                    <td className="text-right py-4 text-gray-700">
                      ${job.platformFee.toFixed(2)}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-gray-300">
                    <td className="py-4">
                      <p className="text-xl font-bold text-gray-900">
                        Total Amount
                      </p>
                    </td>
                    <td className="text-right py-4">
                      <p className="text-2xl font-bold text-blue-600">
                        ${job.finalAmount.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-8 mt-8">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">
                Payment Information
              </h3>
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      IAYOS Platform Payment
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Payment Status</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {job.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Transaction ID</p>
                    <p className="font-semibold text-gray-900">
                      {job.transactionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Payment Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(job.completionDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-8 mt-8 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Thank you for using IAYOS Platform!
              </p>
              <p className="text-xs text-gray-500">
                For questions about this invoice, please contact us at
                support@iayos.com or call +1 (555) 000-0000
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
