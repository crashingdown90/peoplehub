// @ai:cl - Admin service - business logic layer for IT_OPS/SUPER_ADMIN
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
  DateRangeFilter,
} from "../types";
import { Prisma } from "@prisma/client";
import type { User, AuditLog, UserStatus, UserRole } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface UserFilter extends PaginationParams {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface UserWithEmployee extends User {
  employee?: {
    id: string;
    fullName: string;
    employeeNumber: string;
    departmentId: string | null;
    branchId: string | null;
  } | null;
}

export interface UpdateUserInput {
  status?: UserStatus;
  role?: UserRole;
}

export interface AuditLogFilter extends PaginationParams, DateRangeFilter {
  action?: string;
  objectType?: string;
  actorId?: string;
}

export interface AuditLogWithActor extends AuditLog {
  actor?: {
    email: string;
    employee?: {
      fullName: string;
    } | null;
  } | null;
}

export interface RegistrationFilter extends PaginationParams {
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class AdminService {
  // ==========================================
  // USERS
  // ==========================================

  /**
   * Get all users (IT_OPS/SUPER_ADMIN only)
   */
  static async getUsers(
    context: RequestContext,
    filter: UserFilter
  ): Promise<ServiceResponse<UserWithEmployee[]>> {
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke daftar pengguna");
    }

    const { status, role, search, page = 1, limit = 20 } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { employee: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeNumber: true,
              departmentId: true,
              branchId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Remove password hash from response
    const sanitizedUsers = users.map(({ passwordHash: _, ...user }) => user) as UserWithEmployee[];

    return paginated(sanitizedUsers, total, page, limit);
  }

  /**
   * Get single user by ID
   */
  static async getUserById(
    context: RequestContext,
    userId: string
  ): Promise<ServiceResponse<UserWithEmployee>> {
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const user = await prisma.user.findFirst({
      where: withTenant(context, { id: userId }),
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            departmentId: true,
            branchId: true,
          },
        },
      },
    });

    if (!user) {
      return error(ErrorCodes.NOT_FOUND, "Pengguna tidak ditemukan");
    }

    // Remove password hash
    const { passwordHash: _, ...sanitizedUser } = user;

    return success(sanitizedUser as UserWithEmployee);
  }

  /**
   * Update user (IT_OPS/SUPER_ADMIN only)
   */
  static async updateUser(
    context: RequestContext,
    userId: string,
    data: UpdateUserInput
  ): Promise<ServiceResponse<UserWithEmployee>> {
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengubah pengguna");
    }

    const existing = await prisma.user.findFirst({
      where: withTenant(context, { id: userId }),
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pengguna tidak ditemukan");
    }

    // Prevent modifying SUPER_ADMIN unless you are SUPER_ADMIN
    if (existing.role === "SUPER_ADMIN" && context.role !== "SUPER_ADMIN") {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengubah SUPER_ADMIN");
    }

    // Log the change
    await this.createAuditLog(context, {
      action: "UPDATE_USER",
      objectType: "User",
      objectId: userId,
      beforeData: { status: existing.status, role: existing.role },
      afterData: data as Record<string, unknown>,
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.role && { role: data.role }),
        updatedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            departmentId: true,
            branchId: true,
          },
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;

    return success(sanitizedUser as UserWithEmployee);
  }

  // ==========================================
  // REGISTRATIONS
  // ==========================================

  /**
   * Get pending registrations (HRD/IT_OPS/SUPER_ADMIN)
   */
  static async getRegistrations(
    context: RequestContext,
    filter: RegistrationFilter
  ): Promise<ServiceResponse<UserWithEmployee[]>> {
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke pendaftaran");
    }

    const { status = "PENDING", page = 1, limit = 20 } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      status,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeNumber: true,
              departmentId: true,
              branchId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map(({ passwordHash: _, ...user }) => user) as UserWithEmployee[];

    return paginated(sanitizedUsers, total, page, limit);
  }

  /**
   * Approve registration (HRD/SUPER_ADMIN)
   */
  static async approveRegistration(
    context: RequestContext,
    userId: string
  ): Promise<ServiceResponse<UserWithEmployee>> {
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk menyetujui pendaftaran");
    }

    const existing = await prisma.user.findFirst({
      where: {
        tenantId: context.tenantId,
        id: userId,
        status: "PENDING",
      },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pendaftaran tidak ditemukan atau sudah diproses");
    }

    await this.createAuditLog(context, {
      action: "APPROVE_REGISTRATION",
      objectType: "User",
      objectId: userId,
      beforeData: { status: existing.status },
      afterData: JSON.parse(JSON.stringify({ status: "APPROVED" })),
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "APPROVED",
        updatedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            departmentId: true,
            branchId: true,
          },
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;

    return success(sanitizedUser as UserWithEmployee);
  }

  /**
   * Reject registration (HRD/SUPER_ADMIN)
   */
  static async rejectRegistration(
    context: RequestContext,
    userId: string,
    reason?: string
  ): Promise<ServiceResponse<UserWithEmployee>> {
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk menolak pendaftaran");
    }

    const existing = await prisma.user.findFirst({
      where: {
        tenantId: context.tenantId,
        id: userId,
        status: "PENDING",
      },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pendaftaran tidak ditemukan atau sudah diproses");
    }

    await this.createAuditLog(context, {
      action: "REJECT_REGISTRATION",
      objectType: "User",
      objectId: userId,
      beforeData: { status: existing.status },
      afterData: JSON.parse(JSON.stringify({ status: "REJECTED", reason })),
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "REJECTED",
        updatedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            departmentId: true,
            branchId: true,
          },
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;

    return success(sanitizedUser as UserWithEmployee);
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  /**
   * Get audit logs (IT_OPS/SUPER_ADMIN only)
   */
  static async getAuditLogs(
    context: RequestContext,
    filter: AuditLogFilter
  ): Promise<ServiceResponse<AuditLogWithActor[]>> {
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke audit log");
    }

    const { action, objectType, actorId, startDate, endDate, page = 1, limit = 50 } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (action) where.action = action;
    if (objectType) where.objectType = objectType;
    if (actorId) where.actorId = actorId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Fetch actor details separately
    const actorIds = [...new Set(logs.filter((l) => l.actorId).map((l) => l.actorId!))];
    const actors =
      actorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: {
              id: true,
              email: true,
              employee: { select: { fullName: true } },
            },
          })
        : [];

    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const logsWithActors = logs.map((log) => ({
      ...log,
      actor: log.actorId ? actorMap.get(log.actorId) || null : null,
    })) as AuditLogWithActor[];

    return paginated(logsWithActors, total, page, limit);
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(
    context: RequestContext,
    data: {
      action: string;
      objectType: string;
      objectId?: string;
      beforeData?: Record<string, unknown>;
      afterData?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: data.action,
        objectType: data.objectType,
        objectId: data.objectId,
        beforeData: data.beforeData
          ? (data.beforeData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        afterData: data.afterData
          ? (data.afterData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
