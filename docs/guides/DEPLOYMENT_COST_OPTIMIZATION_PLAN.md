# iAyos Deployment & Cost-Optimization Plan

**Date:** December 2025  
**Purpose:** Minimal-cost, production-like deployment for demo/defense  
**Non-Negotiable:** Android mobile deployment to Google Play

---

## 📊 Executive Summary

| Component              | Recommended Solution         | Monthly Cost    |
| ---------------------- | ---------------------------- | --------------- |
| Backend + WebSockets   | Railway (Starter)            | ~$5-10          |
| PostgreSQL Database    | Neon Free Tier               | $0              |
| Redis Cache            | Railway (bundled) or Upstash | $0-5            |
| Web Frontend (Next.js) | Vercel Free Tier             | $0              |
| File Storage           | Supabase Free Tier           | $0              |
| Email Service          | Resend Free Tier             | $0              |
| Android Build          | Expo EAS Free Tier           | $0              |
| Domain + DNS           | Cloudflare                   | $10/year        |
| **TOTAL**              |                              | **$5-20/month** |

---

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE DNS                           │
│              api.iayos.com → Railway Backend                    │
│              app.iayos.com → Vercel Frontend                    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐
│    VERCEL     │   │    RAILWAY    │   │    GOOGLE PLAY        │
│  (Next.js)    │   │   (Backend)   │   │    (Android APK)      │
│   FREE TIER   │   │  $5-10/month  │   │                       │
│               │   │               │   │   ┌─────────────────┐ │
│ Dashboard     │   │ ┌───────────┐ │   │   │  iAyos Mobile   │ │
│ Admin Panel   │   │ │  Django   │ │   │   │  (Expo/RN)      │ │
│ Agency Portal │   │ │  Gunicorn │ │   │   │                 │ │
└───────────────┘   │ └───────────┘ │   │   └─────────────────┘ │
        │           │       │       │   └───────────────────────┘
        │           │ ┌───────────┐ │             │
        │           │ │  Daphne   │ │             │
        │           │ │ WebSocket │ │             │
        │           │ └───────────┘ │             │
        │           └───────┬───────┘             │
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐
│    NEON       │   │    UPSTASH    │   │      SUPABASE         │
│  PostgreSQL   │   │  Redis (opt)  │   │   File Storage        │
│  FREE TIER    │   │   FREE TIER   │   │    FREE TIER          │
└───────────────┘   └───────────────┘   └───────────────────────┘
```

---

## 1️⃣ Backend Hosting (Django + WebSockets)

### Recommended: Railway ($5-10/month)

Railway provides the best balance of simplicity and cost for Python backends.

**Why Railway:**

- Native Docker support (use existing Dockerfile)
- Built-in Redis add-on
- Automatic HTTPS
- Easy environment variables
- WebSocket support
- Sleep on inactivity (saves cost)

**Setup Steps:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link to existing repo
railway link

# 5. Add PostgreSQL (or use Neon instead - see Database section)
railway add

# 6. Deploy
railway up
```

**Railway Configuration (`railway.toml`):**

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health/"
healthcheckTimeout = 300
startCommand = "gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 src.iayos_project.wsgi:application"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[service]
internalPort = 8000
```

**Alternative: Render ($7/month)**

- Similar to Railway
- Free 750 hours/month (enough for demo)
- Spins down after 15 min inactivity (cold starts ~30s)

**Alternative: Single VPS ($5/month)**

- Hetzner CX11: €3.29/month (2GB RAM, 1 vCPU)
- DigitalOcean Basic: $4/month (512MB RAM) or $6/month (1GB)
- Run Docker Compose directly
- More control, more maintenance

---

## 2️⃣ PostgreSQL Database

### Recommended: Neon Free Tier ($0)

Your project is already configured for Neon in `.env.docker.example`.

**Neon Free Tier Limits:**

- 0.5 GB storage
- 1 GB data transfer/month
- 1 project, 10 branches
- Autoscale to 0 (saves compute)

**Setup:**

1. Go to [neon.tech](https://neon.tech) and create account
2. Create new project "iayos-demo"
3. Copy connection string:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Set in Railway environment:
   ```
   DATABASE_URL=postgresql://...
   ```

**Alternative: Supabase PostgreSQL ($0)**

- 500MB storage free
- Also provides auth & storage
- Pauses after 1 week inactivity (free tier)

**Alternative: Railway PostgreSQL ($5/month)**

- Better for production
- No cold starts
- Bundled with backend hosting

---

## 3️⃣ Redis (WebSockets Channel Layer)

### Recommended: Upstash Redis Free Tier ($0)

**Upstash Free Tier:**

- 10,000 commands/day
- 256MB storage
- Single region

**Setup:**

1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection string:
   ```
   redis://default:xxx@xxx.upstash.io:6379
   ```
4. Set `REDIS_URL` in Railway

**Alternative: Railway Redis ($5/month)**

- No command limits
- Lower latency (same network)

**Alternative: Disable WebSockets**

If real-time chat isn't critical for demo:

```python
# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
```

---

## 4️⃣ Next.js Frontend (Web Dashboard)

### Recommended: Vercel Free Tier ($0)

Vercel is the creator of Next.js - native support is unmatched.

**Vercel Free Tier Limits:**

- 100GB bandwidth/month
- Serverless functions (10s timeout free)
- Automatic HTTPS
- Edge functions
- Preview deployments

**Setup:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to frontend
cd apps/frontend_web

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard
```

