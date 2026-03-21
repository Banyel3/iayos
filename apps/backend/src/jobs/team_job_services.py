# ===========================================================================
# TEAM JOB SERVICES - Multi-Skill Multi-Worker Business Logic
# ===========================================================================

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import Sum, Count, Q
from django.utils import timezone

from accounts.models import (
    Job,
    JobSkillSlot,
    JobWorkerAssignment,
    JobEmployeeAssignment,
    JobApplication,
    Specializations,
    Profile,
    WorkerProfile,
    ClientProfile,
    Notification,
    Transaction,
    Wallet,
    workerSpecialization,
    JobDispute,
    PriceNegotiation,
)
from profiles.models import Conversation, ConversationParticipant


def _build_agency_fallback_slots(skill_slots_data: list, payment_model: str) -> list:
    """Return slots with no qualified freelancers and no agency invite."""
    fallback_slots = []

    for slot_data in skill_slots_data:
        if slot_data.get("agency_id"):
            continue

        spec_id = slot_data["specialization_id"]
        workers_needed = int(slot_data.get("workers_needed", 1) or 1)

        freelance_qs = workerSpecialization.objects.filter(
            specializationID_id=spec_id,
            workerID__availability_status="AVAILABLE",
            workerID__profileID__accountFK__is_active=True,
            workerID__profileID__accountFK__is_suspended=False,
            workerID__profileID__accountFK__is_banned=False,
        )

        if payment_model == "DAILY":
            freelance_qs = freelance_qs.filter(workerID__is_available_daily_jobs=True)

        available_freelancers = freelance_qs.values("workerID_id").distinct().count()
        if available_freelancers > 0:
            continue

        specialization_name = "Unknown"
        try:
            specialization_name = (
                Specializations.objects.only("specializationName")
                .get(specializationID=spec_id)
                .specializationName
            )
        except Specializations.DoesNotExist:
            pass

        fallback_slots.append(
            {
                "specialization_id": spec_id,
                "specialization_name": specialization_name,
                "workers_needed": workers_needed,
                "available_freelancers": available_freelancers,
            }
        )

    return fallback_slots


