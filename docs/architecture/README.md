# iAyos System Architecture - Complete Context Documentation

**Generated**: November 20, 2025  
**Purpose**: Master index for comprehensive system architecture documentation  
**Status**: ✅ Complete (6 documents)

---

## 📚 Documentation Suite

This documentation provides complete context about the iAyos marketplace platform architecture, APIs, database schema, integrations, and technical debt.

### Quick Navigation

1. **[CONTEXT_OVERVIEW.md](./CONTEXT_OVERVIEW.md)** - High-level system summary
2. **[CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md)** - Complete backend API inventory
3. **[CONTEXT_FRONTEND_USAGE.md](./CONTEXT_FRONTEND_USAGE.md)** - Frontend API usage patterns
4. **[CONTEXT_DATABASE.md](./CONTEXT_DATABASE.md)** - Database models & relationships
5. **[CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md)** - Integration flows & business logic
6. **[CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md)** - Technical debt & cleanup recommendations

---

## 🎯 Use Cases

### For New Developers

**Getting Started**:

1. Read [CONTEXT_OVERVIEW.md](./CONTEXT_OVERVIEW.md) - Understand tech stack and project structure
2. Read [CONTEXT_DATABASE.md](./CONTEXT_DATABASE.md) - Learn database schema
3. Read [CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md) - Explore available APIs

**Building Features**:

1. Check [CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md) - See complete business flows
2. Check [CONTEXT_FRONTEND_USAGE.md](./CONTEXT_FRONTEND_USAGE.md) - Learn API calling patterns

### For AI Agents

**Prompt Context**:

```
I'm working on the iAyos marketplace platform.

System Overview:
- Backend: Django 5.2.8 with Django Ninja API
- Frontend: Next.js 15 (web) + React Native/Expo (mobile)
- Database: PostgreSQL with 34 models
- Auth: Cookie-based (web) + JWT Bearer (mobile)

Before answering, review:
- docs/architecture/CONTEXT_OVERVIEW.md - Tech stack
- docs/architecture/CONTEXT_BACKEND_API.md - 140+ endpoints
- docs/architecture/CONTEXT_DATABASE.md - 34 database models
- docs/architecture/CONTEXT_INTEGRATION.md - Business flows
- docs/architecture/CONTEXT_ISSUES.md - Known issues

[Your specific question here]
```

**Task-Specific Prompts**:

**Backend Development**:

```
Task: Implement new API endpoint for [feature]

Context needed:
1. CONTEXT_BACKEND_API.md - Existing endpoints and patterns
2. CONTEXT_DATABASE.md - Database models and relationships
3. CONTEXT_INTEGRATION.md - Authentication patterns

Constraints:
- Follow Django Ninja API patterns
- Use appropriate auth decorator (jwt_auth or cookie_auth)
- Return consistent JSON response format
- Add to appropriate router module (accounts, jobs, profiles, etc.)
```

**Frontend Development**:

```
Task: Add new screen/component for [feature]

Context needed:
1. CONTEXT_FRONTEND_USAGE.md - API calling patterns
2. CONTEXT_BACKEND_API.md - Available endpoints
3. CONTEXT_INTEGRATION.md - Business flows

Constraints:
- Mobile: Use React Query hooks in lib/hooks/
- Mobile: Use apiRequest() helper with Bearer token
- Web: Use cookie-based auth with credentials: "include"
- Follow existing component patterns
```

**Database Changes**:

```
Task: Add new model or modify existing schema

Context needed:
1. CONTEXT_DATABASE.md - Existing models and relationships
2. CONTEXT_INTEGRATION.md - How models are used in flows
3. CONTEXT_ISSUES.md - Known schema issues

Constraints:
- Create Django migration
- Add indexes for frequently queried fields
- Follow existing naming conventions (profileID, accountFK, etc.)
- Update model relationships diagram
```

**Bug Fixes**:

```
Task: Fix [bug description]

Context needed:
1. CONTEXT_ISSUES.md - Known issues and technical debt
2. CONTEXT_INTEGRATION.md - Complete business flows
3. CONTEXT_BACKEND_API.md - Endpoint definitions
4. CONTEXT_FRONTEND_USAGE.md - How frontend calls APIs

Steps:
1. Identify root cause using context docs
2. Locate relevant code in backend or frontend
3. Fix issue following existing patterns
4. Update documentation if patterns change
```

### For Project Managers

**Feature Planning**:

1. Review [CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md) - Understand complete user flows
2. Check [CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md) - See technical debt and blockers
3. Review [CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md) - Identify existing vs needed APIs

**Tech Debt Prioritization**:

1. Read [CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md) - Priority matrix and effort estimates
2. See immediate actions (14 hours) vs long-term work (120 hours)
3. Review unused endpoints cleanup plan

---

## 📊 System Statistics

### Codebase Size

**Backend**:

- API endpoints: 140+
- Database models: 34
- Migrations: 42+
- Lines of code: ~25,000

**Frontend Web**:

- API modules: 5
- Components: 150+
- Pages: 50+
- Lines of code: ~30,000

**Frontend Mobile**:

- Screens: 40+
- Components: 80+
- Hooks: 30+
- Lines of code: ~20,000

**Total**: ~75,000 lines of production code

### API Coverage

- **Mobile app**: 80+ endpoints (57% of backend)
- **Web app**: 30+ endpoints (21% of backend)
- **Unused**: ~30 endpoints (21% - candidates for removal)

### Database

- **Tables**: 34 models
- **Relationships**: 60+ foreign keys
- **Indexes**: 20+ explicit indexes
- **Estimated size**: ~50MB (production)

