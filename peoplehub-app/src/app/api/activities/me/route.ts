// @ai:cl - My Activities API - Get current user's activity history
// Aggregates data from attendance, leave, reimbursement, etc.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface ActivityItem {
  id: string;
  type: "attendance" | "leave" | "reimbursement" | "overtime";
  title: string;
  description?: string;
  timestamp: Date;
  status?: "success" | "pending" | "rejected";
  metadata?: Record<string, unknown>;
}

// GET /api/activities/me - Get my activity history
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // filter by type

    const activities: ActivityItem[] = [];

    // 1. Get Attendance Records (last 30 days)
    if (!type || type === "attendance") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendances = await prisma.attendance.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          attendanceDate: { gte: thirtyDaysAgo },
        },
        orderBy: { attendanceDate: "desc" },
        take: 50,
      });

      for (const att of attendances) {
        // Clock In activity
        if (att.clockIn) {
          activities.push({
            id: `att-in-${att.id}`,
            type: "attendance",
            title: "Clock In",
            description: `${att.workMode} - ${att.status === "LATE" ? `Terlambat ${att.lateMinutes} menit` : "Tepat Waktu"}`,
            timestamp: att.clockIn,
            status: att.status === "LATE" ? "pending" : "success",
            metadata: {
              attendanceId: att.id,
              workMode: att.workMode,
              lateMinutes: att.lateMinutes,
            },
          });
        }

        // Clock Out activity
        if (att.clockOut) {
          activities.push({
            id: `att-out-${att.id}`,
            type: "attendance",
            title: "Clock Out",
            description: att.overtimeMinutes > 0
              ? `Lembur ${att.overtimeMinutes} menit`
              : att.earlyLeaveMinutes > 0
                ? `Pulang lebih awal ${att.earlyLeaveMinutes} menit`
                : "Selesai bekerja",
            timestamp: att.clockOut,
            status: "success",
            metadata: {
              attendanceId: att.id,
              overtimeMinutes: att.overtimeMinutes,
              earlyLeaveMinutes: att.earlyLeaveMinutes,
            },
          });
        }
      }
    }

    // 2. Get Leave Requests
    if (!type || type === "leave") {
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          leaveType: { select: { name: true } },
        },
      });

      for (const leave of leaveRequests) {
        const statusMap: Record<string, "success" | "pending" | "rejected"> = {
          PENDING: "pending",
          APPROVED_MANAGER: "pending",
          APPROVED_HRD: "pending",
          APPROVED: "success",
          REJECTED: "rejected",
          CANCELLED: "rejected",
        };

        activities.push({
          id: `leave-${leave.id}`,
          type: "leave",
          title: `Pengajuan Cuti ${leave.leaveType.name}`,
          description: `${leave.totalDays} hari (${formatDate(leave.startDate)} - ${formatDate(leave.endDate)})`,
          timestamp: leave.createdAt,
          status: statusMap[leave.status] || "pending",
          metadata: {
            leaveId: leave.id,
            leaveType: leave.leaveType.name,
            totalDays: leave.totalDays,
            startDate: leave.startDate,
            endDate: leave.endDate,
            approvalStatus: leave.status,
          },
        });
      }
    }

    // 3. Get Reimbursement Requests
    if (!type || type === "reimbursement") {
      const reimburseRequests = await prisma.reimburseRequest.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      for (const reimburse of reimburseRequests) {
        const statusMap: Record<string, "success" | "pending" | "rejected"> = {
          PENDING: "pending",
          APPROVED_MANAGER: "pending",
          APPROVED_HRD: "pending",
          APPROVED: "success",
          REJECTED: "rejected",
          CANCELLED: "rejected",
        };

        activities.push({
          id: `reimburse-${reimburse.id}`,
          type: "reimbursement",
          title: `Pengajuan Reimburse - ${reimburse.category}`,
          description: `Rp ${Number(reimburse.totalAmount).toLocaleString("id-ID")}`,
          timestamp: reimburse.createdAt,
          status: statusMap[reimburse.status] || "pending",
          metadata: {
            reimburseId: reimburse.id,
            category: reimburse.category,
            totalAmount: reimburse.totalAmount,
            approvalStatus: reimburse.status,
          },
        });
      }
    }

    // 4. Get Overtime Requests (if exists)
    if (!type || type === "overtime") {
      const overtimeRequests = await prisma.overtimeRequest.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      for (const overtime of overtimeRequests) {
        const statusMap: Record<string, "success" | "pending" | "rejected"> = {
          PENDING: "pending",
          APPROVED_MANAGER: "pending",
          APPROVED_HRD: "pending",
          APPROVED: "success",
          REJECTED: "rejected",
          CANCELLED: "rejected",
        };

        activities.push({
          id: `overtime-${overtime.id}`,
          type: "overtime",
          title: "Pengajuan Lembur",
          description: `${formatDate(overtime.overtimeDate)} - ${overtime.plannedHours} jam`,
          timestamp: overtime.createdAt,
          status: statusMap[overtime.status] || "pending",
          metadata: {
            overtimeId: overtime.id,
            overtimeDate: overtime.overtimeDate,
            plannedHours: overtime.plannedHours,
            approvalStatus: overtime.status,
          },
        });
      }
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const total = activities.length;
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedActivities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my activities error:", error);
    return handlePrismaError(error);
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
