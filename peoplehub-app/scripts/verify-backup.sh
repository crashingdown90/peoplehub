#!/bin/bash
# =============================================================================
# PeopleHub Backup Verification Script
# =============================================================================
#
# Usage: ./scripts/verify-backup.sh [backup_file]
#
# This script verifies backup integrity by:
#   1. Downloading/locating the backup
#   2. Decrypting (if encrypted)
#   3. Restoring to a test database
#   4. Running verification queries
#   5. Cleaning up
#
# Run weekly/monthly to ensure backups are valid
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
BACKUP_DIR="${BACKUP_DIR:-/var/backups/peoplehub/database}"
TEST_DB="peoplehub_verify_$(date +%s)"
BACKUP_FILE="$1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} [VERIFY] $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [VERIFY] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [VERIFY] WARNING:${NC} $1"
}

cleanup() {
    log "Cleaning up..."
    
    # Drop test database
    psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true
    
    # Remove temporary files
    rm -f /tmp/verify_backup.* 2>/dev/null || true
    
    log "Cleanup completed"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# -----------------------------------------------------------------------------
# Main Verification Process
# -----------------------------------------------------------------------------

log "========================================"
log "  PeopleHub Backup Verification"
log "========================================"

# Step 1: Find backup file
if [ -z "$BACKUP_FILE" ]; then
    log "No backup file specified, using latest..."
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/db_*.sql* 2>/dev/null | head -1)
    
    if [ -z "$BACKUP_FILE" ]; then
        error "No backup files found in $BACKUP_DIR"
        exit 1
    fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "Backup file: $BACKUP_FILE"
log "File size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Step 2: Prepare backup for restore
RESTORE_FILE="$BACKUP_FILE"

if [[ "$BACKUP_FILE" == *.gpg ]]; then
    log "Decrypting backup..."
    
    if [ ! -f "/secrets/backup-key" ]; then
        error "Encryption key not found at /secrets/backup-key"
        exit 1
    fi
    
    RESTORE_FILE="/tmp/verify_backup.sql.gz"
    gpg --decrypt --passphrase-file /secrets/backup-key \
        --batch --yes \
        "$BACKUP_FILE" > "$RESTORE_FILE"
fi

if [[ "$RESTORE_FILE" == *.gz ]]; then
    log "Verifying gzip integrity..."
    if ! gunzip -t "$RESTORE_FILE" 2>/dev/null; then
        error "Backup file is corrupted (gzip check failed)"
        exit 1
    fi
    
    log "Decompressing backup..."
    DECOMPRESSED="/tmp/verify_backup.sql"
    gunzip -c "$RESTORE_FILE" > "$DECOMPRESSED"
    RESTORE_FILE="$DECOMPRESSED"
fi

# Step 3: Create test database
log "Creating test database: $TEST_DB"
psql -h localhost -U postgres -c "CREATE DATABASE $TEST_DB;"

# Step 4: Restore backup
log "Restoring backup to test database..."
RESTORE_START=$(date +%s)

if [[ "$BACKUP_FILE" == *.dump ]]; then
    pg_restore -h localhost -U postgres -d "$TEST_DB" "$RESTORE_FILE"
else
    psql -h localhost -U postgres -d "$TEST_DB" < "$RESTORE_FILE"
fi

RESTORE_END=$(date +%s)
RESTORE_DURATION=$((RESTORE_END - RESTORE_START))
log "Restore completed in ${RESTORE_DURATION}s"

# Step 5: Run verification queries
log "Running verification queries..."

# Count major tables
EMPLOYEE_COUNT=$(psql -h localhost -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM employee;" 2>/dev/null | xargs)
TENANT_COUNT=$(psql -h localhost -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM tenant;" 2>/dev/null | xargs)
USER_COUNT=$(psql -h localhost -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"user\";" 2>/dev/null | xargs)

log "  - Employees: $EMPLOYEE_COUNT"
log "  - Tenants: $TENANT_COUNT"
log "  - Users: $USER_COUNT"

# Check for minimum data
VERIFICATION_PASSED=true

if [ "$TENANT_COUNT" -lt 1 ]; then
    warn "No tenants found in backup!"
    VERIFICATION_PASSED=false
fi

if [ "$USER_COUNT" -lt 1 ]; then
    warn "No users found in backup!"
    VERIFICATION_PASSED=false
fi

# Check table integrity (foreign keys)
log "Checking referential integrity..."
FK_ERRORS=$(psql -h localhost -U postgres -d "$TEST_DB" -t -c "
    SELECT COUNT(*) FROM employee e 
    LEFT JOIN tenant t ON e.tenant_id = t.id 
    WHERE t.id IS NULL AND e.tenant_id IS NOT NULL;
" 2>/dev/null | xargs)

if [ "$FK_ERRORS" -gt 0 ]; then
    error "Found $FK_ERRORS orphaned employee records!"
    VERIFICATION_PASSED=false
else
    log "  - Referential integrity: OK"
fi

# Step 6: Summary
echo ""
log "========================================"
log "  Verification Summary"
log "========================================"
log "  Backup File: $(basename "$BACKUP_FILE")"
log "  Restore Time: ${RESTORE_DURATION}s"
log "  Employees: $EMPLOYEE_COUNT"
log "  Tenants: $TENANT_COUNT"
log "  Users: $USER_COUNT"

if [ "$VERIFICATION_PASSED" = true ]; then
    log "========================================"
    echo -e "${GREEN}✅ Backup verification PASSED${NC}"
    log "========================================"
    exit 0
else
    log "========================================"
    echo -e "${RED}❌ Backup verification FAILED${NC}"
    log "========================================"
    exit 1
fi
