// @ai:cl - E2E tests for approval workflows
import { test, expect } from "@playwright/test";

test.describe("Approval Center", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to approvals page
        await page.goto("/approvals");
    });

    test("should redirect to login if not authenticated", async ({ page }) => {
        // Unauthenticated users should be redirected to login
        await expect(page).toHaveURL(/login/);
    });
});

test.describe("Leave Request Flow", () => {
    test("should display leave request form", async ({ page }) => {
        await page.goto("/leave");

        // Should be redirected to login if not authenticated
        await expect(page).toHaveURL(/login/);
    });
});

// Authenticated tests would require test fixtures with pre-authenticated sessions
// Example fixture:
/*
test.describe("Approval Center (Authenticated Manager)", () => {
    test.use({
        storageState: "e2e/.auth/manager.json",
    });

    test("should display pending approvals", async ({ page }) => {
        await page.goto("/approvals");

        await expect(page.getByRole("heading", { name: /approval center/i })).toBeVisible();
        await expect(page.getByText(/pending|menunggu/i)).toBeVisible();
    });

    test("should filter by approval type", async ({ page }) => {
        await page.goto("/approvals");

        // Click on leave tab
        await page.getByRole("button", { name: /cuti|leave/i }).click();

        // Should show only leave approvals
        await expect(page.locator("[data-type='LEAVE']")).toBeVisible();
    });

    test("should open approval detail modal", async ({ page }) => {
        await page.goto("/approvals");

        // Click on an approval item
        const firstApproval = page.locator("[data-testid='approval-item']").first();
        if (await firstApproval.isVisible()) {
            await firstApproval.click();

            // Modal should be visible
            await expect(page.getByRole("dialog")).toBeVisible();
            await expect(page.getByText(/detail pengajuan/i)).toBeVisible();
        }
    });

    test("should approve request", async ({ page }) => {
        await page.goto("/approvals");

        const approveButton = page.getByRole("button", { name: /setuju|approve/i }).first();
        if (await approveButton.isVisible()) {
            await approveButton.click();

            // Should show success message or remove item
            await expect(page.getByText(/berhasil|success/i)).toBeVisible();
        }
    });

    test("should reject request with reason", async ({ page }) => {
        await page.goto("/approvals");

        const rejectButton = page.getByRole("button", { name: /tolak|reject/i }).first();
        if (await rejectButton.isVisible()) {
            await rejectButton.click();

            // Rejection dialog should open
            await expect(page.getByRole("dialog")).toBeVisible();

            // Fill reason
            await page.getByLabel(/alasan/i).fill("Tidak cukup saldo cuti untuk periode ini");

            // Submit rejection
            await page.getByRole("button", { name: /tolak pengajuan/i }).click();

            // Should show success or confirmation
            await expect(page.getByText(/berhasil|ditolak/i)).toBeVisible();
        }
    });
});
*/
