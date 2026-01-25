// @ai:cl - Email Verification Service for PeopleHub

import { prisma } from "@/lib/db";
import { EmailService } from "@/services/email/email.service";
import { ServiceResponse, success, error, ErrorCodes } from "@/services/types";
import crypto from "crypto";

// ==========================================
// TYPES
// ==========================================

interface EmailVerifyResult {
  success: boolean;
  message: string;
}

interface SendVerificationResult {
  sent: boolean;
  message: string;
}

// ==========================================
// EMAIL VERIFICATION SERVICE
// ==========================================

export class EmailVerifyService {
  private static TOKEN_EXPIRY_HOURS = 24;
  private static BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Send verification email to user
   */
  static async sendVerificationEmail(
    userId: string,
    tenantId: string,
    email: string,
    fullName: string
  ): Promise<ServiceResponse<SendVerificationResult>> {
    try {
      // Delete any existing unused tokens for this user
      await prisma.token.deleteMany({
        where: {
          userId,
          type: "EMAIL_VERIFICATION",
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
          tenantId,
          userId,
          token,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Build verification URL
      const verificationUrl = `${this.BASE_URL}/verify-email?token=${token}`;

      // Send email using template
      const emailResult = await EmailService.sendTemplate(
        "emailVerification",
        { email, name: fullName },
        {
          fullName,
          email,
          verificationUrl,
          expiryHours: String(this.TOKEN_EXPIRY_HOURS),
        }
      );

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
        return error(ErrorCodes.INTERNAL_ERROR, "Gagal mengirim email verifikasi");
      }

      return success({
        sent: true,
        message: "Email verifikasi telah dikirim",
      });
    } catch (err) {
      console.error("Send verification email error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal mengirim email verifikasi");
    }
  }

  /**
   * Verify email using token
   */
  static async verifyEmail(token: string): Promise<ServiceResponse<EmailVerifyResult>> {
    try {
      // Find token
      const tokenRecord = await prisma.token.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return error(ErrorCodes.NOT_FOUND, "Token verifikasi tidak ditemukan");
      }

      if (tokenRecord.type !== "EMAIL_VERIFICATION") {
        return error(ErrorCodes.VALIDATION_ERROR, "Token tidak valid");
      }

      if (tokenRecord.usedAt) {
        return error(ErrorCodes.VALIDATION_ERROR, "Token sudah digunakan");
      }

      if (new Date() > tokenRecord.expiresAt) {
        return error(ErrorCodes.VALIDATION_ERROR, "Token sudah kadaluarsa");
      }

      // Update user's emailVerifiedAt
      await prisma.$transaction([
        prisma.user.update({
          where: { id: tokenRecord.userId },
          data: { emailVerifiedAt: new Date() },
        }),
        prisma.token.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return success({
        success: true,
        message: "Email berhasil diverifikasi",
      });
    } catch (err) {
      console.error("Verify email error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memverifikasi email");
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string): Promise<ServiceResponse<SendVerificationResult>> {
    try {
      // Find user by email
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists
        return success({
          sent: true,
          message: "Jika email terdaftar, email verifikasi akan dikirim",
        });
      }

      if (user.emailVerifiedAt) {
        return error(ErrorCodes.VALIDATION_ERROR, "Email sudah terverifikasi");
      }

      // Get employee name if exists
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
      });

      const fullName = employee?.fullName || user.fullName || "User";

      return this.sendVerificationEmail(user.id, user.tenantId, user.email, fullName);
    } catch (err) {
      console.error("Resend verification error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal mengirim ulang email verifikasi");
    }
  }

  /**
   * Check if user's email is verified
   */
  static async isEmailVerified(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });

    return user?.emailVerifiedAt !== null;
  }
}

export const emailVerifyService = new EmailVerifyService();
