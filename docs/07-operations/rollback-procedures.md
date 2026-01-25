# Rollback Procedures - PeopleHub

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Active

---

## Ringkasan

Dokumen ini mendefinisikan prosedur rollback untuk berbagai skenario:
- Schema rollback
- Data rollback  
- Application rollback
- Emergency procedures

---

## 1. Rollback Principles

### Prinsip Utama

1. **Preparation is Key** - Rollback plan disiapkan SEBELUM deployment
2. **Test Rollback** - Rollback procedure harus di-test di staging
3. **Communication First** - Notify stakeholders sebelum rollback
4. **Document Everything** - Semua rollback harus didokumentasikan
5. **Root Cause Analysis** - Post-rollback investigation wajib

### Rollback Decision Matrix

| Severity | Max Downtime | Decision Maker | Auto-Rollback |
|----------|--------------|-----------------|---------------|
| P0 Critical | 15 min | On-call engineer | Yes (if configured) |
| P1 High | 30 min | Tech Lead | Manual |
| P2 Medium | 2 hours | Tech Lead + PM | Manual |
| P3 Low | Next release | Team | No rollback |

---

## 2. Rollback Types

### 2.1 Application Rollback (Code Only)

**Kapan Digunakan:**
- Bug di application code
- Performance regression
- Feature tidak berfungsi

**Impact:** Minimal, database tidak berubah

```bash
#!/bin/bash
# scripts/rollback-application.sh

set -e

echo "🔙 Application Rollback"
echo "========================"

# Get previous version
CURRENT_VERSION=$(git describe --tags --abbrev=0)
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 ${CURRENT_VERSION}^)

echo "Current version: ${CURRENT_VERSION}"
echo "Rolling back to: ${PREVIOUS_VERSION}"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled"
  exit 1
fi

# 1. Checkout previous version
git checkout ${PREVIOUS_VERSION}

# 2. Install dependencies
npm ci

# 3. Build application
npm run build

# 4. Restart application
pm2 reload peoplehub

# 5. Verify health
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "✅ Rollback successful"
  echo "Version: ${PREVIOUS_VERSION}"
else
  echo "❌ Health check failed!"
  exit 1
fi
```

### 2.2 Schema Rollback (Database)

**Kapan Digunakan:**
- Migration gagal
- Schema error
- Data corruption akibat migration

**Impact:** Medium, memerlukan database restore

```bash
#!/bin/bash
# scripts/rollback-schema.sh

set -e

echo "🔙 Schema Rollback"
echo "=================="

# Check for backup
BACKUP_DIR="/backups"
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/backup_*_pre_migration.dump 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No pre-migration backup found!"
  echo "Manual intervention required."
  exit 1
fi

echo "Found backup: ${LATEST_BACKUP}"
read -p "Restore from this backup? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled"
  exit 1
fi

# 1. Stop application
echo "Stopping application..."
pm2 stop peoplehub

# 2. Create safety backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Creating safety backup..."
pg_dump -Fc $DATABASE_URL > "${BACKUP_DIR}/backup_${TIMESTAMP}_before_rollback.dump"

# 3. Restore from backup
echo "Restoring database..."
pg_restore -c -d $DATABASE_URL "${LATEST_BACKUP}"

# 4. Generate Prisma client for old schema
echo "Regenerating Prisma client..."
npx prisma generate

# 5. Start application
echo "Starting application..."
pm2 start peoplehub

# 6. Verify
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "✅ Schema rollback successful"
else
  echo "❌ Health check failed after rollback!"
  exit 1
fi
```

### 2.3 Full Rollback (Code + Schema)

**Kapan Digunakan:**
- Complete release failure
- Major breaking changes
- Coordinated rollback needed

**Impact:** High, memerlukan downtime

