// @ai:cl - Request context mock for testing
import type { RequestContext } from "@/lib/tenant";

/**
 * Create a mock request context
 */
export function createMockContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: "tenant-123",
    userId: "user-123",
    employeeId: "employee-123",
    role: "EMPLOYEE",
    ...overrides,
  };
}

/**
 * Create a mock admin context
 */
export function createMockAdminContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: "tenant-123",
    userId: "admin-123",
    employeeId: "admin-employee-123",
    role: "SUPER_ADMIN",
    ...overrides,
  };
}

/**
 * Create a mock HRD context
 */
export function createMockHrdContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: "tenant-123",
    userId: "hrd-123",
    employeeId: "hrd-employee-123",
    role: "HRD",
    ...overrides,
  };
}

/**
 * Create a mock manager context
 */
export function createMockManagerContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    tenantId: "tenant-123",
    userId: "manager-123",
    employeeId: "manager-employee-123",
    role: "MANAGER",
    ...overrides,
  };
}
