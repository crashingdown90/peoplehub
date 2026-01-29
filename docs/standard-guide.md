# PeopleHub Standard Guide

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Draft

## Tujuan

Dokumen ini mendefinisikan standar penamaan, struktur, dan konvensi yang harus diikuti oleh seluruh tim pengembang PeopleHub untuk menjaga **konsistensi** dan **maintainability** proyek.

---

## 1. Naming Conventions

### 1.1 File & Folder Naming

| Konteks | Format | Contoh | Anti-Pattern |
|---------|--------|--------|--------------|
| **Dokumen** | `kebab-case.md` | `user-stories.md`, `api-spec.md` | `User Stories.md`, `api_spec.md` |
| **Folder** | `kebab-case` atau `number-prefix` | `01-overview/`, `components/` | `01 Overview/`, `Components/` |
| **Component (React)** | `PascalCase.tsx` | `UserProfile.tsx`, `LeaveModal.tsx` | `userProfile.tsx`, `leave-modal.tsx` |
| **Hook** | `use{Name}.ts` | `useAuth.ts`, `useLeave.ts` | `auth-hook.ts`, `UseAuth.ts` |
| **Utility** | `camelCase.ts` | `formatDate.ts`, `apiClient.ts` | `FormatDate.ts`, `format-date.ts` |
| **Test** | `{name}.test.ts(x)` | `Button.test.tsx`, `api.test.ts` | `button-test.tsx`, `ButtonSpec.tsx` |
| **Config** | `kebab-case.config.ts` | `next.config.ts`, `jest.config.js` | `NextConfig.ts`, `jestConfig.js` |

### 1.2 Variable & Function Naming

| Konteks | Format | Contoh |
|---------|--------|--------|
| **Variables** | `camelCase` | `firstName`, `totalDays`, `isActive` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| **Functions** | `camelCase` (verb first) | `handleSubmit()`, `calculateTotal()` |
| **Boolean** | `is/has/can/should` prefix | `isLoading`, `hasPermission`, `canEdit` |
| **Handlers** | `handle{Event}` | `handleClick`, `handleSubmit` |
| **Callback Props** | `on{Event}` | `onClick`, `onSubmit`, `onChange` |

### 1.3 Database Naming (PostgreSQL/Prisma)

| Konteks | Format | Contoh |
|---------|--------|--------|
| **Table** | `snake_case`, singular | `employee`, `leave_request`, `audit_log` |
| **Column** | `snake_case` | `first_name`, `created_at`, `tenant_id` |
| **Primary Key** | `id` (UUID) | `id` |
| **Foreign Key** | `{table_name}_id` | `employee_id`, `tenant_id` |
| **Timestamp** | `{action}_at` | `created_at`, `updated_at`, `deleted_at` |
| **Boolean** | `is_{adj}` atau `has_{noun}` | `is_active`, `has_verified` |
| **Index** | `idx_{table}_{column(s)}` | `idx_employee_tenant_id` |

### 1.4 API Naming

| Konteks | Format | Contoh |
|---------|--------|--------|
| **Endpoint** | `kebab-case`, REST nouns | `/leave-requests`, `/attendance-corrections` |
| **Query Params** | `snake_case` | `?start_date=&end_date=&page=` |
| **Request/Response** | `snake_case` | `{ "employee_id": "uuid" }` |
| **Error Codes** | `SCREAMING_SNAKE_CASE` | `VALIDATION_ERROR`, `NOT_FOUND` |

---

## 2. Folder Structure

### 2.1 Documentation (`/docs`)

```
docs/
├── 01-overview/           # Konsep & visi produk
├── 02-requirements/       # User stories, roles, specs
├── 03-architecture/       # HLD, LLD, ERD
├── 04-api/                # API specification & flows
├── 05-frontend/           # UI guidelines, design system
├── 06-database/           # Database guidelines
├── 07-operations/         # Deployment, security
├── 08-testing/            # Test strategy & plans
├── 09-templates/          # Email, letters, SOP templates
├── 10-gap-analysis/       # Gap analysis reports
├── 11-implementation/     # Roadmap, sprint progress
├── CHANGELOG.md
├── README.md
└── standard-guide.md      # This document
```

### 2.2 Application (`/peoplehub-app/src`)

```
src/
├── app/                   # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components (Button, Input, Card)
│   └── features/          # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, helpers, configs
├── services/              # API service functions
├── stores/                # State management (Zustand)
├── types/                 # TypeScript type definitions
└── styles/                # Global CSS, design tokens
```

### 2.3 AI Agent Rules (`/.agent/rules`)

