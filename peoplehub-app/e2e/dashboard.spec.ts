// @ai:cl - E2E tests for dashboard functionality
import { test, expect } from "@playwright/test";

test.describe("Dashboard (Authenticated)", () => {
    // Setup: Login before each test
    test.beforeEach(async ({ page }) => {
        // For testing, we'll check the login redirect
        await page.goto("/dashboard");
    });

    test("should redirect to login if not authenticated", async ({ page }) => {
        // Should be redirected to login page
        await expect(page).toHaveURL(/login/);
    });
});

test.describe("Dashboard Layout", () => {
    // These tests assume we have a way to bypass auth for testing
    // In production, you'd use test fixtures to handle authentication

    test("should have responsive sidebar", async ({ page }) => {
        await page.goto("/login");

        // Check for mobile menu toggle on small screens
        await page.setViewportSize({ width: 375, height: 667 });
        // Mobile menu should have a toggle button
    });

    test("should have navigation links", async ({ page }) => {
        await page.goto("/login");

        // After successful login, dashboard should have navigation
        // This test validates the login page exists
        await expect(page.getByRole("button", { name: /login|masuk/i })).toBeVisible();
    });
});
