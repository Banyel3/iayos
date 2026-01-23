# iAyos Repository Structure

> **Last Updated**: December 2025  
> **Monorepo Pattern**: Turborepo with separate frontend/backend apps

This document describes the organization of the iAyos codebase after the January 2025 restructuring.

---

## 📁 Root Directory

```
iayos/
├── apps/                          # Application code (monorepo packages)
│   ├── backend/                   # Django API server
│   ├── frontend_web/              # Next.js web dashboard
│   └── frontend_mobile/           # React Native mobile app
│
├── docs/                          # All documentation
│   ├── 01-completed/              # Completed feature docs
│   ├── 02-in-progress/            # WIP documentation
│   ├── 03-planned/                # Future roadmap
│   ├── 04-archive/                # Archived/obsolete docs
│   └── ...                        # Topic-specific folders
│
├── .github/                       # GitHub Actions, templates
├── .vscode/                       # VS Code workspace settings
│
├── docker-compose.yml             # Production Docker setup
├── docker-compose.dev.yml         # Development Docker setup
├── Dockerfile                     # Multi-stage backend/frontend build
├── Dockerfile.ml                  # ML service Docker build
│
├── package.json                   # Root workspace config
├── turbo.json                     # Turborepo config
├── LICENSE                        # Project license
├── readme.md                      # Main README
├── REPO_STRUCTURE.md              # This file
├── AGENTS.md                      # AI assistant memory/context
└── CLAUDE.md                      # Claude-specific instructions
```

---

## 📂 `/apps/backend/` - Django API Server

```
apps/backend/
├── src/                           # Django source code
│   ├── accounts/                  # User accounts, auth, profiles
│   ├── adminpanel/                # Admin dashboard APIs
│   ├── agency/                    # Agency management
│   ├── jobs/                      # Job postings, applications
│   ├── ml/                        # ML price prediction
│   ├── profiles/                  # User profiles, conversations
│   └── iayos_project/             # Django project settings
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
│
├── scripts/                       # All backend scripts (organized)
│   ├── testing/                   # Test scripts, .http files
│   ├── data/                      # Seeding, setup scripts
│   ├── maintenance/               # Health checks, migrations
│   ├── ml/                        # ML training scripts + Datasets/
│   └── database/                  # DB sync, backups, SQL scripts
│
├── backups/                       # Database backup files
├── requirements.txt               # Python dependencies
├── manage.py                      # Django management
└── .env.example                   # Environment template
```

### Script Conventions (`apps/backend/scripts/`)

| Folder         | Purpose                      | Example Files                          |
| -------------- | ---------------------------- | -------------------------------------- |
| `testing/`     | API tests, integration tests | `*.http`, `test_*.py`, test fixtures   |
| `data/`        | Data seeding, profile setup  | `create_test_users.py`, `setup_*.py`   |
| `maintenance/` | Health checks, one-off fixes | `check_*.py`, `fix_*.py`, `apply_*.py` |
| `ml/`          | Model training, datasets     | `train_*.py`, `Datasets/`              |
| `database/`    | DB operations, migrations    | `sync_*.ps1`, `*.sql`, `schema_*.py`   |

---

## 📂 `/apps/frontend_web/` - Next.js Dashboard

```
apps/frontend_web/
├── app/                           # Next.js App Router pages
│   ├── admin/                     # Admin panel pages
│   ├── agency/                    # Agency dashboard
│   ├── dashboard/                 # Client/worker dashboard
│   ├── auth/                      # Authentication pages
│   └── api/                       # API route handlers
│
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── client/                    # Client-specific components
│   ├── worker/                    # Worker-specific components
│   └── agency/                    # Agency-specific components
│
├── lib/                           # Utilities, hooks, API clients
│   ├── api/                       # API client functions
│   └── hooks/                     # React Query hooks
│
├── public/                        # Static assets
├── styles/                        # Global CSS
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 📂 `/apps/frontend_mobile/` - React Native App

```
apps/frontend_mobile/
├── iayos_mobile/                  # Expo app root
│   ├── app/                       # Expo Router pages (file-based routing)
│   │   ├── (tabs)/                # Tab navigator screens
│   │   ├── jobs/                  # Job-related screens
│   │   ├── profile/               # Profile screens
│   │   ├── payments/              # Payment flow screens
│   │   └── messages/              # Chat screens
│   │
│   ├── components/                # Shared components
│   ├── lib/                       # API, hooks, utilities
│   │   ├── api/                   # API config and clients
│   │   └── hooks/                 # React Query hooks
│   │
│   ├── constants/                 # Theme, colors, typography
│   ├── context/                   # React context providers
│   └── assets/                    # Images, fonts
│
└── scripts/                       # Mobile-specific scripts
    ├── build-mobile.ps1
    └── switch-network.ps1
