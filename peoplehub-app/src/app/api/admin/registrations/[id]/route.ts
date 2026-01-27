// @ai:cl - Admin Registration by ID API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AdminService } from "@/services/admin";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for registration action
const RegistrationActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/registrations/[id] - Approve or reject registration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = RegistrationActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;

    let result;
    if (action === "approve") {
      result = await AdminService.approveRegistration(context, id);
    } else {
      result = await AdminService.rejectRegistration(context, id, reason);
    }

    if (!result.success) {
      const statusCode =
        result.error?.code === "FORBIDDEN"
          ? 403
          : result.error?.code === "NOT_FOUND"
            ? 404
            : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: action === "approve" ? "Pendaftaran disetujui" : "Pendaftaran ditolak",
    });
  } catch (error) {
    console.error("PUT /api/admin/registrations/[id] error:", error);
    return handlePrismaError(error);
  }
}
