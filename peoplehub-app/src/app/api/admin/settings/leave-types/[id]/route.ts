// @ai:cl - Admin Single Leave Type API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for updating leave type
const UpdateLeaveTypeSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, "Code harus uppercase dan tanpa spasi").optional(),
  name: z.string().min(2).max(100).optional(),
  defaultBalance: z.number().int().min(0).max(365).optional(),
  isPaid: z.boolean().optional(),
  requiresAttachment: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

// GET /api/admin/settings/leave-types/[id] - Get single leave type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Jenis cuti tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Get usage statistics
    const [totalRequests, approvedRequests, pendingRequests] = await Promise.all([
      prisma.leaveRequest.count({
        where: { leaveTypeId: id },
      }),
      prisma.leaveRequest.count({
        where: { leaveTypeId: id, status: "APPROVED" },
      }),
      prisma.leaveRequest.count({
        where: { leaveTypeId: id, status: "PENDING" },
      }),
    ]);

    // Get employees using this leave type
    const employeesWithBalance = await prisma.leaveBalance.count({
      where: { leaveTypeId: id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...leaveType,
        statistics: {
          totalRequests,
          approvedRequests,
          pendingRequests,
          employeesWithBalance,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings/leave-types/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/settings/leave-types/[id] - Update leave type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Jenis cuti tidak ditemukan" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateLeaveTypeSchema.safeParse(body);

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

    // Check for duplicate code (if changed)
    if (code !== undefined && code !== existingLeaveType.code) {
      const existingCode = await prisma.leaveType.findFirst({
        where: {
          tenantId: context.tenantId,
          code,
          id: { not: id },
        },
      });

      if (existingCode) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE_CODE", message: `Kode "${code}" sudah digunakan` } },
          { status: 400 }
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (defaultBalance !== undefined) updateData.defaultBalance = defaultBalance;
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (requiresAttachment !== undefined) updateData.requiresAttachment = requiresAttachment;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update leave type
    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "UPDATE",
        objectType: "LeaveType",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify(existingLeaveType)),
        afterData: JSON.parse(JSON.stringify(leaveType)),
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: `Jenis cuti "${leaveType.name}" berhasil diperbarui`,
    });
  } catch (error) {
    console.error("PUT /api/admin/settings/leave-types/[id] error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/settings/leave-types/[id] - Soft delete leave type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Jenis cuti tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Check if leave type is already inactive
    if (!existingLeaveType.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_INACTIVE", message: "Jenis cuti sudah tidak aktif" } },
        { status: 400 }
      );
    }

    // Check for pending leave requests using this type
    const pendingRequests = await prisma.leaveRequest.count({
      where: {
        leaveTypeId: id,
        status: "PENDING",
      },
    });

    if (pendingRequests > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "HAS_PENDING_REQUESTS",
            message: `Tidak dapat menonaktifkan jenis cuti ini karena masih ada ${pendingRequests} pengajuan cuti yang pending`,
          },
        },
        { status: 400 }
      );
    }

    // Soft delete (deactivate) the leave type
    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DEACTIVATE",
        objectType: "LeaveType",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify({ isActive: true })),
        afterData: JSON.parse(JSON.stringify({ isActive: false })),
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: `Jenis cuti "${leaveType.name}" berhasil dinonaktifkan`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/settings/leave-types/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PATCH /api/admin/settings/leave-types/[id] - Reactivate leave type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Jenis cuti tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Check if leave type is inactive
    if (existingLeaveType.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_ACTIVE", message: "Jenis cuti sudah aktif" } },
        { status: 400 }
      );
    }

    // Reactivate the leave type
    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: { isActive: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "REACTIVATE",
        objectType: "LeaveType",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify({ isActive: false })),
        afterData: JSON.parse(JSON.stringify({ isActive: true })),
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: `Jenis cuti "${leaveType.name}" berhasil diaktifkan kembali`,
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings/leave-types/[id] error:", error);
    return handlePrismaError(error);
  }
}
