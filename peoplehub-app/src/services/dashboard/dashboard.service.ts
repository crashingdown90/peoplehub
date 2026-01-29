// @ai:cl - Dashboard service - aggregated stats per role
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes } from "../types";

// ==========================================
// TYPES
// ==========================================

export interface EmployeeDashboardStats {
  attendance: {
    presentThisMonth: number;
    lateThisMonth: number;
    absentThisMonth: number;
    lastClockIn: Date | null;
  };
  leave: {
    balance: number;
    pendingRequests: number;
    approvedThisYear: number;
  };
  kpi: {
    currentScore: number | null;
    completedTargets: number;
    totalTargets: number;
  };
  notifications: {
    unreadCount: number;
  };
}

export interface ManagerDashboardStats extends EmployeeDashboardStats {
  team: {
    totalMembers: number;
    presentToday: number;
    onLeaveToday: number;
  };
  approvals: {
    pendingLeave: number;
    pendingTravel: number;
    pendingReimburse: number;
    total: number;
  };
}

export interface AdminDashboardStats {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
  };
  attendance: {
    presentToday: number;
    lateToday: number;
    absentToday: number;
    attendanceRate: number;
  };
  approvals: {
    pendingLeave: number;
    pendingTravel: number;
    pendingReimburse: number;
    pendingRegistrations: number;
  };
  payroll: {
    pendingPayslips: number;
    publishedThisMonth: number;
  };
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class DashboardService {
  /**
   * Get dashboard stats based on role
   */
  static async getStats(
    context: RequestContext
  ): Promise<ServiceResponse<EmployeeDashboardStats | ManagerDashboardStats | AdminDashboardStats>> {
    switch (context.role) {
      case "EMPLOYEE":
        return this.getEmployeeStats(context);
      case "MANAGER":
        return this.getManagerStats(context);
      case "HRD":
      case "FINANCE":
      case "IT_OPS":
      case "SUPER_ADMIN":
        return this.getAdminStats(context);
      default:
        return error(ErrorCodes.FORBIDDEN, "Role tidak dikenali");
    }
  }

  /**
   * Get employee dashboard stats
   */
  static async getEmployeeStats(
    context: RequestContext
  ): Promise<ServiceResponse<EmployeeDashboardStats>> {
    if (!context.employeeId) {
      return error(ErrorCodes.NOT_FOUND, "Employee profile tidak ditemukan");
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get attendance stats
    const [attendanceStats, lastAttendance] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["status"],
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          attendanceDate: { gte: startOfMonth },
        },
        _count: { status: true },
      }),
      prisma.attendance.findFirst({
        where: withTenant(context, { employeeId: context.employeeId }),
        orderBy: { clockIn: "desc" },
        select: { clockIn: true },
      }),
    ]);

    const presentThisMonth = attendanceStats.find((s) => s.status === "PRESENT")?._count?.status || 0;
    const lateThisMonth = attendanceStats.find((s) => s.status === "LATE")?._count?.status || 0;
    const absentThisMonth = attendanceStats.find((s) => s.status === "ABSENT")?._count?.status || 0;

    // Get leave stats
    const [leaveBalance, pendingLeave, approvedLeave] = await Promise.all([
      prisma.leaveBalance.aggregate({
        where: withTenant(context, { employeeId: context.employeeId }),
        _sum: { remainingBalance: true },
      }),
      prisma.leaveRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          status: "PENDING",
        },
      }),
      prisma.leaveRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          status: "APPROVED",
          startDate: { gte: startOfYear },
        },
      }),
    ]);

    // Get KPI stats
    const activePeriod = await prisma.kpiPeriod.findFirst({
      where: { tenantId: context.tenantId, isActive: true },
    });

    const kpiStats = { currentScore: null as number | null, completedTargets: 0, totalTargets: 0 };

    if (activePeriod) {
      const targets = await prisma.kpiTarget.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId: context.employeeId,
          periodId: activePeriod.id,
        },
        select: { score: true, actualValue: true },
      });

      kpiStats.totalTargets = targets.length;
      kpiStats.completedTargets = targets.filter((t) => t.actualValue !== null).length;

      const scores = targets.filter((t) => t.score !== null).map((t) => Number(t.score));
      if (scores.length > 0) {
        kpiStats.currentScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
      }
    }

    // Get notification count
    const unreadCount = await prisma.notification.count({
      where: withTenant(context, { userId: context.userId, readAt: null }),
    });

    return success({
      attendance: {
        presentThisMonth,
        lateThisMonth,
        absentThisMonth,
        lastClockIn: lastAttendance?.clockIn || null,
      },
      leave: {
        balance: leaveBalance._sum.remainingBalance || 0,
        pendingRequests: pendingLeave,
        approvedThisYear: approvedLeave,
      },
      kpi: kpiStats,
      notifications: { unreadCount },
    });
  }

  /**
   * Get manager dashboard stats (includes team stats)
   */
  static async getManagerStats(
    context: RequestContext
  ): Promise<ServiceResponse<ManagerDashboardStats>> {
    // Get employee stats first
    const employeeStatsResult = await this.getEmployeeStats(context);
    if (!employeeStatsResult.success) {
      return employeeStatsResult as ServiceResponse<ManagerDashboardStats>;
    }

    const employeeStats = employeeStatsResult.data!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get subordinates
    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: context.employeeId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    // Get team attendance today
    const [presentToday, onLeaveToday] = await Promise.all([
      prisma.attendance.count({
        where: {
          tenantId: context.tenantId,
          employeeId: { in: subordinateIds },
          attendanceDate: today,
          status: { in: ["PRESENT", "LATE"] },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: { in: subordinateIds },
          status: "APPROVED",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
    ]);

    // Get pending approvals
    const [pendingLeave, pendingTravel, pendingReimburse] = await Promise.all([
      prisma.leaveRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
      prisma.travelRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
      prisma.reimburseRequest.count({
        where: {
          tenantId: context.tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
    ]);

    return success({
      ...employeeStats,
      team: {
        totalMembers: subordinateIds.length,
        presentToday,
        onLeaveToday,
      },
      approvals: {
        pendingLeave,
        pendingTravel,
        pendingReimburse,
        total: pendingLeave + pendingTravel + pendingReimburse,
      },
    });
  }

  /**
   * Get admin dashboard stats (company-wide)
   */
  static async getAdminStats(
    context: RequestContext
  ): Promise<ServiceResponse<AdminDashboardStats>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get employee counts
    const [totalEmployees, activeEmployees, terminatedEmployees] = await Promise.all([
      prisma.employee.count({ where: { tenantId: context.tenantId } }),
      prisma.employee.count({ where: { tenantId: context.tenantId, status: "ACTIVE" } }),
      prisma.employee.count({
        where: { tenantId: context.tenantId, status: { in: ["INACTIVE", "TERMINATED"] } },
      }),
    ]);

    // Get today's attendance
    const [presentToday, lateToday, attendanceToday] = await Promise.all([
      prisma.attendance.count({
        where: { tenantId: context.tenantId, attendanceDate: today, status: "PRESENT" },
      }),
      prisma.attendance.count({
        where: { tenantId: context.tenantId, attendanceDate: today, status: "LATE" },
      }),
      prisma.attendance.count({
        where: { tenantId: context.tenantId, attendanceDate: today },
      }),
    ]);

    const attendanceRate = activeEmployees > 0
      ? Math.round((attendanceToday / activeEmployees) * 100)
      : 0;

    // Get on leave today
    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        tenantId: context.tenantId,
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    // Get pending approvals
    const [pendingLeave, pendingTravel, pendingReimburse, pendingRegistrations] = await Promise.all([
      prisma.leaveRequest.count({
        where: { tenantId: context.tenantId, status: "PENDING" },
      }),
      prisma.travelRequest.count({
        where: { tenantId: context.tenantId, status: "PENDING" },
      }),
      prisma.reimburseRequest.count({
        where: { tenantId: context.tenantId, status: "PENDING" },
      }),
      prisma.user.count({
        where: { tenantId: context.tenantId, status: "PENDING" },
      }),
    ]);

    // Get payroll stats
    const [pendingPayslips, publishedPayslips] = await Promise.all([
      prisma.payslip.count({
        where: { tenantId: context.tenantId, status: "DRAFT" },
      }),
      prisma.payslip.count({
        where: {
          tenantId: context.tenantId,
          status: "PUBLISHED",
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return success({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        onLeave: onLeaveToday,
        terminated: terminatedEmployees,
      },
      attendance: {
        presentToday,
        lateToday,
        absentToday: activeEmployees - attendanceToday - onLeaveToday,
        attendanceRate,
      },
      approvals: {
        pendingLeave,
        pendingTravel,
        pendingReimburse,
        pendingRegistrations,
      },
      payroll: {
        pendingPayslips,
        publishedThisMonth: publishedPayslips,
      },
    });
  }
}