def _calculate_team_pending_payouts(job: Job, total_pending_pool: Decimal) -> dict:
    """
    Split pending payout pool across assigned team members (freelance workers
    AND agency employees).

    PROJECT jobs use slot budget-per-worker as weight.
    DAILY jobs use assignment earnings/rate as weight.

    Freelance worker payouts go to the worker's personal account.
    Agency employee payouts go to the agency owner's account (aggregated if
    the agency has multiple employees on the same job).
    """
    pool = Decimal(total_pending_pool or Decimal("0.00"))
    if pool <= 0:
        return {}

    payment_model = str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper()
    weighted_accounts = []  # list of (account, base_amount)

    # --- Freelance worker assignments ---
    worker_assignments = list(
        JobWorkerAssignment.objects.select_related(
            "workerID__profileID__accountFK", "skillSlotID"
        ).filter(jobID=job, assignment_status__in=["ACTIVE", "COMPLETED"])
    )

    for assignment in worker_assignments:
        worker_account = assignment.workerID.profileID.accountFK
        base_amount = Decimal("0.00")

        if payment_model == "DAILY":
            if assignment.total_earned and assignment.total_earned > 0:
                base_amount = assignment.total_earned
            else:
                daily_rate = (
                    assignment.daily_rate_at_assignment
                    or job.daily_rate_agreed
                    or Decimal("0.00")
                )
                days_worked = (
                    assignment.days_worked
                    or int(getattr(job, "total_days_worked", 0) or 0)
                    or 1
                )
                base_amount = Decimal(daily_rate) * Decimal(days_worked)
        else:
            if assignment.skillSlotID is not None:
                base_amount = Decimal(
                    assignment.skillSlotID.budget_per_worker or Decimal("0.00")
                )

        if base_amount < 0:
            base_amount = Decimal("0.00")

        weighted_accounts.append((worker_account, base_amount))

    # --- Agency employee assignments (team slot-based) ---
    employee_assignments = list(
        JobEmployeeAssignment.objects.select_related(
            "employee__agency", "skill_slot"
        ).filter(
            job=job,
            status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
            skill_slot__isnull=False,
        )
    )

    for emp_assignment in employee_assignments:
        # Agency employee payouts go to the agency owner's account
        agency_account = emp_assignment.employee.agency
        base_amount = Decimal("0.00")

        if payment_model == "DAILY":
            # Use paymentAmount if already calculated, otherwise derive from
            # employee daily rate or job daily rate
            if emp_assignment.paymentAmount and emp_assignment.paymentAmount > 0:
                base_amount = emp_assignment.paymentAmount
            else:
                daily_rate = Decimal("0.00")
                if (
                    hasattr(emp_assignment.employee, "daily_rate")
                    and emp_assignment.employee.daily_rate
                ):
                    daily_rate = Decimal(str(emp_assignment.employee.daily_rate))
                else:
                    daily_rate = Decimal(str(job.daily_rate_agreed or "0.00"))
                days_worked = int(getattr(job, "total_days_worked", 0) or 0) or 1
                base_amount = daily_rate * Decimal(days_worked)
        else:
            # PROJECT: use slot budget_per_worker
            if emp_assignment.skill_slot is not None:
                base_amount = Decimal(
                    emp_assignment.skill_slot.budget_per_worker or Decimal("0.00")
                )

        if base_amount < 0:
            base_amount = Decimal("0.00")

        weighted_accounts.append((agency_account, base_amount))

    if not weighted_accounts:
        return {}

    total_base = sum(base for _, base in weighted_accounts)
    payouts = {}

    if total_base <= 0:
        split_count = len(weighted_accounts)
        equal_share = (pool / Decimal(split_count)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        distributed = Decimal("0.00")

        for index, (account, _) in enumerate(weighted_accounts):
            if index == split_count - 1:
                amount = pool - distributed
            else:
                amount = equal_share
                distributed += amount
            payouts[account] = payouts.get(account, Decimal("0.00")) + amount
        return payouts

    distributed = Decimal("0.00")
    last_index = len(weighted_accounts) - 1
    for index, (account, base) in enumerate(weighted_accounts):
        if index == last_index:
            amount = pool - distributed
        else:
            ratio = (base / total_base) if total_base > 0 else Decimal("0.00")
            amount = (pool * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            distributed += amount

        payouts[account] = payouts.get(account, Decimal("0.00")) + amount

    return payouts


def _calculate_team_daily_remaining_payouts(job: Job) -> dict:
    """
    Calculate remaining DAILY payout per recipient account for team jobs.

    Remaining payout is computed from each assignment's contracted amount minus
    amounts already earned/credited (`total_earned` for freelancers,
    `paymentAmount` for agency employees).
    """
    payouts = {}
    planned_days = int(getattr(job, "duration_days", 0) or 0)
    if planned_days <= 0:
        planned_days = 1

    worker_assignments = JobWorkerAssignment.objects.select_related(
        "workerID__profileID__accountFK"
    ).filter(jobID=job, assignment_status__in=["ACTIVE", "COMPLETED"])

    for assignment in worker_assignments:
        account = assignment.workerID.profileID.accountFK
        daily_rate = (
            assignment.daily_rate_at_assignment
            or job.daily_rate_agreed
            or Decimal("0.00")
        )
        full_contract = Decimal(daily_rate) * Decimal(planned_days)
        already_earned = Decimal(assignment.total_earned or Decimal("0.00"))
        remaining = full_contract - already_earned
        if remaining < Decimal("0.00"):
            remaining = Decimal("0.00")
        payouts[account] = payouts.get(account, Decimal("0.00")) + remaining

    employee_assignments = JobEmployeeAssignment.objects.select_related(
        "employee__agency"
    ).filter(
        job=job,
        status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
        skill_slot__isnull=False,
    )

    for emp_assignment in employee_assignments:
        account = emp_assignment.employee.agency
        daily_rate = Decimal("0.00")
        if (
            hasattr(emp_assignment.employee, "daily_rate")
            and emp_assignment.employee.daily_rate
        ):
            daily_rate = Decimal(str(emp_assignment.employee.daily_rate))
        else:
            daily_rate = Decimal(str(job.daily_rate_agreed or "0.00"))

        full_contract = daily_rate * Decimal(planned_days)
        already_earned = Decimal(emp_assignment.paymentAmount or Decimal("0.00"))
        remaining = full_contract - already_earned
        if remaining < Decimal("0.00"):
            remaining = Decimal("0.00")

        payouts[account] = payouts.get(account, Decimal("0.00")) + remaining

    return {account: amount for account, amount in payouts.items() if amount > 0}


def _get_required_project_days(job: Job) -> int:
    configured = int(getattr(job, "duration_days", 0) or 0)
    if configured > 0:
        return configured

    expected = str(getattr(job, "expectedDuration", "") or "").strip().lower()
    if expected:
        import re

        match = re.search(r"(\d+)", expected)
        if match:
            try:
                parsed = int(match.group(1))
                if parsed > 0:
                    return parsed
            except ValueError:
                pass

    return 1


def _get_elapsed_project_days(job: Job) -> int:
    qa_offset = int(getattr(job, "qa_day_offset", 0) or 0)
    total_days_worked = int(getattr(job, "total_days_worked", 0) or 0)

    if total_days_worked > 0:
        return max(0, total_days_worked + qa_offset)

    started_at = getattr(job, "clientConfirmedWorkStartedAt", None)
    if not started_at:
        return max(0, qa_offset)

    start_date = timezone.localtime(started_at).date()
    today = timezone.localdate()
    elapsed = (today - start_date).days + 1
    return max(0, elapsed + qa_offset)


def _project_multi_day_gate_error(job: Job):
    payment_model = str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper()
    if payment_model != "PROJECT":
        return None

    required_days = _get_required_project_days(job)
    if required_days <= 1:
        return None

    elapsed_days = _get_elapsed_project_days(job)
    if elapsed_days >= required_days:
        return None

    return {
        "success": False,
        "error": (
            f"This is a {required_days}-day project job. "
            f"Final completion and payment are only allowed on day {required_days}."
        ),
        "required_days": required_days,
        "elapsed_days": elapsed_days,
        "remaining_days": required_days - elapsed_days,
        "payment_model": payment_model,
    }


def _self_heal_team_assignment_completion_flags(job: Job) -> int:
    """
    Backward-compatibility self-heal for legacy/inconsistent assignment states.

    Some older flows left `worker_marked_complete=False` even when assignment
    status and/or timestamps already indicate completion. Normalize those rows
    so client final approval + payment can proceed safely.

    Returns number of healed assignment rows.
    """
    healed_count = 0
    now = timezone.now()
    payment_model = str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper()
    required_days = _get_required_project_days(job)

    # For PROJECT jobs, infer completion from attendance rows so legacy records
    # without explicit assignment completion flags can still pass final approval
    # safely (single-day and multi-day).
    confirmed_days_by_assignment = {}
    confirmed_days_by_worker = {}
    effective_required_days = max(1, required_days)
    project_attendance_completion_signal_by_assignment = {}
    project_attendance_completion_signal_by_worker = {}
    if payment_model == "PROJECT":
        from accounts.models import DailyAttendance

        qa_offset = max(0, int(getattr(job, "qa_day_offset", 0) or 0))
        # QA skip-day offset reduces the number of attendance days needed
        # to infer assignment completion in test scenarios.
        effective_required_days = max(1, required_days - qa_offset)

        confirmed_base_qs = DailyAttendance.objects.filter(
            jobID=job,
            client_confirmed=True,
            status__in=[
                DailyAttendance.AttendanceStatus.PRESENT,
                DailyAttendance.AttendanceStatus.HALF_DAY,
                DailyAttendance.AttendanceStatus.PENDING,
            ],
        )

        confirmed_qs = (
            confirmed_base_qs.filter(
                assignmentID__isnull=False,
            )
            .values("assignmentID_id")
            .annotate(days=Count("date", distinct=True))
        )

        confirmed_days_by_assignment = {
            row["assignmentID_id"]: int(row["days"] or 0) for row in confirmed_qs
        }

        # Legacy fallback: attendance rows may exist without assignment linkage
        # but still contain worker linkage.
        confirmed_worker_direct_qs = (
            confirmed_base_qs.filter(
                workerID__isnull=False,
            )
            .values("workerID_id")
            .annotate(days=Count("date", distinct=True))
        )

        for row in confirmed_worker_direct_qs:
            worker_id = row["workerID_id"]
            if worker_id:
                confirmed_days_by_worker[worker_id] = max(
                    confirmed_days_by_worker.get(worker_id, 0),
                    int(row["days"] or 0),
                )

        # Also derive worker-level day counts from assignment-linked rows.
        confirmed_worker_assignment_qs = (
            confirmed_base_qs.filter(
                jobID=job,
                assignmentID__isnull=False,
            )
            .values("assignmentID__workerID_id")
            .annotate(days=Count("date", distinct=True))
        )

        for row in confirmed_worker_assignment_qs:
            worker_id = row["assignmentID__workerID_id"]
            if worker_id:
                confirmed_days_by_worker[worker_id] = max(
                    confirmed_days_by_worker.get(worker_id, 0),
                    int(row["days"] or 0),
                )

        # Single-day PROJECT compatibility: checkout/client-confirmed attendance
        # should be enough to infer completion even if assignment flags lag.
        completion_signal_qs = DailyAttendance.objects.filter(
            jobID=job,
            status__in=[
                DailyAttendance.AttendanceStatus.PRESENT,
                DailyAttendance.AttendanceStatus.HALF_DAY,
                DailyAttendance.AttendanceStatus.PENDING,
            ],
        ).filter(Q(time_out__isnull=False) | Q(client_confirmed=True))

        completion_by_assignment_qs = (
            completion_signal_qs.filter(assignmentID__isnull=False)
            .values("assignmentID_id")
            .annotate(days=Count("date", distinct=True))
        )
        for row in completion_by_assignment_qs:
            assignment_id = row["assignmentID_id"]
            if assignment_id:
                project_attendance_completion_signal_by_assignment[assignment_id] = max(
                    project_attendance_completion_signal_by_assignment.get(
                        assignment_id, 0
                    ),
                    int(row["days"] or 0),
                )

        completion_by_worker_assignment_qs = (
            completion_signal_qs.filter(assignmentID__isnull=False)
            .values("assignmentID__workerID_id")
            .annotate(days=Count("date", distinct=True))
        )
        for row in completion_by_worker_assignment_qs:
            worker_id = row["assignmentID__workerID_id"]
            if worker_id:
                project_attendance_completion_signal_by_worker[worker_id] = max(
                    project_attendance_completion_signal_by_worker.get(worker_id, 0),
                    int(row["days"] or 0),
                )

        completion_by_worker_direct_qs = (
            completion_signal_qs.filter(workerID__isnull=False)
            .values("workerID_id")
            .annotate(days=Count("date", distinct=True))
        )
        for row in completion_by_worker_direct_qs:
            worker_id = row["workerID_id"]
            if worker_id:
                project_attendance_completion_signal_by_worker[worker_id] = max(
                    project_attendance_completion_signal_by_worker.get(worker_id, 0),
                    int(row["days"] or 0),
                )

    assignments = JobWorkerAssignment.objects.filter(jobID=job)
    for assignment in assignments:
        should_heal = False

        # Legacy/inconsistent signals that imply worker completion.
        if assignment.worker_marked_complete_at is not None:
            should_heal = True
        elif (
            assignment.assignment_status
            == JobWorkerAssignment.AssignmentStatus.COMPLETED
        ):
            should_heal = True
        elif (
            getattr(job, "workerMarkedComplete", False)
            and assignment.client_confirmed_arrival
        ):
            # Historical compatibility: job-level completion was already set and
            # this assignment had already passed client arrival confirmation.
            should_heal = True
        elif payment_model == "PROJECT":
            confirmed_days = max(
                confirmed_days_by_assignment.get(assignment.assignmentID, 0),
                confirmed_days_by_worker.get(
                    getattr(assignment, "workerID_id", None), 0
                ),
            )

            completion_signal_days = max(
                project_attendance_completion_signal_by_assignment.get(
                    assignment.assignmentID, 0
                ),
                project_attendance_completion_signal_by_worker.get(
                    getattr(assignment, "workerID_id", None), 0
                ),
            )

            if (
                confirmed_days >= effective_required_days
                or completion_signal_days >= effective_required_days
            ):
                should_heal = True

        if should_heal and not assignment.worker_marked_complete:
            assignment.worker_marked_complete = True
            if assignment.worker_marked_complete_at is None:
                assignment.worker_marked_complete_at = now
            assignment.save(
                update_fields=[
                    "worker_marked_complete",
                    "worker_marked_complete_at",
                    "updatedAt",
                ]
            )
            healed_count += 1

    return healed_count


def _job_date_window(job) -> tuple:
    """Return (start_date, end_date) where end defaults to start for single-day jobs."""
    start_date = getattr(job, "preferredStartDate", None)
    if not start_date:
        return (None, None)
    end_date = getattr(job, "scheduled_end_date", None) or start_date
    return (start_date, end_date)


def _windows_overlap(start_a, end_a, start_b, end_b) -> bool:
    """Inclusive overlap check between two date windows."""
    if not all([start_a, end_a, start_b, end_b]):
        return False
    return start_a <= end_b and end_a >= start_b


def _shifts_conflict(shift_a, shift_b) -> bool:
    """
    Return True if two shifts conflict (cannot be worked simultaneously).
    Only MORNING + NIGHT is non-conflicting.
    Legacy rows (None) always conflict conservatively.
    """
    if not shift_a or not shift_b:
        return True
    return frozenset([shift_a, shift_b]) != frozenset(["MORNING", "NIGHT"])


def find_worker_schedule_conflict(
    worker_profile: WorkerProfile,
    target_job: Job,
    exclude_job_id: Optional[int] = None,
    applied_shift: Optional[str] = None,
):
    """
    Find a conflicting active assignment for a worker.

    If target job has no schedule, conservatively block on any active assignment.
    If target job has schedule, block on overlapping windows and on active jobs missing dates.
    Multi-shift: MORNING + NIGHT is non-conflicting; pass applied_shift to allow that combo.
    """
    target_start, target_end = _job_date_window(target_job)
    # Effective shift of the incoming job/application
    incoming_shift = applied_shift or getattr(target_job, "shift_type", None)

    direct_jobs = Job.objects.filter(
        assignedWorkerID=worker_profile,
        status__in=[Job.JobStatus.ACTIVE, Job.JobStatus.IN_PROGRESS],
    )
    if exclude_job_id:
        direct_jobs = direct_jobs.exclude(jobID=exclude_job_id)

    team_assignments = JobWorkerAssignment.objects.filter(
        workerID=worker_profile,
        assignment_status="ACTIVE",
        jobID__status__in=[Job.JobStatus.ACTIVE, Job.JobStatus.IN_PROGRESS],
    ).select_related("jobID")
    if exclude_job_id:
        team_assignments = team_assignments.exclude(jobID__jobID=exclude_job_id)

    if not target_start:
        for job in direct_jobs:
            if _shifts_conflict(getattr(job, "shift_type", None), incoming_shift):
                return job
        for ta in team_assignments:
            if _shifts_conflict(getattr(ta, "assigned_shift", None), incoming_shift):
                return ta.jobID
        return None

    for job in direct_jobs:
        if not _shifts_conflict(getattr(job, "shift_type", None), incoming_shift):
            continue  # Non-conflicting shifts — no block
        start_date, end_date = _job_date_window(job)
        if not start_date:
            return job
        if _windows_overlap(start_date, end_date, target_start, target_end):
            return job

    for assignment in team_assignments:
        if not _shifts_conflict(
            getattr(assignment, "assigned_shift", None), incoming_shift
        ):
            continue  # Non-conflicting shifts — no block
        job = assignment.jobID
        start_date, end_date = _job_date_window(job)
        if not start_date:
            return job
        if _windows_overlap(start_date, end_date, target_start, target_end):
            return job

    return None


def calculate_budget_allocation(
    total_budget: Decimal, skill_slots: list, allocation_type: str
) -> list:
    """
    Calculate budget allocation for each skill slot based on allocation type.

    Returns list of dicts: [{'specialization_id': X, 'budget': Y}, ...]
    """
    if not skill_slots:
        return []

    total_workers = sum(slot.get("workers_needed", 1) for slot in skill_slots)

    if allocation_type == "EQUAL_PER_SKILL":
        # Equal budget per skill slot (regardless of worker count)
        per_slot = total_budget / len(skill_slots)
        return [
            {"specialization_id": slot["specialization_id"], "budget": per_slot}
            for slot in skill_slots
        ]

    elif allocation_type == "EQUAL_PER_WORKER":
        # Equal budget per worker (default)
        per_worker = total_budget / total_workers if total_workers > 0 else Decimal("0")
        return [
            {
                "specialization_id": slot["specialization_id"],
                "budget": per_worker * slot.get("workers_needed", 1),
            }
            for slot in skill_slots
        ]

    elif allocation_type == "SKILL_WEIGHTED":
        # Weight by skill level: EXPERT=3x, INTERMEDIATE=2x, ENTRY=1x
        weights = {"EXPERT": 3, "INTERMEDIATE": 2, "ENTRY": 1}
        total_weight = sum(
            weights.get(slot.get("skill_level_required", "ENTRY"), 1)
            * slot.get("workers_needed", 1)
            for slot in skill_slots
        )
        per_weight = total_budget / total_weight if total_weight > 0 else Decimal("0")
        return [
            {
                "specialization_id": slot["specialization_id"],
                "budget": per_weight
                * weights.get(slot.get("skill_level_required", "ENTRY"), 1)
                * slot.get("workers_needed", 1),
            }
            for slot in skill_slots
        ]

    elif allocation_type == "MANUAL_ALLOCATION":
        # Client provides budget per slot (validate total matches)
        return [
            {
                "specialization_id": slot["specialization_id"],
                "budget": Decimal(str(slot.get("budget_allocated", 0))),
            }
            for slot in skill_slots
        ]

    # Default to EQUAL_PER_WORKER
    per_worker = total_budget / total_workers if total_workers > 0 else Decimal("0")
    return [
        {
            "specialization_id": slot["specialization_id"],
            "budget": per_worker * slot.get("workers_needed", 1),
        }
        for slot in skill_slots
    ]


@transaction.atomic
def create_team_job(
    client_profile: Profile,
    title: str,
    description: str,
    location: str,
    total_budget: Decimal,
    skill_slots_data: list,
    allocation_type: str = "EQUAL_PER_WORKER",
    team_start_threshold: float = 100.0,
    urgency: str = "MEDIUM",
    preferred_start_date: Optional[str] = None,
    scheduled_end_date: Optional[str] = None,
    materials_needed: Optional[list] = None,
    payment_method: str = "WALLET",
    payment_model: str = "PROJECT",
    daily_rate: Optional[Decimal] = None,
    duration_days: Optional[int] = None,
    shift_type: str = "ANY",
    job_scope: str = "MODERATE_PROJECT",
    skill_level_required: str = "INTERMEDIATE",
    work_environment: str = "INDOOR",
) -> dict:
    """
    Create a team job with multiple skill slot requirements.

    Returns dict with job details and any payment info needed.
    """
    from datetime import datetime

    # Validate minimum team size requirements
    if not skill_slots_data:
        return {"success": False, "error": "Team jobs require at least 1 skill slot"}

    total_workers = sum(slot.get("workers_needed", 1) for slot in skill_slots_data)
    if total_workers < 2:
        return {"success": False, "error": "Team jobs require at least 2 workers total"}

    # Validate specializations exist
    spec_ids = [slot["specialization_id"] for slot in skill_slots_data]
    existing_specs = Specializations.objects.filter(
        specializationID__in=spec_ids
    ).values_list("specializationID", flat=True)
    missing = set(spec_ids) - set(existing_specs)
    if missing:
        return {"success": False, "error": f"Invalid specialization IDs: {missing}"}

    # Validate agency IDs if provided per-slot
    agency_ids_per_slot = [slot.get("agency_id") for slot in skill_slots_data]
    unique_agency_ids = set(aid for aid in agency_ids_per_slot if aid is not None)

    agency_invite_counts = {}
    for agency_id in agency_ids_per_slot:
        if agency_id is None:
            continue
        agency_invite_counts[agency_id] = agency_invite_counts.get(agency_id, 0) + 1

    duplicate_agency_id = next(
        (agency_id for agency_id, count in agency_invite_counts.items() if count > 1),
        None,
    )
    if duplicate_agency_id is not None:
        return {
            "success": False,
            "error": (
                "The same agency cannot be invited to multiple slots in one team job. "
                "Use the Invite Agency flow instead."
            ),
            "error_code": "DUPLICATE_AGENCY_SLOT_INVITE",
            "agency_id": duplicate_agency_id,
        }

    agencies_by_id = {}
    if unique_agency_ids:
        from accounts.models import Agency

        agencies_by_id = {
            a.agencyId: a for a in Agency.objects.filter(agencyId__in=unique_agency_ids)
        }
        missing_agencies = unique_agency_ids - set(agencies_by_id.keys())
        if missing_agencies:
            return {
                "success": False,
                "error": f"Invalid agency IDs: {missing_agencies}",
            }

    payment_model_upper = str(payment_model or "PROJECT").upper()
    if payment_model_upper not in ["PROJECT", "DAILY"]:
        return {
            "success": False,
            "error": "Invalid payment_model. Choose PROJECT or DAILY",
        }

    # Normalize shift_type; PROJECT jobs always use ANY
    shift_type_upper = str(shift_type or "ANY").upper()
    if payment_model_upper == "PROJECT":
        shift_type_upper = "ANY"
    elif shift_type_upper not in ["ANY", "MORNING", "NIGHT"]:
        return {
            "success": False,
            "error": "Invalid shift_type. Choose ANY, MORNING, or NIGHT",
        }

    payment_method_upper = str(payment_method or "WALLET").upper()
    if payment_method_upper != "WALLET":
        return {
            "success": False,
            "error": "Team job creation currently supports WALLET payment only",
        }

    effective_total_budget = Decimal(str(total_budget))
    effective_daily_rate: Optional[Decimal] = None
    effective_duration_days: Optional[int] = None

    if payment_model_upper == "DAILY":
        if daily_rate is None or duration_days is None:
            return {
                "success": False,
                "error": "daily_rate and duration_days are required for DAILY team jobs",
            }

        effective_daily_rate = Decimal(str(daily_rate))
        effective_duration_days = int(duration_days)
        if effective_daily_rate <= 0 or effective_duration_days <= 0:
            return {
                "success": False,
                "error": "daily_rate and duration_days must be positive",
            }

        # DAILY team budget is derived from rate/day per worker.
        effective_total_budget = (
            effective_daily_rate
            * Decimal(str(effective_duration_days))
            * Decimal(str(total_workers))
        )

    fallback_slots = _build_agency_fallback_slots(
        skill_slots_data=skill_slots_data,
        payment_model=payment_model_upper,
    )
    if fallback_slots:
        return {
            "success": False,
            "error": (
                "No qualified freelance workers are currently available for one or "
                "more required slots. Please invite agency teams for those slots."
            ),
            "requires_agency_fallback": True,
            "fallback_slots": fallback_slots,
        }

    # Calculate budget allocation
    budget_allocations = calculate_budget_allocation(
        effective_total_budget, skill_slots_data, allocation_type
    )

    # Validate manual allocation totals match
    if allocation_type == "MANUAL_ALLOCATION":
        allocated_sum = sum(alloc["budget"] for alloc in budget_allocations)
        if abs(allocated_sum - effective_total_budget) > Decimal(
            "1"
        ):  # Allow ₱1 variance
            return {
                "success": False,
                "error": f"Manual allocation total (₱{allocated_sum}) does not match total budget (₱{effective_total_budget})",
            }

    # Get client's base profile
    client_profile_obj = (
        client_profile
        if isinstance(client_profile, Profile)
        else Profile.objects.get(profileID=client_profile)
    )

    # Ensure only CLIENT profiles can create team jobs
    if client_profile_obj.profileType != "CLIENT":
        return {
            "success": False,
            "error": f"Only clients can create team jobs. Your profile type is: {client_profile_obj.profileType}",
        }

    # Get or create ClientProfile to prevent false negatives for valid client accounts
    client_profile_record, _ = ClientProfile.objects.get_or_create(
        profileID=client_profile_obj,
        defaults={
            "description": "",
            "totalJobsPosted": 0,
            "clientRating": 0,
            "activeJobsCount": 0,
        },
    )

    # Check wallet balance for escrow + platform fee
    # PROJECT: 50% escrow; DAILY: 100% escrow upfront
    escrow_amount = (
        effective_total_budget
        if payment_model_upper == "DAILY"
        else effective_total_budget * Decimal("0.5")
    )
    platform_fee = (
        effective_total_budget * settings.PLATFORM_FEE_RATE
    )  # 10% of total budget
    total_needed = escrow_amount + platform_fee
    wallet = None

    if payment_method_upper == "WALLET":
        try:
            wallet = Wallet.objects.select_for_update().get(
                accountFK=client_profile_obj.accountFK
            )
            # The wallet save will both decrease balance by total_needed AND
            # increase reservedBalance by escrow_amount. The DB constraint
            # requires balance >= reservedBalance at all times, so we must verify:
            #   (wallet.balance - total_needed) >= (wallet.reservedBalance + escrow_amount)
            # A simpler check (availableBalance >= total_needed) is NOT sufficient when
            # the client already has funds locked in other active job escrows.
            post_save_balance = wallet.balance - total_needed
            post_save_reserved = wallet.reservedBalance + escrow_amount
            if post_save_balance < post_save_reserved:
                shortfall = post_save_reserved - post_save_balance
                return {
                    "success": False,
                    "error": (
                        f"Not enough free funds to post this team job. "
                        f"You need ₱{total_needed:.2f} (₱{escrow_amount:.2f} escrow + ₱{platform_fee:.2f} platform fee), "
                        f"but ₱{wallet.reservedBalance:.2f} of your wallet is already locked in other active job escrows. "
                        f"Please deposit at least ₱{shortfall:.2f} more to proceed, or wait for an active job to complete."
                    ),
                    "requires_deposit": True,
                    "amount_needed": float(shortfall),
                }
        except Wallet.DoesNotExist:
            return {"success": False, "error": "Wallet not found"}

    try:
        preferred_start_date_obj = (
            datetime.strptime(preferred_start_date, "%Y-%m-%d").date()
            if preferred_start_date
            else None
        )
    except ValueError:
        return {
            "success": False,
            "error": "Invalid preferred_start_date format. Use YYYY-MM-DD",
        }

    try:
        scheduled_end_date_obj = (
            datetime.strptime(scheduled_end_date, "%Y-%m-%d").date()
            if scheduled_end_date
            else preferred_start_date_obj
        )
    except ValueError:
        return {
            "success": False,
            "error": "Invalid scheduled_end_date format. Use YYYY-MM-DD",
        }

    if (
        preferred_start_date_obj
        and scheduled_end_date_obj
        and scheduled_end_date_obj < preferred_start_date_obj
    ):
        return {
            "success": False,
            "error": "scheduled_end_date cannot be earlier than preferred_start_date",
        }

    # Determine if this is a hybrid team job (has agency invites on any slot)
    has_agency_invites = (
        bool(unique_agency_ids) if "unique_agency_ids" in dir() else False
    )
    # For hybrid team jobs with a single agency, set assignedAgencyFK for backward compat.
    # If multiple agencies are invited to different slots, assignedAgencyFK = first agency.
    primary_agency = None
    if has_agency_invites:
        primary_agency = next(iter(agencies_by_id.values()))

    # Create the job
    job = Job.objects.create(
        clientID=client_profile_record,
        title=title,
        description=description,
        location=location,
        budget=effective_total_budget,
        escrowAmount=escrow_amount,
        remainingPayment=Decimal("0.00")
        if payment_model_upper == "DAILY"
        else (effective_total_budget * Decimal("0.5")),
        urgency=urgency,
        preferredStartDate=preferred_start_date_obj,
        scheduled_end_date=scheduled_end_date_obj,
        materialsNeeded=materials_needed or [],
        jobType="INVITE" if has_agency_invites else "LISTING",
        status="ACTIVE",
        is_team_job=True,
        assignedAgencyFK=primary_agency,
        inviteStatus="PENDING" if has_agency_invites else None,
        payment_model=payment_model_upper,
        daily_rate_agreed=float(effective_daily_rate)
        if payment_model_upper == "DAILY" and effective_daily_rate is not None
        else None,
        duration_days=effective_duration_days
        if payment_model_upper == "DAILY"
        else (
            max(1, (scheduled_end_date_obj - preferred_start_date_obj).days + 1)
            if preferred_start_date_obj
            and scheduled_end_date_obj
            and scheduled_end_date_obj >= preferred_start_date_obj
            else (
                int(duration_days) if duration_days and int(duration_days) > 0 else None
            )
        ),
        shift_type=shift_type_upper,
        budget_allocation_type=allocation_type,
        team_job_start_threshold=Decimal(str(team_start_threshold)),
        job_scope=job_scope,
        skill_level_required=skill_level_required,
        work_environment=work_environment,
        # Defensive initialization for worker timeline markers
        workerMarkedOnTheWay=False,
        workerMarkedOnTheWayAt=None,
        workerMarkedJobStarted=False,
        workerMarkedJobStartedAt=None,
    )

    # Create skill slots
    created_slots = []
    for i, slot_data in enumerate(skill_slots_data):
        agency_id = slot_data.get("agency_id")
        invited_agency = agencies_by_id.get(agency_id) if agency_id else None
        slot = JobSkillSlot.objects.create(
            jobID=job,
            specializationID_id=slot_data["specialization_id"],
            workers_needed=slot_data.get("workers_needed", 1),
            budget_allocated=budget_allocations[i]["budget"],
            skill_level_required=slot_data.get("skill_level_required", "ENTRY"),
            notes=slot_data.get("notes"),
            status="OPEN",
            invited_agency=invited_agency,
            agency_invite_status="PENDING" if invited_agency else None,
        )
        created_slots.append(slot)

    # Send notifications to invited agencies
    if has_agency_invites:
        # Group slots by agency for consolidated notifications
        slots_by_agency = {}
        for slot in created_slots:
            if slot.invited_agency:
                agency = slot.invited_agency
                if agency.agencyId not in slots_by_agency:
                    slots_by_agency[agency.agencyId] = {"agency": agency, "slots": []}
                slots_by_agency[agency.agencyId]["slots"].append(slot)

        for agency_id, info in slots_by_agency.items():
            agency = info["agency"]
            slot_names = [s.specializationID.specializationName for s in info["slots"]]
            total_workers = sum(s.workers_needed for s in info["slots"])
            Notification.objects.create(
                accountFK=agency.accountFK,
                notificationType="TEAM_JOB_SLOT_INVITE",
                title=f"Team Job Invitation: {title}",
                message=(
                    f"You've been invited to fill {len(info['slots'])} slot(s) "
                    f"({', '.join(slot_names)}) requiring {total_workers} worker(s) "
                    f"on team job '{title}'."
                ),
                relatedJobID=job.jobID,
            )

    # Handle payment (if wallet)
    if payment_method_upper == "WALLET":
        # Deduct from wallet
        if wallet is None:
            return {"success": False, "error": "Wallet not found"}

        # Re-verify the constraint-safe condition right before saving.
        # (wallet object is the same select_for_update instance; no concurrent
        # modification is possible within this atomic transaction.)
        post_save_balance = wallet.balance - total_needed
        post_save_reserved = wallet.reservedBalance + escrow_amount
        if post_save_balance < post_save_reserved:
            shortfall = post_save_reserved - post_save_balance
            return {
                "success": False,
                "error": (
                    f"Not enough free funds to post this team job. "
                    f"You need ₱{total_needed:.2f} (₱{escrow_amount:.2f} escrow + ₱{platform_fee:.2f} platform fee), "
                    f"but ₱{wallet.reservedBalance:.2f} of your wallet is already locked in other active job escrows. "
                    f"Please deposit at least ₱{shortfall:.2f} more to proceed, or wait for an active job to complete."
                ),
                "requires_deposit": True,
                "amount_needed": float(shortfall),
            }

        wallet.balance -= total_needed
        wallet.reservedBalance += escrow_amount  # Hold escrow
        try:
            wallet.save(update_fields=["balance", "reservedBalance", "updatedAt"])
        except IntegrityError:
            # Fallback: should not reach here after the pre-check above, but guard anyway.
            return {
                "success": False,
                "error": (
                    "Unable to reserve wallet funds due to an escrow balance conflict. "
                    "This usually means another active job is holding funds in your wallet. "
                    "Please deposit more funds or wait for an active job to complete."
                ),
            }

        # Escrow principal is now collected from wallet.
        if not job.escrowPaid:
            job.escrowPaid = True
            job.escrowPaidAt = timezone.now()
            job.save(update_fields=["escrowPaid", "escrowPaidAt", "updatedAt"])

        # Create transaction record
        Transaction.objects.create(
            walletID=wallet,
            relatedJobPosting=job,
            transactionType="PAYMENT",
            amount=escrow_amount,
            balanceAfter=wallet.balance,
            status="COMPLETED",
            description=(
                f"Team job escrow ({'100%' if payment_model_upper == 'DAILY' else '50%'}) for: {title} "
                f"(Platform fee: ₱{platform_fee})"
            ),
        )

    if (
        payment_model_upper == "DAILY"
        and effective_daily_rate is not None
        and effective_duration_days is not None
    ):
        from jobs.daily_payment_service import DailyPaymentService

        DailyPaymentService.create_daily_job(
            job=job,
            daily_rate=effective_daily_rate,
            duration_days=effective_duration_days,
            num_workers=total_workers,
        )

    # NOTE: Conversation is NOT created here. It will be created automatically
    # when all skill slots are filled (in accept_team_application) or when the
    # client force-starts the job (in start_team_job).

    return {
        "success": True,
        "job_id": job.jobID,
        "skill_slots_created": len(created_slots),
        "total_workers_needed": total_workers,
        "payment_model": payment_model_upper,
        "total_budget": float(effective_total_budget),
        "escrow_amount": float(escrow_amount),
        "platform_fee": float(platform_fee),
        "has_agency_invites": has_agency_invites,
        "agencies_invited": len(unique_agency_ids) if has_agency_invites else 0,
        "message": f"Team job created with {len(created_slots)} skill slots requiring {total_workers} workers",
    }


def get_team_job_detail(job_id: int, requesting_user=None) -> dict:
    """
    Get full team job details including skill slots, worker assignments,
    and agency employee assignments (for mixed team jobs).
    """
    try:
        job = (
            Job.objects.select_related("clientID__profileID")
            .prefetch_related(
                "skill_slots__specializationID",
                "skill_slots__invited_agency",
                "skill_slots__worker_assignments__workerID__profileID",
                "skill_slots__employee_slot_assignments__employee",
                "worker_assignments__workerID__profileID",
                "worker_assignments__skillSlotID__specializationID",
            )
            .get(jobID=job_id)
        )
    except Job.DoesNotExist:
        return {"error": "Job not found"}

    if not job.is_team_job:
        return {"error": "Not a team job"}

    # Build skill slots detail
    skill_slots = []
    for slot in job.skill_slots.all():
        worker_count = slot.worker_assignments.filter(
            assignment_status__in=["ACTIVE", "COMPLETED"]
        ).count()

        employee_count = slot.employee_slot_assignments.filter(
            status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"]
        ).count()

        assigned_count = worker_count + employee_count

        specialization_name = (
            slot.specializationID.specializationName
            if slot.specializationID
            else "Unknown Skill"
        )

        # Agency invite info for this slot
        agency_info = None
        if slot.invited_agency:
            agency_info = {
                "agency_id": slot.invited_agency.agencyId,
                "agency_name": slot.invited_agency.businessName,
                "invite_status": slot.agency_invite_status,
                "invite_responded_at": slot.agency_invite_responded_at.isoformat()
                if slot.agency_invite_responded_at
                else None,
            }

        # Employee assignments for this slot
        slot_employees = []
        for emp_assign in slot.employee_slot_assignments.filter(
            status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"]
        ):
            slot_employees.append(
                {
                    "assignment_id": emp_assign.assignmentID,
                    "employee_id": emp_assign.employee.employeeID,
                    "employee_name": emp_assign.employee.name,
                    "status": emp_assign.status,
                    "dispatched": emp_assign.dispatched,
                    "client_confirmed_arrival": emp_assign.clientConfirmedArrival,
                    "agency_marked_complete": emp_assign.agencyMarkedComplete,
                    "client_approved": emp_assign.clientApproved,
                    "is_primary_contact": emp_assign.isPrimaryContact,
                    "assigned_at": emp_assign.assignedAt.isoformat(),
                }
            )

        skill_slots.append(
            {
                "skill_slot_id": slot.skillSlotID,
                "specialization_id": slot.specializationID_id,
                "specialization_name": specialization_name,
                "workers_needed": slot.workers_needed,
                "workers_assigned": assigned_count,
                "freelancers_assigned": worker_count,
                "employees_assigned": employee_count,
                "openings_remaining": max(0, slot.workers_needed - assigned_count),
                "budget_allocated": float(slot.budget_allocated),
                "budget_per_worker": float(slot.budget_allocated / slot.workers_needed)
                if slot.workers_needed > 0
                else 0,
                "skill_level_required": slot.skill_level_required,
                "status": slot.status,
                "notes": slot.notes,
                "agency_invite": agency_info,
                "employee_assignments": slot_employees,
            }
        )

    # Build freelance worker assignments detail
    worker_assignments = []
    for assignment in job.worker_assignments.all():
        worker = assignment.workerID
        profile = worker.profileID
        skill_slot = assignment.skillSlotID
        specialization = skill_slot.specializationID if skill_slot else None
        specialization_name = (
            specialization.specializationName if specialization else "Unknown Skill"
        )

        worker_assignments.append(
            {
                "assignment_id": assignment.assignmentID,
                "worker_id": worker.id,  # Use .id (primary key), not .workerID
                "worker_name": f"{profile.firstName} {profile.lastName}",
                "worker_avatar": profile.profileImg
                or None,  # profileImg is a CharField (URL string), not FileField
                "worker_rating": float(worker.workerRating)
                if worker.workerRating
                else None,  # workerRating, not rating
                "skill_slot_id": assignment.skillSlotID_id,
                "specialization_name": specialization_name,
                "slot_position": assignment.slot_position,
                "assignment_status": assignment.assignment_status,
                "assigned_at": assignment.assignedAt.isoformat(),
                "worker_marked_complete": assignment.worker_marked_complete,
                "individual_rating": float(assignment.individual_rating)
                if assignment.individual_rating
                else None,
                "type": "freelance",
                # Early completion fields (DAILY team jobs)
                "early_completed": getattr(assignment, "early_completed", False),
                "early_completed_at": assignment.early_completed_at.isoformat()
                if getattr(assignment, "early_completed_at", None)
                else None,
                "early_completion_payout": float(assignment.early_completion_payout)
                if getattr(assignment, "early_completion_payout", None)
                else None,
            }
        )

    # Build agency employee assignments detail (across all slots)
    employee_assignments_list = list(
        JobEmployeeAssignment.objects.filter(
            job=job,
            skill_slot__isnull=False,
            status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
        ).select_related("employee", "skill_slot__specializationID")
    )

    agency_employee_assignments = []
    for emp_assign in employee_assignments_list:
        slot = emp_assign.skill_slot
        specialization = slot.specializationID if slot else None
        specialization_name = (
            specialization.specializationName if specialization else "Unknown Skill"
        )

        agency_employee_assignments.append(
            {
                "assignment_id": emp_assign.assignmentID,
                "employee_id": emp_assign.employee.employeeID,
                "employee_name": emp_assign.employee.name,
                "skill_slot_id": slot.skillSlotID if slot else None,
                "specialization_name": specialization_name,
                "status": emp_assign.status,
                "dispatched": emp_assign.dispatched,
                "client_confirmed_arrival": emp_assign.clientConfirmedArrival,
                "agency_marked_complete": emp_assign.agencyMarkedComplete,
                "client_approved": emp_assign.clientApproved,
                "is_primary_contact": emp_assign.isPrimaryContact,
                "assigned_at": emp_assign.assignedAt.isoformat(),
                "type": "agency_employee",
            }
        )

    # Calculate totals (both workers and employees)
    total_needed = sum(slot["workers_needed"] for slot in skill_slots)
    total_assigned = sum(slot["workers_assigned"] for slot in skill_slots)
    fill_percentage = (
        round((total_assigned / total_needed * 100), 2) if total_needed > 0 else 0
    )

    # Determine if this is a mixed team (has both freelancers and agency employees)
    has_freelancers = len(worker_assignments) > 0
    has_agency_employees = len(agency_employee_assignments) > 0
    is_mixed_team = has_freelancers and has_agency_employees

    # Identify multi-slot workers (workers assigned to more than one slot)
    worker_slot_counts = {}
    for wa in worker_assignments:
        wid = wa["worker_id"]
        worker_slot_counts[wid] = worker_slot_counts.get(wid, 0) + 1
    multi_slot_workers = [wid for wid, count in worker_slot_counts.items() if count > 1]

    client_profile = job.clientID.profileID if job.clientID else None

    return {
        "job_id": job.jobID,
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "total_budget": float(job.budget),
        "status": job.status,
        "is_team_job": True,
        "is_mixed_team": is_mixed_team,
        "has_agency_invites": any(s.get("agency_invite") for s in skill_slots),
        "budget_allocation_type": job.budget_allocation_type,
        "team_start_threshold": float(job.team_job_start_threshold),
        "total_workers_needed": total_needed,
        "total_workers_assigned": total_assigned,
        "total_freelancers": len(worker_assignments),
        "total_agency_employees": len(agency_employee_assignments),
        "multi_slot_workers": multi_slot_workers,
        "team_fill_percentage": fill_percentage,
        "can_start": fill_percentage >= float(job.team_job_start_threshold),
        "skill_slots": skill_slots,
        "worker_assignments": worker_assignments,
        "agency_employee_assignments": agency_employee_assignments,
        "client_id": client_profile.profileID if client_profile else None,
        "client_name": f"{client_profile.firstName} {client_profile.lastName}"
        if client_profile
        else "Unknown",
        "created_at": job.createdAt.isoformat(),
    }


@transaction.atomic
def apply_to_skill_slot(
    worker_profile: WorkerProfile,
    job_id: int,
    skill_slot_id: int,
    proposal_message: str,
    proposed_budget: Decimal,
    budget_option: str = "ACCEPT",
    estimated_duration: Optional[str] = None,
    proposed_daily_rate: Optional[Decimal] = None,
    proposed_days: Optional[int] = None,
    applied_shift: Optional[str] = None,
) -> dict:
    """
    Worker applies to a specific skill slot in a team job.
    """
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {
            "success": False,
            "error": "This is not a team job. Use regular application.",
        }

    if job.status != "ACTIVE":
        return {
            "success": False,
            "error": f"Job is not accepting applications (status: {job.status})",
        }

    # Date-overlap policy parity: workers may handle multiple jobs if schedules do not overlap.
    scheduled_conflict = find_worker_schedule_conflict(
        worker_profile,
        job,
        exclude_job_id=job.jobID,
        applied_shift=applied_shift
        or (job.shift_type if job.shift_type in ("MORNING", "NIGHT") else None),
    )
    if scheduled_conflict:
        conflict_start, conflict_end = _job_date_window(scheduled_conflict)
        if conflict_start:
            message = (
                f"Schedule conflict: you already have '{scheduled_conflict.title}' on overlapping dates "
                f"({conflict_start} - {conflict_end})."
            )
        else:
            message = (
                f"Cannot apply right now: you already have an active assignment '{scheduled_conflict.title}' "
                "with no schedule window set."
            )

        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType="JOB_APPLICATION_BLOCKED",
            title="Application blocked: schedule conflict",
            message=message,
            relatedJobID=scheduled_conflict.jobID,
        )

        return {
            "success": False,
            "error": message,
            "conflicting_job_id": scheduled_conflict.jobID,
            "conflicting_job_title": scheduled_conflict.title,
        }

    try:
        skill_slot = JobSkillSlot.objects.get(skillSlotID=skill_slot_id, jobID=job)
    except JobSkillSlot.DoesNotExist:
        return {"success": False, "error": "Skill slot not found for this job"}

    if skill_slot.status not in ["OPEN", "PARTIALLY_FILLED"]:
        return {
            "success": False,
            "error": f"Skill slot is not accepting applications (status: {skill_slot.status})",
        }

    # Slot-level ownership guard: agency-invited slots are reserved for agency
    # employee assignment and must not accept freelance worker applications.
    if skill_slot.invited_agency_id is not None:
        return {
            "success": False,
            "error": "This slot is reserved for an invited agency and is not open for worker applications.",
            "error_code": "SLOT_RESERVED_FOR_AGENCY",
            "agency_id": skill_slot.invited_agency_id,
        }

    # Enforce required specialization for this slot
    has_required_skill = workerSpecialization.objects.filter(
        workerID=worker_profile, specializationID=skill_slot.specializationID
    ).exists()
    if not has_required_skill:
        return {
            "success": False,
            "error": f"You must add the required skill '{skill_slot.specializationID.specializationName}' before applying to this slot.",
            "required_skill": skill_slot.specializationID.specializationName,
            "required_specialization_id": skill_slot.specializationID.specializationID,
        }

    if (
        budget_option == "NEGOTIATE"
        and skill_slot.specializationID.minimumRate
        and proposed_budget < skill_slot.specializationID.minimumRate
    ):
        minimum_rate = skill_slot.specializationID.minimumRate
        return {
            "success": False,
            "error": (
                f"Proposed budget cannot be less than ₱{minimum_rate:,.2f} "
                f"(DOLE minimum rate for {skill_slot.specializationID.specializationName})."
            ),
            "minimum_rate": float(minimum_rate),
            "category": skill_slot.specializationID.specializationName,
        }

    # Single-row policy per (job, worker, skill_slot): reuse rejected/withdrawn
    # row, block active row, and avoid unique-constraint crashes.
    existing_application = (
        JobApplication.objects.filter(
            jobID=job,
            workerID=worker_profile,
            applied_skill_slot=skill_slot,
        )
        .order_by("-updatedAt", "-createdAt")
        .first()
    )

    if existing_application and existing_application.status in [
        JobApplication.ApplicationStatus.PENDING,
        JobApplication.ApplicationStatus.ACCEPTED,
    ]:
        return {
            "success": False,
            "error": "You have already applied to this skill slot",
        }

    normalized_applied_shift = (
        job.shift_type
        if job.shift_type in ("MORNING", "NIGHT")
        else (applied_shift or None)
    )
    new_negotiation_count = 1 if budget_option == "NEGOTIATE" else 0

    try:
        if existing_application and existing_application.status in [
            JobApplication.ApplicationStatus.REJECTED,
            JobApplication.ApplicationStatus.WITHDRAWN,
        ]:
            application = existing_application
            application.proposalMessage = proposal_message
            application.proposedBudget = proposed_budget
            application.budgetOption = budget_option
            application.estimatedDuration = estimated_duration
            application.proposed_daily_rate = proposed_daily_rate
            application.proposed_days = proposed_days
            application.applied_shift = normalized_applied_shift
            application.status = JobApplication.ApplicationStatus.PENDING
            application.negotiation_count = new_negotiation_count
            application.save(
                update_fields=[
                    "proposalMessage",
                    "proposedBudget",
                    "budgetOption",
                    "estimatedDuration",
                    "proposed_daily_rate",
                    "proposed_days",
                    "applied_shift",
                    "status",
                    "negotiation_count",
                    "updatedAt",
                ]
            )

            # Fresh re-application starts a fresh negotiation cycle.
            PriceNegotiation.objects.filter(application=application).delete()
        else:
            application = JobApplication.objects.create(
                jobID=job,
                workerID=worker_profile,
                applied_skill_slot=skill_slot,
                proposalMessage=proposal_message,
                proposedBudget=proposed_budget,
                budgetOption=budget_option,
                estimatedDuration=estimated_duration,
                proposed_daily_rate=proposed_daily_rate,
                proposed_days=proposed_days,
                status=JobApplication.ApplicationStatus.PENDING,
                applied_shift=normalized_applied_shift,
                negotiation_count=new_negotiation_count,
            )

        if budget_option == "NEGOTIATE":
            PriceNegotiation.objects.create(
                application=application,
                actor=PriceNegotiation.Actor.WORKER,
                round_number=1,
                proposed_budget=proposed_budget,
                proposed_daily_rate=proposed_daily_rate,
                proposed_days=proposed_days,
                message=proposal_message,
                status=PriceNegotiation.NegotiationStatus.PENDING,
            )
    except IntegrityError:
        return {
            "success": False,
            "error": "You already have an application for this skill slot. Please wait for the client response or withdraw first.",
        }

    # Notify client
    client_account = job.clientID.profileID.accountFK if job.clientID else None
    if client_account:
        worker_name = (
            f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
        )
        Notification.objects.create(
            accountFK=client_account,
            notificationType="NEW_TEAM_APPLICATION",
            title=f"New Team Application",
            message=f"{worker_name} applied for {skill_slot.specializationID.specializationName} position in '{job.title}'",
            relatedJobID=job.jobID,
        )

    return {
        "success": True,
        "application_id": application.applicationID,
        "message": f"Applied to {skill_slot.specializationID.specializationName} slot successfully",
    }


@transaction.atomic
def accept_team_application(
    job_id: int,
    application_id: int,
    client_user,
    daily_rate_override: Optional[Decimal] = None,
) -> dict:
    """
    Client accepts a worker's application to a team job skill slot.
    Creates assignment and adds worker to team conversation.
    """
    try:
        application = JobApplication.objects.select_related(
            "jobID", "workerID__profileID", "applied_skill_slot__specializationID"
        ).get(applicationID=application_id, jobID_id=job_id)
    except JobApplication.DoesNotExist:
        return {"success": False, "error": "Application not found"}

    job = application.jobID

    # Verify client owns the job
    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Not authorized to accept applications for this job",
        }

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if application.status != "PENDING":
        return {
            "success": False,
            "error": f"Application is not pending (status: {application.status})",
        }

    # Re-check schedule overlap at accept time to avoid race-condition assignments.
    scheduled_conflict = find_worker_schedule_conflict(
        application.workerID,
        job,
        exclude_job_id=job.jobID,
        applied_shift=getattr(application, "applied_shift", None),
    )
    if scheduled_conflict:
        conflict_start, conflict_end = _job_date_window(scheduled_conflict)
        if conflict_start:
            message = (
                f"Cannot accept application: worker has schedule conflict with '{scheduled_conflict.title}' "
                f"({conflict_start} - {conflict_end})."
            )
        else:
            message = (
                f"Cannot accept application: worker already has an active assignment '{scheduled_conflict.title}' "
                "with no schedule window set."
            )

        return {
            "success": False,
            "error": message,
            "conflicting_job_id": scheduled_conflict.jobID,
            "conflicting_job_title": scheduled_conflict.title,
        }

    # Guard legacy/corrupted rows before dereferencing nested slot relations.
    skill_slot = application.applied_skill_slot
    if not skill_slot:
        return {
            "success": False,
            "error": "Cannot accept application: missing skill slot reference. Ask the worker to re-apply to the correct slot.",
        }

    required_specialization = skill_slot.specializationID
    if not required_specialization:
        return {
            "success": False,
            "error": "Cannot accept application: this slot no longer has a valid specialization.",
        }
    # Enforce required specialization before acceptance (handles older applications)
    worker_has_required_skill = workerSpecialization.objects.filter(
        workerID=application.workerID, specializationID=required_specialization
    ).exists()
    if not worker_has_required_skill:
        worker_name = f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}".strip()
        required_skill = required_specialization.specializationName
        return {
            "success": False,
            "error": f"Cannot accept application: {worker_name} does not have required skill '{required_skill}'.",
            "required_skill": required_skill,
            "required_specialization_id": required_specialization.specializationID,
        }

    # Check if worker is already assigned to THIS SPECIFIC slot
    # (Workers CAN be assigned to multiple different slots on the same job)
    existing_same_slot = JobWorkerAssignment.objects.filter(
        skillSlotID=skill_slot,
        workerID=application.workerID,
        assignment_status__in=["ACTIVE", "COMPLETED"],
    ).exists()

    if existing_same_slot:
        worker_name = f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}"
        application.status = "REJECTED"
        application.save()
        return {
            "success": False,
            "error": f'{worker_name} is already assigned to the "{skill_slot.specializationID.specializationName}" slot on this job. This application has been automatically rejected.',
        }

    # Check if slot has openings
    current_assigned = JobWorkerAssignment.objects.filter(
        skillSlotID=skill_slot, assignment_status__in=["ACTIVE", "COMPLETED"]
    ).count()

    if current_assigned >= skill_slot.workers_needed:
        # Close the slot
        skill_slot.status = "FILLED"
        skill_slot.save()
        return {"success": False, "error": "This skill slot is already full"}

    # Determine slot position
    max_position = (
        JobWorkerAssignment.objects.filter(skillSlotID=skill_slot).aggregate(
            max_pos=Count("slot_position")
        )["max_pos"]
        or 0
    )

    # Determine daily rate for assignment (DAILY payment model jobs)
    assignment_daily_rate = None
    if job.payment_model == "DAILY":
        if daily_rate_override is not None:
            # Client counter-proposed a rate
            assignment_daily_rate = daily_rate_override
        elif application.proposed_daily_rate is not None:
            # Use worker's proposed rate (client accepted it by not overriding)
            assignment_daily_rate = application.proposed_daily_rate
        else:
            # Fall back to job-level daily rate
            assignment_daily_rate = job.daily_rate_agreed

    # Create assignment
    assignment = JobWorkerAssignment.objects.create(
        jobID=job,
        skillSlotID=skill_slot,
        workerID=application.workerID,
        slot_position=max_position + 1,
        assignment_status="ACTIVE",
        daily_rate_at_assignment=assignment_daily_rate,
        assigned_shift=getattr(application, "applied_shift", None),
    )

    # Update application status
    application.status = "ACCEPTED"
    application.save()

    # NOTE: We no longer auto-reject the worker's other pending applications
    # on this job. Workers can now be assigned to multiple skill slots.

    # Update slot status
    new_assigned = current_assigned + 1
    if new_assigned >= skill_slot.workers_needed:
        skill_slot.status = "FILLED"
    else:
        skill_slot.status = "PARTIALLY_FILLED"
    skill_slot.save()

    # Auto-reject remaining pending applications for this slot when it becomes FILLED
    if skill_slot.status == "FILLED":
        slot_pending_apps = (
            JobApplication.objects.filter(
                jobID=job, applied_skill_slot=skill_slot, status="PENDING"
            )
            .exclude(applicationID=application.applicationID)
            .select_related("workerID__profileID__accountFK")
        )

        slot_rejected_count = slot_pending_apps.count()
        if slot_rejected_count > 0:
            for pending_app in slot_pending_apps:
                Notification.objects.create(
                    accountFK=pending_app.workerID.profileID.accountFK,
                    notificationType="APPLICATION_REJECTED",
                    title="Position Filled",
                    message=f"The {skill_slot.specializationID.specializationName} position in '{job.title}' has been filled. Keep applying to find more opportunities!",
                    relatedJobID=job.jobID,
                    relatedApplicationID=pending_app.applicationID,
                )
            slot_pending_apps.update(status="REJECTED")
            print(
                f"📋 Auto-rejected {slot_rejected_count} pending application(s) for filled slot '{skill_slot.specializationID.specializationName}' on job #{job_id}"
            )

    # Add worker to team conversation IF it exists
    # Note: Conversation is created when job STARTS, not when posted
    # This code handles the case where additional workers are accepted AFTER job has started
    # (e.g., force_start with partial team, then fill remaining slots)
    conversation = Conversation.objects.filter(relatedJobPosting=job).first()
    if conversation and conversation.is_team_conversation:
        conversation.add_team_worker(application.workerID.profileID, skill_slot)

    # Notify worker
    worker_name = f"{application.workerID.profileID.firstName}"
    Notification.objects.create(
        accountFK=application.workerID.profileID.accountFK,
        notificationType="TEAM_APPLICATION_ACCEPTED",
        title="Application Accepted!",
        message=f"You've been accepted for {skill_slot.specializationID.specializationName} position in '{job.title}'",
        relatedJobID=job.jobID,
    )

    # Check if job can now start (all slots filled)
    job.refresh_from_db()
    can_start = job.can_start_team_job
    conversation_created = False
    conversation_id = None

    # AUTO-CREATE CONVERSATION when all slots are filled
    if can_start:
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            relatedJobPosting=job
        ).first()
        if not existing_conversation:
            # CRITICAL: Change job status to IN_PROGRESS (like regular jobs)
            job.status = "IN_PROGRESS"
            job.save()

            # Create team conversation
            conversation = Conversation.objects.create(
                client=job.clientID.profileID if job.clientID else None,
                worker=None,  # Team jobs have multiple workers
                relatedJobPosting=job,
                status=Conversation.ConversationStatus.ACTIVE,
                conversation_type="TEAM_GROUP",
            )

            # Add client as participant
            if job.clientID:
                ConversationParticipant.objects.create(
                    conversation=conversation,
                    profile=job.clientID.profileID,
                    participant_type="CLIENT",
                )

            # Add ALL assigned workers as participants
            assignments = JobWorkerAssignment.objects.filter(
                jobID=job, assignment_status="ACTIVE"
            ).select_related("workerID__profileID", "skillSlotID__specializationID")

            for assign in assignments:
                ConversationParticipant.objects.get_or_create(
                    conversation=conversation,
                    profile=assign.workerID.profileID,
                    defaults={
                        "participant_type": "WORKER",
                        "skill_slot": assign.skillSlotID,
                    },
                )

            conversation_created = True
            conversation_id = conversation.conversationID

            # Notify client that team is ready
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType="TEAM_JOB_READY",
                title="Team Ready!",
                message=f"All positions for '{job.title}' have been filled. You can now confirm worker arrivals!",
                relatedJobID=job.jobID,
            )

            # Notify all workers that team is complete (deduplicate for multi-slot workers)
            notified_worker_ids = set()
            for assign in assignments:
                worker_account_pk = assign.workerID.profileID.accountFK_id
                if worker_account_pk not in notified_worker_ids:
                    notified_worker_ids.add(worker_account_pk)
                    Notification.objects.create(
                        accountFK=assign.workerID.profileID.accountFK,
                        notificationType="TEAM_JOB_READY",
                        title="Team Complete!",
                        message=f"The team for '{job.title}' is now complete. Please coordinate with the client for work start.",
                        relatedJobID=job.jobID,
                    )
        else:
            conversation_id = existing_conversation.conversationID

        # AUTO-REJECT all remaining pending applications for this job (all slots now filled)
        remaining_pending = JobApplication.objects.filter(
            jobID=job, status="PENDING"
        ).select_related("workerID__profileID__accountFK")

        remaining_rejected_count = remaining_pending.count()
        if remaining_rejected_count > 0:
            for pending_app in remaining_pending:
                Notification.objects.create(
                    accountFK=pending_app.workerID.profileID.accountFK,
                    notificationType="APPLICATION_REJECTED",
                    title="All Positions Filled",
                    message=f"All positions for '{job.title}' have been filled. Keep applying to find more opportunities!",
                    relatedJobID=job.jobID,
                    relatedApplicationID=pending_app.applicationID,
                )
            remaining_pending.update(status="REJECTED")
            print(
                f"📋 Auto-rejected {remaining_rejected_count} remaining pending application(s) for fully-staffed job #{job_id}"
            )

        # CROSS-JOB AUTO-REJECTION: Reject accepted workers' pending apps on OTHER jobs
        # Team workers can only work one job at a time
        # Deduplicate by worker to avoid processing the same worker multiple times
        # (a multi-slot worker may have multiple assignments on this job)
        all_assignments = JobWorkerAssignment.objects.filter(
            jobID=job, assignment_status="ACTIVE"
        ).select_related("workerID__profileID__accountFK")

        processed_worker_ids = set()
        for assign in all_assignments:
            worker_pk = assign.workerID_id
            if worker_pk in processed_worker_ids:
                continue
            processed_worker_ids.add(worker_pk)
            cross_job_apps = (
                JobApplication.objects.filter(
                    workerID=assign.workerID, status="PENDING"
                )
                .exclude(jobID=job)
                .select_related("jobID__clientID__profileID__accountFK")
            )

            cross_count = cross_job_apps.count()
            if cross_count > 0:
                worker_profile = assign.workerID.profileID
                for cross_app in cross_job_apps:
                    try:
                        Notification.objects.create(
                            accountFK=cross_app.jobID.clientID.profileID.accountFK,
                            notificationType="APPLICATION_REJECTED",
                            title="Worker No Longer Available",
                            message=f"{worker_profile.firstName} {worker_profile.lastName} has been hired for another job and is no longer available for '{cross_app.jobID.title}'.",
                            relatedJobID=cross_app.jobID.jobID,
                            relatedApplicationID=cross_app.applicationID,
                        )
                    except Exception as notify_err:
                        print(
                            f"⚠️ Failed to notify client for cross-job rejection: {notify_err}"
                        )

                cross_job_apps.update(status="REJECTED")

                Notification.objects.create(
                    accountFK=worker_profile.accountFK,
                    notificationType="APPLICATIONS_AUTO_WITHDRAWN",
                    title="Other Applications Withdrawn",
                    message=f"Since you've been hired for '{job.title}', your {cross_count} other pending application{'s' if cross_count > 1 else ''} {'have' if cross_count > 1 else 'has'} been automatically withdrawn.",
                    relatedJobID=job.jobID,
                )
                print(
                    f"🔄 Auto-rejected {cross_count} cross-job pending apps for worker {worker_profile.firstName}"
                )

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "worker_name": f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}",
        "skill_slot": skill_slot.specializationID.specializationName,
        "slot_position": assignment.slot_position,
        "can_start_job": can_start,
        "all_slots_filled": can_start,
        "conversation_created": conversation_created,
        "conversation_id": conversation_id,
        "message": f"Worker assigned to {skill_slot.specializationID.specializationName} position #{assignment.slot_position}"
        + (" - Team is ready!" if can_start else ""),
    }


