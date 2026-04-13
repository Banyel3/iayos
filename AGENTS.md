# AGENTS.md

Compact ramp-up guide for AI agents working in this repo. Every line is here because an agent would likely get it wrong without it.

## Repo shape

Turborepo monorepo, npm workspaces, **npm only** (no pnpm/yarn).

```
apps/
  backend/              Django 5 REST API  (manage.py lives in src/)
  frontend_web/         Next.js 15 App Router  (agency + admin dashboard only)
  frontend_mobile/
    iayos_mobile/       Expo 54 / React Native  (worker + client flows)
  face-api/             FastAPI + MediaPipe microservice (separate deploy)
```

`packages/` is declared in root `package.json` but does not exist — all packages are under `apps/`.

## Developer commands

```bash
# Recommended: full stack via Docker
cp .env.docker.example .env.docker   # fill values
docker-compose -f docker-compose.dev.yml up --build
# frontend :3000  backend :8000  ml service :8002

# Frontend web (standalone)
cd apps/frontend_web
npm install --legacy-peer-deps       # --legacy-peer-deps required
npm run dev
npm run lint          # ESLint (run separately — build ignores lint errors)
npm run check-types   # tsc --noEmit (run separately — build ignores type errors)
npm run build

# Backend (standalone)
cd apps/backend/src
python manage.py migrate
python manage.py runserver
# or from apps/backend/ using rav task runner:
rav server            # = python manage.py runserver
rav migrate
rav makemigrations

# Mobile
cd apps/frontend_mobile/iayos_mobile
npm install
npm start             # Expo dev server
npm run android
npm run update-ip     # PowerShell — rewrites .env.local with current LAN IP
```

## Critical: `next build` never fails on errors

`next.config.ts` sets both `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`.  
**Always run `npm run check-types` and `npm run lint` separately** — a passing build does not mean clean code.

## Critical: Django Ninja UUID patch

`ninja_patch.py` **must be the first import in `settings.py`**. It removes `'uuid'` from Django Ninja's `DEFAULT_CONVERTERS` to avoid a `ValueError` on Django 5.x. Without it Django fails to start. In CI, the equivalent `sed` patch is applied to `ninja/signature/utils.py` before any Django command runs.

## Backend database selection (settings.py logic)

1. `DATABASE_TEST_URL` env var set → use test DB  
2. `USE_LOCAL_DB=true` → use `DATABASE_URL_LOCAL` (no SSL; also enables local file storage instead of Supabase)  
3. Default → use `DATABASE_URL` (Neon cloud, SSL required)

Setting `USE_LOCAL_DB=true` also forces `USE_LOCAL_STORAGE=true` (media served from `apps/backend/src/media/`).

## Backend: ASGI + Redis

- ASGI server is **Daphne** (not gunicorn/uvicorn) — Django Channels + WebSockets.
- `start.sh` auto-starts an embedded Redis if `REDIS_URL` is unset, `none`, or localhost. Set `REDIS_URL=none` to force in-memory Channel Layer.

## Tests

### Backend (pytest)

`pytest`, `pytest-django`, `pytest-cov` are **not** in `requirements.txt` — install separately:

```bash
pip install pytest pytest-cov pytest-django
```

Required services: PostgreSQL + Redis must be running.

```bash
# Minimal env for local run (from apps/backend/src/)
USE_LOCAL_DB=true \
DATABASE_URL_LOCAL=postgresql://iayos_user:iayos_local_pass@localhost:5432/iayos_test_db \
REDIS_URL=redis://localhost:6379/0 \
DJANGO_SECRET_KEY=test-secret-key \
DEBUG=False \
pytest -v

# Single file
pytest accounts/tests/test_worker_api.py -v
```

Tests in CI use `|| true` — currently non-blocking.

### Frontend E2E (Playwright)

Requires backend on :8000 and frontend on :3000 (full stack).

```bash
cd apps/frontend_web
npx playwright test --project=chromium
npx playwright test e2e/some_test.spec.ts   # single file
```

Tests send `X-Test-Mode: true` header. Reports go to `playwright-report/` and `test-results/`.

### Mobile E2E (Maestro — active in CI)

Requires a pre-built APK from GitHub Releases + **live production backend** (`https://api.iayos.online`).  
Test credentials must exist in the production DB: `worker.test@iayos.com` / `Test1234!`, `client.test@iayos.com` / `Test1234!`.

```bash
maestro test apps/frontend_mobile/iayos_mobile/.maestro/auth
maestro test apps/frontend_mobile/iayos_mobile/.maestro   # all suites
```

