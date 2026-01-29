// @ai:cl - Schedule Service with CRUD and bulk operations
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma, WorkMode } from "@prisma/client";
import { ShiftService } from "../shift";

// ==========================================
// TYPES
// ==========================================

export interface CreateScheduleInput {
  employeeId: string;
  shiftId?: string;
  scheduleDate: Date | string;
  workMode?: WorkMode;
  isHoliday?: boolean;
}

export interface UpdateScheduleInput {
  shiftId?: string | null;
  workMode?: WorkMode;
  isHoliday?: boolean;
}

export interface BulkScheduleInput {
  employeeIds: string[];
  shiftId?: string;
  startDate: Date | string;
  endDate: Date | string;
  workMode?: WorkMode;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
}

export interface ScheduleFilter extends PaginationParams {
  employeeId?: string;
  branchId?: string;
  departmentId?: string;
  shiftId?: string;
  workMode?: WorkMode;
  startDate?: Date | string;
  endDate?: Date | string;
  isHoliday?: boolean;
}

type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: { shift: true; attendance: true };
}>;

// ==========================================
// SERVICE CLASS
// ==========================================

export class ScheduleService {
  /**
   * Create a single schedule
   */
  static async create(
    context: RequestContext,
    data: CreateScheduleInput
  ): Promise<ServiceResponse<ScheduleWithRelations>> {
    // Only admins can create schedules
    if (!["HRD", "MANAGER", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat jadwal");
    }

    // Verify employee exists in same tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId: context.tenantId },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // For managers, check if employee is their subordinate
    if (context.role === "MANAGER") {
      if (employee.managerId !== context.employeeId) {
        return error(ErrorCodes.FORBIDDEN, "Anda hanya dapat membuat jadwal untuk bawahan Anda");
      }
    }

    // Verify shift if provided
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId, tenantId: context.tenantId, isActive: true },
      });

      if (!shift) {
        return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan atau tidak aktif");
      }
    }

    const scheduleDate = new Date(data.scheduleDate);
    scheduleDate.setHours(0, 0, 0, 0);

    // Check for existing schedule
    const existing = await prisma.schedule.findUnique({
      where: {
        employeeId_scheduleDate: {
          employeeId: data.employeeId,
          scheduleDate,
        },
      },
    });

    if (existing) {
      return error(ErrorCodes.CONFLICT, "Jadwal untuk tanggal ini sudah ada");
    }

    const schedule = await prisma.schedule.create({
      data: {
        tenantId: context.tenantId,
        employeeId: data.employeeId,
        shiftId: data.shiftId || null,
        scheduleDate,
        workMode: data.workMode || employee.workMode,
        isHoliday: data.isHoliday || false,
      },
      include: { shift: true, attendance: true },
    });

    return success(schedule);
  }

  /**
   * Get schedules with filters
   */
  static async getSchedules(
    context: RequestContext,
    filter: ScheduleFilter
  ): Promise<ServiceResponse<ScheduleWithRelations[]>> {
    const {
      page = 1,
      limit = 100,
      employeeId,
      branchId,
      departmentId,
      shiftId,
      workMode,
      startDate,
      endDate,
      isHoliday,
    } = filter;

    const where: Prisma.ScheduleWhereInput = {
      tenantId: context.tenantId,
    };

    // Role-based filtering
    if (context.role === "EMPLOYEE") {
      // Employees can only see their own schedule
      where.employeeId = context.employeeId;
    } else if (context.role === "MANAGER") {
      // Managers can see their team's schedules
      if (!employeeId) {
        const subordinates = await prisma.employee.findMany({
          where: { managerId: context.employeeId, tenantId: context.tenantId },
          select: { id: true },
        });
        where.employeeId = { in: [context.employeeId!, ...subordinates.map((s) => s.id)] };
      }
    }

    if (employeeId) where.employeeId = employeeId;
    if (shiftId) where.shiftId = shiftId;
    if (workMode) where.workMode = workMode;
    if (isHoliday !== undefined) where.isHoliday = isHoliday;

    if (startDate) {
      where.scheduleDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.scheduleDate = { ...where.scheduleDate as object, lte: new Date(endDate) };
    }

    // Filter by branch/department through employee relation
    if (branchId || departmentId) {
      const employeeWhere: Prisma.EmployeeWhereInput = { tenantId: context.tenantId };
      if (branchId) employeeWhere.branchId = branchId;
      if (departmentId) employeeWhere.departmentId = departmentId;

      const employees = await prisma.employee.findMany({
        where: employeeWhere,
        select: { id: true },
      });

      if (where.employeeId) {
        // Intersect with existing employee filter
        const existingIds = Array.isArray(where.employeeId)
          ? (where.employeeId as { in: string[] }).in
          : [where.employeeId as string];
        where.employeeId = { in: existingIds.filter((id) => employees.some((e) => e.id === id)) };
      } else {
        where.employeeId = { in: employees.map((e) => e.id) };
      }
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: { shift: true, attendance: true },
        orderBy: [{ scheduleDate: "asc" }, { employeeId: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.schedule.count({ where }),
    ]);

    return success(schedules, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get schedule by ID
   */
  static async getById(
    context: RequestContext,
    scheduleId: string
  ): Promise<ServiceResponse<ScheduleWithRelations>> {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        tenantId: context.tenantId,
      },
      include: { shift: true, attendance: true },
    });

    if (!schedule) {
      return error(ErrorCodes.NOT_FOUND, "Jadwal tidak ditemukan");
    }

    // Check access
    if (context.role === "EMPLOYEE" && schedule.employeeId !== context.employeeId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke jadwal ini");
    }

    return success(schedule);
  }

  /**
   * Update schedule
   */
  static async update(
    context: RequestContext,
    scheduleId: string,
    data: UpdateScheduleInput
  ): Promise<ServiceResponse<ScheduleWithRelations>> {
    // Only admins can update schedules
    if (!["HRD", "MANAGER", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengubah jadwal");
    }

    const existing = await prisma.schedule.findFirst({
      where: { id: scheduleId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Jadwal tidak ditemukan");
    }

    // For managers, check if employee is their subordinate
    if (context.role === "MANAGER") {
      const employee = await prisma.employee.findFirst({
        where: { id: existing.employeeId },
      });

      if (employee?.managerId !== context.employeeId) {
        return error(ErrorCodes.FORBIDDEN, "Anda hanya dapat mengubah jadwal bawahan Anda");
      }
    }

    // Verify shift if provided
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId, tenantId: context.tenantId, isActive: true },
      });

      if (!shift) {
        return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan atau tidak aktif");
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(data.shiftId !== undefined && { shiftId: data.shiftId }),
        ...(data.workMode && { workMode: data.workMode }),
        ...(data.isHoliday !== undefined && { isHoliday: data.isHoliday }),
      },
      include: { shift: true, attendance: true },
    });

    return success(schedule);
  }

  /**
   * Delete schedule
   */
  static async delete(
    context: RequestContext,
    scheduleId: string
  ): Promise<ServiceResponse<void>> {
    // Only admins can delete schedules
    if (!["HRD", "MANAGER", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk menghapus jadwal");
    }

    const existing = await prisma.schedule.findFirst({
      where: { id: scheduleId, tenantId: context.tenantId },
      include: { attendance: true },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Jadwal tidak ditemukan");
    }

    // Can't delete if attendance exists
    if (existing.attendance) {
      return error(ErrorCodes.CONFLICT, "Tidak dapat menghapus jadwal yang sudah memiliki data kehadiran");
    }

    // For managers, check if employee is their subordinate
    if (context.role === "MANAGER") {
      const employee = await prisma.employee.findFirst({
        where: { id: existing.employeeId },
      });

      if (employee?.managerId !== context.employeeId) {
        return error(ErrorCodes.FORBIDDEN, "Anda hanya dapat menghapus jadwal bawahan Anda");
      }
    }

    await prisma.schedule.delete({ where: { id: scheduleId } });

    return success(undefined);
  }

  /**
   * Bulk create schedules
   */
  static async bulkCreate(
    context: RequestContext,
    data: BulkScheduleInput
  ): Promise<ServiceResponse<{ created: number; skipped: number; errors: string[] }>> {
    // Only admins can bulk create
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membuat jadwal massal");
    }

    const { employeeIds, shiftId, startDate, endDate, workMode, skipWeekends, skipHolidays } = data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return error(ErrorCodes.VALIDATION_ERROR, "Tanggal selesai harus setelah tanggal mulai");
    }

    // Verify shift if provided
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, tenantId: context.tenantId, isActive: true },
      });

      if (!shift) {
        return error(ErrorCodes.NOT_FOUND, "Shift tidak ditemukan atau tidak aktif");
      }
    }

    // Verify employees
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        tenantId: context.tenantId,
        status: "ACTIVE",
      },
    });

    if (employees.length === 0) {
      return error(ErrorCodes.NOT_FOUND, "Tidak ada karyawan aktif yang ditemukan");
    }

    // Get holidays if needed
    let holidays: Date[] = [];
    if (skipHolidays) {
      const holidayRecords = await prisma.holiday.findMany({
        where: {
          tenantId: context.tenantId,
          holidayDate: { gte: start, lte: end },
        },
        select: { holidayDate: true },
      });
      holidays = holidayRecords.map((h) => h.holidayDate);
    }

    // Generate schedules
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    const schedulesToCreate: Prisma.ScheduleCreateManyInput[] = [];

    for (const employee of employees) {
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.some(
          (h) => h.toDateString() === currentDate.toDateString()
        );

        // Skip weekends and holidays if requested
        if ((skipWeekends && isWeekend) || (skipHolidays && isHoliday)) {
          skipped++;
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        schedulesToCreate.push({
          tenantId: context.tenantId,
          employeeId: employee.id,
          shiftId: shiftId || null,
          scheduleDate: new Date(currentDate),
          workMode: workMode || employee.workMode,
          isHoliday: isHoliday,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Use createMany with skipDuplicates
    if (schedulesToCreate.length > 0) {
      try {
        const result = await prisma.schedule.createMany({
          data: schedulesToCreate,
          skipDuplicates: true,
        });
        created = result.count;
        skipped += schedulesToCreate.length - result.count;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Unknown error");
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "SCHEDULE_BULK_CREATED",
        objectType: "Schedule",
        afterData: JSON.parse(JSON.stringify({
          employeeCount: employees.length,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          created,
          skipped,
        })),
      },
    });

    return success({ created, skipped, errors });
  }

  /**
   * Get schedule for a specific date and employee
   */
  static async getByDateAndEmployee(
    context: RequestContext,
    employeeId: string,
    date: Date | string
  ): Promise<ServiceResponse<ScheduleWithRelations | null>> {
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    const schedule = await prisma.schedule.findUnique({
      where: {
        employeeId_scheduleDate: {
          employeeId,
          scheduleDate,
        },
      },
      include: { shift: true, attendance: true },
    });

    return success(schedule);
  }

  /**
   * Get weekly schedule summary for an employee
   */
  static async getWeeklySchedule(
    context: RequestContext,
    employeeId: string,
    weekStartDate: Date | string
  ): Promise<ServiceResponse<ScheduleWithRelations[]>> {
    const start = new Date(weekStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    // Check access
    if (context.role === "EMPLOYEE" && employeeId !== context.employeeId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke jadwal ini");
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId,
        scheduleDate: {
          gte: start,
          lte: end,
        },
      },
      include: { shift: true, attendance: true },
      orderBy: { scheduleDate: "asc" },
    });

    return success(schedules);
  }

  /**
   * Copy schedules from one period to another
   */
  static async copySchedules(
    context: RequestContext,
    sourceStartDate: Date | string,
    sourceEndDate: Date | string,
    targetStartDate: Date | string,
    employeeIds?: string[]
  ): Promise<ServiceResponse<{ created: number }>> {
    // Only admins can copy schedules
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menyalin jadwal");
    }

    const sourceStart = new Date(sourceStartDate);
    const sourceEnd = new Date(sourceEndDate);
    const targetStart = new Date(targetStartDate);

    // Calculate day offset
    const dayOffset = Math.floor(
      (targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const where: Prisma.ScheduleWhereInput = {
      tenantId: context.tenantId,
      scheduleDate: {
        gte: sourceStart,
        lte: sourceEnd,
      },
    };

    if (employeeIds && employeeIds.length > 0) {
      where.employeeId = { in: employeeIds };
    }

    const sourceSchedules = await prisma.schedule.findMany({ where });

    const newSchedules: Prisma.ScheduleCreateManyInput[] = sourceSchedules.map((s) => {
      const newDate = new Date(s.scheduleDate);
      newDate.setDate(newDate.getDate() + dayOffset);

      return {
        tenantId: s.tenantId,
        employeeId: s.employeeId,
        shiftId: s.shiftId,
        scheduleDate: newDate,
        workMode: s.workMode,
        isHoliday: s.isHoliday,
      };
    });

    const result = await prisma.schedule.createMany({
      data: newSchedules,
      skipDuplicates: true,
    });

    return success({ created: result.count });
  }
}
