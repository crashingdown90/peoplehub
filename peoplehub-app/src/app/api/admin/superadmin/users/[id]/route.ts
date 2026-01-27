// @ai:cl - SuperAdmin Single User API (CRUD by ID)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for updating a user
const UpdateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional().nullable(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
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

// GET /api/admin/superadmin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await checkSuperAdminAuth();
    if (error) return error;

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        phone: true,
        fullName: true,
        status: true,
        role: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        gender: true,
        birthPlace: true,
        birthDate: true,
        photoUrl: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        nik: true,
        npwp: true,
        address: true,
        ktpPhotoUrl: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        tenant: {
          select: {
            id: true,
            name: true,
            code: true,
            domain: true,
            isActive: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            employeeNumber: true,
            status: true,
            employmentType: true,
            startDate: true,
            endDate: true,
            department: {
              select: { id: true, name: true, code: true },
            },
            position: {
              select: { id: true, name: true, code: true, level: true },
            },
            branch: {
              select: { id: true, name: true, code: true },
            },
            manager: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Get user activity stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [loginCount, auditLogs, notifications] = await Promise.all([
      prisma.auditLog.count({
        where: {
          actorId: id,
          action: "LOGIN",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.auditLog.findMany({
        where: { actorId: id },
        select: {
          id: true,
          action: true,
          objectType: true,
          objectId: true,
          createdAt: true,
          ipAddress: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.notification.count({
        where: { userId: id, isRead: false },
      }),
    ]);

    // Get attendance stats if user is an employee
    let attendanceStats: { totalAttendanceThisMonth: number; lateCountThisMonth: number; pendingLeaveRequests: number } | null = null;
    if (user.employee) {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const [totalAttendance, lateAttendance, leaveRequests] = await Promise.all([
        prisma.attendance.count({
          where: {
            employeeId: user.employee.id,
            attendanceDate: { gte: currentMonth },
          },
        }),
        prisma.attendance.count({
          where: {
            employeeId: user.employee.id,
            attendanceDate: { gte: currentMonth },
            lateMinutes: { gt: 0 },
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId: user.employee.id,
            status: "PENDING",
          },
        }),
      ]);

      attendanceStats = {
        totalAttendanceThisMonth: totalAttendance,
        lateCountThisMonth: lateAttendance,
        pendingLeaveRequests: leaveRequests,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        activity: {
          loginCountLast30Days: loginCount,
          unreadNotifications: notifications,
          recentAuditLogs: auditLogs,
        },
        attendanceStats,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/superadmin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkSuperAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);

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

    const { fullName, email, phone, role, status } = validation.data;

    // Check for duplicate email (if changed)
    if (email !== undefined && email !== existingUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          tenantId: existingUser.tenantId,
          email,
          id: { not: id },
        },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE_EMAIL", message: "Email sudah digunakan di tenant ini" } },
          { status: 400 }
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        email: true,
        phone: true,
        fullName: true,
        status: true,
        role: true,
        updatedAt: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: existingUser.tenantId,
        actorId: context.userId,
        action: "UPDATE",
        objectType: "User",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify({
          fullName: existingUser.fullName,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          status: existingUser.status,
        })),
        afterData: JSON.parse(JSON.stringify({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT /api/admin/superadmin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/superadmin/users/[id] - Soft delete/suspend user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkSuperAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Prevent self-deletion
    if (id === context.userId) {
      return NextResponse.json(
        { success: false, error: { code: "CANNOT_DELETE_SELF", message: "Tidak dapat menonaktifkan akun sendiri" } },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Check if user is already suspended/deleted
    if (existingUser.status === "SUSPENDED" || existingUser.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_INACTIVE", message: "User sudah tidak aktif" } },
        { status: 400 }
      );
    }

    // Soft delete (suspend) the user
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: existingUser.tenantId,
        actorId: context.userId,
        action: "SUSPEND",
        objectType: "User",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify({ status: existingUser.status })),
        afterData: JSON.parse(JSON.stringify({ status: "SUSPENDED" })),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("DELETE /api/admin/superadmin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}

// PATCH /api/admin/superadmin/users/[id] - Reactivate user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, context } = await checkSuperAdminAuth();
    if (error || !context) return error;

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Check if user is suspended
    if (existingUser.status !== "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_SUSPENDED", message: "User tidak dalam status suspended" } },
        { status: 400 }
      );
    }

    // Reactivate the user
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: existingUser.tenantId,
        actorId: context.userId,
        action: "REACTIVATE",
        objectType: "User",
        objectId: id,
        beforeData: JSON.parse(JSON.stringify({ status: "SUSPENDED" })),
        afterData: JSON.parse(JSON.stringify({ status: "ACTIVE" })),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User berhasil diaktifkan kembali",
    });
  } catch (error) {
    console.error("PATCH /api/admin/superadmin/users/[id] error:", error);
    return handlePrismaError(error);
  }
}
