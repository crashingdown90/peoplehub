// @ai:cl - E2E tests for authentication flows
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/login");
    });

    test("should display login form", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /login|masuk/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /login|masuk/i })).toBeVisible();
    });

    test("should show validation error for empty fields", async ({ page }) => {
        await page.getByRole("button", { name: /login|masuk/i }).click();

        // Should show validation errors
        await expect(page.getByText(/email.*wajib|required/i)).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
        await page.getByLabel(/email/i).fill("invalid@example.com");
        await page.getByLabel(/password|kata sandi/i).fill("wrongpassword");
        await page.getByRole("button", { name: /login|masuk/i }).click();

        // Wait for error message
        await expect(page.getByText(/invalid|salah|gagal/i)).toBeVisible({ timeout: 10000 });
    });

    test("should have link to forgot password", async ({ page }) => {
        const forgotLink = page.getByRole("link", { name: /lupa.*password|forgot/i });
        await expect(forgotLink).toBeVisible();
    });

    test("should have link to register", async ({ page }) => {
        const registerLink = page.getByRole("link", { name: /daftar|register|sign up/i });
        await expect(registerLink).toBeVisible();
    });
});

test.describe("Registration", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/register");
    });

    test("should display registration form", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /daftar|register/i })).toBeVisible();
        await expect(page.getByLabel(/nama/i).first()).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password|kata sandi/i).first()).toBeVisible();
    });

    test("should validate email format", async ({ page }) => {
        await page.getByLabel(/email/i).fill("invalid-email");
        await page.getByLabel(/email/i).blur();

        // Should show email format error
        await expect(page.getByText(/email.*valid|format/i)).toBeVisible();
    });

    test("should validate password requirements", async ({ page }) => {
        const passwordInput = page.getByLabel(/^password|kata sandi$/i).first();
        await passwordInput.fill("123");
        await passwordInput.blur();

        // Should show password requirement error
        await expect(page.getByText(/minimal|minimum|karakter|character/i)).toBeVisible();
    });
});

test.describe("Password Reset", () => {
    test("should display forgot password form", async ({ page }) => {
        await page.goto("/forgot-password");

        await expect(page.getByRole("heading", { name: /lupa.*password|forgot|reset/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /kirim|send|reset/i })).toBeVisible();
    });

    test("should validate email for password reset", async ({ page }) => {
        await page.goto("/forgot-password");

        await page.getByRole("button", { name: /kirim|send|reset/i }).click();

        // Should show validation error
        await expect(page.getByText(/email.*wajib|required/i)).toBeVisible();
    });
});
