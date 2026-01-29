// @ai:cl - Playwright global auth setup for E2E tests
// This file runs before all tests to authenticate users and save their state
import { test as setup, expect } from '@playwright/test';
import path from 'path';

// Auth file paths
const authDir = path.join(__dirname, '.auth');
const employeeAuthFile = path.join(authDir, 'employee.json');
const managerAuthFile = path.join(authDir, 'manager.json');
const hrdAuthFile = path.join(authDir, 'hrd.json');

/**
 * Test credentials
 * In production, use environment variables:
 * - TEST_EMPLOYEE_EMAIL, TEST_EMPLOYEE_PASSWORD
 * - TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD
 * - TEST_HRD_EMAIL, TEST_HRD_PASSWORD
 */
const testUsers = {
    employee: {
        email: process.env.TEST_EMPLOYEE_EMAIL || 'employee@test.peoplehub.id',
        password: process.env.TEST_EMPLOYEE_PASSWORD || 'TestPassword123!',
    },
    manager: {
        email: process.env.TEST_MANAGER_EMAIL || 'manager@test.peoplehub.id',
        password: process.env.TEST_MANAGER_PASSWORD || 'TestPassword123!',
    },
    hrd: {
        email: process.env.TEST_HRD_EMAIL || 'hrd@test.peoplehub.id',
        password: process.env.TEST_HRD_PASSWORD || 'TestPassword123!',
    },
};

/**
 * Authenticate as Employee
 */
setup('authenticate as employee', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(testUsers.employee.email);
    await page.getByLabel(/password|kata sandi/i).fill(testUsers.employee.password);

    // Submit and wait for redirect
    await page.getByRole('button', { name: /login|masuk/i }).click();

    // Wait for successful login (dashboard or home page)
    await page.waitForURL(/dashboard|home|leave/, { timeout: 15000 });

    // Verify logged in state - use specific heading to avoid strict mode violation
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Beranda/i })).toBeVisible({ timeout: 5000 });

    // Save authentication state
    await page.context().storageState({ path: employeeAuthFile });

    console.log('✅ Employee authentication saved');
});

/**
 * Authenticate as Manager
 */
setup('authenticate as manager', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill(testUsers.manager.email);
    await page.getByLabel(/password|kata sandi/i).fill(testUsers.manager.password);
    await page.getByRole('button', { name: /login|masuk/i }).click();

    await page.waitForURL(/dashboard|home|approvals/, { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Approval/i })).toBeVisible({ timeout: 5000 });

    await page.context().storageState({ path: managerAuthFile });

    console.log('✅ Manager authentication saved');
});

/**
 * Authenticate as HRD
 */
setup('authenticate as hrd', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill(testUsers.hrd.email);
    await page.getByLabel(/password|kata sandi/i).fill(testUsers.hrd.password);
    await page.getByRole('button', { name: /login|masuk/i }).click();

    await page.waitForURL(/dashboard|home|approvals|leave/, { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: /Dashboard|HRD|Approval/i })).toBeVisible({ timeout: 5000 });

    await page.context().storageState({ path: hrdAuthFile });

    console.log('✅ HRD authentication saved');
});