```bash
#!/bin/bash
# scripts/rollback-full.sh

set -e

echo "🔙 Full Rollback (Code + Schema)"
echo "================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "  - Restore database to pre-release state"
echo "  - Rollback application to previous version"
echo "  - Cause data loss for changes made since release"
echo ""
read -p "Are you sure? Type 'ROLLBACK' to confirm: " CONFIRM

if [ "$CONFIRM" != "ROLLBACK" ]; then
  echo "Rollback cancelled"
  exit 1
fi

# Variables
BACKUP_DIR="/backups"
RELEASE_TAG=$1

if [ -z "$RELEASE_TAG" ]; then
  # Get previous release tag
  CURRENT=$(git describe --tags --abbrev=0)
  RELEASE_TAG=$(git describe --tags --abbrev=0 ${CURRENT}^)
fi

echo "Target version: ${RELEASE_TAG}"

# Find corresponding backup
BACKUP_FILE="${BACKUP_DIR}/backup_${RELEASE_TAG}_pre.dump"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup not found: ${BACKUP_FILE}"
  echo "Available backups:"
  ls -la ${BACKUP_DIR}/*.dump
  exit 1
fi

# 1. Enable maintenance mode
echo "📋 Enabling maintenance mode..."
touch /var/www/maintenance.flag

# 2. Stop application
echo "🛑 Stopping application..."
pm2 stop peoplehub

# 3. Create safety backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "💾 Creating safety backup..."
pg_dump -Fc $DATABASE_URL > "${BACKUP_DIR}/backup_${TIMESTAMP}_before_rollback.dump"
echo "   Saved: backup_${TIMESTAMP}_before_rollback.dump"

# 4. Restore database
echo "🔄 Restoring database from ${BACKUP_FILE}..."
pg_restore -c -d $DATABASE_URL "${BACKUP_FILE}"

# 5. Checkout previous code version
echo "📦 Checking out code version ${RELEASE_TAG}..."
git fetch --tags
git checkout ${RELEASE_TAG}

# 6. Install dependencies
echo "📚 Installing dependencies..."
npm ci

# 7. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 8. Build application
echo "🔨 Building application..."
npm run build

# 9. Start application
echo "🚀 Starting application..."
pm2 start peoplehub

# 10. Wait and verify
echo "⏳ Waiting for startup..."
sleep 10

echo "🏥 Running health check..."
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed!"
  echo "Manual intervention required"
  exit 1
fi

# 11. Remove maintenance mode
echo "📋 Disabling maintenance mode..."
rm -f /var/www/maintenance.flag

# 12. Summary
echo ""
echo "======================================"
echo "✅ FULL ROLLBACK COMPLETED"
echo "======================================"
echo "Previous version: ${CURRENT:-unknown}"
echo "Rolled back to: ${RELEASE_TAG}"
echo "Backup restored: ${BACKUP_FILE}"
echo "Safety backup: backup_${TIMESTAMP}_before_rollback.dump"
echo ""
echo "⚠️  Action items:"
echo "  1. Notify stakeholders"
echo "  2. Investigate root cause"
echo "  3. Document in incident log"
```

---

## 3. Scenario-Based Rollback

### Scenario 1: Migration Script Fails

**Symptoms:**
- `prisma migrate deploy` returns error
- Application won't start
- Database in partial state

**Procedure:**

```bash
# 1. Check migration status
npx prisma migrate status

# Output shows:
# - Applied migrations
# - Failed migration
# - Pending migrations (should apply these)

# 2. Option A: If migration partially applied, try to resolve
npx prisma migrate resolve --applied "migration_name"

# 3. Option B: If cannot resolve, restore backup
pm2 stop peoplehub
pg_restore -c -d $DATABASE_URL /backups/pre_migration.dump

# 4. Fix migration script
# Edit prisma/migrations/XXXXX_migration_name/migration.sql

# 5. Retry migration
npx prisma migrate deploy
pm2 start peoplehub
```

### Scenario 2: Data Corruption After Migration

**Symptoms:**
- Invalid data in tables
- Foreign key violations
- Application errors accessing data

**Procedure:**

