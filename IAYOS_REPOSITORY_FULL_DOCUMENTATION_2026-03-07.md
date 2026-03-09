# iAyos Repository Full Documentation

Generated: 2026-03-07
Scope: Full repository scan of `c:\code\iayos`
Purpose: Comprehensive technical reference covering modules, features, architecture, workflows, and operational systems.

## 1. Executive Overview

`iAyos` is a multi-application marketplace platform connecting clients, workers, and agencies for blue-collar service jobs. The repository is a monorepo with:

- Django backend APIs and WebSocket infrastructure
- Next.js web application (admin, agency, client/worker web dashboards)
- React Native Expo mobile application
- ML subsystem for price and rating predictions
- Deployment and CI/CD configurations for multiple targets (Docker, Render, Railway, DigitalOcean)

Core platform capabilities:

- Role-based accounts: client, worker, agency, admin
- Job posting and application lifecycle
- Team jobs and daily attendance/payment flows
- Escrow-style payment lifecycle and wallet system
- KYC document verification (OCR + face verification)
- Real-time messaging and conversation state management
- Admin governance (KYC, disputes, certifications, payouts, support)

## 2. Monorepo Structure

Top-level folders and major responsibilities:

- `apps/backend/`: Django backend application stack
- `apps/frontend_web/`: Next.js web client
- `apps/frontend_mobile/`: React Native Expo app workspace
- `apps/face-api/`: Face verification microservice module
- `docs/`: Large organized documentation archive (completed, in-progress, setup, QA, architecture, bug-fixes)
- `tests/`: API/manual test suites (`.http` files and supporting test assets)
- `scripts/`: Deployment, fix, and utility scripts (mostly PowerShell)
- `packages/`: Shared package workspace area

Key root configs:

- `package.json` (workspace + Turbo orchestration)
- `turbo.json` (task graph and cache strategy)
- `Dockerfile`, `Dockerfile.ml`
- `docker-compose.yml`, `docker-compose.dev.yml`
- `render.yaml`, `railway.toml`, `do-app-spec.yaml`

## 3. Build and Runtime Architecture

### 3.1 Workspace and Build Tooling

- Workspace manager: npm workspaces
- Build orchestrator: Turbo (`turbo`)
- Cross-app scripts:
  - `web`, `web:build`, `web:start`
  - Mobile platform commands via Expo

### 3.2 Containerized Runtime

`docker-compose.dev.yml` includes:

- `postgres` (local optional DB)
- `redis` (channel layer/cache/circuit-breaker state)
- `backend` (Daphne ASGI, migrations on start, cron service)
- `frontend` (Next.js dev with mounted source)
- `mobile` (optional Flutter profile container entry from legacy context)
- `ml` service

`docker-compose.yml` (production-oriented) includes:

- `postgres`
- `redis`
- `backend` (Gunicorn)
- `channels` (Daphne)
- `frontend`
- `nginx`

### 3.3 Cron/Scheduled Operations

Documented scheduled jobs in backend container setup:

- Hourly payment release workflow
- Friday auto-withdraw processing workflow
- Weekly ML retraining workflow

## 4. Backend (Django) - Full Module Breakdown

Backend root: `apps/backend/src`

### 4.1 Core Project System

`iayos_project/`

- `settings.py`: Environment configuration, installed apps, middleware, DB, CORS, auth, channels settings
- `urls.py`: Router mounting and URL topology
- `asgi.py`: Async application entry (channels + HTTP)
- `wsgi.py`: WSGI entry for Gunicorn use
- `utils.py`: Shared utility helpers (storage links, file ops)
- Additional infrastructure helpers:
  - rate limiting
    n - query caching
  - health checks
  - circuit breaker patterns
  - storage adapters

### 4.2 Accounts Domain (`accounts/`)

Primary responsibilities:

- Authentication and account lifecycle
- Profile abstraction and role context
- Wallets, transactions, payment methods
- KYC user pipeline
- Worker profile assets (certifications, portfolio)

