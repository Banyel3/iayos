# Payment Buffer Cron Setup - COMPLETE ✅

**Date**: December 10, 2025  
**Status**: ✅ Implemented and Running  
**Type**: Infrastructure - Automated Payment Release

## Overview

The payment buffer system holds worker earnings for 7 days before releasing to their wallet. This allows clients to request backjobs/refunds during the cooling-off period.

The `release_pending_payments` management command automatically releases payments once the buffer period expires. This document describes the cron setup that runs this command hourly.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Container                          │
│                   (iayos-backend-dev)                       │
│                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │   crond     │────▶│  release_pending_payments       │   │
│  │  (PID 8)    │     │  (Every hour at :00)            │   │
│  │  runs as    │     │                                 │   │
│  │   root      │     │  - Checks for expired buffers   │   │
│  └─────────────┘     │  - Moves pending → balance      │   │
│                      │  - Creates EARNING transaction  │   │
│  ┌─────────────┐     │  - Sends PAYMENT_RELEASED       │   │
│  │  daphne     │     │    notification to worker       │   │
│  │  (PID 25)   │     └─────────────────────────────────┘   │
│  │  runs as    │                                           │
│  │  appuser    │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Dockerfile Changes

**File**: `Dockerfile` (backend-development stage)

```dockerfile
# Install cron daemon and su-exec for privilege management
RUN apk add --no-cache \
    postgresql-client \
    libpq \
    dcron \
    su-exec

# Setup cron job for payment buffer release (runs every hour)
RUN echo "0 * * * * cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments >> /var/log/cron.log 2>&1" > /etc/crontabs/root \
    && touch /var/log/cron.log \
    && chmod 0644 /var/log/cron.log
```

### docker-compose.dev.yml Changes

**File**: `docker-compose.dev.yml` (backend service command)

```yaml
command: >
  sh -c "
    echo '🕐 Starting cron daemon for scheduled tasks...' &&
    crond -b -l 8 &&
    echo '✅ Cron is running. Payment release scheduled every hour.' &&
    cd /app/apps/backend/src &&
    su-exec appuser python3 manage.py migrate &&
    su-exec appuser daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
  "
```

### Crontab Entry

```cron
0 * * * * cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments >> /var/log/cron.log 2>&1
```

**Schedule**: Every hour at minute 0 (e.g., 00:00, 01:00, 02:00, ...)

## Verification

### 1. Check Cron Daemon Running

```bash
docker exec iayos-backend-dev ps aux | grep cron
# Expected: crond -b -l 8
```

### 2. Check Crontab Configuration

```bash
docker exec iayos-backend-dev cat /etc/crontabs/root
# Expected: 0 * * * * cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments >> /var/log/cron.log 2>&1
```

### 3. Manual Test

```bash
docker exec iayos-backend-dev sh -c "cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments"
# Expected: "Starting payment release job at..." then either releases payments or "No payments ready for release."
```

### 4. Check Cron Log

```bash
docker exec iayos-backend-dev cat /var/log/cron.log
# Shows output from hourly runs
```

## Payment Buffer Flow

```
1. Job Completed + Client Approved
   └── add_pending_earnings() called
       ├── Worker.pendingEarnings += amount
       ├── Transaction created (type=PENDING_EARNING)
       └── release_date = now + 7 days

2. Hourly Cron Runs release_pending_payments
   └── Checks for transactions where release_date <= now
       └── If found:
           ├── Worker.balance += amount
           ├── Worker.pendingEarnings -= amount
           ├── Transaction created (type=EARNING)
           └── Notification sent (type=PAYMENT_RELEASED)

3. Backjob During Buffer (Optional)
   └── If client requests backjob within 7 days:
       ├── Payment frozen during review
       ├── If backjob rejected: 24h cooldown added to release_date
       └── If backjob approved: Payment refunded to client
```

## Security Considerations

1. **Privilege Separation**: Cron runs as root (required), Django runs as appuser via su-exec
2. **Log Rotation**: Consider adding logrotate for `/var/log/cron.log` in production
3. **Monitoring**: Add alerts for failed cron jobs in production

## Troubleshooting

### Cron Not Running

```bash
# Check if container is running
docker ps | grep iayos-backend-dev

# Check container logs for cron startup
docker logs iayos-backend-dev | head -10
# Should show: "🕐 Starting cron daemon..." and "✅ Cron is running..."

# Restart container if needed
docker-compose -f docker-compose.dev.yml restart backend
```

### Command Fails Inside Cron

```bash
# Check cron log for errors
docker exec iayos-backend-dev cat /var/log/cron.log

# Common issues:
# - Missing DJANGO_SETTINGS_MODULE: Add to crontab
# - Database connection: Check postgres is healthy
# - Python path: Use full path /usr/local/bin/python
```

### Payments Not Releasing

```bash
# Check if there are pending payments ready for release
docker exec iayos-backend-dev sh -c "cd /app/apps/backend/src && python manage.py shell -c \"
from jobs.models import Transaction
from django.utils import timezone
pending = Transaction.objects.filter(transactionType='PENDING_EARNING', release_date__lte=timezone.now())
print(f'Ready for release: {pending.count()}')
for t in pending: print(f'  - {t.id}: {t.amount} for worker {t.walletFK.profileFK.profileID}')
\""
```

## Production Considerations

For production deployment:

1. **Use Kubernetes CronJob**: Instead of in-container cron, use K8s CronJob resource
2. **Add Monitoring**: Alert on failed runs, track release counts
3. **Log Aggregation**: Send cron logs to centralized logging (ELK/CloudWatch)
4. **Idempotency**: Command is already idempotent (safe to run multiple times)

## Related Files

- `apps/backend/src/jobs/management/commands/release_pending_payments.py` - The management command
- `apps/backend/src/jobs/payment_services.py` - `add_pending_earnings()`, `release_pending_payment()`
- `Dockerfile` - Container with cron setup
- `docker-compose.dev.yml` - Container orchestration with cron startup

## Summary

✅ **Cron daemon installed** (dcron on Alpine Linux)  
✅ **Crontab configured** (hourly at :00)  
✅ **Privilege separation** (cron as root, Django as appuser)  
✅ **Logging enabled** (/var/log/cron.log)  
✅ **Manual testing passed**  
✅ **Container restarted and running**

The payment buffer system is now fully automated. Payments will be released automatically every hour once their 7-day buffer period expires.
