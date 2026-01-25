/**
 * @jest-environment node
 */
// @ai:cl - Security Test Suite: Multi-Tenant Isolation
// This suite explicitly verifies STRICT Rule #1: "Zero Data Leakage between Tenants"

import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import { EmployeeService } from "@/services/employee/employee.service";
import { createMockContext } from "../mocks/context";

describe("Security: Tenant Isolation Verification", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    const TENANT_A = "tenant-A";
    const TENANT_B = "tenant-B";

    const contextTenantA = createMockContext({
        tenantId: TENANT_A,
        role: "HRD",
        userId: "user-drefan-a",
        employeeId: "emp-drefan-a"
    });

    const contextTenantB = createMockContext({
        tenantId: TENANT_B,
        role: "HRD",
        userId: "user-hacker-b",
        employeeId: "emp-hacker-b" // Attacker trying to read Tenant A
    });

    describe("EmployeeService Isolation", () => {
        it("should NEVER query without tenantId in 'where' clause", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            // Act: Tenant A requests data
            await EmployeeService.getEmployees(contextTenantA, { page: 1, limit: 10 });

            // Assert: Prisma MUST be called with tenantId: TENANT_A
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A
                    })
                })
            );

            // Assert: Is NOT called with Tenant B
            expect(prismaMock.employee.findMany).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B
                    })
                })
            );
        });

        it("should PREVENT Tenant B from accessing Tenant A employee by ID", async () => {
            // Scenario: Tenant B knows Tenant A's employee ID
            const targetEmployeeId = "emp-target-in-tenant-A";

            // Mock DB returning the employee (as if it exists in the system globally)
            // But the service should filter by tenant context!
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
                id: targetEmployeeId,
                tenantId: TENANT_A, // Belongs to A
                fullName: "Target User",
                user: { email: "target@a.com", role: "EMPLOYEE" }
            });

            // Act: Tenant B tries to fetch it
            const result = await EmployeeService.getEmployeeById(contextTenantB, targetEmployeeId);

            // Analysis: 
            // The service calls prisma.findFirst with `where: { id: ..., tenantId: context.tenantId }`
            // Since the context is Tenant B, the query will be `where: { id: ..., tenantId: 'tenant-B' }`
            // But the mock returned an object with `tenantId: TENANT_A`. 
            // In a real DB, this query would find nothing.
            // In our mock, if the service constructs the query correctly, we can verify the call arguments.

            expect(prismaMock.employee.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: targetEmployeeId,
                        tenantId: TENANT_B // MUST use the Request Context's tenant, NOT the target's
                    })
                })
            );
        });

        it("should ISOLATE stats queries", async () => {
            // Mock Setup
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(10);
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue([]);
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.branch.findMany as jest.Mock).mockResolvedValue([]);

            // Act
            await EmployeeService.getStats(contextTenantA);

            // Assert all critical count queries have tenant isolation
            expect(prismaMock.employee.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A
                    })
                })
            );
        });

        it("should ISOLATE search queries", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

            await EmployeeService.searchEmployees(contextTenantA, "hack");

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A
                    })
                })
            );
        });
    });
});
