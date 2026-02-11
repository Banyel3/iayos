"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Users,
  Crown,
  Wrench,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import type {
  JobSkillSlot,
  SlotAssignment,
  EmployeeWorkload,
  SkillLevel,
} from "@/types/agency-team-jobs";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number | null;
  totalJobsCompleted: number;
  isActive: boolean;
  specializations?: string[]; // List of specialization names employee has
  workload?: EmployeeWorkload;
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
  is_team_job?: boolean;
}

interface SkillSlotAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  employees: Employee[];
  skillSlots: JobSkillSlot[];
  onAssign: (
    assignments: SlotAssignment[],
    primaryContactId: number | null
  ) => Promise<void>;
  isPendingInvite?: boolean; // True if this is part of accepting a pending invite
}

export default function SkillSlotAssignmentModal({
  isOpen,
  onClose,
  job,
  employees,
  skillSlots,
  onAssign,
  isPendingInvite = false,
}: SkillSlotAssignmentModalProps) {
  // Track selections per slot: { slotId: Set<employeeId> }
  const [slotSelections, setSlotSelections] = useState<
    Record<number, Set<number>>
  >({});
  const [primaryContactId, setPrimaryContactId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeWorkloads, setEmployeeWorkloads] = useState<
    Record<number, EmployeeWorkload>
  >({});
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());

  // Initialize selections and expand first slot
  useEffect(() => {
    if (isOpen && skillSlots.length > 0) {
      // Initialize empty selections for each slot
      const initialSelections: Record<number, Set<number>> = {};
      skillSlots.forEach((slot) => {
        initialSelections[slot.skill_slot_id] = new Set();
      });
      setSlotSelections(initialSelections);

      // Expand all slots by default
      setExpandedSlots(new Set(skillSlots.map((s) => s.skill_slot_id)));

      // Fetch workloads for all employees
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
  }, [isOpen, skillSlots, employees]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSlotSelections({});
      setPrimaryContactId(null);
      setExpandedSlots(new Set());
    }
  }, [isOpen]);

  // Get all selected employee IDs across all slots
  const allSelectedEmployeeIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(slotSelections).forEach((slotSet) => {
      slotSet.forEach((id) => ids.add(id));
    });
    return ids;
  }, [slotSelections]);

  // Filter employees by specialization for a given slot
  const getEligibleEmployeesForSlot = (slot: JobSkillSlot): Employee[] => {
    return employees.filter((emp) => {
      if (!emp.isActive) return false;
      // Check if employee has the required specialization (match by name)
      if (emp.specializations && emp.specializations.length > 0) {
        // Case-insensitive match on specialization name
        const slotSpecName = slot.specialization_name.toLowerCase();
        return emp.specializations.some(
          (spec) => spec.toLowerCase() === slotSpecName
        );
      }
      // If no specializations data, allow all (fallback for legacy data)
      return true;
    });
  };

  // Check if an employee is already assigned to another slot
  const isEmployeeAssignedElsewhere = (
    employeeId: number,
    currentSlotId: number
  ): boolean => {
    for (const [slotId, selections] of Object.entries(slotSelections)) {
      if (Number(slotId) !== currentSlotId && selections.has(employeeId)) {
        return true;
      }
    }
    return false;
  };

  // Toggle employee selection for a specific slot
  const toggleEmployeeForSlot = (slotId: number, employeeId: number) => {
    const slot = skillSlots.find((s) => s.skill_slot_id === slotId);
    if (!slot) return;

    setSlotSelections((prev) => {
      const currentSet = new Set(prev[slotId] || []);
      if (currentSet.has(employeeId)) {
        currentSet.delete(employeeId);
        // Reset primary contact if removed
        if (primaryContactId === employeeId) {
          const remaining = Array.from(allSelectedEmployeeIds).filter(
            (id) => id !== employeeId
          );
          setPrimaryContactId(remaining.length > 0 ? remaining[0] : null);
        }
      } else {
        // Check if slot is full
        if (currentSet.size >= slot.workers_needed) {
          alert(
            `This slot only needs ${slot.workers_needed} worker(s). Remove one first.`
          );
          return prev;
        }
        currentSet.add(employeeId);
        // Auto-set primary contact if first selection
        if (allSelectedEmployeeIds.size === 0 && !primaryContactId) {
          setPrimaryContactId(employeeId);
        }
      }
      return { ...prev, [slotId]: currentSet };
    });
  };

  // Toggle slot expansion
  const toggleSlotExpansion = (slotId: number) => {
    setExpandedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
  };

  // Calculate validation status
  const getValidationStatus = () => {
    const issues: string[] = [];
    let totalNeeded = 0;
    let totalAssigned = 0;

    skillSlots.forEach((slot) => {
      const assigned = slotSelections[slot.skill_slot_id]?.size || 0;
      totalNeeded += slot.workers_needed;
      totalAssigned += assigned;

      if (assigned < slot.workers_needed) {
        issues.push(
          `${slot.specialization_name}: need ${slot.workers_needed - assigned} more`
        );
      }
    });

    return {
      isValid: totalAssigned === totalNeeded,
      issues,
      totalNeeded,
      totalAssigned,
    };
  };

  // Handle submit
  const handleAssign = async () => {
    const validation = getValidationStatus();
    if (!validation.isValid) {
      alert(`Please complete all slot assignments:\n${validation.issues.join("\n")}`);
      return;
    }

    // Build assignments array
    const assignments: SlotAssignment[] = [];
    for (const [slotId, employeeIds] of Object.entries(slotSelections)) {
      employeeIds.forEach((empId) => {
        assignments.push({
          skill_slot_id: Number(slotId),
          employee_id: empId,
        });
      });
    }

    if (assignments.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(assignments, primaryContactId);
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
    const badges: Record<string, { color: string; text: string }> = {
      AVAILABLE: { color: "bg-green-100 text-green-800", text: "Available" },
      WORKING: { color: "bg-blue-100 text-blue-800", text: "Working" },
      BUSY: { color: "bg-orange-100 text-orange-800", text: "Busy" },
      INACTIVE: { color: "bg-gray-100 text-gray-800", text: "Inactive" },
    };
    const badge = badges[availability];
    if (!badge) return null;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const getSkillLevelBadge = (level: SkillLevel) => {
    const config = {
      ENTRY: { color: "bg-green-100 text-green-800", emoji: "🌱" },
      INTERMEDIATE: { color: "bg-blue-100 text-blue-800", emoji: "⭐" },
      EXPERT: { color: "bg-purple-100 text-purple-800", emoji: "👑" },
    };
    const { color, emoji } = config[level];
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {emoji} {level}
      </span>
    );
  };

  const getSlotStatusBadge = (slot: JobSkillSlot, selectedCount: number) => {
    const needed = slot.workers_needed;
    if (selectedCount === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          0/{needed} assigned
        </span>
      );
    }
    if (selectedCount < needed) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {selectedCount}/{needed} assigned
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ {selectedCount}/{needed} complete
      </span>
    );
  };

  const validation = getValidationStatus();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                {isPendingInvite ? "Accept Invite & Assign Team" : "Assign Team to Skill Slots"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {job?.title}
                {isPendingInvite && (
                  <span className="ml-2 text-orange-600 font-medium">
                    (Fill all slots to accept)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Progress:</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      validation.isValid ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (validation.totalAssigned / validation.totalNeeded) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {validation.totalAssigned}/{validation.totalNeeded}
                </span>
              </div>
            </div>
            {validation.isValid && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle size={16} /> All slots filled
              </span>
            )}
          </div>
        </div>

        {/* Content - Skill Slots */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-280px)]">
          {skillSlots.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-600">
                No skill slots defined for this job
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {skillSlots.map((slot) => {
                const eligibleEmployees = getEligibleEmployeesForSlot(slot);
                const selectedCount =
                  slotSelections[slot.skill_slot_id]?.size || 0;
                const isExpanded = expandedSlots.has(slot.skill_slot_id);

                return (
                  <div
                    key={slot.skill_slot_id}
                    className={`border-2 rounded-xl overflow-hidden transition-all ${
                      selectedCount === slot.workers_needed
                        ? "border-green-300 bg-green-50/30"
                        : selectedCount > 0
                          ? "border-blue-300 bg-blue-50/30"
                          : "border-gray-200"
                    }`}
                  >
                    {/* Slot Header */}
                    <button
                      onClick={() => toggleSlotExpansion(slot.skill_slot_id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Wrench className="text-indigo-600" size={20} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">
                            {slot.specialization_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-600">
                              Need {slot.workers_needed} worker
                              {slot.workers_needed > 1 ? "s" : ""}
                            </span>
                            {getSkillLevelBadge(slot.skill_level_required)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getSlotStatusBadge(slot, selectedCount)}
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Slot Content - Employee List */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                        {eligibleEmployees.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <AlertCircle
                              className="mx-auto mb-2 text-orange-400"
                              size={24}
                            />
                            <p className="text-sm">
                              No employees with {slot.specialization_name} skill
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {eligibleEmployees.map((employee) => {
                              const workload = employeeWorkloads[employee.employeeId];
                              const isSelected = slotSelections[
                                slot.skill_slot_id
                              ]?.has(employee.employeeId);
                              const isAssignedElsewhere =
                                isEmployeeAssignedElsewhere(
                                  employee.employeeId,
                                  slot.skill_slot_id
                                );
                              const isPrimary =
                                primaryContactId === employee.employeeId;

                              return (
                                <button
                                  key={employee.employeeId}
                                  onClick={() =>
                                    !isAssignedElsewhere &&
                                    toggleEmployeeForSlot(
                                      slot.skill_slot_id,
                                      employee.employeeId
                                    )
                                  }
                                  disabled={isAssignedElsewhere}
                                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    isAssignedElsewhere
                                      ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                      : isSelected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                        {employee.name.charAt(0)}
                                      </div>
                                      {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                          <CheckCircle
                                            className="text-white"
                                            size={12}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 truncate">
                                          {employee.name}
                                        </span>
                                        {isPrimary && (
                                          <Crown
                                            className="text-yellow-500 flex-shrink-0"
                                            size={14}
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>⭐ {employee.rating?.toFixed(1) || "N/A"}</span>
                                        <span>•</span>
                                        <span>{employee.totalJobsCompleted} jobs</span>
                                        {workload && (
                                          <>
                                            <span>•</span>
                                            {getAvailabilityBadge(workload.availability)}
                                          </>
                                        )}
                                      </div>
                                      {isAssignedElsewhere && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          Already assigned to another slot
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Primary Contact Selection */}
          {allSelectedEmployeeIds.size > 1 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Crown className="text-yellow-600" size={18} />
                Select Team Lead
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(allSelectedEmployeeIds).map((empId) => {
                  const emp = employees.find((e) => e.employeeId === empId);
                  if (!emp) return null;
                  return (
                    <button
                      key={empId}
                      onClick={() => setPrimaryContactId(empId)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        primaryContactId === empId
                          ? "bg-yellow-500 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {emp.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!validation.isValid && validation.issues.length > 0 && (
              <span className="text-orange-600">
                ⚠️ {validation.issues[0]}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!validation.isValid || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Assign {validation.totalAssigned} Workers</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