**Detox is disabled** — workflow file is `.disabled`, do not try to run it in CI.

### Backend linting (not in requirements.txt)

```bash
pip install ruff black flake8
cd apps/backend/src
ruff check . --output-format=github
black --check --diff .
flake8 . --max-line-length=120 --extend-ignore=E203,W503
```

## Web app scope

The Next.js app is **agency and admin dashboard only**.  
Workers and clients are mobile-only. `/dashboard/*` permanently redirects to `/mobile-only`.  
Only `/agency/*` and `/admin/*` routes exist for real use.

## Prisma: present but inactive

`apps/frontend_web/prisma/schema.prisma` exists and `lib/generated/prisma/` is the output path.  
`lib/prisma.ts` exports `null` — the ORM layer is commented out. The web frontend communicates with Django via HTTP, not direct DB. Do not run `prisma generate` without knowing this. Drizzle ORM is also in `package.json` but unused.

## Mobile: LAN IP

Physical devices cannot reach `localhost`. Run `npm run update-ip` (PowerShell) from `apps/frontend_mobile/iayos_mobile/` whenever the network changes. This rewrites `.env.local` with the current machine's LAN IP (`EXPO_PUBLIC_DEV_IP`).

## Mobile: app ID mismatch

`app.json` declares `com.iayos.mobile`; Maestro `config.yaml` targets `com.devante.iayos`. These differ — the actual installed package ID after `expo prebuild` comes from `build.gradle`.

## TensorFlow / ML service

TensorFlow requires glibc — it **cannot run on Alpine Linux**.  
- Main backend uses Alpine (`Dockerfile`) with `requirements.txt` — no TF.  
- ML service uses `Dockerfile.ml` (Debian) with `requirements-ml.txt`.  
- ML service runs separately on port 8002.  
- Face detection is a separate FastAPI microservice (`apps/face-api/`) deployed on Render free tier — expect 30–60 s cold starts.

## npm installs

Always pass `--legacy-peer-deps` for frontend packages. This is used in all CI steps.

## CI overview

| Workflow | Trigger |
|---|---|
| `test.yml` | Push/PR to `main`/`dev` — pytest + Jest in parallel |
| `lint.yml` | Push/PR to `main`/`dev` — ESLint/tsc + Ruff/Black/Flake8 |
| `e2e.yml` | Nightly 03:00 UTC — Playwright full stack |
| `maestro-tests.yml` | After mobile release or PR to mobile paths |
| `deploy-backend.yml` | Push to `main` → DigitalOcean App Platform |
| `mobile-release.yml` | Manual `workflow_dispatch` — build APK + GitHub release |
| `health-check.yml` | Every 5 min cron |

## Key env vars (non-obvious ones)

| Var | Where | Note |
|---|---|---|
| `BACKEND_PROXY_URL` | frontend_web server-only | Enables Next.js API rewrite proxy to avoid CORS; do NOT set `NEXT_PUBLIC_API_URL` when using this |
| `SERVER_API_URL` | frontend_web server-only | Internal Docker URL `http://backend:8000` for SSR |
| `USE_LOCAL_DB` | backend | `true` → local postgres + local file storage |
| `DATABASE_TEST_URL` | backend | DB name must contain `"test"` |
| `PAYMENT_PROVIDER` | backend | `paymongo` (default) or `xendit` |
| `TESTING` | backend | `true` enables GCash direct deposit test flow |
| `EXPO_PUBLIC_DEV_IP` | mobile `.env.local` | LAN IP; auto-set by `update-ip` script |
| `REDIS_URL=none` | backend | Forces in-memory Channel Layer |
| `RATE_LIMIT_DISABLED` | backend | Dev only |

## Django management commands

```bash
python manage.py seed_data          # seed reference data
python manage.py create_admin       # create default admin user
python manage.py create_test_users  # create Maestro test credentials
python manage.py clear_rate_limits --all
```

## Job-flow fixes: Single Day + Team Job + Project Rate + Same Worker Multiple Roles

This flow has special handling because one worker can hold multiple team skill slots (multiple assignments) but still maps to one worker account for review and some UI states.

### Session commits (chronological)

- `f38d4ab` — fix(mobile): handle multi-role team applications in job detail
  - `apps/backend/src/accounts/mobile_services.py`
  - Replaced `JobApplication.objects.get(jobID, workerID)` with ordered queryset logic.
  - Prevents `MultipleObjectsReturned` when same worker applied to multiple team roles.
  - Added deterministic primary selection (`ACCEPTED > PENDING > REJECTED > WITHDRAWN`) and exposed `user_applications` list for team jobs.

