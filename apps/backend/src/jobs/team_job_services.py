# ===========================================================================
# TEAM JOB SERVICES - Multi-Skill Multi-Worker Business Logic
# ===========================================================================

from decimal import Decimal
from typing import Optional
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone

from accounts.models import (
    Job, JobSkillSlot, JobWorkerAssignment, JobApplication,
    Specializations, Profile, WorkerProfile, ClientProfile, Notification, Transaction, Wallet, workerSpecialization
)
from profiles.models import Conversation, ConversationParticipant


def _get_required_project_days(job: Job) -> int:
    configured = int(getattr(job, 'duration_days', 0) or 0)
    if configured > 0:
        return configured

    expected = str(getattr(job, 'expectedDuration', '') or '').strip().lower()
    if expected:
        import re
        match = re.search(r'(\d+)', expected)
        if match:
            try:
                parsed = int(match.group(1))
                if parsed > 0:
                    return parsed
            except ValueError:
                pass

    return 1


def _get_elapsed_project_days(job: Job) -> int:
    qa_offset = int(getattr(job, 'qa_day_offset', 0) or 0)
    total_days_worked = int(getattr(job, 'total_days_worked', 0) or 0)

    if total_days_worked > 0:
        return max(0, total_days_worked + qa_offset)

    started_at = getattr(job, 'clientConfirmedWorkStartedAt', None)
    if not started_at:
        return max(0, qa_offset)

    start_date = timezone.localtime(started_at).date()
    today = timezone.localdate()
    elapsed = (today - start_date).days + 1
    return max(0, elapsed + qa_offset)


def _project_multi_day_gate_error(job: Job):
    payment_model = str(getattr(job, 'payment_model', 'PROJECT') or 'PROJECT').upper()
    if payment_model != 'PROJECT':
        return None

    required_days = _get_required_project_days(job)
    if required_days <= 1:
        return None

    elapsed_days = _get_elapsed_project_days(job)
    if elapsed_days >= required_days:
        return None

    return {
        'success': False,
        'error': (
            f"This is a {required_days}-day project job. "
            f"Final completion and payment are only allowed on day {required_days}."
        ),
        'required_days': required_days,
        'elapsed_days': elapsed_days,
        'remaining_days': required_days - elapsed_days,
        'payment_model': payment_model,
    }


def _job_date_window(job) -> tuple:
    """Return (start_date, end_date) where end defaults to start for single-day jobs."""
    start_date = getattr(job, 'preferredStartDate', None)
    if not start_date:
        return (None, None)
    end_date = getattr(job, 'scheduled_end_date', None) or start_date
    return (start_date, end_date)


def _windows_overlap(start_a, end_a, start_b, end_b) -> bool:
    """Inclusive overlap check between two date windows."""
    if not all([start_a, end_a, start_b, end_b]):
        return False
    return start_a <= end_b and end_a >= start_b


def find_worker_schedule_conflict(worker_profile: WorkerProfile, target_job: Job, exclude_job_id: Optional[int] = None):
    """
    Find a conflicting active assignment for a worker.

    If target job has no schedule, conservatively block on any active assignment.
    If target job has schedule, block on overlapping windows and on active jobs missing dates.
    """
    target_start, target_end = _job_date_window(target_job)

    direct_jobs = Job.objects.filter(
        assignedWorkerID=worker_profile,
        status__in=[Job.JobStatus.ACTIVE, Job.JobStatus.IN_PROGRESS],
    )
    if exclude_job_id:
        direct_jobs = direct_jobs.exclude(jobID=exclude_job_id)

    team_assignments = JobWorkerAssignment.objects.filter(
        workerID=worker_profile,
        assignment_status='ACTIVE',
        jobID__status__in=[Job.JobStatus.ACTIVE, Job.JobStatus.IN_PROGRESS],
    ).select_related('jobID')
    if exclude_job_id:
        team_assignments = team_assignments.exclude(jobID__jobID=exclude_job_id)

    if not target_start:
        direct_conflict = direct_jobs.first()
        if direct_conflict:
            return direct_conflict
        team_conflict = team_assignments.first()
        if team_conflict:
            return team_conflict.jobID
        return None

    for job in direct_jobs:
        start_date, end_date = _job_date_window(job)
        if not start_date:
            return job
        if _windows_overlap(start_date, end_date, target_start, target_end):
            return job

    for assignment in team_assignments:
        job = assignment.jobID
        start_date, end_date = _job_date_window(job)
        if not start_date:
            return job
        if _windows_overlap(start_date, end_date, target_start, target_end):
            return job

    return None


