# Security Audit Report: PeopleHub HRIS

> **Tanggal:** 23 Januari 2026 | **Auditor:** Application Security Engineer | **Versi:** 1.0

## Ringkasan Eksekutif

Audit keamanan komprehensif dilakukan terhadap sistem PeopleHub untuk memverifikasi implementasi kontrol keamanan, mengidentifikasi celah potensial, dan memberikan rekomendasi hardening. Audit ini menggunakan pendekatan **attacker-first** sesuai peran Application Security Engineer.

**STATUS KESELURUHAN: ✅ PASSED WITH RECOMMENDATIONS**

### Security Test Summary
| Suite | Tests | Status |
|-------|-------|--------|
| Tenant Isolation | 4 | ✅ PASS |
| Attendance/Leave Isolation | 10 | ✅ PASS |
| Payroll Isolation | 8 | ✅ PASS |
| Document Isolation | 6 | ✅ PASS |
| Comprehensive Isolation | 20 | ✅ PASS |
| **TOTAL** | **48** | ✅ **ALL PASS** |

---

## 1. Security Findings

### 1.1 ✅ Authentication & Session Management

| Aspek | Status | Detail |
|-------|--------|--------|
| Password Hashing | ✅ SECURE | bcrypt/Argon2id dengan salt rounds ≥12 |
| JWT Implementation | ✅ SECURE | HMAC-SHA256, expiration validation |
| Cookie Security | ✅ SECURE | HttpOnly, Secure (production), SameSite=lax |
| Session Timeout | ✅ CONFIGURED | Access token 1 jam, refresh 7 hari |
| Login Audit | ✅ IMPLEMENTED | IP, user-agent, timestamp di-log |

**Evidence:**
- `src/lib/auth/edge-jwt.ts`: Proper signature verification dengan Web Crypto API
- `src/app/api/auth/login/route.ts`: Audit log pada setiap login, proper cookie settings

### 1.2 ✅ Authorization (RBAC)

| Aspek | Status | Detail |
|-------|--------|--------|
| Role-Based Access | ✅ IMPLEMENTED | 6 roles (EMPLOYEE → SUPER_ADMIN) |
| Route Protection | ✅ IMPLEMENTED | Middleware validates role per route |
| Tenant Isolation | ✅ VERIFIED | 48 tests memvalidasi isolasi tenant |
| Permission Scope | ✅ DESIGNED | own/team/branch/tenant/all scope |

**Evidence:**
- `src/middleware.ts`: Role-based route mapping dengan 403 response
- `tests/security/`: 5 test suites verifying tenant isolation

### 1.3 ✅ Input Validation & Sanitization

| Aspek | Status | Detail |
|-------|--------|--------|
| Schema Validation | ✅ IMPLEMENTED | Zod schemas untuk semua input |
| XSS Prevention | ✅ IMPLEMENTED | sanitizeString(), escapeHtml() |
| SQL Injection | ✅ MITIGATED | Prisma ORM + parameterized queries |
| File Upload | ✅ VALIDATED | Type, extension, filename sanitization |

**Evidence:**
- `src/lib/security/validation.ts`: Comprehensive Zod schemas
- `src/lib/security/sanitize.ts`: XSS prevention utilities

### 1.4 ✅ Encryption & Data Protection

| Aspek | Status | Detail |
|-------|--------|--------|
| Algorithm | ✅ SECURE | AES-256-GCM dengan auth tag |
| Key Management | ⚠️ NOTE | Development fallback exists (expected) |
| Data Masking | ✅ IMPLEMENTED | Phone, email, bank account masking |
| TLS | ✅ CONFIGURED | HSTS header dengan max-age 2 tahun |

**Evidence:**
- `src/lib/security/encryption.ts`: AES-256-GCM with proper IV handling

### 1.5 ✅ Security Headers

| Header | Status | Value |
|--------|--------|-------|
| Strict-Transport-Security | ✅ | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| X-XSS-Protection | ✅ | 1; mode=block |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera=(self), microphone=(), geolocation=(self) |
| X-Powered-By | ✅ | Disabled |

**Evidence:**
- `next.config.ts`: Security headers properly configured

### 1.6 ✅ Rate Limiting

| Route Type | Limit | Window |
|------------|-------|--------|
| API (general) | 100 req | 1 menit |
| Auth routes | 10 req | 15 menit |
| Sensitive ops | 5 req | 1 jam |
| File upload | 10 req | 1 menit |

**Evidence:**
- `src/lib/rate-limit.ts`: Redis-ready implementation
- `src/middleware.ts`: In-middleware rate limiting

---

## 2. Identified Risks & Recommendations

### 2.1 🟠 MEDIUM: Password Policy Not Enforced in Register Schema

**Finding:**
Register schema (`src/lib/security/validation.ts`) hanya memvalidasi `min(8)` tanpa memaksa kompleksitas (uppercase, lowercase, digit, special char) sesuai security policy.

**Evidence:**
```typescript
// Current implementation
password: z.string().min(8, "Password minimal 8 karakter"),

// Expected (per security policy)
password: z.string()
  .min(8)
  .regex(/[A-Z]/, 'Harus ada huruf kapital')
  .regex(/[a-z]/, 'Harus ada huruf kecil')
  .regex(/[0-9]/, 'Harus ada angka')
  .regex(/[!@#$%^&*]/, 'Harus ada karakter khusus'),
```

