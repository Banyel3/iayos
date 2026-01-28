# 🛠️ iAyos Marketplace Platform

[![Deploy Backend](https://github.com/Banyel3/iayos/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/Banyel3/iayos/actions/workflows/deploy-backend.yml)

iAyos is a niche marketplace platform connecting freelance blue-collar workers and small home-based businesses with clients seeking services like home construction, repair, and mechanical work. Think of it as a specialized version of Fiverr or Upwork, focused on practical, hands-on services.

The platform provides:

✅ Client-Worker Matching: Quickly find service providers or gigs.

✅ User Profiles & Ratings: Build trust through verified profiles and reviews.

✅ Task Management: Track, accept, and complete jobs efficiently.

✅ Secure Communication: In-app messaging for seamless coordination.

---

## 📁 Repository Structure

This is a **Turborepo monorepo** with the following structure:

```
iayos/
├── apps/
│   ├── backend/           # Django API server (Python)
│   ├── frontend_web/      # Next.js dashboard (TypeScript)
│   └── frontend_mobile/   # React Native/Expo app (TypeScript)
├── docs/                  # All documentation
└── ...                    # Config files (Docker, Turbo, etc.)
```

📖 **Full structure details:** See [REPO_STRUCTURE.md](REPO_STRUCTURE.md)

---

## 🎓 About This Project

This project was developed as the final submission for the Software Engineering course at [Your University Name].
It showcases full-stack development skills using Next.js (frontend) and Django (backend), including deployment best practices, environment setup, and team collaboration.

---

## 📜 License

This project is licensed under the MIT License — see the LICENSE
file for details.
You are free to explore, learn from, and modify the code, with proper credit to the authors.

---

# 🚀 Project Setup Guide

## Prerequisites

## Prerequisites

- **Docker Desktop** (Windows/macOS) or Docker Engine (Linux)
- **Visual Studio Code** (recommended)
- **GitHub Desktop** (recommended for Git operations)
- **`.env.docker` file** at project root (get from team lead)

---

## 🚀 Quick Start

### 1. Clone and Switch to Development Branch

**Using GitHub Desktop:**

1. Open GitHub Desktop
2. Clone repository: `Banyel3/iayos`
3. After cloning, click **Current Branch** dropdown at the top
4. Switch to branch: `features/kyc`
5. Click **Fetch origin** to ensure you have latest changes
6. Click **Pull origin** if there are updates

**Using Git CLI (alternative):**

```powershell
git clone https://github.com/Banyel3/iayos.git
cd iayos
git checkout features/kyc
git pull origin features/kyc
```

### 2. Get Environment File

- Request `.env.docker` file from team lead
- Place it in project root: `iayos/.env.docker`

### 3. Build and Start

Open VS Code, open a terminal (`` Ctrl+` ``), and run:

```powershell
# Build and start all services
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Backend Admin:** http://localhost:8000/admin

---

## 🔄 Keeping Your Branch Up to Date

**Using GitHub Desktop:**

1. Click **Fetch origin** to check for updates
2. If updates are available, click **Pull origin**
3. Resolve any conflicts if prompted

**Using Git CLI (alternative):**

```powershell
git pull origin features/kyc
```

---

## Daily Development

Open VS Code terminal (`` Ctrl+` ``) and run:

```powershell

# Build First

docker-compose -f docker-compose.dev.yml build

# Start everything (hot reload enabled - code changes auto-update!)
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild when dependencies change (package.json, requirements.txt, Dockerfile)
docker-compose -f docker-compose.dev.yml build

# Restart a service
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart backend

# View logs
docker logs iayos-frontend-dev -f --tail=100
docker logs iayos-backend-dev -f --tail=100
```

> **💡 Development Tip:** Code changes in `apps/backend` and `apps/frontend_web` auto-reload thanks to volume mounts. You only need to rebuild when dependencies change!
> docker logs iayos-backend-dev -f --tail=100

````

> **💡 Development Tip:** Code changes in `apps/backend` and `apps/frontend_web` auto-reload thanks to volume mounts. You only need to rebuild when dependencies change!

---

## Common Tasks

### Django Migrations

```powershell
# Apply migrations
docker exec -it iayos-backend-dev sh -lc "cd /app/apps/backend/src && python3 manage.py migrate"

# Create superuser
docker exec -it iayos-backend-dev sh -lc "cd /app/apps/backend/src && python3 manage.py createsuperuser"
````

### Access Container Shell

```powershell
docker exec -it iayos-frontend-dev sh
docker exec -it iayos-backend-dev sh
```

---

## Troubleshooting

### "env file .env.docker not found"

- Make sure `.env.docker` is in the project root
- Get the file from your team lead

### Containers exit immediately

```powershell
# Check logs for errors
docker logs iayos-backend-dev
docker logs iayos-frontend-dev
```

### Changes not reflecting

- Code changes should hot-reload automatically
- If `package.json` or `requirements.txt` changed, rebuild:

```powershell
docker-compose -f docker-compose.dev.yml build
```

- For `.env.docker` changes, restart:

```powershell
docker-compose -f docker-compose.dev.yml restart
```

### Port already in use

```powershell
docker-compose -f docker-compose.dev.yml down
```

### Clean rebuild (fixes most issues)

```powershell
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

---

## Environment Variables

**🔐 Setup:**

1. Get `.env.docker` from team lead
2. Place at project root: `iayos/.env.docker`
3. Never commit to Git (already gitignored)

**Key Variables in `.env.docker`:**

```bash
# Database
DATABASE_URL=postgresql://...

# Django
DJANGO_SECRET_KEY=...
FRONTEND_URL=http://localhost:3000

# Xendit (Payments)
XENDIT_API_KEY=xnd_development_...

# Supabase (Storage)
SUPABASE_ANON_KEY=...
SUPABASE_URL=...

# API URLs (must use localhost for browser)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8001
```

⚠️ **Important:** `NEXT_PUBLIC_*` variables must use `localhost`, NOT Docker service names

---

## � Flutter Mobile App

### Build APK with Docker

```powershell
# Build Flutter APK (outputs to ./output/ folder)
.\scripts\build-mobile.ps1

# Or manually:
docker buildx build --target mobile-production --output type=local,dest=./output -f Dockerfile .
```

### Local Flutter Development

```powershell
cd apps\frontend_mobile\iayos_mobile
flutter pub get
flutter run
```

📖 **Full Flutter build guide:** See [docs/FLUTTER_DOCKER_BUILD.md](docs/FLUTTER_DOCKER_BUILD.md)

---

## �📝 Tips

- **Open terminal in VS Code:** Press `` Ctrl+` `` (backtick key)
- **Run commands from project root**
- **Frontend changes auto-reload:** Changes to React/Next.js files hot reload automatically
- **Backend changes need restart:** After changing Python/Django code, restart backend:
  ```powershell
  docker-compose -f docker-compose.dev.yml restart backend
  ```
- **For dependency changes:** Rebuild containers
- **Stuck?** Try a clean rebuild (see Troubleshooting)

---

## 🎓 About This Project

This project was developed as the final submission for the Software Engineering course.
It showcases full-stack development using Next.js (frontend) and Django (backend), including Docker deployment and team collaboration.

## 📜 License

MIT License — see LICENSE file for details.
