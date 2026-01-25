// @ai:cl - Report service for generating various reports
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  ErrorCodes,
  DateRangeFilter,
} from "../types";

// ==========================================
// TYPES
// ==========================================

export interface ReportFilter extends DateRangeFilter {
  departmentId?: string;
  branchId?: string;
  employeeId?: string;
}

export interface AttendanceReportRow {
  employeeNumber: string;
  employeeName: string;
  department: string;
  branch: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  workMode: string;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workHours: number | null;
  overtimeHours: number | null;
}

export interface LeaveReportRow {
  employeeNumber: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface PayrollReportRow {
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  tax: number;
  netSalary: number;
  status: string;
}

export interface EmployeeSummaryRow {
  employeeNumber: string;
  employeeName: string;
  email: string;
  department: string;
  position: string;
  branch: string;
  joinDate: string;
  status: string;
  manager: string | null;
}

export interface ReportResult<T> {
  data: T[];
  columns: string[];
  generatedAt: string;
  filter: ReportFilter;
  totalRows: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ReportService {
  /**
   * Generate attendance report
   */
  static async generateAttendanceReport(
    context: RequestContext,
    filter: ReportFilter
  ): Promise<ServiceResponse<ReportResult<AttendanceReportRow>>> {
    const { startDate, endDate, departmentId, branchId, employeeId } = filter;

    // Validate role
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke laporan ini");
    }

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.attendanceDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.attendanceDate = { lte: new Date(endDate) };
    }

    if (employeeId) {
      where.employeeId = employeeId;
    } else {
      // Filter by department or branch through employee relation
      const employeeWhere: Record<string, unknown> = {
        tenantId: context.tenantId,
      };
      if (departmentId) employeeWhere.departmentId = departmentId;
      if (branchId) employeeWhere.branchId = branchId;

      if (departmentId || branchId) {
        const employees = await prisma.employee.findMany({
          where: employeeWhere,
          select: { id: true },
        });
        where.employeeId = { in: employees.map((e) => e.id) };
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: [{ attendanceDate: "asc" }, { employeeId: "asc" }],
    });

    const data: AttendanceReportRow[] = attendances.map((att) => {
      // Calculate work hours from clockIn and clockOut
      let workHours: number | null = null;
      if (att.clockIn && att.clockOut) {
        workHours =
          (new Date(att.clockOut).getTime() - new Date(att.clockIn).getTime()) /
          (1000 * 60 * 60);
        workHours = Math.round(workHours * 100) / 100;
      }
      // Convert overtime minutes to hours
      const overtimeHours = att.overtimeMinutes > 0
        ? Math.round((att.overtimeMinutes / 60) * 100) / 100
        : null;

      return {
        employeeNumber: att.employee.employeeNumber,
        employeeName: att.employee.fullName,
        department: att.employee.department?.name || "-",
        branch: att.employee.branch?.name || "-",
        date: att.attendanceDate.toISOString().split("T")[0],
        clockIn: att.clockIn?.toISOString() || null,
        clockOut: att.clockOut?.toISOString() || null,
        workMode: att.workMode || "-",
        status: att.status,
        lateMinutes: att.lateMinutes,
        earlyLeaveMinutes: att.earlyLeaveMinutes,
        workHours,
        overtimeHours,
      };
    });

    const columns = [
      "Employee Number",
      "Employee Name",
      "Department",
      "Branch",
      "Date",
      "Clock In",
      "Clock Out",
      "Work Mode",
      "Status",
      "Late Minutes",
      "Early Leave Minutes",
      "Work Hours",
      "Overtime Hours",
    ];

    return success({
      data,
      columns,
      generatedAt: new Date().toISOString(),
      filter,
      totalRows: data.length,
    });
  }

