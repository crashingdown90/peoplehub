// @ai:cl - Admin User by ID API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AdminService } from "@/services/admin";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for updating user
const UpdateUserSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await AdminService.getUserById(context, id);

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
    });
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/users/[id] - Update user (IT_OPS/SUPER_ADMIN)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const result = await AdminService.updateUser(context, id, validation.data);

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
    });
  } catch (error) {
    console.error("PUT /api/admin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}
