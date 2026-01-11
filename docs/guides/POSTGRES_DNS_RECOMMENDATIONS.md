# iAyos Demo Deployment: PostgreSQL & DNS Recommendations

**Date:** January 2026  
**Context:** Demo/defense environment, low traffic, cost-minimized  
**Domain:** Already purchased at GoDaddy

---

## 🎯 Executive Summary (TL;DR)

| Decision           | Recommendation                       | Monthly Cost |
| ------------------ | ------------------------------------ | ------------ |
| **PostgreSQL**     | **Stay on Neon Free Tier**           | $0           |
| **DNS/CDN**        | **Cloudflare Free + GoDaddy domain** | $0           |
| **Total DB + DNS** |                                      | **$0/month** |

**Why not Railway PostgreSQL?** Railway charges ~$5/month minimum for Postgres. For a demo with light usage, Neon's free tier is sufficient and costs nothing.

---

## 1️⃣ PostgreSQL: Neon vs Railway vs Alternatives

### Direct Answer: "Can I just use PostgreSQL from Railway instead of Neon?"

**Yes, you can.** Railway PostgreSQL works fine and is arguably simpler if you're already hosting your backend on Railway. However, **for a demo/defense scenario, it's an unnecessary cost.**

| Factor               | Neon Free             | Railway Postgres    | Supabase Free       |
| -------------------- | --------------------- | ------------------- | ------------------- |
| **Monthly Cost**     | $0                    | ~$5-7/mo            | $0                  |
| **Storage**          | 0.5 GB                | 1 GB                | 500 MB              |
| **Compute**          | 0.25 CU (scales to 0) | Always-on           | Pauses after 1 week |
| **Cold Start**       | ~500ms-2s             | None                | ~5-10s after pause  |
| **Backups**          | 7-day history (free)  | Manual only (hobby) | Daily (free)        |
| **Connection Limit** | 100 concurrent        | Varies              | 60 concurrent       |
| **SSL**              | Required              | Required            | Required            |

---

### Detailed Comparison for Demo Use Case

#### **Neon Free Tier** ✅ RECOMMENDED

**Pros:**

- **$0/month** - Can't beat free for a demo
- Auto-scales to zero when idle (no cost for unused compute)
- 7-day point-in-time recovery included free
- Branching feature useful for testing migrations
- You're already using it (zero migration effort)
- Connection pooling built-in

**Cons:**

- Cold starts (~500ms-2s) after 5 minutes of inactivity
- Limited to 0.25 compute units on free tier
- 0.5 GB storage limit (enough for demo data)
- Some report occasional connection drops

**Gotchas:**

- **Auto-suspend after 5 min idle**: First query after idle takes 500ms-2s. For a demo this is usually fine—just click around before presenting.
- **Free tier is truly free**: No credit card required, no trial that expires.

**Verdict for Demo:** ✅ **Good enough.** The cold start is annoying but acceptable for a defense. Your data is already there.

---

#### **Railway PostgreSQL**

**Pros:**

- No cold starts (always warm)
- Same network as Railway backend = lower latency
- Simple setup if backend is on Railway
- 1 GB storage on Hobby tier

**Cons:**

- **~$5-7/month** - Unnecessary cost for a demo
- Manual backups only on Hobby tier (no automatic PITR)
- Still need to migrate data from Neon

**Gotchas:**

- **Hobby plan minimum**: You can't run Railway Postgres for $0. Minimum spend is ~$5/mo.
- **No free tier for databases**: Railway's $5 free trial credits run out, then you pay.

**Verdict for Demo:** ⚠️ **Works but costs money.** Only worth it if cold starts are truly unacceptable for your demo.

---

#### **Supabase PostgreSQL** (Alternative)

**Pros:**

- $0/month on free tier
- 500 MB storage
- Built-in auth, storage, edge functions
- Daily backups included

**Cons:**

- **Pauses after 1 week of inactivity** - Must login to dashboard to unpause
- Longer cold start than Neon (~5-10s after pause)
- Would need to migrate from Neon

**Verdict for Demo:** ⚠️ **Viable but pause behavior is worse than Neon.** If you forget to unpause before the defense, the app breaks.

---

### 🏆 PostgreSQL Recommendation

> **For this demo, stay on Neon Free Tier.**
>
> **Rationale:** You're already on Neon, it's working, it costs $0, and the cold start issue is manageable for a demo. Migrating to Railway would cost ~$5-7/month with no meaningful benefit for your use case.

