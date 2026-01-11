# Plan: RNN Budget Suggestion Model + Team Mode Multi-Skill Multi-Worker Feature

The iAyos platform needs two parallel enhancements: (1) field restructuring for RNN-based budget predictions, and (2) team mode functionality allowing clients to hire **multiple workers per specialization** (e.g., 2 plumbers + 3 electricians) for a single job. Budget can be distributed per-skill or per-worker with flexible allocation strategies.

## Steps

### 1. Add Team Mode Database Schema with Per-Skill Worker Counts

Create models in `apps/backend/src/accounts/models.py`:

**JobSkillSlot Model:**

- `jobID` FK to Job
- `specializationID` FK to Specializations
- `workers_needed` integer [1-10]
- `budget_allocated` decimal
- `skill_level_required` choices (ENTRY/INTERMEDIATE/EXPERT)
- `status` choices (OPEN/PARTIALLY_FILLED/FILLED)

**JobSkillAssignment Model:**

- `jobID` FK to Job
- `skillSlotID` FK to JobSkillSlot
- `assignedWorkerID` FK to WorkerProfile
- `slot_position` integer (1st plumber, 2nd plumber, etc.)
- `assignment_status` choices (ACTIVE/COMPLETED/REMOVED)

**Job Model Additions:**

- `is_team_job` boolean (default False)
- `total_workers_needed` integer (computed sum)
- `budget_allocation_type` choices:
  - EQUAL_PER_SKILL
  - EQUAL_PER_WORKER
  - MANUAL_ALLOCATION
  - SKILL_WEIGHTED

**Migration:** `0062_team_mode_multi_skill_workers.py`

---

### 2. Build Team Job Creation UI with Per-Skill Worker Count

Modify `apps/frontend_mobile/iayos_mobile/app/jobs/create/index.tsx`:

- Add "Team Mode" toggle (shows after category selection)
- When enabled, show **repeatable skill slot cards** with:
  - (a) Specialization dropdown (filtered by compatible skills with selected category)
  - (b) Worker count stepper (1-10 workers per skill)
  - (c) Budget input OR auto-calculated based on allocation strategy dropdown (EQUAL_PER_SKILL default)
  - (d) Skill level selector per slot (Entry/Intermediate/Expert)
- Display **live budget breakdown** showing per-skill allocation and per-worker split
- Validate total budget ≥ sum of slot budgets

---

### 3. Implement Budget Allocation Strategies

Add allocation strategy selector in job creation form with 4 options:

| Strategy                  | Description                                                                                                     | Example (₱6000 total, 3 skills, 5 workers) |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **(A) Equal Per Skill**   | Divide total budget equally across N skills regardless of worker count                                          | ₱6000 / 3 skills = ₱2000/skill             |
| **(B) Equal Per Worker**  | Divide total budget by total worker count, then multiply by workers per skill                                   | ₱6000 / 5 workers = ₱1200/worker           |
| **(C) Manual Allocation** | Client sets budget per skill manually with live remaining balance indicator                                     | Client decides per slot                    |
| **(D) Skill-Weighted**    | Auto-calculate based on skill level: Expert=1.5x, Intermediate=1.2x, Entry=1.0x, then normalize to total budget | Auto-calculated by weights                 |

Backend validates allocation sums to total budget ±1% tolerance for rounding.

---

### 4. Create Skill-Filtered Applications System

Modify `apps/frontend_mobile/iayos_mobile/app/applications/index.tsx`:

- Show **skill-based tabs** when viewing team job applications:
  - Tabs: `All / Plumbing [2/2] / Electrical [1/3] / Carpentry [0/2]`
- Workers apply by selecting which skill slot they're qualified for via dropdown in application modal
- Backend `JobApplication` adds `applied_skill_slot_id` FK linking to `JobSkillSlot`
- Application cards show slot info: "Plumbing Position (2 openings)" with badge showing "₱1200 per worker" or "₱2400 skill budget"

---

### 5. Standardize Duration + Add ML Context Fields

**Duration Field (Required):**
Replace free-text `expectedDuration` with dropdown:

- "<4 hours"
- "4-8 hours"
- "1 day"
- "2-3 days"
- "1 week"
- "1+ weeks"

