// @ai:cl - Email Verification API

import { NextRequest, NextResponse } from "next/server";
import { EmailVerifyService } from "@/services/auth/email-verify.service";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// ==========================================
// SCHEMAS
// ==========================================

const verifySchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
});

const resendSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

// ==========================================
// POST /api/auth/verify-email - Verify email
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Token tidak valid",
            details: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const verifyResult = await EmailVerifyService.verifyEmail(result.data.token);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verifyResult.data,
      message: "Email berhasil diverifikasi",
    });
  } catch (err) {
    console.error("Verify email API error:", err);
    return handlePrismaError(err);
  }
}

// ==========================================
// PUT /api/auth/verify-email - Resend verification email
// ==========================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);

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

    const resendResult = await EmailVerifyService.resendVerification(result.data.email);

    if (!resendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: resendResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resendResult.data,
      message: "Email verifikasi telah dikirim ulang",
    });
  } catch (err) {
    console.error("Resend verification API error:", err);
    return handlePrismaError(err);
  }
}
