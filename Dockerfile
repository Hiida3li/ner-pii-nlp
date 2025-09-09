# Multi-stage build for security and smaller image size
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code (respects .dockerignore)
COPY --chown=appuser:appuser . .

# Create necessary directories with correct permissions - ADD CACHE!
RUN mkdir -p /app/logs /app/uploads /app/temp /app/cache && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

# ADD THESE ENVIRONMENT VARIABLES
ENV PYTHONPATH=/app
ENV TRANSFORMERS_CACHE=/app/cache
ENV HF_HOME=/app/cache
ENV HOME=/app

# Security: Don't run as root
USER appuser

# Health check - FIXED: Changed to port 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Expose port - FIXED: Changed to 8000
EXPOSE 8000

# Use exec form to properly handle signals - FIXED: Changed to port 8000
ENTRYPOINT ["python"]
CMD ["-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]