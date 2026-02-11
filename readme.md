# 🛠️ iAyos - Blue-Collar Services Marketplace

[![Deploy Backend](https://github.com/Banyel3/iayos/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/Banyel3/iayos/actions/workflows/deploy-backend.yml)
[![Mobile Build](https://github.com/Banyel3/iayos/actions/workflows/mobile-release.yml/badge.svg)](https://github.com/Banyel3/iayos/actions/workflows/mobile-release.yml)

> **A comprehensive marketplace connecting skilled workers with clients in the Philippines**  
> Secure payments · Team jobs · AI-powered KYC · Real-time chat

---

## 🌟 What is iAyos?

iAyos is a digital platform bringing traditional blue-collar work into the gig economy with modern financial security and trust mechanisms. Think of it as **"Upwork for hands-on services"** - connecting clients with skilled professionals in plumbing, electrical, carpentry, and 15+ other categories.

### For Workers
Browse jobs, apply with proposals, manage certifications, build portfolios, and receive secure payments via GCash or digital wallet.

### For Clients  
Post job listings or send direct invites, hire individual workers or teams, track progress with escrow payments, and rate service quality.

### For Agencies
Manage employee rosters, assign workers to jobs, track performance analytics, and receive weekly automated payouts.

### Key Features
- 🔒 **AI-Powered KYC**: DeepFace face detection + Tesseract OCR for identity verification
- 💰 **50% Escrow System**: Secure payments with 7-day buffer period
- 👥 **Team Jobs**: Hire multiple specialists (e.g., 2 plumbers + 3 electricians) in one job
- 🤖 **ML Price Prediction**: LSTM model trained on Philippine blue-collar job data
- 💬 **Real-Time Chat**: WebSocket-based messaging with typing indicators
- 📱 **Multi-Platform**: Web dashboard + Android mobile app

---

## 🌐 Live Platform

| Service | URL | Version |
|---------|-----|---------|
| **Web App** (Agency Dashboard) | https://iayos.online | 0.1.0 |
| **Backend API** | https://api.iayos.online | - |
| **Mobile APK** (Worker/Client) | [Download Latest Release](https://github.com/Banyel3/iayos/releases/latest) | 1.21.2 |

**Deployment**: DigitalOcean App Platform (Singapore region)

---

## 🏗️ Technology Stack

**Backend**: Django 5.2.8 · PostgreSQL · Django Channels · TensorFlow · DeepFace  
**Frontend Web**: Next.js 15.2.0 · React 19 · TypeScript · Tailwind CSS · shadcn/ui  
**Mobile**: React Native/Expo · TypeScript · TanStack Query  
**Infrastructure**: Docker · Turborepo · Supabase · PayMongo · Resend

📖 **Full stack details**: See [AGENTS.md](AGENTS.md)

---

## 📁 Repository Structure

This is a **Turborepo monorepo** with the following structure:

<details>
<summary>View folder structure</summary>

```
iayos/
├── apps/
│   ├── backend/           # Django API server with ML models
│   ├── frontend_web/      # Next.js admin/agency dashboard
│   └── frontend_mobile/   # React Native worker/client app
├── docs/                  # Comprehensive documentation
│   ├── 01-completed/      # Feature completion docs
│   ├── bug-fixes/         # Bug fix documentation
│   ├── setup/             # Deployment guides
│   └── mobile/            # Mobile app docs
├── tests/                 # API tests (.http files)
└── scripts/               # Utility scripts
```

📖 **Full structure**: See [REPO_STRUCTURE.md](REPO_STRUCTURE.md)
</details>

---

## 📱 Mobile App

**Latest Version**: 1.21.2  
**Platform**: Android (APK)  
**Download**: [GitHub Releases](https://github.com/Banyel3/iayos/releases/latest)

### For Developers
```bash
cd apps/frontend_mobile/iayos_mobile
npm install
npx expo start
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Docker Desktop
- `.env.docker` file (request from team lead)

### Setup
```bash
git clone https://github.com/Banyel3/iayos.git
cd iayos
# Place .env.docker in project root
docker-compose -f docker-compose.dev.yml up --build
```

**Access**:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

📖 **Full setup guide with daily commands**: See [docs/setup/DEPLOYMENT_SETUP.md](docs/setup/DEPLOYMENT_SETUP.md)

---

## 🧪 Testing

**API Tests**: `.http` files in `tests/` (use VS Code REST Client extension)

```bash
# Backend tests
docker exec iayos-backend-dev pytest

# Apply migrations
docker exec -it iayos-backend-dev sh -lc "cd /app/apps/backend/src && python3 manage.py migrate"

# Apply migrations
docker exec -it iayos-backend-dev sh -lc "cd /app/apps/backend/src && python3 manage.py migrate"
```

---

## 📚 Documentation

| Topic | Location |
|-------|----------|
| Platform Features | [AGENTS.md](AGENTS.md) - Complete feature history |
| Setup Guides | [docs/setup/](docs/setup/) |
| Bug Fixes | [docs/bug-fixes/](docs/bug-fixes/) |
| Mobile Docs | [docs/mobile/](docs/mobile/) |
| Git Workflow | [docs/guides/GIT_WORKFLOW_GUIDE.md](docs/guides/GIT_WORKFLOW_GUIDE.md) |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👥 About

Developed as a final project for Software Engineering course.  
Showcasing full-stack development with Django, Next.js, and React Native.

---

**Made with ❤️ in the Philippines**