**If cold starts are unacceptable** (e.g., you're doing a live demo with investors who can't wait 2 seconds):

- Upgrade to **Neon Launch tier ($19/mo)** for always-warm compute, OR
- Use **Railway Postgres (~$5-7/mo)** if you want simplicity with Railway backend

---

### Migration Steps (If You Choose Railway)

If you decide to switch anyway:

```bash
# 1. Export from Neon
pg_dump "postgresql://user:pass@neon-host/neondb?sslmode=require" > neon_backup.sql

# 2. Create Railway Postgres (in Railway dashboard or CLI)
railway add  # Select PostgreSQL

# 3. Get Railway connection string from dashboard
# Format: postgresql://postgres:xxx@xxx.railway.app:5432/railway

# 4. Import to Railway
psql "postgresql://postgres:xxx@xxx.railway.app:5432/railway" < neon_backup.sql

# 5. Update environment variable
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway?sslmode=require
```

**Code changes needed:** Just update `DATABASE_URL` in your Railway environment variables. The Django app uses `dj-database-url` which parses the URL automatically—no code changes required.

---

## 2️⃣ DNS/CDN: Cloudflare with GoDaddy Domain

### Direct Answer: "Will I incur additional costs in Cloudflare if I just use my GoDaddy domain there for DNS/proxy on the free plan?"

**No.** Cloudflare's Free plan is genuinely free for DNS and proxy services. You can use your GoDaddy domain with Cloudflare at $0/month.

---

### How Cloudflare Works with External Domains

