/**
 * @jest-environment node
 */
// @ai:cl - Security Test Suite: Payroll & Document Multi-Tenant Isolation
// Verifies tenant protection for sensitive financial and document data

import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import { PayrollService } from "@/services/payroll/payroll.service";
import { createMockContext } from "../mocks/context";

describe("Security: Payroll Service Tenant Isolation", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    const TENANT_A = "tenant-A-kreatifindo";
    const TENANT_B = "tenant-B-violet";

    const contextTenantA_Finance = createMockContext({
        tenantId: TENANT_A,
        role: "FINANCE",
        userId: "user-finance-a",
        employeeId: "emp-finance-a",
    });

    const contextTenantB_Finance = createMockContext({
        tenantId: TENANT_B,
        role: "FINANCE",
        userId: "user-finance-b",
        employeeId: "emp-finance-b",
    });

    const contextTenantA_Employee = createMockContext({
        tenantId: TENANT_A,
        role: "EMPLOYEE",
        userId: "user-emp-a",
        employeeId: "emp-a",
    });

    describe("PayrollService.getPayslips", () => {
        it("should ISOLATE payslip list queries by tenantId", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

            await PayrollService.getPayslips(contextTenantA_Finance, { page: 1, limit: 10 });

            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("should PREVENT cross-tenant payslip access", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

            await PayrollService.getPayslips(contextTenantB_Finance, {
                page: 1,
                limit: 10,
                employeeId: "emp-a", // Employee from Tenant A
            });

            // Query MUST use Tenant B context
            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B,
                    }),
                })
            );
        });
    });

    describe("PayrollService.getPayslipById", () => {
        it("should ISOLATE single payslip queries", async () => {
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(null);

            await PayrollService.getPayslipById(contextTenantA_Finance, "payslip-xyz");

            expect(prismaMock.payslip.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: "payslip-xyz",
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("should PREVENT Tenant B from accessing Tenant A payslip", async () => {
            // Mock: Payslip exists globally but belongs to Tenant A
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue({
                id: "payslip-victim",
                tenantId: TENANT_A,
                employeeId: "emp-a",
                status: "PUBLISHED",
            });

            // Tenant B tries to access
            await PayrollService.getPayslipById(contextTenantB_Finance, "payslip-victim");

            // Query MUST use Tenant B context
            expect(prismaMock.payslip.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: "payslip-victim",
                        tenantId: TENANT_B, // CRITICAL: Must filter by request context
                    }),
                })
            );
        });
    });

    describe("PayrollService.publishPayslip (Cross-Tenant Attempt)", () => {
        it("should PREVENT publishing payslip from another tenant", async () => {
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(null);

            await PayrollService.publishPayslip(contextTenantB_Finance, "payslip-in-A");

            expect(prismaMock.payslip.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: "payslip-in-A",
                        tenantId: TENANT_B,
                    }),
                })
            );
        });
    });

    describe("PayrollService.bulkPublishPayslips", () => {
        it("should ISOLATE bulk operations", async () => {
            (prismaMock.payslip.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            await PayrollService.bulkPublishPayslips(contextTenantA_Finance, "2026-01");

            expect(prismaMock.payslip.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    describe("Employee Self-Service Access Control", () => {
        it("should limit employee to only their own payslips", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

            await PayrollService.getPayslips(contextTenantA_Employee, { page: 1, limit: 10 });

            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                        employeeId: "emp-a", // Employee can only see their own
                        status: "PUBLISHED", // And only published ones
                    }),
                })
            );
        });
    });
});
