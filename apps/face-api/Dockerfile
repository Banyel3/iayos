# InsightFace Microservice Dockerfile
# Multi-stage build to minimize final image size

# =====================
# Stage 1: Build stage
# =====================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies + OpenCV runtime dependencies
# cv2 requires libxcb, libgl, etc. even for headless mode
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libxcb-shm0 \
    libxcb-render0 \
    libxrender1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download InsightFace model during build (faster startup)
# This downloads the buffalo_s model to ~/.insightface/models/
RUN python -c "from insightface.app import FaceAnalysis; \
    app = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider']); \
    app.prepare(ctx_id=-1, det_size=(320, 320)); \
    print('Model downloaded successfully')"

# =====================
# Stage 2: Runtime stage
# =====================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only (no build tools)
# Same libs as builder stage for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libxcb-shm0 \
    libxcb-render0 \
    libxrender1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy pre-downloaded InsightFace models
COPY --from=builder /root/.insightface /root/.insightface

# Copy application code
COPY main.py .

# Environment variables
ENV PORT=8000
ENV INSIGHTFACE_MODEL=buffalo_s
ENV INSIGHTFACE_DET_SIZE=320
ENV SIMILARITY_THRESHOLD=0.4

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
