// @ai:cl - Admin Single Holiday API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for update
const UpdateHolidaySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
  branchId: z.string().optional().nullable(),
  isNational: z.boolean().optional(),
});

// Helper to check admin auth
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

  if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      ),
      context: null,
    };
  }

  return { error: null, context };
}

// GET /api/admin/settings/holidays/[id] - Get single holiday
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    const holiday = await prisma.holiday.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!holiday) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Hari libur tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    console.error("GET /api/admin/settings/holidays/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/settings/holidays/[id] - Update holiday
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if exists
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Hari libur tidak ditemukan" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateHolidaySchema.safeParse(body);

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

    const { name, holidayDate, branchId, isNational } = validation.data;

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (holidayDate !== undefined) updateData.holidayDate = new Date(holidayDate);
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (isNational !== undefined) updateData.isNational = isNational;

    // Check for duplicate if date or branch changed
    if (holidayDate || branchId !== undefined) {
      const checkDate = holidayDate ? new Date(holidayDate) : existingHoliday.holidayDate;
      const checkBranchId = branchId !== undefined ? (branchId || null) : existingHoliday.branchId;

      const duplicate = await prisma.holiday.findFirst({
        where: {
          tenantId: context.tenantId,
          branchId: checkBranchId,
          holidayDate: checkDate,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE", message: "Hari libur pada tanggal tersebut sudah ada" } },
          { status: 400 }
        );
      }
    }

    // Update holiday
    const holiday = await prisma.holiday.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "UPDATE",
        objectType: "Holiday",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify(existingHoliday)),
        afterData: JSON.parse(JSON.stringify(holiday)),
      },
    });

    return NextResponse.json({
      success: true,
      data: holiday,
      message: `Hari libur "${holiday.name}" berhasil diperbarui`,
    });
  } catch (error) {
    console.error("PUT /api/admin/settings/holidays/[id] error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/settings/holidays/[id] - Delete holiday
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if exists
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Hari libur tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Delete holiday
    await prisma.holiday.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DELETE",
        objectType: "Holiday",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify(existingHoliday)),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Hari libur "${existingHoliday.name}" berhasil dihapus`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/settings/holidays/[id] error:", error);
    return handlePrismaError(error);
  }
}
