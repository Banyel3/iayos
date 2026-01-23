# iAyos Production Deployment Guide: Railway + Cloudflare + Google OAuth

**Date:** January 2026  
**Environment:** Demo/Defense  
**Domain:** Existing GoDaddy domain (e.g., `iayos.com`)

---

## 📊 Overview

This guide covers the complete production deployment setup for iAyos:

| Component             | Provider           | Cost          |
| --------------------- | ------------------ | ------------- |
| Backend (Django)      | Railway            | ~$5-10/mo     |
| Database (PostgreSQL) | Neon Free Tier     | $0            |
| Redis (WebSockets)    | Upstash Free Tier  | $0            |
| Frontend (Next.js)    | Vercel Free Tier   | $0            |
| DNS/CDN               | Cloudflare Free    | $0            |
| Domain                | GoDaddy (existing) | Already paid  |
| Google OAuth          | Google Cloud       | $0            |
| **Total**             |                    | **~$5-10/mo** |

---

## Part 1: Railway Backend Deployment

### 1.1 Prerequisites

- GitHub account with iAyos repository
- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 1.2 Create Railway Project

```bash
# Navigate to project root
cd /path/to/iayos

# Initialize Railway project
railway init

# Link to existing repo (if prompted)
railway link
```

### 1.3 Configure Railway Services

In Railway Dashboard:

1. **Create New Project** → "Deploy from GitHub repo"
2. Select `iayos` repository
3. Railway will detect the `Dockerfile`

**Configure Build Settings:**

- **Build Command:** (auto-detected from Dockerfile)
- **Start Command:**
  ```bash
  gunicorn --bind 0.0.0.0:$PORT --workers 2 --worker-class sync --timeout 120 src.iayos_project.wsgi:application
  ```
- **Dockerfile Path:** `Dockerfile`
- **Docker Target:** `backend-production`

### 1.4 Environment Variables (Railway)

Set these in Railway Dashboard → Variables:

```env
# Database (Neon - keep existing)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Django Settings
DJANGO_SECRET_KEY=<generate-new-64-char-key>
DEBUG=False
ALLOWED_HOSTS=api.iayos.com,iayos.com,*.railway.app
ENVIRONMENT=production

# Redis (Upstash)
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# Xendit Payments (use production keys)
XENDIT_API_KEY=xnd_production_xxx
XENDIT_WEBHOOK_TOKEN=your-webhook-token

# Google OAuth (see Part 3)
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# Frontend URL (for CORS)
FRONTEND_URL=https://app.iayos.com
```

### 1.5 Deploy

```bash
# Deploy to Railway
railway up

# Or trigger from GitHub push (auto-deploy)
git push origin main
```

### 1.6 Get Railway Domain

After deployment:

1. Go to Railway Dashboard → Service → Settings → Domains
2. Generate a Railway domain: `iayos-backend-xxx.up.railway.app`
3. Note this for Cloudflare DNS setup

---

## Part 2: Cloudflare DNS Setup (with GoDaddy Domain)

### 2.1 Add Site to Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com) → Sign up/Login
2. Click **"Add a Site"**
3. Enter your domain: `iayos.com`
4. Select **Free Plan**
5. Click **Continue**

### 2.2 Cloudflare Scans DNS Records

Cloudflare will automatically import existing DNS records from GoDaddy. Review them carefully.

### 2.3 Configure DNS Records

Delete old records and add these:

| Type  | Name  | Content                            | Proxy      | TTL  |
| ----- | ----- | ---------------------------------- | ---------- | ---- |
| CNAME | `api` | `iayos-backend-xxx.up.railway.app` | ✅ Proxied | Auto |
| CNAME | `app` | `cname.vercel-dns.com`             | ✅ Proxied | Auto |
| CNAME | `@`   | `app.iayos.com`                    | ✅ Proxied | Auto |
| CNAME | `www` | `app.iayos.com`                    | ✅ Proxied | Auto |