Key files:

- `models.py`: Core data model set (Accounts, Profile, Wallet, Transaction, KYC, etc.)
- `api.py`: Primary account and profile endpoints
- `mobile_api.py`: Mobile-specific account endpoints
- `services.py`: Shared domain logic
- `mobile_services.py`: Mobile-tailored business flows
- `schemas.py`: Input/output contracts
- `authentication.py`: Auth classes, token/cookie logic

Service modules include:

- `paymongo_service.py`
- `xendit_service.py`
- `payment_provider.py`
- `face_detection_service.py`
- `document_verification_service.py`
- `kyc_extraction_service.py`, `kyc_extraction_parser.py`
- `worker_profile_service.py`
- `certification_service.py`
- `portfolio_service.py`
- `material_service.py`
- `profile_metrics_service.py`

Management commands include user seeding/admin setup and auto-withdraw processing.

### 4.3 Jobs Domain (`jobs/`)

Primary responsibilities:

- Job creation and updates
- Applications and acceptance/rejection workflows
- Standard and invite job logic
- Team jobs and worker slot assignments
- Daily attendance and daily payment operations
- Backjob/dispute lifecycle operations
- Payment release and escrow-adjacent transitions

Key files:

- `api.py`: Large endpoint surface (job lifecycle, applications, completion, disputes/backjobs)
- `team_job_services.py`: Team-mode operations
- `daily_payment_service.py`: Daily attendance/payment mechanics
- `payment_buffer_service.py`: delayed release logic

Management commands:

- `release_pending_payments.py`

### 4.4 Profiles Domain (`profiles/`)

Primary responsibilities:

- Conversation and message read/write APIs
- Real-time communication consumer logic
- Typing status, inbox updates, job status events

Key files:

- `api.py`: Conversation + messages endpoints
- `consumers.py`: Channels websocket consumer classes
- `routing.py`: websocket route definitions
- `conversation_service.py`: conversation state helpers

### 4.5 Agency Domain (`agency/`)

Primary responsibilities:

- Agency profile operations
- Agency KYC workflow
- Employee roster management
- Agency job assignments and internal operations
- Agency analytics and support components

Key files:

- `models.py`
- `api.py`
- `services.py`
- OCR and validation support modules

### 4.6 Admin Panel Domain (`adminpanel/`)

Primary responsibilities:

- Admin governance APIs
- KYC approval/rejection flows
- Job/dispute moderation
- Certification review and history
- Payment/transaction admin flows
- Support and analytics modules
- Audit/event logging

Key files:

- `api.py`
- `service.py`
- `analytics_service.py`
- `audit_service.py`
- `payment_service.py`
- `support_service.py`

### 4.7 Client Domain (`client/`)

Primary responsibilities:

- Client-specific endpoint grouping
- Agency browsing/search and client-facing lookups

Key files:

- `api.py`
- `services.py`
- `schemas.py`

### 4.8 ML Domain (`ml/`)

Primary responsibilities:

- Price prediction model API
- Worker rating model API
- Feature extraction pipelines
- Training logic and model lifecycle

Key files:

- `api.py`
- `price_model.py`
- `price_feature_engineering.py`
- `price_training.py`
- `worker_rating_model.py`
- `worker_rating_feature_engineering.py`
- `worker_rating_training.py`

Model assets:

- `saved_models/`

## 5. Frontend Web (Next.js) - Module Breakdown

Frontend root: `apps/frontend_web`

### 5.1 App Router Segments

`app/` contains:

- `admin/`: Admin panel UX (jobs, users, kyc, payments, reviews, support, certifications, dashboard)
- `agency/`: Agency portal UX (kyc, jobs, employees, analytics, profile, messages, reviews)
- `dashboard/`: Client/worker web dashboard flows
- `auth/`: Login, register, OTP verification, password reset
- `api/`: Next.js API routes/proxy layers
- `privacy/`, `terms/`, `offline/`, `mobile-only/`

