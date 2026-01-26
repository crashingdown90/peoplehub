// @ai:cl - Admin Holidays Management API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// Validation schema
const HolidaySchema = z.object({
  name: z.string().min(2).max(100),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  branchId: z.string().optional().nullable(),
  isNational: z.boolean().default(false),
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

// GET /api/admin/settings/holidays - List all holidays
export async function GET(request: NextRequest) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const branchId = searchParams.get("branchId");
    const isNational = searchParams.get("isNational");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      tenantId: context.tenantId,
    };

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.holidayDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (isNational !== null && isNational !== undefined) {
      where.isNational = isNational === "true";
    }

    const holidays = await prisma.holiday.findMany({
      where,
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { holidayDate: "asc" },
    });

    // Get branches for filter dropdown
    const branches = await prisma.branch.findMany({
      where: { tenantId: context.tenantId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        holidays,
        branches,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings/holidays error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/holidays - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const body = await request.json();
    const validation = HolidaySchema.safeParse(body);

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
    const parsedDate = new Date(holidayDate);

    // Check for duplicate
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        tenantId: context.tenantId,
        branchId: branchId || null,
        holidayDate: parsedDate,
      },
    });

    if (existingHoliday) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "Hari libur pada tanggal tersebut sudah ada" } },
        { status: 400 }
      );
    }

    // Create holiday
    const holiday = await prisma.holiday.create({
      data: {
        tenantId: context.tenantId,
        name,
        holidayDate: parsedDate,
        branchId: branchId || null,
        isNational,
      },
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
        action: "CREATE",
        objectType: "Holiday",
        objectId: holiday.id,
        afterData: JSON.parse(JSON.stringify(holiday)),
      },
    });

    return NextResponse.json({
      success: true,
      data: holiday,
      message: `Hari libur "${name}" berhasil ditambahkan`,
    });
  } catch (error) {
    console.error("POST /api/admin/settings/holidays error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
