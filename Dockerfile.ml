# ML Service Dockerfile
# Uses Debian slim for TensorFlow compatibility (requires glibc)
# This is a separate microservice for ML predictions

FROM python:3.12-slim AS ml-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================
# ML Development Stage
# ============================================
FROM ml-base AS ml-development

# Copy requirements files
COPY apps/backend/requirements.txt ./requirements.txt
COPY apps/backend/requirements-ml.txt ./requirements-ml.txt

# Install base requirements + ML dependencies
RUN pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt \
    && pip install -r requirements-ml.txt

# Copy backend source (for Django models and ML module)
COPY apps/backend/src ./src

# Set Python path
ENV PYTHONPATH=/app/src

# Expose port for ML API
EXPOSE 8002

# Run the ML service
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8002"]

# ============================================
# ML Production Stage
# ============================================
FROM ml-base AS ml-production

# Create non-root user
RUN groupadd -g 1001 appgroup \
    && useradd -r -u 1001 -g appgroup appuser

# Copy requirements files
COPY apps/backend/requirements.txt ./requirements.txt
COPY apps/backend/requirements-ml.txt ./requirements-ml.txt

# Install dependencies
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r requirements-ml.txt \
    && rm -rf /root/.cache/pip

# Copy backend source
COPY apps/backend/src ./src

# Set Python path
ENV PYTHONPATH=/app/src

# Create directory for saved models with correct permissions
RUN mkdir -p /app/src/ml/saved_models \
    && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 8002

# Run with gunicorn in production
CMD ["gunicorn", "--chdir", "src", "--bind", "0.0.0.0:8002", "--workers", "2", "--threads", "4", "iayos_project.wsgi:application"]
