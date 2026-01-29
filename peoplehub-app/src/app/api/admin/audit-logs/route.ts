// @ai:cl - Admin Audit Logs API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AdminService } from "@/services/admin";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/audit-logs - List audit logs (IT_OPS/SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const objectType = searchParams.get("objectType") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await AdminService.getAuditLogs(context, {
      action,
      objectType,
      actorId,
      startDate,
      endDate,
      page,
      limit,
    });

    if (!result.success) {
      const statusCode = result.error?.code === "FORBIDDEN" ? 403 : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return handlePrismaError(error);
  }
}
