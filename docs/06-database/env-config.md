# Environment Configuration PeopleHub

## Overview

Dokumen ini berisi daftar lengkap environment variables yang dibutuhkan untuk menjalankan PeopleHub.

---

## .env.example

```bash
# ===========================================
# PeopleHub Environment Configuration
# ===========================================
# Copy this file to .env and fill in the values
# DO NOT COMMIT .env TO VERSION CONTROL

# -------------------------------------------
# APPLICATION
# -------------------------------------------
NODE_ENV=development                    # development | staging | production
APP_NAME=PeopleHub
APP_URL=http://localhost:3000           # Full URL of the application
APP_PORT=3000                           # Port to run the app
APP_SECRET=your-super-secret-key-min-32-chars  # JWT signing secret (min 32 chars)

# Timezone (used for attendance calculations)
APP_TIMEZONE=Asia/Jakarta

# -------------------------------------------
# DATABASE (PostgreSQL)
# -------------------------------------------
DATABASE_URL=postgresql://user:password@localhost:5432/peoplehub?schema=public
DB_HOST=localhost
DB_PORT=5432
DB_NAME=peoplehub
DB_USER=peoplehub_user
DB_PASSWORD=your_secure_password
DB_SSL=false                            # true for production

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10

# -------------------------------------------
# REDIS (Optional - for sessions/cache/queue)
# -------------------------------------------
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# -------------------------------------------
# FILE STORAGE (S3-Compatible)
# -------------------------------------------
STORAGE_DRIVER=s3                       # local | s3

# S3 Configuration
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=peoplehub-files
S3_REGION=ap-southeast-1
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com  # Use custom endpoint for MinIO/DigitalOcean Spaces

# Local storage (if STORAGE_DRIVER=local)
STORAGE_LOCAL_PATH=/app/storage

# Signed URL expiration (seconds)
STORAGE_SIGNED_URL_EXPIRY=3600

# -------------------------------------------
# EMAIL (SMTP)
# -------------------------------------------
MAIL_DRIVER=smtp                        # smtp | sendgrid | ses
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_smtp_user
MAIL_PASSWORD=your_smtp_password
MAIL_ENCRYPTION=tls                     # tls | ssl | none
MAIL_FROM_ADDRESS=noreply@peoplehub.kreatifindo.com
MAIL_FROM_NAME=PeopleHub

# SendGrid (if MAIL_DRIVER=sendgrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# -------------------------------------------
# AUTHENTICATION
# -------------------------------------------
# JWT Settings
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=3600                  # Access token expiry in seconds (1 hour)
JWT_REFRESH_EXPIRY=604800               # Refresh token expiry (7 days)

# Session Settings
SESSION_SECRET=your-session-secret-key
SESSION_MAX_AGE=86400                   # Session max age in seconds (24 hours)

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true

# -------------------------------------------
# SSO (Optional - Roadmap)
# -------------------------------------------
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=${APP_URL}/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_CALLBACK_URL=${APP_URL}/auth/microsoft/callback

# -------------------------------------------
# SECURITY
# -------------------------------------------
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000              # 1 minute window
RATE_LIMIT_MAX_REQUESTS=60              # Max requests per window

# Login Rate Limit
LOGIN_RATE_LIMIT_MAX=5                  # Max login attempts
LOGIN_RATE_LIMIT_WINDOW_MS=60000        # 1 minute

# CORS
CORS_ORIGIN=http://localhost:3000       # Comma-separated origins
CORS_CREDENTIALS=true

# CSRF
CSRF_ENABLED=true
CSRF_SECRET=your-csrf-secret

# -------------------------------------------
# GEOFENCE & ATTENDANCE
# -------------------------------------------
GEOFENCE_ENABLED=false                  # Enable location-based attendance
DEFAULT_GEOFENCE_RADIUS=500             # Default radius in meters

# Late Threshold
LATE_THRESHOLD_MINUTES=5                # Grace period before marked as late

# -------------------------------------------
# NOTIFICATION
# -------------------------------------------
# Push Notifications (Optional)
PUSH_VAPID_PUBLIC_KEY=
PUSH_VAPID_PRIVATE_KEY=

# Slack Integration (Optional)
SLACK_WEBHOOK_URL=
SLACK_ENABLED=false

# SMS (Optional - Roadmap)
SMS_DRIVER=twilio                       # twilio | nexmo
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# -------------------------------------------
# LOGGING & MONITORING
# -------------------------------------------
LOG_LEVEL=debug                         # debug | info | warn | error
LOG_FORMAT=json                         # json | pretty

# Sentry (Error Tracking)
SENTRY_DSN=
SENTRY_ENVIRONMENT=${NODE_ENV}

# -------------------------------------------
# FEATURE FLAGS
# -------------------------------------------
FEATURE_SSO_ENABLED=false
FEATURE_2FA_ENABLED=false
FEATURE_GEOFENCE_ENABLED=false
FEATURE_KPI_ENABLED=true
FEATURE_TRAVEL_ENABLED=true

# -------------------------------------------
# EXTERNAL INTEGRATIONS (Roadmap)
# -------------------------------------------
# Payroll Export
PAYROLL_EXPORT_FORMAT=csv               # csv | excel | json

# Webhook
WEBHOOK_ENABLED=false
WEBHOOK_SECRET=your-webhook-secret

# -------------------------------------------
# DEVELOPMENT ONLY
# -------------------------------------------
# Debug mode (never enable in production)
DEBUG=false

# Database logging
DB_LOGGING=false

# Seed data on startup
AUTO_SEED=false
```