def calculate_budget_allocation(total_budget: Decimal, skill_slots: list, allocation_type: str) -> list:
    """
    Calculate budget allocation for each skill slot based on allocation type.
    
    Returns list of dicts: [{'specialization_id': X, 'budget': Y}, ...]
    """
    if not skill_slots:
        return []
    
    total_workers = sum(slot.get('workers_needed', 1) for slot in skill_slots)
    
    if allocation_type == 'EQUAL_PER_SKILL':
        # Equal budget per skill slot (regardless of worker count)
        per_slot = total_budget / len(skill_slots)
        return [{'specialization_id': slot['specialization_id'], 'budget': per_slot} for slot in skill_slots]
    
    elif allocation_type == 'EQUAL_PER_WORKER':
        # Equal budget per worker (default)
        per_worker = total_budget / total_workers if total_workers > 0 else Decimal('0')
        return [
            {'specialization_id': slot['specialization_id'], 'budget': per_worker * slot.get('workers_needed', 1)}
            for slot in skill_slots
        ]
    
    elif allocation_type == 'SKILL_WEIGHTED':
        # Weight by skill level: EXPERT=3x, INTERMEDIATE=2x, ENTRY=1x
        weights = {'EXPERT': 3, 'INTERMEDIATE': 2, 'ENTRY': 1}
        total_weight = sum(
            weights.get(slot.get('skill_level_required', 'ENTRY'), 1) * slot.get('workers_needed', 1)
            for slot in skill_slots
        )
        per_weight = total_budget / total_weight if total_weight > 0 else Decimal('0')
        return [
            {
                'specialization_id': slot['specialization_id'],
                'budget': per_weight * weights.get(slot.get('skill_level_required', 'ENTRY'), 1) * slot.get('workers_needed', 1)
            }
            for slot in skill_slots
        ]
    
    elif allocation_type == 'MANUAL_ALLOCATION':
        # Client provides budget per slot (validate total matches)
        return [
            {'specialization_id': slot['specialization_id'], 'budget': Decimal(str(slot.get('budget_allocated', 0)))}
            for slot in skill_slots
        ]
    
    # Default to EQUAL_PER_WORKER
    per_worker = total_budget / total_workers if total_workers > 0 else Decimal('0')
    return [
        {'specialization_id': slot['specialization_id'], 'budget': per_worker * slot.get('workers_needed', 1)}
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
    allocation_type: str = 'EQUAL_PER_WORKER',
    team_start_threshold: float = 100.0,
    urgency: str = 'MEDIUM',
    preferred_start_date: Optional[str] = None,
    scheduled_end_date: Optional[str] = None,
    materials_needed: Optional[list] = None,
    payment_method: str = 'WALLET',
    payment_model: str = 'PROJECT',
    daily_rate: Optional[Decimal] = None,
    duration_days: Optional[int] = None,
    job_scope: str = 'MODERATE_PROJECT',
    skill_level_required: str = 'INTERMEDIATE',
    work_environment: str = 'INDOOR'
) -> dict:
    """
    Create a team job with multiple skill slot requirements.
    
    Returns dict with job details and any payment info needed.
    """
    from datetime import datetime
    
    # Validate minimum team size requirements
    if not skill_slots_data:
        return {'success': False, 'error': 'Team jobs require at least 1 skill slot'}
    
    total_workers = sum(slot.get('workers_needed', 1) for slot in skill_slots_data)
    if total_workers < 2:
        return {'success': False, 'error': 'Team jobs require at least 2 workers total'}
    
    # Validate specializations exist
    spec_ids = [slot['specialization_id'] for slot in skill_slots_data]
    existing_specs = Specializations.objects.filter(specializationID__in=spec_ids).values_list('specializationID', flat=True)
    missing = set(spec_ids) - set(existing_specs)
    if missing:
        return {'success': False, 'error': f'Invalid specialization IDs: {missing}'}
    
    payment_model_upper = str(payment_model or 'PROJECT').upper()
    if payment_model_upper not in ['PROJECT', 'DAILY']:
        return {'success': False, 'error': 'Invalid payment_model. Choose PROJECT or DAILY'}

    effective_total_budget = Decimal(str(total_budget))
    effective_daily_rate: Optional[Decimal] = None
    effective_duration_days: Optional[int] = None

    if payment_model_upper == 'DAILY':
        if daily_rate is None or duration_days is None:
            return {'success': False, 'error': 'daily_rate and duration_days are required for DAILY team jobs'}

        effective_daily_rate = Decimal(str(daily_rate))
        effective_duration_days = int(duration_days)
        if effective_daily_rate <= 0 or effective_duration_days <= 0:
            return {'success': False, 'error': 'daily_rate and duration_days must be positive'}

        # DAILY team budget is derived from rate/day per worker.
        effective_total_budget = effective_daily_rate * Decimal(str(effective_duration_days)) * Decimal(str(total_workers))

    # Calculate budget allocation
    budget_allocations = calculate_budget_allocation(
        effective_total_budget, skill_slots_data, allocation_type
    )
    
    # Validate manual allocation totals match
    if allocation_type == 'MANUAL_ALLOCATION':
        allocated_sum = sum(alloc['budget'] for alloc in budget_allocations)
        if abs(allocated_sum - effective_total_budget) > Decimal('1'):  # Allow ₱1 variance
            return {'success': False, 'error': f'Manual allocation total (₱{allocated_sum}) does not match total budget (₱{effective_total_budget})'}
    
    # Get client's base profile
    client_profile_obj = (
        client_profile
        if isinstance(client_profile, Profile)
        else Profile.objects.get(profileID=client_profile)
    )

    # Ensure only CLIENT profiles can create team jobs
    if client_profile_obj.profileType != 'CLIENT':
        return {
            'success': False,
            'error': f'Only clients can create team jobs. Your profile type is: {client_profile_obj.profileType}'
        }

    # Get or create ClientProfile to prevent false negatives for valid client accounts
    client_profile_record, _ = ClientProfile.objects.get_or_create(
        profileID=client_profile_obj,
        defaults={
            'description': '',
            'totalJobsPosted': 0,
            'clientRating': 0,
            'activeJobsCount': 0,
        },
    )
    
    # Check wallet balance for escrow + platform fee
    # PROJECT: 50% escrow; DAILY: 100% escrow upfront
    escrow_amount = (
        effective_total_budget if payment_model_upper == 'DAILY'
        else effective_total_budget * Decimal('0.5')
    )
    platform_fee = effective_total_budget * settings.PLATFORM_FEE_RATE  # 10% of total budget
    total_needed = escrow_amount + platform_fee
    wallet = None
    
    if payment_method == 'WALLET':
        try:
            wallet = Wallet.objects.get(accountFK=client_profile_obj.accountFK)
            if wallet.balance < total_needed:
                return {
                    'success': False,
                    'error': f'Insufficient wallet balance. Need ₱{total_needed}, have ₱{wallet.balance}',
                    'requires_deposit': True,
                    'amount_needed': float(total_needed)
                }
        except Wallet.DoesNotExist:
            return {'success': False, 'error': 'Wallet not found'}
    
    try:
        preferred_start_date_obj = datetime.strptime(preferred_start_date, '%Y-%m-%d').date() if preferred_start_date else None
    except ValueError:
        return {'success': False, 'error': 'Invalid preferred_start_date format. Use YYYY-MM-DD'}

    try:
        scheduled_end_date_obj = datetime.strptime(scheduled_end_date, '%Y-%m-%d').date() if scheduled_end_date else preferred_start_date_obj
    except ValueError:
        return {'success': False, 'error': 'Invalid scheduled_end_date format. Use YYYY-MM-DD'}

    if preferred_start_date_obj and scheduled_end_date_obj and scheduled_end_date_obj < preferred_start_date_obj:
        return {'success': False, 'error': 'scheduled_end_date cannot be earlier than preferred_start_date'}

    # Create the job
    job = Job.objects.create(
        clientID=client_profile_record,
        title=title,
        description=description,
        location=location,
        budget=effective_total_budget,
        escrowAmount=escrow_amount,
        remainingPayment=Decimal('0.00') if payment_model_upper == 'DAILY' else (effective_total_budget * Decimal('0.5')),
        urgency=urgency,
        preferredStartDate=preferred_start_date_obj,
        scheduled_end_date=scheduled_end_date_obj,
        materialsNeeded=materials_needed or [],
        jobType='LISTING',  # Team jobs are listings
        status='ACTIVE',
        is_team_job=True,
        payment_model=payment_model_upper,
        daily_rate_agreed=float(effective_daily_rate) if payment_model_upper == 'DAILY' and effective_daily_rate is not None else None,
        duration_days=effective_duration_days if payment_model_upper == 'DAILY' else None,
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
        slot = JobSkillSlot.objects.create(
            jobID=job,
            specializationID_id=slot_data['specialization_id'],
            workers_needed=slot_data.get('workers_needed', 1),
            budget_allocated=budget_allocations[i]['budget'],
            skill_level_required=slot_data.get('skill_level_required', 'ENTRY'),
            notes=slot_data.get('notes'),
            status='OPEN'
        )
        created_slots.append(slot)
    
    # Handle payment (if wallet)
    if payment_method == 'WALLET':
        # Deduct from wallet
        if wallet is None:
            return {'success': False, 'error': 'Wallet not found'}
        wallet.balance -= total_needed
        wallet.reservedBalance += escrow_amount  # Hold escrow
        wallet.save()
        
        # Create transaction record
        Transaction.objects.create(
            walletID=wallet,
            relatedJobPosting=job,
            transactionType='ESCROW',
            amount=escrow_amount,
            balanceAfter=wallet.balance,
            status='COMPLETED',
            description=(
                f"Team job escrow ({'100%' if payment_model_upper == 'DAILY' else '50%'}) for: {title} "
                f"(Platform fee: ₱{platform_fee})"
            )
        )

    if payment_model_upper == 'DAILY' and effective_daily_rate is not None and effective_duration_days is not None:
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
        'success': True,
        'job_id': job.jobID,
        'skill_slots_created': len(created_slots),
        'total_workers_needed': total_workers,
        'payment_model': payment_model_upper,
        'total_budget': float(effective_total_budget),
        'escrow_amount': float(escrow_amount),
        'platform_fee': float(platform_fee),
        'message': f'Team job created with {len(created_slots)} skill slots requiring {total_workers} workers'
    }


