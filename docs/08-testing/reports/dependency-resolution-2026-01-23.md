# Dependency Resolution Notes - PeopleHub

> **Tanggal:** 23 Januari 2026 | **Role:** Integration Engineer

---

## 1. Runtime Dependencies

### 1.1 Core Dependencies

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 15.x | Framework | ✅ Compatible |
| Prisma | 6.x | ORM | ✅ Compatible |
| React | 19.x | UI Library | ✅ Compatible |
| TypeScript | 5.x | Language | ✅ Compatible |

### 1.2 Service Dependencies

```
Authentication
└── JWT (jsonwebtoken)
    └── Cookie handling (next/headers)

Database
└── Prisma Client
    └── PostgreSQL driver

Email
└── Nodemailer
    └── SMTP configuration

File Storage
└── Local/Cloud storage abstraction
```

---

## 2. Module Dependencies

### 2.1 Core Services

```typescript
// Dependency order for initialization
1. Database (Prisma) - No dependencies
2. Auth Service - Depends on: Database
3. User Service - Depends on: Database, Auth
4. Employee Service - Depends on: User Service
5. Attendance Service - Depends on: Employee Service
6. Leave Service - Depends on: Employee, Approval
7. Dashboard Service - Depends on: All above
```

### 2.2 Circular Dependency Prevention

| Scenario | Resolution |
|----------|------------|
| User ↔ Employee | One-way reference via userId |
| Leave ↔ Approval | Leave creates, Approval updates |
| Notification ↔ All | Event-driven, no direct coupling |

---

## 3. Test Dependencies

### 3.1 Mock Setup

```
tests/mocks/
├── prisma.ts       → Centralized Prisma mock
├── auth.ts         → Auth context mock
├── request.ts      → HTTP request mock
├── email.ts        → Email service mock
└── storage.ts      → File storage mock
```

### 3.2 Test Isolation

- Setiap test suite menggunakan `resetPrismaMock()` di `beforeEach`
- Mock didefinisikan sebelum `jest.mock()` untuk hoisting
- Tidak ada shared state antar test suites

---

## 4. Configuration Dependencies

### 4.1 Environment Variables

```bash
# Required for all modules
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Required for Email
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Required for File Storage
STORAGE_TYPE=local|s3
S3_BUCKET=...
```

### 4.2 Configuration Load Order

```
1. .env (base)
2. .env.local (overrides)
3. Environment variables (runtime overrides)
```

---

## 5. Build Dependencies

### 5.1 TypeScript Compilation

```
tsconfig.json
├── paths: @/* → src/*
├── strict: true
└── target: ES2022
```

### 5.2 Build Order

```
1. Prisma generate (types)
2. TypeScript compile
3. Next.js build
```

---

## 6. Resolution Notes

### 6.1 Resolved Conflicts

| Conflict | Resolution |
|----------|------------|
| Prisma types outdated | Run `npx prisma generate` after schema changes |
| Jest mock hoisting | Define mocks before `jest.mock()` calls |
| ESM/CJS compatibility | Use Next.js built-in handling |

### 6.2 Best Practices Applied

1. **Dependency Injection** - Services receive dependencies via constructor/params
2. **Interface Segregation** - Services expose minimal interface
3. **Single Responsibility** - Each service handles one domain
4. **Explicit Dependencies** - No hidden global state

---

## 7. Recommendations

### 7.1 For Future Development

1. Consider dependency injection container (e.g., tsyringe) for complex scenarios
2. Document breaking changes in CHANGELOG.md
3. Run `npm audit` regularly for security updates

### 7.2 For Deployment

1. Verify all environment variables are set
2. Run `npx prisma migrate deploy` before startup
3. Ensure PostgreSQL connection pool is configured correctly

---

**Document By:**  
Integration Engineer  
23 Januari 2026