**Important:** The orange cloud (✅ Proxied) means traffic goes through Cloudflare, providing:

- Free SSL
- DDoS protection
- Caching
- Hidden origin IPs

### 2.4 Update GoDaddy Nameservers

Cloudflare will provide nameservers like:

```
austin.ns.cloudflare.com
vida.ns.cloudflare.com
```

In GoDaddy:

1. Login → My Products → DNS → Manage
2. Scroll to **Nameservers** section
3. Click **Change** → **Enter my own nameservers**
4. Enter Cloudflare nameservers (both of them)
5. Save

**Propagation Time:** 15 minutes to 48 hours (usually ~1-2 hours)

### 2.5 SSL/TLS Configuration (Cloudflare)

After nameservers propagate:

1. Go to Cloudflare Dashboard → SSL/TLS → Overview
2. Set encryption mode to **Full (Strict)**
   - This requires valid SSL on origin (Railway/Vercel both have valid SSL)

3. Go to SSL/TLS → Edge Certificates
   - Enable **Always Use HTTPS** ✅
   - Enable **Automatic HTTPS Rewrites** ✅

### 2.6 Page Rules (Optional)

Create these free page rules:

| Rule        | URL Match                | Setting               |
| ----------- | ------------------------ | --------------------- |
| Force HTTPS | `*iayos.com/*`           | Always Use HTTPS      |
| Cache API   | `api.iayos.com/static/*` | Cache Level: Standard |

### 2.7 Verify Setup

```bash
# Check DNS propagation
dig api.iayos.com
dig app.iayos.com

# Test HTTPS
curl -I https://api.iayos.com/health/live
curl -I https://app.iayos.com
```

### 2.8 Cloudflare Cost Summary

| Feature          | Included Free | Notes               |
| ---------------- | ------------- | ------------------- |
| DNS Hosting      | ✅            | Unlimited queries   |
| SSL Certificates | ✅            | Universal SSL       |
| CDN/Caching      | ✅            | Global edge network |
| DDoS Protection  | ✅            | L3/L4 attacks       |
| Basic Analytics  | ✅            | 24-hour retention   |
| 3 Page Rules     | ✅            | Enough for demo     |
| **Total Cost**   | **$0/month**  |                     |

---

## Part 3: Google OAuth Setup for Production

### Current Implementation Status

The iAyos backend uses **Django Allauth** for Google OAuth:

```python
# settings.py - Already configured
INSTALLED_APPS = [
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.getenv('AUTH_GOOGLE_ID'),
            'secret': os.getenv('AUTH_GOOGLE_SECRET'),
        }
    }
}
```

**URLs configured:**

- Login initiation: `/auth/google/login/` (Django Allauth)
- Callback: `/auth/google/callback/` (handled by Allauth)
- API wrapper: `/api/accounts/auth/google/login` (redirects to Allauth)

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select Project** → **New Project**
3. Name: `iAyos Production`
4. Click **Create**

### 3.2 Enable OAuth APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Google+ API** (for profile info)
   - **Google People API** (for profile info)

### 3.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Fill in:
   - **App name:** `iAyos`
   - **User support email:** your email
   - **App logo:** upload iAyos logo (optional)
   - **App domain:** `iayos.com`
   - **Authorized domains:** `iayos.com`
   - **Developer contact:** your email
4. Click **Save and Continue**

5. **Scopes:** Add these scopes:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**

7. **Test users:** (only needed while in "Testing" mode)
   - Add email addresses of testers
8. Click **Save and Continue**

### 3.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name: `iAyos Web Client`

5. **Authorized JavaScript origins:**

   ```
   https://iayos.com
   https://app.iayos.com
   https://api.iayos.com
   http://localhost:3000        (for local dev)
   http://localhost:8000        (for local dev)
   ```