```bash
# 1. Assess damage
psql $DATABASE_URL << 'EOF'
-- Check for orphaned records
SELECT 'orphaned_employees' as issue, COUNT(*) as count
FROM employees e LEFT JOIN users u ON e.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 'null_tenant_id', COUNT(*)
FROM employees WHERE tenant_id IS NULL
UNION ALL
SELECT 'invalid_status', COUNT(*)
FROM users WHERE status NOT IN ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'SUSPENDED');
EOF

# 2. If minor, fix with SQL
psql $DATABASE_URL -c "DELETE FROM employees WHERE user_id NOT IN (SELECT id FROM users)"

# 3. If major, restore from backup
./scripts/rollback-schema.sh

# 4. Verify data integrity
npx ts-node scripts/migrations/post-migrate.ts
```

### Scenario 3: Performance Degradation

**Symptoms:**
- Slow response times (>3s)
- High CPU/memory usage
- Database connection timeouts

**Procedure:**

```bash
# 1. Quick diagnosis
# Check current performance
curl -w "Time: %{time_total}s\n" http://localhost:3000/api/health

# Check database
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# 2. Option A: If code issue, rollback application
./scripts/rollback-application.sh

# 3. Option B: If schema issue (missing index, bad query)
# Add index without rollback
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_fix ON table_name (column_name)"

# 4. Restart if needed
pm2 reload peoplehub
```

### Scenario 4: Security Vulnerability

**Symptoms:**
- Security scan found vulnerability
- Suspicious activity detected
- Data breach suspected

**Procedure:**

```bash
# IMMEDIATE ACTIONS

# 1. Isolate - stop accepting new requests
pm2 stop peoplehub

# 2. Preserve evidence
pg_dump -Fc $DATABASE_URL > /backups/incident_$(date +%Y%m%d_%H%M%S).dump
cp -r /var/log/peoplehub /backups/logs_$(date +%Y%m%d_%H%M%S)/

# 3. Assess if rollback helps
# If vulnerability is in recent code:
./scripts/rollback-application.sh

# 4. If data compromised, restore to known clean state
# Identify last known good backup
./scripts/rollback-full.sh v1.1.0  # Last known good version

# 5. Change all credentials
# - Database passwords
# - JWT secrets
# - API keys

# 6. Restart with secured version
pm2 start peoplehub

# 7. Notify security team and management
```

---

## 4. Emergency Rollback Checklist

### Quick Reference Card

```markdown
## 🚨 EMERGENCY ROLLBACK CHECKLIST

### Before Rollback
[ ] Identify the issue and severity
[ ] Notify on-call team lead
[ ] Document current state (screenshots, logs)
[ ] Identify rollback target (backup/version)

### During Rollback
[ ] Enable maintenance mode (if possible)
[ ] Stop application: pm2 stop peoplehub
[ ] Create safety backup
[ ] Execute rollback script
[ ] Verify rollback successful

### After Rollback
[ ] Health check: curl http://localhost:3000/api/health
[ ] Smoke test critical paths (login, attendance, leave)
[ ] Disable maintenance mode
[ ] Notify stakeholders
[ ] Create incident ticket
[ ] Schedule post-mortem

### Communication
[ ] Slack: #ops-alerts
[ ] Email: ops@kreatifindo.com
[ ] Phone: On-call escalation
```

### Emergency Contacts

| Role | Name | Contact | Escalation Time |
|------|------|---------|-----------------|
| On-Call Engineer | [Rotation] | #ops-oncall | Immediate |
| Tech Lead | [Name] | +62xxx | 15 min |
| DevOps Lead | [Name] | +62xxx | 30 min |
| CTO | [Name] | +62xxx | 1 hour (P0 only) |

---

## 5. Rollback Scripts

### 5.1 Pre-Rollback Validation