def get_team_job_detail(job_id: int, requesting_user=None) -> dict:
    """
    Get full team job details including skill slots and worker assignments.
    """
    try:
        job = Job.objects.select_related(
            'clientID__profileID'
        ).prefetch_related(
            'skill_slots__specializationID',
            'skill_slots__worker_assignments__workerID__profileID',
            'worker_assignments__workerID__profileID',
            'worker_assignments__skillSlotID__specializationID'
        ).get(jobID=job_id)
    except Job.DoesNotExist:
        return {'error': 'Job not found'}
    
    if not job.is_team_job:
        return {'error': 'Not a team job'}
    
    # Build skill slots detail
    skill_slots = []
    for slot in job.skill_slots.all():
        assigned_count = slot.worker_assignments.filter(
            assignment_status__in=['ACTIVE', 'COMPLETED']
        ).count()
        
        specialization_name = (
            slot.specializationID.specializationName
            if slot.specializationID
            else "Unknown Skill"
        )

        skill_slots.append({
            'skill_slot_id': slot.skillSlotID,
            'specialization_id': slot.specializationID_id,
            'specialization_name': specialization_name,
            'workers_needed': slot.workers_needed,
            'workers_assigned': assigned_count,
            'openings_remaining': max(0, slot.workers_needed - assigned_count),
            'budget_allocated': float(slot.budget_allocated),
            'budget_per_worker': float(slot.budget_allocated / slot.workers_needed) if slot.workers_needed > 0 else 0,
            'skill_level_required': slot.skill_level_required,
            'status': slot.status,
            'notes': slot.notes
        })
    
    # Build worker assignments detail
    assignments = []
    for assignment in job.worker_assignments.all():
        worker = assignment.workerID
        profile = worker.profileID
        skill_slot = assignment.skillSlotID
        specialization = skill_slot.specializationID if skill_slot else None
        specialization_name = (
            specialization.specializationName if specialization else "Unknown Skill"
        )
        
        assignments.append({
            'assignment_id': assignment.assignmentID,
            'worker_id': worker.id,  # Use .id (primary key), not .workerID
            'worker_name': f"{profile.firstName} {profile.lastName}",
            'worker_avatar': profile.profileImg or None,  # profileImg is a CharField (URL string), not FileField
            'worker_rating': float(worker.workerRating) if worker.workerRating else None,  # workerRating, not rating
            'skill_slot_id': assignment.skillSlotID_id,
            'specialization_name': specialization_name,
            'slot_position': assignment.slot_position,
            'assignment_status': assignment.assignment_status,
            'assigned_at': assignment.assignedAt.isoformat(),
            'worker_marked_complete': assignment.worker_marked_complete,
            'individual_rating': float(assignment.individual_rating) if assignment.individual_rating else None
        })
    
    # Calculate totals
    total_needed = sum(slot['workers_needed'] for slot in skill_slots)
    total_assigned = sum(slot['workers_assigned'] for slot in skill_slots)
    fill_percentage = round((total_assigned / total_needed * 100), 2) if total_needed > 0 else 0
    
    client_profile = job.clientID.profileID if job.clientID else None
    
    return {
        'job_id': job.jobID,
        'title': job.title,
        'description': job.description,
        'location': job.location,
        'total_budget': float(job.budget),
        'status': job.status,
        'is_team_job': True,
        'budget_allocation_type': job.budget_allocation_type,
        'team_start_threshold': float(job.team_job_start_threshold),
        'total_workers_needed': total_needed,
        'total_workers_assigned': total_assigned,
        'team_fill_percentage': fill_percentage,
        'can_start': fill_percentage >= float(job.team_job_start_threshold),
        'skill_slots': skill_slots,
        'worker_assignments': assignments,
        'client_id': client_profile.profileID if client_profile else None,
        'client_name': f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown",
        'created_at': job.createdAt.isoformat()
    }