@transaction.atomic
def reject_team_application(
    job_id: int, application_id: int, client_user, reason: Optional[str] = None
) -> dict:
    """
    Client rejects a worker's application to a team job skill slot.
    """
    try:
        application = JobApplication.objects.select_related(
            "jobID", "workerID__profileID", "applied_skill_slot__specializationID"
        ).get(applicationID=application_id, jobID_id=job_id)
    except JobApplication.DoesNotExist:
        return {"success": False, "error": "Application not found"}

    job = application.jobID

    # Verify client owns the job
    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Not authorized to reject applications for this job",
        }

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if application.status != "PENDING":
        return {
            "success": False,
            "error": f"Application is not pending (status: {application.status})",
        }

    skill_slot = application.applied_skill_slot
    slot_name = (
        skill_slot.specializationID.specializationName if skill_slot else "Unknown"
    )

    # Update application status
    application.status = "REJECTED"
    application.save()

    # Notify worker
    worker_name = f"{application.workerID.profileID.firstName}"
    rejection_message = (
        f"Your application for {slot_name} position in '{job.title}' was not accepted."
    )
    if reason:
        rejection_message += f" Reason: {reason}"

    Notification.objects.create(
        accountFK=application.workerID.profileID.accountFK,
        notificationType="TEAM_APPLICATION_REJECTED",
        title="Application Not Accepted",
        message=rejection_message,
        relatedJobID=job.jobID,
    )

    print(f"❌ Rejected team application #{application_id} for job #{job_id}")

    return {
        "success": True,
        "application_id": application_id,
        "worker_name": f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}",
        "skill_slot": slot_name,
        "message": f"Application rejected for {slot_name} position",
    }


