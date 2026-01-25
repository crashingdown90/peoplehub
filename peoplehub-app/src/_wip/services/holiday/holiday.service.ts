// @ai:cl - Holiday calendar service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant, withTenantData } from "@/lib/tenant";
import {
    ServiceResponse,
    success,
    error,
    paginated,
    ErrorCodes,
    PaginationParams,
} from "../types";
import type { Holiday } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateHolidayData {
    name: string;
    holidayDate: Date;
    isNational?: boolean;
    branchId?: string;
}

export interface UpdateHolidayData {
    name?: string;
    holidayDate?: Date;
    isNational?: boolean;
    branchId?: string;
}

export interface HolidayFilter extends PaginationParams {
    year?: number;
    month?: number;
    branchId?: string;
    isNational?: boolean;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class HolidayService {
    /**
     * Create holiday
     */
    static async create(
        context: RequestContext,
        data: CreateHolidayData
    ): Promise<ServiceResponse<Holiday>> {
        // Only admin roles can create holidays
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk membuat holiday");
        }

        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const holidayDate = new Date(data.holidayDate);
        holidayDate.setHours(0, 0, 0, 0);

        // Check for duplicate holiday on same date and same scope
        const existing = await prisma.holiday.findFirst({
            where: {
                tenantId: context.tenantId,
                branchId: data.branchId || null,
                holidayDate: data.holidayDate,
            },
        });

        if (existing) {
            return error(
                ErrorCodes.ALREADY_EXISTS,
                "Holiday sudah ada pada tanggal dan scope yang sama"
            );
        }

        const holiday = await prisma.holiday.create({
            data: withTenantData(context, {
                name: data.name,
                holidayDate: data.holidayDate,
                isNational: data.isNational || false,
                branchId: data.branchId,
            }),
        });

        return success(holiday);
    }

    /**
     * Get holiday by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<Holiday>> {
        const holiday = await prisma.holiday.findFirst({
            where: withTenant(context, { id }),
            include: {
                branch: {
                    select: { name: true },
                },
            },
        });

        if (!holiday) {
            return error(ErrorCodes.NOT_FOUND, "Holiday tidak ditemukan");
        }

        return success(holiday);
    }

    /**
     * Get all holidays with filters
     */
    static async getAll(
        context: RequestContext,
        filter: HolidayFilter
    ): Promise<ServiceResponse<Holiday[]>> {
        const {
            page = 1,
            limit = 100,
            year,
            month,
            branchId,
            isNational,
        } = filter;

        // Build where clause
        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        // Filter by year/month
        if (year) {
            const startDate = new Date(year, month ? month - 1 : 0, 1);
            const endDate = month
                ? new Date(year, month, 0) // Last day of month
                : new Date(year, 11, 31); // Last day of year

            where.holidayDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        // Filter by branch or national
        if (branchId) {
            where.branchId = branchId;
        }

        if (isNational !== undefined) {
            where.isNational = isNational;
        }

        const [data, total] = await Promise.all([
            prisma.holiday.findMany({
                where,
                orderBy: { holidayDate: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    branch: {
                        select: { name: true },
                    },
                },
            }),
            prisma.holiday.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get applicable holidays for a specific date range
     * Returns both national and branch-specific holidays
     */
    static async getApplicable(
        context: RequestContext,
        startDate: Date,
        endDate: Date,
        branchId?: string
    ): Promise<ServiceResponse<Holiday[]>> {
        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            holidayDate: {
                gte: startDate,
                lte: endDate,
            },
        };

        // Get national holidays + branch-specific holidays
        const orConditions = [{ isNational: true }];
        if (branchId) {
            orConditions.push({ branchId });
        }

        where.OR = orConditions;

        const holidays = await prisma.holiday.findMany({
            where,
            orderBy: { holidayDate: "asc" },
        });

        return success(holidays);
    }

    /**
     * Check if a date is a holiday
     */
    static async isHoliday(
        context: RequestContext,
        date: Date,
        branchId?: string
    ): Promise<ServiceResponse<boolean>> {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const holiday = await prisma.holiday.findFirst({
            where: {
                tenantId: context.tenantId,
                holidayDate: dateOnly,
                OR: [
                    { isNational: true },
                    ...(branchId ? [{ branchId }] : []),
                ],
            },
        });

        return success(!!holiday);
    }

    /**
     * Update holiday
     */
    static async update(
        context: RequestContext,
        id: string,
        data: UpdateHolidayData
    ): Promise<ServiceResponse<Holiday>> {
        // Only admin roles can update holidays
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk update holiday");
        }

        const existing = await prisma.holiday.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Holiday tidak ditemukan");
        }

        // Check for duplicate if changing date or branch
        if (data.holidayDate || data.branchId !== undefined) {
            const checkDate = data.holidayDate || existing.holidayDate;
            const checkBranch = data.branchId !== undefined ? data.branchId : existing.branchId;

            const duplicate = await prisma.holiday.findFirst({
                where: {
                    tenantId: context.tenantId,
                    branchId: checkBranch || null,
                    holidayDate: checkDate,
                    id: { not: id },
                },
            });

            if (duplicate) {
                return error(
                    ErrorCodes.ALREADY_EXISTS,
                    "Holiday sudah ada pada tanggal dan scope yang sama"
                );
            }
        }

        const updated = await prisma.holiday.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.holidayDate && { holidayDate: data.holidayDate }),
                ...(data.isNational !== undefined && { isNational: data.isNational }),
                ...(data.branchId !== undefined && { branchId: data.branchId }),
            },
        });

        return success(updated);
    }

    /**
     * Delete holiday
     */
    static async delete(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<boolean>> {
        // Only admin roles can delete holidays
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk delete holiday");
        }

        const existing = await prisma.holiday.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Holiday tidak ditemukan");
        }

        await prisma.holiday.delete({
            where: { id },
        });

        return success(true);
    }

    /**
     * Import bulk holidays (e.g., from national calendar)
     */
    static async bulkCreate(
        context: RequestContext,
        holidays: CreateHolidayData[]
    ): Promise<ServiceResponse<{ created: number; skipped: number }>> {
        // Only admin roles can bulk import
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk import holidays");
        }

        let created = 0;
        let skipped = 0;

        for (const holiday of holidays) {
            // Check if already exists
            const existing = await prisma.holiday.findFirst({
                where: {
                    tenantId: context.tenantId,
                    branchId: holiday.branchId || null,
                    holidayDate: holiday.holidayDate,
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            await prisma.holiday.create({
                data: withTenantData(context, {
                    name: holiday.name,
                    holidayDate: holiday.holidayDate,
                    isNational: holiday.isNational || false,
                    branchId: holiday.branchId,
                }),
            });

            created++;
        }

        return success({ created, skipped });
    }
}
