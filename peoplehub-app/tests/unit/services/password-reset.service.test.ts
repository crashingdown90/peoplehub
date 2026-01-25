/**
 * @jest-environment node
 */
// @ai:ag - Created by Antigravity
// Unit tests for Password Reset Service

import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { PasswordResetService } from "@/services/auth/password-reset.service";

// Mock dependencies
jest.mock("@/services/email/email.service", () => ({
    EmailService: {
        sendTemplate: jest.fn(),
    },
}));

jest.mock("@/lib/auth", () => ({
    hashPassword: jest.fn().mockResolvedValue("hashed_password_123"),
}));

import { EmailService } from "@/services/email/email.service";
import { hashPassword } from "@/lib/auth";

describe("PasswordResetService", () => {
    const mockUserId = "user-123";
    const mockTenantId = "tenant-123";
    const mockEmail = "test@example.com";
    const mockFullName = "John Doe";

    const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        email: mockEmail,
        fullName: mockFullName,
        employee: { fullName: mockFullName },
    };

    const mockToken = {
        id: "token-123",
        tenantId: mockTenantId,
        userId: mockUserId,
        token: "reset-token-abc123",
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
    };

    beforeEach(() => {
        resetPrismaMock();
        jest.clearAllMocks();
    });

    describe("requestReset", () => {
        it("should request password reset for valid email", async () => {
            (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
            (prismaMock.token.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
            (prismaMock.token.create as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
            (EmailService.sendTemplate as jest.Mock).mockResolvedValue({
                success: true,
                data: { messageId: "msg-123" },
            });

            const result = await PasswordResetService.requestReset(mockEmail);

            expect(result.success).toBe(true);
            expect(result.data?.sent).toBe(true);
            expect(prismaMock.token.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tenantId: mockTenantId,
                    userId: mockUserId,
                    type: "PASSWORD_RESET",
                }),
            });
            expect(EmailService.sendTemplate).toHaveBeenCalledWith(
                "passwordReset",
                expect.objectContaining({ email: mockEmail }),
                expect.objectContaining({ fullName: mockFullName })
            );
        });

        it("should return success for non-existent email (prevent enumeration)", async () => {
            (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await PasswordResetService.requestReset("unknown@example.com");

            expect(result.success).toBe(true);
            expect(result.data?.message).toContain("Jika email terdaftar");
            expect(prismaMock.token.create).not.toHaveBeenCalled();
        });

        it("should still return success even if email sending fails", async () => {
            (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
            (prismaMock.token.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
            (prismaMock.token.create as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
            (EmailService.sendTemplate as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: "INTERNAL_ERROR", message: "SMTP failed" },
            });

            const result = await PasswordResetService.requestReset(mockEmail);

            expect(result.success).toBe(true); // Still returns success
        });

        it("should delete existing unused tokens before creating new one", async () => {
            (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
            (prismaMock.token.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
            (prismaMock.token.create as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
            (EmailService.sendTemplate as jest.Mock).mockResolvedValue({ success: true });

            await PasswordResetService.requestReset(mockEmail);

            expect(prismaMock.token.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: mockUserId,
                    type: "PASSWORD_RESET",
                    usedAt: null,
                },
            });
        });

        it("should handle database errors", async () => {
            (prismaMock.user.findFirst as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            const result = await PasswordResetService.requestReset(mockEmail);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INTERNAL_ERROR");
        });
    });

    describe("validateToken", () => {
        it("should validate a valid token", async () => {
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ email: mockEmail });

            const result = await PasswordResetService.validateToken(mockToken.token);

            expect(result.success).toBe(true);
            expect(result.data?.valid).toBe(true);
            expect(result.data?.email).toBe(mockEmail);
        });

        it("should return NOT_FOUND for non-existent token", async () => {
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await PasswordResetService.validateToken("invalid-token");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject token with wrong type", async () => {
            const wrongTypeToken = { ...mockToken, type: "EMAIL_VERIFICATION" };
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(wrongTypeToken);

            const result = await PasswordResetService.validateToken(mockToken.token);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
        });

        it("should reject already used token", async () => {
            const usedToken = { ...mockToken, usedAt: new Date() };
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(usedToken);

            const result = await PasswordResetService.validateToken(mockToken.token);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
            expect(result.error?.message).toContain("sudah digunakan");
        });

        it("should reject expired token", async () => {
            const expiredToken = {
                ...mockToken,
                expiresAt: new Date(Date.now() - 1000),
            };
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(expiredToken);

            const result = await PasswordResetService.validateToken(mockToken.token);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
            expect(result.error?.message).toContain("kadaluarsa");
        });
    });

    describe("resetPassword", () => {
        it("should reset password with valid token", async () => {
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ email: mockEmail });
            (prismaMock.$transaction as jest.Mock).mockResolvedValue([{}, {}]);
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const result = await PasswordResetService.resetPassword(
                mockToken.token,
                "NewPassword123!"
            );

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(hashPassword).toHaveBeenCalledWith("NewPassword123!");
        });

        it("should return error for invalid token", async () => {
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await PasswordResetService.resetPassword(
                "invalid-token",
                "NewPassword123!"
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should return error for expired token", async () => {
            const expiredToken = {
                ...mockToken,
                expiresAt: new Date(Date.now() - 1000),
            };
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(expiredToken);

            const result = await PasswordResetService.resetPassword(
                mockToken.token,
                "NewPassword123!"
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
        });

        it("should handle database errors during password reset", async () => {
            (prismaMock.token.findUnique as jest.Mock).mockResolvedValue(mockToken);
            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ email: mockEmail });
            (prismaMock.$transaction as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            const result = await PasswordResetService.resetPassword(
                mockToken.token,
                "NewPassword123!"
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INTERNAL_ERROR");
        });
    });

    describe("cleanupExpiredTokens", () => {
        it("should delete expired tokens", async () => {
            (prismaMock.token.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

            const result = await PasswordResetService.cleanupExpiredTokens();

            expect(result).toBe(5);
            expect(prismaMock.token.deleteMany).toHaveBeenCalledWith({
                where: {
                    expiresAt: { lt: expect.any(Date) },
                },
            });
        });

        it("should return 0 when no expired tokens", async () => {
            (prismaMock.token.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

            const result = await PasswordResetService.cleanupExpiredTokens();

            expect(result).toBe(0);
        });
    });
});
