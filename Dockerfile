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
# Stage 4: Flutter Base Image
# ============================================
FROM debian:bookworm-slim AS flutter-base

# Install Flutter dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter SDK
ENV FLUTTER_VERSION=3.24.5
ENV FLUTTER_HOME=/opt/flutter
ENV PATH="$FLUTTER_HOME/bin:$PATH"

RUN git clone https://github.com/flutter/flutter.git -b stable --depth 1 $FLUTTER_HOME \
    && flutter precache --android \
    && flutter config --no-analytics \
    && flutter doctor -v

WORKDIR /app

# ============================================
# Stage 5: Flutter Mobile Build (Android APK)
# ============================================
FROM flutter-base AS mobile-builder

# Copy Flutter mobile app source
COPY apps/frontend_mobile/iayos_mobile ./apps/frontend_mobile/iayos_mobile

WORKDIR /app/apps/frontend_mobile/iayos_mobile

# Get Flutter dependencies
RUN flutter pub get

# Build Android APK (release mode)
RUN flutter build apk --release --split-per-abi

# ============================================
# Stage 6: Flutter Mobile Production
# ============================================
FROM scratch AS mobile-production

# Copy built APKs to a scratch image for extraction
COPY --from=mobile-builder /app/apps/frontend_mobile/iayos_mobile/build/app/outputs/flutter-apk/*.apk /

# Note: This stage outputs APK files that can be extracted with:
# docker build --target mobile-production --output type=local,dest=./output .

# ============================================
# Stage 7: Python Backend Base (Secure Alpine)
# ============================================
FROM python:3.12-alpine AS backend-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/.local/bin:$PATH"

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

# Install Python dependencies with security checks
# CACHE BUST: 2026-01-27 - Force rebuild for DeepFace/pytesseract fix
RUN mkdir -p /app/.local \
    && python -m pip install --upgrade 'pip>=25.3' setuptools wheel packaging \
    && pip install --no-cache-dir --prefix=/app/.local -r requirements.txt \
    && echo '✅ Verifying critical packages...' \
    && PYTHONPATH=/app/.local/lib/python3.12/site-packages python -c "import packaging; print('✅ packaging installed')" \
    && PYTHONPATH=/app/.local/lib/python3.12/site-packages python -c "import pytesseract; print('✅ pytesseract installed')" \
    && find /app/.local -name "*.pyc" -delete 2>/dev/null || true \
    && find /app/.local -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

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
# Stage 13: Backend Development (Debian-based for DeepFace/TensorFlow)
# ============================================
# Note: Using Debian-slim instead of Alpine because DeepFace requires TensorFlow
# which needs glibc (not available on Alpine's musl libc)
FROM python:3.12-slim AS backend-development

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create non-root user
RUN groupadd -g 1001 appgroup \
    && useradd -r -u 1001 -g appgroup -d /app -s /sbin/nologin appuser

# Install development dependencies
# - tesseract-ocr for KYC document verification
# - libgl1 for OpenCV (required by DeepFace)
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
    # OpenCV/DeepFace dependencies
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/backend

# Install Python dependencies
COPY apps/backend/requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# CRITICAL FIX: Patch Django Ninja UUID converter conflict with Django 5.x
COPY apps/backend/patch_ninja.sh ./
RUN sed -i 's/\r$//' patch_ninja.sh && chmod +x patch_ninja.sh && ./patch_ninja.sh && rm patch_ninja.sh

# Copy backend source (mounted in dev)
COPY --chown=appuser:appgroup apps/backend .

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
# Stage 14: Backend Production (Debian-based for DeepFace/TensorFlow)
# ============================================
# This MUST be the last stage for Render to build it by default
# Using Debian-slim instead of Alpine because DeepFace requires TensorFlow
# which needs glibc (not available on Alpine's musl libc)
FROM python:3.12-slim AS backend-production

# Set secure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/.local/bin:$PATH" \
    PYTHONPATH="/app/.local/lib/python3.12/site-packages:$PYTHONPATH"

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 appgroup \
    && useradd -r -u 1001 -g appgroup -d /app -s /sbin/nologin appuser

# Install only runtime dependencies (Debian syntax)
# - tesseract-ocr for KYC document verification
# - libgl1 for OpenCV (required by DeepFace)
# - libleptonica-dev for pytesseract bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq5 \
    libffi8 \
    libssl3 \
    tesseract-ocr \
    tesseract-ocr-eng \
    libleptonica-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy Python dependencies from deps stage
COPY --from=backend-deps --chown=appuser:appgroup /app/.local /app/.local

# Copy application code with proper ownership (includes start.sh)
COPY --from=backend-builder --chown=appuser:appgroup /app/backend ./

# Make start.sh executable (it's already copied from backend-builder)
RUN chmod +x /app/backend/start.sh

# Switch to non-root user
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/', timeout=10)" || exit 1

# Expose port for Django
EXPOSE 8000

# Use the start script that runs migrations then starts Daphne
ENTRYPOINT ["/app/backend/start.sh"]