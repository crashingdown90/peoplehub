// @ai:cl - Admin Users API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AdminService } from "@/services/admin";

// GET /api/admin/users - List all users (IT_OPS/SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const role = searchParams.get("role") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));

    const result = await AdminService.getUsers(context, {
      status: status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | undefined,
      role: role as "EMPLOYEE" | "MANAGER" | "HRD" | "FINANCE" | "IT_OPS" | "SUPER_ADMIN" | undefined,
      search,
      page,
      limit,
    });

    if (!result.success) {
      const statusCode = result.error?.code === "FORBIDDEN" ? 403 : 500;
      return NextResponse.json(
        { success: false, error: { code: result.error?.code || "ERROR", message: result.error?.message } },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
