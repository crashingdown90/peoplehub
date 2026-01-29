#!/bin/bash
# =============================================================================
# PeopleHub Production Deployment Script
# =============================================================================
# 
# Usage: ./scripts/deploy.sh
#
# Prerequisites:
#   - SSH access to production server
#   - Git repository configured
#   - Database credentials in .env
#
# Features:
#   - Pre-deployment backup
#   - Zero-downtime deployment with PM2
#   - Automatic rollback on failure
#   - Health check verification
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/var/www/peoplehub"
BACKUP_DIR="/var/backups/peoplehub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/peoplehub/deploy_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Logging Functions
# -----------------------------------------------------------------------------
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# -----------------------------------------------------------------------------
# Pre-deployment Checks
# -----------------------------------------------------------------------------
pre_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        error "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
        exit 1
    fi
    
    # Check if PM2 is available
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed"
        exit 1
    fi
    
    # Check disk space (minimum 1GB)
    available_space=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then
        error "Insufficient disk space. Available: ${available_space}KB"
        exit 1
    fi
    
    log "✅ Pre-deployment checks passed"
}

# -----------------------------------------------------------------------------
# Create Backup
# -----------------------------------------------------------------------------
create_backup() {
    log "📦 Creating pre-deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log "  - Backing up database..."
    if [ -f "$APP_DIR/scripts/backup-database.sh" ]; then
        "$APP_DIR/scripts/backup-database.sh" || warn "Database backup failed, continuing..."
    fi
    
    # Backup current build
    log "  - Backing up current build..."
    if [ -d "$APP_DIR/.next" ]; then
        cp -r "$APP_DIR/.next" "$BACKUP_DIR/next_${TIMESTAMP}" || warn "Build backup failed"
    fi
    
    log "✅ Backup completed: $BACKUP_DIR"
}

# -----------------------------------------------------------------------------
# Pull Latest Code
# -----------------------------------------------------------------------------
pull_code() {
    log "📥 Pulling latest code..."
    
    cd "$APP_DIR"
    
    # Stash any local changes
    git stash --quiet || true
    
    # Fetch and reset to origin/main
    git fetch origin main
    git reset --hard origin/main
    
    log "✅ Code updated to: $(git rev-parse --short HEAD)"
}

# -----------------------------------------------------------------------------
# Install Dependencies
# -----------------------------------------------------------------------------
install_dependencies() {
    log "📚 Installing dependencies..."
    
    cd "$APP_DIR"
    
    # Use npm ci for clean install
    npm ci --production=false
    
    log "✅ Dependencies installed"
}

# -----------------------------------------------------------------------------
# Generate Prisma Client
# -----------------------------------------------------------------------------
generate_prisma() {
    log "🔧 Generating Prisma client..."
    
    cd "$APP_DIR"
    npx prisma generate
    
    log "✅ Prisma client generated"
}

# -----------------------------------------------------------------------------
# Run Database Migrations
# -----------------------------------------------------------------------------
run_migrations() {
    log "🔄 Running database migrations..."
    
    cd "$APP_DIR"
    npx prisma migrate deploy
    
    log "✅ Migrations applied"
}

# -----------------------------------------------------------------------------
# Build Application
# -----------------------------------------------------------------------------
build_app() {
    log "🔨 Building application..."
    
    cd "$APP_DIR"
    npm run build
    
    log "✅ Application built"
}

# -----------------------------------------------------------------------------
# Restart Application
# -----------------------------------------------------------------------------
restart_app() {
    log "🔄 Restarting application..."
    
    cd "$APP_DIR"
    
    # Zero-downtime restart with PM2
    pm2 reload peoplehub --update-env
    
    log "✅ Application restarted"
}

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------
health_check() {
    log "🏥 Running health check..."
    
    local max_attempts=6
    local attempt=1
    local health_url="http://localhost:3000/api/health"
    
    sleep 5
    
    while [ $attempt -le $max_attempts ]; do
        log "  - Attempt $attempt of $max_attempts..."
        
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log "✅ Health check passed!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 5
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# -----------------------------------------------------------------------------
# Rollback
# -----------------------------------------------------------------------------
rollback() {
    error "⚠️ Deployment failed! Initiating rollback..."
    
    cd "$APP_DIR"
    
    # Find the latest backup
    local latest_backup=$(ls -dt "$BACKUP_DIR"/next_* 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        log "  - Restoring from: $latest_backup"
        rm -rf "$APP_DIR/.next"
        cp -r "$latest_backup" "$APP_DIR/.next"
        
        # Restart application
        pm2 reload peoplehub --update-env
        
        log "✅ Rollback completed"
    else
        error "No backup found for rollback!"
    fi
    
    exit 1
}

# -----------------------------------------------------------------------------
# Cleanup Old Backups
# -----------------------------------------------------------------------------
cleanup_backups() {
    log "🧹 Cleaning up old backups..."
    
    # Keep last 5 build backups
    ls -dt "$BACKUP_DIR"/next_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    
    # Keep last 5 database backups
    ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm
    
    log "✅ Cleanup completed"
}

# -----------------------------------------------------------------------------
# Main Deployment Flow
# -----------------------------------------------------------------------------
main() {
    log "🚀 Starting deployment..."
    log "   Timestamp: $TIMESTAMP"
    log "   App Directory: $APP_DIR"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Run deployment steps
    pre_checks
    create_backup
    pull_code
    install_dependencies
    generate_prisma
    run_migrations
    build_app
    restart_app
    
    # Verify deployment
    if health_check; then
        cleanup_backups
        log "🎉 Deployment completed successfully!"
        log "   Duration: $(($(date +%s) - $(date -d "$(echo $TIMESTAMP | sed 's/_/ /')" +%s))) seconds"
    else
        rollback
    fi
}

# -----------------------------------------------------------------------------
# Execute
# -----------------------------------------------------------------------------
main "$@"
