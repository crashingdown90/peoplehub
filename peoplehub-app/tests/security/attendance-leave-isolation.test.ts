/**
 * @jest-environment node
 */
// @ai:cl - Security Test Suite: Attendance & Leave Multi-Tenant Isolation
// Expands tenant isolation verification to critical business modules

import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import { AttendanceService } from "@/services/attendance/attendance.service";
import { LeaveService } from "@/services/leave/leave.service";
import { createMockContext } from "../mocks/context";

describe("Security: Attendance Service Tenant Isolation", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    const TENANT_A = "tenant-A-kreatifindo";
    const TENANT_B = "tenant-B-violet";

    const contextTenantA = createMockContext({
        tenantId: TENANT_A,
        role: "EMPLOYEE",
        userId: "user-emp-a",
        employeeId: "emp-a",
    });

    const contextTenantB = createMockContext({
        tenantId: TENANT_B,
        role: "EMPLOYEE",
        userId: "user-emp-b",
        employeeId: "emp-b",
    });

    describe("AttendanceService.getHistory", () => {
        it("should ISOLATE history queries by tenantId", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);

            await AttendanceService.getHistory(contextTenantA, { page: 1, limit: 10 });

            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("should PREVENT cross-tenant history access even with explicit employeeId", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);

            // Tenant B tries to view Tenant A's employee
            await AttendanceService.getHistory(contextTenantB, {
                page: 1,
                limit: 10,
                employeeId: "emp-a", // Belongs to Tenant A
            });

            // Query MUST still use Tenant B's tenantId (will find no results in real DB)
            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B, // Request context's tenant
                    }),
                })
            );
        });
    });

    describe("AttendanceService.getSummary", () => {
        it("should ISOLATE summary queries", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);

            await AttendanceService.getSummary(
                contextTenantA,
                "emp-a",
                new Date("2026-01-01"),
                new Date("2026-01-31")
            );

            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });
});

describe("Security: Leave Service Tenant Isolation", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    const TENANT_A = "tenant-A-kreatifindo";
    const TENANT_B = "tenant-B-violet";

    const contextTenantA_HRD = createMockContext({
        tenantId: TENANT_A,
        role: "HRD",
        userId: "user-hrd-a",
        employeeId: "emp-hrd-a",
    });

    const contextTenantB_HRD = createMockContext({
        tenantId: TENANT_B,
        role: "HRD",
        userId: "user-hrd-b",
        employeeId: "emp-hrd-b",
    });

    describe("LeaveService.getRequests", () => {
        it("should ISOLATE leave request queries", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);

            await LeaveService.getRequests(contextTenantA_HRD, { page: 1, limit: 10 });

            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    describe("LeaveService.getBalances", () => {
        it("should ISOLATE balance queries", async () => {
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([]);

            await LeaveService.getBalances(contextTenantA_HRD);

            expect(prismaMock.leaveBalance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    describe("LeaveService.approveByHrd (Cross-Tenant Attempt)", () => {
        it("should PREVENT approving leave from another tenant", async () => {
            // Mock: Request exists globally but belongs to Tenant A
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                id: "leave-req-in-A",
                tenantId: TENANT_A,
                employeeId: "emp-a",
                status: "APPROVED_MANAGER",
                totalDays: 2,
                startDate: new Date("2026-02-01"),
                leaveTypeId: "type-annual",
            });

            // Tenant B HRD tries to approve it
            await LeaveService.approveByHrd(contextTenantB_HRD, "leave-req-in-A");

            // The query MUST use TENANT_B context (which would find null in real DB)
            expect(prismaMock.leaveRequest.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: "leave-req-in-A",
                        tenantId: TENANT_B, // CRITICAL: Uses context's tenant
                    }),
                })
            );
        });
    });

    describe("LeaveService.reject (Cross-Tenant Attempt)", () => {
        it("should PREVENT rejecting leave from another tenant", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            await LeaveService.reject(contextTenantB_HRD, "leave-req-in-A", "Not approved");

            expect(prismaMock.leaveRequest.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: "leave-req-in-A",
                        tenantId: TENANT_B,
                    }),
                })
            );
        });
    });
});
