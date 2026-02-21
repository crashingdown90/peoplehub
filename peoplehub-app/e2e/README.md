# E2E Testing with Authentication - Usage Guide

## Quick Start

### 1. Set Up Test Database

```bash
# Seed the database with test users and data
npm run db:seed:e2e
```

This creates:
- **Test Tenant:** Test Company (TEST001)
- **Test Users:**
  - Employee: `employee@test.peoplehub.id`
  - Manager: `manager@test.peoplehub.id`
  - HRD: `hrd@test.peoplehub.id`
  - Password: set via `SEED_E2E_PASSWORD` (or role-specific `TEST_*_PASSWORD`)
- **Leave Types:** Annual Leave (12 days), Sick Leave (12 days)
- **Leave Balances:** Employee has 10 days annual leave, 12 days sick leave
- **Sample Data:** 1 pending leave request

### 2. Set Up Authentication (Optional)

```bash
# Run just the auth setup to create authenticated sessions
npm run test:e2e:setup
```

This will:
- Log in as each test user (Employee, Manager, HRD)
- Save authentication state to `e2e/.auth/*.json`
- These files are automatically used for subsequent test runs

### 3. Run E2E Tests

```bash
# Run all E2E tests (with authentication)
npm run test:e2e

# Run specific test file
npm run test:e2e -- leave.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed
```

## How It Works

### Authentication Flow

1. **First Run:** Tests will execute the `setup` project first
   - `e2e/auth.setup.ts` logs in as each user role
   - Saves auth state to JSON files in `e2e/.auth/`

2. **Subsequent Tests:** Each browser project uses stored auth state
   - Tests run as authenticated users
   - No need to log in again

### Test User Roles

| Role     | Email                       | Access Level                    |
|----------|-----------------------------|---------------------------------|
| Employee | employee@test.peoplehub.id  | Own leave requests, balances    |
| Manager  | manager@test.peoplehub.id   | Team approvals, subordinate data|
| HRD      | hrd@test.peoplehub.id      | All approvals, all employee data|

### Using Different Roles in Tests

By default, all tests use Employee auth. To test as a different role:

```typescript
// Test as Manager
test.use({ storageState: 'e2e/.auth/manager.json' });

test('manager can approve leave requests', async ({ page }) => {
  await page.goto('/approvals');
  // Test manager-specific functionality
});
```

```typescript
// Test as HRD
test.describe('HRD Final Approval', () => {
  test.use({ storageState: 'e2e/.auth/hrd.json' });

  test('HRD can give final approval', async ({ page }) => {
    // Test HRD functionality
  });
});
```

## Environment Variables

For production/CI environments, override test credentials:

```bash
# .env.test
TEST_EMPLOYEE_EMAIL=test.employee@company.com
TEST_EMPLOYEE_PASSWORD=SecurePass123!
TEST_MANAGER_EMAIL=test.manager@company.com
TEST_MANAGER_PASSWORD=SecurePass123!
TEST_HRD_EMAIL=test.hrd@company.com
TEST_HRD_PASSWORD=SecurePass123!
```

## Troubleshooting

### Auth files not created

```bash
# Manually run auth setup
npx playwright test --project=setup
```

### Auth state expired

```bash
# Re-run setup to refresh auth
npm run test:e2e:setup
```

### Database out of sync

```bash
# Re-seed the database
npm run db:seed:e2e
```

### Tests failing due to missing data

Make sure to run `npm run db:seed:e2e` before running tests. The seed script creates all necessary test data.

## CI/CD Integration

For automated testing in CI:

```yaml
# Example GitHub Actions workflow
- name: Setup E2E tests
  run: |
    npm run db:seed:e2e
    npm run test:e2e:setup

- name: Run E2E tests
  run: npm run test:e2e
```

## File Structure

```
e2e/
├── .auth/                    # Auth storage (gitignored)
│   ├── employee.json
│   ├── manager.json
│   └── hrd.json
├── auth.setup.ts            # Authentication setup
├── leave.spec.ts            # Leave workflow tests
├── approval.spec.ts         # Approval tests
└── README-AUTH-SETUP.md     # Setup documentation

prisma/
├── seed.ts                  # Production seed
└── seed-e2e.ts             # E2E test seed
```

## Next Steps

- Add more E2E tests for other workflows
- Create authenticated test fixtures for complex scenarios
- Implement visual regression testing
- Add performance testing with k6

## References

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [PeopleHub Testing Strategy](../docs/08-testing/strategy.md)
- [Sprint 4 Progress](../docs/11-implementation/sprint-progress.md)