**Per-Slot Fields:**

- `projectScope` (Small/Medium/Large - affects budget weight)
- `skillLevelRequired` (already in slot model)

**Job-Level Fields:**

- `requiresSpecializedEquipment` boolean
- `mustCompleteBy` absolute deadline date
- `budgetJustification` optional text for NLP

**Materials Enhancement:**
Convert `materialsNeeded` to structured format:

```typescript
{
  name: string,
  estimatedCost?: number,
  providedByClient: boolean
}[]
```

**Schema Update:**
Update `apps/backend/src/jobs/schemas.py` with `CreateTeamJobMobileSchema` including `skill_slots` array.

---

### 6. Build Team Assignment & Slot Management APIs

Create endpoints in `apps/backend/src/jobs/api.py`:

**Accept Application for Slot:**

```
POST /jobs/{id}/skills/{slot_id}/accept-application
```

- Validates worker specialization matches slot
- Checks slot capacity (current_assigned < workers_needed)
- Creates `JobSkillAssignment`
- Updates slot status (OPEN → PARTIALLY_FILLED → FILLED)

**Get Skill Slots:**

```
GET /jobs/{id}/skill-slots
```

- Returns slots with fill status, budget info, assigned workers array per slot

**Auto-Transition Logic:**

- When **all slots** reach FILLED status, auto-transition job to IN_PROGRESS
- Create group conversation with all assigned workers + client

**Worker Removal:**

- Handle worker removal/replacement scenarios with slot reopening logic

---

## Further Considerations

### 1. Budget Allocation Recommendation

**Suggested Default: Equal Per Worker (Option B)** because it's fairest and most intuitive (each worker earns same amount regardless of skill unless client manually adjusts).

**Alternative Enhancement:** Add "Smart Allocation" button that analyzes historical average rates per specialization from `Specializations.minimumRate` and distributes budget proportionally:

- Example: Plumbers avg ₱800/day, Electricians avg ₱1200/day → allocate 40% vs 60% of budget

---

### 2. Partial Team Scenarios

How to handle when only some slots fill?

| Option | Description                                            | Pros           | Cons                         |
| ------ | ------------------------------------------------------ | -------------- | ---------------------------- |
| **A**  | Job stays ACTIVE indefinitely                          | Simple         | Client stuck waiting         |
| **B**  | Auto-cancel after 7 days with refund                   | Clear deadline | Harsh on workers             |
| **C**  | Allow client to approve "Start with available workers" | Flexible       | Requires budget reallocation |
| **D**  | Let client manually close unfilled slots and proceed   | Full control   | Complex UX                   |

**Recommendation:** Option C with 7-day soft deadline notification.

---

### 3. Team Communication Architecture

**Recommended: Hybrid Approach**

1. Create ONE group conversation:
   - Add `conversation_type: 1:1 | GROUP` field to `Conversation` model
2. Add `ConversationParticipants` junction table:
   - `conversationID` FK
   - `participantProfileID` FK
   - `role`: CLIENT / WORKER / AGENCY
3. All team workers + client in single thread for coordination

4. Optional: Add per-worker DMs as separate conversations for individual issues

This balances team coordination with privacy concerns.

---

## Implementation Priority

1. **Phase 1 (Database):** Step 1 - Schema & migrations
2. **Phase 2 (Backend):** Step 6 - APIs for slot management
3. **Phase 3 (Frontend):** Steps 2, 3, 4 - Team creation & applications UI
4. **Phase 4 (ML Prep):** Step 5 - Duration standardization & context fields

---

## Estimated Effort

| Component                   | Hours      | Complexity |
| --------------------------- | ---------- | ---------- |
| Database Schema             | 4-6h       | Medium     |
| Team Job Creation UI        | 12-16h     | High       |
| Budget Allocation Logic     | 6-8h       | Medium     |
| Skill-Filtered Applications | 8-12h      | High       |
| ML Context Fields           | 4-6h       | Low        |
| Team Assignment APIs        | 10-14h     | High       |
| Group Conversations         | 8-12h      | Medium     |
| **Total**                   | **52-74h** | **High**   |
