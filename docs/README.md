# iAyos Documentation

This directory contains comprehensive documentation for the iAyos marketplace platform.

## 🚀 Quick Start

**New to the docs?** Start here:

- 📖 **[00-README.md](00-README.md)** - Complete navigation guide
- ⚡ **[QUICK_INDEX.md](QUICK_INDEX.md)** - Fast reference for completed/planned features
- 📋 **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Recent reorganization details
- 🤖 **[AI_AGENT_DOCUMENTATION_GUIDE.md](AI_AGENT_DOCUMENTATION_GUIDE.md)** - **AI agent workflow policy**
- 🧠 **[AI_ML_MODELS_DOCUMENTATION.md](AI_ML_MODELS_DOCUMENTATION.md)** - **Complete AI/ML models reference**

## 🗂️ Organized Structure (NEW - Nov 14, 2025)

### ✅ [01-completed/](01-completed/)

**Production-ready features** with authoritative completion documentation

- **mobile/** - 7 completed mobile phases (~25,000 lines of code)
- **worker/** - Worker Phase 1 complete (~4,774 lines)
- **agency/** - Agency Phases 1-2 complete (~3,000+ lines)

### 🚧 [02-in-progress/](02-in-progress/)

**Active development** - Currently: Mobile Phase 5 (Real-Time Chat)

### 📋 [03-planned/](03-planned/)

**Future roadmap** - Mobile Phases 7-10, Agency Phases 3-5

### 🗄️ [04-archive/](04-archive/)

**Historical docs** - Outdated plans, duplicate reports, deprecated implementations

---

## 📚 Directory Structure (Original)

### 📁 features/

Feature implementations and new capabilities (16 files)

- Wallet system implementation
- Payment processing (Xendit, two-phase payments)
- KYC verification system
- Job management (posting, applications, cancellation)
- GPS location tracking
- Reviews and ratings
- TanStack Query integration

### 📁 bug-fixes/

Bug fixes and patches (9 files)

- Admin logout loop fix
- User role fixes
- Profile image upload fixes
- Cache clearing issues
- Wallet deposit schema fixes
- KYC image rendering fixes
- IndexedDB removal

### 📁 ui-improvements/

UI/UX enhancements and visual improvements (16 files)

- Loading states and flickering prevention
- Admin sidebar restructure
- GPS location UI improvements
- Distance data integration
- MyRequests page improvements
- Jobs management pages
- Modal backdrop updates
- Availability caching

### 📁 architecture/

System architecture and design documentation (5 files)

- System architecture overview
- Database schema guide
- WebSocket architecture diagrams
- Stream controller pattern
- Single connection architecture

### 📁 guides/

How-to guides and reference documentation (9 files)

- Django Channels comprehensive guide
- WebSocket implementation guides
- Chat testing guide
- Authentication changes
- Security breach response

### 📁 setup/

Setup and build documentation (5 files)

- Build guide
- Docker setup
- Flutter Docker build
- Build status
- Agents configuration

### 📁 refactoring/

Code refactoring documentation (3 files)

- Complete backend refactoring summary
- Jobs app refactoring
- Profiles app refactoring

### 📁 mobile/

Flutter mobile app documentation (7 files)

- Mobile development roadmap (6-week plan)
- Week 1 & 2 completion summaries
- Django integration guide
- Dashboard features implementation
- Authentication fixes
- Build status

## File Statistics

- **Total Documentation Files**: 70 markdown files
- **Features**: 16 documents
- **Bug Fixes**: 9 documents
- **UI Improvements**: 16 documents
- **Mobile**: 7 documents
- **Architecture**: 5 documents
- **Guides**: 9 documents
- **Setup**: 5 documents
- **Refactoring**: 3 documents

## Other Files

- `backend-vulnerabilities.sarif` - Security vulnerability scan results (129KB)
- `.gitignore.flutter_tmp` - Flutter temporary gitignore
- `.gitignore.new` - New gitignore configuration

## Navigation Tips

1. **New to the project?** Start with `setup/BUILD_GUIDE.md` and `architecture/SYSTEM_ARCHITECTURE.md`
2. **Setting up development?** Check `setup/DOCKER_SETUP.md`
3. **Working on features?** Browse `features/` for implementation details
4. **Debugging issues?** Check `bug-fixes/` for known issues and solutions
5. **Improving UI?** See `ui-improvements/` for best practices
6. **Understanding architecture?** Read docs in `architecture/`
7. **Need implementation guides?** Check `guides/`

## Contributing

When adding new documentation:

- Place feature docs in `features/`
- Place bug fix docs in `bug-fixes/`
- Place UI/UX docs in `ui-improvements/`
- Place architectural docs in `architecture/`
- Place how-to guides in `guides/`
- Place setup docs in `setup/`
- Place refactoring docs in `refactoring/`

## Related Documentation

- Main project README: `C:\code\iayos\readme.md`
- Claude AI context: `C:\code\iayos\CLAUDE.md`
- Mobile app README: `C:\code\iayos\apps\frontend_mobile\iayos_mobile\README.md`

## Quick Links by Task

**Mobile Development:**

- Start: `mobile/MOBILE_DEVELOPMENT_ROADMAP.md`
- Current progress: `mobile/DASHBOARD_FEATURES_IMPLEMENTATION.md`
- Integration: `mobile/DJANGO_INTEGRATION_GUIDE.md`

**Backend Development:**

- Architecture: `architecture/SYSTEM_ARCHITECTURE.md`
- Database: `architecture/DATABASE_SCHEMA_GUIDE.md`
- WebSocket: `guides/DJANGO_CHANNELS_COMPREHENSIVE_GUIDE.md`

**Frontend Development:**

- UI Patterns: `ui-improvements/LOADING_STATES_ALL_PAGES.md`
- Refactoring: `refactoring/COMPLETE_REFACTORING_SUMMARY.md`

**DevOps:**

- Setup: `setup/BUILD_GUIDE.md`
- Docker: `setup/DOCKER_SETUP.md`

---

**Last Updated**: November 9, 2025
**Total Files Organized**: 70 documentation files
**Empty Files Removed**: 7 files
**Mobile Docs Moved**: 7 files
