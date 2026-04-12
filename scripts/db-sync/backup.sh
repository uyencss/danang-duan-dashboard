#!/usr/bin/env bash

# Perform typical pg_dump
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/app/backups"
mkdir -p "$BACKUP_DIR"

echo "Backing up mobi_prod..."
pg_dump -d "$DATABASE_URL" -Fc -f "$BACKUP_DIR/mobi_prod_$TIMESTAMP.dump"
echo "Backup complete: $BACKUP_DIR/mobi_prod_$TIMESTAMP.dump"
