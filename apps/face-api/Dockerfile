# InsightFace Microservice Dockerfile
# Optimized for low memory usage (~300-400MB)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for InsightFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download InsightFace model during build (faster startup)
RUN python -c "from insightface.app import FaceAnalysis; \
    app = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider']); \
    app.prepare(ctx_id=-1, det_size=(320, 320)); \
    print('Model downloaded successfully')"

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