---

## Environment per Stage

### Development (.env.development)
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://dev:dev@localhost:5432/peoplehub_dev
DEBUG=true
DB_LOGGING=true
AUTO_SEED=true
```

### Staging (.env.staging)
```bash
NODE_ENV=staging
APP_URL=https://staging.peoplehub.kreatifindo.com
DATABASE_URL=postgresql://stage:password@db-staging:5432/peoplehub_staging
DB_SSL=true
SENTRY_ENVIRONMENT=staging
```

### Production (.env.production)
```bash
NODE_ENV=production
APP_URL=https://peoplehub.kreatifindo.com
DATABASE_URL=postgresql://prod:secure_password@db-prod:5432/peoplehub
DB_SSL=true
DEBUG=false
DB_LOGGING=false
RATE_LIMIT_ENABLED=true
CSRF_ENABLED=true
```

---

## Required vs Optional

### Required for MVP
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment mode |
| `APP_URL` | Application URL |
| `APP_SECRET` | JWT/Encryption secret |
| `DATABASE_URL` | PostgreSQL connection |
| `MAIL_*` | Email configuration |
| `STORAGE_*` | File storage (for selfie/documents) |

### Optional (Enable as needed)
| Variable | Feature |
|----------|---------|
| `REDIS_*` | Session/cache (can use memory in dev) |
| `S3_*` | Cloud storage (can use local in dev) |
| `GOOGLE_*`, `MICROSOFT_*` | SSO |
| `SENTRY_*` | Error tracking |
| `SLACK_*` | Slack notifications |
| `GEOFENCE_*` | Location-based attendance |

---

## Security Notes

> [!CAUTION]
> - Never commit `.env` to version control
> - Use different secrets per environment
> - Rotate secrets regularly in production
> - Use strong passwords (min 32 chars for secrets)

### Secret Generation
```bash
# Generate secure random secrets
openssl rand -base64 32
# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Additional Environment Variables

### Session & Token Management

```bash
# -------------------------------------------
# SESSION MANAGEMENT
# -------------------------------------------
# Maximum concurrent sessions per user
SESSION_MAX_CONCURRENT=5

# Session inactivity timeout (seconds)
SESSION_INACTIVITY_TIMEOUT=1800          # 30 minutes

# Device fingerprint validation
SESSION_DEVICE_FINGERPRINT_ENABLED=true

# Refresh token settings
REFRESH_TOKEN_EXPIRY=604800              # 7 days in seconds
REFRESH_TOKEN_ROTATE_ENABLED=true        # Issue new refresh token on use

# Token cookie settings
TOKEN_COOKIE_NAME=peoplehub_token
TOKEN_COOKIE_HTTPONLY=true
TOKEN_COOKIE_SECURE=true                 # true for HTTPS
TOKEN_COOKIE_SAMESITE=strict             # strict | lax | none
```

