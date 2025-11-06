# syntax=docker/dockerfile:1.7-labs
# ============================================
# Stage 1: Base Node.js Image (Debian-based)
# ============================================
FROM node:20-slim AS base

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

# Install dependencies
RUN npm ci --legacy-peer-deps \
    && npm i lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --no-save || true

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
# Stage 4: Python Backend Base
# ============================================
FROM python:3.13.9-slim AS backend-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Keep base minimal for faster dev builds (no heavy apt installs)

WORKDIR /app/backend

# ============================================
# Stage 5: Backend Dependencies
# ============================================
FROM backend-base AS backend-deps

# Copy requirements file
COPY apps/backend/requirements.txt .

# Install Python dependencies (use BuildKit cache for speed on rebuilds)
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade 'pip>=25.3' && \
    pip install --break-system-packages -r requirements.txt

# ============================================
# Stage 6: Backend Builder
# ============================================
FROM backend-deps AS backend-builder

# Copy backend source
COPY apps/backend .

# ============================================
# Stage 7: Frontend Production
# ============================================
FROM node:20-alpine AS frontend-production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built application from frontend-builder
COPY --from=frontend-builder /app/apps/frontend_web/.next ./apps/frontend_web/.next
COPY --from=frontend-builder /app/apps/frontend_web/public ./apps/frontend_web/public
COPY --from=frontend-builder /app/apps/frontend_web/package.json ./apps/frontend_web/package.json
COPY --from=deps /app/node_modules ./node_modules

WORKDIR /app/apps/frontend_web

# Expose port for Next.js
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]

# ============================================
# Stage 8: Backend Production
# ============================================
FROM backend-base AS backend-production

WORKDIR /app/backend

# Install runtime tools only for production if needed
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY --from=backend-builder /app/backend ./

# Expose port for Django
EXPOSE 8000

# Start Django with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "core.wsgi:application"]

# ============================================
# Stage 9: Frontend Development (Node only)
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
# Stage 10: Backend Development (Python only)
# ============================================
FROM backend-base AS backend-development

WORKDIR /app/apps/backend

# Ensure pip is up-to-date and use cache mount for faster rebuilds
COPY apps/backend/requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --break-system-packages -r requirements.txt

# Copy backend source (mounted in dev)
COPY apps/backend .

EXPOSE 8000

# Default dev command (compose overrides)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]