@transaction.atomic
def apply_to_skill_slot(
    worker_profile: WorkerProfile,
    job_id: int,
    skill_slot_id: int,
    proposal_message: str,
    proposed_budget: Decimal,
    budget_option: str = 'ACCEPT',
    estimated_duration: Optional[str] = None
) -> dict:
    """
    Worker applies to a specific skill slot in a team job.
    """
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {'success': False, 'error': 'Job not found'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'This is not a team job. Use regular application.'}
    
    if job.status != 'ACTIVE':
        return {'success': False, 'error': f'Job is not accepting applications (status: {job.status})'}

    # Date-overlap policy parity: workers may handle multiple jobs if schedules do not overlap.
    scheduled_conflict = find_worker_schedule_conflict(worker_profile, job, exclude_job_id=job.jobID)
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
            'success': False,
            'error': message,
            'conflicting_job_id': scheduled_conflict.jobID,
            'conflicting_job_title': scheduled_conflict.title,
        }
    
    try:
        skill_slot = JobSkillSlot.objects.get(skillSlotID=skill_slot_id, jobID=job)
    except JobSkillSlot.DoesNotExist:
        return {'success': False, 'error': 'Skill slot not found for this job'}
    
    if skill_slot.status not in ['OPEN', 'PARTIALLY_FILLED']:
        return {'success': False, 'error': f'Skill slot is not accepting applications (status: {skill_slot.status})'}

    # Enforce required specialization for this slot
    has_required_skill = workerSpecialization.objects.filter(
        workerID=worker_profile,
        specializationID=skill_slot.specializationID
    ).exists()
    if not has_required_skill:
        return {
            'success': False,
            'error': f"You must add the required skill '{skill_slot.specializationID.specializationName}' before applying to this slot.",
            'required_skill': skill_slot.specializationID.specializationName,
            'required_specialization_id': skill_slot.specializationID.specializationID,
        }

    if (
        budget_option == 'NEGOTIATE'
        and skill_slot.specializationID.minimumRate
        and proposed_budget < skill_slot.specializationID.minimumRate
    ):
        minimum_rate = skill_slot.specializationID.minimumRate
        return {
            'success': False,
            'error': (
                f"Proposed budget cannot be less than ₱{minimum_rate:,.2f} "
                f"(DOLE minimum rate for {skill_slot.specializationID.specializationName})."
            ),
            'minimum_rate': float(minimum_rate),
            'category': skill_slot.specializationID.specializationName,
        }
    
    # Check if worker already has an active application for this slot
    # (allow re-apply when previous application was REJECTED or WITHDRAWN)
    existing = JobApplication.objects.filter(
        jobID=job,
        workerID=worker_profile,
        applied_skill_slot=skill_slot,
        status__in=[
            JobApplication.ApplicationStatus.PENDING,
            JobApplication.ApplicationStatus.ACCEPTED,
        ],
    ).exists()
    
    if existing:
        return {'success': False, 'error': 'You have already applied to this skill slot'}
    
    # Create application
    application = JobApplication.objects.create(
        jobID=job,
        workerID=worker_profile,
        applied_skill_slot=skill_slot,
        proposalMessage=proposal_message,
        proposedBudget=proposed_budget,
        budgetOption=budget_option,
        estimatedDuration=estimated_duration,
        status='PENDING'
    )
    
    # Notify client
    client_account = job.clientID.profileID.accountFK if job.clientID else None
    if client_account:
        worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
        Notification.objects.create(
            accountFK=client_account,
            notificationType="NEW_TEAM_APPLICATION",
            title=f"New Team Application",
            message=f"{worker_name} applied for {skill_slot.specializationID.specializationName} position in '{job.title}'",
            relatedJobID=job.jobID
        )
    
    return {
        'success': True,
        'application_id': application.applicationID,
        'message': f'Applied to {skill_slot.specializationID.specializationName} slot successfully'
    }


