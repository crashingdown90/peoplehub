// @ai:cl - Shift Service with CRUD operations
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateShiftInput {
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakMinutes?: number;
  isFlexible?: boolean;
}

export interface UpdateShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  isFlexible?: boolean;
  isActive?: boolean;
}

export interface ShiftFilter extends PaginationParams {
  isActive?: boolean;
  search?: string;
}

type ShiftWithScheduleCount = Prisma.ShiftGetPayload<{}> & {
  _count?: { schedules: number };
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class ShiftService {
  /**
   * Create a new shift
   */
  static async create(
    context: RequestContext,
    data: CreateShiftInput
  ): Promise<ServiceResponse<ShiftWithScheduleCount>> {
    // Only admins can create shifts
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membuat shift");
    }

    // Validate time format
    if (!this.isValidTimeFormat(data.startTime) || !this.isValidTimeFormat(data.endTime)) {
      return error(ErrorCodes.VALIDATION_ERROR, "Format waktu tidak valid (gunakan HH:mm)");
    }

    // Check for duplicate shift name
    const existing = await prisma.shift.findFirst({
      where: {
        tenantId: context.tenantId,
        name: data.name,
      },
    });

    if (existing) {
      return error(ErrorCodes.CONFLICT, "Shift dengan nama ini sudah ada");
    }

    const shift = await prisma.shift.create({
      data: {
        tenantId: context.tenantId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes ?? 60,
        isFlexible: data.isFlexible ?? false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "SHIFT_CREATED",
        objectType: "Shift",
        objectId: shift.id,
        afterData: JSON.parse(JSON.stringify({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime })),
      },
    });

    return success(shift);
  }

  /**
   * Get shifts with filters
   */
  static async getShifts(
    context: RequestContext,
    filter: ShiftFilter
  ): Promise<ServiceResponse<ShiftWithScheduleCount[]>> {
    const { page = 1, limit = 50, isActive, search } = filter;

    const where: Prisma.ShiftWhereInput = {
      tenantId: context.tenantId,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: { _count: { select: { schedules: true } } },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shift.count({ where }),
    ]);

    return success(shifts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get shift by ID
   */
  static async getById(
    context: RequestContext,
    shiftId: string
  ): Promise<ServiceResponse<ShiftWithScheduleCount>> {
    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId: context.tenantId,
      },
      include: { _count: { select: { schedules: true } } },
    });

    if (!shift) {
      return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan");
    }

    return success(shift);
  }

  /**
   * Update shift
   */
  static async update(
    context: RequestContext,
    shiftId: string,
    data: UpdateShiftInput
  ): Promise<ServiceResponse<ShiftWithScheduleCount>> {
    // Only admins can update shifts
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat mengubah shift");
    }

    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan");
    }

    // Validate time format if provided
    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      return error(ErrorCodes.VALIDATION_ERROR, "Format waktu mulai tidak valid");
    }
    if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
      return error(ErrorCodes.VALIDATION_ERROR, "Format waktu selesai tidak valid");
    }

    // Check for duplicate name if changing name
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.shift.findFirst({
        where: {
          tenantId: context.tenantId,
          name: data.name,
          id: { not: shiftId },
        },
      });

      if (duplicate) {
        return error(ErrorCodes.CONFLICT, "Shift dengan nama ini sudah ada");
      }
    }

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.breakMinutes !== undefined && { breakMinutes: data.breakMinutes }),
        ...(data.isFlexible !== undefined && { isFlexible: data.isFlexible }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { _count: { select: { schedules: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "SHIFT_UPDATED",
        objectType: "Shift",
        objectId: shift.id,
        beforeData: { name: existing.name, startTime: existing.startTime, endTime: existing.endTime },
        afterData: JSON.parse(JSON.stringify({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime })),
      },
    });

    return success(shift);
  }

  /**
   * Delete shift
   */
  static async delete(
    context: RequestContext,
    shiftId: string
  ): Promise<ServiceResponse<void>> {
    // Only admins can delete shifts
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menghapus shift");
    }

    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId: context.tenantId },
      include: { _count: { select: { schedules: true } } },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan");
    }

    // Check if shift is being used
    if (existing._count.schedules > 0) {
      return error(
        ErrorCodes.CONFLICT,
        `Shift tidak dapat dihapus karena masih digunakan oleh ${existing._count.schedules} jadwal`
      );
    }

    await prisma.shift.delete({ where: { id: shiftId } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "SHIFT_DELETED",
        objectType: "Shift",
        objectId: shiftId,
        beforeData: { name: existing.name },
      },
    });

    return success(undefined);
  }

  /**
   * Get all active shifts for dropdown
   */
  static async getActiveShifts(
    context: RequestContext
  ): Promise<ServiceResponse<Array<{ id: string; name: string; startTime: string; endTime: string }>>> {
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId: context.tenantId,
        isActive: true,
      },
      select: { id: true, name: true, startTime: true, endTime: true },
      orderBy: { name: "asc" },
    });

    return success(shifts);
  }

  /**
   * Calculate working hours for a shift
   */
  static calculateWorkingHours(startTime: string, endTime: string, breakMinutes: number): number {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    return totalMinutes / 60;
  }

  /**
   * Validate time format (HH:mm)
   */
  private static isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