### 5.2 Shared Web Modules

- `components/`: UI system and feature components
- `lib/api/`: typed API wrappers per domain
- `lib/hooks/`: query and state hooks
- `lib/providers/`: app providers
- `prisma/`: Prisma schema and generated client integration
- `middleware.ts`: route guard behavior

### 5.3 Feature Coverage on Web

- Admin:
  - KYC case review, user governance, disputes/backjobs, certification moderation, support operations
- Agency:
  - employee assignment, active job tracking, analytics, KYC status/flows
- Client/Worker dashboard:
  - job request posting/listing, profile updates
- Auth:
  - OTP-driven verification and account flow

## 6. Frontend Mobile (React Native Expo) - Module Breakdown

Mobile root: `apps/frontend_mobile/iayos_mobile`

### 6.1 Navigation and Screens

`app/` includes grouped routes:

- `(tabs)/`: primary bottom-tab navigation
- `auth/`: auth flows
- `jobs/`: category browsing, search, saved, details, active jobs
- `applications/`: application listing/detail
- `messages/`: conversation list and thread
- `payments/`: payment method/status/history/deposit flows
- `wallet/`: balance/withdraw/deposit/receipt flows
- `profile/`: full profile management, avatar, certifications, materials
- `kyc/`: onboarding and KYC upload flows
- `reviews/`, `support/`, `notifications/`, `settings/`

### 6.2 Components and Hooks

Component categories:

- Messaging: bubbles/input/typing/image messages
- Payments: status badges, summary cards, receipt modal
- Wallet/Earnings: cards, transaction components
- Profile: avatar uploader, portfolio manager, certification/material forms
- Utility and modal primitives

Hooks and services:

- API query hooks via TanStack React Query
- WebSocket service manager
- Image picking/upload/compression helpers
- Backjob, reviews, daily payment, team-job action hooks

### 6.3 Mobile Delivery State (as documented in repo)

Documented major delivered phases:

- Job browsing/application capabilities
- Two-phase completion
- Escrow/payment flows
- Final payment and earnings flows
- Worker profile management and assets

Documented pending roadmap items include deeper real-time and additional verification/review modules (status tracked in docs).

## 7. Face API / Verification Service

`apps/face-api`

Purpose:

- Isolated service footprint for face-related operations and verification support

Files:

- `main.py`
- `requirements.txt`
- `Dockerfile`

Integration context:

- Invoked from backend verification services during KYC/identity workflows.

## 8. Data Model and Business Entities (High-Level)

Main entities represented in backend models:

- Accounts and Profile hierarchy
- Worker and Client profile specialization
- Job and JobApplication lifecycle entities
- Team-mode entities for slot/assignment
- Conversation and Message
- Wallet and Transaction with payment metadata
- KYC and KYC file entities (user and agency)
- Worker certification and portfolio entities
- Notification and payment method entities
- Admin audit entities (KYC logs, certification logs)

Primary business domains:

- Marketplace matching (client posts, worker applies/assigned)
- Escrow-oriented financial lifecycle
- Compliance and trust (KYC + document verification)
- Real-time collaboration (chat and status updates)
- Admin governance and dispute handling

## 9. Feature Inventory by Domain

### 9.1 Auth and Identity

- Email/password authentication
- Role assignment and profile types
- OTP verification flow
- Password reset flow
- Session/token support for web + mobile

### 9.2 Jobs and Matching

- Listing and invite job modes
- Application submit/review/accept/reject
- Active/in-progress/completed lifecycle transitions
- Worker assignment and agency assignment features
- Team job multi-skill/multi-worker support
- Daily model support for attendance-driven jobs

### 9.3 Communication and Collaboration

- Conversation creation/linking to jobs
- Message threads with media support
- Typing indicators
- Participant and system message handling
- Archiving/unarchiving behaviors

