// @ai:cl - Admin Leave Types Management API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// Validation schema for creating/updating leave type
const LeaveTypeSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, "Code harus uppercase dan tanpa spasi"),
  name: z.string().min(2).max(100),
  defaultBalance: z.number().int().min(0).max(365),
  isPaid: z.boolean().default(true),
  requiresAttachment: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Helper to check HRD/Admin auth
async function checkAdminAuth() {
  const context = await getRequestContext();
  if (!context) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      ),
      context: null,
    };
  }

  // Only HRD, IT_OPS, or SUPER_ADMIN can manage leave types
  if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak. Hanya HRD yang dapat mengelola jenis cuti" } },
        { status: 403 }
      ),
      context: null,
    };
  }

  return { error: null, context };
}

// GET /api/admin/settings/leave-types - List all leave types (including inactive)
export async function GET(request: NextRequest) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const search = searchParams.get("search");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      tenantId: context.tenantId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    // Get usage statistics for each leave type
    const leaveTypeIds = leaveTypes.map(lt => lt.id);
    const usageCounts = await prisma.leaveRequest.groupBy({
      by: ["leaveTypeId"],
      where: {
        leaveTypeId: { in: leaveTypeIds },
      },
      _count: { id: true },
    });

    const usageMap = new Map(usageCounts.map(u => [u.leaveTypeId, u._count.id]));

    const enrichedLeaveTypes = leaveTypes.map(lt => ({
      ...lt,
      usageCount: usageMap.get(lt.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedLeaveTypes,
    });
  } catch (error) {
    console.error("GET /api/admin/settings/leave-types error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/leave-types - Create new leave type
export async function POST(request: NextRequest) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const body = await request.json();
    const validation = LeaveTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { code, name, defaultBalance, isPaid, requiresAttachment, isActive } = validation.data;

    // Check for duplicate code in same tenant
    const existingCode = await prisma.leaveType.findFirst({
      where: {
        tenantId: context.tenantId,
        code,
      },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_CODE", message: `Kode "${code}" sudah digunakan` } },
        { status: 400 }
      );
    }

    // Create leave type
    const leaveType = await prisma.leaveType.create({
      data: {
        tenantId: context.tenantId,
        code,
        name,
        defaultBalance,
        isPaid,
        requiresAttachment,
        isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "CREATE",
        objectType: "LeaveType",
        objectId: leaveType.id,
        afterData: JSON.parse(JSON.stringify(leaveType)),
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: `Jenis cuti "${name}" berhasil ditambahkan`,
    });
  } catch (error) {
    console.error("POST /api/admin/settings/leave-types error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
