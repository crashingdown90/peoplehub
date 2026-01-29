// @ai:cl - Password Reset Service for PeopleHub

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { EmailService } from "@/services/email/email.service";
import { ServiceResponse, success, error, ErrorCodes } from "@/services/types";
import crypto from "crypto";

// ==========================================
// TYPES
// ==========================================

interface RequestResetResult {
  sent: boolean;
  message: string;
}

interface ValidateTokenResult {
  valid: boolean;
  email?: string;
}

interface ResetPasswordResult {
  success: boolean;
  message: string;
}

// ==========================================
// PASSWORD RESET SERVICE
// ==========================================

export class PasswordResetService {
  private static TOKEN_EXPIRY_HOURS = 1;
  private static BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Request password reset - sends email with reset link
   */
  static async requestReset(email: string): Promise<ServiceResponse<RequestResetResult>> {
    try {
      // Find user by email
      const user = await prisma.user.findFirst({
        where: { email },
        include: { employee: true },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return success({
          sent: true,
          message: "Jika email terdaftar, instruksi reset password akan dikirim",
        });
      }

      // Delete any existing unused tokens for this user
      await prisma.token.deleteMany({
        where: {
          userId: user.id,
          type: "PASSWORD_RESET",
          usedAt: null,
        },
      });

      // Generate new token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Save token to database
      await prisma.token.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          token,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      });

      // Build reset URL
      const resetUrl = `${this.BASE_URL}/reset-password?token=${token}`;

      // Get user's name
      const fullName = user.employee?.fullName || user.fullName || "User";

      // Send email using template
      const emailResult = await EmailService.sendTemplate(
        "passwordReset",
        { email: user.email, name: fullName },
        {
          fullName,
          email: user.email,
          resetUrl,
          expiryHours: String(this.TOKEN_EXPIRY_HOURS),
        }
      );

      if (!emailResult.success) {
        console.error("Failed to send reset email:", emailResult.error);
        // Still return success to prevent email enumeration
        return success({
          sent: true,
          message: "Jika email terdaftar, instruksi reset password akan dikirim",
        });
      }

      // Log password reset request
      await prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          actorId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          objectType: "User",
          objectId: user.id,
          afterData: JSON.parse(JSON.stringify({
            email: user.email,
            tokenExpiry: expiresAt.toISOString(),
          })),
        },
      });

      return success({
        sent: true,
        message: "Jika email terdaftar, instruksi reset password akan dikirim",
      });
    } catch (err) {
      console.error("Request password reset error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memproses permintaan reset password");
    }
  }

  /**
   * Validate reset token
   */
  static async validateToken(token: string): Promise<ServiceResponse<ValidateTokenResult>> {
    try {
      // Find token
      const tokenRecord = await prisma.token.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return error(ErrorCodes.NOT_FOUND, "Token tidak ditemukan atau sudah kadaluarsa");
      }

      if (tokenRecord.type !== "PASSWORD_RESET") {
        return error(ErrorCodes.VALIDATION_ERROR, "Token tidak valid");
      }

      if (tokenRecord.usedAt) {
        return error(ErrorCodes.VALIDATION_ERROR, "Token sudah digunakan");
      }

      if (new Date() > tokenRecord.expiresAt) {
        return error(ErrorCodes.VALIDATION_ERROR, "Token sudah kadaluarsa");
      }

      // Get user email for display
      const user = await prisma.user.findUnique({
        where: { id: tokenRecord.userId },
        select: { email: true },
      });

      return success({
        valid: true,
        email: user?.email,
      });
    } catch (err) {
      console.error("Validate token error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memvalidasi token");
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ServiceResponse<ResetPasswordResult>> {
    try {
      // Validate token first
      const validateResult = await this.validateToken(token);
      if (!validateResult.success) {
        return error(validateResult.error!.code, validateResult.error!.message);
      }

      // Find token record
      const tokenRecord = await prisma.token.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return error(ErrorCodes.NOT_FOUND, "Token tidak ditemukan");
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: tokenRecord.userId },
          data: { passwordHash },
        }),
        prisma.token.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      // Log password reset
      await prisma.auditLog.create({
        data: {
          tenantId: tokenRecord.tenantId,
          actorId: tokenRecord.userId,
          action: "PASSWORD_RESET_COMPLETED",
          objectType: "User",
          objectId: tokenRecord.userId,
        },
      });

      return success({
        success: true,
        message: "Password berhasil diubah",
      });
    } catch (err) {
      console.error("Reset password error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal mengubah password");
    }
  }

  /**
   * Clean up expired tokens (for cron job)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.token.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}

export const passwordResetService = new PasswordResetService();