@transaction.atomic
def start_team_job(job_id: int, client_user, force_start: bool = False) -> dict:
    """
    Start a team job when threshold is met (or force start with Option C - partial team).
    """
    try:
        job = Job.objects.select_related("clientID__profileID").get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "Not a team job"}

    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {"success": False, "error": "Not authorized"}

    if job.status != "ACTIVE":
        return {
            "success": False,
            "error": f"Job cannot be started (status: {job.status})",
        }

    fill_percentage = job.team_fill_percentage
    threshold = float(job.team_job_start_threshold)

    if not force_start and fill_percentage < threshold:
        return {
            "success": False,
            "error": f"Team is only {fill_percentage}% filled. Need {threshold}% to start.",
            "fill_percentage": fill_percentage,
            "threshold": threshold,
            "can_force_start": fill_percentage
            > 0,  # Can force start if at least 1 worker
        }

    if fill_percentage == 0:
        return {"success": False, "error": "Cannot start with no workers assigned"}

    # Update job status
    job.status = "IN_PROGRESS"
    job.save()

    # Close all skill slots (no more applications)
    job.skill_slots.update(status="CLOSED")

    # Get all assigned freelance workers
    assignments = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE"
    ).select_related("workerID__profileID", "skillSlotID")

    # Get all assigned agency employees (on team slots)
    employee_assignments = JobEmployeeAssignment.objects.filter(
        job=job,
        status__in=["ASSIGNED", "IN_PROGRESS"],
        skill_slot__isnull=False,
    ).select_related("employee__agency", "skill_slot")

    # Create team group conversation NOW (when job starts, not when posted)
    # This follows single-job pattern where conversation is created at work start
    from profiles.models import Message

    client_profile = job.clientID.profileID
    conversation, _ = Conversation.create_team_conversation(
        job_posting=job, client_profile=client_profile
    )

    # Collect worker names and add them to conversation
    # Deduplicate: a multi-slot worker should appear once in conversation and member list
    member_names = []
    seen_worker_profile_ids = set()
    for assignment in assignments:
        worker_profile = assignment.workerID.profileID
        if worker_profile.profileID not in seen_worker_profile_ids:
            seen_worker_profile_ids.add(worker_profile.profileID)
            # Collect all slot names for this worker
            worker_slot_names = [
                a.skillSlotID.specializationID.specializationName
                for a in assignments
                if a.workerID.profileID.profileID == worker_profile.profileID
                and a.skillSlotID
                and a.skillSlotID.specializationID
            ]
            role_label = ", ".join(worker_slot_names) if worker_slot_names else ""
            display_name = f"{worker_profile.firstName} {worker_profile.lastName}"
            if role_label:
                display_name += f" ({role_label})"
            member_names.append(display_name)
            # Add worker to the team conversation (get_or_create handles dedup)
            conversation.add_team_worker(worker_profile, assignment.skillSlotID)

    # Add agency accounts to conversation for their employees on team slots
    # Deduplicate: one conversation participant per agency, not per employee
    added_agency_ids = set()
    for emp_assignment in employee_assignments:
        agency_account = emp_assignment.employee.agency
        if agency_account.pk not in added_agency_ids:
            added_agency_ids.add(agency_account.pk)
            # Get the agency owner's profile to add as participant
            try:
                from accounts.models import Profile as ProfileModel

                agency_profile = ProfileModel.objects.filter(
                    accountFK=agency_account
                ).first()
                if agency_profile:
                    ConversationParticipant.objects.get_or_create(
                        conversation=conversation,
                        profile=agency_profile,
                        defaults={
                            "participant_type": "WORKER",  # Agency acts as worker-side in conversation
                            "skill_slot": emp_assignment.skill_slot,
                        },
                    )
                    # Use agency business name in the member list
                    from accounts.models import Agency

                    agency_obj = Agency.objects.filter(accountFK=agency_account).first()
                    agency_display_name = (
                        agency_obj.businessName
                        if agency_obj
                        else f"{agency_profile.firstName} {agency_profile.lastName}"
                    )
                    member_names.append(f"{agency_display_name} (Agency)")
            except Exception:
                pass  # Don't block job start if conversation participant addition fails

    # Update agency employee assignments to IN_PROGRESS
    employee_assignments.update(status="IN_PROGRESS")

    # Create system message with team member names
    member_list = ", ".join(member_names) if member_names else "the team"
    Message.create_system_message(
        conversation=conversation,
        message_text=f"Team job '{job.title}' has started! Team members: {member_list}. You can all communicate here.",
    )

    # Notify all assigned freelance workers (deduplicate for multi-slot workers)
    notified_worker_account_ids = set()
    for assignment in assignments:
        worker_account = assignment.workerID.profileID.accountFK
        if worker_account.pk not in notified_worker_account_ids:
            notified_worker_account_ids.add(worker_account.pk)
            # Build role list for this worker
            worker_slot_names = [
                a.skillSlotID.specializationID.specializationName
                for a in assignments
                if a.workerID.profileID.accountFK.pk == worker_account.pk
                and a.skillSlotID
                and a.skillSlotID.specializationID
            ]
            role_text = (
                f" Your roles: {', '.join(worker_slot_names)}."
                if len(worker_slot_names) > 1
                else ""
            )
            Notification.objects.create(
                accountFK=worker_account,
                notificationType="TEAM_JOB_STARTED",
                title="Team Job Started!",
                message=f"'{job.title}' has started. Please begin your work.{role_text}",
                relatedJobID=job.jobID,
            )

    # Notify agency accounts about job start
    for agency_account_id in added_agency_ids:
        from accounts.models import Accounts as AccountsModel

        try:
            agency_acct = AccountsModel.objects.get(pk=agency_account_id)
            Notification.objects.create(
                accountFK=agency_acct,
                notificationType="TEAM_JOB_STARTED",
                title="Team Job Started!",
                message=f"'{job.title}' has started. Your assigned employees should begin work.",
                relatedJobID=job.jobID,
            )
        except AccountsModel.DoesNotExist:
            pass

    return {
        "success": True,
        "job_id": job.jobID,
        "status": "IN_PROGRESS",
        "workers_assigned": job.total_workers_assigned,
        "message": f"Team job started with {job.total_workers_assigned} workers",
    }