6. **Authorized redirect URIs:**

   ```
   https://api.iayos.com/auth/google/callback/
   https://api.iayos.com/accounts/google/login/callback/
   http://localhost:8000/auth/google/callback/
   http://localhost:8000/accounts/google/login/callback/
   ```

7. Click **Create**

8. Copy:
   - **Client ID:** `xxx.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-xxx`

### 3.5 Set Environment Variables

**Railway (Backend):**

```env
AUTH_GOOGLE_ID=1234567890-abc123.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-abc123xyz
```

**Vercel (Frontend) - if needed:**

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
```

### 3.6 Update Django Settings for Production

The current settings need these production updates:

```python
# settings.py - Add production URLs to CSRF trusted origins
CSRF_TRUSTED_ORIGINS = [
    "https://iayos.com",
    "https://app.iayos.com",
    "https://api.iayos.com",
    # Keep localhost for dev
    "http://localhost:3000",
    "http://localhost:8000",
]

# Update CORS for production
CORS_ALLOWED_ORIGINS = [
    "https://iayos.com",
    "https://app.iayos.com",
    # Keep localhost for dev
    "http://localhost:3000",
]
```

### 3.7 Publish OAuth App (Go Live)

By default, Google OAuth apps are in "Testing" mode (limited to 100 test users).

To go live:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Complete Google's verification if required (may take days/weeks)

**For Demo/Defense:** Testing mode is fine—just add your demo users as test users.

### 3.8 Test Google OAuth Flow

```bash
# 1. Visit the login page
open https://app.iayos.com/auth/login

# 2. Click "Continue with Google"
# 3. Should redirect to Google OAuth
# 4. After approval, redirects to callback
# 5. User is logged in
```

### 3.9 Frontend Google Login - Implementation Status

**✅ FIXED:** The login page (`app/auth/login/page.tsx`) has been updated to use environment-aware API URLs.

**Changes Made:**

1. Created centralized config: `lib/api-config.ts`
2. Updated login page to import and use `API_URL`
3. Google OAuth button now uses: `href={`${API_URL}/auth/google/login/`}`
4. `/api/accounts/me` call now uses `${API_URL}`

**⚠️ REMAINING: Other Files Need Refactoring**

The following files still have hardcoded `localhost:8000` URLs and should be updated before production:

| File                                              | APIs Used                |
| ------------------------------------------------- | ------------------------ |
| `lib/hooks/useInboxQueries.ts`                    | Job completion, approval |
| `lib/hooks/useLocationSharing.ts`                 | Location updates         |
| `lib/hooks/useWorkerAvailability.ts`              | Worker availability      |
| `lib/hooks/useMessages.ts`                        | Messaging                |
| `lib/hooks/useConversations.ts`                   | Conversations            |
| `lib/worker-materials-api.ts`                     | Worker products          |
| `components/admin/KYCExtractedDataComparison.tsx` | KYC data                 |
| `app/admin/settings/platform/page.tsx`            | Platform settings        |

**How to Fix (Pattern):**

```typescript
// 1. Import the centralized config
import { API_URL } from '@/lib/api-config';

// 2. Replace hardcoded URLs
// Before:
fetch("http://localhost:8000/api/jobs/${jobId}/mark-complete", ...)

// After:
fetch(`${API_URL}/api/jobs/${jobId}/mark-complete`, ...)
```

**Centralized Config Created (`lib/api-config.ts`):**

```typescript
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
export const SERVER_API_URL = process.env.SERVER_API_URL || API_URL;
```

---

## Part 4: Vercel Frontend Deployment

### 4.1 Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd apps/frontend_web

# Deploy
vercel

# Follow prompts to link to project
```

### 4.2 Environment Variables (Vercel Dashboard)

```env
# API URLs
NEXT_PUBLIC_API_URL=https://api.iayos.com
NEXT_PUBLIC_WS_URL=wss://api.iayos.com/ws
SERVER_API_URL=https://api.iayos.com

# Auth
AUTH_SECRET=<generate-32-bytes>
NEXTAUTH_URL=https://app.iayos.com

# Google OAuth (optional - for client-side features)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Turnstile (Cloudflare CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
```

