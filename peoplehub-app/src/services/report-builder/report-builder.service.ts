// @ai:cl - Report Builder Service for custom report generation
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export type ReportType =
  | "ATTENDANCE"
  | "LEAVE"
  | "PAYROLL"
  | "EMPLOYEE"
  | "KPI"
  | "TRAVEL"
  | "REIMBURSE"
  | "CUSTOM";

export type ReportFormat = "JSON" | "CSV" | "EXCEL" | "PDF";

export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";

export interface ReportColumn {
  field: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "currency";
  format?: string;
  width?: number;
}

export interface ReportFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "between";
  value: unknown;
}

export interface ReportConfig {
  type: ReportType;
  name: string;
  description?: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: { field: string; order: "asc" | "desc" }[];
  aggregations?: { field: string; function: "sum" | "avg" | "count" | "min" | "max" }[];
}

export interface GenerateReportInput {
  configId?: string;
  config?: ReportConfig;
  dateRange?: { startDate: string; endDate: string };
  format?: ReportFormat;
  branchId?: string;
  departmentId?: string;
}

export interface ScheduleReportInput {
  configId: string;
  frequency: ScheduleFrequency;
  recipients: string[]; // Email addresses
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:mm
  format: ReportFormat;
}

export interface SavedReport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  config: ReportConfig;
  createdById: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  id: string;
  tenantId: string;
  reportId: string;
  frequency: ScheduleFrequency;
  recipients: string[];
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  format: ReportFormat;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  generatedBy: string;
  dateRange?: { startDate: string; endDate: string };
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  totalRows: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ReportBuilderService {
  /**
   * Generate a report based on config
   */
  static async generate(
    context: RequestContext,
    input: GenerateReportInput
  ): Promise<ServiceResponse<ReportData>> {
    // Check access
    if (!["HRD", "FINANCE", "MANAGER", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat laporan");
    }

    let config: ReportConfig;

    if (input.configId) {
      // Load saved config
      const savedConfig = await this.getSavedReport(context.tenantId, input.configId);
      if (!savedConfig) {
        return error(ErrorCodes.NOT_FOUND, "Konfigurasi laporan tidak ditemukan");
      }
      config = savedConfig.config;
    } else if (input.config) {
      config = input.config;
    } else {
      return error(ErrorCodes.VALIDATION_ERROR, "Konfigurasi laporan diperlukan");
    }

    try {
      const data = await this.executeReport(context, config, input);

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: context.tenantId,
          actorId: context.userId,
          action: "REPORT_GENERATED",
          objectType: "Report",
          afterData: JSON.parse(JSON.stringify({
            type: config.type,
            name: config.name,
            rowCount: data.rows.length,
          })),
        },
      });

      return success(data);
    } catch (err) {
      console.error("Report generation error:", err);
      return error(
        ErrorCodes.INTERNAL_ERROR,
        `Gagal membuat laporan: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  /**
   * Save a report configuration
   */
  static async saveConfig(
    context: RequestContext,
    config: ReportConfig,
    isPublic = false
  ): Promise<ServiceResponse<SavedReport>> {
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk menyimpan konfigurasi");
    }

    const savedReport: SavedReport = {
      id: `rpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: context.tenantId,
      name: config.name,
      description: config.description,
      config,
      createdById: context.userId,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in audit log (in production, use a dedicated table)
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "REPORT_CONFIG_SAVED",
        objectType: "ReportConfig",
        objectId: savedReport.id,
        afterData: savedReport as unknown as Prisma.InputJsonValue,
      },
    });

    return success(savedReport);
  }

  /**
   * Get saved reports
   */
  static async getSavedReports(
    context: RequestContext,
    filter?: { type?: ReportType; search?: string } & PaginationParams
  ): Promise<ServiceResponse<SavedReport[]>> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "REPORT_CONFIG_SAVED",
      },
      orderBy: { createdAt: "desc" },
    });

    let reports: SavedReport[] = logs.map((log) => log.afterData as unknown as SavedReport);

    // Filter by visibility
    reports = reports.filter((r) => r.isPublic || r.createdById === context.userId);

    if (filter?.type) {
      reports = reports.filter((r) => r.config.type === filter.type);
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search)
      );
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const start = (page - 1) * limit;
    const paginatedReports = reports.slice(start, start + limit);

    return success(paginatedReports, {
      page,
      limit,
      total: reports.length,
      totalPages: Math.ceil(reports.length / limit),
    });
  }

  /**
   * Delete a saved report
   */
  static async deleteConfig(
    context: RequestContext,
    reportId: string
  ): Promise<ServiceResponse<void>> {
    const report = await this.getSavedReport(context.tenantId, reportId);

    if (!report) {
      return error(ErrorCodes.NOT_FOUND, "Laporan tidak ditemukan");
    }

    if (report.createdById !== context.userId && !["SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat menghapus laporan ini");
    }

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "REPORT_CONFIG_DELETED",
        objectType: "ReportConfig",
        objectId: reportId,
      },
    });

    return success(undefined);
  }

  /**
   * Schedule a report
   */
  static async scheduleReport(
    context: RequestContext,
    input: ScheduleReportInput
  ): Promise<ServiceResponse<ReportSchedule>> {
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk menjadwalkan laporan");
    }

    const report = await this.getSavedReport(context.tenantId, input.configId);
    if (!report) {
      return error(ErrorCodes.NOT_FOUND, "Konfigurasi laporan tidak ditemukan");
    }

    const nextRunAt = this.calculateNextRun(input);

    const schedule: ReportSchedule = {
      id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: context.tenantId,
      reportId: input.configId,
      frequency: input.frequency,
      recipients: input.recipients,
      dayOfWeek: input.dayOfWeek,
      dayOfMonth: input.dayOfMonth,
      time: input.time || "08:00",
      format: input.format,
      isActive: true,
      nextRunAt,
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "REPORT_SCHEDULED",
        objectType: "ReportSchedule",
        objectId: schedule.id,
        afterData: schedule as unknown as Prisma.InputJsonValue,
      },
    });

    return success(schedule);
  }

  /**
   * Get available report templates
   */
  static getTemplates(): ServiceResponse<Array<{
    type: ReportType;
    name: string;
    description: string;
    columns: ReportColumn[];
  }>> {
    const templates = [
      {
        type: "ATTENDANCE" as ReportType,
        name: "Laporan Kehadiran",
        description: "Rekap kehadiran karyawan",
        columns: [
          { field: "employeeNumber", label: "NIK", type: "string" as const },
          { field: "employeeName", label: "Nama", type: "string" as const },
          { field: "department", label: "Departemen", type: "string" as const },
          { field: "attendanceDate", label: "Tanggal", type: "date" as const },
          { field: "clockIn", label: "Jam Masuk", type: "string" as const },
          { field: "clockOut", label: "Jam Keluar", type: "string" as const },
          { field: "status", label: "Status", type: "string" as const },
          { field: "lateMinutes", label: "Keterlambatan (menit)", type: "number" as const },
          { field: "overtimeMinutes", label: "Lembur (menit)", type: "number" as const },
        ],
      },
      {
        type: "LEAVE" as ReportType,
        name: "Laporan Cuti",
        description: "Rekap pengajuan dan saldo cuti",
        columns: [
          { field: "employeeNumber", label: "NIK", type: "string" as const },
          { field: "employeeName", label: "Nama", type: "string" as const },
          { field: "leaveType", label: "Jenis Cuti", type: "string" as const },
          { field: "startDate", label: "Tanggal Mulai", type: "date" as const },
          { field: "endDate", label: "Tanggal Selesai", type: "date" as const },
          { field: "totalDays", label: "Jumlah Hari", type: "number" as const },
          { field: "status", label: "Status", type: "string" as const },
          { field: "balance", label: "Sisa Cuti", type: "number" as const },
        ],
      },
      {
        type: "PAYROLL" as ReportType,
        name: "Laporan Payroll",
        description: "Rekap penggajian karyawan",
        columns: [
          { field: "employeeNumber", label: "NIK", type: "string" as const },
          { field: "employeeName", label: "Nama", type: "string" as const },
          { field: "period", label: "Periode", type: "string" as const },
          { field: "basicSalary", label: "Gaji Pokok", type: "currency" as const },
          { field: "allowances", label: "Tunjangan", type: "currency" as const },
          { field: "overtime", label: "Lembur", type: "currency" as const },
          { field: "deductions", label: "Potongan", type: "currency" as const },
          { field: "netSalary", label: "Gaji Bersih", type: "currency" as const },
        ],
      },
      {
        type: "EMPLOYEE" as ReportType,
        name: "Laporan Karyawan",
        description: "Data master karyawan",
        columns: [
          { field: "employeeNumber", label: "NIK", type: "string" as const },
          { field: "fullName", label: "Nama Lengkap", type: "string" as const },
          { field: "email", label: "Email", type: "string" as const },
          { field: "branch", label: "Cabang", type: "string" as const },
          { field: "department", label: "Departemen", type: "string" as const },
          { field: "position", label: "Jabatan", type: "string" as const },
          { field: "startDate", label: "Tanggal Masuk", type: "date" as const },
          { field: "employmentType", label: "Status Kerja", type: "string" as const },
          { field: "status", label: "Status", type: "string" as const },
        ],
      },
      {
        type: "KPI" as ReportType,
        name: "Laporan KPI",
        description: "Pencapaian KPI karyawan",
        columns: [
          { field: "employeeNumber", label: "NIK", type: "string" as const },
          { field: "employeeName", label: "Nama", type: "string" as const },
          { field: "period", label: "Periode", type: "string" as const },
          { field: "indicator", label: "Indikator", type: "string" as const },
          { field: "target", label: "Target", type: "number" as const },
          { field: "actual", label: "Aktual", type: "number" as const },
          { field: "score", label: "Skor", type: "number" as const },
          { field: "achievement", label: "Pencapaian (%)", type: "number" as const },
        ],
      },
    ];

    return success(templates);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Execute report query
   */
  private static async executeReport(
    context: RequestContext,
    config: ReportConfig,
    input: GenerateReportInput
  ): Promise<ReportData> {
    let rows: Record<string, unknown>[] = [];
    const summary: Record<string, unknown> = {};

    // Build base where clause
    const baseWhere: Record<string, unknown> = { tenantId: context.tenantId };
    if (input.branchId) baseWhere.branchId = input.branchId;
    if (input.departmentId) baseWhere.departmentId = input.departmentId;

    switch (config.type) {
      case "ATTENDANCE":
        rows = await this.queryAttendance(context.tenantId, input, config, baseWhere);
        break;
      case "LEAVE":
        rows = await this.queryLeave(context.tenantId, input, config, baseWhere);
        break;
      case "PAYROLL":
        rows = await this.queryPayroll(context.tenantId, input, config, baseWhere);
        break;
      case "EMPLOYEE":
        rows = await this.queryEmployee(context.tenantId, config, baseWhere);
        break;
      case "KPI":
        rows = await this.queryKpi(context.tenantId, input, config, baseWhere);
        break;
      default:
        throw new Error(`Tipe laporan "${config.type}" belum didukung`);
    }

    // Apply aggregations
    if (config.aggregations) {
      for (const agg of config.aggregations) {
        const values = rows.map((r) => Number(r[agg.field]) || 0);
        switch (agg.function) {
          case "sum":
            summary[`${agg.field}_sum`] = values.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            summary[`${agg.field}_avg`] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case "count":
            summary[`${agg.field}_count`] = values.length;
            break;
          case "min":
            summary[`${agg.field}_min`] = Math.min(...values);
            break;
          case "max":
            summary[`${agg.field}_max`] = Math.max(...values);
            break;
        }
      }
    }

    return {
      title: config.name,
      generatedAt: new Date(),
      generatedBy: context.userId,
      dateRange: input.dateRange,
      columns: config.columns,
      rows,
      summary: Object.keys(summary).length > 0 ? summary : undefined,
      totalRows: rows.length,
    };
  }

  /**
   * Query attendance data
   */
  private static async queryAttendance(
    tenantId: string,
    input: GenerateReportInput,
    config: ReportConfig,
    baseWhere: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const where: Prisma.AttendanceWhereInput = {
      tenantId,
    };

    if (input.dateRange) {
      where.attendanceDate = {
        gte: new Date(input.dateRange.startDate),
        lte: new Date(input.dateRange.endDate),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { department: true, branch: true },
        },
      },
      orderBy: [{ attendanceDate: "desc" }, { employeeId: "asc" }],
    });

    return attendances.map((a) => ({
      employeeNumber: a.employee.employeeNumber,
      employeeName: a.employee.fullName,
      department: a.employee.department?.name || "-",
      branch: a.employee.branch?.name || "-",
      attendanceDate: a.attendanceDate,
      clockIn: a.clockIn?.toLocaleTimeString("id-ID") || "-",
      clockOut: a.clockOut?.toLocaleTimeString("id-ID") || "-",
      status: a.status,
      lateMinutes: a.lateMinutes,
      overtimeMinutes: a.overtimeMinutes,
      workMode: a.workMode,
    }));
  }

  /**
   * Query leave data
   */
  private static async queryLeave(
    tenantId: string,
    input: GenerateReportInput,
    config: ReportConfig,
    baseWhere: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const where: Prisma.LeaveRequestWhereInput = {
      tenantId,
    };

    if (input.dateRange) {
      where.startDate = {
        gte: new Date(input.dateRange.startDate),
        lte: new Date(input.dateRange.endDate),
      };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { startDate: "desc" },
    });

    return leaves.map((l) => ({
      employeeNumber: l.employee.employeeNumber,
      employeeName: l.employee.fullName,
      leaveType: l.leaveType.name,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      status: l.status,
      reason: l.reason,
    }));
  }

  /**
   * Query payroll data
   */
  private static async queryPayroll(
    tenantId: string,
    input: GenerateReportInput,
    config: ReportConfig,
    baseWhere: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const where: Prisma.PayslipWhereInput = {
      tenantId,
    };

    if (input.dateRange) {
      const startPeriod = input.dateRange.startDate.slice(0, 7);
      const endPeriod = input.dateRange.endDate.slice(0, 7);
      where.period = { gte: startPeriod, lte: endPeriod };
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: [{ period: "desc" }, { employeeId: "asc" }],
    });

    return payslips.map((p) => ({
      employeeNumber: p.employee.employeeNumber,
      employeeName: p.employee.fullName,
      department: p.employee.department?.name || "-",
      period: p.period,
      basicSalary: Number(p.basicSalary),
      allowances: Number(p.overtimeAmount) + Number(p.bonus),
      overtime: Number(p.overtimeAmount),
      deductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
      status: p.status,
    }));
  }

  /**
   * Query employee data
   */
  private static async queryEmployee(
    tenantId: string,
    config: ReportConfig,
    baseWhere: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        user: { select: { email: true } },
        branch: true,
        department: true,
        position: true,
      },
      orderBy: { fullName: "asc" },
    });

    return employees.map((e) => ({
      employeeNumber: e.employeeNumber,
      fullName: e.fullName,
      email: e.user.email,
      branch: e.branch?.name || "-",
      department: e.department?.name || "-",
      position: e.position?.name || "-",
      startDate: e.startDate,
      employmentType: e.employmentType,
      workMode: e.workMode,
      status: e.status,
    }));
  }

  /**
   * Query KPI data
   */
  private static async queryKpi(
    tenantId: string,
    input: GenerateReportInput,
    config: ReportConfig,
    baseWhere: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const where: Prisma.KpiTargetWhereInput = {
      tenantId,
    };

    const targets = await prisma.kpiTarget.findMany({
      where,
      include: {
        employee: true,
        period: true,
        indicator: true,
      },
      orderBy: [{ periodId: "desc" }, { employeeId: "asc" }],
    });

    return targets.map((t) => {
      const achievement = t.actualValue && t.targetValue
        ? (Number(t.actualValue) / Number(t.targetValue)) * 100
        : 0;

      return {
        employeeNumber: t.employee.employeeNumber,
        employeeName: t.employee.fullName,
        period: t.period.name,
        indicator: t.indicator.name,
        target: Number(t.targetValue),
        actual: t.actualValue ? Number(t.actualValue) : null,
        score: t.score ? Number(t.score) : null,
        achievement: Math.round(achievement * 100) / 100,
      };
    });
  }

  /**
   * Get a saved report by ID
   */
  private static async getSavedReport(
    tenantId: string,
    reportId: string
  ): Promise<SavedReport | null> {
    const log = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        action: "REPORT_CONFIG_SAVED",
        objectId: reportId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!log) return null;

    // Check if deleted
    const deletedLog = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        action: "REPORT_CONFIG_DELETED",
        objectId: reportId,
        createdAt: { gt: log.createdAt },
      },
    });

    if (deletedLog) return null;

    return log.afterData as unknown as SavedReport;
  }

  /**
   * Calculate next run time for scheduled report
   */
  private static calculateNextRun(input: ScheduleReportInput): Date {
    const now = new Date();
    const [hours, minutes] = (input.time || "08:00").split(":").map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    switch (input.frequency) {
      case "DAILY":
        if (next <= now) next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        const targetDay = input.dayOfWeek || 1; // Default Monday
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
        next.setDate(now.getDate() + daysUntilTarget);
        if (next <= now) next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        const targetDate = input.dayOfMonth || 1;
        next.setDate(targetDate);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
      case "QUARTERLY":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        next.setMonth((currentQuarter + 1) * 3, input.dayOfMonth || 1);
        if (next <= now) next.setMonth(next.getMonth() + 3);
        break;
    }

    return next;
  }
}
