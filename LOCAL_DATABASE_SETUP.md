# Local PostgreSQL Database Setup

This guide explains how to run iAyos with a local PostgreSQL database instead of the cloud Neon database. This is useful for:

- **Offline development** (no internet required)
- **Defense presentations** (guaranteed no network issues)
- **Faster local development** (no network latency)

---

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Internet connection (for initial data sync only)

### Initial Setup (One-time, requires internet)

```powershell
# 1. Stop any running containers
docker-compose -f docker-compose.dev.yml down

# 2. Ensure USE_LOCAL_DB=true in .env.docker (already set by default)

# 3. Start the local PostgreSQL container
docker-compose -f docker-compose.dev.yml up postgres -d

# 4. Wait for it to be healthy (about 5-10 seconds)
docker ps  # Should show "healthy" status for iayos-postgres-dev

# 5. Sync data from Neon cloud to local
.\scripts\sync_db_from_neon.ps1 -Force

# 6. Start all services
docker-compose -f docker-compose.dev.yml up
```

### After Initial Setup (No internet needed)

```powershell
# Just start Docker - your data is persisted locally
docker-compose -f docker-compose.dev.yml up
```

---

## Configuration

### Toggle Between Local and Cloud Database

Edit `.env.docker`:

```dotenv
# For LOCAL database (offline mode)
USE_LOCAL_DB=true

# For CLOUD database (Neon - requires internet)
USE_LOCAL_DB=false
```

After changing, restart Docker:

```powershell
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up
```

### Database Credentials

| Setting  | Local PostgreSQL                         | Neon Cloud                                                    |
| -------- | ---------------------------------------- | ------------------------------------------------------------- |
| Host     | `postgres` (Docker) / `localhost` (host) | `ep-autumn-pond-a1f6i8dz-pooler.ap-southeast-1.aws.neon.tech` |
| Port     | `5432`                                   | `5432`                                                        |
| Database | `iayos_db`                               | `neondb`                                                      |
| User     | `iayos_user`                             | `neondb_owner`                                                |
| Password | `iayos_local_pass`                       | (in .env.docker)                                              |
| SSL      | Not required                             | Required                                                      |

---

## Sync Script Options

The sync script (`scripts/sync_db_from_neon.ps1`) copies data from Neon cloud to your local database.

```powershell
# Full sync (schema + data) - recommended
.\scripts\sync_db_from_neon.ps1 -Force

# Schema only (tables, no data)
.\scripts\sync_db_from_neon.ps1 -SchemaOnly -Force

# Data only (assumes tables exist)
.\scripts\sync_db_from_neon.ps1 -DataOnly -Force
```

### What gets synced:

- ✅ All database tables
- ✅ All data (users, jobs, profiles, etc.)
- ✅ Django migration history
- ✅ Indexes and constraints

### What does NOT get synced:

- ❌ Uploaded files (stored in Supabase, not PostgreSQL)
- ❌ Real-time changes after sync

---

## Troubleshooting

### "Container not healthy"

```powershell
# Check container logs
docker logs iayos-postgres-dev

# Restart the container
docker-compose -f docker-compose.dev.yml restart postgres
```

### "Connection refused" errors

```powershell
# Make sure postgres container is running
docker ps | Select-String postgres

# If not running, start it
docker-compose -f docker-compose.dev.yml up postgres -d
```

### Reset local database completely

```powershell
# This deletes ALL local data
docker-compose -f docker-compose.dev.yml down -v

# Then re-sync from Neon
docker-compose -f docker-compose.dev.yml up postgres -d
.\scripts\sync_db_from_neon.ps1 -Force
```

### Backend can't connect to database

1. Check `USE_LOCAL_DB=true` in `.env.docker`
2. Ensure postgres container started before backend:
   ```powershell
   docker-compose -f docker-compose.dev.yml up postgres -d
   # Wait 5 seconds
   docker-compose -f docker-compose.dev.yml up
   ```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    docker-compose.dev.yml                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   postgres   │    │   backend    │    │   frontend   │  │
│  │  (port 5432) │◄───│  (port 8000) │◄───│  (port 3000) │  │
│  │              │    │              │    │              │  │
│  │ postgres:17  │    │    Django    │    │   Next.js    │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ postgres-data│  ◄── Docker volume (persists data)        │
│  │   (volume)   │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Data Flow (Initial Sync):
┌─────────────┐     pg_dump      ┌─────────────┐
│ Neon Cloud  │ ───────────────► │   Local     │
│ PostgreSQL  │   (via Docker)   │ PostgreSQL  │
│   (PG 17)   │                  │   (PG 17)   │
└─────────────┘                  └─────────────┘
```

---

## Defense Day Checklist

- [ ] Run `.\scripts\sync_db_from_neon.ps1 -Force` at least once (with internet)
- [ ] Verify `USE_LOCAL_DB=true` in `.env.docker`
- [ ] Test locally: `docker-compose -f docker-compose.dev.yml up`
- [ ] Verify app works: http://localhost:3000
- [ ] Disconnect internet and verify app still works
- [ ] Keep backup of `scripts/backups/` folder (contains database dumps)

---

## Files Reference

| File                                         | Purpose                                                  |
| -------------------------------------------- | -------------------------------------------------------- |
| `.env.docker`                                | Contains `USE_LOCAL_DB` toggle and database URLs         |
| `docker-compose.dev.yml`                     | Defines postgres service with healthcheck                |
| `apps/backend/src/iayos_project/settings.py` | Django DB config (auto-switches based on `USE_LOCAL_DB`) |
| `apps/backend/init.sql`                      | PostgreSQL extensions initialization                     |
| `scripts/sync_db_from_neon.ps1`              | Sync script (exports Neon → imports local)               |
| `scripts/backups/`                           | Contains timestamped database dumps                      |

---

## FAQ

**Q: Do I need PostgreSQL installed on Windows?**  
A: No! Everything runs inside Docker containers.

**Q: Will my local changes sync back to Neon?**  
A: No. The sync is one-way (Neon → Local). Local changes stay local.

**Q: How often should I sync?**  
A: Before any offline work or presentation. Once synced, you're good until you need fresh data.

**Q: What if I make changes locally and want to keep them?**  
A: Don't sync again, or you'll overwrite them. The `-Force` flag skips confirmation.

**Q: Can I use this in production?**  
A: This setup is for development/testing only. Production uses Neon cloud.
