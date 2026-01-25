/**
 * @jest-environment node
 */
// @ai:ag - Created by Antigravity
// Unit tests for Email Service

import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { EmailService } from "@/services/email/email.service";

// Mock fetch for SendGrid/Resend providers
global.fetch = jest.fn();

// Mock nodemailer
jest.mock("nodemailer", () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({
            messageId: "mock-message-id",
            accepted: ["test@example.com"],
            rejected: [],
        }),
    }),
}));

describe("EmailService", () => {
    const mockRecipient = {
        email: "test@example.com",
        name: "Test User",
    };

    const mockEmailParams = {
        to: mockRecipient,
        subject: "Test Email",
        html: "<p>Hello World</p>",
        text: "Hello World",
    };

    beforeEach(() => {
        resetPrismaMock();
        jest.clearAllMocks();
        // Reset environment
        process.env.EMAIL_PROVIDER = "smtp";
    });

    describe("send", () => {
        it("should send email successfully via SMTP", async () => {
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const result = await EmailService.send(mockEmailParams);

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("messageId");
        });

        it("should handle multiple recipients", async () => {
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const multiRecipientParams = {
                ...mockEmailParams,
                to: [
                    { email: "user1@example.com", name: "User 1" },
                    { email: "user2@example.com", name: "User 2" },
                ],
            };

            const result = await EmailService.send(multiRecipientParams);

            expect(result.success).toBe(true);
        });

        it("should handle cc and bcc recipients", async () => {
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const withCcBcc = {
                ...mockEmailParams,
                cc: [{ email: "cc@example.com" }],
                bcc: [{ email: "bcc@example.com" }],
            };

            const result = await EmailService.send(withCcBcc);

            expect(result.success).toBe(true);
        });
    });

    describe("sendTemplate", () => {
        it("should return error for non-existent template", async () => {
            const result = await EmailService.sendTemplate(
                "nonExistentTemplate",
                mockRecipient,
                { name: "Test" }
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("shouldSendEmail", () => {
        it("should return false when email is disabled", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: false,
            });

            const result = await EmailService.shouldSendEmail("user-123", "leave");

            expect(result).toBe(false);
        });

        it("should return false when no preferences exist", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await EmailService.shouldSendEmail("user-123", "attendance");

            expect(result).toBe(false);
        });

        it("should check attendance alerts preference", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: true,
                attendanceAlerts: true,
            });

            const result = await EmailService.shouldSendEmail("user-123", "attendance");

            expect(result).toBe(true);
        });

        it("should check leave alerts preference", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: true,
                leaveAlerts: false,
            });

            const result = await EmailService.shouldSendEmail("user-123", "leave");

            expect(result).toBe(false);
        });

        it("should check approval alerts preference", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: true,
                approvalAlerts: true,
            });

            const result = await EmailService.shouldSendEmail("user-123", "approval");

            expect(result).toBe(true);
        });

        it("should check announcement alerts preference", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: true,
                announcementAlerts: false,
            });

            const result = await EmailService.shouldSendEmail("user-123", "announcement");

            expect(result).toBe(false);
        });

        it("should return true for system notifications when email enabled", async () => {
            (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
                emailEnabled: true,
            });

            const result = await EmailService.shouldSendEmail("user-123", "system");

            expect(result).toBe(true);
        });
    });

    describe("getUserEmail", () => {
        it("should return user email with employee name", async () => {
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
                email: "user@example.com",
                employee: { fullName: "John Doe" },
            });

            const result = await EmailService.getUserEmail("user-123");

            expect(result).toEqual({
                email: "user@example.com",
                name: "John Doe",
            });
        });

        it("should return null for non-existent user", async () => {
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await EmailService.getUserEmail("unknown");

            expect(result).toBeNull();
        });

        it("should handle user without employee record", async () => {
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
                email: "user@example.com",
                employee: null,
            });

            const result = await EmailService.getUserEmail("user-123");

            expect(result).toEqual({
                email: "user@example.com",
                name: undefined,
            });
        });
    });
});
