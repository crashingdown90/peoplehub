# Getting Started - PeopleHub

> Panduan cepat untuk developer baru dalam setup dan menjalankan PeopleHub.

---

## Prerequisites

Pastikan sistem Anda memiliki:

| Software | Versi Minimum | Cek Versi |
|----------|---------------|-----------|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| PostgreSQL | 15.x | `psql --version` |
| Git | Latest | `git --version` |

### Opsional
- **pnpm** - Package manager lebih cepat (`npm install -g pnpm`)
- **Redis** - Untuk caching (development bisa tanpa Redis)

---

## Quick Start (5 Menit)

### 1. Clone Repository

```bash
git clone git@github.com:kreatifindo/peoplehub.git
cd peoplehub/peoplehub-app
```

### 2. Install Dependencies

```bash
npm install
# atau dengan pnpm
pnpm install
```

### 3. Setup Environment

```bash
# Copy template environment
cp .env.example .env.local

# Edit konfigurasi database
nano .env.local
```

**Konfigurasi minimal `.env.local`:**

```env
# Database (wajib)
DATABASE_URL="postgresql://postgres:password@localhost:5432/peoplehub_dev"

# Auth (wajib)
JWT_SECRET="your-secret-key-min-32-characters-here"
JWT_EXPIRES_IN="7d"

# App
NODE_ENV="development"
APP_URL="http://localhost:3001"
```

### 4. Setup Database

```bash
# Pastikan PostgreSQL running
# Mac: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Buat database
createdb peoplehub_dev

# Generate Prisma client
npx prisma generate

# Jalankan migrasi
npx prisma db push

# Seed data demo
npx prisma db seed
```

### 5. Jalankan Development Server

```bash
npm run dev
```

🎉 **Buka browser:** http://localhost:3001

---

## Verifikasi Setup

Setelah server berjalan, verifikasi dengan checklist berikut:

| Check | URL/Command | Expected |
|-------|-------------|----------|
| ✅ Homepage | http://localhost:3001 | Tampil halaman login |
| ✅ API Health | http://localhost:3001/api/health | `{"status":"ok"}` |
| ✅ Prisma Studio | `npx prisma studio` | Database browser terbuka |

---

## Demo Users

Gunakan akun demo untuk testing:

| Email | Password | Role | Akses |
|-------|----------|------|-------|
| hrd@demo.com | Set via `SEED_DEFAULT_PASSWORD` | HRD | Full access HR |
| manager@demo.com | Set via `SEED_DEFAULT_PASSWORD` | MANAGER | Tim approval |
| employee@demo.com | Set via `SEED_DEFAULT_PASSWORD` | EMPLOYEE | Self-service |
| finance@demo.com | Set via `SEED_DEFAULT_PASSWORD` | FINANCE | Payroll |
| it@demo.com | Set via `SEED_DEFAULT_PASSWORD` | IT_OPS | System admin |

---

## Struktur Project

```
peoplehub-app/
├── src/
│   ├── app/              # Next.js App Router (pages & API)
│   │   ├── (auth)/       # Auth pages (login, register)
│   │   ├── (dashboard)/  # Protected dashboard pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # Base UI components
│   │   └── features/     # Feature-specific components
│   ├── services/         # Business logic & API clients
│   ├── lib/              # Utilities & helpers
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── public/               # Static assets
└── tests/                # Test files
```

---

## Script yang Tersedia

```bash
# Development
npm run dev          # Start dev server (port 3001)
npm run build        # Build production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema ke database
npm run db:seed      # Seed demo data
npm run db:studio    # Buka Prisma Studio
npm run db:migrate   # Jalankan migrasi

# Testing
npm run test         # Jalankan semua tests
npm run test:watch   # Watch mode
npm run test:e2e     # End-to-end tests
```

---

## Workflow Development

### 1. Buat Branch Baru

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur
```

### 2. Development

```bash
npm run dev  # Server auto-reload
```

### 3. Sebelum Commit

```bash
npm run lint        # Fix lint errors
npm run type-check  # Fix type errors
npm run test        # Pastikan tests pass
```

### 4. Commit & Push

```bash
git add .
git commit -m "feat: deskripsi singkat"
git push origin feature/nama-fitur
```

### 5. Create Pull Request

- Target branch: `develop`
- Request review minimal 1 orang
- Pastikan CI checks pass

---

## Dokumentasi Lanjutan

| Topik | Dokumen |
|-------|---------|
| Konsep & Visi | [docs/01-overview/concept.md](01-overview/concept.md) |
| Arsitektur | [docs/03-architecture/hld.md](03-architecture/hld.md) |
| API Specification | [docs/04-api/specification.md](04-api/specification.md) |
| Frontend Guidelines | [docs/05-frontend/guidelines.md](05-frontend/guidelines.md) |
| Database Guidelines | [docs/06-database/guidelines.md](06-database/guidelines.md) |
| Deployment | [docs/07-operations/deployment.md](07-operations/deployment.md) |
| Troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |

---

## Butuh Bantuan?

1. Cek [TROUBLESHOOTING.md](TROUBLESHOOTING.md) untuk error umum
2. Baca dokumentasi di folder `docs/`
3. Tanya di channel #dev-peoplehub
4. Buat ticket jika menemukan bug

---

**Version:** 1.0 | **Last Updated:** 23 Januari 2026
