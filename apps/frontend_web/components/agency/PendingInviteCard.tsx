"use client";

import { useState } from "react";
import {
  Banknote,
  Calendar,
  MapPin,
  Users,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Client {
  id: number;
  name: string;
  avatar: string | null;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface SkillSlot {
  skill_slot_id?: number;
  specialization_id?: number;
  specialization_name: string;
  workers_needed?: number;
  budget_allocated?: number;
  skill_level_required?: string;
  status?: string;
}

interface PendingInviteJob {
  jobID: number;
  title: string;
  description: string;
  category: Category | null;
  budget: number;
  location: string;
  urgency: string;
  status: string;
  jobType: string;
  expectedDuration: string | null;
  expected_duration?: string | null;
  duration_days?: number | null;
  preferredStartDate: string | null;
  preferred_start_date?: string | null;
  scheduledEndDate?: string | null;
  scheduled_end_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
  materialsNeeded?: string[];
  client: Client;
  createdAt: string;
  updatedAt: string;
  inviteStatus?: string;
  // Team job fields
  is_team_job?: boolean;
  total_workers_needed?: number;
  total_workers_assigned?: number;
  team_fill_percentage?: number;
  skill_slots?: SkillSlot[];
}

const isProjectMultiDayJob = (job: PendingInviteJob): boolean => {
  const explicitDays = Number(job.duration_days || 0);
  if (explicitDays > 1) return true;

  const durationText =
    (job.expectedDuration || job.expected_duration || "").toLowerCase();
  const matchedDays = durationText.match(/(\d+)\s*day/);
  return Boolean(matchedDays && Number(matchedDays[1]) > 1);
};

const usesTeamProjectWorkflow = (job: PendingInviteJob): boolean => {
  return Boolean(job.is_team_job) || isProjectMultiDayJob(job);
};

interface WorkerSuggestion {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  rating: number;
  completedJobs: number;
  hourlyRate: string;
  distance: number;
  isAvailable: boolean;
  isVerified: boolean;
}

interface PendingInviteCardProps {
  job: PendingInviteJob;
  availableWorkers?: WorkerSuggestion[];
  onAccept: (jobId: number) => Promise<void>;
  onReject: (job: PendingInviteJob) => void;
  accepting?: boolean;
}

export default function PendingInviteCard({
  job,
  availableWorkers = [],
  onAccept,
  onReject,
  accepting = false,
}: PendingInviteCardProps) {
  const [loading, setLoading] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  const expectedDurationLabel =
    job.expectedDuration ??
    job.expected_duration ??
    (typeof job.duration_days === "number"
      ? `${job.duration_days} day${job.duration_days === 1 ? "" : "s"}`
      : null);

  const startDateRaw = job.preferredStartDate ?? job.preferred_start_date;
  const endDateRaw =
    job.scheduledEndDate ??
    job.scheduled_end_date ??
    job.endDate ??
    job.end_date;

  const formatShortDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return "Not specified";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "Not specified";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const simplifiedSkillSlots =
    usesTeamProjectWorkflow(job) && job.skill_slots && job.skill_slots.length > 0
      ? job.skill_slots
          .map((slot) => {
            const count = slot.workers_needed ?? 0;
            return `${slot.specialization_name} (${count})`;
          })
          .join(", ")
      : "";

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(job.jobID);
    } finally {
      setLoading(false);
      setShowAcceptConfirm(false);
    }
  };

  return (
    <>
    <Card className="border border-[#00BAF1]/25 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group bg-white">
      <CardContent className="relative p-4 sm:p-6 opacity-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          {/* Left Column: Details */}
          <div className="flex-1 space-y-4">
            {/* Title and Badges */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0098c7] transition-colors">
                  {job.title}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00BAF1]/15 text-[#008fb8] border border-[#00BAF1]/30">
                  DIRECT INVITE
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
              <p className="text-slate-600 leading-relaxed text-sm">
                {job.description}
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 md:flex md:flex-wrap">
              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[150px] md:w-auto">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <Banknote className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Budget</p>
                  <div className="font-bold text-slate-900">
                    ₱{job.budget?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[150px] md:min-w-0 md:w-fit md:max-w-[26rem]">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium">Location</p>
                  <p className="font-semibold text-slate-900 md:whitespace-nowrap truncate">
                    {job.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[150px] md:w-auto">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Start Date</p>
                  <p className="font-semibold text-slate-900">
                    {formatShortDate(startDateRaw)}
                  </p>
                </div>
              </div>

              {expectedDurationLabel && (
                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[150px] md:w-auto">
                  <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                    <Clock className="h-4 w-4 text-[#00BAF1]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Ex. Duration</p>
                    <p className="font-semibold text-slate-900 truncate">
                      {expectedDurationLabel}
                    </p>
                  </div>
                </div>
              )}

              {endDateRaw && (
                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[150px] md:w-auto">
                  <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-[#00BAF1]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">End Date</p>
                    <p className="font-semibold text-slate-900">
                      {formatShortDate(endDateRaw)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {usesTeamProjectWorkflow(job) && (
              <div className="p-3 bg-transparent rounded-lg border border-gray-200">
                <h4 className="font-semibold text-slate-900 mb-1 text-sm">
                  Required Workers
                </h4>
                {simplifiedSkillSlots ? (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {simplifiedSkillSlots}
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Project multi-day workflow: assign workers through the
                    slot-based team assignment flow.
                    {typeof job.total_workers_needed === "number" &&
                    job.total_workers_needed > 0
                      ? ` Workers needed: ${job.total_workers_needed}.`
                      : ""}
                    {job.category?.name
                      ? ` Category focus: ${job.category.name}.`
                      : ""}
                  </p>
                )}
              </div>
            )}

            {job.materialsNeeded && job.materialsNeeded.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center mb-3">
                  <div className="p-1 bg-[#00BAF1]/15 rounded mr-2">
                    <Package className="h-4 w-4 text-[#008fb8]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">Materials Needed</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.materialsNeeded.map((material, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-[#008fb8] font-bold">•</span> {material}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Workers */}
            {availableWorkers.length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center text-sm">
                  <Users className="h-4 w-4 text-[#00BAF1] mr-2" />
                  Available Workers Match ({availableWorkers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableWorkers.slice(0, 4).map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between gap-3 p-2 bg-white rounded border border-blue-50 hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {worker.name}
                          </p>
                          {worker.isVerified && (
                            <span className="text-[9px] font-bold px-1 rounded-sm bg-green-100 text-green-700">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {worker.specialization || "General Services"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded font-medium">⭐ {worker.rating?.toFixed?.(1) ?? "0.0"}</span>
                          <span className="text-[10px] text-slate-500">{worker.completedJobs} jobs</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#00BAF1] mt-0.5">
                          {worker.hourlyRate}
                        </p>
                      </div>
                    </div>
                  ))}
                  {availableWorkers.length > 4 && (
                    <div className="flex items-center justify-center p-2 bg-slate-50/50 rounded border border-dashed border-slate-200 text-xs text-slate-500 font-medium">
                      + {availableWorkers.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client Info footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Client:</span>
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1 hover:text-[#0098c7] cursor-pointer transition-colors">
                    {job.client.name}
                  </span>
                </div>
                {job.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Category:</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                      {job.category.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Invited on {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-row md:flex-col gap-3 min-w-[200px]">
            <button
              onClick={() => setShowAcceptConfirm(true)}
              disabled={loading || accepting}
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00BAF1] hover:bg-[#00a8d8] text-white rounded-lg transition-all text-sm font-bold shadow-sm disabled:opacity-50"
            >
              {loading || accepting ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 shrink-0" />
              )}
              {loading || accepting ? "Accepting..." : "Accept"}
            </button>
            <button
              onClick={() => onReject(job)}
              disabled={loading || accepting}
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-bold shadow-sm disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              Reject
            </button>

            <div className="hidden md:flex flex-col items-center justify-center text-center p-3 bg-slate-50 rounded border border-dashed border-slate-200 mt-2">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Time Remaining</span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#008fb8]" />
                48 hours
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
      <AlertDialogContent className="border border-[#00BAF1]/35">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900">Confirm Job Acceptance</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 leading-relaxed">
            By accepting this invitation, you commit to completing the job as described.
            If you reject, the client will be refunded immediately without penalties.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#00BAF1]/35 text-[#008fb8] hover:bg-[#00BAF1]/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAccept}
            className="bg-[#00BAF1] hover:bg-[#00a8d8] focus:ring-[#008fb8]"
            disabled={loading || accepting}
          >
            {loading || accepting ? "Accepting..." : "Accept Job"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