---

## 🔍 Common Questions

### "Which API should I use for [feature]?"

**Answer**:

1. Check [CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md) - Search for feature
2. Note auth type (jwt_auth for mobile, cookie_auth for web)
3. Check [CONTEXT_FRONTEND_USAGE.md](./CONTEXT_FRONTEND_USAGE.md) - See usage examples

**Example**:

```
Q: How do I get a user's job list?

A:
Mobile: GET /api/mobile/jobs/my-jobs?status=ACTIVE (jwt_auth)
Web: GET /api/jobs/my-jobs (cookie_auth)

Mobile usage: ENDPOINTS.MY_JOBS(status) with apiRequest()
Web usage: fetch('/api/jobs/my-jobs', { credentials: 'include' })
```

### "How does [business flow] work?"

**Answer**:

1. Read [CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md) - Flow diagrams section
2. Find specific flow (Job Creation, Payment, KYC, etc.)
3. Review sequence diagram and state transitions

**Example**:

```
Q: How does the job completion flow work?

A: See CONTEXT_INTEGRATION.md - "Flow 1: Job Creation → Completion"
1. Worker marks job complete (uploads photos)
2. Client approves completion
3. Client makes final payment (50% remaining)
4. Worker receives payment to wallet
5. Both parties can leave reviews
```

### "What's the schema for [model]?"

**Answer**:

1. Check [CONTEXT_DATABASE.md](./CONTEXT_DATABASE.md) - Model Details section
2. Find model by name (e.g., "Job Model", "WorkerProfile Model")
3. Review fields, relationships, and constraints

**Example**:

```
Q: What fields does the Job model have?

A: See CONTEXT_DATABASE.md - "6. Job Model"
Fields: jobID, clientID, title, description, categoryID, budget,
        escrowAmount, escrowPaid, remainingPayment, location,
        urgency, materialsNeeded, jobType, status, assignedWorkerID,
        assignedAgencyFK, completedAt, createdAt, updatedAt, etc.
```

### "Why are there two auth systems?"

**Answer**:

1. See [CONTEXT_OVERVIEW.md](./CONTEXT_OVERVIEW.md) - Authentication Architecture section
2. See [CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md) - API Divergence Issues section

**Summary**:

- **Web**: Cookie-based auth (HTTP-only cookies, session management)
- **Mobile**: JWT Bearer tokens (stored in AsyncStorage, stateless)
- **Reason**: React Native doesn't support HTTP-only cookies properly
- **Status**: Intentional design, both maintained

### "What needs to be fixed?"

**Answer**:

1. Read [CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md) - Complete analysis
2. Check "Priority Matrix" table for effort estimates
3. See "Action Plan" for week-by-week breakdown

**Summary**:

- **Immediate**: 14 hours (remove unused endpoints, fix consistency)
- **Short-term**: 15 hours (refactor services, add rate limiting)
- **Long-term**: 120 hours (complete features, unified API)

---

## 🛠️ Maintenance

### Updating Documentation

When making significant changes to the codebase:

**Backend Changes**:

1. Update [CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md) if adding/removing endpoints
2. Update [CONTEXT_DATABASE.md](./CONTEXT_DATABASE.md) if changing models
3. Update [CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md) if modifying business flows

**Frontend Changes**:

1. Update [CONTEXT_FRONTEND_USAGE.md](./CONTEXT_FRONTEND_USAGE.md) if adding new API calls
2. Update [CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md) if changing user flows

**Issue Resolution**:

1. Update [CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md) when fixing technical debt
2. Remove fixed issues from cleanup recommendations
3. Add new discovered issues

### Regeneration Command

To regenerate this documentation suite (when structure significantly changes):

```bash
# Scan codebase
python scripts/analyze_codebase.py

# Generate docs
python scripts/generate_context_docs.py

# Review changes
git diff docs/architecture/
```

---

## 📝 Version History

| Date       | Version | Changes                                  |
| ---------- | ------- | ---------------------------------------- |
| 2025-11-20 | 1.0     | Initial complete documentation suite     |
| 2025-11-14 | 0.9     | Added Mobile Phase 3-6 completion status |
| 2025-11-13 | 0.8     | Added Worker Phase 1 completion          |
| 2025-11-13 | 0.7     | Added Agency Phase 2 completion          |

---

## 🔗 Related Documentation

### Implementation Docs

- `docs/01-completed/mobile/` - Completed mobile phases
- `docs/01-completed/worker/` - Completed worker features
- `docs/01-completed/agency/` - Completed agency features

### Bug Fixes

- `docs/bug-fixes/` - Documented bug fixes and solutions

### Planning Docs

- `docs/02-in-progress/` - Current work in progress
- `docs/03-planned/` - Planned future phases
- `docs/github-issues/plans/` - Detailed phase plans

### Architecture Docs

- `docs/architecture/` - This folder (system architecture)

### Setup Guides

- `docs/setup/` - Development environment setup
- `README.md` - Project README

---

## 🤝 Contributing

When contributing to the documentation:

1. **Keep it current**: Update docs when making code changes
2. **Follow format**: Use existing document structure
3. **Add examples**: Include code examples where helpful
4. **Link references**: Cross-reference related documents
5. **Update master index**: Add new documents to this README

---

## 📧 Contact

For questions about this documentation:

- Check existing docs first (likely answered)
- Review related code files
- Ask in team chat with specific question and context
- Reference document name and section in questions

---

**Last Updated**: November 20, 2025  
**Total Documents**: 6  
**Total Pages**: ~50 pages equivalent  
**Status**: ✅ Complete and ready for use
