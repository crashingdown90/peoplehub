# Testing Strategy PeopleHub

## 1. Overview

Dokumen ini mendefinisikan strategi testing komprehensif untuk PeopleHub, memastikan kualitas aplikasi melalui berbagai level testing.

### 1.1 Tujuan Testing
- Memastikan fitur berfungsi sesuai requirement
- Mencegah regresi saat development
- Menjamin keamanan dan isolasi data tenant
- Memvalidasi performa sesuai target NFR
- Meningkatkan confidence dalam deployment

### 1.2 Testing Pyramid

```
                    ┌───────────┐
                   /   E2E      \        10%
                  /   Tests      \       (Playwright)
                 /─────────────────\
                /   Integration     \    20%
               /      Tests          \   (API, DB)
              /───────────────────────\
             /       Unit Tests        \  70%
            /          (Jest)           \
           /─────────────────────────────\
```

---

## 2. Testing Levels

### 2.1 Unit Testing

**Tools:** Jest + React Testing Library

**Coverage Target:** Minimum 80% untuk business logic

**Scope:**
- Utility functions
- Validation functions
- Data transformations
- Business logic (domain)
- Custom hooks (React)

**Naming Convention:**
```
[filename].test.ts
[filename].spec.ts
```

**Example Structure:**
```typescript
// src/lib/utils/date.ts
export function formatDate(date: Date): string { ... }

// src/lib/utils/date.test.ts
import { describe, it, expect } from '@jest/globals'
import { formatDate } from './date'

describe('formatDate', () => {
  it('should format date to dd/mm/yyyy', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('15/01/2024')
  })

  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('-')
  })
})
```

**Priority Areas:**
| Area | Priority | Contoh |
|------|----------|--------|
| Validation | High | validateLeaveRequest, validateReimburse |
| Calculations | High | calculateLatePenalty, calculateLeaveBalance |
| Formatters | Medium | formatCurrency, formatDate, formatDuration |
| Transformers | Medium | mapApiResponse, prepareFormData |
| Guards | High | canApprove, hasPermission |

### 2.2 Integration Testing

**Tools:** Jest + Supertest (API), Prisma Test Environment (DB)

**Scope:**
- API endpoints (request/response)
- Database operations (CRUD)
- Service layer interactions
- Authentication flows
- Authorization (RBAC)

**Database Strategy:**
```typescript
// Setup test database
beforeAll(async () => {
  await prisma.$connect()
  await seedTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await prisma.$disconnect()
})

// Use transactions for isolation
beforeEach(async () => {
  await prisma.$transaction(async (tx) => {
    // Test runs in transaction
  })
})
```

**API Testing Example:**
```typescript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { app } from '@/app'

describe('POST /api/leave/request', () => {
  it('should create leave request with valid data', async () => {
    const response = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'ANNUAL',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        reason: 'Family vacation'
      })

    expect(response.status).toBe(201)
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data.status).toBe('PENDING')
  })

  it('should reject if balance insufficient', async () => {
    const response = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${employeeNoBalanceToken}`)
      .send({
        type: 'ANNUAL',
        startDate: '2024-01-20',
        endDate: '2024-01-30',
        reason: 'Long vacation'
      })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE')
  })

  it('should reject unauthorized access', async () => {
    const response = await request(app)
      .post('/api/leave/request')
      .send({ /* ... */ })

    expect(response.status).toBe(401)
  })
})
```

### 2.3 End-to-End Testing

**Tools:** Playwright (preferred) atau Cypress

**Scope:**
- Critical user flows
- Cross-browser compatibility
- Mobile responsiveness
- Real user scenarios

**Configuration:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'results/e2e-results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ]
})
```

**Critical Flows to Test:**

| Flow | Priority | Scenarios |
|------|----------|-----------|
| Authentication | P0 | Login, logout, register, password reset |
| Attendance | P0 | Clock in/out, selfie capture, location |
| Leave Request | P0 | Submit, approve, reject, cancel |
| Reimburse | P1 | Submit with attachment, approval chain |
| Payslip | P1 | View, download PDF |
| KPI | P2 | View targets, update progress |

