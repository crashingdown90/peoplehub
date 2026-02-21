# PeopleHub HRIS

> Human Resource Information System untuk manajemen karyawan modern

---

## Overview

PeopleHub adalah sistem HRIS komprehensif yang dikembangkan dengan arsitektur multi-tenant, mendukung:

- **Attendance Management** - Absensi online dengan selfie & GPS
- **Leave Management** - Pengajuan cuti dengan approval workflow
- **Payroll Integration** - Slip gaji dan perhitungan otomatis
- **Employee Self-Service** - Portal mandiri karyawan
- **Multi-Role Dashboard** - Dashboard sesuai role (Employee, Manager, HRD, Finance, IT)

---

## Project Structure

```
PeopleHub Kreatifindo/
├── README.md                 # This file
├── docs/                     # Technical documentation
│   ├── 01-overview/          # Concept, KAK, glossary
│   ├── 02-requirements/      # Roles, user stories, specs
│   ├── 03-architecture/      # HLD, LLD, ERD, tech stack
│   ├── 04-api/               # API specification, flows
│   ├── 05-frontend/          # UI guidelines, design system
│   ├── 06-database/          # DB guidelines, config
│   ├── 07-operations/        # Deploy, security, backup
│   ├── 08-testing/           # Test strategy
│   └── 09-templates/         # Email & letter templates
├── .ai/                      # AI collaboration hub
│   ├── claude/               # Claude AI (Backend)
│   ├── gemini/               # Gemini AI (Frontend)
│   ├── codex/                # Codex AI (Testing)
│   ├── shared/               # Shared resources
│   └── status/               # Progress tracking
└── peoplehub-app/            # Next.js application
    ├── src/
    │   ├── app/              # Pages & API routes
    │   ├── components/       # React components
    │   ├── services/         # Business logic
    │   ├── lib/              # Utilities
    │   ├── hooks/            # Custom hooks
    │   └── types/            # TypeScript types
    ├── prisma/               # Database schema
    ├── public/               # Static assets
    └── tests/                # Test files
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Development Setup

```bash
# 1. Navigate to app directory
cd peoplehub-app

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# 4. Setup database
npx prisma db push
npx prisma db seed

# 5. Start development server
npm run dev

# Open http://localhost:3001
```

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| hrd@demo.com | Set via `SEED_DEFAULT_PASSWORD` | HRD |
| manager@demo.com | Set via `SEED_DEFAULT_PASSWORD` | MANAGER |
| employee@demo.com | Set via `SEED_DEFAULT_PASSWORD` | EMPLOYEE |
| finance@demo.com | Set via `SEED_DEFAULT_PASSWORD` | FINANCE |
| it@demo.com | Set via `SEED_DEFAULT_PASSWORD` | IT_OPS |

---

## Documentation

| Section | Description | Link |
|---------|-------------|------|
| Technical Docs | Complete technical documentation | [docs/README.md](docs/README.md) |
| AI Collaboration | Guide for 3-AI development | [.ai/README.md](.ai/README.md) |
| API Reference | REST API specification | [docs/04-api/specification.md](docs/04-api/specification.md) |
| Design System | UI components & patterns | [docs/05-frontend/design-system.md](docs/05-frontend/design-system.md) |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL, Prisma ORM 7 |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Testing | Jest, Testing Library |
| PWA | Service Workers |

---

## Development Team

### AI Collaboration

Proyek ini dikembangkan dengan 3 AI assistant:

| AI | Role | Domain |
|----|------|--------|
| **Claude** | Backend Lead | API, Services, Business Logic |
| **Gemini/Antigravity** | Frontend Lead | UI/UX, Components, Pages |
| **Codex** | Testing/Infra | Tests, Documentation, PWA |

**Coordination:** See [.ai/README.md](.ai/README.md)

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Auth, Basic Dashboard, DB Schema |
| Phase 2-3 | ✅ Complete | Services (Email, Ticket, Webhook, etc) |
| Phase 4 | 🔄 In Progress | Registration, Attendance, Dashboard per Role |

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:seed      # Seed demo data
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run test         # Run tests
```

---

## Contributing

1. Check [.ai/shared/TASK-DIVISION.md](.ai/shared/TASK-DIVISION.md) for available tasks
2. Follow [.ai/shared/CONVENTIONS.md](.ai/shared/CONVENTIONS.md) for coding standards
3. Update [.ai/shared/SYNC-LOG.md](.ai/shared/SYNC-LOG.md) after completing tasks

---

## License

Proprietary - PT Kreatifindo

---

**Version:** 2.0.0
**Last Updated:** 2026-01-19
