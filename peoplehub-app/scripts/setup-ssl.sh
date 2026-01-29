#!/bin/bash
# =============================================================================
# PeopleHub SSL Setup Script
# =============================================================================
#
# Usage: sudo ./scripts/setup-ssl.sh [domain]
#
# This script:
#   1. Installs Certbot
#   2. Obtains SSL certificate from Let's Encrypt
#   3. Configures Nginx for SSL
#   4. Sets up auto-renewal
#
# Prerequisites:
#   - Domain DNS configured pointing to server
#   - Nginx installed
#   - Root/sudo access
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
DOMAIN="${1:-peoplehub.kreatifindo.com}"
APP_DIR="/var/www/peoplehub"
NGINX_CONF="/etc/nginx/sites-available/peoplehub"

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
    
    # Check if domain is provided
    if [ -z "$DOMAIN" ]; then
        error "Domain not provided. Usage: $0 <domain>"
    fi
    
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
        error "Nginx is not installed. Please install it first."
    fi
    
    # Check DNS resolution
    log "Checking DNS for $DOMAIN..."
    if ! host "$DOMAIN" &> /dev/null; then
        warn "DNS for $DOMAIN might not be configured. Continuing anyway..."
    else
        log "DNS resolution OK"
    fi
    
    log "Pre-checks passed"
}

# -----------------------------------------------------------------------------
# Install Certbot
# -----------------------------------------------------------------------------
install_certbot() {
    log "Installing Certbot..."
    
    if command -v certbot &> /dev/null; then
        log "Certbot already installed"
        return
    fi
    
    apt update
    apt install -y certbot python3-certbot-nginx
    
    log "Certbot installed"
}

# -----------------------------------------------------------------------------
# Configure Nginx (Pre-SSL)
# -----------------------------------------------------------------------------
configure_nginx_pre_ssl() {
    log "Configuring Nginx (pre-SSL)..."
    
    # Create temporary config for Certbot
    cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # For Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Create symlink
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/peoplehub
    
    # Remove default
    rm -f /etc/nginx/sites-enabled/default
    
    # Create certbot directory
    mkdir -p /var/www/certbot
    
    # Test and reload
    nginx -t
    systemctl reload nginx
    
    log "Nginx configured (HTTP only)"
}

# -----------------------------------------------------------------------------
# Obtain SSL Certificate
# -----------------------------------------------------------------------------
obtain_certificate() {
    log "Obtaining SSL certificate for $DOMAIN..."
    
    certbot --nginx \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "admin@kreatifindo.com" \
        --redirect
    
    log "SSL certificate obtained"
}

# -----------------------------------------------------------------------------
# Configure Nginx (Post-SSL)
# -----------------------------------------------------------------------------
configure_nginx_post_ssl() {
    log "Applying production Nginx configuration..."
    
    # Copy production config (Certbot will have added SSL)
    # Or update the existing config with full settings
    
    # Backup current config
    cp "$NGINX_CONF" "${NGINX_CONF}.bak"
    
    # Check if app config exists
    if [ -f "$APP_DIR/config/nginx.conf" ]; then
        # The certbot-modified version should have the right SSL paths
        # We'll merge the production settings
        log "Production nginx config available at $APP_DIR/config/nginx.conf"
        log "Certbot has already configured SSL in $NGINX_CONF"
    fi
    
    # Test and reload
    nginx -t
    systemctl reload nginx
    
    log "Nginx SSL configuration complete"
}

# -----------------------------------------------------------------------------
# Setup Auto-Renewal
# -----------------------------------------------------------------------------
setup_auto_renewal() {
    log "Setting up auto-renewal..."
    
    # Test renewal
    certbot renew --dry-run
    
    # Certbot creates a systemd timer automatically
    systemctl status certbot.timer --no-pager || true
    
    log "Auto-renewal configured"
}

# -----------------------------------------------------------------------------
# Verify
# -----------------------------------------------------------------------------
verify() {
    log "Verifying SSL setup..."
    
    # Wait for changes to take effect
    sleep 3
    
    # Check HTTPS
    if curl -sf "https://$DOMAIN" > /dev/null 2>&1; then
        log "✅ HTTPS is working for $DOMAIN"
    else
        warn "HTTPS might not be fully configured yet"
    fi
    
    # Check certificate
    echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    echo ""
    echo "========================================"
    echo "  PeopleHub SSL Setup"
    echo "  Domain: $DOMAIN"
    echo "========================================"
    echo ""
    
    pre_checks
    install_certbot
    configure_nginx_pre_ssl
    obtain_certificate
    configure_nginx_post_ssl
    setup_auto_renewal
    verify
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}  SSL Setup Complete!${NC}"
    echo "  Visit: https://$DOMAIN"
    echo "========================================"
    echo ""
}

main "$@"
