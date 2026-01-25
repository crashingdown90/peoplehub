// @ai:cl - Employee service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import { getCache, CacheKeys, CacheTags, CacheTTL } from "@/lib/cache";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
} from "../types";
import type { Employee, EmployeeStatus, EmploymentType, WorkMode } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface EmployeeFilter extends PaginationParams {
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  managerId?: string;
  search?: string;
}

export interface CreateEmployeeData {
  userId: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  employeeNumber: string;
  fullName: string;
  nik?: string;
  npwp?: string;
  bpjsKesehatan?: string;
  bpjsKetenagakerjaan?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  startDate: Date;
  endDate?: Date;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
}

export interface UpdateEmployeeData {
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  fullName?: string;
  nik?: string;
  npwp?: string;
  bpjsKesehatan?: string;
  bpjsKetenagakerjaan?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  endDate?: Date;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  status?: EmployeeStatus;
}

export interface EmployeeWithRelations extends Employee {
  user?: {
    email: string;
    role: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    fullName: string;
  };
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  permanent: number;
  contract: number;
  byDepartment: Array<{ name: string; count: number }>;
  byBranch: Array<{ name: string; count: number }>;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class EmployeeService {
  /**
   * Get employees with filters
   */
  static async getEmployees(
    context: RequestContext,
    filter: EmployeeFilter
  ): Promise<ServiceResponse<EmployeeWithRelations[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "fullName",
      sortOrder = "asc",
      branchId,
      departmentId,
      positionId,
      status,
      employmentType,
      workMode,
      managerId,
      search,
    } = filter;

    // Only HRD, IT_OPS, or Super Admin can list employees
    if (!["HRD", "IT_OPS", "SUPER_ADMIN", "MANAGER"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke data karyawan");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    // Manager can only see their subordinates
    if (context.role === "MANAGER") {
      where.managerId = context.employeeId;
    }

    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;
    if (positionId) where.positionId = positionId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (workMode) where.workMode = workMode;
    if (managerId) where.managerId = managerId;

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { email: true, role: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          department: {
            select: { id: true, name: true },
          },
          position: {
            select: { id: true, name: true },
          },
          manager: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return paginated(data as EmployeeWithRelations[], total, page, limit);
  }

  /**
   * Get single employee by ID (cached for own profile)
   */
  static async getEmployeeById(
    context: RequestContext,
    employeeId: string
  ): Promise<ServiceResponse<EmployeeWithRelations>> {
    const cache = getCache();
    const isOwnProfile = employeeId === context.employeeId;
    const cacheKey = CacheKeys.employee(context.tenantId, employeeId);

    // Only cache own profile lookups
    if (isOwnProfile) {
      const cached = await cache.get<EmployeeWithRelations>(cacheKey);
      if (cached) {
        return success(cached);
      }
    }

    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: employeeId }),
      include: {
        user: {
          select: { email: true, role: true, status: true, lastLoginAt: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        position: {
          select: { id: true, name: true, code: true, level: true },
        },
        manager: {
          select: { id: true, fullName: true, employeeNumber: true },
        },
        subordinates: {
          select: { id: true, fullName: true, employeeNumber: true },
        },
      },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // Check access
    const canAccess =
      ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role) ||
      employee.id === context.employeeId ||
      employee.managerId === context.employeeId;

    if (!canAccess) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke data karyawan ini");
    }

    // Cache own profile for 5 minutes
    if (isOwnProfile) {
      await cache.set(cacheKey, employee, {
        ttl: CacheTTL.MEDIUM,
        tags: [CacheTags.employee(context.tenantId)],
      });
    }

    return success(employee as EmployeeWithRelations);
  }

  /**
   * Get current user's employee profile
   */
  static async getMyProfile(
    context: RequestContext
  ): Promise<ServiceResponse<EmployeeWithRelations>> {
    if (!context.employeeId) {
      return error(ErrorCodes.NOT_FOUND, "Profile karyawan tidak ditemukan");
    }

    return this.getEmployeeById(context, context.employeeId);
  }

  /**
   * Create new employee
   */
  static async createEmployee(
    context: RequestContext,
    data: CreateEmployeeData
  ): Promise<ServiceResponse<Employee>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat karyawan");
    }

    // Check if employee number already exists
    const existingNumber = await prisma.employee.findFirst({
      where: withTenant(context, { employeeNumber: data.employeeNumber }),
    });

    if (existingNumber) {
      return error(ErrorCodes.ALREADY_EXISTS, "Nomor karyawan sudah digunakan");
    }

    // Check if user already has employee profile
    const existingUser = await prisma.employee.findFirst({
      where: withTenant(context, { userId: data.userId }),
    });

    if (existingUser) {
      return error(ErrorCodes.ALREADY_EXISTS, "User sudah memiliki profile karyawan");
    }

    const employee = await prisma.employee.create({
      data: {
        tenantId: context.tenantId,
        ...data,
      },
    });

