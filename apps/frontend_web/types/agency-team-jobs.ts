/**
 * Agency Team Job Types
 * Types for multi-employee hiring with skill slots
 */

// Skill level options
export type SkillLevel = "ENTRY" | "INTERMEDIATE" | "EXPERT";

// Skill slot status
export type SlotStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CLOSED";

// Assignment status
export type AssignmentStatus = "ACTIVE" | "COMPLETED" | "REMOVED" | "WITHDRAWN";

// Employee availability
export type EmployeeAvailability = "AVAILABLE" | "WORKING" | "BUSY" | "INACTIVE";

/**
 * Represents a skill slot requirement for a team job
 */
export interface JobSkillSlot {
  skill_slot_id: number;
  specialization_id: number;
  specialization_name: string;
  workers_needed: number;
  skill_level_required: SkillLevel;
  skill_level?: SkillLevel; // Alternative field name from backend
  budget_allocated?: number; // Budget for this slot
  notes: string | null;
  status: SlotStatus;
  assigned_count: number;
  assigned_employees: AssignedEmployeeInfo[];
}

/**
 * Employee assigned to a skill slot
 */
export interface AssignedEmployeeInfo {
  assignment_id: number;
  employee_id: number;
  employee_name: string;
  employee_rating?: number; // Worker's rating
  is_primary_contact: boolean;
  assigned_at: string | null;
  // Worker tracking fields
  client_confirmed_arrival?: boolean;
  client_confirmed_arrival_at?: string | null;
  worker_marked_complete?: boolean;
  worker_marked_complete_at?: string | null;
  individual_rating?: number | null;
}

/**
 * Response from GET /api/agency/jobs/{job_id}/skill-slots
 */
export interface JobSkillSlotsResponse {
  success: boolean;
  job_id: number;
  job_title: string;
  is_team_job: boolean;
  skill_slots: JobSkillSlot[];
  total_slots: number;
  total_workers_needed: number;
  total_workers_assigned: number;
}

/**
 * Single assignment in the assign-employees-to-slots request
 */
export interface SlotAssignment {
  skill_slot_id: number;
  employee_id: number;
}

/**
 * Request body for POST /api/agency/jobs/{job_id}/assign-employees-to-slots
 */
export interface AssignEmployeesToSlotsRequest {
  assignments: SlotAssignment[];
  primary_contact_employee_id?: number;
}

/**
 * Response from assign-employees-to-slots endpoint
 */
export interface AssignEmployeesToSlotsResponse {
  success: boolean;
  job_id?: number;
  total_assigned?: number;
  error?: string;
}

/**
 * Employee workload info
 */
export interface EmployeeWorkload {
  assigned_jobs_count: number;
  in_progress_jobs_count: number;
  total_active_jobs: number;
  availability: EmployeeAvailability;
}

/**
 * Extended employee with specialization for filtering
 */
export interface EmployeeWithSpecialization {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number | null;
  totalJobsCompleted: number;
  isActive: boolean;
  specializations?: number[]; // List of specialization IDs employee has
  workload?: EmployeeWorkload;
}

/**
 * Extended job interface for team jobs
 */
export interface TeamJob {
  jobID: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  jobType: string;
  inviteStatus?: string;
  is_team_job: boolean;
  skill_slots?: JobSkillSlot[];
  total_workers_needed?: number;
  total_workers_assigned?: number;
  category: {
    id: number;
    name: string;
  } | null;
  client: {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Per-worker arrival confirmation request
 */
export interface ConfirmArrivalRequest {
  assignment_id: number;
}

/**
 * Response from confirm arrival endpoint
 */
export interface ConfirmArrivalResponse {
  success: boolean;
  assignment_id: number;
  worker_name: string;
  confirmed_at: string;
  all_workers_arrived: boolean;
  arrived_count: number;
  total_count: number;
}

/**
 * Per-worker completion request
 */
export interface WorkerCompleteRequest {
  completion_notes?: string;
}

/**
 * Response from worker completion endpoint
 */
export interface WorkerCompleteResponse {
  success: boolean;
  assignment_id: number;
  worker_name: string;
  completed_at: string;
  all_workers_complete: boolean;
  completed_count: number;
  total_count: number;
}
