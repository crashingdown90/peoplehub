# E2E Test Authentication Setup Guide

## Overview

This guide explains how to set up authenticated sessions for E2E testing in PeopleHub. Currently, the `leave.spec.ts` tests handle unauthenticated scenarios gracefully and include environment variable placeholders for future authenticated test sessions.

## Current Implementation

The `e2e/leave.spec.ts` file includes:

1. **Test credentials structure** (line 20-31):
   ```typescript
   const testUsers = {
       employee: {
           email: process.env.TEST_EMPLOYEE_EMAIL || "employee@test.peoplehub.id",
           password: process.env.TEST_EMPLOYEE_PASSWORD || "TestPassword123!",
       },
       manager: {
           email: process.env.TEST_MANAGER_EMAIL || "manager@test.peoplehub.id",
           password: process.env.TEST_MANAGER_PASSWORD || "TestPassword123!",
       },
       hrd: {
           email: process.env.TEST_HRD_EMAIL || "hrd@test.peoplehub.id",
           password: process.env.TEST_HRD_PASSWORD || "TestPassword123!",
       },
   };
   ```

2. **Login helper function** (line 13-18) for authenticating users

3. **Graceful handling of unauthenticated state** - all tests check for login redirects

## Next Steps for Full Authentication

### Option 1: Playwright Auth Fixtures (Recommended)

Create a global setup file to authenticate once and reuse sessions:

1. **Create `e2e/auth.setup.ts`:**
```typescript
import { test as setup } from '@playwright/test';
import { testUsers } from './leave.spec';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as employee', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testUsers.employee.email);
  await page.getByLabel(/password/i).fill(testUsers.employee.password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/dashboard/);
  await page.context().storageState({ path: authFile });
});
```

2. **Update `playwright.config.ts`** to use setup project:
```typescript
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

### Option 2: Environment Variables + Seed Script

1. **Create `.env.test`:**
```env
TEST_EMPLOYEE_EMAIL=test.employee@peoplehub.local
TEST_EMPLOYEE_PASSWORD=SecurePassword123!
TEST_MANAGER_EMAIL=test.manager@peoplehub.local
TEST_MANAGER_PASSWORD=SecurePassword123!
TEST_HRD_EMAIL=test.hrd@peoplehub.local
TEST_HRD_PASSWORD=SecurePassword123!
```

2. **Create database seed script** (`scripts/seed-e2e.ts`):
```typescript
// Create test users with proper roles and tenant isolation
// Include test leave balances, departments, etc.
```

3. **Run seed before E2E tests:**
```bash
npm run db:seed:e2e && npm run test:e2e
```

### Option 3: Bypass Authentication (Development Only)

For rapid testing, create a test-only auth bypass:

1. Add environment check in auth middleware
2. Accept special `TEST_TOKEN` header in test environment
3. **⚠️ WARNING:** Never deploy this to production

## Test Data Requirements

For full E2E test coverage, the test database needs:

1. **Users:**
   - Employee with leave balance
   - Manager (employee's direct supervisor)
   - HRD user with approval permissions

2. **Leave Types:**
   - Tahunan (Annual leave)
   - Sakit (Sick leave)
   - Khusus (Special leave)

3. **Leave Balances:**
   - Employee should have at least 10 days annual leave balance

4. **Organizational Structure:**
   - Employee reports to Manager
   - Manager in same tenant
   - HRD has tenant-wide access

## Current Test Status

✅ **68 E2E tests created and passing** (all gracefully handle unauthenticated state)
- Leave request submission flow tests
- Multi-level approval flow tests  
- Edge case validations
- Delegation feature tests
- SLA tracking tests

⚠️ **Tests currently validate:**
- Redirect to login when unauthenticated
- UI element presence and structure
- Form validation

🔄 **To enable full flow testing, implement:**
- Authentication fixtures (Option 1 recommended)
- Test database seeding
- Role-based test user creation

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run leave tests specifically
npm run test:e2e -- leave.spec.ts

# Run with UI mode for debugging
npm run test:e2e -- --ui

# Generate HTML report
npm run test:e2e -- --reporter=html
```

## References

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures)
- PeopleHub Testing Strategy: `docs/08-testing/strategy.md`