**E2E Test Example:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Leave Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'employee@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('employee can submit leave request', async ({ page }) => {
    // Navigate to leave request
    await page.click('text=Cuti')
    await page.click('text=Ajukan Cuti')

    // Fill form
    await page.selectOption('[name="leaveType"]', 'ANNUAL')
    await page.fill('[name="startDate"]', '2024-01-20')
    await page.fill('[name="endDate"]', '2024-01-22')
    await page.fill('[name="reason"]', 'Family vacation')

    // Submit
    await page.click('button:has-text("Ajukan Cuti")')

    // Verify success
    await expect(page.locator('.toast-success')).toContainText('berhasil')
    await expect(page.locator('text=Menunggu Approval')).toBeVisible()
  })

  test('manager can approve leave request', async ({ page, context }) => {
    // Login as manager
    await page.goto('/login')
    await page.fill('[name="email"]', 'manager@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to approval queue
    await page.click('text=Approval')

    // Find and approve request
    await page.click('tr:has-text("John Doe") button:has-text("Review")')
    await page.click('button:has-text("Setujui")')

    // Verify
    await expect(page.locator('.toast-success')).toContainText('disetujui')
  })
})
```

---

## 3. Testing Categories

### 3.1 Functional Testing

Berdasarkan [16-rencana-uji-fungsi.md](16-rencana-uji-fungsi.md), test cases per modul:

#### Authentication
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Register dengan tenant valid | User created, status pending | P0 |
| Register dengan email duplicate | Error: email exists | P0 |
| Login dengan kredensial valid | Token generated, redirect dashboard | P0 |
| Login dengan password salah | Error: invalid credentials | P0 |
| Reset password flow | Email sent, can set new password | P1 |
| Session expiry | Redirect to login | P1 |

#### Attendance
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Clock in dengan selfie valid | Attendance recorded, timestamp server | P0 |
| Clock in tanpa foto | Error: photo required | P0 |
| Clock out setelah clock in | Attendance completed | P0 |
| Clock in di luar geofence (jika aktif) | Warning/reject sesuai policy | P1 |
| Koreksi absensi dengan bukti | Request created, pending approval | P1 |

#### Leave Management
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Submit cuti dengan saldo cukup | Request created, balance reserved | P0 |
| Submit cuti saldo tidak cukup | Error: insufficient balance | P0 |
| Approval oleh manager | Status updated, notification sent | P0 |
| Rejection dengan catatan | Status rejected, reason recorded | P0 |
| Cancel sebelum diproses | Request cancelled, balance restored | P1 |

#### Reimburse
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Submit dengan bukti valid | Request created, pending approval | P0 |
| Submit tanpa bukti | Error: attachment required | P0 |
| Submit melebihi plafon | Warning displayed, can proceed | P1 |
| Approval chain complete | Status paid, notification sent | P0 |

#### Payroll
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Generate slip batch | Slips generated for all employees | P0 |
| Publish slip | Employees can access, notification sent | P0 |
| Download PDF | PDF downloaded with correct data | P0 |
| Access slip orang lain | Error: forbidden | P0 |

### 3.2 Security Testing

#### Authentication & Authorization
| Test | Method | Expected |
|------|--------|----------|
| SQL Injection | Input `' OR '1'='1` | Sanitized, no data leak |
| XSS Attack | Input `<script>alert(1)</script>` | Escaped in output |
| CSRF | Submit form tanpa token | Rejected |
| JWT tampering | Modify payload | Invalid signature error |
| Role escalation | Access admin endpoint as user | 403 Forbidden |
| Tenant isolation | Query data tenant lain | No data returned |

#### Data Protection
| Test | Method | Expected |
|------|--------|----------|
| Password storage | Check database | bcrypt/argon2 hashed |
| Sensitive data in URL | Check logs | No sensitive params |
| File upload validation | Upload malicious file | Rejected |
| Rate limiting | Burst requests | 429 Too Many Requests |

**Security Test Example:**
```typescript
describe('Security Tests', () => {
  describe('Tenant Isolation', () => {
    it('should not return data from other tenant', async () => {
      // User from Tenant A tries to access Tenant B data
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .query({ tenantId: 'tenant-b-id' })

      // Should only return Tenant A data
      response.body.data.forEach(emp => {
        expect(emp.tenantId).toBe('tenant-a-id')
      })
    })
  })

  describe('SQL Injection', () => {
    it('should sanitize malicious input', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: "'; DROP TABLE employees; --" })

      expect(response.status).toBe(200)
      // Table should still exist
      const count = await prisma.employee.count()
      expect(count).toBeGreaterThan(0)
    })
  })
})
```

### 3.3 Performance Testing

**Tools:** k6, Artillery, atau Lighthouse

**Targets (dari KAK):**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard load | < 3 detik | P95 response time |
| Attendance API | < 1.5 detik | P95 response time |
| Concurrent users | 500 | Without degradation |
| Uptime | 99.5% | Monthly |

**k6 Load Test Example:**
```javascript
// k6/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 500 },  // Peak load
    { duration: '2m', target: 0 }     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% < 3s
    http_req_failed: ['rate<0.01']       // Error rate < 1%
  }
}

