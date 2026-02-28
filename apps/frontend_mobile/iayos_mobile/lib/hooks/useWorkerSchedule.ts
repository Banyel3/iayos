import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/config";
import { ENDPOINTS } from "../api/config";

export interface ScheduledJob {
  id: number;
  title: string;
  status: string;
  budget: number;
  location: string;
  preferred_start_date: string; // "YYYY-MM-DD"
  scheduled_end_date: string;   // "YYYY-MM-DD"
  other_party_name?: string;
}

export interface WorkerScheduleResponse {
  success: boolean;
  jobs: ScheduledJob[];
}

/**
 * Fetches the worker's scheduled jobs (those with both preferredStartDate and scheduled_end_date set).
 * Used by the calendar FAB to show the worker's upcoming schedule.
 */
export function useWorkerSchedule() {
  return useQuery<WorkerScheduleResponse>({
    queryKey: ["workerSchedule"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WORKER_SCHEDULE);
      if (!response.ok) {
        throw new Error("Failed to fetch worker schedule");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Transform scheduled jobs into react-native-calendars MarkedDates format.
 * Each date between start and end is marked with a dot.
 */
export function buildMarkedDates(jobs: ScheduledJob[]): Record<string, any> {
  const marked: Record<string, any> = {};

  jobs.forEach((job, idx) => {
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    const color = colors[idx % colors.length];

    const start = new Date(job.preferred_start_date);
    const end = new Date(job.scheduled_end_date);

    // Mark every day in the range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      if (!marked[dateStr]) {
        marked[dateStr] = {
          dots: [],
          periods: [],
          startingDay: false,
          endingDay: false,
        };
      }
      if (current.getTime() === start.getTime()) {
        marked[dateStr].startingDay = true;
        marked[dateStr].color = color;
        marked[dateStr].textColor = "#ffffff";
      }
      if (current.getTime() === end.getTime()) {
        marked[dateStr].endingDay = true;
        marked[dateStr].color = color;
        marked[dateStr].textColor = "#ffffff";
      }
      if (current > start && current < end) {
        marked[dateStr].color = color + "88"; // semi-transparent for range
        marked[dateStr].textColor = "#ffffff";
      }
      marked[dateStr].dots = marked[dateStr].dots || [];
      const existingDot = marked[dateStr].dots.find((d: any) => d.color === color);
      if (!existingDot) {
        marked[dateStr].dots.push({ color, selectedDotColor: color });
      }
      current.setDate(current.getDate() + 1);
    }
  });

  return marked;
}

/**
 * Get jobs that overlap with a specific date string (YYYY-MM-DD).
 */
export function getJobsForDate(jobs: ScheduledJob[], dateStr: string): ScheduledJob[] {
  return jobs.filter((job) => {
    return (
      job.preferred_start_date <= dateStr && job.scheduled_end_date >= dateStr
    );
  });
}
