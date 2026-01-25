# Migration Scripts CI/CD Integration Guide

**Purpose:** Integrate migration validation scripts into the deployment pipeline  
**Owner:** DevOps Team  
**Last Updated:** 23 Januari 2026

---

## Overview

This document describes how to integrate the migration validation scripts into your CI/CD pipeline to ensure safe, automated database migrations.

## Available Scripts

### NPM Scripts

The following migration-related scripts are available in `package.json`:

```bash
# Database migration commands
npm run db:migrate:deploy     # Apply pending migrations (production)
npm run db:migrate:status     # Check migration status
npm run db:migrate            # Create and apply migration (development)

# Validation scripts
npm run migrate:pre-check     # Pre-migration validation
npm run migrate:post-check    # Post-migration validation
npm run migrate:validate      # Comprehensive data validation
```

---

## GitHub Actions Integration

### Basic Workflow

Add this to your deployment workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: peoplehub-app
        run: npm ci
        
      - name: Pre-Migration Validation
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:pre-check
        
      - name: Apply Database Migrations
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:migrate:deploy
        
      - name: Post-Migration Validation
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:post-check
        
      - name: Deploy Application
        # Your deployment steps here
        run: |
          echo "Deploying application..."
          # pm2 restart, docker deploy, etc.
```

### Advanced Workflow with Rollback

```yaml
name: Deploy with Rollback Support

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Environment
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install Dependencies
        working-directory: peoplehub-app
        run: npm ci
        
      # Step 1: Pre-flight checks
      - name: Pre-Migration Validation
        id: pre-check
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:pre-check
        continue-on-error: false
        
      # Step 2: Create backup (recommended)
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump $DATABASE_URL > backup_pre_deploy_$TIMESTAMP.sql
          
      # Step 3: Apply migrations
      - name: Apply Migrations
        id: migrate
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:migrate:deploy
        
      # Step 4: Post-migration validation
      - name: Post-Migration Validation
        id: post-check
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:post-check
        
      # Step 5: Data integrity check
      - name: Data Validation
        id: data-check
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:validate
        continue-on-error: true
        
      # Step 6: Deploy application
      - name: Deploy Application
        id: deploy
        if: success()
        run: |
          # Your deployment commands
          ssh user@server 'cd /app && pm2 reload ecosystem.config.js'
          
      # Rollback on failure
      - name: Rollback on Failure
        if: failure()
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          echo "Deployment failed. Initiating rollback..."
          # Restore from backup or use Prisma rollback
          # psql $DATABASE_URL < backup_pre_deploy_*.sql
```

---

## GitLab CI Integration

Add to `.gitlab-ci.yml`:

```yaml
stages:
  - validate
  - migrate
  - deploy

pre-migration-check:
  stage: validate
  image: node:20
  script:
    - cd peoplehub-app
    - npm ci
    - npm run migrate:pre-check
  only:
    - main

apply-migrations:
  stage: migrate
  image: node:20
  script:
    - cd peoplehub-app
    - npm ci
    - npm run db:migrate:deploy
  only:
    - main
  dependencies:
    - pre-migration-check

post-migration-check:
  stage: migrate
  image: node:20
  script:
    - cd peoplehub-app
    - npm ci
    - npm run migrate:post-check
    - npm run migrate:validate
  only:
    - main
  dependencies:
    - apply-migrations

deploy-application:
  stage: deploy
  script:
    - echo "Deploying application..."
    # Your deployment commands
  only:
    - main
  dependencies:
    - post-migration-check
```

---

## Manual Deployment Integration

### Production Deployment Script

Create `scripts/deploy-production.sh`:

```bash
#!/bin/bash
set -e

echo "=== PeopleHub Production Deployment ==="
echo "Starting at: $(date)"

# Load environment
source .env.production

# Navigate to app directory
cd peoplehub-app

# 1. Pre-flight checks
echo "Running pre-migration checks..."
npm run migrate:pre-check
if [ $? -ne 0 ]; then
  echo "❌ Pre-migration checks failed. Aborting."
  exit 1
fi

# 2. Backup database
echo "Creating database backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > "../backups/$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# 3. Apply migrations
echo "Applying database migrations..."
npm run db:migrate:deploy
if [ $? -ne 0 ]; then
  echo "❌ Migration failed. Consider rollback."
  exit 1
fi

# 4. Post-migration validation
echo "Running post-migration checks..."
npm run migrate:post-check
if [ $? -ne 0 ]; then
  echo "⚠️  Post-migration validation failed."
  read -p "Continue deployment? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 5. Data validation
echo "Running data validation..."
npm run migrate:validate
# Continue even if warnings found

# 6. Deploy application
echo "Deploying application..."
npm run build
pm2 reload ecosystem.config.js --update-env

echo "✅ Deployment completed at: $(date)"
```

Make it executable:
```bash
chmod +x scripts/deploy-production.sh
```

---

## Monitoring and Alerts

### Post-Deployment Monitoring

```yaml
# .github/workflows/post-deploy-monitor.yml
name: Post-Deploy Monitoring

on:
  workflow_run:
    workflows: ["Deploy to Production"]
    types: [completed]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        
      - name: Run Data Validation
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm ci
          npm run migrate:validate
          
      - name: Check Migration Status
        working-directory: peoplehub-app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:migrate:status
        
      - name: Send Slack Notification
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Post-deployment validation failed for PeopleHub",
              "channel": "#peoplehub-alerts"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Best Practices

### 1. Environment-Specific Configuration

```bash
# .env.staging
DATABASE_URL="postgresql://user:pass@staging-db:5432/peoplehub"
NODE_ENV=staging

# .env.production
DATABASE_URL="postgresql://user:pass@prod-db:5432/peoplehub"
NODE_ENV=production
```

### 2. Migration Approval Gates

For production deployments, consider adding manual approval:

```yaml
deploy-production:
  needs: post-migration-check
  environment:
    name: production
    url: https://peoplehub.company.com
  steps:
    # Deployment steps
```

### 3. Slack/Discord Notifications

```bash
# In your deployment script
send_notification() {
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$1\"}"
}

send_notification "✅ Migration completed successfully"
```

### 4. Database Connection Validation

Always validate database connection before migrations:

```yaml
- name: Test Database Connection
  run: |
    npx prisma db execute --stdin <<EOF
    SELECT 1;
    EOF
```

---

## Rollback Procedures

### Automated Rollback Trigger

```yaml
- name: Automated Rollback
  if: failure()
  run: |
    cd peoplehub-app
    # Apply rollback script from docs/07-operations/rollback-procedures.md
    ./scripts/rollback-migration.sh
```

### Manual Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

# Or use Prisma migration rollback
cd peoplehub-app
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Troubleshooting

### Common Issues

**Issue: Pre-check fails with "Database not configured"**
```bash
# Solution: Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://..."
npm run migrate:pre-check
```

**Issue: Post-check fails with Prisma client incompatibility**
```bash
# Solution: Regenerate Prisma client
npx prisma generate
npm run migrate:post-check
```

**Issue: Data validation shows warnings**
```bash
# Review warnings and determine if they're acceptable
npm run migrate:validate 2>&1 | tee validation-report.txt
```

---

## References

- [Migration Plan](./migration-plan.md)
- [Versioning Notes](./versioning-notes.md)
- [Rollback Procedures](./rollback-procedures.md)
- [Deployment Guide](./deployment.md)