@transaction.atomic
def accept_team_application(
    job_id: int,
    application_id: int,
    client_user
) -> dict:
    """
    Client accepts a worker's application to a team job skill slot.
    Creates assignment and adds worker to team conversation.
    """
    try:
        application = JobApplication.objects.select_related(
            'jobID', 'workerID__profileID', 'applied_skill_slot__specializationID'
        ).get(applicationID=application_id, jobID_id=job_id)
    except JobApplication.DoesNotExist:
        return {'success': False, 'error': 'Application not found'}
    
    job = application.jobID
    
    # Verify client owns the job
    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {'success': False, 'error': 'Not authorized to accept applications for this job'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'This is not a team job'}
    
    if application.status != 'PENDING':
        return {'success': False, 'error': f'Application is not pending (status: {application.status})'}

    # Re-check schedule overlap at accept time to avoid race-condition assignments.
    scheduled_conflict = find_worker_schedule_conflict(application.workerID, job, exclude_job_id=job.jobID)
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
            'success': False,
            'error': message,
            'conflicting_job_id': scheduled_conflict.jobID,
            'conflicting_job_title': scheduled_conflict.title,
        }

    # Guard legacy/corrupted rows before dereferencing nested slot relations.
    skill_slot = application.applied_skill_slot
    if not skill_slot:
        return {
            'success': False,
            'error': 'Cannot accept application: missing skill slot reference. Ask the worker to re-apply to the correct slot.',
        }

    required_specialization = skill_slot.specializationID
    if not required_specialization:
        return {
            'success': False,
            'error': 'Cannot accept application: this slot no longer has a valid specialization.',
        }
    # Enforce required specialization before acceptance (handles older applications)
    worker_has_required_skill = workerSpecialization.objects.filter(
        workerID=application.workerID,
        specializationID=required_specialization
    ).exists()
    if not worker_has_required_skill:
        worker_name = f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}".strip()
        required_skill = required_specialization.specializationName
        return {
            'success': False,
            'error': f"Cannot accept application: {worker_name} does not have required skill '{required_skill}'.",
            'required_skill': required_skill,
            'required_specialization_id': required_specialization.specializationID,
        }
    
    # CRITICAL: Check if worker is already assigned to another slot on this job
    # A worker can only fill one slot per team job (unique_worker_per_job constraint)
    existing_assignment = JobWorkerAssignment.objects.filter(
        jobID=job,
        workerID=application.workerID,
        assignment_status__in=['ACTIVE', 'COMPLETED']
    ).select_related('skillSlotID__specializationID').first()
    
    if existing_assignment:
        existing_slot = existing_assignment.skillSlotID
        existing_slot_specialization = existing_slot.specializationID if existing_slot else None
        existing_slot_name = existing_slot_specialization.specializationName if existing_slot_specialization else 'Unknown Skill'
        worker_name = f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}"
        # Auto-reject this application since worker is already assigned
        application.status = 'REJECTED'
        application.save()
        return {
            'success': False,
            'error': f'{worker_name} is already assigned to the "{existing_slot_name}" slot on this job. A worker can only fill one slot per job. This application has been automatically rejected.'
        }
    
    # Check if slot has openings
    current_assigned = JobWorkerAssignment.objects.filter(
        skillSlotID=skill_slot,
        assignment_status__in=['ACTIVE', 'COMPLETED']
    ).count()
    
    if current_assigned >= skill_slot.workers_needed:
        # Close the slot
        skill_slot.status = 'FILLED'
        skill_slot.save()
        return {'success': False, 'error': 'This skill slot is already full'}
    
    # Determine slot position
    max_position = JobWorkerAssignment.objects.filter(skillSlotID=skill_slot).aggregate(
        max_pos=Count('slot_position')
    )['max_pos'] or 0
    
    # Create assignment
    assignment = JobWorkerAssignment.objects.create(
        jobID=job,
        skillSlotID=skill_slot,
        workerID=application.workerID,
        slot_position=max_position + 1,
        assignment_status='ACTIVE'
    )
    
    # Update application status
    application.status = 'ACCEPTED'
    application.save()
    
    # Auto-reject other pending applications from the same worker on this job
    # (worker can't be assigned to multiple slots)
    same_worker_pending = JobApplication.objects.filter(
        jobID=job,
        workerID=application.workerID,
        status='PENDING'
    ).exclude(applicationID=application.applicationID)
    same_worker_rejected_count = same_worker_pending.count()
    if same_worker_rejected_count > 0:
        same_worker_pending.update(status='REJECTED')
        print(f"📋 Auto-rejected {same_worker_rejected_count} other pending application(s) from same worker on job #{job_id}")
    
    # Update slot status
    new_assigned = current_assigned + 1
    if new_assigned >= skill_slot.workers_needed:
        skill_slot.status = 'FILLED'
    else:
        skill_slot.status = 'PARTIALLY_FILLED'
    skill_slot.save()
    
    # Auto-reject remaining pending applications for this slot when it becomes FILLED
    if skill_slot.status == 'FILLED':
        slot_pending_apps = JobApplication.objects.filter(
            jobID=job,
            applied_skill_slot=skill_slot,
            status='PENDING'
        ).exclude(applicationID=application.applicationID).select_related('workerID__profileID__accountFK')
        
        slot_rejected_count = slot_pending_apps.count()
        if slot_rejected_count > 0:
            for pending_app in slot_pending_apps:
                Notification.objects.create(
                    accountFK=pending_app.workerID.profileID.accountFK,
                    notificationType="APPLICATION_REJECTED",
                    title="Position Filled",
                    message=f"The {skill_slot.specializationID.specializationName} position in '{job.title}' has been filled. Keep applying to find more opportunities!",
                    relatedJobID=job.jobID,
                    relatedApplicationID=pending_app.applicationID
                )
            slot_pending_apps.update(status='REJECTED')
            print(f"📋 Auto-rejected {slot_rejected_count} pending application(s) for filled slot '{skill_slot.specializationID.specializationName}' on job #{job_id}")
    
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
        relatedJobID=job.jobID
    )
    
    # Check if job can now start (all slots filled)
    job.refresh_from_db()
    can_start = job.can_start_team_job
    conversation_created = False
    conversation_id = None
    
    # AUTO-CREATE CONVERSATION when all slots are filled
    if can_start:
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if not existing_conversation:
            # CRITICAL: Change job status to IN_PROGRESS (like regular jobs)
            job.status = 'IN_PROGRESS'
            job.save()
            
            # Create team conversation
            conversation = Conversation.objects.create(
                client=job.clientID.profileID if job.clientID else None,
                worker=None,  # Team jobs have multiple workers
                relatedJobPosting=job,
                status=Conversation.ConversationStatus.ACTIVE,
                conversation_type='TEAM_GROUP'
            )
            
            # Add client as participant
            if job.clientID:
                ConversationParticipant.objects.create(
                    conversation=conversation,
                    profile=job.clientID.profileID,
                    participant_type='CLIENT'
                )
            
            # Add ALL assigned workers as participants
            assignments = JobWorkerAssignment.objects.filter(
                jobID=job,
                assignment_status='ACTIVE'
            ).select_related('workerID__profileID', 'skillSlotID__specializationID')
            
            for assign in assignments:
                ConversationParticipant.objects.get_or_create(
                    conversation=conversation,
                    profile=assign.workerID.profileID,
                    defaults={
                        'participant_type': 'WORKER',
                        'skill_slot': assign.skillSlotID
                    }
                )
            
            conversation_created = True
            conversation_id = conversation.conversationID
            
            # Notify client that team is ready
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType="TEAM_JOB_READY",
                title="Team Ready!",
                message=f"All positions for '{job.title}' have been filled. You can now confirm worker arrivals!",
                relatedJobID=job.jobID
            )
            
            # Notify all workers that team is complete
            for assign in assignments:
                Notification.objects.create(
                    accountFK=assign.workerID.profileID.accountFK,
                    notificationType="TEAM_JOB_READY",
                    title="Team Complete!",
                    message=f"The team for '{job.title}' is now complete. Please coordinate with the client for work start.",
                    relatedJobID=job.jobID
                )
        else:
            conversation_id = existing_conversation.conversationID
        
        # AUTO-REJECT all remaining pending applications for this job (all slots now filled)
        remaining_pending = JobApplication.objects.filter(
            jobID=job,
            status='PENDING'
        ).select_related('workerID__profileID__accountFK')
        
        remaining_rejected_count = remaining_pending.count()
        if remaining_rejected_count > 0:
            for pending_app in remaining_pending:
                Notification.objects.create(
                    accountFK=pending_app.workerID.profileID.accountFK,
                    notificationType="APPLICATION_REJECTED",
                    title="All Positions Filled",
                    message=f"All positions for '{job.title}' have been filled. Keep applying to find more opportunities!",
                    relatedJobID=job.jobID,
                    relatedApplicationID=pending_app.applicationID
                )
            remaining_pending.update(status='REJECTED')
            print(f"📋 Auto-rejected {remaining_rejected_count} remaining pending application(s) for fully-staffed job #{job_id}")
        
        # CROSS-JOB AUTO-REJECTION: Reject accepted workers' pending apps on OTHER jobs
        # Team workers can only work one job at a time
        all_assignments = JobWorkerAssignment.objects.filter(
            jobID=job,
            assignment_status='ACTIVE'
        ).select_related('workerID__profileID__accountFK')
        
        for assign in all_assignments:
            cross_job_apps = JobApplication.objects.filter(
                workerID=assign.workerID,
                status='PENDING'
            ).exclude(jobID=job).select_related('jobID__clientID__profileID__accountFK')
            
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
                            relatedApplicationID=cross_app.applicationID
                        )
                    except Exception as notify_err:
                        print(f"⚠️ Failed to notify client for cross-job rejection: {notify_err}")
                
                cross_job_apps.update(status='REJECTED')
                
                Notification.objects.create(
                    accountFK=worker_profile.accountFK,
                    notificationType="APPLICATIONS_AUTO_WITHDRAWN",
                    title="Other Applications Withdrawn",
                    message=f"Since you've been hired for '{job.title}', your {cross_count} other pending application{'s' if cross_count > 1 else ''} {'have' if cross_count > 1 else 'has'} been automatically withdrawn.",
                    relatedJobID=job.jobID
                )
                print(f"🔄 Auto-rejected {cross_count} cross-job pending apps for worker {worker_profile.firstName}")
    
    return {
        'success': True,
        'assignment_id': assignment.assignmentID,
        'worker_name': f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}",
        'skill_slot': skill_slot.specializationID.specializationName,
        'slot_position': assignment.slot_position,
        'can_start_job': can_start,
        'all_slots_filled': can_start,
        'conversation_created': conversation_created,
        'conversation_id': conversation_id,
        'message': f'Worker assigned to {skill_slot.specializationID.specializationName} position #{assignment.slot_position}' + (' - Team is ready!' if can_start else '')
    }