### 4.3 Add Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add `app.iayos.com`
3. Vercel will provide verification TXT record or use `cname.vercel-dns.com`

---

## Part 5: Final Checklist

### Railway Backend

- [ ] Service deployed and healthy
- [ ] Environment variables set
- [ ] Custom domain configured (via Cloudflare)
- [ ] HTTPS working

### Cloudflare DNS

- [ ] Site added to Cloudflare
- [ ] GoDaddy nameservers updated
- [ ] DNS records configured (api, app, @, www)
- [ ] SSL mode set to Full (Strict)
- [ ] Always Use HTTPS enabled

### Google OAuth

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Redirect URIs include production URLs
- [ ] AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET set in Railway
- [ ] Test users added (if in Testing mode)

### Vercel Frontend

- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Custom domain added

### Database (Neon)

- [ ] DATABASE_URL set in Railway
- [ ] Migrations run (`python manage.py migrate`)

### Final Tests

- [ ] `https://api.iayos.com/health/live` returns 200
- [ ] `https://app.iayos.com` loads dashboard
- [ ] Google OAuth login works
- [ ] Regular email/password login works
- [ ] Mobile app connects to production API

---

## Part 6: Troubleshooting

### DNS Not Propagating

```bash
# Check propagation status
dig api.iayos.com +short
nslookup api.iayos.com

# Or use online tool
# https://dnschecker.org
```

### Google OAuth "redirect_uri_mismatch"

- Ensure the callback URL in Google Console exactly matches:
  - `https://api.iayos.com/auth/google/callback/` (with trailing slash)
- Check for http vs https mismatch

### CORS Errors

- Add production URLs to `CORS_ALLOWED_ORIGINS` in Django settings
- Add to `CSRF_TRUSTED_ORIGINS`

### Railway Build Fails

```bash
# Check logs
railway logs

# SSH into container (if enabled)
railway shell
```

### Cloudflare SSL Errors (525, 526)

- Ensure Railway has valid SSL (it should by default)
- Set Cloudflare SSL mode to "Full (Strict)"
- Wait for Cloudflare's edge certificates to provision (~15 min)

---

## Part 7: Cost Summary

| Service            | Plan          | Monthly Cost  |
| ------------------ | ------------- | ------------- |
| Railway Backend    | Hobby/Starter | ~$5-10        |
| Neon PostgreSQL    | Free          | $0            |
| Upstash Redis      | Free          | $0            |
| Vercel Frontend    | Free          | $0            |
| Cloudflare DNS/CDN | Free          | $0            |
| Google OAuth       | Free          | $0            |
| Supabase Storage   | Free          | $0            |
| Resend Email       | Free          | $0            |
| **Total**          |               | **~$5-10/mo** |

### One-Time Costs

| Item                  | Cost                                |
| --------------------- | ----------------------------------- |
| GoDaddy Domain        | Already paid (~$12-15/year renewal) |
| Google Play Developer | $25 (for mobile app)                |

---

## Quick Reference: Environment Variables

### Railway (Backend)

```env
DATABASE_URL=postgresql://...
DJANGO_SECRET_KEY=<64-char-random>
DEBUG=False
ALLOWED_HOSTS=api.iayos.com,*.railway.app
REDIS_URL=redis://...
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
XENDIT_API_KEY=xnd_production_xxx
RESEND_API_KEY=re_xxx
FRONTEND_URL=https://app.iayos.com
```

### Vercel (Frontend)

```env
NEXT_PUBLIC_API_URL=https://api.iayos.com
SERVER_API_URL=https://api.iayos.com
AUTH_SECRET=<32-bytes-base64>
NEXTAUTH_URL=https://app.iayos.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
```

---

_Last Updated: January 2026_