  /**
   * Generate leave report
   */
  static async generateLeaveReport(
    context: RequestContext,
    filter: ReportFilter
  ): Promise<ServiceResponse<ReportResult<LeaveReportRow>>> {
    const { startDate, endDate, departmentId, employeeId } = filter;

    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke laporan ini");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { gte: new Date(startDate), lte: new Date(endDate) },
        },
        {
          endDate: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      ];
    }

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (departmentId) {
      const employees = await prisma.employee.findMany({
        where: { tenantId: context.tenantId, departmentId },
        select: { id: true },
      });
      where.employeeId = { in: employees.map((e) => e.id) };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch HRD approvers if any
    const hrdApproverIds = leaves
      .map((l) => l.approvedByHrdId)
      .filter((id): id is string => id !== null);
    const hrdApprovers =
      hrdApproverIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: hrdApproverIds } },
            select: { id: true, fullName: true },
          })
        : [];
    const approverMap = new Map(hrdApprovers.map((a) => [a.id, a.fullName]));

    const data: LeaveReportRow[] = leaves.map((leave) => ({
      employeeNumber: leave.employee.employeeNumber,
      employeeName: leave.employee.fullName,
      department: leave.employee.department?.name || "-",
      leaveType: leave.leaveType.name,
      startDate: leave.startDate.toISOString().split("T")[0],
      endDate: leave.endDate.toISOString().split("T")[0],
      totalDays: leave.totalDays,
      status: leave.status,
      reason: leave.reason || "-",
      requestedAt: leave.createdAt.toISOString(),
      approvedBy: leave.approvedByHrdId ? approverMap.get(leave.approvedByHrdId) || null : null,
      approvedAt: leave.hrdApprovedAt?.toISOString() || null,
    }));

    const columns = [
      "Employee Number",
      "Employee Name",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Total Days",
      "Status",
      "Reason",
      "Requested At",
      "Approved By",
      "Approved At",
    ];

    return success({
      data,
      columns,
      generatedAt: new Date().toISOString(),
      filter,
      totalRows: data.length,
    });
  }

  /**
   * Generate payroll report
   */
  static async generatePayrollReport(
    context: RequestContext,
    filter: ReportFilter & { period: string }
  ): Promise<ServiceResponse<ReportResult<PayrollReportRow>>> {
    const { period, departmentId, employeeId } = filter;

    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke laporan ini");
    }

    if (!period) {
      return error(ErrorCodes.VALIDATION_ERROR, "Period harus diisi (format: YYYY-MM)");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      period,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (departmentId) {
      const employees = await prisma.employee.findMany({
        where: { tenantId: context.tenantId, departmentId },
        select: { id: true },
      });
      where.employeeId = { in: employees.map((e) => e.id) };
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { fullName: "asc" } },
    });

    const data: PayrollReportRow[] = payslips.map((slip) => {
      // Calculate allowances from grossSalary - basicSalary - overtimeAmount - bonus
      const totalAllowances =
        Number(slip.grossSalary) -
        Number(slip.basicSalary) -
        Number(slip.overtimeAmount) -
        Number(slip.bonus);

      return {
        employeeNumber: slip.employee.employeeNumber,
        employeeName: slip.employee.fullName,
        department: slip.employee.department?.name || "-",
        position: slip.employee.position?.name || "-",
        period: slip.period,
        basicSalary: Number(slip.basicSalary),
        allowances: totalAllowances > 0 ? totalAllowances : 0,
        deductions: Number(slip.totalDeductions),
        overtime: Number(slip.overtimeAmount),
        tax: Number(slip.taxDeduction),
        netSalary: Number(slip.netSalary),
        status: slip.status,
      };
    });

    const columns = [
      "Employee Number",
      "Employee Name",
      "Department",
      "Position",
      "Period",
      "Basic Salary",
      "Allowances",
      "Deductions",
      "Overtime",
      "Tax",
      "Net Salary",
      "Status",
    ];

    return success({
      data,
      columns,
      generatedAt: new Date().toISOString(),
      filter,
      totalRows: data.length,
    });
  }

  /**
   * Generate employee summary report
   */
  static async generateEmployeeSummary(
    context: RequestContext,
    filter: ReportFilter
  ): Promise<ServiceResponse<ReportResult<EmployeeSummaryRow>>> {
    const { departmentId, branchId } = filter;

    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke laporan ini");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { email: true } },
        department: { select: { name: true } },
        position: { select: { name: true } },
        branch: { select: { name: true } },
        manager: { select: { fullName: true } },
      },
      orderBy: { fullName: "asc" },
    });

    const data: EmployeeSummaryRow[] = employees.map((emp) => ({
      employeeNumber: emp.employeeNumber,
      employeeName: emp.fullName,
      email: emp.user?.email || "-",
      department: emp.department?.name || "-",
      position: emp.position?.name || "-",
      branch: emp.branch?.name || "-",
      joinDate: emp.startDate?.toISOString().split("T")[0] || "-",
      status: emp.status,
      manager: emp.manager?.fullName || null,
    }));

    const columns = [
      "Employee Number",
      "Employee Name",
      "Email",
      "Department",
      "Position",
      "Branch",
      "Join Date",
      "Status",
      "Manager",
    ];

    return success({
      data,
      columns,
      generatedAt: new Date().toISOString(),
      filter,
      totalRows: data.length,
    });
  }

  // ==========================================
  // CSV EXPORT HELPERS
  // ==========================================

  /**
   * Convert report data to CSV format
   */
  static toCSV<T extends Record<string, unknown>>(
    result: ReportResult<T>
  ): string {
    const { data, columns } = result;

    if (data.length === 0) {
      return columns.join(",") + "\n";
    }

    // Get keys from first row
    const keys = Object.keys(data[0]);

    // CSV header
    const header = columns.join(",");

    // CSV rows
    const rows = data.map((row) => {
      return keys
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          // Escape quotes and wrap in quotes if contains comma or quote
          const str = String(value);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",");
    });

    return [header, ...rows].join("\n");
  }

  /**
   * Generate CSV file response headers
   */
  static getCSVHeaders(filename: string): Record<string, string> {
    return {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    };
  }

  // ==========================================
  // SUMMARY STATISTICS
  // ==========================================

  /**
   * Get attendance summary statistics
   */
  static async getAttendanceSummary(
    context: RequestContext,
    filter: ReportFilter
  ): Promise<
    ServiceResponse<{
      totalPresent: number;
      totalAbsent: number;
      totalLate: number;
      totalEarlyLeave: number;
      averageWorkHours: number;
    }>
  > {
    const { startDate, endDate, departmentId } = filter;

    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (departmentId) {
      const employees = await prisma.employee.findMany({
        where: { tenantId: context.tenantId, departmentId },
        select: { id: true },
      });
      where.employeeId = { in: employees.map((e) => e.id) };
    }

    const [
      totalPresent,
      totalLate,
      attendances,
    ] = await Promise.all([
      prisma.attendance.count({
        where: { ...where, status: { in: ["PRESENT", "LATE"] } },
      }),
      prisma.attendance.count({
        where: { ...where, status: "LATE" },
      }),
      prisma.attendance.findMany({
        where: { ...where, clockIn: { not: null }, clockOut: { not: null } },
        select: { clockIn: true, clockOut: true, earlyLeaveMinutes: true },
      }),
    ]);

    const totalEarlyLeave = attendances.filter((a) => a.earlyLeaveMinutes > 0).length;

    // Calculate work hours from clockIn and clockOut
    const totalWorkHours = attendances.reduce((sum, a) => {
      if (a.clockIn && a.clockOut) {
        const hours =
          (new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const averageWorkHours =
      attendances.length > 0 ? totalWorkHours / attendances.length : 0;

    // Calculate absent (expected - present)
    // This is simplified; real implementation would check schedules
    const totalAbsent = 0; // Would need schedule data

    return success({
      totalPresent,
      totalAbsent,
      totalLate,
      totalEarlyLeave,
      averageWorkHours: Math.round(averageWorkHours * 100) / 100,
    });
  }

  /**
   * Get leave summary statistics
   */
  static async getLeaveSummary(
    context: RequestContext,
    filter: ReportFilter
  ): Promise<
    ServiceResponse<{
      totalRequests: number;
      totalApproved: number;
      totalRejected: number;
      totalPending: number;
      totalDaysUsed: number;
      byType: { type: string; count: number; days: number }[];
    }>
  > {
    const { startDate, endDate, departmentId } = filter;

    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (departmentId) {
      const employees = await prisma.employee.findMany({
        where: { tenantId: context.tenantId, departmentId },
        select: { id: true },
      });
      where.employeeId = { in: employees.map((e) => e.id) };
    }

    const [
      totalRequests,
      totalApproved,
      totalRejected,
      totalPending,
      leavesByType,
    ] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.count({ where: { ...where, status: "APPROVED" } }),
      prisma.leaveRequest.count({ where: { ...where, status: "REJECTED" } }),
      prisma.leaveRequest.count({ where: { ...where, status: "PENDING" } }),
      prisma.leaveRequest.groupBy({
        by: ["leaveTypeId"],
        where: { ...where, status: "APPROVED" },
        _count: true,
        _sum: { totalDays: true },
      }),
    ]);

    // Get leave type names
    const leaveTypes = await prisma.leaveType.findMany({
      where: { id: { in: leavesByType.map((l) => l.leaveTypeId) } },
      select: { id: true, name: true },
    });

    const typeMap = new Map(leaveTypes.map((t) => [t.id, t.name]));

    const byType = leavesByType.map((l) => ({
      type: typeMap.get(l.leaveTypeId) || "Unknown",
      count: l._count,
      days: l._sum.totalDays || 0,
    }));

    const totalDaysUsed = byType.reduce((sum, t) => sum + t.days, 0);

    return success({
      totalRequests,
      totalApproved,
      totalRejected,
      totalPending,
      totalDaysUsed,
      byType,
    });
  }
}
