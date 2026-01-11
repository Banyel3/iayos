# Team Mode: Multi-Skill Multi-Worker Feature

**Status**: ✅ COMPLETE  
**Date**: December 10, 2025  
**Type**: Major Feature - Platform Enhancement  
**Estimated Time**: ~30 hours (spread across multiple sessions)

---

## Overview

The Team Mode feature allows clients to create job postings that require multiple workers across different specializations. For example, a home renovation project might need "2 plumbers + 3 electricians + 1 painter". Each skill slot has its own budget allocation and worker requirements.

---

## Key Features

### 1. Multi-Skill Slots

- Clients can add multiple skill requirements to a single job
- Each skill slot specifies:
  - Specialization (e.g., Plumbing, Electrical)
  - Number of workers needed (1-10)
  - Skill level required (Entry/Intermediate/Expert)
  - Budget allocated for that slot
  - Optional

### 2. Flexible Budget Allocation

- **EQUAL_PER_SKILL**: Budget divided equally among skill slots
- **EQUAL_PER_WORKER**: Budget divided equally among all workers (default)
- **MANUAL**: Client specifies each slot's budget manually
- **SKILL_WEIGHTED**: Based on skill level requirements

### 3. Worker Applications to Skill Slots

- Workers see team job opportunities with slot information
- Workers apply to specific skill slots matching their specialization
- Application includes:
  - Skill slot selection
  - Proposal message
  - Budget confirmation

### 4. Team Conversations (Group Chat)

- One conversation per team job
- All assigned workers + client participate
- ConversationParticipant model tracks each member
- Conversation closes when job completes

### 5. Individual Completion Tracking

- Each worker marks their assignment complete individually
- Client can approve once ALL workers complete
- Automatic conversation closure on job completion

### 6. "Start with Available" Option

- After 7 days, client can start job with partial team
- Reduces filled slots if some remain unfilled
- Unfilled slots are closed

---

## Database Models

### JobSkillSlot

```python
class JobSkillSlot(models.Model):
    skillSlotID = AutoField(primary_key=True)
    jobID = ForeignKey(Job, related_name='skill_slots')
    specializationID = ForeignKey(Specializations)
    workers_needed = PositiveIntegerField(default=1, validators=[1-10])
    budget_allocated = DecimalField(max_digits=10, decimal_places=2)
    skill_level_required = CharField(ENTRY/INTERMEDIATE/EXPERT)
    status = CharField(OPEN/PARTIALLY_FILLED/FILLED/CLOSED)
    notes = TextField(optional)
    createdAt = DateTimeField(auto_now_add)

    # Properties
    - budget_per_worker
    - assigned_count
    - openings_remaining
```

### JobWorkerAssignment

```python
class JobWorkerAssignment(models.Model):
    assignmentID = AutoField(primary_key=True)
    jobID = ForeignKey(Job, related_name='worker_assignments')
    skillSlotID = ForeignKey(JobSkillSlot)
    workerID = ForeignKey(WorkerProfile)
    slot_position = PositiveIntegerField()
    assignment_status = CharField(ACTIVE/COMPLETED/REMOVED/WITHDRAWN)
    worker_marked_complete = BooleanField(default=False)
    worker_marked_complete_at = DateTimeField(null=True)
    completion_notes = TextField(null=True)
    individual_rating = DecimalField(null=True)
    createdAt = DateTimeField(auto_now_add)
```

### ConversationParticipant

```python
class ConversationParticipant(models.Model):
    participantID = AutoField(primary_key=True)
    conversation = ForeignKey(Conversation)
    profile = ForeignKey(Profile)
    participant_type = CharField(CLIENT/WORKER)
    skill_slot = ForeignKey(JobSkillSlot, null=True)
    unread_count = IntegerField(default=0)
    is_archived = BooleanField(default=False)
    joined_at = DateTimeField(auto_now_add)
    last_read_at = DateTimeField(null=True)
```

### Job Model Additions

```python
# Added to Job model:
is_team_job = BooleanField(default=False)
budget_allocation_type = CharField(
    choices=EQUAL_PER_SKILL/EQUAL_PER_WORKER/MANUAL/SKILL_WEIGHTED,
    default='EQUAL_PER_WORKER'
)

# Properties
- total_workers_needed
- total_workers_assigned
- team_fill_percentage
```

### JobApplication Addition

```python
# Added FK to JobApplication:
applied_skill_slot = ForeignKey(JobSkillSlot, null=True)
```

---

## API Endpoints

### Team Job Management

| Method | Endpoint                                              | Description                      |
| ------ | ----------------------------------------------------- | -------------------------------- |
| POST   | `/api/jobs/team/create`                               | Create team job with skill slots |
| GET    | `/api/jobs/{id}/team`                                 | Get team job details with slots  |
| PATCH  | `/api/jobs/{id}/team/slots`                           | Update skill slot statuses       |
| POST   | `/api/jobs/{id}/team/apply`                           | Worker applies to skill slot     |
| POST   | `/api/jobs/{id}/team/assign`                          | Client assigns worker to slot    |
| DELETE | `/api/jobs/{id}/team/workers/{worker_id}`             | Remove worker from slot          |
| POST   | `/api/jobs/{id}/team/start-available`                 | Start with partial team          |
| GET    | `/api/jobs/{id}/team/applications`                    | List applications per slot       |
| POST   | `/api/jobs/{id}/team/approve-completion`              | Client approves team job         |
| POST   | `/api/jobs/{id}/team/worker-complete/{assignment_id}` | Worker marks complete            |

---

## Mobile Frontend

### New Screens

1. **Team Job Creation** (`/jobs/create/team.tsx`)
   - Skill slot management (add/remove/edit)
   - Budget allocation type toggle
   - Workers per slot configuration
   - Category selection per slot

