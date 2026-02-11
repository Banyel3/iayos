"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Users,
  Crown,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number | null;
  totalJobsCompleted: number;
  isActive: boolean;
  workload?: {
    assigned_jobs_count: number;
    in_progress_jobs_count: number;
    total_active_jobs: number;
    availability: "AVAILABLE" | "WORKING" | "BUSY" | "INACTIVE";
  };
}

interface Job {
  jobID: number;
  title: string;
  budget: number;
  category: {
    id: number;
    name: string;
  } | null;
  urgency: string;
}

interface AssignEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  employees: Employee[];
  onAssign: (
    employeeIds: number[],
    primaryContactId: number,
    notes: string,
  ) => Promise<void>;
  maxEmployees?: number; // Limit number of employees that can be selected (default: unlimited)
  isPendingInvite?: boolean; // True if this is part of accepting a pending invite
}

export default function AssignEmployeesModal({
  isOpen,
  onClose,
  job,
  employees,
  onAssign,
  maxEmployees,
  isPendingInvite = false,
}: AssignEmployeesModalProps) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(
    new Set(),
  );
  const [primaryContactId, setPrimaryContactId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeWorkloads, setEmployeeWorkloads] = useState<
    Record<number, Employee["workload"]>
  >({});

  // Fetch workload for each employee
  useEffect(() => {
    if (isOpen && employees.length > 0) {
      employees.forEach(async (employee) => {
        try {
          const response = await fetch(
            `${API_BASE}/api/agency/employees/${employee.employeeId}/workload`,
            { credentials: "include" },
          );

          if (response.ok) {
            const data = await response.json();
            setEmployeeWorkloads((prev) => ({
              ...prev,
              [employee.employeeId]: data,
            }));
          }
        } catch (error) {
          console.error(
            `Failed to fetch workload for employee ${employee.employeeId}:`,
            error,
          );
        }
      });
    }
  }, [isOpen, employees]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployeeIds(new Set());
      setPrimaryContactId(null);
      setAssignmentNotes("");
    }
  }, [isOpen]);

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
        // If we removed the primary contact, reset it
        if (primaryContactId === employeeId) {
          // Set primary to first remaining employee or null
          const remaining = Array.from(newSet);
          setPrimaryContactId(remaining.length > 0 ? remaining[0] : null);
        }
      } else {
        // Check if we've hit the max limit
        if (maxEmployees && newSet.size >= maxEmployees) {
          // If limit is 1, just replace the selection
          if (maxEmployees === 1) {
            newSet.clear();
            newSet.add(employeeId);
            setPrimaryContactId(employeeId);
            return newSet;
          }
          // Otherwise, don't add more
          return prev;
        }
        newSet.add(employeeId);
        // If this is the first selection, make them primary contact
        if (newSet.size === 1) {
          setPrimaryContactId(employeeId);
        }
      }
      return newSet;
    });
  };

  const handleAssign = async () => {
    if (selectedEmployeeIds.size === 0) {
      alert("Please select at least one employee");
      return;
    }

    const finalPrimaryContact =
      primaryContactId || Array.from(selectedEmployeeIds)[0];

    setIsSubmitting(true);
    try {
      await onAssign(
        Array.from(selectedEmployeeIds),
        finalPrimaryContact,
        assignmentNotes,
      );
      onClose();
    } catch (error) {
      console.error("Assignment failed:", error);
      alert(error instanceof Error ? error.message : "Assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getAvailabilityBadge = (availability?: string) => {
    if (!availability) return null;

    const badges = {
      AVAILABLE: { color: "bg-green-100 text-green-800", text: "Available" },
      WORKING: { color: "bg-blue-100 text-blue-800", text: "Working" },
      BUSY: { color: "bg-orange-100 text-orange-800", text: "Busy" },
      INACTIVE: { color: "bg-gray-100 text-gray-800", text: "Inactive" },
    };

    const badge = badges[availability as keyof typeof badges];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  // Filter active employees
  const activeEmployees = employees.filter((e) => e.isActive);

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              {isPendingInvite 
                ? (maxEmployees === 1 ? "Accept Invite & Assign Employee" : "Accept Invite & Assign Team")
                : (maxEmployees === 1 ? "Assign Employee" : "Assign Team to Job")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {job?.title}
              {maxEmployees === 1 && (
                <span className="ml-2 text-orange-600 font-medium">
                  (Single employee only)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Job Info */}
          {job && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ₱{job.budget?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {job.category?.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Urgency:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      job.urgency === "HIGH"
                        ? "text-red-600"
                        : job.urgency === "MEDIUM"
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    {job.urgency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          {selectedEmployeeIds.size > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">
                  {selectedEmployeeIds.size} employee
                  {selectedEmployeeIds.size > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => {
                    setSelectedEmployeeIds(new Set());
                    setPrimaryContactId(null);
                  }}
                  className="text-sm text-green-700 hover:text-green-900 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              Select Employees
              <span className="text-sm font-normal text-gray-500">
                (select multiple)
              </span>
            </h3>

            {activeEmployees.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-600">No active employees available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEmployees.map((employee, index) => {
                  const workload = employeeWorkloads[employee.employeeId];
                  const isSelected = selectedEmployeeIds.has(
                    employee.employeeId,
                  );
                  const isPrimary = primaryContactId === employee.employeeId;

                  return (
                    <div
                      key={`employee-${employee.employeeId}-${index}`}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() =>
                            toggleEmployeeSelection(employee.employeeId)
                          }
                          className="flex items-start space-x-3 flex-1 text-left"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {employee.name.charAt(0)}
                            </div>
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-white" size={14} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {employee.name}
                              </h4>
                              {isPrimary && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                  <Crown size={10} /> Team Lead
                                </span>
                              )}
                              {workload &&
                                getAvailabilityBadge(workload.availability)}
                            </div>

                            <p className="text-sm text-gray-600">
                              {employee.role}
                            </p>

                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center">
                                ⭐{" "}
                                {employee.rating !== null
                                  ? employee.rating.toFixed(1)
                                  : "No rating"}
                              </span>
                              <span className="flex items-center">
                                <Briefcase size={14} className="mr-1" />
                                {employee.totalJobsCompleted} jobs
                              </span>
                              {workload && (
                                <span className="flex items-center">
                                  📋 {workload.total_active_jobs} active
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Set as Primary Contact button (only if selected) */}
                        {isSelected &&
                          !isPrimary &&
                          selectedEmployeeIds.size > 1 && (
                            <button
                              onClick={() =>
                                setPrimaryContactId(employee.employeeId)
                              }
                              className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors flex items-center gap-1"
                            >
                              <Crown size={12} /> Set as Lead
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignment Notes */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any specific instructions or notes for this assignment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedEmployeeIds.size === 0 || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <Users size={18} />
                <span>
                  Assign{" "}
                  {selectedEmployeeIds.size > 0 ? selectedEmployeeIds.size : ""}{" "}
                  Employee{selectedEmployeeIds.size !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
