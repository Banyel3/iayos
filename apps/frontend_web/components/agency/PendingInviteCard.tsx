"use client";

import { useState } from "react";
import {
  Banknote,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  preferredStartDate: string | null;
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

  const urgencyColors = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  };

  const downpayment = job.budget * 0.5;
  const remaining = job.budget * 0.5;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(job.jobID);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-t-4 border-t-[#00BAF1]">
      <CardContent className="relative p-4 sm:p-6 opacity-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          {/* Left Column: Details */}
          <div className="flex-1 space-y-4">
            {/* Title and Badges */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00BAF1] transition-colors">
                  {job.title}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00BAF1]/10 text-[#00BAF1] border border-[#00BAF1]/20">
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
                {job.is_team_job && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    TEAM JOB ({job.total_workers_needed})
                  </span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
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
                    ₱{job.budget?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {job.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <Clock className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Ex. Duration</p>
                  <p className="font-bold text-gray-900 truncate">
                    {job.expectedDuration || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="p-1.5 bg-[#00BAF1]/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-[#00BAF1]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {job.preferredStartDate
                      ? new Date(job.preferredStartDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional info block Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Payment Details */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="p-1 bg-green-100 rounded mr-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">Payment Breakdown</h4>
                  </div>
                  <span className="text-sm font-bold text-green-700">₱{job.budget?.toLocaleString()}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-green-200/50 pb-1.5">
                    <span className="text-gray-600 hover:text-gray-900 transition-colors">50% Escrow Downpayment:</span>
                    <span className="font-semibold text-green-700">₱{downpayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-gray-600 hover:text-gray-900 transition-colors">Remaining Return:</span>
                    <span className="font-semibold text-gray-800">₱{remaining.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2.5 italic flex items-center gap-1 opacity-80">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Escrow guarantees downpayment.
                </p>
              </div>

              {/* Box 2: Warning Box */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex flex-col items-start gap-2 h-full">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-yellow-100 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                  </div>
                  <span className="font-bold text-yellow-800 text-sm">Important Commitment</span>
                </div>
                <div className="text-xs text-yellow-800/90 leading-relaxed ml-1">
                  By accepting this invitation, you commit to completing the job as described.
                  If you reject, the client will be refunded immediately without penalties.
                </div>
              </div>
            </div>

            {job.materialsNeeded && job.materialsNeeded.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="p-1 bg-gray-200 rounded mr-2">
                    <Package className="h-4 w-4 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">Materials Needed</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.materialsNeeded.map((material, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-[#00BAF1] font-bold">•</span> {material}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skill Slots for Team Jobs */}
            {job.is_team_job && job.skill_slots && job.skill_slots.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Users className="h-4 w-4 text-purple-600 mr-2" />
                  Required Workers ({job.total_workers_needed} total)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {job.skill_slots.map((slot) => (
                    <div
                      key={slot.skill_slot_id ?? `${slot.specialization_name}-${slot.workers_needed ?? 0}`}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-purple-100 shadow-sm hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Wrench className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span className="font-medium text-gray-800 truncate text-xs">
                          {slot.specialization_name}
                        </span>
                        <span className="text-[10px] text-gray-500 px-1 py-0.5 bg-gray-100 rounded shrink-0 hidden sm:inline font-medium uppercase truncate max-w-[60px]">
                          {slot.skill_level_required || "ANY"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-600 whitespace-nowrap bg-gray-50 px-1.5 rounded">
                          {(slot.workers_needed ?? 0)} req
                        </span>
                        <span className="text-[11px] font-bold text-purple-600 whitespace-nowrap bg-purple-100 px-1.5 py-0.5 rounded-full">
                          ₱{(slot.budget_allocated ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-purple-700 flex items-center gap-1 opacity-80 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Assign employees to skill slots after accepting.
                </p>
              </div>
            )}

            {/* Suggested Workers */}
            {availableWorkers.length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
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
                          <p className="font-semibold text-gray-900 text-xs truncate">
                            {worker.name}
                          </p>
                          {worker.isVerified && (
                            <span className="text-[9px] font-bold px-1 rounded-sm bg-green-100 text-green-700">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {worker.specialization || "General Services"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded font-medium">⭐ {worker.rating?.toFixed?.(1) ?? "0.0"}</span>
                          <span className="text-[10px] text-gray-500">{worker.completedJobs} jobs</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#00BAF1] mt-0.5">
                          {worker.hourlyRate}
                        </p>
                      </div>
                    </div>
                  ))}
                  {availableWorkers.length > 4 && (
                    <div className="flex items-center justify-center p-2 bg-gray-50/50 rounded border border-dashed border-gray-200 text-xs text-gray-500 font-medium">
                      + {availableWorkers.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client Info footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Client:</span>
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1 hover:text-[#00BAF1] cursor-pointer transition-colors">
                    {job.client.name}
                  </span>
                </div>
                {job.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                      {job.category.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Invited on {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-row md:flex-col gap-3 min-w-[200px]">
            <button
              onClick={handleAccept}
              disabled={loading || accepting}
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00BAF1] hover:bg-sky-500 text-white rounded-lg transition-all text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 active:scale-95"
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
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-bold shadow-sm disabled:opacity-50 active:scale-95 hover:shadow hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              Reject
            </button>

            <div className="hidden md:flex flex-col items-center justify-center text-center p-3 bg-gray-50 rounded border border-dashed border-gray-200 mt-2">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Time Remaining</span>
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00BAF1]" />
                48 hours
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
