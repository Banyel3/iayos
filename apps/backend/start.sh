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
echo "- DeepFace: $(python -c 'import deepface; print(deepface.__version__)' 2>&1 || echo 'NOT FOUND - will use fallback ⚠️')"
echo "- Pytesseract: $(python -c 'import pytesseract; print(pytesseract.get_tesseract_version())' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Pillow: $(python -c 'from PIL import Image; print(Image.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo "- Psycopg2: $(python -c 'import psycopg2; print(psycopg2.__version__)' 2>&1 || echo 'NOT FOUND ❌')"
echo ""
echo "DEEPFACE_HOME: ${DEEPFACE_HOME:-not set}"
echo "=========================================="

cd /app/backend/src

echo "=========================================="
echo "Running database migrations..."
echo "=========================================="
python manage.py migrate --noinput

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