**Environment Variables (Vercel Dashboard):**

```env
# API URLs
NEXT_PUBLIC_API_URL=https://api.iayos.com
NEXT_PUBLIC_WS_URL=wss://api.iayos.com
SERVER_API_URL=https://api.iayos.com

# Auth
AUTH_SECRET=<generate-new>
NEXTAUTH_SECRET=<same-as-auth-secret>
NEXTAUTH_URL=https://app.iayos.com

# Optional: Google OAuth
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-secret>
```

**Vercel Configuration (`vercel.json`):**

```json
{
  "buildCommand": "cd ../.. && npm run build --filter=iayos_final",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

**Alternative: Netlify ($0)**

- Similar features
- 100GB bandwidth free
- Slightly slower builds for Next.js

**Alternative: Cloudflare Pages ($0)**

- Unlimited bandwidth
- Edge-first
- Next.js support improving

---

## 5️⃣ File Storage (Supabase)

### Recommended: Supabase Free Tier ($0)

Already configured in your project.

**Supabase Free Tier:**

- 1GB file storage
- 2GB bandwidth/month
- 50,000 active users/month

**Existing Configuration:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

**Storage Buckets Needed:**

- `avatars` - User profile photos
- `portfolios` - Worker portfolio images
- `certifications` - Certification documents
- `kyc` - KYC verification documents
- `job-images` - Job completion photos

**Setup Commands (Supabase Dashboard → Storage):**

1. Create buckets listed above
2. Set public access for `avatars`, `portfolios`
3. Set authenticated access for `kyc`, `certifications`

---

## 6️⃣ Email Service (Resend)

### Recommended: Resend Free Tier ($0)

Already configured in your project.

**Resend Free Tier:**

- 100 emails/day
- 3,000 emails/month
- Single sending domain

**Existing Configuration:**

```env
RESEND_API_KEY=re_xxx
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=re_xxx
```

**Setup:**

1. Create account at [resend.com](https://resend.com)
2. Verify domain (add DNS records)
3. Get API key

**Alternative: Brevo (formerly Sendinblue) ($0)**

- 300 emails/day free
- SMTP relay

---

## 7️⃣ Android Deployment (Google Play) - NON-NEGOTIABLE

### Phase 1: Create EAS Configuration

Create `apps/frontend_mobile/iayos_mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.iayos.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.iayos.com"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

### Phase 2: Generate Release Keystore

```bash
# Generate keystore (keep this SECURE - lose it = can't update app)
keytool -genkeypair -v -storetype PKCS12 -keystore iayos-release.keystore -alias iayos-key -keyalg RSA -keysize 2048 -validity 10000

# Store keystore info securely (you'll need these):
# - Keystore password
# - Key alias (iayos-key)
# - Key password
```

### Phase 3: Configure EAS Credentials

```bash
# Navigate to mobile app
cd apps/frontend_mobile/iayos_mobile

# Login to Expo
npx eas-cli login

# Configure credentials (uploads keystore to Expo securely)
npx eas credentials

# Select:
# - Platform: Android
# - Profile: production
# - Upload keystore manually
```

