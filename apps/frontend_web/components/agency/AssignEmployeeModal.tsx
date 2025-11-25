"use client";

import { useState, useEffect } from "react";
import { X, User, Briefcase, AlertCircle, CheckCircle } from "lucide-react";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
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
  budget: string;
  category: string;
  urgency: string;
}

interface AssignEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  employees: Employee[];
  onAssign: (employeeId: number, notes: string) => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AssignEmployeeModal({
  isOpen,
  onClose,
  job,
  employees,
  onAssign,
}: AssignEmployeeModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
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
            { credentials: "include" }
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
            error
          );
        }
      });
    }
  }, [isOpen, employees]);

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedEmployeeId, assignmentNotes);
      onClose();
      setSelectedEmployeeId(null);
      setAssignmentNotes("");
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Assign Employee to Job
            </h2>
            <p className="text-sm text-gray-600 mt-1">{job?.title}</p>
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
                    ₱{job.budget}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {job.category}
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

          {/* Employee Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              Select Employee
            </h3>

            {activeEmployees.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-600">No active employees available</p>
              </div>
            ) : (
              activeEmployees.map((employee) => {
                const workload = employeeWorkloads[employee.employeeId];
                const isSelected = selectedEmployeeId === employee.employeeId;

                return (
                  <button
                    key={employee.employeeId}
                    onClick={() => setSelectedEmployeeId(employee.employeeId)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {employee.name.charAt(0)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {employee.name}
                            </h4>
                            {workload &&
                              getAvailabilityBadge(workload.availability)}
                          </div>

                          <p className="text-sm text-gray-600">
                            {employee.role}
                          </p>

                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              ⭐ {employee.rating.toFixed(1)}
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
                      </div>

                      {isSelected && (
                        <CheckCircle
                          className="text-blue-500 flex-shrink-0"
                          size={24}
                        />
                      )}
                    </div>
                  </button>
                );
              })
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
            disabled={!selectedEmployeeId || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Assign Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