export default function () {
  // Login
  const loginRes = http.post(`${__ENV.BASE_URL}/api/auth/login`, {
    email: 'loadtest@test.com',
    password: 'password123'
  })

  check(loginRes, {
    'login successful': (r) => r.status === 200
  })

  const token = loginRes.json('token')

  // Dashboard
  const dashRes = http.get(`${__ENV.BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  check(dashRes, {
    'dashboard < 3s': (r) => r.timings.duration < 3000
  })

  sleep(1)
}
```

### 3.4 Accessibility Testing

**Tools:** axe-core, Lighthouse, Pa11y

**Standards:** WCAG 2.1 Level AA

**Automated Checks:**
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('dashboard should have no a11y violations', async ({ page }) => {
    await page.goto('/dashboard')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
```

**Manual Checks:**
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader can read all content
- [ ] Color contrast meets minimum ratios
- [ ] Focus indicators visible
- [ ] Form fields have proper labels
- [ ] Error messages are descriptive

---

## 4. Test Data Management

### 4.1 Test Data Strategy

**Seeding:**
```typescript
// prisma/seed/test.ts
export async function seedTestData() {
  // Tenants
  const tenantA = await prisma.tenant.create({
    data: {
      id: 'tenant-a',
      name: 'PT Test A',
      code: 'TST-A'
    }
  })

  // Roles
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'Employee', code: 'EMP' } }),
    prisma.role.create({ data: { name: 'Manager', code: 'MGR' } }),
    prisma.role.create({ data: { name: 'HRD', code: 'HRD' } })
  ])

  // Test Users
  await prisma.user.createMany({
    data: [
      { email: 'employee@test.com', name: 'Test Employee', roleId: roles[0].id, tenantId: tenantA.id },
      { email: 'manager@test.com', name: 'Test Manager', roleId: roles[1].id, tenantId: tenantA.id },
      { email: 'hrd@test.com', name: 'Test HRD', roleId: roles[2].id, tenantId: tenantA.id }
    ]
  })

  // Leave balances
  // Attendance records
  // etc.
}
```

**Data Isolation:**
- Setiap test suite memiliki data sendiri
- Gunakan unique identifiers (uuid) untuk test data
- Cleanup setelah test selesai

### 4.2 Test Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  employee: {
    email: 'employee@test.com',
    password: 'Test123!@#',
    role: 'EMPLOYEE'
  },
  manager: {
    email: 'manager@test.com',
    password: 'Test123!@#',
    role: 'MANAGER'
  },
  hrd: {
    email: 'hrd@test.com',
    password: 'Test123!@#',
    role: 'HRD'
  }
}

// tests/fixtures/leave.ts
export const leaveRequests = {
  valid: {
    type: 'ANNUAL',
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    reason: 'Family vacation'
  },
  insufficientBalance: {
    type: 'ANNUAL',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    reason: 'Long vacation'
  }
}
```

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit -- --coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: peoplehub_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/peoplehub_test

      - run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    needs: [unit-test, integration-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npx playwright install --with-deps

      - run: npm run build
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 5.2 Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/services",
    "test:integration": "jest tests/api",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint-staged
```

---

## 6. Test Reporting

### 6.1 Coverage Requirements

| Type | Minimum | Target |
|------|---------|--------|
| Unit Tests | 70% | 85% |
| Integration Tests | 60% | 75% |
| E2E Critical Paths | 100% | 100% |

### 6.2 Report Formats

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.*'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  },
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  reporters: ['default', 'jest-junit'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/']
}
```

### 6.3 Dashboard Metrics

Track metrics berikut di CI/CD dashboard:
- Test pass rate
- Coverage percentage
- Test execution time
- Flaky test rate
- Code quality score

---

## 7. Testing Checklist

### 7.1 Before PR

- [ ] All unit tests pass
- [ ] New code has tests
- [ ] Coverage tidak menurun
- [ ] No console.log/debug statements
- [ ] Types are correct

### 7.2 Before Release

- [ ] All tests pass (unit, integration, e2e)
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Manual smoke test on staging

### 7.3 Critical Path Verification

| Flow | Unit | Integration | E2E | Manual |
|------|------|-------------|-----|--------|
| Login/Register | ✓ | ✓ | ✓ | ✓ |
| Clock In/Out | ✓ | ✓ | ✓ | ✓ |
| Leave Request | ✓ | ✓ | ✓ | ✓ |
| Approval Flow | ✓ | ✓ | ✓ | ✓ |
| Payslip Download | ✓ | ✓ | ✓ | ✓ |
| Tenant Isolation | ✓ | ✓ | - | ✓ |

---

## 8. Test Environment

### 8.1 Environment Setup

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Development | Seeded test data |
| CI | Automated tests | Fresh data per run |
| Staging | UAT, manual | Sanitized prod copy |
| Production | Live | Real data |

### 8.2 Environment Variables

```env
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/peoplehub_test
JWT_SECRET=test-secret-key
STORAGE_BUCKET=test-bucket
```

---

## 9. Bug Tracking Integration

### 9.1 Test Failure Handling

```typescript
// Custom reporter untuk create issue otomatis
class GitHubIssueReporter {
  onTestFailure(test, error) {
    if (process.env.CI && test.retries === 0) {
      // Create GitHub issue for flaky tests
      createIssue({
        title: `Flaky Test: ${test.name}`,
        body: `
## Test Details
- File: ${test.file}
- Name: ${test.name}
- Error: ${error.message}

## Stack Trace
\`\`\`
${error.stack}
\`\`\`
        `,
        labels: ['bug', 'flaky-test']
      })
    }
  }
}
```

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial testing strategy |

---

## 11. References

- [16-rencana-uji-fungsi.md](16-rencana-uji-fungsi.md) - Functional test scenarios
- [14-teknologi-dan-arsitektur.md](14-teknologi-dan-arsitektur.md) - Tech stack
- [23-security-policy.md](23-security-policy.md) - Security requirements
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Testing Library](https://testing-library.com)
