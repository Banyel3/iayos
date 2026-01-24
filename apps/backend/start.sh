#!/bin/sh
set -e

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
echo "Starting Daphne ASGI server..."
echo "=========================================="
exec daphne -b 0.0.0.0 -p 8000 iayos_project.asgi:application