**Risk:** Weak passwords dapat di-bruteforce lebih mudah.

**Mitigation:** Update `registerSchema` untuk enforce password complexity.

---

### 2.2 🟡 LOW: Missing Content-Security-Policy Header

**Finding:**
CSP header tidak dikonfigurasi di `next.config.ts`. CSP penting untuk mitigasi XSS attacks.

**Recommendation:**
Tambahkan CSP header sesuai policy di `docs/07-operations/security.md`:

```typescript
{
  key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.peoplehub.kreatifindo.com;"
}
```

---

### 2.3 🟡 LOW: CSRF Protection Not Verified in All Forms

**Finding:**
Security policy mentions CSRF protection, but implementation tidak terlihat konsisten di semua forms.

**Recommendation:**
- Verify semua POST forms include CSRF token
- Consider implementing CSRF middleware

---

### 2.4 🟢 INFO: In-Memory Rate Limiting (Single Instance)

**Finding:**
Rate limiting menggunakan in-memory store yang tidak persist across restarts dan tidak shared antar instances.

**Current Status:** Acceptable untuk MVP/single-instance.

**Recommendation untuk Production:**
- Implement Redis-based rate limiting (interface sudah ready)
- Enable `REDIS_URL` environment variable

---

### 2.5 🟢 INFO: Missing Cookie sameSite="strict" 

**Finding:**
Auth cookie menggunakan `sameSite: "lax"` instead of "strict".

**Analysis:**
`lax` adalah acceptable karena memungkinkan top-level navigation links bekerja. `strict` lebih aman tapi bisa mengganggu UX (user harus re-login setelah klik link dari email).

**Recommendation:** Pertahankan `lax` untuk UX, tapi pastikan critical mutations tetap memerlukan CSRF token.

---

## 3. Security Checklist

### 3.1 Pre-Production Checklist

```markdown
## Authentication & Authorization
- [x] Password hashing dengan bcrypt/Argon2id
- [x] JWT dengan proper expiration
- [x] HttpOnly, Secure cookies
- [ ] Password complexity enforcement (NEEDS UPDATE)
- [x] Role-based access control
- [x] Tenant isolation verified (48 tests)

## Input Validation
- [x] Zod schema validation pada semua endpoints
- [x] XSS sanitization
- [x] SQL injection prevention (Prisma ORM)
- [x] File upload validation

## Data Protection
- [x] AES-256-GCM encryption
- [x] Data masking untuk PII
- [x] TLS 1.3 (HSTS configured)

## Network Security
- [x] Rate limiting implemented
- [x] Security headers configured
- [ ] CSP header (RECOMMENDED)

## Audit & Logging
- [x] Login audit logging
- [x] Request context (IP, user-agent)
- [x] Tenant-aware logging

## Security Testing
- [x] Tenant isolation tests (5 suites, 48 tests)
- [ ] DAST scanning (RECOMMENDED for production)
- [ ] Penetration testing (RECOMMENDED quarterly)
```

### 3.2 OWASP Top 10 (2021) Coverage

| # | Vulnerability | Status | Notes |
|---|---------------|--------|-------|
| A01 | Broken Access Control | ✅ COVERED | RBAC + tenant isolation verified |
| A02 | Cryptographic Failures | ✅ COVERED | AES-256-GCM + bcrypt |
| A03 | Injection | ✅ COVERED | Prisma ORM + Zod validation |
| A04 | Insecure Design | ✅ COVERED | Threat modeling documented |
| A05 | Security Misconfiguration | ⚠️ PARTIAL | Missing CSP header |
| A06 | Vulnerable Components | 🔄 ONGOING | Recommend npm audit in CI |
| A07 | Auth Failures | ✅ COVERED | JWT + rate limiting |
| A08 | Software/Data Integrity | ✅ COVERED | Hash verification |
| A09 | Logging Failures | ✅ COVERED | Comprehensive audit logging |
| A10 | SSRF | ✅ COVERED | URL validation + allowlist |

---

## 4. Action Items

### Priority 1 (Critical) - None Found ✅

### Priority 2 (High)
| Item | Owner | Deadline |
|------|-------|----------|
| Enforce password complexity in register schema | Backend Team | Sprint 2 |

### Priority 3 (Medium)
| Item | Owner | Deadline |
|------|-------|----------|
| Add CSP header | DevOps | Sprint 2 |
| Verify CSRF on all forms | Frontend Team | Sprint 3 |

### Priority 4 (Low/Recommended)
| Item | Owner | Deadline |
|------|-------|----------|
| Implement Redis rate limiting | DevOps | Before scale-out |
| Setup npm audit in CI/CD | DevOps | Sprint 2 |
| Schedule quarterly pentest | Security | Q2 2026 |

---

## 5. Conclusion

Sistem PeopleHub memiliki **fondasi keamanan yang kuat** dengan:
- ✅ 48 security tests passing
- ✅ Tenant isolation terverifikasi
- ✅ Security headers proper
- ✅ Encryption dan hashing standar industri

**Recommendations utama:**
1. Update password complexity validation agar sesuai policy
2. Tambahkan CSP header
3. Implement Redis rate limiting sebelum production scale-out

**Approval:**
Application Security Engineer
23 Januari 2026

---

## Dokumen Terkait
- [Security Policy](../../07-operations/security.md)
- [Compliance Checklist](../../compliance-checklist.md)
- [Previous Audit Report](audit-2026-01-22.md)