    return success(employee);
  }

  /**
   * Update employee
   */
  static async updateEmployee(
    context: RequestContext,
    employeeId: string,
    data: UpdateEmployeeData
  ): Promise<ServiceResponse<Employee>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengubah data karyawan");
    }

    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: employeeId }),
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await this.invalidateEmployeeCache(context.tenantId, employeeId);

    return success(updated);
  }

  /**
   * Terminate employee
   */
  static async terminateEmployee(
    context: RequestContext,
    employeeId: string,
    endDate: Date
  ): Promise<ServiceResponse<Employee>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk terminate karyawan");
    }

    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: employeeId }),
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    if (employee.status === "TERMINATED") {
      return error(ErrorCodes.CONFLICT, "Karyawan sudah di-terminate");
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: "TERMINATED",
        endDate,
        updatedAt: new Date(),
      },
    });

    // Also update user status
    await prisma.user.update({
      where: { id: employee.userId },
      data: { status: "SUSPENDED" },
    });

    // Invalidate cache
    await this.invalidateEmployeeCache(context.tenantId, employeeId);

    return success(updated);
  }

  /**
   * Get subordinates of a manager
   */
  static async getSubordinates(
    context: RequestContext,
    managerId?: string
  ): Promise<ServiceResponse<Employee[]>> {
    const effectiveManagerId = managerId || context.employeeId;

    if (!effectiveManagerId) {
      return error(ErrorCodes.NOT_FOUND, "Manager ID tidak valid");
    }

    // Only the manager themselves, HRD, or admin can see subordinates
    if (
      managerId &&
      managerId !== context.employeeId &&
      !["HRD", "SUPER_ADMIN"].includes(context.role)
    ) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: effectiveManagerId,
        status: "ACTIVE" as EmployeeStatus,
      },
      include: {
        position: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return success(subordinates);
  }

  /**
   * Get employee statistics
   */
  static async getStats(context: RequestContext): Promise<ServiceResponse<EmployeeStats>> {
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke statistik karyawan");
    }

    const [
      total,
      active,
      inactive,
      permanent,
      contract,
      byDepartment,
      byBranch,
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId: context.tenantId } }),
      prisma.employee.count({ where: { tenantId: context.tenantId, status: "ACTIVE" } }),
      prisma.employee.count({ where: { tenantId: context.tenantId, status: "INACTIVE" } }),
      prisma.employee.count({
        where: { tenantId: context.tenantId, employmentType: "PERMANENT", status: "ACTIVE" },
      }),
      prisma.employee.count({
        where: { tenantId: context.tenantId, employmentType: "CONTRACT", status: "ACTIVE" },
      }),
      prisma.employee.groupBy({
        by: ["departmentId"],
        where: { tenantId: context.tenantId, status: "ACTIVE" },
        _count: { id: true },
      }),
      prisma.employee.groupBy({
        by: ["branchId"],
        where: { tenantId: context.tenantId, status: "ACTIVE" },
        _count: { id: true },
      }),
    ]);

    // Get department and branch names
    const departmentIds = byDepartment.map((d) => d.departmentId).filter(Boolean) as string[];
    const branchIds = byBranch.map((b) => b.branchId).filter(Boolean) as string[];

    const [departments, branches] = await Promise.all([
      prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true, name: true },
      }),
      prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      }),
    ]);

    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    return success({
      total,
      active,
      inactive,
      permanent,
      contract,
      byDepartment: byDepartment.map((d) => ({
        name: d.departmentId ? departmentMap.get(d.departmentId) || "Unknown" : "No Department",
        count: d._count.id,
      })),
      byBranch: byBranch.map((b) => ({
        name: b.branchId ? branchMap.get(b.branchId) || "Unknown" : "No Branch",
        count: b._count.id,
      })),
    });
  }

  /**
   * Search employees by name or number
   */
  static async searchEmployees(
    context: RequestContext,
    query: string,
    limit: number = 10
  ): Promise<ServiceResponse<Employee[]>> {
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE" as EmployeeStatus,
        OR: [
          { fullName: { contains: query, mode: "insensitive" as const } },
          { employeeNumber: { contains: query, mode: "insensitive" as const } },
        ],
      },
      take: limit,
      select: {
        id: true,
        tenantId: true,
        userId: true,
        branchId: true,
        departmentId: true,
        positionId: true,
        managerId: true,
        employeeNumber: true,
        fullName: true,
        nik: true,
        npwp: true,
        bpjsKesehatan: true,
        bpjsKetenagakerjaan: true,
        employmentType: true,
        workMode: true,
        startDate: true,
        endDate: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        bankBranch: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { fullName: "asc" },
    });

    return success(employees as Employee[]);
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  /**
   * Invalidate employee cache
   */
  private static async invalidateEmployeeCache(
    tenantId: string,
    employeeId: string
  ): Promise<void> {
    const cache = getCache();
    await cache.delete(CacheKeys.employee(tenantId, employeeId));
  }

  /**
   * Invalidate all employee caches for a tenant
   */
  static async invalidateTenantCache(tenantId: string): Promise<void> {
    const cache = getCache();
    await cache.invalidateByTag(CacheTags.employee(tenantId));
  }
}
