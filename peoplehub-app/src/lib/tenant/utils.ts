// @ai:cl - Tenant isolation utilities for database queries
import type { RequestContext } from "./context";

/**
 * Check if user is SUPER_ADMIN (can access all tenants)
 */
function isSuperAdmin(context: RequestContext): boolean {
  return context.role === "SUPER_ADMIN";
}

/**
 * Get tenant filter for Prisma queries
 * Ensures tenant isolation in all database operations
 * SUPER_ADMIN: No tenant filter (can see all tenants)
 */
export function tenantFilter(context: RequestContext): { tenantId?: string } {
  if (isSuperAdmin(context)) {
    return {}; // No filter for super admin
  }
  return {
    tenantId: context.tenantId,
  };
}

/**
 * Get tenant + employee filter for queries that need both
 * SUPER_ADMIN: No tenant filter (can see all tenants)
 */
export function employeeFilter(context: RequestContext, employeeId?: string) {
  const baseFilter: { tenantId?: string; employeeId?: string } = {
    employeeId: employeeId || context.employeeId,
  };

  if (!isSuperAdmin(context)) {
    baseFilter.tenantId = context.tenantId;
  }

  return baseFilter;
}

/**
 * Create tenant-aware where clause
 * Merges tenant filter with additional conditions
 * SUPER_ADMIN: No tenant filter added (can query all tenants)
 *
 * Note: For INSERT operations, use withTenantData() instead which always includes tenantId
 */
export function withTenant<T extends object>(
  context: RequestContext,
  where: T
): T & { tenantId?: string } {
  if (isSuperAdmin(context)) {
    return where as T & { tenantId?: string }; // No tenant filter for super admin
  }
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
 * - HRD/FINANCE/IT_OPS: all data within their tenant
 * - SUPER_ADMIN: all data across ALL tenants
 */
export function scopeFilter(context: RequestContext, teamEmployeeIds?: string[]) {
  // SUPER_ADMIN sees everything across all tenants
  if (isSuperAdmin(context)) {
    return {};
  }

  // Admin roles see all within tenant
  if (["HRD", "FINANCE", "IT_OPS"].includes(context.role)) {
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