```

---

## 📂 `/docs/` - Documentation

```
docs/
├── 00-README.md                   # Documentation index
├── QUICK_INDEX.md                 # Quick reference
│
├── 01-completed/                  # Completed feature documentation
│   ├── mobile/                    # Mobile phase completions
│   └── *.md                       # Feature completion docs
│
├── 02-in-progress/                # Active development docs
├── 03-planned/                    # Roadmap, future features
│
├── 04-archive/                    # Archived documentation
│   ├── obsolete-specs/            # Outdated specifications
│   └── academic/                  # Academic/learning materials
│
├── architecture/                  # System architecture docs
├── bug-fixes/                     # Bug fix documentation
├── features/                      # Feature specifications
├── github-issues/                 # Issue tracking, plans
├── guides/                        # How-to guides
├── ml/                            # ML model documentation
├── mobile/                        # Mobile app documentation
├── qa/                            # QA checklists
└── setup/                         # Setup instructions
```

---

## 🔧 Configuration Files

### Root Level

| File                     | Purpose                                |
| ------------------------ | -------------------------------------- |
| `docker-compose.yml`     | Production multi-container setup       |
| `docker-compose.dev.yml` | Development with hot reload            |
| `Dockerfile`             | Multi-stage build (backend + frontend) |
| `Dockerfile.ml`          | ML service with TensorFlow             |
| `turbo.json`             | Turborepo build pipeline               |
| `package.json`           | Workspace dependencies                 |
| `.gitignore`             | Git ignore rules                       |
| `.dockerignore`          | Docker build context exclusions        |

### Environment Files

| File                        | Purpose                                |
| --------------------------- | -------------------------------------- |
| `.env.docker`               | Active Docker environment (gitignored) |
| `.env.docker.example`       | Template with placeholder values       |
| `apps/backend/.env.example` | Backend-specific template              |

---

## 📝 Conventions

### Adding New Scripts

1. **Backend scripts**: Place in `apps/backend/scripts/{category}/`
   - `testing/` - Test files and fixtures
   - `data/` - Seeding and setup
   - `maintenance/` - Checks and fixes
   - `ml/` - Training and ML utilities
   - `database/` - DB operations

2. **Mobile scripts**: Place in `apps/frontend_mobile/scripts/`

3. **One-off scripts**: If temporary, add to `.gitignore` after use

### Adding New Documentation

1. **Feature docs**: `docs/features/{feature-name}.md`
2. **Completed phases**: `docs/01-completed/{category}/`
3. **Bug fixes**: `docs/bug-fixes/{BUG_NAME}.md`
4. **Guides**: `docs/guides/{guide-name}.md`

### File Naming

- **Python**: `snake_case.py`
- **TypeScript/JavaScript**: `camelCase.ts` or `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Documentation**: `UPPER_SNAKE_CASE.md` or `kebab-case.md`
- **Scripts**: Descriptive names with action prefix (`check_`, `fix_`, `setup_`, `test_`)

---

## 🚫 What NOT to Add at Root

- Individual test files → `apps/backend/scripts/testing/`
- Database dumps → `apps/backend/backups/`
- Dataset files → `apps/backend/scripts/ml/Datasets/`
- Temporary files → Use `.gitignore`
- One-off scripts → `apps/backend/scripts/maintenance/`
- Cookie/session files → `.gitignore` (never commit)

---

## 🔄 Recent Restructuring (January 2025)

### Moved to `apps/backend/scripts/`

- ~50 Python scripts from `/scripts/`
- SQL files from `/archive/sql-scripts/`
- Test files from `/tests/`

### Moved to `docs/04-archive/`

- `obsolete-specs/` - Outdated spec documents
- `academic/` - Learning materials, exam files

### Deleted

- `/packages/` (was empty)
- `/archive/` (contents moved)
- `/files/` (contents moved)
- Root-level test images and temp files

### Updated

- `.gitignore` - Complete rewrite for monorepo
- `.dockerignore` - Updated for new structure
- `.env.docker.example` - Secrets replaced with placeholders

---

## 📚 Related Documentation

- [Main README](readme.md) - Project overview
- [AGENTS.md](AGENTS.md) - AI assistant context
- [QUICK_INDEX.md](docs/QUICK_INDEX.md) - Documentation quick reference
- [Architecture Overview](docs/architecture/) - System design