2. **Job Detail Updates** (`/jobs/[id].tsx`)
   - Team Skill Slots section for team jobs
   - Visual slot cards with fill status
   - "Apply to Slot" modal for workers
   - Application success feedback

### API Config Additions

```typescript
// Team Jobs
CREATE_TEAM_JOB: `${API_BASE_URL}/jobs/team/create`,
TEAM_JOB_DETAIL: (id) => `${API_BASE_URL}/jobs/${id}/team`,
TEAM_APPLY_SKILL_SLOT: (jobId) => `${API_BASE_URL}/jobs/${jobId}/team/apply`,
TEAM_APPROVE_COMPLETION: (jobId) => `${API_BASE_URL}/jobs/${jobId}/team/approve-completion`,
TEAM_WORKER_COMPLETE: (jobId, assignmentId) => `${API_BASE_URL}/jobs/${jobId}/team/worker-complete/${assignmentId}`,
TEAM_ASSIGN_WORKER: (jobId) => `${API_BASE_URL}/jobs/${jobId}/team/assign`,
TEAM_REMOVE_WORKER: (jobId, workerId) => `${API_BASE_URL}/jobs/${jobId}/team/workers/${workerId}`,
TEAM_START_AVAILABLE: (jobId) => `${API_BASE_URL}/jobs/${jobId}/team/start-available`,
```

---

## Business Logic

### Budget Distribution Example

```
Total Budget: ₱10,000
Allocation: EQUAL_PER_WORKER

Skill Slots:
- 2 Plumbers → ₱2,500 each = ₱5,000
- 3 Electricians → ₱1,666.67 each ≈ ₱5,000

Total Workers: 5
Budget per worker: ₱2,000
```

### Job Completion Flow

```
1. Workers do their work
2. Each worker marks their assignment complete individually
3. System tracks: all_workers_complete flag
4. Client can only approve when all workers complete
5. Client approval:
   - Job status → COMPLETED
   - All assignments → COMPLETED
   - Conversation → COMPLETED (closed)
   - Notifications sent to all workers
```

### Partial Team Start (After 7 Days)

```
1. Job has 5 slots, only 3 filled after 7 days
2. Client triggers "Start with Available Workers"
3. System:
   - Closes unfilled slots
   - Redistributes budget (optional)
   - Changes job status to IN_PROGRESS
   - Creates team conversation with filled workers
```

---

## Files Modified/Created

### Backend

| File                                                        | Action   | Lines |
| ----------------------------------------------------------- | -------- | ----- |
| `accounts/models.py`                                        | Modified | +200  |
| `accounts/migrations/0063_team_mode_multi_skill_workers.py` | Created  | 180   |
| `profiles/models.py`                                        | Modified | +80   |
| `profiles/migrations/0007_team_conversation_support.py`     | Created  | 60    |
| `profiles/api.py`                                           | Modified | +50   |
| `jobs/schemas.py`                                           | Modified | +150  |
| `jobs/team_job_services.py`                                 | Created  | 700   |
| `jobs/api.py`                                               | Modified | +350  |

### Frontend Mobile

| File                       | Action   | Lines |
| -------------------------- | -------- | ----- |
| `lib/api/config.ts`        | Modified | +15   |
| `app/jobs/create/team.tsx` | Created  | 1000+ |
| `app/jobs/[id].tsx`        | Modified | +250  |

---

## Testing Checklist

### Team Job Creation

- [ ] Create team job with multiple skill slots
- [ ] Verify budget distribution (EQUAL_PER_WORKER)
- [ ] Verify skill slot creation in database
- [ ] Verify job is marked as is_team_job=True

### Worker Application

- [ ] Worker sees team job with skill slots
- [ ] Worker applies to matching skill slot
- [ ] Application linked to correct skill slot
- [ ] Duplicate application to same slot blocked

### Worker Assignment

- [ ] Client accepts worker application
- [ ] Worker assigned to correct slot position
- [ ] Slot status updates (OPEN → PARTIALLY_FILLED → FILLED)
- [ ] Team conversation created with all participants

### Job Completion

- [ ] Each worker marks assignment complete
- [ ] Client cannot approve until all complete
- [ ] Client approval closes job and conversation
- [ ] All workers receive completion notification

### Conversation Behavior

- [ ] Team conversation shows all participants
- [ ] Messages visible to all team members
- [ ] Conversation closes when job completes
- [ ] Closed conversation shows appropriate message

---

## Design Decisions

### Decision 1: Partial Team Scenarios

**Question**: What happens if not all skill slots fill?  
**Answer**: Option C implemented - Client can "Start with Available Workers" after 7 days. Unfilled slots are closed and budget redistributed.

### Decision 2: Default Budget Allocation

**Question**: What's the default allocation method?  
**Answer**: EQUAL_PER_WORKER - Budget divided equally among all individual workers regardless of skill.

### Decision 3: Team Conversations

**Question**: Group chat or individual chats?  
**Answer**: Single group chat where all workers and client participate. Conversation closes when job completes (not when individual workers finish).

---

## Future Enhancements

1. **Individual Worker Rating**: Rate each worker separately after job completion
2. **Skill-Based Budget Weighting**: Automatic weighting based on market rates
3. **Team Lead Assignment**: Designate one worker as coordinator
4. **Progressive Payments**: Pay workers as they individually complete
5. **Team Templates**: Save and reuse common team configurations

---

## Migration Commands

```bash
# Create migrations
python manage.py makemigrations accounts --name team_mode_multi_skill_workers
python manage.py makemigrations profiles --name team_conversation_support

# Apply migrations
python manage.py migrate
```

---

**Last Updated**: December 10, 2025  
**Implementation Time**: ~30 hours across multiple sessions  
**Status**: ✅ COMPLETE - Ready for production testing
