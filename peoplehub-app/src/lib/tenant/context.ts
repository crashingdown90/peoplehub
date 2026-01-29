import { headers } from "next/headers";
import type { UserRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Request context extracted from middleware headers
 */
export interface RequestContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  employeeId?: string;
}

/**
 * Get request context from headers (set by middleware)
 * Returns null if not authenticated
 */
export async function getRequestContext(): Promise<RequestContext | null> {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const tenantId = headersList.get("x-tenant-id");
  const role = headersList.get("x-user-role") as UserRole | null;
  let employeeId = headersList.get("x-employee-id");

  if (!userId || !tenantId || !role) {
    return null;
  }

  // Fallback: If employeeId is missing in headers (e.g., token was issued before employee record was created),
  // try to fetch it from the database once, scoped to the user's tenant.
  if (!employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });
    if (employee) {
      employeeId = employee.id;
    }
  }

  return {
    userId,
    tenantId,
    role,
    employeeId: employeeId || undefined,
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<RequestContext> {
  const context = await getRequestContext();

  if (!context) {
    throw new Error("Authentication required");
  }

  return context;
}

/**
 * Require specific role(s) - throws if not authorized
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<RequestContext> {
  const context = await requireAuth();

  if (!allowedRoles.includes(context.role)) {
    throw new Error("Access denied: insufficient permissions");
  }

  return context;
}

/**
 * Check if context has required role
 */
export function hasRole(context: RequestContext, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(context.role);
}

/**
 * Check if user can access data for specific tenant
 * Super admin can access all tenants
 */
export function canAccessTenant(context: RequestContext, targetTenantId: string): boolean {
  if (context.role === "SUPER_ADMIN") {
    return true;
  }
  return context.tenantId === targetTenantId;
}

/**
 * Check if user can access data for specific employee
 * - User can access their own data
 * - Manager can access subordinates' data
 * - HRD/Finance/IT_OPS/Super Admin can access all within tenant
 */
export function canAccessEmployee(
  context: RequestContext,
  targetEmployeeId: string,
  isSubordinate: boolean = false
): boolean {
  // User can always access their own data
  if (context.employeeId === targetEmployeeId) {
    return true;
  }

  // Admin roles can access all employees in tenant
  if (["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
    return true;
  }

  // Manager can access subordinates
  if (context.role === "MANAGER" && isSubordinate) {
    return true;
  }

  return false;
}
