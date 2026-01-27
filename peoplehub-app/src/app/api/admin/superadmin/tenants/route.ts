// @ai:cl - SuperAdmin Tenant Management API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for creating a tenant
const CreateTenantSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  domain: z.string().min(3).max(100).optional().nullable(),
  code: z.string().min(2).max(20).optional().nullable(),
  branding: z
    .object({
      logo: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

// GET /api/admin/superadmin/tenants - List all tenants with detailed stats
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (context.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // "active" | "inactive" | "all"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.tenant.count({ where });

    // Get tenants with relations
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            branches: true,
            departments: true,
            positions: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get additional stats for each tenant
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [activeUsers, activeEmployees, todayAttendance, pendingApprovals] = await Promise.all([
          prisma.user.count({ where: { tenantId: tenant.id, status: "ACTIVE" } }),
          prisma.employee.count({ where: { tenantId: tenant.id, status: "ACTIVE" } }),
          prisma.attendance.count({ where: { tenantId: tenant.id, attendanceDate: today } }),
          prisma.leaveRequest.count({ where: { tenantId: tenant.id, status: "PENDING" } }),
        ]);

        return {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
          code: tenant.code,
          branding: tenant.branding,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          counts: {
            users: tenant._count.users,
            employees: tenant._count.employees,
            branches: tenant._count.branches,
            departments: tenant._count.departments,
            positions: tenant._count.positions,
            activeUsers,
            activeEmployees,
          },
          stats: {
            todayAttendance,
            pendingApprovals,
            attendanceRate: activeEmployees > 0 ? Math.round((todayAttendance / activeEmployees) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        tenants: tenantsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/tenants error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/admin/superadmin/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (context.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = CreateTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: validation.error.flatten(),
          }
        },
        { status: 400 }
      );
    }

    const { name, domain, code, branding, isActive } = validation.data;

    // Check for duplicate domain
    if (domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain },
      });
      if (existingDomain) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE_DOMAIN", message: "Domain sudah digunakan" } },
          { status: 400 }
        );
      }
    }

    // Check for duplicate code
    if (code) {
      const existingCode = await prisma.tenant.findUnique({
        where: { code },
      });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE_CODE", message: "Kode tenant sudah digunakan" } },
          { status: 400 }
        );
      }
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain: domain || null,
        code: code || null,
        branding: branding ? JSON.parse(JSON.stringify(branding)) : null,
        isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorId: context.userId,
        action: "CREATE",
        objectType: "Tenant",
        objectId: tenant.id,
        afterData: JSON.parse(JSON.stringify(tenant)),
      },
    });

    return NextResponse.json({
      success: true,
      data: tenant,
      message: "Tenant berhasil dibuat",
    });
  } catch (error) {
    console.error("POST /api/admin/superadmin/tenants error:", error);
    return handlePrismaError(error);
  }
}