- `b9d9091` — fix(team-daily): enforce client-first arrival flow
  - `apps/backend/src/accounts/mobile_api.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Blocked worker-side `worker-check-in` for `team + DAILY` (client confirms arrival first).
  - Worker UI shows waiting state instead of active "On The Way".

- `046b0a0` — fix(mobile): hide attendance card for one-day team project
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Hid Attendance card specifically for one-day team project flow.
  - Team Arrival Status is the source of truth in this flow.

- `3e14595` — fix(mobile): restore worker complete action for one-day team project
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Re-enabled worker "Mark My Work Complete (All Assigned Roles)" for one-day team project.
  - Removed suppressions that hid worker completion after client arrival confirmation.

- `9d713d3` — fix(mobile): show team project approve-pay CTA outside attendance
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Moved client "Approve & Pay Team" CTA out of Attendance container.
  - Prevents missing finalization CTA after Attendance card was hidden.

- `0ef5cad` — fix(reviews): handle multi-role team worker review visibility
  - `apps/backend/src/profiles/api.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Backend review completion for team client view now uses unique worker account IDs (not assignment count).
  - Fixes "No review data available" in completed multi-role same-worker jobs.
  - Also improved review modal key logic groundwork.

- `e5234b9` — fix(mobile): dedupe team review checklist keys by target
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Review modal checklist now dedupes by review target identity:
    - WORKER key uses account/worker identity (not slot row)
    - EMPLOYEE key uses employee identity
  - Fixes Expo/React duplicate key error (`WORKER-<id>`) when same worker appears in multiple slots.

### Guardrails for future changes in this flow

- Never assume one `JobApplication` per `(job, worker)` in team jobs.
- Review completion for team jobs must be based on unique worker accounts, not assignment row count.
- UI lists used for review/checklist must dedupe by review target identity, not per skill-slot assignment.
- In one-day team project flow:
  - Arrival UX should rely on Team Arrival Status.
  - Worker completion and client final approve/pay CTAs must remain visible independently of Attendance card visibility.

## Job-flow fixes: Multi Day + Team Job + Project Rate + Same Worker Multiple Roles

This flow now uses assignment-completion as the primary day-cycle signal while keeping final payout only at client final approval.

### Session commits (chronological)

- `a4bbcac` — fix(team-project): align multi-day flow with assignment completion
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - `apps/backend/src/jobs/api.py`
  - Hid Attendance card for team PROJECT multi-day (match team DAILY UX direction).
  - Enabled worker phase-2 completion action in multi-day team project.
  - Extended QA skip-next-day reset branch to include team PROJECT multi-day.

- `2b4f285` — fix(team-project): allow worker complete in multi-day flow
  - `apps/backend/src/jobs/api.py`
  - `apps/backend/src/jobs/team_job_services.py`
  - Removed project-duration gate from worker team completion endpoint/service.
  - Worker can mark per-day completion in multi-day; final completion/payment remains client-gated.

- `47a3c4b` — fix(mobile): clarify multi-day team completion messaging
  - `apps/frontend_mobile/iayos_mobile/lib/hooks/useJobActions.ts`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Updated worker completion toast/waiting copy to day-cycle messaging for PROJECT multi-day.

- `383d1e5` — fix(mobile): show team multi-day approve-pay at duration
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Restored final client CTA (`Approve & Pay Team`) for duration-reached team PROJECT multi-day.
  - Placed finalization actions outside attendance-gated section.
  - Suppressed per-assignment early-pay CTA when final duration actions are active.

- `d293981` — fix(team-project): sync multi-day progress from assignment completion
  - `apps/backend/src/jobs/team_job_services.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Added backend sync to settle effective-day PROJECT progress from assignment completion.
  - Auto-confirms effective-day attendance rows (idempotent) and syncs `total_days_worked`.
  - Added QA-aware wording when duration gate is reached via testing offset.

- `fcece5b` — fix(mobile): show final-waiting copy at project duration
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Worker waiting copy now switches from "next workday cycle" to final-approval wording when duration is reached.

- `6efb8b7` — fix(team-project): allow early final close after full early-complete
  - `apps/backend/src/jobs/api.py`
  - `apps/backend/src/jobs/team_job_services.py`
  - Allows PROJECT multi-day final close before planned duration when all active/completed team assignments are early-completed.

- `4c47d8b` — fix(team-project): auto-finalize fully early-completed team jobs
  - `apps/backend/src/jobs/team_job_services.py`
  - `apps/backend/src/profiles/api.py`
  - Adds PROJECT autoheal/finalization for fully early-completed team jobs.
  - Prevents payout redistribution in final approve path when early-complete already settled assignments.
  - Runs read-time autoheal so previously stuck in-progress jobs can be finalized safely.

- `3fc80e6` — fix(team-absent): block worker complete and add absent warning
  - `apps/backend/src/jobs/team_job_services.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Worker completion is blocked when client marked the worker absent for the effective day.
  - Client UI now warns that incorrect absent marking can cause suspension/penalties.

