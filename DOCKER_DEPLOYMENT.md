# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- OpenAI API key

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd ner-pii-nlp-5

# Copy environment variables
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
```

### 2. Build and Run

```bash
# Build and start the application
docker-compose up --build -d

# Check logs
docker-compose logs -f ner-pii-app

# Verify health
curl http://localhost:8000/health
```

### 3. Access the Application

Open your browser and navigate to:
- Application: http://localhost:8000
- Privacy Chat: http://localhost:8000/privacy-chat

## Production Deployment

### Using Docker Compose

```bash
# For production with Nginx (requires nginx.conf)
docker-compose --profile production up -d

# Or build with specific resource limits
docker-compose up -d --scale ner-pii-app=1
```

### Using Docker Run

```bash
# Build the image
docker build -t ner-pii-nlp:latest .

# Run with environment variables
docker run -d \
  --name ner-pii-app \
  -p 8000:8000 \
  -e OPENAI_API_KEY="your_api_key_here" \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/checkpoints:/app/checkpoints:ro \
  --memory="4g" \
  --memory-reservation="2g" \
  --restart unless-stopped \
  ner-pii-nlp:latest
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| OPENAI_API_KEY | OpenAI API key for GPT-4 | - | Yes |
| APP_PORT | Application port | 8000 | No |
| LOG_LEVEL | Logging level (DEBUG/INFO/WARNING/ERROR) | INFO | No |
| MAX_UPLOAD_SIZE | Maximum file upload size in bytes | 10485760 | No |

### Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| ./logs | /app/logs | Application logs |
| ./uploads | /app/uploads | Uploaded documents |
| ./checkpoints | /app/checkpoints | Model checkpoint files (read-only) |
| model-cache | /app/cache | Model cache (named volume) |

## Maintenance

### View Logs

```bash
# Real-time logs
docker-compose logs -f ner-pii-app

# Last 100 lines
docker-compose logs --tail=100 ner-pii-app
```

### Update Application

```bash
# Stop the application
docker-compose down

# Pull latest changes
git pull

# Rebuild and start
docker-compose up --build -d
```

### Backup Data

```bash
# Backup uploads and logs
tar -czf backup-$(date +%Y%m%d).tar.gz logs/ uploads/

# Backup Docker volumes
docker run --rm \
  -v $(pwd):/backup \
  -v model-cache:/data \
  alpine tar czf /backup/model-cache-backup.tar.gz -C /data .
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove unused images
docker image prune -a

# Full cleanup
docker system prune -a --volumes
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs ner-pii-app`
2. Verify API key is set: `echo $OPENAI_API_KEY`
3. Ensure model checkpoint exists: `ls checkpoints/`
4. Check port availability: `lsof -i :8000`

### Out of Memory

1. Increase Docker memory limit in Docker Desktop settings
2. Reduce worker count in Dockerfile CMD
3. Use swap if available

### Model Not Loading

1. Ensure checkpoint file exists: `checkpoints/pii_shield_002v.pt`
2. Check file permissions: `ls -la checkpoints/`
3. Verify cache directory: `docker exec ner-pii-app ls -la /app/cache`

### Slow Performance

1. Ensure model cache is persisted (check volumes)
2. Allocate more memory: Update docker-compose.yml limits
3. Use SSD for volume mounts

## Security Considerations

1. **Never commit .env file** - Keep API keys secure
2. **Use secrets management** in production (Docker Secrets, Vault)
3. **Enable HTTPS** with proper SSL certificates
4. **Restrict network access** using firewall rules
5. **Regular updates** - Keep base images and dependencies updated
6. **Non-root user** - Application runs as non-root user (appuser)

## Monitoring

### Health Check

```bash
# Manual health check
curl http://localhost:8000/health

# Docker health status
docker inspect ner-pii-app --format='{{.State.Health.Status}}'
```

### Resource Usage

```bash
# Container stats
docker stats ner-pii-app

# Detailed inspection
docker inspect ner-pii-app
```

## Support

For issues or questions:
1. Check application logs: `docker-compose logs`
2. Verify environment setup: `docker-compose config`
3. Review this documentation
4. Open an issue on GitHub