@transaction.atomic
def reject_team_application(
    job_id: int,
    application_id: int,
    client_user,
    reason: Optional[str] = None
) -> dict:
    """
    Client rejects a worker's application to a team job skill slot.
    """
    try:
        application = JobApplication.objects.select_related(
            'jobID', 'workerID__profileID', 'applied_skill_slot__specializationID'
        ).get(applicationID=application_id, jobID_id=job_id)
    except JobApplication.DoesNotExist:
        return {'success': False, 'error': 'Application not found'}
    
    job = application.jobID
    
    # Verify client owns the job
    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {'success': False, 'error': 'Not authorized to reject applications for this job'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'This is not a team job'}
    
    if application.status != 'PENDING':
        return {'success': False, 'error': f'Application is not pending (status: {application.status})'}
    
    skill_slot = application.applied_skill_slot
    slot_name = skill_slot.specializationID.specializationName if skill_slot else 'Unknown'
    
    # Update application status
    application.status = 'REJECTED'
    application.save()
    
    # Notify worker
    worker_name = f"{application.workerID.profileID.firstName}"
    rejection_message = f"Your application for {slot_name} position in '{job.title}' was not accepted."
    if reason:
        rejection_message += f" Reason: {reason}"
    
    Notification.objects.create(
        accountFK=application.workerID.profileID.accountFK,
        notificationType="TEAM_APPLICATION_REJECTED",
        title="Application Not Accepted",
        message=rejection_message,
        relatedJobID=job.jobID
    )
    
    print(f"❌ Rejected team application #{application_id} for job #{job_id}")
    
    return {
        'success': True,
        'application_id': application_id,
        'worker_name': f"{application.workerID.profileID.firstName} {application.workerID.profileID.lastName}",
        'skill_slot': slot_name,
        'message': f'Application rejected for {slot_name} position'
    }


