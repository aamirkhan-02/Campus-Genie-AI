#!/bin/bash

# ============================================
# PRODUCTION DEPLOYMENT SCRIPT
# Smart Study Buddy Pro
# ============================================

set -e

echo "🚀 Starting Production Deployment..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="data/logs/deploy_${TIMESTAMP}.log"

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"; }

mkdir -p data/logs

# Pre-deployment checks
log "Running pre-deployment checks..."

if [ ! -f ".env.production" ]; then
    error ".env.production file not found!"
    exit 1
fi

# Copy production env
cp .env.production .env
log "Production environment loaded"

# Backup database before deployment
log "Creating database backup..."
bash scripts/backup-db.sh || warn "Backup failed - continuing anyway"

# Pull latest code (if using git)
if [ -d ".git" ]; then
    log "Pulling latest code from git..."
    git pull origin main 2>> "$DEPLOY_LOG"
fi

# Build images
log "Building Docker images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache 2>> "$DEPLOY_LOG"

# Stop old containers gracefully
log "Stopping current containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 30 2>> "$DEPLOY_LOG"

# Start new containers
log "Starting new containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d 2>> "$DEPLOY_LOG"

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        log "✅ Backend is healthy!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    error "Backend health check failed after ${MAX_RETRIES} retries"
    error "Rolling back..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    exit 1
fi

# Verify frontend
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Frontend is healthy!"
else
    warn "Frontend health check needs attention"
fi

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -f 2>> "$DEPLOY_LOG"

# Display running containers
log "Running containers:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
log "╔══════════════════════════════════════════╗"
log "║  ✅ Deployment Complete!                  ║"
log "║  📝 Log: ${DEPLOY_LOG}                   ║"
log "╚══════════════════════════════════════════╝"