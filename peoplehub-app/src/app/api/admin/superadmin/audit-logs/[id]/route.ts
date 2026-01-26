// @ai:cl - SuperAdmin Single Audit Log API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";

// GET /api/admin/superadmin/audit-logs/[id] - Get single audit log detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Audit log tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: auditLog.tenantId },
      select: { id: true, name: true, code: true, domain: true },
    });

    // Get actor info if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actor: Record<string, any> | null = null;
    if (auditLog.actorId) {
      actor = await prisma.user.findUnique({
        where: { id: auditLog.actorId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          photoUrl: true,
        },
      });
    }

    // Get related object info based on objectType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let relatedObject: Record<string, any> | null = null;
    if (auditLog.objectId) {
      switch (auditLog.objectType) {
        case "User":
          relatedObject = await prisma.user.findUnique({
            where: { id: auditLog.objectId },
            select: { id: true, fullName: true, email: true, role: true, status: true },
          });
          break;
        case "Employee":
          relatedObject = await prisma.employee.findUnique({
            where: { id: auditLog.objectId },
            select: { id: true, fullName: true, employeeCode: true, status: true },
          });
          break;
        case "Tenant":
          relatedObject = await prisma.tenant.findUnique({
            where: { id: auditLog.objectId },
            select: { id: true, name: true, code: true, isActive: true },
          });
          break;
        case "Attendance":
          relatedObject = await prisma.attendance.findUnique({
            where: { id: auditLog.objectId },
            select: { id: true, attendanceDate: true, status: true },
          });
          break;
        case "LeaveRequest":
          relatedObject = await prisma.leaveRequest.findUnique({
            where: { id: auditLog.objectId },
            select: { id: true, startDate: true, endDate: true, status: true },
          });
          break;
        default:
          // For other object types, we'll just return the objectId
          relatedObject = { id: auditLog.objectId };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: auditLog.id,
        tenantId: auditLog.tenantId,
        tenant,
        actorId: auditLog.actorId,
        actor,
        action: auditLog.action,
        objectType: auditLog.objectType,
        objectId: auditLog.objectId,
        relatedObject,
        beforeData: auditLog.beforeData,
        afterData: auditLog.afterData,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/audit-logs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