@transaction.atomic
def start_team_job(job_id: int, client_user, force_start: bool = False) -> dict:
    """
    Start a team job when threshold is met (or force start with Option C - partial team).
    """
    try:
        job = Job.objects.select_related('clientID__profileID').get(jobID=job_id)
    except Job.DoesNotExist:
        return {'success': False, 'error': 'Job not found'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'Not a team job'}
    
    if job.clientID and job.clientID.profileID.accountFK != client_user:
        return {'success': False, 'error': 'Not authorized'}
    
    if job.status != 'ACTIVE':
        return {'success': False, 'error': f'Job cannot be started (status: {job.status})'}
    
    fill_percentage = job.team_fill_percentage
    threshold = float(job.team_job_start_threshold)
    
    if not force_start and fill_percentage < threshold:
        return {
            'success': False,
            'error': f'Team is only {fill_percentage}% filled. Need {threshold}% to start.',
            'fill_percentage': fill_percentage,
            'threshold': threshold,
            'can_force_start': fill_percentage > 0  # Can force start if at least 1 worker
        }
    
    if fill_percentage == 0:
        return {'success': False, 'error': 'Cannot start with no workers assigned'}
    
    # Update job status
    job.status = 'IN_PROGRESS'
    job.save()
    
    # Close all skill slots (no more applications)
    job.skill_slots.update(status='CLOSED')
    
    # Get all assigned workers
    assignments = JobWorkerAssignment.objects.filter(
        jobID=job, assignment_status='ACTIVE'
    ).select_related('workerID__profileID', 'skillSlotID')
    
    # Create team group conversation NOW (when job starts, not when posted)
    # This follows single-job pattern where conversation is created at work start
    from profiles.models import Message
    client_profile = job.clientID.profileID
    conversation, _ = Conversation.create_team_conversation(
        job_posting=job,
        client_profile=client_profile
    )
    
    # Collect worker names and add them to conversation
    worker_names = []
    for assignment in assignments:
        worker_profile = assignment.workerID.profileID
        worker_names.append(f"{worker_profile.firstName} {worker_profile.lastName}")
        # Add worker to the team conversation
        conversation.add_team_worker(worker_profile, assignment.skillSlotID)
    
    # Create system message with team member names
    worker_list = ", ".join(worker_names) if worker_names else "the team"
    Message.create_system_message(
        conversation=conversation,
        message_text=f"Team job '{job.title}' has started! Team members: {worker_list}. You can all communicate here."
    )
    
    # Notify all assigned workers
    for assignment in assignments:
        Notification.objects.create(
            accountFK=assignment.workerID.profileID.accountFK,
            notificationType="TEAM_JOB_STARTED",
            title="Team Job Started!",
            message=f"'{job.title}' has started. Please begin your work.",
            relatedJobID=job.jobID
        )
    
    return {
        'success': True,
        'job_id': job.jobID,
        'status': 'IN_PROGRESS',
        'workers_assigned': job.total_workers_assigned,
        'message': f'Team job started with {job.total_workers_assigned} workers'
    }


