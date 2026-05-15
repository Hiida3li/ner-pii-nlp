# Multi-stage build for security and smaller image size
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the BERT model to avoid runtime downloads
RUN python -c "from transformers import AutoTokenizer, AutoModelForTokenClassification; \
    AutoTokenizer.from_pretrained('CAMeL-Lab/bert-base-arabic-camelbert-msa-ner'); \
    AutoModelForTokenClassification.from_pretrained('CAMeL-Lab/bert-base-arabic-camelbert-msa-ner')"

# Production stage
FROM python:3.11-slim

# Labels for better container management
LABEL maintainer="NER-PII-NLP Team"
LABEL version="1.0"
LABEL description="Arabic PII Detection and Privacy Protection System"

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy pre-downloaded models from builder
COPY --from=builder /root/.cache/huggingface /app/cache/huggingface

# Set working directory
WORKDIR /app

# Copy application code (respects .dockerignore)
COPY --chown=appuser:appuser . .

# Create necessary directories with correct permissions
RUN mkdir -p /app/logs /app/uploads /app/temp /app/cache /app/checkpoints && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app && \
    # Ensure checkpoint file exists and has correct permissions
    if [ -f /app/checkpoints/pii_shield_002v.pt ]; then \
        chmod 644 /app/checkpoints/pii_shield_002v.pt; \
    else \
        echo "Warning: Model checkpoint file not found"; \
    fi

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/app/cache
ENV HF_HOME=/app/cache
ENV HOME=/app
# Placeholder for API key - should be overridden at runtime
ENV OPENAI_API_KEY=""

# Security: Don't run as root
USER appuser

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Add signal handling for graceful shutdown
STOPSIGNAL SIGTERM

# Use exec form to properly handle signals with additional options
ENTRYPOINT ["python", "-m", "uvicorn"]
CMD ["src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--loop", "asyncio", \
     "--no-access-log"]