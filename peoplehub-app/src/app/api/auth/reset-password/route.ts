// @ai:cl - Password Reset API

import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/services/auth/password-reset.service";
import { z } from "zod";

// ==========================================
// SCHEMAS
// ==========================================

const requestResetSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Konfirmasi password tidak cocok",
  path: ["passwordConfirmation"],
});

// ==========================================
// POST /api/auth/reset-password - Request reset
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a password reset (has token) or reset request (has email only)
    if (body.token && body.password) {
      // This is a password reset
      const result = resetPasswordSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Data tidak valid",
              details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      const resetResult = await PasswordResetService.resetPassword(
        result.data.token,
        result.data.password
      );

      if (!resetResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: resetResult.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: resetResult.data,
        message: "Password berhasil diubah",
      });
    } else {
      // This is a reset request
      const result = requestResetSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Email tidak valid",
              details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      const requestResult = await PasswordResetService.requestReset(result.data.email);

      if (!requestResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: requestResult.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: requestResult.data,
        message: "Jika email terdaftar, instruksi reset password akan dikirim",
      });
    }
  } catch (err) {
    console.error("Reset password API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Terjadi kesalahan server",
        },
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET /api/auth/reset-password?token=xxx - Validate token
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Token wajib diisi",
          },
        },
        { status: 400 }
      );
    }

    const validateResult = await PasswordResetService.validateToken(token);

    if (!validateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validateResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validateResult.data,
    });
  } catch (err) {
    console.error("Validate token API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Terjadi kesalahan server",
        },
      },
      { status: 500 }
    );
  }
}