@transaction.atomic
def worker_complete_team_assignment(assignment_id: int, worker_user, notes: str = None) -> dict:
    """
    Worker marks their individual assignment as complete in a team job.
    """
    try:
        assignment = JobWorkerAssignment.objects.select_related(
            'jobID', 'workerID__profileID', 'skillSlotID__specializationID'
        ).get(assignmentID=assignment_id)
    except JobWorkerAssignment.DoesNotExist:
        return {'success': False, 'error': 'Assignment not found'}
    
    # Verify worker owns this assignment
    if assignment.workerID.profileID.accountFK != worker_user:
        return {'success': False, 'error': 'Not authorized'}
    
    if assignment.assignment_status != 'ACTIVE':
        return {'success': False, 'error': f'Assignment is not active (status: {assignment.assignment_status})'}
    
    if assignment.worker_marked_complete:
        return {'success': False, 'error': 'Already marked as complete'}
    
    job = assignment.jobID
    if job.status != 'IN_PROGRESS':
        return {'success': False, 'error': 'Job is not in progress'}

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
            relatedJobID=job.jobID
        )
    
    # Check if all workers complete
    all_complete = not JobWorkerAssignment.objects.filter(
        jobID=job,
        assignment_status='ACTIVE',
        worker_marked_complete=False
    ).exists()
    
    return {
        'success': True,
        'assignment_id': assignment.assignmentID,
        'all_workers_complete': all_complete,
        'message': 'Marked your work as complete'
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
        return {'success': False, 'error': 'Job not found'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'This is not a team job'}
    
    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {'success': False, 'error': 'Only the client can confirm worker arrival'}
    
    # Get the specific worker assignment
    try:
        assignment = JobWorkerAssignment.objects.get(
            assignmentID=assignment_id,
            jobID=job
        )
    except JobWorkerAssignment.DoesNotExist:
        return {'success': False, 'error': 'Worker assignment not found'}
    
    # Check if already confirmed
    if assignment.client_confirmed_arrival:
        return {
            'success': False, 
            'error': f'Worker arrival already confirmed at {assignment.client_confirmed_arrival_at.strftime("%Y-%m-%d %H:%M")}'
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
        relatedJobID=job.jobID
    )
    
    # Check if all assigned workers have arrived
    total_workers = JobWorkerAssignment.objects.filter(
        jobID=job,
        assignment_status='ACTIVE'
    ).count()
    
    arrived_workers = JobWorkerAssignment.objects.filter(
        jobID=job,
        assignment_status='ACTIVE',
        client_confirmed_arrival=True
    ).count()
    
    all_arrived = (arrived_workers == total_workers)
    
    return {
        'success': True,
        'assignment_id': assignment.assignmentID,
        'worker_name': worker_name,
        'confirmed_at': assignment.client_confirmed_arrival_at.isoformat(),
        'all_workers_arrived': all_arrived,
        'arrived_count': arrived_workers,
        'total_count': total_workers,
        'message': f'Confirmed {worker_name} has arrived'
    }


def client_approve_team_job(job_id: int, client_user, payment_method: Optional[str] = None, cash_proof_url: Optional[str] = None) -> dict:
    """
    Client approves team job completion. This closes the job and team conversation.
    Requires all workers to have marked their assignments as complete.
    """
    from profiles.models import Conversation, ConversationParticipant
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return {'success': False, 'error': 'Job not found'}
    
    if not job.is_team_job:
        return {'success': False, 'error': 'This is not a team job'}
    
    # Verify client ownership
    client_profile = job.clientID
    if not client_profile or client_profile.profileID.accountFK != client_user:
        return {'success': False, 'error': 'Only the client who posted this job can approve completion'}
    
    # Check job status
    if job.status == 'COMPLETED':
        return {'success': False, 'error': 'Job is already completed'}
    
    if job.status != 'IN_PROGRESS':
        return {'success': False, 'error': f'Cannot complete job with status {job.status}'}

    project_gate_error = _project_multi_day_gate_error(job)
    if project_gate_error:
        return project_gate_error
    
    # Check if all workers have marked complete
    incomplete_workers = JobWorkerAssignment.objects.filter(
        jobID=job,
        assignment_status='ACTIVE',
        worker_marked_complete=False
    )
    
    if incomplete_workers.exists():
        incomplete_count = incomplete_workers.count()
        return {
            'success': False, 
            'error': f'{incomplete_count} worker(s) have not yet marked their work as complete'
        }
    
    payment_method_upper = (payment_method or 'WALLET').upper()
    if payment_method_upper not in ['WALLET', 'CASH']:
        return {'success': False, 'error': 'Invalid payment method. Choose WALLET or CASH'}

    if payment_method_upper == 'CASH' and not cash_proof_url:
        return {'success': False, 'error': 'Cash proof image is required for CASH payment'}

    # Remaining final payment follows the same 50% + materials pattern as regular PROJECT jobs.
    remaining_amount = (job.remainingPayment or Decimal('0.00')) + (job.materialsCost or Decimal('0.00'))
    if remaining_amount <= 0:
        remaining_amount = (job.budget or Decimal('0.00')) * Decimal('0.5')

    # Pre-validate wallet balance BEFORE updating job flags.
    if payment_method_upper == 'WALLET':
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=client_user,
            defaults={'balance': Decimal('0.00')}
        )
        if wallet.balance < remaining_amount:
            return {
                'success': False,
                'error': f'Insufficient wallet balance. You need ₱{remaining_amount:,.2f} but only have ₱{wallet.balance:,.2f}. Please deposit more funds or choose CASH payment.'
            }

    old_status = job.status
    now = timezone.now()

    with transaction.atomic():
        client_wallet, _ = Wallet.objects.get_or_create(
            accountFK=client_user,
            defaults={'balance': Decimal('0.00')}
        )

        if payment_method_upper == 'WALLET':
            client_wallet = Wallet.objects.select_for_update().get(accountFK=client_user)
            # Re-validate balance after acquiring the row lock to prevent races
            if client_wallet.balance < remaining_amount:
                raise ValueError(
                    f'Insufficient wallet balance. Need ₱{remaining_amount:,.2f} '
                    f'but only have ₱{client_wallet.balance:,.2f}. '
                    'Please deposit more funds or choose CASH payment.'
                )
            client_wallet.balance -= remaining_amount
            client_wallet.save(update_fields=['balance'])

        Transaction.objects.create(
            walletID=client_wallet,
            amount=remaining_amount,
            transactionType='PAYMENT',
            status='COMPLETED',
            description=f"Final payment for team job: {job.title}" + (" (cash proof uploaded)" if payment_method_upper == 'CASH' else ""),
            balanceAfter=client_wallet.balance,
            relatedJobPosting=job,
            paymentMethod=payment_method_upper,
        )

        job.status = 'COMPLETED'
        job.clientMarkedComplete = True
        job.clientMarkedCompleteAt = now
        # For team jobs, mark worker complete when client approves (all workers already marked assignments complete)
        job.workerMarkedComplete = True
        job.workerMarkedCompleteAt = now
        job.finalPaymentMethod = payment_method_upper
        job.paymentMethodSelectedAt = now
        job.remainingPaymentPaid = True
        job.remainingPaymentPaidAt = now

        if payment_method_upper == 'CASH':
            job.cashPaymentProofUrl = cash_proof_url
            job.cashProofUploadedAt = now

        job.save()
    
    # Close team conversation
    try:
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            conversation.status = Conversation.ConversationStatus.COMPLETED
            conversation.save()
            print(f"✅ Team conversation {conversation.conversationID} closed for completed team job {job_id}")
            
            # Auto-archive if both parties have reviewed
            from profiles.conversation_service import archive_conversation, should_auto_archive
            if should_auto_archive(conversation):
                archive_result = archive_conversation(conversation)
                print(f"📦 {archive_result.get('message', 'Team conversation auto-archived')}")
    except Exception as e:
        print(f"⚠️ Failed to close team conversation: {str(e)}")
    
    # Update all assignments to COMPLETED status
    JobWorkerAssignment.objects.filter(
        jobID=job,
        assignment_status='ACTIVE'
    ).update(assignment_status='COMPLETED')
    
    # Create completion log
    from accounts.models import JobLog
    JobLog.objects.create(
        jobID=job,
        notes=f"[{timezone.now().strftime('%Y-%m-%d %I:%M:%S %p')}] Client approved team job completion. All {job.total_workers_assigned} workers completed their work.",
        changedBy=client_user,
        oldStatus=old_status,
        newStatus='COMPLETED'
    )
    
    # Notify all workers
    assignments = JobWorkerAssignment.objects.filter(jobID=job, assignment_status='COMPLETED')
    client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
    
    for assignment in assignments:
        worker_account = assignment.workerID.profileID.accountFK
        Notification.objects.create(
            accountFK=worker_account,
            notificationType="TEAM_JOB_COMPLETED",
            title=f"Team Job Completed! 🎉",
            message=f"{client_name} has approved the team job '{job.title}'. Payment is being processed.",
            relatedJobID=job.jobID
        )
    
    return {
        'success': True,
        'job_id': job_id,
        'payment_method': payment_method_upper,
        'amount_paid': float(remaining_amount),
        'workers_completed': job.total_workers_assigned,
        'message': 'Team job completed successfully'
    }
