#!/bin/bash

# ============================================
# DATABASE RESTORE SCRIPT
# ============================================

set -e

source .env 2>/dev/null

BACKUP_DIR="./data/backups"

if [ -z "$1" ]; then
    echo "Available backups:"
    echo "==================="
    ls -lt ${BACKUP_DIR}/studybuddy_backup_*.sql.gz 2>/dev/null | awk '{print NR".", $NF, $5, $6, $7, $8}'
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ${BACKUP_DIR}/studybuddy_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "📦 Restoring database from: $BACKUP_FILE"

gunzip < "$BACKUP_FILE" | docker exec -i studybuddy-mysql mysql \
    -u root \
    -p"${DB_ROOT_PASSWORD}" \
    2>/dev/null

echo "✅ Database restored successfully!"