```
.agent/rules/
├── 01-doc-req.md          # Requirement Analyst
├── 02-doc-arch.md         # System Architect
├── 03-doc-api.md          # API Expert
├── ...
├── 14-prod-back.md        # Backend Engineer
├── 15-prod-front.md       # Frontend Engineer
└── ...
```

**Konvensi**:
- Format: `{number}-{category}-{role}.md`
- Categories: `doc` (documentation), `prod` (production)
- Tidak boleh ada spasi dalam nama file

---

## 3. Documentation Format

### 3.1 Markdown Standard

Setiap dokumen teknis harus memiliki:

```markdown
# Judul Dokumen

> **Versi:** X.Y | **Tanggal Update:** DD Month YYYY | **Status:** Draft/Final

## Tujuan
[Deskripsi singkat tujuan dokumen]

---

## Section 1
...

## Section 2
...

---

## Dokumen Terkait
- [related-doc.md](path/to/related-doc.md) - Deskripsi
```

### 3.2 Versioning

| Status | Kapan Digunakan |
|--------|-----------------|
| **Draft** | Masih dalam pengembangan, belum direview |
| **Review** | Sedang direview oleh stakeholder |
| **Final** | Sudah diapprove dan siap digunakan |
| **Deprecated** | Tidak lagi berlaku, ada dokumen pengganti |

### 3.3 Naming Conventions untuk Sections

- Gunakan **Title Case** untuk heading level 1-2
- Gunakan **Sentence case** untuk heading level 3+
- Hindari special characters di headings

---

## 4. Code Style Guidelines

### 4.1 TypeScript

```typescript
// ✓ Interface dengan prefix I TIDAK dipakai
interface User {
  id: string;
  email: string;
  fullName: string;
}

// ✓ Type alias untuk unions
type Status = 'pending' | 'approved' | 'rejected';

// ✓ Enum dengan PascalCase values
enum UserRole {
  Employee = 'employee',
  Manager = 'manager',
  Hrd = 'hrd'
}
```

### 4.2 React Components

```tsx
// ✓ Function component dengan explicit return type
interface Props {
  title: string;
  onClose: () => void;
}

export function Modal({ title, onClose }: Props): JSX.Element {
  return (
    <div className="modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### 4.3 Imports Order

```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 4. Types
import type { User } from '@/types/user';

// 5. Relative imports
import { formatDate } from './utils';
```

---

## 5. Git Conventions

### 5.1 Branch Naming

| Tipe | Format | Contoh |
|------|--------|--------|
| Feature | `feature/{ticket}-{description}` | `feature/PH-123-leave-request` |
| Bugfix | `bugfix/{ticket}-{description}` | `bugfix/PH-456-fix-clock-in` |
| Hotfix | `hotfix/{version}-{description}` | `hotfix/v1.0.1-security-patch` |
| Release | `release/{version}` | `release/v1.0.0` |

### 5.2 Commit Message

Format: `{type}({scope}): {subject}`

| Type | Penggunaan |
|------|------------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Dokumentasi |
| `style` | Formatting (tidak mengubah logic) |
| `refactor` | Refactoring code |
| `test` | Menambah/update tests |
| `chore` | Maintenance tasks |

**Contoh:**
```
feat(attendance): add clock-in with selfie
fix(leave): correct balance calculation
docs(api): update authentication flow
```

---

## 6. Version Format

### 6.1 Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

| Component | Kapan Increment |
|-----------|-----------------|
| **MAJOR** | Breaking changes, tidak backward compatible |
| **MINOR** | Fitur baru, backward compatible |
| **PATCH** | Bug fixes, backward compatible |

### 6.2 Document Versioning

Format: `X.Y` (tanpa PATCH)
- `X` = Major revision
- `Y` = Minor update

---

## 7. Environment Variables

### Format

```env
# Format: SCOPE_CATEGORY_NAME
DATABASE_URL=
DATABASE_HOST=
DATABASE_PORT=

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_NAME=

AUTH_JWT_SECRET=
AUTH_REFRESH_SECRET=

SMTP_HOST=
SMTP_PORT=
```

### Penamaan

| Prefix | Penggunaan |
|--------|------------|
| `NEXT_PUBLIC_` | Exposed ke browser |
| `DATABASE_` | Database config |
| `AUTH_` | Authentication |
| `SMTP_` | Email service |
| `STORAGE_` | File storage |

---

## Dokumen Terkait

- [glossary.md](01-overview/glossary.md) - Terminologi proyek
- [design-system.md](05-frontend/design-system.md) - Design tokens & components
- [database guidelines.md](06-database/guidelines.md) - Database conventions
- [api specification.md](04-api/specification.md) - API standards
