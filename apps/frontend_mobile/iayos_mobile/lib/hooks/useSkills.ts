// Worker Skills Management Hooks
// Add, update, remove skills (specializations) from worker profile

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS } from "@/lib/api/config";

// ===== TYPES =====

export interface AvailableSkill {
  id: number;
  name: string;
  description: string;
  minimumRate: number;
  rateType: string;
  skillLevel: string;
}

export interface WorkerSkill {
  id: number; // Specialization ID
  name: string;
  description: string;
  experienceYears: number;
  certification: string;
}

interface AvailableSkillsResponse {
  success: boolean;
  data: AvailableSkill[];
  count: number;
}

interface MySkillsResponse {
  success: boolean;
  data: WorkerSkill[];
  count: number;
}

interface AddSkillResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    workerSkillId: number;
    name: string;
    experienceYears: number;
  };
}

interface UpdateSkillResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    experienceYears: number;
  };
}

interface RemoveSkillResponse {
  success: boolean;
  message: string;
  deletedCertifications: number;
}

// ===== QUERIES =====

/**
 * Fetch all available specializations that workers can add
 */
export function useAvailableSkills() {
  return useQuery({
    queryKey: ["available-skills"],
    queryFn: async (): Promise<AvailableSkill[]> => {
      const response = await apiRequest(ENDPOINTS.AVAILABLE_SKILLS);
      if (!response.ok) throw new Error("Failed to fetch available skills");
      const data = (await response.json()) as AvailableSkillsResponse;
      return data.data || [];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (master data rarely changes)
  });
}

/**
 * Fetch worker's current skills
 */
export function useMySkills() {
  return useQuery({
    queryKey: ["my-skills"],
    queryFn: async (): Promise<WorkerSkill[]> => {
      const response = await apiRequest(ENDPOINTS.MY_SKILLS);
      if (!response.ok) throw new Error("Failed to fetch your skills");
      const data = (await response.json()) as MySkillsResponse;
      return data.data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// ===== MUTATIONS =====

/**
 * Add a skill to worker's profile
 */
export function useAddSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      specialization_id: number;
      experience_years: number;
    }): Promise<AddSkillResponse> => {
      const response = await apiRequest(ENDPOINTS.ADD_SKILL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AddSkillResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to add skill");
      }

      return data as AddSkillResponse;
    },
    onSuccess: () => {
      // Invalidate skills queries to refetch
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
}

/**
 * Update experience years for a skill
 */
export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      skill_id: number;
      experience_years: number;
    }): Promise<UpdateSkillResponse> => {
      const response = await apiRequest(
        ENDPOINTS.UPDATE_SKILL(payload.skill_id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experience_years: payload.experience_years }),
        },
      );

      const data = (await response.json()) as UpdateSkillResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to update skill");
      }

      return data as UpdateSkillResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
}

/**
 * Remove a skill from worker's profile
 */
export function useRemoveSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skillId: number): Promise<RemoveSkillResponse> => {
      const response = await apiRequest(ENDPOINTS.REMOVE_SKILL(skillId), {
        method: "DELETE",
      });

      const data = (await response.json()) as RemoveSkillResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove skill");
      }

      return data as RemoveSkillResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
      queryClient.invalidateQueries({ queryKey: ["certifications"] }); // Refresh certs (may have cascade deleted)
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
}