@transaction.atomic
def worker_complete_team_assignment(
    assignment_id: int, worker_user, notes: Optional[str] = None
) -> dict:
    """
    Worker marks their individual assignment as complete in a team job.
    """
    try:
        assignment = JobWorkerAssignment.objects.select_related(
            "jobID", "workerID__profileID", "skillSlotID__specializationID"
        ).get(assignmentID=assignment_id)
    except JobWorkerAssignment.DoesNotExist:
        return {"success": False, "error": "Assignment not found"}

    # Verify worker owns this assignment
    if assignment.workerID.profileID.accountFK != worker_user:
        return {"success": False, "error": "Not authorized"}

    if assignment.assignment_status != "ACTIVE":
        return {
            "success": False,
            "error": f"Assignment is not active (status: {assignment.assignment_status})",
        }

    existing_completed_at = assignment.worker_marked_complete_at
    if assignment.worker_marked_complete:
        all_complete = not JobWorkerAssignment.objects.filter(
            jobID=assignment.jobID,
            assignment_status="ACTIVE",
            worker_marked_complete=False,
        ).exists()
        return {
            "success": True,
            "already_processed": True,
            "assignment_id": assignment.assignmentID,
            "all_workers_complete": all_complete,
            "message": "Assignment already marked as complete",
            "completed_at": existing_completed_at.isoformat()
            if existing_completed_at
            else None,
        }

    job = assignment.jobID
    if job.status != "IN_PROGRESS":
        return {"success": False, "error": "Job is not in progress"}

    is_daily_job = (
        str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper() == "DAILY"
    )
    if is_daily_job and not assignment.client_confirmed_arrival:
        return {
            "success": False,
            "error": "Client must confirm your arrival before you can mark this assignment complete",
        }

    project_gate_error = _project_multi_day_gate_error(job)
    if project_gate_error:
        return project_gate_error

    # Mark individual completion
    assignment.worker_marked_complete = True
    assignment.worker_marked_complete_at = timezone.now()
    assignment.completion_notes = notes
    assignment.save()

    # Notify client
    if job.clientID:
        worker_name = f"{assignment.workerID.profileID.firstName} {assignment.workerID.profileID.lastName}"
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="TEAM_WORKER_COMPLETE",
            title="Team Member Completed Work",
            message=f"{worker_name} has completed their {assignment.skillSlotID.specializationID.specializationName} work for '{job.title}'",
            relatedJobID=job.jobID,
        )

    # Check if all workers complete
    all_complete = not JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE", worker_marked_complete=False
    ).exists()

    completed_at = assignment.worker_marked_complete_at
    return {
        "success": True,
        "already_processed": False,
        "assignment_id": assignment.assignmentID,
        "all_workers_complete": all_complete,
        "completed_at": completed_at.isoformat() if completed_at else None,
        "message": "Marked your work as complete",
    }


@transaction.atomic
def early_complete_team_worker(job_id: int, assignment_id: int, client_user) -> dict:
    """
    Client marks a specific worker as done early on a DAILY team job.
    The worker receives the full contracted amount: any remaining balance
    (daily_rate × total_planned_days − total_earned) is paid as a lump sum.

    Panelist #2: Per-worker early completion with full pay.
    """
    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    is_daily = (
        str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper() == "DAILY"
    )
    if not is_daily:
        return {
            "success": False,
            "error": "Early completion with full pay is only for DAILY team jobs",
        }

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Job must be IN_PROGRESS. Current status: {job.status}",
        }

    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client can early-complete a worker",
        }

    # Get the specific worker assignment
    try:
        assignment = JobWorkerAssignment.objects.select_related(
            "workerID__profileID__accountFK", "skillSlotID__specializationID"
        ).get(assignmentID=assignment_id, jobID=job)
    except JobWorkerAssignment.DoesNotExist:
        return {"success": False, "error": "Worker assignment not found"}

    if assignment.assignment_status != "ACTIVE":
        return {
            "success": False,
            "error": f"Assignment is not active (status: {assignment.assignment_status})",
        }

    if assignment.early_completed:
        return {
            "success": False,
            "error": "This worker has already been early-completed",
        }

    # Calculate the full contracted amount and remaining payout
    daily_rate = (
        assignment.daily_rate_at_assignment or job.daily_rate_agreed or Decimal("0.00")
    )
    total_planned_days = job.duration_days or 0
    full_contract_amount = daily_rate * Decimal(str(total_planned_days))
    already_earned = assignment.total_earned or Decimal("0.00")
    remaining_payout = full_contract_amount - already_earned

    if remaining_payout < Decimal("0.00"):
        remaining_payout = Decimal("0.00")

    now = timezone.now()
    worker_account = assignment.workerID.profileID.accountFK
    worker_name = f"{assignment.workerID.profileID.firstName} {assignment.workerID.profileID.lastName}"

    # Pay out remaining amount to worker wallet if > 0
    if remaining_payout > Decimal("0.00"):
        worker_wallet, _ = Wallet.objects.select_for_update().get_or_create(
            accountFK=worker_account
        )
        # Use pendingEarnings (7-day buffer, same as regular daily payment)
        worker_wallet.pendingEarnings += remaining_payout
        worker_wallet.save()

        # Update assignment tracking
        assignment.total_earned += remaining_payout

        # Create transaction record
        Transaction.objects.create(
            walletID=worker_wallet,
            transactionType="PENDING_EARNING",
            amount=remaining_payout,
            balanceAfter=worker_wallet.balance,
            status="PENDING",
            description=(
                f"Early completion full-pay payout ({total_planned_days - assignment.days_worked} remaining days) "
                f"- Job #{job.jobID}"
            ),
            relatedJobPosting=job,
            paymentMethod="WALLET",
        )

    # Mark assignment as early-completed
    assignment.early_completed = True
    assignment.early_completed_at = now
    assignment.early_completion_payout = remaining_payout
    assignment.assignment_status = "COMPLETED"
    assignment.worker_marked_complete = True
    assignment.worker_marked_complete_at = now
    assignment.save()

    # Notify worker
    Notification.objects.create(
        accountFK=worker_account,
        notificationType="TEAM_WORKER_COMPLETE",
        title="Early Completion — Full Pay",
        message=(
            f"You've been marked as done early on '{job.title}'. "
            f"Full pay of ₱{float(full_contract_amount):,.2f} "
            f"({total_planned_days} days × ₱{float(daily_rate):,.2f}/day) has been applied."
            + (
                f" ₱{float(remaining_payout):,.2f} added to your pending earnings."
                if remaining_payout > Decimal("0.00")
                else ""
            )
        ),
        relatedJobID=job.jobID,
    )

    # Notify client
    if client_profile:
        Notification.objects.create(
            accountFK=client_profile.profileID.accountFK,
            notificationType="TEAM_WORKER_COMPLETE",
            title="Worker Early-Completed",
            message=(
                f"{worker_name} has been marked as done early on '{job.title}'. "
                f"Full pay of ₱{float(full_contract_amount):,.2f} applied."
            ),
            relatedJobID=job.jobID,
        )

    # Check if ALL active assignments are now done
    all_complete = not JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE"
    ).exists()

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "worker_name": worker_name,
        "daily_rate": float(daily_rate),
        "total_planned_days": total_planned_days,
        "days_worked": assignment.days_worked,
        "already_earned": float(already_earned),
        "remaining_payout": float(remaining_payout),
        "full_contract_amount": float(full_contract_amount),
        "all_workers_complete": all_complete,
        "message": (
            f"{worker_name} early-completed with full pay. "
            f"₱{float(remaining_payout):,.2f} payout for {total_planned_days - assignment.days_worked} remaining days."
        ),
    }


