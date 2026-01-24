import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api/config";

interface AgencyEmployee {
  employee_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: number;
  is_active: boolean;
  joined_date: string;
  employee_of_the_month: boolean;
  eotm_date: string | null;
  eotm_reason: string | null;
}

interface EmployeePerformance {
  profile: {
    id: number;
    name: string;
    email: string;
    rating: number;
    jobs_completed: number;
  };
  jobs: {
    completed: number;
    active: number;
    cancelled: number;
    completion_rate: number;
  };
  earnings: {
    total: number;
    this_month: number;
    last_month: number;
    average_per_job: number;
  };
  ratings: {
    average: number;
    count: number;
    breakdown: { [key: number]: number };
  };
  recent_jobs: Array<{
    job_id: number;
    title: string;
    client_name: string;
    completed_at: string;
    rating: number | null;
    earnings: number;
  }>;
}

/**
 * Fetch all employees for a specific agency
 */
export function useAgencyEmployees(agencyId: number) {
  return useQuery<AgencyEmployee[]>({
    queryKey: ["admin-agency-employees", agencyId],
    queryFn: async () => {
      const apiUrl = API_BASE;

      // Fetch via dedicated admin endpoint
      const response = await fetch(
        `${apiUrl}/api/adminpanel/users/agencies/${agencyId}/employees`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch agency employees");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch agency employees");
      }

      // Map backend response to expected format
      const employees = Array.isArray(data.employees) ? data.employees : [];

      return employees.map((emp: any) => ({
        employee_id: emp.id || emp.employeeID,
        name: emp.name || "",
        email: emp.email || "",
        phone: "", // Not provided by backend
        role: emp.role || "Worker",
        rating: emp.rating || 0,
        total_jobs_completed: emp.totalJobsCompleted || 0,
        total_earnings: emp.totalEarnings || 0,
        is_active: emp.isActive !== false,
        joined_date: new Date().toISOString(), // Not provided by backend
        employee_of_the_month: emp.employeeOfTheMonth || false,
        eotm_date: emp.employeeOfTheMonthDate || null,
        eotm_reason: emp.employeeOfTheMonthReason || null,
      }));
    },
    enabled: !!agencyId && agencyId > 0,
  });
}

/**
 * Fetch detailed performance metrics for an employee
 */
export function useEmployeePerformance(employeeId: number) {
  return useQuery<EmployeePerformance>({
    queryKey: ["employee-performance", employeeId],
    queryFn: async () => {
      const apiUrl = API_BASE;

      const response = await fetch(
        `${apiUrl}/api/agency/employees/${employeeId}/performance`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employee performance");
      }

      return response.json();
    },
    enabled: !!employeeId && employeeId > 0,
  });
}

/**
 * Bulk update employee status (activate/deactivate)
 */
export function useBulkUpdateEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeIds,
      action,
      agencyId,
    }: {
      employeeIds: number[];
      action: "activate" | "deactivate";
      agencyId: number;
    }) => {
      const apiUrl = API_BASE;

      // This endpoint may need to be created on backend
      // For now, we'll make individual requests
      const updatePromises = employeeIds.map(async (id) => {
        const response = await fetch(
          `${apiUrl}/api/admin/agency/employees/${id}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              is_active: action === "activate",
              agency_id: agencyId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to ${action} employee ${id}`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);

      return { success: true, updated: employeeIds.length };
    },
    onSuccess: (_, variables) => {
      // Invalidate cache to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["admin-agency-employees", variables.agencyId],
      });
    },
  });
}

/**
 * Export employees data to CSV
 */
export function exportEmployeesToCSV(
  employees: AgencyEmployee[],
  agencyName: string,
) {
  const headers = [
    "Employee ID",
    "Name",
    "Email",
    "Phone",
    "Role",
    "Rating",
    "Jobs Completed",
    "Total Earnings",
    "Status",
    "Joined Date",
    "EOTM",
  ];

  const rows = employees.map((emp) => [
    emp.employee_id,
    emp.name,
    emp.email,
    emp.phone,
    emp.role,
    emp.rating.toFixed(1),
    emp.total_jobs_completed,
    `₱${emp.total_earnings.toFixed(2)}`,
    emp.is_active ? "Active" : "Inactive",
    new Date(emp.joined_date).toLocaleDateString(),
    emp.employee_of_the_month ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${agencyName}_employees_${Date.now()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
