# iAyos Documentation Structure

**Last Updated**: November 14, 2025  
**Status**: Reorganized and cleaned

## 🤖 For AI Agents

**CRITICAL**: Before documenting any completed work, read:

- **[AI_AGENT_DOCUMENTATION_GUIDE.md](AI_AGENT_DOCUMENTATION_GUIDE.md)** - Complete workflow policy

**Quick Rules**:

1. ✅ Completed features → `01-completed/[platform]/`
2. 📋 QA checklists → `qa/NOT DONE/`
3. 🚧 Progress tracking → `02-in-progress/` (then archive after completion)

## 📁 Directory Structure

```
docs/
├── 00-README.md                    # This file - navigation guide
├── 01-completed/                   # ✅ Finished features (production-ready)
│   ├── mobile/                     # Mobile app completed phases
│   ├── worker/                     # Worker feature implementations
│   └── agency/                     # Agency feature implementations
├── 02-in-progress/                 # 🚧 Currently being developed
├── 03-planned/                     # 📋 Planned future features
├── 04-archive/                     # 🗄️ Historical/outdated documents
│   ├── outdated/                   # Old/deprecated docs
│   └── duplicates/                 # Duplicate completion reports
├── architecture/                   # System design & architecture
├── bug-fixes/                      # Bug fix documentation
├── features/                       # Feature implementation docs
├── github-issues/                  # GitHub issue specs
├── guides/                         # How-to guides
├── mobile/                         # Mobile development docs
├── qa/                             # QA test checklists
│   ├── DONE/                       # Completed QA reports
│   └── NOT DONE/                   # Pending QA checklists
├── refactoring/                    # Refactoring documentation
├── setup/                          # Setup & installation guides
├── testing/                        # Testing documentation
└── ui-improvements/                # UI/UX improvement docs
```

## ✅ Completed Features (01-completed/)

### Mobile App - React Native Expo

**Phase 1: Job Browsing & Application** ✅

- Location: `01-completed/mobile/PHASE_1_JOB_APPLICATION_COMPLETE.md`
- Features: Job listing, filtering, categories, search, saved jobs, job applications
- Status: Production-ready

**Phase 2: Job Completion** ✅

- Location: `01-completed/mobile/PHASE_2_JOB_COMPLETION_COMPLETE.md`
- Features: Two-phase completion, photo upload, active jobs, worker/client workflows
- Status: Production-ready

**Phase 3: Escrow Payment** ✅

- Location: `01-completed/mobile/PHASE_3_ESCROW_PAYMENT_COMPLETE.md`
- Features: 50% downpayment, GCash/Wallet/Cash payments, Xendit integration, transaction history
- Status: Production-ready (LATEST - Nov 14, 2025)

**Phase 4: Final Payment** ✅

- Location: `01-completed/mobile/PHASE_4_FINAL_PAYMENT_COMPLETE.md`
- Features: 50% completion payment, worker earnings, payment release
- Status: Production-ready

**Phase 6: Worker Profile Enhancement** ✅

- Locations:
  - `01-completed/mobile/PHASE_6_WORKER_PROFILE_COMPLETE.md`
  - `01-completed/mobile/PHASE_6_AVATAR_PORTFOLIO_COMPLETE.md`
  - `01-completed/mobile/PHASE_6_CERTIFICATIONS_COMPLETE.md`
- Features: Profile management, avatar upload, portfolio images, certifications, materials
- Status: Production-ready

### Worker Features - Web Dashboard

**Worker Phase 1: Profile Enhancement** ✅

- Location: `01-completed/worker/WORKER_PHASE1_*.md`
- Features: Bio/hourly rate, certifications, portfolio management, profile completion tracking
- Backend: Services, APIs, tests all complete
- Frontend: Components, hooks, dashboard pages
- Status: Production-ready

### Agency Features - Web Dashboard

**Agency Phase 1: Discovery & Integration** ✅

- Location: `01-completed/agency/AGENCY_PHASE1_IMPLEMENTATION_REPORT.md`
- Features: Agency registration, employee management, KYC verification
- Status: Production-ready

**Agency Phase 2: Employee Management** ✅

- Locations:
  - `01-completed/agency/AGENCY_PHASE2_COMPLETE_SUMMARY.md`
  - `01-completed/agency/AGENCY_PHASE2_PART1_COMPLETE.md`
  - `01-completed/agency/AGENCY_PHASE2_PART1_IMPLEMENTATION.md`
  - `01-completed/agency/AGENCY_PHASE2_PART2_IMPLEMENTATION.md`
- Features: Rating system, Employee of the Month, performance tracking, leaderboard
- Backend: Database models, services, APIs
- Status: Backend complete, frontend pending

## 🚧 In Progress (02-in-progress/)

**Currently**: Mobile Phase 5 - Real-Time Chat (November 2025)

- WebSocket integration
- Chat interface
- Typing indicators
- Message history
- Push notifications