```typescript
// scripts/migrations/pre-rollback.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateRollbackSafe(): Promise<boolean> {
  console.log('🔍 Pre-Rollback Validation\n');
  
  let canRollback = true;

  // 1. Check for data created since last backup
  const lastBackupTime = new Date(process.env.LAST_BACKUP_TIME || '');
  
  const newUsers = await prisma.user.count({
    where: { createdAt: { gt: lastBackupTime } }
  });
  
  const newAttendances = await prisma.attendance.count({
    where: { createdAt: { gt: lastBackupTime } }
  });
  
  console.log(`📊 Data since last backup (${lastBackupTime.toISOString()}):`);
  console.log(`   New users: ${newUsers}`);
  console.log(`   New attendances: ${newAttendances}`);
  
  if (newUsers > 0 || newAttendances > 0) {
    console.log('\n⚠️  WARNING: Rolling back will lose this data!');
    canRollback = false; // Require manual confirmation
  }

  // 2. Check for pending transactions
  const pendingLeaves = await prisma.leaveRequest.count({
    where: { status: 'PENDING' }
  });
  
  console.log(`\n📋 Pending transactions:`);
  console.log(`   Leave requests: ${pendingLeaves}`);
  
  // 3. Check active sessions
  const activeSessions = await prisma.session.count({
    where: {
      expiresAt: { gt: new Date() },
      revokedAt: null
    }
  });
  
  console.log(`   Active sessions: ${activeSessions}`);
  
  console.log('\n' + '─'.repeat(50));
  
  if (canRollback) {
    console.log('✅ Safe to rollback (no data loss)');
  } else {
    console.log('⚠️  Rollback will cause data loss');
    console.log('   Manual confirmation required');
  }
  
  return canRollback;
}

validateRollbackSafe()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 5.2 Post-Rollback Verification

```typescript
// scripts/migrations/post-rollback.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  check: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

async function verifyRollback(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // 1. Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      check: 'Database Connection',
      status: 'pass',
      message: 'Connected successfully'
    });
  } catch (error) {
    results.push({
      check: 'Database Connection',
      status: 'fail',
      message: `Connection failed: ${error}`
    });
    return results; // Can't continue
  }

  // 2. Schema version matches code
  try {
    // Try to query all major tables
    await prisma.tenant.findFirst();
    await prisma.user.findFirst();
    await prisma.employee.findFirst();
    results.push({
      check: 'Schema Compatibility',
      status: 'pass',
      message: 'Prisma schema matches database'
    });
  } catch (error) {
    results.push({
      check: 'Schema Compatibility',
      status: 'fail',
      message: `Schema mismatch: ${error}`
    });
  }

  // 3. Tenant isolation check
  const tenantCheck = await prisma.$queryRaw<Array<{issue_count: bigint}>>`
    SELECT COUNT(*) as issue_count FROM (
      SELECT 1 FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.tenant_id != u.tenant_id
    ) violations
  `;
  const violations = Number(tenantCheck[0]?.issue_count || 0);
  results.push({
    check: 'Tenant Isolation',
    status: violations === 0 ? 'pass' : 'fail',
    message: violations === 0 ? 'No cross-tenant data' : `${violations} violations found`
  });

  // 4. Core functionality check
  const tenantCount = await prisma.tenant.count();
  const userCount = await prisma.user.count();
  results.push({
    check: 'Core Data',
    status: tenantCount > 0 && userCount > 0 ? 'pass' : 'warn',
    message: `${tenantCount} tenants, ${userCount} users`
  });

  return results;
}

