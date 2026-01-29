# Runbook - PeopleHub Operations

> **Versi:** 1.0 | **Tanggal:** 22 Januari 2026 | **Status:** Active

---

## Ringkasan

Runbook ini berisi panduan troubleshooting dan prosedur operasional untuk tim DevOps/IT dalam mengelola PeopleHub production environment.

---

## Daftar Isi

1. [Quick Reference](#quick-reference)
2. [Startup & Shutdown](#startup--shutdown)
3. [Common Issues](#common-issues)
4. [Database Operations](#database-operations)
5. [Performance Issues](#performance-issues)
6. [Security Incidents](#security-incidents)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Quick Reference

### Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://peoplehub.kreatifindo.com | Live users |
| Staging | https://staging.peoplehub.kreatifindo.com | UAT |
| Development | http://localhost:3000 | Local dev |

### Server Access

```bash
# SSH ke production server
ssh deploy@production.peoplehub.kreatifindo.com

# SSH ke staging server
ssh deploy@staging.peoplehub.kreatifindo.com
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Next.js App | 3000 | Main application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Session |
| Nginx | 80/443 | Reverse proxy |

### Critical Paths

```
/var/www/peoplehub/        # Application root
/var/log/peoplehub/        # Application logs
/var/backups/peoplehub/    # Database backups
/etc/nginx/sites-enabled/  # Nginx config
```

---

## Startup & Shutdown

### Start All Services

```bash
# Via Docker Compose
cd /var/www/peoplehub
docker-compose up -d

# Verify services
docker-compose ps
```

### Stop All Services

```bash
# Graceful shutdown
docker-compose down

# Force stop (emergency only)
docker-compose kill
```

### Restart Application Only

```bash
# Restart Next.js container
docker-compose restart app

# Zero-downtime restart
docker-compose up -d --no-deps --build app
```

### Check Service Status

```bash
# All containers
docker-compose ps

# Specific container logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx
```

---

## Common Issues

### ISS-001: Application Not Loading (502 Bad Gateway)

**Symptoms:**
- Browser shows "502 Bad Gateway"
- Nginx error log: `connect() failed`

**Diagnosis:**
```bash
# Check if app container is running
docker ps | grep peoplehub-app

# Check app logs
docker-compose logs --tail=100 app

# Check if port is listening
netstat -tlnp | grep 3000
```

**Resolution:**
```bash
# Restart app container
docker-compose restart app

# If still failing, check memory
free -m
docker stats

# If OOM, restart with more memory
docker-compose down
docker-compose up -d
```

---

### ISS-002: Database Connection Error

**Symptoms:**
- Error: `ECONNREFUSED` atau `Connection timeout`
- App logs: `PrismaClientInitializationError`

**Diagnosis:**
```bash
# Check PostgreSQL container
docker-compose logs db

# Test connection
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "SELECT 1"

# Check connection pool
docker exec -it peoplehub-app npx prisma db execute --stdin <<< "SELECT count(*) FROM pg_stat_activity WHERE datname = 'peoplehub'"
```

**Resolution:**
```bash
# Restart database
docker-compose restart db

# Wait for ready
sleep 10

# Restart app
docker-compose restart app
```

---

### ISS-003: Slow Response Time (> 3 seconds)

**Symptoms:**
- Dashboard loading > 3 seconds
- Users complaining about slow performance

**Diagnosis:**
```bash
# Check server load
htop

# Check slow queries
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 second'
  AND state != 'idle'
ORDER BY duration DESC;
"

# Check Redis cache
docker exec -it peoplehub-redis redis-cli INFO stats
```

**Resolution:**
```bash
# Clear application cache
docker exec -it peoplehub-app npm run cache:clear

# Restart Redis
docker-compose restart redis

# If DB issue, run ANALYZE
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "ANALYZE;"
```

---

### ISS-004: Login Failure

**Symptoms:**
- Users cannot login
- Error: "Invalid credentials" even with correct password

**Diagnosis:**
```bash
# Check auth service logs
docker-compose logs app | grep -i "auth\|login"

# Check if user exists
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "
SELECT id, email, status, locked_until FROM users WHERE email = 'user@company.com';
"
```

**Resolution:**
```bash
# Unlock user account
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "
UPDATE users SET locked_until = NULL, failed_login_attempts = 0 
WHERE email = 'user@company.com';
"

# Reset password (jika diperlukan)
docker exec -it peoplehub-app npm run user:reset-password -- --email user@company.com
```

---

### ISS-005: File Upload Failed

**Symptoms:**
- Selfie upload gagal
- Document upload timeout

**Diagnosis:**
```bash
# Check disk space
df -h /var/www/peoplehub/uploads

# Check file permissions
ls -la /var/www/peoplehub/uploads

# Check upload directory
docker exec -it peoplehub-app ls -la /app/uploads
```

**Resolution:**
```bash
# Free up disk space
find /var/www/peoplehub/uploads -type f -mtime +30 -name "*.tmp" -delete

# Fix permissions
chown -R www-data:www-data /var/www/peoplehub/uploads
chmod -R 755 /var/www/peoplehub/uploads
```

---

### ISS-006: Email Not Sending

**Symptoms:**
- Notifications tidak terkirim
- Users tidak terima email approval

**Diagnosis:**
```bash
# Check email queue
docker-compose logs app | grep -i "email\|smtp\|mail"

# Check SMTP connection
docker exec -it peoplehub-app npm run email:test
```

**Resolution:**
```bash
# Check SMTP credentials in .env
cat /var/www/peoplehub/.env | grep SMTP

# Test SMTP connection manually
telnet smtp.mailtrap.io 587

# Restart email service
docker-compose restart app
```

---

## Database Operations

### Backup Database

```bash
# Manual backup
docker exec -t peoplehub-db pg_dump -U postgres peoplehub | gzip > /var/backups/peoplehub/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup
gunzip -c /var/backups/peoplehub/backup_YYYYMMDD_HHMMSS.sql.gz | head -50
```

### Restore Database

> ⚠️ **WARNING: This will overwrite all data!**

```bash
# Stop application
docker-compose stop app

# Restore from backup
gunzip -c /var/backups/peoplehub/backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i peoplehub-db psql -U postgres -d peoplehub

# Restart application
docker-compose start app
```

### Run Migrations

```bash
# Development
npx prisma migrate dev

# Production (deploy only)
docker exec -it peoplehub-app npx prisma migrate deploy

# Check migration status
docker exec -it peoplehub-app npx prisma migrate status
```

### Reset Database (Development Only)

```bash
# WARNING: Deletes all data!
docker exec -it peoplehub-app npx prisma migrate reset --force
```

---

## Performance Issues

### Memory Optimization

```bash
# Check memory usage
docker stats --no-stream

# Increase Node.js memory limit
# Edit docker-compose.yml:
# environment:
#   - NODE_OPTIONS=--max-old-space-size=4096
```

### Database Query Optimization

```bash
# Find slow queries
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Rebuild indexes
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "REINDEX DATABASE peoplehub;"
```

### Clear Caches

```bash
# Clear Redis cache
docker exec -it peoplehub-redis redis-cli FLUSHALL

# Clear Next.js cache
docker exec -it peoplehub-app rm -rf .next/cache
docker-compose restart app
```

---

## Security Incidents

### ISS-SEC-001: Unauthorized Access Attempt

**Symptoms:**
- Multiple failed login attempts from single IP
- Audit log shows suspicious activity

**Response:**
```bash
# Block IP at firewall
sudo ufw deny from 123.456.789.0

# Check audit logs
docker exec -it peoplehub-db psql -U postgres -d peoplehub -c "
SELECT * FROM audit_logs 
WHERE action = 'LOGIN_FAILED' 
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
"

# Force logout all sessions
docker exec -it peoplehub-redis redis-cli FLUSHDB
```

### ISS-SEC-002: Data Breach (Suspected)

**Response:**
1. **IMMEDIATELY** contact security team
2. Preserve evidence:
   ```bash
   # Snapshot logs
   docker-compose logs > incident_logs_$(date +%Y%m%d_%H%M%S).txt
   
   # Snapshot audit table
   docker exec -it peoplehub-db pg_dump -U postgres -t audit_logs peoplehub > audit_snapshot.sql
   ```
3. Consider taking system offline:
   ```bash
   docker-compose stop app
   ```
4. Follow incident response procedure

---

## Backup & Recovery

### Automated Backup Schedule

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Full DB | Daily 02:00 | 30 days | `/var/backups/peoplehub/daily/` |
| Incremental | Hourly | 24 hours | `/var/backups/peoplehub/hourly/` |
| Uploads | Daily 03:00 | 7 days | `/var/backups/peoplehub/uploads/` |

### Cron Jobs

```bash
# /etc/cron.d/peoplehub-backup

# Daily full backup at 2 AM
0 2 * * * root /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1

# Hourly incremental
0 * * * * root /opt/scripts/backup-incremental.sh >> /var/log/backup.log 2>&1

# Cleanup old backups
0 4 * * * root find /var/backups/peoplehub/daily -mtime +30 -delete
```

### Test Restore (Monthly)

```bash
# Setiap bulan, test restore di staging:
1. Download backup terbaru
2. Restore ke staging database
3. Verify data integrity
4. Document hasil di incident log
```

---

## Monitoring & Alerts

### Health Check Endpoints

| Endpoint | Expected Response | Timeout |
|----------|-------------------|---------|
| `/api/health` | `{ "status": "ok" }` | 5s |
| `/api/health/db` | `{ "status": "ok" }` | 10s |
| `/api/health/redis` | `{ "status": "ok" }` | 3s |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Disk Usage | > 80% | > 95% |
| Response Time (P95) | > 2s | > 5s |
| Error Rate | > 1% | > 5% |
| DB Connections | > 80 | > 95 |

### Manual Health Check

```bash
# Full health check script
/opt/scripts/health-check.sh

# Sample output:
# ✅ App: Running
# ✅ Database: Connected (45/100 connections)
# ✅ Redis: Connected
# ✅ Disk: 45% used
# ✅ Memory: 62% used
# ✅ Response Time: 245ms
```

---

## Escalation Matrix

| Severity | Description | Response Time | Escalate To |
|----------|-------------|---------------|-------------|
| **P0** | System down, data loss | 15 min | On-call → Tech Lead → CTO |
| **P1** | Major feature broken | 1 hour | On-call → Tech Lead |
| **P2** | Minor feature broken | 4 hours | On-call |
| **P3** | Cosmetic/minor | Next business day | Ticket system |

### On-Call Contacts

| Role | Primary | Backup |
|------|---------|--------|
| Weekday (09:00-18:00) | DevOps Team | Tech Lead |
| Weeknight | On-call Engineer | DevOps Lead |
| Weekend | On-call Engineer | Tech Lead |

---

## Dokumen Terkait

| Dokumen | Link |
|---------|------|
| Deployment Guide | [deployment.md](deployment.md) |
| Security Policy | [security.md](security.md) |
| Backup & DR | [backup-dr.md](backup-dr.md) |
| API Specification | [../04-api/specification.md](../04-api/specification.md) |
