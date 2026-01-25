# Code Review Report: PeopleHub HRIS System

> **Tanggal Review:** 23 Januari 2026 | **Reviewer:** Senior Code Reviewer | **Status:** Final

## Ringkasan Eksekutif

Sebagai Senior Code Reviewer, saya telah melakukan review menyeluruh terhadap codebase PeopleHub HRIS. Review ini fokus pada: **bug**, **keamanan**, **maintainability**, dan **kepatuhan terhadap standar proyek**.

**STATUS KESELURUHAN: ⚠️ PASSED WITH RECOMMENDATIONS**

### Statistik Review

| Kategori | Jumlah Issue |
|----------|-------------|
| 🔴 Critical (Security/Bug) | 2 |
| 🟠 High (Potential Bug/Security) | 5 |
| 🟡 Medium (Maintainability) | 8 |
| 🟢 Low (Code Quality) | 12 |

---

## 1. Issue List dengan Severity

### 🔴 CRITICAL Issues

#### CR-001: In-Memory Rate Limiting Not Production-Safe
**File:** [middleware.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/middleware.ts#L47)
**Severity:** CRITICAL
**Type:** Security / Scalability

**Temuan:**
```typescript
// Line 47
const rateLimitStore = new Map<string, RateLimitEntry>();
```

In-memory rate limiting tidak cocok untuk production dengan multiple instances (load balancer). Setiap instance memiliki store terpisah, sehingga attacker bisa bypass rate limit dengan switching antar instances.

**Risiko:**
- Brute force attack pada login endpoint
- DDoS tidak ter-mitigasi dengan benar
- Rate limit bypass pada distributed deployment

**Rekomendasi:**
```typescript
// Gunakan Redis untuk production
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.pexpire(key, config.windowMs);
  }
  // ... rest of implementation
}
```

---

#### CR-002: JWT Signature Comparison Not Timing-Safe
**File:** [edge-jwt.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/lib/auth/edge-jwt.ts#L71-L81)
**Severity:** CRITICAL
**Type:** Security (Timing Attack Vulnerability)

**Temuan:**
```typescript
// Lines 71-81 - Non-constant-time comparison
for (let i = 0; i < actualSignature.length; i++) {
  if (actualSignature[i] !== expectedSignature[i]) {
    return false;
  }
}
```

Perbandingan byte-by-byte dengan early return rentan terhadap timing attack. Attacker dapat mengukur response time untuk menebak signature byte demi byte.

**Risiko:**
- Token forgery melalui timing attack
- Authentication bypass

**Rekomendasi:**
```typescript
// Gunakan constant-time comparison
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

---

### 🟠 HIGH Issues

#### CR-003: Unvalidated File Upload Path
**File:** [clock-in/route.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/app/api/attendance/clock-in/route.ts#L64-L70)
**Severity:** HIGH
**Type:** Security (Path Traversal Risk)

**Temuan:**
```typescript
// Lines 64-70
const filename = `clockin_${context.employeeId}_${Date.now()}${path.extname(photo.name) || ".jpg"}`;
const uploadDir = path.join(process.cwd(), "public", "uploads", "attendance");
await writeFile(path.join(uploadDir, filename), buffer);
```

`photo.name` dari user input tidak di-sanitize. Jika extension berisi `/../`, bisa terjadi path traversal.

**Risiko:**
- File overwrite di directory lain
- Potential code execution jika overwrite critical files

**Rekomendasi:**
```typescript
import { sanitizeFileName } from '@/lib/security/sanitize';

const ext = path.extname(photo.name).replace(/[^a-zA-Z0-9.]/g, '') || '.jpg';
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
if (!allowedExtensions.includes(ext.toLowerCase())) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}
const filename = `clockin_${context.employeeId}_${Date.now()}${ext}`;
```

---

#### CR-004: Missing Tenant ID Validation in LeaveBalance Update
**File:** [leave.service.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/services/leave/leave.service.ts#L287-L297)
**Severity:** HIGH
**Type:** Security (Data Integrity)

**Temuan:**
```typescript
// Lines 287-297 - Missing tenantId in updateMany where clause
await prisma.leaveBalance.updateMany({
  where: {
    employeeId: request.employeeId,
    leaveTypeId: request.leaveTypeId,
    year: request.startDate.getFullYear(),
  },
  data: { /* ... */ },
});
```

`updateMany` tidak menyertakan `tenantId`, berpotensi mengupdate data tenant lain jika `employeeId` collision terjadi.

**Rekomendasi:**
```typescript
await prisma.leaveBalance.updateMany({
  where: {
    tenantId: context.tenantId, // ADD THIS
    employeeId: request.employeeId,
    leaveTypeId: request.leaveTypeId,
    year: request.startDate.getFullYear(),
  },
  // ...
});
```

---

#### CR-005: setInterval in Middleware Causes Memory Leak
**File:** [middleware.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/middleware.ts#L105-L112)
**Severity:** HIGH
**Type:** Bug (Memory Leak)

**Temuan:**
```typescript
// Lines 105-112
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
```

`setInterval` di top-level module akan membuat banyak interval jika middleware di-hot-reload (development) atau jika ada multiple workers.

**Rekomendasi:**
- Pindahkan ke separate rate-limit module dengan proper cleanup
- Atau gunakan lazy cleanup saat check (sudah ada di line 82-85)

---

#### CR-006: Error Message Leaks Internal Information
**File:** [login/route.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/app/api/auth/login/route.ts#L176-L178)
**Severity:** HIGH
**Type:** Security (Information Disclosure)

**Temuan:**
```typescript
console.error("Login error:", error);
console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
```

Meskipun tidak di-return ke user, logging error stack di production bisa expose sensitive info jika log aggregator tidak secured.

**Rekomendasi:**
```typescript
// Use structured logging dengan masking
logger.error('Login failed', {
  errorType: error instanceof Error ? error.name : 'Unknown',
  // Jangan log stack trace di production
});
```

---

#### CR-007: API Client Retry Logic Issue
**File:** [api-client.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/lib/api-client.ts#L110-L114)
**Severity:** HIGH
**Type:** Bug (Infinite Retry Risk)

**Temuan:**
```typescript
// Lines 110-114
if (retry && options.method === 'GET') {
  return this.retryRequest<T>(url, options);
}
```

`retryRequest` memanggil `executeRequest` dengan `{ ...options, retry: false }`, tapi original `options` tidak punya `method` yang pasti `GET`. Ini bisa menyebabkan retry tidak terjadi saat seharusnya.

**Rekomendasi:**
```typescript
if (retry && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
  return this.retryRequest<T>(url, { ...options, method: 'GET' });
}
```

---

### 🟡 MEDIUM Issues

#### CR-008: Excessive Use of `any` Type
**Files:** Multiple
**Severity:** MEDIUM
**Type:** Maintainability / Type Safety

**Temuan ESLint:**
- `api-client.ts`: 6 instances of `@typescript-eslint/no-explicit-any`
- `validation.ts`: 6 instances of `@typescript-eslint/no-explicit-any`
- `pwa.ts`: 1 instance

**Rekomendasi:**
Ganti `any` dengan proper types atau `unknown` dengan type guards.

---

#### CR-009: Unused Variables & Imports
**Files:** Multiple API routes
**Severity:** MEDIUM
**Type:** Code Quality

**Temuan ESLint:**
```
/api/admin/onboarding/stats/route.ts - 'request' is defined but never used
/api/admin/registrations/stats/route.ts - 'groupBy' is assigned but never used
/api/leave/requests/[id]/route.ts - 'requireRole' is defined but never used
... (total 17 warnings)
```

**Rekomendasi:**
- Run `npm run lint:fix` untuk auto-fix
- Prefix unused params dengan `_` jika memang perlu

---

#### CR-010: Missing Database Transaction for Balance Deduction
**File:** [leave.service.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/services/leave/leave.service.ts#L287-L306)
**Severity:** MEDIUM
**Type:** Data Integrity

**Temuan:**
`approveByHrd` melakukan 2 operasi terpisah (updateMany balance, update request status) tanpa transaction. Jika salah satu gagal, data bisa inconsistent.

**Rekomendasi:**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.leaveBalance.updateMany({ /* ... */ });
  await tx.leaveRequest.update({ /* ... */ });
});
```

---

#### CR-011: Hardcoded Cookie Max Age
**File:** [edge-jwt.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/lib/auth/edge-jwt.ts#L132)
**Severity:** MEDIUM
**Type:** Configuration

**Temuan:**
```typescript
cookieMaxAge: 60 * 60 * 24, // 1 day in seconds
```

Hardcoded tidak sesuai env. JWT expiry dan cookie expiry harus sinkron dari environment variable.

---

#### CR-012: State Update in useEffect
**File:** [pwa.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/lib/pwa.ts#L13)
**Severity:** MEDIUM
**Type:** Performance (React Anti-pattern)

**Temuan ESLint:**
```
Error: Calling setState synchronously within an effect can trigger cascading renders
```

**Rekomendasi:**
Pindahkan initial state ke lazy initializer atau gunakan `useSyncExternalStore`.

---

#### CR-013: Missing `const` Declaration
**File:** [hrd/attendance-stats/route.ts](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/app/api/dashboard/hrd/attendance-stats/route.ts#L35)
**Severity:** MEDIUM
**Type:** Code Quality

**Temuan ESLint:**
```
'endDate' is never reassigned. Use 'const' instead - prefer-const
```

---

#### CR-014: Inconsistent Error Code Naming
**Files:** Various services
**Severity:** MEDIUM
**Type:** Maintainability

**Temuan:**
Error codes tidak konsisten antara services:
- `ErrorCodes.ALREADY_CLOCKED_IN` (attendance)
- `ErrorCodes.CONFLICT` (leave)
- `ErrorCodes.CANNOT_MODIFY` (leave)

**Rekomendasi:**
Standardize error codes sesuai API specification.

---

#### CR-015: Documentation Mismatch (Jest vs Vitest)
**File:** docs/08-testing/strategy.md
**Severity:** MEDIUM
**Type:** Documentation

**Temuan:**
Dokumen strategi testing merekomendasikan Vitest, tapi `package.json` menggunakan Jest.

---

### 🟢 LOW Issues

#### CR-016 - CR-027: Minor Code Quality Issues

| ID | File | Issue | Recommendation |
|----|------|-------|----------------|
| CR-016 | `validation.ts` | Age calculation simplistic | Use `date-fns` differenceInYears |
| CR-017 | `attendance.service.ts` | Magic number 500 (default radius) | Use constant |
| CR-018 | `leave.service.ts` | Unused `notes` parameter (eslint-disable) | Remove or implement |
| CR-019 | Multiple | Console.error without structured logging | Use proper logger |
| CR-020 | `sanitize.ts` | Basic XSS protection only | Consider DOMPurify for rich text |
| CR-021 | `hooks/useAuth.ts` | No error boundary | Add try-catch in fetchSession |
| CR-022 | Schema | Some tables missing `deletedAt` | Add soft delete consistently |
| CR-023 | API routes | Inconsistent response structure | Standardize meta field |
| CR-024 | `api-client.ts` | IndexedDB not closed after use | Add db.close() |
| CR-025 | Middleware | IP fallback to "127.0.0.1" | Use "unknown" for clarity |
| CR-026 | `tenant/utils.ts` | Manager team check simplified | Add proper subordinate lookup |
| CR-027 | Tests | Some happy-path only tests | Add negative test cases |

---

## 2. Review Notes

### ✅ Positive Findings

1. **Tenant Isolation Architecture**: Implementasi `withTenant()` helper sangat baik untuk mencegah data leakage antar tenant.

2. **Security Tests**: Sudah ada test suite `tests/security/tenant-isolation.test.ts` dan `tests/security/attendance-leave-isolation.test.ts` yang memverifikasi isolasi data.

3. **Input Validation**: Menggunakan Zod untuk validasi input - best practice.

4. **Audit Logging**: Semua operasi penting di-log ke `AuditLog` table.

5. **Rate Limiting Structure**: Meskipun implementasi in-memory, architecturenya sudah siap untuk Redis.

6. **Sanitization Module**: `lib/security/sanitize.ts` comprehensive untuk various input types.

7. **Role-Based Access Control**: Middleware dan context checking sudah solid.

---

## 3. Refactor Recommendations

### Priority 1: Security Fixes (Sprint ini)

1. **Implement Redis Rate Limiting**
   - Effort: 2 story points
   - Risk Reduction: HIGH

2. **Fix Timing-Safe JWT Comparison**
   - Effort: 1 story point
   - Risk Reduction: CRITICAL

3. **Add tenantId to All UpdateMany Operations**
   - Effort: 2 story points
   - Audit semua service files

### Priority 2: Bug Fixes (Sprint berikutnya)

4. **Wrap Multi-Step Operations in Transactions**
   - Effort: 3 story points

5. **Fix File Upload Path Sanitization**
   - Effort: 1 story point

### Priority 3: Code Quality (Ongoing)

6. **Replace `any` Types**
   - Effort: 3 story points

7. **Fix ESLint Warnings**
   - Effort: 1 story point (mostly auto-fixable)

8. **Update Documentation (Jest)**
   - Effort: 0.5 story points

---

## 4. Ready-for-Production Checklist

| Kriteria | Status | Notes |
|----------|--------|-------|
| Authentication Security | ⚠️ | Fix timing-safe comparison |
| Authorization (RBAC) | ✅ | Solid implementation |
| Tenant Isolation | ⚠️ | Fix updateMany queries |
| Input Validation | ✅ | Zod + custom validation |
| SQL Injection Prevention | ✅ | Prisma handles this |
| XSS Prevention | ✅ | Sanitization in place |
| Rate Limiting | ⚠️ | Needs Redis for production |
| Error Handling | ✅ | Consistent format |
| Logging/Audit | ✅ | Comprehensive |
| Unit Test Coverage | ✅ | Good security tests |
| E2E Test Coverage | ⚠️ | Perlu ditambah |
| Documentation Accuracy | ⚠️ | Jest vs Vitest discrepancy |

---

## 5. Conclusion

Codebase PeopleHub secara keseluruhan **berkualitas baik** dengan arsitektur yang solid. Namun, ada **2 issue CRITICAL** yang harus diperbaiki sebelum production:

1. **Timing-safe JWT comparison**
2. **Production-ready rate limiting**

Dan **5 issue HIGH** yang sangat direkomendasikan untuk segera ditangani.

---

**Approval Status:** ⚠️ **CONDITIONAL APPROVAL**

Kode dapat dilanjutkan ke staging setelah issue CRITICAL diperbaiki. Production deployment memerlukan penanganan semua issue HIGH.

---

**Reviewer Signature:**
Senior Code Reviewer
23 Januari 2026