def confirm_team_worker_arrival(job_id: int, assignment_id: int, client_user) -> dict:
    """
    Client confirms a specific team worker has arrived at the job site.
    This matches the regular job workflow where client confirms arrival before work starts.
    """
    from accounts.models import Notification

    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {"success": False, "error": "Only the client can confirm worker arrival"}

    # Get the specific worker assignment
    try:
        assignment = JobWorkerAssignment.objects.get(
            assignmentID=assignment_id, jobID=job
        )
    except JobWorkerAssignment.DoesNotExist:
        return {"success": False, "error": "Worker assignment not found"}

    # Check if already confirmed
    if assignment.client_confirmed_arrival:
        return {
            "success": False,
            "error": f"Worker arrival already confirmed at {assignment.client_confirmed_arrival_at.strftime('%Y-%m-%d %H:%M')}",
        }

    # Mark arrival as confirmed
    assignment.client_confirmed_arrival = True
    assignment.client_confirmed_arrival_at = timezone.now()
    assignment.save()

    # Notify worker
    worker_name = f"{assignment.workerID.profileID.firstName} {assignment.workerID.profileID.lastName}"
    Notification.objects.create(
        accountFK=assignment.workerID.profileID.accountFK,
        notificationType="ARRIVAL_CONFIRMED",
        title="Client Confirmed Your Arrival",
        message=f"Client has confirmed you arrived at the job site for '{job.title}'",
        relatedJobID=job.jobID,
    )

    # Check if all assigned workers have arrived
    total_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE"
    ).count()

    arrived_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE", client_confirmed_arrival=True
    ).count()

    all_arrived = arrived_workers == total_workers

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "worker_name": worker_name,
        "confirmed_at": assignment.client_confirmed_arrival_at.isoformat(),
        "all_workers_arrived": all_arrived,
        "arrived_count": arrived_workers,
        "total_count": total_workers,
        "message": f"Confirmed {worker_name} has arrived",
    }


def client_approve_team_job(
    job_id: int,
    client_user,
    payment_method: Optional[str] = None,
    cash_proof_url: Optional[str] = None,
) -> dict:
    """
    Client approves team job completion. This closes the job and team conversation.
    Requires all workers to have marked their assignments as complete.
    """
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client who posted this job can approve completion",
        }

    # Check job status
    if job.status == "COMPLETED":
        return {"success": False, "error": "Job is already completed"}

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Cannot complete job with status {job.status}",
        }

    is_daily_job = (
        str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper() == "DAILY"
    )

    required_project_days = _get_required_project_days(job)
    payment_model = str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper()

    # Backward-compat detector for PROJECT multi-day flows:
    # some legacy jobs may not have reliable duration metadata, but they still
    # run attendance/day-tracking paths (total_days_worked / qa_day_offset).
    total_days_worked = int(getattr(job, "total_days_worked", 0) or 0)
    qa_day_offset = int(getattr(job, "qa_day_offset", 0) or 0)
    has_project_day_tracking_signals = total_days_worked > 0 or qa_day_offset > 0

    is_project_multiday = payment_model == "PROJECT" and (
        required_project_days > 1 or has_project_day_tracking_signals
    )

    project_gate_error = _project_multi_day_gate_error(job)
    if project_gate_error:
        return project_gate_error

    # Self-heal legacy assignment completion flags before enforcing gate.
    healed_assignments = _self_heal_team_assignment_completion_flags(job)

    # Check if all freelance workers have marked complete
    incomplete_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE", worker_marked_complete=False
    )

    # Check if all agency employees have marked complete (for mixed team jobs)
    incomplete_employees = JobEmployeeAssignment.objects.filter(
        job=job,
        status__in=["ASSIGNED", "IN_PROGRESS"],
        skill_slot__isnull=False,
        agencyMarkedComplete=False,
    )

    unresolved_incomplete_count = 0
    unresolved_incomplete_sample = []

    if incomplete_workers.exists():
        unresolved_incomplete_count += incomplete_workers.count()
        unresolved_incomplete_sample.extend(
            [
                {
                    "assignment_id": a.assignmentID,
                    "worker_id": getattr(a.workerID, "workerProfileID", None),
                    "worker_name": f"{a.workerID.profileID.firstName} {a.workerID.profileID.lastName}".strip(),
                    "client_confirmed_arrival": bool(a.client_confirmed_arrival),
                    "type": "freelance",
                }
                for a in incomplete_workers.select_related("workerID__profileID")[:5]
            ]
        )

    if incomplete_employees.exists():
        unresolved_incomplete_count += incomplete_employees.count()
        unresolved_incomplete_sample.extend(
            [
                {
                    "assignment_id": a.assignmentID,
                    "employee_id": a.employee.employeeID,
                    "employee_name": a.employee.name,
                    "client_confirmed_arrival": bool(a.clientConfirmedArrival),
                    "type": "agency_employee",
                }
                for a in incomplete_employees.select_related("employee")[:5]
            ]
        )

    if unresolved_incomplete_count > 0:
        # Backward-compat parity with single-job PROJECT multi-day finish:
        # once duration gate passes, don't block client completion on stale
        # assignment worker_marked_complete flags.
        if not is_project_multiday:
            return {
                "success": False,
                "error": f"{unresolved_incomplete_count} team member(s) have not yet marked their work as complete",
                "healed_assignments": healed_assignments,
                "incomplete_assignments": unresolved_incomplete_sample,
            }

    payment_method_upper = (payment_method or "WALLET").upper()
    if payment_method_upper not in ["WALLET", "CASH"]:
        return {
            "success": False,
            "error": "Invalid payment method. Choose WALLET or CASH",
        }

    zero_due_daily_completion = False

    # Remaining final payment:
    # - DAILY team jobs: pay remaining per-assignment contracted amounts.
    # - PROJECT team jobs: use legacy remainingPayment + materialsCost.
    if is_daily_job:
        pending_payouts = _calculate_team_daily_remaining_payouts(job)
        payouts_total = sum(pending_payouts.values(), Decimal("0.00"))
        remaining_amount = payouts_total + (job.materialsCost or Decimal("0.00"))
        if remaining_amount <= Decimal("0.00"):
            zero_due_daily_completion = True
    else:
        remaining_amount = (job.remainingPayment or Decimal("0.00")) + (
            job.materialsCost or Decimal("0.00")
        )

    if (
        payment_method_upper == "CASH"
        and not cash_proof_url
        and not zero_due_daily_completion
    ):
        return {
            "success": False,
            "error": "Cash proof image is required for CASH payment",
        }

    if remaining_amount <= 0 and not zero_due_daily_completion:
        return {
            "success": False,
            "error": "No remaining payment is due for this team job",
        }

    # Team jobs must create pending earnings per assigned worker so both
    # auto-release and "Release Payment Now" work for multi-recipient payouts.
    if not is_daily_job:
        if payment_method_upper == "WALLET":
            pending_pool = (job.budget or Decimal("0.00")) + (
                job.materialsCost or Decimal("0.00")
            )
        else:
            # For cash completion, only escrow/downpayment portion is buffered.
            pending_pool = (job.budget or Decimal("0.00")) * Decimal("0.50")

        pending_payouts = _calculate_team_pending_payouts(job, pending_pool)

    if not zero_due_daily_completion and not pending_payouts:
        return {
            "success": False,
            "error": "No assigned team members found to receive payout",
        }

    from jobs.payment_buffer_service import (
        add_pending_earnings,
        get_payment_buffer_days,
    )

    buffer_days = get_payment_buffer_days() if not zero_due_daily_completion else 0

    # Pre-validate wallet balance BEFORE updating job flags.
    # Escrow was already deducted at job creation; only the additional
    # amount beyond escrow requires new funds from the client.
    escrow_held_precheck = job.escrowAmount or Decimal("0.00")
    additional_needed = max(Decimal("0.00"), remaining_amount - escrow_held_precheck)
    if payment_method_upper == "WALLET" and additional_needed > Decimal("0.00"):
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=client_user, defaults={"balance": Decimal("0.00")}
        )
        available_balance = wallet.availableBalance
        if available_balance < additional_needed:
            return {
                "success": False,
                "error": (
                    f"Insufficient wallet balance. You need ₱{additional_needed:,.2f} additional "
                    f"(₱{remaining_amount:,.2f} total minus ₱{escrow_held_precheck:,.2f} escrowed) "
                    f"but only have ₱{available_balance:,.2f} available. "
                    "Please deposit more funds or choose CASH payment."
                ),
            }

    old_status = job.status
    now = timezone.now()

    first_pending_result = None
    with transaction.atomic():
        client_wallet, _ = Wallet.objects.get_or_create(
            accountFK=client_user, defaults={"balance": Decimal("0.00")}
        )

        # ----------------------------------------------------------------
        # Escrow accounting: funds were already deducted from client balance
        # and held in reservedBalance at job creation. Release the escrow
        # first and only charge the client for any amount exceeding it.
        # ----------------------------------------------------------------
        escrow_held = job.escrowAmount or Decimal("0.00")

        if payment_method_upper == "WALLET":
            client_wallet = Wallet.objects.select_for_update().get(
                accountFK=client_user
            )

            # Release escrow from reservedBalance (funds already deducted at creation)
            escrow_release = min(client_wallet.reservedBalance, escrow_held)
            additional_charge = max(Decimal("0.00"), remaining_amount - escrow_release)

            if additional_charge > Decimal("0.00"):
                available_balance = client_wallet.availableBalance
                if available_balance < additional_charge:
                    return {
                        "success": False,
                        "error": (
                            f"Insufficient wallet balance. Need ₱{additional_charge:,.2f} additional "
                            f"(₱{remaining_amount:,.2f} total minus ₱{escrow_release:,.2f} escrowed) "
                            f"but only have ₱{available_balance:,.2f} available. "
                            "Please deposit more funds or choose CASH payment."
                        ),
                    }

            # Release escrow hold and charge only the additional amount
            client_wallet.reservedBalance -= escrow_release
            if additional_charge > Decimal("0.00"):
                client_wallet.balance -= additional_charge
            try:
                client_wallet.save(
                    update_fields=["balance", "reservedBalance", "updatedAt"]
                )
            except IntegrityError:
                return {
                    "success": False,
                    "error": (
                        "Payment could not be completed because wallet funds are reserved by other pending jobs. "
                        "Please retry, deposit more funds, or choose CASH payment."
                    ),
                }

        if remaining_amount > Decimal("0.00"):
            # Only create a transaction for the additional charge beyond escrow
            additional_charge = max(Decimal("0.00"), remaining_amount - escrow_held)
            if additional_charge > Decimal("0.00"):
                Transaction.objects.create(
                    walletID=client_wallet,
                    amount=additional_charge,
                    transactionType="PAYMENT",
                    status="COMPLETED",
                    description=f"Final payment for team job: {job.title}"
                    + (
                        " (cash proof uploaded)"
                        if payment_method_upper == "CASH"
                        else ""
                    ),
                    balanceAfter=client_wallet.balance,
                    relatedJobPosting=job,
                    paymentMethod=payment_method_upper,
                )

            # Determine which accounts are agency accounts for correct recipient_type
            from accounts.models import Agency

            agency_account_ids = set(
                Agency.objects.filter(
                    accountFK__in=[acct for acct in pending_payouts.keys()]
                ).values_list("accountFK_id", flat=True)
            )

            for recipient_account, payout_amount in pending_payouts.items():
                if payout_amount <= 0:
                    continue
                is_agency = recipient_account.pk in agency_account_ids
                pending_result = add_pending_earnings(
                    job=job,
                    recipient_account=recipient_account,
                    amount=payout_amount,
                    recipient_type="agency" if is_agency else "worker",
                )
                if first_pending_result is None:
                    first_pending_result = pending_result

        job.status = "COMPLETED"
        job.clientMarkedComplete = True
        job.clientMarkedCompleteAt = now
        # For team jobs, mark worker complete when client approves (all workers already marked assignments complete)
        job.workerMarkedComplete = True
        job.workerMarkedCompleteAt = now
        job.finalPaymentMethod = payment_method_upper
        job.paymentMethodSelectedAt = now
        job.remainingPaymentPaid = True
        job.remainingPaymentPaidAt = now

        if payment_method_upper == "CASH":
            job.cashPaymentProofUrl = cash_proof_url
            job.cashProofUploadedAt = now

        job.save()

    # NOTE: Keep conversation ACTIVE after approval, consistent with single-job flow.
    # Conversation should only close after both parties submit reviews.

    # Update all active freelance worker assignments to completed state.
    # This mirrors single-job PROJECT multi-day finish behavior where client
    # completion finalizes worker completion flags.
    JobWorkerAssignment.objects.filter(jobID=job, assignment_status="ACTIVE").update(
        assignment_status="COMPLETED",
        worker_marked_complete=True,
        worker_marked_complete_at=now,
    )

    # Update all agency employee assignments on team slots to completed state.
    JobEmployeeAssignment.objects.filter(
        job=job,
        status__in=["ASSIGNED", "IN_PROGRESS"],
        skill_slot__isnull=False,
    ).update(
        status="COMPLETED",
        agencyMarkedComplete=True,
        agencyMarkedCompleteAt=now,
        clientApproved=True,
        clientApprovedAt=now,
    )

    # Create completion log
    from accounts.models import JobLog

    total_team_members = job.total_workers_assigned
    JobLog.objects.create(
        jobID=job,
        notes=f"[{timezone.now().strftime('%Y-%m-%d %I:%M:%S %p')}] Client approved team job completion. All {total_team_members} team members completed their work.",
        changedBy=client_user,
        oldStatus=old_status,
        newStatus="COMPLETED",
    )

    # Notify all freelance workers
    worker_assignments = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="COMPLETED"
    )
    client_name = (
        f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
    )

    for assignment in worker_assignments:
        worker_account = assignment.workerID.profileID.accountFK
        Notification.objects.create(
            accountFK=worker_account,
            notificationType="TEAM_JOB_COMPLETED",
            title=f"Team Job Completed! 🎉",
            message=f"{client_name} has approved the team job '{job.title}'. Payment is being processed.",
            relatedJobID=job.jobID,
        )

    # Notify agency accounts for their employees on this team job
    employee_assignments = JobEmployeeAssignment.objects.filter(
        job=job,
        status="COMPLETED",
        skill_slot__isnull=False,
    ).select_related("employee__agency")

    # Deduplicate agency notifications (one per agency, not per employee)
    notified_agency_ids = set()
    for emp_assignment in employee_assignments:
        agency_account = emp_assignment.employee.agency
        if agency_account.pk not in notified_agency_ids:
            notified_agency_ids.add(agency_account.pk)
            Notification.objects.create(
                accountFK=agency_account,
                notificationType="TEAM_JOB_COMPLETED",
                title=f"Team Job Completed! 🎉",
                message=f"{client_name} has approved the team job '{job.title}'. Payment for your assigned employees is being processed.",
                relatedJobID=job.jobID,
            )

    return {
        "success": True,
        "job_id": job_id,
        "payment_method": payment_method_upper,
        "amount_paid": float(remaining_amount),
        "pending_payout_total": float(payouts_total if is_daily_job else pending_pool),
        "pending_recipients_count": len(pending_payouts),
        "payment_buffer_days": buffer_days,
        "worker_payment_pending": first_pending_result is not None,
        "worker_payment_release_date": first_pending_result["release_date"].isoformat()
        if first_pending_result
        else None,
        "worker_payment_release_date_formatted": first_pending_result[
            "release_date_str"
        ]
        if first_pending_result
        else None,
        "workers_completed": total_team_members,
        "healed_assignments": healed_assignments,
        "message": "Team job completed successfully"
        if remaining_amount > Decimal("0.00")
        else "Team job completed successfully (no remaining payment due)",
        "new_wallet_balance": float(client_wallet.balance)
        if payment_method_upper == "WALLET"
        else None,
    }


