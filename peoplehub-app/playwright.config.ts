// @ai:cl - Playwright E2E test configuration
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",

    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        // Setup project - run authentication before tests
        {
            name: "setup",
            testMatch: /.*\.setup\.ts/,
        },

        // Authenticated test projects
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Use employee auth by default, tests can override
                storageState: "e2e/.auth/employee.json",
            },
            dependencies: ["setup"],
        },
        {
            name: "firefox",
            use: {
                ...devices["Desktop Firefox"],
                storageState: "e2e/.auth/employee.json",
            },
            dependencies: ["setup"],
        },
        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"],
                storageState: "e2e/.auth/employee.json",
            },
            dependencies: ["setup"],
        },
        // Mobile viewports
        {
            name: "Mobile Chrome",
            use: {
                ...devices["Pixel 5"],
                storageState: "e2e/.auth/employee.json",
            },
            dependencies: ["setup"],
        },
        {
            name: "Mobile Safari",
            use: {
                ...devices["iPhone 12"],
                storageState: "e2e/.auth/employee.json",
            },
            dependencies: ["setup"],
        },
    ],

    // Run local dev server before starting the tests
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
