#!/bin/sh
set -e

echo "=========================================="
echo "🚀 START.SH SCRIPT IS RUNNING!"
echo "Date: $(date)"
echo "=========================================="

# ==========================================
# Start embedded Redis if no external REDIS_URL is configured
# ==========================================
if [ -z "$REDIS_URL" ] || [ "$REDIS_URL" = "none" ] || [ "$REDIS_URL" = "redis://localhost:6379/0" ] || [ "$REDIS_URL" = "redis://127.0.0.1:6379/0" ]; then
    echo "🔴 Starting embedded Redis server..."
    # Start Redis in background with production settings
    redis-server --daemonize yes \
        --port 6379 \
        --bind 127.0.0.1 \
        --maxmemory 64mb \
        --maxmemory-policy allkeys-lru \
        --appendonly yes \
        --dir /data/redis \
        --loglevel warning \
        --protected-mode yes
    
    # Wait for Redis to be ready
    for i in 1 2 3 4 5; do
        if redis-cli ping 2>/dev/null | grep -q PONG; then
            echo "✅ Embedded Redis is ready"
            break
        fi
        echo "⏳ Waiting for Redis... (attempt $i/5)"
        sleep 1
    done
    
    # Set REDIS_URL to local if not already set
    export REDIS_URL="redis://localhost:6379/0"
    echo "📌 REDIS_URL set to $REDIS_URL"
else
    echo "🔗 Using external Redis: ${REDIS_URL%%@*}@***"
fi

# DIAGNOSTIC: Show Python environment details
echo "=========================================="
echo "📊 Python Environment Diagnostics"
echo "=========================================="
echo "Python version: $(python --version)"
echo "Python path: $(which python)"
echo "PYTHONPATH: $PYTHONPATH"
echo "PATH: $PATH"
echo ""
echo "Site-packages locations:"
python -c "import site; print('\n'.join(site.getsitepackages()))" 2>&1 || echo "ERROR: Could not get site-packages"
echo ""
echo "Checking critical packages:"
echo "- Django: $(python -c 'import django; print(django.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Pytesseract: $(python -c 'import pytesseract; print(pytesseract.get_tesseract_version())' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Pillow: $(python -c 'from PIL import Image; print(Image.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Psycopg2: $(python -c 'import psycopg2; print(psycopg2.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo ""
echo "=========================================="

cd /app/backend/src

echo "=========================================="
echo "Testing database connection..."
echo "=========================================="
echo "About to run Django setup and database test..."
# Test database connection before migrations
python -c "
import sys
print('Python interpreter starting...')
sys.stdout.flush()

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
print('Importing Django...')
sys.stdout.flush()

import django
print('Running django.setup()...')
sys.stdout.flush()

django.setup()
print('Django setup complete!')
sys.stdout.flush()

from django.db import connection
print('Testing database connection...')
sys.stdout.flush()

try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection FAILED: {e}')
    sys.exit(1)
" 2>&1

echo "Database test passed!"

echo "=========================================="
echo "Running database migrations..."
echo "=========================================="

# If DATABASE_TEST_URL is set, run migrations on test database first
if [ -n "$DATABASE_TEST_URL" ]; then
    echo "🧪 DATABASE_TEST_URL detected - migrating TEST database first..."
    
    # Temporarily override to force test database
    export TEMP_DATABASE_URL="$DATABASE_URL"
    export DATABASE_URL="$DATABASE_TEST_URL"
    
    echo "Running migrations on TEST database..."
    if ! python manage.py migrate --noinput 2>&1; then
        echo "❌ TEST DATABASE MIGRATION FAILED! Checking migration status..."
        python manage.py showmigrations 2>&1 || true
        echo "Trying to show the actual error..."
        python manage.py migrate --noinput --verbosity=3 2>&1 || true
        # Restore DATABASE_URL before exiting
        export DATABASE_URL="$TEMP_DATABASE_URL"
        exit 1
    fi
    echo "✅ Test database migrations completed successfully"
    
    # Restore original DATABASE_URL for production database
    export DATABASE_URL="$TEMP_DATABASE_URL"
    unset TEMP_DATABASE_URL
fi

# Run migrations on production database (or local if USE_LOCAL_DB=true)
if [ -n "$DATABASE_TEST_URL" ]; then
    echo "🌐 Now migrating PRODUCTION database..."
else
    echo "Running migrations on configured database..."
fi

if ! python manage.py migrate --noinput 2>&1; then
    echo "❌ MIGRATION FAILED! Checking migration status..."
    python manage.py showmigrations 2>&1 || true
    echo "Trying to show the actual error..."
    python manage.py migrate --noinput --verbosity=3 2>&1 || true
    exit 1
fi
echo "✅ Migrations completed successfully"

echo "=========================================="
echo "Running post-start setup in background..."
echo "=========================================="
(
    echo "=========================================="
    echo "Creating admin user from environment..."
    echo "=========================================="
    python manage.py create_admin || echo "Admin creation skipped (may already exist or missing env vars)"

    echo "=========================================="
    echo "Creating test users from environment..."
    echo "=========================================="
    python manage.py create_test_users || echo "Test users creation skipped (may already exist or missing env vars)"

    echo "=========================================="
    echo "Seeding initial data (specializations, locations)..."
    echo "=========================================="
    python manage.py seed_data || echo "Seed data skipped (may already exist)"

    echo "=========================================="
    echo "Clearing rate limit caches..."
    echo "=========================================="
    python manage.py clear_rate_limits --all || echo "Rate limit clearing skipped (cache may be empty)"

    echo "✅ Background post-start setup completed"
) &

echo "=========================================="
echo "Starting Daphne ASGI server..."
echo "=========================================="
exec daphne -b 0.0.0.0 -p 8000 --http-timeout 300 iayos_project.asgi:application