# ===========================================================================
# AGENCY TEAM JOB SERVICES - Per-Slot Agency Invite Support
# ===========================================================================


@transaction.atomic
def agency_accept_team_slot_invite(job_id: int, slot_id: int, agency_user) -> dict:
    """
    Agency accepts an invite to fill a specific skill slot in a team job.
    Creates a conversation between client and agency if none exists.
    """
    from accounts.models import Agency, JobLog

    # Get agency
    try:
        agency = Agency.objects.get(accountFK=agency_user)
    except Agency.DoesNotExist:
        return {"success": False, "error": "Agency account not found"}

    # Get job
    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    # Get the specific skill slot
    try:
        slot = JobSkillSlot.objects.select_related("specializationID").get(
            skillSlotID=slot_id, jobID=job
        )
    except JobSkillSlot.DoesNotExist:
        return {"success": False, "error": "Skill slot not found for this job"}

    # Verify this agency was invited to this slot
    if slot.invited_agency != agency:
        return {
            "success": False,
            "error": "Your agency was not invited to fill this slot",
        }

    # Verify invite is still pending
    if slot.agency_invite_status != "PENDING":
        status_text = (
            slot.agency_invite_status.lower()
            if slot.agency_invite_status
            else "processed"
        )
        return {"success": False, "error": f"Invite has already been {status_text}"}

    # Accept the invite
    slot.agency_invite_status = "ACCEPTED"
    slot.agency_invite_responded_at = timezone.now()
    slot.save(
        update_fields=[
            "agency_invite_status",
            "agency_invite_responded_at",
            "updatedAt",
        ]
    )

    # Create or get conversation between client and agency for this job
    conversation = None
    try:
        conversation, created = Conversation.objects.get_or_create(
            relatedJobPosting=job,
            defaults={
                "client": job.clientID.profileID if job.clientID else None,
                "worker": None,
                "agency": agency,
                "status": Conversation.ConversationStatus.ACTIVE,
                "conversation_type": "TEAM_GROUP",
            },
        )
        if not created and not conversation.agency:
            conversation.agency = agency
            conversation.save(update_fields=["agency"])
    except Exception as e:
        print(f"Warning: Failed to create conversation for team slot invite: {e}")

    # Log
    JobLog.objects.create(
        jobID=job,
        notes=f"Agency '{agency.businessName}' accepted invite for slot '{slot.specializationID.specializationName}' ({slot.workers_needed} workers needed)",
        changedBy=agency_user,
        oldStatus=job.status,
        newStatus=job.status,
    )

    # Notify client
    Notification.objects.create(
        accountFK=job.clientID.profileID.accountFK,
        notificationType="TEAM_SLOT_INVITE_ACCEPTED",
        title=f"{agency.businessName} Accepted Slot Invite",
        message=(
            f"{agency.businessName} accepted your invitation for the "
            f"'{slot.specializationID.specializationName}' slot on '{job.title}'. "
            f"They can now assign employees."
        ),
        relatedJobID=job.jobID,
    )

    return {
        "success": True,
        "job_id": job.jobID,
        "slot_id": slot.skillSlotID,
        "specialization": slot.specializationID.specializationName,
        "workers_needed": slot.workers_needed,
        "agency_invite_status": "ACCEPTED",
        "conversation_id": conversation.conversationID if conversation else None,
        "message": f"Accepted invite for {slot.specializationID.specializationName} slot",
    }


@transaction.atomic
def agency_reject_team_slot_invite(
    job_id: int, slot_id: int, agency_user, reason: Optional[str] = None
) -> dict:
    """
    Agency rejects an invite to fill a specific skill slot in a team job.
    The slot becomes open for freelance workers.
    """
    from accounts.models import Agency, JobLog

    # Get agency
    try:
        agency = Agency.objects.get(accountFK=agency_user)
    except Agency.DoesNotExist:
        return {"success": False, "error": "Agency account not found"}

    # Get job
    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    # Get the specific skill slot
    try:
        slot = JobSkillSlot.objects.select_related("specializationID").get(
            skillSlotID=slot_id, jobID=job
        )
    except JobSkillSlot.DoesNotExist:
        return {"success": False, "error": "Skill slot not found for this job"}

    # Verify this agency was invited to this slot
    if slot.invited_agency != agency:
        return {
            "success": False,
            "error": "Your agency was not invited to fill this slot",
        }

    # Verify invite is still pending
    if slot.agency_invite_status != "PENDING":
        status_text = (
            slot.agency_invite_status.lower()
            if slot.agency_invite_status
            else "processed"
        )
        return {"success": False, "error": f"Invite has already been {status_text}"}

    # Reject the invite — slot becomes open for freelance workers.
    # Clear slot-level agency ownership so worker listing/apply logic recognizes
    # this slot as open, while keeping audit trail in JobLog/Notification.
    slot.agency_invite_status = None
    slot.agency_invite_responded_at = timezone.now()
    slot.invited_agency = None
    slot.save(
        update_fields=[
            "invited_agency",
            "agency_invite_status",
            "agency_invite_responded_at",
            "updatedAt",
        ]
    )

    # Log
    JobLog.objects.create(
        jobID=job,
        notes=(
            f"Agency '{agency.businessName}' rejected invite for slot "
            f"'{slot.specializationID.specializationName}'"
            f"{f' — Reason: {reason}' if reason else ''}"
        ),
        changedBy=agency_user,
        oldStatus=job.status,
        newStatus=job.status,
    )

    # Notify client
    Notification.objects.create(
        accountFK=job.clientID.profileID.accountFK,
        notificationType="TEAM_SLOT_INVITE_REJECTED",
        title=f"{agency.businessName} Declined Slot Invite",
        message=(
            f"{agency.businessName} declined your invitation for the "
            f"'{slot.specializationID.specializationName}' slot on '{job.title}'. "
            f"The slot is now open for freelance workers."
            f"{f' Reason: {reason}' if reason else ''}"
        ),
        relatedJobID=job.jobID,
    )

    # Check if all agency invites on this job have been rejected — revert to LISTING
    pending_or_accepted = job.skill_slots.filter(
        invited_agency__isnull=False, agency_invite_status__in=["PENDING", "ACCEPTED"]
    ).exists()
    if not pending_or_accepted:
        # All agency invites rejected — revert to LISTING job type
        job.jobType = "LISTING"
        job.assignedAgencyFK = None
        job.inviteStatus = None
        job.save(update_fields=["jobType", "assignedAgencyFK", "inviteStatus"])

    return {
        "success": True,
        "job_id": job.jobID,
        "slot_id": slot.skillSlotID,
        "specialization": slot.specializationID.specializationName,
        "agency_invite_status": "REJECTED",
        "slot_now_open": True,
        "can_reinvite_agency": True,
        "message": f"Declined invite for {slot.specializationID.specializationName} slot. Slot is now open for freelance workers.",
    }


@transaction.atomic
def agency_assign_employees_to_team_slot(
    job_id: int,
    slot_id: int,
    agency_user,
    employee_ids: list,
    primary_contact_employee_id: Optional[int] = None,
) -> dict:
    """
    Agency assigns employees to a specific skill slot they were invited to in a team job.

    Unlike the existing assign_employees_to_slots() which requires ALL slots to be filled,
    this function handles a single slot at a time (for mixed agency + freelance teams).
    """
    from accounts.models import Agency, JobLog
    from agency.models import AgencyEmployee
    from agency.services import validate_employee_not_working

    # Get agency
    try:
        agency = Agency.objects.get(accountFK=agency_user)
    except Agency.DoesNotExist:
        return {"success": False, "error": "Agency account not found"}

    # Get job
    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if job.status not in ["ACTIVE", "IN_PROGRESS"]:
        return {
            "success": False,
            "error": f"Cannot assign employees to job with status: {job.status}",
        }

    # Get the specific skill slot
    try:
        slot = JobSkillSlot.objects.select_related("specializationID").get(
            skillSlotID=slot_id, jobID=job
        )
    except JobSkillSlot.DoesNotExist:
        return {"success": False, "error": "Skill slot not found for this job"}

    # Verify this agency was invited AND accepted
    if slot.invited_agency != agency:
        return {
            "success": False,
            "error": "Your agency was not invited to fill this slot",
        }
    if slot.agency_invite_status != "ACCEPTED":
        return {
            "success": False,
            "error": "You must accept the slot invite before assigning employees",
        }

    # Validate employee count
    if not employee_ids:
        return {"success": False, "error": "At least one employee ID is required"}

    # Check how many openings remain on this slot (accounting for both workers and employees)
    current_assigned = slot.assigned_count
    openings = slot.workers_needed - current_assigned
    if len(employee_ids) > openings:
        return {
            "success": False,
            "error": (
                f"Slot requires {slot.workers_needed} worker(s), "
                f"{current_assigned} already assigned, "
                f"{openings} opening(s) remaining. "
                f"You are trying to assign {len(employee_ids)} employee(s)."
            ),
        }

    # Validate each employee
    employees = []
    for emp_id in employee_ids:
        try:
            employee = AgencyEmployee.objects.get(employeeID=emp_id, agency=agency_user)
        except AgencyEmployee.DoesNotExist:
            return {
                "success": False,
                "error": f"Employee {emp_id} not found or not in your agency",
            }

        if not employee.isActive:
            return {
                "success": False,
                "error": f"Employee {employee.fullName} is not active",
            }

        # Check schedule conflict
        conflicting_job = validate_employee_not_working(
            employee, exclude_job=job, target_job=job
        )
        if conflicting_job:
            return {
                "success": False,
                "error": f'Employee {employee.fullName} is already working on "{conflicting_job}".',
            }

        # Check employee not already assigned to this job
        existing = JobEmployeeAssignment.objects.filter(
            job=job,
            employee=employee,
            status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
        ).exists()
        if existing:
            return {
                "success": False,
                "error": f"Employee {employee.fullName} is already assigned to this job",
            }

        # Check specialization match
        employee_specs = employee.get_specializations_list()
        required_spec = slot.specializationID.specializationName
        if required_spec not in employee_specs:
            return {
                "success": False,
                "error": (
                    f"Employee {employee.fullName} does not have required specialization: "
                    f"{required_spec}. Employee has: {', '.join(employee_specs) or 'none'}"
                ),
            }

        employees.append(employee)

    # Create assignments
    created_assignments = []
    for employee in employees:
        is_primary = primary_contact_employee_id == employee.employeeID
        assignment = JobEmployeeAssignment.objects.create(
            job=job,
            employee=employee,
            skill_slot=slot,
            assignedBy=agency_user,
            isPrimaryContact=is_primary,
            status="ASSIGNED",
            notes=f"Assigned to {slot.specializationID.specializationName} slot (team job)",
        )
        created_assignments.append(
            {
                "assignment_id": assignment.assignmentID,
                "employee_id": employee.employeeID,
                "employee_name": employee.fullName,
                "is_primary_contact": is_primary,
            }
        )

    # Update slot status
    slot.update_status()

    # Log
    employee_names = ", ".join(e.fullName for e in employees)
    JobLog.objects.create(
        jobID=job,
        notes=(
            f"Agency '{agency.businessName}' assigned {len(employees)} employee(s) "
            f"({employee_names}) to slot '{slot.specializationID.specializationName}'"
        ),
        changedBy=agency_user,
        oldStatus=job.status,
        newStatus=job.status,
    )

    # Set legacy assignedEmployeeID for backward compat (primary contact)
    if primary_contact_employee_id:
        try:
            primary_emp = AgencyEmployee.objects.get(
                employeeID=primary_contact_employee_id
            )
            if not job.assignedEmployeeID:
                job.assignedEmployeeID = primary_emp
                job.save(update_fields=["assignedEmployeeID"])
        except AgencyEmployee.DoesNotExist:
            pass

    # Notify client
    Notification.objects.create(
        accountFK=job.clientID.profileID.accountFK,
        notificationType="TEAM_SLOT_EMPLOYEES_ASSIGNED",
        title=f"Employees Assigned: {slot.specializationID.specializationName}",
        message=(
            f"{agency.businessName} assigned {len(employees)} employee(s) to the "
            f"'{slot.specializationID.specializationName}' slot on '{job.title}'."
        ),
        relatedJobID=job.jobID,
    )

    # Notify assigned employees
    for employee in employees:
        employee_account = getattr(employee, "accountFK", None)
        if employee_account:
            Notification.objects.create(
                accountFK=employee_account,
                notificationType="JOB_ASSIGNED",
                title=f"New Team Job Assignment: {job.title}",
                message=(
                    f'You have been assigned to work on "{job.title}" '
                    f"as {slot.specializationID.specializationName}."
                ),
                relatedJobID=job.jobID,
            )

    # Check if all slots are now filled (auto-start logic)
    can_start = job.can_start_team_job
    job_started = False
    conversation_id = None

    if can_start and job.status == "ACTIVE":
        # Auto-transition to IN_PROGRESS
        start_result = start_team_job(
            job_id=job.jobID,
            client_user=job.clientID.profileID.accountFK,
            force_start=True,
        )
        if start_result.get("success"):
            job_started = True
            conversation_id = start_result.get("conversation_id")

    return {
        "success": True,
        "job_id": job.jobID,
        "slot_id": slot.skillSlotID,
        "specialization": slot.specializationID.specializationName,
        "employees_assigned": len(created_assignments),
        "slot_status": slot.status,
        "assignments": created_assignments,
        "job_started": job_started,
        "can_start_job": can_start,
        "conversation_id": conversation_id,
        "message": (
            f"Assigned {len(employees)} employee(s) to {slot.specializationID.specializationName} slot"
            + (" — Job started!" if job_started else "")
        ),
    }


def confirm_team_employee_arrival(job_id: int, assignment_id: int, client_user) -> dict:
    """
    Client confirms a specific agency employee has arrived at the team job site.
    Parallel to confirm_team_worker_arrival() but for agency employees.
    """
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client can confirm employee arrival",
        }

    # Get the specific employee assignment
    try:
        assignment = JobEmployeeAssignment.objects.select_related(
            "employee", "skill_slot__specializationID"
        ).get(assignmentID=assignment_id, job=job)
    except JobEmployeeAssignment.DoesNotExist:
        return {"success": False, "error": "Employee assignment not found"}

    # Check if already confirmed
    if assignment.clientConfirmedArrival:
        return {
            "success": False,
            "error": f"Employee arrival already confirmed at {assignment.clientConfirmedArrivalAt}",
        }

    # Mark arrival as confirmed
    assignment.clientConfirmedArrival = True
    assignment.clientConfirmedArrivalAt = timezone.now()
    assignment.status = "IN_PROGRESS"
    assignment.save(
        update_fields=["clientConfirmedArrival", "clientConfirmedArrivalAt", "status"]
    )

    employee_name = assignment.employee.fullName

    # Notify agency owner
    agency = job.assignedAgencyFK
    if agency:
        Notification.objects.create(
            accountFK=agency.accountFK,
            notificationType="ARRIVAL_CONFIRMED",
            title="Client Confirmed Employee Arrival",
            message=f"Client confirmed {employee_name} arrived at the job site for '{job.title}'",
            relatedJobID=job.jobID,
        )

    # Notify employee if they have an account
    employee_account = getattr(assignment.employee, "accountFK", None)
    if employee_account:
        Notification.objects.create(
            accountFK=employee_account,
            notificationType="ARRIVAL_CONFIRMED",
            title="Client Confirmed Your Arrival",
            message=f"Client has confirmed you arrived at the job site for '{job.title}'",
            relatedJobID=job.jobID,
        )

    # Check if ALL team members (workers + employees) have arrived
    total_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE"
    ).count()
    arrived_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE", client_confirmed_arrival=True
    ).count()
    total_employees = JobEmployeeAssignment.objects.filter(
        job=job,
        skill_slot__isnull=False,
        status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
    ).count()
    arrived_employees = JobEmployeeAssignment.objects.filter(
        job=job,
        skill_slot__isnull=False,
        clientConfirmedArrival=True,
        status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
    ).count()

    all_arrived = (arrived_workers == total_workers) and (
        arrived_employees == total_employees
    )

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "employee_name": employee_name,
        "confirmed_at": assignment.clientConfirmedArrivalAt.isoformat(),
        "all_team_arrived": all_arrived,
        "arrived_count": arrived_workers + arrived_employees,
        "total_count": total_workers + total_employees,
        "message": f"Confirmed {employee_name} has arrived",
    }


