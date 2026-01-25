# Health Checks & Database Backup Setup Guide

This guide explains how to configure the automated health monitoring and database backup workflows.

## 📋 Table of Contents

- [Health Check Workflow](#health-check-workflow)
- [Database Backup Workflow](#database-backup-workflow)
- [Required GitHub Secrets](#required-github-secrets)
- [Optional Integrations](#optional-integrations)
- [Testing the Workflows](#testing-the-workflows)

---

## 🏥 Health Check Workflow

**File**: `.github/workflows/health-check.yml`

### What It Does

- **Runs every 5 minutes** to monitor your production services
- Checks backend liveness (`/health/live`)
- Checks backend readiness (`/health/ready`)
- Verifies frontend accessibility
- Tests database connectivity
- Tests Redis cache connectivity
- Sends alerts on critical failures
- Creates GitHub issues automatically

### Health Check Endpoints

Your Django backend exposes three health check endpoints:

```python
# Liveness probe - is the app running?
GET /health/live
Response: {"status": "alive", "timestamp": 1234567890}

# Readiness probe - can the app serve traffic?
GET /health/ready
Response: {
  "status": "ready",
  "checks": {
    "database": true,
    "cache": true
  },
  "timestamp": 1234567890
}

# Detailed status (use internally)
GET /health/status
Response: {
  "database": true,
  "database_latency_ms": 12.34,
  "cache": true,
  "cache_latency_ms": 5.67,
  "circuit_breakers": []
}
```

### Setup Steps

1. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):

   ```
   BACKEND_URL=https://your-backend.onrender.com
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

2. **Optional - Slack Notifications**:

   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

   To create a Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Add "Incoming Webhooks" feature
   - Activate webhooks and create new webhook
   - Copy webhook URL to GitHub secret

3. **Enable the workflow**:
   - The workflow runs automatically every 5 minutes
   - You can also trigger it manually from GitHub Actions tab

### What Happens on Failure

1. **Slack Notification** (if configured):
   ```
   🚨 iAyos Health Check FAILED
   
   Failed checks:
   ❌ Backend Liveness
   ❌ Database Connection
   
   Time: 2026-01-25 12:34:56 UTC
   ```

2. **GitHub Issue Created** (for critical failures):
   - Automatically creates issue with label `health-check`, `automated`, `critical`
   - Includes timestamp, failed checks, and action items
   - Adds comments to existing open issue instead of creating duplicates

3. **Email Alert**:
   - GitHub sends email to repository watchers on workflow failure

---

## 💾 Database Backup Workflow

**File**: `.github/workflows/database-backup.yml`

### What It Does

- **Runs daily at 2 AM UTC** (10 AM Manila time)
- Backs up PostgreSQL database from Render
- Creates two backup formats:
  - `.dump` - Custom compressed format (optimal for restore)
  - `.sql.gz` - Plain SQL format (easy to inspect)
- Verifies backup integrity
- Uploads to GitHub Artifacts (30-day retention)
- Optionally uploads to AWS S3
- Auto-cleans old backups (>30 days)
- Tests restoration weekly

### Setup Steps

#### 1. Get Render Database URL

In your Render dashboard:
1. Go to your PostgreSQL database
2. Click "Connect" → "External Connection"
3. Copy the **External Database URL**
4. Format: `postgresql://user:password@host:5432/database`

#### 2. Add GitHub Secret

Settings → Secrets and variables → Actions:

```
RENDER_DATABASE_URL=postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com:5432/iayos_db
```

**⚠️ IMPORTANT**: This URL contains your database password! Keep it secret.

#### 3. Optional - AWS S3 Backup

For long-term storage in AWS S3, add these secrets:

```
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-southeast-1
AWS_S3_BACKUP_BUCKET=iayos-database-backups
```

To create S3 bucket:
1. Go to AWS S3 console
2. Create bucket: `iayos-database-backups`
3. Enable versioning (recommended)
4. Create IAM user with S3 write permissions
5. Copy access keys to GitHub secrets

#### 4. Enable the Workflow

The workflow runs automatically, but you can also:
- **Manual trigger**: Go to Actions → Database Backup → Run workflow
- **Custom backup name**: Click "Run workflow" → Enter custom name

---

## 🔑 Required GitHub Secrets

### Minimal Setup (Health Checks Only)

```bash
BACKEND_URL=https://iayos-backend.onrender.com
FRONTEND_URL=https://iayos.vercel.app
```

### Database Backups

```bash
RENDER_DATABASE_URL=postgresql://user:password@host:5432/database
```

### Optional Integrations

```bash
# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# AWS S3 backup storage
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxx
AWS_REGION=ap-southeast-1
AWS_S3_BACKUP_BUCKET=iayos-backups
```

---

## 🧪 Testing the Workflows

### Test Health Check Manually

```bash
# Test liveness endpoint
curl https://your-backend.onrender.com/health/live

# Test readiness endpoint
curl https://your-backend.onrender.com/health/ready

# Should return 200 OK with JSON response
```

### Test Database Backup Manually

1. Go to GitHub Actions tab
2. Select "Database Backup" workflow
3. Click "Run workflow"
4. Enter optional custom backup name
5. Click "Run workflow" button
6. Wait ~2-5 minutes
7. Check "Artifacts" section for backup files

### Download Backup from GitHub

1. Go to workflow run
2. Scroll to "Artifacts" section
3. Click backup name to download
4. Extract `.dump` file

### Restore Backup Locally

```bash
# Using custom format (.dump)
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=your_user \
  --dbname=your_database \
  --no-owner \
  --no-acl \
  backup_file.dump

# Using SQL format (.sql.gz)
gunzip backup_file.sql.gz
psql -U your_user -d your_database < backup_file.sql
```

---

## 📊 Backup Schedule

### GitHub Artifacts

- **Retention**: 30 days
- **Storage**: Free (included in GitHub Actions)
- **Daily backups** = ~900 MB/month (30 days × 30 MB per backup)

### AWS S3 (Optional)

- **Retention**: 30 days (auto-cleanup)
- **Storage**: ~$0.15/month for 30 GB
- **Versioning**: Recommended for extra safety

---

## 🚨 Monitoring & Alerts

### Health Check Alerts

**Frequency**: Every 5 minutes

**Alert Triggers**:
- Backend liveness failure (app down)
- Backend readiness failure (database/cache issue)
- Database connection failure (critical)
- Frontend inaccessibility (warning)

**Alert Channels**:
1. Slack webhook (if configured)
2. GitHub issue (critical failures only)
3. Email (GitHub workflow notifications)

### Backup Alerts

**Frequency**: Daily at 2 AM UTC

**Alert Triggers**:
- Backup creation failure
- Backup verification failure
- S3 upload failure (if configured)

**Alert Channels**:
1. Slack webhook (if configured)
2. Email (workflow failure notification)

---

## 🔧 Troubleshooting

### Health Check Fails - "Connection refused"

**Problem**: Backend not accessible

**Solutions**:
1. Check Render dashboard - is service running?
2. Verify `BACKEND_URL` secret is correct
3. Check if Render service is sleeping (free tier)
4. Review backend logs in Render

### Health Check Fails - "Database check failed"

**Problem**: Database connection issue

**Solutions**:
1. Check Render database status
2. Verify database isn't sleeping (free tier)
3. Check connection limits (max connections)
4. Review Django logs for database errors

### Backup Fails - "Authentication failed"

**Problem**: Invalid database credentials

**Solutions**:
1. Regenerate Render database URL (it may rotate)
2. Update `RENDER_DATABASE_URL` secret
3. Ensure URL format is correct: `postgresql://user:pass@host:port/db`

### Backup Fails - "pg_dump: command not found"

**Problem**: PostgreSQL client not installed (shouldn't happen in GitHub Actions)

**Solutions**:
1. Workflow already installs `postgresql-client`
2. Check workflow logs for installation errors

### S3 Upload Fails - "Access Denied"

**Problem**: AWS credentials or permissions issue

**Solutions**:
1. Verify IAM user has S3 write permissions
2. Check bucket policy allows uploads
3. Verify AWS credentials are correct
4. Ensure bucket exists in specified region

---

## 📈 Next Steps

### Phase 1 Complete ✅

- [x] Health check endpoints in Django
- [x] Health monitoring workflow (every 5 minutes)
- [x] Database backup workflow (daily)
- [x] Backup verification
- [x] GitHub Artifacts storage (30 days)

### Optional Enhancements

- [ ] **Staging Environment**: Add health checks for staging
- [ ] **Performance Metrics**: Track response times over time
- [ ] **Uptime Dashboard**: Create public status page (statuspage.io)
- [ ] **Multi-region Backups**: Replicate to multiple S3 regions
- [ ] **Backup Encryption**: Encrypt backups with GPG before upload
- [ ] **Database Replication**: Set up read replicas in Render
- [ ] **Automated Failover**: Auto-switch to backup database on failure

---

## 📚 References

- [Render PostgreSQL Backups](https://render.com/docs/databases#backups)
- [Django Health Checks](https://docs.djangoproject.com/en/5.0/topics/http/middleware/)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [AWS S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)

---

**Last Updated**: January 25, 2026  
**Status**: ✅ Workflows ready for production  
**Maintenance**: Review and test backups monthly