```
┌─────────────────────────────────────────────────────────────┐
│                      BEFORE (Current)                       │
│                                                             │
│   GoDaddy (Registrar + DNS)                                │
│   └── DNS Records point directly to:                       │
│       └── Your servers (Railway, Vercel, etc.)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AFTER (Recommended)                       │
│                                                             │
│   GoDaddy (Registrar only - just holds the domain)         │
│   └── Nameservers: ns1.cloudflare.com, ns2.cloudflare.com  │
│                                                             │
│   Cloudflare (DNS + Proxy + SSL + Caching)                 │
│   └── DNS Records:                                          │
│       ├── api.iayos.com → Railway backend (proxied)        │
│       ├── app.iayos.com → Vercel frontend (proxied)        │
│       └── @ → redirect to app.iayos.com                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** The domain stays registered at GoDaddy. You're just telling GoDaddy "Cloudflare handles my DNS now." This costs $0 extra.

---

### Cloudflare Free Tier: What's Included

| Feature             | Free Tier                | Useful for Demo?           |
| ------------------- | ------------------------ | -------------------------- |
| **DNS Hosting**     | ✅ Unlimited             | Yes - fast, reliable       |
| **SSL/TLS (HTTPS)** | ✅ Universal SSL         | Yes - automatic HTTPS      |
| **CDN/Caching**     | ✅ Global edge cache     | Yes - faster static assets |
| **DDoS Protection** | ✅ Basic L3/L4           | Yes - basic protection     |
| **Proxy Mode**      | ✅ Hide origin IPs       | Yes - security             |
| **Page Rules**      | ✅ 3 rules               | Yes - redirects            |
| **Analytics**       | ✅ Basic (24h retention) | Yes - see traffic          |
| **Bot Management**  | ❌ Paid only             | Not needed for demo        |
| **WAF (Advanced)**  | ❌ Paid only             | Not needed for demo        |
| **Workers**         | ✅ 100k requests/day     | Optional, not needed       |

**Bottom line:** Everything you need for a demo is free.

---

### What's NOT Included (Paid Features)

These are **not needed** for a demo environment:

| Paid Feature            | Cost          | Why You Don't Need It            |
| ----------------------- | ------------- | -------------------------------- |
| Pro Plan                | $20/mo        | Advanced WAF, image optimization |
| Business Plan           | $200/mo       | Custom SSL, SLA                  |
| Enterprise              | $$$           | Enterprise support               |
| Advanced Bot Protection | $20/mo+       | You don't have bot problems      |
| Load Balancing          | $5/mo+        | Single backend is fine           |
| Argo Smart Routing      | $5/mo + usage | Overkill for demo                |

---

### Setup Steps: Cloudflare with GoDaddy

**Step 1: Create Cloudflare Account**

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free)
3. Click "Add a Site"
4. Enter your domain: `iayos.com`
5. Select **Free Plan**

**Step 2: Cloudflare Scans Your DNS**

- Cloudflare will import existing DNS records from GoDaddy
- Review them, add any missing records

**Step 3: Configure DNS Records**

| Type       | Name  | Content                | Proxy      |
| ---------- | ----- | ---------------------- | ---------- |
| A or CNAME | `api` | Railway URL            | ✅ Proxied |
| CNAME      | `app` | `cname.vercel-dns.com` | ✅ Proxied |
| CNAME      | `@`   | `app.iayos.com`        | ✅ Proxied |
| CNAME      | `www` | `app.iayos.com`        | ✅ Proxied |

**Step 4: Update GoDaddy Nameservers**

Cloudflare will give you two nameservers like:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

In GoDaddy:

1. Go to Domain Settings → DNS → Nameservers
2. Change from "GoDaddy Nameservers" to "Custom"
3. Enter the Cloudflare nameservers
4. Save

**Step 5: Wait for Propagation**

- Takes 15 minutes to 24 hours (usually ~1 hour)
- Cloudflare shows "Active" when done

**Step 6: Enable SSL**

- Go to SSL/TLS → Overview
- Set mode to **Full (Strict)** (since Railway/Vercel have valid SSL)

---

### Cloudflare Recommendation

> **Use Cloudflare Free Plan as your DNS + CDN layer.**
>
> **Setup:** Point GoDaddy nameservers to Cloudflare. All DNS management moves to Cloudflare dashboard.
>
> **Cost:** $0/month
>
> **Benefits:** Free SSL, DDoS protection, CDN caching, hides origin IPs, fast DNS.

---

## 3️⃣ Complete Cost Summary

### Monthly Costs for Demo

| Component       | Provider       | Plan  | Monthly Cost  |
| --------------- | -------------- | ----- | ------------- |
| PostgreSQL      | **Neon**       | Free  | $0            |
| DNS/CDN         | **Cloudflare** | Free  | $0            |
| Backend Hosting | Railway        | Hobby | ~$5-10        |
| Redis           | Upstash        | Free  | $0            |
| Frontend        | Vercel         | Free  | $0            |
| File Storage    | Supabase       | Free  | $0            |
| Email           | Resend         | Free  | $0            |
| **TOTAL**       |                |       | **~$5-10/mo** |

### One-Time Costs

| Item           | Cost         | Notes                |
| -------------- | ------------ | -------------------- |
| GoDaddy Domain | Already paid | ~$12-15/year renewal |
| Google Play    | $25          | One-time fee         |

---

## 4️⃣ Final Recommendations

### Database

✅ **Stay on Neon Free Tier**

- You're already using it
- $0/month
- Cold starts (~1-2s) are acceptable for demo
- No migration needed

### DNS/CDN

✅ **Use Cloudflare Free + GoDaddy domain**

- Point GoDaddy nameservers to Cloudflare
- $0/month
- Free SSL, CDN, DDoS protection
- All features needed for demo are free

### What You Need to Do

1. **Database:** Nothing. Keep using Neon.

2. **Cloudflare Setup (30 minutes):**

   ```
   1. Create Cloudflare account
   2. Add iayos.com site (Free plan)
   3. Configure DNS records for api/app subdomains
   4. Update GoDaddy nameservers to Cloudflare's
   5. Wait for propagation (~1 hour)
   6. Set SSL mode to "Full (Strict)"
   ```

3. **Environment Variables:** Update `ALLOWED_HOSTS` to include your domain:
   ```env
   ALLOWED_HOSTS=localhost,127.0.0.1,api.iayos.com,iayos.com
   ```

---

## 5️⃣ Decision Matrix

| Scenario                           | Database Choice         | DNS Choice         |
| ---------------------------------- | ----------------------- | ------------------ |
| **Minimum cost, cold starts OK**   | Neon Free ✅            | Cloudflare Free ✅ |
| **No cold starts, willing to pay** | Railway (~$5-7/mo)      | Cloudflare Free ✅ |
| **Already have Supabase**          | Supabase Free (pauses!) | Cloudflare Free ✅ |

**For your demo:** First row. **Total: ~$5-10/month** (just Railway backend hosting).

---

_Last Updated: January 2026_