@transaction.atomic
def agency_complete_team_employee(
    job_id: int, assignment_id: int, agency_user, notes: Optional[str] = None
) -> dict:
    """
    Agency marks a specific employee's work as complete on a team job.
    Parallel to worker_complete_team_assignment() but for agency employees.
    """
    from accounts.models import Agency

    # Get agency
    try:
        agency = Agency.objects.get(accountFK=agency_user)
    except Agency.DoesNotExist:
        return {"success": False, "error": "Agency account not found"}

    # Get job
    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Job is not in progress (status: {job.status})",
        }

    # Verify this agency owns the job/slot
    if job.assignedAgencyFK != agency:
        # Also check if this specific slot was invited to this agency
        slot_match = JobEmployeeAssignment.objects.filter(
            assignmentID=assignment_id, job=job, skill_slot__invited_agency=agency
        ).exists()
        if not slot_match:
            return {
                "success": False,
                "error": "Not authorized — assignment does not belong to your agency",
            }

    # Get the specific employee assignment
    try:
        assignment = JobEmployeeAssignment.objects.select_related(
            "employee", "skill_slot__specializationID"
        ).get(assignmentID=assignment_id, job=job)
    except JobEmployeeAssignment.DoesNotExist:
        return {"success": False, "error": "Employee assignment not found"}

    # Check if already marked complete
    if assignment.agencyMarkedComplete:
        return {
            "success": False,
            "error": f"Employee work already marked complete at {assignment.agencyMarkedCompleteAt}",
        }

    # Mark complete
    assignment.agencyMarkedComplete = True
    assignment.agencyMarkedCompleteAt = timezone.now()
    assignment.employeeMarkedComplete = True
    assignment.employeeMarkedCompleteAt = timezone.now()
    assignment.completionNotes = notes or ""
    assignment.status = "COMPLETED"
    assignment.save()

    employee_name = assignment.employee.fullName

    # Notify client
    Notification.objects.create(
        accountFK=job.clientID.profileID.accountFK,
        notificationType="TEAM_EMPLOYEE_COMPLETED",
        title=f"Employee Completed Work",
        message=(
            f"{employee_name} ({assignment.skill_slot.specializationID.specializationName}) "
            f"has been marked as complete on '{job.title}'."
        ),
        relatedJobID=job.jobID,
    )

    # Check if ALL team members (workers + employees) are complete
    incomplete_workers = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status="ACTIVE", worker_marked_complete=False
    ).count()
    incomplete_employees = (
        JobEmployeeAssignment.objects.filter(
            job=job,
            skill_slot__isnull=False,
            status__in=["ASSIGNED", "IN_PROGRESS"],
        )
        .exclude(agencyMarkedComplete=True)
        .count()
    )

    all_complete = incomplete_workers == 0 and incomplete_employees == 0

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "employee_name": employee_name,
        "completed_at": assignment.agencyMarkedCompleteAt.isoformat(),
        "all_team_complete": all_complete,
        "incomplete_workers": incomplete_workers,
        "incomplete_employees": incomplete_employees,
        "message": f"{employee_name} work marked as complete",
    }


# ---------------------------------------------------------------------------
# NEW: Per-member early-finish services
# ---------------------------------------------------------------------------


@transaction.atomic
def early_complete_team_worker_project(
    job_id: int, assignment_id: int, client_user
) -> dict:
    """
    Client early-finishes a specific freelancer on a PROJECT team job.
    Payout = full budget_allocated on their skill slot (not prorated).
    Idempotent: returns success if already early-completed.
    """
    from accounts.models import JobLog

    try:
        job = Job.objects.select_related("clientID__profileID__accountFK").get(
            jobID=job_id
        )
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper() != "PROJECT":
        return {
            "success": False,
            "error": "This endpoint is for PROJECT team jobs only",
        }

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Job must be IN_PROGRESS (current: {job.status})",
        }

    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client can early-complete a worker",
        }

    try:
        assignment = JobWorkerAssignment.objects.select_related(
            "workerID__profileID__accountFK", "skillSlotID"
        ).get(assignmentID=assignment_id, jobID=job)
    except JobWorkerAssignment.DoesNotExist:
        return {"success": False, "error": "Worker assignment not found"}

    if assignment.assignment_status not in ("ACTIVE", "COMPLETED"):
        return {
            "success": False,
            "error": f"Assignment status is {assignment.assignment_status}",
        }

    if assignment.early_completed:
        return {
            "success": True,
            "already_done": True,
            "assignment_id": assignment.assignmentID,
            "message": "Worker was already early-completed",
        }

    if not assignment.client_confirmed_arrival:
        return {"success": False, "error": "Client must confirm worker arrival first"}

    # Full slot budget = the contracted share for this freelancer
    payout = Decimal("0.00")
    if assignment.skillSlotID and assignment.skillSlotID.budget_allocated:
        payout = Decimal(str(assignment.skillSlotID.budget_allocated))

    now = timezone.now()
    worker_account = assignment.workerID.profileID.accountFK
    worker_name = f"{assignment.workerID.profileID.firstName} {assignment.workerID.profileID.lastName}"

    if payout > Decimal("0.00"):
        worker_wallet, _ = Wallet.objects.select_for_update().get_or_create(
            accountFK=worker_account
        )
        worker_wallet.pendingEarnings += payout
        worker_wallet.save()

        Transaction.objects.create(
            walletID=worker_wallet,
            transactionType="PENDING_EARNING",
            amount=payout,
            balanceAfter=worker_wallet.balance,
            status="PENDING",
            description=f"Early completion payout (PROJECT full share) - Job #{job.jobID}",
            relatedJobPosting=job,
            paymentMethod="WALLET",
        )

    assignment.early_completed = True
    assignment.early_completed_at = now
    assignment.early_completion_payout = payout
    assignment.assignment_status = "COMPLETED"
    assignment.worker_marked_complete = True
    assignment.worker_marked_complete_at = now
    assignment.save()

    JobLog.objects.create(
        jobID=job,
        notes=(
            f"[{now.strftime('%Y-%m-%d %I:%M:%S %p')}] Client early-completed "
            f"PROJECT worker {worker_name} (assignment #{assignment_id}). "
            f"Payout: PHP {payout}"
        ),
        changedBy=client_user,
        oldStatus="IN_PROGRESS",
        newStatus="IN_PROGRESS",
    )

    Notification.objects.create(
        accountFK=worker_account,
        notificationType="TEAM_WORKER_COMPLETE",
        title="Early Completion — Full Pay",
        message=(
            f"You've been marked as done early on '{job.title}'. "
            f"Full project share of PHP {float(payout):,.2f} added to pending earnings."
        ),
        relatedJobID=job.jobID,
    )

    all_complete = (
        not JobWorkerAssignment.objects.filter(
            jobID=job, assignment_status="ACTIVE"
        ).exists()
        and not JobEmployeeAssignment.objects.filter(
            job=job, skill_slot__isnull=False, status__in=["ASSIGNED", "IN_PROGRESS"]
        ).exists()
    )

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "worker_name": worker_name,
        "payout": float(payout),
        "all_workers_complete": all_complete,
        "message": f"{worker_name} early-completed with full PROJECT share of PHP {float(payout):,.2f}",
    }


@transaction.atomic
def early_complete_team_employee(job_id: int, assignment_id: int, client_user) -> dict:
    """
    Client early-finishes a specific agency employee on a team job (DAILY or PROJECT).
    Payout = paymentAmount on the JobEmployeeAssignment, routed to agency owner ledger.
    Idempotent: returns success if already early-completed.
    """
    from accounts.models import JobLog, Agency

    try:
        job = Job.objects.select_related(
            "clientID__profileID__accountFK", "assignedAgencyFK__accountFK"
        ).get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if not job.is_team_job:
        return {"success": False, "error": "This is not a team job"}

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Job must be IN_PROGRESS (current: {job.status})",
        }

    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client can early-complete an employee",
        }

    try:
        assignment = JobEmployeeAssignment.objects.select_related(
            "employee",
            "skill_slot__specializationID",
            "skill_slot__invited_agency__accountFK",
        ).get(assignmentID=assignment_id, job=job)
    except JobEmployeeAssignment.DoesNotExist:
        return {"success": False, "error": "Employee assignment not found"}

    if assignment.status not in ("ASSIGNED", "IN_PROGRESS", "COMPLETED"):
        return {"success": False, "error": f"Assignment status is {assignment.status}"}

    if assignment.early_completed:
        return {
            "success": True,
            "already_done": True,
            "assignment_id": assignment.assignmentID,
            "message": "Employee was already early-completed",
        }

    if not assignment.clientConfirmedArrival:
        return {"success": False, "error": "Client must confirm employee arrival first"}

    # Payout = full paymentAmount (works for both DAILY and PROJECT)
    payout = Decimal(str(assignment.paymentAmount or "0.00"))

    now = timezone.now()
    employee_name = assignment.employee.name

    # Determine the agency owner account to receive funds
    agency_account = None
    if assignment.skill_slot and assignment.skill_slot.invited_agency:
        agency_account = assignment.skill_slot.invited_agency.accountFK
    elif job.assignedAgencyFK:
        agency_account = job.assignedAgencyFK.accountFK

    if not agency_account:
        return {
            "success": False,
            "error": "Could not determine agency account for payout",
        }

    if payout > Decimal("0.00"):
        agency_wallet, _ = Wallet.objects.select_for_update().get_or_create(
            accountFK=agency_account
        )
        agency_wallet.pendingEarnings += payout
        agency_wallet.save()

        Transaction.objects.create(
            walletID=agency_wallet,
            transactionType="PENDING_EARNING",
            amount=payout,
            balanceAfter=agency_wallet.balance,
            status="PENDING",
            description=f"Early completion payout for employee {employee_name} - Job #{job.jobID}",
            relatedJobPosting=job,
            paymentMethod="WALLET",
        )

    assignment.early_completed = True
    assignment.early_completed_at = now
    assignment.early_completion_payout = payout
    assignment.agencyMarkedComplete = True
    assignment.agencyMarkedCompleteAt = now
    assignment.clientApproved = True
    assignment.clientApprovedAt = now
    assignment.status = "COMPLETED"
    assignment.save()

    JobLog.objects.create(
        jobID=job,
        notes=(
            f"[{now.strftime('%Y-%m-%d %I:%M:%S %p')}] Client early-completed "
            f"agency employee {employee_name} (assignment #{assignment_id}). "
            f"Payout to agency: PHP {payout}"
        ),
        changedBy=client_user,
        oldStatus="IN_PROGRESS",
        newStatus="IN_PROGRESS",
    )

    Notification.objects.create(
        accountFK=agency_account,
        notificationType="TEAM_EMPLOYEE_COMPLETED",
        title="Employee Early-Completed",
        message=(
            f"Client marked {employee_name} as done early on '{job.title}'. "
            f"PHP {float(payout):,.2f} added to pending earnings."
        ),
        relatedJobID=job.jobID,
    )

    all_complete = (
        not JobWorkerAssignment.objects.filter(
            jobID=job, assignment_status="ACTIVE"
        ).exists()
        and not JobEmployeeAssignment.objects.filter(
            job=job, skill_slot__isnull=False, status__in=["ASSIGNED", "IN_PROGRESS"]
        ).exists()
    )

    return {
        "success": True,
        "assignment_id": assignment.assignmentID,
        "employee_name": employee_name,
        "payout": float(payout),
        "all_team_complete": all_complete,
        "message": f"{employee_name} early-completed. PHP {float(payout):,.2f} to agency pending earnings.",
    }


@transaction.atomic
def early_complete_single_project_job(job_id: int, client_user) -> dict:
    """
    Client early-finishes a single (non-team) PROJECT job.
    Payout = full remaining project budget (budget + materialsCost).
    Bypasses the multi-day gate. Idempotent.
    """
    from accounts.models import JobLog

    try:
        job = Job.objects.select_related(
            "clientID__profileID__accountFK",
            "assignedWorkerID__profileID__accountFK",
        ).get(jobID=job_id)
    except Job.DoesNotExist:
        return {"success": False, "error": "Job not found"}

    if str(getattr(job, "payment_model", "PROJECT") or "PROJECT").upper() != "PROJECT":
        return {"success": False, "error": "This endpoint is for PROJECT jobs only"}

    if job.is_team_job:
        return {
            "success": False,
            "error": "Use team early-finish endpoints for team jobs",
        }

    if job.status != "IN_PROGRESS":
        return {
            "success": False,
            "error": f"Job must be IN_PROGRESS (current: {job.status})",
        }

    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {
            "success": False,
            "error": "Only the client can perform early completion",
        }

    if job.clientMarkedComplete:
        return {
            "success": True,
            "already_done": True,
            "message": "Job already completed",
        }

    if not job.clientConfirmedWorkStarted:
        return {"success": False, "error": "Client must confirm worker arrival first"}

    # Payout = budget + materialsCost (full contracted amount, same as approve-completion)
    budget = Decimal(str(job.budget or "0.00"))
    materials_cost = Decimal(str(getattr(job, "materialsCost", None) or "0.00"))
    payout = budget + materials_cost

    worker_account = None
    if job.assignedWorkerID and job.assignedWorkerID.profileID:
        worker_account = job.assignedWorkerID.profileID.accountFK

    if not worker_account:
        return {"success": False, "error": "Could not determine worker account"}

    now = timezone.now()

    if payout > Decimal("0.00"):
        worker_wallet, _ = Wallet.objects.select_for_update().get_or_create(
            accountFK=worker_account
        )
        worker_wallet.pendingEarnings += payout
        worker_wallet.save()

        Transaction.objects.create(
            walletID=worker_wallet,
            transactionType="PENDING_EARNING",
            amount=payout,
            balanceAfter=worker_wallet.balance,
            status="PENDING",
            description=f"Early completion payout (PROJECT full share) - Job #{job.jobID}",
            relatedJobPosting=job,
            paymentMethod="WALLET",
        )

    old_status = job.status
    job.is_early_completed = True
    job.early_completed_at = now
    job.early_completion_payout = payout
    job.status = "COMPLETED"
    job.workerMarkedComplete = True
    job.clientMarkedComplete = True
    job.workerMarkedCompleteAt = now
    job.clientMarkedCompleteAt = now
    job.finalPaymentMethod = "WALLET"
    job.save()

    JobLog.objects.create(
        jobID=job,
        notes=(
            f"[{now.strftime('%Y-%m-%d %I:%M:%S %p')}] Client early-completed PROJECT job. "
            f"Full payout: PHP {payout}"
        ),
        changedBy=client_user,
        oldStatus=old_status,
        newStatus="COMPLETED",
    )

    worker_name = f"{job.assignedWorkerID.profileID.firstName} {job.assignedWorkerID.profileID.lastName}"
    Notification.objects.create(
        accountFK=worker_account,
        notificationType="JOB_COMPLETED",
        title="Job Completed — Full Pay",
        message=(
            f"Client has marked '{job.title}' as complete early. "
            f"Full payment of PHP {float(payout):,.2f} added to pending earnings."
        ),
        relatedJobID=job.jobID,
    )

    # Archive conversation
    try:
        from profiles.models import Conversation

        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            conversation.status = Conversation.ConversationStatus.COMPLETED
            conversation.save(update_fields=["status", "updatedAt"])
    except Exception:
        pass

    return {
        "success": True,
        "job_id": job.jobID,
        "worker_name": worker_name,
        "payout": float(payout),
        "status": job.status,
        "message": f"PROJECT job early-completed. PHP {float(payout):,.2f} added to worker pending earnings.",
    }
