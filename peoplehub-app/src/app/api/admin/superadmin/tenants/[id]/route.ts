// @ai:cl - SuperAdmin Single Tenant API (CRUD by ID)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { z } from "zod";

// Validation schema for updating a tenant
const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().min(3).max(100).optional().nullable(),
  code: z.string().min(2).max(20).optional().nullable(),
  branding: z
    .object({
      logo: z.string().url().optional().nullable(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// Helper to check auth
async function checkSuperAdminAuth() {
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

  if (context.role !== "SUPER_ADMIN") {
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

// GET /api/admin/superadmin/tenants/[id] - Get single tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await checkSuperAdminAuth();
    if (error) return error;

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            branches: true,
            departments: true,
            positions: true,
            shifts: true,
            leaveTypes: true,
            holidays: true,
            announcements: true,
          },
        },
        branches: {
          select: { id: true, name: true, code: true, isActive: true },
          take: 10,
        },
        departments: {
          select: { id: true, name: true, code: true },
          take: 10,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tenant tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Get additional statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      activeUsers,
      activeEmployees,
      todayAttendance,
      pendingLeaves,
      pendingCorrections,
      monthlyLogins,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId: id, status: "ACTIVE" } }),
      prisma.employee.count({ where: { tenantId: id, status: "ACTIVE" } }),
      prisma.attendance.count({ where: { tenantId: id, attendanceDate: today } }),
      prisma.leaveRequest.count({ where: { tenantId: id, status: "PENDING" } }),
      prisma.attendanceCorrection.count({ where: { tenantId: id, status: "PENDING" } }),
      prisma.auditLog.count({
        where: { tenantId: id, action: "LOGIN", createdAt: { gte: monthStart } },
      }),
      prisma.user.findMany({
        where: { tenantId: id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        code: tenant.code,
        branding: tenant.branding,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        counts: tenant._count,
        stats: {
          activeUsers,
          activeEmployees,
          todayAttendance,
          attendanceRate: activeEmployees > 0 ? Math.round((todayAttendance / activeEmployees) * 100) : 0,
          pendingApprovals: pendingLeaves + pendingCorrections,
          monthlyLogins,
        },
        branches: tenant.branches,
        departments: tenant.departments,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/tenants/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

// PUT /api/admin/superadmin/tenants/[id] - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkSuperAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tenant tidak ditemukan" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateTenantSchema.safeParse(body);

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

    // Check for duplicate domain (if changed)
    if (domain !== undefined && domain !== existingTenant.domain) {
      if (domain) {
        const existingDomain = await prisma.tenant.findFirst({
          where: { domain, id: { not: id } },
        });
        if (existingDomain) {
          return NextResponse.json(
            { success: false, error: { code: "DUPLICATE_DOMAIN", message: "Domain sudah digunakan" } },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate code (if changed)
    if (code !== undefined && code !== existingTenant.code) {
      if (code) {
        const existingCode = await prisma.tenant.findFirst({
          where: { code, id: { not: id } },
        });
        if (existingCode) {
          return NextResponse.json(
            { success: false, error: { code: "DUPLICATE_CODE", message: "Kode tenant sudah digunakan" } },
            { status: 400 }
          );
        }
      }
    }

    // Build update data dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (code !== undefined) updateData.code = code;
    if (branding !== undefined) updateData.branding = branding ? JSON.parse(JSON.stringify(branding)) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: context.userId,
        action: "UPDATE",
        objectType: "Tenant",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify(existingTenant)),
        afterData: JSON.parse(JSON.stringify(tenant)),
      },
    });

    return NextResponse.json({
      success: true,
      data: tenant,
      message: "Tenant berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT /api/admin/superadmin/tenants/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/superadmin/tenants/[id] - Delete tenant (soft delete via isActive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkSuperAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tenant tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Prevent deleting tenant with active users/employees
    if (existingTenant._count.users > 0 || existingTenant._count.employees > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CANNOT_DELETE",
            message: `Tenant tidak dapat dihapus karena masih memiliki ${existingTenant._count.users} user dan ${existingTenant._count.employees} karyawan. Nonaktifkan tenant terlebih dahulu.`,
          }
        },
        { status: 400 }
      );
    }

    // Soft delete (deactivate) instead of hard delete
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: context.userId,
        action: "DELETE",
        objectType: "Tenant",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify(existingTenant)),
        afterData: JSON.parse(JSON.stringify({ isActive: false })),
      },
    });

    return NextResponse.json({
      success: true,
      data: tenant,
      message: "Tenant berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("DELETE /api/admin/superadmin/tenants/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
