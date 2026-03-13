"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PendingInviteCard,
  RejectReasonModal,
  SkillSlotAssignmentModal,
} from "@/components/agency";
import { fetchWorkers, type WorkerListing } from "@/lib/api/jobs";
import AssignEmployeesModal from "@/components/agency/AssignEmployeesModal";
import { JobBudgetDisplay } from "@/components/agency/JobBudgetDisplay";
import { PaymentModelBadge } from "@/components/agency/PaymentModelBadge";
import {
  Loader2,
  AlertCircle,
  Mail,
  UserPlus,
  CheckCircle,
  Users,
  MessageCircle,
  Banknote,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/generic_button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { JobSkillSlot, SlotAssignment } from "@/types/agency-team-jobs";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  totalJobsCompleted: number;
  isActive: boolean;
  specializations?: string[]; // List of specialization names (strings from backend)
}

const normalizeEmployee = (employee: any): Employee => {
  const employeeId =
    employee?.employeeId ?? employee?.employee_id ?? employee?.id ?? null;

  return {
    employeeId: employeeId !== null ? Number(employeeId) : -1,
    name:
      employee?.name ||
      [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") ||
      "Unnamed Employee",
    email: employee?.email || "",
    role: employee?.role || employee?.position || "Staff",
    rating:
      typeof employee?.rating === "number"
        ? employee.rating
        : typeof employee?.average_rating === "number"
          ? employee.average_rating
          : 0,
    totalJobsCompleted:
      employee?.totalJobsCompleted ??
      employee?.total_jobs_completed ??
      employee?.jobs_completed ??
      0,
    isActive:
      typeof employee?.isActive === "boolean"
        ? employee.isActive
        : typeof employee?.is_active === "boolean"
          ? employee.is_active
          : true,
    specializations:
      employee?.specializations ?? employee?.specialization_ids ?? [],
  };
};

interface Job {
  jobID: number;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  } | null;
  budget: number;
  payment_model?: "PROJECT" | "DAILY";
  daily_rate_agreed?: number;
  duration_days?: number;
  actual_start_date?: string;
  total_days_worked?: number;
  daily_escrow_total?: number;
  location: string;
  urgency: string;
  status: string;
  jobType: string;
  expectedDuration: string | null;
  preferredStartDate: string | null;
  materialsNeeded?: string[];
  inviteStatus?: string;
  assignedEmployeeID?: number;
  assignedEmployee?: {
    employeeId: number;
    name: string;
  };
  is_team_job?: boolean;
  total_workers_needed?: number;
  total_workers_assigned?: number;
  skill_slots?: Array<{
    specialization_name: string;
  }>;
  client: {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  conversation_id?: number | null;
  applications_count?: number;
}

type TabType =
  | "invites"
  | "accepted"
  | "inProgress"
  | "completed"
  | "cancelled";

export default function AgencyJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("invites");
  const [pendingInvites, setPendingInvites] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Job[]>([]);
  const [inProgressJobs, setInProgressJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [cancelledJobs, setCancelledJobs] = useState<Job[]>([]);

  // Dummy data generators
  const dummyClient = {
    id: 0,
    name: "Dummy Client",
    avatar: null,
    email: "client@example.com",
  };

  const createDummyJob = (id: number, title: string, status: string, urgency: string = "MEDIUM"): Job => ({
    jobID: id,
    title,
    description: `This is a dummy ${title.toLowerCase()} for preview purposes. Edit this card as needed.`,
    category: { id: 1, name: "General Services" },
    budget: 1000,
    location: "Remote",
    urgency: urgency,
    status: status,
    jobType: "FIXED",
    expectedDuration: "1 month",
    preferredStartDate: new Date().toISOString(),
    client: dummyClient,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applications_count: Math.floor(Math.random() * 5),
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedJobForReject, setSelectedJobForReject] = useState<Job | null>(
    null,
  );
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] =
    useState<Job | null>(null);
  // Team job skill slots state
  const [skillSlotModalOpen, setSkillSlotModalOpen] = useState(false);
  const [selectedJobSkillSlots, setSelectedJobSkillSlots] = useState<
    JobSkillSlot[]
  >([]);
  const [loadingSkillSlots, setLoadingSkillSlots] = useState(false);
  // Pending invite acceptance flow - true when accepting pending invite (not just assigning to accepted job)
  const [isPendingInviteFlow, setIsPendingInviteFlow] = useState(false);
  const isInitialMount = React.useRef(true);

  // Fetch jobs based on active tab
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingInvites(false),
        fetchAcceptedJobs(false),
        fetchInProgressJobs(false),
        fetchCompletedJobs(false),
        fetchCancelledJobs(false),
        fetchEmployees(),
        fetchAvailableWorkers(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Refetch when tab changes (skip on initial mount to avoid double-fetch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (activeTab === "invites") {
      fetchPendingInvites(true);
    } else if (activeTab === "accepted") {
      fetchAcceptedJobs(true);
    } else if (activeTab === "inProgress") {
      fetchInProgressJobs(true);
    } else if (activeTab === "completed") {
      fetchCompletedJobs(true);
    } else if (activeTab === "cancelled") {
      fetchCancelledJobs(true);
    }
  }, [activeTab]);

  const fetchPendingInvites = async (showTabLoading = false) => {
    try {
      if (showTabLoading) setTabLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/api/agency/jobs?invite_status=PENDING`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const apiJobs = data.invites || [];
        const dummyJob = createDummyJob(-1, "Sample Pending Invite", "PENDING", "HIGH");
        setPendingInvites([dummyJob, ...apiJobs]);
      } else {
        throw new Error(
          `Failed to fetch pending invites: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching pending invites:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load pending invites",
      );
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  const fetchAcceptedJobs = async (showTabLoading = false) => {
    try {
      if (showTabLoading) setTabLoading(true);
      setError(null);

      // Fetch only ACTIVE jobs with ACCEPTED invite status
      // Once employees are assigned, job status changes to IN_PROGRESS and moves to "In Progress" tab
      const response = await fetch(
        `${API_BASE}/api/agency/jobs?invite_status=ACCEPTED&status=ACTIVE`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const apiJobs = data.jobs || [];
        const dummyJob = createDummyJob(-2, "Sample Accepted Job", "ACTIVE");
        setAcceptedJobs([dummyJob, ...apiJobs]);
      } else {
        throw new Error(
          `Failed to fetch accepted jobs: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching accepted jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load accepted jobs",
      );
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  const fetchInProgressJobs = async (showTabLoading = false) => {
    try {
      if (showTabLoading) setTabLoading(true);
      const response = await fetch(
        `${API_BASE}/api/agency/jobs?status=IN_PROGRESS`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const apiJobs = data.jobs || [];
        const dummyJob = createDummyJob(
          -3,
          "Sample In-Progress Job",
          "IN_PROGRESS",
        );
        dummyJob.assignedEmployee = { employeeId: 1, name: "Avery Johnson" };
        dummyJob.conversation_id = 1;
        setInProgressJobs([dummyJob, ...apiJobs]);
      } else {
        throw new Error(
          `Failed to fetch in-progress jobs: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching in-progress jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load in-progress jobs",
      );
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  const fetchCompletedJobs = async (showTabLoading = false) => {
    try {
      if (showTabLoading) setTabLoading(true);
      const response = await fetch(
        `${API_BASE}/api/agency/jobs?status=COMPLETED`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const apiJobs = data.jobs || [];
        const dummyJob = createDummyJob(-4, "Sample Completed Job", "COMPLETED");
        dummyJob.assignedEmployee = { employeeId: 2, name: "Riley Smith" };
        setCompletedJobs([dummyJob, ...apiJobs]);
      } else {
        throw new Error(
          `Failed to fetch completed jobs: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching completed jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load completed jobs",
      );
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  const fetchCancelledJobs = async (showTabLoading = false) => {
    try {
      if (showTabLoading) setTabLoading(true);
      const response = await fetch(
        `${API_BASE}/api/agency/jobs?status=CANCELLED`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const apiJobs = data.jobs || [];
        const dummyJob = createDummyJob(-5, "Sample Cancelled Job", "CANCELLED");
        setCancelledJobs([dummyJob, ...apiJobs]);
      } else {
        throw new Error(
          `Failed to fetch cancelled jobs: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error fetching cancelled jobs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load cancelled jobs",
      );
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/agency/employees`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      const normalized = (data.employees || [])
        .map(normalizeEmployee)
        .filter((employee: Employee) => employee.employeeId !== -1);
      setEmployees(normalized);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      const workers = await fetchWorkers();
      setAvailableWorkers(workers || []);
    } catch (err) {
      // This section is optional enhancement. Keep page usable even if worker listing fails.
      console.error("Error fetching available workers:", err);
      setAvailableWorkers([]);
    }
  };

  const parseWorkerSkills = (worker: WorkerListing): string[] => {
    return (worker.specialization || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  };

  const getSuggestedWorkersForJob = (job: Job): WorkerListing[] => {
    if (!availableWorkers.length) {
      return [];
    }

    const requiredKeywords = new Set<string>();

    if (job.category?.name) {
      requiredKeywords.add(job.category.name.toLowerCase());
    }

    for (const slot of job.skill_slots || []) {
      if (slot.specialization_name) {
        requiredKeywords.add(slot.specialization_name.toLowerCase());
      }
    }

    return [...availableWorkers]
      .map((worker) => {
        const skills = parseWorkerSkills(worker);
        const matchScore = [...requiredKeywords].reduce((score, keyword) => {
          const matched = skills.some(
            (skill) => skill.includes(keyword) || keyword.includes(skill),
          );
          return matched ? score + 1 : score;
        }, 0);

        return { worker, matchScore };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return (b.worker.rating || 0) - (a.worker.rating || 0);
      })
      .slice(0, 6)
      .map((entry) => entry.worker);
  };

  // Fetch skill slots for a team job
  const fetchSkillSlots = async (jobId: number): Promise<JobSkillSlot[]> => {
    try {
      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/skill-slots`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch skill slots");
      }
      const data = await response.json();
      return data.skill_slots || [];
    } catch (error) {
      console.error("Error fetching skill slots:", error);
      return [];
    }
  };

  const handleAcceptInvite = async (jobId: number) => {
    // Find the job from pending invites
    const job = pendingInvites.find((j) => j.jobID === jobId);
    if (!job) {
      setError("Job not found");
      return;
    }

    // NEW FLOW: Just accept the invite, don't assign employees here
    // Employee assignment happens in the "Accepted" tab
    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/accept`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = getErrorMessage(
          errorData,
          "Failed to accept invitation",
        );

        // Provide user-friendly message for payment-related errors
        if (errorMessage.includes("escrow payment")) {
          throw new Error(
            "This job invitation cannot be accepted yet. The client has not completed the payment. " +
            "Please wait for the client to complete their GCash/payment transaction.",
          );
        }

        throw new Error(errorMessage);
      }

      // Success - show message and refresh lists
      setSuccessMessage(
        `Invitation accepted for "${job.title}"! Go to the Accepted tab to assign employees.`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Remove from pending invites
      setPendingInvites((prev) => prev.filter((j) => j.jobID !== jobId));

      // Refresh accepted jobs list
      await fetchAcceptedJobs();

      // Switch to Accepted tab so user can assign employees
      setActiveTab("accepted");
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation",
      );
    }
  };

  // Helper to accept invite then assign employees (for pending invite flow)
  const acceptInviteAndAssign = async (jobId: number) => {
    const response = await fetch(
      `${API_BASE}/api/agency/jobs/${jobId}/accept`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = getErrorMessage(
        errorData,
        "Failed to accept invitation",
      );

      // Provide user-friendly message for payment-related errors
      if (errorMessage.includes("escrow payment")) {
        throw new Error(
          "This job invitation cannot be accepted yet. The client has not completed the payment. " +
          "Please wait for the client to complete their GCash/payment transaction.",
        );
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const handleRejectInviteClick = (job: Job) => {
    setSelectedJobForReject(job);
    setRejectModalOpen(true);
  };

  const handleRejectInviteSubmit = async (reason: string) => {
    if (!selectedJobForReject) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const rejectUrl = new URL(
        `${API_BASE}/api/agency/jobs/${selectedJobForReject.jobID}/reject`,
      );
      if (reason) rejectUrl.searchParams.set("reason", reason);
      const response = await fetch(rejectUrl.toString(), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          getErrorMessage(errorData, "Failed to reject invitation"),
        );
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(
        result.message || "Invitation rejected. Client has been refunded.",
      );

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Remove from pending invites list
      setPendingInvites((prevInvites) =>
        prevInvites.filter((job) => job.jobID !== selectedJobForReject.jobID),
      );

      // Close modal
      setRejectModalOpen(false);
      setSelectedJobForReject(null);
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleAssignEmployees = async (
    employeeIds: number[],
    primaryContactId: number,
    notes: string,
  ) => {
    if (!selectedJobForAssignment) return;
    if (!employeeIds || employeeIds.length === 0) {
      throw new Error("No employees selected");
    }

    // Enforce single employee for non-team jobs
    if (!selectedJobForAssignment.is_team_job && employeeIds.length > 1) {
      throw new Error("Non-team jobs can only have 1 employee assigned");
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${selectedJobForAssignment.jobID}/assign-employees`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_ids: employeeIds,
            primary_contact_id: primaryContactId,
            assignment_notes: notes?.trim() || "",
          }),
        },
      );

      const responseData = await response.json().catch(() => null as unknown);

      if (!response.ok) {
        const parsedBody = responseData as any;
        const derivedMessage = (() => {
          if (!parsedBody) return null;
          if (typeof parsedBody.error === "string") return parsedBody.error;
          if (typeof parsedBody.message === "string") return parsedBody.message;
          if (typeof parsedBody.detail === "string") return parsedBody.detail;
          if (
            Array.isArray(parsedBody.detail) &&
            parsedBody.detail.length > 0 &&
            typeof parsedBody.detail[0]?.msg === "string"
          ) {
            return parsedBody.detail[0].msg;
          }
          return null;
        })();

        const errorMessage =
          derivedMessage ||
          `Failed to assign employees (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // Show success message
      const count = employeeIds.length;
      setSuccessMessage(
        `${count} employee${count > 1 ? "s" : ""} successfully assigned to "${selectedJobForAssignment.title}"! Job is now In Progress.`,
      );

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Refresh job lists
      await fetchAcceptedJobs();
      await fetchInProgressJobs();

      // Close modal and reset state
      setAssignModalOpen(false);
      setSelectedJobForAssignment(null);
      setIsPendingInviteFlow(false);
    } catch (err) {
      console.error("Error assigning employees:", err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  // Handle opening assign modal - decides between regular or skill slot modal (for accepted jobs)
  const handleOpenAssignModal = async (job: Job) => {
    setSelectedJobForAssignment(job);
    setIsPendingInviteFlow(false); // This is for accepted jobs, not pending invites

    // Check if this is a team job with skill slots
    if (job.is_team_job) {
      setLoadingSkillSlots(true);
      try {
        const slots = await fetchSkillSlots(job.jobID);
        if (slots.length > 0) {
          setSelectedJobSkillSlots(slots);
          setSkillSlotModalOpen(true);
        } else {
          // No skill slots defined, fallback to regular modal
          setAssignModalOpen(true);
        }
      } catch (error) {
        console.error("Error loading skill slots:", error);
        // Fallback to regular modal
        setAssignModalOpen(true);
      } finally {
        setLoadingSkillSlots(false);
      }
    } else {
      // Regular single-employee job
      setAssignModalOpen(true);
    }
  };

  // Handle assigning employees to skill slots (team jobs)
  const handleAssignToSlots = async (
    assignments: SlotAssignment[],
    primaryContactId: number | null,
  ) => {
    if (!selectedJobForAssignment) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${selectedJobForAssignment.jobID}/assign-employees-to-slots`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignments,
            primary_contact_employee_id: primaryContactId,
          }),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          `Failed to assign employees (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // Show success message
      const count = assignments.length;
      setSuccessMessage(
        `${count} worker${count > 1 ? "s" : ""} successfully assigned to skill slots for "${selectedJobForAssignment.title}"! Job is now In Progress.`,
      );

      window.scrollTo({ top: 0, behavior: "smooth" });

      // Refresh job lists
      await fetchAcceptedJobs();
      await fetchInProgressJobs();

      // Close modal and reset state
      setSkillSlotModalOpen(false);
      setSelectedJobForAssignment(null);
      setSelectedJobSkillSlots([]);
      setIsPendingInviteFlow(false);
    } catch (err) {
      console.error("Error assigning to slots:", err);
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">
              Loading available jobs...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Job Management
        </h1>
        <p className="text-gray-600">
          Browse available jobs and manage direct invitations
        </p>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max pb-px">
            <button
              onClick={() => setActiveTab("invites")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "invites"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Pending Invites</span>
                {pendingInvites.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "invites"
                      ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                      : "bg-red-100 text-red-600"
                      }`}
                  >
                    {pendingInvites.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("accepted")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "accepted"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Accepted</span>
                {acceptedJobs.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "accepted"
                      ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {acceptedJobs.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("inProgress")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "inProgress"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5" />
                <span>In Progress</span>
                {inProgressJobs.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "inProgress"
                      ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {inProgressJobs.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "completed"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Completed</span>
                {completedJobs.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "completed"
                      ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {completedJobs.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("cancelled")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === "cancelled"
                ? "border-[#00BAF1] text-[#00BAF1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Cancelled</span>
                {cancelledJobs.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "cancelled"
                      ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {cancelledJobs.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab Loading Indicator */}
      {tabLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-500">Refreshing...</span>
        </div>
      )}

      {/* Tab Content */}
      {!tabLoading && activeTab === "invites" && (
        <>
          {pendingInvites.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Pending Invites
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You don't have any pending job invitations at the moment.
                    When clients send you direct invitations, they will appear
                    here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                You have {pendingInvites.length} pending{" "}
                {pendingInvites.length === 1 ? "invitation" : "invitations"}
              </div>
              {pendingInvites.map((job) => (
                <PendingInviteCard
                  key={job.jobID}
                  job={job}
                  availableWorkers={getSuggestedWorkersForJob(job)}
                  onAccept={handleAcceptInvite}
                  onReject={handleRejectInviteClick}
                  accepting={accepting === job.jobID}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!tabLoading && activeTab === "accepted" && (
        <>
          {acceptedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Accepted Jobs
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You haven't accepted any job invitations yet. Accepted jobs
                    that need employee assignment will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {acceptedJobs.length} accepted{" "}
                {acceptedJobs.length === 1 ? "job" : "jobs"}
              </div>
              {acceptedJobs.map((job) => (
                <Card
                  key={job.jobID}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Title and Badges */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                              {job.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === "ACTIVE" || job.status === "IN_PROGRESS"
                                ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                                : job.status === "COMPLETED"
                                  ? "bg-[#00BAF1]/10 text-[#00BAF1]"
                                  : "bg-red-100 text-red-700"
                                }`}
                            >
                              {job.status.replace("_", " ")}
                            </span>
                            {job.urgency && (
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${job.urgency === "HIGH"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-white text-gray-500 border-gray-200"
                                  }`}
                              >
                                {job.urgency}
                              </span>
                            )}
                            {job.is_team_job && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                <Users size={12} className="mr-1" />
                                Team Job ({job.total_workers_assigned || 0}/
                                {job.total_workers_needed || 0})
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Banknote className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Budget</p>
                              <div className="font-bold text-gray-900">
                                <JobBudgetDisplay
                                  budget={job.budget}
                                  paymentModel={job.payment_model}
                                  dailyRate={job.daily_rate_agreed}
                                  durationDays={job.duration_days}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <MapPin className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Location</p>
                              <p className="font-semibold text-gray-900 truncate">{job.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Users className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Applications</p>
                              <p className="font-bold text-gray-900">{job.applications_count || 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Posted</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Client:</span>
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                              {job.client.name}
                            </span>
                          </div>
                          {job.category && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Category:</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {job.category.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Assignment Progress for Team Jobs */}
                        {job.is_team_job && (job.total_workers_assigned || 0) > 0 && (
                          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#00BAF1]" />
                                <span className="text-sm font-medium text-blue-800">
                                  {job.total_workers_assigned}/{job.total_workers_needed} assigned
                                </span>
                              </div>
                              <div className="flex-1 h-1.5 bg-blue-100 rounded-full max-w-[200px]">
                                <div
                                  className="h-full bg-[#00BAF1] rounded-full"
                                  style={{
                                    width: `${((job.total_workers_assigned || 0) / (job.total_workers_needed || 1)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                        <Button
                          className="flex-1 h-10 bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                          onClick={() => router.push(`/agency/jobs/${job.jobID}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {!job.assignedEmployee && job.status === "ACTIVE" && (
                          <Button
                            className="flex-1 h-10 bg-white border-2 border-[#00BAF1] text-[#00BAF1] hover:bg-sky-50 transition-all text-sm font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignModal(job);
                            }}
                            disabled={loadingSkillSlots}
                          >
                            {loadingSkillSlots ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!tabLoading && activeTab === "inProgress" && (
        <>
          {inProgressJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Jobs In Progress
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Active jobs currently being worked on will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {inProgressJobs.length} in-progress{" "}
                {inProgressJobs.length === 1 ? "job" : "jobs"}
              </div>
              {inProgressJobs.map((job) => (
                <Card
                  key={job.jobID}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Title and Badges */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                              {job.title}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00BAF1]/10 text-[#00BAF1]">
                              IN PROGRESS
                            </span>
                            {job.urgency && (
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${job.urgency === "HIGH"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-white text-gray-500 border-gray-200"
                                  }`}
                              >
                                {job.urgency}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Banknote className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Budget</p>
                              <div className="font-bold text-gray-900">
                                <JobBudgetDisplay
                                  budget={job.budget}
                                  paymentModel={job.payment_model}
                                  dailyRate={job.daily_rate_agreed}
                                  durationDays={job.duration_days}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <MapPin className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Location</p>
                              <p className="font-semibold text-gray-900 truncate">{job.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Users className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Worker</p>
                              <p className="font-bold text-gray-900 truncate">{job.assignedEmployee?.name || "Multiple"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Posted</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Client:</span>
                              <span className="text-sm font-semibold text-gray-700">
                                {job.client.name}
                              </span>
                            </div>
                            {job.category && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Category:</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  {job.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-[#00BAF1] text-xs font-bold animate-pulse">
                            WORK IN PROGRESS...
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                        <Button
                          className="flex-1 h-10 bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                          onClick={() => router.push(`/agency/jobs/${job.jobID}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        {job.conversation_id && (
                          <Button
                            variant="outline"
                            className="flex-1 h-10 border-2 border-[#00BAF1] text-[#00BAF1] hover:bg-sky-50 transition-all text-sm font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/agency/messages/${job.conversation_id}`);
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!tabLoading && activeTab === "completed" && (
        <>
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Completed Jobs
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Successfully completed jobs will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {completedJobs.length} completed{" "}
                {completedJobs.length === 1 ? "job" : "jobs"}
              </div>
              {completedJobs.map((job) => (
                <Card
                  key={job.jobID}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Title and Badges */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                              {job.title}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00BAF1]/10 text-[#00BAF1]">
                              COMPLETED
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Banknote className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Final Budget</p>
                              <div className="font-bold text-gray-900">
                                <JobBudgetDisplay
                                  budget={job.budget}
                                  paymentModel={job.payment_model}
                                  dailyRate={job.daily_rate_agreed}
                                  durationDays={job.duration_days}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <MapPin className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Location</p>
                              <p className="font-semibold text-gray-900 truncate">{job.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Users className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Worker</p>
                              <p className="font-bold text-gray-900 truncate">{job.assignedEmployee?.name || "Multiple"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-[#00BAF1]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Completed</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Client:</span>
                              <span className="text-sm font-semibold text-gray-700">
                                {job.client.name}
                              </span>
                            </div>
                            {job.category && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Category:</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  {job.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[#00BAF1] font-bold text-xs">
                            <CheckCircle className="h-4 w-4" />
                            COMPLETED SUCCESSFULLY
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                        <Button
                          className="flex-1 h-10 bg-[#00BAF1] hover:bg-sky-500 text-white shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                          onClick={() => router.push(`/agency/jobs/${job.jobID}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!tabLoading && activeTab === "cancelled" && (
        <>
          {cancelledJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Cancelled Jobs
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Cancelled or rejected jobs will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {cancelledJobs.length} cancelled{" "}
                {cancelledJobs.length === 1 ? "job" : "jobs"}
              </div>
              {cancelledJobs.map((job) => (
                <Card
                  key={job.jobID}
                  className="border-0 shadow-lg transition-all duration-300 overflow-hidden group opacity-85"
                >
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Title and Badges */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                              {job.title}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              CANCELLED
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <Banknote className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Budget</p>
                              <div className="font-bold text-gray-900">
                                <JobBudgetDisplay
                                  budget={job.budget}
                                  paymentModel={job.payment_model}
                                  dailyRate={job.daily_rate_agreed}
                                  durationDays={job.duration_days}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <MapPin className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Location</p>
                              <p className="font-semibold text-gray-900 truncate">{job.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <Users className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Worker</p>
                              <p className="font-bold text-gray-900 truncate">{job.assignedEmployee?.name || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Date</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Client:</span>
                              <span className="text-sm font-semibold text-gray-700">
                                {job.client.name}
                              </span>
                            </div>
                            {job.category && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Category:</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  {job.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase">
                            <AlertCircle className="h-4 w-4" />
                            Job Cancelled
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                        <Button
                          className="flex-1 h-10 bg-gray-400 hover:bg-gray-500 text-white shadow-md transition-all text-sm font-semibold"
                          onClick={() => router.push(`/agency/jobs/${job.jobID}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedJobForReject(null);
        }}
        onSubmit={handleRejectInviteSubmit}
        jobTitle={selectedJobForReject?.title || ""}
      />

      {/* Assign Employees Modal (Multi-Employee Support - Regular Jobs) */}
      {selectedJobForAssignment && (
        <AssignEmployeesModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedJobForAssignment(null);
            setIsPendingInviteFlow(false);
          }}
          job={selectedJobForAssignment}
          employees={employees}
          onAssign={handleAssignEmployees}
          maxEmployees={selectedJobForAssignment.is_team_job ? undefined : 1}
          isPendingInvite={isPendingInviteFlow}
        />
      )}

      {/* Skill Slot Assignment Modal (Team Jobs with Skill Requirements) */}
      {selectedJobForAssignment && selectedJobSkillSlots.length > 0 && (
        <SkillSlotAssignmentModal
          isOpen={skillSlotModalOpen}
          onClose={() => {
            setSkillSlotModalOpen(false);
            setSelectedJobForAssignment(null);
            setSelectedJobSkillSlots([]);
            setIsPendingInviteFlow(false);
          }}
          job={selectedJobForAssignment}
          employees={employees}
          skillSlots={selectedJobSkillSlots}
          onAssign={handleAssignToSlots}
          isPendingInvite={isPendingInviteFlow}
        />
      )}
    </div>
  );
}
