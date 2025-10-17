#!/bin/bash

# Database backup script
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create backup
docker-compose exec -T postgres pg_dump -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up"
