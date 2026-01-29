// @ai:cl - Temporary shift assignment service
import { prisma } from "@/lib/db";
import { RequestContext, withTenant, withTenantData } from "@/lib/tenant";
import { ServiceResponse, success, error, paginated, ErrorCodes, PaginationParams } from "../types";
import type { TempShiftAssignment } from "@prisma/client";

export interface CreateTempShiftAssignmentInput {
  employeeId: string;
  shiftId: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  isActive?: boolean;
}

export interface UpdateTempShiftAssignmentInput {
  employeeId?: string;
  shiftId?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  isActive?: boolean;
}

export interface TempShiftAssignmentFilter extends PaginationParams {
  employeeId?: string;
  shiftId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

type TempShiftAssignmentWithRelations = TempShiftAssignment & {
  employee: { id: string; fullName: string; employeeNumber: string };
  shift: { id: string; name: string; startTime: string; endTime: string };
};

export class TempShiftAssignmentService {
  static async getAll(
    context: RequestContext,
    filter: TempShiftAssignmentFilter = {}
  ): Promise<ServiceResponse<TempShiftAssignmentWithRelations[]>> {
    const { page = 1, limit = 50, employeeId, shiftId, isActive, startDate, endDate } = filter;

    const where: Record<string, unknown> = withTenant(context, {});

    if (employeeId) where.employeeId = employeeId;
    if (shiftId) where.shiftId = shiftId;
    if (isActive !== undefined) where.isActive = isActive;
    if (startDate) where.effectiveFrom = { gte: startDate };
    if (endDate) {
      where.effectiveFrom = {
        ...(typeof where.effectiveFrom === "object" ? where.effectiveFrom : {}),
        lte: endDate,
      };
    }

    const [data, total] = await Promise.all([
      prisma.tempShiftAssignment.findMany({
        where,
        include: {
          employee: { select: { id: true, fullName: true, employeeNumber: true } },
          shift: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tempShiftAssignment.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  static async getById(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<TempShiftAssignmentWithRelations>> {
    const data = await prisma.tempShiftAssignment.findFirst({
      where: withTenant(context, { id }),
      include: {
        employee: { select: { id: true, fullName: true, employeeNumber: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    });

    if (!data) {
      return error(ErrorCodes.NOT_FOUND, "Assignment tidak ditemukan");
    }

    return success(data);
  }

  static async create(
    context: RequestContext,
    data: CreateTempShiftAssignmentInput
  ): Promise<ServiceResponse<TempShiftAssignment>> {
    if (context.role !== "HRD" && context.role !== "SUPER_ADMIN") {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membuat assignment shift");
    }

    if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
      return error(ErrorCodes.VALIDATION_ERROR, "Tanggal akhir harus setelah tanggal mulai");
    }

    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: data.employeeId }),
      select: { id: true },
    });
    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    const shift = await prisma.shift.findFirst({
      where: { id: data.shiftId, tenantId: context.tenantId },
      select: { id: true },
    });
    if (!shift) {
      return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan");
    }

    const overlapWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      employeeId: data.employeeId,
      isActive: true,
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: data.effectiveFrom } }],
    };

    if (data.effectiveTo) {
      overlapWhere.AND = [{ effectiveFrom: { lte: data.effectiveTo } }];
    }

    const overlapping = await prisma.tempShiftAssignment.findFirst({ where: overlapWhere });
    if (overlapping) {
      return error(ErrorCodes.CONFLICT, "Assignment shift tumpang tindih dengan data yang ada");
    }

    const created = await prisma.tempShiftAssignment.create({
      data: withTenantData(context, {
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo ?? null,
        isActive: data.isActive ?? true,
      }),
    });

    return success(created);
  }

  static async update(
    context: RequestContext,
    id: string,
    data: UpdateTempShiftAssignmentInput
  ): Promise<ServiceResponse<TempShiftAssignment>> {
    if (context.role !== "HRD" && context.role !== "SUPER_ADMIN") {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat mengubah assignment shift");
    }

    const existing = await prisma.tempShiftAssignment.findFirst({
      where: withTenant(context, { id }),
    });
    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Assignment tidak ditemukan");
    }

    const effectiveFrom = data.effectiveFrom ?? existing.effectiveFrom;
    const effectiveTo = data.effectiveTo ?? existing.effectiveTo;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      return error(ErrorCodes.VALIDATION_ERROR, "Tanggal akhir harus setelah tanggal mulai");
    }

    const overlapWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      employeeId: data.employeeId ?? existing.employeeId,
      isActive: true,
      id: { not: id },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
    };

    if (effectiveTo) {
      overlapWhere.AND = [{ effectiveFrom: { lte: effectiveTo } }];
    }

    const overlapping = await prisma.tempShiftAssignment.findFirst({ where: overlapWhere });
    if (overlapping) {
      return error(ErrorCodes.CONFLICT, "Assignment shift tumpang tindih dengan data yang ada");
    }

    const updated = await prisma.tempShiftAssignment.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isActive: data.isActive,
      },
    });

    return success(updated);
  }

  static async delete(context: RequestContext, id: string): Promise<ServiceResponse<void>> {
    if (context.role !== "HRD" && context.role !== "SUPER_ADMIN") {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menghapus assignment shift");
    }

    const existing = await prisma.tempShiftAssignment.findFirst({
      where: withTenant(context, { id }),
    });
    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Assignment tidak ditemukan");
    }

    await prisma.tempShiftAssignment.delete({ where: { id } });
    return success(undefined);
  }
}
