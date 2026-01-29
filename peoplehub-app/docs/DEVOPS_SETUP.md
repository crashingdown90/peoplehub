# DevOps Setup Guide

Panduan lengkap untuk setup produksi PeopleHub.

---

## 1. GitHub Secrets Configuration

Untuk CI/CD pipeline berfungsi, konfigurasi secrets berikut di GitHub:

### Langkah-langkah:
1. Buka repository GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret**
3. Tambahkan secrets berikut:

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `STAGING_HOST` | IP/hostname server staging | `staging.peoplehub.kreatifindo.com` |
| `STAGING_USER` | SSH username staging | `deploy` |
| `STAGING_SSH_KEY` | SSH private key staging | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_HOST` | IP/hostname server production | `peoplehub.kreatifindo.com` |
| `PRODUCTION_USER` | SSH username production | `deploy` |
| `PRODUCTION_SSH_KEY` | SSH private key production | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Optional Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SLACK_WEBHOOK` | Slack notification webhook | `https://hooks.slack.com/services/...` |
| `DISCORD_WEBHOOK` | Discord notification webhook | `https://discord.com/api/webhooks/...` |
| `SENTRY_DSN` | Sentry error tracking | `https://xxx@sentry.io/xxx` |

### Generate SSH Key

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "deploy@peoplehub" -f peoplehub_deploy_key -N ""

# Copy public key to server
ssh-copy-id -i peoplehub_deploy_key.pub deploy@server-ip

# Use private key content as PRODUCTION_SSH_KEY secret
cat peoplehub_deploy_key
```

---

## 2. Server Setup

### 2.1 Create Deploy User

```bash
# On server (as root)
adduser deploy
usermod -aG sudo deploy

# Setup SSH
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Paste public key to authorized_keys
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2.2 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2.3 Setup Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/peoplehub
sudo chown deploy:deploy /var/www/peoplehub

# Clone repository
cd /var/www/peoplehub
git clone git@github.com:kreatifindo/peoplehub.git .

# Create log directory
sudo mkdir -p /var/log/peoplehub
sudo chown deploy:deploy /var/log/peoplehub

# Create backup directory
sudo mkdir -p /var/backups/peoplehub
sudo chown deploy:deploy /var/backups/peoplehub
```

---

## 3. SSL Certificate Setup

### 3.1 Using Certbot (Let's Encrypt)

```bash
# Request certificate
sudo certbot --nginx -d peoplehub.kreatifindo.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 3.2 Nginx Configuration

```bash
# Copy nginx config
sudo cp /var/www/peoplehub/config/nginx.conf /etc/nginx/sites-available/peoplehub

# Create symlink
sudo ln -s /etc/nginx/sites-available/peoplehub /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 4. Database Setup

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create user and database
CREATE USER peoplehub WITH PASSWORD 'your-secure-password';
CREATE DATABASE peoplehub OWNER peoplehub;
GRANT ALL PRIVILEGES ON DATABASE peoplehub TO peoplehub;
\q

# Run migrations
cd /var/www/peoplehub
npx prisma migrate deploy
```

---

## 5. Environment Configuration

```bash
# Copy example
cp .env.example .env

# Edit with production values
nano .env
```

**Required values:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://peoplehub:your-password@localhost:5432/peoplehub
JWT_SECRET=<generate-with-openssl-rand-base64-32>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>
NEXT_PUBLIC_APP_URL=https://peoplehub.kreatifindo.com
```

---

## 6. PM2 Setup

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
# Follow the instructions printed
```

---

## 7. Backup Cron Setup

```bash
# Edit crontab
crontab -e

# Add backup jobs
# Daily backup at 2 AM
0 2 * * * /var/www/peoplehub/scripts/backup-database.sh >> /var/log/peoplehub/backup.log 2>&1

# Weekly backup verification
0 4 * * 0 /var/www/peoplehub/scripts/verify-backup.sh >> /var/log/peoplehub/verify.log 2>&1
```

---

## 8. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow required ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Verify
sudo ufw status
```

---

## 9. Verification Checklist

- [ ] SSH access working with deploy key
- [ ] GitHub Secrets configured
- [ ] PostgreSQL running and accessible
- [ ] Redis running (optional)
- [ ] Nginx configured with SSL
- [ ] Application running with PM2
- [ ] Health check endpoint responding
- [ ] Backup cron jobs configured
- [ ] Firewall enabled
- [ ] DNS configured

```bash
# Verify health
curl -sf https://peoplehub.kreatifindo.com/api/health | jq
```

---

## Troubleshooting

### Application not starting
```bash
pm2 logs peoplehub --lines 50
```

### Database connection failed
```bash
pg_isready -h localhost -U peoplehub
```

### Nginx errors
```bash
sudo tail -f /var/log/nginx/peoplehub.error.log
```