### 9.4 Payments and Wallets

- Wallet balance and transaction histories
- Deposit flows
- Withdrawal workflows
- Payment method management
- Escrow/downpayment logic with platform fee handling
- Scheduled/automated payment release and auto-withdraw tasks

### 9.5 KYC and Verification

- User KYC document submission
- Agency KYC submission
- OCR extraction and parsing
- Face detection/comparison integration
- Admin decisioning + audit trail

### 9.6 Reviews and Trust

- Bidirectional review mechanisms
- Moderation/flagging admin features
- Certification verification module

### 9.7 Admin and Agency Operations

- Admin case queues and moderation pages
- Dispute and backjob workflows
- Agency workforce and assignment tracking
- Analytics dashboards
- Support ticket handling

### 9.8 ML Features

- Price range prediction
- Worker rating prediction
- Scheduled retraining support
- Feature engineering with blue-collar/PH-tailored enhancements (documented)

## 10. Testing and QA Assets

### 10.1 Root Test Assets (`tests/`)

Primary testing style:

- `.http` API scenario files for manual/REST-client execution
- Domain-focused test packs for:
  - agency KYC and OCR
  - daily payment attendance
  - team slot assignment
  - backjob flow endpoints
  - deposit/payment verification
  - OTP and account verification

Additional test support:

- `fixtures/`
- `test_images/`
- mobile-focused test folders

### 10.2 Backend Test Areas

Per-app tests appear under backend app folders (`accounts/tests`, `agency/tests`, etc.), plus root `apps/backend/src/tests` support scripts.

### 10.3 QA Documentation

`docs/qa/` contains:

- done and not-done QA checklists
- mobile phase QA tracking
- integration test references

## 11. CI/CD and Automation

GitHub workflows in `.github/workflows`:

- `test.yml` (automated tests)
- `lint.yml` (lint/static checks)
- `e2e.yml` (end-to-end workflows)
- `codeql.yml` (code scanning)
- `sonarcloud.yml` (quality analysis)
- `apisec-scan.yml` (API security checks)
- `mobile-release.yml` (mobile build/release)
- `database-backup.yml` (backup job)
- `deploy-backend.yml` (deploy workflow)
- `health-check.yml` (service health checks)
- `maestro-tests.yml` (mobile UI automation)
- `detox-tests.yml.disabled` (disabled detox pipeline)

Deployment descriptors:

- `render.yaml`
- `railway.toml`
- `do-app-spec.yaml`, `do-spec-current.yaml`

## 12. Documentation System in Repository

`docs/` is heavily structured and includes:

- `01-completed/`: completed implementations by area
- `04-archive/`: archived superseded docs
- `architecture/`: system design deep-dives
- `bug-fixes/`: issue resolution records
- `guides/`, `setup/`: operational playbooks
- `mobile/`: mobile development and phase docs
- repository quality reports and action plans

Foundational reference files at root:

- `AGENTS.md`: persistent implementation memory and completed feature logs
- `CLAUDE.md`: broad architecture and status documentation
- `REPO_STRUCTURE.md`: structural guide
- `GIT_WORKFLOW_GUIDE.md`, `COMMIT_GUIDE.md`

## 13. Security and Operational Patterns

Observed operational patterns:

- JWT/cookie split auth with dual auth support
- Centralized API schema validation
- Containerized service isolation
- Redis-backed channel and cache behaviors
- Audit log retention in moderation/verification domains
- File storage via cloud bucket references and signed links

## 14. High-Value Integration Points

Cross-domain integration points to understand first when maintaining/extending:

- Job lifecycle -> Conversation lifecycle
- Job lifecycle -> Wallet/Transaction updates
- Dispute/backjob state -> Admin panel actions + participant UI behavior
- KYC submission -> OCR/face verification services -> Admin decision + notification
- Agency team assignment -> job slot state -> conversation participants and notifications
- ML predictions -> job creation UX and fallback pricing logic

