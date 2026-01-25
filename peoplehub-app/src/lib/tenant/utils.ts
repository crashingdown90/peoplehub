// @ai:cl - Tenant isolation utilities for database queries
import type { RequestContext } from "./context";

/**
 * Get tenant filter for Prisma queries
 * Ensures tenant isolation in all database operations
 */
export function tenantFilter(context: RequestContext) {
  return {
    tenantId: context.tenantId,
  };
}

/**
 * Get tenant + employee filter for queries that need both
 */
export function employeeFilter(context: RequestContext, employeeId?: string) {
  return {
    tenantId: context.tenantId,
    employeeId: employeeId || context.employeeId,
  };
}

/**
 * Create tenant-aware where clause
 * Merges tenant filter with additional conditions
 */
export function withTenant<T extends object>(
  context: RequestContext,
  where: T
): T & { tenantId: string } {
  return {
    ...where,
    tenantId: context.tenantId,
  };
}

/**
 * Create data object with tenant ID for inserts
 */
export function withTenantData<T extends object>(
  context: RequestContext,
  data: T
): T & { tenantId: string } {
  return {
    ...data,
    tenantId: context.tenantId,
  };
}

/**
 * Get scope filter based on user role
 * - EMPLOYEE: own data only
 * - MANAGER: team data
 * - HRD/FINANCE/IT_OPS/SUPER_ADMIN: all tenant data
 */
export function scopeFilter(context: RequestContext, teamEmployeeIds?: string[]) {
  // Admin roles see all
  if (["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
    return {
      tenantId: context.tenantId,
    };
  }

  // Manager sees team
  if (context.role === "MANAGER" && teamEmployeeIds?.length) {
    return {
      tenantId: context.tenantId,
      employeeId: { in: teamEmployeeIds },
    };
  }

  // Employee sees only self
  return {
    tenantId: context.tenantId,
    employeeId: context.employeeId,
  };
}
