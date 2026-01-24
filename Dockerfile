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
# Stage 8: Backend Dependencies (Secure)
# ============================================
FROM backend-base AS backend-deps

# Install build dependencies and cleanup
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    postgresql-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    rust \
    && apk add --no-cache \
    postgresql-client \
    libpq \
    && rm -rf /var/cache/apk/*

# Copy requirements file
COPY apps/backend/requirements.txt .

# Install Python dependencies with security checks
RUN --mount=type=cache,target=/root/.cache/pip \
    mkdir -p /app/.local \
    && python -m pip install --upgrade 'pip>=25.3' setuptools wheel \
    && pip install --no-cache-dir --user -r requirements.txt \
    && apk del .build-deps \
    && find /app/.local -name "*.pyc" -delete 2>/dev/null || true \
    && find /app/.local -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# ============================================
# Stage 9: Backend Builder
# ============================================
FROM backend-deps AS backend-builder

# Copy backend source
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
# Stage 11: Backend Production (Secure)
# ============================================
FROM python:3.12-alpine AS backend-production

# Set secure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/.local/bin:$PATH"

# Create non-root user
RUN addgroup -g 1001 -S appgroup \
    && adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appgroup appuser

# Install only runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    libpq \
    libffi \
    openssl \
    && rm -rf /var/cache/apk/*

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

# ============================================
# Stage 12: Frontend Development (Node only)
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
# Stage 13: Backend Development (Secure)
# ============================================
FROM backend-base AS backend-development

# Install development dependencies with cleanup
# Added: tesseract-ocr for OCR verification of KYC documents
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    postgresql-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    rust \
    && apk add --no-cache \
    postgresql-client \
    libpq \
    dcron \
    su-exec \
    # Tesseract OCR for KYC document verification
    tesseract-ocr \
    tesseract-ocr-data-eng \
    # Additional image processing dependencies
    jpeg-dev \
    zlib-dev \
    libpng-dev \
    # curl for CompreFace health checks
    curl

WORKDIR /app/apps/backend

# Install Python dependencies with security
COPY apps/backend/requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps

# CRITICAL FIX: Patch Django Ninja UUID converter conflict with Django 5.x
COPY apps/backend/patch_ninja.sh ./
RUN sed -i 's/\r$//' patch_ninja.sh && chmod +x patch_ninja.sh && ./patch_ninja.sh && rm patch_ninja.sh

# Copy backend source (mounted in dev)
COPY --chown=appuser:appgroup apps/backend .

# Give appuser ownership of working directory
RUN chown -R appuser:appgroup /app

# Setup cron job for payment buffer release (runs every hour)
# Note: cron runs as root, but executes Django command which accesses app files
RUN echo "0 * * * * cd /app/apps/backend/src && /usr/local/bin/python manage.py release_pending_payments >> /var/log/cron.log 2>&1" > /etc/crontabs/root \
    && touch /var/log/cron.log \
    && chmod 0644 /var/log/cron.log

# Note: We don't switch to non-root user here because cron needs root
# The docker-compose command uses su-exec to run Django as appuser

EXPOSE 8000

# Default dev command (compose overrides)
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]