---

### Attendance & Selfie Configuration

```bash
# -------------------------------------------
# ATTENDANCE CONFIGURATION
# -------------------------------------------
# Clock in/out time restrictions
ATTENDANCE_CLOCK_IN_START=05:00          # Earliest clock in allowed
ATTENDANCE_CLOCK_IN_END=12:00            # Latest clock in allowed
ATTENDANCE_CLOCK_OUT_START=14:00         # Earliest clock out allowed
ATTENDANCE_CLOCK_OUT_END=23:59           # Latest clock out allowed

# Late grace period
ATTENDANCE_LATE_GRACE_MINUTES=5          # Grace period before marked late
ATTENDANCE_EARLY_LEAVE_THRESHOLD=30      # Minutes before shift end = early leave

# Overtime settings
OVERTIME_MIN_MINUTES=60                  # Minimum overtime to count (1 hour)
OVERTIME_REGULAR_RATE=1.5                # Weekday overtime multiplier
OVERTIME_WEEKEND_RATE=2.0                # Weekend overtime multiplier
OVERTIME_HOLIDAY_RATE=3.0                # Holiday overtime multiplier

# -------------------------------------------
# SELFIE & PHOTO CONFIGURATION
# -------------------------------------------
# Photo compression
SELFIE_MAX_FILE_SIZE_KB=500              # Max file size after compression
SELFIE_MAX_WIDTH=640                     # Max width in pixels
SELFIE_MAX_HEIGHT=480                    # Max height in pixels
SELFIE_QUALITY=0.8                       # JPEG quality (0.0-1.0)
SELFIE_FORMAT=jpeg                       # jpeg | webp

# Face detection (optional)
FACE_DETECTION_ENABLED=false
FACE_DETECTION_MIN_CONFIDENCE=0.7        # Minimum face detection confidence
FACE_DETECTION_MIN_SIZE_PERCENT=20       # Minimum face size as % of frame
FACE_DETECTION_MAX_FACES=1               # Maximum faces allowed

# -------------------------------------------
# LIVENESS DETECTION (Anti-Spoofing)
# -------------------------------------------
LIVENESS_DETECTION_ENABLED=false
LIVENESS_DETECTION_LEVEL=standard        # basic | standard | high | maximum
LIVENESS_CHALLENGE_TIMEOUT_MS=5000       # Challenge timeout
LIVENESS_CHALLENGES=blink,smile          # Comma-separated: blink,turn_head,smile,nod
```

---

### Offline & PWA Configuration

```bash
# -------------------------------------------
# OFFLINE & PWA CONFIGURATION
# -------------------------------------------
# Offline attendance queue
OFFLINE_QUEUE_ENABLED=true
OFFLINE_MAX_QUEUE_TIME_HOURS=4           # Max time to accept offline submissions
OFFLINE_MAX_RETRY_COUNT=5                # Max retry attempts
OFFLINE_SYNC_INTERVAL_SECONDS=30         # Background sync interval
OFFLINE_TIMESTAMP_TOLERANCE_MINUTES=15   # Max time difference tolerance

# Service Worker
SW_CACHE_VERSION=1
SW_CACHE_STATIC_MAX_AGE=86400            # 1 day
SW_CACHE_DYNAMIC_MAX_AGE=3600            # 1 hour
```

---

### Security & Audit

