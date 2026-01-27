// @ai:cl - Leave service - business logic layer
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
import type { LeaveRequest, LeaveBalance, ApprovalStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateLeaveRequestData {
  leaveTypeId: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  attachmentUrl?: string;
  delegateToId?: string;
}

export interface LeaveRequestFilter extends PaginationParams {
  employeeId?: string;
  leaveTypeId?: string;
  status?: ApprovalStatus;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface LeaveBalanceWithType extends LeaveBalance {
  leaveType: {
    code: string;
    name: string;
    isPaid: boolean;
  };
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class LeaveService {
  /**
   * Create a new leave request
   */
  static async createRequest(
    context: RequestContext,
    data: CreateLeaveRequestData
  ): Promise<ServiceResponse<LeaveRequest>> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // Calculate total days
    const totalDays = this.calculateWorkDays(start, end);

    // Check leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: withTenant(context, {
        employeeId: context.employeeId!,
        leaveTypeId: data.leaveTypeId,
        year: start.getFullYear(),
      }),
    });

    if (!balance || balance.remainingBalance < totalDays) {
      return error(
        ErrorCodes.INSUFFICIENT_BALANCE,
        `Saldo cuti tidak mencukupi. Tersisa: ${balance?.remainingBalance || 0} hari`
      );
    }

    // Check for overlapping requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: withTenant(context, {
        employeeId: context.employeeId!,
        deletedAt: null,
        status: { notIn: ["REJECTED", "CANCELLED"] as ApprovalStatus[] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      }),
    });

    if (overlapping) {
      return error(
        ErrorCodes.CONFLICT,
        "Terdapat pengajuan cuti yang tumpang tindih pada tanggal tersebut"
      );
    }

    // Create the request
    const request = await prisma.leaveRequest.create({
      data: {
        tenantId: context.tenantId,
        employeeId: context.employeeId!,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: data.reason,
        attachmentUrl: data.attachmentUrl,
        delegateToId: data.delegateToId,
        status: "PENDING",
      },
    });

    return success(request);
  }

  /**
   * Get leave requests with filters
   */
  static async getRequests(
    context: RequestContext,
    filter: LeaveRequestFilter
  ): Promise<ServiceResponse<LeaveRequest[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      employeeId,
      leaveTypeId,
      status,
      startDate,
      endDate,
    } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    // Scope based on role
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) {
      if (employeeId) where.employeeId = employeeId;
    } else if (context.role === "MANAGER") {
      // Manager sees pending approvals for team
      // For simplicity, show requests pending manager approval
      if (!employeeId) {
        // Get subordinate IDs
        const subordinates = await prisma.employee.findMany({
          where: {
            tenantId: context.tenantId,
            managerId: context.employeeId,
          },
          select: { id: true },
        });
        where.employeeId = { in: subordinates.map((s) => s.id) };
      } else {
        where.employeeId = employeeId;
      }
    } else {
      where.employeeId = context.employeeId;
    }

    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (status) where.status = status;
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: { select: { fullName: true, employeeNumber: true } },
          leaveType: { select: { code: true, name: true } },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  /**
   * Get leave balances for employee
   */
  static async getBalances(
    context: RequestContext,
    employeeId?: string,
    year?: number
  ): Promise<ServiceResponse<LeaveBalanceWithType[]>> {
    const targetEmployeeId = employeeId || context.employeeId;
    const targetYear = year || new Date().getFullYear();

    // Check access
    if (
      targetEmployeeId !== context.employeeId &&
      !["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)
    ) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const balances = await prisma.leaveBalance.findMany({
      where: withTenant(context, {
        employeeId: targetEmployeeId!,
        year: targetYear,
      }),
      include: {
        leaveType: {
          select: { code: true, name: true, isPaid: true },
        },
      },
    });

    return success(balances);
  }

  /**
   * Approve leave request (Manager)
   */
  static async approveByManager(
    context: RequestContext,
    requestId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    notes?: string
  ): Promise<ServiceResponse<LeaveRequest>> {
    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, { id: requestId, deletedAt: null }),
      include: { employee: true },
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    // Check if user is the manager
    if (
      context.role !== "MANAGER" ||
      request.employee.managerId !== context.employeeId
    ) {
      return error(ErrorCodes.FORBIDDEN, "Anda bukan atasan dari karyawan ini");
    }

    if (request.status !== "PENDING") {
      return error(ErrorCodes.CANNOT_MODIFY, "Pengajuan sudah diproses sebelumnya");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED_MANAGER",
        approvedByManagerId: context.employeeId,
        managerApprovedAt: new Date(),
      },
    });

    return success(updated);
  }

  /**
   * Approve leave request (HRD)
   */
  static async approveByHrd(
    context: RequestContext,
    requestId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    notes?: string
  ): Promise<ServiceResponse<LeaveRequest>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menyetujui");
    }

    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, { id: requestId, deletedAt: null }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(ErrorCodes.CANNOT_MODIFY, "Pengajuan sudah diproses sebelumnya");
    }

    // Use transaction to ensure data consistency
    const updated = await prisma.$transaction(async (tx) => {
      // Deduct balance - include tenantId for tenant isolation
      await tx.leaveBalance.updateMany({
        where: {
          tenantId: context.tenantId, // CR-004: Added for tenant isolation
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
        data: {
          usedBalance: { increment: request.totalDays },
          remainingBalance: { decrement: request.totalDays },
        },
      });

      // Update request status
      return tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedByHrdId: context.employeeId,
          hrdApprovedAt: new Date(),
        },
      });
    });

    return success(updated);
  }

  /**
   * Reject leave request
   */
  static async reject(
    context: RequestContext,
    requestId: string,
    reason: string
  ): Promise<ServiceResponse<LeaveRequest>> {
    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, { id: requestId, deletedAt: null }),
      include: { employee: true },
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    // Check permission
    const canReject =
      ["HRD", "SUPER_ADMIN"].includes(context.role) ||
      (context.role === "MANAGER" &&
        request.employee.managerId === context.employeeId);

    if (!canReject) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(ErrorCodes.CANNOT_MODIFY, "Pengajuan sudah diproses sebelumnya");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    return success(updated);
  }

  /**
   * Cancel leave request (by employee)
   */
  static async cancel(
    context: RequestContext,
    requestId: string
  ): Promise<ServiceResponse<LeaveRequest>> {
    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, {
        id: requestId,
        employeeId: context.employeeId!,
        deletedAt: null,
      }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(
        ErrorCodes.CANNOT_MODIFY,
        "Pengajuan yang sudah disetujui HRD tidak dapat dibatalkan"
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    return success(updated);
  }

  /**
   * Calculate work days between two dates (excluding weekends)
   */
  private static calculateWorkDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
