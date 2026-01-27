#!/bin/sh
set -e

echo "=========================================="
echo "🚀 START.SH SCRIPT IS RUNNING!"
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
