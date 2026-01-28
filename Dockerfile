# syntax=docker/dockerfile:1
# ============================================
# Stage 1: Base Node.js Image (Debian-based)
# ============================================
FROM node:22-slim AS base

# Install dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manager files
COPY package.json package-lock.json* ./
COPY turbo.json ./

# ============================================
# Stage 2: Dependencies Installation
# ============================================
FROM base AS deps

# Copy frontend package files
COPY apps/frontend_web/package.json apps/frontend_web/package-lock.json* ./apps/frontend_web/

# Install root dependencies first
RUN npm install --legacy-peer-deps

# Install frontend dependencies
WORKDIR /app/apps/frontend_web
RUN npm install --legacy-peer-deps \
    && npm i lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --no-save || true

# Reset workdir
WORKDIR /app

# ============================================
# Stage 3: Build Frontend
# ============================================
FROM base AS frontend-builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source
COPY apps/frontend_web ./apps/frontend_web
COPY packages ./packages

# Build the Next.js application
WORKDIR /app/apps/frontend_web
RUN npm run build

# ============================================
# Stage 4-6: Flutter Disabled
# ============================================
# Flutter mobile build is disabled to speed up Render deploys.
# Mobile APKs are built separately via GitHub Actions CI/CD.
# To enable Flutter build, uncomment the stages below.
#
# FROM debian:bookworm-slim AS flutter-base
# RUN apt-get update && apt-get install -y curl git unzip xz-utils zip libglu1-mesa && rm -rf /var/lib/apt/lists/*
# ENV FLUTTER_VERSION=3.24.5
# ENV FLUTTER_HOME=/opt/flutter
# ENV PATH="$FLUTTER_HOME/bin:$PATH"
# RUN git clone https://github.com/flutter/flutter.git -b stable --depth 1 $FLUTTER_HOME \
#     && flutter precache --android && flutter config --no-analytics && flutter doctor -v
#
# FROM flutter-base AS mobile-builder
# COPY apps/frontend_mobile/iayos_mobile ./apps/frontend_mobile/iayos_mobile
# WORKDIR /app/apps/frontend_mobile/iayos_mobile
# RUN flutter pub get && flutter build apk --release --split-per-abi
#
# FROM scratch AS mobile-production
# COPY --from=mobile-builder /app/apps/frontend_mobile/iayos_mobile/build/app/outputs/flutter-apk/*.apk /


# ============================================
# Stage 7: Python Backend Base (Secure Alpine)
# ============================================
FROM python:3.12-alpine AS backend-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/venv/bin:$PATH"

# Create non-root user early for security
RUN addgroup -g 1001 -S appgroup \
    && adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appgroup appuser

WORKDIR /app/backend

# ============================================
# Stage 8: Backend Dependencies (Debian-based for TensorFlow)
# ============================================
FROM python:3.12-slim AS backend-deps

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    cargo \
    rustc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY apps/backend/requirements.txt .

# Install Python dependencies using virtualenv (reliable isolation)
# FIXED: virtualenv ensures ALL packages install to /app/venv (no system escapes)
RUN python -m venv /app/venv \
    && /app/venv/bin/pip install --upgrade 'pip>=25.3' setuptools wheel \
    && /app/venv/bin/pip install --no-cache-dir -r requirements.txt \
    && /app/venv/bin/pip check \
    && echo '✅ All dependencies installed to virtualenv' \
    && /app/venv/bin/python -c "import packaging; print(f'✅ packaging {packaging.__version__} imports OK in deps stage')" \
    && find /app/venv -name "*.pyc" -delete 2>/dev/null || true \
    && find /app/venv -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# ============================================
# Stage 9: Backend Builder
# ============================================
FROM backend-deps AS backend-builder

WORKDIR /app/backend

# Copy backend source to /app/backend
COPY apps/backend .

# ============================================
# Stage 10: Frontend Production (Secure)
# ============================================
FROM node:22-alpine AS frontend-production

# Create non-root user
RUN addgroup -g 1001 -S nodegroup \
    && adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G nodegroup nodeuser

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only package.json files first
COPY --from=frontend-builder --chown=nodeuser:nodegroup /app/apps/frontend_web/package.json ./apps/frontend_web/package.json
COPY --from=frontend-builder --chown=nodeuser:nodegroup /app/package.json ./package.json

# Install ONLY production dependencies (much smaller)
RUN npm install --production --legacy-peer-deps \
    && cd apps/frontend_web \
    && npm install --production --legacy-peer-deps \
    && npm cache clean --force

# Copy built application from frontend-builder
COPY --from=frontend-builder --chown=nodeuser:nodegroup /app/apps/frontend_web/.next ./apps/frontend_web/.next
COPY --from=frontend-builder --chown=nodeuser:nodegroup /app/apps/frontend_web/public ./apps/frontend_web/public

