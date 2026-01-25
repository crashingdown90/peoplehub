# PeopleHub HRIS - Application

> Modern HRIS system built with Next.js 16, TypeScript, Prisma, and PostgreSQL

---

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Setup database
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker Development

```bash
# Start all services (app, db, redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## DevOps & Deployment

### Quick Links

| Document | Description |
|----------|-------------|
| [DEVOPS_SETUP.md](docs/DEVOPS_SETUP.md) | Complete production setup guide |
| [MONITORING.md](docs/MONITORING.md) | Monitoring & alerting configuration |
| [CI/CD Workflows](.github/workflows/) | GitHub Actions automation |
| [Docker Config](docker-compose.yml) | Container orchestration |
| [Deployment Scripts](scripts/) | Automated deployment tools |

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup-server.sh` | Automated server setup |
| `scripts/setup-ssl.sh` | SSL certificate automation |
| `scripts/deploy.sh` | Production deployment |
| `scripts/rollback.sh` | Emergency rollback |
| `scripts/backup-database.sh` | Database backup |
| `scripts/verify-backup.sh` | Backup verification |
| `scripts/health-check.sh` | Service health check |

### Production Deployment

```bash
# On fresh server (Ubuntu 22.04)
sudo ./scripts/setup-server.sh
sudo ./scripts/setup-ssl.sh peoplehub.kreatifindo.com

# Deploy application
cd /var/www/peoplehub
git clone <repository>
./scripts/deploy.sh
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              GitHub Actions                  │
│  (CI/CD: Lint, Test, Build, Deploy)        │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│           Production Server                  │
│  ┌────────────────────────────────────────┐ │
│  │         Nginx (Reverse Proxy)          │ │
│  │         SSL/TLS Termination            │ │
│  └─────────────────┬──────────────────────┘ │
│                    │                         │
│  ┌─────────────────▼──────────────────────┐ │
│  │      Next.js App (PM2 Cluster)        │ │
│  │      - Authentication                  │ │
│  │      - Business Logic                  │ │
│  │      - API Routes                      │ │
│  └─┬──────────┬───────────┬───────────────┘ │
│    │          │           │                  │
│  ┌─▼────┐  ┌─▼─────┐  ┌──▼────────┐        │
│  │ DB   │  │Redis  │  │ S3 Storage│        │
│  │PG 15 │  │Cache  │  │  (Files)  │        │
│  └──────┘  └───────┘  └───────────┘        │
└─────────────────────────────────────────────┘
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript check |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:api` | Run API tests |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

---

## Environment Variables

See [.env.example](.env.example) for all required and optional environment variables.

**Critical variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `SESSION_SECRET` - Session encryption key
- `ENCRYPTION_KEY` - Data encryption key (min 32 chars)

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Overall application health |
| `/api/health/db` | Database connectivity |
| `/api/health/redis` | Redis connectivity (if configured) |
| `/api/health/detailed` | Detailed system information |

---

## CI/CD Pipeline

### Workflows

**Continuous Integration** ([ci.yml](.github/workflows/ci.yml))
- ✅ Lint & type check
- ✅ Unit & API tests
- ✅ Security audit
- ✅ Build verification
- ✅ E2E tests (Playwright)

**Continuous Deployment** ([deploy.yml](.github/workflows/deploy.yml))
- ✅ Staging deployment (develop branch)
- ✅ Production deployment (main branch)
- ✅ Automatic rollback on failure
- ✅ Slack/Discord notifications

### Required GitHub Secrets

```
STAGING_HOST, STAGING_USER, STAGING_SSH_KEY
PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY
SLACK_WEBHOOK (optional)
```

---

## Monitoring

- **Uptime**: UptimeRobot / Better Uptime
- **Errors**: Sentry (optional)
- **Logs**: PM2 logs + rotation
- **Metrics**: Health check endpoints
- **Alerts**: Slack/Discord webhooks

See [MONITORING.md](docs/MONITORING.md) for complete setup.

---

## Support & Documentation

- **Main Docs**: [../docs/](../docs/)
- **API Spec**: [../docs/04-api/specification.md](../docs/04-api/specification.md)
- **Architecture**: [../docs/03-architecture/](../docs/03-architecture/)
- **Operations**: [../docs/07-operations/](../docs/07-operations/)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7 (optional)
- **Auth**: JWT + HTTP-only cookies
- **UI**: Tailwind CSS + Radix UI
- **Testing**: Jest + Playwright
- **Deployment**: Docker + PM2 + Nginx

---

## License

Private - PT. Kreatifindo Abadi Sejahtera
