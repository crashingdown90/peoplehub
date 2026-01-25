# Deployment Guide PeopleHub

## 1. Overview

Dokumen ini adalah panduan lengkap untuk deployment PeopleHub ke berbagai environment, dari development hingga production.

### 1.1 Environments

| Environment | Purpose | URL Pattern | Branch |
|-------------|---------|-------------|--------|
| Development | Local development | localhost:3000 | feature/* |
| Staging | Testing & UAT | staging.peoplehub.kreatifindo.com | develop |
| Production | Live system | peoplehub.kreatifindo.com | main |

### 1.2 Infrastructure Overview

```
                    ┌─────────────────────┐
                    │   Load Balancer     │
                    │   (Nginx/Cloudflare)│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
      │  App Server 1 │ │ App Server 2│ │ App Server N│
      │   (Next.js)   │ │  (Next.js)  │ │  (Next.js)  │
      └───────┬───────┘ └──────┬──────┘ └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
      │   PostgreSQL  │ │    Redis    │ │  S3 Storage │
      │   (Primary)   │ │   (Cache)   │ │   (Files)   │
      └───────────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Prerequisites

### 2.1 Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 100 Mbps | 1 Gbps |

### 2.2 Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| npm/pnpm | Latest | Package manager |
| PostgreSQL | 15.x | Database |
| Redis | 7.x | Cache (optional) |
| Nginx | Latest | Reverse proxy |
| PM2 | Latest | Process manager |
| Git | Latest | Version control |
| Certbot | Latest | SSL certificates |

### 2.3 Access Requirements

- [ ] SSH access to server(s)
- [ ] GitHub repository access
- [ ] Domain DNS access
- [ ] S3/Object storage credentials
- [ ] SMTP credentials
- [ ] SSL certificates atau Certbot access

---

## 3. Initial Server Setup

### 3.1 Create Non-Root User

```bash
# Login as root
ssh root@your-server-ip

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Setup SSH key
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # Paste your public key
chmod 600 ~/.ssh/authorized_keys

# Disable root login (opsional, tapi recommended)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3.2 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v20.x.x
npm --version   # 10.x.x

# Install PM2 globally
sudo npm install -g pm2

# Install pnpm (optional, faster than npm)
sudo npm install -g pnpm
```

### 3.3 Install PostgreSQL

```bash
# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

-- In psql shell:
CREATE USER peoplehub WITH PASSWORD 'your-secure-password';
CREATE DATABASE peoplehub_prod OWNER peoplehub;
GRANT ALL PRIVILEGES ON DATABASE peoplehub_prod TO peoplehub;
\q
```

### 3.4 Install Redis (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Start and enable
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return PONG
```

### 3.5 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### 3.6 Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Verify
sudo ufw status
```

---

## 4. Application Deployment

### 4.1 Clone Repository

```bash
# Login as deploy user
su - deploy

# Create app directory
sudo mkdir -p /var/www/peoplehub
sudo chown deploy:deploy /var/www/peoplehub

# Clone repository
cd /var/www/peoplehub
git clone git@github.com:kreatifindo/peoplehub.git .

# Or clone specific branch
git clone -b main git@github.com:kreatifindo/peoplehub.git .
```

### 4.2 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Production Environment Variables:**

```env
# Application
NODE_ENV=production
APP_URL=https://peoplehub.kreatifindo.com
PORT=3000

# Database
DATABASE_URL=postgresql://peoplehub:your-secure-password@localhost:5432/peoplehub_prod

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
SESSION_SECRET=another-very-long-random-secret-key

# File Storage (S3-compatible)
STORAGE_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
STORAGE_BUCKET=peoplehub-prod
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=ap-southeast-1

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kreatifindo.com
SMTP_PASS=your-app-password
EMAIL_FROM="PeopleHub <noreply@kreatifindo.com>"

# Optional: External Services
# SENTRY_DSN=https://xxx@sentry.io/xxx
# GOOGLE_CLIENT_ID=xxx
# GOOGLE_CLIENT_SECRET=xxx
```

### 4.3 Install Dependencies

```bash
cd /var/www/peoplehub

# Install dependencies
npm ci --production=false

# Or with pnpm
pnpm install --frozen-lockfile
```

### 4.4 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
```

### 4.5 Build Application

```bash
# Build Next.js application
npm run build

# Verify build output
ls -la .next/
```

### 4.6 Start with PM2

```bash
# Start application
pm2 start npm --name "peoplehub" -- start

# Or with ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed
```

**PM2 Ecosystem File:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'peoplehub',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/peoplehub',
    instances: 'max',  // Or specific number
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    // Logging
    log_file: '/var/log/peoplehub/combined.log',
    out_file: '/var/log/peoplehub/out.log',
    error_file: '/var/log/peoplehub/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Restart policy
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    // Watch (disable in production)
    watch: false
  }]
}
```

---

## 5. Nginx Configuration

### 5.1 Create Server Block

```bash
sudo nano /etc/nginx/sites-available/peoplehub
```

```nginx
# /etc/nginx/sites-available/peoplehub

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name peoplehub.kreatifindo.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name peoplehub.kreatifindo.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/peoplehub.kreatifindo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/peoplehub.kreatifindo.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Logging
    access_log /var/log/nginx/peoplehub.access.log;
    error_log /var/log/nginx/peoplehub.error.log;

    # Max upload size
    client_max_body_size 10M;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }
}
```

### 5.2 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/peoplehub /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.3 Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d peoplehub.kreatifindo.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /var/www/peoplehub

            # Pull latest changes
            git pull origin main

            # Install dependencies
            npm ci --production=false

            # Run migrations
            npx prisma migrate deploy

            # Build
            npm run build

            # Restart application
            pm2 reload peoplehub

            # Verify deployment
            sleep 5
            curl -f http://localhost:3000/api/health || exit 1

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 6.2 Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

APP_DIR="/var/www/peoplehub"
BACKUP_DIR="/var/backups/peoplehub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$TIMESTAMP.sql
cp -r $APP_DIR/.next $BACKUP_DIR/next_$TIMESTAMP || true

# Pull latest code
echo "📥 Pulling latest code..."
cd $APP_DIR
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "📚 Installing dependencies..."
npm ci --production=false

# Run migrations
echo "🔄 Running migrations..."
npx prisma migrate deploy

# Build application
echo "🔨 Building application..."
npm run build

# Restart application with zero-downtime
echo "🔄 Restarting application..."
pm2 reload peoplehub --update-env

# Health check
echo "🏥 Running health check..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed! Rolling back..."

    # Rollback
    cp -r $BACKUP_DIR/next_$TIMESTAMP $APP_DIR/.next
    pm2 reload peoplehub

    exit 1
fi

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
ls -t $BACKUP_DIR/db_*.sql | tail -n +6 | xargs -r rm
ls -dt $BACKUP_DIR/next_* | tail -n +6 | xargs -r rm -rf

echo "🎉 Deployment completed!"
```

---

## 7. Database Operations

### 7.1 Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-peoplehub.sh
```

```bash
#!/bin/bash
# /usr/local/bin/backup-peoplehub.sh

BACKUP_DIR="/var/backups/peoplehub/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -U peoplehub -h localhost peoplehub_prod | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz s3://peoplehub-backups/db/

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-peoplehub.sh

# Setup cron job (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-peoplehub.sh >> /var/log/peoplehub-backup.log 2>&1
```

### 7.2 Restore Database

```bash
# Stop application
pm2 stop peoplehub

# Restore from backup
gunzip -c /var/backups/peoplehub/db/backup_TIMESTAMP.sql.gz | psql -U peoplehub -h localhost peoplehub_prod

# Restart application
pm2 start peoplehub
```

### 7.3 Migration Commands

```bash
# Create new migration (development)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (DANGER - development only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

---

## 8. Monitoring & Logging

### 8.1 PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs peoplehub

# Monitor resources
pm2 monit

# View process details
pm2 show peoplehub
```

### 8.2 Log Rotation

```bash
# Install logrotate config
sudo nano /etc/logrotate.d/peoplehub
```

```
/var/log/peoplehub/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/peoplehub.*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 8.3 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check Redis connection (if used)
    // await redis.ping()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 })
  }
}
```

### 8.4 Uptime Monitoring

Setup external monitoring dengan:
- UptimeRobot (gratis)
- Pingdom
- Better Uptime
- Custom health check script

```bash
# Simple monitoring script
#!/bin/bash
# /usr/local/bin/check-peoplehub.sh

HEALTH_URL="https://peoplehub.kreatifindo.com/api/health"
ALERT_EMAIL="devops@kreatifindo.com"

response=$(curl -sf -w "%{http_code}" $HEALTH_URL -o /dev/null)

if [ "$response" != "200" ]; then
    echo "PeopleHub is DOWN! Status: $response" | mail -s "ALERT: PeopleHub Down" $ALERT_EMAIL
fi
```

---

## 9. Scaling

### 9.1 Horizontal Scaling (Multiple Servers)

```nginx
# /etc/nginx/conf.d/upstream.conf

upstream peoplehub_backend {
    least_conn;  # Load balancing method

    server 10.0.0.1:3000 weight=5;
    server 10.0.0.2:3000 weight=5;
    server 10.0.0.3:3000 backup;

    keepalive 32;
}
```

```nginx
# Update site config
location / {
    proxy_pass http://peoplehub_backend;
    # ... other proxy settings
}
```

### 9.2 Database Scaling

**Read Replicas:**
```env
DATABASE_URL=postgresql://user:pass@primary:5432/db
DATABASE_READ_URL=postgresql://user:pass@replica:5432/db
```

**Connection Pooling (PgBouncer):**
```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure
sudo nano /etc/pgbouncer/pgbouncer.ini
```

### 9.3 Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function cacheSet(key: string, value: any, ttl: number = 300) {
  await redis.setex(key, ttl, JSON.stringify(value))
}

export async function cacheInvalidate(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | App not running | `pm2 restart peoplehub` |
| Connection refused | Wrong port/host | Check Nginx upstream config |
| SSL error | Certificate expired | `sudo certbot renew` |
| Out of memory | Memory leak | Check PM2 logs, restart app |
| Slow response | DB queries slow | Check slow query log, add indexes |
| Upload fails | File too large | Increase `client_max_body_size` |

### 10.2 Debug Commands

```bash
# Check application status
pm2 status
pm2 logs peoplehub --lines 100

# Check Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/peoplehub.error.log

# Check PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='peoplehub_prod';"

# Check disk space
df -h

# Check memory
free -m

# Check open files
lsof -p $(pm2 pid peoplehub) | wc -l
```

### 10.3 Emergency Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

BACKUP_DIR="/var/backups/peoplehub"
APP_DIR="/var/www/peoplehub"

# Get latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/next_* | head -1)
LATEST_DB=$(ls -t $BACKUP_DIR/db_*.sql | head -1)

echo "Rolling back to: $LATEST_BACKUP"

# Stop application
pm2 stop peoplehub

# Restore files
rm -rf $APP_DIR/.next
cp -r $LATEST_BACKUP $APP_DIR/.next

# Restore database (optional, be careful!)
# psql -U peoplehub -h localhost peoplehub_prod < $LATEST_DB

# Start application
pm2 start peoplehub

echo "Rollback completed!"
```

---

## 11. Security Checklist

### 11.1 Pre-Deployment

- [ ] Environment variables tidak di-commit
- [ ] Secrets menggunakan strong random values
- [ ] Database password kuat (min 16 chars, mixed)
- [ ] SSH key-based authentication only
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed

### 11.2 Post-Deployment

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Sensitive endpoints protected
- [ ] Audit logging enabled
- [ ] Backup tested & verified

### 11.3 Ongoing

- [ ] Regular security updates
- [ ] SSL certificate auto-renewal
- [ ] Log monitoring for anomalies
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing (annual)

---

## 12. Deployment Checklist

### 12.1 First-Time Deployment

- [ ] Server provisioned and secured
- [ ] Domain DNS configured
- [ ] SSL certificate obtained
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Application deployed and running
- [ ] Nginx configured and running
- [ ] Health check passing
- [ ] Backup job configured
- [ ] Monitoring setup

### 12.2 Regular Deployment

- [ ] Tests passing in CI
- [ ] Code reviewed and approved
- [ ] Database backup taken
- [ ] Migration tested on staging
- [ ] Deployment executed
- [ ] Health check verified
- [ ] Smoke test completed
- [ ] Monitoring checked

---

## 13. Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps | devops@kreatifindo.com | Infrastructure, deployment |
| Tech Lead | tech@kreatifindo.com | Architecture, escalation |
| DBA | dba@kreatifindo.com | Database issues |
| Security | security@kreatifindo.com | Security incidents |

---

## 14. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial deployment guide |

---

## 15. References

- [14-teknologi-dan-arsitektur.md](14-teknologi-dan-arsitektur.md) - Tech stack
- [18-pengaturan-github-vps.md](18-pengaturan-github-vps.md) - Basic setup
- [24-backup-disaster-recovery.md](24-backup-disaster-recovery.md) - Backup strategy
- [23-security-policy.md](23-security-policy.md) - Security requirements
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