- `97279f6` — fix(mobile): resolve absent warning string syntax error
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Fixes malformed template string that caused Expo iOS bundling parse failure.

- `e0a4fb1` — fix(team-project): ignore QA offset for duration completion gates
  - `apps/backend/src/jobs/api.py`
  - `apps/backend/src/jobs/team_job_services.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Keeps QA skip/effective-day simulation but removes QA offset from PROJECT duration completion/finalization gating.
  - Prevents premature "Project Duration Reached" and final approve/pay prompts when only QA offset advanced.

### Guardrails for future changes in this flow

- Keep final payout/final closure only in client final approval path; worker completion is day-cycle progress only.
- For team PROJECT multi-day, use assignment completion + team arrival state as primary UX, not attendance card UI.
- Ensure duration-reached client CTA is rendered independently of attendance container visibility.
- Keep QA skip-next-day reset logic aligned for team PROJECT multi-day so next-day state does not inherit stale completion flags.
- Keep `total_days_worked` synchronized with effective-day settlement signals to avoid `Worked X/Y` drift.
- For same-worker multi-role cases, always compute completion/review/checklist states by target identity (worker account), not slot row count.
- QA day offset is for TESTING effective-day simulation only; do not use offset alone to satisfy PROJECT duration completion/finalization gates.
- When client marks a worker absent for the effective day, worker completion CTA must stay hidden and backend must reject worker complete for that day.
- Fully early-completed PROJECT team jobs should auto-finalize lifecycle without re-running payout distribution.

## Job-flow fixes: Agency -> Client + One-Day + PROJECT Rate (Client-First Arrival)

This flow now enforces client-side arrival confirmation first for one-day agency project jobs and keeps agency guidance/completion states in sync.

### Session commits (chronological)

- `6bf4281` — fix(agency-flow): enforce client-first arrival in one-day project jobs
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - Mobile: prevents duplicate attendance UI by excluding one-day agency project flow from legacy attendance block.
  - Web: disables dispatch-first workflow for one-day non-team PROJECT jobs.

- `9280ce5` — fix(agency-chat): show arrival-first guidance and clarify ws fallback state
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - `apps/frontend_web/lib/services/websocket.ts`
  - Added agency guidance card for client-first arrival flow (resolved count + guidance copy).
  - Updated reconnecting banner copy to clarify fallback sync behavior.
  - Improved default websocket base URL behavior for same-origin/proxy environments.

- `87f6dad` — fix(agency-chat): sync one-day arrival guidance with assignment arrival state
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - Guidance card resolution now uses assignment-level arrival (`clientConfirmedArrival`) as primary signal (with attendance fallback), fixing stale `Resolved 0/1` after client confirms.

- `233a8e4` — fix(agency-chat): surface complete action in one-day arrival-first flow
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - Restored agency next-step CTA after arrival resolution.
  - One-day arrival-first card now shows `Ready to complete` + `Complete Job`, and `Waiting for client approval and payment` after agency marks complete.

- `bb1603c` — fix(agency-chat): replace browser confirm with complete-job modal
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - Replaced browser `window.confirm` with in-app confirmation modal for `Complete Job` action.

### Guardrails for future changes in this flow

- For one-day, non-team, agency PROJECT jobs, keep attendance client-first (confirm arrival / mark absent) and do not reintroduce agency dispatch-first CTA.
- Do not render both legacy attendance and unified arrival UI simultaneously on mobile.
- In agency web, keep one-day arrival-first guidance and completion CTA in the same flow path (avoid blank state after disabling dispatch).
- Resolve arrival state from assignment identity (`clientConfirmedArrival`) first; use attendance rows as fallback only.
- After all arrivals are resolved, agency must see a clear completion action (`Complete Job`) without needing extra navigation.
- Confirmation UX for completion should remain in-app modal (no browser confirm dialogs).
- Keep reconnecting banner messaging explicit that messages can still sync via fallback refresh when websocket is down.

## Job-flow fixes: Agency -> Client + Multi-Day + PROJECT Rate (Single Worker)

This flow now mirrors client-first arrival semantics from one-day jobs while keeping payout/finalization client-driven.

### Session updates

- Agency web now treats one-worker multi-day PROJECT as client-first arrival flow (no dispatch-first card).
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - Added dedicated multi-day guidance card with:
    - assignment-first arrival resolution (`clientConfirmedArrival`, attendance fallback)
    - `Worked X/Y` progress badge
    - duration-aware next states (`waiting`, `ready to complete`, `waiting for client approval/payment`)
  - Final action remains agency `Complete Job` only after duration gate is reached.

- Client mobile keeps/testing controls and now supports early full close for agency single-worker multi-day PROJECT.
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - QA Skip Next Day remains available in TESTING mode for multi-day PROJECT.
  - Existing Project End Actions remain available at duration reached (`Extend +1 Day`, finish/approve and pay).
  - `Finish Early & Pay Full Amount` now also appears for agency single-worker multi-day PROJECT.

- Backend early-complete now supports agency-assigned single-worker PROJECT jobs.
  - `apps/backend/src/jobs/team_job_services.py`
  - `early_complete_single_project_job` now resolves payout account for:
    - direct worker jobs (unchanged), and
    - agency jobs (credits agency wallet pending earnings)
  - Requires client-confirmed arrival before early-complete (assignment signal first, attendance fallback).
  - Preserves idempotent completion behavior and closes conversation lifecycle consistently.

### Guardrails for future changes in this flow

- For non-team agency PROJECT multi-day, keep attendance client-first; do not reintroduce dispatch-first UI.
- Agency web should stay final-only (no pay action buttons on agency side); client retains approval/payment authority.
- Multi-day completion gate must use real worked-day progress (`total_days_worked`), not QA offset alone.
- Keep QA skip-next-day as TESTING-only simulation and retain per-day state reset behavior.
- Keep early-finish full payout path available to client for agency single-worker multi-day PROJECT jobs.
- Early-complete settlement target for agency jobs is the agency wallet pending earnings, not an individual employee wallet.

## Job-flow fixes: Agency -> Client + PROJECT Rate (Multi Employee, Non-Team)

This flow keeps final-only payout at agency level while using per-employee operational status (arrival/completion) as readiness gates.

### Session updates

- Agency web now supports per-employee completion progression for non-team multi-employee PROJECT jobs.
  - `apps/frontend_web/app/agency/messages/[id]/page.tsx`
  - `apps/frontend_web/lib/hooks/useAgencyDailyAttendance.ts`
  - Added project employee complete mutation (`/api/agency/jobs/{job_id}/employees/{employee_id}/mark-complete-project`) for web.
  - One-day and multi-day arrival-first cards now show per-employee `Mark Complete` actions for multi-employee flows.
  - Generic job-level `Complete Job` remains available only after required per-employee completion state is satisfied.

- Backend generic `mark-complete` now enforces aggregate readiness for agency multi-employee jobs.
  - `apps/backend/src/jobs/api.py`
  - For agency jobs with multiple active assignments, endpoint now validates each assignment workflow (`dispatched`, `arrival confirmed`, `agency complete`) before allowing final mark complete.
  - Prevents premature bulk completion when some assigned employees are still in-progress.
  - Legacy auto-sync of assignment completion remains only for single-assignment agency jobs.

- Early-finish scope is now explicit for agency jobs.
  - `apps/backend/src/jobs/team_job_services.py`
  - `apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx`
  - Early-complete endpoint now rejects agency jobs with multiple active assignments (single-assignment only).
  - Mobile early `Finish Early & Pay Full Amount` CTA is constrained to jobs with at most one assigned agency employee.

### Guardrails for future changes in this flow

- For non-team agency PROJECT jobs with multiple employees, keep payout destination agency-only; employees are operational assignees, not payout recipients.
- Keep client settlement final-only (single bulk approve/pay action) and gate it on all active assignments reaching required workflow state.
- Do not use generic job-level mark-complete as a shortcut to mass-complete assignments when multi-employee assignments are still incomplete.
- Resolve readiness by assignment identity (`JobEmployeeAssignment`) and current-cycle status, not by message text or job-level booleans alone.
- Keep per-employee completion actions available in agency UI so progress can advance without forcing all-at-once completion.
- Restrict early full-finish to single-assignment agency jobs unless a dedicated multi-employee early-settlement policy is implemented.

## rav task runner

`rav` (v0.1.0) is configured in `apps/backend/rav.yaml`. Available shortcuts from `apps/backend/`:

```
rav server          → cd src && python manage.py runserver
rav migrate         → cd src && python manage.py migrate
rav makemigrations  → cd src && python manage.py makemigrations
```
