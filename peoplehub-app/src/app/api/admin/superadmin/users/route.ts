// @ai:cl - SuperAdmin User Management API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";

// GET /api/admin/superadmin/users - List all users across tenants
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
    const tenantId = searchParams.get("tenantId");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      deletedAt: null, // Exclude soft-deleted users
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with tenant info
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        email: true,
        phone: true,
        fullName: true,
        status: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        photoUrl: true,
        tenant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            employeeNumber: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
            branch: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get summary stats
    const [totalUsers, activeUsers, pendingUsers, suspendedUsers] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.user.count({ where: { deletedAt: null, status: "PENDING" } }),
      prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    ]);

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ["role"],
      where: { deletedAt: null },
      _count: { role: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalUsers,
          activeUsers,
          pendingUsers,
          suspendedUsers,
          roleDistribution: roleDistribution.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/users error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