## 📋 Planned Features (03-planned/)

### Mobile App - Upcoming

**Phase 7: KYC Document Upload**

- Location: `03-planned/MOBILE_PHASE_7_KYC_UPLOAD.md`
- Features: Camera capture, document upload, verification status
- Estimate: 60-80 hours

**Phase 8: Reviews & Ratings**

- Location: `03-planned/MOBILE_PHASE_8_REVIEWS_RATINGS.md`
- Features: Job reviews, worker ratings, review display
- Estimate: 40-60 hours

**Phase 9: Push Notifications**

- Location: `03-planned/MOBILE_PHASE_9_NOTIFICATIONS.md`
- Features: Real-time notifications, notification center, preferences
- Estimate: 30-50 hours

**Phase 10: Advanced Features**

- Location: `03-planned/MOBILE_PHASE_10_ADVANCED_FEATURES.md`
- Features: Job recommendations, analytics, wallet rewards
- Estimate: 80-100 hours

### Agency Dashboard - Upcoming

**Phase 3: Job Workflow Management**

- Location: `03-planned/AGENCY_PHASE_3_JOB_WORKFLOW.md`

**Phase 4: KYC Review System**

- Location: `03-planned/AGENCY_PHASE_4_KYC_REVIEW.md`

**Phase 5: Analytics & Reporting**

- Location: `03-planned/AGENCY_PHASE_5_ANALYTICS.md`

## 🗄️ Archive (04-archive/)

Contains:

- **outdated/**: Deprecated implementation plans, old Flutter docs, malformed filenames
- **duplicates/**: Multiple versions of completion reports (95%, FINAL, etc.)

## 📚 Other Key Directories

### architecture/

- System architecture diagrams
- Database schema guides
- WebSocket architecture
- Stream controller patterns

### bug-fixes/

- Documented bug fixes with before/after
- Admin logout loop fix
- KYC image rendering fix
- Profile image upload fixes
- Wallet transaction viewing

### features/

- Individual feature implementation docs
- Payment methods updates
- GPS location tracking
- Job cancellation
- Reviews implementation
- TanStack Query implementation
- Two-phase job completion
- Wallet & Xendit integration

### github-issues/

- GitHub issue specifications
- Phase roadmap documents
- Implementation plans in `plans/` subdirectory
- Issue creation scripts

### guides/

- Developer guides
- API documentation
- Integration guides
- Setup instructions

### qa/

- **DONE/**: Completed QA test reports
- **NOT DONE/**: Pending QA checklists for upcoming phases

## 🎯 Quick Reference

**Latest Completed Phase**: Mobile Phase 3 - Escrow Payment (Nov 14, 2025)  
**Current Work**: Mobile Phase 5 - Real-Time Chat  
**Next Priority**: Mobile Phase 7 - KYC Upload

**Key Files**:

- Project Memory: `../AGENTS.md` (root of repository)
- API Config: `../apps/frontend_mobile/iayos_mobile/lib/api/config.ts`
- Backend Services: `../apps/backend/src/`
- Mobile App: `../apps/frontend_mobile/iayos_mobile/`

## 📊 Implementation Statistics

**Total Mobile Phases Completed**: 6 phases (1, 2, 3, 4, 6)

- Phase 1: Job Browsing - ~20 hours
- Phase 2: Job Completion - ~20 hours
- Phase 3: Escrow Payment - ~18 hours (85% faster than estimate!)
- Phase 4: Final Payment - ~16 hours
- Phase 6: Worker Profiles - ~62 hours (3 parts)

**Total Lines of Code**: ~25,000+ lines across all mobile phases

**Worker Phase 1**: ~4,774 lines (backend + frontend + tests)

**Agency Phases 1-2**: ~3,000+ lines (backend complete)

## 🔄 Documentation Maintenance

**When to Update**:

1. After completing a phase: Move docs from `02-in-progress/` to `01-completed/`
2. After planning: Add specs to `03-planned/`
3. When starting work: Move specs from `03-planned/` to `02-in-progress/`
4. When deprecating: Move to `04-archive/outdated/`
5. When finding duplicates: Move to `04-archive/duplicates/`

**Naming Convention**:

- Completed: `PHASE_X_FEATURE_NAME_COMPLETE.md`
- In Progress: `PHASE_X_FEATURE_NAME_PROGRESS.md`
- Planned: `PHASE_X_FEATURE_NAME.md` or `PHASE_X_FEATURE_NAME_PLAN.md`

**File Organization Rules**:

1. Keep only ONE authoritative completion document per phase
2. Archive all interim progress reports after completion
3. Move outdated plans to archive when implementation differs
4. Maintain clean separation between completed/in-progress/planned

---

**Last Reorganization**: November 14, 2025  
**Reorganized By**: AI Assistant  
**Purpose**: Clean up duplicates, organize by status, improve discoverability