WORKDIR /app/apps/frontend_web

# Switch to non-root user
USER nodeuser

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose port for Next.js
EXPOSE 3000

# Start Next.js with security headers
CMD ["npm", "start"]

# ============================================
# Stage 11: Frontend Development (Node only)
# ============================================
FROM base AS frontend-development

WORKDIR /app

# Copy package files for the monorepo and frontend
COPY package.json package-lock.json* turbo.json ./
COPY apps/frontend_web/package.json ./apps/frontend_web/
COPY packages ./packages

# Enable Corepack and install node deps (include optionals for native bindings)
RUN corepack enable && \
    npm cache clean --force && \
    rm -rf node_modules && \
    npm install --include=dev --include=optional --verbose && \
    npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --no-save || true

# Copy the rest (volumes will override in dev)
COPY . .

EXPOSE 3000

# Default dev command (compose overrides)
CMD ["sh", "-c", "cd /app/apps/frontend_web && npx next dev"]

# ============================================
# Stage 13: Backend Development (Debian-based)
# ============================================
# Note: Using Debian-slim for consistent Python package availability
FROM python:3.12-slim AS backend-development

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HOME="/app"

# Create non-root user
RUN groupadd -g 1001 appgroup \
    && useradd -r -u 1001 -g appgroup -d /app -s /sbin/nologin appuser

# Install development dependencies
# - tesseract-ocr for KYC document verification
# Note: Removed OpenCV/InsightFace deps (moved to Face API service)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    postgresql-client \
    cron \
    tesseract-ocr \
    tesseract-ocr-eng \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/backend

# Install Python dependencies
COPY apps/backend/requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# CRITICAL FIX: Patch Django Ninja UUID converter conflict with Django 5.x
COPY apps/backend/patch_ninja.sh ./
RUN sed -i 's/\r$//' patch_ninja.sh && chmod +x patch_ninja.sh && ./patch_ninja.sh && rm patch_ninja.sh

# Give appuser ownership of working directory
RUN chown -R appuser:appgroup /app

# Setup cron job for payment buffer release (runs every hour)
RUN echo "0 * * * * cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments >> /var/log/cron.log 2>&1" > /etc/cron.d/payment-release \
    && chmod 0644 /etc/cron.d/payment-release \
    && crontab /etc/cron.d/payment-release \
    && touch /var/log/cron.log \
    && chmod 0644 /var/log/cron.log

EXPOSE 8000

# Default dev command (compose overrides)
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
# ============================================
# Stage 14: Backend Production (Debian-based)
# ============================================
# This MUST be the last stage for Render to build it by default
# Using Debian-slim for consistent Python package availability
FROM python:3.12-slim AS backend-production

# Set secure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/venv/bin:$PATH" \
    HOME="/app"

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 appgroup \
    && useradd -r -u 1001 -g appgroup -d /app -s /sbin/nologin appuser

# Install only runtime dependencies (Debian syntax)
# - tesseract-ocr for KYC document verification
# Note: Removed OpenCV/InsightFace deps (moved to Face API service)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq5 \
    libffi8 \
    libssl3 \
    tesseract-ocr \
    tesseract-ocr-eng \
    libleptonica-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy virtualenv from deps stage (contains all Python dependencies)
COPY --from=backend-deps --chown=appuser:appgroup /app/venv /app/venv

# Copy application code with proper ownership (includes start.sh)
COPY --from=backend-builder --chown=appuser:appgroup /app/backend ./

# Make start.sh executable (it's already copied from backend-builder)
RUN chmod +x /app/backend/start.sh

# CRITICAL: Verify all dependencies are accessible at build time
# Virtualenv PATH ensures python finds all packages automatically
RUN python << 'EOF'
import sys
try:
    # Test all critical dependencies and their transitive deps
    import django
    print(f'✅ django: {django.__version__}')
    
    import psycopg2
    print('✅ psycopg2: OK')
    
    import packaging
    print(f'✅ packaging: {packaging.__version__}')
    
    import pytesseract
    print('✅ pytesseract: OK')
    
    import PIL
    print(f'✅ pillow: {PIL.__version__}')
    
    print('🎉 ALL DEPENDENCIES VERIFIED')
    print('✅ Build verification PASSED')
except ImportError as e:
    print(f'❌ IMPORT FAILED: {e}')
    sys.exit(1)
EOF

# Switch to non-root user
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/', timeout=10)" || exit 1

# Expose port for Django
EXPOSE 8000

# Use the start script that runs migrations then starts Daphne
ENTRYPOINT ["/app/backend/start.sh"]