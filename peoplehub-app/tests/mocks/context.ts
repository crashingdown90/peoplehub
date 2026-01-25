// @ai:cl - Request context mocks for testing
import type { RequestContext } from "@/lib/tenant";

export const createMockContext = (overrides: Partial<RequestContext> = {}): RequestContext => ({
    tenantId: "tenant-123",
    userId: "user-123",
    employeeId: "employee-123",
    role: "EMPLOYEE",
    ...overrides,
});

export const adminContext = createMockContext({
    role: "SUPER_ADMIN",
    userId: "admin-user-123",
    employeeId: "admin-employee-123",
});

export const hrdContext = createMockContext({
    role: "HRD",
    userId: "hrd-user-123",
    employeeId: "hrd-employee-123",
});

export const managerContext = createMockContext({
    role: "MANAGER",
    userId: "manager-user-123",
    employeeId: "manager-employee-123",
});

export const financeContext = createMockContext({
    role: "FINANCE",
    userId: "finance-user-123",
    employeeId: "finance-employee-123",
});

export const employeeContext = createMockContext({
    role: "EMPLOYEE",
    userId: "employee-user-123",
    employeeId: "employee-123",
});

// Mock the tenant module
jest.mock("@/lib/tenant", () => ({
    withTenant: (context: RequestContext, where: Record<string, unknown>) => ({
        ...where,
        tenantId: context.tenantId,
    }),
}));
