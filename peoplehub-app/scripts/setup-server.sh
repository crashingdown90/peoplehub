#!/bin/bash
# =============================================================================
# PeopleHub Server Setup Script
# =============================================================================
#
# Usage: sudo ./scripts/setup-server.sh
#
# This script automates initial server setup:
#   1. Create deploy user
#   2. Install dependencies (Node.js, PM2, PostgreSQL, Redis, Nginx)
#   3. Setup directories
#   4. Configure firewall
#   5. Setup backup cron
#
# Run this on a fresh Ubuntu 22.04 server
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
DEPLOY_USER="deploy"
APP_DIR="/var/www/peoplehub"
LOG_DIR="/var/log/peoplehub"
BACKUP_DIR="/var/backups/peoplehub"
NODE_VERSION="20"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
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
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# -----------------------------------------------------------------------------
# Pre-checks
# -----------------------------------------------------------------------------
pre_checks() {
    log "Running pre-checks..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root (sudo)"
    fi
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        warn "This script is designed for Ubuntu. Proceed with caution."
    fi
    
    log "Pre-checks passed"
}

# -----------------------------------------------------------------------------
# Update System
# -----------------------------------------------------------------------------
update_system() {
    log "Updating system..."
    
    apt update
    apt upgrade -y
    apt install -y curl wget git build-essential
    
    log "System updated"
}

# -----------------------------------------------------------------------------
# Create Deploy User
# -----------------------------------------------------------------------------
create_deploy_user() {
    log "Creating deploy user..."
    
    if id "$DEPLOY_USER" &>/dev/null; then
        log "User $DEPLOY_USER already exists"
    else
        adduser --disabled-password --gecos "" "$DEPLOY_USER"
        usermod -aG sudo "$DEPLOY_USER"
        
        # Setup SSH directory
        mkdir -p "/home/$DEPLOY_USER/.ssh"
        chmod 700 "/home/$DEPLOY_USER/.ssh"
        touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
        chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
        
        log "User $DEPLOY_USER created"
        echo ""
        warn "Remember to add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
        echo ""
    fi
}

# -----------------------------------------------------------------------------
# Install Node.js
# -----------------------------------------------------------------------------
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_VERSION" = "$NODE_VERSION" ]; then
            log "Node.js $NODE_VERSION already installed"
            return
        fi
    fi
    
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt install -y nodejs
    
    # Verify
    log "Node.js $(node --version) installed"
    log "npm $(npm --version) installed"
}

# -----------------------------------------------------------------------------
# Install PM2
# -----------------------------------------------------------------------------
install_pm2() {
    log "Installing PM2..."
    
    if command -v pm2 &> /dev/null; then
        log "PM2 already installed"
    else
        npm install -g pm2
        log "PM2 installed"
    fi
}

# -----------------------------------------------------------------------------
# Install PostgreSQL
# -----------------------------------------------------------------------------
install_postgresql() {
    log "Installing PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        log "PostgreSQL already installed"
    else
        apt install -y postgresql postgresql-contrib
        
        # Start and enable
        systemctl start postgresql
        systemctl enable postgresql
        
        log "PostgreSQL installed and running"
    fi
}

# -----------------------------------------------------------------------------
# Install Redis
# -----------------------------------------------------------------------------
install_redis() {
    log "Installing Redis..."
    
    if command -v redis-cli &> /dev/null; then
        log "Redis already installed"
    else
        apt install -y redis-server
        
        # Configure
        sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
        
        # Start and enable
        systemctl restart redis-server
        systemctl enable redis-server
        
        log "Redis installed and running"
    fi
}

# -----------------------------------------------------------------------------
# Install Nginx
# -----------------------------------------------------------------------------
install_nginx() {
    log "Installing Nginx..."
    
    if command -v nginx &> /dev/null; then
        log "Nginx already installed"
    else
        apt install -y nginx
        
        # Start and enable
        systemctl start nginx
        systemctl enable nginx
        
        log "Nginx installed and running"
    fi
}

# -----------------------------------------------------------------------------
# Setup Directories
# -----------------------------------------------------------------------------
setup_directories() {
    log "Setting up directories..."
    
    # Application directory
    mkdir -p "$APP_DIR"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
    
    # Log directory
    mkdir -p "$LOG_DIR"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$LOG_DIR"
    
    # Backup directory
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BACKUP_DIR"
    
    log "Directories created"
}

# -----------------------------------------------------------------------------
# Configure Firewall
# -----------------------------------------------------------------------------
configure_firewall() {
    log "Configuring firewall..."
    
    ufw --force enable
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    
    log "Firewall configured"
    ufw status
}

# -----------------------------------------------------------------------------
# Install Certbot
# -----------------------------------------------------------------------------
install_certbot() {
    log "Installing Certbot..."
    
    apt install -y certbot python3-certbot-nginx
    
    log "Certbot installed"
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_summary() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}  Server Setup Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Installed Components:"
    echo "  - Node.js $(node --version)"
    echo "  - npm $(npm --version)"
    echo "  - PM2 $(pm2 --version)"
    echo "  - PostgreSQL $(psql --version | head -1)"
    echo "  - Redis $(redis-cli --version)"
    echo "  - Nginx $(nginx -v 2>&1)"
    echo "  - Certbot $(certbot --version 2>&1)"
    echo ""
    echo "Directories Created:"
    echo "  - $APP_DIR (application)"
    echo "  - $LOG_DIR (logs)"
    echo "  - $BACKUP_DIR (backups)"
    echo ""
    echo "Next Steps:"
    echo "  1. Add SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
    echo "  2. Clone repository to $APP_DIR"
    echo "  3. Configure .env file"
    echo "  4. Run: sudo ./scripts/setup-ssl.sh <domain>"
    echo "  5. Create PostgreSQL database"
    echo "  6. Run Prisma migrations"
    echo "  7. Start with PM2"
    echo ""
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    echo ""
    echo "========================================"
    echo "  PeopleHub Server Setup"
    echo "========================================"
    echo ""
    
    pre_checks
    update_system
    create_deploy_user
    install_nodejs
    install_pm2
    install_postgresql
    install_redis
    install_nginx
    setup_directories
    configure_firewall
    install_certbot
    print_summary
}

main "$@"
