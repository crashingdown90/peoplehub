// @ai:cl - Payroll service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
} from "../types";
import type { Payslip, PayslipStatus, EmployeeStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface PayslipFilter extends PaginationParams {
  period?: string;
  status?: PayslipStatus;
  employeeId?: string;
}

export interface GeneratePayslipData {
  employeeId: string;
  period: string; // YYYY-MM
}

export interface PayslipCalculation {
  basicSalary: number;
  allowances: Record<string, number>;
  overtimeAmount: number;
  bonus: number;
  lateDeduction: number;
  absentDeduction: number;
  taxDeduction: number;
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  otherDeductions: Record<string, number>;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  attendanceSummary: {
    workDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;
  };
}

export interface BulkGenerateResult {
  success: number;
  failed: number;
  errors: Array<{ employeeId: string; error: string }>;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class PayrollService {
  /**
   * Get payslips with filters
   */
  static async getPayslips(
    context: RequestContext,
    filter: PayslipFilter
  ): Promise<ServiceResponse<Payslip[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "period",
      sortOrder = "desc",
      period,
      status,
      employeeId,
    } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    // Scope based on role
    if (["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      if (employeeId) {
        where.employeeId = employeeId;
      }
    } else {
      // Non-admin roles can only see their own payslips
      where.employeeId = context.employeeId;
      // Only show published payslips
      where.status = "PUBLISHED";
    }

    if (period) {
      where.period = period;
    }
    if (status && ["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              fullName: true,
              employeeNumber: true,
              position: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      }),
      prisma.payslip.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  /**
   * Get single payslip by ID
   */
  static async getPayslipById(
    context: RequestContext,
    payslipId: string
  ): Promise<ServiceResponse<Payslip>> {
    const payslip = await prisma.payslip.findFirst({
      where: withTenant(context, { id: payslipId }),
      include: {
        employee: {
          select: {
            fullName: true,
            employeeNumber: true,
            nik: true,
            npwp: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountHolder: true,
            position: { select: { name: true } },
            department: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
      },
    });

    if (!payslip) {
      return error(ErrorCodes.NOT_FOUND, "Payslip tidak ditemukan");
    }

    // Check access - non-admin can only see their own published payslips
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      if (payslip.employeeId !== context.employeeId) {
        return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke payslip ini");
      }
      if (payslip.status !== "PUBLISHED") {
        return error(ErrorCodes.NOT_FOUND, "Payslip tidak ditemukan");
      }
    }

    return success(payslip);
  }

  /**
   * Generate payslip for single employee
   */
  static async generatePayslip(
    context: RequestContext,
    data: GeneratePayslipData
  ): Promise<ServiceResponse<Payslip>> {
    // Only HRD, Finance, or Super Admin can generate payslips
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk generate payslip");
    }

    // Check if payslip already exists
    const existing = await prisma.payslip.findFirst({
      where: withTenant(context, {
        employeeId: data.employeeId,
        period: data.period,
      }),
    });

    if (existing) {
      return error(
        ErrorCodes.ALREADY_EXISTS,
        `Payslip untuk periode ${data.period} sudah ada`
      );
    }

    // Get employee data
    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: data.employeeId }),
      include: {
        position: true,
      },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // Calculate payslip
    const calculation = await this.calculatePayslip(context, data.employeeId, data.period);

    // Create payslip
    const payslip = await prisma.payslip.create({
      data: {
        tenantId: context.tenantId,
        employeeId: data.employeeId,
        period: data.period,
        basicSalary: calculation.basicSalary,
        allowances: calculation.allowances,
        overtimeAmount: calculation.overtimeAmount,
        bonus: calculation.bonus,
        lateDeduction: calculation.lateDeduction,
        absentDeduction: calculation.absentDeduction,
        taxDeduction: calculation.taxDeduction,
        bpjsKesehatan: calculation.bpjsKesehatan,
        bpjsKetenagakerjaan: calculation.bpjsKetenagakerjaan,
        otherDeductions: calculation.otherDeductions,
        grossSalary: calculation.grossSalary,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        workDays: calculation.attendanceSummary.workDays,
        presentDays: calculation.attendanceSummary.presentDays,
        lateDays: calculation.attendanceSummary.lateDays,
        absentDays: calculation.attendanceSummary.absentDays,
        leaveDays: calculation.attendanceSummary.leaveDays,
        overtimeHours: calculation.attendanceSummary.overtimeHours,
        status: "DRAFT",
        generatedById: context.userId,
      },
    });

    return success(payslip);
  }

  /**
   * Bulk generate payslips for all employees
   */
  static async bulkGeneratePayslips(
    context: RequestContext,
    period: string
  ): Promise<ServiceResponse<BulkGenerateResult>> {
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk generate payslip");
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { tenantId: context.tenantId, status: "ACTIVE" as EmployeeStatus },
      select: { id: true },
    });

    const result: BulkGenerateResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const employee of employees) {
      const response = await this.generatePayslip(context, {
        employeeId: employee.id,
        period,
      });

      if (response.success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({
          employeeId: employee.id,
          error: response.error?.message || "Unknown error",
        });
      }
    }

    return success(result);
  }

  /**
   * Publish payslip
   */
  static async publishPayslip(
    context: RequestContext,
    payslipId: string
  ): Promise<ServiceResponse<Payslip>> {
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk publish payslip");
    }

    const payslip = await prisma.payslip.findFirst({
      where: withTenant(context, { id: payslipId }),
    });

    if (!payslip) {
      return error(ErrorCodes.NOT_FOUND, "Payslip tidak ditemukan");
    }

    if (payslip.status === "PUBLISHED") {
      return error(ErrorCodes.CONFLICT, "Payslip sudah dipublish");
    }

    const updated = await prisma.payslip.update({
      where: { id: payslipId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // TODO: Send notification to employee

    return success(updated);
  }

  /**
   * Bulk publish payslips
   */
  static async bulkPublishPayslips(
    context: RequestContext,
    period: string
  ): Promise<ServiceResponse<{ published: number }>> {
    if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk publish payslip");
    }

    const result = await prisma.payslip.updateMany({
      where: {
        tenantId: context.tenantId,
        period,
        status: "DRAFT" as PayslipStatus,
      },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return success({ published: result.count });
  }

  /**
   * Calculate payslip components
   */
  private static async calculatePayslip(
    context: RequestContext,
    employeeId: string,
    period: string // YYYY-MM
  ): Promise<PayslipCalculation> {
    // Parse period to get date range
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Get attendance summary
    const attendances = await prisma.attendance.findMany({
      where: withTenant(context, {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
    });

    const attendanceSummary = {
      workDays: this.getWorkDays(startDate, endDate),
      presentDays: attendances.filter((a) => ["PRESENT", "LATE"].includes(a.status)).length,
      lateDays: attendances.filter((a) => a.status === "LATE").length,
      absentDays: attendances.filter((a) => a.status === "ABSENT").length,
      leaveDays: attendances.filter((a) => a.status === "LEAVE").length,
      overtimeHours: attendances.reduce((sum, a) => sum + a.overtimeMinutes / 60, 0),
    };

    // Get employee salary data (simplified - should come from salary table)
    // Using position-based base salary as placeholder
    const basicSalary = 5000000; // Base salary - should be from employee/position config

    // Standard allowances
    const allowances: Record<string, number> = {
      transport: 500000,
      meal: 300000,
      communication: 200000,
    };

    // Calculate overtime (1.5x hourly rate for first 2 hours, 2x after)
    const hourlyRate = basicSalary / (attendanceSummary.workDays * 8);
    const overtimeAmount = Math.round(attendanceSummary.overtimeHours * hourlyRate * 1.5);

    // Calculate deductions
    const lateDeduction = attendances.reduce((sum, a) => sum + Number(a.lateDeductionAmount), 0);
    const dailyRate = basicSalary / attendanceSummary.workDays;
    const absentDeduction = Math.round(attendanceSummary.absentDays * dailyRate);

    // BPJS calculations (simplified)
    const grossBeforeBpjs =
      basicSalary +
      Object.values(allowances).reduce((a, b) => a + b, 0) +
      overtimeAmount;

    const bpjsKesehatan = Math.round(grossBeforeBpjs * 0.01); // 1% employee contribution
    const bpjsKetenagakerjaan = Math.round(grossBeforeBpjs * 0.02); // 2% employee contribution

    // Tax calculation (simplified - PPh 21)
    const taxableIncome = grossBeforeBpjs - bpjsKesehatan - bpjsKetenagakerjaan;
    const annualTaxable = taxableIncome * 12;
    let taxRate = 0;
    if (annualTaxable > 500000000) taxRate = 0.3;
    else if (annualTaxable > 250000000) taxRate = 0.25;
    else if (annualTaxable > 60000000) taxRate = 0.15;
    else if (annualTaxable > 0) taxRate = 0.05;
    const taxDeduction = Math.round((taxableIncome * taxRate));

    const grossSalary =
      basicSalary +
      Object.values(allowances).reduce((a, b) => a + b, 0) +
      overtimeAmount;

    const totalDeductions =
      lateDeduction +
      absentDeduction +
      taxDeduction +
      bpjsKesehatan +
      bpjsKetenagakerjaan;

    return {
      basicSalary,
      allowances,
      overtimeAmount,
      bonus: 0,
      lateDeduction,
      absentDeduction,
      taxDeduction,
      bpjsKesehatan,
      bpjsKetenagakerjaan,
      otherDeductions: {},
      grossSalary,
      totalDeductions,
      netSalary: grossSalary - totalDeductions,
      attendanceSummary,
    };
  }

  /**
   * Get working days in a month (excluding weekends)
   */
  private static getWorkDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