```bash
# -------------------------------------------
# ADVANCED SECURITY
# -------------------------------------------
# IP Restrictions
IP_WHITELIST_ENABLED=false
IP_WHITELIST=                            # Comma-separated IPs
IP_BLACKLIST=                            # Comma-separated IPs

# Brute Force Protection
BRUTE_FORCE_MAX_ATTEMPTS=5               # Max failed logins
BRUTE_FORCE_LOCKOUT_MINUTES=15           # Lockout duration
BRUTE_FORCE_PERMANENT_LOCKOUT_ATTEMPTS=15

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRY=3600         # 1 hour
PASSWORD_RESET_MAX_REQUESTS=3            # Max requests per hour

# Account Security
ACCOUNT_LOCKOUT_ENABLED=true
ACCOUNT_LOCKOUT_THRESHOLD=10             # Failed attempts before lockout
ACCOUNT_LOCKOUT_DURATION_MINUTES=30

# -------------------------------------------
# AUDIT LOGGING
# -------------------------------------------
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=2555            # 7 years (compliance)
AUDIT_LOG_SENSITIVE_ACTIONS=payslip.publish,bank.change,role.change,export.data
AUDIT_LOG_INCLUDE_REQUEST_BODY=false     # Include request body in audit
AUDIT_LOG_MASK_SENSITIVE_FIELDS=password,token,secret

# -------------------------------------------
# DATA RETENTION
# -------------------------------------------
DATA_RETENTION_ENABLED=true
DATA_RETENTION_ATTENDANCE_YEARS=5
DATA_RETENTION_LEAVE_YEARS=5
DATA_RETENTION_PAYSLIP_YEARS=10
DATA_RETENTION_AUDIT_LOG_YEARS=7
DATA_RETENTION_SESSION_DAYS=30
DATA_RETENTION_NOTIFICATION_DAYS=90
DATA_RETENTION_SELFIE_YEARS=2
```

---

### Backup & Disaster Recovery

```bash
# -------------------------------------------
# BACKUP CONFIGURATION
# -------------------------------------------
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *                # Cron: 02:00 daily
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=/backups
BACKUP_S3_ENABLED=true
BACKUP_S3_BUCKET=peoplehub-backups
BACKUP_ENCRYPTION_ENABLED=true
BACKUP_ENCRYPTION_KEY=                   # AES-256 key

# WAL Archiving (Point-in-Time Recovery)
BACKUP_WAL_ENABLED=true
BACKUP_WAL_S3_BUCKET=peoplehub-wal

# Notification
BACKUP_NOTIFY_ON_SUCCESS=false
BACKUP_NOTIFY_ON_FAILURE=true
BACKUP_NOTIFY_EMAIL=admin@kreatifindo.com
```

---

### Email & Notification Templates

```bash
# -------------------------------------------
# EMAIL TEMPLATES
# -------------------------------------------
EMAIL_TEMPLATE_PATH=/templates/email
EMAIL_TEMPLATE_ENGINE=handlebars         # handlebars | ejs | pug
EMAIL_DEFAULT_LOCALE=id                  # Default language

# Email throttling
EMAIL_THROTTLE_ENABLED=true
EMAIL_THROTTLE_MAX_PER_MINUTE=30
EMAIL_THROTTLE_MAX_PER_HOUR=500

# -------------------------------------------
# NOTIFICATION SETTINGS
# -------------------------------------------
NOTIFICATION_BATCH_SIZE=100              # Max notifications per batch
NOTIFICATION_DIGEST_ENABLED=true
NOTIFICATION_DIGEST_TIME=08:00           # Daily digest time
NOTIFICATION_DEFAULT_CHANNELS=in_app,email
```

---

### API & Rate Limiting

```bash
# -------------------------------------------
# API CONFIGURATION
# -------------------------------------------
API_VERSION=v1
API_PREFIX=/api
API_TIMEOUT_MS=30000                     # 30 seconds

# Pagination
API_DEFAULT_PAGE_SIZE=20
API_MAX_PAGE_SIZE=100

# -------------------------------------------
# ADVANCED RATE LIMITING
# -------------------------------------------
# Per-endpoint rate limits
RATE_LIMIT_AUTH_LOGIN=5/minute
RATE_LIMIT_AUTH_REGISTER=3/minute
RATE_LIMIT_AUTH_FORGOT_PASSWORD=3/minute
RATE_LIMIT_ATTENDANCE_CLOCK=10/minute
RATE_LIMIT_FILE_UPLOAD=20/minute

# Per-role rate limits
RATE_LIMIT_EMPLOYEE=60/minute
RATE_LIMIT_MANAGER=120/minute
RATE_LIMIT_HRD=200/minute
RATE_LIMIT_ADMIN=500/minute
```

