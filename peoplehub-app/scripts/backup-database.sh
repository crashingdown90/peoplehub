#!/bin/bash
# =============================================================================
# PeopleHub Database Backup Script
# =============================================================================
#
# Usage: ./scripts/backup-database.sh
#
# Features:
#   - Full PostgreSQL backup with pg_dump
#   - Compression with gzip
#   - Optional encryption with GPG
#   - Optional upload to S3
#   - Retention policy cleanup
#
# Cron example (daily at 2 AM):
#   0 2 * * * /var/www/peoplehub/scripts/backup-database.sh >> /var/log/peoplehub/backup.log 2>&1
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
BACKUP_DIR="/var/backups/peoplehub/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
ENCRYPT_BACKUP=${ENCRYPT_BACKUP:-false}
UPLOAD_TO_S3=${UPLOAD_TO_S3:-false}

# Load environment variables
if [ -f "/var/www/peoplehub/.env" ]; then
    export $(grep -v '^#' /var/www/peoplehub/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} [BACKUP] $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] WARNING:${NC} $1"
}

# -----------------------------------------------------------------------------
# Pre-checks
# -----------------------------------------------------------------------------
pre_checks() {
    log "Running pre-checks..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL is not set!"
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is not installed!"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Check disk space (minimum 500MB)
    available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 512000 ]; then
        warn "Low disk space: ${available_space}KB available"
    fi
    
    log "Pre-checks passed"
}

# -----------------------------------------------------------------------------
# Create Backup
# -----------------------------------------------------------------------------
create_backup() {
    local backup_file="$BACKUP_DIR/db_${TIMESTAMP}.sql"
    
    log "Starting database backup..."
    log "  - Timestamp: $TIMESTAMP"
    log "  - Destination: $backup_file"
    
    # Create dump
    pg_dump "$DATABASE_URL" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        > "$backup_file" 2>> /var/log/peoplehub/backup.log
    
    # Check if backup was created
    if [ ! -f "$backup_file" ]; then
        error "Backup file was not created!"
        exit 1
    fi
    
    # Get backup size
    local size=$(du -h "$backup_file" | cut -f1)
    log "  - Backup size: $size"
    
    # Compress backup
    log "  - Compressing backup..."
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local compressed_size=$(du -h "$backup_file" | cut -f1)
    log "  - Compressed size: $compressed_size"
    
    # Optional: Encrypt backup
    if [ "$ENCRYPT_BACKUP" = true ] && [ -f "/secrets/backup-key" ]; then
        log "  - Encrypting backup..."
        gpg --symmetric --cipher-algo AES256 \
            --passphrase-file /secrets/backup-key \
            --batch --yes \
            "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi
    
    echo "$backup_file"
}

# -----------------------------------------------------------------------------
# Upload to S3
# -----------------------------------------------------------------------------
upload_to_s3() {
    local backup_file="$1"
    
    if [ "$UPLOAD_TO_S3" != true ]; then
        return 0
    fi
    
    if [ -z "$S3_BUCKET" ]; then
        warn "S3_BUCKET not set, skipping upload"
        return 0
    fi
    
    log "Uploading to S3..."
    
    aws s3 cp "$backup_file" \
        "s3://${S3_BUCKET}/database/$(basename "$backup_file")" \
        --storage-class STANDARD_IA
    
    log "Upload completed: s3://${S3_BUCKET}/database/$(basename "$backup_file")"
}

# -----------------------------------------------------------------------------
# Cleanup Old Backups
# -----------------------------------------------------------------------------
cleanup_old_backups() {
    log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
    
    # Remove local backups older than retention period
    local deleted_count=$(find "$BACKUP_DIR" -name "db_*.sql.gz*" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    if [ "$deleted_count" -gt 0 ]; then
        log "  - Deleted $deleted_count old backup(s)"
    else
        log "  - No old backups to delete"
    fi
}

# -----------------------------------------------------------------------------
# Verify Backup
# -----------------------------------------------------------------------------
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup..."
    
    # Check file exists and has content
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    if [ "$size" -lt 1000 ]; then
        error "Backup file too small: $size bytes"
        return 1
    fi
    
    # Test decompression
    if [[ "$backup_file" == *.gz ]]; then
        if ! gunzip -t "$backup_file" 2>/dev/null; then
            error "Backup file is corrupted!"
            return 1
        fi
    fi
    
    log "Backup verification passed"
    return 0
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    log "========================================"
    log "  PeopleHub Database Backup"
    log "========================================"
    
    local start_time=$(date +%s)
    
    pre_checks
    
    backup_file=$(create_backup)
    
    if verify_backup "$backup_file"; then
        upload_to_s3 "$backup_file"
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log "========================================"
        log "  Backup completed successfully!"
        log "  File: $backup_file"
        log "  Duration: ${duration}s"
        log "========================================"
    else
        error "Backup verification failed!"
        exit 1
    fi
}

main "$@"