## 15. Practical Module Map (Quick Index)

- Backend API root: `apps/backend/src/iayos_project/urls.py`
- Account/auth core: `apps/backend/src/accounts/api.py`
- Mobile-specific backend APIs: `apps/backend/src/accounts/mobile_api.py`
- Jobs engine: `apps/backend/src/jobs/api.py`
- Agency APIs: `apps/backend/src/agency/api.py`
- Admin APIs: `apps/backend/src/adminpanel/api.py`
- Conversations/messages APIs: `apps/backend/src/profiles/api.py`
- WebSocket consumers: `apps/backend/src/profiles/consumers.py`
- ML API: `apps/backend/src/ml/api.py`
- Web app routes: `apps/frontend_web/app/`
- Mobile app routes: `apps/frontend_mobile/iayos_mobile/app/`
- CI workflows: `.github/workflows/`
- Test scenarios: `tests/`

## 16. Current Repository Reality Notes

- Repository contains active feature delivery plus historical phase docs; there is overlap between current implementation and archived plans.
- Root docs (`AGENTS.md`, `CLAUDE.md`) contain extensive operational memory and historical timeline entries that complement code-level review.
- Some legacy/deprecated endpoint patterns remain for compatibility while newer workflows are layered in.

## 17. Maintenance Recommendations for Future Contributors

1. Treat `AGENTS.md` + `CLAUDE.md` as operational context, then verify behavior in code before changing logic.
2. For any payment/KYC/dispute modification, update both backend APIs and both frontends (web + mobile) in the same change set.
3. Keep `.http` tests updated whenever endpoint payloads/behavior change.
4. Validate scheduled tasks after backend deployment changes (cron-sensitive features).
5. Ensure mobile changes align with changelog/release workflow when touching `apps/frontend_mobile/`.

---

## Appendix A - Important Files Inventory

### Root

- `package.json`
- `turbo.json`
- `Dockerfile`
- `Dockerfile.ml`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `render.yaml`
- `railway.toml`
- `do-app-spec.yaml`
- `do-spec-current.yaml`
- `AGENTS.md`
- `CLAUDE.md`

### Backend

- `apps/backend/src/manage.py`
- `apps/backend/src/iayos_project/settings.py`
- `apps/backend/src/accounts/models.py`
- `apps/backend/src/accounts/api.py`
- `apps/backend/src/accounts/mobile_api.py`
- `apps/backend/src/jobs/api.py`
- `apps/backend/src/agency/api.py`
- `apps/backend/src/adminpanel/api.py`
- `apps/backend/src/profiles/api.py`
- `apps/backend/src/profiles/consumers.py`
- `apps/backend/src/ml/api.py`

### Frontend Web

- `apps/frontend_web/app/layout.tsx`
- `apps/frontend_web/middleware.ts`
- `apps/frontend_web/lib/api/config.ts`
- `apps/frontend_web/app/admin/`
- `apps/frontend_web/app/agency/`
- `apps/frontend_web/app/dashboard/`
- `apps/frontend_web/app/auth/`

### Frontend Mobile

- `apps/frontend_mobile/iayos_mobile/app/_layout.tsx`
- `apps/frontend_mobile/iayos_mobile/lib/api/config.ts`
- `apps/frontend_mobile/iayos_mobile/lib/services/websocket.ts`
- `apps/frontend_mobile/iayos_mobile/app/(tabs)/`
- `apps/frontend_mobile/iayos_mobile/app/jobs/`
- `apps/frontend_mobile/iayos_mobile/app/messages/`
- `apps/frontend_mobile/iayos_mobile/app/payments/`
- `apps/frontend_mobile/iayos_mobile/app/wallet/`
- `apps/frontend_mobile/iayos_mobile/app/profile/`

### Tests + CI

- `tests/*.http`
- `.github/workflows/*.yml`

---

This file is intentionally exhaustive and designed as a master onboarding + audit document for iAyos.