### Phase 4: Build Production APK/AAB

```bash
# Build Android App Bundle for Play Store
npx eas build --platform android --profile production

# Or build APK for direct testing
npx eas build --platform android --profile preview
```

### Phase 5: Google Play Console Setup

1. **Create Developer Account** ($25 one-time fee)
   - Go to [play.google.com/console](https://play.google.com/console)
   - Register as individual or organization
   - Pay $25 registration fee

2. **Create App**
   - App name: "iAyos"
   - Default language: English (US)
   - App type: App
   - Free or Paid: Free

3. **App Content Setup**
   - Privacy policy URL (required)
   - App access (restricted features?)
   - Ads declaration
   - Content rating questionnaire
   - Target audience (18+)
   - News app declaration (No)
   - COVID-19 contact tracing (No)
   - Data safety form

4. **Store Listing**
   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon (512x512 PNG)
   - Feature graphic (1024x500)
   - Screenshots (min 2):
     - Phone: 16:9 or 9:16, min 320px, max 3840px
   - Category: Business or Productivity

5. **Upload AAB**

   ```bash
   # Submit to Play Store
   npx eas submit --platform android --profile production
   ```

   Or manually:
   - Go to Production → Create new release
   - Upload `.aab` file from EAS build
   - Add release notes
   - Review and roll out

### Phase 6: Production API URL Configuration

Update `apps/frontend_mobile/iayos_mobile/lib/api/config.ts`:

```typescript
// Production URLs
export const API_URL = __DEV__
  ? `http://${DEV_IP}:8000`
  : "https://api.iayos.com";

export const WEB_URL = __DEV__
  ? `http://${DEV_IP}:3000`
  : "https://app.iayos.com";

export const WS_URL = __DEV__
  ? `ws://${DEV_IP}:8000/ws`
  : "wss://api.iayos.com/ws";
```

### Android Deployment Checklist

- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into Expo account (`eas login`)
- [ ] `eas.json` created with production profile
- [ ] Release keystore generated and secured
- [ ] Credentials configured in EAS
- [ ] API URLs configured for production
- [ ] Google Play Developer account created ($25)
- [ ] App listing content prepared (icon, screenshots, descriptions)
- [ ] Privacy policy URL ready
- [ ] Production build completed
- [ ] AAB uploaded to Play Console
- [ ] App review submitted

---

## 8️⃣ Domain & DNS

### Recommended: Cloudflare ($10/year for domain)

**DNS Configuration:**

| Type  | Name | Content              | Proxy |
| ----- | ---- | -------------------- | ----- |
| A     | api  | Railway IP           | ✓     |
| CNAME | app  | cname.vercel-dns.com | ✓     |
| CNAME | @    | app.iayos.com        | ✓     |

**Free Cloudflare Benefits:**

- DDoS protection
- SSL certificates
- Caching
- Analytics

---

## 9️⃣ CI/CD Pipeline

### Recommended: GitHub Actions (Free for public repos)

**Backend Deploy (`.github/workflows/deploy-backend.yml`):**

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "apps/backend/**"
      - "Dockerfile"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway
        run: npm i -g @railway/cli

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service backend
```

**Frontend Deploy (`.github/workflows/deploy-frontend.yml`):**

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "apps/frontend_web/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/frontend_web
```

**Mobile Build (`.github/workflows/build-mobile.yml`):**

```yaml
name: Build Mobile

on:
  push:
    branches: [main]
    paths:
      - "apps/frontend_mobile/**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build Android
        working-directory: apps/frontend_mobile/iayos_mobile
        run: eas build --platform android --profile production --non-interactive
```

---

## 🔒 Security Hardening for Demo

### Essential Security Checklist

- [ ] Change all default passwords
- [ ] Generate new `DJANGO_SECRET_KEY`
- [ ] Generate new `AUTH_SECRET` and `NEXTAUTH_SECRET`
- [ ] Enable HTTPS only (redirect HTTP)
- [ ] Set `DEBUG=False` in production
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Enable CORS for specific origins only
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled

### Production Environment Variables

```env
# Django
DEBUG=False
ALLOWED_HOSTS=api.iayos.com,iayos.com
DJANGO_SECRET_KEY=<generate-64-char-random>

# CORS
CORS_ALLOWED_ORIGINS=https://app.iayos.com,https://iayos.com

# Auth
AUTH_SECRET=<generate-32-bytes-base64>

# Feature Flags
RATE_LIMIT_DISABLED=False
```

---

## 💰 Complete Cost Breakdown

### Minimum Viable Demo ($5-20/month)

| Service         | Provider   | Plan    | Cost         |
| --------------- | ---------- | ------- | ------------ |
| Backend Hosting | Railway    | Starter | $5-10/mo     |
| Database        | Neon       | Free    | $0           |
| Redis           | Upstash    | Free    | $0           |
| Frontend        | Vercel     | Free    | $0           |
| File Storage    | Supabase   | Free    | $0           |
| Email           | Resend     | Free    | $0           |
| Android Builds  | Expo EAS   | Free    | $0           |
| Domain          | Cloudflare | .com    | $10/year     |
| **TOTAL**       |            |         | **$5-20/mo** |

### One-Time Costs

| Item                  | Cost       |
| --------------------- | ---------- |
| Google Play Developer | $25        |
| Domain Registration   | $10-15     |
| **TOTAL**             | **$35-40** |

### Cost Optimization Tips

1. **Railway Sleep**: Enable auto-sleep after inactivity
2. **Neon Auto-suspend**: Database scales to zero when idle
3. **Vercel Caching**: Reduce serverless function calls
4. **Supabase Pausing**: Be aware of 1-week inactivity pause on free tier
5. **Single Region**: Deploy everything in Singapore (sin1) for lower latency to PH

---

## 🚀 Deployment Timeline

### Day 1: Infrastructure Setup (4 hours)

- [ ] Create Railway account and project
- [ ] Create Neon database
- [ ] Create Upstash Redis
- [ ] Create Vercel project
- [ ] Configure Supabase storage buckets

### Day 2: Backend Deployment (4 hours)

- [ ] Deploy Django backend to Railway
- [ ] Configure environment variables
- [ ] Run migrations
- [ ] Test API endpoints

### Day 3: Frontend Deployment (2 hours)

- [ ] Deploy Next.js to Vercel
- [ ] Configure environment variables
- [ ] Test dashboard functionality

### Day 4: Mobile Build (4 hours)

- [ ] Create `eas.json` configuration
- [ ] Generate release keystore
- [ ] Build production APK/AAB
- [ ] Test on physical device

### Day 5: Google Play (4 hours)

- [ ] Create Google Play developer account
- [ ] Complete app listing
- [ ] Upload AAB
- [ ] Submit for review

### Day 6-7: Testing & Polish

- [ ] End-to-end testing
- [ ] Fix any issues
- [ ] Prepare demo scenarios

---

## 📱 Demo-Ready Checklist

### Backend

- [ ] API responding at https://api.iayos.com
- [ ] Health check passing
- [ ] Migrations applied
- [ ] Admin superuser created
- [ ] Test data seeded (optional)

### Frontend

- [ ] Dashboard at https://app.iayos.com
- [ ] Admin login working
- [ ] Agency portal working
- [ ] Client dashboard working

### Mobile

- [ ] App published to Play Store (internal track)
- [ ] Login/registration working
- [ ] Job browsing working
- [ ] Payment flow working (test mode)
- [ ] Photo upload working

### Data

- [ ] Sample users created (admin, client, workers, agency)
- [ ] Sample job categories seeded
- [ ] Sample jobs posted
- [ ] Test payment credentials (Xendit test mode)

---

## 📚 Quick Reference Commands

```bash
# === Backend (Railway) ===
railway login
railway link
railway up
railway logs
railway variables set KEY=value

# === Frontend (Vercel) ===
vercel login
vercel link
vercel deploy --prod
vercel env pull

# === Mobile (Expo EAS) ===
eas login
eas build --platform android --profile preview  # Test APK
eas build --platform android --profile production  # Play Store AAB
eas submit --platform android  # Submit to Play Store

# === Database (Neon) ===
# Use neon.tech dashboard or:
psql "postgresql://user:pass@host/db?sslmode=require"

# === Local Testing ===
docker-compose -f docker-compose.dev.yml up
```

---

**Created:** December 2025  
**Author:** AI Assistant  
**Status:** Ready for implementation