---

### Multi-Tenant Configuration

```bash
# -------------------------------------------
# MULTI-TENANT
# -------------------------------------------
# Tenant isolation
TENANT_ISOLATION_STRICT=true             # Enforce strict tenant isolation
TENANT_DEFAULT_TIMEZONE=Asia/Jakarta

# Tenant limits
TENANT_MAX_EMPLOYEES=0                   # 0 = unlimited
TENANT_MAX_BRANCHES=0                    # 0 = unlimited
TENANT_MAX_STORAGE_GB=10                 # Storage limit per tenant

# Tenant branding
TENANT_CUSTOM_DOMAIN_ENABLED=false
TENANT_CUSTOM_LOGO_ENABLED=true
TENANT_CUSTOM_THEME_ENABLED=true
```

---

### External Integrations

```bash
# -------------------------------------------
# WEBHOOK CONFIGURATION
# -------------------------------------------
WEBHOOK_ENABLED=false
WEBHOOK_SECRET=your-webhook-signing-secret
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY_MS=1000

# Webhook endpoints (comma-separated)
WEBHOOK_EVENTS=employee.created,attendance.clock_in,attendance.clock_out,leave.approved,payslip.published

# -------------------------------------------
# THIRD-PARTY INTEGRATIONS
# -------------------------------------------
# Accounting/ERP Integration (Roadmap)
ERP_INTEGRATION_ENABLED=false
ERP_API_URL=
ERP_API_KEY=

# Tax Reporting (Roadmap)
TAX_REPORTING_ENABLED=false
TAX_API_URL=
TAX_API_KEY=

# BPJS Integration (Roadmap)
BPJS_INTEGRATION_ENABLED=false
BPJS_API_URL=
BPJS_API_KEY=
```

---

### Development & Testing

```bash
# -------------------------------------------
# DEVELOPMENT
# -------------------------------------------
# Hot reload
DEV_HOT_RELOAD=true

# Mock external services
DEV_MOCK_EMAIL=true
DEV_MOCK_SMS=true
DEV_MOCK_STORAGE=true

# Test data
DEV_SEED_ON_STARTUP=false
DEV_SEED_TENANT_COUNT=1
DEV_SEED_EMPLOYEE_COUNT=10

# -------------------------------------------
# TESTING
# -------------------------------------------
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/peoplehub_test
TEST_REDIS_DB=1
TEST_TIMEOUT_MS=10000
```

---

## Complete Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `APP_URL` | Yes | - | Application base URL |
| `APP_SECRET` | Yes | - | Application secret (min 32 chars) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | No | - | Redis connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_ACCESS_EXPIRY` | No | 3600 | Access token expiry (seconds) |
| `JWT_REFRESH_EXPIRY` | No | 604800 | Refresh token expiry (seconds) |
| `MAIL_HOST` | Yes | - | SMTP host |
| `MAIL_PORT` | Yes | 587 | SMTP port |
| `MAIL_USERNAME` | Yes | - | SMTP username |
| `MAIL_PASSWORD` | Yes | - | SMTP password |
| `S3_ACCESS_KEY_ID` | Conditional | - | S3 access key (if using S3) |
| `S3_SECRET_ACCESS_KEY` | Conditional | - | S3 secret key (if using S3) |
| `S3_BUCKET` | Conditional | - | S3 bucket name |
| `GEOFENCE_ENABLED` | No | false | Enable geofence for attendance |
| `FACE_DETECTION_ENABLED` | No | false | Enable face detection for selfie |
| `BACKUP_ENABLED` | No | true | Enable automated backups |
| `AUDIT_LOG_ENABLED` | No | true | Enable audit logging |

---

## Dokumen Terkait
- [05-pedoman-database.md](05-pedoman-database.md) - Database configuration
- [23-security-policy.md](23-security-policy.md) - Security requirements
- [24-backup-disaster-recovery.md](24-backup-disaster-recovery.md) - Backup configuration
