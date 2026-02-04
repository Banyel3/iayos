# ===========================================================================
# TEAM JOB SERVICES - Multi-Skill Multi-Worker Business Logic
# ===========================================================================

from decimal import Decimal
from typing import Optional
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone

from accounts.models import (
    Job, JobSkillSlot, JobWorkerAssignment, JobApplication,
    Specializations, Profile, WorkerProfile, ClientProfile, Notification, Transaction, Wallet
)
from profiles.models import Conversation, ConversationParticipant


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
    materials_needed: Optional[list] = None,
    payment_method: str = 'WALLET'
) -> dict:
    """
    Create a team job with multiple skill slot requirements.
    
    Returns dict with job details and any payment info needed.
    """
    from datetime import datetime
    
    # Validate skill slots
    if not skill_slots_data or len(skill_slots_data) == 0:
        return {'success': False, 'error': 'At least one skill slot is required'}
    
    total_workers = sum(slot.get('workers_needed', 1) for slot in skill_slots_data)
    if total_workers < 2:
        return {'success': False, 'error': 'Team jobs require at least 2 workers total'}
    
    # Validate specializations exist
    spec_ids = [slot['specialization_id'] for slot in skill_slots_data]
    existing_specs = Specializations.objects.filter(specializationID__in=spec_ids).values_list('specializationID', flat=True)
    missing = set(spec_ids) - set(existing_specs)
    if missing:
        return {'success': False, 'error': f'Invalid specialization IDs: {missing}'}
    
    # Calculate budget allocation
    budget_allocations = calculate_budget_allocation(
        Decimal(str(total_budget)), skill_slots_data, allocation_type
    )
    
    # Validate manual allocation totals match
    if allocation_type == 'MANUAL_ALLOCATION':
        allocated_sum = sum(alloc['budget'] for alloc in budget_allocations)
        if abs(allocated_sum - Decimal(str(total_budget))) > Decimal('1'):  # Allow ₱1 variance
            return {'success': False, 'error': f'Manual allocation total (₱{allocated_sum}) does not match total budget (₱{total_budget})'}
    
    # Get client's profile
    client_profile_obj = client_profile if isinstance(client_profile, Profile) else Profile.objects.get(profileID=client_profile)
    
    # Get or verify ClientProfile exists
    try:
        client_profile_record = ClientProfile.objects.get(profileID=client_profile_obj)
    except ClientProfile.DoesNotExist:
        return {'success': False, 'error': 'Client profile not found. Only clients can create team jobs.'}
    
    # Check wallet balance for escrow (50% of total)
    escrow_amount = Decimal(str(total_budget)) * Decimal('0.5')
    platform_fee = escrow_amount * Decimal('0.05')  # 5% of downpayment
    total_needed = escrow_amount + platform_fee
    
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
    
    # Create the job
    job = Job.objects.create(
        clientID=client_profile_record,
        title=title,
        description=description,
        location=location,
        budget=Decimal(str(total_budget)),
        urgency=urgency,
        preferredStartDate=datetime.strptime(preferred_start_date, '%Y-%m-%d').date() if preferred_start_date else None,
        materialsNeeded=materials_needed or [],
        jobType='LISTING',  # Team jobs are listings
        status='ACTIVE',
        is_team_job=True,
        budget_allocation_type=allocation_type,
        team_job_start_threshold=Decimal(str(team_start_threshold))
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
            description=f'Team job escrow (50%) for: {title} (Platform fee: ₱{platform_fee})'
        )
    
    # Create team group conversation immediately for early communication
    # Workers will be added as participants when their applications are accepted
    conversation, created = Conversation.create_team_conversation(
        job_posting=job,
        client_profile=client_profile
    )
    
    return {
        'success': True,
        'job_id': job.jobID,
        'skill_slots_created': len(created_slots),
        'total_workers_needed': total_workers,
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
        
        skill_slots.append({
            'skill_slot_id': slot.skillSlotID,
            'specialization_id': slot.specializationID_id,
            'specialization_name': slot.specializationID.specializationName,
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
        
        assignments.append({
            'assignment_id': assignment.assignmentID,
            'worker_id': worker.id,  # Use .id (primary key), not .workerID
            'worker_name': f"{profile.firstName} {profile.lastName}",
            'worker_avatar': profile.profileImg or None,  # profileImg is a CharField (URL string), not FileField
            'worker_rating': float(worker.workerRating) if worker.workerRating else None,  # workerRating, not rating
            'skill_slot_id': assignment.skillSlotID_id,
            'specialization_name': assignment.skillSlotID.specializationID.specializationName,
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
    
    try:
        skill_slot = JobSkillSlot.objects.get(skillSlotID=skill_slot_id, jobID=job)
    except JobSkillSlot.DoesNotExist:
        return {'success': False, 'error': 'Skill slot not found for this job'}
    
    if skill_slot.status not in ['OPEN', 'PARTIALLY_FILLED']:
        return {'success': False, 'error': f'Skill slot is not accepting applications (status: {skill_slot.status})'}
    
    # Check if worker already applied to this slot
    existing = JobApplication.objects.filter(
        jobID=job,
        workerID=worker_profile,
        applied_skill_slot=skill_slot
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
    
    skill_slot = application.applied_skill_slot
    if not skill_slot:
        return {'success': False, 'error': 'Application not associated with a skill slot'}
    
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
    
    # Update slot status
    new_assigned = current_assigned + 1
    if new_assigned >= skill_slot.workers_needed:
        skill_slot.status = 'FILLED'
    else:
        skill_slot.status = 'PARTIALLY_FILLED'
    skill_slot.save()
    
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
    
    # ==========================================================================
    # CRITICAL: Pre-validate wallet balance BEFORE marking job as complete
    # This prevents the bug where job is marked COMPLETED but payment fails
    # ==========================================================================
    payment_method_upper = (payment_method or 'WALLET').upper()
    
    if payment_method_upper == 'WALLET':
        from accounts.models import Wallet
        from decimal import Decimal
        
        # Get or create wallet for client
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=client_user,
            defaults={'balance': Decimal('0')}
        )
        
        # Calculate remaining payment (50% of budget)
        remaining_amount = job.budget * Decimal('0.5')
        
        # Check if client has sufficient balance BEFORE proceeding
        if wallet.balance < remaining_amount:
            print(f"❌ [TeamJob] Wallet balance check FAILED: Need ₱{remaining_amount}, have ₱{wallet.balance}")
            return {
                'success': False,
                'error': f'Insufficient wallet balance. You need ₱{remaining_amount:,.2f} but only have ₱{wallet.balance:,.2f}. Please deposit more funds or choose CASH payment.'
            }
        
        print(f"✅ [TeamJob] Wallet balance check PASSED: Need ₱{remaining_amount}, have ₱{wallet.balance}")
    
    # Mark job as completed
    old_status = job.status
    job.status = 'COMPLETED'
    job.clientMarkedComplete = True
    job.clientMarkedCompleteAt = timezone.now()
    # For team jobs, mark worker complete when client approves (all workers already marked their assignments complete)
    job.workerMarkedComplete = True
    job.workerMarkedCompleteAt = timezone.now()
    # Mark remaining payment as paid (team jobs handle payment differently - escrow was paid at creation)
    job.remainingPaymentPaid = True
    job.remainingPaymentAt = timezone.now()
    
    if cash_proof_url:
        job.cashPaymentProofUrl = cash_proof_url
        job.cashProofUploadedAt = timezone.now()
    
    job.save()
    
    # Close team conversation
    try:
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            conversation.status = Conversation.ConversationStatus.COMPLETED
            conversation.save()
            print(f"✅ Team conversation {conversation.conversationID} closed for completed team job {job_id}")
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
        'workers_completed': job.total_workers_assigned,
        'message': 'Team job completed successfully'
    }
