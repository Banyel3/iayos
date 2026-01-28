#!/bin/sh
set -e

echo "=========================================="
echo "🚀 START.SH SCRIPT IS RUNNING!"
echo "Date: $(date)"
echo "=========================================="

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
# NOTE: InsightFace check is lightweight - just verify package exists, don't load ONNX model (saves 35s + 100MB RAM)
echo "- InsightFace: $(python -c 'import importlib.util; print(\"INSTALLED ✓\" if importlib.util.find_spec(\"insightface\") else \"NOT FOUND\")' 2>&1)"
echo "- ONNX Runtime: $(python -c 'import importlib.util; print(\"INSTALLED ✓\" if importlib.util.find_spec(\"onnxruntime\") else \"NOT FOUND\")' 2>&1)"
echo "- Pytesseract: $(python -c 'import pytesseract; print(pytesseract.get_tesseract_version())' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Pillow: $(python -c 'from PIL import Image; print(Image.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Psycopg2: $(python -c 'import psycopg2; print(psycopg2.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo ""
echo "INSIGHTFACE_MODEL: ${INSIGHTFACE_MODEL:-buffalo_s (default)}"
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
# Run migrations with full error output
if ! python manage.py migrate --noinput 2>&1; then
    echo "❌ MIGRATION FAILED! Checking migration status..."
    python manage.py showmigrations 2>&1 || true
    echo "Trying to show the actual error..."
    python manage.py migrate --noinput --verbosity=3 2>&1 || true
    exit 1
fi
echo "✅ Migrations completed successfully"

echo "=========================================="
echo "Creating admin user from environment..."
echo "=========================================="
python manage.py create_admin || echo "Admin creation skipped (may already exist or missing env vars)"

echo "=========================================="
echo "Creating test users from environment..."
echo "=========================================="
python manage.py create_test_users || echo "Test users creation skipped (may already exist or missing env vars)"

echo "=========================================="
echo "Starting Daphne ASGI server..."
echo "=========================================="
exec daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
