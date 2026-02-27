#!/bin/bash

# ============================================
# DATABASE BACKUP SCRIPT
# ============================================

set -e

source .env 2>/dev/null

BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/studybuddy_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating database backup..."
echo "   Database: ${DB_NAME}"
echo "   File: ${BACKUP_FILE}"

# Backup using docker exec
docker exec studybuddy-mysql mysqldump \
    -u root \
    -p"${DB_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --databases "${DB_NAME}" \
    2>/dev/null | gzip > "$BACKUP_FILE"

# Get file size
SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: ${BACKUP_FILE} (${SIZE})"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
ls -t ${BACKUP_DIR}/studybuddy_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "✅ Cleanup complete"