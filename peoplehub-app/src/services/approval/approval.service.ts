// @ai:cl - Approval service - unified approval workflow
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
import type { ApprovalStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export type ApprovalType =
  | "LEAVE"
  | "ATTENDANCE_CORRECTION"
  | "TRAVEL"
  | "REIMBURSE";

export interface PendingApproval {
  id: string;
  type: ApprovalType;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  status: ApprovalStatus;
  createdAt: Date;
  details: Record<string, unknown>;
}

export interface ApprovalFilter extends PaginationParams {
  type?: ApprovalType;
  status?: ApprovalStatus;
}

export interface ApproveData {
  notes?: string;
}

export interface RejectData {
  reason: string;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<ApprovalType, number>;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ApprovalService {
  /**
   * Get pending approvals for current user
   */
  static async getPendingApprovals(
    context: RequestContext,
    filter: ApprovalFilter
  ): Promise<ServiceResponse<PendingApproval[]>> {
    const { page = 1, limit = 20, type, status = "PENDING" } = filter;

    // Check if user can approve
    const canApprove = ["MANAGER", "HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role);
    if (!canApprove) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk approval");
    }

    const approvals: PendingApproval[] = [];

    // Get subordinates if manager
    let subordinateIds: string[] = [];
    if (context.role === "MANAGER" && context.employeeId) {
      const subordinates = await prisma.employee.findMany({
        where: withTenant(context, { managerId: context.employeeId }),
        select: { id: true },
      });
      subordinateIds = subordinates.map((s) => s.id);
    }

    // Fetch different types based on filter
    const typesToFetch = type ? [type] : ["LEAVE", "ATTENDANCE_CORRECTION", "TRAVEL", "REIMBURSE"];

    for (const approvalType of typesToFetch) {
      switch (approvalType) {
        case "LEAVE":
          if (["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
            const leaveApprovals = await this.getLeaveApprovals(
              context,
              subordinateIds,
              status
            );
            approvals.push(...leaveApprovals);
          }
          break;

        case "ATTENDANCE_CORRECTION":
          if (["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
            const correctionApprovals = await this.getCorrectionApprovals(
              context,
              subordinateIds,
              status
            );
            approvals.push(...correctionApprovals);
          }
          break;

        case "TRAVEL":
          if (["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
            const travelApprovals = await this.getTravelApprovals(
              context,
              subordinateIds,
              status
            );
            approvals.push(...travelApprovals);
          }
          break;

        case "REIMBURSE":
          if (["MANAGER", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            const reimburseApprovals = await this.getReimburseApprovals(
              context,
              subordinateIds,
              status
            );
            approvals.push(...reimburseApprovals);
          }
          break;
      }
    }

    // Sort by createdAt desc
    approvals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const total = approvals.length;
    const paginatedData = approvals.slice((page - 1) * limit, page * limit);

    return paginated(paginatedData, total, page, limit);
  }

  /**
   * Approve a request
   */
  static async approve(
    context: RequestContext,
    type: ApprovalType,
    requestId: string,
    data?: ApproveData
  ): Promise<ServiceResponse<{ message: string }>> {
    switch (type) {
      case "LEAVE":
        return this.approveLeave(context, requestId, data);
      case "ATTENDANCE_CORRECTION":
        return this.approveCorrection(context, requestId, data);
      case "TRAVEL":
        return this.approveTravel(context, requestId, data);
      case "REIMBURSE":
        return this.approveReimburse(context, requestId, data);
      default:
        return error(ErrorCodes.INVALID_INPUT, "Tipe approval tidak valid");
    }
  }

  /**
   * Reject a request
   */
  static async reject(
    context: RequestContext,
    type: ApprovalType,
    requestId: string,
    data: RejectData
  ): Promise<ServiceResponse<{ message: string }>> {
    if (!data.reason || data.reason.trim().length < 10) {
      return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan minimal 10 karakter");
    }

    switch (type) {
      case "LEAVE":
        return this.rejectLeave(context, requestId, data);
      case "ATTENDANCE_CORRECTION":
        return this.rejectCorrection(context, requestId, data);
      case "TRAVEL":
        return this.rejectTravel(context, requestId, data);
      case "REIMBURSE":
        return this.rejectReimburse(context, requestId, data);
      default:
        return error(ErrorCodes.INVALID_INPUT, "Tipe approval tidak valid");
    }
  }

  /**
   * Get approval statistics
   */
  static async getStats(context: RequestContext): Promise<ServiceResponse<ApprovalStats>> {
    if (!["MANAGER", "HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const stats: ApprovalStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: {
        LEAVE: 0,
        ATTENDANCE_CORRECTION: 0,
        TRAVEL: 0,
        REIMBURSE: 0,
      },
    };

    // Count leave requests
    const [leavePending, leaveApproved, leaveRejected] = await Promise.all([
      prisma.leaveRequest.count({
        where: { tenantId: context.tenantId, status: "PENDING" as ApprovalStatus },
      }),
      prisma.leaveRequest.count({
        where: { tenantId: context.tenantId, status: "APPROVED" as ApprovalStatus },
      }),
      prisma.leaveRequest.count({
        where: { tenantId: context.tenantId, status: "REJECTED" as ApprovalStatus },
      }),
    ]);

    stats.pending += leavePending;
    stats.approved += leaveApproved;
    stats.rejected += leaveRejected;
    stats.byType.LEAVE = leavePending;

    // Count correction requests
    const correctionPending = await prisma.attendanceCorrection.count({
      where: { tenantId: context.tenantId, status: "PENDING" as ApprovalStatus },
    });
    stats.pending += correctionPending;
    stats.byType.ATTENDANCE_CORRECTION = correctionPending;

    // Count travel requests
    const travelPending = await prisma.travelRequest.count({
      where: { tenantId: context.tenantId, status: "PENDING" as ApprovalStatus },
    });
    stats.pending += travelPending;
    stats.byType.TRAVEL = travelPending;

    // Count reimburse requests
    const reimbursePending = await prisma.reimburseRequest.count({
      where: { tenantId: context.tenantId, status: "PENDING" as ApprovalStatus },
    });
    stats.pending += reimbursePending;
    stats.byType.REIMBURSE = reimbursePending;

    return success(stats);
  }

  // ==========================================
  // PRIVATE METHODS - GET APPROVALS
  // ==========================================

  private static async getLeaveApprovals(
    context: RequestContext,
    subordinateIds: string[],
    status: ApprovalStatus
  ): Promise<PendingApproval[]> {
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    // Manager approval - PENDING status
    if (context.role === "MANAGER") {
      where.employeeId = { in: subordinateIds };
      where.status = "PENDING";
    }
    // HRD approval - APPROVED_MANAGER status
    else if (context.role === "HRD") {
      where.status = status === "PENDING" ? "APPROVED_MANAGER" : status;
    }
    // Super admin sees all
    else if (context.role === "SUPER_ADMIN") {
      if (status) where.status = status;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return requests.map((r) => ({
      id: r.id,
      type: "LEAVE" as ApprovalType,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeNumber: r.employee.employeeNumber,
      status: r.status,
      createdAt: r.createdAt,
      details: {
        leaveType: r.leaveType.name,
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        reason: r.reason,
      },
    }));
  }

  private static async getCorrectionApprovals(
    context: RequestContext,
    subordinateIds: string[],
    status: ApprovalStatus
  ): Promise<PendingApproval[]> {
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (context.role === "MANAGER") {
      where.employeeId = { in: subordinateIds };
      where.status = "PENDING";
    } else if (["HRD", "SUPER_ADMIN"].includes(context.role)) {
      where.status = status;
    }

    const requests = await prisma.attendanceCorrection.findMany({
      where,
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return requests.map((r) => ({
      id: r.id,
      type: "ATTENDANCE_CORRECTION" as ApprovalType,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeNumber: r.employee.employeeNumber,
      status: r.status,
      createdAt: r.createdAt,
      details: {
        attendanceDate: r.attendanceDate,
        originalClockIn: r.originalClockIn,
        originalClockOut: r.originalClockOut,
        requestedClockIn: r.requestedClockIn,
        requestedClockOut: r.requestedClockOut,
        reason: r.reason,
      },
    }));
  }

  private static async getTravelApprovals(
    context: RequestContext,
    subordinateIds: string[],
    status: ApprovalStatus
  ): Promise<PendingApproval[]> {
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (context.role === "MANAGER") {
      where.employeeId = { in: subordinateIds };
      where.status = "PENDING";
    } else if (context.role === "HRD") {
      where.status = status === "PENDING" ? "APPROVED_MANAGER" : status;
    } else if (context.role === "SUPER_ADMIN") {
      where.status = status;
    }

    const requests = await prisma.travelRequest.findMany({
      where,
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return requests.map((r) => ({
      id: r.id,
      type: "TRAVEL" as ApprovalType,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeNumber: r.employee.employeeNumber,
      status: r.status,
      createdAt: r.createdAt,
      details: {
        destination: r.destination,
        purpose: r.purpose,
        departureDate: r.departureDate,
        returnDate: r.returnDate,
        estimatedBudget: r.estimatedBudget,
      },
    }));
  }

  private static async getReimburseApprovals(
    context: RequestContext,
    subordinateIds: string[],
    status: ApprovalStatus
  ): Promise<PendingApproval[]> {
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (context.role === "MANAGER") {
      where.employeeId = { in: subordinateIds };
      where.status = "PENDING";
    } else if (context.role === "FINANCE") {
      where.status = status === "PENDING" ? "APPROVED_MANAGER" : status;
    } else if (context.role === "SUPER_ADMIN") {
      where.status = status;
    }

    const requests = await prisma.reimburseRequest.findMany({
      where,
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return requests.map((r) => ({
      id: r.id,
      type: "REIMBURSE" as ApprovalType,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeNumber: r.employee.employeeNumber,
      status: r.status,
      createdAt: r.createdAt,
      details: {
        category: r.category,
        totalAmount: r.totalAmount,
        description: r.description,
      },
    }));
  }

  // ==========================================
  // PRIVATE METHODS - APPROVE
  // ==========================================

  private static async approveLeave(
    context: RequestContext,
    requestId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data?: ApproveData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    let newStatus: ApprovalStatus;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (context.role === "MANAGER" && request.status === "PENDING") {
      newStatus = "APPROVED_MANAGER";
      updateData.approvedByManagerId = context.userId;
      updateData.managerApprovedAt = new Date();
    } else if (
      ["HRD", "SUPER_ADMIN"].includes(context.role) &&
      ["PENDING", "APPROVED_MANAGER"].includes(request.status)
    ) {
      newStatus = "APPROVED";
      updateData.approvedByHrdId = context.userId;
      updateData.hrdApprovedAt = new Date();

      // Update leave balance
      await this.updateLeaveBalance(context, request.employeeId, request.leaveTypeId, request.totalDays);
    } else {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: newStatus, ...updateData },
    });

    return success({ message: "Pengajuan cuti berhasil disetujui" });
  }

  private static async approveCorrection(
    context: RequestContext,
    requestId: string,
    _data?: ApproveData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.attendanceCorrection.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan koreksi tidak ditemukan");
    }

    if (request.status !== "PENDING") {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    // Update attendance record
    await prisma.attendance.updateMany({
      where: {
        tenantId: context.tenantId,
        employeeId: request.employeeId,
        attendanceDate: request.attendanceDate,
      },
      data: {
        clockIn: request.requestedClockIn,
        clockOut: request.requestedClockOut,
        isCorrected: true,
        updatedAt: new Date(),
      },
    });

    // Update correction status
    await prisma.attendanceCorrection.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: context.userId,
        approvedAt: new Date(),
      },
    });

    return success({ message: "Koreksi absensi berhasil disetujui" });
  }

  private static async approveTravel(
    context: RequestContext,
    requestId: string,
    _data?: ApproveData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.travelRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan perjalanan dinas tidak ditemukan");
    }

    let newStatus: ApprovalStatus;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (context.role === "MANAGER" && request.status === "PENDING") {
      newStatus = "APPROVED_MANAGER";
      updateData.approvedByManagerId = context.userId;
      updateData.managerApprovedAt = new Date();
    } else if (
      ["HRD", "SUPER_ADMIN"].includes(context.role) &&
      ["PENDING", "APPROVED_MANAGER"].includes(request.status)
    ) {
      newStatus = "APPROVED";
      updateData.approvedByHrdId = context.userId;
      updateData.hrdApprovedAt = new Date();
    } else {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.travelRequest.update({
      where: { id: requestId },
      data: { status: newStatus, ...updateData },
    });

    return success({ message: "Pengajuan perjalanan dinas berhasil disetujui" });
  }

  private static async approveReimburse(
    context: RequestContext,
    requestId: string,
    _data?: ApproveData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.reimburseRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan reimburse tidak ditemukan");
    }

    let newStatus: ApprovalStatus;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (context.role === "MANAGER" && request.status === "PENDING") {
      newStatus = "APPROVED_MANAGER";
      updateData.approvedByManagerId = context.userId;
      updateData.managerApprovedAt = new Date();
    } else if (
      ["FINANCE", "SUPER_ADMIN"].includes(context.role) &&
      ["PENDING", "APPROVED_MANAGER"].includes(request.status)
    ) {
      newStatus = "APPROVED";
      updateData.approvedByFinanceId = context.userId;
      updateData.financeApprovedAt = new Date();
    } else {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.reimburseRequest.update({
      where: { id: requestId },
      data: { status: newStatus, ...updateData },
    });

    return success({ message: "Pengajuan reimburse berhasil disetujui" });
  }

  // ==========================================
  // PRIVATE METHODS - REJECT
  // ==========================================

  private static async rejectLeave(
    context: RequestContext,
    requestId: string,
    data: RejectData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.leaveRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan cuti tidak ditemukan");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: data.reason,
        updatedAt: new Date(),
      },
    });

    return success({ message: "Pengajuan cuti ditolak" });
  }

  private static async rejectCorrection(
    context: RequestContext,
    requestId: string,
    data: RejectData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.attendanceCorrection.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan koreksi tidak ditemukan");
    }

    if (request.status !== "PENDING") {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.attendanceCorrection.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: data.reason,
        updatedAt: new Date(),
      },
    });

    return success({ message: "Pengajuan koreksi ditolak" });
  }

  private static async rejectTravel(
    context: RequestContext,
    requestId: string,
    data: RejectData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.travelRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan perjalanan dinas tidak ditemukan");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.travelRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: data.reason,
        updatedAt: new Date(),
      },
    });

    return success({ message: "Pengajuan perjalanan dinas ditolak" });
  }

  private static async rejectReimburse(
    context: RequestContext,
    requestId: string,
    data: RejectData
  ): Promise<ServiceResponse<{ message: string }>> {
    const request = await prisma.reimburseRequest.findFirst({
      where: withTenant(context, { id: requestId }),
    });

    if (!request) {
      return error(ErrorCodes.NOT_FOUND, "Pengajuan reimburse tidak ditemukan");
    }

    if (!["PENDING", "APPROVED_MANAGER"].includes(request.status)) {
      return error(ErrorCodes.CANNOT_MODIFY, "Status pengajuan tidak dapat diubah");
    }

    await prisma.reimburseRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: data.reason,
        updatedAt: new Date(),
      },
    });

    return success({ message: "Pengajuan reimburse ditolak" });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private static async updateLeaveBalance(
    context: RequestContext,
    employeeId: string,
    leaveTypeId: string,
    days: number
  ): Promise<void> {
    const currentYear = new Date().getFullYear();

    await prisma.leaveBalance.updateMany({
      where: {
        tenantId: context.tenantId,
        employeeId,
        leaveTypeId,
        year: currentYear,
      },
      data: {
        usedBalance: { increment: days },
        remainingBalance: { decrement: days },
        updatedAt: new Date(),
      },
    });
  }
}
