#!/bin/bash
# =============================================================================
# PeopleHub Rollback Script
# =============================================================================
#
# Usage: ./scripts/rollback.sh [backup_name]
#
# If no backup_name is provided, uses the latest backup.
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/var/www/peoplehub"
BACKUP_DIR="/var/backups/peoplehub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# -----------------------------------------------------------------------------
# List Available Backups
# -----------------------------------------------------------------------------
list_backups() {
    log "📋 Available backups:"
    echo ""
    
    echo "Build backups:"
    ls -lt "$BACKUP_DIR"/next_* 2>/dev/null | head -10 || echo "  No build backups found"
    
    echo ""
    echo "Database backups:"
    ls -lt "$BACKUP_DIR"/db_*.sql* 2>/dev/null | head -10 || echo "  No database backups found"
}

# -----------------------------------------------------------------------------
# Rollback Build
# -----------------------------------------------------------------------------
rollback_build() {
    local backup_name="$1"
    local backup_path
    
    if [ -z "$backup_name" ]; then
        # Use latest backup
        backup_path=$(ls -dt "$BACKUP_DIR"/next_* 2>/dev/null | head -1)
        if [ -z "$backup_path" ]; then
            error "No build backups found!"
            exit 1
        fi
    else
        backup_path="$BACKUP_DIR/$backup_name"
        if [ ! -d "$backup_path" ]; then
            error "Backup not found: $backup_path"
            exit 1
        fi
    fi
    
    log "🔄 Rolling back build to: $backup_path"
    
    # Stop application
    log "  - Stopping application..."
    pm2 stop peoplehub || true
    
    # Backup current state (in case rollback fails)
    if [ -d "$APP_DIR/.next" ]; then
        log "  - Saving current state..."
        mv "$APP_DIR/.next" "$BACKUP_DIR/next_pre_rollback_${TIMESTAMP}"
    fi
    
    # Restore backup
    log "  - Restoring backup..."
    cp -r "$backup_path" "$APP_DIR/.next"
    
    # Start application
    log "  - Starting application..."
    pm2 start peoplehub
    
    # Health check
    log "  - Running health check..."
    sleep 5
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Build rollback completed successfully!"
    else
        error "Health check failed after rollback!"
        warn "You may need to investigate manually."
    fi
}

# -----------------------------------------------------------------------------
# Rollback Database
# -----------------------------------------------------------------------------
rollback_database() {
    local backup_name="$1"
    local backup_path
    
    if [ -z "$backup_name" ]; then
        # Use latest backup
        backup_path=$(ls -t "$BACKUP_DIR"/db_*.sql* 2>/dev/null | head -1)
        if [ -z "$backup_path" ]; then
            error "No database backups found!"
            exit 1
        fi
    else
        backup_path="$BACKUP_DIR/$backup_name"
        if [ ! -f "$backup_path" ]; then
            error "Backup not found: $backup_path"
            exit 1
        fi
    fi
    
    warn "⚠️ DATABASE ROLLBACK WARNING ⚠️"
    warn "This will OVERWRITE all current database data!"
    warn "Backup file: $backup_path"
    read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Database rollback cancelled."
        exit 0
    fi
    
    log "🔄 Rolling back database to: $backup_path"
    
    # Stop application
    log "  - Stopping application..."
    pm2 stop peoplehub || true
    
    # Create safety backup
    log "  - Creating safety backup..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_pre_rollback_${TIMESTAMP}.sql"
    
    # Restore database
    log "  - Restoring database..."
    if [[ "$backup_path" == *.gz ]]; then
        gunzip -c "$backup_path" | psql "$DATABASE_URL"
    else
        psql "$DATABASE_URL" < "$backup_path"
    fi
    
    # Start application
    log "  - Starting application..."
    pm2 start peoplehub
    
    log "✅ Database rollback completed!"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    echo ""
    echo "========================================"
    echo "  PeopleHub Rollback Tool"
    echo "========================================"
    echo ""
    
    case "$1" in
        list)
            list_backups
            ;;
        build)
            rollback_build "$2"
            ;;
        database)
            rollback_database "$2"
            ;;
        *)
            echo "Usage: $0 {list|build|database} [backup_name]"
            echo ""
            echo "Commands:"
            echo "  list              List available backups"
            echo "  build [name]      Rollback to build backup (latest if no name)"
            echo "  database [name]   Rollback to database backup (latest if no name)"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 build"
            echo "  $0 build next_20260123_120000"
            echo "  $0 database db_20260123_020000.sql.gz"
            exit 1
            ;;
    esac
}

main "$@"
