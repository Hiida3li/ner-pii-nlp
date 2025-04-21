# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files
COPY . .

# Create necessary directories if they don't exist
RUN mkdir -p static templates

# Expose FastAPI port
EXPOSE 8001

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]