async function main() {
  console.log('🔍 Post-Rollback Verification\n');
  
  const results = await verifyRollback();
  
  let hasFailures = false;
  
  for (const result of results) {
    let icon = '✅';
    if (result.status === 'warn') icon = '⚠️';
    if (result.status === 'fail') icon = '❌';
    
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.message}\n`);
    
    if (result.status === 'fail') hasFailures = true;
  }
  
  console.log('─'.repeat(50));
  
  if (hasFailures) {
    console.log('❌ VERIFICATION FAILED');
    console.log('Manual intervention required');
    process.exit(1);
  } else {
    console.log('✅ ROLLBACK VERIFIED');
    process.exit(0);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 6. Communication Templates

### 6.1 Rollback Notification (Internal)

```markdown
Subject: [PeopleHub] Rollback Initiated - [DATE] [TIME]

Tim,

Kami sedang melakukan rollback sistem PeopleHub.

**Detail:**
- Severity: [P0/P1/P2]
- Issue: [Deskripsi singkat masalah]
- Action: Rollback ke versi [VERSION]
- Estimasi downtime: [XX] menit

**Status:**
[ ] Rollback dimulai
[ ] Database restored
[ ] Application restarted  
[ ] Verification passed

Akan update setelah rollback selesai.

-- [Nama Engineer]
```

### 6.2 Rollback Completion (Internal)

```markdown
Subject: [PeopleHub] Rollback Complete - System Normal

Tim,

Rollback telah selesai. Sistem kembali normal.

**Summary:**
- Rolled back to: v[VERSION]
- Downtime: [XX] menit
- Data impact: [None / Minimal / Significant]

**Next Steps:**
1. Root cause analysis (RCA) dalam 24 jam
2. Hotfix deployment plan
3. Post-mortem meeting scheduled

**Monitoring:**
- Dashboard: [Link]
- Grafana: [Link]

Jika ada issue, contact [On-Call Engineer].

-- [Nama Engineer]
```

### 6.3 User Notification (External)

```markdown
Subject: [PeopleHub] Maintenance Selesai

Yth. Pengguna PeopleHub,

Maintenance sistem telah selesai. Anda dapat mengakses PeopleHub seperti biasa.

Kami mohon maaf atas ketidaknyamanan yang terjadi.

Jika mengalami masalah:
- Email: support@kreatifindo.com
- Help desk: [Link]

Terima kasih,
Tim PeopleHub
```

---

## 7. Post-Rollback Procedures

### 7.1 Incident Documentation

```markdown
# Incident Report: [INCIDENT-ID]

## Summary
- **Date:** [DATE]
- **Duration:** [START] - [END]
- **Severity:** [P0/P1/P2/P3]
- **Impact:** [Description of user impact]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Issue detected |
| HH:MM | Rollback decision made |
| HH:MM | Rollback started |
| HH:MM | Rollback completed |
| HH:MM | System verified normal |

## Root Cause
[Description of what caused the issue]

## Resolution
[What was done to fix/rollback]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action 1] | [Name] | [Date] |
| [Action 2] | [Name] | [Date] |
```

### 7.2 Post-Mortem Template

```markdown
# Post-Mortem: [INCIDENT-ID]

**Date:** [DATE]
**Attendees:** [Names]

## What Happened
[Detailed timeline of events]

## Root Cause Analysis

### 5 Whys
1. Why did the issue occur?
   → [Answer]
2. Why [Answer 1]?
   → [Answer]
3. ...

### Contributing Factors
- [Factor 1]
- [Factor 2]

## What Went Well
- [Item 1]
- [Item 2]

## What Could Be Improved
- [Item 1]
- [Item 2]

## Action Items
| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| | | | | |

## Follow-up
- Next review: [Date]
- Owner: [Name]
```

---

## 8. Rollback Testing

### 8.1 Monthly Rollback Drill

**Objective:** Verify rollback procedures work correctly

**Procedure:**
1. Schedule on staging environment
2. Deploy current production version
3. Execute full rollback to previous version
4. Time the procedure
5. Document results

**Success Criteria:**
- Rollback completes within RTO (4 hours)
- No data corruption
- All health checks pass

### 8.2 Rollback Drill Checklist

```markdown
## Rollback Drill - [DATE]

### Environment: Staging

### Pre-Drill
- [ ] Production backup replicated to staging
- [ ] Drill scheduled and communicated
- [ ] Rollback scripts accessible

### Execution
- [ ] Deploy latest version
- [ ] Add test data
- [ ] Execute rollback
- [ ] Time recorded: ___ minutes

### Verification
- [ ] Database restored correctly
- [ ] Application runs on old version
- [ ] Test data from post-deploy is gone (expected)
- [ ] Core functionality works

### Results
- Total time: ___ minutes
- Issues encountered: [List]
- Improvements needed: [List]

### Sign-off
- Performed by: [Name]
- Reviewed by: [Name]
- Date: [Date]
```

---

## 9. Related Documents

| Document | Link |
|----------|------|
| Migration Plan | [migration-plan.md](migration-plan.md) |
| Versioning Notes | [versioning-notes.md](versioning-notes.md) |
| Backup & DR | [backup-dr.md](backup-dr.md) |
| Deployment Guide | [deployment.md](deployment.md) |
| Runbook | [runbook.md](runbook.md) |

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-23 | Migration & Release Engineer | Initial document |
